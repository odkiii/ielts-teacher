#!/usr/bin/env python3
"""Проверка ссылок из data/resources.yaml (без внешних зависимостей).

Использование:  python3 scripts/check_links.py [путь/к/resources.yaml]
Печатает статус каждой ссылки. Код выхода 1, если есть недоступные.
Не изменяет файлы: обновляй `status:` вручную после проверки.
"""
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "data" / "resources.yaml"
text = path.read_text(encoding="utf-8")

# Ищем пары id + url
entries = re.findall(r"- id:\s*(\S+)(.*?)(?=\n  - id:|\Z)", text, flags=re.S)
bad = 0
for rid, body in entries:
    m = re.search(r"^\s*url:\s*(\S+)", body, flags=re.M)
    if not m or m.group(1) == "null":
        print(f"[skip] {rid}: нет URL (канал/книга)")
        continue
    url = m.group(1)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (ielts-teacher link check)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            print(f"[{r.status}] {rid}: {url}")
    except urllib.error.HTTPError as e:
        # 403/429 часто означает защиту от ботов, а не мёртвую ссылку
        tag = "warn" if e.code in (403, 429) else "FAIL"
        print(f"[{e.code}] {tag} {rid}: {url}")
        if tag == "FAIL":
            bad += 1
    except Exception as e:  # noqa: BLE001
        print(f"[ERR] FAIL {rid}: {url} — {e}")
        bad += 1

sys.exit(1 if bad else 0)
