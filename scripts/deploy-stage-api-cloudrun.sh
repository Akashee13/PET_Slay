#!/usr/bin/env sh

set -eu

if [ -z "${GCP_PROJECT_ID:-}" ]; then
  echo "GCP_PROJECT_ID is required." >&2
  exit 1
fi

if [ -z "${STAGE_DATABASE_URL:-}" ]; then
  echo "STAGE_DATABASE_URL is required." >&2
  exit 1
fi

if [ -z "${STAGE_SUPABASE_URL:-}" ]; then
  echo "STAGE_SUPABASE_URL is required." >&2
  exit 1
fi

if [ -z "${STAGE_SUPABASE_ANON_KEY:-}" ]; then
  echo "STAGE_SUPABASE_ANON_KEY is required." >&2
  exit 1
fi

if [ -z "${STAGE_SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "STAGE_SUPABASE_SERVICE_ROLE_KEY is required." >&2
  exit 1
fi

scripts/validate-stage-database-url.sh

STAGE_ADMIN_BEARER_TOKEN="${STAGE_ADMIN_BEARER_TOKEN:-}"
FOUNDER_ADMIN_BEARER_TOKEN="${FOUNDER_ADMIN_BEARER_TOKEN:-}"

CLOUD_RUN_REGION="${CLOUD_RUN_REGION:-asia-south1}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-pet-slay-api-stage}"
IMAGE_TAG="${IMAGE_TAG:-stage-latest}"

echo "Deploying PET_Slay API to Cloud Run stage..."
echo "Project: ${GCP_PROJECT_ID}"
echo "Region: ${CLOUD_RUN_REGION}"
echo "Service: ${CLOUD_RUN_SERVICE}"
echo "Image tag: ${IMAGE_TAG}"

gcloud auth configure-docker us-docker.pkg.dev --quiet

docker build -t "us-docker.pkg.dev/${GCP_PROJECT_ID}/pet-slay/pet-slay-api:${IMAGE_TAG}" apps/api
docker push "us-docker.pkg.dev/${GCP_PROJECT_ID}/pet-slay/pet-slay-api:${IMAGE_TAG}"

gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --project "${GCP_PROJECT_ID}" \
  --region "${CLOUD_RUN_REGION}" \
  --platform managed \
  --image "us-docker.pkg.dev/${GCP_PROJECT_ID}/pet-slay/pet-slay-api:${IMAGE_TAG}" \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "APP_ENV=stage,DATABASE_REQUIRED=true,DATABASE_URL=${STAGE_DATABASE_URL},SUPABASE_URL=${STAGE_SUPABASE_URL},SUPABASE_ANON_KEY=${STAGE_SUPABASE_ANON_KEY},SUPABASE_SERVICE_ROLE_KEY=${STAGE_SUPABASE_SERVICE_ROLE_KEY},STAGE_ADMIN_BEARER_TOKEN=${STAGE_ADMIN_BEARER_TOKEN},FOUNDER_ADMIN_BEARER_TOKEN=${FOUNDER_ADMIN_BEARER_TOKEN}"

echo "Stage URL:"
gcloud run services describe "${CLOUD_RUN_SERVICE}" \
  --project "${GCP_PROJECT_ID}" \
  --region "${CLOUD_RUN_REGION}" \
  --format='value(status.url)'
