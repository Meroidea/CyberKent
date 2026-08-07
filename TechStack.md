# Technology Stack
## Hume City Council CyberSafe Services
### Online Scam Detection and Reporting System

---

# Overview

The **Online Scam Detection and Reporting System** is designed as a modern, cloud-ready, AI-enabled cybersecurity SaaS platform. The technology stack has been carefully selected to meet the project's functional and non-functional requirements while remaining **free, open-source, reliable, secure, scalable, and future-proof**.

The architecture follows a **modular microservice-inspired approach**, allowing future integration of Artificial Intelligence (AI), Computer Vision, Machine Learning, Optical Character Recognition (OCR), and advanced cybersecurity services without requiring major architectural changes.

The selected technologies emphasize:

- High performance
- Enterprise-grade security
- Scalability
- Maintainability
- Developer productivity
- AI readiness
- Cross-platform compatibility

---

# Architecture Overview

```
                    React + TypeScript Frontend
                               │
                    REST API (HTTPS / TLS)
                               │
                Node.js + Express.js Backend
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
 PostgreSQL Database      Cloud Storage        Python AI Service
     (Prisma ORM)         (Evidence Files)     (FastAPI)
                                                   │
                         ┌─────────────────────────┴────────────────────┐
                         │                                              │
                  Computer Vision                              Machine Learning
                  Image Processing                             AI Models
```

---

# Technology Stack

| Layer | Technology | Purpose |
|----------|-----------------------|---------------------------------------------|
| Frontend | React.js | User Interface |
| Language | TypeScript | Type-safe development |
| Build Tool | Vite | Fast development and builds |
| Styling | Tailwind CSS | Responsive UI |
| Component Library | shadcn/ui | Accessible UI components |
| Icons | Lucide React | Modern icon library |
| State Management | React Context API | Global application state |
| Forms | React Hook Form | Form handling |
| Validation | Zod | Input validation |
| Backend | Node.js | Runtime environment |
| Framework | Express.js | REST API development |
| API Style | REST API | Client-server communication |
| Database | PostgreSQL | Relational database |
| ORM | Prisma ORM | Database management |
| Authentication | JWT | Secure authentication |
| Password Encryption | bcrypt | Password hashing |
| File Storage | Cloudinary | Evidence storage |
| Maps | Leaflet + OpenStreetMap | Scam location visualization |
| Charts | Recharts | Analytics dashboard |
| Email | Nodemailer | Email notifications |
| Logging | Winston | Application logging |
| Security | Helmet | HTTP security headers |
| Rate Limiting | Express Rate Limit | API protection |
| Deployment | Docker | Containerization |
| Version Control | Git + GitHub | Source control |
| AI Service | FastAPI (Python) | AI Microservice |
| Computer Vision | OpenCV | Image processing |
| OCR | EasyOCR | Text extraction |
| Deep Learning | PyTorch | Machine learning |
| AI Framework | TensorFlow | Deep learning |
| Environment | Docker Compose | Local development |

---

# Frontend Technologies

## React.js

React is selected because it is the industry-standard library for developing interactive web applications.

### Benefits

- Component-based architecture
- High performance through Virtual DOM
- Large ecosystem
- Easy maintenance
- Scalable application structure
- Excellent community support

React is ideal for:

- Dashboard
- User Profile
- Report Management
- Analytics
- Administration Panel
- Interactive Maps
- Notifications

---

## TypeScript

TypeScript extends JavaScript with static typing.

### Benefits

- Early error detection
- Improved code quality
- Better IntelliSense
- Easier maintenance
- Improved scalability
- Better developer productivity

---

## Vite

Vite is selected as the frontend build tool.

### Benefits

- Extremely fast development server
- Lightning-fast Hot Module Replacement
- Optimized production builds
- Modern ES Modules

---

## Tailwind CSS

Tailwind CSS provides utility-first styling.

### Benefits

- Responsive design
- Clean code
- Highly customizable
- Minimal CSS maintenance
- Excellent performance

---

## shadcn/ui

Provides professional, accessible UI components.

Benefits include:

- WCAG accessibility
- Modern design
- Reusable components
- Dark mode support
- Minimal dependencies

---

# Backend Technologies

## Node.js

Node.js provides a high-performance JavaScript runtime suitable for scalable web applications.

### Benefits

- Non-blocking architecture
- Event-driven
- Fast API development
- Huge package ecosystem
- Excellent API integration

---

## Express.js

Express.js is used to develop RESTful APIs.

### Benefits

- Lightweight
- Flexible
- Fast
- Easy routing
- Middleware support
- Secure architecture

---

## REST API

REST APIs provide communication between frontend and backend.

Advantages include:

- Stateless communication
- Easy integration
- Platform independent
- Mobile friendly
- AI service friendly

---

# Database

## PostgreSQL

PostgreSQL is selected instead of MySQL because it provides superior enterprise features.

### Advantages

- ACID compliance
- Advanced indexing
- JSON support
- Strong security
- Better concurrency
- Excellent scalability
- Full SQL compliance

PostgreSQL is ideal for:

- User management
- Scam reports
- Evidence metadata
- Audit logs
- Notifications
- Analytics
- Risk scores

---

## Prisma ORM

Prisma simplifies database interaction.

### Benefits

- Type-safe queries
- Migration management
- Auto-generated models
- Easy maintenance
- Reduced SQL complexity

---

# Authentication & Security

## JWT Authentication

Authentication is implemented using JSON Web Tokens.

Features:

- Secure login
- Stateless authentication
- Refresh Tokens
- Session management

---

## bcrypt

Passwords are never stored in plaintext.

bcrypt provides:

- Secure hashing
- Salt generation
- Resistance against brute-force attacks

---

## Helmet

Helmet secures HTTP headers.

Protection includes:

- Clickjacking
- MIME sniffing
- XSS mitigation
- Content Security Policy

---

## Express Rate Limit

Protects against:

- API abuse
- Brute-force attacks
- DDoS attempts

---

## HTTPS

All communication uses:

- SSL/TLS Encryption
- Secure API communication
- Encrypted authentication tokens

---

# File Storage

## Cloudinary

Cloudinary is selected for evidence storage.

Stores:

- Images
- Screenshots
- Documents
- Evidence files

Advantages

- Free tier
- CDN delivery
- Image optimization
- Secure uploads
- Easy API integration

The database stores only file metadata and secure URLs.

---

# Maps

## Leaflet

Interactive mapping library.

Used for:

- Scam hotspots
- Community reports
- Regional alerts

---

## OpenStreetMap

Provides free map tiles.

Advantages

- No licensing fees
- Open source
- Community maintained

---

# Charts & Analytics

## Recharts

Used for:

- Risk score visualization
- Scam trends
- Dashboard analytics
- Report statistics
- User activity graphs

---

# Email Service

## Nodemailer

Provides:

- Email verification
- Password reset
- Notification emails
- Report status updates

---

# Logging

## Winston

Logs:

- Errors
- User activity
- Security events
- System events
- Audit logs

---

# Version Control

## Git

Tracks:

- Source code
- Branches
- Releases

---

## GitHub

Used for:

- Collaboration
- Pull Requests
- CI/CD
- Version history
- Documentation

---

# Containerization

## Docker

Docker packages the application into portable containers.

Benefits:

- Consistent environments
- Easy deployment
- Scalability
- Isolation
- Cloud readiness

---

# AI & Computer Vision Architecture

To ensure future scalability, Artificial Intelligence components are separated into a dedicated Python microservice.

```
React Frontend
        │
        ▼
Express API
        │
        ▼
FastAPI AI Service
        │
        ├── OpenCV
        ├── EasyOCR
        ├── PyTorch
        ├── TensorFlow
        └── AI Models
```

This architecture allows AI models to evolve independently from the main application.

---

# Future AI Technologies

## FastAPI

Acts as the AI service.

Benefits:

- High performance
- Async support
- Easy API development
- Python ecosystem compatibility

---

## OpenCV

Used for:

- Screenshot analysis
- Image enhancement
- Logo detection
- QR code detection
- Image preprocessing
- Duplicate image detection

---

## EasyOCR

Extracts text from:

- Scam screenshots
- Emails
- SMS
- Fake invoices
- Payment receipts

---

## PyTorch

Supports:

- Deep learning
- NLP
- Image classification
- Scam prediction models

---

## TensorFlow

Future uses include:

- Object detection
- Computer Vision
- AI classification
- Neural networks

---

# Future AI Features

The proposed architecture supports future integration of:

- Scam text classification
- Email phishing detection
- URL risk prediction
- Image forgery detection
- Screenshot scam analysis
- Duplicate report detection
- AI-powered chatbot
- OCR-based evidence extraction
- Cybersecurity recommendation engine
- Threat intelligence integration
- Risk prediction models
- Natural Language Processing (NLP)
- Large Language Models (LLMs)

---

# External API Integration

The system architecture supports integration with:

- VirusTotal API
- Google Safe Browsing API
- AbuseIPDB API
- WHOIS Lookup API
- OpenAI API
- Google Gemini API
- Anthropic Claude API
- Local LLMs (Ollama)
- Government cybersecurity services
- Email reputation services

---

# Deployment Stack

| Component | Technology |
|------------|------------|
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database | Neon PostgreSQL |
| File Storage | Cloudinary |
| Source Control | GitHub |
| Containerization | Docker |
| Monitoring | UptimeRobot |

---

# Why This Technology Stack?

The selected technology stack satisfies all project requirements by providing:

- Completely free and open-source core technologies
- Enterprise-grade security
- Excellent scalability
- High performance
- Cloud-native architecture
- Easy maintenance
- AI-ready design
- Computer Vision compatibility
- Future Machine Learning integration
- Responsive web application support
- Cross-platform compatibility
- Modern development workflow
- Strong community support
- Long-term maintainability

This architecture enables the Online Scam Detection and Reporting System to evolve from a traditional web application into an intelligent cybersecurity platform capable of leveraging Artificial Intelligence, Computer Vision, Image Processing, and Machine Learning technologies while maintaining security, reliability, and scalability.