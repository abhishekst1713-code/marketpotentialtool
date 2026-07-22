# Infopace — React + Supabase Edition

> AI-powered market intelligence assessment platform.
> Built with React + Vite + Tailwind CSS + Gemini AI + Supabase.

---

## What This App Does

1. **Onboarding Form** — Collects user details (name, email, phone, organization, role, website, LinkedIn, team size, sector, geography, problem statement, stage)
2. **AI Assessment** — Generates 8 tailored question groups using Gemini AI, with a live market score panel updating as you answer
3. **Results Dashboard** — Full market intelligence dashboard with:
   - Score donut + dimension bars + capability radar
   - Revenue projection chart (conservative / base / optimistic)
   - TAM / SAM / SOM estimates
   - Competitor analysis
   - Key AI-generated insights
   - 90-day action plan
   - Full printable report view
   - Raw JSON data view
4. **Supabase Storage** — Every submission (user details + all answers + full analysis) is saved to your Supabase database

---

## Prerequisites

- Node.js 18+
- A free [Gemini API key](https://aistudio.google.com)
- A free [Supabase](https://supabase.com) project

---

## Quick Start

### Step 1 — Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste + run the contents of `supabase_setup.sql`
3. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public key** (long JWT string — used by the frontend for auth only)
   - **service_role key** (secret — used by the backend for database access)

### Step 2 — Configure environment

**Frontend** (Vite — for Supabase Auth only):
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

**Backend** (Express — for Gemini + Supabase data access):
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in your values:
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3 — Install dependencies

```bash
npm install
cd server && npm install && cd ..
```

### Step 4 — Run the app (two terminals)

**Terminal 1** — Start the Express backend (port 4000):
```bash
npm run dev:server
```

**Terminal 2** — Start the React dev server (port 5173):
```bash
npm run dev
```

Open **http://localhost:5173**

The Vite dev server automatically proxies `/api` requests to the Express backend on port 4000.

---

## Project Structure

```
marketpotential/
├── server/                          ← Express backend (port 4000)
│   ├── .env.example                 ← Copy to .env and fill in keys
│   ├── package.json
│   └── src/
│       ├── index.js                 ← App entry, starts HTTP server
│       ├── app.js                   ← Express app, middleware wiring
│       ├── config/
│       │   └── env.js               ← Loads & validates env vars (fail fast)
│       ├── routes/
│       │   ├── health.routes.js     ← GET /api/health
│       │   ├── analysis.routes.js   ← POST /api/analysis
│       │   └── submissions.routes.js ← CRUD for submissions
│       ├── controllers/
│       │   ├── analysis.controller.js
│       │   └── submissions.controller.js
│       ├── services/
│       │   ├── gemini.service.js    ← Gemini API + prompt template
│       │   └── supabase.service.js  ← Server-side Supabase (service role)
│       ├── middleware/
│       │   ├── errorHandler.js      ← Centralized error handling
│       │   ├── rateLimiter.js       ← Global + analysis-specific limits
│       │   ├── validateRequest.js   ← Zod schema validation
│       │   └── requestLogger.js     ← Morgan HTTP logging
│       └── utils/
│           └── asyncHandler.js      ← Async route wrapper
│
├── supabase_setup.sql               ← Run once in Supabase SQL Editor
├── index.html                       ← Vite entry HTML
├── vite.config.js                   ← Dev server + /api proxy config
├── tailwind.config.js
├── postcss.config.js
├── package.json
│
└── src/
    ├── main.jsx                     ← React entry point
    ├── App.jsx                      ← Screen router (onboarding → assessment → results)
    ├── index.css                    ← Tailwind + IBM Plex fonts
    │
    ├── pages/
    │   ├── OnboardingForm.jsx       ← Step 1: User & venture details
    │   ├── AssessmentAndDashboard.jsx ← Step 2: AI questions + live scoring
    │   └── AuthPage.jsx             ← Login / signup
    │
    └── lib/
        ├── supabase.js              ← Supabase client init (auth only)
        ├── auth.js                  ← Supabase Auth helpers
        ├── gemini.js                ← Calls backend /api/analysis
        ├── db.js                    ← Calls backend /api/submissions
        └── exportPdf.js             ← PDF export
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check with config status |
| `POST` | `/api/analysis` | Generate AI market analysis |
| `POST` | `/api/submissions` | Save onboarding data |
| `PATCH` | `/api/submissions/:id/result` | Save assessment answers + AI result |
| `PATCH` | `/api/submissions/:id/screenshot` | Save dashboard screenshot |
| `GET` | `/api/submissions/:id` | Retrieve a submission by ID |

---

## Data Saved to Supabase

Every completed assessment saves one row to the `submissions` table:

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Auto-generated primary key |
| `name` | text | Full name |
| `email` | text | Email address |
| `phone` | text | Phone number |
| `organization` | text | Company name |
| `role` | text | Job role |
| `website` | text | Website URL |
| `linkedin` | text | LinkedIn URL |
| `team_size` | text | Team size bracket |
| `sector` | text | e.g. "HealthTech", "B2B SaaS" |
| `geography` | text | e.g. "PI" (Pan India), "GL" (Global) |
| `problem` | text | Problem statement |
| `stage` | text | Business stage (1–5) |
| `answers` | jsonb | All question answers keyed by question ID |
| `overall_score` | integer | Final market score (0–100) |
| `grade` | text | e.g. "A", "B+", "C" |
| `dimensions` | jsonb | Six dimension scores |
| `analysis_json` | jsonb | Complete AI analysis (TAM/SAM/SOM, competitors, insights, action plan, projections) |
| `created_at` | timestamptz | Submission timestamp |

---

## Security Architecture

- **Supabase Auth** (anon key) runs client-side — this is a legitimate use of the anon key for authentication only.
- **Supabase Data** (service role key) runs server-side only — the browser never has access to read or write the `submissions` table.
- **RLS** is enabled with **no public policies** — the service role key bypasses RLS by design.
- **API validation** — all inputs are validated with Zod schemas; malformed requests get 400 responses.
- **Rate limiting** — global limit + stricter 5/min limit on the AI analysis endpoint.
- **CORS** — restricted to the configured `CORS_ORIGIN`, not `*`.
- **Helmet** — security headers (CSP, HSTS, etc.) applied to all responses.

---

## Production Deployment

### Build the React app

```bash
npm run build
```

This creates a `dist/` folder.

### Run the backend

```bash
cd server && npm start
```

Serve the `dist/` folder with a reverse proxy (nginx, Caddy) or deploy the frontend and backend separately.

### Deploy options

- **Railway / Render / Fly.io** — push repo, set env vars, run `node server/src/index.js`
- **Vercel** — deploy React app, use Vercel serverless functions or a separate backend host
- **VPS** — clone repo, `npm run build`, run backend with `pm2 start server/src/index.js`

---

## Customisation

### Change sectors / geographies
Edit the `SECTORS` and `GEO` arrays at the top of `src/pages/OnboardingForm.jsx`.

### Change AI models
Edit `GEMINI_MODEL_FAST` and `GEMINI_MODEL_SMART` in `server/.env`.

### Change question count
Edit the prompt in `server/src/services/gemini.service.js`.

### Add email notifications
After `saveSubmission()` in `AssessmentAndDashboard.jsx`, call a Supabase Edge Function or a service like Resend/SendGrid.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `/api` returns 500 | Check `server/.env` has valid `GEMINI_API_KEY` |
| Server won't start | Check all required env vars are set — the server fails fast with clear error messages |
| Supabase save fails | Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env` |
| Questions don't load | Gemini API key may be rate-limited; fallback questions will show |
| Blank dashboard | Open browser console — look for JSON parse errors in analysis response |
| 429 Too Many Requests | Analysis endpoint is rate-limited to 5 requests/min per IP |

---

## License

Infopace Management Pvt Ltd — Internal Use
