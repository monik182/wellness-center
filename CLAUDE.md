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

React 19 SPA with Vite, TypeScript (strict), React Router v7. Deployed to Cloudflare Pages (all routes rewrite to `/index.html`).

**Data layer** (`src/data/`): Static TypeScript data files for meal plans and reference foods.
- `foods.ts` — exports `Food[]` with typed `FoodGroup` and `FoodTag` unions, macros (kcal, protein, carbs, fat, fiber). Also exports wheel helpers.
- `meals.ts` — meal plan data (MEALS, SCHEDULES, PREP_GUIDE, GROCERY_LIST, KEY_RULES).
- `calorieTrackerFoods.ts` — flat food list used by the calorie tracker's manual search.

**API layer** (`src/api/client.ts`): All requests go to a Cloudflare Worker at `VITE_API_URL`. Header: `X-Api-Key`.
Key methods: `getMeals/addMeal/deleteMeal`, `resolveNutrition(name, weight_g)`, `chat(messages, foods)`, `detectImage(image, mimeType, foods)`, `transcribe(blob)`, `extractNutritionLabel(image, mimeType)`, `getCustomFoods/saveCustomFood`.

**Worker** (`worker/`): Cloudflare Worker handling all backend logic. Routes: meal CRUD, AI resolvers (hardcoded → Open Food Facts → Claude Haiku fallback), label extraction, voice transcription. DB schema in `worker/schema.sql` (D1/SQLite).

**Routing**: All routes share a single `Layout` wrapper. Pages live in `src/pages/`, one file per route.

**State**: No global state management. Each page is self-contained; shared data imported directly from `src/data/`.

**Styles**: Tailwind CSS v4 (`@tailwindcss/vite`). Single global CSS file (`src/styles/global.css`). shadcn/ui components in `src/components/ui/`. No CSS modules.

**Calorie Tracker** (`src/pages/calorie-tracker/`): Multi-tab feature. Tabs: Today (log meals), History, Log (manual/voice/chat/picture). Key types in `types.ts`. Macro targets: regular `{kcal:1475, protein:120}`, gym `{kcal:1650, protein:130}`. Timezone: `Europe/Madrid`.
Sub-views: `TodayTab`, `HistoryTab`, `LogMealTab`, `PictureLogView`.

## Conventions

- Content and data are in Spanish.
- `FoodGroup` and `FoodTag` are string literal unions in `foods.ts` — extend those types when adding new categories.
- TypeScript strict mode is on: no unused locals/parameters.
- `VITE_API_URL` must be set in `.env` for API features to work.
- Worker handles AI calls; client never calls Claude API directly.
