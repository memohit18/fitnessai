#!/usr/bin/env bash
# Xcode 27 rejects ternary C-function-pointer expressions in expo-modules-jsi.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$ROOT/node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI/Runtime/JavaScriptRuntime.swift"

if [[ ! -f "$FILE" ]]; then
  exit 0
fi

if grep -q 'Xcode 27+: ternary over C function pointers' "$FILE"; then
  exit 0
fi

python3 - <<PY
from pathlib import Path
path = Path("$FILE")
text = path.read_text()
old = """    let callbacks = expo.HostObjectCallbacks(
      context, getter, set == nil ? nil : setter, propertyNamesGetter, deallocate)"""
new = """    // Xcode 27+: ternary over C function pointers is rejected; branch instead.
    let callbacks: expo.HostObjectCallbacks
    if set == nil {
      callbacks = expo.HostObjectCallbacks(
        context, getter, nil, propertyNamesGetter, deallocate)
    } else {
      callbacks = expo.HostObjectCallbacks(
        context, getter, setter, propertyNamesGetter, deallocate)
    }"""
if old not in text:
    raise SystemExit(0)
path.write_text(text.replace(old, new, 1))
print("Patched expo-modules-jsi for Xcode 27")
PY
