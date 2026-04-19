#!/usr/bin/env sh

set -eu

if [ -z "${GCP_PROJECT_ID:-}" ]; then
  echo "GCP_PROJECT_ID is required." >&2
  exit 1
fi

CLOUD_RUN_REGION="${CLOUD_RUN_REGION:-asia-south1}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-pet-slay-admin-stage}"
IMAGE_TAG="${IMAGE_TAG:-stage-latest}"
STAGE_API_BASE_URL="${STAGE_API_BASE_URL:-https://pet-slay-api-stage-j67sekma7a-el.a.run.app}"
STAGE_SUPABASE_URL="${STAGE_SUPABASE_URL:-}"
STAGE_SUPABASE_ANON_KEY="${STAGE_SUPABASE_ANON_KEY:-}"
STAGE_SUPABASE_STORAGE_BUCKET="${STAGE_SUPABASE_STORAGE_BUCKET:-product-images}"

echo "Deploying PET_Slay Admin to Cloud Run stage..."
echo "Project: ${GCP_PROJECT_ID}"
echo "Region: ${CLOUD_RUN_REGION}"
echo "Service: ${CLOUD_RUN_SERVICE}"
echo "Image tag: ${IMAGE_TAG}"
echo "Stage API base URL: ${STAGE_API_BASE_URL}"
echo "Stage Supabase URL configured: $( [ -n "${STAGE_SUPABASE_URL}" ] && echo yes || echo no )"
echo "Stage Supabase anon key configured: $( [ -n "${STAGE_SUPABASE_ANON_KEY}" ] && echo yes || echo no )"
echo "Stage Supabase storage bucket: ${STAGE_SUPABASE_STORAGE_BUCKET}"

gcloud auth configure-docker us-docker.pkg.dev --quiet

docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL="${STAGE_API_BASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${STAGE_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${STAGE_SUPABASE_ANON_KEY}" \
  --build-arg NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="${STAGE_SUPABASE_STORAGE_BUCKET}" \
  -f apps/admin/Dockerfile \
  -t "us-docker.pkg.dev/${GCP_PROJECT_ID}/pet-slay/pet-slay-admin:${IMAGE_TAG}" .
docker push "us-docker.pkg.dev/${GCP_PROJECT_ID}/pet-slay/pet-slay-admin:${IMAGE_TAG}"

gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --project "${GCP_PROJECT_ID}" \
  --region "${CLOUD_RUN_REGION}" \
  --platform managed \
  --image "us-docker.pkg.dev/${GCP_PROJECT_ID}/pet-slay/pet-slay-admin:${IMAGE_TAG}" \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "NEXT_PUBLIC_API_BASE_URL=${STAGE_API_BASE_URL},NEXT_PUBLIC_SUPABASE_URL=${STAGE_SUPABASE_URL},NEXT_PUBLIC_SUPABASE_ANON_KEY=${STAGE_SUPABASE_ANON_KEY},NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=${STAGE_SUPABASE_STORAGE_BUCKET}"

echo "Stage Admin URL:"
gcloud run services describe "${CLOUD_RUN_SERVICE}" \
  --project "${GCP_PROJECT_ID}" \
  --region "${CLOUD_RUN_REGION}" \
  --format='value(status.url)'
