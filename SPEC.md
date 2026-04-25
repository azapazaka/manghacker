# Qoldan MVP Spec

## Goal

Create a Mangystau-focused jobs platform where:

- employers publish vacancies;
- job seekers browse and filter them;
- AI helps rank relevant vacancies for seekers;
- applications are sent as PDF resumes;
- employers receive resumes in Telegram.

## Roles

### Job Seeker

- registers and logs in;
- browses vacancies;
- uploads a PDF resume to apply;
- sees a list of submitted applications;
- completes AI onboarding or manual fallback profile setup;
- gets AI-ranked recommendations and a color-coded jobs map.

### Employer

- registers and logs in;
- provides Telegram username;
- creates, edits, and closes vacancies;
- receives resumes in Telegram after activating the bot with `/start`;
- can use AI candidate matching for vacancies.

## Backend Scope

- Express REST API
- PostgreSQL persistence
- JWT auth
- role-based access control
- vacancy CRUD
- AI onboarding/profile parsing with manual fallback path
- AI recommendation and matching endpoints
- direct OpenAI support for demo employer matching
- application upload and delivery
- Telegram bot activation and file sending

## Frontend Scope

- React + Vite
- Fluent 2 components
- public feed
- AI-ranked seeker feed with working filters
- approximate jobs map by district
- vacancy details
- login and registration
- employer dashboard
- employer AI discovery page with invite-to-apply
- seeker applications page

## Design Direction

- minimalist Fluent 2 style
- bright background
- restrained palette with blue accent
- readable cards, filters, and forms
- responsive layout for desktop and mobile
- Russian-first copy

## Explicitly Out Of Scope

- precise geolocation and real `lat/lng` storage for vacancies
- in-app chat
- admin panel
- payments
