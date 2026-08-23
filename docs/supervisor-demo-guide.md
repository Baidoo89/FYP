# Supervisor Demonstration Guide

- **Project:** Design and Implementation of a Digital Staff Promotion Support System for GCTU
- **Main presenter:** Benjamin Baidoo, 4231230141

Use these current documents:

- [TEAM_TESTING_GUIDE.md](./TEAM_TESTING_GUIDE.md): authoritative accounts, routes, UAT cases, role/security tests, reset instructions, and acceptance criteria.
- [final-demo-walkthrough.md](./final-demo-walkthrough.md): concise defence demonstration order.
- [defence-day-checklist.md](./defence-day-checklist.md): operational defence-day checks.
- `defence-pack/GCTU_Promotion_System_Defence_Benjamin_Baidoo.pptx`: presentation deck.

Do not use an old account list that assigns `Password123!` to Benjamin. The applicant accounts use `Applicant123!`; internal role accounts use `Password123!`.

Before a rehearsal:

```powershell
npm run db:health
npm run defence:check
npm run test:v2
npm run build
```

The core defence statement is:

> The system is a governed, role-based promotion decision-support platform. It digitises verified Schedule J and Schedule K workflows, enforces evidence and authority gates, preserves confidentiality and audit history, and leaves the promotion decision with authorised GCTU officers and committees.
