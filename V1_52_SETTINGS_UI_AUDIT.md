# SETTINGS UI AUDIT — IronLog V1.52

## Layout
- `.settings-header`: flex row, back button + title, 0.75rem 1rem padding
- `.settings-scroll`: flex column, 0.5rem 0 2rem padding

## Group Sections (`.sg`)
- `.sg-label`: 0.65rem, 700 weight, uppercase, accent color
- `.sg-card`: flex row with avatar (44px) + body + chevron
- `.sg-card-body`: flex column, name (0.9rem, 700) + meta (0.7rem, secondary)
- **Verdict**: Clean. Cards have consistent 0.75rem padding.

## Toggle Items (`.sg-toggle`)
- **Fixed in V1.52**: Added `min-height: 48px`, `gap: 0.75rem`
- 40×24px toggle track with slide animation
- Track: `var(--border)` → `var(--accent)` when checked
- **Verdict**: Now has proper touch target and spacing.

## Radio Groups (`.sg-radio`)
- Cards with selection state (border + background)
- Radio dot (18px circle) with inner shadow when selected
- Title + description + rate display
- **Verdict**: Clean. Good visual feedback.

## Action Rows (`.sg-row`)
- 0.7rem 0.75rem padding, border-radius var(--radius-sm)
- Label + value + optional danger styling
- **Verdict**: OK. 0.82rem font size is readable.

## Stats (`.sg-stats`)
- 3-column grid with value + label
- Same pattern as profile stats but 3 columns instead of 4
- **Verdict**: OK.

## BMI Display (`.sg-bmi-bar`)
- 4px bar with colored fill
- Min/max labels in 0.55rem
- **Verdict**: OK.

## Issues Found
1. ✅ `.sg-toggle`: gap and min-height fixed in V1.52
2. Toggle track color uses `var(--border)` which may be low contrast in dark theme — consider `var(--surface-3)` instead
3. No section dividers between groups — relies on margin (0.75rem 1rem)
