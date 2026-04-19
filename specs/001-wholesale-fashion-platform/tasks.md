---

description: "Task list for Wholesale Fashion Reseller Platform MVP"
---

# Tasks: Wholesale Fashion Reseller Platform MVP

**Input**: Design documents from `/specs/001-wholesale-fashion-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are mandatory because the constitution now requires TDD for all implementation work.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g. `[US1]`, `[US2]`, `[US3]`)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the monorepo structure and baseline tooling required by all surfaces.

- [X] T001 Create monorepo root manifests and workspace configuration in `/Users/akash/Documents/PetProjects/PET_Slay/package.json`, `/Users/akash/Documents/PetProjects/PET_Slay/pnpm-workspace.yaml`, and `/Users/akash/Documents/PetProjects/PET_Slay/turbo.json`
- [X] T002 Create application and package directory skeletons in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/`, `/Users/akash/Documents/PetProjects/PET_Slay/packages/config/`, `/Users/akash/Documents/PetProjects/PET_Slay/packages/design-tokens/`, and `/Users/akash/Documents/PetProjects/PET_Slay/packages/types/`
- [X] T003 [P] Add shared TypeScript, ESLint, and Prettier configuration in `/Users/akash/Documents/PetProjects/PET_Slay/packages/config/tsconfig.base.json`, `/Users/akash/Documents/PetProjects/PET_Slay/packages/config/eslint/base.js`, and `/Users/akash/Documents/PetProjects/PET_Slay/.prettierrc`
- [X] T004 [P] Scaffold the Expo reseller app shell in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/package.json`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/app/_layout.tsx`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/`
- [X] T005 [P] Scaffold the Next.js admin app shell in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/package.json`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/layout.tsx`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/`
- [X] T006 [P] Scaffold the Go API service shell in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/go.mod`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/cmd/server/main.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/`
- [X] T007 [P] Add shared environment examples and developer setup notes in `/Users/akash/Documents/PetProjects/PET_Slay/.env.example` and `/Users/akash/Documents/PetProjects/PET_Slay/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the cross-cutting foundations that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Create the initial shared database schema and migration structure in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/db/migrations/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/store/`
- [X] T009 [P] Add Go database bootstrap and migration commands in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/Makefile` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/scripts/`
- [X] T010 [P] Implement API configuration, validation, middleware, and error handling infrastructure in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/config/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/http/middleware/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/http/response/`
- [X] T011 [P] Implement shared auth/session verification for buyer and admin roles in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/auth/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/users/`
- [X] T012 [P] Add shared API client contracts and DTO exports in `/Users/akash/Documents/PetProjects/PET_Slay/packages/types/src/api.ts` and `/Users/akash/Documents/PetProjects/PET_Slay/packages/types/src/domain.ts`
- [X] T013 [P] Create shared localization resources and language utilities in `/Users/akash/Documents/PetProjects/PET_Slay/packages/design-tokens/src/i18n/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/i18n/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/i18n/`
- [X] T014 [P] Implement Supabase integration wrappers for auth and storage in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/src/common/integrations/supabase/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/services/supabase.ts`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/services/supabase.ts`
- [X] T015 [P] Add contract-validation and Go API integration test harnesses in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/contract/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/integration/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/testutil/`
- [X] T016 [P] Add mobile and admin test harness setup in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/tests/setup.ts`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/jest.config.ts`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/tests/playwright.config.ts`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/tests/setup.ts`

**Checkpoint**: Foundation ready. User story implementation can now begin in priority order or in parallel by staffing.

---

## Phase 3: User Story 1 - Reseller Browses and Orders Inventory (Priority: P1) 🎯 MVP

**Goal**: Deliver the complete reseller buyer journey from sign-in to localized catalog browsing and order placement.

**Independent Test**: Sign in as a reseller on mobile, choose a language, browse new arrivals and categories, open a product detail page, and submit a valid order that appears through the API.

### Tests for User Story 1

- [X] T017 [P] [US1] Add contract tests for `/v1/me`, `/v1/buyers/preferences/language`, `/v1/catalog/products`, `/v1/catalog/products/{productId}`, and `/v1/orders` in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/contract/us1-buyer-flow.contract.spec.ts`
- [X] T018 [P] [US1] Add API integration tests for buyer onboarding, language persistence, catalog listing, and order creation in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/integration/us1-buyer-flow.integration.spec.ts`
- [ ] T019 [P] [US1] Add React Native tests for auth gate, language selection, catalog browse, and order submission in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/tests/us1-buyer-flow.spec.tsx`

### Implementation for User Story 1

- [X] T020 [P] [US1] Implement buyer, product, variant, size profile, order, and order item store models and repositories in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/store/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/`
- [X] T021 [US1] Implement buyer profile and language preference handlers in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/users/handler.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/users/service.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/users/types.go`
- [X] T022 [US1] Implement reseller catalog listing and product detail handlers with availability-state logic in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/handler.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/service.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/types.go`
- [X] T023 [US1] Implement order creation and order detail handlers with MOQ validation in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/handler.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/service.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/types.go`
- [ ] T024 [P] [US1] Implement mobile auth bootstrap and session state in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/state/session-store.ts`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/features/auth/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/app/(auth)/`
- [ ] T025 [P] [US1] Implement mobile language selection and localization plumbing in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/features/language/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/i18n/resources/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/app/(app)/language.tsx`
- [ ] T026 [P] [US1] Implement mobile catalog browse and product detail flows in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/features/catalog/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/app/(app)/index.tsx`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/app/(app)/products/[productId].tsx`
- [ ] T027 [US1] Implement mobile order creation flow and submission feedback in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/features/orders/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/app/(app)/checkout.tsx`
- [ ] T028 [US1] Add buyer-facing analytics and error logging hooks for the P1 flow in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/services/analytics.ts` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/src/common/logging/`

**Checkpoint**: User Story 1 should be fully functional and demoable as the MVP reseller buying flow.

---

## Phase 4: User Story 2 - Admin Manages Catalog and Orders (Priority: P2)

**Goal**: Enable internal operators to maintain catalog freshness, manage availability and pricing, and review incoming orders.

**Independent Test**: Sign in as an admin on the web app, create or update a product, change availability/pricing, and verify that a reseller order is visible in the admin order queue.

### Tests for User Story 2

- [X] T029 [P] [US2] Add contract tests for `/v1/admin/products`, `/v1/admin/products/{productId}`, and `/v1/admin/orders` in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/contract/us2-admin-operations.contract.spec.ts`
- [X] T030 [P] [US2] Add API integration tests for product creation, product updates, and order queue retrieval in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/integration/us2-admin-operations.integration.spec.ts`
- [ ] T031 [P] [US2] Add Playwright tests for admin sign-in, product management, and order review in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/tests/us2-admin-operations.spec.ts`

### Implementation for User Story 2

- [X] T032 [P] [US2] Extend shared database schema for admin operator metadata and catalog operational fields in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/db/migrations/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/store/`
- [X] T033 [US2] Implement admin product create/update handlers and business rules in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/admin_handler.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/admin_service.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/admin_types.go`
- [X] T034 [US2] Implement admin order queue handler and order detail service in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/admin_handler.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/admin_service.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/serializers.go`
- [ ] T035 [P] [US2] Implement admin authentication shell and route protection in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/layout.tsx`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/auth/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/middleware/`
- [ ] T036 [P] [US2] Implement admin product form, list, and inventory editing screens in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/products/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/products/page.tsx`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/products/[productId]/page.tsx`
- [ ] T037 [US2] Implement admin order queue and detail screens in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/orders/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/orders/page.tsx`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/orders/[orderId]/page.tsx`
- [ ] T038 [US2] Add admin-side validation and operational audit logging for catalog and order management in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/products/validators.ts` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/audit/logger.go`

**Checkpoint**: User Stories 1 and 2 both work independently, with admin operations supporting the live reseller catalog and order queue.

---

## Phase 5: User Story 3 - Reseller Re-Engagement and Refund Handling (Priority: P3)

**Goal**: Add conversion-oriented notifications and explicit refund handling with store-credit default behavior and admin exceptions.

**Independent Test**: Register a buyer device for push, create a multilingual notification campaign from admin, send it, and process a refund decision that defaults to store credit unless an admin overrides to payment source.

### Tests for User Story 3

- [X] T039 [P] [US3] Add contract tests for `/v1/admin/notification-campaigns`, `/v1/admin/notification-campaigns/{campaignId}/send`, and `/v1/admin/refunds/{refundId}` in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/contract/us3-reengagement-refunds.contract.spec.ts`
- [X] T040 [P] [US3] Add API integration tests for device token registration, campaign delivery orchestration, and refund decision updates in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/integration/us3-reengagement-refunds.integration.spec.ts`
- [ ] T041 [P] [US3] Add React Native tests for notification preference bootstrapping and refund status visibility in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/tests/us3-buyer-notifications-refunds.spec.tsx`
- [ ] T042 [P] [US3] Add Playwright tests for admin campaign creation and refund exception handling in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/tests/us3-admin-campaigns-refunds.spec.ts`

### Implementation for User Story 3

- [X] T043 [P] [US3] Extend shared database schema for device tokens, notification campaigns, message variants, campaign items, and refund decisions in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/db/migrations/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/store/`
- [ ] T044 [US3] Implement device token registration and buyer notification-readiness services in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/device_tokens_handler.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/device_tokens_service.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/services/notifications.ts`
- [X] T045 [US3] Implement admin campaign creation, validation, and send handlers in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/admin_handler.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/admin_service.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/types.go`
- [X] T046 [US3] Implement refund decision domain logic and admin override handler in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/refunds/handler.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/refunds/service.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/refunds/types.go`
- [ ] T047 [P] [US3] Implement admin campaign composer and send workflow screens in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/campaigns/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/campaigns/page.tsx`
- [ ] T048 [P] [US3] Implement admin refund review and exception approval screens in `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/refunds/` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/app/(protected)/refunds/page.tsx`
- [ ] T049 [P] [US3] Implement mobile notification registration, deep-link handling, and buyer refund visibility in `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/features/notifications/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/features/refunds/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/app/(app)/orders/[orderId].tsx`
- [ ] T050 [US3] Add campaign relevance safeguards and multilingual content validation in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/policy.go` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/features/campaigns/campaign-validation.ts`

**Checkpoint**: All three user stories are independently functional, and the platform supports buyer re-engagement plus refund exception handling.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete cross-story quality, documentation, and release readiness work.

- [ ] T051 [P] Add end-to-end developer runbooks and environment notes in `/Users/akash/Documents/PetProjects/PET_Slay/README.md` and `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/quickstart.md`
- [ ] T052 Harden security and role-boundary checks across API, mobile, and admin code in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/admin/src/`
- [ ] T053 [P] Optimize localized catalog payloads, image handling, and notification deep-link performance in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/features/catalog/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/mobile/src/features/notifications/`
- [ ] T054 Run full quickstart validation and capture release checklist updates in `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/quickstart.md` and `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/tasks.md`

---

## Phase 7: Backend Persistence and UI Flow Derivation

**Purpose**: Move the backend from in-memory MVP scaffolding toward Postgres-backed services while deriving frontend user flows from the product requirements.

- [X] T055 [P] Derive reseller and admin user flows with UI-to-API responsibilities in `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/user-flows.md`
- [X] T056 [P] Document backend persistence strategy and repository boundaries in `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/backend-persistence.md`
- [X] T057 [P] Add database configuration, optional/required readiness tests, and `/health/ready` behavior in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/config/`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/store/`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/tests/contract/health_readiness_contract_test.go`
- [X] T058 [US1] Implement Postgres-backed buyer language preference repository with memory fallback in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/users/postgres_repository.go` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/users/profile.go`
- [X] T059 [P] Implement Go migration loader and migration command in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/store/migrations.go`, `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/cmd/migrate/main.go`, and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/scripts/migrate.sh`
- [X] T060 [US1] Implement Postgres-backed catalog repository for product listing, detail, variant lookup, and admin product create/update in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/catalog/`
- [X] T061 [US1] Implement Postgres-backed order repository with transactional order and order item creation in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/`
- [X] T062 [US3] Implement Postgres-backed notification repository for device token upsert, campaign creation, and campaign sent state in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/notifications/`
- [X] T063 [US3] Implement Postgres-backed refund repository for store-credit default and payment-source admin override in `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/refunds/`
- [X] T064 [US2] Add admin order status update contract, tests, and implementation in `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/contracts/openapi.yaml` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/`
- [X] T065 [US1] Add buyer order list and refund visibility contracts, tests, and implementation in `/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/contracts/openapi.yaml` and `/Users/akash/Documents/PetProjects/PET_Slay/apps/api/internal/orders/`
- [ ] T066 Run migrations against stage Postgres once Supabase stage credentials are available and update GitHub Actions secrets in `/Users/akash/Documents/PetProjects/PET_Slay/docs/stage-live-plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion and defines the MVP slice.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and can proceed after or in parallel with User Story 1 if staffing allows, though it benefits from US1 catalog contracts already being in place.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from the buyer/admin flows established in US1 and US2.
- **Polish (Phase 6)**: Depends on completion of the user stories you plan to ship.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories after Foundational.
- **User Story 2 (P2)**: Operationally complements User Story 1 but remains independently testable.
- **User Story 3 (P3)**: Builds on buyer identity, admin workflows, and order data established earlier, but keeps its own campaign/refund delivery slice.

### Within Each User Story

- Tests first, then data/model changes, then service/controller logic, then UI/integration work.
- New implementation work should not begin until the related failing test or harness exists.
- Shared file edits inside a story should land before dependent screen or endpoint tasks.
- Story checkpoints should be validated before moving to lower-priority release scope.

### Parallel Opportunities

- Setup tasks `T003` through `T007` can run in parallel once `T001` and `T002` are done.
- Foundational tasks `T009` through `T016` can be split across backend, mobile, and admin owners.
- Within US1, mobile auth (`T024`), localization (`T025`), and catalog UI (`T026`) can move in parallel after API contracts are stable.
- Within US2, admin auth shell (`T035`), product screens (`T036`), and order screens (`T037`) can run in parallel after backend endpoints exist.
- Within US3, campaign screens (`T047`), refund screens (`T048`), and mobile notification/refund UI (`T049`) can run in parallel after API modules are implemented.

---

## Parallel Example: User Story 1

```bash
# Backend contract and integration coverage can start together:
Task: "T017 [US1] Add contract tests in apps/api/tests/contract/us1-buyer-flow.contract.spec.ts"
Task: "T018 [US1] Add API integration tests in apps/api/tests/integration/us1-buyer-flow.integration.spec.ts"

# Once API domain modules are underway, mobile slices can progress in parallel:
Task: "T024 [US1] Implement mobile auth bootstrap in apps/mobile/src/features/auth/"
Task: "T025 [US1] Implement language selection in apps/mobile/src/features/language/"
Task: "T026 [US1] Implement catalog browse and product detail in apps/mobile/src/features/catalog/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the full buyer journey on mobile
5. Demo or pilot the MVP before committing to wider operational tooling

### Incremental Delivery

1. Setup + Foundational establish the shared platform
2. User Story 1 delivers the reseller buying MVP
3. User Story 2 adds admin catalog and order operations
4. User Story 3 adds re-engagement and refund handling
5. Polish phase prepares the release candidate

### Parallel Team Strategy

With multiple developers:

1. Platform team completes Setup + Foundational
2. After Foundational:
   - Developer A: User Story 1 mobile + buyer API
   - Developer B: User Story 2 admin web + operations API
   - Developer C: User Story 3 notifications/refunds API + buyer/admin integration
3. Rejoin for Phase 6 hardening and release validation

---

## Notes

- Every task includes a concrete file path so implementation can begin without re-scoping.
- `[P]` tasks are chosen to minimize file overlap and enable safe parallel work.
- The suggested ship target for the first increment is **Phase 3 / User Story 1** only.
- If scope tightens further, defer Facebook login support and advanced campaign rules before cutting P1 or localization quality.
- Because TDD is now constitutional, upcoming implementation should backfill missing tests for any already-scaffolded production code before expanding those areas significantly.
