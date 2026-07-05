// ===== COACH ENGINE: CALCULATORS =====
// Pure functions — no side effects, no state access

const CoachCalculators = (() => {

  const T = typeof CoachEngineTypes !== "undefined" ? CoachEngineTypes : {};

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // ===== BODY COMPOSITION =====

  function estimateBodyFat(gender, age, bmi) {
    if (gender === "female") {
      return clamp(1.20 * bmi + 0.23 * age - 5.4, 14, 45);
    }
    return clamp(1.20 * bmi + 0.23 * age - 16.2, 6, 40);
  }

  function calcBMI(weightKg, heightCm) {
    if (!heightCm || !weightKg) return null;
    const h = heightCm / 100;
    return weightKg / (h * h);
  }

  function calcLeanMass(weightKg, bodyFatPct) {
    if (bodyFatPct == null) return null;
    return weightKg * (1 - bodyFatPct / 100);
  }

  function getBodyFatFromProfile(weightKg, heightCm, gender, age, bodyFatRaw) {
    if (bodyFatRaw != null && bodyFatRaw > 0 && bodyFatRaw < 70) {
      return bodyFatRaw;
    }
    const bmi = calcBMI(weightKg, heightCm);
    if (bmi && gender && age) {
      return estimateBodyFat(gender, age, bmi);
    }
    return null;
  }

  // ===== BMR / TDEE =====

  function calcBMR_MifflinStJeor(weightKg, heightCm, age, gender) {
    if (!weightKg || !heightCm || !age) return null;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === "female" ? base - 161 : base + 5;
  }

  function calcBMR_KatchMcArdle(leanMassKg) {
    if (!leanMassKg) return null;
    return 370 + 21.6 * leanMassKg;
  }

  function calcTDEE(bmr, activityLevel) {
    if (bmr == null) return null;
    const pal = T.PAL_VALUES && T.PAL_VALUES[activityLevel] ? T.PAL_VALUES[activityLevel] : 1.55;
    return Math.round(bmr * pal);
  }

  function estimateBMR(weightKg, heightCm, age, gender, bodyFatPct) {
    if (bodyFatPct != null && bodyFatPct > 0) {
      const lbm = calcLeanMass(weightKg, bodyFatPct);
      const km = calcBMR_KatchMcArdle(lbm);
      if (km != null) return km;
    }
    return calcBMR_MifflinStJeor(weightKg, heightCm, age, gender) || 1600;
  }

  function estimateTDEE(weightKg, heightCm, age, gender, activityLevel, bodyFatPct) {
    const bmr = estimateBMR(weightKg, heightCm, age, gender, bodyFatPct);
    return calcTDEE(bmr, activityLevel);
  }

  // ===== PROTEIN =====

  function calcProteinRange(weightKg, bodyFatPct, goal, experience, activityLevel, tdee) {
    const lbm = bodyFatPct != null ? calcLeanMass(weightKg, bodyFatPct) : null;
    const isOverweight = bodyFatPct != null && bodyFatPct > 25;
    const isObese = bodyFatPct != null && bodyFatPct > 32;

    let referenceWeight = weightKg;
    if (isObese && lbm) {
      referenceWeight = lbm + (weightKg - lbm) * 0.3;
    } else if (isOverweight && lbm) {
      referenceWeight = lbm + (weightKg - lbm) * 0.5;
    }

    const goalFactor = goal === "lose-fat" ? 2.0
      : goal === "build-muscle" ? 1.8
      : goal === "strength" ? 1.7
      : 1.6;

    const expFactor = experience === "Advanced" ? 1.1
      : experience === "Intermediate" ? 1.05
      : 1.0;

    const actFactor = activityLevel === "very-active" || activityLevel === "active" ? 1.1
      : activityLevel === "sedentary" ? 0.9
      : 1.0;

    const base = referenceWeight * goalFactor * expFactor * actFactor;

    let low = Math.round(base * 0.9);
    let high = Math.round(base * 1.1);

    const maxAbsolute = T.PROTEIN_FACTORS ? T.PROTEIN_FACTORS.MAX_ABSOLUTE : 280;
    high = Math.min(high, maxAbsolute);
    low = Math.min(low, high);

    return {
      low,
      high,
      recommended: Math.round((low + high) / 2),
      referenceWeight: Math.round(referenceWeight),
      usingAdjustedWeight: isOverweight,
    };
  }

  // ===== CALORIES =====

  function calcCalorieTarget(tdee, goal, weightLossRate) {
    if (tdee == null) return null;
    const mods = T.CALORIE_MODIFIERS && T.CALORIE_MODIFIERS[goal];
    if (!mods) return tdee;

    let adjustment = mods.default;
    if (goal === "lose-fat" && weightLossRate) {
      if (weightLossRate > 1) adjustment = mods.min;
      else if (weightLossRate < 0.3) adjustment = mods.max;
    }

    return Math.round(tdee + adjustment);
  }

  function calcMaintenanceRange(tdee) {
    if (tdee == null) return null;
    return { low: tdee - 100, high: tdee + 100, estimated: tdee };
  }

  // ===== MACROS =====

  function calcMacros(calories, goal, proteinGrams) {
    const splits = T.MACRO_SPLITS && T.MACRO_SPLITS[goal]
      ? T.MACRO_SPLITS[goal]
      : T.MACRO_SPLITS && T.MACRO_SPLITS.general;

    let pCal = proteinGrams * 4;
    let pPct = splits.protein;

    if (calories && pCal > calories * pPct) {
      pCal = calories * pPct;
    }

    const fCal = calories ? calories * splits.fat : 0;
    const cCal = calories ? calories * (1 - splits.protein - splits.fat) : 0;

    return {
      protein: { grams: Math.round(proteinGrams), calories: Math.round(pCal), pct: splits.protein },
      fat: { grams: Math.round(fCal / 9), calories: Math.round(fCal), pct: splits.fat },
      carbs: { grams: Math.round(cCal / 4), calories: Math.round(cCal), pct: 1 - splits.protein - splits.fat },
      fiber: { grams: splits.fiber },
    };
  }

  // ===== WATER =====

  function calcWaterTarget(weightKg, activityLevel, goal, isHotClimate) {
    let mlPerKg = T.WATER_FACTORS ? T.WATER_FACTORS.BASE_ML_PER_KG : 35;
    if (activityLevel === "active" || activityLevel === "very-active") {
      mlPerKg = T.WATER_FACTORS ? T.WATER_FACTORS.HIGH_ACTIVITY_ML_PER_KG : 45;
    } else if (activityLevel === "light" || activityLevel === "moderate") {
      mlPerKg = T.WATER_FACTORS ? T.WATER_FACTORS.ACTIVE_ML_PER_KG : 40;
    }
    if (goal === "endurance") mlPerKg = Math.max(mlPerKg, 45);
    if (isHotClimate) mlPerKg += 5;

    let liters = weightKg * mlPerKg / 1000;
    const maxL = T.WATER_FACTORS ? T.WATER_FACTORS.MAX_LITERS : 5;
    const minL = T.WATER_FACTORS ? T.WATER_FACTORS.MIN_LITERS : 1.5;
    liters = clamp(liters, minL, maxL);

    return { liters: Math.round(liters * 10) / 10, ml: Math.round(liters * 1000), mlPerKg };
  }

  // ===== VOLUME =====

  function calcWeeklyVolume(workouts) {
    if (!workouts || !workouts.length) return 0;
    let total = 0;
    for (const w of workouts) {
      if (w.exercises) {
        for (const ex of w.exercises) {
          if (ex.sets) {
            for (const s of ex.sets) {
              if (s.done) total += (Number(s.weight) || 0) * (Number(s.reps) || 0);
            }
          } else {
            total += (ex.sets || 3) * (Number(ex.reps) || 10);
          }
        }
      }
    }
    return total;
  }

  function calcTotalSets(workouts) {
    if (!workouts || !workouts.length) return 0;
    let total = 0;
    for (const w of workouts) {
      if (w.exercises) {
        for (const ex of w.exercises) {
          if (ex.sets) total += ex.sets.filter(s => s.done).length;
          else total += ex.sets || 3;
        }
      }
    }
    return total;
  }

  // ===== 1RM =====
  function calc1RM(weight, reps) {
    if (!weight || !reps) return null;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }

  function calcEstimatedMax(weight, reps) {
    return calc1RM(weight, reps);
  }

  // ===== STRENGTH =====

  function calcStrengthRatio(weight, exerciseName, gender) {
    const standards = {
      "Bench Press": { male: 1.2, female: 0.7 },
      "Squat": { male: 1.5, female: 1.0 },
      "Deadlift": { male: 2.0, female: 1.3 },
      "Overhead Press": { male: 0.7, female: 0.4 },
    };
    const s = standards[exerciseName];
    if (!s) return null;
    const bw = s[gender || "male"];
    return bw ? (weight / bw).toFixed(2) : null;
  }

  // ===== RECOVERY =====

  function calcRecoveryScore(sleepHours, stressLevel, weeklySets, experience) {
    const slp = clamp(sleepHours || 7, 4, 10) / 8;

    const stressMap = { low: 1, moderate: 0.7, high: 0.4, veryHigh: 0.2 };
    const str = stressMap[stressLevel] || 0.7;

    const volFactor = T.RECOVERY ? T.RECOVERY.HIGH_VOLUME_SETS : 22;
    const vol = 1 - clamp((weeklySets - 10) / (volFactor - 10), 0, 1) * 0.5;

    const expFactor = experience === "Advanced" ? 1.1
      : experience === "Intermediate" ? 1.0
      : 0.9;

    const score = (slp * 0.4 + str * 0.3 + vol * 0.3) * 100 * expFactor;
    return clamp(Math.round(score), 0, 100);
  }

  function calcRecoveryNeeds(recoveryScore) {
    if (recoveryScore >= 80) return { needsDeload: false, needsRestDay: false, advice: "Well recovered. Ready to train." };
    if (recoveryScore >= 60) return { needsDeload: false, needsRestDay: false, advice: "Moderate recovery. Maintain current load." };
    if (recoveryScore >= 40) return { needsDeload: false, needsRestDay: true, advice: "Consider an extra rest day this week." };
    if (recoveryScore >= 20) return { needsDeload: true, needsRestDay: true, advice: "Deload recommended. Reduce volume by 40% this week." };
    return { needsDeload: true, needsRestDay: true, advice: "High fatigue detected. Take 3-5 days low intensity activity." };
  }

  // ===== PROGRESS =====

  function calcWeightTrend(weightLog) {
    if (!weightLog || weightLog.length < 3) return null;
    const sorted = [...weightLog].sort((a, b) => new Date(a.date) - new Date(b.date));
    const recent = sorted.slice(-7);
    const vals = recent.map(e => e.weight).filter(w => w != null);
    if (vals.length < 3) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  }

  function calcWeeklyChange(weightLog) {
    if (!weightLog || weightLog.length < 2) return null;
    const sorted = [...weightLog].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0].weight;
    const weekAgo = sorted.find(e => {
      const days = (new Date(sorted[0].date) - new Date(e.date)) / 86400000;
      return days >= 5;
    });
    if (!weekAgo) return null;
    return Math.round((latest - weekAgo.weight) * 10) / 10;
  }

  function detectPlateau(weightLog, goal) {
    if (!weightLog || weightLog.length < 5) return { isPlateau: false };
    const sorted = [...weightLog].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sorted.slice(0, 5);
    if (recent.length < 3) return { isPlateau: false };
    const vals = recent.map(e => e.weight);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min;
    const daysSinceFirst = (new Date(recent[0].date) - new Date(recent[recent.length - 1].date)) / 86400000;
    const isPlateau = range < 0.5 && daysSinceFirst >= 14;
    const rate = goal === "lose-fat" ? 0.5 : goal === "build-muscle" ? 0.25 : 0;
    return {
      isPlateau,
      daysUnchanged: Math.round(daysSinceFirst),
      weightRange: Math.round(range * 100) / 100,
      stalled: isPlateau && rate > 0 && Math.abs(vals[0] - vals[vals.length - 1]) < rate * (daysSinceFirst / 7),
    };
  }

  function calcAdherence(completedSessions, targetSessions) {
    if (!targetSessions) return 1;
    return clamp(completedSessions / targetSessions, 0, 1);
  }

  // ===== TRAINING LOAD =====

  function calcExerciseScoreSets(exercise, goal, experience, isPriority, usedInCycle) {
    let sets = 3;
    if (experience === "Intermediate") sets = 4;
    if (experience === "Advanced") sets = 5;
    if (isPriority) sets += 2;
    if (usedInCycle) sets = Math.max(sets - 1, 2);

    const reps = T.REP_RANGES && T.REP_RANGES[goal]
      ? T.REP_RANGES[goal]
      : T.REP_RANGES && T.REP_RANGES.general;
    return {
      sets,
      minReps: exercise.isCompound ? reps.compound.min : reps.isolation.min,
      maxReps: exercise.isCompound ? reps.compound.max : reps.isolation.max,
    };
  }

  // ===== UTILITY =====

  function activityLabel(level) {
    const labels = {
      sedentary: "Sedentary (desk job, no exercise)",
      light: "Light (1-2 days/week)",
      moderate: "Moderate (3-5 days/week)",
      active: "Active (6-7 days/week)",
      "very-active": "Very Active (physical job + daily training)",
    };
    return labels[level] || "Moderate";
  }

  function goalLabel(goal) {
    return (T.GOAL_LABELS && T.GOAL_LABELS[goal]) || goal || "General Fitness";
  }

  return {
    clamp,
    estimateBodyFat,
    calcBMI,
    calcLeanMass,
    getBodyFatFromProfile,
    calcBMR_MifflinStJeor,
    calcBMR_KatchMcArdle,
    calcTDEE,
    estimateBMR,
    estimateTDEE,
    calcProteinRange,
    calcCalorieTarget,
    calcMaintenanceRange,
    calcMacros,
    calcWaterTarget,
    calcWeeklyVolume,
    calcTotalSets,
    calc1RM,
    calcEstimatedMax,
    calcStrengthRatio,
    calcRecoveryScore,
    calcRecoveryNeeds,
    calcWeightTrend,
    calcWeeklyChange,
    detectPlateau,
    calcAdherence,
    calcExerciseScoreSets,
    activityLabel,
    goalLabel,
  };
})();

if (typeof window !== "undefined") window.CoachCalculators = CoachCalculators;
