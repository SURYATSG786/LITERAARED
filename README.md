# LiteraAI — AI-Powered Foundational Literacy Platform

Structured, pedagogically sound literacy courses for adult and first-generation learners in India. Games have been replaced with sequenced lessons, practice questions with explanations, checkpoint tests, and certificates.

## Features

- JWT auth with education level + preferred language (11 Indian languages)
- Adaptive 15-question assessment by education level
- Score-based course recommendation (Foundation / Beginner / Intermediate / Advanced)
- 4 complete static literacy courses (teaching content + practice + checkpoint)
- Dashboard with streak, XP, gems, and AI Literacy Coach (Gemini with static fallback)
- Certificate PDF generation (multi-language labels)
- Duolingo-inspired UI: bold type, glassmorphism, motion, confetti

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS 4, Motion, react-i18next |
| Backend | Node.js, Express, JWT, bcrypt, PDFKit |
| Data | JSON file store (portable; swap for MongoDB easily) |
| AI | Google Gemini (optional — static courses always available) |

## Quick start

### Prerequisites

- Node.js 18+

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (proxies `/api` to the backend)

### 3. Tests

```bash
cd backend && npm test
```

## Environment variables

```
PORT=5000
JWT_SECRET=change-me
GEMINI_API_KEY=           # optional
IMAGE_GENERATION_API_KEY= # optional / unused (image prompts shown as placeholders)
DATA_DIR=./data
```

Learner accounts are stored in **SQLite** at `$DATA_DIR/literaai.sqlite` (passwords bcrypt-hashed). Successful and failed login attempts are recorded in `login_events`. Legacy `users.json` is migrated automatically on first start.

Frontend optional:

```
VITE_API_URL=   # leave empty when using Vite proxy or nginx reverse proxy
```

## Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:8080  
- Backend: http://localhost:5000  

## Score → course mapping

| Score | Path | Course |
|------:|------|--------|
| 0–25 | Foundation | My First Literacy Adventure |
| 26–50 | Beginner | Building My Reading Confidence |
| 51–75 | Intermediate | Expanding My Language Power |
| 76–100 | Advanced | Mastering Written and Spoken English |

Certificate thresholds: 70% (Foundation/Beginner), 75% (Intermediate/Advanced).

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/user/me` | Current user |
| PUT | `/api/user/me` | Update profile |
| GET | `/api/assessment` | Get 15 questions |
| POST | `/api/assessment/submit` | Submit assessment |
| GET | `/api/courses/recommended` | Recommended course |
| GET | `/api/courses/:id` | Full course |
| POST | `/api/lessons/:lessonId/progress` | Mark lesson done |
| POST | `/api/checkpoint/:courseId` | Submit checkpoint |
| GET | `/api/certificate/generate` | Certificate JSON / `?format=pdf` |
| POST | `/api/coach` | AI coach message |
| POST | `/api/generate-course` | Optional Gemini course generation |

## Project structure

```
literaai/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── data/          # courses.json + assessments.json
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── i18n/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Handwriting Practice: Outline Coverage & Precision Scorer

LiteraAI uses a client-side, offline, and platform-agnostic **geometric outline-coverage and precision scoring model** for both single letters and full multi-character words across all 6 languages (English, Hindi, Tamil, Telugu, Kannada, Malayalam).

### Scoring Model & Formula

The learner traces directly over the rendered outline of the target character or word. The score is computed as the symmetric product of **Coverage** and **Precision**:

```
coverage  = (# of sampled outline points with user ink within tolerance) / (total sampled outline points)
precision = (# of user ink pixels within tolerance of the outline path) / (total user ink pixels)
score     = round(100 * coverage * precision)
```

- **Tolerance Band (`OUTLINE_TOLERANCE_PX = 16`)**: Defines the pixel radius around the reference outline path that counts as "on the line".
- **Coverage**: Catches incomplete tracing (e.g. user draws only 1 letter of a 3-letter word $\rightarrow$ coverage $\approx 33\%$, failing the test).
- **Precision**: Catches wild scribbles / overflowing strokes (e.g. user fills the whole canvas with wild strokes $\rightarrow$ precision $\approx 15\%$, failing the test).
- **Passing Threshold (`PASS_THRESHOLD = 70`)**: Score $\ge 70\%$ awards XP and advances progress.
- **Data Model**: Stored in `user_alphabet_writing_progress` table (`letter`, `type` = `'letter'` | `'word'`, `word`, `score`, `attempts`, `completed`), integrating directly into the user reward and streak ledger.

## Production notes

- Set a strong `JWT_SECRET`
- Put TLS termination in front (Vercel/Render/nginx)
- Persist `DATA_DIR` (SQLite file `literaai.sqlite`, or migrate `services/db.js` to Postgres)
- Set `GEMINI_API_KEY` for live coach / course generation; otherwise static fallbacks apply

