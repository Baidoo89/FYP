# Chapter 5: Implementation & Technologies

## 5.1 Overview
The system is implemented using a modular, component-based approach for maintainability and scalability.

## 5.2 Frontend Implementation
- Built with Next.js and React
- Uses functional components and hooks
- Responsive design for all devices

## 5.3 Backend Implementation
- Next.js API routes handle all business logic
- Prisma ORM manages all database access
- Secure authentication and session management

## 5.4 Database Implementation
- Prisma schema defines all models and relations
- Migrations ensure DB structure matches code
- Neon Postgres provides cloud reliability

## 5.5 Security Implementation
- Passwords are hashed using bcrypt
- All sensitive actions require authentication and proper role
- Environment variables used for all secrets

## 5.6 Deployment
- Local: `.env.local` for secrets, `npm run dev` for development
- Production: Environment variables set in deployment platform, push to `main` triggers deployment

---

**References**
- NIST. (2020). Digital Identity Guidelines. *NIST Special Publication 800-63B*.
- Lee, K., & Smith, J. (2020). ORM Frameworks in Web Development. *Software Engineering Review*, 14(2), 55-67.