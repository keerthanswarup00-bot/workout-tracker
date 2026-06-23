// ============================================================
// IRONLOG ONBOARDING ENGINE V1
// First-time user experience, profile setup, goal activation
// & first-7-days guided experience.
// ============================================================

const OnboardingEngine = (() => {
  const STORAGE_KEY = "ironlog_onboarding";

  function getDefaultState() {
    return {
      completed: false,
      currentStep: 0,
      data: {
        name: "",
        age: "",
        gender: "",
        height: "",
        weight: "",
        goalType: "",
        experience: "",
        trainingDays: 3,
        equipment: "",
        targetWeight: "",
        targetDate: "",
        primaryLift: "",
      },
      coachActivated: false,
      activatedAt: null,
      firstWorkoutDone: false,
      first7Days: {
        day1Workout: false,
        day2Weight: false,
        day3Protein: false,
        day4Learning: false,
        day5Challenge: false,
        day6CoachScore: false,
        day7Report: false,
      },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const def = getDefaultState();
        return { ...def, ...parsed, data: { ...def.data, ...(parsed.data || {}) } };
      }
    } catch (e) { /* ignore */ }
    return getDefaultState();
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function isOnboardingComplete() {
    return loadState().completed;
  }

  function getCurrentStep() {
    return loadState().currentStep;
  }

  function markComplete() {
    const state = loadState();
    state.completed = true;
    state.coachActivated = true;
    state.activatedAt = getDateKey(new Date());
    saveState(state);
  }

  function updateData(updates) {
    const state = loadState();
    Object.assign(state.data, updates);
    saveState(state);
  }

  function setStep(step) {
    const state = loadState();
    state.currentStep = step;
    saveState(state);
  }

  function markFirst7Day(day) {
    const state = loadState();
    if (state.first7Days[day] !== undefined) {
      state.first7Days[day] = true;
      saveState(state);
    }
  }

  function getFirst7DayStatus() {
    return loadState().first7Days;
  }

  function getFirst7DayProgress() {
    const days = loadState().first7Days;
    return Object.values(days).filter(Boolean).length;
  }

  function reset() {
    saveState(getDefaultState());
  }

  function getDateKey(date) {
    if (!date) date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  return {
    isOnboardingComplete,
    getCurrentStep,
    markComplete,
    updateData,
    setStep,
    loadState,
    markFirst7Day,
    getFirst7DayStatus,
    getFirst7DayProgress,
    reset,
  };
})();
