# CHAPTER FIVE: SUMMARY, CONCLUSION, AND RECOMMENDATIONS

## 5.1 Introduction

This chapter summarises the study, evaluates the implemented Digital Staff Promotion Support System against the objectives and research questions in Chapter One, and presents the conclusions, limitations, recommendations, and appropriate future work. The discussion distinguishes between completed FYP functionality and controls that require GCTU-owned policy documents or production infrastructure.

## 5.2 Summary of the Study

The study addressed the limitations of a largely manual staff-promotion process at Ghana Communication Technology University (GCTU), including limited application-status visibility, repeated handling of paper records, delays in routing, inconsistent mechanical checks, and difficulty reconstructing the complete decision history. The literature review showed that workflow control, evidence integrity, role separation, transparency, and auditability are central to effective digital human-resource systems. It also established that a generic HR platform would not, by itself, represent GCTU's Schedule J and Schedule K rules, committee structure, external-assessment process, and records obligations.

The project therefore developed a web-based Digital Staff Promotion Support System using Next.js, TypeScript, PostgreSQL, Prisma ORM, and role-based authorization. Research was extended beyond the initial limited prototype to examine the available GCTU Basic Laws, Conditions of Service, Administrative Procedures Manual, official promotion forms, HOD guidance, Appeals Board rules, and records policy. The resulting policy foundation separates verified rules, provisional interpretations, conflicts, and unavailable controlled schemes.

The implemented system uses a roster-first account model. Public self-registration is disabled. HRODD creates or imports a verified staff record and provides applicant access through a single-use activation invitation sent to the official staff email. After login, a staff member starts an application only through a route currently available to the person's verified category and rank. No role or applicant category is selected on the login page.

For Schedule J and the verified Schedule K families, the system supports route-bound applications, versioned official forms, evidence records, immutable submission snapshots, best-output packets, Department or Head review, FAPC or RAPC review, external assessment where required, UAPC and Council stages according to route authority, final notification, appeal records, communication history, and controlled archival treatment. External assessors use expiring token links and cannot enter the internal staff portals. Committee records include named membership, attendance, target-rank eligibility, conflicts, recusals, quorum, resolutions, and recommendations.

Testing combined automated policy and migration tests, TypeScript validation, production compilation, database health checks, role-login checks, registration-denial checks, and responsive browser tests at desktop and mobile sizes. Benjamin Baidoo is the principal applicant identity used in the defence data, with Sucess Likem and Esther Appiah providing additional representative application instances.

## 5.3 Achievement of Objectives

| Objective | Status | Implementation evidence |
|---|---|---|
| Examine weaknesses in the manual promotion process | Achieved | Chapters One to Three and the expanded GCTU requirements baseline identify routing, visibility, evidence, consistency, confidentiality, and audit problems. |
| Design a standard digital workflow | Achieved | Route-specific stages, responsible roles, due dates, correction paths, external assessment, authority decisions, notification, appeal, and records controls are modeled. |
| Develop a secure central database | Achieved | PostgreSQL stores staff identities, route versions, applications, forms, evidence, assessments, meetings, communications, appeals, records controls, and audit events. |
| Enforce role-based access | Achieved | Applicant, HOD/Dean, HRODD, committee, system-administration, and external-assessor boundaries are enforced on the server. Department and faculty scope restricts reviewer access. |
| Implement rule-based eligibility and decision support | Achieved for verified routes | Schedule J and verified Schedule K rules are versioned and explainable. Unknown Senior Staff and Junior Staff schemes are blocked rather than guessed. Human authorities retain qualitative judgement. |
| Improve transparency and accountability | Achieved | Applicants receive meaningful workflow status, cases have targets and stage due dates, important communications are logged, and administrative actions are auditable. |

The objectives were achieved within the evidence-based boundary of the project. This wording is important. Completeness does not mean inventing rules where GCTU has not supplied a controlling scheme. It means implementing the rules that can be supported, identifying conflicts explicitly, and preventing unsupported decisions.

## 5.4 Answers to the Research Questions

### RQ1: What bottlenecks and security risks exist in the traditional promotion process?

The main weaknesses are slow physical routing, repeated document handling, weak status visibility, inconsistent completeness checks, difficulty controlling confidential assessor and committee material, and an incomplete audit history. These weaknesses increase administrative delay and make it difficult for an applicant or authorized reviewer to identify the current owner and next required action.

### RQ2: What HR and software-engineering factors influence successful implementation?

The study identified policy accuracy, role separation, staff identity assurance, versioned criteria, evidence integrity, confidentiality, usable workflow status, exception handling, auditability, records retention, and institutional ownership as the most important factors. Technically correct software can still be institutionally unsafe if it allows public account creation, combines incompatible decision roles, or silently chooses between conflicting policy statements.

### RQ3: How can automation improve reliability and objectivity?

Automation improves the mechanical parts of promotion administration: route availability, minimum-time checks, retirement cut-off checks, required-form completion, best-output counts, assessor counts, stage dependencies, quorum calculations, deadlines, and records controls. These checks are applied consistently and provide reasons. The system does not claim to automate the scholarly or professional judgement of HODs, FAPC, RAPC, UAPC, Council, or external assessors.

### RQ4: What functions should a modern GCTU promotion system include?

A complete support system requires verified staff activation; route-bound applications; versioned official forms; structured evidence and output claims; controlled corrections; Department, Faculty, Registry, HRODD, committee, external-assessor, authority, and appeal actions; delivery evidence; effective-date and decision records; access classification; retention and legal-hold controls; audit logs; and role-appropriate reporting. The implementation provides these capabilities for the currently verified Schedule J and Schedule K routes.

### RQ5: How can tracking improve transparency and accountability?

Each promotion file records its current stage, stage history, owner, start date, due date, decision reason, assessments, formal forms, meeting evidence, communications, and administrative controls. The applicant sees progress without seeing confidential assessor identities or restricted committee material. Authorized internal users can reconstruct who performed each action and the evidence available at that time.

## 5.5 Conclusion

The study demonstrates that GCTU's promotion administration can be represented as a secure, understandable, and auditable digital process without replacing the statutory authority of university officers and committees. The principal value of the system is not a single score. Its value is the disciplined connection between verified staff identity, an applicable policy route, a complete dossier, authorized human assessment, recorded governance, communication, and records accountability.

The expanded implementation also shows why policy research and system design must proceed together. The earlier limited workflow could move an application between generic roles, but it did not represent the complete institutional process. The revised system now treats Schedule J and Schedule K separately, includes external assessment and formal committee governance, preserves official-form versions, and prevents unsupported staff streams from producing a false eligibility decision.

The final conclusion is therefore that the project has achieved a defensible FYP implementation of a full promotion-support platform for the verified public GCTU evidence set. Production institutional adoption remains subject to policy validation, controlled scheme supply, identity integration, security approval, and formal user acceptance.

## 5.6 Limitations of the Implemented System

1. **Unavailable controlled schemes.** Senior Staff and Junior Staff submission remains disabled until GCTU provides the current approved Unified or Harmonized Schemes. Missing or incomplete professional route families are not inferred.
2. **Provisional policy interpretations.** Conflicting public wording about selected forwarding and final-authority rules is stored in the conflict register. The implementation uses visible working interpretations, not claims of institutional resolution.
3. **Effective-date calculation boundary.** HRODD can record only 1 February or 1 August after authority approval, with an audited reason. Automatic choice of the date awaits confirmation of the controlling qualifying event and adjustment rule.
4. **No production identity integration.** The FYP uses its own verified staff roster and access assignments. A live deployment requires GCTU-approved staff-database or single-sign-on integration.
5. **Operator-triggered scheduled communications.** Case and stage deadlines and quarterly-update due dates are calculated, but unattended reminders and escalation require a production background scheduler. HRODD can send and track the notice from the case workspace.
6. **Representative data.** The defence database contains representative named accounts and synthetic application content, not real promotion decisions or confidential staff files.
7. **Institutional acceptance outstanding.** Automated tests and scripted browser verification do not replace UAT and approval by HRODD, Registry or Legal, academic leadership, committee secretariats, Records, Data Protection, and ICT.
8. **Evidential rather than trust-service signatures.** Controlled forms preserve typed signatory details, declarations, timestamps, frozen versions, and audit evidence. An institutional certificate or qualified electronic-signature service is not integrated.

## 5.7 Recommendations

1. GCTU should conduct a structured policy-validation session involving HRODD, Registry or Legal, academic leadership, RAPC or professional units, Records, Data Protection, and ICT before a live pilot.
2. Each policy conflict should be resolved through a recorded authority, source, decision, approver, effective date, and affected policy version. Historic submitted cases should not be silently recalculated.
3. HRODD should supply the current Senior Staff and Junior Staff schemes and complete rank, grade, service, appraisal, establishment, and professional-registration rules before those streams are activated.
4. GCTU should use personal officeholder accounts with effective-dated assignments. Shared HOD, Dean, committee, or HRODD credentials should not be used.
5. A pilot should begin with a small number of consenting applications and include usability, accessibility, privacy, security, backup, recovery, and workflow-timing evaluation.
6. Production operation should assign owners for policy administration, committee secretariat work, email delivery, records retention, incident response, and audit-log review.

## 5.8 Suggestions for Future Work

1. Activate Senior Staff, Junior Staff, and incomplete professional families from newly supplied controlled policy versions.
2. Integrate the staff roster, office appointments, and authentication boundary with GCTU's approved enterprise services.
3. Add a production scheduler and queue for reminders, assessor follow-up, quarterly notices, overdue escalation, and delivery retries.
4. Generate controlled decision letters, record acknowledgement of receipt, and integrate an approved electronic-signature service.
5. Add production monitoring, protected object storage, backup verification, security-event response, and privacy reporting.
6. Conduct full UAT, accessibility review, penetration testing, and performance testing with representative institutional users.
7. Refine high-density HRODD and committee mobile workflows using evidence from the pilot.
8. Extend analytics with privacy thresholds for route duration, overdue stages, assessor turnaround, committee workload, appeals, and quarterly-update compliance.

## 5.9 Chapter Summary

This chapter summarised the completed system and assessed it against the objectives and research questions. The system converts the verified parts of GCTU's Schedule J and Schedule K promotion process into an evidence-based, governed, and auditable digital workflow while preserving human decision authority. The remaining work is clearly bounded: controlled schemes, institutional policy decisions, enterprise integration, scheduled production operations, trusted signatures, and formal acceptance. This distinction makes the project both professionally useful and academically defensible.
