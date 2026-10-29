#!/usr/bin/env python3
"""data/deck/*.txt  ->  app/data/deck.json. Формат строки: term|ru|example с [[формой]]|pos|domain
pos: n v adj adv prep conj phr | coll (коллокация) phv (фразовый глагол) idiom hedge (оборот/связка)
Уровень CEFR НЕ задаётся вручную: он берётся из data/official_levels.json (официальные списки Oxford 3000/5000;
собирается scripts/official_levels.py). Нет совпадения — у карточки нет уровня.
"""
import glob, json, re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cards, seen, errs = [], set(), []
OFF = json.load(open(os.path.join(root, 'data', 'official_levels.json'), encoding='utf-8')) if os.path.exists(os.path.join(root, 'data', 'official_levels.json')) else {}
for f in sorted(glob.glob(os.path.join(root, "data", "deck", "*.txt"))):
    for n, line in enumerate(open(f, encoding="utf-8"), 1):
        line = line.rstrip("\n")
        if not line.strip() or line.startswith("#"):
            continue
        p = line.split("|")
        if len(p) != 5:
            errs.append(f"{os.path.basename(f)}:{n} fields={len(p)}"); continue
        t, ru, ex, pos, dom = [x.strip() for x in p]
        if not re.search(r"\[\[[^\[\]]+\]\]", ex) or ex.count("[[") != ex.count("]]"):
            errs.append(f"{os.path.basename(f)}:{n} bad [[ ]] in example: {t}"); continue
        key = (t.lower(), pos)
        if key in seen:
            print("skip duplicate:", t, pos); continue
        seen.add(key)
        card = {"id": "d%03d" % (len(cards) + 1), "t": t, "ru": ru, "ex": ex, "pos": pos, "dom": dom}
        o = OFF.get(t + "|" + pos, {})
        if o.get("cef"): card.update(cef=o["cef"], src=o["src"])
        if o.get("acl"): card["acl"] = 1
        cards.append(card)
if errs:
    print("\n".join(errs)); sys.exit(1)
json.dump(cards, open(os.path.join(root, "app", "data", "deck.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(cards), "cards ->", "app/data/deck.json")
