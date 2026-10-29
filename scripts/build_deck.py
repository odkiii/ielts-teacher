#!/usr/bin/env python3
"""data/deck/*.txt  ->  app/data/deck.json. Формат строки: term|ru|example с [[формой]]|pos|domain[|CEFR]
pos: n v adj adv prep conj phr | coll (коллокация) phv (фразовый глагол) idiom hedge (оборот/связка)
CEFR: B1 B2 C1 C2; если не указан — берётся из директивы `#level X` в файле, иначе B2. Уровни — оценка автора, не официальная разметка."""
import glob, json, re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cards, seen, errs = [], set(), []
LV = {'B1', 'B2', 'C1', 'C2'}
for f in sorted(glob.glob(os.path.join(root, "data", "deck", "*.txt"))):
    deflv = 'B2'
    for n, line in enumerate(open(f, encoding="utf-8"), 1):
        line = line.rstrip("\n")
        if line.startswith('#level '):
            deflv = line.split()[1].strip(); continue
        if not line.strip() or line.startswith("#"):
            continue
        p = line.split("|")
        if len(p) not in (5, 6):
            errs.append(f"{os.path.basename(f)}:{n} fields={len(p)}"); continue
        t, ru, ex, pos, dom = [x.strip() for x in p[:5]]
        cef = p[5].strip() if len(p) == 6 else deflv
        if cef not in LV:
            errs.append(f"{os.path.basename(f)}:{n} bad level {cef}"); continue
        if not re.search(r"\[\[[^\[\]]+\]\]", ex) or ex.count("[[") != ex.count("]]"):
            errs.append(f"{os.path.basename(f)}:{n} bad [[ ]] in example: {t}"); continue
        key = (t.lower(), pos)
        if key in seen:
            print("skip duplicate:", t, pos); continue
        seen.add(key)
        cards.append({"id": "d%03d" % (len(cards) + 1), "t": t, "ru": ru, "ex": ex, "pos": pos, "dom": dom, "cef": cef})
if errs:
    print("\n".join(errs)); sys.exit(1)
json.dump(cards, open(os.path.join(root, "app", "data", "deck.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(cards), "cards ->", "app/data/deck.json")
