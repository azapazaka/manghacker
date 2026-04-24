# Qoldan

Qoldan is a hackathon MVP for the Mangystau region: employers publish vacancies, job seekers apply with a PDF resume, and the employer receives that resume directly in Telegram.

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
- AI assistant is intentionally out of scope for the current stage

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
- Vacancy details page
- Employer dashboard with create, edit, close vacancy
- Seeker applications page with inbox/offers
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
```

## Status

This repository contains the backend, frontend, and Telegram bot foundation for the MVP. AI assistant features are intentionally excluded for now.
