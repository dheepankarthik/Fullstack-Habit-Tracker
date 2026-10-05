# Notes

## What I built
Fullstack habit tracker with JWT auth, deployed to Vercel + Render.

## Hardest parts
- Understanding useEffects and dependency arrays (still fuzzy)
- Deploying: env vars must be set on BOTH Vercel and Render separately
- SQLite on Render free tier resets on redeploy (data is lost)

## What I'd do differently next time
- Centralize the API URL in a single file (currently duplicated in Auth.jsx and HabitTracker.jsx)
- Add a real migration system instead of deleting habits.db
- Use PostgreSQL from the start to avoid persistence issues

