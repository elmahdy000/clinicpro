# ClinicPro Rewrite Specification

## Overview

This document defines the requirements to recreate the ClinicPro backend and frontend using:
- `NestJS` for the REST API backend
- `Node.js` runtime
- `Next.js` for the web frontend/dashboard
- `Prisma` ORM for database access
- `PostgreSQL` as the production database (SQLite used for local dev)

The goal is to replace the current Laravel-based ClinicPro backend with a modern TypeScript full-stack app while preserving the current domain models, workflows, and API behaviors.

---

## Target Scope and Features

### Core domain features
- ✅ Role-based user authentication and authorization (JWT + Passport)
- ✅ Clinic departments and doctor profiles
- ✅ Patient management and demographics
- ✅ Appointment scheduling and status tracking
- ✅ Medical records, diagnoses, vital signs, and notes
- ✅ Prescription creation and management
- ✅ File upload support for medical documents
- ✅ Dashboard statistics and recent activity
- ✅ Email OTP verification for patient authentication

### User roles
- ✅ `admin`
- ✅ `doctor`
- ✅ `nurse`
- ✅ `receptionist`
- ✅ `patient`

Each role has appropriate access controls via `@Roles()` decorator and `RolesGuard`.

---

## Architecture

### Monorepo structure
```
clinicpro/
  api/               # NestJS backend ✅
  web/               # Next.js frontend ❌ (not yet created)
  prisma/            # Prisma schema and migrations ✅
  package.json       # workspace scripts ✅
  README.md          ✅
  CLINICPRO_REWRITE_SPEC.md
```

### Backend: NestJS ✅
- ✅ `@nestjs/core`, `@nestjs/common` — core framework
- ✅ `@nestjs/jwt` / `@nestjs/passport` + `passport-jwt` — auth
- ✅ `class-validator` / `class-transformer` — DTO validation
- ✅ `@prisma/client` — database access
- ✅ `@nestjs/config` — environment config
- ✅ `bcrypt` — password hashing
- ✅ `nodemailer` — email (OTP)
- ✅ `multer` / `@nestjs/platform-express` — file uploads

### Frontend: Next.js ❌
- `next`, `react`, `react-dom` — not yet installed
- `next-auth` or custom auth — not yet implemented
- Role-based pages and dashboard UI — not yet built

### Database
- Prisma schema with 9 models ✅
- SQLite for local dev (PostgreSQL for production) ✅
- Seed script with comprehensive test data ✅

---

## Backend Modules — Status

### Authentication module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `POST /api/auth/register` | Public | ✅ |
| `POST /api/auth/login` | Public | ✅ |
| `POST /api/auth/logout` | Authenticated | ✅ |
| `GET /api/auth/me` | Authenticated | ✅ |
| `POST /api/auth/send-otp` | Public | ✅ |
| `POST /api/auth/verify-otp` | Public | ✅ |

### Dashboard module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `GET /api/dashboard/stats` | Authenticated | ✅ |
| `GET /api/dashboard/recent-activity` | Authenticated | ✅ |

### Departments module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `GET /api/departments` | Authenticated | ✅ |
| `POST /api/departments` | Admin | ✅ |
| `GET /api/departments/:id` | Authenticated | ✅ |
| `PUT /api/departments/:id` | Admin | ✅ |
| `DELETE /api/departments/:id` | Admin | ✅ |

### Doctors module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `GET /api/doctors` | Authenticated | ✅ |
| `POST /api/doctors` | Admin | ✅ |
| `GET /api/doctors/:id` | Authenticated | ✅ |
| `PUT /api/doctors/:id` | Admin | ✅ |
| `DELETE /api/doctors/:id` | Admin | ✅ |
| `GET /api/doctors/:id/appointments` | Authenticated | ✅ |

### Patients module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `GET /api/patients` | Admin, Doctor, Nurse, Receptionist | ✅ |
| `POST /api/patients` | Admin, Receptionist | ✅ |
| `GET /api/patients/:id` | Admin, Doctor, Nurse | ✅ |
| `PUT /api/patients/:id` | Admin, Receptionist | ✅ |
| `DELETE /api/patients/:id` | Admin | ✅ |
| `GET /api/patients/:id/appointments` | Admin, Doctor, Nurse | ✅ |

### Appointments module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `GET /api/appointments` | Authenticated | ✅ |
| `POST /api/appointments` | Admin, Doctor, Receptionist | ✅ |
| `GET /api/appointments/:id` | Authenticated | ✅ |
| `PUT /api/appointments/:id` | Admin, Doctor, Receptionist | ✅ |
| `DELETE /api/appointments/:id` | Admin | ✅ |
| `GET /api/appointments/today` | Authenticated | ✅ |
| `GET /api/appointments/upcoming` | Authenticated | ✅ |

### Medical Records module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `GET /api/medical-records` | Authenticated | ✅ |
| `POST /api/medical-records` | Admin, Doctor | ✅ |
| `GET /api/medical-records/:id` | Authenticated | ✅ |
| `PUT /api/medical-records/:id` | Admin, Doctor | ✅ |
| `DELETE /api/medical-records/:id` | Admin | ✅ |

### Prescriptions module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `GET /api/prescriptions` | Authenticated | ✅ |
| `POST /api/prescriptions` | Admin, Doctor | ✅ |
| `GET /api/prescriptions/:id` | Authenticated | ✅ |
| `PUT /api/prescriptions/:id` | Admin, Doctor | ✅ |
| `DELETE /api/prescriptions/:id` | Admin | ✅ |

### Upload module ✅
| Route | Guard | Status |
|-------|-------|--------|
| `POST /api/upload/medical-document` | Admin, Doctor, Nurse | ✅ |
| `DELETE /api/files/:id` | Admin | ✅ |

---

## Seeded Test Data

| Entity | Count | Details |
|--------|-------|---------|
| Departments | 7 | Cardiology, Neurology, Orthopedics, Pediatrics, General Medicine, Dermatology, Ophthalmology |
| Users | 17 | 1 admin, 5 doctors, 2 nurses, 1 receptionist, 8 patients |
| Doctors | 5 | Linked to departments with specializations |
| Patients | 8 | Full demographics, allergies, medical history |
| Appointments | 15 | Mix of PENDING, CONFIRMED, COMPLETED, CANCELLED (some past, some future) |
| Medical Records | 7 | Linked to appointments with diagnoses and vital signs |
| Prescriptions | 7 | With medication arrays and instructions |
| File Uploads | 4 | Sample medical document records |
| OTP Verifications | 2 | For testing OTP flow |

### Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clinicpro.com | admin123 |
| Doctor | doctor1@clinicpro.com | doctor123 |
| Patient | patient1@clinicpro.com | patient123 |

---

## Frontend Page Structure (TODO)

### Public pages
- `/login` ❌
- `/register` ❌
- `/verify-otp` ❌

### Protected pages
- `/dashboard` ❌
- `/departments` ❌
- `/doctors` ❌
- `/patients` ❌
- `/appointments` ❌
- `/medical-records` ❌
- `/prescriptions` ❌
- `/upload` ❌
- `/profile` ❌

### Role-specific pages
- Admin dashboard and management pages ❌
- Doctor schedule view and patient record access ❌
- Receptionist appointment booking and patient intake ❌
- Patient portal for appointment history and prescriptions ❌

---

## Environment Variables

### Backend (`api/.env`) ✅
```env
DATABASE_URL=file:D:/clinicpro_app/prisma/dev.db   # SQLite for local dev
JWT_SECRET=devsecret
JWT_EXPIRES_IN=3600s
PORT=3000
```

### Frontend (`web/.env.local`) ❌
Still needs to be created alongside the frontend:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000
```

---

## Development Workflow — Status

1. ✅ Install dependencies in `api/`
2. ✅ Configure `api/.env`
3. ✅ Run Prisma migrations (`npx prisma migrate dev --name init`)
4. ✅ Run seed (`npx prisma db seed`)
5. ✅ Start backend (`npm run dev` — running on port 3000)
6. ❌ Create `web/` (Next.js frontend)
7. ❌ Start frontend alongside backend

---

## Immediate Next Steps

### Step 1: Build the Next.js Frontend
Create the `web/` directory with:
- Next.js app with App Router (or Pages Router)
- Tailwind CSS for styling
- Axios + SWR for API calls
- Custom auth provider (store JWT, redirect on 401)
- Login/Register pages
- Protected route layout with sidebar navigation
- Dashboard page with stats cards and recent activity
- CRUD pages for departments, doctors, patients, appointments
- Medical records and prescriptions view pages
- File upload page
- Profile page

### Step 2: Integration
- Create `web/.env.local` with API URL
- Add `dev:web` script to root `package.json`
- Test full flow: login → dashboard → CRUD operations

### Step 3: Deployment Prep (later)
- Switch to PostgreSQL for production
- Add Docker Compose for easy spin-up
- Add CI/CD pipeline

---

## Important Notes

- `PostgreSQL` is the production database; `SQLite` is used for local dev via `DATABASE_URL` swap.
- `Prisma` is the single source of truth for database schema.
- The backend runs on `http://localhost:3000/api` and is fully tested with 33 mapped routes.
- All endpoints use `@nestjs/config`, `ValidationPipe`, JWT auth, and role guards.

> **What to do next:** Start building the Next.js frontend at `web/`. The backend is complete and ready to serve the frontend.
