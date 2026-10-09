#!/usr/bin/env python3
"""Cheap checks that need no login: manifests parse, versions are semver, the licence matches LICENSE,
and the marketplace points at real folders. The full validation and tests run locally with scripts/check.sh."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
errors = []


def load(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        errors.append(f"{path.relative_to(ROOT)}: cannot read as JSON ({e})")
        return {}


licence_text = (ROOT / "LICENSE").read_text(encoding="utf-8")
expected = "MIT" if licence_text.startswith("MIT License") else None
if expected is None:
    errors.append("LICENSE: does not start with 'MIT License' (update this check if the licence changes)")

market = load(ROOT / ".claude-plugin" / "marketplace.json")
listed = {p.get("name"): p for p in market.get("plugins", [])}
folders = sorted(p.name for p in (ROOT / "plugins").iterdir() if p.is_dir())

for name in folders:
    if name not in listed:
        errors.append(f"marketplace.json: plugins/{name} is not listed")

for name, entry in listed.items():
    src = ROOT / entry.get("source", "")
    manifest = load(src / ".claude-plugin" / "plugin.json")
    if not (src / "hooks" / "hooks.json").exists():
        errors.append(f"{name}: hooks/hooks.json is missing")
    if manifest.get("name") != name:
        errors.append(f"{name}: manifest name is {manifest.get('name')!r}")
    if not SEMVER.match(str(manifest.get("version", ""))):
        errors.append(f"{name}: version {manifest.get('version')!r} is not semver")
    if expected and manifest.get("license") != expected:
        errors.append(f"{name}: licence is {manifest.get('license')!r}, LICENSE says {expected}")
    if "author" not in manifest:
        errors.append(f"{name}: no author")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"ok: {len(listed)} mods, licence {expected}")
