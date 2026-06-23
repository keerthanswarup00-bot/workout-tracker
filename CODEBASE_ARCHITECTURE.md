# IronLog — Codebase Architecture

> Technical architecture document for developers and AI agents. Assumes reader is a developer.

---

## 1. Application Type

**Single-Page Application (SPA)**, vanilla JavaScript, no framework, no build step, no backend.

### Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Language | JavaScript (ES2022+) | No transpilation needed |
| Markup | HTML5 | Single-file SPA |
| Styling | CSS3 with custom properties | Dynamic theming, no preprocessor |
| Storage | `localStorage` (5-10MB) | Offline-first, no server |
| PWA | Service Worker + Manifest | Installable, offline-capable |
| Fonts | Plus Jakarta Sans (Google Fonts) | Modern, clean look |
| Charts | Chart.js (CDN) | Exercise analytics |
| UUID | `crypto.randomUUID()` | Session/set IDs |

### Critical Design Decisions

- **No build step**: `src/` is served directly. Vercel serves `src/` as root.
- **Single JS file**: All logic in `script.js` (7,249 lines). Intentional to avoid module bundler complexity.
- **CSS concatenation**: `styles.css` is the single stylesheet. Component CSS files in `components/` are source-of-truth fragments; `styles.css` is the compiled output and must be kept in sync.
- **State as global mutable object**: `state` variable holds everything. No immutability, no selectors, no reducers.

---

## 2. Module Architecture

### No formal module system

The app uses no ES modules, CommonJS, or AMD. All code executes in the global scope. The only "module" boundary is the `<script>` tag load order in `index.html`:

```html
<script src="js/data/prs.js"></script>
<script src="js/body-map-svg.js"></script>
<script src="js/script.js"></script>
```

- `prs.js` defines PR functions used by `script.js`
- `body-map-svg.js` defines `BODY_MAP_SVG` global variable used by `script.js`
- `script.js` is the main application

### Implicit Module Boundaries (within script.js)

The 7,249 lines of `script.js` are organized into these logical sections:

```
Lines 1-108     : Constants (goals, foods, config)
Lines 109-700   : EXERCISE_LIBRARY array
Lines 701-1059  : Helper functions (formatting, display, DOM utils)
Lines 1060-1122 : State management (loadState, saveState, saveAndRender)
Lines 1124-2000 : Session/workout core logic (getTodaySession, getCompletion, etc.)
Lines 2000-2350 : Home/Dashboard rendering
Lines 2350-2900 : Workout session screen rendering
Lines 2900-3200 : Finish workout, summary, streak update
Lines 3200-3700 : Exercise analytics (4 tabs)
Lines 3700-4450 : Program generation, progress page, body page
Lines 4450-5000 : Weekly/monthly reviews, calendar, achievements
Lines 5000-5300 : Exercise library screen
Lines 5300-5400 : Body diagram rendering
Lines 5400-5600 : Custom exercise modal logic
Lines 5600-5700 : "New Workout" bottom sheet
Lines 5700-5900 : Workout builder (search, filters, create)
Lines 5900-6140 : Workout editing, duplicate, delete
Lines 6140-6300 : Weight logging, reminders, wake lock
Lines 6300-6660 : Settings rendering, event delegation
Lines 6660-7000 : Program generator, warmup generator, goal editor
Lines 7000-7249 : Init, DOMContentLoaded, exit protection
```

---

## 3. Data Flow Architecture

### Unidirectional Flow (Implicit)

```
User Input → DOM Event → Event Handler → State Mutation → saveState() → Render Function(s)
```

There is no formal unidirectional data flow library. The pattern is emergent:

1. **Events** are registered via `addEventListener` (inline or delegated)
2. **Handlers** mutate `state` directly
3. **saveState()** persists to localStorage
4. **Render functions** read from `state` and update DOM

### Critical Data Flow: Workout Lifecycle

```
User taps "Start Workout"
  → handleStartWorkout(id)
    → startSessionForWorkout(id)
      → Creates session object with exercises from workout template
      → state.sessions.unshift(session)
      → saveState()
    → showWorkoutSession()
      → renderWSSession() reads session from state
      → Renders exercise cards, progress bar

User taps set checkbox
  → completeSetFromSheet(sessionId, exIdx, sIdx)
    → session.exercises[exIdx].sets[sIdx].done = !done
    → saveState()
    → updateEDSetList() (re-renders set list)
    → updateEDStats() (updates performance card)

User taps "Finish Workout"
  → handleFinishWorkout()
    → If incomplete → showConfirmFinish()
    → doFinishWorkout()
      → session.finishedAt = new Date().toISOString()
      → Update streak
      → saveAndRender()
      → getTodayPRs()
      → showEnhancedSummary()
```

### Critical Data Flow: Weight Logging

```
User taps weight card
  → Open weightLogSheet bottom sheet
  → User adjusts weight (± buttons or manual input)
  → User taps "Save"
    → logWeight(weight, date, notes)
      → state.weightLog.push({weight, date, notes, loggedAt})
      → saveState()
      → renderHome() updates dashboard weight card
```

---

## 4. State Flow Diagram

```
                ┌─────────────────────────────┐
                │      localStorage           │
                │  ("workout-tracker-v3")     │
                └──────────┬──────────────────┘
                           │ loadState() on page load
                           ▼
                ┌─────────────────────────────┐
                │        state (global)        │
                │  Mutable singleton object    │
                └──────────┬──────────────────┘
                           │
          ┌────────────────┼────────────────────┐
          │                │                    │
          ▼                ▼                    ▼
   Render Functions    Event Handlers      Utility Functions
   (read-only)         (mutate state)      (computed from state)
          │                │                    │
          │                ▼                    │
          │          saveState()                │
          │                │                    │
          └────────────────┼────────────────────┘
                           │
                           ▼
                ┌─────────────────────────────┐
                │         DOM (UI)            │
                └─────────────────────────────┘
```

---

## 5. Render Architecture

### No Virtual DOM

The app uses direct DOM manipulation. Render functions:
1. Build HTML strings via template literals
2. Set `innerHTML` on container elements
3. Re-bind event listeners on rendered elements

### Render Trigger Points

| Trigger | Render Functions Called |
|---|---|
| Page load | `renderHome()`, `render()` |
| Tab switch | `activateTab()` → panel render |
| Workout created | `renderHome()` |
| Set completed | `updateEDSetList()`, `updateEDStats()` |
| Workout finished | `saveAndRender()`, `showEnhancedSummary()` |
| Weight logged | `renderHome()`, `renderSettings()` |
| Settings changed | `renderSettings()` |
| Profile updated | `renderHome()`, `renderSettings()` |

### The `render()` Function

```js
function render() {
  renderHome();
  const todaySession = getTodaySession();
  if (todaySession) {
    showWorkoutSession();
  }
  renderSetsPanel();
  renderSessionLog();
  renderProgressPage();
  renderBodyPage();
  renderSettings();
  renderStreakBadge();
  renderStopwatch();
}
```

Called on page load and after `saveAndRender()`. Renders all panels. Inefficient but simple.

---

## 6. DOM Structure

### Top-Level Layout

```html
<div class="app-layout">
  <aside class="sidebar">...</aside>
  <main class="main-area">
    <header class="topbar">...</header>
    <section class="panel is-active" id="panel-sets">...</section>
    <section class="panel" id="panel-sessions">...</section>
    <section class="panel" id="panel-progress">...</section>
    <section class="panel" id="panel-body">...</section>
  </main>
</div>
<nav class="bottom-nav">...</nav>
<div id="restTimer">...</div>
<div class="bottom-sheet" id="newWoSheet">...</div>
<div class="modal-overlay" id="customExModal">...</div>
<!-- ... more modals, sheets, overlays ... -->
```

### Panel-Screen Hierarchy

Panel screens use a nested show/hide pattern:
- Panels: `display: none/block` via `.is-active`
- Screens: `display: none/block` via `.is-hidden`
- Modals: `visibility/opacity` via `.is-hidden`
- Bottom sheets: `transform: translateY(100%)` via `.is-hidden`

---

## 7. Event System

### Registration Patterns

Two patterns are used:

**1. Direct registration** (for static elements):
```js
document.getElementById("nwSearch").addEventListener("input", handler);
```

**2. Delegated registration** (for dynamic content):
```js
container.querySelectorAll(".nw-check").forEach((cb) => {
  cb.addEventListener("change", updateNwState);
});
```

### Key Event Delegation Points

- Settings screen uses delegation on `#settingsContent` for click and change events
- Builder exercise list re-binds on every `renderNewWorkoutList()` call
- Workout session screen re-binds on every `renderWSSession()` call
- Home screen re-binds on every `renderHome()` call (card clicks, buttons, menus)

### Event Handler Organization

Handlers are scattered throughout `script.js` in these locations:
- Inline after function definitions (most common pattern)
- At the bottom of `DOMContentLoaded` callback (init)
- Inside render functions (for dynamic elements)

---

## 8. CSS Architecture

### Organization

CSS is split into 14 component files + 1 compiled file:

| File | Size | Purpose |
|---|---|---|
| `01-variables.css` | 84 lines | CSS custom properties, color/spacing tokens |
| `02-reset.css` | 121 lines | Reset, typography system |
| `03-layout.css` | 194 lines | App layout, responsive breakpoints |
| `04-utilities.css` | ~200 lines | Utility classes |
| `05-buttons.css` | ~250 lines | Buttons, nav indicator, tabs |
| `06-home.css` | ~400 lines | Dashboard, workout cards |
| `07-workout.css` | ~1500 lines | Session screen, exercise detail, builder |
| `08-body.css` | ~150 lines | SVG body diagram |
| `09-settings.css` | ~300 lines | Settings page |
| `10-nutrition.css` | ~400 lines | Nutrition panel (legacy) |
| `11-progress.css` | ~500 lines | Progress page |
| `12-modals.css` | ~300 lines | Modals, bottom sheets, overlays |
| `13-rest-timer.css` | ~100 lines | Rest timer overlay |
| `14-pr-system.css` | ~100 lines | PR toast |
| `styles.css` | 7,560 lines | Compiled output (all of the above) |

### Critical Note

**`styles.css` is NOT auto-generated.** It is manually maintained. When editing component CSS files, the corresponding section in `styles.css` must also be updated. The component files are organizational references, not the source of truth — `styles.css` is what the browser loads.

### Theming System

Themes use `[data-theme]` attribute on `<html>`:
- `data-theme="dark"` (default) — `--bg: #050505`
- `data-theme="light"` — `--bg: #ffffff`
- `data-theme="system"` — detected via `prefers-color-scheme`

Accent colors use `[data-accent]`:
- `data-accent="green"` (default), `"blue"`, `"orange"`, `"purple"`

Font sizes use `[data-font-size]`:
- `data-font-size="small"` — `14px` base
- `data-font-size="large"` — `18px` base

---

## 9. localStorage Schema

### Primary Key: `workout-tracker-v3`

Stores the full `state` object (see PROJECT_HANDOVER.md Section 11 for schema).

### Secondary Key: `wl_custom_program`

Stores the user's workout plan. Separate from main state to allow external editing:

```json
[
  {
    "id": "custom-abc123",
    "name": "Push Day",
    "focus": "",
    "day": "",
    "duration": "",
    "rest": "",
    "exercises": [
      { "name": "Barbell Bench Press", "sets": 3, "reps": 10, "weight": "", "notes": "" }
    ]
  }
]
```

### Data Size Estimates

| Data | Typical Size |
|---|---|
| Empty state | ~800 bytes |
| With profile + 10 workouts | ~5 KB |
| With 100 finished sessions | ~200-500 KB |
| With 365 daily weight entries | ~50 KB |

---

## 10. Key Algorithms

### Streak Calculation

```js
// Runs on doFinishWorkout() only
const today = new Date().toDateString();
const lastDate = state.workoutStreak.lastWorkoutDate;

if (lastDate !== today) {
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastDate === yesterday) {
    state.workoutStreak.currentStreak += 1;
  } else {
    state.workoutStreak.currentStreak = 1;
  }
  if (state.workoutStreak.currentStreak > state.workoutStreak.longestStreak) {
    state.workoutStreak.longestStreak = state.workoutStreak.currentStreak;
  }
  state.workoutStreak.lastWorkoutDate = today;
}
```

### Warm-up Generation

```js
// Percentage-based ramping sets
// Simple mode: 1-2 sets at ~50% working weight
// Advanced mode: 2-4 sets at 40%/50%/60%/75%/80%/90% depending on weight
// Filters out duplicates and sets >= working weight
```

### PR Detection (in prs.js)

```js
// For each exercise in the finished session:
// 1. Get all historical sessions with that exercise
// 2. For each done set, check if weight > all previous weights → "weight" PR
// 3. For each done set, check if reps > all previous reps at that weight → "reps" PR
// 4. Returns array of PR objects
```

### Program Generation

```js
function generateProgram(goal, days, equipment, duration) {
  // Selects exercises from EXERCISE_LIBRARY based on:
  // - Goal: strength (low reps), muscle gain (moderate reps), endurance (high reps)
  // - Days: splits exercises across N days
  // - Equipment: filters by available equipment
  // - Duration: estimates set count based on time available
  // Returns array of workout objects
}
```

---

## 11. Dependencies

### Runtime (CDN-loaded in HTML)

| Dependency | Version | Usage | URL |
|---|---|---|---|
| Chart.js | 4.x (latest) | Exercise analytics charts | `https://cdn.jsdelivr.net/npm/chart.js` |
| Google Fonts | — | Plus Jakarta Sans | `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800` |

### Development (npm)

| Package | Version | Usage |
|---|---|---|
| eslint | ^10.4.1 | Linting |
| prettier | ^3.8.4 | Code formatting |
| serve | ^14.2.6 | Local dev server |
| eslint-config-prettier | ^10.1.8 | ESLint + Prettier integration |

### Zero Runtime Dependencies

The app has **no runtime npm dependencies**. Chart.js and Google Fonts are loaded from CDNs at runtime.

---

## 12. PWA Architecture

### Service Worker (`sw.js`)

**Strategy**: Cache-first with network fallback

1. **Install**: Pre-caches critical assets (HTML, CSS, JS, icons, manifest)
2. **Activate**: Clears old caches, claims all clients
3. **Fetch**: Returns cached response if available, otherwise fetches from network and caches

### Cache Name: `ironlog-v1`

Increment the version number to force re-cache on update.

### Pre-cached Assets

```js
const ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/script.js",
  "/js/body-map-svg.js",
  "/assets/icons/favicon.svg",
  "/manifest.json",
];
```

### Manifest (`manifest.json`)

- Name: "IronLog"
- Display: `standalone` (full-screen PWA)
- Orientation: `portrait-primary`
- Theme: `#0a0a0a` (dark)
- Background: `#050505` (matches page bg)

---

## 13. Performance Notes

### Known Bottlenecks

1. **`render()` re-renders everything** — called on every state save. For large session histories, this means rebuilding the entire session log, progress page, etc. on every action.
2. **No DOM diffing** — `innerHTML` replacement destroys and recreates DOM nodes, losing state (scroll position, focused inputs, etc.)
3. **Chart.js instances** — not destroyed when hidden; could accumulate memory over long sessions.

### What's Fast

- Set completion updates are scoped (only re-renders the set list and stats)
- Search and filter operations are O(n) on the exercise library (159 items)
- Full page load is instant (all local, no network)

### Bundle Size

| Resource | Size |
|---|---|
| `index.html` | ~20 KB |
| `styles.css` | ~180 KB |
| `script.js` | ~250 KB |
| `Chart.js` (CDN) | ~250 KB (cached) |
| Google Fonts | ~15 KB (cached) |
| **Total first load** | ~500 KB (uncached), ~250 KB (cached) |

---

## 14. Mobile-Specific Architecture

### Viewport Configuration

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

- `viewport-fit=cover`: Allows full-bleed on notched devices
- `apple-mobile-web-app-status-bar-style: black-translucent`: Status bar blends with dark theme

### Touch Target Sizing

- All interactive elements: `min-height: 44px` (Apple HIG)
- Chips/buttons: minimum 36px touch targets
- No `touch-action: manipulation` on buttons (purposely omitted to allow double-tap zoom in inputs)

### Safe Areas

- `env(safe-area-inset-bottom)` applied to bottom nav height and page padding
- `env(safe-area-inset-top)` applied to main area padding

### Keyboard Handling

- Weight manual input: focuses input, shows numeric keyboard
- Enter key saves (listens for `keydown` with Enter)
- Blur restores display mode

---

## 15. Code Conventions

### Naming

| Convention | Example | Used For |
|---|---|---|
| `camelCase` | `state.workoutStreak` | JS variables, functions, state keys |
| `kebab-case` | `barbell-bench-press` | Exercise IDs, CSS classes, HTML IDs |
| `PascalCase` | `EXERCISE_LIBRARY` | Constants (arrays, config) |
| `snake_case` | `STORAGE_KEY` | Storage constants |

### HTML ID Pattern

- `screen-{name}` for screen containers
- `panel-{name}` for panel containers
- `{prefix}{Name}` e.g., `nwSearch`, `wsFinishBtn`, `edSetList`

### CSS Class Pattern

- `.nw-*` — new workout builder
- `.ws-*` — workout session
- `.ed-*` — exercise detail
- `.el-*` — exercise library
- `.ea-*` — exercise analytics
- `.ss-*` — session summary
- `.gm-*` — generate modal
- `.ew-*` — edit workout
- `.wl-*` — weight log

### State Mutation Pattern

```js
// READ
const val = state.someProperty;

// WRITE (primitive)
state.someProperty = newValue;
saveState();

// WRITE (array push)
state.someArray.push(newItem);
saveState();

// WRITE (array filter/replace)
state.someArray = state.someArray.filter(predicate);
saveState();
```

### Render Pattern

```js
function renderSomeSection() {
  const container = document.getElementById("containerId");
  if (!container) return;
  
  const data = state.someData;
  container.innerHTML = data.map(item => `
    <div class="item">
      <span>${item.name}</span>
    </div>
  `).join("");
  
  // Re-bind events
  container.querySelectorAll(".item").forEach(el => {
    el.addEventListener("click", handler);
  });
}
```

---

## 16. Error Handling

### Recovery from Corrupted State

```js
function loadState() {
  try {
    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...fallback, ...loaded };
  } catch {
    return fallback;  // Silent recovery — user loses nothing
  }
}
```

### Save Failure

```js
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}  // Silent failure — user may lose latest changes
}
```

### Import Validation

```js
// Whitelist approach: only known keys allowed
const allowedKeys = new Set(["sessions", "plan", "customExercises", ...]);
const arrayKeys = new Set([...]);
// Validate types before assigning to state
```

### No Error Reporting

There is no error logging, crash reporting, or user-facing error messages for internal errors. JS errors silently break the affected render function or event handler.

---

## 17. Testing

### Zero Tests

There are no unit tests, integration tests, or E2E tests.

### Manual Test Workflow

The recommended manual test flow is:

1. Clear all data → fresh state
2. Complete onboarding (4 steps)
3. Create a workout via builder
4. Create a workout via generator
5. Start workout → complete all sets
6. Edit a set (weight, reps)
7. Add a set mid-session
8. Repeat last set
9. Finish workout → verify summary
10. Log weight via dashboard card
11. Check progress page (weight goal, streak, calendar)
12. Refresh page → verify all data persists
13. Create another workout → start → incomplete sets → finish anyway
14. Verify streak incremented
15. Close tab → verify beforeunload warning (active workout)
