const STORAGE_KEY = "workout-tracker-v3";
const PROTEIN_GOAL = 146;
const CARBS_GOAL = 240;
const FAT_GOAL = 65;
const CAL_GOAL = 2100;
const WATER_TARGET = 3000;
const DEFAULT_REST = 90;

let _chartJsPromise = null;
function loadChartJS() {
  if (typeof Chart !== "undefined") return Promise.resolve();
  if (_chartJsPromise) return _chartJsPromise;
  _chartJsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
    s.onload = resolve;
    s.onerror = () => { _chartJsPromise = null; reject(new Error("Chart.js failed to load")); };
    document.head.appendChild(s);
  });
  return _chartJsPromise;
}

function autoGenerateWarmups(exercise, workingWeight) {
  if (!state.autoWarmup) return;
  if (exercise.autoWarmup === false) return;
  if (exercise.warmupGenerated) return;
  const w = Number(workingWeight);
  if (!w || w <= 0) return;
  let warmups = [];
  if (state.warmupStyle === "advanced") {
    if (w <= 20) {
      warmups = [
        { bar: Math.round((w * 0.5) / 2.5) * 2.5 || Math.min(5, w * 0.5), reps: 10, pct: "50%" },
        { bar: Math.round((w * 0.75) / 2.5) * 2.5 || Math.min(10, w * 0.75), reps: 10, pct: "75%" },
      ];
    } else if (w <= 60) {
      warmups = [
        { bar: 20, reps: 10, pct: "Bar" },
        { bar: Math.round((w * 0.75) / 2.5) * 2.5, reps: 8, pct: "75%" },
      ];
    } else if (w <= 100) {
      warmups = [
        { bar: Math.round((w * 0.5) / 2.5) * 2.5, reps: 10, pct: "50%" },
        { bar: Math.round((w * 0.75) / 2.5) * 2.5, reps: 5, pct: "75%" },
        { bar: Math.round((w * 0.9) / 2.5) * 2.5, reps: 3, pct: "90%" },
      ];
    } else {
      warmups = [
        { bar: Math.round((w * 0.4) / 2.5) * 2.5, reps: 10, pct: "40%" },
        { bar: Math.round((w * 0.6) / 2.5) * 2.5, reps: 8, pct: "60%" },
        { bar: Math.round((w * 0.8) / 2.5) * 2.5, reps: 5, pct: "80%" },
        { bar: Math.round((w * 0.9) / 2.5) * 2.5, reps: 3, pct: "90%" },
      ];
    }
  } else {
    // Simple: 1-2 light warmup sets
    if (w <= 20) {
      warmups = [{ bar: Math.round((w * 0.5) / 2.5) * 2.5 || Math.min(5, w * 0.5), reps: 10, pct: "50%" }];
    } else if (w <= 60) {
      warmups = [{ bar: 20, reps: 10, pct: "Light" }];
    } else {
      warmups = [{ bar: Math.round((w * 0.5) / 2.5) * 2.5, reps: 8, pct: "50%" }];
    }
  }
  warmups = warmups.filter((s) => s.bar > 0 && s.bar < w);
  const seen = new Set();
  warmups = warmups.filter((s) => {
    const k = s.bar;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  warmups.forEach((wu) => {
    exercise.sets.push({
      id: crypto.randomUUID(),
      reps: wu.reps,
      weight: wu.bar,
      notes: "",
      label: wu.pct,
      done: false,
      isWarmup: true,
      loggedAt: null,
    });
  });
  exercise.warmupGenerated = true;
  saveState();
}

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

const plan = [];

const EXERCISE_LIBRARY = [
  // CHEST
  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Barbell",
    tags: ["chest", "barbell", "compound", "push"],
  },
  {
    id: "incline-barbell-bench-press",
    name: "Incline Barbell Bench Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Barbell",
    tags: ["chest", "barbell", "compound", "push"],
  },
  {
    id: "decline-bench-press",
    name: "Decline Bench Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Barbell",
    tags: ["chest", "barbell", "compound", "push"],
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Dumbbell",
    tags: ["chest", "dumbbell", "compound", "push"],
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Dumbbell",
    tags: ["chest", "dumbbell", "compound", "push"],
  },
  {
    id: "decline-dumbbell-press",
    name: "Decline Dumbbell Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Dumbbell",
    tags: ["chest", "dumbbell", "compound", "push"],
  },
  { id: "machine-chest-press", name: "Machine Chest Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Machine", tags: ["chest", "machine", "compound", "push"] },
  { id: "chest-fly-machine", name: "Chest Fly Machine", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Machine", tags: ["chest", "machine", "isolation", "push", "fly"] },
  { id: "cable-fly", name: "Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Cable", tags: ["chest", "cable", "isolation", "push", "fly"] },
  { id: "push-ups", name: "Push Ups", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: "Bodyweight", tags: ["chest", "bodyweight", "compound", "push"] },
  {
    id: "weighted-push-ups",
    name: "Weighted Push Ups",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Front Delts"],
    equipment: "Bodyweight",
    tags: ["chest", "bodyweight", "compound", "push"],
  },
  { id: "dips", name: "Dips", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: "Bodyweight", tags: ["chest", "bodyweight", "compound", "push"] },
  // SHOULDERS
  {
    id: "overhead-press",
    name: "Overhead Press",
    category: "Shoulders",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Side Delts", "Triceps"],
    equipment: "Barbell",
    tags: ["shoulders", "front delts", "barbell", "compound", "push"],
  },
  {
    id: "seated-dumbbell-press",
    name: "Seated Dumbbell Press",
    category: "Shoulders",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Side Delts", "Triceps"],
    equipment: "Dumbbell",
    tags: ["shoulders", "front delts", "dumbbell", "compound", "push"],
  },
  {
    id: "arnold-press",
    name: "Arnold Press",
    category: "Shoulders",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Side Delts", "Triceps"],
    equipment: "Dumbbell",
    tags: ["shoulders", "front delts", "dumbbell", "compound", "push"],
  },
  { id: "lateral-raises", name: "Lateral Raises", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: [], equipment: "Dumbbell", tags: ["shoulders", "side delts", "dumbbell", "isolation", "push"] },
  { id: "cable-lateral-raises", name: "Cable Lateral Raises", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: [], equipment: "Cable", tags: ["shoulders", "side delts", "cable", "isolation", "push"] },
  { id: "front-raises", name: "Front Raises", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: [], equipment: "Dumbbell", tags: ["shoulders", "front delts", "dumbbell", "isolation", "push"] },
  { id: "rear-delt-fly", name: "Rear Delt Fly", category: "Shoulders", primaryMuscle: "Rear Delts", secondaryMuscles: [], equipment: "Dumbbell", tags: ["shoulders", "rear delts", "dumbbell", "isolation", "pull"] },
  { id: "face-pulls", name: "Face Pulls", category: "Shoulders", primaryMuscle: "Rear Delts", secondaryMuscles: ["Traps"], equipment: "Cable", tags: ["shoulders", "rear delts", "traps", "cable", "compound", "pull"] },
  {
    id: "machine-shoulder-press",
    name: "Machine Shoulder Press",
    category: "Shoulders",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Triceps"],
    equipment: "Machine",
    tags: ["shoulders", "front delts", "machine", "compound", "push"],
  },
  { id: "upright-row", name: "Upright Row", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: ["Traps"], equipment: "Barbell", tags: ["shoulders", "side delts", "traps", "barbell", "compound", "pull"] },
  { id: "landmine-press", name: "Landmine Press", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: ["Chest", "Triceps"], equipment: "Barbell", tags: ["shoulders", "front delts", "barbell", "compound", "push"] },
  // BACK
  { id: "pull-ups", name: "Pull Ups", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: "Bodyweight", tags: ["back", "lats", "bodyweight", "compound", "pull"] },
  { id: "chin-ups", name: "Chin Ups", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: "Bodyweight", tags: ["back", "lats", "bodyweight", "compound", "pull"] },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: "Cable", tags: ["back", "lats", "cable", "compound", "pull"] },
  { id: "wide-grip-pulldown", name: "Wide Grip Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Cable", tags: ["back", "lats", "cable", "compound", "pull"] },
  { id: "close-grip-pulldown", name: "Close Grip Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Cable", tags: ["back", "lats", "cable", "compound", "pull"] },
  { id: "barbell-row", name: "Barbell Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Barbell", tags: ["back", "middle back", "barbell", "compound", "pull"] },
  { id: "pendlay-row", name: "Pendlay Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats"], equipment: "Barbell", tags: ["back", "middle back", "barbell", "compound", "pull"] },
  { id: "t-bar-row", name: "T Bar Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Barbell", tags: ["back", "middle back", "barbell", "compound", "pull"] },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    category: "Back",
    primaryMuscle: "Middle Back",
    secondaryMuscles: ["Lats", "Biceps"],
    equipment: "Cable",
    tags: ["back", "middle back", "cable", "compound", "pull"],
  },
  {
    id: "single-arm-dumbbell-row",
    name: "Single Arm Dumbbell Row",
    category: "Back",
    primaryMuscle: "Lats",
    secondaryMuscles: ["Middle Back", "Biceps"],
    equipment: "Dumbbell",
    tags: ["back", "lats", "dumbbell", "compound", "pull"],
  },
  { id: "machine-row", name: "Machine Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats"], equipment: "Machine", tags: ["back", "middle back", "machine", "compound", "pull"] },
  { id: "straight-arm-pulldown", name: "Straight Arm Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Triceps"], equipment: "Cable", tags: ["back", "lats", "cable", "isolation", "pull"] },
  // BICEPS
  { id: "barbell-curl", name: "Barbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell", tags: ["biceps", "barbell", "isolation", "pull", "curl"] },
  { id: "ez-bar-curl", name: "EZ Bar Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell", tags: ["biceps", "barbell", "isolation", "pull", "curl"] },
  { id: "dumbbell-curl", name: "Dumbbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", tags: ["biceps", "dumbbell", "isolation", "pull", "curl"] },
  { id: "hammer-curl", name: "Hammer Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", tags: ["biceps", "dumbbell", "isolation", "pull", "curl"] },
  { id: "incline-curl", name: "Incline Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Dumbbell", tags: ["biceps", "dumbbell", "isolation", "pull", "curl"] },
  { id: "cable-curl", name: "Cable Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Cable", tags: ["biceps", "cable", "isolation", "pull", "curl"] },
  { id: "preacher-curl", name: "Preacher Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell", tags: ["biceps", "barbell", "isolation", "pull", "curl"] },
  { id: "concentration-curl", name: "Concentration Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Dumbbell", tags: ["biceps", "dumbbell", "isolation", "pull", "curl"] },
  { id: "spider-curl", name: "Spider Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Dumbbell", tags: ["biceps", "dumbbell", "isolation", "pull", "curl"] },
  { id: "reverse-curl", name: "Reverse Curl", category: "Biceps", primaryMuscle: "Forearms", secondaryMuscles: ["Biceps"], equipment: "Barbell", tags: ["forearms", "barbell", "isolation", "pull", "curl"] },
  // TRICEPS
  { id: "cable-pushdown", name: "Cable Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", tags: ["triceps", "cable", "isolation", "push"] },
  { id: "rope-pushdown", name: "Rope Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", tags: ["triceps", "cable", "isolation", "push"] },
  {
    id: "overhead-tricep-extension",
    name: "Overhead Tricep Extension",
    category: "Triceps",
    primaryMuscle: "Triceps",
    secondaryMuscles: [],
    equipment: "Cable",
    tags: ["triceps", "cable", "isolation", "push"],
  },
  { id: "skull-crushers", name: "Skull Crushers", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Barbell", tags: ["triceps", "barbell", "isolation", "push"] },
  {
    id: "close-grip-bench-press",
    name: "Close Grip Bench Press",
    category: "Triceps",
    primaryMuscle: "Triceps",
    secondaryMuscles: ["Chest", "Front Delts"],
    equipment: "Barbell",
    tags: ["triceps", "chest", "barbell", "compound", "push"],
  },
  { id: "bench-dips", name: "Bench Dips", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Bodyweight", tags: ["triceps", "bodyweight", "compound", "push"] },
  { id: "machine-dip", name: "Machine Dip", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Machine", tags: ["triceps", "machine", "compound", "push"] },
  { id: "single-arm-pushdown", name: "Single Arm Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", tags: ["triceps", "cable", "isolation", "push"] },
  { id: "tricep-kickback", name: "Tricep Kickback", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Dumbbell", tags: ["triceps", "dumbbell", "isolation", "push"] },
  { id: "jm-press", name: "JM Press", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Barbell", tags: ["triceps", "barbell", "compound", "push"] },
  // LEGS
  { id: "back-squat", name: "Back Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Barbell", tags: ["legs", "quads", "barbell", "compound", "push", "squat"] },
  { id: "front-squat", name: "Front Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Barbell", tags: ["legs", "quads", "barbell", "compound", "push", "squat"] },
  { id: "hack-squat", name: "Hack Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Machine", tags: ["legs", "quads", "machine", "compound", "push", "squat"] },
  { id: "leg-press", name: "Leg Press", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Machine", tags: ["legs", "quads", "machine", "compound", "push"] },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    category: "Legs",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Dumbbell",
    tags: ["legs", "quads", "dumbbell", "compound", "push", "squat"],
  },
  { id: "walking-lunges", name: "Walking Lunges", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbell", tags: ["legs", "quads", "dumbbell", "compound", "push", "lunge"] },
  { id: "romanian-deadlift", name: "Romanian Deadlift", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Barbell", tags: ["legs", "hamstrings", "barbell", "compound", "pull", "hinge"] },
  { id: "stiff-leg-deadlift", name: "Stiff Leg Deadlift", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Barbell", tags: ["legs", "hamstrings", "barbell", "compound", "pull", "hinge"] },
  { id: "leg-extension", name: "Leg Extension", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: [], equipment: "Machine", tags: ["legs", "quads", "machine", "isolation", "push"] },
  { id: "leg-curl", name: "Leg Curl", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: [], equipment: "Machine", tags: ["legs", "hamstrings", "machine", "isolation", "pull", "curl"] },
  { id: "goblet-squat", name: "Goblet Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Dumbbell", tags: ["legs", "quads", "dumbbell", "compound", "push", "squat"] },
  { id: "step-ups", name: "Step Ups", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbell", tags: ["legs", "quads", "dumbbell", "compound", "push"] },
  // GLUTES
  { id: "hip-thrust", name: "Hip Thrust", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Barbell", tags: ["glutes", "barbell", "compound", "push", "hinge"] },
  { id: "glute-bridge", name: "Glute Bridge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Bodyweight", tags: ["glutes", "bodyweight", "isolation", "push", "hinge"] },
  { id: "cable-kickback", name: "Cable Kickback", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: [], equipment: "Cable", tags: ["glutes", "cable", "isolation", "push"] },
  {
    id: "smith-machine-hip-thrust",
    name: "Smith Machine Hip Thrust",
    category: "Glutes",
    primaryMuscle: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    equipment: "Machine",
    tags: ["glutes", "machine", "compound", "push", "hinge"],
  },
  { id: "reverse-lunge", name: "Reverse Lunge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Quads", "Hamstrings"], equipment: "Dumbbell", tags: ["glutes", "dumbbell", "compound", "push", "lunge"] },
  // CALVES
  { id: "standing-calf-raise", name: "Standing Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine", tags: ["calves", "machine", "isolation", "push"] },
  { id: "seated-calf-raise", name: "Seated Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine", tags: ["calves", "machine", "isolation", "push"] },
  { id: "leg-press-calf-raise", name: "Leg Press Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine", tags: ["calves", "machine", "isolation", "push"] },
  { id: "single-leg-calf-raise", name: "Single Leg Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Bodyweight", tags: ["calves", "bodyweight", "isolation", "push"] },
  { id: "donkey-calf-raise", name: "Donkey Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine", tags: ["calves", "machine", "isolation", "push"] },
  // ABS
  { id: "crunch", name: "Crunch", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: [], equipment: "Bodyweight", tags: ["abs", "upper abs", "bodyweight", "isolation", "core"] },
  { id: "cable-crunch", name: "Cable Crunch", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: [], equipment: "Cable", tags: ["abs", "upper abs", "cable", "isolation", "core"] },
  { id: "machine-crunch", name: "Machine Crunch", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: [], equipment: "Machine", tags: ["abs", "upper abs", "machine", "isolation", "core"] },
  { id: "leg-raise", name: "Leg Raise", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight", tags: ["abs", "lower abs", "bodyweight", "isolation", "core"] },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Upper Abs"], equipment: "Bodyweight", tags: ["abs", "lower abs", "bodyweight", "isolation", "core"] },
  { id: "reverse-crunch", name: "Reverse Crunch", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: [], equipment: "Bodyweight", tags: ["abs", "lower abs", "bodyweight", "isolation", "core"] },
  { id: "plank", name: "Plank", category: "Abs", primaryMuscle: "Core", secondaryMuscles: [], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "isolation", "core"] },
  { id: "ab-wheel-rollout", name: "Ab Wheel Rollout", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Upper Abs"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "compound", "core"] },
  { id: "russian-twist", name: "Russian Twist", category: "Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Core"], equipment: "Bodyweight", tags: ["abs", "obliques", "bodyweight", "isolation", "core"] },
  { id: "mountain-climbers", name: "Mountain Climbers", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "compound", "core"] },
  // FOREARMS
  { id: "wrist-curl", name: "Wrist Curl", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Dumbbell", tags: ["forearms", "dumbbell", "isolation", "pull", "curl"] },
  { id: "reverse-wrist-curl", name: "Reverse Wrist Curl", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Dumbbell", tags: ["forearms", "dumbbell", "isolation", "pull", "curl"] },
  { id: "farmer-carry", name: "Farmer Carry", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: ["Traps"], equipment: "Dumbbell", tags: ["forearms", "traps", "dumbbell", "compound", "carry"] },
  { id: "behind-back-wrist-curl", name: "Behind Back Wrist Curl", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Barbell", tags: ["forearms", "barbell", "isolation", "pull", "curl"] },
  { id: "plate-pinch-hold", name: "Plate Pinch Hold", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Other", tags: ["forearms", "other", "isolation", "hold"] },
  // FULL BODY
  {
    id: "deadlift",
    name: "Deadlift",
    category: "Full Body",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Lower Back", "Forearms"],
    equipment: "Barbell",
    tags: ["full body", "hamstrings", "barbell", "compound", "pull", "hinge"],
  },
  {
    id: "power-clean",
    name: "Power Clean",
    category: "Full Body",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Hamstrings", "Traps", "Core"],
    equipment: "Barbell",
    tags: ["full body", "quads", "barbell", "compound", "pull", "explosive"],
  },
  {
    id: "clean-and-press",
    name: "Clean and Press",
    category: "Full Body",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Quads", "Triceps", "Core"],
    equipment: "Barbell",
    tags: ["full body", "shoulders", "barbell", "compound", "push", "explosive"],
  },
  { id: "thruster", name: "Thruster", category: "Full Body", primaryMuscle: "Quads", secondaryMuscles: ["Shoulders", "Core"], equipment: "Barbell", tags: ["full body", "quads", "barbell", "compound", "push", "explosive"] },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    category: "Full Body",
    primaryMuscle: "Glutes",
    secondaryMuscles: ["Hamstrings", "Core"],
    equipment: "Kettlebell",
    tags: ["full body", "glutes", "kettlebell", "compound", "pull", "hinge"],
  },
  { id: "burpee", name: "Burpee", category: "Full Body", primaryMuscle: "Core", secondaryMuscles: ["Quads", "Chest", "Shoulders"], equipment: "Bodyweight", tags: ["full body", "core", "bodyweight", "compound", "push", "explosive"] },
  // NEW CHEST
  { id: "svend-press", name: "Svend Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], equipment: "Dumbbell", tags: ["chest", "dumbbell", "isolation", "push"] },
  { id: "hex-press", name: "Hex Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Dumbbell", tags: ["chest", "dumbbell", "isolation", "push"] },
  { id: "dumbbell-pullover", name: "Dumbbell Pullover", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Lats", "Triceps"], equipment: "Dumbbell", tags: ["chest", "lats", "dumbbell", "compound", "push"] },
  { id: "low-cable-fly", name: "Low Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Cable", tags: ["chest", "cable", "isolation", "push", "fly"] },
  { id: "high-cable-fly", name: "High Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Cable", tags: ["chest", "cable", "isolation", "push", "fly"] },
  { id: "floor-press", name: "Floor Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Barbell", tags: ["chest", "barbell", "compound", "push"] },
  // NEW SHOULDERS
  { id: "behind-neck-press", name: "Behind Neck Press", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: ["Side Delts", "Triceps"], equipment: "Barbell", tags: ["shoulders", "front delts", "barbell", "compound", "push"] },
  { id: "single-arm-cable-lateral-raise", name: "Single Arm Cable Lateral Raise", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: [], equipment: "Cable", tags: ["shoulders", "side delts", "cable", "isolation", "push"] },
  { id: "bent-over-cable-lateral-raise", name: "Bent Over Cable Lateral Raise", category: "Shoulders", primaryMuscle: "Rear Delts", secondaryMuscles: ["Side Delts"], equipment: "Cable", tags: ["shoulders", "rear delts", "cable", "isolation", "pull"] },
  { id: "plate-front-raise", name: "Plate Front Raise", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: [], equipment: "Other", tags: ["shoulders", "front delts", "plate", "isolation", "push"] },
  { id: "cuban-press", name: "Cuban Press", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: ["Front Delts", "Rear Delts"], equipment: "Dumbbell", tags: ["shoulders", "side delts", "dumbbell", "compound", "pull"] },
  { id: "z-press", name: "Z Press", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: ["Side Delts", "Core"], equipment: "Barbell", tags: ["shoulders", "front delts", "barbell", "compound", "push"] },
  { id: "dumbbell-shrug", name: "Dumbbell Shrug", category: "Shoulders", primaryMuscle: "Traps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", tags: ["traps", "shoulders", "dumbbell", "isolation", "pull"] },
  { id: "barbell-shrug", name: "Barbell Shrug", category: "Shoulders", primaryMuscle: "Traps", secondaryMuscles: ["Forearms"], equipment: "Barbell", tags: ["traps", "shoulders", "barbell", "isolation", "pull"] },
  // NEW BACK
  { id: "chest-supported-row", name: "Chest Supported Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Dumbbell", tags: ["back", "middle back", "dumbbell", "compound", "pull"] },
  { id: "meadows-row", name: "Meadows Row", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Middle Back", "Biceps"], equipment: "Barbell", tags: ["back", "lats", "barbell", "compound", "pull"] },
  { id: "cable-pullover", name: "Cable Pullover", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Chest", "Triceps"], equipment: "Cable", tags: ["back", "lats", "cable", "compound", "pull"] },
  { id: "rack-pull", name: "Rack Pull", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Traps", "Forearms"], equipment: "Barbell", tags: ["back", "traps", "barbell", "compound", "pull", "hinge"] },
  { id: "snatch-grip-deadlift", name: "Snatch Grip Deadlift", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Hamstrings", "Traps", "Forearms"], equipment: "Barbell", tags: ["back", "middle back", "barbell", "compound", "pull", "hinge"] },
  { id: "hyperextension", name: "Hyperextension", category: "Back", primaryMuscle: "Lower Back", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Bodyweight", tags: ["back", "lower back", "bodyweight", "isolation", "pull", "hinge"] },
  { id: "inverted-row", name: "Inverted Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Bodyweight", tags: ["back", "middle back", "bodyweight", "compound", "pull"] },
  // NEW BICEPS
  { id: "drag-curl", name: "Drag Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell", tags: ["biceps", "barbell", "isolation", "pull", "curl"] },
  { id: "bayesian-cable-curl", name: "Bayesian Cable Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Cable", tags: ["biceps", "cable", "isolation", "pull", "curl"] },
  { id: "zottman-curl", name: "Zottman Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", tags: ["biceps", "forearms", "dumbbell", "isolation", "pull", "curl"] },
  { id: "pinwheel-curl", name: "Pinwheel Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", tags: ["biceps", "dumbbell", "isolation", "pull", "curl"] },
  { id: "21s-curl", name: "21s Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell", tags: ["biceps", "barbell", "isolation", "pull", "curl"] },
  // NEW TRICEPS
  { id: "diamond-push-ups", name: "Diamond Push Ups", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Front Delts"], equipment: "Bodyweight", tags: ["triceps", "bodyweight", "compound", "push"] },
  { id: "french-press", name: "French Press", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Barbell", tags: ["triceps", "barbell", "isolation", "push"] },
  { id: "tate-press", name: "Tate Press", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Dumbbell", tags: ["triceps", "dumbbell", "isolation", "push"] },
  { id: "cable-overhead-extension", name: "Cable Overhead Extension", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", tags: ["triceps", "cable", "isolation", "push"] },
  { id: "tricep-pushdown-v-bar", name: "Tricep Pushdown (V-Bar)", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", tags: ["triceps", "cable", "isolation", "push"] },
  // NEW LEGS (Quads)
  { id: "sissy-squat", name: "Sissy Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Core"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "isolation", "push", "squat"] },
  { id: "box-squat", name: "Box Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Barbell", tags: ["legs", "quads", "barbell", "compound", "push", "squat"] },
  { id: "pistol-squat", name: "Pistol Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Core"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "compound", "push", "squat"] },
  { id: "v-squat", name: "V-Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Machine", tags: ["legs", "quads", "machine", "compound", "push", "squat"] },
  { id: "belt-squat", name: "Belt Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Machine", tags: ["legs", "quads", "machine", "compound", "push", "squat"] },
  { id: "split-squat", name: "Split Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbell", tags: ["legs", "quads", "dumbbell", "compound", "push", "squat"] },
  // NEW LEGS (Hamstrings)
  { id: "lying-leg-curl", name: "Lying Leg Curl", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: [], equipment: "Machine", tags: ["legs", "hamstrings", "machine", "isolation", "pull", "curl"] },
  { id: "nordic-curl", name: "Nordic Curl", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Bodyweight", tags: ["legs", "hamstrings", "bodyweight", "isolation", "pull", "curl"] },
  { id: "glute-ham-raise", name: "Glute Ham Raise", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Machine", tags: ["legs", "hamstrings", "machine", "compound", "pull", "curl"] },
  { id: "single-leg-rdl", name: "Single Leg RDL", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Dumbbell", tags: ["legs", "hamstrings", "dumbbell", "compound", "pull", "hinge"] },
  { id: "cable-pull-through", name: "Cable Pull Through", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Cable", tags: ["legs", "hamstrings", "glutes", "cable", "compound", "pull", "hinge"] },
  // NEW GLUTES
  { id: "single-leg-hip-thrust", name: "Single Leg Hip Thrust", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Bodyweight", tags: ["glutes", "bodyweight", "isolation", "push", "hinge"] },
  { id: "frog-pump", name: "Frog Pump", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Bodyweight", tags: ["glutes", "bodyweight", "isolation", "push", "hinge"] },
  { id: "glute-kickback-machine", name: "Glute Kickback Machine", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: [], equipment: "Machine", tags: ["glutes", "machine", "isolation", "push"] },
  // NEW CALVES
  { id: "calf-press-leg-press", name: "Calf Press on Leg Press", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine", tags: ["calves", "machine", "isolation", "push"] },
  { id: "jump-rope", name: "Jump Rope", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: ["Quads", "Core"], equipment: "Bodyweight", tags: ["calves", "bodyweight", "compound", "push", "plyometric"] },
  { id: "box-jump", name: "Box Jump", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: ["Quads", "Glutes"], equipment: "Bodyweight", tags: ["calves", "legs", "bodyweight", "compound", "push", "plyometric"] },
  { id: "toe-raise", name: "Toe Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: ["Tibialis"], equipment: "Bodyweight", tags: ["calves", "bodyweight", "isolation", "push"] },
  // NEW ABS
  { id: "dead-bug", name: "Dead Bug", category: "Abs", primaryMuscle: "Core", secondaryMuscles: [], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "isolation", "core"] },
  { id: "bicycle-crunch", name: "Bicycle Crunch", category: "Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Upper Abs"], equipment: "Bodyweight", tags: ["abs", "obliques", "bodyweight", "isolation", "core"] },
  { id: "side-plank", name: "Side Plank", category: "Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Core"], equipment: "Bodyweight", tags: ["abs", "obliques", "core", "bodyweight", "isolation", "core"] },
  { id: "pallof-press", name: "Pallof Press", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Obliques"], equipment: "Cable", tags: ["abs", "core", "cable", "isolation", "core"] },
  { id: "v-up", name: "V-Up", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: ["Lower Abs"], equipment: "Bodyweight", tags: ["abs", "upper abs", "bodyweight", "isolation", "core"] },
  { id: "toes-to-bar", name: "Toes to Bar", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Upper Abs", "Hip Flexors"], equipment: "Bodyweight", tags: ["abs", "lower abs", "bodyweight", "compound", "core"] },
  { id: "dragon-flag", name: "Dragon Flag", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Upper Abs", "Lower Abs"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "compound", "core"] },
  { id: "hollow-body-hold", name: "Hollow Body Hold", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Upper Abs", "Lower Abs"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "isolation", "core"] },
  // NEW FOREARMS
  { id: "finger-curl", name: "Finger Curl", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Barbell", tags: ["forearms", "barbell", "isolation", "pull", "curl"] },
  { id: "wrist-roller", name: "Wrist Roller", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Other", tags: ["forearms", "other", "isolation", "pull", "curl"] },
  { id: "dead-hang", name: "Dead Hang", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: ["Lats", "Core"], equipment: "Bodyweight", tags: ["forearms", "back", "bodyweight", "isolation", "pull", "hold"] },
  { id: "fat-bar-hold", name: "Fat Bar Hold", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Barbell", tags: ["forearms", "barbell", "isolation", "hold"] },
  // ADDITIONAL EXERCISES
  { id: "smith-machine-bench-press", name: "Smith Machine Bench Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], equipment: "Machine", tags: ["chest", "machine", "compound", "push"] },
  { id: "smith-machine-incline-press", name: "Smith Machine Incline Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], equipment: "Machine", tags: ["chest", "machine", "compound", "push", "upper chest"] },
  { id: "pec-deck-fly", name: "Pec Deck Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Machine", tags: ["chest", "machine", "isolation", "push", "fly"] },
  { id: "cable-upper-chest-fly", name: "Cable Upper Chest Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Cable", tags: ["chest", "cable", "isolation", "push", "fly", "upper chest"] },
  { id: "smith-machine-overhead-press", name: "Smith Machine Overhead Press", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: ["Side Delts", "Triceps"], equipment: "Machine", tags: ["shoulders", "front delts", "machine", "compound", "push"] },
  { id: "cable-front-raise", name: "Cable Front Raise", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: [], equipment: "Cable", tags: ["shoulders", "front delts", "cable", "isolation", "push"] },
  { id: "reverse-pec-deck", name: "Reverse Pec Deck", category: "Shoulders", primaryMuscle: "Rear Delts", secondaryMuscles: ["Middle Back"], equipment: "Machine", tags: ["shoulders", "rear delts", "machine", "isolation", "pull"] },
  { id: "trap-bar-shrug", name: "Trap Bar Shrug", category: "Shoulders", primaryMuscle: "Traps", secondaryMuscles: ["Forearms"], equipment: "Barbell", tags: ["traps", "shoulders", "barbell", "isolation", "pull"] },
  { id: "v-grip-pulldown", name: "V-Grip Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Cable", tags: ["back", "lats", "cable", "compound", "pull"] },
  { id: "reverse-grip-pulldown", name: "Reverse Grip Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Cable", tags: ["back", "lats", "cable", "compound", "pull"] },
  { id: "cable-high-row", name: "Cable High Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Cable", tags: ["back", "middle back", "cable", "compound", "pull"] },
  { id: "smith-machine-row", name: "Smith Machine Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Machine", tags: ["back", "middle back", "machine", "compound", "pull"] },
  { id: "alternating-dumbbell-curl", name: "Alternating Dumbbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", tags: ["biceps", "dumbbell", "isolation", "pull", "curl"] },
  { id: "cable-hammer-curl", name: "Cable Hammer Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Cable", tags: ["biceps", "cable", "isolation", "pull", "curl"] },
  { id: "rope-hammer-curl", name: "Rope Hammer Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Cable", tags: ["biceps", "cable", "isolation", "pull", "curl"] },
  { id: "ez-bar-skull-crusher", name: "EZ Bar Skull Crusher", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Barbell", tags: ["triceps", "barbell", "isolation", "push"] },
  { id: "dumbbell-overhead-extension", name: "Dumbbell Overhead Extension", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Dumbbell", tags: ["triceps", "dumbbell", "isolation", "push"] },
  { id: "cable-rope-overhead-extension", name: "Cable Rope Overhead Extension", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", tags: ["triceps", "cable", "isolation", "push"] },
  { id: "safety-bar-squat", name: "Safety Bar Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Barbell", tags: ["legs", "quads", "barbell", "compound", "push", "squat"] },
  { id: "wide-stance-squat", name: "Wide Stance Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings", "Adductors"], equipment: "Barbell", tags: ["legs", "quads", "barbell", "compound", "push", "squat"] },
  { id: "pause-squat", name: "Pause Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Barbell", tags: ["legs", "quads", "barbell", "compound", "push", "squat"] },
  { id: "sled-push", name: "Sled Push", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Calves", "Glutes"], equipment: "Other", tags: ["legs", "quads", "other", "compound", "push"] },
  { id: "kettlebell-deadlift", name: "Kettlebell Deadlift", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Core"], equipment: "Kettlebell", tags: ["legs", "hamstrings", "kettlebell", "compound", "pull", "hinge"] },
  { id: "dumbbell-rdl", name: "Dumbbell RDL", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Dumbbell", tags: ["legs", "hamstrings", "dumbbell", "compound", "pull", "hinge"] },
  { id: "ball-leg-curl", name: "Ball Leg Curl", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Bodyweight", tags: ["legs", "hamstrings", "bodyweight", "isolation", "pull", "curl"] },
  { id: "banded-hip-thrust", name: "Banded Hip Thrust", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Bodyweight", tags: ["glutes", "bodyweight", "compound", "push", "hinge"] },
  { id: "barbell-glute-bridge", name: "Barbell Glute Bridge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Barbell", tags: ["glutes", "barbell", "compound", "push", "hinge"] },
  { id: "curtsy-lunge", name: "Curtsy Lunge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Quads", "Adductors"], equipment: "Dumbbell", tags: ["glutes", "dumbbell", "compound", "push", "lunge"] },
  { id: "jump-squat", name: "Jump Squat", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: ["Quads", "Glutes"], equipment: "Bodyweight", tags: ["calves", "legs", "bodyweight", "compound", "push", "plyometric"] },
  { id: "tip-toe-walk", name: "Tip Toe Walk", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Bodyweight", tags: ["calves", "bodyweight", "isolation", "push"] },
  { id: "incline-treadmill-walk", name: "Incline Treadmill Walk", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: ["Hamstrings", "Glutes"], equipment: "Machine", tags: ["calves", "machine", "compound", "push"] },
  { id: "hanging-knee-raise", name: "Hanging Knee Raise", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight", tags: ["abs", "lower abs", "bodyweight", "isolation", "core"] },
  { id: "cable-woodchop", name: "Cable Woodchop", category: "Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Core"], equipment: "Cable", tags: ["abs", "obliques", "cable", "compound", "core"] },
  { id: "medicine-ball-slam", name: "Medicine Ball Slam", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Upper Abs", "Shoulders"], equipment: "Other", tags: ["abs", "core", "other", "compound", "core"] },
  { id: "bear-crawl", name: "Bear Crawl", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Shoulders", "Quads"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "compound", "core"] },
  { id: "l-sit-hold", name: "L-Sit Hold", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Core", "Hip Flexors", "Quads"], equipment: "Bodyweight", tags: ["abs", "lower abs", "bodyweight", "isolation", "core"] },
  { id: "windshield-wiper", name: "Windshield Wiper", category: "Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Lower Abs", "Core"], equipment: "Bodyweight", tags: ["abs", "obliques", "bodyweight", "compound", "core"] },
  { id: "heel-tap", name: "Heel Tap", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: ["Obliques"], equipment: "Bodyweight", tags: ["abs", "upper abs", "bodyweight", "isolation", "core"] },
  { id: "flutter-kicks", name: "Flutter Kicks", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight", tags: ["abs", "lower abs", "bodyweight", "isolation", "core"] },
  { id: "landmine-row", name: "Landmine Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Barbell", tags: ["back", "middle back", "barbell", "compound", "pull"] },
  { id: "dumbbell-pullover-flat", name: "Dumbbell Pullover (Flat)", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Lats", "Triceps"], equipment: "Dumbbell", tags: ["chest", "lats", "dumbbell", "compound", "push"] },
  { id: "snatch", name: "Snatch", category: "Full Body", primaryMuscle: "Quads", secondaryMuscles: ["Hamstrings", "Shoulders", "Core"], equipment: "Barbell", tags: ["full body", "quads", "barbell", "compound", "pull", "explosive"] },
  { id: "push-jerk", name: "Push Jerk", category: "Full Body", primaryMuscle: "Shoulders", secondaryMuscles: ["Quads", "Triceps", "Core"], equipment: "Barbell", tags: ["full body", "shoulders", "barbell", "compound", "push", "explosive"] },
  { id: "muscle-up", name: "Muscle Up", category: "Full Body", primaryMuscle: "Lats", secondaryMuscles: ["Chest", "Triceps", "Core"], equipment: "Bodyweight", tags: ["full body", "lats", "bodyweight", "compound", "pull"] },
  { id: "handstand-push-up", name: "Handstand Push Up", category: "Full Body", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Core"], equipment: "Bodyweight", tags: ["full body", "shoulders", "bodyweight", "compound", "push"] },
  // CARDIO
  { id: "running", name: "Running", category: "Cardio", primaryMuscle: "Calves", secondaryMuscles: ["Hamstrings", "Glutes", "Quads"], equipment: "Bodyweight", tags: ["cardio", "legs", "bodyweight", "conditioning"] },
  { id: "cycling", name: "Cycling", category: "Cardio", primaryMuscle: "Quads", secondaryMuscles: ["Hamstrings", "Calves"], equipment: "Machine", tags: ["cardio", "legs", "machine", "conditioning"] },
  { id: "rowing-machine", name: "Rowing Machine", category: "Cardio", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps", "Core"], equipment: "Machine", tags: ["cardio", "back", "machine", "compound", "conditioning"] },
  { id: "battle-ropes", name: "Battle Ropes", category: "Cardio", primaryMuscle: "Shoulders", secondaryMuscles: ["Core", "Forearms"], equipment: "Other", tags: ["cardio", "shoulders", "other", "conditioning"] },
  { id: "stair-climber", name: "Stair Climber", category: "Cardio", primaryMuscle: "Glutes", secondaryMuscles: ["Quads", "Calves"], equipment: "Machine", tags: ["cardio", "glutes", "machine", "conditioning"] },
  { id: "assault-bike", name: "Assault Bike", category: "Cardio", primaryMuscle: "Quads", secondaryMuscles: ["Hamstrings", "Core"], equipment: "Machine", tags: ["cardio", "legs", "machine", "conditioning"] },
  { id: "kettlebell-snatch", name: "Kettlebell Snatch", category: "Cardio", primaryMuscle: "Shoulders", secondaryMuscles: ["Core", "Glutes"], equipment: "Kettlebell", tags: ["cardio", "shoulders", "kettlebell", "compound", "explosive", "conditioning"] },
  { id: "jumping-jacks", name: "Jumping Jacks", category: "Cardio", primaryMuscle: "Calves", secondaryMuscles: ["Shoulders", "Core"], equipment: "Bodyweight", tags: ["cardio", "bodyweight", "conditioning"] },
  { id: "high-knees", name: "High Knees", category: "Cardio", primaryMuscle: "Hip Flexors", secondaryMuscles: ["Quads", "Core"], equipment: "Bodyweight", tags: ["cardio", "legs", "bodyweight", "conditioning"] },
  { id: "burpee-box-jump", name: "Burpee Box Jump", category: "Cardio", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Chest", "Core"], equipment: "Bodyweight", tags: ["cardio", "full body", "bodyweight", "compound", "plyometric", "conditioning"] },
  // MOBILITY
  { id: "cat-cow", name: "Cat Cow", category: "Mobility", primaryMuscle: "Core", secondaryMuscles: ["Lower Back"], equipment: "Bodyweight", tags: ["mobility", "core", "bodyweight", "stretch"] },
  { id: "worlds-greatest-stretch", name: "World's Greatest Stretch", category: "Mobility", primaryMuscle: "Hip Flexors", secondaryMuscles: ["Thoracic Spine", "Hamstrings"], equipment: "Bodyweight", tags: ["mobility", "legs", "bodyweight", "stretch"] },
  { id: "hip-flexor-stretch", name: "Hip Flexor Stretch", category: "Mobility", primaryMuscle: "Hip Flexors", secondaryMuscles: ["Quads"], equipment: "Bodyweight", tags: ["mobility", "legs", "bodyweight", "stretch"] },
  { id: "thoracic-rotation", name: "Thoracic Spine Rotation", category: "Mobility", primaryMuscle: "Mid Back", secondaryMuscles: ["Core"], equipment: "Bodyweight", tags: ["mobility", "back", "bodyweight", "stretch"] },
  { id: "deep-squat-hold", name: "Deep Squat Hold", category: "Mobility", primaryMuscle: "Hip Flexors", secondaryMuscles: ["Quads", "Lower Back"], equipment: "Bodyweight", tags: ["mobility", "legs", "bodyweight", "stretch"] },
  { id: "shoulder-dislocates", name: "Shoulder Dislocates", category: "Mobility", primaryMuscle: "Shoulders", secondaryMuscles: ["Chest"], equipment: "Other", tags: ["mobility", "shoulders", "other", "stretch"] },
  { id: "lunge-with-twist", name: "Lunge with Twist", category: "Mobility", primaryMuscle: "Hip Flexors", secondaryMuscles: ["Core", "Obliques"], equipment: "Bodyweight", tags: ["mobility", "legs", "bodyweight", "stretch"] },
  { id: "figure-four-stretch", name: "Figure Four Stretch", category: "Mobility", primaryMuscle: "Glutes", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight", tags: ["mobility", "glutes", "bodyweight", "stretch"] },
  // CONDITIONING
  { id: "sled-pull", name: "Sled Pull", category: "Conditioning", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Calves"], equipment: "Other", tags: ["conditioning", "legs", "other", "explosive"] },
  { id: "tire-flip", name: "Tire Flip", category: "Conditioning", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Core", "Shoulders"], equipment: "Other", tags: ["conditioning", "full body", "other", "compound", "explosive"] },
  { id: "farmer-walk", name: "Farmer Walk", category: "Conditioning", primaryMuscle: "Forearms", secondaryMuscles: ["Traps", "Core"], equipment: "Dumbbell", tags: ["conditioning", "full body", "dumbbell", "compound", "carry"] },
  { id: "suitcase-carry", name: "Suitcase Carry", category: "Conditioning", primaryMuscle: "Core", secondaryMuscles: ["Forearms", "Obliques", "Traps"], equipment: "Dumbbell", tags: ["conditioning", "core", "dumbbell", "compound", "carry"] },
  // ADDITIONAL CHEST
  { id: "cable-crossover", name: "Cable Crossover", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Cable", tags: ["chest", "cable", "isolation", "push", "fly"] },
  { id: "incline-cable-fly", name: "Incline Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Cable", tags: ["chest", "cable", "isolation", "push", "fly", "upper chest"] },
  { id: "decline-cable-fly", name: "Decline Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Cable", tags: ["chest", "cable", "isolation", "push", "fly"] },
  { id: "chest-dip-machine", name: "Chest Dip Machine", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: "Machine", tags: ["chest", "machine", "compound", "push"] },
  { id: "smith-machine-decline-press", name: "Smith Machine Decline Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Machine", tags: ["chest", "machine", "compound", "push"] },
  { id: "close-grip-dumbbell-press", name: "Close Grip Dumbbell Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Dumbbell", tags: ["chest", "dumbbell", "compound", "push"] },
  { id: "weighted-dip", name: "Weighted Dip", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: "Bodyweight", tags: ["chest", "bodyweight", "compound", "push"] },
  // ADDITIONAL SHOULDERS
  { id: "cable-y-raise", name: "Cable Y Raise", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: ["Traps"], equipment: "Cable", tags: ["shoulders", "side delts", "cable", "isolation", "push"] },
  { id: "dumbbell-upright-row", name: "Dumbbell Upright Row", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: ["Traps"], equipment: "Dumbbell", tags: ["shoulders", "side delts", "dumbbell", "compound", "pull"] },
  { id: "seated-lateral-raise", name: "Seated Lateral Raise", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: [], equipment: "Dumbbell", tags: ["shoulders", "side delts", "dumbbell", "isolation", "push"] },
  { id: "leaning-lateral-raise", name: "Leaning Lateral Raise", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: [], equipment: "Dumbbell", tags: ["shoulders", "side delts", "dumbbell", "isolation", "push"] },
  { id: "barbell-push-press", name: "Barbell Push Press", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: ["Side Delts", "Triceps", "Quads"], equipment: "Barbell", tags: ["shoulders", "front delts", "barbell", "compound", "push", "explosive"] },
  { id: "single-arm-kettlebell-press", name: "Single Arm Kettlebell Press", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: ["Side Delts", "Core"], equipment: "Kettlebell", tags: ["shoulders", "front delts", "kettlebell", "compound", "push"] },
  { id: "band-pull-apart", name: "Band Pull Apart", category: "Shoulders", primaryMuscle: "Rear Delts", secondaryMuscles: ["Middle Back"], equipment: "Bodyweight", tags: ["shoulders", "rear delts", "bodyweight", "isolation", "pull"] },
  { id: "waiter-carry", name: "Waiter Carry", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: ["Forearms", "Core"], equipment: "Dumbbell", tags: ["shoulders", "front delts", "dumbbell", "compound", "carry"] },
  // ADDITIONAL BACK
  { id: "weighted-pull-up", name: "Weighted Pull Up", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: "Bodyweight", tags: ["back", "lats", "bodyweight", "compound", "pull"] },
  { id: "wide-seated-cable-row", name: "Wide Seated Cable Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Cable", tags: ["back", "middle back", "cable", "compound", "pull"] },
  { id: "single-arm-lat-pulldown", name: "Single Arm Lat Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Cable", tags: ["back", "lats", "cable", "compound", "pull"] },
  { id: "renegade-row", name: "Renegade Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Core"], equipment: "Dumbbell", tags: ["back", "middle back", "dumbbell", "compound", "pull"] },
  { id: "banded-pull-up", name: "Banded Pull Up", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Bodyweight", tags: ["back", "lats", "bodyweight", "compound", "pull"] },
  { id: "negative-pull-up", name: "Negative Pull Up", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Bodyweight", tags: ["back", "lats", "bodyweight", "isolation", "pull"] },
  { id: "gorilla-row", name: "Gorilla Row", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Middle Back", "Core"], equipment: "Dumbbell", tags: ["back", "lats", "dumbbell", "compound", "pull"] },
  { id: "cable-pull-through-back", name: "Cable Pull Through", category: "Back", primaryMuscle: "Lower Back", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Cable", tags: ["back", "lower back", "cable", "compound", "pull", "hinge"] },
  { id: "cable-face-pull", name: "Cable Face Pull", category: "Back", primaryMuscle: "Rear Delts", secondaryMuscles: ["Traps", "Middle Back"], equipment: "Cable", tags: ["back", "rear delts", "traps", "cable", "compound", "pull"] },
  // ADDITIONAL BICEPS
  { id: "cable-concentration-curl", name: "Cable Concentration Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Cable", tags: ["biceps", "cable", "isolation", "pull", "curl"] },
  { id: "incline-hammer-curl", name: "Incline Hammer Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell", tags: ["biceps", "dumbbell", "isolation", "pull", "curl"] },
  { id: "lying-cable-curl", name: "Lying Cable Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Cable", tags: ["biceps", "cable", "isolation", "pull", "curl"] },
  { id: "band-curl", name: "Band Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Bodyweight", tags: ["biceps", "bodyweight", "isolation", "pull", "curl"] },
  { id: "barbell-reverse-curl", name: "Barbell Reverse Curl", category: "Biceps", primaryMuscle: "Forearms", secondaryMuscles: ["Biceps"], equipment: "Barbell", tags: ["forearms", "biceps", "barbell", "isolation", "pull", "curl"] },
  // ADDITIONAL TRICEPS
  { id: "reverse-grip-pushdown", name: "Reverse Grip Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", tags: ["triceps", "cable", "isolation", "push"] },
  { id: "bodyweight-skull-crusher", name: "Bodyweight Skull Crusher", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Bodyweight", tags: ["triceps", "bodyweight", "isolation", "push"] },
  { id: "band-pushdown", name: "Band Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Bodyweight", tags: ["triceps", "bodyweight", "isolation", "push"] },
  { id: "dumbbell-floor-press", name: "Dumbbell Floor Press", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Dumbbell", tags: ["triceps", "chest", "dumbbell", "compound", "push"] },
  { id: "cable-kickback-tricep", name: "Cable Tricep Kickback", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable", tags: ["triceps", "cable", "isolation", "push"] },
  // ADDITIONAL LEGS
  { id: "atg-squat", name: "ATG Split Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "compound", "push", "squat"] },
  { id: "wall-sit", name: "Wall Sit", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "isolation", "push"] },
  { id: "lateral-lunge", name: "Lateral Lunge", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Adductors"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "compound", "push", "lunge"] },
  { id: "cossack-squat", name: "Cossack Squat", category: "Legs", primaryMuscle: "Adductors", secondaryMuscles: ["Quads", "Glutes"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "compound", "push", "squat"] },
  { id: "reverse-nordic-curl", name: "Reverse Nordic Curl", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "isolation", "pull"] },
  { id: "good-morning", name: "Good Morning", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Lower Back", "Glutes"], equipment: "Barbell", tags: ["legs", "hamstrings", "barbell", "compound", "pull", "hinge"] },
  { id: "adductor-machine", name: "Adductor Machine", category: "Legs", primaryMuscle: "Adductors", secondaryMuscles: ["Inner Thighs"], equipment: "Machine", tags: ["legs", "adductors", "machine", "isolation", "push"] },
  { id: "abductor-machine", name: "Abductor Machine", category: "Legs", primaryMuscle: "Glutes", secondaryMuscles: ["Hip Flexors"], equipment: "Machine", tags: ["legs", "glutes", "machine", "isolation", "push"] },
  { id: "deficit-deadlift", name: "Deficit Deadlift", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Lower Back", "Forearms"], equipment: "Barbell", tags: ["legs", "hamstrings", "barbell", "compound", "pull", "hinge"] },
  { id: "single-leg-press", name: "Single Leg Press", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Machine", tags: ["legs", "quads", "machine", "compound", "push"] },
  // ADDITIONAL GLUTES
  { id: "walking-lunge-glute", name: "Walking Lunge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Quads", "Hamstrings"], equipment: "Dumbbell", tags: ["glutes", "dumbbell", "compound", "push", "lunge"] },
  { id: "side-lying-leg-raise", name: "Side Lying Leg Raise", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight", tags: ["glutes", "bodyweight", "isolation", "push"] },
  { id: "kneeling-squat", name: "Kneeling Squat", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Quads"], equipment: "Bodyweight", tags: ["glutes", "bodyweight", "compound", "push"] },
  { id: "glute-medius-raise", name: "Glute Medius Raise", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: [], equipment: "Bodyweight", tags: ["glutes", "bodyweight", "isolation", "push"] },
  // ADDITIONAL CALVES
  { id: "skipping", name: "Skipping", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: ["Quads", "Core"], equipment: "Bodyweight", tags: ["calves", "bodyweight", "compound", "push", "plyometric"] },
  { id: "pogo-jump", name: "Pogo Jump", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Bodyweight", tags: ["calves", "bodyweight", "plyometric"] },
  { id: "weighted-standing-calf", name: "Weighted Standing Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Barbell", tags: ["calves", "barbell", "isolation", "push"] },
  { id: "seated-dumbbell-calf-raise", name: "Seated Dumbbell Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Dumbbell", tags: ["calves", "dumbbell", "isolation", "push"] },
  { id: "calf-hurdle-hop", name: "Calf Hurdle Hop", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: ["Quads"], equipment: "Bodyweight", tags: ["calves", "bodyweight", "plyometric"] },
  // ADDITIONAL ABS
  { id: "jackknife-sit-up", name: "Jackknife Sit Up", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: ["Lower Abs"], equipment: "Bodyweight", tags: ["abs", "upper abs", "bodyweight", "compound", "core"] },
  { id: "plank-walkout", name: "Plank Walkout", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Shoulders"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "compound", "core"] },
  { id: "spiderman-plank", name: "Spiderman Plank", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Obliques", "Hip Flexors"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "compound", "core"] },
  { id: "v-sit-hold", name: "V-Sit Hold", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Upper Abs", "Lower Abs", "Hip Flexors"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "isolation", "core"] },
  { id: "kneeling-cable-crunch", name: "Kneeling Cable Crunch", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: [], equipment: "Cable", tags: ["abs", "upper abs", "cable", "isolation", "core"] },
  { id: "medicine-ball-twist", name: "Medicine Ball Twist", category: "Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Core"], equipment: "Other", tags: ["abs", "obliques", "other", "isolation", "core"] },
  { id: "plank-jack", name: "Plank Jack", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Calves", "Shoulders"], equipment: "Bodyweight", tags: ["abs", "core", "bodyweight", "compound", "plyometric"] },
  { id: "leg-lowering-drill", name: "Leg Lowering Drill", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Core"], equipment: "Bodyweight", tags: ["abs", "lower abs", "bodyweight", "isolation", "core"] },
  // ADDITIONAL FULL BODY
  { id: "clean-and-jerk", name: "Clean and Jerk", category: "Full Body", primaryMuscle: "Quads", secondaryMuscles: ["Shoulders", "Hamstrings", "Core"], equipment: "Barbell", tags: ["full body", "quads", "barbell", "compound", "pull", "explosive"] },
  { id: "sumo-deadlift", name: "Sumo Deadlift", category: "Full Body", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Inner Thighs", "Forearms"], equipment: "Barbell", tags: ["full body", "hamstrings", "barbell", "compound", "pull", "hinge"] },
  { id: "turkish-get-up", name: "Turkish Get Up", category: "Full Body", primaryMuscle: "Core", secondaryMuscles: ["Shoulders", "Glutes", "Quads"], equipment: "Kettlebell", tags: ["full body", "core", "kettlebell", "compound", "push"] },
  { id: "bear-hug-carry", name: "Bear Hug Carry", category: "Full Body", primaryMuscle: "Core", secondaryMuscles: ["Chest", "Forearms"], equipment: "Other", tags: ["full body", "core", "other", "compound", "carry"] },
  { id: "sled-drag", name: "Sled Drag", category: "Full Body", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Core", "Upper Back"], equipment: "Other", tags: ["full body", "legs", "other", "compound", "pull", "carry"] },
  // ADDITIONAL FOREARMS
  { id: "towel-grip-pull-up", name: "Towel Grip Pull Up", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: ["Lats", "Biceps"], equipment: "Bodyweight", tags: ["forearms", "back", "bodyweight", "compound", "pull"] },
  { id: "rice-bucket", name: "Rice Bucket", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Other", tags: ["forearms", "other", "isolation"] },
  { id: "grip-crusher", name: "Grip Crusher", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Other", tags: ["forearms", "other", "isolation"] },
  { id: "finger-push-up", name: "Finger Push Up", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: ["Chest", "Triceps"], equipment: "Bodyweight", tags: ["forearms", "bodyweight", "compound", "push"] },
  // BONUS EXERCISES
  { id: "single-arm-dumbbell-snatch", name: "Single Arm Dumbbell Snatch", category: "Full Body", primaryMuscle: "Shoulders", secondaryMuscles: ["Quads", "Core", "Hamstrings"], equipment: "Dumbbell", tags: ["full body", "shoulders", "dumbbell", "compound", "explosive", "pull"] },
  { id: "overhead-carry", name: "Overhead Carry", category: "Conditioning", primaryMuscle: "Shoulders", secondaryMuscles: ["Core", "Forearms"], equipment: "Dumbbell", tags: ["conditioning", "shoulders", "dumbbell", "compound", "carry"] },
  { id: "cable-pull-through-glute", name: "Cable Pull Through (Glute)", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Cable", tags: ["glutes", "cable", "compound", "pull", "hinge"] },
  { id: "reverse-hyper", name: "Reverse Hyper", category: "Back", primaryMuscle: "Lower Back", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Machine", tags: ["back", "lower back", "machine", "isolation", "pull"] },
  { id: "single-leg-box-squat", name: "Single Leg Box Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "compound", "push", "squat"] },
  { id: "dumbbell-swing", name: "Dumbbell Swing", category: "Conditioning", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings", "Core"], equipment: "Dumbbell", tags: ["conditioning", "glutes", "dumbbell", "compound", "pull", "hinge"] },
  { id: "banded-glute-bridge", name: "Banded Glute Bridge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Bodyweight", tags: ["glutes", "bodyweight", "isolation", "push", "hinge"] },
  { id: "pull-up-hold", name: "Pull Up Hold", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Forearms"], equipment: "Bodyweight", tags: ["back", "lats", "bodyweight", "isolation", "pull", "hold"] },
  { id: "single-leg-wall-sit", name: "Single Leg Wall Sit", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Bodyweight", tags: ["legs", "quads", "bodyweight", "isolation", "push"] },
  { id: "cable-adduction", name: "Cable Adduction", category: "Legs", primaryMuscle: "Adductors", secondaryMuscles: ["Inner Thighs"], equipment: "Cable", tags: ["legs", "adductors", "cable", "isolation", "push"] },
];

const EXERCISE_CATEGORIES = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Legs", "Glutes", "Calves", "Abs", "Forearms", "Traps", "Full Body", "Cardio", "Mobility", "Conditioning"];

function enrichExerciseLib() {
  const richExerciseData = [
    { id: "bench-press", name: "Bench Press", category: "Chest", equipment: "Barbell", movementType: "Compound", difficulty: "Intermediate", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Delts", "Triceps"], stabilizers: ["Forearms", "Upper Back", "Core"], keywords: ["bench", "press", "chest", "barbell", "push", "horizontal press"], description: "Bench Press is one of the most effective compound movements for building upper body strength and muscle. It trains multiple muscle groups simultaneously and allows progressive overload over long periods.", whyUseIt: "It builds raw pressing strength, develops the chest effectively, and carries over to other pushing movements. It's a foundational lift that belongs in most programs.", stepByStep: ["Lie flat on bench with eyes under the bar", "Plant feet firmly on the floor", "Retract and depress shoulder blades", "Grip bar slightly wider than shoulder width", "Unrack the bar and hold over shoulders", "Lower bar under control to touch lower chest", "Press upward to lockout without arching", "Repeat, keeping shoulders packed throughout"], coachingCues: ["Bend the bar", "Drive through the floor", "Control the descent", "Keep shoulders packed", "Touch low chest, not neck"], mistakes: [{ problem: "Bouncing off chest", why: "Uses momentum instead of muscle", fix: "Pause for 1 second at the bottom" }, { problem: "Excessive elbow flare", why: "Puts stress on shoulders", fix: "Keep elbows at 45-60 degrees from torso" }, { problem: "Half reps", why: "Reduces range of motion and results", fix: "Touch chest and fully lock out each rep" }, { problem: "Losing upper back tension", why: "Reduces stability and power", fix: "Keep shoulders squeezed throughout set" }, { problem: "Lifting hips off bench", why: "Cheats range of motion", fix: "Keep glutes planted on the bench" }], progressionGuide: "Use double progression: add 1 rep per set until you hit the top of your rep range, then increase weight and drop back to the bottom of the range. Example: 50kg x 8 → 50kg x 9 → 50kg x 10 → 52.5kg x 8.", alternatives: ["Dumbbell Bench Press", "Machine Chest Press", "Incline Bench Press"], painFriendlyAlternatives: ["Machine Chest Press", "Floor Press", "Dumbbell Floor Press"], programmingTips: { sets: "3-5", reps: "6-10", frequency: "1-2x per week", rest: "2-3 minutes" }, ratings: { strength: 9, hypertrophy: 9, fatLoss: 7, beginner: 6, recoveryCost: 7 }, relatedExercises: ["incline-bench", "dumbbell-bench", "machine-chest-press", "push-ups", "cable-fly"], whenToUse: { bestFor: ["Strength", "Muscle Gain", "General Fitness"], lessImportant: ["Fat Loss", "Endurance"] }, goalSpecificCoaching: { buildMuscle: "Use moderate reps (8-12) with controlled tempo. Focus on stretch at the bottom.", loseFat: "Use higher reps (12-15) in circuit format to elevate heart rate.", strength: "Use low reps (3-6) with longer rest (3 min). Focus on peak force production." }, whenInPlan: "Bench press works best early in a session before accessory pressing work. Training it twice per week with different rep ranges drives the best results." },
    { id: "incline-bench", name: "Incline Bench Press", category: "Chest", equipment: "Barbell", movementType: "Compound", difficulty: "Intermediate", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Delts", "Triceps"], stabilizers: ["Forearms", "Upper Back", "Core"], keywords: ["incline", "bench", "press", "chest", "barbell", "push", "upper chest"], description: "The incline bench press targets the upper chest (clavicular head) more than flat pressing. It builds balanced chest development and carries over to overhead pressing strength.", whyUseIt: "It develops upper chest size and strength, which is essential for a full chest appearance and overhead pressing stability.", stepByStep: ["Set bench to 30-45 degree incline", "Lie back with eyes under the bar", "Plant feet firmly on the floor", "Retract shoulder blades and keep them down", "Grip bar at shoulder width", "Unrack and hold over shoulders", "Lower bar to upper chest under control", "Press up and back to lockout"], coachingCues: ["Keep shoulders down", "Touch above the nipple line", "Don't let elbows flare", "Drive feet into the floor"], mistakes: [{ problem: "Bench too steep (>45°)", why: "Shifts load to shoulders, reduces chest activation", fix: "Set bench to 30-45 degrees" }, { problem: "Letting bar drift toward clavicles", why: "Reduces stability and chest activation", fix: "Lower to upper chest, not collar bone" }, { problem: "Flaring elbows", why: "Increases shoulder stress", fix: "Keep elbows at 60-75 degrees from torso" }, { problem: "Bouncing bar off chest", why: "Uses momentum", fix: "Control the descent and pause if needed" }], progressionGuide: "Use double progression: add reps until you reach the top of your rep range, then increase weight. Aim to add 2-3 reps or 2.5kg every 1-2 weeks.", alternatives: ["Flat Bench Press", "Dumbbell Incline Press", "Smith Machine Incline"], painFriendlyAlternatives: ["Dumbbell Incline Press", "Machine Chest Press", "Cable Flys"], programmingTips: { sets: "3-4", reps: "8-12", frequency: "1x per week", rest: "60-90 seconds" }, ratings: { strength: 8, hypertrophy: 9, fatLoss: 7, beginner: 5, recoveryCost: 7 }, relatedExercises: ["bench-press", "dumbbell-bench", "overhead-press"], whenToUse: { bestFor: ["Muscle Gain", "General Fitness", "Strength"], lessImportant: ["Fat Loss", "Endurance"] }, goalSpecificCoaching: { buildMuscle: "8-12 reps with controlled eccentric. Use incline as your main upper chest builder.", loseFat: "Moderate reps (10-12) in circuit to maintain chest mass while cutting.", strength: "4-6 reps, 2-3 min rest. Focus on bar path and leg drive." }, whenInPlan: "Incline pressing complements flat bench well. When both are in the same program, train flat heavy first, then incline for volume." },
    { id: "dumbbell-bench", name: "Dumbbell Bench Press", category: "Chest", equipment: "Dumbbells", movementType: "Compound", difficulty: "Intermediate", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Delts", "Triceps"], stabilizers: ["Shoulder Stabilizers", "Core"], keywords: ["dumbbell", "bench", "press", "chest", "push", "unilateral"], description: "Dumbbell bench press allows a greater range of motion than the barbell version, which can improve chest activation and fix muscle imbalances.", whyUseIt: "Dumbbells provide a larger stretch at the bottom, address strength asymmetries, and are easier on the shoulders for many lifters.", stepByStep: ["Lie flat on bench with dumbbells resting on thighs", "Kick dumbbells up to starting position at shoulders", "Press dumbbells up to lockout", "Lower under control to chest level", "Keep palms facing forward throughout", "Press back up and repeat"], coachingCues: ["Let dumbbells travel wider at the bottom", "Don't let dumbbells touch at the top", "Keep wrists neutral", "Control the negative"], mistakes: [{ problem: "Short ROM at the bottom", why: "Reduces chest activation and stretch", fix: "Lower until upper arms are past parallel" }, { problem: "Tensing neck and shoulders", why: "Wastes energy and creates tightness", fix: "Relax neck, breathe, focus on chest" }, { problem: "Letting dumbbells drift apart", why: "Reduces chest tension at the top", fix: "Keep dumbbells over chest, not shoulders" }], progressionGuide: "Increase weight when you can complete all reps with controlled form. Dumbbell jumps are typically 2-4kg per side.", alternatives: ["Barbell Bench Press", "Machine Chest Press", "Push-Ups"], painFriendlyAlternatives: ["Machine Chest Press", "Floor Dumbbell Press", "Cable Flys"], programmingTips: { sets: "3-4", reps: "8-12", frequency: "1-2x per week", rest: "60-90 seconds" }, ratings: { strength: 7, hypertrophy: 9, fatLoss: 7, beginner: 7, recoveryCost: 6 }, relatedExercises: ["bench-press", "incline-bench", "push-ups", "cable-fly"], whenToUse: { bestFor: ["Muscle Gain", "General Fitness", "Shoulder Health"], lessImportant: ["Max Strength", "Fat Loss"] }, goalSpecificCoaching: { buildMuscle: "8-12 reps with emphasis on the stretch. Pause at the bottom for 1-2 seconds.", loseFat: "Use as part of a circuit. 10-15 reps, minimal rest.", strength: "Heavy dumbbells (6-8 reps) with controlled negatives." }, whenInPlan: "Dumbbell bench can replace barbell bench when shoulders need a break, or be used as a secondary press later in the session." },
    { id: "machine-chest-press", name: "Machine Chest Press", category: "Chest", equipment: "Machine", movementType: "Compound", difficulty: "Beginner", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Delts", "Triceps"], stabilizers: [], keywords: ["machine", "chest", "press", "selectorized", "plate-loaded"], description: "Machine chest press provides a stable pressing pattern with fixed range of motion. It's easier on the joints than free weight alternatives and great for adding volume safely.", whyUseIt: "It allows you to push near failure with less risk than free weights, and works well for adding extra chest volume at the end of a session.", stepByStep: ["Adjust seat height so handles align with mid-chest", "Grasp handles at shoulder width", "Press forward until arms are extended", "Return under control without letting plates touch", "Repeat with controlled reps"], coachingCues: ["Keep shoulders packed", "Don't bounce at the end range", "Squeeze chest at extension", "Control the negative"], mistakes: [{ problem: "Using momentum and bouncing", why: "Reduces muscle tension", fix: "Pause at the stretched position each rep" }, { problem: "Shrugging shoulders during press", why: "Shifts load to traps and delts", fix: "Keep shoulders down and back" }, { problem: "Incomplete range of motion", why: "Uses less muscle", fix: "Go to full extension without locking out hard" }], progressionGuide: "Increase plate weight when you can complete target reps with clean form. Small jumps are ideal for machines.", alternatives: ["Bench Press", "Dumbbell Bench Press", "Push-Ups"], painFriendlyAlternatives: ["Machine Chest Press", "Cable Flys", "Floor Press"], programmingTips: { sets: "3-4", reps: "8-15", frequency: "1-2x per week", rest: "60 seconds" }, ratings: { strength: 5, hypertrophy: 7, fatLoss: 6, beginner: 10, recoveryCost: 4 }, relatedExercises: ["bench-press", "dumbbell-bench", "push-ups"], whenToUse: { bestFor: ["Beginner", "Muscle Gain", "General Fitness", "Joint Health"], lessImportant: ["Strength", "Athletic Performance"] }, goalSpecificCoaching: { buildMuscle: "10-15 reps with controlled tempo. Squeeze at the top of each rep.", loseFat: "Circuit style, minimal rest between sets.", strength: "Can be used for high volume accessory work after heavy pressing." }, whenInPlan: "Machine press works well as a secondary or tertiary chest movement. Use it after heavy barbell or dumbbell pressing." },
    { id: "push-ups", name: "Push Ups", category: "Chest", equipment: "Bodyweight", movementType: "Compound", difficulty: "Beginner", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Delts", "Triceps", "Core"], stabilizers: ["Seratus Anterior", "Lower Back"], keywords: ["push", "up", "bodyweight", "chest", "triceps", "home"], description: "Push-ups are the most accessible upper body pushing exercise, requiring no equipment while effectively training the chest, shoulders, and triceps.", whyUseIt: "They build pushing strength and endurance anywhere, engage the core as stabilizers, and can be progressed or regressed to any fitness level.", stepByStep: ["Start in a high plank with hands slightly wider than shoulders", "Keep body in a straight line from heels to head", "Lower chest toward floor, elbows at 45 degrees", "Push through palms to return to start", "Repeat without letting hips sag"], coachingCues: ["Squeeze glutes and brace core", "Chest to floor each rep", "Don't let hips sag", "Push the floor away", "Keep neck neutral"], mistakes: [{ problem: "Hips sagging", why: "Reduces core engagement and strains lower back", fix: "Squeeze glutes and brace abs throughout" }, { problem: "Flaring elbows to 90 degrees", why: "Stresses shoulder joints", fix: "Keep elbows at 45 degrees from torso" }, { problem: "Half reps", why: "Reduces chest activation", fix: "Chest touches floor, arms fully extend at top" }, { problem: "Head dropping forward", why: "Neck strain", fix: "Keep neck neutral, gaze just ahead of hands" }, { problem: "Hands too wide/narrow", why: "Alters muscle targeting and can cause discomfort", fix: "Hands at chest level, slightly wider than shoulder width" }], progressionGuide: "Can't do 10? Start with incline push-ups. Can do 20+ easily? Try decline, weighted, or archer push-ups.", alternatives: ["Bench Press", "Dumbbell Bench Press", "Incline Push Ups", "Decline Push Ups"], painFriendlyAlternatives: ["Incline Push Ups", "Machine Chest Press", "Cable Flys"], programmingTips: { sets: "3-5", reps: "8-20", frequency: "2-5x per week", rest: "30-60 seconds" }, ratings: { strength: 5, hypertrophy: 6, fatLoss: 7, beginner: 10, recoveryCost: 3 }, relatedExercises: ["bench-press", "dumbbell-bench", "incline-bench"], whenToUse: { bestFor: ["General Fitness", "Beginner", "Fat Loss", "Endurance", "Home Workouts"], lessImportant: ["Max Strength", "Muscle Gain (advanced)"] }, goalSpecificCoaching: { buildMuscle: "Weighted push-ups (8-15 reps). Add a plate or use a vest.", loseFat: "High rep sets (15-25 reps) in circuits. Minimal rest.", strength: "Weighted push-ups, 5-8 reps, slow and controlled." }, whenInPlan: "Push-ups are versatile: use as a main press when equipment is limited, as a warm-up, or as a burnout finisher after heavy pressing." },
    { id: "cable-fly", name: "Cable Fly", category: "Chest", equipment: "Cable", movementType: "Isolation", difficulty: "Beginner", primaryMuscles: ["Chest"], secondaryMuscles: ["Front Delts"], stabilizers: ["Core", "Shoulder Stabilizers"], keywords: ["cable", "fly", "chest", "isolation", "crossover", "cable crossover"], description: "Cable flys provide constant tension on the chest throughout the full range of motion, making them an excellent isolation movement for chest development.", whyUseIt: "Cables maintain tension even at the top of the movement where free weights don't. This maximizes muscle fiber recruitment and promotes growth.", stepByStep: ["Set pulleys to shoulder height or higher", "Grab handles and step forward into a split stance", "Lean forward slightly, arms open wide", "Bring hands together in front of chest", "Squeeze chest at peak contraction", "Return under control to the starting width"], coachingCues: ["Lead with the elbows, not the hands", "Imagine hugging a tree", "Keep a slight bend in the elbows", "Pause and squeeze at the top"], mistakes: [{ problem: "Too much elbow bend", why: "Becomes a pressing movement", fix: "Keep a fixed, slight bend in arms throughout" }, { problem: "Using momentum and swinging", why: "Reduces chest activation", fix: "Control the weight, no body swing" }, { problem: "Moving too fast", why: "Eliminates the constant tension advantage", fix: "2 seconds squeeze, 3 seconds return" }], progressionGuide: "Add weight when you can complete 12-15 clean reps. Focus on the stretch and contraction more than the load.", alternatives: ["Pec Deck Machine", "Dumbbell Flys", "Push-Ups"], painFriendlyAlternatives: ["Machine Fly", "Cable Crossover With Lighter Weight", "Floor Flys"], programmingTips: { sets: "3-4", reps: "12-15", frequency: "1-2x per week", rest: "45-60 seconds" }, ratings: { strength: 3, hypertrophy: 9, fatLoss: 6, beginner: 8, recoveryCost: 3 }, relatedExercises: ["bench-press", "dumbbell-bench", "push-ups"], whenToUse: { bestFor: ["Muscle Gain", "General Fitness", "Chest Definition"], lessImportant: ["Strength", "Fat Loss"] }, goalSpecificCoaching: { buildMuscle: "12-15 reps with a 2-second squeeze at peak contraction.", loseFat: "Higher reps (15-20), minimal rest, in a circuit.", strength: "Use as an accessory movement on push days for chest volume." }, whenInPlan: "Cable flys go after heavy pressing. They add chest volume without taxing the joints like another press would." },
    { id: "barbell-row", name: "Barbell Row", category: "Back", equipment: "Barbell", movementType: "Compound", difficulty: "Intermediate", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Delts"], stabilizers: ["Core", "Lower Back", "Forearms"], keywords: ["barbell", "row", "back", "pull", "horizontal pull", "bent over row"], description: "The barbell row is one of the most effective compound exercises for building back thickness, strength, and mass.", whyUseIt: "It drives horizontal pulling strength, which is essential for balanced posture and injury prevention alongside pressing.", stepByStep: ["Stand with feet shoulder-width apart holding bar with overhand grip", "Hinge at the hips with a flat back until torso is near parallel to floor", "Let bar hang at knee level", "Pull bar toward lower chest, squeezing shoulder blades", "Lower under control to full arm extension", "Repeat, keeping torso stable"], coachingCues: ["Pull the bar to your belly button", "Squeeze your shoulder blades", "Keep wrists straight", "Don't let hips rise", "Control the negative"], mistakes: [{ problem: "Rounding the lower back", why: "Increases injury risk", fix: "Keep chest up and core braced throughout" }, { problem: "Using hips to jerk the weight", why: "Uses momentum, reduces back activation", fix: "Keep hips still, let back do the work" }, { problem: "Partial reps", why: "Uses less range of motion", fix: "Full extension at the bottom, bar touches belly at the top" }, { problem: "Head looking up", why: "Neck strain", fix: "Keep neck neutral, eyes on the floor ahead" }], progressionGuide: "Add weight when you can complete target reps with a clean last rep. Small increases work best.", alternatives: ["T-Bar Row", "Pendlay Row", "Cable Row", "Dumbbell Row"], painFriendlyAlternatives: ["Cable Row", "Chest Supported Row", "Machine Row"], programmingTips: { sets: "3-5", reps: "6-10", frequency: "1-2x per week", rest: "2 minutes" }, ratings: { strength: 9, hypertrophy: 9, fatLoss: 7, beginner: 5, recoveryCost: 7 }, relatedExercises: ["pull-ups", "lat-pulldown", "cable-row"], whenToUse: { bestFor: ["Strength", "Muscle Gain", "General Fitness"], lessImportant: ["Fat Loss", "Endurance"] }, goalSpecificCoaching: { buildMuscle: "8-12 reps with controlled eccentrics. Squeeze at the top of each rep.", loseFat: "Higher reps (12-15) in circuit format.", strength: "4-6 reps with heavy weight. Use straps if grip is limiting." }, whenInPlan: "Barbell rows work best as the main horizontal pull of the session, placed early after warm-up." },
    { id: "pull-ups", name: "Pull Ups", category: "Back", equipment: "Bodyweight", movementType: "Compound", difficulty: "Advanced", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Delts", "Core"], stabilizers: ["Forearms", "Shoulder Stabilizers"], keywords: ["pull", "up", "bodyweight", "back", "vertical pull", "calisthenics"], description: "Pull-ups are a fundamental vertical pulling exercise that builds upper back width, strength, and muscular endurance.", whyUseIt: "They develop lat width, grip strength, and relative strength. They're a true test of upper body strength-to-weight ratio.", stepByStep: ["Jump up to grip bar slightly wider than shoulder width, palms facing away", "Hang with arms fully extended", "Pull yourself up until chin clears the bar", "Lower under control to full hang", "Repeat without kipping or swinging"], coachingCues: ["Drive elbows down and back", "Pull the bar to your chest", "Squeeze your lats at the top", "Control the descent"], mistakes: [{ problem: "Kipping / using momentum", why: "Reduces lat activation and can cause injury", fix: "Use strict form, no body swing" }, { problem: "Partial reps", why: "Uses less muscle and less ROM", fix: "Chin over bar, full hang at bottom" }, { problem: "Not engaging lats at the start", why: "Makes the movement harder than necessary", fix: "Pull shoulders down before initiating the pull" }], progressionGuide: "Can't do one? Use negatives (slow descent), assisted band pull-ups, or lat pulldowns. Good for 5+? Add weight with a dip belt.", alternatives: ["Lat Pulldown", "Chin Ups", "Assisted Pull Ups", "Cable Pullover"], painFriendlyAlternatives: ["Lat Pulldown", "Cable Pullover", "Inverted Row"], programmingTips: { sets: "3-5", reps: "5-12", frequency: "2x per week", rest: "2 minutes" }, ratings: { strength: 9, hypertrophy: 8, fatLoss: 7, beginner: 3, recoveryCost: 6 }, relatedExercises: ["lat-pulldown", "barbell-row", "cable-row"], whenToUse: { bestFor: ["Strength", "Muscle Gain", "General Fitness"], lessImportant: ["Fat Loss", "Endurance"] }, goalSpecificCoaching: { buildMuscle: "8-12 reps, slowing the eccentric for more time under tension.", loseFat: "Can be done in circuit format; high rep sets when possible.", strength: "Add weight for 4-6 rep sets, full ROM each rep." }, whenInPlan: "Pull-ups go first in back sessions as they require the most energy and neural drive." },
    { id: "lat-pulldown", name: "Lat Pulldown", category: "Back", equipment: "Cable", movementType: "Compound", difficulty: "Beginner", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Delts"], stabilizers: ["Core", "Forearms"], keywords: ["lat", "pulldown", "back", "cable", "vertical pull"], description: "Lat pulldowns mimic the pull-up movement pattern while allowing you to control the load precisely. They're excellent for building lat width.", whyUseIt: "They build vertical pulling strength and lat width with adjustable weight that makes progressive overload easy.", stepByStep: ["Sit at lat pulldown machine with thighs secured under pads", "Grab bar wider than shoulder width, palms facing forward", "Lean back slightly, keep chest up", "Pull bar down to upper chest", "Squeeze lats at the bottom", "Return bar under control to full extension"], coachingCues: ["Pull the bar to your chest, not your neck", "Squeeze shoulder blades together", "Control the negative", "Lead with your elbows"], mistakes: [{ problem: "Pulling behind the neck", why: "Stresses shoulder joints", fix: "Pull to upper chest, staying in front" }, { problem: "Using too much body swing", why: "Reduces lat activation", fix: "Keep torso stable, use strict form" }, { problem: "Letting the weight stack crash", why: "Reduces eccentric tension", fix: "Control every rep on the way up too" }], progressionGuide: "Increase plate weight when you can complete 12 controlled reps. Focus on full stretch at the top.", alternatives: ["Pull Ups", "Chin Ups", "Cable Pullover"], painFriendlyAlternatives: ["Assisted Pull Ups", "Cable Pullover", "Neutral Grip Pulldown"], programmingTips: { sets: "3-4", reps: "8-12", frequency: "1-2x per week", rest: "60-90 seconds" }, ratings: { strength: 6, hypertrophy: 8, fatLoss: 6, beginner: 10, recoveryCost: 4 }, relatedExercises: ["pull-ups", "cable-row", "barbell-row"], whenToUse: { bestFor: ["Muscle Gain", "Beginner", "General Fitness"], lessImportant: ["Strength", "Athletic Performance"] }, goalSpecificCoaching: { buildMuscle: "10-12 reps, controlled eccentric. Squeeze at the bottom of each rep.", loseFat: "12-15 reps in a circuit, minimal rest.", strength: "6-8 reps, heavier weight, controlled." }, whenInPlan: "Lat pulldowns work as a primary vertical pull or as a reliable alternative when pull-ups aren't available or you're accumulating volume." },
    { id: "cable-row", name: "Cable Row", category: "Back", equipment: "Cable", movementType: "Compound", difficulty: "Beginner", primaryMuscles: ["Back"], secondaryMuscles: ["Biceps", "Rear Delts"], stabilizers: ["Core", "Lower Back"], keywords: ["cable", "row", "seated", "back", "pull", "horizontal"], description: "The seated cable row builds back thickness by targeting the mid-back and rhomboids. The cable provides constant tension throughout the movement.", whyUseIt: "It provides constant tension, is easy on the lower back compared to barbell rows, and allows precise weight adjustments.", stepByStep: ["Sit at the cable row station with feet braced", "Grasp handle with arms extended, slight forward lean", "Pull handle to lower abdomen, squeeze shoulder blades", "Return under control to full arm extension", "Repeat without leaning too far forward or back"], coachingCues: ["Squeeze shoulder blades together", "Don't lean back excessively", "Pull with your elbows, not your hands", "Keep chest up"], mistakes: [{ problem: "Leaning too far back", why: "Uses bodyweight instead of back", fix: "Keep torso upright, only arms move" }, { problem: "Rounding shoulders forward", why: "Disengages back muscles", fix: "Keep chest out and shoulders back" }, { problem: "Using momentum", why: "Reduces muscle tension", fix: "Control both the pull and the release" }, { problem: "Too much bicep involvement", why: "Reduces lat activation", fix: "Focus on driving elbows back" }], progressionGuide: "Add weight when you can complete 12 controlled reps. Focus on the quality of each rep over the quantity of weight.", alternatives: ["Barbell Row", "Dumbbell Row", "T-Bar Row", "Machine Row"], painFriendlyAlternatives: ["Chest Supported Row", "Machine Row", "Cable Row With Straight Bar"], programmingTips: { sets: "3-4", reps: "10-15", frequency: "1-2x per week", rest: "60 seconds" }, ratings: { strength: 6, hypertrophy: 8, fatLoss: 6, beginner: 10, recoveryCost: 4 }, relatedExercises: ["barbell-row", "pull-ups", "lat-pulldown"], whenToUse: { bestFor: ["Muscle Gain", "General Fitness", "Beginner"], lessImportant: ["Strength", "Fat Loss"] }, goalSpecificCoaching: { buildMuscle: "10-15 reps, 2 second negative. Squeeze shoulder blades at the peak.", loseFat: "Circuit style, 15 reps minimal rest.", strength: "Heavier weight, 6-8 reps, controlled negative." }, whenInPlan: "Cable rows work as a primary horizontal pull or as a volume add-on after heavier rowing." },
    { id: "deadlift", name: "Deadlift", category: "Back", equipment: "Barbell", movementType: "Compound", difficulty: "Advanced", primaryMuscles: ["Back"], secondaryMuscles: ["Glutes", "Hamstrings", "Core", "Forearms"], stabilizers: ["Traps", "Upper Back", "Shoulder Stabilizers"], keywords: ["deadlift", "conventional", "barbell", "pull", "full body", "hip hinge"], description: "The deadlift is a full-body compound movement that primarily trains the posterior chain. It builds raw strength and power more effectively than almost any other exercise.", whyUseIt: "The deadlift builds total-body strength, reinforces proper hip hinge mechanics, and has high carryover to athletic performance.", stepByStep: ["Stand with feet hip-width apart, bar over mid-foot", "Hinge at hips and bend knees to grip the bar", "Drop hips, straighten back, chest up", "Pull the slack out of the bar", "Drive through the floor, extending hips and knees together", "Lock out at the top with glutes squeezed", "Lower the bar under control by hinging first"], coachingCues: ["Pull the slack out of the bar", "Push the floor away", "Keep the bar close to your body", "Chest up, back straight", "Drive through the whole foot"], mistakes: [{ problem: "Rounded lower back", why: "Increases injury risk significantly", fix: "Keep chest up, brace core, drop hips lower if needed" }, { problem: "Bar drifting away from body", why: "Increases lower back stress", fix: "Keep bar in contact with legs throughout" }, { problem: "Hips rising before the bar moves", why: "Weak starting position", fix: "Keep hips and shoulders rising together" }, { problem: "Over-extending at lockout", why: "Puts lower back at risk", fix: "Stand tall without leaning back" }, { problem: "Looking up or down", why: "Neck strain or compromised position", fix: "Keep neck neutral, eyes fixed 8-12 feet ahead" }], progressionGuide: "Use small plate jumps (2.5-5kg). Follow a structured program — don't max out frequently. 5kg monthly increases on the working set is solid progress.", alternatives: ["Trap Bar Deadlift", "Romanian Deadlift", "Good Mornings", "Rack Pulls"], painFriendlyAlternatives: ["Trap Bar Deadlift", "Romanian Deadlift", "Hip Thrusts", "Cable Pull Through"], programmingTips: { sets: "3-5", reps: "3-6", frequency: "1-2x per week", rest: "3-5 minutes" }, ratings: { strength: 10, hypertrophy: 8, fatLoss: 8, beginner: 4, recoveryCost: 9 }, relatedExercises: ["romanian-deadlift"], whenToUse: { bestFor: ["Strength", "General Fitness", "Full Body Power"], lessImportant: ["Muscle Gain Priority", "Fat Loss (as primary)"] }, goalSpecificCoaching: { buildMuscle: "5-8 reps, controlled eccentrics. RDLs may be better for pure hypertrophy.", loseFat: "Moderate reps (8-10) as part of full body circuit for calorie burn.", strength: "3-5 reps, heavy. Focus on starting position and bar speed." }, whenInPlan: "Deadlift needs to be early in your session when CNS is fresh. Once or twice per week is sufficient for most programs." }
  ];

  for (const ex of EXERCISE_LIBRARY) {
    if (!ex.type) {
      const tags = ex.tags || [];
      if (tags.includes("compound")) ex.type = "Compound";
      else if (tags.includes("isolation")) ex.type = "Isolation";
      else if (tags.includes("plyometric") || tags.includes("explosive")) ex.type = "Conditioning";
      else if (ex.equipment === "Bodyweight" && (tags.includes("core") || tags.includes("hold"))) ex.type = "Mobility";
      else ex.type = "Compound";
    }
    if (!ex.difficulty) {
      if (ex.equipment === "Bodyweight" && !ex.tags.includes("explosive")) ex.difficulty = "Beginner";
      else if (ex.tags.includes("explosive") || ex.tags.includes("plyometric")) ex.difficulty = "Advanced";
      else ex.difficulty = "Intermediate";
    }
  }

  // Merge rich encyclopedia data into matching EXERCISE_LIBRARY entries
  for (const rich of richExerciseData) {
    const match = EXERCISE_LIBRARY.find(
      e => e.name.toLowerCase() === rich.name.toLowerCase() || e.id === rich.id
    );
    if (match) {
      Object.assign(match, rich);
    } else {
      EXERCISE_LIBRARY.push(rich);
    }
  }
}

const COMPOUND_EXERCISE_NAMES = new Set([
  "Barbell Bench Press",
  "Incline Barbell Bench Press",
  "Decline Bench Press",
  "Dumbbell Bench Press",
  "Incline Dumbbell Press",
  "Machine Chest Press",
  "Dips",
  "Overhead Press",
  "Seated Dumbbell Press",
  "Arnold Press",
  "Machine Shoulder Press",
  "Upright Row",
  "Pull Ups",
  "Chin Ups",
  "Lat Pulldown",
  "Wide Grip Pulldown",
  "Close Grip Pulldown",
  "Barbell Row",
  "Pendlay Row",
  "T Bar Row",
  "Seated Cable Row",
  "Single Arm Dumbbell Row",
  "Machine Row",
  "Straight Arm Pulldown",
  "Deadlift",
  "Power Clean",
  "Clean and Press",
  "Thruster",
  "Kettlebell Swing",
  "Back Squat",
  "Front Squat",
  "Hack Squat",
  "Leg Press",
  "Bulgarian Split Squat",
  "Walking Lunges",
  "Goblet Squat",
  "Step Ups",
  "Reverse Lunge",
  "Romanian Deadlift",
  "Stiff Leg Deadlift",
  "Close Grip Bench Press",
  "JM Press",
  "Hip Thrust",
  "Smith Machine Hip Thrust",
  "Glute Bridge",
  "Barbell Shrug",
  "Farmer Carry",
  "Farmer's Carry",
  "Smith Machine Bench Press",
  "Smith Machine Incline Press",
  "Safety Bar Squat",
  "Wide Stance Squat",
  "Pause Squat",
  "Sled Push",
  "Cable Woodchop",
  "Medicine Ball Slam",
  "Bear Crawl",
  "Windshield Wiper",
  "Banded Hip Thrust",
  "Barbell Glute Bridge",
  "Curtsy Lunge",
  "V-Grip Pulldown",
  "Reverse Grip Pulldown",
  "Cable High Row",
  "Smith Machine Row",
  "Landmine Row",
  "Smith Machine Overhead Press",
  "Snatch",
  "Push Jerk",
  "Muscle Up",
  "Handstand Push Up",
  "Jump Squat",
  "Incline Treadmill Walk",
  "Kettlebell Deadlift",
  "Dumbbell RDL",
  "Cable Pull Through",
  "Dumbbell Pullover (Flat)",
]);

function isCompoundExercise(exName) {
  return COMPOUND_EXERCISE_NAMES.has(exName);
}

const state = loadState();

function displayWeight(kg) {
  const n = Number(kg) || 0;
  if (state.weightUnit === "lb") return Math.round(n * 2.20462 * 10) / 10 + " lb";
  return n + " kg";
}
function parseWeight(val) {
  if (state.weightUnit === "lb") return Math.round(((Number(val) || 0) / 2.20462) * 10) / 10;
  return Number(val) || 0;
}
function showToast(msg) {
  const t = document.getElementById("prToast");
  if (t) {
    if (window.prToastTimer) clearTimeout(window.prToastTimer);
    document.getElementById("prToastMsg").textContent = msg;
    t.classList.remove("is-hidden");
    window.prToastTimer = setTimeout(() => t.classList.add("is-hidden"), 3000);
  }
}
function displayHeight(cm) {
  const n = Number(cm) || 0;
  if (state.heightUnit === "ft/in") {
    const totalIn = n / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inc = Math.round(totalIn % 12);
    return ft + "'" + inc + '"';
  }
  return n + " cm";
}

// ===== MUSCLE MAP SYSTEM =====
const MUSCLE_GROUPS = [
  { id: "neck", label: "Neck", view: "front" },
  { id: "upperChest", label: "Upper Chest", view: "front" },
  { id: "middleChest", label: "Middle Chest", view: "front" },
  { id: "lowerChest", label: "Lower Chest", view: "front" },
  { id: "frontDelts", label: "Front Delts", view: "front" },
  { id: "sideDelts", label: "Side Delts", view: "front" },
  { id: "biceps", label: "Biceps", view: "front" },
  { id: "forearms", label: "Forearms", view: "front" },
  { id: "upperAbs", label: "Upper Abs", view: "front" },
  { id: "lowerAbs", label: "Lower Abs", view: "front" },
  { id: "obliques", label: "Obliques", view: "front" },
  { id: "hipFlexors", label: "Hip Flexors", view: "front" },
  { id: "quads", label: "Quads", view: "front" },
  { id: "innerThighs", label: "Inner Thighs", view: "front" },
  { id: "calves", label: "Calves", view: "front" },
  { id: "tibialis", label: "Tibialis", view: "front" },
  { id: "upperTraps", label: "Upper Traps", view: "back" },
  { id: "middleTraps", label: "Middle Traps", view: "back" },
  { id: "lowerTraps", label: "Lower Traps", view: "back" },
  { id: "rearDelts", label: "Rear Delts", view: "back" },
  { id: "lats", label: "Lats", view: "back" },
  { id: "midBack", label: "Mid Back", view: "back" },
  { id: "lowerBack", label: "Lower Back", view: "back" },
  { id: "triceps", label: "Triceps", view: "back" },
  { id: "forearmsBack", label: "Forearms", view: "back" },
  { id: "glutes", label: "Glutes", view: "back" },
  { id: "hamstrings", label: "Hamstrings", view: "back" },
  { id: "calvesBack", label: "Calves", view: "back" },
];

const MUSCLE_GROUP_MAP = {
  "sternocleidomastoid-left": "neck",
  "sternocleidomastoid-right": "neck",
  "anterior-deltoid-left": "frontDelts",
  "anterior-deltoid-right": "frontDelts",
  "lateral-deltoid-left": "sideDelts",
  "lateral-deltoid-right": "sideDelts",
  "pectoralis-major-upper-left": "upperChest",
  "pectoralis-major-upper-right": "upperChest",
  "pectoralis-major-lower-left": "lowerChest",
  "pectoralis-major-lower-right": "lowerChest",
  "serratus-left": "obliques",
  "serratus-right": "obliques",
  "external-oblique-left": "obliques",
  "external-oblique-right": "obliques",
  "rectus-abdominis-upper-left": "upperAbs",
  "rectus-abdominis-upper-right": "upperAbs",
  "rectus-abdominis-middle-left": "upperAbs",
  "rectus-abdominis-middle-right": "upperAbs",
  "rectus-abdominis-lower-left": "lowerAbs",
  "rectus-abdominis-lower-right": "lowerAbs",
  "biceps-left": "biceps",
  "biceps-right": "biceps",
  "brachialis-left": "biceps",
  "brachialis-right": "biceps",
  "forearm-flexors-left": "forearms",
  "forearm-flexors-right": "forearms",
  "adductors-left": "innerThighs",
  "adductors-right": "innerThighs",
  "quadriceps-outer-left": "quads",
  "quadriceps-outer-right": "quads",
  "quadriceps-inner-left": "quads",
  "quadriceps-inner-right": "quads",
  "tibialis-anterior-left": "tibialis",
  "tibialis-anterior-right": "tibialis",
  "upper-trapezius-left": "upperTraps",
  "upper-trapezius-right": "upperTraps",
  "middle-trapezius-left": "middleTraps",
  "middle-trapezius-right": "middleTraps",
  "lower-trapezius-left": "lowerTraps",
  "lower-trapezius-right": "lowerTraps",
  "rear-deltoid-left": "rearDelts",
  "rear-deltoid-right": "rearDelts",
  "teres-major-left": "lats",
  "teres-major-right": "lats",
  "rhomboid-left": "midBack",
  "rhomboid-right": "midBack",
  "latissimus-left": "lats",
  "latissimus-right": "lats",
  "triceps-long-head-left": "triceps",
  "triceps-long-head-right": "triceps",
  "triceps-lateral-head-left": "triceps",
  "triceps-lateral-head-right": "triceps",
  "erector-spinae-left": "lowerBack",
  "erector-spinae-right": "lowerBack",
  "glute-max-left": "glutes",
  "glute-max-right": "glutes",
  "glute-med-left": "glutes",
  "glute-med-right": "glutes",
  "hamstring-inner-left": "hamstrings",
  "hamstring-inner-right": "hamstrings",
  "hamstring-outer-left": "hamstrings",
  "hamstring-outer-right": "hamstrings",
  "gastrocnemius-inner-left": "calvesBack",
  "gastrocnemius-inner-right": "calvesBack",
  "gastrocnemius-outer-left": "calvesBack",
  "gastrocnemius-outer-right": "calvesBack",
  "soleus-left": "calvesBack",
  "soleus-right": "calvesBack",
};

const MUSCLE_LABEL_MAP = {
  "sternocleidomastoid-left": "Sternocleidomastoid (L)",
  "sternocleidomastoid-right": "Sternocleidomastoid (R)",
  "anterior-deltoid-left": "Front Delt (L)",
  "anterior-deltoid-right": "Front Delt (R)",
  "lateral-deltoid-left": "Side Delt (L)",
  "lateral-deltoid-right": "Side Delt (R)",
  "pectoralis-major-upper-left": "Upper Pec (L)",
  "pectoralis-major-upper-right": "Upper Pec (R)",
  "pectoralis-major-lower-left": "Lower Pec (L)",
  "pectoralis-major-lower-right": "Lower Pec (R)",
  "serratus-left": "Serratus (L)",
  "serratus-right": "Serratus (R)",
  "external-oblique-left": "Oblique (L)",
  "external-oblique-right": "Oblique (R)",
  "rectus-abdominis-upper-left": "Upper Ab (L)",
  "rectus-abdominis-upper-right": "Upper Ab (R)",
  "rectus-abdominis-middle-left": "Mid Ab (L)",
  "rectus-abdominis-middle-right": "Mid Ab (R)",
  "rectus-abdominis-lower-left": "Lower Ab (L)",
  "rectus-abdominis-lower-right": "Lower Ab (R)",
  "biceps-left": "Biceps (L)",
  "biceps-right": "Biceps (R)",
  "brachialis-left": "Brachialis (L)",
  "brachialis-right": "Brachialis (R)",
  "forearm-flexors-left": "Forearm Flexors (L)",
  "forearm-flexors-right": "Forearm Flexors (R)",
  "adductors-left": "Adductor (L)",
  "adductors-right": "Adductor (R)",
  "quadriceps-outer-left": "Outer Quad (L)",
  "quadriceps-outer-right": "Outer Quad (R)",
  "quadriceps-inner-left": "Inner Quad (L)",
  "quadriceps-inner-right": "Inner Quad (R)",
  "tibialis-anterior-left": "Tibialis (L)",
  "tibialis-anterior-right": "Tibialis (R)",
  "upper-trapezius-left": "Upper Trap (L)",
  "upper-trapezius-right": "Upper Trap (R)",
  "middle-trapezius-left": "Mid Trap (L)",
  "middle-trapezius-right": "Mid Trap (R)",
  "lower-trapezius-left": "Lower Trap (L)",
  "lower-trapezius-right": "Lower Trap (R)",
  "rear-deltoid-left": "Rear Delt (L)",
  "rear-deltoid-right": "Rear Delt (R)",
  "teres-major-left": "Teres Major (L)",
  "teres-major-right": "Teres Major (R)",
  "rhomboid-left": "Rhomboid (L)",
  "rhomboid-right": "Rhomboid (R)",
  "latissimus-left": "Lat (L)",
  "latissimus-right": "Lat (R)",
  "triceps-long-head-left": "Triceps Long (L)",
  "triceps-long-head-right": "Triceps Long (R)",
  "triceps-lateral-head-left": "Triceps Lateral (L)",
  "triceps-lateral-head-right": "Triceps Lateral (R)",
  "erector-spinae-left": "Erector Spinae (L)",
  "erector-spinae-right": "Erector Spinae (R)",
  "glute-max-left": "Glute Max (L)",
  "glute-max-right": "Glute Max (R)",
  "glute-med-left": "Glute Med (L)",
  "glute-med-right": "Glute Med (R)",
  "hamstring-inner-left": "Inner Hamstring (L)",
  "hamstring-inner-right": "Inner Hamstring (R)",
  "hamstring-outer-left": "Outer Hamstring (L)",
  "hamstring-outer-right": "Outer Hamstring (R)",
  "gastrocnemius-inner-left": "Inner Calf (L)",
  "gastrocnemius-inner-right": "Inner Calf (R)",
  "gastrocnemius-outer-left": "Outer Calf (L)",
  "gastrocnemius-outer-right": "Outer Calf (R)",
  "soleus-left": "Soleus (L)",
  "soleus-right": "Soleus (R)",
  neck: "Neck",
  upperChest: "Upper Chest",
  middleChest: "Middle Chest",
  lowerChest: "Lower Chest",
  frontDelts: "Front Delts",
  sideDelts: "Side Delts",
  biceps: "Biceps",
  forearms: "Forearms",
  upperAbs: "Upper Abs",
  lowerAbs: "Lower Abs",
  obliques: "Obliques",
  hipFlexors: "Hip Flexors",
  quads: "Quads",
  innerThighs: "Inner Thighs",
  calves: "Calves",
  tibialis: "Tibialis",
  upperTraps: "Upper Traps",
  middleTraps: "Mid Traps",
  lowerTraps: "Lower Traps",
  rearDelts: "Rear Delts",
  lats: "Lats",
  midBack: "Mid Back",
  lowerBack: "Lower Back",
  triceps: "Triceps",
  forearmsBack: "Forearms",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  calvesBack: "Calves",
};

const EXERCISE_MUSCLE_CONTRIBUTION = {
  "Flat Barbell Bench Press": [
    { id: "upperChest", pct: 0.25 },
    { id: "middleChest", pct: 0.3 },
    { id: "lowerChest", pct: 0.15 },
    { id: "frontDelts", pct: 0.2 },
    { id: "triceps", pct: 0.1 },
  ],
  "Incline Dumbbell Press": [
    { id: "upperChest", pct: 0.4 },
    { id: "middleChest", pct: 0.2 },
    { id: "frontDelts", pct: 0.25 },
    { id: "triceps", pct: 0.15 },
  ],
  "Landmine Press": [
    { id: "frontDelts", pct: 0.35 },
    { id: "sideDelts", pct: 0.2 },
    { id: "triceps", pct: 0.25 },
    { id: "upperChest", pct: 0.2 },
  ],
  "Cable Lateral Raise": [
    { id: "sideDelts", pct: 0.8 },
    { id: "frontDelts", pct: 0.2 },
  ],
  "Cable Overhead Tricep Extension": [{ id: "triceps", pct: 1.0 }],
  "Tricep Rope Pushdown": [{ id: "triceps", pct: 1.0 }],
  "Conventional Deadlift": [
    { id: "hamstrings", pct: 0.25 },
    { id: "glutes", pct: 0.2 },
    { id: "lowerBack", pct: 0.15 },
    { id: "midBack", pct: 0.1 },
    { id: "lats", pct: 0.1 },
    { id: "forearmsBack", pct: 0.1 },
    { id: "quads", pct: 0.1 },
  ],
  "Weighted Pull-Up / Lat Pulldown": [
    { id: "lats", pct: 0.4 },
    { id: "midBack", pct: 0.15 },
    { id: "lowerTraps", pct: 0.1 },
    { id: "biceps", pct: 0.2 },
    { id: "rearDelts", pct: 0.15 },
  ],
  "Chest-Supported Dumbbell Row": [
    { id: "midBack", pct: 0.3 },
    { id: "lats", pct: 0.2 },
    { id: "lowerTraps", pct: 0.15 },
    { id: "biceps", pct: 0.15 },
    { id: "rearDelts", pct: 0.2 },
  ],
  "Face Pulls": [
    { id: "rearDelts", pct: 0.5 },
    { id: "upperTraps", pct: 0.2 },
    { id: "sideDelts", pct: 0.3 },
  ],
  "Incline Dumbbell Curl": [{ id: "biceps", pct: 1.0 }],
  "Farmer's Carry": [
    { id: "forearms", pct: 0.4 },
    { id: "upperTraps", pct: 0.2 },
    { id: "quads", pct: 0.2 },
    { id: "upperAbs", pct: 0.1 },
    { id: "lowerAbs", pct: 0.1 },
  ],
  "Box Squat to Parallel": [
    { id: "quads", pct: 0.45 },
    { id: "glutes", pct: 0.25 },
    { id: "hipFlexors", pct: 0.1 },
    { id: "lowerBack", pct: 0.1 },
    { id: "upperAbs", pct: 0.1 },
  ],
  "Romanian Deadlift": [
    { id: "hamstrings", pct: 0.45 },
    { id: "glutes", pct: 0.25 },
    { id: "lowerBack", pct: 0.2 },
    { id: "midBack", pct: 0.1 },
  ],
  "Leg Press (Feet High)": [
    { id: "quads", pct: 0.5 },
    { id: "glutes", pct: 0.3 },
    { id: "hamstrings", pct: 0.2 },
  ],
  "Seated Leg Curl": [{ id: "hamstrings", pct: 1.0 }],
  "Standing Calf Raise": [{ id: "calves", pct: 1.0 }],
  "Lat Pulldown / Pull-Up": [
    { id: "lats", pct: 0.4 },
    { id: "midBack", pct: 0.15 },
    { id: "lowerTraps", pct: 0.1 },
    { id: "biceps", pct: 0.2 },
    { id: "rearDelts", pct: 0.15 },
  ],
  "Seated Cable Row": [
    { id: "midBack", pct: 0.35 },
    { id: "lats", pct: 0.2 },
    { id: "lowerTraps", pct: 0.1 },
    { id: "biceps", pct: 0.2 },
    { id: "rearDelts", pct: 0.15 },
  ],
  "Barbell Shrug": [
    { id: "upperTraps", pct: 0.8 },
    { id: "middleTraps", pct: 0.2 },
  ],
  "Hammer Curl": [
    { id: "biceps", pct: 0.6 },
    { id: "forearms", pct: 0.4 },
  ],
  "Reverse Curl": [
    { id: "forearms", pct: 0.8 },
    { id: "biceps", pct: 0.2 },
  ],
  "Romanian Deadlift (Heavy)": [
    { id: "hamstrings", pct: 0.45 },
    { id: "glutes", pct: 0.25 },
    { id: "lowerBack", pct: 0.2 },
    { id: "midBack", pct: 0.1 },
  ],
  "Seated Dumbbell Shoulder Press": [
    { id: "frontDelts", pct: 0.35 },
    { id: "sideDelts", pct: 0.25 },
    { id: "triceps", pct: 0.2 },
    { id: "upperChest", pct: 0.2 },
  ],
  "Box Squat (Light)": [
    { id: "quads", pct: 0.45 },
    { id: "glutes", pct: 0.25 },
    { id: "hipFlexors", pct: 0.1 },
    { id: "lowerBack", pct: 0.1 },
    { id: "upperAbs", pct: 0.1 },
  ],
  Dips: [
    { id: "lowerChest", pct: 0.35 },
    { id: "triceps", pct: 0.35 },
    { id: "frontDelts", pct: 0.3 },
  ],
  "Push-Ups": [
    { id: "middleChest", pct: 0.35 },
    { id: "triceps", pct: 0.25 },
    { id: "frontDelts", pct: 0.2 },
    { id: "upperAbs", pct: 0.2 },
  ],
  "Dumbbell Bench Press": [
    { id: "middleChest", pct: 0.35 },
    { id: "frontDelts", pct: 0.25 },
    { id: "triceps", pct: 0.2 },
    { id: "upperAbs", pct: 0.2 },
  ],
  "Close-Grip Bench Press": [
    { id: "triceps", pct: 0.5 },
    { id: "middleChest", pct: 0.25 },
    { id: "frontDelts", pct: 0.25 },
  ],
  "Dumbbell Pullover": [
    { id: "lats", pct: 0.5 },
    { id: "lowerChest", pct: 0.3 },
    { id: "triceps", pct: 0.2 },
  ],
  "Standing Overhead Press": [
    { id: "frontDelts", pct: 0.35 },
    { id: "sideDelts", pct: 0.25 },
    { id: "triceps", pct: 0.25 },
    { id: "upperChest", pct: 0.15 },
  ],
  "Front Raise": [
    { id: "frontDelts", pct: 0.6 },
    { id: "upperChest", pct: 0.2 },
    { id: "sideDelts", pct: 0.2 },
  ],
  "Reverse Fly": [
    { id: "rearDelts", pct: 0.6 },
    { id: "upperTraps", pct: 0.2 },
    { id: "middleTraps", pct: 0.2 },
  ],
  "Arnold Press": [
    { id: "frontDelts", pct: 0.3 },
    { id: "sideDelts", pct: 0.3 },
    { id: "triceps", pct: 0.2 },
    { id: "upperChest", pct: 0.2 },
  ],
  "Skull Crushers": [{ id: "triceps", pct: 1.0 }],
  "Preacher Curl": [{ id: "biceps", pct: 1.0 }],
  "Concentration Curl": [{ id: "biceps", pct: 1.0 }],
  "Tricep Kickback": [{ id: "triceps", pct: 1.0 }],
  "Barbell Row": [
    { id: "midBack", pct: 0.3 },
    { id: "lats", pct: 0.25 },
    { id: "lowerTraps", pct: 0.15 },
    { id: "biceps", pct: 0.15 },
    { id: "rearDelts", pct: 0.15 },
  ],
  "Chin-Ups": [
    { id: "lats", pct: 0.3 },
    { id: "midBack", pct: 0.15 },
    { id: "biceps", pct: 0.35 },
    { id: "lowerTraps", pct: 0.1 },
    { id: "rearDelts", pct: 0.1 },
  ],
  "Good Mornings": [
    { id: "hamstrings", pct: 0.35 },
    { id: "lowerBack", pct: 0.35 },
    { id: "glutes", pct: 0.3 },
  ],
  "Back Extension": [
    { id: "lowerBack", pct: 0.5 },
    { id: "glutes", pct: 0.25 },
    { id: "hamstrings", pct: 0.25 },
  ],
  "Front Squat": [
    { id: "quads", pct: 0.5 },
    { id: "glutes", pct: 0.2 },
    { id: "upperAbs", pct: 0.15 },
    { id: "lowerBack", pct: 0.15 },
  ],
  "Hip Thrust": [
    { id: "glutes", pct: 0.7 },
    { id: "hamstrings", pct: 0.3 },
  ],
  "Bulgarian Split Squat": [
    { id: "quads", pct: 0.45 },
    { id: "glutes", pct: 0.35 },
    { id: "hamstrings", pct: 0.1 },
    { id: "innerThighs", pct: 0.1 },
  ],
  Lunges: [
    { id: "quads", pct: 0.4 },
    { id: "glutes", pct: 0.25 },
    { id: "hamstrings", pct: 0.2 },
    { id: "calves", pct: 0.15 },
  ],
  "Glute Bridge": [
    { id: "glutes", pct: 0.65 },
    { id: "hamstrings", pct: 0.25 },
    { id: "lowerBack", pct: 0.1 },
  ],
  Planks: [
    { id: "upperAbs", pct: 0.4 },
    { id: "lowerAbs", pct: 0.3 },
    { id: "obliques", pct: 0.2 },
    { id: "hipFlexors", pct: 0.1 },
  ],
  "Hanging Leg Raise": [
    { id: "lowerAbs", pct: 0.45 },
    { id: "upperAbs", pct: 0.25 },
    { id: "hipFlexors", pct: 0.2 },
    { id: "obliques", pct: 0.1 },
  ],
  "Cable Crunch": [
    { id: "upperAbs", pct: 0.6 },
    { id: "lowerAbs", pct: 0.4 },
  ],
  "Pallof Press": [
    { id: "obliques", pct: 0.7 },
    { id: "upperAbs", pct: 0.3 },
  ],
};

// Legacy mapping for exercises not in EXERCISE_MUSCLE_CONTRIBUTION
const MUSCLE_MAP = {
  "Flat Barbell Bench Press": ["upperChest", "middleChest", "lowerChest", "frontDelts", "triceps"],
  "Incline Dumbbell Press": ["upperChest", "middleChest", "frontDelts", "triceps"],
  "Landmine Press": ["frontDelts", "sideDelts", "triceps", "upperChest"],
  "Cable Lateral Raise": ["sideDelts", "frontDelts"],
  "Cable Overhead Tricep Extension": ["triceps"],
  "Tricep Rope Pushdown": ["triceps"],
  "Conventional Deadlift": ["hamstrings", "glutes", "lowerBack", "midBack", "lats", "forearmsBack", "quads"],
  "Weighted Pull-Up / Lat Pulldown": ["lats", "midBack", "lowerTraps", "biceps", "rearDelts"],
  "Chest-Supported Dumbbell Row": ["midBack", "lats", "lowerTraps", "biceps", "rearDelts"],
  "Face Pulls": ["rearDelts", "upperTraps", "sideDelts"],
  "Incline Dumbbell Curl": ["biceps"],
  "Farmer's Carry": ["forearms", "upperTraps", "quads", "upperAbs", "lowerAbs"],
  "Box Squat to Parallel": ["quads", "glutes", "hipFlexors", "lowerBack", "upperAbs"],
  "Romanian Deadlift": ["hamstrings", "glutes", "lowerBack", "midBack"],
  "Leg Press (Feet High)": ["quads", "glutes", "hamstrings"],
  "Seated Leg Curl": ["hamstrings"],
  "Standing Calf Raise": ["calves"],
  "Lat Pulldown / Pull-Up": ["lats", "midBack", "lowerTraps", "biceps", "rearDelts"],
  "Seated Cable Row": ["midBack", "lats", "lowerTraps", "biceps", "rearDelts"],
  "Barbell Shrug": ["upperTraps", "middleTraps"],
  "Hammer Curl": ["biceps", "forearms"],
  "Reverse Curl": ["forearms", "biceps"],
  "Romanian Deadlift (Heavy)": ["hamstrings", "glutes", "lowerBack", "midBack"],
  "Seated Dumbbell Shoulder Press": ["frontDelts", "sideDelts", "triceps", "upperChest"],
  "Box Squat (Light)": ["quads", "glutes", "hipFlexors", "lowerBack", "upperAbs"],
  Dips: ["lowerChest", "triceps", "frontDelts"],
  "Push-Ups": ["middleChest", "triceps", "frontDelts", "upperAbs"],
  "Dumbbell Bench Press": ["middleChest", "frontDelts", "triceps", "upperAbs"],
  "Close-Grip Bench Press": ["triceps", "middleChest", "frontDelts"],
  "Dumbbell Pullover": ["lats", "lowerChest", "triceps"],
  "Standing Overhead Press": ["frontDelts", "sideDelts", "triceps", "upperChest"],
  "Front Raise": ["frontDelts", "upperChest", "sideDelts"],
  "Reverse Fly": ["rearDelts", "upperTraps", "middleTraps"],
  "Arnold Press": ["frontDelts", "sideDelts", "triceps", "upperChest"],
  "Skull Crushers": ["triceps"],
  "Preacher Curl": ["biceps"],
  "Concentration Curl": ["biceps"],
  "Tricep Kickback": ["triceps"],
  "Barbell Row": ["midBack", "lats", "lowerTraps", "biceps", "rearDelts"],
  "Chin-Ups": ["lats", "midBack", "biceps", "lowerTraps", "rearDelts"],
  "Good Mornings": ["hamstrings", "lowerBack", "glutes"],
  "Back Extension": ["lowerBack", "glutes", "hamstrings"],
  "Front Squat": ["quads", "glutes", "upperAbs", "lowerBack"],
  "Hip Thrust": ["glutes", "hamstrings"],
  "Bulgarian Split Squat": ["quads", "glutes", "hamstrings", "innerThighs"],
  Lunges: ["quads", "glutes", "hamstrings", "calves"],
  "Glute Bridge": ["glutes", "hamstrings", "lowerBack"],
  Planks: ["upperAbs", "lowerAbs", "obliques", "hipFlexors"],
  "Hanging Leg Raise": ["lowerAbs", "upperAbs", "hipFlexors", "obliques"],
  "Cable Crunch": ["upperAbs", "lowerAbs"],
  "Pallof Press": ["obliques", "upperAbs"],
};

// ===== STATE =====
function loadState() {
  const fallback = {
    sessions: [],
    dailyLogs: {},
    planOffset: 0,
    recoveryLog: [],
    bodyGoal: "recomp",
    calorieTarget: CAL_GOAL,
    fatTarget: FAT_GOAL,
    proteinGoal: PROTEIN_GOAL,
    waterGoal: WATER_TARGET,
    user: null,
    plan: null,
    weightLog: [],
    goals: [],
    weightGoal: null,
    goalCenter: null,
    onboardingComplete: false,
    onboardingData: { name: "", age: "", gender: "", height: "", weight: "", goalType: "", experience: "", trainingDays: 3, equipment: "", equipmentDetails: [], injuries: [], injuryNotes: "", nutritionCal: "", nutritionProtein: "", dietPreference: "none", supplements: [], metrics: {}, targetWeight: "", targetDate: "", primaryLift: "" },
    coachActivated: false,
    activatedAt: null,
    first7Days: { day1Workout: false, day2Weight: false, day3Protein: false, day4Learning: false, day5Challenge: false, day6CoachScore: false, day7Report: false },
    restTimer: 90,
    weightUnit: "kg",
    heightUnit: "cm",
    weightInc: 1,
    repInc: 1,
    autoRest: false,
    autoNext: false,
    focusMode: false,
    screenAwake: false,
    warmupStyle: "simple",
    theme: "Dark",
    accent: "Green",
    fontSize: "Medium",
    compactMode: false,
    photos: [],
    measurements: [],
    weightReminder: false,
    nutritionReminder: false,
    weeklyReview: true,
    profileBannerDismissed: false,
    autoWarmup: true,
    warmupReminder: true,
    stretchReminder: true,
    autoSummary: true,
    autoCooldown: true,
    coolDownDuration: 5,
    showTomorrowPreview: true,
    showWorkoutProgress: true,
    recoveryAnalysis: true,
    workoutStreak: { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null },
    heroDismissed: false,
    quickStartDismissed: false,
    quickStartProgress: {},
    customExercises: [],
  };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const loaded = { ...fallback, ...stored };
    if (stored && stored.workoutStreak) loaded.workoutStreak = { ...fallback.workoutStreak, ...stored.workoutStreak };
    // Migrate legacy wl_bodylog to state.weightLog
    if (!loaded.weightLog || !loaded.weightLog.length) {
      try {
        const legacy = JSON.parse(localStorage.getItem("wl_bodylog"));
        if (legacy && legacy.length) loaded.weightLog = legacy;
      } catch {}
    }
    // Migrate legacy workoutGroups: flatten into plan
    if (loaded.workoutGroups && loaded.workoutGroups.length && Array.isArray(loaded.plan)) {
      const groupWids = new Set();
      for (const g of loaded.workoutGroups) {
        if (g.workoutIds) g.workoutIds.forEach((id) => groupWids.add(id));
      }
      // Remove any workouts that are already in a group (they were already shown in the group)
      // We do NOT remove them; groups just organized existing workouts visually.
      // All workouts remain in the plan. Groups are simply discarded.
      delete loaded.workoutGroups;
    }
    // Migrate weightGoal from existing user data
    if (!loaded.weightGoal) {
      const u = loaded.user;
      if (u && u.targetWeight) {
        const log = (loaded.weightLog || []).slice().sort((a, b) => a.date.localeCompare(b.date));
        const firstWeight = log.length > 0 ? log[0].weight : (u.weight || 0);
        if (firstWeight > 0 && u.targetWeight > 0) {
          loaded.weightGoal = {
            startWeight: firstWeight,
            targetWeight: u.targetWeight,
            goalType: mapGoalType(u.goal || loaded.bodyGoal || ""),
            createdAt: new Date().toISOString(),
          };
        }
      }
    }

    // Migrate GoalCenter data into unified state
    if (!loaded.goalCenter) {
      try {
        const gcRaw = localStorage.getItem("ironlog_goal_center");
        if (gcRaw) {
          const gcData = JSON.parse(gcRaw);
          if (gcData && gcData.goalType) loaded.goalCenter = gcData;
        }
      } catch (e) { /* ignore stale GoalCenter key */ }
    }

    // Migrate onboarding-engine.js data into unified state
    if (!loaded.onboardingComplete) {
      try {
        const obRaw = localStorage.getItem("ironlog_onboarding");
        if (obRaw) {
          const obData = JSON.parse(obRaw);
          if (obData) {
            if (obData.completed) loaded.onboardingComplete = obData.completed;
            if (obData.data) loaded.onboardingData = { ...loaded.onboardingData, ...obData.data };
            if (obData.coachActivated) loaded.coachActivated = obData.coachActivated;
            if (obData.activatedAt) loaded.activatedAt = obData.activatedAt;
            if (obData.first7Days) loaded.first7Days = { ...loaded.first7Days, ...obData.first7Days };
          }
        }
      } catch (e) { /* ignore stale onboarding key */ }
    }

    return loaded;
  } catch {
    return fallback;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22) {
      showToast("Storage full. Free up space or export data to save.");
    } else {
      showToast("Could not save data. Try again.");
    }
  }
}
function saveAndRender() {
  saveState();
  render();
}

function getTodaySession() {
  return state.sessions.find((item) => item.dateKey === getDateKey() && !item.finishedAt) || null;
}

function startSessionForWorkout(workoutId) {
  const today = getDateKey();
  const existing = state.sessions.find((item) => item.dateKey === today && !item.finishedAt);
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === workoutId);
  if (!workout) {
    return getTodaySession() || existing;
  }
  if (existing && existing.workoutId === workoutId) {
    return existing;
  }
  const session = {
    id: crypto.randomUUID(),
    dateKey: today,
    startedAt: new Date().toISOString(),
    workoutId: workout.id,
    workoutName: workout.name,
    exercises: workout.exercises.map((exercise) => {
      const setCount = typeof exercise.sets === "number" ? exercise.sets : 3;
      return {
        name: exercise.name,
        sets: Array.from({ length: setCount }, () => ({
          id: crypto.randomUUID(),
          reps: exercise.reps || 8,
          weight: "",
          done: false,
          isWarmup: false,
          notes: "",
          label: "",
          loggedAt: null,
        })),
      };
    }),
  };
  state.sessions = state.sessions.filter((item) => item.dateKey !== today);
  state.sessions.unshift(session);
  saveState();
  return session;
}

function getPlannedWorkout() {
  const activePlan = loadCustomProgram() || plan;
  return activePlan[state.planOffset % activePlan.length];
}

function getCompletion(session) {
  const sets = session.exercises.flatMap((ex) => ex.sets);
  const done = sets.filter((set) => set.done).length;
  return { done, total: sets.length, percent: sets.length ? Math.round((done / sets.length) * 100) : 0 };
}

// ===== PR SYSTEM (moved to js/data/prs.js) =====
// Legacy: kept for backward compat
function calc1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0;
  const w = Number(weight);
  const r = Number(reps);
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30));
}

function getExerciseVolumeSets(session, exName) {
  const ex = session.exercises.find((e) => e.name === exName);
  if (!ex) return { sets: 0, reps: 0, volume: 0 };
  let sets = 0,
    reps = 0,
    volume = 0;
  for (const s of ex.sets) {
    if (s.isWarmup) continue;
    if (s.done && Number(s.weight) > 0) {
      sets++;
      reps += Number(s.reps) || 0;
      volume += Number(s.weight) * (Number(s.reps) || 0);
    }
  }
  return { sets, reps, volume };
}

function getLifetimeVolume(exName) {
  let totalVolume = 0,
    totalSets = 0,
    totalReps = 0;
  for (const s of state.sessions) {
    const v = getExerciseVolumeSets(s, exName);
    totalVolume += v.volume;
    totalSets += v.sets;
    totalReps += v.reps;
  }
  return { volume: totalVolume, sets: totalSets, reps: totalReps };
}

function getExerciseHistory(exName) {
  const history = [];
  for (const s of state.sessions.filter((s) => s.finishedAt)) {
    const ex = s.exercises.find((e) => e.name === exName);
    if (!ex) continue;
    const done = ex.sets.filter((st) => st.done && !st.isWarmup && Number(st.weight) > 0);
    if (done.length === 0) continue;
    const bestWeight = Math.max(...done.map((st) => Number(st.weight)));
    const bestSet = done.reduce((a, b) => (Number(a.weight) * Number(a.reps) > Number(b.weight) * Number(b.reps) ? a : b), done[0]);
    history.push({
      date: s.dateKey,
      workoutName: s.workoutName,
      sets: done.length,
      totalReps: done.reduce((sum, st) => sum + (Number(st.reps) || 0), 0),
      totalVolume: done.reduce((sum, st) => sum + Number(st.weight) * (Number(st.reps) || 0), 0),
      bestWeight,
      bestVolumeSet: Number(bestSet.weight) * Number(bestSet.reps),
      est1RM: calc1RM(bestSet.weight, bestSet.reps),
    });
  }
  return history.sort((a, b) => a.date.localeCompare(b.date));
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

// ===== DATA LOADERS =====
function loadMeals(dateKey) {
  try {
    return JSON.parse(localStorage.getItem(`wl_meals_${dateKey}`)) || [];
  } catch {
    return [];
  }
}
function saveMeals(dateKey, meals) {
  try {
    localStorage.setItem(`wl_meals_${dateKey}`, JSON.stringify(meals));
  } catch {}
  syncDailyLogs(dateKey);
}

function syncDailyLogs(dateKey) {
  const meals = loadMeals(dateKey);
  const totals = { protein: 0, carbs: 0, fat: 0, cal: 0 };
  meals.forEach((m) => {
    totals.protein += Number(m.protein) || 0;
    totals.carbs += Number(m.carbs) || 0;
    totals.fat += Number(m.fat) || 0;
    totals.cal += Number(m.cal) || 0;
  });
  if (!state.dailyLogs) state.dailyLogs = {};
  state.dailyLogs[dateKey] = { protein: totals.protein, carbs: totals.carbs, fat: totals.fat, cal: totals.cal };
  saveState();
}

function loadWater(dateKey) {
  try {
    return Number(localStorage.getItem(`wl_water_${dateKey}`)) || 0;
  } catch {
    return 0;
  }
}
function saveWater(dateKey, ml) {
  try {
    localStorage.setItem(`wl_water_${dateKey}`, String(ml));
  } catch {}
}

function loadBodyLog() {
  return state.weightLog || [];
}
function saveBodyLogEntry(entry) {
  if (!state.weightLog) state.weightLog = [];
  const idx = state.weightLog.findIndex((e) => e.date === entry.date);
  if (idx >= 0) state.weightLog[idx] = entry;
  else state.weightLog.push(entry);
  saveState();
}

function loadCustomProgram() {
  if (state.plan) return state.plan;
  try {
    return JSON.parse(localStorage.getItem("wl_custom_program"));
  } catch {
    return null;
  }
}

function loadFavoriteMeals() {
  try {
    return JSON.parse(localStorage.getItem("wl_fav_meals")) || [];
  } catch {
    return [];
  }
}

function loadRecentFoods() {
  try {
    return JSON.parse(localStorage.getItem("wl_recent_foods")) || [];
  } catch {
    return [];
  }
}
function saveRecentFoods(name) {
  const list = loadRecentFoods();
  const filtered = list.filter((f) => f !== name);
  filtered.unshift(name);
  try {
    localStorage.setItem("wl_recent_foods", JSON.stringify(filtered.slice(0, 8)));
  } catch {}
}

function collectWaterLog() {
  const log = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wl_water_")) {
        log[key] = localStorage.getItem(key);
      }
    }
  } catch {}
  return log;
}

function collectMealLog() {
  const log = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wl_meals_")) {
        log[key] = localStorage.getItem(key);
      }
    }
  } catch {}
  return log;
}

function loadLearningProgress() {
  try {
    return JSON.parse(localStorage.getItem("ironlog_learning_progress")) || { completed: [] };
  } catch {
    return { completed: [] };
  }
}

function getDailyMacros(dateKey) {
  const meals = loadMeals(dateKey || getDateKey());
  const totals = { protein: 0, carbs: 0, fat: 0, cal: 0, meals: meals.length };
  meals.forEach((m) => {
    totals.protein += Number(m.protein) || 0;
    totals.carbs += Number(m.carbs) || 0;
    totals.fat += Number(m.fat) || 0;
    totals.cal += Number(m.cal) || 0;
  });
  return totals;
}

function addMealEntry(dateKey, meal) {
  const meals = loadMeals(dateKey);
  meals.push({ food: meal.food, qty: meal.qty || 1, protein: Number(meal.protein) || 0, carbs: Number(meal.carbs) || 0, fat: Number(meal.fat) || 0, cal: Number(meal.cal) || 0 });
  saveMeals(dateKey, meals);
}

function removeMealEntry(dateKey, index) {
  const meals = loadMeals(dateKey);
  if (index >= 0 && index < meals.length) {
    meals.splice(index, 1);
    saveMeals(dateKey, meals);
  }
}

function getTodayWater() {
  return loadWater(getDateKey());
}

function addWater(ml) {
  const today = getDateKey();
  const current = loadWater(today);
  saveWater(today, current + ml);
}

function renderMealLogger() {
  const today = getDateKey();
  const meals = loadMeals(today);
  const macros = getDailyMacros(today);
  const recent = loadRecentFoods();
  const favs = loadFavoriteMeals();
  let html = `
    <div class="bottom-sheet-overlay" id="mealLoggerOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:flex-end;justify-content:center">
      <div class="bottom-sheet" style="background:var(--surface-2);border-radius:16px 16px 0 0;width:100%;max-width:500px;max-height:85vh;overflow-y:auto;padding:1.25rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <div style="font-weight:600;font-size:1rem">Meal Logger</div>
          <button id="mlClose" style="background:none;border:none;color:var(--text-secondary);font-size:1.25rem;cursor:pointer">✕</button>
        </div>
        <div style="margin-bottom:1rem;display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;text-align:center;font-size:0.75rem">
          <div><div style="color:var(--accent);font-weight:600;font-size:1rem">${Math.round(macros.cal)}</div><div style="color:var(--text-secondary)">Cal</div></div>
          <div><div style="color:#ff6b6b;font-weight:600;font-size:1rem">${Math.round(macros.protein)}g</div><div style="color:var(--text-secondary)">Protein</div></div>
          <div><div style="color:#ffd43b;font-weight:600;font-size:1rem">${Math.round(macros.carbs)}g</div><div style="color:var(--text-secondary)">Carbs</div></div>
          <div><div style="color:#69db7c;font-weight:600;font-size:1rem">${Math.round(macros.fat)}g</div><div style="color:var(--text-secondary)">Fat</div></div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
          <input id="mlFood" placeholder="Food name" style="flex:1;background:var(--surface-3);border:none;border-radius:8px;padding:0.6rem 0.75rem;color:var(--text);font-size:0.875rem">
          <input id="mlCal" placeholder="Cal" type="number" style="width:60px;background:var(--surface-3);border:none;border-radius:8px;padding:0.6rem;color:var(--text);font-size:0.875rem;text-align:center">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-bottom:1rem">
          <input id="mlProtein" placeholder="P" type="number" style="background:var(--surface-3);border:none;border-radius:8px;padding:0.5rem;color:var(--text);font-size:0.75rem;text-align:center">
          <input id="mlCarbs" placeholder="C" type="number" style="background:var(--surface-3);border:none;border-radius:8px;padding:0.5rem;color:var(--text);font-size:0.75rem;text-align:center">
          <input id="mlFat" placeholder="F" type="number" style="background:var(--surface-3);border:none;border-radius:8px;padding:0.5rem;color:var(--text);font-size:0.75rem;text-align:center">
        </div>
        <button id="mlSaveBtn" style="width:100%;background:var(--accent);color:#000;border:none;border-radius:8px;padding:0.6rem;font-weight:600;cursor:pointer;margin-bottom:1rem">Add Food</button>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.5rem">Recent Foods</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1rem">
          ${recent.slice(0, 6).map((f) => `<button class="ml-recent-btn" data-food="${f}" style="background:var(--surface-3);border:none;border-radius:16px;padding:0.35rem 0.7rem;color:var(--text-secondary);font-size:0.75rem;cursor:pointer">${f}</button>`).join("")}
        </div>`;
  if (meals.length > 0) {
    html += `<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.5rem">Today's Meals</div>`;
    meals.forEach((m, i) => {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;border-bottom:1px solid var(--border);font-size:0.8rem">
        <span>${m.food} <span style="color:var(--text-secondary)">(${m.qty || 1}x)</span></span>
        <span><span style="color:var(--text-secondary)">${Math.round(m.cal || 0)}cal</span> <button class="ml-remove-btn" data-index="${i}" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:0.75rem">✕</button></span>
      </div>`;
    });
  }
  html += `</div></div>`;
  const el = document.createElement("div");
  el.id = "mealLoggerWrap";
  el.innerHTML = html;
  document.body.appendChild(el);
  document.getElementById("mlClose").onclick = () => { el.remove(); renderHome(); };
  document.getElementById("mlSaveBtn").onclick = () => {
    const food = document.getElementById("mlFood").value.trim();
    if (!food) return;
    const meal = { food, qty: 1, protein: document.getElementById("mlProtein").value, carbs: document.getElementById("mlCarbs").value, fat: document.getElementById("mlFat").value, cal: document.getElementById("mlCal").value };
    addMealEntry(today, meal);
    saveRecentFoods(food);
    el.remove();
    renderHome();
  };
  el.querySelectorAll(".ml-recent-btn").forEach((b) => {
    b.onclick = () => {
      document.getElementById("mlFood").value = b.dataset.food;
      document.getElementById("mlFood").focus();
    };
  });
  el.querySelectorAll(".ml-remove-btn").forEach((b) => {
    b.onclick = () => {
      removeMealEntry(today, parseInt(b.dataset.index));
      el.remove();
      renderMealLogger();
    };
  });
}

// ===== MUSCLE COMPUTATION =====
// ===== MUSCLE COMPUTATION =====
let bodyMapCache = null;
let bodyMapMode = "weekly";
let weightChartInstance = null;

function computeMuscleSummary(mode) {
  const summary = {};
  MUSCLE_GROUPS.forEach((mg) => {
    summary[mg.id] = { weeklySets: 0, weeklyVolume: 0, weeklyStimulus: 0, lastTrained: null, exercises: [], doneToday: false };
  });
  const todayKey = getDateKey();
  const cutoff = mode === "today" ? todayKey : mode === "month" ? getDateKey(new Date(Date.now() - 28 * 86400000)) : getDateKey(new Date(Date.now() - 7 * 86400000));
  const sessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= cutoff);

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const contributions = EXERCISE_MUSCLE_CONTRIBUTION[ex.name];
      if (!contributions) continue;
      const doneSets = ex.sets.filter((s) => s.done && !s.isWarmup);
      if (doneSets.length === 0) continue;
      const setCount = doneSets.length;
      const totalStimulus = doneSets.reduce((sum, s) => sum + (Number(s.weight) || 0) * Math.max(s.reps || 1, 1), 0);
      for (const contrib of contributions) {
        const m = summary[contrib.id];
        if (!m) continue;
        m.weeklySets += setCount;
        m.weeklyVolume += totalStimulus * contrib.pct;
        m.weeklyStimulus += setCount * contrib.pct;
        if (!m.exercises.includes(ex.name)) m.exercises.push(ex.name);
        if (!m.lastTrained || session.dateKey > m.lastTrained) m.lastTrained = session.dateKey;
        if (session.dateKey === todayKey) m.doneToday = true;
      }
    }
  }
  bodyMapCache = { summary, computedAt: Date.now(), mode };
  return summary;
}

function getRecoveryDays(lastTrained) {
  if (!lastTrained) return 99;
  const today = new Date();
  const trained = parseDateKey(lastTrained);
  return Math.floor((today - trained) / 86400000);
}

function getRecoveryLevel(daysAgo, weeklySets) {
  const heavy = (weeklySets || 0) >= 20;
  if (daysAgo === 0 || (daysAgo <= 1 && heavy)) return "fatigued";
  if (daysAgo <= 1) return "fatigued";
  if (daysAgo <= 3) return "recovering";
  return "recovered";
}

// ===== CALENDAR STATE =====
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

// ===== REST TIMER =====
let restTimerInterval = null;
let restTimerSeconds = 0;

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
  try { navigator.vibrate(500); } catch {}
}

function startRestTimer() {
  clearInterval(restTimerInterval);
  restTimerSeconds = state.restTimer || DEFAULT_REST;
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
      playBeep();
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
  const total = state.restTimer || DEFAULT_REST;
  const pct = restTimerSeconds / total;
  const circumference = 188.5;
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
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  }
  const session = getTodaySession();
  if (!session) return;
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
function getStreak() {
  const sessions = state.sessions.filter((s) => s.finishedAt);
  let streak = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sessions.find((s) => s.dateKey === getDateKey(d))) streak++;
    else break;
  }
  return streak;
}

function updateStreak() {
  const streak = getStreak();
  const badge = document.getElementById("streakBadge");
  if (badge) badge.textContent = streak > 0 ? `${streak} day streak` : "";
}

function openStreakDrawer() {
  const streak = getStreak();
  const longest = getLongestStreak();
  const today = new Date();
  let daysHtml = "";
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dk = getDateKey(d);
    const dayName = d.toLocaleDateString("en", { weekday: "short" });
    const hasSession = state.sessions.some((s) => s.finishedAt && s.dateKey === dk);
    daysHtml += `<div class="sd-day${hasSession ? " is-done" : ""}">${dayName}${hasSession ? " ✓" : ""}</div>`;
  }
  document.getElementById("sdCurrent").textContent = `Current Streak: ${streak} Day${streak !== 1 ? "s" : ""}`;
  document.getElementById("sdDays").innerHTML = daysHtml;
  document.getElementById("sdLongest").textContent = `Longest Streak: ${longest} Days`;
  document.getElementById("streakDrawer").classList.remove("is-hidden");
}

function getLongestStreak() {
  const sessions = state.sessions.filter((s) => s.finishedAt).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (!sessions.length) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sessions.length; i++) {
    const prev = new Date(sessions[i - 1].dateKey);
    const curr = new Date(sessions[i].dateKey);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

function getMonthlyStats(month, year) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const sessions = state.sessions.filter((s) => s.finishedAt && s.dateKey.startsWith(prefix));
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const daysSoFar = Math.min(today.getDate(), totalDays);
  const completionRate = daysSoFar > 0 ? Math.round((sessions.length / daysSoFar) * 100) : 0;
  return { count: sessions.length, completionRate, totalDays, daysSoFar };
}

// ===== SETTINGS =====
// ===== SETTINGS RENDER =====
function renderSettings() {
  const u = state.user || {};
  const bmi = u.height && u.weight ? (u.weight / ((u.height / 100) * (u.height / 100))).toFixed(1) : null;
  const bmiCat = bmi ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese") : null;
  const goalLabels = {
    "fat-loss": "Fat Loss",
    "build-muscle": "Build Muscle",
    recomp: "Recomp",
    strength: "Strength",
    athletic: "Athletic",
    general: "Fitness",
    custom: "Custom",
  };
  const sgGoal = GoalCenter.getGoalType();
  const mCals = u.weight
    ? Math.round(
        u.weight *
          (u.activity === "sedentary" ? 24 : u.activity === "light" ? 26.5 : u.activity === "moderate" ? 29 : u.activity === "very" ? 31.5 : 34) *
          (sgGoal === "lose-fat" ? 0.8 : sgGoal === "build-muscle" || sgGoal === "strength" ? 1.1 : 1),
      )
    : "—";
  const initials = u.name
    ? u.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "IL";

  let html = `
  <!-- SECTION 1: PROFILE -->
  <div class="sg">
    <div class="sg-label">PROFILE</div>
    <button class="sg-card" data-setting="profile">
      <div class="sg-avatar" style="background:var(--accent);color:#000;font-weight:800">${initials}</div>
      <div class="sg-card-body">
        <div class="sg-card-name">${u.name || "Tap to set up"}</div>
        <div class="sg-card-meta">${[u.age ? u.age + " yrs" : "", u.height ? u.height + " cm" : "", u.weight ? displayWeight(u.weight) : "", GoalCenter.getGoalLabel()].filter(Boolean).join(" · ") || "No profile yet"}</div>
      </div>
      <span class="sg-chevron">›</span>
    </button>
    <div class="sg-stats">
      <div class="sg-stat"><span class="sg-stat-val">${u.age || "—"}</span><span class="sg-stat-lbl">Age</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${u.height ? displayHeight(u.height) : "—"}</span><span class="sg-stat-lbl">Height</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${u.weight ? displayWeight(u.weight) : "—"}</span><span class="sg-stat-lbl">Weight</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${GoalCenter.getGoalLabel()}</span><span class="sg-stat-lbl">Goal</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${bmi || "—"}</span><span class="sg-stat-lbl">BMI</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${mCals}</span><span class="sg-stat-lbl">Calories</span></div>
    </div>
    ${bmi ? '<div class="sg-bmi-bar"><div class="sg-bmi-fill" style="width:' + (bmi / 40) * 100 + "%;background:" + (bmiCat === "Underweight" ? "#4a9eff" : bmiCat === "Normal" ? "#00d26a" : bmiCat === "Overweight" ? "#ff9500" : "#ff3b30") + '"></div></div><div class="sg-bmi-labels"><span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span></div>' : ""}
    ${!isProfileComplete() ? '<button class="sg-card sg-card-cta" id="settingsCompleteProfile"><div class="sg-card-body"><div class="sg-card-name">Complete Your Profile</div><div class="sg-card-meta">Add your stats to unlock features</div></div><span class="sg-chevron">›</span></button>' : ""}
    <button class="sg-row" style="color:var(--accent)" data-setting="profile"><span>View Full Profile</span><span class="sg-chevron">›</span></button>
    <button class="sg-row" id="settingsGoalCenterBtn"><span>Goals</span><span class="sg-chevron">›</span></button>
  </div>

  <!-- SECTION 2: FITNESS GOALS -->
  <div class="sg">
    <div class="sg-label">FITNESS GOALS</div>
    <div class="sg-radio-group" data-setting="goal">
      ${["fat-loss", "recomp", "lean-bulk", "aggressive-bulk"]
        .map((g) => {
          const labels = { "fat-loss": "Fat Loss", recomp: "Recomp", "lean-bulk": "Lean Bulk", "aggressive-bulk": "Aggressive Bulk" };
          const descs = {
            "fat-loss": "Lose body fat while preserving muscle",
            recomp: "Build muscle while losing fat",
            "lean-bulk": "Gain muscle with minimal fat",
            "aggressive-bulk": "Maximize muscle gain",
          };
          const rates = { "fat-loss": "0.5–1 kg/week", recomp: "Maintenance", "lean-bulk": "0.25 kg/week", "aggressive-bulk": "0.5 kg/week" };
          const sel = (state.bodyGoal || "recomp") === g;
          return (
            '<label class="sg-radio' +
            (sel ? " is-sel" : "") +
            '"><input type="radio" name="sg-goal" value="' +
            g +
            '"' +
            (sel ? " checked" : "") +
            '><span class="sg-radio-dot"></span><span class="sg-radio-body"><span class="sg-radio-title">' +
            labels[g] +
            '</span><span class="sg-radio-desc">' +
            descs[g] +
            '</span><span class="sg-radio-rate">' +
            rates[g] +
            "</span></span></label>"
          );
        })
        .join("")}
    </div>
  </div>

  <!-- SECTION 3: CUSTOM GOALS -->
  <div class="sg">
    <div class="sg-label">CUSTOM GOALS</div>
    <div id="goalsContent"></div>
  </div>

  <!-- SECTION 4: WORKOUT -->
  <div class="sg">
    <div class="sg-label">WORKOUT</div>
    <div class="sg-row" data-setting="rest-timer"><span>Rest Timer</span><span class="sg-row-val" id="sgRestVal">${state.restTimer || 90}s</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Auto-Start Rest Timer</span><input type="checkbox" ${state.autoRest ? "checked" : ""} data-setting="auto-rest" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Auto-Open Next Exercise</span><input type="checkbox" ${state.autoNext ? "checked" : ""} data-setting="auto-next" /><span class="sg-toggle-track"></span></label>
    <div class="sg-row" data-setting="weight-inc"><span>Weight Increment</span><span class="sg-row-val">${displayWeight(state.weightInc || 1)}</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Focus Mode</span><input type="checkbox" ${state.focusMode ? "checked" : ""} data-setting="focus-mode" /><span class="sg-toggle-track"></span></label>
  </div>

  <!-- SECTION 5: NOTIFICATIONS -->
  <div class="sg">
    <div class="sg-label">NOTIFICATIONS</div>
    <label class="sg-row sg-toggle"><span>Weight Reminder</span><input type="checkbox" ${state.weightReminder ? "checked" : ""} data-setting="weight-reminder" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Nutrition Reminder</span><input type="checkbox" ${state.nutritionReminder ? "checked" : ""} data-setting="nutrition-reminder" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Weekly Review Summary</span><input type="checkbox" ${state.weeklyReview !== false ? "checked" : ""} data-setting="weekly-review" /><span class="sg-toggle-track"></span></label>
  </div>

  <!-- SECTION 6: HEALTH -->
  <div class="sg">
    <div class="sg-label">HEALTH</div>
    <div class="sg-row" data-setting="calorie-target"><span>Daily Calorie Target</span><span class="sg-row-val">${state.calorieTarget || CAL_GOAL}</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="protein-goal"><span>Daily Protein Goal</span><span class="sg-row-val">${state.proteinGoal || PROTEIN_GOAL}g</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="water-goal"><span>Daily Water Goal</span><span class="sg-row-val">${state.waterGoal || WATER_TARGET}ml</span><span class="sg-chevron">›</span></div>
  </div>

  <!-- SECTION 7: APPEARANCE -->
  <div class="sg">
    <div class="sg-label">APPEARANCE</div>
    <div class="sg-row" data-setting="theme"><span>Theme</span><span class="sg-row-val">${state.theme || "Dark"}</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="accent"><span>Accent Color</span><span class="sg-row-val" style="color:var(--accent)">${state.accent || "Green"}</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="font-size"><span>Font Size</span><span class="sg-row-val">${state.fontSize || "Medium"}</span><span class="sg-chevron">›</span></div>
  </div>

  <!-- SECTION 8: ADVANCED -->
  <div class="sg">
    <div class="sg-label">ADVANCED</div>
    <label class="sg-row sg-toggle"><span>Keep Screen Awake</span><input type="checkbox" ${state.screenAwake ? "checked" : ""} data-setting="screen-awake" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Auto Warm-Up Sets</span><input type="checkbox" ${state.autoWarmup !== false ? "checked" : ""} data-setting="auto-warmup" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Warm-Up Reminder</span><input type="checkbox" ${state.warmupReminder !== false ? "checked" : ""} data-setting="warmup-reminder" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Stretch Reminder</span><input type="checkbox" ${state.stretchReminder !== false ? "checked" : ""} data-setting="stretch-reminder" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Auto Summary After Workout</span><input type="checkbox" ${state.autoSummary !== false ? "checked" : ""} data-setting="auto-summary" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Auto Cool-Down</span><input type="checkbox" ${state.autoCooldown !== false ? "checked" : ""} data-setting="auto-cooldown" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Show Tomorrow Preview</span><input type="checkbox" ${state.showTomorrowPreview !== false ? "checked" : ""} data-setting="tomorrow-preview" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Show Workout Progress</span><input type="checkbox" ${state.showWorkoutProgress !== false ? "checked" : ""} data-setting="workout-progress" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Compact Mode</span><input type="checkbox" ${state.compactMode ? "checked" : ""} data-setting="compact-mode" /><span class="sg-toggle-track"></span></label>
  </div>

  <!-- SECTION 9: DATA & BACKUP -->
  <div class="sg">
    <div class="sg-label">DATA</div>
    <div class="sg-row" data-setting="weight-log"><span>Weight Log</span><span class="sg-row-val">${(state.weightLog || []).length} entries</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="weight-unit"><span>Weight Unit</span><span class="sg-row-val">${state.weightUnit || "kg"}</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="height-unit"><span>Height Unit</span><span class="sg-row-val">${state.heightUnit || "cm"}</span><span class="sg-chevron">›</span></div>
    <button class="sg-row" data-setting="export-json"><span>Export Data (JSON)</span><span class="sg-chevron">›</span></button>
    <button class="sg-row" data-setting="import-json"><span>Import Data (JSON)</span><span class="sg-chevron">›</span></button>
    <button class="sg-row" data-setting="restore-backup"><span>Restore Pre-Import Backup</span><span class="sg-chevron">›</span></button>
  </div>

  <!-- SECTION 10: DANGER ZONE -->
  <div class="sg sg-danger">
    <div class="sg-label" style="color:var(--error)">DANGER ZONE</div>
    <div class="sg-card sg-card-danger" onclick="document.getElementById('deleteDataModal').classList.remove('is-hidden')">
      <div class="sg-card-body">
        <div class="sg-card-name" style="color:var(--error)">Factory Reset</div>
        <div class="sg-card-meta">Permanently delete all data and start fresh</div>
      </div>
      <span class="sg-chevron" style="color:var(--error)">›</span>
    </div>
  </div>

  <!-- SECTION 7: FEEDBACK -->
  <div class="sg">
    <div class="sg-label">FEEDBACK</div>
    <button class="sg-row" data-setting="feedback-bug"><span>🐛 Report a Bug</span><span class="sg-chevron">›</span></button>
    <button class="sg-row" data-setting="feedback-feature"><span>💡 Suggest a Feature</span><span class="sg-chevron">›</span></button>
    <button class="sg-row" data-setting="feedback-general"><span>⭐ Share Feedback</span><span class="sg-chevron">›</span></button>
  </div>

  <!-- SECTION 8: ABOUT -->
  <div class="sg">
    <div class="sg-label">ABOUT</div>
    <div class="sg-row"><span>Version</span><span class="sg-row-val">2.0</span></div>
    <button class="sg-row" data-setting="about-developer"><span>About The Developer</span><span class="sg-chevron">›</span></button>
    <div class="sg-row" style="cursor:default"><span style="font-size:0.7rem;color:var(--text-secondary)">Built with ❤️</span></div>
  </div>`;

  document.getElementById("settingsContent").innerHTML = html;
  const goalsContainer = document.getElementById("goalsContent");
  if (goalsContainer) renderGoals();
}

function openDeveloperModal() {
  const modal = document.getElementById("developerModal");
  if (modal) modal.classList.remove("is-hidden");
}

function closeDeveloperModal() {
  const modal = document.getElementById("developerModal");
  if (modal) modal.classList.add("is-hidden");
}

function logWeight(weight, date, notes) {
  if (!state.weightLog) state.weightLog = [];
  const existing = state.weightLog.findIndex((e) => e.date === date);
  const entry = { weight: Number(weight), date, notes: notes || "", loggedAt: new Date().toISOString() };
  if (existing >= 0) {
    state.weightLog[existing] = entry;
  } else {
    state.weightLog.push(entry);
  }
  saveState();
  renderSettings();
  renderHome();
}

// ===== TAB SYSTEM =====
let currentTab = "today";

function activateTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  
  
  if (tabName === "settings") {
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-sets"));
  } else {
    const panelId = "panel-" + tabName;
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === panelId));
  }
  positionNavIndicator();
  if (tabName === "progress") renderProgressPage();
  if (tabName === "sessions") renderSessionsTab();
  if (tabName === "sets") renderSetsPanel();
  if (tabName === "settings") {
    showScreen("screen-settings");
    renderSettings();
  }
  if (tabName === "trainer") {
    renderTrainerTab();
  }
}

function positionNavIndicator() {
  const nav = document.getElementById("bottomNav");
  if (!nav) return;
  const active = nav.querySelector(".nav-tab.is-active");
  const indicator = document.getElementById("navIndicator");
  if (active && indicator) {
    indicator.style.left = active.offsetLeft + "px";
    indicator.style.width = active.offsetWidth + "px";
    indicator.classList.add("is-visible");
  }
}

// ===== BODY ANALYSIS / MUSCLE MAP =====
function getMuscleCoverageScore(summary) {
  const active = Object.values(summary).filter((m) => m.weeklySets > 0).length;
  return Math.round((active / Object.keys(summary).length) * 100);
}

function getMuscleStatus(weeklySets) {
  if (weeklySets === 0) return "untrained";
  if (weeklySets < 6) return "undertrained";
  if (weeklySets <= 12) return "optimal";
  if (weeklySets <= 18) return "high";
  return "overtrained";
}

function getStrengthTrend(muscleId) {
  const exercises = MUSCLE_GROUPS.filter((m) => m.id === muscleId).flatMap((m) =>
    Object.entries(EXERCISE_MUSCLE_CONTRIBUTION).filter(([, c]) => c.some((x) => x.id === m.id)).map(([name]) => name)
  );
  const allSessions = state.sessions.filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  const recentSessions = allSessions.slice(0, 6);
  const weights = [];
  for (const exName of [...new Set(exercises)]) {
    for (const s of recentSessions) {
      const ex = s.exercises.find((e) => e.name === exName);
      if (!ex) continue;
      const done = ex.sets.filter((x) => x.done && Number(x.weight) > 0);
      if (done.length === 0) continue;
      const avgWeight = done.reduce((sum, x) => sum + Number(x.weight), 0) / done.length;
      weights.push({ weight: avgWeight, reps: done[0].reps || 0, date: s.dateKey });
    }
  }
  if (weights.length < 4) return null;
  const half = Math.floor(weights.length / 2);
  const recentAvg = weights.slice(0, half).reduce((s, w) => s + w.weight, 0) / half;
  const earlierAvg = weights.slice(half).reduce((s, w) => s + w.weight, 0) / (weights.length - half);
  if (earlierAvg === 0) return null;
  return ((recentAvg - earlierAvg) / earlierAvg) * 100;
}

function getMuscleColor(muscleId, mode, summary) {
  const data = summary[muscleId];
  const sets = data ? data.weeklySets : 0;
  if (mode === "today") {
    if (data && data.doneToday) return "#00d26a";
    return "#3a3a3a";
  }
  if (mode === "weekly") {
    return getMuscleStatus(sets) === "untrained" ? "#3a3a3a"
      : getMuscleStatus(sets) === "undertrained" ? "#3b82f6"
      : getMuscleStatus(sets) === "optimal" ? "#00d26a"
      : getMuscleStatus(sets) === "high" ? "#ff9f0a"
      : "#ef4444";
  }
  if (mode === "recovery") {
    const days = data ? getRecoveryDays(data.lastTrained) : 99;
    if (days === 0) return "#ef4444";
    if (days <= 1) return "#ff9f0a";
    if (days <= 3) return "#ffd60a";
    return "#00d26a";
  }
  if (mode === "strength") {
    const trend = getStrengthTrend(muscleId);
    if (trend === null) return "#3a3a3a";
    if (trend > 2) return "#00d26a";
    if (trend > -2) return "#ffd60a";
    return "#ef4444";
  }
  return "#3a3a3a";
}

function getBodyMapColor(muscleId, mode, summary) {
  return getMuscleColor(muscleId, mode, summary);
}

function renderBodyMuscleMap(container, summary) {
  container.innerHTML = `<div class="body-map-layout"><div class="body-view">${BODY_MAP_SVG}</div></div>`;

  container.querySelectorAll("[data-muscle]").forEach((path) => {
    const detailedId = path.dataset.muscle;
    const groupId = MUSCLE_GROUP_MAP[detailedId] || detailedId;
    const data = summary[groupId];
    const sets = data ? data.weeklySets : 0;
    const color = getBodyMapColor(groupId, bodyMapMode, summary);
    const opacity = sets > 0 ? "0.85" : "0.3";
    path.setAttribute("fill", color);
    path.setAttribute("fill-opacity", opacity);
    path.style.cursor = "pointer";

    path.addEventListener("mouseenter", (e) => {
      path.style.filter = "brightness(1.3)";
      showMuscleTooltip(e, detailedId, groupId, summary);
    });
    path.addEventListener("mousemove", (e) => moveMuscleTooltip(e));
    path.addEventListener("mouseleave", () => {
      path.style.filter = "";
      hideMuscleTooltip();
    });
    path.addEventListener("click", (e) => {
      e.stopPropagation();
      showMuscleSheet(detailedId, summary);
    });
  });
}

function showMuscleTooltip(e, detailedId, groupId, summary) {
  const tip = document.getElementById("muscleTooltip");
  if (!tip) return;
  const label = MUSCLE_LABEL_MAP[detailedId] || detailedId;
  const group = MUSCLE_GROUPS.find((g) => g.id === groupId);
  const data = summary[groupId] || {};
  const days = getRecoveryDays(data.lastTrained);
  const sets = data.weeklySets || 0;
  document.getElementById("mtName").textContent = label;
  document.getElementById("mtGroup").textContent = group ? group.label : groupId;
  document.getElementById("mtSets").textContent = sets;
  document.getElementById("mtVolume").textContent = `${Math.round((data.weeklyVolume || 0) / 100) / 10 || 0}k kg`;
  document.getElementById("mtLast").textContent = data.lastTrained
    ? days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`
    : "Not trained";
  document.getElementById("mtRecovery").textContent = days === 0 ? "Just trained"
    : days <= 1 ? "Low"
    : days <= 3 ? "Recovering"
    : "Recovered";
  tip.classList.remove("is-hidden");
  moveMuscleTooltip(e);
}

function moveMuscleTooltip(e) {
  const tip = document.getElementById("muscleTooltip");
  if (!tip) return;
  let x = e.clientX + 12, y = e.clientY - 10;
  if (x + 200 > window.innerWidth) x = e.clientX - 210;
  if (y < 0) y = 10;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}

function hideMuscleTooltip() {
  const tip = document.getElementById("muscleTooltip");
  if (tip) tip.classList.add("is-hidden");
}

function showMuscleSheet(muscleId, summary) {
  const groupId = MUSCLE_GROUP_MAP[muscleId] || muscleId;
  const mg = MUSCLE_GROUPS.find((m) => m.id === groupId);
  if (!mg) return;
  const label = MUSCLE_LABEL_MAP[muscleId] || mg.label;
  const data = summary[groupId] || { weeklySets: 0, weeklyVolume: 0, lastTrained: null, exercises: [] };
  const days = getRecoveryDays(data.lastTrained);
  const trend = getStrengthTrend(groupId);
  const trendStr = trend === null ? "—" : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`;
  const trendColor = trend === null ? "#737373" : trend > 2 ? "#00d26a" : trend > -2 ? "#ffd60a" : "#ef4444";
  const lastTrainedStr = data.lastTrained
    ? days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`
    : "Not trained";
  const recColor = days === 0 ? "#ef4444" : days <= 1 ? "#ff9f0a" : days <= 3 ? "#ffd60a" : "#00d26a";

  const sheet = document.getElementById("muscleSheet");
  const body = document.getElementById("muscleSheetBody");
  body.innerHTML = `
    <div class="ms-header">${label}</div>
    <div class="ms-sub">${mg.label}</div>
    <div class="ms-grid">
      <div class="ms-item"><span class="ms-label">Weekly Sets</span><span class="ms-value">${data.weeklySets}</span></div>
      <div class="ms-item"><span class="ms-label">Volume</span><span class="ms-value">${Math.round(data.weeklyVolume / 100) / 10 || 0}k kg</span></div>
      <div class="ms-item"><span class="ms-label">Last Trained</span><span class="ms-value">${lastTrainedStr}</span></div>
      <div class="ms-item"><span class="ms-label">Recovery</span><span class="ms-value" style="color:${recColor}">${days === 0 ? "Just trained" : days <= 1 ? "Low" : days <= 3 ? "Recovering" : "Recovered"}</span></div>
      <div class="ms-item"><span class="ms-label">Strength Trend</span><span class="ms-value" style="color:${trendColor}">${trendStr}</span></div>
    </div>
    ${data.exercises.length > 0 ? `
    <div class="ms-exercises-label">Exercises</div>
    <div class="ms-exercises">${data.exercises.map((ex) =>
      `<span class="ms-ex-chip">${ex.replace(/([A-Z])/g, " $1").trim()}</span>`
    ).join("")}</div>` : ""}`;
  sheet.classList.remove("is-hidden");
}

function generateMuscleInsights(summary) {
  const insights = [];
  const coverage = getMuscleCoverageScore(summary);

  const undertrained = MUSCLE_GROUPS.filter((mg) => {
    const data = summary[mg.id];
    return data && data.weeklySets > 0 && data.weeklySets < 5;
  }).slice(0, 3);
  if (undertrained.length > 0) {
    insights.push({
      icon: "⚠️", severity: "yellow",
      text: `${undertrained.map((m) => m.label).join(", ")} ${undertrained.length === 1 ? "is" : "are"} undertrained. Currently getting <5 weekly sets. Add targeted work.`,
    });
  }

  const overtrained = MUSCLE_GROUPS.filter((mg) => {
    const data = summary[mg.id];
    return data && data.weeklySets > 18;
  }).slice(0, 3);
  if (overtrained.length > 0) {
    insights.push({
      icon: "⚠️", severity: "red",
      text: `${overtrained.map((m) => m.label).join(", ")} ${overtrained.length === 1 ? "has" : "have"} unusually high volume (>18 weekly sets). Monitor recovery.`,
    });
  }

  const neglected = MUSCLE_GROUPS.filter((mg) => {
    const data = summary[mg.id];
    return !data || data.weeklySets === 0;
  });
  if (neglected.length > 0 && coverage < 90) {
    const topNeglected = neglected.slice(0, 3);
    insights.push({
      icon: "🎯", severity: "yellow",
      text: `${topNeglected.map((m) => m.label).join(", ")} ${topNeglected.length === 1 ? "has" : "have"} received no direct training. Coverage: <strong>${coverage}%</strong>.`,
    });
  }

  const optimal = MUSCLE_GROUPS.filter((mg) => {
    const data = summary[mg.id];
    return data && data.weeklySets >= 5 && data.weeklySets <= 14;
  }).length;
  if (optimal >= 8) {
    insights.push({
      icon: "✅", severity: "green",
      text: `${optimal} muscle groups are in the optimal training range (5-14 weekly sets). Excellent balance.`,
    });
  }

  return insights;
}

function renderBodyAnalysis() {
  const container = document.getElementById("bodyAnalysis");
  const summary = computeMuscleSummary(bodyMapMode || "weekly");
  const coverageScore = getMuscleCoverageScore(summary);

  const statusLabels = { untrained: "Not trained", undertrained: "Undertrained", optimal: "Optimal", high: "High volume", overtrained: "Overtrained" };
  const modeLabels = { today: "Trained Today", weekly: "Weekly Coverage", recovery: "Recovery", strength: "Strength Trend" };

  let html = `<div class="bm-mode-row">
    ${Object.entries(modeLabels).map(([key, label]) =>
      `<button class="bm-mode-btn${bodyMapMode === key ? " is-active" : ""}" data-mode="${key}">${label}</button>`
    ).join("")}
  </div>`;

  html += `<div id="bmContainer" class="bm-container"></div>`;

  html += `<div class="bm-stats">
    <div class="bm-coverage"><span class="bm-coverage-pct">${coverageScore}%</span> Coverage</div>
    <div class="bm-trained">${Object.values(summary).filter((m) => m.weeklySets > 0).length}/${Object.keys(summary).length} trained</div>
  </div>`;

  const sorted = MUSCLE_GROUPS.map((mg) => ({
    ...mg,
    ...summary[mg.id],
    sets: summary[mg.id] ? summary[mg.id].weeklySets : 0,
  }));

  html += `<div class="bm-muscle-list">`;
  sorted.forEach((mg) => {
    const color = getBodyMapColor(mg.id, bodyMapMode, summary);
    const sets = mg.sets || 0;
    html += `<div class="bm-muscle-row" data-muscle="${mg.id}">
      <span class="bm-muscle-dot" style="background:${color};opacity:${sets > 0 ? 1 : 0.3}"></span>
      <span class="bm-muscle-name">${mg.label}</span>
      <span class="bm-muscle-sets">${sets} sets</span>
      <span class="bm-muscle-chevron">›</span>
    </div>`;
  });
  html += `</div>`;

  const insights = generateMuscleInsights(summary);
  if (insights.length > 0) {
    html += `<div class="bm-insights">`;
    insights.slice(0, 4).forEach((ins) => {
      html += `<div class="alert-item is-${ins.severity}"><span class="alert-icon">${ins.icon}</span><div class="alert-body">${ins.text}</div></div>`;
    });
    html += `</div>`;
  }

  container.innerHTML = html;

  renderBodyMuscleMap(document.getElementById("bmContainer"), summary);

  container.querySelectorAll(".bm-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      bodyMapMode = btn.dataset.mode;
      renderBodyAnalysis();
    });
  });

  container.querySelectorAll(".bm-muscle-row").forEach((row) => {
    row.addEventListener("click", () => {
      showMuscleSheet(row.dataset.muscle, summary);
    });
  });
}

// ===== BODY TAB =====
function renderWeighIn() {
  const container = document.getElementById("weighInCard");
  const log = loadBodyLog();
  const today = getDateKey();
  const entry = log.find((e) => e.date === today);
  if (entry) {
    container.innerHTML = `
      <div class="weigh-in-current">${displayWeight(entry.weight)}</div>
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
    renderProfileScreen();
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
  if (typeof Chart === "undefined") { loadChartJS().then(() => renderWeightChart()); return; }
  const ctx = canvas.getContext("2d");
  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ data, borderColor: "#00d26a", tension: 0.4, pointRadius: 2, fill: false }] },
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
      <div class="prediction-row"><span>Current</span><span>${displayWeight(avgRecent)}</span></div>
      <div class="prediction-row"><span>Target</span><span>~${displayWeight(goalWeight)}</span></div>
      <div class="prediction-row"><span>Rate</span><span>${weeklyRate > 0 ? "+" : ""}${weeklyRate} kg/week</span></div>
      ${weeksNeeded > 0 ? `<div class="prediction-highlight">Goal by ${estDate} (${Math.ceil(weeksNeeded)} weeks)</div>` : `<div class="prediction-highlight">Maintaining current phase.</div>`}
    </div>
  `;
}

function renderBodyMeasurements() {
  const container = document.getElementById("bodyMeasurementsCard");
  const bm = (state.user.bodyMeasurements || {});
  const entries = Object.entries(bm).filter(([k]) => k !== "bodyFat");
  if (!Object.keys(bm).length) {
    container.innerHTML = `<div class="stat-card"><div class="stat-label">No measurements recorded</div><div class="stat-hint">Add measurements in your profile.</div></div>`;
    return;
  }
  const labels = { bodyFat: "Body Fat", chest: "Chest", waist: "Waist", arms: "Arms", thighs: "Thighs", neck: "Neck", hips: "Hips" };
  let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`;
  Object.entries(bm).forEach(([k, v]) => {
    const label = labels[k] || k;
    const unit = k === "bodyFat" ? "%" : " cm";
    if (v) html += `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${v}${unit}</div></div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

function renderBodyTab() {
  renderWeighIn();
  renderBodyMeasurements();
  renderTrendAverages();
  renderWeightChart();
  renderGoalPrediction();
  renderBodyAnalysis();
}

function exportJSON() {
  const exportData = {
    dailyLogs: state.dailyLogs || {},
    sessions: state.sessions || [],
    user: state.user || null,
    plan: state.plan || null,
    customExercises: state.customExercises || [],
    weightLog: state.weightLog || [],
    goals: state.goals || [],
    recoveryLog: state.recoveryLog || [],
    measurements: state.measurements || [],
    photos: state.photos || [],
    bodyGoal: state.bodyGoal || "recomp",
    calorieTarget: state.calorieTarget || CAL_GOAL,
    proteinGoal: state.proteinGoal || PROTEIN_GOAL,
    waterGoal: state.waterGoal || WATER_TARGET,
    fatTarget: state.fatTarget || FAT_GOAL,
    planOffset: state.planOffset || 0,
    restTimer: state.restTimer || 90,
    weightUnit: state.weightUnit || "kg",
    heightUnit: state.heightUnit || "cm",
    weightInc: state.weightInc || 1,
    repInc: state.repInc || 1,
    autoRest: !!state.autoRest,
    autoNext: !!state.autoNext,
    focusMode: !!state.focusMode,
    screenAwake: !!state.screenAwake,
    autoWarmup: state.autoWarmup !== false,
    warmupStyle: state.warmupStyle || "simple",
    warmupReminder: state.warmupReminder !== false,
    stretchReminder: state.stretchReminder !== false,
    theme: state.theme || "Dark",
    accent: state.accent || "Green",
    fontSize: state.fontSize || "Medium",
    compactMode: !!state.compactMode,
    weightReminder: !!state.weightReminder,
    nutritionReminder: !!state.nutritionReminder,
    weeklyReview: state.weeklyReview !== false,
    recoveryAnalysis: state.recoveryAnalysis !== false,
    coolDownDuration: state.coolDownDuration || 5,
    autoSummary: state.autoSummary !== false,
    autoCooldown: state.autoCooldown !== false,
    showTomorrowPreview: state.showTomorrowPreview !== false,
    showWorkoutProgress: state.showWorkoutProgress !== false,
    profileBannerDismissed: !!state.profileBannerDismissed,
    workoutStreak: state.workoutStreak || { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null },
    first7Days: state.first7Days || { day1Workout: false, day2Weight: false, day3Protein: false, day4Learning: false, day5Challenge: false, day6CoachScore: false, day7Report: false },
    coachActivated: !!state.coachActivated,
    activatedAt: state.activatedAt || null,
    onboardingComplete: !!state.onboardingComplete,
    onboardingData: state.onboardingData || { name: "", age: "", gender: "", height: "", weight: "", goalType: "", experience: "", trainingDays: 3, equipment: "", equipmentDetails: [], injuries: [], injuryNotes: "", nutritionCal: "", nutritionProtein: "", dietPreference: "none", supplements: [], metrics: {}, targetWeight: "", targetDate: "", primaryLift: "" },
    waterLog: collectWaterLog(),
    mealLog: collectMealLog(),
    learningProgress: loadLearningProgress(),
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ironlog-export-${getDateKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getProfile() {
  const u = state.user || {};
  return {
    name: u.name || "",
    age: u.age || 0,
    gender: u.gender || "",
    height: u.height || 0,
    weight: u.weight || 0,
    goal: u.goal || "recomp",
    activity: u.activity || "moderate",
    experience: u.experience || "beginner",
    trainingDays: u.trainingDays || 3,
    equipment: u.equipment || "gym",
    equipmentDetails: Array.isArray(u.equipmentDetails) ? u.equipmentDetails : [],
    injuries: Array.isArray(u.injuries) ? u.injuries : [],
    injuryNotes: u.injuryNotes || "",
    dietPreference: u.dietPreference || "none",
    supplements: Array.isArray(u.supplements) ? u.supplements : [],
    bodyMeasurements: u.bodyMeasurements || {},
    calorieTarget: state.calorieTarget || 0,
    proteinGoal: state.proteinGoal || 0,
    waterGoal: state.waterGoal || 0,
    restTimer: state.restTimer || 90,
    bodyGoal: state.bodyGoal || u.goal || "recomp",
  };
}

function render() {
  document.getElementById("todayLabel").textContent = formatReadableDate(new Date());
  updateStreak();
  renderSetsPanel();
  renderProfileAvatar();
  if (currentTab === "progress") renderProgressPage();
  if (currentTab === "sessions") renderSessionsTab();
  updateTopbarTimer();
}

// ===== WORKOUT FLOW STATE =====
let currentPlanId = "";
let currentExName = "";
let editingSetId = null;
let addSetReps = 10;
let addSetWeight = 0;
let setReps = 10;
let setWeight = 20;
let currentWorkoutId = null;

function showScreen(screenId) {
  document.querySelectorAll("#panel-sets .screen").forEach((el) => el.classList.add("is-hidden"));
  document.getElementById(screenId).classList.remove("is-hidden");
  const nav = document.getElementById("bottomNav");
  if (screenId === "screen-new-workout") {
    nav.classList.remove("is-locked");
    nav.style.display = "none";
  } else if (screenId === "screen-ws") {
    nav.style.display = "";
    nav.classList.add("is-locked");
  } else {
    nav.style.display = "";
    nav.classList.remove("is-locked");
  }
  if (screenId !== "screen-ws" && restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
    document.getElementById("restTimer")?.classList.add("is-hidden");
  }
}

// ===== HOME DASHBOARD =====

function getDailyMessage() {
  const messages = [
    "Build muscle. Lose fat. Stay consistent.",
    "Ready to get stronger today?",
    "Consistency beats intensity — keep showing up.",
    "Focus on today's training. Progress adds up.",
    "Stay strong. Recover better. Repeat.",
    "Make every rep count toward your goal.",
    "You're building something great. Trust the process.",
    "Small steps lead to big results. Keep lifting.",
    "Today's effort = tomorrow's progress.",
    "Train smart. Eat right. Recover well.",
  ];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return messages[dayOfYear % messages.length];
}

function getLastWorkoutForPlan(workoutId) {
  const sessions = state.sessions.filter((s) => s.finishedAt && s.workoutId === workoutId);
  if (!sessions.length) return null;
  return sessions.sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
}

function renderHome() {
  const user = state.user;
  const name = user ? user.name : "there";
  const g = getGreeting();
  const streak = getStreak();
  const latestLog = (state.weightLog || []).sort((a, b) => b.date.localeCompare(a.date))[0];
  const weight = latestLog ? latestLog.weight : user ? user.weight : null;
  const lastSession = state.sessions.filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
  const profileComplete = isProfileComplete();
  const hasWeight = weight !== null && weight !== undefined;
  const longestStreak = getLongestStreak();
  const daysSinceWeight = getDaysSinceLastWeight();
  const lastWeightText = getLastWeightText();
  const checkInDue = daysSinceWeight !== null && daysSinceWeight > 7;
  const goalLabel = GoalCenter.getGoalLabel ? GoalCenter.getGoalLabel() : "";
  const hasData = (state.sessions || []).filter(s => s.finishedAt).length > 0 || (state.weightLog || []).length > 0;
  document.getElementById("homeGreeting").innerHTML = `
    <div class="home-greeting-line">${g.text} ${g.emoji}</div>
    <div class="home-name-line">${name}</div>
    <div class="home-greeting-message" style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:0.75rem">${getDailyMessage()}</div>

    <div class="home-qa-row">
      <button class="home-qa-btn primary" id="qaStartWorkout">▶ Start Workout</button>
      <button class="home-qa-btn secondary" id="qaLogWeight">⚖️ Log Weight</button>
      <button class="home-qa-btn secondary" id="qaGenerate">🤖 Generate</button>
      <button class="home-qa-btn secondary" id="qaViewProgress">📊 Progress</button>
    </div>

    <div class="home-dash-card" id="homeDashCard">
      <div class="home-dash-grid">
        <div class="home-dash-item" id="heroStreakCard" style="cursor:pointer">
          <span class="home-dash-value">${streak}</span>
          <span class="home-dash-label">Streak</span>
        </div>
        <div class="home-dash-item" id="heroWeightCard" style="cursor:pointer">
          <span class="home-dash-value">${hasWeight ? displayWeight(weight) : "—"}</span>
          <span class="home-dash-label">Weight</span>
          ${checkInDue ? '<div style="font-size:0.55rem;color:var(--orange);margin-top:0.1rem">Due</div>' : ""}
        </div>
        <div class="home-dash-item" id="heroGoalCard" style="cursor:pointer">
          <span class="home-dash-value">${goalLabel || "—"}</span>
          <span class="home-dash-label">Goal</span>
        </div>
        <div class="home-dash-item">
          <span class="home-dash-value">${longestStreak}</span>
          <span class="home-dash-label">Best</span>
        </div>
      </div>
    </div>

    ${profileComplete || state.profileBannerDismissed ? "" : `<div class="home-incomplete-banner" id="homeIncompleteBanner"><span style="font-size:0.75rem;font-weight:600">Complete your profile</span><span style="font-size:0.7rem;color:var(--accent);font-weight:700">Set Up →</span></div>`}

    ${!hasData ? "" : `
    <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.5rem 0.6rem">
        <div style="font-size:0.6rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Last Workout</div>
        <div style="font-size:0.82rem;font-weight:700;margin-top:0.15rem">${lastSession ? lastSession.workoutName : "—"}</div>
        <div style="font-size:0.65rem;color:var(--text-secondary);margin-top:0.05rem">${lastSession ? formatRelativeDate(lastSession.dateKey) : ""}</div>
      </div>
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.5rem 0.6rem">
        <div style="font-size:0.6rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">${hasWeight ? "Current" : "Target"}</div>
        <div style="font-size:0.82rem;font-weight:700;margin-top:0.15rem">${hasWeight ? displayWeight(weight) : (state.user?.targetWeight ? displayWeight(state.user.targetWeight) : "—")}</div>
        <div style="font-size:0.65rem;color:var(--text-secondary);margin-top:0.05rem">${lastWeightText}</div>
      </div>
    </div>
    `}

    <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem" id="todayHealthWidgets">
      ${hasData ? renderNutritionWidget() : ""}
      ${hasData ? renderWaterWidget() : ""}
    </div>

    ${!hasData ? "" : `
    <div style="display:flex;flex-direction:column;gap:0.4rem;margin-bottom:0.75rem" id="homeCoachInsights">
      <div style="font-size:0.6rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-secondary);padding:0 0.15rem">Coach</div>
      <button class="home-coach-btn" id="homeCoachOpen">
        <span style="font-size:0.78rem;font-weight:600">${getCoachSummary()}</span>
        <span style="font-size:0.65rem;color:var(--text-secondary)">Open Coach →</span>
      </button>
      <button class="home-coach-btn" id="homeCoachRecovery" style="${typeof CoachEngine === "undefined" ? "display:none" : ""}">
        <span style="font-size:0.78rem;font-weight:600">${typeof CoachEngine !== "undefined" ? getRecoverySummary() : "Recovery"}</span>
        <span style="font-size:0.65rem;color:var(--text-secondary)">View Recovery →</span>
      </button>
    </div>
    `}
  `;

  // Quick action bindings
  document.getElementById("qaStartWorkout")?.addEventListener("click", () => {
    const todaySession = getTodaySession();
    if (todaySession) {
      startOrContinueWorkout(todaySession.workoutId);
    } else {
      showNewWorkoutBuilder();
    }
  });
  document.getElementById("qaLogWeight")?.addEventListener("click", () => {
    document.getElementById("weightLogSheet")?.classList.remove("is-hidden");
  });
  document.getElementById("qaGenerate")?.addEventListener("click", openGenerateWorkout);
  document.getElementById("qaViewProgress")?.addEventListener("click", () => activateTab("progress"));

  const activePlan = loadCustomProgram() || plan;
  const todaySession = getTodaySession();
  const container = document.getElementById("homeWorkoutList");

  // Sort: active workout first, then rest
  const sorted = [...activePlan].sort((a, b) => {
    const aActive = todaySession && todaySession.workoutId === a.id ? 1 : 0;
    const bActive = todaySession && todaySession.workoutId === b.id ? 1 : 0;
    return bActive - aActive;
  });

  if (!sorted.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💪</div>
        <div class="empty-state-title">No Workouts Yet</div>
        <div class="empty-state-text">Create your first workout and start building strength today.</div>
        <button class="empty-state-btn" id="emptyStateBuildBtn">Create Workout</button>
        <button class="empty-state-btn secondary" id="emptyStateGenerateBtn">Generate Program</button>
      </div>`;
    document.getElementById("emptyStateBuildBtn")?.addEventListener("click", showNewWorkoutBuilder);
    document.getElementById("emptyStateGenerateBtn")?.addEventListener("click", openGenerateWorkout);
  } else {
    // Group by programName, keep ungrouped workouts separate
    let html = "";
    const groups = {};
    const ungrouped = [];
    sorted.forEach(function(w) {
      if (w.programName) {
        if (!groups[w.programName]) groups[w.programName] = [];
        groups[w.programName].push(w);
      } else {
        ungrouped.push(w);
      }
    });
    const pgIds = Object.keys(groups);
    pgIds.forEach(function(pn) {
      const pWorkouts = groups[pn];
      var expanded = pWorkouts.some(function(w) { return todaySession && todaySession.workoutId === w.id; });
      html += '<div class="wo-program-group' + (expanded ? " is-expanded" : "") + '">' +
        '<div class="wo-program-header">' +
        '<span class="wo-program-name">' + pn + '</span>' +
        '<span class="wo-program-toggle">' + (expanded ? "▲" : "▼") + '</span>' +
        '</div>' +
        '<div class="wo-program-body"' + (expanded ? '' : ' style="display:none"') + '>' +
        pWorkouts.map(function(w) { return renderWorkoutCardItem(w, todaySession); }).join("") +
        '</div></div>';
    });
    html += ungrouped.map(function(w) { return renderWorkoutCardItem(w, todaySession); }).join("");
    container.innerHTML = html;

    // Bind program header toggles
    container.querySelectorAll(".wo-program-header").forEach(function(hdr) {
      hdr.addEventListener("click", function() {
        var group = hdr.closest(".wo-program-group");
        var body = group.querySelector(".wo-program-body");
        var toggle = hdr.querySelector(".wo-program-toggle");
        if (body.style.display === "none") {
          body.style.display = "";
          toggle.textContent = "▲";
          group.classList.add("is-expanded");
        } else {
          body.style.display = "none";
          toggle.textContent = "▼";
          group.classList.remove("is-expanded");
        }
      });
    });
  }

  // Bind card taps => details
  container.querySelectorAll(".wo-card-item").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".wo-card-item-btn") || e.target.closest(".wo-card-item-menu")) return;
      openWorkoutDetails(card.dataset.wId);
    });
  });

  // Bind Start/Continue buttons
  container.querySelectorAll(".wo-card-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.wId;
      const action = btn.dataset.action;
      if (action === "start") handleStartWorkout(id);
      else if (action === "continue") startOrContinueWorkout(id);
    });
  });

  // Bind menu buttons
  container.querySelectorAll(".wo-card-item-menu").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showWorkoutActionsSheet(btn.dataset.wId);
    });
  });

  // Hero cards
  document.getElementById("heroStreakCard")?.addEventListener("click", openStreakDrawer);
  document.getElementById("heroWeightCard")?.addEventListener("click", () => {
    const entry = latestWeight();
    document.getElementById("wlSheetWeight").value = entry ? entry.weight : "";
    updateWeightDisplay();
    document.getElementById("weightLogSheet").classList.remove("is-hidden");
    setTimeout(() => document.getElementById("wlSheetWeight").select(), 150);
  });
  document.getElementById("heroGoalCard")?.addEventListener("click", openGoalCenter);

  // Water widget buttons
  document.getElementById("waterAdd250")?.addEventListener("click", () => { addWater(250); renderHome(); });
  document.getElementById("waterAdd500")?.addEventListener("click", () => { addWater(500); renderHome(); });
  document.getElementById("waterAdd750")?.addEventListener("click", () => { addWater(750); renderHome(); });
  document.getElementById("mlOpenBtn")?.addEventListener("click", () => { renderMealLogger(); });

  // Coach insight buttons
  document.getElementById("homeCoachOpen")?.addEventListener("click", () => activateTab("trainer"));
  document.getElementById("homeCoachRecovery")?.addEventListener("click", () => {
    if (typeof CoachSystem !== "undefined" && CoachSystem.navigate) {
      activateTab("trainer");
      setTimeout(() => CoachSystem.navigate("recovery"), 50);
    } else {
      activateTab("trainer");
    }
  });

  const banner = document.getElementById("homeIncompleteBanner");
  if (banner) {
    setTimeout(() => {
      banner.style.transition = "opacity 0.5s ease";
      banner.style.opacity = "0";
      setTimeout(() => banner.remove(), 500);
      state.profileBannerDismissed = true;
      saveState();
    }, 5000);
    banner.addEventListener("click", () => {
      banner.style.transition = "opacity 0.3s ease";
      banner.style.opacity = "0";
      setTimeout(() => banner.remove(), 300);
      state.profileBannerDismissed = true;
      saveState();
      openOnboarding(true);
    });
  }

  // First 7 Days banner on home screen
  if (state.onboardingComplete) {
    const homeGreeting = document.getElementById("homeGreeting");
    if (homeGreeting) {
      const existing = document.getElementById("f7dBanner");
      if (!existing) {
        const f7dFocus = getFirst7DayFocus();
        if (f7dFocus) {
          const f7dBanner = document.createElement("div");
          f7dBanner.className = "f7d-banner";
          f7dBanner.id = "f7dBanner";
          f7dBanner.innerHTML = `
            <div class="f7d-banner-icon">${f7dFocus.icon}</div>
            <div class="f7d-banner-text">
              <div class="f7d-banner-title">Day ${f7dFocus.day}: ${f7dFocus.focus}</div>
              <div class="f7d-banner-desc">${f7dFocus.desc}</div>
              <div class="f7d-banner-bar"><div class="f7d-banner-fill" style="width:${(f7dFocus.progress / f7dFocus.total) * 100}%"></div></div>
            </div>
            <div class="f7d-banner-arrow">→</div>`;
          f7dBanner.addEventListener("click", () => obNavigateToDay(f7dFocus.day, f7dFocus.key));
          homeGreeting.after(f7dBanner);
        }
      }
    }
  }

  renderWeeklyReport();
  renderRecentWorkouts();
}

function getCoachSummary() {
  if (typeof CoachEngine !== "undefined") {
    try {
      const coach = CoachEngine.runAll();
      const dc = coach.daily;
      return dc.coachMessage || dc.status || "Coach ready";
    } catch (e) { return "Coach ready"; }
  }
  return "Coach ready";
}

function getRecoverySummary() {
  if (typeof CoachEngine !== "undefined") {
    try {
      const coach = CoachEngine.runAll();
      const rec = coach.recovery;
      if (rec && rec.score !== undefined) {
        return "Recovery: " + rec.score + "/100 — " + (rec.label || "");
      }
    } catch (e) { /* ignore */ }
  }
  return "Recovery insights available";
}

function renderWorkoutCardItem(workout, todaySession) {
  const isActive = todaySession && todaySession.workoutId === workout.id;
  const totalEx = workout.exercises ? workout.exercises.length : 0;

  if (isActive && todaySession) {
    const doneEx = todaySession.exercises.filter((e) => e.sets.length && e.sets.every((s) => s.done)).length;
    const elapsed = todaySession.startedAt ? formatStopwatch(Math.floor((Date.now() - new Date(todaySession.startedAt).getTime()) / 1000)) : "";
    return `<div class="wo-card-item is-active" data-w-id="${workout.id}">
      <div class="wo-card-item-active-top">
        <span class="wo-card-item-badge">Active</span>
        <button class="wo-card-item-menu" data-w-id="${workout.id}">•••</button>
      </div>
      <div class="wo-card-item-name" style="font-size:1rem">${workout.name}</div>
      <div class="wo-card-item-row2">
        <span class="wo-card-item-meta">Exercise ${Math.min(doneEx + 1, totalEx)} of ${totalEx}${elapsed ? " · " + elapsed : ""}</span>
        <button class="wo-card-item-btn" data-w-id="${workout.id}" data-action="continue">Continue Workout</button>
      </div>
    </div>`;
  }

  return `<div class="wo-card-item" data-w-id="${workout.id}">
    <div class="wo-card-item-row1">
      <span class="wo-card-item-name">${workout.name}</span>
      <button class="wo-card-item-menu" data-w-id="${workout.id}">•••</button>
    </div>
    <div class="wo-card-item-row2">
      <span class="wo-card-item-meta"></span>
      <button class="wo-card-item-btn" data-w-id="${workout.id}" data-action="start">Start Workout</button>
    </div>
  </div>`;
}

function formatStopwatch(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatRelativeDate(dateKey) {
  const today = getDateKey();
  if (dateKey === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === getDateKey(yesterday)) return "Yesterday";
  const d = parseDateKey(dateKey);
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff <= 7) return `${diff}d ago`;
  return formatReadableDate(d);
}

function generateWeeklyReport() {
  const weekAgo = getDateKey(new Date(Date.now() - 7 * 86400000));
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= weekAgo);
  if (!weekSessions.length) return null;
  let totalSets = 0, doneSets = 0, totalDuration = 0, totalScore = 0, scoreCount = 0;
  const trainedDays = new Set();
  for (const ses of weekSessions) {
    trainedDays.add(ses.dateKey);
    if (ses.duration) totalDuration += ses.duration;
    if (ses.qualityScore != null) { totalScore += ses.qualityScore; scoreCount++; }
    for (const ex of ses.exercises) {
      for (const s of ex.sets) {
        if (s.isWarmup) continue;
        totalSets++;
        if (s.done) doneSets++;
      }
    }
  }
  const consistency = Math.min(100, Math.round((trainedDays.size / 7) * 100));
  const compPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : null;
  const avgDuration = totalDuration ? Math.round(totalDuration / weekSessions.length / 60) : 0;
  const weightChange = weeklyWeightChange();
  const goalProgress = computeGoalProgress();
  const weekPRs = (() => {
    if (!state.prs) return 0;
    let count = 0;
    for (const [, data] of Object.entries(state.prs)) {
      (data.history || []).forEach((h) => { if (h.date && h.date >= weekAgo) count++; });
    }
    return count;
  })();
  return { sessions: weekSessions.length, totalSets, doneSets, compPct, avgScore, avgDuration, weightChange, goalProgress, weekPRs, trainedDays: trainedDays.size, consistency };
}

function generateWeeklyWins(report) {
  if (!report) return [];
  const wins = [];
  if (report.sessions >= 5) wins.push({ icon: "🔥", text: `${report.sessions} workouts — crushing it` });
  else if (report.sessions >= 3) wins.push({ icon: "💪", text: `${report.sessions} workouts this week` });
  if (report.trainedDays >= 5) wins.push({ icon: "📅", text: `Trained ${report.trainedDays} days this week` });
  if (report.weekPRs >= 3) wins.push({ icon: "🏆", text: `${report.weekPRs} new personal records` });
  else if (report.weekPRs >= 1) wins.push({ icon: "⭐", text: `${report.weekPRs} PR${report.weekPRs > 1 ? "s" : ""} this week` });
  if (report.avgScore !== null && report.avgScore >= 80) wins.push({ icon: "🎯", text: `Avg quality score: ${report.avgScore}` });
  if (report.weightChange !== null && report.weightChange < 0) wins.push({ icon: "⬇️", text: `Lost ${Math.abs(report.weightChange).toFixed(1)}kg this week` });
  if (report.weightChange !== null && report.weightChange > 0.5) wins.push({ icon: "⬆️", text: `Gained ${report.weightChange.toFixed(1)}kg this week` });
  if (report.goalProgress && report.goalProgress.status === "on-track" && report.goalProgress.progress > 0) wins.push({ icon: "🎯", text: `Goal progress: ${report.goalProgress.progress}%` });
  if (report.consistency >= 80) wins.push({ icon: "🎯", text: `${report.consistency}% consistency` });
  const streak = getStreak();
  if (streak >= 7) wins.push({ icon: "🔥", text: `${streak}-day streak` });
  if (wins.length === 0) wins.push({ icon: "💪", text: "Keep showing up — every workout counts" });
  return wins.slice(0, 4);
}

// ===== REPORT STORAGE =====
const REPORT_KEY = "ironlog_reports";
function loadAllReports() {
  try { return JSON.parse(localStorage.getItem(REPORT_KEY)) || { weekly: {}, monthly: {} }; }
  catch { return { weekly: {}, monthly: {} }; }
}
function saveAllReports(data) {
  localStorage.setItem(REPORT_KEY, JSON.stringify(data));
}
function getCurrentWeekKey() {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return `${mon.getFullYear()}-W${String(Math.ceil((((mon - new Date(mon.getFullYear(), 0, 1)) / 86400000) + mon.getDay() + 1) / 7)).padStart(2, "0")}`;
}
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function saveWeeklyReport(report) {
  const all = loadAllReports();
  const key = getCurrentWeekKey();
  all.weekly[key] = { ...report, savedAt: new Date().toISOString() };
  saveAllReports(all);
}
function getWeeklyReport(weekKey) {
  const all = loadAllReports();
  return all.weekly[weekKey] || null;
}
function saveMonthlyReport(report) {
  const all = loadAllReports();
  const key = getCurrentMonthKey();
  all.monthly[key] = { ...report, savedAt: new Date().toISOString() };
  saveAllReports(all);
}
function getMonthlyReport(monthKey) {
  const all = loadAllReports();
  return all.monthly[monthKey] || null;
}
function getAllReportKeys() {
  const all = loadAllReports();
  return {
    weekly: Object.keys(all.weekly).sort().reverse(),
    monthly: Object.keys(all.monthly).sort().reverse(),
  };
}

function renderWeeklyReport() {
  const report = generateWeeklyReport();
  const reportEl = document.getElementById("homeWeeklyReport");
  if (!report || !reportEl) return;
  const wins = generateWeeklyWins(report);
  reportEl.innerHTML = `
    <div class="home-section-header">
      <span class="home-section-label">📊 Weekly Summary</span>
    </div>
    <div class="wr-card">
      <div class="wr-grid">
        <div class="wr-stat"><strong>${report.sessions}</strong><small>Workouts</small></div>
        <div class="wr-stat"><strong>${report.compPct}%</strong><small>Completion</small></div>
        <div class="wr-stat"><strong>${report.avgScore !== null ? report.avgScore : "—"}</strong><small>Avg Score</small></div>
        <div class="wr-stat"><strong>${report.avgDuration > 0 ? report.avgDuration + "m" : "—"}</strong><small>Avg Duration</small></div>
        <div class="wr-stat"><strong>${report.consistency}%</strong><small>Consistency</small></div>
        <div class="wr-stat"><strong>${report.weekPRs}</strong><small>PRs</small></div>
      </div>
      ${report.weightChange !== null ? `<div class="wr-weight">Weight change: ${report.weightChange > 0 ? "+" : ""}${report.weightChange.toFixed(1)} kg</div>` : ""}
      ${wins.length ? `<div class="wr-wins">${wins.map(w => `<div class="wr-win"><span>${w.icon}</span><span>${w.text}</span></div>`).join("")}</div>` : ""}
    </div>`;
  reportEl.style.display = "";
}

function renderRecentWorkouts() {
  const section = document.getElementById("homeRecentSection");
  const container = document.getElementById("homeRecentList");
  const recent = state.sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 5);
  if (!recent.length) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  container.innerHTML = recent
    .map((s) => {
      const d = parseDateKey(s.dateKey);
      return `<div class="home-recent-card" data-session-id="${s.id}">
      <div class="home-recent-card-info">
        <div class="home-recent-card-name">${s.workoutName}</div>
        <div class="home-recent-card-date">${formatReadableDate(d)}</div>
      </div>
    </div>`;
    })
    .join("");
  container.querySelectorAll("[data-session-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.sessionId;
      const session = state.sessions.find((s) => s.id === id);
      if (session) openWorkoutReport(session);
    });
  });
}




// ===== START / CONTINUE WORKOUT =====
function handleStartWorkout(workoutId) {
  const todaySession = getTodaySession();
  // If user already has an active workout for a different workout, confirm
  if (todaySession && todaySession.workoutId !== workoutId) {
    showStartConfirm(workoutId);
    return;
  }
  startOrContinueWorkout(workoutId);
}

function showStartConfirm(newWorkoutId) {
  const existing = document.querySelector(".confirm-overlay");
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-card">
      <div class="confirm-title">Workout in Progress</div>
      <div class="confirm-text">You already have an active workout today. Starting a new one will replace it. Continue?</div>
      <div class="confirm-actions">
        <button class="btn-secondary" id="confirmCancel">Cancel</button>
        <button class="btn-primary" id="confirmReplace">Replace</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("confirmCancel").addEventListener("click", () => overlay.remove());
  document.getElementById("confirmReplace").addEventListener("click", () => {
    overlay.remove();
    // Clear today's session and start fresh
    state.sessions = state.sessions.filter((s) => s.dateKey !== getDateKey());
    saveState();
    startOrContinueWorkout(newWorkoutId);
  });
}

function startOrContinueWorkout(workoutId) {
  currentWorkoutId = workoutId;
  const session = startSessionForWorkout(workoutId);
  if (!session) return;
  const hasDoneSets = session.exercises.some((e) => e.sets.some((s) => s.done));
  if (!hasDoneSets) {
    openWarmupReminder();
  } else {
    showScreen("screen-ws");
    renderWorkoutSession();
  }
}

// ===== WORKOUT DETAILS =====
function openWorkoutDetails(workoutId) {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === workoutId);
  if (!workout) return;
  document.getElementById("woDetailsTitle").textContent = workout.name;
  const last = getLastWorkoutForPlan(workoutId);
  const totalEx = workout.exercises ? workout.exercises.length : 0;
  let bodyHtml = "";
  if (last) {
    const dateLabel = last.dateKey === getDateKey() ? "Today" : formatRelativeDate(last.dateKey);
    bodyHtml += `<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.75rem">Last completed: ${dateLabel}</div>`;
  }
  bodyHtml += `<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.5rem">${totalEx} exercise${totalEx !== 1 ? "s" : ""}</div>`;
  if (workout.exercises) {
    workout.exercises.forEach((ex) => {
      bodyHtml += `<div class="wo-details-exercise"><span class="wo-details-ex-name">${ex.name}</span><span class="wo-details-ex-meta">${ex.sets || 3}×${ex.reps || 8}</span></div>`;
    });
  }
  document.getElementById("woDetailsBody").innerHTML = bodyHtml;
  document.getElementById("woDetailsStartBtn").dataset.wId = workoutId;
  showScreen("screen-wo-details");
}

document.getElementById("woDetailsBackBtn")?.addEventListener("click", () => {
  showScreen("screen-home");
  renderHome();
});
document.getElementById("woDetailsMenuBtn")?.addEventListener("click", () => {
  const id = document.getElementById("woDetailsStartBtn").dataset.wId;
  if (id) showWorkoutActionsSheet(id);
});
document.getElementById("woDetailsStartBtn")?.addEventListener("click", () => {
  const id = document.getElementById("woDetailsStartBtn").dataset.wId;
  if (id) handleStartWorkout(id);
});

// ===== WORKOUT ACTIONS SHEET =====
function showWorkoutActionsSheet(id) {
  const list = document.getElementById("waList");
  const actions = [
    { label: "Edit Workout", action: "edit-workout" },
    { label: "Duplicate Workout", action: "duplicate-workout" },
    { label: "Rename Workout", action: "rename-workout" },
    { label: "Delete Workout", action: "delete-workout", danger: true },
  ];
  list.innerHTML = actions
    .map(
      (a) =>
        `<button class="wa-item ${a.danger ? "wa-item-danger" : ""}" data-action="${a.action}" data-id="${id}">${a.label}</button>`
    )
    .join("");
  document.getElementById("waTitle").textContent = "Workout Actions";
  document.getElementById("workoutActionsSheet").classList.remove("is-hidden");
}

document.getElementById("waOverlay")?.addEventListener("click", () => {
  document.getElementById("workoutActionsSheet").classList.add("is-hidden");
});
document.getElementById("waCancel")?.addEventListener("click", () => {
  document.getElementById("workoutActionsSheet").classList.add("is-hidden");
});
document.getElementById("waList")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".wa-item");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  document.getElementById("workoutActionsSheet").classList.add("is-hidden");
  if (action === "delete-workout") {
    if (!confirm("Delete this workout?")) return;
    const activePlan = loadCustomProgram() || plan;
    const idx = activePlan.findIndex((w) => w.id === id);
    if (idx >= 0) {
      activePlan.splice(idx, 1);
      localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
      state.plan = activePlan;
      saveState();
    }
    renderHome();
    return;
  }
  if (action === "rename-workout") {
    const activePlan = loadCustomProgram() || plan;
    const w = activePlan.find((w2) => w2.id === id);
    if (w) {
      const n = prompt("New name:", w.name);
      if (n && n.trim()) {
        w.name = n.trim();
        localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
        state.plan = activePlan;
        saveState();
        renderHome();
      }
    }
    return;
  }
  if (action === "edit-workout") {
    openEditWorkout(id);
    return;
  }
  if (action === "duplicate-workout") {
    duplicateWorkout(id);
    return;
  }
});

function closeWorkout() {
  currentWorkoutId = null;
  showScreen("screen-home");
  renderHome();
}

// ===== PROFILE AVATAR =====
function renderProfileAvatar() {
  const name = state.user?.name || "User";
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "IL";
  const circle = document.getElementById("avatarCircle");
  const topbarName = document.getElementById("topbarProfileName");
  const topbarGoal = document.getElementById("topbarProfileGoal");
  const goalLabels = {
    "fat-loss": "Fat Loss", "build-muscle": "Build Muscle", recomp: "Recomp",
    strength: "Strength", athletic: "Athletic", general: "Fitness", custom: "Custom",
  };
  const goal = GoalCenter?.getGoalType?.() || state.bodyGoal || state.user?.goal || "";
  if (circle) circle.textContent = initials;
  if (topbarName) topbarName.textContent = name;
  if (topbarGoal) topbarGoal.textContent = goalLabels[goal] || "Set Goal";
}

// ===== PROFILE SCREEN =====
function getGoalLabel(g) {
  const labels = { "fat-loss": "Fat Loss", "lose-fat": "Fat Loss", "build-muscle": "Build Muscle", recomp: "Recomp", strength: "Strength", athletic: "Athletic", general: "Fitness", custom: "Custom" };
  return labels[g] || "Fitness";
}
function getExpLabel(e) {
  const labels = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
  return labels[e] || "Beginner";
}
function renderProfileCompleteness() {
  const p = getProfile();
  const checks = [
    !!p.name, !!p.age, !!p.gender, !!p.height, !!p.weight,
    !!p.goal, !!p.activity, !!p.experience, !!p.trainingDays, !!p.equipment,
    !!p.calorieTarget, !!p.proteinGoal, !!p.waterGoal,
  ];
  const done = checks.filter(Boolean).length;
  const total = checks.length;
  const pct = Math.round((done / total) * 100);
  const items = [
    { label: "Personal", ok: !!p.name && !!p.age && !!p.gender && !!p.height && !!p.weight },
    { label: "Goals", ok: !!p.goal && !!p.activity },
    { label: "Training", ok: !!p.experience && !!p.trainingDays && !!p.equipment },
    { label: "Nutrition", ok: !!p.calorieTarget && !!p.proteinGoal && !!p.waterGoal },
    { label: "Measurements", ok: Object.keys(p.bodyMeasurements).length > 0 },
  ];
  const doneItems = items.filter(i => i.ok).length;
  return { pct, label: `${doneItems}/${items.length} sections complete`, items };
}
function renderProfileHealth() {
  const p = getProfile();
  const hints = [];
  if (!p.goal || p.goal === "recomp") hints.push({ type: "attention", text: "Set a specific fitness goal", section: "goals" });
  if (!p.age) hints.push({ type: "missing", text: "Add your age for accurate calculations", section: "personal" });
  if (!p.height || !p.weight) hints.push({ type: "missing", text: "Height & weight unlock BMI & calorie estimates", section: "personal" });
  if (!p.experience) hints.push({ type: "missing", text: "Training experience tailors your workouts", section: "training" });
  if (!p.trainingDays) hints.push({ type: "missing", text: "How many days can you train per week?", section: "training" });
  if (!p.calorieTarget) hints.push({ type: "missing", text: "Set a daily calorie target", section: "nutrition" });
  if (!p.proteinGoal) hints.push({ type: "missing", text: "Set a daily protein target", section: "nutrition" });
  if (!p.waterGoal) hints.push({ type: "missing", text: "Set a daily water goal", section: "nutrition" });
  if (!Object.keys(p.bodyMeasurements).length) hints.push({ type: "missing", text: "Add body measurements to track progress", section: "body-log" });
  if (p.injuries && p.injuries.length) hints.push({ type: "ok", text: `${p.injuries.length} injury restriction${p.injuries.length > 1 ? "s" : ""} active`, section: "training" });
  return hints;
}
function renderProfileAchievements() {
  const container = document.getElementById("profileAchievements");
  if (!container) return;
  const cas = CoachSystem && CoachSystem.getState && CoachSystem.getState().cas;
  const achievements = cas && cas.achievements && cas.achievements.length ? cas.achievements : null;
  if (achievements) {
    const unlocked = achievements.filter(a => a.unlocked);
    const total = achievements.length;
    let html = `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem 0">
      <div style="flex:1;font-size:0.85rem;font-weight:600">${unlocked.length}/${total} Unlocked</div>
      <div style="font-size:0.65rem;color:var(--text-secondary);background:var(--surface);padding:0.2rem 0.5rem;border-radius:999px">${total - unlocked.length} remaining</div>
    </div><div class="pa-grid">`;
    achievements.forEach(a => {
      html += `<div class="pa-card${a.unlocked ? '' : ' pa-locked'}">
        <div class="pa-icon">${a.icon || "🏅"}</div>
        <div class="pa-name">${a.name || ""}</div>
        ${a.unlocked ? '<div class="pa-desc">Unlocked</div>' : '<div class="pa-desc">Locked</div>'}
      </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
  } else {
    container.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;padding:1.25rem 0;font-size:0.78rem;color:var(--text-secondary);line-height:1.4;text-align:center">
      <span style="font-size:1.5rem">🏅</span>
      <span>Complete workouts and challenges to unlock achievements.</span>
    </div>`;
  }
}
function renderProfileScreen() {
  const p = getProfile();
  const initials = (p.name || "IL").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const streak = state.workoutStreak || { currentStreak: 0, longestStreak: 0 };
  const totalWorkouts = (state.sessions || []).filter(s => s.finishedAt).length;
  const trainDays = p.trainingDays || 3;
  const weeklyPct = Math.min(100, Math.round((totalWorkouts / (trainDays * 4)) * 100));
  const calGoal = p.calorieTarget;
  const proGoal = p.proteinGoal;
  const bmi = p.height && p.weight ? (p.weight / ((p.height / 100) * (p.height / 100))).toFixed(1) : null;
  const goalLabel = getGoalLabel(p.goal);
  const expLabel = getExpLabel(p.experience);
  const completeness = renderProfileCompleteness();
  const healthItems = renderProfileHealth();
  const memberSince = state.activatedAt || state.onboardingData?.createdAt || null;
  const memberDate = memberSince ? new Date(memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;

  let html = `
    <div class="profile-hero">
      <div class="profile-hero-avatar">${initials}</div>
      <div class="profile-hero-name">${p.name || "Athlete"}</div>
      <div class="profile-hero-badges">
        <span class="profile-badge profile-badge-accent">${goalLabel}</span>
        <span class="profile-badge profile-badge-blue">${expLabel}</span>
        <span class="profile-badge profile-badge-orange">${p.trainingDays || "?"}x/week</span>
      </div>
      <div class="profile-hero-meta">
        ${memberDate ? `<span>Joined ${memberDate}</span>` : ""}
        <span>${totalWorkouts} workout${totalWorkouts !== 1 ? "s" : ""}</span>
        <span class="profile-hero-streak">${streak.currentStreak > 0 ? "🔥 " + streak.currentStreak + " day streak" : "No active streak"}</span>
      </div>
    </div>
  `;

  // Stats row
  html += `<div class="profile-stats">
    <div class="profile-stat"><span class="profile-stat-val">${p.weight ? displayWeight(p.weight) : "—"}</span><span class="profile-stat-lbl">Weight</span></div>
    <div class="profile-stat"><span class="profile-stat-val">${state.weightGoal?.targetWeight ? displayWeight(state.weightGoal.targetWeight) : "—"}</span><span class="profile-stat-lbl">Target</span></div>
    <div class="profile-stat"><span class="profile-stat-val">${p.bodyMeasurements?.bodyFat ? p.bodyMeasurements.bodyFat + "%" : "—"}</span><span class="profile-stat-lbl">Body Fat</span></div>
    <div class="profile-stat"><span class="profile-stat-val">${totalWorkouts}</span><span class="profile-stat-lbl">Workouts</span></div>
    <div class="profile-stat"><span class="profile-stat-val">${streak.currentStreak}</span><span class="profile-stat-lbl">Streak</span></div>
    <div class="profile-stat"><span class="profile-stat-val">${streak.longestStreak}</span><span class="profile-stat-lbl">Best</span></div>
    <div class="profile-stat"><span class="profile-stat-val">${weeklyPct}%</span><span class="profile-stat-lbl">Consistency</span></div>
    <div class="profile-stat"><span class="profile-stat-val">${calGoal ? calGoal : "—"}</span><span class="profile-stat-lbl">Calories</span></div>
  </div>`;

  // Completeness bar
  html += `<div class="profile-completeness">
    <div class="profile-completeness-top"><span>Profile</span><span>${completeness.pct}% · ${completeness.label}</span></div>
    <div class="profile-completeness-bar"><div class="profile-completeness-fill" style="width:${completeness.pct}%"></div></div>
  </div>`;

  // Health suggestions
  if (healthItems.length) {
    html += `<div class="profile-health">`;
    healthItems.slice(0, 4).forEach(h => {
      const dotClass = h.type;
      html += `<button class="profile-health-item" data-health-section="${h.section}"><span class="profile-health-dot ${dotClass}"></span>${h.text}</button>`;
    });
    html += `</div>`;
  }

  // --- Expandable sections ---
  const sections = [
    {
      id: "personal", icon: "person", label: "Personal",
      fields: [
        { label: "Name", val: p.name || null },
        { label: "Age", val: p.age ? p.age + " yrs" : null },
        { label: "Gender", val: p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : null },
        { label: "Height", val: p.height ? p.height + " cm" : null },
        { label: "Weight", val: p.weight ? displayWeight(p.weight) : null },
        { label: "BMI", val: bmi || null },
      ]
    },
    {
      id: "goals", icon: "flag", label: "Goals",
      fields: [
        { label: "Primary Goal", val: goalLabel },
        { label: "Activity Level", val: { sedentary: "Sedentary", light: "Light", moderate: "Moderate", very: "Very Active", athlete: "Athlete" }[p.activity] || null },
        { label: "Target Weight", val: state.weightGoal?.targetWeight ? displayWeight(state.weightGoal.targetWeight) : null },
        { label: "Goal Date", val: state.weightGoal?.targetDate || null },
      ]
    },
    {
      id: "training", icon: "dumbbell", label: "Training",
      fields: [
        { label: "Experience", val: expLabel },
        { label: "Training Days", val: p.trainingDays ? p.trainingDays + "/week" : null },
        { label: "Training Location", val: { gym: "Gym", home: "Home", minimal: "Both" }[p.equipment] || null },
        { label: "Rest Timer", val: (state.restTimer || 90) + "s" },
      ]
    },
    {
      id: "equipment", icon: "tools", label: "Equipment",
      fields: [
        { label: "Access Level", val: { gym: "Full Gym", home: "Home Gym", minimal: "Both" }[p.equipment] || null },
        ...(Array.isArray(p.equipmentDetails) && p.equipmentDetails.length ? [{ label: "Available", val: p.equipmentDetails.join(", ") }] : []),
        ...(Array.isArray(p.injuries) && p.injuries.length ? [{ label: "Limitations", val: p.injuries.join(", ") }] : []),
        ...(p.injuryNotes ? [{ label: "Injury Notes", val: p.injuryNotes }] : []),
      ]
    },
    {
      id: "nutrition", icon: "nutrition", label: "Nutrition",
      fields: [
        { label: "Daily Calories", val: calGoal ? calGoal + " cal" : null },
        { label: "Daily Protein", val: proGoal ? proGoal + "g" : null },
        { label: "Daily Water", val: (state.waterGoal || 0) + "ml" },
        { label: "Diet Preference", val: p.dietPreference && p.dietPreference !== "none" ? p.dietPreference.charAt(0).toUpperCase() + p.dietPreference.slice(1) : null },
        { label: "Supplements", val: Array.isArray(p.supplements) && p.supplements.length ? p.supplements.join(", ") : null },
      ]
    },
    {
      id: "body", icon: "body", label: "Body",
      fields: Object.keys(p.bodyMeasurements).length ? Object.entries(p.bodyMeasurements).map(([k, v]) => ({
        label: k.charAt(0).toUpperCase() + k.slice(1), val: k === "bodyFat" ? v + "%" : v + " cm"
      })) : [{ label: "Measurements", val: null }],
    },
  ];

  const iconSvgs = {
    person: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    flag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    dumbbell: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>',
    tools: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--protein)" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    nutrition: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--protein)" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-6"/></svg>',
    body: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  };
  const sectionColors = {
    personal: "var(--accent)", goals: "var(--orange)", training: "var(--blue)",
    equipment: "var(--protein)", nutrition: "var(--protein)", body: "var(--accent)",
  };

  sections.forEach(s => {
    const color = sectionColors[s.id] || "var(--accent)";
    html += `<div class="profile-section" data-section="${s.id}">
      <button class="profile-section-header" data-toggle-section="${s.id}">
        <div class="profile-section-icon" style="background:color-mix(in srgb,${color} 20%,transparent)">${iconSvgs[s.id]}</div>
        <span class="profile-section-title">${s.label}</span>
        <button class="profile-section-edit" data-edit-section="${s.id}" onclick="event.stopPropagation()">Edit</button>
        <span class="profile-section-chevron">›</span>
      </button>
      <div class="profile-section-body">
        ${s.fields.filter(f => f.val !== null && f.val !== "").map(f => `
          <div class="profile-section-row">
            <span class="profile-section-label">${f.label}</span>
            <span class="profile-section-value">${f.val}</span>
          </div>
        `).join("")}
        ${s.fields.every(f => f.val === null || f.val === "") ? '<div class="profile-section-row"><span class="profile-section-value empty">No data — tap Edit to add</span></div>' : ""}
      </div>
    </div>`;
  });

  // Body Log section
  html += `
    <div class="profile-section" data-section="body-log">
      <button class="profile-section-header" data-toggle-section="body-log">
        <div class="profile-section-icon" style="background:color-mix(in srgb,var(--accent) 20%,transparent)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <span class="profile-section-title">Body Log</span>
        <button class="profile-section-edit" data-edit-section="body-log" onclick="event.stopPropagation()">Edit</button>
        <span class="profile-section-chevron">›</span>
      </button>
      <div class="profile-section-body">
        <div class="section-label">Weigh-In</div>
        <div id="weighInCard" class="card-content"></div>
        <div class="section-label" style="margin-top:1.25rem">Body Measurements</div>
        <div id="bodyMeasurementsCard" class="card-content"></div>
        <div class="section-label" style="margin-top:1.25rem">Weight Trend</div>
        <div class="trend-header"><span class="trend-badge" id="trendBadge"></span></div>
        <div class="trend-averages" id="trendAverages"></div>
        <div class="chart-wrap"><canvas id="weightChart"></canvas></div>
        <div class="section-label" style="margin-top:1.25rem">Goal Prediction</div>
        <div id="goalPredictionContent" class="card-content"></div>
        <div class="section-label" style="margin-top:1.25rem">Body Analysis</div>
        <div class="bm-search-wrap">
          <input type="text" id="muscleSearch" class="bm-search" placeholder="Search muscle..." autocomplete="off" />
        </div>
        <div id="bodyAnalysis" class="card-content"></div>
      </div>
    </div>
    <div class="profile-section" data-section="achievements">
      <button class="profile-section-header" data-toggle-section="achievements">
        <div class="profile-section-icon" style="background:color-mix(in srgb,var(--orange) 20%,transparent)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5h.5"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H19"/><path d="M4 22h16"/><path d="M10 14.66V17a3 3 0 0 0 4 0v-2.34"/><path d="M14.5 9a4.5 4.5 0 0 1-9 0V5h9v4z"/></svg>
        </div>
        <span class="profile-section-title">Achievements</span>
        <span class="profile-section-chevron">›</span>
      </button>
      <div class="profile-section-body" id="profileAchievements"></div>
    </div>`;

  // Data & Backup + Quick actions at bottom
  html += `
    <div class="profile-section" data-section="preferences">
      <button class="profile-section-header" data-toggle-section="preferences">
        <div class="profile-section-icon" style="background:color-mix(in srgb,var(--text-secondary) 20%,transparent)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
        <span class="profile-section-title">Preferences & Data</span>
        <span class="profile-section-chevron">›</span>
      </button>
      <div class="profile-section-body">
        <button class="profile-section-row" onclick="openProfileSectionEditor('personal')" style="cursor:pointer;border:none;background:none;color:var(--text);font-family:inherit;text-align:left;width:100%">
          <span class="profile-section-label">Edit All Profile Data</span>
          <span class="profile-section-chevron" style="font-size:0.7rem">›</span>
        </button>
        <button class="profile-section-row" onclick="if(confirm('Export all data as JSON?')){exportJSON();}" style="cursor:pointer;border:none;background:none;color:var(--text);font-family:inherit;text-align:left;width:100%">
          <span class="profile-section-label">Export Data</span>
          <span class="profile-section-chevron" style="font-size:0.7rem">›</span>
        </button>
        <button class="profile-section-row" onclick="previousScreen='screen-profile';showScreen('screen-settings');renderSettings()" style="cursor:pointer;border:none;background:none;color:var(--text);font-family:inherit;text-align:left;width:100%">
          <span class="profile-section-label">App Settings</span>
          <span class="profile-section-chevron" style="font-size:0.7rem">›</span>
        </button>
        <button class="profile-section-row" onclick="document.getElementById('deleteDataModal').classList.remove('is-hidden')" style="cursor:pointer;border:none;background:none;color:var(--error);font-family:inherit;text-align:left;width:100%">
          <span class="profile-section-label">Delete All Data</span>
          <span class="profile-section-chevron" style="font-size:0.7rem;color:var(--error)">›</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("profileContent").innerHTML = html;
  renderBodyTab();
  renderProfileAchievements();
  attachProfileListeners();
}

function attachProfileListeners() {
  // Section toggle
  document.querySelectorAll("[data-toggle-section]").forEach(btn => {
    btn.addEventListener("click", function() {
      const id = this.dataset.toggleSection;
      const el = this.closest(".profile-section");
      el.classList.toggle("is-open");
    });
  });
  // Health item clicks
  document.querySelectorAll("[data-health-section]").forEach(btn => {
    btn.addEventListener("click", function() {
      const section = this.dataset.healthSection;
      const target = document.querySelector(`[data-section="${section}"]`);
      if (target) {
        target.classList.add("is-open");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
  // Edit section buttons
  document.querySelectorAll("[data-edit-section]").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      const section = this.dataset.editSection;
      openProfileSectionEditor(section);
    });
  });
  // Edit button in header — opens full onboarding pre-seeded
  document.getElementById("profileEditBtn")?.addEventListener("click", function() {
    openProfileSectionEditor("personal");
  });
  // Back button — handled globally at init to avoid duplicate listeners
  // Muscle search
  document.getElementById("muscleSearch")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".bm-muscle-row").forEach((row) => {
      const name = row.querySelector(".bm-muscle-name")?.textContent?.toLowerCase() || "";
      row.style.display = name.includes(q) ? "" : "none";
    });
  });
}

// ===== NUTRITION & WATER WIDGETS =====
function renderNutritionWidget() {
  const macros = getDailyMacros(getDateKey());
  const pGoal = state.proteinGoal || PROTEIN_GOAL;
  const cGoal = CARBS_GOAL;
  const fGoal = FAT_GOAL;
  const calGoal = state.calorieTarget || CAL_GOAL;
  const pPct = Math.min(100, Math.round((macros.protein / pGoal) * 100));
  const cPct = Math.min(100, Math.round((macros.carbs / cGoal) * 100));
  const fPct = Math.min(100, Math.round((macros.fat / fGoal) * 100));
  const calPct = Math.min(100, Math.round((macros.cal / calGoal) * 100));
  return `
    <div class="today-card" style="flex-direction:column;padding:1rem;gap:0.75rem" id="todayNutritionCard">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:0.85rem;font-weight:600">Nutrition</span>
          <span style="font-size:0.7rem;color:var(--text-secondary)">${Math.round(macros.cal)} / ${calGoal} cal</span>
        </div>
        <button id="mlOpenBtn" style="background:var(--accent);color:#000;border:none;border-radius:6px;padding:0.3rem 0.6rem;font-size:0.7rem;font-weight:600;cursor:pointer">+ Add Food</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem">
        <div><div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:0.2rem"><span style="color:#ff6b6b">Protein</span><span>${Math.round(macros.protein)}/${pGoal}g</span></div><div style="height:4px;background:var(--surface-3);border-radius:2px;overflow:hidden"><div style="height:100%;width:${pPct}%;background:#ff6b6b;border-radius:2px;transition:width 0.3s"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:0.2rem"><span style="color:#ffd43b">Carbs</span><span>${Math.round(macros.carbs)}/${cGoal}g</span></div><div style="height:4px;background:var(--surface-3);border-radius:2px;overflow:hidden"><div style="height:100%;width:${cPct}%;background:#ffd43b;border-radius:2px;transition:width 0.3s"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:0.2rem"><span style="color:#69db7c">Fat</span><span>${Math.round(macros.fat)}/${fGoal}g</span></div><div style="height:4px;background:var(--surface-3);border-radius:2px;overflow:hidden"><div style="height:100%;width:${fPct}%;background:#69db7c;border-radius:2px;transition:width 0.3s"></div></div></div>
      </div>
      ${macros.meals > 0 ? `<div style="font-size:0.65rem;color:var(--text-secondary)">${macros.meals} meal${macros.meals > 1 ? "s" : ""} logged</div>` : ""}
    </div>`;
}

function renderWaterWidget() {
  const current = getTodayWater();
  const goal = state.waterGoal || WATER_TARGET;
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return `
    <div class="today-card" style="flex-direction:row;align-items:center;padding:1rem;gap:0.75rem" id="todayWaterCard">
      <div style="position:relative;width:64px;height:64px;flex-shrink:0">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="${radius}" fill="none" stroke="var(--surface-3)" stroke-width="5"/>
          <circle cx="32" cy="32" r="${radius}" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" transform="rotate(-90 32 32)"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600">${pct}%</div>
      </div>
      <div style="flex:1">
        <div style="font-size:0.8rem;font-weight:600">Water</div>
        <div style="font-size:0.7rem;color:var(--text-secondary)">${current}ml / ${goal}ml</div>
        <div style="display:flex;gap:0.4rem;margin-top:0.4rem">
          <button id="waterAdd250" style="background:var(--surface-3);border:none;border-radius:6px;padding:0.25rem 0.5rem;font-size:0.65rem;color:var(--text-secondary);cursor:pointer">+250ml</button>
          <button id="waterAdd500" style="background:var(--surface-3);border:none;border-radius:6px;padding:0.25rem 0.5rem;font-size:0.65rem;color:var(--text-secondary);cursor:pointer">+500ml</button>
          <button id="waterAdd750" style="background:var(--surface-3);border:none;border-radius:6px;padding:0.25rem 0.5rem;font-size:0.65rem;color:var(--text-secondary);cursor:pointer">+750ml</button>
        </div>
      </div>
    </div>`;
}

// ===== TODAY PANEL =====
function renderHeroWelcome() {
  const finishedWorkouts = (state.sessions || []).filter(s => s.finishedAt).length;
  if (finishedWorkouts >= 3 || state.heroDismissed) return "";
  return `
    <div class="hero-welcome" id="heroWelcome">
      <div class="hero-welcome-bg"></div>
      <button class="hero-welcome-dismiss" id="heroWelcomeDismiss" aria-label="Dismiss welcome">✕</button>
      <div class="hero-welcome-brand">IronLog</div>
      <div class="hero-welcome-sub">Build Muscle. Lose Fat. Stay Consistent.</div>
      <div class="hero-welcome-body">Track workouts, monitor progress, improve recovery, and achieve your fitness goals with your personal training system.</div>
      <div class="hero-welcome-features">
        <div class="hero-welcome-feature">✓ Workout Tracking</div>
        <div class="hero-welcome-feature">✓ Progress Analytics</div>
        <div class="hero-welcome-feature">✓ Nutrition Tracking</div>
        <div class="hero-welcome-feature">✓ Recovery Insights</div>
      </div>
      <button class="hero-welcome-cta" id="heroWelcomeStart">Start First Workout</button>
      <button class="hero-welcome-cta secondary" id="heroWelcomeBuild">Build My Program</button>
    </div>`;
}

function renderQuickStartGuide() {
  if (!state.heroDismissed) return "";
  const finishedWorkouts = (state.sessions || []).filter(s => s.finishedAt).length;
  if (finishedWorkouts >= 6 || state.quickStartDismissed) return "";
  const qs = state.quickStartProgress || {};
  const items = [
    { key: "profile", label: "Complete Profile", check: () => isProfileComplete() },
    { key: "workout", label: "Create First Workout", check: () => (state.plan || []).length > 0 || (loadCustomProgram() || []).length > 0 },
    { key: "session", label: "Log First Session", check: () => finishedWorkouts >= 1 },
    { key: "goal", label: "Set Goal", check: () => GoalCenter.hasGoal(GoalCenter.load()) },
    { key: "water", label: "Track Water", check: () => {
      const today = getDateKey();
      const water = parseInt(localStorage.getItem("wl_water_" + today)) || 0;
      return water > 0;
    }},
    { key: "measurement", label: "Add First Measurement", check: () => (state.measurements || []).length > 0 },
  ];
  const done = items.filter(i => i.check()).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  if (done >= total) return "";
  return `
    <div class="quick-start-card" id="quickStartCard">
      <div class="quick-start-header">
        <span class="quick-start-title">Getting Started</span>
        <button class="quick-start-dismiss" id="quickStartDismiss" aria-label="Dismiss">✕</button>
      </div>
      <div class="quick-start-bar"><div class="quick-start-fill" style="width:${pct}%"></div></div>
      <div class="quick-start-label">${done}/${total} complete</div>
      <div class="quick-start-items">
        ${items.map(item => {
          const isDone = item.check();
          return `<div class="quick-start-item ${isDone ? "done" : ""}"><span class="quick-start-check">${isDone ? "✓" : "○"}</span><span>${item.label}</span></div>`;
        }).join("")}
      </div>
    </div>`;
}

function renderTodayMotivation() {
  const finishedWorkouts = (state.sessions || []).filter(s => s.finishedAt).length;
  if (finishedWorkouts < 1) return "";
  const streak = state.workoutStreak?.current || 0;
  const gcProfile = GoalCenter.load();
  const hasGoal = GoalCenter.hasGoal(gcProfile);
  const goalLabel = GoalCenter.getGoalLabel();
  const allPRs = getAllPRs();
  const recentPRs = [];
  for (const [exName, data] of Object.entries(allPRs)) {
    (data.history || []).forEach(h => recentPRs.push({ ...h, exerciseName: exName }));
  }
  recentPRs.sort((a, b) => b.date.localeCompare(a.date));
  const latestPR = recentPRs[0];
  const today = getDateKey();
  const water = parseInt(localStorage.getItem("wl_water_" + today)) || 0;
  const waterTarget = state.waterGoal || WATER_TARGET;
  const dailyLog = state.dailyLogs?.[today];
  const proteinHit = dailyLog && dailyLog.protein >= (state.proteinGoal || PROTEIN_GOAL) * 0.9;

  let message = "";
  let icon = "";
  if (streak >= 3) {
    message = `${streak} Day Streak. Keep showing up.`;
    icon = "🔥";
  } else if (latestPR) {
    const prName = latestPR.exerciseName.replace(/([A-Z])/g, " $1").trim();
    message = `New Personal Record. Great work on ${prName}.`;
    icon = "🏆";
  } else if (proteinHit) {
    message = "Protein Target Hit Yesterday. Recovery starts with consistency.";
    icon = "🥩";
  } else if (hasGoal) {
    message = `Current Goal: ${goalLabel}. Stay consistent and trust the process.`;
    icon = "🎯";
  } else if (water >= waterTarget * 0.8) {
    message = "Great hydration today. Your body will thank you.";
    icon = "💧";
  } else if (finishedWorkouts >= 1) {
    message = `${finishedWorkouts} workout${finishedWorkouts > 1 ? "s" : ""} completed. Every rep counts.`;
    icon = "💪";
  } else {
    return "";
  }
  return `
    <div class="today-motivation-card">
      <span class="today-motivation-icon">${icon}</span>
      <span class="today-motivation-text">${message}</span>
    </div>`;
}

// ===== SETS PANEL =====
function renderSetsPanel() {
  // If there's an active workout in progress, check if we're mid-flow
  const todaySession = getTodaySession();
  if (currentWorkoutId && todaySession && todaySession.workoutId === currentWorkoutId) {
    showScreen("screen-ws");
    renderWorkoutSession();
  } else {
    currentWorkoutId = null;
    showScreen("screen-home");
    renderHome();
  }
}

// ===== getGreeting (preserved) =====
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h >= 12 && h < 16) return { text: "Good Afternoon", emoji: "☕" };
  if (h >= 16 && h < 21) return { text: "Good Evening", emoji: "🌇" };
  return { text: "Good Night", emoji: "🌙" };
}

// ===== LEVEL 1: WORKOUT SESSION =====
// ===== PROGRESS BAR =====
function renderProgressIndicator() {
  const session = getTodaySession();
  if (!session || state.showWorkoutProgress === false) return "";
  const total = session.exercises.length;
  const done = session.exercises.filter((e) => e.sets.length && e.sets.every((s) => s.done)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return `<div class="pr-bar-wrap">
    <div class="pr-bar-track"><div class="pr-bar-fill" style="width:${pct}%"></div></div>
    <div class="pr-bar-label">${done} / ${total} Exercises</div>
  </div>`;
}
function updateProgressIndicator() {
  const el = document.getElementById("wsProgressIndicator");
  if (el) el.innerHTML = renderProgressIndicator();
}

function renderWorkoutSession() {
  const activePlan = loadCustomProgram() || plan;
  const session = getTodaySession();
  if (!session) {
    closeWorkout();
    return;
  }
  const workout = activePlan.find((w) => w.id === session.workoutId);
  const name = workout ? workout.name : session.workoutName || "Workout";

  document.getElementById("wsName").textContent = name;
  document.getElementById("wsProgressIndicator").innerHTML = renderProgressIndicator();

  // Description
  const descEl = document.getElementById("wsDesc");
  if (workout && workout.focus) {
    const desc = document.getElementById("wsDescText");
    desc.textContent = workout.focus;
    desc.style.maxHeight = "1.4em";
    desc.style.overflow = "hidden";
    const moreBtn = document.getElementById("wsDescMore");
    moreBtn.style.display = workout.focus && workout.focus.length > 50 ? "" : "none";
    moreBtn.textContent = "more";
    moreBtn.dataset.expanded = "false";
    descEl.style.display = "flex";
  } else {
    descEl.style.display = "none";
  }

  // Exercise list
  const list = document.getElementById("wsExerciseList");
  list.innerHTML = session.exercises
    .map((ex, i) => {
      const workingDone = ex.sets.filter((s) => s.done && !s.isWarmup).length;
      const totalWorking = ex.sets.filter((s) => !s.isWarmup).length;
      const cardLabel = totalWorking > 0 ? `${workingDone}/${totalWorking} sets` : `${ex.sets.filter((s) => s.done).length} sets`;
      const allDone = totalWorking > 0 && workingDone === totalWorking;
      return `<div class="ws-exercise-card" data-ex="${ex.name}">
      <div class="ws-ex-card-info">
        <div class="ws-ex-card-name">${ex.name.replace(/([A-Z])/g, " $1").trim()}</div>
        <div class="ws-ex-card-meta">${cardLabel}</div>
      </div>
      ${allDone ? '<span class="ws-ex-card-done">✓</span>' : '<span class="ws-ex-card-chevron">›</span>'}
    </div>`;
    })
    .join("");

  list.querySelectorAll(".ws-exercise-card").forEach((card) => {
    card.addEventListener("click", () => {
      openExerciseDetail(card.dataset.ex);
    });
  });

  document.getElementById("wsFinishBtn").onclick = (e) => {
    const btn = e.currentTarget;
    btn.style.transform = "scale(0.97)";
    setTimeout(() => { btn.style.transform = "scale(1)"; }, 150);
    finishWorkout();
  };
  document.getElementById("wsCompleteCta").onclick = (e) => {
    const btn = e.currentTarget;
    btn.style.transform = "scale(0.97)";
    setTimeout(() => { btn.style.transform = "scale(1)"; }, 150);
    const session = getTodaySession();
    if (!session) return;
    stopStopwatch();
    session.finishedAt = new Date().toISOString();
    state.planOffset = ((state.planOffset + 1) % ((loadCustomProgram() || plan).length || 1));
    currentWorkoutId = null;
    const todayPRs = getTodayPRs(session.dateKey || getDateKey());
    saveAndRender();
    showEnhancedSummary(todayPRs);
  };
}

// ===== LEVEL 2: EXERCISE DETAIL =====
function openExerciseDetail(exName) {
  currentExName = exName;
  showScreen("screen-ed");
  renderExerciseDetail();
}

function renderExerciseDetail() {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;

  document.getElementById("edName").textContent = currentExName.replace(/([A-Z])/g, " $1").trim();

  const hasDoneSets = ex.sets.some((s) => s.done);
  const needsSetup = !hasDoneSets && !ex.setupDone;

  if (needsSetup) {
    renderExerciseSetup(ex);
    document.getElementById("skipWarmupsBtn").style.display = "none";
    document.getElementById("qaBar").style.display = "none";
    return;
  }

  document.getElementById("qaBar").style.display = "";

  // Auto-generate warmups on first open if enabled
  const lastWorking = [...ex.sets].reverse().find((s) => !s.isWarmup && s.weight && Number(s.weight) > 0);
  if (lastWorking) autoGenerateWarmups(ex, lastWorking.weight);

  // Render new feature cards
  renderPreviousPerformance(currentExName);
  renderTargetCard(currentExName);
  renderSetProgress(ex);

  const skipBtn = document.getElementById("skipWarmupsBtn");
  if (skipBtn) {
    const hasPendingWarmups = ex.sets.some((s) => s.isWarmup && !s.done);
    if (state.autoWarmup && hasPendingWarmups) {
      skipBtn.style.display = "";
      skipBtn.onclick = () => {
        ex.sets.forEach((s) => {
          if (s.isWarmup) {
            s.done = true;
            s.loggedAt = new Date().toISOString();
          }
        });
        saveState();
        renderExerciseDetail();
      };
    } else {
      skipBtn.style.display = "none";
    }
  }

  const container = document.getElementById("edSetList");
  container.innerHTML = renderSetRows(ex);

  // Check completion after sets are rendered
  const completionHtml = renderExerciseCompletion(ex);
  if (completionHtml) container.innerHTML += completionHtml;

  // Click handlers for set rows — always open edit bottom sheet
  container.querySelectorAll(".ed-set-row, .ed-set-working-pending").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("[data-dup-set-id]")) return;
      if (e.target.closest("#edNextExBtn")) return;
      const setId = row.dataset.setId;
      if (!setId) return;
      const set = ex.sets.find((s) => s.id === setId);
      if (!set) return;
      if (set.isWarmup) {
        set.done = !set.done;
        if (set.done) {
          set.loggedAt = new Date().toISOString();
          if (set.weight && Number(set.weight) > 0) startStopwatch();
        } else {
          set.loggedAt = null;
        }
        saveState();
        renderExerciseDetail();
      } else {
        openEditBottomSheet(setId);
      }
    });
  });

  // Next exercise button handler
  const nextBtn = document.getElementById("edNextExBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const session = getTodaySession();
      if (!session) return;
      const idx = session.exercises.indexOf(ex);
      if (idx >= 0 && idx < session.exercises.length - 1) {
        const next = session.exercises.slice(idx + 1).find((e) => e.sets.some((s) => !s.isWarmup && !s.done));
        if (next) openExerciseDetail(next.name);
      }
    });
  }

  // Finish workout button handler (last exercise, manual mode)
  const finishBtn = document.getElementById("edFinishBtn");
  if (finishBtn) {
    finishBtn.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      btn.style.transform = "scale(0.97)";
      setTimeout(() => { btn.style.transform = "scale(1)"; }, 150);
      finishWorkout();
    });
  }

  // Duplicate set buttons
  container.querySelectorAll("[data-dup-set-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      duplicateSet(btn.dataset.dupSetId);
    });
  });

  // Exercise notes
  renderEdNotes(currentExName);
  updateProgressIndicator();
}

function renderExerciseSetup(ex) {
  const isFirstTime = !ex.autoWarmupSet;
  if (isFirstTime) {
    ex.autoWarmup = ex.autoWarmup !== undefined ? ex.autoWarmup : state.autoWarmup !== false && isCompoundExercise(ex.name);
    ex.autoWarmupSet = true;
  }
  const isCompound = isCompoundExercise(ex.name);
  const showWuDefault = ex.autoWarmup !== undefined ? ex.autoWarmup : state.autoWarmup !== false && isCompound;

  // Pre-fill from template sets if available
  const templateSets = ex.sets.filter((s) => !s.isWarmup);
  const defaultReps = templateSets.length > 0 ? templateSets[0].reps || 10 : 10;
  const defaultWeight = templateSets.length > 0 ? templateSets[0].weight || 20 : 20;
  const defaultCount = templateSets.length > 0 ? templateSets.length : 3;

  const compoundTag = isCompound
    ? '<span style="font-size:0.65rem;color:var(--accent);background:rgba(0,210,106,0.1);padding:0.15rem 0.4rem;border-radius:4px;font-weight:600">Compound</span>'
    : '<span style="font-size:0.65rem;color:var(--text-secondary);background:var(--surface-2);padding:0.15rem 0.4rem;border-radius:4px;font-weight:600">Isolation</span>';

  const container = document.getElementById("edSetList");
  container.innerHTML = `
    <div class="ed-setup-card">
      <div class="ed-setup-title">Quick Setup</div>
      <div class="ed-setup-meta">${compoundTag} <span style="font-size:0.72rem;color:var(--text-secondary)">Enter your working weight, sets, and reps</span></div>
      <div class="ed-setup-row">
        <label class="ed-setup-label">Weight (kg)</label>
        <div class="ed-setup-controls">
          <button class="ed-setup-btn" data-setup-adjust="-5" data-setup-field="weight">−5</button>
          <span class="ed-setup-value" id="esWeightVal">${defaultWeight}</span>
          <button class="ed-setup-btn" data-setup-adjust="5" data-setup-field="weight">+5</button>
          <button class="ed-setup-btn" data-setup-adjust="1" data-setup-field="weight">+1</button>
        </div>
      </div>
      <div class="ed-setup-row">
        <label class="ed-setup-label">Reps</label>
        <div class="ed-setup-controls">
          <button class="ed-setup-btn" data-setup-adjust="-1" data-setup-field="reps">−</button>
          <span class="ed-setup-value" id="esRepsVal">${defaultReps}</span>
          <button class="ed-setup-btn" data-setup-adjust="1" data-setup-field="reps">+</button>
        </div>
      </div>
      <div class="ed-setup-row">
        <label class="ed-setup-label">Sets</label>
        <div class="ed-setup-controls">
          <button class="ed-setup-btn" data-setup-adjust="-1" data-setup-field="sets">−</button>
          <span class="ed-setup-value" id="esSetsVal">${defaultCount}</span>
          <button class="ed-setup-btn" data-setup-adjust="1" data-setup-field="sets">+</button>
        </div>
      </div>
      <label class="ed-setup-toggle">
        <input type="checkbox" id="esAutoWarmup" ${showWuDefault ? "checked" : ""} />
        <span class="ed-setup-toggle-track"></span>
        <span>Auto Warm-Up</span>
        ${!isCompound ? '<span style="font-size:0.65rem;color:var(--text-secondary);margin-left:0.25rem">(isolation — not needed)</span>' : ""}
      </label>
      <button class="btn-primary" id="esStartBtn" style="width:100%;margin-top:0.75rem">▶ Start Exercise</button>
    </div>
  `;

  container.querySelectorAll("[data-setup-adjust]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.setupField;
      const adjust = Number(btn.dataset.setupAdjust);
      const el = document.getElementById(`es${field.charAt(0).toUpperCase() + field.slice(1)}Val`);
      let cur = Number(el.textContent);
      const min = field === "weight" ? 0 : 1;
      const max = field === "weight" ? 500 : 50;
      const inc = field === "weight" ? state.weightInc || 1 : state.repInc || 1;
      const step = Math.abs(adjust) === 5 ? inc * 5 : inc;
      if (adjust < 0) cur = Math.max(min, cur - step);
      else cur = Math.min(max, cur + step);
      if (field === "weight") cur = parseFloat(cur.toFixed(2));
      el.textContent = cur;
    });
  });

  document.getElementById("esStartBtn").onclick = () => handleExerciseSetup(ex);
}

function handleExerciseSetup(ex) {
  const weight = Number(document.getElementById("esWeightVal").textContent);
  const reps = Number(document.getElementById("esRepsVal").textContent);
  const setsCount = Number(document.getElementById("esSetsVal").textContent);
  const autoWarmup = document.getElementById("esAutoWarmup").checked;

  ex.autoWarmup = autoWarmup;
  ex.setupDone = true;
  ex.warmupGenerated = false;

  // Clear existing template sets
  ex.sets = [];

  // Generate warm-ups if enabled and compound
  if (autoWarmup && state.autoWarmup !== false) {
    autoGenerateWarmups(ex, weight);
  }

  // Generate working sets
  for (let i = 0; i < setsCount; i++) {
    ex.sets.push({
      id: crypto.randomUUID(),
      reps: reps,
      weight: weight,
      notes: "",
      label: "",
      done: false,
      isWarmup: false,
      loggedAt: null,
    });
  }

  saveState();
  renderExerciseDetail();
}

function repeatLastSet() {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;
  const workingDone = ex.sets.filter((s) => s.done && !s.isWarmup);
  const last = workingDone[workingDone.length - 1];
  if (!last) return;
  ex.sets.push({
    id: crypto.randomUUID(),
    reps: last.reps,
    weight: last.weight,
    notes: last.notes || "",
    label: "",
    done: true,
    isWarmup: false,
    loggedAt: new Date().toISOString(),
  });
  saveState();
  renderExerciseDetail();
}


function duplicateSet(setId) {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;
  const set = ex.sets.find((s) => s.id === setId);
  if (!set) return;
  ex.sets.push({
    id: crypto.randomUUID(),
    reps: set.reps,
    weight: set.weight,
    notes: set.notes || "",
    label: "",
    done: true,
    isWarmup: false,
    loggedAt: new Date().toISOString(),
  });
  saveState();
  renderExerciseDetail();
}

function navigateToNextExercise(ex) {
  const session = getTodaySession();
  if (!session) return;
  const idx = session.exercises.indexOf(ex);
  if (idx < 0 || idx >= session.exercises.length - 1) return;
  const next = session.exercises.slice(idx + 1).find((e) => e.sets.some((s) => !s.isWarmup && !s.done));
  if (next) {
    setTimeout(() => openExerciseDetail(next.name), 1200);
  }
}

function renderSetRows(exercise) {
  const workingSets = exercise.sets.filter((s) => s.done && !s.isWarmup);
  const warmupSets = exercise.sets.filter((s) => s.done && s.isWarmup);
  const pendingWarmups = exercise.sets.filter((s) => !s.done && s.isWarmup);
  const allWarmups = [...warmupSets, ...pendingWarmups];
  const allDone = pendingWarmups.length === 0 && warmupSets.length > 0;

  let html = "";

  // Warm-up status card
  html += renderWarmupStatus(exercise);

  // Warm-up section
  if (allWarmups.length > 0 && !allDone) {
    html += `<div class="ed-section-header"><span class="ed-section-label">Warm-Up</span></div>`;
    pendingWarmups.forEach((set, i) => {
      if (!set.id) set.id = crypto.randomUUID();
      html += `<div class="ed-set-row ed-set-warmup" data-set-id="${set.id}">
        <span class="ed-set-num">W${i + 1}</span>
        <span class="ed-set-reps">${Number(set.reps) || 0}</span>
        <span class="ed-set-weight">${displayWeight(Number(set.weight) || "")}</span>
        <span class="ed-set-wu-label">WARM-UP</span>
      </div>`;
    });
    warmupSets.forEach((set, i) => {
      if (!set.id) set.id = crypto.randomUUID();
      html += `<div class="ed-set-row ed-set-warmup is-done" data-set-id="${set.id}">
        <span class="ed-set-num">W${i + 1}</span>
        <span class="ed-set-reps">${Number(set.reps) || 0}</span>
        <span class="ed-set-weight">${displayWeight(Number(set.weight) || "")}</span>
        <span class="ed-set-wu-label">WARM-UP ✓</span>
      </div>`;
    });
  }

  // Working sets with completion indicators
  const allWorking = exercise.sets.filter((s) => !s.isWarmup);
  if (allWorking.length > 0) {
    html += `<div class="ed-section-header"><span class="ed-section-label">Working Sets</span></div>`;
    allWorking.forEach((set, i) => {
      if (!set.id) set.id = crypto.randomUUID();
      const isDone = set.done;
      const reps = Number(set.reps) || 0;
      const weight = Number(set.weight) || 0;
      const checkmark = isDone ? "✓" : "○";
      const cls = isDone ? "ed-set-row" : "ed-set-row ed-set-working-pending";
      const rpeStr = isDone && set.rpe ? `RPE ${set.rpe}` : "";
      const noteStr = isDone && set.note ? `${set.note}` : "";
      html += `<div class="${cls}" data-set-id="${set.id}">
        <span class="ed-set-check">${checkmark}</span>
        <span class="ed-set-num">${i + 1}</span>
        <span class="ed-set-reps">${reps}</span>
        <span class="ed-set-weight">${displayWeight(weight)}</span>
        ${isDone ? `<span class="ed-set-meta">${rpeStr}${noteStr ? " · " + noteStr : ""}</span>` : '<span class="ed-set-working-label">SET</span>'}
        ${isDone ? '<button class="ed-set-dup-btn" data-dup-set-id="' + set.id + '">⧉</button>' : ""}
      </div>`;
    });
  }

  if (allWarmups.length === 0 && allWorking.length === 0) {
    html = `<p class="ed-empty">No sets yet.</p>`;
  }

  return html;
}


// ===== LEVEL 3A: ADD SET =====
function openAddSetModal() {
  addSetReps = 10;
  addSetWeight = 0;

  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (ex && ex.sets.length > 0) {
    const lastDone = [...ex.sets].reverse().find((s) => s.done);
    if (lastDone) {
      addSetReps = lastDone.reps || 10;
      addSetWeight = Number(lastDone.weight) || 0;
    }
  }

  document.getElementById("asExName").textContent = currentExName.replace(/([A-Z])/g, " $1").trim();
  document.getElementById("asRepsValue").textContent = addSetReps;
  document.getElementById("asWeightValue").textContent = addSetWeight;
  document.getElementById("bsAddSet").classList.remove("is-hidden");
}

function closeAddSetModal() {
  document.getElementById("bsAddSet").classList.add("is-hidden");
}

function saveAddSet() {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;

  const reps = addSetReps;
  const weight = addSetWeight;

  ex.sets.push({
    id: crypto.randomUUID(),
    reps,
    weight,
    notes: "",
    label: "",
    done: true,
    isWarmup: false,
    loggedAt: new Date().toISOString(),
  });

  // Auto-generate warmups based on this working set
  autoGenerateWarmups(ex, weight);

  saveState();
  startStopwatch();
  if (weight > 0) {
    try {
      const newPRs = detectPR(currentExName, weight, reps, session.id || "", getDateKey());
      if (newPRs) showPRToast(newPRs);
    } catch (e) { /* PR detection failed, continue */ }
  }
  if (state.autoRest) startRestTimer();

  closeAddSetModal();
  renderExerciseDetail();
  if (state.autoNext) {
    const pending = ex.sets.filter((s) => !s.isWarmup && !s.done);
    if (pending.length === 0) navigateToNextExercise(ex);
  }
  if (isWorkoutComplete()) triggerWorkoutComplete();
}

// ===== LEVEL 3C: EDIT SET BOTTOM SHEET =====
let editSetReps = 10;
let editSetWeight = 0;

let editSetId = null;

function openEditBottomSheet(setId) {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;
  const set = ex.sets.find((s) => s.id === setId);
  if (!set) return;

  editSetId = setId;
  editSetReps = Number(set.reps) || 10;
  editSetWeight = Number(set.weight) || 0;

  document.getElementById("esExName").textContent = currentExName.replace(/([A-Z])/g, " $1").trim();
  updateEditSetRepsDisplay();
  updateEditSetWeightDisplay();
  document.getElementById("bsEditSet").classList.remove("is-hidden");
}

function updateEditSetRepsDisplay() {
  document.getElementById("esRepsValue").textContent = editSetReps;
}
function updateEditSetWeightDisplay() {
  document.getElementById("esWeightValue").textContent = editSetWeight;
}

function closeEditBottomSheet() {
  document.getElementById("bsEditSet").classList.add("is-hidden");
  editSetId = null;
}

function completeSetFromSheet() {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;
  const set = ex.sets.find((s) => s.id === editSetId);
  if (!set) return;

  set.reps = editSetReps;
  set.weight = editSetWeight;
  set.done = true;
  set.loggedAt = set.loggedAt || new Date().toISOString();
  if (Number(set.weight) > 0 && !session.duration) startStopwatch();

  saveState();

  // PR detection
  if (Number(set.weight) > 0) {
    try {
      const newPRs = detectPR(currentExName, Number(set.weight), Number(set.reps) || 0, session?.id || "", getDateKey());
      if (newPRs) showPRToast(newPRs);
    } catch (e) { /* PR detection failed, continue */ }
  }

  closeEditBottomSheet();
  if (Number(set.weight) > 0 && state.autoRest) startRestTimer();
  renderExerciseDetail();
  const el = document.querySelector(`[data-set-id="${editSetId}"]`);
  if (el) {
    el.style.transform = "scale(1.03)";
    el.style.transition = "transform 0.15s ease";
    setTimeout(() => { el.style.transform = "scale(1)"; }, 150);
  }
  if (state.autoNext) {
    const pending = ex.sets.filter((s) => !s.isWarmup && !s.done);
    if (pending.length === 0) navigateToNextExercise(ex);
    if (isWorkoutComplete()) triggerWorkoutComplete();
  }
}

function deleteSetFromSheet() {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;
  const idx = ex.sets.findIndex((s) => s.id === editSetId);
  if (idx >= 0) ex.sets.splice(idx, 1);
  saveState();
  closeEditBottomSheet();
  renderExerciseDetail();
}

// ===== WORKOUT COMPLETION (V2 Unified) =====
function isWorkoutComplete() {
  const session = getTodaySession();
  if (!session || !session.exercises.length) return false;
  for (const ex of session.exercises) {
    const workSets = ex.sets.filter((s) => !s.isWarmup);
    if (workSets.length === 0) return false;
    if (!workSets.every((s) => s.done)) return false;
  }
  return true;
}

function triggerWorkoutComplete() {
  const session = getTodaySession();
  if (!session) return;
  if (!state.autoSummary) {
    const banner = document.getElementById("wsCompleteBanner");
    if (banner) banner.classList.remove("is-hidden");
    return;
  }
  stopStopwatch();
  session.finishedAt = new Date().toISOString();
  state.planOffset = ((state.planOffset + 1) % ((loadCustomProgram() || plan).length || 1));
  currentWorkoutId = null;
  saveAndRender();
  const todayPRs = getTodayPRs(session.dateKey || getDateKey());
  showEnhancedSummary(todayPRs);
}

function finishWorkout() {
  const session = getTodaySession();
  if (!session) return;
  if (!isWorkoutComplete()) {
    showFinishConfirm();
    return;
  }
  doFinishWorkout();
}
function showFinishConfirm() {
  const existing = document.querySelector(".confirm-overlay");
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-card">
      <div class="confirm-title">Workout Not Complete</div>
      <div class="confirm-text">You still have unfinished exercises or sets. Are you sure you want to finish this workout?</div>
      <div class="confirm-actions">
        <button class="btn-primary" id="finishConfirmContinue">Continue Workout</button>
        <button class="btn-secondary" id="finishConfirmAnyway">Finish Anyway</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("finishConfirmContinue").addEventListener("click", () => overlay.remove());
  document.getElementById("finishConfirmAnyway").addEventListener("click", () => {
    overlay.remove();
    doFinishWorkout();
  });
}
function doFinishWorkout() {
  const session = getTodaySession();
  if (!session) return;
  stopStopwatch();
  session.finishedAt = new Date().toISOString();
  state.planOffset = ((state.planOffset + 1) % ((loadCustomProgram() || plan).length || 1));
  currentWorkoutId = null;
  // Update streak
  if (!state.workoutStreak) {
    state.workoutStreak = { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
  }
  const today = new Date().toDateString();
  const lastDate = state.workoutStreak.lastWorkoutDate;
  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastDate === yesterday) {
      state.workoutStreak.currentStreak = (state.workoutStreak.currentStreak || 0) + 1;
    } else {
      state.workoutStreak.currentStreak = 1;
    }
    if (state.workoutStreak.currentStreak > (state.workoutStreak.longestStreak || 0)) {
      state.workoutStreak.longestStreak = state.workoutStreak.currentStreak;
    }
    state.workoutStreak.lastWorkoutDate = today;
  }
  saveAndRender();
  const todayPRs = getTodayPRs(session.dateKey || getDateKey());
  showEnhancedSummary(todayPRs);
}

function calculateWorkoutScore(session) {
  if (!session || !session.exercises || !session.exercises.length) return 0;
  let totalSets = 0, doneSets = 0, totalExercises = 0, fullExercises = 0, totalWeightedSets = 0, loggedSets = 0;
  for (const ex of session.exercises) {
    const workSets = ex.sets.filter((s) => !s.isWarmup);
    if (!workSets.length) continue;
    totalExercises++;
    let exAllDone = true;
    for (const s of workSets) {
      totalSets++;
      if (s.done) {
        doneSets++;
        totalWeightedSets++;
        if (Number(s.weight) > 0 && Number(s.reps) > 0) {
          loggedSets++;
        }
      } else {
        exAllDone = false;
      }
    }
    if (exAllDone) fullExercises++;
  }
  const completion = totalSets > 0 ? (doneSets / totalSets) * 40 : 0;
  const exerciseComp = totalExercises > 0 ? (fullExercises / totalExercises) * 30 : 0;
  const accuracy = totalWeightedSets > 0 ? (loggedSets / totalWeightedSets) * 10 : 0;
  const streak = getStreak();
  const consistency = Math.min(streak, 30) / 30 * 20;
  return Math.round(completion + exerciseComp + accuracy + consistency);
}

// ===== SESSION SUMMARY (V2 Single Screen) =====
function getKnownMuscle(name) {
  const lower = name.toLowerCase();
  const map = {
    "bench press":"Chest", push:"Chest", press:"Shoulders", "dumbbell press":"Chest",
    deadlift:"Back", row:"Back", pulldown:"Back", pull:"Back", "face pull":"Rear Delts",
    curl:"Biceps", tricep:"Triceps", squat:"Quads", leg:"Legs", lunge:"Legs",
    calf:"Calves", raise:"Shoulders", fly:"Chest", extension:"Triceps",
  };
  for (const [kw, muscle] of Object.entries(map)) {
    if (lower.includes(kw)) return muscle;
  }
  return null;
}

function showEnhancedSummary(newPRs) {
  const session = state.sessions.find((item) => item.dateKey === getDateKey());
  if (!session) return;

  let totalSets = 0, totalReps = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.isWarmup) continue;
      if (set.done && Number(set.weight) > 0) {
        totalSets++;
        totalReps += Number(set.reps) || 0;
      }
    }
  }
  const elapsed = session.duration || 0;
  const duration = elapsed > 0 ? formatStopwatch(elapsed) : "--:--";
  const score = calculateWorkoutScore(session);
  session.qualityScore = score;
  saveState();

  document.getElementById("ssTitle").textContent = "💪 Workout Complete";
  document.getElementById("ssSubtitle").textContent = `${session.workoutName || "Workout"} · ${duration}`;
  const scoreColor = score >= 80 ? "var(--accent)" : score >= 60 ? "var(--yellow)" : "var(--red)";
  document.getElementById("ssGrid").innerHTML = `
    <div class="ss-item"><span class="ss-item-val">${totalSets}</span><span class="ss-item-lbl">Sets</span></div>
    <div class="ss-item"><span class="ss-item-val">${totalReps}</span><span class="ss-item-lbl">Reps</span></div>
    <div class="ss-item"><span class="ss-item-val">${duration}</span><span class="ss-item-lbl">Duration</span></div>
    <div class="ss-item"><span class="ss-item-val" style="color:${scoreColor}">${score}</span><span class="ss-item-lbl">Score</span></div>
  `;

  // PRs: only weight & reps, max 5
  const prTypes = ["weight", "reps"];
  const filteredPRs = newPRs.filter((pr) => prTypes.includes(pr.type)).slice(0, 5);
  const prHtml = filteredPRs.length
    ? `<div class="ss-section-title">🏆 PRs</div>` + filteredPRs.map((pr) => {
        const typeLabel = pr.type === "weight" ? "Weight PR" : "Rep PR";
        const exName = (pr.exerciseName || "").replace(/([A-Z])/g, " $1").trim();
        return `<div class="ss-pr-item"><span class="ss-pr-label">${typeLabel}</span><span class="ss-pr-detail">${exName} · ${pr.weight} kg × ${pr.reps}</span></div>`;
      }).join("")
    : "";
  document.getElementById("ssPrList").innerHTML = prHtml;

  // Muscle chips (max 4 visible, overflow shows +N)
  const exNames = session.exercises.filter((ex) => ex.sets.some((s) => s.done)).map((ex) => ex.name);
  const trainedMuscles = [...new Set(exNames.map((n) => getKnownMuscle(n)).filter(Boolean))];
  const mc = document.getElementById("ssMuscles");
  if (trainedMuscles.length) {
    const visible = trainedMuscles.slice(0, 4);
    const extra = trainedMuscles.length - 4;
    mc.innerHTML = visible.map((m) => `<span class="ss-muscle-chip">${m}</span>`).join("") +
      (extra > 0 ? `<span class="ss-muscle-chip ss-muscle-chip-extra">+${extra}</span>` : "");
  } else {
    mc.innerHTML = "";
  }

  // Recovery Impact (top 3 hardest-hit muscles)
  const riContainer = document.getElementById("ssRecoveryImpact");
  const riList = document.getElementById("ssRecoveryList");
  if (state.recoveryAnalysis !== false && trainedMuscles.length) {
    const weekSummary = computeMuscleSummary("week");
    const impacted = trainedMuscles.map((name) => {
      const mg = MUSCLE_GROUPS.find((m) => m.label === name);
      if (!mg) return null;
      const data = weekSummary[mg.id];
      const sets = data ? data.weeklySets : 0;
      const days = data ? getRecoveryDays(data.lastTrained) : 99;
      const level = getRecoveryLevel(days, sets);
      const scores = { fatigued: 3, recovering: 2, recovered: 1 };
      return { name, level, score: scores[level] || 0 };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 3);
    if (impacted.length) {
      const riConfig = { fatigued: { color: "var(--red)", label: "Fatigued" }, recovering: { color: "var(--yellow)", label: "Recovering" }, recovered: { color: "var(--accent)", label: "Recovered" } };
      riList.innerHTML = impacted.map((m) => {
        const cfg = riConfig[m.level];
        return `<div class="ss-ri-item"><span class="ss-ri-dot" style="background:${cfg.color}"></span><span class="ss-ri-name">${m.name}</span><span class="ss-ri-label" style="color:${cfg.color}">${cfg.label}</span></div>`;
      }).join("");
      riContainer.style.display = "";
    } else {
      riContainer.style.display = "none";
    }
  } else {
    riContainer.style.display = "none";
  }

  // Inline notes
  document.getElementById("ssNotesInput").value = session.notes || "";

  // Actions
  document.getElementById("ssSkipCoolDown").onclick = () => {
    if (session.notes !== undefined) {
      session.notes = document.getElementById("ssNotesInput").value || "";
      saveState();
    }
    const overlay = document.getElementById("sessionSummaryOverlay");
    overlay.classList.remove("is-celebrating");
    overlay.classList.add("is-hidden");
    finishWorkoutComplete();
  };
  document.getElementById("ssStartCoolDown").onclick = () => {
    if (session.notes !== undefined) {
      session.notes = document.getElementById("ssNotesInput").value || "";
      saveState();
    }
    const overlay = document.getElementById("sessionSummaryOverlay");
    overlay.classList.remove("is-celebrating");
    overlay.classList.add("is-hidden");
    openCoolDown();
  };

  const overlay = document.getElementById("sessionSummaryOverlay");
  overlay.classList.toggle("is-celebrating", filteredPRs.length > 0);
  overlay.classList.remove("is-hidden");
}



// ===== EXERCISE ANALYTICS =====
let analyticsExName = "";
let analyticsChart = null;

function showExerciseAnalytics(exName) {
  analyticsExName = exName;
  document.getElementById("eaTitle").textContent = exName.replace(/([A-Z])/g, " $1").trim();
  activateTab("sets");
  showScreen("screen-exercise-analytics");
  renderExerciseAnalyticsTab("overview");
}

function renderExerciseAnalyticsTab(tab) {
  document.querySelectorAll(".ea-tab").forEach((t) => t.classList.toggle("is-active", t.dataset.eaTab === tab));
  const container = document.getElementById("eaContent");
  if (tab === "overview") renderEaOverview(container);
  else if (tab === "volume") renderEaVolume(container);
  else if (tab === "strength") renderEaStrength(container);
  else if (tab === "history") renderEaHistory(container);
}

function renderEaOverview(container) {
  const history = getExerciseHistory(analyticsExName);
  const lifetime = getLifetimeVolume(analyticsExName);
  const prData = getPRsForExercise(analyticsExName);
  const latest = history[history.length - 1] || null;
  const prevMonth = history.filter((h) => h.date >= getDateKey(new Date(Date.now() - 30 * 86400000)));
  const monthChange = prevMonth.length >= 2 ? prevMonth[prevMonth.length - 1].totalVolume - prevMonth[0].totalVolume : null;

  container.innerHTML = `
    <div class="ea-grid">
      <div class="ea-card"><div class="ea-card-title">Best Weight</div><div class="ea-card-val">${prData.weightPR ? displayWeight(prData.weightPR.value) : "—"}</div></div>
      <div class="ea-card"><div class="ea-card-title">e1RM</div><div class="ea-card-val">${prData.est1RM ? displayWeight(prData.est1RM.value) : "—"}</div></div>
      <div class="ea-card"><div class="ea-card-title">Best Set Vol</div><div class="ea-card-val">${prData.volumePR ? displayWeight(prData.volumePR.value) : "—"}</div></div>
      <div class="ea-card"><div class="ea-card-title">Lifetime Vol</div><div class="ea-card-val">${lifetime.volume >= 1000 ? (lifetime.volume / 1000).toFixed(1) + "k" : lifetime.volume || "—"}</div></div>
    </div>
    ${latest ? `<div class="ea-card"><div class="ea-card-title">Last Performed</div><div class="ea-card-val">${latest.workoutName}</div><div class="ea-card-sub">${formatReadableDate(parseDateKey(latest.date))} · ${displayWeight(latest.bestWeight)} best set</div></div>` : ""}
    ${monthChange !== null ? `<div class="ea-card"><div class="ea-card-title">30-Day Volume Change</div><div class="ea-card-val" style="color:${monthChange >= 0 ? "var(--accent)" : "var(--red)"}">${monthChange >= 0 ? "+" : ""}${(monthChange / 1000).toFixed(1)}k kg</div></div>` : ""}
  `;
}

function renderEaVolume(container) {
  const history = getExerciseHistory(analyticsExName);
  const filtered = history.filter((h) => h.totalVolume > 0);
  container.innerHTML = `<div class="ea-chart-wrap"><canvas id="eaVolChart"></canvas></div>`;
  if (filtered.length < 2) {
    container.innerHTML = `<p style="font-size:0.75rem;color:var(--text-secondary);padding:1rem;text-align:center">Complete at least 2 sessions to see volume trend.</p>`;
    return;
  }
  if (typeof Chart === "undefined") {
    container.innerHTML = `<p style="font-size:0.75rem;color:var(--text-secondary);padding:1rem;text-align:center">Loading chart…</p>`;
    loadChartJS().then(() => renderEaVolume(container)).catch(() => {});
    return;
  }
  if (analyticsChart) {
    analyticsChart.destroy();
    analyticsChart = null;
  }
  const ctx = document.getElementById("eaVolChart").getContext("2d");
  analyticsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: filtered.map((h) => {
        const d = parseDateKey(h.date);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }),
      datasets: [
        {
          label: "Volume (kg)",
          data: filtered.map((h) => h.totalVolume),
          backgroundColor: "rgba(0,210,106,0.5)",
          borderColor: "#00d26a",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#737373", font: { size: 9 } } },
        y: { grid: { color: "#1e1e1e" }, ticks: { color: "#737373", font: { size: 9 } } },
      },
    },
  });
}

function renderEaStrength(container) {
  const history = getExerciseHistory(analyticsExName);
  const filtered = history.filter((h) => h.est1RM > 0);
  container.innerHTML = `<div class="ea-chart-wrap"><canvas id="eaStrChart"></canvas></div>`;
  if (filtered.length < 2) {
    container.innerHTML = `<p style="font-size:0.75rem;color:var(--text-secondary);padding:1rem;text-align:center">Complete at least 2 sessions to see strength trend.</p>`;
    return;
  }
  if (typeof Chart === "undefined") {
    container.innerHTML = `<p style="font-size:0.75rem;color:var(--text-secondary);padding:1rem;text-align:center">Loading chart…</p>`;
    loadChartJS().then(() => renderEaStrength(container)).catch(() => {});
    return;
  }
  if (analyticsChart) {
    analyticsChart.destroy();
    analyticsChart = null;
  }
  const ctx = document.getElementById("eaStrChart").getContext("2d");
  analyticsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: filtered.map((h) => {
        const d = parseDateKey(h.date);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }),
      datasets: [
        {
          label: "e1RM (kg)",
          data: filtered.map((h) => h.est1RM),
          borderColor: "#00d26a",
          backgroundColor: "rgba(0,210,106,0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: "#00d26a",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#737373", font: { size: 9 } } },
        y: { grid: { color: "#1e1e1e" }, ticks: { color: "#737373", font: { size: 9 } } },
      },
    },
  });
}

function renderEaHistory(container) {
  const history = getExerciseHistory(analyticsExName);
  if (!history.length) {
    container.innerHTML = `<p class="empty-state">No history for this exercise yet.</p>`;
    return;
  }
  container.innerHTML = history
    .slice()
    .reverse()
    .map(
      (h) => `
    <div class="ea-history-item">
      <div>
        <div class="ea-history-date">${formatReadableDate(parseDateKey(h.date))} · ${h.workoutName}</div>
        <div style="font-size:0.72rem;color:var(--text-secondary)">${h.sets} sets · ${h.totalReps} reps · ${h.totalVolume >= 1000 ? (h.totalVolume / 1000).toFixed(1) + "k" : h.totalVolume} kg</div>
      </div>
      <div class="ea-history-stat">${h.bestWeight} kg</div>
    </div>
  `,
    )
    .join("");
}

// ===== GOAL TRACKING =====
function getGoalProgress(goal) {
  if (goal.type === "weight") {
    const entry = typeof latestWeight === "function" ? latestWeight() : null;
    const weight = entry ? entry.weight : null;
    return weight ? Math.min(100, Math.round((weight / goal.target) * 100)) : 0;
  }
  if (goal.type === "bench" || goal.type === "squat" || goal.type === "deadlift") {
    const nameMap = { bench: "Flat Barbell Bench Press", squat: "Barbell Back Squat", deadlift: "Conventional Deadlift" };
    const exName = nameMap[goal.type] || goal.name;
    const prData = getPRsForExercise(exName);
    return prData.weightPR ? Math.min(100, Math.round((prData.weightPR.value / goal.target) * 100)) : 0;
  }
  if (goal.type === "frequency") {
    const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
    return Math.min(100, Math.round((weekSessions.length / goal.target) * 100));
  }
  if (goal.type === "custom") {
    const prData = getPRsForExercise(goal.name);
    return prData.weightPR ? Math.min(100, Math.round((prData.weightPR.value / goal.target) * 100)) : 0;
  }
  return 0;
}

function getGoalValue(goal) {
  if (goal.type === "weight") {
    const entry = typeof latestWeight === "function" ? latestWeight() : null;
    return entry ? entry.weight : 0;
  }
  if (goal.type === "bench" || goal.type === "squat" || goal.type === "deadlift") {
    const nameMap = { bench: "Flat Barbell Bench Press", squat: "Barbell Back Squat", deadlift: "Conventional Deadlift" };
    const exName = nameMap[goal.type] || goal.name;
    const prData = getPRsForExercise(exName);
    return prData.weightPR ? prData.weightPR.value : 0;
  }
  if (goal.type === "frequency") {
    return state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000))).length;
  }
  if (goal.type === "custom") {
    const prData = getPRsForExercise(goal.name);
    return prData.weightPR ? prData.weightPR.value : 0;
  }
  return 0;
}

function renderGoals() {
  const container = document.getElementById("goalsContent");
  if (!container) return;
  const goals = state.goals || [];
  const goalLabels = { weight: "Body Weight", bench: "Bench Press", squat: "Squat", deadlift: "Deadlift", frequency: "Weekly Sessions", custom: "Custom" };

  let html = goals.length
    ? goals
        .map((goal, i) => {
          const pct = getGoalProgress(goal);
          const current = getGoalValue(goal);
          const target = goal.target;
          return `<div class="goal-card" data-goal-index="${i}">
          <div class="goal-card-header">
            <span class="goal-card-name">${goalLabels[goal.type] || goal.name}</span>
            <span class="goal-card-target">${current} / ${target} ${goal.type === "frequency" ? "sessions" : "kg"}</span>
          </div>
          <div class="goal-bar-wrap"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
          <div class="goal-bar-pct">${pct}%</div>
        </div>`;
        })
        .join("")
    : `<div class="empty-state" style="padding:1.5rem 0">
      <div class="empty-state-icon">🎯</div>
      <div class="empty-state-title">No Goals Set</div>
      <div class="empty-state-text">Set a goal to track your progress toward a specific weight, lift, or habit.</div>
    </div>`;

  html += `<button class="goal-add-btn" id="goalAddBtn">${goals.length ? "+ Add Goal" : "Set Your First Goal"}</button>`;
  container.innerHTML = html;

  container.querySelectorAll(".goal-card").forEach((card) => {
    card.addEventListener("click", () => {
      const i = Number(card.dataset.goalIndex);
      const goal = state.goals[i];
      if (!goal) return;
      openGoalEditor(i);
    });
  });
  const addBtn = document.getElementById("goalAddBtn");
  if (addBtn) addBtn.addEventListener("click", () => openGoalEditor(-1));
}

let editingGoalIndex = -1;

function openGoalEditor(index) {
  editingGoalIndex = index;
  if (index >= 0) {
    const goal = state.goals[index];
    document.getElementById("goalEditorName").value = goal.name || "";
    document.getElementById("goalEditorTarget").value = goal.target || "";
    document.getElementById("goalEditorDelete").style.display = "block";
  } else {
    document.getElementById("goalEditorName").value = "";
    document.getElementById("goalEditorTarget").value = "";
    document.getElementById("goalEditorDelete").style.display = "none";
  }
  document.getElementById("goalEditorModal").classList.remove("is-hidden");
}

function saveGoal() {
  const name = document.getElementById("goalEditorName").value.trim();
  const target = Number(document.getElementById("goalEditorTarget").value);
  if (!name || !target) return;

  // Auto-detect type
  const lower = name.toLowerCase();
  let type = "custom";
  if (lower.includes("weight") || lower.includes("body")) type = "weight";
  else if (lower.includes("bench")) type = "bench";
  else if (lower.includes("squat")) type = "squat";
  else if (lower.includes("deadlift")) type = "deadlift";
  else if (lower.includes("session") || lower.includes("week")) type = "frequency";

  const goal = { name, target, type, createdAt: new Date().toISOString() };

  if (editingGoalIndex >= 0) {
    state.goals[editingGoalIndex] = goal;
  } else {
    if (!state.goals) state.goals = [];
    state.goals.push(goal);
  }
  saveState();
  document.getElementById("goalEditorModal").classList.add("is-hidden");
  renderGoals();
}

function deleteGoal() {
  if (editingGoalIndex >= 0) {
    state.goals.splice(editingGoalIndex, 1);
    saveState();
    document.getElementById("goalEditorModal").classList.add("is-hidden");
    renderGoals();
  }
}

// ===== SMART WORKOUT BUILDER =====
const BUILDER_TEMPLATES = {
  "build-muscle": {
    splits: {
      3: ["Push", "Pull", "Legs"],
      4: ["Upper", "Lower", "Push", "Pull"],
      5: ["Push", "Pull", "Legs", "Upper", "Lower"],
      6: ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body"],
    },
    exercises: {
      Push: [
        { name: "Flat Barbell Bench Press", sets: 4, reps: "8-12" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
        { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15" },
        { name: "Tricep Rope Pushdown", sets: 3, reps: "12-15" },
        { name: "Overhead Tricep Extension", sets: 3, reps: "10-12" },
      ],
      Pull: [
        { name: "Lat Pulldown", sets: 4, reps: "8-12" },
        { name: "Seated Cable Row", sets: 3, reps: "10-12" },
        { name: "Face Pulls", sets: 3, reps: "15-20" },
        { name: "Dumbbell Curl", sets: 3, reps: "10-12" },
        { name: "Hammer Curl", sets: 3, reps: "10-12" },
      ],
      Legs: [
        { name: "Barbell Back Squat", sets: 4, reps: "8-10" },
        { name: "Romanian Deadlift", sets: 3, reps: "10-12" },
        { name: "Leg Press", sets: 3, reps: "10-12" },
        { name: "Walking Lunges", sets: 3, reps: "10-12" },
        { name: "Standing Calf Raise", sets: 3, reps: "12-15" },
      ],
      Upper: [
        { name: "Flat Barbell Bench Press", sets: 4, reps: "8-12" },
        { name: "Bent Over Row", sets: 4, reps: "8-12" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
        { name: "Lat Pulldown", sets: 3, reps: "10-12" },
        { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15" },
        { name: "Dumbbell Curl", sets: 3, reps: "10-12" },
        { name: "Tricep Rope Pushdown", sets: 3, reps: "12-15" },
      ],
      Lower: [
        { name: "Barbell Back Squat", sets: 4, reps: "8-10" },
        { name: "Romanian Deadlift", sets: 3, reps: "10-12" },
        { name: "Leg Press", sets: 3, reps: "10-12" },
        { name: "Leg Curl", sets: 3, reps: "10-12" },
        { name: "Standing Calf Raise", sets: 3, reps: "12-15" },
      ],
      "Full Body": [
        { name: "Barbell Back Squat", sets: 3, reps: "8-10" },
        { name: "Flat Barbell Bench Press", sets: 3, reps: "8-12" },
        { name: "Bent Over Row", sets: 3, reps: "8-12" },
        { name: "Overhead Press", sets: 3, reps: "8-12" },
        { name: "Dumbbell Curl", sets: 2, reps: "10-12" },
      ],
    },
  },
  strength: {
    splits: { 3: ["Push", "Pull", "Legs"], 4: ["Upper", "Lower", "Push", "Pull"], 5: ["Heavy Upper", "Heavy Lower", "Push", "Pull", "Full Body"] },
    exercises: {
      Push: [
        { name: "Flat Barbell Bench Press", sets: 5, reps: "3-5" },
        { name: "Overhead Press", sets: 4, reps: "3-5" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "6-8" },
        { name: "Tricep Rope Pushdown", sets: 3, reps: "8-10" },
      ],
      Pull: [
        { name: "Conventional Deadlift", sets: 4, reps: "3-5" },
        { name: "Weighted Pull-Up", sets: 4, reps: "4-6" },
        { name: "Barbell Row", sets: 4, reps: "5-7" },
        { name: "Face Pulls", sets: 3, reps: "12-15" },
      ],
      Legs: [
        { name: "Barbell Back Squat", sets: 5, reps: "3-5" },
        { name: "Romanian Deadlift", sets: 4, reps: "5-7" },
        { name: "Leg Press", sets: 3, reps: "8-10" },
        { name: "Standing Calf Raise", sets: 3, reps: "10-12" },
      ],
      Upper: [
        { name: "Flat Barbell Bench Press", sets: 5, reps: "3-5" },
        { name: "Weighted Pull-Up", sets: 4, reps: "4-6" },
        { name: "Overhead Press", sets: 4, reps: "3-5" },
        { name: "Barbell Row", sets: 4, reps: "5-7" },
        { name: "Dumbbell Curl", sets: 3, reps: "8-10" },
      ],
      Lower: [
        { name: "Barbell Back Squat", sets: 5, reps: "3-5" },
        { name: "Conventional Deadlift", sets: 4, reps: "3-5" },
        { name: "Leg Press", sets: 3, reps: "8-10" },
        { name: "Leg Curl", sets: 3, reps: "8-10" },
      ],
      "Heavy Upper": [
        { name: "Flat Barbell Bench Press", sets: 5, reps: "3-5" },
        { name: "Weighted Pull-Up", sets: 4, reps: "4-6" },
        { name: "Overhead Press", sets: 4, reps: "5-7" },
        { name: "Barbell Row", sets: 4, reps: "5-7" },
        { name: "Face Pulls", sets: 3, reps: "12-15" },
      ],
      "Heavy Lower": [
        { name: "Barbell Back Squat", sets: 5, reps: "3-5" },
        { name: "Romanian Deadlift", sets: 4, reps: "5-7" },
        { name: "Leg Press", sets: 4, reps: "8-10" },
        { name: "Standing Calf Raise", sets: 3, reps: "10-12" },
      ],
      "Full Body": [
        { name: "Barbell Back Squat", sets: 4, reps: "3-5" },
        { name: "Flat Barbell Bench Press", sets: 4, reps: "3-5" },
        { name: "Bent Over Row", sets: 4, reps: "5-7" },
        { name: "Overhead Press", sets: 3, reps: "5-7" },
      ],
    },
  },
  "fat-loss": {
    splits: { 3: ["Full Body", "Full Body", "Full Body"], 4: ["Upper", "Lower", "Full Body", "Full Body"], 5: ["Upper", "Lower", "Push", "Pull", "Full Body"] },
    exercises: {
      "Full Body": [
        { name: "Barbell Back Squat", sets: 3, reps: "10-12" },
        { name: "Flat Barbell Bench Press", sets: 3, reps: "10-12" },
        { name: "Bent Over Row", sets: 3, reps: "10-12" },
        { name: "Overhead Press", sets: 3, reps: "10-12" },
        { name: "Farmer's Carry", sets: 3, reps: "30s" },
      ],
      Upper: [
        { name: "Flat Barbell Bench Press", sets: 3, reps: "10-12" },
        { name: "Bent Over Row", sets: 3, reps: "10-12" },
        { name: "Overhead Press", sets: 3, reps: "10-12" },
        { name: "Lat Pulldown", sets: 3, reps: "10-12" },
        { name: "Dumbbell Curl", sets: 2, reps: "12-15" },
      ],
      Lower: [
        { name: "Barbell Back Squat", sets: 3, reps: "10-12" },
        { name: "Romanian Deadlift", sets: 3, reps: "10-12" },
        { name: "Leg Press", sets: 3, reps: "12-15" },
        { name: "Walking Lunges", sets: 3, reps: "10-12" },
      ],
      Push: [
        { name: "Flat Barbell Bench Press", sets: 3, reps: "10-12" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "12-15" },
        { name: "Dumbbell Lateral Raise", sets: 3, reps: "15-20" },
        { name: "Tricep Rope Pushdown", sets: 3, reps: "12-15" },
      ],
      Pull: [
        { name: "Lat Pulldown", sets: 3, reps: "10-12" },
        { name: "Seated Cable Row", sets: 3, reps: "10-12" },
        { name: "Face Pulls", sets: 3, reps: "15-20" },
        { name: "Dumbbell Curl", sets: 3, reps: "12-15" },
      ],
    },
  },
  general: {
    splits: { 3: ["Full Body", "Full Body", "Full Body"], 4: ["Upper", "Lower", "Upper", "Lower"], 5: ["Push", "Pull", "Legs", "Upper", "Lower"] },
    exercises: {
      "Full Body": [
        { name: "Barbell Back Squat", sets: 3, reps: "8-12" },
        { name: "Flat Barbell Bench Press", sets: 3, reps: "8-12" },
        { name: "Bent Over Row", sets: 3, reps: "8-12" },
        { name: "Overhead Press", sets: 2, reps: "8-12" },
        { name: "Dumbbell Curl", sets: 2, reps: "10-15" },
      ],
      Upper: [
        { name: "Flat Barbell Bench Press", sets: 3, reps: "8-12" },
        { name: "Bent Over Row", sets: 3, reps: "8-12" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
        { name: "Lat Pulldown", sets: 3, reps: "10-12" },
        { name: "Dumbbell Lateral Raise", sets: 2, reps: "12-15" },
        { name: "Dumbbell Curl", sets: 2, reps: "10-12" },
      ],
      Lower: [
        { name: "Barbell Back Squat", sets: 3, reps: "8-12" },
        { name: "Romanian Deadlift", sets: 3, reps: "8-12" },
        { name: "Leg Press", sets: 3, reps: "10-12" },
        { name: "Standing Calf Raise", sets: 3, reps: "12-15" },
      ],
      Push: [
        { name: "Flat Barbell Bench Press", sets: 3, reps: "8-12" },
        { name: "Overhead Press", sets: 3, reps: "8-12" },
        { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15" },
        { name: "Tricep Rope Pushdown", sets: 3, reps: "10-12" },
      ],
      Pull: [
        { name: "Lat Pulldown", sets: 3, reps: "8-12" },
        { name: "Seated Cable Row", sets: 3, reps: "8-12" },
        { name: "Face Pulls", sets: 3, reps: "12-15" },
        { name: "Dumbbell Curl", sets: 3, reps: "10-12" },
      ],
      Legs: [
        { name: "Barbell Back Squat", sets: 3, reps: "8-12" },
        { name: "Romanian Deadlift", sets: 3, reps: "8-12" },
        { name: "Leg Press", sets: 3, reps: "10-12" },
        { name: "Walking Lunges", sets: 2, reps: "10-12" },
        { name: "Standing Calf Raise", sets: 3, reps: "12-15" },
      ],
    },
  },
  athletic: {
    splits: {
      3: ["Power", "Strength", "Conditioning"],
      4: ["Upper Power", "Lower Power", "Push", "Pull"],
      5: ["Power", "Strength", "Push", "Pull", "Full Body"],
    },
    exercises: {
      Power: [
        { name: "Barbell Back Squat", sets: 4, reps: "3-5" },
        { name: "Conventional Deadlift", sets: 4, reps: "3-5" },
        { name: "Box Jump", sets: 3, reps: "5-8" },
        { name: "Medicine Ball Slam", sets: 3, reps: "8-10" },
      ],
      Strength: [
        { name: "Flat Barbell Bench Press", sets: 4, reps: "5-7" },
        { name: "Bent Over Row", sets: 4, reps: "5-7" },
        { name: "Overhead Press", sets: 3, reps: "5-7" },
        { name: "Weighted Pull-Up", sets: 3, reps: "5-7" },
      ],
      Conditioning: [
        { name: "Kettlebell Swing", sets: 3, reps: "15-20" },
        { name: "Battle Ropes", sets: 3, reps: "30s" },
        { name: "Farmer's Carry", sets: 3, reps: "30s" },
        { name: "Burpees", sets: 3, reps: "10-15" },
      ],
      "Upper Power": [
        { name: "Flat Barbell Bench Press", sets: 4, reps: "3-5" },
        { name: "Weighted Pull-Up", sets: 4, reps: "3-5" },
        { name: "Medicine Ball Chest Pass", sets: 3, reps: "5-8" },
        { name: "Landmine Press", sets: 3, reps: "6-8" },
      ],
      "Lower Power": [
        { name: "Barbell Back Squat", sets: 4, reps: "3-5" },
        { name: "Box Jump", sets: 4, reps: "5-8" },
        { name: "Romanian Deadlift", sets: 3, reps: "6-8" },
        { name: "Kettlebell Swing", sets: 3, reps: "15-20" },
      ],
      Push: [
        { name: "Flat Barbell Bench Press", sets: 3, reps: "8-10" },
        { name: "Overhead Press", sets: 3, reps: "8-10" },
        { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15" },
        { name: "Tricep Rope Pushdown", sets: 3, reps: "10-12" },
      ],
      Pull: [
        { name: "Bent Over Row", sets: 3, reps: "8-10" },
        { name: "Lat Pulldown", sets: 3, reps: "8-10" },
        { name: "Face Pulls", sets: 3, reps: "15-20" },
        { name: "Dumbbell Curl", sets: 3, reps: "10-12" },
      ],
      "Full Body": [
        { name: "Barbell Back Squat", sets: 3, reps: "8-10" },
        { name: "Flat Barbell Bench Press", sets: 3, reps: "8-10" },
        { name: "Bent Over Row", sets: 3, reps: "8-10" },
        { name: "Kettlebell Swing", sets: 3, reps: "15-20" },
      ],
    },
  },
};

function generateProgram(goal, days, equipment, duration) {
  const template = BUILDER_TEMPLATES[goal];
  if (!template) return null;
  const splits = template.splits[days];
  if (!splits) return null;

  const program = [];
  splits.forEach((splitName, dayIdx) => {
    const exList = template.exercises[splitName];
    if (!exList) return;
    const dayExercises =
      equipment === "basic"
        ? exList.filter(
            (ex) => !ex.name.toLowerCase().includes("cable") && !ex.name.toLowerCase().includes("machine") && !ex.name.toLowerCase().includes("lat"),
          )
        : equipment === "home"
          ? exList.filter(
              (ex) =>
                !ex.name.toLowerCase().includes("barbell") &&
                !ex.name.toLowerCase().includes("dumbbell") &&
                !ex.name.toLowerCase().includes("cable") &&
                !ex.name.toLowerCase().includes("machine"),
            )
          : exList;

    const scaledSets = duration <= 30 ? dayExercises.slice(0, 3) : duration <= 45 ? dayExercises.slice(0, 4) : dayExercises;
    program.push({
      id: `builder-${goal}-${dayIdx}`,
      name: splitName,
      day: `Day ${dayIdx + 1}`,
      exercises: scaledSets.map((ex) => ({
        name: ex.name,
        sets: duration <= 30 ? Math.max(2, ex.sets - 1) : ex.sets,
        reps: ex.reps,
        repTarget: ex.reps,
        weight: "",
      })),
    });
  });
  return program;
}

// ===== WARMUP GENERATOR =====
function generateWarmup(workingWeight) {
  const w = Number(workingWeight);
  if (!w || w <= 0) return [];
  const sets = [
    { bar: 20, reps: 10, pct: "Bar" },
    { bar: Math.round((w * 0.4) / 5) * 5 || 20, reps: 8, pct: "40%" },
    { bar: Math.round((w * 0.6) / 5) * 5, reps: 5, pct: "60%" },
    { bar: Math.round((w * 0.8) / 5) * 5, reps: 3, pct: "80%" },
    { bar: w, reps: 1, pct: "Working" },
  ];
  return sets.filter((s) => s.bar <= w && s.bar >= 20);
}

// ===== EVENT LISTENERS: NAVIGATION =====
document.getElementById("wsBackBtn").addEventListener("click", closeWorkout);

document.getElementById("edBackBtn").addEventListener("click", () => {
  showScreen("screen-ws");
  renderWorkoutSession();
});

// ===== EVENT LISTENERS: QUICK ACTIONS =====
document.getElementById("qaRepeatLast").addEventListener("click", repeatLastSet);
document.getElementById("qaAddEmpty").addEventListener("click", openAddSetModal);
document.getElementById("qaWarmup").addEventListener("click", () => {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;
  const lastSet = [...ex.sets].reverse().find((s) => s.done && Number(s.weight) > 0);
  document.getElementById("warmupWeight").value = lastSet ? lastSet.weight : "";
  document.getElementById("warmupResult").innerHTML = "";
  document.getElementById("warmupModal").classList.remove("is-hidden");
});

// ===== EVENT LISTENERS: ADD SET MODAL =====
document.getElementById("bsAddOverlay").addEventListener("click", closeAddSetModal);

document.getElementById("asRepsMinus").addEventListener("click", () => {
  const step = state.repInc || 1;
  addSetReps = Math.max(1, addSetReps - step);
  document.getElementById("asRepsValue").textContent = addSetReps;
});
document.getElementById("asRepsPlus").addEventListener("click", () => {
  const step = state.repInc || 1;
  addSetReps = Math.min(50, addSetReps + step);
  document.getElementById("asRepsValue").textContent = addSetReps;
});

document.getElementById("asWeightMinus5").addEventListener("click", () => {
  const step = (state.weightInc || 1) * 5;
  addSetWeight = Math.max(0, parseFloat((addSetWeight - step).toFixed(2)));
  document.getElementById("asWeightValue").textContent = addSetWeight;
});
document.getElementById("asWeightMinus1").addEventListener("click", () => {
  const step = state.weightInc || 1;
  addSetWeight = Math.max(0, parseFloat((addSetWeight - step).toFixed(2)));
  document.getElementById("asWeightValue").textContent = addSetWeight;
});
document.getElementById("asWeightPlus1").addEventListener("click", () => {
  const step = state.weightInc || 1;
  addSetWeight = Math.min(500, parseFloat((addSetWeight + step).toFixed(2)));
  document.getElementById("asWeightValue").textContent = addSetWeight;
});
document.getElementById("asWeightPlus5").addEventListener("click", () => {
  const step = (state.weightInc || 1) * 5;
  addSetWeight = Math.min(500, parseFloat((addSetWeight + step).toFixed(2)));
  document.getElementById("asWeightValue").textContent = addSetWeight;
});

document.getElementById("asSaveBtn").addEventListener("click", saveAddSet);

// ===== EVENT LISTENERS: EDIT SET BOTTOM SHEET =====
document.getElementById("bsEditOverlay").addEventListener("click", closeEditBottomSheet);

document.getElementById("esRepsMinus").addEventListener("click", () => {
  const step = state.repInc || 1;
  editSetReps = Math.max(1, editSetReps - step);
  updateEditSetRepsDisplay();
});
document.getElementById("esRepsPlus").addEventListener("click", () => {
  const step = state.repInc || 1;
  editSetReps = Math.min(50, editSetReps + step);
  updateEditSetRepsDisplay();
});

document.getElementById("esWeightMinus5").addEventListener("click", () => {
  const step = (state.weightInc || 1) * 5;
  editSetWeight = Math.max(0, parseFloat((editSetWeight - step).toFixed(2)));
  updateEditSetWeightDisplay();
});
document.getElementById("esWeightMinus1").addEventListener("click", () => {
  const step = state.weightInc || 1;
  editSetWeight = Math.max(0, parseFloat((editSetWeight - step).toFixed(2)));
  updateEditSetWeightDisplay();
});
document.getElementById("esWeightPlus1").addEventListener("click", () => {
  const step = state.weightInc || 1;
  editSetWeight = Math.min(500, parseFloat((editSetWeight + step).toFixed(2)));
  updateEditSetWeightDisplay();
});
document.getElementById("esWeightPlus5").addEventListener("click", () => {
  const step = (state.weightInc || 1) * 5;
  editSetWeight = Math.min(500, parseFloat((editSetWeight + step).toFixed(2)));
  updateEditSetWeightDisplay();
});

document.getElementById("esCompleteBtn").addEventListener("click", completeSetFromSheet);
document.getElementById("esEditDeleteBtn").addEventListener("click", deleteSetFromSheet);

// ===== REST TIMER CONTROLS =====
document.getElementById("rtAdd30").addEventListener("click", () => {
  restTimerSeconds += 30;
  updateRestTimerDisplay();
});
document.getElementById("rtReset").addEventListener("click", () => {
  restTimerSeconds = state.restTimer || DEFAULT_REST;
  updateRestTimerDisplay();
});
document.getElementById("rtSkip").addEventListener("click", () => {
  clearRestTimer();
});

// ===== EXERCISE DETAIL TAB SWITCHING =====
document.getElementById("screen-ed").addEventListener("click", (e) => {
  const tab = e.target.closest(".ed-tab");
  if (!tab) return;
  document.querySelectorAll(".ed-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
  document
    .querySelectorAll(".ed-content")
    .forEach((c) => c.classList.toggle("is-active", c.id === "edTab" + tab.dataset.edTab.charAt(0).toUpperCase() + tab.dataset.edTab.slice(1)));
  if (tab.dataset.edTab === "analyze") renderEdAnalyze();
});

// ===== EXERCISE NOTES =====
function getExerciseNotes(exName) {
  try {
    const n = JSON.parse(localStorage.getItem("wl_exercise_notes")) || {};
    return n[exName] || "";
  } catch {
    return "";
  }
}
function setExerciseNotes(exName, text) {
  try {
    const n = JSON.parse(localStorage.getItem("wl_exercise_notes")) || {};
    n[exName] = text;
    localStorage.setItem("wl_exercise_notes", JSON.stringify(n));
  } catch {}
}

function renderEdNotes(exName) {
  const container = document.getElementById("edNotesSection");
  const notes = getExerciseNotes(exName);
  container.innerHTML = `<div class="ed-notes" id="edNotesToggle">
    <span class="ed-notes-header">ⓘ Exercise Notes</span>
    <div class="ed-notes-body ${notes ? "is-visible" : "is-hidden"}" id="edNotesBody">
      <textarea class="ed-notes-input" id="edNotesInput" placeholder="Add notes for this exercise..." rows="3">${notes}</textarea>
    </div>
  </div>`;
  requestAnimationFrame(() => {
    document.getElementById("edNotesToggle").addEventListener("click", (e) => {
      if (e.target.closest("textarea")) return;
      const body = document.getElementById("edNotesBody");
      body.classList.toggle("is-hidden");
      if (!body.classList.contains("is-hidden")) document.getElementById("edNotesInput")?.focus();
    });
    document.getElementById("edNotesInput").addEventListener("input", (e) => {
      setExerciseNotes(currentExName, e.target.value);
    });
  });
}

// ===== PREVIOUS PERFORMANCE CARD =====
function getLastExerciseSession(exName) {
  const sessions = state.sessions.filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  for (const s of sessions) {
    const ex = s.exercises.find((e) => e.name === exName);
    if (!ex) continue;
    const done = ex.sets.filter((st) => st.done && !st.isWarmup && Number(st.weight) > 0);
    if (done.length === 0) continue;
    const bestSet = done.reduce((a, b) => (Number(a.weight) * Number(a.reps) > Number(b.weight) * Number(b.reps) ? a : b), done[0]);
    const daysAgo = Math.floor((Date.now() - parseDateKey(s.dateKey).getTime()) / 86400000);
    return { dateKey: s.dateKey, sets: done, bestSet, daysAgo, workoutName: s.workoutName };
  }
  return null;
}

function renderPreviousPerformance(exName) {
  const container = document.getElementById("edPerformanceCard");
  const last = getLastExerciseSession(exName);
  if (!last) {
    container.innerHTML = "";
    return;
  }
  const daysLabel = last.daysAgo === 0 ? "Today" : last.daysAgo === 1 ? "Yesterday" : `${last.daysAgo} Days Ago`;
  const prData = getPRsForExercise(exName);
  const hasPR = !!(prData.weightPR || prData.repPR || prData.volumePR);
  container.innerHTML = `
    <div class="ed-prev-perf">
      <div class="ed-prev-perf-header">Last Session${hasPR ? ' <span class="pr-badge pr-badge--weight">PR</span>' : ""}</div>
      <div class="ed-prev-perf-sets">${last.sets.map((s) => {
        let badge = "";
        if (prData.weightPR && Number(s.weight) >= prData.weightPR.value) badge = `<span class="pr-badge pr-badge--weight">Best</span>`;
        return `<span class="ed-prev-perf-set">${displayWeight(Number(s.weight))} × ${s.reps}${badge}</span>`;
      }).join("")}</div>
      <div class="ed-prev-perf-footer">Best Set: ${displayWeight(Number(last.bestSet.weight))} × ${last.bestSet.reps} · ${daysLabel}</div>
    </div>`;
}

// ===== TODAY'S TARGET CARD =====
function getTargetSuggestion(exName) {
  const last = getLastExerciseSession(exName);
  if (!last) return null;
  const lastSet = last.sets[last.sets.length - 1];
  if (!lastSet) return null;
  const w = Number(lastSet.weight);
  const r = Number(lastSet.reps);
  if (!w || !r) return null;
  const inc = state.weightInc || 2.5;
  const targetReps = r;
  const suggestWeight = Math.round((w + inc) / (inc || 1)) * (inc || 1);
  return {
    weight: suggestWeight,
    reps: targetReps,
    reason: `Last session: ${w} kg × ${r}. ${r >= targetReps ? "Target achieved. Increase weight." : "Repeat weight."}`,
    progressed: r >= targetReps,
  };
}

function renderTargetCard(exName) {
  const container = document.getElementById("edTargetCard");
  const suggestion = getTargetSuggestion(exName);
  if (!suggestion) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <div class="ed-target">
      <div class="ed-target-header">Suggested</div>
      <div class="ed-target-value">${displayWeight(suggestion.weight)} × ${suggestion.reps}</div>
      <div class="ed-target-reason">${suggestion.reason}</div>
    </div>`;
}

// ===== SET PROGRESS TRACKER =====
function renderSetProgress(ex) {
  const container = document.getElementById("edProgressTracker");
  const working = ex.sets.filter((s) => !s.isWarmup);
  const done = working.filter((s) => s.done);
  const total = working.length;
  if (total === 0) {
    container.innerHTML = "";
    return;
  }
  const allDone = done.length === total;
  if (allDone) {
    container.innerHTML = `<div class="ed-progress is-complete">
      <span class="ed-progress-dots">${working.map(() => "✓").join(" ")}</span>
      <span class="ed-progress-label">Exercise Complete</span>
    </div>`;
  } else {
    container.innerHTML = `<div class="ed-progress">
      <span class="ed-progress-dots">${working.map((s) => (s.done ? "✓" : "○")).join(" ")}</span>
      <span class="ed-progress-label">${done.length} / ${total} Sets</span>
    </div>`;
  }
}

// ===== EXERCISE COMPLETION STATE =====
function renderExerciseCompletion(ex) {
  const pending = ex.sets.filter((s) => !s.isWarmup && !s.done);
  if (pending.length > 0) return "";
  if (ex.sets.filter((s) => !s.isWarmup).length === 0) return "";
  const session = getTodaySession();
  const idx = session ? session.exercises.indexOf(ex) : -1;
  const hasNext = idx >= 0 && idx < session.exercises.length - 1;
  const isLastExercise = !hasNext && isWorkoutComplete();
  const autoNext = state.autoNext;
  return `<div class="ed-ex-complete" id="edExComplete">
    <span class="ed-ex-complete-icon">✓</span>
    <span class="ed-ex-complete-label">${isLastExercise && !autoNext ? "All Exercises Complete" : "Exercise Complete"}</span>
    ${hasNext ? (autoNext ? "" : `<button class="ed-ex-complete-btn" id="edNextExBtn">Open Next Exercise</button>`) : ""}
    ${isLastExercise && !autoNext ? `<button class="ed-ex-complete-btn ed-finish-btn" id="edFinishBtn">Finish Workout</button>` : ""}
  </div>`;
}

// ===== WARM-UP STATUS =====
function renderWarmupStatus(ex) {
  const warmups = ex.sets.filter((s) => s.isWarmup);
  if (warmups.length === 0) return "";
  const done = warmups.filter((s) => s.done).length;
  const total = warmups.length;
  if (done === total)
    return `<div class="ed-wu-status is-done">
    <span>🔥 Warm-Up <span class="ed-wu-status-label">${done} / ${total} Completed</span></span>
    <span class="ed-wu-badge">✓</span>
  </div>`;
  return `<div class="ed-wu-status">
    <span>🔥 Warm-Up <span class="ed-wu-status-label">${done} / ${total} Completed</span></span>
  </div>`;
}

// ===== ANALYZE TAB =====
function renderEdAnalyze() {
  const container = document.getElementById("edTabAnalyze");
  const history = getExerciseHistory(currentExName);
  const prData = getPRsForExercise(currentExName);
  const last = getLastExerciseSession(currentExName);
  if (!last && !prData.weightPR) {
    container.innerHTML = `<p class="ed-empty">Log some sets to see analysis.</p>`;
    return;
  }
  let html = `<div class="ea-grid">`;
  if (last) {
    html += `<div class="ea-card ea-card-wide">
      <div class="ea-card-title">Last Session</div>
      <div class="ea-card-val">${last.sets.map((s) => `${Number(s.weight)} kg × ${s.reps}`).join(", ")}</div>
      <div class="ea-card-sub">${last.daysAgo === 0 ? "Today" : last.daysAgo + " days ago"} · ${last.workoutName}</div>
    </div>`;
  }
  const wPR = prData.weightPR;
  const ePR = prData.est1RM;
  html += `<div class="ea-card"><div class="ea-card-title">Best Set</div>
    <div class="ea-card-val">${wPR ? displayWeight(wPR.value) + " × " + (wPR.reps || "—") : "—"}</div></div>`;
  html += `<div class="ea-card"><div class="ea-card-title">e1RM</div>
    <div class="ea-card-val">${ePR ? displayWeight(ePR.value) : "—"}</div></div>`;
  html += `<div class="ea-card"><div class="ea-card-title">Personal Records</div>
    <div class="ea-card-val">${wPR ? formatReadableDate(parseDateKey(wPR.date)) : "—"}</div>
    ${wPR ? `<div class="ea-card-sub">${displayWeight(wPR.value)} × ${wPR.reps || "—"}</div>` : ""}</div>`;
  if (history.length >= 2) {
    const first = history[0].bestWeight;
    const latest = history[history.length - 1].bestWeight;
    const change = latest - first;
    html += `<div class="ea-card"><div class="ea-card-title">Weight Progression</div>
      <div class="ea-card-val" style="color:${change >= 0 ? "var(--accent)" : "var(--red)"}">${change >= 0 ? "+" : ""}${change} kg</div>
      <div class="ea-card-sub">${first} kg → ${latest} kg</div></div>`;
  }
  if (history.length >= 2) {
    const totalVol = history.reduce((s, h) => s + h.totalVolume, 0);
    const avgVol = Math.round(totalVol / history.length);
    html += `<div class="ea-card"><div class="ea-card-title">Volume Trend</div>
      <div class="ea-card-val">${avgVol >= 1000 ? (avgVol / 1000).toFixed(1) + "k" : avgVol} kg avg</div>
      <div class="ea-card-sub">${history.length} sessions</div></div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

// ===== SESSIONS TAB =====
function renderSessionsTab() {
  renderSessionLog();
  renderPRBoard();
  renderWeeklyReport();
  renderMonthlyReport();
  renderAdherenceGrid();
}

function renderMonthlyReport() {
  const container = document.getElementById("monthlyReportContent");
  if (!container) return;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthKey = getDateKey(monthStart);
  const monthSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= monthKey);
  if (!monthSessions.length) {
    container.innerHTML = `<div class="empty-card"><div class="empty-card-content">Complete workouts this month to see your monthly report.</div></div>`;
    return;
  }
  const totalSets = monthSessions.reduce((sum, s) => sum + s.exercises.reduce((s2, ex) => s2 + ex.sets.length, 0), 0);
  const totalVolume = monthSessions.reduce((sum, s) => sum + s.exercises.reduce((s2, ex) => s2 + ex.sets.filter(st => st.done).reduce((s3, st) => s3 + (Number(st.weight)||0) * (st.reps||0), 0), 0), 0);
  const totalDuration = monthSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.4rem">
      <div class="pr-card" style="text-align:center"><strong>${monthSessions.length}</strong><span>Workouts</span></div>
      <div class="pr-card" style="text-align:center"><strong>${totalSets}</strong><span>Sets</span></div>
      <div class="pr-card" style="text-align:center"><strong>${totalVolume >= 1000 ? (totalVolume/1000).toFixed(1)+"k" : totalVolume}</strong><span>Volume (kg)</span></div>
    </div>`;
}

function renderAdherenceGrid() {
  const container = document.getElementById("adherenceCard");
  if (!container) return;
  const sessions = state.sessions.filter((s) => s.finishedAt) || [];
  if (!sessions.length) {
    container.innerHTML = `<div class="empty-card"><div class="empty-card-content">Complete workouts to see your adherence grid.</div></div>`;
    return;
  }
  const today = new Date();
  const weeks = 12;
  let html = `<div class="adherence-header"><span class="streak-label">🔥 ${state.workoutStreak?.currentStreak || 0} day streak</span></div><div class="adherence-grid">`;
  for (let w = 0; w < weeks; w++) {
    html += `<div class="adherence-week">`;
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (weeks * 7 - w * 7 - d));
      const dk = getDateKey(date);
      const hasSession = sessions.some((s) => s.dateKey === dk);
      const isToday = dk === getDateKey(today);
      const isFuture = date > today;
      html += `<div class="adherence-day${hasSession ? " cell-trained" : isFuture ? " cell-future" : isToday ? " cell-today" : ""}"></div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

function renderSessionLog() {
  const container = document.getElementById("sessionLog");
  if (!container) return;
  const logs = state.sessions
    .filter((s) => s.finishedAt)
    .slice()
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  container.innerHTML = logs.length
    ? logs
        .slice(0, 10)
        .map((s) => {
          const c = getCompletion(s);
          const d = s.duration ? formatStopwatch(s.duration) : "";
          const vol = s.exercises.reduce((sum, ex) => sum + ex.sets.filter((st) => st.done && Number(st.weight) > 0).reduce((s2, st) => s2 + Number(st.weight) * (st.reps || 0), 0), 0);
          const volStr = vol >= 1000 ? (vol / 1000).toFixed(1) + "k" : vol || "";
          return `<div class="log-item" data-session-id="${s.id}" style="cursor:pointer"><div><strong>${s.workoutName}</strong><span>${formatReadableDate(parseDateKey(s.dateKey))}</span></div><span>${d ? d + " · " : ""}${c.done}/${c.total}${volStr ? " · " + volStr : ""}</span></div>`;
        })
        .join("")
    : `<div class="empty-card"><div class="empty-card-content">No finished sessions yet.</div></div>`;
  container.querySelectorAll(".log-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.dataset.sessionId;
      const session = state.sessions.find((s) => s.id === id);
      if (session) openWorkoutReport(session);
    });
  });
}

function renderPRBoard() {
  const container = document.getElementById("prGrid");
  const allPRs = getAllPRs();
  const entries = Object.entries(allPRs).sort((a, b) => {
    const aDate = a[1].weightPR?.date || a[1].volumePR?.date || "";
    const bDate = b[1].weightPR?.date || b[1].volumePR?.date || "";
    return bDate.localeCompare(aDate);
  });
  container.innerHTML = entries.length
    ? entries
        .slice(0, 4)
        .map(([name, data]) => {
          const wLabel = data.weightPR ? displayWeight(data.weightPR.value) : "—";
          const rLabel = data.repPR ? `${data.repPR.value} reps` : data.weightPR ? `${data.weightPR.reps} reps` : "—";
          const estLabel = data.est1RM ? displayWeight(data.est1RM.value) : "—";
          return `<div class="pr-card" onclick="showExerciseAnalytics('${name.replace(/'/g, "\\'")}')">
          <strong>${name.replace(/([A-Z])/g, " $1").trim()}</strong>
          <div class="pr-stats">
            <span class="pr-stat"><span class="pr-stat-val">${wLabel}</span><span class="pr-stat-lbl">Best Weight</span></span>
            <span class="pr-stat"><span class="pr-stat-val">${rLabel}</span><span class="pr-stat-lbl">Best Reps</span></span>
            <span class="pr-stat"><span class="pr-stat-val">${estLabel}</span><span class="pr-stat-lbl">E1RM</span></span>
          </div>
        </div>`;
        })
        .join("")
    : `<div class="empty-card"><div class="empty-card-content">Set a PR to see it here.</div></div>`;
}





// ===== TRAINING CALENDAR =====
function renderTrainingCalendar() {
  const container = document.getElementById("trainingCalendar");
  if (!container) return;

  const sessions = state.sessions.filter((s) => s.finishedAt);
  const trainedDays = new Set(sessions.map((s) => s.dateKey));

  let streak = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (trainedDays.has(getDateKey(d))) streak++;
    else break;
  }

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const todayKey = getDateKey(today);

  let html = ``;
  if (trainedDays.size === 0) {
    html += `<div class="empty-state" style="margin-bottom:0.75rem">
      <div class="empty-state-icon">📅</div>
      <div class="empty-state-title">No Workouts Yet</div>
      <div class="empty-state-text">Complete a workout to see your training calendar fill up with green training days.</div>
    </div>`;
  }
  html += `<div class="cal-header">
    <button class="cal-nav-btn" data-cal-dir="-1">←</button>
    <span class="cal-title">${monthNames[calendarMonth]} ${calendarYear}</span>
    <button class="cal-nav-btn" data-cal-dir="1">→</button>
  </div>`;

  html += `<div class="cal-weekdays">
    ${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<span>${d}</span>`).join("")}
  </div>`;

  html += `<div class="cal-grid">`;

  for (let i = 0; i < startPad; i++) {
    html += `<div class="cal-cell cal-other"></div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(calendarYear, calendarMonth, d);
    const key = getDateKey(date);
    const isToday = key === todayKey;
    const isTrained = trainedDays.has(key);
    const isFuture = date > today;

    let cls = "cal-cell";
    if (isFuture) cls += " cal-future";
    else if (isTrained) cls += " cal-trained";
    if (isToday) cls += " cal-today";

    html += `<div class="${cls}">${d}</div>`;
  }

  html += `</div>`;

  html += `<div class="cal-streak">
    <span>Streak: <strong>${streak}</strong> days</span>
    <span>Trained: <strong>${trainedDays.size}</strong> total</span>
  </div>`;

  container.innerHTML = html;

  container.querySelectorAll("[data-cal-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.calDir);
      calendarMonth += dir;
      if (calendarMonth < 0) {
        calendarMonth = 11;
        calendarYear--;
      }
      if (calendarMonth > 11) {
        calendarMonth = 0;
        calendarYear++;
      }
      renderTrainingCalendar();
    });
  });

  // Click trained days to show session detail
  container.querySelectorAll(".cal-cell.cal-trained").forEach((cell) => {
    cell.style.cursor = "pointer";
    cell.addEventListener("click", () => {
      const dayText = cell.textContent.trim();
      const dateObj = new Date(calendarYear, calendarMonth, parseInt(dayText));
      const dateKey = getDateKey(dateObj);
      const daySessions = state.sessions.filter((s) => s.finishedAt && s.dateKey === dateKey);
      if (!daySessions.length) return;
      const dateStr = formatReadableDate(dateObj);
      let totalVol = 0;
      for (const ses of daySessions) {
        for (const ex of ses.exercises) {
          for (const set of ex.sets) {
            if (set.done && Number(set.weight) > 0) totalVol += Number(set.weight) * (Number(set.reps) || 0);
          }
        }
      }
      const notes = daySessions.map((s) => s.notes || "").filter(Boolean).join("; ");
      const volStr = totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + "k" : totalVol;
      const names = [...new Set(daySessions.map((s) => s.workoutName))].join(", ");
      const el = document.getElementById("exerciseDetailModal");
      document.getElementById("exerciseDetailTitle").textContent = dateStr;
      const chartCanvas = document.getElementById("exerciseDetailChart");
      chartCanvas.style.display = "none";
      let contentEl = document.getElementById("exerciseDetailContent");
      if (!contentEl) {
        contentEl = document.createElement("div");
        contentEl.id = "exerciseDetailContent";
        chartCanvas.parentNode.insertBefore(contentEl, chartCanvas);
      }
      contentEl.innerHTML = `
        <div style="padding:0.75rem;display:flex;flex-direction:column;gap:0.5rem">
          <div><strong>Workout:</strong> ${names}</div>
          <div><strong>Sessions:</strong> ${daySessions.length}</div>
          <div><strong>Volume:</strong> ${volStr} kg</div>
          ${notes ? `<div><strong>Notes:</strong> ${notes}</div>` : ""}
        </div>
      `;
      el.classList.remove("is-hidden");
    });
  });
}

// ===== PROGRESS PAGE =====
function renderProgressPage() {
  const container = document.getElementById("progressPageContent");
  if (!container) return;
  renderTrainingCalendar();
  renderProgressInsights();
  renderRecoveryStatus();
  renderGoalsSection();
}

function renderProgressInsights() {
  const container = document.getElementById("coachInsights");
  if (!container) return;
  const sessions = state.sessions.filter((s) => s.finishedAt);
  if (!sessions.length) {
    container.innerHTML = `<div class="empty-card"><div class="empty-card-content">Complete workouts to see training insights.</div></div>`;
    return;
  }
  const weekAgo = getDateKey(new Date(Date.now() - 7 * 86400000));
  const weekSessions = sessions.filter((s) => s.dateKey >= weekAgo);
  const totalVolume = weekSessions.reduce((sum, s) => sum + s.exercises.reduce((s2, ex) => s2 + ex.sets.filter(st => st.done).reduce((s3, st) => s3 + (Number(st.weight)||0) * (st.reps||0), 0), 0), 0);
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.4rem">
      <div class="pr-card" style="text-align:center"><strong>${weekSessions.length}</strong><span>Workouts</span></div>
      <div class="pr-card" style="text-align:center"><strong>${totalVolume >= 1000 ? (totalVolume/1000).toFixed(1)+"k" : totalVolume}</strong><span>Volume</span></div>
    </div>`;
}

function renderRecoveryStatus() {
  const container = document.getElementById("recoveryContent");
  if (!container) return;
  const sessions = state.sessions.filter((s) => s.finishedAt);
  if (!sessions.length) {
    container.innerHTML = `<div class="empty-card"><div class="empty-card-content">Complete workouts to see recovery status.</div></div>`;
    return;
  }
  const lastSession = sessions.sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
  const daysSince = Math.floor((new Date() - new Date(lastSession.dateKey + "T00:00:00")) / 86400000);
  const recoveryPct = Math.min(100, Math.round(daysSince * 20));
  const dot = document.getElementById("recoveryDot");
  if (dot) {
    dot.className = "recovery-dot";
    if (recoveryPct >= 80) dot.classList.add("is-green");
    else if (recoveryPct >= 40) dot.classList.add("is-yellow");
    else dot.classList.add("is-red");
  }
  container.innerHTML = `
    <div style="text-align:center;padding:0.5rem">
      <div style="font-size:1.5rem;font-weight:800">${recoveryPct}%</div>
      <div style="font-size:0.72rem;color:var(--text-secondary)">Recovery</div>
      <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:0.25rem">${daysSince} day${daysSince !== 1 ? "s" : ""} since last workout</div>
    </div>`;
}

function renderGoalsSection() {
  const container = document.getElementById("goalsContent");
  if (!container) return;
  const user = state.user || {};
  const goalName = user.goal ? user.goal.replace(/-/g, " ") : "Not set";
  container.innerHTML = `
    <div class="card-content" style="display:flex;flex-direction:column;gap:0.4rem">
      <div class="log-item"><strong>Fitness Goal</strong><span style="text-transform:capitalize">${goalName}</span></div>
      ${user.targetWeight ? `<div class="log-item"><strong>Target Weight</strong><span>${displayWeight(user.targetWeight)}</span></div>` : ""}
      <button class="btn-secondary" id="goalsOpenCoachBtn" style="width:100%;margin-top:0.25rem">Open Goal Center →</button>
    </div>`;
  document.getElementById("goalsOpenCoachBtn")?.addEventListener("click", () => {
    if (typeof openGoalCenter === "function") openGoalCenter();
  });
}

// ===== TRAINER PAGE =====
function renderTrainerTab() {
  if (typeof CoachSystem !== "undefined" && CoachSystem.init) {
    if (CoachSystem.getCurrentRoute() !== "home") {
      CoachSystem.navigate("home", {}, false);
    }
    CoachSystem.init();
    return;
  }
  // Fallback: render directly
  const container = document.getElementById("trainerPageContent");
  if (!container) return;

  const coach = CoachEngine.runAll();
  const dc = coach.daily;

  container.innerHTML = '<div class="co-page"><div class="co-content">' +
    '<div class="co-home-hero"><div class="co-hero-greeting">Hello, <strong>' + (dc.name || "Athlete") + '</strong></div>' +
    '<div class="co-hero-message">' + (dc.coachMessage || "Welcome to Coach") + '</div></div>' +
    '<div class="co-empty-state"><div class="co-empty-icon">📭</div>' +
    '<div class="co-empty-title">Coach System Loading</div>' +
    '<div class="co-empty-desc">The Coach System module is loading. Please refresh or check the console.</div></div></div></div>';

}


function renderCalendarHero() {
  const container = document.getElementById("progressCalendarHero");
  if (!container) return;

  const sessions = state.sessions.filter((s) => s.finishedAt);
  const trainedDays = new Set(sessions.map((s) => s.dateKey));
  const streak = getStreak();
  const longestStreak = getLongestStreak();
  const prCount = getPRCount();

  const today = new Date();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const todayKey = getDateKey(today);

  let html = `<div class="calendar-wrap">`;

  // Navigation header
  html += `<div class="cal-header">
    <button class="cal-nav-btn" data-cal-dir="-1">←</button>
    <span class="cal-title">${monthNames[calendarMonth]} ${calendarYear}</span>
    <button class="cal-nav-btn" data-cal-dir="1">→</button>
  </div>`;

  // Streak + PR info
  html += `<div class="cal-streak-row">
    <span class="cal-streak-item"><strong>${streak}</strong> day streak</span>
    <span class="cal-streak-item">Best: ${longestStreak}d</span>
    <span class="cal-streak-item"><strong>${prCount}</strong> PRs</span>
  </div>`;

  // Simplified legend
  html += `<div class="cal-legend">
    <span><span class="cal-legend-dot is-empty"></span> Rest</span>
    <span><span class="cal-legend-dot is-green"></span> Workout</span>
    ${trainedDays.has(todayKey) ? "" : `<span style="outline:1px solid var(--text);outline-offset:2px;border-radius:50%">Today</span>`}
  </div>`;

  // Weekday headers
  html += `<div class="cal-weekdays">
    ${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<span>${d}</span>`).join("")}
  </div>`;

  // Grid
  html += `<div class="cal-grid">`;

  for (let i = 0; i < startPad; i++) {
    html += `<div class="cal-cell cal-other"></div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(calendarYear, calendarMonth, d);
    const key = getDateKey(date);
    const isToday = key === todayKey;
    const isFuture = date > today;
    const isTrained = trainedDays.has(key);

    let cls = "cal-cell";
    if (isFuture) cls += " cal-future";
    else if (isTrained) cls += " cal-trained";
    else if (!isToday) cls += " cal-empty";

    if (isToday) cls += " cal-today";
    if (isTrained && !isFuture) cls += " is-clickable";

    html += `<div class="${cls}" data-date-key="${key}">${d}</div>`;
  }

  html += `</div>`;
  html += `</div>`;

  container.innerHTML = html;

  // Calendar nav
  container.querySelectorAll("[data-cal-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.calDir);
      calendarMonth += dir;
      if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
      renderCalendarHero();
    });
  });

  // Click handlers on trained days → bottom sheet
  container.querySelectorAll(".cal-cell.is-clickable").forEach((cell) => {
    cell.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = cell.dataset.dateKey;
      if (!key) return;
      const session = sessions.find((s) => s.dateKey === key);
      if (!session) return;
      openCalendarDateSheet(session);
    });
  });
}

// ===== PROBLEM DATABASE RENDERING =====

function showTrainerScreen(screen, searchQuery) {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  if (screen === "home") {
    if (typeof CoachSystem !== "undefined" && CoachSystem.getCurrentRoute() !== "home") {
      CoachSystem.navigate("home", {}, false);
    }
    renderTrainerTab();
    return;
  }
  if (screen === "problems") {
    renderProblemList(searchQuery);
    return;
  }
  if (screen === "learning") {
    renderLearningHub();
    return;
  }
  if (screen === "learning-category") {
    renderLessonCategory(searchQuery);
    return;
  }
  if (screen === "ee") {
    renderExerciseEncyclopedia();
    return;
  }
  if (screen === "goal-center") {
    renderGoalCenter();
    return;
  }
  if (screen === "create-goal") {
    renderCreateGoalFlow();
    return;
  }
  if (screen === "weight-intelligence") {
    renderWeightIntelligence();
    return;
  }
  if (screen === "readiness") {
    renderReadinessPage();
    return;
  }
  if (screen === "weekly-report") {
    renderWeeklyReportPage();
    return;
  }
  if (screen === "monthly-report") {
    renderMonthlyReportPage();
    return;
  }
  if (screen === "report-history") {
    renderReportHistory();
    return;
  }
  if (screen === "challenges") {
    renderChallengesPage();
    return;
  }
  if (screen === "achievements") {
    renderMilestonesPage();
    return;
  }
  if (screen === "streaks") {
    renderStreaksPage();
    return;
  }
  if (screen === "command-center") {
    renderCoachCommandCenter();
    return;
  }
  if (screen === "program-review") {
    renderProgramReview();
    return;
  }
}

function filterProblems(query) {
  if (!query || !query.trim()) return PROBLEM_DATABASE;
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = PROBLEM_DATABASE.map(p => {
    const text = (p.title + " " + p.description + " " + p.keywords.join(" ") + " " + p.tags.join(" ")).toLowerCase();
    let score = 0;
    for (const word of qWords) {
      if (p.keywords.some(k => k.toLowerCase().includes(word))) score += 2;
      if (p.tags.some(t => t.toLowerCase().includes(word))) score += 2;
      if (text.includes(word)) score += 1;
    }
    return { problem: p, score };
  });
  const results = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.problem);
  return results;
}

function renderProblemList(query, activeFilter) {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  let problems = query ? filterProblems(query) : PROBLEM_DATABASE;
  if (activeFilter && activeFilter !== "All") {
    problems = problems.filter(p => p.category === activeFilter);
  }
  const categories = ["All", "Fat Loss", "Muscle Gain", "Strength", "Recovery", "Nutrition", "Programming"];

  let html = `<div class="tr-page"><div class="tr-section">`;
  html += `<div class="tr-section-header"><button class="tr-back-btn" id="problemListBackBtn">← Back</button></div>`;
  html += `<div class="tr-cs-header">
    <div class="tr-cs-title">Coach Solutions</div>
    <div class="tr-cs-subtitle">Find answers to common training, fat loss, muscle gain, recovery and nutrition problems.</div>
  </div>`;
  html += `<input type="text" class="tr-problem-search" id="problemListSearch" placeholder="Search solutions..." value="${query || ""}" />`;
  html += `<div class="tr-cs-filters">${categories.map(c => `<button class="tr-cs-filter${c === (activeFilter || "All") ? " is-active" : ""}" data-filter="${c}">${c}</button>`).join("")}</div>`;
  if (problems.length === 0) {
    html += `<div class="tr-empty-search"><div class="tr-empty-search-icon">🔍</div><div class="tr-empty-search-text">No solutions found matching "${query || ""}"</div><button class="tr-view-all-btn" id="clearSearchBtn">Clear Search</button></div>`;
  } else {
    html += `<div class="tr-cs-count">${problems.length} solution${problems.length !== 1 ? "s" : ""}</div>`;
    html += `<div class="tr-problems">`;
    html += problems.map(p => {
      const icon = p.id.includes("weight") ? "⚖️" : p.id.includes("muscle") || p.id.includes("grow") ? "💪" : p.id.includes("bench") || p.id.includes("squat") || p.id.includes("deadlift") || p.id.includes("lockout") || p.id.includes("grip") ? "🏋️" : p.id.includes("sore") || p.id.includes("recover") || p.id.includes("sleep") || p.id.includes("tired") || p.id.includes("energy") || p.id.includes("pain") || p.id.includes("burnout") ? "😴" : p.id.includes("split") || p.id.includes("program") || p.id.includes("progression") || p.id.includes("beginner") ? "📋" : p.id.includes("hungry") || p.id.includes("protein") || p.id.includes("calorie") || p.id.includes("eating") || p.id.includes("diet") || p.id.includes("nutrition") ? "🥗" : p.id.includes("motivation") || p.id.includes("anxiety") || p.id.includes("consistent") || p.id.includes("progress") ? "🎯" : "❓";
      return `<button class="tr-problem-card" data-problem-id="${p.id}"><span class="tr-problem-icon">${icon}</span><span class="tr-problem-info"><span class="tr-problem-title">${p.title}</span><span class="tr-problem-category">${p.category}</span></span></button>`;
    }).join("");
    html += `</div>`;
  }
  html += `</div></div>`;
  container.innerHTML = html;

  // Back button
  document.getElementById("problemListBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));

  // Search in problem list
  const listSearch = document.getElementById("problemListSearch");
  if (listSearch) {
    listSearch.addEventListener("input", (e) => {
      renderProblemList(e.target.value.trim(), activeFilter);
    });
  }

  // Category filter clicks
  container.querySelectorAll(".tr-cs-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      const currentSearch = document.getElementById("problemListSearch")?.value || "";
      renderProblemList(currentSearch, filter === "All" ? null : filter);
    });
  });

  document.getElementById("clearSearchBtn")?.addEventListener("click", () => renderProblemList());

  // Card clicks
  container.addEventListener("click", (e) => {
    const card = e.target.closest("[data-problem-id]");
    if (card) {
      renderProblemDetail(card.dataset.problemId);
    }
  });
}

function getWeightTrend() {
  const log = state.weightLog || [];
  if (log.length < 2) return "not enough data";
  const sorted = log.slice().sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const first = recent[0].weight;
  const last = recent[recent.length - 1].weight;
  const diff = last - first;
  if (Math.abs(diff) < 0.5) return "stable";
  return diff < 0 ? "down" : "up";
}

function getProteinCompliance() {
  const sessions = (state.sessions || []).filter(s => s.finishedAt);
  if (sessions.length === 0) return null;
  const weight = state.user?.weight || 70;
  const goal = state.user?.goal || "general";
  const mult = goal === "lose-fat" ? 2.2 : 2.0;
  const target = weight * mult;
  const recent = sessions.slice(-7);
  let daysHit = 0;
  for (const s of recent) {
    const totalProtein = (s.exercises || []).reduce((sum, ex) => {
      return sum + (ex.sets || []).reduce((ss, set) => ss + (set.protein || 0), 0);
    }, 0);
    if (totalProtein >= target) daysHit++;
  }
  return { target, daysHit, total: recent.length };
}

function renderProblemDetail(problemId) {
  const problem = PROBLEM_DATABASE.find(p => p.id === problemId);
  if (!problem) return;
  const container = document.getElementById("trainerPageContent");
  if (!container) return;

  // Gather coach data for analysis
  const coach = CoachEngine.runAll();
  const dc = coach.daily;
  const gs = coach.goalStrategy;
  const rec = coach.recovery;
  const ad = coach.adaptive;
  const rep = coach.reports;
  const weightTrend = getWeightTrend();
  const proteinData = getProteinCompliance();
  const sessions = (state.sessions || []).filter(s => s.finishedAt);
  const weekSessions = sessions.filter(s => {
    const d = parseDateKey(s.dateKey);
    if (!d) return false;
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo && d <= now;
  });
  const workoutCompletion = weekSessions.length;
  const profile = ad && ad.profile;
  const wrFull = rep.weekly && rep.weekly.full;

  let html = `<div class="tr-page"><div class="tr-problem-detail">`;

  // Back + title
  html += `<div class="tr-section-header"><button class="tr-back-btn" id="problemDetailBackBtn">← Back</button><span class="tr-section-title">${problem.title}</span></div>`;

  // 1. Overview
  html += `<div class="tr-section"><div class="tr-pd-overview">
    <div class="tr-pd-category">${problem.category}</div>
    <div class="tr-pd-difficulty">${problem.difficulty}</div>
    <p class="tr-pd-description">${problem.description}</p>
  </div></div>`;

  // 2. Most Common Causes
  html += `<div class="tr-section"><div class="tr-section-header"><span class="tr-section-title" style="font-size:16px">Most Common Causes</span></div>
    <div class="tr-pd-causes">${problem.causes.map(c => `<div class="tr-pd-cause"><span class="tr-pd-cause-bullet">•</span><span>${c}</span></div>`).join("")}
  </div></div>`;

  // 3. Reality Check
  html += `<div class="tr-section"><div class="tr-pd-reality">
    <div class="tr-pd-reality-icon">💡</div>
    <div class="tr-pd-reality-text">${problem.realityCheck}</div>
  </div></div>`;

  // 4. Action Plan (checklist)
  html += `<div class="tr-section"><div class="tr-section-header"><span class="tr-section-title" style="font-size:16px">What To Do</span></div>
    <div class="tr-pd-action">${problem.actionPlan.map((item, i) => `<button class="tr-pa-item" data-action-index="${i}"><span class="tr-pa-check">○</span><span class="tr-pa-text">${item.text}</span></button>`).join("")}
  </div></div>`;

  // 5. Advanced Fixes
  if (problem.advancedFixes && problem.advancedFixes.length > 0) {
    html += `<div class="tr-section"><div class="tr-section-header"><span class="tr-section-title" style="font-size:16px">Already Doing This?</span></div>
      <div class="tr-pd-advanced">${problem.advancedFixes.map(f => `<div class="tr-pd-advanced-item"><span class="tr-pd-advanced-bullet">→</span><span>${f}</span></div>`).join("")}
    </div></div>`;
  }

  // 6. Coach Analysis (uses real user data + adaptive profile)
  const csScore = wrFull ? wrFull.coachScore : 0;
  const riskLabel = profile ? profile.riskLevel : null;
  const focusLabel = ad && ad.focus ? ad.focus.label : null;
  const csColor = csScore >= 80 ? "var(--accent)" : csScore >= 60 ? "var(--orange)" : "var(--red)";

  html += `<div class="tr-section"><div class="tr-section-header"><span class="tr-section-title" style="font-size:16px">Coach Analysis</span></div>
    <div class="tr-coach-analysis">
      <div class="tr-ca-grid">
        <div class="tr-ca-item"><span class="tr-ca-label">Your Goal</span><span class="tr-ca-value">${gs.goalLabel}</span></div>
        <div class="tr-ca-item"><span class="tr-ca-label">Coach Score</span><span class="tr-ca-value" style="color:${csColor}">${csScore}${focusLabel ? ` · Focus: ${focusLabel}` : ""}</span></div>
        ${riskLabel ? `<div class="tr-ca-item"><span class="tr-ca-label">Risk Level</span><span class="tr-ca-value" style="color:${riskLabel === "low" ? "var(--accent)" : riskLabel === "medium" ? "var(--orange)" : "var(--red)"}">${riskLabel.charAt(0).toUpperCase() + riskLabel.slice(1)}</span></div>` : ""}
        <div class="tr-ca-item"><span class="tr-ca-label">Weight Trend</span><span class="tr-ca-value ${weightTrend === "up" ? "tr-ca-negative" : weightTrend === "down" ? "tr-ca-positive" : ""}">${weightTrend === "not enough data" ? "—" : weightTrend === "stable" ? "Stable" : weightTrend === "up" ? "↑ Increasing" : "↓ Decreasing"}</span></div>
        <div class="tr-ca-item"><span class="tr-ca-label">Recovery</span><span class="tr-ca-value">${rec.score}/100 (${rec.status})</span></div>
        <div class="tr-ca-item"><span class="tr-ca-label">Workouts This Week</span><span class="tr-ca-value">${workoutCompletion}</span></div>
        ${proteinData ? `<div class="tr-ca-item"><span class="tr-ca-label">Protein Target</span><span class="tr-ca-value">${proteinData.target}g/day</span></div>` : ""}
        <div class="tr-ca-item"><span class="tr-ca-label">Coach Says</span><span class="tr-ca-value tr-ca-message">${dc.coachMessage}</span></div>
      </div>
    </div>
  </div>`;

  // 7. Recommended Next Action
  const hasGenerator = problem.relatedTools.includes("generator");
  const hasNutrition = problem.relatedTools.includes("nutrition");
  const hasGoalStrategy = problem.relatedTools.includes("goal-strategy");
  let ctaText = "Review Your Goal Strategy";
  let ctaAction = "goalStrategy";
  if (hasGenerator) {
    ctaText = "Generate Workout Split";
    ctaAction = "generator";
  } else if (hasNutrition) {
    ctaText = "Review Nutrition Strategy";
    ctaAction = "nutrition";
  }

  html += `<div class="tr-section tr-section-last"><div class="tr-recommend-cta">
    <div class="tr-recommend-cta-label">Recommended Next Action</div>
    <button class="tr-recommend-cta-btn" id="problemCtaBtn" data-cta="${ctaAction}">${ctaText}</button>
  </div></div>`;

  html += `</div></div>`;
  container.innerHTML = html;
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);

  // Back button
  document.getElementById("problemDetailBackBtn")?.addEventListener("click", () => showTrainerScreen("problems"));

  // Checklist click toggles
  container.querySelectorAll(".tr-pa-item").forEach(item => {
    item.addEventListener("click", () => {
      item.classList.toggle("is-checked");
      const check = item.querySelector(".tr-pa-check");
      if (check) check.textContent = item.classList.contains("is-checked") ? "✓" : "○";
    });
  });

  // CTA button
  document.getElementById("problemCtaBtn")?.addEventListener("click", () => {
    const cta = document.getElementById("problemCtaBtn").dataset.cta;
    if (cta === "generator") {
      openNewWorkoutGenerator();
    } else {
      showTrainerScreen("home");
      setTimeout(() => {
        document.querySelector(".tr-strategy")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  });
}

function openNewWorkoutGenerator() {
  showScreen("screen-new-workout");
  document.getElementById("newWoGenerate")?.click();
}

// ===== LEARNING HUB V2 =====

function getLearningProgress() {
  try { return JSON.parse(localStorage.getItem(LH_PROGRESS_KEY)) || { completed: [], saved: [], streak: 0, lastRead: null }; }
  catch { return { completed: [], saved: [], streak: 0, lastRead: null }; }
}

function saveLearningProgress(p) {
  localStorage.setItem(LH_PROGRESS_KEY, JSON.stringify(p));
}

function getLessonById(id) {
  return LESSON_DATABASE.find(l => l.id === id);
}

function getCategoryById(id) {
  return LESSON_CATEGORIES.find(c => c.id === id);
}

function getGoalRelevance(lesson) {
  const goal = GoalCenter.getGoalType();
  const map = { "build-muscle": "muscle", "lose-fat": "fat", "strength": "strength", "general": "general", "athletic": "athletic" };
  return lesson.goalRelevance[goal] || "medium";
}

function getRecommendedLessons() {
  const goal = GoalCenter.getGoalType();
  const progress = getLearningProgress();
  const weightTrend = (state.weightLog || []).length > 2 ? getWeightTrend() : null;
  const weekCount = (state.sessions || []).filter(s => {
    if (!s.finishedAt) return false;
    const d = parseDateKey(s.dateKey);
    if (!d) return false;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  // Get adaptive profile focus area
  let focusArea = null;
  try {
    const coach = CoachEngine.runAll();
    if (coach.adaptive && coach.adaptive.focus) focusArea = coach.adaptive.focus.area;
  } catch (e) { /* ignore */ }

  const focusLessonMap = {
    protein: ["nutrition-fundamentals", "protein-timing", "calorie-tracking"],
    recovery: ["recovery-basics", "sleep-optimization", "overtraining"],
    workout: ["training-frequency", "programming-basics", "what-matters-most"],
    steps: ["cardio-for-fat-loss", "activity-tracking", "walking-for-fat-loss"],
    tracking: ["tracking-accuracy", "goal-setting", "calorie-deficit"],
    weight: ["nutrition-fundamentals", "calorie-tracking", "fat-loss-plateaus"],
  };

  let scored = LESSON_DATABASE.map(l => {
    let score = 0;
    const rel = getGoalRelevance(l);
    if (rel === "high") score += 10;
    else if (rel === "medium") score += 5;
    if (!progress.completed.includes(l.id)) score += 8;
    if (goal === "lose-fat" && l.category === "Fat Loss") score += 8;
    if (goal === "lose-fat" && l.category === "Cardio") score += 6;
    if (goal === "lose-fat" && l.category === "Nutrition") score += 6;
    if (goal === "build-muscle" && l.category === "Muscle Building") score += 8;
    if (goal === "build-muscle" && l.category === "Strength Fundamentals") score += 6;
    if (goal === "strength" && l.category === "Strength Fundamentals") score += 8;
    if (weekCount < 2 && l.id === "what-matters-most") score += 10;
    if (weightTrend === "up" && goal === "lose-fat" && l.id === "calorie-deficit") score += 8;
    if (weightTrend === "stable" && goal === "lose-fat" && l.id === "fat-loss-plateaus") score += 8;

    // Adaptive focus area boost
    if (focusArea && focusLessonMap[focusArea]) {
      if (focusLessonMap[focusArea].includes(l.id)) score += 12;
    }

    return { lesson: l, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 6).map(s => s.lesson);
}

function renderLearningHub() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const progress = getLearningProgress();
  const recommendations = getRecommendedLessons();
  const totalLessons = LESSON_DATABASE.length;
  const completedCount = progress.completed.length;

  let html = `<div class="tr-page"><div class="tr-section">`;
  html += `<div class="tr-section-header"><button class="tr-back-btn" id="lhBackBtn">← Back</button><span class="tr-section-title">Learn</span></div>`;

  // Progress summary
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  html += `<div class="lh-progress"><div class="lh-progress-ring"><svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="22" fill="none" stroke="var(--border)" stroke-width="4"/><circle cx="28" cy="28" r="22" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-dasharray="138.23" stroke-dashoffset="${138.23 - (pct / 100) * 138.23}" transform="rotate(-90 28 28)"/></svg><span class="lh-progress-pct">${pct}%</span></div><div class="lh-progress-info"><div class="lh-progress-count">${completedCount} / ${totalLessons} Lessons</div><div class="lh-progress-streak">🔥 ${progress.streak} Day Streak</div></div></div>`;

  // Recommended For You
  if (recommendations.length > 0) {
    html += `<div class="lh-section"><div class="lh-section-title">Recommended For You</div><div class="lh-rec-cards">`;
    html += recommendations.map(l => `<button class="lh-rec-card" data-lesson-id="${l.id}"><span class="lh-rec-icon">${getLessonIcon(l)}</span><span class="lh-rec-body"><span class="lh-rec-title">${l.title}</span><span class="lh-rec-meta">${l.category} · ${l.readingTime}</span></span></button>`).join("");
    html += `</div></div>`;
  }

  // Categories grid
  html += `<div class="lh-section"><div class="lh-section-title">All Categories</div><div class="lh-categories">`;
  html += LESSON_CATEGORIES.map(c => {
    const catLessonCount = c.lessons.length || 1;
    const catDone = c.lessons.filter(id => progress.completed.includes(id)).length;
    const catPct = catLessonCount > 0 ? Math.round((catDone / catLessonCount) * 100) : 0;
    return `<button class="lh-cat-card" data-category-id="${c.id}"${c.color ? ` style="--cat-color:${c.color}"` : ""}><div class="lh-cat-top"><span class="lh-cat-icon">${c.icon || "📖"}</span></div><div class="lh-cat-body"><div class="lh-cat-name">${c.name || "Category"}</div><div class="lh-cat-progress-bar"><div class="lh-cat-progress-fill" style="width:${catPct}%"></div></div><div class="lh-cat-meta">${catDone}/${catLessonCount} · ${catPct}%</div></div></button>`;
  }).join("");
  html += `</div></div>`;
  html += `</div></div>`;

  container.innerHTML = html;

  document.getElementById("lhBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));

  container.querySelectorAll("[data-lesson-id]").forEach(btn => {
    btn.addEventListener("click", () => renderLessonDetail(btn.dataset.lessonId));
  });
  container.querySelectorAll("[data-category-id]").forEach(btn => {
    btn.addEventListener("click", () => renderLessonCategory(btn.dataset.categoryId));
  });
}

function getLessonIcon(lesson) {
  const cat = LESSON_CATEGORIES.find(c => c.lessons.includes(lesson.id));
  return cat ? cat.icon : "📖";
}

function renderLessonCategory(categoryId) {
  const cat = getCategoryById(categoryId);
  if (!cat) return;
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const progress = getLearningProgress();
  const lessons = cat.lessons.map(id => getLessonById(id)).filter(Boolean);
  const catDone = lessons.filter(l => progress.completed.includes(l.id)).length;

  let html = `<div class="tr-page"><div class="tr-section">`;
  html += `<div class="tr-section-header"><button class="tr-back-btn" id="lhCatBackBtn">← Back</button></div>`;
  html += `<div class="lh-cat-header"><span class="lh-cat-header-icon">${cat.icon}</span><div><div class="lh-cat-header-name">${cat.name}</div><div class="lh-cat-header-progress">${catDone}/${lessons.length} lessons completed</div></div></div>`;
  html += `<div class="lh-lesson-list">`;
  lessons.forEach(l => {
    const done = progress.completed.includes(l.id);
    const saved = progress.saved.includes(l.id);
    html += `<button class="lh-lesson-card" data-lesson-id="${l.id}"><div class="lh-lesson-left"><div class="lh-lesson-check${done ? " is-done" : ""}">${done ? "✓" : "○"}</div><div class="lh-lesson-info"><div class="lh-lesson-title">${l.title}</div><div class="lh-lesson-meta">${l.difficulty} · ${l.readingTime}${saved ? ' · <span style="color:var(--accent)">Saved</span>' : ""}</div></div></div><span class="lh-lesson-arrow">→</span></button>`;
  });
  html += `</div></div></div>`;
  container.innerHTML = html;

  document.getElementById("lhCatBackBtn")?.addEventListener("click", () => renderLearningHub());
  container.querySelectorAll("[data-lesson-id]").forEach(btn => {
    btn.addEventListener("click", () => renderLessonDetail(btn.dataset.lessonId));
  });
}

function renderLessonDetail(lessonId) {
  const lesson = getLessonById(lessonId);
  if (!lesson) return;
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const progress = getLearningProgress();
  const goal = GoalCenter.getGoalType();
  const goalLabel = goal === "build-muscle" ? "Muscle Gain" : goal === "lose-fat" ? "Fat Loss" : goal === "strength" ? "Strength" : goal === "athletic" ? "Athletic" : "General";
  const isCompleted = progress.completed.includes(lesson.id);
  const isSaved = progress.saved.includes(lesson.id);
  const goalRel = getGoalRelevance(lesson);
  const goalRelLabel = goalRel === "high" ? "Highly Relevant For Your Goal" : goalRel === "medium" ? "Relevant For Your Goal" : "Supplementary Content";

  let html = `<div class="tr-page"><div class="lh-lesson-detail">`;

  // Back
  html += `<div class="tr-section-header"><button class="tr-back-btn" id="lhDetailBackBtn">← Back</button></div>`;

  // SECTION 1: Hero
  html += `<div class="lh-detail-hero">
    <div class="lh-hero-category">${lesson.category}</div>
    <div class="lh-hero-title">${lesson.title}</div>
    <div class="lh-hero-meta-row">
      <span class="lh-hero-meta-tag">${lesson.difficulty}</span>
      <span class="lh-hero-meta-tag">${lesson.readingTime} Read</span>
      <span class="lh-hero-meta-tag lh-hero-relevance">${goalRelLabel}</span>
    </div>
  </div>`;

  // SECTION 2: Simple Explanation
  html += `<div class="lh-section"><div class="lh-detail-section-title">What Is It?</div>
    <div class="lh-detail-text">${lesson.description}</div>
  </div>`;

  // SECTION 3: Why It Matters
  html += `<div class="lh-section"><div class="lh-detail-section-title">Why It Matters</div>
    <div class="lh-detail-text">${lesson.whyItMatters}</div>
  </div>`;

  // SECTION 4: Real Life Example
  html += `<div class="lh-section"><div class="lh-detail-section-title">Real Life Example</div>
    <div class="lh-detail-example">${lesson.realLifeExample}</div>
  </div>`;

  // SECTION 5: Common Mistakes
  if (lesson.commonMistakes && lesson.commonMistakes.length > 0) {
    html += `<div class="lh-section"><div class="lh-detail-section-title">Common Mistakes</div>
      <div class="lh-detail-mistakes">${lesson.commonMistakes.map(m => `<div class="lh-mistake-item"><span class="lh-mistake-bullet">✕</span><span>${m}</span></div>`).join("")}</div>
    </div>`;
  }

  // SECTION 6: Action Steps
  if (lesson.actionSteps && lesson.actionSteps.length > 0) {
    html += `<div class="lh-section"><div class="lh-detail-section-title">Action Steps</div>
      <div class="lh-detail-actions">${lesson.actionSteps.map((a, i) => `<div class="lh-action-item"><span class="lh-action-check">${isCompleted ? "✓" : "☐"}</span><span>${a}</span></div>`).join("")}</div>
    </div>`;
  }

  // SECTION 7: Coach Recommendation (personalized)
  let coachText = lesson.coachRecommendation;
  if (goal === "lose-fat") {
    coachText = lesson.coachRecommendation + (goal === "lose-fat" && lesson.category !== "Fat Loss" && lesson.category !== "Cardio" ? ` Remember your fat loss goal — apply these principles while maintaining your calorie deficit.` : "");
  } else if (goal === "build-muscle") {
    coachText = lesson.coachRecommendation + (lesson.category !== "Muscle Building" ? ` For your muscle-building goal, prioritize applying these fundamentals alongside your hypertrophy training.` : "");
  }
  html += `<div class="lh-section"><div class="lh-detail-section-title">Coach Says</div>
    <div class="lh-coach-box">${coachText}</div>
  </div>`;

  // SECTION 8: Related Lessons
  if (lesson.relatedLessons && lesson.relatedLessons.length > 0) {
    html += `<div class="lh-section"><div class="lh-detail-section-title">Related Lessons</div>
      <div class="lh-related">${lesson.relatedLessons.map(id => {
        const rl = getLessonById(id);
        return rl ? `<button class="lh-related-card" data-lesson-id="${rl.id}"><span class="lh-related-icon">${getLessonIcon(rl)}</span><span class="lh-related-info"><span class="lh-related-title">${rl.title}</span><span class="lh-related-meta">${rl.readingTime}</span></span></button>` : "";
      }).join("")}</div>
    </div>`;
  }

  // Apply To My Plan button
  if (lesson.applyAction) {
    const applyLabel = lesson.applyAction.type === "protein" ? "Update Protein Target" : lesson.applyAction.type === "steps" ? "Update Step Target" : lesson.applyAction.type === "calories" ? "Update Calorie Target" : lesson.applyAction.type === "water" ? "Update Water Target" : "Apply To My Plan";
    html += `<div class="lh-section"><button class="lh-apply-btn" id="lhApplyBtn" data-apply-type="${lesson.applyAction.type}">${applyLabel}</button></div>`;
  }

  // Bottom CTAs
  html += `<div class="lh-detail-ctas">
    <button class="lh-cta-btn ${isCompleted ? "is-done" : ""}" id="lhMarkBtn">${isCompleted ? "✓ Completed" : "Mark As Read"}</button>
    <button class="lh-cta-btn lh-cta-secondary ${isSaved ? "is-done" : ""}" id="lhSaveBtn">${isSaved ? "Saved" : "Save For Later"}</button>
  </div>`;

  html += `</div></div>`;
  container.innerHTML = html;
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);

  // Back
  document.getElementById("lhDetailBackBtn")?.addEventListener("click", () => {
    const cat = LESSON_CATEGORIES.find(c => c.lessons.includes(lessonId));
    cat ? renderLessonCategory(cat.id) : renderLearningHub();
  });

  // Mark as read
  document.getElementById("lhMarkBtn")?.addEventListener("click", () => {
    const p = getLearningProgress();
    if (!p.completed.includes(lessonId)) {
      p.completed.push(lessonId);
      p.streak = (p.streak || 0) + 1;
      p.lastRead = new Date().toISOString();
      saveLearningProgress(p);
      renderLessonDetail(lessonId);
    }
  });

  // Save for later
  document.getElementById("lhSaveBtn")?.addEventListener("click", () => {
    const p = getLearningProgress();
    if (p.saved.includes(lessonId)) {
      p.saved = p.saved.filter(id => id !== lessonId);
    } else {
      p.saved.push(lessonId);
    }
    saveLearningProgress(p);
    renderLessonDetail(lessonId);
  });

  // Apply to my plan
  document.getElementById("lhApplyBtn")?.addEventListener("click", () => {
    const type = document.getElementById("lhApplyBtn").dataset.applyType;
    if (type === "protein") {
      const w = (state.user && state.user.weight) || 70;
      const g = GoalCenter.getGoalType();
      const mult = g === "lose-fat" ? 2.2 : 2.0;
      const target = Math.round(w * mult);
      showToast(`Protein target set to ${target}g/day`);
    } else if (type === "steps") {
      showToast("Daily step target set to 10,000 steps");
    } else if (type === "calories") {
      showToast("Deficit target adjusted");
    } else if (type === "water") {
      const w = (state.user && state.user.weight) || 70;
      const target = (w * 0.04).toFixed(1);
      showToast(`Water target set to ${target}L/day`);
    }
  });

  // Related lesson clicks
  container.querySelectorAll("[data-lesson-id]").forEach(btn => {
    btn.addEventListener("click", () => renderLessonDetail(btn.dataset.lessonId));
  });
}

// ===== EXERCISE ENCYCLOPEDIA V1 =====
const ENC_CATEGORIES = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];
const ENC_EQUIPMENT_FILTERS = ["All", "Barbell", "Dumbbells", "Bodyweight", "Cable", "Machine", "Treadmill"];

function getExerciseById(id) {
  return (EXERCISE_LIBRARY.find(e => e.description && e.id === id)) || EXERCISE_LIBRARY.find(e => e.id === id);
}

const _encExs = () => EXERCISE_LIBRARY.filter(e => e.description);

function getRecommendedExercises() {
  const goal = GoalCenter.getGoalType();
  const goalMap = { "build-muscle": "buildMuscle", "lose-fat": "loseFat", "strength": "strength" };
  const goalKey = goalMap[goal] || "buildMuscle";
  const goalPriority = goal === "build-muscle" ? ["Muscle Gain", "Hypertrophy", "General Fitness"] : goal === "lose-fat" ? ["Fat Loss", "Endurance", "General Fitness"] : goal === "strength" ? ["Strength", "Athletic Performance", "General Fitness"] : ["General Fitness"];
  let scored = _encExs().map(e => {
    let score = 0;
    const bestFor = e.whenToUse.bestFor || [];
    if (bestFor.some(b => goalPriority.includes(b))) score += 6;
    if (goalKey === "buildMuscle" && (e.ratings.hypertrophy || 0) >= 8) score += 4;
    if (goalKey === "loseFat" && (e.ratings.fatLoss || 0) >= 8) score += 4;
    if (goalKey === "strength" && (e.ratings.strength || 0) >= 8) score += 4;
    if ((e.ratings.beginner || 0) >= 8) score += 2;
    return { exercise: e, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 6).map(s => s.exercise);
}

function getExerciseCategoryAbbr(cat) {
  const map = { "Chest": "CH", "Back": "BK", "Shoulders": "SH", "Arms": "AR", "Legs": "LG", "Core": "CR", "Cardio": "CD" };
  return map[cat] || "EX";
}

function renderExerciseEncyclopedia() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const goal = GoalCenter.getGoalType();
  const recommendations = getRecommendedExercises();
  const activeCat = "All";
  const activeEquip = "All";

  let html = `<div class="tr-page ee-page">`;

  // Header
  html += `<div class="tr-section-header" style="padding:12px 16px;border-bottom:1px solid var(--border);margin:0;flex-shrink:0"><button class="tr-back-btn" id="eeBackBtn">← Back</button><span class="tr-section-title">Exercises</span></div>`;

  // Search
  html += `<div style="padding:8px 16px"><input type="text" class="ee-search" id="eeSearch" placeholder="Search exercises, muscles, equipment..." autocomplete="off" /></div>`;

  // Category filters
  html += `<div class="ee-filters" id="eeFilters">`;
  html += ENC_CATEGORIES.map(c => `<button class="ee-filter${c === activeCat ? " is-active" : ""}" data-ee-cat="${c}">${c}</button>`).join("");
  html += `</div>`;

  // Equipment filters
  html += `<div class="ee-equipment-row" id="eeEquipmentFilters">`;
  html += ENC_EQUIPMENT_FILTERS.map(e => `<button class="ee-equipment-filter${e === activeEquip ? " is-active" : ""}" data-ee-equip="${e}">${e}</button>`).join("");
  html += `</div>`;

  // Recommendations
  if (recommendations.length > 0) {
    html += `<div class="ee-section"><div class="ee-section-title">Recommended For You</div>`;
    html += `<div class="ee-rec-cards">`;
    html += recommendations.map(e => `<button class="ee-rec-card" data-ee-id="${e.id}"><span class="ee-rec-icon" style="font-size:12px;font-weight:800;color:var(--accent);background:var(--surface-2);width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px">${getExerciseCategoryAbbr(e.category)}</span><span class="ee-rec-body"><span class="ee-rec-name">${e.name}</span><span class="ee-rec-meta">${e.primaryMuscles.join(", ")} · ${e.equipment}</span></span><span class="ee-rec-cat">${e.category}</span></button>`).join("");
    html += `</div></div>`;
  }

  // Exercise grid header
  const eeExs = _encExs();
  html += `<div class="ee-count" id="eeCount">${eeExs.length} Exercises</div>`;
  html += `<div class="ee-grid" id="eeGrid">`;
  html += eeExs.map(e => renderEECard(e)).join("");
  html += `</div>`;

  html += `</div>`;
  container.innerHTML = html;
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);

  // Back button
  document.getElementById("eeBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));

  // Search listener
  document.getElementById("eeSearch")?.addEventListener("input", (e) => {
    filterEE(e.target.value.trim());
  });

  // Category filter clicks
  document.querySelectorAll("[data-ee-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-ee-cat]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      filterEE(document.getElementById("eeSearch")?.value?.trim() || "");
    });
  });

  // Equipment filter clicks
  document.querySelectorAll("[data-ee-equip]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-ee-equip]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      filterEE(document.getElementById("eeSearch")?.value?.trim() || "");
    });
  });

  // Card clicks
  container.querySelectorAll("[data-ee-id]").forEach(btn => {
    btn.addEventListener("click", () => renderExerciseDetailPage(btn.dataset.eeId));
  });
}

function renderEECard(ex) {
  return `<button class="ee-card" data-ee-id="${ex.id}">
    <div class="ee-card-top">
      <span class="ee-card-badge">${ex.category || "General"}</span>
      <span class="ee-card-diff">${ex.difficulty || "Intermediate"}</span>
    </div>
    <div class="ee-card-name">${ex.name}</div>
    <div class="ee-card-meta">
      <span>${ex.equipment || "Any"}</span>
      <span>${ex.movementType || "General"}</span>
    </div>
  </button>`;
}

function filterEE(query) {
  const activeCat = document.querySelector("[data-ee-cat].is-active")?.dataset.eeCat || "All";
  const activeEquip = document.querySelector("[data-ee-equip].is-active")?.dataset.eeEquip || "All";
  const grid = document.getElementById("eeGrid");
  const count = document.getElementById("eeCount");
  if (!grid) return;

  let filtered = _encExs().filter(ex => {
    if (activeCat !== "All" && ex.category !== activeCat) return false;
    if (activeEquip !== "All" && ex.equipment !== activeEquip) return false;
    if (query) {
      const qLower = query.toLowerCase();
      const searchText = (ex.name + " " + (ex.description || "") + " " + ex.category + " " + ex.equipment + " " + (ex.movementType || "") + " " + (ex.primaryMuscles || []).join(" ") + " " + (ex.secondaryMuscles || []).join(" ") + " " + (ex.keywords || []).join(" ")).toLowerCase();
      if (!searchText.includes(qLower)) return false;
    }
    return true;
  });

  grid.innerHTML = filtered.length > 0 ? filtered.map(ex => renderEECard(ex)).join("") : `<div class="ee-empty">No exercises found. Try a different search or filter.</div>`;
  count.textContent = `${filtered.length} Exercise${filtered.length !== 1 ? "s" : ""}`;

  // Re-bind card clicks
  grid.querySelectorAll("[data-ee-id]").forEach(btn => {
    btn.addEventListener("click", () => renderExerciseDetailPage(btn.dataset.eeId));
  });
}

function renderExerciseDetailPage(exerciseId) {
  const ex = getExerciseById(exerciseId);
  if (!ex) return;
  const container = document.getElementById("trainerPageContent");
  if (!container) return;

  let html = `<div class="tr-page"><div class="ee-detail">`;

  // Back button
  html += `<div class="tr-section-header" style="padding:8px 16px;margin:0"><button class="tr-back-btn" id="eeDetailBackBtn">← Back</button></div>`;

  // HERO
  html += `<div class="ee-detail-hero">
    <div class="ee-hero-category">${ex.category || "General"} · ${ex.movementType || "General"}</div>
    <div class="ee-hero-title">${ex.name}</div>
    <div class="ee-hero-meta-row">
      <span class="ee-hero-meta-tag">${ex.equipment || "Any"}</span>
      <span class="ee-hero-meta-tag">${ex.difficulty || "Intermediate"}</span>
    </div>
  </div>`;

  // MUSCLE MAP
  html += `<div class="ee-section"><div class="ee-detail-section-title">Muscles Targeted</div>`;
  html += `<div class="ee-muscle-grid">`;
  ex.primaryMuscles.forEach(m => {
    html += `<div class="ee-muscle-item"><span class="ee-muscle-name">${m}</span><span class="ee-muscle-label">Primary</span></div>`;
  });
  ex.secondaryMuscles.forEach(m => {
    html += `<div class="ee-muscle-item"><span class="ee-muscle-name">${m}</span><span class="ee-muscle-label">Secondary</span></div>`;
  });
  if (ex.stabilizers && ex.stabilizers.length > 0) {
    ex.stabilizers.forEach(m => {
      html += `<div class="ee-muscle-item"><span class="ee-muscle-name">${m}</span><span class="ee-muscle-label">Stabilizer</span></div>`;
    });
  }
  html += `</div></div>`;

  // DESCRIPTION (Why This Exercise Exists)
  html += `<div class="ee-section"><div class="ee-detail-section-title">Why This Exercise Exists</div>
    <div class="ee-detail-text">${ex.description}</div>
  </div>`;

  // WHY USE IT
  html += `<div class="ee-section"><div class="ee-detail-section-title">Why Use It</div>
    <div class="ee-detail-text">${ex.whyUseIt}</div>
  </div>`;

  // WHEN TO USE
  html += `<div class="ee-section"><div class="ee-detail-section-title">When To Use It</div>
    <div class="ee-when-box">
      <div><strong style="font-size:12px;color:var(--accent);text-transform:uppercase;letter-spacing:0.04em">Best For</strong></div>
      <div class="ee-best-for">${ex.whenToUse.bestFor.map(b => `<span>${b}</span>`).join("")}</div>
      ${ex.whenToUse.lessImportant && ex.whenToUse.lessImportant.length > 0 ? `<div style="margin-top:4px"><strong style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em">Less Important For</strong></div><div class="ee-less-important">${ex.whenToUse.lessImportant.map(l => `<span>${l}</span>`).join("")}</div>` : ""}
    </div>
  </div>`;

  // STEP-BY-STEP
  html += `<div class="ee-section"><div class="ee-detail-section-title">Step-by-Step Guide</div>
    <div class="ee-steps-list">${ex.stepByStep.map(s => `<div class="ee-step-item">${s}</div>`).join("")}</div>
  </div>`;

  // COACHING CUES
  if (ex.coachingCues && ex.coachingCues.length > 0) {
    html += `<div class="ee-section"><div class="ee-detail-section-title">Coaching Cues</div>
      <div class="ee-cues-list">${ex.coachingCues.map(c => `<span class="ee-cue-item">${c}</span>`).join("")}</div>
    </div>`;
  }

  // COMMON MISTAKES
  if (ex.mistakes && ex.mistakes.length > 0) {
    html += `<div class="ee-section"><div class="ee-detail-section-title">Common Mistakes</div>
      <div class="ee-mistakes-list">${ex.mistakes.map(m => `<div class="ee-mistake-card"><div class="ee-mistake-problem">✕ ${m.problem}</div><div class="ee-mistake-why">${m.why}</div><div class="ee-mistake-fix">${m.fix}</div></div>`).join("")}</div>
    </div>`;
  }

  // PROGRESSION GUIDE
  html += `<div class="ee-section"><div class="ee-detail-section-title">Progression Guide</div>
    <div class="ee-progression-box">${ex.progressionGuide}</div>
  </div>`;

  // GOAL-SPECIFIC COACHING
  html += `<div class="ee-section"><div class="ee-detail-section-title">Goal-Specific Coaching</div>
    <div class="ee-goal-coaching">
      ${ex.goalSpecificCoaching.buildMuscle ? `<div class="ee-goal-item"><div class="ee-goal-item-label">Build Muscle</div><div class="ee-goal-item-text">${ex.goalSpecificCoaching.buildMuscle}</div></div>` : ""}
      ${ex.goalSpecificCoaching.loseFat ? `<div class="ee-goal-item"><div class="ee-goal-item-label">Lose Fat</div><div class="ee-goal-item-text">${ex.goalSpecificCoaching.loseFat}</div></div>` : ""}
      ${ex.goalSpecificCoaching.strength ? `<div class="ee-goal-item"><div class="ee-goal-item-label">Strength</div><div class="ee-goal-item-text">${ex.goalSpecificCoaching.strength}</div></div>` : ""}
    </div>
  </div>`;

  // RATINGS
  html += `<div class="ee-section"><div class="ee-detail-section-title">Exercise Ratings</div>
    <div class="ee-ratings-grid">
      <div class="ee-rating-item"><span class="ee-rating-value">${ex.ratings && ex.ratings.strength != null ? ex.ratings.strength : "—"}/10</span><span class="ee-rating-label">Strength</span></div>
      <div class="ee-rating-item"><span class="ee-rating-value">${ex.ratings && ex.ratings.hypertrophy != null ? ex.ratings.hypertrophy : "—"}/10</span><span class="ee-rating-label">Hypertrophy</span></div>
      <div class="ee-rating-item"><span class="ee-rating-value">${ex.ratings && ex.ratings.fatLoss != null ? ex.ratings.fatLoss : "—"}/10</span><span class="ee-rating-label">Fat Loss</span></div>
      <div class="ee-rating-item"><span class="ee-rating-value">${ex.ratings && ex.ratings.beginner != null ? ex.ratings.beginner : "—"}/10</span><span class="ee-rating-label">Beginner Friendly</span></div>
      <div class="ee-rating-item"><span class="ee-rating-value">${ex.ratings && ex.ratings.recoveryCost != null ? ex.ratings.recoveryCost : "—"}/10</span><span class="ee-rating-label">Recovery Cost</span></div>
    </div>
  </div>`;

  // PROGRAMMING TIPS
  html += `<div class="ee-section"><div class="ee-detail-section-title">Programming</div>
    <div class="ee-programming-grid">
      <div class="ee-programming-item"><span class="ee-programming-label">Sets</span><span class="ee-programming-value">${ex.programmingTips.sets}</span></div>
      <div class="ee-programming-item"><span class="ee-programming-label">Reps</span><span class="ee-programming-value">${ex.programmingTips.reps}</span></div>
      <div class="ee-programming-item"><span class="ee-programming-label">Frequency</span><span class="ee-programming-value">${ex.programmingTips.frequency}</span></div>
      <div class="ee-programming-item"><span class="ee-programming-label">Rest</span><span class="ee-programming-value">${ex.programmingTips.rest}</span></div>
    </div>
  </div>`;

  // WHY IN PLAN
  if (ex.whenInPlan) {
    html += `<div class="ee-section"><div class="ee-detail-section-title">Why It's In Your Workout</div>
      <div class="ee-in-plan-box">${ex.whenInPlan}</div>
    </div>`;
  }

  // ALTERNATIVES
  if (ex.alternatives && ex.alternatives.length > 0) {
    html += `<div class="ee-section"><div class="ee-detail-section-title">Alternatives</div>
      <div class="ee-alt-list">${ex.alternatives.map(a => `<span class="ee-alt-item">${a}</span>`).join("")}</div>
    </div>`;
  }

  // PAIN-FRIENDLY ALTERNATIVES
  if (ex.painFriendlyAlternatives && ex.painFriendlyAlternatives.length > 0) {
    html += `<div class="ee-section"><div class="ee-detail-section-title">Pain-Friendly Alternatives</div>
      <div class="ee-alt-list">${ex.painFriendlyAlternatives.map(a => `<span class="ee-alt-item">${a}</span>`).join("")}</div>
    </div>`;
  }

  // RELATED EXERCISES
  if (ex.relatedExercises && ex.relatedExercises.length > 0) {
    const related = ex.relatedExercises.map(id => getExerciseById(id)).filter(Boolean);
    if (related.length > 0) {
      html += `<div class="ee-section"><div class="ee-detail-section-title">Related Exercises</div>
        <div class="ee-related-grid">${related.map(r => `<button class="ee-related-card" data-ee-id="${r.id}">${r.name}</button>`).join("")}</div>
      </div>`;
    }
  }

  // Bottom CTAs
  html += `<div class="ee-detail-ctas">
    <button class="ee-cta-btn ee-cta-primary" id="eeAddToWorkout">Add To Workout</button>
    <button class="ee-cta-btn ee-cta-secondary" id="eeSaveExercise">Save Exercise</button>
  </div>`;

  html += `</div></div>`;
  container.innerHTML = html;
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);

  // Back
  document.getElementById("eeDetailBackBtn")?.addEventListener("click", () => renderExerciseEncyclopedia());

  // Related exercise clicks
  container.querySelectorAll("[data-ee-id]").forEach(btn => {
    btn.addEventListener("click", () => renderExerciseDetailPage(btn.dataset.eeId));
  });

  // Save exercise to localStorage
  document.getElementById("eeSaveExercise")?.addEventListener("click", () => {
    const saved = getSavedExercises();
    const idx = saved.indexOf(exerciseId);
    const btn = document.getElementById("eeSaveExercise");
    if (idx > -1) {
      saved.splice(idx, 1);
      btn.textContent = "Save Exercise";
      btn.classList.remove("is-saved");
      showToast("Removed from saved");
    } else {
      saved.push(exerciseId);
      btn.textContent = "Saved";
      btn.classList.add("is-saved");
      showToast("Saved for later");
    }
    localStorage.setItem("ironlog_saved_exercises", JSON.stringify(saved));
  });

  // Check if already saved
  if (getSavedExercises().includes(exerciseId)) {
    document.getElementById("eeSaveExercise").textContent = "Saved";
    document.getElementById("eeSaveExercise").classList.add("is-saved");
  }

  // Add to workout
  document.getElementById("eeAddToWorkout")?.addEventListener("click", () => {
    const el = document.getElementById("nwSearch");
    if (el) {
      el.value = ex.name;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    showScreen("screen-new-workout");
    showToast(`"${ex.name}" ready to add`);
  });
}

function getSavedExercises() {
  try { return JSON.parse(localStorage.getItem("ironlog_saved_exercises") || "[]"); }
  catch { return []; }
}

function openExerciseDetail(exerciseId) {
  renderExerciseDetailPage(exerciseId);
}

// ===== GOAL CENTER V1 =====

function renderGoalCenter() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const gc = GoalCenter.getAll();
  if (!gc.hasGoal) {
    renderGoalCenterEmpty();
    return;
  }
  renderGoalCenterDashboard(gc);
}

function renderGoalCenterEmpty() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  container.innerHTML = `<div class="tr-page"><div class="gc-no-goal">
    <div class="gc-no-goal-icon">🎯</div>
    <div class="gc-no-goal-title">Set Your First Goal</div>
    <div class="gc-no-goal-desc">Define what you want to achieve and let Goals guide every workout, meal, and milestone.</div>
    <button class="gc-no-goal-btn" id="gcCreateFirstBtn">Create Goal</button>
  </div></div>`;
  document.getElementById("gcCreateFirstBtn")?.addEventListener("click", () => renderCreateGoalFlow());
}

function renderGoalCenterDashboard(gc) {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const p = gc.profile;
  const pace = gc.pace;
  const health = gc.health;
  const strategy = gc.strategy;
  const analysis = gc.analysis;
  const actions = gc.actions;

  let html = `<div class="tr-page gc-page">`;

  // Back button
  html += `<div class="tr-section-header" style="padding:12px 16px;border-bottom:1px solid var(--border);margin:0;flex-shrink:0"><button class="tr-back-btn" id="gcBackBtn">← Back</button><span class="tr-section-title">Goals</span></div>`;

  // HERO CARD
  const goalTypeLabels = { "fat-loss": "Fat Loss", "muscle-gain": "Muscle Gain", "strength": "Strength", "general-fitness": "General Fitness", "endurance": "Endurance" };
  const goalLabel = goalTypeLabels[p.goalType] || p.goalType;
  const progressPct = pace ? Math.round(pace.achieved) : 0;
  const ringCircumference = 2 * Math.PI * 22;
  const ringOffset = ringCircumference - (progressPct / 100) * ringCircumference;
  const paceLabel = pace ? pace.label : "No Data";
  let paceClass = "no-data";
  if (pace && pace.status === "on-pace") paceClass = "on-track";
  else if (pace && pace.status === "behind-pace") paceClass = "needs-attention";

  html += `<div class="gc-hero-card">
    <div class="gc-hero-top">
      <div class="gc-hero-type">${goalLabel}</div>
      <span class="gc-hero-status-badge ${paceClass}">${paceLabel}</span>
    </div>
    <div class="gc-hero-ring-wrap">
      <div class="gc-hero-ring">
        <svg viewBox="0 0 56 56">
          <circle class="gc-hero-ring-bg" cx="28" cy="28" r="22"/>
          <circle class="gc-hero-ring-fill" cx="28" cy="28" r="22" stroke-dasharray="${ringCircumference}" stroke-dashoffset="${ringOffset}"/>
        </svg>
        <span class="gc-hero-ring-text">${progressPct}%</span>
      </div>
      <div class="gc-hero-progress-info">
        <div class="gc-hero-progress-pct">${progressPct}% Complete</div>
        ${pace && pace.currentWeight && pace.targetWeight ? `<div class="gc-hero-progress-weight">${pace.currentWeight}kg → ${pace.targetWeight}kg</div>` : pace && pace.currentWeight ? `<div class="gc-hero-progress-weight">Current: ${pace.currentWeight}kg</div>` : ""}
      </div>
    </div>
    ${pace && pace.projectedDateStr ? `<div class="gc-hero-bottom">
      <div class="gc-hero-projected">Projected Goal Date<br><strong>${pace.projectedDateStr}</strong></div>
      <button class="gc-hero-cta" id="gcViewStrategyBtn">View Strategy</button>
    </div>` : `<div class="gc-hero-bottom">
      <div class="gc-hero-projected">Set target weight and log consistently for projections</div>
      <button class="gc-hero-cta" id="gcViewStrategyBtn">View Strategy</button>
    </div>`}
  </div>`;

  // SECTION 2: Goal Progress
  html += `<div class="gc-section"><div class="gc-section-title">Goal Progress</div>`;
  if (pace) {
    html += `<div class="gc-weight-timeline">
      <div class="gc-weight-item">
        <div class="gc-weight-line"></div>
        <div class="gc-weight-dot start"></div>
        <div class="gc-weight-value">${pace.startWeight || "--"}</div>
        <div class="gc-weight-label">Start</div>
      </div>
      <div class="gc-weight-item">
        <div class="gc-weight-line"></div>
        <div class="gc-weight-dot current"></div>
        <div class="gc-weight-value">${pace.currentWeight || "--"}</div>
        <div class="gc-weight-label">Current</div>
      </div>
      <div class="gc-weight-item">
        <div class="gc-weight-dot target"></div>
        <div class="gc-weight-value">${pace.targetWeight || "--"}</div>
        <div class="gc-weight-label">Target</div>
      </div>
    </div>`;
    html += `<div class="gc-metrics-grid" style="margin-top:10px">
      <div class="gc-metric"><span class="gc-metric-value">${pace.totalChange ? pace.totalChange + "kg" : "--"}</span><span class="gc-metric-label">Total Change</span></div>
      <div class="gc-metric"><span class="gc-metric-value">${pace.remaining ? pace.remaining + "kg" : "--"}</span><span class="gc-metric-label">Remaining</span></div>
      <div class="gc-metric"><span class="gc-metric-value">${progressPct}%</span><span class="gc-metric-label">Progress</span></div>
    </div>`;
    if (pace.actualWeeklyRate !== null) {
      html += `<div style="display:flex;align-items:center;gap:8px;margin-top:8px">
        <span style="font-size:12px;color:var(--text-secondary)">Pace: ${Math.abs(pace.actualWeeklyRate).toFixed(2)}kg/week</span>
        <span class="gc-pace-badge ${pace.status === 'on-pace' ? 'on-track' : 'behind'}">${paceLabel}</span>
      </div>`;
    }
  } else {
    html += `<div class="gc-insight-item" style="text-align:center">Set start and target weights to see your progress timeline.</div>`;
  }
  html += `</div>`;

  // SECTION 3: Goal Strategy
  if (strategy) {
    html += `<div class="gc-section"><div class="gc-section-title">Goal Strategy</div>
    <div class="gc-strategy-grid">
      <div class="gc-strategy-target"><div class="gc-strategy-label">Calories</div><div class="gc-strategy-value">${strategy.targets.calories}</div></div>
      <div class="gc-strategy-target"><div class="gc-strategy-label">Protein</div><div class="gc-strategy-value">${strategy.targets.protein}</div></div>
      <div class="gc-strategy-target"><div class="gc-strategy-label">Water</div><div class="gc-strategy-value">${strategy.targets.water}</div></div>
      <div class="gc-strategy-target"><div class="gc-strategy-label">Steps</div><div class="gc-strategy-value">${strategy.targets.steps}</div></div>
      <div class="gc-strategy-target"><div class="gc-strategy-label">Cardio</div><div class="gc-strategy-value">${strategy.targets.cardio}</div></div>
      <div class="gc-strategy-target"><div class="gc-strategy-label">Sleep</div><div class="gc-strategy-value">${strategy.targets.sleep}</div></div>
    </div>`;
    if (strategy.expectedRate) {
      html += `<div class="gc-strategy-rate">Expected Rate: ${strategy.expectedRate}</div>`;
    }
    if (strategy.warnings && strategy.warnings.length > 0) {
      html += `<div class="gc-warnings-list">${strategy.warnings.map(w => `<div class="gc-warning-item">${w}</div>`).join("")}</div>`;
    }
    html += `</div>`;
  }

  // SECTION 4: Coach Analysis
  html += `<div class="gc-section"><div class="gc-section-title">Coach Analysis</div>
  <div class="gc-insights-list">${analysis.length > 0 ? analysis.map(a => `<div class="gc-insight-item">${a}</div>`).join("") : `<div class="gc-insight-item" style="text-align:center;color:var(--text-secondary)">Log your data to get coaching insights.</div>`}</div>
  </div>`;

  // SECTION 5: Goal Health Score
  if (health && health.score !== null) {
    const hc = 2 * Math.PI * 20;
    const hOff = hc - (health.score / 100) * hc;
    html += `<div class="gc-section"><div class="gc-section-title">Goal Health</div>
    <div class="gc-health-card">
      <div class="gc-health-ring">
        <svg viewBox="0 0 56 56">
          <circle class="gc-health-ring-bg" cx="28" cy="28" r="20"/>
          <circle class="gc-health-ring-fill ${health.level}" cx="28" cy="28" r="20" stroke-dasharray="${hc}" stroke-dashoffset="${hOff}"/>
        </svg>
        <span class="gc-health-ring-text ${health.level}">${health.score}</span>
      </div>
      <div class="gc-health-body">
        <div class="gc-health-label">${health.label}</div>
        <div class="gc-health-desc">Based on your goal type, weight trend, training consistency, and nutrition compliance.</div>
      </div>
    </div>
    </div>`;
  }

  // SECTION 6: Weight Insights
  html += `<div class="gc-section">
    <button class="tr-goal-summary" id="gcWeightIntelBtn" style="width:100%;text-align:left">
      <div class="tr-goal-summary-left">
        <span class="tr-goal-summary-label">Weight Insights</span>
        <span class="tr-goal-summary-goal">Trends, pace, and analysis</span>
      </div>
      <div class="tr-goal-summary-right">
        <span class="tr-goal-summary-arrow">→</span>
      </div>
    </button>
  </div>`;

  // SECTION 7: Next Actions
  if (actions && actions.length > 0) {
    html += `<div class="gc-section"><div class="gc-section-title">Next Actions</div>
    <div class="gc-actions-list">${actions.map(a => `<button class="gc-action-btn ${a.type}" data-gc-action="${a.id}">${a.label}</button>`).join("")}</div>
    </div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);

  // Back
  document.getElementById("gcBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));

  // Weight Insights
  document.getElementById("gcWeightIntelBtn")?.addEventListener("click", openWeightIntelligence);

  // View Strategy scrolls to strategy section
  document.getElementById("gcViewStrategyBtn")?.addEventListener("click", () => {
    const s = document.querySelector(".gc-strategy-grid");
    if (s) s.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Action buttons
  container.querySelectorAll("[data-gc-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.gcAction;
      if (action === "log-weight") {
        openWeightLogger();
      } else if (action === "workout") {
        showScreen("screen-home");
        renderHome();
      } else if (action === "review-plan") {
        const s = document.querySelector(".gc-strategy-grid");
        if (s) s.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (action === "increase-steps") {
        showToast("Aim to add 2,000 more steps to your daily target");
      } else if (action === "nutrition") {
        const s = document.querySelector(".gc-strategy-grid");
        if (s) s.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (action === "view-progress") {
        switchTab("progress");
      }
    });
  });
}

// ===== CREATE GOAL FLOW =====

const GOAL_CENTER_FLOW = {
  steps: [
    { id: "type", title: "What's Your Goal?", desc: "Choose your primary fitness objective" },
    { id: "weight", title: "Current Weight", desc: "Your current body weight" },
    { id: "target", title: "Target Weight", desc: "Your goal weight (optional for strength/endurance)" },
    { id: "date", title: "Target Date", desc: "When do you want to achieve this? (optional)" },
    { id: "details", title: "Training Details", desc: "Help us personalize your plan" }
  ],
  data: {
    goalType: "",
    startWeight: null,
    targetWeight: null,
    targetDate: null,
    trainingDays: 3,
    experienceLevel: "beginner",
    activityLevel: "moderate"
  },
  currentStep: 0
};

function renderCreateGoalFlow() {
  GOAL_CENTER_FLOW.currentStep = 0;
  GOAL_CENTER_FLOW.data = {
    goalType: "",
    startWeight: null,
    targetWeight: null,
    targetDate: null,
    trainingDays: 3,
    experienceLevel: "beginner",
    activityLevel: "moderate"
  };
  renderCreateGoalStep();
}

function renderCreateGoalStep() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const step = GOAL_CENTER_FLOW.steps[GOAL_CENTER_FLOW.currentStep];
  const total = GOAL_CENTER_FLOW.steps.length;
  const isFirst = GOAL_CENTER_FLOW.currentStep === 0;
  const isLast = GOAL_CENTER_FLOW.currentStep === total - 1;

  let html = `<div class="tr-page"><div class="gc-create-flow">
    <div class="gc-create-header">
      <button class="tr-back-btn" id="gcCreateBackBtn">← Back</button>
      <span class="tr-section-title">Create Goal</span>
    </div>
    <div class="gc-create-step-indicator">Step ${GOAL_CENTER_FLOW.currentStep + 1} of ${total}</div>
    <div class="gc-create-title">${step.title}</div>
    <div class="gc-create-desc">${step.desc}</div>
  `;

  html += renderCreateStepContent(step.id);
  html += `<div class="gc-step-footer">
    ${!isFirst ? `<button class="btn-secondary" id="gcPrevBtn">Back</button>` : ""}
    <button class="btn-primary" id="gcNextBtn" ${(step.id === "type" && !GOAL_CENTER_FLOW.data.goalType) || (step.id === "weight" && !GOAL_CENTER_FLOW.data.startWeight) ? "disabled" : ""}>${isLast ? "Create Goal" : "Next"}</button>
    <button class="btn-secondary" id="gcCancelBtn">Cancel</button>
  </div>`;

  html += `</div></div>`;
  container.innerHTML = html;
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);

  document.getElementById("gcCreateBackBtn")?.addEventListener("click", () => renderGoalCenter());
  document.getElementById("gcCancelBtn")?.addEventListener("click", () => renderGoalCenter());
  document.getElementById("gcPrevBtn")?.addEventListener("click", () => {
    GOAL_CENTER_FLOW.currentStep--;
    renderCreateGoalStep();
  });
  document.getElementById("gcNextBtn")?.addEventListener("click", () => {
    if (isLast) {
      GoalCenter.createProfile(GOAL_CENTER_FLOW.data);
      saveState();
      renderGoalCenter();
    } else {
      GOAL_CENTER_FLOW.currentStep++;
      renderCreateGoalStep();
    }
  });

  bindStepEvents(step.id);
}

function renderCreateStepContent(stepId) {
  let content = "";
  if (stepId === "type") {
    const types = [
      { id: "fat-loss", name: "Fat Loss", desc: "Lose body fat while preserving muscle" },
      { id: "muscle-gain", name: "Muscle Gain", desc: "Build lean muscle mass" },
      { id: "strength", name: "Strength", desc: "Get stronger on compound lifts" },
      { id: "general-fitness", name: "General Fitness", desc: "Overall health and fitness" },
      { id: "endurance", name: "Endurance", desc: "Improve cardiovascular stamina" }
    ];
    content = `<div class="gc-option-grid">`;
    content += types.map(t => `<button class="gc-option-btn${GOAL_CENTER_FLOW.data.goalType === t.id ? " is-selected" : ""}" data-gc-type="${t.id}"><span class="gc-option-name">${t.name}</span><span class="gc-option-desc">${t.desc}</span></button>`).join("");
    content += `</div>`;
  } else if (stepId === "weight") {
    content = `<div class="gc-number-input-wrap"><input type="number" class="gc-number-input" id="gcWeightInput" placeholder="e.g. 70" min="20" max="400" step="0.1" value="${GOAL_CENTER_FLOW.data.startWeight || ""}" autocomplete="off" /></div>`;
  } else if (stepId === "target") {
    const showTarget = GOAL_CENTER_FLOW.data.goalType === "fat-loss" || GOAL_CENTER_FLOW.data.goalType === "muscle-gain";
    content = `<div class="gc-number-input-wrap"><input type="number" class="gc-number-input" id="gcTargetInput" placeholder="${showTarget ? "e.g. 65" : "Optional"}" min="20" max="400" step="0.1" value="${GOAL_CENTER_FLOW.data.targetWeight || ""}" autocomplete="off" /></div>`;
  } else if (stepId === "date") {
    content = `<div class="gc-number-input-wrap"><input type="date" class="gc-date-input" id="gcDateInput" value="${GOAL_CENTER_FLOW.data.targetDate || ""}" /></div>`;
  } else if (stepId === "details") {
    content = `<div class="gc-section"><div class="gc-section-title">Training Days Per Week</div>
    <div class="gc-option-grid" id="gcDaysGrid">
      ${[2, 3, 4, 5, 6].map(d => `<button class="gc-option-btn${GOAL_CENTER_FLOW.data.trainingDays === d ? " is-selected" : ""}" data-gc-days="${d}"><span class="gc-option-name">${d}</span><span class="gc-option-desc">${d === 2 ? "Minimal" : d === 3 ? "Standard" : d === 4 ? "Frequent" : d === 5 ? "Dedicated" : "Intensive"} Days</span></button>`).join("")}
    </div></div>
    <div class="gc-section"><div class="gc-section-title">Experience Level</div>
    <div class="gc-option-grid gc-single-col" id="gcExpGrid">
      ${[{ id: "beginner", name: "Beginner", desc: "Less than 6 months of consistent training" }, { id: "intermediate", name: "Intermediate", desc: "6 months to 2 years of consistent training" }, { id: "advanced", name: "Advanced", desc: "2+ years of consistent training" }].map(e => `<button class="gc-option-btn full${GOAL_CENTER_FLOW.data.experienceLevel === e.id ? " is-selected" : ""}" data-gc-exp="${e.id}"><span><span class="gc-option-name" style="text-align:left">${e.name}</span><span class="gc-option-desc" style="text-align:left">${e.desc}</span></span></button>`).join("")}
    </div></div>
    <div class="gc-section"><div class="gc-section-title">Activity Level</div>
    <div class="gc-option-grid gc-single-col" id="gcActGrid">
      ${[{ id: "sedentary", name: "Sedentary", desc: "Desk job, little daily movement" }, { id: "light", name: "Lightly Active", desc: "Light movement throughout the day" }, { id: "moderate", name: "Moderately Active", desc: "Standing/walking job" }, { id: "active", name: "Active", desc: "Physically demanding job or lots of daily movement" }].map(a => `<button class="gc-option-btn full${GOAL_CENTER_FLOW.data.activityLevel === a.id ? " is-selected" : ""}" data-gc-act="${a.id}"><span><span class="gc-option-name" style="text-align:left">${a.name}</span><span class="gc-option-desc" style="text-align:left">${a.desc}</span></span></button>`).join("")}
    </div></div>`;
  }
  return content;
}

function bindStepEvents(stepId) {
  if (stepId === "type") {
    document.querySelectorAll("[data-gc-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-gc-type]").forEach(b => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        GOAL_CENTER_FLOW.data.goalType = btn.dataset.gcType;
        document.getElementById("gcNextBtn").disabled = false;
      });
    });
  } else if (stepId === "weight") {
    const input = document.getElementById("gcWeightInput");
    if (input) {
      input.addEventListener("input", () => {
        const val = parseFloat(input.value);
        GOAL_CENTER_FLOW.data.startWeight = val > 0 ? val : null;
        document.getElementById("gcNextBtn").disabled = !(val > 0);
      });
      setTimeout(() => input.focus(), 100);
    }
  } else if (stepId === "target") {
    const input = document.getElementById("gcTargetInput");
    if (input) {
      input.addEventListener("input", () => {
        const val = parseFloat(input.value);
        GOAL_CENTER_FLOW.data.targetWeight = val > 0 ? val : null;
        document.getElementById("gcNextBtn").disabled = false;
      });
    }
  } else if (stepId === "date") {
    const input = document.getElementById("gcDateInput");
    if (input) {
      input.addEventListener("input", () => {
        GOAL_CENTER_FLOW.data.targetDate = input.value || null;
        document.getElementById("gcNextBtn").disabled = false;
      });
    }
  } else if (stepId === "details") {
    document.querySelectorAll("[data-gc-days]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-gc-days]").forEach(b => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        GOAL_CENTER_FLOW.data.trainingDays = parseInt(btn.dataset.gcDays);
      });
    });
    document.querySelectorAll("[data-gc-exp]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-gc-exp]").forEach(b => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        GOAL_CENTER_FLOW.data.experienceLevel = btn.dataset.gcExp;
      });
    });
    document.querySelectorAll("[data-gc-act]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-gc-act]").forEach(b => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        GOAL_CENTER_FLOW.data.activityLevel = btn.dataset.gcAct;
      });
    });
  }
}

function openWeightLogger() {
  const plusBtn = document.getElementById("wlPlus");
  if (plusBtn) { plusBtn.click(); return; }
  const overlay = document.getElementById("weightLogSheet");
  if (overlay) overlay.classList.remove("is-hidden");
}

function openGoalCenter() {
  if (typeof currentTab !== "undefined" && currentTab !== "trainer") {
    activateTab("trainer");
  }
  renderGoalCenter();
}

function openWeightIntelligence() {
  showTrainerScreen("weight-intelligence");
}

function renderWeightTrendChart(wi) {
  const log = (state.weightLog || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (log.length < 2) return `<div class="wi-empty">Log your weight to see trends</div>`;

  const recent = log.slice(-14);
  const weights = recent.map(e => e.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;
  const w = 400;
  const h = 160;
  const pad = { top: 16, right: 16, bottom: 24, left: 36 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const xScale = (i) => pad.left + (i / (recent.length - 1)) * plotW;
  const yScale = (v) => pad.top + plotH - ((v - minW) / range) * plotH;

  let pathD = recent.map((e, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(e.weight).toFixed(1)}`).join(" ");
  let sevenDayPath = "";
  if (recent.length >= 7) {
    const last7 = recent.slice(-7);
    const avg = last7.reduce((s, e) => s + e.weight, 0) / last7.length;
    const x1 = xScale(recent.length - 7);
    const x2 = xScale(recent.length - 1);
    sevenDayPath = `M${x1.toFixed(1)},${yScale(avg).toFixed(1)} L${x2.toFixed(1)},${yScale(avg).toFixed(1)}`;
  }

  const dateLabels = recent.map((e, i) => {
    const d = new Date(e.date);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const x = xScale(i);
    const show = i === 0 || i === recent.length - 1 || i % 3 === 0;
    return show ? `<text x="${x.toFixed(1)}" y="${h - 4}" text-anchor="${i === 0 ? "start" : i === recent.length - 1 ? "end" : "middle"}" font-size="8" fill="var(--text-tertiary)">${label}</text>` : "";
  }).join("");

  let goalLine = "";
  const gcWeightData = GoalCenter.getGoalWeightData();
  if (gcWeightData && gcWeightData.targetWeight) {
    const y = yScale(gcWeightData.targetWeight);
    if (y >= pad.top && y <= pad.top + plotH) {
      goalLine = `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${pad.left + plotW}" y2="${y.toFixed(1)}" stroke="var(--orange)" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>`;
    }
  }

  return `<div class="wi-chart-wrap">
    <svg class="wi-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      ${goalLine}
      <path d="${sevenDayPath}" stroke="var(--blue)" stroke-width="2" stroke-dasharray="4,2" fill="none" opacity="0.7"/>
      <path d="${pathD}" stroke="var(--accent)" stroke-width="2" fill="none" stroke-linejoin="round"/>
      ${recent.map((e, i) => `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(e.weight).toFixed(1)}" r="2.5" fill="var(--accent)" opacity="0.8"/>`).join("")}
      ${dateLabels}
      <text x="4" y="${pad.top + 10}" font-size="7" fill="var(--text-tertiary)">${minW.toFixed(0)}</text>
      <text x="4" y="${pad.top + plotH}" font-size="7" fill="var(--text-tertiary)">${maxW.toFixed(0)}</text>
    </svg>
    <div class="wi-chart-legend">
      <span><span class="wi-chart-legend-line" style="background:var(--accent)"></span> Weight</span>
      ${sevenDayPath ? '<span><span class="wi-chart-legend-line" style="background:var(--blue)"></span> 7-Day Avg</span>' : ""}
      ${goalLine ? '<span><span class="wi-chart-legend-line" style="background:var(--orange)"></span> Goal</span>' : ""}
    </div>
  </div>`;
}

function renderWeightIntelligence() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const wi = GoalCenter.getWeightIntelligence();

  let html = `<div class="wi-page">
    <div class="wi-header">
      <h2>Weight Insights</h2>
      <button class="wi-back-btn" id="wiBackBtn">Back</button>
    </div>`;

  // Metrics row
  html += `<div class="wi-metrics">
    <div class="wi-metric-card">
      <div class="wi-metric-value">${wi.currentWeight !== null ? displayWeight(wi.currentWeight) : "—"}</div>
      <div class="wi-metric-label">Current</div>
    </div>
    <div class="wi-metric-card">
      <div class="wi-metric-value">${wi.sevenDayAvg !== null ? displayWeight(wi.sevenDayAvg) : "—"}</div>
      <div class="wi-metric-label">7-Day Avg</div>
    </div>
    <div class="wi-metric-card">
      <div class="wi-metric-value">${wi.thirtyDayAvg !== null ? displayWeight(wi.thirtyDayAvg) : "—"}</div>
      <div class="wi-metric-label">30-Day Avg</div>
    </div>
    <div class="wi-metric-card">
      <div class="wi-metric-value">${wi.weeklyChange !== null ? (wi.weeklyChange > 0 ? "+" : "") + displayWeight(Math.abs(wi.weeklyChange)) : "—"}</div>
      <div class="wi-metric-label">Weekly Change</div>
      <div class="wi-metric-change ${wi.weeklyChange !== null ? (wi.weeklyChange < -0.2 ? "positive" : wi.weeklyChange > 0.2 ? "negative" : "neutral") : ""}">${wi.weeklyChange !== null ? (wi.weeklyChange < -0.2 ? "↓" : wi.weeklyChange > 0.2 ? "↑" : "→") : ""}</div>
    </div>
    <div class="wi-metric-card">
      <div class="wi-metric-value">${wi.monthlyChange !== null ? (wi.monthlyChange > 0 ? "+" : "") + displayWeight(Math.abs(wi.monthlyChange)) : "—"}</div>
      <div class="wi-metric-label">Monthly Change</div>
      <div class="wi-metric-change ${wi.monthlyChange !== null ? (wi.monthlyChange < -0.5 ? "positive" : wi.monthlyChange > 0.5 ? "negative" : "neutral") : ""}">${wi.monthlyChange !== null ? (wi.monthlyChange < -0.5 ? "↓" : wi.monthlyChange > 0.5 ? "↑" : "→") : ""}</div>
    </div>
    <div class="wi-metric-card">
      <div class="wi-metric-value" style="text-transform:capitalize;font-size:0.85rem">${wi.trendDirection}</div>
      <div class="wi-metric-label">Trend</div>
    </div>
  </div>`;

  // Trend chart
  html += `<div class="wi-section">
    <div class="wi-section-title">Weight Trend</div>
    ${renderWeightTrendChart(wi)}
  </div>`;

  // Plateau alert
  if (wi.plateau && wi.plateau.isPlateau) {
    html += `<div class="wi-section">
      <div class="wi-alert-card">
        <div class="wi-alert-icon">📊</div>
        <div class="wi-alert-body">
          <h4>Possible Plateau Detected</h4>
          <p>Your weight has remained unchanged for ${wi.plateau.daysUnchanged} days. Consider reviewing your calorie intake, protein, and activity level.</p>
          <button class="wi-alert-cta" id="wiDiagnosePlateau">Diagnose Plateau</button>
        </div>
      </div>
    </div>`;
  }

  // Rate analysis
  if (wi.rateAnalysis) {
    const ra = wi.rateAnalysis;
    html += `<div class="wi-section">
      <div class="wi-section-title">Rate Analysis</div>
      <div class="wi-rate-card">
        <div class="wi-rate-status">
          <span class="wi-rate-dot ${ra.color}"></span>
          <span class="wi-rate-label">${ra.label}</span>
        </div>
        <span class="wi-rate-value">${ra.rate !== undefined ? (ra.rate > 0 ? "+" : "") + ra.rate.toFixed(2) + " kg/week" : ""}</span>
      </div>
    </div>`;
  }

  // Goal pace projection
  if (wi.goalPace && wi.goalPace.status !== "no-data" && wi.goalPace.status !== null) {
    html += `<div class="wi-section">
      <div class="wi-section-title">Goal Pace</div>
      <div class="wi-rate-card">
        <div class="wi-rate-status">
          <span class="wi-rate-dot ${wi.goalPace.status === "on-pace" ? "green" : wi.goalPace.status === "behind-pace" ? "orange" : "gray"}"></span>
          <span class="wi-rate-label">${wi.goalPace.label || wi.goalPace.status}</span>
        </div>
        <span class="wi-rate-value">${wi.goalPace.remaining ? displayWeight(wi.goalPace.remaining) + " remaining" : ""} ${wi.goalPace.projectedDateStr ? "· " + wi.goalPace.projectedDateStr : ""}</span>
      </div>
    </div>`;
  }

  // Streak + Score
  html += `<div class="wi-section">
    <div class="wi-section-title">Logging Consistency</div>
    <div class="wi-streak-row">
      <div class="wi-streak-card">
        <div class="wi-streak-value">${wi.streak.current}</div>
        <div class="wi-streak-label">Current Streak</div>
      </div>
      <div class="wi-streak-card">
        <div class="wi-streak-value">${wi.streak.longest}</div>
        <div class="wi-streak-label">Longest Streak</div>
      </div>
      <div class="wi-streak-card">
        <div class="wi-score-bar">
          <div class="wi-score-track">
            <div class="wi-score-fill ${wi.loggingScore >= 7 ? "full" : wi.loggingScore >= 4 ? "good" : wi.loggingScore >= 1 ? "low" : "empty"}" style="width:${wi.loggingScore * 10}%"></div>
          </div>
          <span class="wi-score-text">${wi.loggingScore}/10</span>
        </div>
        <div class="wi-streak-label" style="margin-top:4px">Logging Score</div>
      </div>
    </div>
  </div>`;

  // Education card
  html += `<div class="wi-section">
    <div class="wi-section-title">Why Daily Weigh-Ins Matter</div>
    <div class="wi-edu-card">
      <div class="wi-edu-title">Trends Beat Daily Readings</div>
      <div class="wi-edu-text">
        Daily weight fluctuates due to water, food, and hormones. A single measurement is unreliable.
      </div>
      <ul class="wi-edu-list">
        <li>Your 7-day average smooths out daily noise</li>
        <li>Weekly change is more meaningful than day-to-day</li>
        <li>Goal pace uses trends, not single weigh-ins</li>
        <li>Consistent logging gives the coach better data</li>
      </ul>
      <div class="wi-edu-text" style="margin-top:var(--space-xs)">
        <strong>Tip:</strong> Weigh at the same time each morning, before eating, for consistent data.
      </div>
    </div>
  </div>`;

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById("wiBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.getElementById("wiDiagnosePlateau")?.addEventListener("click", () => {
    const p = PROBLEM_DATABASE.find(pb => pb.id === "cant-lose-weight");
    if (p) renderProblemDetail("cant-lose-weight");
  });

  document.querySelector(".main-area")?.scrollTo(0,0);
  window.scrollTo(0,0);
}

// ===== REPORT PAGES =====
function renderWeeklyReportPage(weekKey) {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;

  let rpt;
  if (weekKey) {
    rpt = getWeeklyReport(weekKey);
  } else {
    const coach = CoachEngine.runAll();
    rpt = coach.reports.weekly.full || coach.reports.weekly;
    saveWeeklyReport(coach.reports.weekly);
  }
  if (!rpt) { container.innerHTML = `<div class="tr-page"><div class="wi-empty">No weekly report data available.</div></div>`; return; }

  const f = rpt.full || rpt;
  const wf = f.scoreBreakdown || {};
  const sb = f.summary || f;
  const ga = f.goalAnalysis || {};
  const tr = f.training || {};
  const na = f.nutritionAnalysis || {};
  const ra = f.recoveryAnalysis || {};
  const parent = rpt.full ? rpt : null;

  const cScore = f.coachScore;
  const grade = cScore >= 85 ? "A" : cScore >= 75 ? "B" : cScore >= 60 ? "C" : cScore >= 40 ? "D" : "F";
  const gradeColor = cScore >= 85 ? "var(--accent)" : cScore >= 60 ? "var(--orange)" : "var(--red)";

  let html = `<div class="wr-page"><div class="wr-back" id="wrBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>`;

  // HEADER
  html += `<div class="wr-header"><div class="wr-header-top">
    <div class="wr-header-left"><span class="wr-header-label">Weekly Report</span><span class="wr-header-week">${f.weekStr || "This Week"}</span></div>
    <div class="wr-grade" style="color:${gradeColor};border-color:${gradeColor}">${grade}</div>
  </div>
  <div class="wr-coach-score"><span class="wr-coach-score-val" style="color:${gradeColor}">${cScore}</span><span class="wr-coach-score-label">Coach Score</span></div>
  <div class="wr-coach-status ${f.status === "excellent" ? "wr-status-green" : f.status === "good" ? "wr-status-yellow" : f.status === "needs-work" ? "wr-status-orange" : "wr-status-red"}">${f.status === "excellent" ? "Excellent" : f.status === "good" ? "Good" : f.status === "needs-work" ? "Needs Work" : "Inactive"}</div>
  </div>`;

  // SUMMARY
  html += `<div class="wr-section"><div class="wr-section-title">Weekly Summary</div><div class="wr-summary-grid">
    <div class="wr-summary-item"><span class="wr-summary-val">${sb.weeksWorkouts ? sb.weeksWorkouts.completed + "/" + sb.weeksWorkouts.target : "—"}</span><span class="wr-summary-lbl">Workouts</span></div>
    <div class="wr-summary-item"><span class="wr-summary-val">${sb.weightChange !== null && sb.weightChange !== undefined ? (sb.weightChange > 0 ? "+" : "") + sb.weightChange.toFixed(1) + "kg" : "—"}</span><span class="wr-summary-lbl">Weight Change</span></div>
    <div class="wr-summary-item"><span class="wr-summary-val">${sb.protein ? sb.protein.daysMet + "/" + sb.protein.total : "—"}</span><span class="wr-summary-lbl">Protein Days</span></div>
    <div class="wr-summary-item"><span class="wr-summary-val">${sb.recoveryScore !== null && sb.recoveryScore !== undefined ? sb.recoveryScore + "%" : "—"}</span><span class="wr-summary-lbl">Recovery</span></div>
    <div class="wr-summary-item"><span class="wr-summary-val">${sb.steps ? sb.steps.daysMet + "/" + sb.steps.total : "—"}</span><span class="wr-summary-lbl">Active Days</span></div>
    <div class="wr-summary-item"><span class="wr-summary-val">${sb.consistencyPct !== undefined ? sb.consistencyPct + "%" : "—"}</span><span class="wr-summary-lbl">Consistency</span></div>
  </div></div>`;

  // COACH SCORE BREAKDOWN
  html += `<div class="wr-section"><div class="wr-section-title">Coach Score Breakdown</div><div class="wr-breakdown">
    ${[ 
      { key: "workout", label: "Workouts", max: 30, icon: "🏋️" },
      { key: "protein", label: "Protein", max: 20, icon: "🥩" },
      { key: "recovery", label: "Recovery", max: 15, icon: "😴" },
      { key: "activity", label: "Activity", max: 15, icon: "🚶" },
      { key: "tracking", label: "Tracking", max: 10, icon: "📊" },
      { key: "consistency", label: "Consistency", max: 10, icon: "🔥" },
    ].map(item => {
      const data = wf[item.key] || { score: 0, max: item.max, pct: 0 };
      const barColor = data.pct >= 80 ? "var(--accent)" : data.pct >= 50 ? "var(--orange)" : "var(--red)";
      return `<div class="wr-breakdown-row"><div class="wr-breakdown-left"><span class="wr-breakdown-icon">${item.icon}</span><span class="wr-breakdown-name">${item.label}</span></div><div class="wr-breakdown-right"><div class="wr-breakdown-bar"><div class="wr-breakdown-fill" style="width:${data.pct}%;background:${barColor}"></div></div><span class="wr-breakdown-score">${data.score}/${item.max}</span></div></div>`;
    }).join("")}
  </div></div>`;

  // GOAL ANALYSIS
  html += `<div class="wr-section"><div class="wr-section-title">Goal Analysis</div><div class="wr-card">
    <div class="wr-goal-row"><span class="wr-goal-label">Goal</span><span class="wr-goal-val">${ga.goalLabel || ga.goal || "—"}</span></div>
    <div class="wr-goal-row"><span class="wr-goal-label">Current Weight</span><span class="wr-goal-val">${ga.currentWeight ? displayWeight(ga.currentWeight) : "—"}</span></div>
    <div class="wr-goal-row"><span class="wr-goal-label">Weekly Change</span><span class="wr-goal-val ${ga.weeklyChange !== null && ga.weeklyChange !== undefined ? (ga.weeklyChange < 0 ? "wr-val-green" : "wr-val-red") : ""}">${ga.weeklyChange !== null && ga.weeklyChange !== undefined ? (ga.weeklyChange > 0 ? "+" : "") + ga.weeklyChange.toFixed(1) + "kg" : "—"}</span></div>
    <div class="wr-goal-row"><span class="wr-goal-label">Pace</span><span class="wr-goal-val">${ga.paceStatus || "—"}</span></div>
    ${ga.projectedDate ? `<div class="wr-goal-row"><span class="wr-goal-label">Projected</span><span class="wr-goal-val wr-val-accent">${ga.projectedDate}</span></div>` : ""}
    ${ga.rateAnalysis && ga.rateAnalysis.label ? `<div class="wr-goal-row"><span class="wr-goal-label">Rate</span><span class="wr-goal-val"><span class="wr-rate-dot ${ga.rateAnalysis.color}"></span> ${ga.rateAnalysis.label}</span></div>` : ""}
  </div></div>`;

  // TRAINING ANALYSIS
  html += `<div class="wr-section"><div class="wr-section-title">Training Analysis</div><div class="wr-card">
    <div class="wr-goal-row"><span class="wr-goal-label">Workouts</span><span class="wr-goal-val">${tr.frequency ? tr.frequency.current + " this week" : "—"}</span></div>
    ${tr.frequency && tr.frequency.previous !== undefined ? `<div class="wr-goal-row"><span class="wr-goal-label">vs Last Week</span><span class="wr-goal-val ${tr.frequency.change > 0 ? "wr-val-green" : tr.frequency.change < 0 ? "wr-val-red" : ""}">${tr.frequency.change > 0 ? "+" : ""}${tr.frequency.change}</span></div>` : ""}
    ${tr.volume ? `<div class="wr-goal-row"><span class="wr-goal-label">Total Volume</span><span class="wr-goal-val">${tr.volume >= 1000 ? (tr.volume / 1000).toFixed(1) + "k" : tr.volume} kg</span></div>` : ""}
    ${tr.prs ? `<div class="wr-goal-row"><span class="wr-goal-label">PRs</span><span class="wr-goal-val wr-val-accent">${tr.prs}</span></div>` : ""}
    ${tr.missedWorkouts > 0 ? `<div class="wr-goal-row"><span class="wr-goal-label">Missed</span><span class="wr-goal-val wr-val-red">${tr.missedWorkouts} workouts</span></div>` : ""}
  </div></div>`;

  // NUTRITION ANALYSIS
  html += `<div class="wr-section"><div class="wr-section-title">Nutrition Analysis</div><div class="wr-card">
    <div class="wr-goal-row"><span class="wr-goal-label">Protein</span><span class="wr-goal-val">${na.protein ? na.protein.daysMet + "/" + na.protein.total + " days" : "—"}</span></div>
    ${na.protein && na.protein.target ? `<div class="wr-goal-row"><span class="wr-goal-label">Target</span><span class="wr-goal-val">${na.protein.target}g/day</span></div>` : ""}
    <div class="wr-goal-row"><span class="wr-goal-label">Steps</span><span class="wr-goal-val">${na.steps ? na.steps.daysMet + "/" + na.steps.total + " days" : "—"}</span></div>
    ${na.steps && na.steps.target ? `<div class="wr-goal-row"><span class="wr-goal-label">Target</span><span class="wr-goal-val">${na.steps.target.toLocaleString()}/day</span></div>` : ""}
  </div></div>`;

  // RECOVERY ANALYSIS
  html += `<div class="wr-section"><div class="wr-section-title">Recovery Analysis</div><div class="wr-card">
    <div class="wr-goal-row"><span class="wr-goal-label">Recovery Score</span><span class="wr-goal-val ${(ra.score || 0) >= 70 ? "wr-val-green" : (ra.score || 0) >= 40 ? "wr-val-orange" : "wr-val-red"}">${ra.score !== null && ra.score !== undefined ? ra.score : "—"}/100</span></div>
    <div class="wr-goal-row"><span class="wr-goal-label">Status</span><span class="wr-goal-val">${ra.label || ra.status || "—"}</span></div>
    ${ra.consecutiveDays !== undefined ? `<div class="wr-goal-row"><span class="wr-goal-label">Cons Days</span><span class="wr-goal-val">${ra.consecutiveDays}</span></div>` : ""}
    ${ra.weeklyAvg !== null && ra.weeklyAvg !== undefined ? `<div class="wr-goal-row"><span class="wr-goal-label">Weekly Avg</span><span class="wr-goal-val">${ra.weeklyAvg}</span></div>` : ""}
    ${ra.sleepAvg !== null && ra.sleepAvg !== undefined ? `<div class="wr-goal-row"><span class="wr-goal-label">Avg Sleep</span><span class="wr-goal-val">${ra.sleepAvg.toFixed(1)}h</span></div>` : ""}
    ${ra.recommendations && ra.recommendations.length ? `<div class="wr-recs">${ra.recommendations.slice(0, 2).map(r => `<div class="wr-rec">• ${r}</div>`).join("")}</div>` : ""}
  </div></div>`;

  // BIGGEST WIN
  html += `<div class="wr-section"><div class="wr-section-title">Biggest Win</div><div class="wr-card wr-card-highlight">${f.biggestWin || "—"}</div></div>`;

  // BIGGEST LIMITER
  html += `<div class="wr-section"><div class="wr-section-title">Biggest Limiter</div><div class="wr-card wr-card-warning">${f.biggestLimiter || "—"}</div></div>`;

  // NEXT WEEK FOCUS
  if (f.nextWeekFocus && f.nextWeekFocus.length) {
    html += `<div class="wr-section"><div class="wr-section-title">Next Week Focus</div><div class="wr-card">${f.nextWeekFocus.map((item, i) => `<div class="wr-focus-item"><span class="wr-focus-num">${i + 1}</span><span class="wr-focus-text">${item}</span></div>`).join("")}</div></div>`;
  }

  // COACH MESSAGE
  html += `<div class="wr-section"><div class="wr-section-title">Coach Message</div><div class="wr-card wr-card-message">${f.coachMessage || "—"}</div></div>`;

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById("wrBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

function renderMonthlyReportPage(monthKey) {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;

  let rpt;
  if (monthKey) {
    rpt = getMonthlyReport(monthKey);
  } else {
    const coach = CoachEngine.runAll();
    rpt = coach.reports.monthly.full || coach.reports.monthly;
    saveMonthlyReport(coach.reports.monthly);
  }
  if (!rpt) { container.innerHTML = `<div class="tr-page"><div class="wi-empty">No monthly report data available.</div></div>`; return; }

  const f = rpt.full || rpt;
  const parent = rpt.full ? rpt : null;

  let html = `<div class="wr-page"><div class="wr-back" id="mrBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>`;

  // HEADER
  html += `<div class="wr-header"><div class="wr-header-top">
    <div class="wr-header-left"><span class="wr-header-label">Monthly Analysis</span><span class="wr-header-week">${f.month || "This Month"}</span></div>
  </div>
  <div class="wr-coach-score"><span class="wr-coach-score-val">${f.coachScore || "—"}</span><span class="wr-coach-score-label">Coach Score</span></div>
  <div class="wr-coach-verdict">${f.coachVerdict || "—"}</div>
  </div>`;

  // SUMMARY
  html += `<div class="wr-section"><div class="wr-section-title">Monthly Summary</div><div class="wr-summary-grid">
    <div class="wr-summary-item"><span class="wr-summary-val">${f.goalProgress !== null && f.goalProgress !== undefined ? f.goalProgress + "%" : "—"}</span><span class="wr-summary-lbl">Goal Progress</span></div>
    <div class="wr-summary-item"><span class="wr-summary-val">${f.weightChange !== null && f.weightChange !== undefined ? (f.weightChange > 0 ? "+" : "") + f.weightChange.toFixed(1) + "kg" : "—"}</span><span class="wr-summary-lbl">Weight Change</span></div>
    <div class="wr-summary-item"><span class="wr-summary-val">${f.strengthChange || "—"}</span><span class="wr-summary-lbl">Strength</span></div>
    <div class="wr-summary-item"><span class="wr-summary-val">${f.coachScoreChange !== null ? (f.coachScoreChange > 0 ? "+" : "") + f.coachScoreChange : "—"}</span><span class="wr-summary-lbl">Score Change</span></div>
  </div></div>`;

  // TRENDS
  if (f.trend) {
    html += `<div class="wr-section"><div class="wr-section-title">Trends</div><div class="wr-card">${Object.entries(f.trend).filter(([, v]) => v).map(([k, v]) => {
      const upOrDown = v === "up" ? "↑" : v === "down" ? "↓" : "→";
      const trendColor = v === "up" ? "var(--accent)" : v === "down" ? "var(--red)" : "var(--text-secondary)";
      return `<div class="wr-goal-row"><span class="wr-goal-label">${k.charAt(0).toUpperCase() + k.slice(1)}</span><span class="wr-goal-val" style="color:${trendColor}">${upOrDown}</span></div>`;
    }).join("")}</div></div>`;
  }

  // PLATEAU ALERTS
  if (f.plateauAlerts && f.plateauAlerts.length) {
    html += `<div class="wr-section"><div class="wr-section-title">Alerts</div><div class="wr-card wr-card-warning">${f.plateauAlerts.map(a => `<div class="wr-rec">🔴 ${a}</div>`).join("")}</div></div>`;
  }

  // RECOMMENDATIONS
  if (f.recommendations && f.recommendations.length) {
    html += `<div class="wr-section"><div class="wr-section-title">Recommendations</div><div class="wr-card">${f.recommendations.map((r, i) => `<div class="wr-focus-item"><span class="wr-focus-num">${i + 1}</span><span class="wr-focus-text">${r}</span></div>`).join("")}</div></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById("mrBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

function renderReportHistory() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;

  const keys = getAllReportKeys();
  let html = `<div class="wr-page"><div class="wr-back" id="rhBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>
  <div class="wr-header"><div class="wr-header-top">
    <div class="wr-header-left"><span class="wr-header-label">Report History</span></div>
  </div></div>`;

  html += `<div class="wr-section"><div class="wr-section-title">Weekly Reports</div>`;
  if (keys.weekly.length === 0) {
    html += `<div class="wr-card" style="color:var(--text-secondary);text-align:center">No weekly reports saved yet. Reports are auto-saved when viewed.</div>`;
  } else {
    html += `<div class="wr-history-list">${keys.weekly.slice(0, 12).map(k => {
      const r = getWeeklyReport(k);
      const f = r && r.full;
      return `<button class="wr-history-item" data-week-key="${k}"><span class="wr-history-left"><span class="wr-history-title">Week ${k}</span>${f && f.coachScore ? `<span class="wr-history-score">Score: ${f.coachScore}</span>` : ""}</span><span class="wr-history-arrow">→</span></button>`;
    }).join("")}</div>`;
  }
  html += `</div>`;

  html += `<div class="wr-section"><div class="wr-section-title">Monthly Reports</div>`;
  if (keys.monthly.length === 0) {
    html += `<div class="wr-card" style="color:var(--text-secondary);text-align:center">No monthly reports saved yet.</div>`;
  } else {
    html += `<div class="wr-history-list">${keys.monthly.slice(0, 12).map(k => {
      const r = getMonthlyReport(k);
      const f = r && r.full;
      const label = k.split("-");
      const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const monthName = monthNames[parseInt(label[1]) - 1] || k;
      return `<button class="wr-history-item" data-month-key="${k}"><span class="wr-history-left"><span class="wr-history-title">${monthName} ${label[0]}</span>${f && f.coachScore ? `<span class="wr-history-score">Score: ${f.coachScore}</span>` : ""}</span><span class="wr-history-arrow">→</span></button>`;
    }).join("")}</div>`;
  }
  html += `</div>`;

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById("rhBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  container.querySelectorAll("[data-week-key]").forEach(btn => {
    btn.addEventListener("click", () => renderWeeklyReportPage(btn.dataset.weekKey));
  });
  container.querySelectorAll("[data-month-key]").forEach(btn => {
    btn.addEventListener("click", () => renderMonthlyReportPage(btn.dataset.monthKey));
  });
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

// ===== RECOVERY & READINESS PAGE =====
function renderReadinessPage() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const coach = CoachEngine.runAll();
  const rec = coach.recovery;
  const rd = coach.readiness();
  const rdComp = rec.components || {};
  const rdDet = rec.details || {};

  const score = rec.score;
  const color = score >= 75 ? "var(--accent)" : score >= 60 ? "var(--orange)" : "var(--red)";
  const ringCirc = 2 * Math.PI * 40;
  const ringOff = ringCirc - (score / 100) * ringCirc;

  const barColor = (pct) => pct >= 80 ? "var(--accent)" : pct >= 50 ? "var(--orange)" : "var(--red)";
  const pctOfMax = (comp) => comp && comp.max > 0 ? Math.round((comp.score / comp.max) * 100) : 0;

  let html = `<div class="rr-page"><div class="wr-back" id="rrBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>`;

  // Readiness Ring
  html += `<div class="rr-hero-full">
    <div class="rr-hero-full-ring">
      <svg viewBox="0 0 96 96">
        <circle class="rr-ring-bg" cx="48" cy="48" r="40"/>
        <circle class="rr-ring-fill" cx="48" cy="48" r="40" stroke-dasharray="${ringCirc}" stroke-dashoffset="${ringOff}" style="stroke:${color}"/>
      </svg>
      <div class="rr-hero-full-text"><span class="rr-hero-full-score" style="color:${color}">${score}</span><span class="rr-hero-full-label">${rec.label}</span></div>
    </div>
    <div class="rr-hero-full-message">${rec.coachMessage}</div>
    ${rd.weekAvg !== null ? `<div class="rr-hero-full-avg">7-Day Avg: <strong>${rd.weekAvg}</strong></div>` : ""}
  </div>`;

  // Score Breakdown
  const components = [
    { key: "sleep", label: "Sleep", icon: "🌙", comp: rdComp.sleep },
    { key: "trainingLoad", label: "Training Load", icon: "🏋️", comp: rdComp.trainingLoad },
    { key: "recoveryDays", label: "Recovery Days", icon: "🔄", comp: rdComp.recoveryDays },
    { key: "protein", label: "Protein", icon: "🥩", comp: rdComp.protein },
    { key: "consistency", label: "Consistency", icon: "🔥", comp: rdComp.consistency },
    { key: "goalStress", label: "Goal Stress", icon: "🎯", comp: rdComp.goalStress },
  ];
  html += `<div class="rr-section"><div class="rr-section-title">Recovery Score Breakdown</div><div class="rr-breakdown">`;
  components.forEach((c) => {
    const pct = pctOfMax(c.comp);
    html += `<div class="rr-breakdown-row">
      <div class="rr-breakdown-left"><span class="rr-breakdown-icon">${c.icon}</span><span class="rr-breakdown-name">${c.label}</span></div>
      <div class="rr-breakdown-right"><div class="rr-breakdown-bar"><div class="rr-breakdown-fill" style="width:${pct}%;background:${barColor(pct)}"></div></div><span class="rr-breakdown-score">${c.comp ? c.comp.score + "/" + c.comp.max : "—"}</span></div>
    </div>`;
  });
  html += `</div></div>`;

  // Fatigue Flags
  if (rdDet.fatigueFlags && rdDet.fatigueFlags.length > 0) {
    html += `<div class="rr-section"><div class="rr-section-title">Fatigue Detection</div><div class="rr-card">`;
    rdDet.fatigueFlags.forEach((f) => {
      const fColor = f.severity === "high" ? "var(--red)" : f.severity === "moderate" ? "var(--orange)" : "var(--text-secondary)";
      html += `<div class="rr-fatigue-item"><span class="rr-fatigue-dot" style="background:${fColor}"></span><span class="rr-fatigue-text">${f.text}</span></div>`;
    });
    html += `</div></div>`;
  }

  // Details
  html += `<div class="rr-section"><div class="rr-section-title">Details</div><div class="rr-card rr-card-grid">
    <div class="rr-detail-item"><span class="rr-detail-label">Sleep</span><span class="rr-detail-val">${rdDet.avgSleep ? rdDet.avgSleep.toFixed(1) + "h" : "—"}</span></div>
    <div class="rr-detail-item"><span class="rr-detail-label">Weekly Sets</span><span class="rr-detail-val">${rdDet.weeklySets || 0}</span></div>
    <div class="rr-detail-item"><span class="rr-detail-label">Consecutive Days</span><span class="rr-detail-val">${rdDet.consecutiveTrainingDays || 0}d</span></div>
    <div class="rr-detail-item"><span class="rr-detail-label">Recovery Days</span><span class="rr-detail-val">${rdDet.recoveryDays || 0}/7</span></div>
    <div class="rr-detail-item"><span class="rr-detail-label">Protein Adherence</span><span class="rr-detail-val">${rdDet.proteinDays || 0}/7</span></div>
    <div class="rr-detail-item"><span class="rr-detail-label">Volume Ratio</span><span class="rr-detail-val">${rdDet.volumeRatio ? rdDet.volumeRatio.toFixed(1) + "x" : "—"}</span></div>
  </div></div>`;

  // 7-Day Trend
  if (rd.history && rd.history.length >= 2) {
    const recent7 = rd.history.slice(-7);
    const scores7 = recent7.map((h) => h.score);
    const minS = Math.min(...scores7) - 5;
    const maxS = Math.max(...scores7) + 5;
    const rangeS = maxS - minS || 10;
    const chartW = 320;
    const chartH = 80;
    const pad = { top: 8, right: 8, bottom: 16, left: 28 };
    const plotW = chartW - pad.left - pad.right;
    const plotH = chartH - pad.top - pad.bottom;
    const xScale = (i) => pad.left + (i / (recent7.length - 1)) * plotW;
    const yScale = (v) => pad.top + plotH - ((v - minS) / rangeS) * plotH;
    const pathD = recent7.map((h, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(h.score).toFixed(1)}`).join(" ");
    const dateLabels = recent7.map((h, i) => {
      const d = new Date(h.date);
      const show = i === 0 || i === recent7.length - 1 || i % 2 === 0;
      return show ? `<text x="${xScale(i).toFixed(1)}" y="${chartH - 4}" text-anchor="${i === 0 ? "start" : "end"}" font-size="7" fill="var(--text-tertiary)">${d.getMonth()+1}/${d.getDate()}</text>` : "";
    }).join("");
    html += `<div class="rr-section"><div class="rr-section-title">7-Day Recovery Trend</div><div class="rr-chart-wrap">
      <svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:auto">
        <path d="${pathD}" stroke="${color}" stroke-width="2" fill="none" stroke-linejoin="round"/>
        ${recent7.map((h, i) => `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(h.score).toFixed(1)}" r="2.5" fill="${color}" opacity="0.8"/>`).join("")}
        ${dateLabels}
        <text x="2" y="${pad.top + 10}" font-size="6" fill="var(--text-tertiary)">${maxS.toFixed(0)}</text>
        <text x="2" y="${pad.top + plotH}" font-size="6" fill="var(--text-tertiary)">${minS.toFixed(0)}</text>
      </svg>
    </div></div>`;
  }

  // Recommendations
  if (rec.recommendations && rec.recommendations.length > 0) {
    html += `<div class="rr-section"><div class="rr-section-title">Recommendations</div><div class="rr-card">`;
    rec.recommendations.forEach((r) => {
      const actionIcon = r.action === "push" ? "🔥" : r.action === "rest" ? "😴" : r.action === "reduce" ? "⚡" : r.action === "sleep" ? "🌙" : r.action === "nutrition" ? "🥩" : "💧";
      html += `<div class="rr-rec-item"><span class="rr-rec-icon">${actionIcon}</span><span class="rr-rec-text">${r.text}</span></div>`;
    });
    html += `</div></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById("rrBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

// ============================================================
// CHALLENGES, ACHIEVEMENTS & STREAKS PAGES
// ============================================================

function renderChallengesPage() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const coach = CoachEngine.runAll();
  const cas = coach.cas;
  if (!cas) { container.innerHTML = "<div class='tr-page'><div class='tr-section'>CAS data unavailable.</div></div>"; return; }

  const ch = cas.challenges;
  const todayKey = getDateKey(new Date());

  let html = `<div class="rr-page"><div class="wr-back" id="casBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>`;

  // XP/Level header
  html += `<div class="cas-header"><div class="cas-level-badge"><span class="cas-level-num">${cas.level}</span><span class="cas-level-label">${cas.levelTitle}</span></div><div class="cas-xp-info"><div class="cas-xp-total">${cas.totalXP} XP</div><div class="cas-xp-bar"><div class="cas-xp-fill" style="width:${cas.xp.xpNeeded > 0 ? (cas.xp.xp / cas.xp.xpNeeded) * 100 : 0}%"></div></div><div class="cas-xp-progress">${cas.xp.xp} / ${cas.xp.xpNeeded} XP to Level ${cas.level + 1}</div></div></div>`;

  // Empty state for new users
  const hasAnyChallenge = ch.daily || (ch.weekly || []).length > 0 || (ch.monthly || []).length > 0;
  if (!hasAnyChallenge) {
    html += `<div class="cas-section"><div class="tr-empty-state" style="padding:1.5rem 0">
      <div class="tr-empty-icon">🏆</div>
      <div class="tr-empty-title">No Active Challenges</div>
      <div class="tr-empty-desc">Create a goal to receive personalized challenges.</div>
    </div></div>`;
    html += `</div>`;
    container.innerHTML = html;
    document.getElementById("casBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
    document.querySelector(".main-area")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
    return;
  }

  // Daily Challenge
  if (ch.daily) {
    const d = ch.daily;
    const dpct = d.target > 0 ? Math.min(100, Math.round((d.progress / d.target) * 100)) : 0;
    const ringCirc = 2 * Math.PI * 30;
    const ringOff = d.completed ? 0 : ringCirc - (dpct / 100) * ringCirc;
    html += `<div class="cas-section"><div class="cas-section-label">Today's Challenge</div>
      <div class="cas-challenge-card ${d.completed ? "cas-completed" : ""}">
        <div class="cas-challenge-ring">
          <svg viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" stroke-width="4" opacity="0.3"/>
            <circle cx="36" cy="36" r="30" fill="none" stroke="${d.completed ? "var(--accent)" : "var(--blue)"}" stroke-width="4" stroke-linecap="round"
              stroke-dasharray="${ringCirc}" stroke-dashoffset="${ringOff}" transform="rotate(-90 36 36)"/>
          </svg>
          <span class="cas-challenge-ring-text">${d.completed ? "✓" : dpct + "%"}</span>
        </div>
        <div class="cas-challenge-body">
          <div class="cas-challenge-icon">${d.icon}</div>
          <div class="cas-challenge-name">${d.label}</div>
          <div class="cas-challenge-desc">${d.desc}</div>
          <div class="cas-challenge-progress-text">${d.target > 0 ? Math.min(d.progress || 0, d.target) : 0} / ${d.target > 0 ? d.target : "—"} ${d.unit || ""}</div>
          <div class="cas-challenge-reward">${d.reward ? "Reward: " + (d.reward.xp || 0) + " XP" + (d.reward.coachScore > 0 ? " · +" + d.reward.coachScore + " Coach" : "") : ""}</div>
        </div>
      </div></div>`;
  }

  // Weekly Challenges
  const weeklies = ch.weekly || [];
  if (weeklies.length > 0) {
    html += `<div class="cas-section"><div class="cas-section-label">Weekly Challenges</div><div class="cas-challenge-list">`;
    weeklies.forEach((w) => {
      const wpct = w.target > 0 ? Math.min(100, Math.round((w.progress / w.target) * 100)) : 0;
      html += `<div class="cas-challenge-card ${w.completed ? "cas-completed" : ""}">
        <div class="cas-challenge-icon-lg">${w.icon}</div>
        <div class="cas-challenge-body">
          <div class="cas-challenge-name">${w.label}</div>
          <div class="cas-challenge-progress-wrap">
            <div class="cas-challenge-bar"><div class="cas-challenge-fill" style="width:${wpct}%;background:${w.completed ? "var(--accent)" : "var(--blue)"}"></div></div>
            <span class="cas-challenge-pct">${wpct}%</span>
          </div>
          <div class="cas-challenge-meta">
            <span>${w.target > 0 ? Math.min(w.progress || 0, w.target) : 0} / ${w.target > 0 ? w.target : "—"} ${w.unit || ""}</span>
            <span>${w.reward ? w.reward.xp + " XP" : ""}</span>
          </div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // Monthly Challenges
  const monthlies = ch.monthly || [];
  if (monthlies.length > 0) {
    html += `<div class="cas-section"><div class="cas-section-label">Monthly Challenges</div><div class="cas-challenge-list">`;
    monthlies.forEach((m) => {
      const mpct = m.target > 0 ? Math.min(100, Math.round((m.progress / m.target) * 100)) : 0;
      html += `<div class="cas-challenge-card ${m.completed ? "cas-completed" : ""}">
        <div class="cas-challenge-icon-lg">${m.icon}</div>
        <div class="cas-challenge-body">
          <div class="cas-challenge-name">${m.label}</div>
          <div class="cas-challenge-progress-wrap">
            <div class="cas-challenge-bar"><div class="cas-challenge-fill" style="width:${mpct}%;background:${m.completed ? "var(--accent)" : "var(--orange)"}"></div></div>
            <span class="cas-challenge-pct">${mpct}%</span>
          </div>
          <div class="cas-challenge-meta">
            <span>${m.target > 0 ? Math.min(m.progress || 0, m.target) : 0} / ${m.target > 0 ? m.target : "—"} ${m.unit || ""}</span>
            <span>${m.reward ? m.reward.xp + " XP" : ""}</span>
          </div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // Completed challenges
  if (ch.completed > 0) {
    html += `<div class="cas-section"><div class="cas-section-label">Completed (${ch.completed})</div></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
  document.getElementById("casBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

function renderMilestonesPage() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const coach = CoachEngine.runAll();
  const cas = coach.cas;
  if (!cas) { container.innerHTML = "<div class='tr-page'><div class='tr-section'>CAS data unavailable.</div></div>"; return; }

  const unlocked = new Set(cas.achievements.unlocked.map((a) => a.id));
  const allAch = ACHIEVEMENT_DB || cas.achievements.all || [];
  const categories = ["consistency", "nutrition", "tracking", "goals", "strength", "learning"];
  const catLabels = { consistency: "Consistency", nutrition: "Nutrition", tracking: "Weight Tracking", goals: "Goals", strength: "Strength", learning: "Learning" };
  const catIcons = { consistency: "🔥", nutrition: "🥩", tracking: "⚖️", goals: "🎯", strength: "🏆", learning: "📖" };

  let html = `<div class="rr-page"><div class="wr-back" id="casBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>`;

  html += `<div class="cas-header"><div class="cas-ach-summary"><span class="cas-ach-count">${cas.achievements.count}</span><span class="cas-ach-total">/${cas.achievements.total}</span><span class="cas-ach-label">Milestones Unlocked</span></div></div>`;

  categories.forEach((cat) => {
    const catAchs = allAch.filter((a) => a.category === cat);
    const catUnlocked = catAchs.filter((a) => unlocked.has(a.id)).length;
    html += `<div class="cas-section"><div class="cas-section-label">${catIcons[cat] || "•"} ${catLabels[cat] || cat} <span class="cas-section-count">${catUnlocked}/${catAchs.length}</span></div>
      <div class="cas-ach-grid">`;
    catAchs.forEach((a) => {
      const isUnlocked = unlocked.has(a.id);
      html += `<div class="cas-ach-card ${isUnlocked ? "cas-ach-unlocked" : "cas-ach-locked"}">
        <div class="cas-ach-icon">${isUnlocked ? a.icon : "🔒"}</div>
        <div class="cas-ach-info">
          <div class="cas-ach-name">${a.label}</div>
          <div class="cas-ach-desc">${a.desc}</div>
        </div>
        ${isUnlocked ? '<span class="cas-ach-check">✓</span>' : ""}
      </div>`;
    });
    html += `</div></div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
  document.getElementById("casBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

function renderStreaksPage() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const coach = CoachEngine.runAll();
  const cas = coach.cas;
  if (!cas) { container.innerHTML = "<div class='tr-page'><div class='tr-section'>CAS data unavailable.</div></div>"; return; }

  const streakKeys = [
    { key: "workout", label: "Workout Streak", icon: "🏋️", color: "var(--accent)" },
    { key: "protein", label: "Protein Streak", icon: "🥩", color: "var(--blue)" },
    { key: "weightLogging", label: "Weight Log Streak", icon: "⚖️", color: "var(--orange)" },
    { key: "learning", label: "Learning Streak", icon: "📖", color: "var(--yellow)" },
  ];

  let html = `<div class="rr-page"><div class="wr-back" id="casBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>`;

  html += `<div class="cas-header"><div class="cas-streak-header"><span class="cas-streak-title">Streaks</span><span class="cas-streak-sub">Your consistency across all areas</span></div></div>`;

  streakKeys.forEach((sk) => {
    const s = cas.streak[sk.key];
    if (!s) return;
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    const nextMilestone = milestones.find((m) => m > s.current) || "max";
    const nextLabel = nextMilestone === "max" ? "Maxed out!" : nextMilestone + " days";
    const ringCirc = 2 * Math.PI * 16;
    const pct = nextMilestone !== "max" && nextMilestone !== "max" ? (s.current / nextMilestone) * 100 : 100;
    const ringOff = ringCirc - (Math.min(100, pct) / 100) * ringCirc;

    html += `<div class="cas-streak-card">
      <div class="cas-streak-ring-wrap">
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="16" fill="none" stroke="var(--border)" stroke-width="3" opacity="0.3"/>
          <circle cx="22" cy="22" r="16" fill="none" stroke="${sk.color}" stroke-width="3" stroke-linecap="round"
            stroke-dasharray="${ringCirc}" stroke-dashoffset="${ringOff}" transform="rotate(-90 22 22)"/>
        </svg>
        <span class="cas-streak-ring-icon">${sk.icon}</span>
      </div>
      <div class="cas-streak-body">
        <div class="cas-streak-name">${sk.label}</div>
        <div class="cas-streak-current">${s.current} days</div>
        <div class="cas-streak-meta">Longest: ${s.longest} days · Next: ${nextLabel}</div>
      </div>
    </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
  document.getElementById("casBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

// ============================================================
// COACH COMMAND CENTER — unified fitness dashboard
// ============================================================
function renderCoachCommandCenter() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;
  const coach = CoachEngine.runAll();
  const ad = coach.adaptive;
  if (state.onboardingComplete) {
    state.first7Days["day6CoachScore"] = true; saveState();
  }
  const dc = coach.daily;
  const gs = coach.goalStrategy;
  const prog = coach.progress;
  const rep = coach.reports;
  const rec = coach.recovery;
  const cas = coach.cas;
  const nut = coach.nutrition;

  const profile = ad && ad.profile;
  const wrFull = rep.weekly && rep.weekly.full;

  let html = `<div class="rr-page"><div class="wr-back" id="ccBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>`;
  html += `<div class="cc-header"><div class="cc-title">Coach Command Center</div><div class="cc-sub">Your entire fitness journey in one place</div></div>`;

  // Goal Status + Coach Score row
  const gsColor = prog.gcHealthLevel === "good" ? "var(--accent)" : prog.gcHealthLevel === "warning" ? "var(--orange)" : "var(--red)";
  const csScore = wrFull ? wrFull.coachScore : 0;
  const csColor = csScore >= 80 ? "var(--accent)" : csScore >= 60 ? "var(--orange)" : "var(--red)";
  html += `<div class="cc-metrics-row">
    <div class="cc-metric-card"><div class="cc-metric-label">Goal Health</div><div class="cc-metric-value" style="color:${gsColor}">${prog.gcHealthScore !== null ? prog.gcHealthScore : "—"}</div></div>
    <div class="cc-metric-card"><div class="cc-metric-label">Coach Score</div><div class="cc-metric-value" style="color:${csColor}">${csScore}</div></div>
    <div class="cc-metric-card"><div class="cc-metric-label">Recovery</div><div class="cc-metric-value" style="color:${rec.score >= 75 ? "var(--accent)" : rec.score >= 60 ? "var(--orange)" : "var(--red)"}">${rec.score}</div></div>
    <div class="cc-metric-card"><div class="cc-metric-label">Level</div><div class="cc-metric-value" style="color:var(--accent)">${cas ? cas.level : "—"}</div></div>
  </div>`;

  // Focus area (big card)
  if (ad && ad.focus) {
    html += `<div class="cc-focus-card"><div class="cc-focus-top"><span class="cc-focus-label">Primary Focus</span><span class="cc-focus-badge">${ad.focus.label}</span></div><div class="cc-focus-msg">${ad.focus.message}</div>${ad.focus.improvement ? `<div class="cc-focus-action">${ad.focus.improvement}</div>` : ""}</div>`;
  }

  // Active alerts
  if (ad && ad.alerts && ad.alerts.length > 0) {
    html += `<div class="cc-section"><div class="cc-section-label">Active Alerts (${ad.alerts.length})</div>`;
    ad.alerts.forEach((a) => {
      const sevColor = a.severity === "critical" ? "var(--red)" : a.severity === "high" ? "var(--orange)" : a.severity === "medium" ? "var(--yellow)" : "var(--accent)";
      html += `<div class="cc-alert"><span class="cc-alert-dot" style="background:${sevColor}"></span><span class="cc-alert-text">${a.text}</span></div>`;
    });
    html += `</div>`;
  }

  // Coach Score Breakdown
  if (wrFull && wrFull.scoreBreakdown) {
    const breakdown = wrFull.scoreBreakdown;
    html += `<div class="cc-section"><div class="cc-section-label">Coach Score Breakdown</div><div class="cc-breakdown-grid">`;
    Object.entries(breakdown).forEach(([key, comp]) => {
      const pct = comp.pct || 0;
      const barColor = pct >= 80 ? "var(--accent)" : pct >= 50 ? "var(--orange)" : "var(--red)";
      const labelMap = { workout: "Workout", protein: "Protein", recovery: "Recovery", activity: "Activity", tracking: "Tracking", consistency: "Consistency" };
      html += `<div class="cc-breakdown-row"><span class="cc-breakdown-label">${labelMap[key] || key}</span><div class="cc-breakdown-bar"><div class="cc-breakdown-fill" style="width:${pct}%;background:${barColor}"></div></div><span class="cc-breakdown-val">${comp.score}/${comp.max}</span></div>`;
    });
    html += `</div></div>`;
  }

  // Next actions
  if (ad && ad.recommendations && ad.recommendations.length > 0) {
    html += `<div class="cc-section"><div class="cc-section-label">Recommended Actions</div>`;
    ad.recommendations.slice(0, 4).forEach((r) => {
      const recIcon = r.type === "lesson" ? "📖" : r.type === "challenge" ? "🎯" : r.type === "recovery" ? "🔄" : r.type === "action" ? "⚡" : r.type === "insight" ? "💡" : "•";
      html += `<div class="cc-rec-item"><span class="cc-rec-icon">${recIcon}</span><span class="cc-rec-text">${r.label}</span></div>`;
    });
    html += `</div>`;
  }

  // Key stats grid
  const streak = prog.monthly ? prog.monthly.streak : 0;
  const weekCount = prog.weekly ? prog.weekly.workouts : 0;
  html += `<div class="cc-section"><div class="cc-section-label">Quick Stats</div><div class="cc-stats-grid">
    <div class="cc-stat"><span class="cc-stat-val">${weekCount}</span><span class="cc-stat-label">Workouts/Week</span></div>
    <div class="cc-stat"><span class="cc-stat-val">${streak}d</span><span class="cc-stat-label">Best Streak</span></div>
    <div class="cc-stat"><span class="cc-stat-val">${nut.proteinTarget || "—"}</span><span class="cc-stat-label">Protein Target</span></div>
    <div class="cc-stat"><span class="cc-stat-val">${profile ? Math.round(profile.workoutCompliance) + "%" : "—"}</span><span class="cc-stat-label">Compliance</span></div>
    <div class="cc-stat"><span class="cc-stat-val">${profile ? Math.round(profile.proteinCompliance) + "%" : "—"}</span><span class="cc-stat-label">Protein Adherence</span></div>
    <div class="cc-stat"><span class="cc-stat-val">${cas ? cas.achievements.count : "—"}</span><span class="cc-stat-label">Milestones</span></div>
    <div class="cc-stat"><span class="cc-stat-val">${cas ? cas.challenges.completed : "—"}</span><span class="cc-stat-label">Challenges Done</span></div>
    <div class="cc-stat"><span class="cc-stat-val">${prog.curWeight ? Math.round(prog.curWeight) + "kg" : "—"}</span><span class="cc-stat-label">Current Weight</span></div>
  </div></div>`;

  // Goal progress bar
  if (prog.goalProgress !== null) {
    html += `<div class="cc-section"><div class="cc-section-label">Goal Progress</div><div class="cc-goal-bar"><div class="cc-goal-fill" style="width:${Math.round(prog.goalProgress)}%"></div></div><div class="cc-goal-text">${Math.round(prog.goalProgress)}% toward ${gs.goalLabel}</div></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
  document.getElementById("ccBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

// ===== PROGRAM REVIEW =====
function renderProgramReview() {
  const container = document.getElementById("trainerPageContent");
  if (!container) return;

  if (typeof ProgramReviewEngine === "undefined") {
    container.innerHTML = `<div class="tr-page"><div class="tr-back" id="prBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div><div class="wi-empty">Program Health engine not available.</div></div>`;
    document.getElementById("prBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
    return;
  }

  const review = ProgramReviewEngine.runReview();
  const o = review.outcome;
  const ph = review.programHealth;
  const gp = review.goalProgress;
  const tr = review.training;
  const rc = review.recovery;
  const nt = review.nutrition;
  const ex = review.exercise;
  const adj = review.adjustments;
  const recs = review.topRecommendations;

  const strokeDash = (ph.score / 100) * 283;
  const ringColor = ph.score >= 80 ? "var(--accent)" : ph.score >= 65 ? "var(--orange)" : ph.score >= 45 ? "var(--yellow)" : "var(--red)";

  let html = `<div class="pr-page"><div class="pr-back" id="prBackBtn"><span class="wr-back-arrow">←</span> <span>Back</span></div>`;

  // HEADER
  html += `
  <div class="pr-header">
    <div class="pr-header-top">
      <div class="pr-header-left">
        <span class="pr-header-label">Program Health</span>
        <span class="pr-header-week">${gp.goalType ? (typeof GoalCenter !== "undefined" ? GoalCenter.getGoalLabel() : gp.goalType) : "General"} · Week ${review.weekNumber}</span>
      </div>
      <div class="pr-outcome-badge" style="color:${o.color}">${o.icon} ${o.label}</div>
    </div>
  </div>`;

  // HEALTH RING + COACH SUMMARY
  html += `
  <div class="pr-health-row">
    <div class="pr-ring-card">
      <div class="pr-ring">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--surface-3)" stroke-width="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="${ringColor}" stroke-width="8" stroke-linecap="round" stroke-dasharray="283" stroke-dashoffset="${283 - strokeDash}" transform="rotate(-90 50 50)" />
        </svg>
        <div class="pr-ring-score" style="color:${ringColor}">${ph.score}</div>
      </div>
      <div class="pr-ring-label">Program Health</div>
    </div>
    <div class="pr-summary-card">
      <div class="pr-summary-text">${review.coachSummary}</div>
      <div class="pr-summary-confidence">Confidence: ${ph.score >= 45 ? Math.round(60 + ph.score * 0.35) : 45}%</div>
    </div>
  </div>`;

  // SECTION 1: Goal Progress Review
  html += `
  <div class="pr-section">
    <div class="pr-section-header"><span class="pr-section-title">Goal Progress Review</span></div>
    <div class="pr-metrics-grid">
      ${gp.goalType ? `
      <div class="pr-metric-card"><span class="pr-metric-label">Goal Type</span><span class="pr-metric-value">${typeof GoalCenter !== "undefined" ? GoalCenter.getGoalLabel() : gp.goalType}</span></div>
      ` : ""}
      ${gp.startWeight ? `<div class="pr-metric-card"><span class="pr-metric-label">Start</span><span class="pr-metric-value">${gp.startWeight}kg</span></div>` : ""}
      ${gp.currentWeight ? `<div class="pr-metric-card"><span class="pr-metric-label">Current</span><span class="pr-metric-value">${gp.currentWeight}kg</span></div>` : ""}
      ${gp.targetWeight ? `<div class="pr-metric-card"><span class="pr-metric-label">Target</span><span class="pr-metric-value">${gp.targetWeight}kg</span></div>` : ""}
      ${gp.weeklyRate !== null ? `<div class="pr-metric-card"><span class="pr-metric-label">Weekly Rate</span><span class="pr-metric-value" style="color:${gp.status === "on-pace" || gp.status === "fast" ? "var(--accent)" : "var(--orange)"}">${gp.goalType === "lose-fat" ? "-" : ""}${Math.abs(gp.weeklyRate).toFixed(2)}kg</span></div>` : ""}
      ${gp.progress !== null ? `<div class="pr-metric-card"><span class="pr-metric-label">Progress</span><span class="pr-metric-value">${Math.round(gp.progress)}%</span></div>` : ""}
    </div>
    <div class="pr-status-row">
      <span class="pr-status-badge" style="background:${gp.status === "on-pace" ? "var(--accent)" : gp.status === "slow" || gp.status === "plateau" ? "var(--orange)" : gp.status === "off-track" ? "var(--red)" : "var(--surface-3)"}">${gp.status === "on-pace" ? "On Pace" : gp.status === "slow" ? "Slow" : gp.status === "plateau" ? "Plateau" : gp.status === "fast" ? "Fast" : gp.status === "off-track" ? "Off Track" : gp.status === "maintaining" ? "Maintaining" : gp.status === "stable" ? "Stable" : "Insufficient Data"}</span>
      <span class="pr-status-text">${gp.summary}</span>
    </div>
  </div>`;

  // SECTION 2: Training Effectiveness
  html += `
  <div class="pr-section">
    <div class="pr-section-header"><span class="pr-section-title">Training Effectiveness</span></div>
    <div class="pr-metrics-grid">
      <div class="pr-metric-card"><span class="pr-metric-label">Workouts/Week</span><span class="pr-metric-value" style="color:${tr.weekCount >= 3 ? "var(--accent)" : tr.weekCount >= 1 ? "var(--orange)" : "var(--red)"}">${tr.weekCount}</span></div>
      ${tr.monthCount ? `<div class="pr-metric-card"><span class="pr-metric-label">Monthly</span><span class="pr-metric-value">${tr.monthCount}</span></div>` : ""}
      ${tr.prCount > 0 ? `<div class="pr-metric-card"><span class="pr-metric-label">PRs This Month</span><span class="pr-metric-value" style="color:var(--accent)">${tr.prCount}</span></div>` : ""}
      ${tr.missedWorkouts > 0 ? `<div class="pr-metric-card"><span class="pr-metric-label">Missed</span><span class="pr-metric-value" style="color:var(--red)">${tr.missedWorkouts}</span></div>` : ""}
      ${tr.avgVolumePerSession ? `<div class="pr-metric-card"><span class="pr-metric-label">Avg Exercises</span><span class="pr-metric-value">${tr.avgVolumePerSession.toFixed(1)}</span></div>` : ""}
      <div class="pr-metric-card"><span class="pr-metric-label">Trend</span><span class="pr-metric-value" style="color:${tr.frequencyTrend === "up" ? "var(--accent)" : tr.frequencyTrend === "down" ? "var(--red)" : "var(--text)"}">${tr.frequencyTrend === "up" ? "↑ Increasing" : tr.frequencyTrend === "down" ? "↓ Decreasing" : "→ Stable"}</span></div>
    </div>
    <div class="pr-verdict">${tr.verdict}</div>
  </div>`;

  // SECTION 3: Recovery Review
  html += `
  <div class="pr-section">
    <div class="pr-section-header"><span class="pr-section-title">Recovery Review</span></div>
    <div class="pr-metrics-grid">
      <div class="pr-metric-card"><span class="pr-metric-label">Recovery Score</span><span class="pr-metric-value" style="color:${rc.score >= 80 ? "var(--accent)" : rc.score >= 65 ? "var(--orange)" : "var(--red)"}">${rc.score !== null ? rc.score : "—"}</span></div>
      ${rc.avgSleep !== null ? `<div class="pr-metric-card"><span class="pr-metric-label">Avg Sleep</span><span class="pr-metric-value" style="color:${rc.avgSleep >= 7.5 ? "var(--accent)" : rc.avgSleep >= 6.5 ? "var(--orange)" : "var(--red)"}">${rc.avgSleep.toFixed(1)}h</span></div>` : ""}
      <div class="pr-metric-card"><span class="pr-metric-label">Training Load</span><span class="pr-metric-value">${rc.trainingLoad} exercises</span></div>
      <div class="pr-metric-card"><span class="pr-metric-label">Avg Load/Session</span><span class="pr-metric-value">${rc.avgTrainingLoad.toFixed(1)}</span></div>
    </div>
    <div class="pr-verdict">${rc.verdict}</div>
    ${rc.sleepVerdict ? `<div class="pr-verdict pr-verdict-sub">${rc.sleepVerdict}</div>` : ""}
  </div>`;

  // SECTION 4: Nutrition Review
  html += `
  <div class="pr-section">
    <div class="pr-section-header"><span class="pr-section-title">Nutrition Review</span></div>
    <div class="pr-metrics-grid">
      ${nt.proteinDays !== null ? `<div class="pr-metric-card"><span class="pr-metric-label">Protein (7 days)</span><span class="pr-metric-value" style="color:${nt.proteinCompliance >= 85 ? "var(--accent)" : nt.proteinCompliance >= 60 ? "var(--orange)" : "var(--red)"}">${nt.proteinDays}/7</span></div>` : ""}
      ${nt.proteinCompliance !== null ? `<div class="pr-metric-card"><span class="pr-metric-label">Compliance</span><span class="pr-metric-value" style="color:${nt.proteinCompliance >= 85 ? "var(--accent)" : nt.proteinCompliance >= 60 ? "var(--orange)" : "var(--red)"}">${Math.round(nt.proteinCompliance)}%</span></div>` : ""}
      ${nt.proteinTarget ? `<div class="pr-metric-card"><span class="pr-metric-label">Target</span><span class="pr-metric-value">${nt.proteinTarget}g</span></div>` : ""}
    </div>
    <div class="pr-verdict">${nt.verdict}</div>
  </div>`;

  // SECTION 5: Exercise Analysis
  if (ex.lifts.some(e => e.status !== "untracked")) {
    html += `
    <div class="pr-section">
      <div class="pr-section-header"><span class="pr-section-title">Exercise Analysis</span></div>
      <div class="pr-ex-grid">`;
    ex.lifts.filter(e => e.status !== "untracked").forEach((lift) => {
      const liftColor = lift.status === "progressing" ? "var(--accent)" : lift.isStalled ? "var(--red)" : lift.status === "declining" ? "var(--red)" : "var(--text)";
      const changeStr = lift.change !== null ? (lift.change > 0 ? `+${lift.change}` : lift.change) + "kg" : "";
      html += `
      <div class="pr-ex-card">
        <div class="pr-ex-top">
          <span class="pr-ex-name">${lift.name}</span>
          <span class="pr-ex-status" style="color:${liftColor}">${lift.isStalled ? "Stalled" : lift.status === "progressing" ? "Progressing" : lift.status === "maintained" ? "Maintained" : lift.status === "declining" ? "Declining" : lift.currentWeight ? "Tracked" : "Untracked"}</span>
        </div>
        <div class="pr-ex-metrics">
          ${lift.currentWeight !== null ? `<span class="pr-ex-weight">${lift.currentWeight}kg</span>` : ""}
          ${changeStr ? `<span class="pr-ex-change" style="color:${liftColor}">${changeStr}</span>` : ""}
          ${lift.weeksSinceLastPR !== null ? `<span class="pr-ex-weeks">${lift.weeksSinceLastPR}w since PR</span>` : ""}
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // SECTION 6: Adjustments & Recommendations
  if (recs.length > 0) {
    html += `
    <div class="pr-section">
      <div class="pr-section-header"><span class="pr-section-title">Top Recommendations</span></div>
      <div class="pr-recs-list">`;
    recs.forEach((r, i) => {
      const priorityLabels = ["First", "Second", "Third"];
      html += `
      <div class="pr-rec-card">
        <div class="pr-rec-num">${i + 1}</div>
        <div class="pr-rec-content">
          <div class="pr-rec-action">${r.text}</div>
          <div class="pr-rec-area"><span class="pr-rec-badge">${r.area}</span> ${priorityLabels[i] || ""} priority</div>
          <div class="pr-rec-detail">${r.detail}</div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // SECTION 7: Program Health Breakdown
  if (ph.components && ph.components.length > 0) {
    html += `
    <div class="pr-section">
      <div class="pr-section-header"><span class="pr-section-title">Program Health Breakdown</span></div>
      <div class="pr-breakdown">`;
    ph.components.forEach((comp) => {
      const pct = comp.max > 0 ? (comp.score / comp.max) * 100 : 0;
      const barColor = pct >= 80 ? "var(--accent)" : pct >= 50 ? "var(--orange)" : "var(--red)";
      html += `
      <div class="pr-breakdown-row">
        <span class="pr-breakdown-label">${comp.name}</span>
        <div class="pr-breakdown-bar"><div class="pr-breakdown-fill" style="width:${pct}%;background:${barColor}"></div></div>
        <span class="pr-breakdown-val">${comp.score}/${comp.max}</span>
      </div>`;
    });
    html += `</div></div>`;
  }

  // Review History (last 3)
  const history = ProgramReviewEngine.loadHistory();
  if (history.reviews && history.reviews.length > 1) {
    const prevReviews = history.reviews.slice(-4, -1).reverse();
    html += `
    <div class="pr-section">
      <div class="pr-section-header"><span class="pr-section-title">Review History</span></div>
      <div class="pr-history">`;
    prevReviews.forEach((r) => {
      const hColor = r.outcome === "excellent" ? "var(--accent)" : r.outcome === "good" ? "var(--orange)" : r.outcome === "needs-adjustment" ? "var(--yellow)" : "var(--red)";
      html += `
      <div class="pr-history-row">
        <span class="pr-history-date">${r.date}</span>
        <span class="pr-history-score" style="color:${hColor}">${r.programHealth}</span>
        <span class="pr-history-outcome" style="color:${hColor}">${r.outcome}</span>
      </div>`;
    });
    html += `</div></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById("prBackBtn")?.addEventListener("click", () => showTrainerScreen("home"));
  document.querySelector(".main-area")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

const ACHIEVEMENT_DB = typeof CASEngine !== "undefined" ? CASEngine.getAllAchievements() : [];

// ===== RECOVERY HISTORY STORAGE (legacy compat) =====

function openCalendarDateSheet(session) {
  const sheet = document.getElementById("calendarDateSheet");
  if (!sheet) return;
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === session.workoutId);
  const workoutName = workout ? workout.name : session.workoutName || "Workout";

  const muscles = getSessionMuscles(session);
  const date = parseDateKey(session.dateKey);
  const dateStr = formatReadableDate(date);
  const duration = session.duration || 0;
  const durStr = duration > 0 ? `${Math.round(duration / 60)} min` : "—";

  let totalSets = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.done) totalSets++;
    }
  }

  const sessionPRs = getTodayPRs(session.dateKey);
  const prCount = sessionPRs.length;

  document.getElementById("cdsWorkout").textContent = `🔥 ${workoutName}`;
  document.getElementById("cdsDate").textContent = dateStr + (muscles.length ? ` · ${muscles.join(" · ")}` : "");
  document.getElementById("cdsDuration").textContent = durStr;
  document.getElementById("cdsSets").textContent = totalSets;
  document.getElementById("cdsPRs").textContent = prCount;
  document.getElementById("cdsCompletion").textContent = "✓ Completed";

  const prList = document.getElementById("cdsPRList");
  if (prCount > 0) {
    prList.style.display = "block";
    prList.innerHTML = sessionPRs.slice(0, 5).map((pr) => {
      const name = (pr.exerciseName || "").replace(/([A-Z])/g, " $1").trim();
      return `<div class="cal-date-pr-item">🏆 ${name} · ${displayWeight(pr.weight)} × ${pr.reps}</div>`;
    }).join("");
  } else {
    prList.style.display = "none";
  }

  const detailBtn = document.getElementById("cdsDetailBtn");
  const newBtn = detailBtn.cloneNode(true);
  detailBtn.parentNode.replaceChild(newBtn, detailBtn);
  newBtn.addEventListener("click", () => {
    sheet.classList.add("is-hidden");
    openWorkoutReport(session);
  });

  sheet.classList.remove("is-hidden");
}

function getSessionMuscles(session) {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === session.workoutId);
  if (workout && workout.muscles && workout.muscles.length) {
    return workout.muscles.map((id) => {
      const mg = MUSCLE_GROUPS.find((g) => g.id === id);
      return mg ? mg.label : id;
    });
  }
  if (workout && workout.focus) {
    return [workout.focus];
  }
  return [];
}

function openWorkoutReport(session) {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === session.workoutId);
  const workoutName = workout ? workout.name : session.workoutName || "Workout";
  const date = parseDateKey(session.dateKey);
  const dateStr = formatReadableDate(date);

  // Compute totals
  let totalVolume = 0;
  let totalSets = 0;
  let totalExercises = 0;
  for (const ex of session.exercises) {
    let exHasWorking = false;
    for (const set of ex.sets) {
      if (set.done && Number(set.weight) > 0) {
        totalVolume += Number(set.weight) * (Number(set.reps) || 0);
        totalSets++;
        exHasWorking = true;
      } else if (set.done) {
        totalSets++;
        exHasWorking = true;
      }
    }
    if (exHasWorking) totalExercises++;
  }
  const duration = session.duration || 0;
  const durMin = Math.round(duration / 60);
  const volStr = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k kg` : `${totalVolume} kg`;
  const sessionPRs = getTodayPRs(session.dateKey);
  const muscles = getSessionMuscles(session);
  const notes = session.notes || "";

  // Build exercises HTML
  let exercisesHtml = "";
  for (const ex of session.exercises) {
    const workingSets = ex.sets.filter((s) => s.done);
    if (!workingSets.length) continue;
    let exVolume = 0;
    let setsHtml = "";
    for (const set of workingSets) {
      const w = Number(set.weight);
      const r = set.reps || 0;
      if (w > 0) exVolume += w * r;
      const weightStr = w > 0 ? displayWeight(w) : "bodyweight";
      const rpeStr = set.rpe ? `RPE ${set.rpe}` : "";
      const noteStr = set.note ? ` · ${set.note}` : "";
      setsHtml += `<div class="wr-ex-set"><span>${weightStr} × ${r}${rpeStr ? " · " + rpeStr : ""}${noteStr}</span></div>`;
    }
    const exVolStr = exVolume > 0 ? `Volume: ${exVolume >= 1000 ? (exVolume / 1000).toFixed(1) + "k" : exVolume} kg` : "";
    const exName = ex.name.replace(/([A-Z])/g, " $1").trim();
    exercisesHtml += `<div class="wr-exercise">
      <div class="wr-ex-name">${exName}</div>
      ${setsHtml}
      ${exVolStr ? `<div class="wr-ex-volume">${exVolStr}</div>` : ""}
    </div>`;
  }

  // PRs
  let prHtml = "";
  if (sessionPRs.length > 0) {
    const seen = new Set();
    const unique = sessionPRs.filter((pr) => {
      const key = pr.exerciseName + pr.type;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    prHtml = `<div class="wr-pr-block">
      <div class="wr-pr-title">🏆 Personal Records</div>
      ${unique.map((pr) => {
        const name = (pr.exerciseName || "").replace(/([A-Z])/g, " $1").trim();
        const typeLabel = pr.type === "weight" ? "New Weight PR" : pr.type === "reps" ? "New Rep PR" : "New Volume PR";
        return `<div class="wr-pr-item">${name}: ${displayWeight(pr.weight)} × ${pr.reps} — ${typeLabel}</div>`;
      }).join("")}
    </div>`;
  }

  // Notes
  const notesHtml = notes ? `<div class="wr-notes-block"><div class="wr-section-title">Session Notes</div><div class="wr-notes-text">${notes}</div></div>` : "";

  // Muscle chips
  const musclesHtml = muscles.length > 0
    ? `<div class="wr-section">
        <div class="wr-section-title">Muscles Trained</div>
        <div class="wr-muscles">${muscles.map((m) => `<span class="wr-muscle-chip">${m}</span>`).join("")}</div>
      </div>`
    : "";

  // Find prev session with same workoutId
  const prevSession = state.sessions.filter((s) => s.finishedAt && s.workoutId === session.workoutId && s.dateKey < session.dateKey).sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];

  const overlay = document.createElement("div");
  overlay.className = "wr-overlay";
  overlay.id = "workoutReport";

  overlay.innerHTML = `
    <div class="wr-header">
      <button class="wr-back-btn" id="wrBackBtn">←</button>
      <div class="wr-header-info">
        <div class="wr-header-name">${workoutName}</div>
        <div class="wr-header-date">${dateStr}</div>
      </div>
    </div>
    <div class="wr-body">
      <div class="wr-overview-grid">
        <div class="wr-ov-item"><span class="wr-ov-value">${durMin}</span><span class="wr-ov-label">min</span></div>
        <div class="wr-ov-item"><span class="wr-ov-value">${totalExercises}</span><span class="wr-ov-label">Ex</span></div>
        <div class="wr-ov-item"><span class="wr-ov-value">${totalSets}</span><span class="wr-ov-label">Sets</span></div>
        <div class="wr-ov-item"><span class="wr-ov-value">${totalVolume >= 1000 ? (totalVolume / 1000).toFixed(1) + "k" : totalVolume}</span><span class="wr-ov-label">Vol</span></div>
        <div class="wr-ov-item"><span class="wr-ov-value">${sessionPRs.length}</span><span class="wr-ov-label">PRs</span></div>
      </div>

      <div class="wr-section">
        <div class="wr-section-title">Exercises Completed</div>
        ${exercisesHtml}
      </div>

      ${musclesHtml}
      ${prHtml}
      ${notesHtml}

      <div class="wr-actions">
        ${prevSession ? `<button class="wr-action-btn" id="wrCompareBtn">Compare Last Session</button>` : ""}
        <button class="wr-action-btn" id="wrRepeatBtn">Repeat Workout</button>
        <button class="wr-action-btn" id="wrBackToCalBtn">Back To Calendar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.querySelector("#wrBackBtn").addEventListener("click", closeWorkoutReport);
  overlay.querySelector("#wrBackToCalBtn").addEventListener("click", closeWorkoutReport);

  if (prevSession) {
    overlay.querySelector("#wrCompareBtn").addEventListener("click", () => {
      closeWorkoutReport();
      openWorkoutReport(prevSession);
    });
  }

  overlay.querySelector("#wrRepeatBtn").addEventListener("click", () => {
    closeWorkoutReport();
    startSessionForWorkout(session.workoutId);
    activateTab("sets");
  });
}

function closeWorkoutReport() {
  const overlay = document.getElementById("workoutReport");
  if (overlay) overlay.remove();
  document.body.style.overflow = "";
}



const GOAL_DESCRIPTIONS = {
  "Muscle Gain": "Build strength and increase lean muscle mass.",
  "Fat Loss": "Reduce body fat while maintaining muscle.",
  "Strength": "Focus on increasing lifting performance.",
  "Endurance": "Improve cardiovascular and muscular endurance.",
  "General Fitness": "Maintain overall health and fitness levels.",
  "Recomp": "Build muscle and lose fat simultaneously.",
};

function latestWeight() {
  const log = loadBodyLog().sort((a, b) => b.date.localeCompare(a.date));
  return log.length > 0 ? log[0] : null;
}

function getDaysSinceLastWeight() {
  const log = state.weightLog || [];
  if (!log.length) return null;
  const sorted = log.slice().sort((a, b) => b.date.localeCompare(a.date));
  const last = sorted[0];
  const today = new Date();
  const lastDate = parseDateKey(last.date);
  return Math.round((today - lastDate) / 86400000);
}

function getLastWeightText() {
  const log = state.weightLog || [];
  if (!log.length) return "Tap to log weight";
  const days = getDaysSinceLastWeight();
  if (days === 0) return "Updated Today";
  if (days === 1) return "Updated Yesterday";
  if (days !== null) return "Updated " + days + " Days Ago";
  return "Tap to log weight";
}

const GOAL_TYPE_MAP = {
  "build-muscle": "muscle-gain",
  "lose-fat": "fat-loss",
  "recomp": "recomposition",
  "strength": "general-fitness",
  "athletic": "general-fitness",
  "general": "general-fitness",
  "custom": "general-fitness",
};

function mapGoalType(raw) {
  return GOAL_TYPE_MAP[raw] || "general-fitness";
}

function getWeightGoal() {
  const gcGoal = GoalCenter.getCurrentGoal();
  if (GoalCenter.hasGoal(gcGoal)) {
    return {
      startWeight: gcGoal.startWeight,
      targetWeight: gcGoal.targetWeight,
      goalType: gcGoal.goalType,
      createdAt: gcGoal.createdDate,
    };
  }
  if (state.weightGoal) return state.weightGoal;
  const u = state.user;
  if (!u || !u.targetWeight) return null;
  const entry = latestWeight();
  const startWeight = entry ? entry.weight : (u.weight || 0);
  if (!startWeight || !u.targetWeight) return null;
  state.weightGoal = {
    startWeight,
    targetWeight: u.targetWeight,
    goalType: mapGoalType(u.goal || state.bodyGoal || ""),
    createdAt: new Date().toISOString(),
  };
  saveState();
  return state.weightGoal;
}

function computeGoalProgress() {
  const goal = getWeightGoal();
  if (!goal) return null;
  const { startWeight, targetWeight, goalType } = goal;
  const entry = latestWeight();
  const currentWeight = entry ? entry.weight : startWeight;

  if (goalType === "recomposition") {
    const change = Math.round((currentWeight - startWeight) * 10) / 10;
    return { progress: 0, status: "maintaining", remaining: null, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType, milestones: [], currentMilestone: 0, totalMilestones: 0 };
  }

  const isLoss = goalType === "fat-loss";
  const effectiveIsLoss = isLoss || (goalType === "general-fitness" && targetWeight < startWeight);
  const journey = Math.round((effectiveIsLoss ? startWeight - targetWeight : targetWeight - startWeight) * 10) / 10;
  const change = Math.round((effectiveIsLoss ? startWeight - currentWeight : currentWeight - startWeight) * 10) / 10;

  const totalMilestones = 4;
  const milestones = [];
  for (let i = 1; i <= totalMilestones; i++) {
    const pct = i / totalMilestones;
    const weight = effectiveIsLoss ? startWeight - journey * pct : startWeight + journey * pct;
    milestones.push({ index: i, weight: Math.round(weight * 10) / 10, pct: Math.round(pct * 100) });
  }
  let currentMilestone = 0;
  for (const m of milestones) {
    if (effectiveIsLoss ? currentWeight <= m.weight : currentWeight >= m.weight) {
      currentMilestone = m.index;
    }
  }

  if (journey <= 0) {
    return { progress: 0, status: "maintaining", remaining: 0, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType, milestones, currentMilestone, totalMilestones };
  }

  if (change <= 0) {
    const remaining = Math.max(0, Math.round((effectiveIsLoss ? currentWeight - targetWeight : targetWeight - currentWeight) * 10) / 10);
    return { progress: 0, status: change < 0 ? "moving-away" : "on-track", remaining, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType, milestones, currentMilestone: 0, totalMilestones };
  }

  const pct = Math.min(100, Math.round((change / journey) * 100));
  const remaining = Math.max(0, Math.round((effectiveIsLoss ? currentWeight - targetWeight : targetWeight - currentWeight) * 10) / 10);

  if (pct >= 100) {
    return { progress: 100, status: "achieved", remaining: 0, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType, milestones, currentMilestone: totalMilestones, totalMilestones };
  }

  return { progress: pct, status: "on-track", remaining, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType, milestones, currentMilestone, totalMilestones };
}

function weeklyWeightChange() {
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  if (log.length < 2) return null;
  const now = new Date();
  const weekAgo = getDateKey(new Date(now.getTime() - 7 * 86400000));
  const recent = log.filter((e) => e.date >= weekAgo);
  const before = log.filter((e) => e.date < weekAgo);
  if (recent.length === 0 || before.length === 0) return null;
  const avgRecent = recent.reduce((s, e) => s + e.weight, 0) / recent.length;
  const avgBefore = before.slice(-7).reduce((s, e) => s + e.weight, 0) / Math.min(before.length, 7);
  return avgRecent - avgBefore;
}



















function openGoalSelector() {
  const list = document.getElementById("gsList");
  const goals = [
    {
      id: "fat-loss", label: "Fat Loss", icon: "🔥",
      desc: "Build a lean physique while preserving muscle.",
      benefits: "Improved definition, better health markers, increased energy",
      timeline: "3–6 months to see significant results",
      examples: "Calorie deficit, HIIT, increased protein intake",
    },
    {
      id: "recomp", label: "Recomposition", icon: "⚖️",
      desc: "Lose fat while building muscle simultaneously.",
      benefits: "Body transformation without extreme dieting, sustainable approach",
      timeline: "6–12 months for noticeable transformation",
      examples: "Moderate deficit, progressive overload, adequate protein",
    },
    {
      id: "lean-bulk", label: "Lean Bulk", icon: "💪",
      desc: "Gain muscle mass while minimizing fat gain.",
      benefits: "Steady strength gains, improved physique, controlled growth",
      timeline: "4–8 months per bulk phase",
      examples: "Slight calorie surplus, compound lifts, progressive overload",
    },
    {
      id: "aggressive-bulk", label: "Aggressive Bulk", icon: "🏋️",
      desc: "Maximize muscle and strength gains rapidly.",
      benefits: "Fast strength increases, maximum muscle growth potential",
      timeline: "3–6 months per bulk phase",
      examples: "High calorie surplus, heavy compounds, higher volume",
    },
  ];
  const cur = state.bodyGoal || "recomp";
  list.innerHTML = goals.map(g => `
    <button class="gs-card${cur === g.id ? " is-sel" : ""}" data-goal="${g.id}">
      <div class="gs-card-icon">${g.icon}</div>
      <div class="gs-card-body">
        <div class="gs-card-title">${g.label}</div>
        <div class="gs-card-desc">${g.desc}</div>
        <div class="gs-card-meta">
          <span class="gs-card-tag">${g.timeline}</span>
        </div>
      </div>
    </button>
  `).join("");
  document.getElementById("goalSelectorSheet").classList.remove("is-hidden");
}

document.getElementById("gsCloseBtn")?.addEventListener("click", () => {
  document.getElementById("goalSelectorSheet").classList.add("is-hidden");
});

document.getElementById("gsList")?.addEventListener("click", (e) => {
  const opt = e.target.closest(".gs-card");
  if (!opt) return;
  const goal = opt.dataset.goal;
  state.bodyGoal = goal;
  if (state.user) state.user.goal = goal;
  saveState();
  // Sync to GoalCenter
  if (typeof GoalCenter !== "undefined") {
    const goalTypeMap = { "build-muscle": "muscle-gain", "lose-fat": "fat-loss", "general": "general-fitness", "strength": "strength", "athletic": "endurance", "recomp": "general-fitness" };
    GoalCenter.createProfile({ goalType: goalTypeMap[goal] || "general-fitness" });
  }
  document.getElementById("goalSelectorSheet").classList.add("is-hidden");
  renderHome();
  if (typeof renderSettings === "function") renderSettings();
});



// ===== MODALS =====
let exerciseDetailChartInstance = null;



document.getElementById("exerciseDetailClose")?.addEventListener("click", () => {
  document.getElementById("exerciseDetailModal").classList.add("is-hidden");
  const chartCanvas = document.getElementById("exerciseDetailChart");
  if (chartCanvas) chartCanvas.style.display = "";
  if (exerciseDetailChartInstance) {
    exerciseDetailChartInstance.destroy();
    exerciseDetailChartInstance = null;
  }
});

// ===== LOAD PROGRAM =====
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
      currentDay.exercises.push({
        name: exName,
        sets,
        reps: typeof reps === "number" ? reps : 8,
        repTarget: typeof reps === "string" ? reps : String(reps),
        weight: "",
        tip: "",
      });
    }
  }

  if (newPlan.length === 0) return;

  const preview = document.getElementById("programPreview");
  preview.classList.remove("is-hidden");
  preview.textContent = `Parsed ${newPlan.length} days with ${newPlan.reduce((s, d) => s + d.exercises.length, 0)} exercises.`;

  document.getElementById("confirmProgramModal").classList.remove("is-hidden");
  document.getElementById("confirmProgramText").textContent = `Replace current program with ${newPlan.length} days?`;
  document.getElementById("confirmProgramYes").onclick = () => {
    try {
      localStorage.setItem("wl_custom_program", JSON.stringify(newPlan));
    } catch {}
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

document.addEventListener("click", (e) => {
  const banner = e.target.closest("#homeIncompleteBanner");
  if (banner) {
    e.preventDefault();
    openOnboarding(true);
  }
  const profileCta = e.target.closest("#settingsCompleteProfile");
  if (profileCta) {
    e.preventDefault();
    openOnboarding(true);
  }
  const settingsGcBtn = e.target.closest("#settingsGoalCenterBtn");
  if (settingsGcBtn) {
    e.preventDefault();
    showTrainerScreen("goal-center");
  }
});

// ===== ONBOARDING =====

function isProfileComplete() {
  const u = state.user;
  return !!(u && u.name && u.name !== "Athlete" && u.age && u.height && u.weight);
}

const OB_STEPS_CONFIG = [
  { id: "welcome", title: "Welcome to IronLog", desc: "" },
  { id: "about-you", title: "About You", desc: "Let's get to know you." },
  { id: "your-training", title: "Your Training", desc: "Tell us about your training background." },
  { id: "your-goal", title: "Your Goal", desc: "What are you working toward?" },
  { id: "your-plan", title: "Your Plan", desc: "Here's what IronLog recommends." },
];

let obData = {};

let isProfileEdit = false;

function openOnboarding(animateIn, startStep) {
  obData = {};
  isProfileEdit = false;
  const modal = document.getElementById("onboardingModal");
  modal.classList.remove("is-hidden");
  if (animateIn) {
    modal.classList.add("animate-in");
    const onAnimEnd = () => { modal.classList.remove("animate-in"); modal.removeEventListener("animationend", onAnimEnd); };
    modal.addEventListener("animationend", onAnimEnd);
  }
  obGoToStep(startStep || 0);
}

function openProfileSectionEditor(section) {
  const p = getProfile();
  const stepMap = { personal: 1, goals: 3, training: 2, equipment: 2, nutrition: 3, body: 3, "body-log": 3 };
  const step = stepMap[section] || 0;
  // Seed obData from existing profile
  obData = {
    name: p.name, age: p.age, gender: p.gender, height: p.height, weight: p.weight,
    goalType: p.bodyGoal === "build-muscle" ? "muscle-gain" : p.bodyGoal === "lose-fat" ? "fat-loss" : p.bodyGoal === "general" ? "general-fitness" : p.bodyGoal || "general-fitness",
    experience: p.experience, trainingDays: p.trainingDays, equipment: p.equipment,
    equipmentDetails: p.equipmentDetails, injuries: p.injuries, injuryNotes: p.injuryNotes,
    dietPreference: p.dietPreference || "none", supplements: p.supplements,
    nutritionCal: p.calorieTarget, nutritionProtein: p.proteinGoal,
    metrics: p.bodyMeasurements || {},
    targetWeight: state.weightGoal?.targetWeight || 0,
    targetDate: state.weightGoal?.targetDate || "",
    primaryLift: "",
    activityLevel: p.activity || "moderate",
  };
  // Carry over saved onboardingData for fields the profile doesn't track directly
  if (state.onboardingData) Object.assign(obData, state.onboardingData, obData);
  isProfileEdit = true;
  const modal = document.getElementById("onboardingModal");
  modal.classList.remove("is-hidden");
  obGoToStep(step);
}

function closeOnboarding(animateOut, callback) {
  const modal = document.getElementById("onboardingModal");
  if (animateOut) {
    modal.classList.add("animate-out");
    const onAnimEnd = () => {
      modal.classList.add("is-hidden");
      modal.classList.remove("animate-out");
      modal.removeEventListener("animationend", onAnimEnd);
      if (callback) callback();
    };
    modal.addEventListener("animationend", onAnimEnd);
    // Fallback: fire callback after animation timeout if animationend doesn't fire
    setTimeout(() => {
      if (modal.classList.contains("animate-out")) {
        modal.classList.add("is-hidden");
        modal.classList.remove("animate-out");
        modal.removeEventListener("animationend", onAnimEnd);
        if (callback) callback();
      }
    }, 600);
  } else {
    modal.classList.add("is-hidden");
    if (callback) callback();
  }
}

function _obWheelHTML(id, values, selected, unit) {
  const rows = values.map((v, i) => {
    const sel = v === selected ? " is-selected" : "";
    return `<div class="ob-wheel-item${sel}" data-wi="${i}">${v}</div>`;
  }).join("");
  return `<div class="ob-wheel-wrap" data-wheel="${id}">
    <div class="ob-wheel-highlight"></div>
    <div class="ob-wheel" data-wv="${values.join(",")}">${rows}</div>
    ${unit ? `<div class="ob-wheel-caption">${unit}</div>` : ""}
  </div>`;
}

function _obWheelValue(wrapEl) {
  const sel = wrapEl.querySelector(".ob-wheel-item.is-selected");
  return sel ? sel.textContent.trim() : "";
}

function _obInitWheel(wrapEl, onChange) {
  const list = wrapEl.querySelector(".ob-wheel");
  if (!list) return;
  const items = list.querySelectorAll(".ob-wheel-item");
  let ticking = false;

  function update() {
    const listRect = list.getBoundingClientRect();
    const mid = listRect.top + listRect.height / 2;
    let best = null, bestDist = Infinity;
    items.forEach(item => {
      const r = item.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestDist) { bestDist = d; best = item; }
    });
    items.forEach(i => i.classList.remove("is-selected"));
    if (best) {
      best.classList.add("is-selected");
      if (onChange) onChange(best.textContent.trim());
    }
  }

  list.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  });

  update();

  // Scroll to selected on init
  const selIdx = [...items].findIndex(i => i.classList.contains("is-selected"));
  if (selIdx >= 0) {
    const target = items[selIdx];
    const listRect = list.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - listRect.top - (listRect.height / 2 - targetRect.height / 2);
    list.scrollTop += offset;
    setTimeout(update, 100);
  }
}

function obGoToStep(index) {
  const cfg = OB_STEPS_CONFIG[index];
  if (!cfg) return;
  saveState();

  const total = OB_STEPS_CONFIG.length;
  const pct = ((index + 1) / total * 100);
  document.getElementById("obStepsFill").style.width = pct + "%";
  document.getElementById("obStepsLabel").textContent = "Step " + (index + 1) + " of " + total;

  const timeLabels = ["About 1 minute left", "About 45 seconds left", "About 30 seconds left", "About 15 seconds left", "Almost done!"];
  document.getElementById("obTimeLabel").textContent = timeLabels[index] || "";

  const body = document.getElementById("obBody");

  let html = `<div class="ob-title">${cfg.title}</div>`;
  if (cfg.desc) html += `<div class="ob-desc">${cfg.desc}</div>`;
  html += obRenderStepContent(cfg.id);
  body.innerHTML = html;

  // Re-trigger slide-in animation
  body.style.animation = "none";
  body.offsetHeight;
  body.style.animation = "";

  obBindStepEvents(cfg.id, index);

  document.getElementById("onboardSkipBtn").onclick = () => {
    document.getElementById("onboardConfirmModal").classList.remove("is-hidden");
  };

  setTimeout(() => {
    const firstInput = body.querySelector("input, button, [tabindex]");
    if (firstInput) firstInput.focus();
  }, 100);
}

function obRenderStepContent(stepId) {
  if (stepId === "welcome") {
    return `<div class="ob-welcome">
      <div class="ob-welcome-illust">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 8h.01M6 16h.01M10 12h.01M14 8h.01M14 16h.01M18 12h.01"/>
          <rect x="2" y="4" width="20" height="16" rx="2"/>
        </svg>
      </div>
      <h1>Welcome to IronLog</h1>
      <p>Let's build your training profile.</p>
      <div class="ob-time-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Takes less than 90 seconds
      </div>
      <div class="ob-welcome-actions">
        <button id="obNextBtn">Get Started</button>
        <button class="btn-ghost" onclick="document.getElementById('onboardSkipBtn').click()">Skip for now</button>
      </div>
    </div>`;
  }

  if (stepId === "about-you") {
    const nameVal = obData.name || "";
    const ageVal = obData.age || 25;
    const heightVal = obData.height || 175;
    const ages = Array.from({length: 73}, (_, i) => i + 13);
    const heights = Array.from({length: 91}, (_, i) => i + 130);
    return `<div class="ob-fields">
      <div class="ob-field">
        <label class="ob-field-label">What's your name?</label>
        <input type="text" class="ob-input" id="obName" placeholder="Your name" maxlength="30" value="${nameVal}" autocomplete="name" />
      </div>
      <div class="ob-wheels-dual">
        <div class="ob-field">
          <label class="ob-field-label">Age</label>
          ${_obWheelHTML("obAgeWheel", ages, Number(ageVal), "years")}
        </div>
        <div class="ob-field">
          <label class="ob-field-label">Height (cm)</label>
          ${_obWheelHTML("obHeightWheel", heights, Number(heightVal), "cm")}
        </div>
      </div>
      <div class="ob-actions">
        <button class="ob-btn-primary" id="obNextBtn" disabled>Continue</button>
      </div>
    </div>`;
  }

  if (stepId === "your-training") {
    const exps = [
      { id: "beginner", label: "Beginner", desc: "Less than 6 months", icon: "🌱" },
      { id: "intermediate", label: "Intermediate", desc: "6 months to 2 years", icon: "🌿" },
      { id: "advanced", label: "Advanced", desc: "2+ years", icon: "🌳" },
    ];
    const daysList = [2,3,4,5,6];
    const daysLabels = { 2: "Minimal", 3: "Standard", 4: "Frequent", 5: "Dedicated", 6: "Intensive" };
    const weightVal = obData.weight || 70;
    const weights = Array.from({length: 171}, (_, i) => i + 30);

    let html = `<div class="ob-fields">`;
    html += `<div class="ob-field">
      <label class="ob-field-label">Current weight (kg)</label>
      ${_obWheelHTML("obWeightWheel", weights, Number(weightVal), "kg")}
    </div>`;
    html += `<div class="ob-field">
      <label class="ob-field-label">Experience level</label>
      <div class="ob-cards">${exps.map(e => `<button class="ob-card${obData.experience === e.id ? " is-active" : ""}" data-ob-exp="${e.id}">
        <div class="ob-card-icon">${e.icon}</div>
        <div class="ob-card-body">
          <div class="ob-card-title">${e.label}</div>
          <div class="ob-card-desc">${e.desc}</div>
        </div>
        ${e.id === "beginner" ? '<span class="ob-card-badge">Recommended</span>' : ""}
      </button>`).join("")}</div>
    </div>`;
    html += `<div class="ob-field">
      <label class="ob-field-label">Workout days per week</label>
      <div class="ob-grid-cards">${daysList.map(d => `<button class="ob-grid-card${obData.trainingDays === d ? " is-active" : ""}" data-ob-days="${d}">
        <div class="ob-grid-card-value">${d}</div>
        <div class="ob-grid-card-label">${daysLabels[d]}</div>
      </button>`).join("")}</div>
    </div>`;
    html += `<div class="ob-actions">
      <button class="ob-btn-secondary" id="obBackBtn">Back</button>
      <button class="ob-btn-primary" id="obNextBtn" disabled>Continue</button>
    </div></div>`;
    return html;
  }

  if (stepId === "your-goal") {
    const goals = [
      { id: "fat-loss", label: "Fat Loss", desc: "Drop body fat while keeping muscle", icon: "🔥" },
      { id: "muscle-gain", label: "Build Muscle", desc: "Add lean mass and shape your body", icon: "💪" },
      { id: "strength", label: "Get Stronger", desc: "Increase raw strength and power", icon: "🏋️" },
      { id: "general-fitness", label: "General Fitness", desc: "Stay active and feel great", icon: "✅" },
    ];
    const locations = [
      { id: "gym", label: "Gym", desc: "Full equipment access", icon: "🏋️" },
      { id: "home", label: "Home", desc: "Bodyweight & limited gear", icon: "🏠" },
      { id: "minimal", label: "Both", desc: "Mix of gym and home", icon: "🔄" },
    ];
    const injuries = [
      { id: "shoulder", label: "Shoulder" }, { id: "back", label: "Lower Back" },
      { id: "knee", label: "Knee" }, { id: "wrist", label: "Wrist" },
      { id: "hip", label: "Hip" }, { id: "ankle", label: "Ankle" },
    ];
    const selected = obData.injuries || [];

    let html = `<div class="ob-fields">`;
    html += `<div class="ob-field">
      <label class="ob-field-label">Primary goal</label>
      <div class="ob-cards">${goals.map(g => `<button class="ob-card${obData.goalType === g.id ? " is-active" : ""}" data-ob-goal="${g.id}">
        <div class="ob-card-icon">${g.icon}</div>
        <div class="ob-card-body">
          <div class="ob-card-title">${g.label}</div>
          <div class="ob-card-desc">${g.desc}</div>
        </div>
        ${g.id === "fat-loss" ? '<span class="ob-card-badge">Popular</span>' : ""}
      </button>`).join("")}</div>
    </div>`;
    html += `<div class="ob-field">
      <label class="ob-field-label">Training location</label>
      <div class="ob-cards" style="flex-direction:row">${locations.map(l => `<button class="ob-card${obData.equipment === l.id ? " is-active" : ""}" data-ob-equip="${l.id}" style="flex-direction:column;text-align:center;padding:0.85rem;gap:0.4rem">
        <div style="font-size:1.4rem">${l.icon}</div>
        <div class="ob-card-title" style="font-size:0.85rem">${l.label}</div>
      </button>`).join("")}</div>
    </div>`;
    html += `<div class="ob-field">
      <label class="ob-field-label">Injuries <span style="font-weight:400;color:var(--text-tertiary);font-size:0.78rem">(optional)</span></label>
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem">${injuries.map(inj => `<button class="ob-card" style="flex:0 0 auto;padding:0.5rem 0.85rem;border-radius:999px;gap:0.35rem;border-width:1.5px${selected.includes(inj.id) ? " is-active" : ""}" data-ob-injury="${inj.id}">
        <div class="ob-card-title" style="font-size:0.8rem">${inj.label}</div>
      </button>`).join("")}</div>
    </div>`;
    html += `<div class="ob-actions">
      <button class="ob-btn-secondary" id="obBackBtn">Back</button>
      <button class="ob-btn-primary" id="obNextBtn" disabled>Continue</button>
    </div></div>`;
    return html;
  }

  if (stepId === "your-plan") {
    const strategy = obGenerateStrategy();
    const preview = obGenerateProgramPreview();
    const goalLabels = { "fat-loss": "Fat Loss", "muscle-gain": "Build Muscle", "strength": "Strength", "general-fitness": "General Fitness" };
    const splitLabels = { "fat-loss": "Full Body", "muscle-gain": "Push Pull Legs", "strength": "Upper/Lower", "general-fitness": "Full Body" };
    const gt = obData.goalType || "general-fitness";
    const days = obData.trainingDays || 3;
    const expLabel = obData.experience ? obData.experience.charAt(0).toUpperCase() + obData.experience.slice(1) : "Beginner";
    const equipLabels = { gym: "Gym", home: "Home", minimal: "Both" };
    return `<div class="ob-summary">
      <div class="ob-summary-grid">
        <div class="ob-summary-card">
          <div class="ob-summary-card-icon" style="background:color-mix(in srgb,var(--accent) 15%,transparent)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="ob-summary-card-label">Goal</div>
          <div class="ob-summary-card-value">${goalLabels[gt] || "General Fitness"}</div>
        </div>
        <div class="ob-summary-card">
          <div class="ob-summary-card-icon" style="background:color-mix(in srgb,var(--orange) 15%,transparent)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          </div>
          <div class="ob-summary-card-label">Calories</div>
          <div class="ob-summary-card-value">${strategy["Calories"]}</div>
        </div>
        <div class="ob-summary-card">
          <div class="ob-summary-card-icon" style="background:color-mix(in srgb,var(--blue) 15%,transparent)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c-1.5 0-2.5-1-2.5-2 0-1 .5-2 2.5-2s2.5 1 2.5 2c0 1.5-1 2-2.5 2z"/><path d="M5 14c-1.5 0-2.5-1-2.5-2 0-1 .5-2 2.5-2s2.5 1 2.5 2c0 1.5-1 2-2.5 2z"/><path d="M14.5 6h-5l-2 4h9z"/></svg>
          </div>
          <div class="ob-summary-card-label">Protein</div>
          <div class="ob-summary-card-value">${strategy["Protein"]}</div>
        </div>
        <div class="ob-summary-card">
          <div class="ob-summary-card-icon" style="background:color-mix(in srgb,var(--protein) 15%,transparent)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--protein)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div class="ob-summary-card-label">Water</div>
          <div class="ob-summary-card-value">${strategy["Water"]}</div>
        </div>
        <div class="ob-summary-card">
          <div class="ob-summary-card-icon" style="background:color-mix(in srgb,var(--accent) 15%,transparent)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </div>
          <div class="ob-summary-card-label">Split</div>
          <div class="ob-summary-card-value">${splitLabels[gt] || "Full Body"}</div>
        </div>
        <div class="ob-summary-card">
          <div class="ob-summary-card-icon" style="background:color-mix(in srgb,var(--orange) 15%,transparent)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="ob-summary-card-label">Training Days</div>
          <div class="ob-summary-card-value">${days}x / week</div>
        </div>
        <div class="ob-summary-card">
          <div class="ob-summary-card-icon" style="background:color-mix(in srgb,var(--blue) 15%,transparent)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="ob-summary-card-label">Experience</div>
          <div class="ob-summary-card-value">${expLabel}</div>
        </div>
        <div class="ob-summary-card">
          <div class="ob-summary-card-icon" style="background:color-mix(in srgb,var(--protein) 15%,transparent)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--protein)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div class="ob-summary-card-label">Location</div>
          <div class="ob-summary-card-value">${equipLabels[obData.equipment] || "Gym"}</div>
        </div>
      </div>
      <p class="ob-summary-note">You can adjust all of this later in your Profile.</p>
      <button class="ob-finish-btn" id="obFinishBtn">Create My Plan</button>
    </div>`;
  }

  return "";
}

function obBindStepEvents(stepId, index) {
  const back = document.getElementById("obBackBtn");
  if (back) {
    back.addEventListener("click", () => {
      if (index > 0) obGoToStep(index - 1);
    });
  }

  if (stepId === "welcome") {
    document.getElementById("obNextBtn")?.addEventListener("click", () => obGoToStep(1));
    return;
  }

  if (stepId === "about-you") {
    const nameIn = document.getElementById("obName");
    const nextBtn = document.getElementById("obNextBtn");

    function checkAbout() {
      if (!nextBtn) return;
      const ageWheel = document.querySelector("[data-wheel='obAgeWheel']");
      const htWheel = document.querySelector("[data-wheel='obHeightWheel']");
      const age = Number(_obWheelValue(ageWheel));
      const ht = Number(_obWheelValue(htWheel));
      nextBtn.disabled = !(nameIn && nameIn.value.trim() && age >= 13 && age <= 120 && ht >= 100);
    }

    if (nameIn) nameIn.addEventListener("input", checkAbout);

    const ageWheel = document.querySelector("[data-wheel='obAgeWheel']");
    const htWheel = document.querySelector("[data-wheel='obHeightWheel']");
    if (ageWheel) _obInitWheel(ageWheel, () => checkAbout());
    if (htWheel) _obInitWheel(htWheel, () => checkAbout());

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const name = nameIn ? nameIn.value.trim() : "";
        const age = Number(_obWheelValue(ageWheel));
        const height = Number(_obWheelValue(htWheel));
        if (!name) { showToast("Please enter your name."); return; }
        if (!(age >= 13 && age <= 120)) { showToast("Please enter a valid age."); return; }
        if (!(height >= 100)) { showToast("Please enter a valid height."); return; }
        obData.name = name;
        obData.age = age;
        obData.height = height;
        Object.assign(state.onboardingData, obData); saveState();
        obGoToStep(2);
      });
    }
    return;
  }

  if (stepId === "your-training") {
    const nextBtn = document.getElementById("obNextBtn");

    const weightWheel = document.querySelector("[data-wheel='obWeightWheel']");
    if (weightWheel) _obInitWheel(weightWheel, () => {
      obData.weight = Number(_obWheelValue(weightWheel));
      obCheckTrainNext("your-training");
    });

    document.querySelectorAll("[data-ob-exp]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-ob-exp]").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        obData.experience = btn.dataset.obExp;
        obCheckTrainNext("your-training");
      });
    });

    document.querySelectorAll("[data-ob-days]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-ob-days]").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        obData.trainingDays = parseInt(btn.dataset.obDays);
        obCheckTrainNext("your-training");
      });
    });

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        Object.assign(state.onboardingData, obData); saveState();
        obGoToStep(3);
      });
    }
    return;
  }

  if (stepId === "your-goal") {
    document.querySelectorAll("[data-ob-goal]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-ob-goal]").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        obData.goalType = btn.dataset.obGoal;
        obCheckTrainNext("your-goal");
      });
    });
    document.querySelectorAll("[data-ob-equip]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-ob-equip]").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        obData.equipment = btn.dataset.obEquip;
        obCheckTrainNext("your-goal");
      });
    });
    document.querySelectorAll("[data-ob-injury]").forEach(btn => {
      btn.addEventListener("click", () => {
        btn.classList.toggle("is-active");
        if (!obData.injuries) obData.injuries = [];
        const id = btn.dataset.obInjury;
        const idx = obData.injuries.indexOf(id);
        if (idx >= 0) obData.injuries.splice(idx, 1);
        else obData.injuries.push(id);
      });
    });
    document.getElementById("obNextBtn")?.addEventListener("click", () => {
      Object.assign(state.onboardingData, obData); saveState();
      obGoToStep(4);
    });
    return;
  }

  if (stepId === "your-plan") {
    document.getElementById("obFinishBtn")?.addEventListener("click", () => obFinishSetup());
    return;
  }
}

function obCheckTrainNext(stepId) {
  if (stepId === "your-training") {
    document.getElementById("obNextBtn").disabled = !(Number(obData.weight) > 0 && obData.experience && obData.trainingDays);
  } else if (stepId === "your-goal") {
    document.getElementById("obNextBtn").disabled = !(obData.goalType && obData.equipment);
  }
}

function obGenerateStrategy() {
  const gt = obData.goalType || "general-fitness";
  const w = Number(obData.weight) || 70;
  const isFatLoss = gt === "fat-loss";
  const isMuscle = gt === "muscle-gain";

  const protein = isFatLoss ? Math.round(w * 2.2) : isMuscle ? Math.round(w * 2.0) : Math.round(w * 1.8);
  const calories = isFatLoss ? Math.round(w * 28) : isMuscle ? Math.round(w * 34) : Math.round(w * 30);
  const steps = isFatLoss ? "10,000" : "8,000";
  const water = Math.round(w * 0.033) + "L";
  const sleep = "7-9 hours";
  const cardio = isFatLoss ? "3x/week" : "2x/week";

  return {
    "Calories": calories + " kcal",
    "Protein": protein + "g",
    "Steps": steps + "/day",
    "Water": water + "/day",
    "Sleep": sleep + "/night",
    "Cardio": cardio,
  };
}

function obGenerateProgramPreview() {
  const goalLabels = {
    "fat-loss": "Fat Loss",
    "muscle-gain": "Muscle Gain",
    "strength": "Strength",
    "general-fitness": "General Fitness",
    "endurance": "Endurance",
  };
  const dietLabels = { none: "No Preference", vegetarian: "Vegetarian", vegan: "Vegan", keto: "Keto", paleo: "Paleo", mediterranean: "Mediterranean" };
  const equipLabels = { gym: "Gym", home: "Home", minimal: "Both" };
  return {
    "Goal": goalLabels[obData.goalType] || "General Fitness",
    "Experience": obData.experience ? obData.experience.charAt(0).toUpperCase() + obData.experience.slice(1) : "Beginner",
    "Days/Week": obData.trainingDays || "3",
    "Equipment": equipLabels[obData.equipment] || "Gym",
    "Diet": dietLabels[obData.dietPreference] || "No Preference",
    "Style": "Full Body",
    "Duration": "45-60 min",
  };
}

function obFinishSetup() {
  // Save user profile to state
  const goalTypeMap = {
    "fat-loss": "lose-fat",
    "muscle-gain": "build-muscle",
    "strength": "strength",
    "general-fitness": "general",
    "endurance": "athletic",
  };
  const mappedGoal = goalTypeMap[obData.goalType] || "general";

  state.user = state.user || {};
  state.user.name = (obData.name || "Athlete").trim();
  state.user.age = Number(obData.age) || 0;
  state.user.height = Number(obData.height) || 0;
  state.user.weight = Number(obData.weight) || 0;
  state.user.gender = obData.gender || "";
  state.user.goal = mappedGoal;
  state.user.experience = obData.experience || "beginner";
  state.user.trainingDays = obData.trainingDays || 3;
  state.user.equipment = obData.equipment || "gym";
  state.user.equipmentDetails = obData.equipmentDetails || [];
  state.user.injuries = obData.injuries || [];
  state.user.injuryNotes = obData.injuryNotes || "";
  state.user.dietPreference = obData.dietPreference || "none";
  state.user.supplements = obData.supplements || [];
  state.user.activity = obData.activityLevel || "moderate";
  state.bodyGoal = mappedGoal;
  if (Number(obData.nutritionCal)) { state.calorieTarget = Number(obData.nutritionCal); }
  else if (!state.calorieTarget) {
    const w = Number(obData.weight) || 70;
    const gt = obData.goalType || "general-fitness";
    state.calorieTarget = gt === "fat-loss" ? Math.round(w * 28) : gt === "muscle-gain" ? Math.round(w * 34) : Math.round(w * 30);
  }
  if (Number(obData.nutritionProtein)) { state.proteinGoal = Number(obData.nutritionProtein); }
  else if (!state.proteinGoal) {
    const w = Number(obData.weight) || 70;
    const gt = obData.goalType || "general-fitness";
    state.proteinGoal = gt === "fat-loss" ? Math.round(w * 2.2) : gt === "muscle-gain" ? Math.round(w * 2.0) : Math.round(w * 1.8);
  }
  state.waterGoal = state.waterGoal || Math.round((Number(obData.weight) || 70) * 35);
  state.restTimer = state.restTimer || 90;

  // Log initial weight (only on first onboarding)
  if (!isProfileEdit && Number(obData.weight) > 0) {
    if (!state.weightLog) state.weightLog = [];
    state.weightLog.push({ weight: Number(obData.weight), date: getDateKey(), notes: "Initial", loggedAt: new Date().toISOString() });
  }

  // Save body metrics
  if (obData.metrics) {
    const hasMetric = Object.values(obData.metrics).some(v => v);
    if (hasMetric) {
      state.user.bodyMeasurements = state.user.bodyMeasurements || {};
      Object.assign(state.user.bodyMeasurements, obData.metrics);
    }
  }

  // Sync to GoalCenter
  const goalActivityMap = {
    "fat-loss": "active", "muscle-gain": "very-active", "strength": "active",
    "general-fitness": "moderate", "endurance": "very-active",
  };
  const gcGoalData = {
    goalType: obData.goalType || "general-fitness",
    startWeight: Number(obData.weight) || 0,
    targetWeight: Number(obData.targetWeight) || 0,
    targetDate: obData.targetDate || null,
    trainingDays: obData.trainingDays || 3,
    experienceLevel: obData.experience || "beginner",
    activityLevel: goalActivityMap[obData.goalType] || "moderate",
  };

  if (typeof GoalCenter !== "undefined") {
    GoalCenter.createProfile(gcGoalData);
  }

  if (Number(obData.targetWeight) > 0 && Number(obData.weight) > 0) {
    state.weightGoal = {
      startWeight: Number(obData.weight),
      targetWeight: Number(obData.targetWeight),
      goalType: obData.goalType,
      createdAt: new Date().toISOString(),
    };
  }

  saveState();

  if (!isProfileEdit) {
    state.onboardingComplete = true;
    state.coachActivated = true;
    state.activatedAt = state.activatedAt || getDateKey(new Date());
  }
  Object.assign(state.onboardingData, obData);
  saveState();

  // Close onboarding — show activation only on first setup
  closeOnboarding(true, () => {
    render();
    renderProfileScreen();
    if (!isProfileEdit) showCoachActivation();
  });
}

// ===== COACH ACTIVATION SCREEN =====
function showCoachActivation() {
  const modal = document.getElementById("coachActivationModal");
  modal.classList.remove("is-hidden");

  const items = [
    { icon: "🎯", text: "Goal Created" },
    { icon: "🤖", text: "Coach Activated" },
    { icon: "💪", text: "Recovery Tracking" },
    { icon: "⚖️", text: "Weight Insights" },
    { icon: "🏆", text: "Challenges Enabled" },
    { icon: "📊", text: "Reports Enabled" },
  ];

  document.getElementById("obActivationGrid").innerHTML = items.map(i =>
    `<div class="ob-activation-item"><div class="ob-activation-item-icon">${i.icon}</div><div class="ob-activation-item-text">${i.text}</div></div>`
  ).join("");

  document.getElementById("obActivationStartBtn").onclick = () => {
    modal.classList.add("is-hidden");
    activateTab("sets");
    // Also trigger the workout generator
    openNewWorkoutGenerator();
  };
}

// ===== FIRST 7 DAYS EXPERIENCE =====
function getFirst7DayFocus() {
  const status = state.first7Days;
  const daysSinceStart = obDaysSinceActivation();
  const dayMap = [
    { day: 1, key: "day1Workout", focus: "First Workout", desc: "Complete your first workout", icon: "💪" },
    { day: 2, key: "day2Weight", focus: "Log Weight", desc: "Log your body weight", icon: "⚖️" },
    { day: 3, key: "day3Protein", focus: "Protein Education", desc: "Learn about protein", icon: "🥩" },
    { day: 4, key: "day4Learning", focus: "Learn", desc: "Explore the Learn", icon: "📚" },
    { day: 5, key: "day5Challenge", focus: "Challenge Introduction", desc: "Try your first challenge", icon: "🏆" },
    { day: 6, key: "day6CoachScore", focus: "Coach Score", desc: "Understand your Coach Score", icon: "📈" },
    { day: 7, key: "day7Report", focus: "First Weekly Report", desc: "Review your first report", icon: "📊" },
  ];

  // Figure out which day the user is on
  let currentDayIdx = 0;
  for (let i = 0; i < dayMap.length; i++) {
    if (!status[dayMap[i].key]) {
      currentDayIdx = i;
      break;
    }
    currentDayIdx = i + 1;
  }

  if (currentDayIdx >= dayMap.length) return null; // All 7 days complete

  // If the user has been active for more than 7 days, no banner
  if (daysSinceStart > 7) return null;

  return {
    day: currentDayIdx + 1,
    total: 7,
    ...dayMap[currentDayIdx],
    progress: currentDayIdx,
  };
}

function obDaysSinceActivation() {
  // Use global state directly
  if (!state.activatedAt) return 0;
  const activated = new Date(state.activatedAt);
  const now = new Date();
  return Math.floor((now - activated) / 86400000);
}

function obNavigateToDay(day, key) {
  if (day === 1) {
    // First workout - show workout generator
    openNewWorkoutGenerator();
  } else if (day === 2) {
    // Log weight
    openWeightLogger();
  } else if (day === 3) {
    // Protein education - show learning hub with protein focus
    showTrainerScreen("learning");
  } else if (day === 4) {
    // Learning hub
    showTrainerScreen("learning");
  } else if (day === 5) {
    // Challenges
    renderChallengesPage();
  } else if (day === 6) {
    // Coach score
    renderCoachCommandCenter();
  } else if (day === 7) {
    // Weekly report
    showTrainerScreen("weekly-report");
  }
}

// Check and auto-mark first-7-days progress
function checkFirst7DayProgress() {
  if (!state.onboardingComplete) return;

  const sessions = state.sessions || [];
  const hasWorkout = sessions.some(s => s.finishedAt);
  const weightLog = state.weightLog || [];
  const hasWeight = weightLog.length > 1;

  let hasLearning = false;
  try {
    const lhProg = JSON.parse(localStorage.getItem("ironlog_learning_progress"));
    hasLearning = lhProg && lhProg.completed && lhProg.completed.length > 0;
  } catch (e) { /* ignore */ }

  let hasChallenge = false;
  try {
    const casRaw = localStorage.getItem("ironlog_cas_data");
    if (casRaw) {
      const casData = JSON.parse(casRaw);
      hasChallenge = casData.challenges && casData.challenges.personalized && casData.challenges.personalized.length > 0;
    }
  } catch (e) { /* ignore */ }

  let hasReport = false;
  try {
    const repKeys = JSON.parse(localStorage.getItem("ironlog_report_keys") || "[]");
    hasReport = Array.isArray(repKeys) && repKeys.length > 0;
  } catch (e) { /* ignore */ }

  const status = state.first7Days;
  let changed = false;

  if (hasWorkout && !status.day1Workout) { state.first7Days["day1Workout"] = true; changed = true; }
  if (hasWeight && !status.day2Weight) { state.first7Days["day2Weight"] = true; changed = true; }
  if (hasLearning && !status.day3Protein) { state.first7Days["day3Protein"] = true; changed = true; }
  if (hasLearning && !status.day4Learning) { state.first7Days["day4Learning"] = true; changed = true; }
  if (hasChallenge && !status.day5Challenge) { state.first7Days["day5Challenge"] = true; changed = true; }
  if (hasReport && !status.day7Report) { state.first7Days["day7Report"] = true; changed = true; }

  if (changed) saveState();
}

// ===== ONBOARDING EVENT LISTENERS =====
document.getElementById("onboardSkipBtn").addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.remove("is-hidden");
});
document.getElementById("onboardConfirmCancel").addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.add("is-hidden");
});
document.getElementById("onboardConfirmSkip").addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.add("is-hidden");
  state.user = { name: "Athlete", goal: "general", experience: "beginner" };
  state.bodyGoal = "general";
  saveState();
  state.onboardingComplete = true;
  state.coachActivated = true;
  state.activatedAt = state.activatedAt || getDateKey(new Date());
  saveState();
  closeOnboarding(true, () => render());
});

// ===== EXERCISE LIBRARY =====
let elActiveCategory = "";

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem("wl_fav_exercises")) || [];
  } catch {
    return [];
  }
}
function saveFavorites(favs) {
  try {
    localStorage.setItem("wl_fav_exercises", JSON.stringify(favs));
  } catch {}
}

function loadRecentExercises() {
  try {
    return JSON.parse(localStorage.getItem("wl_recent_exercises")) || [];
  } catch {
    return [];
  }
}
function saveRecentExercises(recents) {
  try {
    localStorage.setItem("wl_recent_exercises", JSON.stringify(recents));
  } catch {}
}

function addRecentExercise(exId) {
  let recents = loadRecentExercises();
  recents = recents.filter((id) => id !== exId);
  recents.unshift(exId);
  if (recents.length > 10) recents = recents.slice(0, 10);
  saveRecentExercises(recents);
}

function openExerciseLibrary() {
  elActiveCategory = "";
  document.getElementById("elSearch").value = "";
  showScreen("screen-ex-library");
  renderExerciseLibrary();
}

function renderExerciseLibrary() {
  const favs = loadFavorites();
  const recents = loadRecentExercises();
  const search = document.getElementById("elSearch").value.toLowerCase().trim();

  // Categories
  const catContainer = document.getElementById("elCategories");
  catContainer.innerHTML =
    `<button class="el-cat-chip${!elActiveCategory ? " is-active" : ""}" data-cat="">All</button>` +
    EXERCISE_CATEGORIES.map((c) => `<button class="el-cat-chip${elActiveCategory === c ? " is-active" : ""}" data-cat="${c}">${c}</button>`).join("");
  catContainer.querySelectorAll(".el-cat-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      elActiveCategory = chip.dataset.cat;
      renderExerciseLibrary();
    });
  });

  const isSearching = !!search;
  const allCustom = state.customExercises || [];

  let filtered = EXERCISE_LIBRARY.concat(allCustom);
  if (elActiveCategory) {
    filtered = filtered.filter((ex) => ex.category === elActiveCategory);
  }
  if (search) {
    filtered = filtered.filter(
      (ex) => ex.name.toLowerCase().includes(search) || ex.primaryMuscle.toLowerCase().includes(search) || ex.equipment.toLowerCase().includes(search),
    );
  }

  // Recent section
  const recentSection = document.getElementById("elRecentSection");
  if (!isSearching && recents.length > 0) {
    recentSection.style.display = "";
    const recentExs = recents.map((id) => filtered.find((ex) => ex.id === id)).filter(Boolean);
    const recentList = document.getElementById("elRecentList");
    recentList.innerHTML = recentExs.length ? recentExs.map((ex) => renderExerciseCard(ex, favs)).join("") : "";
    bindExerciseCardClicks(recentList, favs);
  } else {
    recentSection.style.display = "none";
  }

  // All / filtered list
  const allList = document.getElementById("elAllList");
  if (isSearching || !elActiveCategory) {
    allList.innerHTML = filtered.length ? filtered.map((ex) => renderExerciseCard(ex, favs)).join("") : `<p class="el-empty">No exercises found.</p>`;
  } else {
    const activeExs = filtered;
    allList.innerHTML = activeExs.length
      ? activeExs.map((ex) => renderExerciseCard(ex, favs)).join("")
      : `<p class="el-empty">No exercises in this category.</p>`;
  }
  bindExerciseCardClicks(allList, favs);
}

function renderExerciseCard(ex, favs) {
  const isFav = favs.includes(ex.id);
  const isCustom = ex.isCustom;
  return `<div class="el-ex-card" data-ex-id="${ex.id}">
    <div class="el-ex-info">
      <div class="el-ex-name">${ex.name}</div>
      <div class="el-ex-meta">${ex.primaryMuscle} · ${ex.equipment}</div>
    </div>
    ${isCustom ? `<button class="el-ex-edit" data-edit-id="${ex.id}">Edit</button>` : ""}
    ${isCustom ? `<button class="el-ex-del" data-del-id="${ex.id}">Del</button>` : ""}
    <button class="el-ex-fav${isFav ? " is-fav" : ""}">${isFav ? "★" : "☆"}</button>
    <button class="el-ex-add">+</button>
  </div>`;
}

function bindExerciseCardClicks(container, favs) {
  container.querySelectorAll(".el-ex-card").forEach((card) => {
    const exId = card.dataset.exId;
    const favBtn = card.querySelector(".el-ex-fav");
    const addBtn = card.querySelector(".el-ex-add");
    const editBtn = card.querySelector(".el-ex-edit");
    const delBtn = card.querySelector(".el-ex-del");

    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let f = loadFavorites();
      if (f.includes(exId)) f = f.filter((id) => id !== exId);
      else f.push(exId);
      saveFavorites(f);
      renderExerciseLibrary();
    });

    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addExerciseToWorkout(exId);
    });

    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openCustomExerciseModal(exId);
      });
    }

    if (delBtn) {
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteCustomExercise(exId);
      });
    }
  });
}

function addExerciseToWorkout(exId) {
  const allCustom = state.customExercises || [];
  const exDef = EXERCISE_LIBRARY.find((e) => e.id === exId) || allCustom.find((e) => e.id === exId);
  if (!exDef) return;

  const session = getTodaySession();
  if (!session) return;
  const existing = session.exercises.find((e) => e.name === exDef.name);
  if (!existing) {
    const setCount = 3;
    session.exercises.push({
      name: exDef.name,
      sets: Array.from({ length: setCount }, () => ({
        id: crypto.randomUUID(),
        reps: 8,
        weight: "",
        done: false,
        isWarmup: false,
        notes: "",
        label: "",
        loggedAt: null,
      })),
    });
    saveState();
  }

  addRecentExercise(exId);

  showScreen("screen-ws");
  renderWorkoutSession();
}

// ===== CUSTOM EXERCISE =====
let editExerciseId = null;

function openCustomExerciseModal(exId) {
  if (exId) {
    const ex = (state.customExercises || []).find((e) => e.id === exId);
    if (!ex) return;
    editExerciseId = exId;
    document.getElementById("customExName").value = ex.name;
    document.getElementById("customExCategory").value = ex.category;
    document.getElementById("customExEquipment").value = ex.equipment || "";
    document.getElementById("customExTags").value = (ex.tags || []).join(", ");
    document.getElementById("customExSave").textContent = "Save Changes";
  } else {
    editExerciseId = null;
    document.getElementById("customExName").value = "";
    document.getElementById("customExEquipment").value = "";
    document.getElementById("customExTags").value = "";
    document.getElementById("customExSave").textContent = "Add Exercise";
  }
  document.getElementById("customExModal").classList.remove("is-hidden");
}

function saveCustomExercise() {
  const name = document.getElementById("customExName").value.trim();
  const category = document.getElementById("customExCategory").value;
  const equipment = document.getElementById("customExEquipment").value || "Other";
  const tagsRaw = document.getElementById("customExTags").value.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  if (!name) return;

  if (editExerciseId) {
    const ex = (state.customExercises || []).find((e) => e.id === editExerciseId);
    if (ex) {
      ex.name = name;
      ex.category = category;
      ex.primaryMuscle = category;
      ex.equipment = equipment;
      ex.tags = tags;
      saveState();
    }
    editExerciseId = null;
  } else {
    const newEx = {
      id: "custom-" + crypto.randomUUID().slice(0, 8),
      name,
      category,
      primaryMuscle: category,
      secondaryMuscles: [],
      equipment,
      tags,
      isCustom: true,
    };
    if (!state.customExercises) state.customExercises = [];
    state.customExercises.push(newEx);
    saveState();
  }

  document.getElementById("customExModal").classList.add("is-hidden");
  renderExerciseLibrary();
}

function deleteCustomExercise(exId) {
  if (!confirm("Delete this exercise? It will be removed from all workouts.")) return;
  const ex = (state.customExercises || []).find((e) => e.id === exId);
  if (!ex) return;
  state.customExercises = state.customExercises.filter((e) => e.id !== exId);
  // Remove from all plans and sessions
  if (state.plan) {
    state.plan.forEach((p) => {
      p.exercises = p.exercises.filter((e) => e.name !== ex.name);
    });
  }
  state.sessions.forEach((s) => {
    s.exercises = s.exercises.filter((e) => e.name !== ex.name);
  });
  saveState();
  renderExerciseLibrary();
}

// ===== EVENT LISTENERS: LIBRARY =====
document.getElementById("elBackBtn").addEventListener("click", () => {
  showScreen("screen-ws");
  renderWorkoutSession();
});

document.getElementById("elSearch").addEventListener("input", () => {
  renderExerciseLibrary();
});

document.getElementById("elCustomBtn").addEventListener("click", openCustomExerciseModal);
document.getElementById("customExClose").addEventListener("click", () => {
  document.getElementById("customExModal").classList.add("is-hidden");
});
document.getElementById("customExSave").addEventListener("click", saveCustomExercise);

document.getElementById("wsAddExBtn").addEventListener("click", openExerciseLibrary);

// ===== EVENT LISTENERS: HOME =====
document.getElementById("homeNewWorkout")?.addEventListener("click", () => {
  document.getElementById("newWoSheet").classList.remove("is-hidden");
});

document.getElementById("newWoOverlay")?.addEventListener("click", () => {
  document.getElementById("newWoSheet").classList.add("is-hidden");
});
document.getElementById("newWoCancel")?.addEventListener("click", () => {
  document.getElementById("newWoSheet").classList.add("is-hidden");
});
document.getElementById("newWoBuild")?.addEventListener("click", () => {
  document.getElementById("newWoSheet").classList.add("is-hidden");
  showNewWorkoutBuilder();
});
document.getElementById("newWoGenerate")?.addEventListener("click", () => {
  document.getElementById("newWoSheet").classList.add("is-hidden");
  openGenerateWorkout();
});



// ===== NEW WORKOUT BUILDER SCREEN =====
let nwSearchTerm = "";
let nwActiveFilters = [];

function showNewWorkoutBuilder() {
  document.getElementById("nwName").value = "";
  document.getElementById("nwSearch").value = "";
  nwSearchTerm = "";
  nwActiveFilters = [];
  document.getElementById("nwCreateBar").style.display = "none";
  document.getElementById("nwCreateSpacer").style.display = "none";
  renderFilterChips();
  renderNewWorkoutList();
  showScreen("screen-new-workout");
}

const NW_FILTERS = ["Chest", "Back", "Shoulders", "Triceps", "Biceps", "Legs", "Core"];
const NW_TYPE_FILTERS = ["Compound", "Isolation"];

function renderFilterChips() {
  const bar = document.getElementById("nwFilterBar");
  let html = `<div class="nw-filter-section"><span class="nw-filter-label">Muscle</span><div class="nw-filter-row">`;
  html += NW_FILTERS.map(
    (f) => `<button class="nw-chip ${nwActiveFilters.includes(f) ? "is-active" : ""}" data-filter="${f}">${f}</button>`
  ).join("");
  html += `</div></div>`;
  html += `<div class="nw-filter-section"><span class="nw-filter-label">Type</span><div class="nw-filter-row">`;
  html += NW_TYPE_FILTERS.map(
    (f) => `<button class="nw-chip ${nwActiveFilters.includes(f) ? "is-active" : ""}" data-filter="${f}">${f}</button>`
  ).join("");
  html += `</div></div>`;
  bar.innerHTML = html;
  bar.querySelectorAll(".nw-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      const idx = nwActiveFilters.indexOf(f);
      if (idx >= 0) nwActiveFilters.splice(idx, 1);
      else nwActiveFilters.push(f);
      renderFilterChips();
      renderNewWorkoutList();
    });
  });
}

function renderNewWorkoutList() {
  const container = document.getElementById("nwList");
  const cats = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Legs", "Glutes", "Calves", "Abs", "Forearms", "Traps", "Full Body"];
  let html = "";
  let total = 0;
  const q = nwSearchTerm.toLowerCase().trim();

  // Get all exercises (library + custom)
  let allExercises = [...EXERCISE_LIBRARY];
  if (state.customExercises) allExercises = allExercises.concat(state.customExercises);

  cats.forEach((cat) => {
    let exs = allExercises.filter((e) => e.category === cat);
    // Smart search: match name, tags, primaryMuscle, equipment
    if (q) {
      exs = exs.filter((e) => {
        const name = e.name.toLowerCase();
        const tags = (e.tags || []).map((t) => t.toLowerCase());
        const muscle = e.primaryMuscle.toLowerCase();
        const equip = e.equipment.toLowerCase();
        return name.includes(q) || tags.some((t) => t.includes(q)) || muscle.includes(q) || equip.includes(q);
      });
    }
    // Apply active filters
    if (nwActiveFilters.length) {
      exs = exs.filter((e) => {
        const tags = e.tags || [];
        return nwActiveFilters.some((f) => {
          const fLow = f.toLowerCase();
          return e.category.toLowerCase() === fLow || e.primaryMuscle.toLowerCase() === fLow || e.equipment.toLowerCase() === fLow || tags.some((t) => t.toLowerCase() === fLow);
        });
      });
    }
    if (!exs.length) return;
    total += exs.length;
    html += `<div class="nw-category">${cat}</div>`;
    exs.forEach((ex) => {
      html += `<label class="nw-ex-row" data-id="${ex.id}">
        <input type="checkbox" class="nw-check" data-id="${ex.id}" />
        <span class="nw-ex-name">${ex.name}</span>
        <span class="nw-ex-muscle">${ex.primaryMuscle} · ${ex.equipment}</span>
      </label>`;
    });
  });

  if (!html) {
    html = `<div class="nw-empty">No exercises found. <button class="nw-empty-btn" id="nwCustomBtn">Create Custom Exercise</button></div>`;
  }

  container.innerHTML = html;
  document.getElementById("nwCounter").textContent = total > 0 ? "0 Exercises Selected" : "No exercises found";
  document.getElementById("nwHelperText").textContent = "Select at least one exercise";
  document.getElementById("nwCreateBar").style.display = "none";
  document.getElementById("nwCreateSpacer").style.display = "none";

  container.querySelectorAll(".nw-check").forEach((cb) => {
    cb.addEventListener("change", updateCreateBar);
  });

  const customBtn = document.getElementById("nwCustomBtn");
  if (customBtn) {
    customBtn.addEventListener("click", () => {
      openCustomExerciseModal(null);
    });
  }
}

function updateCreateBar() {
  const checked = document.querySelectorAll(".nw-check:checked");
  const count = checked.length;
  const bar = document.getElementById("nwCreateBar");
  const counter = document.getElementById("nwCounter");
  const createBtn = document.getElementById("nwCreateBtn");
  const helper = document.getElementById("nwHelperText");
  const countLabel = document.getElementById("nwCreateCount");

  const spacer = document.getElementById("nwCreateSpacer");

  if (count === 0) {
    bar.style.display = "none";
    spacer.style.display = "none";
    counter.textContent = "0 Exercises Selected";
    return;
  }

  bar.style.display = "flex";
  spacer.style.display = "block";
  const label = count === 1 ? "Exercise Selected" : "Exercises Selected";
  countLabel.textContent = `${count} ${label}`;
  counter.textContent = `${count} ${label}`;

  const name = document.getElementById("nwName").value.trim();
  const valid = name.length > 0;

  if (!name) {
    helper.textContent = "Enter a workout name";
  } else {
    helper.textContent = "Ready to create workout";
  }

  createBtn.disabled = !valid;
}

document.getElementById("nwSearch")?.addEventListener("input", (e) => {
  nwSearchTerm = e.target.value;
  renderNewWorkoutList();
});

document.getElementById("nwBackBtn").addEventListener("click", () => {
  showScreen("screen-home");
});
document.getElementById("nwName").addEventListener("input", () => {
  const name = document.getElementById("nwName").value.trim();
  const checked = document.querySelectorAll(".nw-check:checked").length;
  const createBtn = document.getElementById("nwCreateBtn");
  const helper = document.getElementById("nwHelperText");

  if (checked > 0) {
    if (name.length > 0) {
      helper.textContent = "Ready to create workout";
      createBtn.disabled = false;
    } else {
      helper.textContent = "Enter a workout name";
      createBtn.disabled = true;
    }
  }
});

document.getElementById("nwCreateBtn").addEventListener("click", () => {
  const name = document.getElementById("nwName").value.trim();
  const checked = document.querySelectorAll(".nw-check:checked").length;

  if (!name) {
    showToast("Name your workout");
    return;
  }
  if (!checked) {
    showToast("Select at least one exercise");
    return;
  }

  const workoutName = name;
  const checkedEls = [...document.querySelectorAll(".nw-check:checked")];

  const activePlan = loadCustomProgram() || [];
  if (activePlan.some(w => w.name.toLowerCase() === workoutName.toLowerCase())) {
    showToast("A workout with this name already exists.");
    return;
  }

  const exercises = checkedEls.map((cb) => {
    const ex = EXERCISE_LIBRARY.find((e) => e.id === cb.dataset.id);
    return { name: ex.name, sets: 3, reps: 10, weight: "", notes: "" };
  });

  const workout = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: workoutName,
    exercises,
  };
  activePlan.push(workout);
  localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
  state.plan = activePlan;
  saveState();

  showToast("Workout created");
  showScreen("screen-home");
  renderHome();

  setTimeout(() => {
    const cards = document.querySelectorAll(".wo-card-item");
    if (cards.length > 0) {
      cards[cards.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
      cards[cards.length - 1].classList.add("is-active");
      setTimeout(() => cards[cards.length - 1].classList.remove("is-active"), 2000);
    }
  }, 100);
});



// ===== EVENT LISTENERS: CREATE WORKOUT =====
document.getElementById("cwClose").addEventListener("click", () => {
  document.getElementById("createWorkoutModal").classList.add("is-hidden");
});
document.getElementById("cwSaveBtn").addEventListener("click", () => {
  const name = document.getElementById("cwName").value.trim();
  if (!name) return;
  const activePlan = loadCustomProgram() || [];
  if (activePlan.some(w => w.name.toLowerCase() === name.toLowerCase())) {
    showToast("A workout named '" + name + "' already exists");
    return;
  }
  const newWorkout = {
    id: "custom-" + crypto.randomUUID().slice(0, 8),
    name,
    focus: document.getElementById("cwDesc").value.trim() || "",
    day: "",
    duration: document.getElementById("cwDuration").value.trim() || "",
    notes: document.getElementById("cwNotes").value.trim() || "",
    rest: "",
    exercises: [],
  };
  activePlan.push(newWorkout);
  try {
    localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
  } catch {}
  state.plan = activePlan;
  saveState();
  document.getElementById("createWorkoutModal").classList.add("is-hidden");
  renderHome();
});



// ===== EVENT LISTENERS: SETTINGS =====
document.getElementById("wsDescMore")?.addEventListener("click", () => {
  const btn = document.getElementById("wsDescMore");
  const text = document.getElementById("wsDescText");
  const expanded = btn.dataset.expanded === "true";
  if (expanded) {
    text.style.maxHeight = "1.4em";
    btn.textContent = "more";
    btn.dataset.expanded = "false";
  } else {
    text.style.maxHeight = text.scrollHeight + "px";
    btn.textContent = "less";
    btn.dataset.expanded = "true";
  }
});
document.getElementById("wsMenuBtn").addEventListener("click", () => {
  // Show workout menu dropdown
  const menu = document.getElementById("wsMenuDropdown") || createWorkoutMenu();
  menu.classList.toggle("is-hidden");
});
function createWorkoutMenu() {
  const d = document.createElement("div");
  d.id = "wsMenuDropdown";
  d.className = "ws-dropdown is-hidden";
  d.innerHTML = `<button class="ws-dropdown-item" data-action="edit-workout">Edit Workout</button><button class="ws-dropdown-item" data-action="delete-workout">Delete Workout</button>`;
  document.getElementById("screen-ws").appendChild(d);
  d.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (action === "delete-workout" && confirm("Delete this workout from your program?")) {
      const activePlan = loadCustomProgram() || plan;
      const idx = activePlan.findIndex((w) => w.id === currentWorkoutId);
      if (idx >= 0) {
        activePlan.splice(idx, 1);
        localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
        state.plan = activePlan;
        saveState();
      }
      d.classList.add("is-hidden");
      showScreen("screen-home");
      renderHome();
    }
    if (action === "edit-workout") {
      d.classList.add("is-hidden");
      openEditWorkout(currentWorkoutId);
    }
  });
  // Close on click outside
  document.addEventListener(
    "click",
    (ev) => {
      if (!d.contains(ev.target) && ev.target !== document.getElementById("wsMenuBtn")) d.classList.add("is-hidden");
    },
    { once: true },
  );
  return d;
}
// ===== WORKOUT EDITING SYSTEM =====
let editWorkoutId = null;

function duplicateWorkout(workoutId) {
  const activePlan = loadCustomProgram() || plan;
  const idx = activePlan.findIndex((w) => w.id === workoutId);
  if (idx < 0) return;
  const original = activePlan[idx];
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = "custom-" + crypto.randomUUID().slice(0, 8);
  copy.name = original.name + " Copy";
  activePlan.splice(idx + 1, 0, copy);
  localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
  state.plan = activePlan;
  saveState();
  renderHome();
}

function openEditWorkout(workoutId) {
  editWorkoutId = workoutId;
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === workoutId);
  if (!workout) return;
  document.getElementById("ewName").value = workout.name;
  renderEditExerciseList(workout);
  const picker = document.getElementById("ewAddPicker");
  picker.style.display = "none";
  picker.classList.add("is-hidden");
  document.getElementById("editWorkoutModal").classList.remove("is-hidden");
}

function renderEditExerciseList(workout) {
  const container = document.getElementById("ewExerciseList");
  if (!workout.exercises.length) {
    container.innerHTML = '<div style="font-size:0.75rem;color:var(--text-secondary);padding:0.5rem;text-align:center">No exercises. Click + Add to add one.</div>';
    return;
  }
  container.innerHTML = workout.exercises.map((ex, i) => `
    <div class="edit-ex-item" data-index="${i}">
      <span class="edit-ex-name">${ex.name}</span>
      <button class="edit-ex-up" data-index="${i}">↑</button>
      <button class="edit-ex-down" data-index="${i}">↓</button>
      <button class="edit-ex-remove" data-index="${i}">✕</button>
    </div>
  `).join("");
  container.querySelectorAll(".edit-ex-up").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.index);
      if (i <= 0) return;
      [workout.exercises[i - 1], workout.exercises[i]] = [workout.exercises[i], workout.exercises[i - 1]];
      renderEditExerciseList(workout);
    });
  });
  container.querySelectorAll(".edit-ex-down").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.index);
      if (i >= workout.exercises.length - 1) return;
      [workout.exercises[i], workout.exercises[i + 1]] = [workout.exercises[i + 1], workout.exercises[i]];
      renderEditExerciseList(workout);
    });
  });
  container.querySelectorAll(".edit-ex-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.index);
      workout.exercises.splice(i, 1);
      renderEditExerciseList(workout);
    });
  });
}

function saveEditWorkout() {
  const name = document.getElementById("ewName").value.trim();
  if (!name) return;
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === editWorkoutId);
  if (!workout) return;
  workout.name = name;
  localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
  state.plan = activePlan;
  saveState();
  document.getElementById("editWorkoutModal").classList.add("is-hidden");
  editWorkoutId = null;
  renderHome();
  const ws = document.getElementById("screen-ws");
  if (ws && !ws.classList.contains("is-hidden")) renderWorkoutSession();
}

// Edit workout modal event listeners
document.getElementById("ewClose").addEventListener("click", () => {
  document.getElementById("editWorkoutModal").classList.add("is-hidden");
  editWorkoutId = null;
});
document.getElementById("ewCancel").addEventListener("click", () => {
  document.getElementById("editWorkoutModal").classList.add("is-hidden");
  editWorkoutId = null;
});
document.getElementById("ewSaveBtn").addEventListener("click", saveEditWorkout);
document.getElementById("ewAddExercise").addEventListener("click", () => {
  const picker = document.getElementById("ewAddPicker");
  const hidden = picker.style.display === "none" || picker.classList.contains("is-hidden");
  picker.style.display = hidden ? "flex" : "none";
  picker.classList.toggle("is-hidden");
  if (hidden) {
    document.getElementById("ewSearch").value = "";
    document.getElementById("ewSearch").focus();
    document.getElementById("ewSearchResults").innerHTML = "";
  }
});
document.getElementById("ewSearch").addEventListener("input", () => {
  const q = document.getElementById("ewSearch").value.toLowerCase().trim();
  const results = document.getElementById("ewSearchResults");
  if (!q) { results.innerHTML = ""; return; }
  const allCustom = state.customExercises || [];
  const matches = EXERCISE_LIBRARY.concat(allCustom).filter(
    (ex) => ex.name.toLowerCase().includes(q) || ex.primaryMuscle.toLowerCase().includes(q)
  ).slice(0, 10);
  results.innerHTML = matches.length
    ? matches.map((ex) => `<button class="ew-search-result" data-ex-name="${ex.name}" style="text-align:left;padding:0.4rem 0.5rem;background:var(--surface);border:1px solid var(--border);border-radius:4px;font-size:0.78rem;cursor:pointer">${ex.name} <span style="color:var(--text-secondary);font-weight:500">${ex.primaryMuscle}</span></button>`).join("")
    : `<div style="font-size:0.72rem;color:var(--text-secondary);padding:0.3rem">No results</div>`;
  results.querySelectorAll(".ew-search-result").forEach((btn) => {
    btn.addEventListener("click", () => {
      const activePlan = loadCustomProgram() || plan;
      const workout = activePlan.find((w) => w.id === editWorkoutId);
      if (!workout) return;
      const name = btn.dataset.exName;
      if (!workout.exercises.find((e) => e.name === name)) {
        workout.exercises.push({ name, sets: 3, reps: 8, weight: "" });
        renderEditExerciseList(workout);
      }
      document.getElementById("ewSearch").value = "";
      document.getElementById("ewSearchResults").innerHTML = "";
    });
  });
});

document.getElementById("settingsBackBtn").addEventListener("click", () => {
  if (previousScreen === "screen-profile") {
    showScreen("screen-profile");
    renderProfileScreen();
    return;
  }
  const ws = document.getElementById("screen-ws");
  if (ws && !ws.classList.contains("is-hidden")) {
    showScreen("screen-ws");
  } else {
    activateTab("sets");
  }
});

// Profile screen navigation
let previousScreen = "screen-home";
document.getElementById("profileBackBtn")?.addEventListener("click", () => {
  showScreen(previousScreen);
  if (previousScreen === "screen-ws") {
    renderWorkoutSession();
  } else if (previousScreen === "screen-home") {
    renderHome();
  } else if (previousScreen === "screen-settings") {
    renderSettings();
  }
});

// Profile edit button delegation (clicking "Edit" on any section — legacy)
document.getElementById("profileContent")?.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-profile-edit]");
  if (editBtn) {
    openProfileEditor();
    return;
  }
  const actionBtn = e.target.closest("[data-profile-action]");
  if (actionBtn) {
    const action = actionBtn.dataset.profileAction;
    if (action === "settings") {
      previousScreen = "screen-profile";
      activateTab("settings");
    }
    return;
  }
});

// Topbar avatar → profile screen
document.getElementById("topbarAvatarBtn").addEventListener("click", () => {
  previousScreen = document.querySelector("#panel-sets .screen:not(.is-hidden)")?.id || "screen-home";
  showScreen("screen-profile");
  renderProfileScreen();
});

// Profile menu handlers
document.getElementById("profileMenuProfile")?.addEventListener("click", () => {
  document.getElementById("profileMenu").classList.add("is-hidden");
  activateTab("settings");
});

document.getElementById("profileMenuData")?.addEventListener("click", () => {
  document.getElementById("profileMenu").classList.add("is-hidden");
  activateTab("settings");
  // Scroll to export option after settings render
  setTimeout(() => {
    const exportRow = document.querySelector('[data-setting="export-json"]');
    if (exportRow) exportRow.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
});

document.getElementById("profileMenuDelete")?.addEventListener("click", () => {
  document.getElementById("profileMenu").classList.add("is-hidden");
  document.getElementById("deleteDataModal").classList.remove("is-hidden");
});

// Today screen focus item clicks
document.addEventListener("click", (e) => {
  const focusItem = e.target.closest(".today-focus-item");
  if (focusItem) {
    const type = focusItem.dataset.focus;
    if (type === "workout") activateTab("sets");
    if (type === "protein") showToast("Set your protein goal in Settings");
    if (type === "weight") document.getElementById("weightLogSheet")?.classList.remove("is-hidden");
    return;
  }
});



function openProfileEditor() {
  const user = state.user || {};
  document.getElementById("peName").value = user.name || "";
  document.getElementById("peAge").value = user.age || "";
  document.getElementById("peGender").value = user.gender || "";
  document.getElementById("peHeight").value = user.height || "";
  document.getElementById("peWeight").value = user.weight || "";
  document.getElementById("peGoal").value = GoalCenter.getGoalType() || user.goal || state.bodyGoal || "recomp";
  document.getElementById("peActivity").value = user.activity || "";
  document.getElementById("peExperience").value = user.experience || "";
  document.getElementById("peTrainingDays").value = user.trainingDays || "";
  document.getElementById("peEquipment").value = user.equipment || "";
  document.getElementById("peCalories").value = state.calorieTarget || user.calorieTarget || "";
  document.getElementById("peProtein").value = state.proteinGoal || user.proteinGoal || "";
  document.getElementById("peDiet").value = user.dietPreference || "";
  document.getElementById("peInjuries").value = Array.isArray(user.injuries) ? user.injuries.join(", ") : "";
  document.getElementById("peInjuryNotes").value = user.injuryNotes || "";
  document.getElementById("peSupplements").value = Array.isArray(user.supplements) ? user.supplements.join(", ") : "";
  document.getElementById("peEquipmentDetails").value = Array.isArray(user.equipmentDetails) ? user.equipmentDetails.join(", ") : "";
  document.getElementById("peWaterGoal").value = state.waterGoal || "";
  const bm = user.bodyMeasurements || {};
  document.getElementById("peBodyFat").value = bm.bodyFat || "";
  document.getElementById("peChest").value = bm.chest || "";
  document.getElementById("peWaist").value = bm.waist || "";
  document.getElementById("peArms").value = bm.arms || "";
  document.getElementById("peThighs").value = bm.thighs || "";
  document.getElementById("peNeck").value = bm.neck || "";
  document.getElementById("peHips").value = bm.hips || "";
  document.getElementById("profileEditorModal").classList.remove("is-hidden");
}

// ===== EVENT LISTENERS: PROFILE EDITOR =====
document.getElementById("peClose").addEventListener("click", () => {
  document.getElementById("profileEditorModal").classList.add("is-hidden");
});
document.getElementById("peSaveBtn").addEventListener("click", () => {
  const name = document.getElementById("peName").value.trim();
  if (!name) return;
  if (!state.user) state.user = {};
  state.user.name = name;
  state.user.age = Number(document.getElementById("peAge").value) || 0;
  state.user.gender = document.getElementById("peGender").value || "";
  state.user.height = Number(document.getElementById("peHeight").value) || 0;
  state.user.weight = Number(document.getElementById("peWeight").value) || 0;
  state.user.goal = document.getElementById("peGoal").value || "recomp";
  state.user.activity = document.getElementById("peActivity").value || "";
  state.user.experience = document.getElementById("peExperience").value || "";
  state.user.trainingDays = Number(document.getElementById("peTrainingDays").value) || 0;
  state.user.equipment = document.getElementById("peEquipment").value || "";
  state.calorieTarget = Number(document.getElementById("peCalories").value) || 0;
  state.proteinGoal = Number(document.getElementById("peProtein").value) || 0;
  state.user.dietPreference = document.getElementById("peDiet").value || "";
  const injuriesVal = document.getElementById("peInjuries").value.trim();
  state.user.injuries = injuriesVal ? injuriesVal.split(",").map(s => s.trim()).filter(Boolean) : [];
  state.user.injuryNotes = document.getElementById("peInjuryNotes").value.trim() || "";
  const suppsVal = document.getElementById("peSupplements").value.trim();
  state.user.supplements = suppsVal ? suppsVal.split(",").map(s => s.trim()).filter(Boolean) : [];
  const equipDetailsVal = document.getElementById("peEquipmentDetails").value.trim();
  state.user.equipmentDetails = equipDetailsVal ? equipDetailsVal.split(",").map(s => s.trim()).filter(Boolean) : [];
  state.waterGoal = Number(document.getElementById("peWaterGoal").value) || 0;
  const bf = Number(document.getElementById("peBodyFat").value);
  const chest = Number(document.getElementById("peChest").value);
  const waist = Number(document.getElementById("peWaist").value);
  const arms = Number(document.getElementById("peArms").value);
  const thighs = Number(document.getElementById("peThighs").value);
  const neck = Number(document.getElementById("peNeck").value);
  const hips = Number(document.getElementById("peHips").value);
  if (bf || chest || waist || arms || thighs || neck || hips) {
    state.user.bodyMeasurements = state.user.bodyMeasurements || {};
    if (bf) state.user.bodyMeasurements.bodyFat = bf;
    if (chest) state.user.bodyMeasurements.chest = chest;
    if (waist) state.user.bodyMeasurements.waist = waist;
    if (arms) state.user.bodyMeasurements.arms = arms;
    if (thighs) state.user.bodyMeasurements.thighs = thighs;
    if (neck) state.user.bodyMeasurements.neck = neck;
    if (hips) state.user.bodyMeasurements.hips = hips;
  }
  if (state.user.goal) state.bodyGoal = state.user.goal;
  if (state.weightGoal) {
    state.weightGoal.goalType = mapGoalType(state.user.goal);
  }
  saveState();
  document.getElementById("profileEditorModal").classList.add("is-hidden");
  renderProfileAvatar();
  renderHome();
  renderSettings();
  if (document.getElementById("screen-profile") && !document.getElementById("screen-profile").classList.contains("is-hidden")) {
    renderProfileScreen();
  }
});

// ===== WEIGHT LOG MODAL =====
let wlEntryId = null;

function renderWeightLogList() {
  const list = document.getElementById("wlEntryList");
  if (!list) return;
  const entries = (state.weightLog || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  if (entries.length === 0) {
    list.innerHTML = `<p class="empty-state" style="font-size:0.75rem;padding:0.5rem 0">No entries yet.</p>`;
    return;
  }
  list.innerHTML = entries
    .map(
      (e, i) => `
    <div class="wl-entry-row" data-wl-idx="${i}">
      <span class="wl-entry-weight">${displayWeight(e.weight)}</span>
      <span class="wl-entry-date">${formatReadableDate(parseDateKey(e.date))}</span>
      ${e.notes ? `<span class="wl-entry-notes">${e.notes}</span>` : ""}
      <button class="wl-entry-edit" data-wl-edit="${i}">✎</button>
      <button class="wl-entry-del" data-wl-del="${i}">✕</button>
    </div>
  `,
    )
    .join("");
  list.querySelectorAll("[data-wl-edit]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const idx = Number(btn.dataset.wlEdit);
      const entry = state.weightLog[idx];
      if (!entry) return;
      wlEntryId = idx;
      document.getElementById("wlWeight").value = entry.weight;
      document.getElementById("wlDate").value = entry.date;
      document.getElementById("wlNotes").value = entry.notes || "";
      document.querySelector("#weightLogModal h2").textContent = "Edit Weight";
      document.getElementById("wlSaveBtn").textContent = "Update";
      document.getElementById("wlDeleteBtn").classList.remove("is-hidden");
    });
  });
  list.querySelectorAll("[data-wl-del]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const idx = Number(btn.dataset.wlDel);
      if (!confirm("Delete this weight entry?")) return;
      state.weightLog.splice(idx, 1);
      saveState();
      renderWeightLogList();
      renderSettings();
    });
  });
}

function openWeightLogModal() {
  const wlW = document.getElementById("wlWeight");
  if (!wlW) return;
  const wlD = document.getElementById("wlDate");
  if (!wlD) return;
  const wlN = document.getElementById("wlNotes");
  if (!wlN) return;
  wlW.value = (state.user && state.user.weight) || "";
  wlD.value = getDateKey();
  wlN.value = "";
  wlEntryId = null;
  document.querySelector("#weightLogModal h2").textContent = "Log Weight";
  document.getElementById("wlSaveBtn").textContent = "Save";
  document.getElementById("wlDeleteBtn").classList.add("is-hidden");
  renderWeightLogList();
  const m = document.getElementById("weightLogModal");
  if (m) m.classList.remove("is-hidden");
}
document.getElementById("wlClose")?.addEventListener("click", () => {
  document.getElementById("weightLogModal")?.classList.add("is-hidden");
});
document.getElementById("wlDeleteBtn")?.addEventListener("click", () => {
  if (wlEntryId === null || !confirm("Delete this weight entry?")) return;
  state.weightLog.splice(wlEntryId, 1);
  saveState();
  wlEntryId = null;
  document.getElementById("weightLogModal")?.classList.add("is-hidden");
  renderSettings();
  renderHome();
});
document.getElementById("wlSaveBtn")?.addEventListener("click", () => {
  const wlW = document.getElementById("wlWeight");
  if (!wlW) return;
  const wlD = document.getElementById("wlDate");
  if (!wlD) return;
  const wlN = document.getElementById("wlNotes");
  if (!wlN) return;
  const w = wlW.value,
    d = wlD.value;
  if (!w || !d) return;
  if (wlEntryId !== null) {
    if (!state.weightLog) state.weightLog = [];
    state.weightLog[wlEntryId] = { weight: Number(w), date: d, notes: wlN.value || "", loggedAt: new Date().toISOString() };
    wlEntryId = null;
  } else {
    logWeight(Number(w), d, wlN.value);
  }
  if (state.onboardingComplete) {
    state.first7Days["day2Weight"] = true; saveState();
    checkFirst7DayProgress();
  }
  document.getElementById("weightLogModal")?.classList.add("is-hidden");
  renderSettings();
  renderHome();
});

// ===== REMINDER NOTIFICATIONS =====
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showDailyReminder(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = getDateKey();
  const key = "wl_reminder_" + title.replace(/\s+/g, "_").toLowerCase();
  if (localStorage.getItem(key) === today) return;
  try {
    new Notification(title, { body, icon: "/assets/icons/favicon.svg" });
  } catch {}
  localStorage.setItem(key, today);
}

function checkReminders() {
  if (state.weightReminder) {
    showDailyReminder("Daily Weight", "Log your weight for today to track progress.");
  }
  if (state.nutritionReminder) {
    showDailyReminder("Nutrition Check", "Track your meals and macros for today.");
  }
}

// ===== WAKE LOCK =====
let wakeLockSentinel = null;

async function requestWakeLock() {
  try {
    if (wakeLockSentinel) return;
    wakeLockSentinel = await navigator.wakeLock.request("screen");
    wakeLockSentinel.addEventListener("release", () => {
      wakeLockSentinel = null;
    });
  } catch {}
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release();
    wakeLockSentinel = null;
  }
}

// ===== SETTINGS EVENT DELEGATION =====
document.getElementById("screen-settings").addEventListener("click", (e) => {
  const row = e.target.closest("[data-setting]");
  if (!row) return;
  const setting = row.dataset.setting;

  if (setting === "profile") {
    previousScreen = "screen-settings";
    showScreen("screen-profile");
    renderProfileScreen();
    return;
  }

  if (setting === "weight-log") {
    openWeightLogModal();
    return;
  }

  if (setting === "rest-timer") {
    const opts = [30, 60, 90, 120, 180];
    const cur = state.restTimer || 90;
    const next = opts[(opts.indexOf(cur) + 1) % opts.length];
    state.restTimer = next;
    saveState();
    renderSettings();
    return;
  }
  if (setting === "weight-inc") {
    const opts = [0.5, 1, 1.25, 2.5, 5];
    const cur = state.weightInc || 1;
    const next = opts[(opts.indexOf(cur) + 1) % opts.length];
    state.weightInc = next;
    saveState();
    renderSettings();
    return;
  }
  if (setting === "weight-unit") {
    state.weightUnit = state.weightUnit === "kg" ? "lb" : "kg";
    saveState();
    renderSettings();
    return;
  }
  if (setting === "height-unit") {
    state.heightUnit = state.heightUnit === "cm" ? "ft/in" : "cm";
    saveState();
    renderSettings();
    return;
  }
  if (setting === "calorie-target") {
    const vals = [1800, 2000, 2100, 2200, 2400, 2500, 2700, 3000];
    const cur = state.calorieTarget || CAL_GOAL;
    const next = vals[(vals.indexOf(cur) + 1) % vals.length];
    state.calorieTarget = next;
    saveState();
    renderSettings();
    return;
  }
  if (setting === "protein-goal") {
    const vals = [100, 120, 146, 160, 180, 200];
    const cur = state.proteinGoal || PROTEIN_GOAL;
    const next = vals[(vals.indexOf(cur) + 1) % vals.length];
    state.proteinGoal = next;
    saveState();
    renderSettings();
    return;
  }
  if (setting === "water-goal") {
    const vals = [1500, 2000, 2500, 3000, 3500, 4000];
    const cur = state.waterGoal || WATER_TARGET;
    const next = vals[(vals.indexOf(cur) + 1) % vals.length];
    state.waterGoal = next;
    saveState();
    renderSettings();
    return;
  }
if (setting === "theme") {
    const vals = ["Dark", "Light", "System"];
    const cur = state.theme || "Dark";
    const next = vals[(vals.indexOf(cur) + 1) % vals.length];
    state.theme = next;
    let resolved = next.toLowerCase();
    if (resolved === "system") resolved = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", resolved);
    saveState();
    renderSettings();
    return;
}
  if (setting === "accent") {
    const vals = ["Green", "Blue", "Orange", "Purple"];
    const cur = state.accent || "Green";
    const next = vals[(vals.indexOf(cur) + 1) % vals.length];
    state.accent = next;
    document.documentElement.setAttribute("data-accent", next.toLowerCase());
    saveState();
    renderSettings();
    return;
  }
  if (setting === "font-size") {
    const vals = ["Small", "Medium", "Large"];
    const cur = state.fontSize || "Medium";
    const next = vals[(vals.indexOf(cur) + 1) % vals.length];
    state.fontSize = next;
    document.documentElement.setAttribute("data-font-size", next.toLowerCase());
    saveState();
    renderSettings();
    return;
  }
  if (setting === "export-json") {
    exportJSON();
    return;
  }
  if (setting === "import-json") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data || typeof data !== "object" || (!data.sessions && !data.user && !data.weightLog)) {
            alert("Invalid file: missing required data (sessions, user, or weightLog).");
            return;
          }
          // Auto-backup current data before import
          try {
            const backup = { ...state, waterLog: collectWaterLog(), mealLog: collectMealLog(), learningProgress: loadLearningProgress() };
            localStorage.setItem("ironlog_pre_import_backup", JSON.stringify(backup));
          } catch {}
          // Whitelist allowed keys and validate types
          const allowedKeys = new Set(["sessions", "plan", "customExercises", "user", "weightLog", "goals", "recoveryLog", "bodyGoal", "calorieTarget", "proteinGoal", "waterGoal", "fatTarget", "planOffset", "restTimer", "weightUnit", "heightUnit", "weightInc", "repInc", "autoRest", "autoNext", "focusMode", "screenAwake", "autoWarmup", "warmupStyle", "warmupReminder", "stretchReminder", "theme", "accent", "fontSize", "compactMode", "weightReminder", "nutritionReminder", "weeklyReview", "recoveryAnalysis", "coolDownDuration", "autoSummary", "autoCooldown", "showTomorrowPreview", "showWorkoutProgress", "workoutStreak", "profileBannerDismissed", "first7Days", "coachActivated", "activatedAt", "onboardingComplete", "onboardingData", "measurements", "photos", "waterLog", "mealLog", "learningProgress"]);
          const arrayKeys = new Set(["sessions", "plan", "customExercises", "weightLog", "goals", "recoveryLog", "measurements", "photos"]);
          const objKeys = new Set(["user", "recoveryAnalysis", "workoutStreak", "onboardingData", "first7Days", "waterLog", "mealLog", "learningProgress"]);
          const boolKeys = new Set(["autoRest", "autoNext", "focusMode", "screenAwake", "autoWarmup", "warmupReminder", "stretchReminder", "compactMode", "weightReminder", "nutritionReminder", "weeklyReview", "recoveryAnalysis", "autoSummary", "autoCooldown", "showTomorrowPreview", "showWorkoutProgress", "profileBannerDismissed", "coachActivated", "onboardingComplete"]);
          for (const key of Object.keys(data)) {
            if (!allowedKeys.has(key)) continue;
            if (arrayKeys.has(key) && !Array.isArray(data[key])) { data[key] = []; }
            if (objKeys.has(key) && (typeof data[key] !== "object" || data[key] === null || Array.isArray(data[key]))) { data[key] = null; }
            if (boolKeys.has(key) && typeof data[key] !== "boolean") { data[key] = true; }
          }
          Object.assign(state, data);
          saveState();
          // Restore water log and meal log to localStorage
          if (data.waterLog && typeof data.waterLog === "object") {
            for (const [key, val] of Object.entries(data.waterLog)) {
              try { localStorage.setItem(key, val); } catch {}
            }
          }
          if (data.mealLog && typeof data.mealLog === "object") {
            for (const [key, val] of Object.entries(data.mealLog)) {
              try { localStorage.setItem(key, val); } catch {}
            }
          }
          // Restore learning progress
          if (data.learningProgress && typeof data.learningProgress === "object") {
            try { localStorage.setItem("ironlog_learning_progress", JSON.stringify(data.learningProgress)); } catch {}
          }
          render();
          renderHome();
          renderSettings();
          alert("Data imported successfully!");
        } catch {
          alert("Invalid file format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
    return;
  }
  if (setting === "delete-all") {
    document.getElementById("deleteDataModal").classList.remove("is-hidden");
    return;
  }

  if (setting === "restore-backup") {
    const raw = localStorage.getItem("ironlog_pre_import_backup");
    if (!raw) {
      alert("No pre-import backup found.");
      return;
    }
    try {
      const backup = JSON.parse(raw);
      if (backup.waterLog && typeof backup.waterLog === "object") {
        for (const [key, val] of Object.entries(backup.waterLog)) {
          try { localStorage.setItem(key, val); } catch {}
        }
      }
      if (backup.mealLog && typeof backup.mealLog === "object") {
        for (const [key, val] of Object.entries(backup.mealLog)) {
          try { localStorage.setItem(key, val); } catch {}
        }
      }
      if (backup.learningProgress && typeof backup.learningProgress === "object") {
        try { localStorage.setItem("ironlog_learning_progress", JSON.stringify(backup.learningProgress)); } catch {}
      }
      Object.assign(state, backup);
      saveState();
      render();
      renderHome();
      renderSettings();
      alert("Backup restored successfully!");
    } catch {
      alert("Failed to restore backup. Data may be corrupted.");
    }
    return;
  }

  if (setting === "about-developer") {
    openDeveloperModal();
    return;
  }

  if (setting === "feedback-bug" || setting === "feedback-feature" || setting === "feedback-general") {
    const labels = { "feedback-bug": "bug", "feedback-feature": "feature", "feedback-general": "general" };
    const label = labels[setting] || "general";
    const body = encodeURIComponent(`[${label.toUpperCase()} Feedback]\n\n`);
    window.open(`mailto:aryanswaroop00@gmail.com?subject=IronLog%20Feedback%20(${label})&body=${body}`, "_blank");
    return;
  }

  // Goal radio change
  if (setting === "goal") {
    const sel = row.querySelector("input:checked");
    if (!sel) return;
    state.bodyGoal = sel.value;
    if (state.user) state.user.goal = sel.value;
    saveState();
    // Sync to GoalCenter
    if (typeof GoalCenter !== "undefined") {
      const gtm = { "build-muscle": "muscle-gain", "lose-fat": "fat-loss", "general": "general-fitness", "strength": "strength", "athletic": "endurance", "recomp": "general-fitness" };
      GoalCenter.createProfile({ goalType: gtm[sel.value] || "general-fitness" });
    }
    renderSettings();
    renderHome();
    return;
  }
});

// Toggle changes (delegated)
document.getElementById("settingsContent").addEventListener("change", (e) => {
  const toggle = e.target.closest("[data-setting]");
  if (!toggle) return;
  const setting = toggle.dataset.setting;
  const checked = e.target.checked;

  const map = {
    "auto-rest": "autoRest",
    "auto-next": "autoNext",
    "focus-mode": "focusMode",
    "weight-reminder": "weightReminder",
    "nutrition-reminder": "nutritionReminder",
    "weekly-review": "weeklyReview",
    "screen-awake": "screenAwake",
    "auto-warmup": "autoWarmup",
    "warmup-reminder": "warmupReminder",
    "stretch-reminder": "stretchReminder",
    "auto-summary": "autoSummary",
    "auto-cooldown": "autoCooldown",
    "tomorrow-preview": "showTomorrowPreview",
    "workout-progress": "showWorkoutProgress",
    "compact-mode": "compactMode",
  };
  if (map[setting] !== undefined) {
    state[map[setting]] = checked;
    saveState();
  }

  if (setting === "focus-mode") {
    document.documentElement.classList.toggle("focus-mode", checked);
  }
  if (setting === "screen-awake") {
    if (checked) requestWakeLock();
    else releaseWakeLock();
  }
  if (setting === "compact-mode") {
    document.querySelector(".main-area")?.classList.toggle("compact-mode", checked);
  }
});

// Delete data modal (static elements)
// Factory Reset Flow
let frState = 0;
const ddModal = document.getElementById("deleteDataModal");
document.getElementById("ddClose")?.addEventListener("click", () => { ddModal.classList.add("is-hidden"); });
document.getElementById("frCancelBtn")?.addEventListener("click", () => { ddModal.classList.add("is-hidden"); });
document.getElementById("frNextBtn")?.addEventListener("click", () => {
  document.getElementById("frStep1").style.display = "none";
  document.getElementById("frStep2").style.display = "";
  document.getElementById("frInput").focus();
});
document.getElementById("frBackBtn")?.addEventListener("click", () => {
  document.getElementById("frStep2").style.display = "none";
  document.getElementById("frStep1").style.display = "";
});
document.getElementById("frFinalBackBtn")?.addEventListener("click", () => {
  document.getElementById("frStep3").style.display = "none";
  document.getElementById("frStep2").style.display = "";
});
document.getElementById("frInput")?.addEventListener("input", function() {
  document.getElementById("frConfirmBtn").disabled = this.value.trim().toUpperCase() !== "RESET";
});
document.getElementById("frConfirmBtn")?.addEventListener("click", () => {
  document.getElementById("frStep2").style.display = "none";
  document.getElementById("frStep3").style.display = "";
});
document.getElementById("ddConfirmBtn")?.addEventListener("click", () => {
  const keys = [
    STORAGE_KEY, "wl_custom_program", "wl_prs", "nutrition_v2",
    "wl_bodylog", "wl_exercise_notes", "wl_fav_meals", "wl_recent_foods",
    "wl_fav_exercises", "wl_recent_exercises", "wl_profile", "wl_theme",
    "wl_preferred_unit", "wl_nutrition_mode", "wl_generator_profile", "wt_autosave",
    "ironlog_learning_progress", "ironlog_goal_center", "ironlog_onboarding",
  ];
  const allKeys = Object.keys(localStorage);
  allKeys.forEach((k) => {
    if (k.startsWith("wl_meals_") || k.startsWith("wl_water_")) keys.push(k);
  });
  keys.forEach((k) => localStorage.removeItem(k));
  location.reload();
});

// Developer modal
document.getElementById("dmBack")?.addEventListener("click", closeDeveloperModal);
document.getElementById("developerModal")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeDeveloperModal();
});

// ===== EVENT LISTENERS: BUILDER =====
document.getElementById("builderClose").addEventListener("click", () => {
  document.getElementById("builderModal").classList.add("is-hidden");
  document.getElementById("builderResult").innerHTML = "";
});
document.getElementById("builderGoal").addEventListener("change", validateBuilder);
document.getElementById("builderDays").addEventListener("change", validateBuilder);
document.getElementById("builderEquipment").addEventListener("change", validateBuilder);
document.getElementById("builderDuration").addEventListener("change", validateBuilder);
function validateBuilder() {
  const goal = document.getElementById("builderGoal").value;
  const days = document.getElementById("builderDays").value;
  document.getElementById("builderGenerateBtn").disabled = !goal || !days;
}
document.getElementById("builderGenerateBtn").addEventListener("click", () => {
  const goal = document.getElementById("builderGoal").value;
  const days = Number(document.getElementById("builderDays").value);
  const equipment = document.getElementById("builderEquipment").value || "full";
  const duration = Number(document.getElementById("builderDuration").value) || 60;
  const program = generateProgram(goal, days, equipment, duration);
  const result = document.getElementById("builderResult");
  if (!program || program.length === 0) {
    result.innerHTML = `<p style="font-size:0.78rem;color:var(--red);text-align:center;padding:0.5rem">Could not generate program. Try different options.</p>`;
    return;
  }
  let html = `<p style="font-size:0.78rem;color:var(--accent);font-weight:700;margin-bottom:0.5rem">Generated Program (${days} days)</p>`;
  program.forEach((day) => {
    html += `<div class="builder-day"><div class="builder-day-title">${day.name}</div>`;
    day.exercises.forEach((ex) => {
      html += `<div class="builder-ex"><span class="builder-ex-name">${ex.name}</span><span class="builder-ex-detail">${ex.sets}×${ex.reps}</span></div>`;
    });
    html += `</div>`;
  });
  html += `<button class="btn-primary" style="width:100%;margin-top:0.5rem" id="builderUseBtn">Use This Program</button>`;
  result.innerHTML = html;
  document.getElementById("builderUseBtn")?.addEventListener("click", () => {
    if (state.plan) {
      if (!confirm("Replace your current program?")) return;
    }
    state.plan = program;
    try {
      localStorage.setItem("wl_custom_program", JSON.stringify(program));
    } catch {}
    saveState();
    document.getElementById("builderModal").classList.add("is-hidden");
    result.innerHTML = "";
    renderHome();
  });
});

// ===== EVENT LISTENERS: WARMUP =====
document.getElementById("warmupClose").addEventListener("click", () => {
  document.getElementById("warmupModal").classList.add("is-hidden");
  document.getElementById("warmupResult").innerHTML = "";
});
document.getElementById("warmupGenerateBtn").addEventListener("click", () => {
  const weight = document.getElementById("warmupWeight").value;
  const sets = generateWarmup(weight);
  const result = document.getElementById("warmupResult");
  if (!sets.length) {
    result.innerHTML = `<p style="font-size:0.78rem;color:var(--text-secondary);text-align:center;padding:0.5rem">Enter a valid working weight.</p>`;
    return;
  }
  let html = `<p style="font-size:0.78rem;color:var(--accent);font-weight:700;margin-bottom:0.5rem">Warmup for ${displayWeight(weight)}</p>`;
  sets.forEach((s) => {
    const isWorking = s.pct === "Working";
    html += `<div class="wu-set" style="${isWorking ? "background:var(--surface-2);border-radius:6px;padding:0.5rem 0.4rem;margin-top:0.35rem" : ""}">
      <div><span class="wu-set-value">${displayWeight(s.bar)}</span><span class="wu-set-label"> × ${s.reps}</span></div>
      <div><span class="wu-set-label">${s.pct}</span>${isWorking ? '<span style="color:var(--accent);font-size:0.68rem;margin-left:0.35rem">⬅ Working Set</span>' : ""}</div>
    </div>`;
  });
  result.innerHTML = html;
});

// ===== EVENT LISTENERS: GOAL EDITOR =====
document.getElementById("goalEditorClose").addEventListener("click", () => {
  document.getElementById("goalEditorModal").classList.add("is-hidden");
});
document.getElementById("goalEditorSave").addEventListener("click", saveGoal);
document.getElementById("goalEditorDelete").addEventListener("click", deleteGoal);

// ===== EVENT LISTENERS: SESSION SUMMARY =====
// ssCloseBtn replaced by ssStartStretch / ssSkipStretch handled in showSessionSummary
document.getElementById("sessionSummaryOverlay")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    // Click outside card — ignore, force explicit choice
  }
});

// ===== WARMUP / STRETCH SYSTEM =====
const WARMUP_ROUTINES = {
  Push: [
    { name: "Arm Circles", reps: "20 reps" },
    { name: "Band Pull Aparts", reps: "15 reps" },
    { name: "Push-Ups", reps: "10 reps" },
    { name: "Light Bench Press", reps: "10 reps" },
  ],
  Pull: [
    { name: "Arm Circles", reps: "20 reps" },
    { name: "Band Rows", reps: "15 reps" },
    { name: "Scapular Pull-Ups", reps: "10 reps" },
    { name: "Light Rows", reps: "10 reps" },
  ],
  Legs: [
    { name: "Leg Swings", reps: "20 reps" },
    { name: "Bodyweight Squats", reps: "15 reps" },
    { name: "Hip Openers", reps: "10 reps" },
    { name: "Walking Lunges", reps: "10 reps" },
  ],
  "Full Body": [
    { name: "Jumping Jacks", reps: "30 sec" },
    { name: "Arm Circles", reps: "20 reps" },
    { name: "Bodyweight Squats", reps: "15 reps" },
    { name: "Hip Rotations", reps: "10 reps" },
  ],
};

const COOLDOWN_ROUTINES = {
  Push: [
    { name: "Chest Stretch", reps: "30 sec each" },
    { name: "Shoulder Stretch", reps: "30 sec each" },
    { name: "Triceps Stretch", reps: "30 sec each" },
    { name: "Doorway Stretch", reps: "30 sec" },
    { name: "Wrist Flexor Stretch", reps: "20 sec each" },
    { name: "Deep Breathing Reset", reps: "10 breaths" },
  ],
  Pull: [
    { name: "Lat Stretch", reps: "30 sec each" },
    { name: "Upper Back Stretch", reps: "30 sec" },
    { name: "Biceps Stretch", reps: "30 sec each" },
    { name: "Neck Stretch", reps: "20 sec each" },
    { name: "Forearm Stretch", reps: "20 sec each" },
    { name: "Cat-Cow", reps: "10 reps" },
    { name: "Deep Breathing Reset", reps: "10 breaths" },
  ],
  Legs: [
    { name: "Quad Stretch", reps: "30 sec each" },
    { name: "Hamstring Stretch", reps: "30 sec each" },
    { name: "Calf Stretch", reps: "30 sec each" },
    { name: "Hip Flexor Stretch", reps: "30 sec each" },
    { name: "Glute Stretch", reps: "30 sec each" },
    { name: "Adductor Stretch", reps: "30 sec each" },
    { name: "Deep Breathing Reset", reps: "10 breaths" },
  ],
};

let warmupTimerInterval = null;
let warmupTimerSeconds = 0;
let cooldownTimerInterval = null;
let cooldownTimerSeconds = 0;

function detectCoolDownType() {
  const session = getTodaySession();
  if (!session || !session.workoutName) return "Push";
  const name = session.workoutName.toLowerCase();
  if (name.includes("push") || name.includes("chest") || name.includes("shoulder") || name.includes("triceps")) return "Push";
  if (name.includes("pull") || name.includes("back") || name.includes("biceps")) return "Pull";
  if (name.includes("leg") || name.includes("squat") || name.includes("lower")) return "Legs";
  return "Push";
}

function getCoolDownRoutine() {
  const type = detectCoolDownType();
  return COOLDOWN_ROUTINES[type] || COOLDOWN_ROUTINES["Push"];
}

function openCoolDown() {
  const type = detectCoolDownType();
  const routine = getCoolDownRoutine();
  const session = getTodaySession();
  document.getElementById("cdWorkoutInfo").textContent = session ? `${session.workoutName || "Workout"} · ${session.exercises.length} exercises` : "";
  document.getElementById("cdRoutineTitle").textContent = `Cool Down (${type})`;
  document.getElementById("cdRoutineList").innerHTML = routine
    .map(
      (ex) =>
        `<div style="display:flex;justify-content:space-between;padding:0.25rem 0"><span>${ex.name}</span><span style="color:var(--text-secondary)">${ex.reps}</span></div>`,
    )
    .join("");
  document.getElementById("cdStartBtn").onclick = () => {
    document.getElementById("cooldownReminderModal").classList.add("is-hidden");
    openCooldownTimer(type);
  };
  document.getElementById("cdSkipBtn").onclick = () => {
    document.getElementById("cooldownReminderModal").classList.add("is-hidden");
    finishWorkoutComplete();
  };
  document.getElementById("cooldownReminderModal").classList.remove("is-hidden");
}

function openCooldownTimer(type) {
  const routine = COOLDOWN_ROUTINES[type] || COOLDOWN_ROUTINES["Push"];
  document.getElementById("ctExerciseList").textContent = routine.map((ex) => ex.name).join(" · ");
  cooldownTimerSeconds = 5 * 60;
  updateCooldownTimerDisplay();
  document.getElementById("cooldownTimerModal").classList.remove("is-hidden");
  startCooldownTimer();
  document.getElementById("ctPauseBtn").onclick = () => {
    if (cooldownTimerInterval) {
      clearInterval(cooldownTimerInterval);
      cooldownTimerInterval = null;
      document.getElementById("ctPauseBtn").textContent = "Resume";
    } else {
      startCooldownTimer();
      document.getElementById("ctPauseBtn").textContent = "Pause";
    }
  };
  document.getElementById("ctSkipBtn").onclick = () => {
    stopCooldownTimer();
    document.getElementById("cooldownTimerModal").classList.add("is-hidden");
    finishWorkoutComplete();
  };
  document.getElementById("ctFinishBtn").onclick = () => {
    stopCooldownTimer();
    document.getElementById("cooldownTimerModal").classList.add("is-hidden");
    finishWorkoutComplete();
  };
}

function startCooldownTimer() {
  if (cooldownTimerInterval) clearInterval(cooldownTimerInterval);
  cooldownTimerInterval = setInterval(() => {
    cooldownTimerSeconds--;
    if (cooldownTimerSeconds <= 0) {
      cooldownTimerSeconds = 0;
      stopCooldownTimer();
    }
    updateCooldownTimerDisplay();
  }, 1000);
}

function stopCooldownTimer() {
  if (cooldownTimerInterval) {
    clearInterval(cooldownTimerInterval);
    cooldownTimerInterval = null;
  }
}

function updateCooldownTimerDisplay() {
  const m = Math.floor(cooldownTimerSeconds / 60);
  const s = cooldownTimerSeconds % 60;
  const el = document.getElementById("ctTimer");
  if (el) el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function finishWorkoutComplete() {
  const session = getTodaySession();
  if (session) {
    session.notes = document.getElementById("ssNotesInput")?.value || session.notes || "";
    saveState();
  }
  if (state.onboardingComplete) {
state.first7Days["day1Workout"] = true; saveState();
    checkFirst7DayProgress();
  }
  renderHome();
}

function detectWorkoutType(sessionOverride) {
  const session = sessionOverride || getTodaySession();
  if (!session || !session.workoutName) return "Full Body";
  const name = session.workoutName.toLowerCase();
  if (name.includes("push") || name.includes("chest") || name.includes("shoulder") || name.includes("triceps")) return "Push";
  if (name.includes("pull") || name.includes("back") || name.includes("biceps")) return "Pull";
  if (name.includes("leg") || name.includes("squat") || name.includes("lower")) return "Legs";
  return "Full Body";
}

function openWarmupReminder() {
  if (!state.warmupReminder) {
    startWorkoutDirectly();
    return;
  }
  const session = getTodaySession();
  if (!session) {
    startWorkoutDirectly();
    return;
  }
  if (session.warmupDone) {
    startWorkoutDirectly();
    return;
  }
  const type = detectWorkoutType();
  const routine = WARMUP_ROUTINES[type] || WARMUP_ROUTINES["Full Body"];
  document.getElementById("wrmWorkoutInfo").textContent = `${session.workoutName || "Workout"} · ${session.exercises.length} exercises`;
  document.getElementById("wrmRoutineTitle").textContent = `Recommended Warm-Up (${type})`;
  document.getElementById("wrmRoutineList").innerHTML = routine
    .map(
      (ex) =>
        `<div style="display:flex;justify-content:space-between;padding:0.25rem 0"><span>${ex.name}</span><span style="color:var(--text-secondary)">${ex.reps}</span></div>`,
    )
    .join("");
  document.getElementById("wrmStartBtn").onclick = () => {
    document.getElementById("warmupReminderModal").classList.add("is-hidden");
    openWarmupTimer(type);
  };
  document.getElementById("wrmSkipBtn").onclick = () => {
    document.getElementById("warmupReminderModal").classList.add("is-hidden");
    if (session) {
      session.warmupDone = false;
      saveState();
    }
    showScreen("screen-ws");
    renderWorkoutSession();
  };
  document.getElementById("warmupReminderModal").classList.remove("is-hidden");
}

function startWorkoutDirectly() {
  showScreen("screen-ws");
  renderWorkoutSession();
}

function openWarmupTimer(type) {
  const routine = WARMUP_ROUTINES[type] || WARMUP_ROUTINES["Full Body"];
  document.getElementById("wtExerciseList").textContent = routine.map((ex) => ex.name).join(" · ");
  warmupTimerSeconds = 4 * 60;
  updateWarmupTimerDisplay();
  document.getElementById("warmupTimerModal").classList.remove("is-hidden");
  startWarmupTimer();
  document.getElementById("wtPauseBtn").onclick = () => {
    if (warmupTimerInterval) {
      clearInterval(warmupTimerInterval);
      warmupTimerInterval = null;
      document.getElementById("wtPauseBtn").textContent = "Resume";
    } else {
      startWarmupTimer();
      document.getElementById("wtPauseBtn").textContent = "Pause";
    }
  };
  document.getElementById("wtSkipBtn").onclick = () => {
    stopWarmupTimer();
    document.getElementById("warmupTimerModal").classList.add("is-hidden");
    const session = getTodaySession();
    if (session) {
      session.warmupDone = false;
      saveState();
    }
    showScreen("screen-ws");
    renderWorkoutSession();
  };
  document.getElementById("wtFinishBtn").onclick = () => {
    stopWarmupTimer();
    document.getElementById("warmupTimerModal").classList.add("is-hidden");
    const session = getTodaySession();
    if (session) {
      session.warmupDone = true;
      saveState();
    }
    showScreen("screen-ws");
    renderWorkoutSession();
  };
}

function startWarmupTimer() {
  if (warmupTimerInterval) clearInterval(warmupTimerInterval);
  warmupTimerInterval = setInterval(() => {
    warmupTimerSeconds--;
    if (warmupTimerSeconds <= 0) {
      warmupTimerSeconds = 0;
      stopWarmupTimer();
    }
    updateWarmupTimerDisplay();
  }, 1000);
}

function stopWarmupTimer() {
  if (warmupTimerInterval) {
    clearInterval(warmupTimerInterval);
    warmupTimerInterval = null;
  }
}

function updateWarmupTimerDisplay() {
  const m = Math.floor(warmupTimerSeconds / 60);
  const s = warmupTimerSeconds % 60;
  document.getElementById("wtTimer").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ===== EVENT LISTENERS: EXERCISE ANALYTICS =====
document.getElementById("eaBackBtn").addEventListener("click", () => {
  if (analyticsChart) {
    analyticsChart.destroy();
    analyticsChart = null;
  }
  activateTab("progress");
});
document.getElementById("eaTabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".ea-tab");
  if (!tab) return;
  renderExerciseAnalyticsTab(tab.dataset.eaTab);
});

// ===== PR TOAST =====
document.getElementById("prToastDismiss")?.addEventListener("click", () => {
  document.getElementById("prToast").classList.add("is-hidden");
});

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  enrichExerciseLib();
  document.querySelectorAll(".nav-tab").forEach((b) => {
    b.addEventListener("click", () => activateTab(b.dataset.tab));
  });
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.addEventListener("click", () => activateTab(b.dataset.tab));
  });

  // Adaptive nav bar on scroll
  let navScrollTimer;
  const mainArea = document.querySelector(".main-area");
  if (mainArea) {
    mainArea.addEventListener("scroll", () => {
      clearTimeout(navScrollTimer);
      const nav = document.getElementById("bottomNav");
      if (mainArea.scrollTop > 20) {
        nav.classList.add("nav-is-compact");
      } else {
        nav.classList.remove("nav-is-compact");
      }
      navScrollTimer = setTimeout(() => {
        if (mainArea.scrollTop <= 20) nav.classList.remove("nav-is-compact");
      }, 1500);
    });
  }

  activateTab("sets");
  render();

  const todaySession = getTodaySession();
  if (todaySession && todaySession.exercises.some((e) => e.sets.some((s) => s.done))) {
    currentWorkoutId = todaySession.workoutId || null;
    startStopwatch();
    renderSetsPanel();
  }

  // Check onboarding
  if (!state.onboardingComplete) {
    if (!state.user) {
      state.user = {};
      saveState();
    }
    openOnboarding(true);
  }

  // Check first 7 days progress
  if (state.onboardingComplete) {
    checkFirst7DayProgress();
  }

  // Apply persisted settings
  if (state.theme) {
    let t = state.theme.toLowerCase();
    if (t === "system") t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);
  }
  if (state.accent) document.documentElement.setAttribute("data-accent", state.accent.toLowerCase());
  if (state.fontSize) document.documentElement.setAttribute("data-font-size", state.fontSize.toLowerCase());
  if (state.focusMode) document.documentElement.classList.add("focus-mode");
  if (state.screenAwake) requestWakeLock();

  requestNotificationPermission();
  checkReminders();

  // Auto-generate weekly report on Sunday
  const todayDay = new Date().getDay();
  if (todayDay === 0) {
    const weekKey = getCurrentWeekKey();
    const existing = getWeeklyReport(weekKey);
    if (!existing) {
      const coach = CoachEngine.runAll();
      const rep = coach.reports.weekly;
      saveWeeklyReport(rep);
    }
  }

  // Exit protection while workout is active
  window.addEventListener("beforeunload", (e) => {
    const hasActive = state.sessions && state.sessions.some(s => !s.finishedAt);
    if (hasActive) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const hasActive = state.sessions && state.sessions.some(s => !s.finishedAt);
      if (hasActive) {
        localStorage.setItem("wt_autosave", JSON.stringify(state));
      }
    }
  });

  // History back protection
  window.addEventListener("popstate", (e) => {
    const hasActive = state.sessions && state.sessions.some(s => !s.finishedAt);
    if (hasActive) {
      e.preventDefault();
      if (!confirm("You have an active workout. Are you sure you want to leave?")) {
        history.pushState(null, "", location.href);
      }
    }
  });
});

// ===== WEIGHT BOTTOM SHEET =====
document.addEventListener("click", (e) => {
  const editBtn = e.target.closest("#snapshotEditBtn");
  if (editBtn) {
    const entry = latestWeight();
    document.getElementById("wlSheetWeight").value = entry ? entry.weight : "";
    updateWeightDisplay();
    document.getElementById("weightLogSheet").classList.remove("is-hidden");
    setTimeout(() => document.getElementById("wlSheetWeight").select(), 150);
  }
  const goalEditBtn = e.target.closest("#bodyEditGoalBtn");
  if (goalEditBtn) {
    openGoalSelector();
  }

  // Trainer: problem card click
  const problemCard = e.target.closest("[data-problem-id]");
  if (problemCard && document.getElementById("trainerPageContent")?.contains(problemCard)) {
    const id = problemCard.dataset.problemId;
    const problem = PROBLEM_DATABASE.find(p => p.id === id);
    if (problem) renderProblemDetail(id);
    return;
  }

  // Trainer: View All Problems button
  if (e.target.closest("#viewAllProblemsBtn")) {
    showTrainerScreen("problems");
    return;
  }

  // Trainer: exercise card click (EE)
  const eeCard = e.target.closest("[data-ee-id]");
  if (eeCard && document.getElementById("trainerPageContent")?.contains(eeCard)) {
    const id = eeCard.dataset.eeId;
    const ex = getExerciseById(id);
    if (ex) renderExerciseDetailPage(id);
    return;
  }
});
function updateWeightDisplay() {
  const input = document.getElementById("wlSheetWeight");
  const val = Number(input.value) || 0;
  document.getElementById("wlDisplay").textContent = val > 0 ? val + " kg" : "—";
  document.getElementById("wlSave").disabled = !(val > 0);
}

document.getElementById("wlOverlay")?.addEventListener("click", () => {
  document.getElementById("weightLogSheet").classList.add("is-hidden");
});
document.getElementById("wlCancel")?.addEventListener("click", () => {
  document.getElementById("weightLogSheet").classList.add("is-hidden");
});
document.getElementById("wlSave")?.addEventListener("click", () => {
  const w = Number(document.getElementById("wlSheetWeight").value);
  if (!w) return;
  if (w <= 20 || w >= 300) {
    showToast("Please enter a valid weight.");
    return;
  }
  saveBodyLogEntry({ date: getDateKey(), weight: w });
  document.getElementById("weightLogSheet").classList.add("is-hidden");
  renderHome();
  showToast("Weight Updated");
});
document.getElementById("wlPlus")?.addEventListener("click", () => {
  const input = document.getElementById("wlSheetWeight");
  const val = Number(input.value) || 0;
  input.value = (val + 1).toFixed(1);
  updateWeightDisplay();
});
document.getElementById("wlMinus")?.addEventListener("click", () => {
  const input = document.getElementById("wlSheetWeight");
  const val = Number(input.value) || 0;
  if (val > 0) input.value = Math.max(20, val - 1).toFixed(1);
  updateWeightDisplay();
});
document.getElementById("wlDisplay")?.addEventListener("click", () => {
  const input = document.getElementById("wlSheetWeight");
  input.classList.add("is-active");
  input.value = document.getElementById("wlDisplay").textContent.replace(" kg", "");
  input.focus();
  input.select();
});
document.getElementById("wlSheetWeight")?.addEventListener("blur", () => {
  document.getElementById("wlSheetWeight").classList.remove("is-active");
  updateWeightDisplay();
});
document.getElementById("wlSheetWeight")?.addEventListener("input", (e) => {
  const val = Number(e.target.value);
  if (val < 0) e.target.value = 0;
  updateWeightDisplay();
});
document.getElementById("wlSheetWeight")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.target.blur();
    document.getElementById("wlSave").click();
  }
});

// ===== STREAK DRAWER =====
document.getElementById("sdOverlay")?.addEventListener("click", () => {
  document.getElementById("streakDrawer").classList.add("is-hidden");
});
document.getElementById("sdClose")?.addEventListener("click", () => {
  document.getElementById("streakDrawer").classList.add("is-hidden");
});

// ===== CALENDAR DATE SHEET =====
document.getElementById("cdsOverlay")?.addEventListener("click", () => {
  document.getElementById("calendarDateSheet").classList.add("is-hidden");
});
document.getElementById("cdsCloseBtn")?.addEventListener("click", () => {
  document.getElementById("calendarDateSheet").classList.add("is-hidden");
});

// (Muscle search removed — no longer needed)

// ===== SMART WORKOUT GENERATOR =====

// --- Goal/Experience metadata ---
const GOAL_META = {
  "Muscle Gain": { icon: "💪", desc: "Build size and definition with moderate-heavy weights and moderate reps.", short: "Build muscle size" },
  "Fat Loss": { icon: "🔥", desc: "Burn fat with higher reps, shorter rest, and metabolic conditioning.", short: "Burn fat & tone" },
  Strength: { icon: "🏋️", desc: "Build raw strength with heavy compound lifts and low reps.", short: "Get stronger" },
  "General Fitness": { icon: "⭐", desc: "Balanced approach for overall health, endurance, and body composition.", short: "Overall fitness" },
  Endurance: { icon: "🏃", desc: "Build muscular endurance with high reps and minimal rest.", short: "Build endurance" },
};

const EXP_META = {
  Beginner: { desc: "New to training or returning after a long break. Focus on form and consistency.", short: "New to training" },
  Intermediate: { desc: "6+ months of consistent training. Ready for progressive overload and specialization.", short: "Some experience" },
  Advanced: { desc: "1+ year of dedicated training. Need structured periodization and advanced techniques.", short: "Experienced lifter" },
};

// --- Recommendation Engine ---
const SPLIT_RECOMMENDATIONS = {
  "Push Pull Legs": {
    recommendedFor: ["Muscle Gain", "Strength"],
    score: { "Muscle Gain": 95, Strength: 88, "Fat Loss": 72, Endurance: 68, "General Fitness": 76 },
    desc: "Each muscle group gets dedicated attention with 48h recovery.",
  },
  "Upper Lower": {
    recommendedFor: ["Strength", "Muscle Gain"],
    score: { "Muscle Gain": 85, Strength: 93, "Fat Loss": 78, Endurance: 72, "General Fitness": 82 },
    desc: "Balanced frequency with adequate recovery. Great for strength and muscle balance.",
  },
  "Full Body": {
    recommendedFor: ["Fat Loss", "General Fitness", "Endurance"],
    score: { "Muscle Gain": 65, Strength: 70, "Fat Loss": 92, Endurance: 88, "General Fitness": 90 },
    desc: "Maximum frequency per muscle group. Best for fat loss, endurance, and overall fitness.",
  },
};

const SPLIT_ORDER = ["Push Pull Legs", "Upper Lower", "Full Body"];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTrainingDayIndices(totalDays) {
  const map = {
    3: [0, 2, 4],
    4: [0, 2, 4, 6],
    5: [0, 1, 3, 4, 6],
    6: [0, 1, 2, 3, 4, 5],
  };
  return map[totalDays] || [0, 2, 4];
}

const EX_COUNT_RANGE = {
  Beginner: { min: 4, max: 5 },
  Intermediate: { min: 5, max: 7 },
  Advanced: { min: 6, max: 8 },
};

const EXP_SETS = {
  Beginner: 3,
  Intermediate: 4,
  Advanced: 5,
};

const GOAL_REPS = {
  "Muscle Gain": { compound: 8, isolation: 12 },
  "Fat Loss": 12,
  Strength: 5,
  "General Fitness": 10,
  Endurance: 15,
};

const GOAL_RATIOS = {
  "Muscle Gain": { compound: 0.6, isolation: 0.4, conditioning: 0 },
  "Fat Loss": { compound: 0.8, isolation: 0.2, conditioning: 0 },
  Strength: { compound: 0.9, isolation: 0.1, conditioning: 0 },
  "General Fitness": { compound: 0.5, isolation: 0.3, conditioning: 0.2 },
  Endurance: { compound: 0.4, isolation: 0, conditioning: 0.6 },
};

const RECOVERY_TIPS = [
  { title: "Brisk Walk", icon: "🚶", desc: "20-30 min walk to promote blood flow and reduce soreness." },
  { title: "Full Body Stretch", icon: "🧘", desc: "15-20 min stretching focusing on worked muscle groups." },
  { title: "Mobility Work", icon: "🤸", desc: "10-15 min joint mobility and range of motion drills." },
  { title: "Foam Rolling", icon: "🔄", desc: "10-15 min self-myofascial release for tight areas." },
  { title: "Light Cardio", icon: "🏃", desc: "15-20 min light jog, cycle, or elliptical work." },
];

const FULL_BODY_CATEGORIES = [
  ["Chest", "Back", "Legs", "Shoulders"],
  ["Back", "Legs", "Chest", "Abs"],
  ["Shoulders", "Legs", "Chest", "Biceps", "Triceps"],
  ["Chest", "Back", "Legs", "Abs"],
  ["Legs", "Shoulders", "Back", "Chest"],
  ["Full Body", "Chest", "Back", "Legs"],
];

const CATEGORY_MAP = {
  Push: ["Chest", "Shoulders", "Triceps"],
  Pull: ["Back", "Biceps", "Forearms"],
  Legs: ["Legs", "Glutes", "Calves"],
  Upper: ["Chest", "Shoulders", "Back", "Biceps", "Triceps"],
  Lower: ["Legs", "Glutes", "Calves"],
};

const SPLIT_ROTATION = {
  "Push Pull Legs": ["Push", "Pull", "Legs"],
  "Upper Lower": ["Upper", "Lower"],
};

function getSplitDayName(split, dayIndex) {
  if (split === "Full Body") {
    const variants = ["A", "B", "C", "D", "E", "F"];
    return "Full Body " + variants[dayIndex % variants.length];
  }
  const rot = SPLIT_ROTATION[split] || ["Full Body"];
  return rot[dayIndex % rot.length];
}

function getCategoriesForDay(splitDay) {
  if (!splitDay.startsWith("Full Body")) return CATEGORY_MAP[splitDay] || ["Full Body"];
  const idx = splitDay === "Full Body" ? 0 : parseInt(splitDay.slice(-1), 36) - 10;
  return FULL_BODY_CATEGORIES[idx] || FULL_BODY_CATEGORIES[0];
}

const TIME_META = {
  "30-45": { label: "30-45 Minutes", short: "Quick sessions", icon: "⚡" },
  "45-60": { label: "45-60 Minutes", short: "Standard sessions", icon: "🕐" },
  "60-75": { label: "60-75 Minutes", short: "Extended sessions", icon: "🕑" },
  "75-90": { label: "75-90 Minutes", short: "Full sessions", icon: "🕒" },
};

const PRIORITY_META = {
  none: { label: "None", desc: "Balanced training across all muscles." },
  chest: { label: "Chest", desc: "Add extra chest volume each week." },
  back: { label: "Back", desc: "Add extra back volume each week." },
  shoulders: { label: "Shoulders", desc: "Add extra shoulder volume each week." },
  arms: { label: "Arms", desc: "Add extra arm volume each week." },
  legs: { label: "Legs", desc: "Add extra leg volume each week." },
  glutes: { label: "Glutes", desc: "Add extra glute volume each week." },
};

const PRIORITY_MUSCLE_TAGS = {
  chest: "Chest",
  back: "Back",
  shoulders: "Front Delts",
  arms: "Biceps",
  legs: "Quads",
  glutes: "Glutes",
};

const EQUIPMENT_META = {
  "full-gym": { label: "Full Gym", desc: "Barbells, dumbbells, cables, and machines." },
  "home-gym": { label: "Home Gym", desc: "Dumbbells, bench, bands, pull-up bar." },
  "dumbbells-only": { label: "Dumbbells Only", desc: "Adjustable or fixed dumbbells." },
  "bodyweight-only": { label: "Bodyweight Only", desc: "No equipment required." },
};

const LIMITATION_META = {
  none: { label: "None", desc: "Full range of motion available." },
  shoulder: { label: "Shoulder", desc: "Avoid overhead pressing, upright rows, behind-neck." },
  knee: { label: "Knee", desc: "Avoid deep squats, lunges, leg extensions." },
  "lower-back": { label: "Lower Back", desc: "Avoid deadlifts, good mornings, heavy squats." },
};

const SPLIT_BY_EXP = {
  Beginner: { 3: "Full Body", 4: "Upper Lower", 5: "Upper Lower", 6: "Upper Lower" },
  Intermediate: { 3: "Full Body", 4: "Upper Lower", 5: "Upper Lower", 6: "Push Pull Legs" },
  Advanced: { 3: "Full Body", 4: "Upper Lower", 5: "Push Pull Legs", 6: "Push Pull Legs" },
};

const EQUIPMENT_ALLOWED = {
  "full-gym": null,
  "home-gym": ["Barbell", "Dumbbell", "Bodyweight", "Resistance Band", "Pull-up Bar", "EZ Bar", "Kettlebell"],
  "dumbbells-only": ["Dumbbell"],
  "bodyweight-only": ["Bodyweight"],
};

const EXERCISES_TO_AVOID = {
  shoulder: ["upright-row", "behind-neck-press", "dip", "dips", "barbell-overhead-press", "arnold-press", "plate-front-raise"],
  knee: ["barbell-squat", "dumbbell-lunge", "leg-extension", "bulgarian-split-squat", "barbell-lunge", "jump-squat", "box-jump"],
  "lower-back": ["barbell-deadlift", "good-morning", "barbell-squat", "barbell-good-morning", "stiff-leg-deadlift", "t-bar-row"],
  wrist: ["barbell-curl", "ez-bar-curl", "barbell-wrist-curl", "push-ups", "dumbbell-curl", "incline-curl"],
  hip: ["barbell-squat", "barbell-lunge", "dumbbell-lunge", "bulgarian-split-squat", "hip-thrust", "cable-pull-through"],
  neck: ["barbell-shrug", "dumbbell-shrug", "behind-neck-press", "barbell-good-morning"],
  ankle: ["barbell-squat", "dumbbell-lunge", "barbell-lunge", "jump-squat", "box-jump"],
  elbow: ["barbell-curl", "ez-bar-curl", "dumbbell-curl", "tricep-dip", "tricep-extension", "push-down", "skull-crusher"],
};

// --- Generator State ---
const genState = { step: 1, goal: null, experience: null, days: null, time: null, priority: "none", equipment: "full-gym", limitation: "none", split: null, schedule: null };

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function filterByEquipment(exercises, equipment) {
  const allowed = EQUIPMENT_ALLOWED[equipment];
  if (!allowed) return exercises;
  return exercises.filter(function(e) { return allowed.includes(e.equipment); });
}

function filterByLimitation(exercises, limitations) {
  if (!limitations || (Array.isArray(limitations) && limitations.length === 0) || limitations === "none") return exercises;
  const limits = Array.isArray(limitations) ? limitations : [limitations];
  const avoidAll = new Set();
  limits.forEach(function(lim) {
    const list = EXERCISES_TO_AVOID[lim];
    if (list) list.forEach(function(id) { avoidAll.add(id); });
  });
  if (avoidAll.size === 0) return exercises;
  return exercises.filter(function(e) { return !avoidAll.has(e.id); });
}


function isCompound(exName) {
  return COMPOUND_EXERCISE_NAMES.has(exName);
}

function isConditioning(ex) {
  return ex.tags && (ex.tags.includes("conditioning") || ex.tags.includes("cardio") || ex.tags.includes("bodyweight") && !isCompound(ex.name));
}

function getRepTarget(goal, exName) {
  const reps = GOAL_REPS[goal];
  if (!reps) return 10;
  if (typeof reps === "number") return reps;
  if (isCompound(exName)) return reps.compound || 8;
  return reps.isolation || 12;
}

function scoreExercise(ex, goal, usedInCycle) {
  const isComp = isCompound(ex.name);
  const isCond = isConditioning(ex);
  const equipment = ex.equipment.toLowerCase();
  let score = 0;

  switch (goal) {
    case "Muscle Gain":
      if (isComp) score += 50;
      else score += 30;
      if (equipment === "barbell") score += 20;
      else if (equipment === "dumbbell") score += 18;
      else if (equipment === "cable") score += 15;
      else if (equipment === "machine") score += 12;
      if (ex.tags && ex.tags.includes("compound")) score += 15;
      if (isCond) score -= 30;
      break;
    case "Strength":
      if (isComp) score += 60;
      else score += 5;
      if (equipment === "barbell") score += 25;
      else if (equipment === "dumbbell") score += 10;
      if (ex.tags && ex.tags.includes("compound")) score += 20;
      if (isCond) score -= 50;
      break;
    case "Fat Loss":
      if (isComp) score += 40;
      else score += 20;
      if (equipment === "bodyweight") score += 25;
      else if (equipment === "kettlebell") score += 20;
      else if (equipment === "dumbbell") score += 15;
      else if (equipment === "barbell") score += 10;
      if (ex.tags && ex.tags.includes("compound")) score += 10;
      if (isCond) score += 15;
      break;
    case "Endurance":
      if (isComp) score += 20;
      else score += 30;
      if (equipment === "bodyweight") score += 30;
      else if (equipment === "kettlebell") score += 20;
      if (isCond) score += 30;
      break;
    default: // General Fitness
      if (isComp) score += 35;
      else score += 25;
      if (equipment === "dumbbell") score += 15;
      else if (equipment === "bodyweight") score += 15;
      else if (equipment === "barbell") score += 10;
      if (isCond) score += 10;
  }

  if (usedInCycle && usedInCycle.has(ex.name)) score -= 40;
  return Math.max(0, score);
}

function filterByExperience(candidates, experience) {
  if (experience === "Beginner") {
    return candidates.filter(e => {
      if (["Deadlift", "Power Clean", "Snatch", "Clean and Press", "Barbell Squat"].includes(e.name)) return false;
      if (e.equipment === "Barbell" && !["Barbell Row", "Barbell Curl", "Barbell Bench Press", "Overhead Press"].includes(e.name)) return false;
      return true;
    });
  }
  if (experience === "Advanced") {
    return candidates;
  }
  // Intermediate: exclude only the most complex
  return candidates.filter(e => !["Power Clean", "Snatch"].includes(e.name));
}

function selectExercisesForDay(goal, experience, splitDay, usedInCycle, equipment, limitation, priority) {
  const categories = getCategoriesForDay(splitDay);
  let candidates = EXERCISE_LIBRARY.filter(function(e) { return categories.includes(e.category); });
  candidates = filterByExperience(candidates, experience);
  candidates = filterByEquipment(candidates, equipment);
  candidates = filterByLimitation(candidates, limitation);
  const scored = candidates.map(function(e) { return { exercise: e, score: scoreExercise(e, goal, usedInCycle) }; });
  scored.sort(function(a, b) { return b.score - a.score || Math.random() - 0.5; });

  const range = EX_COUNT_RANGE[experience] || EX_COUNT_RANGE.Intermediate;
  const count = Math.min(randInt(range.min, range.max), scored.length);
  const ratios = GOAL_RATIOS[goal] || GOAL_RATIOS["General Fitness"];

  var compounds = scored.filter(function(s) { return isCompound(s.exercise.name) && s.score > 0; });
  var isolations = scored.filter(function(s) { return !isCompound(s.exercise.name) && !isConditioning(s.exercise) && s.score > 0; });
  var conditioningPool = EXERCISE_LIBRARY.filter(function(e) { return isConditioning(e); });
  conditioningPool = filterByExperience(conditioningPool, experience);
  conditioningPool = filterByEquipment(conditioningPool, equipment);
  conditioningPool = filterByLimitation(conditioningPool, limitation);
  var conditioning = conditioningPool
    .map(function(e) { return { exercise: e, score: scoreExercise(e, goal, usedInCycle) }; })
    .filter(function(s) { return s.score > 0; })
    .sort(function(a, b) { return b.score - a.score || Math.random() - 0.5; });

  const nComp = Math.round(count * ratios.compound);
  const nIso = Math.round(count * ratios.isolation);
  const nCond = count - nComp - nIso;

  const pick = function(arr, n) {
    const result = [];
    const pool = [].concat(arr);
    for (var i = 0; i < n && pool.length > 0; i++) {
      result.push(pool.shift());
    }
    return result;
  };

  const picked = [].concat(
    pick(compounds, nComp),
    pick(isolations, nIso),
    pick(conditioning, nCond)
  );

  var sets = EXP_SETS[experience] || EXP_SETS.Intermediate;

  // Priority muscle: add 2 extra sets to matching exercises
  var priorityTag = priority && priority !== "none" ? PRIORITY_MUSCLE_TAGS[priority] : null;
  var result = picked.map(function(s) {
    var finalSets = sets;
    if (priorityTag && (s.exercise.primaryMuscle === priorityTag || (s.exercise.secondaryMuscles || []).indexOf(priorityTag) >= 0)) {
      finalSets = sets + 2;
    }
    var repVal = getRepTarget(goal, s.exercise.name);
    if (typeof finalSets !== "number" || isNaN(finalSets)) finalSets = sets;
    if (typeof repVal !== "number" || isNaN(repVal)) repVal = 10;
    return {
      name: s.exercise.name,
      sets: finalSets,
      reps: repVal,
      category: s.exercise.category,
      weight: "",
    };
  });

  return result;
}

function generateWeeklySchedule(goal, experience, split, days, time, priority, equipment, limitation) {
  const indices = getTrainingDayIndices(days);
  const cycle = split === "Push Pull Legs" ? ["Push", "Pull", "Legs"] : split === "Upper Lower" ? ["Upper", "Lower"] : [];
  const usedInCycle = new Set();
  const schedule = [];
  for (let d = 0; d < 7; d++) {
    if (indices.includes(d)) {
      const dayIdx = indices.indexOf(d);
      const splitDay = getSplitDayName(split, dayIdx);
      // Reset usedInCycle when a new cycle begins
      if (cycle.length > 0 && dayIdx > 0 && splitDay === cycle[0]) usedInCycle.clear();
      const exercises = selectExercisesForDay(goal, experience, splitDay, usedInCycle, equipment, limitation, priority);
      exercises.forEach(ex => usedInCycle.add(ex.name));
      schedule.push({ day: d, type: "workout", name: splitDay, exercises });
    } else {
      const tip = RECOVERY_TIPS[d % RECOVERY_TIPS.length];
      schedule.push({ day: d, type: "recovery", title: tip.title, icon: tip.icon, desc: tip.desc });
    }
  }
  return schedule;
}

function getSplitScore(splitName, goal) {
  return SPLIT_RECOMMENDATIONS[splitName]?.score?.[goal] || 0;
}

function getSortedSplits(goal) {
  return SPLIT_ORDER.map(s => ({ name: s, score: getSplitScore(s, goal), rec: SPLIT_RECOMMENDATIONS[s] }))
    .sort((a, b) => b.score - a.score);
}

// --- NEW Step Renderers (Premium Guided Flow) ---
const GN_TOTAL_STEPS = 11;
const GN_TITLES = {
  1: { title: "Where do you train?", desc: "Select your training environment" },
  2: { title: "Available Equipment", desc: "What equipment do you have access to?" },
  3: { title: "Workout Days", desc: "How many days per week can you train?" },
  4: { title: "Workout Duration", desc: "How long per session?" },
  5: { title: "Primary Goal", desc: "What's your main fitness focus?" },
  6: { title: "Split Preference", desc: "How should your workouts be structured?" },
  7: { title: "Muscle Priority", desc: "Any muscle group you want to emphasize?" },
  8: { title: "Weak Areas", desc: "Any areas you'd like to bring up? (optional)" },
  9: { title: "Injuries", desc: "Any injuries or limitations? (optional)" },
  10: { title: "Cardio", desc: "How much cardio do you want included?" },
  11: { title: "Your Program", desc: "Review and generate your personalized plan" },
};

function gnUpdateNav(step) {
  const pct = (step / GN_TOTAL_STEPS * 100);
  document.getElementById("gmProgressFill").style.width = pct + "%";
  document.getElementById("gmStepBadge").textContent = "Step " + step + " of " + GN_TOTAL_STEPS;
  const timeLabels = ["About 2 min", "About 2 min", "About 90s", "About 75s", "About 60s", "About 50s", "About 40s", "About 30s", "About 20s", "About 10s", "Almost done!"];
  document.getElementById("gmTimeLabel").textContent = timeLabels[step - 1] || "";
  const info = GN_TITLES[step];
  if (info) {
    document.getElementById("gmStepTitle").textContent = info.title;
    document.getElementById("gmStepDesc").textContent = info.desc;
  }
  document.getElementById("gmBackBtn").style.display = step === 1 ? "none" : "";
  const nextBtn = document.getElementById("gmNextBtn");
  nextBtn.textContent = step === GN_TOTAL_STEPS ? "Generate My Program" : "Continue";
  nextBtn.disabled = false;
}

function gnRenderLocation() {
  const body = document.getElementById("gmBody");
  const locs = [
    { id: "gym", icon: "🏋️", title: "Gym", desc: "Machines · Free Weights · Cables" },
    { id: "home", icon: "🏠", title: "Home", desc: "Dumbbells · Bands · Bodyweight" },
    { id: "hybrid", icon: "⚡", title: "Hybrid", desc: "Both Gym and Home" },
  ];
  const active = genState.trainingLocation || "";
  body.innerHTML = `<div class="gn-location-grid">${locs.map(l =>
    `<button class="gn-location-card${active === l.id ? " is-active" : ""}" data-gn-loc="${l.id}">
      <div class="gn-loc-icon">${l.icon}</div>
      <div class="gn-loc-title">${l.title}</div>
      <div class="gn-loc-desc">${l.desc}</div>
    </button>`
  ).join("")}</div>`;
  body.querySelectorAll(".gn-location-card").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gn-location-card").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.trainingLocation = el.dataset.gnLoc;
      genState.equipment = null;
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderEquipment() {
  const body = document.getElementById("gmBody");
  const loc = genState.trainingLocation;
  if (loc === "home") {
    const options = [
      { id: "bodyweight-only", icon: "🤸", label: "Bodyweight Only", desc: "No equipment needed" },
      { id: "bands", icon: "💪", label: "Resistance Bands", desc: "Various resistance levels" },
      { id: "dumbbells", icon: "🏋️", label: "Adjustable Dumbbells", desc: "Up to 50kg each" },
      { id: "full-home", icon: "🏠", label: "Full Home Gym", desc: "Bench, pull-up bar, kettlebells" },
    ];
    const selected = genState.equipmentLevel || [];
    body.innerHTML = `<div class="gn-chips">${options.map(o =>
      `<button class="gn-chip${selected.includes(o.id) ? " is-active" : ""}" data-gn-eq="${o.id}">
        <span class="gn-chip-icon">${o.icon}</span> ${o.label}
      </button>`
    ).join("")}</div>
    <div style="margin-top:0.75rem;font-size:0.78rem;color:var(--text-tertiary)">Select all that apply</div>`;
    body.querySelectorAll(".gn-chip").forEach(el => {
      el.addEventListener("click", () => {
        el.classList.toggle("is-active");
        genState.equipmentLevel = [...body.querySelectorAll(".gn-chip.is-active")].map(c => c.dataset.gnEq);
        document.getElementById("gmNextBtn").disabled = genState.equipmentLevel.length === 0;
      });
    });
  } else {
    const options = [
      { id: "full-gym", icon: "🏛️", label: "Full Gym", desc: "Machines, free weights, cables, racks" },
      { id: "commercial", icon: "🏋️", label: "Commercial Gym", desc: "Standard commercial gym equipment" },
      { id: "apartment", icon: "🏢", label: "Apartment Gym", desc: "Limited machines, dumbbells up to 50kg" },
      { id: "limited", icon: "🎯", label: "Limited Equipment", desc: "Dumbbells, bench, basic gear" },
    ];
    const active = genState.equipmentLevel || "";
    body.innerHTML = `<div class="gn-options">${options.map(o =>
      `<button class="gn-option${active === o.id ? " is-active" : ""}" data-gn-eq="${o.id}">
        <div class="gn-option-icon">${o.icon}</div>
        <div class="gn-option-body">
          <div class="gn-option-title">${o.label}</div>
          <div class="gn-option-desc">${o.desc}</div>
        </div>
      </button>`
    ).join("")}</div>`;
    body.querySelectorAll(".gn-option").forEach(el => {
      el.addEventListener("click", () => {
        body.querySelectorAll(".gn-option").forEach(c => c.classList.remove("is-active"));
        el.classList.add("is-active");
        genState.equipmentLevel = el.dataset.gnEq;
        document.getElementById("gmNextBtn").disabled = false;
      });
    });
  }
}

function gnRenderDays() {
  const body = document.getElementById("gmBody");
  const days = [2, 3, 4, 5, 6];
  const labels = { 2: "Minimal", 3: "Standard", 4: "Frequent", 5: "Dedicated", 6: "Intensive" };
  const active = genState.days || "";
  body.innerHTML = `<div class="gn-day-grid">${days.map(d =>
    `<button class="gn-day-card${active === d ? " is-active" : ""}" data-gn-days="${d}">
      <div class="gn-day-num">${d}</div>
      <div class="gn-day-label">${labels[d]}</div>
    </button>`
  ).join("")}</div>`;
  body.querySelectorAll(".gn-day-card").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gn-day-card").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.days = parseInt(el.dataset.gnDays);
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderDuration() {
  const body = document.getElementById("gmBody");
  const durations = [30, 45, 60, 75, 90];
  const labels = { 30: "Quick", 45: "Standard", 60: "Extended", 75: "Full", 90: "Intensive" };
  const active = genState.duration || "";
  body.innerHTML = `<div class="gn-duration-grid">${durations.map(d =>
    `<button class="gn-duration-card${active === d ? " is-active" : ""}" data-gn-dur="${d}">
      <div class="gn-dur-num">${d}</div>
      <div class="gn-dur-label">${labels[d]} min</div>
    </button>`
  ).join("")}</div>`;
  body.querySelectorAll(".gn-duration-card").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gn-duration-card").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.duration = parseInt(el.dataset.gnDur);
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderGoal() {
  const body = document.getElementById("gmBody");
  const goals = [
    { id: "Fat Loss", icon: "🔥", label: "Fat Loss", desc: "Burn fat while preserving muscle", tag: "Popular" },
    { id: "Muscle Gain", icon: "💪", label: "Build Muscle", desc: "Increase size through progressive overload", tag: "" },
    { id: "Recomp", icon: "⚖️", label: "Body Recomposition", desc: "Lose fat and build muscle simultaneously", tag: "" },
    { id: "Strength", icon: "🏋️", label: "Strength", desc: "Increase your compound lifts", tag: "" },
    { id: "Athletic", icon: "🏃", label: "Athletic Performance", desc: "Improve speed, power, and agility", tag: "" },
    { id: "Endurance", icon: "❤️", label: "Endurance", desc: "Build stamina and conditioning", tag: "" },
  ];
  const active = genState.goal || "";
  body.innerHTML = `<div class="gn-options">${goals.map(g =>
    `<button class="gn-option${active === g.id ? " is-active" : ""}" data-gn-goal="${g.id}">
      <div class="gn-option-icon">${g.icon}</div>
      <div class="gn-option-body">
        <div class="gn-option-title">${g.label}</div>
        <div class="gn-option-desc">${g.desc}</div>
      </div>
      ${g.tag ? '<span class="ob-card-badge">' + g.tag + '</span>' : ""}
    </button>`
  ).join("")}</div>`;
  body.querySelectorAll(".gn-option").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gn-option").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.goal = el.dataset.gnGoal;
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderSplit() {
  const body = document.getElementById("gmBody");
  const splits = [
    { id: "Push Pull Legs", icon: "🔄", desc: "Dedicated push, pull, and leg days. Each muscle group gets 48h recovery.", tag: "Balanced" },
    { id: "Upper Lower", icon: "📈", desc: "Upper body one day, lower body the next. Great for strength.", tag: "Strength" },
    { id: "Full Body", icon: "🦾", desc: "Every muscle group each session. Maximum frequency.", tag: "Frequency" },
    { id: "Arnold", icon: "🏆", desc: "Chest & Back, Shoulders & Arms, Legs. Classic bodybuilding.", tag: "Bodybuilding" },
    { id: "Bro Split", icon: "💪", desc: "One muscle group per day. Maximum isolation focus.", tag: "Isolation" },
    { id: "Custom", icon: "✨", desc: "AI selects the optimal split based on your goal and experience.", tag: "Recommended" },
  ];
  const sorted = getSortedSplits(genState.goal);
  const recommended = sorted[0]?.name || "Push Pull Legs";
  if (!genState.split || genState.split === "AI Recommended") genState.split = recommended;
  body.innerHTML = `<div class="gn-options">${splits.map(s => {
    const active = genState.split === s.id ? " is-active" : "";
    const isRec = s.id === recommended;
    return `<button class="gn-option${active}" data-gn-split="${s.id}">
      <div class="gn-option-icon">${s.icon}</div>
      <div class="gn-option-body">
        <div class="gn-option-title">${s.id}</div>
        <div class="gn-option-desc">${s.desc}</div>
      </div>
      ${isRec ? '<span class="ob-card-badge">Best Match</span>' : '<span style="font-size:0.65rem;color:var(--text-tertiary)">' + s.tag + '</span>'}
    </button>`;
  }).join("")}</div>`;
  body.querySelectorAll(".gn-option").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gn-option").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.split = el.dataset.gnSplit;
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderPriority() {
  const body = document.getElementById("gmBody");
  const muscles = [
    { id: "none", label: "None (Balanced)", icon: "⚖️" },
    { id: "chest", label: "Chest", icon: "🏋️" },
    { id: "back", label: "Back", icon: "🔙" },
    { id: "shoulders", label: "Shoulders", icon: "🔺" },
    { id: "legs", label: "Legs", icon: "🦵" },
    { id: "arms", label: "Arms", icon: "💪" },
  ];
  const active = genState.priority || "none";
  body.innerHTML = `<div class="gn-chips">${muscles.map(m =>
    `<button class="gn-chip${active === m.id ? " is-active" : ""}" data-gn-pri="${m.id}">
      <span class="gn-chip-icon">${m.icon}</span> ${m.label}
    </button>`
  ).join("")}</div>`;
  body.querySelectorAll(".gn-chip").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gn-chip").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.priority = el.dataset.gnPri;
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderWeakAreas() {
  const body = document.getElementById("gmBody");
  const areas = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Mobility", "Cardio"];
  const selected = genState.weakAreas || [];
  body.innerHTML = `<div class="gn-chips">${areas.map(a =>
    `<button class="gn-chip${selected.includes(a) ? " is-active" : ""}" data-gn-weak="${a}">${a}</button>`
  ).join("")}</div>
  <div style="margin-top:0.75rem;font-size:0.78rem;color:var(--text-tertiary)">Optional — skip if none</div>`;
  body.querySelectorAll(".gn-chip").forEach(el => {
    el.addEventListener("click", () => {
      el.classList.toggle("is-active");
      genState.weakAreas = [...body.querySelectorAll(".gn-chip.is-active")].map(c => c.dataset.gnWeak);
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderInjuries() {
  const body = document.getElementById("gmBody");
  const injs = [
    { id: "shoulder", label: "Shoulder" }, { id: "knee", label: "Knee" },
    { id: "back", label: "Lower Back" }, { id: "wrist", label: "Wrist" },
    { id: "hip", label: "Hip" }, { id: "ankle", label: "Ankle" },
    { id: "elbow", label: "Elbow" }, { id: "neck", label: "Neck" },
  ];
  const selected = genState.limitation || [];
  body.innerHTML = `<div class="gn-chips">${injs.map(inj =>
    `<button class="gn-chip${selected.includes(inj.id) ? " is-active" : ""}" data-gn-inj="${inj.id}">${inj.label}</button>`
  ).join("")}</div>
  <div style="margin-top:0.75rem;font-size:0.78rem;color:var(--text-tertiary)">Optional — skip if none</div>`;
  body.querySelectorAll(".gn-chip").forEach(el => {
    el.addEventListener("click", () => {
      el.classList.toggle("is-active");
      genState.limitation = [...body.querySelectorAll(".gn-chip.is-active")].map(c => c.dataset.gnInj);
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderCardio() {
  const body = document.getElementById("gmBody");
  const options = [
    { id: "none", icon: "🛑", label: "None", desc: "Focus purely on strength" },
    { id: "walking", icon: "🚶", label: "Walking", desc: "10-15 min post-workout" },
    { id: "running", icon: "🏃", label: "Running", desc: "20-30 min steady state" },
    { id: "cycling", icon: "🚴", label: "Cycling", desc: "Moderate intensity" },
    { id: "hiit", icon: "🔥", label: "HIIT", desc: "High intensity intervals" },
  ];
  const active = genState.cardio || "none";
  body.innerHTML = `<div class="gn-options">${options.map(o =>
    `<button class="gn-option${active === o.id ? " is-active" : ""}" data-gn-cardio="${o.id}">
      <div class="gn-option-icon">${o.icon}</div>
      <div class="gn-option-body">
        <div class="gn-option-title">${o.label}</div>
        <div class="gn-option-desc">${o.desc}</div>
      </div>
    </button>`
  ).join("")}</div>`;
  body.querySelectorAll(".gn-option").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gn-option").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.cardio = el.dataset.gnCardio;
      document.getElementById("gmNextBtn").disabled = false;
    });
  });
}

function gnRenderSummary() {
  const body = document.getElementById("gmBody");

  // Map new fields to backend values
  const equipMap = {
    "full-gym": "full-gym", "commercial": "full-gym", "apartment": "dumbbells-only", "limited": "bodyweight-only",
    "bodyweight-only": "bodyweight-only", "bands": "bodyweight-only", "dumbbells": "dumbbells-only", "full-home": "home-gym",
  };
  if (genState.trainingLocation === "home" && Array.isArray(genState.equipmentLevel)) {
    genState.equipment = genState.equipmentLevel.map(e => equipMap[e] || "bodyweight-only")[0] || "bodyweight-only";
  } else {
    genState.equipment = equipMap[genState.equipmentLevel] || "full-gym";
  }

  // Map duration to time slot
  const durationMap = { 30: "30-45", 45: "45-60", 60: "60-75", 75: "75-90", 90: "75-90" };
  genState.time = durationMap[genState.duration] || "45-60";

  // Map goal names to backend goal format
  const goalMap = {
    "Fat Loss": "Fat Loss", "Muscle Gain": "Muscle Gain", "Recomp": "General Fitness",
    "Strength": "Strength", "Athletic": "General Fitness", "Endurance": "Endurance",
  };
  genState.goal = goalMap[genState.goal] || "General Fitness";

  // Map split names
  const splitMap = {
    "Push Pull Legs": "Push Pull Legs", "Upper Lower": "Upper Lower", "Full Body": "Full Body",
    "Arnold": "Push Pull Legs", "Bro Split": "Push Pull Legs", "Custom": "Push Pull Legs",
  };
  genState.split = splitMap[genState.split] || "Push Pull Legs";

  // Prefill experience from user profile if not set
  if (!genState.experience) {
    const u = state.user;
    const expMap = { "beginner": "Beginner", "intermediate": "Intermediate", "advanced": "Advanced" };
    genState.experience = (u && expMap[u.experience]) || "Beginner";
  }

  // Generate the schedule
  const schedule = generateWeeklySchedule(genState.goal, genState.experience, genState.split, genState.days, genState.time, genState.priority, genState.equipment, genState.limitation);
  genState.schedule = schedule;

  const totWorkouts = schedule.filter(d => d.type === "workout").length;
  const totRecovery = schedule.filter(d => d.type === "recovery").length;
  const totalSets = schedule.reduce((sum, d) => {
    if (d.type === "workout" && Array.isArray(d.exercises)) {
      return sum + d.exercises.reduce((s, ex) => s + (typeof ex.sets === "number" ? ex.sets : 3), 0);
    }
    return sum;
  }, 0);
  const weeklyVolume = totalSets * (genState.days || 3);
  const durLabels = { 30: "30 min", 45: "45 min", 60: "60 min", 75: "75 min", 90: "90 min" };
  const locLabels = { gym: "Gym", home: "Home", hybrid: "Hybrid" };

  body.innerHTML = `<div class="gn-summary">
    <div class="gn-summary-volume">
      <div class="gn-summary-volume-label">Estimated Weekly Volume</div>
      <div class="gn-summary-volume-value">${weeklyVolume} reps</div>
      <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.2rem">${durLabels[genState.duration] || "45 min"} · ${genState.split} · ${totWorkouts}x/week</div>
    </div>
    <div class="gn-summary-grid">
      <div class="gn-summary-card">
        <div class="gn-summary-label">Goal</div>
        <div class="gn-summary-value">${genState.goal}</div>
      </div>
      <div class="gn-summary-card">
        <div class="gn-summary-label">Experience</div>
        <div class="gn-summary-value">${genState.experience}</div>
      </div>
      <div class="gn-summary-card">
        <div class="gn-summary-label">Location</div>
        <div class="gn-summary-value">${locLabels[genState.trainingLocation] || "Gym"}</div>
      </div>
      <div class="gn-summary-card">
        <div class="gn-summary-label">Duration</div>
        <div class="gn-summary-value">${durLabels[genState.duration] || "45 min"}</div>
      </div>
      <div class="gn-summary-card">
        <div class="gn-summary-label">Workout Days</div>
        <div class="gn-summary-value">${totWorkouts}x / week</div>
      </div>
      <div class="gn-summary-card">
        <div class="gn-summary-label">Recovery Days</div>
        <div class="gn-summary-value">${totRecovery}x / week</div>
      </div>
    </div>
    <p class="gn-summary-note">You can adjust or regenerate anytime after creation.</p>
  </div>`;
}

// --- Wizard Navigation ---
function gnGoToStep(step) {
  genState.step = step;
  gnUpdateNav(step);
  // Re-trigger slide animation on body
  const body = document.getElementById("gmBody");
  body.style.animation = "none";
  body.offsetHeight;
  body.style.animation = "";

  switch (step) {
    case 1: gnRenderLocation(); break;
    case 2: gnRenderEquipment(); break;
    case 3: gnRenderDays(); break;
    case 4: gnRenderDuration(); break;
    case 5: gnRenderGoal(); break;
    case 6: gnRenderSplit(); break;
    case 7: gnRenderPriority(); break;
    case 8: gnRenderWeakAreas(); break;
    case 9: gnRenderInjuries(); break;
    case 10: gnRenderCardio(); break;
    case 11: gnRenderSummary(); break;
  }
  // Disable next when no selection made (except for optional steps)
  const nextBtn = document.getElementById("gmNextBtn");
  const s = step;
  if (s === 1 && !genState.trainingLocation) nextBtn.disabled = true;
  else if (s === 2 && !genState.equipmentLevel) nextBtn.disabled = true;
  else if (s === 3 && !genState.days) nextBtn.disabled = true;
  else if (s === 4 && !genState.duration) nextBtn.disabled = true;
  else if (s === 5 && !genState.goal) nextBtn.disabled = true;
  else if (s === 6 && !genState.split) nextBtn.disabled = true;
  else if (s === 7 && !genState.priority) nextBtn.disabled = true;
  else if (s === 8) nextBtn.disabled = false; // optional
  else if (s === 9) nextBtn.disabled = false; // optional
  else if (s === 10 && !genState.cardio) nextBtn.disabled = true;
}

function gnNextStep() {
  const s = genState.step;
  if (s === 1 && !genState.trainingLocation) { showToast("Select where you train."); return; }
  if (s === 2 && !genState.equipmentLevel) { showToast("Select your equipment."); return; }
  if (s === 3 && !genState.days) { showToast("Select training days."); return; }
  if (s === 4 && !genState.duration) { showToast("Select workout duration."); return; }
  if (s === 5 && !genState.goal) { showToast("Select a goal."); return; }
  if (s === 6 && !genState.split) { showToast("Select a split."); return; }
  if (s === 10 && !genState.cardio) { genState.cardio = "none"; }
  if (s === GN_TOTAL_STEPS) { saveGeneratedProgram(); return; }
  gnGoToStep(s + 1);
}

function gnPrevStep() {
  if (genState.step > 1) gnGoToStep(genState.step - 1);
}

// --- Open ---
function openGenerateWorkout() {
  const u = state.user;
  const expMap = { "beginner": "Beginner", "intermediate": "Intermediate", "advanced": "Advanced" };
  const equipMap = { "gym": "full-gym", "home": "bodyweight-only", "minimal": "dumbbells-only", "bodyweight": "bodyweight-only" };
  const injuryLimits = { "shoulder": "shoulder", "knee": "knee", "back": "lower-back", "lower-back": "lower-back", "wrist": "wrist", "hip": "hip", "neck": "neck", "ankle": "ankle", "elbow": "elbow" };
  const goalMap = { "build-muscle": "Muscle Gain", "lose-fat": "Fat Loss", "fat-loss": "Fat Loss", "recomp": "Recomp", "strength": "Strength", "general": "General Fitness", "athletic": "Athletic", "custom": "General Fitness" };

  genState = {
    ...genState,
    step: 1,
    trainingLocation: null,
    equipmentLevel: null,
    duration: null,
    cardio: null,
    weakAreas: [],
    goal: goalMap[GoalCenter.getGoalType()] || goalMap[u?.goal] || null,
    experience: (u && expMap[u.experience]) || null,
    days: (u && u.trainingDays) || null,
    time: null,
    priority: "none",
    equipment: equipMap[u?.equipment] || "full-gym",
    limitation: (Array.isArray(u?.injuries) && u.injuries.length > 0) ? u.injuries.filter(i => injuryLimits[i]).map(i => injuryLimits[i]) : [],
    split: null,
    schedule: null,
  };
  document.getElementById("generateModal").classList.remove("is-hidden");
  showGmOverlay(null);
  gnGoToStep(1);
}

// --- Save ---
function showGmOverlay(state, reason) {
  document.getElementById("gmLoading").classList.toggle("is-hidden", state !== "loading");
  document.getElementById("gmSuccess").classList.toggle("is-hidden", state !== "success");
  document.getElementById("gmFailure").classList.toggle("is-hidden", state !== "failure");
  document.getElementById("gmOverlay").classList.toggle("is-hidden", state === null);
  if (state === "failure" && reason) {
    document.getElementById("gmFailureReason").textContent = reason;
  }
}

function saveGeneratedProgram() {
  const startTime = Date.now();

  // --- LOADING ---
  showGmOverlay("loading");

  const schedule = genState.schedule;
  if (!schedule) {
    showGmOverlay("failure", "Program generation failed: No schedule data. Please go back and review your selections.");
    return;
  }

  const workouts = schedule.filter(d => d.type === "workout");

  if (workouts.length === 0) {
    showGmOverlay("failure", "Program generation failed: No workout days generated. Try different settings.");
    return;
  }

  const programId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const programName = `${genState.split} (${genState.goal})`;

  let activePlan = [];
  try {
    const existing = loadCustomProgram();
    if (Array.isArray(existing)) activePlan = existing;
  } catch (e) {
    activePlan = [];
  }

  let hasDup = false;
  workouts.forEach(gw => {
    const wName = DayLabel(gw.day) + " · " + gw.name;
    if (activePlan.some(w => w && w.name && w.name.toLowerCase() === wName.toLowerCase())) hasDup = true;
  });
  if (hasDup) {
    showGmOverlay("failure", "Workout with the same name already exists. Rename or remove existing workouts first.");
    return;
  }

  try {
    workouts.forEach((gw, idx) => {
      const wName = DayLabel(gw.day) + " · " + gw.name;
      const exList = Array.isArray(gw.exercises) ? gw.exercises : [];
      const workout = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: wName,
        programId: programId,
        programName: programName,
        programSort: idx,
        exercises: exList.map(ex => ({
          name: ex.name || "Unknown",
          sets: typeof ex.sets === "number" && !isNaN(ex.sets) ? ex.sets : 3,
          reps: typeof ex.reps === "number" && !isNaN(ex.reps) ? ex.reps : 10,
          weight: "", notes: "",
        })),
      };
      activePlan.push(workout);
    });
  } catch (e) {
    showGmOverlay("failure", "Workout conversion failed: " + e.message);
    return;
  }

  try {
    localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
  } catch (e) {
    showGmOverlay("failure", "Storage write failed: " + e.message);
    return;
  }

  try {
    state.plan = activePlan;
    saveState();
  } catch (e) {
    showGmOverlay("failure", "State save failed: " + e.message);
    return;
  }

  try {
    const profile = {
      goal: genState.goal,
      experience: genState.experience,
      split: genState.split,
      days: genState.days,
      time: genState.time,
      priority: genState.priority,
      equipment: genState.equipment,
      limitation: genState.limitation,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("wl_generator_profile", JSON.stringify(profile));
  } catch (e) {
    // Non-critical, continue
  }

  // Minimum 800ms loading display
  const elapsed = Date.now() - startTime;
  const minDisplay = 800;
  const remaining = Math.max(0, minDisplay - elapsed);
  const maxDisplay = 2000;
  const delay = Math.min(remaining + 100, maxDisplay);

  setTimeout(() => {
    showGmOverlay("success");
    // Store program data for View Program button
    window._lastGenProgramName = programName;
    window._lastGenWorkoutCount = workouts.length;
    window._lastGenFirstDay = DayLabel(workouts[0].day);
  }, delay);
}

document.getElementById("gmViewProgramBtn")?.addEventListener("click", () => {
  document.getElementById("generateModal").classList.add("is-hidden");
  showGmOverlay(null);
  showScreen("screen-home");
  renderHome();

  setTimeout(() => {
    const cards = document.querySelectorAll(".wo-card-item");
    if (cards.length > 0) {
      cards[cards.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
      cards[cards.length - 1].classList.add("is-active");
      setTimeout(() => cards[cards.length - 1].classList.remove("is-active"), 2000);
    }
  }, 100);
});

document.getElementById("gmFailureClose")?.addEventListener("click", () => {
  showGmOverlay(null);
});

document.getElementById("gmNextBtn")?.addEventListener("click", gnNextStep);
document.getElementById("gmBackBtn")?.addEventListener("click", gnPrevStep);
document.getElementById("gmCloseBtn")?.addEventListener("click", () => {
  document.getElementById("generateModal").classList.add("is-hidden");
  showGmOverlay(null);
});

// Close modals on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll("[class*='overlay'], .modal.is-hidden, .modal:not(.is-hidden)").forEach((el) => {
      if (el.classList.contains("bottom-sheet-overlay") || el.id?.includes("Modal") || el.classList.contains("modal")) {
        el.remove ? el.remove() : el.classList.add("is-hidden");
      }
    });
    document.querySelectorAll(".bottom-sheet-overlay").forEach((el) => el.remove());
  }
});

// ===== MUSCLE SHEET =====
document.getElementById("muscleSheetOverlay")?.addEventListener("click", () => {
  document.getElementById("muscleSheet").classList.add("is-hidden");
});
document.getElementById("muscleSheet")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add("is-hidden");
});



function DayLabel(dayIndex) { return DAY_NAMES[dayIndex] || "Day " + (dayIndex + 1); }
