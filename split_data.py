#!/usr/bin/env python
"""
split_data.py — Split people.json into core.json + 12 detail chunk files.

Run:  python split_data.py

Reads:  people.json
Writes: data/islamic/core.json
        data/islamic/details/<chunk>.json  (12 files)

The getChunkName() logic here MUST match the JavaScript version in index.html.
"""

import json, os, sys
from collections import Counter

SRC  = os.path.join(os.path.dirname(__file__), "people.json")
OUT  = os.path.join(os.path.dirname(__file__), "data", "islamic")
DET  = os.path.join(OUT, "details")

# ── Fields ──────────────────────────────────────────────────
CORE_FIELDS = [
    "famous", "full", "tradition", "type", "primaryTitle",
    "dob", "dod", "dob_s", "dod_s", "city",
    "classif", "lang", "titles", "source",
    "lat", "lng", "teachers",
    "birth_date_hijri", "death_date_hijri",
    "quranRef", "_dobFromDod", "death_reason", "places_of_stay",
]

DETAIL_FIELDS = ["famous", "school", "books", "parents", "children", "spouses"]

# ── Sufi order traditions that go into the sufis-orders chunk ──
SUFI_ORDER_TRADITIONS = {
    "Naqshbandiyya", "Shadhiliyya", "Qadiriyya", "Chishti",
    "Suhrawardiyya", "Mawlawiyya", "Qalandari", "Yeseviyya",
    "Kubrawiyya", "Badawiyya", "Burhaniyya", "Akbarian",
    "Ishraqiyya", "Sindhi/Punjabi Sufism",
}

# ── Chunk assignment (must match JS getChunkName) ──
def get_chunk_name(p):
    t = p.get("type", "")
    tr = p.get("tradition", "")

    # Lineage: Prophets + Founders (Adam→Muhammad genealogical chain)
    if t in ("Prophet", "Founder"):
        return "lineage"
    if t == "Sahaba":
        return "sahaba"
    if t == "Sahabiyya":
        return "sahabiyya"
    if t == "Tabi'un":
        return "tabiun"
    if t == "Ruler" or t == "Caliph":
        return "rulers"
    if t == "Poet":
        return "poets"
    if t == "Philosopher":
        return "philosophy"
    if t == "Scientist":
        return "sciences"
    # Mystics: split by tradition
    if t == "Mystic":
        if tr in SUFI_ORDER_TRADITIONS:
            return "sufis-orders"
        return "sufis-early"
    # Hadith scholars
    if tr == "Hadith Sciences":
        return "hadith"
    # Early ascetics tradition (non-Mystic, non-Sahaba, etc.)
    if tr == "Early Ascetics":
        return "sufis-early"
    # Khorasan / Baghdad schools
    if tr in ("Khorasan School", "Baghdad School"):
        return "sufis-early"
    # Remaining scholars, jurists, historians, reformers, etc.
    return "scholars"


def main():
    with open(SRC, encoding="utf-8") as f:
        people = json.load(f)

    print(f"Loaded {len(people)} figures from people.json")

    # Build core records (only fields that exist on each person)
    core = []
    for p in people:
        rec = {k: p[k] for k in CORE_FIELDS if k in p}
        core.append(rec)

    # Build detail chunks
    chunks = {}
    for p in people:
        chunk = get_chunk_name(p)
        if chunk not in chunks:
            chunks[chunk] = []
        rec = {k: p[k] for k in DETAIL_FIELDS if k in p}
        chunks[chunk].append(rec)

    # Write output
    os.makedirs(DET, exist_ok=True)

    core_path = os.path.join(OUT, "core.json")
    with open(core_path, "w", encoding="utf-8") as f:
        json.dump(core, f, ensure_ascii=False)
    print(f"  core.json  -> {len(core)} records, {os.path.getsize(core_path):,} bytes")

    for name, records in sorted(chunks.items()):
        path = os.path.join(DET, f"{name}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False)
        print(f"  details/{name}.json -> {len(records)} records, {os.path.getsize(path):,} bytes")

    total_detail = sum(os.path.getsize(os.path.join(DET, f"{n}.json")) for n in chunks)
    print(f"\nTotal: {len(people)} figures -> core ({os.path.getsize(core_path):,} B) + {len(chunks)} chunks ({total_detail:,} B)")
    print(f"Original people.json: {os.path.getsize(SRC):,} bytes")
    print(f"Split total: {os.path.getsize(core_path) + total_detail:,} bytes")


if __name__ == "__main__":
    main()
