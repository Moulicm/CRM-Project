# Admission Management & CRM System

## Project Overview
A comprehensive **College Admission Management & CRM System** built with FastAPI (Python) backend and React frontend, designed to streamline college admission processes with real-time seat tracking, quota management, and role-based access control.

## Key Features Implemented

### 1. **Dual Authentication System**
-  JWT-based custom authentication (email/password)
-  Emergent-managed Google Social Login (OAuth)
-  Role-based access control (Admin, Admission Officer, Management)
-  Secure password hashing with bcrypt
-  Session management with httpOnly cookies
-  Brute force protection

### 2. **Master Data Management** (Admin Only)
-  Institution Management
-  Campus Management
-  Department Management
-  Program/Branch Management (UG/PG, Regular/Lateral)
-  Academic Year Management

### 3. **Seat Matrix & Quota System**
-  Configure total intake per program
-  Define quotas (KCET, COMEDK, Management)
-  Real-time seat counter per quota
-  Automatic validation: quota seats = total intake
-  Supernumerary seats support
-  Block allocation when quota is full

### 4. **Applicant Management**
-  Create applicants with comprehensive details (15 fields)
-  Category tracking (GM, SC, ST, OBC)
-  Document checklist system (Pending/Submitted/Verified)
-  Marks and qualifying exam tracking
-  View all applicants with filtering

### 5. **Admission Workflow**
-  Government Flow: Allotment number entry with quota validation
-  Management Flow: Manual applicant creation
-  Seat allocation with real-time availability check
-  Document verification tracking
-  Admission confirmation with auto-generated admission numbers
  - Format: `INST/2026/UG/CSE/KCET/0001`
  - Unique and immutable

### 6. **Fee Management**
-  Simple Pending/Paid status tracking
-  Seat confirmed only when fee is paid
-  Fee collection analytics

### 7. **Analytics Dashboards**
-  Total intake vs admitted statistics
-  Quota-wise filled seats visualization (Bar Chart & Pie Chart)
-  Remaining seats tracking
-  Pending documents list
-  Fee collection and pending fees summary
-  Interactive charts with Recharts

### 8. **Critical System Rules** (All Implemented )
1.  No seat overbooking - quota enforcement
2.  Quota seats cannot exceed intake
3.  Real-time seat counter updates
4.  Admission number generated only once
5.  Admission confirmed only if fee paid

##  Technical Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB with Motor (async driver)
- **Authentication:** JWT + bcrypt + Emergent OAuth
- **Key Libraries:** pydantic, httpx, python-jose

### Frontend
- **Framework:** React 19
- **Routing:** React Router v7
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **HTTP Client:** Axios
- **State Management:** React Context API

##  Project Structure

```
/app/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── seed_data.py           # Database seeding script
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.js     # Authentication state management
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── AuthCallback.js
│   │   │   └── ui/                # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── DashboardStats.js
│   │   │   │   ├── InstitutionManager.js
│   │   │   │   ├── ProgramManager.js
│   │   │   │   └── SeatMatrixManager.js
│   │   │   ├── officer/
│   │   │   │   ├── OfficerDashboard.js
│   │   │   │   ├── ApplicantList.js
│   │   │   │   ├── CreateApplicant.js
│   │   │   │   └── AdmissionWorkflow.js
│   │   │   └── management/
│   │   │       └── ManagementDashboard.js
│   │   ├── App.js             # Main routing
│   │   └── index.js
│   ├── package.json
│   └── .env
└── memory/
    └── test_credentials.md    # Test login credentials
```

##  Test Credentials

### Admin Account
- **Email:** admin@college.edu
- **Password:** Admin@123
- **Role:** Admin
- **Access:** Full system configuration and all features

### Demo Data (Seeded)
- 1 Institution (Karnataka Engineering College)
- 1 Campus (Main Campus)
- 3 Departments (CSE, ECE, MECH)
- 3 Programs (B.Tech programs)
- 1 Academic Year (2025-2026)
- 3 Seat Matrices with quota configurations
- 3 Sample Applicants
- 1 Confirmed Admission

##  API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/google-session` - Exchange Google session
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Master Data
- `GET/POST /api/masters/institutions`
- `GET/POST /api/masters/campuses`
- `GET/POST /api/masters/departments`
- `GET/POST /api/masters/programs`
- `GET/POST /api/masters/academic-years`

### Seat Matrix
- `GET/POST /api/seats/matrix`
- `GET /api/seats/matrix/{program_id}/{academic_year_id}`
- `GET /api/seats/availability/{program_id}/{academic_year_id}/{quota_type}`

### Applicants
- `GET/POST /api/applicants`
- `GET /api/applicants/{applicant_id}`
- `PUT /api/applicants/{applicant_id}/documents`

### Admissions
- `POST /api/admissions/allocate`
- `POST /api/admissions/confirm`
- `POST /api/admissions/{admission_id}/mark-fee-paid`
- `GET /api/admissions`

### Dashboard
- `GET /api/dashboard/stats`

##  User Roles & Access

### 1. Admin
- Full access to all features
- Configure master data (institutions, campuses, departments, programs)
- Set up seat matrices and quotas
- View comprehensive analytics
- **Dashboard:** `/admin/dashboard`

### 2. Admission Officer
- Create and manage applicants
- Allocate seats with quota validation
- Verify documents
- Confirm admissions
- Mark fee payments
- View analytics
- **Dashboard:** `/officer/dashboard`

### 3. Management (View-Only)
- View analytics dashboards
- Monitor admission progress
- Track fee collections
- View pending documents
- **Dashboard:** `/management/dashboard`

##  System Validations

1. **Email Validation:** Proper email format enforced
2. **Password Strength:** Minimum 6 characters
3. **Quota Balance:** Total quota seats must equal intake
4. **Seat Availability:** Real-time check before allocation
5. **Document Verification:** All documents must be verified before confirmation
6. **Fee Requirement:** Admission confirmed only when fee is paid
7. **Unique Admission Numbers:** Auto-generated and immutable

##  Key Highlights

1. **Professional UI/UX:** Clean, modern design with professional blue/white theme
2. **Real-time Updates:** Seat counters update instantly
3. **Role-based UI:** Different dashboards for different roles
4. **Responsive Design:** Works on desktop and mobile
5. **Comprehensive Validation:** Client-side and server-side validation
6. **Error Handling:** User-friendly error messages
7. **Loading States:** Proper loading indicators throughout
8. **Data Visualization:** Interactive charts for analytics

##  User Workflows

### Journey 1: System Setup (Admin)
1. Login as admin
2. Create institution → Campus → Department → Program
3. Define academic year
4. Configure seat matrix with quotas

### Journey 2: Government Admission (Officer)
1. Create applicant with allotment details
2. Select quota (KCET/COMEDK)
3. System checks availability
4. Allocate seat
5. Verify documents
6. Mark fee as paid
7. Confirm admission → Generate admission number

### Journey 3: Management Admission (Officer)
1. Create applicant manually
2. Select program & Management quota
3. Check seat availability
4. Allocate seat
5. Verify documents
6. Mark fee as paid
7. Confirm admission

### Journey 4: Monitoring (Management)
1. Login and view dashboard
2. Check filled seats by quota
3. Monitor remaining seats
4. Review pending documents and fees

##  Technologies & Libraries Used

### Backend Dependencies
- fastapi==0.110.1
- motor==3.3.1 (MongoDB async driver)
- pydantic>=2.6.4
- bcrypt==4.1.3
- pyjwt>=2.10.1
- python-jose>=3.3.0
- httpx (for Google OAuth)
- python-dotenv>=1.0.1

### Frontend Dependencies
- react: ^19.0.0
- react-router-dom: ^7.5.1
- axios: ^1.8.4
- @radix-ui/* (UI primitives)
- recharts: ^3.6.0
- tailwindcss: ^3.4.17
- lucide-react: ^0.507.0

##  Additional Features

- **Auto-seeding:** Demo data automatically populated
- **Test-ready:** All forms have data-testid attributes
- **Accessibility:** Proper ARIA labels and semantic HTML
- **SEO-friendly:** Proper meta tags and structure
- **Performance:** Optimized queries and lazy loading
- **Security:** CORS configuration, httpOnly cookies, brute force protection

##  Database Collections

1. **users** - User accounts with roles
2. **institutions** - Educational institutions
3. **campuses** - Campus locations
4. **departments** - Academic departments
5. **programs** - Academic programs/courses
6. **academic_years** - Academic year definitions
7. **seat_matrices** - Seat allocation configurations
8. **applicants** - Student applicants
9. **admissions** - Confirmed admissions
10. **user_sessions** - OAuth sessions
11. **password_reset_tokens** - Password reset tokens
12. **login_attempts** - Brute force tracking

##  Deployment Ready

-  Environment variables configured
-  CORS properly set up
-  Production-ready error handling
-  MongoDB indexes created
-  Services running via supervisor
-  Logging configured

##  Notes

- All MongoDB documents use custom IDs (not ObjectId) to avoid JSON serialization issues
- Frontend uses REACT_APP_BACKEND_URL from .env for all API calls
- Backend binds to 0.0.0.0:8001 (mapped externally)
- Google OAuth callback handled synchronously to prevent race conditions
- Real-time seat validation prevents overbooking
- Admission numbers follow institutional format standards

--
