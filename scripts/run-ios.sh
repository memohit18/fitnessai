#!/usr/bin/env bash
# Launch ThinkTank on iOS without Expo's Simulator.app check.
# Needed on Xcode 27+, where Simulator.app was replaced by DeviceHub.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUNDLE_ID="com.thinktank.mobile"
DEVICE_NAME="${1:-iPhone 17}"
METRO_URL="http://127.0.0.1:8081"
DEEP_LINK="exp+thinktankmobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"

resolve_udid() {
  local booted
  booted="$(xcrun simctl list devices booted | awk -F '[()]' '/iPhone|iPad/{print $2; exit}')"
  if [[ -n "${booted:-}" ]]; then
    echo "$booted"
    return
  fi

  local udid
  udid="$(
    xcrun simctl list devices available \
      | grep "$DEVICE_NAME" \
      | grep -oE '\([A-F0-9-]{36}\)' \
      | head -1 \
      | tr -d '()'
  )"

  if [[ -z "${udid:-}" ]]; then
    echo "No simulator found for: $DEVICE_NAME" >&2
    exit 1
  fi

  xcrun simctl boot "$udid" >/dev/null 2>&1 || true
  echo "$udid"
}

open_device_ui() {
  if [[ -d "/Applications/Xcode.app/Contents/Applications/DeviceHub.app" ]]; then
    open "/Applications/Xcode.app/Contents/Applications/DeviceHub.app" >/dev/null 2>&1 || true
  elif [[ -d "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app" ]]; then
    open -a Simulator >/dev/null 2>&1 || true
  fi
}

find_app() {
  find "$HOME/Library/Developer/Xcode/DerivedData" \
    -path "*/Build/Products/Debug-iphonesimulator/thinktankmobile.app" \
    -type d 2>/dev/null | head -1
}

build_app() {
  echo "Building iOS app with xcodebuild…"
  # Prefer default DerivedData — custom ios/build often fails ExpoModulesJSI on Xcode 27+.
  set -o pipefail
  xcodebuild \
    -workspace ios/thinktankmobile.xcworkspace \
    -scheme thinktankmobile \
    -configuration Debug \
    -sdk iphonesimulator \
    -destination "platform=iOS Simulator,name=$DEVICE_NAME" \
    build
}

ensure_metro() {
  if lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Metro already running on 8081"
    return
  fi

  echo "Starting Metro…"
  npx expo start --dev-client --clear >/tmp/thinktank-metro.log 2>&1 &
  local tries=0
  until lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [[ "$tries" -gt 60 ]]; then
      echo "Metro failed to start. See /tmp/thinktank-metro.log" >&2
      exit 1
    fi
    sleep 1
  done
}

UDID="$(resolve_udid)"
echo "Using simulator: $DEVICE_NAME ($UDID)"
open_device_ui

APP="$(find_app || true)"
if [[ "${FORCE_REBUILD:-}" == "1" || -z "${APP:-}" || ! -d "$APP" ]]; then
  build_app
  APP="$ROOT/ios/build/Build/Products/Debug-iphonesimulator/thinktankmobile.app"
fi

if [[ ! -d "$APP" ]]; then
  echo "Could not find thinktankmobile.app after build." >&2
  exit 1
fi

echo "Installing $APP"
xcrun simctl install "$UDID" "$APP"

ensure_metro

echo "Launching $BUNDLE_ID"
xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null
sleep 1
xcrun simctl openurl "$UDID" "$DEEP_LINK" >/dev/null 2>&1 || true

echo "Done. Metro: $METRO_URL"
echo "If the app shows the launcher, tap the development server or reopen:"
echo "  xcrun simctl openurl $UDID \"$DEEP_LINK\""
