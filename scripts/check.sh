#!/bin/bash
# Validate the marketplace and every mod, then run each mod's tests. Needs the `claude` CLI.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd /tmp
echo "== marketplace"
claude plugin validate "$ROOT"
for mod in "$ROOT"/plugins/*/; do
  name="$(basename "$mod")"
  echo "== $name"
  claude plugin validate "$mod"
  claude plugin test "$mod"
done
echo "All checks passed."
