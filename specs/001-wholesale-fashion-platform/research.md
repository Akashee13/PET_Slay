# Research: Wholesale Fashion Reseller Platform MVP

## Decision: Use a TypeScript monorepo with Expo React Native for the reseller app

**Rationale**: The reseller experience is explicitly mobile-first on iOS and
Android. Expo's current documentation describes Expo as a React Native framework
that makes Android and iOS development easier and includes file-based routing
plus native modules. This fits the MVP need for a fast-moving mobile team with
push notifications and multilingual UI.

**Alternatives considered**:
- Bare React Native: more control, but slower setup and more native overhead for
  an MVP.
- Flutter: strong cross-platform option, but diverges from the requested React
  Native direction.

## Decision: Use Next.js App Router for the admin web app

**Rationale**: The admin experience is web-first and operational. Next.js
documents the App Router as the current router built on React’s latest features
and recommends it for new applications. This is a good fit for authenticated
internal workflows, CRUD-heavy screens, and future server-rendered dashboards.

**Alternatives considered**:
- Vite + React SPA: simpler on the client side, but weaker out-of-the-box
  support for server rendering, route conventions, and integrated web delivery.
- Remix: viable, but adds another framework choice without enough MVP payoff.

## Decision: Use a dedicated Go API service

**Rationale**: We need a shared business API for the mobile app and web admin
app, and the backend direction has been set to Go. Go is a strong fit for a
commerce API because it provides straightforward concurrency, predictable
deployment, and a clean path to modular services for catalog, orders,
notifications, refunds, and auth-aware request handling.

**Alternatives considered**:
- Node.js/NestJS: good modular ergonomics, but it no longer matches the chosen
  backend stack.
- Supabase Edge Functions only: fast for simple workflows, but less suitable as
  the primary home for a growing wholesale platform domain.

## Decision: Use Gin-style HTTP routing with layered Go services and repositories

**Rationale**: The backend needs a versioned HTTP API with clear domain
boundaries and simple deployment. A lightweight router plus explicit service and
repository layers keeps the architecture understandable while avoiding excessive
framework ceremony. This maps well to domains like auth, catalog, orders,
notifications, and refunds.

**Alternatives considered**:
- Heavier full-stack frameworks: can speed up some conventions, but add more
  abstraction than the current MVP needs.
- Standard library only: viable, but slower to scale consistently across modules
  and middleware concerns.

## Decision: Use PostgreSQL with a Go-native data layer

**Rationale**: Orders, catalog, inventory, refunds, notification campaigns, and
language preferences are relational data with clear integrity constraints.
PostgreSQL remains the best fit for transactional commerce workflows. The Go
backend should use a Go-native ORM or query layer with migrations so schema
control stays explicit and backend-friendly.

**Alternatives considered**:
- MongoDB: weaker fit for transactional commerce workflows.
- Raw SQL only: more flexible, but slower for an MVP team moving across multiple
  apps and shared data models.

## Decision: Use Supabase for authentication and storage-adjacent platform needs

**Rationale**: Supabase Auth officially supports social login providers
including Google and Facebook, and it supports phone-based auth as well. That
covers the MVP’s easy sign-in requirement without building custom OAuth flows.
Supabase also provides storage and a Postgres-centered platform that can support
product media and operational assets. The Go API will remain the system of
record for business rules.

**Alternatives considered**:
- Build auth from scratch with Passport or Auth.js: too much auth surface for an
  MVP and more repeated work across mobile and web.
- Clerk: strong option, but Supabase aligns more naturally with the Postgres-led
  backend direction and operational simplicity.

## Decision: Use Expo notifications with a backend notification service

**Rationale**: Expo’s official notifications docs provide token registration and
notification handling for React Native apps. This suits an MVP that needs
app-push notifications for iOS and Android without introducing multiple mobile
notification stacks. The backend should own segmentation, copy selection, and
campaign triggering.

**Alternatives considered**:
- Email or WhatsApp first: useful later, but app-push is the cleanest MVP path.
- Direct FCM/APNs-only integration: more control, but more platform overhead
  than needed initially.

## Decision: Keep MVP notification logic curated rather than algorithmic

**Rationale**: The product promise is conversion-oriented messaging, not spam.
Admin-curated campaigns for new arrivals, trending collections, and restocks are
easier to control and safer for launch. Sales-velocity-based automation can be
added later once reliable usage data exists.

**Alternatives considered**:
- Fully automated trending logic from day one: attractive, but too dependent on
  data quality and merchandising tuning before launch.

## Decision: Support MOQ at product level, but defer tiered pricing

**Rationale**: Wholesale buyers often need minimum buy constraints, but tiered
pricing adds complexity to catalog, cart, pricing presentation, and order
validation. Product-level MOQ covers a common wholesale need while keeping MVP
pricing simple and understandable.

**Alternatives considered**:
- No MOQ support: easier implementation, but too weak for a wholesale-first
  product.
- Tiered price ladders in MVP: likely valuable later, but too much UI and
  pricing complexity for the initial release.

## Decision: Show availability states, not exact stock counts, to reseller buyers

**Rationale**: Availability-state messaging is enough for buyer confidence while
reducing operational risk from exposing exact stock positions that can become
stale quickly. The admin app will retain exact inventory visibility.

**Alternatives considered**:
- Exact inventory counts for buyers: potentially useful, but creates more
  expectation-management risk.

## Decision: Optimize early-stage infrastructure for credits and low-ops deployment

**Rationale**: The product is in an early stage, so the infrastructure strategy
should minimize fixed cost, operational overhead, and premature scaling work.
Official startup programs currently advertise significantly larger credit pools
on Google Cloud for eligible early-stage startups, while AWS Activate remains a
strong secondary option, especially if the company can qualify through a startup
provider. The platform should therefore prefer a low-complexity deployment model
that can run cheaply on credits first and expand later.

**Recommended early-stage approach**:
- Run the Go API and PostgreSQL on a single low-complexity cloud footprint when
  feasible.
- Use startup credits first before introducing multi-cloud sprawl.
- Keep mobile and admin assets on managed hosting where possible.
- Use managed auth/storage to avoid self-hosting identity and object storage too
  early.

**Alternatives considered**:
- Build for multi-region or high-scale infrastructure from day one: too costly
  and unnecessary for MVP.
- Self-host every component to minimize vendor dependency: usually increases ops
  burden before product-market fit.

## Sources

- [Expo Introduction](https://docs.expo.dev/get-started/introduction)
- [Expo Create a Project](https://docs.expo.dev/get-started/create-a-project/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Getting Started](https://nextjs.org/docs/app/getting-started)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Social Login](https://supabase.com/docs/guides/auth/social-login)
- [AWS Activate Credits](https://aws.amazon.com/startups/credits)
- [Google for Startups Cloud Program](https://cloud.google.com/startup)
- [Google Cloud Early Stage Startup Credits](https://cloud.google.com/startup/early-stage)
- [Supabase Billing](https://supabase.com/docs/guides/platform/billing-on-supabase)
