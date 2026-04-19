<!--
Sync Impact Report
Version change: 1.1.0 -> 1.2.0
Modified principles:
- II. Spec-First and Test-First Delivery (expanded quality gate)
Added sections:
- None
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/memory/constitution.md
- ✅ /Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/plan.md
- ✅ /Users/akash/Documents/PetProjects/PET_Slay/specs/001-wholesale-fashion-platform/tasks.md
- ✅ .specify/templates/spec-template.md (reviewed; no template change required)
- ✅ .specify/templates/plan-template.md (reviewed; no template change required)
- ✅ .specify/templates/tasks-template.md (reviewed; no template change required)
- ⚠ pending .specify/templates/commands/*.md (directory not present in this scaffold)
Follow-up TODOs:
- Existing scaffolded code predates this amendment and has not yet been retrofitted with tests.
-->
# PET_Slay Constitution

## Core Principles

### I. Reseller-First Product Value
Every MVP decision MUST optimize for reseller buyer outcomes before future D2C
ambitions. Specifications and plans MUST state the reseller problem being solved,
the buying confidence created, and the business value expected from the change.
Features that exist only for hypothetical future users MUST be deferred unless
they are required to keep the platform extensible.

### II. Spec-First and Test-First Delivery
All meaningful feature work MUST pass through the spec-kit flow in order:
constitution, specification, clarification when needed, planning, tasks, and
then implementation. Specs MUST describe what and why in business terms. Plans
MUST describe how with explicit technical tradeoffs. Open questions with product
impact MUST be resolved before implementation begins. All implementation work
MUST follow TDD: define or update the relevant test first, confirm it fails for
the intended reason, then implement the production change, and finally return to
green.

### III. Multilingual Local-Market Readiness
Buyer-facing experiences for the MVP MUST support English, Hindi, and Hinglish
in the primary user journeys. Language quality MUST feel natural for North India
reseller buyers rather than directly translated. New buyer flows, catalog
surfaces, and notifications MUST include a localization strategy before they can
be considered complete.

### IV. Two-Surface Platform Coherence
The system MUST be designed as two connected surfaces: a reseller-facing client
experience and an internal inventory/admin experience. Changes that affect one
surface and create new operational burden on the other MUST document that impact
in the spec or plan. Architecture SHOULD stay simple, but it MUST preserve a
clean path for future D2C expansion without compromising MVP clarity.

### V. Conversion-Respectful Operations
Growth and operations features MUST improve conversion and repeat buying without
feeling spammy, punitive, or opaque. Notifications MUST be timely, relevant, and
language-aware. Refund and store-credit flows MUST be explicit and fair. Success
metrics for features MUST include buyer conversion or operational efficiency, not
just feature delivery.

## Delivery Constraints

- The MVP scope is wholesale-first for reseller buyers in women’s western and
  South Asian fashion.
- Product language and requirements SHOULD stay implementation-agnostic until
  `/speckit.plan`.
- Plans MUST call out assumptions around ordering rules, refund exceptions,
  inventory visibility, and notification triggers when those rules affect scope.
- Any feature involving buyer communication MUST define preference handling,
  message intent, and abuse-prevention or spam-prevention expectations.

## Workflow & Quality Gates

- Each specification MUST contain independently testable user stories ordered by
  business priority.
- No feature may proceed to planning while critical scope ambiguities remain
  unresolved.
- Tasks and implementation MUST enforce test-first sequencing for every change,
  including API behavior, shared packages, and UI flows where automated coverage
  is practical.
- Every commit intended for shared branches MUST keep happy-path integration
  tests passing for impacted surfaces; a commit that breaks happy integration
  tests MUST NOT be merged.
- Plans MUST include a constitution check explaining how the design satisfies the
  multilingual requirement, the two-surface model, and conversion-respectful
  operations.
- Tasks MUST be grouped so the highest-priority reseller value can be delivered
  and validated first.
- Reviews MUST reject work that introduces unnecessary complexity or implementation
  detail into product specs.

## Governance

This constitution overrides ad hoc process preferences for the project. Every
specification, plan, and task list MUST be reviewed against these principles.
Amendments require documenting the reason for change, the semantic version bump,
and any downstream template or process impact. Major version changes are required
for principle removals or incompatible governance changes. Minor version changes
are required for new principles or materially expanded rules. Patch changes are
reserved for clarifications that do not alter project behavior.

**Version**: 1.2.0 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-19
