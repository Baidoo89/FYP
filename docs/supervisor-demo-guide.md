# Supervisor Demo Guide

## Project

Digital Staff Promotion Support System for Ghana Communication Technology University (GCTU)

## Demo Logins

All seeded accounts use:

```text
Password123!
```

| Role | Email |
| --- | --- |
| Lecturer | lecturer.demo@live.gctu.edu.gh |
| HOD/Dean | hod.demo@gctu.edu.gh |
| HR/Admin | hr.admin@gctu.edu.gh |
| Committee Reviewer | committee.demo@gctu.edu.gh |
| System Admin | system.admin@gctu.edu.gh |

## Core Routes

| Area | Route |
| --- | --- |
| Login | `/login` |
| Lecturer Portal | `/lecturer-portal` |
| HOD/Dean Dashboard | `/hod/dashboard` |
| HOD/Dean Applications | `/hod/applications` |
| HR Dashboard | `/hr/dashboard` |
| HR Master Queue | `/hr/requests` |
| HR Verification | `/hr/verify` |
| Committee Dashboard | `/committee/dashboard` |
| Committee Review | `/committee/review` |
| System Admin Dashboard | `/system-admin/dashboard` |
| User Management | `/system-admin/users` |
| Institution Structure | `/system-admin/structure` |
| Promotion Criteria | `/system-admin/criteria` |
| Notifications | `/notifications` |
| Audit Logs | `/audit` |

## Recommended Presentation Flow

Prepare a populated workflow:

```bash
npm run seed:demo
```

1. Start at `/login` and explain the five role model.
2. Show System Admin:
   - Manage users and roles.
   - Manage faculties and departments.
   - Manage promotion criteria.
   - View audit logs.
3. Show Lecturer:
   - Profile and onboarding.
   - Promotion application.
   - Evidence upload.
   - Notifications and feedback.
4. Show HOD/Dean:
   - Department review queue.
   - Forward to HR or return for correction.
5. Show HR/Admin:
   - Master queue.
   - Document verification.
   - Eligibility recommendation based only on verified evidence.
6. Show Committee Reviewer:
   - Review verified applications.
   - Add comments and recommendation.
7. Return to HR/Admin or System Admin:
   - Show status history, audit logs, and reports.

## Important Defense Point

The system does not automatically promote staff. It supports the official university process by generating eligibility recommendations from verified evidence and configured criteria. Final decisions remain with authorized university authorities.

## Verification Commands

```bash
npm run smoke
npx tsc --noEmit
npx next build
```
