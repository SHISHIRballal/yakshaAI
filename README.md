<div align="center">

# 🎭 YakshaAI

### Intelligent Yakshagana Artist Booking & Cultural Preservation Platform

*Bridging Karnataka's sacred Yakshagana traditions with cutting-edge AI recommendations, real-time artist messaging, interactive geospatial venue mapping, and verified booking management.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat&logo=python)](https://python.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat&logo=socketdotio)](https://socket.io)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=flat&logo=leaflet)](https://leafletjs.com)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-F7931E?style=flat&logo=scikitlearn)](https://scikit-learn.org)
[![License](https://img.shields.io/badge/License-MIT-gold?style=flat)](LICENSE)

</div>

---

## 🌟 Key Highlights & Features

### 🗺️ Interactive Venue Selection Map
- **Leaflet & OpenStreetMap Integration**: Embedded interactive map picker with draggable marker, pin dropping, and real-time latitude/longitude coordinate capture.
- **Reverse Geocoding**: Automatic address resolution via OpenStreetMap Nominatim API upon clicking or dragging anywhere on the map.
- **Cultural Hub Presets**: One-click quick selection for historic coastal and Malnad performance hubs:
  - Udupi Sri Krishna Matha
  - Mangalore Kadri Manjunath Temple
  - Dharmasthala Manjunatha Swamy Temple
  - Kundapura Town Hall
  - Honnavara Sharavathi Stage
  - Sirsi Marikamba Temple
- **Live Search**: Integrated location search with autocomplete and fly-to animation.

### 💬 Real-Time Direct Artist Messaging
- **Dual Engine (Socket.IO + REST Fallback)**: Real-time bidirectional private chat powered by Python-SocketIO and React `socket.io-client`, backed by reliable REST endpoints for zero message drop.
- **Direct DM Navigation**: Click "Message Artist" from any artist card, search result, or profile page to jump straight into a private conversation thread (`/messages?user_id={id}`).
- **Presence & Interactions**: Live online/offline presence indicators, dynamic typing detection, read receipts, and unread badge counters.
- **Resilient UI**: Optimized auto-scroll message container with state caching to avoid glitchy re-renders.

### 📸 Profile Picture Upload System
- **Secure File Ingestion**: `POST /upload/profile-photo` endpoint supporting multipart form data with MIME-type verification (PNG, JPEG, WebP) and 5MB size limit validation.
- **FastAPI Static Serving**: Uploaded media securely stored with UUID filenames and served through FastAPI's `StaticFiles` at `/static/uploads/`.
- **Dashboard Synchronization**: Interactive avatar upload modal with instant local previews, automatically syncing with organizer profiles and artist public cards.

### 🤖 Multi-Model ML Recommendation Engine
- **Comparative ML Models**: Compares multiple machine learning algorithms:
  - **Random Forest Regressor** (Ensemble modeling)
  - **K-Nearest Neighbors (KNN)** (Distance-based similarity)
  - **Decision Tree Regressor** (Hierarchical decision splits)
  - **Weighted Multi-Factor Scorer** (Custom domain heuristics: Budget 30%, Location 25%, Rating 20%, Experience 15%, Style Match 10%)
- **Radar Chart Visualization**: Real-time multi-axis radar charts (Recharts) visualizing how candidate artists match the organizer's criteria.
- **Ranking Evaluation**: NDCG@5 and ranking quality metrics for transparency.

### ⚡ Cursor-Based Infinite Directory
- **Scalable Pagination**: Scalable cursor-based pagination API (`/artists?limit=12&cursor=...`) supporting high-volume artist discovery with zero offset degradation.
- **Multi-Filter & Debounced Search**: Real-time filtering by performance style (*Badagu Tittu* / *Tenku Tittu*), price range, location, and minimum star rating.

### 🛡️ Production Security & Hardening
- **SlowAPI Rate Limiting**: Intelligent sliding-window rate limiting on sensitive routes (authentication, messaging, booking submission) to prevent brute-force attacks and abuse.
- **Security Headers Middleware**: Enforces `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.
- **JWT & Password Security**: Secure HS256 JWT tokens with role-based claims and salted bcrypt password hashing.
- **Automated Test Suite**: 19 automated integration and unit tests (`pytest`) covering authentication, security headers, rate limits, pagination, and messaging.

### 👑 Verified Artist & Admin Workflow
- **Artist Verification Portal**: Admin dashboard featuring search, status filtering (*All, Pending, Verified, Rejected*), profile review, and one-click approvals.
- **Preserved Login Redirects**: Guests attempting to book or message an artist are redirected seamlessly back to their intended action post-login via `?redirect=` state preservation.
- **Cross-Role Booking Support**: Organizers, artists, and administrators can initiate and manage booking requests without artificial role-blocking.

---

## 🖥️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite | Single-page application, custom responsive CSS |
| **Routing** | React Router v6 | Protected routes, dynamic redirect preservation |
| **Mapping & Geospatial** | Leaflet, React-Leaflet | OpenStreetMap tiles, Nominatim reverse geocoder |
| **Real-Time Messaging** | Socket.IO | `python-socketio` ASGI server & `socket.io-client` |
| **Backend Framework** | FastAPI (Python 3.13) | Asynchronous REST API, OpenAPI/Swagger docs |
| **ORM & Database** | SQLAlchemy 2.0 | SQLite (development) / PostgreSQL (production) |
| **Machine Learning** | Scikit-learn, NumPy | Random Forest, KNN, Decision Tree, NDCG@5 |
| **Data Visualizations** | Recharts | Multi-factor radar charts, score distribution charts |
| **Security & Auth** | Python-Jose, Passlib, SlowAPI | JWT HS256, bcrypt hashing, rate limiting |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX | 19 automated integration and security tests |

---

## 🏗️ Architecture Overview

```
                                  ┌─────────────────────────────┐
                                  │      React 18 Frontend      │
                                  │  (Vite, Leaflet, Socket.IO) │
                                  └──────────────┬──────────────┘
                                                 │
                      ┌──────────────────────────┴──────────────────────────┐
                      │ HTTP / REST (JWT Auth)                              │ WebSocket (ws:// / socket.io)
                      ▼                                                     ▼
        ┌───────────────────────────┐                         ┌───────────────────────────┐
        │     FastAPI Backend       │                         │    Socket.IO / ASGI App   │
        │  • SlowAPI Rate Limiter   │                         │  • Direct 1-to-1 DMs      │
        │  • Security Headers       │                         │  • Real-Time Presence     │
        │  • Cursor Pagination      │                         │  • Typing & Read Status   │
        │  • Photo Uploads (/static)│                         └─────────────┬─────────────┘
        └─────────────┬─────────────┘                                       │
                      │                                                     │
         ┌────────────┴────────────┬────────────────────────┐               │
         ▼                         ▼                        ▼               ▼
┌───────────────────┐    ┌────────────────────┐    ┌─────────────────────────────┐
│  SQLAlchemy ORM   │    │ ML Recommendation  │    │      Persistent DB          │
│  User, Artist,    │    │ • Random Forest    │    │ SQLite (Dev) / PostgreSQL   │
│  Booking, Message │    │ • KNN, Dec. Tree   │    │ (Users, Bookings, Messages) │
│  Review, Photo    │    │ • Radar Metrics    │    └─────────────────────────────┘
└───────────────────┘    └────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.13+**
- **Node.js 18+** & **npm**

---

### 1. Clone the Repository
```bash
git clone https://github.com/SHISHIRballal/yakshaAI.git
cd yakshaAI
```

---

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment (optional but recommended)
py -3.13 -m venv .venv
.venv\Scripts\activate   # On Windows
# source .venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Create .env configuration
copy .env.example .env   # On Windows
# cp .env.example .env    # On Linux/macOS

# Seed database with realistic Yakshagana artists and demo users
python -X utf8 seed_data.py

# Start the FastAPI backend server
python -X utf8 -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

---

### 4. Access the Application
- **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
- **Interactive API Documentation (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative API Docs (ReDoc):** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🔑 Demo Accounts

Use these pre-configured accounts for testing different user roles:

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| 👑 **Administrator** | `admin@yakshagai.com` | `Admin@1234` | Artist verification portal, user management, platform analytics, booking override |
| 🎭 **Artist** | `balakrishna@yakshagai.com` | `Artist@1234` | Profile management, photo upload, calendar availability, booking requests, direct messaging |
| 📋 **Organizer** | `raghav.org@yakshagai.com` | `Organizer@1234` | AI recommendations, venue map picker, artist booking, direct messaging, review submission |

> 💡 **Tip:** The login screen includes **"Use →"** one-click login buttons for instant credential filling.

---

## 📁 Project Structure

```
yakshaAI/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application, CORS, SlowAPI, StaticFiles, Lifespan
│   │   ├── config.py               # Pydantic BaseSettings (.env loader)
│   │   ├── database.py             # SQLAlchemy engine & session factory
│   │   ├── middleware.py           # Security headers middleware (CSP, X-Frame-Options)
│   │   ├── socket_app.py           # Socket.IO server & event handlers (chat, presence, typing)
│   │   ├── websocket_manager.py    # Native WebSocket connection manager
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user.py             # User accounts & role flags
│   │   │   ├── artist.py           # Yakshagana artist profiles, styles, experience
│   │   │   ├── booking.py          # Booking state, venue location, budget
│   │   │   ├── review.py           # Post-performance ratings & comments
│   │   │   ├── message.py          # Chat messages & conversation threads
│   │   │   └── availability.py     # Calendar availability intervals
│   │   ├── schemas/                # Pydantic v2 validation models
│   │   ├── routers/                # FastAPI endpoint routers
│   │   │   ├── auth.py             # Registration, login, JWT issuance
│   │   │   ├── artists.py          # Cursor pagination, search, profile updates
│   │   │   ├── bookings.py         # Lifecycle: request, approve, reject, complete
│   │   │   ├── reviews.py          # Feedback submission & rating aggregation
│   │   │   ├── recommendations.py  # Multi-model ML recommendation endpoint
│   │   │   ├── messages.py         # Direct messaging REST endpoints
│   │   │   ├── uploads.py          # Profile photo upload & validation endpoint
│   │   │   └── admin.py            # Artist verification & platform stats
│   │   ├── services/               # Core business logic layer
│   │   │   ├── artist_service.py   # Resilient lookup & pagination
│   │   │   └── booking_service.py  # Availability checking & status transitions
│   │   ├── ml/                     # ML recommendation algorithms & evaluators
│   │   └── utils/                  # Password hashing (bcrypt) & token utils
│   ├── static/
│   │   └── uploads/                # User profile avatars & media (.gitkeep)
│   ├── tests/                      # Pytest automated test suite (19 tests)
│   ├── seed_data.py                # Database population script (20 real artists)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/
    └── src/
        ├── App.jsx                 # App routing, Auth & Notification providers
        ├── context/
        │   ├── AuthContext.jsx     # Authentication state, login, profile refresh
        │   └── NotificationContext.jsx # Live WebSocket alerts & badge counts
        ├── components/
        │   ├── Navbar.jsx          # Dynamic navigation, role badges, user dropdown
        │   ├── Footer.jsx          # Platform information & cultural credits
        │   ├── ArtistCard.jsx      # Artist card with Direct Message & Book actions
        │   ├── VenueMapPicker.jsx  # Leaflet map picker, Nominatim geocoder, cultural hubs
        │   ├── NotificationBell.jsx# Bell trigger with dropdown notifications
        │   └── ReviewModal.jsx     # Star rating & review submission dialog
        └── pages/
            ├── Home.jsx            # Hero banner, featured artists, style overview
            ├── Artists.jsx         # Infinite scroll directory with multi-filter bar
            ├── ArtistDetails.jsx   # Biography, video links, reviews, booking widget
            ├── Recommendations.jsx # AI matcher with radar charts & model switcher
            ├── Booking.jsx         # Multi-step booking flow with VenueMapPicker
            ├── Messages.jsx        # Socket.IO 1-to-1 direct messaging interface
            ├── Auth.jsx            # Login & Register with ?redirect= preservation
            ├── UserDashboard.jsx   # Organizer dashboard (bookings, profile photo)
            ├── ArtistDashboard.jsx # Artist dashboard (requests, calendar, photo)
            ├── AdminDashboard.jsx  # Admin portal (verification filter, user stats)
            └── Contact.jsx         # Cultural support & inquiries
```

---

## 🧪 Testing

The backend includes a comprehensive suite of 19 automated integration and security tests using `pytest` and `httpx`:

```bash
cd backend
py -3.13 -m pytest tests -v
```

### Test Coverage Highlights:
- **Authentication & Security (`test_auth_and_security.py`)**:
  - JWT token verification & expiration
  - SlowAPI rate limiting validation
  - Security headers enforcement (`X-Content-Type-Options`, `X-Frame-Options`, `CSP`)
  - Input sanitization & invalid credential handling
- **Cursor-Based Pagination (`test_pagination.py`)**:
  - Limit and cursor token validation
  - Edge cases (empty results, invalid cursors)
- **Messaging & Sockets (`test_socket_messaging.py`)**:
  - Direct message creation & thread retrieval
  - Recipient ID disambiguation
  - Unread count calculation & read receipt status

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/login` | Authenticate user & return JWT token | No |
| `POST` | `/auth/register` | Register new user or artist | No |
| `GET` | `/artists` | Cursor-paginated artist directory with filters | No |
| `GET` | `/artists/{id}` | Detailed artist profile and availability | No |
| `POST` | `/bookings` | Create new booking request with venue coords | Yes |
| `GET` | `/bookings/my` | Retrieve bookings for current user/artist | Yes |
| `POST` | `/messages` | Send a direct message (REST fallback) | Yes |
| `GET` | `/messages/conversations` | List conversation threads with unread counts | Yes |
| `GET` | `/messages/{user_id}` | Retrieve chat history with specific user | Yes |
| `POST` | `/upload/profile-photo` | Upload profile photo (PNG, JPEG, WebP, ≤5MB) | Yes |
| `POST` | `/recommendations` | Get ML artist recommendations with radar data | No |
| `GET` | `/admin/artists` | Admin: list artists with verification filter | Admin Only |
| `PUT` | `/admin/artists/{id}/verify` | Admin: approve or reject artist verification | Admin Only |

---

## 🚢 Production Deployment

### Backend (Gunicorn + Uvicorn Workers)
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Build
```bash
cd frontend
npm run build
# The optimized bundle is generated in frontend/dist/
```

Set `DEBUG=false` in `.env` and supply a managed PostgreSQL connection string for production scale.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

---

<div align="center">

Made with ❤️ to preserve and celebrate Karnataka's sacred Yakshagana heritage.

</div>
