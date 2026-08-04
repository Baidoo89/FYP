# Defence Master Guide

## Project identity

- **Title:** Design and Implementation of a Digital Staff Promotion Support System for GCTU
- **Main presenter:** Benjamin Baidoo
- **Student ID:** 4231230141
- **Programme:** BSc Software Engineering / BSc Computer Science
- **Presentation target:** 9-10 minutes, followed by a controlled 4-5 minute demonstration

## The central defence position

The system is a secure, role-based decision-support platform for GCTU's academic staff promotion process. It digitises application submission, evidence management, department review, HR verification, rule-based eligibility support, committee recommendation, final-decision recording, notifications, reporting, and audit history.

It does **not** automatically promote a lecturer. It supports authorised officers with complete, consistent, and traceable information while leaving qualitative assessment and final authority with the university.

## 45-second opening

> Good morning. My name is Benjamin Baidoo, and I am presenting the Design and Implementation of a Digital Staff Promotion Support System for GCTU. The study addressed three connected problems in the largely manual process: fragmented evidence, slow and inconsistent routing, and limited visibility into application status. I developed a web-based platform that gives each authorised role a controlled workspace, verifies evidence before rule-based eligibility support is calculated, and records every important action in a status and audit history. The system is not an automatic promotion engine. It standardises and supports the process while the HOD or Dean, HR, the committee, and the institutional authority retain their proper decision-making responsibilities.

Pause. Make eye contact. Then move directly to the problem slide.

## Ten-minute presentation script

### Slide 1 - Title (0:00-0:30)

Say the project title, your name, and one sentence of scope:

> This project focuses on academic staff promotion support, from digital evidence submission to the recording of the authorised final outcome.

Do not read the whole title slide.

### Slide 2 - Problem and motivation (0:30-1:20)

> The existing process depends heavily on physical or fragmented records. This makes evidence difficult to trace, creates avoidable delays between offices, and gives applicants little visibility into progress. It also makes it harder to reconstruct who reviewed what and when. Therefore, the research problem was not simply the absence of a website; it was the absence of a consistent, secure, and auditable workflow.

Emphasise: delay, fragmented evidence, limited status visibility, weak auditability.

### Slide 3 - Aim and objectives (1:20-2:05)

> The aim was to design and implement a digital support system adapted to GCTU's promotion process. The objectives covered process analysis, workflow design, centralised data management, role-based access, rule-based eligibility support, and transparency through tracking and reporting. All six objectives were achieved; the eligibility objective was achieved within the declared prototype scope because the score checks verified evidence completeness, not qualitative academic merit.

### Slide 4 - Method and requirements (2:05-2:55)

> I used a prototyping methodology because some requirements were institutional and became clearer through repeated implementation and review. Requirements were derived from the study, GCTU policy documents, and the responsibilities of the main actors. The cycle was requirements analysis, interface and data modelling, implementation, testing, and refinement. This approach was useful because a real scoring defect was discovered only when the complete running workflow was tested.

If asked about data collection, use the exact sample figures already stated in Chapter 3. Do not invent participant numbers.

### Slide 5 - Architecture and security (2:55-3:50)

> The solution uses Next.js and TypeScript for the web application and server-side API, Prisma for controlled database access, and PostgreSQL for persistent records and uploaded PDF binaries. Authentication creates an HTTP-only role session. Authorisation is enforced again on the server for every protected operation, so hiding a button is not the security mechanism. Passwords are hashed, role and organisational scope restrict access, validation is applied to requests, and significant actions are written to the audit log.

Use the architecture diagram. Point only to the presentation layer, application/API layer, and database layer.

### Slide 6 - Workflow and governance (3:50-4:55)

> A lecturer prepares and submits an application. The relevant HOD performs the department review and forwards it to HR. HR verifies the evidence; only verified evidence enters the eligibility calculation. An eligible case is routed to the committee for recommendation. HR then records the decision of the institutional authority and closes the workflow. In the prototype, HOD and Dean share one technical role and workspace, but accounts are separately scoped: an HOD is restricted to a department while a Dean is restricted to a faculty. A full institutional deployment can therefore create up to fourteen HOD and three Dean officeholder accounts without creating seventeen different software roles.

Important limitation:

> The prototype represents department/faculty academic review as one combined stage. A future production version should model HOD and Dean as two explicit sequential stages before the faculty committee.

### Slide 7 - Eligibility support (4:55-5:55)

> The engine checks the configured minimum years in rank and six required evidence categories. For the core completeness score, verified Teaching contributes 40 percent, Research 40 percent, and Service 20 percent. A Criteria Score of 100 means all required core evidence categories are verified. It does not mean the lecturer's academic work was graded 100 percent, and it does not grant promotion. Qualifications, publications, and professional development are mandatory completeness gates, while human reviewers assess quality and institutional suitability.

Never call the Criteria Score a performance score or a promotion score.

### Slide 8 - Implemented system (5:55-6:45)

> The implemented interfaces are role-specific. Lecturers can prepare evidence and track feedback; HODs and Deans receive only applications within their organisational scope; HR manages verification and final recording; committee reviewers record recommendations; and System Administrators manage users, structure, criteria, and settings. The queue uses search, filtering, clear status labels, and a list-detail workflow so users are not required to understand the internal process before completing a normal task.

Allow the screenshots to carry the proof. Do not describe every button.

### Slide 9 - Testing and results (6:45-7:45)

> Verification included 36 formal functional and integration test cases, TypeScript checking, a production build, database health checking, a full browser workflow, and responsive checks at desktop and mobile widths. The most important result was the discovery that the initial eligibility implementation could produce a zero score despite verified evidence. End-to-end testing exposed the mismatch, and the engine was corrected to calculate directly from verified document categories. This demonstrates why testing the complete operational workflow was necessary.

### Slide 10 - Limitations and future work (7:45-8:45)

> The main limitations are that eligibility measures completeness rather than qualitative academic merit; the HOD and Dean are combined into one prototype review stage; Schedule K for administrative and professional staff is not implemented; criteria history is not versioned; and formal real-user UAT was prepared but not completed. Future work should add the full statutory routing, configurable qualitative assessment, criteria versioning, Schedule K, institutional single sign-on, staff-record integration, and formal user evaluation.

State limitations calmly. Acknowledging a boundary is stronger than defending something the prototype does not do.

### Slide 11 - Conclusion and demo transition (8:45-9:30)

> In conclusion, the project demonstrates that GCTU's promotion process can be represented as a secure, centralised, and auditable digital workflow. The main contribution is the localisation of role scope, evidence verification, criteria support, and traceability to GCTU's institutional context. The system supports decisions; it does not replace decision-makers. I will now demonstrate the completed audit trail and the controlled role-based workflow using Benjamin Baidoo's representative defence record.

Stop. Do not add a second conclusion.

## High-probability examiner questions

**What exactly is the contribution of the project?**

The contribution is a working, GCTU-adapted workflow that combines organisationally scoped RBAC, centralised evidence, verification-gated eligibility support, notifications, status history, and audit logging. The individual technologies are established; the value lies in their integration and localisation to the university process.

**Is this a promotion system or a lecturer performance system?**

The implemented and documented system is a Digital Staff Promotion Support System. The repository name is an earlier development label. The final scope is promotion workflow and eligibility decision support, not continuous lecturer performance appraisal.

**Does the software decide who is promoted?**

No. It checks configured, objective preconditions from verified evidence and produces an eligibility support result. The committee recommends and the institutional authority decides.

**Does a Criteria Score of 100 mean excellent performance?**

No. It means the required core evidence categories used by the prototype's completeness calculation were verified. It is intentionally displayed separately from eligibility and from the final decision.

**Why are Teaching and Research 40 each and Service 20?**

Those are configurable prototype weights used to demonstrate rule-based completeness scoring. They are not presented as a complete qualitative implementation of every rating in GCTU's policy. A production rollout must validate and approve the configured model with the university.

**Why are qualifications, publications, and professional development required but not directly weighted?**

They operate as mandatory evidence gates. The score summarises verified core areas, while eligibility also requires every configured category and the minimum years in rank. Their academic quality remains a human-review responsibility.

**Why is a document still Pending after the application is Submitted?**

Those are two different states. Submitted is the application workflow state. Pending is the document verification state. The documents should remain Pending until HR checks them; submission must never silently mark evidence as verified.

**Why did you combine HOD and Dean?**

The prototype uses one technical `HOD_DEAN` role because both use the same academic-review permissions and interface. Account scope distinguishes the offices: HOD by department, Dean by faculty. The limitation is that the current workflow has one combined review stage; a statutory production workflow should route HOD then Dean as separate stages.

**How many HOD and Dean accounts are required?**

The software needs one account per current officeholder, not one account per technical role. With the verified structure represented in the project, a full setup can have fourteen HOD accounts and three Dean accounts. The seeded defence setup intentionally includes one Computer Science HOD and one FoCIS Dean.

**Why does HR record the final decision?**

The prototype does not model the institutional authority as a separate login. The committee records a recommendation; HR acts as the authorised record keeper for the authority's outcome. These are deliberately separate workflow events.

**Why use the prototyping methodology?**

The process included tacit workflow and policy interpretation that benefited from repeated user-interface and rules refinement. The eligibility defect found in the running end-to-end workflow is concrete evidence that iteration improved correctness.

**What security controls are implemented?**

Hashed passwords, HTTP-only sessions, server-side role checks, department/faculty scope checks, request validation, protected document retrieval, database-backed PDF storage, and audit logging. Client-side visibility is for usability; server-side checks enforce security.

**Why store PDFs in the database?**

It keeps evidence under the same access-controlled data boundary and avoids publicly addressable upload folders. The trade-off is database growth, so production should use retention rules, backups, size limits, malware scanning, and possibly private object storage with equivalent authorisation.

**What happens when evidence is wrong?**

HR can reject it or request correction with a comment. The application returns to the lecturer, the affected evidence can be replaced, and the application must be resubmitted. The action is retained in history and audit records.

**How was the system tested?**

The report records 36 functional and integration tests, TypeScript checking, production build verification, database health checking, end-to-end browser testing, and desktop/mobile checks. The complete workflow test found and drove correction of the zero-score defect.

**Did you perform user acceptance testing?**

UAT tasks and feedback materials were prepared, but a formal exercise with real institutional users was not completed at the time of submission. This is disclosed as a limitation and is the next validation step before production adoption.

**What is not implemented?**

Full qualitative Schedule J scoring, Schedule K, separate sequential HOD and Dean stages, criteria version history, institutional SSO/staff database integration, and completed formal UAT.

**What would you improve first?**

First, validate the workflow and criteria with HR and faculty officers through formal UAT. Second, separate HOD and Dean into sequential stages. Third, version criteria so each application remains tied to the rules in force when it was submitted.

**Can users bypass the interface and call an API directly?**

A direct request still passes server-side authentication, role, ownership, scope, and workflow-transition checks. Interface controls alone are not trusted.

**What makes the system usable without training?**

Role-specific dashboards, a single next-action workflow, plain status labels, required-category indicators, validation messages, filters, document preview, and visible feedback. Help content exists, but normal tasks should be discoverable from the screen itself.

**What is the meaning of an Eligible result?**

The applicant meets the configured years-in-rank and verified-evidence conditions within prototype scope. It means the case may proceed to human review, not that promotion is guaranteed.

## Claims to avoid

Do not say:

- "The system automatically promotes qualified lecturers."
- "A score of 100 means excellent performance."
- "The complete Schedule J and Schedule K policies are implemented."
- "HOD and Dean are already separate sequential workflow stages."
- "Formal user acceptance testing was completed" unless real signed results are available.
- "The application is live on Vercel" unless that deployment has been verified immediately before the defence.
- "All uploaded files are automatically genuine." HR verifies them; the prototype does not perform forensic document authentication.

Prefer:

- "decision-support system"
- "criteria completeness score"
- "representative defence data"
- "server-enforced role and organisational scope"
- "committee recommendation"
- "institutional authority decision recorded by HR"

## Closing answer when challenged

Use this structure:

1. Answer the exact question in one sentence.
2. Point to the implemented evidence.
3. State the limitation, if any.
4. Give the next production step.

Example:

> No, the score is not a quality grade. The implemented engine derives it from HR-verified core evidence and shows eligibility separately. Qualitative policy ratings remain outside this prototype, and the next step is to configure and validate them with GCTU before production adoption.
