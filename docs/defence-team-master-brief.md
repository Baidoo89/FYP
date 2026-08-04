# How to Use This Handbook

This handbook is the shared defence reference for the project team. It summarises the approved final report, explains the implemented software, identifies the exact claims the evidence supports, and gives consistent answers to likely examiner questions.

Read it in three passes:

1. Read Sections 1-3 to understand the project story and Chapters 1-2.
2. Read Sections 4-8 to understand the methodology, software, testing, and conclusions.
3. Memorise Sections 9-13 before the defence and use the demonstration runbook during rehearsal.

Every team member should be able to explain the problem, aim, methodology, workflow, eligibility boundary, testing evidence, limitations, and contribution without depending on the main presenter.

## Project Identity

- Project title: Design and Implementation of a Digital Staff Promotion Support System for GCTU
- Main presenter: Benjamin Baidoo, 4231230141
- Project team: Success Joy Likem Hayibor, 4231230154; Benjamin Baidoo, 4231230141; Esther Appiah, 4231231237
- Institution: Ghana Communication Technology University
- Programme: BSc Software Engineering / BSc Computer Science
- Final report: 143 pages, 17 tables, and 27 figures
- Software repository: Baidoo89/FYP, main branch
- Verified local system: http://localhost:3000

## Five Non-Negotiable Truths

1. The software is a decision-support system, not an automatic promotion authority.
2. A Criteria Score of 100/100 means verified core evidence completeness, not academic quality and not automatic promotion.
3. Application status and document verification status are separate. A Submitted application can correctly contain Pending documents until HR verifies them.
4. HOD and Dean share one technical permission set in the prototype, but their accounts have different scopes: HOD by department and Dean by faculty. Separate sequential HOD-then-Dean routing is future work.
5. The system was tested with representative data. Formal real-user UAT and policy validation are still required before operational deployment.

# 1. Executive Summary

GCTU's staff promotion process is formal but largely document-driven. Applicants prepare extensive evidence, including qualifications, publications, teaching records, research records, service records, and professional-development documents. The application then moves through academic and administrative offices before a recommendation and final institutional outcome are recorded.

The study identified recurring weaknesses in this largely manual process: heavy dependence on physical documents, slow movement between offices, limited visibility into application status, delayed feedback, inconsistent evidence checking, difficulty producing reports, and weak auditability. Sensitive promotion information may also be exposed to loss, duplication, unauthorised access, or unclear responsibility when records are scattered.

The project responds with a web-based Digital Staff Promotion Support System. It creates one controlled record for the complete promotion process. A lecturer prepares an application and uploads evidence; the appropriate academic reviewer performs the departmental review; HR verifies each document; a rule-based engine checks configured eligibility conditions; the committee records a recommendation; HR records the authorised institutional outcome; and the application is closed with a complete status and audit history.

The system has five technical roles: Lecturer, HOD/Dean, HR Administrator, Committee Reviewer, and System Administrator. Role and organisational scope are resolved from the authenticated account, not chosen by the user. Important actions are protected by server-side rules, and uploaded PDF evidence is stored behind authenticated access.

The eligibility engine checks objective, rule-based conditions from verified evidence. It does not judge the academic quality of teaching, research, publications, or service. It does not replace the HOD, Dean, promotion committees, or institutional authority. Its purpose is to make the mechanical, repeatable part of eligibility checking more consistent and explainable.

The completed prototype was verified through 36 formal functional and integration test cases, TypeScript checking, production compilation, database-health checks, role and scope tests, responsive checks, and a complete browser workflow. End-to-end testing found a real defect in the first eligibility implementation: verified applications incorrectly received a score of zero because the calculation depended on a Score table that the workflow did not populate. The engine was corrected to calculate directly from HR-verified document categories.

The central conclusion is that GCTU can improve transparency, accountability, efficiency, and traceability by digitising promotion workflow without transferring statutory decision-making authority to software.

## One-Sentence Explanation

The system securely coordinates promotion evidence, role-based review, verification, decision support, feedback, reporting, and audit history while leaving the real promotion decision with GCTU's authorised human bodies.

## One-Minute Explanation

GCTU's promotion process requires sensitive evidence to move through several reviewers, but manual documents and routing can cause delay, weak visibility, inconsistent checking, and limited auditability. We designed a Digital Staff Promotion Support System that gives each authorised role a controlled workspace. Lecturers submit applications and evidence, HODs or Deans review cases within their organisational scope, HR verifies documents, the system checks configured eligibility conditions, the committee records a recommendation, and HR records the final institutional outcome. Every major action is traceable. The system does not automatically promote staff; it standardises the process and supports the university's decision-makers with verified, structured information.

# 2. Chapter One: Introduction

## 2.1 Background

Staff promotion affects motivation, career progression, retention, institutional productivity, and confidence in university governance. A credible promotion process must combine clear requirements, reliable evidence, consistent review, timely feedback, confidentiality, and accountability.

Digital HR systems can improve these conditions by centralising records, enforcing responsibilities, automating routine routing, and making status information visible. However, a useful system must reflect the institution's actual roles and rules rather than simply copying a generic HR product.

The project therefore focuses on GCTU's institutional environment and treats promotion as a multi-stage evidence and decision workflow, not as a single score or approval button.

## 2.2 Problem Statement

The approved report identifies these connected problems:

- promotion applications depend heavily on physical or manually compiled evidence;
- documents may be misplaced, duplicated, damaged, delayed, or inconsistently filed;
- applications move slowly between departments and administrative offices;
- applicants have limited real-time visibility into where their cases are;
- feedback can be delayed or difficult to trace;
- reviewers may interpret or apply criteria inconsistently;
- reports and historical records are difficult to produce quickly;
- it may be unclear who verified a document or changed an application status;
- sensitive staff information requires stronger access control and accountability.

The research problem is therefore an information-flow and governance problem, not merely the absence of a website.

## 2.3 Aim

The approved aim is to design and implement a Digital Staff Promotion Support System for GCTU that improves the efficiency, transparency, accountability, and objectivity of the staff promotion process.

## 2.4 Six Objectives

1. Examine the operational bottlenecks and limitations of the existing manual promotion process.
2. Design a standardised digital workflow for submission, evidence upload, verification, tracking, and reporting.
3. Develop a secure centralised database for profiles, requests, evidence, verification, eligibility, and audit records.
4. Implement role-based access control for lecturers, HR/Admin, HODs/Deans, reviewers, and system administrators.
5. Develop a rule-based eligibility support engine that checks verified evidence against configured institutional criteria.
6. Improve transparency and accountability through real-time tracking, structured feedback, reporting, and audit logging.

Chapter Five concludes that all six objectives were achieved. Five were fully achieved; Objective 5 was achieved within the declared prototype boundary because the engine checks completeness and configured rules rather than performing the university's full qualitative academic assessment.

## 2.5 Five Research Questions

1. What operational bottlenecks and data-security risks exist in GCTU's traditional promotion framework?
2. What HR and software-engineering factors influence successful digital promotion systems?
3. How can digital technology and automated evaluation improve reliability and objectivity?
4. What functional requirements and modules should a modern GCTU promotion system include?
5. How can automation and real-time tracking improve transparency and institutional accountability?

## 2.6 Significance

The project is significant to:

- GCTU management, because it provides better visibility, reporting, governance, and evidence for process improvement;
- the HR Directorate, because it centralises records, verification, status management, and final recording;
- academic staff, because it improves submission, feedback, status tracking, and clarity of responsibility;
- software-engineering practice, because it demonstrates RBAC, workflow state management, evidence protection, and decision support in a real institutional domain;
- future researchers, because it provides a localised foundation for studying promotion workflow, digital HR, adoption, fairness, and policy implementation.

## 2.7 Scope

The implemented scope covers:

- secure registration, authentication, onboarding, and account management;
- lecturer profiles and promotion-request creation;
- PDF evidence upload by required category;
- academic review and feedback;
- HR evidence verification or return for correction;
- rule-based eligibility recommendation;
- committee comments and recommendation;
- recording of the institutional authority's outcome;
- status tracking and notifications;
- audit logging and status history;
- analytics and CSV/PDF reporting;
- configuration of rank-transition criteria;
- management of users, faculties, departments, and settings.

## 2.8 Delimitations and Boundaries

The study deliberately does not allow software to grant promotion. It supports the process and records authorised decisions. The demonstrated pathway focuses on academic promotion scenarios under selected Schedule J concepts. Full Schedule K coverage for administrative and professional staff is outside the prototype.

The prototype combines HOD and Dean academic review into one technical role and one workflow stage. It supports separately scoped HOD and Dean accounts, but it does not yet reproduce the complete statutory sequence of HOD assessment, Dean referral, Faculty Appointments and Promotions Sub-Committee review, and University Appointments and Promotions Committee decision.

## 2.9 Initial Study Limitations

The report recognises that the prototype uses representative data rather than real promotion records, needs institutional validation before operational use, and is not integrated with GCTU's official staff database or single sign-on. These boundaries protect sensitive information and keep the project within its approved academic scope.

# 3. Chapter Two: Literature Review

## 3.1 Purpose of the Literature Review

Chapter Two establishes that staff promotion is simultaneously an HR, document-management, workflow, security, fairness, and decision-support problem. It reviews theories, prior research, institutional procedures, and existing digital products to justify the proposed design.

## 3.2 Main Concepts

### Staff Promotion

Promotion is advancement to a higher rank based on institutional requirements, evidence, experience, performance, contribution, and authorised review. In a university, the evidence can include teaching, research or promotion of knowledge, service, qualifications, publications, professional development, and years in rank.

### Electronic Human Resource Management

e-HRM applies digital systems to HR activities such as records, workflow, communication, monitoring, reporting, and decision support. The literature shows that digital HR systems are valuable when they support the actual organisational process instead of operating only as electronic filing cabinets.

### Workflow Automation

Workflow automation structures how work moves between responsible roles. In this project it controls submission, academic review, HR verification, committee recommendation, final recording, return for correction, and further review. Its value is clearer ownership, fewer manual hand-offs, faster communication, and visible progress.

### Digital Document Management

Promotion depends on evidence. Digital document management centralises files, metadata, status, retrieval, and access. It reduces loss and duplication while supporting verification history. Digital storage alone is not enough; evidence must remain protected and linked to the correct application and category.

### Role-Based Access Control

RBAC assigns permissions according to institutional responsibility. A lecturer can upload evidence but cannot verify it. HR can verify evidence but does not make the committee recommendation. A committee reviewer recommends but does not record the final authority's decision. System Admin configures the platform but does not become the applicant. This separation protects confidentiality, integrity, accountability, and fairness.

### Decision Support Systems

A decision-support system provides structured information, rules, comparisons, reports, and recommendations to help human decision-makers. It does not necessarily make the decision. In this project, the engine checks repeatable, configured eligibility conditions from verified evidence and produces an explainable recommendation for authorised reviewers.

## 3.3 Theoretical Framework

### Expectancy Theory

Vroom's Expectancy Theory links effort, performance, and valued outcomes. Staff are more likely to trust and engage with promotion when requirements are understandable, evidence is fairly considered, and progress is visible. The system supports this through clear categories, feedback, and status tracking.

### Adams' Equity Theory

Equity Theory concerns perceived fairness between inputs and outcomes. Promotion applicants compare qualifications, experience, teaching, research, service, and recognition. The system supports procedural fairness by using the same workflow, role separation, verification process, criteria checks, and audit trail for applications.

### Reinforcement Theory

Reinforcement Theory explains how feedback influences behaviour. Timely document statuses and correction comments tell applicants what is accepted, missing, or wrong. This encourages complete, accurate preparation and reduces uncertainty.

### Technology Acceptance Model

TAM states that adoption depends strongly on perceived usefulness and ease of use. The platform must therefore be relevant to each role, simple enough for normal tasks, and clear about the next action. Role-specific dashboards, searchable queues, status labels, document previews, and responsive navigation support this goal.

### Combined Relevance

The four theories connect the human and technical sides of the project:

- Expectancy supports clear requirements and visible progress.
- Equity supports consistency, role separation, and traceability.
- Reinforcement supports timely feedback and correction cycles.
- TAM supports usability and practical adoption.

## 3.4 Existing Systems and Processes Reviewed

The report reviews GCTU's current promotion process and compares it with the University of Ghana process and established products such as Interfolio, Watermark Faculty Success, Workday HCM, and Oracle HCM.

The commercial products demonstrate mature document, faculty, or HR capabilities, but they are broad platforms, may be costly, and are not automatically aligned with GCTU's exact roles, evidence categories, criteria, and statutory process. The University of Ghana example demonstrates that local universities have formal promotion structures, but it does not provide a ready-made GCTU implementation.

## 3.5 Research Gap

The identified gap is not the total absence of HR or faculty systems. It is the absence of a localised platform that combines:

- GCTU-specific organisational structure and role scope;
- digital application and evidence management;
- verification separate from upload;
- validated workflow states;
- rule-based eligibility support from verified evidence;
- committee recommendation separate from final authority recording;
- real-time tracking, notifications, reporting, and auditability.

The project fills this gap at prototype level.

## 3.6 Conceptual Framework

The report's conceptual framework can be remembered as Input, Process, Output.

Inputs include users, staff profiles, promotion applications, evidence, institutional criteria, rank, years in rank, and organisational structure.

Processes include authentication, upload, academic review, HR verification, eligibility checking, committee review, notification, reporting, and audit logging.

Outputs include document statuses, application status, eligibility recommendation, committee recommendation, final recorded outcome, reports, notifications, and traceable history.

# 4. Chapter Three: System Methodology

## 4.1 Research Design

The project uses an applied design-and-development research approach supported by qualitative requirement gathering.

It is applied research because it addresses a practical institutional problem. It is design and development research because its output is a functioning software system. The qualitative element is used to understand roles, documents, workflow stages, challenges, and expected features that cannot be captured by numerical data alone.

## 4.2 Development Methodology

The selected software-development methodology is the Prototyping Model. It allows the team to create an initial system, review it, receive feedback, refine requirements, correct defects, and test the improved version.

The approved stages are:

1. Requirement gathering.
2. System analysis.
3. Initial system design.
4. Prototype development.
5. User review and feedback.
6. System refinement.
7. Testing and evaluation.

Prototyping fits the project because workflow, dashboard, evidence, verification, and eligibility details become clearer when users or stakeholders can interact with a working version. The corrected eligibility defect is practical evidence that iteration was useful.

## 4.3 Population

The population comprises people directly or indirectly involved in promotion:

- academic staff;
- HR personnel;
- Heads of Department;
- Deans;
- administrative officers;
- committee reviewers;
- system administrators.

These groups represent the applicant, academic-review, administrative-verification, committee, governance, and technical perspectives needed for requirement analysis.

## 4.4 Sample and Sampling

The study uses purposive sampling. Participants are selected because they possess relevant knowledge, experience, or institutional responsibility. The stated sample categories include selected lecturers, HR officers, HODs, Deans, academic administrators, and technical users.

Important defence note: the approved report does not state a numeric sample size. No team member should invent a number. If asked, say:

> The study used purposive qualitative sampling across the stakeholder categories named in Chapter Three. The approved report does not specify a numeric participant count, which we acknowledge as a reporting limitation; requirements were also cross-checked against official institutional documents and the implemented workflow.

## 4.5 Data Collection Methods

The four methods are:

- Interviews, to understand experiences, responsibilities, problems, required evidence, and expected features.
- Observation, to understand document preparation, movement, checking, review, feedback, delays, and duplicated manual activities.
- Document review, covering GCTU promotion forms, Basic Laws, Conditions of Service, Administrative Procedures Manual, HR documents, and the Heads of Academic Departments Handbook.
- Online research, covering comparable academic-promotion and HR platforms.

Using multiple methods reduces dependence on one person's opinion and improves requirement quality.

## 4.6 Data Collection Instruments

The instruments are:

- interview guide;
- observation checklist;
- document-analysis checklist;
- system-requirement checklist.

They help gather similar categories of information systematically and make the analysis repeatable.

## 4.7 Validity and Reliability

Validity is supported through triangulation: information from interviews, observation, and document review is compared with official GCTU documents.

Reliability is supported by structured instruments, a consistent requirement process, iterative prototyping, and system testing. The argument is that the design was not based only on assumptions or on one source.

## 4.8 Existing Process Analysis

The analysed manual process contains these stages:

1. Document preparation.
2. Submission.
3. Departmental review.
4. Faculty or directorate review.
5. Registrar or HR processing.
6. Committee review.
7. Feedback.

Its main weaknesses are limited status visibility, physical-document dependence, slow file movement, weak audit trails, manual verification, inconsistent criteria application, difficulty generating reports, limited historical storage, and delayed feedback.

## 4.9 Proposed System

The proposed system centralises the application, gives each role a controlled workspace, and records every meaningful transition. It aims to preserve the official process while making evidence and responsibility easier to manage.

## 4.10 Functional Requirements

The system should:

- register, authenticate, verify, and onboard users securely;
- create and manage lecturer profiles;
- create and track promotion requests;
- upload evidence by category;
- preview and protect uploaded PDFs;
- allow HOD/Dean academic review and feedback;
- allow HR verification, rejection, or correction requests;
- calculate eligibility only after required verification;
- allow committee comments and recommendation;
- record authority outcomes and complete workflows;
- send notifications;
- maintain status and audit history;
- generate reports and analytics;
- manage users, structure, criteria, and settings.

## 4.11 Non-Functional Requirements

- Security: protect accounts, routes, records, and files.
- Usability: make normal tasks clear and responsive.
- Scalability: support growth in users, departments, records, and evidence.
- Reliability: preserve correct workflow and data.
- Maintainability: use modular, typed code and database migrations.
- Performance: provide reasonable response and queue access.
- Data integrity: prevent invalid relationships, unauthorised changes, and impossible status transitions.

## 4.12 Architecture

The design uses three main layers:

- Presentation layer: role-specific React interfaces and responsive navigation.
- Application layer: Next.js server APIs, authentication, RBAC, workflow service, validation, eligibility, notifications, audit, analytics, and reporting.
- Data layer: Prisma ORM and PostgreSQL for structured records and protected PDF binary data.

## 4.13 Role Design

Lecturer responsibilities are application preparation, evidence upload, submission, correction, and tracking. Lecturers cannot verify their own evidence, enter final scores, approve applications, or change criteria.

HOD/Dean responsibilities are scoped academic review, comments, return or forwarding, and recommendation for the next stage.

HR responsibilities are institution-wide request management, evidence verification, correction requests, eligibility review, reporting, audit access, final-authority recording, and close-out.

Committee responsibilities are reviewing verified applications and recording Recommended, Not Recommended, or Requires Further Review with justification.

System Admin responsibilities are accounts, roles, faculty and department structure, criteria, settings, and governance monitoring.

## 4.14 Database Design

The important entities are User, Faculty, Department, PromotionRequest, Document, Verification, PromotionCriteria, ReviewComment, StatusHistory, Notification, AuditLog, and SystemSetting.

A PromotionRequest belongs to a lecturer and contains evidence, reviews, history, notifications, and audit records. A Document has both an upload record and verification state. Verification records preserve who made the decision and when. StatusHistory preserves workflow movement; AuditLog records important actions across the system.

The schema still contains a Score entity from the earlier design, but the corrected eligibility engine no longer depends on it. Chapter Five identifies removal or repurposing of that entity as future database cleanup.

## 4.15 Security Design

The approved security measures include authentication, password hashing, RBAC, protected routes, server-side validation, file-type validation, protected evidence retrieval, server-side eligibility calculation, session management, restricted permissions, scope enforcement, and audit logging.

The defence-safe explanation is:

> The interface may hide actions for usability, but security is enforced on the server through authentication, role, ownership, organisational scope, validation, and legal workflow-transition checks.

## 4.16 Testing and Ethics Plan

Chapter Three proposes unit, integration, user-acceptance, security, and usability testing. Chapter Four documents what was actually completed and what remained open.

Ethically, the project protects sensitive promotion information, avoids real personnel data in the prototype, limits access by role, and preserves accountability. Representative defence data must always be described as synthetic, not as an official GCTU record.
# 5. Chapter Four: System Design and Implementation

## 5.1 Design Models

Chapter Four presents the system at several levels:

- system architecture shows the presentation, application, and data layers;
- the component diagram shows the major modules and dependencies;
- the ERD shows the database entities and relationships;
- the workflow state diagram shows valid application states and transitions;
- the use-case diagram shows actors inside the system boundary;
- activity diagrams show the lecturer, HOD/Dean, HR, committee, and overall processes;
- sequence diagrams show submission routing, eligibility calculation, and committee/final recording interactions;
- the deployment diagram shows the intended hosting, database, DNS, email, and client relationship.

In a defence, diagrams should be used to explain a decision, not merely named. For example, the ERD proves traceability because PromotionRequest connects to Document, Verification, ReviewComment, StatusHistory, and AuditLog.

## 5.2 Current Technology Stack

- Frontend: Next.js 15, React 18, TypeScript, Tailwind CSS, and reusable interface components.
- Backend: Next.js route handlers and server-side workflow services.
- Validation: Zod and server-side business-rule validation.
- Authentication: hashed passwords and an HTTP-only role session.
- Data access: Prisma ORM 6.
- Database: PostgreSQL.
- Evidence generation and handling: PDF-Lib and protected PDF endpoints.
- Icons and interaction: Lucide React and Framer Motion where appropriate.
- Reporting and analytics: server queries with CSV/PDF export support.
- Source control: Git and GitHub.

The verified defence build generates 69 application and API routes.

## 5.3 Five Technical Roles

### Lecturer

The lecturer registers with an official email, completes onboarding, creates an application, chooses the current and target rank, records years in rank, uploads required evidence, submits, responds to corrections, reads feedback, and tracks the status.

### HOD/Dean

The prototype uses one technical `HOD_DEAN` role because both offices use the same academic-review permission set and workspace. Account scope differentiates them:

- HOD account: one faculty or school plus one department;
- Dean account: one faculty or school and no department.

The System Admin prevents two active HODs for the same department or two active Deans for the same faculty. A full setup for the represented structure can therefore require fourteen HOD accounts and three Dean accounts, even though there is only one technical HOD/Dean software role.

### HR Administrator

HR sees the institution-wide workflow, verifies or returns evidence, reviews eligibility results, produces reports, records the authority's final decision, and completes the workflow. HR is the record keeper for the final authority in this prototype; HR is not represented as the authority that independently decides promotion.

### Committee Reviewer

The committee sees applications routed for committee review, examines the verified dossier, adds a comment, and records Recommended, Not Recommended, or Requires Further Review. A recommendation is not final approval.

### System Administrator

System Admin creates and manages role accounts, enforces account-scope rules, manages faculties and departments, configures criteria, maintains system settings, and reviews governance information. System Admin is not a replacement for HR or the promotion committee.

## 5.4 Organisational Structure in the System

The verified seed contains three faculties or schools and fourteen departments.

Faculty of Computing and Information Systems:

- Mobile & Pervasive Computing
- Information Systems
- Computer Science
- Information Technology
- General Studies

Faculty of Engineering:

- Electrical and Electronics Engineering
- Computer Engineering
- Telecommunications Engineering
- Mathematics and Statistics

GCTU Business School:

- Procurement, Logistics and Supply Chain Management
- Management Studies
- Accounting, Banking and Finance
- Marketing
- Economics

The defence scenario uses Benjamin Baidoo in Computer Science, a Computer Science HOD account, and a FoCIS Dean account.

## 5.5 Complete Workflow

### Stage 1: Draft

The lecturer creates the application and uploads evidence. Evidence can be changed while the request is a Draft.

### Stage 2: Submitted

Submission confirms that all configured required evidence categories have an uploaded record. The application is now routed to academic review. The documents remain Pending because submission does not equal verification.

### Stage 3: Academic Review

The appropriate scoped HOD or Dean checks the dossier's academic relevance and completeness, adds a comment, and forwards it to HR or returns it for correction. The current prototype represents this as one combined academic-review stage.

### Stage 4: HR Verification

HR previews each protected PDF and records Verified, Rejected, or Requires Correction. Only HR-verified evidence is used in eligibility calculation. A rejected or correction-required item returns the application to the lecturer.

### Stage 5: Eligibility Routing

When every required category is verified, the server calculates the criteria result. An eligible case advances to Committee Review. A case that fails a rule is routed to Requires Further Review rather than being automatically promoted or silently discarded.

### Stage 6: Committee Review

The committee examines the verified record and submits a recommendation with a reason.

### Stage 7: Authority Outcome

For a recommended case, HR records the authorised institutional approval. The authority is deliberately distinct from the committee recommendation.

### Stage 8: Completed

HR closes the administrative workflow. The application, evidence decisions, comments, timestamps, history, and audit records remain available.

## 5.6 Important Application Statuses

- DRAFT: applicant is still preparing the record.
- SUBMITTED: applicant has formally submitted.
- UNDER_DEPARTMENT_REVIEW: academic review is active.
- RETURNED_FOR_CORRECTION: applicant must correct evidence or information.
- UNDER_HR_VERIFICATION: HR is verifying evidence.
- UNDER_COMMITTEE_REVIEW: eligible/verified case is with the committee.
- REQUIRES_FURTHER_REVIEW: a reviewer must reconsider or clarify the case.
- RECOMMENDED: committee recommends onward approval.
- NOT_RECOMMENDED: committee does not recommend.
- APPROVED_BY_AUTHORITY: authorised final outcome has been recorded.
- COMPLETED: administrative workflow is closed.

The system validates which role may create each transition. An invalid direct status change is rejected by the server.

## 5.7 Document Verification Statuses

- PENDING: uploaded but not yet decided by HR.
- VERIFIED: accepted for rule-based calculation.
- REJECTED: invalid or unacceptable.
- REQUIRES_CORRECTION: must be replaced or corrected.

This is separate from application status. The clean answer to the common question is:

> Submitted tells us where the application is in the workflow. Pending tells us that HR has not yet verified that particular document. Both can be true at the same time.

## 5.8 Required Evidence Categories

The configured academic scenario requires six categories:

1. Teaching.
2. Research.
3. Service.
4. Qualifications.
5. Publications.
6. Professional Development.

Other supporting evidence exists as an optional category where needed.

## 5.9 Eligibility and Criteria Score

The engine first locates the active criterion for the current-rank to target-rank transition. It checks years in rank, required categories, verification states, configured score threshold, and other configured requirements.

The core completeness weights are:

- Teaching: 40.
- Research: 40.
- Service: 20.

Qualifications, Publications, and Professional Development are required completeness gates even though they are not part of the 40/40/20 core total.

The three seeded rank routes are:

- Lecturer to Senior Lecturer: minimum 4 years, minimum configured score 55.
- Senior Lecturer to Associate Professor: minimum 5 years, minimum configured score 65.
- Associate Professor to Professor: minimum 5 years, minimum configured score 70.

The engine returns two distinct outputs:

- Criteria Score, shown as n/100, summarising verified core evidence completeness;
- Eligibility Recommendation, such as Eligible, Not Eligible, Incomplete Application, or Requires Further Review.

A 100/100 score means the verified core categories are complete. It does not mean Excellent performance, it does not reproduce the complete qualitative Schedule J assessment, and it never grants promotion.

## 5.10 Main Database Relationships

- A Faculty contains Departments and scoped Users.
- A Department belongs to a Faculty and contains lecturers or scoped accounts.
- A User has a role, optional faculty/department scope, and promotion relationships.
- A PromotionRequest belongs to the lecturer and stores rank, years, status, eligibility, score, and timestamps.
- A Document belongs to one request and one evidence category.
- A Verification belongs to one document and identifies the verifier and decision.
- PromotionCriteria defines a rank route, years, categories, score threshold, and explanatory requirements.
- ReviewComment records academic or committee feedback and recommendation.
- StatusHistory records old status, new status, actor, comment, and time.
- AuditLog records meaningful actions, targets, actors, descriptions, and metadata.
- Notification connects workflow events to the responsible user.

The relational design prevents a document from being detached from its request and preserves history when a workflow progresses.

## 5.11 Evidence Storage and Access

Uploaded promotion PDFs are stored as binary data in the database-backed `document_file_blobs` table and linked to Document records. The retrieval endpoint requires an authenticated session. Owners may retrieve their own evidence, while authorised workflow reviewers may retrieve evidence required for their role.

The endpoint supports PDF byte ranges, which allows browser PDF viewers to load files reliably. It uses private, no-store caching headers, inline content disposition, content-type protection, and a cleaned presentation filename.

## 5.12 Interface Modules

Authentication and onboarding:

- common login for every role;
- role resolved from the account on the server;
- official email registration and verification;
- profile and security settings.

Lecturer portal:

- dashboard;
- application creation and history;
- evidence workspace;
- eligibility result;
- notifications, feedback queries, profile, settings, and help.

HOD/Dean portal:

- scoped dashboard;
- review queue;
- search and filters;
- list-detail record review;
- comments, forwarding, correction, or further review.

HR portal:

- workload dashboard;
- institution-wide master queue;
- evidence-preview and verification workspace;
- eligibility details;
- final-outcome recording;
- logs, reports, and analytics.

Committee portal:

- dashboard and review queue;
- verified dossier;
- comments and recommendation;
- decided-case history.

System Admin portal:

- users and role scope;
- faculties and departments;
- rank-transition criteria;
- settings and audit access.

## 5.13 Usability and Responsive Design

The five portals share a consistent navigation shell. Desktop uses a collapsible sidebar; mobile uses a bottom tab bar. Queues provide search, filters, clear status labels, and record-detail views. The interface was checked at 1440-pixel desktop and 390-pixel mobile widths.

The known mobile limitation is that dense administrative list-detail pages become one long stacked column instead of using a dedicated mobile list-then-detail navigation pattern.

## 5.14 Testing Evidence

The report records 36 formal functional and integration tests. Verification also included:

- `tsc --noEmit` with zero TypeScript errors;
- a full Next.js production build;
- database health checks;
- seeded-structure and role-account checks;
- complete browser workflow testing;
- server-side role and status enforcement tests;
- department-scope direct-access tests;
- desktop and mobile layout checks;
- protected PDF retrieval checks.

The current defence pack adds repeatable checks for six role logins, Benjamin's active application, anonymous PDF denial, and authenticated PDF range loading.

## 5.15 Important Defect Story

The first eligibility implementation read category scores from a separate Score table. No user workflow populated that table, so even fully verified applications received zero.

The defect appeared only when the full process was run through the browser. The correction calculates directly from verified Document categories, which are the records HR actually updates.

This is a strong defence point because it demonstrates:

- why end-to-end testing was necessary;
- why data flow matters more than isolated formulas;
- how prototyping and testing improved the implementation;
- that the team did not hide a defect but diagnosed, corrected, and documented it.

## 5.16 Deployment Position

The report documents a deployment design using Vercel, Neon PostgreSQL, a Cloudflare-managed subdomain, Resend email, environment variables, and a health endpoint.

Defence-safe claim: the GitHub repository, local production build, connected PostgreSQL database, and `http://localhost:3000` demonstration have been verified. Do not claim that the public domain is currently live unless it is checked successfully immediately before the defence.

# 6. Current Software Snapshot

At the time this handbook was prepared, the verified demonstration state is:

- 6 active users, including Benjamin Baidoo and five role accounts;
- 3 faculties or schools;
- 14 departments;
- 3 active rank-transition criteria;
- 69 production routes;
- 12 protected representative PDFs across two Benjamin applications;
- one completed Lecturer-to-Senior-Lecturer example with full history and Criteria Score 100/100;
- one fresh Senior-Lecturer-to-Associate-Professor Draft with six Pending documents.

## 6.1 Defence Credentials

All representative accounts use `Password123!`.

- Benjamin Baidoo: `benjamin.baidoo@live.gctu.edu.gh`
- Computer Science HOD: `hod.dean@live.gctu.edu.gh`
- FoCIS Dean: `dean.focis@live.gctu.edu.gh`
- HR Administrator: `hr.admin@live.gctu.edu.gh`
- Committee Reviewer: `committee.reviewer@live.gctu.edu.gh`
- System Administrator: `system.admin@live.gctu.edu.gh`

These are representative defence accounts, not real officeholder identities.

## 6.2 Repeatable Preparation Commands

Run from the project folder:

```text
npm run defence:prepare
npm run defence:check
npm run db:health
npm run defence:live-check
```

`defence:prepare` resets only Benjamin's representative workflows. It does not wipe the institutional structure or role accounts.
# 7. Chapter Five: Findings, Conclusion, and Recommendations

## 7.1 Achievement of Objectives

The study concludes that all six objectives were achieved within the declared scope:

- bottlenecks and risks were analysed;
- the digital workflow was designed and implemented;
- the PostgreSQL data model centralises the required records;
- five-role RBAC and organisational scope are enforced;
- the rule-based engine works from verified evidence after correction of the zero-score defect;
- tracking, feedback, reports, status history, and audit logs improve accountability.

Objective 5 must always be qualified as prototype-level decision support. It does not implement the complete qualitative academic assessment cascade.

## 7.2 Answers to the Research Questions

RQ1, bottlenecks and risks: the manual process suffers from physical-document dependence, slow routing, weak visibility, inconsistent checking, and limited auditability. The system addresses these through centralised evidence, controlled workflow, verification records, and audit history.

RQ2, HR and software factors: successful implementation depends on transparent criteria, consistent process, document integrity, role separation, workflow-state management, usability, security, and traceability. The system implements these as RBAC, scope rules, validated states, database relationships, notifications, and audit logging.

RQ3, reliability and objectivity: automation improves the repeatable mechanical check by applying the same configured conditions to verified evidence. It does not remove the human qualitative judgement required for teaching, research, and service quality.

RQ4, required features: a modern system needs authentication, onboarding, profiles, requests, evidence upload, academic review, HR verification, eligibility support, committee review, feedback, notifications, reporting, analytics, configuration, and audit history.

RQ5, transparency and accountability: real-time status, notifications, status history, and audit logs show who acted, what changed, when it happened, and what the next responsibility is.

## 7.3 Main Conclusion

The project demonstrates that GCTU's promotion process can be represented as a secure, centralised, traceable digital workflow. Its strongest value is the structure it gives to responsibility and evidence, not the numeric score alone.

The system separates applicant submission, academic review, HR verification, rule-based eligibility support, committee recommendation, authority recording, and administrative completion. This reduces ambiguity while preserving human judgement and statutory authority.

## 7.4 Implemented-System Limitations

1. Eligibility is completeness-based, not a full qualitative assessment of academic quality.
2. The committee does not enter separate qualitative ratings per category.
3. HOD and Dean are combined into one prototype academic-review stage.
4. Dense mobile administration pages use a long stacked layout.
5. Real institutional promotion data was not used.
6. There is no maintained automated regression suite.
7. Criteria and rank thresholds need formal GCTU policy validation.
8. Formal real-user UAT was prepared but not completed.
9. Criteria history is not versioned by effective date.
10. The Score database entity is unused after the eligibility correction.
11. Schedule K is not implemented.
12. GCTU staff-database and SSO integration are not implemented.
13. Committee conflict-of-interest recusal is procedural rather than a dedicated software control.
14. External assessor and digital-signature support are not implemented.

## 7.5 Institutional Recommendations

- Conduct a supervised pilot with a small number of consenting applications.
- Validate criteria, weights, minimum years, categories, and routes with HR and authorised promotion bodies.
- Define evidence retention, backups, access-review, and hosting rules.
- Train each role on the distinction between academic review and HR verification.
- Use personal officeholder accounts, not shared credentials.
- Map each active HOD to one department and each Dean to one faculty, then deactivate previous officeholders while preserving history.

## 7.6 Future Work

- implement explicit HOD, Dean, faculty committee, and university committee stages;
- implement per-area qualitative Schedule J ratings;
- add full Schedule K support;
- version criteria by effective date and bind each application to its submitted version;
- optimise mobile administrative list-detail navigation;
- add Playwright regression tests;
- integrate GCTU SSO and official staff data;
- remove or repurpose the unused Score table;
- add ESLint and stronger automated accessibility checking;
- add conflict-of-interest reassignment, external assessors, and digital signatures.

# 8. What the Project Contributes

The project is not novel because it invented RBAC, databases, workflow engines, or decision support. Those already exist.

Its contribution is the integration and localisation of those ideas into one GCTU-focused prototype with:

- actual faculty and department structure;
- officeholder account scope;
- promotion-specific evidence categories;
- separation of upload and verification;
- valid promotion states and correction loops;
- verification-gated criteria checking;
- separation of recommendation and final decision;
- role-specific interfaces;
- complete status and audit history.

The academically strong claim is:

> The contribution is a tested, localised digital workflow and decision-support prototype that translates GCTU's promotion context into enforceable software roles, evidence states, workflow transitions, and traceable records.

# 9. Defence Questions and Team-Aligned Answers

## Why did you choose this topic?

Promotion affects staff careers and institutional trust, yet the process depends on many sensitive documents and hand-offs. The project addresses a practical GCTU problem where workflow, evidence integrity, visibility, and accountability can be improved through software.

## What is the exact problem being solved?

Fragmented evidence, manual routing delays, weak status visibility, delayed feedback, inconsistent mechanical checking, reporting difficulty, and limited auditability.

## Why is it a support system rather than an automatic promotion system?

Promotion contains qualitative academic judgement and statutory authority that software must not replace. The system automates repeatable checks and record flow while human reviewers recommend and decide.

## What methodology did you use and why?

Applied design-and-development research with qualitative requirement gathering, and the Prototyping Model for software development. Prototyping allowed workflow and interface requirements to be refined through a working system.

## What was your sample size?

The approved report identifies purposively selected stakeholder categories but does not provide a numeric count. Do not invent one. Acknowledge the reporting limitation and explain the triangulation with official documents, observation, interviews, and implementation evidence.

## What were your data-collection methods?

Interviews, observation, institutional document review, and online research, supported by structured guides and checklists.

## How did you establish validity?

Requirements from users and process observation were cross-checked against GCTU's Basic Laws, promotion forms, Conditions of Service, Administrative Procedures Manual, and handbook material.

## Why these four theories?

Expectancy explains clear effort-to-outcome visibility; Equity explains consistency and fairness; Reinforcement explains timely feedback; TAM explains usefulness and ease of use. Together they connect HR behaviour to system design.

## What is the research gap?

Existing HR and faculty systems are broad and not automatically localised to GCTU's structure, evidence categories, workflow, criteria, and role scope. The project integrates those requirements into one prototype.

## Why Next.js and TypeScript?

Next.js supports the interface and server API in one application. TypeScript improves maintainability by catching type errors across UI, workflow, and data contracts before runtime.

## Why Prisma and PostgreSQL?

The workflow is relational and requires integrity across users, structure, requests, documents, verifications, reviews, histories, and criteria. Prisma provides typed data access; PostgreSQL provides durable relational storage and transaction support.

## How is security enforced?

Passwords are hashed; sessions are HTTP-only; protected APIs verify authentication, role, ownership, organisational scope, input validity, and workflow state; PDFs require authorised retrieval; important actions are audited.

## Can a lecturer verify their own evidence?

No. The server restricts document verification to HR or authorised administration. This separation prevents conflict of interest.

## Why is the document Pending after the application is Submitted?

Submitted is the application stage. Pending is the evidence-verification stage. The evidence remains Pending until HR checks it.

## What triggers eligibility calculation?

The final required document being verified by HR. The server then reads the configured criterion and verified evidence, calculates the completeness result, stores the explanation, and routes the request.

## What does 100/100 mean?

All weighted core evidence categories used by the prototype are verified. It is a completeness score, not a quality grade and not promotion approval.

## Why are Qualifications, Publications, and Professional Development not in the 40/40/20 total?

They are configured as mandatory completeness gates. The 40/40/20 score summarises Teaching, Research, and Service. Their academic quality remains subject to human review.

## Does the engine fully implement Schedule J?

No. It operationalises selected academic evidence and prototype criteria. It does not reproduce every qualitative rating by HOD, faculty committee, and university committee.

## Where is Schedule K?

Schedule K was outside the demonstrated academic pathway. The criteria model can be extended, but full administrative and professional staff logic was not implemented.

## Why combine HOD and Dean?

They need similar academic-review permissions, so the prototype reuses one technical role and interface. Account scope separates department and faculty access. The current limitation is one combined review stage.

## How many HOD and Dean accounts are needed?

One personal account per current officeholder. For the represented three-faculty, fourteen-department structure, a complete setup can have fourteen HOD accounts and three Dean accounts. These are accounts, not seventeen different software roles.

## Why does HR record the final outcome?

The prototype does not provide a separate login for the institutional authority. The committee recommends; the authority decides outside or through the official process; HR records that authorised result and closes the administrative workflow.

## How do you prevent an impossible status jump?

A workflow state map defines legal transitions, and a role map defines who may create each target status. The server rejects transitions that fail either rule.

## What happens when evidence is incorrect?

HR records Rejected or Requires Correction with a reason. The request returns to the lecturer, correction upload is reopened, and the application is resubmitted. History remains traceable.

## How do HOD and Dean accounts see only relevant applications?

HOD accounts are mapped to a department and faculty; Dean accounts are mapped to a faculty without a department. Server queries apply the scope, including direct URL access checks.

## How are PDFs protected?

The files are stored as database binary data linked to document records. The endpoint checks the authenticated owner or authorised reviewer before returning the PDF and supports secure private range responses.

## How was the system tested?

Thirty-six functional and integration cases, TypeScript verification, production build, database health, full browser workflow, RBAC and scope checks, responsive checks, and protected-file checks.

## What defect did testing find?

The first eligibility calculation read from an unpopulated Score table and returned zero. End-to-end testing exposed the mismatch; the corrected engine calculates from the verified Document records produced by the real workflow.

## Did you complete UAT?

No. UAT tasks and a feedback instrument were prepared, but formal testing with real representative users was not completed. Functional correctness is evidenced, but independent user acceptance remains required.

## Is the system already production-ready?

It is a complete academic prototype with a verified production build. Operational deployment still requires policy validation, formal UAT, security and data-governance approval, official integration, approved hosting, and a controlled pilot.

## Is the public deployment live?

Only claim what has been checked on the day. The local production system and database are verified. The report documents the Vercel/Neon/Cloudflare deployment design, but the public domain must be tested before it is described as live.

## What would you improve first?

First conduct formal UAT and policy validation. Next add separate sequential HOD and Dean stages and criteria versioning. Then add qualitative assessment, Schedule K, official integration, and automated regression tests.

## What is the strongest result?

The complete, traceable workflow across all roles and the fact that end-to-end testing found and corrected a genuine cross-module scoring defect.

# 10. Claims the Team Must Avoid

Never say:

- the system automatically promotes lecturers;
- 100/100 means excellent academic performance;
- every part of Schedule J is implemented;
- Schedule K is implemented;
- HOD and Dean are already separate sequential stages;
- the committee makes the final institutional decision;
- UAT with real users was completed;
- real staff records were used;
- the system proves uploaded documents are genuine;
- a public deployment is live without checking it;
- a numeric research sample size that is not in the approved report.

Prefer these phrases:

- decision-support prototype;
- verified-evidence completeness;
- criteria score and eligibility recommendation are separate;
- representative defence data;
- server-enforced RBAC and organisational scope;
- committee recommendation;
- authorised outcome recorded by HR;
- operational deployment requires institutional validation.
# 11. Suggested Team Speaking Responsibilities

These are recommended responsibilities for rehearsal. They do not prevent any examiner from directing a question to another member.

## Benjamin Baidoo: Main Presenter and System Lead

Primary areas:

- opening and project story;
- objectives and contribution;
- architecture and workflow;
- role and account scoping;
- eligibility logic;
- implementation and live demonstration;
- testing defect story;
- conclusion.

Benjamin should be ready to recover the demonstration, explain exact status transitions, and protect the decision-support boundary.

## Success Joy Likem Hayibor: Problem and Literature Lead

Primary areas:

- background and problem statement;
- aim, significance, and scope;
- literature concepts;
- four theories and their system relevance;
- existing systems and research gap;
- institutional value and adoption considerations.

Success should be able to connect a theory directly to a visible system feature instead of defining theory in isolation.

## Esther Appiah: Methodology and Evaluation Lead

Primary areas:

- applied design-and-development research;
- qualitative requirement gathering;
- prototyping stages and justification;
- population, purposive sampling, methods, instruments, validity, and reliability;
- functional and non-functional requirements;
- testing evidence, limitations, recommendations, and future work.

Esther should be ready to answer the sample-size question honestly and distinguish completed functional testing from uncompleted UAT.

## Shared Responsibility

Every member must know:

- the six objectives and five research questions;
- the five technical roles;
- the complete workflow order;
- the meaning of Pending, Submitted, Criteria Score, Eligible, Recommended, Approved by Authority, and Completed;
- why HOD and Dean share a role but need separate accounts;
- the six evidence categories and 40/40/20 core weights;
- the zero-score defect and correction;
- the major limitations;
- the one-sentence contribution.

# 12. Demonstration Story

## Safe Four-Minute Demonstration

1. Log in as Benjamin Baidoo.
2. Show the completed application, six verified documents, 100/100 Criteria Score, separate Eligible status, comments, and status history.
3. Show the fresh Draft with six Pending PDFs and explain the state distinction.
4. Log in as System Admin and show the three faculties, fourteen departments, account scope rules, and three criteria.
5. Log in as HR and show the master queue, PDF preview, verification details, and final recording.
6. Show an audit record and conclude that the value is controlled traceability, not automatic promotion.

## Extended Workflow

1. Benjamin submits the prepared Draft.
2. Computer Science HOD reviews and forwards to HR.
3. HR verifies all six PDFs; the last verification triggers eligibility.
4. Committee records Recommended with a reason.
5. HR records authority approval and completes the workflow.
6. Benjamin views the final status, notification, and history.

## Demonstration Recovery

If a live mutation fails:

- stop clicking;
- switch to Benjamin's completed representative application;
- explain the stages from Status History;
- use the PowerPoint implementation screenshots;
- continue the defence without debugging source code in front of the panel.

# 13. Glossary

Academic review: department or faculty examination of relevance and completeness before HR verification.

Applicant: the lecturer whose promotion request is being processed.

Audit log: timestamped record of an important action, actor, target, description, and metadata.

Criteria score: n/100 completeness result from verified core evidence in the prototype.

Decision support: software assistance that structures information and applies repeatable rules without replacing the authorised decision-maker.

Document verification: HR decision that evidence is Verified, Rejected, Requires Correction, or still Pending.

Eligibility recommendation: system result indicating whether configured rule-based conditions permit onward review.

Evidence category: the institutional type under which a PDF is submitted, such as Teaching or Research.

HOD/Dean role: shared prototype permission set for scoped academic review.

Institutional authority: the body authorised by GCTU to make the real promotion decision; represented by an outcome recorded by HR in the prototype.

Notification: system message informing a user that an event or required action occurred.

Organisational scope: the faculty or department boundary applied to an account.

Promotion request: the application record connecting applicant, rank route, evidence, status, reviews, score, and history.

Recommendation: committee or system advice that is not the final decision.

Representative data: synthetic records prepared for testing or defence, not real personnel data.

Role-based access control: permissions assigned according to institutional responsibility.

Schedule J: academic promotion structure referenced by the report; only selected prototype concepts are operationalised.

Schedule K: administrative and professional promotion structure not implemented in the prototype.

Status history: ordered list of application-state changes, actors, comments, and dates.

UAT: User Acceptance Testing performed by representative users to judge whether the system supports their real tasks and expectations.

Workflow state: the controlled stage of an application, such as Draft, HR Verification, or Completed.

# 14. Rapid Revision Sheet

## Twelve Facts to Memorise

1. Title: Digital Staff Promotion Support System for GCTU.
2. Problem: fragmented evidence, slow routing, weak visibility, inconsistent checking, and limited auditability.
3. Aim: improve efficiency, transparency, accountability, and objectivity.
4. Method: applied design-and-development research, qualitative requirements, and Prototyping Model.
5. Roles: Lecturer, HOD/Dean, HR, Committee, System Admin.
6. Workflow: Draft, Submitted, Academic Review, HR Verification, Committee Review, Authority Outcome, Completed.
7. Required evidence: Teaching, Research, Service, Qualifications, Publications, Professional Development.
8. Core score: Teaching 40, Research 40, Service 20.
9. Score boundary: completeness, not quality and not approval.
10. Testing: 36 cases plus build, database, browser, scope, PDF, and responsive checks.
11. Strong result: end-to-end testing found and corrected the zero-score defect.
12. Main limitation: the full qualitative statutory process and formal UAT are not implemented/completed.

## Ten-Minute Reading Order Before Entering the Room

1. Five Non-Negotiable Truths.
2. Executive Summary.
3. Six Objectives and Five Research Questions.
4. Complete Workflow.
5. Eligibility and Criteria Score.
6. Testing Evidence and Defect Story.
7. Implemented-System Limitations.
8. Claims the Team Must Avoid.
9. Suggested Team Responsibilities.
10. Twelve Facts to Memorise.

## Final Team Statement

> We designed and tested a GCTU-focused digital promotion workflow that centralises evidence, enforces role and organisational boundaries, supports consistent eligibility checking, and preserves a complete audit trail. It improves the information available to decision-makers without replacing their academic judgement or institutional authority.

# 15. Final Readiness Checklist

Before the defence, every team member should be able to answer yes to the following:

- I can explain the problem without reading the report.
- I can state the aim and summarise all six objectives.
- I know the five research questions and the conclusion reached for each.
- I can justify the Prototyping Model.
- I can explain purposive sampling and the absence of a numeric sample count in the report.
- I can connect each theory to a system feature.
- I can draw or verbally reconstruct the workflow.
- I know the five roles and their boundaries.
- I can explain Pending versus Submitted.
- I can explain Criteria Score versus Eligibility versus Recommendation versus Final Decision.
- I can explain HOD/Dean account scope and the prototype routing limitation.
- I can describe the architecture and major database entities.
- I can state the testing evidence and the zero-score correction.
- I can name at least five limitations and five future improvements.
- I can explain the contribution without claiming the system is fully production-ready.
- I know which part of the live demonstration I am responsible for.
- I know the fallback plan if the live system is unavailable.

The team should rehearse once with interruptions. One member should deliberately ask difficult questions while another presents. The goal is not to memorise every sentence; it is to keep the technical meaning and project boundaries consistent across all three speakers.