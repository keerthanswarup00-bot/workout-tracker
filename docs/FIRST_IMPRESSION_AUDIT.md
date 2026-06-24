# IronLog First Impression Audit

**Date:** 2026-06-24
**Auditor:** Beta Polish Sprint
**Method:** First-time user simulates opening the app cold

---

## Within 10 Seconds

### What a new user sees
- **Today tab**: Greeting ("Good Morning ☀️" + "Athlete") + 4 stat cards (all showing "—")
- Nutrition/water widgets showing 0g protein, 0/3000ml — even on day one

### Problems
| # | Issue | Screen |
|---|-------|--------|
| 1 | No hero/welcome card. New user sees empty stats with no "start here" direction. | Today |
| 2 | "Athlete" as default name — impersonal for a fitness app | Today |
| 3 | Nutrition/water widgets show zero-value bars before user has ever logged food/water | Today |
| 4 | No onboarding reminder or quick-start path visible on Today | Today |
| 5 | No brand statement visible without scrolling | Today |

---

## Confusing Screens

| # | Issue | Screen |
|---|-------|--------|
| 6 | Progress page shows 8 empty sections ("Complete your first workout to see progress here") with no button to go start one | Progress |
| 7 | Coach page empty state has 3 cards describing what to do but none are clickable CTAs | Coach |
| 8 | "Build Workout" vs "Generate Workout" — subtle distinction not explained | Train |
| 9 | Nutrition widget on Today always shows even if never used — "0 / 2100 cal" is confusing on day one | Today |
| 10 | "Body Measurements" and "Progress Photos" sections always visible on Progress even when empty | Progress |

---

## Empty States

| # | Current Text | Problem | Screen |
|---|-------------|---------|--------|
| 11 | "Create Your First Workout" — good, has CTAs | OK but no explanation of *why* | Train |
| 12 | "Complete your first workout to see progress here." | No button, no link, dead-end text | Progress |
| 13 | "Complete a workout this week to see stats." | No CTA | Progress |
| 14 | "Complete workouts to see monthly stats." | No CTA | Progress |
| 15 | "Set personal records to see achievements here." | No CTA | Progress |
| 16 | "No measurements recorded yet." | Has button but needs value proposition | Progress |
| 17 | "No photos yet." | Has button but needs value proposition | Progress |
| 18 | "Welcome to Coach" — "Log your first workout to unlock coaching insights." | Not clickable | Coach |
| 19 | "No Training Yet" — "Complete your first workout..." | Not clickable | Coach |
| 20 | "No finished sessions yet." | Generic, no value prop | Train / Progress |

---

## Missing Explanations

| # | What's Missing | Screen |
|---|---------------|--------|
| 21 | No explanation of what the "Coach" tab does before user has data | Coach |
| 22 | No explanation of why to log water, food, or measurements | Today / Progress |
| 23 | No mention of the Learning Hub on first visit | All |
| 24 | No quick-start checklist or getting-started flow | Today |
| 25 | No brand tagline or mission shown on home screen | Today |

---

## Weak Messaging

| # | Current | Issue | Location |
|---|---------|-------|----------|
| 26 | "Athlete" | Generic, no personal connection | All tabs |
| 27 | "Have a great workout today." | Rotating messages are fine but generic | Today greeting |
| 28 | "IronLog" shown only in sidebar + Settings About | Brand under-represented | All |
| 29 | "Track. Lift. Progress." tagline hidden in Settings > About | Should be more visible | Settings |
| 30 | Coach greeting is functional, not inspiring | Coach | Coach hero |
| 31 | No consistent "Build Muscle. Lose Fat. Stay Consistent." messaging | Missing key brand value prop | All |

---

## Unclear Actions

| # | Action Required | Where |
|---|----------------|-------|
| 32 | "Tap to start" on workout card — starts what? | Today |
| 33 | "Set a goal" on goal card — opens Goal Center but user may not know | Today |
| 34 | "Log today" on weight card — opens weight log but no context | Today |
| 35 | Coach empty state tells user what to do but has no buttons | Coach |
| 36 | Progress page empty state tells user to complete first workout but has no "Start Workout" button | Progress |

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Confusing screens | 5 | High |
| Empty states | 10 | High |
| Missing explanations | 5 | Medium |
| Weak messaging | 6 | Medium |
| Unclear actions | 5 | High |
| **Total issues found** | **31** | |

### Key takeaway
The app assumes users will figure it out. There is no guiding hand for the first session. The Today screen is the most critical new-user touchpoint and currently does not communicate what IronLog is or what to do first.

### Priority fixes
1. Add hero welcome card to Today (brand + CTA)
2. Replace all dead-end empty states with actionable cards
3. Add quick-start guide for first 7 days
4. Improve coach page welcome + suggested actions
5. Add motivation system (streak + goal + recent achievement)
6. Update Coach empty state with action buttons
7. Hide nutrition/water widgets until first use
