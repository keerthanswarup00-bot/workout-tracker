# IronLog Design System (v1.0 Core)

This document captures the restored IronLog V1 design baseline. Every future component must inherit from this system.

---

## 1. Navigation

### Bottom Nav
- Pill-shaped floating bar at bottom of viewport
- 4 tabs: Sets, Sessions, Progress, Body
- Active tab indicated by sliding pill indicator
- Icons are simple line-art SVGs (no filled icons)
- Labels below icons, single word
- Compact mode on scroll (reduces height)
- Background: `var(--surface)` with backdrop blur

### Sidebar Nav (Desktop)
- Fixed left sidebar, 220px wide
- Same 4 tabs as bottom nav
- Text labels with small icon left of each
- Active state: accent color
- Background: `var(--surface)`

---

## 2. Panels

### Sets (Workout)
- Home screen: greeting, stats cards, today's incomplete banner, quick-start buttons
- Workout Details: exercise list with sets/reps/weight, accordion-style
- Workout Session: live timer, exercise flow, set logging, rest timer
- Exercise Detail: history chart, volume/strength analytics
- Exercise Library: searchable, categorized exercise browser
- Settings: full app settings panel

### Sessions
- Session Log: chronological list of past workouts
- PR Board: personal records by exercise
- Weekly Report: training volume summary
- Monthly Report: monthly stats
- Adherence Grid: day-by-day workout tracking calendar

### Progress
- Training Calendar: month view with workout markers
- Progress Insights: trend analysis and observations
- Recovery Status: muscle group recovery state
- Goals Section: goal cards with progress

### Body
- Weigh-In Card: today's weight entry
- Weight Trend: 7/14/30-day averages with trend badge
- Weight Chart: 30-day Chart.js line graph
- Goal Prediction: projected goal date based on current rate
- Body Analysis: interactive muscle map with 4 modes (Trained Today, Weekly Coverage, Recovery, Strength Trend)
- Muscle Tooltip: hover tooltip with sets, volume, last trained, recovery
- Muscle Sheet: bottom sheet with detailed muscle stats
- Muscle Search: filter muscle list

---

## 3. Cards

- Background: `var(--surface)` (#151515)
- Border radius: 12px (`var(--radius)`)
- Border: 1px solid `var(--border)` (rgba(255,255,255,0.08))
- Inner padding: 1rem
- No box-shadow
- No rounded corners larger than 12px
- No gradient backgrounds
- No Apple-style floating or elevation

---

## 4. Typography

- Font family: `"Plus Jakarta Sans", sans-serif` (Google Fonts)
- Weights: 500 (medium), 600 (semibold), 700 (bold), 800 (extra bold)
- Body: 500 weight, `var(--text)` color (#e5e5e5)
- Secondary text: `var(--text-secondary)` (#737373)
- Headings: 700-800 weight
- Labels: uppercase, small, secondary color (section-label pattern)
- Monospace: used for numbers in workout sets/reps/weight

---

## 5. Colors

### Theme (Dark Only)
- Background: `#050505`
- Surface: `#151515`
- Surface-2: `#1a1a1a`
- Surface-3: `#202020`
- Border: `rgba(255,255,255,0.08)`
- Text: `#e5e5e5`
- Text Secondary: `#737373`

### Accent
- Primary (green): `#00d26a`
- Primary hover: `#00b95d`
- Orange: `#ff9f0a`
- Blue: `#3b82f6`
- Red: `#ef4444`
- Yellow: `#eab308`

### Functional Colors
- Protein: `#00d26a`
- Carbs: `#3b82f6`
- Fat: `#ff9f0a`
- Recovery: fatigue (red), low (orange), recovering (yellow), recovered (green)
- Muscle map: untrained (#3a3a3a), undertrained (blue), optimal (green), high (orange), overtrained (red)

---

## 6. Spacing

- Base unit: 0.25rem (4px)
- Card padding: 1rem (16px)
- Section gap: 1.25rem (20px)
- Panel padding: 1rem
- List item padding: 0.75rem 1rem
- Button padding: 0.5rem 1rem
- No excessive whitespace
- No Apple-style breathing room
- Compact, data-dense layout

---

## 7. Buttons

### Primary
- Background: `var(--accent)` (#00d26a)
- Text: `#050505` (dark)
- Border-radius: 8px
- Font-weight: 700
- Padding: 0.5rem 1rem
- No icon by default

### Secondary / Text
- No background
- Color: `var(--text-secondary)` or `var(--accent)`
- Used for secondary actions

### Goal / Filter Chips
- Small rounded pills
- Active: accent background
- Inactive: surface background

---

## 8. Icons

- Simple line-art SVGs (stroke-based, no filled shapes)
- Stroke width: 2px
- Round linecaps and linejoins
- Size: 20x20px in navigation, 16-24px inline
- No filled icons
- No multi-color icons
- Current color (`currentColor`) for theme inheritance

### Nav Icons
- Sets: 4 small squares (grid)
- Sessions: circle with clock hand (history)
- Progress: 3 ascending bars (chart)
- Body: human figure outline

---

## 9. Modals & Sheets

### Bottom Sheets
- Slide up from bottom
- Overlay: semi-transparent dark backdrop
- Handle bar at top (short rounded rectangle)
- Rounded top corners (12px)
- Max-width: 360px centered
- `is-hidden` class for show/hide

### Tooltips
- Positioned near cursor
- Dark background (`var(--surface-3)`)
- Small text, multi-row layout
- Auto-reposition to stay in viewport
- Hidden via `is-hidden` class

---

## 10. Interactive Patterns

### Rest Timer
- Persistent during workout
- Circular countdown or linear timer
- Sound/vibration on completion
- +30s, Reset, Skip buttons

### Accordion (Exercise Detail)
- Expandable/collapsible exercise rows
- Chevron indicator
- Smooth transition

### Muscle Map
- SVG-based body outline
- Color-coded by training status
- Hover shows tooltip
- Click opens bottom sheet
- 4 view modes toggled by pill buttons

### Weight Chart
- Chart.js line chart
- 30-day rolling window
- No legend, minimal labels
- Dark theme canvas

---

## 11. Responsive Behavior

- Mobile-first
- Bottom nav visible on all screen sizes
- Sidebar nav hidden on mobile (<768px)
- Single column layout on mobile
- Charts stack vertically on narrow screens
- Touch-friendly tap targets (min 44px)
- No layout shift during navigation
- Smooth scroll in main area

---

## 12. Animation Principles

- Minimal and purposeful
- Transitions: 0.25s ease
- No spring animations
- No floating/bouncing elements
- No Apple-style physics
- Fade in/out for modals and sheets
- Slide up for bottom sheets
- Instant navigation (no page transitions)
