# Engineering Handoff

## Read Order Contract

- Incoming agents must read `docs/agent-kickoff.md` first.
- Read this handoff file second when implementation, testing, or deployment execution is required.
- After each commit or milestone, refresh both docs using `docs/agent-update-template.md`.

## Workspace

- Repo root: `/Users/akash/Documents/PetProjects/PET_Slay`
- Branch: `001-wholesale-fashion-platform`
- Primary feature folder: `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform`
- Last refreshed: `2026-04-20`

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
- Stage API readiness is live with `databaseConfigured=true` and `databaseRequired=true`

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
- Added admin products list API (`GET /v1/admin/products`) for operator visibility of all catalog uploads.
- Added product media persistence (`imageUrls`) via migration:
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/db/migrations/0002_add_product_media_urls.sql`
- Updated catalog service/repository create/update/list/get to support:
  - `imageUrls` (up to 5)
  - `coverImageUrl` derived from first image
- Expanded contract/integration tests for admin product media and list behavior:
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/contract/us2_admin_operations_contract_test.go`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/integration/us2_admin_operations_integration_test.go`
- Added stage DB URL shape validation:
  - `/Users/akash/Documents/PetProjects/PET_Slay/scripts/validate-stage-database-url.sh`
  - API deploy workflow calls it during secret validation.
  - Local Cloud Run deploy script calls it before build/deploy.
  - Stage migration step no longer skips placeholder URLs; invalid DB configuration fails before deploy.
- Completed `T050` campaign safeguards:
  - API policy now validates campaign type, product context, supported language, duplicate language variants, and meaningful localized title/body length.
  - Admin validation helper added at `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/campaigns/campaign-validation.ts`.
  - Contract/integration fixtures updated to use conversion-oriented copy.
- Started `T052` API role-boundary hardening:
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/auth/static_verifier.go` now rejects static dev tokens outside local/dev/test unless `ALLOW_DEV_TOKENS=true`.
  - `STAGE_ADMIN_BEARER_TOKEN` remains supported for current stage admin operations.
  - Tests added in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/auth/static_verifier_test.go`.
- Added product listing lifecycle:
  - migration `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/db/migrations/0003_product_listing_lifecycle.sql`
  - `listingStatus` and `visibleUntil` included in product payloads.
  - new products default to `listed` for 60 days.
  - buyer catalog/detail/variant lookup only expose listed and non-expired products.
  - admin product list shows all products regardless of listing status.
  - admin patch supports `listingAction: "list_now" | "unlist_now"`.
- Added admin listed-products table:
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/listed-products/page.tsx`
  - list/unlist/patch actions available from a real table.
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/i18n/admin-language.tsx` makes language toggle update nav/page copy.

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
- Completed in re-engagement/refunds hardening:
  - `T050`
- Completed in admin UI:
  - `T036`
- Started, not complete:
  - `T052`
- Still open and most immediate:
  - `T066` validate migration job + readiness in live stage environment and finalize DB activation
- Remaining API-app implementation tasks (from `tasks.md`): `T028`, `T038`, `T052`, `T053` (and `T066` for stage ops completion)
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
- Admin command-desk UX upgrades now live on stage:
  - light default theme with persisted light/dusk toggle
  - PET_Slay logo mark in top bar
  - language selector (English/Hindi/Hinglish)
  - business-facing copy and KPI framing
- Admin now supports direct image file uploads for product create/update through Supabase Storage:
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/services/product-image-upload.ts`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/products/page.tsx`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/products/[productId]/page.tsx`
- Admin deploy pipeline now passes Supabase public env vars into build/runtime:
  - `/Users/akash/Documents/PetProjects/PET_Slay/.github/workflows/deploy-stage-admin-cloudrun.yml`
  - `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/Dockerfile`
  - `/Users/akash/Documents/PetProjects/PET_Slay/scripts/deploy-stage-admin-cloudrun.sh`
- Admin product media UX now supports additive multiple file selection:
  - shared helper: `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/products/file-selection.ts`
  - create/update form: `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/products/page.tsx`
  - product detail patch form: `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/products/[productId]/page.tsx`
- Admin listed-products PLP now renders multiple images per product in a horizontal, swipeable, auto-scrolling gallery:
  - page: `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/listed-products/page.tsx`
  - styles: `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/globals.css`

## Known Caveats

- Initial SQL file (`0001_initial_schema.sql`) is still not internally idempotent, but reruns are now guarded by `schema_migrations` tracking.
- Admin `npm run lint` currently cannot run locally because `eslint` is not listed in `apps/admin/package.json` devDependencies.
- Admin `npm test` currently runs a placeholder command only; add real UI/component tests for file selection and PLP galleries.
- Mobile workspace-wide typecheck currently fails on pre-existing issues in `apps/mobile/src/i18n/index.ts` and `apps/mobile/src/services/supabase.ts`; the new `apps/mobile/src/services/notifications.ts` file typechecks in isolation.
- Admin UI currently uses manual bearer token entry (no Supabase auth wiring yet) to accelerate stage operations.
- Supabase Storage bucket/policy migration exists for default bucket `product-images`; continue to smoke test uploads after each admin/API deploy.

## Best Next Technical Path

1. Validate admin product persistence and multi-image upload end-to-end on stage.
2. Validate `/listed-products` PLP carousel, list/unlist, and patch actions on stage.
3. Add real admin UI/component tests for image file selection and gallery rendering.
4. Continue API hardening tasks in order: `T052` (security/role boundary hardening), `T053` (catalog payload optimization).

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
