# COMPONENT CONSISTENCY REPORT — IronLog V1.52

## Button Patterns

### Primary Buttons
| Component | Min-Height | Radius | Font | Color |
|---|---|---|---|---|
| `.btn-primary` | **48px** ✓ | `var(--radius-sm)` ✓ | 0.85rem, 600 ✓ | accent bg, black text ✓ |
| `.home-wo-open-btn` | **44px** ✓ | 999px | 0.72rem, 700 | accent bg, black text |
| `.ws-finish-btn` | inherited | inherited | inherited from `.btn-primary` | ✓ |
| `.qa-btn` (sticky) | 48px (coarse) ✓ | `var(--radius-sm)` ✓ | 0.78rem, 600 | surface bg, border |
| `.ed-ex-complete-btn` | 48px (coarse) ✓ | `var(--radius-sm)` | 0.78rem, 700 | accent bg |

### Secondary Buttons
| Component | Min-Height | Radius | Style |
|---|---|---|---|
| `.btn-secondary` | **48px** ✓ | `var(--radius-sm)` ✓ | surface bg + border ✓ |
| `.home-qa-btn.secondary` | 48px ✓ | `var(--radius-sm)` ✓ | surface bg + border ✓ |
| `.co-action-btn` | **48px** ✓ | `var(--radius-sm)` ✓ | surface bg + border ✓ |

### Icon Buttons
| Component | Size | Radius | Issue |
|---|---|---|---|
| `.btn-icon` | **44×44px** ✓ | 50% ✓ | Fixed in V1.52 (was 36×36) |
| `.as-btn` | **48×48px** ✓ | 50% ✓ | Already correct |
| `.ed-setup-btn` | **44×44px** ✓ | `var(--radius-sm)` ✓ | Fixed in V1.52 (was 36×32) |
| `.co-nav-item` | 44px min-height | `var(--radius-sm)` | OK |

## Card Patterns

### Radius Usage
- `var(--radius)` — used consistently for cards across main app ✓
- `var(--radius-sm)` — used for small cards, rows, inputs ✓
- `999px` — pills, badges, bottom nav, some tags ✓
- `20px` — bottom sheet top corners ✓
- `16px` — muscle sheet top corners (inconsistent with 20px)

### Padding Consistency
| Card Type | Padding | Consistent? |
|---|---|---|
| `.home-wo-card` | 0.75rem | ✓ |
| `.home-dash-card` | inherited from children | ✓ |
| `.wo-card` (gen) | not explicitly defined | Uses 0.75rem from home-wo-card |
| `.co-card` | 0.85rem | Slightly larger (0.85 vs 0.75) |
| `.profile-card` | 0.75rem | ✓ |
| `.sg-card` | 0.75rem | ✓ |
| `.ed-setup-card` | 0.85rem | Slightly larger |

### Shadow
- `.home-dash-card`: `0 1px 3px rgba(0,0,0,0.04)` — very subtle
- Most cards: no shadow, rely on border + surface contrast ✓

## Toggle/Checkbox Patterns

| Component | Track | Thumb | Anim |
|---|---|---|---|
| `.sg-toggle` | 40×24px, `var(--border)` bg | 20px circle, white | ✓ slide |
| `.ed-setup-toggle-track` | 38×22px, `var(--surface-2)` bg | 16px circle, secondary | ✓ slide |
| `.ed-set-check` | 22px circle | none | ✓ color change |

**Inconsistency**: Toggle tracks have different sizes (40×24 vs 38×22) and different thumb sizes (20px vs 16px).

## Bottom Sheet Patterns

| Sheet | Max-Width | Max-Height | Top Radius | Padding |
|---|---|---|---|---|
| `.bottom-sheet-card` | 420px | 80vh | 20px | 0.5rem 1.25rem calc(2rem + sa) |
| `.muscle-sheet-card` | 420px | 70vh | **20px** ✓ (FIXED in V1.52) | 0.5rem 1rem calc(1.5rem + sa) |

## Loading/Empty/Error States

| State | Main App | Coach |
|---|---|---|
| Loading | Skeleton screens | Spinner (28px, 3px border) |
| Empty | Various inline messages | Centered card with icon + title + desc + action |
| Error | Toast notifications | Red-tinted card with icon + text |

**Verdict**: Coach has more structured empty/error states. Main app uses ad-hoc patterns.

## Focus States
- ✅ `.btn-primary` — has `:focus-visible` ✓ (FIXED in V1.52)
- ✅ `.btn-secondary` — has `:focus-visible` ✓ (FIXED in V1.52)
- ✅ `.btn-icon` — has `:focus-visible` ✓
- ✅ `.nav-tab` — has `:focus-visible` ✓
- ❌ `.home-qa-btn` — no focus-visible
- ✅ `.qa-btn` — has `:focus-visible` ✓
- ✅ Coach interactive elements — consistently have `:focus-visible` ✓

**Remaining**: `.home-qa-btn` still missing `:focus-visible`.
