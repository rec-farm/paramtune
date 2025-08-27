# Deployment to Vercel

## Prerequisites
- A GitHub or GitLab repository for the project
- Vercel account with access to the repository

## Steps
1. Push the repository to GitHub/GitLab.
2. In Vercel, click "New Project" and import the repo.
3. Framework preset: Next.js.
4. Build command: `next build` (default). Output directory: `.next` (default).
5. Environment Variables:
   - `CORS_ORIGIN` = your production domain (e.g. https://paramtune.example.com)
   - `REDIS_URL` or host/port/password/db variables
6. Click Deploy. Subsequent pushes to `main` will auto-deploy.

## Project Settings
- `vercel.json` provides security headers globally.
- API routes run on the Node.js runtime (declared in route files).
- Use Vercel Analytics/Monitoring as needed.

## Static Assets
- Place static assets under `public/` to leverage Vercel CDN.