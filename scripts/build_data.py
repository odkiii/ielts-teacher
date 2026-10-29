#!/usr/bin/env python3
"""Собирает app/data/resources.json из data/resources.yaml + data/resources_extra.yaml.
Требуется PyYAML:  pip install pyyaml
Запуск из корня репозитория:  python3 scripts/build_data.py
"""
import json
import sys
from pathlib import Path

import yaml

root = Path(__file__).resolve().parent.parent
items, seen = [], set()
for name in ("resources.yaml", "resources_extra.yaml"):
    data = yaml.safe_load((root / "data" / name).read_text(encoding="utf-8"))
    for r in data["resources"]:
        if r["id"] in seen:
            sys.exit(f"duplicate id: {r['id']}")
        seen.add(r["id"])
        items.append(r)

out = root / "app" / "data" / "resources.json"
out.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"{len(items)} resources -> {out}")
