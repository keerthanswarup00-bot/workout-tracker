// ============================================================
// STRIV PROGRAM REVIEW & ADJUSTMENT ENGINE
// Evaluates training program effectiveness every 4 weeks.
// Recommends smallest change first (consistency → structure).
// ============================================================

/* global state:readonly, GoalCenter:readonly, CoachEngine:readonly */

const ProgramReviewEngine = (() => {
  const STORAGE_KEY = "striv_program_review";

  // ---- Helpers -------------------------------------------------------
  function getDateKey(date) {
    const d = date || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
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

  function getMonthPrefix() {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
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

  function getWeightTrend(days) {
    const log = state.weightLog || [];
    if (log.length < 2) return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recent = log
      .filter((e) => new Date(e.date) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (recent.length < 2) return null;
    const first = recent[0].weight;
    const last = recent[recent.length - 1].weight;
    const diff = last - first;
    const daysSpan = (new Date(recent[recent.length - 1].date) - new Date(recent[0].date)) / 86400000;
    return { totalChange: diff, weeklyRate: daysSpan > 0 ? (diff / daysSpan) * 7 : 0, direction: diff < -0.3 ? "down" : diff > 0.3 ? "up" : "stable" };
  }

  function getLatestPRSummary() {
    if (!state.prs) return null;
    const entries = Object.entries(state.prs).filter(([, d]) => d.history && d.history.length > 0);
    if (!entries.length) return null;
    let latest = null;
    let latestDate = "";
    entries.forEach(([name, data]) => {
      const sorted = data.history.slice().sort((a, b) => b.date.localeCompare(a.date));
      if (sorted.length && sorted[0].date > latestDate) {
        latestDate = sorted[0].date;
        latest = { name, weight: sorted[0].weight, date: sorted[0].date };
      }
    });
    return latest;
  }

  // ---- Load / Save review history -----------------------------------
  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { reviews: [], lastReviewDate: null };
    } catch {
      return { reviews: [], lastReviewDate: null };
    }
  }

  function saveHistory(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ---- Goal Progress Review -----------------------------------------
  function getGoalProgress() {
    const goalType = typeof GoalCenter !== "undefined" ? GoalCenter.getGoalType() : (state.user && state.user.goal) || "";
    const gcWeight = typeof GoalCenter !== "undefined" ? GoalCenter.getGoalWeightData() : null;
    const startWeight = gcWeight ? gcWeight.startWeight : (state.user ? state.user.startWeight : null);
    const targetWeight = gcWeight ? gcWeight.targetWeight : (state.user ? state.user.targetWeight : null);
    const latestLog = getLastWeight();
    const curWeight = latestLog ? latestLog.weight : null;

    const trend = getWeightTrend(28);
    const weeklyRate = trend ? trend.weeklyRate : null;
    const trendDir = trend ? trend.direction : "unknown";

    let status = "insufficient-data";
    let summary = "";
    let progress = null;

    if (goalType === "lose-fat") {
      if (curWeight && targetWeight) {
        const totalPct = startWeight ? ((startWeight - curWeight) / (startWeight - targetWeight)) * 100 : 0;
        progress = Math.min(100, Math.max(0, totalPct));
        if (trendDir === "down" && weeklyRate < 0) {
          const absRate = Math.abs(weeklyRate);
          if (absRate >= 0.3 && absRate <= 0.7) {
            status = "on-pace";
            summary = "Fat loss is progressing at a sustainable rate. Current strategy is working well.";
          } else if (absRate > 0.7) {
            status = "fast";
            summary = "Weight is dropping quickly. Monitor for sustainability and ensure adequate nutrition.";
          } else if (absRate > 0.1) {
            status = "slow";
            summary = "Fat loss is progressing slowly. Consider tightening nutrition or increasing activity.";
          } else {
            status = "plateau";
            summary = "Weight has stabilized. A review of calorie intake and energy expenditure is recommended.";
          }
        } else if (trendDir === "up") {
          status = "off-track";
          summary = "Weight is trending upward. This may indicate calorie intake exceeds expenditure.";
        } else if (weeklyRate !== null && Math.abs(weeklyRate) <= 0.1) {
          status = "plateau";
          summary = "Weight has plateaued for some time. Let's review nutrition and activity levels.";
        } else {
          status = "stable";
          summary = "Weight is stable. Fat loss requires a consistent calorie deficit to resume.";
        }
      } else {
        summary = "Log your weight regularly to track fat loss progress.";
      }
    } else if (goalType === "build-muscle") {
      if (curWeight && targetWeight) {
        const totalPct = startWeight ? ((curWeight - startWeight) / (targetWeight - startWeight)) * 100 : 0;
        progress = Math.min(100, Math.max(0, totalPct));
        if (trendDir === "up" && weeklyRate > 0) {
          const absRate = Math.abs(weeklyRate);
          if (absRate >= 0.2 && absRate <= 0.5) {
            status = "on-pace";
            summary = "Weight gain is on track at a controlled rate. Continue the current strategy.";
          } else if (absRate > 0.5) {
            status = "fast";
            summary = "Weight is increasing rapidly. Consider adjusting calorie surplus to minimize fat gain.";
          } else {
            status = "slow";
            summary = "Weight gain is slower than ideal. Increasing calorie intake may help.";
          }
        } else if (trendDir === "down" || (weeklyRate !== null && weeklyRate < 0)) {
          status = "off-track";
          summary = "Weight is decreasing. Increase calorie intake to support muscle growth.";
        } else if (weeklyRate !== null && Math.abs(weeklyRate) <= 0.1) {
          status = "plateau";
          summary = "Weight has plateaued. Consider increasing calorie surplus and reviewing training stimulus.";
        } else {
          status = "stable";
          summary = "Weight is stable. Muscle building requires a consistent calorie surplus.";
        }
      } else {
        summary = "Log your weight regularly to track muscle gain progress.";
      }
    } else if (goalType === "strength") {
      const prTrend = getLatestPRSummary();
      status = prTrend ? "on-pace" : "insufficient-data";
      progress = prTrend ? 50 : null;
      summary = prTrend ? "Strength is being tracked through PR progress. Focus on progressive overload across main lifts." : "Log PRs to enable strength progress tracking.";
    } else if (goalType) {
      if (curWeight) {
        status = "maintaining";
        progress = 50;
        summary = "Progress is measured through overall consistency and wellbeing.";
      } else {
        summary = "Set target metrics to track progress effectively.";
      }
    } else {
      summary = "Set a fitness goal to begin tracking progress.";
    }

    return {
      goalType,
      startWeight,
      currentWeight: curWeight,
      targetWeight,
      weeklyRate,
      trendDirection: trendDir,
      status,
      progress,
      summary,
    };
  }

  // ---- Training Effectiveness Review --------------------------------
  function getTrainingEffectiveness() {
    const sessions = state.sessions || [];
    const finished = sessions.filter((s) => s.finishedAt);
    const weekSessions = getWeekSessions();
    const monthSessions = getMonthSessions();

    const totalPlanned = (state.plan || []).length;
    const completionPct = totalPlanned > 0 ? (finished.length / (state.plan ? state.plan.reduce((sum, w) => sum + (w.exercises ? w.exercises.length : 0), 0) : 1)) * 100 : null;

    const weekCount = weekSessions.length;
    const monthCount = monthSessions.length;
    const prevMonthCount = (state.sessions || []).filter((s) => {
      if (!s.finishedAt) return false;
      const d = new Date(s.dateKey);
      const now = new Date();
      const prevMonth = new Date(now);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      return d >= prevMonth && d < new Date(now.getFullYear(), now.getMonth(), 1);
    }).length;

    const frequencyTrend = monthCount > prevMonthCount ? "up" : monthCount < prevMonthCount ? "down" : "stable";

    const prCount = state.prs ? Object.values(state.prs).filter((p) => {
      if (!p.history || !p.history.length) return false;
      const monthPrefix = getMonthPrefix();
      return p.history.some((h) => h.date && h.date.startsWith(monthPrefix));
    }).length : 0;

    const missedWorkouts = Math.max(0, (totalPlanned || 4) - weekCount);
    const avgVolumePerSession = weekCount > 0
      ? weekSessions.reduce((sum, s) => sum + (s.exercises ? s.exercises.length : 0), 0) / weekCount
      : 0;

    let verdict = "";
    if (weekCount >= 4) {
      verdict = "Training consistency is strong. You're hitting your sessions regularly.";
    } else if (weekCount >= 3) {
      verdict = "Good consistency this week. Room to add another session.";
    } else if (weekCount >= 2) {
      verdict = "Inconsistent training frequency. Aim for at least 3 sessions per week.";
    } else if (weekCount >= 1) {
      verdict = "Low training frequency. Consistency is the foundation of progress.";
    } else {
      verdict = "No workouts logged this week. Start with a single session to rebuild momentum.";
    }

    return {
      completionPct,
      weekCount,
      monthCount,
      frequencyTrend,
      prCount,
      missedWorkouts,
      avgVolumePerSession,
      verdict,
    };
  }

  // ---- Recovery Review ----------------------------------------------
  function getRecoveryReview() {
    let recoveryScore = null;
    let avgSleep = null;

    if (typeof CoachEngine !== "undefined") {
      try {
        const coach = CoachEngine.runAll();
        recoveryScore = coach.recovery ? coach.recovery.score : null;
        avgSleep = coach.daily ? coach.daily.avgSleep : null;
      } catch (e) {
        recoveryScore = null;
      }
    }

    if (recoveryScore === null) {
      const weekSessions = getWeekSessions();
      const consecutiveDays = (() => {
        const sorted = weekSessions.slice().sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        let streak = 0;
        for (let i = 0; i < sorted.length - 1; i++) {
          const diff = (new Date(sorted[i + 1].dateKey) - new Date(sorted[i].dateKey)) / 86400000;
          if (diff <= 2) streak++;
          else streak = 0;
        }
        return streak;
      })();

      if (weekSessions.length <= 2) {
        recoveryScore = 85;
      } else if (consecutiveDays >= 4) {
        recoveryScore = 65;
      } else if (consecutiveDays >= 3) {
        recoveryScore = 75;
      } else {
        recoveryScore = 80;
      }
    }

    const weekSessions = getWeekSessions();
    const trainingLoad = weekSessions.reduce((sum, s) => sum + (s.exercises ? s.exercises.length : 0), 0);
    const avgTrainingLoad = weekSessions.length > 0 ? trainingLoad / weekSessions.length : 0;

    let verdict = "";
    if (recoveryScore >= 80) {
      verdict = "Recovery is strong and supports current training volume and intensity.";
    } else if (recoveryScore >= 65) {
      verdict = "Recovery is adequate but could be improved. Prioritize sleep and nutrition.";
    } else {
      verdict = "Recovery is compromised. Consider reducing training volume and focusing on rest.";
    }

    let sleepVerdict = "";
    if (avgSleep !== null) {
      if (avgSleep >= 7.5) sleepVerdict = "Sleep duration supports recovery.";
      else if (avgSleep >= 6.5) sleepVerdict = "Sleep is slightly below optimal. Aim for 8 hours.";
      else sleepVerdict = "Sleep is insufficient for optimal recovery. Prioritize rest.";
    }

    return {
      score: recoveryScore,
      avgSleep,
      avgTrainingLoad,
      trainingLoad,
      verdict,
      sleepVerdict,
    };
  }

  // ---- Nutrition Review ---------------------------------------------
  function getNutritionReview() {
    let proteinDays = null;
    let proteinTarget = null;

    if (typeof CoachEngine !== "undefined") {
      try {
        const coach = CoachEngine.runAll();
        const nut = coach.nutrition || {};
        proteinDays = nut.proteinDays || nut.protein || null;
        proteinTarget = nut.proteinTarget || null;
      } catch (e) {
        proteinDays = null;
      }
    }

    if (proteinDays === null) {
      const sessions = getWeekSessions();
      proteinDays = Math.min(7, sessions.length + 1);
    }

    const proteinCompliance = proteinDays !== null ? (proteinDays / 7) * 100 : null;
    const goalType = typeof GoalCenter !== "undefined" ? GoalCenter.getGoalType() : (state.user && state.user.goal) || "";

    let verdict = "";
    if (proteinCompliance !== null) {
      if (proteinCompliance >= 85) {
        if (goalType === "lose-fat" || goalType === "build-muscle") {
          verdict = "Protein intake is consistent and supports your goal progression.";
        } else {
          verdict = "Nutrition is consistent and supports your training.";
        }
      } else if (proteinCompliance >= 60) {
        verdict = "Protein intake is decent but has room for improvement. Aim for daily consistency.";
      } else {
        verdict = "Protein intake needs attention. Consistent daily protein is critical for your goal.";
      }
    } else {
      verdict = "Log your nutrition to enable dietary analysis.";
    }

    return {
      proteinDays,
      proteinTarget,
      proteinCompliance,
      verdict,
    };
  }

  // ---- Exercise Analysis --------------------------------------------
  function getExerciseAnalysis() {
    const MAJOR_LIFTS = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull Up"];
    const analysis = [];

    MAJOR_LIFTS.forEach((name) => {
      const pr = state.prs && state.prs[name];
      const history = pr ? pr.history || [] : [];
      const sorted = history.slice().sort((a, b) => a.date.localeCompare(b.date));
      const current = sorted.length > 0 ? sorted[sorted.length - 1].weight : null;
      const previous = sorted.length > 1 ? sorted[sorted.length - 2].weight : null;

      let status = "untracked";
      let change = null;

      if (current !== null && previous !== null) {
        change = current - previous;
        if (change > 0) status = "progressing";
        else if (change === 0) status = "maintained";
        else status = "declining";
      } else if (current !== null) {
        status = "tracked";
      }

      const weeksSinceLastPR = (() => {
        if (!sorted.length) return null;
        const lastDate = new Date(sorted[sorted.length - 1].date);
        return Math.floor((new Date() - lastDate) / 86400000 / 7);
      })();

      const isStalled = weeksSinceLastPR !== null && weeksSinceLastPR >= 4 && status !== "progressing";

      analysis.push({
        name,
        currentWeight: current,
        previousWeight: previous,
        change,
        status,
        weeksSinceLastPR,
        isStalled,
        totalHistory: sorted.map((e) => ({ date: e.date, weight: e.weight })),
      });
    });

    const stalledLifts = analysis.filter((e) => e.isStalled);
    const progressingLifts = analysis.filter((e) => e.status === "progressing");

    return {
      lifts: analysis,
      stalledLifts,
      progressingLifts,
      totalTracked: analysis.filter((e) => e.status !== "untracked").length,
    };
  }

  // ---- Program Health Score (0-100) ---------------------------------
  function getProgramHealth(goalProgress, training, recovery, nutrition, exercise) {
    let score = 0;
    const components = [];

    // Goal progress contribution (max 25)
    if (goalProgress.status === "on-pace") { score += 25; components.push({ name: "Goal Progress", score: 25, max: 25 }); }
    else if (goalProgress.status === "slow" || goalProgress.status === "maintaining") { score += 15; components.push({ name: "Goal Progress", score: 15, max: 25 }); }
    else if (goalProgress.status === "plateau") { score += 10; components.push({ name: "Goal Progress", score: 10, max: 25 }); }
    else if (goalProgress.status === "off-track") { score += 5; components.push({ name: "Goal Progress", score: 5, max: 25 }); }
    else { components.push({ name: "Goal Progress", score: 0, max: 25 }); }

    // Recovery contribution (max 25)
    if (recovery.score !== null) {
      const recScore = Math.round((recovery.score / 100) * 25);
      score += recScore;
      components.push({ name: "Recovery", score: recScore, max: 25 });
    } else {
      components.push({ name: "Recovery", score: 0, max: 25 });
    }

    // Training compliance contribution (max 25)
    const weekCount = training.weekCount || 0;
    let trainScore = 0;
    if (weekCount >= 4) trainScore = 25;
    else if (weekCount >= 3) trainScore = 20;
    else if (weekCount >= 2) trainScore = 12;
    else if (weekCount >= 1) trainScore = 6;
    score += trainScore;
    components.push({ name: "Training Compliance", score: trainScore, max: 25 });

    // Nutrition contribution (max 15)
    if (nutrition.proteinCompliance !== null) {
      const nutScore = Math.round((nutrition.proteinCompliance / 100) * 15);
      score += nutScore;
      components.push({ name: "Nutrition", score: nutScore, max: 15 });
    } else {
      components.push({ name: "Nutrition", score: 0, max: 15 });
    }

    // Performance contribution (max 10)
    const perfScore = Math.min(10, exercise.progressingLifts.length * 3);
    score += perfScore;
    components.push({ name: "Performance", score: perfScore, max: 10 });

    return {
      score: Math.min(100, Math.max(0, score)),
      components,
      label: score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 45 ? "Needs Attention" : "Concern",
    };
  }

  // ---- Review Outcome -----------------------------------------------
  function getReviewOutcome(programHealth, goalProgress, training, recovery, exercise) {
    const stalledCount = exercise.stalledLifts.length;
    const hasGoal = goalProgress.goalType && goalProgress.status !== "insufficient-data";
    const recovering = recovery.score !== null && recovery.score >= 70;
    const consistent = training.weekCount >= 3;

    if (programHealth.score >= 80 && hasGoal && recovering && consistent && stalledCount === 0) {
      return {
        id: "excellent",
        label: "Excellent",
        icon: "🟢",
        summary: "Your current program is producing progress across all major indicators. Continue for another 4 weeks.",
        color: "var(--accent)",
      };
    }

    if (programHealth.score >= 65 && hasGoal && (recovering || consistent)) {
      return {
        id: "good",
        label: "Good",
        icon: "🟡",
        summary: "Your program is working. Minor improvements in the areas below will level up results.",
        color: "var(--orange)",
      };
    }

    if (programHealth.score >= 45) {
      return {
        id: "needs-adjustment",
        label: "Needs Adjustment",
        icon: "🟠",
        summary: "Progress is slowing. The recommendations below target the biggest limiting factors.",
        color: "var(--yellow)",
      };
    }

    return {
      id: "ineffective",
      label: "Ineffective",
      icon: "🔴",
      summary: "Current strategy is not producing expected results. Significant changes are needed.",
      color: "var(--red)",
    };
  }

  // ---- Adjustment Engine --------------------------------------------
  // Always recommend smallest change first.
  // Priority order: Consistency → Protein → Activity → Recovery → Training Volume → Exercise Selection → Program Structure
  function getAdjustments(goalProgress, training, recovery, nutrition, exercise) {
    const adjustments = [];

    // Priority 1: Consistency
    if (training.weekCount < 3) {
      adjustments.push({
        priority: 1,
        area: "Consistency",
        issue: `Only ${training.weekCount} workouts this week`,
        action: `Aim for at least ${Math.max(3, training.weekCount + 1)} workouts next week`,
        detail: "Consistency is the foundation of all progress. Focus on showing up before optimizing any other variable.",
        changeType: "habit",
      });
    }

    // Priority 2: Protein
    const proteinLow = nutrition.proteinCompliance !== null && nutrition.proteinCompliance < 70;
    if (proteinLow && adjustments.length < 3) {
      const goalType = goalProgress.goalType;
      const target = goalType === "lose-fat" ? "2.2g per kg of bodyweight" : goalType === "build-muscle" ? "2g per kg" : "1.8g per kg";
      adjustments.push({
        priority: 2,
        area: "Protein",
        issue: `Protein logged on ${nutrition.proteinDays}/7 days`,
        action: `Hit protein target (${target}) every day for the next week`,
        detail: "Consistent daily protein intake is critical for body composition changes and recovery.",
        changeType: "nutrition",
      });
    }

    // Priority 3: Activity (steps / NEAT)
    if (goalProgress.goalType === "lose-fat" && (goalProgress.status === "plateau" || goalProgress.status === "slow") && adjustments.length < 3) {
      adjustments.push({
        priority: 3,
        area: "Activity",
        issue: "Fat loss has slowed or plateaued",
        action: "Increase daily step count by 2,000-3,000 steps",
        detail: "Non-exercise activity thermogenesis (NEAT) is a powerful lever for fat loss without reducing calories further.",
        changeType: "activity",
      });
    }

    // Priority 4: Recovery
    if (recovery.score !== null && recovery.score < 65 && adjustments.length < 3) {
      adjustments.push({
        priority: 4,
        area: "Recovery",
        issue: `Recovery score is ${recovery.score}`,
        action: recovery.avgSleep !== null && recovery.avgSleep < 7
          ? "Prioritize 8 hours of sleep nightly and consider a rest day"
          : "Focus on sleep quality, stress management, and active recovery",
        detail: "Recovery is becoming the primary limiting factor. Prioritize sleep and consider reducing training stress.",
        changeType: "recovery",
      });
    }

    // Priority 5: Training Volume
    const stalledCount = exercise.stalledLifts.length;
    if (stalledCount >= 2 && adjustments.length < 3) {
      adjustments.push({
        priority: 5,
        area: "Training Volume",
        issue: `${stalledCount} lifts stalled for 4+ weeks`,
        action: exercise.stalledLifts.map((e) => `Review ${e.name} programming`).join("; "),
        detail: "Multiple lifts have stalled. Consider adjusting volume, frequency, or exercise selection for these movements.",
        changeType: "volume",
      });
    }

    // Priority 6: Exercise Selection
    if (stalledCount >= 1 && adjustments.length < 3) {
      const lift = exercise.stalledLifts[0];
      adjustments.push({
        priority: 6,
        area: "Exercise Selection",
        issue: `${lift.name} has not progressed in ${lift.weeksSinceLastPR} weeks`,
        action: `Try alternative variations for ${lift.name} (e.g., dumbbell or incline variation)`,
        detail: "A plateau on a main lift may benefit from variation or a deload before continuing progression.",
        changeType: "selection",
      });
    }

    // Priority 7: Program Structure (only if all else has been addressed)
    if (training.weekCount < 2 && adjustments.length >= 2 && goalProgress.status === "off-track") {
      adjustments.push({
        priority: 7,
        area: "Program Structure",
        issue: "Current program may not fit your schedule",
        action: "Consider switching to a 3-day full body or upper/lower split",
        detail: "Low attendance may indicate the current split doesn't fit your lifestyle. A simpler program builds consistency.",
        changeType: "structure",
      });
    }

    return adjustments;
  }

  // ---- Top 3 Recommendations ----------------------------------------
  function getTopRecommendations(adjustments, programHealth, goalProgress, training, recovery) {
    const recs = [];

    if (adjustments.length > 0) {
      adjustments.slice(0, 3).forEach((adj) => {
        recs.push({
          text: adj.action,
          area: adj.area,
          priority: adj.priority,
          detail: adj.detail,
        });
      });
    }

    // If no adjustments needed, give positive reinforcement
    if (recs.length === 0) {
      if (programHealth.score >= 80) {
        recs.push({ text: "Continue your current program — it's working well", area: "Program", priority: 1, detail: "All major indicators show positive trends. Maintain consistency." });
      } else if (training.weekCount >= 3) {
        recs.push({ text: "Keep your training frequency at 3+ sessions per week", area: "Consistency", priority: 1, detail: "Consistency is your strongest asset. Protect it." });
      } else {
        recs.push({ text: "Focus on building a consistent training habit", area: "Consistency", priority: 1, detail: "Start with 2-3 sessions per week before optimizing other variables." });
      }
    }

    return recs.slice(0, 3);
  }

  // ---- Coach Summary ------------------------------------------------
  function getCoachSummary(outcome, programHealth, goalProgress, training, recovery, adjustments, recommendations) {
    const goalType = goalProgress.goalType;

    if (outcome.id === "excellent") {
      if (goalType === "lose-fat") {
        return "Your current program is producing excellent fat loss results. Continue your nutrition and training strategy. The data shows sustainable progress at the right pace.";
      }
      if (goalType === "build-muscle") {
        return "Your muscle building program is working well. Consistent weight gain and strength progress confirm the approach is effective. Stay the course.";
      }
      if (goalType === "strength") {
        return "Your strength program is delivering results. PRs are trending up and recovery supports training intensity. Keep pushing.";
      }
      return "Your current program is producing excellent results across all major indicators. Continue what you're doing.";
    }

    if (outcome.id === "good") {
      if (goalType === "lose-fat") {
        return "Fat loss is progressing but has room to optimize. The recommendations below target the areas that will have the biggest impact.";
      }
      if (goalType === "build-muscle") {
        return "Muscle gain is proceeding but could be accelerated. Focus on the key areas identified below.";
      }
      if (goalType === "strength") {
        return "Strength gains are happening but some lifts may need attention. Review the recommendations for targeted improvements.";
      }
      return "Your program is working. Minor improvements in the areas below will help level up your results.";
    }

    if (outcome.id === "needs-adjustment") {
      if (goalType === "lose-fat") {
        return "Fat loss has slowed. Rather than changing your entire program, focus on the specific adjustments below — starting with the smallest change first.";
      }
      if (goalType === "build-muscle") {
        return "Muscle gain has stalled. The adjustments below target the root cause — whether it's nutrition, recovery, or training variables.";
      }
      return "Progress is slowing. The adjustments below are ordered from smallest to biggest change. Start with #1.";
    }

    // ineffective
    if (goalType === "lose-fat") {
      return "Your current fat loss strategy is not producing expected results. It's time for meaningful changes. Start with the highest priority adjustment below and reassess in 2 weeks.";
    }
    if (goalType === "build-muscle") {
      return "Your current approach to building muscle isn't working. Significant changes to nutrition, training, or both are needed. Start with adjustment #1.";
    }
    return "Your current strategy is not producing results. Significant changes are needed. Follow the recommendations below and reassess soon.";
  }

  // ---- Full Review --------------------------------------------------
  function runReview() {
    const goalProgress = getGoalProgress();
    const training = getTrainingEffectiveness();
    const recovery = getRecoveryReview();
    const nutrition = getNutritionReview();
    const exercise = getExerciseAnalysis();
    const programHealth = getProgramHealth(goalProgress, training, recovery, nutrition, exercise);
    const outcome = getReviewOutcome(programHealth, goalProgress, training, recovery, exercise);
    const adjustments = getAdjustments(goalProgress, training, recovery, nutrition, exercise);
    const recommendations = getTopRecommendations(adjustments, programHealth, goalProgress, training, recovery);
    const coachSummary = getCoachSummary(outcome, programHealth, goalProgress, training, recovery, adjustments, recommendations);

    const result = {
      reviewDate: getDateKey(),
      weekNumber: Math.ceil((state.sessions || []).filter((s) => s.finishedAt).length / 3) || 1,
      isMonthly: true,
      outcome,
      programHealth,
      goalProgress,
      training,
      recovery,
      nutrition,
      exercise,
      adjustments,
      topRecommendations: recommendations,
      coachSummary,
    };

    // Save to history
    try {
      const history = loadHistory();
      history.reviews.push({
        date: result.reviewDate,
        outcome: outcome.id,
        programHealth: programHealth.score,
        coachSummary,
      });
      history.lastReviewDate = result.reviewDate;
      if (history.reviews.length > 24) history.reviews = history.reviews.slice(-24);
      saveHistory(history);
    } catch (e) {
      // Silently fail - review data is computed live
    }

    return result;
  }

  // ---- Weekly Mini Review -------------------------------------------
  function runWeeklyCheck() {
    const training = getTrainingEffectiveness();
    const recovery = getRecoveryReview();
    const nutrition = getNutritionReview();

    const weekCount = training.weekCount;
    const recScore = recovery.score;

    let status = "on-track";
    let message = "";

    if (weekCount === 0) {
      status = "off-track";
      message = "No workouts logged this week. Start with one session to get back on track.";
    } else if (weekCount < 3 && recScore !== null && recScore < 65) {
      status = "caution";
      message = `Only ${weekCount} workouts and low recovery. Consider an easier week.`;
    } else if (weekCount < 3) {
      status = "building";
      message = `${weekCount} workouts completed. Try to add one more session this week.`;
    } else if (weekCount >= 4 && recScore !== null && recScore >= 80) {
      status = "excellent";
      message = `Great week! ${weekCount} workouts with strong recovery. Keep going.`;
    } else if (weekCount >= 3) {
      status = "good";
      message = `Solid week with ${weekCount} sessions. Consistency is building.`;
    } else {
      status = "neutral";
      message = `${weekCount} workouts logged. Every session counts.`;
    }

    return {
      weekEnding: getDateKey(),
      status,
      message,
      workouts: weekCount,
      recoveryScore: recScore,
      proteinDays: nutrition.proteinDays,
    };
  }

  // ---- Public API ---------------------------------------------------
  return {
    runReview,
    runWeeklyCheck,
    getGoalProgress,
    getTrainingEffectiveness,
    getRecoveryReview,
    getNutritionReview,
    getExerciseAnalysis,
    getProgramHealth,
    getAdjustments,
    getTopRecommendations,
    loadHistory,
  };
})();
