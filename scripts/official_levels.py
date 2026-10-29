#!/usr/bin/env python3
"""Сопоставляет карточки с ОФИЦИАЛЬНЫМИ данными и пишет data/official_levels.json.
Сами исходные списки в репозиторий не кладём (авторские права): скрипт читает PDF с диска.

Использование:
  python3 scripts/official_levels.py <Oxford_3000.pdf> <Oxford_5000.pdf> <Academic_Collocation_List.pdf>

Источники:
  * The Oxford 3000 / Oxford 5000 by CEFR level (Oxford University Press) — уровень A1–C1 отдельных слов и некоторых выражений.
  * Academic Collocation List (Pearson) — подтверждает, что коллокация входит в список (уровней CEFR в нём нет).
Карточка без совпадения остаётся БЕЗ уровня (уровни не придумываем)."""
import json, os, re, subprocess, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if len(sys.argv) != 4:
    sys.exit(__doc__)
def text(pdf, layout=False):
    return subprocess.run(["pdftotext"] + (["-layout"] if layout else []) + [pdf, "-"], capture_output=True, text=True, check=True).stdout

POS_RE = re.compile(r"\s(?=(?:n\.|v\.|adj\.|adv\.|prep\.|conj\.|det\.|pron\.|modal v\.|auxiliary v\.|exclam\.|number|ordinal number|indefinite article|definite article|infinitive marker)(?:,|\s|$))")
NORM = {"n.": "n", "v.": "v", "adj.": "adj", "adv.": "adv", "prep.": "prep", "conj.": "conj", "modal v.": "v", "auxiliary v.": "v"}
ox = {}  # (word) -> {pos: (level, source)}
ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]
for pdf, src in ((sys.argv[1], "Oxford 3000"), (sys.argv[2], "Oxford 5000")):
    lvl = None
    for line in text(pdf).splitlines():
        line = line.strip()
        if line in ORDER:
            lvl = line; continue
        if not lvl or not line or line.startswith("The Oxford") or "©" in line:
            continue
        m = POS_RE.search(line)
        if not m:
            continue
        word = re.sub(r"\s*\(.*?\)", "", line[:m.start()]).strip().lower()
        poss = {NORM.get(p.strip()) for p in re.split(r",\s*", line[m.end():].strip()) if NORM.get(p.strip())}
        for p in poss or {"?"}:
            cur = ox.setdefault(word, {}).get(p)
            if cur is None or ORDER.index(lvl) < ORDER.index(cur[0]):
                ox[word][p] = (lvl, src)

# ---- ACL: пары (головное слово, компонент) ----
acl = set()
stem = lambda w: re.sub(r"(ing|ed|es|s)$", "", w.lower())
head = None
for line in text(sys.argv[3], layout=True).splitlines():
    for col in (line[:62], line[62:]):
        m = re.match(r"^\s*\d+\s+(.+?)\s*\((?:[a-z]+)\)\s*$", col)
        if m:
            head = [w for w in re.sub(r"\((?:a|an|the)\)", "", m.group(1)).split() if w]; continue
        m = re.match(r"^\s{2,}(.+?)\s*\((?:[a-z]+)\)\s*$", col)
        if m and head:
            comp = re.sub(r"\((?:a|an|the)\)", "", m.group(1)).split()
            for h in head:
                for c in comp:
                    acl.add((stem(h), stem(c)))
STOP = {"a", "an", "the", "of", "to", "in", "on", "for", "with", "by", "at", "it", "your", "someone", "someone's", "something", "one", "how"}
deck = json.load(open(os.path.join(root, "app", "data", "deck.json"), encoding="utf-8"))
out, st = {}, {"oxford": 0, "acl": 0, "none": 0}
for d in deck:
    t = re.sub(r"^to\s+", "", d["t"].lower().replace("’", "'")); key = d["t"] + "|" + d["pos"]; rec = {}
    e = ox.get(t)
    if e:
        o = e.get(d["pos"]) if d["pos"] in ("n", "v", "adj", "adv", "prep", "conj") else min(e.values(), key=lambda x: ORDER.index(x[0]))
        if o: rec["cef"], rec["src"] = o
    if d["pos"] in ("coll", "hedge", "phr", "phv", "idiom"):
        toks = [stem(re.sub(r"[^a-z-]", "", w)) for w in t.split() if w not in STOP]
        if any(h in toks and c in toks and h != c for h, c in acl):
            rec["acl"] = True
    if rec:
        out[key] = rec
        st["oxford" if "cef" in rec else "acl"] += 1
    else:
        st["none"] += 1
json.dump(out, open(os.path.join(root, "data", "official_levels.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
print(len(ox), "Oxford words;", len(acl), "ACL pairs;", st, "of", len(deck))
