# Chapter 4: System Design & Architecture

## 4.1 Overview
The system uses a modern web stack for scalability, maintainability, and security.

## 4.2 Technology Stack
- **Frontend:** Next.js 15.x, React 18, TypeScript
- **Backend:** Node.js, Next.js API routes
- **ORM:** Prisma v6.19.3
- **Database:** Neon (PostgreSQL)

## 4.3 Architecture Diagram
```
[User] <-> [Next.js Frontend] <-> [API Routes] <-> [Prisma ORM] <-> [Neon Postgres]
```

## 4.4 Entity Relationship Diagram (ERD)
```
[User] 1---* [PromotionRequest] *---1 [Lecturer]
[PromotionRequest] 1---* [Document]
[User] 1---* [AuditLog]
[AdminAccount] (admin login)
```

## 4.5 Rationale
- Cloud Postgres ensures reliability and scalability (Patel & Kumar, 2022)
- Prisma ORM provides type safety and migration control (Lee & Smith, 2020)
- Next.js enables rapid development and SSR/SPA flexibility

## 4.6 Security Design
- Passwords are hashed
- Role-based access enforced in all API routes
- Environment variables for all secrets

---

**References**
- Patel, S., & Kumar, V. (2022). Cloud Databases in Education. *Cloud Computing Journal*, 10(4), 200-210.
- Lee, K., & Smith, J. (2020). ORM Frameworks in Web Development. *Software Engineering Review*, 14(2), 55-67.