<div align="center">

# 🎭 YakshaAI

### AI-Powered Yakshagana Artist Booking Platform

*Connecting Karnataka's traditional Yakshagana performers with event organizers through intelligent recommendations and real-time booking management.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat&logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-gold?style=flat)](LICENSE)

</div>

---

## ✨ Features

- 🤖 **AI Recommendation Engine** — Multi-factor weighted scoring (budget, location, rating, experience, style)
- 🔔 **Real-Time Notifications** — WebSocket-based live updates when bookings are made or status changes
- 🎭 **Artist Profiles** — Performance style (Badagu/Tenkutittu), specialization, availability calendar
- 📋 **Booking Management** — Full lifecycle: request → confirm/reject → complete → review
- ⭐ **Review System** — Post-event reviews with animated star ratings, auto-updates artist average
- 👑 **Admin Dashboard** — Artist verification, user management, platform analytics
- 🏭 **Production-Ready** — JWT auth, GZip, structured logging, environment config, PostgreSQL support

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS, React Router v6 |
| **Backend** | FastAPI, SQLAlchemy, Pydantic v2 |
| **Auth** | JWT (HS256), bcrypt password hashing |
| **Real-Time** | WebSocket (FastAPI native) |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **AI Engine** | Pure Python weighted recommendation scorer |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+

### 1. Clone the repo
```bash
git clone https://github.com/SHISHIRballal/yakshaAI.git
cd yakshaAI
```

### 2. Backend setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env

# Seed the database (20 Yakshagana artists)
python -X utf8 seed_data.py

# Start the API server
python -X utf8 -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend setup
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 4. Open the app
- **Frontend:** http://localhost:5173
- **API Docs:** http://127.0.0.1:8000/docs

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| 👑 Admin | `admin@yakshagai.com` | `Admin@1234` |
| 🎭 Artist | `balakrishna@yakshagai.com` | `Artist@1234` |
| 📋 Organizer | `raghav.org@yakshagai.com` | `Organizer@1234` |

> The login page has **"Use →"** buttons for instant one-click login.

---

## 📁 Project Structure

```
yakshaAI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, WebSocket, lifespan
│   │   ├── config.py            # Pydantic settings (.env)
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── websocket_manager.py # Real-time connection manager
│   │   ├── models/              # ORM: User, Artist, Booking, Review, Availability
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── routers/             # auth, artists, bookings, reviews, recommendations, admin
│   │   ├── ml/                  # AI recommendation engine
│   │   └── utils/               # JWT handler, bcrypt security
│   ├── seed_data.py             # 20 realistic artist profiles
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── App.jsx              # Router + provider tree
        ├── context/             # AuthContext, NotificationContext (WebSocket)
        ├── components/          # Navbar, Footer, ArtistCard, NotificationBell, ReviewModal
        └── pages/               # Home, Artists, ArtistDetails, Recommendations,
                                 # Booking, Auth, UserDashboard, ArtistDashboard,
                                 # AdminDashboard, Contact
```

---

## 🤖 AI Recommendation Engine

Artists are scored across 5 weighted factors:

| Factor | Weight | Logic |
|---|---|---|
| 💰 Budget | 30% | Artist pricing within requested budget range |
| 📍 Location | 25% | City/region proximity to event venue |
| ⭐ Rating | 20% | Normalized 0–5 star average |
| 🏆 Experience | 15% | Years of experience (normalized to 30yr max) |
| 🎭 Style | 10% | Exact Badagu/Tenkutittu match bonus |

---

## 🔔 Real-Time Architecture

```
Organizer books artist
        │
        ▼
FastAPI creates Booking in DB
        │
        ▼
WebSocket Manager fires JSON event → Artist's browser
        │
        ▼
Artist Dashboard auto-refreshes, bell 🔔 rings
        │
Artist accepts/rejects
        │
        ▼
WebSocket event → Organizer's browser
        │
        ▼
Organizer Dashboard auto-refreshes, toast notification appears
```

---

## 🏭 Production Deployment

```bash
# Backend with Gunicorn (4 workers)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend build
cd frontend && npm run build
# Serve dist/ with nginx or serve on CDN
```

Set `DEBUG=false` and configure `DATABASE_URL` for PostgreSQL in `.env`.

---

## 📜 License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">
Made with ❤️ for Karnataka's Yakshagana tradition
</div>
