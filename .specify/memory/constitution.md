<!--
Sync Impact Report
Version change: 1.3.0 -> 1.3.1
Modified principles:
- II. Spec-First and Test-First Delivery (clarified ambiguity handling)
Added sections:
- None
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/memory/constitution.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/tasks-template.md
- ⚠ pending .specify/templates/commands/*.md (directory not present in this scaffold)
Follow-up TODOs:
- Existing scaffolded code predates some newer principles and may still need test retrofits.
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
MUST describe how with explicit technical tradeoffs. If requirements, behavior,
or scope contain material ambiguity, the team MUST stop and ask concise
clarifying questions before implementing. Open questions with product impact
MUST be resolved before implementation begins. All implementation work MUST
follow TDD: define or update the relevant test first, confirm it fails for the
intended reason, then implement the production change, and finally return to
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

### VI. Anxiety-Reducing UX and Consistent Design Language
Every buyer and admin workflow MUST reduce user anxiety by making system state,
progress, success, failure, and recovery paths visible at the moment they matter.
Long-running actions MUST provide clear loading feedback, disabled duplicate
actions, and reassuring copy that explains what is happening. UI changes MUST
preserve a consistent design language across mobile, web, and admin surfaces so
users do not need to relearn patterns between flows. Designs that introduce
ambiguous empty states, silent waits, or inconsistent interaction patterns MUST
be revised before implementation is considered complete.

## Delivery Constraints

- The MVP scope is wholesale-first for reseller buyers in women’s western and
  South Asian fashion.
- Product language and requirements SHOULD stay implementation-agnostic until
  `/speckit.plan`.
- Plans MUST call out assumptions around ordering rules, refund exceptions,
  inventory visibility, and notification triggers when those rules affect scope.
- Any feature involving buyer communication MUST define preference handling,
  message intent, and abuse-prevention or spam-prevention expectations.
- Any user-facing or operator-facing workflow MUST define loading, empty, error,
  success, and recovery states before implementation.
- UI design SHOULD reuse established visual language and interaction patterns
  unless the spec explains why a new pattern reduces confusion or anxiety.

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
- Plans MUST include a UX anxiety check for loading feedback, disabled duplicate
  actions, empty/error/success states, and consistency with existing platform
  patterns.
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

**Version**: 1.3.1 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-25
