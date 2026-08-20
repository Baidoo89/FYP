# GCTU Staff Promotion System V2

## Deep Research, Completeness, and Policy Validation Addendum

Prepared for: Benjamin Baidoo and project team

Research baseline date: 10 August 2026

Status: Evidence-based requirements for GCTU stakeholder validation; not an implementation claim

This addendum must be read with `GCTU_PROMOTION_SYSTEM_V2_RESEARCH_AND_REQUIREMENTS.md`. Where it adds a newer official source, a more precise rule, or a documented conflict, this addendum takes precedence in the requirements baseline.

## 1. Research conclusion

The target cannot be a lecturer-only performance and document-upload system. A defensible institutional target is a **Digital Staff Promotion Management and Decision-Support System for GCTU** covering the complete preparation, assessment, governance, decision, communication, records, and appeal lifecycle.

The public evidence confirms four distinct staff promotion streams:

1. Academic Senior Members under Schedule J.
2. Administrative and Professional Senior Members under Schedule K.
3. Senior Staff under the Unified Scheme of Service for Senior Staff of Public Universities of Ghana.
4. Junior Staff under the Unified Scheme of Service for Junior Staff of Public Universities of Ghana.

The first two streams can be specified in substantial detail from GCTU's public Basic Laws, policies, forms, manuals, and handbook. The latter two have verified GCTU committees and routing, but the controlling Unified Schemes are not published by GCTU and were not found as complete authoritative public documents. Their rank and eligibility rules must therefore remain configurable and blocked from production activation until HRODD supplies the controlled copies.

The system must support human institutional judgment. It may calculate policy-defined eligibility, scores, deadlines, quorum, and completeness. It must not automatically decide that a person is promoted.

## 2. Authority and source register

### 2.1 Source hierarchy

Use this order when translating policy into software:

1. Ghana Communication Technology University Act, 2020 (Act 1022).
2. GCTU Basic Laws and their Schedules.
3. Council-approved GCTU rules, conditions, and policies.
4. Official GCTU promotion and employment forms.
5. GCTU administrative manuals and operational handbooks.
6. Written implementation directives approved by an authorized GCTU body.
7. Ghanaian legislation applying to data, records, electronic transactions, and cybersecurity.
8. External design, accessibility, and security standards, which may improve implementation but may not alter GCTU promotion rules.

If two GCTU sources conflict, the product must not silently pick one. It must record the conflict, source clauses, policy owner, approved interpretation, effective date, and policy version.

### 2.2 GCTU sources examined

| Source | Date shown | Authority/use | Promotion relevance |
|---|---|---|---|
| GCTU Act, Act 1022 | 2020 | Enabling legislation | Appeals Board jurisdiction includes staff promotion |
| GCTU Basic Laws | Public PDF dated 17 Dec 2021 | Primary detailed policy | Schedules J and K; committee structures; promotion criteria, routes, appeals, and deadlines |
| Official appointment and promotion forms page | Current public page | Operational forms catalogue | Forms 1A, 1B, 1C, 2A, 2B, and 3A |
| Conditions of Service for Senior Members | Mar 2023 | Council-approved employment conditions | Submission, progression, retirement cutoff, renewal, confirmation, and promotion linkage |
| Appeals Board Rules and Regulations | Jun 2023 | Statutory appeal procedure | Filing, hearings, decisions, review, records, and appeal forms |
| Administrative Procedures Manual | 2024 | University operating procedure | FAPC, RAPC, UAPC, Senior Staff, Junior Staff, agenda, minutes, quorum, and action tracking |
| Records and Archives Management Policy | Feb 2024 | Council-approved records policy | Classification, access, retention, destruction, archives, and personnel records |
| Teaching, Research and Service Workload Policy | 2024 | Council-authorized workload policy | Annual faculty workload, research scorecard, service, outreach, and promotion evidence |
| Heads of Academic Departments Handbook | 2025 | Current HOD operating guide | Dossier checklist, acknowledgements, assessments, assessor nomination, SLAs, and retirement cutoff |
| Online evaluation of teaching and courses | Current service page | Operational quality-assurance process | Anonymous evaluation, analyzed aggregate results, and restricted raw comments |
| Strategic Plan 2022-2030 | 2022-2030 | Institutional strategy | Configurable organizational growth and governance systems |

Official source links:

- [GCTU Basic Laws](https://site.gctu.edu.gh/gctu-basic-laws)
- [GCTU staff appointment and promotion forms](https://site.gctu.edu.gh/staff-appointment-and-promotion-forms)
- [Conditions of Service for Senior Members](https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/policies/CONDITIONS-OF-SERVICE-FOR-SENIOR-MEMBERS.pdf)
- [Appeals Board Rules and Regulations](https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/policies/Appeals-Board-Rules-and-Regulations.pdf)
- [Administrative Procedures Manual](https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/Administrative-Procedures-Manual.pdf)
- [Records and Archives Management Policy](https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/Records-and-Archieves-Policy-Final-Accepted.pdf)
- [Teaching, Research and Service Workload Policy](https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/Teaching-Research-and-Service-Workload-Policy-and-Guidelines.pdf)
- [Heads of Academic Departments Handbook](https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/policies/Heads-of-Academic-Departments-Handbook.pdf)
- [Online evaluation of teaching and courses](https://site.gctu.edu.gh/online-evaluation-of-teaching-and-courses)
- [Strategic Plan 2022-2030](https://site.gctu.edu.gh/wp-content/uploads/gtuc/external/policies/2022-2030-STRATEGIC-PLAN.pdf)

### 2.3 Evidence labels

Each configured requirement must carry one of these labels:

- `VERIFIED`: directly supported by an identified GCTU source and clause.
- `VERIFIED_CONFLICT`: directly supported, but contradicted by another GCTU source.
- `CONFIRMATION_REQUIRED`: incomplete, ambiguous, apparently outdated, or unavailable.
- `DESIGN_CONTROL`: a legal, security, accessibility, records, or usability control that does not change substantive promotion criteria.

## 3. Complete official form inventory

The GCTU public page contains six forms. They do not all represent promotion.

| Form | What the form actually covers | Correct system treatment |
|---|---|---|
| Form 1A | Title says Application for Promotion, but body says application for appointment and asks appointment-style personal and referee data | Do not use as the academic promotion dossier without written clarification |
| Form 1B | Senior Administrative and Professional Staff appointment | Separate appointment intake, not promotion |
| Form 1C | Appointment to senior-level administrative positions | Separate senior-office appointment process |
| Form 2A | Academic Senior Member appointment/promotion information | Main structured dossier for Schedule J promotion |
| Form 2B | Administrative and Professional Senior Member promotion | Main structured dossier for Schedule K promotion |
| Form 3A | Renewal of appointment | Separate renewal event linked to the staff employment history |

The forms' instructions for ten or twelve hard copies should become one frozen, reproducible electronic record with controlled access. Section 16 of Ghana's Electronic Transactions Act allows one reproducible electronic record to satisfy a requirement for multiple copies to one addressee. Recipient access and dossier versions must be logged instead of storing duplicate files.

System scope should include integration points for appointment, confirmation, renewal, regrading, and promotion, while keeping each event type legally and operationally distinct.

## 4. Meaning of a full GCTU promotion system

Full coverage does not mean placing every form on one dashboard. It means the system can represent all of these institutional capabilities:

- Authoritative staff identity and employment history.
- Staff category, substantive rank, office, organization, and system permission as separate facts.
- Structured career portfolio and reusable evidence.
- Route-specific application dossier.
- Policy version and immutable case snapshot.
- Eligibility and completeness checks with reasons.
- Head, HOD, Dean, HRODD, Registrar, and verifier tasks.
- FAPC, RAPC, UAPC, Senior Staff Committee, Junior Staff Committee, Academic Board, Council, and Appeals Board actions.
- External assessor nomination, appointment, secure packet, report, reminders, and replacement.
- Committee membership, rank eligibility, attendance, quorum, conflict, recusal, agenda, minutes, and decision record.
- Statutory deadlines, acknowledgements, applicant updates, reminders, escalation, and overdue panels.
- Decision communication, effective date, and publication controls.
- Internal petitions, Council petitions, and statutory Appeals Board cases.
- Confidentiality, access classification, audit, retention, legal hold, archival transfer, and authorized destruction.
- Accessible and task-focused user experiences that do not require users to understand policy jargon before acting.

## 5. Schedule J additions and refinements

### 5.1 Conditions of Service controls

The 2023 Conditions of Service adds controls that must be enforced before or alongside Schedule J:

- Promotion normally proceeds to the immediate next rank.
- A Senior Member may nevertheless apply at any time to a rank for which the person considers themself qualified. This creates a policy interpretation issue with normal progression and must not be reduced to a hardcoded next-rank-only dropdown.
- An application supported by assessment materials may not be processed if received less than six months before retirement.
- Compulsory retirement is normally at age 60.
- Promotion requirements and procedures are those in Schedules J and K.
- Effective dates follow the Basic Laws.
- Non-tenured contract renewal is separate and may be initiated at least six months before contract end.
- Confirmation after one year of probation depends on satisfactory work and conduct; probation may be extended by up to six months on FAPC/RAPC recommendation.

The retirement check needs verified date of birth, retirement date, employment status, submission timestamp, and an authorized exception field. It must never be calculated from a self-declared age.

### 5.2 Academic dossier checklist from the 2025 HOD Handbook

The current operational dossier may include:

- Completed official forms.
- Curriculum vitae.
- FAPC minutes or certified minute extract.
- List of publications submitted for assessment.
- Confidential HOD assessment.
- Annual records and performance evidence.
- Student evaluation reports for five years, where available.
- UAPC minutes for professorial cases.
- External assessor reports required for the route.

The handbook also requires the HOD to acknowledge an application in writing, copy designated offices, assess teaching, certify output counts and refereed sources, determine next-stage sufficiency, and propose at least three assessors. These are separate tasks with separate actors and timestamps.

### 5.3 Workload policy is evidence, not an unverified replacement for Schedule J

The 2024 workload policy adds annual performance data:

- Teaching, research/scholarship, service, and outreach/engagement allocations.
- Proposed distribution of 40% teaching, 35% research, 15% service, and 10% outreach.
- Minimum and maximum teaching loads by rank and office-holding status.
- Project and postgraduate supervision.
- Office visibility schedules.
- Research publications, presentations, patents, technology transfer, exhibits, and authorship contribution.
- A four-color annual research scorecard.
- Approval of workload by HOD, Faculty/School Board, Dean, and Pro Vice-Chancellor where specified.

The policy says research is a key promotion determinant, but it does not formally replace Schedule J's three independent promotion areas, output equivalencies, best-N selection, or performance bands. Therefore:

1. Store workload and scorecard results as annual evidence.
2. Display their source and period.
3. Do not automatically convert workload percentages into Schedule J scores.
4. Require GCTU to approve any mapping between workload metrics and promotion assessment.

The workload policy itself contains incompatible publication statements: an average of at least two refereed outputs per year, a later minimum of one indexed peer-reviewed publication per year, and scorecard bands where three to four publications are only Satisfactory. These must remain separate, visible policy clauses until GCTU supplies an interpretation.

### 5.4 Student evaluation privacy

GCTU's Quality Assurance and Promotion process describes student feedback as anonymous, with raw comments withheld from lecturers and statistical results produced from analyzed raw data. The promotion system should therefore import only an authorized aggregate report or signed evaluation summary. It must not copy raw student identities, individual responses, or unrestricted comments into a promotion dossier.

### 5.5 Publication verification

Publication evidence must support:

- Full citation and output type.
- DOI, URL, ISSN/ISBN, patent, repository, or deployment identifier where applicable.
- Author order and applicant contribution.
- Publication date and applicable policy period.
- Refereed/indexed status and verification source.
- Department verification.
- Library verification.
- Selected-for-assessment marker and best-N rule.
- Prior-use check where policy requires it.
- External assessor packet membership.
- Repository deposit status where copyright permits.
- ORCID and Google Scholar identifiers as profile evidence, not proof by themselves.

Predatory-journal screening must be an evidence-based human verification process with source and date. It should not hardcode an old blacklist as permanent truth.

## 6. Schedule K additions and unresolved profession coverage

### 6.1 Appointment families are not automatically promotion ladders

Schedule K discusses Registry, Legal, Finance/Internal Audit, Procurement, Works, ICT, Health, Sports, and Library appointment families. Its explicit promotion routes are not equally complete:

- Registry has first, middle, and Deputy Registrar routes.
- Finance/Internal Audit has first, middle, and Deputy Director routes.
- Works has first, middle, and Deputy Director routes.
- ICT has first, middle, and Deputy Director routes.
- Library has first, middle, and Deputy Librarian routes.
- Health has Officer, Senior, and Principal routes, with higher office appointment treated separately.
- Procurement states routes only up to Senior Assistant Procurement Officer in the reviewed promotion text.
- Legal has an appointment description for In-House Counsel but no verified promotion ladder or Ability in Work template.
- Sports has a Head appointment description but no verified promotion ladder or Ability in Work template.

The product must not invent missing ranks, years, output counts, assessor counts, or rubrics. Legal, Sports, and any Procurement route above the published level must be marked `CONFIRMATION_REQUIRED` until an approved policy or form is supplied.

### 6.2 Professional and administrative assessor selection

Schedule K distinguishes assessor handling:

- Professional units propose at least three possible assessors for RAPC certification.
- For administrative candidates, the Registrar determines the assessor arrangement.
- First-tier promotion may use internal assessment.
- Middle-tier promotion normally uses one external assessor, generally in Ghana but outside GCTU.
- Highest-tier promotion generally uses two external reports.

Health's published highest promotion route appears to require one assessor, unlike the general highest-tier pattern. The route-specific text and general tier rule must both be retained until GCTU confirms precedence.

### 6.3 Schedule K output controls

- Outputs must be accepted by an appropriate Board or Committee for implementation.
- Outputs should lead to policy change, management direction, implementation, or product/policy innovation.
- The first tier requires two outputs.
- The middle tier requires five additional outputs.
- The highest tier requires five additional outputs, including two refereed outputs.
- A previously used output must not be reused for a later promotion.
- Hospital case studies may count under stated equivalencies.
- Each output needs type, policy value, acceptance body, acceptance date, implementation evidence, prior-use status, and linked files.

## 7. Senior Staff and Junior Staff streams

### 7.1 What is verified

GCTU's Basic Laws establish separate Senior Staff and Junior Staff Appointments and Promotions Committees. Each committee includes:

- Registrar as Chairperson.
- Director of Finance.
- Librarian.
- Director of ICT.
- Director of Internal Audit.
- Director of Human Resource and Organisational Development.
- Director of Works and Physical Development.
- Secretary appointed by the Registrar.
- Candidate's Head/Director of Directorate or Unit in attendance.

The committees receive and make recommendations for appointment and promotion of their respective staff category. The 2024 Administrative Procedures Manual confirms that cases move from the originating unit through the Head, then the relevant Director or Dean/School/Institute/Centre, to the Registrar. A standalone unit may route from its Head directly to the Registrar.

Official GCTU material also confirms that these are real operating committees with scheduled meetings. GCTU's 2025 staff awards show current examples of categories and roles, including Administrative, Professional, and Technical Senior Staff, and Junior Staff roles such as security, cleaning, artisan, driver, and labourer. These examples confirm category breadth but are not promotion criteria.

### 7.2 What remains unavailable

The GCTU Basic Laws refer eligibility and rank criteria to the Unified Scheme of Service for Senior Staff and the Unified Scheme of Service for Junior Staff of Public Universities of Ghana. Other public universities also identify these controlled schemes, but a complete current GCTU-authorized copy was not found publicly.

The system may safely implement:

- Staff category and rank catalogue structures.
- Separate committee definitions and membership.
- Configurable route definitions.
- Application, evidence, assessment, recommendation, and decision records.
- Workflow from unit to Registrar and committee.
- Meeting, quorum, recusal, minute, notification, appeal, and retention controls.

The system must not activate:

- Senior/Junior rank ladders.
- Minimum service years.
- Qualification substitutions.
- Appraisal thresholds.
- Establishment or pool-promotion rules.
- Trade-specific requirements.
- Final-authority assumptions.

Those rules require the controlled schemes plus written GCTU confirmation of current amendments and local implementation practices.

### 7.3 Required HRODD policy pack

Request these documents before production activation:

1. Current Revised Unified Scheme of Service for Senior Staff of Public Universities of Ghana.
2. Current Revised Unified Scheme of Service for Junior Staff of Public Universities of Ghana.
3. Current Unified Conditions of Service for Unionized Staff of Public Universities of Ghana.
4. GCTU amendments, implementation circulars, and approved rank mappings.
5. Current Senior Staff and Junior Staff application and appraisal forms.
6. Establishment-control and pool-promotion rules used at GCTU.
7. Committee quorum, recommendation, approval, communication, and appeal practice for these streams.

## 8. Committee governance and records

### 8.1 Formal meeting controls

The Administrative Procedures Manual and Basic Laws require more than a reviewer clicking Approve. The system needs:

- Statutory, standing, ad hoc, and special-panel committee types.
- Ex officio, elected, nominated, co-opted, and in-attendance membership types.
- Membership terms and office/rank history.
- Agenda and controlled meeting pack, normally issued in advance.
- Case-specific eligibility based on target rank.
- Conflict disclosure and recusal.
- Attendance, apologies, and in-attendance record.
- Quorum calculation after exclusions and recusals.
- Mandatory chair presence where required.
- Deliberation record and collective outcome.
- Dissent or minority record where policy permits.
- Draft, correction, approval, and signed minute status.
- Certified minute extract for the dossier.
- Action and responsibility matrix.
- Controlled cleanup of confidential meeting materials.

FAPC requires at least three eligible members including the Dean. Members below the target rank are excluded. If a valid FAPC cannot be formed, the dossier routes directly to UAPC. UAPC uses a one-half quorum, and Schedule K requires the Vice-Chancellor to be present.

### 8.2 Meeting record deadlines

The Administrative Procedures Manual describes operational targets including an action/responsibility matrix and draft minutes within three working days. The workflow should make these configurable meeting tasks, record late completion, and preserve approved versions.

## 9. Full appeal lifecycle

### 9.1 Promotion-policy petitions

Schedules J and K describe an internal route:

1. Petition UAPC within one month of notification.
2. If dissatisfied, petition Council within three months.
3. If still dissatisfied, petition the GCTU Appeals Board.

The Appeals Board Rules require available University grievance procedures to be exhausted before a statutory appeal accrues.

### 9.2 Appeals Board case requirements

The 2023 Rules require the system to support:

- Confidential Appeals Board Secretariat and cause list.
- Notice of appeal identifying the decision, decision date, grounds, reasons, and supporting documents.
- Filing within one month after receipt of the decision under Rule 10.
- Application within six months for extension of filing time, with good and just cause.
- Conformance review with assistance to correct a defective filing.
- Appellant and respondent parties.
- Legal representative and Solicitor's Licence number where applicable.
- Panel of the Chairperson and two members.
- Oral hearing, witnesses, written submissions, and Board investigations.
- Natural justice and restriction to grounds stated in the notice.
- Non-appearance handling for appellant and respondent.
- Signed withdrawal with reasons.
- Decision by simple majority.
- Written dissent forming part of the ruling.
- Decision within one month after conclusion, excluding stated non-working periods.
- Finality subject to manifest error or error of law.
- Clerical correction, accidental-slip correction, clarification, and explanation.
- Review for miscarriage of justice, new evidence, error of law, or manifest error.
- Review application within fourteen days of receipt, supported by affidavit and written case.
- Full Board review and written decision supplied within twenty-one days after delivery.

The schedule's Form 1 note says the notice must be submitted within fourteen days, while Rule 10 says one month. This is a direct internal conflict. The deadline must remain versioned and configurable until the Appeals Board Secretariat or Legal Unit confirms the governing period.

Old requirements for two paper copies should be fulfilled by one frozen electronic appeal record with authorized reproducible access, subject to GCTU legal approval.

## 10. Records, privacy, and retention

### 10.1 GCTU records classifications

The 2024 Records Policy defines access classifications that include public, open, confidential, confidential and sensitive, and secret records. Staff records and promotion materials should be classified at record-type level, not merely hidden by page navigation.

At minimum:

- General applicant-authored dossier items: confidential.
- Performance reviews and confidential Head assessments: restricted/confidential and sensitive.
- External assessor identity and report: confidential and sensitive with case-stage restrictions.
- Committee packs and draft minutes: confidential and sensitive.
- Approved statutory minutes: preserved under archival rules with access restrictions for personal information.
- Appeals cause list and case records: confidential.
- Published successful results: public only after the authorized release stage.

### 10.2 Exact GCTU retention rules relevant to promotion

| Record | Retention/action in the 2024 policy |
|---|---|
| Core digital staff record, including successful internal applications | Retain permanently |
| Associated employment documents | End of employment plus 6 years, then authorized destruction unless extended |
| Annual staff review and development records | End of employment plus 3 years |
| Promotions, regrading, confirmation, justifications, increments, and supporting documents | End of employment plus 6 years |
| Performance, disciplinary, grievance, capability, and appeal records | End of employment plus 6 years |
| Tribunal case files | Retain permanently |
| Statutory/major committee agendas, minutes, and papers | Retain permanently and transfer to University Archives |
| Other committee and working-group records | Academic year plus 6 years, then reappraise |
| Committee membership and appointment records | End of tenure plus 6 years |
| Registers of interests | End of tenure plus 6 years |
| Data-protection requests | Last action plus 6 years, then reappraise |
| Data-breach and investigation records | Last action plus 6 years |

The University Archivist and depositing office must control disposition. No user, including a technical administrator, should permanently delete a case merely because it is old. The product needs retention holds, legal holds, reappraisal, authorized disposition, destruction certificates, archival transfer, and a destruction register.

### 10.3 Data protection requirements

Under Ghana's Data Protection Act, 2012 (Act 843), the product should implement:

- Defined purpose and lawful basis for each data category.
- Data minimization and no unnecessary personal fields copied from outdated forms.
- Clear privacy notice and role-specific confidentiality obligations.
- Access and correction handling without rewriting historical decisions.
- Retention tied to approved GCTU schedules.
- Secure and irreversible disposal after authorization.
- Technical and organizational safeguards against loss, damage, unauthorized access, and unauthorized processing.
- Written processor obligations for cloud, email, storage, or scanning providers.
- Breach detection, assessment, notification workflow, and evidence.
- Additional controls for health, union, and other special personal data.
- Human review and reasons for significant decisions; no solely automated promotion decision.

Design sources:

- [Data Protection Act, 2012 (Act 843)](https://dataprotection.org.gh/wp-content/uploads/2025/05/Data-Protection-Act-2012-Act-843.pdf)
- [Data Protection Commission compliance guidance](https://dataprotection.org.gh/compliance/)
- [Cybersecurity Act, 2020 (Act 1038)](https://www.cybersecurity.gov.gh/documents/Cybersecurity%20Act%202020%20%28Act%201038%29.pdf)
- [Electronic Transactions Act, 2008 (Act 772)](https://nita.gov.gh/wp-content/uploads/2017/12/Electronic-Transactions-Act-772.pdf)

### 10.4 Security controls

- Institutional identity matching and MFA for privileged roles.
- Least privilege, case scope, stage scope, and temporary delegation.
- Separation of technical administration from institutional authority.
- Encryption in transit and at rest.
- Object-level authorization on every file download and API operation.
- Malware scanning, extension/MIME/signature checks, size limits, and safe preview.
- External assessor time-limited access to one frozen packet.
- Immutable audit events for view, download, print, export, assignment, score, recommendation, decision, and deletion request.
- Alerting for bulk download, repeated denied access, privilege changes, and unusual assessor access.
- Backup, restore testing, recovery objectives, and continuity procedures.
- Session expiry, device/session review, account disabling, and emergency access procedure.
- Secure export watermarking and purpose/recipient logging.

## 11. Usability and accessibility requirements

A complete policy model can still produce poor software if every screen exposes policy language at once. The system should use progressive disclosure and role-specific tasks.

### 11.1 Applicant experience

- Start with eligibility preview and the reason for each result.
- Show one clear primary action per stage.
- Use a guided checklist grouped by Personal/Career, Teaching or Ability in Work, Knowledge Outputs, Service, and Declaration.
- Explain a required field beside the field in plain language.
- Reuse verified portfolio information instead of requesting repeated entry.
- Save drafts automatically and show last saved time.
- Show `Draft`, `Submitted`, `Action required`, `Under assessment`, `Awaiting external reports`, `Under committee consideration`, `Decision communicated`, or `Under appeal` instead of a vague `Pending`.
- Identify who currently owns the next task without revealing confidential assessors or deliberations.
- Show missing, invalid, and awaiting-verification items separately.
- Generate a final dossier preview before submission.

### 11.2 Reviewer and committee experience

- Task inbox ordered by deadline and risk.
- Side-by-side evidence, criterion, score/classification, reason, and source rule.
- Completeness and eligibility separated from qualitative recommendation.
- Structured request-for-information that returns only permitted sections to the applicant.
- Meeting workspace with attendance, conflicts, quorum, agenda, dossier, outcome, actions, and minute extract.
- No oversized explanatory paragraphs on dashboards; policy help appears when needed.

### 11.3 Accessibility

Target WCAG 2.2 Level AA:

- Complete keyboard operation and visible focus.
- Semantic headings, labels, tables, dialogs, and status messages.
- Text alternatives for icons and meaningful images.
- Sufficient contrast without relying on color alone.
- Error summary linked to invalid fields.
- Reflow and zoom without overlap or clipped text.
- Accessible document preview with a download alternative.
- Reduced-motion support and no timed task loss.

Reference: [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 12. Clause-to-system traceability register

| ID | Source requirement | Required system behavior | Evidence state |
|---|---|---|---|
| ID-01 | Official staff identity must be reliable | Match account to HRODD staff record; rank/department changes require authorized update | DESIGN_CONTROL |
| GEN-01 | Promotion is distinct from appointment, renewal, confirmation, and office appointment | Store event type and use separate workflows | VERIFIED |
| GEN-02 | Normal progression is immediate next rank | Validate route and explain normal progression | VERIFIED |
| GEN-03 | Senior Member may apply to a rank considered appropriate | Permit exceptional/non-next-rank intake only under approved interpretation | VERIFIED_CONFLICT |
| GEN-04 | Cases received less than six months before retirement may not be processed | Calculate from authoritative retirement date and block/escalate according to approved rule | VERIFIED |
| J-01 | Three independent Schedule J areas | Store separate Teaching, Promotion of Knowledge, and Service assessments | VERIFIED |
| J-02 | Five performance bands | Apply versioned 70/65/55/50 thresholds per area | VERIFIED |
| J-03 | Rank routes have years, outputs, best-N, and assessor rules | Evaluate the exact selected route and show each result | VERIFIED |
| J-04 | HOD forwards within one month | Create acknowledged HOD task with due date and escalation | VERIFIED |
| J-05 | Dean refers within two weeks | Create Dean-routing task with due date | VERIFIED |
| J-06 | FAPC meets at least every two months and forwards within two months | Schedule/monitor committee task and SLA | VERIFIED |
| J-07 | FAPC excludes applicant and below-target-rank members | Recalculate eligible membership and quorum per case | VERIFIED |
| J-08 | FAPC needs at least three eligible members including Dean | Block formal outcome or route to UAPC as policy directs | VERIFIED |
| J-09 | External assessor counts and geography vary by rank | Validate assessor packet before dispatch | VERIFIED |
| J-10 | Applicant receives quarterly updates | Generate status communication at three-month intervals | VERIFIED |
| J-11 | Route deadlines are 6/10/15/18 months | Maintain case deadline, reminders, escalation, and overdue-panel option | VERIFIED |
| J-12 | Effective dates are 1 February/1 August | Calculate from approved submission-window rule and retain explanation | VERIFIED |
| J-13 | Student evaluation evidence may cover five years where available | Import authorized aggregate reports by period | VERIFIED |
| J-14 | Workload scorecard affects performance evidence | Store annual workload evidence without silently replacing Schedule J | VERIFIED_CONFLICT |
| K-01 | Four independent Schedule K areas | Store Ability/Knowledge, Promotion/Application, Human Relations, and Service | VERIFIED |
| K-02 | Promotion uses classification combinations | Evaluate combination rules, not only arithmetic average | VERIFIED |
| K-03 | Profession-specific Ability in Work templates | Select immutable rubric by family and policy version | VERIFIED |
| K-04 | Outputs cannot be reused | Maintain cross-case output-use ledger | VERIFIED |
| K-05 | RAPC forwards within one month | Create RAPC task and SLA | VERIFIED |
| K-06 | UAPC quorum is half and VC presence mandatory | Block formal outcome when invalid | VERIFIED |
| K-07 | Final outcome target is 10-12 months | Track overall SLA and overdue special-panel option | VERIFIED |
| K-08 | Legal/Sports and higher Procurement routes are incomplete | Keep unavailable until approved criteria are configured | CONFIRMATION_REQUIRED |
| SJ-01 | Separate Senior Staff Committee exists | Route only Senior Staff cases to its configured membership | VERIFIED |
| SJ-02 | Separate Junior Staff Committee exists | Route only Junior Staff cases to its configured membership | VERIFIED |
| SJ-03 | Eligibility derives from controlled Unified Schemes | Prevent production activation without scheme version and approval | CONFIRMATION_REQUIRED |
| GOV-01 | Formal committee records include agenda, attendance, quorum, minutes, and actions | Implement meeting workspace and immutable approved record | VERIFIED |
| GOV-02 | Statutory committee minutes are permanent | Archive under permanent retention class | VERIFIED |
| APP-01 | Internal promotion petitions precede Appeals Board | Link UAPC, Council, and Appeals Board cases | VERIFIED |
| APP-02 | Rule 10 gives one month to file | Configure one-month rule pending resolution of Form 1 conflict | VERIFIED_CONFLICT |
| APP-03 | Form 1 note gives fourteen days | Record conflict and prevent hidden hardcoding | VERIFIED_CONFLICT |
| APP-04 | Appeals Board can hear, investigate, and take testimony | Support hearing, witness, submission, and investigation records | VERIFIED |
| APP-05 | Decision and review periods are defined | Create decision, fourteen-day review, and written-ruling deadlines | VERIFIED |
| REC-01 | Promotion record retained to employment end plus six years | Apply case retention event and Archivist-controlled disposition | VERIFIED |
| REC-02 | Staff record access is role-controlled | Apply record classification and object-level authorization | VERIFIED |
| REC-03 | Destruction requires approved disposition | Add legal hold, approval, destruction certificate, and log | VERIFIED |
| SEC-01 | Confidential assessor and committee data needs separation | Stage-scoped access and audit every access/export | DESIGN_CONTROL |
| UX-01 | Users need task clarity | Role-specific dashboard, plain statuses, contextual policy help | DESIGN_CONTROL |
| A11Y-01 | Institutional system should be inclusive | Verify WCAG 2.2 AA across core workflows | DESIGN_CONTROL |

## 13. Policy conflicts and missing decisions register

These issues must be taken to the Registrar/HRODD/Legal Unit or authorized committee. They are not software decisions.

1. Public Basic Laws PDF date, references to 2022 Statutes, and the 2023 public launch need one controlling version and amendment history.
2. Schedule J describes UAPC as final for Senior Lecturer, while committee functions refer Senior Lecturer recommendations to Academic Board.
3. Schedule J says no application may be withheld from FAPC, while later guidance lets HOD/FAPC communicate failure to meet next-stage requirements.
4. Conditions of Service says normal immediate progression but also allows application to any rank for which the person considers themself qualified.
5. The HOD Handbook says final decision lies with Council in one place but later follows rank-dependent UAPC/Council outcomes.
6. The HOD Handbook dossier list mentions two assessor reports, while Senior Lecturer requires one external assessment.
7. Schedule K says four areas but one sentence says five.
8. Schedule K UAPC wording communicates a final outcome, while UAPC functions recommend administrative/professional promotion to Council.
9. Confirm exactly which Schedule K ranks require Council approval, ratification, noting, or no further action.
10. Health's highest published promotion route uses one assessor while the general highest-tier rule indicates two.
11. Legal and Sports lack verified promotion ladders and Ability in Work templates.
12. Procurement lacks a verified highest promotion route in the reviewed section.
13. Professor service allocation appears truncated after University Community equals 50%; confirm the remaining distribution.
14. Schedule J teaching rubric contains unclear wording for the score below Satisfactory.
15. Schedule J and K acting-service duration rules differ; confirm that the difference is intentional.
16. Appeals Rule 10 says one month, but Form 1 notes say fourteen days.
17. The 2024 workload policy states two refereed outputs per year in one place and at least one indexed publication per year in another.
18. Workload scorecard bands do not map directly to Schedule J bands; confirm whether and how they influence promotion.
19. Form 1A's title says promotion while its body and fields describe appointment.
20. Old forms request different hard-copy counts and include apparently copied or outdated fields.
21. Confirm whether raw assessor identity/report is ever disclosed to an applicant during appeal and under what authority.
22. Obtain current Unified Schemes and local GCTU Senior/Junior Staff implementation rules.
23. Confirm all currently approved profession-specific forms, especially ICT, Health, Legal, Sports, and Procurement.
24. Confirm publication-quality verification sources and the approved treatment of discontinued or disputed journal lists.
25. Confirm policy transition rules for cases already in progress when a policy changes.

## 14. Stakeholder validation pack

### 14.1 Registrar and Legal Unit

- Identify the controlling Basic Laws version and all amendments.
- Resolve final authority for every rank route.
- Resolve the Appeals Board one-month versus fourteen-day conflict.
- Confirm electronic dossier, electronic signature, certified-copy, and meeting-record acceptance.
- Confirm applicant access to adverse reasons, external reports, assessor identities, and committee extracts.

### 14.2 HRODD

- Supply authoritative staff, rank, category, organization, appointment, retirement, and employment-status data fields.
- Supply Senior/Junior Unified Schemes, forms, rank mappings, establishment, and pool-promotion rules.
- Confirm who owns completeness, eligibility, policy configuration, and case activation.
- Confirm retention event, legal hold, and staff-exit integration.
- Confirm account activation, institutional email/SSO, delegation, and staff transfer handling.

### 14.3 Academic leadership and Quality Assurance

- Confirm current Form 2A dossier and annual-record requirements.
- Confirm student evaluation report format and five-year availability.
- Resolve how the 2024 workload scorecard affects Schedule J promotion.
- Confirm publication verification, accepted indexing evidence, repository deposit, and predatory-journal review.
- Confirm HOD/Dean substitutions and cognate-Dean practice.

### 14.4 RAPC and professional units

- Approve the profession-to-template map.
- Supply missing/current ICT, Health, Legal, Sports, and Procurement forms.
- Confirm assessor selection and route-specific exceptions.
- Confirm accepted output/implementation evidence and prior-use checks.

### 14.5 University Archivist, Data Protection Supervisor, and ICT

- Approve record classifications and access matrix.
- Approve retention, reappraisal, archival transfer, destruction, and legal-hold workflow.
- Approve hosting, encryption, backup, recovery, monitoring, breach, and processor controls.
- Approve privacy notices and data-subject access/correction procedure.

## 15. Target product modules

1. **Institutional Directory:** staff, category, rank, rank history, organization, office, and employment status.
2. **Policy Registry:** sources, clauses, versions, routes, rubrics, deadlines, authorities, conflicts, and approvals.
3. **Career Portfolio:** qualifications, employment, teaching/work activity, outputs, service, appraisals, and verified evidence.
4. **Case Builder:** route selection, eligibility preview, checklist, declarations, frozen submission, and dossier generation.
5. **Verification Workbench:** identity, rank, qualifications, output, indexing, Library, Department, and completeness checks.
6. **Assessment Engine:** Schedule J areas, Schedule K areas, professional templates, best-N, equivalencies, and explainable outcomes.
7. **External Assessment:** nominations, conflicts, appointment, secure packet, reports, reminders, replacement, and confidentiality.
8. **Workflow and SLA:** tasks, owners, dependencies, acknowledgements, due dates, updates, escalation, and overdue panels.
9. **Committee Workspace:** membership, attendance, rank checks, recusal, quorum, agenda, pack, outcome, minutes, and actions.
10. **Authority and Communication:** UAPC/Academic Board/Council action, result letter, publication, and effective date.
11. **Appeals:** internal petitions, statutory appeal, hearings, decision, correction, and review.
12. **Records and Compliance:** classification, access, audit, retention, hold, archive, disposition, and breach records.
13. **Reporting:** workload, SLA, assessor, committee, route, outcomes, appeals, policy, and compliance reports.
14. **Administration:** controlled configuration, organization import, templates, delegations, and technical operations without decision power.

## 16. Definition of done and acceptance evidence

The rebuilt product should not be described as a full GCTU promotion system until it demonstrates:

1. Every verified Schedule J teaching and research route, including Research Fellow tracks.
2. Every verified Schedule K route and profession template.
3. Safe unavailable states for unverified Legal, Sports, higher Procurement, Senior Staff, and Junior Staff rules.
4. Correct four-, three-, and route-specific year requirements.
5. Best-N publication selection and output equivalencies.
6. Department and Library publication verification.
7. Aggregate teaching-evaluation evidence without raw student disclosure.
8. Annual workload evidence kept distinct from statutory promotion scoring.
9. Retirement cutoff validation from authoritative staff data.
10. Multiple files and evidence items per criterion.
11. Frozen submission and policy snapshot.
12. One and two external-assessor routes with geography checks.
13. Assessor decline, replacement, overdue reminder, and confidential report.
14. HOD, Dean, FAPC, RAPC, and UAPC deadlines.
15. Correct rank-based committee exclusions and substitutions.
16. FAPC and UAPC quorum pass and fail cases.
17. Conflict disclosure and recusal with quorum recalculation.
18. Agenda, pack, approved minute, minute extract, and action matrix.
19. UAPC, Academic Board, and Council route selected from versioned policy.
20. Effective date calculation for both February and August windows.
21. Quarterly academic applicant status updates.
22. Ten-to-twelve-month Schedule K monitoring.
23. Internal petition, Council petition, and Appeals Board case linkage.
24. Appeal extension, hearing, withdrawal, majority, dissent, correction, and review cases.
25. Restricted access to performance, assessor, committee, and appeal records.
26. Denied-access, download, export, score, recommendation, and decision audit records.
27. Retention to employment end plus six years and permanent committee archives.
28. Legal hold and Archivist-approved disposition without silent deletion.
29. Keyboard, screen-reader, zoom/reflow, contrast, and error-handling verification.
30. Applicant usability test showing users can submit without prior verbal training.

## 17. Research boundary and next gate

This research is substantially complete for the public GCTU evidence set. The remaining unknowns are controlled institutional information, not gaps that internet searching can responsibly fill.

Before implementation, conduct one structured validation session using Sections 13 and 14. The minimum attendees should represent HRODD, Registrar/Legal, Academic leadership or Quality Assurance, RAPC/professional units, University Archives/Data Protection, and ICT. Record each answer as a policy decision with owner, source, effective date, and affected routes.

Implementation should then begin with the institutional identity model and policy registry, followed by Schedule J and Schedule K dossiers and workflows. Senior Staff and Junior Staff structures can be prepared, but their eligibility engines must remain inactive until the approved Unified Schemes are supplied.

That is the defensible meaning of a complete system: comprehensive where evidence exists, explicitly blocked where controlling rules are missing, transparent about conflicts, and auditable from source clause to final institutional action.
