const ProgramGenerator = (() => {

  const T = window.CoachEngineTypes || {};
  const R = window.CoachRules || {};
  const C = window.CoachCalculators || {};

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function enrichLib() {
    if (typeof EXERCISE_LIBRARY === "undefined") return [];
    return EXERCISE_LIBRARY.map(ex => {
      const tags = ex.tags || [];
      return {
        ...ex,
        isCompound: tags.includes("compound") || (window.COMPOUND_EXERCISE_NAMES && window.COMPOUND_EXERCISE_NAMES.has(ex.name)),
        movementType: tags.includes("compound") ? "compound" : tags.includes("isolation") ? "isolation" : "other",
        primaryMuscles: ex.primaryMuscle ? [ex.primaryMuscle] : [],
        secondaryMuscles: ex.secondaryMuscles || [],
      };
    });
  }

  function filterByEquipment(exercises, equipment) {
    const equip = (equipment || "gym").toLowerCase();
    if (equip === "gym" || equip === "full") return exercises;
    return exercises.filter(ex => {
      const eq = (ex.equipment || "").toLowerCase();
      if (equip === "home") {
        return ["dumbbell", "bodyweight", "band", "kettlebell", "other"].includes(eq);
      }
      if (equip === "minimal") {
        return ["dumbbell", "bodyweight", "band"].includes(eq);
      }
      return true;
    });
  }

  function filterByMuscle(exercises, primary, secondary) {
    return exercises.filter(ex => {
      const muscles = [ex.primaryMuscle, ...(ex.secondaryMuscles || [])].map(m => (m || "").toLowerCase());
      if (primary && muscles.includes(primary.toLowerCase())) return true;
      if (secondary && muscles.includes(secondary.toLowerCase())) return true;
      return false;
    });
  }

  const SPLIT_DEFINITIONS = {
    "Push Pull Legs": {
      days: [
        { name: "Push", focus: "chest, shoulders, triceps", muscles: ["Chest", "Front Delts", "Side Delts", "Triceps"] },
        { name: "Pull", focus: "back, biceps, rear delts", muscles: ["Lats", "Middle Back", "Lower Back", "Biceps", "Rear Delts"] },
        { name: "Legs", focus: "quads, hamstrings, glutes, calves", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      ],
    },
    "Upper Lower": {
      days: [
        { name: "Upper", focus: "chest, shoulders, back, arms", muscles: ["Chest", "Front Delts", "Side Delts", "Lats", "Middle Back", "Biceps", "Triceps"] },
        { name: "Lower", focus: "quads, hamstrings, glutes, calves, core", muscles: ["Quads", "Hamstrings", "Glutes", "Calves", "Core"] },
      ],
    },
    "Full Body": {
      days: [
        { name: "Full Body", focus: "full body", muscles: ["Chest", "Lats", "Quads", "Hamstrings", "Shoulders"] },
      ],
    },
    "Arnold Split": {
      days: [
        { name: "Chest & Back", focus: "chest and back", muscles: ["Chest", "Lats", "Middle Back"] },
        { name: "Shoulders & Arms", focus: "shoulders and arms", muscles: ["Front Delts", "Side Delts", "Rear Delts", "Biceps", "Triceps"] },
        { name: "Legs", focus: "legs", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      ],
    },
    "Bro Split": {
      days: [
        { name: "Chest", focus: "chest", muscles: ["Chest", "Front Delts"] },
        { name: "Back", focus: "back", muscles: ["Lats", "Middle Back", "Lower Back"] },
        { name: "Shoulders", focus: "shoulders", muscles: ["Front Delts", "Side Delts", "Rear Delts"] },
        { name: "Arms", focus: "arms", muscles: ["Biceps", "Triceps", "Forearms"] },
        { name: "Legs", focus: "legs", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      ],
    },
    "PHUL": {
      days: [
        { name: "Upper Power", focus: "heavy upper body", muscles: ["Chest", "Lats", "Shoulders"] },
        { name: "Lower Power", focus: "heavy lower body", muscles: ["Quads", "Hamstrings", "Glutes"] },
        { name: "Upper Hypertrophy", focus: "volume upper body", muscles: ["Chest", "Shoulders", "Back", "Arms"] },
        { name: "Lower Hypertrophy", focus: "volume lower body", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      ],
    },
    "PHAT": {
      days: [
        { name: "Upper Power", focus: "heavy upper body", muscles: ["Chest", "Lats", "Shoulders"] },
        { name: "Lower Power", focus: "heavy lower body", muscles: ["Quads", "Hamstrings", "Glutes"] },
        { name: "Back & Shoulders", focus: "volume back and shoulders", muscles: ["Lats", "Middle Back", "Rear Delts", "Side Delts"] },
        { name: "Legs & Abs", focus: "volume legs and core", muscles: ["Quads", "Hamstrings", "Glutes", "Core"] },
        { name: "Chest & Arms", focus: "volume chest and arms", muscles: ["Chest", "Biceps", "Triceps"] },
      ],
    },
  };

  function getRecommendedSplit(goal, days, experience) {
    if (days <= 3) return "Full Body";
    if (days === 4) return "Upper Lower";
    if (days >= 5) {
      if (goal === "build-muscle" || goal === "general-fitness") return "Push Pull Legs";
      if (goal === "strength") return "Upper Lower";
      if (goal === "lose-fat") return "Full Body";
    }
    return "Push Pull Legs";
  }

  function getSplitDays(splitName, days) {
    const def = SPLIT_DEFINITIONS[splitName];
    if (!def) return [];
    const result = [];
    for (let i = 0; i < days; i++) {
      result.push({ ...def.days[i % def.days.length], dayNumber: i + 1 });
    }
    return result;
  }

  function selectExercisesForDay(focusMuscles, allExercises, goal, experience, duration, equipment) {
    const available = filterByEquipment(allExercises, equipment);
    const repRanges = {
      compound: R.getRepRange ? R.getRepRange(goal, true, experience) : { min: 6, max: 12 },
      isolation: R.getRepRange ? R.getRepRange(goal, false, experience) : { min: 8, max: 15 },
    };
    const exCount = R.getExerciseCount ? R.getExerciseCount(experience) : { min: 4, max: 6 };
    const compoundRatio = R.getCompoundRatio ? R.getCompoundRatio(goal) : { compound: 0.6, isolation: 0.4 };

    const primaryMuscle = focusMuscles[0] || "Chest";
    const secondaryMuscles = focusMuscles.slice(1) || [];

    const compounds = available.filter(ex => ex.isCompound && focusMuscles.some(m => {
      const exMuscles = [ex.primaryMuscle, ...(ex.secondaryMuscles || [])].map(s => (s || "").toLowerCase());
      return exMuscles.includes(m.toLowerCase());
    }));

    const isolations = available.filter(ex => !ex.isCompound && focusMuscles.some(m => {
      const exMuscles = [ex.primaryMuscle, ...(ex.secondaryMuscles || [])].map(s => (s || "").toLowerCase());
      return exMuscles.includes(m.toLowerCase());
    }));

    const totalExercises = duration <= 30 ? 4 : duration <= 45 ? 5 : duration <= 60 ? 6 : Math.min(exCount.max, 8);
    const compoundCount = Math.max(1, Math.round(totalExercises * compoundRatio.compound));
    const isolationCount = totalExercises - compoundCount;

    const selectedCompounds = shuffle(compounds).slice(0, compoundCount);
    const selectedIsolations = shuffle(isolations).slice(0, isolationCount);

    if (selectedCompounds.length < compoundCount) {
      const extras = shuffle(available.filter(ex => ex.isCompound && !selectedCompounds.includes(ex))).slice(0, compoundCount - selectedCompounds.length);
      selectedCompounds.push(...extras);
    }

    const allSelected = [...selectedCompounds, ...selectedIsolations];
    const restTimes = {
      compound: R.getRestSeconds ? R.getRestSeconds(goal, true) : 90,
      isolation: R.getRestSeconds ? R.getRestSeconds(goal, false) : 60,
    };

    const durationMinutes = Math.max(20, duration || 45);
    const availableMinutesPerEx = durationMinutes / Math.max(allSelected.length, 1);
    const adjustedSets = availableMinutesPerEx < 8 ? 2 : availableMinutesPerEx < 12 ? 3 : 4;

    return allSelected.map(ex => {
      const isComp = ex.isCompound;
      const reps = isComp ? repRanges.compound : repRanges.isolation;
      const sets = clamp(adjustedSets, 2, isComp ? 5 : 4);
      const rest = isComp ? restTimes.compound : restTimes.isolation;

      return {
        id: ex.id,
        name: ex.name,
        category: ex.category,
        primaryMuscle: ex.primaryMuscle,
        sets,
        minReps: reps.min || 8,
        maxReps: reps.max || 12,
        repTarget: `${reps.min || 8}-${reps.max || 12}`,
        restSeconds: rest || 90,
        isCompound: isComp,
        equipment: ex.equipment,
        weight: "",
        order: selectedCompounds.includes(ex) ? 0 : 1,
        suggestedWeight: null,
        completed: false,
      };
    }).sort((a, b) => a.order - b.order);
  }

  function generateWorkoutPlan(params) {
    const {
      goal = "general-fitness",
      experience = "Beginner",
      days = 3,
      equipment = "gym",
      duration = 45,
      split: preferredSplit = null,
      priorityMuscles = [],
      injuries = [],
      age = 25,
      weight = 70,
    } = params;

    const allExercises = enrichLib();
    const splitName = preferredSplit || getRecommendedSplit(goal, days, experience);
    const splitDays = getSplitDays(splitName, days);
    const progression = R.getProgressionScheme ? R.getProgressionScheme(goal, experience) : { method: "linear", weightJump: 2.5, repTarget: 2 };

    const program = splitDays.map((day, idx) => {
      const focus = day.muscles || [];
      const priority = priorityMuscles.length > 0 ? [...priorityMuscles, ...focus] : focus;
      const exercises = selectExercisesForDay(priority, allExercises, goal, experience, duration, equipment);

      const estDuration = exercises.reduce((sum, ex) => {
        const setTime = ex.restSeconds + 30;
        return sum + ex.sets * setTime;
      }, 300);

      return {
        id: `week-1-day-${idx + 1}`,
        dayNumber: idx + 1,
        name: day.name,
        focus: day.focus,
        exercises,
        estimatedMinutes: Math.round(estDuration / 60),
        completed: false,
        startedAt: null,
        finishedAt: null,
      };
    });

    const week = {
      weekNumber: 1,
      name: `Week 1 - Foundation`,
      days: program,
      totalEstimatedMinutes: program.reduce((s, d) => s + (d.estimatedMinutes || 0), 0),
    };

    const programStructure = {
      goal,
      experience,
      equipment,
      split: splitName,
      trainingDays: days,
      duration,
      durationUnit: "minutes",
      progression: progression.method,
      weightJump: progression.weightJump,
      repTarget: progression.repTarget,
      totalWeeks: 12,
      weeks: [week],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedWeeks: 0,
      isActive: true,
    };

    for (let w = 2; w <= 12; w++) {
      const isDeload = w % 4 === 0;
      const weekProg = progression;
      const prevWeek = programStructure.weeks[w - 2];
      const weekLabel = isDeload ? "Recovery" : w <= 4 ? "Foundation" : w <= 8 ? "Development" : "Peaking";

      const weekDays = prevWeek.days.map((prevDay, dIdx) => {
        const exercises = prevDay.exercises.map(ex => {
          const sets = isDeload ? Math.max(2, ex.sets - 1) : ex.sets;
          const reps = isDeload ? ex.minReps : ex.maxReps;
          const weight = ex.weight ? parseFloat(ex.weight) : 0;
          const suggestedWeight = weight > 0
            ? Math.round((weight + (isDeload ? 0 : weekProg.weightJump)) * 4) / 4
            : null;

          return {
            ...ex,
            sets,
            minReps: ex.minReps,
            maxReps: isDeload ? ex.minReps : ex.maxReps,
            repTarget: isDeload ? `${ex.minReps}` : `${ex.minReps}-${ex.maxReps}`,
            weight: suggestedWeight ? String(suggestedWeight) : "",
            suggestedWeight,
          };
        });

        const estDuration = exercises.reduce((sum, ex) => sum + ex.sets * (ex.restSeconds + 30), 300);

        return {
          ...prevDay,
          id: `week-${w}-day-${dIdx + 1}`,
          exercises,
          estimatedMinutes: Math.round(estDuration / 60),
          completed: false,
          startedAt: null,
          finishedAt: null,
        };
      });

      programStructure.weeks.push({
        weekNumber: w,
        name: `Week ${w} - ${weekLabel}`,
        days: weekDays,
        totalEstimatedMinutes: weekDays.reduce((s, d) => s + (d.estimatedMinutes || 0), 0),
      });
    }

    return programStructure;
  }

  function generateDailyWorkout(program, weekIndex, dayIndex) {
    const week = program.weeks[weekIndex];
    if (!week || !week.days[dayIndex]) return null;
    return week.days[dayIndex];
  }

  function getNextWorkout(program) {
    for (const week of program.weeks) {
      for (const day of week.days) {
        if (!day.completed) return { week, day };
      }
    }
    return null;
  }

  function getCurrentWeek(program, today) {
    const date = new Date(today || Date.now());
    const startDate = new Date(program.createdAt);
    const daysSince = Math.floor((date - startDate) / 86400000);
    const weekIndex = Math.min(Math.floor(daysSince / 7), program.totalWeeks - 1);
    return program.weeks[weekIndex] || program.weeks[0];
  }

  function shouldDeload(program, performance) {
    if (!performance) return false;
    const strengthDecline = performance.strengthDecline || 0;
    const fatigueScore = performance.fatigueScore || 0;
    const missedSessions = performance.missedSessions || 0;

    if (strengthDecline > 0.1) return true;
    if (fatigueScore > 80) return true;
    if (missedSessions >= 3) return true;
    return false;
  }

  function estimate1RM(weight, reps) {
    if (!weight || !reps) return null;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }

  function suggestNextWeight(exercise, completedSets, progressionJump) {
    const doneSets = (completedSets || []).filter(s => s.done);
    if (doneSets.length === 0) return null;

    const avgReps = doneSets.reduce((s, set) => s + (set.reps || 0), 0) / doneSets.length;
    const targetReps = parseInt(exercise.maxReps) || 12;
    const jump = progressionJump || 2.5;
    const lastWeight = parseFloat(doneSets[doneSets.length - 1].weight) || 0;

    if (avgReps >= targetReps + 1 && lastWeight > 0) {
      return Math.round((lastWeight + jump) * 4) / 4;
    }
    return lastWeight || null;
  }

  return {
    generateWorkoutPlan,
    generateDailyWorkout,
    getNextWorkout,
    getCurrentWeek,
    shouldDeload,
    estimate1RM,
    suggestNextWeight,
    getRecommendedSplit,
    SPLIT_DEFINITIONS,
  };
})();

if (typeof window !== "undefined") window.ProgramGenerator = ProgramGenerator;
