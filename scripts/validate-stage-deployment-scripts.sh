#!/usr/bin/env sh

set -eu

oidc_script="scripts/setup-gcp-github-oidc.sh"
cloudrun_workflow=".github/workflows/deploy-stage-api-cloudrun.yml"

if [ ! -f "$oidc_script" ]; then
	echo "$oidc_script is missing" >&2
	exit 1
fi

sh -n "$oidc_script"
sh -n "scripts/deploy-stage-api-cloudrun.sh"

for required in \
	"GCP_WORKLOAD_IDENTITY_PROVIDER" \
	"GCP_SERVICE_ACCOUNT_EMAIL" \
	"GCP_PROJECT_ID" \
	"STAGE_DATABASE_URL" \
	"STAGE_SUPABASE_URL" \
	"STAGE_SUPABASE_ANON_KEY" \
	"STAGE_SUPABASE_SERVICE_ROLE_KEY"; do
	if ! grep -q "$required" "$cloudrun_workflow"; then
		echo "$cloudrun_workflow does not reference $required" >&2
		exit 1
	fi
done

for required in \
	"roles/run.admin" \
	"roles/artifactregistry.writer" \
	"roles/iam.workloadIdentityUser"; do
	if ! grep -q "$required" "$oidc_script"; then
		echo "$oidc_script does not configure $required" >&2
		exit 1
	fi
done

if grep -q "PORT=8080" "$cloudrun_workflow" "scripts/deploy-stage-api-cloudrun.sh"; then
	echo "Cloud Run sets PORT automatically; do not pass PORT through --set-env-vars" >&2
	exit 1
fi

echo "Stage deployment scripts validated."
