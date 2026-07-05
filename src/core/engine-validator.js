// ===== COACH ENGINE: VALIDATOR =====
// Prevents impossible or unsafe recommendations

const CoachValidator = (() => {

  const T = typeof CoachEngineTypes !== "undefined" ? CoachEngineTypes : {};

  function validateProfile(profile) {
    const issues = [];
    if (!profile) return { valid: false, issues: ["No profile data"] };
    if (!profile.age) issues.push("Age is required");
    if (!profile.height) issues.push("Height is required");
    if (!profile.weight) issues.push("Weight is required");
    if (!profile.gender) issues.push("Gender is required");
    if (profile.weight && (profile.weight < 20 || profile.weight > 400)) {
      issues.push("Weight is outside valid range (20-400 kg)");
    }
    if (profile.height && (profile.height < 80 || profile.height > 280)) {
      issues.push("Height is outside valid range (80-280 cm)");
    }
    if (profile.age && (profile.age < 10 || profile.age > 120)) {
      issues.push("Age is outside valid range (10-120)");
    }
    return {
      valid: issues.length === 0,
      issues,
      hasMinimum: !!(profile.weight && profile.height && profile.age && profile.gender),
    };
  }

  function validateCalories(calories, tdee) {
    const issues = [];
    if (calories == null) return { valid: false, issues: ["No calorie target"] };
    if (calories < 800) issues.push("Calories below minimum (800 kcal) — unsafe");
    if (calories > 6000) issues.push("Calories above maximum (6000 kcal) — unrealistic");
    if (tdee && Math.abs(calories - tdee) > 1000) {
      issues.push("Calorie adjustment exceeds 1000 from maintenance — excessive");
    }
    return { valid: issues.length === 0, issues };
  }

  function validateProtein(proteinGrams, weightKg, bodyFatPct) {
    const issues = [];
    if (proteinGrams == null) return { valid: false, issues: ["No protein target"] };
    if (proteinGrams < 30) issues.push("Protein below minimum (30g) — insufficient");
    if (proteinGrams > 400) issues.push("Protein above maximum (400g) — excessive");
    if (weightKg && proteinGrams > weightKg * 3.5) {
      issues.push(`Protein exceeds 3.5g/kg (${(proteinGrams / weightKg).toFixed(1)}g/kg) — excessive`);
    }
    return { valid: issues.length === 0, issues };
  }

  function validateWater(liters, weightKg) {
    const issues = [];
    if (liters == null) return { valid: false, issues: ["No water target"] };
    if (liters < 0.5) issues.push("Water below minimum (0.5L) — unsafe");
    if (liters > 8) issues.push("Water above maximum (8L) — excessive");
    if (weightKg && liters < weightKg * 0.015) {
      issues.push("Water target is very low for body weight");
    }
    return { valid: issues.length === 0, issues };
  }

  function validateTrainingDays(days, experience) {
    const issues = [];
    if (days == null) return { valid: false, issues: ["No training days"] };
    if (days < 2) issues.push("Minimum 2 training days recommended");
    const maxDays = experience === "Beginner" ? 4
      : experience === "Intermediate" ? 6
      : 7;
    if (days > maxDays) {
      issues.push(`${days} days exceeds max of ${maxDays} for ${experience} level`);
    }
    return { valid: issues.length === 0, issues };
  }

  function validateWorkoutDuration(minutes) {
    const issues = [];
    if (minutes == null) return { valid: false, issues: ["No duration set"] };
    if (minutes < 15) issues.push("Duration below 15 minutes — too short for effective workout");
    if (minutes > 180) issues.push("Duration above 180 minutes — excessive for a single session");
    return { valid: issues.length === 0, issues };
  }

  function validateExerciseSelection(exercises, equipment, limitations) {
    const issues = [];
    if (!exercises || !exercises.length) return { valid: false, issues: ["No exercises selected"] };
    if (equipment === "none") {
      const hasBodyweight = exercises.some(e =>
        (e.equipment || "").toLowerCase() === "bodyweight"
      );
      if (!hasBodyweight) issues.push("No bodyweight exercises available for equipment-free training");
    }
    if (limitations && limitations.includes("knee")) {
      const hasHighImpact = exercises.some(e => e.avoidKnee);
      if (hasHighImpact) issues.push("Some exercises may aggravate knee limitations");
    }
    return { valid: issues.length === 0, issues };
  }

  function validateSleep(hours) {
    if (hours == null) return { valid: false, issues: ["No sleep data"] };
    const issues = [];
    if (hours < 4) issues.push("Sleep below 4 hours — critical for recovery");
    if (hours < 6) issues.push("Sleep below 6 hours — may impair recovery");
    if (hours > 12) issues.push("Sleep above 12 hours — may indicate health issue");
    return { valid: issues.length === 0, issues };
  }

  function validateGoalRate(weeklyChange, goal) {
    const issues = [];
    if (weeklyChange == null) return { valid: true, issues: [] };
    if (goal === "lose-fat" && weeklyChange < -1.5) {
      issues.push("Weight loss over 1.5 kg/week is aggressive — consider slower rate");
    }
    if (goal === "build-muscle" && weeklyChange > 1) {
      issues.push("Weight gain over 1 kg/week may include excess fat");
    }
    return { valid: issues.length === 0, issues };
  }

  function validateRecovery(recoveryScore, weeklySets, experience) {
    const issues = [];
    if (recoveryScore == null) return { valid: true, issues: [] };
    if (recoveryScore < 20 && weeklySets > 15) {
      issues.push("Critical recovery need — reduce volume significantly");
    }
    if (recoveryScore < 40 && experience === "Beginner" && weeklySets > 12) {
      issues.push("Recovery compromised — beginner volume too high");
    }
    return { valid: issues.length === 0, issues };
  }

  function validateAll(recommendations, profile) {
    const all = [];
    if (!recommendations) return all;

    all.push(...validateCalories(recommendations.calories, recommendations.maintenance).issues.map(i =>
      ({ field: "calories", message: i, severity: "warning" })
    ));

    all.push(...validateProtein(recommendations.proteinRange?.recommended, profile?.weight, profile?.bodyFat).issues.map(i =>
      ({ field: "protein", message: i, severity: "warning" })
    ));

    all.push(...validateWater(recommendations.water?.liters, profile?.weight).issues.map(i =>
      ({ field: "water", message: i, severity: "warning" })
    ));

    if (profile?.trainingDays) {
      all.push(...validateTrainingDays(profile.trainingDays, profile.experience).issues.map(i =>
        ({ field: "training", message: i, severity: "warning" })
      ));
    }

    all.push(...validateGoalRate(recommendations.weeklyChange, profile?.goal).issues.map(i =>
      ({ field: "progress", message: i, severity: "info" })
    ));

    return all;
  }

  return {
    validateProfile,
    validateCalories,
    validateProtein,
    validateWater,
    validateTrainingDays,
    validateWorkoutDuration,
    validateExerciseSelection,
    validateSleep,
    validateGoalRate,
    validateRecovery,
    validateAll,
  };
})();

if (typeof window !== "undefined") window.CoachValidator = CoachValidator;
