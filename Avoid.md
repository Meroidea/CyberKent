# Development Anti-Patterns & Prohibited Practices
## Hume City Council CyberSafe Services
### Online Scam Detection and Reporting System

---

# Purpose

This document defines **everything that developers, AI coding agents, contributors, reviewers, and future maintainers must NEVER do** while working on this project.

These rules are mandatory and exist to protect the project's:

- Security
- Reliability
- Maintainability
- Scalability
- Performance
- Code Quality
- Data Integrity
- Accessibility
- Future AI Compatibility

If any implementation violates these rules, it must be considered **incorrect**, even if it appears to work.

---

# 1. General Development

## ❌ Never write code that "just works"

Every implementation must be:

- Maintainable
- Readable
- Secure
- Modular
- Reusable

Quick hacks are prohibited.

---

## ❌ Never duplicate code

Avoid copy-pasting logic.

Instead create:

- Shared utilities
- Services
- Components
- Hooks
- Middleware

---

## ❌ Never implement business logic inside controllers

Controllers must only:

- Receive requests
- Validate requests
- Call services
- Return responses

Business logic belongs in service classes.

---

## ❌ Never create extremely large files

Avoid:

- 1000-line controllers
- Massive React components
- Huge utility files

Large files should be split into logical modules.

---

## ❌ Never create "God Objects"

No single class, service, or component should control the entire application.

Every module should have a single responsibility.

---

# 2. Architecture

## ❌ Never tightly couple modules

Modules should never directly manipulate another module's internal implementation.

Always communicate through defined interfaces or services.

---

## ❌ Never bypass the architecture

Do not skip layers.

Correct flow:

```
Frontend

↓

Controller

↓

Service

↓

Repository / Prisma

↓

Database
```

Never access the database directly from the frontend or controllers.

---

## ❌ Never introduce unnecessary dependencies

Every dependency must have a clear justification.

Avoid packages that duplicate existing functionality.

---

## ❌ Never build features without considering future scalability

Every implementation should support future expansion.

Avoid solutions that make later AI integration or scaling difficult.

---

# 3. Frontend

## ❌ Never hardcode values

Do not hardcode:

- URLs
- API endpoints
- Colors
- User roles
- Permissions
- Environment values

Use configuration files or constants.

---

## ❌ Never duplicate UI components

If multiple pages use the same interface, create reusable components.

---

## ❌ Never mix business logic with UI

React components should focus on presentation and interaction.

Move complex logic into:

- Services
- Hooks
- Utility functions

---

## ❌ Never ignore responsive design

Every page must work on:

- Mobile
- Tablet
- Desktop

---

## ❌ Never ignore accessibility

Never create interfaces that cannot be used with:

- Keyboard navigation
- Screen readers
- Accessible color contrast

---

# 4. Backend

## ❌ Never trust client input

Assume every request is malicious until validated.

Every input must be validated server-side.

---

## ❌ Never expose internal errors

Do not return:

- Stack traces
- Database errors
- Prisma errors
- File paths
- Server details

Return user-friendly error messages.

---

## ❌ Never return inconsistent API responses

All endpoints must follow the same response structure.

---

## ❌ Never place secrets inside source code

Never commit:

- API keys
- Passwords
- Database credentials
- JWT secrets
- OAuth secrets

Use environment variables.

---

## ❌ Never disable security middleware

Security middleware such as Helmet, rate limiting, CORS, and input validation must not be removed for convenience.

---

# 5. Database

## ❌ Never use raw SQL when Prisma provides an equivalent solution

Raw SQL should only be used when absolutely necessary and must be parameterized.

---

## ❌ Never disable foreign key constraints

Relationships must always maintain referential integrity.

---

## ❌ Never manually edit production databases

All schema changes must use version-controlled migrations.

---

## ❌ Never store unnecessary data

Collect only the information required to deliver the service.

Avoid unnecessary personal information.

---

## ❌ Never store duplicate information

Normalize the database.

Avoid redundant data unless there is a justified performance optimization.

---

# 6. Security

## ❌ Never store passwords in plaintext

Passwords must always be hashed using bcrypt or an equivalent secure algorithm.

---

## ❌ Never expose sensitive information

Do not expose:

- Tokens
- Password hashes
- API keys
- Internal IDs where unnecessary
- Private system details

---

## ❌ Never disable authentication

Every protected endpoint must verify authentication.

---

## ❌ Never skip authorization

Authenticated users must still be checked for permissions.

Authentication and authorization are separate responsibilities.

---

## ❌ Never allow unrestricted file uploads

Validate:

- File type
- MIME type
- Extension
- Size

Reject executable or unsupported files.

---

## ❌ Never rely only on client-side validation

All validation must also occur on the server.

---

## ❌ Never log sensitive information

Never log:

- Passwords
- Tokens
- Cookies
- Credit card information
- Personal identifiers unless operationally necessary

---

# 7. Performance

## ❌ Never fetch unnecessary data

Query only the fields that are required.

---

## ❌ Never load thousands of records at once

Use:

- Pagination
- Filtering
- Search
- Lazy loading

---

## ❌ Never perform heavy processing inside request handlers

Long-running tasks should be delegated to background jobs or dedicated services.

---

## ❌ Never optimize prematurely

Prioritize clear, correct code first.

Optimize only after identifying genuine bottlenecks.

---

# 8. AI Development

## ❌ Never tightly couple AI with business logic

AI services must remain isolated behind dedicated APIs.

The system must continue functioning if AI services are unavailable.

---

## ❌ Never treat AI output as absolute truth

AI results are advisory.

Administrative actions requiring judgment should always remain reviewable by humans.

---

## ❌ Never hardcode prompts or model-specific logic throughout the application

Centralize prompt templates and model integrations.

---

## ❌ Never assume a specific AI provider

The architecture must allow replacement of:

- OpenAI
- Gemini
- Claude
- Local models

without rewriting the application.

---

## ❌ Never block the application while waiting for AI

AI analysis should be asynchronous whenever practical.

---

# 9. Computer Vision

## ❌ Never permanently modify original evidence

Always preserve the original uploaded file.

Image processing should work on copies.

---

## ❌ Never overwrite AI analysis

Store:

- Original evidence
- Processed evidence
- AI outputs

separately.

---

# 10. External Services

## ❌ Never call third-party APIs directly from controllers

All external integrations must go through dedicated service classes.

---

## ❌ Never assume external APIs are always available

Implement:

- Timeouts
- Retries
- Graceful fallbacks
- Error handling

---

## ❌ Never tightly couple business logic to a single provider

Providers should be replaceable with minimal changes.

---

# 11. Code Quality

## ❌ Never commit debugging code

Remove before merging:

- `console.log()`
- Temporary print statements
- Debug-only endpoints
- Commented-out code

---

## ❌ Never use meaningless variable names

Avoid names like:

```
data

temp

value

test

obj

abc
```

Use descriptive names.

---

## ❌ Never ignore linting or type errors

The application must build cleanly without warnings that indicate correctness or maintainability issues.

---

## ❌ Never use the `any` type unnecessarily

Prefer precise TypeScript types.

Use `any` only with documented justification.

---

# 12. Git Workflow

## ❌ Never commit directly to the main branch

Use feature branches and pull requests.

---

## ❌ Never commit generated files unnecessarily

Ignore:

- `node_modules`
- Build artifacts
- Temporary files
- Environment files
- IDE configuration

---

## ❌ Never write vague commit messages

Avoid:

```
fix

update

changes

done

stuff
```

Use descriptive commit messages.

---

# 13. Documentation

## ❌ Never leave undocumented public APIs

Document:

- Endpoints
- Parameters
- Responses
- Error conditions

---

## ❌ Never leave complex logic unexplained

Provide concise comments where the intent is not obvious.

Avoid commenting on trivial code.

---

# 14. User Experience

## ❌ Never surprise the user

Critical actions should:

- Confirm destructive operations
- Display meaningful feedback
- Show loading states
- Handle failures gracefully

---

## ❌ Never expose unfinished features

Hide or disable incomplete functionality until it is production-ready.

---

# 15. Testing

## ❌ Never merge untested critical functionality

Business-critical features should include appropriate automated tests.

---

## ❌ Never ignore regression risks

Changes must not unintentionally break existing functionality.

---

# 16. Project Management

## ❌ Never implement features outside the approved scope without discussion

Major architectural changes or new features should be reviewed before implementation.

---

## ❌ Never sacrifice long-term maintainability for short-term speed

Technical debt should be minimized and documented when unavoidable.

---

# 17. Ethical & Privacy

## ❌ Never present AI results as legal or cybersecurity certification

Clearly state that:

- Results are advisory
- Human review may be required
- The platform does not guarantee protection from scams or cyberattacks

---

## ❌ Never collect or retain unnecessary personal information

Respect data minimization and privacy-by-design principles.

---

# Final Principle

When making implementation decisions, **never choose a solution solely because it is faster to write**.

Every change should be evaluated against these questions:

1. Is it secure?
2. Is it correct?
3. Is it maintainable?
4. Is it scalable?
5. Is it readable?
6. Is it testable?
7. Is it reusable?
8. Does it follow the defined architecture?
9. Does it preserve user privacy?
10. Will it still be a good solution one year from now?

If the answer to any of these questions is "no," the implementation should be reconsidered before it is merged into the project.