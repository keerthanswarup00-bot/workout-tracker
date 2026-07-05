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
    const pct = GoalCenter.getGoalProgressPct();
    if (pct !== null && pct !== undefined) return pct;
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
    const goal = CoachEngine.getGoalType();
    const profile = CoachEngine.buildProfile(state);
    const engineResult = CoachEngine.generate(profile);
    const proteinGoal = engineResult?.nutrition?.protein?.recommended || user.proteinGoal || Math.round(profile.weight * 1.6);
    const waterGoal = engineResult?.nutrition?.water?.liters || (user.waterGoal ? user.waterGoal / 1000 : Math.round(profile.weight * 0.04 * 10) / 10);
    const stepGoal = goal === "lose-fat" ? 12000 : 10000;
    const sleepGoal = 8;

    const weekSessions = getWeekSessions();
    const weekCount = weekSessions.length;
    const hasWorkoutToday = (state.sessions || []).some(
      (s) => s.finishedAt && s.dateKey === getDateKey(new Date())
    );

    const daysSinceWeight = getDaysSinceLastWeight();
    const goalProgress = getGoalProgress();
    const gcPace = GoalCenter.getGoalPaceData();
    const gcHealth = GoalCenter.getGoalHealth();

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
    const gcHasGoal = GoalCenter.hasGoal(GoalCenter.getCurrentGoal());
    if (gcHasGoal && gcPace && gcPace.status === "behind-pace") {
      coachMessage = goal === "lose-fat"
        ? `Fat loss has slowed — let's review your calorie intake and step count to get things moving again.`
        : goal === "build-muscle"
        ? `Weight gain has stalled. A small increase in calories may help restart muscle growth.`
        : `Progress has stalled. Let's look at your training consistency and recovery.`;
    } else if (gcHasGoal && gcPace && gcPace.status === "on-pace" && gcPace.projectedDateStr) {
      coachMessage = `You're on track to reach your goal by ${gcPace.projectedDateStr}. Keep showing up — it's working.`;
    } else if (gcHealth && gcHealth.score !== null && gcHealth.score < 40) {
      coachMessage = "Your goal needs more attention. Let's focus on nutrition, training, and recovery this week.";
    } else if (weekCount >= 4) {
      coachMessage = "Consistency is strong — you're building real momentum. Stay the course.";
    } else if (weekCount >= 2) {
      coachMessage = "Solid consistency this week. One more session would make this a great week.";
    } else if (weekCount >= 1) {
      coachMessage = "Great start this week. Aim for 3-4 training sessions to build steady progress.";
    } else if (hasWorkoutToday) {
      coachMessage = "Nice work getting a session in today. That momentum counts.";
    } else {
      coachMessage = daysSinceWeight && daysSinceWeight > 7
        ? "It's been a few days — a light session is a great way to get back in rhythm."
        : "Complete your first workout to unlock personalized coaching tailored to your goals.";
    }

    const gcWeightData = GoalCenter.getGoalWeightData();
    return {
      greeting: getGreeting().text,
      name: user.name || "there",
      goal: goal,
      goalLabel: getGoalLabel(goal),
      status,
      priorityLevel,
      goalProgress,
      curWeight: weight,
      targetWeight: gcWeightData.targetWeight || user.targetWeight || null,
      startWeight: gcWeightData.startWeight || user.startWeight || null,
      dailyFocus,
      coachMessage,
      weekWorkoutCount: weekCount,
      hasWorkoutToday,
      gcPaceStatus: gcPace ? gcPace.status : null,
      gcHealthScore: gcHealth ? gcHealth.score : null,
      gcHealthLevel: gcHealth ? gcHealth.level : null,
    };
  }

  // ============================================================
  // 2. GOAL STRATEGY ENGINE
  // ============================================================
  function goalStrategy() {
    const user = state.user || {};
    const goal = GoalCenter.getGoalType();
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
          "Low protein intake slows fat loss — prioritize protein at every meal",
          "Excessive cardio can burn muscle alongside fat",
          "Large calorie deficits can lead to metabolic adaptation over time",
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
          "Not enough protein limits muscle growth — aim for consistent daily intake",
          "Too much cardio can interfere with muscle recovery",
          "Inconsistent training stimulus will stall your progress",
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
          "Neglecting form for heavier weight increases injury risk",
          "Insufficient recovery between heavy sessions limits strength gains",
          "Skipping accessory work creates muscle imbalances over time",
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
          "An inconsistent training schedule slows overall progress",
          "Not tracking progress makes it hard to see what's working",
          "Poor sleep undermines every other effort you make",
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
          "Overtraining without adequate recovery leads to burnout",
          "Neglecting strength work limits sport performance",
          "Inconsistent nutrition periodization affects energy availability",
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
      insights.push({ text: `You completed ${weekCount} workouts this week. One more session would make this a great week.`, type: "warning" });
    } else if (weekCount >= 1) {
      insights.push({ text: `You completed ${weekCount} workout${weekCount > 1 ? "s" : ""} this week. Building momentum starts with showing up.`, type: "warning" });
    } else {
      insights.push({ text: "No workouts logged this week. Starting with one session will get things moving.", type: "red" });
    }

    if (prevWeekSessions.length && weekCount > prevWeekSessions.length) {
      insights.push({ text: "Your workout frequency increased compared to last week — progress on consistency.", type: "positive" });
    } else if (prevWeekSessions.length && weekCount < prevWeekSessions.length) {
      insights.push({ text: "You completed fewer workouts than last week. Consistency is the key metric.", type: "warning" });
    }

    // Weight trend
    const latestLog = getLastWeight();
    const curWeight = latestLog ? latestLog.weight : null;
    const user = state.user || {};
    const gcWeightData = GoalCenter.getGoalWeightData();
    const startWeight = gcWeightData.startWeight || user.startWeight || null;
    const targetWeight = gcWeightData.targetWeight || user.targetWeight || null;

    if (curWeight && targetWeight) {
      const goalDiff = targetWeight - curWeight;
      const goal = GoalCenter.getGoalType();
      const isMovingToward = (goal === "lose-fat" && goalDiff < 0) || (goal === "build-muscle" && goalDiff > 0);
      if (Math.abs(goalDiff) < 1) {
        insights.push({ text: `You're very close to your target weight of ${Math.round(targetWeight)}kg.`, type: "positive" });
      } else if (isMovingToward) {
        insights.push({ text: `You're making progress toward your goal weight of ${Math.round(targetWeight)}kg.`, type: "positive" });
      } else {
        insights.push({ text: "Current weight trend is moving away from your target. Let's review nutrition and activity.", type: "red" });
      }
    }

    const daysSinceWeight = getDaysSinceLastWeight();
    if (daysSinceWeight !== null && daysSinceWeight > 10) {
      insights.push({ text: `It's been ${daysSinceWeight} days since your last weight log.`, type: "red" });
    } else if (curWeight) {
      insights.push({ text: "Weight is being tracked consistently — good habit.", type: "positive" });
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
      insights.push({ text: `Your ${streak}-day streak shows consistent dedication.`, type: "positive" });
    } else if (streak >= 3) {
      insights.push({ text: `${streak}-day streak building — keep the momentum going.`, type: "positive" });
    }

    return { insights };
  }

  // ============================================================
  // 4. RECOVERY & READINESS ENGINE
  // ============================================================
  function recovery() {
    const user = state.user || {};
    const goalType = GoalCenter.getGoalType();
    const weekSessions = getWeekSessions();
    const allSessions = (state.sessions || []).filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    const today = new Date();

    // -- Consecutive training days --
    let consCount = 0;
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      if (allSessions.some((s) => s.dateKey === key)) {
        consCount++;
      } else if (i > 0) {
        break;
      }
    }

    // -- Weekly volume (total sets done) --
    const weeklySets = weekSessions.reduce((sum, s) => {
      return sum + (s.exercises || []).reduce((exSum, ex) => {
        return exSum + (ex.sets || []).filter((st) => st.done).length;
      }, 0);
    }, 0);

    // -- Weekly duration (total minutes) --
    const weeklyDuration = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;

    // -- Determine normal volume range per goal --
    // For muscle/strength: higher volume normal. For fat loss: moderate volume.
    const expectedSets = goalType === "lose-fat" ? 60 : goalType === "build-muscle" ? 100 : goalType === "strength" ? 80 : 70;
    const volumeRatio = expectedSets > 0 ? weeklySets / expectedSets : 0.5;

    // -- Volume spike detection (compare last 2 weeks) --
    const prevWeekSessions = (state.sessions || []).filter((s) => {
      if (!s.finishedAt || !s.dateKey) return false;
      const d = new Date();
      const key = getDateKey(new Date(d - 14 * 86400000));
      return s.dateKey >= key && s.dateKey < getDateKey(new Date(d - 7 * 86400000));
    });
    const prevWeekSets = prevWeekSessions.reduce((sum, s) => {
      return sum + (s.exercises || []).reduce((exSum, ex) => {
        return exSum + (ex.sets || []).filter((st) => st.done).length;
      }, 0);
    }, 0);
    const volumeSpike = prevWeekSets > 0 ? (weeklySets - prevWeekSets) / prevWeekSets : 0;

    // -- Sleep estimation (from existing logs if any) --
    // If no sleep logs, use a default assumption
    const recoveryLogs = state.recoveryLog || [];
    const recentRecovery = recoveryLogs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    const sleepEntries = recentRecovery.filter((r) => r.sleepHours);
    const avgSleep = sleepEntries.length > 0
      ? sleepEntries.reduce((sum, r) => sum + r.sleepHours, 0) / sleepEntries.length
      : user.sleepGoal || 7;

    // -- Protein adherence (from daily logs) --
    const proteinGoal = user.proteinGoal || 150;
    let proteinDays = 0;
    const weekKeys = getWeekDateKeys();
    weekKeys.forEach((k) => {
      const dayLogs = state.dailyLogs || {};
      const day = dayLogs[k];
      if (day && day.protein && day.protein >= proteinGoal * 0.8) proteinDays++;
    });

    // ============================================================
    // SCORE COMPONENTS (0-100 total)
    // ============================================================
    // Goal-aware weightings
    let sleepWeight = 30, loadWeight = 25, recoveryDaysWeight = 15, proteinWeight = 10, consistencyWeight = 10, goalStressWeight = 10;
    if (goalType === "lose-fat") {
      goalStressWeight = 15; consistencyWeight = 5; sleepWeight = 30; loadWeight = 20; recoveryDaysWeight = 15; proteinWeight = 15;
    } else if (goalType === "build-muscle") {
      proteinWeight = 15; sleepWeight = 30; loadWeight = 20; recoveryDaysWeight = 15; consistencyWeight = 10; goalStressWeight = 10;
    } else if (goalType === "strength") {
      loadWeight = 30; sleepWeight = 25; recoveryDaysWeight = 15; proteinWeight = 10; consistencyWeight = 10; goalStressWeight = 10;
    }

    // 1. SLEEP (0 to sleepWeight)
    const sleepScoreRaw = avgSleep >= 8 ? 1 : avgSleep >= 7 ? 0.8 : avgSleep >= 6 ? 0.5 : 0.2;
    const sleepScore = Math.round(sleepScoreRaw * sleepWeight);

    // 2. TRAINING LOAD (0 to loadWeight)
    let loadScoreRaw = 1;
    if (volumeRatio > 1.5) loadScoreRaw = 0.2;        // very high volume
    else if (volumeRatio > 1.2) loadScoreRaw = 0.4;   // high volume
    else if (volumeRatio < 0.3) loadScoreRaw = 0.3;   // very low
    else if (volumeRatio < 0.5) loadScoreRaw = 0.6;   // low
    if (volumeSpike > 0.5) loadScoreRaw = Math.min(loadScoreRaw, 0.3);  // spike overrides
    else if (volumeSpike > 0.3) loadScoreRaw = Math.min(loadScoreRaw, 0.5);
    const loadScore = Math.round(loadScoreRaw * loadWeight);

    // 3. RECOVERY DAYS (0 to recoveryDaysWeight)
    const recoveryDays = 7 - weekSessions.length;
    const recoveryDaysRaw = recoveryDays >= 3 ? 1 : recoveryDays >= 2 ? 0.8 : recoveryDays >= 1 ? 0.5 : 0.2;
    const recoveryDaysScore = Math.round(recoveryDaysRaw * recoveryDaysWeight);

    // 4. PROTEIN ADHERENCE (0 to proteinWeight)
    const proteinRaw = proteinDays / 7;
    const proteinScore = Math.round(proteinRaw * proteinWeight);

    // 5. CONSISTENCY (0 to consistencyWeight)
    // Penalize for high consecutive training days
    let consistencyRaw = 1;
    if (consCount >= 6) consistencyRaw = 0.2;
    else if (consCount >= 5) consistencyRaw = 0.4;
    else if (consCount >= 4) consistencyRaw = 0.6;
    else if (consCount >= 3) consistencyRaw = 0.8;
    const consistencyScore = Math.round(consistencyRaw * consistencyWeight);

    // 6. GOAL STRESS (0 to goalStressWeight)
    let goalStressRaw = 1;
    if (goalType === "lose-fat") {
      const gcWI = GoalCenter.getWeightIntelligence();
      const weeklyChange = gcWI.weeklyChange !== null ? Math.abs(gcWI.weeklyChange) : 0;
      if (weeklyChange > 1) goalStressRaw = 0.2;       // aggressive loss
      else if (weeklyChange > 0.7) goalStressRaw = 0.5; // fast loss
      else if (weeklyChange < 0.1 && gcWI.trendDirection === "increasing") goalStressRaw = 0.9;
    }
    const goalStressScore = Math.round(goalStressRaw * goalStressWeight);

    // -- Total --
    const totalScore = sleepScore + loadScore + recoveryDaysScore + proteinScore + consistencyScore + goalStressScore;
    const score = Math.round(Math.max(0, Math.min(100, totalScore)));

    // -- Readiness state --
    let status, label;
    if (score >= 90) { status = "peak"; label = "Peak Readiness"; }
    else if (score >= 75) { status = "ready"; label = "Ready"; }
    else if (score >= 60) { status = "moderate"; label = "Moderate Fatigue"; }
    else if (score >= 40) { status = "low"; label = "Recovery Recommended"; }
    else { status = "critical"; label = "High Fatigue"; }

    // -- Fatigue detection --
    const fatigueFlags = [];
    if (consCount >= 5) fatigueFlags.push({ type: "cons-days", severity: "high", text: `${consCount} consecutive training days` });
    if (volumeSpike > 0.5) fatigueFlags.push({ type: "volume-spike", severity: "high", text: `Volume spike of ${Math.round(volumeSpike * 100)}% vs last week` });
    else if (volumeSpike > 0.3) fatigueFlags.push({ type: "volume-spike", severity: "moderate", text: `Volume increased ${Math.round(volumeSpike * 100)}% — monitor fatigue` });
    if (avgSleep < 6) fatigueFlags.push({ type: "low-sleep", severity: "high", text: `Sleep under 6 hours (${avgSleep.toFixed(1)}h avg)` });
    else if (avgSleep < 7) fatigueFlags.push({ type: "low-sleep", severity: "moderate", text: `Sleep under 7 hours (${avgSleep.toFixed(1)}h avg)` });
    if (proteinDays < 5) fatigueFlags.push({ type: "low-protein", severity: "moderate", text: `Protein target hit ${proteinDays}/7 days` });

    // -- Recommendations --
    const recs = [];
    if (status === "peak" || status === "ready") {
      if (consCount <= 3) recs.push({ action: "push", text: "You're ready to train hard today — make it count.", priority: 1 });
      else recs.push({ action: "push", text: "Good recovery supports intensity. Push hard today.", priority: 1 });
    } else if (status === "moderate") {
      if (consCount >= 4) recs.push({ action: "reduce", text: "Consider reducing training volume by 20-30% today.", priority: 1 });
      else recs.push({ action: "normal", text: "Train as planned but pay attention to how you feel.", priority: 1 });
      recs.push({ action: "recover", text: "A 20-minute walk can help promote blood flow and recovery.", priority: 2 });
    } else if (status === "low") {
      recs.push({ action: "rest", text: "A rest day or light active recovery will serve you best today.", priority: 1 });
      recs.push({ action: "recover", text: "Aim for 8+ hours of sleep tonight to support recovery.", priority: 2 });
      recs.push({ action: "recover", text: "Stay hydrated and eat at maintenance calories.", priority: 3 });
    } else {
      recs.push({ action: "rest", text: "Your body is showing signs of accumulated fatigue. Rest today.", priority: 1 });
      recs.push({ action: "recover", text: "Focus on sleep quality, hydration, and stress management.", priority: 2 });
      recs.push({ action: "recover", text: "Consider a recovery week with reduced intensity and volume.", priority: 3 });
    }

    // Additional context-aware recs
    if (avgSleep < 6.5) recs.push({ action: "sleep", text: `Sleep is averaging ${avgSleep.toFixed(1)}h — aim for 8 hours tonight to support recovery.`, priority: 2 });
    if (proteinDays < 5) recs.push({ action: "nutrition", text: `Protein intake has been low on ${7 - proteinDays} days. Prioritize protein for recovery.`, priority: 3 });
    if (volumeSpike > 0.5) recs.push({ action: "reduce", text: "Training volume spiked sharply. Take extra rest between sets to manage fatigue.", priority: 2 });

    // -- Coach message --
    let coachMessage;
    if (score >= 90) coachMessage = "You're fully recovered and ready to perform at your best today.";
    else if (score >= 75) coachMessage = "Recovery is solid — today is a great day for hard training.";
    else if (score >= 60) coachMessage = "You're carrying some fatigue. Train smart and listen to your body today.";
    else if (score >= 40) coachMessage = "Recovery needs attention. Consider a lighter session or rest day.";
    else coachMessage = "Your body needs rest. Recovery should be today's priority.";

    // -- Trend (compare to yesterday's recovery) --
    const history = loadRecoveryHistory();
    const todayKey = getDateKey();
    const yesterdayKey = getDateKey(new Date(today - 86400000));
    const yesterdayScore = history[yesterdayKey]?.score ?? null;
    const trend = yesterdayScore !== null ? score - yesterdayScore : null;

    // -- Save today's score --
    saveRecoveryScore(todayKey, {
      score, status, label, sleepScore, loadScore, recoveryDaysScore, proteinScore, consistencyScore, goalStressScore,
      avgSleep, weeklySets, weeklyDuration, consCount, volumeSpike, fatigueFlags, coachMessage,
    });

    return {
      score,
      status,
      label,
      trend,
      components: {
        sleep: { score: sleepScore, max: sleepWeight, raw: sleepScoreRaw },
        trainingLoad: { score: loadScore, max: loadWeight, raw: loadScoreRaw },
        recoveryDays: { score: recoveryDaysScore, max: recoveryDaysWeight, raw: recoveryDaysRaw },
        protein: { score: proteinScore, max: proteinWeight, raw: proteinRaw },
        consistency: { score: consistencyScore, max: consistencyWeight, raw: consistencyRaw },
        goalStress: { score: goalStressScore, max: goalStressWeight, raw: goalStressRaw },
      },
      details: {
        avgSleep,
        weeklySets,
        weeklyDuration,
        consecutiveTrainingDays: consCount,
        recoveryDays,
        proteinDays,
        volumeRatio,
        volumeSpike,
        fatigueFlags,
      },
      coachMessage,
      recommendations: recs,
    };
  }

  // ---- Recovery History (internal) ----
  const RECOVERY_HISTORY_KEY = "ironlog_recovery_history";
  function loadRecoveryHistory() {
    try { return JSON.parse(localStorage.getItem(RECOVERY_HISTORY_KEY)) || {}; }
    catch { return {}; }
  }
  function saveRecoveryScore(dateKey, data) {
    const all = loadRecoveryHistory();
    all[dateKey] = { ...data, savedAt: Date.now() };
    localStorage.setItem(RECOVERY_HISTORY_KEY, JSON.stringify(all));
    return all;
  }

  // ---- Readiness query helper (for UI) ----
  function readiness(recoveryResult) {
    const r = recoveryResult || recovery();
    const history = loadRecoveryHistory();
    const entries = Object.entries(history).sort((a, b) => a[0].localeCompare(b[0]));
    const weekScores = entries.slice(-7).map(([, v]) => v.score).filter((s) => s !== undefined);
    const monthScores = entries.slice(-30).map(([, v]) => v.score).filter((s) => s !== undefined);
    const weekAvg = weekScores.length > 0 ? Math.round(weekScores.reduce((a, b) => a + b, 0) / weekScores.length) : null;
    const monthAvg = monthScores.length > 0 ? Math.round(monthScores.reduce((a, b) => a + b, 0) / monthScores.length) : null;
    const best = weekScores.length > 0 ? Math.max(...weekScores) : null;
    const worst = weekScores.length > 0 ? Math.min(...weekScores) : null;
    const streak = r.details ? r.details.consecutiveTrainingDays : 0;

    return {
      history: entries.slice(-30).map(([date, data]) => ({ date, score: data.score, status: data.status })),
      weekAvg,
      monthAvg,
      best,
      worst,
      streak,
      totalDaysLogged: entries.length,
    };
  }

  // ============================================================
  // 5. NUTRITION ENGINE
  // ============================================================
  function nutrition() {
    const user = state.user || {};
    const goal = CoachEngine.getGoalType();
    const profile = CoachEngine.buildProfile(state);
    const engineResult = CoachEngine.generate(profile);
    const targetWeight = getLastWeight()?.weight || user.weight || 70;

    const proteinTarget = engineResult?.nutrition?.protein?.recommended || user.proteinGoal || Math.round(targetWeight * 1.6);
    const waterTarget = engineResult?.nutrition?.water?.liters || (user.waterGoal ? user.waterGoal / 1000 : Math.round(targetWeight * 0.04 * 10) / 10);

    const calVal = engineResult?.energy?.target;
    const tdeeVal = engineResult?.energy?.tdee;
    let calories;
    if (calVal && tdeeVal) {
      const diff = calVal - tdeeVal;
      if (diff < 0) calories = `Maintenance ${diff} kcal`;
      else if (diff > 0) calories = `Maintenance +${diff} kcal`;
      else calories = "Maintenance";
    } else {
      calories = goal === "lose-fat" ? "Maintenance - 400"
        : goal === "build-muscle" ? "Maintenance + 250"
        : goal === "strength" ? "Maintenance + 200"
        : "Maintenance";
    }

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
    const gcWeightData = GoalCenter.getGoalWeightData();
    const targetWeight = gcWeightData.targetWeight || user.targetWeight || null;
    const startWeight = gcWeightData.startWeight || user.startWeight || curWeight;

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

    // Projected date from Goal Center (more accurate)
    let projectedDate = null;
    const gcPace = GoalCenter.getGoalPaceData();
    if (gcPace && gcPace.projectedDate) {
      projectedDate = gcPace.projectedDate;
    } else if (pct !== null && pct > 0 && pct < 100) {
      const weekSessions = getWeekSessions();
      const weekCount = weekSessions.length;
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

    const gcHealth = GoalCenter.getGoalHealth();
    return {
      goalProgress: pct,
      status,
      curWeight,
      targetWeight,
      startWeight,
      remainingWeight: remaining,
      weightLost: lost,
      projectedDate,
      gcPaceStatus: gcPace ? gcPace.status : null,
      gcHealthScore: gcHealth ? gcHealth.score : null,
      gcHealthLevel: gcHealth ? gcHealth.level : null,
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
    const gcWeightData = GoalCenter.getGoalWeightData();
    const startWeight = gcWeightData.startWeight || user.startWeight || null;
    const weightChange = startWeight && curWeight ? +(curWeight - startWeight).toFixed(1) : null;

    const goalType = GoalCenter.getGoalType();
    const gcPace = GoalCenter.getGoalPaceData();
    const gcHealth = GoalCenter.getGoalHealth();
    const gcWI = GoalCenter.getWeightIntelligence();

    const proteinGoal = user.proteinGoal || Math.round((curWeight || 70) * (goalType === "lose-fat" ? 2.2 : goalType === "build-muscle" ? 2 : 1.8));
    const stepGoal = goalType === "lose-fat" ? 12000 : 10000;

    // -- Adherence --
    let daysWithProtein = 0;
    let daysWithSteps = 0;
    weekSessions.forEach((s) => {
      const dayLogs = state.dailyLogs || {};
      const day = dayLogs[s.dateKey];
      if (day) {
        if (day.protein && day.protein >= proteinGoal * 0.8) daysWithProtein++;
        if (day.steps && day.steps >= stepGoal * 0.8) daysWithSteps++;
      }
    });

    // Also check non-workout days for steps/protein
    const weekKeys = getWeekDateKeys();
    weekKeys.forEach((k) => {
      const dayLogs = state.dailyLogs || {};
      const day = dayLogs[k];
      if (day) {
        const hasSession = weekSessions.some((s) => s.dateKey === k);
        if (!hasSession) {
          if (day.protein && day.protein >= proteinGoal * 0.8) daysWithProtein = Math.min(7, daysWithProtein + 1);
          if (day.steps && day.steps >= stepGoal * 0.8) daysWithSteps = Math.min(7, daysWithSteps + 1);
        }
      }
    });
    daysWithProtein = Math.min(7, daysWithProtein);
    daysWithSteps = Math.min(7, daysWithSteps);

    const recommendedWorkouts = user.trainingDays || 6;
    const prevWeekCount = (state.sessions || []).filter((s) => {
      if (!s.finishedAt || !s.dateKey) return false;
      const now = new Date();
      const day = 86400000;
      const date = parseDateKey(s.dateKey);
      return date >= new Date(now - 14 * day) && date < new Date(now - 7 * day);
    }).length;

    // -- Coach Score Breakdown --
    const workoutScore = Math.min(30, Math.round((Math.min(weekCount, recommendedWorkouts) / recommendedWorkouts) * 30));
    const proteinScore = Math.min(20, Math.round((daysWithProtein / 7) * 20));
    const recoveryData = recovery();
    const readinessData = readiness();
    const recoveryScore = Math.min(15, Math.round((recoveryData.score / 100) * 15));
    const stepsScore = Math.min(15, Math.round((daysWithSteps / 7) * 15));
    const trackingScore = Math.min(10, gcWI.loggingScore);
    const streak = getStreak();
    const consistencyScore = streak >= 7 ? 10 : streak >= 3 ? 7 : streak >= 1 ? 4 : 0;
    const totalScore = workoutScore + proteinScore + recoveryScore + stepsScore + trackingScore + consistencyScore;

    // -- Assessment --
    const status = totalScore >= 80 ? "excellent" : totalScore >= 60 ? "good" : totalScore >= 40 ? "needs-work" : "inactive";
    const assessment = weekCount >= Math.ceil(recommendedWorkouts * 0.75)
      ? { label: "Excellent Week", score: status }
      : weekCount >= Math.ceil(recommendedWorkouts * 0.4)
      ? { label: "Good Week", score: status }
      : weekCount > 0
      ? { label: "Needs Improvement", score: status }
      : { label: "Inactive Week", score: status };

    // -- Recommendation --
    let recommendation;
    if (gcPace && gcPace.status === "behind-pace" && goalType === "lose-fat") {
      recommendation = `You're ${Math.abs(gcPace.actualWeeklyRate || 0).toFixed(1)}kg/week behind your target pace. Let's tighten the calorie deficit and increase daily steps.`;
    } else if (gcPace && gcPace.status === "behind-pace" && goalType === "build-muscle") {
      recommendation = "Weight gain has stalled. Increasing your calorie surplus and prioritizing protein should help restart growth.";
    } else if (gcHealth && gcHealth.score !== null && gcHealth.score < 50) {
      recommendation = "Your goal health score needs attention. Let's review nutrition, training volume, and recovery this week.";
    } else if (weekCount < 3) {
      recommendation = "Building consistency is the priority. Aim for at least 3 workouts next week.";
    } else if (weightChange !== null && weightChange > 0 && goalType === "lose-fat") {
      recommendation = "Weight increased slightly this week. Review calorie intake and step count to stay on track.";
    } else if (weightChange !== null && weightChange < -0.5 && goalType === "build-muscle") {
      recommendation = "Weight dropped this week. Increasing calorie intake will help support muscle growth.";
    } else {
      recommendation = "Consistency is strong — consider increasing intensity or volume next week to keep progressing.";
    }

    // -- Weekly Date Range --
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStr = `${weekStart.getMonth()+1}/${weekStart.getDate()} – ${weekEnd.getMonth()+1}/${weekEnd.getDate()}`;
    const weekNumber = Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + weekStart.getDay() + 1) / 7);

    // -- Biggest Win --
    let biggestWin = `You completed every planned workout this week.`;
    if (weekCount < recommendedWorkouts) {
      if (weekCount > prevWeekCount) biggestWin = `Workout frequency increased from ${prevWeekCount} to ${weekCount} sessions.`;
      else if (gcWI.weeklyChange !== null && gcWI.weeklyChange < 0) biggestWin = `Weight decreased by ${Math.abs(gcWI.weeklyChange).toFixed(1)}kg.`;
      else if (daysWithProtein >= 6) biggestWin = `Protein target met ${daysWithProtein}/7 days — excellent nutrition consistency.`;
      else if (weekCount >= 3) biggestWin = `Completed ${weekCount} workouts with solid effort.`;
      else biggestWin = `You stayed active — every workout counts toward your goal.`;
    } else if (daysWithProtein >= 6) {
      biggestWin = `Perfect workout attendance + strong protein adherence.`;
    }

    // -- Biggest Limiter --
    let biggestLimiter;
    if (gcWI.plateau && gcWI.plateau.isPlateau) {
      biggestLimiter = `Weight plateau detected — ${gcWI.plateau.daysUnchanged} days without change.`;
    } else if (daysWithProtein < 5) {
      biggestLimiter = `Protein target missed on ${7 - daysWithProtein} days.`;
    } else if (weekCount < Math.ceil(recommendedWorkouts * 0.6)) {
      biggestLimiter = `Only ${weekCount} workouts completed.`;
    } else {
      biggestLimiter = weekCount < 3 ? `Only ${weekCount} workouts — consistency needs improvement.` : "Everything looks solid. Keep it up.";
    }

    // -- Next Week Focus (3 items) --
    const nextWeekFocus = [];
    if (daysWithProtein < 5) nextWeekFocus.push(`Hit ${proteinGoal}g protein daily`);
    else nextWeekFocus.push(`Maintain protein intake at ${proteinGoal}g`);
    if (weekCount < recommendedWorkouts) nextWeekFocus.push(`Complete ${recommendedWorkouts} workouts this week`);
    else nextWeekFocus.push("Continue current training pace");
    if (daysWithSteps < 5) nextWeekFocus.push("Walk 10,000+ steps daily");
    else if (gcWI.weeklyChange !== null && gcWI.weeklyChange > 0 && goalType === "lose-fat") nextWeekFocus.push("Increase daily steps to 12,000");
    else nextWeekFocus.push("Maintain step count");

    // -- Coach Message --
    let coachMessage;
    if (totalScore >= 80) coachMessage = "Excellent week — you're building real momentum across every metric. Keep doing what you're doing.";
    else if (totalScore >= 60) coachMessage = "Solid week. You're showing up consistently. Focus on the areas below to take things to the next level.";
    else if (totalScore >= 40) coachMessage = "You had good moments this week. Pick one area to improve next week — small changes add up.";
    else coachMessage = "Every journey has tough weeks. Start next week with one small, achievable goal to rebuild momentum.";

    // -- Prs this week --
    let prSummary = null;
    const latestPR = getLatestPRSummary();
    if (latestPR && latestPR.improvement) {
      prSummary = `${latestPR.name} +${latestPR.improvement}kg`;
    } else if (latestPR && latestPR.isNew) {
      prSummary = `New PR: ${latestPR.name}`;
    }

    // -- Training Volume --
    let weekVol = 0;
    weekSessions.forEach((s) => {
      (s.exercises || []).forEach((ex) => {
        (ex.sets || []).forEach((st) => {
          if (st.done && Number(st.weight) > 0) weekVol += Number(st.weight) * (Number(st.reps) || 0);
        });
      });
    });

    // -- Weekly report (full) --
    const weekly = {
      workouts: `${weekCount}/${recommendedWorkouts}`,
      weightChange: weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange}kg` : "—",
      proteinDays: `${daysWithProtein}/7 Days`,
      assessment,
      recommendation,
      gcPaceStatus: gcPace ? gcPace.status : null,
      gcHealthScore: gcHealth ? gcHealth.score : null,
      full: {
        weekNumber,
        weekStr,
        coachScore: totalScore,
        status,
        summary: {
          weeksWorkouts: { completed: weekCount, target: recommendedWorkouts, pct: Math.round((weekCount / recommendedWorkouts) * 100) },
          weightChange: gcWI.weeklyChange,
          protein: { daysMet: daysWithProtein, total: 7 },
          steps: { daysMet: daysWithSteps, total: 7 },
          sleepAvg: null,
          recoveryScore: recoveryData.score,
          consistencyPct: Math.min(100, Math.round((weekCount / 7) * 100)),
        },
        scoreBreakdown: {
          workout: { score: workoutScore, max: 30, pct: Math.round((workoutScore / 30) * 100) },
          protein: { score: proteinScore, max: 20, pct: Math.round((proteinScore / 20) * 100) },
          recovery: { score: recoveryScore, max: 15, pct: Math.round((recoveryScore / 15) * 100) },
          activity: { score: stepsScore, max: 15, pct: Math.round((stepsScore / 15) * 100) },
          tracking: { score: trackingScore, max: 10, pct: Math.round((trackingScore / 10) * 100) },
          consistency: { score: consistencyScore, max: 10, pct: Math.round((consistencyScore / 10) * 100) },
        },
        goalAnalysis: {
          goal: goalType,
          goalLabel: GoalCenter.getGoalLabel(),
          currentWeight: curWeight,
          weeklyChange: gcWI.weeklyChange,
          paceStatus: gcPace ? gcPace.status : null,
          projectedDate: gcPace ? gcPace.projectedDateStr : null,
          healthScore: gcHealth ? gcHealth.score : null,
          rateAnalysis: gcWI.rateAnalysis,
        },
        training: {
          frequency: { current: weekCount, previous: prevWeekCount, change: weekCount - prevWeekCount },
          volume: weekVol,
          prs: prSummary,
          missedWorkouts: Math.max(0, recommendedWorkouts - weekCount),
        },
        nutritionAnalysis: {
          protein: { daysMet: daysWithProtein, total: 7, target: proteinGoal },
          steps: { daysMet: daysWithSteps, total: 7, target: stepGoal },
        },
        recoveryAnalysis: {
          score: recoveryData.score,
          status: recoveryData.status,
          label: recoveryData.label,
          consecutiveDays: recoveryData.details.consecutiveTrainingDays,
          weeklyVolume: recoveryData.details.weeklySets,
          recommendations: recoveryData.recommendations.map((r) => r.text),
          weeklyAvg: readinessData.weekAvg,
          best: readinessData.best,
          worst: readinessData.worst,
          trend: recoveryData.trend,
          sleepAvg: recoveryData.details.avgSleep,
          fatigueFlags: recoveryData.details.fatigueFlags,
        },
        biggestWin,
        biggestLimiter,
        nextWeekFocus,
        coachMessage,
      },
    };

    // -- Monthly report --
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
    const monthStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    let monthlyCoachVerdict = "Good Progress";
    if (totalScore >= 80) monthlyCoachVerdict = "Excellent Month — Maintain Current Plan";
    else if (totalScore >= 60) monthlyCoachVerdict = "Good Progress — Keep Building";
    else if (totalScore >= 40) monthlyCoachVerdict = "Mixed Month — Focus on Consistency";

    let monthlyRecommendations = [];
    if (daysWithProtein < 5) monthlyRecommendations.push("Increase daily protein intake to support your goal");
    if (weekCount < recommendedWorkouts * 3) monthlyRecommendations.push("Increase weekly training frequency");
    if (gcWI.weeklyChange !== null && gcWI.weeklyChange > 0 && goalType === "lose-fat") monthlyRecommendations.push("Review calorie deficit and step count");
    if (recoveryData.score < 60) monthlyRecommendations.push("Prioritize sleep and recovery between sessions");
    if (monthlyRecommendations.length === 0) monthlyRecommendations.push("Continue current approach — it is working well");

    const gcMonthlyPace = gcPace && gcPace.status !== "insufficient-data" ? gcPace.status : "insufficient-data";
    const monthly = {
      workouts: monthCount,
      streak,
      prs: prCount,
      weightTrend: monthlyTrend,
      gcPaceStatus: gcMonthlyPace,
      gcHealthScore: gcHealth ? gcHealth.score : null,
      full: {
        month: monthStr,
        coachScore: totalScore,
        goalProgress: gcWI.goalPace ? gcWI.goalPace.achieved : null,
        weightChange: gcWI.monthlyChange,
        strengthChange: prSummary,
        recoveryAvg: readinessData.weekAvg,
        recoveryTrend: recoveryData.trend,
        coachScoreChange: null,
        trend: {
          weight: monthlyTrend,
          strength: prSummary ? "up" : "stable",
          recovery: readinessData.weekAvg !== null ? (readinessData.weekAvg >= 75 ? "good" : readinessData.weekAvg >= 60 ? "moderate" : "low") : "no-data",
          coachScore: null,
          workout: weekCount > prevWeekCount ? "up" : weekCount < prevWeekCount ? "down" : "stable",
        },
        coachVerdict: monthlyCoachVerdict,
        recommendations: monthlyRecommendations,
        plateauAlerts: gcWI.plateau && gcWI.plateau.isPlateau ? [`Weight plateau: ${gcWI.plateau.daysUnchanged} days unchanged`] : [],
      },
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
    const result = {
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

    // Attach CAS (challenges, achievements, streaks) data
    if (typeof CASEngine !== "undefined") {
      try {
        const casData = {
          sessions: state.sessions || [],
          weightLog: state.weightLog || [],
          user: state.user || {},
          prs: state.prs || {},
          plan: state.plan || [],
        };
        result.cas = CASEngine.runAll(casData);

        const today = getDateKey(new Date());
        const hasWorkoutToday = (state.sessions || []).some(
          (s) => s.finishedAt && s.dateKey === today
        );
        if (hasWorkoutToday) {
          CASEngine.markWorkoutDone(today);
        }
      } catch (e) {
        result.cas = null;
      }
    } else {
      result.cas = null;
    }

    // Attach Adaptive Coaching Engine
    if (typeof AdaptiveEngine !== "undefined") {
      try {
        result.adaptive = AdaptiveEngine.runAll(result);
      } catch (e) {
        result.adaptive = { profile: null, alerts: [], recommendations: [], focus: null };
      }
    } else {
      result.adaptive = { profile: null, alerts: [], recommendations: [], focus: null };
    }

    return result;
  }

  // ============================================================
  // Public API
  // ============================================================
  return {
    daily,
    goalStrategy,
    insights,
    recovery,
    readiness,
    nutrition,
    progress,
    reports,
    problemSolver,
    education,
    runAll,
  };
})();
