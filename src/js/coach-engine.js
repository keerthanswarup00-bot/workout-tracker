// ============================================================
// IRONLOG COACH ENGINE V1
// Each engine is independent and returns structured JSON.
// The UI layer consumes engine output — no UI strings in engines.
// ============================================================

const CoachEngine = (() => {
  // ---- Helpers -------------------------------------------------------
  function getWeekDateKeys() {
    const keys = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      keys.push(getDateKey(d));
    }
    return keys;
  }

  function getMonthPrefix() {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  }

  function getLastNSessions(n) {
    return (state.sessions || [])
      .filter((s) => s.finishedAt)
      .slice()
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      .slice(0, n);
  }

  function getWeekSessions() {
    const weekKeys = getWeekDateKeys();
    return (state.sessions || []).filter((s) => s.finishedAt && weekKeys.includes(s.dateKey));
  }

  function getMonthSessions() {
    const prefix = getMonthPrefix();
    return (state.sessions || []).filter((s) => s.finishedAt && s.dateKey && s.dateKey.startsWith(prefix));
  }

  function getLastWeight() {
    const log = state.weightLog || [];
    if (!log.length) return null;
    return log.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  }

  function getLatestPRSummary() {
    if (!state.prs) return null;
    const entries = Object.entries(state.prs).filter(([, d]) => d.history && d.history.length > 0);
    if (!entries.length) return null;
    const sorted = entries.sort((a, b) => b[1].history[b[1].history.length - 1].date.localeCompare(a[1].history[a[1].history.length - 1].date));
    const [name, data] = sorted[0];
    const latest = data.history[data.history.length - 1];
    const prev = data.history.length > 1 ? data.history[data.history.length - 2] : null;
    const improvement = prev && latest.weight ? +(latest.weight - prev.weight).toFixed(1) : null;
    return { name: name.replace(/([A-Z])/g, " $1").trim(), improvement, isNew: !prev };
  }

  function getGoalLabel(id) {
    const labels = {
      "build-muscle": "Muscle Gain",
      "lose-fat": "Fat Loss",
      "strength": "Strength",
      "general": "General Fitness",
      "athletic": "Athletic Performance",
    };
    return labels[id] || "Stay Fit";
  }

  function getGoalProgress() {
    const user = state.user || {};
    const latestLog = getLastWeight();
    const curWeight = latestLog ? latestLog.weight : user.weight || null;
    const targetWeight = user.targetWeight || null;
    const startWeight = user.startWeight || curWeight;
    if (!startWeight || !targetWeight || !curWeight) return null;
    return Math.min(100, Math.max(0, ((startWeight - curWeight) / (startWeight - targetWeight)) * 100));
  }

  // ============================================================
  // 1. DAILY COACH ENGINE
  // ============================================================
  function daily() {
    const user = state.user || {};
    const goal = user.goal || "general";
    const weight = getLastWeight()?.weight || user.weight || 70;
    const proteinGoal = user.proteinGoal || Math.round(weight * (goal === "lose-fat" ? 2.2 : goal === "build-muscle" ? 2 : 1.8));
    const stepGoal = goal === "lose-fat" ? 12000 : 10000;
    const waterGoal = Math.round((user.waterGoal || weight * 0.04) * 10) / 10;
    const sleepGoal = 8;

    const weekSessions = getWeekSessions();
    const weekCount = weekSessions.length;
    const hasWorkoutToday = (state.sessions || []).some(
      (s) => s.finishedAt && s.dateKey === getDateKey(new Date())
    );

    const daysSinceWeight = getDaysSinceLastWeight();
    const goalProgress = getGoalProgress();

    let status = "on_track";
    if (weekCount === 0 && !hasWorkoutToday) status = "needs_attention";
    else if (weekCount < 2) status = "needs_improvement";

    let priorityLevel = "high";
    if (weekCount >= 4) priorityLevel = "maintain";

    const dailyFocus = [];
    dailyFocus.push({ id: "workout", label: hasWorkoutToday ? "Workout Complete" : "Today's Workout", done: hasWorkoutToday, target: "" });
    dailyFocus.push({ id: "protein", label: `${proteinGoal}g Protein`, done: false, target: `${proteinGoal}g` });
    dailyFocus.push({ id: "steps", label: `${stepGoal.toLocaleString()} Steps`, done: false, target: `${stepGoal.toLocaleString()}` });
    dailyFocus.push({ id: "water", label: `${waterGoal}L Water`, done: false, target: `${waterGoal}L` });
    dailyFocus.push({ id: "sleep", label: `${sleepGoal}h Sleep`, done: false, target: `${sleepGoal}h` });

    let coachMessage;
    if (weekCount >= 4) {
      coachMessage = "You are progressing at a healthy pace. Maintain current strategy.";
    } else if (weekCount >= 2) {
      coachMessage = "Good consistency this week. Try to add one more session.";
    } else if (weekCount >= 1) {
      coachMessage = "Great start! Aim for 3-4 workouts this week for steady progress.";
    } else if (hasWorkoutToday) {
      coachMessage = "Great job working out today. Build on this momentum.";
    } else {
      coachMessage = daysSinceWeight && daysSinceWeight > 7
        ? "You haven't logged in a while. Start with a light session to get back on track."
        : "Log your first workout to get personalized coaching.";
    }

    return {
      greeting: getGreeting().text,
      name: user.name || "there",
      goal: goal,
      goalLabel: getGoalLabel(goal),
      status,
      priorityLevel,
      goalProgress,
      curWeight: weight,
      targetWeight: user.targetWeight || null,
      startWeight: user.startWeight || null,
      dailyFocus,
      coachMessage,
      weekWorkoutCount: weekCount,
      hasWorkoutToday,
    };
  }

  // ============================================================
  // 2. GOAL STRATEGY ENGINE
  // ============================================================
  function goalStrategy() {
    const user = state.user || {};
    const goal = user.goal || "general";
    const weight = getLastWeight()?.weight || user.weight || 70;
    const proteinGoal = user.proteinGoal || Math.round(weight * (goal === "lose-fat" ? 2.2 : goal === "build-muscle" ? 2 : 1.8));

    const strategies = {
      "lose-fat": {
        targets: {
          calories: "Maintenance - 400",
          protein: `${proteinGoal}g`,
          steps: "10,000 - 12,000",
          cardio: "3-5 sessions",
        },
        expectedRate: "0.3 - 0.7 kg/week",
        warnings: [
          "Too little protein slows fat loss",
          "Excessive cardio can burn muscle",
          "Large deficits cause metabolic adaptation",
        ],
      },
      "build-muscle": {
        targets: {
          calories: "Maintenance + 250",
          protein: `${proteinGoal}g`,
          steps: "7,000 - 9,000",
          cardio: "1-2 sessions",
        },
        expectedRate: "0.2 - 0.4 kg/week",
        warnings: [
          "Not enough protein limits growth",
          "Too much cardio interferes with recovery",
          "Inconsistent training stimulus stalls progress",
        ],
      },
      strength: {
        targets: {
          calories: "Maintenance + 200",
          protein: `${proteinGoal}g`,
          steps: "6,000 - 8,000",
          cardio: "1-2 sessions",
        },
        expectedRate: "Linear progression on compounds",
        warnings: [
          "Neglecting technique for weight increases injury risk",
          "Insufficient recovery between heavy sessions",
          "Skipping accessory work creates imbalances",
        ],
      },
      general: {
        targets: {
          calories: "Maintenance",
          protein: `${proteinGoal}g`,
          steps: "8,000 - 10,000",
          cardio: "3 sessions",
        },
        expectedRate: "Gradual improvement",
        warnings: [
          "Inconsistent training schedule slows progress",
          "Not tracking progress makes adjustment hard",
          "Poor sleep undermines all other efforts",
        ],
      },
      athletic: {
        targets: {
          calories: "Performance based",
          protein: `${proteinGoal}g`,
          steps: "Activity dependent",
          cardio: "Sport specific",
        },
        expectedRate: "Sport-specific improvement",
        warnings: [
          "Overtraining without adequate recovery",
          "Neglecting strength work for sport practice",
          "Poor nutrition periodization",
        ],
      },
    };

    const strategy = strategies[goal] || strategies.general;

    return {
      goal,
      goalLabel: getGoalLabel(goal),
      targets: strategy.targets,
      expectedRate: strategy.expectedRate,
      warnings: strategy.warnings,
    };
  }

  // ============================================================
  // 3. INSIGHT ENGINE
  // ============================================================
  function insights() {
    const insights = [];

    // Workout frequency
    const weekSessions = getWeekSessions();
    const weekCount = weekSessions.length;
    const prevWeekSessions = (state.sessions || []).filter((s) => {
      if (!s.finishedAt || !s.dateKey) return false;
      const now = new Date();
      const day = 86400000;
      const date = parseDateKey(s.dateKey);
      return date >= new Date(now - 14 * day) && date < new Date(now - 7 * day);
    });

    if (weekCount >= 4) {
      insights.push({ text: `You completed ${weekCount} workouts this week — strong consistency.`, type: "positive" });
    } else if (weekCount >= 2) {
      insights.push({ text: `You completed ${weekCount} workouts this week. Try to add another session.`, type: "warning" });
    } else if (weekCount >= 1) {
      insights.push({ text: `You completed ${weekCount} workout${weekCount > 1 ? "s" : ""} this week.`, type: "warning" });
    } else {
      insights.push({ text: "No workouts logged this week. Start your first session.", type: "red" });
    }

    if (prevWeekSessions.length && weekCount > prevWeekSessions.length) {
      insights.push({ text: "Your workout frequency increased compared to last week.", type: "positive" });
    } else if (prevWeekSessions.length && weekCount < prevWeekSessions.length) {
      insights.push({ text: "You completed fewer workouts than last week.", type: "warning" });
    }

    // Weight trend
    const latestLog = getLastWeight();
    const curWeight = latestLog ? latestLog.weight : null;
    const user = state.user || {};
    const startWeight = user.startWeight || null;
    const targetWeight = user.targetWeight || null;

    if (curWeight && targetWeight) {
      const goalDiff = targetWeight - curWeight;
      const goal = user.goal || "general";
      const isMovingToward = (goal === "lose-fat" && goalDiff < 0) || (goal === "build-muscle" && goalDiff > 0);
      if (Math.abs(goalDiff) < 1) {
        insights.push({ text: `You are very close to your target weight of ${Math.round(targetWeight)}kg.`, type: "positive" });
      } else if (isMovingToward) {
        insights.push({ text: `You are progressing toward your goal weight of ${Math.round(targetWeight)}kg.`, type: "positive" });
      } else {
        insights.push({ text: "Current trend is moving away from your target weight.", type: "red" });
      }
    }

    const daysSinceWeight = getDaysSinceLastWeight();
    if (daysSinceWeight !== null && daysSinceWeight > 10) {
      insights.push({ text: `You haven't logged weight in ${daysSinceWeight} days.`, type: "red" });
    } else if (curWeight) {
      insights.push({ text: "Weight is being tracked consistently.", type: "positive" });
    }

    // PR tracking
    const latestPR = getLatestPRSummary();
    if (latestPR) {
      if (latestPR.isNew) {
        insights.push({ text: `New PR achieved: ${latestPR.name}.`, type: "positive" });
      } else if (latestPR.improvement) {
        insights.push({ text: `${latestPR.name} improved by ${latestPR.improvement}kg.`, type: "positive" });
      }
    }

    // Streak
    const streak = getStreak();
    if (streak >= 7) {
      insights.push({ text: `Your ${streak}-day streak shows great dedication.`, type: "positive" });
    } else if (streak >= 3) {
      insights.push({ text: `${streak}-day streak building. Keep the momentum.`, type: "positive" });
    }

    return { insights };
  }

  // ============================================================
  // 4. RECOVERY ENGINE
  // ============================================================
  function recovery() {
    // Sleep data is not tracked yet, so we derive from training patterns
    const weekSessions = getWeekSessions();
    const monthSessions = getMonthSessions();

    const consecutiveDays = new Set();
    const allSessions = (state.sessions || []).filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    // Count consecutive training days (recent)
    let consCount = 0;
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      if (allSessions.some((s) => s.dateKey === key)) {
        consCount++;
      } else if (i > 0) {
        // Allow a gap of 1 day
        break;
      }
    }

    // Calculate recent volume
    const recentVol = weekSessions.reduce((sum, s) => {
      return sum + (s.exercises || []).reduce((exSum, ex) => {
        return exSum + (ex.sets || []).filter((st) => st.done).reduce((setSum) => setSum + 1, 0);
      }, 0);
    }, 0);

    let score = 100;
    let status = "green";
    const recs = [];

    if (consCount >= 5) {
      score -= 25;
      recs.push("You have trained 5+ days in a row. Consider a rest day.");
    } else if (consCount >= 3) {
      score -= 10;
      recs.push("Multiple consecutive training days — monitor fatigue.");
    }

    if (recentVol > 200) {
      score -= 10;
      recs.push("High weekly volume. Ensure adequate nutrition and sleep.");
    }

    if (weekSessions.length === 0 && consCount === 0) {
      score = 100;
      status = "green";
      recs.length = 0;
      recs.push("Ready to train. You are fully recovered.");
    }

    if (score < 60) status = "red";
    else if (score < 80) status = "yellow";

    return { score, status, consecutiveTrainingDays: consCount, weeklyVolume: recentVol, recommendations: recs };
  }

  // ============================================================
  // 5. NUTRITION ENGINE
  // ============================================================
  function nutrition() {
    const user = state.user || {};
    const goal = user.goal || "general";
    const weight = getLastWeight()?.weight || user.weight || 70;

    const proteinTarget = user.proteinGoal || Math.round(weight * (goal === "lose-fat" ? 2.2 : goal === "build-muscle" ? 2 : 1.8));
    const waterTarget = Math.round((user.waterGoal || weight * 0.04) * 10) / 10;

    const calories = goal === "lose-fat" ? "Maintenance - 400" : goal === "build-muscle" ? "Maintenance + 250" : goal === "strength" ? "Maintenance + 200" : "Maintenance";

    const mealAdvice = goal === "lose-fat"
      ? "Prioritize lean protein sources and fibrous vegetables. Spread protein across 4 meals."
      : goal === "build-muscle"
      ? "Eat protein every 3-4 hours. Include carbs around workouts for performance."
      : "Balance macronutrients across all meals. Prioritize whole foods.";

    return { proteinTarget, waterTarget, calories, mealAdvice };
  }

  // ============================================================
  // 6. PROGRESS ENGINE
  // ============================================================
  function progress() {
    const user = state.user || {};
    const latestLog = getLastWeight();
    const curWeight = latestLog ? latestLog.weight : user.weight || null;
    const targetWeight = user.targetWeight || null;
    const startWeight = user.startWeight || curWeight;

    const pct = getGoalProgress();

    let status = "maintaining";
    if (pct !== null) {
      if (pct >= 100) status = "achieved";
      else if (pct >= 50) status = "on_track";
      else if (pct > 0) status = "moving";
      else status = "off_track";
    }

    const remaining = curWeight && targetWeight ? Math.abs(targetWeight - curWeight) : null;
    const lost = startWeight && curWeight ? Math.abs(startWeight - curWeight) : null;

    // Projected date (rough estimate)
    let projectedDate = null;
    if (pct !== null && pct > 0 && pct < 100) {
      const weekSessions = getWeekSessions();
      const weekCount = weekSessions.length;
      // Assume user logs weight every ~7 days
      const weightLogs = state.weightLog || [];
      if (weightLogs.length >= 2) {
        const sorted = weightLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
        const firstDate = parseDateKey(sorted[sorted.length - 1].date);
        const lastDate = parseDateKey(sorted[0].date);
        const daysDiff = Math.round((lastDate - firstDate) / 86400000) || 1;
        const totalChange = Math.abs((sorted[0].weight || 0) - (sorted[sorted.length - 1].weight || 0));
        const ratePerDay = totalChange / daysDiff;
        if (ratePerDay > 0 && remaining) {
          const daysNeeded = Math.round(remaining / ratePerDay);
          const projected = new Date();
          projected.setDate(projected.getDate() + daysNeeded);
          projectedDate = projected.toISOString();
        }
      }
    }

    // Weekly metrics
    const weekSessions = getWeekSessions();
    const weekCount = weekSessions.length;
    const monthSessions = getMonthSessions();
    const streak = getStreak();
    const prCount = getPRCount();

    let weekVol = 0;
    weekSessions.forEach((s) => {
      (s.exercises || []).forEach((ex) => {
        (ex.sets || []).forEach((st) => {
          if (st.done && Number(st.weight) > 0) weekVol += Number(st.weight) * (Number(st.reps) || 0);
        });
      });
    });

    return {
      goalProgress: pct,
      status,
      curWeight,
      targetWeight,
      startWeight,
      remainingWeight: remaining,
      weightLost: lost,
      projectedDate,
      weekly: {
        workouts: weekCount,
        volume: weekVol,
        consistency: weekCount > 0 ? Math.min(100, Math.round((weekCount / 7) * 100)) : 0,
      },
      monthly: {
        workouts: monthSessions.length,
        streak,
        prs: prCount,
      },
    };
  }

  // ============================================================
  // 7. REPORT ENGINE (Weekly + Monthly)
  // ============================================================
  function reports() {
    const user = state.user || {};
    const weekSessions = getWeekSessions();
    const monthSessions = getMonthSessions();
    const weekCount = weekSessions.length;
    const latestLog = getLastWeight();
    const curWeight = latestLog ? latestLog.weight : user.weight || null;
    const startWeight = user.startWeight || null;
    const weightChange = startWeight && curWeight ? +(curWeight - startWeight).toFixed(1) : null;

    const daysWithProtein = weekSessions.filter((s) => {
      const dayLogs = state.dailyLogs || {};
      const dayKey = s.dateKey;
      const day = dayLogs[dayKey];
      return day && day.protein && day.protein >= (user.proteinGoal || 150) * 0.8;
    }).length;

    const recommendedWorkouts = user.trainingDays || 6;

    // Weekly report
    const assessment = weekCount >= Math.ceil(recommendedWorkouts * 0.75)
      ? { label: "Excellent Week", score: "excellent" }
      : weekCount >= Math.ceil(recommendedWorkouts * 0.4)
      ? { label: "Good Week", score: "good" }
      : weekCount > 0
      ? { label: "Needs Improvement", score: "needs_work" }
      : { label: "Inactive Week", score: "inactive" };

    let recommendation;
    if (weekCount < 3) {
      recommendation = "Aim for at least 3 workouts next week to build consistency.";
    } else if (weightChange !== null && weightChange > 0 && user.goal === "lose-fat") {
      recommendation = "Weight increased slightly. Review calorie intake and step count.";
    } else if (weightChange !== null && weightChange < -0.5 && user.goal === "build-muscle") {
      recommendation = "Weight dropped. Increase calorie intake to support muscle growth.";
    } else {
      recommendation = "Great consistency. Consider increasing intensity or volume next week.";
    }

    const weekly = {
      workouts: `${weekCount}/${recommendedWorkouts}`,
      weightChange: weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange}kg` : "—",
      proteinDays: `${daysWithProtein}/7 Days`,
      assessment,
      recommendation,
    };

    // Monthly report
    const monthCount = monthSessions.length;
    let monthlyTrend = "stable";
    const weightLogs = state.weightLog || [];
    if (weightLogs.length >= 3) {
      const sorted = weightLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
      const recent = sorted.slice(0, 3);
      const weights = recent.map((w) => w.weight);
      if (weights.length >= 2) {
        const diff = weights[0] - weights[weights.length - 1];
        monthlyTrend = diff > 0.5 ? "increasing" : diff < -0.5 ? "decreasing" : "stable";
      }
    }

    const prCount = getPRCount();
    const streak = getStreak();

    const monthly = {
      workouts: monthCount,
      streak,
      prs: prCount,
      weightTrend: monthlyTrend,
    };

    return { weekly, monthly };
  }

  // ============================================================
  // 8. PROBLEM SOLVER ENGINE
  // ============================================================
  function problemSolver() {
    return {
      problems: [
        { id: "cant-lose-weight", title: "Can't lose weight", desc: "Fat loss has stalled", icon: "scale" },
        { id: "cant-gain-muscle", title: "Can't gain muscle", desc: "Size isn't increasing", icon: "muscle" },
        { id: "bench-stalled", title: "Bench has stalled", desc: "No progress in weeks", icon: "barbell" },
        { id: "always-sore", title: "Always sore", desc: "Recovery issues", icon: "refresh" },
        { id: "not-recovering", title: "Not recovering", desc: "Fatigue is building", icon: "sleep" },
        { id: "need-split", title: "Need a split", desc: "Not sure what to run", icon: "grid" },
      ],
    };
  }

  // ============================================================
  // 9. EDUCATION ENGINE
  // ============================================================
  function education() {
    return {
      categories: [
        { name: "Progressive Overload", lessons: 8, level: "intermediate" },
        { name: "Nutrition Basics", lessons: 12, level: "beginner" },
        { name: "Fat Loss Science", lessons: 6, level: "intermediate" },
        { name: "Recovery & Sleep", lessons: 5, level: "beginner" },
        { name: "Strength Fundamentals", lessons: 7, level: "intermediate" },
        { name: "Cardio for Fat Loss", lessons: 4, level: "beginner" },
      ],
      popularExercises: [
        { name: "Bench Press", muscle: "Chest", difficulty: "Intermediate", equipment: "Barbell" },
        { name: "Squat", muscle: "Legs", difficulty: "Intermediate", equipment: "Barbell" },
        { name: "Deadlift", muscle: "Back", difficulty: "Advanced", equipment: "Barbell" },
        { name: "Pull Up", muscle: "Back", difficulty: "Intermediate", equipment: "Bodyweight" },
        { name: "Lat Pulldown", muscle: "Back", difficulty: "Beginner", equipment: "Cable" },
        { name: "Lateral Raise", muscle: "Shoulders", difficulty: "Beginner", equipment: "Dumbbell" },
        { name: "Leg Press", muscle: "Legs", difficulty: "Beginner", equipment: "Machine" },
        { name: "Romanian Deadlift", muscle: "Legs", difficulty: "Intermediate", equipment: "Barbell" },
      ],
    };
  }

  // ============================================================
  // 10. MASTER ORCHESTRATOR — runs all engines at once
  // ============================================================
  function runAll() {
    return {
      daily: daily(),
      goalStrategy: goalStrategy(),
      insights: insights(),
      recovery: recovery(),
      nutrition: nutrition(),
      progress: progress(),
      reports: reports(),
      problemSolver: problemSolver(),
      education: education(),
    };
  }

  // ============================================================
  // Public API
  // ============================================================
  return {
    daily,
    goalStrategy,
    insights,
    recovery,
    nutrition,
    progress,
    reports,
    problemSolver,
    education,
    runAll,
  };
})();
