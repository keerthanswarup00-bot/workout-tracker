// ============================================================
// IRONLOG ADAPTIVE COACHING ENGINE V1
// Continuous monitoring, risk detection, personalization,
// behavioral coaching & adaptive recommendations.
// ============================================================

const AdaptiveEngine = (() => {

  // ---- Adaptive Profile Builder -----------------------------
  function buildProfile(engines) {
    const dc = engines.daily || {};
    const rec = engines.recovery || {};
    const prog = engines.progress || {};
    const rep = engines.reports || {};
    const nut = engines.nutrition || {};
    const cas = engines.cas || {};
    const gs = engines.goalStrategy || {};

    const user = state.user || {};
    const sessions = (state.sessions || []).filter((s) => s.finishedAt);
    const weightLog = state.weightLog || [];
    const today = getDateKey(new Date());

    // Coach Score breakdown
    const wrFull = rep.weekly && rep.weekly.full;
    const coachScore = wrFull ? wrFull.coachScore ?? 0 : 0;
    const coachComponents = wrFull && wrFull.scoreBreakdown ? {
      workout: wrFull.scoreBreakdown.workout.score ?? 0,
      protein: wrFull.scoreBreakdown.protein.score ?? 0,
      recovery: wrFull.scoreBreakdown.recovery.score ?? 0,
      steps: wrFull.scoreBreakdown.activity.score ?? 0,
      tracking: wrFull.scoreBreakdown.tracking.score ?? 0,
      consistency: wrFull.scoreBreakdown.consistency.score ?? 0,
    } : null;

    const maxComponents = {
      workout: 30, protein: 20, recovery: 15, steps: 15, tracking: 10, consistency: 10,
    };

    // Workout compliance
    const recommendedWorkouts = user.trainingDays || 6;
    const weekSessions = getWeekSessions();
    const weekCount = weekSessions.length;
    const workoutCompliance = recommendedWorkouts > 0 ? Math.min(100, Math.round((weekCount / recommendedWorkouts) * 100)) : 0;

    // Protein compliance
    const proteinGoal = nut.proteinTarget || user.proteinGoal || 150;
    let proteinDays = 0;
    const weekKeys = getWeekDateKeys();
    const dailyLogs = state.dailyLogs || {};
    weekKeys.forEach((k) => {
      const day = dailyLogs[k];
      if (day && day.protein && day.protein >= proteinGoal * 0.8) proteinDays++;
    });
    if (proteinDays > 7) proteinDays = 7;
    const proteinCompliance = Math.round((proteinDays / 7) * 100);

    // Weight trend
    let weightTrend = "stable";
    if (weightLog.length >= 3) {
      const sorted = weightLog.slice().sort((a, b) => b.date.localeCompare(a.date));
      const recent = sorted.slice(0, 7);
      if (recent.length >= 3) {
        const firstW = recent[recent.length - 1].weight;
        const lastW = recent[0].weight;
        const diff = lastW - firstW;
        const goalType = gs.goal || "general";
        if (goalType === "lose-fat" && diff > 0.3) weightTrend = "stalling";
        else if (goalType === "lose-fat" && diff < -0.3) weightTrend = "good";
        else if (goalType === "build-muscle" && diff < -0.3) weightTrend = "stalling";
        else if (goalType === "build-muscle" && diff > 0.3) weightTrend = "good";
        else if (Math.abs(diff) <= 0.3) weightTrend = "stable";
      }
    }

    // Learning engagement
    const completedLessons = (typeof getLearningProgress !== "undefined" && getLearningProgress())
      ? getLearningProgress().completed.length : 0;
    const learningEngagement = completedLessons > 5 ? "high" : completedLessons > 2 ? "medium" : "low";

    // Consistency (streak-based)
    const streak = getStreak();
    const consistencyScore = streak >= 30 ? 100 : streak >= 14 ? 80 : streak >= 7 ? 60 : streak >= 3 ? 40 : streak >= 1 ? 20 : 0;

    // Search history (from problem solver searches)
    const searchHistory = getSearchHistory ? getSearchHistory() : [];
    const topSearchTopics = extractSearchTopics(searchHistory);

    // Challenge performance
    const challengeCompletionRate = cas.challenges && cas.challenges.total > 0
      ? Math.round((cas.challenges.completed / cas.challenges.total) * 100) : 0;

    // Recovery trend
    const recHistory = rec.score ? getRecoveryTrend(rec) : null;
    const recoveryDeclining = recHistory && recHistory.trend === "declining";

    // Determine risk level
    const riskLevel = assessRisk({
      coachScore, workoutCompliance, proteinCompliance,
      recoveryScore: rec.score || 0, weightTrend, consistencyScore,
      goalHealth: prog.gcHealthScore,
      daysSinceWeight: getDaysSinceLastWeight(),
    });

    // Priority focus area
    const focusArea = identifyFocusArea({
      coachComponents, maxComponents, coachScore,
      workoutCompliance, proteinCompliance, rec,
      weightTrend, consistencyScore, riskLevel,
    });

    return {
      profile: {
        goalType: gs.goal || "general",
        coachScore,
        coachComponents,
        maxComponents,
        goalHealth: prog.gcHealthScore ?? null,
        recoveryScore: rec.score ?? 0,
        recoveryStatus: rec.status ?? "unknown",
        recoveryDeclining,
        workoutCompliance,
        proteinCompliance,
        proteinDays,
        weightTrend,
        consistencyScore,
        learningEngagement,
        completedLessons,
        challengeCompletionRate,
        streak,
        riskLevel,
        focusArea,
        topSearchTopics,
        daysSinceWeight: getDaysSinceLastWeight(),
      },
      alerts: generateAlerts({
        rec, coachScore, workoutCompliance, proteinCompliance,
        weightTrend, consistencyScore, riskLevel, focusArea,
        streak, cas,
      }),
      recommendations: generateRecommendations({
        profile: {
          coachComponents, maxComponents, coachScore, focusArea,
          proteinCompliance, workoutCompliance, weightTrend,
          rec, gs, learningEngagement, topSearchTopics,
          riskLevel, streak, challengeCompletionRate,
          goalType: gs.goal || "general",
        },
        dc,
      }),
      focus: {
        area: focusArea.area,
        label: focusArea.label,
        message: focusArea.message,
        improvement: focusArea.improvement,
      },
    };
  }

  // ---- Risk Assessment --------------------------------------
  function assessRisk(data) {
    let score = 0;
    if (data.coachScore >= 80) score += 30;
    else if (data.coachScore >= 60) score += 15;
    else score += 0;

    if (data.workoutCompliance >= 80) score += 20;
    else if (data.workoutCompliance >= 50) score += 10;
    else score += 0;

    if (data.proteinCompliance >= 80) score += 15;
    else if (data.proteinCompliance >= 50) score += 8;
    else score += 0;

    if (data.recoveryScore >= 75) score += 15;
    else if (data.recoveryScore >= 50) score += 8;
    else score += 0;

    if (data.weightTrend === "good") score += 10;
    else if (data.weightTrend === "stable") score += 5;
    else score += 0;

    if (data.consistencyScore >= 80) score += 10;
    else if (data.consistencyScore >= 40) score += 5;
    else score += 0;

    if (score >= 70) return "low";
    if (score >= 40) return "medium";
    return "high";
  }

  // ---- Focus Area Identification ----------------------------
  function identifyFocusArea(data) {
    const { coachComponents, maxComponents, coachScore } = data;
    const areas = [];

    if (coachComponents) {
      for (const [key, max] of Object.entries(maxComponents)) {
        const score = coachComponents[key] || 0;
        const pct = max > 0 ? Math.round((score / max) * 100) : 0;
        const gap = max - score;
        areas.push({ key, score, max, pct, gap });
      }
    }

    // Also check non-coach-score areas
    if (data.proteinCompliance < 50) {
      areas.push({ key: "protein", score: data.proteinCompliance, max: 100, pct: data.proteinCompliance, gap: 100 - data.proteinCompliance });
    }
    if (data.workoutCompliance < 50) {
      areas.push({ key: "workout", score: data.workoutCompliance, max: 100, pct: data.workoutCompliance, gap: 100 - data.workoutCompliance });
    }
    if (data.rec && data.rec.score < 60) {
      areas.push({ key: "recovery", score: data.rec.score, max: 100, pct: data.rec.score, gap: 100 - data.rec.score });
    }
    if (data.weightTrend === "stalling") {
      areas.push({ key: "weight", score: 0, max: 100, pct: 0, gap: 100 });
    }

    if (areas.length === 0) {
      return { area: "maintain", label: "Maintain Momentum", message: "Everything looks solid. Keep doing what you're doing.", improvement: null };
    }

    areas.sort((a, b) => b.gap - a.gap);
    const top = areas[0];
    const labelMap = {
      workout: "Workout Consistency", protein: "Protein Adherence",
      recovery: "Recovery", steps: "Daily Steps",
      tracking: "Weight Tracking", consistency: "Training Streak",
      weight: "Weight Trend",
    };
    const messageMap = {
      workout: `Improving workout consistency would have the biggest impact on your Coach Score.`,
      protein: `Improving protein adherence would increase your Coach Score faster than any other habit.`,
      recovery: `Focusing on recovery — sleep and rest days — would most improve your training quality.`,
      steps: `Increasing daily step count would close the biggest gap in your score.`,
      tracking: `Logging weight more consistently improves coaching accuracy.`,
      consistency: `Building a longer training streak unlocks consistency bonuses.`,
      weight: `Your weight trend is stalling. Review nutrition and activity levels.`,
    };
    const improvementMap = {
      workout: `Complete ${top.gap > 20 ? "all" : "more"} planned workouts each week.`,
      protein: `Hit ${top.gap > 10 ? "at least 80%" : "your"} protein target daily.`,
      recovery: `Prioritize ${top.gap > 10 ? "sleep and rest days" : "recovery between sessions"}.`,
      steps: `Add ${top.gap > 10 ? "a daily walk" : "more steps"} to your routine.`,
      tracking: `Log weight ${top.gap > 5 ? "daily" : "more frequently"}.`,
      consistency: `Train at least ${top.gap > 50 ? "every other day" : "consistently"} to build your streak.`,
      weight: `Review calorie intake and increase activity.`,
    };

    return {
      area: top.key,
      label: labelMap[top.key] || top.key,
      message: messageMap[top.key] || `Focus on improving ${top.key}.`,
      improvement: improvementMap[top.key] || null,
      gap: top.gap,
    };
  }

  // ---- Alert Generation -------------------------------------
  function generateAlerts(data) {
    const alerts = [];
    const { rec, coachScore, workoutCompliance, proteinCompliance, weightTrend, riskLevel, focusArea, streak, cas } = data;

    // Recovery declining
    const recHistory = rec.score ? getRecoveryTrend(rec) : null;
    if (recHistory && recHistory.trend === "declining" && recHistory.dropAmount > 10) {
      alerts.push({ type: "recovery", severity: "high", text: `Recovery declining — dropped ${Math.abs(recHistory.dropAmount)} points recently.`, action: "recovery" });
    } else if (recHistory && recHistory.trend === "declining") {
      alerts.push({ type: "recovery", severity: "medium", text: `Recovery score trending down. Prioritize sleep and rest.`, action: "recovery" });
    }

    // Low Coach Score
    if (coachScore < 60) {
      alerts.push({ type: "coach-score", severity: "high", text: `Coach Score is ${coachScore}. Focus on ${focusArea.label.toLowerCase()} to improve.`, action: "coach-score" });
    } else if (coachScore < 40) {
      alerts.push({ type: "coach-score", severity: "critical", text: `Coach Score critically low. Start with one small habit — log weight or complete a workout.`, action: "coach-score" });
    }

    // Improving Coach Score
    if (coachScore >= 80 && streak >= 7) {
      alerts.push({ type: "positive", severity: "low", text: `Coach Score is ${coachScore} — your consistency is paying off.`, action: "positive" });
    }

    // Protein adherence
    if (proteinCompliance < 40) {
      alerts.push({ type: "nutrition", severity: "high", text: `Protein adherence dropped to ${proteinCompliance}% this week.`, action: "challenge" });
    } else if (proteinCompliance < 70) {
      alerts.push({ type: "nutrition", severity: "medium", text: `Protein target missed on ${Math.round((100 - proteinCompliance) / 100 * 7)} days this week.`, action: "challenge" });
    }

    // Workout compliance
    if (workoutCompliance < 40) {
      alerts.push({ type: "workout", severity: "high", text: `Workout completion falling — only ${workoutCompliance}% of planned sessions completed.`, action: "workout" });
    } else if (workoutCompliance < 70) {
      alerts.push({ type: "workout", severity: "medium", text: `You completed ${workoutCompliance}% of planned workouts.`, action: "workout" });
    }

    // Weight plateau
    if (weightTrend === "stalling") {
      alerts.push({ type: "weight", severity: "high", text: `Weight trend plateau detected. Review nutrition and activity.`, action: "goal" });
    }

    // High risk
    if (riskLevel === "high") {
      alerts.push({ type: "risk", severity: "critical", text: `Several metrics need attention. Start with one small win today.`, action: "coach-score" });
    }

    // Streak milestone
    if (streak === 7 || streak === 14 || streak === 30 || streak === 60 || streak === 90 || streak === 180 || streak === 365) {
      alerts.push({ type: "positive", severity: "low", text: `${streak}-day training streak! You\'re building an incredible habit.`, action: "positive" });
    }

    // Challenge available
    if (cas && cas.challenges && cas.challenges.active && cas.challenges.active.length > 0) {
      const incomplete = cas.challenges.active.filter((c) => !c.completed);
      if (incomplete.length > 0) {
        alerts.push({ type: "challenge", severity: "low", text: `${incomplete.length} active challenge${incomplete.length > 1 ? "s" : ""} — keep going!`, action: "challenge" });
      }
    }

    // Weight logging
    const daysSinceWeight = getDaysSinceLastWeight();
    if (daysSinceWeight !== null && daysSinceWeight > 7) {
      alerts.push({ type: "tracking", severity: "medium", text: `Not logged weight in ${daysSinceWeight} days — data quality declining.`, action: "tracking" });
    }

    // Limit to most important alerts
    const priority = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    alerts.sort((a, b) => (priority[a.severity] || 5) - (priority[b.severity] || 5));
    return alerts.slice(0, 5);
  }

  // ---- Adaptive Recommendations -----------------------------
  function generateRecommendations(data) {
    const { profile } = data;
    const recs = [];

    // Learning recommendations based on focus area
    const lessonMap = {
      "protein": ["nutrition-fundamentals", "protein-timing"],
      "recovery": ["recovery-basics", "sleep-optimization"],
      "workout": ["training-frequency", "programming-basics"],
      "steps": ["cardio-for-fat-loss", "activity-tracking"],
      "tracking": ["tracking-accuracy", "goal-setting"],
      "weight": ["nutrition-fundamentals", "calorie-tracking", "fat-loss-plateaus"],
    };

    const focusRecs = lessonMap[profile.focusArea] || [];
    if (profile.learningEngagement !== "none") {
      focusRecs.slice(0, 2).forEach((lessonId) => {
        recs.push({ type: "lesson", action: "learn", lessonId, source: "adaptive-focus" });
      });
    }

    // Challenge recommendations based on weak areas
    if (profile.proteinCompliance < 70) {
      recs.push({ type: "challenge", action: "generate", challengeType: "protein", label: "7-Day Protein Challenge", source: "adaptive-weakness" });
    }
    if (profile.workoutCompliance < 60) {
      recs.push({ type: "challenge", action: "generate", challengeType: "workout", label: "Workout Streak Challenge", source: "adaptive-weakness" });
    }
    if (profile.weightTrend === "stalling" && profile.goalType === "lose-fat") {
      recs.push({ type: "challenge", action: "generate", challengeType: "steps", label: "Daily Step Challenge", source: "adaptive-weight" });
    }

    // Goal pace recommendations
    if (profile.rec && profile.rec.status === "behind-pace") {
      recs.push({ type: "action", action: "review-pace", label: "Review goal pace — you may be falling behind.", source: "adaptive-goal" });
    }

    // Recovery recommendations
    if (profile.rec && profile.rec.score < 60) {
      recs.push({ type: "recovery", action: "rest", label: "Reduce training intensity. Prioritize recovery.", source: "adaptive-recovery" });
    }

    // Workout plateau detection (simplified)
    const sessions = (state.sessions || []).filter((s) => s.finishedAt);
    if (sessions.length >= 10) {
      const sorted = sessions.slice().sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      const last5 = sorted.slice(0, 5);
      const hasConsistentVolume = last5.length >= 3 && last5.every((s) => {
        const vol = (s.exercises || []).reduce((sum, ex) => sum + (ex.sets || []).filter((st) => st.done).length, 0);
        return vol > 0;
      });
      if (hasConsistentVolume && profile.workoutCompliance >= 80 && profile.streak >= 14) {
        recs.push({ type: "insight", action: "progress", label: "You have been consistent for 14+ days — consider increasing intensity.", source: "adaptive-progress" });
      }
    }

    // Search-based recommendations
    if (profile.topSearchTopics && profile.topSearchTopics.length > 0) {
      profile.topSearchTopics.slice(0, 2).forEach((topic) => {
        recs.push({ type: "lesson", action: "search-based", topic, label: `Based on your searches: "${topic}"`, source: "adaptive-search" });
      });
    }

    // Sort by priority
    return recs.slice(0, 6);
  }

  // ---- Recovery Trend (local helper) ------------------------
  function getRecoveryTrend(rec) {
    const history = loadRecoveryHistory();
    const entries = Object.entries(history).sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length < 3) return null;
    const recent = entries.slice(-5);
    const scores = recent.map(([, v]) => v.score).filter((s) => s !== undefined);
    if (scores.length < 3) return null;
    const first = scores[0];
    const last = scores[scores.length - 1];
    const diff = last - first;
    return { trend: diff < -5 ? "declining" : diff > 5 ? "improving" : "stable", dropAmount: diff };
  }

  function loadRecoveryHistory() {
    try { return JSON.parse(localStorage.getItem("ironlog_recovery_history")) || {}; }
    catch { return {}; }
  }

  // ---- Search topic extraction ------------------------------
  function extractSearchTopics(searchHistory) {
    if (!searchHistory || searchHistory.length === 0) return [];
    const topicMap = {};
    const topicKeywords = {
      "fat loss": ["fat loss", "lose fat", "weight loss", "lose weight", "cutting", "cut"],
      "plateau": ["plateau", "stall", "stalled", "stuck"],
      "protein": ["protein", "diet", "nutrition", "eating", "calories", "calorie", "food"],
      "recovery": ["recovery", "sore", "rest", "sleep", "tired", "fatigue", "burnout"],
      "strength": ["bench", "squat", "deadlift", "press", "strong", "strength", "pr"],
      "muscle": ["muscle", "grow", "gain", "size", "hypertrophy"],
      "consistency": ["consistent", "motivation", "habit", "routine", "skip"],
      "programming": ["split", "program", "routine", "p/p/l", "upper", "lower", "full body"],
    };
    searchHistory.forEach((q) => {
      const lower = q.toLowerCase();
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some((kw) => lower.includes(kw))) {
          topicMap[topic] = (topicMap[topic] || 0) + 1;
        }
      }
    });
    return Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  // ---- Workout / Weight helpers (local copies) --------------
  function getWeekSessions() {
    const weekKeys = getWeekDateKeys();
    return (state.sessions || []).filter((s) => s.finishedAt && weekKeys.includes(s.dateKey));
  }
  function getWeekDateKeys() {
    const keys = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      keys.push(getDateKey(d));
    }
    return keys;
  }
  function getStreak() {
    const sessions = (state.sessions || []).filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      if (sessions.some((s) => s.dateKey === key)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }
  function getSearchHistory() {
    try { return JSON.parse(localStorage.getItem("ironlog_search_history")) || []; }
    catch { return []; }
  }
  function getDateKey(date) {
    if (!date) date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }
  function getDaysSinceLastWeight() {
    const log = state.weightLog || [];
    if (!log.length) return null;
    const sorted = log.slice().sort((a, b) => b.date.localeCompare(a.date));
    const last = sorted[0];
    if (!last) return null;
    const today = new Date();
    const lastDate = new Date(last.date + "T00:00:00");
    return Math.round((today - lastDate) / 86400000);
  }
  function getLearningProgress() {
    try { return JSON.parse(localStorage.getItem("ironlog_learning_progress")) || { completed: [] }; }
    catch { return { completed: [] }; }
  }

  // ---- Unified Fitness Profile (persisted + computed) ------
  function getProfile() {
    const state = loadFitnessProfileState();
    return state;
  }

  const PROFILE_STORAGE_KEY = "ironlog_fitness_profile";
  function loadFitnessProfileState() {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {};
  }
  function saveFitnessProfile(profile) {
    try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ }
  }

  // ---- Public API -------------------------------------------
  return {
    runAll: function (engines) {
      try {
        const result = buildProfile(engines);
        // Cache profile for cross-system access
        if (result && result.profile) {
          saveFitnessProfile(result.profile);
        }
        return result;
      } catch (e) {
        return { profile: null, alerts: [], recommendations: [], focus: null };
      }
    },
    getProfile: getProfile,
    getFocusArea: function () {
      const p = getProfile();
      return p && p.focusArea ? p.focusArea : "maintain";
    },
  };
})();
