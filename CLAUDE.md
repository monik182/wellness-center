# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server with HMR
npm run build     # tsc + vite build → dist/
npm run lint      # ESLint (flat config)
npm run preview   # preview production build
```

No test runner configured.

## Architecture

React 19 SPA with Vite, TypeScript (strict), React Router v7. Deployed to Vercel (all routes rewrite to `/index.html`).

**Data layer** (`src/data/`): Static TypeScript data files, no API calls.
- `foods.ts` — exports `Food[]` with typed `FoodGroup` and `FoodTag` unions, macros (kcal, protein, carbs, fat, fiber).
- `meals.ts` — meal plan data built from the food types.

**Routing**: All routes share a single `Layout` wrapper. Pages live in `src/pages/`, one file per route.

**State**: No global state management. Each page is self-contained; shared data imported directly from `src/data/`.

**Styles**: Single global CSS file (`src/styles/global.css`). No CSS modules or styled components.

## Conventions

- Content and data are in Spanish.
- `FoodGroup` and `FoodTag` are string literal unions in `foods.ts` — extend those types when adding new categories.
- TypeScript strict mode is on: no unused locals/parameters.
