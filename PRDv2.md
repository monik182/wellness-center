# PRD v2: Journal Tracker — Extended Features

Builds on top of the v1 journal refactor (PRD-journal-refactor.md). All v1 architecture, API surface, Apple HIG guidelines, and visual style decisions carry forward. This document specs the features that were explicitly deferred from v1.

## Features Overview

| # | Feature | Summary |
|---|---|---|
| 1 | Calendar Date Picker | Tap "Today" in the header → month calendar to jump to any date |
| 2 | Swipe Day Navigation | Swipe left/right on the journal feed to move between days |
| 3 | Barcode Scanning | Scan a packaged food barcode → look up nutrition → log it |
| 4 | Saved Meals + [+] Button | Create, manage, and quick-log reusable meal presets |
| 5 | Streak Counter | Track and display consecutive days with logged meals |
| 6 | Dark Mode | System-aware dark theme that respects the Soft Cream aesthetic |

## Dependencies

All features assume v1 is complete: the journal feed, input bar, macro bar, exercise level toggle, text/voice/photo logging, and the NutritionDetailSheet are all working.

---

## Feature 1: Calendar Date Picker

### Problem
Users need to navigate to past days to review or edit entries. Without a calendar, the only option is sequential day-by-day navigation (swipe, Feature 2), which is slow for jumping more than a few days back.

### Behavior

The "Today" label in the center of `JournalHeader` is tappable. Tapping it opens a `CalendarPicker` bottom sheet (large detent) with a month calendar view.

```
┌─────────────────────────────────────────┐
│  Today          Jun 2026          Done  │
│                                         │
│  M    T    W    T    F    S    S        │
│  1    2    3    4    5    6    7        │
│  8    9   10   11   12   13   14       │
│ 15   16   17   18   19   20   21       │
│ 22   23   24   25   26   27  [28]      │
│ 29   30                                │
│                                         │
│  🔥  C  P  F  (macro summary for       │
│       selected date preview)            │
└─────────────────────────────────────────┘
```

### Interactions

- **Tap a date:** Selects it. The sheet dismisses and the JournalFeed loads that day's entries. The header label updates to show the date (e.g., "Jun 20") or "Today" if it's the current date.
- **"Today" button (top-left):** Quick-return to the current date. Always visible regardless of which month is being viewed.
- **"Done" button (top-right):** Dismisses the sheet without changing the date.
- **Swipe left/right within the calendar:** Navigate between months.
- **Swipe down:** Dismisses the sheet (standard iOS sheet behavior).
- **Drag handle** at the top of the sheet.
- **Days with logged meals** get a small dot indicator below the number (like Apple's native Calendar app).
- **Future dates are disabled** — can't navigate forward past today.
- **Bottom preview:** When hovering/selecting a date, show a compact macro summary for that day below the calendar grid. Helps users find the day they're looking for without having to open each one.

### Header Label States

| State | Label Text |
|---|---|
| Current date selected | "Today" |
| Yesterday | "Yesterday" |
| Same week | Day name (e.g., "Wednesday") |
| Same year | "Jun 20" |
| Different year | "Jun 20, 2025" |

### Component
`CalendarPicker.tsx` — large-detent bottom sheet. Uses the same sheet pattern as other v1 dialogs (drag handle, dimmed background, swipe-to-dismiss).

### Implementation Notes
- Fetch the list of dates with logged meals for the visible month to show dot indicators. This may require a new lightweight API endpoint (`getMealDates(month, year)`) or client-side caching of fetched days.
- The calendar grid cells must be 44pt minimum touch targets.
- Respect the user's locale for week start day (Monday vs Sunday).

---

## Feature 2: Swipe Day Navigation

### Problem
The calendar picker handles jumping to distant dates, but day-to-day navigation (checking yesterday, flipping back a couple days) should be faster — a single swipe gesture.

### Behavior

Horizontal swipe on the `JournalFeed` area changes the selected date.

- **Swipe left:** Go to the next day (tomorrow) — disabled if already on today.
- **Swipe right:** Go to the previous day (yesterday, day before, etc.).

### Interactions

- The swipe triggers a slide transition animation: the current feed slides off-screen in the swipe direction, the new day's feed slides in from the opposite side. Match the feel of swiping between pages in Apple's native apps.
- The header date label updates to reflect the new date.
- The macro bar updates to show the new day's totals.
- The exercise level button updates to show that day's saved exercise level.
- The input bar remains functional — entries logged while viewing a past day save to that day's log (consistent with v1 behavior).
- **Swipe right on today** does nothing (or shows a subtle bounce to indicate you're at the edge).
- **Swipe left on a past day** moves forward. Swipe left on today does nothing / bounces.

### Gesture Details

- The swipe should require a horizontal drag of at least 50px to trigger, to avoid conflicts with vertical scrolling.
- If the user is mid-scroll (vertical), the horizontal swipe should not activate.
- Momentum swiping (fast flick) should navigate exactly one day, not multiple.
- Consider a visual date indicator that briefly appears during the transition (e.g., a floating label showing the date you're swiping to).

### Implementation Notes
- Use touch event listeners or a gesture library on the `JournalFeed` container.
- Pre-fetch adjacent days' data when the user navigates to a date (prefetch yesterday and tomorrow) so swipes feel instant.
- Don't conflict with the browser's back/forward swipe gesture (which typically uses the very edge of the screen). Our swipe should activate from the content area, not the screen edges.

---

## Feature 3: Barcode Scanning

### Problem
Packaged foods have exact nutrition info on the label. Typing "puffed chocolate rice bites" and relying on AI estimation is less accurate than scanning the barcode and pulling the manufacturer's data. Amy Food Journal already does this well (see original screenshots — barcode scan → product lookup → serving size selection).

### Flow

```
User taps 📷 in InputBar
  → Action sheet: "Take Photo" / "Choose from Library" / "Scan Barcode"
  → User taps "Scan Barcode"
  → BarcodeScannerSheet opens (full-screen camera with scan overlay)
  → User points camera at barcode
  → Barcode detected → lookup begins
  
  FOUND:
    → ProductReviewSheet opens:
      - Product image + name (from database)
      - Serving options (e.g., "100g", "1 oz (28.4g)", "¼ cup (30g)")
      - Custom amount option (enter grams manually)
      - Number of servings selector (+/-)
      - Selected serving macro breakdown (cal, protein, carbs, fat, sugar, fiber, sodium)
      - "Something look off? Scan the package instead" fallback link
      - "Add" button (top-right) → addMeal() → entry in feed
    
  NOT FOUND:
    → BarcodeNotFoundSheet:
      - Friendly illustration + "Barcode not found"
      - "Take a Photo of the Package" button → redirects to package photo flow
      - "Cancel and Log Manually" link → dismisses and puts focus on the text input
```

### Package Photo Fallback Flow

When a barcode isn't found and the user chooses "Take a Photo of the Package":

```
→ PackageScanSheet opens:
  - Instructions: "Snap the package — take both a photo of the front and the nutrition label"
  - Two photo slots: "Package" (required) + "Nutrition Label" (required)
  - User takes/uploads both photos
  - "Analyze Package" button
  → Calls extractNutritionLabel() with the nutrition label image
  → On success: opens ProductReviewSheet with the extracted data
  → User selects serving size → "Add" → entry in feed
```

### Barcode Lookup

The barcode scan needs a lookup service. Options:

**Option A — Open Food Facts API (recommended)**
Free, open-source database. API: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`. Returns product name, brand, nutrition per 100g, serving size, images. Good coverage for European products (important since Mónica is in Spain). No API key required.

**Option B — Worker-side lookup**
Add a new endpoint to the Cloudflare Worker that proxies the Open Food Facts call. Benefits: can cache results in D1, can add manual product entries for barcodes not in the database.

→ **Go with Option B.** The worker already handles all external API calls. Add a `GET /api/barcode/:code` endpoint that checks D1 cache first, then falls back to Open Food Facts.

### Barcode Detection

For reading barcodes from the camera:

**Option A — Native BarcodeDetector API**
Available in Chrome/Edge (and Safari 17.2+). No library needed. Supports EAN-13, UPC-A, and other common product barcodes.

**Option B — QuaggaJS / ZXing library**
Fallback if BarcodeDetector isn't available. Adds a dependency but guarantees broader support.

→ **Use BarcodeDetector with QuaggaJS fallback.** Feature-detect `window.BarcodeDetector`, use it if available, otherwise load the library.

### New Components

| Component | Description |
|---|---|
| `BarcodeScannerSheet` | Full-screen camera view with a dashed scan target area. Shows "Hold steady once the barcode is in frame." Real-time barcode detection from the video stream. |
| `ProductReviewSheet` | Bottom sheet showing product details, serving options, serving count, and selected serving macro breakdown. "Add" button in the header. |
| `BarcodeNotFoundSheet` | Friendly error state with fallback options (photo the package, or cancel). |
| `PackageScanSheet` | Two-photo capture flow (package front + nutrition label). "Analyze Package" button triggers `extractNutritionLabel()`. |

### New API Endpoint

```
GET /api/barcode/:code
Response: {
  found: boolean,
  product?: {
    name: string,
    brand: string,
    image_url: string,
    servings: Array<{
      label: string,       // "100g", "1 oz (28.4g)", "¼ cup (30g)"
      weight_g: number,
      kcal: number,
      protein: number,
      carbs: number,
      fat: number,
      sugar: number,
      fiber: number,
      sodium_mg: number,
    }>,
    custom_amount: {       // per 100g values for custom serving calculation
      kcal: number,
      protein: number,
      carbs: number,
      fat: number,
      sugar: number,
      fiber: number,
      sodium_mg: number,
    }
  }
}
```

### Action Sheet Update

The camera action sheet from v1 (2 options) expands to 3:

```
┌─────────────────────────────────────────┐
│  Take Photo                             │
│  Choose from Library                    │
│  Scan Barcode                           │
│                                         │
│  Cancel                                 │
└─────────────────────────────────────────┘
```

### Implementation Notes
- Camera permissions are already handled by the photo flow from v1. Barcode scanning reuses the same permission.
- The barcode scanner should auto-detect — no shutter button. As soon as a valid barcode is in frame, trigger the lookup.
- Show a loading state ("Looking up barcode...") between detection and result.
- If the user scans an item they've scanned before, the D1 cache makes it instant.

---

## Feature 4: Saved Meals + [+] Button

### Problem
Users eat the same meals repeatedly. Typing "fried taco with half a cup of black beans, a cup of minced beef and sour cream made with Greek yogurt and lemon" every time is painful. Pre-built meals already exist in the codebase (`PRE_BUILT_MEALS` in `calorieTrackerFoods.ts`) but aren't surfaced in the new journal UI.

### The [+] Button

The `InputBar` has a [+] button (stubbed in v1). Tapping it opens the `SavedMealsSheet`.

### SavedMealsSheet

A large-detent bottom sheet showing all saved meals, searchable.

```
┌─────────────────────────────────────────┐
│  Saved Meals                        ✕   │
│                                         │
│  🔍 Search meals...                     │
│                                         │
│  MY MEALS                               │
│  ┌─────────────────────────────────────┐│
│  │ Morning coffee          145 cal     ││
│  │ Soy milk + protein + cacao          ││
│  ├─────────────────────────────────────┤│
│  │ Post-gym recovery       215 cal     ││
│  │ Protein shake + turkey slices       ││
│  ├─────────────────────────────────────┤│
│  │ Quinoa chicken bowl     420 cal     ││
│  │ Chicken + quinoa + peppers + ...    ││
│  └─────────────────────────────────────┘│
│                                         │
│  PRESETS                                │
│  ┌─────────────────────────────────────┐│
│  │ Batido mocha proteico   220 cal     ││
│  │ Tostada de proteína     310 cal     ││
│  │ Bowl de quinoa y pollo  420 cal     ││
│  │ ...                                 ││
│  └─────────────────────────────────────┘│
│                                         │
│  + Create New Meal                      │
└─────────────────────────────────────────┘
```

### Two Sources of Saved Meals

**1. Presets (read-only)**
The existing `PRE_BUILT_MEALS` from `calorieTrackerFoods.ts`. These are curated by the meal plan and can't be edited or deleted by the user. They appear under a "Presets" section.

**2. My Meals (user-created)**
Custom meals the user creates and manages. Stored in D1 via new API endpoints. These appear under "My Meals" and can be edited or deleted.

### Quick-Log a Saved Meal

Tapping a saved meal row immediately logs it:

```
User taps "Batido mocha proteico"
  → Confirm dialog: "Log Batido mocha proteico? (220 cal)"
  → [Log] [Edit serving] [Cancel]
  → User taps "Log"
  → addMeal() with the pre-computed macros
  → Entry appears in feed
  → Sheet dismisses
```

"Edit serving" opens a mini editor where the user can adjust the portion multiplier (e.g., 0.5x, 1x, 1.5x, 2x) before logging.

### Creating a New Saved Meal

Tapping "+ Create New Meal" opens the `MealEditorSheet`:

```
┌─────────────────────────────────────────┐
│  New Meal                    Save       │
│                                         │
│  Meal Name                              │
│  ┌─────────────────────────────────────┐│
│  │ Morning coffee                      ││
│  └─────────────────────────────────────┘│
│                                         │
│  Items                                  │
│  ┌─────────────────────────────────────┐│
│  │ Soy milk (200ml)         54 cal  ✕  ││
│  │ Protein powder (30g)    115 cal  ✕  ││
│  │ Cacao powder (5g)        12 cal  ✕  ││
│  └─────────────────────────────────────┘│
│                                         │
│  + Add Item                             │
│                                         │
│  Total: 181 cal · P 32g · C 4g · F 4g  │
└─────────────────────────────────────────┘
```

### Adding Items to a Saved Meal

Tapping "+ Add Item" opens an item picker:

- **Search by name:** Type to search the existing food database (`TRACKER_FOODS`). Select a food → set the weight in grams → add to the meal.
- **Type freeform:** Type any food description (like the regular text input). The AI resolves it and the result gets added as an item with its macros.
- **From recent entries:** Show the user's recent journal entries. Tap one to add it as an item.

### Editing and Deleting Saved Meals

- **Swipe left** on a "My Meals" row to reveal Edit and Delete actions.
- **Editing** opens the `MealEditorSheet` pre-populated with the existing items.
- **Deleting** shows a confirmation ("Delete 'Morning coffee'? This can't be undone." → Delete / Cancel). Destructive action in red.
- **Presets cannot be edited or deleted.** They can only be logged.

### Creating a Saved Meal from a Journal Entry

After logging a complex meal via text (e.g., "fried taco with half a cup of black beans..."), the user might want to save it for reuse. In the `NutritionDetailSheet` (tap on a feed entry), add a "Save as Meal" action that creates a new saved meal from that entry's resolved items.

### New API Endpoints

```
GET    /api/saved-meals          → list user's custom saved meals
POST   /api/saved-meals          → create a new saved meal
PUT    /api/saved-meals/:id      → update a saved meal
DELETE /api/saved-meals/:id      → delete a saved meal
```

Saved meal schema:
```
{
  id: string,
  name: string,
  items: Array<{
    name: string,
    weight_g: number,
    kcal: number,
    protein: number,
    carbs: number,
    fat: number,
    sugar: number,
    fiber: number,
  }>,
  total_kcal: number,
  total_protein: number,
  total_carbs: number,
  total_fat: number,
  created_at: string,
  updated_at: string,
}
```

### New Components

| Component | Description |
|---|---|
| `SavedMealsSheet` | Large-detent bottom sheet. Lists "My Meals" and "Presets" sections. Search bar at top. "+ Create New Meal" at bottom. |
| `MealEditorSheet` | Full-screen sheet for creating/editing a saved meal. Name field, item list with weights and macros, add/remove items, running total. |
| `MealItemPicker` | Search-and-select UI for adding items to a saved meal. Searches food DB + freeform text input. |
| `ServingMultiplierDialog` | Small dialog for adjusting portion (0.5x–3x) before logging a saved meal. |

---

## Feature 5: Streak Counter

### Problem
Consistency is more important than perfection for nutrition tracking. A streak counter provides a small motivational nudge to keep logging daily, even if the entries aren't perfect.

### Behavior

The streak counter appears in the `JournalHeader`, right side, between the exercise level button and the settings gear. It shows a 🔥 emoji followed by the streak count.

```
Header layout:
[Logo]     Today     [🏋️] [🔥 12] [⚙️]
```

### What Counts as a Streak Day

A day counts toward the streak if **at least one meal was logged** on that date. The type of logging doesn't matter (text, voice, photo, barcode, saved meal). The calorie count doesn't matter. Just: did you log something?

### Streak Calculation

- The streak is the number of **consecutive days** ending with today (or yesterday, if the user hasn't logged today yet) that have at least one logged meal.
- If today has no entries yet but yesterday did, the streak still shows yesterday's count (the user hasn't "broken" it yet — they have until midnight).
- If both today and yesterday have no entries, the streak resets to 0.
- Timezone for date boundaries: system timezone (consistent with v1).

### Visual States

| Streak | Display | Notes |
|---|---|---|
| 0 | `🔥 0` | Dim/muted color to indicate no active streak |
| 1–6 | `🔥 N` | Normal display |
| 7+ | `🔥 N` | Could add a subtle highlight or different color to celebrate weekly milestones |
| 30+ | `🔥 N` | Could add a second visual indicator (glow, different emoji) — decide later |

### Tapping the Streak

Tapping the streak counter opens a `StreakDetailDialog` (medium-detent bottom sheet):

```
┌─────────────────────────────────────────┐
│  Your Streak                            │
│                                         │
│          🔥                             │
│          12 days                        │
│                                         │
│  Current streak: 12 days               │
│  Longest streak: 34 days               │
│  Total days logged: 89                  │
│                                         │
│  Keep it going! Log something today     │
│  to continue your streak.               │
└─────────────────────────────────────────┘
```

### Data Storage

Streak calculation can be derived from existing meal data — query D1 for distinct dates with at least one meal, then count consecutive days backwards from today. No new table needed, just a new query.

For the "longest streak" and "total days logged" stats, compute on the fly from the same data, or cache in a user settings row if performance becomes an issue.

### New Components

| Component | Description |
|---|---|
| `StreakBadge` | Small inline component in the header: 🔥 + count. Tappable. |
| `StreakDetailDialog` | Medium-detent bottom sheet showing current streak, longest streak, and total days logged. |

### New API

```
GET /api/streak → { current: number, longest: number, totalDays: number }
```

Computed server-side from the meals table. Cached per-day (invalidate when a meal is added or deleted).

---

## Feature 6: Dark Mode

### Problem
Users who have their phone set to dark mode expect apps to respect that preference. A bright white screen at 11pm is jarring. Apple's HIG specifically calls out dark mode support as an expectation for polished iOS-like apps.

### Approach

System-aware: detect the user's system preference via `prefers-color-scheme: dark` media query. No in-app toggle initially — follow the system. An in-app toggle can be added later if requested.

### Dark Palette

The Soft Cream palette transforms to a warm dark variant. Not pure black (#000) — use warm dark grays to maintain the soft, human feel of the brand.

| Element | Light Mode | Dark Mode |
|---|---|---|
| Main background | `#FFFDF5` Soft Cream | `#1A1917` Warm Black |
| Card/sheet background | `#FFFFFF` White | `#2A2826` Warm Dark Gray |
| Elevated surface | `#FFF0E5` Peachy Whisper | `#332F2B` Warm Mid Gray |
| Primary text | `#1A1A1A` Off-Black | `#F5F0E8` Soft Beige |
| Secondary text | `#2D2D2D` Deep Charcoal | `#A8A29E` Warm Gray |
| Muted/disabled text | `#9CA3AF` | `#6B6560` |
| Dividers/borders | `#E5E0D8` | `#3D3835` |
| Input field background | `#F5F0E8` Soft Beige | `#2A2826` |

### Accent Colors (Pastel → Adjusted for Dark)

Pastel accents need higher saturation/brightness on dark backgrounds to maintain visibility and contrast.

| Theme | Light Mode | Dark Mode |
|---|---|---|
| Data / Green | `#B2D8B2` | `#7BC47B` |
| AI / Tangerine | `#FFD1A1` | `#E8A86A` |
| Code / Lavender | `#E0BBE4` | `#C490CA` |
| Productivity / Blue | `#BDE0FE` | `#7BB8E8` |

### Progress Indicators

| State | Light Mode | Dark Mode |
|---|---|---|
| On track (green) | `#22C55E` | `#4ADE80` |
| Warning (orange) | `#F59E0B` | `#FBBF24` |
| Over target (red) | `#EF4444` | `#F87171` |
| Progress bar track | `#E5E0D8` | `#3D3835` |

### Implementation

**CSS custom properties (variables):** Define all colors as CSS variables in `global.css` with light mode defaults, then override in a `@media (prefers-color-scheme: dark)` block. Every component references variables, never hardcoded colors.

```css
:root {
  --bg-primary: #FFFDF5;
  --bg-card: #FFFFFF;
  --bg-elevated: #FFF0E5;
  --text-primary: #1A1A1A;
  --text-secondary: #2D2D2D;
  /* ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1A1917;
    --bg-card: #2A2826;
    --bg-elevated: #332F2B;
    --text-primary: #F5F0E8;
    --text-secondary: #A8A29E;
    /* ... */
  }
}
```

**Tailwind integration:** If using Tailwind's dark mode, set `darkMode: 'media'` in the config and use `dark:` prefix utilities where CSS variables aren't enough.

### Contrast Verification

All text/background combinations must pass WCAG AA contrast requirements (4.5:1 for body text, 3:1 for large text):

| Combination | Ratio | Pass? |
|---|---|---|
| `#F5F0E8` on `#1A1917` | ~14:1 | Yes |
| `#A8A29E` on `#1A1917` | ~5.5:1 | Yes |
| `#A8A29E` on `#2A2826` | ~4.2:1 | Borderline — verify |
| `#6B6560` on `#1A1917` | ~3.2:1 | Large text only |

### What Changes Per Component

| Component | Dark Mode Considerations |
|---|---|
| `JournalHeader` | Background matches `--bg-primary`. Icons switch to light variants. |
| `MacroBar` | Background: `--bg-card`. Text: `--text-primary`. Ensure the colored macro labels (C/P/F) use dark-mode accent colors. |
| `MacroDetailDialog` | Sheet background: `--bg-card`. Progress bar track: `--border`. Circular rings: use dark-mode adjusted accent colors. |
| `JournalFeed` | Background: `--bg-primary`. FeedEntry text: `--text-primary` for food name, `--text-secondary` for calories. |
| `InputBar` | Input field background: `--bg-elevated`. Text: `--text-primary`. Button icons: light variants. |
| All sheets/dialogs | Sheet background: `--bg-card`. Dimmed overlay: `rgba(0,0,0,0.5)` → `rgba(0,0,0,0.7)` for dark mode (needs stronger contrast against dark background). |
| `FeedEntry` (pending state) | "Thinking..." text in `--text-secondary` with a subtle pulse animation. |

### Implementation Notes
- Test both modes on actual devices. Colors that look fine on a monitor may not work on OLED screens (pure blacks can cause "smearing" on OLED — our warm dark grays avoid this).
- Sheets and dialogs should feel slightly elevated from the background in dark mode. Use subtle border or shadow differentiation.
- The camera/photo flows already use the device's native camera UI, which respects the system dark mode automatically.
- Images in feed entries (photo-logged meals) don't change — they're photos.

---

## Implementation Priority

Suggested order based on user impact and dependency chain:

| Priority | Feature | Reasoning |
|---|---|---|
| 1 | Calendar Date Picker | Core navigation. Referenced as v1 Phase 5 — may already be partially built. |
| 2 | Swipe Day Navigation | Natural extension of the calendar picker. Small scope. |
| 3 | Saved Meals + [+] Button | High daily-use value. Reduces friction for repeat meals. Existing data infrastructure (`PRE_BUILT_MEALS`). |
| 4 | Streak Counter | Motivational feature. Small scope. Pure read-only from existing data. |
| 5 | Barcode Scanning | High value but larger scope (new API endpoint, camera barcode detection, product lookup, package photo fallback). |
| 6 | Dark Mode | Visual polish. Important but doesn't change functionality. Best done last when all components are stable so the color system is applied once, consistently. |

---

## Backend Changes Summary

Unlike v1 (frontend-only), v2 requires some worker changes:

| Feature | Endpoint | Action |
|---|---|---|
| Calendar Picker | `GET /api/meal-dates?month=6&year=2026` | Returns array of dates with logged meals for dot indicators |
| Barcode Scanning | `GET /api/barcode/:code` | Lookup barcode in D1 cache, fallback to Open Food Facts API |
| Saved Meals | `GET /api/saved-meals` | List user's custom saved meals |
| Saved Meals | `POST /api/saved-meals` | Create a new saved meal |
| Saved Meals | `PUT /api/saved-meals/:id` | Update a saved meal |
| Saved Meals | `DELETE /api/saved-meals/:id` | Delete a saved meal |
| Streak | `GET /api/streak` | Compute current, longest, and total days from meals table |

### New D1 Tables

```sql
-- Barcode cache
CREATE TABLE barcode_cache (
  code TEXT PRIMARY KEY,
  product_data TEXT NOT NULL,  -- JSON blob
  fetched_at TEXT NOT NULL
);

-- User saved meals
CREATE TABLE saved_meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  items TEXT NOT NULL,          -- JSON array of items with macros
  total_kcal REAL NOT NULL,
  total_protein REAL NOT NULL,
  total_carbs REAL NOT NULL,
  total_fat REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Exercise level per day (if not already added in v1)
CREATE TABLE daily_settings (
  date TEXT PRIMARY KEY,
  exercise_level TEXT NOT NULL DEFAULT 'none'
);
```

---

## Notes

- All Apple HIG guidelines from the v1 PRD appendix apply here too. Every new sheet, dialog, button, and touch target follows the same rules.
- All UI text in English.
- System timezone for all date logic.
- The Soft Cream visual style carries forward — dark mode is the warm variant of the same aesthetic, not a different brand.