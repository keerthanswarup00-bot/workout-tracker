# IronLog — Production QA Checklist

## Core Functionality

- [ ] **Onboarding (FTUE)**: Complete all 6 steps → reaches Done screen → confetti particles animate → click "Generate My First Program" opens generator → click "Explore IronLog" goes to home
- [ ] **Create Workout**: Open + New → name workout → browse/search exercises by muscle group → select exercises → save → appears in workout list → edit existing workout
- [ ] **Start Workout**: Tap a workout → Start → log sets (weight/reps/RPE) → edit on the fly → complete with cooldown → session summary with PR detection
- [ ] **Generator**: Open Generate → pick goal/split/days/experience → generate program → review → accept → workouts appear
- [ ] **Weight Log**: Tap ⚖️ Log Weight → enter weight → save → weight updates across home/dashboard/trends
- [ ] **Water Tracking**: Tap any water add button (+250/+500/+750) → total updates → resets daily
- [ ] **Profile**: Open avatar → edit name, age, height, weight, goal, experience, training days → save → changes reflect everywhere
- [ ] **Settings**: Toggle theme/accent/font-size → all screens respect the setting → persistent across refresh
- [ ] **Dashboard**: Health cards show correct data → progress stat cards show data → coach section shows tips → profile completeness meter updates
- [ ] **Factory Reset**: Settings → Factory Reset → confirm → all data wiped → app reloads → welcome screen shows

## Data Integrity

- [ ] **Save/Reload cycle**: Make changes → refresh → all data persists (workouts, sessions, weight log, settings)
- [ ] **Import/Export**: Export data → JSON file downloads → Factory Reset → Import file → all data restored
- [ ] **Auto-save**: During active workout, visibility change triggers auto-save → refresh → workout still active
- [ ] **Browser storage full**: Fill localStorage → save attempt shows "Storage full" toast
- [ ] **Legacy import**: Pre-import backup key (`ironlog_pre_import_backup`) survives factory reset

## State & Edge Cases

- [ ] **Empty state**: Fresh install → no data → dashboard shows "No workouts yet" / "No data" gracefully
- [ ] **Null user**: `state.user` is null → all profile-dependent features degrade gracefully (no crash)
- [ ] **Missing fields**: Profile with only name/age/height/weight → `isProfileComplete()` returns correct completeness %
- [ ] **Goal not set**: `GoalCenter.getGoalType()` returns fallback → no crash in coach features, profile, generator
- [ ] **PR detection**: Finishing a set with higher weight/reps than previous → PR is detected → celebration overlay shows in summary
- [ ] **Invalid exercise data**: Corrupted `exerciseLibrary` → generator falls back to defaults
- [ ] **Body fat = 0**: Profile body fat = 0 → displays "0%" (not "Not Set")
- [ ] **Decimal weight**: Log 75.5 kg → displays correctly → chart plots correctly

## Responsive UI

- [ ] **Mobile (≤480px)**: Single column, full-width modals, bottom nav visible, muscle nav is horizontal scroll
- [ ] **Tablet (768px-1024px)**: 2-column layout on Create Workout, balanced margins, readable text
- [ ] **Desktop (≥1024px)**: 3-column Create Workout, sidebar visible, max-width constrained for readability
- [ ] **Long workout names**: 30+ character names → truncated/ellipsis in lists
- [ ] **Many exercises**: 20+ exercises in a workout → scrolls properly in builder
- [ ] **Keyboard**: Enter key to advance/save on modals (name, weight, goal, etc.)
- [ ] **Dark/Light theme**: All screens tested in both themes → no invisible text, no contrast issues

## Workout Generator

- [ ] **Each goal type**: Lose Fat / Build Muscle / Recomposition / Strength / General Fitness / Endurance → generates appropriate program
- [ ] **Each split**: PPL / Upper-Lower / Full Body / Push-Pull-Legs / Bro Split / Arnold / Custom → generates correct number of sessions
- [ ] **Each experience level**: Beginner / Intermediate / Advanced → adjusts volume, complexity
- [ ] **Equipment filter**: Only bodyweight exercises when "No Equipment" is selected
- [ ] **Regenerate**: Click regenerate → new variation without changing preferences
- [ ] **Accept**: Accept generated program → workouts appear on home screen

## Coach System

- [ ] **Coach state initialized**: `CoachSystem.getState()` returns valid state (not null)
- [ ] **Coach tips**: Home coach section shows relevant tips based on user data
- [ ] **Weekly report**: Generated on Sunday → shows progress summary
- [ ] **Problem detection**: Trainer identifies common issues (e.g., not enough protein, missing rest days)
- [ ] **CAS engine**: Achievements trigger and display on profile

## Performance & Stability

- [ ] **First paint**: Page loads and shows content within 3 seconds on 4G
- [ ] **Re-renders**: Adding weight, toggling tabs, or completing sets does not cause visible jank
- [ ] **Memory**: After 30+ workout sessions logged → home render completes in <100ms
- [ ] **Console errors**: Zero console errors on initial load, navigation, and all CRUD operations
- [ ] **Error boundaries**: Uncaught errors show a toast and log to console (no silent failures)

## Security & Data

- [ ] **XSS**: All user input (name, workout names, notes) is escaped via `escapeHtml()`
- [ ] **localStorage keys**: No leaked keys outside expected namespace
- [ ] **Export format**: Valid JSON that can be reimported
- [ ] **Service Worker**: `manifest.json` is valid; PWA install prompt works

## Polish & UX

- [ ] **Transitions**: Screen transitions have fade-in animation (0.3s)
- [ ] **Loading states**: PR celebration overlay animates correctly
- [ ] **Confetti**: Onboarding Done screen shows falling particles
- [ ] **Coach SVG**: Coach illustration animates (breathing, blink, wave)
- [ ] **Goal cards**: 6 goal cards animate with pop/stagger on selection
- [ ] **Buttons**: All buttons have hover/active states (scale, color change)
- [ ] **Toast**: Toast notifications appear and auto-dismiss (3s)
- [ ] **Form validation**: Required fields prevent advance; invalid values show toast
