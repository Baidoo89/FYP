# Final Defence Demonstration Walkthrough

Use [TEAM_TESTING_GUIDE.md](./TEAM_TESTING_GUIDE.md) as the authoritative source for credentials, policy expectations, detailed tests, and reset instructions.

## Before the Demonstration

```powershell
npm run db:health
npm run defence:check
npm run test:v2
npm run build
npm run start
```

Open the URL printed by the server and use its single login page.

## Recommended Order

1. Show that `/register` is unavailable and explain HR/HRODD-controlled staff activation.
2. Sign in as Benjamin Baidoo (`4231230141@live.gctu.edu.gh`, `Applicant123!`) and show automatic Schedule J resolution, Form 2A, academic dossier, evidence, and outputs.
3. Show the scoped HOD and Dean/FAPC assessment sequence.
4. Show HR/HRODD verification and the assessor invitation lifecycle without exposing confidential assessor information to the applicant.
5. Show a committee meeting with named membership, ranks, attendance, conflicts, chair, quorum, and recommendation.
6. Show UAPC/final-authority processing, notification, effective date, audit timeline, and readable case-pack PDF.
7. Compare Sucess Likem's `K-REGISTRY-FIRST` route, which requires an interview but no assessor, with Esther Appiah's `K-FINANCE-MIDDLE` route, which requires one assessor.
8. Demonstrate System Admin technical functions and its denial from promotion case content.
9. Show one mobile-width portal view.
10. Explain that Senior Staff and Junior Staff are policy-blocked pending approved schemes, not implemented with invented rules.

Do not wipe or reseed on demonstration day unless the prepared-data check fails and the whole team agrees.
