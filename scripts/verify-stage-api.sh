#!/usr/bin/env sh

set -eu

STAGE_API_URL="${STAGE_API_URL:-https://pet-slay-api-stage-j67sekma7a-el.a.run.app}"
BUYER_BEARER_TOKEN="${BUYER_BEARER_TOKEN:-}"

ready_body_file="$(mktemp)"
health_body_file="$(mktemp)"
catalog_body_file="$(mktemp)"

cleanup() {
	rm -f "$ready_body_file" "$health_body_file" "$catalog_body_file"
}
trap cleanup EXIT

echo "Verifying stage health endpoint..."
health_code="$(curl -sS -o "$health_body_file" -w "%{http_code}" "$STAGE_API_URL/health")"
if [ "$health_code" != "200" ]; then
	echo "Health check failed with HTTP $health_code" >&2
	cat "$health_body_file" >&2
	exit 1
fi

echo "Verifying stage readiness endpoint..."
ready_code="$(curl -sS -o "$ready_body_file" -w "%{http_code}" "$STAGE_API_URL/health/ready")"
if [ "$ready_code" != "200" ]; then
	echo "Readiness check failed with HTTP $ready_code" >&2
	cat "$ready_body_file" >&2
	exit 1
fi

if ! grep -q '"status":"ready"' "$ready_body_file"; then
	echo "Readiness payload does not report ready status." >&2
	cat "$ready_body_file" >&2
	exit 1
fi

if ! grep -q '"databaseConfigured":true' "$ready_body_file"; then
	echo "Readiness payload does not report databaseConfigured=true." >&2
	cat "$ready_body_file" >&2
	exit 1
fi

if ! grep -q '"databaseRequired":true' "$ready_body_file"; then
	echo "Readiness payload does not report databaseRequired=true." >&2
	cat "$ready_body_file" >&2
	exit 1
fi

echo "Readiness checks passed."

if [ -n "$BUYER_BEARER_TOKEN" ]; then
	echo "Verifying authenticated catalog endpoint with buyer token..."
	catalog_code="$(curl -sS -o "$catalog_body_file" -w "%{http_code}" \
		-H "Authorization: Bearer $BUYER_BEARER_TOKEN" \
		"$STAGE_API_URL/v1/catalog/products")"
	if [ "$catalog_code" != "200" ]; then
		echo "Catalog endpoint check failed with HTTP $catalog_code" >&2
		cat "$catalog_body_file" >&2
		exit 1
	fi
	echo "Catalog endpoint check passed."
else
	echo "BUYER_BEARER_TOKEN not set; skipping authenticated endpoint verification."
fi

echo "Stage API verification complete."
