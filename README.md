# INSTANTIA

**Need it. Create it. Use it. Done.**

INSTANTIA is a cloud-only, on-demand software factory. It routes requests to verified capabilities where available and is designed to add custom generation through isolated cloud workers with automated tests and an explicit keep/dispose decision.

## MVP status
- React + TypeScript web app for Vercel (`apps/web`).
- Node.js + Express API for Render (`apps/api`).
- Verified image-to-PDF capability.
- Capability routing and honest responses for features not yet implemented.
- No XAMPP and no local execution engine for end users.

## Current limitations
Custom AI generation, isolated execution workers, authentication, persistent saved tools, CSV analysis, billing, and MySQL persistence are not implemented yet. Do not execute generated code in the API process. Arbitrary code must run in isolated, short-lived cloud workers before being offered to users.

## Deploy
### Render API
Create a Web Service from this repository with root directory `apps/api`, build command `npm install`, start command `npm start`. Set `WEB_ORIGIN` to the deployed Vercel origin and optionally `MAX_UPLOAD_MB`.

### Vercel frontend
Import this repository, set root directory `apps/web`, framework preset Vite, build command `npm run build`, output directory `dist`. Set `VITE_API_URL` to the Render API base URL without a trailing slash.

## Maintainer development
Node.js 20+. Run `npm install`, then `npm run dev`. Local development is for maintainers only; end-user tool execution is intended to remain cloud-only.