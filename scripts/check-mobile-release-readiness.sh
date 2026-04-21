#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/apps/mobile"
APP_JSON="$MOBILE_DIR/app.json"
EAS_JSON="$MOBILE_DIR/eas.json"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

[[ -f "$APP_JSON" ]] || fail "Missing apps/mobile/app.json"
[[ -f "$EAS_JSON" ]] || fail "Missing apps/mobile/eas.json"

grep -q '"package": "com\.noira\.reseller"' "$APP_JSON" || fail "Android package is not set to com.noira.reseller"
grep -q '"bundleIdentifier": "com\.noira\.reseller"' "$APP_JSON" || fail "iOS bundle identifier is not set to com.noira.reseller"
grep -q '"icon": "\./assets/brand/noira-icon\.png"' "$APP_JSON" || fail "App icon path is missing"
grep -q '"foregroundImage": "\./assets/brand/noira-adaptive-foreground\.png"' "$APP_JSON" || fail "Adaptive icon foreground path is missing"
pass "App identifiers and icon paths are configured"

grep -q '"preview"' "$EAS_JSON" || fail "EAS preview profile missing"
grep -q '"production"' "$EAS_JSON" || fail "EAS production profile missing"
pass "EAS preview and production profiles are present"

for asset in \
  "$MOBILE_DIR/assets/brand/noira-icon.png" \
  "$MOBILE_DIR/assets/brand/noira-adaptive-foreground.png"; do
  [[ -f "$asset" ]] || fail "Missing asset: $asset"
done
pass "Brand assets exist"

while IFS= read -r env_file; do
  if grep -Eiq 'service_role|founder|admin.*token|EXPO_PUBLIC_BUYER_BEARER_TOKEN=.+' "$env_file"; then
    fail "Sensitive or persistent token material found in $env_file"
  fi
done < <(find "$MOBILE_DIR" -maxdepth 1 -type f \( -name '.env*' -o -name '*.env' \) ! -name '.env.example')
pass "No unsafe mobile env files detected"

echo "Mobile release readiness checks passed."
