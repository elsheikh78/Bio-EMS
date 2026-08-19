# S16-07-05 — Calibration History PDF Export

## Status

**PLANNED / CONTRACT BASELINE**

This slice defines the bounded implementation contract for synchronous PDF export of the existing **Calibration History** report.

No implementation work is authorized outside the capability boundary defined by this document.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

---

## Objective

Add a printable PDF export for the existing `CALIBRATION-HISTORY` report while preserving the canonical reporting architecture established during S16-07.

The PDF export must reuse the same backend-owned canonical Calibration History result already used by report preview and CSV export.

The PDF renderer must not independently query persistence, reconstruct calibration history, or recalculate reporting evidence.

---

## Existing reporting baseline

The current reporting architecture provides:

- backend-owned report catalogue;
- canonical Calibration History preview result;
- synchronous CSV export;
- stable report contract version;
- report evidence and provenance;
- report generation metadata;
- role/permission-controlled report export.

The PDF export extends this architecture rather than creating a parallel reporting path.

---

## Export contract

The existing export endpoint remains authoritative:

`POST /api/v1/reports/exports`

The request continues to use the existing Calibration History export contract.

The export format is extended to support:

- `CSV`
- `PDF`

No new PDF-specific report endpoint is introduced.

The existing authorization boundary remains unchanged.

---

## Canonical-result rule

The PDF implementation must:

1. validate the existing report request;
2. obtain the canonical Calibration History result through the existing reporting service;
3. pass that result to a dedicated PDF renderer;
4. return the generated PDF response.

The PDF renderer must not:

- query SQLite;
- query another persistence source;
- call calibration repositories directly;
- reconstruct report evidence;
- recalculate calibration status;
- create a second reporting model.

The canonical reporting result remains the single source of report evidence.

---

## Catalogue capability

When PDF export is implemented and verified, the `CALIBRATION-HISTORY` catalogue entry may advertise:

`exportFormats: ["CSV", "PDF"]`

The capability must not be advertised before the PDF implementation and its contract tests are complete.

---

## PDF response

Successful PDF export must return an HTTP response appropriate for a downloadable PDF document.

Expected response characteristics include:

- `Content-Type: application/pdf`
- attachment disposition;
- safe normalized filename;
- `X-Content-Type-Options: nosniff`

The filename must identify the Calibration History report and its report identity/range without using unsafe filesystem characters.

---

## Document identity

The generated PDF must visibly identify the document as a BIO-EMS Calibration History report.

The report header must provide sufficient provenance to distinguish the generated document from an informal screen print or manually assembled record.

At minimum, the PDF must include:

- BIO-EMS identification;
- report title;
- Report ID;
- report contract version;
- software/version evidence when available from the canonical contract;
- generation timestamp;
- generating user;
- report source;
- selected date/time range;
- reporting time zone.

---

## Scope information

The document must identify the report scope using the canonical result.

Where available, this includes:

- customer/site context;
- monitored area or room;
- sensor identity;
- sensor label;
- sensor/device context relevant to calibration evidence.

No new scope lookup may be introduced solely for PDF presentation.

---

## Summary section

The PDF must provide a human-readable summary derived only from canonical report fields.

The summary may present existing canonical values such as:

- number of calibration records;
- result/status counts;
- evidence-quality information;
- selected reporting range;
- sensor scope.

The renderer must not derive new compliance conclusions.

---

## Calibration history table

The PDF must contain a printable calibration-history table based on the canonical result.

Columns should represent existing evidence where applicable, including:

- calibration timestamp;
- sensor;
- site;
- room/area;
- calibration result;
- certificate/reference;
- offset;
- performer;
- note/evidence.

Long values must wrap or otherwise remain readable without silently discarding evidence.

Table headers must repeat where practical when the table spans multiple pages.

---

## Evidence-quality warnings

Existing evidence-quality limitations or warnings from the canonical report must remain visible in the PDF.

The renderer must not suppress incomplete evidence in order to make the report appear compliant.

Where canonical evidence is unavailable, the document must represent that condition truthfully.

---

## Pagination

The PDF must support multi-page reports.

Pages must remain printable and readable.

The implementation should provide:

- stable margins;
- repeated report/table context where appropriate;
- page numbering;
- protection against content being rendered outside printable bounds.

Pagination must not alter report evidence.

---

## Approval fields

The PDF may include empty printable approval/signature fields such as:

- Prepared by;
- Reviewed by;
- Approved by;
- Signature;
- Date.

These fields are presentation placeholders only.

Their presence must not imply electronic approval, electronic signature, audit approval, or regulatory acceptance.

No approval workflow is introduced by this slice.

---

## Security and data handling

PDF content must be generated from trusted canonical report structures.

User-controlled text must be rendered as text and must not be interpreted as executable document instructions.

The implementation must avoid:

- arbitrary filesystem paths;
- unsafe filenames;
- external content fetching;
- remote image loading;
- embedded executable content.

No retained server-side PDF file is required.

---

## Execution model

S16-07-05 uses synchronous export.

The generated PDF is returned directly in the HTTP response.

This slice does not introduce:

- background jobs;
- export queues;
- job polling;
- retained report files;
- report download history;
- sharing links.

---

## Range boundary

The PDF export must remain within the existing bounded Calibration History reporting contract.

The maximum supported range must not exceed the existing record-report boundary of **366 days** unless a later architecture decision explicitly changes that limit.

The PDF implementation must not silently bypass existing report limits.

---

## Testing requirements

Implementation acceptance requires focused automated coverage for at least:

- PDF request validation;
- successful Calibration History PDF export;
- correct PDF content type;
- attachment disposition;
- safe filename;
- authorization boundary;
- canonical reporting service reuse;
- representative document metadata;
- representative calibration evidence;
- multi-record rendering;
- empty/no-evidence behavior where supported;
- evidence-quality warning preservation.

Tests must demonstrate that PDF export does not introduce an independent reporting evidence calculation path.

---

## Regression gate

Before closure, the normal repository quality gates must pass.

At minimum:

### Backend

- typecheck;
- lint;
- format check;
- automated test suite;
- build.

### Frontend

If no frontend production code changes are required, existing frontend quality gates must still remain unaffected.

Any frontend modification requires the applicable frontend typecheck, lint, format, tests, and build gates.

---

## Dependency rule

A PDF-generation dependency may be introduced only when implementation begins and only if required.

The selected library must:

- support the project's Node.js runtime;
- be actively maintainable;
- support deterministic server-side generation;
- avoid external rendering services;
- avoid browser/runtime infrastructure unless explicitly justified;
- remain bounded to report rendering.

Dependency selection must not drive changes to the canonical reporting architecture.

---

## Capability boundary

S16-07-05 includes only:

**Calibration History PDF Export**

The following remain outside this slice:

- PDF export for other report families;
- asynchronous export lifecycle;
- retained report files;
- report sharing;
- electronic signatures;
- approval workflow;
- audit approval;
- regulatory submission;
- arbitrary report templates;
- customer-editable templates;
- independent PDF evidence calculation.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

---

## Acceptance criteria

S16-07-05 may close only when:

1. `CALIBRATION-HISTORY` accepts `PDF` through the existing export contract.
2. PDF export uses the existing canonical Calibration History result.
3. No independent reporting query/calculation path is introduced.
4. The generated document contains report identity and provenance.
5. Calibration evidence is printable and readable.
6. Existing evidence-quality limitations remain visible.
7. Multi-page output is supported.
8. Response headers and filename are safe and correct.
9. Authorization remains enforced.
10. Focused PDF tests pass.
11. Repository regression gates pass.
12. The report catalogue advertises PDF only after the capability is operational.

---

## Explicit non-claims

Completion of this slice does **not** mean that:

- BIO-EMS is commissioned;
- BIO-EMS is validated for regulated production use;
- BIO EGYPT has accepted the system;
- the PDF constitutes an electronic signature;
- the PDF constitutes regulatory approval;
- all BIO-EMS report families support PDF;
- reporting development is complete.

---

## Planned implementation sequence

1. Freeze this PDF contract.
2. Select the bounded server-side PDF rendering dependency.
3. Extend export request validation with `PDF`.
4. Implement the Calibration History PDF renderer.
5. Route PDF through the existing export controller.
6. Add focused renderer/controller/contract tests.
7. Advertise `PDF` in the Calibration History catalogue.
8. Run backend regression gates.
9. Run repository-level regression checks.
10. Perform final code review.
11. Create the S16-07-05 closure record.

---

## Next boundary

After S16-07-05 closes, no additional report family becomes authorized automatically.

The next S16-07 reporting slice must be selected explicitly from the remaining architecture backlog and must preserve the backend-owned canonical reporting model.
