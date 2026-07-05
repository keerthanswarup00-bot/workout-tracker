# SPACING REPORT — IronLog V1.52

## Spacing Scale Target
The design should use only: **4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48** (rem: 0.25 / 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2 / 2.5 / 3)

## Value Frequency Analysis

### On-Scale Values (recommended)
| rem | px | Usage Count |
|---|---|---|
| 0.25 | 4 | 30+ |
| 0.5 | 8 | 100+ |
| 0.75 | 12 | 100+ |
| 1 | 16 | 50+ |
| 1.25 | 20 | ~5 |
| 1.5 | 24 | ~20 |
| 2 | 32 | ~10 |
| 2.5 | 40 | ~3 |
| 3 | 48 | 0 |

### Off-Scale Values (non-standard)
| rem | px | Severity | Example Locations |
|---|---|---|---|
| 0.05 | 0.8 | Low | coach.css gap (nutri-info) |
| 0.1 | 1.6 | Low | Many gap/margin spots |
| 0.15 | 2.4 | Low | margin-top, padding-top |
| 0.2 | 3.2 | Low | Many padding/margin spots |
| 0.3 | 4.8 | Low | Many gap spots |
| 0.35 | 5.6 | Medium | 50+ usages — the most common off-scale value |
| 0.4 | 6.4 | Medium | 50+ usages |
| 0.45 | 7.2 | Medium | ~5 usages |
| 0.55 | 8.8 | Medium | ~3 usages |
| 0.6 | 9.6 | Low | ~20 usages |
| 0.65 | 10.4 | Medium | ~30 usages |
| 0.7 | 11.2 | Low | ~15 usages |
| 0.8 | 12.8 | Low | ~10 usages |
| 0.85 | 13.6 | Medium | ~20 usages |
| 0.9 | 14.4 | Low | ~5 usages |
| 5 | 80 | High | padding-bottom: 5rem (2 spots in scroll areas) |

## Gap Values Analysis
| rem | px | Count |
|---|---|---|
| 0.15 | 2.4 | ~5 |
| 0.2 | 3.2 | ~5 |
| 0.25 | 4 | ~5 |
| 0.3 | 4.8 | ~5 |
| 0.35 | 5.6 | ~50 |
| 0.4 | 6.4 | ~20 |
| 0.5 | 8 | ~30 |
| 0.6 | 9.6 | ~5 |
| 0.65 | 10.4 | ~5 |
| 0.75 | 12 | ~15 |
| 1 | 16 | ~5 |

## Key Issues

### 1. `.profile-section-row` padding at 0.35rem
- Too small for comfortable touch targets
- Should be 0.5rem

### 2. `padding-bottom: 5rem` (80px)
- Used in #sessionLog and #monthlyReportContent
- 80px is not on the spacing scale; could be 3rem (48px) or kept as-is for scroll clearance

### 3. 0.35rem gap is overused (~50 instances)
- 5.6px falls between 4px and 8px
- Should standardize to either 0.25rem (4px) or 0.5rem (8px)

### 4. 0.4rem padding/gap (~70 instances)
- 6.4px falls between 4px and 8px
- Should standardize to 0.5rem (8px) for consistency

### 5. 0.65rem padding (~30 instances)
- 10.4px falls between 8px and 12px
- Should standardize to 0.75rem (12px)

## Summary
- **On-scale**: ~60% of spacing values
- **Off-scale but acceptable (0.05-0.2rem)**: ~10% (fine-grain control for micro-spacing)
- **Off-scale refactor candidates (0.35, 0.4, 0.65, 0.85)**: ~30%
- **Complete refactor would touch ~200 declarations across both files**

**Recommendation**: Do not force a strict spacing scale refactor. The pre-existing values work visually. Flag for V2.0 if a design token system is implemented.
