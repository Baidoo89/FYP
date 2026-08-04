# Final Defence Demonstration Runbook

This is the authoritative runbook for the local production demonstration. The data is synthetic and uses Benjamin Baidoo as the applicant.

## Access and credentials

Open `http://localhost:3000/login`.

All defence accounts use `Password123!`.

| Purpose | Account | Scope |
| --- | --- | --- |
| Applicant | `benjamin.baidoo@live.gctu.edu.gh` | Benjamin Baidoo, Computer Science |
| Computer Science HOD | `hod.dean@live.gctu.edu.gh` | Computer Science department |
| FoCIS Dean | `dean.focis@live.gctu.edu.gh` | Faculty of Computing and Information Systems |
| HR Administrator | `hr.admin@live.gctu.edu.gh` | Institution-wide HR workflow |
| Committee Reviewer | `committee.reviewer@live.gctu.edu.gh` | Committee review workspace |
| System Administrator | `system.admin@live.gctu.edu.gh` | Users, structure, criteria, settings |

## Prepare the environment

From the project directory:

```powershell
npm run defence:prepare
npm run defence:check
npm run db:health
npm run defence:live-check
npm run build
```

`defence:prepare` is idempotent. It resets only Benjamin Baidoo's representative applications and creates:

- one completed Lecturer to Senior Lecturer application with six verified PDFs, Criteria Score 100/100, reviews, status history, and audit records;
- one Senior Lecturer to Associate Professor draft with six pending PDFs for an optional live workflow;
- the Benjamin Baidoo login shown above.

It does not delete faculties, departments, criteria, or the seeded role accounts. Run it before every rehearsal and again immediately before the defence.

If the role accounts are missing on a new database, run `npm run db:seed` once before `npm run defence:prepare`.

Start the production build with:

```powershell
npm run start
```

Then confirm `http://localhost:3000/api/health` reports a healthy application and connected database.

## Primary demonstration: four minutes, no risky mutations

Use this unless an examiner explicitly requests the complete live workflow.

### 1. Benjamin Baidoo - 75 seconds

Log in as `benjamin.baidoo@live.gctu.edu.gh`.

Open:

- `/lecturer-portal`
- `/lecturer-portal/applications`
- `/lecturer-portal/evidence`
- `/lecturer-portal/eligibility`

Show the completed application first. Point out:

- the full route from submission to completion;
- six verified evidence categories;
- Criteria Score 100/100 displayed separately from Eligible;
- comments, notifications, and status history.

Say:

> This is representative defence data, not a real personnel record. The score confirms configured evidence completeness; it is not a grade and not the promotion decision.

Then show the draft application with six Pending PDFs.

Say:

> The application is Draft and the documents are Pending because HR has not verified them. Application status and document verification status are intentionally separate.

### 2. System Administrator - 60 seconds

Log out, then use `system.admin@live.gctu.edu.gh`.

Open:

- `/system-admin/dashboard`
- `/system-admin/structure`
- `/system-admin/criteria`

Show three faculties or schools, fourteen departments, account scope rules, and three active rank-transition criteria. Explain that a production setup creates one account per officeholder: up to fourteen HOD and three Dean accounts for the represented structure, while both offices reuse the technical HOD/Dean permission set.

### 3. HR Administrator - 60 seconds

Log in as `hr.admin@live.gctu.edu.gh`.

Open:

- `/hr/dashboard`
- `/hr/requests`
- `/hr/verify`

Find Benjamin's completed application. Show the list-detail queue, PDF preview, verification state, eligibility result, and final recording. Do not change the draft during the safe demonstration.

### 4. Audit and conclusion - 45 seconds

Open `/audit` while using an authorised administrative account. Show actor, action, target, and timestamp.

Conclude:

> The system's contribution is the controlled connection between role scope, verified evidence, decision support, and traceability. Human authorities retain the decision.

## Extended live workflow: seven to nine minutes

Run `npm run defence:prepare` immediately before starting. Use the draft Senior Lecturer to Associate Professor application.

1. **Benjamin:** open `/lecturer-portal/application`, confirm six uploaded categories, and submit.
2. **Computer Science HOD:** open `/hod/review-queue`, select Benjamin, add a concise academic-review comment, and forward to HR.
3. **HR:** open `/hr/verify`, select Benjamin, preview each PDF, and verify all six categories. On the last verification, show the automatic eligibility calculation and routing to Committee Review.
4. **Committee:** open `/committee/review`, record `Recommended` with a professional comment.
5. **HR:** open `/hr/requests`, record authority approval, then complete the workflow.
6. **Benjamin:** return to `/lecturer-portal/applications` and show the completed status history and notification.

Use these comments:

- HOD: `The submitted evidence is complete and relevant to the applicant's department. Forwarded for HR verification.`
- HR verification: `Document reviewed and verified for the representative defence workflow.`
- Committee: `The verified application was reviewed and is recommended to proceed to the institutional authority.`
- Authority record: `Institutional authority approval recorded for the representative defence workflow.`

Narrate only the transition being demonstrated. Silence while a page loads is better than filling time with unrelated explanation.

## Browser setup

- Use a clean browser window at 100 percent zoom.
- Keep the report PDF and slide deck open before the session begins.
- Close personal tabs, notifications, email, and messaging applications.
- Use logout between roles so the session boundary is visible.
- Keep a second browser window on `/api/health` as a quiet fallback.
- Do not expose `.env.local`, database connection strings, source control tokens, or development logs.

## Recovery rules

- If live data is unexpected, stop mutating it and switch to the completed Benjamin record.
- If the server fails, use the implementation screenshots in the deck and Chapter 4.
- If a PDF preview is slow, use `Open full size`; do not repeatedly click Verify.
- If a role cannot see an application, explain the scope rule, verify the selected account, and use the completed record.
- Never create improvised applicant data in front of the panel.

## Final verification output

`npm run defence:check` must report:

- Benjamin Baidoo account found;
- one completed application with score 100/100;
- one Draft application with six pending PDFs;
- twelve stored PDF records in total.
