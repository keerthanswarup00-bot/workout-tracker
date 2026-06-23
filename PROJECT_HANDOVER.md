# IronLog — Project Handover

> Master document for AI handover. A future AI session must read this to understand the entire application without requiring any previous conversation.

---

## SECTION 1 — PROJECT OVERVIEW

### What the Application Is

**IronLog** is a dark-themed, mobile-first, single-page PWA (Progressive Web App) workout tracker for recomposition athletes. It runs entirely in the browser using vanilla JavaScript, CSS, and HTML — no framework, no build step, no backend. All data is stored in `localStorage`.

### Who It Is For

- People who lift weights and want to track sets, reps, and weight in real time
- People concerned with body composition (weight, BMI, goal weights)
- People who want a fast, simple workout logger without social features or subscriptions
- Mobile users primarily (desktop sidebar is secondary)

### Product Goals

1. Make set-by-set workout logging fast and frictionless
2. Provide meaningful progress tracking (PRs, volume, streaks, weight trends)
3. Keep everything offline-first with PWA caching
4. Maintain a premium dark UI with no distractions
5. Single-page app with zero server dependencies

### User Goals

- Log workouts quickly during gym sessions
- See weight progress toward a target goal
- Maintain motivation via streaks and PRs
- Exercise library with search, filters, tags, and custom exercises
- Automatic warm-up generation based on working weight

### Current Development Stage

**Production-ready** — actively used. The app has been through multiple major refactors. The current session completed a massive feature overhaul across 10 feature areas. The app is stable with no known critical bugs.

| Metric | Value |
|---|---|
| Version | 1.6.0 |
| JS LOC | 7,249 |
| CSS LOC | 7,560 |
| HTML LOC | 1,142 |
| Exercises | 159 |
| PWA | Yes (service worker + manifest) |
| Deployment | Vercel (`src/` as output) |
| Last commit | `838ae5b` — New workout creation flow |

---

## SECTION 2 — APPLICATION WALKTHROUGH

### Onboarding

When a new user opens the app for the first time, `state.user` is `null`. The `openOnboarding(true)` function fires, showing a modal with a 4-step flow:

**Step 1 — Basic Info**
- Name (text input)
- Age (number input)
- Height (number input, cm)
- Weight (number input, kg)
- "Next" button advances to Step 2

**Step 2 — Goal**
- Chips: "Fat Loss", "Recomp", "Lean Bulk", "Bulk"
- Single select (one chip at a time)
- "Next" button (disabled until a chip is selected)
- "Back" returns to Step 1

**Step 3 — Experience**
- Chips: "Beginner", "Intermediate", "Advanced"
- Single select
- "Next" advances
- "Back" returns to Step 2

**Step 4 — Location & Target**
- Chips: "Home", "Gym", "Outdoor", "Any"
- Target weight input (number, optional)
- "Get Started" button saves all data, closes onboarding
- If target weight is empty, it is stored as `null`

**Skip button** in top-right corner closes onboarding without saving. Onboarding persists — once dismissed it won't re-open unless `state.user` is null.

### Dashboard (Home / "Sets" Tab)

The "Sets" tab is the default landing screen. It shows:

1. **Greeting** — "Good morning/afternoon/evening" + name
2. **Motivational message** — random daily quote
3. **Hero cards row** (2 cards):
   - **Streak card**: Current streak in days + longest streak + last workout name
   - **Weight card**: Current weight (from latest log entry) + BMI (auto-computed). Tapping opens the weight log bottom sheet.
4. **"My Workouts" section**:
   - Header with "+ New" button
   - List of workout cards sorted with active workout first
   - Each card shows: name, exercise count, elapsed time (if active), "Start Workout" or "Continue Workout" button, 3-dot menu
   - Empty state if no workouts exist (with Build/Generate buttons)
5. **"Recent Workouts" section** — last 5 finished sessions, hidden if none

### Workout Creation Flow

**Tap "+ New"** opens a bottom sheet with two options:

1. **Build Workout** — Manual builder
   - Search bar with real-time filtering by name/tags/muscle/equipment
   - Filter bar with 3 groups: Muscle (7 chips), Equipment (5 chips), Type (2 chips)
   - Exercise list grouped by category, each with a checkbox
   - "Create Custom Exercise" link when no results found
   - Name input in sticky footer + "Create Workout" button
   - Duplicate name validation (case-insensitive check against existing workouts)

2. **Generate Workout** — Auto generator modal
   - Select Goal: Strength, Muscle Gain, Fat Loss, Endurance, General Fitness
   - Select Split: Push, Pull, Legs, Upper, Lower, Full Body
   - Select Experience: Beginner, Intermediate, Advanced
   - "Generate Workout" button creates a program using `generateProgram()`
   - Preview shows generated workout before saving
   - Duplicate name validation

### Workout Details Screen

Tapping a workout card (not the Start/Continue button) opens the details screen showing:
- Workout name
- Description/duration/notes (editable via 3-dot menu → "Edit Workout")
- Full exercise list with sets/reps for each
- "Start Workout" button at bottom

### Workout Session Screen

Tapping "Start Workout" or "Continue Workout" opens the session screen:

1. **Header**: Back button, workout name, progress bar ("X / Y Exercises")
2. **Notes button**: Expandable notes editor
3. **Exercise list**: Each exercise is a card showing:
   - Exercise name
   - Set count (e.g., "3 sets")
   - Set list with checkboxes, weight, reps
   - Tap an exercise or set row to open the Exercise Detail screen (Level 2)
4. **"Add Exercise" button**: Opens search to add exercises mid-session
5. **"Finish Workout" button**: If incomplete sets exist, shows confirmation modal ("Continue Workout" / "Finish Anyway")

### Exercise Detail Screen (Level 2)

Tapping an exercise in the session screen opens a drill-down:

1. **Performance card**: Shows best set volume from this session
2. **Target card**: Shows last session data (weight, reps) as a target
3. **Progress tracker**: Visual bar showing completed vs total sets
4. **Set list**: Each set row shows:
   - Warmup label (if warmup)
   - Checkbox to mark done
   - Weight and reps
   - Tapping opens Edit Set bottom sheet
5. **Quick Actions bar**:
   - "↻ Repeat Last" — copies last done set's weight/reps
   - "+ Add Set" — opens Add Set bottom sheet
   - "🔥 Warm-Up" — generates warmup sets based on last working weight
6. **Notes section**: Per-exercise notes
7. **Tabs**: "Sets" (default) and "Analyze" (shows volume/reps history)

### Session Summary

After finishing a workout, the summary overlay shows:
- Workout name and duration
- Total sets, reps, elapsed time
- PRs detected (weight PRs and rep PRs)
- Muscles trained (max 4 visible chips + overflow)
- Recovery impact for top 3 hardest-hit muscles
- Notes textarea for session feedback
- Actions: "Back to Home" or "Cool Down"

### Progress Page

The Progress tab shows:

1. **Weight Goal Card**:
   - Current weight (from latest log)
   - Target weight (from onboarding)
   - Difference (+/-)
   - BMI (auto-computed)
   - Fallback messages if data is missing

2. **Streak Card**:
   - Current streak (days)
   - Longest streak (days)

3. **Calendar Hero** — Visual calendar grid showing workout days

4. **This Week** — Weekly review (sets, volume, duration, PRs, trained days)

5. **Monthly** — Month-to-month volume comparison

6. **Achievements** — Badge system for milestones

### Sessions (Log) Page

The Sessions tab shows:
- Session log (all finished workouts, chronological)
- Personal Records grid
- Weekly review card
- Monthly report

### Body Page

The Body tab shows an SVG body diagram with interactive muscle groups. Tapping a muscle group shows targeting stats and recent training data.

### Settings Page

Settings are organized in sections:
- **Profile**: Name, age, gender, height, weight, goal, activity level
- **Workout**: Rest timer, weight increment, rep increment, warmup style, cool-down duration
- **Tracking**: Auto-warmup, warmup reminder, stretch reminder, auto-summary, auto-cooldown, auto-advance stretches
- **Display**: Theme (dark/light/system), accent color (green/blue/orange/purple), font size (default/small/large), focus mode, screen awake
- **Data**: Export (JSON download), Import (JSON upload), Delete All Data

### Weight Logging

Tapping the weight card on the dashboard opens a bottom sheet:
- Weight display with plus/minus buttons (+1, +5, -1, -5)
- Manual input (tap the value to show focused input with numeric keyboard, Enter saves)
- Quick save button
- Entry appears in the log below

### Nutrition (Legacy)

The nutrition panel (not currently active in nav) has curated food list with protein/carbs/fat tracking, meal logging, and water intake.

---

## SECTION 3 — COMPLETE WORKFLOW MAP

```
App Opens
│
├── state.user === null? → Onboarding (4 steps)
│   ├── Step 1: Name, Age, Height, Weight
│   ├── Step 2: Goal (Fat Loss / Recomp / Lean Bulk / Bulk)
│   ├── Step 3: Experience (Beginner / Intermediate / Advanced)
│   ├── Step 4: Location (Home / Gym / Outdoor / Any) + Target Weight
│   └── Save → state.user filled
│
├── Dashboard (Sets Tab)
│   ├── Greeting + Streak Card + Weight Card
│   └── Workout List (or Empty State)
│       │
│       ├── Tap "+ New" → Bottom Sheet
│       │   ├── "Build Workout" → Builder Screen
│       │   │   ├── Search/Filter Exercises
│       │   │   ├── Select exercises (checkboxes)
│       │   │   ├── Enter workout name
│       │   │   └── "Create Workout" → saved to plan
│       │   │
│       │   └── "Generate Workout" → Generator Modal
│       │       ├── Select Goal / Split / Experience
│       │       └── "Generate" → preview → "Use This Program"
│       │
│       ├── Tap Workout Card → Details Screen
│       │   ├── View exercises + sets/reps
│       │   ├── 3-dot menu: Edit / Delete / Duplicate
│       │   └── "Start Workout"
│       │
│       ├── Tap "Start Workout" → Session Screen
│       │   ├── Exercise list with sets
│       │   ├── Tap exercise → Exercise Detail (Level 2)
│       │   │   ├── Mark sets done (checkboxes)
│       │   │   ├── "Repeat Last" / "Add Set" / "Warm-Up"
│       │   │   ├── Tap set → Edit Set bottom sheet
│       │   │   └── Analyze tab → volume/strength/history
│       │   ├── "Add Exercise" → search + add mid-session
│       │   └── "Finish Workout"
│       │       ├── Incomplete sets? → Confirmation modal
│       │       └── Summary overlay → Cool Down or Home
│       │
│       └── Tap weight card → Weight Log Bottom Sheet
│           ├── +1/+5/-1/-5 buttons
│           ├── Manual input (tap → keyboard → Enter)
│           └── Save → entry in weightLog
│
├── Sessions Tab
│   ├── Session log (finished workouts)
│   ├── PR grid
│   ├── Weekly review
│   └── Monthly report
│
├── Progress Tab
│   ├── Weight Goal Card (current / target / diff / BMI)
│   ├── Streak Card (current / longest)
│   ├── Calendar Hero
│   ├── This Week review
│   ├── Monthly review
│   └── Achievements
│
├── Body Tab
│   └── SVG muscle diagram (interactive)
│
└── Settings Tab
    ├── Profile editor
    ├── Weight log modal
    ├── Rest timer / increments / warmup style
    ├── Theme / accent / font size
    ├── Export / Import / Delete All Data
    └── Toggle settings
```

### Sub-Workflows

```
Workout Editing:
  3-dot menu → "Edit Workout" → Edit Workout Modal
  ├── Change name
  ├── Reorder exercises (↑ ↓ buttons)
  ├── Remove exercises (✕)
  ├── Add exercises (search + pick)
  └── Save Changes

Exercise Detail → Quick Actions:
  "↻ Repeat Last" → copies weight/reps from last done set
  "+ Add Set" → Add Set bottom sheet (reps ±, weight ± buttons)
  "🔥 Warm-Up" → auto-generates warmup sets based on working weight

Set Editing:
  Tap set row → Edit Set bottom sheet
  ├── Adjust weight (±5, ±1)
  ├── Adjust reps (±)
  ├── Delete set
  └── Save

Weight Logging:
  Dashboard weight card tap → Bottom Sheet
  ├── Current weight displayed
  ├── Tap value → focused input with numeric keyboard
  ├── ± buttons adjust weight
  ├── Enter/Tap save → logged to weightLog
  └── History shown below

Profile Editing:
  Settings → Profile row → Profile Editor Modal
  ├── Name, Age, Gender, Height, Weight
  ├── Fitness Goal, Activity Level
  └── Save

Workout Exit Protection:
  Active workout → close tab/navigate back:
  ├── beforeunload: "Changes you made may not be saved"
  ├── visibilitychange: auto-save to localStorage
  └── popstate: confirm dialog
```

---

## SECTION 4 — FEATURE INVENTORY

### 4.1 Exercise Library (159 exercises)

| Property | Details |
|---|---|
| **Purpose** | Searchable database of exercises for building workouts |
| **Logic** | Static array of exercise objects with id, name, category, primaryMuscle, secondaryMuscles, equipment, tags |
| **Data source** | `EXERCISE_LIBRARY` array in `script.js` |
| **Storage** | Compiled in code (not from localStorage) |
| **Dependencies** | None |
| **UI behavior** | Rendered in builder, edit workout picker, exercise library screen |

### 4.2 Smart Search & Filter System

| Property | Details |
|---|---|
| **Purpose** | Filter and search exercises by multiple dimensions |
| **Logic** | `renderNewWorkoutList()` — matches query against name, tags[], muscle, equipment. Filter chips independently toggleable |
| **Data source** | `EXERCISE_LIBRARY` + `state.customExercises` |
| **Storage** | `nwSearchTerm` (string), `nwActiveFilters` (array) — runtime only |
| **Dependencies** | Exercises must have `tags[]` |
| **UI behavior** | Real-time as user types/taps chips |

### 4.3 Custom Exercise Creation

| Property | Details |
|---|---|
| **Purpose** | Users can create exercises not in the library |
| **Logic** | Form collects name, category, equipment, tags (comma-separated). Saved to `state.customExercises[]` |
| **Data source** | User input |
| **Storage** | `state.customExercises` array in localStorage |
| **Dependencies** | Must have same shape as library exercises |
| **UI behavior** | Custom exercises appear in builder, edit picker, and search results |

### 4.4 Workout Builder

| Property | Details |
|---|---|
| **Purpose** | Create custom workouts from exercise library |
| **Logic** | User selects exercises, enters name. Saved to `wl_custom_program` in localStorage |
| **Data source** | User selection |
| **Storage** | `localStorage("wl_custom_program")` + `state.plan` |
| **Dependencies** | Exercise library |
| **UI behavior** | Checkboxes, live counter, name input, create button |

### 4.5 Workout Generator

| Property | Details |
|---|---|
| **Purpose** | Auto-generate workouts based on goal/split/experience |
| **Logic** | `generateProgram(goal, days, equipment, duration)` — selects exercises matching parameters |
| **Data source** | Algorithm using exercise metadata |
| **Storage** | Same as builder |
| **Dependencies** | Exercise library with proper categorization |
| **UI behavior** | Modal with chips, preview before saving |

### 4.6 Workout Session (Live Tracking)

| Property | Details |
|---|---|
| **Purpose** | Track sets in real-time during a workout |
| **Logic** | Creates a session object, tracks set completion, shows progress |
| **Data source** | User actions during workout |
| **Storage** | `state.sessions[]` in localStorage |
| **Dependencies** | User must have a workout to start |
| **UI behavior** | Session screen, exercise detail drill-down, set editing |

### 4.7 Set Management

| Property | Details |
|---|---|
| **Purpose** | Add, edit, complete, delete sets within an exercise |
| **Logic** | Each set is an object: `{ id, reps, weight, notes, label, done, isWarmup, loggedAt }` |
| **Data source** | User input via bottom sheets |
| **Storage** | Part of session object |
| **Dependencies** | Session must exist |
| **UI behavior** | Checkbox toggle, edit bottom sheet, quick actions bar |

### 4.8 Auto Warm-up Generation

| Property | Details |
|---|---|
| **Purpose** | Auto-generate warmup sets based on working weight |
| **Logic** | `autoGenerateWarmups(exercise, workingWeight)` — calculates warmup sets at percentages of working weight. Two modes: "simple" (1-2 sets) and "advanced" (2-4 sets) |
| **Data source** | Last done set's weight |
| **Storage** | Sets added to exercise's sets[] with `isWarmup: true` |
| **Dependencies** | Must have at least one done working set |
| **UI behavior** | Warmup sets appear with "🔥" label, auto-collapse |

### 4.9 Rest Timer

| Property | Details |
|---|---|
| **Purpose** | Countdown timer between sets |
| **Logic** | SVG ring countdown with configurable duration (30/60/90/120/180s) |
| **Data source** | `state.restTimer` setting |
| **Storage** | Runtime timer, setting persisted |
| **Dependencies** | None |
| **UI behavior** | Floating overlay with ring animation, +30s/Reset/Skip buttons |

### 4.10 PR Detection

| Property | Details |
|---|---|
| **Purpose** | Detect personal records (weight and rep PRs) |
| **Logic** | `getTodayPRs()` in `prs.js` — compares each done set against historical max for that exercise |
| **Data source** | All finished sessions |
| **Storage** | Computed at finish time, shown in summary |
| **Dependencies** | Session history |
| **UI behavior** | PRs shown in session summary overlay |

### 4.11 Workout Streak System

| Property | Details |
|---|---|
| **Purpose** | Track consecutive days with completed workouts |
| **Logic** | On `doFinishWorkout()`: if `today !== lastDate`, check if `lastDate === yesterday` → increment, else reset to 1. Update longest. Multiple workouts same day count once |
| **Data source** | `state.workoutStreak` |
| **Storage** | `{ currentStreak, longestStreak, lastWorkoutDate }` in localStorage |
| **Dependencies** | Finished sessions |
| **UI behavior** | Shown on dashboard streak card, progress page |

### 4.12 Weight Logging

| Property | Details |
|---|---|
| **Purpose** | Track body weight over time |
| **Logic** | Log entries with `{ weight, date, notes, loggedAt }` |
| **Data source** | User input |
| **Storage** | `state.weightLog[]` in localStorage |
| **Dependencies** | None |
| **UI behavior** | Bottom sheet from weight card tap, plus/minus buttons, manual input, history list |

### 4.13 BMI Calculator

| Property | Details |
|---|---|
| **Purpose** | Auto-calculate BMI from height and weight |
| **Logic** | `bmi = weight / (height/100)^2` |
| **Data source** | `state.user.height` + latest `state.weightLog` weight |
| **Storage** | Computed at render time |
| **Dependencies** | Height and weight must exist |
| **UI behavior** | Shown on dashboard weight card subtitle, progress page weight card, settings |

### 4.14 Session Summary

| Property | Details |
|---|---|
| **Purpose** | Show workout results after finishing |
| **Logic** | `showEnhancedSummary(newPRs)` — aggregates sets, reps, duration, PRs, muscles, recovery impact |
| **Data source** | Current session object |
| **Storage** | None (read-only display) |
| **Dependencies** | Finished session |
| **UI behavior** | Full-screen overlay with stats, PRs, notes, cool-down option |

### 4.15 Progress Page

| Property | Details |
|---|---|
| **Purpose** | Visual progress tracking |
| **Logic** | `renderProgressPage()` — fetches weight goal data, streak data, calendar, weekly/monthly reviews, achievements |
| **Data source** | `state.weightLog`, `state.user`, `state.workoutStreak`, `state.sessions` |
| **Storage** | Computed at render time |
| **Dependencies** | Multiple state properties |
| **UI behavior** | Cards + calendar grid + review sections + achievement badges |

### 4.16 Onboarding (4-Step)

| Property | Details |
|---|---|
| **Purpose** | Collect user profile on first launch |
| **Logic** | `openOnboarding()` → step navigation → `saveOnboardData()` |
| **Data source** | User input (name, age, height, weight, goal, experience, location, targetWeight) |
| **Storage** | `state.user` object in localStorage |
| **Dependencies** | None |
| **UI behavior** | Modal with step divs, chip selection, back/next/skip |

### 4.17 Exit Protection

| Property | Details |
|---|---|
| **Purpose** | Prevent accidental data loss during active workout |
| **Logic** | `beforeunload` → prevent default; `visibilitychange` → auto-save; `popstate` → confirm dialog |
| **Data source** | Any active session (not finished) |
| **Storage** | Auto-saves on visibility change |
| **Dependencies** | Must have started but not finished a session |
| **UI behavior** | Browser warning, confirm dialog, silent auto-save |

### 4.18 Micro-interactions

| Property | Details |
|---|---|
| **Purpose** | Satisfying UI feedback on actions |
| **Logic** | Scale animation: `1 → 1.03 → 1` (set complete), `1 → 0.97 → 1` (button press) |
| **Data source** | None (CSS transforms) |
| **Storage** | None |
| **Dependencies** | None |
| **UI behavior** | Brief scale bounce on set check/uncheck |

### 4.19 Data Export/Import

| Property | Details |
|---|---|
| **Purpose** | Backup and restore user data |
| **Logic** | Export → JSON download; Import → file picker → JSON parse → whitelist validation → merge |
| **Data source** | `state` object (whitelisted keys only) |
| **Storage** | File download / file upload |
| **Dependencies** | All state properties |
| **UI behavior** | File download prompt / file picker dialog |

### 4.20 PWA Support

| Property | Details |
|---|---|
| **Purpose** | Installable, offline-capable app |
| **Logic** | Service worker caches assets on install, serves from cache on fetch |
| **Data source** | Static asset list in `sw.js` |
| **Storage** | Cache API |
| **Dependencies** | Manifest, service worker registration |
| **UI behavior** | Install prompt on compatible browsers |

### 4.21 Workout Name Validation

| Property | Details |
|---|---|
| **Purpose** | Prevent duplicate workout names |
| **Logic** | Case-insensitive comparison: `activePlan.some(w => w.name.toLowerCase() === name.toLowerCase())` |
| **Data source** | `state.plan` (from `loadCustomProgram()`) |
| **Storage** | Checked at creation time |
| **Dependencies** | Program must be loaded |
| **UI behavior** | Toast notification: "A workout named 'X' already exists" |

### 4.22 Workout Editing

| Property | Details |
|---|---|
| **Purpose** | Edit existing workout name, exercises, order |
| **Logic** | `openEditWorkout()` → modal with name input, exercise list with reorder/remove, add exercise search |
| **Data source** | Workout object from plan |
| **Storage** | Updated in `wl_custom_program` |
| **Dependencies** | Workout must exist in plan |
| **UI behavior** | Modal with drag-equivalent reorder (↑↓ buttons) |

### 4.23 Exercise Analytics

| Property | Details |
|---|---|
| **Purpose** | Per-exercise historical analysis |
| **Logic** | 4 tabs: Overview (lifetime stats, volume change), Volume, Strength (1RM chart), History (all past sessions) |
| **Data source** | `getExerciseHistory()`, `getLifetimeVolume()` — from `state.sessions` |
| **Storage** | Computed at render time |
| **Dependencies** | Finished sessions with the exercise |
| **UI behavior** | Drill-down screen with Chart.js charts, stat cards, history list |

---

## SECTION 5 — UI DESIGN SYSTEM

### Typography

- **Font**: "Plus Jakarta Sans" (500, 600, 700, 800 weights) — chosen for modern, clean, premium feel. Sans-serif for readability on mobile.
- **Scale**: `32px` (page title), `20px` (section), `16px` (card), `28px` (metrics), `14px` (body), `12px` (caption)
- **Letter spacing**: Titles `-0.03em` for compactness; section labels `0.08em` uppercase

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | 8px | Tight gaps, chip padding |
| `--space-sm` | 16px | Card padding, section gaps |
| `--space-md` | 24px | Section spacing |
| `--space-lg` | 32px | Page-level spacing |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | 16px | Cards, modals, bottom sheets |
| `--radius` | 12px | Buttons, inputs |
| `--radius-sm` | 8px | Chips, small elements |

### Color Palette

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bg` | #050505 | #ffffff | Page background |
| `--surface` | #151515 | #f5f5f5 | Card/surface background |
| `--surface-2` | #1a1a1a | #ebebeb | Elevated surfaces |
| `--border` | rgba(255,255,255,0.08) | rgba(0,0,0,0.1) | Borders, dividers |
| `--text` | #e5e5e5 | #111111 | Primary text |
| `--text-secondary` | #737373 | #666666 | Secondary/meta text |
| `--text-tertiary` | #555555 | #999999 | Placeholder/labels |
| `--accent` | #00d26a | #00d26a | Primary action color (green) |

**Accent color choices** (user-selectable):
- Green (default): `#00d26a`
- Blue: `#3b82f6`
- Orange: `#ff9f0a`
- Purple: `#a855f7`

**Semantic colors**: `--red` (#ef4444, errors), `--orange` (#ff9f0a, warnings/streak), `--blue` (#3b82f6, info), `--yellow` (#eab308)

### Why Dark Theme

The app defaults to dark because it's used in gym environments with dim/florescent lighting, and during evening workouts. Dark backgrounds reduce eye strain and make the accent color pop. Light theme is available as an option.

### Navigation

**Mobile** (default):
- Floating pill-shaped bottom nav bar with 4 tabs: Sets, Sessions, Progress, Body
- Animated indicator pill slides between tabs
- Icons + labels
- Height: 80px (includes safe area bottom)
- Smart auto-hide on scroll for more content space

**Desktop** (768px+):
- Fixed sidebar (220px) replaces bottom nav
- Brand name + nav buttons + streak badge in footer

### Button System

| Button | Class | Usage |
|---|---|---|
| Primary | `.btn-primary` | Main CTA, accent background |
| Secondary | `.btn-secondary` | Secondary action, surface background |
| Back | `.btn-back` | Navigate back, text+arrow |
| Chip | `.nw-chip` / `.gm-chip` | Filter/toggle, pill shape |
| Icon | `.topbar-icon-btn` | Top bar icons |

### Modal System

- Overlay: `.modal-overlay` — dark semi-transparent background
- Card: `.modal-card` — centered card with rounded corners
- Header: `.modal-header` — title + close button
- Actions: `.modal-actions` — button row at bottom

### Bottom Sheet System

- Overlay: `.bottom-sheet-overlay` — dismisses on tap
- Card: `.bottom-sheet-card` — slides up from bottom
- Drag handle: `.bottom-sheet-handle` — visual indicator
- Used for: weight logging, add set, edit set, new workout options

---

## SECTION 6 — UI ALIGNMENT RULES

### Page Padding

- Mobile: `16px` sides (`--space-sm`), bottom padding accounts for nav + safe area
- Desktop (768px+): `24px` sides (`--space-md`)
- Top: `env(safe-area-inset-top, 8px)` — respects notched devices

### Card Spacing

- Between cards: `var(--space-md)` (24px)
- Card padding: `var(--space-sm)` (16px)
- Card gap in grid: `0.4rem` (tight, for chip grids)
- Card border: `1px solid var(--border)`

### Safe Area Handling

- `<meta name="viewport" content="viewport-fit=cover">` — allows full-bleed
- `env(safe-area-inset-bottom)` added to nav height and page padding
- `env(safe-area-inset-top)` added to main area padding

### Navigation Spacing

- Bottom nav items evenly distributed via `justify-content: space-around` (pill nav)
- Sidebar items: `0.15rem` gap between nav buttons
- Tab spacing in exercise detail: centered, equal width

### Input Spacing

- Inputs: `min-height: 44px` (Apple HIG minimum touch target)
- Input padding: `0 0.75rem` horizontal
- Input gap in forms: `0.6rem`
- Input border radius: `12px` (--radius)

### Responsive Behavior

- Mobile-first: all defaults assume mobile
- Sidebar hidden by default, shown at 768px+
- Bottom nav hidden at 768px+
- Exercise grid: 2 columns on mobile, 3 on tablet, 4 on desktop
- Modal max-width: 360px (mobile), 400px (desktop)

### Alignment Standards

- All content is left-aligned within cards
- Metrics/numerical values are left-aligned
- Buttons are full-width when in forms
- Chips are inline-flex, wrap naturally
- Icons are 20px default, 14px for inline
- Text never center-aligned except in empty states

---

## SECTION 7 — COMPONENT ARCHITECTURE

### Component Tree

```
App
├── AppLayout
│   ├── Sidebar (desktop)
│   │   ├── Brand ("IronLog")
│   │   ├── NavBtn (Sets, Sessions, Progress, Body)
│   │   └── StreakBadge
│   └── MainArea
│       ├── Topbar
│       │   ├── DateLabel
│       │   ├── Timer
│       │   └── SettingsBtn
│       └── Panels
│           ├── Panel: Sets
│           │   ├── Screen: Home (Dashboard)
│           │   │   ├── Greeting
│           │   │   ├── HeroCards (StreakCard, WeightCard)
│           │   │   ├── WorkoutList / EmptyState
│           │   │   └── RecentWorkouts
│           │   ├── Screen: WorkoutDetails
│           │   │   ├── WorkoutInfo
│           │   │   ├── ExerciseList
│           │   │   └── StartBtn
│           │   ├── Screen: NewWorkout (Builder)
│           │   │   ├── SearchBar
│           │   │   ├── FilterBar (3 sections)
│           │   │   ├── ExerciseList (checkboxes)
│           │   │   └── Footer (name + create)
│           │   ├── Screen: WorkoutSession
│           │   │   ├── Header (name + progress)
│           │   │   ├── NotesBtn
│           │   │   ├── ExerciseList (cards)
│           │   │   ├── CompleteBanner
│           │   │   └── Footer (add + finish)
│           │   ├── Screen: ExerciseDetail (Level 2)
│           │   │   ├── Header (back + name)
│           │   │   ├── Tabs (Sets / Analyze)
│           │   │   ├── PerformanceCard
│           │   │   ├── TargetCard
│           │   │   ├── SetList
│           │   │   ├── QuickActions (Repeat/Add/Warmup)
│           │   │   └── NotesSection
│           │   ├── Screen: ExerciseLibrary
│           │   │   ├── SearchBar
│           │   │   ├── Categories
│           │   │   ├── RecentExercises
│           │   │   └── AllExercises
│           │   ├── Screen: ExerciseAnalytics
│           │   │   ├── Tabs (Overview/Volume/Strength/History)
│           │   │   └── ContentArea
│           │   └── Screen: Settings
│           │       ├── ProfileEditor
│           │       ├── WeightLogModal
│           │       └── SettingsSections
│           ├── Panel: Sessions (Log)
│           │   ├── SessionLog
│           │   ├── PRGrid
│           │   ├── WeeklyReview
│           │   └── MonthlyReport
│           ├── Panel: Progress
│           │   ├── WeightGoalCard
│           │   ├── StreakCard
│           │   ├── CalendarHero
│           │   ├── WeeklyReview
│           │   ├── MonthlyReview
│           │   └── Achievements
│           └── Panel: Body
│               └── SVGBodyDiagram
├── BottomNav (mobile)
│   ├── Tab (Sets)
│   ├── Tab (Sessions)
│   ├── Tab (Progress)
│   ├── Tab (Body)
│   └── NavIndicator
├── RestTimer (floating overlay)
├── NewWorkoutSheet (bottom sheet)
├── GenerateModal
├── WorkoutMenu (dropdown)
├── AddSetSheet (bottom sheet)
├── EditSetSheet (bottom sheet)
├── SessionSummary (overlay)
├── PRToast
├── WarmupModal
├── WarmupReminderModal
├── CooldownModal
├── CustomExerciseModal
└── DeleteDataModal
```

---

## SECTION 8 — CODEBASE STRUCTURE

```
workout-tracker/
├── .github/               # GitHub actions/config
├── docs/                  # Documentation files
├── node_modules/          # Dev dependencies
├── src/                   # Application source
│   ├── assets/
│   │   └── icons/         # SVG icons (favicon)
│   ├── css/
│   │   ├── components/    # Modular CSS files
│   │   │   ├── 01-variables.css    # CSS custom properties, color/spacing tokens
│   │   │   ├── 02-reset.css        # Reset, typography system
│   │   │   ├── 03-layout.css       # App layout, sidebar, main, panels, responsive
│   │   │   ├── 04-utilities.css    # Utility classes
│   │   │   ├── 05-buttons.css      # Button styles, nav indicator, tabs
│   │   │   ├── 06-home.css         # Dashboard/home styles
│   │   │   ├── 07-workout.css      # Session screen, exercise detail, builder
│   │   │   ├── 08-body.css         # Body/SVG diagram styles
│   │   │   ├── 09-settings.css     # Settings page styles
│   │   │   ├── 10-nutrition.css    # Nutrition panel styles (legacy)
│   │   │   ├── 11-progress.css     # Progress page styles
│   │   │   ├── 12-modals.css       # Modal, bottom sheet, overlay styles
│   │   │   ├── 13-rest-timer.css   # Rest timer styles
│   │   │   └── 14-pr-system.css    # PR toast and badge styles
│   │   └── styles.css     # Imports all component CSS files (concatenated)
│   ├── js/
│   │   ├── data/
│   │   │   └── prs.js     # PR detection functions (getTodayPRs, PR calculation)
│   │   ├── body-map-svg.js # SVG markup for body diagram
│   │   └── script.js      # Main application: all logic, state, rendering
│   ├── index.html         # Single HTML file — all screens, modals, sheets
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker (cache-first strategy)
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── package.json           # IronLog v1.6.0
├── vercel.json            # Vercel deployment config
└── README.md
```

### Purpose of Each File

| File | Purpose |
|---|---|
| `src/index.html` | Single HTML file containing all UI: screens, modals, bottom sheets, overlays, nav. Everything is in one file. |
| `src/js/script.js` | The entire application logic: state management, rendering, event handling, program generation, search, filters, onboarding, workout execution, progress, settings. 7,249 lines. |
| `src/js/body-map-svg.js` | Exports `BODY_MAP_SVG` — an SVG string of the human body with muscle group paths for the body diagram. |
| `src/js/data/prs.js` | PR detection functions imported into script.js for personal record logic. |
| `src/css/styles.css` | Concatenated CSS (all component files merged). Single CSS file loaded by index.html. |
| `src/css/components/*.css` | Modular CSS split by feature area. Not loaded individually — merged into styles.css. |
| `src/sw.js` | Service worker with cache-first strategy. Caches all critical assets on install. |
| `src/manifest.json` | PWA manifest: app name, icons, theme color, display mode (standalone), orientation (portrait). |

---

## SECTION 9 — STATE MANAGEMENT

### Architecture

State is a single global object `state` initialized at app boot from `localStorage`. All modifications go through `state` → `saveState()` → `localStorage`. Rendering reads from `state`.

```
User Action → Event Handler → Modify state → saveState() → localStorage
                                                 ↓
                                           render() / renderHome() / etc.
```

### State Object Structure

```js
state = {
  // Sessions
  sessions: [],           // Array of workout session objects
  
  // Plan / Program
  plan: null,             // Array of workout objects (loaded from localStorage or empty)
  planOffset: 0,          // Index for "planned workout" rotation
  
  // User Profile
  user: null,             // { name, age, height, weight, goal, experience, trainingLocation, targetWeight }
  
  // Weight Tracking
  weightLog: [],          // [{ weight, date, notes, loggedAt }]
  
  // Streak
  workoutStreak: {         // { currentStreak, longestStreak, lastWorkoutDate }
  
  // Custom Exercises
  customExercises: [],    // Array of custom exercise objects (same shape as library)
  
  // Goals
  goals: [],              // Array of goal objects
  
  // Recovery
  recoveryLog: [],        // Array of recovery entries
  recoveryAnalysis: true, // Boolean toggle
  
  // Nutrition (legacy)
  nutrition: {},          // Nutrition tracking data
  
  // Body
  bodyGoal: "recomp",     // User's body composition goal
  calorieTarget: 2100,    // Daily calorie target
  fatTarget: 65,          // Daily fat target in grams
  
  // Settings
  autoWarmup: true,
  warmupReminder: true,
  stretchReminder: true,
  autoSummary: true,
  autoCooldown: true,
  coolDownDuration: 5,
  autoAdvanceStretches: true,
  showTomorrowPreview: true,
  showRecoveryAdvice: true,
  showWorkoutProgress: true,
  profileBannerDismissed: false,
  autoRest: undefined,     // Auto-start rest timer
  autoNext: undefined,     // Auto-advance to next set
  focusMode: undefined,    // Hide distractions during workout
  screenAwake: undefined,  // Keep screen on during workout
  weightReminder: undefined,
  show7dAvg: undefined,
  show30dAvg: undefined,
  progressPhotos: undefined,
  bodyMeasurements: undefined,
  nutritionReminder: undefined,
  compactMode: undefined,
  weeklyReview: undefined,
  restTimer: 90,           // Rest timer duration in seconds
  weightInc: 1,            // Weight increment step
  repInc: 1,               // Rep increment step
  warmupStyle: "advanced", // "simple" or "advanced"
  
  // Theme
  theme: undefined,        // "dark", "light", or "system"
  accent: undefined,       // "green", "blue", "orange", "purple"
  fontSize: undefined,     // "default", "small", "large"
}
```

### Key State Flow Patterns

1. **Workout Session Flow**: `startSessionForWorkout()` creates session → user completes sets → `doFinishWorkout()` marks `finishedAt`, updates streak, advances planOffset → summary shows → session saved permanently.

2. **Weight Log Flow**: User submits weight → `logWeight()` pushes to `state.weightLog` → `saveState()` → `renderHome()` updates dashboard card.

3. **Streak Update Flow**: Only in `doFinishWorkout()` → checks if today !== lastDate → increments or resets → updates longest.

4. **Program Management Flow**: Workouts stored in `localStorage("wl_custom_program")` → loaded via `loadCustomProgram()` → `state.plan` is the working copy.

---

## SECTION 10 — LOCAL STORAGE SYSTEM

### Storage Key: `workout-tracker-v3`

This is the primary store for all application state.

### Other Storage Keys

| Key | Purpose | Format |
|---|---|---|
| `wl_custom_program` | User-created workout plan | JSON array of workout objects |
| `wl_prs` | Cached PR data | JSON object |
| `wl_bodylog` | Legacy weight log (migrated on load) | JSON array |
| `wl_exercise_notes` | Per-exercise notes | JSON object |
| `nutrition_v2` | Legacy nutrition data | JSON object |
| `wl_fav_meals` | Favorite meals | JSON array |
| `wl_recent_foods` | Recently logged foods | JSON array |
| `wl_fav_exercises` | Favorite exercises | JSON array |
| `wl_recent_exercises` | Recently used exercises | JSON array |
| `wl_profile` | Legacy profile | JSON object |
| `wl_theme` | Legacy theme setting | String |
| `wl_pt_unit` | Preferred unit | String |
| `wl_nutrition_mode` | Nutrition tracking mode | String |
| `wl_meals_*` | Date-specific meal logs | JSON object (per date) |
| `wl_water_*` | Date-specific water logs | Number (per date) |
| `wt_autosave` | Auto-save on visibility change | JSON (state snapshot) |
| `wl_reminder_*` | Daily reminder tracking | Date string |

### Read Flow

```js
function loadState() {
  const fallback = { /* defaults */ };
  try {
    const loaded = { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    // Migrate legacy data...
    return loaded;
  } catch {
    return fallback;
  }
}
```

### Write Flow

```js
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
```

### Recovery Flow

- On page load, `loadState()` merges saved JSON with fallback defaults
- If parse fails, returns full fallback (fresh start)
- Legacy migration: `wl_bodylog` → `state.weightLog` if empty
- Legacy migration: `workoutGroups` structure is flattened into plan and discarded
- Auto-save on `visibilitychange` writes full state to `wt_autosave` key
- No restore-from-autosave exists yet — the beforeunload warning is the primary protection

---

## SECTION 11 — DATA MODELS

### User

```js
{
  name: "Shiva",           // string
  age: 28,                 // number
  height: 175,             // number (cm)
  weight: 75,              // number (kg)
  goal: "recomp",          // string: "fat-loss" | "recomp" | "lean-bulk" | "aggressive-bulk"
  experience: "intermediate", // string: "beginner" | "intermediate" | "advanced"
  trainingLocation: "gym", // string: "home" | "gym" | "outdoor" | "any"
  targetWeight: 72,        // number | null (kg)
}
```

### Workout (in plan)

```js
{
  id: "custom-abc12345",   // string (UUID or custom)
  name: "Push Day",        // string
  focus: "Chest focus",    // string (description/focus, optional)
  day: "Monday",           // string (optional)
  duration: "60 min",      // string (optional)
  rest: "",                // string (optional)
  exercises: [
    {
      name: "Barbell Bench Press",  // string
      sets: 3,                      // number
      reps: 10,                     // number
      weight: "",                   // string (default working weight, optional)
      notes: "",                    // string (optional)
    }
  ]
}
```

### Session

```js
{
  id: "uuid-string",              // string (crypto.randomUUID)
  dateKey: "2026-06-12",          // string (YYYY-MM-DD)
  startedAt: "2026-06-12T10:30:00.000Z",  // ISO string
  finishedAt: "2026-06-12T11:15:00.000Z", // ISO string | undefined (undefined = active)
  workoutId: "custom-abc12345",   // string
  workoutName: "Push Day",        // string
  notes: "Felt strong today",     // string (optional, from summary)
  duration: 2700,                 // number (seconds, optional)
  exercises: [
    {
      name: "Barbell Bench Press",  // string
      warmupGenerated: true,        // boolean (optional)
      sets: [
        {
          id: "uuid-string",        // string (crypto.randomUUID)
          reps: 10,                 // number
          weight: 60,               // number
          done: true,               // boolean
          isWarmup: false,          // boolean
          notes: "",                // string
          label: "",                // string (e.g., "50%", "Light")
          loggedAt: "2026-06-12T10:35:00.000Z", // ISO string | null
        }
      ]
    }
  ]
}
```

### Exercise (Library)

```js
{
  id: "barbell-bench-press",    // string (kebab-case)
  name: "Barbell Bench Press",  // string
  category: "Chest",            // string
  primaryMuscle: "Chest",       // string
  secondaryMuscles: ["Front Delts", "Triceps"],  // string[]
  equipment: "Barbell",         // string
  tags: ["chest", "barbell", "compound", "push"], // string[]
}
```

### Weight Entry

```js
{
  weight: 75.5,                 // number (kg)
  date: "2026-06-12",           // string (YYYY-MM-DD)
  notes: "Morning fasted",      // string (optional)
  loggedAt: "2026-06-12T07:00:00.000Z", // ISO string
}
```

### Workout Streak

```js
{
  currentStreak: 5,     // number (consecutive days)
  longestStreak: 12,    // number (all-time max)
  lastWorkoutDate: "Wed Jun 11 2026",  // string (new Date().toDateString())
}
```

### Goal (for achievement tracking)

```js
{
  id: "uuid",            // string
  type: "streak",        // string: "streak" | "volume" | "weight" | "sets" | "custom"
  target: 30,            // number
  progress: 15,          // number
  achieved: false,       // boolean
  label: "30 Day Streak", // string
  createdAt: "2026-01-01", // string
}
```

### PR Entry

```js
{
  exerciseName: "Barbell Bench Press",  // string
  type: "weight",           // "weight" | "reps" | "volume"
  weight: 80,               // number
  reps: 8,                  // number
  date: "2026-06-12",       // string (YYYY-MM-DD)
  previousPR: 75,           // number (optional)
}
```

---

## SECTION 12 — WORKOUT SYSTEM

### Workout Creation

Two paths:

**A. Build Workout (Manual)**
1. User taps "+ New" → bottom sheet → "Build Workout"
2. `showNewWorkoutBuilder()` resets search/filters, shows builder screen
3. `renderNewWorkoutList()` renders exercises grouped by category with checkboxes
4. Search filters in real-time (name, tags, muscle, equipment)
5. Filter chips toggle independently across 3 groups (Muscle, Equipment, Type)
6. User selects exercises, enters workout name
7. "Create Workout" clicked → validates duplicate name → builds workout object → saves to `wl_custom_program` → returns to home
8. Workout gets `{ id, name, exercises: [{ name, sets: 3, reps: 10, weight: "", notes: "" }] }`

**B. Generate Workout (Auto)**
1. User taps "+ New" → bottom sheet → "Generate Workout"
2. `openGenerateWorkout()` shows modal with Goal/Split/Experience chips
3. "Generate Workout" triggers `generateProgram(goal, days, equipment, duration)`
4. Algorithm selects exercises matching goal, experience, equipment availability
5. Preview shown; "Use This Program" saves to `state.plan` (replaces existing if confirmed)
6. Also stored in `localStorage("wl_custom_program")`

### Exercise Selection

In the builder, exercises are filtered from:
- `EXERCISE_LIBRARY` (159 built-in exercises)
- `state.customExercises` (user-created)

Each exercise has a checkbox. Selected count updates the counter and enables the Create button.

### Search System

**Architecture**: `renderNewWorkoutList()` filters exercises using:
1. Category grouping (12 categories)
2. Query matching against: `name`, `tags[]`, `primaryMuscle`, `equipment`
3. Filter chips matching against: `category`, `primaryMuscle`, `equipment`, `tags[]`
4. Empty state suggests creating a custom exercise

**Tag matching**: Tags are lowercase strings like `["chest", "barbell", "compound", "push"]`. Search term is also lowercased. Both `includes()` checks and exact matches are used.

### Filters

3 independent filter groups:
- **Muscle**: Chest, Back, Shoulders, Triceps, Biceps, Legs, Core
- **Equipment**: Barbell, Dumbbell, Cable, Machine, Bodyweight
- **Type**: Compound, Isolation

Filters are `nwActiveFilters[]` — toggling adds/removes. All active filters are OR'd within a group but combined with AND across groups implicitly by the filter logic.

### Tags

Every exercise has a `tags` array with 4+ tags:
1. Primary muscle group (lowercase)
2. Equipment type (lowercase)
3. "Compound" or "Isolation" (lowercase)
4. Movement pattern: "push", "pull", "core", "squat", "hinge", etc.

Tags enable search across multiple dimensions and power the filter system.

### Custom Exercises

- Created via "Create Custom Exercise" link (shown when search returns no results) or "+ Custom" button in exercise library
- Form: name, category (select), equipment (select), tags (comma-separated text)
- Saved to `state.customExercises[]` with same structure as library exercises
- ID generated as `custom-` + random suffix
- Immediately searchable and usable in builder

### Workout Duplication

- `duplicateWorkout(workoutId)` — deep-copies a workout, appends " Copy" to name, inserts after original
- IDs are regenerated (no conflicts)

### Workout Deletion

- From 3-dot menu in session screen or workout details
- Confirms with user, removes from plan, persists

### Workout Editing

- `openEditWorkout(workoutId)` — modal with name field, exercise list with reorder/remove, add exercise search
- Reordering via ↑↓ buttons (no drag-and-drop)
- Adding via search field with results from library + custom exercises
- Removing via ✕ button per exercise

---

## SECTION 13 — WORKOUT EXECUTION SYSTEM

### Starting a Workout

1. User taps "Start Workout" on a workout card
2. `handleStartWorkout(workoutId)` or `startOrContinueWorkout(workoutId)`
3. `startSessionForWorkout(workoutId)` creates a session object:
   - UUID for session/ID
   - Today's dateKey (YYYY-MM-DD)
   - Exercises copied from workout template with fresh set objects
   - If an active session exists for today, reuses it
4. Session shown via `showWorkoutSession()`:
   - Shows `screen-ws` with exercise cards
   - Progress bar from `getCompletion()`: `done / total` sets
   - Stopwatch starts from `startStopwatch()`

### Set Completion

1. User taps an exercise card → `showExerciseDetail()` → `screen-ed`
2. In the set list, user taps checkbox → `completeSetFromSheet()`
3. Set's `done` toggles (true/false)
4. Micro-bounce animation on the set element
5. Performance card updates in real-time
6. If all sets done, exercise auto-collapses

### Set Editing

1. User taps a set row (not the checkbox) → opens Edit Set bottom sheet
2. Adjust weight (±5, ±1) and reps (±)
3. Delete set via "Delete" button
4. Save updates the set in the session

### Add Set

1. User taps "+ Add Set" in quick actions bar → opens Add Set bottom sheet
2. Set reps (±) and weight (±5, ±1)
3. "Save" inserts a new set object at the end of the exercise's set array

### Repeat Last Set

1. User taps "↻ Repeat Last"
2. Finds the last done set that is not a warmup
3. Creates a new set with the same weight and reps, marked not done
4. Adds to the end of the set list

### Warm-Up Generation

1. User taps "🔥 Warm-Up" or auto-triggered when first working set is completed
2. `autoGenerateWarmups(exercise, workingWeight)`:
   - Calculates warmup sets at percentages of working weight
   - Simple mode: 1-2 sets; Advanced mode: 2-4 sets
   - Filters out duplicates and sets >= working weight
   - Prefixed with `isWarmup: true`
3. Warmup sets appear with label (e.g., "50%", "Bar") and distinct styling

### Finish Workout

1. User taps "Finish Workout"
2. `handleFinishWorkout()` checks if all sets completed
3. If incomplete → shows confirmation modal ("Continue Workout" / "Finish Anyway")
4. `doFinishWorkout()`:
   - Stops stopwatch
   - Sets `session.finishedAt` to current ISO time
   - Calculates duration
   - Advances `planOffset` (rotates to next planned workout)
   - Updates workout streak
   - Saves state
   - Detects PRs via `getTodayPRs()`
   - Shows summary overlay via `showEnhancedSummary()`

### Summary

- Overlay shows: stats (sets, reps, duration), PRs, muscles trained, recovery impact
- User can add session notes
- Options: "Back to Home" or "Cool Down"
- Cool Down opens a stretch routine modal

### Resume Workout

- If a session exists for today with no `finishedAt`, it's the "active" session
- Dashboard shows "Continue Workout" button instead of "Start Workout"
- Session resumes with all previously completed sets intact
- Stopwatch continues from session start time (or resets — elapsed shows from `startedAt`)

### Exit Protection

- **beforeunload**: If any session is active (no `finishedAt`), browser warns on close/refresh
- **visibilitychange**: When tab goes hidden, saves full state to localStorage as `wt_autosave`
- **popstate**: When user navigates back, shows confirm dialog if workout active

---

## SECTION 14 — PROGRESS SYSTEM

### Workout Progress Bar

- Located in session screen header (below workout name)
- Shows "X / Y Exercises" with animated fill bar
- `pr-bar-track` div with variable-width fill div
- Controlled by `renderWSSession()` which calls a progress update function
- Visible only if `state.showWorkoutProgress` is not false

### Weight Goal Progress

- Displayed on Progress page as a card
- Shows: current weight, target weight, difference (±), BMI
- Current weight = latest entry in `state.weightLog` (sorted by date desc)
- Target weight = `state.user.targetWeight` (set during onboarding)
- BMI = `curWeight / ((height/100)^2)` — auto-computed
- Fallback messages if data is missing

### Workout Streak

- Updated only in `doFinishWorkout()`
- Logic:
  ```
  if today !== lastDate:
    if lastDate === yesterday:
      currentStreak += 1
    else:
      currentStreak = 1
    if currentStreak > longestStreak:
      longestStreak = currentStreak
    lastDate = today
  ```
- Multiple workouts same day: only counts once (guarded by `lastDate !== today`)
- Displayed on: dashboard streak card, progress page streak card
- Longest streak tracked separately

### Calculations

| Calculation | Formula | Source |
|---|---|---|
| BMI | `weight / (height/100)²` | `state.weightLog`, `state.user.height` |
| Streak | Consecutive day check | `state.workoutStreak` |
| Set completion % | `done / total * 100` | Session exercises |
| 1RM (Epley) | `weight * (1 + reps/30)` | Set data |
| Volume | `weight * reps` per set | Set data |

---

## SECTION 15 — WEIGHT & BMI SYSTEM

### Weight Logging Flow

```
User taps weight card → weightLogSheet shown
  ├── Current weight pre-filled (from latest entry or user.weight)
  ├── Tap display value → input gets focus → numeric keyboard
  ├── Type value → Enter saves
  ├── Or use +/- buttons to adjust
  │   ├── +1, +5 (configurable via weightInc setting)
  │   └── -1, -5
  └── Tap "Save" → logWeight(weight, date, notes) called
       → Pushes { weight, date, notes, loggedAt } to state.weightLog
       → saveState()
       → renderHome() updates dashboard card
       → renderSettings() updates weight log list
```

### BMI Calculation

```js
function calculateBMI(weight, heightCm) {
  if (!weight || !heightCm) return null;
  return (weight / ((heightCm / 100) ** 2)).toFixed(1);
}
```

- Displayed on:
  - Dashboard weight card subtitle: "BMI: XX.X"
  - Progress page weight goal card
  - Settings profile section
  - Exercise analytics sidebar (body stats)

### Goal Weight

- Set during onboarding (Step 4 — optional)
- Stored as `state.user.targetWeight` (number or null)
- Displayed on progress page weight card
- Difference calculated: `targetWeight - currentWeight`

### Weight History

- All entries in `state.weightLog[]`
- Sorted by date descending in UI
- Editable (update weight/date/notes) and deletable
- Weight log modal shows all entries with edit/delete per row

---

## SECTION 16 — SEARCH SYSTEM

### Architecture

Search operates on the combined set of `EXERCISE_LIBRARY` + `state.customExercises`. The search function in `renderNewWorkoutList()` filters this combined set.

### Matching Logic

```js
// Smart search: match name, tags, primaryMuscle, equipment
exs = exs.filter((e) => {
  const name = e.name.toLowerCase();
  const tags = (e.tags || []).map((t) => t.toLowerCase());
  const muscle = e.primaryMuscle.toLowerCase();
  const equip = e.equipment.toLowerCase();
  return name.includes(q) || tags.some((t) => t.includes(q)) || muscle.includes(q) || equip.includes(q);
});
```

### Tag Matching Detail

Each exercise has a `tags[]` array. Tags include:
- Primary muscle (e.g., "chest")
- Equipment (e.g., "barbell")
- Movement type (e.g., "compound", "isolation")
- Movement pattern (e.g., "push", "pull", "squat", "hinge")

Search checks if `q` is a substring of any tag. This means:
- "bench" matches "Barbell Bench Press" (name match)
- "fly" matches "Cable Fly", "Chest Fly Machine", "Low Cable Fly" (name + tag match)
- "tricep" matches all tricep exercises (tag match)
- "push" matches all push exercises (tag match)

### Filter Logic

Filters are OR'd within their group but combined across dimensions:
- A filter checks: `category`, `primaryMuscle`, `equipment`, or any tag
- Multiple active filters: an exercise must match at least one active filter
- Search and filters work together: search narrows first, then filters

### Fallback Behavior

When search + filters return zero results, the UI shows:
```
"No exercises found. [Create Custom Exercise]"
```

---

## SECTION 17 — NAVIGATION SYSTEM

### Architecture

IronLog uses a **screen-based navigation** system within a single-page app. There are no routes — screens are shown/hidden via CSS classes.

### Navigation Layers

1. **Panel level** (4 tabs): Sets, Sessions, Progress, Body
   - Controlled by bottom nav (mobile) or sidebar (desktop)
   - Shows/hides `#panel-{name}` elements
   - Animated indicator pill slides between tabs

2. **Screen level** (within Sets panel): Home, WorkoutDetails, NewWorkout, WorkoutSession, ExerciseDetail, ExerciseLibrary, ExerciseAnalytics, Settings
   - Controlled by `showScreen("screen-{name}")`
   - Hides all `.screen` elements, shows the named one

3. **Modal/Sheet level**: Overlays stacked on top
   - Modals (`.modal-overlay`): centered card with dark backdrop
   - Bottom sheets (`.bottom-sheet`): slides up from bottom
   - Dropdowns (`.ws-dropdown`): positioned menu

### Navbar

**Mobile bottom nav**:
- Fixed at bottom, z-index 100
- Pill shape with rounded container
- 4 tabs with SVG icons + labels
- Animated indicator pill (`.nav-indicator`) slides via `transform: translateX()`
- `activateTab("sets")` sets active state and positions indicator
- Smart hide: auto-hides on scroll down (in focus mode only)

**Desktop sidebar**:
- Fixed on left, 220px wide
- Appears at 768px+ via media query
- Same 4 nav buttons
- Streak badge in footer

### Active State Logic

```js
function activateTab(name) {
  document.querySelectorAll(".nav-tab, .nav-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === name);
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("is-active", p.id === "panel-" + name);
  });
  // Position indicator
  const active = document.querySelector(`.nav-tab[data-tab="${name}"]`);
  if (active && indicator) {
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    indicator.style.width = `${active.offsetWidth}px`;
  }
}
```

### Page Transitions

- No page transitions (instant show/hide)
- Panels switch instantly via `display: none / block`
- Screens switch instantly via `.is-hidden` class
- Modals/sheets use CSS transitions for fade-in/slide-up

---

## SECTION 18 — ANIMATION SYSTEM

### Micro-interactions

| Element | Trigger | Animation | Implementation |
|---|---|---|---|
| Set checkbox | Tap to toggle done | `scale(1) → scale(1.03) → scale(1)` over 300ms | CSS `transform` + `transition`, set via JS `style.transform` |
| Finish/Complete buttons | Tap | `scale(1) → scale(0.97) → scale(1)` over 300ms | Same pattern |
| Filter chips | Tap | `scale(1) → scale(0.95)` on active | CSS `:active` pseudo-class with `transform: scale(0.95)` |
| Bottom sheet | Show | Slide up from bottom | CSS transition on `transform` |
| Modal | Show | Fade in backdrop + scale up card | CSS transitions |
| Rest timer ring | Countdown | SVG `stroke-dashoffset` animation | JS interval updating SVG attribute |
| Nav indicator | Tab switch | `translateX` slide | CSS transition on `transform` |
| Progress bar | Set completion | Width fill | CSS transition on `width` |

### Implementation Notes

- Animations use CSS `transition` with `ease` timing
- JS sets `style.transform` directly for micro-interactions (no CSS classes)
- No animation libraries — all native CSS/JS
- Animations are fast (150-300ms) to avoid feeling sluggish during gym use
- Motion-sensitive users: no `prefers-reduced-motion` query implemented yet

---

## SECTION 19 — BUG HISTORY

### Fixed Bugs

| Bug | Root Cause | Solution |
|---|---|---|
| False completion checkmark | `Array.every()` returns `true` for empty arrays | Added `totalWorking > 0` guard before showing checkmark |
| Nav indicator not visible on first load | Indicator positioned before tab activation | Call `activateTab("sets")` before `render()` |
| Body diagram icon misaligned | Wrong SVG path | Replaced with human torso SVG matching stroke weight |
| Weight logger input not usable | No focus handling for manual entry | Tap shows focused input with numeric keyboard, Enter saves, blur restores display |
| Builder created empty sets | Used `sets: 0` default | Changed to `sets: 3, reps: 10` |
| Three-dot progress dots instead of bar | Outdated CSS remnant | Replaced with `pr-bar-track` + animated fill + label |
| `getTodaySession()` returning finished sessions | No filter for `finishedAt` | Added `!item.finishedAt` filter |
| `startSessionForWorkout()` creating duplicate sessions | Reused existing without checking workoutId | Added workoutId matching, filter existing same-day sessions |
| `showEnhancedSummary()` not finding session | Wrong find logic (used `getTodaySession` which excludes finished) | Changed to `state.sessions.find` by dateKey |

### Known Issues / Technical Debt

1. **No error boundary** — any JS error crashes parts of the UI silently
2. **CSS is monolithic** — `styles.css` is 7,560 lines maintained manually (component CSS files are not compiled; styles.css is updated directly)
3. **No unit tests** — zero test coverage
4. **LocalStorage limit** — 5-10MB depending on browser; large session histories could hit limits
5. **No data pagination** — all sessions loaded into memory; apps with years of data may be slow
6. **Nutrition panel is legacy** — wired up but not accessible from nav
7. **Chart.js added as direct dependency** — no npm install needed (loaded from CDN in HTML)
8. **No TypeScript** — plain JS, no type checking
9. **No i18n** — English only, hardcoded strings
10. **No accessibility audit** — aria labels, screen reader support not tested

---

## SECTION 20 — CURRENT PROJECT STATUS

### Brussels-level Honest Assessment

| Area | Status | Notes |
|---|---|---|
| Core workout tracking | ✅ Complete | Set logging, session management, progress tracking all working |
| Exercise library | ✅ Complete | 159 exercises with tags, categories, equipment types |
| Search & filters | ✅ Complete | Smart search across 4 dimensions, 3 filter groups |
| Onboarding | ✅ Complete | 4-step flow with all fields |
| Progress page | ✅ Complete | Weight goal, streak, calendar, weekly/monthly, achievements |
| Streak system | ✅ Complete | Current + longest, consecutive day tracking |
| Custom exercises | ✅ Complete | Name, category, equipment, tags |
| Exit protection | ✅ Complete | beforeunload, visibility, popstate |
| Micro-interactions | ✅ Complete | Scale animations on set/button completion |
| Weight name validation | ✅ Complete | Case-insensitive duplicate check |
| BMI display | ✅ Complete | Dashboard, progress page, settings |
| Workout generator | ✅ Complete | Goal/split/experience based generation |
| Exercise analytics | ✅ Complete | 4-tab drill-down with charts |
| PR detection | ✅ Complete | Weight and rep PRs per exercise |
| Session management | ✅ Complete | Start, resume, finish, summary |
| Settings | ✅ Complete | 20+ toggles, profile, export/import |
| PWA | ✅ Complete | Service worker, manifest, installable |
| Dark/light theme | ✅ Complete | Dark default, light available, system option |
| Accent colors | ✅ Complete | Green, blue, orange, purple |
| Desktop support | 🟡 Partial | Sidebar works, some layouts not optimized for wide screens |
| Nutrition | 🔴 Legacy | Not accessible from nav, data structure remains |
| Tests | 🔴 Missing | Zero test coverage |
| Accessibility | 🔴 Missing | No screen reader support, no keyboard nav audit |
| i18n | 🔴 Missing | English only |
| Performance | 🟡 Acceptable | No pagination for large datasets |
| Code organization | 🟡 Adequate | 7,249 lines in single JS file |

### What Needs Refactoring

1. **`script.js` splitting** — at 7,249 lines it should be split into modules (state, workouts, exercises, progress, settings, etc.)
2. **CSS organization** — component CSS files should be built from the individual files, not manually maintained in `styles.css`
3. **Event listener registration** — currently scattered throughout the file; should be centralized
4. **Nutrition panel** — either remove or re-enable; currently dead code

### What Should Be Improved Next

1. Add unit tests (critical for long-term stability)
2. Split `script.js` into modules
3. Add data export with session history pruning
4. Implement `Intl` for date/number formatting
5. Add keyboard shortcuts for power users
6. Add exercise substitution suggestions
7. Improve desktop layouts
8. Add workout templates / pre-built programs

---

## SECTION 21 — FUTURE AI INSTRUCTIONS

### Critical Assumptions

1. **All data is in localStorage** — no server, no API, no sync. Do not introduce network calls.
2. **Single-file JS** — `script.js` is the entire application. If you split it, update the HTML script tag.
3. **Vanilla JS** — no frameworks. Do not add React, Vue, etc.
4. **Mobile-first** — always design for mobile first, then desktop.
5. **Dark theme default** — all new UI must look good on `#050505` background.
6. **No build step** — the CSS file served is `styles.css`. If you modify individual component CSS files, also update `styles.css`.
7. **State is global** — `state` object is the single source of truth. Always call `saveState()` after mutating.
8. **Nutrition is legacy** — do not spend time on the nutrition panel unless explicitly asked.

### Important Business Rules

1. **Streak only counts finished workouts** — `finishedAt` must be set. One per day.
2. **Workout name uniqueness** — case-insensitive comparison across all workouts in plan.
3. **Empty arrays are falsy for completion** — `e.sets.every(s => s.done)` returns `true` for `[]`. Always check `totalWorking > 0`.
4. **Multiple sessions same day** — `getTodaySession()` returns only the unfinshed one. Creating a new session replaces existing same-day sessions.
5. **Default sets/reps** — builder creates `{ sets: 3, reps: 10 }`.
6. **Plan rotation** — `planOffset` advances on finish, modulo plan length.
7. **Weight always kg** — no unit conversion. Display with `displayWeight()` which formats to 1 decimal.

### Things Future AI Must Not Break

1. **Do NOT change the storage key** (`workout-tracker-v3`) — will lose all user data.
2. **Do NOT remove `wl_custom_program`** — it's the primary workout storage.
3. **Do NOT remove legacy migration code** in `loadState()` — existing users have `wl_bodylog` data.
4. **Do NOT change exercise ID format** — custom exercises use `custom-` prefix. Library exercises use kebab-case.
5. **Do NOT remove `plan` array fallback** — `const plan = [];` is the empty plan default.
6. **Do NOT break the `isWorkingSet` / `getWorkingSets` contract** — warmup/working distinction matters for analytics.

### Common Mistakes Future AI Might Make

1. **Adding npm dependencies that require a build step** — IronLog has no build step. All dependencies must be CDN-loaded or inline.
2. **Assuming async data fetching** — there is no server. Do not add `fetch()`, `axios`, etc.
3. **Overwriting the CSS file** — 7,560 lines. Make targeted edits, not full rewrites.
4. **Breaking localStorage recovery** — `loadState()` has fallback defaults. Adding new state properties requires adding defaults to the fallback object.
5. **Adding JSX or template strings that break** — all templating is manual string concatenation. Be careful with quotes.
6. **Removing "dead" code that is actually migration code** — `wl_bodylog`, `workoutGroups` migrations run on every load for existing users.
7. **Changing the service worker cache name** — users with the old cache name will re-download all assets.
8. **Modifying the onboarding to store partial data** — onboarding saves only on "Get Started". Closing without saving leaves `state.user` as null.

### Key Files to Know

| File | What to Edit | What NOT to Edit |
|---|---|---|
| `src/js/script.js` | Features, state, rendering, events | Storage keys, migration code, `EXERCISE_LIBRARY` shape |
| `src/css/styles.css` | All visual styling | Check component files first for matching rules |
| `src/index.html` | HTML structure, modals, screens | IDs used in JS must stay consistent |
| `src/js/data/prs.js` | PR detection logic | Function signatures used by script.js |
| `src/sw.js` | Caching strategy | Cache name, asset list |
| `src/manifest.json` | PWA metadata | Start URL, display mode |
