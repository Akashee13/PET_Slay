# PET_Slay

Wholesale-first fashion platform for reseller buyers, with:

- a mobile-first reseller app
- a web-first admin app
- a Go backend API

## Workspace Layout

```text
apps/
├── mobile/   # Expo React Native reseller app
├── admin/    # Next.js admin app
└── api/      # Go API service

packages/
├── config/         # Shared tooling config
├── design-tokens/  # Shared UI and localization assets
└── types/          # Shared app contracts and types
```

## Getting Started

1. Copy `.env.example` into the environment files you need.
   Available profiles:
   - `.env.local.example`
   - `.env.stage.example`
   - `.env.prod.example`
2. Install workspace dependencies with `pnpm install`.
3. Scaffold or expand each app before running product commands.

## Recommended Dev Mode

Use a **local-light, remote-managed** workflow.

- Keep database/auth/storage remote
- Prefer deploying the Go API remotely once real endpoints exist
- Run mobile/admin locally only when needed

See:

- [docs/development-workflow.md](/Users/akash/Documents/PetProjects/PET_Slay/docs/development-workflow.md)
- [specs/001-wholesale-fashion-platform/deployment.md](/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/deployment.md)

## CI/CD

### API Stage (Primary, easiest)

- GitHub Actions workflow: `.github/workflows/deploy-stage-api-cloudrun.yml`
- Target: Google Cloud Run service `pet-slay-api-stage`
- Trigger: push to `001-wholesale-fashion-platform` for `apps/api/**` changes

Manual fallback script:

- `scripts/deploy-stage-api-cloudrun.sh`

### API Stage (Optional later)

If/when Kubernetes stage infra is ready, use:

- `.github/workflows/deploy-stage-api.yml`
- `scripts/deploy-stage-api.sh`
- `deploy/k8s/stage/**`

## Current Status

The repository currently contains:

- monorepo root configuration
- app shell scaffolds
- spec-kit product, architecture, and task artifacts

Implementation is in progress from the `001-wholesale-fashion-platform` task
backlog.
