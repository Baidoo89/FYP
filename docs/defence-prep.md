# Defence Preparation

This document is a practical prep sheet for the oral defence: a one-paragraph pitch, a live demo script, and prepared answers to the questions a supervisor/examiner is likely to ask. It is written against the final state of the project (Chapter 4/5 rebuilt with activity/sequence diagrams, formal test tables, and the corrected eligibility-score terminology).

## 1. The 60-second pitch

"GCTU's staff promotion process today is largely manual: physical documents, inconsistent routing, and no shared visibility into where an application is. This project is a Digital Staff Promotion Support System — it digitises submission, evidence upload, department review, HR verification, committee recommendation, and the final institutional decision, with a rule-based engine that checks evidence completeness against configured criteria and produces a recommendation. It does not replace GCTU's decision-makers — HOD/Dean, HR, the Committee, and the institutional authority still make every real decision; the system gives them a shared, auditable record to make those decisions against. It's built as a production Next.js/TypeScript app on PostgreSQL, deployed live, and was tested end-to-end through the real browser UI, which is how a genuine scoring defect was found and fixed during development."

## 2. Live demo script (~12–15 minutes)

Before the defence: seed a fresh demo lecturer account and, ideally, walk it partway through the workflow yourself once beforehand so you know exactly what each screen looks like with real data (the previous demo account used during development was deliberately deleted to give a clean account for fresh testing — see the note at the end of this section).

1. **Login (Figure 17)** — show that role is resolved server-side; log in as the lecturer.
2. **Lecturer portal** — create an application (current → target rank), open Evidence Categories, upload one PDF under Teaching. Point out the required-vs-optional category badges and that the upload panel now auto-scrolls into view on a narrow window.
3. **Submit** — submit the application; show the status change and mention that this triggers the routing logic (Figure 14) that finds the correct HOD/Dean for this lecturer's specific department.
4. **Switch to HOD/Dean** — open the review workspace, show the department-scoping (mention: a different HOD account only sees their own department — this is a good moment to preempt the "does routing actually work" question).
5. **Forward to HR.**
6. **Switch to HR** — open the master queue, verify each document, and when the last required category is verified, show the eligibility result. **This is the moment to explicitly narrate the terminology**: "Criteria Score is 100 out of 100 — that means every required evidence category was verified, not that this person's work was graded 100%. The Eligible badge next to it is the actual recommendation, and it's shown separately on purpose."
7. **Switch to Committee** — open the eligible application, show the recommendation form, submit Recommended with a comment.
8. **Switch back to HR** — Record authority approval, then Complete workflow. Show the Status History panel end to end (Draft → … → Completed) as the audit trail.
9. **Analytics** — show the institution-wide dashboard, and if time allows, log in as a department-scoped HOD again to show the same page automatically scoped to just their department.
10. **Close** on the eligibility engine defect story if asked, or proactively if there's time: "This exact workflow is what surfaced a real scoring bug during development — the engine was silently giving everyone a score of zero. It only showed up once we ran the full workflow, not from reading the code, which is the argument in Chapter Four for why we tested the running system rather than trusting a code review."

**Data note for whoever runs the demo**: the lecturer test account used throughout earlier development was intentionally deleted (at the student's request) to remove leftover test data before final testing. Before the defence, either (a) run steps 2–9 once yourself in advance to leave a real Completed application in the system for a faster live walkthrough, or (b) do the whole walkthrough live during the defence itself — both are legitimate, but decide in advance rather than discovering an empty database on the day.

## 3. Anticipated questions and prepared answers

**Q: Why is eligibility shown as a score if it's not a grade?**
A: It's now explicitly labelled "Criteria Score" and shown as n/100, separate from the "Eligible/Not Eligible" recommendation badge — Chapter Four §4.9.1 explains the terminology and why the two are never conflated on screen.

**Q: Does 100 mean the lecturer deserves promotion?**
A: No — it means the required evidence categories were verified as present. It's a completeness measure, not a quality grade. The actual promotion decision is made by HR, the Committee, and the institutional authority, not the engine.

**Q: Which parts of Schedule J have been implemented? Where is Schedule K?**
A: The academic pathway (Teaching, Research, Service) under Schedule J is fully implemented and demonstrated end-to-end. Schedule K (administrative/professional staff) was out of scope for this prototype — the criteria model is configurable so it could be extended, but that extension wasn't built. This is stated directly in Chapter Four §4.9.1 and listed as future work in Chapter Five §5.8.

**Q: Who enters or confirms scores?**
A: No one enters a score directly. It's computed automatically from which evidence categories HR has verified. A human can't type in an arbitrary score — that was a deliberate design choice to keep the number tied to actual verified evidence.

**Q: What's the difference between department review (HOD/Dean) and HR verification?**
A: HOD/Dean review is an academic completeness check within the department — is this evidence relevant and complete for this applicant's field. HR verification is the official, binding verification of each document. They're sequential and distinct steps; the system labels them separately so they aren't treated as interchangeable (Chapter Four §4.7.3–§4.7.4).

**Q: Why does HR record the final authority decision instead of the Committee?**
A: The Committee's role is to record a recommendation. GCTU's actual institutional authority (not modelled as a separate system role in this prototype) makes the real decision; HR records that outcome into the system on the authority's behalf. This separation is shown explicitly in the sequence diagram in Figure 16.

**Q: Is the committee recommendation final?**
A: No — see above. It's a recommendation; the workflow has a distinct "Record authority approval" step after it.

**Q: What happens when a policy changes (e.g. required evidence categories)?**
A: A System Administrator reconfigures the promotion criteria (required categories, weights, minimum years, minimum score) through the admin UI — no code change or redeploy needed (Chapter Four §4.12.7, Figure 25).

**Q: How are promotion criteria versioned?**
A: They currently aren't versioned historically — changing criteria affects future eligibility calculations going forward. This wasn't explicitly required in the approved scope; if asked, acknowledge it as a reasonable extension rather than claiming it's handled.

**Q: How do you prevent lecturers from editing evidence after submission?**
A: Evidence upload is locked once the application is under active review; it only reopens if HR or the department explicitly returns the file for correction (visible in the lecturer evidence page — the "upload locked" state).

**Q: What happens when evidence is returned?**
A: The application status changes to Returned for Correction, the lecturer is notified with the specific reason, and they can then re-upload just the affected category before resubmitting.

**Q: How was user acceptance tested?**
A: Honestly: a task-based UAT script and feedback form were prepared (Chapter Four §4.13.7, `docs/uat-materials.md`), but the exercise had not been run with real participants at the time of writing — this is disclosed as an explicit limitation (Chapter Five §5.6, item 7) rather than claimed as completed. If it has since been run, be ready to summarise real results instead.

**Q: How many users participated in requirement gathering?**
A: Point to Chapter Three's methodology section (Population of the Study / Sample and Sampling Technique / Data Collection Methods) for the actual figures used during requirements gathering — this is separate from UAT, which tests the built system rather than gathering requirements for it.

**Q: What testing evidence confirms the system meets the objectives?**
A: Chapter Four §4.13 — 36 formal functional/integration test cases (Table 4), a scripted database health check, and a full end-to-end browser-driven workflow test that is what actually caught the scoring defect described in §4.9.2.

**Q: Why is an unused Score table still in the database?**
A: It was superseded when the eligibility engine was corrected to compute scores directly from verified document categories instead of that table. It's flagged explicitly as a cleanup item in Chapter Five §5.8 rather than silently left in.

**Q: How are uploaded confidential files protected?**
A: Files are stored as binary data in the database (not on a public filesystem), access is gated by the same role/session checks as everything else, and downloaded filenames were changed during this study to no longer expose internal storage identifiers (Chapter Four §4.13.8 defects table).

**Q: Is the health endpoint exposing sensitive information?**
A: It reports only application/database connectivity status for post-deploy verification, not any promotion or personal data.

**Q: Why was the Prototyping methodology appropriate here?**
A: Point to Chapter Three's methodology justification — the short version: requirements were partly tacit/institutional (GCTU's own documents had to be interpreted), so building and revising a working system was more effective than a single up-front specification, and the corrected eligibility defect is itself an example of that iterative discovery.

**Q: What is genuinely novel about the project?**
A: Not the individual techniques (RBAC, workflow engines, and rule-based decision support all exist elsewhere) but the localisation: a promotion workflow and evidence model built directly from GCTU's own Basic Laws, Conditions of Service, and Handbook, with department/faculty-aware routing so it works correctly across GCTU's actual organisational structure rather than a generic one-size-fits-all HR tool.

**Q: If I click into the queue with multiple applications from the same department, is it usable?**
A: Yes — demonstrate live if possible: filters (department, faculty, rank, workflow stage, date range), search, sort, and a list-then-detail layout, not a flat dump. The one honest caveat is that on narrow mobile widths it's a single stacked column rather than a dedicated mobile navigation pattern — disclosed as a limitation, not hidden.

## 4. If something goes wrong during the live demo

- If the database is empty or in an unexpected state, don't improvise data — say plainly "let me switch to the screenshots in Chapter Four while I reset this," and use the figures in the document as a fallback narrative. This is more credible than a panicked live fix.
- If a network hiccup makes Vercel slow, mention it's a live serverless deployment (not a local mockup) and give it a moment rather than apologising repeatedly.
