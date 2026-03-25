#!/usr/bin/env python3
"""
apply_relations.py
──────────────────
Adds a `relations` field to every entry in core.json.
Relations are derived from two sources:
  1. Programmatic  – parsed from 'famous' name (ibn/bint patterns)
  2. Manual curated – family/personal relations from historical sources

Usage:
    python3 apply_relations.py core.json output.json
    python3 apply_relations.py core.json            # overwrites in-place

Output format per entry:
    "relations": [
        {"person": "Khadijah bint Khuwaylid", "relation": "wife"},
        ...
    ]
"""

import json
import re
import sys
from collections import defaultdict

# ──────────────────────────────────────────────────────────────────────────────
# KNOWN DATASET DUPLICATES  (entries that appear twice under different names)
# The script will apply relations to BOTH entries for each duplicate pair.
# ──────────────────────────────────────────────────────────────────────────────
KNOWN_DUPLICATES = [
    ("Yusuf al-Hamadani",        "Yusuf Hamadani"),
    ("Khwaja Ubaydullah Ahrar",  "Khwaja Ahrar"),
    ("Shah Ghulam Ali",          "Shah Ghulam Ali Dehlavi"),
    ("Sidi Ahmad ibn Idris",     "Ahmad ibn Idris"),
    ("Muawiya ibn Abi Sufyan",   "Mu'awiya I"),
    ("Khadija bint Khuwaylid",   "Khadijah bint Khuwaylid"),
    ("Abd al-Salam ibn Mashish", "Ibn Mashish"),
    ("Ahmad Zarruq",             "Shaykh Zarruq"),
    ("Muhammad al-Sanusi",       "Muhammad ibn Ali al-Sanusi"),
    ("Umm Habibah",              "Umm Habibah bint Abi Sufyan"),
]

# ──────────────────────────────────────────────────────────────────────────────
# INVERSE RELATION MAP
# When we record A -> relation -> B, we also record B -> inverse -> A
# ──────────────────────────────────────────────────────────────────────────────
INVERSE = {
    "wife":         "husband",
    "husband":      "wife",
    "son":          "father",
    "daughter":     "parent",   # use generic; father/mother both map here
    "father":       "child",
    "mother":       "child",
    "child":        "parent",
    "parent":       "child",
    "brother":      "sibling",
    "sister":       "sibling",
    "sibling":      "sibling",
    "half-brother": "half-sibling",
    "half-sister":  "half-sibling",
    "half-sibling": "half-sibling",
    "uncle":        "nephew/niece",
    "aunt":         "nephew/niece",
    "nephew":       "uncle/aunt",
    "niece":        "uncle/aunt",
    "nephew/niece": "uncle/aunt",
    "uncle/aunt":   "nephew/niece",
    "cousin":       "cousin",
    "grandfather":  "grandchild",
    "grandmother":  "grandchild",
    "grandson":     "grandparent",
    "granddaughter":"grandparent",
    "grandchild":   "grandparent",
    "grandparent":  "grandchild",
    "ancestor":     "descendant",
    "descendant":   "ancestor",
    "foster-brother":"foster-brother",
    "foster-sister": "foster-sister",
}

# ──────────────────────────────────────────────────────────────────────────────
# MANUALLY CURATED RELATIONS
# Source: Islamic genealogical works (Tabari, Ibn Hisham, Ibn Kathir, Ibn Sa'd),
#         cross-checked with the Gemini prosopographical report.
# Format: (person_A_famous, relation_of_A_to_B, person_B_famous)
# ──────────────────────────────────────────────────────────────────────────────
MANUAL_RELATIONS = [

    # ── PROPHET MUHAMMAD – WIVES (Ummahāt al-Mu'minīn) ──────────────────────
    ("Prophet Muhammad", "wife", "Khadijah bint Khuwaylid"),
    ("Prophet Muhammad", "wife", "Aisha bint Abi Bakr"),
    ("Prophet Muhammad", "wife", "Hafsa bint Umar"),
    ("Prophet Muhammad", "wife", "Umm Habibah"),
    ("Prophet Muhammad", "wife", "Umm Habibah bint Abi Sufyan"),   # duplicate entry
    ("Prophet Muhammad", "wife", "Zaynab bint Jahsh"),
    ("Prophet Muhammad", "wife", "Safiyya bint Huyayy"),
    ("Prophet Muhammad", "wife", "Juwayriya bint al-Harith"),
    ("Prophet Muhammad", "wife", "Maymuna bint al-Harith"),
    ("Prophet Muhammad", "wife", "Umm Salamah"),
    ("Prophet Muhammad", "wife", "Sawda bint Zama'a"),
    ("Prophet Muhammad", "wife", "Zaynab bint Khuzayma"),

    # ── PROPHET MUHAMMAD – DAUGHTERS ────────────────────────────────────────
    ("Prophet Muhammad", "daughter", "Fatimah al-Zahra"),
    ("Prophet Muhammad", "daughter", "Zaynab bint Muhammad"),
    ("Prophet Muhammad", "daughter", "Ruqayya bint Muhammad"),
    ("Prophet Muhammad", "daughter", "Umm Kulthum bint Muhammad"),

    # ── PROPHET MUHAMMAD – PATERNAL UNCLES ──────────────────────────────────
    ("Prophet Muhammad", "uncle", "Abbas ibn Abd al-Muttalib"),
    ("Prophet Muhammad", "uncle", "Hamza ibn Abd al-Muttalib"),

    # ── PROPHET MUHAMMAD – COUSINS / KIN ────────────────────────────────────
    ("Prophet Muhammad", "cousin", "Ali ibn Abi Talib"),
    ("Prophet Muhammad", "cousin", "Jafar ibn Abi Talib"),
    ("Prophet Muhammad", "cousin", "Aqeel ibn Abi Talib"),
    ("Prophet Muhammad", "cousin", "Abdullah ibn Abbas"),

    # ── ALI IBN ABI TALIB – IMMEDIATE FAMILY ────────────────────────────────
    ("Ali ibn Abi Talib", "wife",     "Fatimah al-Zahra"),
    ("Ali ibn Abi Talib", "son",      "Hasan ibn Ali"),
    ("Ali ibn Abi Talib", "son",      "Husayn ibn Ali"),
    ("Ali ibn Abi Talib", "daughter", "Zaynab bint Ali"),
    ("Ali ibn Abi Talib", "daughter", "Umm Kulthum bint Ali"),
    ("Ali ibn Abi Talib", "son",      "Muhammad ibn al-Hanafiyya"),
    ("Ali ibn Abi Talib", "brother",  "Jafar ibn Abi Talib"),
    ("Ali ibn Abi Talib", "brother",  "Aqeel ibn Abi Talib"),

    # ── HASAN / HUSAYN LINE ──────────────────────────────────────────────────
    ("Hasan ibn Ali",     "brother",  "Husayn ibn Ali"),
    ("Hasan ibn Ali",     "daughter", "Nafisa bint al-Hasan"),
    ("Husayn ibn Ali",    "son",      "Ali ibn al-Husayn"),
    ("Ali ibn al-Husayn", "son",      "Muhammad al-Baqir"),
    ("Ali ibn al-Husayn", "son",      "Zayd ibn Ali"),
    ("Muhammad al-Baqir", "son",      "Ja'far al-Sadiq"),

    # ── ABU BAKR AL-SIDDIQ FAMILY ────────────────────────────────────────────
    ("Abu Bakr al-Siddiq", "daughter", "Aisha bint Abi Bakr"),
    ("Abu Bakr al-Siddiq", "daughter", "Asma bint Abi Bakr"),
    ("Aisha bint Abi Bakr", "sister",  "Asma bint Abi Bakr"),

    # ── UMAR IBN AL-KHATTAB FAMILY ──────────────────────────────────────────
    ("Umar ibn al-Khattab", "daughter", "Hafsa bint Umar"),
    ("Umar ibn al-Khattab", "son",      "Abd Allah ibn Umar"),
    ("Umar ibn al-Khattab", "son",      "ibn Umar"),        # second entry for same person
    ("Umar ibn al-Khattab", "brother",  "Zayd ibn al-Khattab"),

    # ── UTHMAN IBN AFFAN FAMILY / MARRIAGES ─────────────────────────────────
    ("Uthman ibn Affan", "wife", "Ruqayya bint Muhammad"),
    ("Uthman ibn Affan", "wife", "Umm Kulthum bint Muhammad"),
    ("Uthman ibn Affan", "wife", "Na'ilah bint al-Furafisah"),

    # ── MUAWIYA / UMAYYA BRANCH ─────────────────────────────────────────────
    ("Muawiya ibn Abi Sufyan", "son",    "Yazid I"),
    ("Muawiya ibn Abi Sufyan", "sister", "Umm Habibah"),
    ("Muawiya ibn Abi Sufyan", "sister", "Umm Habibah bint Abi Sufyan"),
    ("Mu'awiya I",             "son",    "Yazid I"),           # duplicate entry
    ("Mu'awiya I",             "sister", "Umm Habibah"),
    ("Mu'awiya I",             "sister", "Umm Habibah bint Abi Sufyan"),
    ("Abd al-Malik ibn Marwan","son",    "Al-Walid I"),
    ("Abd al-Malik ibn Marwan","nephew", "Umar ibn Abd al-Aziz"),

    # ── ZUBAYR IBN AL-AWWAM FAMILY ──────────────────────────────────────────
    ("Zubayr ibn al-Awwam",  "wife",    "Asma bint Abi Bakr"),
    ("Zubayr ibn al-Awwam",  "son",     "Abdullah ibn al-Zubayr"),
    ("Zubayr ibn al-Awwam",  "son",     "Urwa ibn al-Zubayr"),
    ("Abdullah ibn al-Zubayr","brother","Urwa ibn al-Zubayr"),
    ("Aisha bint Abi Bakr",  "aunt",    "Urwa ibn al-Zubayr"),   # Urwa's mother Asma is Aisha's sister

    # ── SONS OF ABD AL-MUTTALIB (Prophet's uncles — mutual siblings) ─────────
    ("Abbas ibn Abd al-Muttalib",   "brother", "Hamza ibn Abd al-Muttalib"),
    ("Abbas ibn Abd al-Muttalib",   "brother", "Abdullah ibn Abd al-Muttalib"),
    ("Hamza ibn Abd al-Muttalib",   "brother", "Abdullah ibn Abd al-Muttalib"),

    # ── ABBASID CALIPHS ──────────────────────────────────────────────────────
    ("Harun al-Rashid",  "son", "Ma'mun al-Rashid"),

    # ── PROPHETS – FATHER/SON NOT CAUGHT BY PATTERN SCRIPT ──────────────────
    # (famous names lack 'ibn X' linking to parent)
    ("Ibrahim",   "son",          "Ismail"),
    ("Ibrahim",   "son",          "Ishaq"),
    ("Ismail",    "half-brother", "Ishaq"),
    ("Ishaq",     "son",          "Yaqub"),
    ("Yaqub",     "son",          "Yusuf"),
    ("Musa",      "brother",      "Harun"),
    ("Dawud",     "son",          "Sulayman"),
    ("Zakariyya", "son",          "Yahya"),

    # ── TABI'UN FAMILY ───────────────────────────────────────────────────────
    ("Ibn Sirin",             "brother",  "Hafsa bint Sirin"),
    ("Talha ibn Ubayd Allah", "daughter", "Aisha bint Talha"),
    ("Abd al-Rahman ibn Awf", "son",      "Abu Salamah ibn Abd al-Rahman"),

    # ── SUFI ORDER FAMILY RELATIONS ──────────────────────────────────────────
    ("Al-Ghazali",              "brother", "Ahmad Ghazali"),
    ("Baha ud-Din Walad",       "son",     "Jalal ad-Din Rumi"),
    ("Jalal ad-Din Rumi",       "son",     "Sultan Walad"),
    ("Abu Najib Suhrawardi",    "nephew",  "Shihab al-Din al-Suhrawardi"),
    ("Sari al-Saqati",          "uncle",   "Junayd of Baghdad"),  # maternal uncle & teacher

    # ── MUGHAL DYNASTY (father-son chain + spouse) ───────────────────────────
    ("Babur",          "son",      "Humayun"),
    ("Humayun",        "son",      "Akbar the Great"),
    ("Akbar the Great","son",      "Jahangir I"),
    ("Jahangir I",     "wife",     "Nur Jahan"),
    ("Jahangir I",     "son",      "Shah Jahan"),
    ("Shah Jahan",     "son",      "Aurangzeb"),
    ("Shah Jahan",     "son",      "Dara Shikoh"),
    ("Aurangzeb",      "daughter", "Zeb-un-Nissa"),

    # ── OTTOMAN DYNASTY (father-son chain) ───────────────────────────────────
    ("Murad II",              "son", "Mehmed II"),
    ("Mehmed II",             "son", "Bayezid II"),
    ("Bayezid II",            "son", "Selim I"),
    ("Selim I",               "son", "Suleiman the Magnificent"),

    # ── REFORMERS / SCHOLARS FAMILY ──────────────────────────────────────────
    ("Usman dan Fodio",     "daughter", "Nana Asma'u"),
    ("Usman dan Fodio",     "son",      "Muhammadu Bello"),
    ("Nana Asma'u",         "brother",  "Muhammadu Bello"),
    ("Shah Waliullah",      "son",      "Shah Abdul Aziz Dehlawi"),

]

# Remove the erroneous Abu Bakr/Umm Farwa entry (she's his sister, not daughter)
MANUAL_RELATIONS = [
    r for r in MANUAL_RELATIONS
    if not (r[0] == "Abu Bakr al-Siddiq" and r[2] == "Umm Farwa bint Abi Quhafa")
]


# ──────────────────────────────────────────────────────────────────────────────
# PROGRAMMATIC HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def get_father_from_famous(famous: str):
    """Extract the father's name fragment from 'Name ibn Father' patterns."""
    m = re.search(r'\b(?:ibn|bint)\s+(.+)$', famous, re.IGNORECASE)
    return m.group(1).strip() if m else None


def build_index(data):
    """Build exact and prefix lookup tables."""
    exact = {d['famous']: i for i, d in enumerate(data)}
    return exact


def find_person(fragment: str, exact: dict, names: list):
    """Return exact famous name match or unambiguous prefix match."""
    if not fragment:
        return None
    if fragment in exact:
        return fragment
    low = fragment.lower()
    matches = [fn for fn in names if fn.lower() == low]
    if len(matches) == 1:
        return matches[0]
    matches = [fn for fn in names if fn.lower().startswith(low)]
    if len(matches) == 1:
        return matches[0]
    return None


def derive_programmatic(data, exact, names):
    """Derive parent-child relations from ibn/bint name patterns."""
    parent_of = {}
    for d in data:
        frag = get_father_from_famous(d['famous'])
        father = find_person(frag, exact, names)
        if father and father != d['famous']:
            parent_of[d['famous']] = father
    return parent_of


# ──────────────────────────────────────────────────────────────────────────────
# RELATION BUILDER
# ──────────────────────────────────────────────────────────────────────────────

def build_all_relations(data):
    exact  = build_index(data)
    names  = list(exact.keys())

    # Storage: famous_name -> set of (person, relation)
    rel_map = defaultdict(set)

    def add(a, rel, b):
        if a in exact and b in exact and a != b:
            rel_map[a].add((b, rel))
            inv = INVERSE.get(rel, "related-to")
            rel_map[b].add((a, inv))

    # ── 1. Programmatic parent-child ─────────────────────────────────────────
    parent_of = derive_programmatic(data, exact, names)
    for child, father in parent_of.items():
        add(child, "father", father)

    # ── 2. Programmatic siblings (same father) ───────────────────────────────
    children_of = defaultdict(list)
    for child, father in parent_of.items():
        children_of[father].append(child)
    for father, children in children_of.items():
        if len(children) > 1:
            for i, s1 in enumerate(children):
                for s2 in children[i + 1:]:
                    add(s1, "sibling", s2)

    # ── 3. Manual curated relations ──────────────────────────────────────────
    unresolved = []
    for a, rel, b in MANUAL_RELATIONS:
        if a not in exact:
            unresolved.append(f"NOT FOUND: '{a}'")
            continue
        if b not in exact:
            unresolved.append(f"NOT FOUND: '{b}'")
            continue
        add(a, rel, b)

    # ── 4. Propagate relations to duplicate entries ──────────────────────────
    for name_a, name_b in KNOWN_DUPLICATES:
        if name_a in exact and name_b in exact:
            # Share relations between the two duplicate entries
            for person, rel in list(rel_map[name_a]):
                rel_map[name_b].add((person, rel))
            for person, rel in list(rel_map[name_b]):
                rel_map[name_a].add((person, rel))

    return rel_map, unresolved


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 apply_relations.py <input.json> [output.json]")
        sys.exit(1)

    input_path  = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path

    print(f"Loading {input_path} …")
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)
    print(f"  {len(data)} entries loaded.")

    print("Building relations …")
    rel_map, unresolved = build_all_relations(data)

    if unresolved:
        print(f"\n  ⚠ Unresolved names ({len(unresolved)}):")
        for u in unresolved:
            print(f"    {u}")

    # Inject relations into each entry
    total_added   = 0
    people_updated = 0
    for entry in data:
        name = entry["famous"]
        rels = rel_map.get(name, set())
        # Sort for deterministic output: by relation type then person name
        sorted_rels = sorted(rels, key=lambda x: (x[1], x[0]))
        entry["relations"] = [{"person": p, "relation": r} for p, r in sorted_rels]
        if sorted_rels:
            people_updated += 1
            total_added    += len(sorted_rels)

    print(f"\n  ✓ People with ≥1 relation : {people_updated}")
    print(f"  ✓ Total relation records  : {total_added}")
    print(f"  ✓ People with no relations: {len(data) - people_updated}")

    print(f"\nWriting {output_path} …")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    import os
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"  Done. Output size: {size_mb:.2f} MB")

    # ── Summary by relation type ─────────────────────────────────────────────
    from collections import Counter
    type_count = Counter()
    for rels in rel_map.values():
        for _, rel in rels:
            type_count[rel] += 1
    print("\nRelation type breakdown:")
    for rel, count in sorted(type_count.items(), key=lambda x: -x[1]):
        print(f"  {rel:<20} {count:>5}")


if __name__ == "__main__":
    main()
