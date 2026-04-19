# Quickstart: Wholesale Fashion Reseller Platform MVP

## Goal

Stand up the initial development workspace for the reseller mobile app, admin
web app, and shared API so the team can begin story-based implementation from
the plan artifacts.

## Suggested Repository Layout

```text
apps/
├── mobile/        # Expo React Native app for reseller buyers
├── admin/         # Next.js web app for internal operators
└── api/           # Go backend for business logic

packages/
├── config/        # Shared TypeScript config, lint config, environment helpers
├── design-tokens/ # Shared language-independent styling tokens and constants
└── types/         # Shared DTOs and domain types

specs/
└── 001-wholesale-fashion-platform/
```

## Initial Setup Steps

1. Create a TypeScript workspace monorepo with `apps/` and `packages/`.
2. Scaffold `apps/mobile` with Expo for React Native.
3. Scaffold `apps/admin` with Next.js App Router.
4. Scaffold `apps/api` as a Go service with routing, config, and migration support.
5. Configure shared linting, formatting, TypeScript settings, and environment
   variable management.
6. Provision PostgreSQL and initialize schema/migrations in the Go API app.
7. Configure Supabase project settings for Auth providers and storage.
8. Register Google and Facebook social providers for MVP-ready auth paths.
9. Wire the mobile app for Expo push token registration.
10. Create initial API modules for auth/session verification, catalog, orders,
    notifications, and refunds.

## MVP Build Order

1. Foundation
   - monorepo scaffolding
   - auth/session integration
   - database schema
   - shared type contracts

2. Reseller mobile P1 flow
   - sign-in
   - language preference
   - catalog browse
   - product detail
   - place order

3. Admin web P2 flow
   - admin sign-in
   - product upload/edit
   - inventory and pricing management
   - order review

4. Re-engagement P3 flow
   - device token registration
   - notification campaign management
   - refund decision workflows

## Environment Requirements

- Node.js LTS
- Go 1.23+
- Package manager with workspace support
- PostgreSQL database
- Supabase project for auth/storage configuration
- Apple and Google mobile testing setup for iOS/Android validation
- Physical devices for reliable push notification testing

## Verification Checklist

- Mobile app can sign in and fetch a localized catalog shell
- Admin app can authenticate and create a draft product
- API can connect to PostgreSQL and expose protected endpoints
- Preferred language persists for reseller buyers
- Push token registration succeeds on a physical device
