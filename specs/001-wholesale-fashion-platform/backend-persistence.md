# Backend Persistence Plan

## Goal

Move the Go API from in-memory development services to Postgres-backed services
without breaking the current stage deployment or frontend contracts.

## Persistence Strategy

Use PostgreSQL as the system of record and keep service-layer business rules in
Go. The API should support three operating modes:

- `local`: can run without a database for fast backend iteration, but supports a
  configured local/remote Postgres URL.
- `stage`: should use a managed stage Postgres URL once Supabase stage is
  provisioned; until then, health remains live with in-memory fallback.
- `prod`: must require a valid database URL before serving traffic.

## Repository Boundaries

### Buyer Repository

Responsibilities:
- Upsert buyer profile from authenticated session.
- Persist preferred language.
- Read buyer profile for `GET /v1/me`.

### Catalog Repository

Responsibilities:
- List buyer-visible products.
- Fetch product detail and variants.
- Create/update product and merchandising fields for admin.
- Resolve product and variant for order validation.

### Order Repository

Responsibilities:
- Create order and order items transactionally.
- List admin-visible orders.
- Fetch buyer-scoped order detail.
- Support future status transitions.

### Notification Repository

Responsibilities:
- Upsert device tokens.
- Create campaign, message variants, and campaign items transactionally.
- Mark campaign sent.

### Refund Repository

Responsibilities:
- Create/update refund decisions.
- Default to store credit unless admin explicitly chooses payment source.

## Migration Expectations

- Migrations live under `apps/api/db/migrations`.
- Migration SQL must be idempotent enough for controlled stage bootstrap.
- Seed data should be separate from schema migrations once real catalog content
  starts changing frequently.

## Deployment Expectations

- Cloud Run must not set reserved `PORT` as an environment variable.
- Stage deployment should expose `/health` even before DB is required.
- A future `/health/ready` endpoint should verify DB connectivity when
  `DATABASE_REQUIRED=true`.

