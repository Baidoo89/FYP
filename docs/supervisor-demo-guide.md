# Supervisor Demonstration Guide

## Project

**Design and Implementation of a Digital Staff Promotion Support System for GCTU**
**Main presenter:** Benjamin Baidoo, 4231230141

The current authoritative resources are:

- `docs/defence-prep.md` - presentation script and examiner Q&A;
- `docs/final-demo-walkthrough.md` - verified routes, credentials, and demo sequence;
- `docs/defence-day-checklist.md` - one-page operational checklist;
- `defence-pack/GCTU_Promotion_System_Defence_Benjamin_Baidoo.pptx` - presentation deck.

## One-command data reset

```powershell
npm run defence:prepare
```

This prepares a representative Benjamin Baidoo account, one completed application, and one six-document draft. It resets only Benjamin's demonstration workflow and can be rerun safely.

Verify it with:

```powershell
npm run defence:check
npm run db:health
```

## Core defence statement

The system is a role-based promotion decision-support platform. It does not automatically promote staff. It checks configured preconditions using HR-verified evidence, routes the case to human reviewers, and preserves status and audit history. The institutional authority retains the final decision.

## Current account set

All accounts use `Password123!`.

| Role | Email |
| --- | --- |
| Benjamin Baidoo | `benjamin.baidoo@live.gctu.edu.gh` |
| Computer Science HOD | `hod.dean@live.gctu.edu.gh` |
| FoCIS Dean | `dean.focis@live.gctu.edu.gh` |
| HR Administrator | `hr.admin@live.gctu.edu.gh` |
| Committee Reviewer | `committee.reviewer@live.gctu.edu.gh` |
| System Administrator | `system.admin@live.gctu.edu.gh` |

The HOD and Dean accounts share the prototype's technical `HOD_DEAN` permission set, but System Admin enforces department scope for HOD accounts and faculty scope for Dean accounts.
