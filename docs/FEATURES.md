# Feature Overview

## Tab Structure
- **🏋️ Train** — Today dashboard, Workout logger (with RPE, supersets, rest timer), Recovery/ skip log
- **📊 Body** — Weigh-in, weight chart (30-day), body measurements, 12-week adherence grid, gym cost
- **🥗 Fuel** — Nutrition form, macro donut chart, water tracker (3L target), calorie burn sync
- **📈 Progress** — PR board, strength standards, weekly review, exercise history (sparklines + detail modal), session log, program loader

## New Features (v2)
- Fatigue check-in (sleep/energy/soreness sliders)
- Rest timer (60/90/120s presets, auto-start on set tick, pause/resume, vibrate)
- Previous session auto-fill
- RPE logging (6-10 tap targets with color dots)
- Session notes modal on finish
- Superset visual grouping
- Missed session skip log (with pattern analysis)
- Daily weigh-in with body fat %, weekly trends
- Weight chart (Chart.js) with weekly average overlay
- Body measurements (7 sites, monthly, change tracking)
- Adherence grid (12-week calendar with streak counter)
- Gym cost per session
- Macro donut chart with progress bars
- Water intake tracker (quick-add buttons, progress bar, status messages)
- Calorie burn sync (workout calories adjust remaining)
- PR tracker (auto-detect, gold badge, PR board)
- Plateau detection (3 sessions same weight)
- Weekly review dashboard (sessions, sets, volume, nutrition, PRs, weight change)
- Strength standards (1RM vs bodyweight, 4 lifts, 4 levels)
- Custom program loader (text parse, preview, confirm)

## Data
All data persists in localStorage with `wl_` prefix for new features. Existing key `workout-tracker-v3` preserved.
