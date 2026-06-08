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
  "sternocleidomastoid-left":"neck","sternocleidomastoid-right":"neck",
  "anterior-deltoid-left":"frontDelts","anterior-deltoid-right":"frontDelts",
  "lateral-deltoid-left":"sideDelts","lateral-deltoid-right":"sideDelts",
  "pectoralis-major-upper-left":"upperChest","pectoralis-major-upper-right":"upperChest",
  "pectoralis-major-lower-left":"lowerChest","pectoralis-major-lower-right":"lowerChest",
  "serratus-left":"obliques","serratus-right":"obliques",
  "external-oblique-left":"obliques","external-oblique-right":"obliques",
  "rectus-abdominis-upper-left":"upperAbs","rectus-abdominis-upper-right":"upperAbs",
  "rectus-abdominis-middle-left":"upperAbs","rectus-abdominis-middle-right":"upperAbs",
  "rectus-abdominis-lower-left":"lowerAbs","rectus-abdominis-lower-right":"lowerAbs",
  "biceps-left":"biceps","biceps-right":"biceps",
  "brachialis-left":"biceps","brachialis-right":"biceps",
  "forearm-flexors-left":"forearms","forearm-flexors-right":"forearms",
  "adductors-left":"innerThighs","adductors-right":"innerThighs",
  "quadriceps-outer-left":"quads","quadriceps-outer-right":"quads",
  "quadriceps-inner-left":"quads","quadriceps-inner-right":"quads",
  "tibialis-anterior-left":"tibialis","tibialis-anterior-right":"tibialis",
  "upper-trapezius-left":"upperTraps","upper-trapezius-right":"upperTraps",
  "middle-trapezius-left":"middleTraps","middle-trapezius-right":"middleTraps",
  "lower-trapezius-left":"lowerTraps","lower-trapezius-right":"lowerTraps",
  "rear-deltoid-left":"rearDelts","rear-deltoid-right":"rearDelts",
  "teres-major-left":"lats","teres-major-right":"lats",
  "rhomboid-left":"midBack","rhomboid-right":"midBack",
  "latissimus-left":"lats","latissimus-right":"lats",
  "triceps-long-head-left":"triceps","triceps-long-head-right":"triceps",
  "triceps-lateral-head-left":"triceps","triceps-lateral-head-right":"triceps",
  "erector-spinae-left":"lowerBack","erector-spinae-right":"lowerBack",
  "glute-max-left":"glutes","glute-max-right":"glutes",
  "glute-med-left":"glutes","glute-med-right":"glutes",
  "hamstring-inner-left":"hamstrings","hamstring-inner-right":"hamstrings",
  "hamstring-outer-left":"hamstrings","hamstring-outer-right":"hamstrings",
  "gastrocnemius-inner-left":"calvesBack","gastrocnemius-inner-right":"calvesBack",
  "gastrocnemius-outer-left":"calvesBack","gastrocnemius-outer-right":"calvesBack",
  "soleus-left":"calvesBack","soleus-right":"calvesBack",
};

const MUSCLE_LABEL_MAP = {
  "sternocleidomastoid-left":"Sternocleidomastoid (L)","sternocleidomastoid-right":"Sternocleidomastoid (R)",
  "anterior-deltoid-left":"Front Delt (L)","anterior-deltoid-right":"Front Delt (R)",
  "lateral-deltoid-left":"Side Delt (L)","lateral-deltoid-right":"Side Delt (R)",
  "pectoralis-major-upper-left":"Upper Pec (L)","pectoralis-major-upper-right":"Upper Pec (R)",
  "pectoralis-major-lower-left":"Lower Pec (L)","pectoralis-major-lower-right":"Lower Pec (R)",
  "serratus-left":"Serratus (L)","serratus-right":"Serratus (R)",
  "external-oblique-left":"Oblique (L)","external-oblique-right":"Oblique (R)",
  "rectus-abdominis-upper-left":"Upper Ab (L)","rectus-abdominis-upper-right":"Upper Ab (R)",
  "rectus-abdominis-middle-left":"Mid Ab (L)","rectus-abdominis-middle-right":"Mid Ab (R)",
  "rectus-abdominis-lower-left":"Lower Ab (L)","rectus-abdominis-lower-right":"Lower Ab (R)",
  "biceps-left":"Biceps (L)","biceps-right":"Biceps (R)",
  "brachialis-left":"Brachialis (L)","brachialis-right":"Brachialis (R)",
  "forearm-flexors-left":"Forearm Flexors (L)","forearm-flexors-right":"Forearm Flexors (R)",
  "adductors-left":"Adductor (L)","adductors-right":"Adductor (R)",
  "quadriceps-outer-left":"Outer Quad (L)","quadriceps-outer-right":"Outer Quad (R)",
  "quadriceps-inner-left":"Inner Quad (L)","quadriceps-inner-right":"Inner Quad (R)",
  "tibialis-anterior-left":"Tibialis (L)","tibialis-anterior-right":"Tibialis (R)",
  "upper-trapezius-left":"Upper Trap (L)","upper-trapezius-right":"Upper Trap (R)",
  "middle-trapezius-left":"Mid Trap (L)","middle-trapezius-right":"Mid Trap (R)",
  "lower-trapezius-left":"Lower Trap (L)","lower-trapezius-right":"Lower Trap (R)",
  "rear-deltoid-left":"Rear Delt (L)","rear-deltoid-right":"Rear Delt (R)",
  "teres-major-left":"Teres Major (L)","teres-major-right":"Teres Major (R)",
  "rhomboid-left":"Rhomboid (L)","rhomboid-right":"Rhomboid (R)",
  "latissimus-left":"Lat (L)","latissimus-right":"Lat (R)",
  "triceps-long-head-left":"Triceps Long (L)","triceps-long-head-right":"Triceps Long (R)",
  "triceps-lateral-head-left":"Triceps Lateral (L)","triceps-lateral-head-right":"Triceps Lateral (R)",
  "erector-spinae-left":"Erector Spinae (L)","erector-spinae-right":"Erector Spinae (R)",
  "glute-max-left":"Glute Max (L)","glute-max-right":"Glute Max (R)",
  "glute-med-left":"Glute Med (L)","glute-med-right":"Glute Med (R)",
  "hamstring-inner-left":"Inner Hamstring (L)","hamstring-inner-right":"Inner Hamstring (R)",
  "hamstring-outer-left":"Outer Hamstring (L)","hamstring-outer-right":"Outer Hamstring (R)",
  "gastrocnemius-inner-left":"Inner Calf (L)","gastrocnemius-inner-right":"Inner Calf (R)",
  "gastrocnemius-outer-left":"Outer Calf (L)","gastrocnemius-outer-right":"Outer Calf (R)",
  "soleus-left":"Soleus (L)","soleus-right":"Soleus (R)",
  "neck":"Neck","upperChest":"Upper Chest","middleChest":"Middle Chest","lowerChest":"Lower Chest",
  "frontDelts":"Front Delts","sideDelts":"Side Delts",
  "biceps":"Biceps","forearms":"Forearms",
  "upperAbs":"Upper Abs","lowerAbs":"Lower Abs",
  "obliques":"Obliques","hipFlexors":"Hip Flexors",
  "quads":"Quads","innerThighs":"Inner Thighs","calves":"Calves","tibialis":"Tibialis",
  "upperTraps":"Upper Traps","middleTraps":"Mid Traps","lowerTraps":"Lower Traps",
  "rearDelts":"Rear Delts","lats":"Lats","midBack":"Mid Back","lowerBack":"Lower Back",
  "triceps":"Triceps","forearmsBack":"Forearms","glutes":"Glutes","hamstrings":"Hamstrings","calvesBack":"Calves",
};

const EXERCISE_MUSCLE_CONTRIBUTION = {
  "Flat Barbell Bench Press": [
    { id: "upperChest", pct: 0.25 }, { id: "middleChest", pct: 0.30 },
    { id: "lowerChest", pct: 0.15 }, { id: "frontDelts", pct: 0.20 },
    { id: "triceps", pct: 0.10 },
  ],
  "Incline Dumbbell Press": [
    { id: "upperChest", pct: 0.40 }, { id: "middleChest", pct: 0.20 },
    { id: "frontDelts", pct: 0.25 }, { id: "triceps", pct: 0.15 },
  ],
  "Landmine Press": [
    { id: "frontDelts", pct: 0.35 }, { id: "sideDelts", pct: 0.20 },
    { id: "triceps", pct: 0.25 }, { id: "upperChest", pct: 0.20 },
  ],
  "Cable Lateral Raise": [
    { id: "sideDelts", pct: 0.80 }, { id: "frontDelts", pct: 0.20 },
  ],
  "Cable Overhead Tricep Extension": [{ id: "triceps", pct: 1.0 }],
  "Tricep Rope Pushdown": [{ id: "triceps", pct: 1.0 }],
  "Conventional Deadlift": [
    { id: "hamstrings", pct: 0.25 }, { id: "glutes", pct: 0.20 },
    { id: "lowerBack", pct: 0.15 }, { id: "midBack", pct: 0.10 },
    { id: "lats", pct: 0.10 }, { id: "forearmsBack", pct: 0.10 },
    { id: "quads", pct: 0.10 },
  ],
  "Weighted Pull-Up / Lat Pulldown": [
    { id: "lats", pct: 0.40 }, { id: "midBack", pct: 0.15 },
    { id: "lowerTraps", pct: 0.10 }, { id: "biceps", pct: 0.20 },
    { id: "rearDelts", pct: 0.15 },
  ],
  "Chest-Supported Dumbbell Row": [
    { id: "midBack", pct: 0.30 }, { id: "lats", pct: 0.20 },
    { id: "lowerTraps", pct: 0.15 }, { id: "biceps", pct: 0.15 },
    { id: "rearDelts", pct: 0.20 },
  ],
  "Face Pulls": [
    { id: "rearDelts", pct: 0.50 }, { id: "upperTraps", pct: 0.20 },
    { id: "sideDelts", pct: 0.30 },
  ],
  "Incline Dumbbell Curl": [{ id: "biceps", pct: 1.0 }],
  "Farmer's Carry": [
    { id: "forearms", pct: 0.40 }, { id: "upperTraps", pct: 0.20 },
    { id: "quads", pct: 0.20 }, { id: "upperAbs", pct: 0.10 },
    { id: "lowerAbs", pct: 0.10 },
  ],
  "Box Squat to Parallel": [
    { id: "quads", pct: 0.45 }, { id: "glutes", pct: 0.25 },
    { id: "hipFlexors", pct: 0.10 }, { id: "lowerBack", pct: 0.10 },
    { id: "upperAbs", pct: 0.10 },
  ],
  "Romanian Deadlift": [
    { id: "hamstrings", pct: 0.45 }, { id: "glutes", pct: 0.25 },
    { id: "lowerBack", pct: 0.20 }, { id: "midBack", pct: 0.10 },
  ],
  "Leg Press (Feet High)": [
    { id: "quads", pct: 0.50 }, { id: "glutes", pct: 0.30 },
    { id: "hamstrings", pct: 0.20 },
  ],
  "Seated Leg Curl": [{ id: "hamstrings", pct: 1.0 }],
  "Standing Calf Raise": [{ id: "calves", pct: 1.0 }],
  "Lat Pulldown / Pull-Up": [
    { id: "lats", pct: 0.40 }, { id: "midBack", pct: 0.15 },
    { id: "lowerTraps", pct: 0.10 }, { id: "biceps", pct: 0.20 },
    { id: "rearDelts", pct: 0.15 },
  ],
  "Seated Cable Row": [
    { id: "midBack", pct: 0.35 }, { id: "lats", pct: 0.20 },
    { id: "lowerTraps", pct: 0.10 }, { id: "biceps", pct: 0.20 },
    { id: "rearDelts", pct: 0.15 },
  ],
  "Barbell Shrug": [
    { id: "upperTraps", pct: 0.80 }, { id: "middleTraps", pct: 0.20 },
  ],
  "Hammer Curl": [
    { id: "biceps", pct: 0.60 }, { id: "forearms", pct: 0.40 },
  ],
  "Reverse Curl": [
    { id: "forearms", pct: 0.80 }, { id: "biceps", pct: 0.20 },
  ],
  "Romanian Deadlift (Heavy)": [
    { id: "hamstrings", pct: 0.45 }, { id: "glutes", pct: 0.25 },
    { id: "lowerBack", pct: 0.20 }, { id: "midBack", pct: 0.10 },
  ],
  "Seated Dumbbell Shoulder Press": [
    { id: "frontDelts", pct: 0.35 }, { id: "sideDelts", pct: 0.25 },
    { id: "triceps", pct: 0.20 }, { id: "upperChest", pct: 0.20 },
  ],
  "Box Squat (Light)": [
    { id: "quads", pct: 0.45 }, { id: "glutes", pct: 0.25 },
    { id: "hipFlexors", pct: 0.10 }, { id: "lowerBack", pct: 0.10 },
    { id: "upperAbs", pct: 0.10 },
  ],
  "Dips": [
    { id: "lowerChest", pct: 0.35 }, { id: "triceps", pct: 0.35 },
    { id: "frontDelts", pct: 0.30 },
  ],
  "Push-Ups": [
    { id: "middleChest", pct: 0.35 }, { id: "triceps", pct: 0.25 },
    { id: "frontDelts", pct: 0.20 }, { id: "upperAbs", pct: 0.20 },
  ],
  "Dumbbell Bench Press": [
    { id: "middleChest", pct: 0.35 }, { id: "frontDelts", pct: 0.25 },
    { id: "triceps", pct: 0.20 }, { id: "upperAbs", pct: 0.20 },
  ],
  "Close-Grip Bench Press": [
    { id: "triceps", pct: 0.50 }, { id: "middleChest", pct: 0.25 },
    { id: "frontDelts", pct: 0.25 },
  ],
  "Dumbbell Pullover": [
    { id: "lats", pct: 0.50 }, { id: "lowerChest", pct: 0.30 },
    { id: "triceps", pct: 0.20 },
  ],
  "Standing Overhead Press": [
    { id: "frontDelts", pct: 0.35 }, { id: "sideDelts", pct: 0.25 },
    { id: "triceps", pct: 0.25 }, { id: "upperChest", pct: 0.15 },
  ],
  "Front Raise": [
    { id: "frontDelts", pct: 0.60 }, { id: "upperChest", pct: 0.20 },
    { id: "sideDelts", pct: 0.20 },
  ],
  "Reverse Fly": [
    { id: "rearDelts", pct: 0.60 }, { id: "upperTraps", pct: 0.20 },
    { id: "middleTraps", pct: 0.20 },
  ],
  "Arnold Press": [
    { id: "frontDelts", pct: 0.30 }, { id: "sideDelts", pct: 0.30 },
    { id: "triceps", pct: 0.20 }, { id: "upperChest", pct: 0.20 },
  ],
  "Skull Crushers": [{ id: "triceps", pct: 1.0 }],
  "Preacher Curl": [{ id: "biceps", pct: 1.0 }],
  "Concentration Curl": [{ id: "biceps", pct: 1.0 }],
  "Tricep Kickback": [{ id: "triceps", pct: 1.0 }],
  "Barbell Row": [
    { id: "midBack", pct: 0.30 }, { id: "lats", pct: 0.25 },
    { id: "lowerTraps", pct: 0.15 }, { id: "biceps", pct: 0.15 },
    { id: "rearDelts", pct: 0.15 },
  ],
  "Chin-Ups": [
    { id: "lats", pct: 0.30 }, { id: "midBack", pct: 0.15 },
    { id: "biceps", pct: 0.35 }, { id: "lowerTraps", pct: 0.10 },
    { id: "rearDelts", pct: 0.10 },
  ],
  "Good Mornings": [
    { id: "hamstrings", pct: 0.35 }, { id: "lowerBack", pct: 0.35 },
    { id: "glutes", pct: 0.30 },
  ],
  "Back Extension": [
    { id: "lowerBack", pct: 0.50 }, { id: "glutes", pct: 0.25 },
    { id: "hamstrings", pct: 0.25 },
  ],
  "Front Squat": [
    { id: "quads", pct: 0.50 }, { id: "glutes", pct: 0.20 },
    { id: "upperAbs", pct: 0.15 }, { id: "lowerBack", pct: 0.15 },
  ],
  "Hip Thrust": [
    { id: "glutes", pct: 0.70 }, { id: "hamstrings", pct: 0.30 },
  ],
  "Bulgarian Split Squat": [
    { id: "quads", pct: 0.45 }, { id: "glutes", pct: 0.35 },
    { id: "hamstrings", pct: 0.10 }, { id: "innerThighs", pct: 0.10 },
  ],
  "Lunges": [
    { id: "quads", pct: 0.40 }, { id: "glutes", pct: 0.25 },
    { id: "hamstrings", pct: 0.20 }, { id: "calves", pct: 0.15 },
  ],
  "Glute Bridge": [
    { id: "glutes", pct: 0.65 }, { id: "hamstrings", pct: 0.25 },
    { id: "lowerBack", pct: 0.10 },
  ],
  "Planks": [
    { id: "upperAbs", pct: 0.40 }, { id: "lowerAbs", pct: 0.30 },
    { id: "obliques", pct: 0.20 }, { id: "hipFlexors", pct: 0.10 },
  ],
  "Hanging Leg Raise": [
    { id: "lowerAbs", pct: 0.45 }, { id: "upperAbs", pct: 0.25 },
    { id: "hipFlexors", pct: 0.20 }, { id: "obliques", pct: 0.10 },
  ],
  "Cable Crunch": [
    { id: "upperAbs", pct: 0.60 }, { id: "lowerAbs", pct: 0.40 },
  ],
  "Pallof Press": [
    { id: "obliques", pct: 0.70 }, { id: "upperAbs", pct: 0.30 },
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
  "Dips": ["lowerChest", "triceps", "frontDelts"],
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
  "Lunges": ["quads", "glutes", "hamstrings", "calves"],
  "Glute Bridge": ["glutes", "hamstrings", "lowerBack"],
  "Planks": ["upperAbs", "lowerAbs", "obliques", "hipFlexors"],
  "Hanging Leg Raise": ["lowerAbs", "upperAbs", "hipFlexors", "obliques"],
  "Cable Crunch": ["upperAbs", "lowerAbs"],
  "Pallof Press": ["obliques", "upperAbs"],
};

// ===== STATE =====
function loadState() {
  const fallback = { sessions: [], nutrition: {}, planOffset: 0, recoveryLog: [], bodyGoal: "recomp", calorieTarget: CAL_GOAL, fatTarget: FAT_GOAL, user: null, plan: null };
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

function getNextUndoneSet(exSession) {
  return exSession.sets.findIndex((s) => !s.done);
}

// ===== PR SYSTEM =====
function loadPRs() {
  try { return JSON.parse(localStorage.getItem("wl_prs")) || {}; } catch { return {}; }
}
function savePRs(prs) { try { localStorage.setItem("wl_prs", JSON.stringify(prs)); } catch {} }

function checkPRs(session) {
  const prs = loadPRs();
  let updated = false;
  const newPRs = [];
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.done && set.weight && Number(set.weight) > 0) {
        const w = Number(set.weight);
        const current = prs[ex.name];
        if (!current || w > current.weight) {
          prs[ex.name] = { weight: w, reps: set.reps, date: session.dateKey };
          updated = true;
          newPRs.push({ name: ex.name, weight: w, reps: set.reps });
        } else if (current && w === current.weight && set.reps > current.reps) {
          prs[ex.name] = { weight: w, reps: set.reps, date: session.dateKey };
          updated = true;
          newPRs.push({ name: ex.name, weight: w, reps: set.reps, repPr: true });
        }
      }
    }
  }
  if (updated) savePRs(prs);
  return newPRs;
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

function loadCustomProgram() {
  if (state.plan) return state.plan;
  try { return JSON.parse(localStorage.getItem("wl_custom_program")); } catch { return null; }
}

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

// ===== MUSCLE COMPUTATION =====
// ===== MUSCLE COMPUTATION =====
let bodyMapCache = null;

function computeMuscleSummary() {
  const summary = {};
  MUSCLE_GROUPS.forEach((mg) => {
    summary[mg.id] = { weeklySets: 0, weeklyVolume: 0, weeklyStimulus: 0, lastTrained: null, exercises: [], doneToday: false };
  });
  const todayKey = getDateKey();
  const weekAgo = getDateKey(new Date(Date.now() - 7 * 86400000));
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= weekAgo);

  for (const session of weekSessions) {
    for (const ex of session.exercises) {
      const contributions = EXERCISE_MUSCLE_CONTRIBUTION[ex.name];
      if (!contributions) continue;
      const doneSets = ex.sets.filter((s) => s.done);
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
  bodyMapCache = { summary, computedAt: Date.now() };
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

function getRecoveryStatus(daysAgo) {
  if (daysAgo === 0) return "trained";
  if (daysAgo <= 1) return "low";
  if (daysAgo <= 3) return "recovering";
  return "recovered";
}

function getStrengthTrend(muscleId) {
  // Look at exercises targeting this muscle across last 2 session pairs
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

let bodyMapMode = "weekly";

// ===== SVG BODY MAP RENDERER =====
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

// ===== MUSCLE TOOLTIP =====
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

// ===== BOTTOM SHEET =====
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

// ===== COACH INSIGHTS HELPER =====
function generateMuscleInsights(summary) {
  const insights = [];
  const coverage = getMuscleCoverageScore(summary);

  // Undertrained detection
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

  // Overtrained detection
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

  // Neglected (no training)
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

  // Positive insight
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

  // Recovery insight
  const todayTrained = MUSCLE_GROUPS.filter((mg) => {
    const data = summary[mg.id];
    return data && data.doneToday;
  });
  if (todayTrained.length > 0) {
    insights.push({
      icon: "🔄", severity: "blue",
      text: `${todayTrained.map((m) => m.label).join(", ")} trained today. Prioritize sleep and nutrition for recovery.`,
    });
  }

  // Quad/ham imbalance
  const quadData = summary["quads"];
  const hamData = summary["hamstrings"];
  if (quadData && hamData && quadData.weeklySets > 0 && hamData.weeklySets > 0) {
    const ratio = quadData.weeklySets / (hamData.weeklySets || 1);
    if (ratio > 2) {
      insights.push({
        icon: "⚠️", severity: "yellow",
        text: `Quad/Ham imbalance: Quads receiving ${ratio.toFixed(1)}× more sets. Add hamstring work like RDLs and leg curls.`,
      });
    }
  }

  // Strength trend insight
  const improving = MUSCLE_GROUPS.filter((mg) => {
    const trend = getStrengthTrend(mg.id);
    return trend !== null && trend > 5;
  }).slice(0, 3);
  if (improving.length > 0) {
    insights.push({
      icon: "📈", severity: "green",
      text: `${improving.map((m) => m.label).join(", ")} ${improving.length === 1 ? "is" : "are"} showing strong strength progression (>5% increase).`,
    });
  }

  return insights;
}

// ===== CALENDAR STATE =====
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

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

// ===== TAB SYSTEM =====
let currentTab = "sets";

function activateTab(tabName) {
  currentTab = tabName;

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + tabName));

  positionNavIndicator();

  if (tabName === "sessions") renderSessionsTab();
  if (tabName === "coach") renderCoachTab();
  if (tabName === "body") renderBodyTab();
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
  if (currentTab === "coach") renderCoachTab();
  if (currentTab === "body") renderBodyTab();
  updateTopbarTimer();
}

// ===== SETS PANEL =====
let currentPlanId = "";
let openExerciseName = "";

function renderSetsPanel() {
  renderL1();
  const session = getTodaySession();
  const hasWork = session.exercises.some((e) => e.sets.some((s) => s.done));
  const isRunning = stopwatchInterval;

  if (session.finishedAt) {
    showDrillLevel("setsL1");
  } else if (hasWork || isRunning || stopwatchElapsed > 0) {
    if (currentPlanId) showDrillLevel("setsL2");
    else showDrillLevel("setsL1");
  } else {
    showDrillLevel("setsL1");
  }
}

function showDrillLevel(level) {
  document.querySelectorAll(".sets-level").forEach((el) => el.classList.add("is-hidden"));
  document.getElementById(level).classList.remove("is-hidden");
}

// ===== L1: MY WORKOUTS =====
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night! Sleep early helps recovery.";
}

function renderL1() {
  const container = document.getElementById("l1PlanList");
  const greetingEl = document.getElementById("l1Greeting");
  const name = state.user ? state.user.name : "";
  greetingEl.textContent = name ? `${getGreeting()}, ${name}!` : `${getGreeting()}!`;

  const hasSessions = state.sessions.length > 0;
  const activePlan = loadCustomProgram();
  const hasPlan = !!activePlan;

  if (!hasSessions && !hasPlan) {
    container.innerHTML = `
      <div class="l1-empty">
        <div class="l1-empty-icon">💪</div>
        <div class="l1-empty-title">Welcome to iron log</div>
        <div class="l1-empty-desc">Build your first workout to get started.</div>
        <button class="l1-empty-btn" id="welcomeCreateBtn">Create New Workout</button>
        <button class="l1-empty-btn l1-empty-btn-secondary" id="welcomeSampleBtn">Load Sample Program</button>
      </div>`;
    document.getElementById("welcomeCreateBtn").addEventListener("click", () => {
      showNewWorkoutCreator();
    });
    document.getElementById("welcomeSampleBtn").addEventListener("click", () => {
      state.plan = plan;
      saveState();
      renderSetsPanel();
    });
    document.getElementById("exerciseCount").textContent = "0";
    return;
  }

  const todaySession = state.sessions.find((s) => s.dateKey === getDateKey());
  container.innerHTML = activePlan.map((w, i) => {
    const dayLabel = w.day || "";
    const isCurrent = i === state.planOffset && todaySession && !todaySession.finishedAt;
    const isCompleted = todaySession && todaySession.workoutId === w.id && todaySession.finishedAt;
    const isActiveSession = todaySession && todaySession.workoutId === w.id;
    let badge = "";
    if (isCurrent) badge = ' <span style="color:var(--accent);font-size:0.7rem">· Today</span>';
    else if (isCompleted) badge = ' <span style="color:var(--orange);font-size:0.7rem">· Completed</span>';
    const exShort = w.exercises.map((e) => e.name.replace(/([A-Z])/g, " $1").trim()).slice(0, 3).join(", ");
    const exMore = w.exercises.length > 3 ? ` +${w.exercises.length - 3}` : "";
    return `<div class="l1-plan-row" data-plan-id="${w.id}">
      <div class="l1-plan-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <div class="l1-plan-info">
        <div class="l1-plan-name">${w.name}${badge}</div>
        <div class="l1-plan-desc">${dayLabel} · ${w.duration || ""}${w.focus ? " · " + w.focus : ""}</div>
        <div class="l1-plan-exercises">${exShort}${exMore}</div>
      </div>
      <button class="l1-start-btn" data-start-id="${w.id}">${isCompleted ? "View" : isActiveSession && !isCompleted ? "Open" : "Start"}</button>
    </div>`;
  }).join("");

  container.querySelectorAll("[data-plan-id]").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("[data-start-id]")) return;
      openL2(row.dataset.planId);
    });
  });

  container.querySelectorAll("[data-start-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const planId = btn.dataset.startId;
      startWorkout(planId);
    });
  });

  document.getElementById("exerciseCount").textContent = activePlan.reduce((s, w) => s + w.exercises.length, 0);
}

function startWorkout(planId) {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === planId);
  if (!workout) return;

  const session = getTodaySession();

  if (session.workoutId !== planId && !session.finishedAt) {
    session.workoutId = workout.id;
    session.workoutName = workout.name;
    session.exercises = workout.exercises.map((exercise) => ({
      name: exercise.name,
      sets: Array.from({ length: exercise.sets }, () => ({ reps: exercise.reps || 8, weight: "", done: false })),
    }));
    saveState();
  }

  openL2(planId);
}

// ===== NEW WORKOUT CREATOR =====
let selectedExerciseNames = new Set();

function getAllExercises() {
  const activePlan = loadCustomProgram() || plan;
  const seen = new Set();
  const result = [];
  for (const w of activePlan) {
    for (const e of w.exercises) {
      if (!seen.has(e.name)) {
        seen.add(e.name);
        result.push(e);
      }
    }
  }
  return result;
}

function showNewWorkoutCreator() {
  selectedExerciseNames = new Set();
  document.getElementById("l3NameInput").value = "";
  showDrillLevel("setsL3");
  renderExerciseSelectList();
}

function renderExerciseSelectList() {
  const container = document.getElementById("l3ExerciseList");
  const allExercises = getAllExercises();
  container.innerHTML = allExercises.map((ex) => {
    const name = ex.name.replace(/([A-Z])/g, " $1").trim();
    const muscles = MUSCLE_MAP[ex.name] || [];
    const muscleLabels = muscles.map((m) => {
      const mg = MUSCLE_GROUPS.find((g) => g.id === m);
      return mg ? mg.label : m;
    }).join(", ");
    const isSelected = selectedExerciseNames.has(ex.name);
    return `<div class="exercise-card${isSelected ? " is-selected" : ""}" data-ex="${ex.name}">
      <div class="exercise-card-check">${isSelected ? "✓" : ""}</div>
      <div class="exercise-card-info">
        <div class="exercise-card-name">${name}</div>
        ${muscleLabels ? `<div class="exercise-card-muscles">${muscleLabels}</div>` : ""}
      </div>
    </div>`;
  }).join("");

  container.querySelectorAll(".exercise-card").forEach((card) => {
    card.addEventListener("click", () => {
      const exName = card.dataset.ex;
      if (selectedExerciseNames.has(exName)) selectedExerciseNames.delete(exName);
      else selectedExerciseNames.add(exName);
      renderExerciseSelectList();
    });
  });

  updateCreateBtn();
}

function updateCreateBtn() {
  const btn = document.getElementById("l3CreateBtn");
  const count = selectedExerciseNames.size;
  btn.textContent = `Create & Start (${count})`;
  btn.disabled = count === 0;
}

function createWorkout() {
  const name = document.getElementById("l3NameInput").value.trim() || "Custom Workout";
  const exNames = Array.from(selectedExerciseNames);
  if (exNames.length === 0) return;
  const allExercises = getAllExercises();

  const session = getTodaySession();
  session.workoutId = "custom-" + Date.now();
  session.workoutName = name;
  session.finishedAt = null;
  session.exercises = exNames.map((exName) => {
    const def = allExercises.find((e) => e.name === exName);
    return {
      name: exName,
      sets: Array.from({ length: def ? def.sets : 3 }, () => ({ reps: def ? def.reps : 8, weight: "", done: false })),
    };
  });

  if (!state.plan) state.plan = [];
  const existing = state.plan.findIndex((w) => w.id === session.workoutId);
  const planEntry = { id: session.workoutId, name, exercises: exNames.map((n) => ({ name: n, sets: 3, reps: 8 })) };
  if (existing >= 0) state.plan[existing] = planEntry;
  else state.plan.push(planEntry);
  saveState();

  openL2(session.workoutId);
}

// ===== L2: PLAN DETAIL WITH ACCORDION =====
let accordionWeightInputs = {};

function openL2(planId) {
  currentPlanId = planId;
  openExerciseName = "";
  accordionWeightInputs = {};
  showDrillLevel("setsL2");
  renderL2(planId);
}

function renderL2(planId) {
  const activePlan = loadCustomProgram() || plan;
  let workout = activePlan.find((w) => w.id === planId);
  const session = getTodaySession();

  if (!workout) {
    // Build from session data for custom workouts
    workout = {
      id: planId,
      name: session.workoutName || "Workout",
      exercises: session.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.length,
        reps: ex.sets[0]?.reps || 8,
        weight: "",
        tip: "",
      })),
    };
  }
  const completion = getCompletion(session);
  const exIdx = workout.exercises.findIndex((e) => e.name === openExerciseName);
  const currentExNum = exIdx >= 0 ? exIdx + 1 : Math.min(completion.done + 1, workout.exercises.length);

  document.getElementById("woHeaderName").textContent = workout.name;
  document.getElementById("woHeaderMeta").textContent = `Exercise ${currentExNum} of ${workout.exercises.length}`;
  document.getElementById("woHeaderPct").textContent = `${completion.percent}%`;

  const container = document.getElementById("l2ExerciseList");
  container.innerHTML = workout.exercises.map((ex, i) => {
    const exSession = getExerciseSession(session, ex);
    const doneSets = exSession.sets.filter((s) => s.done).length;
    const totalSets = exSession.sets.length;
    const lastData = getLastSessionData(ex.name);
    const isExpanded = openExerciseName === ex.name;

    return renderAccordionItem(ex, exSession, i, isExpanded, lastData, doneSets, totalSets);
  }).join("");

  // Bind accordion triggers
  container.querySelectorAll(".accordion-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exName = btn.dataset.exName;
      toggleExercise(exName);
    });
  });

  // Bind weight inputs
  container.querySelectorAll(".ex-weight-input").forEach((input) => {
    const exName = input.dataset.exName;
    if (accordionWeightInputs[exName] !== undefined) {
      input.value = accordionWeightInputs[exName];
    }
    input.addEventListener("input", () => {
      accordionWeightInputs[exName] = input.value;
    });
  });

  // Bind rep steppers
  container.querySelectorAll(".ex-rep-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exName = btn.dataset.exName;
      const delta = Number(btn.dataset.delta);
      const valueEl = container.querySelector(`.ex-rep-value[data-ex-name="${exName}"]`);
      if (!valueEl) return;
      let val = Number(valueEl.textContent) + delta;
      val = Math.max(1, Math.min(50, val));
      valueEl.textContent = val;
      // Store rep value
      const workout = (loadCustomProgram() || plan).find((w) => w.id === currentPlanId);
      const exDef = workout ? workout.exercises.find((e) => e.name === exName) : null;
      if (exDef) {
        const session = getTodaySession();
        const exSession = getExerciseSession(session, exDef);
        const pendingIdx = getNextUndoneSet(exSession);
        if (!exSession._pendingReps) exSession._pendingReps = {};
        exSession._pendingReps[pendingIdx] = val;
      }
    });
  });

  // Bind rep chips
  container.querySelectorAll(".ex-rep-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const exName = chip.dataset.exName;
      const val = Number(chip.dataset.rep);
      const valueEl = container.querySelector(`.ex-rep-value[data-ex-name="${exName}"]`);
      if (!valueEl) return;
      valueEl.textContent = val;
      const workout = (loadCustomProgram() || plan).find((w) => w.id === currentPlanId);
      const exDef = workout ? workout.exercises.find((e) => e.name === exName) : null;
      if (exDef) {
        const session = getTodaySession();
        const exSession = getExerciseSession(session, exDef);
        const pendingIdx = getNextUndoneSet(exSession);
        if (!exSession._pendingReps) exSession._pendingReps = {};
        exSession._pendingReps[pendingIdx] = val;
      }
    });
  });

  // Bind complete set buttons
  container.querySelectorAll(".ex-complete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exName = btn.dataset.exName;
      completeSet(exName);
    });
  });

  // Bind repeat last set buttons
  container.querySelectorAll(".ex-repeat").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exName = btn.dataset.exName;
      repeatLastSet(exName);
    });
  });

  // Bind finish workout button
  const finishBtn = document.getElementById("woFinishBtn");
  const isFinished = session.finishedAt;
  finishBtn.textContent = isFinished ? "Update Workout" : "Complete Workout";
  finishBtn.onclick = finishWorkout;
}

function toggleExercise(exName) {
  if (openExerciseName === exName) {
    openExerciseName = "";
  } else {
    openExerciseName = exName;
  }
  renderL2(currentPlanId);
}

function renderAccordionItem(ex, exSession, i, isExpanded, lastData, doneSets, totalSets) {
  const pendingIdx = getNextUndoneSet(exSession);
  const currentSetNum = pendingIdx >= 0 ? pendingIdx + 1 : totalSets;
  const lastWeight = lastData ? lastData.weight : "";
  const lastReps = lastData ? lastData.reps : "";
  const storedWeight = accordionWeightInputs[ex.name] !== undefined ? accordionWeightInputs[ex.name] : (lastWeight || "");

  // Progress dots
  let dotsHtml = "";
  for (let s = 0; s < totalSets; s++) {
    const isDone = exSession.sets[s] && exSession.sets[s].done;
    const isCurrent = s === pendingIdx;
    let cls = "ex-progress-dot";
    if (isDone) cls += " is-done";
    else if (isCurrent) cls += " is-current";
    dotsHtml += `<div class="${cls}">${isDone ? "✓" : s + 1}</div>`;
  }

  // Store pending reps
  const pendingReps = exSession._pendingReps && exSession._pendingReps[pendingIdx] !== undefined
    ? exSession._pendingReps[pendingIdx]
    : (lastReps || ex.reps || 8);

  return `<div class="accordion-item${isExpanded ? " is-active" : ""}">
    <button class="accordion-trigger" data-ex-name="${ex.name}">
      <div class="accordion-info">
        <div class="accordion-name">${ex.name.replace(/([A-Z])/g, " $1").trim()}</div>
        ${lastData ? `<div class="accordion-last">Last · ${formatWeight(lastData.weight)}×${lastData.reps}</div>` : ""}
      </div>
      <div class="accordion-stats">
        <span class="accordion-sets">${doneSets}/${totalSets}</span>
        <span class="accordion-chevron">▼</span>
      </div>
    </button>

    <div class="accordion-body">
      <div class="ex-progress">${dotsHtml}</div>

      ${lastData ? `<div class="ex-last-perf">Last: ${formatWeight(lastData.weight)} × ${lastData.reps}</div>` : ""}

      <div class="ex-current-set">
        <span class="ex-current-label">Set</span>
        <span class="ex-current-number">${currentSetNum}/${totalSets}</span>
      </div>

      <div class="ex-weight-wrap">
        <div class="ex-weight-label">Weight (kg)</div>
        <input class="ex-weight-input" type="text" inputmode="decimal" data-ex-name="${ex.name}" value="${storedWeight}" placeholder="0" autocomplete="off" />
      </div>

      <div class="ex-rep-wrap">
        <div class="ex-rep-label">Reps</div>
        <div class="ex-rep-stepper">
          <button class="ex-rep-btn" data-ex-name="${ex.name}" data-delta="-1">−</button>
          <span class="ex-rep-value" data-ex-name="${ex.name}">${pendingReps}</span>
          <button class="ex-rep-btn" data-ex-name="${ex.name}" data-delta="1">+</button>
        </div>
        <div class="ex-rep-chips">
          <button class="ex-rep-chip" data-ex-name="${ex.name}" data-rep="6">6</button>
          <button class="ex-rep-chip" data-ex-name="${ex.name}" data-rep="8">8</button>
          <button class="ex-rep-chip" data-ex-name="${ex.name}" data-rep="10">10</button>
          <button class="ex-rep-chip" data-ex-name="${ex.name}" data-rep="12">12</button>
          <button class="ex-rep-chip" data-ex-name="${ex.name}" data-rep="15">15</button>
        </div>
      </div>

      <button class="ex-complete" data-ex-name="${ex.name}">${doneSets === totalSets ? "Log Extra Set" : "Complete Set"}</button>

      ${lastData && doneSets < totalSets ? `<button class="ex-repeat" data-ex-name="${ex.name}">↻ Repeat Last</button>` : ""}
    </div>
  </div>`;
}

// ===== COMPLETE SET =====
function completeSet(exName) {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === currentPlanId);
  const exDef = workout ? workout.exercises.find((e) => e.name === exName) : null;
  if (!exDef) return;

  const session = getTodaySession();
  const exSession = getExerciseSession(session, exDef);
  let pendingIdx = getNextUndoneSet(exSession);
  if (pendingIdx < 0) {
    // All sets done — add an extra set
    const lastSet = exSession.sets[exSession.sets.length - 1];
    exSession.sets.push({
      reps: lastSet ? lastSet.reps : (exDef.reps || 8),
      weight: lastSet && lastSet.weight ? lastSet.weight : "",
      done: false,
    });
    pendingIdx = exSession.sets.length - 1;
  }

  const weightStr = accordionWeightInputs[exName] !== undefined ? accordionWeightInputs[exName] : "";
  const pendingReps = exSession._pendingReps && exSession._pendingReps[pendingIdx] !== undefined
    ? exSession._pendingReps[pendingIdx]
    : (exSession.sets[pendingIdx].reps || exDef.reps || 8);

  const weightNum = weightStr === "" ? 0 : Number(weightStr);
  if (weightStr !== "" && isNaN(weightNum)) return;

  exSession.sets[pendingIdx] = {
    reps: pendingReps,
    weight: weightNum,
    done: true,
    loggedAt: new Date().toISOString(),
  };

  // Clear pending for this index
  if (exSession._pendingReps) delete exSession._pendingReps[pendingIdx];

  startStopwatch();
  saveState();

  // Check PR
  if (weightNum > 0) {
    const prs = loadPRs();
    const current = prs[exName];
    if (!current || weightNum > current.weight) {
      prs[exName] = { weight: weightNum, reps: pendingReps, date: getDateKey() };
      savePRs(prs);
      showPRToast(`${exName}: ${formatWeight(weightNum)} × ${pendingReps}`);
    } else if (current && weightNum === current.weight && pendingReps > current.reps) {
      prs[exName] = { weight: weightNum, reps: pendingReps, date: getDateKey() };
      savePRs(prs);
      showPRToast(`${exName}: ${formatWeight(weightNum)} × ${pendingReps} (rep PR)`);
    }
  }

  // Start rest timer
  startRestTimer();

  // Check if current exercise still has undone sets
  const currentStillHasSets = exSession.sets.some((s) => !s.done);

  if (currentStillHasSets) {
    // Stay on same exercise for next set
    renderL2(currentPlanId);
  } else {
    // All sets done for this exercise — advance to next exercise with undone sets
    const nextEx = workout.exercises.find((e, idx) => {
      if (idx <= workout.exercises.findIndex((ex) => ex.name === exName)) return false;
      const es = getExerciseSession(session, e);
      return es.sets.some((s) => !s.done);
    });
    if (nextEx) {
      openExerciseName = nextEx.name;
    }
    renderL2(currentPlanId);
  }
}

// ===== REPEAT LAST SET =====
function repeatLastSet(exName) {
  const activePlan = loadCustomProgram() || plan;
  const workout = activePlan.find((w) => w.id === currentPlanId);
  const exDef = workout ? workout.exercises.find((e) => e.name === exName) : null;
  if (!exDef) return;

  const lastData = getLastSessionData(exName);
  if (!lastData) return;

  const session = getTodaySession();
  const exSession = getExerciseSession(session, exDef);
  let pendingIdx = getNextUndoneSet(exSession);
  if (pendingIdx < 0) {
    const lastSet = exSession.sets[exSession.sets.length - 1];
    exSession.sets.push({
      reps: lastSet ? lastSet.reps : (exDef.reps || 8),
      weight: lastSet && lastSet.weight ? lastSet.weight : "",
      done: false,
    });
    pendingIdx = exSession.sets.length - 1;
  }

  exSession.sets[pendingIdx] = {
    reps: lastData.reps,
    weight: lastData.weight,
    done: true,
    loggedAt: new Date().toISOString(),
  };

  startStopwatch();
  saveState();

  if (lastData.weight > 0) {
    const prs = loadPRs();
    const current = prs[exName];
    if (!current || lastData.weight > current.weight) {
      prs[exName] = { weight: lastData.weight, reps: lastData.reps, date: getDateKey() };
      savePRs(prs);
      showPRToast(`${exName}: ${formatWeight(lastData.weight)} × ${lastData.reps}`);
    } else if (current && lastData.weight === current.weight && lastData.reps > current.reps) {
      prs[exName] = { weight: lastData.weight, reps: lastData.reps, date: getDateKey() };
      savePRs(prs);
      showPRToast(`${exName}: ${formatWeight(lastData.weight)} × ${lastData.reps} (rep PR)`);
    }
  }

  startRestTimer();

  const currentStillHasSets = exSession.sets.some((s) => !s.done);

  if (currentStillHasSets) {
    renderL2(currentPlanId);
  } else {
    const nextEx = workout.exercises.find((e, idx) => {
      if (idx <= workout.exercises.findIndex((ex) => ex.name === exName)) return false;
      const es = getExerciseSession(session, e);
      return es.sets.some((s) => !s.done);
    });
    if (nextEx) {
      openExerciseName = nextEx.name;
    }
    renderL2(currentPlanId);
  }
}

// ===== FINISH WORKOUT =====
function finishWorkout() {
  const session = getTodaySession();
  const completion = getCompletion(session);
  if (completion.done === 0) return;

  showNotesModal();
}

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
  const session = getTodaySession();
  document.getElementById("sessionNotesInput").value = session.notes || "";
  document.getElementById("notesModal").classList.remove("is-hidden");
}

function hideNotesModal() { document.getElementById("notesModal").classList.add("is-hidden"); }

function completeSession(notes) {
  const session = getTodaySession();
  const wasFinished = !!session.finishedAt;
  session.finishedAt = new Date().toISOString();
  session.notes = notes || "";
  checkPRs(session);
  if (!wasFinished) {
    state.planOffset = (state.planOffset + 1) % (loadCustomProgram() || plan).length;
  }
  hideNotesModal();
  stopStopwatch();
  currentPlanId = "";
  openExerciseName = "";
  saveAndRender();
  activateTab("sessions");
}

document.getElementById("saveNotesButton").addEventListener("click", () => {
  completeSession(document.getElementById("sessionNotesInput").value);
});
document.getElementById("skipNotesButton").addEventListener("click", () => completeSession(""));
document.getElementById("notesModalClose").addEventListener("click", hideNotesModal);
document.getElementById("notesModal").addEventListener("click", (e) => { if (e.target === e.currentTarget) hideNotesModal(); });

// ===== BACK BUTTON =====
document.getElementById("l2BackBtn").addEventListener("click", () => {
  currentPlanId = "";
  openExerciseName = "";
  showDrillLevel("setsL1");
  // Reset to workout list in case session was interrupted
  renderSetsPanel();
});

// ===== NEW WORKOUT CREATOR =====
document.getElementById("newWorkoutBtn")?.addEventListener("click", showNewWorkoutCreator);

document.getElementById("l3BackBtn").addEventListener("click", () => {
  showDrillLevel("setsL1");
  renderSetsPanel();
});

document.getElementById("l3CreateBtn").addEventListener("click", createWorkout);

// ===== MUSCLE SHEET =====
document.getElementById("muscleSheetOverlay")?.addEventListener("click", () => {
  document.getElementById("muscleSheet").classList.add("is-hidden");
});
document.getElementById("muscleSheet")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add("is-hidden");
});

// ===== REST TIMER CONTROLS =====
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
    ${(() => { const as = getGoalAlignmentScore(); return as !== null ? `<div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);text-align:center;padding-top:0.35rem;border-top:1px solid var(--border)">Goal Alignment: <span style="color:var(--accent)">${as}/10</span></div>` : ""; })()}
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
      if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
      renderTrainingCalendar();
    });
  });
}

// ===== COACH TAB =====
function renderCoachTab() {
  renderTrainingCalendar();
  renderCoachInsights();
  renderRecovery();
}

function renderCoachInsights() {
  const container = document.getElementById("coachInsights");
  const insights = [];

  // Insight 1: Weight trend vs goal
  const log = loadBodyLog().sort((a, b) => a.date.localeCompare(b.date));
  const goal = GOALS.find((g) => g.id === state.bodyGoal);
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
      const direction = change > 0 ? "increased" : "decreased";
      const absChange = Math.abs(change).toFixed(1);
      insights.push({
        icon: "⚖️",
        text: `Weight <strong>${direction} ${absChange}kg</strong> this week. ${goal.id === "fat-loss" && change < 0 ? "On track for fat loss." : goal.id === "lean-bulk" && change > 0 ? "Good progress on bulk." : goal.id === "recomp" && Math.abs(change) < 0.3 ? "Stable weight — recomp on target." : `Goal expects ${goal.expectedWeekly > 0 ? "+" : ""}${goal.expectedWeekly}kg/week.`}`,
      });
    }
  }

  // Insight 2: Strength change
  const strengthPct = getWeeklyStrengthChange();
  if (strengthPct !== null) {
    const dir = strengthPct > 0 ? "increased" : "decreased";
    insights.push({
      icon: "💪",
      text: `Overall strength <strong>${dir} ${Math.abs(strengthPct).toFixed(0)}%</strong> this week. ${strengthPct > 5 ? "Excellent progress." : strengthPct > 0 ? "Moderate improvement." : strengthPct < -5 ? "Consider a deload or rest week." : "Stable."}`,
    });
  }

  // Insight 3: Protein adherence
  const protPct = getWeeklyProteinAdherence();
  if (protPct !== null) {
    insights.push({
      icon: "🥩",
      text: `Protein target <strong>${Math.round(protPct)}%</strong> achieved this week. ${protPct >= 90 ? "Great consistency." : protPct >= 80 ? "Good, but room for improvement." : "Needs attention — try meal prepping."}`,
    });
  }

  // Insight 4: Training consistency
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));
  insights.push({
    icon: "📅",
    text: `Trained <strong>${weekSessions.length}/6</strong> sessions this week. ${weekSessions.length >= 5 ? "Excellent consistency." : weekSessions.length >= 3 ? "Building momentum." : "Try to increase frequency."}`,
  });

  // Insight 5: Muscle coverage & insights
  if (weekSessions.length > 0) {
    const muscleSum = computeMuscleSummary();
    const muscleInsights = generateMuscleInsights(muscleSum);
    muscleInsights.slice(0, 3).forEach((ins) => {
      insights.push({ icon: ins.icon, text: ins.text });
    });
  }

  container.innerHTML = insights.slice(0, 5).map((insight) =>
    `<div class="insight-item">${insight.icon} ${insight.text}</div>`
  ).join("");

  if (insights.length === 0) {
    container.innerHTML = `<p class="empty-state">Log workouts and nutrition to get coaching insights.</p>`;
  }
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
    <div class="rec-row"><span>Recovery</span><span style="font-weight:800;color:var(--${recoveryScore >= 70 ? 'accent' : recoveryScore >= 50 ? 'yellow' : 'red'})">${recoveryScore}% — ${status}</span></div>
  `;
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
      <div class="prediction-row"><span>Current</span><span>${avgRecent.toFixed(1)} kg</span></div>
      <div class="prediction-row"><span>Target</span><span>~${goalWeight.toFixed(1)} kg</span></div>
      <div class="prediction-row"><span>Rate</span><span>${weeklyRate > 0 ? "+" : ""}${weeklyRate} kg/week</span></div>
      ${weeksNeeded > 0 ? `<div class="prediction-highlight">Goal by ${estDate} (${Math.ceil(weeksNeeded)} weeks)</div>` : `<div class="prediction-highlight">Maintaining current phase.</div>`}
    </div>
  `;
}

function renderBodyAnalysis() {
  const container = document.getElementById("bodyAnalysis");
  computeMuscleSummary();
  const summary = bodyMapCache ? bodyMapCache.summary : computeMuscleSummary();
  const coverageScore = getMuscleCoverageScore(summary);
  const weekSessions = state.sessions.filter((s) => s.finishedAt && s.dateKey >= getDateKey(new Date(Date.now() - 7 * 86400000)));

  const statusLabels = { untrained: "Not trained", undertrained: "Undertrained", optimal: "Optimal", high: "High volume", overtrained: "Overtrained" };
  const modeLabels = { today: "Trained Today", weekly: "Weekly Coverage", recovery: "Recovery", strength: "Strength Trend" };

  // Mode selector
  let html = `<div class="bm-mode-row">
    ${Object.entries(modeLabels).map(([key, label]) =>
      `<button class="bm-mode-btn${bodyMapMode === key ? " is-active" : ""}" data-mode="${key}">${label}</button>`
    ).join("")}
  </div>`;

  // Body map container
  html += `<div id="bmContainer" class="bm-container"></div>`;

  // Coverage + insights
  html += `<div class="bm-stats">
    <div class="bm-coverage"><span class="bm-coverage-pct">${coverageScore}%</span> Coverage</div>
    <div class="bm-trained">${Object.values(summary).filter((m) => m.weeklySets > 0).length}/${Object.keys(summary).length} trained</div>
  </div>`;

  const sorted = MUSCLE_GROUPS.map((mg) => ({
    ...mg,
    ...summary[mg.id],
    sets: summary[mg.id] ? summary[mg.id].weeklySets : 0,
  }));

  // Muscle list
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

  // Generate insights
  const insights = generateMuscleInsights(summary);
  if (insights.length > 0) {
    html += `<div class="bm-insights">`;
    insights.slice(0, 4).forEach((ins) => {
      html += `<div class="alert-item is-${ins.severity}"><span class="alert-icon">${ins.icon}</span><div class="alert-body">${ins.text}</div></div>`;
    });
    html += `</div>`;
  }

  container.innerHTML = html;

  // Bind body map
  renderBodyMuscleMap(document.getElementById("bmContainer"), summary);

  // Bind mode buttons
  container.querySelectorAll(".bm-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      bodyMapMode = btn.dataset.mode;
      renderBodyAnalysis();
    });
  });

  // Bind muscle row clicks
  container.querySelectorAll(".bm-muscle-row").forEach((row) => {
    row.addEventListener("click", () => {
      showMuscleSheet(row.dataset.muscle, summary);
    });
  });
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
      data: { labels, datasets: [{ data, backgroundColor: "#00d26a", borderRadius: 4 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1, color: "#737373" } }, x: { ticks: { color: "#737373", font: { size: 8 } } } } },
    });
  }

  document.getElementById("exerciseDetailModal").classList.remove("is-hidden");
});

document.getElementById("exerciseDetailClose")?.addEventListener("click", () => {
  document.getElementById("exerciseDetailModal").classList.add("is-hidden");
  if (exerciseDetailChartInstance) { exerciseDetailChartInstance.destroy(); exerciseDetailChartInstance = null; }
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

// ===== ONBOARDING =====
document.getElementById("onboardName")?.addEventListener("input", validateOnboard);
document.getElementById("onboardAge")?.addEventListener("input", validateOnboard);
document.getElementById("onboardHeight")?.addEventListener("input", validateOnboard);
document.getElementById("onboardWeight")?.addEventListener("input", validateOnboard);
document.getElementById("onboardSaveBtn")?.addEventListener("click", () => {
  state.user = {
    name: document.getElementById("onboardName").value.trim(),
    age: Number(document.getElementById("onboardAge").value),
    height: Number(document.getElementById("onboardHeight").value),
    weight: Number(document.getElementById("onboardWeight").value),
  };
  saveState();
  document.getElementById("onboardingModal").classList.add("is-hidden");
  render();
});
function validateOnboard() {
  const name = document.getElementById("onboardName").value.trim();
  const age = document.getElementById("onboardAge").value;
  const height = document.getElementById("onboardHeight").value;
  const weight = document.getElementById("onboardWeight").value;
  document.getElementById("onboardSaveBtn").disabled = !(name && age > 0 && height > 0 && weight > 0);
}

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
    document.getElementById("onboardingModal").classList.remove("is-hidden");
  }

  const todaySession = getTodaySession();
  if (todaySession && todaySession.exercises.some((e) => e.sets.some((s) => s.done))) {
    startStopwatch();
  }

  activateTab("sets");
});

// ===== MUSCLE SEARCH =====
document.addEventListener("input", (e) => {
  if (e.target.id !== "muscleSearch") return;
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll(".bm-muscle-row").forEach((row) => {
    const name = row.querySelector(".bm-muscle-name")?.textContent?.toLowerCase() || "";
    row.classList.toggle("is-highlighted", q && name.includes(q));
  });
  document.querySelectorAll("[data-muscle]").forEach((path) => {
    const label = (MUSCLE_LABEL_MAP[path.dataset.muscle] || "").toLowerCase();
    const group = (MUSCLE_GROUP_MAP[path.dataset.muscle] || "").toLowerCase();
    const match = q && (label.includes(q) || group.includes(q));
    path.style.filter = q ? (match ? "brightness(1.4)" : "brightness(0.4)") : "";
    path.style.opacity = q ? (match ? "1" : "0.3") : "";
  });
});
