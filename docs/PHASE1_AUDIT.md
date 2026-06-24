# Phase 1 — Full Codebase Audit

**Date:** 2026-06-23
**Branch:** phase-1-beta-hardening
**Commit:** fd7387f

---

## Route Map

### Tab Routes (activateTab)

| Tab ID | Display Name | Handler | Status |
|--------|-------------|---------|--------|
| `today` | Today | `renderTodayTab()` | Active |
| `sets` | Train | `renderSetsPanel()` | Active |
| `progress` | Progress | `renderProgressPage()` | Active |
| `trainer` | Coach | `renderTrainerTab()` | Active |
| `settings` | Settings | `renderSettings()` | Active |

### Screen Routes (showScreen)

| Screen ID | Parent Tab | Handler | Status |
|-----------|-----------|---------|--------|
| `screen-home` | sets | render workout cards | Active |
| `screen-wo-details` | sets | render workout detail | Active |
| `screen-new-workout` | sets | workout builder | Active |
| `screen-ws` | sets | `renderWorkoutSession()` | Active |
| `screen-ed` | sets | `renderExerciseDetail()` | Active |
| `screen-ex-library` | sets | exercise library | Active |
| `screen-exercise-analytics` | sets | analytics view | Active |
| `screen-settings` | sets | `renderSettings()` | Active |

### Trainer Sub-Screen Routes (showTrainerScreen)

| Screen ID | Handler | Status |
|-----------|---------|--------|
| `home` | `renderTrainerTab()` | Active |
| `problems` | `renderProblemList()` | Active |
| `detail` | `return;` (no-op) | **DEAD** |
| `learning` | `renderLearningHub()` | Active |
| `learning-category` | `renderLessonCategory()` | Active |
| `ee` | `renderExerciseEncyclopedia()` | Active |
| `ee-detail` | `return;` (no-op) | **DEAD** |
| `goal-center` | `renderGoalCenter()` | Active |
| `create-goal` | `renderCreateGoalFlow()` | Active |
| `weight-intelligence` | `renderWeightIntelligence()` | Active |
| `readiness` | `renderReadinessPage()` | Active |
| `weekly-report` | `renderWeeklyReportPage()` | Active |
| `monthly-report` | `renderMonthlyReportPage()` | Active |
| `report-history` | `renderReportHistory()` | Active |
| `challenges` | `renderChallengesPage()` | Active |
| `achievements` | `renderMilestonesPage()` | Active |
| `streaks` | `renderStreaksPage()` | Active |
| `command-center` | `renderCoachCommandCenter()` | Active |
| `program-review` | `renderProgramReview()` | Active |

---

## Feature Map

| # | Feature | Status | File(s) | Lines of Code |
|---|---------|--------|---------|--------------|
| 1 | Workout Tracking | Working | script.js | ~2300 |
| 2 | Exercise Library | Working | script.js | ~668 |
| 3 | Exercise Search | Working | script.js | ~80 |
| 4 | Workout Builder | Working | script.js | ~400 |
| 5 | Workout Generator | Working | script.js | ~500 |
| 6 | Workout Templates | Working | script.js | ~50 |
| 7 | Goal Center | Working | goal-center.js | ~820 |
| 8 | Coach | Working | coach-engine.js | ~1130 |
| 9 | Today Dashboard | Working | script.js | ~400 |
| 10 | Progress Charts | Working | script.js | ~600 |
| 11 | Weight Tracking | Working | script.js | ~300 |
| 12 | Challenges | Working | cas-engine.js | ~620 |
| 13 | Achievements | Working | cas-engine.js | ~200 |
| 14 | Learning Hub | Working | lesson-database.js, script.js | ~2900 |
| 15 | Exercise Encyclopedia | Working | script.js | ~500 |
| 16 | Problem Solver | Working | problem-database.js, script.js | ~1800 |
| 17 | Recovery | Working | adaptive-engine.js | ~540 |
| 18 | Reports | Working | script.js | ~300 |
| 19 | Program Review | Working | program-review-engine.js | ~820 |
| 20 | Navigation | Working | script.js | ~100 |
| 21 | Settings | Working | script.js | ~400 |
| 22 | Profile | Working | script.js | ~200 |
| 23 | PR Tracking | Working | prs.js | ~190 |
| 24 | PWA / Offline | Working | sw.js, manifest.json | ~60 |
| 25 | Rest Timer | Working | script.js, rest-timer.css | ~150 |
| 26 | Warmup Generation | Working | script.js | ~200 |
| 27 | Export/Import | Working | script.js | ~120 |
| 28 | Onboarding | Working | script.js | ~500 |
| 29 | Nutrition | **Partial** | script.js | ~100 (storage only) |
| 30 | Water Tracking | **Partial** | script.js | ~50 (storage only) |
| 31 | Body Measurements | **Partial** | script.js | ~10 (state keys only) |
| 32 | Progress Photos | **Partial** | script.js | ~10 (state keys only) |
| 33 | Body Map SVG | **Unused** | body-map-svg.js | ~320 (never referenced) |

---

## Dead Components

| Component | File | Size | Reason |
|-----------|------|------|--------|
| Body Map SVG | src/js/body-map-svg.js | 12 KB (320 lines) | `BODY_MAP_SVG` never referenced by any other file; not loaded in HTML; not in SW cache |
| Typography utility classes | styles.css (removed) | ~500 B | Removed in Phase 9 — `.text-page-title`, `.text-body`, etc. |
| `.body-view`, `.body-secondary`, `.body-small` | styles.css (removed) | ~630 B | Removed in Phase 9 |
| Dead event listeners | script.js (removed) | ~30 lines | Removed in Phase 9 — `.coach-score-card`, `.challenge-card`, `.win-card`, `.insight-card` |

---

## Unused Files

| File | Size | Reason |
|------|------|--------|
| src/js/body-map-svg.js | 12 KB | `BODY_MAP_SVG` never referenced anywhere |

### Previously Removed Files (from consolidation phases)

| File | Size | Reason for Removal |
|------|------|--------------------|
| src/js/exercise-database.js | 739 lines | Merged into `enrichExerciseLib()` in Phase 7 |
| src/js/onboarding-engine.js | 125 lines | Inlined into main state in Phase 8 |
| workout-tracker-v2/ | Full directory | Duplicate project, backed up and deleted in Phase 2 |

---

## Unused State Keys

| State Key | Location | Status |
|-----------|----------|--------|
| `state.progressPhotos` | script.js state | **Dead key** — stored but never read by any UI |
| `state.bodyMeasurements` | script.js state | **Dead key** — stored but never read by any UI |
| `state.firstWorkoutDone` | script.js state (line 1319) | Stored but **never meaningfully read** — the first7Days field has superseded this |
| `state.warmupStyle` | script.js state | Stored, but value is hardcoded to "simple" and never toggled via UI |
| `state.compactMode` | script.js state | Allowed in import but no toggle exists in current settings UI |
| `state.autoSummary` | script.js state | Setting exists but no auto-summary feature implemented |
| `state.autoCooldown` | script.js state | Setting exists but no cooldown UI |
| `state.weeklyReview` | script.js state | Setting exists but no review shows/hides trigger |
| `state.showTomorrowPreview` | script.js state | Setting stored but not referenced in rendering |
| `state.showRecoveryAdvice` | script.js state | Setting stored but not referenced in rendering |
| `state.showWorkoutProgress` | script.js state | Setting stored but not referenced in rendering |
| `state.recoveryAnalysis` | script.js state | Setting stored but not referenced in rendering |
| `state.screenAwake` | script.js state | Setting stored but never toggled via UI |
| `state.nutritionReminder` | script.js state | Setting stored but no reminder system implemented |
| `state.weightReminder` | script.js state | Setting stored but no reminder system implemented |

---

## Unused Assets

| Asset | Location | Status |
|-------|----------|--------|
| favicon.svg | src/assets/icons/favicon.svg | Used — linked in index.html |
| No other image/icon assets | — | All icons are inline SVG in HTML |

---

## Bundle Contributors

### JavaScript Files (loaded by index.html)

| File | Size (approx) | % of JS Bundle |
|------|--------------|----------------|
| script.js | ~587 KB | 67% |
| problem-database.js | ~113 KB | 13% |
| lesson-database.js | ~74 KB | 8% |
| coach-engine.js | ~51 KB | 6% |
| program-review-engine.js | ~32 KB | 4% |
| goal-center.js | ~28 KB | 3% |
| cas-engine.js | ~27 KB | 3% |
| adaptive-engine.js | ~22 KB | 2% |
| body-map-svg.js | ~12 KB | 1% (UNUSED) |
| prs.js | ~7 KB | <1% |
| **Total JS** | **~953 KB** | |

### CSS

| File | Size (approx) |
|------|--------------|
| styles.css | ~233 KB |
| **Total CSS** | **~233 KB** |

### External

| Resource | Size (approx) |
|----------|--------------|
| Chart.js CDN | ~200 KB |
| Google Fonts | ~30 KB |
| **Total External** | **~230 KB** |

### Total Bundle: ~1.4 MB uncompressed

---

## Large Components

| Component | File | Lines | % of script.js |
|-----------|------|-------|---------------|
| Exercise library definitions | script.js:~632-1300 | ~668 | 5% |
| renderTrainerTab + sub-screens | script.js:5180-6610 | ~1430 | 12% |
| Workout session + exercise detail | script.js:3043-3884 | ~841 | 7% |
| Progress page + sub-views | script.js:4999-5154 | ~155 | 1% |
| Settings + event handlers | script.js:2059-2196, 10620-10854 | ~570 | 5% |
| Onboarding flow | script.js:8968-9448 | ~480 | 4% |
| Goal Center rendering | script.js:7026-7237 | ~211 | 2% |

---

## Performance Bottlenecks

| Bottleneck | Impact | Recommendation |
|-----------|--------|---------------|
| No code splitting | All JS must load before app is interactive | Split by tab (Today, Workout, Coach, Progress) |
| No lazy loading | All features loaded upfront even if unused | Defer Coach engine, Learning Hub, Problem DB |
| Single monolithic script.js (587 KB) | Blocks parsing and execution | Modularize into separate files loaded on demand |
| Chart.js loaded upfront | 200 KB loaded even if user never views charts | Lazy load via dynamic `<script>` injection |
| No minification | ~40% larger than necessary | Minify all JS and CSS |
| No gzip/Brotli | Transfer size equals file size | Enable server compression |
| All 10 JS files loaded synchronously | Sequential loading delays interactivity | Use `<script defer>` or dynamic imports |
| Google Fonts render-blocking | FOUC and delayed first paint | Preload or inline critical font CSS |

---

## Summary

**Total source code:** ~1.6 MB (JS + CSS + HTML)
**Effective bundle:** ~1.4 MB uncompressed
**Unused code:** ~12 KB (body-map-svg.js)
**Dead routes:** 2 (`detail`, `ee-detail` in showTrainerScreen)
**Unused state keys:** 14
**Dead components:** 1 (Body Map SVG)
**Unused files:** 1
