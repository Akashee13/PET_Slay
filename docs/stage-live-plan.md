# Stage Live Plan

## Goal

Make the project meaningfully live in `stage` with a remote-first setup.

## What “live in stage” means right now

### API
- deployed remotely
- reachable through a stage URL
- backed by stage secrets/config

### Admin
- deployed remotely as a stage shell
- pointed at stage API and stage Supabase config

### Mobile
- not a public app-store release
- uses stage API and stage Supabase config
- tested through Expo/device builds against stage services

## Practical Stage Sequence

1. Create stage Supabase project/resources
2. Create GCP project and enable startup-credit-friendly services
3. Deploy API to Cloud Run stage using GitHub Actions
4. (Optional later) Move API to Kubernetes stage cluster
5. Deploy admin app with stage env vars
6. Point mobile dev/stage config to stage API

## Current Reality

The API is closest to being stage-deployable first.

The admin app is still mostly a shell.

The mobile app is also still a shell and will use stage services mainly for
development and validation rather than formal release.

## Required Credentials / Infra Inputs

- GCP project
- Artifact Registry repo
- Supabase stage project values
- Cloud Run service name and region
- Vercel stage project config if admin stays on Vercel

## Recommended CI/CD (Easiest Path)

Use GitHub Actions + Cloud Run first:

- workflow: `.github/workflows/deploy-stage-api-cloudrun.yml`
- trigger: push to `001-wholesale-fashion-platform` when `apps/api/**` changes
- manual override: workflow dispatch with optional `image_tag`, `region`, `service`

This avoids stage-cluster bootstrap work while still giving a real remote stage API.

## GitHub Actions Secret Contract (`deploy-stage-api-cloudrun.yml`)

Required repository or environment secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_PROJECT_ID`
- `STAGE_DATABASE_URL`
- `STAGE_SUPABASE_URL`
- `STAGE_SUPABASE_ANON_KEY`
- `STAGE_SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `GCP_REGION` (defaults to `asia-south1`)
- `CLOUD_RUN_SERVICE_STAGE` (defaults to `pet-slay-api-stage`)

If any of these are missing, the workflow now fails immediately before build/deploy.

## One-Time Cloud Run Setup

### Recommended Scripted Setup

Use the setup script once per GCP project after you have chosen or created the
stage project:

```bash
GCP_PROJECT_ID=your-project-id \
GITHUB_REPOSITORY=Akashee13/PET_Slay \
DRY_RUN=true \
scripts/setup-gcp-github-oidc.sh
```

If the dry-run output looks correct, run it without `DRY_RUN=true`:

```bash
GCP_PROJECT_ID=your-project-id \
GITHUB_REPOSITORY=Akashee13/PET_Slay \
scripts/setup-gcp-github-oidc.sh
```

The script enables required APIs, creates the `pet-slay` Artifact Registry
Docker repository when missing, creates a stage deploy service account, creates
the GitHub Workload Identity pool/provider, and prints the exact GitHub secrets
for Actions.

### Manual Equivalent

1. Enable required APIs:
	- `gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com iamcredentials.googleapis.com --project "$GCP_PROJECT_ID"`
2. Create Artifact Registry repo once:
	- `gcloud artifacts repositories create pet-slay --repository-format=docker --location=us --description="PET_Slay containers" --project "$GCP_PROJECT_ID"`
3. Create a deploy service account:
	- `gcloud iam service-accounts create pet-slay-stage-deployer --display-name "PET_Slay stage deployer" --project "$GCP_PROJECT_ID"`
4. Bind deploy permissions:
	- `roles/run.admin`
	- `roles/artifactregistry.writer`
	- `roles/iam.serviceAccountUser`
5. Create GitHub Workload Identity binding for `Akashee13/PET_Slay`.
6. Add the printed `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT_EMAIL`, and `GCP_PROJECT_ID` values to GitHub secrets.

## First API Stage Deploy (Manual)

1. Build and push image to Artifact Registry with an explicit tag:
	- `docker build -t us-docker.pkg.dev/$GCP_PROJECT_ID/pet-slay/pet-slay-api:$IMAGE_TAG apps/api`
	- `docker push us-docker.pkg.dev/$GCP_PROJECT_ID/pet-slay/pet-slay-api:$IMAGE_TAG`
2. Deploy to Cloud Run stage:
	- `GCP_PROJECT_ID=your-project IMAGE_TAG=your-tag STAGE_DATABASE_URL='...' STAGE_SUPABASE_URL='...' STAGE_SUPABASE_ANON_KEY='...' STAGE_SUPABASE_SERVICE_ROLE_KEY='...' scripts/deploy-stage-api-cloudrun.sh`

## First API Stage Deploy (GitHub Actions)

1. Open Actions → `Deploy Stage API (Cloud Run)`.
2. Run workflow dispatch and optionally set `image_tag`.
3. Confirm job passes `Validate required secrets`, `Build and push API image`, and `Deploy API to Cloud Run stage`.

## Post-Deploy Verification

- Current stage API URL:
	- `https://pet-slay-api-stage-j67sekma7a-el.a.run.app`
- `gcloud run services describe pet-slay-api-stage --region=asia-south1 --format='value(status.url)'`
- `curl "$(gcloud run services describe pet-slay-api-stage --region=asia-south1 --format='value(status.url)')/health"`

## Local Validation Before Deploy

- `sh scripts/validate-stage-deployment-scripts.sh`
- `env GOCACHE=/tmp/go-build-cache GOMODCACHE=/tmp/go-mod-cache go test ./...` from `apps/api`

## Optional Later Upgrade: Kubernetes

When traffic/ops maturity justifies it, use the existing Kubernetes pipeline:

- workflow: `.github/workflows/deploy-stage-api.yml`
- script: `scripts/deploy-stage-api.sh`
- manifests: `deploy/k8s/stage/**`
