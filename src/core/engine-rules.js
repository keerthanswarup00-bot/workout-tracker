// ===== COACH ENGINE: RULES & POLICIES =====
// Decision logic — what to recommend based on context

const CoachRules = (() => {

  const T = typeof CoachEngineTypes !== "undefined" ? CoachEngineTypes : {};

  function isValidProfile(profile) {
    return profile && profile.weight && profile.height && profile.age && profile.gender;
  }

  function getMaxTrainingDays(experience) {
    if (experience === "Beginner") return 4;
    if (experience === "Intermediate") return 6;
    return 7;
  }

  function getRecommendedSplit(goal, days, experience) {
    const splits = buildSplitScores(goal, experience);

    if (days <= 3) return T.SPLITS ? T.SPLITS.FULL_BODY : "Full Body";
    if (days === 4) return T.SPLITS ? T.SPLITS.UPPER_LOWER : "Upper Lower";

    const best = splits.sort((a, b) => b.score - a.score);
    if (days >= 5) {
      const ppl = best.find(s => s.name === "Push Pull Legs");
      if (ppl && ppl.score >= 75) return ppl.name;
    }
    return best[0].name;
  }

  function buildSplitScores(goal, experience) {
    const scores = {
      "Push Pull Legs": { "lose-fat": 72, "build-muscle": 95, strength: 88, endurance: 68, general: 76 },
      "Upper Lower": { "lose-fat": 78, "build-muscle": 85, strength: 93, endurance: 72, general: 82 },
      "Full Body": { "lose-fat": 92, "build-muscle": 65, strength: 70, endurance: 88, general: 90 },
    };

    const expAdj = experience === "Advanced" ? 1.1
      : experience === "Intermediate" ? 1.0
      : 0.9;

    return Object.entries(scores).map(([name, gs]) => ({
      name,
      score: Math.round((gs[goal] || 70) * expAdj),
    }));
  }

  function getAllowedExercises(equipment) {
    const equip = (equipment || "full").toLowerCase();
    if (equip === "none") return ["bodyweight", "core", "calisthenics"];
    if (equip === "minimal") return ["bodyweight", "dumbbell", "band", "core"];
    if (equip === "home") return ["bodyweight", "dumbbell", "barbell", "band", "kettlebell", "core"];
    return ["bodyweight", "dumbbell", "barbell", "machine", "cable", "band", "kettlebell", "core"];
  }

  function isExerciseAllowed(exercise, equipment, limitations) {
    const allowedTypes = getAllowedExercises(equipment);
    if (exercise.equipment && !allowedTypes.includes(exercise.equipment.toLowerCase())) return false;
    if (limitations && limitations.length) {
      const exMuscles = (exercise.primaryMuscles || []).concat(exercise.secondaryMuscles || []);
      for (const lim of limitations) {
        if (lim === "knee" && exercise.avoidKnee) return false;
        if (lim === "back" && exercise.avoidBack) return false;
        if (lim === "shoulder" && exercise.avoidShoulder) return false;
      }
    }
    return true;
  }

  function getRepRange(goal, isCompound, experience) {
    const ranges = T.REP_RANGES && T.REP_RANGES[goal]
      ? T.REP_RANGES[goal]
      : T.REP_RANGES && T.REP_RANGES.general;
    const r = isCompound ? ranges.compound : ranges.isolation;
    if (experience === "Beginner") {
      return { min: r.min, max: Math.round((r.min + r.max) / 2) };
    }
    return r;
  }

  function getRestSeconds(goal, isCompound) {
    const rests = T.REST_SECONDS && T.REST_SECONDS[goal]
      ? T.REST_SECONDS[goal]
      : T.REST_SECONDS && T.REST_SECONDS.general;
    return isCompound ? rests.compound : rests.isolation;
  }

  function getWarmupSets(workingWeight, style) {
    if (style === "advanced") {
      return [
        { weight: Math.round(workingWeight * 0.4), reps: 8 },
        { weight: Math.round(workingWeight * 0.6), reps: 5 },
        { weight: Math.round(workingWeight * 0.8), reps: 3 },
        { weight: Math.round(workingWeight * 0.9), reps: 1 },
      ];
    }
    return [
      { weight: Math.round(workingWeight * 0.5), reps: 8 },
      { weight: Math.round(workingWeight * 0.75), reps: 5 },
    ];
  }

  function getProgressionScheme(goal, experience) {
    if (experience === "Beginner") {
      return { method: "linear", weightJump: 2.5, repTarget: 2 };
    }
    if (experience === "Intermediate") {
      if (goal === "strength") return { method: "double-progression", weightJump: 2.5, repTarget: 2 };
      return { method: "double-progression", weightJump: 2.5, repTarget: 3 };
    }
    return { method: "periodization", weightJump: 2.5, repTarget: 1 };
  }

  function getExerciseCount(experience) {
    const counts = T.EXERCISE_COUNTS && T.EXERCISE_COUNTS[experience]
      ? T.EXERCISE_COUNTS[experience]
      : { min: 4, max: 6 };
    return counts;
  }

  function getCompoundRatio(goal) {
    const ratios = {
      "lose-fat": { compound: 0.8, isolation: 0.2, conditioning: 0 },
      "build-muscle": { compound: 0.6, isolation: 0.4, conditioning: 0 },
      strength: { compound: 0.9, isolation: 0.1, conditioning: 0 },
      endurance: { compound: 0.4, isolation: 0, conditioning: 0.6 },
      general: { compound: 0.5, isolation: 0.3, conditioning: 0.2 },
    };
    return ratios[goal] || ratios.general;
  }

  function getVolumeForExperience(experience, isCompound) {
    const ranges = T.VOLUME_RANGES && T.VOLUME_RANGES[experience]
      ? T.VOLUME_RANGES[experience]
      : T.VOLUME_RANGES && T.VOLUME_RANGES.Beginner;
    const r = isCompound ? ranges.compound : ranges.isolation;
    return r;
  }

  function getGoalCalorieModifier(goal, rateOfProgress) {
    const mods = T.CALORIE_MODIFIERS && T.CALORIE_MODIFIERS[goal];
    if (!mods) return 0;
    if (goal === "lose-fat") {
      if (rateOfProgress > 0.7) return mods.min;
      if (rateOfProgress < 0.2) return mods.max;
      return mods.default;
    }
    return mods.default;
  }

  function getConsistencyLabel(adherence) {
    if (adherence >= 0.9) return "Excellent";
    if (adherence >= 0.7) return "Good";
    if (adherence >= 0.5) return "Fair";
    return "Needs Improvement";
  }

  function getGoalPaceLabel(weeklyChange, goal) {
    if (!weeklyChange) return "Not enough data";
    if (goal === "lose-fat") {
      if (weeklyChange < -1) return "Aggressive (over 1 kg/week)";
      if (weeklyChange < -0.5) return "Good pace (0.5-1 kg/week)";
      if (weeklyChange < -0.1) return "Slow (under 0.5 kg/week)";
      return "Gaining — adjust calories";
    }
    if (goal === "build-muscle") {
      if (weeklyChange > 0.5) return "Good pace (over 0.5 kg/week)";
      if (weeklyChange > 0.1) return "Slow (under 0.5 kg/week)";
      return "Not gaining — increase calories";
    }
    return "Stable";
  }

  function getPriorityMuscle(goal) {
    const map = {
      "build-muscle": "chest",
      strength: "back",
      "lose-fat": "core",
      endurance: "legs",
      general: "back",
    };
    return map[goal] || null;
  }

  return {
    isValidProfile,
    getMaxTrainingDays,
    getRecommendedSplit,
    buildSplitScores,
    getAllowedExercises,
    isExerciseAllowed,
    getRepRange,
    getRestSeconds,
    getWarmupSets,
    getProgressionScheme,
    getExerciseCount,
    getCompoundRatio,
    getVolumeForExperience,
    getGoalCalorieModifier,
    getConsistencyLabel,
    getGoalPaceLabel,
    getPriorityMuscle,
  };
})();

if (typeof window !== "undefined") window.CoachRules = CoachRules;
