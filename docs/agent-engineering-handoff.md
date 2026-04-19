# Engineering Handoff

## Read Order Contract

- Incoming agents must read `docs/agent-kickoff.md` first.
- Read this handoff file second when implementation, testing, or deployment execution is required.
- After each commit or milestone, refresh both docs using `docs/agent-update-template.md`.

## Workspace

- Repo root: `/Users/akash/Documents/PetProjects/PET_Slay`
- Branch: `001-wholesale-fashion-platform`
- Primary feature folder: `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform`
- Last refreshed: `2026-04-19`

## Product Decisions

- Wholesale-first platform for reseller buyers, extensible to D2C later.
- Buyer app is mobile-first React Native for iOS and Android.
- Admin app is web-first.
- Backend is Go.
- Languages: English, Hindi, Hinglish.
- Refunds: store credit by default, admin override to source payment.
- Notifications: new arrivals + trend prompts, must feel relevant rather than spammy.

## Infra and Stage

- GCP project: `pet-slay`
- GitHub repo: `Akashee13/PET_Slay`
- Stage API URL: `https://pet-slay-api-stage-j67sekma7a-el.a.run.app`
- Stage Admin target URL: `https://pet-slay-admin-stage-j67sekma7a-el.a.run.app`
- Deploy path: GitHub Actions -> OIDC -> Cloud Run
- Supabase stage project exists and GitHub stage secrets have been populated

## Key Docs

- Spec tasks: `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/tasks.md`
- User flows: `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/user-flows.md`
- Persistence design: `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/backend-persistence.md`
- API contract: `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/contracts/openapi.yaml`
- Stage runbook: `/Users/akash/Documents/PetProjects/PET_Slay/docs/stage-live-plan.md`

## Backend Progress

- Added `DATABASE_URL` and `DATABASE_REQUIRED` support.
- Added `/health/ready` for database-aware readiness.
- Added migration loader + `cmd/migrate`.
- Added idempotent migration tracking using `schema_migrations` table.
- Changed migration application to transactional per file with rollback on failure.
- Added migration tests for skip-already-applied and rollback behavior.
- Added Postgres-backed repositories for:
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/users/`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/refunds/`
- Added buyer order history and refund visibility.
- Added admin order status update API.
- Updated Cloud Run stage workflow to run `go run ./cmd/migrate` before deploy.
- Updated Cloud Run and Kubernetes stage configs to set `DATABASE_REQUIRED=true`.
- Updated Kubernetes readiness probe path to `/health/ready`.
- Added idempotent stage catalog seeding script at `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/scripts/seed-stage-catalog.sh`.
- Added stage verification script at `/Users/akash/Documents/PetProjects/PET_Slay/scripts/verify-stage-api.sh`.
- Completed `T044` by splitting device token + readiness logic into dedicated files:
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/device_tokens_handler.go`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/device_tokens_service.go`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/device_tokens_service_test.go`
- Updated `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/httpserver/server.go` to use `DeviceTokenService` for `/v1/buyers/device-tokens`.
- Added mobile scaffold `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/services/notifications.ts` for token registration + readiness evaluation.

## Tasks Status

- Completed in backend persistence phase:
  - `T055`
  - `T056`
  - `T057`
  - `T058`
  - `T059`
  - `T060`
  - `T061`
  - `T062`
  - `T063`
  - `T064`
  - `T065`
- Still open and most immediate:
  - `T066` validate migration job + readiness in live stage environment and finalize DB activation
- Remaining API-app implementation tasks (from `tasks.md`): `T028`, `T038`, `T050`, `T052`, `T053` (and `T066` for stage ops completion)
- Most mobile/admin UI tasks remain open in Phases 3-5.
- Admin web now has a minimal operational slice implemented and build-verified for stage usage:
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/page.tsx`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/layout.tsx`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/orders/page.tsx`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/orders/[orderId]/page.tsx`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/products/page.tsx`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/products/[productId]/page.tsx`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/services/admin-api.ts`
- Admin Cloud Run stage deployment workflow and scripts are added:
  - `/Users/akash/Documents/PetProjects/PET_Slay/.github/workflows/deploy-stage-admin-cloudrun.yml`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/Dockerfile`
  - `/Users/akash/Documents/PetProjects/PET_Slay/scripts/deploy-stage-admin-cloudrun.sh`
  - `/Users/akash/Documents/PetProjects/PET_Slay/scripts/verify-stage-admin-web.sh`

## Known Caveats

- Initial SQL file (`0001_initial_schema.sql`) is still not internally idempotent, but reruns are now guarded by `schema_migrations` tracking.
- Latest `scripts/verify-stage-api.sh` run against stage returned `databaseConfigured=false` and `databaseRequired=false`, indicating the new deployment settings are not yet active on the running service.
- Mobile workspace-wide typecheck currently fails on pre-existing issues in `apps/mobile/src/i18n/index.ts` and `apps/mobile/src/services/supabase.ts`; the new `apps/mobile/src/services/notifications.ts` file typechecks in isolation.
- Admin UI currently uses manual bearer token entry (no Supabase auth wiring yet) to accelerate stage operations.
- Current machine cannot run direct deploy because `gcloud` CLI is not installed; use GitHub Actions workflow for first admin stage rollout.
- `https://pet-slay-admin-stage-j67sekma7a-el.a.run.app` currently returns 404 until the first admin deploy completes.

## Best Next Technical Path

1. Trigger `Deploy Stage API (Cloud Run)` workflow on `001-wholesale-fashion-platform`.
2. Confirm migration step logs success and no duplicate-apply failures.
3. Verify `/health/ready` on stage shows `status=ready`, `databaseConfigured=true`, `databaseRequired=true` via `/Users/akash/Documents/PetProjects/PET_Slay/scripts/verify-stage-api.sh`.
4. Seed minimal catalog rows for live verification via `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/scripts/seed-stage-catalog.sh`.
5. Verify DB-backed buyer/admin endpoints against stage (set `BUYER_BEARER_TOKEN` for authenticated checks in verification script).
6. Run `Deploy Stage Admin (Cloud Run)` workflow and verify `https://pet-slay-admin-stage-j67sekma7a-el.a.run.app` responds with 200.
7. Smoke test `/orders` and `/products` with admin token against stage API.
8. Continue API hardening tasks in order: `T050` (campaign relevance safeguards), `T052` (security/role boundary hardening), `T053` (catalog payload optimization).

## Working Style

- Prefer TDD: failing test/harness first, then implementation.
- Continue without pausing unless blocked by truly missing product input.
- Treat spec-kit artifacts as the source of truth for sequence and scope.
- Never revert unrelated local changes.

## Milestone Update Checklist

- Update "What changed in this step" with commit/milestone deltas.
- Update "Files worth reading first" to point at changed hotspots.
- Update "Tests/verification run" with exact commands and outcomes.
- Update open/completed task IDs in `specs/001-wholesale-fashion-platform/tasks.md` when scope changes.
- Refresh `docs/agent-kickoff.md` and this file together; do not update only one.
