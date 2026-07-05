# IronLog Coach Engine — Architecture

## Overview

The Coach Engine is a modular, centralized computation layer that generates all personalized recommendations. Every formula, rule, and calculation lives in the `src/core/` directory — nothing is duplicated across UI components.

## Directory Structure

```
src/core/
  engine-types.js       — Constants, enums, magic numbers
  engine-calculators.js — Pure math functions (BMR, TDEE, protein, macros, etc.)
  engine-rules.js       — Decision logic (split selection, rep ranges, etc.)
  engine-validator.js   — Validation guardrails
  engine-coach.js       — Orchestrator: ties everything together
```

## Module Dependency Order

```
engine-types.js  (zero dependencies)
  ↓
engine-calculators.js  (depends on types)
engine-rules.js        (depends on types)
  ↓
engine-validator.js    (depends on types)
  ↓
engine-coach.js        (depends on all four)
```

## API

### `CoachEngine.generate(profile)`

The main entry point. Takes a user profile object, returns a complete recommendation result:

```js
profile = {
  name, age, gender, height, weight, targetWeight, bodyFat,
  goal, experience, trainingDays, activity, equipment, injuries,
  weightLog, sessions, ...
}
```

Returns:
```js
{
  valid: bool,
  body: { bmi, bodyFat, leanMass, bmiCategory },
  energy: { bmr, tdee, maintenance, target, goalModifier },
  nutrition: {
    protein: { low, high, recommended, referenceWeight, usingAdjustedWeight },
    macros: { protein: { grams, calories }, fat, carbs, fiber },
    water: { liters, ml, mlPerKg }
  },
  training: { maxDays, recommendedSplit, compoundRatio, exerciseCount, priorityMuscle, progression },
  progress: { weeklyChange, weightTrend, plateau, consistency, paceLabel },
  recovery: { score, needs, totalSets },
  validation: [{ field, message, severity }]
}
```

### Other entry points

- `CoachEngine.getNutritionPlan(profile)` — Just nutrition data + explanations
- `CoachEngine.getDailyBriefing(profile, todayData)` — Personalized daily coaching
- `CoachEngine.getWeeklyReview(profile, weekKey)` — Weekly progress report
- `CoachEngine.getProgressCheck(profile)` — Issues and tips
- `CoachEngine.getStrategy(profile)` — Condensed strategy overview
- `CoachEngine.getSplitRecommendation(goal, days, experience)` — Best split

## Calculator Modules

### BMR / TDEE
- **Primary**: Mifflin-St Jeor equation
- **Fallback (when body fat known)**: Katch-McArdle (uses lean body mass)
- **TDEE**: BMR × PAL (Physical Activity Level: 1.2–1.9)

### Protein
The old formula (`weight × 2.x`) was incorrect for overweight users:
- **150 kg × 2.2 = 330 g** ❌ (unrealistic)
- **New**: Uses adjusted body weight when BF > 25%
  - `refWeight = LBM + (total - LBM) × 0.5` (overweight)
  - `refWeight = LBM + (total - LBM) × 0.3` (obese)
- Factors in: goal, experience, activity level
- Caps at 280g absolute maximum

### Calories
- No more flat `weight × 28/30/34`
- Uses BMR × PAL as maintenance
- Then applies goal-specific modifier (-400, +300, etc.)
- **Stall resistance**: Weight loss rate > 1kg/wk → larger deficit; < 0.3 → smaller

### Macros
- Fat loss: 35P / 30F / 35C
- Muscle gain: 30P / 25F / 45C
- Endurance: 20P / 25F / 55C

### Water
- Base: 35 ml/kg
- Active: 40–45 ml/kg
- Capped at 5L, min 1.5L
- Endurance gets +5 ml/kg

## Rule Modules

| Rule | Function | Logic |
|---|---|---|
| Max training days | `getMaxTrainingDays()` | Beginner: 4, Intermediate: 6, Advanced: 7 |
| Split recommendation | `getRecommendedSplit()` | Scores splits based on goal × experience × days |
| Rep ranges | `getRepRange()` | Per goal × compound/isolation, Beginners use lower range |
| Rest times | `getRestSeconds()` | Strength: 3min compounds, Fat loss: 60s |
| Progression | `getProgressionScheme()` | Beginner: linear, Intermediate: double-progression, Advanced: periodization |
| Exercise count | `getExerciseCount()` | Per experience: Beginner 4-6, Advanced 6-10 |
| Compound ratio | `getCompoundRatio()` | Goal-specific: Strength 90% compound, Endurance 40% |

## Validation

All recommendations pass through `CoachValidator.validateAll()`:

- **Calories**: min 800, max 6000, diff from TDEE ≤ 1000
- **Protein**: min 30g, max 400g, max 3.5g/kg
- **Water**: min 0.5L, max 8L
- **Training days**: Never exceed experience limit
- **Sleep**: min 4h, recommended ≥ 6h
- **Goal rate**: Fat loss < 1.5 kg/wk, Muscle gain < 1 kg/wk

## How New Rules Are Added

1. Add any new constants to `engine-types.js`
2. Add the calculation to `engine-calculators.js` as a pure function
3. Add decision logic to `engine-rules.js`
4. Add validation to `engine-validator.js`
5. Wire it into `engine-coach.js` `generate()` result

No UI code changes needed — the `generate()` output contains everything.

## Integration with Legacy Code

The Coach Engine augments (does not replace) the existing architecture:
- `CoachEngine.getGoalType()` mirrors `GoalCenter.getGoalType()` as a fallback-safe accessor
- `CoachSystem` (daily coach, weekly review) now reads from `CoachEngine.generate()` when available
- `GoalCenter.getGoalStrategy()` uses CoachEngine for protein/calorie/water targets, falls back to old values
- Onboarding `obFinishSetup()` uses CoachEngine for initial targets
- `lhApplyBtn` (lesson apply) uses CoachEngine when available

## Design Principles

1. **No duplicated formulas** — Every calculation exists in exactly one place
2. **No magic numbers** — All values defined in `engine-types.js`
3. **Pure functions** — No side effects in calculators or rules
4. **Fallback chain** — If CoachEngine fails, old formulas still work
5. **Explainability** — Every recommendation includes context and rationale
6. **Validation guard** — No impossible recommendations reach the user
7. **Multi-variable** — Never uses a single input; always considers goal × experience × body comp × activity
