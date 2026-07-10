# Chapter 3: System Analysis & Requirements

## 3.1 Functional Requirements
- User registration and authentication
- Lecturer profile management
- Promotion request submission and tracking
- Document upload and verification
- Eligibility calculation
- Audit logging of all actions
- Role-based access for Lecturers and HR/Admins

## 3.2 Non-Functional Requirements
- Security (password hashing, access control)
- Scalability (cloud database, modular code)
- Usability (responsive UI, clear workflows)
- Maintainability (well-documented code, migration workflow)
- Auditability (comprehensive logs)

## 3.3 Use Case Diagram

```
[Lecturer] -- (Submit Promotion Request)
[Lecturer] -- (Upload Document)
[HR/Admin] -- (Verify Document)
[HR/Admin] -- (Audit Log Review)
```

## 3.4 User Roles
- **Lecturer:** Can submit requests, upload documents, view status
- **HR/Admin:** Can verify documents, manage requests, view audit logs

## 3.5 System Constraints
- All data must be stored securely in Neon Postgres
- Only authorized users can access sensitive features
- System must be accessible via modern web browsers