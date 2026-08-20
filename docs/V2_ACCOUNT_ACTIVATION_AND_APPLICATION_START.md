# V2 Account Activation and Application Start

## Approved operating model

Public applicant registration is disabled. Possession of an institutional email address is not proof that a person is an eligible staff member.

The standard workflow is:

1. HRODD creates or imports the authoritative staff record.
2. HRODD verifies staff number, institutional email, staff category, employment status, rank history, retirement date, and primary organizational assignment.
3. The system creates a dormant staff-access account with no password.
4. The system emails a single-use activation link to the authoritative email address.
5. The staff member opens the link and chooses a private password. HRODD never sees or creates that password.
6. The system displays promotion routes derived from the verified staff record and the active policy version.
7. The applicant selects a route and creates a private draft.
8. The applicant completes the applicable dossier, evidence checklist, self-assessment, and declaration.
9. Submission freezes the policy snapshot, assigns a reference number, and sends an acknowledgement.
10. The case is routed to the correct Head/HOD, Dean/Director, committee, and final authority according to staff category and organizational assignment.

## Important distinctions

- An activation invitation is not a promotion application.
- An eligibility indication is not a promotion decision.
- Creating a draft is not submitting an application.
- Only the applicant's explicit submission creates an official promotion case.
- HRODD may provide assisted data-entry support, but any on-behalf-of action must identify the actor and preserve the applicant's declaration.

## Implemented controls

- `/register` redirects to login and `/api/auth/register` returns `PUBLIC_REGISTRATION_DISABLED`.
- HRODD provisions staff through `/hr/staff-records/new`.
- Dormant accounts are created without a password.
- Activation tokens are random, SHA-256 hashed with a purpose namespace, single-use, and valid for 24 hours.
- Activation requires an active account linked to a `VERIFIED` HRODD staff record.
- Applicant-created passwords require at least ten characters, uppercase, lowercase, and a number.
- Route discovery uses verified rank history, primary assignment, staff category, employment status, retirement cutoff, and versioned policy data.
- Draft creation revalidates the selected route server-side and stores an immutable policy snapshot.

## Notification semantics

| Event | Correct message meaning |
| --- | --- |
| HRODD provisions access | Activate your verified staff access |
| Route becomes available | You may be eligible to apply |
| Applicant creates draft | Draft saved; no official submission yet |
| Applicant submits | Application received with official reference |
| Authorized body decides | Decision communicated by the designated authority |

## Deployment note

The V2 foundation and request-link migrations must be deployed before this workflow can operate against the database. They were deliberately not applied while the configured Neon database was unreachable. Restart the Next.js server after deployment so the compiled application loads the new source.
