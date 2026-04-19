# Development Workflow

## Recommended Approach

Use a **local-light, remote-managed** workflow.

This project should not require your laptop to run every service locally during
the early stage. The recommended setup is:

- **Remote managed**:
  - database
  - auth
  - storage
  - eventually the Go API when you want end-to-end remote testing
- **Local only when needed**:
  - Expo mobile app
  - Next.js admin app
  - Go API for focused backend debugging

## Why This Is Recommended

- your MacBook Air stays responsive
- no need to run database + auth + storage + web + mobile + API all at once
- managed services already match the early-stage cost strategy
- remote API deployment lets you test mobile/admin against a realistic backend

## Current Local Constraint

The current machine does **not** yet have:

- `go`
- `pnpm`

So fully local app startup is blocked until tool installation is done.

## Environment Profiles

### `local`

- for your MacBook
- smallest local footprint
- prefer remote managed dependencies

### `stage`

- remote integration environment
- Kubernetes deployment target
- used for team/device validation

### `prod`

- remote production environment
- Kubernetes deployment target
- used for real traffic

## Development Modes

### Mode 1: Local-Light UI Development

Run only:
- mobile app locally
- admin app locally

Use remote:
- Supabase
- remote API

Best for:
- screen work
- onboarding flow UI
- catalog screens
- admin dashboard UI

### Mode 2: Local API Debugging

Run only:
- Go API locally

Use remote:
- Supabase / remote database where appropriate

Best for:
- endpoint debugging
- auth verification debugging
- business logic work

### Mode 3: Remote End-to-End Testing

Deploy:
- Go API remotely
- admin app remotely

Use:
- Supabase remotely
- Expo/mobile app against remote endpoints

Best for:
- testing on real devices
- reseller/admin acceptance checks
- low-laptop-pressure workflows

## Preferred Path For This Project

For this repo, the best near-term path is:

1. use `local` for focused coding only
2. keep infra managed remotely as much as possible
3. establish `stage` as the main integration environment
4. deploy the Go API remotely as soon as the first meaningful endpoints exist
5. test mobile/admin against remote services
6. reserve `prod` for stable public deployment

## Remote API Target

The intended long-term remote backend target is:

- **Kubernetes for stage and prod**

The intended short-term bridge target can still be:

- **GCP Cloud Run**, until the service is mature enough to move into the stage
  cluster cleanly

The API already has a starter Dockerfile at:

- [apps/api/Dockerfile](/Users/akash/Documents/PetProjects/PET_Slay/apps/api/Dockerfile)

## When Full Local Setup Makes Sense

Only do fuller local setup if:

- you need offline backend work
- cloud credentials are not ready yet
- you need very fast iteration on backend internals

Otherwise, prefer remote-managed testing.
