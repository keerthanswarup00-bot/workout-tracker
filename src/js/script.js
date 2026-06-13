const STORAGE_KEY = "workout-tracker-v3";
const PROTEIN_GOAL = 146;
const CARBS_GOAL = 240;
const FAT_GOAL = 65;
const CAL_GOAL = 2100;
const WATER_TARGET = 3000;
const DEFAULT_REST = 90;


function isWorkingSet(s) {
  return s.done && !s.isWarmup && Number(s.weight) > 0;
}
function getWorkingSets(sets) {
  return sets.filter((s) => s.done && !s.isWarmup);
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
];

const EXERCISE_CATEGORIES = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Legs", "Glutes", "Calves", "Abs", "Forearms", "Traps", "Full Body"];

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
migrateLegacyPRs();

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
    nutrition: {},
    planOffset: 0,
    recoveryLog: [],
    bodyGoal: "recomp",
    calorieTarget: CAL_GOAL,
    fatTarget: FAT_GOAL,
    user: null,
    plan: null,
    weightLog: [],
    goals: [],
    weightGoal: null,
    profileBannerDismissed: false,
    autoWarmup: true,
    warmupReminder: true,
    stretchReminder: true,
    autoSummary: true,
    autoCooldown: true,
    coolDownDuration: 5,
    autoAdvanceStretches: true,
    showTomorrowPreview: true,
    showRecoveryAdvice: true,
    showWorkoutProgress: true,
    recoveryAnalysis: true,
    workoutStreak: { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null },
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
    return loaded;
  } catch {
    return fallback;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
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

function getCurrentWorkout() {
  const todaySession = state.sessions.find((item) => item.dateKey === getDateKey() && !item.finishedAt);
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
    const setCount = typeof exercise.sets === "number" ? exercise.sets : 3;
    ex = {
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

function getNextUndoneSet(exSession) {
  return exSession.sets.findIndex((s) => !s.done);
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
  const prevSessions = state.sessions.filter(
    (s) => s.finishedAt && s.dateKey < getDateKey(new Date(Date.now() - 7 * 86400000)) && s.dateKey >= getDateKey(new Date(Date.now() - 14 * 86400000)),
  );
  const volWeek = weekSessions.reduce(
    (s, ses) =>
      s +
      ses.exercises.reduce(
        (s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0),
        0,
      ),
    0,
  );
  const volPrev = prevSessions.reduce(
    (s, ses) =>
      s +
      ses.exercises.reduce(
        (s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0),
        0,
      ),
    0,
  );
  if (volPrev > 0) return ((volWeek - volPrev) / volPrev) * 100;
  return null;
}

function getWeeklyProteinAdherence() {
  let totalPct = 0;
  let days = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getDateKey(d);
    const meals = loadMeals(key);
    const protein = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
    if (protein > 0) {
      totalPct += (protein / PROTEIN_GOAL) * 100;
      days++;
    }
  }
  return days > 0 ? totalPct / days : null;
}

function getWeeklyMacroAvg() {
  let p = 0,
    c = 0,
    f = 0,
    cal = 0,
    days = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
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
  let p = 0,
    c = 0,
    f = 0,
    cal = 0,
    days = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
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
      const change = r.reduce((s, e) => s + e.weight, 0) / r.length - p.reduce((s, e) => s + e.weight, 0) / p.length;
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
function saveFavoriteMeals(meals) {
  try {
    localStorage.setItem("wl_fav_meals", JSON.stringify(meals));
  } catch {}
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

function getTodayMealsSnapshot() {
  const today = getDateKey();
  return loadMeals(today).map((m) => ({ food: m.food, qty: m.qty, protein: m.protein, carbs: m.carbs, fat: m.fat, cal: m.cal }));
}

// ===== MUSCLE COMPUTATION =====
// ===== MUSCLE COMPUTATION =====
let bodyMapCache = null;

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
  const mCals = u.weight
    ? Math.round(
        u.weight *
          (u.activity === "sedentary" ? 24 : u.activity === "light" ? 26.5 : u.activity === "moderate" ? 29 : u.activity === "very" ? 31.5 : 34) *
          (u.goal === "fat-loss" ? 0.8 : u.goal === "build-muscle" || u.goal === "strength" ? 1.1 : 1),
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
        <div class="sg-card-meta">${[u.age ? u.age + " yrs" : "", u.height ? u.height + " cm" : "", u.weight ? displayWeight(u.weight) : "", u.goal ? goalLabels[u.goal] || "" : ""].filter(Boolean).join(" · ") || "No profile yet"}</div>
      </div>
      <span class="sg-chevron">›</span>
    </button>
    <div class="sg-stats">
      <div class="sg-stat"><span class="sg-stat-val">${u.age || "—"}</span><span class="sg-stat-lbl">Age</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${u.height ? displayHeight(u.height) : "—"}</span><span class="sg-stat-lbl">Height</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${u.weight ? displayWeight(u.weight) : "—"}</span><span class="sg-stat-lbl">Weight</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${u.goal ? (u.goal === "fat-loss" ? "Fat Loss" : u.goal === "build-muscle" ? "Build Muscle" : u.goal === "recomp" ? "Recomp" : u.goal === "strength" ? "Strength" : u.goal === "athletic" ? "Athletic" : "General") : "—"}</span><span class="sg-stat-lbl">Goal</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${bmi || "—"}</span><span class="sg-stat-lbl">BMI</span></div>
      <div class="sg-stat"><span class="sg-stat-val">${mCals}</span><span class="sg-stat-lbl">Calories</span></div>
    </div>
    ${bmi ? '<div class="sg-bmi-bar"><div class="sg-bmi-fill" style="width:' + (bmi / 40) * 100 + "%;background:" + (bmiCat === "Underweight" ? "#4a9eff" : bmiCat === "Normal" ? "#00d26a" : bmiCat === "Overweight" ? "#ff9500" : "#ff3b30") + '"></div></div><div class="sg-bmi-labels"><span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span></div>' : ""}
    ${!isProfileComplete() ? '<button class="sg-card sg-card-cta" id="settingsCompleteProfile"><div class="sg-card-body"><div class="sg-card-name">Complete Your Profile</div><div class="sg-card-meta">Add your stats to unlock features</div></div><span class="sg-chevron">›</span></button>' : ""}
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

  <!-- SECTION 3: WORKOUT SETTINGS -->
  <div class="sg">
    <div class="sg-label">WORKOUT</div>
    <div class="sg-row" data-setting="rest-timer"><span>Rest Timer</span><span class="sg-row-val" id="sgRestVal">${state.restTimer || 90}s</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Auto-Start Rest Timer</span><input type="checkbox" ${state.autoRest ? "checked" : ""} data-setting="auto-rest" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Auto-Open Next Exercise</span><input type="checkbox" ${state.autoNext ? "checked" : ""} data-setting="auto-next" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Focus Mode</span><input type="checkbox" ${state.focusMode ? "checked" : ""} data-setting="focus-mode" /><span class="sg-toggle-track"></span></label>
    <div class="sg-row" data-setting="weight-inc"><span>Weight Increment</span><span class="sg-row-val">${displayWeight(state.weightInc || 1)}</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="rep-inc"><span>Rep Increment</span><span class="sg-row-val">${state.repInc || "1"}</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Keep Screen Awake</span><input type="checkbox" ${state.screenAwake ? "checked" : ""} data-setting="screen-awake" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Auto-Generate Warm-Up Sets</span><input type="checkbox" ${state.autoWarmup !== false ? "checked" : ""} data-setting="auto-warmup" /><span class="sg-toggle-track"></span></label>
    <div class="sg-row" data-setting="warmup-style"><span>Warm-Up Style</span><span class="sg-row-val">${state.warmupStyle === "advanced" ? "Advanced" : "Simple"}</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Auto-Open Summary</span><input type="checkbox" ${state.autoSummary !== false ? "checked" : ""} data-setting="auto-summary" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Auto-Start Cool Down</span><input type="checkbox" ${state.autoCooldown ? "checked" : ""} data-setting="auto-cooldown" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Show Workout Progress</span><input type="checkbox" ${state.showWorkoutProgress !== false ? "checked" : ""} data-setting="show-workout-progress" /><span class="sg-toggle-track"></span></label>
    <div class="sg-row" data-setting="cool-down-duration"><span>Cool Down Duration</span><span class="sg-row-val" id="sgCoolDownVal">${state.coolDownDuration || 5} min</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Auto-Advance Stretches</span><input type="checkbox" ${state.autoAdvanceStretches !== false ? "checked" : ""} data-setting="auto-advance-stretches" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Tomorrow Preview</span><input type="checkbox" ${state.showTomorrowPreview !== false ? "checked" : ""} data-setting="show-tomorrow" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Recovery Advice</span><input type="checkbox" ${state.showRecoveryAdvice !== false ? "checked" : ""} data-setting="show-recovery" /><span class="sg-toggle-track"></span></label>
  </div>

  <!-- SECTION 4: BODY & PROGRESS -->
  <div class="sg">
    <div class="sg-label">BODY & PROGRESS</div>
    <div class="sg-row" data-setting="weight-log"><span>Weight Log</span><span class="sg-row-val">${(state.weightLog || []).length} entries</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Daily Weight Reminder</span><input type="checkbox" ${state.weightReminder ? "checked" : ""} data-setting="weight-reminder" /><span class="sg-toggle-track"></span></label>
    <div class="sg-row" data-setting="weight-unit"><span>Weight Unit</span><span class="sg-row-val">${state.weightUnit || "kg"}</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="height-unit"><span>Height Unit</span><span class="sg-row-val">${state.heightUnit || "cm"}</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>7-Day Average</span><input type="checkbox" ${state.show7dAvg !== false ? "checked" : ""} data-setting="show-7d" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>30-Day Average</span><input type="checkbox" ${state.show30dAvg !== false ? "checked" : ""} data-setting="show-30d" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Progress Photos</span><input type="checkbox" ${state.progressPhotos ? "checked" : ""} data-setting="progress-photos" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Body Measurements</span><input type="checkbox" ${state.bodyMeasurements ? "checked" : ""} data-setting="body-measurements" /><span class="sg-toggle-track"></span></label>
  </div>

  <!-- SECTION 5: NUTRITION -->
  <div class="sg">
    <div class="sg-label">NUTRITION</div>
    <div class="sg-row" data-setting="cal-goal"><span>Daily Calories</span><span class="sg-row-val">${state.calorieTarget || CAL_GOAL} kcal</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="protein-goal"><span>Protein Goal</span><span class="sg-row-val">${state.proteinGoal || PROTEIN_GOAL} g</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="water-goal"><span>Water Goal</span><span class="sg-row-val">${state.waterGoal || WATER_TARGET} ml</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Nutrition Reminder</span><input type="checkbox" ${state.nutritionReminder ? "checked" : ""} data-setting="nutrition-reminder" /><span class="sg-toggle-track"></span></label>
  </div>

  <!-- SECTION 6: APPEARANCE -->
  <div class="sg">
    <div class="sg-label">APPEARANCE</div>
    <div class="sg-row" data-setting="theme"><span>Theme</span><span class="sg-row-val">${state.theme || "Dark"}</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="accent"><span>Accent Color</span><span class="sg-row-val" style="color:var(--accent)">${state.accent || "Green"}</span><span class="sg-chevron">›</span></div>
    <div class="sg-row" data-setting="font-size"><span>Font Size</span><span class="sg-row-val">${state.fontSize || "Medium"}</span><span class="sg-chevron">›</span></div>
    <label class="sg-row sg-toggle"><span>Compact Workout Mode</span><input type="checkbox" ${state.compactMode ? "checked" : ""} data-setting="compact-mode" /><span class="sg-toggle-track"></span></label>
  </div>

  <!-- SECTION 7: DATA & BACKUP -->
  <div class="sg">
    <div class="sg-label">DATA & BACKUP</div>
    <button class="sg-row" data-setting="export-json"><span>Export Data (JSON)</span><span class="sg-chevron">›</span></button>
    <button class="sg-row" data-setting="import-json"><span>Import Data (JSON)</span><span class="sg-chevron">›</span></button>
    <button class="sg-row sg-row-danger" data-setting="delete-all"><span>Delete All Data</span><span class="sg-chevron">›</span></button>
  </div>

  <!-- SECTION 8: COACH -->
  <div class="sg">
    <div class="sg-label">COACH</div>
    <label class="sg-row sg-toggle"><span>Weekly Review</span><input type="checkbox" ${state.weeklyReview !== false ? "checked" : ""} data-setting="weekly-review" /><span class="sg-toggle-track"></span></label>

    <label class="sg-row sg-toggle"><span>Warm-Up Reminders</span><input type="checkbox" ${state.warmupReminder !== false ? "checked" : ""} data-setting="warmup-reminder" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Stretch Reminders</span><input type="checkbox" ${state.stretchReminder !== false ? "checked" : ""} data-setting="stretch-reminder" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Recovery Analysis</span><input type="checkbox" ${state.recoveryAnalysis !== false ? "checked" : ""} data-setting="recovery-analysis" /><span class="sg-toggle-track"></span></label>
  </div>

  <!-- SECTION 9: ABOUT -->
  <div class="sg">
    <div class="sg-label">ABOUT</div>
    <div class="sg-row"><span>Version</span><span class="sg-row-val">2.0</span></div>
    <div class="sg-row"><span>IronLog</span><span class="sg-row-val">Track. Lift. Progress.</span></div>
    <div class="sg-row" style="cursor:default"><span style="font-size:0.7rem;color:var(--text-secondary)">Built with ❤️</span></div>
  </div>`;

  document.getElementById("settingsContent").innerHTML = html;
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
let currentTab = "sets";

function activateTab(tabName) {
  currentTab = tabName;

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));

  // Settings lives inside panel-sets, so keep that panel active
  if (tabName === "settings") {
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-sets"));
  } else {
    const panelId = tabName === "progress" ? "panel-progress" : "panel-" + tabName;
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === panelId));
  }

  positionNavIndicator();

  if (tabName === "sessions") renderSessionsTab();
  if (tabName === "progress") renderProgressPage();
  if (tabName === "body") renderBodyTab();
  if (tabName === "sets") renderSetsPanel();
  if (tabName === "settings") {
    showScreen("screen-settings");
    renderSettings();
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

function render() {
  document.getElementById("todayLabel").textContent = formatReadableDate(new Date());
  updateStreak();
  renderSetsPanel();
  if (currentTab === "sessions") renderSessionsTab();
  if (currentTab === "progress") renderProgressPage();
  if (currentTab === "body") renderBodyTab();
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
  if (screenId === "screen-ws") {
    nav.classList.add("is-locked");
  } else {
    nav.classList.remove("is-locked");
  }
  if (screenId !== "screen-ws" && restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
    document.getElementById("restTimerDisplay").classList.add("is-hidden");
  }
}

// ===== HOME DASHBOARD =====

function getDailyMessage() {
  const messages = [
    "Have a great workout today.",
    "Ready to hit your goals?",
    "Let's build consistency today.",
    "Focus on today's training.",
    "Stay strong and keep moving.",
    "Make every rep count.",
    "You're building something great.",
    "Trust the process.",
    "Small steps lead to big results.",
    "Today's effort = tomorrow's progress.",
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
  const bmi = user && user.height && hasWeight ? (weight / ((user.height / 100) * (user.height / 100))).toFixed(1) : null;
  const longestStreak = getLongestStreak();
  document.getElementById("homeGreeting").innerHTML = `
    <div class="hero-greeting">${g.text} ${g.emoji}</div>
    <div class="hero-name">${name}</div>
    <div class="hero-motivation">${getDailyMessage()}</div>
    ${profileComplete || state.profileBannerDismissed ? "" : `<div class="home-incomplete-banner" id="homeIncompleteBanner"><span>Complete your profile to unlock all features</span><span class="home-incomplete-cta">Set Up →</span></div>`}
    <div class="home-greeting-spacer"></div>
    <div class="hero-cards-row">
      <div class="hero-streak-card" id="heroStreakCard">
        <div class="hc-header">STREAK</div>
        <div class="hc-value">${streak} Day${streak !== 1 ? "s" : ""}</div>
        <div class="hc-sub">Longest: ${longestStreak} days</div>
        ${lastSession ? `<div class="hc-last">Last: ${lastSession.workoutName}</div>` : ""}
      </div>
      <div class="hero-weight-card" id="heroWeightCard">
        <div class="hc-header">WEIGHT</div>
        <div class="hc-value">${hasWeight ? displayWeight(weight) : "—"}</div>
        <div class="hc-sub">${hasWeight ? (bmi ? "BMI: " + bmi : "Updated Today") : "Tap to log weight"}</div>
      </div>
    </div>`;

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
        <div class="empty-state-title">Create Your First Workout</div>
        <div class="empty-state-text">Build a workout manually or generate one automatically.</div>
        <button class="empty-state-btn" id="emptyStateBuildBtn">Build Workout</button>
        <button class="empty-state-btn secondary" id="emptyStateGenerateBtn">Generate Workout</button>
      </div>`;
    document.getElementById("emptyStateBuildBtn")?.addEventListener("click", showNewWorkoutBuilder);
    document.getElementById("emptyStateGenerateBtn")?.addEventListener("click", openGenerateWorkout);
  } else {
    container.innerHTML = sorted.map((w) => renderWorkoutCardItem(w, todaySession)).join("");
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

  renderRecentWorkouts();
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

function openWorkout(workoutId) {
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

function closeWorkout() {
  currentWorkoutId = null;
  showScreen("screen-home");
  renderHome();
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
    const newPRs = detectPR(currentExName, weight, reps, session.id || "", getDateKey());
    if (newPRs) showPRToast(newPRs);
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
    const newPRs = detectPR(currentExName, Number(set.weight), Number(set.reps) || 0, session?.id || "", getDateKey());
    if (newPRs) showPRToast(newPRs);
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

  document.getElementById("ssTitle").textContent = "💪 Workout Complete";
  document.getElementById("ssSubtitle").textContent = `${session.workoutName || "Workout"} · ${duration}`;
  document.getElementById("ssGrid").innerHTML = `
    <div class="ss-item"><span class="ss-item-val">${totalSets}</span><span class="ss-item-lbl">Sets</span></div>
    <div class="ss-item"><span class="ss-item-val">${totalReps}</span><span class="ss-item-lbl">Reps</span></div>
    <div class="ss-item"><span class="ss-item-val">${duration}</span><span class="ss-item-lbl">Duration</span></div>
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
    document.getElementById("sessionSummaryOverlay").classList.add("is-hidden");
    finishWorkoutComplete();
  };
  document.getElementById("ssStartCoolDown").onclick = () => {
    if (session.notes !== undefined) {
      session.notes = document.getElementById("ssNotesInput").value || "";
      saveState();
    }
    document.getElementById("sessionSummaryOverlay").classList.add("is-hidden");
    openCoolDown();
  };

  document.getElementById("sessionSummaryOverlay").classList.remove("is-hidden");
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
  const goals = state.goals || [];
  const goalLabels = { weight: "Body Weight", bench: "Bench Press", squat: "Squat", deadlift: "Deadlift", frequency: "Weekly Sessions", custom: "Custom" };

  let html = goals
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
    .join("");

  html += `<button class="goal-add-btn" id="goalAddBtn">+ Add Goal</button>`;
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

  let html = `<div class="cal-header">
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

  const u = state.user || {};
  const latestLog = (state.weightLog || []).sort((a, b) => b.date.localeCompare(a.date))[0];
  const curWeight = latestLog ? latestLog.weight : (u.weight || null);
  const targetWeight = u.targetWeight || null;
  const bmi = u.height && curWeight ? (curWeight / ((u.height / 100) * (u.height / 100))).toFixed(1) : null;

  // Weight goal card
  let weightHtml = "";
  if (curWeight && targetWeight) {
    const diff = (targetWeight - curWeight).toFixed(1);
    weightHtml = `<div class="progress-card"><div class="progress-stat"><div class="progress-label">Current Weight</div><div class="progress-value">${displayWeight(curWeight)}</div></div><div class="progress-stat"><div class="progress-label">Target Weight</div><div class="progress-value">${displayWeight(targetWeight)}</div></div><div class="progress-stat"><div class="progress-label">Difference</div><div class="progress-value">${diff >= 0 ? "+" : ""}${displayWeight(Math.abs(diff))}</div></div><div class="progress-stat"><div class="progress-label">BMI</div><div class="progress-value">${bmi}</div></div></div>`;
  } else if (!curWeight && !targetWeight) {
    weightHtml = `<div class="progress-card"><div class="progress-stat"><div class="progress-label">Weight</div><div class="progress-value">Log your first weight</div></div><div class="progress-stat"><div class="progress-label">Target</div><div class="progress-value">Set target weight in onboarding</div></div></div>`;
  } else if (!curWeight) {
    weightHtml = `<div class="progress-card"><div class="progress-stat"><div class="progress-label">Weight</div><div class="progress-value">Log your first weight</div></div></div>`;
  } else if (!targetWeight) {
    weightHtml = `<div class="progress-card"><div class="progress-stat"><div class="progress-label">Weight</div><div class="progress-value">${displayWeight(curWeight)}</div></div><div class="progress-stat"><div class="progress-label">Target</div><div class="progress-value">Set target weight in onboarding</div></div></div>`;
  }

  // Streak card
  const streakHtml = `<div class="progress-card"><div class="progress-stat"><div class="progress-label">Current Streak</div><div class="progress-value">${state.workoutStreak?.currentStreak || 0} days</div></div><div class="progress-stat"><div class="progress-label">Longest Streak</div><div class="progress-value">${state.workoutStreak?.longestStreak || 0} days</div></div></div>`;

  const sessions = state.sessions.filter((s) => s.finishedAt);
  if (!sessions.length) {
    container.innerHTML = `${weightHtml}${streakHtml}<div class="progress-empty" style="margin-top:1rem">Complete your first workout to see progress here.</div>`;
    return;
  }
  container.innerHTML = `${weightHtml}${streakHtml}
    <div class="progress-card">
      <div id="progressCalendarHero"></div>
    </div>
    <div class="progress-section">
      <div class="section-label">This Week</div>
      <div id="progressWeekly"></div>
    </div>
    <div class="progress-section">
      <div class="section-label">Monthly</div>
      <div id="progressMonthly"></div>
    </div>
    <div class="progress-section">
      <div class="section-label">Achievements</div>
      <div id="progressAchievements"></div>
    </div>
  `;
  renderCalendarHero();
  renderWeeklyReview();
  renderMonthlyReview();
  renderRecentAchievements();
}

function renderWeeklyReview() {
  const container = document.getElementById("progressWeekly");
  if (!container) return;
  const weekAgo = getDateKey(new Date(Date.now() - 7 * 86400000));
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= weekAgo);
  if (!weekSessions.length) {
    container.innerHTML = `<div class="empty-card"><div class="empty-card-content">Complete a workout this week to see stats.</div></div>`;
    return;
  }
  let totalSets = 0;
  let totalVol = 0;
  let totalDuration = 0;
  let weeklyPRCount = 0;
  const trainedDays = new Set();
  for (const ses of weekSessions) {
    trainedDays.add(ses.dateKey);
    if (ses.duration) totalDuration += ses.duration;
    for (const ex of ses.exercises) {
      for (const set of ex.sets) {
        if (set.done) totalSets++;
        if (set.done && Number(set.weight) > 0) totalVol += Number(set.weight) * (Number(set.reps) || 0);
      }
    }
  }
  // Count PRs this week
  if (state.prs) {
    for (const [, data] of Object.entries(state.prs)) {
      (data.history || []).forEach((h) => {
        if (h.date && h.date >= weekAgo) weeklyPRCount++;
      });
    }
  }
  const consistency = Math.min(100, Math.round((trainedDays.size / 7) * 100));
  const volStr = totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + "k" : totalVol;
  const avgDuration = totalDuration ? Math.round(totalDuration / weekSessions.length) : 0;
  container.innerHTML = `<div class="progress-card">
    <div class="progress-card-title">This Week</div>
    <div class="monthly-grid">
      <div class="monthly-item"><strong>${weekSessions.length}</strong><small>Sessions</small></div>
      <div class="monthly-item"><strong>${totalSets}</strong><small>Sets</small></div>
      <div class="monthly-item"><strong>${volStr}</strong><small>Volume</small></div>
      <div class="monthly-item"><strong>${weeklyPRCount}</strong><small>PRs</small></div>
      <div class="monthly-item"><strong>${avgDuration > 0 ? avgDuration + "m" : "—"}</strong><small>Avg Duration</small></div>
      <div class="monthly-item"><strong>${consistency}%</strong><small>Consistency</small></div>
    </div>
  </div>`;
}

function renderMonthlyReview() {
  const container = document.getElementById("progressMonthly");
  if (!container) return;
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey.startsWith(prefix));
  if (!monthSessions.length) {
    container.innerHTML = `<div class="empty-card"><div class="empty-card-content">Complete workouts to see monthly stats.</div></div>`;
    return;
  }
  let bestLift = { name: "", weight: 0 };
  const muscleCount = {};
  let totalSets = 0;
  let totalVol = 0;
  let totalDuration = 0;
  for (const ses of monthSessions) {
    if (ses.duration) totalDuration += ses.duration;
    for (const ex of ses.exercises) {
      const muscle = getKnownMuscle(ex.name);
      if (muscle) muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
      for (const set of ex.sets) {
        if (set.done) totalSets++;
        if (set.done && Number(set.weight) > 0) {
          totalVol += Number(set.weight) * (Number(set.reps) || 0);
          if (Number(set.weight) > bestLift.weight) bestLift = { name: ex.name, weight: Number(set.weight) };
        }
      }
    }
  }
  const mostTrained = Object.entries(muscleCount).sort((a, b) => b[1] - a[1])[0];
  const avgDuration = totalDuration ? Math.round(totalDuration / monthSessions.length) : 0;
  const volStr = totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + "k" : totalVol;
  const prCount = getPRCount();
  container.innerHTML = `<div class="progress-card">
    <div class="progress-card-title">Monthly</div>
    <div class="monthly-grid">
      <div class="monthly-item"><strong>${monthSessions.length}</strong><small>Workouts</small></div>
      <div class="monthly-item"><strong>${totalSets}</strong><small>Sets</small></div>
      <div class="monthly-item"><strong>${volStr}</strong><small>Volume</small></div>
      <div class="monthly-item"><strong>${prCount}</strong><small>PRs</small></div>
      <div class="monthly-item"><strong>${bestLift.name ? bestLift.name.replace(/([A-Z])/g, " $1").trim() : "—"}</strong><small>Best Lift</small></div>
      <div class="monthly-item"><strong>${mostTrained ? mostTrained[0] : "—"}</strong><small>Most Trained</small></div>
      <div class="monthly-item"><strong>${avgDuration > 0 ? avgDuration + "m" : "—"}</strong><small>Avg Duration</small></div>
    </div>
  </div>`;
}

function renderRecentAchievements() {
  const container = document.getElementById("progressAchievements");
  if (!container) return;
  const allPRs = getAllPRs();
  const items = [];
  for (const [exName, data] of Object.entries(allPRs)) {
    (data.history || []).forEach((h) => items.push({ ...h, exerciseName: exName }));
  }
  items.sort((a, b) => b.date.localeCompare(a.date));
  const recent = items.slice(0, 5);
  if (!recent.length) {
    container.innerHTML = `<div class="empty-card"><div class="empty-card-content">Set personal records to see achievements here.</div></div>`;
    return;
  }
  container.innerHTML = `<div class="progress-card">
    <div class="progress-card-title">Recent Achievements</div>
    <div class="ach-list">${recent.map((pr) => {
      const name = pr.exerciseName.replace(/([A-Z])/g, " $1").trim();
      const date = formatReadableDate(parseDateKey(pr.date));
      const icon = pr.type === "weight" ? "🏋️" : pr.type === "reps" ? "🔁" : "📊";
      return `<div class="ach-item"><span class="ach-icon">${icon}</span>${name} · ${displayWeight(pr.weight)} × ${pr.reps}<span class="ach-date">${date}</span></div>`;
    }).join("")}</div>
  </div>`;
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



// ===== BODY TAB =====
let bodyChartInstance = null;

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
    return { progress: 0, status: "maintaining", remaining: null, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType };
  }

  const isLoss = goalType === "fat-loss";
  const effectiveIsLoss = isLoss || (goalType === "general-fitness" && targetWeight < startWeight);
  const journey = Math.round((effectiveIsLoss ? startWeight - targetWeight : targetWeight - startWeight) * 10) / 10;
  const change = Math.round((effectiveIsLoss ? startWeight - currentWeight : currentWeight - startWeight) * 10) / 10;

  if (journey <= 0) {
    return { progress: 0, status: "maintaining", remaining: 0, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType };
  }

  if (change <= 0) {
    const remaining = Math.max(0, Math.round((effectiveIsLoss ? currentWeight - targetWeight : targetWeight - currentWeight) * 10) / 10);
    return { progress: 0, status: change < 0 ? "moving-away" : "on-track", remaining, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType };
  }

  const pct = Math.min(100, Math.round((change / journey) * 100));
  const remaining = Math.max(0, Math.round((effectiveIsLoss ? currentWeight - targetWeight : targetWeight - currentWeight) * 10) / 10);

  if (pct >= 100) {
    return { progress: 100, status: "achieved", remaining: 0, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType };
  }

  return { progress: pct, status: "on-track", remaining, changeSinceStart: change, currentWeight, startWeight, targetWeight, goalType };
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

function monthlyWeightChange() {
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  if (log.length < 2) return null;
  const now = new Date();
  const monthAgo = getDateKey(new Date(now.getTime() - 30 * 86400000));
  const recent = log.filter((e) => e.date >= monthAgo);
  const before = log.filter((e) => e.date < monthAgo);
  if (recent.length === 0 || before.length === 0) return null;
  const avgRecent = recent.reduce((s, e) => s + e.weight, 0) / recent.length;
  const avgBefore = before.slice(-30).reduce((s, e) => s + e.weight, 0) / Math.min(before.length, 30);
  return avgRecent - avgBefore;
}

function goalDescription(goal) {
  return GOAL_DESCRIPTIONS[goal] || "";
}

// ===== BODY TAB: NEW 7-SECTION REDESIGN =====
function renderBodyTab() {
  const container = document.getElementById("bodyPageContent");
  container.innerHTML = "";

  renderWeightGoalProgress(container);
  renderBodyMetrics(container);
  renderWeightTrend(container);
  renderWorkoutStreak(container);
  renderConsistencyScore(container);
  renderProfileSummary(container);
  renderEditGoalsBtn(container);
}

function renderWeightGoalProgress(container) {
  const result = computeGoalProgress();
  const div = document.createElement("div");
  div.className = "body-card body-weight-progress";

  if (!result) {
    div.innerHTML = `<div class="body-empty-card"><div class="body-empty-title">No Weight Goal Set</div><p class="body-empty-text">Set a target weight to track progress</p></div>`;
    container.appendChild(div);
    return;
  }

  const { progress, status, remaining, changeSinceStart, currentWeight, startWeight, targetWeight, goalType } = result;

  const statusMeta = {
    "on-track": { label: "On Track", icon: "🟢" },
    "moving-away": { label: "Moving Away From Goal", icon: "🔴" },
    "maintaining": { label: "Maintaining", icon: "🟡" },
    "achieved": { label: "Goal Achieved", icon: "🏆" },
  };

  const goalLabels = {
    "fat-loss": "Fat Loss",
    "muscle-gain": "Muscle Gain",
    "recomposition": "Recomposition",
    "general-fitness": "General Fitness",
  };

  const goalLabel = goalLabels[goalType] || "General Fitness";
  const sm = statusMeta[status];
  const isLossGoal = goalType === "fat-loss" || (goalType === "general-fitness" && targetWeight < startWeight);

  let html = `
    <div class="bcg-header"><span class="bcg-label">Current Goal</span></div>
    <div class="bcg-name">${goalLabel}</div>
    <div class="wgp-status">${sm.icon} ${sm.label}</div>
    <div class="wgp-grid">
      <div class="wgp-stat"><span class="wgp-stat-label">Start</span><span class="wgp-stat-value">${displayWeight(startWeight)}</span></div>
      <div class="wgp-stat"><span class="wgp-stat-label">Current</span><span class="wgp-stat-value">${displayWeight(currentWeight)}</span></div>
      <div class="wgp-stat"><span class="wgp-stat-label">Target</span><span class="wgp-stat-value">${displayWeight(targetWeight)}</span></div>
    </div>`;

  if (goalType !== "recomposition") {
    const barColor = status === "achieved" ? "var(--accent)" : status === "moving-away" ? "var(--red)" : "var(--accent)";
    html += `<div class="wgp-bar-wrap"><div class="wgp-bar" style="width:${progress}%;background:${barColor}"></div></div>
      <div class="wgp-pct" style="color:${barColor}">${progress}%</div>`;
  }

  if (goalType !== "recomposition") {
    if (status === "achieved") {
      const direction = isLossGoal ? "Lost" : "Gained";
      html += `<div class="wgp-meta"><span class="wgp-meta-item wgp-meta-bonus">🎯 Goal Complete</span><span class="wgp-meta-item">${direction} ${displayWeight(Math.abs(changeSinceStart))}</span></div>`;
    } else if (status === "moving-away") {
      const direction = isLossGoal ? "gained" : "lost";
      html += `<div class="wgp-meta"><span class="wgp-meta-item">${displayWeight(remaining)} to goal</span><span class="wgp-meta-item">${direction} ${displayWeight(Math.abs(changeSinceStart))} since start</span></div>`;
    } else {
      const direction = isLossGoal ? "Lost" : "Gained";
      const dispChange = changeSinceStart;
      html += `<div class="wgp-meta"><span class="wgp-meta-item">${displayWeight(remaining)} Remaining</span><span class="wgp-meta-item">${direction} ${displayWeight(dispChange)}</span></div>`;
    }
  }

  if (goalType === "recomposition") {
    const diff = changeSinceStart;
    const absDiff = Math.abs(diff);
    const trend = diff > 0.5 ? "▲ Gained" : diff < -0.5 ? "▼ Lost" : "— Stable";
    html += `<div class="wgp-meta"><span class="wgp-meta-item">${trend} ${absDiff > 0.5 ? displayWeight(absDiff) : ""}</span><span class="wgp-meta-item">Tracking body composition</span></div>`;
  }

  div.innerHTML = html;
  container.appendChild(div);
}

function renderBodyMetrics(container) {
  const u = state.user || {};
  const entry = latestWeight();
  const weight = entry ? entry.weight : null;
  const bmi = u.height && weight ? (weight / ((u.height / 100) * (u.height / 100))).toFixed(1) : null;
  const targetWeight = u.targetWeight || null;

  const div = document.createElement("div");
  div.className = "body-card body-metrics";
  div.innerHTML = `
    <div class="bm-grid">
      <div class="bm-item"><span class="bm-value">${weight ? displayWeight(weight) : "—"}</span><span class="bm-label">Weight</span></div>
      <div class="bm-item"><span class="bm-value">${bmi ? "BMI " + bmi : "—"}</span><span class="bm-label">BMI</span></div>
      <div class="bm-item"><span class="bm-value">${targetWeight ? "Target " + displayWeight(targetWeight) : "—"}</span><span class="bm-label">Goal Weight</span></div>
    </div>`;
  container.appendChild(div);
}

function renderWeightTrend(container) {
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const change = weeklyWeightChange();
  const monthlyChg = monthlyWeightChange();

  const div = document.createElement("div");
  div.className = "body-card body-weight-trend";
  const changeCls = (val) => val !== null && val !== 0 ? (val > 0 ? " is-up" : " is-down") : "";
  const fmtChange = (val) => val !== null ? (val > 0 ? "+" : "") + val.toFixed(1) + " kg" : "—";
  div.innerHTML = `
    <div class="bw-header">
      <div class="bw-stat"><span class="bw-stat-label">Current</span><span class="bw-stat-value">${log.length > 0 ? displayWeight(log[log.length - 1].weight) : "—"}</span></div>
      <div class="bw-stat${changeCls(change)}"><span class="bw-stat-label">Weekly</span><span class="bw-stat-value">${fmtChange(change)}</span></div>
      <div class="bw-stat${changeCls(monthlyChg)}"><span class="bw-stat-label">Monthly</span><span class="bw-stat-value">${fmtChange(monthlyChg)}</span></div>
    </div>
    <div class="bw-chart-wrap"><canvas id="bodyWeightChart" style="width:100%;height:180px"></canvas></div>`;
  container.appendChild(div);

  if (bodyChartInstance) { bodyChartInstance.destroy(); bodyChartInstance = null; }
  const canvas = document.getElementById("bodyWeightChart");
  if (!canvas) return;
  if (log.length < 2) {
    canvas.style.display = "none";
    div.querySelector(".bw-chart-wrap").innerHTML = '<div class="bw-skeleton"><div class="bw-skel-line"></div><div class="bw-skel-line"></div><div class="bw-skel-line"></div><div class="bw-skel-text">Track your weight to unlock trends</div></div>';
    return;
  }
  canvas.style.display = "block";
  const recent = log.slice(-30);
  const labels = recent.map((e) => {
    const d = parseDateKey(e.date);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  });
  const data = recent.map((e) => e.weight);
  const ctx = canvas.getContext("2d");
  bodyChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ data, borderColor: "#00d26a", tension: 0.4, pointRadius: 2, pointBackgroundColor: "#00d26a", fill: { target: "origin", above: "rgba(0, 210, 106, 0.08)" } }] },
    options: {
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { ticks: { maxTicksLimit: 6, color: "#737373", font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: "#737373", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } },
      },
      maintainAspectRatio: false,
    },
  });
}

function renderWorkoutStreak(container) {
  const streak = state.workoutStreak || { currentStreak: 0, longestStreak: 0 };

  const div = document.createElement("div");
  div.className = "body-card body-streak";
  div.innerHTML = `
    <div class="str-grid">
      <div class="str-item"><span class="str-value">${streak.currentStreak || 0}</span><span class="str-label">Current Streak</span></div>
      <div class="str-item"><span class="str-value">${streak.longestStreak || 0}</span><span class="str-label">Longest Streak</span></div>
    </div>`;
  container.appendChild(div);
}

function renderConsistencyScore(container) {
  const sessions = state.sessions || [];
  const now = new Date();
  const thirtyDaysAgo = getDateKey(new Date(now.getTime() - 30 * 86400000));
  const finished = sessions.filter((s) => s.finishedAt && s.dateKey >= thirtyDaysAgo).length;
  const totalDays = 30;
  const pct = Math.min(100, Math.round((finished / totalDays) * 100));

  const div = document.createElement("div");
  div.className = "body-card body-consistency";
  const deg = (pct / 100) * 360;
  div.innerHTML = `
    <div class="cons-ring" style="background: conic-gradient(var(--accent) ${deg}deg, var(--surface-2) 0deg)">
      <div class="cons-ring-inner">${pct}%</div>
    </div>
    <div class="cons-info">
      <div class="cons-label">Consistency</div>
      <div class="cons-sub">${finished} / ${totalDays} days trained</div>
    </div>`;
  container.appendChild(div);
}

function renderProfileSummary(container) {
  const u = state.user || {};
  const entry = latestWeight();
  const weight = entry ? entry.weight : u.weight || null;
  const activePlan = loadCustomProgram() || plan;
  const splitName = activePlan.length > 0 ? activePlan.map((w) => w.name).join(", ") : "—";
  const goalDisplay = u.goal || "—";

  const fields = [
    { label: "Name", value: u.name || "—" },
    { label: "Age", value: u.age || "—" },
    { label: "Height", value: u.height ? displayHeight(u.height) : "—" },
    { label: "Weight", value: weight ? displayWeight(weight) : "—" },
    { label: "Goal", value: goalDisplay },
    { label: "Experience", value: u.experience || "—" },
    { label: "Split", value: splitName },
  ];

  const div = document.createElement("div");
  div.className = "body-card body-profile-summary";

  if (!state.user) {
    div.innerHTML = `<div class="body-empty-card"><div class="body-empty-title">No Profile Yet</div><p class="body-empty-text">Complete onboarding to set up your profile</p></div>`;
    container.appendChild(div);
    return;
  }

  div.innerHTML = `
    <div class="bps-label">Profile Summary</div>
    <div class="bps-grid">
      ${fields.map((f) => `<div class="bps-item"><span class="bps-item-label">${f.label}</span><span class="bps-item-value">${f.value}</span></div>`).join("")}
    </div>`;
  container.appendChild(div);
}

function renderEditGoalsBtn(container) {
  const div = document.createElement("div");
  div.className = "body-edit-goals";
  div.innerHTML = `<button class="beg-btn" id="bodyEditGoalBtn">Edit Goal</button>`;
  container.appendChild(div);
}



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
});

// ===== ONBOARDING =====

function isProfileComplete() {
  const u = state.user;
  return !!(u && u.name && u.name !== "Athlete" && u.age && u.height && u.weight);
}

// ===== ONBOARDING V2 (Multi-Step) =====
let onboardStep = 1;
let onboardData = {};

function openOnboarding(animateIn) {
  const modal = document.getElementById("onboardingModal");
  modal.classList.remove("is-hidden");
  if (animateIn) {
    modal.classList.add("animate-in");
    const onAnimEnd = () => { modal.classList.remove("animate-in"); modal.removeEventListener("animationend", onAnimEnd); };
    modal.addEventListener("animationend", onAnimEnd);
  }
  resetOnboarding();
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
  } else {
    modal.classList.add("is-hidden");
    if (callback) callback();
  }
}

function resetOnboarding() {
  onboardStep = 1;
  onboardData = {};
  document.getElementById("onboardStep1").style.display = "";
  document.getElementById("onboardStep2").style.display = "none";
  document.getElementById("onboardStep3").style.display = "none";
  document.getElementById("onboardStep4").style.display = "none";
  document.getElementById("onboardTitle").textContent = "Welcome to IronLog";
  document.getElementById("onboardSub").textContent = "Let's get to know you.";
  document.getElementById("onboardName").value = "";
  document.getElementById("onboardAge").value = "";
  document.getElementById("onboardHeight").value = "";
  document.getElementById("onboardWeight").value = "";
  document.getElementById("onboardTargetWeight").value = "";
  document.querySelectorAll(".onboard-chip").forEach((c) => c.classList.remove("is-active"));
  document.getElementById("onboardName").focus();
}

function onboardGoToStep(step) {
  document.getElementById("onboardStep1").style.display = step === 1 ? "" : "none";
  document.getElementById("onboardStep2").style.display = step === 2 ? "" : "none";
  document.getElementById("onboardStep3").style.display = step === 3 ? "" : "none";
  document.getElementById("onboardStep4").style.display = step === 4 ? "" : "none";

  if (step === 2) {
    document.getElementById("onboardTitle").textContent = "What's Your Goal?";
    document.getElementById("onboardSub").textContent = "We'll personalize your experience.";
  } else if (step === 3) {
    document.getElementById("onboardTitle").textContent = "Experience Level";
    document.getElementById("onboardSub").textContent = "So we can set the right intensity.";
  } else if (step === 4) {
    document.getElementById("onboardTitle").textContent = "Almost Done!";
    document.getElementById("onboardSub").textContent = "Final details for your profile.";
  } else {
    document.getElementById("onboardTitle").textContent = "Welcome to IronLog";
    document.getElementById("onboardSub").textContent = "Let's get to know you.";
  }

  onboardStep = step;
}

function saveOnboardData(data) {
  state.user = {
    name: (data.name || "Athlete").trim(),
    age: Number(data.age) || 0,
    height: Number(data.height) || 0,
    weight: Number(data.weight) || 0,
    goal: data.goal || "",
    experience: data.experience || "",
    trainingLocation: data.trainingLocation || "",
    targetWeight: Number(data.targetWeight) || 0,
  };
  if (data.goal) state.bodyGoal = data.goal;
  if (data.weight > 0) {
    if (!state.weightLog) state.weightLog = [];
    state.weightLog.push({ weight: Number(data.weight), date: getDateKey(), notes: "Initial", loggedAt: new Date().toISOString() });
  }
  if (data.targetWeight > 0 && data.weight > 0) {
    state.weightGoal = {
      startWeight: Number(data.weight),
      targetWeight: Number(data.targetWeight),
      goalType: mapGoalType(data.goal || ""),
      createdAt: new Date().toISOString(),
    };
  }
  saveState();
}

// Chip selection
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".onboard-chip");
  if (!chip) return;
  const parent = chip.closest(".onboard-options");
  if (!parent) return;
  parent.querySelectorAll(".onboard-chip").forEach((c) => c.classList.remove("is-active"));
  chip.classList.add("is-active");

  if (parent.id === "onboardGoalOptions") document.getElementById("onboardGoalNext").disabled = false;
  if (parent.id === "onboardExperienceOptions") document.getElementById("onboardExpNext").disabled = false;
  if (parent.id === "onboardLocationOptions") {
    const tw = document.getElementById("onboardTargetWeight").value;
    document.getElementById("onboardFinishBtn").disabled = !(Number(tw) > 0);
  }
});

// Step navigation
document.getElementById("onboardNextBtn")?.addEventListener("click", () => {
  const name = document.getElementById("onboardName").value.trim();
  const age = document.getElementById("onboardAge").value;
  const height = document.getElementById("onboardHeight").value;
  const weight = document.getElementById("onboardWeight").value;
  if (!name) { showToast("Please enter your name."); return; }
  if (!age || Number(age) <= 0) { showToast("Please enter a valid age."); return; }
  if (!height || Number(height) <= 0) { showToast("Please enter a valid height."); return; }
  if (!weight || Number(weight) <= 0) { showToast("Please enter a valid weight."); return; }
  onboardData.name = name;
  onboardData.age = Number(age);
  onboardData.height = Number(height);
  onboardData.weight = Number(weight);
  onboardGoToStep(2);
});

document.getElementById("onboardGoalBack")?.addEventListener("click", () => onboardGoToStep(1));
document.getElementById("onboardGoalNext")?.addEventListener("click", () => {
  const active = document.querySelector("#onboardGoalOptions .onboard-chip.is-active");
  if (!active) return;
  onboardData.goal = active.dataset.value;
  onboardGoToStep(3);
});

document.getElementById("onboardExpBack")?.addEventListener("click", () => onboardGoToStep(2));
document.getElementById("onboardExpNext")?.addEventListener("click", () => {
  const active = document.querySelector("#onboardExperienceOptions .onboard-chip.is-active");
  if (!active) return;
  onboardData.experience = active.dataset.value;
  onboardGoToStep(4);
});

document.getElementById("onboardTargetBack")?.addEventListener("click", () => onboardGoToStep(3));

document.getElementById("onboardTargetWeight")?.addEventListener("input", () => {
  const tw = document.getElementById("onboardTargetWeight").value;
  const loc = document.querySelector("#onboardLocationOptions .onboard-chip.is-active");
  document.getElementById("onboardFinishBtn").disabled = !(loc && Number(tw) > 0);
});

document.getElementById("onboardFinishBtn")?.addEventListener("click", () => {
  const activeLoc = document.querySelector("#onboardLocationOptions .onboard-chip.is-active");
  const targetWeight = document.getElementById("onboardTargetWeight").value;
  if (!activeLoc) { showToast("Please select where you train."); return; }
  if (!targetWeight || Number(targetWeight) <= 0) { showToast("Please enter a target weight."); return; }
  onboardData.trainingLocation = activeLoc.dataset.value;
  onboardData.targetWeight = targetWeight;
  saveOnboardData(onboardData);
  closeOnboarding(true, () => render());
});

// Skip
document.getElementById("onboardSkipBtn")?.addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.remove("is-hidden");
});
document.getElementById("onboardConfirmCancel")?.addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.add("is-hidden");
});
document.getElementById("onboardConfirmSkip")?.addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.add("is-hidden");
  saveOnboardData({ name: "Athlete", age: 0, height: 0, weight: 0, goal: "", experience: "", trainingLocation: "", targetWeight: 0 });
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
  document.getElementById("nwCreateBtn").disabled = true;
  document.getElementById("nwSearch").value = "";
  nwSearchTerm = "";
  nwActiveFilters = [];
  renderFilterChips();
  renderNewWorkoutList();
  document.getElementById("nwName").style.display = "none";
  document.getElementById("nwCreateBtn").style.display = "none";
  showScreen("screen-new-workout");
}

const NW_FILTERS = ["Chest", "Back", "Shoulders", "Triceps", "Biceps", "Legs", "Core"];
const NW_EQUIPMENT_FILTERS = ["Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight"];
const NW_TYPE_FILTERS = ["Compound", "Isolation"];

function renderFilterChips() {
  const bar = document.getElementById("nwFilterBar");
  let html = `<div class="nw-filter-section"><span class="nw-filter-label">Muscle</span><div class="nw-filter-row">`;
  html += NW_FILTERS.map(
    (f) => `<button class="nw-chip ${nwActiveFilters.includes(f) ? "is-active" : ""}" data-filter="${f}">${f}</button>`
  ).join("");
  html += `</div></div>`;
  html += `<div class="nw-filter-section"><span class="nw-filter-label">Equipment</span><div class="nw-filter-row">`;
  html += NW_EQUIPMENT_FILTERS.map(
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
  document.getElementById("nwCounter").textContent = total > 0 ? `0 of ${total} exercises selected` : "No exercises found";

  container.querySelectorAll(".nw-check").forEach((cb) => {
    cb.addEventListener("change", updateNwState);
  });

  const customBtn = document.getElementById("nwCustomBtn");
  if (customBtn) {
    customBtn.addEventListener("click", () => {
      openCustomExerciseModal(null);
    });
  }
}

function updateNwState() {
  const checked = document.querySelectorAll(".nw-check:checked");
  const count = checked.length;
  const nameInput = document.getElementById("nwName");
  const createBtn = document.getElementById("nwCreateBtn");
  nameInput.style.display = count === 0 ? "none" : "";
  createBtn.style.display = count === 0 ? "none" : "";
  document.getElementById("nwCounter").textContent = `${count} exercises selected`;
  updateNwCreateBtn();
}
function updateNwCreateBtn() {
  const checked = document.querySelectorAll(".nw-check:checked").length;
  const name = document.getElementById("nwName").value.trim();
  document.getElementById("nwCreateBtn").disabled = !checked || !name;
}

document.getElementById("nwSearch")?.addEventListener("input", (e) => {
  nwSearchTerm = e.target.value;
  renderNewWorkoutList();
});

document.getElementById("nwBackBtn").addEventListener("click", () => {
  showScreen("screen-home");
});
document.getElementById("nwName").addEventListener("input", updateNwCreateBtn);
document.getElementById("nwCreateBtn").addEventListener("click", () => {
  const workoutName = document.getElementById("nwName").value.trim();
  if (!workoutName) {
    showToast("Please enter a workout name.");
    return;
  }
  const checked = [...document.querySelectorAll(".nw-check:checked")];
  if (!checked.length) {
    showToast("Please select at least one exercise.");
    return;
  }

  const activePlan = loadCustomProgram() || [];
  if (activePlan.some(w => w.name.toLowerCase() === workoutName.toLowerCase())) {
    showToast("A workout with this name already exists.");
    return;
  }

  const exercises = checked.map((cb) => {
    const ex = EXERCISE_LIBRARY.find((e) => e.id === cb.dataset.id);
    return { name: ex.name, sets: 3, reps: 10, weight: "", notes: "" };
  });

  // Create workout
  const workout = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: workoutName,
    exercises,
  };
  activePlan.push(workout);
  localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
  state.plan = activePlan;
  saveState();

  showScreen("screen-home");
  renderHome();
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
  const ws = document.getElementById("screen-ws");
  if (ws && !ws.classList.contains("is-hidden")) {
    showScreen("screen-ws");
  } else {
    activateTab("sets");
  }
});

// Topbar gear icon → settings
document.getElementById("topbarSettingsBtn").addEventListener("click", () => {
  activateTab("settings");
});

function openProfileEditor() {
  const user = state.user || {};
  document.getElementById("peName").value = user.name || "";
  document.getElementById("peAge").value = user.age || "";
  document.getElementById("peGender").value = user.gender || "";
  document.getElementById("peHeight").value = user.height || "";
  document.getElementById("peWeight").value = user.weight || "";
  document.getElementById("peGoal").value = user.goal || state.bodyGoal || "recomp";
  document.getElementById("peActivity").value = user.activity || "";
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
  if (state.user.goal) state.bodyGoal = state.user.goal;
  if (state.weightGoal) {
    state.weightGoal.goalType = mapGoalType(state.user.goal);
  }
  saveState();
  document.getElementById("profileEditorModal").classList.add("is-hidden");
  renderHome();
  renderSettings();
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
    openProfileEditor();
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
  if (setting === "rep-inc") {
    const cur = state.repInc || 1;
    state.repInc = cur === 1 ? 2 : 1;
    saveState();
    renderSettings();
    return;
  }
  if (setting === "warmup-style") {
    state.warmupStyle = state.warmupStyle === "advanced" ? "simple" : "advanced";
    saveState();
    renderSettings();
    return;
  }
  if (setting === "cool-down-duration") {
    const opts = [3, 5, 8];
    const cur = state.coolDownDuration || 5;
    const next = opts[(opts.indexOf(cur) + 1) % opts.length];
    state.coolDownDuration = next;
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
  if (setting === "cal-goal" || setting === "protein-goal" || setting === "water-goal") {
    const val = prompt("Enter new value:", row.querySelector(".sg-row-val")?.textContent || "");
    if (!val) return;
    const num = parseInt(val);
    if (isNaN(num)) return;
    if (setting === "cal-goal") state.calorieTarget = num;
    if (setting === "protein-goal") state.proteinGoal = num;
    if (setting === "water-goal") state.waterGoal = num;
    saveState();
    renderSettings();
    return;
  }
  if (setting === "export-json") {
    const exportData = {
      sessions: state.sessions || [],
      nutrition: state.nutrition || {},
      user: state.user || null,
      plan: state.plan || null,

      weightLog: state.weightLog || [],
      goals: state.goals || [],
      recoveryLog: state.recoveryLog || [],
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
      show7dAvg: state.show7dAvg !== false,
      show30dAvg: state.show30dAvg !== false,
      progressPhotos: !!state.progressPhotos,
      bodyMeasurements: !!state.bodyMeasurements,
      weightReminder: !!state.weightReminder,
      nutritionReminder: !!state.nutritionReminder,
      weeklyReview: state.weeklyReview !== false,
      recoveryAnalysis: state.recoveryAnalysis !== false,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ironlog-export-${getDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          // Whitelist allowed keys and validate types
          const allowedKeys = new Set(["sessions", "plan", "customExercises", "user", "weightLog", "goals", "recoveryLog", "recoveryAnalysis", "warmupReminder", "showRecoveryAdvice"]);
          const arrayKeys = new Set(["sessions", "plan", "customExercises", "weightLog", "goals", "recoveryLog"]);
          const objKeys = new Set(["user", "recoveryAnalysis"]);
          const boolKeys = new Set(["warmupReminder", "showRecoveryAdvice"]);
          for (const key of Object.keys(data)) {
            if (!allowedKeys.has(key)) continue;
            if (arrayKeys.has(key) && !Array.isArray(data[key])) { data[key] = []; }
            if (objKeys.has(key) && (typeof data[key] !== "object" || data[key] === null || Array.isArray(data[key]))) { data[key] = null; }
            if (boolKeys.has(key) && typeof data[key] !== "boolean") { data[key] = true; }
          }
          Object.assign(state, data);
          saveState();
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

  // Goal radio change
  if (setting === "goal") {
    const sel = row.querySelector("input:checked");
    if (!sel) return;
    state.bodyGoal = sel.value;
    if (state.user) state.user.goal = sel.value;
    saveState();
    renderSettings();
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
    "screen-awake": "screenAwake",
    "weight-reminder": "weightReminder",
    "show-7d": "show7dAvg",
    "show-30d": "show30dAvg",
    "progress-photos": "progressPhotos",
    "body-measurements": "bodyMeasurements",
    "nutrition-reminder": "nutritionReminder",
    "compact-mode": "compactMode",
    "weekly-review": "weeklyReview",
    "auto-warmup": "autoWarmup",
    "warmup-reminder": "warmupReminder",
    "stretch-reminder": "stretchReminder",
    "auto-summary": "autoSummary",
    "auto-cooldown": "autoCooldown",
    "auto-advance-stretches": "autoAdvanceStretches",
    "show-workout-progress": "showWorkoutProgress",
    "show-tomorrow": "showTomorrowPreview",
    "show-recovery": "showRecoveryAdvice",
    "recovery-analysis": "recoveryAnalysis",
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
});

// Delete data modal (static elements)
document.getElementById("ddClose").addEventListener("click", () => {
  document.getElementById("deleteDataModal").classList.add("is-hidden");
});
document.getElementById("ddCancelBtn").addEventListener("click", () => {
  document.getElementById("deleteDataModal").classList.add("is-hidden");
});
document.getElementById("ddConfirmBtn").addEventListener("click", () => {
  const keys = [
    STORAGE_KEY, "wl_custom_program", "wl_prs", "nutrition_v2",
    "wl_bodylog", "wl_exercise_notes", "wl_fav_meals", "wl_recent_foods",
    "wl_fav_exercises", "wl_recent_exercises", "wl_profile", "wl_theme",
    "wl_preferred_unit", "wl_nutrition_mode", "wl_generator_profile", "wt_autosave",
  ];
  // Gather all date-prefixed keys
  const allKeys = Object.keys(localStorage);
  allKeys.forEach((k) => {
    if (k.startsWith("wl_meals_") || k.startsWith("wl_water_")) keys.push(k);
  });
  keys.forEach((k) => localStorage.removeItem(k));
  location.reload();
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
  activateTab("sessions");
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
    startStopwatch();
  }

  if (!state.user) {
    openOnboarding(true);
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
    openProfileEditor();
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
  saveBodyLogEntry({ date: getDateKey(), weight: w });
  document.getElementById("weightLogSheet").classList.add("is-hidden");
  renderHome();
  renderBodyTab();
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
  const map = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
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

// --- Generator State ---
const genState = { step: 1, goal: null, experience: null, days: null, split: null };

// --- Helpers ---
function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

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

function selectExercisesForDay(goal, experience, splitDay, usedInCycle) {
  const categories = getCategoriesForDay(splitDay);
  let candidates = EXERCISE_LIBRARY.filter(e => categories.includes(e.category));
  candidates = filterByExperience(candidates, experience);
  const scored = candidates.map(e => ({ exercise: e, score: scoreExercise(e, goal, usedInCycle) }));
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

  const range = EX_COUNT_RANGE[experience] || EX_COUNT_RANGE.Intermediate;
  const count = Math.min(randInt(range.min, range.max), scored.length);
  const ratios = GOAL_RATIOS[goal] || GOAL_RATIOS["General Fitness"];

  let compounds = scored.filter(s => isCompound(s.exercise.name) && s.score > 0);
  let isolations = scored.filter(s => !isCompound(s.exercise.name) && !isConditioning(s.exercise) && s.score > 0);
  let conditioningPool = EXERCISE_LIBRARY.filter(e => isConditioning(e));
  conditioningPool = filterByExperience(conditioningPool, experience);
  let conditioning = conditioningPool
    .map(e => ({ exercise: e, score: scoreExercise(e, goal, usedInCycle) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || Math.random() - 0.5);

  const nComp = Math.round(count * ratios.compound);
  const nIso = Math.round(count * ratios.isolation);
  const nCond = count - nComp - nIso;

  const pick = (arr, n) => {
    const result = [];
    const pool = [...arr];
    for (let i = 0; i < n && pool.length > 0; i++) {
      result.push(pool.shift());
    }
    return result;
  };

  const picked = [
    ...pick(compounds, nComp),
    ...pick(isolations, nIso),
    ...pick(conditioning, nCond),
  ];

  const sets = EXP_SETS[experience] || EXP_SETS.Intermediate;
  return picked.map(s => ({
    name: s.exercise.name,
    sets,
    reps: getRepTarget(goal, s.exercise.name),
    weight: "",
  }));
}

function generateWeeklySchedule(goal, experience, split, days) {
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
      const exercises = selectExercisesForDay(goal, experience, splitDay, usedInCycle);
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

function getBestSplit(goal) {
  let best = SPLIT_ORDER[0], bestScore = -1;
  SPLIT_ORDER.forEach(s => {
    const sc = getSplitScore(s, goal);
    if (sc > bestScore) { bestScore = sc; best = s; }
  });
  return best;
}

function getSortedSplits(goal) {
  return SPLIT_ORDER.map(s => ({ name: s, score: getSplitScore(s, goal), rec: SPLIT_RECOMMENDATIONS[s] }))
    .sort((a, b) => b.score - a.score);
}

// --- Step Renderers ---
function renderStep1() {
  const body = document.getElementById("gmBody");
  document.getElementById("gmStepTitle").textContent = "What's your goal?";
  let html = "";
  Object.entries(GOAL_META).forEach(([key, val]) => {
    const active = genState.goal === key ? " is-active" : "";
    html += `<div class="gw-option${active}" data-gw-goal="${key}">
      <div class="gw-option-icon">${val.icon}</div>
      <div class="gw-option-content">
        <div class="gw-option-title">${key}</div>
        <div class="gw-option-desc">${val.desc}</div>
      </div>
    </div>`;
  });
  body.innerHTML = html;
  body.querySelectorAll(".gw-option").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gw-option").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.goal = el.dataset.gwGoal;
    });
  });
}

function renderStep2() {
  const body = document.getElementById("gmBody");
  document.getElementById("gmStepTitle").textContent = "Experience Level";
  let html = "";
  Object.entries(EXP_META).forEach(([key, val]) => {
    const active = genState.experience === key ? " is-active" : "";
    html += `<div class="gw-option${active}" data-gw-exp="${key}">
      <div class="gw-option-content">
        <div class="gw-option-title">${key}</div>
        <div class="gw-option-desc">${val.desc}</div>
      </div>
    </div>`;
  });
  body.innerHTML = html;
  body.querySelectorAll(".gw-option").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gw-option").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.experience = el.dataset.gwExp;
    });
  });
}

function renderStep3() {
  const body = document.getElementById("gmBody");
  document.getElementById("gmStepTitle").textContent = "Training Days Per Week";
  const options = [3, 4, 5, 6];
  let html = `<div class="gw-days-grid">`;
  options.forEach(d => {
    const active = genState.days === d ? " is-active" : "";
    html += `<div class="gw-day-card${active}" data-gw-days="${d}">
      <div class="gw-day-num">${d}</div>
      <div class="gw-day-label">days / week</div>
    </div>`;
  });
  html += `</div>`;
  body.innerHTML = html;
  body.querySelectorAll(".gw-day-card").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gw-day-card").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.days = parseInt(el.dataset.gwDays);
    });
  });
}

function renderStep4() {
  const body = document.getElementById("gmBody");
  document.getElementById("gmStepTitle").textContent = "Choose Your Split";
  const sorted = getSortedSplits(genState.goal);
  const bestName = sorted[0].name;
  let html = "";
  sorted.forEach((s, i) => {
    const active = genState.split === s.name ? " is-active" : "";
    const recommended = s.name === bestName ? " is-recommended" : "";
    const badge = s.name === bestName ? '<span class="gw-split-badge">⭐ Recommended</span>' : "";
    const note = s.name === bestName ? '<div class="gw-split-note">Best match for your goal.</div>' : "";
    html += `<div class="gw-split-card${active}${recommended}" data-gw-split="${s.name}">
      <div class="gw-split-top">
        <span class="gw-split-name">${s.name}</span>
        <span class="gw-split-pct">${s.score}% match</span>
      </div>
      <div class="gw-split-desc">${s.rec.desc}</div>
      ${badge}${note}
    </div>`;
  });
  body.innerHTML = html;
  body.querySelectorAll(".gw-split-card").forEach(el => {
    el.addEventListener("click", () => {
      body.querySelectorAll(".gw-split-card").forEach(c => c.classList.remove("is-active"));
      el.classList.add("is-active");
      genState.split = el.dataset.gwSplit;
    });
  });
}

function renderStep5() {
  const body = document.getElementById("gmBody");
  document.getElementById("gmStepTitle").textContent = "Program Review";
  const schedule = generateWeeklySchedule(genState.goal, genState.experience, genState.split, genState.days);
  genState.schedule = schedule;
  const totWorkouts = schedule.filter(d => d.type === "workout").length;
  let html = `<div class="gw-review-summary">
    <strong>${genState.split}</strong> · ${totWorkouts} days/week · ${genState.experience} · ${genState.goal}<br>
    Exercises per workout: ${EX_COUNT_RANGE[genState.experience].min}-${EX_COUNT_RANGE[genState.experience].max}
  </div>`;
  schedule.forEach(d => {
    if (d.type === "workout") {
      html += `<div class="gw-review-day">
        <div class="gw-review-day-header">
          <span>${DAY_LABELS[d.day]} · ${d.name}</span>
          <span class="gw-day-tag">Workout</span>
        </div>`;
      d.exercises.forEach(ex => {
        html += `<div class="gw-review-ex">
          <span class="gw-review-ex-name">${ex.name}</span>
          <span class="gw-review-ex-meta">${ex.sets}×${ex.reps}</span>
        </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="gw-review-day">
        <div class="gw-review-day-header">
          <span>${DAY_LABELS[d.day]} · Recovery</span>
          <span class="gw-day-tag is-recovery">Recovery</span>
        </div>
        <div class="gw-review-recovery">
          <div class="gw-review-recovery-title">${d.icon} ${d.title}</div>
          <div class="gw-review-recovery-desc">${d.desc}</div>
        </div>
      </div>`;
    }
  });
  body.innerHTML = html;
}

// --- Wizard Navigation ---
function goToStep(step) {
  genState.step = step;
  const backBtn = document.getElementById("gmBackBtn");
  const nextBtn = document.getElementById("gmNextBtn");
  backBtn.style.display = step === 1 ? "none" : "";
  if (step === 5) {
    nextBtn.textContent = "Save Program";
  } else {
    nextBtn.textContent = "Next";
  }
  document.getElementById("gmStepBadge").textContent = `Step ${step} of 5`;
  switch (step) {
    case 1: renderStep1(); break;
    case 2: renderStep2(); break;
    case 3: renderStep3(); break;
    case 4: renderStep4(); break;
    case 5: renderStep5(); break;
  }
}

function nextStep() {
  const s = genState.step;
  if (s === 1 && !genState.goal) { showToast("Select a goal to continue."); return; }
  if (s === 2 && !genState.experience) { showToast("Select your experience level."); return; }
  if (s === 3 && !genState.days) { showToast("Select training days."); return; }
  if (s === 4 && !genState.split) { showToast("Select a workout split."); return; }
  if (s === 5) { saveGeneratedProgram(); return; }
  goToStep(s + 1);
}

function prevStep() {
  if (genState.step > 1) goToStep(genState.step - 1);
}

// --- Open / Cancel ---
function openGenerateWorkout() {
  const u = state.user;
  genState.step = 1;
  genState.goal = (u && u.goal) || null;
  genState.experience = (u && u.experience) || null;
  genState.days = (u && u.trainingDays) || null;
  genState.split = null;
  genState.schedule = null;
  document.getElementById("generateModal").classList.remove("is-hidden");
  goToStep(1);
}

// --- Save ---
function saveGeneratedProgram() {
  const schedule = genState.schedule;
  if (!schedule) return;
  const workouts = schedule.filter(d => d.type === "workout");
  const programName = `${genState.split} (${genState.goal})`;
  let activePlan = loadCustomProgram() || [];
  let hasDup = false;
  workouts.forEach(gw => {
    const wName = DayLabel(gw.day) + " · " + gw.name;
    if (activePlan.some(w => w.name.toLowerCase() === wName.toLowerCase())) hasDup = true;
  });
  if (hasDup) { showToast("A workout with this name already exists."); return; }
  workouts.forEach(gw => {
    const wName = DayLabel(gw.day) + " · " + gw.name;
    const workout = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: wName,
      exercises: gw.exercises.map(ex => ({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: "", notes: "" })),
    };
    activePlan.push(workout);
  });
  localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
  state.plan = activePlan;
  saveState();
  const profile = {
    goal: genState.goal,
    experience: genState.experience,
    split: genState.split,
    days: genState.days,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem("wl_generator_profile", JSON.stringify(profile));
  document.getElementById("generateModal").classList.add("is-hidden");
  showScreen("screen-home");
  renderHome();
  showToast(`Program "${programName}" created (${workouts.length} workouts)`);
}

function DayLabel(dayIndex) { return DAY_NAMES[dayIndex] || "Day " + (dayIndex + 1); }

// --- Event Listeners ---
document.getElementById("gmNextBtn")?.addEventListener("click", nextStep);
document.getElementById("gmBackBtn")?.addEventListener("click", prevStep);
document.getElementById("gmCancelBtn")?.addEventListener("click", () => {
  document.getElementById("generateModal").classList.add("is-hidden");
});
