# 📅 Google Calendar Fullstack App (TypeScript)

A fullstack **TypeScript** application that allows users to:

- Log in with **Google OAuth2**
- Fetch and display Google Calendar events (±6 months)
- Refresh events from the Google Calendar API
- Create new events (synced to Google + stored in local DB)
- Filter events by range (1 / 7 / 30 days)

---

## 🧰 Tech Stack
- **Frontend:** React (Vite + TypeScript), Axios  
- **Backend:** Express (TypeScript), Prisma ORM, Google APIs (OAuth2 + Calendar v3)  
- **Database:** PostgreSQL  
- **Auth:** Google OAuth2 + httpOnly signed JWT cookie (session)

---

## 📂 Project Structure
```
├─ backend/   # Express + Prisma + Google API integration
├─ frontend/  # React + Vite + TypeScript app
└─ README.md
```

---

## ⚙️ Requirements
- Node.js v18+ (recommended v20+)
- pnpm or npm
- PostgreSQL (locally or via Docker)
- Google Cloud Console OAuth Client ID

---

## 🗄️ 1. Database & Prisma

### Start PostgreSQL (Docker)
```bash
docker run --name calendar-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=calendar_db -p 5432:5432 -d postgres:16-alpine
```

### `.env` in `backend/`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/calendar_db?schema=public"

GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/auth/google/callback"

JWT_SECRET="dev-super-secret"
FRONTEND_ORIGIN="http://localhost:5173"
PORT=4000
```

### Run Prisma migrations
```bash
cd backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate dev
```

---

## 🚀 2. Backend (Express API)
```bash
pnpm dev
# Server running on http://localhost:4000
```

### Health check
```bash
GET http://localhost:4000/health
→ { "ok": true }
```

### Login test
```bash
GET http://localhost:4000/auth/google
```

---

## 💻 3. Frontend (React + Vite)

### `.env` in `frontend/`
```env
VITE_BACKEND_URL="http://localhost:4000"
```

### Start frontend
```bash
cd frontend
pnpm install
pnpm dev
# http://localhost:5173
```

---

## 🔁 4. App Flow

1. Open [http://localhost:5173](http://localhost:5173) → click **Login with Google**
2. After login → redirected to main page
3. Events are displayed, sorted and grouped by date
4. **Refresh** button → fetches events from Google (±6 months)
5. **Create new event** → appears instantly in the list and on your Google Calendar

---

## 🧩 5. API Overview

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/auth/google` | GET | Redirects to Google login |
| `/auth/google/callback` | GET | Handles callback, saves user & tokens |
| `/api/me` | GET | Returns current user info |
| `/api/events` | GET | Fetch events from DB (range=1\|7\|30) |
| `/api/events` | POST | Create new event (Google + DB) |
| `/api/events/refresh` | POST | Re-sync events from Google API |

---

## 🔐 6. Authentication Notes

- Google OAuth2 **access** + **refresh tokens** are stored in DB.  
- Backend issues an **httpOnly signed JWT cookie (session)**.  
- Frontend uses **Axios** with `withCredentials: true`.  
- CORS configured to allow only the frontend origin.  
- In production, set cookies as `secure: true` and serve via **HTTPS**.

---

## 🐘 7. (Optional) Docker Setup

If you prefer running everything with Docker Compose:

### `docker-compose.yml`
```yaml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    container_name: calendar-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: calendar_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

This is all you need for the local database.
