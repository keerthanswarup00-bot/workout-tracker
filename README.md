# iron log

A dark-themed, Hevy-inspired workout tracker for recomposition athletes. Track training, body composition, nutrition, and progress in a single-page app.

## Features

- **Sets** — 4-level drill-down navigator: My Workouts → Plan Detail → Exercise Detail → Log Set (bottom sheet). 1RM estimation (Epley formula), session analysis with delta comparison, repeat previous session, swipe-to-delete with undo
- **Sessions** — Session history, personal records board, weekly review, monthly report, 12-week adherence grid
- **Body** — Daily weigh-in with BF%, goal prediction, weight trend chart, smart analysis, bodyweight history with filter chips
- **Today** — Daily dashboard with macro tracking, protein score, nutrition compliance, smart suggestions, favorite meals, quick foods, water tracker, weekly nutrition review, coach alerts, recovery tracking, strength analytics

## Tech

Vanilla HTML/CSS/JS. Chart.js 4.4.0 for visualizations. localStorage for data persistence. Syne + DM Mono fonts.

## Design

- Dark theme only (`--bg: #0a0a0a`, `--surface: #141414`)
- Fixed sidebar (220px) on desktop, pill-shaped floating bottom nav on mobile (<768px)
- Spring-animated nav indicator (`cubic-bezier(0.34, 1.4, 0.64, 1)`)
- Bottom sheet set logging overlay
- No gradients, no drop shadows, no blur

## Usage

Open `src/index.html` in a browser or deploy via Vercel.
