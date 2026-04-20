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
- Last refreshed: `2026-04-20`

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
- UX/UI must deeply reduce user anxiety with clear loading, success, error, and recovery states while preserving consistent platform design language.

## Current System Status

- GCP stage project `pet-slay` is configured.
- GitHub Actions deploy to Cloud Run is working via OIDC.
- Supabase stage project exists and stage secrets are configured in GitHub Actions.
- Backend has progressed from in-memory scaffolding to mostly Postgres-backed repositories.
- Stage deploy pipeline includes DB migration execution and readiness enforcement flags.
- Current live stage readiness reports `databaseConfigured=true` and `databaseRequired=true`.
- Stage API and stage admin have both deployed successfully through GitHub Actions after Supabase DB activation.

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
- Upgraded admin UI command-desk language with:
  - default light theme and persisted light/dusk theme toggle
  - creative PET_Slay logo mark
  - language selector (English/Hindi/Hinglish)
  - business-facing copy for catalog and order operations
- Added admin product visibility/listing endpoint support and UI section to review all uploaded products.
- Added product media persistence support in API with `imageUrls` and `coverImageUrl`:
  - migration: `apps/api/db/migrations/0002_add_product_media_urls.sql`
  - repository/service updates for create/update/list/get
  - integration + contract test updates
- Added direct image file upload from admin product forms via Supabase Storage:
  - service: `apps/admin/src/services/product-image-upload.ts`
  - create/update/detail upload inputs wired in products pages
  - upload validation for max 5 images and supported file types
- Updated admin deploy path to inject Supabase public env values during build/runtime:
  - `.github/workflows/deploy-stage-admin-cloudrun.yml`
  - `apps/admin/Dockerfile`
  - `scripts/deploy-stage-admin-cloudrun.sh`
- Added strict stage DB URL validation:
  - `scripts/validate-stage-database-url.sh`
  - API deploy workflow and local deploy script now fail early for placeholder/non-live DB URLs instead of silently skipping migrations.
- Completed campaign relevance safeguards and multilingual validation (`T050`):
  - API rejects unsupported campaign types, missing product context, unsupported languages, duplicate languages, and generic short copy.
  - Admin helper mirrors these rules in `apps/admin/src/features/campaigns/campaign-validation.ts`.
- Started `T052` security hardening:
  - `dev-buyer-token` and `dev-admin-token` are now local/test-only.
  - Stage/prod can still use `STAGE_ADMIN_BEARER_TOKEN` until Supabase admin auth is wired.
  - Stage also supports `FOUNDER_ADMIN_BEARER_TOKEN` as a stable founder-only admin access token until proper admin auth is wired.
- Added product listing lifecycle and admin table UX:
  - Products default to `listed` with a 60-day `visibleUntil` window.
  - Buyer catalog hides unlisted or expired products.
  - Admin list remains all-products and can `list_now` or `unlist_now`.
  - New admin tab `/listed-products` shows a product table with list/unlist/patch actions.
  - Admin language selector now drives visible nav/page copy through React context.
- Added admin PLP + media UX refinements:
  - Authenticated admin landing page defaults to `/listed-products`.
  - Listed-products page uses a PLP-style card grid inspired by lightweight fashion collection pages.
  - Product upload controls now accumulate multiple selected image files, support remove-before-submit chips, and keep the 5-image product cap.
  - Product creation requires at least one device-uploaded image; manual image URL fields are hidden from admin forms for now.
  - Product create/update and detail patch/list actions show disabled button states, spinner feedback, and full-page progress overlays for long-running operations.
  - Listed product cards show multiple product images in a discrete step carousel with smoother transitions and no helper copy.
- Amended the project constitution to v1.3.0 with an anxiety-reducing UX and consistent design language principle.
- Added localization provider guidance in `docs/localization-provider-options.md`: static dictionaries for UI, provider-backed cached translations only for dynamic product/campaign copy.
- Improved admin dusk theme contrast and mobile overflow safety:
  - dusk mode now uses dark surfaces/glass/tile states instead of light cards with light text.
  - hidden file inputs no longer sit at offscreen `left: -9999px`, preventing mobile horizontal page scroll after image selection/submission.
  - long product response payloads and image filename chips wrap safely on narrow screens.
- Localization guidance now prefers Google Cloud Translation for dynamic text because it stays in the GCP ecosystem and has high default quotas; static UI labels should still stay in dictionaries.
- Corrected admin listing workflow:
  - product onboarding includes a default-selected "list immediately to resellers" checkbox.
  - admins can uncheck it to create an unlisted product and list it later from PLP.
  - PLP cards show one contextual list/unlist button instead of two competing actions.
  - "Patch product" is now an "Edit product" tile-style action.

## Next Recommended Work

1. Smoke test admin product create with the list-immediately checkbox checked and unchecked on `https://pet-slay-admin-stage-j67sekma7a-el.a.run.app`.
2. Smoke test contextual list/unlist and edit tile actions on `/listed-products`.
3. Add `packages/i18n` or equivalent shared dictionaries for English, Hindi, and Hinglish UI labels before wiring any external translation provider.
4. Add real admin UI tests for file selection, loading overlays, disabled duplicate actions, and PLP image rendering; current admin `npm test` is only a placeholder.
5. Continue `T052` across admin/mobile auth boundaries, then move to `T053` payload/image/deep-link optimization.

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
