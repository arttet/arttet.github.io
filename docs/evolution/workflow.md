---
title: RFC and ADR Workflow
status: active
last_updated: 2026-05-04
purpose: How an architectural proposal becomes a recorded decision and finally a spec update.
related:
  - ./index.md
  - ./rfc/index.md
  - ./adr/index.md
  - ../platform/developer/extending.md
---

# RFC and ADR Workflow <Badge type="tip" text="v1" />

Every significant change to the platform architecture is documented before it lands. An RFC starts the discussion.
An ADR records the final decision. The architecture spec under `docs/platform/architecture/` is updated to reflect the current state of the system.

## Flow Overview

1. Write an RFC to propose a change
2. Discuss and get it accepted
3. Convert it into an ADR
4. Update the architecture spec together with the implementation

## 1. Request for Comments (RFC)

- **Location**: `docs/evolution/rfc/NNNN-<slug>.md`
- **Purpose**: propose a change and gather feedback before implementation

### How to write an RFC

1. Copy `docs/evolution/rfc/template.md`
2. Fill in:
   - problem
   - proposed solution
   - alternatives
   - impact
   - open questions
3. Open a PR and start discussion

### Lifecycle

- Draft → Proposed → Accepted / Rejected
- Only accepted RFCs move forward

## 2. Architecture Decision Record (ADR)

- **Location**: `docs/evolution/adr/NNNN-<slug>.md`
- **Purpose**: record the final accepted decision and its rationale

### How it works

- Each ADR is derived from an accepted RFC
- Use the next sequential number
- ADRs are append-only and must not be edited after acceptance

## 3. Specification Update

- **Location**: `docs/platform/architecture/`
- **Purpose**: reflect how the system works today

### Rule

- Architecture docs must be updated in the same PR as the code change
- The spec is the source of truth, not the RFC or ADR

## Roles

| Phase    | Lives in                         | Owned by             | Lifecycle                    |
| -------- | -------------------------------- | -------------------- | ---------------------------- |
| Idea     | `operations/inbox/`              | author               | scratch, no PR               |
| Activity | `operations/activities/YYYY/MM/` | author               | source of truth for the work |
| RFC      | `docs/evolution/rfc/`            | author + reviewers   | mutable until accepted       |
| ADR      | `docs/evolution/adr/`            | author               | append-only after acceptance |
| Spec     | `docs/platform/architecture/`    | author of the change | updated with each PR         |

## Related

- [Evolution](./index.md)
- [RFC Index](./rfc/index.md)
- [ADR Index](./adr/index.md)
- [Extending the Platform](../platform/developer/extending.md)
