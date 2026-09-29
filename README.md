# Online Learning Management System (OLMS)

A full-stack Learning Management System for delivering courses, assessments, discussions and live classes. It features role-based access (student, instructor, admin, super admin), OTP/2FA sign-in, an AI chatbot assistant powered by Google Gemini, and video conferencing.

- **Frontend:** React 19 + Vite + Tailwind CSS + MUI
- **Backend:** Flask + MongoDB
- **AI:** Google Gemini

---

## Features

**Authentication & Accounts**
- Email/password sign-up and sign-in with JWT
- Email OTP verification and QR-based 2FA (`pyotp`)
- Forgot password flow
- Role verification / profile completion and admin approval

**Courses & Content**
- Course management (create, update, enroll)
- Content delivery with file uploads
- Course catalog and course detail pages

**Assessments & Grading**
- Create assessments and quizzes
- Student submissions with file attachments
- Instructor grading workflow

**Communication & Collaboration**
- Announcements
- Discussion threads with replies
- Video conferencing and meeting rooms (ZegoCloud UI Kit)

**Insights & Admin**
- Progress tracking with student reports and admin statistics
- User management and approvals
- Dashboard with quick actions
- AI chatbot helper (Google Gemini)
- Knowledge Hub (news)

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite 6, React Router 6, Tailwind CSS 4, MUI 7, Emotion, Framer Motion, react-icons, ZegoCloud UI Kit |
| Backend | Flask, Flask-PyMongo, Flask-Cors, Flask-Bcrypt, PyJWT, Flask-Mail |
| Database | MongoDB |
| AI | Google Gemini (`google-genai`) |
| Auth / Security | JWT, bcrypt, pyotp (TOTP), itsdangerous |
| Tooling | npm, pip, python-dotenv, ESLint |

---

## Architecture

```
React SPA (Vite)  ──HTTP/JSON──►  Flask REST API  ──►  MongoDB
      │                                 │
      │                                 ├──► Google Gemini (AI chatbot)
   Vercel (static)                Flask-Mail (OTP / verification emails)
                                          └── File uploads (local disk)
```

The frontend talks to the API through relative `/api/*` routes. In development, Vite proxies `/api` to the Flask server.

---

## Project Structure

```
learning_management_system/
├── backend/
│   ├── app.py                 # Flask app + all REST endpoints
│   ├── check_models.py        # Lists available Gemini models
│   ├── create_super_admin.py  # Seeds the first super admin
│   ├── requirements.txt
│   ├── .env.example
│   └── uploads/               # Uploaded files (gitignored)
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar, Dashboard, AIChatBot, ThemeToggle
│   │   ├── context/           # ThemeContext
│   │   ├── pages/             # Auth, Courses, Assessments, Discussions, ...
│   │   ├── App.jsx            # Routes + role-based guards
│   │   └── main.jsx
│   ├── package.json
│   └── vercel.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB running locally (or a MongoDB Atlas URI)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # then fill in your values
python app.py                    # starts on http://localhost:5000
```

Seed a super admin (optional):

```bash
python create_super_admin.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:5000` (configurable via `VITE_API_PROXY`).

Production build:

```bash
npm run build                    # outputs to dist/
```

---

## Environment Variables (backend `.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `SECRET_KEY` | Flask/JWT signing secret |
| `MAIL_USERNAME` | Gmail address used to send OTP/verification emails |
| `MAIL_PASSWORD` | Gmail **app password** (not your account password) |
| `GEMINI_API_KEY` | Google Gemini API key for the AI chatbot |
| `SUPER_ADMIN_EMAIL` | Email for the seeded super admin |
| `SUPER_ADMIN_PASSWORD` | Password for the seeded super admin |

---

## API Overview

All endpoints are prefixed with `/api`.

| Area | Example endpoints |
|------|-------------------|
| Auth | `/signup`, `/signin`, `/send-otp`, `/verify-otp`, `/forgot-password`, `/verify-signin` |
| Users | `GET/POST /users`, `/users/<id>` |
| Courses | `GET/POST /courses`, `/courses/<id>`, `/courses/<id>/enroll`, `/courses/<id>/content`, `/courses/simple` |
| Content | `GET/POST /content`, `/content/<id>` |
| Assessments | `GET/POST /assessments`, `/assessments/<id>` |
| Grading | `POST /submissions/<id>/grade`, `GET /submissions/<id>/file` |
| Discussions | `GET/POST /discussions`, `/discussions/<id>/replies` |
| Announcements | `GET/POST /announcements`, `/announcements/<id>` |
| Progress | `/progress/my-progress`, `/progress/all-students`, `/progress/admin-stats`, `/progress/student-report/<name>` |
| Meetings | `GET /meetings`, `POST /meetings/create`, `DELETE /meetings/delete/<id>` |
| Admin | `/admin/pending-users`, `/admin/action-user`, `/submit-verification` |
| Dashboard | `/dashboard-stats`, `/quick-actions` |
| AI / Misc | `/ask-ai` (Gemini chatbot), `/news`, `/test` |

---

## Deployment

### Frontend → Vercel

The frontend is a static Vite SPA and deploys cleanly to Vercel:

```bash
cd frontend
npx vercel            # first run links/creates the project
npx vercel --prod     # production deploy
```

`frontend/vercel.json` configures the Vite framework, build command and SPA rewrites.

> **Important:** The Flask backend **cannot run on Vercel as-is.** It needs a long-running server with MongoDB, persistent file storage and outbound mail. Host the backend separately (e.g. Render, Railway, Fly.io, a VPS) and point the frontend at it.

To connect a deployed frontend to a hosted backend, add an external rewrite to `frontend/vercel.json`:

```json
{ "source": "/api/:path*", "destination": "https://YOUR-BACKEND/api/:path*" }
```

### Backend
Run it on any Python host with MongoDB access, set the environment variables above, and expose it over HTTPS. Use a production WSGI server (e.g. Gunicorn):

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Security Notes

Hardcoded credentials that existed in the original source were removed and replaced with environment variables. **Rotate any keys that may have been exposed.**

- The frontend uses relative `/api/*` URLs (no hardcoded `localhost`).
- Uploaded files are stored on the backend disk and served via `/api/uploads/<filename>`.
- CORS is currently open (`origins: "*"`); restrict this before production.
- Consider storing secrets in your host's secret manager rather than a `.env` file.

---

## License

No license specified.
