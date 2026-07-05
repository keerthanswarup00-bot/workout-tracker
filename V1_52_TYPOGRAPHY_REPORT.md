# TYPOGRAPHY REPORT — IronLog V1.52

## Defined Hierarchy (styles.css lines 3705-3711)

```
h1, .h1   → 32px / 2rem    | 800 weight | 1.1 line-height | -0.03em letter-spacing
h2, .h2   → 24px / 1.5rem  | 700 weight
h3, .h3   → 18px / 1.125rem| 700 weight
h4, .h4   → 16px / 1rem    | 600 weight
.body-secondary → 14px     | secondary color
.body-small     → 12px     | secondary color
```

## Font in Use
- **Plus Jakarta Sans** (500/600/700/800 weights)
- Loaded from Google Fonts via `<link>` in index.html

## Color Tokens
- `--text`: #e5e5e5 (primary text)
- `--text-secondary`: #525252 (secondary text, fixed in V1.51)

## Actual Usage Analysis

### Page Titles (≈1.3rem / 20-24px)
- `.home-name-line`: 1.5rem (24px), 800 weight ✓
- `.l1-title`: 28px, 800 weight ✓
- `.profile-hero-name`: 1.3rem (20.8px), 800 weight ✓
- `.co-hero-greeting`: 1.3rem, 800 weight ✓
- `.as-title`: 1.15rem (18.4px), 800 weight ✓

### Section Labels (≈0.65-0.75rem / 10-12px)
- `.section-label`: 0.72rem, 600 weight, uppercase ✓
- `.sg-label`: 0.65rem, 700 weight, uppercase, accent ✓
- `.home-section-label`: not explicitly defined (inherits)
- `.co-section-header`: 0.72rem, 700 weight, uppercase ✓

### Card Titles (≈0.82-0.9rem / 13-14px)
- `.wo-card-title`: 1rem (16px), 700 weight ✓
- `.co-card-title`: 0.75rem (12px), 700 weight — smaller than main app cards
- `.profile-card-title`: 0.85rem (13.6px), 700 weight ✓
- `.sg-card-name`: 0.9rem (14.4px), 700 weight ✓

### Body Text (≈0.78-0.85rem / 12.5-13.6px)
- `.co-card-body`: 0.82rem, secondary color ✓
- `.home-greeting-line`: 0.9rem, 500 weight ✓
- Various: 0.78rem-0.85rem across components

### Captions (≈0.58-0.72rem / 9-11.5px)
- `.home-dash-label`: 0.6rem, uppercase ✓
- `.sg-stat-lbl`: 0.6rem, uppercase ✓
- `.profile-stat-lbl`: 0.58rem, uppercase ✓
- `.co-stat-label`: 0.55rem, uppercase ✓

## Issues Found

### 1. `.co-card-title` is too small
- At 0.75rem (12px), it's smaller than card body text (0.82rem)
- Should match main app card titles at 0.85rem-0.9rem

### 2. Missing `h5` / `.h5` and `h6` / `.h6` definitions
- Many components use ad-hoc sizes instead of the type scale

### 3. Coach uses 0.55rem for labels
- `.co-stat-label` at 0.55rem (8.8px) is very small
- Minimum readable size on mobile is 11px (0.69rem)

### 4. No `line-height` on h2-h4
- **FIXED in V1.52**: Added `line-height: 1.3` to h2, h3, h4

### 5. Inline styles in modals
- Many modal headers use inline `font-size: 0.9rem` etc. instead of classes
- Increases maintenance burden

## Recommendations
1. Add `.h5` (14px / 0.875rem) and `.h6` (12px / 0.75rem) to the system
2. Increase `.co-card-title` to 0.85rem for consistency
3. Increase `.co-stat-label` to 0.6rem minimum
4. Add `line-height: 1.3` to all heading definitions
