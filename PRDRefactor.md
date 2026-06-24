# PRD: Calorie Tracker → Journal-Style Feed Refactor

## Problem

The current calorie tracker uses a 3-tab structure (Today / Log / History) that creates friction between logging and viewing. Every meal log requires a tab switch, a multi-step form, and another tab switch to see the result. The goal is Amy Food Journal-level fluidity: open the app, type (or talk, or snap a photo), and see the entry appear instantly in a chronological feed.

## Success Criteria

1. User opens the app and can immediately start typing a food item — no tab switching, no mode selection
2. Food entries appear as notes in a flat chronological feed
3. Voice dictation auto-submits and resolves without extra taps
4. Photo logging (take or upload) detects the food, shows a confirmation/edit step, then logs it
5. Non-food photos are identified but cannot be saved as meal entries
6. Macro totals are always visible
7. All existing backend functionality is preserved — this is a frontend-only refactor

## Decisions (Locked In)

| Question | Decision |
|---|---|
| History access | "Today" label in the header is tappable → opens a calendar date picker. Selecting a past date loads that day's entries in the same journal view. Past days are fully editable — same input bar, same flows, saves to that day's log. |
| Date navigation | Primary: tap "Today" → calendar picker. Future: swipe left/right between days. |
| Macro bar | Bottom bar shows compact totals (`🔥 kcal · C · P · F`). Tapping it opens a `MacroDetailDialog` with full breakdown: calorie progress bar + circular rings for Carbs, Protein, Fat, Sugar, Fiber, Sodium. No "Burned" row. |
| Exercise level | Round icon in the header (right side, before settings gear, next to streak flame). Tapping opens `ExerciseLevelDialog` with 4 options: None (default), Easy, Medium, Hard. Selection updates today's macro targets. |
| Entry grouping | Flat chronological list, no meal-time grouping |
| Entry layout | Food name on the left, calories on the right (e.g., `fried plantain chips          242 cal`) |
| Chat mode | Removed. Simpler type-and-resolve replaces the conversational flow |
| Old components | Not deleted — just not rendered. Preserved in codebase for potential future use. |
| Language | All UI content in English |
| Timezone | Grabbed from the user's system (`Intl.DateTimeFormat().resolvedOptions().timeZone`), not hardcoded |

## Scope

### IN

- New journal-style page replacing the Today + Log tabs
- Bottom input bar: text field + mic button + camera button
- Text flow: type → AI resolves → entry appears in feed with calories to the right
- Voice flow: tap mic → transcription toast → auto-submit → entry appears
- Photo flow: tap camera → action sheet (Take Photo / Choose from Library) → AI detection → confirmation sheet → entry in feed
- Non-food photo handling (identified, not loggable)
- Macro summary bar (persistent bottom bar, tappable → full breakdown dialog)
- MacroDetailDialog: calorie progress bar + circular rings for C/P/F/Sugar/Fiber/Sodium
- Exercise level toggle: header icon → dialog with None/Easy/Medium/Hard → adjusts macro targets
- Calendar-based date navigation via tappable header label
- Past day editing: navigate to any past date, edit/add/delete entries normally
- Auto-captured timestamp on each entry (no manual time picker)
- System timezone detection (not hardcoded)

### OUT (for now)

- Barcode scanning
- Scan menu option
- Saved/preset meals (future phase)
- Swipe left/right between days (future — calendar picker covers navigation for now)
- Streak counter (the 🔥 number next to settings — future)
- Any worker/backend changes — the API surface stays identical
- Rest of the app (meal plans, food DB, wheel, etc.) — untouched, components preserved but not rendered

## Macro Bar + Exercise Level Design

### Bottom Macro Bar (always visible)
A compact sticky bar at the bottom of the screen showing running daily totals:
`🔥 1,082 · C 120 · P 45 · F 30`

Tapping the bar opens the **MacroDetailDialog**.

### MacroDetailDialog (popup/bottom sheet)
Full breakdown with visual indicators. Reference: Amy's "Goals" dialog.

Layout:
```
┌─────────────────────────────────────────┐
│  Goals                                  │
│                                         │
│  🔥 Calories              1,082 / 1,475│
│  ████████████████░░░░░░░░  (progress)   │
│                                         │
│   ┌───┐    ┌───┐    ┌───┐              │
│   │120│    │ 45│    │ 30│              │
│   └───┘    └───┘    └───┘              │
│   Carbs   Protein    Fat               │
│                                         │
│   ┌───┐    ┌───┐    ┌───┐              │
│   │ 25│    │ 8 │    │142│              │
│   └───┘    └───┘    └───┘              │
│   Sugar    Fiber    Sodium (mg)         │
└─────────────────────────────────────────┘
```

- Calorie progress bar: green when under target, orange at 90%+, red when over
- Macro rings: circular progress indicators for each macro
- No "Burned" row — we don't track exercise calories
- Values update in real-time as entries are added/deleted

### Exercise Level Button (header, right side)
Position: right side of header, before the settings gear, next to where the streak flame will go.

Icon: a small round button with a fitness/dumbbell icon. Default state shows "None."

Tapping opens the **ExerciseLevelDialog**:
```
┌─────────────────────────────────────────┐
│  Today's activity level                 │
│                                         │
│  ○ None (default)     → 1,475 kcal     │
│  ○ Easy               → 1,550 kcal     │
│  ○ Medium             → 1,650 kcal     │
│  ○ Hard               → 1,750 kcal     │
│                                         │
│  Adjusts your calorie and protein       │
│  targets for today.                     │
└─────────────────────────────────────────┘
```

Macro targets per level:

| Level | Calories | Protein |
|---|---|---|
| None | 1,475 | 120g |
| Easy | 1,550 | 125g |
| Medium | 1,650 | 130g |
| Hard | 1,750 | 135g |

On selection: macro bar and MacroDetailDialog update to reflect the new targets. The exercise level is persisted for that day (stored in D1 alongside meal data, or as a separate daily setting).

## Architecture

### Current Structure
```
CalorieTrackerPage (3 tabs)
├── TodayTab         → logged meals + macro summary
├── LogMealTab       → text / voice / chat / picture input
│   ├── ChatLogView
│   ├── VoiceLogView
│   ├── PictureLogView
│   └── ManualSelector
└── HistoryTab       → past days
```

### New Structure
```
CalorieTrackerPage (single journal view)
├── JournalHeader
│   ├── Logo/avatar (left)
│   ├── DateLabel "Today" (center, tappable → CalendarPicker)
│   └── Right cluster: ExerciseLevelButton + 🔥streak(future) + ⚙️Settings
├── JournalFeed (scrollable, full height between header and input bar)
│   ├── FeedEntry (food name left, calories right — e.g., "fried plantain chips    242 cal")
│   ├── FeedEntry ...
│   ├── FeedEntry ...
│   └── (empty state: "Start logging your meals...")
├── MacroBar (sticky bottom, above InputBar)
│   └── 🔥 total · C total · P total · F total (tappable → MacroDetailDialog)
├── InputBar (fixed bottom)
│   ├── TextInput (placeholder: "What did you eat?")
│   ├── MicButton
│   ├── CameraButton → ActionSheet
│   └── [+] button (for saved meals, future)
├── MacroDetailDialog (overlay, triggered by tapping MacroBar)
│   ├── Calorie progress bar (current / target)
│   ├── Circular rings: Carbs, Protein, Fat
│   ├── Circular rings: Sugar, Fiber, Sodium
│   └── No "Burned" row
├── ExerciseLevelDialog (overlay, triggered by header icon)
│   └── Radio options: None / Easy / Medium / Hard → updates targets
├── CalendarPicker (bottom sheet / popover)
├── PhotoConfirmSheet (bottom sheet after photo capture)
│   ├── Image preview
│   ├── Detected food name (editable)
│   ├── Description (editable)
│   ├── "Something not look right?" correction prompt
│   ├── "Calculate Calories" button
│   └── Non-food state: description shown, save disabled
└── NutritionDetailSheet (bottom sheet after resolution)
    ├── Macro breakdown (kcal, protein, carbs, fat, sugar, fiber, sodium)
    ├── Items list (with weight)
    ├── AI confidence / thought process
    └── Accept / Edit / Discard actions
```

### What Stays the Same

- `src/api/client.ts` — all API methods untouched
- `src/data/*` — all food/meal data files untouched
- `worker/` — entire backend untouched
- Other pages (meal plan, food DB, wheel, etc.) — untouched

### What Gets Replaced

| Current File | Action |
|---|---|
| `CalorieTrackerPage.tsx` | Rewritten — no more tabs, new journal layout |
| `TodayTab.tsx` | Preserved (not rendered). Replaced by `JournalFeed` |
| `LogMealTab.tsx` | Preserved (not rendered). Replaced by `InputBar` + resolution logic |
| `ChatLogView` (if exists) | Preserved (not rendered). Chat mode removed in favor of type-and-resolve |
| `VoiceLogView` (if exists) | Preserved (not rendered). Logic absorbed into InputBar mic button |
| `PictureLogView.tsx` | Preserved (not rendered). Replaced by `PhotoConfirmSheet` + `NutritionDetailSheet` |
| `HistoryTab.tsx` | Preserved (not rendered). Replaced by CalendarPicker + same JournalFeed for past dates |

### New Components

| Component | Responsibility |
|---|---|
| `JournalHeader` | Date display (tappable), exercise level button, settings gear |
| `MacroBar` | Compact daily totals, tappable to open detail dialog |
| `MacroDetailDialog` | Full macro breakdown: calorie progress bar + circular rings for C/P/F/Sugar/Fiber/Sodium |
| `ExerciseLevelButton` | Round icon in header, shows current exercise level |
| `ExerciseLevelDialog` | Radio selector: None/Easy/Medium/Hard, updates daily macro targets |
| `JournalFeed` | Scrollable list of FeedEntry items for the selected date |
| `FeedEntry` | Single meal entry: food name (left) + calories (right). Tappable for detail. |
| `InputBar` | Text input + mic + camera, fixed to bottom |
| `CalendarPicker` | Date selection bottom sheet, month calendar view |
| `PhotoConfirmSheet` | Photo preview + AI detection + correction flow |
| `NutritionDetailSheet` | Full macro breakdown + accept/edit/discard |
| `TranscriptionToast` | Inline indicator during voice transcription |

## Plan (Phases)

### Phase 1 — Scaffold + Read-Only Feed
**Goal:** Replace tabs with the journal layout. Data flows, nothing interactive yet.

Tasks:
- Create `JournalHeader` with tappable "Today" label (static for now) + exercise level button (placeholder) + settings gear
- Create `MacroBar` at the bottom showing totals from existing `getMeals` data. Tappable → opens `MacroDetailDialog`
- Create `MacroDetailDialog` with full breakdown: calorie progress bar + circular rings for C/P/F/Sugar/Fiber/Sodium
- Create `ExerciseLevelButton` + `ExerciseLevelDialog` with 4 activity levels. On selection, update macro targets for the day.
- Create `JournalFeed` that fetches today's meals and renders `FeedEntry` components
- Create `FeedEntry` as a row: food name (left) + calories (right), matching Amy's note-style layout
- Create `InputBar` shell: text input + disabled mic/camera buttons
- Rewrite `CalorieTrackerPage` to compose these instead of the tab layout
- Old tab components (TodayTab, LogMealTab, HistoryTab, etc.) preserved in codebase but not imported/rendered
- Empty state when no meals: placeholder text "Start logging your meals..."
- Detect timezone from system: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- All UI text in English

**Checkpoint:** App loads, shows today's entries as a flat list with calories to the right. Macro bar visible at bottom, tappable to show full breakdown. Exercise level button in header works and changes targets. Input bar visible but non-functional.

### Phase 2 — Text Logging
**Goal:** Type a food, hit Enter, see it appear in the feed with resolved calories.

Tasks:
- On Enter/submit: create an optimistic "pending" entry in the feed (shows the text, "Thinking..." for calories)
- Call `resolveNutrition(text)` via the existing API client
- On success: update the entry with resolved calories and macros, call `addMeal` to persist
- On error: show error state on the entry, allow retry or dismiss
- Tap on a FeedEntry → open `NutritionDetailSheet` showing full macro breakdown
- Wire up delete: swipe-to-delete or long-press menu → `deleteMeal`
- Update MacroBar totals after each add/delete
- Auto-scroll feed to bottom after new entry

**Checkpoint:** Full text logging flow works. Type "fried plantain chips" → appears in feed → resolves to ~242 cal → macro bar updates.

### Phase 3 — Voice Logging
**Goal:** Tap mic, speak, see transcription auto-resolve.

Tasks:
- Mic button triggers browser MediaRecorder (or existing transcription flow)
- Show `TranscriptionToast` ("Transcribing...")
- On transcription result: inject text into the same resolution pipeline from Phase 2
- No intermediate "confirm transcription" step — straight to resolve
- Handle errors (mic permission denied, transcription failed)

**Checkpoint:** Tap mic, say "arepa with cheese and butter", it transcribes and logs as a meal entry.

### Phase 4 — Photo Logging
**Goal:** Snap or upload a photo, AI detects the food, user confirms, it logs.

Tasks:
- Camera button → action sheet with two options: "Take Photo" / "Choose from Library"
- After capture/selection → show `PhotoConfirmSheet`:
  - Image preview (rounded, centered)
  - Call `detectImage(image, mimeType, foods)` to get AI detection
  - Show detected food name in an editable field
  - Show description in an editable field
  - "Something not look right?" link to open correction input
  - User can type a correction (e.g., "No sugar") → call `detectImage` again with updated context or update description
  - "Calculate Calories" button → calls `resolveNutrition` with the detected/edited food name
- After calorie resolution → show `NutritionDetailSheet`:
  - Full macro breakdown
  - AI confidence level + thought process
  - Accept → `addMeal` → entry appears in feed
  - Edit → modify weight/name → recalculate
  - Discard → close, nothing saved
- **Non-food handling:**
  - If AI returns "Not Food" or similar: show the description ("The image shows a black cat..."), disable "Calculate Calories" button, show message like "This doesn't look like food"

**Checkpoint:** Take a photo of coffee → detected as "Iced Coffee with Milk" → calculate → 72 cal → accept → appears in feed. Photo of a cat → "Not Food" → can't save.

### Phase 5 — Calendar Navigation + Past Day Editing + Polish
**Goal:** Navigate between days, edit past entries, polish interactions.

Tasks:
- Make "Today" label tappable → opens `CalendarPicker` (bottom sheet with month calendar, like Amy's)
- On date selection: fetch that day's meals, show in JournalFeed
- Header updates to show the selected date (e.g., "Jun 20") or "Today" if current date
- "Today" quick-return button in the calendar picker
- **Past day editing:** When viewing a past date, the InputBar and all logging flows work identically — text, voice, photo all save to the selected date's log. Delete also works on past entries.
- Entry editing: tap entry → NutritionDetailSheet → edit weight/name → recalculate + update
- Keyboard handling: input bar stays above keyboard on mobile
- Loading states for all async operations
- Error handling with retry options
- Smooth animations: entry appearing, sheets sliding up/down, etc.
- (Future prep: leave hooks for swipe left/right navigation between days)

**Checkpoint:** Full app working end-to-end. Can log via text/voice/photo, navigate to any past date via calendar, edit past entries, exercise level adjusts targets, macro detail dialog shows full breakdown.

## File Structure (Proposed)

```
src/pages/calorie-tracker/
├── CalorieTrackerPage.tsx       ← rewritten (journal layout)
├── components/
│   ├── JournalHeader.tsx
│   ├── MacroBar.tsx
│   ├── MacroDetailDialog.tsx
│   ├── ExerciseLevelButton.tsx
│   ├── ExerciseLevelDialog.tsx
│   ├── JournalFeed.tsx
│   ├── FeedEntry.tsx
│   ├── InputBar.tsx
│   ├── CalendarPicker.tsx
│   ├── PhotoConfirmSheet.tsx
│   ├── NutritionDetailSheet.tsx
│   └── TranscriptionToast.tsx
├── hooks/
│   ├── useMeals.ts              ← fetch/add/delete meals for a date
│   ├── useNutritionResolver.ts  ← wraps resolveNutrition with pending state
│   ├── useVoiceRecorder.ts      ← mic recording + transcription
│   ├── usePhotoCapture.ts       ← camera/library capture + detection
│   └── useExerciseLevel.ts      ← get/set exercise level for a date, compute targets
├── types.ts                     ← keep existing types, extend as needed
└── utils.ts                     ← date formatting, macro calculations, timezone helpers
```

Old components (TodayTab, LogMealTab, HistoryTab, ChatLogView, VoiceLogView, PictureLogView) remain in the codebase but are not imported by the new CalorieTrackerPage.

## Interaction Details

### Text Input Flow
```
User types "chocolate" + Enter
  → Optimistic entry appears: "chocolate" | Thinking...
  → resolveNutrition("chocolate") called
  → Success: entry updates to "chocolate" | 655 cal (or whatever AI returns)
  → addMeal() persists to D1
  → MacroBar updates
  → Feed scrolls to bottom
```

### Voice Flow
```
User taps 🎤
  → Recording starts, mic button shows active state
  → User speaks, taps again (or auto-detect silence)
  → Toast: "Transcribing..."
  → transcribe(audioBlob) called
  → Result text feeds into Text Input Flow above
```

### Photo Flow
```
User taps 📷
  → Action sheet: "Take Photo" / "Choose from Library"
  → User captures/selects image
  → PhotoConfirmSheet opens:
    - Image preview
    - detectImage() called → shows "Food Name" + "Description"
    - User can edit name/description or add corrections
    - "Calculate Calories" button
  → User taps "Calculate Calories"
  → NutritionDetailSheet opens:
    - Full macro breakdown
    - Accept / Edit / Discard
  → Accept → addMeal() → entry in feed with photo thumbnail
```

### Non-Food Photo Flow
```
User takes photo of cat
  → PhotoConfirmSheet opens:
    - Image preview
    - detectImage() returns: name="Not Food", description="A black cat..."
    - "Calculate Calories" button DISABLED
    - Message: "This doesn't look like food 🐱"
    - Only option: close the sheet
```

## Notes for Implementation

- **Reuse existing API methods exactly.** Don't rename or restructure the worker API.
- **The `resolveNutrition` flow currently goes:** hardcoded food DB → Open Food Facts → Claude Haiku fallback. This stays.
- **Keep the aggressive overestimation preference** that's already configured in the worker.
- **Timezone:** detect from the user's system via `Intl.DateTimeFormat().resolvedOptions().timeZone`. Remove any hardcoded `Europe/Madrid` references.
- **Macro targets by exercise level:**
  - None: `{kcal: 1475, protein: 120}`
  - Easy: `{kcal: 1550, protein: 125}`
  - Medium: `{kcal: 1650, protein: 130}`
  - Hard: `{kcal: 1750, protein: 135}`
- **All UI content in English** (placeholders, labels, button text, empty states, error messages).
- **Don't delete old components.** TodayTab, LogMealTab, HistoryTab, etc. stay in the codebase — just don't import or render them in the new CalorieTrackerPage.
- **Style:** Use the Soft Cream palette — not Amy's dark mode. `#FFFDF5` backgrounds, `#1A1A1A` text, pastel accents.
- **Entry layout:** Food name left-aligned, calories right-aligned on the same line. Match the note-like feel from Amy's screenshots.

---

## Appendix: Apple Human Interface Guidelines (iOS) — Applied to This Project

This app is a web app (React SPA on Cloudflare Pages), not a native iOS app. We can't use SwiftUI components, but we **must** match the design language and interaction patterns that iOS users expect. The goal is that someone using this on their iPhone feels like it could be a native app.

Sources: Apple Human Interface Guidelines (developer.apple.com/design/human-interface-guidelines), WWDC25 "Get to know the new design system", and iOS design reference guides.

### Core Principles

**Clarity.** The interface should be clean, uncluttered, and immediately understandable. Every element must serve a purpose. If a button doesn't look tappable, it has failed. Text must be readable at any size. Icons should be precise and lucid.

**Hierarchy.** Use size, weight, color, and spacing to direct attention. The most important content (food entries, calorie totals) should dominate the screen. Supporting UI (buttons, labels) should recede. Larger and bolder elements signal primary actions; secondary controls stay subtle.

**Consistency.** UI elements should behave predictably throughout the app. A tap on a similar-looking element should always produce a similar result. Use the same spacing, corner radii, and interaction patterns everywhere. Users should never need to guess what something does.

### Touch Targets

- **Minimum 44×44pt (59px) for all interactive elements.** This is non-negotiable. Buttons, icons, tappable rows, and any clickable element must meet this minimum. Research shows smaller targets produce 25%+ tap error rates.
- **Spacing between interactive elements: minimum 8px.** Ideally 12px+ to prevent accidental taps on adjacent elements.
- **The InputBar buttons (mic, camera, keyboard) must all be comfortably tappable** — at least 44pt each with adequate spacing between them.
- **FeedEntry rows** should have enough vertical padding that the entire row is a comfortable tap target for opening the detail sheet.

### Typography

iOS uses the SF Pro font family. Since this is a web app, we use Inter (our brand font) which has similar characteristics, but follow the iOS type scale for sizes and hierarchy.

**iOS Type Scale (reference for our app):**

| Style | Size | Weight | Our Usage |
|---|---|---|---|
| Large Title | 34pt | Bold | — (not used, our header is compact) |
| Title 1 | 28pt | Bold | — |
| Title 2 | 22pt | Bold | MacroDetailDialog heading |
| Title 3 | 20pt | Semibold | Section labels (e.g., "Goals") |
| Headline | 17pt | Semibold | FeedEntry food name |
| Body | 17pt | Regular | Default text size, input field text |
| Callout | 16pt | Regular | Secondary information |
| Subhead | 15pt | Regular | Calorie labels on feed entries |
| Footnote | 13pt | Regular | Macro bar compact text, timestamps |
| Caption 1 | 12pt | Regular | Supporting labels |
| Caption 2 | 11pt | Regular | Absolute minimum text size — never go smaller |

**Rules:**
- **Never display text smaller than 11pt.**
- **Body text defaults to 17pt.** This is the iOS standard and should be the base size.
- **Establish hierarchy through weight and size, not color alone.** Don't rely on color to differentiate text levels.
- **Line height: 1.2x–1.5x the font size** for body text.
- **Keep body text under 70 characters per line** for readability.

### Spacing and Layout

- **Use generous whitespace.** iOS design thrives on breathing room. Don't cram elements together.
- **Standard content margins: 16pt (left/right)** on iPhone. This matches the system standard.
- **Consistent vertical rhythm:** maintain uniform spacing between repeated elements (e.g., all FeedEntry rows should have the same padding).
- **Safe areas:** Respect the notch/Dynamic Island at the top and the home indicator at the bottom. The InputBar must not overlap with the home indicator area. Use CSS `env(safe-area-inset-bottom)` for bottom-fixed elements.
- **Corner radii:** Use consistent, rounded corners. iOS standard is ~10-13pt for cards and sheets. Match throughout the app.

### Navigation Patterns

- **No hidden navigation.** Users should always know where they are and how to go back.
- **The calendar picker** should use a bottom sheet (page sheet) that partially covers the screen — matching iOS's native sheet behavior. Users should be able to dismiss it by swiping down or tapping outside.
- **Settings** should be reached from a clear gear icon, consistent with iOS conventions.
- **Swipe-to-delete** for feed entries matches the standard iOS destructive swipe pattern. Show a red "Delete" action on swipe.

### Sheets and Modality

Our app uses several bottom sheets/dialogs: MacroDetailDialog, ExerciseLevelDialog, NutritionDetailSheet, PhotoConfirmSheet, CalendarPicker.

**Rules from Apple HIG:**
- **Use sheets for scoped tasks** closely related to the current context. Our nutrition detail view and photo confirm flow are good candidates.
- **Always provide a clear dismissal path.** Every sheet must have either a close/X button, a swipe-down-to-dismiss gesture, or both. Never trap users.
- **Keep modal tasks short and focused.** Don't nest complex navigation inside a sheet.
- **Sheets should slide up from the bottom** on iPhone. Use the medium detent (half-screen) for simple dialogs (MacroDetailDialog, ExerciseLevelDialog) and large detent (near full-screen) for complex flows (NutritionDetailSheet, PhotoConfirmSheet).
- **Dim the background** behind sheets to indicate modality and prevent interaction with underlying content.
- **Include a drag handle** (small horizontal bar at the top of the sheet) to signal that it can be swiped away.

### Action Sheets

The camera button opens an action sheet with "Take Photo" and "Choose from Library."

**Rules from Apple HIG:**
- **Action sheets slide up from the bottom** on iPhone.
- **Always include a Cancel option** at the bottom for clarity and confidence.
- **Destructive actions should be in red** (not applicable here, but keep in mind for delete confirmations).
- **Keep options to 2-4 choices.** Ours has 2 (+ Cancel), which is ideal.

### Gestures

- **Swipe-to-delete** on feed entries: standard iOS pattern. Swipe left to reveal a red "Delete" button.
- **Swipe down to dismiss** sheets/dialogs: expected behavior on iOS. All our bottom sheets should support this.
- **Don't override standard gestures.** If the browser/OS uses a gesture (e.g., swipe from left edge to go back), don't repurpose it.
- **Tap feedback:** Every tappable element should have visible feedback (slight opacity change, background highlight) on press. iOS users expect this.

### Color and Contrast

- **Minimum contrast ratio: 4.5:1** for body text against its background. 3:1 for large text.
- **Don't rely solely on color to convey information.** If the calorie progress bar turns red when over target, also include a text indicator (e.g., the number exceeds the target value).
- **Our palette already works:** `#1A1A1A` on `#FFFDF5` provides excellent contrast (~18:1). Pastel accent colors should be used for decorative/supplementary elements, not for critical text.
- **Progress indicators:** Green for on-track, orange for warning (90%+ of target), red for over target — these are standard semantic colors. Ensure they pass contrast requirements against their backgrounds.

### Loading States and Feedback

- **Show immediate feedback for every action.** When the user submits a food entry, the optimistic "Thinking..." state must appear instantly — not after a network round-trip.
- **Use subtle animations** for state transitions: entries appearing, sheets sliding, totals updating. iOS uses smooth, spring-based animations (~0.3s duration). Avoid harsh cuts.
- **Loading indicators** should be unobtrusive. A small spinner or pulsing text ("Thinking...") next to the entry, not a full-screen blocker.
- **Error states** should be inline and actionable. "Failed to resolve — Tap to retry" on the entry itself, not a modal alert.

### Accessibility Essentials

Even though this is a web app, following these makes it better for all users:

- **All interactive elements need aria labels** for screen readers.
- **Respect the user's system font size preference** where possible (use `rem` units, not fixed `px` for text).
- **Color contrast** as specified above.
- **Touch targets** as specified above (44pt minimum).
- **Don't auto-play audio** (relevant for voice transcription — wait for explicit mic tap).
- **Provide text alternatives** for all visual indicators (e.g., the circular macro rings should also show numeric values, not just visual fill).

### Applying This to Our Components

| Component | Key HIG Considerations |
|---|---|
| `JournalHeader` | Compact, clear hierarchy. Date label center-aligned at 17pt semibold. Icons in the right cluster all 44pt touch targets with 8pt+ spacing. |
| `MacroBar` | 44pt minimum height for tappability. Footnote-size text (13pt). Clear visual separation from the input bar. |
| `MacroDetailDialog` | Medium-detent bottom sheet. Drag handle at top. Clear "Goals" title at 20pt semibold. Progress bar with semantic colors. Close on swipe-down or tap outside. |
| `ExerciseLevelDialog` | Medium-detent bottom sheet. Radio-style selection with 44pt row height. Immediate visual feedback on selection. |
| `JournalFeed` | Each `FeedEntry` row: minimum 44pt height. Food name at 17pt (headline weight), calories at 15pt (subhead), right-aligned. Consistent vertical spacing between entries. |
| `InputBar` | Text input at 17pt body size. Buttons (mic, camera) at 44pt with clear icons. Respect `env(safe-area-inset-bottom)` to stay above the home indicator. |
| `CalendarPicker` | Large-detent bottom sheet. Swipe-to-dismiss. "Today" quick-return button. Tap targets for each day cell at 44pt minimum. |
| `PhotoConfirmSheet` | Large-detent bottom sheet. Image preview with rounded corners (~13pt radius). Editable fields at 17pt. "Calculate Calories" primary button: full-width, 50pt height, prominent color. |
| `NutritionDetailSheet` | Large-detent bottom sheet. Macro breakdown using the same circular ring style as MacroDetailDialog. Accept/Discard buttons: 44pt+ height, Accept in primary color, Discard in red. |
| Camera action sheet | Standard action sheet pattern: slides up from bottom. "Take Photo" / "Choose from Library" / "Cancel". All rows 44pt+ height. |