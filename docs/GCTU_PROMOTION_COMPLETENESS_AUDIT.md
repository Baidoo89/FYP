# GCTU Promotion Completeness Audit

Date: 2026-08-10

## Conclusion

The current application is testable as a Schedule J applicant-and-initial-review prototype, but it is not yet a complete GCTU promotion system. The current workflow must be extended before it is described as covering the complete institutional process.

This audit compares the current code and database with the supplied GCTU forms, the project research notes, the published GCTU Form 2A, the GCTU staff appointment and promotion forms page, the GCTU Basic Laws/Schedule J material, and the Heads of Academic Departments Handbook.

## Confirmed Process

1. Authoritative staff record and access issued by HRODD.
2. Applicant prepares the applicable promotion form and dossier.
3. Applicant submits through the Head of Department/Unit.
4. Head acknowledges receipt, checks/certifies the dossier, and assesses the relevant area.
5. Dean/Faculty or Directorate committee receives the file.
6. HRODD acknowledges and routes the file to the Registrar.
7. Required internal or external assessments are commissioned and received.
8. The appropriate committee records its assessment and recommendation.
9. UAPC, Council, Academic Board, or another authorised body acts according to the applicable route.
10. HRODD records and communicates the outcome.
11. The applicant may use the applicable internal petition or Appeals Board process.

## Gap Matrix

| Area | Current state | Required completion |
|---|---|---|
| Staff identity and access | HR-controlled provisioning exists. | Add authoritative staff-record synchronization and change history. |
| Academic Form 2A | Structured dossier and scholarly-output catalogue exist. | Add qualifications, institutions, rank history, subjects taught, supervision, research/projects, grants, conferences, service, CV, application letter, self-assessment, and form versioning. |
| Administrative/professional promotion | Schedule K route foundation exists, with provisional authority rules. | Build the category-specific forms and assessment templates for Registry, Finance, Audit, Procurement, Library, Works and Physical Development, and other verified units. |
| Senior and Junior Staff | Framework and route placeholders exist. | Obtain and configure the controlling Harmonized Scheme/current forms. Do not invent scoring rules. |
| Applicant submission | Draft, evidence upload, dossier validation, freeze, snapshot, and receipt exist. | Add acknowledgement records, submission cover letter, Registrar routing record, and resubmission/version history. |
| HOD/Head assessment | General review exists. | Add formal confidential assessment form, teaching/work assessment, reasons, signature/approval record, and return/certification actions. |
| Dean/Faculty stage | Access scope exists. | Add separate Dean assessment and FAPC chair/secretary workspaces, agenda, quorum, minutes, recommendation, and conflict/recusal handling. |
| Registry/Directorate stage | Not a complete workflow. | Add RAPC-specific routing, assessment, service/human-relations sections, minutes, and recommendation. |
| External assessors | Policy data records assessor counts. | Add nomination of at least three candidates, conflict checks, appointment, invitation, acceptance, secure confidential report, reminders, replacement, Registrar receipt, and assessor payment/administrative record where required. |
| External-assessment rules | Not yet executable end to end. | Enforce route-specific counts: one external assessment for Lecturer to Senior Lecturer; at least two for Associate Professor/Professor, including at least one outside Ghana for the higher routes, subject to the approved policy version. |
| Library verification | Output fields exist. | Build the Library verification queue, evidence checks, correction/replacement versions, decisions, and audit trail. |
| Publication verification | Structured outputs and best-N packet exist. | Link each output to evidence documents in the applicant workflow; record DOI/indexing/publisher checks, predatory-publication concerns, previous-use checks, authorship/contribution evidence, and verifier reasons. |
| Teaching assessment | Legacy score calculation remains in the codebase. | Replace the old generic score meaning with the official criterion-level assessment and classification for teaching, promotion of knowledge, and service. |
| Administrative assessment | Generic workflow only. | Implement the form sections: ability/knowledge in work, promotion/application of knowledge by external assessment, human relations, service, overall assessment, decision, reasons, and signatures. |
| Committee governance | Generic committee reviewer exists. | Add FAPC, RAPC, UAPC, and relevant committee membership, roles, terms, quorum, agenda, minutes, resolutions, dissent, recusal, and delegated authority. |
| Registrar and HRODD | HR verification workspace exists. | Add formal Registrar receipt/routing, deadline monitoring, return reasons, records certification, and official communication history. |
| Final authority | Configurable authority is seeded, with documented policy conflicts. | Keep final authority route-configurable and resolve the UAPC/Academic Board/Council conflicts with an approved GCTU source before operational use. |
| Appeals and petitions | Appeal policy conflicts are recorded but no complete case workflow exists. | Add notice of decision, filing window, petition/appeal case, grounds, documents, respondent, Appeals Board assignment, hearing/minutes, decision, notifications, and outcome linkage. |
| Notifications | Milestone notifications exist. | Add acknowledgement, assessor, committee, decision, return, deadline, appeal-window, and receipt notifications with delivery history. |
| Records and retention | Audit logs and documents exist. | Add retention schedule, legal hold, exportable official file, version history, access log, archival/closure, and controlled deletion. |
| Reporting | Operational analytics and audit reporting exist. | Add committee workload, turnaround time, assessor status, bottleneck, route outcome, appeals, and institutional statutory reports. |
| Security | Role and scope checks exist. | Add strict separation of applicant, assessor, committee, Registrar, HRODD, and final-authority permissions; prevent self-review and enforce recusal. |
| Paper-form equivalence | Digital submission exists. | Preserve the official form structure and produce a printable/exportable dossier with signatures, acknowledgements, minutes, and assessment reports. |

## Important Corrections

- The generic committee reviewer must not be treated as the complete FAPC, RAPC, UAPC, or external-assessor process.
- A complete dossier is not the same as an official promotion score or an automatic eligibility decision.
- HOD, Dean, committee membership, office assignment, and substantive rank must remain separate.
- External assessor reports must remain confidential and must not be visible to the applicant unless the approved policy permits disclosure.
- The system must preserve every submitted version and every decision; replacing a document must not erase the prior official record.
- The final authority must be configurable because the collected GCTU sources contain authority conflicts that require Registrar/Legal/UAPC confirmation.

## Current Implementation Position

Implemented or substantially implemented:

- Role-based portals and server-side authorization.
- HRODD-first staff provisioning with no public applicant registration.
- Policy registry, route catalogue, organization structure, rank history, and route eligibility foundation.
- Schedule J structured scholarly outputs, equivalence units, best-N packet, declaration, and readiness validation.
- Evidence storage, audit history, workflow status changes, notifications, database migrations, immutable submission snapshot, and receipt number.
- Basic HOD/HR/committee workflow surfaces.

Not complete:

- Full Form 2A dossier.
- Formal HOD, Dean/FAPC, RAPC, UAPC, Registrar, external assessor, Library, Appeals Board, and Council workflows.
- Category-specific administrative/professional forms.
- Full assessment templates and official criterion-level scoring/classification.
- Appeal, retention, committee-governance, official-form export, and complete records controls.

## Recommended Build Order

1. Freeze the authoritative policy/source matrix and obtain confirmation for unresolved authority and appeal-window conflicts.
2. Implement the complete academic Form 2A dossier and criterion-level assessment templates.
3. Implement HOD/Dean/FAPC and RAPC workspaces with committee records and recusal.
4. Implement external assessor lifecycle and confidential reports.
5. Implement Registrar/HRODD routing, UAPC/final-authority decision, Council/Academic Board steps, and communications.
6. Implement Library verification and evidence-to-output linking.
7. Implement administrative/professional and Senior/Junior Staff tracks from their controlling forms.
8. Implement appeals, records retention, official exports, reports, and full end-to-end acceptance testing.

## Sources

- GCTU Basic Laws and Schedule J: https://site.gctu.edu.gh/gctu-basic-laws
- GCTU Heads of Academic Departments Handbook: https://site.gctu.edu.gh/heads-of-academic-departments-handbook
- GCTU Form 2A: https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/staff-appointments-and-promotion/GCTU-FORM-2A.pdf
- GCTU Staff Appointment and Promotion Forms: https://site.gctu.edu.gh/staff-appointment-and-promotion-forms
- GCTU Directorate of Human Resource and Organisational Development: https://site.gctu.edu.gh/human-resource-and-organisational-development
