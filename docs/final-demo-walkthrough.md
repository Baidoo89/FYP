# Final Demo Walkthrough Checklist

Use this checklist before presenting the GCTU Promotion System.

## Access

Open:

```text
http://localhost:3000/login
```

Password for all demo users:

```text
Password123!
```

| Step | Account | What To Show |
| --- | --- | --- |
| 1 | system.admin@gctu.edu.gh | System dashboard, users, roles, faculties, departments, promotion criteria, settings |
| 2 | lecturer.demo@live.gctu.edu.gh | Lecturer dashboard, application, evidence, profile, notifications |
| 3 | hod.demo@gctu.edu.gh | Department dashboard and application review |
| 4 | hr.admin@gctu.edu.gh | HR dashboard, master queue, evidence verification, audit logs |
| 5 | committee.demo@gctu.edu.gh | Committee dashboard and recommendation page |

## Live Health Checks

Run or open:

```text
/api/health
```

Expected:

```text
success: true
database: connected
```

## Verification Commands

If `node` is available on PATH:

```bash
npx tsc --noEmit
npx next build
npm run smoke
```

On the current machine, Node is available as:

```powershell
D:\node.exe node_modules\typescript\bin\tsc --noEmit
D:\node.exe node_modules\next\dist\bin\next build
```

## Story To Explain

1. A lecturer submits a promotion application and uploads evidence.
2. The HOD/Dean reviews the department-level application.
3. HR verifies evidence and checks eligibility against criteria.
4. The committee reviews verified applications and records recommendations.
5. System Admin manages criteria, structure, users, and settings.
6. Notifications and audit logs preserve traceability.

## Defense Notes

- The platform is a decision-support system, not an automatic promotion engine.
- Eligibility uses verified evidence and configured criteria.
- Final promotion approval remains with authorized university authorities.
- Role-based access ensures each user only sees the correct workflow surface.
- Audit logs and status history support transparency and accountability.