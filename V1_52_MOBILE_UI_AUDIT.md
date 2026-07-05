# MOBILE UI AUDIT — IronLog V1.52

## Screen-by-Screen Review

### 1. TODAY (Home Dashboard)
- **Greeting**: OK. `.home-greeting-line` + `.home-name-line` render well. No overlap.
- **Quick Actions (home-qa-row)**: 2-column grid. At <360px collapses to 1 column. OK.
- **Workout Cards**: `.home-wo-card` with 0.75rem padding, 80px min-height. OK.
- **Dash Stats (home-dash-grid)**: 4 columns. At <360px collapses to 2 columns. OK.
- **Incomplete Banner**: Radius fixed to `var(--radius-sm)` in V1.52 polish. OK.
- **Nutrition Widget**: Inline styles, not ideal but functional. `mlOpenBtn` click handler fixed.
- **Water Widget**: OK.
- **Coach Buttons**: `.home-coach-btn` now has 48px min-height. OK.

### 2. WORKOUT (Sessions Panel)
- **Section Labels**: `.section-label` at 0.72rem, uppercase. OK.
- **Session Log**: OK.
- **PR Grid**: 4-column stats grid. OK.
- **Weekly Review / Monthly Report**: Card content areas. OK.
- **Adherence**: OK.

### 3. PROGRESS
- **Calendar**: OK.
- **Training Summary**: OK.
- **Recovery Status**: OK.
- **Goals**: OK.

### 4. COACH (Trainer Panel)
- See Coach UI section below.

### 5. PROFILE
- **Header**: Back button + title + edit CTA. OK.
- **Scroll**: `.profile-scroll` with 2rem bottom padding. OK.
- **Hero**: 72px avatar, name, badges, streak. OK.
- **Stats Grid**: 4-column grid. At <360px collapses to 2 columns.
- **Expandable Sections**: Accordion pattern with chevron. OK.
- **Health Items**: Clickable rows with colored dots. OK.
- **Completeness Bar**: OK.

### 6. SETTINGS
- **Header**: `.settings-header` with back + title. OK.
- **Group Cards (sg)**: `.sg-card` with avatar + body + chevron. OK.
- **Toggles (sg-toggle)**: Fixed to 48px min-height with 0.75rem gap. OK.
- **Radio Groups**: Cards with selection state. OK.
- **Danger Row**: Red text styling. OK.

### 7. ONBOARDING
- **Modal Card**: Uses `.ob-modal-card` with `position:relative` but no explicit max-width.
- **Steps**: Progress bar + step label. OK.
- **Skip Confirm**: Small modal (300px max-width). OK.

### 8. WORKOUT BUILDER
- **New Workout Screen**: Search + filter + exercise list + create bar. OK.
- **Generate Workout Modal**: `.gm-card` with step navigation. OK.

### 9. WORKOUT SESSION
- **Header**: Back + info + menu. OK.
- **Exercise List**: `.ws-exercises` with safe area padding. OK.
- **Actions**: Add exercise + finish buttons. OK.

### 10. EXERCISE DETAIL (ED)
- **Header**: Back + name. OK.
- **Tabs**: Sets / Analyze. OK.
- **Set List**: Table rows with checkmarks, weight, reps. OK.
- **Performance/Target Cards**: Conditional display. OK.
- **Quick Actions (qa-bar)**: Sticky at bottom. OK.

### 11. BOTTOM SHEETS
- **Add Set**: Number pickers for reps/weight. OK.
- **Edit Set**: Weight/reps editing + delete. OK.
- **New Workout**: Build / Generate / Cancel. OK.
- **Weight Log**: Stepper with save/cancel. OK.
- **Workout Actions**: Dynamic list. OK.
- **Goal Selector**: List of goals. OK.
- **Calendar Date**: Stats grid. OK.

### 12. DIALOGS / MODALS
- **Custom Exercise**: Input fields. OK.
- **Create/Edit Workout**: Inputs + exercise list. OK.
- **Weight Log Modal**: Input + entry list. OK.
- **Delete Data**: Confirmation. OK.
- **Warm-up/Cool Down**: Split into intro + timer. OK.
- **Exercise Detail**: Chart canvas. OK.
- **Load Program**: Textarea + preview. OK.
- **Builder Modal**: Selects + generate. OK.
- **Goal Editor**: Inputs + save/delete. OK.

## Issues Found
1. `.ob-modal-card` has no max-width — may stretch on tablets
2. `.gm-card` has no max-width — may overflow on larger screens
3. Various modals use inline `max-width: 360px` / `380px` / `340px` — inconsistent
4. `.muscle-tooltip` uses absolute positioning — may clip at viewport edges
