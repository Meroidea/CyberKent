# System Architecture Design
# Hume City Council CyberSafe Services
## Online Scam Detection and Reporting System
### Enterprise SaaS Architecture Proposal (Version 1.0)

---

# Executive Summary

The **Online Scam Detection and Reporting System** is designed as an enterprise-grade, cloud-native Software-as-a-Service (SaaS) platform that enables citizens, businesses, community organizations, and government administrators to securely detect, report, analyze, monitor, and manage scam-related incidents.

The architecture follows a **Modular Monolith with Service-Oriented Boundaries**, allowing the application to remain simple during development while enabling gradual migration toward microservices as the platform grows.

The proposed design prioritizes:

- Security by Design
- Scalability
- Reliability
- Maintainability
- Performance
- Accessibility
- AI Readiness
- Computer Vision Readiness
- Cloud Compatibility
- Future Extensibility

Rather than treating AI as a standalone feature, this architecture positions AI as an independent intelligence layer that enhances multiple system modules without creating tight coupling.

---

# Architectural Principles

The architecture is built upon the following principles.

## Security First

Every component is designed assuming malicious input is inevitable.

Security is implemented at every layer rather than added later.

---

## Modular Design

Every business capability exists as an independent module.

Modules communicate only through well-defined service interfaces.

No module should directly manipulate another module's internal logic.

---

## AI-Native Architecture

Artificial Intelligence is treated as an external intelligence service.

The core application should continue functioning even if AI services become unavailable.

---

## Cloud-Native

Every component should be deployable independently.

The system must support:

- Docker
- Kubernetes
- Load Balancers
- Horizontal Scaling
- Cloud Storage
- CDN
- Managed Databases

---

## API First

Every business capability should expose standardized REST APIs.

Future:

- Mobile Applications
- Desktop Applications
- Third-party integrations

can consume exactly the same APIs.

---

## Event Ready

Although the first version may not require message queues, the architecture reserves event boundaries for future asynchronous processing.

Examples:

- Notifications
- AI Analysis
- Email Sending
- Image Processing
- Threat Intelligence Updates

---

# High-Level System Architecture

```
                               Internet
                                   │
                    HTTPS / TLS 1.3 / WAF
                                   │
                            Reverse Proxy
                             (Nginx/Traefik)
                                   │
                         Load Balancer (Future)
                                   │
                   ┌─────────────────────────────┐
                   │        React Frontend       │
                   └─────────────────────────────┘
                                   │
                         REST API (HTTPS)
                                   │
                   ┌─────────────────────────────┐
                   │     Express API Gateway     │
                   └─────────────────────────────┘
                                   │
        ┌──────────────┬───────────────┬──────────────┐
        │              │               │              │
 Authentication   Business Logic   AI Gateway   File Service
        │              │               │              │
        └──────────────┼───────────────┼──────────────┘
                       │
             PostgreSQL + Prisma ORM
                       │
             Cloud File Storage (Cloudinary)

                       │
                FastAPI AI Platform
                       │
      ┌───────────────┼───────────────────┐
      │               │                   │
 NLP Engine     Computer Vision     Threat Intelligence
      │               │                   │
 OpenAI/Gemini     OpenCV/OCR      VirusTotal/WHOIS
```

---

# Layered Architecture

The application is divided into clearly separated layers.

```
Presentation Layer

↓

Application Layer

↓

Business Logic Layer

↓

Domain Layer

↓

Persistence Layer

↓

Infrastructure Layer

↓

External Services
```

Each layer has a single responsibility.

---

# Frontend Layer

The frontend is responsible only for:

- Presentation
- User interaction
- Client validation
- API communication
- State management

It never contains business logic.

### Main Responsibilities

- Authentication UI
- Dashboard
- Reports
- Analytics
- Notifications
- Evidence Viewer
- Administration
- Maps
- User Profile

---

# API Layer

The Express API acts as the single entry point.

Responsibilities include:

- Authentication
- Validation
- Authorization
- Rate limiting
- Logging
- Routing
- API Versioning

Business logic is never implemented here.

---

# Business Layer

This layer contains all application rules.

Example services:

```
AuthenticationService

UserService

ScamAnalysisService

ReportService

EvidenceService

NotificationService

AlertService

MapService

AnalyticsService

AdministrationService

AuditService

AIServiceGateway
```

Each service owns one business capability.

---

# Database Layer

The database stores only business data.

Major entities include:

```
Users

Roles

Permissions

Reports

Evidence

ReportStatus

RiskScores

ScamCategories

Notifications

Subscriptions

AuditLogs

Alerts

Regions

Resources

AIResults
```

No business logic should exist inside the database.

---

# AI Intelligence Layer

The AI Platform operates independently.

```
Express

↓

AI Gateway

↓

FastAPI

↓

AI Modules
```

Each module exposes REST endpoints.

---

## NLP Module

Responsible for:

- Scam classification
- Email analysis
- SMS analysis
- Message analysis
- Risk explanation

---

## Computer Vision Module

Responsible for:

- Screenshot analysis
- OCR
- Logo recognition
- QR code detection
- Fake document detection
- Image similarity

---

## Threat Intelligence Module

Responsible for:

- URL reputation
- Domain analysis
- IP reputation
- WHOIS lookup
- VirusTotal integration
- Google Safe Browsing

---

## Recommendation Engine

Generates:

- Recovery steps
- Awareness articles
- Similar reports
- Risk mitigation advice

---

# Module Architecture

```
Authentication

↓

Users

↓

Reports

↓

Evidence

↓

Analysis

↓

Alerts

↓

Notifications

↓

Administration

↓

Analytics

↓

Audit

↓

AI
```

Every module owns:

- Controller
- Service
- Validation
- Routes
- Repository
- DTOs
- Models

---

# Request Flow

Example:

```
User submits screenshot

↓

Frontend validates

↓

Express API

↓

Authentication

↓

Validation

↓

Scam Report Service

↓

Evidence Storage

↓

Database

↓

AI Gateway

↓

OCR

↓

Image Analysis

↓

Scam Classification

↓

Risk Score

↓

Recommendation Engine

↓

Database

↓

Notification

↓

Frontend Dashboard
```

---

# Security Architecture

Every request passes multiple security layers.

```
HTTPS

↓

JWT Authentication

↓

Role Verification

↓

Permission Verification

↓

Rate Limiting

↓

Input Validation

↓

Business Rules

↓

Database
```

---

# Authentication Architecture

```
Login

↓

Email Verification

↓

JWT Access Token

↓

Refresh Token

↓

Protected Routes

↓

Role Validation

↓

Permission Validation
```

Future support:

- MFA
- OAuth
- Government Identity Providers

---

# Evidence Processing Pipeline

```
Upload

↓

File Validation

↓

Virus Scan (Future)

↓

Metadata Extraction

↓

Cloud Storage

↓

Database

↓

AI Processing

↓

OCR

↓

Image Analysis

↓

Report Linking
```

---

# Scam Analysis Pipeline

```
Text

↓

Cleaning

↓

Keyword Detection

↓

NLP Analysis

↓

Threat Intelligence

↓

Risk Engine

↓

Confidence Score

↓

Recommendation Engine
```

---

# URL Analysis Pipeline

```
URL

↓

Validation

↓

WHOIS

↓

Safe Browsing

↓

VirusTotal

↓

Pattern Analysis

↓

Domain Age

↓

SSL Verification

↓

Risk Score
```

---

# Analytics Pipeline

```
Reports

↓

Aggregation

↓

Statistics

↓

Regional Trends

↓

Heatmaps

↓

Dashboards
```

---

# Notification Architecture

Notifications should be event-driven.

Supported channels:

- Email
- In-app
- Browser Push (future)
- SMS (future)

---

# Audit Architecture

Every sensitive action is logged.

Examples:

- Login
- Report creation
- Approval
- Rejection
- AI analysis
- Evidence download
- User deletion
- Permission changes

Logs are immutable and retained according to policy.

---

# Scalability Strategy

## Phase 1

Single Docker deployment.

```
Frontend

Backend

Database

Cloud Storage
```

---

## Phase 2

Introduce:

- Redis
- Background Workers
- Queue System

---

## Phase 3

Split into services:

- AI Service
- Notification Service
- Analytics Service

---

## Phase 4

Kubernetes

Horizontal scaling

Auto scaling

CDN

Multiple regions

---

# Future AI Evolution

The architecture reserves dedicated interfaces for:

- LLM-based scam explanation
- AI chatbot
- Fraud pattern detection
- Behavioral analytics
- Predictive scam modelling
- Duplicate report clustering
- Multilingual translation
- Voice-to-text analysis
- Image forgery detection
- Fake website detection

These capabilities can be added without modifying the core business modules.

---

# Reliability Strategy

The system should remain operational even if external services fail.

Examples:

- AI unavailable → Core reporting still works.
- Threat intelligence API offline → Queue lookup and retry later.
- Email provider unavailable → Retry from background worker.
- OCR failure → Store original evidence and allow manual review.

Graceful degradation ensures no critical user workflow is blocked.

---

# Performance Strategy

- Stateless REST APIs
- Database indexing
- Efficient query optimization
- Lazy loading
- Pagination
- Image compression
- CDN-backed file delivery
- HTTP caching where appropriate
- Asynchronous processing for long-running tasks

---

# Deployment Topology

```
Internet
    │
WAF / HTTPS
    │
Reverse Proxy
    │
React Frontend
    │
Express Backend
    │
PostgreSQL
    │
Cloudinary
    │
FastAPI AI Service
    │
External Intelligence APIs
```

---

# Guiding Architectural Principles

Every future enhancement should satisfy the following priorities:

1. Security
2. Reliability
3. Simplicity
4. Modularity
5. Maintainability
6. Scalability
7. Performance
8. Accessibility
9. Observability
10. AI Extensibility

No feature should introduce unnecessary coupling, duplicate business logic, or compromise the integrity of the platform. The architecture should evolve incrementally while preserving clean module boundaries and ensuring the core reporting and cybersecurity services remain stable, secure, and resilient.