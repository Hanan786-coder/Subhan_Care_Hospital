# Subhan Care Hospital Management System (HMS)

Subhan Care HMS is an enterprise-grade Hospital Management System designed to streamline clinical workflows, patient administration, electronic medical records (EMR), pharmacy inventory, appointment scheduling, billing, and system auditing. The platform provides a secure, role-based architecture built with a modern React frontend and a robust Node.js/Express and MongoDB backend.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Seeding](#database-seeding)
  - [Running the Application](#running-the-application)
- [Environment Variables Reference](#environment-variables-reference)
- [Default Demonstration Accounts](#default-demonstration-accounts)
- [API Overview](#api-overview)
- [Security and Compliance](#security-and-compliance)
- [License](#license)

---

## Overview

Subhan Care HMS serves healthcare institutions by centralizing multi-department operations into an integrated digital workspace. The platform reduces administrative overhead, minimizes medical prescription errors, accelerates patient throughput, and enforces stringent access policies to protect sensitive medical information.

---

## Key Features

### Patient Management
- Complete patient registration, demographic tracking, and national identification (CNIC) records.
- Emergency contact tracking, blood group classification, and recorded allergy histories.
- Quick lookup and comprehensive profile overviews with visit history linking.

### Doctor and Staff Management
- Doctor profiles with medical registration/license tracking, clinical qualifications, and consultation fee configuration.
- Flexible scheduling and consultation shift management across days of the week.
- Staff administrative management with role assignments and duty schedules.

### Appointment Scheduling
- Interactive appointment scheduling with conflict prevention across doctor availability windows.
- Appointment lifecycle tracking: Scheduled, Completed, Cancelled, and No-Show statuses.
- Filterable agenda views for receptionists and medical practitioners.

### Clinical Consultations and EMR
- Structured clinical encounter recording (symptoms, vital observations, clinical diagnosis, and follow-up plans).
- Electronic Medical Records (EMR) with version tracking and consultation timeline.
- Direct linking between consultations, prescriptions, and patient billing entries.

### Prescription Management
- Digital prescription generation with drug dosage, administration frequency, duration, and specific instructions.
- Real-time prescription workflow from physician issuance to pharmacy dispensation.
- Automatic inventory linkage upon medicine dispensing.

### Billing and Invoicing
- Itemized invoice creation for consultations, procedures, and pharmaceutical items.
- Discount application, subtotal/total calculations, and balance tracking.
- Multiple payment method support with printable/exportable invoice records.

### Pharmacy and Inventory Management
- Real-time stock tracking with batch numbers, expiry dates, and unit prices.
- Low-stock threshold alerts to ensure uninterrupted pharmaceutical supplies.
- Pharmaceutical supplier database and procurement management.

### Analytics and Reporting
- Operational and financial dashboards with key performance metrics.
- Revenue trends, department distribution, patient demographics, and appointment breakdown charts.
- Summary exports and audit reports for hospital administrators.

### Security and Audit Logging
- Immutable system audit logging capturing all critical create, update, and delete actions with timestamps and IP addresses.
- Role-Based Access Control (RBAC) protecting endpoints and frontend views.
- Secure authentication via JSON Web Tokens (JWT) and bcrypt password hashing.
- Request rate-limiting, security headers (Helmet), and strict input validation.

---

## System Architecture

The application is structured as a decoupled client-server architecture:

```
+------------------------------------------------------------------+
|                           Client Tier                            |
|             React 19 + Vite + React Router + Context API         |
+---------------------------------+--------------------------------+
                                  |
                             HTTPS / JSON
                                  |
+---------------------------------v--------------------------------+
|                         Application Tier                         |
|      Express 5 REST API + JWT Authentication + RBAC Middleware   |
+---------------------------------+--------------------------------+
                                  |
                            Mongoose ODM
                                  |
+---------------------------------v--------------------------------+
|                            Data Tier                             |
|                          MongoDB Database                        |
+------------------------------------------------------------------+
```

---

## Role-Based Access Control (RBAC)

Subhan Care HMS defines five granular user roles:

| Module / Resource | ADMIN | DOCTOR | RECEPTIONIST | PHARMACIST | BILLING_STAFF |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard & Metrics | Full | Clinical | Front Desk | Pharmacy | Financial |
| Patient Profiles | Full Access | Full Access | Full Access | View Only | View Only |
| Doctors Directory | Full Access | View Only | View Only | View Only | View Only |
| Staff Directory | Full Access | No Access | No Access | No Access | No Access |
| Appointment Scheduling | Full Access | View / Update | Full Access | View Only | View Only |
| Consultations & EMR | Full Access | Full Access | No Access | View Only | No Access |
| Prescriptions | Full Access | Issue / View | No Access | Dispense / View | No Access |
| Pharmacy & Inventory | Full Access | No Access | No Access | Full Access | No Access |
| Billing & Invoices | Full Access | No Access | Create / View | No Access | Full Access |
| Reports & Analytics | Full Access | No Access | No Access | No Access | Full Access |
| Audit Logs | Full Access | No Access | No Access | No Access | No Access |
| System Settings | Full Access | Profile Only | Profile Only | Profile Only | Profile Only |

---

## Technology Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router 7
- **HTTP Client**: Axios
- **UI Components & Icons**: Lucide React, React Icons
- **Notifications**: React Hot Toast
- **Styling**: Modular CSS Design System

### Backend
- **Runtime**: Node.js
- **Web Framework**: Express 5
- **Database**: MongoDB via Mongoose ODM
- **Authentication**: JSON Web Tokens (jsonwebtoken), bcryptjs
- **Security Middleware**: Helmet, Express Rate Limit, CORS
- **Logging**: Morgan
- **Email Service**: Nodemailer

---

## Project Directory Structure

```
HMS/
|-- package.json                     # Root orchestrator for concurrent execution
|-- server.js                        # Optional consolidated production server
|-- Subhan_Care_HMS_SRS.md           # Software Requirements Specification (IEEE 29148)
|-- subhan_care_hms_backend/         # Express.js REST API
|   |-- config/                      # Database and environment configurations
|   |-- controllers/                 # Route controllers and business logic
|   |-- middleware/                  # Auth, RBAC, error handling, rate limiting
|   |-- models/                      # Mongoose schemas and data models
|   |-- routes/                      # API endpoint definitions
|   |-- seeders/                     # Initial database seeder script
|   |-- utils/                       # Helper functions and email templates
|   |-- package.json
|   `-- server.js                    # Backend entrypoint
|-- subhan_care_hms_frontend/        # React + Vite client application
|   |-- src/
|   |   |-- components/              # Reusable UI components and charts
|   |   |-- constants/               # Route paths, roles, and status constants
|   |   |-- context/                 # Auth and application state contexts
|   |   |-- hooks/                   # Custom React hooks
|   |   |-- layouts/                 # Dashboard and public page layouts
|   |   |-- pages/                   # Application views and sub-modules
|   |   |-- routes/                  # Protected and public route guards
|   |   |-- services/                # Axios API service layers
|   |   `-- styles/                  # Global styles and CSS variable definitions
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
`-- README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Local MongoDB instance (v6.x+) or a MongoDB Atlas URI

---

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Hanan786-coder/Subhan_Care_Hospital.git
   cd Subhan_Care_Hospital
   ```

2. Install root and sub-project dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd subhan_care_hms_backend
   npm install

   # Install frontend dependencies
   cd ../subhan_care_hms_frontend
   npm install

   # Return to root directory
   cd ..
   ```

---

### Environment Configuration

Configure environment files for both backend and frontend.

#### 1. Backend Configuration
Create a `.env` file inside the `subhan_care_hms_backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/subhan_care_hms
JWT_SECRET=your_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Email SMTP settings (for password reset and notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

#### 2. Frontend Configuration
Create a `.env` file inside the `subhan_care_hms_frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Subhan Care HMS
VITE_SESSION_TIMEOUT=15
```

---

### Database Seeding

Populate the database with initial demonstration users, clinical staff, medicine inventories, and sample patient records:

```bash
cd subhan_care_hms_backend
npm run seed
cd ..
```

---

### Running the Application

You can run both frontend and backend concurrently from the root directory:

```bash
# Start both Backend (Port 5000) and Frontend (Port 5173)
npm start
```

Alternatively, you can run each service individually:

- **Backend only**:
  ```bash
  cd subhan_care_hms_backend
  npm run dev
  ```
  Backend runs at `http://localhost:5000`.

- **Frontend only**:
  ```bash
  cd subhan_care_hms_frontend
  npm run dev
  ```
  Frontend runs at `http://localhost:5173`.

---

## Environment Variables Reference

### Backend (`subhan_care_hms_backend/.env`)

| Variable | Type | Description | Default |
|---|---|---|---|
| `PORT` | Number | Port on which the Express server listens | `5000` |
| `NODE_ENV` | String | Application runtime environment (`development` / `production`) | `development` |
| `MONGO_URI` | String | MongoDB connection string | `mongodb://localhost:27017/subhan_care_hms` |
| `JWT_SECRET` | String | Secret key for signing JSON Web Tokens | Required |
| `JWT_EXPIRES_IN` | String | JWT expiration duration | `7d` |
| `SMTP_HOST` | String | SMTP email server host | `smtp.gmail.com` |
| `SMTP_PORT` | Number | SMTP email server port | `587` |
| `SMTP_USER` | String | SMTP authentication user | Optional |
| `SMTP_PASS` | String | SMTP authentication password / App password | Optional |

### Frontend (`subhan_care_hms_frontend/.env`)

| Variable | Type | Description | Default |
|---|---|---|---|
| `VITE_API_BASE_URL` | String | Base endpoint URL for the backend REST API | `http://localhost:5000/api` |
| `VITE_APP_NAME` | String | Application branding title | `Subhan Care HMS` |
| `VITE_SESSION_TIMEOUT` | Number | Inactivity timeout threshold in minutes | `15` |

---

## Default Demonstration Accounts

The database seeder generates accounts for local testing across all system roles:

| Role | Email | Password | Primary Scope |
|---|---|---|---|
| Administrator | `admin@gmail.com` | `admin123` | Full administrative control, user & staff management, audit logs |
| Doctor | `doctor@gmail.com` | `doctor123` | Clinical consultations, appointments, medical history, e-prescriptions |
| Doctor (Specialist) | `doctor2@gmail.com` | `doctor123` | Clinical consultations, appointments, neurology records |
| Receptionist | `reception@gmail.com` | `reception123` | Patient registration, scheduling appointments, front desk check-in |
| Pharmacist | `pharmacy@gmail.com` | `pharmacy123` | Drug dispensing, inventory management, reorder monitoring |
| Billing Staff | `billing@gmail.com` | `billing123` | Invoice generation, payments processing, revenue and financial reporting |

Note: These credentials are intended strictly for local development and demonstration. Production environments must generate accounts through secure administrator workflows with strong passwords.

---

## API Overview

The backend exposes a standardized RESTful API under the `/api` route prefix:

### Authentication
- `POST /api/auth/login` - Authenticate user and issue JWT
- `POST /api/auth/forgot-password` - Request password reset code
- `POST /api/auth/reset-password` - Reset password with verification token
- `GET  /api/auth/me` - Fetch authenticated user profile

### Patients
- `GET    /api/patients` - List patients with pagination and search
- `POST   /api/patients` - Register a new patient
- `GET    /api/patients/:id` - Retrieve patient details and history
- `PUT    /api/patients/:id` - Update patient information
- `DELETE /api/patients/:id` - Remove patient record (Admin only)

### Doctors & Staff
- `GET  /api/doctors` - List all registered doctors and schedules
- `POST /api/doctors` - Register doctor profile (Admin only)
- `GET  /api/staff` - List clinical and administrative staff
- `POST /api/staff` - Register staff member (Admin only)

### Appointments
- `GET    /api/appointments` - Query scheduled appointments
- `POST   /api/appointments` - Book a new appointment
- `PUT    /api/appointments/:id` - Update appointment status or time slot
- `DELETE /api/appointments/:id` - Cancel or delete appointment

### Consultations & Medical History
- `GET  /api/consultations` - Retrieve clinical consultation records
- `POST /api/consultations` - Create a new consultation record
- `GET  /api/medical-history/:patientId` - Retrieve patient complete medical history

### Prescriptions
- `GET  /api/prescriptions` - List prescriptions (with status filter)
- `POST /api/prescriptions` - Issue new digital prescription
- `PUT  /api/prescriptions/:id/dispense` - Mark prescription items as dispensed

### Billing & Invoices
- `GET  /api/billing/invoices` - Retrieve financial invoices
- `POST /api/billing/invoices` - Generate new patient invoice
- `PUT  /api/billing/invoices/:id/pay` - Record invoice payment

### Inventory & Suppliers
- `GET    /api/inventory` - List pharmacy stock items and thresholds
- `POST   /api/inventory` - Add inventory item
- `PUT    /api/inventory/:id` - Adjust stock quantities and pricing
- `GET    /api/inventory/suppliers` - List pharmaceutical suppliers

### Reports & Auditing
- `GET /api/reports/dashboard` - Retrieve aggregated operational statistics
- `GET /api/reports/financial` - Retrieve financial and revenue summaries
- `GET /api/audit-logs` - Retrieve immutable system activity log (Admin only)

---

## Security and Compliance

- **Role-Based Access Enforcement**: Route-level and UI-level validation ensures users access only authorized resources.
- **Secure Password Hashing**: Passwords stored using industry-standard bcrypt salt and hash algorithms.
- **Session Protection**: Signed JWT tokens verify identity with strict expiration policies.
- **Audit Logging**: All sensitive mutations and access attempts are recorded in an immutable audit ledger.
- **Sanitization & Headers**: Standardized HTTP security headers enforced via Helmet; input rate limiting prevents brute force attempts.

---

## License

This project is licensed under the ISC License. Refer to the repository package metadata for additional details.
