// ===== COACH ENGINE: ORCHESTRATOR =====
// Centralized recommendation engine — all app logic flows through here

const CoachCore = (() => {

  const C = typeof CoachCalculators !== "undefined" ? CoachCalculators : {};
  const R = typeof CoachRules !== "undefined" ? CoachRules : {};
  const V = typeof CoachValidator !== "undefined" ? CoachValidator : {};
  const T = typeof CoachEngineTypes !== "undefined" ? CoachEngineTypes : {};

  function buildProfile(state) {
    const u = state.user || {};
    return {
      name: u.name || "",
      age: u.age || null,
      gender: u.gender || null,
      height: u.height || null,
      weight: u.weight || null,
      targetWeight: u.targetWeight || state.weightGoal?.targetWeight || null,
      bodyFat: u.bodyMeasurements?.bodyFat || null,
      goal: R.getGoalType ? R.getGoalType() : (u.goal || state.bodyGoal || "general"),
      experience: u.experience || "Beginner",
      trainingDays: u.trainingDays || 3,
      activity: u.activity || "moderate",
      equipment: u.equipment || "full",
      injuries: u.injuries || [],
      dietPreference: u.dietPreference || "none",
      sleepHours: null,
      stressLevel: null,
      weightLog: state.weightLog || [],
      sessions: state.sessions || [],
      calorieTarget: state.calorieTarget || null,
      proteinGoal: state.proteinGoal || null,
      waterGoal: state.waterGoal || null,
    };
  }

  // ===== MAIN ENTRY POINT =====

  function generate(profile) {
    const validation = V.validateProfile ? V.validateProfile(profile) : { valid: true, issues: [] };
    if (!validation.valid && !validation.hasMinimum) {
      return {
        valid: false,
        issues: validation.issues,
        message: "Complete your profile to receive personalized recommendations.",
      };
    }

    const bodyFat = C.getBodyFatFromProfile
      ? C.getBodyFatFromProfile(profile.weight, profile.height, profile.gender, profile.age, profile.bodyFat)
      : profile.bodyFat || null;

    const bmi = C.calcBMI ? C.calcBMI(profile.weight, profile.height) : null;
    const leanMass = C.calcLeanMass ? C.calcLeanMass(profile.weight, bodyFat) : null;

    const bmr = C.estimateBMR
      ? C.estimateBMR(profile.weight, profile.height, profile.age, profile.gender, bodyFat)
      : null;
    const tdee = C.estimateTDEE
      ? C.estimateTDEE(profile.weight, profile.height, profile.age, profile.gender, profile.activity, bodyFat)
      : null;

    const proteinRange = C.calcProteinRange
      ? C.calcProteinRange(profile.weight, bodyFat, profile.goal, profile.experience, profile.activity, tdee)
      : { low: Math.round(profile.weight * 1.6), high: Math.round(profile.weight * 2.0), recommended: Math.round(profile.weight * 1.8), referenceWeight: profile.weight, usingAdjustedWeight: false };

    const calories = C.calcCalorieTarget ? C.calcCalorieTarget(tdee, profile.goal) : tdee;
    const maintenance = C.calcMaintenanceRange ? C.calcMaintenanceRange(tdee) : null;

    const macros = C.calcMacros ? C.calcMacros(calories, profile.goal, proteinRange.recommended) : null;

    const water = C.calcWaterTarget ? C.calcWaterTarget(profile.weight, profile.activity, profile.goal) : null;

    const weeklyChange = C.calcWeeklyChange ? C.calcWeeklyChange(profile.weightLog) : null;
    const weightTrend = C.calcWeightTrend ? C.calcWeightTrend(profile.weightLog) : null;
    const plateau = C.detectPlateau ? C.detectPlateau(profile.weightLog, profile.goal) : null;

    const totalSets = C.calcTotalSets ? C.calcTotalSets(profile.sessions) : 0;
    const recoveryScore = C.calcRecoveryScore ? C.calcRecoveryScore(profile.sleepHours, profile.stressLevel, totalSets, profile.experience) : 50;
    const recovery = C.calcRecoveryNeeds ? C.calcRecoveryNeeds(recoveryScore) : null;

    const maxDays = R.getMaxTrainingDays ? R.getMaxTrainingDays(profile.experience) : 7;
    const recommendedSplit = R.getRecommendedSplit ? R.getRecommendedSplit(profile.goal, profile.trainingDays, profile.experience) : null;
    const compoundRatio = R.getCompoundRatio ? R.getCompoundRatio(profile.goal) : null;
    const exerciseCount = R.getExerciseCount ? R.getExerciseCount(profile.experience) : null;
    const priorityMuscle = R.getPriorityMuscle ? R.getPriorityMuscle(profile.goal) : null;
    const consistency = R.getConsistencyLabel ? R.getConsistencyLabel(0.5) : null;
    const paceLabel = R.getGoalPaceLabel ? R.getGoalPaceLabel(weeklyChange, profile.goal) : null;
    const progression = R.getProgressionScheme ? R.getProgressionScheme(profile.goal, profile.experience) : null;

    const validationIssues = V.validateAll ? V.validateAll({
      calories,
      proteinRange,
      water,
      maintenance: tdee,
      weeklyChange,
    }, profile) : [];

    const result = {
      valid: true,

      body: {
        bmi: bmi ? Math.round(bmi * 10) / 10 : null,
        bodyFat: bodyFat ? Math.round(bodyFat) : null,
        leanMass: leanMass ? Math.round(leanMass) : null,
        bmiCategory: getBMICategory(bmi),
      },

      energy: {
        bmr: bmr ? Math.round(bmr) : null,
        tdee: tdee ? Math.round(tdee) : null,
        maintenance,
        target: calories,
        goalModifier: T.CALORIE_MODIFIERS && T.CALORIE_MODIFIERS[profile.goal]
          ? T.CALORIE_MODIFIERS[profile.goal].default : 0,
      },

      nutrition: {
        protein: proteinRange,
        macros,
        water,
      },

      training: {
        maxDays,
        recommendedSplit,
        compoundRatio,
        exerciseCount,
        priorityMuscle,
        progression,
      },

      progress: {
        weeklyChange,
        weightTrend,
        plateau,
        consistency,
        paceLabel,
      },

      recovery: {
        score: recoveryScore,
        needs: recovery,
        totalSets,
      },

      validation: validationIssues,
    };

    return result;
  }

  // ===== NUTRITION RECOMMENDATIONS =====

  function getNutritionPlan(profile) {
    const result = generate(profile);
    if (!result.valid) return null;
    return {
      calories: result.energy,
      protein: result.nutrition.protein,
      macros: result.nutrition.macros,
      water: result.nutrition.water,
      explanations: buildNutritionExplanations(result, profile),
    };
  }

  // ===== DAILY COACH =====

  function getDailyBriefing(profile, todayData) {
    const result = generate(profile);
    const sections = [];

    const greeting = getGreetingText(profile.name);
    sections.push({ type: "greeting", text: greeting });

    if (todayData?.workoutCompleted) {
      sections.push({ type: "completed", text: "✓ Workout completed" });
    } else if (todayData?.hasWorkoutToday) {
      sections.push({ type: "workout", text: `Today: ${todayData.workoutName || "Workout"}`, action: "start" });
    } else if (profile.trainingDays && profile.weightLog) {
      sections.push({ type: "rest", text: "Rest day — focus on recovery" });
    }

    if (todayData?.proteinMet) {
      sections.push({ type: "protein", text: "✓ Protein target achieved", status: "done" });
    } else if (todayData?.proteinIntake != null) {
      sections.push({ type: "protein", text: `⚠ Protein at ${Math.round(todayData.proteinIntake)}g today`, status: "warning" });
    }

    if (todayData?.waterPct != null && todayData.waterPct < 0.7) {
      sections.push({ type: "water", text: `⚠ Water intake at ${Math.round(todayData.waterPct * 100)}% target`, status: "warning" });
    }

    if (result.recovery?.needs?.advice) {
      sections.push({ type: "recovery", text: result.recovery.needs.advice, status: "info" });
    }

    if (result.progress?.plateau?.isPlateau) {
      sections.push({ type: "plateau", text: "Weight hasn't changed in 2+ weeks — consider adjusting calories", status: "warning" });
    }

    if (result.nutrition.protein?.recommended && result.nutrition.protein.recommended > 0) {
      sections.push({ type: "focus", text: `Aim for ${result.nutrition.protein.recommended}g protein today` });
    }

    if (result.nutrition.water?.liters) {
      sections.push({ type: "hydrate", text: `Drink ${result.nutrition.water.liters}L of water today` });
    }

    return { sections, meta: result };
  }

  // ===== WEEKLY REVIEW =====

  function getWeeklyReview(profile, weekKey) {
    const result = generate(profile);
    const weekSessions = profile.sessions.filter(s => {
      if (!s.dateKey) return false;
      return s.dateKey.startsWith(weekKey) || s.dateKey.includes(weekKey);
    });
    const completedSessions = weekSessions.filter(s => s.finishedAt);
    const totalVolume = C.calcWeeklyVolume ? C.calcWeeklyVolume(weekSessions) : 0;
    const adherence = profile.trainingDays
      ? C.calcAdherence ? C.calcAdherence(completedSessions.length, profile.trainingDays) : 0
      : 0;

    const items = [];

    items.push({ icon: "📊", label: "Workouts", value: `${completedSessions.length}/${profile.trainingDays || "—"} completed` });
    items.push({ icon: "📈", label: "Volume", value: `${totalVolume.toLocaleString()} kg total` });
    items.push({ icon: "🎯", label: "Consistency", value: R.getConsistencyLabel ? R.getConsistencyLabel(adherence) : `${Math.round(adherence * 100)}%` });

    if (result.progress?.weeklyChange != null) {
      const sign = result.progress.weeklyChange > 0 ? "+" : "";
      items.push({ icon: "⚖️", label: "Weight change", value: `${sign}${result.progress.weeklyChange.toFixed(1)} kg` });
    }

    items.push({ icon: "💪", label: "Recovery", value: `${result.recovery?.score || "—"}/100` });

    if (result.progress?.plateau?.isPlateau) {
      items.push({ icon: "⚠️", label: "Plateau detected", value: `${result.progress.plateau.daysUnchanged} days unchanged`, type: "warning" });
    }

    const recommendations = [];

    if (adherence < 0.7) {
      recommendations.push("Try reducing training days to improve consistency");
    }
    if (result.recovery?.score < 40) {
      recommendations.push("Focus on sleep and stress management this week");
    }
    if (result.progress?.plateau?.isPlateau && profile.goal === "lose-fat") {
      recommendations.push("Consider a 100-200 kcal reduction or increase NEAT");
    }
    if (result.progress?.plateau?.isPlateau && profile.goal === "build-muscle") {
      recommendations.push("Consider a 100-200 kcal surplus increase");
    }
    if (!recommendations.length) {
      recommendations.push("Great week — stay consistent and trust the process");
    }

    const achievements = [];
    if (adherence >= 0.9) achievements.push("Perfect workout adherence this week");
    if (result.recovery?.score >= 80) achievements.push("Excellent recovery management");

    return {
      weekKey,
      items,
      recommendations,
      achievements,
      adherencePercent: Math.round(adherence * 100),
      totalVolume,
      completedSessions: completedSessions.length,
      targetSessions: profile.trainingDays || completedSessions.length,
    };
  }

  // ===== PROGRESS CHECK =====

  function getProgressCheck(profile) {
    const result = generate(profile);
    const issues = [];

    if (result.validation?.length) {
      for (const v of result.validation) {
        issues.push({ type: "validation", severity: v.severity, text: v.message });
      }
    }

    if (result.progress?.plateau?.isPlateau) {
      issues.push({ type: "plateau", severity: "warning", text: `Weight plateau — ${result.progress.plateau.daysUnchanged} days unchanged` });
    }

    if (result.recovery?.score < 40) {
      issues.push({ type: "recovery", severity: "warning", text: "Recovery score is low — prioritize sleep and stress management" });
    }

    if (result.progress?.weeklyChange != null && profile.goal === "lose-fat" && result.progress.weeklyChange > 0) {
      issues.push({ type: "progress", severity: "warning", text: "Weight is increasing — review calorie adherence" });
    }

    if (result.progress?.weeklyChange != null && profile.goal === "build-muscle" && result.progress.weeklyChange < 0) {
      issues.push({ type: "progress", severity: "warning", text: "Weight is decreasing — increase calorie intake" });
    }

    const tips = [];

    if (result.nutrition.protein?.usingAdjustedWeight) {
      tips.push(`Protein based on estimated lean mass (${result.nutrition.protein.referenceWeight}kg ref weight) for realistic targets`);
    }

    if (result.energy?.target && result.energy?.tdee) {
      const diff = result.energy.target - result.energy.tdee;
      const sign = diff > 0 ? "surplus" : diff < 0 ? "deficit" : "maintenance";
      tips.push(`Calories at ${sign === "deficit" ? Math.abs(diff) + " kcal below" : sign === "surplus" ? diff + " kcal above" : ""} maintenance`);
    }

    return { issues, tips, score: result.recovery?.score || 50 };
  }

  // ===== SPLIT RECOMMENDATION =====

  function getSplitRecommendation(goal, days, experience) {
    if (!R.getRecommendedSplit) return "Full Body";
    return R.getRecommendedSplit(goal, days, experience);
  }

  // ===== STRATEGY OVERVIEW =====

  function getStrategy(profile) {
    const result = generate(profile);
    return {
      goal: profile.goal,
      label: C.goalLabel ? C.goalLabel(profile.goal) : profile.goal,
      calories: result.energy?.target,
      maintenance: result.energy?.tdee,
      protein: result.nutrition?.protein?.recommended || Math.round(profile.weight * 1.6),
      proteinRange: result.nutrition?.protein ? [result.nutrition.protein.low, result.nutrition.protein.high] : null,
      carbs: result.nutrition?.macros?.carbs?.grams || 0,
      fat: result.nutrition?.macros?.fat?.grams || 0,
      water: result.nutrition?.water?.liters || 2,
      split: result.training?.recommendedSplit || "Full Body",
      maxDays: result.training?.maxDays || 4,
      recoveryScore: result.recovery?.score || 50,
      priority: result.training?.priorityMuscle,
      bmi: result.body?.bmi,
      bodyFat: result.body?.bodyFat,
      explanation: buildStrategyExplanation(result, profile),
    };
  }

  function getProteinExplanation(result, profile) {
    const p = result.nutrition.protein;
    if (!p) return "";
    if (p.usingAdjustedWeight) {
      return `Based on your body composition, we adjusted the reference weight to ${p.referenceWeight}kg (instead of ${profile.weight}kg) to avoid unrealistic targets. The recommended range of ${p.low}–${p.high}g supports your goal while remaining practical.`;
    }
    const perKg = (p.recommended / p.referenceWeight).toFixed(1);
    return `${p.recommended}g/day (${perKg}g/kg body weight) supports your ${C.goalLabel ? C.goalLabel(profile.goal) : profile.goal} goal based on your training experience and activity level.`;
  }

  // ===== HELPERS =====

  function buildNutritionExplanations(result, profile) {
    const exps = [];
    if (result.energy?.target && result.energy?.tdee) {
      const diff = result.energy.target - result.energy.tdee;
      if (diff < 0) exps.push(`Moderate ${Math.abs(diff)} kcal deficit for sustainable fat loss`);
      else if (diff > 0) exps.push(`${diff} kcal surplus to support muscle growth`);
      else exps.push("Calories set to maintenance level");
    }
    if (result.nutrition.protein) {
      exps.push(getProteinExplanation(result, profile));
    }
    if (result.nutrition.water) {
      exps.push(`Water target of ${result.nutrition.water.liters}L supports hydration for your activity level`);
    }
    return exps;
  }

  function buildStrategyExplanation(result, profile) {
    const parts = [];
    if (result.energy?.target) {
      parts.push(`${result.energy.target} kcal`);
    }
    if (result.nutrition.protein) {
      parts.push(`${result.nutrition.protein.recommended}g protein`);
    }
    if (result.training?.recommendedSplit) {
      parts.push(`${result.training.recommendedSplit} split`);
    }
    return `Personalized ${profile.goal} plan: ${parts.join(" · ")}`;
  }

  function getGreetingText(name) {
    const hour = new Date().getHours();
    const time = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    return name ? `${time}, ${name} 👋` : `${time}!`;
  }

  function getBMICategory(bmi) {
    if (bmi == null) return null;
    if (bmi < 18.5) return "underweight";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "overweight";
    if (bmi < 35) return "obese-class-1";
    if (bmi < 40) return "obese-class-2";
    return "obese-class-3";
  }

  // ===== GOAL TYPE HELPER (mirrors GoalCenter.getGoalType) =====

  function getGoalType() {
    if (typeof GoalCenter !== "undefined" && GoalCenter.getGoalType) {
      return GoalCenter.getGoalType();
    }
    if (typeof state !== "undefined" && state.user && state.user.goal) {
      return state.user.goal;
    }
    if (typeof state !== "undefined" && state.bodyGoal) {
      const goalMap = { recomp: "general", "lose-fat": "lose-fat", "build-muscle": "build-muscle", strength: "strength", general: "general", endurance: "endurance" };
      return goalMap[state.bodyGoal] || "general";
    }
    return "general";
  }

  return {
    generate,
    getNutritionPlan,
    getDailyBriefing,
    getWeeklyReview,
    getProgressCheck,
    getSplitRecommendation,
    getStrategy,
    getGoalType,
    getProteinExplanation,
    buildProfile,
  };
})();

if (typeof window !== "undefined") window.CoachCore = CoachCore;
