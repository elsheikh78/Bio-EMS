# BIO-EMS ADR Policy

| Item | Value |
|------|-------|
| Document | ADR Policy |
| Version | 1.0 |
| Status | Draft |
| Applies To | BIO-EMS Backend |
| Owner | Engineering Team |
| Classification | Internal |
| Last Updated | 2026-08-05 |

## 1. Purpose

This policy defines when, why, and how Architecture Decision Records (ADRs) are
created and maintained for the BIO-EMS backend.

ADRs preserve the rationale for structural decisions that affect the system beyond a
single implementation task. They make it possible to understand why a boundary,
storage owner, or dependency direction exists after the original discussion ends.

## 2. Scope

This policy applies to architectural decisions affecting the implemented BIO-EMS
backend, including Domain behavior boundaries, SQLite and InfluxDB ownership, MQTT
integration boundaries, REST API structure, and dependency direction.

ADRs are stored under `docs/adr/`. This policy does not create an approval board,
automated workflow, or governance system beyond the current review and documentation
practices used by the project.

## 3. What is an ADR?

An Architecture Decision Record is a concise Markdown document that records a
significant architectural decision, its context, its chosen direction, and its
consequences.

An ADR is not a task log, release note, or detailed code walkthrough. It answers:

- What architectural problem required a decision?
- What decision was made?
- Why was that decision preferred over alternatives?
- What consequences does the decision impose on future work?

For BIO-EMS, an ADR can explain why sensor thresholds are configured in SQLite while
telemetry values are stored in InfluxDB, without duplicating implementation details.

## 4. ADR Philosophy

ADRs capture architectural decisions and their rationale. They preserve engineering
knowledge so that future maintainers can follow existing constraints intentionally.

- An ADR MUST describe a decision that affects architecture, not merely code layout.
- An ADR MUST preserve the reasoning available at the time of the decision.
- An ADR SHOULD be concise enough to be reviewed with the related change.
- An ADR MUST NOT present planned capability as implemented capability.
- An ADR MAY reference code, documentation, and Pull Requests for evidence.

The authoritative decision remains readable even when implementation details later
change. A later decision SHOULD supersede rather than silently rewrite an earlier ADR.

## 5. When an ADR is Required

An ADR is required when a change establishes or materially changes a lasting
architectural constraint, owner, or integration boundary.

| Decision area | BIO-EMS example requiring an ADR |
| --- | --- |
| Architecture changes | Introducing or changing a backend layer boundary. |
| Storage strategy changes | Moving configuration ownership between SQLite and InfluxDB. |
| Domain ownership changes | Moving alarm interpretation into or out of the Domain layer. |
| Dependency changes | Allowing a new dependency direction between layers. |
| External integration changes | Changing the MQTT or InfluxDB integration boundary. |
| Security architecture changes | Introducing enforced authentication or authorization architecture. |
| Performance architecture decisions | Selecting a durable aggregation, caching, or query strategy. |

An ADR MUST be created before or alongside implementation when the decision cannot be
understood solely from a local code change.

## 6. When an ADR is NOT Required

An ADR is not required for work that does not change architectural intent.

| Change | ADR requirement |
| --- | --- |
| Bug fix within an existing design | Not required. |
| Refactoring without architectural impact | Not required. |
| Documentation update with no new decision | Not required. |
| Test addition for an existing behavior | Not required. |
| Formatting or naming change | Not required. |
| Versioned SQLite migration implementing an existing decision | Usually not required. |

The absence of an ADR MUST NOT be used to avoid documenting an architectural change.
When uncertain, the author SHOULD create a short ADR or request architectural review.

## 7. ADR Lifecycle

The current ADR lifecycle follows the same manual review and documentation practices
used for BIO-EMS Pull Requests.

```text
Problem
   |
   v
Analysis
   |
   v
Decision
   |
   v
Review
   |
   v
Approval
   |
   v
Implementation
   |
   v
Documentation Update
```

1. Identify an architectural problem or choice.
2. Analyze the current implementation, constraints, and alternatives.
3. Draft the ADR with a proposed decision.
4. Review the ADR with the related implementation where applicable.
5. Mark the decision status accurately after agreement.
6. Implement the approved direction and update related documentation.

This lifecycle does not imply an automated approval workflow or deployment process.

### Decision Evidence

An ADR SHOULD be grounded in evidence available in the current repository rather
than assumptions about future product or infrastructure capabilities.

| Evidence type | BIO-EMS example |
| --- | --- |
| Source code | `AlarmEvaluationEngine` and its public input/output types. |
| Schema or migration | SQLite sensor threshold columns and migration history. |
| Integration module | MQTT router or InfluxDB query/writer boundary. |
| Existing documentation | Architecture principles or an earlier ADR. |
| Verification result | Build, test, or focused migration verification. |

Evidence MAY be referenced by path or Pull Request summary. It MUST be sufficient to
explain the decision context without copying large source files into the ADR.

## 8. ADR Structure

Every new ADR MUST use these sections.

| Section | Required content |
| --- | --- |
| Title | A concise statement of the decision. |
| Status | One defined ADR status value. |
| Context | The problem, constraints, and current state. |
| Decision | The chosen architectural direction. |
| Consequences | Benefits, costs, and obligations created by the decision. |
| Alternatives Considered | Viable options and why they were not chosen. |
| References | Related code, documents, ADRs, or Pull Requests. |

An ADR MAY add implementation notes when necessary, but it MUST NOT replace the
related source code, migration, tests, or engineering documentation.

### Maintaining ADRs

Accepted ADRs are historical records as well as active architectural references.

- An accepted ADR MUST NOT be silently rewritten to reflect a later decision.
- Minor corrections that do not alter the decision MAY clarify wording or broken links.
- A material change to the decision SHOULD create a new ADR with a Superseded link.
- Implementation references SHOULD be updated when files move or a stable document
  replaces a temporary reference.
- An ADR that is no longer recommended MAY be marked Deprecated with its reason.

For example, a later decision to replace a storage boundary would supersede the
original storage-ownership ADR; it would not alter the original record to suggest the
older choice was never made.

### ADR Writing Style

ADRs SHOULD use precise language that separates facts, decisions, and consequences.

- Context SHOULD describe the problem in present-tense repository terms.
- Decision statements SHOULD use unambiguous language such as “BIO-EMS will use”.
- Consequences SHOULD identify trade-offs, including new constraints on callers.
- Alternatives SHOULD be treated fairly and described at the same level of detail.
- References MUST use repository-relative paths where a local document is cited.

An ADR MUST NOT rely on undocumented verbal agreement as the only explanation for a
decision that affects architecture.

The title SHOULD name the decision rather than the meeting or task that produced it.
For example, “Use SQLite for Configuration and InfluxDB for Telemetry” is preferable
to “Database Discussion.” This keeps ADR indexes useful as the repository grows.

Decision language SHOULD identify the affected boundary, owner, or dependency.
This enables a reviewer to determine quickly whether an ADR applies to a proposed
change without reading unrelated implementation history.

This principle applies equally to accepted and proposed ADRs.

## 9. ADR Status Values

| Status | Meaning |
| --- | --- |
| Proposed | Under consideration; not yet the governing decision. |
| Accepted | Approved and governing for future changes. |
| Superseded | Replaced by a later ADR that MUST be referenced. |
| Deprecated | Retained for history but no longer recommended. |
| Rejected | Considered but explicitly not adopted. |

Status MUST reflect the decision's actual state. An ADR MUST NOT be marked Accepted
solely because implementation has started or a file has been created.

## 10. ADR Numbering

ADRs SHOULD use sequential, zero-padded identifiers:

```text
ADR-001
ADR-002
ADR-003
```

The identifier MUST remain stable after an ADR is created. Numbers MUST NOT be reused
for a different decision, including when an ADR is rejected or superseded.

The current repository contains reserved early ADR files. A reserved identifier is not
evidence that its corresponding decision has been made.

## 11. BIO-EMS ADR Examples

The following are examples of ADR subjects expected when corresponding decisions are
formally recorded. They are not assertions that ADR-001, ADR-002, or ADR-003 already
contain these decisions.

| Expected ADR subject | Architectural question |
| --- | --- |
| Repository Pattern | Why SQLite persistence is isolated behind repositories. |
| SQLite vs InfluxDB ownership | Why configuration and telemetry have separate owners. |
| AlarmEvaluationEngine | Why threshold evaluation is a Domain responsibility. |
| Layered Architecture | Why API, application, domain, and infrastructure concerns are separated. |

Once created, these ADRs SHOULD reference the relevant current code and engineering
documents, including `ARCHITECTURE_PRINCIPLES.md` and `DOMAIN_GUIDELINES.md`.

## 12. ADR Review Checklist

Reviewers MUST verify:

- [ ] The problem is architectural rather than a local implementation detail.
- [ ] The Context describes the current BIO-EMS state accurately.
- [ ] The Decision is explicit and unambiguous.
- [ ] Consequences include both benefits and constraints.
- [ ] Alternatives are meaningful and not straw options.
- [ ] The ADR status matches its review state.
- [ ] References point to valid code, documentation, or related records.
- [ ] The ADR does not claim planned features are implemented.
- [ ] Related implementation follows the accepted decision.
- [ ] A superseding decision links to the ADR it replaces.

## 13. Common ADR Anti-Patterns

| Anti-pattern | Why it weakens governance | Required correction |
| --- | --- | --- |
| Writing ADRs after implementation | Rationale can be reconstructed inaccurately. | Draft before or with the decision. |
| Missing rationale | Future maintainers cannot assess the trade-off. | Add context and alternatives. |
| Missing alternatives | The choice appears arbitrary. | Record realistic options. |
| Describing code instead of decisions | ADR becomes stale implementation documentation. | State the lasting architectural direction. |
| Rewriting accepted history | Prior reasoning is lost. | Create a superseding ADR. |
| Using an ADR for routine formatting | Architectural records become noisy. | Use normal code review documentation. |

An ADR MUST be readable without access to the original discussion. It SHOULD identify
the consequences that future Pull Requests must respect.

## 14. Cross References

| Document | Relationship |
| --- | --- |
| `docs/engineering/ENGINEERING_PLAYBOOK.md` | Engineering rules and documentation expectations. |
| `docs/engineering/ARCHITECTURE_PRINCIPLES.md` | Architectural constraints that ADRs may establish or modify. |
| `docs/engineering/DOMAIN_GUIDELINES.md` | Domain ownership constraints for alarm behavior. |
| `docs/engineering/GIT_WORKFLOW.md` | Reviewed Pull Request workflow for ADR-related changes. |

## 15. Revision History

| Version | Date | Status | Change |
| --- | --- | --- | --- |
| 1.0 | 2026-08-05 | Draft | Initial ADR policy for the current BIO-EMS engineering process. |
