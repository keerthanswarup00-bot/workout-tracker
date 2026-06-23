# AI_START_HERE.md

> **Read this first.** Every new AI session starts here. Then read PROJECT_HANDOVER.md → CODEBASE_ARCHITECTURE.md → CURRENT_STATE_REPORT.md before making any changes.

---

## Project Identity

- **Name:** IronLog
- **Version:** 1.6.0
- **Tagline:** Dark-themed, mobile-first PWA workout tracker for recomposition athletes
- **Deployment:** Vercel (serves `src/` directly)

## Tech Stack

- **Language:** Vanilla JavaScript (ES2022+) — no TypeScript, no framework
- **Markup:** Single HTML file (`src/index.html`, 1,142 lines)
- **Styling:** CSS3 with custom properties (`src/css/styles.css`, 7,560 lines)
- **Storage:** `localStorage` only — no server, no API, no backend
- **PWA:** Service worker (`src/sw.js`) + manifest (`src/manifest.json`)
- **Dependencies:** Chart.js (CDN), Google Fonts (Plus Jakarta Sans) — zero npm runtime deps
- **Dev tools:** ESLint, Prettier, `serve` (local dev)

## Git & GitHub

- **Remote:** `https://github.com/keerthanswarup00-bot/workout-tracker.git`
- **Branch:** `main` (single branch, no `dev`/`staging`)
- **HEAD:** `838ae5b` — "New workout creation flow: New button, bottom sheet, generate workout, empty plan"
- **Working tree:** Uncommitted changes exist (handover docs, JS/CSS/HTML edits from latest session)
- **Auth:** Uses `credential.helper` (OS keychain) — no token needed for push/pull
- **Convention:** `feat: description` for features, `fix: description` for bug fixes
- **No CI/CD pipeline** — Vercel auto-deploys from `main`
- **Commit before pushing** — do not push uncommitted work

## Current Architecture

```
index.html  ─── loads ───→ styles.css (all styles)
                           ↓
                    script.js (ALL logic, 7,249 lines)
                           ↓
                    prs.js (PR detection helpers)
                           ↓
                    body-map-svg.js (SVG diagram)
                           ↓
                    localStorage ↔ state (global object)
```

**Key architectural facts:**
- Single global `state` object holds everything. Mutate → `saveState()` → re-render.
- No modules, no virtual DOM, no build step. Direct DOM manipulation via `innerHTML`.
- Mobile-first. Bottom nav on mobile, sidebar on desktop (768px+).
- All screens are divs shown/hidden via CSS classes (`.is-hidden`, `.is-active`).
- 4 main panels: Sets (default), Sessions, Progress, Body.
- Panels contain multiple screens (home, builder, session, exercise detail, etc.).

## Current Workflow (User Journey)

```
App opens → state.user === null? → 4-step Onboarding (name/age/height/weight → goal → experience → location+target)
         ↓
Dashboard → "+ New" → Build Workout (search/filter/select exercises + name) OR Generate Workout (goal/split/experience)
         ↓
Workout card → tap → Details screen → "Start Workout"
         ↓
Session screen → tap exercise → Exercise Detail (Level 2) → mark sets done, add/edit sets
         ↓
"Finish Workout" → confirmation if incomplete → Summary overlay (stats, PRs, muscles, notes)
         ↓
Progress tab → Weight goal card + Streak card + Calendar + Weekly/Monthly/Achievements
```

## Critical Rules

1. **Streak requires finishedAt.** `session.finishedAt` must be set. Multiple workouts same day = 1 streak day.
2. **Empty arrays are falsy for completion.** `[].every(s => s.done)` returns `true`. Always guard with `totalWorking > 0`.
3. **One active session per day.** `getTodaySession()` returns only the unfinished one. Creating a new session replaces old same-day ones.
4. **Default sets/reps in builder = 3 sets × 10 reps.**
5. **All weights in kg.** No unit conversion. Display with `displayWeight()` (1 decimal).
6. **Workout names must be unique** (case-insensitive) across all workouts in plan.

## Known Constraints

| Constraint | Impact |
|---|---|
| Single JS file (7,249 lines) | Hard to navigate, refactor, test |
| Single CSS file (7,560 lines) | Selector conflicts possible |
| Zero tests | Every change is blind |
| localStorage 5-10MB limit | Heavy users may hit limits |
| No data pagination | Large histories slow full renders |
| No error boundary | JS errors break panel rendering |
| i18n: English only | Hardcoded strings everywhere |
| Nutrition panel: legacy/dead code | Not accessible from nav; don't waste time on it |

## Do Not Break

1. **Storage key:** `workout-tracker-v3` — changing it loses all user data.
2. **`wl_custom_program`** localStorage key — primary workout storage.
3. **Legacy migration code** in `loadState()` — existing users have `wl_bodylog` data.
4. **Exercise ID format** — library: kebab-case, custom: `custom-` prefix.
5. **`const plan = []`** fallback — used when no custom program exists.
6. **Service worker cache name** (`ironlog-v1`) — users with old cache re-download everything.
7. **Onboarding save-on-complete only** — closing without "Get Started" leaves `state.user === null`.
8. **Git remote URL** — do not change or remove; push/pull depends on it.
9. **Do NOT force-push** (`git push --force`) — there is no backup.
10. **Do NOT commit secrets** — there are none, but don't add them.

## High Priority Next Tasks

1. **Add unit tests** — streak calc, PR detection, warmup generation first
2. **Fix Chart.js memory leak** — destroy chart instances on analytics tab switch
3. **Add data pagination** — session log, weight log load more on scroll
4. **Split `script.js` into modules** — state, workouts, exercises, progress, settings

## Git Workflow

```bash
# Status check (always check first)
git status                  # See what's changed
git diff --stat             # See file-level changes

# Stage and commit (ask user before committing)
git add <files>
git commit -m "feat: description"   # or "fix: description"

# Push (ask user before pushing)
git push origin main

# View history
git log --oneline -10       # Last 10 commits
git log --oneline --all     # All branches

# Never do:
# git push --force
# git rebase
# git reset --hard
# git commit --amend (on pushed commits)
```

## Recent Major Changes (June 2026)

- **Onboarding V2:** 4-step flow with chips (goal/experience/location/target weight)
- **Exercise tags + 61 new exercises:** 159 total, all with tags for smart search
- **Smart search + 3-group filters:** Muscle, Equipment, Type — search matches name/tags/muscle/equipment
- **Progress page V1:** Weight goal card + streak card + BMI
- **Streak system V2:** `currentStreak`, `longestStreak`, `lastWorkoutDate`
- **Exit protection:** beforeunload, visibilitychange auto-save, popstate confirm
- **Micro-interactions:** Scale animations on set/button completion
- **Workout name validation:** Case-insensitive duplicate check
- **BMI on dashboard:** Auto-calculated, updates on weight log
- **Custom exercise enhancements:** Equipment select + tags input

## Where to Start Reading

| Order | File | Why |
|---|---|---|
| 1 | `AI_START_HERE.md` | You're here |
| 2 | `PROJECT_HANDOVER.md` | Complete app documentation (21 sections) |
| 3 | `CODEBASE_ARCHITECTURE.md` | Technical deep-dive (data flow, state, DOM) |
| 4 | `CURRENT_STATE_REPORT.md` | Feature inventory, bugs, pending work |
| 5 | `src/js/script.js` lines 1060-1122 | State management (loadState/saveState) |
| 6 | `src/js/script.js` lines 1-108 | Constants, helpers |
| 7 | `src/index.html` | All screens, modals, bottom sheets |
| 8 | `src/css/styles.css` (via grep) | Find specific CSS rules |

## Starter Prompt for New AI Sessions

Copy this verbatim into a new AI session:

```
You are resuming work on IronLog. Read ALL the handover docs before touching code.

## Project Root
/Users/shivaswaroop/Documents/workout-tracker

## Git
Remote: https://github.com/keerthanswarup00-bot/workout-tracker.git
Branch: main
HEAD: 838ae5b — "New workout creation flow"
Working tree: has uncommitted changes (handover docs + latest session work)
Rules: No force-push, no rebase, no amend. Ask before commit/push.

## Reading Order
1. AI_START_HERE.md (this file)
2. PROJECT_HANDOVER.md
3. CODEBASE_ARCHITECTURE.md
4. CURRENT_STATE_REPORT.md
5. SESSION_HANDOFF.md

## Source Files
- src/js/script.js — ALL logic
- src/css/styles.css — ALL styles
- src/index.html — ALL markup
- src/sw.js — Service worker
- src/manifest.json — PWA manifest

## Dev
npm run dev → http://localhost:8080

## Critical Rules
- Storage key: "workout-tracker-v3" — do NOT change
- wl_custom_program — primary workout storage, do NOT change
- Do NOT break legacy migration in loadState()
- All weights in kg, no unit conversion
- [].every(s => s.done) === true — guard with totalWorking > 0
- No build step, no backend, no npm runtime deps
- Nutrition panel is legacy/dead — skip it
- Never force-push, rebase, or amend pushed commits

Start by reading the handover docs, then ask what to work on.
```
