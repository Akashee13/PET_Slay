#!/usr/bin/env sh

set -eu

if [ -z "${GCP_PROJECT_ID:-}" ]; then
	echo "GCP_PROJECT_ID is required. Example: GCP_PROJECT_ID=pet-slay-stage-123 scripts/setup-gcp-github-oidc.sh" >&2
	exit 1
fi

if [ -z "${GITHUB_REPOSITORY:-}" ]; then
	echo "GITHUB_REPOSITORY is required. Example: GITHUB_REPOSITORY=Akashee13/PET_Slay scripts/setup-gcp-github-oidc.sh" >&2
	exit 1
fi

GCP_REGION="${GCP_REGION:-asia-south1}"
ARTIFACT_LOCATION="${ARTIFACT_LOCATION:-us}"
ARTIFACT_REPOSITORY="${ARTIFACT_REPOSITORY:-pet-slay}"
WORKLOAD_POOL_ID="${WORKLOAD_POOL_ID:-pet-slay-github}"
WORKLOAD_PROVIDER_ID="${WORKLOAD_PROVIDER_ID:-github}"
SERVICE_ACCOUNT_ID="${SERVICE_ACCOUNT_ID:-pet-slay-stage-deployer}"
DRY_RUN="${DRY_RUN:-false}"

run() {
	if [ "$DRY_RUN" = "true" ]; then
		printf 'DRY RUN: %s\n' "$*"
	else
		"$@"
	fi
}

PROJECT_NUMBER="${GCP_PROJECT_NUMBER:-}"
if [ -z "$PROJECT_NUMBER" ]; then
	PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"
fi

SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_ID}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
WORKLOAD_PROVIDER_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WORKLOAD_POOL_ID}/providers/${WORKLOAD_PROVIDER_ID}"
REPOSITORY_PRINCIPAL="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WORKLOAD_POOL_ID}/attribute.repository/${GITHUB_REPOSITORY}"

echo "Preparing PET_Slay stage deploy identity..."
echo "Project: ${GCP_PROJECT_ID}"
echo "Region: ${GCP_REGION}"
echo "GitHub repository: ${GITHUB_REPOSITORY}"
echo "Service account: ${SERVICE_ACCOUNT_EMAIL}"
echo

run gcloud services enable \
	run.googleapis.com \
	artifactregistry.googleapis.com \
	cloudbuild.googleapis.com \
	iamcredentials.googleapis.com \
	--project "$GCP_PROJECT_ID"

if ! gcloud artifacts repositories describe "$ARTIFACT_REPOSITORY" --location "$ARTIFACT_LOCATION" --project "$GCP_PROJECT_ID" >/dev/null 2>&1; then
	run gcloud artifacts repositories create "$ARTIFACT_REPOSITORY" \
		--project "$GCP_PROJECT_ID" \
		--repository-format docker \
		--location "$ARTIFACT_LOCATION" \
		--description "PET_Slay container images"
fi

if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project "$GCP_PROJECT_ID" >/dev/null 2>&1; then
	run gcloud iam service-accounts create "$SERVICE_ACCOUNT_ID" \
		--project "$GCP_PROJECT_ID" \
		--display-name "PET_Slay stage deployer"
fi

if ! gcloud iam workload-identity-pools describe "$WORKLOAD_POOL_ID" --location global --project "$GCP_PROJECT_ID" >/dev/null 2>&1; then
	run gcloud iam workload-identity-pools create "$WORKLOAD_POOL_ID" \
		--project "$GCP_PROJECT_ID" \
		--location global \
		--display-name "PET_Slay GitHub Actions"
fi

if ! gcloud iam workload-identity-pools providers describe "$WORKLOAD_PROVIDER_ID" --workload-identity-pool "$WORKLOAD_POOL_ID" --location global --project "$GCP_PROJECT_ID" >/dev/null 2>&1; then
	run gcloud iam workload-identity-pools providers create-oidc "$WORKLOAD_PROVIDER_ID" \
		--project "$GCP_PROJECT_ID" \
		--location global \
		--workload-identity-pool "$WORKLOAD_POOL_ID" \
		--display-name "GitHub Actions" \
		--issuer-uri "https://token.actions.githubusercontent.com" \
		--attribute-mapping "google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
		--attribute-condition "attribute.repository == '${GITHUB_REPOSITORY}'"
fi

for role in \
	roles/run.admin \
	roles/artifactregistry.writer \
	roles/iam.serviceAccountUser; do
	run gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
		--member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
		--role "$role" \
		--condition None
done

run gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
	--project "$GCP_PROJECT_ID" \
	--member "$REPOSITORY_PRINCIPAL" \
	--role roles/iam.workloadIdentityUser

cat <<EOF

Add these GitHub secrets to the PET_Slay repository:

GCP_PROJECT_ID=${GCP_PROJECT_ID}
GCP_WORKLOAD_IDENTITY_PROVIDER=${WORKLOAD_PROVIDER_RESOURCE}
GCP_SERVICE_ACCOUNT_EMAIL=${SERVICE_ACCOUNT_EMAIL}

Also add the stage runtime secrets:

STAGE_DATABASE_URL=<stage database url>
STAGE_SUPABASE_URL=<stage supabase url>
STAGE_SUPABASE_ANON_KEY=<stage supabase anon key>
STAGE_SUPABASE_SERVICE_ROLE_KEY=<stage supabase service role key>

Optional secrets:

GCP_REGION=${GCP_REGION}
CLOUD_RUN_SERVICE_STAGE=pet-slay-api-stage
EOF

