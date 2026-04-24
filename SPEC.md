# Qoldan MVP Spec

## Goal

Create a Mangystau-focused jobs platform where:

- employers publish vacancies;
- job seekers browse and filter them;
- applications are sent as PDF resumes;
- employers receive resumes in Telegram.

## Roles

### Job Seeker

- registers and logs in;
- browses vacancies;
- uploads a PDF resume to apply;
- sees a list of submitted applications.

### Employer

- registers and logs in;
- provides Telegram username;
- creates, edits, and closes vacancies;
- receives resumes in Telegram after activating the bot with `/start`.

## Backend Scope

- Express REST API
- PostgreSQL persistence
- JWT auth
- role-based access control
- vacancy CRUD
- application upload and delivery
- Telegram bot activation and file sending

## Frontend Scope

- React + Vite
- Fluent 2 components
- public feed
- vacancy details
- login and registration
- employer dashboard
- seeker applications page

## Design Direction

- minimalist Fluent 2 style
- bright background
- restrained palette with blue accent
- readable cards, filters, and forms
- responsive layout for desktop and mobile
- Russian-first copy

## Explicitly Out Of Scope

- AI assistant
- matching or recommendations
- in-app chat
- admin panel
- payments
