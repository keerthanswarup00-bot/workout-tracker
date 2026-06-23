// ============================================================
// IRONLOG CAS ENGINE — Challenges, Achievements, Streaks
// Gamification, Retention & Motivation System V1
// ============================================================

const CASEngine = (() => {
  const STORAGE_KEY = "ironlog_cas_data";

  // ---- XP Thresholds & Level Titles -------------------------
  // Level n requires XP_THRESHOLDS[n-1] XP to reach
  const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, 11550, 12750, 14050, 15450, 16950, 18550, 20250, 22050, 23950, 25950];
  const LEVEL_TITLES = {
    1: "Beginner",
    2: "Novice",
    3: "Apprentice",
    4: "Consistent",
    5: "Committed",
    6: "Focused",
    7: "Driven",
    8: "Determined",
    9: "Dedicated",
    10: "Elite",
    15: "Unstoppable",
    20: "Iron",
    25: "Legendary",
    30: "Immortal",
  };

  function getLevelTitle(level) {
    const exact = LEVEL_TITLES[level];
    if (exact) return exact;
    if (level >= 30) return "Immortal";
    if (level >= 20) return "Iron";
    if (level >= 15) return "Unstoppable";
    if (level >= 10) return "Elite";
    if (level >= 7) return "Determined";
    if (level >= 5) return "Committed";
    if (level >= 3) return "Apprentice";
    return "Beginner";
  }

  // ---- Storage -------------------------------------------------
  function getDefaultState() {
    return {
      xp: 0,
      streak: {
        workout: { current: 0, longest: 0, updatedAt: null },
        protein: { current: 0, longest: 0, updatedAt: null },
        weightLogging: { current: 0, longest: 0, updatedAt: null },
        learning: { current: 0, longest: 0, updatedAt: null },
      },
      achievements: [],
      challenges: {
        active: [],
        completed: [],
      },
      checkIns: {},
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults to handle new fields
        const def = getDefaultState();
        return {
          ...def,
          ...parsed,
          streak: { ...def.streak, ...(parsed.streak || {}) },
          challenges: { ...def.challenges, ...(parsed.challenges || {}) },
        };
      }
    } catch (e) { /* ignore */ }
    return getDefaultState();
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore storage errors */ }
  }

  // ---- XP & Levels --------------------------------------------
  function getLevel(xp) {
    let level = 1;
    for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= XP_THRESHOLDS[i]) {
        level = i + 1;
        break;
      }
    }
    return level;
  }

  function getXPProgress(xp) {
    const level = getLevel(xp);
    const currentThreshold = XP_THRESHOLDS[level - 1] || 0;
    const nextThreshold = XP_THRESHOLDS[level] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    const currentXP = xp - currentThreshold;
    const neededXP = nextThreshold - currentThreshold;
    return { level, title: getLevelTitle(level), xp: currentXP, xpNeeded: neededXP, totalXP: xp };
  }

  function awardXP(state, amount, reason) {
    const oldLevel = getLevel(state.xp);
    state.xp += amount;
    const newLevel = getLevel(state.xp);
    saveState(state);
    return { oldLevel, newLevel, leveledUp: newLevel > oldLevel, amount, reason };
  }

  // ---- Streak Engine ------------------------------------------
  function updateStreak(state, streakKey, dateKey, isActive) {
    const s = state.streak[streakKey];
    if (!s) return;

    if (!isActive) {
      // Inactive day — don't break streak, just no-op
      return;
    }

    if (s.updatedAt === null) {
      // First ever
      s.current = 1;
      s.longest = 1;
    } else if (s.updatedAt === dateKey) {
      // Already updated today — no change
      return;
    } else {
      // Check if consecutive
      const prevDate = new Date(s.updatedAt + "T00:00:00");
      const currDate = new Date(dateKey + "T00:00:00");
      const diffDays = Math.round((currDate - prevDate) / 86400000);
      if (diffDays === 1) {
        s.current += 1;
        if (s.current > s.longest) s.longest = s.current;
      } else if (diffDays > 1) {
        // Streak broken
        s.current = 1;
      }
      // diffDays === 0 handled above (already updated)
    }
    s.updatedAt = dateKey;
    saveState(state);
  }

  // ---- Achievement Definitions --------------------------------
  const ACHIEVEMENTS = [
    // Consistency
    { id: "first-workout", category: "consistency", label: "First Workout", desc: "Complete your first workout", icon: "🏋️", check: (state, data) => data.totalWorkouts >= 1 },
    { id: "workouts-10", category: "consistency", label: "10 Workouts", desc: "Complete 10 workouts", icon: "🏋️", check: (state, data) => data.totalWorkouts >= 10 },
    { id: "workouts-50", category: "consistency", label: "50 Workouts", desc: "Complete 50 workouts", icon: "🏋️", check: (state, data) => data.totalWorkouts >= 50 },
    { id: "workouts-100", category: "consistency", label: "100 Workouts", desc: "Complete 100 workouts", icon: "🏋️", check: (state, data) => data.totalWorkouts >= 100 },
    { id: "workouts-365", category: "consistency", label: "365 Workouts", desc: "Complete 365 workouts", icon: "🏋️", check: (state, data) => data.totalWorkouts >= 365 },

    // Streaks
    { id: "streak-7", category: "consistency", label: "7-Day Streak", desc: "Maintain a 7-day workout streak", icon: "🔥", check: (state, data) => state.streak.workout.current >= 7 || state.streak.workout.longest >= 7 },
    { id: "streak-30", category: "consistency", label: "30-Day Streak", desc: "Maintain a 30-day workout streak", icon: "🔥", check: (state, data) => state.streak.workout.current >= 30 || state.streak.workout.longest >= 30 },
    { id: "streak-90", category: "consistency", label: "90-Day Streak", desc: "Maintain a 90-day workout streak", icon: "🔥", check: (state, data) => state.streak.workout.current >= 90 || state.streak.workout.longest >= 90 },
    { id: "streak-180", category: "consistency", label: "180-Day Streak", desc: "Maintain a 180-day workout streak", icon: "🔥", check: (state, data) => state.streak.workout.current >= 180 || state.streak.workout.longest >= 180 },

    // Nutrition
    { id: "protein-7", category: "nutrition", label: "Protein 7 Days", desc: "Hit protein goal 7 days in a row", icon: "🥩", check: (state, data) => state.streak.protein.current >= 7 || state.streak.protein.longest >= 7 },
    { id: "protein-14", category: "nutrition", label: "Protein 14 Days", desc: "Hit protein goal 14 days in a row", icon: "🥩", check: (state, data) => state.streak.protein.current >= 14 || state.streak.protein.longest >= 14 },
    { id: "protein-30", category: "nutrition", label: "Protein 30 Days", desc: "Hit protein goal 30 days in a row", icon: "🥩", check: (state, data) => state.streak.protein.current >= 30 || state.streak.protein.longest >= 30 },

    // Weight Tracking
    { id: "weight-7", category: "tracking", label: "7-Day Weight Streak", desc: "Log weight 7 days in a row", icon: "⚖️", check: (state, data) => state.streak.weightLogging.current >= 7 || state.streak.weightLogging.longest >= 7 },
    { id: "weight-30", category: "tracking", label: "30-Day Weight Streak", desc: "Log weight 30 days in a row", icon: "⚖️", check: (state, data) => state.streak.weightLogging.current >= 30 || state.streak.weightLogging.longest >= 30 },
    { id: "weight-100", category: "tracking", label: "100 Weight Logs", desc: "Log weight 100 times", icon: "⚖️", check: (state, data) => data.totalWeights >= 100 },
    { id: "weight-365", category: "tracking", label: "365 Weight Logs", desc: "Log weight 365 times", icon: "⚖️", check: (state, data) => data.totalWeights >= 365 },

    // Goals
    { id: "goal-first", category: "goals", label: "First Goal", desc: "Create your first fitness goal", icon: "🎯", check: (state, data) => data.hasGoal },
    { id: "goal-complete", category: "goals", label: "Goal Achieved", desc: "Complete a fitness goal", icon: "🎯", check: (state, data) => data.goalProgress >= 100 },
    { id: "fat-loss-5", category: "goals", label: "5kg Lost", desc: "Lose 5kg toward your goal", icon: "⚡", check: (state, data) => data.weightLost >= 5 },
    { id: "fat-loss-10", category: "goals", label: "10kg Lost", desc: "Lose 10kg toward your goal", icon: "⚡", check: (state, data) => data.weightLost >= 10 },
    { id: "muscle-5", category: "goals", label: "5kg Gained", desc: "Gain 5kg toward your goal", icon: "💪", check: (state, data) => data.weightGained >= 5 },
    { id: "muscle-10", category: "goals", label: "10kg Gained", desc: "Gain 10kg toward your goal", icon: "💪", check: (state, data) => data.weightGained >= 10 },

    // Strength
    { id: "pr-first", category: "strength", label: "First PR", desc: "Set your first personal record", icon: "🏆", check: (state, data) => data.totalPRs >= 1 },
    { id: "pr-10", category: "strength", label: "10 PRs", desc: "Set 10 personal records", icon: "🏆", check: (state, data) => data.totalPRs >= 10 },
    { id: "pr-50", category: "strength", label: "50 PRs", desc: "Set 50 personal records", icon: "🏆", check: (state, data) => data.totalPRs >= 50 },
    { id: "pr-100", category: "strength", label: "100 PRs", desc: "Set 100 personal records", icon: "🏆", check: (state, data) => data.totalPRs >= 100 },

    // Bench milestones
    { id: "bench-60", category: "strength", label: "60kg Bench", desc: "Bench press 60kg", icon: "🏋️", check: (state, data) => data.benchMax >= 60 },
    { id: "bench-80", category: "strength", label: "80kg Bench", desc: "Bench press 80kg", icon: "🏋️", check: (state, data) => data.benchMax >= 80 },
    { id: "bench-100", category: "strength", label: "100kg Bench", desc: "Bench press 100kg", icon: "🏋️", check: (state, data) => data.benchMax >= 100 },
    { id: "bench-120", category: "strength", label: "120kg Bench", desc: "Bench press 120kg", icon: "🏋️", check: (state, data) => data.benchMax >= 120 },

    // Squat milestones
    { id: "squat-100", category: "strength", label: "100kg Squat", desc: "Squat 100kg", icon: "🏋️", check: (state, data) => data.squatMax >= 100 },
    { id: "squat-140", category: "strength", label: "140kg Squat", desc: "Squat 140kg", icon: "🏋️", check: (state, data) => data.squatMax >= 140 },
    { id: "squat-180", category: "strength", label: "180kg Squat", desc: "Squat 180kg", icon: "🏋️", check: (state, data) => data.squatMax >= 180 },

    // Learning
    { id: "lesson-first", category: "learning", label: "First Lesson", desc: "Complete your first lesson", icon: "📖", check: (state, data) => data.completedLessons >= 1 },
    { id: "lesson-path", category: "learning", label: "Learning Path", desc: "Complete a full lesson category", icon: "📖", check: (state, data) => data.completedCategory || false },
    { id: "lesson-10", category: "learning", label: "10 Lessons", desc: "Complete 10 lessons", icon: "📖", check: (state, data) => data.completedLessons >= 10 },
    { id: "lesson-50", category: "learning", label: "50 Lessons", desc: "Complete 50 lessons", icon: "📖", check: (state, data) => data.completedLessons >= 50 },
    { id: "lesson-100", category: "learning", label: "100 Lessons", desc: "Complete 100 lessons", icon: "📖", check: (state, data) => data.completedLessons >= 100 },
  ];

  // ---- Check Achievements ------------------------------------
  function checkAchievements(state, data) {
    const unlocked = new Set(state.achievements.map((a) => a.id));
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach((ach) => {
      if (!unlocked.has(ach.id) && ach.check(state, data)) {
        state.achievements.push({ id: ach.id, unlockedAt: getDateKey(new Date()) });
        newlyUnlocked.push(ach);
        awardXP(state, 25, `Achievement: ${ach.label}`);
      }
    });
    if (newlyUnlocked.length > 0) saveState(state);
    return newlyUnlocked;
  }

  // ---- Challenge Generation -----------------------------------
  function getChallengeReward(type) {
    if (type === "daily") return { xp: 10, coachScore: 1 };
    if (type === "weekly") return { xp: 50, coachScore: 3 };
    if (type === "monthly") return { xp: 200, coachScore: 10 };
    return { xp: 10, coachScore: 1 };
  }

  function generateDailyChallenge(state, data) {
    const today = getDateKey(new Date());
    const existing = state.challenges.active.find((c) => c.type === "daily" && c.issuedAt === today);
    if (existing) return existing;

    const pool = [];
    const goalType = data.goalType || "general";
    const hasWeights = data.totalWeights > 0;
    const hasWorkouts = data.totalWorkouts > 0;

    // Always possible challenges
    pool.push({ id: "daily-log-weight", label: "Log Weight Today", desc: "Log your body weight today", icon: "⚖️", target: 1, unit: "log" });
    pool.push({ id: "daily-hit-protein", label: "Hit Protein Target", desc: "Meet your daily protein goal", icon: "🥩", target: 1, unit: "day" });
    pool.push({ id: "daily-complete-workout", label: "Complete Workout", desc: "Finish today's workout session", icon: "🏋️", target: 1, unit: "workout" });
    pool.push({ id: "daily-water", label: "Water Target", desc: "Hit your daily water intake", icon: "💧", target: 1, unit: "day" });

    if (goalType === "lose-fat") {
      pool.push({ id: "daily-steps", label: "Step Goal", desc: "Hit your daily step target", icon: "🚶", target: 1, unit: "day" });
    }

    // Pick one (or cycle through)
    const todayIdx = Math.abs(hashString(today)) % pool.length;
    const picked = pool[todayIdx];

    const challenge = {
      id: picked.id,
      type: "daily",
      label: picked.label,
      desc: picked.desc,
      icon: picked.icon,
      target: picked.target,
      unit: picked.unit,
      progress: 0,
      issuedAt: today,
      expiresAt: today,
      reward: getChallengeReward("daily"),
      completed: false,
    };
    state.challenges.active.push(challenge);
    saveState(state);
    return challenge;
  }

  function generateWeeklyChallenges(state, data) {
    const weekStart = getWeekStartKey();
    const existing = state.challenges.active.filter((c) => c.type === "weekly" && c.issuedAt === weekStart);
    if (existing.length > 0) return existing;

    const challenges = [];
    const goalType = data.goalType || "general";

    // Base weekly challenges
    const basePool = [
      { id: "weekly-all-workouts", label: "Complete All Workouts", desc: "Finish every scheduled workout this week", icon: "🏋️", target: getWeeklyWorkoutCount(data) || 4, unit: "workouts" },
      { id: "weekly-protein-7", label: "Protein 7 Days", desc: "Hit your protein goal every day", icon: "🥩", target: 7, unit: "days" },
      { id: "weekly-log-weight", label: "Log Weight 7 Days", desc: "Log your weight every day this week", icon: "⚖️", target: 7, unit: "days" },
      { id: "weekly-recovery", label: "Maintain Recovery 70+", desc: "Keep daily recovery score above 70", icon: "🔄", target: 7, unit: "days" },
    ];

    // Pick 2 based on goal type
    const pool = [...basePool];
    if (goalType === "lose-fat") {
      pool.push({ id: "weekly-steps-70k", label: "Walk 70k Steps", desc: "Walk 70,000 steps this week", icon: "🚶", target: 70000, unit: "steps" });
    }

    const count = Math.min(2, pool.length);
    const indices = getPicks(weekStart, pool.length, count);
    indices.forEach((i) => challenges.push({ ...pool[i], type: "weekly", issuedAt: weekStart, expiresAt: getWeekEndKey(), progress: 0, reward: getChallengeReward("weekly"), completed: false }));

    state.challenges.active.push(...challenges);
    saveState(state);
    return challenges;
  }

  function generateMonthlyChallenges(state, data) {
    const monthPrefix = getMonthPrefixKey();
    const existing = state.challenges.active.filter((c) => c.type === "monthly" && c.issuedAt === monthPrefix);
    if (existing.length > 0) return existing;

    const challenges = [];
    const goalType = data.goalType || "general";
    const goalLabel = data.goalLabel || "";

    const basePool = [
      { id: "monthly-workouts-20", label: "Complete 20 Workouts", desc: "Finish 20 workouts this month", icon: "🏋️", target: 20, unit: "workouts" },
      { id: "monthly-compliance-100", label: "100% Compliance", desc: "Complete all scheduled workouts", icon: "📋", target: 1, unit: "month" },
      { id: "monthly-coach-80", label: "Coach Score 80+", desc: "Maintain Coach Score above 80", icon: "🎯", target: 1, unit: "month" },
    ];

    const personalized = [];
    if (goalType === "lose-fat") {
      personalized.push({ id: "monthly-lose-2kg", label: "Lose 2kg", desc: "Lose 2kg body weight this month", icon: "⚡", target: 2, unit: "kg" });
      personalized.push({ id: "monthly-steps-14", label: "10k Steps For 14 Days", desc: "Hit 10k steps for 14 days this month", icon: "🚶", target: 14, unit: "days" });
    } else if (goalType === "build-muscle" || goalType === "strength") {
      personalized.push({ id: "monthly-gain-0.3kg", label: "Gain 0.3kg", desc: "Gain 0.3kg body weight this month", icon: "💪", target: 0.3, unit: "kg" });
      personalized.push({ id: "monthly-protein-14", label: "Protein 14 Days", desc: "Hit protein target for 14 days", icon: "🥩", target: 14, unit: "days" });
    }

    const pool = [...basePool, ...personalized];
    const count = Math.min(2, pool.length);
    const indices = getPicks(monthPrefix, pool.length, count);
    indices.forEach((i) => challenges.push({ ...pool[i], type: "monthly", issuedAt: monthPrefix, expiresAt: getMonthEndKey(), progress: 0, reward: getChallengeReward("monthly"), completed: false }));

    state.challenges.active.push(...challenges);
    saveState(state);
    return challenges;
  }

  // ---- Challenge Progress Updates ----------------------------
  function updateChallengeProgress(state, challengeId, value, mode) {
    const c = state.challenges.active.find((ch) => ch.id === challengeId);
    if (!c || c.completed) return false;

    if (mode === "set") {
      c.progress = Math.min(c.target, Math.max(0, value));
    } else {
      c.progress = Math.min(c.target, (c.progress || 0) + value);
    }
    if (c.progress >= c.target && !c.completed) {
      c.completed = true;
      state.challenges.completed.push({ id: c.id, type: c.type, completedAt: getDateKey(new Date()) });
      awardXP(state, c.reward.xp, `Challenge: ${c.label}`);
      // Coach score bonus is handled by the CoachEngine integration
      saveState(state);
      return true;
    }
    saveState(state);
    return false;
  }

  // ---- Main Check & Update -----------------------------------
  function runAll(rawData) {
    const state = loadState();
    const today = getDateKey(new Date());

    // Gather data
    const sessions = (rawData.sessions || state.sessions || []).filter((s) => s.finishedAt);
    const weightLog = rawData.weightLog || state.weightLog || [];
    const user = rawData.user || state.user || {};
    const goalType = typeof GoalCenter !== "undefined" ? GoalCenter.getGoalType() : "general";
    const goalProgress = typeof GoalCenter !== "undefined" ? GoalCenter.getGoalProgressPct() : null;
    const goalLabel = typeof GoalCenter !== "undefined" ? GoalCenter.getGoalLabel() : "General Fitness";
    const prs = rawData.prs || state.prs || {};
    const completedLessons = getCompletedLessons ? getCompletedLessons() : [];

    const totalWorkouts = sessions.length;
    const totalWeights = weightLog.length;
    const totalPRs = Object.values(prs).filter((p) => p.history && p.history.length > 0).length;
    const hasGoal = goalType !== "general" && goalType !== null;
    const weightLost = calculateWeightLost(user, weightLog);
    const weightGained = calculateWeightGained(user, weightLog);
    const benchMax = getLiftMax(prs, "benchPress") || 0;
    const squatMax = getLiftMax(prs, "squat") || 0;

    const data = {
      totalWorkouts,
      totalWeights,
      totalPRs,
      hasGoal,
      goalProgress,
      goalType,
      goalLabel,
      weightLost,
      weightGained,
      benchMax,
      squatMax,
      completedLessons: completedLessons.length,
      completedCategory: false, // simplified
      sessions,
      weightLog,
    };

    // Update workout streak
    const hasWorkoutToday = sessions.some((s) => s.dateKey === today);
    updateStreak(state, "workout", today, hasWorkoutToday);

    // Update protein streak (estimated — uses workout log protein or nutrition data)
    // Will be updated by external calls to markProteinDay()
    // Update weight logging streak
    const hasWeightToday = weightLog.some((w) => w.date === today);
    updateStreak(state, "weightLogging", today, hasWeightToday);

    // Generate challenges
    const dailyChallenge = generateDailyChallenge(state, data);
    const weeklyChallenges = generateWeeklyChallenges(state, data);
    const monthlyChallenges = generateMonthlyChallenges(state, data);

    // Check achievements
    const newAchievements = checkAchievements(state, data);

    // Check daily challenge progress
    if (dailyChallenge && !dailyChallenge.completed) {
      if (dailyChallenge.id === "daily-log-weight" && hasWeightToday) {
        updateChallengeProgress(state, dailyChallenge.id, 1);
      }
      if (dailyChallenge.id === "daily-complete-workout" && hasWorkoutToday) {
        updateChallengeProgress(state, dailyChallenge.id, 1);
      }
    }

    // Check weekly challenge progress (set mode — recompute from scratch)
    weeklyChallenges.forEach((c) => {
      if (c.completed) return;
      if (c.id === "weekly-all-workouts") {
        const weekSessions = sessions.filter((s) => s.dateKey && s.dateKey >= getWeekStartKey());
        updateChallengeProgress(state, c.id, weekSessions.length, "set");
      }
      if (c.id === "weekly-log-weight") {
        const weekWeights = weightLog.filter((w) => w.date && w.date >= getWeekStartKey());
        updateChallengeProgress(state, c.id, weekWeights.length, "set");
      }

    });

    // Check monthly challenge progress (set mode)
    monthlyChallenges.forEach((c) => {
      if (c.completed) return;
      if (c.id === "monthly-workouts-20") {
        const monthSessions = sessions.filter((s) => s.dateKey && s.dateKey.startsWith(getMonthPrefixKey()));
        updateChallengeProgress(state, c.id, monthSessions.length, "set");
      }
    });

    saveState(state);

    // XP/Level info
    const xpInfo = getXPProgress(state.xp);

    return {
      xp: xpInfo,
      level: xpInfo.level,
      levelTitle: xpInfo.title,
      totalXP: state.xp,
      streak: state.streak,
      achievements: {
        all: ACHIEVEMENTS,
        unlocked: state.achievements,
        new: newAchievements,
        count: state.achievements.length,
        total: ACHIEVEMENTS.length,
      },
      challenges: {
        daily: dailyChallenge,
        weekly: weeklyChallenges,
        monthly: monthlyChallenges,
        active: state.challenges.active.filter((c) => !c.completed),
        completed: state.challenges.completed.length,
      },
    };
  }

  // ---- External helpers --------------------------------------
  function markProteinDay(dateKey) {
    const state = loadState();
    updateStreak(state, "protein", dateKey, true);
  }

  function markWorkoutDone(dateKey) {
    const state = loadState();
    updateStreak(state, "workout", dateKey, true);
  }

  function markLearningDone(dateKey) {
    const state = loadState();
    updateStreak(state, "learning", dateKey, true);
  }

  function getStreakInfo() {
    const state = loadState();
    return state.streak;
  }

  function getAchievementByCategory(category) {
    return ACHIEVEMENTS.filter((a) => a.category === category);
  }

  function getAllAchievements() {
    return ACHIEVEMENTS;
  }

  // ---- Utility Helpers ---------------------------------------
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  function getPicks(seed, poolSize, count) {
    const h = Math.abs(hashString(seed));
    const picks = [];
    const taken = new Set();
    for (let i = 0; i < count; i++) {
      let idx = (h + i * 7) % poolSize;
      let attempts = 0;
      while (taken.has(idx) && attempts < poolSize) {
        idx = (idx + 1) % poolSize;
        attempts++;
      }
      taken.add(idx);
      picks.push(idx);
    }
    return picks;
  }

  function getDateKey(date) {
    if (!date) date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function getWeekStartKey() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(now);
    monday.setDate(diff);
    return getDateKey(monday);
  }

  function getWeekEndKey() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() + (7 - day) + (day === 0 ? 0 : 1);
    const sunday = new Date(now);
    sunday.setDate(diff);
    return getDateKey(sunday);
  }

  function getMonthPrefixKey() {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  }

  function getMonthEndKey() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return getDateKey(lastDay);
  }

  function getWeeklyWorkoutCount(data) {
    // Estimate weekly workout count from plan
    const plan = data.plan || [];
    if (plan.length > 0) return plan.length;
    return 4; // default
  }

  function calculateWeightLost(user, weightLog) {
    const start = user.startWeight;
    if (!start || !weightLog.length) return 0;
    const sorted = weightLog.slice().sort((a, b) => b.date.localeCompare(a.date));
    const current = sorted[0].weight;
    const diff = start - current;
    return diff > 0 ? diff : 0;
  }

  function calculateWeightGained(user, weightLog) {
    const start = user.startWeight;
    if (!start || !weightLog.length) return 0;
    const sorted = weightLog.slice().sort((a, b) => b.date.localeCompare(a.date));
    const current = sorted[0].weight;
    const diff = current - start;
    return diff > 0 ? diff : 0;
  }

  function getLiftMax(prs, key) {
    if (!prs || !prs[key]) return null;
    const hist = prs[key].history;
    if (!hist || !hist.length) return null;
    return Math.max(...hist.map((h) => h.weight || 0));
  }

  // ---- Public API --------------------------------------------
  return {
    runAll,
    markProteinDay,
    markWorkoutDone,
    markLearningDone,
    getStreakInfo,
    getAchievementByCategory,
    getAllAchievements,
    awardXP,
    getLevel: (xp) => getLevelProgress(xp),
  };

  function getLevelProgress(xp) {
    return getXPProgress(xp !== undefined ? xp : loadState().xp);
  }
})();
