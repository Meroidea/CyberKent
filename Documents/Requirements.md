# Hume City Council CyberSafe Services
## Online Scam Detection and Reporting System

### About the Client
Hume City Council is one of Australia’s fastest-growing municipalities, located 20 kilometres north of Melbourne’s CBD. It covers both established urban areas in the south and rural landscapes in the north, serving a diverse community of over 262,000 residents. Council headquarters are located at 1079 Pascoe Vale Road, Broadmeadows. The municipality is a major economic and transport hub encompassing the Melbourne Airport, the Hume and Calder Highways, and the Western Ring Road.

**Key services and facts about Hume City Council include:**
* **Community Services:** Council provides a wide range of support for residents, including maternal and child health, immunisations, youth assertive outreach (ages 10-24), aged care, and disability support.
* **Environment & Sustainability:** Managing over 160,000 trees, the council leads initiatives like Hume Home Energy Help, climate action planning, and Green Wedge protection.
* **Advocacy & Growth:** As a fast-growing interface council, the local government actively advocates for State and Federal investment in key infrastructure, transport, and community safety projects.

### Project Brief
Online Scam Detection and Reporting System is an online cybersecurity assessment portal designed to help small businesses, community organizations and not-for-profit organizations identify cybersecurity risks and improve their security practices.

The system will allow organizations to complete cybersecurity assessments, receive risk scores, view recommendations, monitor improvements and access cybersecurity awareness resources.

### System Features
In the life of the software development, problem analysis provides a base for design and development phase. The problem is analyzed so that sufficient matter is provided to design a new system. Large problems are sub-divided into smaller once to make them understandable and easy for finding solutions. Same in this project all the task are sub-divided and categorized.

#### System Modules:
* User registration and authentication module
* User profile and privacy module
* Scam checking and analysis module
* URL and contact indicator analysis module
* Scam reporting module
* Evidence management module
* Report review and verification module
* Community scam alert module
* Scam map and trend-analysis module
* Scam awareness and education module
* Notification and subscription module
* Support and recovery guidance module
* Administration and configuration module
* Reporting, analytics and audit module

---

### Functional Requirements
Functional requirements are product features or functions that developers must implement to enable users to accomplish their tasks. So, it’s important to make them clear for the stakeholders. Generally, functional requirements describe system behavior under specific conditions. The developers of this system must enhance the performance and efficiency of the system by adding 15 to 20 more functional requirements. Students need to do their own research to find how they can improve the system and which FRs need to added. The group must need a prior approval from the stakeholders/project supervisor before finalizing these Functional Requirements. These enhanced FRs must be reflected separately in Final SRS Report after the approval.

**Module 1: User Registration and Authentication**
* FR1: User registration
* FR2: Email verification
* FR3: Duplicate email validation
* FR4: User login
* FR5: User logout
* FR6: Password recovery

**Module 2: User Profile and Access Control**
* FR7: Profile viewing
* FR8: Profile updating
* FR9: Password changing
* FR10: Role-based access control
* FR11: Notification preference management
* FR12: Account deletion request

**Module 3: Scam Content Analysis**
* FR13: Suspicious text submission
* FR14: Communication type selection
* FR15: Scam keyword detection
* FR16: Scam risk score calculation
* FR17: Scam risk classification
* FR18: Scam indicator display

**Module 4: URL and Contact Analysis**
* FR19: Suspicious URL submission
* FR20: URL format validation
* FR21: Suspicious URL pattern detection
* FR22: Suspicious phone number submission
* FR23: Suspicious email address submission
* FR24: Reported indicator matching

**Module 5: Scam Report Management**
* FR25: Scam report creation
* FR26: Draft report saving
* FR27: Report field validation
* FR28: Report reference generation
* FR29: Submitted report viewing
* FR30: Report withdrawal

**Module 6: Evidence Management**
* FR31: Evidence file uploading
* FR32: File type validation
* FR33: File size validation
* FR34: Evidence description entry
* FR35: Evidence access restriction
* FR36: Evidence access logging

**Module 7: Report Review and Verification**
* FR37: Review queue display
* FR38: Reviewer assignment
* FR39: Report classification
* FR40: Report severity updating
* FR41: Additional information request
* FR42: Report approval and rejection

**Module 8: Duplicate and Related Report Detection**
* FR43: Duplicate report detection
* FR44: Report text similarity comparison
* FR45: Phone number comparison
* FR46: Email address comparison
* FR47: Website address comparison
* FR48: Related report linking

**Module 9: Community Scam Alerts**
* FR49: Scam alert creation
* FR50: Reporter information anonymisation
* FR51: Scam alert approval
* FR52: Scam alert publication
* FR53: Scam alert searching
* FR54: Scam alert archiving

**Module 10: Scam Awareness and Recovery**
* FR55: Scam awareness resource viewing
* FR56: Resource categorisation
* FR57: Resource searching
* FR58: Scam response checklist display
* FR59: Resource recommendation
* FR60: Recovery action tracking

**Module 11: Notification and Subscription**
* FR61: Report submission notification
* FR62: Report status notification
* FR63: Information request notification
* FR64: Scam category subscription
* FR65: Regional alert subscription
* FR66: Notification unsubscription

**Module 12: Administration, Reporting and Audit**
* FR67: User account management
* FR68: User role management
* FR69: Scam category management
* FR70: Scam report statistics generation
* FR71: De-identified data export
* FR72: User activity logging

---

### Non-Functional Requirements (NFRs)

#### Performance
* 1. The system should load all pages within 3 seconds under normal network conditions.
* 2. The system should support at least 1000 concurrent users.
* 3. The database should respond to queries in less than 2 seconds for up to 100,000 records.

#### Reliability
* 4. The system should maintain 99% uptime excluding scheduled maintenance.
* 5. The system should provide automatic backup of user data daily.
* 6. In case of system failure, the database should restore from the latest backup within 4 hours (without data loss exceeding 24 hours).

#### Security
* 7. The system should use HTTPS (SSL/TLS) for secure data transmission.
* 8. Passwords and sensitive information should be encrypted and never stored in plaintext (e.g., bcrypt password hashing).
* 9. The system should prevent SQL Injection, XSS, and CSRF attacks.
* 10. User sessions should automatically expire after inactivity.
* 11. The system should restrict access to sensitive data based on user roles.

#### Usability
* 12. The system should have an intuitive user interface that requires minimal training for basic operations.
* 13. The system should comply with WCAG 2.1 Level AA guidelines for accessibility.
* 14. The system should support mobile devices (iOS and Android) through a responsive design.
* 15. Form validations should display clear error messages.
* 16. The design should use consistent layouts and colour themes.
* 17. The system should support both desktop and mobile browsers.

#### Maintainability
* 18. The system should follow modular PHP code structure with MVC pattern.
* 19. All functions should be documented for future maintenance.
* 20. The database schema should be normalised up to 3NF for scalability.

#### Scalability
* 21. The system should be able to handle a 20% annual increase in the number of users.
* 22. The system architecture should allow for horizontal scaling of web and database servers.
* 23. The system should support easy migration from single-server MySQL to clustered database architecture.
* 24. The design should allow integration with REST APIs for mobile app extension.

#### Availability
* 25. The system should be available 24 × 7 with scheduled downtime notifications.
* 26. The system should automatically recover from unexpected server shutdowns using error logs.

#### Data Integrity
* 27. The system should ensure consistency between linked tables (foreign-key constraints).
* 28. The system should validate all input before committing to the database.

#### Compliance
* 29. The system should comply with GDPR-like data privacy standards, allowing users to delete their profiles permanently.
* 30. All personal information should be used only for matchmaking purposes.

---

### Ethical Requirements
The system should avoid creating fear or presenting assessment results as professional cybersecurity certification.

The system should clearly state that:
* Results are based on information provided by the organisation
* The assessment provides general guidance
* The portal does not guarantee protection from cyberattacks
* Serious cybersecurity incidents may require assistance from qualified professionals or relevant authorities

The scoring process shall be transparent and shall not unfairly discriminate between organisations based on their size, industry or available resources.

---

### Hardware and Software Requirements
* **Hardware Requirement:** Should be recommended by the developers.
* **Software Requirement:** Should be recommended by the developers.