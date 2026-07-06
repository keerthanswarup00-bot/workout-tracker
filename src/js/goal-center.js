// ============================================================
// STRIV GOAL CENTER — The brain of the Striv ecosystem.
// Every recommendation, report, workout, insight and coaching
// action should originate from Goal Center data.
// ============================================================

const GoalCenter = (() => {
  const GC_KEY = "striv_goal_center";

  // ---- Defaults -------------------------------------------------------
  function getDefaults() {
    return {
      goalType: "",
      status: "pending",
      createdDate: null,
      targetDate: null,
      startWeight: null,
      currentWeight: null,
      targetWeight: null,
      experienceLevel: "beginner",
      activityLevel: "moderate",
      trainingDays: 3
    };
  }

  // ---- Storage --------------------------------------------------------
  function load() {
    if (typeof state !== "undefined" && state && state.goalCenter) {
      return { ...getDefaults(), ...state.goalCenter };
    }
    try {
      const raw = localStorage.getItem(GC_KEY);
      return raw ? JSON.parse(raw) : getDefaults();
    } catch {
      return getDefaults();
    }
  }

  function save(profile) {
    localStorage.setItem(GC_KEY, JSON.stringify(profile));
    if (typeof state !== "undefined" && state) {
      state.goalCenter = { ...profile };
      if (typeof saveState === "function") saveState();
    }
  }

  function hasGoal(profile) {
    return profile && profile.goalType && profile.goalType.length > 0;
  }

  function isActive(profile) {
    return hasGoal(profile) && profile.status === "active";
  }

  // ---- Helpers --------------------------------------------------------

  function getWeightLog() {
    return state.weightLog || [];
  }

  function getSessions() {
    return state.sessions || [];
  }

  function getLatestWeight() {
    const log = getWeightLog();
    if (!log.length) return null;
    return log.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  }

  function getRecentWeights(days) {
    const log = getWeightLog();
    if (!log.length) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return log
      .filter(e => {
        const d = new Date(e.date);
        return d >= cutoff;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function get7DayAvg() {
    const recent = getRecentWeights(7);
    if (recent.length < 2) return null;
    const sum = recent.reduce((acc, e) => acc + e.weight, 0);
    return sum / recent.length;
  }

  function get30DayAvg() {
    const recent = getRecentWeights(30);
    if (recent.length < 3) return null;
    const sum = recent.reduce((acc, e) => acc + e.weight, 0);
    return sum / recent.length;
  }

  function getWeightTrend() {
    const recent = getRecentWeights(14);
    if (recent.length < 3) return "insufficient";
    const first = recent[0].weight;
    const last = recent[recent.length - 1].weight;
    const diff = last - first;
    if (Math.abs(diff) < 0.3) return "stable";
    return diff < 0 ? "down" : "up";
  }

  function getWeeklySessions() {
    const sessions = getSessions();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessions.filter(s => s.finishedAt && new Date(s.dateKey) >= weekAgo).length;
  }

  function getMonthlySessions() {
    const sessions = getSessions();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return sessions.filter(s => s.finishedAt && new Date(s.dateKey) >= monthAgo).length;
  }

  function getTrainingVolume() {
    const sessions = getSessions();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 14);
    const recent = sessions.filter(s => s.finishedAt && new Date(s.dateKey) >= monthAgo);
    let totalVolume = 0;
    for (const s of recent) {
      for (const ex of (s.exercises || [])) {
        for (const set of (ex.sets || [])) {
          if (set.done && Number(set.weight) > 0) {
            totalVolume += Number(set.weight) * (Number(set.reps) || 0);
          }
        }
      }
    }
    return totalVolume;
  }

  function getProteinCompliance() {
    return null;
  }

  // ---- Pace Engine ----------------------------------------------------
  function getGoalPace(profile) {
    if (!isActive(profile)) return null;

    const curWeight = profile.currentWeight || getLatestWeight()?.weight || null;
    const targetWeight = profile.targetWeight;
    const startWeight = profile.startWeight;
    const targetDate = profile.targetDate;

    if (!curWeight || !startWeight) {
      return { rate: null, projectedWeeks: null, projectedDate: null, status: "no-data", label: "Not enough data" };
    }

    const totalChange = targetWeight ? Math.abs(startWeight - targetWeight) : 0;
    const achieved = targetWeight ? (startWeight - curWeight) / (startWeight - targetWeight) * 100 : 0;
    const clamped = Math.min(100, Math.max(0, achieved));
    const remaining = targetWeight ? Math.abs(curWeight - targetWeight) : 0;

    const expectedRates = {
      "fat-loss": { min: 0.3, max: 0.7 },
      "muscle-gain": { min: 0.2, max: 0.4 },
      "strength": { min: 0, max: 0.2 },
      "general-fitness": { min: 0, max: 0.3 },
      "endurance": { min: 0, max: 0.2 }
    };
    const rate = expectedRates[profile.goalType] || { min: 0, max: 0.3 };

    const recentWeights = getRecentWeights(14);
    let actualWeeklyRate = null;
    if (recentWeights.length >= 3) {
      const first = recentWeights[0];
      const last = recentWeights[recentWeights.length - 1];
      const daysDiff = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
      if (daysDiff > 0) {
        actualWeeklyRate = ((last.weight - first.weight) / daysDiff) * 7;
      }
    }

    let paceStatus = "insufficient-data";
    let paceLabel = "Not enough data";
    if (actualWeeklyRate !== null) {
      const absRate = Math.abs(actualWeeklyRate);
      if (profile.goalType === "fat-loss") {
        if (actualWeeklyRate < 0 && absRate >= rate.min) paceStatus = "on-pace";
        else if (actualWeeklyRate < 0 && absRate < rate.min) paceStatus = "behind-pace";
        else if (actualWeeklyRate > 0) paceStatus = "behind-pace";
        else paceStatus = "on-pace";
      } else if (profile.goalType === "muscle-gain") {
        if (actualWeeklyRate > 0 && absRate >= rate.min) paceStatus = "on-pace";
        else if (actualWeeklyRate > 0 && absRate < rate.min) paceStatus = "behind-pace";
        else if (actualWeeklyRate <= 0) paceStatus = "behind-pace";
      } else {
        paceStatus = "on-pace";
      }
    }

    const paceLabels = {
      "on-pace": "On Pace",
      "ahead-pace": "Ahead Of Pace",
      "behind-pace": "Behind Pace",
      "insufficient-data": "Not Enough Data"
    };
    paceLabel = paceLabels[paceStatus] || "On Pace";

    let projectedWeeks = null;
    let projectedDate = null;
    if (actualWeeklyRate !== null && Math.abs(actualWeeklyRate) > 0.01 && remaining > 0) {
      const weeksFromRate = remaining / Math.abs(actualWeeklyRate);
      projectedWeeks = Math.round(weeksFromRate);
      const proj = new Date();
      proj.setDate(proj.getDate() + (projectedWeeks * 7));
      projectedDate = proj;
    }

    return {
      startWeight,
      currentWeight: curWeight,
      targetWeight,
      totalChange: Math.round(totalChange * 10) / 10,
      achieved: Math.round(clamped * 10) / 10,
      remaining: Math.round(remaining * 10) / 10,
      expectedWeeklyRate: rate,
      actualWeeklyRate: actualWeeklyRate !== null ? Math.round(actualWeeklyRate * 100) / 100 : null,
      status: paceStatus,
      label: paceLabel,
      projectedWeeks,
      projectedDate: projectedDate ? projectedDate.toISOString() : null,
      projectedDateStr: projectedDate ? projectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" }) : null
    };
  }

  // ---- Health Score ---------------------------------------------------
  function getGoalHealthScore(profile) {
    if (!isActive(profile)) return { score: null, level: "inactive", label: "No Active Goal" };

    const pace = getGoalPace(profile);
    const sessions = getSessions();
    const weekCount = sessions.filter(s => s.finishedAt).length;
    const recentSessions = getWeeklySessions();
    const monthlySessions = getMonthlySessions();

    let score = 50;

    const trend = getWeightTrend();
    if (profile.goalType === "fat-loss") {
      if (trend === "down") score += 20;
      else if (trend === "stable") score += 5;
      else score -= 10;
      if (recentSessions >= 3) score += 10;
      else if (recentSessions >= 1) score += 5;
      else score -= 5;
      score += Math.min(20, monthlySessions * 3);
    } else if (profile.goalType === "muscle-gain") {
      if (trend === "up") score += 20;
      else if (trend === "stable") score += 10;
      else score -= 10;
      if (recentSessions >= 4) score += 10;
      else if (recentSessions >= 2) score += 5;
      if (getTrainingVolume() > 50000) score += 10;
      score += Math.min(20, monthlySessions * 2);
    } else if (profile.goalType === "strength") {
      if (recentSessions >= 3) score += 15;
      if (getTrainingVolume() > 30000) score += 15;
      score += Math.min(20, monthlySessions * 2);
    } else {
      if (recentSessions >= 2) score += 15;
      score += Math.min(25, monthlySessions * 2);
    }

    score = Math.max(0, Math.min(100, score));

    let level = "needs-attention";
    let label = "Needs Attention";
    if (score >= 80) { level = "excellent"; label = "Excellent"; }
    else if (score >= 60) { level = "good"; label = "Good"; }
    else if (score >= 40) { level = "needs-attention"; label = "Needs Attention"; }
    else { level = "at-risk"; label = "At Risk"; }

    return { score, level, label };
  }

  // ---- Strategy Engine ------------------------------------------------
  function getGoalStrategy(profile) {
    if (!hasGoal(profile)) return null;
    const weight = profile.currentWeight || getLatestWeight()?.weight || (state.user?.weight) || 70;

    let engineProtein = null;
    let engineCalories = null;
    let engineWater = null;
    if (typeof CoachEngine !== "undefined") {
      const engProfile = CoachEngine.buildProfile(state);
      const engResult = CoachEngine.generate(engProfile);
      if (engResult.valid) {
        const p = engResult.nutrition.protein;
        engineProtein = p ? `${p.recommended}g (${p.low}-${p.high}g)` : null;
        engineCalories = engResult.energy.target
          ? (engResult.energy.tdee
            ? (() => {
                const diff = engResult.energy.target - engResult.energy.tdee;
                return diff < 0 ? `Maintenance ${diff} kcal` : diff > 0 ? `Maintenance +${diff} kcal` : "Maintenance";
              })()
            : `${engResult.energy.target} kcal`)
          : null;
        engineWater = engResult.nutrition.water ? `${engResult.nutrition.water.liters}L` : null;
      }
    }

    const goalMap = {
      "fat-loss": {
        targets: {
          calories: engineCalories || "Maintenance - 400",
          protein: engineProtein || Math.round(weight * 2.2) + "g",
          water: engineWater || (weight * 0.04).toFixed(1) + "L",
          steps: "10,000 - 12,000",
          cardio: "3-5 Sessions",
          sleep: "8 Hours"
        },
        expectedRate: "0.3 - 0.7 kg/week",
        warnings: [
          "Too much cardio can impair recovery",
          "Protein too low risks muscle loss",
          "Weight loss >1kg/week is unsustainable",
          "Weight loss stalled for 2+ weeks"
        ]
      },
      "muscle-gain": {
        targets: {
          calories: engineCalories || "Maintenance + 250",
          protein: engineProtein || Math.round(weight * 2.0) + "g",
          water: engineWater || (weight * 0.04).toFixed(1) + "L",
          steps: "7,000 - 9,000",
          cardio: "1-2 Sessions",
          sleep: "8 Hours"
        },
        expectedRate: "0.2 - 0.4 kg/week",
        warnings: [
          "Weight not increasing — eat more",
          "Protein too low for muscle growth",
          "Recovery poor — reduce volume",
          "Program hopping kills progress"
        ]
      },
      "strength": {
        targets: {
          calories: engineCalories || "Maintenance + 200",
          protein: engineProtein || Math.round(weight * 2.0) + "g",
          water: engineWater || (weight * 0.04).toFixed(1) + "L",
          steps: "7,000 - 9,000",
          cardio: "2 Sessions",
          sleep: "8+ Hours"
        },
        expectedRate: "Linear Progression",
        warnings: [
          "Prioritize heavy compounds",
          "Long rest times (3-5 min)",
          "Recovery is critical — deload when needed",
          "Don't chase pump, chase pounds"
        ]
      },
      "general-fitness": {
        targets: {
          calories: engineCalories || "Maintenance",
          protein: engineProtein || Math.round(weight * 1.8) + "g",
          water: engineWater || (weight * 0.04).toFixed(1) + "L",
          steps: "8,000 - 10,000",
          cardio: "2-3 Sessions",
          sleep: "7-8 Hours"
        },
        expectedRate: "Gradual Improvement",
        warnings: [
          "Stay consistent with training",
          "Balance cardio and strength",
          "Prioritize recovery"
        ]
      },
      "endurance": {
        targets: {
          calories: engineCalories || "Maintenance + 100",
          protein: engineProtein || Math.round(weight * 1.8) + "g",
          water: engineWater || (weight * 0.045).toFixed(1) + "L",
          steps: "12,000 - 15,000",
          cardio: "4-6 Sessions",
          sleep: "8+ Hours"
        },
        expectedRate: "Endurance Gains",
        warnings: [
          "Don't neglect strength training",
          "Increase intensity gradually",
          "Fuel properly before sessions",
          "Recovery is essential for progress"
        ]
      }
    };

    return goalMap[profile.goalType] || goalMap["general-fitness"];
  }

  // ---- Coach Analysis -------------------------------------------------
  function getCoachAnalysis(profile) {
    if (!isActive(profile)) return [];
    const pace = getGoalPace(profile);
    const health = getGoalHealthScore(profile);
    const trend = getWeightTrend();
    const sessions = getSessions();
    const weekSessions = getWeeklySessions();
    const totalSessions = sessions.filter(s => s.finishedAt).length;
    const goalType = profile.goalType;

    const insights = [];

    if (totalSessions === 0) {
      insights.push("Complete your first workout to activate coaching insights.");
      return insights;
    }

    if (pace && pace.status === "on-pace") {
      if (goalType === "fat-loss") {
        insights.push("You are losing weight at a sustainable rate. Keep your deficit consistent.");
      } else if (goalType === "muscle-gain") {
        insights.push("Your weight is trending upward. Muscle gain requires patience and consistency.");
      } else {
        insights.push("You are on track with your goal. Keep showing up.");
      }
      if (pace.projectedDateStr) {
        insights.push("Current pace suggests goal completion around " + pace.projectedDateStr + ".");
      }
    } else if (pace && pace.status === "behind-pace") {
      if (goalType === "fat-loss") {
        insights.push("Weight loss has slowed. Review your calorie intake and step count.");
      } else if (goalType === "muscle-gain") {
        insights.push("Weight is not increasing as expected. Consider increasing calories.");
      } else {
        insights.push("Progress has slowed. Review your training consistency.");
      }
    } else if (pace && pace.status === "insufficient-data") {
      insights.push("Log your weight regularly to track goal progress accurately.");
    }

    if (weekSessions === 0 && totalSessions > 0) {
      insights.push("No workouts logged this week. Consistency is key to reaching your goal.");
    } else if (weekSessions < 2 && totalSessions > 0) {
      insights.push("Aim for more training sessions this week to stay on track.");
    }

    if (health && health.score < 40) {
      insights.push("Goal health score needs attention. Review your nutrition and training plan.");
    } else if (health && health.score >= 80) {
      insights.push("Great overall compliance. Keep maintaining your current habits.");
    }

    if (trend === "up" && goalType === "fat-loss") {
      insights.push("Weight is trending up. Check your calorie deficit and daily steps.");
    } else if (trend === "down" && goalType === "muscle-gain") {
      insights.push("Weight is dropping. Increase calories to support muscle growth.");
    }

    if (insights.length === 0) {
      insights.push("Keep logging your workouts and weight for personalized coaching.");
    }

    return insights.slice(0, 5);
  }

  // ---- Next Actions ---------------------------------------------------
  function getNextActions(profile) {
    if (!isActive(profile)) return [];
    const pace = getGoalPace(profile);
    const health = getGoalHealthScore(profile);
    const sessions = getSessions();
    const totalSessions = sessions.filter(s => s.finishedAt).length;
    const weekSessions = getWeeklySessions();
    const latestWeight = getLatestWeight();
    const weekWeights = getRecentWeights(7);

    const actions = [];

    if (!latestWeight || (weekWeights.length < 2)) {
      actions.push({ id: "log-weight", label: "Log Body Weight", type: "primary" });
    } else {
      actions.push({ id: "log-weight", label: "Log Weight", type: "secondary" });
    }

    if (weekSessions === 0 && totalSessions > 0) {
      if (profile.trainingDays >= 3) {
        actions.push({ id: "workout", label: "Complete Today's Workout", type: "primary" });
      }
    }

    if (health && health.score < 50) {
      actions.push({ id: "review-plan", label: "Review Goal Strategy", type: "primary" });
    }

    if (pace && pace.status === "behind-pace" && profile.goalType === "fat-loss") {
      actions.push({ id: "increase-steps", label: "Walk 2,000 More Steps Daily", type: "secondary" });
    }

    if (profile.goalType === "fat-loss" || profile.goalType === "muscle-gain") {
      actions.push({ id: "nutrition", label: "Review Nutrition Plan", type: "secondary" });
    }

    actions.push({ id: "view-progress", label: "View Progress", type: "secondary" });

    return actions.slice(0, 5);
  }

  // ---- Create / Update -------------------------------------------------
  function createProfile(data) {
    const profile = {
      goalType: data.goalType || "",
      status: "active",
      createdDate: new Date().toISOString(),
      targetDate: data.targetDate || null,
      startWeight: data.startWeight || null,
      currentWeight: data.currentWeight || data.startWeight || null,
      targetWeight: data.targetWeight || null,
      experienceLevel: data.experienceLevel || "beginner",
      activityLevel: data.activityLevel || "moderate",
      trainingDays: data.trainingDays || 3,
      lastLogDate: null
    };
    save(profile);

    if (profile.goalType) {
      const goalTypeMap = {
        "fat-loss": "lose-fat",
        "muscle-gain": "build-muscle",
        "strength": "strength",
        "general-fitness": "general",
        "endurance": "athletic"
      };
      const mappedGoal = goalTypeMap[profile.goalType] || "general";
      state.user = state.user || {};
      state.user.goal = mappedGoal;
      state.bodyGoal = mappedGoal;
      state.weightGoal = {
        startWeight: profile.startWeight,
        targetWeight: profile.targetWeight,
        goalType: profile.goalType,
        createdAt: profile.createdDate
      };
    }

    return profile;
  }

  function updateProfile(updates) {
    const profile = load();
    Object.assign(profile, updates);
    if (updates.currentWeight) profile.lastLogDate = new Date().toISOString();
    save(profile);

    // Sync back to application state (mirrors createProfile logic)
    if (profile.goalType && typeof state !== "undefined" && state) {
      const goalTypeMap = {
        "fat-loss": "lose-fat",
        "muscle-gain": "build-muscle",
        "strength": "strength",
        "general-fitness": "general",
        "endurance": "athletic"
      };
      const mappedGoal = goalTypeMap[profile.goalType] || "general";
      state.user = state.user || {};
      state.user.goal = mappedGoal;
      state.bodyGoal = mappedGoal;
      if (profile.startWeight || profile.targetWeight) {
        state.weightGoal = {
          startWeight: profile.startWeight || state.weightGoal?.startWeight || null,
          targetWeight: profile.targetWeight || state.weightGoal?.targetWeight || null,
          goalType: profile.goalType,
          createdAt: profile.createdDate || state.weightGoal?.createdAt || new Date().toISOString()
        };
      }
      if (typeof saveState === "function") saveState();
    }

    return profile;
  }

  function resetGoal() {
    save(getDefaults());
  }

  // ---- Master Orchestrator -------------------------------------------
  function getAll() {
    const profile = load();
    const pace = getGoalPace(profile);
    const health = getGoalHealthScore(profile);
    const strategy = getGoalStrategy(profile);
    const analysis = getCoachAnalysis(profile);
    const actions = getNextActions(profile);

    return {
      profile,
      hasGoal: hasGoal(profile),
      isActive: isActive(profile),
      pace,
      health,
      strategy,
      analysis,
      actions
    };
  }

  // ---- GoalCenterService (Single Source of Truth API) ----------------
  function getGoalType() {
    const profile = load();
    if (hasGoal(profile)) {
      const map = {
        "fat-loss": "lose-fat",
        "muscle-gain": "build-muscle",
        "strength": "strength",
        "general-fitness": "general",
        "endurance": "athletic"
      };
      return map[profile.goalType] || "general";
    }
    return (state.user && state.user.goal) || state.bodyGoal || "recomp";
  }

  function getCurrentGoal() {
    return load();
  }

  function getGoalProgressPct() {
    const profile = load();
    if (!hasGoal(profile)) return null;
    const pace = getGoalPace(profile);
    return pace && pace.achieved !== undefined ? pace.achieved : null;
  }

  function getGoalPaceData() {
    const profile = load();
    return getGoalPace(profile);
  }

  function getGoalWeightData() {
    const profile = load();
    if (hasGoal(profile)) {
      const pace = getGoalPace(profile);
      return {
        startWeight: pace ? pace.startWeight : profile.startWeight,
        targetWeight: pace ? pace.targetWeight : profile.targetWeight,
        currentWeight: pace ? pace.currentWeight : profile.currentWeight,
      };
    }
    const user = state.user || {};
    const latestLog = getLatestWeight();
    return {
      startWeight: user.startWeight || null,
      targetWeight: user.targetWeight || null,
      currentWeight: latestLog ? latestLog.weight : user.weight || null,
    };
  }

  function getGoalHealth() {
    const profile = load();
    return getGoalHealthScore(profile);
  }

  function getGoalStatus() {
    const profile = load();
    if (isActive(profile)) return "active";
    if (hasGoal(profile)) return "inactive";
    return "no-goal";
  }

  function getGCGoalType() {
    const profile = load();
    return hasGoal(profile) ? profile.goalType : null;
  }

  function getGoalLabel() {
    const labels = {
      "lose-fat": "Fat Loss",
      "build-muscle": "Build Muscle",
      "strength": "Strength",
      "general": "General",
      "athletic": "Athletic",
      "recomp": "Recomp",
      "lean-bulk": "Lean Bulk",
      "aggressive-bulk": "Aggressive Bulk",
      "custom": "Custom"
    };
    const t = getGoalType();
    return labels[t] || (hasGoal(load()) ? load().goalType : "No Goal");
  }

  // ---- Weight Intelligence Engine -----------------------------------

  function getWeightStreak() {
    const log = getWeightLog();
    if (!log.length) return { current: 0, longest: 0 };
    const sorted = log.slice().sort((a, b) => b.date.localeCompare(a.date));
    let current = 0;
    const today = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedKey = getDateKey(expected);
      if (sorted[i].date === expectedKey) {
        current++;
      } else {
        break;
      }
    }
    let longest = 0;
    let run = 1;
    sorted.slice().reverse().forEach((e, idx, arr) => {
      if (idx === 0) return;
      const prev = new Date(arr[idx - 1].date);
      const cur = new Date(e.date);
      const diff = Math.round((cur - prev) / 86400000);
      if (diff === 1) {
        run++;
      } else {
        longest = Math.max(longest, run);
        run = 1;
      }
    });
    longest = Math.max(longest, run);
    return { current, longest };
  }

  function getWeightLoggingScore() {
    const weekWeights = getRecentWeights(7);
    const daysLogged = weekWeights.length;
    if (daysLogged >= 7) return 10;
    if (daysLogged >= 5) return 7;
    if (daysLogged >= 3) return 4;
    return 0;
  }

  function getWeeklyChange() {
    const recent = getRecentWeights(14);
    if (recent.length < 2) return null;
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent7 = recent.filter(e => new Date(e.date) >= weekAgo);
    const prev7 = recent.filter(e => new Date(e.date) < weekAgo);
    if (recent7.length < 1 || prev7.length < 1) return null;
    const avgRecent = recent7.reduce((s, e) => s + e.weight, 0) / recent7.length;
    const avgPrev = prev7.reduce((s, e) => s + e.weight, 0) / prev7.length;
    return Math.round((avgRecent - avgPrev) * 100) / 100;
  }

  function getMonthlyChange() {
    const recent = getRecentWeights(30);
    if (recent.length < 3) return null;
    const sorted = recent.slice().sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0].weight;
    const last = sorted[sorted.length - 1].weight;
    return Math.round((last - first) * 100) / 100;
  }

  function detectPlateau() {
    const recent = getRecentWeights(30);
    if (recent.length < 5) return { isPlateau: false, daysUnchanged: null };
    const now = new Date();
    const oldestConsidered = new Date(now);
    oldestConsidered.setDate(oldestConsidered.getDate() - 21);
    const window = recent.filter(e => new Date(e.date) >= oldestConsidered);
    if (window.length < 3) return { isPlateau: false, daysUnchanged: null };
    const sorted = window.slice().sort((a, b) => a.date.localeCompare(b.date));
    const firstWeight = sorted[0].weight;
    const lastWeight = sorted[sorted.length - 1].weight;
    const change = Math.abs(lastWeight - firstWeight);
    if (change < 0.3) {
      const daysDiff = Math.round((new Date(sorted[sorted.length - 1].date) - new Date(sorted[0].date)) / 86400000);
      return { isPlateau: daysDiff >= 21, daysUnchanged: daysDiff, firstAvg: firstWeight, lastAvg: lastWeight };
    }
    return { isPlateau: false, daysUnchanged: null };
  }

  function getRateAnalysis() {
    const profile = load();
    if (!hasGoal(profile)) return null;
    const goalType = profile.goalType;
    const pace = getGoalPace(profile);
    if (!pace || pace.actualWeeklyRate === null) return { status: "insufficient-data", label: "Not enough data", color: "gray" };

    const rate = Math.abs(pace.actualWeeklyRate);
    const direction = pace.actualWeeklyRate;

    if (goalType === "fat-loss") {
      if (direction > 0) return { status: "reversing", label: "Weight is increasing", color: "red", rate: pace.actualWeeklyRate };
      if (rate >= 0.3 && rate <= 0.7) return { status: "healthy", label: "Healthy pace", color: "green", rate: pace.actualWeeklyRate };
      if (rate > 0.7) return { status: "too-fast", label: "Losing too fast", color: "orange", rate: pace.actualWeeklyRate };
      return { status: "too-slow", label: "Losing too slow", color: "yellow", rate: pace.actualWeeklyRate };
    }

    if (goalType === "muscle-gain") {
      if (direction < 0) return { status: "reversing", label: "Weight is dropping", color: "red", rate: pace.actualWeeklyRate };
      if (rate >= 0.2 && rate <= 0.4) return { status: "healthy", label: "Optimal gain rate", color: "green", rate: pace.actualWeeklyRate };
      if (rate > 0.4) return { status: "too-fast", label: "Gaining too fast", color: "orange", rate: pace.actualWeeklyRate };
      return { status: "too-slow", label: "Gaining too slow", color: "yellow", rate: pace.actualWeeklyRate };
    }

    return { status: "monitoring", label: "Monitoring", color: "blue", rate: pace.actualWeeklyRate };
  }

  function getWeightIntelligence() {
    const sevenDayAvg = get7DayAvg();
    const thirtyDayAvg = get30DayAvg();
    const latest = getLatestWeight();
    const streak = getWeightStreak();
    const loggingScore = getWeightLoggingScore();
    const weeklyChange = getWeeklyChange();
    const monthlyChange = getMonthlyChange();
    const plateau = detectPlateau();
    const rateAnalysis = getRateAnalysis();
    const trend = getWeightTrend();
    const profile = load();
    const goalPace = getGoalPace(profile);

    return {
      currentWeight: latest ? latest.weight : null,
      sevenDayAvg: sevenDayAvg !== null ? Math.round(sevenDayAvg * 10) / 10 : null,
      thirtyDayAvg: thirtyDayAvg !== null ? Math.round(thirtyDayAvg * 10) / 10 : null,
      weeklyChange,
      monthlyChange,
      trendDirection: trend,
      streak,
      loggingScore,
      plateau,
      rateAnalysis,
      goalPace,
      hasGoal: hasGoal(profile),
    };
  }

  // ---- Public API ----------------------------------------------------
  return {
    load,
    save,
    hasGoal,
    isActive,
    getDefaults,
    getGoalPace,
    getGoalHealthScore,
    getGoalStrategy,
    getCoachAnalysis,
    getNextActions,
    createProfile,
    updateProfile,
    resetGoal,
    getAll,
    getGoalType,
    getCurrentGoal,
    getGoalProgressPct,
    getGoalPaceData,
    getGoalWeightData,
    getGoalHealth,
    getGoalStatus,
    getGCGoalType,
    getGoalLabel,
    getWeightStreak,
    getWeightLoggingScore,
    getWeeklyChange,
    getMonthlyChange,
    detectPlateau,
    getRateAnalysis,
    getWeightIntelligence
  };
})();
