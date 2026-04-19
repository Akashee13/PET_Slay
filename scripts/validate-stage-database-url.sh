#!/usr/bin/env sh

set -eu

database_url="${STAGE_DATABASE_URL:-${DATABASE_URL:-}}"

if [ -z "$database_url" ]; then
	echo "STAGE_DATABASE_URL or DATABASE_URL is required." >&2
	exit 1
fi

case "$database_url" in
postgres://* | postgresql://*) ;;
*)
	echo "Stage database URL must start with postgres:// or postgresql://." >&2
	exit 1
	;;
esac

case "$database_url" in
*"placeholder"* | *"[YOUR-PASSWORD]"* | *"<YOUR-PASSWORD>"* | *"YOUR_PASSWORD"* | *"example.com"* | *"localhost"* | *"127.0.0.1"*)
	echo "Stage database URL still looks like a placeholder or local DSN." >&2
	exit 1
	;;
esac

case "$database_url" in
*@*:*/*) ;;
*)
	echo "Stage database URL must include credentials, host, port, and database name." >&2
	exit 1
	;;
esac

echo "Stage database URL shape looks valid."
