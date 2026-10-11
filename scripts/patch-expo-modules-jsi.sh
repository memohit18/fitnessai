#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$ROOT/node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI/Runtime/JavaScriptRuntime.swift"

if [[ ! -f "$FILE" ]]; then
  echo "expo-modules-jsi source not found; skipping patch."
  exit 0
fi

python3 - "$FILE" <<'PYTHON'
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()

marker = "Xcode 27+: ternary over C function pointers is rejected"
if marker in text:
    print("Patch already applied.")
    raise SystemExit(0)

old = """    let callbacks = expo.HostObjectCallbacks(
      context, getter, set == nil ? nil : setterPointer, propertyNamesGetter, deallocate)"""

new = """    // Xcode 27+: ternary over C function pointers is rejected; branch instead.
    let callbacks: expo.HostObjectCallbacks
    if set == nil {
      callbacks = expo.HostObjectCallbacks(
        context, getter, nil, propertyNamesGetter, deallocate)
    } else {
      callbacks = expo.HostObjectCallbacks(
        context, getter, setterPointer, propertyNamesGetter, deallocate)
    }"""

if old not in text:
    raise SystemExit("ERROR: Expected Swift source not found; no changes made.")

path.write_text(text.replace(old, new, 1))
print("Patched expo-modules-jsi for Xcode 27.")
PYTHON
