# Wellness Center

Personal nutrition and meal planning app. React 19 SPA backed by a Cloudflare Worker API.

## Dev

```bash
npm run dev       # Vite dev server with HMR
npm run build     # tsc + vite build → dist/
npm run lint      # ESLint
npm run preview   # preview production build
```

Requires `VITE_API_URL` env var pointing to the Cloudflare Worker.

## Stack

- React 19, TypeScript strict, Vite, React Router v7
- Tailwind CSS v4, shadcn/ui components
- Cloudflare Pages (frontend) + Cloudflare Worker (API)
- D1 database (SQLite) for meal logs and custom foods

## Features

- Meal plan viewer, shopping list, prep guide, schedule
- Calorie tracker with daily logs, history, macro targets
- Food logging via text chat, voice, or photo
- Nutrition label scanner (OCR via Claude vision)
- Spin wheel for random meal selection

## Deployment

Frontend deploys to Cloudflare Pages. Worker deploys separately from `worker/`. See `worker/schema.sql` for DB schema.
