# Lecturer Performance System — Technical Overview & Team Notes

## 1. Project Purpose
The Lecturer Performance System is a full-stack web application designed to support promotion analysis and decision-making for academic staff. It streamlines the process of lecturer appraisal, document verification, and promotion requests, ensuring transparency, auditability, and efficiency for HR and academic administrators.

## 2. Core Technologies
- **Frontend:** Next.js 15.x (App Router), React 18, TypeScript
- **Backend:** Node.js, Next.js API routes
- **ORM:** Prisma v6.19.3 (PostgreSQL provider)
- **Database:** Neon (PostgreSQL, cloud-hosted)
- **Environment Management:** dotenv-cli, `.env.local` for local/dev, environment variables for production
- **Version Control:** Git, GitHub
- **Deployment:** (e.g., Vercel, Railway, or custom server)

## 3. Key Features
- **User Roles:** Lecturer, HR Admin (with role-based access control)
- **Promotion Workflow:** Lecturers submit promotion requests, upload supporting documents, and track status.
- **Document Verification:** HR/Admins verify uploaded documents, add comments, and set verification status.
- **Audit Logging:** All critical actions (requests, verifications, status changes) are logged for traceability.
- **Eligibility Calculation:** System tracks and updates eligibility status for promotions.
- **Secure Authentication:** User registration and login with hashed passwords and role assignment.
- **Responsive UI:** Modern, accessible interface for all user types.

## 4. Database Design
- **PostgreSQL (Neon):** All environments use the same cloud Postgres instance for consistency.
- **Prisma Schema:** Models include `User`, `Lecturer`, `AdminAccount`, `PromotionRequest`, `Document`, `AuditLog`, with enums for roles, ranks, statuses, and categories.
- **Migration Workflow:** All schema changes are managed via Prisma migrations, ensuring the database structure matches the codebase at all times.
- **Reset & Sync:** `npm run db:reset:dev -- --schema=prisma/schema.postgres.prisma` resets and re-applies the schema for a clean state.

## 5. Environment & Security
- **.env.local:** Used for local development; contains `DATABASE_URL` and other sensitive configs. **Never commit this file to the repo.**
- **Production:** All secrets (especially `DATABASE_URL`) are set as environment variables in the deployment platform, not as files.
- **Password Security:** All passwords are hashed before storage.
- **Access Control:** Only authorized users can access admin features.

## 6. Development & Deployment Workflow
- **Local Setup:** Clone the repo, create `.env.local` with the Neon `DATABASE_URL`, run `npm install`, then `npm run db:reset:dev -- --schema=prisma/schema.postgres.prisma`.
- **Migrations:** All schema changes are tracked in `prisma/migrations`. Always commit and push new migrations.
- **Prisma Client:** Automatically regenerated after each migration.
- **Deployment:** Push to `main` triggers deployment (if using Vercel/Railway). Ensure production environment variables are set.

## 7. Defensibility & Best Practices
- **Consistency:** All environments (dev, prod) use the same Postgres schema and migration workflow, eliminating drift and “works on my machine” issues.
- **Auditability:** Every action is logged in the `audit_logs` table, providing a full history for compliance and review.
- **Security:** No secrets in code, strong password hashing, and strict role checks.
- **Documentation:** README and code comments explain setup, migration, and deployment.
- **Error Handling:** All API routes and DB operations include error handling and validation.

## 8. How to Defend the System
- **Why Neon/Postgres?** Cloud Postgres is reliable, scalable, and industry-standard for transactional systems.
- **Why Prisma?** Ensures type safety, migration control, and easy DB access for TypeScript/Node.js.
- **Why this workflow?** Using migrations and environment variables guarantees that the codebase and database are always in sync, and that secrets are never exposed.
- **How is data integrity maintained?** All changes are transactional, with foreign keys and constraints enforced at the DB level.
- **How is security enforced?** No raw passwords, no secrets in code, and all sensitive actions are logged and restricted by role.

## 9. What to Tell Supervisors
- The system is robust, secure, and follows best practices for modern web development.
- All data is auditable and traceable.
- The workflow is documented and repeatable for any new team member.
- The database and code are always in sync, with no risk of schema drift.
- The system is ready for production and can be easily maintained or extended.

---

*For further details or a PDF export, contact the development team.*
