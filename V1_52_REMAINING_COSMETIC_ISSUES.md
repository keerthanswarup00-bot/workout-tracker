# REMAINING COSMETIC ISSUES — IronLog V1.52

These issues are **deferred** — not blocking V1.x ship, but documented for V2.0.

## P3 Issues (Low Impact, Cosmetic)

### 1. Onboarding modal has no max-width
- **File**: index.html, `.ob-modal-card`
- **Issue**: Uses `position: relative` but no `max-width` constraint
- **Impact**: May stretch too wide on tablets
- **Fix**: Add `max-width: 420px`

### 2. Generate modal has no max-width
- **File**: index.html, `.gm-card`
- **Issue**: No max-width set
- **Impact**: May overflow on larger screens
- **Fix**: Add `max-width: 440px`

### 3. Muscle sheet radius inconsistent
- **File**: styles.css:2040
- **Issue**: `border-radius: 16px 16px 0 0` vs bottom-sheet-card `20px 20px 0 0`
- **Impact**: Visual inconsistency between sheets
- **Fix**: Change to `20px 20px 0 0`

### 4. Coach card title too small
- **File**: coach.css:130
- **Issue**: `.co-card-title` at 0.75rem (12px) — smaller than body text at 0.82rem
- **Status**: **FIXED in V1.52** (raised to 0.85rem)

### 5. Coach stat label too small
- **File**: coach.css:221
- **Issue**: `.co-stat-label` at 0.55rem (8.8px)
- **Status**: **FIXED in V1.52** (raised to 0.6rem)

### 6. Toggle track size inconsistency
- **File**: styles.css:3490 vs 3536
- **Issue**: `.sg-toggle-track` 40×24px vs `.ed-setup-toggle-track` 38×22px
- **Impact**: Visual inconsistency
- **Fix**: Standardize to 40×24px

### 7. Missing `:focus-visible` on core buttons
- **File**: styles.css:169-181
- **Issue**: `.home-qa-btn` lacks `:focus-visible`
- **Status**: `.btn-primary` and `.btn-secondary` **FIXED in V1.52**; `.home-qa-btn` remains
- **Fix**: Add `.home-qa-btn:focus-visible`

### 8. No `line-height` on h2-h4
- **File**: styles.css:3707-3709
- **Issue**: Only `h1` had explicit line-height
- **Status**: **FIXED in V1.52** (added `line-height: 1.3` to h2, h3, h4)

### 9. Scroll area bottom padding at 5rem (80px)
- **File**: styles.css
- **Issue**: Uses 5rem (80px) which is not on the spacing scale
- **Impact**: Minor — functions correctly for scroll clearance
- **Fix`: Could be 3rem (48px) when refactored

### 10. Inline styles in HTML modals
- **File**: index.html (multiple locations)
- **Issue**: Many modals use inline `style="...""` instead of classes
- **Impact**: Harder to maintain, override, or theme
- **Fix**: Move to CSS classes (106 inline style attributes across the file)

## P4 Issues (Trivial)

### 11. Coach `.co-nutri-info` has 0.05rem gap
- **File**: coach.css:382
- **Issue**: `gap: 0.05rem` (0.8px) — effectively no gap at all
- **Impact**: Labels may touch values
- **Fix**: Remove or set to 0.15rem

### 12. `.as-save` button uses `flex:1` instead of `width:100%`
- **File**: styles.css:3653
- **Issue**: `.es-edit-actions .as-save { flex:1 }` — depends on flex parent
- **Impact**: May not fill full width if parent layout changes

### 13. `.streak-pill` hardcoded `--orange`
- **File**: styles.css:96
- **Issue**: Uses `var(--orange)` directly — should work but depends on variable being set

## Summary
- **P3 issues**: 10
- **P4 issues**: 3
- **Total deferred**: 13
- **None block the V1.x ship decision**
