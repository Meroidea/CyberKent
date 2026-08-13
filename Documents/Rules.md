# Development Rules & Standards
## Hume City Council CyberSafe Services
### Online Scam Detection and Reporting System

---

# Purpose

This document defines the mandatory development standards, architectural principles, coding practices, security requirements, UI/UX guidelines, AI integration rules, and workflow expectations that **every developer, AI coding agent, and contributor** must strictly follow throughout the project lifecycle.

These rules ensure that the system remains:

- Secure
- Scalable
- Maintainable
- Modular
- Consistent
- Accessible
- Production-ready
- AI-ready

Failure to follow these rules may result in security vulnerabilities, inconsistent code, technical debt, and reduced system maintainability.

---

# 1. General Development Principles

## Rule 1.1 — Build for Long-Term Maintainability

The project must be developed with long-term maintainability as the highest priority.

The codebase should be easy to:

- Read
- Understand
- Extend
- Debug
- Test
- Refactor

Every design decision should favor simplicity over unnecessary complexity.

---

## Rule 1.2 — Follow SOLID Principles

All backend services should follow SOLID principles.

- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution Principle
- Interface Segregation Principle
- Dependency Inversion Principle

Business logic must never become tightly coupled.

---

## Rule 1.3 — Avoid Code Duplication

Never duplicate code.

If identical logic appears more than once, it must be extracted into:

- Utility functions
- Helper methods
- Services
- Shared components
- Custom hooks
- Middleware

---

## Rule 1.4 — Prefer Composition Over Inheritance

Favor reusable components and composition instead of deep inheritance hierarchies.

---

## Rule 1.5 — Keep Functions Small

Functions should ideally perform **one responsibility only**.

Recommended size:

- 20–40 lines maximum

Large functions should be split into smaller reusable functions.

---

# 2. Project Architecture Rules

## Rule 2.1 — Modular Architecture

Every feature must exist inside its own module.

Example:

```
Authentication

User

Reports

Evidence

Notifications

Analytics

Admin

AI

Maps
```

Modules must not directly depend on unrelated modules.

---

## Rule 2.2 — Clear Layer Separation

The project should maintain strict separation between:

```
Presentation Layer

↓

API Layer

↓

Business Logic Layer

↓

Database Layer
```

Business logic must never exist inside controllers.

---

## Rule 2.3 — Service-Based Architecture

Controllers should only:

- Receive requests
- Validate requests
- Call services
- Return responses

All business logic belongs inside services.

---

## Rule 2.4 — Repository Pattern

Database queries should be abstracted using Prisma repositories or services.

Never scatter raw database queries throughout the project.

---

# 3. Frontend Rules

## Rule 3.1 — Component-Based Development

Every UI element must be reusable.

Example:

```
Button

Input

Card

Modal

Alert

Badge

Sidebar

Navbar

Table

Pagination
```

---

## Rule 3.2 — Never Duplicate Components

If multiple pages use identical UI, create a reusable component.

---

## Rule 3.3 — Mobile-First Design

Every screen must be fully responsive.

Support:

- Mobile
- Tablet
- Desktop

---

## Rule 3.4 — Accessibility

Every page must comply with WCAG 2.1 AA guidelines.

Requirements:

- Keyboard navigation
- Screen reader compatibility
- Proper labels
- High contrast
- Visible focus states

---

## Rule 3.5 — Consistent Design System

Use:

- Same spacing
- Same typography
- Same button styles
- Same colors
- Same icon sizes
- Same shadows
- Same border radius

Never invent new UI styles for individual pages.

---

# 4. Backend Rules

## Rule 4.1 — RESTful API Standards

Follow REST conventions.

Examples:

```
GET

POST

PUT

PATCH

DELETE
```

Avoid inconsistent endpoint naming.

---

## Rule 4.2 — Consistent Response Format

Every API response should follow a consistent structure.

Example:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "errors": []
}
```

---

## Rule 4.3 — Validate Every Request

Never trust client input.

Every request must be validated before processing.

Use:

- Zod
- TypeScript
- Server-side validation

---

## Rule 4.4 — Centralized Error Handling

Never expose raw errors.

Use centralized error middleware.

Return meaningful messages while hiding implementation details.

---

# 5. Database Rules

## Rule 5.1 — Normalized Database Design

Maintain normalization up to Third Normal Form (3NF).

Avoid unnecessary duplication.

---

## Rule 5.2 — Foreign Keys

Every relationship must use proper foreign key constraints.

---

## Rule 5.3 — Soft Deletes

Important records should be soft deleted whenever possible.

Never permanently remove critical audit information.

---

## Rule 5.4 — Database Migrations Only

Never manually modify production database schemas.

All schema changes must use Prisma migrations.

---

# 6. Security Rules

## Rule 6.1 — HTTPS Only

Every API must use HTTPS.

No insecure HTTP communication.

---

## Rule 6.2 — Never Store Plain Passwords

Passwords must always use bcrypt hashing.

---

## Rule 6.3 — Role-Based Access Control

Every protected endpoint must verify:

- Authentication
- Authorization
- User role
- Permissions

---

## Rule 6.4 — Prevent Common Web Attacks

Protect against:

- SQL Injection
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Command Injection
- Directory Traversal
- Clickjacking
- Brute Force attacks

---

## Rule 6.5 — Secure File Uploads

Uploaded files must be validated.

Verify:

- MIME type
- Extension
- File size
- Malware (future integration)

Never execute uploaded files.

---

## Rule 6.6 — Secrets Management

Never hardcode:

- API Keys
- Passwords
- Tokens
- Database credentials

Use environment variables.

---

## Rule 6.7 — Logging

Never log:

- Passwords
- JWT Tokens
- API Keys
- Credit card information
- Personal sensitive information

---

# 7. Performance Rules

## Rule 7.1 — Optimize Database Queries

Avoid:

- N+1 queries
- Unnecessary joins
- Full table scans

Use indexes where appropriate.

---

## Rule 7.2 — Lazy Loading

Load heavy data only when required.

---

## Rule 7.3 — Pagination

Every large dataset must use pagination.

Never load thousands of records simultaneously.

---

## Rule 7.4 — Optimize Images

Compress uploaded images before storage.

---

# 8. AI Integration Rules

## Rule 8.1 — AI Must Be Isolated

AI functionality must run inside a dedicated Python FastAPI service.

Never embed AI models directly into the Node.js backend.

---

## Rule 8.2 — AI Must Be Replaceable

Every AI service should be modular.

Models should be replaceable without affecting the main application.

---

## Rule 8.3 — AI Must Be Explainable

Every AI-generated result should include:

- Risk score
- Confidence level
- Explanation
- Evidence used

---

## Rule 8.4 — Human Verification

AI recommendations should support—not replace—human decision-making.

Administrative actions must always remain reviewable by authorized users.

---

# 9. Computer Vision Rules

Future computer vision modules should remain independent.

Possible modules include:

- OCR
- QR detection
- Logo recognition
- Screenshot analysis
- Image similarity
- Forgery detection

Each module should expose REST APIs.

---

# 10. API Integration Rules

External services should always be accessed through dedicated service classes.

Never call external APIs directly inside controllers.

Supported future integrations include:

- VirusTotal
- Google Safe Browsing
- AbuseIPDB
- WHOIS
- OpenAI
- Gemini
- Claude

---

# 11. Testing Rules

Every new feature should include:

- Unit tests
- Integration tests
- API tests

Critical business logic should never be released without testing.

---

# 12. Documentation Rules

Every module must include documentation covering:

- Purpose
- Inputs
- Outputs
- Dependencies
- API endpoints
- Data models

Complex algorithms should include inline explanations.

---

# 13. Git & Version Control Rules

Use feature branches.

Example:

```
feature/authentication

feature/report-analysis

feature/notifications

bugfix/login

hotfix/security
```

Commit messages should follow a consistent format.

Example:

```
feat:

fix:

refactor:

docs:

test:

style:

perf:

chore:
```

---

# 14. UI/UX Standards

The interface should be:

- Clean
- Minimal
- Professional
- Modern
- Consistent
- Accessible
- Responsive

Avoid visual clutter.

Animations should be subtle and purposeful.

---

# 15. Code Quality Standards

Every pull request should satisfy:

- No duplicated code
- No unused imports
- No unused variables
- No console logs in production
- No commented-out dead code
- TypeScript without `any` unless justified
- Clear variable and function names
- Proper formatting
- Linting passes
- Build passes

---

# 16. Scalability Rules

The architecture must support future integration of:

- Mobile applications
- Desktop applications
- AI services
- Machine Learning
- Computer Vision
- OCR
- Multiple databases
- Load balancing
- Caching
- Microservices
- Cloud deployment

Avoid implementation decisions that would make future expansion difficult.

---

# 17. Ethical & Privacy Requirements

The system must:

- Protect user privacy
- Minimize personal data collection
- Provide transparent AI outputs
- Support account deletion requests
- Log administrative actions
- Avoid biased or discriminatory scoring
- Clearly communicate that assessment results are advisory and not professional cybersecurity certification

---

# 18. Final Development Rule

Every implementation should satisfy the following priorities, in order:

1. Security
2. Correctness
3. Reliability
4. Maintainability
5. Scalability
6. Performance
7. Accessibility
8. User Experience
9. Readability
10. Future AI compatibility

If any proposed solution compromises a higher-priority principle to improve a lower-priority one, the higher-priority principle must take precedence.

---

# Definition of Done

A feature is considered complete only when:

- Functional requirements are fully implemented.
- Code follows all architectural and coding standards.
- Security validations are in place.
- Input validation is complete.
- Error handling is implemented.
- Tests pass successfully.
- Documentation is updated.
- Accessibility requirements are met.
- Performance has been considered.
- The implementation is modular, reusable, and production-ready.