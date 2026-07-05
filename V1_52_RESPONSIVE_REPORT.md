# RESPONSIVE REPORT — IronLog V1.52

## Breakpoints Currently Defined

| Breakpoint | File | Purpose |
|---|---|---|
| `max-width: 360px` | styles.css | **NEW in V1.52** — smallest phones |
| `max-width: 400px` | styles.css | Muscle body view |
| `max-width: 480px` | styles.css | Hide topbar profile info |
| `max-width: 480px` | coach.css | Collapse grids to single column |
| `min-width: 768px` | styles.css | Show sidebar, hide bottom nav |
| `min-width: 768px` | coach.css | Expand grids for desktop |

## Width Coverage

| Device | Width | Status |
|---|---|---|
| iPhone SE | 375px | ✅ Covered by 360px fallback |
| iPhone SE (new) | 375px | ✅ Covered |
| iPhone Mini | 360px | ✅ Dedicated breakpoint |
| iPhone Pro | 390px | ✅ Default styles |
| iPhone Pro Max | 430px | ✅ Default styles |
| Galaxy S20 | 360px | ✅ Dedicated breakpoint |
| Pixel 5 | 393px | ✅ Default styles |
| iPad Mini | 768px | ✅ Desktop breakpoint |

## What 360px Breakpoint Does
- Bottom nav: `width: calc(100vw - 16px)`, tighter padding
- Nav tabs: smaller padding, 10px font, 18x18 icons
- Home dash: collapses to 2 columns
- Quick actions: collapses to 1 column
- Profile stats: collapses to 2 columns
- Coach stats: collapses to 2 columns (via existing 480px rule)
- Modal margins: 0.5rem on each side
- Bottom sheet: tighter horizontal padding

## What 480px Breakpoint Does
- Coach: collapses all multi-column grids to 1 column
- Topbar: hides profile info text (name + goal)

## What 768px Breakpoint Does
- Shows sidebar navigation (desktop layout)
- Hides bottom nav
- Expands coach grids back to multi-column
- Rest timer positioned differently

## Remaining Issues
1. No landscape-specific adjustments (orientation media queries)
2. No tablet-specific layout (between 481px-767px)
3. Some modals may be too wide on tablets with hardcoded `max-width: 360px`
4. Coach page at 480px has all grids collapsed — may be too aggressive for 480px screens
