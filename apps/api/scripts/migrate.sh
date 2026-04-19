#!/usr/bin/env sh

set -eu

ACTION="${1:-up}"
MIGRATION_DIR="$(cd "$(dirname "$0")/../db/migrations" && pwd)"

if [ "$ACTION" != "up" ]; then
	echo "Only migrate up is supported by the current SQL runner." >&2
	exit 1
fi

echo "Migration action: ${ACTION}"
echo "Migration directory: ${MIGRATION_DIR}"
MIGRATION_DIR="${MIGRATION_DIR}" go run ./cmd/migrate
