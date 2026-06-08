const STORAGE_KEY = "workout-tracker-v3";
const PROTEIN_GOAL = 146;
const CARBS_GOAL = 240;
const FAT_GOAL = 65;
const CAL_GOAL = 2100;
const WATER_TARGET = 3000;
const DEFAULT_REST = 90;

const GOALS = [
  { id: "fat-loss", label: "Fat Loss", expectedWeekly: -0.5 },
  { id: "recomp", label: "Recomp", expectedWeekly: 0 },
  { id: "lean-bulk", label: "Lean Bulk", expectedWeekly: 0.25 },
  { id: "aggressive-bulk", label: "Bulk", expectedWeekly: 0.5 },
];

const curatedFoods = [
  { name: "Eggs", protein: 6, carbs: 0.5, fat: 5, cal: 72, unit: "egg", qty: 1, step: 1, min: 1, max: 8 },
  { name: "Chapathi", protein: 3, carbs: 15, fat: 1, cal: 81, unit: "piece", qty: 2, step: 1, min: 1, max: 4 },
  { name: "Rice", protein: 4, carbs: 45, fat: 0.5, cal: 201, unit: "100g", qty: 100, step: 50, min: 50, max: 500 },
  { name: "Chicken Biryani", protein: 28, carbs: 65, fat: 15, cal: 507, unit: "plate", qty: 1, step: 0.5, min: 0.5, max: 3 },
  { name: "Chicken Fry", protein: 12, carbs: 2, fat: 10, cal: 146, unit: "piece", qty: 3, step: 1, min: 1, max: 6 },
  { name: "Kebab", protein: 10, carbs: 2, fat: 8, cal: 120, unit: "piece", qty: 3, step: 1, min: 1, max: 6 },
  { name: "Grill (Chicken)", protein: 25, carbs: 3, fat: 12, cal: 220, unit: "serving", qty: 1, step: 0.5, min: 0.5, max: 3 },
  { name: "Dal", protein: 6, carbs: 18, fat: 2, cal: 114, unit: "100g", qty: 100, step: 50, min: 50, max: 400 },
  { name: "Protein Shake", protein: 30, carbs: 5, fat: 2, cal: 158, unit: "scoop", qty: 1, step: 1, min: 1, max: 3 },
  { name: "Banana", protein: 1, carbs: 27, fat: 0.3, cal: 115, unit: "piece", qty: 1, step: 1, min: 1, max: 3 },
  { name: "Milk", protein: 8, carbs: 12, fat: 8, cal: 152, unit: "cup", qty: 1, step: 1, min: 0.5, max: 3 },
  { name: "Curd Rice", protein: 8, carbs: 35, fat: 5, cal: 217, unit: "bowl", qty: 1, step: 1, min: 0.5, max: 2 },
  { name: "Samosa", protein: 4, carbs: 22, fat: 12, cal: 212, unit: "piece", qty: 2, step: 1, min: 1, max: 4 },
  { name: "Custom Entry", protein: 0, carbs: 0, fat: 0, cal: 0, unit: "", qty: 1, step: 1, min: 1, max: 1 },
];

const plan = [
  { id: "push-heavy", name: "Push (Heavy)", focus: "Heavy pressing with focused triceps and lateral delt work.", day: "Day 1", duration: "75-80 min", rest: "3-4 min on big presses, 60 sec between triceps superset pairs.",
    exercises: [
      { name: "Flat Barbell Bench Press", sets: 4, reps: 6, repTarget: "4-6", weight: "", priority: true, tip: "Scapula retracted, slight arch, feet flat, 3 sec negative." },
      { name: "Incline Dumbbell Press", sets: 3, reps: 8, repTarget: "6-8", weight: "", tip: "Use a 30 degree incline, pause in the bottom stretch." },
      { name: "Landmine Press", sets: 3, reps: 8, repTarget: "8", weight: "", tip: "Shoulder-safe press, one arm at a time, drive through heel of palm." },
      { name: "Cable Lateral Raise", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Low pulley behind body, lead with elbow, use full range." },
      { name: "Cable Overhead Tricep Extension", sets: 3, reps: 10, repTarget: "10", weight: "", superset: "Pair with rope pushdown.", tip: "Full long-head stretch at the top, 3 sec negative." },
      { name: "Tricep Rope Pushdown", sets: 3, reps: 12, repTarget: "12", weight: "", superset: "Pair with overhead extension.", tip: "Elbows pinned, full lockout, 60 sec rest after the pair." },
    ] },
  { id: "pull-heavy", name: "Pull (Heavy)", focus: "Heavy deadlift and vertical pull work with rear delt volume.", day: "Day 2", duration: "80-85 min", rest: "3-4 min on deadlift and heavy pulls.",
    exercises: [
      { name: "Conventional Deadlift", sets: 4, reps: 5, repTarget: "3-5", weight: "", priority: true, tip: "First exercise. Brace 360, lats engaged, drive the floor away." },
      { name: "Weighted Pull-Up / Lat Pulldown", sets: 4, reps: 6, repTarget: "4-6", weight: "", priority: true, tip: "Pull elbows to hips, 3 sec negative, lat width is priority." },
      { name: "Chest-Supported Dumbbell Row", sets: 3, reps: 10, repTarget: "8-10", weight: "", tip: "Bench at 30 degrees, drive elbows past torso." },
      { name: "Face Pulls", sets: 4, reps: 15, repTarget: "15", weight: "", priority: true, tip: "Every pull session. Rope to forehead with external rotation." },
      { name: "Incline Dumbbell Curl", sets: 3, reps: 10, repTarget: "8-10", weight: "", tip: "Full stretch at bottom, slow negative." },
      { name: "Farmer's Carry", sets: 3, reps: 1, repTarget: "20-30m length", weight: "", priority: true, tip: "Heaviest dumbbells, locked wrists, grip and forearm finisher." },
    ] },
  { id: "legs-quad", name: "Legs (Quad Focus)", focus: "Quad-biased squatting and leg press with hamstring support.", day: "Day 3", duration: "75-80 min", rest: "3-4 min on box squat, controlled tempo on accessories.",
    exercises: [
      { name: "Box Squat to Parallel", sets: 4, reps: 6, repTarget: "4-6", weight: "", priority: true, tip: "To bench only, not below parallel until knee is pain-free 4+ weeks." },
      { name: "Romanian Deadlift", sets: 3, reps: 10, repTarget: "10", weight: "", tip: "Lighter than Pull A, hamstring stretch, 1 sec pause." },
      { name: "Leg Press (Feet High)", sets: 3, reps: 12, repTarget: "10-12", weight: "", tip: "High foot placement, do not lock out at top." },
      { name: "Seated Leg Curl", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Slow negative, full stretch at bottom." },
      { name: "Standing Calf Raise", sets: 4, reps: 20, repTarget: "20", weight: "", tip: "Full range, 2 sec stretch pause, 4 sec negative." },
    ] },
  { id: "push-volume", name: "Push (Volume)", focus: "Higher-rep pressing volume with shoulder and triceps finishers.", day: "Day 4", duration: "80-85 min", rest: "60-90 sec on isolations, 60 sec between triceps superset pairs.",
    exercises: [
      { name: "Flat Barbell Bench Press", sets: 4, reps: 10, repTarget: "8-10", weight: "", priority: true, tip: "Same movement as A day, more reps, harder negative." },
      { name: "Incline Dumbbell Press", sets: 3, reps: 12, repTarget: "10-12", weight: "", tip: "Pause at bottom stretch 1 sec." },
      { name: "Cable Lateral Raise", sets: 4, reps: 15, repTarget: "15", weight: "", tip: "Constant tension, 3 sec negative, burn them out." },
      { name: "Seated Dumbbell Shoulder Press", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Neutral grip, elbows slightly in front for shoulder safety." },
      { name: "Cable Overhead Tricep Extension", sets: 3, reps: 15, repTarget: "12-15", weight: "", superset: "Pair with rope pushdown.", tip: "Higher-rep long-head triceps work." },
      { name: "Tricep Rope Pushdown", sets: 3, reps: 15, repTarget: "15", weight: "", superset: "Pair with overhead extension.", tip: "Elbows pinned, chase the pump." },
    ] },
  { id: "pull-volume", name: "Pull (Volume)", focus: "Back volume, traps, rear delts, and layered biceps work.", day: "Day 5", duration: "85-90 min", rest: "60-90 sec on volume pulls and arms.",
    exercises: [
      { name: "Lat Pulldown / Pull-Up", sets: 4, reps: 10, repTarget: "8-10", weight: "", priority: true, tip: "Full range, 3 sec negative, squeeze at bottom." },
      { name: "Seated Cable Row", sets: 4, reps: 12, repTarget: "12", weight: "", tip: "Narrow grip, hard squeeze at end range." },
      { name: "Face Pulls", sets: 4, reps: 15, repTarget: "15", weight: "", priority: true, tip: "Shoulder health. Light and controlled." },
      { name: "Barbell Shrug", sets: 4, reps: 12, repTarget: "12", weight: "", priority: true, tip: "Straight up, hold 1 sec, straight down. Never roll." },
      { name: "Hammer Curl", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Brachialis and arm thickness, no swinging." },
      { name: "Incline Dumbbell Curl", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Extra arm volume, full stretch, slow negative." },
      { name: "Reverse Curl", sets: 3, reps: 15, repTarget: "15", weight: "", tip: "Overhand grip, brachioradialis and forearm extensor finisher." },
    ] },
  { id: "legs-hamstring", name: "Legs (Hamstring Focus)", focus: "Heavy hinge work with hamstring volume and lighter squat practice.", day: "Day 6", duration: "75-80 min", rest: "3-4 min on heavy RDL, controlled tempo on hamstring work.",
    exercises: [
      { name: "Romanian Deadlift (Heavy)", sets: 4, reps: 8, repTarget: "6-8", weight: "", priority: true, tip: "Primary movement today, heavier than Wednesday." },
      { name: "Leg Press (Feet High)", sets: 4, reps: 15, repTarget: "12-15", weight: "", tip: "Pause at bottom for glute stretch." },
      { name: "Seated Leg Curl", sets: 4, reps: 12, repTarget: "10-12", weight: "", tip: "Heavier than Wednesday, 4 sec negative." },
      { name: "Box Squat (Light)", sets: 3, reps: 10, repTarget: "10", weight: "", tip: "Volume-focused second squat exposure." },
      { name: "Standing Calf Raise", sets: 4, reps: 20, repTarget: "20", weight: "", tip: "Full range, 2 sec stretch pause, 4 sec negative." },
    ] },
];

const state = loadState();

// ===== STATE =====
function loadState() {
  const fallback = { sessions: [], nutrition: {}, planOffset: 0, recoveryLog: [], bodyGoal: "recomp", calorieTarget: CAL_GOAL, fatTarget: FAT_GOAL };
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; } catch { return fallback; }
}

function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
function saveAndRender() { saveState(); render(); }

function ensureTodaySession(forceCurrentWorkout = false) {
  const today = getDateKey();
  let session = state.sessions.find((item) => item.dateKey === today);
  const workout = forceCurrentWorkout ? getPlannedWorkout() : getCurrentWorkout();
  if (!session || forceCurrentWorkout) {
    session = {
      id: crypto.randomUUID(),
      dateKey: today,
      workoutId: workout.id,
      workoutName: workout.name,
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: Array.from({ length: exercise.sets }, () => ({ reps: exercise.reps || 8, weight: "", done: false })),
      })),
    };
    state.sessions = state.sessions.filter((item) => item.dateKey !== today);
    state.sessions.unshift(session);
    saveState();
  }
  return session;
}

function getTodaySession() { return ensureTodaySession(); }

function getCurrentWorkout() {
  const todaySession = state.sessions.find((item) => item.dateKey === getDateKey());
  const activePlan = loadCustomProgram() || plan;
  if (todaySession) return activePlan.find((w) => w.id === todaySession.workoutId) || getPlannedWorkout();
  return getPlannedWorkout();
}

function getPlannedWorkout() {
  const activePlan = loadCustomProgram() || plan;
  return activePlan[state.planOffset % activePlan.length];
}

function getExerciseSession(session, exercise) {
  let ex = session.exercises.find((item) => item.name === exercise.name);
  if (!ex) {
    ex = { name: exercise.name, sets: Array.from({ length: exercise.sets }, () => ({ reps: exercise.reps || 8, weight: "", done: false })) };
    session.exercises.push(ex);
    saveState();
  }
  return ex;
}

function getCompletion(session) {
  const sets = session.exercises.flatMap((ex) => ex.sets);
  const done = sets.filter((set) => set.done).length;
  return { done, total: sets.length, percent: sets.length ? Math.round((done / sets.length) * 100) : 0 };
}

function getLastSessionData(exerciseName) {
  const sessions = state.sessions.filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  for (const session of sessions) {
    const ex = session.exercises.find((e) => e.name === exerciseName);
    if (ex) {
      const doneSets = ex.sets.filter((s) => s.done && s.weight && Number(s.weight) > 0);
      if (doneSets.length) {
        const lastSet = doneSets[doneSets.length - 1];
        return { weight: Number(lastSet.weight), reps: lastSet.reps };
      }
    }
  }
  return null;
}

// ===== PR SYSTEM =====
function loadPRs() {
  try { return JSON.parse(localStorage.getItem("wl_prs")) || {}; } catch { return {}; }
}
function savePRs(prs) { try { localStorage.setItem("wl_prs", JSON.stringify(prs)); } catch {} }

function checkPRs(session) {
  const prs = loadPRs();
  let updated = false;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.done && set.weight && Number(set.weight) > 0) {
        const w = Number(set.weight);
        const current = prs[ex.name];
        if (!current || w > current.weight) {
          prs[ex.name] = { weight: w, reps: set.reps, date: session.dateKey };
          updated = true;
        }
      }
    }
  }
  if (updated) savePRs(prs);
}

function showPRToast(msg) {
  const toast = document.getElementById("prToast");
  document.getElementById("prToastMsg").textContent = msg;
  toast.classList.remove("is-hidden");
  setTimeout(() => toast.classList.add("is-hidden"), 3000);
}

// ===== DATE UTILITIES =====
function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatReadableDate(date) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function formatWeight(weight) {
  if (weight === "" || weight === null || weight === undefined) return "add weight";
  if (Number(weight) === 0) return "bodyweight";
  return `${Number(weight)} kg`;
}

function formatStopwatch(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getTargetReps(exercise) {
  return exercise.reps || 10;
}

// ===== ANALYSIS =====
function getWeeklyStrengthChange() {
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
  const prevSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey < getDateKey(new Date(Date.now() - 7 * 86400000)) && s.dateKey >= getDateKey(new Date(Date.now() - 14 * 86400000)));
  const volWeek = weekSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0), 0), 0);
  const volPrev = prevSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0), 0), 0);
  if (volPrev > 0) return (volWeek - volPrev) / volPrev * 100;
  return null;
}

function getWeeklyProteinAdherence() {
  let totalPct = 0;
  let days = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = getDateKey(d);
    const meals = loadMeals(key);
    const protein = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
    if (protein > 0) { totalPct += (protein / PROTEIN_GOAL) * 100; days++; }
  }
  return days > 0 ? totalPct / days : null;
}

function getWeeklyMacroAvg() {
  let p = 0, c = 0, f = 0, cal = 0, days = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const meals = loadMeals(getDateKey(d));
    if (meals.length > 0) {
      p += meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
      c += meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0);
      f += meals.reduce((s, m) => s + (Number(m.fat) || 0), 0);
      cal += meals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
      days++;
    }
  }
  return days > 0 ? { p: p / days, c: c / days, f: f / days, cal: cal / days } : null;
}

function getMonthlyMacroAvg() {
  let p = 0, c = 0, f = 0, cal = 0, days = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const meals = loadMeals(getDateKey(d));
    if (meals.length > 0) {
      p += meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
      c += meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0);
      f += meals.reduce((s, m) => s + (Number(m.fat) || 0), 0);
      cal += meals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
      days++;
    }
  }
  return days > 0 ? { p: p / days, c: c / days, f: f / days, cal: cal / days } : null;
}

function getGoalAlignmentScore() {
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const goal = GOALS.find((g) => g.id === state.bodyGoal);
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
  if (log.length < 2) return null;
  let score = 5;
  if (log.length >= 4 && goal) {
    const wa = getDateKey(new Date(Date.now() - 7 * 86400000));
    const twa = getDateKey(new Date(Date.now() - 14 * 86400000));
    const r = log.filter((e) => e.date >= wa);
    const p = log.filter((e) => e.date >= twa && e.date < wa);
    if (r.length >= 2 && p.length >= 2) {
      const change = (r.reduce((s, e) => s + e.weight, 0) / r.length) - (p.reduce((s, e) => s + e.weight, 0) / p.length);
      if (goal.id === "fat-loss" && change < 0) score += 2;
      else if ((goal.id === "lean-bulk" || goal.id === "aggressive-bulk") && change > 0) score += 2;
      else if (goal.id === "recomp" && Math.abs(change) < 0.3) score += 2;
      else score -= 2;
    }
  }
  const strengthPct = getWeeklyStrengthChange();
  if (strengthPct !== null) {
    if (strengthPct > 3) score += 1.5;
    else if (strengthPct < -3) score -= 1.5;
  }
  const protPct = getWeeklyProteinAdherence();
  if (protPct !== null) {
    if (protPct >= 80) score += 1.5;
    else score -= 1;
  }
  if (weekSessions.length >= 5) score += 1.5;
  else if (weekSessions.length < 3) score -= 1;
  return Math.round(Math.max(0, Math.min(10, score)) * 10) / 10;
}

// ===== DATA LOADERS =====
function loadMeals(dateKey) {
  try { return JSON.parse(localStorage.getItem(`wl_meals_${dateKey}`)) || []; } catch { return []; }
}
function saveMeals(dateKey, meals) { try { localStorage.setItem(`wl_meals_${dateKey}`, JSON.stringify(meals)); } catch {} }

function loadWater(dateKey) { try { return Number(localStorage.getItem(`wl_water_${dateKey}`)) || 0; } catch { return 0; } }
function saveWater(dateKey, ml) { try { localStorage.setItem(`wl_water_${dateKey}`, String(ml)); } catch {} }

function loadBodyLog() { try { return JSON.parse(localStorage.getItem("wl_bodylog")) || []; } catch { return []; } }
function saveBodyLogEntry(entry) {
  const log = loadBodyLog();
  const idx = log.findIndex((e) => e.date === entry.date);
  if (idx >= 0) log[idx] = entry;
  else log.push(entry);
  try { localStorage.setItem("wl_bodylog", JSON.stringify(log)); } catch {}
}

function loadCustomProgram() { try { return JSON.parse(localStorage.getItem("wl_custom_program")); } catch { return null; } }

function loadFavoriteMeals() { try { return JSON.parse(localStorage.getItem("wl_fav_meals")) || []; } catch { return []; } }
function saveFavoriteMeals(meals) { try { localStorage.setItem("wl_fav_meals", JSON.stringify(meals)); } catch {} }

function loadRecentFoods() {
  try { return JSON.parse(localStorage.getItem("wl_recent_foods")) || []; } catch { return []; }
}
function saveRecentFoods(name) {
  const list = loadRecentFoods();
  const filtered = list.filter((f) => f !== name);
  filtered.unshift(name);
  try { localStorage.setItem("wl_recent_foods", JSON.stringify(filtered.slice(0, 8))); } catch {}
}

function getTodayMealsSnapshot() {
  const today = getDateKey();
  return loadMeals(today).map((m) => ({ food: m.food, qty: m.qty, protein: m.protein, carbs: m.carbs, fat: m.fat, cal: m.cal }));
}

// ===== REST TIMER =====
let restTimerInterval = null;
let restTimerSeconds = 0;

function startRestTimer() {
  clearInterval(restTimerInterval);
  restTimerSeconds = DEFAULT_REST;
  const el = document.getElementById("restTimer");
  el.classList.remove("is-hidden");
  updateRestTimerDisplay();
  restTimerInterval = setInterval(() => {
    restTimerSeconds--;
    updateRestTimerDisplay();
    if (restTimerSeconds <= 0) {
      clearInterval(restTimerInterval);
      restTimerInterval = null;
      el.classList.add("is-hidden");
    }
  }, 1000);
}

function clearRestTimer() {
  clearInterval(restTimerInterval);
  restTimerInterval = null;
  document.getElementById("restTimer").classList.add("is-hidden");
}

function updateRestTimerDisplay() {
  const m = Math.floor(restTimerSeconds / 60);
  const s = restTimerSeconds % 60;
  document.getElementById("rtTime").textContent = `${m}:${String(s).padStart(2, "0")}`;
  const total = DEFAULT_REST;
  const pct = restTimerSeconds / total;
  const circumference = 113.1;
  const offset = circumference * (1 - pct);
  document.getElementById("rtRing").setAttribute("stroke-dashoffset", offset);
}

// ===== STOPWATCH =====
let stopwatchInterval = null;
let stopwatchElapsed = 0;

function startStopwatch() {
  if (stopwatchInterval) return;
  stopwatchInterval = setInterval(() => {
    stopwatchElapsed++;
    updateTopbarTimer();
  }, 1000);
}

function stopStopwatch() {
  if (stopwatchInterval) { clearInterval(stopwatchInterval); stopwatchInterval = null; }
  const session = getTodaySession();
  session.duration = stopwatchElapsed;
  saveState();
  stopwatchElapsed = 0;
  updateTopbarTimer();
}

function updateTopbarTimer() {
  const el = document.getElementById("topbarTimer");
  if (stopwatchInterval || stopwatchElapsed > 0) {
    el.textContent = formatStopwatch(stopwatchElapsed);
  } else {
    el.textContent = "";
  }
}

// ===== STREAK =====
function updateStreak() {
  const sessions = state.sessions.filter((s) => s.finishedAt);
  let streak = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sessions.find((s) => s.dateKey === getDateKey(d))) streak++;
    else break;
  }
  document.getElementById("l1Streak").textContent = streak > 0 ? `${streak} day streak` : "";
  document.getElementById("streakBadge").textContent = streak > 0 ? `${streak} day streak` : "";
}

// ===== PILL NAV TAB SYSTEM =====
let currentTab = "sets";

function activateTab(tabName) {
  currentTab = tabName;

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + tabName));

  positionNavIndicator();

  if (tabName === "sessions") renderSessionsTab();
  if (tabName === "body") renderBodyTab();
  if (tabName === "today") renderTodayTab();
  if (tabName === "sets") renderSetsPanel();
}

function positionNavIndicator() {
  const nav = document.getElementById("bottomNav");
  const active = nav.querySelector(".nav-tab.is-active");
  const indicator = document.getElementById("navIndicator");
  if (active && indicator) {
    indicator.style.left = active.offsetLeft + "px";
    indicator.style.width = active.offsetWidth + "px";
  }
}

function render() {
  ensureTodaySession();
  document.getElementById("todayLabel").textContent = formatReadableDate(new Date());
  updateStreak();
  renderSetsPanel();
  if (currentTab === "sessions") renderSessionsTab();
  if (currentTab === "body") renderBodyTab();
  if (currentTab === "today") renderTodayTab();
  updateTopbarTimer();
}

// ===== DRILL-DOWN NAVIGATION =====
let drillStack = [];

function showDrillLevel(level) {
  document.querySelectorAll(".sets-level").forEach((el) => el.classList.add("is-hidden"));
  document.getElementById(level).classList.remove("is-hidden");
  const fab = document.getElementById("openLogSheetBtn");
  fab.classList.toggle("is-hidden", level !== "setsL3");
}

function openL1() {
  drillStack = [];
  showDrillLevel("setsL1");
}

function openL2(planId) {
  drillStack = [planId];
  showDrillLevel("setsL2");
  renderL2(planId);
}

function openL3(planId, exerciseName) {
  drillStack = [planId, exerciseName];
  showDrillLevel("setsL3");
  renderL3(planId, exerciseName);
}

function openL4() {
  document.getElementById("logSheet").classList.remove("is-hidden");
}

function closeL4() {
  document.getElementById("logSheet").classList.add("is-hidden");
}

function goBack() {
  if (drillStack.length === 0) return;
  if (!document.getElementById("logSheet").classList.contains("is-hidden")) {
    closeL4();
    return;
  }
  drillStack.pop();
  if (drillStack.length === 0) openL1();
  else if (drillStack.length === 1) openL2(drillStack[0]);
}

// ===== SETS PANEL =====
function renderSetsPanel() {
  renderL1();
  const session = getTodaySession();
  const hasWork = session.exercises.some((e) => e.sets.some((s) => s.done));
  const isRunning = stopwatchInterval;

  if (session.finishedAt) {
    openL1();
  } else if (hasWork || isRunning || stopwatchElapsed > 0) {
    if (drillStack.length === 0) openL1();
  } else {
    openL1();
  }
}

// ===== L1: MY WORKOUTS =====
function renderL1() {
  const container = document.getElementById("l1PlanList");
  const activePlan = loadCustomProgram() || plan;
  container.innerHTML = activePlan.map((w, i) => {
    const dayLabel = w.day || "";
    const isCurrent = i === state.planOffset && !getTodaySession().finishedAt;
    return `<button class="l1-plan-row" data-plan-idx="${i}" data-plan-id="${w.id}">
      <div class="l1-plan-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <div class="l1-plan-info">
        <div class="l1-plan-name">${w.name}${isCurrent ? ' <span style="color:var(--green);font-size:0.7rem">· Today</span>' : ""}</div>
        <div class="l1-plan-desc">${dayLabel} · ${w.duration || ""}${w.focus ? " · " + w.focus : ""}</div>
      </div>
      <div class="l1-plan-meta">${w.exercises.length} exercises</div>
    </button>`;
  }).join("");

  container.querySelectorAll("[data-plan-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const planId = btn.dataset.planId;
      openL2(planId);
    });
  });

  document.getElementById("exerciseCount").textContent = activePlan.reduce((s, w) => s + w.exercises.length, 0);
}

// ===== L2: PLAN DETAIL =====
function renderL2(planId) {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === planId);
  if (!workout) { openL1(); return; }

  document.getElementById("l2PlanName").textContent = workout.name;
  document.getElementById("l2PlanDesc").textContent = workout.focus || "";

  const container = document.getElementById("l2ExerciseList");
  container.innerHTML = workout.exercises.map((ex) => {
    const session = getTodaySession();
    const exSession = getExerciseSession(session, ex);
    const doneSets = exSession.sets.filter((s) => s.done).length;
    const totalSets = exSession.sets.length;
    const lastData = getLastSessionData(ex.name);
    let timeAgo = "";
    if (lastData) {
      const loggedSessions = state.sessions.filter((s) => s.finishedAt);
      const lastSession = loggedSessions.find((s) => {
        const e = s.exercises.find((x) => x.name === ex.name && x.sets.some((st) => st.done && st.weight));
        return e;
      });
      if (lastSession) {
        const days = Math.round((Date.now() - parseDateKey(lastSession.dateKey).getTime()) / 86400000);
        timeAgo = days === 0 ? "Today" : days === 1 ? "1d ago" : `${days}d ago`;
      }
    }

    return `<button class="l2-ex-row" data-ex-name="${ex.name}">
      <div class="l2-ex-info">
        <div class="l2-ex-name">${ex.name}</div>
        <div class="l2-ex-target">${ex.sets}×${ex.repTarget || ex.reps}${lastData ? ` · last ${formatWeight(lastData.weight)}×${lastData.reps}` : ""}</div>
      </div>
      ${timeAgo ? `<span class="l2-ex-time">${doneSets}/${totalSets} sets · ${timeAgo}</span>` : `<span class="l2-ex-time">${doneSets}/${totalSets} sets</span>`}
    </button>`;
  }).join("");

  container.querySelectorAll("[data-ex-name]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exName = btn.dataset.exName;
      openL3(planId, exName);
    });
  });
}

// ===== L3: EXERCISE DETAIL =====
let l3CurrentPlanId = "";
let l3CurrentExName = "";
let l3ActiveTab = "sets";

function renderL3(planId, exerciseName) {
  l3CurrentPlanId = planId;
  l3CurrentExName = exerciseName;

  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === planId);
  const exDef = workout ? workout.exercises.find((e) => e.name === exerciseName) : null;
  const exDisplayName = exDef ? exerciseName.replace(/([A-Z])/g, " $1").trim() : exerciseName;

  document.getElementById("l3ExName").textContent = exDisplayName;
  const session = getTodaySession();
  const exSession = exDef ? getExerciseSession(session, exDef) : session.exercises.find((e) => e.name === exerciseName);

  l3ActiveTab = "sets";
  document.querySelectorAll(".l3-pill").forEach((p) => p.classList.toggle("is-active", p.dataset.l3tab === "sets"));
  document.querySelectorAll(".l3-tab-content").forEach((tc) => tc.classList.add("is-hidden"));
  document.getElementById("l3SetsTab").classList.remove("is-hidden");

  renderL3SetsTab(exDef, exSession);
  renderL3AnalyzeTab(exerciseName);
  renderL3RmTab(exerciseName, exSession);
  updateFabVisibility();
}

function updateFabVisibility() {
  const fab = document.getElementById("openLogSheetBtn");
  fab.classList.remove("is-hidden");
}

function renderL3SetsTab(exDef, exSession) {
  const container = document.getElementById("l3SetList");
  const repeatBtn = document.getElementById("l3RepeatBtn");

  if (!exDef || !exSession) {
    container.innerHTML = `<p class="empty-state">No exercise data.</p>`;
    repeatBtn.classList.add("is-hidden");
    return;
  }

  const doneSets = exSession.sets.filter((s) => s.done);
  const allDone = doneSets.length === exSession.sets.length;

  const prevSessions = state.sessions.filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  let prevExData = null;
  for (const ps of prevSessions) {
    const pe = ps.exercises.find((e) => e.name === exDef.name);
    if (pe) {
      const pdone = pe.sets.filter((s) => s.done && s.weight && Number(s.weight) > 0);
      if (pdone.length > 0) {
        prevExData = pdone;
        break;
      }
    }
  }

  if (prevExData && prevExData.length > 0) {
    repeatBtn.classList.remove("is-hidden");
  } else {
    repeatBtn.classList.add("is-hidden");
  }

  if (exSession.sets.length === 0) {
    container.innerHTML = `<p class="empty-state">No sets logged. Tap + to add.</p>`;
    return;
  }

  container.innerHTML = exSession.sets.map((set, i) => {
    const logged = set.done && set.weight && Number(set.weight) > 0;
    const timeStr = set.loggedAt ? getTimeAgo(set.loggedAt) : "";
    return `<div class="l3-set-row" data-set-idx="${i}">
      <span class="set-num">${i + 1}</span>
      ${logged ? `<span class="set-reps">${set.reps}</span><span class="set-weight">${formatWeight(set.weight)}</span>` : `<span style="flex:1;font-size:0.72rem;color:var(--text-secondary)">Not logged</span>`}
      <span class="set-time">${timeStr}</span>
      <div class="set-actions">
        ${logged ? `<button class="set-edit-btn" data-edit-idx="${i}">Edit</button>` : ""}
        <button class="set-del-btn" data-del-idx="${i}">Del</button>
      </div>
    </div>`;
  }).join("");

  container.querySelectorAll("[data-edit-idx]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.editIdx);
      openL4ForEdit(exDef, exSession, idx);
    });
  });

  container.querySelectorAll("[data-del-idx]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.delIdx);
      deleteSet(exDef, exSession, idx);
    });
  });

  container.querySelectorAll(".l3-set-row").forEach((row) => {
    let touchStartX = 0;
    row.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    row.addEventListener("touchend", (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (diff < -60) {
        row.classList.toggle("swiping");
      } else {
        row.classList.remove("swiping");
      }
    }, { passive: true });
  });
}

function getTimeAgo(loggedAt) {
  const diff = Date.now() - new Date(loggedAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ===== DELETE SET =====
function deleteSet(exDef, exSession, idx) {
  const set = exSession.sets[idx];
  if (!set) return;
  const backup = { ...set, done: set.done, weight: set.weight, reps: set.reps };

  exSession.sets.splice(idx, 1);
  saveState();

  const toast = document.createElement("div");
  toast.className = "undo-toast";
  toast.innerHTML = `<span>Set deleted</span><button class="undo-btn">Undo</button>`;
  document.body.appendChild(toast);

  toast.querySelector(".undo-btn").addEventListener("click", () => {
    exSession.sets.splice(idx, 0, backup);
    saveState();
    toast.remove();
    const activePlan = loadCustomProgram() || plan;
    const workout = activePlan.find((w) => w.id === l3CurrentPlanId);
    const exDefFresh = workout ? workout.exercises.find((e) => e.name === l3CurrentExName) : null;
    renderL3SetsTab(exDefFresh, exSession);
  });

  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);

  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === l3CurrentPlanId);
  const exDefFresh = workout ? workout.exercises.find((e) => e.name === l3CurrentExName) : null;
  renderL3SetsTab(exDefFresh, exSession);
  renderL3RmTab(l3CurrentExName, exSession);
}

// ===== REPEAT BUTTON =====
document.getElementById("l3RepeatBtn").addEventListener("click", () => {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === l3CurrentPlanId);
  const exDef = workout ? workout.exercises.find((e) => e.name === l3CurrentExName) : null;
  if (!exDef) return;

  const session = getTodaySession();
  const exSession = getExerciseSession(session, exDef);

  const prevSessions = state.sessions.filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  let prevExData = null;
  for (const ps of prevSessions) {
    const pe = ps.exercises.find((e) => e.name === exDef.name);
    if (pe) {
      const pdone = pe.sets.filter((s) => s.done && s.weight && Number(s.weight) > 0);
      if (pdone.length > 0) {
        prevExData = pdone;
        break;
      }
    }
  }

  if (!prevExData) return;

  prevExData.forEach((pset) => {
    exSession.sets.push({
      reps: pset.reps,
      weight: pset.weight,
      done: true,
      loggedAt: new Date().toISOString(),
    });
  });

  startStopwatch();
  saveState();
  renderL3SetsTab(exDef, exSession);
  renderL3RmTab(l3CurrentExName, exSession);
  showPRToast(`Repeated ${prevExData.length} sets from previous session`);
});

// ===== L3: ANALYZE TAB =====
let analyzeChartInstance = null;

function renderL3AnalyzeTab(exerciseName) {
  const sessions = state.sessions.filter((s) => s.finishedAt).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const dataPoints = [];
  for (const s of sessions) {
    const ex = s.exercises.find((e) => e.name === exerciseName);
    if (ex) {
      const doneSets = ex.sets.filter((st) => st.done && st.weight && Number(st.weight) > 0);
      if (doneSets.length > 0) {
        const avgWeight = doneSets.reduce((sum, st) => sum + Number(st.weight), 0) / doneSets.length;
        const totalReps = doneSets.reduce((sum, st) => sum + (st.reps || 0), 0);
        const totalSets = doneSets.length;
        const totalVolume = doneSets.reduce((sum, st) => sum + Number(st.weight) * (st.reps || 0), 0);
        dataPoints.push({ date: s.dateKey, avgWeight, totalReps, totalSets, totalVolume });
      }
    }
  }

  if (dataPoints.length < 2) {
    const container = document.getElementById("analyzeDelta");
    container.innerHTML = `<p class="empty-state">Complete at least 2 sessions to see analysis.</p>`;
    if (analyzeChartInstance) { analyzeChartInstance.destroy(); analyzeChartInstance = null; }
    return;
  }

  const canvas = document.getElementById("analyzeChart");
  if (canvas) {
    if (analyzeChartInstance) { analyzeChartInstance.destroy(); }
    const ctx = canvas.getContext("2d");
    const labels = dataPoints.map((dp) => formatReadableDate(parseDateKey(dp.date)));
    const avgWeights = dataPoints.map((dp) => dp.avgWeight);
    const volumes = dataPoints.map((dp) => dp.totalVolume);

    analyzeChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { data: avgWeights, borderColor: "#22c55e", tension: 0.4, pointRadius: 3, fill: false, label: "Avg Weight" },
          { data: volumes, borderColor: "#f97316", tension: 0.4, pointRadius: 2, fill: false, label: "Volume", yAxisID: "y1" },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: "#737373", font: { size: 10 } } } },
        scales: { y: { grid: { color: "#1a1a1a" }, ticks: { color: "#737373" } }, y1: { position: "right", grid: { display: false }, ticks: { color: "#737373" } }, x: { ticks: { color: "#737373", font: { size: 9 } } } },
      },
    });
  }

  const current = dataPoints[dataPoints.length - 1];
  const previous = dataPoints.length >= 2 ? dataPoints[dataPoints.length - 2] : null;
  const container = document.getElementById("analyzeDelta");

  if (!previous) {
    container.innerHTML = `<p class="empty-state">Need more data for comparison.</p>`;
    return;
  }

  const calcDelta = (cur, prev) => {
    if (prev === 0) return { pct: null, abs: cur };
    return { pct: ((cur - prev) / prev) * 100, abs: cur - prev };
  };

  const deltas = [
    { label: "Sets", cur: current.totalSets, prev: previous.totalSets, unit: "" },
    { label: "Reps", cur: current.totalReps, prev: previous.totalReps, unit: "" },
    { label: "Volume", cur: current.totalVolume, prev: previous.totalVolume, unit: "kg" },
    { label: "Avg Rep", cur: current.totalReps / current.totalSets, prev: previous.totalReps / previous.totalSets, unit: "" },
  ];

  container.innerHTML = deltas.map((d) => {
    const delta = calcDelta(d.cur, d.prev);
    const sign = delta.abs > 0 ? "+" : "";
    const cls = delta.abs > 0 ? "is-green" : delta.abs < 0 ? "is-red" : "is-muted";
    return `<div class="ad-item">
      <div class="ad-label">${d.label}</div>
      <div class="ad-current">${typeof d.cur === "number" ? (d.cur % 1 === 0 ? d.cur : d.cur.toFixed(1)) : d.cur}${d.unit}</div>
      <div class="ad-delta ${cls}">${sign}${delta.abs % 1 === 0 ? delta.abs : delta.abs.toFixed(1)}${d.unit} ${delta.pct !== null ? `(${sign}${delta.pct.toFixed(0)}%)` : ""}</div>
    </div>`;
  }).join("");
}

// ===== L3: 1RM TAB =====
let rmChartInstance = null;

function renderL3RmTab(exerciseName, exSession) {
  const container = document.getElementById("rmHero");
  const rmTable = document.getElementById("rmTopSets");
  const canvas = document.getElementById("rmChart");

  const sessions = state.sessions.filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  let bestRm = 0;
  const rmHistory = [];

  for (const s of sessions) {
    const ex = s.exercises.find((e) => e.name === exerciseName);
    if (ex) {
      const doneSets = ex.sets.filter((st) => st.done && st.weight && Number(st.weight) > 0);
      for (const st of doneSets) {
        const w = Number(st.weight);
        const r = st.reps || 1;
        const rm = w * (1 + r / 30);
        if (rm > bestRm) bestRm = rm;
        rmHistory.push({ date: s.dateKey, rm });
      }
    }
  }

  if (exSession) {
    for (const st of exSession.sets) {
      if (st.done && st.weight && Number(st.weight) > 0) {
        const w = Number(st.weight);
        const r = st.reps || 1;
        const rm = w * (1 + r / 30);
        if (rm > bestRm) bestRm = rm;
      }
    }
  }

  container.innerHTML = `
    <div class="rm-number">${bestRm > 0 ? bestRm.toFixed(1) : "--"}</div>
    <div class="rm-label">Estimated 1RM (Epley)</div>
  `;

  const allSets = [];
  for (const s of sessions) {
    const ex = s.exercises.find((e) => e.name === exerciseName);
    if (ex) {
      for (const st of ex.sets) {
        if (st.done && st.weight && Number(st.weight) > 0) {
          const w = Number(st.weight);
          const r = st.reps || 1;
          allSets.push({ weight: w, reps: r, rm: w * (1 + r / 30), date: s.dateKey });
        }
      }
    }
  }

  if (exSession) {
    for (const st of exSession.sets) {
      if (st.done && st.weight && Number(st.weight) > 0) {
        const w = Number(st.weight);
        const r = st.reps || 1;
        allSets.push({ weight: w, reps: r, rm: w * (1 + r / 30), date: getDateKey() });
      }
    }
  }

  allSets.sort((a, b) => b.rm - a.rm);
  const topSets = allSets.slice(0, 5);

  if (topSets.length === 0) {
    rmTable.innerHTML = `<p class="empty-state">Log sets with weight to see 1RM estimates.</p>`;
  } else {
    rmTable.innerHTML = topSets.map((s) =>
      `<div class="rm-row"><span>${formatWeight(s.weight)} × ${s.reps} · ${formatReadableDate(parseDateKey(s.date))}</span><span>${s.rm.toFixed(1)} kg</span></div>`
    ).join("");
  }

  if (canvas && rmHistory.length >= 2) {
    if (rmChartInstance) { rmChartInstance.destroy(); }
    const ctx = canvas.getContext("2d");
    const grouped = {};
    rmHistory.forEach((h) => {
      if (!grouped[h.date]) grouped[h.date] = 0;
      if (h.rm > grouped[h.date]) grouped[h.date] = h.rm;
    });
    const dates = Object.keys(grouped).sort();
    const rms = dates.map((d) => grouped[d]);

    rmChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates.map((d) => formatReadableDate(parseDateKey(d))),
        datasets: [{ data: rms, borderColor: "#f97316", tension: 0.3, pointRadius: 3, fill: false }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { grid: { color: "#1a1a1a" }, ticks: { color: "#737373" } }, x: { ticks: { color: "#737373", font: { size: 9 } } } },
      },
    });
  } else if (canvas && rmHistory.length < 2) {
    if (rmChartInstance) { rmChartInstance.destroy(); rmChartInstance = null; }
  }
}

// ===== L3: PILL TABS =====
document.querySelectorAll(".l3-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    const tab = pill.dataset.l3tab;
    l3ActiveTab = tab;
    document.querySelectorAll(".l3-pill").forEach((p) => p.classList.toggle("is-active", p.dataset.l3tab === tab));
    document.querySelectorAll(".l3-tab-content").forEach((tc) => tc.classList.add("is-hidden"));
    document.getElementById("l3" + tab.charAt(0).toUpperCase() + tab.slice(1) + "Tab").classList.remove("is-hidden");

    if (tab === "analyze") renderL3AnalyzeTab(l3CurrentExName);
    if (tab === "rm") {
      const activePlan = loadCustomProgram() || plan;
      const workout = activePlan.find((w) => w.id === l3CurrentPlanId);
      const exDef = workout ? workout.exercises.find((e) => e.name === l3CurrentExName) : null;
      const session = getTodaySession();
      const exSession = exDef ? getExerciseSession(session, exDef) : null;
      renderL3RmTab(l3CurrentExName, exSession);
    }
  });
});

// ===== BACK BUTTONS =====
document.getElementById("l2BackBtn").addEventListener("click", goBack);
document.getElementById("l3BackBtn").addEventListener("click", goBack);

// ===== BOTTOM SHEET (L4) =====
let lsReps = 10;
let lsWeight = 0;
let lsEditIdx = -1;
let lsExDef = null;
let lsExSession = null;

function openL4ForEdit(exDef, exSession, editIdx) {
  lsExDef = exDef;
  lsExSession = exSession;
  lsEditIdx = editIdx;

  if (editIdx >= 0 && exSession.sets[editIdx]) {
    const set = exSession.sets[editIdx];
    lsReps = set.reps || 10;
    lsWeight = Number(set.weight) || 0;
  } else {
    lsReps = getTargetReps(exDef);
    lsWeight = 0;
  }

  document.getElementById("lsRepValue").textContent = lsReps;
  document.getElementById("lsWtValue").textContent = lsWeight;
  document.getElementById("lsNote").value = "";
  openL4();
}

document.getElementById("openLogSheetBtn").addEventListener("click", () => {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === l3CurrentPlanId);
  const exDef = workout ? workout.exercises.find((e) => e.name === l3CurrentExName) : null;
  if (!exDef) return;
  const session = getTodaySession();
  const exSession = getExerciseSession(session, exDef);

  const doneSets = exSession.sets.filter((s) => s.done);
  if (doneSets.length > 0) {
    lsWeight = Number(doneSets[doneSets.length - 1].weight) || 0;
    lsReps = doneSets[doneSets.length - 1].reps || getTargetReps(exDef);
  } else {
    const lastData = getLastSessionData(exDef.name);
    if (lastData) {
      lsWeight = lastData.weight;
      lsReps = lastData.reps || getTargetReps(exDef);
    } else {
      lsWeight = Number(exDef.weight) || 0;
      lsReps = getTargetReps(exDef);
    }
  }

  lsEditIdx = -1;
  lsExDef = exDef;
  lsExSession = exSession;
  document.getElementById("lsRepValue").textContent = lsReps;
  document.getElementById("lsWtValue").textContent = lsWeight;
  document.getElementById("lsNote").value = "";
  openL4();
});

document.getElementById("lsRepDec").addEventListener("click", () => { lsReps = Math.max(1, lsReps - 1); document.getElementById("lsRepValue").textContent = lsReps; });
document.getElementById("lsRepInc").addEventListener("click", () => { lsReps = Math.min(50, lsReps + 1); document.getElementById("lsRepValue").textContent = lsReps; });
document.getElementById("lsWtDec").addEventListener("click", () => { lsWeight = Math.round(Math.max(0, lsWeight - 2.5) * 10) / 10; document.getElementById("lsWtValue").textContent = lsWeight; });
document.getElementById("lsWtInc").addEventListener("click", () => { lsWeight = Math.round((lsWeight + 2.5) * 10) / 10; document.getElementById("lsWtValue").textContent = lsWeight; });

document.querySelectorAll("[data-ls-wt]").forEach((chip) => {
  chip.addEventListener("click", () => {
    const delta = Number(chip.dataset.lsWt);
    lsWeight = Math.max(0, lsWeight + delta);
    document.getElementById("lsWtValue").textContent = lsWeight;
  });
});

document.getElementById("lsConfirmBtn").addEventListener("click", () => {
  if (!lsExDef || !lsExSession) return;

  if (lsEditIdx >= 0 && lsExSession.sets[lsEditIdx]) {
    const set = lsExSession.sets[lsEditIdx];
    set.reps = lsReps;
    set.weight = lsWeight;
    set.done = true;
    set.loggedAt = new Date().toISOString();
  } else {
    const setData = { reps: lsReps, weight: lsWeight, done: true, loggedAt: new Date().toISOString() };
    lsExSession.sets.push(setData);
  }

  startStopwatch();
  saveState();

  const prs = loadPRs();
  const current = prs[lsExDef.name];
  if (lsWeight > 0 && (!current || lsWeight > current.weight)) {
    prs[lsExDef.name] = { weight: lsWeight, reps: lsReps, date: getDateKey() };
    savePRs(prs);
    showPRToast(`${lsExDef.name}: ${formatWeight(lsWeight)} × ${lsReps}`);
  } else if (lsWeight > 0 && current && lsWeight === current.weight && lsReps > current.reps) {
    prs[lsExDef.name] = { weight: lsWeight, reps: lsReps, date: getDateKey() };
    savePRs(prs);
    showPRToast(`${lsExDef.name}: ${formatWeight(lsWeight)} × ${lsReps} (rep PR)`);
  }

  closeL4();
  startRestTimer();

  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === l3CurrentPlanId);
  const exDefFresh = workout ? workout.exercises.find((e) => e.name === l3CurrentExName) : null;
  const session = getTodaySession();
  const exSessionFresh = exDefFresh ? getExerciseSession(session, exDefFresh) : null;
  renderL3SetsTab(exDefFresh, exSessionFresh);
  renderL3RmTab(l3CurrentExName, exSessionFresh);
});

document.getElementById("lsOverlay").addEventListener("click", closeL4);

// ===== SESSION COMPLETE =====
function buildSessionRecap() {
  const session = getTodaySession();
  const prs = loadPRs();
  let totalVolume = 0;
  let totalSet = 0;
  const newPRs = [];
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.done && set.weight && Number(set.weight) > 0) {
        const w = Number(set.weight);
        const r = Number(set.reps) || 0;
        totalVolume += w * r;
        totalSet++;
        const current = prs[ex.name];
        if (!current || w > current.weight) {
          newPRs.push({ name: ex.name, weight: w, reps: r });
        }
      }
    }
  }
  const elapsed = session.duration || 0;
  const duration = elapsed > 0 ? formatStopwatch(elapsed) : null;
  const volumeKg = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume;
  let html = `<div class="session-recap">`;
  html += `<div><strong>${totalSet}</strong><small>Sets done</small></div>`;
  html += `<div><strong>${volumeKg}</strong><small>Total kg</small></div>`;
  html += `<div><strong>${duration || "--:--"}</strong><small>Duration</small></div>`;
  if (newPRs.length) {
    html += `<div class="session-recap-pr">🏆 ` + newPRs.map((pr) => `${pr.name}: ${formatWeight(pr.weight)} × ${pr.reps}`).join(" · ") + `</div>`;
  }
  html += `</div>`;
  return html;
}

function showNotesModal() {
  document.getElementById("sessionRecap").innerHTML = buildSessionRecap();
  document.getElementById("sessionNotesInput").value = "";
  document.getElementById("notesModal").classList.remove("is-hidden");
}

function hideNotesModal() { document.getElementById("notesModal").classList.add("is-hidden"); }

function completeSession(notes) {
  const session = getTodaySession();
  session.finishedAt = new Date().toISOString();
  session.notes = notes || "";
  checkPRs(session);
  state.planOffset = (state.planOffset + 1) % (loadCustomProgram() || plan).length;
  hideNotesModal();
  stopStopwatch();
  saveAndRender();
  activateTab("sessions");
}

document.getElementById("saveNotesButton").addEventListener("click", () => {
  completeSession(document.getElementById("sessionNotesInput").value);
});
document.getElementById("skipNotesButton").addEventListener("click", () => completeSession(""));
document.getElementById("notesModalClose").addEventListener("click", hideNotesModal);
document.getElementById("notesModal").addEventListener("click", (e) => { if (e.target === e.currentTarget) hideNotesModal(); });

document.getElementById("rtAdd30").addEventListener("click", () => { restTimerSeconds += 30; updateRestTimerDisplay(); });
document.getElementById("rtReset").addEventListener("click", () => { restTimerSeconds = DEFAULT_REST; updateRestTimerDisplay(); });
document.getElementById("rtSkip").addEventListener("click", () => { clearRestTimer(); });

// ===== SESSIONS TAB =====
function renderSessionsTab() {
  renderSessionLog();
  renderPRBoard();
  renderWeeklyReview();
  renderMonthlyReport();
  renderAdherenceGrid();
}

function renderSessionLog() {
  const container = document.getElementById("sessionLog");
  const logs = state.sessions.filter((s) => s.finishedAt).slice().sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  container.innerHTML = logs.length
    ? logs.slice(0, 10).map((s) => {
        const c = getCompletion(s);
        const d = s.duration ? formatStopwatch(s.duration) : "";
        return `<div class="log-item"><div><strong>${s.workoutName}</strong><span>${formatReadableDate(parseDateKey(s.dateKey))}</span></div><span>${d ? d + " · " : ""}${c.done}/${c.total}</span></div>`;
      }).join("")
    : `<p class="empty-state">No finished sessions yet.</p>`;
}

function renderPRBoard() {
  const container = document.getElementById("prGrid");
  const prs = loadPRs();
  const entries = Object.entries(prs).sort((a, b) => b[1].date.localeCompare(a[1].date));
  container.innerHTML = entries.length
    ? entries.slice(0, 8).map(([name, data]) =>
        `<div class="pr-card"><strong>${name}</strong><span>${formatWeight(data.weight)} × ${data.reps}</span></div>`
      ).join("")
    : `<p class="empty-state">Set a PR to see it here.</p>`;
}

function renderWeeklyReview() {
  const container = document.getElementById("weeklyReviewCard");
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
  const prs = loadPRs();

  if (weekSessions.length === 0) {
    container.innerHTML = `<p class="empty-state">Complete a session to see your weekly review.</p>`;
    return;
  }

  const totalSets = weekSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done).length, 0), 0);
  const totalKg = weekSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0), 0), 0);
  const prCount = Object.keys(prs).length;
  const sessionsCount = weekSessions.length;
  const proteinPct = getWeeklyProteinAdherence();

  const strengthPct = getWeeklyStrengthChange();
  const strengthLabel = strengthPct !== null ? (strengthPct > 0 ? `+${strengthPct.toFixed(0)}%` : `${strengthPct.toFixed(0)}%`) : "--";

  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();
  const weekAgo = getDateKey(new Date(now.getTime() - 7 * 86400000));
  const twoWeeksAgo = getDateKey(new Date(now.getTime() - 14 * 86400000));
  const recentWeek = log.filter((e) => e.date >= weekAgo);
  const prevWeek = log.filter((e) => e.date >= twoWeeksAgo && e.date < weekAgo);
  const bwChange = (recentWeek.length >= 2 && prevWeek.length >= 2)
    ? ((recentWeek.reduce((s, e) => s + e.weight, 0) / recentWeek.length) - (prevWeek.reduce((s, e) => s + e.weight, 0) / prevWeek.length)).toFixed(1)
    : "--";

  container.innerHTML = `
    <div class="wr-grid">
      <div class="wr-item"><strong>${sessionsCount}</strong><small>Sessions</small></div>
      <div class="wr-item"><strong>${totalSets}</strong><small>Sets</small></div>
      <div class="wr-item"><strong>${Math.round(totalKg / 1000)}k</strong><small>kg lifted</small></div>
      <div class="wr-item"><strong>${prCount}</strong><small>PRs</small></div>
    </div>
    <div class="wr-grid">
      <div class="wr-item"><strong>${strengthLabel}</strong><small>Strength</small></div>
      <div class="wr-item"><strong>${bwChange !== "--" ? (Number(bwChange) > 0 ? "+" : "") + bwChange + "kg" : "--"}</strong><small>Bodyweight</small></div>
      <div class="wr-item"><strong>${proteinPct !== null ? Math.round(proteinPct) + "%" : "--"}</strong><small>Protein</small></div>
      <div class="wr-item"><strong>${Math.round(totalKg / (sessionsCount || 1) / 100) / 10 || "--"}</strong><small>Avg/Session</small></div>
    </div>
    <div class="wr-note">${getWeeklyNote(strengthPct, bwChange, sessionsCount, proteinPct)}</div>
    ${(() => { const as = getGoalAlignmentScore(); return as !== null ? `<div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);text-align:center;padding-top:0.35rem;border-top:1px solid var(--border)">Goal Alignment: <span style="color:var(--green)">${as}/10</span></div>` : ""; })()}
  `;
}

function getWeeklyNote(strengthPct, bwChange, sessions, proteinPct) {
  if (strengthPct !== null && strengthPct > 5 && sessions >= 5) return "Great week. Strength is up and consistency is strong. Keep going.";
  if (strengthPct !== null && strengthPct > 0) return "Strength is trending up. Stay consistent for continued progress.";
  if (strengthPct !== null && strengthPct < -5) return "Strength is down this week. Consider checking recovery, sleep, and nutrition.";
  if (sessions < 4) return "Fewer sessions this week. Consistency is key — aim for all 6 next week.";
  if (proteinPct !== null && proteinPct < 80) return "Protein intake needs attention. Try to hit your target consistently.";
  return "Solid week. Keep showing up and the results will follow.";
}

function renderMonthlyReport() {
  const container = document.getElementById("monthlyReportContent");
  const monthSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 30 * 86400000)));
  const prevMonthSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 60 * 86400000)) && s.dateKey < getDateKey(new Date(Date.now() - 30 * 86400000)));
  if (monthSessions.length === 0) {
    container.innerHTML = `<p class="empty-state">Complete sessions to see your monthly report.</p>`;
    return;
  }
  const sessionsCount = monthSessions.length;
  const totalSets = monthSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done).length, 0), 0);
  const totalKg = monthSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0), 0), 0);
  const prevKg = prevMonthSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0), 0), 0);
  const volumeChange = prevKg > 0 ? Math.round((totalKg - prevKg) / prevKg * 100) : null;
  const prs = loadPRs();
  const prCount = Object.keys(prs).length;
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const recentLog = log.filter((e) => e.date >= getDateKey(new Date(Date.now() - 30 * 86400000)));
  const prevLog = log.filter((e) => e.date >= getDateKey(new Date(Date.now() - 60 * 86400000)) && e.date < getDateKey(new Date(Date.now() - 30 * 86400000)));
  let bwChange = "--";
  if (recentLog.length >= 2 && prevLog.length >= 2) {
    const avgR = recentLog.reduce((s, e) => s + e.weight, 0) / recentLog.length;
    const avgP = prevLog.reduce((s, e) => s + e.weight, 0) / prevLog.length;
    bwChange = (avgR - avgP).toFixed(1);
  }
  const weeklyAvg = getWeeklyMacroAvg();
  const proteinPct = weeklyAvg ? Math.round((weeklyAvg.p / PROTEIN_GOAL) * 100) : null;
  let rec = "Continue your current approach. Results are on track.";
  if (volumeChange !== null && volumeChange < -10) rec = "Volume has decreased this month. Consider increasing sets or frequency.";
  if (proteinPct !== null && proteinPct < 75) rec = "Protein intake is consistently low. Aim for protein at every meal to support recovery.";
  if (bwChange !== "--" && Number(bwChange) > 0.5 && state.bodyGoal === "fat-loss") rec = "Weight is increasing on a fat-loss goal. Review calorie tracking and weekend intake.";
  container.innerHTML = `
    <div class="mr-grid">
      <div class="mr-item"><strong>${sessionsCount}</strong><small>Sessions</small></div>
      <div class="mr-item"><strong>${totalSets}</strong><small>Sets</small></div>
      <div class="mr-item"><strong>${Math.round(totalKg / 1000)}k</strong><small>Volume</small></div>
      <div class="mr-item"><strong>${volumeChange !== null ? (volumeChange > 0 ? "+" : "") + volumeChange + "%" : "--"}</strong><small>Vol Change</small></div>
      <div class="mr-item"><strong>${prCount}</strong><small>PRs</small></div>
      <div class="mr-item"><strong>${bwChange !== "--" ? (Number(bwChange) > 0 ? "+" : "") + bwChange + " kg" : "--"}</strong><small>Weight Δ</small></div>
      <div class="mr-item"><strong>${proteinPct !== null ? proteinPct + "%" : "--"}</strong><small>Protein</small></div>
      <div class="mr-item"><strong>${Math.round(totalKg / (sessionsCount || 1) / 100) / 10 || "--"}</strong><small>Avg/Session</small></div>
    </div>
    <div class="mr-rec">${rec}</div>
  `;
}

function renderAdherenceGrid() {
  const container = document.getElementById("adherenceCard");
  const sessions = state.sessions.filter((s) => s.finishedAt);
  const today = new Date();
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (sessions.find((s) => s.dateKey === getDateKey(d))) streak++;
    else break;
  }
  let html = `<div class="adherence-header"><span class="streak-label">Streak: ${streak} days</span></div><div class="adherence-grid">`;
  for (let w = 0; w < 12; w++) {
    html += `<div class="adherence-week">`;
    for (let d = 6; d >= 0; d--) {
      const offset = w * 7 + d;
      const date = new Date(today); date.setDate(date.getDate() - offset);
      const key = getDateKey(date);
      const isToday = offset === 0;
      const isFuture = date > today;
      const hasSession = sessions.find((s) => s.dateKey === key);
      let cls = "adherence-day";
      if (isFuture) cls += " cell-future";
      else if (hasSession) cls += " cell-trained";
      else if (date.getDay() === 0) cls += " cell-rest";
      if (isToday) cls += " cell-today";
      html += `<div class="${cls}"></div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

// ===== BODY TAB =====
let weightChartInstance = null;
let weightHistoryChartInstance = null;
let historyFilterDays = 30;

function renderBodyTab() {
  renderGoalSelector();
  renderWeighIn();
  renderTrendAverages();
  renderWeightChart();
  renderGoalPrediction();
  renderBodyAnalysis();
  renderWeightHistoryChart();
}

function renderGoalSelector() {
  const container = document.getElementById("goalSelector");
  const current = state.bodyGoal || "recomp";
  container.innerHTML = GOALS.map((g) =>
    `<button class="goal-btn ${g.id === current ? "is-active" : ""}" data-goal="${g.id}">${g.label}</button>`
  ).join("");
  container.querySelectorAll("[data-goal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.bodyGoal = btn.dataset.goal;
      saveState();
      renderBodyTab();
    });
  });
}

function renderWeighIn() {
  const container = document.getElementById("weighInCard");
  const log = loadBodyLog();
  const today = getDateKey();
  const entry = log.find((e) => e.date === today);
  if (entry) {
    container.innerHTML = `
      <div class="weigh-in-current">${entry.weight} kg</div>
      <div class="weigh-in-changes">
        ${entry.bf ? `<span>BF: ${entry.bf}%</span>` : ""}
      </div>
      <button class="btn-text" id="editWeighInBtn">Edit</button>
    `;
    document.getElementById("editWeighInBtn")?.addEventListener("click", () => { container.innerHTML = buildWeighInForm(entry.weight, entry.bf); attachWeighInListener(); });
  } else {
    container.innerHTML = buildWeighInForm("", "");
    attachWeighInListener();
  }
}

function buildWeighInForm(w, bf) {
  return `<div class="weigh-in-form">
    <label>Weight (kg) <input type="number" step="0.1" id="weightInput" value="${w}" placeholder="e.g. 67" /></label>
    <label>BF % <input type="number" step="0.1" id="bfInput" value="${bf || ""}" placeholder="optional" /></label>
  </div>
  <button class="btn-primary" id="saveWeighInBtn">Save</button>`;
}

function attachWeighInListener() {
  document.getElementById("saveWeighInBtn")?.addEventListener("click", () => {
    const w = Number(document.getElementById("weightInput").value);
    const bf = document.getElementById("bfInput").value ? Number(document.getElementById("bfInput").value) : null;
    if (!w) return;
    saveBodyLogEntry({ date: getDateKey(), weight: w, bf });
    renderBodyTab();
  });
}

function renderTrendAverages() {
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const container = document.getElementById("trendAverages");
  if (log.length < 2) {
    container.innerHTML = "";
    return;
  }
  const now = new Date();
  const avg = (days) => {
    const cutoff = getDateKey(new Date(now.getTime() - days * 86400000));
    const entries = log.filter((e) => e.date >= cutoff);
    if (entries.length < 2) return null;
    return entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  };
  const a7 = avg(7);
  const a14 = avg(14);
  const a30 = avg(30);
  container.innerHTML = `
    <div class="trend-avg"><strong>${a7 ? a7.toFixed(1) : "--"}</strong><small>7-day avg</small></div>
    <div class="trend-avg"><strong>${a14 ? a14.toFixed(1) : "--"}</strong><small>14-day avg</small></div>
    <div class="trend-avg"><strong>${a30 ? a30.toFixed(1) : "--"}</strong><small>30-day avg</small></div>
  `;
  const badge = document.getElementById("trendBadge");
  if (a7 && a14) {
    const diff = a7 - a14;
    const goal = GOALS.find((g) => g.id === state.bodyGoal);
    const expected = goal ? goal.expectedWeekly : 0;
    if (Math.abs(diff) < 0.2) {
      badge.textContent = "Stable";
      badge.className = "trend-badge is-green";
    } else if (expected <= 0 && diff > 0.3) {
      badge.textContent = "↑ Increasing";
      badge.className = "trend-badge is-yellow";
    } else if (expected >= 0 && diff < -0.3) {
      badge.textContent = "↓ Decreasing";
      badge.className = "trend-badge is-yellow";
    } else {
      badge.textContent = diff > 0 ? "↑ Rising" : "↓ Falling";
      badge.className = "trend-badge " + (Math.abs(diff) > 0.5 ? "is-red" : "is-green");
    }
  } else {
    badge.textContent = "Need more data";
    badge.className = "trend-badge is-blue";
  }
}

function renderWeightChart() {
  if (weightChartInstance) { weightChartInstance.destroy(); weightChartInstance = null; }
  const canvas = document.getElementById("weightChart");
  if (!canvas) return;
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const recent = log.slice(-30);
  if (recent.length < 3) return;
  const labels = recent.map((e) => formatReadableDate(parseDateKey(e.date)));
  const data = recent.map((e) => e.weight);
  const ctx = canvas.getContext("2d");
  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ data, borderColor: "#22c55e", tension: 0.4, pointRadius: 2, fill: false }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { min: Math.min(...data) - 0.5, max: Math.max(...data) + 0.5 } } },
  });
}

function renderGoalPrediction() {
  const container = document.getElementById("goalPredictionContent");
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const goal = GOALS.find((g) => g.id === state.bodyGoal);
  if (log.length < 4 || !goal) {
    container.innerHTML = `<p class="empty-state">More data needed for prediction.</p>`;
    return;
  }
  const current = log[log.length - 1].weight;
  const recent = log.slice(-7);
  const avgRecent = recent.length >= 2 ? recent.reduce((s, e) => s + e.weight, 0) / recent.length : current;
  const weeklyRate = goal.expectedWeekly;
  const goalWeight = (goal.id === "fat-loss") ? current - 5 : current + 5;
  const diff = goalWeight - avgRecent;
  const weeksNeeded = weeklyRate !== 0 ? Math.abs(diff / weeklyRate) : 0;
  const targetDate = new Date(Date.now() + weeksNeeded * 7 * 86400000);
  const estDate = weeksNeeded > 0 ? targetDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--";
  container.innerHTML = `
    <div class="prediction-grid">
      <div class="prediction-row"><span>Current</span><span>${avgRecent.toFixed(1)} kg</span></div>
      <div class="prediction-row"><span>Target</span><span>~${goalWeight.toFixed(1)} kg</span></div>
      <div class="prediction-row"><span>Rate</span><span>${weeklyRate > 0 ? "+" : ""}${weeklyRate} kg/week</span></div>
      ${weeksNeeded > 0 ? `<div class="prediction-highlight">Goal by ${estDate} (${Math.ceil(weeksNeeded)} weeks)</div>` : `<div class="prediction-highlight">Maintaining current phase.</div>`}
    </div>
  `;
}

function renderWeightHistoryChart() {
  if (weightHistoryChartInstance) { weightHistoryChartInstance.destroy(); weightHistoryChartInstance = null; }
  const canvas = document.getElementById("weightHistoryChart");
  if (!canvas) return;
  const container = document.getElementById("historyFilterChips");
  container.innerHTML = [7, 30, 90, 365, 0].map((d) =>
    `<button class="filter-chip ${historyFilterDays === d ? "is-active" : ""}" data-days="${d}">${d === 0 ? "All" : d === 365 ? "1y" : d + "d"}</button>`
  ).join("");
  container.querySelectorAll("[data-days]").forEach((btn) => {
    btn.addEventListener("click", () => {
      historyFilterDays = Number(btn.dataset.days);
      renderWeightHistoryChart();
    });
  });

  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  let filtered = log;
  if (historyFilterDays > 0) {
    const cutoff = getDateKey(new Date(Date.now() - historyFilterDays * 86400000));
    filtered = log.filter((e) => e.date >= cutoff);
  }
  if (filtered.length < 3) return;
  const labels = filtered.map((e) => formatReadableDate(parseDateKey(e.date)));
  const data = filtered.map((e) => e.weight);
  const ctx = canvas.getContext("2d");
  weightHistoryChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ data, borderColor: "#22c55e", tension: 0.3, pointRadius: 2, fill: false }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { min: Math.min(...data) - 0.5, max: Math.max(...data) + 0.5 } } },
  });
}

function renderBodyAnalysis() {
  const container = document.getElementById("bodyAnalysis");
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const goal = GOALS.find((g) => g.id === state.bodyGoal);

  if (log.length < 4) {
    container.innerHTML = `<div class="alert-item is-blue"><span class="alert-icon">💡</span><div class="alert-body"><strong>Log at least 4 weigh-ins</strong>to see trend analysis.</div></div>`;
    return;
  }

  const now = new Date();
  const weekAgo = getDateKey(new Date(now.getTime() - 7 * 86400000));
  const twoWeeksAgo = getDateKey(new Date(now.getTime() - 14 * 86400000));
  const recentWeek = log.filter((e) => e.date >= weekAgo);
  const prevWeek = log.filter((e) => e.date >= twoWeeksAgo && e.date < weekAgo);
  const avgRecent = recentWeek.length >= 2 ? recentWeek.reduce((s, e) => s + e.weight, 0) / recentWeek.length : null;
  const avgPrev = prevWeek.length >= 2 ? prevWeek.reduce((s, e) => s + e.weight, 0) / prevWeek.length : null;

  let alerts = [];

  if (avgRecent && avgPrev) {
    const weeklyChange = avgRecent - avgPrev;
    const expected = goal ? goal.expectedWeekly : 0;

    if (goal && goal.id === "fat-loss" && weeklyChange > 0.3) {
      alerts.push({ type: "red", icon: "⚠️", title: "Weight increasing on fat-loss goal", body: "Check tracking accuracy, hidden calories, water retention." });
    } else if (goal && (goal.id === "lean-bulk" || goal.id === "aggressive-bulk") && weeklyChange < -0.3) {
      alerts.push({ type: "yellow", icon: "⚠️", title: "Weight decreasing on bulk goal", body: "Consider increasing calorie intake by 150-250." });
    } else if (goal && goal.id === "recomp" && Math.abs(weeklyChange) > 0.5) {
      alerts.push({ type: "yellow", icon: "⚠️", title: "Weight changing on recomp goal", body: "Recomp expects stable weight. Adjust calories slightly." });
    } else if (Math.abs(weeklyChange) < 0.3) {
      const latestStrength = getWeeklyStrengthChange();
      if (latestStrength && latestStrength > 0) {
        alerts.push({ type: "green", icon: "✅", title: "Recomposition detected", body: "Weight stable, strength increasing. Continue current approach." });
      } else if (avgRecent <= avgPrev) {
        alerts.push({ type: "green", icon: "✓", title: "Trend aligned with goal", body: "Weight is moving in the right direction. Stay consistent." });
      } else {
        alerts.push({ type: "green", icon: "✓", title: "Weight stable", body: `Current rate: ${weeklyChange > 0 ? "+" : ""}${weeklyChange.toFixed(2)}kg/week.` });
      }
    } else {
      alerts.push({ type: "blue", icon: "ℹ️", title: "Trend detected", body: `Change: ${weeklyChange > 0 ? "+" : ""}${weeklyChange.toFixed(2)}kg/week. ${goal ? `Goal expects ${expected > 0 ? "+" : ""}${expected}kg/week.` : ""}` });
    }
  }

  const proteinPct = getWeeklyProteinAdherence();
  if (proteinPct !== null && proteinPct < 80) {
    alerts.push({ type: "yellow", icon: "🥩", title: `Protein at ${Math.round(proteinPct)}% of target`, body: "Prioritize protein at every meal to support recovery." });
  }

  container.innerHTML = alerts.map((a) =>
    `<div class="alert-item is-${a.type}"><span class="alert-icon">${a.icon}</span><div class="alert-body"><strong>${a.title}</strong><br>${a.body}</div></div>`
  ).join("");
}

// ===== TODAY TAB (Fuel + Coach consolidated) =====
function renderTodayTab() {
  renderTodayStatus();
  renderMacroSummary();
  renderProteinScore();
  renderNutritionCompliance();
  renderSmartSuggestions();
  renderFavoriteMeals();
  renderQuickFoods();
  renderMealLog();
  renderWaterTracker();
  renderWeeklyNutritionReview();
  renderCoachAlerts();
  renderRecovery();
  renderStrengthAnalytics();
}

function renderTodayStatus() {
  const container = document.getElementById("todayStatusContent");
  const goal = GOALS.find((g) => g.id === state.bodyGoal);
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));

  let weightOk = true;
  let weightStatus = "On Track";
  let weightCls = "is-green";
  if (log.length >= 4 && goal) {
    const now = new Date();
    const wa = getDateKey(new Date(now.getTime() - 7 * 86400000));
    const twa = getDateKey(new Date(now.getTime() - 14 * 86400000));
    const r = log.filter((e) => e.date >= wa);
    const p = log.filter((e) => e.date >= twa && e.date < wa);
    if (r.length >= 2 && p.length >= 2) {
      const avgR = r.reduce((s, e) => s + e.weight, 0) / r.length;
      const avgP = p.reduce((s, e) => s + e.weight, 0) / p.length;
      const change = avgR - avgP;
      if (goal.id === "fat-loss" && change > 0.3) { weightOk = false; weightStatus = "⚠ Off Track"; weightCls = "is-red"; }
      else if ((goal.id === "lean-bulk" || goal.id === "aggressive-bulk") && change < -0.3) { weightOk = false; weightStatus = "⚠ Off Track"; weightCls = "is-yellow"; }
      else if (goal.id === "recomp" && Math.abs(change) > 0.5) { weightOk = false; weightStatus = "⚠ Needs Attention"; weightCls = "is-yellow"; }
    }
  }

  const strengthPct = getWeeklyStrengthChange();
  let strengthStatus = "Improving";
  let strengthCls = "is-green";
  if (strengthPct === null) { strengthStatus = "Need data"; strengthCls = "is-yellow"; }
  else if (strengthPct < -3) { strengthStatus = "Declining"; strengthCls = "is-red"; }
  else if (strengthPct < 2) { strengthStatus = "Stable"; strengthCls = "is-yellow"; }

  const today = getDateKey();
  const todayMeals = loadMeals(today);
  const todayProtein = todayMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const proteinPct = Math.round((todayProtein / PROTEIN_GOAL) * 100);
  let proteinStatus = `${todayProtein}g / ${PROTEIN_GOAL}g`;
  let proteinCls = proteinPct >= 80 ? "is-green" : proteinPct >= 50 ? "is-yellow" : "is-red";

  const todayCal = todayMeals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
  let calStatus = "On Target";
  let calCls = "is-green";
  if (goal && goal.id === "fat-loss" && todayCal > CAL_GOAL * 1.05) { calStatus = "Over Target"; calCls = "is-yellow"; }
  else if (goal && goal.id !== "fat-loss" && todayCal < CAL_GOAL * 0.85) { calStatus = "Under Target"; calCls = "is-yellow"; }

  let score = 0;
  if (strengthPct !== null && strengthPct > 3) score += 3;
  else if (strengthPct !== null && strengthPct > -3) score += 1.5;
  if (proteinPct >= 80) score += 1.5;
  else if (proteinPct >= 50) score += 0.5;
  if (goal && ((goal.id === "fat-loss" && todayCal <= CAL_GOAL * 1.05) || (goal.id !== "fat-loss" && todayCal >= CAL_GOAL * 0.85))) score += 1.5;
  else if (todayCal > 0) score += 0.5;
  if (weightOk) score += 2;
  if (weekSessions.length >= 5) score += 2;
  else if (weekSessions.length >= 3) score += 1;
  else if (weekSessions.length > 0) score += 0.5;
  score = Math.round(score * 10) / 10;
  const maxScore = 10;

  let recTitle = "";
  let recBody = "";
  if (proteinPct < 80) {
    const remaining = PROTEIN_GOAL - todayProtein;
    recTitle = "Increase Protein";
    recBody = `Add ${Math.ceil(remaining)}g protein — shake, eggs, or chicken before bed.`;
  } else if (!weightOk && goal && goal.id === "fat-loss") {
    recTitle = "Calories May Be Too High";
    recBody = "Weight is trending up on a fat-loss goal. Track accurately, watch weekend intake.";
  } else if (!weightOk && goal && (goal.id === "lean-bulk" || goal.id === "aggressive-bulk")) {
    recTitle = "Increase Calories";
    recBody = "Weight is dropping on a bulk goal. Add 150-250 calories daily.";
  } else if (strengthPct !== null && strengthPct < -5) {
    recTitle = "Check Recovery";
    recBody = "Strength is declining. Prioritize sleep (7-9h), nutrition, and consider a deload.";
  } else if (weekSessions.length < 4) {
    recTitle = "Increase Training Frequency";
    recBody = `Only ${weekSessions.length} sessions this week. Aim for 6 for consistent progress.`;
  } else {
    recTitle = "Continue Current Strategy";
    recBody = "Everything is on track. Keep showing up and results will follow.";
  }

  container.innerHTML = `
    <div class="status-row"><span class="status-label">Goal</span><span class="status-value">${goal ? goal.label : "Not set"}</span></div>
    <div class="status-row"><span class="status-label">Weight Trend</span><span class="status-value ${weightCls}">${weightStatus}</span></div>
    <div class="status-row"><span class="status-label">Strength Trend</span><span class="status-value ${strengthCls}">${strengthStatus}</span></div>
    <div class="status-row"><span class="status-label">Protein</span><span class="status-value ${proteinCls}">${proteinStatus}</span></div>
    <div class="status-row"><span class="status-label">Calories</span><span class="status-value ${calCls}">${calStatus}</span></div>
    <div class="status-score">
      <div class="status-score-num">${score}</div>
      <div class="status-score-label">out of ${maxScore}</div>
    </div>
    <div class="status-rec"><strong>${recTitle}</strong>${recBody}</div>
  `;
}

function renderMacroSummary() {
  const today = getDateKey();
  const meals = loadMeals(today);
  const p = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const c = meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0);
  const f = meals.reduce((s, m) => s + (Number(m.fat) || 0), 0);
  const cal = meals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
  document.getElementById("macroSummary").innerHTML = `
    <div class="macro-stat"><strong class="label-cal">${cal}</strong><small>Cal</small></div>
    <div class="macro-stat"><strong class="label-protein">${p}g</strong><small>Protein</small></div>
    <div class="macro-stat"><strong class="label-carbs">${c}g</strong><small>Carbs</small></div>
    <div class="macro-stat"><strong class="label-fat">${f}g</strong><small>Fat</small></div>
  `;
  document.getElementById("macroProgress").innerHTML = `
    <div class="macro-bar"><span class="bar-label">Protein</span><div class="bar-track"><span style="width:${Math.min((p / PROTEIN_GOAL) * 100, 100)}%;background:var(--green)"></span></div><span class="bar-value">${p}/${PROTEIN_GOAL}g</span></div>
    <div class="macro-bar"><span class="bar-label">Carbs</span><div class="bar-track"><span style="width:${Math.min((c / CARBS_GOAL) * 100, 100)}%;background:var(--blue)"></span></div><span class="bar-value">${c}/${CARBS_GOAL}g</span></div>
    <div class="macro-bar"><span class="bar-label">Fat</span><div class="bar-track"><span style="width:${Math.min((f / FAT_GOAL) * 100, 100)}%;background:var(--orange)"></span></div><span class="bar-value">${f}/${FAT_GOAL}g</span></div>
    <div class="macro-bar"><span class="bar-label">Calories</span><div class="bar-track"><span style="width:${Math.min((cal / CAL_GOAL) * 100, 100)}%;background:var(--text)"></span></div><span class="bar-value">${cal}/${CAL_GOAL}</span></div>
  `;
}

function renderProteinScore() {
  const container = document.getElementById("proteinScoreContent");
  const badge = document.getElementById("proteinScoreBadge");
  const today = getDateKey();
  const meals = loadMeals(today);
  const todayProtein = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const weekly = getWeeklyMacroAvg();
  const monthly = getMonthlyMacroAvg();
  const todayPct = Math.round((todayProtein / PROTEIN_GOAL) * 100);
  const weeklyPct = weekly ? Math.round((weekly.p / PROTEIN_GOAL) * 100) : null;
  const monthlyPct = monthly ? Math.round((monthly.p / PROTEIN_GOAL) * 100) : null;
  const score = todayPct;
  badge.textContent = `${score}%`;
  badge.className = `score-pill is-${score >= 90 ? "green" : score >= 70 ? "yellow" : "red"}`;
  container.innerHTML = `
    <div class="ns-row"><span>Today</span><span>${todayProtein}g / ${PROTEIN_GOAL}g (${todayPct}%)</span></div>
    <div class="ns-row"><span>Weekly avg</span><span>${weeklyPct !== null ? weeklyPct + "%" : "--"}</span></div>
    <div class="ns-row"><span>Monthly avg</span><span>${monthlyPct !== null ? monthlyPct + "%" : "--"}</span></div>
  `;
}

function renderNutritionCompliance() {
  const container = document.getElementById("nutritionComplianceContent");
  const today = getDateKey();
  const meals = loadMeals(today);
  const p = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const c = meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0);
  const f = meals.reduce((s, m) => s + (Number(m.fat) || 0), 0);
  const cal = meals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
  const pPct = Math.min(Math.round((p / PROTEIN_GOAL) * 100), 100);
  const cPct = Math.min(Math.round((c / CARBS_GOAL) * 100), 100);
  const fPct = Math.min(Math.round((f / FAT_GOAL) * 100), 100);
  const calPct = Math.min(Math.round((cal / CAL_GOAL) * 100), 100);
  const goal = GOALS.find((g) => g.id === state.bodyGoal);
  let resultText = "Nutrition looks good today.";
  let resultCls = "is-green";
  if (goal && goal.id === "fat-loss" && calPct > 100) {
    resultText = "Calories exceed target — fat loss may slow.";
    resultCls = "is-yellow";
  }
  if (pPct < 70) {
    resultText = "Protein too low — prioritize protein at meals.";
    resultCls = "is-yellow";
  }
  if (goal && goal.id !== "fat-loss" && calPct < 80) {
    resultText = "Calories too low for growth phase — increase intake.";
    resultCls = "is-yellow";
  }
  let html = `<div class="nc-grid">`;
  html += `<div class="nc-row"><span class="nc-label">Protein</span><div class="nc-track"><span style="width:${pPct}%;background:var(--green)"></span></div><span class="nc-pct">${pPct}%</span></div>`;
  html += `<div class="nc-row"><span class="nc-label">Carbs</span><div class="nc-track"><span style="width:${cPct}%;background:var(--blue)"></span></div><span class="nc-pct">${cPct}%</span></div>`;
  html += `<div class="nc-row"><span class="nc-label">Fat</span><div class="nc-track"><span style="width:${fPct}%;background:var(--orange)"></span></div><span class="nc-pct">${fPct}%</span></div>`;
  html += `<div class="nc-row"><span class="nc-label">Calories</span><div class="nc-track"><span style="width:${calPct}%;background:var(--text)"></span></div><span class="nc-pct">${calPct}%</span></div>`;
  html += `</div><div class="nc-result ${resultCls}">${resultText}</div>`;
  container.innerHTML = html;
}

function renderSmartSuggestions() {
  const container = document.getElementById("smartSuggestionsContent");
  const today = getDateKey();
  const meals = loadMeals(today);
  const protein = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const remaining = Math.max(0, PROTEIN_GOAL - protein);
  if (remaining < 10) {
    container.innerHTML = `<p class="empty-state">Protein target met. Great work.</p>`;
    return;
  }
  const suggestions = curatedFoods
    .filter((f) => f.name !== "Custom Entry" && f.protein > 5)
    .sort((a, b) => b.protein / b.cal - a.protein / a.cal)
    .slice(0, 5);
  container.innerHTML = suggestions.map((f) => {
    const needed = Math.ceil(remaining / f.protein);
    return `<button class="suggestion-chip" data-food="${f.name}">${f.name} ×${needed}</button>`;
  }).join("");
  container.querySelectorAll("[data-food]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = curatedFoods.find((f) => f.name === btn.dataset.food);
      if (!food) return;
      const needed = Math.ceil(remaining / food.protein);
      const meals = loadMeals(today);
      meals.push({ type: "Quick", food: food.name, qty: needed, protein: food.protein * needed, carbs: food.carbs * needed, fat: food.fat * needed, cal: food.cal * needed });
      saveMeals(today, meals);
      saveRecentFoods(food.name);
      renderTodayTab();
    });
  });
}

function renderFavoriteMeals() {
  const container = document.getElementById("favoriteMealsList");
  const favorites = loadFavoriteMeals();
  const today = getDateKey();
  if (favorites.length === 0) {
    container.innerHTML = `<p class="empty-state">Save meal combos you eat often for one-tap logging.</p>`;
    return;
  }
  container.innerHTML = favorites.map((meal, i) => {
    const totalP = meal.items.reduce((s, m) => s + (Number(m.protein) || 0) * (Number(m.qty) || 1), 0);
    const totalCal = meal.items.reduce((s, m) => s + (Number(m.cal) || 0) * (Number(m.qty) || 1), 0);
    return `<div class="fav-meal-row">
      <button class="fav-btn" data-fav-idx="${i}">
        <span class="fav-name">${meal.name}</span>
        <span class="fav-macros">${Math.round(totalP)}g P · ${Math.round(totalCal)} cal</span>
      </button>
      <button class="fav-delete" data-del-idx="${i}">✕</button>
    </div>`;
  }).join("");
  container.querySelectorAll("[data-fav-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const meal = favorites[Number(btn.dataset.favIdx)];
      if (!meal) return;
      const meals = loadMeals(today);
      for (const item of meal.items) {
        meals.push({ type: "Fav", food: item.food, qty: item.qty, protein: Number(item.protein) * Number(item.qty), carbs: Number(item.carbs) * Number(item.qty), fat: Number(item.fat) * Number(item.qty), cal: Number(item.cal) * Number(item.qty) });
      }
      saveMeals(today, meals);
      renderTodayTab();
    });
  });
  container.querySelectorAll("[data-del-idx]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.delIdx);
      const favs = loadFavoriteMeals();
      favs.splice(idx, 1);
      saveFavoriteMeals(favs);
      renderFavoriteMeals();
    });
  });
}

document.getElementById("saveFavoriteMealBtn")?.addEventListener("click", () => {
  const items = getTodayMealsSnapshot();
  if (items.length === 0) return;
  const name = prompt("Name this meal:", "Favorites");
  if (!name) return;
  const favorites = loadFavoriteMeals();
  favorites.push({ name: name.trim(), items });
  saveFavoriteMeals(favorites);
  renderFavoriteMeals();
});

function renderQuickFoods() {
  const container = document.getElementById("quickFoods");
  const recent = loadRecentFoods();
  const foods = [...new Set([...recent.filter((f) => f), ...curatedFoods.map((f) => f.name)])].slice(0, 10);
  container.innerHTML = foods.map((name) => `<button class="food-btn" data-food="${name}">${name}</button>`).join("");
  container.querySelectorAll("[data-food]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = curatedFoods.find((f) => f.name === btn.dataset.food);
      if (!food) return;
      const today = getDateKey();
      const meals = loadMeals(today);
      meals.push({ type: "Quick", food: food.name, qty: 1, protein: food.protein, carbs: food.carbs, fat: food.fat, cal: food.cal });
      saveMeals(today, meals);
      saveRecentFoods(food.name);
      renderTodayTab();
    });
  });
}

function renderMealLog() {
  const container = document.getElementById("mealLog");
  const today = getDateKey();
  const meals = loadMeals(today);
  container.innerHTML = meals.length
    ? meals.map((m, i) =>
        `<div class="meal-item"><div><strong>${m.food}</strong>${m.qty ? ` ×${m.qty}` : ""} <span class="meal-macros">${m.protein || 0}g P · ${m.carbs || 0}g C · ${m.fat || 0}g F · ${m.cal || 0} cal</span></div><button class="meal-delete" data-idx="${i}">✕</button></div>`
      ).join("")
    : `<p class="empty-state">No meals logged. Tap a food above.</p>`;
  container.querySelectorAll(".meal-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      const meals = loadMeals(today);
      meals.splice(idx, 1);
      saveMeals(today, meals);
      renderTodayTab();
    });
  });
}

function renderWaterTracker() {
  const container = document.getElementById("waterTracker");
  const today = getDateKey();
  const current = loadWater(today);
  const remaining = Math.max(0, WATER_TARGET - current);
  const pct = Math.min(current / WATER_TARGET, 1);
  const circumference = 198;
  const offset = circumference * (1 - pct);
  const hoursRemaining = Math.ceil(remaining / 200);
  const now = new Date();
  const endHour = now.getHours() + hoursRemaining;
  const predText = hoursRemaining > 0 && endHour <= 23
    ? `Drink 200ml every hour — done by ${endHour}:00`
    : remaining > 0
    ? `${Math.ceil(remaining / 300)} more glasses`
    : "Hydration target met!";
  container.innerHTML = `
    <div class="water-ring">
      <svg viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="31.5" fill="none" stroke="var(--surface)" stroke-width="6"/>
        <circle cx="36" cy="36" r="31.5" fill="none" stroke="var(--blue)" stroke-width="6" stroke-linecap="round" transform="rotate(-90 36 36)" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
      </svg>
      <div class="water-ring-text">${current}<br><small>ml</small></div>
    </div>
    <div style="flex:1">
      <div class="water-controls">
        <button class="water-btn" data-water="250">250ml</button>
        <button class="water-btn" data-water="500">500ml</button>
        <button class="water-btn" data-water="750">750ml</button>
        <button class="water-btn" data-water="1000">1L</button>
      </div>
      <div class="water-prediction">Remaining: ${remaining}ml — ${predText}</div>
    </div>
  `;
  container.querySelectorAll("[data-water]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const amount = Number(btn.dataset.water);
      saveWater(today, loadWater(today) + amount);
      renderWaterTracker();
    });
  });
}

function renderWeeklyNutritionReview() {
  const container = document.getElementById("weeklyNutritionContent");
  const weekly = getWeeklyMacroAvg();
  if (!weekly) {
    container.innerHTML = `<p class="empty-state">Log meals to see your weekly review.</p>`;
    return;
  }
  const pPct = Math.round((weekly.p / PROTEIN_GOAL) * 100);
  const calPct = Math.round((weekly.cal / CAL_GOAL) * 100);
  const waterDays = 7;
  let totalWaterPct = 0;
  let waterDaysCount = 0;
  for (let i = 0; i < waterDays; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const w = loadWater(getDateKey(d));
    if (w > 0) { totalWaterPct += Math.min(w / WATER_TARGET, 1); waterDaysCount++; }
  }
  const waterPct = waterDaysCount > 0 ? Math.round((totalWaterPct / waterDaysCount) * 100) : 0;
  const overall = Math.round((pPct + Math.min(calPct, 100) + waterPct) / 3);
  container.innerHTML = `
    <div class="wn-row"><span>Protein</span><span>${pPct}%</span></div>
    <div class="wn-row"><span>Calories</span><span>${calPct}%</span></div>
    <div class="wn-row"><span>Water</span><span>${waterPct}%</span></div>
    <div class="wn-score"><div class="wn-score-num">${overall}%</div><div class="wn-score-label">Overall Nutrition Score</div></div>
  `;
}

function renderCoachAlerts() {
  const container = document.getElementById("coachAlerts");
  const alerts = [];
  const goal = GOALS.find((g) => g.id === state.bodyGoal);
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));

  if (log.length >= 4 && goal) {
    const now = new Date();
    const weekAgo = getDateKey(new Date(now.getTime() - 7 * 86400000));
    const twoWeeksAgo = getDateKey(new Date(now.getTime() - 14 * 86400000));
    const recent = log.filter((e) => e.date >= weekAgo);
    const prev = log.filter((e) => e.date >= twoWeeksAgo && e.date < weekAgo);
    if (recent.length >= 2 && prev.length >= 2) {
      const avgRecent = recent.reduce((s, e) => s + e.weight, 0) / recent.length;
      const avgPrev = prev.reduce((s, e) => s + e.weight, 0) / prev.length;
      const change = avgRecent - avgPrev;

      if (goal.id === "fat-loss" && change > 0.3) {
        alerts.push({ type: "red", icon: "⚠️", title: "Weight increasing despite fat-loss goal", body: "Possible causes: weekend overeating, hidden calories, water retention. Review tracking accuracy." });
      }
      if ((goal.id === "lean-bulk" || goal.id === "aggressive-bulk") && change < -0.3) {
        alerts.push({ type: "yellow", icon: "⚠️", title: "Weight decreasing on bulk goal", body: "Growth phase may be under-fueled. Consider increasing 150-250 calories daily." });
      }
      if (goal.id === "recomp" && change > 0.5) {
        alerts.push({ type: "yellow", icon: "⚠️", title: "Weight increasing on recomp goal", body: "Reduce calories slightly to maintain stable weight while building strength." });
      }
    }
  }

  const strengthChg = getWeeklyStrengthChange();
  if (log.length >= 4 && strengthChg !== null && strengthChg > 5) {
    const now = new Date();
    const weekAgo = getDateKey(new Date(now.getTime() - 7 * 86400000));
    const twoWeeksAgo = getDateKey(new Date(now.getTime() - 14 * 86400000));
    const recent = log.filter((e) => e.date >= weekAgo);
    const prev = log.filter((e) => e.date >= twoWeeksAgo && e.date < weekAgo);
    if (recent.length >= 2 && prev.length >= 2) {
      const avgRecent = recent.reduce((s, e) => s + e.weight, 0) / recent.length;
      const avgPrev = prev.reduce((s, e) => s + e.weight, 0) / prev.length;
      if (Math.abs(avgRecent - avgPrev) < 0.3) {
        alerts.push({ type: "green", icon: "✅", title: "Successful recomposition detected", body: "Weight stable, strength increasing. Continue current nutrition and training strategy." });
      }
    }
  }

  const protPct = getWeeklyProteinAdherence();
  if (protPct !== null && protPct < 80) {
    alerts.push({ type: "yellow", icon: "🥩", title: `Protein: ${Math.round(protPct)}% of goal`, body: "Consistent protein intake is critical for recovery. Aim for protein at every meal." });
  } else if (protPct !== null && protPct >= 90) {
    alerts.push({ type: "green", icon: "✓", title: `Protein: ${Math.round(protPct)}% of goal`, body: "Great protein adherence. This supports recovery and muscle growth." });
  }

  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
  if (weekSessions.length < 4) {
    alerts.push({ type: "blue", icon: "💪", title: `Training: ${weekSessions.length}/6 sessions this week`, body: "Consistency drives results. Aim for all 6 training sessions." });
  } else if (weekSessions.length >= 5) {
    alerts.push({ type: "green", icon: "✓", title: `Training: ${weekSessions.length}/6 sessions this week`, body: "Excellent consistency. This is the foundation of progress." });
  }

  const todayEntry = log.find((e) => e.date === getDateKey());
  if (!todayEntry && log.length > 0) {
    alerts.push({ type: "blue", icon: "⚖️", title: "No weigh-in today", body: "Weigh in first thing in the morning for consistent tracking." });
  } else if (log.length === 0) {
    alerts.push({ type: "blue", icon: "⚖️", title: "Start tracking weight", body: "Log your first weigh-in to enable trend analysis and goal tracking." });
  }

  const as = getGoalAlignmentScore();
  if (as !== null) {
    const cls = as >= 7 ? "green" : as >= 5 ? "yellow" : "red";
    alerts.push({ type: cls, icon: as >= 7 ? "✓" : "⚠️", title: `Alignment Score: ${as}/10`, body: as >= 7 ? "Your training, nutrition, and weight trends are aligned with your goal." : "Some metrics are off track. Check the Today Status card for details." });
  }

  container.innerHTML = alerts.length
    ? alerts.map((a) =>
        `<div class="alert-item is-${a.type}"><span class="alert-icon">${a.icon}</span><div class="alert-body"><strong>${a.title}</strong>${a.body}</div></div>`
      ).join("")
    : `<p class="empty-state">Log workouts and weigh-ins to get coaching insights.</p>`;
}

function renderRecovery() {
  const container = document.getElementById("recoveryContent");
  const dot = document.getElementById("recoveryDot");
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
  if (weekSessions.length === 0) {
    container.innerHTML = `<p class="empty-state">Complete sessions to assess recovery.</p>`;
    dot.className = "recovery-dot";
    return;
  }
  const strengthPct = getWeeklyStrengthChange();
  const sessionCount = weekSessions.length;
  const avgSetsPerSession = weekSessions.length > 0
    ? Math.round(weekSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done).length, 0), 0) / weekSessions.length)
    : 0;
  const performanceScore = strengthPct !== null ? (strengthPct > 3 ? 90 : strengthPct > -3 ? 70 : 40) : 50;
  const volumeScore = Math.min(sessionCount * 15, 100);
  const recoveryScore = Math.round((performanceScore + volumeScore) / 2);
  let status = "Good";
  let cls = "is-green";
  if (recoveryScore < 50) { status = "Poor"; cls = "is-red"; }
  else if (recoveryScore < 70) { status = "Fair"; cls = "is-yellow"; }
  dot.className = `recovery-dot ${cls}`;
  container.innerHTML = `
    <div class="rec-row"><span>Sessions</span><span>${sessionCount}/6</span></div>
    <div class="rec-row"><span>Avg sets/session</span><span>${avgSetsPerSession}</span></div>
    <div class="rec-row"><span>Performance</span><span>${performanceScore}%</span></div>
    <div class="rec-row"><span>Recovery Score</span><span style="font-weight:800;color:var(--${recoveryScore >= 70 ? 'green' : recoveryScore >= 50 ? 'yellow' : 'red'})">${recoveryScore}% — ${status}</span></div>
  `;
}

let strengthFilterDays = 30;

function renderStrengthAnalytics() {
  const container = document.getElementById("strengthAnalytics");
  const filterChips = document.getElementById("strengthFilterChips");
  filterChips.innerHTML = [30, 90, 180, 365].map((d) =>
    `<button class="filter-chip ${strengthFilterDays === d ? "is-active" : ""}" data-sdays="${d}">${d === 365 ? "1y" : d + "d"}</button>`
  ).join("");
  filterChips.querySelectorAll("[data-sdays]").forEach((btn) => {
    btn.addEventListener("click", () => {
      strengthFilterDays = Number(btn.dataset.sdays);
      renderStrengthAnalytics();
    });
  });

  const exercises = {};
  const cutoff = getDateKey(new Date(Date.now() - strengthFilterDays * 86400000));
  const finishedSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= cutoff).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  for (const session of finishedSessions) {
    for (const ex of session.exercises) {
      const doneSets = ex.sets.filter((s) => s.done && s.weight && Number(s.weight) > 0);
      if (doneSets.length === 0) continue;
      const maxWeight = Math.max(...doneSets.map((s) => Number(s.weight)));
      if (!exercises[ex.name]) exercises[ex.name] = [];
      exercises[ex.name].push({ weight: maxWeight, date: session.dateKey });
    }
  }

  const entries = Object.entries(exercises)
    .map(([name, data]) => {
      const sorted = data.sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length < 2) return null;
      const first = sorted[0].weight;
      const last = sorted[sorted.length - 1].weight;
      const change = first > 0 ? ((last - first) / first) * 100 : 0;
      const recent = sorted.slice(-4);
      const isPlateau = recent.length >= 4 && recent.every((r) => r.weight === recent[0].weight);
      return { name, first, last, change, isPlateau };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 8);

  let deloadAlerts = [];
  for (const e of entries) {
    if (e.change < -5) {
      deloadAlerts.push(`${e.name}: ${e.first}kg → ${e.last}kg`);
    }
  }

  let plateauAlerts = [];
  for (const e of entries) {
    if (e.isPlateau) {
      plateauAlerts.push(e.name);
    }
  }

  let html = entries.length
    ? entries.map((e) =>
        `<div class="sa-row">
          <span>${e.name}${e.isPlateau ? ' <span style="color:var(--yellow)">⏸</span>' : ''}</span>
          <span class="sa-change is-${e.change > 0 ? "up" : e.change < 0 ? "down" : "flat"}">${e.change > 0 ? "+" : ""}${e.change.toFixed(0)}%</span>
        </div>`
      ).join("")
    : `<p class="empty-state">Complete multiple sessions to see strength trends.</p>`;

  if (deloadAlerts.length > 0) {
    html += `<div class="alert-item is-red" style="margin-top:0.5rem"><span class="alert-icon">⚠️</span><div class="alert-body"><strong>Progress stalled? Consider deload.</strong><br>${deloadAlerts.join(" · ")}</div></div>`;
  }
  if (plateauAlerts.length > 0) {
    html += `<div class="alert-item is-yellow" style="margin-top:0.35rem"><span class="alert-icon">⏸</span><div class="alert-body"><strong>Plateau detected</strong><br>${plateauAlerts.join(", ")} — no progress in recent sessions. Consider deload week.</div></div>`;
  }

  container.innerHTML = html;
}

// ===== MODALS =====
let exerciseDetailChartInstance = null;

document.getElementById("myExercisesBtn")?.addEventListener("click", () => {
  const container = document.getElementById("exerciseDetailTitle");
  const activePlan = loadCustomProgram() || plan;
  const allExercises = activePlan.flatMap((w) => w.exercises.map((e) => e.name));
  container.textContent = `All Exercises (${allExercises.length})`;

  if (exerciseDetailChartInstance) { exerciseDetailChartInstance.destroy(); exerciseDetailChartInstance = null; }
  const canvas = document.getElementById("exerciseDetailChart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const counts = {};
    allExercises.forEach((name) => { counts[name] = (counts[name] || 0) + 1; });
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    exerciseDetailChartInstance = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: "#22c55e", borderRadius: 4 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1, color: "#737373" } }, x: { ticks: { color: "#737373", font: { size: 8 } } } } },
    });
  }

  document.getElementById("exerciseDetailModal").classList.remove("is-hidden");
});

document.getElementById("exerciseDetailClose")?.addEventListener("click", () => {
  document.getElementById("exerciseDetailModal").classList.add("is-hidden");
  if (exerciseDetailChartInstance) { exerciseDetailChartInstance.destroy(); exerciseDetailChartInstance = null; }
});

document.getElementById("loadProgramButton")?.addEventListener("click", () => {
  document.getElementById("loadProgramModal").classList.remove("is-hidden");
});
document.getElementById("loadProgramClose")?.addEventListener("click", () => {
  document.getElementById("loadProgramModal").classList.add("is-hidden");
});
document.getElementById("loadProgramCancel")?.addEventListener("click", () => {
  document.getElementById("loadProgramModal").classList.add("is-hidden");
});

document.getElementById("loadProgramConfirm")?.addEventListener("click", () => {
  const text = document.getElementById("programInput").value;
  if (!text.trim()) return;
  const lines = text.trim().split("\n");
  const newPlan = [];
  let currentDay = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("|").map((p) => p.trim());
    if (parts.length >= 4) {
      const [dayName, exName, setsStr, repsStr] = parts;
      if (!currentDay || currentDay.name !== dayName) {
        currentDay = { id: "custom-" + crypto.randomUUID().slice(0, 8), name: dayName, focus: "", day: "", duration: "", rest: "", exercises: [] };
        newPlan.push(currentDay);
      }
      const sets = Number(setsStr) || 3;
      const reps = repsStr.includes("-") ? repsStr : Number(repsStr) || 8;
      currentDay.exercises.push({ name: exName, sets, reps: typeof reps === "number" ? reps : 8, repTarget: typeof reps === "string" ? reps : String(reps), weight: "", tip: "" });
    }
  }

  if (newPlan.length === 0) return;

  const preview = document.getElementById("programPreview");
  preview.classList.remove("is-hidden");
  preview.textContent = `Parsed ${newPlan.length} days with ${newPlan.reduce((s, d) => s + d.exercises.length, 0)} exercises.`;

  document.getElementById("confirmProgramModal").classList.remove("is-hidden");
  document.getElementById("confirmProgramText").textContent = `Replace current program with ${newPlan.length} days?`;
  document.getElementById("confirmProgramYes").onclick = () => {
    try { localStorage.setItem("wl_custom_program", JSON.stringify(newPlan)); } catch {}
    document.getElementById("loadProgramModal").classList.add("is-hidden");
    document.getElementById("confirmProgramModal").classList.add("is-hidden");
    state.planOffset = 0;
    saveState();
    render();
  };
});

document.getElementById("confirmProgramClose")?.addEventListener("click", () => {
  document.getElementById("confirmProgramModal").classList.add("is-hidden");
});
document.getElementById("confirmProgramNo")?.addEventListener("click", () => {
  document.getElementById("confirmProgramModal").classList.add("is-hidden");
});

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-tab").forEach((b) => {
    b.addEventListener("click", () => activateTab(b.dataset.tab));
  });
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.addEventListener("click", () => activateTab(b.dataset.tab));
  });

  render();

  const todaySession = getTodaySession();
  if (todaySession && todaySession.exercises.some((e) => e.sets.some((s) => s.done))) {
    startStopwatch();
  }

  activateTab("sets");

  setInterval(() => {
    if (currentTab === "sets" && drillStack.length >= 2) {
      const activePlan = loadCustomProgram() || plan;
      const workout = activePlan.find((w) => w.id === l3CurrentPlanId);
      const exDef = workout ? workout.exercises.find((e) => e.name === l3CurrentExName) : null;
      const session = getTodaySession();
      const exSession = exDef ? getExerciseSession(session, exDef) : null;
      if (exDef && exSession && document.getElementById("l3SetsTab") && !document.getElementById("l3SetsTab").classList.contains("is-hidden")) {
        renderL3SetsTab(exDef, exSession);
      }
    }
  }, 30000);
});
