# ![EvalSphere Logo](frontend/public/eval_logo.png) EvalSphere — Event Evaluation & Survey Collector System

A full-stack, production-ready web application for managing events, collecting participant evaluations, and generating analytics.

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Recharts, Axios   |
| Backend    | Node.js, Express.js                             |
| Database   | MySQL 8                                         |
| ORM        | Sequelize v6                                    |
| Auth       | JWT (access + refresh tokens), bcryptjs         |
| Security   | Helmet, CORS, express-rate-limit, Joi           |
| Email      | Nodemailer                                      |
| QR Codes   | qrcode                                          |
| Uploads    | Multer                                          |
| Logging    | Winston                                         |

## Roles
- **Admin** — Full platform control, user management, reports
- **Staff** — Create & manage events, build evaluation forms, view analytics
- **User**  — Browse events, register, submit evaluations

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Clone & setup environment

```bash
# Backend
cd backend
cp .env.example .env        # Edit your DB credentials and secrets
npm install
npm run seed                # Creates tables + seeds demo data
npm run dev                 # Starts on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                 # Starts on http://localhost:5173
```

### 2. Demo credentials (after seeding)
install
| Role  | Email                     | Password   |
|-------|---------------------------|------------|
| Admin | admin@evalsphere.io       | Admin@123  |
| Staff | staff@evalsphere.io       | Staff@123  |
| User  | user@evalsphere.io        | User@123   |

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
PUT    /api/auth/profile
PUT    /api/auth/password
POST   /api/auth/refresh

GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
GET    /api/events/:id/stats
GET    /api/events/:id/qr
POST   /api/events/:id/register

GET    /api/evaluations/event/:eventId
POST   /api/evaluations
GET    /api/evaluations/:id
PUT    /api/evaluations/:id
PATCH  /api/evaluations/:id/publish
POST   /api/evaluations/submit
GET    /api/evaluations/:id/responses
GET    /api/evaluations/:id/analytics
GET    /api/evaluations/:id/qr
GET    /api/evaluations/:id/has-submitted

GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
PATCH  /api/users/:id/toggle-status
POST   /api/users/:id/reset-password

GET    /api/reports/analytics
GET    /api/reports/event/:id
// activity logs endpoint removed

GET    /api/admin/dashboard
```

## Database Schema

```
users                 → id, first_name, last_name, email, password, role, phone, organization, is_active
events                → id, title, description, venue, event_date, category, status, image, created_by
event_attendees       → id, event_id, user_id, registered_at, attended
evaluations           → id, event_id, title, is_anonymous, is_published, created_by
evaluation_questions  → id, evaluation_id, question_text, question_type, options, order_index
evaluation_answers    → id, submission_id, question_id, answer_text, answer_rating, answer_options
submissions           → id, evaluation_id, user_id, average_rating, submitted_at
// notifications and activity_logs tables removed
```

## Folder Structure

```
evalsphere/
├── backend/
│   ├── src/
│   │   ├── config/          # DB + JWT config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, upload, rate-limit, error handler
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Logger, email, QR code
│   │   ├── validators/      # Input validation schemas
│   │   ├── database/        # Seeder
│   │   └── uploads/         # Uploaded files
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/      # StatCard, DataTable, Modal, Pagination
    │   │   └── layout/      # AppLayout, Sidebar, TopBar
    │   ├── context/         # AuthContext
    │   ├── pages/
    │   │   ├── admin/       # Dashboard, Users, Events, Reports
    │   │   ├── staff/       # Dashboard, Events, CreateEvent, FormBuilder, Analytics, QRCodes
    │   │   └── user/        # Dashboard, Events, Evaluate, Submissions, Profile
    │   ├── utils/           # api.js (Axios), helpers.js
    │   └── App.jsx
    └── package.json
```

## Security Features
- JWT access tokens (1 day) + refresh tokens (7 days)
- bcryptjs password hashing (12 rounds)
- Helmet.js security headers
- CORS policy enforcement
- Rate limiting (200 req/15min general, 10 req/15min auth)
- Role-based access control middleware
- SQL injection prevention via Sequelize ORM
- Input validation via express-validator
- Environment variables via dotenv

## License
MIT — Free for personal and commercial use.
