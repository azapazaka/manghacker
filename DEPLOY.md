# Deploy Guide

This repository is configured for a split production deployment:

- `client/` -> Vercel
- `server/` -> Render web service
- database -> Supabase Postgres or Render Postgres

## 1. Render API deployment

The repo root now includes [render.yaml](/Users/abdra/Downloads/Mangystau-Hub-main/render.yaml), so Render can create the backend from the Blueprint.

Recommended Render settings:

- Service type: `Web Service`
- Root directory: `server`
- Plan: `Starter` or higher
- Persistent disk: enabled through the Blueprint at `/opt/render/project/src/uploads`

Important:

- `Free` is not a good fit here because `uploads/` needs persistent storage.
- Telegram should run in `webhook` mode in production.

Render environment variables to fill manually:

- `DATABASE_URL`
- `CLIENT_ORIGIN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `AI_PROVIDER`
- one provider key set that matches `AI_PROVIDER`, for example `OPENAI_API_KEY`

Useful defaults already come from the Blueprint:

- `NODE_ENV=production`
- `DATABASE_SSL=true`
- `TELEGRAM_MODE=webhook`
- `UPLOAD_DIR=/opt/render/project/src/uploads`
- `ALLOWED_ORIGIN_SUFFIXES=.vercel.app`

Notes:

- If `TELEGRAM_WEBHOOK_URL` is left empty, the server will automatically fall back to Render's `RENDER_EXTERNAL_URL`.
- Migrations run automatically before each deploy via `preDeployCommand`.

## 2. Vercel frontend deployment

Create a Vercel project from this repository with the root directory set to `client`.

Recommended Vercel project settings:

- Framework preset: `Vite`
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Set these Vercel environment variables:

- `VITE_API_URL=https://your-render-service.onrender.com/api`
- `VITE_TELEGRAM_BOT_USERNAME=your_bot_username`

The frontend includes [client/vercel.json](/Users/abdra/Downloads/Mangystau-Hub-main/client/vercel.json) so deep links like `/login` and `/dashboard` keep working in production.

## 3. Final wiring

After both services exist:

1. Copy the production Vercel domain into Render `CLIENT_ORIGIN`
2. Redeploy the Render service
3. Open Telegram bot and send `/start`
4. Check `https://your-render-service.onrender.com/api/health`
5. Open the Vercel frontend and test login, vacancy creation, resume upload, and Telegram delivery

## 4. Current production limitation

Resume PDFs still use local disk storage through `multer`. This now works on Render because the service gets a persistent disk, but long-term it is still better to move resumes to object storage such as Supabase Storage.
