# Agent Kickoff

## Agent Onboarding Order

1. Read this file first (`docs/agent-kickoff.md`) for high-level context.
2. If you are expected to execute code, deploy, or run tests, then read `docs/agent-engineering-handoff.md` next.
3. After each meaningful commit or milestone, refresh both docs using `docs/agent-update-template.md`.

## Snapshot

- Project: `PET_Slay`
- Repo: `/Users/akash/Documents/PetProjects/PET_Slay`
- Branch: `001-wholesale-fashion-platform`
- Stage API: `https://pet-slay-api-stage-j67sekma7a-el.a.run.app`
- Stage Admin target URL: `https://pet-slay-admin-stage-j67sekma7a-el.a.run.app`
- Architecture: React Native buyer app, Next.js admin app, Go API, Supabase-backed Postgres/Auth/Storage
- Last refreshed: `2026-04-19`

## Product Context

- Build a wholesale-first fast fashion platform for reseller buyers, extensible to D2C later.
- Initial assortment is women's wear with western and South Asian styles.
- Core value props are affordable pricing, catalog freshness, trend accuracy, manufacturing control, and speed.
- Refunds should default to store credit, with admin override to source payment.
- Notifications should drive conversion without spamming buyers.
- UX must support English, Hindi, and Hinglish.
- Core early market is North India, with operations centered in Delhi.

## Delivery Context

- Follow spec-kit workflow for new scope: spec -> plan -> tasks -> implementation.
- TDD is required for implementation work.
- Backend and DevOps work should be treated with the same spec-driven discipline as product features.

## Current System Status

- GCP stage project `pet-slay` is configured.
- GitHub Actions deploy to Cloud Run is working via OIDC.
- Supabase stage project exists and stage secrets are configured in GitHub Actions.
- Backend has progressed from in-memory scaffolding to mostly Postgres-backed repositories.
- Stage deploy pipeline now includes DB migration execution and readiness enforcement flags, but current live stage still reports `databaseConfigured=false` and `databaseRequired=false` until the new workflow run is applied.

## What Is Already Done

- Derived user flows in `specs/001-wholesale-fashion-platform/user-flows.md`.
- Documented backend persistence in `specs/001-wholesale-fashion-platform/backend-persistence.md`.
- Updated API contract in `specs/001-wholesale-fashion-platform/contracts/openapi.yaml`.
- Added Go migration loader and migration command.
- Added idempotent migration tracking via `schema_migrations` with transactional per-file apply.
- Added `/health/ready` endpoint and database readiness config.
- Updated stage Cloud Run deploy workflow/script to set `DATABASE_REQUIRED=true`.
- Updated Kubernetes stage readiness probe to use `/health/ready` and stage config to set `DATABASE_REQUIRED=true`.
- Added Postgres-backed repositories for:
  - buyer preferences
  - catalog
  - orders
  - notifications
  - refunds
- Deployed backend to stage and verified health endpoints.
- Added `scripts/refresh-agent-docs.sh` to scaffold milestone updates for agent handoff docs.
- Added `apps/api/scripts/seed-stage-catalog.sh` for idempotent minimal stage catalog seeding.
- Added `scripts/verify-stage-api.sh` for health/readiness checks plus optional authenticated catalog verification.
- Completed `T044` backend split for device token registration + buyer notification-readiness service:
  - `apps/api/internal/notifications/device_tokens_handler.go`
  - `apps/api/internal/notifications/device_tokens_service.go`
  - `apps/api/internal/notifications/device_tokens_service_test.go`
- Added mobile notification integration scaffold in `apps/mobile/src/services/notifications.ts`.
- Added stage-first admin web operational slice:
  - token-based admin session gate at `apps/admin/app/page.tsx` and `apps/admin/src/features/auth/admin-session.ts`
  - protected admin shell at `apps/admin/app/(protected)/layout.tsx`
  - orders queue + status update screens at `apps/admin/app/(protected)/orders/`
  - products create/update screens at `apps/admin/app/(protected)/products/`
  - API client for admin operations at `apps/admin/src/services/admin-api.ts`
- Added admin Cloud Run deployment path:
  - `apps/admin/Dockerfile`
  - `.github/workflows/deploy-stage-admin-cloudrun.yml`
  - `scripts/deploy-stage-admin-cloudrun.sh`
  - `scripts/verify-stage-admin-web.sh`
- Added responsive admin global styles in `apps/admin/app/globals.css` for mobile and desktop layouts.

## Next Recommended Work

1. Trigger stage deploy workflow and confirm migration step succeeds with stage secrets.
2. Run `scripts/verify-stage-api.sh` and confirm `/health/ready` reports `databaseConfigured=true` and `databaseRequired=true`.
3. Run `apps/api/scripts/seed-stage-catalog.sh` with stage `DATABASE_URL`.
4. Re-run `scripts/verify-stage-api.sh` with `BUYER_BEARER_TOKEN` to verify DB-backed catalog endpoint.
5. Execute `Deploy Stage Admin (Cloud Run)` workflow and verify `https://pet-slay-admin-stage-j67sekma7a-el.a.run.app` returns 200 (currently returns 404 until first deploy).

## Milestone Refresh Rule

- At each commit/milestone, copy `docs/agent-update-template.md` and use it to refresh:
  - `docs/agent-kickoff.md` (snapshot + next recommended work)
  - `docs/agent-engineering-handoff.md` (engineering state + run/deploy/test details)
- Keep updates concise, factual, and free of secrets.

## Important Constraints

- Do not ask for secrets already stored in GitHub unless absolutely necessary.
- Do not repeat sensitive Supabase values in chat.
- Avoid destructive git operations.
- Assume the repo may contain user or parallel-agent edits; do not revert unrelated changes.
