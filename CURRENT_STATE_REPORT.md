# IronLog — Current State Report

> Complete snapshot of the application as of the latest session. Generated: June 12, 2026.

---

## 1. Version Information

| Field | Value |
|---|---|
| Project Name | IronLog |
| Version | 1.6.0 |
| Last Commit | `838ae5b` |
| Branch | (not specified — working tree) |
| Commit Message | "New workout creation flow: New button, bottom sheet, generate workout, empty plan" |
| Deployment | Vercel — `src/` as output directory |
| Build Status | No build step (static files) |
| Test Status | No tests |

---

## 2. Features Implemented (Complete)

### Core Workout Tracking
- [x] Set-by-set workout logging with real-time checkboxes
- [x] Session management (create, start, resume, finish)
- [x] Exercise detail drill-down (Level 2 screen)
- [x] Set management (add, edit, delete, repeat last)
- [x] Warm-up auto-generation (simple and advanced modes)
- [x] Session summary with stats, PRs, muscle targeting, recovery impact
- [x] Workout progress bar (animated fill + "X / Y Exercises" label)

### Exercise Library
- [x] 159 exercises across 12 categories
- [x] Tags on every exercise (muscle, equipment, type, movement pattern)
- [x] Smart search (matches name, tags, muscle, equipment)
- [x] Filter bar with 3 groups: Muscle (7), Equipment (5), Type (2)
- [x] Custom exercise creation with tags, equipment, category
- [x] Exercise library screen (recent + all + categories)

### Workout Management
- [x] Build workout (manual builder with search/filters)
- [x] Generate workout (auto based on goal/split/experience)
- [x] Edit workout (name, reorder exercises, add/remove)
- [x] Duplicate workout
- [x] Delete workout (from 3-dot menu)
- [x] Case-insensitive duplicate name validation

### Progress & Tracking
- [x] Workout streak (current + longest, consecutive day tracking)
- [x] Weight goal tracking (current vs target, difference, BMI)
- [x] BMI auto-calculation (dashboard, progress page, settings)
- [x] Weight logging (bottom sheet, ± buttons, manual input)
- [x] Weight history (edit, delete entries)
- [x] Calendar hero grid (visual workout day tracking)
- [x] Weekly review (sets, volume, duration, PRs, trained days)
- [x] Monthly review (volume comparison)
- [x] Achievement badges
- [x] PR detection (weight PRs and rep PRs)

### Onboarding
- [x] 4-step onboarding modal
- [x] Step 1: Basic info (name, age, height, weight)
- [x] Step 2: Goal (fat loss, recomp, lean bulk, bulk)
- [x] Step 3: Experience (beginner, intermediate, advanced)
- [x] Step 4: Location (home, gym, outdoor, any) + target weight
- [x] Skip button
- [x] Back/Next navigation
- [x] Chip selection with active state

### UI/UX
- [x] Dark theme (default), light theme option, system detection
- [x] 4 accent colors (green, blue, orange, purple)
- [x] 3 font sizes (default, small, large)
- [x] Mobile-first responsive design
- [x] Desktop sidebar (768px+)
- [x] Floating pill bottom nav with animated indicator
- [x] Safe area handling (notched devices)
- [x] Micro-interactions (scale bounce on set/button completion)
- [x] Focus mode (hides nav, sidebar, topbar during workout)

### Data Management
- [x] localStorage persistence
- [x] Legacy data migration (wl_bodylog, workoutGroups)
- [x] Data export (JSON file download)
- [x] Data import (JSON file upload with whitelist validation)
- [x] Delete all data (with confirmation modal)

### Exit Protection
- [x] beforeunload warning during active workout
- [x] visibilitychange auto-save
- [x] popstate confirmation dialog

### PWA
- [x] Service worker (cache-first strategy)
- [x] Manifest (standalone, portrait, dark theme)
- [x] Installable

### Settings
- [x] Profile editor (name, age, gender, height, weight, goal, activity)
- [x] Rest timer (30/60/90/120/180s with ring countdown)
- [x] Weight increment (0.5/1/1.25/2.5/5)
- [x] Rep increment (1/2)
- [x] Warmup style (simple/advanced)
- [x] Cool-down duration (3/5/8 min)
- [x] Toggle settings (auto-rest, auto-next, focus mode, screen awake, etc.)
- [x] Exercise analytics view (from exercise detail)

---

## 3. Features Partially Implemented

### Exercise Analytics
- [x] Overview tab (lifetime volume, sets, PRs)
- [x] Volume tab (chart)
- [x] Strength tab (1RM chart)
- [x] History tab (all past sessions)
- [ ] Mobile responsive chart sizing could be improved
- [ ] No export for analytics data

### Nutrition Panel
- [ ] Wired up in HTML/CSS/JS but **removed from navigation**
- [ ] Curated food database (14 foods)
- [ ] Meal logging per date
- [ ] Water intake tracking
- [ ] Macro targets (protein 146g, carbs 240g, fat 65g)
- **Status**: Legacy/dead code. Not accessible from nav.

---

## 4. Known Bugs

### Active (Confirmed)
| Bug | Severity | Notes |
|---|---|---|
| Stopwatch elapsed time shows from session start, not actual working time | Low | Cosmetic — resume after page refresh shows total elapsed, not paused duration |
| Chart.js instances may accumulate when switching analytics tabs | Medium | Charts not destroyed on tab switch; could cause memory issues over long sessions |
| No loading state on initial render | Low | Brief flash of unstyled content before JS renders |

### Fixed (Historical)
| Bug | Fix |
|---|---|
| False completion checkmark for empty exercises | Added `totalWorking > 0` guard |
| Nav indicator hidden on first load | Moved `activateTab()` before `render()` |
| Builder created exercises with 0 sets | Changed default to `sets: 3, reps: 10` |
| Weight input not usable | Tap-to-focus, keyboard, Enter-save flow |
| getTodaySession() returned finished sessions | Added `!item.finishedAt` filter |
| Duplicate sessions for same workout | Added workoutId check on session creation |

---

## 5. Known Limitations

### Technical
| Limitation | Impact |
|---|---|
| 7,249 lines in single JS file | Hard to navigate, refactor, or test |
| 7,560 lines in single CSS file | Hard to maintain, selector conflicts possible |
| No test coverage | Any change risks regressions |
| localStorage 5-10MB limit | Heavy users with years of data may hit limits |
| No data pagination | Large session histories slow down full renders |
| No TypeScript | No static type checking; runtime errors possible |
| No error boundary | One JS error can break entire panel rendering |
| No i18n | English only, hardcoded strings throughout |

### Functional
| Limitation | Impact |
|---|---|
| No workout templates | Users must create workouts from scratch or generate |
| No exercise substitution | If equipment unavailable, user must manually swap exercises |
| No social features | No sharing, comparing, or community features |
| No cloud sync | Data is device-local only |
| No backup/restore automation | User must manually export/import JSON |
| No print-friendly view | Cannot print workout plans |
| No search in exercise detail | The "Add Exercise" in session search is basic compared to builder |
| No batch operations | Cannot delete/complete multiple sets at once |

---

## 6. Pending Improvements (Priority Ordered)

### High Priority
1. **Split `script.js` into modules** — functional separation (state, workouts, exercises, progress, settings, etc.)
2. **Add unit tests** — at minimum for streak calculation, PR detection, warmup generation
3. **Fix Chart.js memory leak** — destroy chart instances on tab switch
4. **Add pagination for session log** — limit rendered sessions to 50, load more on scroll

### Medium Priority
5. **Make component CSS files the source of truth** — build `styles.css` from individual files (simple concatenation script)
6. **Add keyboard shortcuts** — space for complete set, tab for next exercise, etc.
7. **Improve desktop layouts** — wider cards, multi-column exercise lists
8. **Add rest timer auto-start** — auto-start on set completion

### Low Priority
9. **Add exercise substitution suggestions** — similar exercises by muscle group
10. **Add workout templates** — pre-built PPL, Upper/Lower, etc.
11. **Add data backup reminder** — periodic reminder to export
12. **Add `Intl` formatting** — replace manual date/weight formatting with `Intl` APIs
13. **Add `prefers-reduced-motion` support** — respect accessibility preference

---

## 7. Git History (Last 10 Commits)

```
838ae5b New workout creation flow: New button, bottom sheet, generate workout, empty plan
963cc85 Workout card redesign: Start/Continue buttons, FAB, details screen, empty state, nav polish
55cd158 Mobile UI/UX refinement: weight modal redesign, workout card simplification, exercise search & filters, bottom sheet menus, profile banner, emoji cleanup
0e246dd Phase 4 UX refinement, workout flow rebuild and mobile fixes
dc0aaff feat: workout CRUD, exercise editing, analytics, rest timer, data flow — full production push
7d32f13 Clean up: remove dead code, adherence grid, muscle sheet, deprecated settings, orphaned functions
33ecab7 refactor: remove old calendar popup/hero, add bottom-sheet calendar date, clean dead code
18ec21f feat: complete critical mobile UI polish and responsive pass #2
edabde4 feat: exercise detail screen V1.5, set completion flow, 13 settings fixes
8789822 feat: smart warm-up generator with setup flow, compound/isolation classification, auto-collapse
```

---

## 8. File Inventory

| File | Lines | Size (est.) | Last Modified |
|---|---|---|---|
| `src/index.html` | 1,142 | ~20 KB | June 2026 |
| `src/css/styles.css` | 7,560 | ~180 KB | June 2026 |
| `src/js/script.js` | 7,249 | ~250 KB | June 2026 |
| `src/js/body-map-svg.js` | 64 | ~3 KB | June 2026 |
| `src/js/data/prs.js` | ~6,728* | ~6.7 KB | June 2026 |
| `src/sw.js` | 53 | ~1.5 KB | June 2026 |
| `src/manifest.json` | 27 | ~0.5 KB | June 2026 |

*\*prs.js appears large but is primarily the EXERCISE_LIBRARY array that was moved*

---

## 9. Deployment

| Detail | Value |
|---|---|
| Platform | Vercel |
| Output Dir | `src/` |
| Install Command | None |
| Build Command | None |
| URL | Deployed from `main` branch |

---

## 10. Latest Update Summary

### Changes Made in This Session (June 12, 2026)

**Feature Overhaul — 10 Areas:**

1. **Multi-step Onboarding V2**: Replaced single-step form with 4-step guided flow (basic info → goal → experience → location + target weight) using chips for selection

2. **Exercise Tags + Database Expansion**: Added tags array to all 159 exercises. Expanded library with 61 new exercises across all muscle groups. Tags include muscle, equipment, Compound/Isolation, and movement patterns.

3. **Smart Search & Filter System**: Search now matches name, tags, primaryMuscle, and equipment. Filter bar expanded to 3 groups (Muscle, Equipment, Type) with labeled sections.

4. **Progress Page V1**: Weight goal card (current vs target, diff, BMI) and streak card (current + longest). All data from real state — no placeholders.

5. **Workout Streak System V2**: `workoutStreak` tracks current, longest, lastWorkoutDate. Updated only on `doFinishWorkout()`. Multiple workouts same day count once.

6. **Exit Protection**: `beforeunload` warning, `visibilitychange` auto-save to localStorage, `popstate` confirmation dialog — all when an active workout exists.

7. **Micro-interactions**: Scale-bounce animation on set completion (1→1.03→1) and button press (1→0.97→1) via CSS transform + setTimeout.

8. **Workout Name Validation**: Case-insensitive duplicate check when creating via builder, create modal, and generator.

9. **Weight/BMI Improvements**: BMI auto-displays on dashboard weight card subtitle ("BMI: XX.X"), auto-updates on weight log changes.

10. **Custom Exercise Enhancements**: Added equipment select (Barbell/Dumbbell/Cable/Machine/Bodyweight) and tags input (comma-separated) to custom exercise form.

### Files Modified

| File | Changes |
|---|---|
| `src/js/script.js` | Search/filter rewrite, progress page render, streak system, exit protection, micro-interactions, name validation, BMI display, custom exercise features, onboarding V2 |
| `src/css/styles.css` | Onboarding chip styles, filter section styles, progress stat styles |
| `src/index.html` | Custom exercise modal fields (equipment select, tags input) |
