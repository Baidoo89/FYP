# GCTU Promotion System V2 Implementation Status

**Status date:** 10 August 2026

**Current phase:** Foundation aligned to the master baseline; Schedule J dossier implementation next

## 1. Completed in this slice

The V2 foundation is additive and keeps the current portals operational while the full promotion system is introduced in controlled slices.

- Authoritative staff profile separated from login access.
- Staff categories for Academic Senior Member, Administrative Senior Member, Professional Senior Member, Senior Staff, and Junior Staff.
- Versioned rank catalogue and staff rank history.
- Hierarchical University, Faculty/School, Department, Directorate, Unit, and Library structure.
- Office appointments separated from permanent rank and account role.
- Versioned policy-source registry with authority, effective period, provenance, and status.
- Separate Schedule J, Schedule K Administrative, Schedule K Professional, Senior Staff, and Junior Staff tracks.
- Route-level years, outputs, refereed outputs, best-N, assessor count, assessor geography, area classifications, and final authority.
- Explicit policy-conflict register with provisional resolutions and responsible GCTU office.
- Senior Staff and Junior Staff tracks blocked until their controlled Unified Schemes are supplied.
- Public applicant registration is disabled. HRODD provisions a verified staff record and sends a single-use activation link to the official staff email.
- Neutral `STAFF` accounts replace the legacy practice of assigning every applicant the `LECTURER` role; existing lecturer accounts remain compatible.
- An authoritative staff record can exist before an account is linked, supporting future HRODD roster import.
- Effective-dated staff access assignments separate applicant, HOD, Dean, committee, verification, records, and appeal responsibilities from permanent rank.
- Schedule J academic dossier foundation with structured scholarly outputs, exact equivalence units, Department and Library verification states, and ordered best-N assessment packets with output snapshots.
- Applicant Academic Dossier workspace added for Form 2A-style metadata, route-bound output claims, declaration, readiness blockers, and best-N selection.

## 2. Verified policy data implemented

### Schedule J

- Assistant Lecturer to Lecturer PhD-upgrade route.
- Assistant Research Fellow to Research Fellow PhD-upgrade route.
- Lecturer to Senior Lecturer: 4 years, 6-10 outputs, best 6, one external assessor.
- Research Fellow to Senior Research Fellow: 4 years, 8-12 outputs, best 8, one external assessor.
- Senior Lecturer to Associate Professor Case I: 4 years, 10-15 outputs, best 10, two assessors, one outside Ghana.
- Senior Research Fellow to Associate Professor Case II: 4 years, 12-16 outputs, best 12, two assessors, one outside Ghana.
- Associate Professor to Professor Case I: 3 years, 15-20 outputs, best 15, two assessors, one outside Ghana.
- Research-track Associate Professor to Professor Case II: 3 years, 20-30 outputs, best 20, two assessors, one outside Ghana.
- Independent Teaching, Promotion of Knowledge, and Service classifications.
- Associate Professor and Professor routes use Council after UAPC as the working authority while the handbook conflict remains visible.

### Schedule K

- Separate administrative and professional staff-category tracks.
- Four independent areas, with Ability/Knowledge in Work and Promotion/Application of Knowledge marked as core.
- First-, middle-, and highest-tier classification combinations, not arithmetic-average shortcuts.
- Verified Registry, Finance, Internal Audit, Procurement up to the published level, and Library routes.
- Output-reuse prohibition and the shared six-month retirement cutoff.
- Schedule K routes remain provisional at the final-decision boundary; the working rule is UAPC for ordinary routes and Council for Deputy/approved analogous routes.

## 3. Database status

Migrations:

- `prisma/migrations/20260810120000_v2_foundation/migration.sql`
- `prisma/migrations/20260810130000_link_requests_to_v2_policy/migration.sql`
- `prisma/migrations/20260810140000_staff_access_foundation/migration.sql`
- `prisma/migrations/20260810150000_document_blob_preservation/migration.sql`
- `prisma/migrations/20260810160000_schedule_j_dossier_foundation`n- `20260810170000_schedule_j_submission_snapshot` (immutable dossier snapshot, receipt number, and scholarly-output evidence links)/migration.sql`

The foundation migrations add:

- the V2 policy, rank, organization, and staff tables;
- nullable links from legacy promotion requests to frozen V2 route/rank/assignment records;
- the neutral `STAFF` role and explicit `DISABLED_PENDING_POLICY` evidence state;
- an optional staff-record/account link for roster-first provisioning;
- effective-dated `staff_access_assignments` with restrictive organization references.

The migration files contain no drop, delete, truncate, or rename of a legacy table. All six migrations are applied to the configured Neon database.

The verified V2 policy foundation is seeded with 9 policy sources, 26 organization units, 27 rank definitions, 5 tracks, 22 routes, and 12 tracked policy conflicts. No applicant account was created by the V2 seed. The live `document_file_blobs` table is modeled as a managed `DocumentFileBlob` relation and preserved by an idempotent migration. The post-deployment Prisma diff is empty.

## 4. Verification completed

- Both active Prisma schemas validate successfully.
- Both active Prisma schemas are identical.
- Prisma client exposes the new V2 delegates.
- TypeScript check passes with `tsc --noEmit`.
- `npm run test:v2` passes all 38 policy, migration-safety, account-entry, access-assignment, authority, and Schedule J dossier tests.
- `npm run build` passes with the Academic Dossier page and API routes included.
- Local server health check returns 200 with the database connected; unauthenticated dossier API access returns 401.
- Legacy seed years were corrected from 5 to 4 for Senior Lecturer to Associate Professor and from 5 to 3 for Associate Professor to Professor.

## 5. Deliberately unavailable rules

The system must not make production eligibility decisions for these items until controlled GCTU evidence is supplied:

- Senior Staff Unified Scheme rules.
- Junior Staff Unified Scheme rules.
- Legal and Sports Schedule K ladders and rubrics.
- Procurement promotion above Senior Assistant Procurement Officer.
- Works, ICT, and Health route criteria are verified in the master baseline but are not yet seeded into the executable policy catalogue.
- Final Schedule K UAPC/Council approval boundary.
- Appeals Board one-month versus fourteen-day filing conflict.
- Any automatic mapping from the 2024 workload scorecard to Schedule J classification.

## 6. Next implementation slice

1. Formal submission now validates and freezes the Schedule J dossier, best-output packet, immutable snapshot, and receipt number.
2. Connect structured scholarly output records to versioned evidence attachments and PDF verification while keeping the existing blob storage protected.
3. Add HOD and Library verification workspaces for scholarly outputs, including correction and replacement versions.
4. Build the remaining Form 2A sections: qualifications, teaching activity, supervision, research projects, grants, service, appraisal, and assessor proposals.
4. Add FAPC/RAPC/UAPC/Council workflow tasks, committee records, assessor handling, SLAs, and communication history.
5. Add HOD/Dean/Head/committee workspace switching from effective-dated access assignments.
6. Add internal petitions and Appeals Board case handling after the filing-window conflict is formally configured.

## 7. Operational commands

```powershell
npm run test:v2
node_modules\.bin\dotenv.cmd -e .env.local -- node node_modules\prisma\build\index.js validate --schema prisma\schema.prisma
npm run db:deploy
npm run db:seed:v2
```

Do not run `db:seed:v2` before the V2 migration has been applied successfully.

## 8. Controlling implementation baseline

Implementation decisions now follow `docs/GCTU_PROMOTION_SYSTEM_MASTER_REQUIREMENTS_BLUEPRINT_AND_ROUTE_MATRIX.md`. Earlier research documents remain supporting evidence, but unresolved assumptions in older code or documentation do not override the master route and clarification matrices.


## Governed workflow foundation

- Migration `20260810200000_governed_promotion_workflow` is applied.
- Formal submission initializes route-specific Department, Faculty/RAPC, External Assessment, UAPC, and Council stage records.
- Promotion assessments, external assessor lifecycle records, committee meetings/minutes, and appeal cases are modeled separately.
- `/api/promotion-requests/[id]/governance` exposes authorized stage data with confidential assessor filtering.
- Governed stage actions enforce role, assignment, and self-review controls and write audit records.
- Remaining implementation: visible FAPC/RAPC/UAPC/external-assessor workspaces, complete Form 2A and administrative assessment forms, and final authority/appeal screens.
