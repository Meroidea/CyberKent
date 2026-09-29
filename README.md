# CyberKent — Online Scam Detection and Reporting System

Hume City Council CyberSafe Services · Group CyberKent · CPRO306

CyberKent lets Hume residents check a suspicious message, link, phone number,
email or screenshot, report a scam to Council with evidence, follow verified
community alerts, and recover after being scammed. Council officers review the
reports, publish de-identified alerts and track the work; administrators run
the team, the content and the site.

**Live service:** <https://cyberkent.meroidea.com>
**User guide:** [`Documents/User-Guide.md`](Documents/User-Guide.md), also
published in the service at `/documents/user-guide`.

## How it fits together

| Folder | What it is | Stack |
|---|---|---|
| `frontend/` | The website: the landing page, the resident portal, the Council console and the admin panel | React 18, TypeScript, Vite, Tailwind CSS |
| `backend/` | The REST API: accounts, reports, evidence, alerts, tasks, audit, and the AI gateway | Node.js, Express, TypeScript, Prisma, PostgreSQL |
| `ai-service/` | The AI service behind the gateway: text and image analysis, the CyberSafe Assistant | Python 3.12, FastAPI, Google Gemini (`google-genai`) |
| `database/` | SQL export, ERDs and their generator | PostgreSQL 17 |
| `Documents/` | Requirements, architecture, SRS, the user guide; published in the site at `/documents` | Markdown and PDF |

The browser only talks to the website. In production the website's `/api`
proxy forwards to the API, and only the API may call the AI service (with a
shared token). The rule-based checker runs without AI, so if the AI service is
down or has no key, every check and report still works and only the AI second
opinion says it is unavailable.

## Prerequisites

- Node.js 20.19 or later (Vite 7's minimum) and npm
- Python 3.12
- PostgreSQL 15 or later (local, Docker, or a hosted database)
- Optional: a Google Gemini API key (free tier, <https://aistudio.google.com/apikey>) for the AI features

## Set up

```bash
git clone https://github.com/Meroidea/CyberKent.git
cd CyberKent

# API
cd backend
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, SEED_ADMIN_*; GEMINI_API_KEY optional
npm install
npx prisma migrate deploy     # create the tables
npm run db:seed               # categories, suburbs, guides, checklists, the admin account
npm run db:seed:demo          # optional: 64 synthetic reports for the Council console
cd ..

# Website
cd frontend
npm install
cd ..

# AI service (optional; the rest works without it)
cd ai-service
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env          # or leave GEMINI_API_KEY in backend/.env, which it also reads
cd ..
```

A quick local database with Docker:

```bash
docker run -d --name cyberkent-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cyberkent -p 5432:5432 postgres:17-alpine
```

Then set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cyberkent` in `backend/.env`.

## Run

Start each in its own terminal:

```bash
npm run dev --prefix backend        # API on http://localhost:4000
npm run dev --prefix frontend       # website on http://localhost:5173
cd ai-service && .venv/bin/uvicorn app.main:app --port 8000 --reload   # AI on http://127.0.0.1:8000
```

Sign in at <http://localhost:5173/sign-in> with the `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` from `backend/.env`. Without `RESEND_API_KEY`, emails
(verification codes, resets) are printed in the API's terminal, and in
development the verification code is also shown on screen.

## Test

```bash
# API: 35 integration tests in 7 files. They reset the database they are given,
# so point them at a throwaway one, never at your development data.
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cyberkent_test npm test --prefix backend

# AI service: unit tests, no key or network needed
cd ai-service && .venv/bin/python -m pytest -q

# Website: type check and lint
npm run typecheck --prefix frontend
npm run lint --prefix frontend
```

## Deploy

Production runs as three Vercel projects built from this one repository.
Pushing `main` deploys all three; other branches get protected previews.

| Vercel project | Root | Serves |
|---|---|---|
| `cyber-kent` | `frontend/` | <https://cyberkent.meroidea.com> and its `/api` proxy |
| `cyber-kent-api` | `backend/` | The API (esbuild bundle behind `api/index.js`) |
| `cyber-kent-ai` | `ai-service/` | The AI service (`api/index.py`) |

Environment variables each project needs (values live only in Vercel):

- **`cyber-kent-api`:** `DATABASE_URL` (Supabase transaction pooler, port 6543, `schema=cyberkent`), `JWT_SECRET`, `CLIENT_ORIGIN`, `PUBLIC_APP_URL`, `API_PROXY_SECRET`, `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`, `BLOB_READ_WRITE_TOKEN`. Do not set `NODE_ENV=production`: npm would skip the build's dev dependencies. The API treats `VERCEL=1` as production.
- **`cyber-kent-ai`:** `GEMINI_API_KEY`, `AI_SERVICE_TOKEN` (the same value as the API's). Optional: `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `GEMINI_ASSISTANT_MODEL`.
- **`cyber-kent`:** `API_UPSTREAM_URL` (where the API project runs) and `API_PROXY_SECRET` (the same value as the API's), both read by the `/api` proxy in `frontend/api/proxy.js`.

Database migrations are not run by the deploy. After merging a migration, apply it once:

```bash
DATABASE_URL="<Supabase session pooler URL, port 5432>" npx prisma migrate deploy --schema backend/prisma/schema.prisma
```

Check the deploy:

```bash
curl -s https://cyberkent.meroidea.com/api/ai/status
```

It should report `"available": true`. `false` means the AI project has no
`GEMINI_API_KEY`, the token does not match, or the free-tier quota is spent. The
rest of the service is unaffected.

## Where to read more

- `Documents/User-Guide.md`: how residents, officers and administrators use the service
- `Documents/Final-SRS-Report.md`: requirements, acceptance criteria and test plan
- `Documents/System-Architecture.md`: the design, layer by layer
- `database/README.md`: the schema, ERDs and how to refresh them
- `ai-service/README.md`: the AI endpoints and failure policy
