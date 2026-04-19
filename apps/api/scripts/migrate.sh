#!/usr/bin/env sh

set -eu

ACTION="${1:-up}"
MIGRATION_DIR="$(cd "$(dirname "$0")/../db/migrations" && pwd)"

echo "Migration action: ${ACTION}"
echo "Migration directory: ${MIGRATION_DIR}"
echo "Hook up your migration tool here once the Go DB library/tooling is selected."
