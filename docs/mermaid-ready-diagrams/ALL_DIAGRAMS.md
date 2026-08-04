# All Ready-to-Use Mermaid Diagrams

## Figure 4 / Chapter Figure 4.1 - System Architecture

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 4 / Chapter Figure 4.1 - System Architecture
flowchart LR
    Browser["User Device / Browser"]:::client

    subgraph Presentation["Presentation Layer"]
        direction TB
        UI["Role-specific React portals<br/>Lecturer, HOD/Dean, HR, Committee, System Admin"]:::ui
        Shell["Responsive application shell<br/>Desktop sidebar and mobile bottom tabs"]:::ui
        UI --> Shell
    end

    subgraph Application["Application Layer - Next.js Server"]
        direction TB
        MW["Middleware<br/>Session validation and route protection"]:::logic
        API["API routes<br/>Authentication, applications, evidence, verification, review, reports, admin"]:::logic
        Domain["Domain services<br/>Workflow, RBAC, department scope, eligibility, audit, notification"]:::logic
        MW --> API --> Domain
    end

    subgraph Data["Data Layer"]
        direction TB
        Prisma["Prisma ORM<br/>Typed data access and migrations"]:::data
        DB[("Neon PostgreSQL<br/>Users, requests, documents, criteria, audit logs")]:::store
        Blob[("document_file_blobs<br/>Durable PDF evidence storage")]:::store
        Prisma --> DB
        Prisma --> Blob
    end

    Browser -->|HTTPS| UI
    Shell -->|protected requests| MW
    Domain --> Prisma
    Prisma -->|records and status updates| Domain
    API -->|JSON responses| Shell

    classDef client fill:#FFFFFF,stroke:#111827,stroke-width:1.6px,color:#111827;
    classDef ui fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1.4px,color:#0F172A;
    classDef logic fill:#ECFDF5,stroke:#047857,stroke-width:1.4px,color:#0F172A;
    classDef data fill:#F8FAFC,stroke:#334155,stroke-width:1.4px,color:#0F172A;
    classDef store fill:#FEFCE8,stroke:#A16207,stroke-width:1.4px,color:#0F172A;
```

## Figure 5 / Chapter Figure 4.2 - Component Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 5 / Chapter Figure 4.2 - Component Diagram
flowchart TB
    subgraph Portals["Role-specific Portals"]
        direction LR
        LecturerPortal["Lecturer Portal"]:::portal
        HodPortal["HOD/Dean Portal"]:::portal
        HrPortal["HR Portal"]:::portal
        CommitteePortal["Committee Portal"]:::portal
        AdminPortal["System Admin Portal"]:::portal
    end

    subgraph Core["Core Domain Modules"]
        direction TB
        Auth["Authentication Module"]:::core
        RBAC["RBAC Module"]:::core
        Workflow["Promotion Workflow Module"]:::core
        Scope["Department Scope Module"]:::core
        Upload["Evidence Upload Module"]:::core
        Verify["Verification Module"]:::core
        Eligibility["Eligibility Engine"]:::core
        Review["Committee Review Module"]:::core
        Criteria["Criteria Configuration Module"]:::core
        Reports["Reporting and Analytics Module"]:::core
        Audit["Audit Logging Module"]:::core
        Notify["Notification Module"]:::core
    end

    subgraph DataAccess["Data Access and External Services"]
        direction LR
        Prisma["Prisma ORM"]:::data
        DB[("Neon PostgreSQL")]:::store
        Blob[("document_file_blobs")]:::store
        Email["Resend Email"]:::external
    end

    LecturerPortal --> Auth
    LecturerPortal --> Upload
    LecturerPortal --> Workflow
    HodPortal --> Auth
    HodPortal --> Scope
    HodPortal --> Workflow
    HrPortal --> Auth
    HrPortal --> Verify
    HrPortal --> Eligibility
    HrPortal --> Reports
    CommitteePortal --> Auth
    CommitteePortal --> Review
    AdminPortal --> Auth
    AdminPortal --> RBAC
    AdminPortal --> Criteria
    AdminPortal --> Reports

    Auth --> RBAC
    Workflow --> Scope
    Workflow --> Audit
    Workflow --> Notify
    Upload --> Prisma
    Upload --> Blob
    Verify --> Prisma
    Eligibility --> Prisma
    Review --> Prisma
    Criteria --> Prisma
    Reports --> Prisma
    Audit --> Prisma
    Notify --> Prisma
    Notify -. verification and workflow email .-> Email
    Prisma --> DB

    classDef portal fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1.4px,color:#0F172A;
    classDef core fill:#ECFDF5,stroke:#047857,stroke-width:1.4px,color:#0F172A;
    classDef data fill:#F8FAFC,stroke:#334155,stroke-width:1.4px,color:#0F172A;
    classDef store fill:#FEFCE8,stroke:#A16207,stroke-width:1.4px,color:#0F172A;
    classDef external fill:#FDF2F8,stroke:#BE185D,stroke-width:1.4px,color:#0F172A;
```

## Figure 6 / Chapter Figure 4.3 - Entity Relationship Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","tertiaryColor":"#EEF2FF"}}}%%
%% Figure 6 / Chapter Figure 4.3 - Entity Relationship Diagram
erDiagram
    FACULTY ||--o{ DEPARTMENT : contains
    FACULTY ||--o{ USER : scopes
    DEPARTMENT ||--o{ USER : assigns
    DEPARTMENT ||--o{ LECTURER : maps_legacy_staff
    USER ||--o{ PROMOTION_REQUEST : lecturer
    USER ||--o{ PROMOTION_REQUEST : requested_by
    USER ||--o{ DOCUMENT : uploads
    USER ||--o{ VERIFICATION : verifies
    USER ||--o{ REVIEW_COMMENT : reviews
    USER ||--o{ STATUS_HISTORY : changes_status
    USER ||--o{ AUDIT_LOG : performs_action
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ SCORE : creates_score
    USER ||--o{ PROMOTION_CRITERIA : maintains_criteria
    PROMOTION_REQUEST ||--o{ DOCUMENT : contains_evidence
    PROMOTION_REQUEST ||--o{ SCORE : stores_scores
    PROMOTION_REQUEST ||--o{ REVIEW_COMMENT : has_review
    PROMOTION_REQUEST ||--o{ STATUS_HISTORY : tracks_status
    PROMOTION_REQUEST ||--o{ AUDIT_LOG : logs_events
    PROMOTION_REQUEST ||--o{ NOTIFICATION : triggers
    DOCUMENT ||--o{ VERIFICATION : has_decisions
    DOCUMENT ||--o| DOCUMENT_FILE_BLOB : stores_pdf_blob

    FACULTY {
        int id PK
        string name UK
        string description
    }
    DEPARTMENT {
        int id PK
        string name UK
        int facultyId FK
        string description
    }
    LECTURER {
        int id PK
        string name
        string email UK
        string department
        int departmentId FK
        string rank
        boolean is_active
    }
    USER {
        int id PK
        string name
        string email UK
        string staffId UK
        Role role
        string currentRank
        int departmentId FK
        int facultyId FK
        boolean emailVerified
        boolean isActive
    }
    PROMOTION_REQUEST {
        int id PK
        int lecturerId FK
        int applicantId FK
        int requestedById FK
        string currentRank
        string targetRank
        int yearsInCurrentRank
        RequestStatus status
        EligibilityStatus eligibilityStatus
        float totalScore
        string eligibilityReason
    }
    DOCUMENT {
        int id PK
        int requestId FK
        int uploadedById FK
        DocumentCategory category
        string title
        string fileName
        int fileSize
        VerificationStatus status
        int verifiedById FK
    }
    DOCUMENT_FILE_BLOB {
        int documentId PK
        string fileName
        string mimeType
        int size
        bytes data
    }
    VERIFICATION {
        int id PK
        int documentId FK
        int verifierId FK
        VerificationStatus decision
        string comment
    }
    PROMOTION_CRITERIA {
        int id PK
        AcademicRank currentRank
        AcademicRank targetRank
        int minimumYearsInCurrentRank
        DocumentCategory requiredDocumentCategories
        boolean scoringEnabled
        float minimumTotalScore
        boolean isActive
    }
    SCORE {
        int id PK
        int promotionRequestId FK
        DocumentCategory category
        float score
        float weight
        float weightedScore
        PerformanceCategory performanceCategory
    }
    REVIEW_COMMENT {
        int id PK
        int promotionRequestId FK
        int reviewerId FK
        string comment
        ReviewRecommendation recommendation
    }
    STATUS_HISTORY {
        int id PK
        int promotionRequestId FK
        int changedById FK
        RequestStatus oldStatus
        RequestStatus newStatus
        string comment
    }
    AUDIT_LOG {
        int id PK
        int requestId FK
        int actorId FK
        string action
        string entityType
        string description
        json metadata
    }
    NOTIFICATION {
        int id PK
        int userId FK
        int promotionRequestId FK
        string title
        string message
        NotificationType type
        boolean isRead
    }
```

## Figure 7 / Chapter Figure 4.4 - Promotion Workflow State Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5"}}}%%
%% Figure 7 / Chapter Figure 4.4 - Promotion Workflow State Diagram
stateDiagram-v2
    [*] --> DRAFT: Lecturer starts application
    DRAFT --> SUBMITTED: Required evidence attached
    SUBMITTED --> UNDER_DEPARTMENT_REVIEW: System routes to scoped HOD/Dean
    UNDER_DEPARTMENT_REVIEW --> UNDER_HR_VERIFICATION: Academic review forwarded
    UNDER_DEPARTMENT_REVIEW --> RETURNED_FOR_CORRECTION: Academic evidence incomplete
    RETURNED_FOR_CORRECTION --> SUBMITTED: Lecturer corrects and resubmits
    UNDER_HR_VERIFICATION --> UNDER_COMMITTEE_REVIEW: Evidence verified and eligible
    UNDER_HR_VERIFICATION --> REQUIRES_FURTHER_REVIEW: Criteria not fully satisfied
    UNDER_HR_VERIFICATION --> RETURNED_FOR_CORRECTION: Evidence rejected or correction requested
    UNDER_COMMITTEE_REVIEW --> RECOMMENDED: Committee recommends promotion
    UNDER_COMMITTEE_REVIEW --> NOT_RECOMMENDED: Committee does not recommend
    UNDER_COMMITTEE_REVIEW --> REQUIRES_FURTHER_REVIEW: Committee requests further review
    REQUIRES_FURTHER_REVIEW --> UNDER_HR_VERIFICATION: HR re-verifies evidence
    REQUIRES_FURTHER_REVIEW --> UNDER_DEPARTMENT_REVIEW: Department clarification needed
    RECOMMENDED --> APPROVED_BY_AUTHORITY: HR records authority approval
    APPROVED_BY_AUTHORITY --> COMPLETED: HR completes workflow
    NOT_RECOMMENDED --> COMPLETED: Final outcome recorded
    COMPLETED --> [*]
```

## Figure 8 / Chapter Figure 4.5 - Use Case Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 8 / Chapter Figure 4.5 - Use Case Diagram
flowchart TB
    subgraph Actors["External Actors"]
        direction LR
        Lecturer["Lecturer"]:::actor
        HodDean["HOD / Dean"]:::actor
        HR["HR Administrator"]:::actor
        Committee["Committee Reviewer"]:::actor
        Admin["System Administrator"]:::actor
    end

    subgraph System["Digital Staff Promotion Support System"]
        direction TB
        subgraph LecturerCases["Lecturer Functions"]
            direction LR
            UC1([Create promotion request]):::usecase
            UC2([Upload categorized PDF evidence]):::usecase
            UC3([Track application status and outcome]):::usecase
        end
        subgraph AcademicCases["Academic Review Functions"]
            direction LR
            UC4([Review departmental application]):::usecase
            UC5([Return, request review, or forward to HR]):::usecase
        end
        subgraph HrCases["HR and Decision-Support Functions"]
            direction LR
            UC6([Verify evidence documents]):::usecase
            UC7([Run eligibility recommendation]):::usecase
            UC8([Record authority approval and close workflow]):::usecase
            UC9([Generate workflow reports]):::usecase
        end
        subgraph CommitteeCases["Committee Functions"]
            direction LR
            UC10([Review eligible application]):::usecase
            UC11([Record committee recommendation]):::usecase
        end
        subgraph AdminCases["Administration and Governance Functions"]
            direction LR
            UC12([Manage users, roles, faculties, and departments]):::usecase
            UC13([Configure promotion criteria]):::usecase
            UC14([View audit logs and governance records]):::usecase
        end
    end

    Lecturer --> UC1
    Lecturer --> UC2
    Lecturer --> UC3
    HodDean --> UC4
    HodDean --> UC5
    HR --> UC6
    HR --> UC7
    HR --> UC8
    HR --> UC9
    Committee --> UC10
    Committee --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC9
    UC6 -. verified documents .-> UC7
    UC7 -. eligible application .-> UC10
    UC11 -. recommendation .-> UC8

    classDef actor fill:#FFFFFF,stroke:#111827,stroke-width:1.8px,color:#111827;
    classDef usecase fill:#EEF2FF,stroke:#4338CA,stroke-width:1.5px,color:#111827;
```

## Figure 9 / Chapter Figure 4.6 - Overall Promotion Process Activity Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 9 / Chapter Figure 4.6 - Overall Promotion Process Activity Diagram
flowchart TD
    Start([Start]):::terminal
    subgraph LecturerLane["Lecturer"]
        direction TB
        L1["Create or open promotion application"]:::process
        L2["Upload evidence by required category"]:::process
        L3{"All required evidence attached?"}:::decision
        L4["Submit application"]:::process
        L5["Correct returned evidence or details"]:::process
    end
    subgraph HodLane["HOD / Dean Academic Review"]
        direction TB
        H1["Receive scoped department or faculty notification"]:::process
        H2["Inspect application and evidence"]:::process
        H3{"Academically complete?"}:::decision
        H4["Return for correction"]:::exception
        H5["Forward application to HR"]:::process
    end
    subgraph HrLane["HR Verification and Eligibility"]
        direction TB
        R1["Open HR verification queue"]:::process
        R2["Verify each uploaded document"]:::process
        R3{"Required evidence verified?"}:::decision
        R4["Reject or request correction"]:::exception
        R5["Calculate criteria score and eligibility recommendation"]:::process
        R6{"Meets configured threshold?"}:::decision
        R7["Set requires further review"]:::exception
        R8["Route eligible application to committee"]:::process
        R9["Record authority approval"]:::process
        R10["Complete workflow and notify applicant"]:::process
    end
    subgraph CommitteeLane["Committee Review"]
        direction TB
        C1["Review verified application and eligibility report"]:::process
        C2["Record recommendation with justification"]:::process
        C3{"Recommendation outcome?"}:::decision
        C4["Request further review"]:::exception
        C5["Record not recommended"]:::exception
        C6["Record recommended"]:::process
    end
    End([End]):::terminal

    Start --> L1 --> L2 --> L3
    L3 -- No --> L2
    L3 -- Yes --> L4 --> H1
    H1 --> H2 --> H3
    H3 -- No --> H4 --> L5 --> L2
    H3 -- Yes --> H5 --> R1
    R1 --> R2 --> R3
    R3 -- No --> R4 --> L5
    R3 -- Yes --> R5 --> R6
    R6 -- No --> R7 --> R1
    R6 -- Yes --> R8 --> C1
    C1 --> C2 --> C3
    C3 -- Further review --> C4 --> R1
    C3 -- Not recommended --> C5 --> R10
    C3 -- Recommended --> C6 --> R9 --> R10 --> End

    classDef terminal fill:#111827,stroke:#111827,color:#FFFFFF,stroke-width:1.5px;
    classDef process fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1.4px,color:#0F172A;
    classDef decision fill:#FFF7ED,stroke:#C2410C,stroke-width:1.6px,color:#0F172A;
    classDef exception fill:#FEF2F2,stroke:#B91C1C,stroke-width:1.5px,color:#0F172A;
```

## Figure 10 / Chapter Figure 4.7 - Lecturer Application Activity Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 10 / Chapter Figure 4.7 - Lecturer Application Activity Diagram
flowchart TD
    Start([Start]):::terminal
    Login["Log in with official GCTU email"]:::process
    Profile{"Profile complete?"}:::decision
    Complete["Complete rank, department, faculty, and staff profile"]:::process
    SelectRank["Select current rank and target promotion rank"]:::process
    Draft["Create draft promotion request"]:::process
    Category["Select required evidence category"]:::process
    Upload["Upload PDF evidence file"]:::process
    Validate{"File valid and category accepted?"}:::decision
    FixFile["Replace invalid file or category"]:::exception
    Missing{"Required categories still missing?"}:::decision
    Review["Review application summary before submission"]:::process
    Submit["Submit application"]:::process
    Track["Track status, comments, eligibility, and final outcome"]:::process
    Returned{"Returned for correction?"}:::decision
    Correct["Correct evidence or application details"]:::process
    End([End]):::terminal

    Start --> Login --> Profile
    Profile -- No --> Complete --> Profile
    Profile -- Yes --> SelectRank --> Draft --> Category --> Upload --> Validate
    Validate -- No --> FixFile --> Category
    Validate -- Yes --> Missing
    Missing -- Yes --> Category
    Missing -- No --> Review --> Submit --> Track --> Returned
    Returned -- Yes --> Correct --> Category
    Returned -- No --> End

    classDef terminal fill:#111827,stroke:#111827,color:#FFFFFF,stroke-width:1.5px;
    classDef process fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1.4px,color:#0F172A;
    classDef decision fill:#FFF7ED,stroke:#C2410C,stroke-width:1.6px,color:#0F172A;
    classDef exception fill:#FEF2F2,stroke:#B91C1C,stroke-width:1.5px,color:#0F172A;
```

## Figure 11 / Chapter Figure 4.8 - HOD/Dean Review Activity Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 11 / Chapter Figure 4.8 - HOD/Dean Review Activity Diagram
flowchart TD
    Start([Start]):::terminal
    subgraph Scope["Reviewer Scope Resolution"]
        direction TB
        S1{"Reviewer assigned to a department?"}:::decision
        S2["Open department-scoped queue as HOD"]:::process
        S3["Open faculty-scoped queue as Dean"]:::process
        S4["Apply department/faculty access filter"]:::process
    end
    Select["Select application from review queue"]:::process
    Inspect["Inspect applicant profile, rank path, and uploaded evidence"]:::process
    Comment["Record academic review comment"]:::process
    Decision{"Review decision"}:::decision
    Return["Return for correction"]:::exception
    Further["Mark requires further review"]:::exception
    Forward["Forward to HR verification"]:::process
    Persist["Write StatusHistory, AuditLog, and notification"]:::audit
    End([End]):::terminal

    Start --> S1
    S1 -- Yes --> S2 --> S4
    S1 -- No --> S3 --> S4
    S4 --> Select --> Inspect --> Comment --> Decision
    Decision -- Incomplete evidence --> Return --> Persist
    Decision -- Needs clarification --> Further --> Persist
    Decision -- Academically complete --> Forward --> Persist
    Persist --> End

    classDef terminal fill:#111827,stroke:#111827,color:#FFFFFF,stroke-width:1.5px;
    classDef process fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1.4px,color:#0F172A;
    classDef decision fill:#FFF7ED,stroke:#C2410C,stroke-width:1.6px,color:#0F172A;
    classDef exception fill:#FEF2F2,stroke:#B91C1C,stroke-width:1.5px,color:#0F172A;
    classDef audit fill:#ECFDF5,stroke:#047857,stroke-width:1.4px,color:#0F172A;
```

## Figure 12 / Chapter Figure 4.9 - HR Verification and Eligibility Activity Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 12 / Chapter Figure 4.9 - HR Verification and Eligibility Activity Diagram
flowchart TD
    Start([Start]):::terminal
    Queue["Open HR master queue"]:::process
    Select["Select application under HR verification"]:::process
    Staff["Confirm staff record, rank path, and years in current rank"]:::process
    NextDoc["Open next evidence document"]:::process
    Validate{"Evidence valid and matches declared category?"}:::decision
    Reject["Reject document or request correction"]:::exception
    NotifyLecturer["Notify lecturer and return application for correction"]:::exception
    Verify["Mark document VERIFIED and record Verification row"]:::process
    MoreDocs{"More documents pending?"}:::decision
    Required{"All required categories verified?"}:::decision
    Wait["Keep request under HR verification until evidence is complete"]:::exception
    Trigger["Trigger eligibility engine"]:::process
    Score["Compute criteria score from verified categories only"]:::process
    Outcome{"Eligibility recommendation"}:::decision
    Committee["Route eligible application to committee review"]:::process
    Further["Set requires further review or not eligible"]:::exception
    Audit["Write AuditLog, StatusHistory, and notifications"]:::audit
    End([End]):::terminal

    Start --> Queue --> Select --> Staff --> NextDoc --> Validate
    Validate -- No --> Reject --> NotifyLecturer --> Audit --> End
    Validate -- Yes --> Verify --> MoreDocs
    MoreDocs -- Yes --> NextDoc
    MoreDocs -- No --> Required
    Required -- No --> Wait --> Audit --> End
    Required -- Yes --> Trigger --> Score --> Outcome
    Outcome -- Eligible --> Committee --> Audit --> End
    Outcome -- Not eligible or further review --> Further --> Audit --> End

    classDef terminal fill:#111827,stroke:#111827,color:#FFFFFF,stroke-width:1.5px;
    classDef process fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1.4px,color:#0F172A;
    classDef decision fill:#FFF7ED,stroke:#C2410C,stroke-width:1.6px,color:#0F172A;
    classDef exception fill:#FEF2F2,stroke:#B91C1C,stroke-width:1.5px,color:#0F172A;
    classDef audit fill:#ECFDF5,stroke:#047857,stroke-width:1.4px,color:#0F172A;
```

## Figure 13 / Chapter Figure 4.10 - Committee Review Activity Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 13 / Chapter Figure 4.10 - Committee Review Activity Diagram
flowchart TD
    Start([Start]):::terminal
    Queue["Open committee review queue"]:::process
    Select["Select eligible verified application"]:::process
    History["Read HOD/Dean comments and HR verification history"]:::process
    Evidence["Inspect verified evidence and eligibility report"]:::process
    Conflict{"Conflict of interest?"}:::decision
    Recuse["Recuse from the file outside the current system workflow"]:::exception
    Deliberate["Record recommendation and academic justification"]:::process
    Decision{"Recommendation outcome"}:::decision
    Further["Request further review"]:::exception
    NotRecommended["Record NOT_RECOMMENDED"]:::exception
    Recommended["Record RECOMMENDED"]:::process
    Persist["Write ReviewComment, StatusHistory, AuditLog, and HR notification"]:::audit
    End([End]):::terminal

    Start --> Queue --> Select --> History --> Evidence --> Conflict
    Conflict -- Yes --> Recuse --> End
    Conflict -- No --> Deliberate --> Decision
    Decision -- Further review --> Further --> Persist
    Decision -- Not recommended --> NotRecommended --> Persist
    Decision -- Recommended --> Recommended --> Persist
    Persist --> End

    classDef terminal fill:#111827,stroke:#111827,color:#FFFFFF,stroke-width:1.5px;
    classDef process fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1.4px,color:#0F172A;
    classDef decision fill:#FFF7ED,stroke:#C2410C,stroke-width:1.6px,color:#0F172A;
    classDef exception fill:#FEF2F2,stroke:#B91C1C,stroke-width:1.5px,color:#0F172A;
    classDef audit fill:#ECFDF5,stroke:#047857,stroke-width:1.4px,color:#0F172A;
```

## Figure 14 / Chapter Figure 4.11 - Application Submission and Routing Sequence Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","actorBkg":"#FFFFFF","actorBorder":"#334155","actorTextColor":"#0F172A","activationBkgColor":"#E0F2FE","activationBorderColor":"#0369A1","sequenceNumberColor":"#0F172A"},"sequence":{"showSequenceNumbers":true,"actorMargin":80,"messageMargin":40,"mirrorActors":false}}}%%
%% Figure 14 / Chapter Figure 4.11 - Application Submission and Routing Sequence Diagram
sequenceDiagram
    autonumber
    actor Lecturer
    participant Portal as Lecturer Portal
    participant API as Application and Evidence API
    participant Workflow as promotion-workflow.ts
    participant Scope as department-scope.ts
    participant DB as PostgreSQL
    participant Notify as Notification Service

    Lecturer->>Portal: Create application with current and target rank
    Portal->>API: POST application draft
    API->>DB: Insert PromotionRequest with DRAFT status
    DB-->>API: Draft request id

    loop For each required evidence category
        Lecturer->>Portal: Upload PDF evidence
        Portal->>API: POST evidence document
        API->>DB: Insert Document and durable file blob
        DB-->>API: Stored document metadata
    end

    Lecturer->>Portal: Submit completed application
    Portal->>API: POST submit request
    API->>Workflow: Validate required categories and transition from DRAFT
    Workflow->>DB: Update status to SUBMITTED / UNDER_DEPARTMENT_REVIEW
    Workflow->>DB: Insert StatusHistory and AuditLog
    Workflow->>Scope: Resolve HOD/Dean recipients for applicant department
    Scope->>DB: Match departmentId, department name, then faculty Dean fallback
    DB-->>Scope: Scoped reviewer user ids
    Scope-->>Workflow: Recipient ids
    Workflow->>Notify: Create notifications for scoped reviewers
    Notify->>DB: Insert Notification rows
    API-->>Portal: Submission confirmed with current status
```

## Figure 15 / Chapter Figure 4.12 - Eligibility Calculation Sequence Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","actorBkg":"#FFFFFF","actorBorder":"#334155","actorTextColor":"#0F172A","activationBkgColor":"#E0F2FE","activationBorderColor":"#0369A1","sequenceNumberColor":"#0F172A"},"sequence":{"showSequenceNumbers":true,"actorMargin":80,"messageMargin":40,"mirrorActors":false}}}%%
%% Figure 15 / Chapter Figure 4.12 - Eligibility Calculation Sequence Diagram
sequenceDiagram
    autonumber
    actor HR as HR Administrator
    participant API as Verification API
    participant Workflow as promotion-workflow.ts
    participant Engine as promotion-engine.ts
    participant DB as PostgreSQL
    participant Audit as Audit and Notification Layer

    HR->>API: Verify evidence document
    API->>Workflow: verifyPromotionDocument(requestId, documentId, decision)
    Workflow->>DB: Update Document.verificationStatus
    Workflow->>DB: Insert Verification record
    Workflow->>DB: Load required criteria and request evidence
    Workflow->>Workflow: Check whether required categories are verified

    alt Required evidence is complete
        Workflow->>Engine: calculateEligibility(requestId)
        Engine->>DB: Fetch verified documents and active criteria
        Engine->>Engine: Sum Teaching, Research, and Service category weights
        Engine->>Engine: Apply minimum-years and minimum-score rules
        Engine->>DB: Save totalScore, eligibilityStatus, and reason
        Engine-->>Workflow: Eligibility recommendation
        alt Recommendation is ELIGIBLE
            Workflow->>DB: Transition request to UNDER_COMMITTEE_REVIEW
        else Recommendation is not eligible or needs review
            Workflow->>DB: Transition request to REQUIRES_FURTHER_REVIEW
        end
    else Required evidence is incomplete
        Workflow->>DB: Keep request under HR verification or return for correction
    end

    Workflow->>Audit: Record audit trail, status history, and notifications
    Audit->>DB: Insert AuditLog, StatusHistory, and Notification rows
    API-->>HR: Return updated request, criteria score, and recommendation
```

## Figure 16 / Chapter Figure 4.13 - Committee Recommendation and Final Recording Sequence Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","actorBkg":"#FFFFFF","actorBorder":"#334155","actorTextColor":"#0F172A","activationBkgColor":"#E0F2FE","activationBorderColor":"#0369A1","sequenceNumberColor":"#0F172A"},"sequence":{"showSequenceNumbers":true,"actorMargin":80,"messageMargin":40,"mirrorActors":false}}}%%
%% Figure 16 / Chapter Figure 4.13 - Committee Recommendation and Final Recording Sequence Diagram
sequenceDiagram
    autonumber
    actor Committee as Committee Reviewer
    participant CommitteePortal as Committee Portal
    participant ReviewAPI as Review API
    participant Workflow as promotion-workflow.ts
    participant DB as PostgreSQL
    participant HRPortal as HR Portal
    participant Notify as Notification Service

    Committee->>CommitteePortal: Open application under committee review
    CommitteePortal->>ReviewAPI: GET application, evidence, and eligibility report
    ReviewAPI->>DB: Load request, documents, verification history, and comments
    DB-->>CommitteePortal: Verified dossier for review

    Committee->>CommitteePortal: Submit recommendation and justification
    CommitteePortal->>ReviewAPI: POST committee recommendation
    ReviewAPI->>Workflow: Assert COMMITTEE_REVIEWER role and valid status
    Workflow->>DB: Insert ReviewComment
    Workflow->>DB: Transition to RECOMMENDED, NOT_RECOMMENDED, or REQUIRES_FURTHER_REVIEW
    Workflow->>DB: Insert StatusHistory and AuditLog
    Workflow->>Notify: Notify HR of next action
    Notify->>DB: Insert Notification rows
    ReviewAPI-->>CommitteePortal: Recommendation recorded

    alt Committee recommended promotion
        HRPortal->>ReviewAPI: POST record authority approval
        ReviewAPI->>Workflow: Assert HR_ADMIN role
        Workflow->>DB: Transition status to APPROVED_BY_AUTHORITY
        Workflow->>DB: Insert StatusHistory and AuditLog
        HRPortal->>ReviewAPI: POST complete workflow
        ReviewAPI->>Workflow: Finalize completed request
        Workflow->>DB: Transition status to COMPLETED
        Workflow->>Notify: Notify lecturer of final outcome
    else Committee did not recommend or requested further review
        Workflow->>Notify: Notify responsible role of outcome or next review step
    end
```

## Figure 27 / Chapter Figure 4.24 - Deployment Diagram

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Arial","primaryColor":"#F8FAFC","primaryTextColor":"#0F172A","primaryBorderColor":"#334155","lineColor":"#334155","secondaryColor":"#EEF2FF","tertiaryColor":"#ECFDF5","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"},"flowchart":{"htmlLabels":true,"curve":"basis"}}}%%
%% Figure 27 / Chapter Figure 4.24 - Deployment Diagram
flowchart LR
    Developer["Developer Workstation<br/>Source code, Prisma schema, tests"]:::dev
    Git["Git Repository<br/>Version-controlled project"]:::dev
    DNS["Cloudflare DNS<br/>promotion.techdalt.com"]:::network
    Browser["User Device<br/>Modern web browser"]:::client

    subgraph Vercel["Vercel Production Environment"]
        direction TB
        Build["Build pipeline<br/>Next.js build and Prisma generate"]:::runtime
        App["Next.js application<br/>App Router, Server Components, API routes"]:::runtime
        Health["/api/health<br/>Application and database check"]:::runtime
        Build --> App
        App --> Health
    end

    Neon[("Neon Serverless PostgreSQL<br/>Application data and audit records")]:::data
    Blob[("document_file_blobs<br/>Durable uploaded evidence files")]:::data
    Resend["Resend<br/>Transactional verification email"]:::external
    Env["Vercel Environment Variables<br/>AUTH_SECRET, DATABASE_URL, APP_URL, EMAIL settings"]:::secure

    Developer -->|git push| Git
    Git -->|deployment trigger| Build
    Browser -->|HTTPS| DNS
    DNS -->|CNAME route| App
    App -->|Prisma / DATABASE_URL| Neon
    App -->|binary evidence storage| Blob
    App -->|verification email| Resend
    Env -. injected at runtime .-> App
    App -->|health response| Browser

    classDef client fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1.4px,color:#0F172A;
    classDef network fill:#F0FDFA,stroke:#0F766E,stroke-width:1.4px,color:#0F172A;
    classDef runtime fill:#ECFDF5,stroke:#047857,stroke-width:1.4px,color:#0F172A;
    classDef data fill:#FEFCE8,stroke:#A16207,stroke-width:1.4px,color:#0F172A;
    classDef external fill:#FDF2F8,stroke:#BE185D,stroke-width:1.4px,color:#0F172A;
    classDef secure fill:#F8FAFC,stroke:#334155,stroke-width:1.4px,color:#0F172A;
    classDef dev fill:#F5F3FF,stroke:#6D28D9,stroke-width:1.4px,color:#0F172A;
```
