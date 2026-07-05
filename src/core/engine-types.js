// ===== COACH ENGINE: TYPES & CONSTANTS =====

const CoachEngineTypes = {

  GOALS: {
    LOSE_FAT: "lose-fat",
    BUILD_MUSCLE: "build-muscle",
    STRENGTH: "strength",
    GENERAL: "general",
    ENDURANCE: "endurance",
  },

  EXPERIENCE: {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  },

  ACTIVITY: {
    SEDENTARY: "sedentary",
    LIGHT: "light",
    MODERATE: "moderate",
    ACTIVE: "active",
    VERY_ACTIVE: "very-active",
  },

  GENDER: {
    MALE: "male",
    FEMALE: "female",
  },

  EQUIPMENT: {
    NONE: "none",
    MINIMAL: "minimal",
    HOME: "home",
    GYM: "gym",
    FULL: "full",
  },

  SPLITS: {
    PPL: "Push Pull Legs",
    UPPER_LOWER: "Upper Lower",
    FULL_BODY: "Full Body",
  },

  DIET: {
    NONE: "none",
    VEGETARIAN: "vegetarian",
    VEGAN: "vegan",
    KETO: "keto",
    PALEO: "paleo",
    MEDITERRANEAN: "mediterranean",
  },

  BMR_FORMULAS: {
    MIFFLIN_ST_JEOR: "mifflin-st-jeor",
    KATCH_MCARDLE: "katch-mcardle",
    HARRIS_BENEDICT: "harris-benedict",
  },

  PAL_VALUES: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very-active": 1.9,
  },

  PROTEIN_FACTORS: {
    MIN_PER_KG: 1.2,
    RECOMMENDED_PER_KG: 1.6,
    MAX_PER_KG_LBM: 2.2,
    MAX_ABSOLUTE: 280,
    OBESITY_ADJUSTMENT_BF: 0.3,
  },

  CALORIE_MODIFIERS: {
    "lose-fat": { min: -500, max: -300, default: -400 },
    "build-muscle": { min: 200, max: 400, default: 300 },
    strength: { min: 100, max: 300, default: 200 },
    endurance: { min: 50, max: 200, default: 100 },
    general: { min: 0, max: 0, default: 0 },
  },

  WATER_FACTORS: {
    BASE_ML_PER_KG: 35,
    ACTIVE_ML_PER_KG: 40,
    HIGH_ACTIVITY_ML_PER_KG: 45,
    MAX_LITERS: 5,
    MIN_LITERS: 1.5,
  },

  MACRO_SPLITS: {
    "lose-fat": { protein: 0.35, fat: 0.3, carbs: 0.35, fiber: 25 },
    "build-muscle": { protein: 0.3, fat: 0.25, carbs: 0.45, fiber: 30 },
    strength: { protein: 0.3, fat: 0.25, carbs: 0.45, fiber: 25 },
    endurance: { protein: 0.2, fat: 0.25, carbs: 0.55, fiber: 35 },
    general: { protein: 0.25, fat: 0.3, carbs: 0.45, fiber: 30 },
  },

  VOLUME_RANGES: {
    Beginner: { compound: { min: 10, max: 14 }, isolation: { min: 8, max: 12 } },
    Intermediate: { compound: { min: 12, max: 18 }, isolation: { min: 10, max: 16 } },
    Advanced: { compound: { min: 16, max: 22 }, isolation: { min: 12, max: 18 } },
  },

  REP_RANGES: {
    "lose-fat": { compound: { min: 8, max: 12 }, isolation: { min: 10, max: 15 } },
    "build-muscle": { compound: { min: 6, max: 12 }, isolation: { min: 8, max: 15 } },
    strength: { compound: { min: 3, max: 6 }, isolation: { min: 6, max: 10 } },
    endurance: { compound: { min: 12, max: 20 }, isolation: { min: 12, max: 20 } },
    general: { compound: { min: 6, max: 12 }, isolation: { min: 8, max: 15 } },
  },

  EXERCISE_COUNTS: {
    Beginner: { min: 4, max: 6 },
    Intermediate: { min: 5, max: 8 },
    Advanced: { min: 6, max: 10 },
  },

  REST_SECONDS: {
    strength: { compound: 180, isolation: 120 },
    "build-muscle": { compound: 90, isolation: 75 },
    "lose-fat": { compound: 60, isolation: 45 },
    endurance: { compound: 45, isolation: 30 },
    general: { compound: 75, isolation: 60 },
  },

  PLATEAU: {
    WEIGHT_DAYS_UNCHANGED: 21,
    STRENGTH_WEEKS_NO_GAIN: 4,
    MIN_LOGS_FOR_DETECTION: 5,
  },

  ADHERENCE: {
    PERFECT: 0.9,
    GOOD: 0.7,
    FAIR: 0.5,
    LOW: 0.3,
  },

  MAX_RECOMMENDED_DAYS: 7,
  MAX_DAILY_SESSIONS: 2,
  MIN_SLEEP_HOURS: 6,
  MAX_SLEEP_HOURS: 10,
  MIN_TRAINING_DAYS: 2,
  MAX_TRAINING_DAYS: 7,

  RECOVERY: {
    LOW_VOLUME_SETS: 10,
    MODERATE_VOLUME_SETS: 16,
    HIGH_VOLUME_SETS: 22,
    SLEEP_WEIGHT: 0.4,
    STRESS_WEIGHT: 0.3,
    VOLUME_WEIGHT: 0.3,
  },

  GOAL_LABELS: {
    "lose-fat": "Fat Loss",
    "build-muscle": "Build Muscle",
    strength: "Strength",
    "general": "General Fitness",
    endurance: "Endurance",
  },

};

if (typeof window !== "undefined") window.CoachEngineTypes = CoachEngineTypes;
