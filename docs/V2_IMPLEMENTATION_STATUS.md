# GCTU Promotion System V2 Implementation Status

**Status date:** 21 August 2026

**Current state:** Defence-ready implementation for verified Schedule J and Schedule K routes

## 1. Implemented Scope

- Public applicant registration is disabled at page, middleware, and API boundaries.
- HRODD provisions a verified staff record and single-use official-email activation invitation.
- Neutral staff identities are separated from effective-dated applicant, HOD, Dean, committee, verification, records, appeal, and system access.
- Schedule J and verified Schedule K routes are versioned and linked immutably to submitted cases.
- Senior Staff and Junior Staff tracks are visible but disabled pending controlled schemes.
- Applicants complete route-specific versioned official forms and immutable submission declarations.
- Schedule J dossiers support outputs, equivalence units, evidence links, Department/Library verification, and frozen best-N packets.
- Schedule K forms cover the verified administrative and professional families and prevent reuse of outputs already counted in frozen applications.
- Formal submission creates route-specific Department, Faculty/FAPC or RAPC, external-assessment where required, UAPC, Council where required, final-notification, and appeal records.
- Case targets use the verified Schedule J six, ten, fifteen, or eighteen-month rules and the Schedule K twelve-month monitoring target.
- Stage due dates and Schedule J quarterly applicant-update deadlines are recorded.
- External assessors receive hashed, expiring, restricted links; conflicts, declarations, signed forms, confidential reports, and delivery attempts are preserved.
- Committee meetings store named members, attendance, rank snapshots, conflicts, recusals, case eligibility, computed quorum, chair/secretary roles, resolutions, and recommendations.
- A failed FAPC may be waived by HRODD only after a named failed-constitution record and formal resolution. Remaining mandatory evidence stages are retained before UAPC.
- HRODD can send tracked quarterly applicant updates. The next deadline advances only when provider delivery is confirmed.
- HRODD can record only a 1 February or 1 August effective date after authority approval, with a mandatory audited reason.
- Appeals use the configured one-month initial window and remain separate from the original decision record.
- Promotion files have access classification, retention, legal hold, archive transfer, disposition authority, and destruction-certificate controls. No case is physically deleted by these actions.
- Official PDF packs contain route, evidence, forms, stages, assessor lifecycle, committee governance, appeals, communications, effective date, and records information according to the exporting role.
- Applicant and HOD exports redact assessor identities and confidential internal material. Records and communication sections are restricted to HRODD.

## 2. Policy Coverage

### Schedule J

- Verified PhD-upgrade, Lecturer, Research Fellow, Senior Lecturer, Senior Research Fellow, Associate Professor, and Professor routes.
- Exact minimum years, output ranges, refereed-output requirements, best-N sizes, assessor counts, and geography controls.
- Independent Teaching, Promotion of Knowledge, and Service assessments.
- Council is the working final authority for Associate Professor and Professor routes while the recorded source conflict remains open.

### Schedule K

- Separate Administrative Senior Member and Professional Senior Member tracks.
- Four independent areas with the two verified core areas.
- Combination-based classifications rather than an arithmetic-average shortcut.
- Verified Registry, Finance, Internal Audit, Procurement, Library, and supplied official-form families.
- UAPC is the working authority for ordinary routes and Council for highest verified routes while the authority conflict remains recorded.

## 3. Database Migrations

The current implementation includes and has applied these later V2 migrations in addition to the foundation migrations:

- `20260810120000_v2_foundation`
- `20260810130000_link_requests_to_v2_policy`
- `20260810140000_staff_access_foundation`
- `20260810150000_document_blob_preservation`
- `20260810160000_schedule_j_dossier_foundation`
- `20260810170000_schedule_j_submission_snapshot`
- `20260810200000_governed_promotion_workflow`
- `20260821090000_official_form_engine`
- `20260821113000_external_assessor_portal`
- `20260821150000_communications_records_and_sla`
- `20260821183000_committee_participant_governance`

The migrations are additive for the promotion expansion and preserve database-backed document blobs. Records disposition is represented by controlled metadata and never by ad hoc deletion from a request handler.

## 4. Defence Accounts

Applicant accounts use password `Applicant123!`:

- Benjamin Baidoo: `4231230141@live.gctu.edu.gh`
- Sucess Likem: `4231230154@live.gctu.edu.gh`
- Esther Appiah: `4231231237@live.gctu.edu.gh`

Seeded internal role accounts use password `Password123!`. Run `npm run defence:check` to print the current five-role roster from the database rather than relying on a copied list.

## 5. Verification

- Prisma schemas are synchronized and the client generates successfully.
- TypeScript validation passes with `npx tsc --noEmit`.
- The V2 regression suite covers policy values, migration safety, roster-first access, route eligibility, official forms, output reuse, assessor confidentiality, committee governance, communications, appeals, and records controls.
- The optimized Next.js production build compiles all application and API routes.
- Defence live checks cover public-registration denial and login/workspace access for three applicants and five internal roles.
- Playwright responsive checks cover the public page and applicant, HOD/Dean, HRODD, committee, and system-administration workspaces at desktop and mobile widths.

## 6. Deliberate Boundaries

The software must not make unsupported institutional decisions for:

- Senior Staff and Junior Staff routes until their current approved schemes are supplied.
- Missing professional ladders or criteria not present in the controlled forms and verified source set.
- Policy conflicts until GCTU records an authorized resolution, source, approver, effective date, and affected version.
- Automatic selection of the February/August effective date until the controlling qualifying-event interpretation is confirmed.
- Production staff identity, SSO, email, trusted signatures, archives authority, and background scheduling until GCTU supplies and approves the integration contracts.

## 7. Operational Commands

```powershell
npm run test:v2
npx tsc --noEmit
npm run build
npm run defence:check
npm run defence:live-check
npm run test:layout
```

Fresh defence data can be recreated with the controlled scripts documented in `package.json`. Database wipe commands are intentionally explicit and must not be used against a live institutional database.

## 8. Controlling Baseline

Implementation decisions follow `docs/GCTU_PROMOTION_SYSTEM_MASTER_REQUIREMENTS_BLUEPRINT_AND_ROUTE_MATRIX.md`. The deep-research addendum records the public evidence and unresolved institutional questions. Chapters 4 and 5 describe the implemented design and current academic conclusions; approved Chapters 1 to 3 are not rewritten by this implementation status.
