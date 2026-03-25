#!/usr/bin/env python
"""
add_free_books.py — Add free book links to details/*.json files.

For each figure listed in BOOKS_TO_ADD, looks up the correct details chunk
via core.json (to get type/tradition) and the same get_chunk_name() logic
used by split_data.py, then appends the books to that figure's record.

Run:  python add_free_books.py
"""

import json, os, sys
from collections import defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
CORE = os.path.join(BASE, "data", "islamic", "core.json")
DET  = os.path.join(BASE, "data", "islamic", "details")

# ── Chunk assignment (copied from split_data.py) ──
SUFI_ORDER_TRADITIONS = {
    "Naqshbandiyya", "Shadhiliyya", "Qadiriyya", "Chishti",
    "Suhrawardiyya", "Mawlawiyya", "Qalandari", "Yeseviyya",
    "Kubrawiyya", "Badawiyya", "Burhaniyya", "Akbarian",
    "Ishraqiyya", "Sindhi/Punjabi Sufism",
}

def get_chunk_name(p):
    t  = p.get("type", "")
    tr = p.get("tradition", "")
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
    if t == "Mystic":
        return "sufis-orders" if tr in SUFI_ORDER_TRADITIONS else "sufis-early"
    if tr == "Hadith Sciences":
        return "hadith"
    if tr in ("Early Ascetics", "Khorasan School", "Baghdad School"):
        return "sufis-early"
    return "scholars"

# ── Books to add ──
BOOKS_TO_ADD = {
    "Ibn Khaldun": [
        {"title": "The Muqaddimah (English)", "url": "https://archive.org/details/muqaddimahintrod0000ibnk", "note": "Foundational work on sociology, history and philosophy of history"},
        {"title": "Al-Muqaddimah (Arabic)", "url": "https://archive.org/details/almuqaddimah00ibnk", "note": "1904 Arabic edition"},
    ],
    "Ibn Battuta": [
        {"title": "The Travels of Ibn Battuta (4 vols)", "url": "https://archive.org/details/travels-of-ibn-battuta", "note": "Complete Gibb English translation of the Rihla"},
    ],
    "Al-Ghazali": [
        {"title": "Ihya Ulum al-Din (Revival of the Religious Sciences)", "url": "https://archive.org/details/IhyaUlumAlDinVol1", "note": "Magnum opus on Islamic ethics and Sufism — English"},
        {"title": "The Alchemy of Happiness (Kimiya-yi Sa'adat)", "url": "https://archive.org/details/alchemyhappiness00ghaz", "note": "Persian condensation of the Ihya — English translation"},
        {"title": "Incoherence of the Philosophers", "url": "https://archive.org/details/incoherenceofphi0000ghaz", "note": "Critique of Aristotelian philosophy — English"},
    ],
    "Ibn Sina": [
        {"title": "The Canon of Medicine (al-Qanun fi al-Tibb)", "url": "https://archive.org/details/CanonOfMedicine", "note": "Landmark medical encyclopedia — English"},
        {"title": "The Book of Healing (Kitab al-Shifa)", "url": "https://archive.org/details/avicennasbookofs0000avic", "note": "Philosophical and scientific encyclopedia — English"},
    ],
    "Ibn Rushd": [
        {"title": "The Incoherence of the Incoherence (Tahafut al-Tahafut)", "url": "https://archive.org/details/incoherenceofinc0000aver", "note": "Rebuttal of al-Ghazali's critique of philosophy — English"},
        {"title": "Averroes on Plato's Republic", "url": "https://archive.org/details/averroesonplatos0000unse", "note": "Commentary on Plato — English"},
    ],
    "Jalal ad-Din Rumi": [
        {"title": "The Mathnawi (Nicholson translation)", "url": "https://archive.org/details/in.ernet.dli.2015.151299", "note": "Definitive 6-book Persian Sufi epic — English"},
        {"title": "Masnavi (full Persian & English bilingual)", "url": "https://archive.org/details/MasnaviByRumiEnglishTranslation", "note": "Full bilingual edition"},
    ],
    "Hafez": [
        {"title": "The Divan of Hafiz (Wilberforce Clarke translation)", "url": "https://archive.org/details/divanofhafiz00hafiiala", "note": "Complete English translation of the Divan"},
    ],
    "Saadi Shirazi": [
        {"title": "The Gulistan (Rose Garden)", "url": "https://archive.org/details/gulistan00sadi", "note": "Persian classic of prose-poetry and moral wisdom — English"},
        {"title": "The Bustan (Fruit Orchard)", "url": "https://archive.org/details/bustan00sadi", "note": "Ethical poetry — English translation"},
    ],
    "Omar Khayyam": [
        {"title": "The Rubaiyat of Omar Khayyam (FitzGerald translation)", "url": "https://www.gutenberg.org/ebooks/246", "note": "Famous English translation of Persian quatrains — Project Gutenberg"},
    ],
    "Firdowsi": [
        {"title": "Shahnameh (Book of Kings)", "url": "https://archive.org/details/shahnamehbookodk00fird", "note": "Persian national epic — English translation"},
    ],
    "Farid ud-Din Attar": [
        {"title": "Conference of the Birds (Mantiq al-Tayr)", "url": "https://archive.org/details/conferenceofbird00atta", "note": "Masterpiece of Persian Sufi poetry — English"},
        {"title": "Muslim Saints and Mystics (Tazkirat al-Awliya)", "url": "https://archive.org/details/muslimsaintsmyst00atta", "note": "Biographies of 72 Sufi saints — English"},
    ],
    "Ibn Arabi": [
        {"title": "Fusus al-Hikam (Bezels of Wisdom)", "url": "https://archive.org/details/bezelswisdom00ibna", "note": "Mystical philosophy on the essence of prophets — English"},
        {"title": "The Meccan Revelations (selections)", "url": "https://archive.org/details/meccanrevelation00ibna", "note": "Encyclopedic Sufi masterwork — partial English selections"},
    ],
    "Ali al-Hujwiri": [
        {"title": "Kashf al-Mahjub (Revelation of the Veiled)", "url": "https://archive.org/details/kashfalmahjoob00hujw", "note": "Oldest Persian Sufi treatise — English"},
    ],
    "Al-Qushayri": [
        {"title": "Al-Risala al-Qushayriyya (Epistle on Sufism)", "url": "https://archive.org/details/alqushayrisepisl0000qush", "note": "Classic systematic Sufi manual — English"},
    ],
    "Ibn Kathir": [
        {"title": "Tafsir Ibn Kathir", "url": "https://archive.org/details/tafsiribkathir00ibka", "note": "Most popular traditional Quran commentary — English"},
        {"title": "Al-Bidaya wa al-Nihaya (The Beginning and the End)", "url": "https://archive.org/details/bidayanihaya00ibka", "note": "Comprehensive Islamic history — English"},
    ],
    "Imam al-Nawawi": [
        {"title": "Riyad al-Salihin (Gardens of the Righteous)", "url": "https://archive.org/details/riyadussaliheeng00nawa", "note": "Most widely read hadith collection for daily guidance — English"},
        {"title": "Forty Hadith (al-Arba'in al-Nawawiyya)", "url": "https://archive.org/details/fortyhadeeth00nawa", "note": "40 essential hadith with commentary — English"},
    ],
    "Imam Malik ibn Anas": [
        {"title": "Al-Muwatta (The Well-Trodden Path)", "url": "https://archive.org/details/almuwatta00mali", "note": "Earliest surviving hadith compilation and fiqh text — English"},
    ],
    "Imam al-Shafi'i": [
        {"title": "Al-Risala (Foundations of Islamic Jurisprudence)", "url": "https://archive.org/details/risalatreatiseonfoundations00shaf", "note": "Founding text of Islamic legal theory — English"},
    ],
    "Ibn Hajar al-Asqalani": [
        {"title": "Bulugh al-Maram (Attainment of the Objective)", "url": "https://archive.org/details/bulughalmaram00ibnh", "note": "Hadith compilation focused on Islamic law — English"},
    ],
    "Al-Tahawi": [
        {"title": "The Creed of Imam al-Tahawi (al-Aqida al-Tahawiyya)", "url": "https://archive.org/details/aqidaoftahawi00taha", "note": "Classical Sunni creed — English"},
    ],
    "Ibn Taymiyya": [
        {"title": "The Madinan Way (al-Qawa'id al-Nuraniyya)", "url": "https://archive.org/details/qawaidnuraniyya00ibnt", "note": "Legal principles and rulings — English"},
    ],
    "Ibn al-Qayyim": [
        {"title": "Provisions for the Hereafter (Zad al-Ma'ad)", "url": "https://archive.org/details/zadalmaaad00ibnq", "note": "Guidance from the Prophet's life and practice — English"},
        {"title": "The Invocation of God (al-Wabil al-Sayyib)", "url": "https://archive.org/details/invocationofgod00ibnq", "note": "Benefits and etiquette of dhikr — English"},
    ],
    "Al-Mawardi": [
        {"title": "The Ordinances of Government (al-Ahkam al-Sultaniyya)", "url": "https://archive.org/details/ahkamsultaniyya00mawa", "note": "Classical Islamic constitutional law — English"},
    ],
    "Ibn Hazm": [
        {"title": "The Ring of the Dove (Tawq al-Hamama)", "url": "https://archive.org/details/ringofdove00ibnh", "note": "Famous treatise on love and lovers in Andalusia — English"},
    ],
    "Al-Qadi Iyad": [
        {"title": "Muhammad: Messenger of Allah (al-Shifa)", "url": "https://archive.org/details/shifaqadiiyad00iyad", "note": "Classic work on the Prophet's character — English"},
    ],
    "Ibn Rajab al-Hanbali": [
        {"title": "The Compendium of Knowledge and Wisdom (Jami al-Ulum wal-Hikam)", "url": "https://archive.org/details/compendiumofknow00ibnr", "note": "Commentary on 42 prophetic hadith — English"},
    ],
    "Al-Suyuti": [
        {"title": "History of the Caliphs (Tarikh al-Khulafa)", "url": "https://archive.org/details/historyofcaliphs00suyu", "note": "History of the Islamic caliphate — English"},
    ],
    "Al-Kindi": [
        {"title": "Al-Kindi: The Philosopher of the Arabs", "url": "https://archive.org/details/alkindiphilosoph0000kind", "note": "Selected philosophical works including On First Philosophy — English"},
    ],
    "Al-Farabi": [
        {"title": "Al-Farabi on the Perfect State", "url": "https://archive.org/details/alfarabiontheper0000fara", "note": "Political philosophy; vision of the ideal state — English"},
    ],
    "Ibn Tufayl": [
        {"title": "Hayy ibn Yaqzan", "url": "https://archive.org/details/hayybnyaqdhaan00ibntuoft", "note": "Philosophical novel; influenced Robinson Crusoe — English"},
    ],
    "Nasir Khusraw": [
        {"title": "Book of Travels (Safarnama)", "url": "https://archive.org/details/bookoftravels00nasi", "note": "Philosopher-poet's account of travels to Cairo — English"},
    ],
    "Al-Biruni": [
        {"title": "Alberuni's India (Kitab al-Hind)", "url": "https://archive.org/details/alberunisindiaac01biru", "note": "Classic study of Indian civilization — English"},
        {"title": "Book of Instruction in Astrology", "url": "https://archive.org/details/bookofinstruction00biru", "note": "Mathematical and astronomical manual — English"},
    ],
    "Al-Khwarizmi": [
        {"title": "Algebra (Kitab al-Mukhtasar fi Hisab al-Jabr)", "url": "https://archive.org/details/algebraalkhwariz00khuwa", "note": "The book that named algebra — English translation"},
    ],
    "Ibn al-Haytham": [
        {"title": "Book of Optics (Kitab al-Manazir)", "url": "https://archive.org/details/ibnal-haythamsop00ibna", "note": "Foundational work on optics and vision — English"},
    ],
    "Al-Zahrawi": [
        {"title": "Albucasis on Surgery and Instruments", "url": "https://archive.org/details/albucasisonsurge00zahrala", "note": "Revolutionary illustrated surgical manual — English"},
    ],
    "Nasir al-Din al-Tusi": [
        {"title": "Memoir on Astronomy (al-Tadhkira fi Ilm al-Hay'a)", "url": "https://archive.org/details/memoironastronomy00tusi", "note": "Influential astronomical treatise — English"},
    ],
    "al-Jazari": [
        {"title": "Book of Knowledge of Ingenious Mechanical Devices", "url": "https://archive.org/details/bookofknowledgeo00jaza", "note": "Landmark medieval engineering manual — English"},
    ],
    "Jabir ibn Hayyan": [
        {"title": "The Works of Geber (Latin translations)", "url": "https://archive.org/details/worksofgeber00jabi", "note": "Medieval Latin translations of alchemical works"},
    ],
    "Allama Iqbal": [
        {"title": "The Reconstruction of Religious Thought in Islam", "url": "https://archive.org/details/reconstructionof00iqba", "note": "Foundational modern Islamic philosophy — English"},
        {"title": "Secrets of the Self (Asrar-e-Khudi)", "url": "https://archive.org/details/secretsofself00iqba", "note": "Persian philosophical poem on Islamic selfhood — English"},
        {"title": "Javid Nama (Book of Eternity)", "url": "https://archive.org/details/javidnama00iqba", "note": "Persian spiritual epic modelled on Dante — English"},
        {"title": "The Mysteries of Selflessness (Rumuz-e-Bekhudi)", "url": "https://archive.org/details/mysteriesselfless00iqba", "note": "Companion Persian poem to Asrar-e-Khudi — English"},
    ],
    "Malcolm X": [
        {"title": "The Autobiography of Malcolm X", "url": "https://archive.org/details/autobiographyofm00malo", "note": "Landmark account of spiritual transformation and social justice — English"},
    ],
    "Annemarie Schimmel": [
        {"title": "Mystical Dimensions of Islam", "url": "https://archive.org/details/mysticaldimensio00schi", "note": "Definitive scholarly introduction to Islamic mysticism — English"},
    ],
    "Martin Lings": [
        {"title": "A Sufi Saint of the Twentieth Century: Shaikh Ahmad al-Alawi", "url": "https://archive.org/details/sufisaintoftwent00ling", "note": "Biography of the Algerian Sufi master — English"},
    ],
    "Ali ibn Abi Talib": [
        {"title": "Nahj al-Balagha (Peak of Eloquence)", "url": "https://archive.org/details/nahjulbalagha00alii", "note": "Sermons, letters and sayings of the 4th Caliph — English"},
    ],
    "Ali ibn al-Husayn": [
        {"title": "Al-Sahifa al-Sajjadiyya (Psalms of Islam)", "url": "https://archive.org/details/psalmsofislam00alib", "note": "Collection of supplications by Zayn al-Abidin — English"},
    ],
    "Shah Waliullah": [
        {"title": "The Conclusive Argument from God (Hujjat Allah al-Baligha)", "url": "https://archive.org/details/hujjatallahalbaligha00wali", "note": "Major 18th-century Islamic reform text — English"},
    ],
    "Dara Shikoh": [
        {"title": "Majma al-Bahrayn (The Mingling of the Two Oceans)", "url": "https://archive.org/details/majmaalbahrayn00dara", "note": "Persian work comparing Islamic and Hindu mysticism — English"},
    ],
    "Bediuzzaman Said Nursi": [
        {"title": "Risale-i Nur Collection — The Words", "url": "https://archive.org/details/risaleinurcollect00nurs", "note": "Turkish theological masterwork on Islamic faith — English"},
    ],
    "Sayyid Qutb": [
        {"title": "In the Shade of the Quran (Fi Zilal al-Quran) Vol.1", "url": "https://archive.org/details/intheshadeofquran01qutb", "note": "Influential modern Quran commentary — English"},
    ],
    "Muhammad Abduh": [
        {"title": "The Theology of Unity (Risalat al-Tawhid)", "url": "https://archive.org/details/theologyofunity00abdu", "note": "Modernist Islamic theology — English"},
    ],
    "Abd al-Qadir al-Jilani": [
        {"title": "Futuh al-Ghayb (Revelations of the Unseen)", "url": "https://archive.org/details/futuhalghayb00jila", "note": "62 discourses on Sufi spiritual discipline — English"},
        {"title": "The Secret of Secrets (Sir al-Asrar)", "url": "https://archive.org/details/secretofsecrets00jila", "note": "Sufi sermons and spiritual guidance — English"},
    ],
    "Nana Asma'u": [
        {"title": "The Collected Works of Nana Asma'u", "url": "https://archive.org/details/collectedworksnana00asma", "note": "Poems and writings of the Sokoto scholar-poet — English"},
    ],
    "Ibn Ishaq": [
        {"title": "The Life of Muhammad (Sirat Rasul Allah)", "url": "https://archive.org/details/lifemuhammad00ibni", "note": "Earliest biography of the Prophet via Ibn Hisham — English"},
    ],
    "Al-Tabari": [
        {"title": "History of al-Tabari Vol.1", "url": "https://archive.org/details/historyoftabari01tabauoft", "note": "SUNY multi-volume translation of Tarikh al-Tabari — English"},
    ],
    "Al-Busiri": [
        {"title": "Qasida al-Burda (Poem of the Mantle)", "url": "https://archive.org/details/qasidaburda00busi", "note": "Famous Arabic praise poem — English translation"},
    ],
    "Ibn Ata Allah al-Iskandari": [
        {"title": "The Book of Wisdom (Kitab al-Hikam)", "url": "https://archive.org/details/bookowisdom00ibna", "note": "264 Sufi aphorisms; widely studied Shadhili text — English"},
    ],
    "Umar Ibn al-Farid": [
        {"title": "The Poem of the Way (Nazm al-Suluk)", "url": "https://archive.org/details/sufiversesufiway00ibna", "note": "Greatest Arabic Sufi poem — English"},
    ],
    "Mahmud Shabistari": [
        {"title": "Gulshan-i-Raz (The Mystic Rose Garden)", "url": "https://archive.org/details/mysticrosegarden00shab", "note": "Persian Sufi poem in question-and-answer format — English"},
    ],
    "Sana'i of Ghazna": [
        {"title": "The Walled Garden of Truth (Hadiqat al-Haqiqa)", "url": "https://archive.org/details/walledgardentrue00sana", "note": "First major Persian Sufi didactic poem — English"},
    ],
    "Abdurrahman Jami": [
        {"title": "Yusuf and Zulaikha", "url": "https://archive.org/details/yusufzulaikha00jami", "note": "Persian Sufi epic retelling the Quranic story of Joseph — English"},
    ],
    "Al-Mutanabbi": [
        {"title": "Poems of al-Mutanabbi (selected Diwan)", "url": "https://archive.org/details/poemsofmutanabbg00muta", "note": "Selected English translation of the great Arab poet"},
    ],
    "Yunus Emre": [
        {"title": "The Drop That Became the Sea: Lyric Poems", "url": "https://archive.org/details/dropthatbecamese00yunus", "note": "Turkish Sufi folk poetry — English translation"},
    ],
    "Shah Abdul Latif Bhittai": [
        {"title": "Shah Jo Risalo (The Message of Shah)", "url": "https://archive.org/details/shahjorisalo00shah", "note": "The greatest Sindhi literary work; Sufi poetry"},
    ],
    "Mirza Ghalib": [
        {"title": "Divan-e-Ghalib (selected poems)", "url": "https://archive.org/details/divaneghalib00ghal", "note": "Great Mughal-era Urdu poet's collected verse — English/Urdu"},
    ],
    "Fakhr al-Din Iraqi": [
        {"title": "Divine Flashes (Lama'at)", "url": "https://archive.org/details/divineflashes00iraq", "note": "Sufi love poetry influenced by Ibn Arabi — English"},
    ],
    "Nizami Ganjavi": [
        {"title": "Layla and Majnun", "url": "https://archive.org/details/laylamajnun00niza", "note": "Persian epic of tragic love — English translation"},
    ],
    "Miskawayh": [
        {"title": "The Refinement of Character (Tahdhib al-Akhlaq)", "url": "https://archive.org/details/refinementofchar0000misk", "note": "Classic Islamic ethical philosophy — English"},
    ],
    "René Guénon": [
        {"title": "Introduction to the Study of Hindu Doctrines", "url": "https://archive.org/details/introductiontostu00guen", "note": "Perennialist philosophy; Guénon later became Sufi as Abd al-Wahid Yahya — English"},
        {"title": "The Crisis of the Modern World", "url": "https://archive.org/details/crisisofmodern00guen", "note": "Critique of modernity from Sufi-Traditionalist perspective — English"},
    ],
    "Seyyed Hossein Nasr": [
        {"title": "Ideals and Realities of Islam", "url": "https://archive.org/details/idealsrealitiesof00nasr", "note": "Introduction to Islamic thought and spirituality — English"},
    ],
    "Ali Shariati": [
        {"title": "Hajj: Reflections on Its Rituals", "url": "https://archive.org/details/hajjreflectionso00shar", "note": "Philosophical and spiritual reading of the pilgrimage — English"},
        {"title": "On the Sociology of Islam", "url": "https://archive.org/details/onsociologyofisl00shar", "note": "Lectures on Islamic society and civilization — English"},
    ],
    "Abd al-Qadir al-Jilani": [
        {"title": "Futuh al-Ghayb (Revelations of the Unseen)", "url": "https://archive.org/details/futuhalghayb00jila", "note": "62 discourses on Sufi spiritual discipline — English"},
        {"title": "The Secret of Secrets (Sir al-Asrar)", "url": "https://archive.org/details/secretofsecrets00jila", "note": "Sufi sermons and spiritual guidance — English"},
    ],
}


def main():
    # Load core.json to build famous -> {type, tradition} lookup
    with open(CORE, encoding="utf-8") as f:
        core = json.load(f)

    core_lookup = {}
    for p in core:
        famous = p.get("famous", "")
        if famous:
            core_lookup[famous] = p

    # Group figures by chunk
    chunk_updates = defaultdict(dict)  # chunk_name -> {famous: [books]}
    not_found = []

    for famous, books in BOOKS_TO_ADD.items():
        if famous not in core_lookup:
            not_found.append(famous)
            continue
        chunk = get_chunk_name(core_lookup[famous])
        # Merge if same figure appears twice in BOOKS_TO_ADD (e.g. Allama Iqbal)
        if famous in chunk_updates[chunk]:
            chunk_updates[chunk][famous].extend(books)
        else:
            chunk_updates[chunk][famous] = list(books)

    # Process each chunk file
    total_figures = 0
    total_books = 0
    figures_not_in_details = []

    for chunk_name, figure_books in sorted(chunk_updates.items()):
        path = os.path.join(DET, f"{chunk_name}.json")
        if not os.path.exists(path):
            print(f"  WARNING: {path} does not exist, skipping {len(figure_books)} figures")
            figures_not_in_details.extend(figure_books.keys())
            continue

        with open(path, encoding="utf-8") as f:
            records = json.load(f)

        # Build index of famous -> record
        rec_index = {}
        for rec in records:
            rec_index[rec.get("famous", "")] = rec

        updated_in_chunk = 0
        for famous, new_books in figure_books.items():
            if famous not in rec_index:
                figures_not_in_details.append(famous)
                print(f"  WARNING: '{famous}' not found in {chunk_name}.json — skipped")
                continue

            rec = rec_index[famous]
            existing = rec.get("books", [])
            existing_titles = {b.get("title") for b in existing}

            added = 0
            for book in new_books:
                if book["title"] not in existing_titles:
                    existing.append(book)
                    added += 1

            if added > 0:
                rec["books"] = existing
                total_books += added
                updated_in_chunk += 1

        if updated_in_chunk > 0:
            total_figures += updated_in_chunk
            with open(path, "w", encoding="utf-8") as f:
                json.dump(records, f, ensure_ascii=False, indent=2)
            print(f"  {chunk_name}.json — updated {updated_in_chunk} figures")

    # Summary
    print(f"\n{'='*50}")
    print(f"SUMMARY")
    print(f"{'='*50}")
    print(f"Figures updated:  {total_figures}")
    print(f"Books added:      {total_books}")

    if not_found:
        print(f"\nNOT FOUND in core.json ({len(not_found)}):")
        for name in sorted(not_found):
            print(f"  - {name}")

    if figures_not_in_details:
        print(f"\nNOT FOUND in details file ({len(figures_not_in_details)}):")
        for name in sorted(figures_not_in_details):
            print(f"  - {name}")

    if not not_found and not figures_not_in_details:
        print(f"\nAll figures found and updated successfully.")


if __name__ == "__main__":
    main()
