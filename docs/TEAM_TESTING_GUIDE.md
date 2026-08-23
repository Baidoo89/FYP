# GCTU Promotion System Team Testing Guide

- **Prepared for:** Benjamin Baidoo and project team
- **Purpose:** The authoritative guide for functional testing, user acceptance testing, and defence rehearsal.

## 1. Scope

The system digitises GCTU staff promotion from an institution-controlled staff account through application, review, assessment, committee consideration, final authority, notification, appeal, and records control.

Implemented policy tracks:

- **Schedule J:** Academic Senior Members.
- **Schedule K:** Administrative and Professional Senior Members.

Senior Staff and Junior Staff are visible but intentionally unavailable until their approved GCTU promotion schemes are supplied. This is a policy safeguard, not a broken screen.

## 2. Rules for All Testers

1. There is **no public registration**. HR/HRODD maintains the staff roster and activates staff accounts.
2. Everyone uses the same `/login` page. The account role opens the correct portal; users do not select a role.
3. Use only the synthetic accounts below. Do not enter real confidential or assessor data.
4. Applicants see only their own cases. Reviewers see only records allowed by their role and organisational scope.
5. The software controls and records the process; authorised GCTU officers and committees make promotion decisions.
6. A form marked `Pending` is not the same as an application in `Draft`.
7. Do not reset or seed while another person is testing.

## 3. Start and Preflight

From the project directory:

```powershell
npm run db:health
npm run defence:check
npm run test:v2
npm run dev
```

Open `http://localhost:3000/login` unless the terminal gives another port.

Begin shared testing only when `db:health` and `defence:check` pass. If Neon cannot be reached, restore internet/database access. Do not wipe or seed to fix a connection error.

For a production-style rehearsal:

```powershell
npm run build
npm run start
```

## 4. Accounts

### Applicants

| Name | Email | Password | Category | Route |
|---|---|---|---|---|
| Benjamin Baidoo | `4231230141@live.gctu.edu.gh` | `Applicant123!` | Academic Senior Member | Lecturer to Senior Lecturer |
| Sucess Likem | `4231230154@live.gctu.edu.gh` | `Applicant123!` | Administrative Senior Member | Junior Assistant Registrar to Assistant Registrar |
| Esther Appiah | `4231231237@live.gctu.edu.gh` | `Applicant123!` | Professional Senior Member | Accountant to Senior Accountant |

`Sucess` is the spelling in the demonstration data.

### Internal Users

| Role | Email | Password |
|---|---|---|
| Computer Science HOD | `hod.dean@live.gctu.edu.gh` | `Password123!` |
| FoCIS Dean | `dean.focis@live.gctu.edu.gh` | `Password123!` |
| HR/HRODD Administrator | `hr.admin@live.gctu.edu.gh` | `Password123!` |
| Committee Reviewer | `committee.reviewer@live.gctu.edu.gh` | `Password123!` |
| System Administrator | `system.admin@live.gctu.edu.gh` | `Password123!` |

These credentials are for local demonstration only and must not be reused in deployment.

Successful login redirects automatically:

- Applicants: applicant portal with eligible `J-` or `K-` routes.
- HOD and Dean: `/hod/review-queue`.
- HR/HRODD: `/hr/requests`.
- Committee Reviewer: `/committee/review`.
- System Administrator: `/system-admin/dashboard`.

## 5. Role Boundaries

| Role | Allowed | Must be denied |
|---|---|---|
| Applicant | Start an eligible case, complete forms/evidence, submit, track, correct, and appeal when allowed | Other applicants' cases, internal role selection, confidential assessor identities/reports |
| HOD/Dean | Review assigned department/faculty cases and complete official assessments | Unrelated organisational cases and unauthorised final decisions |
| HR/HRODD | Roster, verification, assessor administration, notices, effective dates, and records | Acting as applicant or bypassing mandatory stages |
| Committee Reviewer | Named meetings, attendance, conflicts, quorum, recommendations, and authorised decisions | Own-case review or action without constitution/quorum |
| System Administrator | Technical users, organisation, settings, criteria, and system health | Dossiers, assessments, deliberations, assessor reports, and promotion decisions |
| External Assessor | Expiring invitation, conflict declaration, and assigned report | Internal login, other cases, or access after expiry/revocation/submission |

## 6. Case A: Benjamin, Schedule J

**Route:** `J-LECTURER-TO-SENIOR-LECTURER`

**Expected policy:** Four years in rank; 6 to 10 submitted outputs; six refereed outputs; six best outputs; one external assessor; UAPC final authority.

```text
Applicant -> Department -> Faculty/FAPC -> External assessment -> UAPC -> Final notification
```

1. Sign in as Benjamin and start Lecturer to Senior Lecturer.
2. Confirm automatic Schedule J resolution from his staff record and rank.
3. Complete Form 2A, academic dossier, evidence, and scholarly-output register.
4. Add enough valid outputs to exercise the 6 to 10 rule and select the six best.
5. Sign/freeze and submit. Missing or unfrozen mandatory material must block submission.
6. As Computer Science HOD, complete the scoped Schedule J Department Assessment.
7. As Dean/committee user, complete the Faculty/FAPC assessment and governed meeting.
8. As HR/HRODD, verify the case and administer the required assessor.
9. Open the invitation in a private browser, accept, declare no conflict, complete, freeze, and submit the Schedule J independent report.
10. Confirm Benjamin cannot see the assessor's identity or confidential report.
11. Record the UAPC meeting with named members, ranks, attendance, conflicts, chair, quorum, recommendation, and decision.
12. HR/HRODD issues the notification and records an allowed effective date and reason.
13. Benjamin confirms the outcome and complete, unchanged timeline.

## 7. Case B: Sucess, Schedule K Administrative

**Route:** `K-REGISTRY-FIRST`

**Expected policy:** Two years in rank; first-tier Schedule K assessment; interview required; no external assessor; UAPC final authority.

```text
Applicant -> Department/Supervisor -> RAPC -> UAPC -> Final notification
```

1. Sign in as Sucess and start Junior Assistant Registrar to Assistant Registrar.
2. Complete and freeze Schedule K Application Part A with required evidence.
3. Confirm no external-assessor stage is requested.
4. Complete the confidential supervisor form and Registry Ability in Work / Knowledge in Work assessment.
5. Record the required promotion interview.
6. Complete RAPC human-relations and service forms with a valid named meeting.
7. Complete UAPC overall assessment and recommendation. Verify configured Schedule K constitution rules, including Vice-Chancellor participation.
8. Record UAPC's final decision; HR/HRODD then issues notification and effective date.
9. Confirm the applicant sees progress/outcome but not reviewer-confidential material.

## 8. Case C: Esther, Schedule K Professional

**Route:** `K-FINANCE-MIDDLE`

**Expected policy:** Four years in rank; middle-tier Schedule K assessment; one external assessor; no reuse of previously counted outputs; UAPC final authority.

```text
Applicant -> Department/Supervisor -> RAPC -> External assessment -> UAPC -> Final notification
```

1. Sign in as Esther and start Accountant to Senior Accountant.
2. Complete/freeze Schedule K Application Part A and attach area evidence.
3. Complete the supervisor form and Finance/Audit/Procurement Ability in Work assessment.
4. Complete RAPC human-relations and service forms through a valid meeting.
5. HR/HRODD administers one assessor; submit the Schedule K Promotion of Work / Application of Knowledge report through its invitation.
6. Attempt to reuse a counted output; the system must block it.
7. Complete UAPC's final assessment and decision.
8. Issue notification/effective date and generate the complete case pack and audit trail.

## 9. Meeting Tests

For FAPC, RAPC, UAPC, Council, and Appeals Committee activity:

1. Enter test members by name and rank, not `Member 1` placeholders.
2. Record attendance, chair, conflicts, and recusals.
3. The applicant must not decide or count toward quorum for their own case.
4. Below-quorum action must be blocked clearly.
5. A conflicted participant must be blocked or excluded.
6. Save the required recommendation, reason, vote, and decision details.
7. Confirm the audit trail records actor and time.

The FAPC waiver is an exceptional HRODD record after a failed constitution attempt. It is not a normal shortcut.

## 10. Negative and Security Tests

Record each separately:

1. `/register` must not offer public self-registration.
2. An incorrect password must be denied without revealing account details.
3. One applicant must be denied another applicant's request URL.
4. System Admin must be denied HR case content, committee review, audit evidence, records, and external reports.
5. Computer Science HOD must be denied unrelated department/faculty cases.
6. Missing required forms/evidence must block submission with a useful message.
7. A signed/frozen official form must not be editable.
8. A stage must not advance without its form, report, recommendation, meeting, or quorum.
9. Duplicate or previously used outputs must be blocked where prohibited.
10. Self-review and conflicted decisions must be blocked.
11. Invalid effective dates must be blocked; exercise the configured 1 February / 1 August control and reason.
12. Records disposition before retention expiry or during legal hold must be blocked.
13. Expired, revoked, already-submitted, or reused assessor tokens must not grant access.

## 11. Status Meanings

- **Draft:** Started but not submitted.
- **Submitted:** Formally entered the governed workflow.
- **Pending form/document:** That item awaits action; the whole case may already be submitted.
- **Returned for correction:** The applicant can correct and resubmit; history remains.
- **Under review:** The named stage owns the next action.
- **Recommended / Not recommended:** A committee recommendation, not necessarily the legal final decision.
- **Approved by authority:** The final authority acted; HR/HRODD still records implementation and notice.
- **Completed:** Final processing and notification are recorded.
- **Provisional route:** A documented policy conflict/confirmation point is exposed rather than silently invented.

## 12. Desktop and Mobile

Test main portals at about `1440 x 900` and `390 x 844`.

- No unexplained blank bands, unusable columns, or horizontal page overflow.
- No vertical, clipped, overlapping, or unreadable text.
- Tables adapt or remain usable.
- Buttons, menus, modals, forms, uploads, and statuses work.
- PDF preview provides an open/download fallback if inline viewing fails.
- Keyboard focus and field errors are clear.
- Refresh and Back do not corrupt state.

Cover login, dashboards, request details, forms, assessor, committee, and administration screens.

## 13. Team Assignment

| Person | Primary test |
|---|---|
| Benjamin | Case A and master results |
| Sucess | Case B, interview, supervisor, and RAPC |
| Esther | Case C, professional forms, assessor, and output reuse |
| Rotating second tester | HOD/Dean, HR, Committee, Admin, security, and mobile checks without self-approval |

Exchange roles for a second pass; nobody should validate only their own work.

## 14. Result and Defect Format

Use one row per test:

| ID | Date | Tester | Role/account | Request ID | Preconditions | Steps | Expected | Actual | Result | Severity | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| UAT-001 | | | | | | | | | Pass/Fail/Blocked | | Screenshot/log |

- **Blocker:** Testing or an end-to-end route cannot continue.
- **Critical:** Security, confidentiality, data loss, wrong authority, or wrong final decision.
- **Major:** Required feature/policy control fails but a workaround exists.
- **Minor:** Non-blocking layout, wording, or usability issue.

Every defect needs URL, role, request ID, exact steps, expected/actual results, screenshot, time, reproducibility, browser/device, and relevant console/network error. Never include passwords in evidence.

## 15. Reset and Recovery

Safest demonstration-data reset:

```powershell
npm run demo:reset
npm run demo:recreate
npm run defence:check
```

`demo:recreate` recreates the three synthetic applicants while retaining the wider configured system.

Full destructive fresh start:

```powershell
npm run demo:fresh-start
```

Use the full fresh start only with explicit team approval, only on the test database, and only when nobody needs its data. Never run it against an active shared or production database.

## 16. Acceptance Criteria

Testing is complete when:

1. All three main cases reach their expected final stages.
2. Forms, evidence, freeze/sign, assessor, meeting, quorum, and authority gates cannot be bypassed.
3. Cross-user, cross-department, and System Admin access tests are denied.
4. Assessor confidentiality is preserved.
5. Corrections, decisions, notices, effective dates, appeals, and records actions are auditable.
6. The case-pack PDF is complete and readable.
7. No Blocker or Critical defect remains.
8. Desktop/mobile testing has no workflow-blocking layout defect.
9. Senior Staff and Junior Staff remain unavailable pending verified schemes.
10. `npm run test:v2` and `npm run build` pass on the final revision.

## 17. Known Demonstration Boundaries

- Development email may be logged instead of delivered unless a mail provider is configured.
- Seeded login is not production institutional SSO/directory integration.
- Senior Staff and Junior Staff still require approved GCTU schemes.
- Official sources contain documented conflicts; provisional resolutions/confirmation points remain visible.
- Production trusted signatures, storage/records infrastructure, and scheduled-job hosting are deployment integrations.

Describe these honestly as controlled boundaries. Do not claim that unverified policy or production integrations are complete.
