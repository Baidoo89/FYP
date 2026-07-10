# Database Schema & ERD

- **Models:** User, Lecturer, AdminAccount, PromotionRequest, Document, AuditLog
- **Enums:** Role, AcademicRank, RequestStatus, DocumentCategory, VerificationStatus, EligibilityStatus
- **Migrations:** Managed by Prisma, tracked in `prisma/migrations`

## Entity Relationship Diagram (ERD)

```
[User] 1---* [PromotionRequest] *---1 [Lecturer]
[PromotionRequest] 1---* [Document]
[User] 1---* [AuditLog]

[AdminAccount] (admin login)
```

- All foreign keys and constraints are enforced at the DB level.