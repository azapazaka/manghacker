# Qoldan

Qoldan is a MVP for the Mangystau region: employers publish vacancies, job seekers apply with a PDF resume, and the employer receives that resume directly in Telegram.

## Stack

- Frontend: React + Vite + `shadcn/ui`
- Backend: Node.js + Express
- Database: PostgreSQL + Knex migrations
- Auth: JWT
- File uploads: Multer
- Telegram: `node-telegram-bot-api`

Supabase is supported as the hosted PostgreSQL provider for deployment. The backend still talks to the database through `pg` + `knex`, so no query-layer rewrite is required.

## Design Notes

- Light product style with soft surfaces, rounded cards, and large hero sections
- Russian as the main MVP language
- Public vacancy feed first, role-based dashboards second
- Telegram is required for both roles
- AI matching is part of the MVP experience for seekers and employers

## Project Structure

```text
client/   React app
server/   Express API, migrations, Telegram integration
uploads/  Stored PDF resumes
```

## Local Development

### 1. Install dependencies

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Create `server/.env` from `server/.env.example`.

Optional: create `client/.env` from `client/.env.example`.

### 3. Run migrations

```bash
cd server
npm run migrate
```

### 4. Start the project

Run everything from the repo root:

```bash
npm run dev
```

### 5. Open the app

Main local entry:

```text
http://localhost:3001
```

Notes:

- `localhost:3001` is now the main local site address
- `5173` is only the internal Vite dev server port
- backend API and frontend work together through the same local entry point

## Telegram Flow

1. Employer registers with Telegram username.
2. Employer sends `/start` to the bot once.
3. Bot stores `telegram_chat_id` in the database.
4. Seeker applies with a PDF resume.
5. Employer receives the resume in Telegram and sees the candidate on the site.
6. Employer sends an offer from the dashboard.
7. Seeker accepts or rejects the offer on the site.
8. Employer receives the final decision in Telegram.

## Deploy With Supabase

### Recommended production architecture

- `client/` -> Vercel or Netlify
- `server/` -> Render or Railway
- database -> Supabase Postgres
- file storage -> local disk for MVP, then move to Supabase Storage

### 1. Create a Supabase project

1. Create a new project in Supabase.
2. Open `Connect` in the dashboard.
3. Copy a Postgres connection string.
4. Put it into `server/.env` as `DATABASE_URL`.

For most hosted environments, use:

- `DATABASE_SSL=true`
- a Supabase pooled connection string if your host does not support IPv6 well

Example:

```env
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR_PASSWORD]@aws-0-...pooler.supabase.com:6543/postgres
DATABASE_SSL=true
```

### 2. Run migrations against Supabase

```bash
cd server
npm run migrate
```

### 3. Configure production backend env vars

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your_supabase_connection_string
DATABASE_SSL=true
DATABASE_POOL_MIN=0
DATABASE_POOL_MAX=10
JWT_SECRET=replace_with_a_strong_secret
CLIENT_ORIGIN=https://your-frontend-domain.com
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_MODE=polling
UPLOAD_DIR=../uploads
FILE_STORAGE_DRIVER=local
SUPABASE_STORAGE_BUCKET=resumes
```

### 4. Telegram in production

For MVP, polling is acceptable:

```env
TELEGRAM_MODE=polling
```

For local development when another bot instance is already running, you can disable inbound polling and keep the rest of the app working:

```env
TELEGRAM_MODE=disabled
```

For more stable production hosting, switch to webhook mode:

```env
TELEGRAM_MODE=webhook
TELEGRAM_WEBHOOK_URL=https://your-backend-domain.com
TELEGRAM_WEBHOOK_PATH=/api/telegram/webhook
```

The backend will register the webhook automatically at startup.

### 5. File uploads

Current behavior:

- resumes are stored on local disk via `UPLOAD_DIR`
- suitable for local development and short-lived MVP demos

Planned next step:

- move resume PDFs to Supabase Storage
- keep the rest of the backend architecture unchanged

Until that migration is implemented, use a host with persistent disk if you need production resume retention.

## MVP Features

- Registration and login for seeker and employer
- Public vacancy feed with filters and search
- AI-ranked seeker feed with fallback matching
- Employer AI discovery flow with invite-to-apply
- Vacancy details page
- Employer dashboard with create, edit, close vacancy
- Seeker applications page with inbox/offers
- AI onboarding with manual fallback profile setup
- Approximate jobs map for Aktau districts powered by AI recommendations
- PDF resume upload up to 5 MB
- Telegram delivery of resumes and offer statuses

## Important Environment Variables

```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/qoldan
DATABASE_SSL=false
JWT_SECRET=replace_me
TELEGRAM_BOT_TOKEN=replace_me
TELEGRAM_MODE=polling
UPLOAD_DIR=../uploads
FILE_STORAGE_DRIVER=local
CLIENT_ORIGIN=http://localhost:3001
DEV_CLIENT_URL=http://127.0.0.1:5173
AI_PROVIDER=openai
OPENAI_API_KEY=replace_me
OPENAI_MODEL=gpt-4.1-mini
```

## Demo AI Setup

Use direct OpenAI for the employer AI demo:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
```

Then run:

```bash
cd server
node scripts/seed-mock-data.js
```

This prepares `Aktau City Jobs Hub` with demo vacancies and mock seekers for `/dashboard/ai`.

Important:

- keep the OpenAI key only in `server/.env`
- rotate the key before final delivery if it was ever shared outside the local machine

### Demo login

Employer demo account:

```text
email: demo.employer.aktau@qoldan.kz
password: 123456
```

### Demo flow

1. Log in as the employer demo account.
2. Open `/dashboard/ai`.
3. Select one of the `DEMO AI · ...` vacancies.
4. Review the top AI-ranked candidates with score, summary, interview focus, and outreach message.
5. Click `Пригласить к отклику` to move the candidate into outreach flow.

Recommended vacancy for the strongest demo:

```text
DEMO AI · Продавец-кассир (15 мкр)
```

This vacancy should show several high-quality AI matches immediately after seeding.

## Status

This repository contains the backend, frontend, AI matching flow, and Telegram bot foundation for the MVP. AI is implemented as part of onboarding and vacancy recommendation behavior, not only as pitch material.
