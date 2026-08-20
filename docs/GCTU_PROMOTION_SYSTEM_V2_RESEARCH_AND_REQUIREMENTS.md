# GCTU Staff Promotion System V2

## Research, Policy Baseline, Gap Analysis, and Implementation Requirements

Prepared for: Benjamin Baidoo and project team

Research baseline date: 9 August 2026

Status: Requirements baseline for stakeholder review; not yet an implementation claim

## 1. Executive conclusion

The supervisor's concern is correct. The current software is a useful academic-promotion prototype, but it does not yet represent the full promotion process defined by Ghana Communication Technology University (GCTU).

A proper GCTU promotion system cannot be implemented as one generic sequence of Lecturer -> HOD/Dean -> HR -> Committee -> Authority. The official framework has separate promotion families, different committees, different evidence, different scoring logic, rank-dependent external assessment, statutory deadlines, appeals, recusals, quorum rules, and different final authorities.

The correct target is a **Digital Staff Promotion Management and Decision-Support System for GCTU**. It should manage a promotion case from preparation through submission, assessment, committee consideration, decision, communication, and appeal. It should calculate only policy-defined eligibility and scores. It must preserve human institutional judgment and must not present an automated calculation as a promotion decision.

The V2 target must support at least:

1. Academic Senior Members under Schedule J.
2. Administrative and Professional Senior Members under Schedule K.
3. Senior Staff under the Harmonized Scheme of Service, after the University supplies that scheme.
4. Junior Staff under the Harmonized Scheme of Service, after the University supplies that scheme.

Schedules J and K can be specified from the evidence currently available. Senior Staff and Junior Staff cannot yet be implemented accurately because the GCTU Basic Laws refer their criteria to a separate Harmonized Scheme of Service that has not been supplied or found in the University's public sources.

## 2. Research method and authority of sources

### 2.1 Source hierarchy

Requirements in this document use the following order of authority:

1. [GCTU Basic Laws, including Schedules J and K](https://site.gctu.edu.gh/gctu-basic-laws).
2. [GCTU official Staff Appointment and Promotion Forms page](https://site.gctu.edu.gh/staff-appointment-and-promotion-forms).
3. Official and supervisor-supplied GCTU application and assessment forms.
4. [GCTU Administrative Procedures Manual](https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/Administrative-Procedures-Manual.pdf), where applicable.
5. Mature-system and security references used only to improve system design, not to override GCTU policy.

### 2.2 Supplied primary forms reviewed

The following supervisor-supplied forms were extracted and compared with the Basic Laws:

- GCTU Form 2A - Promotion, Academic Staff.
- Promotion forms for Registry.
- Promotion forms for Finance, Internal Audit, and Procurement.
- Promotion forms for Library.
- Promotion forms for Works and Physical Development.

The supplied forms are valuable because they expose operational fields, checklists, professional criteria, acknowledgements, and assessor sections that are not obvious from a high-level workflow description.

### 2.3 Design references

[Interfolio Review, Promotion & Tenure](https://www.interfolio.com/blog/inf_product_types/faculty-information-system/) demonstrates mature features such as dossiers, workflow templates, external evaluations, recusal, rebuttal, committee review, voting, and a common source of truth. These are useful design comparisons, but the GCTU Basic Laws remain the policy authority.

For identity, an official HR record or institutional directory should be the source of authority. [Microsoft's HR-driven provisioning guidance](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/what-is-hr-driven-provisioning) describes HR as the authoritative starting point for staff identities. [NIST SP 800-63A](https://pages.nist.gov/800-63-4/sp800-63a.html) distinguishes identity resolution, evidence validation, and identity verification. These principles support matching a claimant to a real GCTU staff record instead of trusting self-declared rank and department.

## 3. Scope boundary

### 3.1 In scope for V2

- Promotion case preparation and submission.
- Structured CV and evidence portfolio.
- Schedule J academic promotion routes.
- Schedule K administrative and professional promotion routes.
- Profession-specific Schedule K assessment templates.
- HOD, Dean, Unit Head, Directorate Head, HRODD, Registrar, FAPC, RAPC, UAPC, Council, Academic Board, and Appeals Board tasks where policy requires them.
- External assessor nomination, appointment, invitation, confidential response, reminder, and report handling.
- Eligibility, scoring, classification, completeness, verification, recommendation, and decision as separate concepts.
- Committee membership, rank checks, quorum, recusal, agenda, minutes, votes or consensus record, and recommendation.
- Deadlines, acknowledgements, reminders, escalations, and quarterly status updates.
- Decision communication, effective dates, and appeals.
- Audit trail, policy versioning, records control, reporting, and controlled exports.

### 3.2 Not safe to claim yet

- Full Senior Staff promotion rules without the Harmonized Scheme of Service.
- Full Junior Staff promotion rules without the Harmonized Scheme of Service.
- An automatic promotion decision.
- A final authority that is assumed rather than configured from a resolved policy interpretation.
- Automatic validation of publication quality without human or authoritative-source verification.

### 3.3 Appointment is distinct from promotion

The Basic Laws discuss appointments, promotions, reappointments, and senior offices. The FYP can remain focused on promotion, but the data model must not confuse these events. An appointment to an office such as HOD, Dean, Registrar, or Director is not the same thing as a permanent staff rank.

## 4. Staff and identity model

### 4.1 Staff categories

The system must store a staff category independently of login access:

- Academic Senior Member.
- Administrative Senior Member.
- Professional Senior Member.
- Senior Staff.
- Junior Staff.

### 4.2 Rank, position, office, and system access are different

The current system combines job identity and portal access in a small `Role` enum. V2 must separate:

- **Rank:** Lecturer, Senior Lecturer, Assistant Registrar, Senior Accountant, and similar substantive grades.
- **Position/office:** HOD, Dean, Director, Registrar, committee chair, committee secretary, and similar time-bound responsibilities.
- **Organizational assignment:** Department, Faculty/School, Directorate, Unit, Section, Centre, Campus.
- **System permission:** Applicant, dossier verifier, assessor manager, committee member, committee secretary, decision recorder, auditor, technical administrator.

A person may have one substantive rank, one or more organizational appointments over time, and several case-specific permissions. A technical system administrator must not acquire institutional decision power merely through a technical role.

### 4.3 Account creation and verification

Email verification proves control of an email address; it does not prove the person's staff ID, rank, department, appointment date, or eligibility.

Required account model:

1. Import or create an authoritative staff record from HRODD.
2. Store staff ID, official email, staff category, rank history, organizational assignment, employment status, and relevant dates.
3. Invite the staff member or match an institutional sign-in to that record.
4. Require official-email verification or institutional SSO.
5. Allow the staff member to correct contact details, but route changes to rank or organizational identity through HRODD approval.
6. Disable or update access when the authoritative employment record changes.

For the FYP demonstration, an HRODD-managed staff roster plus invitation is acceptable. Open self-registration using any `@live.gctu.edu.gh` address is not sufficient as the final institutional design.

## 5. Policy concepts that must remain separate

The new system must not collapse the following concepts into one status or score:

- Dossier completeness.
- Authenticity and document verification.
- Basic route eligibility.
- Assessment of an area.
- Performance classification.
- External assessor opinion.
- Committee recommendation.
- Institutional decision.
- Council approval or ratification.
- Communication of result.
- Effective date of promotion.
- Appeal outcome.

A file can be complete but the applicant may be ineligible. An applicant can be eligible but not recommended. A committee recommendation can exist before the authorized decision. An external assessor advises; the assessor does not make GCTU's final decision.

## 6. Schedule J: Academic Senior Members

### 6.1 Assessable areas and performance bands

Academic promotion has three assessable areas:

- Teaching.
- Promotion of Knowledge.
- Service.

Each area is independently classified:

| Category | Points |
|---|---:|
| Excellent | 70-100 |
| Very Good | 65-69 |
| Good | 55-64 |
| Satisfactory | 50-54 |
| Unsatisfactory | Below 50 |

An overall document-completeness percentage cannot replace these independent classifications.

### 6.2 Academic promotion routes

| Current rank | Target rank | Minimum time | Outputs submitted | Refereed minimum | Outputs assessed | Minimum in each area | External assessment |
|---|---|---:|---:|---:|---:|---|---|
| Assistant Lecturer/Assistant Research Fellow | Lecturer/Research Fellow | PhD upgrade route | Not a publication route | Not applicable | Not applicable | Route-specific upgrade | No standard publication assessment |
| Lecturer | Senior Lecturer | 4 years | 6-10 | 6 | Best 6 | Good | 1 assessor, normally in Ghana but external to GCTU |
| Research Fellow | Senior Research Fellow | 4 years | 8-12 | 8 | Best 8 | Good | 1 assessor, normally in Ghana but external to GCTU |
| Senior Lecturer | Associate Professor, Case I | 4 years | 10-15 | 10 | Best 10 | Very Good | At least 2; at least 1 outside Ghana |
| Senior Research Fellow | Associate Professor, Case II | 4 years | 12-16 | 12 | Best 12 | Very Good | At least 2; at least 1 outside Ghana |
| Associate Professor | Professor, Case I | 3 years | 15-20 | 15 | Best 15 | Excellent | At least 2; at least 1 outside Ghana |
| Associate Professor, research track | Professor, Case II | 3 years | 20-30 | 20 | Best 20 | Excellent | At least 2; at least 1 outside Ghana |

The current seed's five-year rules for Senior Lecturer -> Associate Professor and Associate Professor -> Professor are incorrect. The official minimums are four and three years respectively.

### 6.3 Teaching assessment

Teaching evidence must support assessment of:

- Teaching load.
- Regularity and punctuality.
- Lecture materials.
- Practical and other learning experiences.
- Completion of syllabus.
- Examination questions and marking schemes.
- Timeliness of examination work and results.
- External examiner or moderator comments.
- Project and postgraduate thesis supervision.
- Student evaluation of teaching and supervision.

The policy allocates 80 points to teaching assessment and 20 points to student evaluation. The system therefore needs structured teaching activities and student-evaluation summaries, not one uploaded `TEACHING` PDF.

### 6.4 Promotion of Knowledge

Countable output types include:

- Refereed journal papers.
- Peer-reviewed books for higher education in the relevant specialization.
- Chapters in published books.
- Refereed conference proceedings.
- Peer-reviewed exhibition documents.
- Patented inventions.
- Deployed technologies, products, and designs.

Policy equivalencies include:

| Output | Publication-count equivalence |
|---|---:|
| Refereed journal paper | 1 |
| Peer-reviewed higher-education book | 3 |
| Peer-reviewed exhibition document | 1 |
| Indexed conference paper | 1 |
| Other conference paper | 0.5 |
| Deployed technology/product/design | 2 |
| Patented invention | 3 |
| Peer-reviewed book chapter | 1 |
| Non-peer-reviewed book chapter | 0.5 |

Assessment points include up to 20 for each patented invention, technology, or product and up to 10 for the listed scholarly publication types. Quantity only establishes part of eligibility. External assessors must judge quality, originality, currency, contribution, scholarship, presentation, and whether the work is appropriate for the target rank.

Required publication fields include title, output type, authors in order, applicant contribution, journal/publisher/event, ISSN/ISBN/DOI/URL, publication date, peer-review status, indexing source, post-last-promotion flag, evidence, verification record, count equivalence, assessment points, and whether selected within the best-N set.

The system must prevent the same output from being counted twice within a case and must preserve the exact best-N set sent for external assessment.

### 6.5 Service

Service is not a free-text paragraph. The Basic Laws provide rank-sensitive point schedules for University service and national/international service. Activities include academic administration, committees, editorial work, reviewing, external examination, external assessment, consultancy, community impact, professional roles, awards, and resource mobilization.

The system must store service activity type, level, role, organization, start/end dates, acting duration, recurrence, evidence, applicable rank, and policy-derived points. It must implement the special recurrence and acting-duration rules from Schedule J.

For promotion below Associate Professor, the service score is based on accumulated University and national/international points. Associate Professor uses a 60% University and 40% national/international distribution. Professor uses a 50% University and 50% national/international distribution; this second percentage should be formally confirmed because the scanned line break obscures part of the sentence in the public PDF extraction.

### 6.6 Applicant dossier from Form 2A

The academic dossier must collect structured data for:

- Target rank and current designation.
- Department and Faculty/School.
- Full name and date of birth.
- Date of last promotion.
- Degrees, institutions, and dates.
- Ranks held and subjects taught.
- Project, thesis, and research supervision.
- Professional experience.
- Research and major projects.
- Publications, books, proceedings, exhibitions, inventions, and technologies.
- Applicant's contribution to co-authored outputs.
- Conferences, seminars, and workshops.
- Exact bibliographic references.
- Best publications selected for external assessment.
- Community and institutional service.
- Applicant self-assessment, classification, reasons, and evidence in all three areas.
- Applicant declaration, signature, and submission date.

The digital dossier must also reproduce the operational checklist: application form, submission letter, assessment form, CV, certificates, teaching evidence, Promotion of Knowledge evidence, service evidence, acknowledgements, and official submission record.

### 6.7 Schedule J workflow

1. Applicant completes the form and dossier.
2. Applicant submits to the HOD and copies the submission letter to the Registrar.
3. HOD acknowledges receipt, certifies outputs, assesses teaching, and routes the dossier to the Dean.
4. HOD supplies at least three proposed external assessors in the applicant's specialty.
5. Dean refers the case to FAPC within the applicable period.
6. FAPC assesses teaching and service, records reasons, recommendation, attendance, recusals, quorum, and minutes.
7. FAPC forwards the full case, HOD assessment, FAPC evaluation, minutes, and assessor list to UAPC.
8. Authorized office appoints external assessor(s); reports are received confidentially through the Registrar/UAPC process.
9. UAPC makes the final institutional assessment using the dossier, HOD/Dean assessment, FAPC record, and external report(s).
10. Non-professorial results follow the authorized UAPC/Academic Board rule after policy clarification.
11. Professorial outcomes are forwarded for Council ratification before publication.
12. Result is communicated and effective date recorded.
13. Applicant may use the defined appeal route.

### 6.8 Schedule J committees and controls

FAPC membership includes the Dean as chair, all Faculty HODs, one Senior Lecturer or above from each Department, one industry member, and the Faculty Officer as secretary.

Required controls include:

- FAPC meeting at least once every two months for promotion applications.
- HOD forwarding with comments within one month.
- Dean referral to FAPC within two weeks.
- FAPC forwarding to UAPC within two months of receipt.
- Applicant/member recusal.
- Exclusion of members below the target rank.
- At least three eligible members present, including the Dean.
- Direct UAPC route where the required FAPC composition cannot be formed.
- Cognate Dean handling where the Dean is the applicant.
- Rank-based substitution where HOD or Dean is below the target rank.

UAPC has rank-dependent membership and a one-half quorum. An external Professor joins the relevant Professor interview. Committee membership must be modeled per meeting and case, not represented by one generic `COMMITTEE_REVIEWER` account.

### 6.9 Schedule J deadlines and effective dates

- Assistant Lecturer/Assistant Research Fellow -> Lecturer/Research Fellow: 6 months.
- Lecturer/Research Fellow -> Senior Lecturer/Senior Research Fellow: 10 months.
- Senior Lecturer/Senior Research Fellow -> Associate Professor: 15 months.
- Associate Professor -> Professor: 18 months.
- Applicant status update: every three months.
- Effective promotion dates: 1 February or 1 August according to the submission window.
- Submission up to two months before the due date may satisfy the full-duration rule.
- A deadline-expired case can require a special internal panel under the policy.

The system needs due dates for every task and the whole case. It should report overdue cases without silently changing the legal outcome.

### 6.10 Exceptional academic promotion

Schedule J permits accelerated promotion for groundbreaking and extraordinary scholarly achievement or major grant-supported impact. It is a nominated exceptional route, not a checkbox that bypasses policy. V2 must model nomination, reasons, evidence, exceptional-route approval, and the subsequent assessment process separately.

## 7. Schedule K: Administrative and Professional Senior Members

### 7.1 Four assessable areas

Schedule K uses four independent areas:

- Ability in Work/Knowledge in Work.
- Promotion of Work/Application of Knowledge.
- Human Relations.
- Service.

The same five performance bands apply: Excellent 70-100, Very Good 65-69, Good 55-64, Satisfactory 50-54, and Unsatisfactory below 50.

The Basic Laws contain an apparent drafting error that says "five areas" after describing four composite areas. The detailed guidelines and supplied forms consistently define four. V2 should implement four and record the discrepancy in policy provenance.

### 7.2 Rank-level combination rules

An arithmetic average is useful for reporting but is not the legal eligibility rule. The decision engine must evaluate the four classifications as combinations:

| Promotion tier | Required classification pattern |
|---|---|
| Junior Assistant Registrar/equivalent -> Assistant Registrar/equivalent | At least Satisfactory in three areas and Good in either core area |
| Assistant Registrar/equivalent -> Senior Assistant Registrar/equivalent | Good in two areas and Very Good in two areas, with Very Good in either core area |
| Senior Assistant Registrar/equivalent -> Deputy Registrar/equivalent | Very Good in three areas and Excellent in either core area |

The core areas are Ability in Work/Knowledge in Work and Promotion of Work/Application of Knowledge.

### 7.3 Shared Promotion of Work rules

Promotion of Work is assessed by external assessors where the target route requires external assessment. Reports, papers, memoranda, proposals, publications, designs, innovations, case studies, and other professional outputs must show verified institutional or professional impact.

General Schedule K output rules include:

- 15 points for each refereed journal paper.
- 10 points for each memorandum or applicable innovation according to the professional template.
- Minimum 2 memoranda/papers for first-tier promotion.
- Minimum 5 additional memoranda/papers for middle-tier promotion.
- Minimum 5 additional memoranda/papers and 2 refereed articles for the highest analogous tier.
- Outputs used for an earlier promotion cannot be counted again for the later promotion.
- Hospital case studies may be treated as equivalents where policy allows.

The system therefore needs an output-use ledger tied to previous promotion cases.

### 7.4 Shared Human Relations template

| Criterion | Weight |
|---|---:|
| Comportment/rapport with colleagues, subordinates, public, and students | 40 |
| Reports from mentors or heads | 30 |
| Promptness in service to the University community and public | 30 |

### 7.5 Shared Service assessment

RAPC assesses service using the rank-sensitive Schedule K Appendix A tables. The system must support University and national/international activities, repeated instances, acting duration, equivalent positions, supporting evidence, and additional evidenced activities not explicitly listed.

### 7.6 Profession-specific Ability in Work templates

The common Schedule K structure must use dynamic templates. It should not create unrelated hard-coded applications for every office.

#### Registry

| Criterion | Weight |
|---|---:|
| Administrative procedures, trends, government policies and guidelines | 10 |
| Logistics, records, reports, minutes, follow-up, committee service, timeliness, thoroughness | 30 |
| Responsibility/confidentiality | 10 |
| Initiative/resourcefulness/drive | 10 |
| Supervision/mentorship | 10 |
| Assertiveness/independent work | 10 |
| Capacity for sustained work | 10 |
| Performance appraisal | 10 |

#### Finance, Internal Audit, and Procurement

| Criterion | Weight |
|---|---:|
| Current accountancy, finance, and management information systems knowledge | 30 |
| Enforcement of University financial and related regulations | 5 |
| Adaptation to government legislative directives and policies | 5 |
| Responsibility/confidentiality | 10 |
| Initiative/resourcefulness/drive | 10 |
| Supervision/mentorship | 10 |
| Assertiveness/independent work | 10 |
| Timely reports | 5 |
| Capacity for sustained work | 5 |
| Performance appraisal | 10 |

#### Works and Physical Development

| Criterion | Weight |
|---|---:|
| Pre-contract technical/professional services | 20 |
| Post-contract, legal, technical, project, certificate, defects, and final-account services | 15 |
| Timely drawings and reports | 10 |
| Responsibility/confidentiality | 10 |
| Initiative/resourcefulness/drive | 10 |
| Supervision/mentorship | 10 |
| Assertiveness/independent work | 10 |
| Capacity for sustained work | 5 |
| Performance appraisal | 10 |

#### Information and Communications Technology

| Criterion | Weight |
|---|---:|
| Current general ICT knowledge | 25 |
| Networking, connectivity, programming, software, and technical specifications | 20 |
| Responsibility/confidentiality | 10 |
| Initiative/resourcefulness/drive | 10 |
| Supervision/mentorship | 10 |
| Assertiveness/independent work | 10 |
| Capacity for sustained work | 5 |
| Performance appraisal | 10 |

#### University Health Services

| Criterion | Weight |
|---|---:|
| Current knowledge in chosen field | 35 |
| Quality of advice to patients | 10 |
| Responsibility/confidentiality | 10 |
| Initiative/resourcefulness/drive | 10 |
| Supervision/mentorship | 10 |
| Assertiveness/independent work | 10 |
| Capacity for sustained work | 5 |
| Performance appraisal | 10 |

#### Library

| Criterion | Weight |
|---|---:|
| Current professional knowledge | 25 |
| Quality of advice to users | 10 |
| Precision and professionalism | 10 |
| Initiative/resourcefulness/drive | 10 |
| Library software competence | 20 |
| Assertiveness/independent work | 10 |
| Capacity for sustained work | 5 |
| Performance appraisal | 10 |

All criteria must require a score, reason, and linked evidence where appropriate. Template versions must be immutable after a case is submitted.

### 7.7 Verified Schedule K promotion ladders

| Family | First tier | Middle tier | Highest tier |
|---|---|---|---|
| Registry | Junior Assistant Registrar -> Assistant Registrar: 2 years, favorable Head assessment, interview | Assistant Registrar -> Senior Assistant Registrar: 4 years, favorable Head and 1 external assessor | Senior Assistant Registrar -> Deputy Registrar: 5 years, favorable Head and 2 external assessors; tenured |
| Finance/Internal Audit | Assistant Accountant/Auditor -> Accountant/Auditor: 2 years and interview | Accountant/Auditor -> Senior: 4 years and 1 external assessor | Senior -> Deputy Director: 5 years and 2 external assessors; tenured |
| Procurement | Junior Assistant Procurement Officer -> Assistant: 2 years and interview | Assistant -> Senior Assistant: 4 years and 1 external assessor | No higher promotion route is stated in the reviewed Schedule K promotion section |
| Works | Assistant professional -> professional grade: 2 years and interview | Professional -> Senior professional: 4 years and 1 external assessor | Senior professional -> Deputy Director: 5 years and 2 external assessors; tenured |
| ICT | Assistant ICT professional -> ICT professional: 2 years and interview | ICT professional -> Senior ICT professional: 4 years and 1 external assessor | Senior ICT professional -> Deputy Director ICT: 5 years and 2 external assessors; tenured |
| Health | Medical/Dental Officer, Pharmacist, Optometrist -> Senior: 4 years and 1 external assessor | Senior -> Principal: 5 years and 1 external assessor | Higher office appointment is separate from this promotion route |
| Library | Junior Assistant Librarian -> Assistant Librarian: 2 years and interview | Assistant Librarian -> Senior Assistant Librarian: 4 years and 1 external assessor | Senior Assistant Librarian -> Deputy Librarian: 5 years and 2 external assessors; tenured |

The policy engine must represent named ranks and analogous grade levels. It must not force every professional family into academic ranks.

### 7.8 Schedule K dossier from supplied forms

The non-academic Senior Member dossier needs:

- Unit/Section/Directorate/Division.
- Current rank and target rank.
- Qualifications and dates.
- Employment schedules and positions held.
- Major projects and assignments.
- Conferences, workshops, and seminars.
- Reports, memoranda, papers, publications, innovations, case studies, designs, or other work outputs.
- CV and certificates.
- Current and historical performance appraisals.
- Applicant declaration and submission record.
- Confidential Head/supervisor assessment.
- Profession-specific Ability in Work assessment.
- External Promotion of Work assessment.
- Human Relations assessment.
- RAPC Service assessment.
- Four-area summary and classifications.
- Recommendations and reasons at each institutional stage.
- Acknowledgements by Unit Head/HOD, HRODD, and Registrar as applicable.

### 7.9 Schedule K workflow

1. Applicant submits relevant forms and application letter through the Head of Unit/Directorate to the Registrar.
2. Head acknowledges receipt, assesses the required areas, certifies applicable outputs, and forwards within one month.
3. Professional units propose at least three external assessors for RAPC certification; for administrative units, the Registrar determines assessors.
4. Registrar acknowledges receipt and arranges RAPC consideration.
5. RAPC assesses service, reviews the case, and records its recommendation.
6. RAPC forwards every required paper and recommendation to UAPC within one month.
7. External assessments are obtained according to the target rank.
8. UAPC considers the complete case with a valid quorum and required chair.
9. UAPC records its recommendation or decision according to the resolved authority rule.
10. Council approval is recorded where required.
11. Result and effective date are communicated.
12. Appeal rights remain available.

Schedule K targets a final communicated outcome within 10-12 months. A special panel including external assessors may be constituted after the deadline.

### 7.10 Special-circumstances promotion

An administrative or professional candidate who lacks all normal minimum requirements may be considered if the candidate has performed excellently in one assessable area for at least five years and has ten years of relevant working experience. This route requires UAPC interview and must be captured as a separate, fully justified route.

## 8. External assessor subsystem

External assessment is a first-class confidential workflow, not an uploaded document owned by HR.

Required capabilities:

- Candidate nomination list and source of nomination.
- Specialty and institution matching.
- Country classification.
- Rank and qualification check.
- Conflict-of-interest declaration and review.
- Appointment authority and appointment record.
- Invitation, acceptance, decline, and replacement.
- Secure time-limited access without creating a normal staff account.
- Exact frozen material packet sent to each assessor.
- Confidential report and structured assessment form.
- Due date, reminders, overdue escalation, and receipt acknowledgement.
- Separation of assessor identity/report from applicant-visible material.
- Record that assessor advice is not itself the institutional decision.

## 9. Committee and governance subsystem

Required committee entities:

- Committee definition and type: FAPC, RAPC, UAPC, Academic Board, Council, Appeals Board, special panel.
- Term and membership.
- Member's institutional rank and office at the date of the meeting.
- Chair and secretary.
- Case-specific attendance.
- Eligibility to participate for the target rank.
- Conflict disclosure and recusal.
- Quorum calculation.
- Agenda and meeting date.
- Documents available to the committee.
- Individual assessment or vote where required.
- Collective recommendation, reasons, and conditions.
- Approved minutes and attached extracts.
- Decision authority and communication record.

The system must block a formal committee outcome if quorum or mandatory-chair rules fail. It must preserve the failed attempt in the audit trail.

## 10. Appeals

Both Schedule J and Schedule K provide a multi-level appeal route:

1. Petition UAPC within one month of notification.
2. If dissatisfied, petition Council within three months.
3. If still dissatisfied, petition the University Appeals Board.
4. Appeals Board ruling is final.

An appeal must be a related but distinct case with grounds, filing date, admissibility check, records under appeal, additional evidence rules, assigned authority, hearing/consideration record, outcome, communication, and effect on the original promotion case.

## 11. Target case lifecycle

One flat enum is too weak for the real process. V2 should use a case state plus stage-specific tasks.

Recommended top-level case states:

- `PREPARATION`
- `SUBMITTED`
- `IN_ASSESSMENT`
- `AWAITING_EXTERNAL_ASSESSMENT`
- `IN_COMMITTEE_CONSIDERATION`
- `AWAITING_FINAL_AUTHORITY`
- `DECIDED`
- `COMMUNICATED`
- `UNDER_APPEAL`
- `CLOSED`
- `WITHDRAWN`

Recommended tasks include:

- Complete dossier.
- Applicant declaration.
- HOD/Unit Head acknowledgement.
- Rank-history verification.
- Output certification.
- HOD teaching or Head ability assessment.
- Dean routing.
- HRODD completeness check.
- FAPC/RAPC preparation.
- External assessor nomination and appointment.
- External report collection.
- Committee quorum and recusal check.
- FAPC/RAPC assessment and recommendation.
- UAPC consideration.
- Academic Board or Council action where applicable.
- Result communication.
- Effective-date calculation.
- Appeal-window monitoring.

Tasks need owner type, assigned user, due date, completion rule, dependencies, output, and escalation. The applicant-facing status should be a clear summary of the real tasks, not a misleading simplification.

## 12. Target domain model

### 12.1 Organization and identity

- `StaffMember`
- `StaffIdentity`
- `EmploymentRecord`
- `StaffCategory`
- `OrganizationalUnit`
- `OrganizationalUnitType`
- `RankDefinition`
- `RankLevel`
- `RankHistory`
- `OfficeDefinition`
- `OfficeAppointment`
- `Account`
- `Permission`
- `AccountPermissionAssignment`

### 12.2 Policy

- `PolicyDocument`
- `PolicyVersion`
- `PolicySourceReference`
- `PromotionTrack`
- `JobFamily`
- `PromotionRoute`
- `RouteRequirement`
- `AssessmentAreaDefinition`
- `AssessmentTemplate`
- `AssessmentCriterion`
- `PerformanceBand`
- `OutputRule`
- `ServicePointRule`
- `ExternalAssessorRule`
- `WorkflowTemplate`
- `TaskTemplate`
- `AuthorityRule`

### 12.3 Case and dossier

- `PromotionCase`
- `PolicySnapshot`
- `ApplicantSnapshot`
- `CaseTask`
- `CaseStatusHistory`
- `Acknowledgement`
- `Declaration`
- `Qualification`
- `TeachingActivity`
- `StudentEvaluationSummary`
- `SupervisionActivity`
- `ResearchProject`
- `ScholarlyOutput`
- `ProfessionalOutput`
- `AuthorshipContribution`
- `GrantActivity`
- `ServiceActivity`
- `PerformanceAppraisal`
- `EvidenceAttachment`
- `EvidenceLink`
- `EvidenceVerification`
- `DossierSnapshot`

### 12.4 Assessment and governance

- `AssessmentAssignment`
- `AssessmentResponse`
- `CriterionScore`
- `AreaScore`
- `AreaClassification`
- `ExternalAssessorCandidate`
- `ExternalAssessorAppointment`
- `ExternalAssessmentRequest`
- `ExternalAssessmentReport`
- `Committee`
- `CommitteeTerm`
- `CommitteeMembership`
- `Meeting`
- `MeetingAttendance`
- `ConflictDeclaration`
- `Recusal`
- `AgendaItem`
- `CommitteeOutcome`
- `VoteRecord`
- `MinuteRecord`
- `InstitutionalDecision`
- `DecisionCommunication`
- `AppealCase`
- `AuditEvent`

## 13. Policy engine requirements

The engine must be deterministic, explainable, versioned, and advisory.

For each submitted case it must freeze:

- Policy version.
- Staff category and job family.
- Current and target rank.
- Applicable route.
- Minimum time rule.
- Output quantity, quality, recency, and reuse rules.
- Best-N rule.
- Required assessable areas.
- Criterion weights and performance bands.
- Area-combination rule.
- External assessor count and geography rule.
- Workflow and final authority.
- Deadline and effective-date rules.

The engine output must show:

- Which rule was tested.
- Inputs used.
- Result: met, not met, incomplete, or requires human determination.
- Source policy and clause/page reference.
- Human override or exception, authorized actor, reason, and date.

Changing policy must create a new version. It must not silently alter a case already submitted under an older version.

## 14. Records, security, and privacy

Promotion dossiers contain personal information, confidential assessments, committee records, and career decisions. Minimum controls:

- Least-privilege access.
- Case-scoped and stage-scoped permissions.
- External assessor isolation.
- Applicant exclusion from confidential reports unless policy authorizes disclosure.
- Encryption in transit and at rest.
- Malware scanning and file-type validation.
- Immutable audit events for sensitive actions.
- Download, export, and print logging.
- Retention and disposal schedule approved by GCTU.
- Backup and recovery testing.
- Session security and multi-factor authentication for privileged users.
- Separation between technical administration and promotion decisions.
- Privacy-aware analytics and no unnecessary exposure of applicant data.

## 15. Current software gap matrix

| Area | Current implementation | Verified requirement | Gap severity |
|---|---|---|---|
| Scope | Academic lecturer ranks only | Schedule J, Schedule K, later Harmonized Scheme streams | Critical |
| Identity | User can self-declare profile after official-email verification | Match to authoritative HRODD staff record and rank history | Critical |
| Roles | Lecturer, combined HOD/Dean, HR, generic committee, system admin | Rank, office, organization, and case permission separated | Critical |
| Rank model | Five academic ranks | Academic teaching/research tracks plus profession-specific non-academic ranks | Critical |
| Application data | Current rank, target rank, declared years, document uploads | Full structured Form 2A/2B dossier and profession-specific evidence | Critical |
| Evidence | One document per generic category because of `@@unique([requestId, category])` | Many structured activities and many attachments per category | Critical |
| Score | 40 research + 40 teaching + 20 service when files are verified | Content-based, area-specific Schedule J/K scores and combinations | Critical |
| Criteria | Three generic academic routes; two minimum-year values are wrong | All verified routes with best-N, output, area, assessor, and authority rules | Critical |
| HOD/Dean | One portal role with scope inferred from department assignment | Separate offices, rank checks, substitutions, cognate Dean, and routing | High |
| Committees | One reviewer can record a generic committee recommendation | FAPC/RAPC/UAPC membership, attendance, quorum, recusal, minutes, collective outcome | Critical |
| External assessment | No dedicated subsystem | Nomination, appointment, conflicts, packet, confidential report, reminders | Critical |
| Authority | HR/system admin records generic authority status | UAPC, Academic Board, Council, and Appeals Board authority by route | Critical |
| Appeals | Not modeled | One-month UAPC, three-month Council, Appeals Board final | Critical |
| Deadlines | Timestamps but no statutory SLA engine | Task and case deadlines, reminders, escalations, quarterly updates | High |
| Policy history | Mutable current criteria row | Versioned policy and per-case immutable snapshot | Critical |
| Output reuse | Not modeled | Prevent previously used Schedule K outputs from being recounted | High |
| Effective date | Not modeled | 1 February/1 August rule and submission window | High |
| Audit | General audit and status history exist | Extend to policy, dossier, access, committees, assessments, decisions, exports | Medium |
| Notifications | General in-app notifications and email hooks exist | Policy-timed acknowledgements, reminders, status updates, and confidential routing | Medium |
| Reporting | Generic workflow analytics | Compliance, SLA, workload, assessor, committee, route, outcome, and appeal reporting | High |

### 15.1 Reusable foundations

The current project does not need to be discarded. Useful foundations include:

- Next.js application structure.
- Prisma database access.
- Authentication foundation.
- Faculty and Department records.
- File upload and secured download routes.
- Notifications.
- Audit logging.
- Status history.
- Responsive portal shell and dashboards.
- Existing testing and defence automation scripts.

The front end and technical stack can evolve. The promotion domain, policy engine, data model, and workflow need a V2 redesign.

## 16. Form and policy quality issues requiring clarification

These are not reasons to stop research. They are items the system must make explicit instead of hiding:

1. Schedule K describes four composite areas but one sentence says five areas. Implement four, subject to GCTU confirmation.
2. Works and Physical Development requests four copies while the other supplied non-academic forms request twelve. A digital system should remove copy counts, but the official discrepancy should be confirmed.
3. Some non-academic dossier checklists refer to teaching evidence, apparently copied from an academic checklist. Confirm whether this should read Ability in Work or work-support evidence.
4. Some supplied tables appear to contain prefilled classification wording or numbering mistakes. Digital templates should use the policy weights and corrected labels, with provenance notes.
5. The forms let an assessor mark qualified/not qualified, but the Basic Laws assign institutional consideration to RAPC/UAPC and, in relevant cases, Council. Treat assessor output as advice or recommendation.
6. Schedule J says UAPC's decision is final for Lecturer to Senior Lecturer, while the committee-functions section also refers recommendations for Senior Lecturer to Academic Board. Confirm whether Academic Board acknowledgement/approval is required in the live process.
7. Schedule K says UAPC communicates a final outcome within 10-12 months, while its functions say it recommends administrative/professional promotions to Council. Confirm which ranks require Council approval and how that approval is recorded.
8. Schedule J contains both a rule that no application should be withheld from FAPC and a rule allowing HOD/FAPC to communicate that a case does not meet the next-stage requirements. Confirm whether such cases stop or are still forwarded with an adverse assessment.
9. Confirm the full Professor service distribution because the public PDF extraction truncates the line after University Community = 50%.
10. Obtain the current Harmonized Scheme of Service for Senior and Junior Staff.
11. Obtain the current ICT and Health promotion forms and any revised versions of the supplied profession-specific forms.
12. Confirm whether the 2021 Basic Laws have been amended by later Council decisions, collective agreements, or implementation directives.

## 17. Functional requirements by priority

### Must have for a credible GCTU V2

- Authoritative staff roster and controlled account activation.
- Separate staff category, rank, office, organization, and permission models.
- Schedule J and Schedule K tracks.
- Complete rank-route catalogue and corrected minimum years.
- Structured dossier matching official forms.
- Multiple evidence items and attachments.
- Versioned policy and case snapshot.
- Schedule J three-area assessment.
- Schedule K four-area and profession-specific assessment.
- Best-N academic publication selection.
- Schedule K output reuse prevention.
- HOD, Dean, Unit Head, HRODD, FAPC, RAPC, UAPC, Council, and external assessor tasks.
- Committee composition, rank check, quorum, recusal, and minutes.
- External assessor subsystem.
- Decision authority by route.
- SLA, acknowledgement, reminder, and escalation engine.
- Effective-date calculation.
- Appeals.
- Confidentiality and complete audit trail.

### Should have

- ORCID and Google Scholar identifiers with applicant validation of imported records.
- Reusable career portfolio feeding future promotion cases.
- CV generation from structured data.
- Meeting agenda packs and controlled minute extracts.
- Workload, delay, and compliance analytics.
- Configurable letter and email templates.
- Bulk import of historical staff and promotion records.
- Accessible document preview and annotation.

### Could have after policy-complete core

- HR/ERP integration.
- Institutional SSO.
- ORCID publication import and duplicate matching.
- Digital signatures.
- Research repository links.
- Advanced trend and planning dashboards.

## 18. Implementation sequence

### Phase 0: Policy validation

- Present this baseline to the supervisor.
- Ask HRODD/Registrar to resolve Section 16.
- Obtain the Harmonized Scheme and missing forms.
- Approve system scope and terminology.

### Phase 1: Core institutional model

- Migrate staff identity, categories, ranks, rank history, offices, organizations, and permissions.
- Replace open profile assertions with HRODD-controlled staff records.
- Add policy source, version, route, and snapshot structures.

### Phase 2: Dossier and evidence

- Build the structured career portfolio.
- Build Schedule J and Schedule K application forms.
- Support many evidence items and attachments.
- Add declarations, acknowledgements, verification, and immutable submission snapshots.

### Phase 3: Policy and assessment engines

- Implement route eligibility.
- Implement Schedule J output and service calculations.
- Implement Schedule K four-area combinations and profession templates.
- Add explainable results and manual determination points.

### Phase 4: Workflow and external assessment

- Add case tasks, deadlines, assignment, reminders, and escalation.
- Add FAPC/RAPC/UAPC routing.
- Add external assessor nomination, appointment, and secure reports.

### Phase 5: Governance, decision, and appeal

- Add meetings, quorum, recusal, votes/outcomes, and minutes.
- Add Academic Board/Council action by route.
- Add result letters, effective dates, appeal windows, and appeal cases.

### Phase 6: Reporting, hardening, and defence

- Add compliance and SLA reports.
- Perform permission and confidentiality tests.
- Test every route and exceptional case.
- Update Chapters 4 and 5, diagrams, screenshots, test evidence, and defence material from the implemented system.

## 19. Acceptance scenarios

The rebuilt system is not ready to claim full coverage until it can demonstrate at least:

1. Lecturer -> Senior Lecturer with six best refereed outputs and one external assessor.
2. Senior Lecturer -> Associate Professor with ten best outputs and two assessors including one outside Ghana.
3. Associate Professor -> Professor with Council ratification.
4. Research Fellow track with its different output counts.
5. Registry first-, middle-, and highest-tier promotions.
6. Finance/Audit promotion using its own Ability in Work rubric.
7. Works promotion using its own rubric and professional outputs.
8. ICT, Health, and Library profession templates.
9. Schedule K area-combination pass and fail cases that have the same arithmetic average.
10. Rejection of a reused Schedule K output.
11. External assessor decline and replacement.
12. FAPC member recusal and quorum recalculation.
13. HOD/Dean below-target-rank substitution.
14. Deadline escalation and quarterly applicant update.
15. Exceptional promotion route.
16. Council/UAPC/Academic Board authority selected correctly by route.
17. UAPC, Council, and Appeals Board appeal sequence.
18. Unauthorized user blocked from confidential reports and committee records.

## 20. Documentation impact

Chapters 1-3 have already been approved and should not be casually rewritten. The expanded scope must, however, be reflected where the approved wording currently limits the project to academic lecturers. Any necessary Chapter 1-3 correction should be minimal and discussed with the supervisor.

Chapter 4 should be substantially updated with:

- Revised system scope and actors.
- Schedule J and Schedule K requirements.
- Updated use cases.
- Separate academic and administrative/professional activity workflows.
- Improved domain model, ERD, component diagram, and state/task model.
- Security and role design.
- Policy engine and database design.
- Interface designs for applicants, HRODD, committees, external assessors, and authorities.

Chapter 5 should be updated only after implementation with:

- Implemented modules, not proposed features.
- Screenshots from clean and realistic cases.
- Route-based functional tests.
- Scoring and eligibility test cases.
- Quorum, recusal, confidentiality, and appeal tests.
- Limitations, especially the status of Senior/Junior Staff rules if the Harmonized Scheme is still unavailable.

## 21. Final recommendation

Do not add the five supplied forms as five PDF upload buttons and call the system complete. The forms reveal one configurable institutional promotion platform with multiple policy tracks and dynamic professional assessment templates.

The immediate next action is a supervisor/HRODD requirements review using this document. Once the policy questions are answered, the software should move into the phased V2 rebuild above. This gives the project a defensible academic contribution: converting complex GCTU promotion policy into a transparent, explainable, auditable, and usable digital workflow without replacing authorized human judgment.
