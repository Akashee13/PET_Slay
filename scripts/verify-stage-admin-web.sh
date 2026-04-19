#!/usr/bin/env sh

set -eu

STAGE_ADMIN_URL="${STAGE_ADMIN_URL:-}"

if [ -z "$STAGE_ADMIN_URL" ]; then
  echo "STAGE_ADMIN_URL is required." >&2
  exit 1
fi

body_file="$(mktemp)"
cleanup() {
  rm -f "$body_file"
}
trap cleanup EXIT

echo "Checking admin web URL: $STAGE_ADMIN_URL"
status_code="$(curl -sS -L -o "$body_file" -w "%{http_code}" "$STAGE_ADMIN_URL")"

if [ "$status_code" != "200" ]; then
  echo "Admin web check failed with HTTP $status_code" >&2
  cat "$body_file" >&2
  exit 1
fi

if ! grep -q "PET_Slay Admin" "$body_file"; then
  echo "Admin web response did not contain expected app marker." >&2
  cat "$body_file" >&2
  exit 1
fi

echo "Admin web verification passed."
