const STORAGE_KEY = "workout-tracker-v3";
const PROTEIN_GOAL = 146;
const CARBS_GOAL = 240;
const FAT_GOAL = 65;
const CAL_GOAL = 2100;
const WATER_TARGET = 3000;
const DEFAULT_REST = 90;
let nwPendingExercises = [];

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
        { bar: Math.round((w * 0.5) / 2.5) * 2.5 || 5, reps: 10, pct: "50%" },
        { bar: Math.round((w * 0.75) / 2.5) * 2.5 || 10, reps: 10, pct: "75%" },
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
      warmups = [{ bar: Math.round((w * 0.5) / 2.5) * 2.5 || 5, reps: 10, pct: "50%" }];
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

const plan = [
  {
    id: "push-heavy",
    name: "Push (Heavy)",
    focus: "Heavy pressing with focused triceps and lateral delt work.",
    day: "Day 1",
    duration: "75-80 min",
    rest: "3-4 min on big presses, 60 sec between triceps superset pairs.",
    exercises: [
      {
        name: "Flat Barbell Bench Press",
        sets: 4,
        reps: 6,
        repTarget: "4-6",
        weight: "",
        priority: true,
        tip: "Scapula retracted, slight arch, feet flat, 3 sec negative.",
      },
      { name: "Incline Dumbbell Press", sets: 3, reps: 8, repTarget: "6-8", weight: "", tip: "Use a 30 degree incline, pause in the bottom stretch." },
      { name: "Landmine Press", sets: 3, reps: 8, repTarget: "8", weight: "", tip: "Shoulder-safe press, one arm at a time, drive through heel of palm." },
      { name: "Cable Lateral Raise", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Low pulley behind body, lead with elbow, use full range." },
      {
        name: "Cable Overhead Tricep Extension",
        sets: 3,
        reps: 10,
        repTarget: "10",
        weight: "",
        superset: "Pair with rope pushdown.",
        tip: "Full long-head stretch at the top, 3 sec negative.",
      },
      {
        name: "Tricep Rope Pushdown",
        sets: 3,
        reps: 12,
        repTarget: "12",
        weight: "",
        superset: "Pair with overhead extension.",
        tip: "Elbows pinned, full lockout, 60 sec rest after the pair.",
      },
    ],
  },
  {
    id: "pull-heavy",
    name: "Pull (Heavy)",
    focus: "Heavy deadlift and vertical pull work with rear delt volume.",
    day: "Day 2",
    duration: "80-85 min",
    rest: "3-4 min on deadlift and heavy pulls.",
    exercises: [
      {
        name: "Conventional Deadlift",
        sets: 4,
        reps: 5,
        repTarget: "3-5",
        weight: "",
        priority: true,
        tip: "First exercise. Brace 360, lats engaged, drive the floor away.",
      },
      {
        name: "Weighted Pull-Up / Lat Pulldown",
        sets: 4,
        reps: 6,
        repTarget: "4-6",
        weight: "",
        priority: true,
        tip: "Pull elbows to hips, 3 sec negative, lat width is priority.",
      },
      { name: "Chest-Supported Dumbbell Row", sets: 3, reps: 10, repTarget: "8-10", weight: "", tip: "Bench at 30 degrees, drive elbows past torso." },
      {
        name: "Face Pulls",
        sets: 4,
        reps: 15,
        repTarget: "15",
        weight: "",
        priority: true,
        tip: "Every pull session. Rope to forehead with external rotation.",
      },
      { name: "Incline Dumbbell Curl", sets: 3, reps: 10, repTarget: "8-10", weight: "", tip: "Full stretch at bottom, slow negative." },
      {
        name: "Farmer's Carry",
        sets: 3,
        reps: 1,
        repTarget: "20-30m length",
        weight: "",
        priority: true,
        tip: "Heaviest dumbbells, locked wrists, grip and forearm finisher.",
      },
    ],
  },
  {
    id: "legs-quad",
    name: "Legs (Quad Focus)",
    focus: "Quad-biased squatting and leg press with hamstring support.",
    day: "Day 3",
    duration: "75-80 min",
    rest: "3-4 min on box squat, controlled tempo on accessories.",
    exercises: [
      {
        name: "Box Squat to Parallel",
        sets: 4,
        reps: 6,
        repTarget: "4-6",
        weight: "",
        priority: true,
        tip: "To bench only, not below parallel until knee is pain-free 4+ weeks.",
      },
      { name: "Romanian Deadlift", sets: 3, reps: 10, repTarget: "10", weight: "", tip: "Lighter than Pull A, hamstring stretch, 1 sec pause." },
      { name: "Leg Press (Feet High)", sets: 3, reps: 12, repTarget: "10-12", weight: "", tip: "High foot placement, do not lock out at top." },
      { name: "Seated Leg Curl", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Slow negative, full stretch at bottom." },
      { name: "Standing Calf Raise", sets: 4, reps: 20, repTarget: "20", weight: "", tip: "Full range, 2 sec stretch pause, 4 sec negative." },
    ],
  },
  {
    id: "push-volume",
    name: "Push (Volume)",
    focus: "Higher-rep pressing volume with shoulder and triceps finishers.",
    day: "Day 4",
    duration: "80-85 min",
    rest: "60-90 sec on isolations, 60 sec between triceps superset pairs.",
    exercises: [
      {
        name: "Flat Barbell Bench Press",
        sets: 4,
        reps: 10,
        repTarget: "8-10",
        weight: "",
        priority: true,
        tip: "Same movement as A day, more reps, harder negative.",
      },
      { name: "Incline Dumbbell Press", sets: 3, reps: 12, repTarget: "10-12", weight: "", tip: "Pause at bottom stretch 1 sec." },
      { name: "Cable Lateral Raise", sets: 4, reps: 15, repTarget: "15", weight: "", tip: "Constant tension, 3 sec negative, burn them out." },
      {
        name: "Seated Dumbbell Shoulder Press",
        sets: 3,
        reps: 12,
        repTarget: "12",
        weight: "",
        tip: "Neutral grip, elbows slightly in front for shoulder safety.",
      },
      {
        name: "Cable Overhead Tricep Extension",
        sets: 3,
        reps: 15,
        repTarget: "12-15",
        weight: "",
        superset: "Pair with rope pushdown.",
        tip: "Higher-rep long-head triceps work.",
      },
      {
        name: "Tricep Rope Pushdown",
        sets: 3,
        reps: 15,
        repTarget: "15",
        weight: "",
        superset: "Pair with overhead extension.",
        tip: "Elbows pinned, chase the pump.",
      },
    ],
  },
  {
    id: "pull-volume",
    name: "Pull (Volume)",
    focus: "Back volume, traps, rear delts, and layered biceps work.",
    day: "Day 5",
    duration: "85-90 min",
    rest: "60-90 sec on volume pulls and arms.",
    exercises: [
      {
        name: "Lat Pulldown / Pull-Up",
        sets: 4,
        reps: 10,
        repTarget: "8-10",
        weight: "",
        priority: true,
        tip: "Full range, 3 sec negative, squeeze at bottom.",
      },
      { name: "Seated Cable Row", sets: 4, reps: 12, repTarget: "12", weight: "", tip: "Narrow grip, hard squeeze at end range." },
      { name: "Face Pulls", sets: 4, reps: 15, repTarget: "15", weight: "", priority: true, tip: "Shoulder health. Light and controlled." },
      { name: "Barbell Shrug", sets: 4, reps: 12, repTarget: "12", weight: "", priority: true, tip: "Straight up, hold 1 sec, straight down. Never roll." },
      { name: "Hammer Curl", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Brachialis and arm thickness, no swinging." },
      { name: "Incline Dumbbell Curl", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Extra arm volume, full stretch, slow negative." },
      { name: "Reverse Curl", sets: 3, reps: 15, repTarget: "15", weight: "", tip: "Overhand grip, brachioradialis and forearm extensor finisher." },
    ],
  },
  {
    id: "legs-hamstring",
    name: "Legs (Hamstring Focus)",
    focus: "Heavy hinge work with hamstring volume and lighter squat practice.",
    day: "Day 6",
    duration: "75-80 min",
    rest: "3-4 min on heavy RDL, controlled tempo on hamstring work.",
    exercises: [
      {
        name: "Romanian Deadlift (Heavy)",
        sets: 4,
        reps: 8,
        repTarget: "6-8",
        weight: "",
        priority: true,
        tip: "Primary movement today, heavier than Wednesday.",
      },
      { name: "Leg Press (Feet High)", sets: 4, reps: 15, repTarget: "12-15", weight: "", tip: "Pause at bottom for glute stretch." },
      { name: "Seated Leg Curl", sets: 4, reps: 12, repTarget: "10-12", weight: "", tip: "Heavier than Wednesday, 4 sec negative." },
      { name: "Box Squat (Light)", sets: 3, reps: 10, repTarget: "10", weight: "", tip: "Volume-focused second squat exposure." },
      { name: "Standing Calf Raise", sets: 4, reps: 20, repTarget: "20", weight: "", tip: "Full range, 2 sec stretch pause, 4 sec negative." },
    ],
  },
];

const EXERCISE_LIBRARY = [
  // CHEST
  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Barbell",
  },
  {
    id: "incline-barbell-bench-press",
    name: "Incline Barbell Bench Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Barbell",
  },
  {
    id: "decline-bench-press",
    name: "Decline Bench Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Barbell",
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Dumbbell",
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Dumbbell",
  },
  {
    id: "decline-dumbbell-press",
    name: "Decline Dumbbell Press",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Dumbbell",
  },
  { id: "machine-chest-press", name: "Machine Chest Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Machine" },
  { id: "chest-fly-machine", name: "Chest Fly Machine", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Machine" },
  { id: "cable-fly", name: "Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: "Cable" },
  { id: "push-ups", name: "Push Ups", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: "Bodyweight" },
  {
    id: "weighted-push-ups",
    name: "Weighted Push Ups",
    category: "Chest",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Front Delts"],
    equipment: "Bodyweight",
  },
  { id: "dips", name: "Dips", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: "Bodyweight" },
  // SHOULDERS
  {
    id: "overhead-press",
    name: "Overhead Press",
    category: "Shoulders",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Side Delts", "Triceps"],
    equipment: "Barbell",
  },
  {
    id: "seated-dumbbell-press",
    name: "Seated Dumbbell Press",
    category: "Shoulders",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Side Delts", "Triceps"],
    equipment: "Dumbbell",
  },
  {
    id: "arnold-press",
    name: "Arnold Press",
    category: "Shoulders",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Side Delts", "Triceps"],
    equipment: "Dumbbell",
  },
  { id: "lateral-raises", name: "Lateral Raises", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "cable-lateral-raises", name: "Cable Lateral Raises", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: [], equipment: "Cable" },
  { id: "front-raises", name: "Front Raises", category: "Shoulders", primaryMuscle: "Front Delts", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "rear-delt-fly", name: "Rear Delt Fly", category: "Shoulders", primaryMuscle: "Rear Delts", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "face-pulls", name: "Face Pulls", category: "Shoulders", primaryMuscle: "Rear Delts", secondaryMuscles: ["Traps"], equipment: "Cable" },
  {
    id: "machine-shoulder-press",
    name: "Machine Shoulder Press",
    category: "Shoulders",
    primaryMuscle: "Front Delts",
    secondaryMuscles: ["Triceps"],
    equipment: "Machine",
  },
  { id: "upright-row", name: "Upright Row", category: "Shoulders", primaryMuscle: "Side Delts", secondaryMuscles: ["Traps"], equipment: "Barbell" },
  // BACK
  { id: "pull-ups", name: "Pull Ups", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: "Bodyweight" },
  { id: "chin-ups", name: "Chin Ups", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: "Bodyweight" },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: "Cable" },
  { id: "wide-grip-pulldown", name: "Wide Grip Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Cable" },
  { id: "close-grip-pulldown", name: "Close Grip Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Biceps"], equipment: "Cable" },
  { id: "barbell-row", name: "Barbell Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Barbell" },
  { id: "pendlay-row", name: "Pendlay Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats"], equipment: "Barbell" },
  { id: "t-bar-row", name: "T Bar Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats", "Biceps"], equipment: "Barbell" },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    category: "Back",
    primaryMuscle: "Middle Back",
    secondaryMuscles: ["Lats", "Biceps"],
    equipment: "Cable",
  },
  {
    id: "single-arm-dumbbell-row",
    name: "Single Arm Dumbbell Row",
    category: "Back",
    primaryMuscle: "Lats",
    secondaryMuscles: ["Middle Back", "Biceps"],
    equipment: "Dumbbell",
  },
  { id: "machine-row", name: "Machine Row", category: "Back", primaryMuscle: "Middle Back", secondaryMuscles: ["Lats"], equipment: "Machine" },
  { id: "straight-arm-pulldown", name: "Straight Arm Pulldown", category: "Back", primaryMuscle: "Lats", secondaryMuscles: ["Triceps"], equipment: "Cable" },
  // BICEPS
  { id: "barbell-curl", name: "Barbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell" },
  { id: "ez-bar-curl", name: "EZ Bar Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell" },
  { id: "dumbbell-curl", name: "Dumbbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell" },
  { id: "hammer-curl", name: "Hammer Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Dumbbell" },
  { id: "incline-curl", name: "Incline Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "cable-curl", name: "Cable Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Cable" },
  { id: "preacher-curl", name: "Preacher Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: "Barbell" },
  { id: "concentration-curl", name: "Concentration Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "spider-curl", name: "Spider Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "reverse-curl", name: "Reverse Curl", category: "Biceps", primaryMuscle: "Forearms", secondaryMuscles: ["Biceps"], equipment: "Barbell" },
  // TRICEPS
  { id: "cable-pushdown", name: "Cable Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable" },
  { id: "rope-pushdown", name: "Rope Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable" },
  {
    id: "overhead-tricep-extension",
    name: "Overhead Tricep Extension",
    category: "Triceps",
    primaryMuscle: "Triceps",
    secondaryMuscles: [],
    equipment: "Cable",
  },
  { id: "skull-crushers", name: "Skull Crushers", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Barbell" },
  {
    id: "close-grip-bench-press",
    name: "Close Grip Bench Press",
    category: "Triceps",
    primaryMuscle: "Triceps",
    secondaryMuscles: ["Chest", "Front Delts"],
    equipment: "Barbell",
  },
  { id: "bench-dips", name: "Bench Dips", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Bodyweight" },
  { id: "machine-dip", name: "Machine Dip", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Machine" },
  { id: "single-arm-pushdown", name: "Single Arm Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Cable" },
  { id: "tricep-kickback", name: "Tricep Kickback", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "jm-press", name: "JM Press", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: "Barbell" },
  // LEGS
  { id: "back-squat", name: "Back Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Barbell" },
  { id: "front-squat", name: "Front Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Barbell" },
  { id: "hack-squat", name: "Hack Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Machine" },
  { id: "leg-press", name: "Leg Press", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Machine" },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    category: "Legs",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Dumbbell",
  },
  { id: "walking-lunges", name: "Walking Lunges", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbell" },
  { id: "romanian-deadlift", name: "Romanian Deadlift", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Barbell" },
  { id: "stiff-leg-deadlift", name: "Stiff Leg Deadlift", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: "Barbell" },
  { id: "leg-extension", name: "Leg Extension", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: [], equipment: "Machine" },
  { id: "leg-curl", name: "Leg Curl", category: "Legs", primaryMuscle: "Hamstrings", secondaryMuscles: [], equipment: "Machine" },
  { id: "goblet-squat", name: "Goblet Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: "Dumbbell" },
  { id: "step-ups", name: "Step Ups", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbell" },
  // GLUTES
  { id: "hip-thrust", name: "Hip Thrust", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Barbell" },
  { id: "glute-bridge", name: "Glute Bridge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: "Bodyweight" },
  { id: "cable-kickback", name: "Cable Kickback", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: [], equipment: "Cable" },
  {
    id: "smith-machine-hip-thrust",
    name: "Smith Machine Hip Thrust",
    category: "Glutes",
    primaryMuscle: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    equipment: "Machine",
  },
  { id: "reverse-lunge", name: "Reverse Lunge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Quads", "Hamstrings"], equipment: "Dumbbell" },
  // CALVES
  { id: "standing-calf-raise", name: "Standing Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine" },
  { id: "seated-calf-raise", name: "Seated Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine" },
  { id: "leg-press-calf-raise", name: "Leg Press Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine" },
  { id: "single-leg-calf-raise", name: "Single Leg Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Bodyweight" },
  { id: "donkey-calf-raise", name: "Donkey Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: "Machine" },
  // ABS
  { id: "crunch", name: "Crunch", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: [], equipment: "Bodyweight" },
  { id: "cable-crunch", name: "Cable Crunch", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: [], equipment: "Cable" },
  { id: "machine-crunch", name: "Machine Crunch", category: "Abs", primaryMuscle: "Upper Abs", secondaryMuscles: [], equipment: "Machine" },
  { id: "leg-raise", name: "Leg Raise", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight" },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: ["Upper Abs"], equipment: "Bodyweight" },
  { id: "reverse-crunch", name: "Reverse Crunch", category: "Abs", primaryMuscle: "Lower Abs", secondaryMuscles: [], equipment: "Bodyweight" },
  { id: "plank", name: "Plank", category: "Abs", primaryMuscle: "Core", secondaryMuscles: [], equipment: "Bodyweight" },
  { id: "ab-wheel-rollout", name: "Ab Wheel Rollout", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Upper Abs"], equipment: "Bodyweight" },
  { id: "russian-twist", name: "Russian Twist", category: "Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Core"], equipment: "Bodyweight" },
  { id: "mountain-climbers", name: "Mountain Climbers", category: "Abs", primaryMuscle: "Core", secondaryMuscles: ["Hip Flexors"], equipment: "Bodyweight" },
  // FOREARMS
  { id: "wrist-curl", name: "Wrist Curl", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "reverse-wrist-curl", name: "Reverse Wrist Curl", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Dumbbell" },
  { id: "farmer-carry", name: "Farmer Carry", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: ["Traps"], equipment: "Dumbbell" },
  { id: "behind-back-wrist-curl", name: "Behind Back Wrist Curl", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Barbell" },
  { id: "plate-pinch-hold", name: "Plate Pinch Hold", category: "Forearms", primaryMuscle: "Forearms", secondaryMuscles: [], equipment: "Other" },
  // FULL BODY
  {
    id: "deadlift",
    name: "Deadlift",
    category: "Full Body",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Lower Back", "Forearms"],
    equipment: "Barbell",
  },
  {
    id: "power-clean",
    name: "Power Clean",
    category: "Full Body",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Hamstrings", "Traps", "Core"],
    equipment: "Barbell",
  },
  {
    id: "clean-and-press",
    name: "Clean and Press",
    category: "Full Body",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Quads", "Triceps", "Core"],
    equipment: "Barbell",
  },
  { id: "thruster", name: "Thruster", category: "Full Body", primaryMuscle: "Quads", secondaryMuscles: ["Shoulders", "Core"], equipment: "Barbell" },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    category: "Full Body",
    primaryMuscle: "Glutes",
    secondaryMuscles: ["Hamstrings", "Core"],
    equipment: "Kettlebell",
  },
  { id: "burpee", name: "Burpee", category: "Full Body", primaryMuscle: "Core", secondaryMuscles: ["Quads", "Chest", "Shoulders"], equipment: "Bodyweight" },
];

const EXERCISE_CATEGORIES = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Legs", "Glutes", "Calves", "Abs", "Forearms", "Full Body"];

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
    workoutGroups: [],
    weightLog: [],
    goals: [],
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
  };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
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
  return state.sessions.find((item) => item.dateKey === getDateKey()) || null;
}

function startSessionForWorkout(workoutId) {
  const today = getDateKey();
  const existing = state.sessions.find((item) => item.dateKey === today);
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === workoutId);
  if (!workout) return getTodaySession() || existing;
  if (existing && existing.workoutId === workoutId) return existing;
  const session = {
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
  return session;
}

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
  try {
    return JSON.parse(localStorage.getItem("wl_bodylog")) || [];
  } catch {
    return [];
  }
}
function saveBodyLogEntry(entry) {
  const log = loadBodyLog();
  const idx = log.findIndex((e) => e.date === entry.date);
  if (idx >= 0) log[idx] = entry;
  else log.push(entry);
  try {
    localStorage.setItem("wl_bodylog", JSON.stringify(log));
  } catch {}
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

function getRecoveryStatus(daysAgo) {
  if (daysAgo === 0) return "trained";
  if (daysAgo <= 1) return "low";
  if (daysAgo <= 3) return "recovering";
  return "recovered";
}

function getStrengthTrend(muscleId) {
  // Look at exercises targeting this muscle across last 2 session pairs
  const exercises = MUSCLE_GROUPS.filter((m) => m.id === muscleId).flatMap((m) =>
    Object.entries(EXERCISE_MUSCLE_CONTRIBUTION)
      .filter(([, c]) => c.some((x) => x.id === m.id))
      .map(([name]) => name),
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

function getCoverageColor(muscleId, mode, summary) {
  const data = summary[muscleId];
  const sets = data ? data.weeklySets : 0;
  if (mode === "today") return data && data.doneToday ? "#00d26a" : "#3a3a3a";
  if (mode === "month") return sets === 0 ? "#3a3a3a" : `hsl(140, 70%, ${30 + Math.min(sets / 12, 1) * 30}%)`;
  if (sets === 0) return "#3a3a3a";
  return `hsl(140, 70%, ${30 + Math.min(sets / 12, 1) * 30}%)`;
}

let bodyMapMode = "week";

// ===== SVG BODY MAP RENDERER =====
function renderBodyMuscleMap(container, summary) {
  container.innerHTML = `<div class="body-map-layout"><div class="body-view">${BODY_MAP_SVG}</div></div>`;

  container.querySelectorAll("[data-muscle]").forEach((path) => {
    const detailedId = path.dataset.muscle;
    const groupId = MUSCLE_GROUP_MAP[detailedId] || detailedId;
    const color = getCoverageColor(groupId, bodyMapMode, summary);
    const data = summary[groupId];
    const sets = data ? data.weeklySets : 0;
    path.setAttribute("fill", color);
    path.setAttribute("fill-opacity", sets > 0 ? "0.85" : "0.3");
    path.style.cursor = "pointer";
    path.addEventListener("click", (e) => {
      e.stopPropagation();
      showMuscleSheet(detailedId, summary);
    });
  });
}

// ===== BOTTOM SHEET =====
function showMuscleSheet(muscleId, summary) {
  const groupId = MUSCLE_GROUP_MAP[muscleId] || muscleId;
  const mg = MUSCLE_GROUPS.find((m) => m.id === groupId);
  if (!mg) return;
  const label = mg.label;
  const data = summary[groupId] || { weeklySets: 0, weeklyVolume: 0, lastTrained: null, exercises: [] };
  const days = getRecoveryDays(data.lastTrained);
  const lastTrainedStr = data.lastTrained ? (days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`) : "Not trained";
  const recovery = state.recoveryAnalysis !== false ? getRecoveryLevel(days, data.weeklySets) : null;
  const recConfig = {
    fatigued: { label: "Fatigued", color: "var(--red)" },
    recovering: { label: "Recovering", color: "var(--yellow)" },
    recovered: { label: "Recovered", color: "var(--accent)" },
  };
  const recBadge = recovery ? recConfig[recovery] : null;

  const sheet = document.getElementById("muscleSheet");
  const body = document.getElementById("muscleSheetBody");
  body.innerHTML = `
    <div class="ms-header">${label.toUpperCase()}</div>
    <div class="ms-grid-2col">
      <div class="ms-item"><span class="ms-label-sm">Weekly Sets</span><span class="ms-value">${data.weeklySets}</span></div>
      <div class="ms-item"><span class="ms-label-sm">Last Trained</span><span class="ms-value">${lastTrainedStr}</span></div>
      <div class="ms-item"><span class="ms-label-sm">Recovery</span><span class="ms-value">${recBadge ? `<span class="ms-rec-badge" style="color:${recBadge.color}"><span class="ms-rec-dot" style="background:${recBadge.color}"></span>${recBadge.label}</span>` : `<span style="color:var(--text-secondary)">—</span>`}</span></div>
      <div class="ms-item"><span class="ms-label-sm">Volume</span><span class="ms-value">${Math.round(data.weeklyVolume / 100) / 10 || 0}k kg</span></div>
    </div>
    ${data.exercises.length > 0 ? `<div class="ms-exercises-label">Exercises</div><div class="ms-exercises">${data.exercises.map((ex) => `<span class="ms-ex-chip">${ex.replace(/([A-Z])/g, " $1").trim()}</span>`).join("")}</div>` : ""}
    ${data.exercises.length === 0 ? '<div class="ms-empty-exercises">No exercises targeting this muscle</div>' : ""}`;
  sheet.classList.remove("is-hidden");
}

function getBodyNeedsAttention(summary) {
  return MUSCLE_GROUPS.map((mg) => ({
    ...mg,
    sets: summary[mg.id] ? summary[mg.id].weeklySets : 0,
    lastTrained: summary[mg.id] ? summary[mg.id].lastTrained : null,
    days: summary[mg.id] ? getRecoveryDays(summary[mg.id].lastTrained) : 99,
  }))
    .filter((m) => m.sets === 0 || m.days >= 5)
    .sort((a, b) => (a.days !== b.days ? b.days - a.days : a.sets - b.sets))
    .slice(0, 3);
}

// ===== COACH INSIGHTS HELPER =====

// ===== CALENDAR STATE =====
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

// ===== REST TIMER =====
let restTimerInterval = null;
let restTimerSeconds = 0;

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
    <label class="sg-row sg-toggle"><span>Goal Analysis</span><input type="checkbox" ${state.goalAnalysis !== false ? "checked" : ""} data-setting="goal-analysis" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Muscle Coverage Analysis</span><input type="checkbox" ${state.muscleCoverage !== false ? "checked" : ""} data-setting="muscle-coverage" /><span class="sg-toggle-track"></span></label>
    <label class="sg-row sg-toggle"><span>Progress Suggestions</span><input type="checkbox" ${state.progressSuggestions !== false ? "checked" : ""} data-setting="progress-suggestions" /><span class="sg-toggle-track"></span></label>
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
  const active = nav.querySelector(".nav-tab.is-active");
  const indicator = document.getElementById("navIndicator");
  if (active && indicator) {
    indicator.style.left = active.offsetLeft + "px";
    indicator.style.width = active.offsetWidth + "px";
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
}

// ===== HOME DASHBOARD =====
function getDailyMessage() {
  const messages = [
    "Have a great day.",
    "Keep showing up.",
    "Consistency wins.",
    "Sleep well. Recovery matters.",
    "Train hard. Recover harder.",
    "Small steps compound.",
    "Stay patient.",
    "Focus on today's workout.",
    "Recovery is part of training.",
    "Progress takes time.",
    "One session at a time.",
  ];
  const today = getDateKey();
  const stored = localStorage.getItem("wl_daily_msg");
  const storedDate = localStorage.getItem("wl_daily_msg_date");
  if (stored && storedDate === today) return stored;
  const idx = Math.abs(hashString(today)) % messages.length;
  const msg = messages[idx];
  localStorage.setItem("wl_daily_msg", msg);
  localStorage.setItem("wl_daily_msg_date", today);
  return msg;
}

function hashString(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function renderHome() {
  const user = state.user;
  const name = user ? user.name : "there";
  const g = getGreeting();
  const streak = getStreak();
  const latestLog = (state.weightLog || []).sort((a, b) => b.date.localeCompare(a.date))[0];
  const weight = latestLog ? latestLog.weight : user ? user.weight : null;
  const lastSession = state.sessions.filter((s) => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
  const profileComplete = isProfileComplete();
  const hasWeight = weight !== null && weight !== undefined;
  document.getElementById("homeGreeting").innerHTML = `
    <div class="hero-greeting">${g.text} ${g.emoji}</div>
    <div class="hero-name">${name}</div>
    <div class="hero-motivation">${getDailyMessage()}</div>
    ${profileComplete ? "" : `<div class="home-incomplete-banner" id="homeIncompleteBanner"><span>Complete your profile to unlock all features</span><span class="home-incomplete-cta">Set Up →</span></div>`}
    <div class="hero-cards-row">
      <div class="hero-streak-card" id="heroStreakCard">
        <div class="hc-header"><span>🔥</span>STREAK</div>
        <div class="hc-value">${streak} Day${streak !== 1 ? "s" : ""}</div>
        <div class="hc-sub">Gym visits in a row</div>
        ${lastSession ? `<div class="hc-last">Last workout: ${lastSession.workoutName}</div>` : ""}
      </div>
      <div class="hero-weight-card" id="heroWeightCard">
        <div class="hc-header"><span>⚖</span>WEIGHT</div>
        <div class="hc-value">${hasWeight ? displayWeight(weight) : "—"}</div>
        <div class="hc-sub">${hasWeight ? "Updated Today" : "Tap to log weight"}</div>
      </div>
    </div>`;

  let wsHtml = "";

  if (state.weeklyReview !== false && weekSessions.length > 0) {
    const totalSets = weekSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done).length, 0), 0);
    const totalVol = weekSessions.reduce(
      (s, ses) =>
        s +
        ses.exercises.reduce(
          (s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0),
          0,
        ),
      0,
    );
    const prevWeekSessions = state.sessions.filter(
      (s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 14 * 86400000)) && s.dateKey < getDateKey(new Date(Date.now() - 7 * 86400000)),
    );
    const prevCount = prevWeekSessions.length;
    wsHtml += `<div class="home-weekly-review"><div class="wr-grid" style="grid-template-columns:repeat(4,1fr);gap:0.3rem;padding:0.5rem 0">
      <div class="wr-item" style="text-align:center"><strong>${weekSessions.length}</strong><small>Workouts</small></div>
      <div class="wr-item" style="text-align:center"><strong>${totalSets}</strong><small>Sets</small></div>
      <div class="wr-item" style="text-align:center"><strong>${Math.round(totalVol / 1000)}k</strong><small>Volume</small></div>
      <div class="wr-item" style="text-align:center"><strong>${prevCount > 0 ? (weekSessions.length > prevCount ? "↑" : weekSessions.length < prevCount ? "↓" : "—") : "—"}</strong><small>vs Last Wk</small></div>
    </div></div>`;
  }

  document.getElementById("homeInsights").innerHTML = wsHtml;

  if (state.goalAnalysis !== false) {
    const goals = state.goals || [];
    if (goals.length > 0) {
      let gaHtml = goals
        .slice(0, 3)
        .map((g) => {
          const pct = getGoalProgress(g);
          return `<div class="goal-card" style="background:var(--surface-2);border-radius:var(--radius-sm);padding:0.4rem 0.5rem;font-size:0.75rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.2rem">
            <span style="font-weight:600">${g.name}</span>
            <span>${pct}%</span>
          </div>
          <div class="goal-bar-wrap" style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
            <div class="goal-bar-fill" style="width:${pct}%;height:100%;background:var(--accent);border-radius:2px"></div>
          </div>
        </div>`;
        })
        .join("");
      if (gaHtml) {
        document.getElementById("homeInsights").innerHTML +=
          `<div class="home-goal-analysis" style="margin-top:0.35rem;display:flex;flex-direction:column;gap:0.3rem">${gaHtml}</div>`;
      }
    }
  }

  // Workout groups + ungrouped
  const activePlan = loadCustomProgram() || plan;
  const groups = state.workoutGroups || [];
  const todaySession = getTodaySession();
  const container = document.getElementById("homeWorkoutList");
  let html = "";

  // Render groups
  groups.forEach((group) => {
    const groupWorkouts = activePlan.filter((w) => group.workoutIds.includes(w.id));
    if (!groupWorkouts.length) return;
    html += `<div class="home-group-card" data-group-id="${group.id}">
      <div class="home-group-header">
        <span class="home-group-name">${group.name}</span>
        <span style="display:flex;align-items:center;gap:0.25rem">
          <span class="home-group-chevron">⌄</span>
          <button class="home-group-menu-btn" data-group-menu="${group.id}">•••</button>
        </span>
      </div>
      <div class="home-group-body">`;
    groupWorkouts.forEach((w) => {
      html += renderWorkoutCard(w, todaySession);
    });
    html += `</div></div>`;
  });

  // Ungrouped workouts
  const groupedIds = new Set(groups.flatMap((g) => g.workoutIds));
  const ungrouped = activePlan.filter((w) => !groupedIds.has(w.id));
  if (ungrouped.length > 0) {
    html += `<div class="home-ungrouped">`;
    ungrouped.forEach((w) => {
      html += `<div class="home-wo-card">`;
      html += renderWorkoutCardInner(w, todaySession);
      html += `</div>`;
    });
    html += `</div>`;
  }

  if (!html) {
    html = `<p class="empty-state">No workouts yet. Create one to get started.</p>`;
  }

  container.innerHTML = html;

  // Bind group toggle
  container.querySelectorAll(".home-group-header").forEach((header) => {
    header.addEventListener("click", () => {
      const card = header.closest(".home-group-card");
      card.classList.toggle("is-collapsed");
    });
  });

  // Bind open buttons
  container.querySelectorAll("[data-open-workout]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openWorkout(btn.dataset.openWorkout);
    });
  });

  // Bind workout menu buttons
  container.querySelectorAll(".home-wo-menu-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.woMenu;
      closeAllMenus();
      const menu = document.createElement("div");
      menu.className = "home-dropdown";
      menu.innerHTML = `<button class="home-dropdown-item" data-action="rename-workout" data-id="${id}">✏️ Rename</button><button class="home-dropdown-item" data-action="delete-workout" data-id="${id}">🗑️ Delete</button>`;
      btn.parentElement.appendChild(menu);
      menu.addEventListener("click", (ev) => {
        const a = ev.target.dataset.action;
        const wid = ev.target.dataset.id;
        if (a === "delete-workout") {
          if (!confirm("Delete this workout?")) return;
          const activePlan = loadCustomProgram() || plan;
          const idx = activePlan.findIndex((w) => w.id === wid);
          if (idx >= 0) {
            activePlan.splice(idx, 1);
            localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
            state.plan = activePlan;
            // Also remove from any groups
            (state.workoutGroups || []).forEach((g) => {
              g.workoutIds = g.workoutIds.filter((i) => i !== wid);
            });
            saveState();
          }
          closeAllMenus();
          renderHome();
        }
        if (a === "rename-workout") {
          const activePlan = loadCustomProgram() || plan;
          const w = activePlan.find((w2) => w2.id === wid);
          if (w) {
            const n = prompt("New name:", w.name);
            if (n && n.trim()) {
              w.name = n.trim();
              localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
              state.plan = activePlan;
              saveState();
              closeAllMenus();
              renderHome();
            }
          }
        }
      });
    });
  });

  // Bind group menu buttons
  container.querySelectorAll(".home-group-menu-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.groupMenu;
      closeAllMenus();
      const menu = document.createElement("div");
      menu.className = "home-dropdown";
      menu.innerHTML = `<button class="home-dropdown-item" data-action="rename-group" data-id="${id}">✏️ Rename Group</button><button class="home-dropdown-item" data-action="delete-group" data-id="${id}">🗑️ Delete Group</button>`;
      btn.parentElement.appendChild(menu);
      menu.addEventListener("click", (ev) => {
        const a = ev.target.dataset.action;
        const gid = ev.target.dataset.id;
        if (a === "delete-group") {
          if (!confirm("Delete this group? Workouts will be ungrouped.")) return;
          state.workoutGroups = (state.workoutGroups || []).filter((g) => g.id !== gid);
          saveState();
          closeAllMenus();
          renderHome();
        }
        if (a === "rename-group") {
          const g = (state.workoutGroups || []).find((g2) => g2.id === gid);
          if (g) {
            const n = prompt("New name:", g.name);
            if (n && n.trim()) {
              g.name = n.trim();
              saveState();
              closeAllMenus();
              renderHome();
            }
          }
        }
      });
    });
  });

  // Bind hero cards
  document.getElementById("heroStreakCard")?.addEventListener("click", openStreakDrawer);
  document.getElementById("heroWeightCard")?.addEventListener("click", () => {
    const entry = latestWeight();
    document.getElementById("wlWeight").value = entry ? entry.weight : "";
    document.getElementById("wlSave").disabled = !(entry && entry.weight > 0);
    document.getElementById("weightLogSheet").classList.remove("is-hidden");
    setTimeout(() => document.getElementById("wlWeight").focus(), 150);
  });

  // Recent workouts
  renderRecentWorkouts();
}

function closeAllMenus() {
  document.querySelectorAll(".home-dropdown").forEach((m) => m.remove());
}

function renderWorkoutCard(workout, todaySession) {
  return `<div class="home-wo-card" data-open-workout="${workout.id}">
    ${renderWorkoutCardInner(workout, todaySession)}
  </div>`;
}

function renderWorkoutCardInner(workout, todaySession) {
  const inProgress = todaySession && todaySession.workoutId === workout.id;
  const sessionCount = workout.exercises.length;
  const lastPerf = state.sessions.filter((s) => s.finishedAt && s.workoutId === workout.id).sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
  const lastLabel = lastPerf ? formatRelativeDate(lastPerf.dateKey) : "Never";
  const duration = workout.duration || "";
  return `<div class="wo-card-header">
    <div class="wo-card-title">${workout.name}</div>
    <div class="wo-card-actions">
      <button class="home-wo-open-btn ${inProgress ? "is-resume" : ""}" data-open-workout="${workout.id}">${inProgress ? "Resume" : "Open"}</button>
      <button class="home-wo-menu-btn" data-wo-menu="${workout.id}">•••</button>
    </div>
  </div>
  <div class="wo-card-meta">${sessionCount} exercises · ${lastLabel}${duration ? " · " + duration : ""}</div>`;
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
      return `<div class="home-recent-card" data-open-workout="${s.workoutId}">
      <div class="home-recent-card-info">
        <div class="home-recent-card-name">${s.workoutName}</div>
        <div class="home-recent-card-date">${formatReadableDate(d)}</div>
      </div>
    </div>`;
    })
    .join("");
  container.querySelectorAll("[data-open-workout]").forEach((btn) => {
    btn.addEventListener("click", () => openWorkout(btn.dataset.openWorkout));
  });
}

function openWorkout(workoutId) {
  currentWorkoutId = workoutId;
  const session = startSessionForWorkout(workoutId);
  if (!session) return;
  // Show warm-up reminder before entering workout (unless resuming)
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
// ===== PROGRESS INDICATOR (V1.6) =====
function renderProgressIndicator() {
  const session = getTodaySession();
  if (!session || state.showWorkoutProgress === false) return "";
  const total = session.exercises.length;
  const idx = currentExName ? session.exercises.findIndex((e) => e.name === currentExName) : -1;
  const currentIdx = idx >= 0 ? idx : session.exercises.filter((e) => e.sets.some((s) => s.done)).length;

  const dots = session.exercises.map((ex, i) => {
    const done = ex.sets.some((s) => s.done);
    let cls = "pr-dot";
    if (i === currentIdx && (!done || (done && i === total - 1))) cls += " is-current";
    else if (done) cls += " is-completed";
    else cls += " is-upcoming";
    return `<span class="${cls}" data-ex-index="${i}"></span>`;
  }).join("");

  return `<div class="pr-container">
    <div class="pr-counter">Exercise ${Math.min(currentIdx + 1, total)} of ${total}</div>
    <div class="pr-dots">${dots}</div>
  </div>`;
}
function updateProgressIndicator() {
  const el = document.getElementById("wsProgressIndicator");
  if (el) el.innerHTML = renderProgressIndicator();
  // Click-to-navigate on upcoming dots (when auto-next is OFF)
  if (!state.autoNext) {
    document.querySelectorAll(".pr-dot.is-upcoming").forEach((dot) => {
      dot.style.cursor = "pointer";
      dot.addEventListener("click", () => {
        const idx = parseInt(dot.dataset.exIndex);
        const session = getTodaySession();
        if (session && session.exercises[idx]) {
          openExerciseDetail(session.exercises[idx].name);
        }
      });
    });
  }
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
    document.getElementById("wsDescText").textContent = workout.focus;
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
      const allDone = (workingDone === totalWorking && totalWorking > 0) || (!totalWorking && ex.sets.every((s) => s.done));
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

  document.getElementById("wsFinishBtn").onclick = finishWorkout;
  document.getElementById("wsCompleteCta").onclick = () => {
    const session = getTodaySession();
    if (!session) return;
    stopStopwatch();
    session.finishedAt = new Date().toISOString();
    state.planOffset = (state.planOffset + 1) % (loadCustomProgram() || plan).length;
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
    finishBtn.addEventListener("click", () => {
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

function addEmptySet() {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;
  ex.sets.push({
    id: crypto.randomUUID(),
    reps: 0,
    weight: "",
    notes: "",
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
      html += `<div class="${cls}" data-set-id="${set.id}">
        <span class="ed-set-check">${checkmark}</span>
        <span class="ed-set-num">${i + 1}</span>
        <span class="ed-set-reps">${reps}</span>
        <span class="ed-set-weight">${displayWeight(weight)}</span>
        ${!isDone ? '<span class="ed-set-working-label">SET</span>' : '<button class="ed-set-dup-btn" data-dup-set-id="' + set.id + '">⧉</button>'}
      </div>`;
    });
  }

  if (allWarmups.length === 0 && allWorking.length === 0) {
    html = `<p class="ed-empty">No sets yet.</p>`;
  }

  return html;
}

function formatSetTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
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
  document.getElementById("esRepsValue").innerHTML = `${editSetReps} <span class="as-unit-inline">reps</span>`;
}
function updateEditSetWeightDisplay() {
  document.getElementById("esWeightValue").innerHTML = `${editSetWeight} <span class="as-unit-inline">kg</span>`;
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
  const completedRow = document.querySelector(`.ed-set-row[data-set-id="${editSetId}"]`);
  if (completedRow) {
    completedRow.classList.add("is-just-done");
    setTimeout(() => completedRow.classList.remove("is-just-done"), 200);
  }
  if (state.autoNext) {
    const pending = ex.sets.filter((s) => !s.isWarmup && !s.done);
    if (pending.length === 0) navigateToNextExercise(ex);
  }
  if (isWorkoutComplete()) triggerWorkoutComplete();
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

// Old edit set functions (kept for backward compatibility via screen-es)
function openEditSet(setId) {
  openEditBottomSheet(setId);
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
  state.planOffset = (state.planOffset + 1) % (loadCustomProgram() || plan).length;
  currentWorkoutId = null;
  saveAndRender();
  const todayPRs = getTodayPRs(session.dateKey || getDateKey());
  showEnhancedSummary(todayPRs);
}

function finishWorkout() {
  const session = getTodaySession();
  if (!session) return;
  const completion = getCompletion(session);
  if (completion.done === 0) return;
  stopStopwatch();
  session.finishedAt = new Date().toISOString();
  state.planOffset = (state.planOffset + 1) % (loadCustomProgram() || plan).length;
  currentWorkoutId = null;
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
  const session = getTodaySession();
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

  // Auto-start cool down if enabled (2s delay)
  if (state.autoCooldown) {
    setTimeout(() => {
      if (!document.getElementById("sessionSummaryOverlay").classList.contains("is-hidden")) {
        session.notes = document.getElementById("ssNotesInput").value || "";
        saveState();
        document.getElementById("sessionSummaryOverlay").classList.add("is-hidden");
        openCoolDown();
      }
    }, 2000);
  }
}

function buildRecoveryAdvice(session) {
  if (state.showRecoveryAdvice === false) return;
  const container = document.getElementById("ssRecovery");
  const content = document.getElementById("ssRecoveryContent");
  if (!container || !content) return;
  const exNames = session.exercises.filter((ex) => ex.sets.some((s) => s.done)).map((ex) => ex.name);
  const knownRecovery = {
    Chest: 48, Shoulders: 48, "Rear Delts": 24, Back: 48,
    Biceps: 24, Triceps: 24, Quads: 48, Legs: 48, Calves: 24,
  };
  const trained = new Set();
  const knownMap = {
    "bench press":"Chest", push:"Chest", press:"Shoulders", "dumbbell press":"Chest",
    deadlift:"Back", row:"Back", pulldown:"Back", pull:"Back", "face pull":"Rear Delts",
    curl:"Biceps", tricep:"Triceps", squat:"Quads", leg:"Legs", lunge:"Legs",
    calf:"Calves", raise:"Shoulders", fly:"Chest", extension:"Triceps",
  };
  for (const name of exNames) {
    const lower = name.toLowerCase();
    for (const [keyword, muscle] of Object.entries(knownMap)) {
      if (lower.includes(keyword)) trained.add(muscle);
    }
  }
  const items = [...trained].map((muscle) => {
    const hours = knownRecovery[muscle] || 24;
    const now = Date.now();
    const sessionTime = session.finishedAt ? new Date(session.finishedAt).getTime() : now;
    const elapsed = Math.max(0, Math.floor((now - sessionTime) / 3600000));
    const remaining = Math.max(0, hours - elapsed);
    const pct = Math.min(100, Math.round((elapsed / hours) * 100));
    const color = remaining > 24 ? "var(--red)" : remaining > 12 ? "var(--accent)" : "var(--green)";
    return `<div class="ss-recovery-item"><span class="ss-recovery-muscle">${muscle}</span><span class="ss-recovery-hours">${remaining}h remaining</span></div>
      <div class="ss-recovery-bar-wrap"><div class="ss-recovery-bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
  }).join("");
  if (items) {
    container.style.display = "block";
    content.innerHTML = items;
  } else {
    container.style.display = "none";
  }
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
document.getElementById("esWeightMinus2").addEventListener("click", () => {
  const step = (state.weightInc || 1) * 2.5;
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
document.getElementById("esWeightPlus2").addEventListener("click", () => {
  const step = (state.weightInc || 1) * 2.5;
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

// ===== MUSCLE SHEET =====
document.getElementById("muscleSheetOverlay")?.addEventListener("click", () => {
  document.getElementById("muscleSheet").classList.add("is-hidden");
});
document.getElementById("muscleSheet")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add("is-hidden");
});

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
    <span class="ed-ex-complete-label">Exercise Complete</span>
    ${hasNext ? (autoNext ? "" : `<button class="ed-ex-complete-btn" id="edNextExBtn">Open Next Exercise</button>`) : ""}
    ${isLastExercise ? `<button class="ed-ex-complete-btn ed-finish-btn" id="edFinishBtn">Finish Workout</button>` : ""}
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

// ===== COPY LAST SESSION =====
function copyLastSession() {
  const session = getTodaySession();
  if (!session) return;
  const ex = session.exercises.find((e) => e.name === currentExName);
  if (!ex) return;
  const last = getLastExerciseSession(currentExName);
  if (!last || last.sets.length === 0) return;
  ex.sets = ex.sets.filter((s) => s.isWarmup || s.done);
  last.sets.forEach((s) => {
    ex.sets.push({
      id: crypto.randomUUID(),
      reps: s.reps,
      weight: s.weight,
      notes: s.notes || "",
      label: "",
      done: false,
      isWarmup: false,
      loggedAt: null,
    });
  });
  ex.warmupGenerated = false;
  autoGenerateWarmups(ex, last.sets[0].weight);
  saveState();
  renderExerciseDetail();
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
  renderWeeklyReview();
  renderMonthlyReport();
  renderAdherenceGrid();
}

function renderSessionLog() {
  const container = document.getElementById("sessionLog");
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
          return `<div class="log-item"><div><strong>${s.workoutName}</strong><span>${formatReadableDate(parseDateKey(s.dateKey))}</span></div><span>${d ? d + " · " : ""}${c.done}/${c.total}</span></div>`;
        })
        .join("")
    : `<p class="empty-state">No finished sessions yet.</p>`;
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
        .slice(0, 8)
        .map(([name, data]) => {
          const wLabel = data.weightPR ? displayWeight(data.weightPR.value) : "—";
          const rLabel = data.repPR ? `${data.repPR.value} reps` : data.weightPR ? `${data.weightPR.reps} reps` : "—";
          const volLabel = data.volumePR ? displayWeight(data.volumePR.value) : "—";
          const estLabel = data.est1RM ? displayWeight(data.est1RM.value) : "—";
          return `<div class="pr-card" onclick="showExerciseAnalytics('${name.replace(/'/g, "\\'")}')">
          <strong>${name.replace(/([A-Z])/g, " $1").trim()}</strong>
          <div class="pr-stats">
            <span class="pr-stat"><span class="pr-stat-val">${wLabel}</span><span class="pr-stat-lbl">Best</span></span>
            <span class="pr-stat"><span class="pr-stat-val">${rLabel}</span><span class="pr-stat-lbl">Reps</span></span>
            <span class="pr-stat"><span class="pr-stat-val">${colLabel(estLabel)}</span><span class="pr-stat-lbl">e1RM</span></span>
            <span class="pr-stat"><span class="pr-stat-val">${colLabel(volLabel)}</span><span class="pr-stat-lbl">Set Vol</span></span>
          </div>
        </div>`;
        })
        .join("")
    : `<p class="empty-state">Set a PR to see it here.</p>`;
}

function colLabel(v) {
  return v === "—" ? v : v;
}

function renderWeeklyReview() {
  const container = document.getElementById("weeklyReviewCard");
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));

  if (weekSessions.length === 0) {
    container.innerHTML = `<p class="empty-state">Complete a session to see your weekly review.</p>`;
    return;
  }

  const totalSets = weekSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done).length, 0), 0);
  const totalKg = weekSessions.reduce(
    (s, ses) =>
      s +
      ses.exercises.reduce(
        (s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0),
        0,
      ),
    0,
  );
  const prCount = getPRCount();
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
  const bwChange =
    recentWeek.length >= 2 && prevWeek.length >= 2
      ? (recentWeek.reduce((s, e) => s + e.weight, 0) / recentWeek.length - prevWeek.reduce((s, e) => s + e.weight, 0) / prevWeek.length).toFixed(1)
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
      <div class="wr-item"><strong>—</strong><small></small></div>
    </div>
    ${(() => {
      const summary = computeMuscleSummary("week");
      const entries = Object.entries(summary).map(([id, m]) => ({ id, ...m })).sort((a, b) => b.weeklySets - a.weeklySets);
      const mostTrained = entries.length > 0 && entries[0].weeklySets > 0 ? entries[0].id : null;
      const mostTrainedLabel = mostTrained ? (mostTrained.charAt(0).toUpperCase() + mostTrained.slice(1)) : "—";
      const missed = entries.filter((m) => m.weeklySets === 0).length;
      return `<div class="wr-grid">
        <div class="wr-item"><strong>${mostTrainedLabel}</strong><small>Most Trained</small></div>
        <div class="wr-item"><strong>${missed}</strong><small>Missed Muscles</small></div>
        <div class="wr-item"><strong>${getMuscleCoverageScore(summary)}%</strong><small>Coverage</small></div>
        <div class="wr-item"><strong>${Math.round(totalKg / (sessionsCount || 1) / 100) / 10 || "--"}</strong><small>Avg/Session</small></div>
      </div>`;
    })()}
    ${state.recoveryAnalysis !== false ? (() => {
      const summary = computeMuscleSummary("week");
      const entries = Object.entries(summary).map(([id, m]) => ({ id, ...m }));
      let fatigued = 0, recovering = 0, recovered = 0;
      for (const e of entries) {
        const days = getRecoveryDays(e.lastTrained);
        const level = getRecoveryLevel(days, e.weeklySets);
        if (level === "fatigued") fatigued++;
        else if (level === "recovering") recovering++;
        else recovered++;
      }
      const total = fatigued + recovering + recovered;
      if (total === 0) return "";
      return `<div class="wr-rec-balance"><span class="wr-rec-dot wr-rec-fatigued" style="background:var(--red)"></span>${fatigued} Fatigued <span class="wr-rec-dot wr-rec-recovering" style="background:var(--yellow)"></span>${recovering} Recovering <span class="wr-rec-dot wr-rec-recovered" style="background:var(--accent)"></span>${recovered} Recovered</div>`;
    })() : ""}
    <div class="wr-note">${getWeeklyNote(strengthPct, bwChange, sessionsCount, proteinPct)}</div>
    ${(() => {
      const as = getGoalAlignmentScore();
      return as !== null
        ? `<div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);text-align:center;padding-top:0.35rem;border-top:1px solid var(--border)">Goal Alignment: <span style="color:var(--accent)">${as}/10</span></div>`
        : "";
    })()}
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
  const prevMonthSessions = state.sessions.filter(
    (s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 60 * 86400000)) && s.dateKey < getDateKey(new Date(Date.now() - 30 * 86400000)),
  );
  if (monthSessions.length === 0) {
    container.innerHTML = `<p class="empty-state">Complete sessions to see your monthly report.</p>`;
    return;
  }
  const sessionsCount = monthSessions.length;
  const totalSets = monthSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter((st) => st.done).length, 0), 0);
  const totalKg = monthSessions.reduce(
    (s, ses) =>
      s +
      ses.exercises.reduce(
        (s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0),
        0,
      ),
    0,
  );
  const prevKg = prevMonthSessions.reduce(
    (s, ses) =>
      s +
      ses.exercises.reduce(
        (s2, ex) => s2 + ex.sets.filter((st) => st.done && st.weight).reduce((s3, st) => s3 + (Number(st.weight) || 0) * (st.reps || 0), 0),
        0,
      ),
    0,
  );
  const volumeChange = prevKg > 0 ? Math.round(((totalKg - prevKg) / prevKg) * 100) : null;
  const prCount = getPRCount();
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
  if (bwChange !== "--" && Number(bwChange) > 0.5 && state.bodyGoal === "fat-loss")
    rec = "Weight is increasing on a fat-loss goal. Review calorie tracking and weekend intake.";
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
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sessions.find((s) => s.dateKey === getDateKey(d))) streak++;
    else break;
  }
  let html = `<div class="adherence-header"><span class="streak-label">Streak: ${streak} days</span></div><div class="adherence-grid">`;
  for (let w = 0; w < 12; w++) {
    html += `<div class="adherence-week">`;
    for (let d = 6; d >= 0; d--) {
      const offset = w * 7 + d;
      const date = new Date(today);
      date.setDate(date.getDate() - offset);
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

// ===== NUTRITION (moved from Today) =====
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
      if (goal.id === "fat-loss" && change > 0.3) {
        weightOk = false;
        weightStatus = "⚠ Off Track";
        weightCls = "is-red";
      } else if ((goal.id === "lean-bulk" || goal.id === "aggressive-bulk") && change < -0.3) {
        weightOk = false;
        weightStatus = "⚠ Off Track";
        weightCls = "is-yellow";
      } else if (goal.id === "recomp" && Math.abs(change) > 0.5) {
        weightOk = false;
        weightStatus = "⚠ Needs Attention";
        weightCls = "is-yellow";
      }
    }
  }

  const strengthPct = getWeeklyStrengthChange();
  let strengthStatus = "Improving";
  let strengthCls = "is-green";
  if (strengthPct === null) {
    strengthStatus = "Need data";
    strengthCls = "is-yellow";
  } else if (strengthPct < -3) {
    strengthStatus = "Declining";
    strengthCls = "is-red";
  } else if (strengthPct < 2) {
    strengthStatus = "Stable";
    strengthCls = "is-yellow";
  }

  const today = getDateKey();
  const todayMeals = loadMeals(today);
  const todayProtein = todayMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const proteinPct = Math.round((todayProtein / PROTEIN_GOAL) * 100);
  let proteinStatus = `${todayProtein}g / ${PROTEIN_GOAL}g`;
  let proteinCls = proteinPct >= 80 ? "is-green" : proteinPct >= 50 ? "is-yellow" : "is-red";

  const todayCal = todayMeals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
  let calStatus = "On Target";
  let calCls = "is-green";
  if (goal && goal.id === "fat-loss" && todayCal > CAL_GOAL * 1.05) {
    calStatus = "Over Target";
    calCls = "is-yellow";
  } else if (goal && goal.id !== "fat-loss" && todayCal < CAL_GOAL * 0.85) {
    calStatus = "Under Target";
    calCls = "is-yellow";
  }

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
    <div class="macro-bar"><span class="bar-label">Protein</span><div class="bar-track"><span style="width:${Math.min((p / PROTEIN_GOAL) * 100, 100)}%;background:var(--accent)"></span></div><span class="bar-value">${p}/${PROTEIN_GOAL}g</span></div>
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

function renderNutritionTargets() {
  const container = document.getElementById("nutritionTargetsCard");
  if (!container) return;
  const today = getDateKey();
  const meals = loadMeals(today);
  const cal = meals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
  const p = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const water = meals.reduce((s, m) => s + (Number(m.water) || 0), 0);
  const calTarget = state.calorieTarget || CAL_GOAL;
  const protTarget = state.proteinGoal || PROTEIN_GOAL;
  const waterTarget = state.waterGoal || WATER_TARGET;
  const calCls = cal >= calTarget ? "is-met" : cal >= calTarget * 0.75 ? "is-partial" : "is-miss";
  const protCls = p >= protTarget ? "is-met" : p >= protTarget * 0.75 ? "is-partial" : "is-miss";
  const waterCls = water >= waterTarget ? "is-met" : water >= waterTarget * 0.75 ? "is-partial" : "is-miss";
  container.innerHTML = `
    <div class="nut-targets">
      <div class="nut-target-row"><span class="nut-target-label">Calories</span><span class="nut-target-value ${calCls}">${Math.round(cal)} / ${calTarget} kcal</span></div>
      <div class="nut-target-row"><span class="nut-target-label">Protein</span><span class="nut-target-value ${protCls}">${Math.round(p)} / ${protTarget} g</span></div>
      <div class="nut-target-row"><span class="nut-target-label">Water</span><span class="nut-target-value ${waterCls}">${Math.round(water)} / ${waterTarget} ml</span></div>
    </div>`;
}

function renderNutritionCompliance() {
  const container = document.getElementById("nutritionComplianceContent");
  if (!container) return;
  const today = getDateKey();
  const meals = loadMeals(today);
  const p = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const c = meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0);
  const f = meals.reduce((s, m) => s + (Number(m.fat) || 0), 0);
  const cal = meals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
  const pTarget = state.proteinGoal || PROTEIN_GOAL;
  const calTarget = state.calorieTarget || CAL_GOAL;
  const cPct = Math.min(Math.round((c / CARBS_GOAL) * 100), 100);
  const fPct = Math.min(Math.round((f / FAT_GOAL) * 100), 100);
  const pPct = Math.min(Math.round((p / pTarget) * 100), 100);
  const calPct = Math.min(Math.round((cal / calTarget) * 100), 100);
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
  html += `<div class="nc-row"><span class="nc-label">Protein</span><div class="nc-track"><span style="width:${pPct}%;background:var(--accent)"></span></div><span class="nc-pct">${pPct}%</span></div>`;
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
  const protGoal = state.proteinGoal || PROTEIN_GOAL;
  const remaining = Math.max(0, protGoal - protein);
  if (remaining < 10) {
    container.innerHTML = `<p class="empty-state">Protein target met. Great work.</p>`;
    return;
  }
  const suggestions = curatedFoods
    .filter((f) => f.name !== "Custom Entry" && f.protein > 5)
    .sort((a, b) => b.protein / b.cal - a.protein / a.cal)
    .slice(0, 5);
  container.innerHTML = suggestions
    .map((f) => {
      const needed = Math.ceil(remaining / f.protein);
      return `<button class="suggestion-chip" data-food="${f.name}">${f.name} ×${needed}</button>`;
    })
    .join("");
  container.querySelectorAll("[data-food]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = curatedFoods.find((f) => f.name === btn.dataset.food);
      if (!food) return;
      const needed = Math.ceil(remaining / food.protein);
      const meals = loadMeals(today);
      meals.push({
        type: "Quick",
        food: food.name,
        qty: needed,
        protein: food.protein * needed,
        carbs: food.carbs * needed,
        fat: food.fat * needed,
        cal: food.cal * needed,
      });
      saveMeals(today, meals);
      saveRecentFoods(food.name);
      renderSessionsTab();
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
  container.innerHTML = favorites
    .map((meal, i) => {
      const totalP = meal.items.reduce((s, m) => s + (Number(m.protein) || 0) * (Number(m.qty) || 1), 0);
      const totalCal = meal.items.reduce((s, m) => s + (Number(m.cal) || 0) * (Number(m.qty) || 1), 0);
      return `<div class="fav-meal-row">
      <button class="fav-btn" data-fav-idx="${i}">
        <span class="fav-name">${meal.name}</span>
        <span class="fav-macros">${Math.round(totalP)}g P · ${Math.round(totalCal)} cal</span>
      </button>
      <button class="fav-delete" data-del-idx="${i}">✕</button>
    </div>`;
    })
    .join("");
  container.querySelectorAll("[data-fav-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const meal = favorites[Number(btn.dataset.favIdx)];
      if (!meal) return;
      const meals = loadMeals(today);
      for (const item of meal.items) {
        meals.push({
          type: "Fav",
          food: item.food,
          qty: item.qty,
          protein: Number(item.protein) * Number(item.qty),
          carbs: Number(item.carbs) * Number(item.qty),
          fat: Number(item.fat) * Number(item.qty),
          cal: Number(item.cal) * Number(item.qty),
        });
      }
      saveMeals(today, meals);
      renderSessionsTab();
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
      renderSessionsTab();
    });
  });
}

function renderMealLog() {
  const container = document.getElementById("mealLog");
  const today = getDateKey();
  const meals = loadMeals(today);
  container.innerHTML = meals.length
    ? meals
        .map(
          (m, i) =>
            `<div class="meal-item"><div><strong>${m.food}</strong>${m.qty ? ` ×${m.qty}` : ""} <span class="meal-macros">${m.protein || 0}g P · ${m.carbs || 0}g C · ${m.fat || 0}g F · ${m.cal || 0} cal</span></div><button class="meal-delete" data-idx="${i}">✕</button></div>`,
        )
        .join("")
    : `<p class="empty-state">No meals logged. Tap a food above.</p>`;
  container.querySelectorAll(".meal-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      const meals = loadMeals(today);
      meals.splice(idx, 1);
      saveMeals(today, meals);
      renderSessionsTab();
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
  const predText =
    hoursRemaining > 0 && endHour <= 23
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
    const d = new Date();
    d.setDate(d.getDate() - i);
    const w = loadWater(getDateKey(d));
    if (w > 0) {
      totalWaterPct += Math.min(w / WATER_TARGET, 1);
      waterDaysCount++;
    }
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
}

// ===== PROGRESS PAGE =====
function renderProgressPage() {
  const container = document.getElementById("progressPageContent");
  if (!container) return;
  const sessions = state.sessions.filter((s) => s.finishedAt);
  if (!sessions.length) {
    container.innerHTML = `<div class="progress-empty">Complete your first workout to see progress here.</div>`;
    return;
  }
  container.innerHTML = `
    <div id="progressCalendarHero"></div>
    <div class="progress-section">
      <div class="section-label">Streak</div>
      <div id="progressStreak" class="progress-streak-card"></div>
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
    <div class="progress-section">
      <div class="section-label">Insights</div>
      <div id="progressInsights"></div>
    </div>
  `;
  renderCalendarHero();
  renderStreakCard();
  renderWeeklyReview();
  renderMonthlyReview();
  renderRecentAchievements();
  renderProgressInsights();
}

function renderStreakCard() {
  const container = document.getElementById("progressStreak");
  if (!container) return;
  const streak = getStreak();
  const longest = getLongestStreak();
  const totalWorkouts = state.sessions.filter((s) => s.finishedAt).length;
  container.innerHTML = `
    <div class="ps-item"><div class="ps-value">${streak}</div><div class="ps-label">Current Streak</div></div>
    <div class="ps-item"><div class="ps-value">${longest}</div><div class="ps-label">Longest</div></div>
    <div class="ps-item"><div class="ps-value">${totalWorkouts}</div><div class="ps-label">Total Workouts</div></div>`;
}

function renderWeeklyReview() {
  const container = document.getElementById("progressWeekly");
  if (!container) return;
  const weekAgo = getDateKey(new Date(Date.now() - 7 * 86400000));
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= weekAgo);
  if (!weekSessions.length) {
    container.innerHTML = `<div class="progress-card"><div class="progress-card-title">This Week</div><div class="strength-sub" style="color:var(--text-tertiary);font-size:0.72rem">Complete a workout this week to see stats.</div></div>`;
    return;
  }
  let totalSets = 0;
  let totalVol = 0;
  let weeklyPRCount = 0;
  const trainedDays = new Set();
  for (const ses of weekSessions) {
    trainedDays.add(ses.dateKey);
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
  container.innerHTML = `<div class="progress-card">
    <div class="progress-card-title">This Week</div>
    <div class="monthly-grid">
      <div class="monthly-item"><strong>${weekSessions.length}</strong><small>Sessions</small></div>
      <div class="monthly-item"><strong>${volStr}</strong><small>Volume</small></div>
      <div class="monthly-item"><strong>${weeklyPRCount}</strong><small>PRs</small></div>
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
    container.innerHTML = `<div class="progress-card"><div class="progress-card-title">Monthly</div><div class="strength-sub" style="color:var(--text-tertiary);font-size:0.72rem">Complete workouts to see monthly stats.</div></div>`;
    return;
  }
  let bestLift = { name: "", vol: 0 };
  const groupCount = {};
  let totalDuration = 0;
  for (const ses of monthSessions) {
    if (ses.duration) totalDuration += ses.duration;
    let sv = 0;
    for (const ex of ses.exercises) {
      for (const set of ex.sets) {
        if (set.done && Number(set.weight) > 0) sv += Number(set.weight) * (Number(set.reps) || 0);
      }
    }
    if (sv > bestLift.vol) bestLift = { name: ses.workoutName || "Workout", vol: sv };
    groupCount[ses.workoutName || "Workout"] = (groupCount[ses.workoutName || "Workout"] || 0) + 1;
  }
  const mostTrained = Object.entries(groupCount).sort((a, b) => b[1] - a[1])[0];
  const avgDuration = Math.round(totalDuration / monthSessions.length);
  container.innerHTML = `<div class="progress-card">
    <div class="progress-card-title">Monthly</div>
    <div class="monthly-grid">
      <div class="monthly-item"><strong>${monthSessions.length}</strong><small>Workouts</small></div>
      <div class="monthly-item"><strong>${bestLift.name.replace(/([A-Z])/g, " $1").trim() || "—"}</strong><small>Best Lift</small></div>
      <div class="monthly-item"><strong>${mostTrained ? mostTrained[0].replace(/([A-Z])/g, " $1").trim() : "—"}</strong><small>Most Trained</small></div>
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
    container.innerHTML = `<div class="progress-card"><div class="progress-card-title">Achievements</div><div class="strength-sub" style="color:var(--text-tertiary);font-size:0.72rem">Set personal records to see achievements here.</div></div>`;
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

function renderProgressInsights() {
  const container = document.getElementById("progressInsights");
  if (!container) return;
  const sessions = state.sessions.filter((s) => s.finishedAt);
  const now = new Date();
  const weekAgo = getDateKey(new Date(now.getTime() - 7 * 86400000));
  const weekSessions = sessions.filter((s) => s.dateKey >= weekAgo);
  const insp = [];
  const prevWeek = sessions.filter((s) => s.dateKey >= getDateKey(new Date(now.getTime() - 14 * 86400000)) && s.dateKey < weekAgo).length;

  if (weekSessions.length >= 3) insp.push({ icon: "✅", text: `Trained ${weekSessions.length}x this week` });
  if (prevWeek > 0 && weekSessions.length > prevWeek) insp.push({ icon: "📈", text: `${weekSessions.length - prevWeek} more than last week` });
  if (prevWeek > 0 && weekSessions.length < prevWeek) insp.push({ icon: "⚠️", text: `Missed ${prevWeek - weekSessions.length} vs last week` });
  const streak = getStreak();
  if (streak >= 3) insp.push({ icon: "🔥", text: `On a ${streak}-day streak` });
  const totalVol = weekSessions.reduce((s, ses) => s + ses.exercises.reduce((s2, ex) => s2 + ex.sets.filter(st => st.done && st.weight).reduce((s3, st) => s3 + Number(st.weight) * (st.reps || 0), 0), 0), 0);
  if (totalVol > 0) insp.push({ icon: "💪", text: `${totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + "k" : totalVol} volume this week` });

  if (!insp.length) {
    container.innerHTML = `<div class="progress-card"><div class="progress-card-title">Insights</div><div class="strength-sub" style="color:var(--text-tertiary);font-size:0.72rem">More data needed for insights.</div></div>`;
    return;
  }
  container.innerHTML = `<div class="progress-card">
    <div class="progress-card-title">Insights</div>
    <div class="ach-list">${insp.slice(0, 4).map((i) =>
      `<div class="ach-item"><span class="ach-icon">${i.icon}</span>${i.text}</div>`
    ).join("")}</div>
  </div>`;
}

function renderCalendarHero() {
  const container = document.getElementById("progressCalendarHero");
  if (!container) return;

  const sessions = state.sessions.filter((s) => s.finishedAt);
  const trainedDays = new Set(sessions.map((s) => s.dateKey));

  const today = new Date();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const todayKey = getDateKey(today);

  let html = `<div class="calendar-wrap">`;

  // Navigation header (no streak stats)
  html += `<div class="cal-header">
    <button class="cal-nav-btn" data-cal-dir="-1">←</button>
    <span class="cal-title">${monthNames[calendarMonth]} ${calendarYear}</span>
    <button class="cal-nav-btn" data-cal-dir="1">→</button>
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
      setsHtml += `<div class="wr-ex-set"><span>${weightStr} × ${r}</span></div>`;
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

function renderBodyTab() {
  renderBodySnapshot();
  renderWeightTrend();
  renderMuscleCoverageCompact();
  renderNeedsAttention();
  renderRecoverySummary();
  renderBodyGoals();
  renderBodyInsights();
}

function latestWeight() {
  const log = loadBodyLog().sort((a, b) => b.date.localeCompare(a.date));
  return log.length > 0 ? log[0] : null;
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

// --- SECTION 1: Body Snapshot ---
function renderBodySnapshot() {
  const container = document.getElementById("bodyPageContent");
  const u = state.user || {};
  const entry = latestWeight();
  const weight = entry ? entry.weight : null;
  const bmi = u.height && weight ? (weight / ((u.height / 100) * (u.height / 100))).toFixed(1) : null;
  const updatedStr = entry ? (() => {
    const days = Math.floor((Date.now() - parseDateKey(entry.date).getTime()) / 86400000);
    return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;
  })() : null;

  const existing = container.querySelector(".body-snapshot");
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.className = "body-snapshot";
  div.innerHTML = `
    <div class="bs-grid">
      <div class="bs-item"><span class="bs-label">Weight</span><span class="bs-value">${weight ? displayWeight(weight) : "—"}</span></div>
      <div class="bs-item"><span class="bs-label">Height</span><span class="bs-value">${u.height ? displayHeight(u.height) : "—"}</span></div>
      <div class="bs-item"><span class="bs-label">BMI</span><span class="bs-value">${bmi || "—"}</span></div>
      <div class="bs-item"><span class="bs-label">Last Updated</span><span class="bs-value">${updatedStr || "—"}</span></div>
    </div>
    <div class="bs-footer">
      <span class="bs-updated">${entry ? "Updated " + updatedStr : "No weigh-ins yet"}</span>
      <button class="bs-edit-btn" id="snapshotEditBtn" aria-label="Log weigh-in">✎</button>
    </div>`;
  container.prepend(div);
}

// --- SECTION 2: Weight Trend ---
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

function renderWeightTrend() {
  const container = document.getElementById("bodyPageContent");
  const existing = container.querySelector(".body-weight-trend");
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const change = weeklyWeightChange();
  const monthlyChange = monthlyWeightChange();

  if (existing) existing.remove();

  const div = document.createElement("div");
  div.className = "body-weight-trend";
  const changeCls = (val) => val !== null && val !== 0 ? (val > 0 ? " is-up" : " is-down") : "";
  const fmtChange = (val) => val !== null ? (val > 0 ? "+" : "") + val.toFixed(1) + " kg" : "—";
  div.innerHTML = `
    <div class="bw-header">
      <div class="bw-stat"><span class="bw-stat-label">Current</span><span class="bw-stat-value">${log.length > 0 ? displayWeight(log[log.length - 1].weight) : "—"}</span></div>
      <div class="bw-stat${changeCls(change)}"><span class="bw-stat-label">Weekly</span><span class="bw-stat-value">${fmtChange(change)}</span></div>
      <div class="bw-stat${changeCls(monthlyChange)}"><span class="bw-stat-label">Monthly</span><span class="bw-stat-value">${fmtChange(monthlyChange)}</span></div>
    </div>
    <div class="bw-chart-wrap"><canvas id="bodyWeightChart" style="width:100%;height:200px"></canvas></div>`;

  const snapshot = container.querySelector(".body-snapshot");
  if (snapshot) snapshot.after(div);
  else container.prepend(div);

  if (bodyChartInstance) { bodyChartInstance.destroy(); bodyChartInstance = null; }
  const canvas = document.getElementById("bodyWeightChart");
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

// --- SECTION 3: Muscle Coverage (Compact) ---
function renderMuscleCoverageCompact() {
  const container = document.getElementById("bodyPageContent");
  const existing = container.querySelector(".body-coverage-compact");
  if (existing) existing.remove();

  const summary = computeMuscleSummary(bodyMapMode);
  const coverageScore = getMuscleCoverageScore(summary);
  const trained = Object.values(summary).filter((m) => m.weeklySets > 0).length;
  const total = Object.keys(summary).length;
  const modeLabels = { today: "Today", week: "Week", month: "Month" };

  const div = document.createElement("div");
  div.className = "body-coverage-compact";
  div.innerHTML = `
    <div class="bc-ring" style="background: conic-gradient(var(--accent) ${coverageScore * 3.6}deg, var(--surface-2) 0deg)">
      <div class="bc-ring-inner">${coverageScore}%</div>
    </div>
    <div class="bc-info">
      <div class="bc-info-label">Muscle Coverage</div>
      <div class="bc-info-value">${trained} / ${total} muscles trained</div>
      <div class="bc-tabs-row">
        ${Object.entries(modeLabels).map(([key, label]) =>
          `<button class="bc-tab-sm${bodyMapMode === key ? " is-active" : ""}" data-mode="${key}">${label}</button>`
        ).join("")}
      </div>
    </div>`;

  const trend = container.querySelector(".body-weight-trend");
  if (trend) trend.after(div);
  else container.prepend(div);

  div.querySelectorAll(".bc-tab-sm").forEach((btn) => {
    btn.addEventListener("click", () => {
      bodyMapMode = btn.dataset.mode;
      renderMuscleCoverageCompact();
    });
  });
}

// --- SECTION 4: Needs Attention ---
function renderNeedsAttention() {
  const container = document.getElementById("bodyPageContent");
  const existing = container.querySelector(".body-needs");
  const summary = computeMuscleSummary(bodyMapMode);
  const needs = getBodyNeedsAttention(summary).slice(0, 3);

  if (existing) existing.remove();

  const div = document.createElement("div");
  div.className = "body-needs";

  if (needs.length === 0) {
    div.innerHTML = `<div class="body-needs-all">All muscles trained this week</div>`;
  } else {
    div.innerHTML = `<div class="bn-label">Needs Attention</div><div class="bn-list">
      ${needs.map((m) => {
        const recovery = state.recoveryAnalysis !== false ? getRecoveryLevel(m.days, m.sets) : null;
        const recConfig = {
          fatigued: { color: "var(--red)", label: "Fatigued" },
          recovering: { color: "var(--yellow)", label: "Recovering" },
          recovered: { color: "var(--accent)", label: "Recovered" },
        };
        const badge = recovery ? recConfig[recovery] : null;
        return `<div class="bn-card" data-muscle="${m.id}">
          <div class="bn-left">
            <div class="bn-name">${m.label}</div>
            <div class="bn-meta">Last trained ${m.days >= 99 ? "never" : m.days === 0 ? "today" : m.days === 1 ? "yesterday" : m.days + " days ago"}</div>
          </div>
          ${badge ? `<div class="bn-badge" style="color:${badge.color};border-color:${badge.color}"><span class="bn-dot" style="background:${badge.color}"></span>${badge.label}</div>` : ""}
        </div>`;
      }).join("")}
    </div>`;
  }

  const coverage = container.querySelector(".body-coverage");
  if (coverage) coverage.after(div);
  else container.prepend(div);

  // Tap to show bottom sheet
  div.querySelectorAll(".bn-card").forEach((card) => {
    card.addEventListener("click", () => {
      showMuscleSheet(card.dataset.muscle, summary);
    });
  });
}

// --- SECTION 5: Recovery Summary ---
function renderRecoverySummary() {
  const container = document.getElementById("bodyPageContent");
  const existing = container.querySelector(".body-recovery");
  if (existing) existing.remove();

  const summary = computeMuscleSummary(bodyMapMode);
  const groups = { fatigued: [], recovering: [], recovered: [] };
  for (const [id, data] of Object.entries(summary)) {
    if (data.weeklySets === 0) continue;
    const mg = MUSCLE_GROUPS.find((m) => m.id === id);
    if (!mg) continue;
    const daysSince = typeof data.daysSince === "number" ? data.daysSince : (data.lastTrained ? getRecoveryDays(data.lastTrained) : 99);
    const level = getRecoveryLevel(daysSince, data.weeklySets);
    if (level && groups[level]) groups[level].push(mg.label);
  }

  const div = document.createElement("div");
  div.className = "body-recovery";
  const hasAny = Object.values(groups).some((g) => g.length > 0);
  if (!hasAny) {
    div.innerHTML = `<div class="br-label">Recovery Status</div><div class="br-empty">No recovery data yet</div>`;
  } else {
    div.innerHTML = `<div class="br-label">Recovery Status</div><div class="br-list">
      ${groups.recovered.length ? `<div class="br-item"><span class="br-item-icon">🟢</span><span class="br-item-label">Ready</span><span class="br-item-muscles">${groups.recovered.join(", ")}</span></div>` : ""}
      ${groups.recovering.length ? `<div class="br-item"><span class="br-item-icon">🟡</span><span class="br-item-label">Recovering</span><span class="br-item-muscles">${groups.recovering.join(", ")}</span></div>` : ""}
      ${groups.fatigued.length ? `<div class="br-item"><span class="br-item-icon">🔴</span><span class="br-item-label">Fatigued</span><span class="br-item-muscles">${groups.fatigued.join(", ")}</span></div>` : ""}
    </div>`;
  }

  const goals = container.querySelector(".body-goals");
  if (goals) goals.before(div);
  else container.prepend(div);
}

// --- SECTION 6: Goals ---
function renderBodyGoals() {
  const container = document.getElementById("bodyPageContent");
  const existing = container.querySelector(".body-goals");
  if (existing) existing.remove();

  const goals = (state.goals || []).filter((g) => {
    if (g.type === "weight") return true;
    if (g.type === "bench" || g.type === "squat" || g.type === "deadlift" || g.type === "custom") return true;
    return false;
  });

  const div = document.createElement("div");
  div.className = "body-goals";

  if (goals.length === 0) {
    div.innerHTML = `<div class="body-empty-card"><div class="body-empty-title">No Active Goals</div><p class="body-empty-text">Create your first goal</p></div>`;
  } else {
    const visible = goals.slice(0, 3);
    div.innerHTML = `<div class="bg-label">Goals</div><div class="bg-list">
      ${visible.map((g) => {
        const pct = typeof getGoalProgress === "function" ? getGoalProgress(g) : 0;
        const val = typeof getGoalValue === "function" ? getGoalValue(g) : "—";
        const target = g.target || g.value || "—";
        return `<div class="bg-card">
          <div class="bg-header"><span class="bg-name">${g.name}</span><span class="bg-pct">${pct}%</span></div>
          <div class="bg-bar-wrap"><div class="bg-bar" style="width:${Math.min(pct, 100)}%"></div></div>
          <div class="bg-meta">${typeof val === "string" ? val : displayWeight ? displayWeight(Number(val)) : val} / ${typeof target === "string" ? target : displayWeight ? displayWeight(Number(target)) : target}</div>
        </div>`;
      }).join("")}
      ${goals.length > 3 ? '<button class="bg-view-all">View All</button>' : ""}
    </div>`;
  }

  const needs = container.querySelector(".body-needs");
  if (needs) needs.after(div);
  else container.prepend(div);
}

// --- SECTION 6: Insights ---
function renderBodyInsights() {
  const container = document.getElementById("bodyPageContent");
  const existing = container.querySelector(".body-insights");
  if (existing) existing.remove();

  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
  const summary = computeMuscleSummary(bodyMapMode);

  const div = document.createElement("div");
  div.className = "body-insights";

  if (weekSessions.length === 0) {
    div.innerHTML = `<div class="body-empty-insights"><p class="body-empty-text">Insights will appear after your first week of training</p></div>`;
  } else {
    const insp = [];
    const coverage = getMuscleCoverageScore(summary);
    const neglected = MUSCLE_GROUPS.filter((mg) => {
      const d = summary[mg.id];
      return !d || d.weeklySets === 0;
    }).slice(0, 3);
    if (neglected.length > 0) {
      insp.push({ icon: "⚠️", text: `${neglected.map((m) => m.label).join(", ")} not trained this week`, severity: "yellow" });
    }
    const undertrained = MUSCLE_GROUPS.filter((mg) => {
      const d = summary[mg.id];
      return d && d.weeklySets > 0 && d.weeklySets < 5;
    }).slice(0, 2);
    if (undertrained.length > 0) {
      insp.push({ icon: "🎯", text: `${undertrained.map((m) => m.label).join(", ")} need more volume (<5 weekly sets)`, severity: "yellow" });
    }
    const weekCount = weekSessions.length;
    const prevWeek = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 14 * 86400000)) && s.dateKey < getDateKey(new Date(Date.now() - 7 * 86400000))).length;
    if (weekCount >= 3) {
      insp.push({ icon: "✅", text: `Trained ${weekCount}x this week — great consistency`, severity: "green" });
    }
    if (prevWeek > 0 && weekCount > prevWeek) {
      insp.push({ icon: "📈", text: `${weekCount - prevWeek} more workout${weekCount - prevWeek > 1 ? "s" : ""} than last week`, severity: "green" });
    }
    const change = weeklyWeightChange();
    if (change !== null) {
      insp.push({ icon: change >= 0 ? "📊" : "📊", text: `Weight ${change > 0 ? "increased" : change < 0 ? "decreased" : "stable"} ${Math.abs(change).toFixed(1)}kg this week`, severity: change === 0 ? "blue" : "blue" });
    }
    const recovering = MUSCLE_GROUPS.filter((mg) => {
      const d = summary[mg.id];
      return d && d.weeklySets > 0 && getRecoveryDays(d.lastTrained) <= 1;
    }).slice(0, 2);
    if (recovering.length > 0) {
      insp.push({ icon: "🔄", text: `${recovering.map((m) => m.label).join(", ")} recovering — prioritize sleep & nutrition`, severity: "blue" });
    }
    const optimal = MUSCLE_GROUPS.filter((mg) => {
      const d = summary[mg.id];
      return d && d.weeklySets >= 5 && d.weeklySets <= 14;
    }).length;
    if (optimal >= 8) {
      insp.push({ icon: "💪", text: `${optimal} muscle groups in optimal training range`, severity: "green" });
    }

    div.innerHTML = `<div class="bi-label">Insights</div><div class="bi-list">
      ${insp.slice(0, 4).map((i) => `<div class="bi-item is-${i.severity}"><span class="bi-icon">${i.icon}</span><span class="bi-text">${i.text}</span></div>`).join("")}
    </div>`;
  }

  const goals = container.querySelector(".body-goals");
  if (goals) goals.after(div);
  else container.prepend(div);
}

let weightHistoryChartInstance = null;
let historyFilterDays = 30;

function renderWeightHistoryChart() {
  const container = document.getElementById("historyFilterChips");
  container.innerHTML = [7, 30, 90, 365, 0]
    .map(
      (d) =>
        `<button class="filter-chip ${historyFilterDays === d ? "is-active" : ""}" data-days="${d}">${d === 0 ? "All" : d === 365 ? "1y" : d + "d"}</button>`,
    )
    .join("");
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
    data: { labels, datasets: [{ data, borderColor: "#00d26a", tension: 0.3, pointRadius: 2, fill: false }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { min: Math.min(...data) - 0.5, max: Math.max(...data) + 0.5 } } },
  });
}

// ===== MODALS =====
let exerciseDetailChartInstance = null;

document.getElementById("myExercisesBtn")?.addEventListener("click", () => {
  const container = document.getElementById("exerciseDetailTitle");
  const activePlan = loadCustomProgram() || plan;
  const allExercises = activePlan.flatMap((w) => w.exercises.map((e) => e.name));
  container.textContent = `All Exercises (${allExercises.length})`;

  if (exerciseDetailChartInstance) {
    exerciseDetailChartInstance.destroy();
    exerciseDetailChartInstance = null;
  }
  const canvas = document.getElementById("exerciseDetailChart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const counts = {};
    allExercises.forEach((name) => {
      counts[name] = (counts[name] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    exerciseDetailChartInstance = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: "#00d26a", borderRadius: 4 }] },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { stepSize: 1, color: "#737373" } }, x: { ticks: { color: "#737373", font: { size: 8 } } } },
      },
    });
  }

  document.getElementById("exerciseDetailModal").classList.remove("is-hidden");
});

document.getElementById("exerciseDetailClose")?.addEventListener("click", () => {
  document.getElementById("exerciseDetailModal").classList.add("is-hidden");
  if (exerciseDetailChartInstance) {
    exerciseDetailChartInstance.destroy();
    exerciseDetailChartInstance = null;
  }
});

// ===== LOAD PROGRAM =====
document.getElementById("newPlanBtn")?.addEventListener("click", () => {
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

function openOnboarding(animateIn) {
  const modal = document.getElementById("onboardingModal");
  modal.classList.remove("is-hidden");
  if (animateIn) {
    modal.classList.add("animate-in");
    const onAnimEnd = () => { modal.classList.remove("animate-in"); modal.removeEventListener("animationend", onAnimEnd); };
    modal.addEventListener("animationend", onAnimEnd);
  }
  document.getElementById("onboardName").focus();
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

function saveOnboardData(name, age, height, weight) {
  state.user = { name: name.trim() || "Athlete", age: Number(age) || 0, height: Number(height) || 0, weight: Number(weight) || 0 };
  if (weight > 0) {
    if (!state.weightLog) state.weightLog = [];
    state.weightLog.push({ weight: Number(weight), date: getDateKey(), notes: "Initial", loggedAt: new Date().toISOString() });
  }
  saveState();
}

// --- Living listeners ---
document.addEventListener("input", (e) => {
  if (["onboardName", "onboardAge", "onboardHeight", "onboardWeight"].includes(e.target.id)) {
    const name = document.getElementById("onboardName").value.trim();
    const age = document.getElementById("onboardAge").value;
    const height = document.getElementById("onboardHeight").value;
    const weight = document.getElementById("onboardWeight").value;
    document.getElementById("onboardSaveBtn").disabled = !(name && Number(age) > 0 && Number(height) > 0 && Number(weight) > 0);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const fieldMap = ["onboardName", "onboardAge", "onboardHeight", "onboardWeight"];
  const idx = fieldMap.indexOf(e.target.id);
  if (idx === -1) return;
  e.preventDefault();
  const next = fieldMap[idx + 1];
  if (next) {
    document.getElementById(next).focus();
  } else {
    document.getElementById("onboardSaveBtn").click();
  }
});

document.getElementById("onboardSaveBtn")?.addEventListener("click", () => {
  const name = document.getElementById("onboardName").value;
  const age = document.getElementById("onboardAge").value;
  const height = document.getElementById("onboardHeight").value;
  const weight = document.getElementById("onboardWeight").value;
  if (!(name.trim() && Number(age) > 0 && Number(height) > 0 && Number(weight) > 0)) return;
  saveOnboardData(name, age, height, weight);
  closeOnboarding(true, () => render());
});

// --- Skip ---
document.getElementById("onboardSkipBtn")?.addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.remove("is-hidden");
});
document.getElementById("onboardConfirmCancel")?.addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.add("is-hidden");
});
document.getElementById("onboardConfirmSkip")?.addEventListener("click", () => {
  document.getElementById("onboardConfirmModal").classList.add("is-hidden");
  saveOnboardData("Athlete", 0, 0, 0);
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
  return `<div class="el-ex-card" data-ex-id="${ex.id}">
    <div class="el-ex-info">
      <div class="el-ex-name">${ex.name}</div>
      <div class="el-ex-meta">${ex.primaryMuscle} · ${ex.equipment}</div>
    </div>
    <button class="el-ex-fav${isFav ? " is-fav" : ""}">${isFav ? "★" : "☆"}</button>
    <button class="el-ex-add">+</button>
  </div>`;
}

function bindExerciseCardClicks(container, favs) {
  container.querySelectorAll(".el-ex-card").forEach((card) => {
    const exId = card.dataset.exId;
    const favBtn = card.querySelector(".el-ex-fav");
    const addBtn = card.querySelector(".el-ex-add");

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
  });
}

function addExerciseToWorkout(exId) {
  const allCustom = state.customExercises || [];
  const exDef = EXERCISE_LIBRARY.find((e) => e.id === exId) || allCustom.find((e) => e.id === exId);
  if (!exDef) return;

  const session = getTodaySession();
  const existing = session.exercises.find((e) => e.name === exDef.name);
  if (!existing) {
    session.exercises.push({
      name: exDef.name,
      sets: Array.from({ length: 3 }, () => ({ reps: 8, weight: "", done: false })),
    });
    saveState();
  }

  addRecentExercise(exId);

  showScreen("screen-ws");
  renderWorkoutSession();
}

// ===== CUSTOM EXERCISE =====
function openCustomExerciseModal() {
  document.getElementById("customExName").value = "";
  document.getElementById("customExEquipment").value = "";
  document.getElementById("customExModal").classList.remove("is-hidden");
}

function saveCustomExercise() {
  const name = document.getElementById("customExName").value.trim();
  const category = document.getElementById("customExCategory").value;
  const equipment = document.getElementById("customExEquipment").value.trim() || "Other";
  if (!name) return;

  const newEx = {
    id: "custom-" + crypto.randomUUID().slice(0, 8),
    name,
    category,
    primaryMuscle: category,
    secondaryMuscles: [],
    equipment,
    isCustom: true,
  };

  if (!state.customExercises) state.customExercises = [];
  state.customExercises.push(newEx);
  saveState();

  document.getElementById("customExModal").classList.add("is-hidden");
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
document.getElementById("homeNewWorkout").addEventListener("click", () => {
  showNewWorkoutBuilder();
});

document.getElementById("homeNewGroup").addEventListener("click", () => {
  showWorkoutPicker();
});
function showWorkoutPicker() {
  const activePlan = loadCustomProgram() || plan;
  const list = document.getElementById("wpWorkoutList");
  const favs = state.favoriteWorkoutIds || [];

  if (!state.favoriteWorkoutIds) state.favoriteWorkoutIds = [];

  list.innerHTML = activePlan
    .map((w) => {
      const isFav = favs.includes(w.id);
      return `<label class="wp-row" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.65rem;background:var(--surface-2);border-radius:var(--radius-sm);cursor:pointer">
      <input type="checkbox" class="wp-check" data-id="${w.id}" />
      <span style="flex:1;font-weight:600;font-size:0.85rem">${w.name}</span>
      <span class="wp-fav" data-id="${w.id}" style="cursor:pointer;font-size:1.1rem;color:${isFav ? "var(--accent)" : "var(--text-secondary)"}">${isFav ? "★" : "☆"}</span>
    </label>`;
    })
    .join("");

  document.getElementById("wpGroupName").value = "";
  document.getElementById("wpCreateBtn").disabled = true;
  document.getElementById("workoutPickerModal").classList.remove("is-hidden");

  // Bind favorite toggles
  list.querySelectorAll(".wp-fav").forEach((star) => {
    star.addEventListener("click", (e) => {
      e.preventDefault();
      const id = star.dataset.id;
      const favs2 = state.favoriteWorkoutIds || [];
      const idx = favs2.indexOf(id);
      if (idx >= 0) {
        favs2.splice(idx, 1);
        star.textContent = "☆";
        star.style.color = "var(--text-secondary)";
      } else {
        favs2.push(id);
        star.textContent = "★";
        star.style.color = "var(--accent)";
      }
      state.favoriteWorkoutIds = favs2;
      saveState();
    });
  });

  // Bind checkbox changes
  list.querySelectorAll(".wp-check").forEach((cb) => {
    cb.addEventListener("change", () => {
      const checked = list.querySelectorAll(".wp-check:checked").length;
      document.getElementById("wpCreateBtn").disabled = checked === 0 || !document.getElementById("wpGroupName").value.trim();
    });
  });
}

document.getElementById("wpClose").addEventListener("click", () => {
  document.getElementById("workoutPickerModal").classList.add("is-hidden");
});
document.getElementById("wpGroupName").addEventListener("input", () => {
  const checked = document.getElementById("wpWorkoutList").querySelectorAll(".wp-check:checked").length;
  document.getElementById("wpCreateBtn").disabled = checked === 0 || !document.getElementById("wpGroupName").value.trim();
});
document.getElementById("wpCreateBtn").addEventListener("click", () => {
  const name = document.getElementById("wpGroupName").value.trim();
  if (!name) return;
  const checked = [...document.getElementById("wpWorkoutList").querySelectorAll(".wp-check:checked")];
  const ids = checked.map((cb) => cb.dataset.id);
  if (!ids.length) return;

  const group = { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, workoutIds: ids };
  if (!state.workoutGroups) state.workoutGroups = [];
  state.workoutGroups.push(group);
  saveState();
  document.getElementById("workoutPickerModal").classList.add("is-hidden");
  renderHome();
});

// ===== NEW WORKOUT BUILDER SCREEN =====
function showNewWorkoutBuilder() {
  document.getElementById("nwGroupName").value = "";
  document.getElementById("nwCreateBtn").disabled = true;
  document.getElementById("nwFooter").style.display = "none";
  renderNewWorkoutList();
  showScreen("screen-new-workout");
}

function renderNewWorkoutList() {
  const container = document.getElementById("nwList");
  const cats = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Legs", "Glutes", "Calves", "Abs", "Forearms", "Full Body"];
  let html = "";
  let total = 0;
  cats.forEach((cat) => {
    const exs = EXERCISE_LIBRARY.filter((e) => e.category === cat);
    if (!exs.length) return;
    total += exs.length;
    html += `<div class="nw-category">${cat}</div>`;
    exs.forEach((ex) => {
      html += `<label class="nw-ex-row" data-id="${ex.id}">
        <input type="checkbox" class="nw-check" data-id="${ex.id}" />
        <span class="nw-ex-name">${ex.name}</span>
        <span class="nw-ex-muscle">${ex.primaryMuscle}</span>
      </label>`;
    });
  });
  container.innerHTML = html;
  document.getElementById("nwCounter").textContent = `0 of ${total} exercises selected`;

  container.querySelectorAll(".nw-check").forEach((cb) => {
    cb.addEventListener("change", updateNwState);
  });
}

function updateNwState() {
  const checked = document.querySelectorAll(".nw-check:checked");
  document.getElementById("nwCounter").textContent = `${checked.length} exercises selected`;
  document.getElementById("nwFooter").style.display = checked.length ? "block" : "none";
  updateNwCreateBtn();
}
function updateNwCreateBtn() {
  const checked = document.querySelectorAll(".nw-check:checked").length;
  const name = document.getElementById("nwGroupName").value.trim();
  document.getElementById("nwCreateBtn").disabled = !checked || !name;
}

document.getElementById("nwBackBtn").addEventListener("click", () => {
  showScreen("screen-home");
});
document.getElementById("nwGroupName").addEventListener("input", updateNwCreateBtn);
document.getElementById("nwCreateBtn").addEventListener("click", () => {
  const groupName = document.getElementById("nwGroupName").value.trim();
  if (!groupName) return;
  const checked = [...document.querySelectorAll(".nw-check:checked")];
  if (!checked.length) return;

  const exercises = checked.map((cb) => {
    const ex = EXERCISE_LIBRARY.find((e) => e.id === cb.dataset.id);
    return { name: ex.name, sets: [], notes: "" };
  });

  // Create workout
  let activePlan = loadCustomProgram();
  if (!activePlan) {
    activePlan = [...plan];
    state.plan = activePlan;
  }
  const workout = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: groupName + " Workout",
    exercises,
  };
  activePlan.push(workout);
  localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));

  // Create group
  if (!state.workoutGroups) state.workoutGroups = [];
  const groupId2 = crypto.randomUUID ? crypto.randomUUID().slice(0, 12) : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  state.workoutGroups.push({ id: groupId2, name: groupName, workoutIds: [workout.id] });
  saveState();

  showScreen("screen-home");
  renderHome();
});

document.getElementById("homeBuilderBtn").addEventListener("click", () => {
  document.getElementById("builderGoal").value = "";
  document.getElementById("builderDays").value = "";
  document.getElementById("builderEquipment").value = "";
  document.getElementById("builderDuration").value = "";
  document.getElementById("builderResult").innerHTML = "";
  document.getElementById("builderGenerateBtn").disabled = true;
  document.getElementById("builderModal").classList.remove("is-hidden");
});

// ===== EVENT LISTENERS: CREATE WORKOUT =====
document.getElementById("cwClose").addEventListener("click", () => {
  document.getElementById("createWorkoutModal").classList.add("is-hidden");
});
document.getElementById("cwSaveBtn").addEventListener("click", () => {
  const name = document.getElementById("cwName").value.trim();
  if (!name) return;
  const activePlan = loadCustomProgram() || plan;
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
  const groupId = document.getElementById("cwGroup").value;
  if (groupId) {
    const group = (state.workoutGroups || []).find((g) => g.id === groupId);
    if (group) group.workoutIds.push(newWorkout.id);
  }
  try {
    localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
  } catch {}
  state.plan = activePlan;
  saveState();
  document.getElementById("createWorkoutModal").classList.add("is-hidden");
  renderHome();
});

// ===== EVENT LISTENERS: CREATE GROUP =====
document.getElementById("cgClose").addEventListener("click", () => {
  nwPendingExercises = [];
  document.getElementById("createGroupModal").classList.add("is-hidden");
});
document.getElementById("cgSaveBtn").addEventListener("click", () => {
  const name = document.getElementById("cgName").value.trim();
  if (!name) return;
  if (!state.workoutGroups) state.workoutGroups = [];
  const groupId = crypto.randomUUID ? crypto.randomUUID().slice(0, 12) : Date.now().toString(36);
  const workoutIds = [];

  // If coming from the new workout builder, create the workout first
  if (nwPendingExercises.length) {
    const workoutName = name + " Workout";
    let activePlan = loadCustomProgram();
    if (!activePlan) {
      activePlan = [...plan];
      state.plan = activePlan;
    }
    const workout = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: workoutName,
      exercises: nwPendingExercises,
    };
    activePlan.push(workout);
    localStorage.setItem("wl_custom_program", JSON.stringify(activePlan));
    saveState();
    workoutIds.push(workout.id);
    nwPendingExercises = [];
    document.getElementById("screen-new-workout").classList.add("is-hidden");
  }

  state.workoutGroups.push({ id: groupId, name, workoutIds });
  saveState();
  if (document.getElementById("screen-home")) showScreen("screen-home");
  document.getElementById("createGroupModal").classList.add("is-hidden");
  renderHome();
});

// ===== EVENT LISTENERS: SETTINGS =====
document.getElementById("wsMenuBtn").addEventListener("click", () => {
  // Show workout menu dropdown
  const menu = document.getElementById("wsMenuDropdown") || createWorkoutMenu();
  menu.classList.toggle("is-hidden");
});
function createWorkoutMenu() {
  const d = document.createElement("div");
  d.id = "wsMenuDropdown";
  d.className = "ws-dropdown is-hidden";
  d.innerHTML = `<button class="ws-dropdown-item" data-action="edit-workout">✏️ Edit Workout</button><button class="ws-dropdown-item" data-action="delete-workout">🗑️ Delete Workout</button>`;
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
      alert("Edit feature coming soon. You can rename workouts from the workout builder.");
      d.classList.add("is-hidden");
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
      workoutGroups: state.workoutGroups || [],
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
      goalAnalysis: state.goalAnalysis !== false,
      muscleCoverage: state.muscleCoverage !== false,
      progressSuggestions: state.progressSuggestions !== false,
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
    "goal-analysis": "goalAnalysis",
    "muscle-coverage": "muscleCoverage",
    "progress-suggestions": "progressSuggestions",
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
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("wl_custom_program");
  localStorage.removeItem("wl_prs");
  localStorage.removeItem("nutrition_v2");
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

const STRETCH_ROUTINES = {
  Push: [
    { name: "Chest Stretch", duration: 45 },
    { name: "Shoulder Stretch", duration: 45 },
    { name: "Triceps Stretch", duration: 45 },
    { name: "Doorway Stretch", duration: 45 },
    { name: "Wrist Flexor Stretch", duration: 45 },
  ],
  Pull: [
    { name: "Lat Stretch", duration: 45 },
    { name: "Upper Back Stretch", duration: 45 },
    { name: "Biceps Stretch", duration: 45 },
    { name: "Neck Stretch", duration: 45 },
    { name: "Forearm Stretch", duration: 45 },
    { name: "Cat-Cow", duration: 45 },
  ],
  Legs: [
    { name: "Quad Stretch", duration: 45 },
    { name: "Hamstring Stretch", duration: 45 },
    { name: "Calf Stretch", duration: 45 },
    { name: "Hip Flexor Stretch", duration: 45 },
    { name: "Glute Stretch", duration: 45 },
    { name: "Adductor Stretch", duration: 45 },
  ],
};

const BREATHING_RESET = { name: "Breathing Reset", duration: 60 };

let warmupTimerInterval = null;
let warmupTimerSeconds = 0;
let stretchTimerInterval = null;
let stretchTimerSeconds = 0;
let stretchCurrentIndex = 0;

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
  const base = STRETCH_ROUTINES[type] || STRETCH_ROUTINES["Push"];
  return [...base, BREATHING_RESET];
}

function openCoolDown() {
  const routine = getCoolDownRoutine();
  stretchCurrentIndex = 0;
  showStretchExercise(routine);
  document.getElementById("stretchTimerModal").classList.remove("is-hidden");

  document.getElementById("stCloseBtn").onclick = () => {
    stopStretchTimer();
    document.getElementById("stretchTimerModal").classList.add("is-hidden");
    finishWorkoutComplete();
  };
  document.getElementById("stPrevBtn").onclick = () => {
    if (stretchCurrentIndex > 0) {
      stopStretchTimer();
      stretchCurrentIndex--;
      showStretchExercise(routine);
    }
  };
  document.getElementById("stNextBtn").onclick = () => {
    stopStretchTimer();
    stretchCurrentIndex++;
    showStretchExercise(routine);
  };
  document.getElementById("stSkipBtn").onclick = () => {
    stopStretchTimer();
    document.getElementById("stretchTimerModal").classList.add("is-hidden");
    finishWorkoutComplete();
  };
}

function showStretchExercise(routine) {
  if (stretchCurrentIndex >= routine.length) {
    stopStretchTimer();
    document.getElementById("stretchTimerModal").classList.add("is-hidden");
    finishWorkoutComplete();
    return;
  }
  const ex = routine[stretchCurrentIndex];
  document.getElementById("stExName").textContent = ex.name;
  stretchTimerSeconds = ex.duration;
  updateStretchTimerDisplay();
  renderStretchDots(routine);
  document.getElementById("stPrevBtn").style.visibility = stretchCurrentIndex > 0 ? "visible" : "hidden";
  document.getElementById("stNextBtn").textContent = stretchCurrentIndex < routine.length - 1 ? "Next ›" : "✓ Done";
  if (state.autoAdvanceStretches !== false) {
    startStretchTimer(routine);
  } else {
    stopStretchTimer();
  }
}

function renderStretchDots(routine) {
  const container = document.getElementById("stProgressDots");
  container.innerHTML = routine.map((_, i) =>
    `<span class="st-dot ${i === stretchCurrentIndex ? "is-active" : i < stretchCurrentIndex ? "is-done" : ""}"></span>`
  ).join("");
}

function startStretchTimer(routine) {
  if (stretchTimerInterval) clearInterval(stretchTimerInterval);
  stretchTimerInterval = setInterval(() => {
    stretchTimerSeconds--;
    if (stretchTimerSeconds <= 0) {
      if (state.autoAdvanceStretches !== false) {
        stretchCurrentIndex++;
        showStretchExercise(routine);
        return;
      } else {
        stretchTimerSeconds = 0;
        stopStretchTimer();
        updateStretchTimerDisplay();
        return;
      }
    }
    updateStretchTimerDisplay();
  }, 1000);
}

function stopStretchTimer() {
  if (stretchTimerInterval) {
    clearInterval(stretchTimerInterval);
    stretchTimerInterval = null;
  }
}

function updateStretchTimerDisplay() {
  const s = Math.max(0, stretchTimerSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  document.getElementById("stTimer").textContent = `${m}:${String(sec).padStart(2, "0")}`;
}

function finishWorkoutComplete() {
  const session = getTodaySession();
  if (session) {
    session.notes = document.getElementById("ssNotesInput")?.value || session.notes || "";
    saveState();
  }
  // Data systems update here
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
      document.getElementById("wtPauseBtn").textContent = "▶ Resume";
    } else {
      startWarmupTimer();
      document.getElementById("wtPauseBtn").textContent = "⏸ Pause";
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

function getWarmupCompliance() {
  const sessions = state.sessions.filter((s) => s.finishedAt);
  if (sessions.length === 0) return { pct: 0, done: 0, total: 0 };
  const done = sessions.filter((s) => s.warmupDone).length;
  return { pct: Math.round((done / sessions.length) * 100), done, total: sessions.length };
}

function getStretchCompliance() {
  const sessions = state.sessions.filter((s) => s.finishedAt);
  if (sessions.length === 0) return { pct: 0, done: 0, total: 0 };
  const done = sessions.filter((s) => s.stretchDone).length;
  return { pct: Math.round((done / sessions.length) * 100), done, total: sessions.length };
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

  render();

  if (!state.user) {
    openOnboarding(true);
  }

  const todaySession = getTodaySession();
  if (todaySession && todaySession.exercises.some((e) => e.sets.some((s) => s.done))) {
    startStopwatch();
  }

  activateTab("sets");

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
});

// ===== WEIGHT BOTTOM SHEET =====
document.addEventListener("click", (e) => {
  const editBtn = e.target.closest("#snapshotEditBtn");
  if (editBtn) {
    const entry = latestWeight();
    document.getElementById("wlWeight").value = entry ? entry.weight : "";
    document.getElementById("wlSave").disabled = !(entry && entry.weight > 0);
    document.getElementById("weightLogSheet").classList.remove("is-hidden");
    setTimeout(() => document.getElementById("wlWeight").focus(), 150);
  }
});
document.getElementById("wlOverlay")?.addEventListener("click", () => {
  document.getElementById("weightLogSheet").classList.add("is-hidden");
});
document.getElementById("wlCancel")?.addEventListener("click", () => {
  document.getElementById("weightLogSheet").classList.add("is-hidden");
});
document.getElementById("wlSave")?.addEventListener("click", () => {
  const w = Number(document.getElementById("wlWeight").value);
  if (!w) return;
  saveBodyLogEntry({ date: getDateKey(), weight: w });
  document.getElementById("weightLogSheet").classList.add("is-hidden");
  renderHome();
  renderBodyTab();
});
document.getElementById("wlWeight")?.addEventListener("input", (e) => {
  document.getElementById("wlSave").disabled = !(Number(e.target.value) > 0);
});
document.getElementById("wlWeight")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("wlSave").click();
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
