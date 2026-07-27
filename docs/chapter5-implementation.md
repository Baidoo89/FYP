# CHAPTER FIVE: SUMMARY, CONCLUSION, AND RECOMMENDATIONS

## 5.1 Introduction

This chapter presents a summary of the study, evaluates the implemented system against the objectives set out in Chapter One, states the conclusions drawn from the design, implementation, and testing process, and offers recommendations and suggestions for future work.

## 5.2 Summary of the Study

This project designed and implemented a Digital Staff Promotion Support System for Ghana Communication Technology University. The study began by identifying operational weaknesses in GCTU's existing, largely manual promotion process — limited application-status visibility, dependence on physical documentation, administrative delays from manual routing, inconsistent application of promotion criteria, and weak auditability (Chapter One). A review of relevant literature and existing systems (Interfolio, Watermark Faculty Success, Workday HCM, Oracle HCM, and the University of Ghana's promotion process) established that these problems are common to manual and semi-digitised promotion workflows, and confirmed a gap: no existing system was localised to GCTU's specific promotion structure, evidence categories, and institutional criteria (Chapter Two).

A prototype was then designed and built using the Prototyping methodology: a Next.js/TypeScript web application backed by a PostgreSQL (Neon) database through Prisma ORM, implementing role-based access control for five distinct roles, a document evidence-upload and verification workflow, a rule-based eligibility decision-support engine, audit logging, and reporting (Chapter Three, Chapter Four).

The completed system was tested against its own approved specification and, critically, exercised end-to-end in a live browser session covering the full workflow from lecturer submission through HOD review, HR verification, committee recommendation, and HR final decision. This testing surfaced and corrected a real defect in the eligibility engine before completion (Chapter Four, §4.7.2 and §4.11.3).

## 5.3 Achievement of Objectives

| Objective (Chapter 1, §1.4.2) | Status | Evidence |
|---|---|---|
| 1. Examine operational bottlenecks in the existing manual process | Achieved | Documented in Chapter One (§1.3) and Chapter Three (§3.9–3.10), grounded in GCTU's own Basic Laws, Conditions of Service, and Administrative Procedures Manual |
| 2. Design a standardised digital workflow for submission, evidence upload, verification, tracking, and reporting | Achieved | Implemented workflow state machine (Chapter Four, §4.4); verified end-to-end from submission through completion |
| 3. Develop a secure centralised database for profiles, requests, evidence, verification records, eligibility outcomes, and audit logs | Achieved | Relational schema implemented in PostgreSQL via Prisma (Chapter Four, §4.3); `Document`, `Verification`, `AuditLog`, and `StatusHistory` entities all populated and confirmed in live testing |
| 4. Implement role-based access control separating lecturer, HR/Admin, HOD/Dean, reviewer, and system administrator responsibilities | Achieved | RBAC enforced centrally (`assertActorRole`, `canTransitionStatus`) and confirmed server-side, not just hidden in the UI (Chapter Four, §4.6, §4.11.4) |
| 5. Develop a rule-based eligibility support engine checking verified evidence against institutional criteria | Achieved, with a corrected defect | Implemented per the approved scoring bands (Chapter Four, §4.7); an initial implementation defect that caused every application to score 0% was found and corrected during end-to-end testing |
| 6. Improve transparency and accountability through real-time tracking, structured feedback, reporting, and audit logging | Achieved | Status History and Audit Trail confirmed populated and correct across a full application lifecycle (Chapter Four, §4.11.3); CSV/PDF reporting implemented |

All six objectives set out in the approved proposal were achieved. Objective 5 is worth stating plainly rather than glossing over: the first implementation did not actually work end-to-end, and would have shipped a system that silently marked every applicant ineligible regardless of the quality of their evidence, had it not been tested against the live, running application rather than judged correct from reading the code alone.

## 5.4 Conclusion

The study set out to determine whether a digital staff promotion support system could meaningfully improve the transparency, accountability, and efficiency of GCTU's promotion process without displacing the university's statutory decision-making authorities. The completed and tested system demonstrates that this is achievable: evidence submission, verification, eligibility recommendation, committee review, and final administrative decision are now digitally tracked and auditable end-to-end, while every actual promotion decision remains with GCTU's human reviewers and authorities, consistent with the delimitation stated in Chapter One (§1.8) — the system supports the process, it does not replace it.

The project also demonstrates, concretely, why testing a running system matters more than reviewing its code in isolation: the eligibility engine's defect (§4.7.2) was invisible from a static reading of the scoring rules and would not have been caught without deliberately exercising the full application through a real browser session across all five roles.

## 5.5 Limitations of the Implemented System

Consistent with the delimitations declared in Chapter One (§1.8–§1.9), the implemented prototype has the following known limitations:

1. **Eligibility scoring is completeness-based, not quality-based.** The engine scores an application by which required evidence categories (Teaching, Research, Service) have been verified as present, using the fixed weights and performance bands defined in the approved proposal. It does not implement GCTU's full qualitative assessment cascade — where the Head of Department, Faculty Appointments and Promotions Committee, and University Appointments and Promotions Committee each independently rate an applicant's teaching, research, and service as Excellent/Very Good/Good/Satisfactory/Unsatisfactory (per the GCTU Heads of Academic Departments Handbook, 2025) — because the approved scope defines the system as a rule-based decision-support tool operating on verified evidence, not a replacement for that human judgement (§1.8).
2. **No dedicated committee-scoring interface.** Committee reviewers record a recommendation (Recommended / Not Recommended / Requires Further Review) and a comment; they do not enter a separate numeric or qualitative score per evidence category.
3. **Administrative dashboards are not yet optimised for mobile information density.** Pages combining a request queue with a full record detail (HR Requests, Committee Review) render correctly and without layout breakage on mobile, but as one long single-column scroll rather than a mobile-specific list-then-detail navigation pattern.
4. **Real institutional data was not used.** As stated in Chapter One (§1.9), promotion records contain sensitive personal and professional information; the system was seeded and tested with representative sample data rather than actual GCTU staff records.
5. **No automated regression test suite.** Verification to date has been static analysis (TypeScript, production build), a database health check, and manual/scripted end-to-end browser testing rather than a maintained automated test suite that would catch regressions on future changes.

## 5.6 Recommendations

1. **To GCTU management and the HR Directorate**: the prototype demonstrates sufficient functional completeness to justify a supervised pilot with a small number of real (consenting) applications before any wider rollout, so that the eligibility engine's completeness-based scoring can be validated against actual committee outcomes.
2. **To the project team**, before final submission: resolve the citation-verification gap noted during research — the eligibility performance-band table in Chapter Three (§3.17) is cited to the GCTU Basic Laws (Schedule J), which the team was not able to independently confirm page-by-page during this study; either verify the citation directly against Schedule J or note the limitation explicitly.
3. **To future maintainers**: adopt the ESLint configuration Next.js offers out of the box (currently absent from the project) before any further UI work, to catch accessibility and correctness issues automatically rather than only through manual review.

## 5.7 Suggestions for Future Work

1. **Qualitative committee scoring module.** Extend the eligibility engine with a structured interface allowing the Head of Department, Faculty Appointments and Promotions Committee, and University Appointments and Promotions Committee to each record a qualitative rating (Excellent/Very Good/Good/Satisfactory/Unsatisfactory) per assessable area, combined according to GCTU's actual per-rank rules (e.g., Senior Lecturer requires "Excellent" in Teaching and Research plus at least "Satisfactory" in Service, or "Good" in all three), rather than the current document-completeness proxy.
2. **Mobile-optimised administrative views.** Redesign the HR Requests, Committee Review, and Analytics pages for mobile with a list-then-detail navigation pattern (or collapsible sections) instead of a single stacked column, reducing scroll length on smaller screens.
3. **Automated regression testing.** Introduce an automated end-to-end test suite (e.g., Playwright) covering the workflow paths that were manually verified during this study, so future changes are checked automatically rather than requiring another manual pass.
4. **Integration with GCTU's official systems.** As noted in Chapter One (§1.9), full institutional deployment would require integration with GCTU's official staff database and single sign-on, which was out of scope for this prototype.
5. **Database cleanup.** The `Score` entity defined in the Prisma schema (Chapter Four, §4.3) is no longer used by the eligibility engine following the correction in §4.7.2; a future migration should either remove it or repurpose it to store the per-category qualitative ratings suggested in item 1 above.

## 5.8 Chapter Summary

This chapter summarised the study, showed that all six objectives set out in Chapter One were achieved, drew conclusions about the value of testing a running system rather than reviewing code alone, stated the limitations that follow directly from the approved project scope, and made recommendations and suggestions for future work — most notably, extending the current completeness-based eligibility engine toward GCTU's full qualitative assessment process, and improving the administrative interface for mobile use.
