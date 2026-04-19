# Implementation Plan: Wholesale Fashion Reseller Platform MVP

**Branch**: `001-wholesale-fashion-platform` | **Date**: 2026-04-19 | **Spec**: [spec.md](/Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/spec.md)
**Input**: Feature specification from `/specs/001-wholesale-fashion-platform/spec.md`

## Summary

Build a wholesale-first platform with a mobile-first reseller app and a web-first
admin app backed by a shared commerce API. The technical approach is a
TypeScript monorepo for the client surfaces plus a Go API for shared business
logic. Expo React Native powers iOS/Android, Next.js powers the admin web
surface, Go powers the business APIs, PostgreSQL stores relational commerce
data, and Supabase supports authentication providers and storage. Notification
delivery starts with curated app-push campaigns, while refunds default to store
credit with admin-controlled payment-source exceptions.

## Technical Context

**Language/Version**: TypeScript 5.x for mobile and web, Go 1.23+ for the API  
**Primary Dependencies**: Expo React Native, Next.js App Router, Go HTTP router/middleware stack, Go database layer, Supabase Auth/Storage  
**Storage**: PostgreSQL for transactional data, object storage for product media  
**Testing**: Jest and React Native Testing Library for mobile, Playwright for admin web, Go test for API unit/integration coverage, contract validation against OpenAPI  
**Target Platform**: iOS and Android mobile app for resellers, browser-based admin web app, Linux-hosted API/runtime services  
**Project Type**: Monorepo with mobile app, web app, Go API service, and shared packages  
**Performance Goals**: Catalog list responses under 500ms p95 for warm requests, admin product publish workflow under 10 minutes end-to-end, notification-triggered catalog deep link opens under 3 seconds on supported mobile devices  
**Constraints**: Multilingual buyer journeys in English/Hindi/Hinglish, app-push only in MVP, product-level MOQ support, stock visibility exposed as availability states instead of exact counts, simple pricing without tiered ladders  
**Scale/Scope**: Initial launch for North India reseller buyers, one internal admin team, hundreds to low thousands of active buyers, catalog refreshed multiple times per week

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Reseller-First Product Value**: PASS. The architecture centers the reseller
  buying flow in the mobile app, with admin capabilities supporting catalog and
  operations rather than competing for MVP scope.
- **Spec-First Decision Making**: PASS. Product scope is captured in spec.md and
  technical choices are documented here with research-backed rationale, and this
  plan assumes test-first delivery for API, mobile, web, and shared packages.
- **Multilingual Local-Market Readiness**: PASS. Language preference is treated
  as a first-class entity and applied to mobile UI, notifications, and admin
  campaign creation.
- **Two-Surface Platform Coherence**: PASS. The plan separates reseller mobile
  and admin web surfaces while keeping shared business rules in the API layer.
- **Conversion-Respectful Operations**: PASS. Notification design is curated and
  relevant, and refund logic is explicit with store-credit-first defaults.

## Project Structure

### Documentation (this feature)

```text
specs/001-wholesale-fashion-platform/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── mobile/
│   ├── app/
│   ├── src/
│   │   ├── features/
│   │   ├── components/
│   │   ├── services/
│   │   ├── i18n/
│   │   └── state/
│   └── tests/
├── admin/
│   ├── app/
│   ├── src/
│   │   ├── features/
│   │   ├── components/
│   │   ├── services/
│   │   └── i18n/
│   └── tests/
└── api/
    ├── cmd/
    │   └── server/
    ├── internal/
    │   ├── auth/
    │   ├── catalog/
    │   ├── orders/
    │   ├── notifications/
    │   ├── refunds/
    │   ├── users/
    │   ├── store/
    │   └── http/
    ├── db/
    │   └── migrations/
    └── tests/

packages/
├── config/
├── design-tokens/
└── types/
```

**Structure Decision**: Use a TypeScript monorepo with three application roots:
`apps/mobile` for the reseller React Native app, `apps/admin` for the internal
web app, and `apps/api` for the shared Go backend. Shared contracts, types, and
configuration live under `packages/` to reduce drift between surfaces.

## Architecture Overview

### 1. Reseller Mobile App

- Built with Expo React Native for a single iOS/Android codebase.
- Owns buyer onboarding, language selection, catalog browse, product detail,
  order submission, notification handling, and order/refund visibility.
- Stores only session and lightweight cached presentation state on-device.
- Registers Expo push tokens with the backend after authentication.

### 2. Admin Web App

- Built with Next.js App Router for internal catalog and operations workflows.
- Owns product creation, inventory/availability updates, pricing updates, order
  review, campaign composition, and refund exception approval.
- Uses server-rendered pages where operational latency and authenticated loading
  matter, with client components for rich editing screens.

### 3. Shared API Layer

- Built with Go and organized by domain packages.
- Serves both the reseller mobile app and admin web app through a versioned HTTP
  API.
- Verifies authenticated sessions from the external auth platform and maps them
  to platform roles (`buyer`, `admin`).
- Enforces business rules for MOQ, availability state, order creation, campaign
  targeting, and refund decisions.

### 4. Data and Platform Services

- PostgreSQL is the system of record for product, order, campaign, refund, and
  preference data.
- A Go-native data layer provides migrations and structured access to relational
  data.
- Supabase handles social auth providers and storage-backed media needs.
- Product images and other rich assets are stored outside the relational tables,
  with metadata tracked in Postgres.

### 5. Notifications

- The backend stores device tokens and campaign definitions.
- Admin operators create multilingual campaign variants in the admin app.
- The API dispatches curated new-arrival, trending, and restock campaigns to the
  mobile push channel.
- Trending is initially admin-curated, with future automation reserved for later
  phases after sufficient commerce data exists.

### 6. Localization

- Language preference is required for reseller buyers and is persisted centrally.
- All buyer-facing strings are keyed and translated in English, Hindi, and
  Hinglish.
- Notification campaigns require per-language message variants before sending.
- Admin tools may stay English-first initially except where they compose
  buyer-facing content.

## Delivery Phases

### Phase 0: Foundation

- Monorepo setup and shared tooling
- Auth integration with social login and fallback path
- Go API schema and migration setup
- Shared API skeleton and role-based guards
- Shared localization and type packages

### Phase 1: P1 Reseller Buying Flow

- Buyer sign-in and session bootstrapping
- Language selection and preference persistence
- Catalog list, product detail, and availability-state display
- Cart/order submission with MOQ validation

### Phase 2: P2 Admin Operations

- Admin authentication and protected web shell
- Catalog creation/editing
- Inventory and pricing management
- Order queue and detail review

### Phase 3: P3 Re-Engagement and Refunds

- Device token registration
- Notification campaign authoring and send flow
- Refund request review with default store-credit outcome
- Payment-source refund exception handling with audit fields

## Risks and Mitigations

- **Social login complexity across mobile and web**: Use an external auth
  platform that supports Google/Facebook and fallback auth to reduce custom auth
  surface area.
- **Multilingual copy quality risk**: Treat language variants as required
  product artifacts and validate them during campaign creation.
- **Inventory freshness mismatch**: Expose availability states to buyers rather
  than exact counts, and centralize order validation in the API.
- **Notification spam risk**: Require campaigns to be tied to concrete catalog
  events and track delivery-to-open-to-visit conversion.
- **Future D2C creep**: Keep D2C extensibility at the schema and module level,
  but reject consumer-only workflows from MVP implementation tasks.

## Early-Stage Infrastructure Strategy

### Goals

- minimize fixed monthly spend
- make use of startup credits before self-funding infra growth
- avoid multi-service sprawl in the MVP
- keep the deployment path simple enough for a small team

### Recommended Hosting Shape for MVP

- **Mobile app**: Expo-managed React Native delivery for iOS and Android
- **Admin web app**: managed web hosting with simple CI/CD
- **Go API**: single-service deployment on a startup-credit-backed cloud account
- **PostgreSQL**: one managed Postgres instance sized for early-stage traffic
- **Auth/storage**: managed Supabase services
- **Notifications**: Expo push service

### Cloud Credit Recommendation

- **Primary recommendation**: prioritize Google Cloud startup credits first if
  you qualify, because the currently advertised early-stage credit range is
  materially larger than the self-funded AWS path
- **Secondary recommendation**: apply for AWS Activate as well, especially if
  you can qualify through an Activate provider and gain higher credit coverage

### Early-Stage Deployment Principle

Deploy for simplicity first:
- one API service
- one database
- managed auth/storage
- managed web hosting

Do not introduce:
- Kubernetes
- multi-region failover
- separate microservices
- dedicated event infrastructure
- custom notification delivery stack

These should be deferred until real usage or reliability thresholds justify
them.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Three app surfaces in one monorepo | The product explicitly requires mobile buyer, web admin, and shared backend surfaces | Collapsing admin or API responsibilities into a single app would blur roles and weaken maintainability |
