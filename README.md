# GCTU Promotion System

A professional Digital Staff Promotion Support System for Ghana Communication Technology University (GCTU). The platform supports lecturer promotion applications, verified evidence, role-based review workflows, audit trails, notifications, and configurable promotion criteria.

## Core Capabilities

- Role-based authentication for Lecturer, HOD/Dean, HR Admin, Committee Reviewer, and System Admin.
- Email verification and onboarding for lecturer accounts.
- Promotion request submission with rank, department, years in rank, and evidence tracking.
- Evidence upload and HR document verification.
- Eligibility recommendation based on configured criteria and verified evidence only.
- HOD/Dean departmental review workflow.
- Committee recommendation workflow.
- System Admin management for users, roles, faculties, departments, criteria, and settings.
- In-app notifications for workflow feedback.
- Audit logging for sensitive administrative actions.
- Health check endpoint for database and system readiness.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 18, TypeScript |
| Backend | Next.js App Router API routes |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Styling | Tailwind CSS |
| Authentication | Custom signed session cookie with role claims |

## Project Structure

```text
lecturer-performance-system/
  app/                    Next.js routes, pages, and API handlers
  components/             Shared UI components
  docs/                   Supervisor, deployment, and project documentation
  lib/                    Auth, RBAC, Prisma, workflow, email, audit, notification logic
  prisma/                 Prisma schema and seed scripts
  scripts/                Smoke checks, demo workflow seed, utility scripts
  storage/                Local upload storage for promotion evidence
```

## Local Run

This machine currently exposes Node at:

```text
D:\node.exe
```

Start the development server:

```powershell
D:\node.exe node_modules\next\dist\bin\next dev
```

Open:

```text
http://localhost:3000/login
```

## Demo Credentials

All seeded/demo accounts use:

```text
Password123!
```

| Interface | Login | Role |
| --- | --- | --- |
| Lecturer Portal | lecturer.demo@live.gctu.edu.gh | LECTURER |
| HOD / Dean Portal | hod.demo@gctu.edu.gh | HOD_DEAN |
| HR Admin Portal | hr.admin@gctu.edu.gh | HR_ADMIN |
| Committee Portal | committee.demo@gctu.edu.gh | COMMITTEE_REVIEWER |
| System Admin Portal | system.admin@gctu.edu.gh | SYSTEM_ADMIN |
| Legacy Admin | admin | HR_ADMIN |

Additional local lecturer accounts may also be reset to the same demo password with:

```powershell
D:\node.exe scripts\reset-demo-auth.js
```

## Useful Commands

When Node is on PATH:

```bash
npm run smoke
npm run seed:demo
npm run reset:demo-auth
npx tsc --noEmit
npx next build
```

Using the current direct Node executable:

```powershell
D:\node.exe node_modules\typescript\bin\tsc --noEmit
D:\node.exe node_modules\next\dist\bin\next build
```

## Health Check

```text
GET /api/health
```

Expected healthy response includes:

```json
{
  "success": true,
  "status": "healthy",
  "service": "GCTU Promotion System",
  "database": "connected"
}
```

## Production Domain

The production deployment is prepared for Vercel with the Cloudflare-managed subdomain:

```text
https://promotion.techdalt.com
```

Set these Vercel production environment variables before redeploying:

```text
APP_URL=https://promotion.techdalt.com
NEXT_PUBLIC_APP_URL=https://promotion.techdalt.com
NEXT_PUBLIC_API_URL=https://promotion.techdalt.com
```

These values keep email verification links, public metadata, and app redirects aligned with the live subdomain while leaving the main `techdalt.com` site untouched.

## Recommended Supervisor Demo Flow

1. Log in as System Admin and show users, roles, faculties, departments, settings, and criteria.
2. Log in as Lecturer and show dashboard, application status, evidence upload, profile, and notifications.
3. Log in as HOD/Dean and show departmental application review.
4. Log in as HR Admin and show master queue, document verification, eligibility review, audit logs, and reports.
5. Log in as Committee Reviewer and show committee recommendation workflow.
6. Return to notifications and audit logs to demonstrate traceability.

## Important Academic Point

The system does not automatically promote staff. It supports the university process by producing eligibility recommendations from verified evidence and configured criteria. Final promotion decisions remain with authorized university officers and committees.

## Current Verification Status

Latest verified checks:

- TypeScript compilation passed.
- Production Next.js build passed.
- Local dev server runs on `http://localhost:3000`.
- `/api/health` returns database connected when Neon is reachable.
- All five primary demo role logins return success.

## Documentation

See also:

- `docs/supervisor-demo-guide.md`
- `docs/deployment-checklist.md`
- `docs/01-introduction.md` through `docs/12-license-credits.md`
- `docs/chapter1-introduction.md` through `docs/chapter5-implementation.md`
