const STORAGE_KEY = "workout-tracker-v3";
const PROTEIN_GOAL = 146;
const CARBS_GOAL = 240;

const curatedFoods = [
  { name: "Eggs", protein: 6, carbs: 0.5, unit: "egg", qtyLabel: "eggs", qty: 1, step: 1, min: 1, max: 8 },
  { name: "Chapathi", protein: 3, carbs: 15, unit: "piece", qtyLabel: "pieces", qty: 2, step: 1, min: 1, max: 4 },
  { name: "Rice", protein: 4, carbs: 45, unit: "100g", qtyLabel: "g", qty: 100, step: 50, min: 50, max: 500 },
  { name: "Chicken Biryani", protein: 28, carbs: 65, unit: "plate", qtyLabel: "plates", qty: 1, step: 0.5, min: 0.5, max: 3 },
  { name: "Chicken Fry", protein: 12, carbs: 2, unit: "piece", qtyLabel: "pieces", qty: 3, step: 1, min: 1, max: 6 },
  { name: "Kebab", protein: 10, carbs: 2, unit: "piece", qtyLabel: "pieces", qty: 3, step: 1, min: 1, max: 6 },
  { name: "Grill (Chicken)", protein: 25, carbs: 3, unit: "serving", qtyLabel: "servings", qty: 1, step: 0.5, min: 0.5, max: 3 },
  { name: "Dal", protein: 6, carbs: 18, unit: "100g", qtyLabel: "g", qty: 100, step: 50, min: 50, max: 400 },
  { name: "Shawarma", protein: 24, carbs: 35, unit: "roll", qtyLabel: "rolls", qty: 1, step: 0.5, min: 0.5, max: 3 },
  { name: "Bread", protein: 2, carbs: 12, unit: "slice", qtyLabel: "slices", qty: 2, step: 1, min: 1, max: 4 },
  { name: "Coffee", protein: 2, carbs: 5, unit: "cup", qtyLabel: "cups", qty: 1, step: 1, min: 1, max: 3 },
  { name: "Parotta", protein: 3, carbs: 26, unit: "piece", qtyLabel: "pieces", qty: 2, step: 1, min: 1, max: 4 },
  { name: "Chicken Curry", protein: 30, carbs: 8, unit: "bowl", qtyLabel: "bowls", qty: 1, step: 0.5, min: 0.5, max: 3 },
  { name: "Custom Entry", protein: 0, carbs: 0, unit: "", qtyLabel: "", qty: 1, step: 1, min: 1, max: 1 },
];

let weightChartInstance = null;
let macroChartInstance = null;
let exerciseDetailChartInstance = null;

const plan = [
  {
    id: "push-heavy",
    name: "Push (Heavy)",
    focus: "Heavy pressing with focused triceps and lateral delt work.",
    day: "Day 1",
    duration: "75-80 min",
    rest: "3-4 min on big presses, 60 sec between triceps superset pairs.",
    exercises: [
      { name: "Flat Barbell Bench Press", sets: 4, reps: 6, repTarget: "4-6", weight: "", priority: true, tip: "Scapula retracted, slight arch, feet flat, 3 sec negative." },
      { name: "Incline Dumbbell Press", sets: 3, reps: 8, repTarget: "6-8", weight: "", tip: "Use a 30 degree incline, pause in the bottom stretch." },
      { name: "Landmine Press", sets: 3, reps: 8, repTarget: "8", weight: "", tip: "Shoulder-safe press, one arm at a time, drive through heel of palm." },
      { name: "Cable Lateral Raise", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Low pulley behind body, lead with elbow, use full range." },
      { name: "Cable Overhead Tricep Extension", sets: 3, reps: 10, repTarget: "10", weight: "", superset: "Pair with rope pushdown.", tip: "Full long-head stretch at the top, 3 sec negative." },
      { name: "Tricep Rope Pushdown", sets: 3, reps: 12, repTarget: "12", weight: "", superset: "Pair with overhead extension.", tip: "Elbows pinned, full lockout, 60 sec rest after the pair." },
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
      { name: "Conventional Deadlift", sets: 4, reps: 5, repTarget: "3-5", weight: "", priority: true, tip: "First exercise. Brace 360, lats engaged, drive the floor away." },
      { name: "Weighted Pull-Up / Lat Pulldown", sets: 4, reps: 6, repTarget: "4-6", weight: "", priority: true, tip: "Pull elbows to hips, 3 sec negative, lat width is priority." },
      { name: "Chest-Supported Dumbbell Row", sets: 3, reps: 10, repTarget: "8-10", weight: "", tip: "Bench at 30 degrees, drive elbows past torso." },
      { name: "Face Pulls", sets: 4, reps: 15, repTarget: "15", weight: "", priority: true, tip: "Every pull session. Rope to forehead with external rotation." },
      { name: "Incline Dumbbell Curl", sets: 3, reps: 10, repTarget: "8-10", weight: "", tip: "Full stretch at bottom, slow negative." },
      { name: "Farmer's Carry", sets: 3, reps: 1, repTarget: "20-30m length", weight: "", priority: true, tip: "Heaviest dumbbells, locked wrists, grip and forearm finisher." },
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
      { name: "Box Squat to Parallel", sets: 4, reps: 6, repTarget: "4-6", weight: "", priority: true, tip: "To bench only, not below parallel until knee is pain-free 4+ weeks." },
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
      { name: "Flat Barbell Bench Press", sets: 4, reps: 10, repTarget: "8-10", weight: "", priority: true, tip: "Same movement as A day, more reps, harder negative." },
      { name: "Incline Dumbbell Press", sets: 3, reps: 12, repTarget: "10-12", weight: "", tip: "Pause at bottom stretch 1 sec." },
      { name: "Cable Lateral Raise", sets: 4, reps: 15, repTarget: "15", weight: "", tip: "Constant tension, 3 sec negative, burn them out." },
      { name: "Seated Dumbbell Shoulder Press", sets: 3, reps: 12, repTarget: "12", weight: "", tip: "Neutral grip, elbows slightly in front for shoulder safety." },
      { name: "Cable Overhead Tricep Extension", sets: 3, reps: 15, repTarget: "12-15", weight: "", superset: "Pair with rope pushdown.", tip: "Higher-rep long-head triceps work." },
      { name: "Tricep Rope Pushdown", sets: 3, reps: 15, repTarget: "15", weight: "", superset: "Pair with overhead extension.", tip: "Elbows pinned, chase the pump." },
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
      { name: "Lat Pulldown / Pull-Up", sets: 4, reps: 10, repTarget: "8-10", weight: "", priority: true, tip: "Full range, 3 sec negative, squeeze at bottom." },
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
      { name: "Romanian Deadlift (Heavy)", sets: 4, reps: 8, repTarget: "6-8", weight: "", priority: true, tip: "Primary movement today, heavier than Wednesday." },
      { name: "Leg Press (Feet High)", sets: 4, reps: 15, repTarget: "12-15", weight: "", tip: "Pause at bottom for glute stretch." },
      { name: "Seated Leg Curl", sets: 4, reps: 12, repTarget: "10-12", weight: "", tip: "Heavier than Wednesday, 4 sec negative." },
      { name: "Box Squat (Light)", sets: 3, reps: 10, repTarget: "10", weight: "", tip: "Volume-focused second squat exposure." },
      { name: "Standing Calf Raise", sets: 4, reps: 20, repTarget: "20", weight: "", tip: "Full range, 2 sec stretch pause, 4 sec negative." },
    ],
  },
];

const restDay = {
  day: "Day 7",
  name: "Rest",
  focus: "Foam rolling, mobility work, recovery walk, and weekly progress review.",
};

const progressionPlan = [
  "Bench: add 2.5 kg or 1 rep when all sets hit the top of the range.",
  "Deadlift: add 2.5-5 kg when form stays clean.",
  "Pull-up or pulldown: add 1 rep or 2.5 kg; add belt weight when bodyweight is easy.",
  "Box squat: add 2.5 kg only when form and depth are consistent.",
  "Isolation lifts: add 1 rep or 2.5 kg more patiently.",
  "Deload every 8 weeks: 50-60% volume, same exercises.",
];

const trainingRules = [
  "Track every set and rep.",
  "Never miss a compound. If time is short, cut the last isolation.",
  "Use a 3-second negative on every rep.",
  "Perform face pulls on every pull day.",
  "Push the final 2 reps of each set with maximum focus and effort.",
];

const warmupProtocol = [
  "5 min treadmill walk or stationary bike.",
  "Shoulder circles x 20 each direction.",
  "Hip circles x 15 each direction.",
  "Band pull-aparts or light face pulls x 20.",
  "First compound: 50% x 8, then 75% x 3 before working weight.",
];

const injuryGuardrails = [
  "Knee: box squat to parallel only; no below-parallel squats until pain-free 4+ weeks.",
  "Knee: leg press feet high and seated leg curl are preferred.",
  "Shoulder: landmine press replaces barbell overhead press.",
  "Shoulder: avoid behind-neck movements, upright rows, and dips.",
  "Pull days: face pulls 4 x 15 are non-negotiable.",
];

const state = loadState();

const els = {
  todayLabel: document.getElementById("todayLabel"),
  todayProtein: document.getElementById("todayProtein"),
  proteinProgress: document.getElementById("proteinProgress"),
  todayCarbs: document.getElementById("todayCarbs"),
  carbsProgress: document.getElementById("carbsProgress"),
  todayWorkoutName: document.getElementById("todayWorkoutName"),
  todayWorkoutStatus: document.getElementById("todayWorkoutStatus"),
  todayCompletion: document.getElementById("todayCompletion"),
  todaySetCount: document.getElementById("todaySetCount"),
  sessionFocus: document.getElementById("sessionFocus"),
  missedNotice: document.getElementById("missedNotice"),
  todayExercisePreview: document.getElementById("todayExercisePreview"),
  workoutTitle: document.getElementById("workoutTitle"),
  exerciseList: document.getElementById("exerciseList"),
  finishSessionButton: document.getElementById("finishSessionButton"),
  quickLogAllButton: document.getElementById("quickLogAllButton"),
  planGrid: document.getElementById("planGrid"),
  warmupList: document.getElementById("warmupList"),
  progressionList: document.getElementById("progressionList"),
  trainingRulesList: document.getElementById("trainingRulesList"),
  injuryList: document.getElementById("injuryList"),
  recoveryCard: document.getElementById("recoveryCard"),
  historyCharts: document.getElementById("historyCharts"),
  sessionLog: document.getElementById("sessionLog"),
};

els.todayLabel.textContent = formatReadableDate(new Date());

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.jump));
});

els.exerciseList.addEventListener("input", (event) => {
  const input = event.target.closest("[data-field]");
  if (!input) return;
  const set = getSet(input.dataset.exercise, Number(input.dataset.set));
  set[input.dataset.field] = input.value === "" ? "" : Number(input.value);
  saveAndRender();
});

els.exerciseList.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-complete]");
  if (!checkbox) return;
  const set = getSet(checkbox.dataset.exercise, Number(checkbox.dataset.set));
  set.done = checkbox.checked;
  saveAndRender();
});

els.exerciseList.addEventListener("click", (event) => {
  const quickLogBtn = event.target.closest("[data-quick-log]");
  if (quickLogBtn) {
    quickLogExercise(quickLogBtn.dataset.quickLog);
    saveAndRender();
    return;
  }
  const rpeBtn = event.target.closest("[data-rpe]");
  if (rpeBtn) {
    const set = getSet(rpeBtn.dataset.exercise, Number(rpeBtn.dataset.set));
    set.rpe = Number(rpeBtn.dataset.rpe);
    saveAndRender();
    return;
  }
});

els.quickLogAllButton.addEventListener("click", () => {
  getCurrentWorkout().exercises.forEach((exercise) => quickLogExercise(exercise.name));
  saveAndRender();
});

els.finishSessionButton.addEventListener("click", () => {
  showNotesModal();
});

// Meal logging will be initialised by initNewFeatures()

document.addEventListener("DOMContentLoaded", () => {
  render();
  activateTab("train");
});

function render() {
  ensureTodaySession();
  renderToday();
  renderWorkout();
  renderMealLog();
  renderPlan();
  renderRecovery();
  renderHistory();
  renderBodyTab();
  renderFuelExtra();
  renderProgressExtra();
  renderFatigueUI();
  renderSessionClock();
  renderSkipLog();
}

function renderToday() {
  const workout = getCurrentWorkout();
  const session = getTodaySession();
  const nutrition = getTodayNutrition();
  const completion = getCompletion(session);
  const missed = getMissedSession();

  els.todayProtein.textContent = String(nutrition.protein);
  els.proteinProgress.style.width = `${Math.min(
    (nutrition.protein / PROTEIN_GOAL) * 100,
    100
  )}%`;
  els.todayCarbs.textContent = String(nutrition.carbs);
  els.carbsProgress.style.width = `${Math.min(
    (nutrition.carbs / CARBS_GOAL) * 100,
    100
  )}%`;
  els.todayWorkoutName.textContent = workout.name;
  els.todayWorkoutStatus.textContent = session.finishedAt
    ? "Finished"
    : missed
      ? "Recovery decision needed"
      : "Ready to log";
  els.todayCompletion.textContent = `${completion.percent}%`;
  els.todaySetCount.textContent = `${completion.done} of ${completion.total} sets logged`;
  els.sessionFocus.textContent = `${workout.focus} ${workout.duration}. ${workout.rest}`;

  els.missedNotice.classList.toggle("is-hidden", !missed);
  els.missedNotice.innerHTML = missed
    ? `<strong>${missed.name} was missed.</strong><span>Shift it to today or mark it as a rest day from the Recovery tab.</span>`
    : "<strong>Plan is current.</strong><span>No missed lifting day needs attention.</span>";

  els.todayExercisePreview.innerHTML = workout.exercises
    .map(
      (exercise) => `
        <article class="preview-item">
          <strong>${exercise.name}</strong>
          <span>${exercise.sets} x ${getRepTarget(exercise)} - ${formatWeight(exercise.weight)}</span>
        </article>
      `
    )
    .join("");
}

function renderWorkout() {
  const workout = getCurrentWorkout();
  const session = getTodaySession();
  els.workoutTitle.textContent = workout.name;

  const picker = document.getElementById("workoutPicker");
  if (picker) {
    picker.querySelectorAll(".workout-pick").forEach(btn => {
      const type = btn.dataset.workoutType;
      btn.classList.toggle("is-active", workout.name.toLowerCase().startsWith(type.toLowerCase()));
    });
  }

  let output = "";
  let i = 0;
  while (i < workout.exercises.length) {
    const exercise = workout.exercises[i];
    const next = i + 1 < workout.exercises.length ? workout.exercises[i + 1] : null;
    const isSuperset = exercise.superset && next && next.superset && exercise.superset === next.superset;

    if (isSuperset) {
      output += `<div class="superset-group"><div class="superset-label">Superset</div>`;
      output += renderExerciseCard(exercise, session);
      output += renderExerciseCard(next, session);
      output += `</div>`;
      i += 2;
    } else {
      output += renderExerciseCard(exercise, session);
      i++;
    }
  }

  els.exerciseList.innerHTML = output;
}

function renderExerciseCard(exercise, session) {
  const sets = getExerciseSets(session, exercise.name);
  const latest = getLatestExercise(exercise.name);
  const quickLabel = latest ? "Use last session" : "Use target";
  const lastData = getLastSessionData(exercise.name);
  const prs = loadPRs();

  return `
    <article class="exercise-card" data-exercise-card="${exercise.name}">
      <div class="exercise-heading">
        <div>
          <h3>${exercise.name}</h3>
          <p>${exercise.sets} sets target, ${getRepTarget(exercise)} target</p>
        </div>
        <button class="icon-button" type="button" data-quick-log="${exercise.name}" aria-label="Quick log ${exercise.name}" title="${quickLabel}">
          +
        </button>
      </div>
      ${lastData ? `<div class="last-session">Last session: ${formatWeight(lastData.weight)} × ${lastData.reps}</div>` : ""}
      <div class="exercise-cues">
        ${exercise.priority ? "<span>Main lift</span>" : ""}
        ${exercise.superset ? `<span>${exercise.superset}</span>` : ""}
        <p>${exercise.tip}</p>
      </div>
      <div class="set-grid" role="group" aria-label="${exercise.name} sets">
        ${sets
          .map(
            (set, setIndex) => {
              const isPR = prs && prs[exercise.name] && set.done && set.weight && Number(set.weight) >= prs[exercise.name].weight;
              return `
                <div class="set-row${set.done ? " has-rpe" : ""}">
                  <label class="set-check">
                    <input type="checkbox" data-complete="${exercise.name}" data-exercise="${exercise.name}" data-set="${setIndex}" ${set.done ? "checked" : ""} />
                    <span>Set ${setIndex + 1}${isPR ? `<span class="pr-badge">PR</span>` : ""}
                    ${set.rpe ? `<span class="rpe-dot ${getRPEColor(set.rpe)}"></span>` : ""}
                    </span>
                  </label>
                  <label>
                    Reps
                    <input type="number" min="0" max="999" step="1" value="${set.reps}" data-field="reps" data-exercise="${exercise.name}" data-set="${setIndex}" inputmode="numeric" />
                  </label>
                  <label>
                    Weight
                    <input type="number" min="0" max="999" step="0.5" value="${set.weight ?? ""}" placeholder="0" data-field="weight" data-exercise="${exercise.name}" data-set="${setIndex}" inputmode="decimal" />
                  </label>
                  ${set.done ? renderRPESelector(exercise.name, setIndex, set.rpe) : ""}
                </div>
              `;
            }
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderRPESelector(exerciseName, setIndex, currentRPE) {
  let html = `<div class="set-actions"><span class="rpe-label">RPE</span><div class="rpe-selector">`;
  for (let r = 6; r <= 10; r++) {
    html += `<button type="button" class="rpe-button${r === currentRPE ? " is-selected" : ""}" data-rpe="${r}" data-exercise="${exerciseName}" data-set="${setIndex}">${r}</button>`;
  }
  html += `</div></div>`;
  return html;
}

function getRPEColor(rpe) {
  if (rpe <= 7) return "green";
  if (rpe === 8) return "amber";
  return "red";
}

function renderMealLog() {
  const today = getDateKey();
  const meals = loadMeals(today);
  const totals = getMealTotals(meals);
  const container = document.getElementById("mealLogContainer");
  if (!container) return;

  const foodSelect = document.getElementById("foodSelect");
  const activeType = document.querySelector(".meal-pill.is-active")?.dataset.mealType || "Breakfast";

  document.getElementById("mealTotals").innerHTML = `
    <div class="meal-total-row">
      <span>Protein</span>
      <div class="progress-track"><span class="protein-fill" style="width:${Math.min((totals.protein / PROTEIN_GOAL) * 100, 100)}%"></span></div>
      <span>${totals.protein}g / ${PROTEIN_GOAL}g (${Math.round((totals.protein / PROTEIN_GOAL) * 100)}%)</span>
    </div>
    <div class="meal-total-row">
      <span>Carbs</span>
      <div class="progress-track"><span style="width:${Math.min((totals.carbs / CARBS_GOAL) * 100, 100)}%"></span></div>
      <span>${totals.carbs}g / ${CARBS_GOAL}g (${Math.round((totals.carbs / CARBS_GOAL) * 100)}%)</span>
    </div>
  `;

  document.getElementById("mealLog").innerHTML = meals.length
    ? meals.map((meal, i) => `
        <div class="meal-log-item">
          <div>
            <span class="meal-tag">${meal.type}</span>
            <strong>${meal.food}</strong>${meal.qty ? ` <span class="meal-macros">×${meal.qty}</span>` : ""}
            <span class="meal-macros"> — ${meal.protein}g protein · ${meal.carbs}g carbs</span>
          </div>
          <button class="meal-delete" data-meal-index="${i}">✕</button>
        </div>
      `).join("")
    : `<p style="color:var(--muted);font-size:0.88rem;font-weight:600">No meals logged today. Add one above.</p>`;

  document.querySelectorAll(".meal-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.mealIndex);
      const meals = loadMeals(today);
      meals.splice(idx, 1);
      saveMeals(today, meals);
      renderMealLog();
    });
  });
}

function renderPlan() {
  const custom = loadCustomProgram();
  const activePlan = custom || plan;

  els.planGrid.innerHTML = [
    ...activePlan.map(
      (workout, index) => `
        <article class="plan-day ${index === state.planOffset ? "is-current" : ""}">
          <span>${workout.day || workout.name}</span>
          <strong>${workout.name}</strong>
          <p>${workout.focus || ""}</p>
          <small>${workout.duration || ""}</small>
        </article>
      `
    ),
    !custom ? `
        <article class="plan-day recovery-day">
          <span>${restDay.day}</span>
          <strong>${restDay.name}</strong>
          <p>${restDay.focus}</p>
        </article>
      ` : "",
  ].join("");

  els.warmupList.innerHTML = warmupProtocol
    .map((item) => `<li>${item}</li>`)
    .join("");
  els.progressionList.innerHTML = progressionPlan
    .map((item) => `<li>${item}</li>`)
    .join("");
  els.trainingRulesList.innerHTML = trainingRules
    .map((item) => `<li>${item}</li>`)
    .join("");
  els.injuryList.innerHTML = injuryGuardrails
    .map((item) => `<li>${item}</li>`)
    .join("");
}

function renderRecovery() {
  const missed = getMissedSession();
  if (!missed) {
    els.recoveryCard.innerHTML = `
      <div>
        <strong>No recovery action needed</strong>
        <p>Your next scheduled lift is ${getPlannedWorkout().name}. Keep the plan rolling.</p>
      </div>
    `;
    return;
  }

  els.recoveryCard.innerHTML = `
    <div>
      <strong>${missed.name} is still pending</strong>
      <p>Last finished session was ${missed.lastDateLabel}. Choose how to recover the plan.</p>
    </div>
    <div class="recovery-actions">
      <button class="primary-button" type="button" id="shiftPlanButton">Shift to today</button>
      <button class="secondary-button" type="button" id="markRestButton">Mark rest day</button>
    </div>
  `;

  document.getElementById("shiftPlanButton").addEventListener("click", () => {
    ensureTodaySession(true);
    saveAndRender();
    activateTab("workout");
  });

  document.getElementById("markRestButton").addEventListener("click", () => {
    state.recoveryLog.unshift({
      id: crypto.randomUUID(),
      dateKey: getDateKey(),
      note: `Marked ${missed.name} as a recovery day`,
    });
    state.planOffset = (state.planOffset + 1) % plan.length;
    saveAndRender();
  });
}

function renderHistory() {
  const activePlan = loadCustomProgram() || plan;
  const exerciseNames = [...new Set(activePlan.flatMap((workout) => workout.exercises.map((exercise) => exercise.name)))];

  els.historyCharts.innerHTML = exerciseNames
    .map((name) => {
      const points = getExerciseHistory(name);
      const last = points.at(-1);
      const plateau = detectPlateau(name);
      return `
        <article class="history-card" style="cursor:pointer" data-exercise-detail="${name}">
          <div>
            <strong>${name}${plateau ? `<span class="plateau-badge">Plateau</span>` : ""}</strong>
            <span>${last ? `${formatWeight(last.weight)} best set` : "No logged sets yet"}</span>
            ${plateau ? `<div class="plateau-suggestion">Try: +1 rep, then +2.5kg next session.</div>` : ""}
          </div>
          ${renderSparkline(points)}
        </article>
      `;
    })
    .join("");

  const logs = state.sessions
    .filter((session) => session.finishedAt)
    .slice()
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  els.sessionLog.innerHTML = logs.length
    ? logs
        .map((session) => {
          const completion = getCompletion(session);
          return `
            <article class="log-item">
              <div>
                <strong>${session.workoutName}</strong>
                <span>${formatReadableDate(parseDateKey(session.dateKey))}</span>
              </div>
              <span>${completion.done}/${completion.total} sets</span>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">Finish a session to start building history.</div>`;
}

function activateTab(tabName) {
  const tabPanels = {
    train: ["today", "workout", "recovery"],
    body: ["body"],
    fuel: ["nutrition"],
    progress: ["history", "plan"],
  };
  const panels = tabPanels[tabName] || [tabName];

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panels.includes(panel.id.replace("tab-", "")));
  });
}

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
        sets: Array.from({ length: exercise.sets }, () => ({
          reps: 10,
          weight: "",
          done: false,
        })),
      })),
    };
    state.sessions = state.sessions.filter((item) => item.dateKey !== today);
    state.sessions.unshift(session);
    saveState();
  }

  return session;
}

function getTodaySession() {
  return ensureTodaySession();
}

function getCurrentWorkout() {
  const todaySession = state.sessions.find((item) => item.dateKey === getDateKey());
  const activePlan = loadCustomProgram() || plan;
  if (todaySession) {
    return activePlan.find((workout) => workout.id === todaySession.workoutId) || getPlannedWorkout();
  }

  return getPlannedWorkout();
}

function getPlannedWorkout() {
  const activePlan = loadCustomProgram() || plan;
  const selected = state.selectedWorkoutType;
  if (selected) {
    const match = activePlan.find(w => w.name.toLowerCase().startsWith(selected.toLowerCase()));
    if (match) return match;
  }
  return activePlan[state.planOffset % activePlan.length];
}

function getExerciseSets(session, exerciseName) {
  let exercise = session.exercises.find((item) => item.name === exerciseName);

  if (!exercise) {
    const target = getCurrentWorkout().exercises.find((item) => item.name === exerciseName);
    exercise = {
      name: exerciseName,
      sets: Array.from({ length: target?.sets || 3 }, () => ({
        reps: target?.reps || 8,
        weight: target?.weight ?? "",
        done: false,
      })),
    };
    session.exercises.push(exercise);
    saveState();
  }

  return exercise.sets;
}

function getSet(exerciseName, setIndex) {
  return getExerciseSets(getTodaySession(), exerciseName)[setIndex];
}

function quickLogExercise(exerciseName) {
  const session = getTodaySession();
  const currentSets = getExerciseSets(session, exerciseName);
  const latest = getLatestExercise(exerciseName);

  currentSets.forEach((set, index) => {
    const source = latest?.sets[index] || set;
    set.reps = source.reps;
    set.weight = source.weight;
    set.done = true;
  });
}

function getLatestExercise(exerciseName) {
  return state.sessions
    .filter((session) => session.dateKey !== getDateKey() && session.finishedAt)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.name === exerciseName);
}

function getExerciseHistory(exerciseName) {
  return state.sessions
    .filter((session) => session.finishedAt)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .map((session) => {
      const exercise = session.exercises.find((item) => item.name === exerciseName);
      if (!exercise) return null;
      const completeSets = exercise.sets.filter((set) => set.done);
      const loadedSets = completeSets.filter((set) => typeof set.weight === "number");
      if (!loadedSets.length) return null;
      return {
        dateKey: session.dateKey,
        weight: Math.max(...loadedSets.map((set) => set.weight)),
      };
    })
    .filter(Boolean);
}

function getCompletion(session) {
  const sets = session.exercises.flatMap((exercise) => exercise.sets);
  const done = sets.filter((set) => set.done).length;
  return {
    done,
    total: sets.length,
    percent: sets.length ? Math.round((done / sets.length) * 100) : 0,
  };
}

function getMissedSession() {
  const finished = state.sessions
    .filter((session) => session.finishedAt)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
  if (!finished) return null;

  const daysSince = daysBetween(parseDateKey(finished.dateKey), new Date());
  if (daysSince < 3) return null;

  return {
    ...getPlannedWorkout(),
    lastDateLabel: formatReadableDate(parseDateKey(finished.dateKey)),
  };
}

function getTodayNutrition() {
  const today = getDateKey();
  const meals = loadMeals(today);
  return getMealTotals(meals);
}

function loadMeals(dateKey) {
  try {
    const data = localStorage.getItem(`wl_meals_${dateKey}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveMeals(dateKey, meals) {
  localStorage.setItem(`wl_meals_${dateKey}`, JSON.stringify(meals));
}

function getMealTotals(meals) {
  const protein = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  const carbs = meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0);
  return { protein, carbs };
}

function renderSparkline(points) {
  if (points.length < 2) {
    return `<div class="sparkline-empty">Need 2 sessions</div>`;
  }

  const weights = points.map((point) => point.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const coords = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 42 - ((point.weight - min) / range) * 34;
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <svg class="sparkline" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${coords}" />
    </svg>
  `;
}

function saveAndRender() {
  saveState();
  render();
}

function loadState() {
  const fallback = { sessions: [], nutrition: {}, planOffset: 0, recoveryLog: [] };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatReadableDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatWeight(weight) {
  if (weight === "" || weight === null || weight === undefined) {
    return "add weight";
  }

  return weight === 0 ? "bodyweight" : `${weight} kg`;
}

function getRepTarget(exercise) {
  return exercise.repTarget || String(exercise.reps);
}

function daysBetween(start, end) {
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endDay - startDay) / 86400000);
}

/* === NEW FEATURES === */

function getLastSessionData(exerciseName) {
  const sessions = state.sessions.filter(s => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  for (const session of sessions) {
    const ex = session.exercises.find(e => e.name === exerciseName);
    if (ex) {
      const doneSets = ex.sets.filter(s => s.done && s.weight && Number(s.weight) > 0);
      if (doneSets.length) {
        const lastSet = doneSets[doneSets.length - 1];
        return { weight: Number(lastSet.weight), reps: lastSet.reps };
      }
    }
  }
  return null;
}

function getLastNSessionsForExercise(exerciseName, n) {
  const sessions = state.sessions.filter(s => s.finishedAt).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  const result = [];
  for (const session of sessions) {
    if (result.length >= n) break;
    const ex = session.exercises.find(e => e.name === exerciseName);
    if (ex) {
      const doneSets = ex.sets.filter(s => s.done && s.weight && Number(s.weight) > 0);
      if (doneSets.length) {
        result.push({ weight: Math.max(...doneSets.map(s => Number(s.weight))), dateKey: session.dateKey });
      }
    }
  }
  return result;
}

function detectPlateau(exerciseName) {
  const sessions = getLastNSessionsForExercise(exerciseName, 3);
  if (sessions.length < 3) return false;
  return sessions.every(s => s.weight === sessions[0].weight);
}

function calculate1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

function loadPRs() {
  try { return JSON.parse(localStorage.getItem("wl_prs")) || {}; } catch { return {}; }
}

function savePRs(prs) {
  localStorage.setItem("wl_prs", JSON.stringify(prs));
}

function checkPRs(session) {
  const prs = loadPRs();
  let updated = false;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.done && set.weight && Number(set.weight) > 0) {
        const current = prs[ex.name];
        const weight = Number(set.weight);
        if (!current || weight > current.weight) {
          prs[ex.name] = { weight, reps: set.reps, date: session.dateKey };
          updated = true;
        }
      }
    }
  }
  if (updated) savePRs(prs);
}

function loadBodyLog() {
  try { return JSON.parse(localStorage.getItem("wl_bodylog")) || []; } catch { return []; }
}

function saveBodyLogEntry(entry) {
  const log = loadBodyLog();
  const existing = log.findIndex(e => e.date === entry.date);
  if (existing >= 0) log[existing] = entry;
  else log.push(entry);
  localStorage.setItem("wl_bodylog", JSON.stringify(log));
}

function loadSkips() {
  try { return JSON.parse(localStorage.getItem("wl_skips")) || []; } catch { return []; }
}

function saveSkips(skips) {
  localStorage.setItem("wl_skips", JSON.stringify(skips));
}

function loadWater(dateKey) {
  try { return Number(localStorage.getItem(`wl_water_${dateKey}`)) || 0; } catch { return 0; }
}

function saveWater(dateKey, ml) {
  localStorage.setItem(`wl_water_${dateKey}`, String(ml));
}

function loadFatigue(dateKey) {
  try { return JSON.parse(localStorage.getItem(`wl_fatigue_${dateKey}`)); } catch { return null; }
}

function saveFatigue(dateKey, data) {
  localStorage.setItem(`wl_fatigue_${dateKey}`, JSON.stringify(data));
}

function loadCustomProgram() {
  try { return JSON.parse(localStorage.getItem("wl_custom_program")); } catch { return null; }
}

function saveCustomProgram(program) {
  localStorage.setItem("wl_custom_program", JSON.stringify(program));
}

let sessionInterval = null;
let sessionRemaining = 3600;
let sessionPaused = false;

function startSessionClock() {
  const clock = document.getElementById("sessionClock");
  if (!clock.classList.contains("is-hidden") || sessionInterval) return;
  stopSessionClock();
  sessionPaused = false;
  sessionRemaining = 3600;
  updateSessionDisplay();
  clock.classList.remove("is-hidden");
  sessionInterval = setInterval(() => {
    if (sessionPaused) return;
    sessionRemaining--;
    updateSessionDisplay();
    if (sessionRemaining <= 0) {
      stopSessionClock();
      if (navigator.vibrate) navigator.vibrate(500);
      document.getElementById("sessionClockDisplay").classList.add("is-red");
      setTimeout(() => {
        document.getElementById("sessionClockDisplay").classList.remove("is-red");
      }, 2000);
    }
  }, 1000);
}

function stopSessionClock() {
  if (sessionInterval) {
    clearInterval(sessionInterval);
    sessionInterval = null;
  }
}

function updateSessionDisplay() {
  const h = Math.floor(sessionRemaining / 3600);
  const m = Math.floor((sessionRemaining % 3600) / 60);
  const s = sessionRemaining % 60;
  document.getElementById("sessionClockDisplay").textContent = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function renderSessionClock() {
  const clock = document.getElementById("sessionClock");
  const startBtn = document.getElementById("sessionClockStart");
  const session = getTodaySession();
  const anyDone = session.exercises.some(ex => ex.sets.some(s => s.done));
  if (anyDone) {
    clock.classList.remove("is-hidden");
    stopSessionClock();
    sessionRemaining = 3600;
    updateSessionDisplay();
    document.getElementById("sessionClockDisplay").classList.remove("is-red");
    startBtn.textContent = "▶ Start";
  } else {
    stopSessionClock();
    clock.classList.add("is-hidden");
  }
}

function renderFatigueUI() {
  const today = getDateKey();
  const saved = loadFatigue(today);
  const card = document.getElementById("fatigueCard");
  const resultPill = document.getElementById("fatigueResultPill");

  if (saved) {
    card.classList.add("is-hidden");
    const score = saved.score;
    let cls = "green", label = "Ready to train hard";
    if (score <= 7) { cls = "red"; label = "Consider reducing intensity today"; }
    else if (score <= 11) { cls = "amber"; label = "Train but monitor"; }
    resultPill.className = `fatigue-result-pill ${cls}`;
    resultPill.textContent = `Fatigue: ${score}/15 - ${label}`;
    resultPill.classList.remove("is-hidden");
  } else {
    card.classList.remove("is-hidden");
    resultPill.classList.add("is-hidden");
  }
}

function renderSkipLog() {
  const today = getDateKey();
  const session = getTodaySession();
  const now = new Date();
  const card = document.getElementById("skipLogCard");

  if (session.finishedAt || now.getHours() < 20) {
    card.classList.add("is-hidden");
    return;
  }

  card.classList.remove("is-hidden");
  const skips = loadSkips();
  const alreadySkipped = skips.some(s => s.date === today);
  if (alreadySkipped) {
    card.innerHTML = `<div class="skip-pattern">Today marked as skipped.</div>`;
    return;
  }

  const sameReason = skips.length >= 4 ? getSkipPattern(skips) : "";
  card.innerHTML = `
    <strong>Log a skip</strong>
    <p>No session logged yet and it's past 8pm. Why did you skip?</p>
    <select id="skipReasonSelect">
      <option value="Work">Work</option>
      <option value="Sick">Sick</option>
      <option value="Tired">Tired</option>
      <option value="Travel">Travel</option>
      <option value="Forgot">Forgot</option>
      <option value="Other">Other</option>
    </select>
    <button class="primary-button" id="logSkipButton">Log skip</button>
    ${sameReason ? `<div class="skip-pattern">${sameReason}</div>` : ""}
  `;

  document.getElementById("logSkipButton")?.addEventListener("click", () => {
    const reason = document.getElementById("skipReasonSelect").value;
    const skips = loadSkips();
    skips.push({ date: today, reason });
    saveSkips(skips);
    renderSkipLog();
  });
}

function getSkipPattern(skips) {
  const counts = {};
  skips.forEach(s => { counts[s.reason] = (counts[s.reason] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 3) {
    return `You've skipped ${top[1]} times due to ${top[0]}.`;
  }
  return "";
}

function renderBodyTab() {
  renderWeighIn();
  renderWeightChart();
  renderAdherenceGrid();
}

function renderWeighIn() {
  const container = document.getElementById("weighInCard");
  const log = loadBodyLog();
  const today = getDateKey();
  const todayEntry = log.find(e => e.date === today);

  if (todayEntry) {
    const first = log.length ? log[0] : null;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoKey = getDateKey(weekAgo);
    const weekAgoEntry = log.find(e => e.date === weekAgoKey) || log.find(e => e.date < today) || null;
    const day1Change = first && first.weight ? todayEntry.weight - first.weight : 0;
    const weekChange = weekAgoEntry ? todayEntry.weight - weekAgoEntry.weight : 0;

    container.innerHTML = `
      <div class="weigh-in-display">
        <div class="weigh-in-current">${todayEntry.weight} kg</div>
        <div class="weigh-in-changes">
          ${first ? `<span class="${day1Change > 0 ? "up" : "down"}">${day1Change > 0 ? "↑" : "↓"} ${Math.abs(day1Change).toFixed(1)}kg from start</span>` : ""}
          ${weekAgoEntry ? `<span class="${weekChange > 0 ? "up" : "down"}">${weekChange > 0 ? "↑" : "↓"} ${Math.abs(weekChange).toFixed(1)}kg from last week</span>` : ""}
        </div>
        ${todayEntry.bf ? `<div>Body fat: ${todayEntry.bf}%</div>` : ""}
        <button class="secondary-button" id="editWeighInButton">Edit</button>
      </div>
    `;
    document.getElementById("editWeighInButton")?.addEventListener("click", () => {
      container.innerHTML = buildWeighInForm(todayEntry.weight, todayEntry.bf);
      attachWeighInListener();
    });
  } else {
    container.innerHTML = buildWeighInForm(66.7, 27.1);
    attachWeighInListener();
  }
}

function buildWeighInForm(defaultWeight, defaultBf) {
  return `
    <div class="weigh-in-form">
      <label>Weight (kg) <input type="number" step="0.1" id="weightInput" value="${defaultWeight}" /></label>
      <label>Body Fat % (optional) <input type="number" step="0.1" id="bfInput" value="${defaultBf || ""}" /></label>
    </div>
    <button class="primary-button" id="saveWeighInButton">Save weigh-in</button>
  `;
}

function attachWeighInListener() {
  document.getElementById("saveWeighInButton")?.addEventListener("click", () => {
    const weight = Number(document.getElementById("weightInput").value);
    const bf = document.getElementById("bfInput").value ? Number(document.getElementById("bfInput").value) : null;
    if (!weight) return;
    saveBodyLogEntry({ date: getDateKey(), weight, bf });
    renderBodyTab();
  });
}

function renderWeightChart() {
  if (weightChartInstance) { weightChartInstance.destroy(); weightChartInstance = null; }
  const canvas = document.getElementById("weightChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const log = loadBodyLog();
  const sorted = log.sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-30);
  if (recent.length < 2) return;

  const labels = recent.map(e => formatReadableDate(parseDateKey(e.date)));
  const data = recent.map(e => e.weight);

  const weeklyAvgs = [];
  const weeklyLabels = [];
  for (let i = 0; i < recent.length; i += 7) {
    const week = recent.slice(i, i + 7);
    const avg = week.reduce((s, e) => s + e.weight, 0) / week.length;
    weeklyAvgs.push(avg);
    weeklyLabels.push(labels[i]);
  }

  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data,
          borderColor: "#17756b",
          tension: 0.4,
          pointRadius: 3,
          fill: false,
        },
        {
          data: (() => {
            const arr = new Array(recent.length).fill(null);
            for (let i = 0; i < weeklyAvgs.length; i++) {
              arr[i * 7] = weeklyAvgs[i];
            }
            return arr;
          })(),
          borderColor: "#17756b",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: Math.min(...data) - 1,
          max: Math.max(...data) + 1,
        },
      },
    },
  });
}

function renderAdherenceGrid() {
  const container = document.getElementById("adherenceCard");
  const sessions = state.sessions.filter(s => s.finishedAt);
  const skips = loadSkips();
  const today = new Date();

  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getDateKey(d);
    if (sessions.find(s => s.dateKey === key)) streak++;
    else break;
  }

  let html = `<div class="adherence-header"><span class="streak-label">Current streak: ${streak} days</span></div>`;
  html += `<div class="adherence-grid">`;

  for (let w = 0; w < 12; w++) {
    html += `<div class="adherence-week">`;
    for (let d = 6; d >= 0; d--) {
      const dayOffset = w * 7 + d;
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const key = getDateKey(date);
      const isToday = dayOffset === 0;
      const isFuture = date > today;
      const hasSession = sessions.find(s => s.dateKey === key);
      const hasSkip = skips.find(s => s.date === key);
      const isRest = date.getDay() === 0;

      let cls = "adherence-day";
      if (isFuture) cls += " cell-future";
      else if (hasSession) cls += " cell-trained";
      else if (hasSkip) cls += " cell-skipped";
      else if (isRest) cls += " cell-rest";
      if (isToday) cls += " cell-today";

      html += `<div class="${cls}" title="${formatReadableDate(date)}"></div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}

function renderFuelExtra() {
  renderMacroChart();
  renderWaterTracker();
}

function renderMacroChart() {
  if (macroChartInstance) { macroChartInstance.destroy(); macroChartInstance = null; }
  const canvas = document.getElementById("macroChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const nutrition = getTodayNutrition();

  const logged = [nutrition.protein, nutrition.carbs];
  const hasData = logged.some(v => v > 0);

  if (!hasData) {
    return;
  }

  macroChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Protein", "Carbs"],
      datasets: [{
        data: logged,
        backgroundColor: ["#c2410c", "#17756b"],
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      cutout: "60%",
    },
  });

  const progressContainer = document.getElementById("macroProgress");
  progressContainer.innerHTML = [
    { key: "protein", color: "#c2410c", target: PROTEIN_GOAL },
    { key: "carbs", color: "#17756b", target: CARBS_GOAL },
  ].map(({ key, color, target }) => {
    const loggedVal = nutrition[key] || 0;
    const pct = Math.min((loggedVal / target) * 100, 100);
    return `
      <div class="macro-progress-item">
        <div class="macro-label"><span>${key.charAt(0).toUpperCase() + key.slice(1)}</span><span>${loggedVal}g / ${target}g</span></div>
        <div class="progress-track"><span style="width:${pct}%;background:${color}"></span></div>
      </div>
    `;
  }).join("");
}

function renderWaterTracker() {
  const container = document.getElementById("waterTracker");
  const today = getDateKey();
  const current = loadWater(today);
  const target = 3000;
  const pct = Math.min((current / target) * 100, 100);

  let statusText, statusColor;
  if (current >= target) { statusText = "Hydrated ✓"; statusColor = "#2563eb"; }
  else if (current >= 2000) { statusText = "Almost there"; statusColor = "#2563eb"; }
  else if (current >= 1000) { statusText = "Getting there"; statusColor = "#f59e0b"; }
  else { statusText = "Drink water. Now."; statusColor = "#ef4444"; }

  container.innerHTML = `
    <div class="water-tracker">
      <div class="water-total">${current} <small>ml / ${target}ml</small></div>
      <div class="water-progress-track"><span style="width:${pct}%"></span></div>
      <div class="water-quick-add">
        <button data-water="250">+250ml</button>
        <button data-water="500">+500ml</button>
        <button data-water="750">+750ml</button>
        <button data-water="1000">+1L</button>
      </div>
      <div class="water-status" style="color:${statusColor}">${statusText}</div>
    </div>
  `;

  container.querySelectorAll("[data-water]").forEach(btn => {
    btn.addEventListener("click", () => {
      const amount = Number(btn.dataset.water);
      const newTotal = loadWater(today) + amount;
      saveWater(today, newTotal);
      renderWaterTracker();
    });
  });
}

function renderProgressExtra() {
  renderPRBoard();
  renderStrengthStandards();
  renderWeeklyReview();
}

function renderPRBoard() {
  const container = document.getElementById("prGrid");
  const prs = loadPRs();
  const entries = Object.entries(prs).sort((a, b) => b[1].date.localeCompare(a[1].date));

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">Finish a session to start tracking PRs.</div>`;
    return;
  }

  container.innerHTML = entries.map(([name, data]) => `
    <article class="pr-card">
      <strong>${name}</strong>
      <span>${data.weight}kg × ${data.reps}</span>
      <span>${formatReadableDate(parseDateKey(data.date))}</span>
    </article>
  `).join("");
}

function renderStrengthStandards() {
  const container = document.getElementById("strengthStandards");
  const prs = loadPRs();

  const standards = {
    "Flat Barbell Bench Press": { levels: [{ label: "Beginner", val: 50 }, { label: "Novice", val: 72 }, { label: "Intermediate", val: 95 }, { label: "Advanced", val: 125 }] },
    "Conventional Deadlift": { levels: [{ label: "Beginner", val: 80 }, { label: "Novice", val: 110 }, { label: "Intermediate", val: 145 }, { label: "Advanced", val: 185 }] },
    "Box Squat to Parallel": { levels: [{ label: "Beginner", val: 60 }, { label: "Novice", val: 90 }, { label: "Intermediate", val: 115 }, { label: "Advanced", val: 150 }] },
    "Weighted Pull-Up / Lat Pulldown": { levels: [{ label: "Beginner", val: 10 }, { label: "Novice", val: 20 }, { label: "Intermediate", val: 35 }, { label: "Advanced", val: 50 }] },
  };

  const bw = 66.7;
  const entries = Object.entries(standards);

  if (!entries.some(([name]) => prs[name])) {
    container.innerHTML = `<div class="empty-state">Log sessions for these lifts to see strength standards.</div>`;
    return;
  }

  container.innerHTML = `<div class="standards-list">${entries.map(([name, data]) => {
    const pr = prs[name];
    if (!pr) return "";
    const e1rm = calculate1RM(pr.weight, pr.reps);
    const maxVal = data.levels[data.levels.length - 1].val;
    const pct = Math.min((e1rm / maxVal) * 100, 100);
    const currentLevel = data.levels.slice().reverse().find(l => e1rm >= l.val);
    return `
      <div class="standard-item">
        <div class="standard-header"><span>${name}</span><span>${e1rm}kg (${currentLevel?.label || "Below beginner"})</span></div>
        <div class="standard-bar">
          <div class="standard-bar-fill" style="width:${pct}%"></div>
          <div class="standard-marker" style="left:${pct}%"></div>
        </div>
        <div class="standard-level">${data.levels.map(l => `<span>${l.label} ${l.val}kg</span>`).join("")}</div>
      </div>
    `;
  }).filter(Boolean).join("")}</div>`;
}

function renderWeeklyReview() {
  const container = document.getElementById("weeklyReview");
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const mondayKey = getDateKey(monday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayKey = getDateKey(sunday);

  const weekSessions = state.sessions.filter(s => s.finishedAt && s.dateKey >= mondayKey && s.dateKey <= sundayKey);
  const weekBodyLog = loadBodyLog().filter(e => e.date >= mondayKey && e.date <= sundayKey);

  const sessionCount = weekSessions.length;
  const planCount = 6;
  const totalSets = weekSessions.reduce((sum, s) => sum + s.exercises.reduce((s2, ex) => s2 + ex.sets.filter(set => set.done).length, 0), 0);
  const totalKg = weekSessions.reduce((sum, s) => sum + s.exercises.reduce((s2, ex) => s2 + ex.sets.filter(set => set.done && set.weight).reduce((s3, set) => s3 + (Number(set.weight) || 0) * (set.reps || 0), 0), 0), 0);

  const prs = loadPRs();
  const prCount = Object.keys(prs).length;

  const bwChange = weekBodyLog.length >= 2 ? (weekBodyLog[weekBodyLog.length - 1].weight - weekBodyLog[0].weight).toFixed(1) : null;

  container.innerHTML = sessionCount
    ? `<div class="weekly-review-grid">
        <div class="weekly-review-item"><strong>${sessionCount}/${planCount}</strong><span>Sessions</span></div>
        <div class="weekly-review-item"><strong>${totalSets}</strong><span>Sets logged</span></div>
        <div class="weekly-review-item"><strong>${Math.round(totalKg / 1000)}k</strong><span>kg lifted</span></div>
        <div class="weekly-review-item"><strong>${prCount}</strong><span>PRs</span></div>
        ${bwChange ? `<div class="weekly-review-item"><strong>${bwChange}kg</strong><span>Weight change</span></div>` : ""}
      </div>`
    : `<div class="empty-state">${dayOfWeek === 0 ? "Rest day review — no sessions logged this week." : "Session data will populate here as you train this week."}</div>`;
}

function showNotesModal() {
  document.getElementById("sessionNotesInput").value = "";
  document.getElementById("notesModal").classList.remove("is-hidden");
}

function hideNotesModal() {
  document.getElementById("notesModal").classList.add("is-hidden");
}

function completeSession(notes) {
  const session = getTodaySession();
  session.finishedAt = new Date().toISOString();
  session.notes = notes || "";
  checkPRs(session);
  state.planOffset = (state.planOffset + 1) % plan.length;
  hideNotesModal();
  saveAndRender();
  activateTab("progress");
}

function showExerciseDetailModal(exerciseName) {
  if (exerciseDetailChartInstance) { exerciseDetailChartInstance.destroy(); exerciseDetailChartInstance = null; }
  document.getElementById("exerciseDetailTitle").textContent = exerciseName;
  document.getElementById("exerciseDetailModal").classList.remove("is-hidden");

  const points = getExerciseHistory(exerciseName);
  if (points.length < 2) {
    document.getElementById("exerciseDetailChartContainer").innerHTML = `<div class="empty-state">Need at least 2 sessions with data.</div>`;
    return;
  }

  document.getElementById("exerciseDetailChartContainer").innerHTML = `<canvas id="exerciseDetailChart"></canvas>`;
  const canvas = document.getElementById("exerciseDetailChart");
  const ctx = canvas.getContext("2d");

  exerciseDetailChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: points.map(p => formatReadableDate(parseDateKey(p.dateKey))),
      datasets: [{
        data: points.map(p => p.weight),
        borderColor: "#17756b",
        tension: 0.4,
        pointRadius: 4,
        fill: false,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: Math.min(...points.map(p => p.weight)) - 2,
          max: Math.max(...points.map(p => p.weight)) + 2,
        },
      },
    },
  });
}

function parseProgram(text) {
  const lines = text.trim().split("\n").filter(l => l.trim());
  const days = [];
  let currentDay = null;

  for (const line of lines) {
    const parts = line.split("|").map(p => p.trim());
    if (parts.length < 2) continue;
    const dayName = parts[0];
    const exName = parts[1];
    const sets = parts[2] ? Number(parts[2]) : 3;
    const reps = parts[3] || "";

    if (!currentDay || currentDay.name !== dayName) {
      currentDay = { id: `custom-${days.length}`, name: dayName, day: `Day ${days.length + 1}`, exercises: [], focus: "", duration: "", rest: "" };
      days.push(currentDay);
    }
    currentDay.exercises.push({ name: exName, sets, reps: Number(reps) || 0, repTarget: reps, weight: "", tip: "" });
  }
  return days;
}

function handleLoadProgram() {
  const modal = document.getElementById("loadProgramModal");
  const input = document.getElementById("programInput");
  const preview = document.getElementById("programPreview");
  const confirmBtn = document.getElementById("loadProgramConfirm");
  const cancelBtn = document.getElementById("loadProgramCancel");

  input.value = "";
  preview.classList.add("is-hidden");
  preview.innerHTML = "";
  confirmBtn.textContent = "Preview";
  confirmBtn.disabled = true;
  modal.classList.remove("is-hidden");

  const handleInput = () => { confirmBtn.disabled = !input.value.trim(); };
  input.removeEventListener("input", handleInput);
  input.addEventListener("input", handleInput);

  const handleConfirm = () => {
    if (confirmBtn.textContent === "Preview") {
      const parsed = parseProgram(input.value);
      if (!parsed.length) { preview.innerHTML = "<p>No valid entries found.</p>"; preview.classList.remove("is-hidden"); return; }
      preview.innerHTML = `<p>${parsed.length} day(s) found:</p>` + parsed.map(d => `<strong>${d.name}</strong>: ${d.exercises.map(e => e.name).join(", ")}`).join("<br>");
      preview.classList.remove("is-hidden");
      confirmBtn.textContent = "Confirm & Load";
    } else {
      const parsed = parseProgram(input.value);
      const existing = plan[0]?.exercises.length;
      if (existing) {
        document.getElementById("confirmProgramText").textContent = `This will replace the existing ${plan.length}-day program. Continue?`;
        document.getElementById("confirmProgramModal").classList.remove("is-hidden");
        document.getElementById("confirmProgramYes").onclick = () => {
          saveCustomProgram(parsed);
          document.getElementById("confirmProgramModal").classList.add("is-hidden");
          modal.classList.add("is-hidden");
          renderPlan();
        };
        document.getElementById("confirmProgramNo").onclick = () => {
          document.getElementById("confirmProgramModal").classList.add("is-hidden");
        };
      } else {
        saveCustomProgram(parsed);
        modal.classList.add("is-hidden");
        renderPlan();
      }
    }
  };
  confirmBtn.removeEventListener("click", handleConfirm);
  confirmBtn.addEventListener("click", handleConfirm);

  const handleCancel = () => { modal.classList.add("is-hidden"); };
  cancelBtn.removeEventListener("click", handleCancel);
  cancelBtn.addEventListener("click", handleCancel);
}

function initNewFeatures() {
  document.querySelectorAll(".fatigue-slider").forEach(slider => {
    slider.addEventListener("input", () => {
      const val = slider.value;
      slider.closest("label").querySelector(".fatigue-value").textContent = val;
    });
  });

  document.getElementById("saveFatigueButton")?.addEventListener("click", () => {
    const sleep = Number(document.querySelector("[data-fatigue='sleep']").value);
    const energy = Number(document.querySelector("[data-fatigue='energy']").value);
    const soreness = Number(document.querySelector("[data-fatigue='soreness']").value);
    const score = sleep + energy + (6 - soreness);
    saveFatigue(getDateKey(), { sleep, energy, soreness, score });
    renderFatigueUI();
  });

  document.querySelector(".fatigue-toggle")?.addEventListener("click", () => {
    document.querySelector(".fatigue-body").classList.toggle("is-collapsed");
    const btn = document.querySelector(".fatigue-toggle");
    btn.textContent = document.querySelector(".fatigue-body").classList.contains("is-collapsed") ? "+" : "−";
  });

  document.getElementById("sessionClockDisplay")?.addEventListener("click", () => {
    sessionPaused = !sessionPaused;
  });

  document.getElementById("sessionClockStart")?.addEventListener("click", () => {
    if (sessionInterval) {
      sessionPaused = !sessionPaused;
      document.getElementById("sessionClockStart").textContent = sessionPaused ? "▶ Resume" : "⏸ Pause";
    } else {
      startSessionClock();
      document.getElementById("sessionClockStart").textContent = "⏸ Pause";
    }
  });

  document.getElementById("sessionClockDismiss")?.addEventListener("click", () => {
    stopSessionClock();
    document.getElementById("sessionClock").classList.add("is-hidden");
  });

  document.getElementById("saveNotesButton")?.addEventListener("click", () => {
    const notes = document.getElementById("sessionNotesInput").value;
    completeSession(notes);
  });

  document.getElementById("skipNotesButton")?.addEventListener("click", () => {
    completeSession("");
  });

  document.getElementById("notesModalClose")?.addEventListener("click", hideNotesModal);
  document.getElementById("notesModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) hideNotesModal();
  });

  document.getElementById("exerciseDetailClose")?.addEventListener("click", () => {
    document.getElementById("exerciseDetailModal").classList.add("is-hidden");
    if (exerciseDetailChartInstance) { exerciseDetailChartInstance.destroy(); exerciseDetailChartInstance = null; }
  });
  document.getElementById("exerciseDetailModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById("exerciseDetailModal").classList.add("is-hidden");
      if (exerciseDetailChartInstance) { exerciseDetailChartInstance.destroy(); exerciseDetailChartInstance = null; }
    }
  });

  document.getElementById("loadProgramButton")?.addEventListener("click", handleLoadProgram);
  document.getElementById("loadProgramClose")?.addEventListener("click", () => {
    document.getElementById("loadProgramModal").classList.add("is-hidden");
  });
  document.getElementById("loadProgramModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) document.getElementById("loadProgramModal").classList.add("is-hidden");
  });
  document.getElementById("confirmProgramClose")?.addEventListener("click", () => {
    document.getElementById("confirmProgramModal").classList.add("is-hidden");
  });

  document.getElementById("historyCharts")?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-exercise-detail]");
    if (card) showExerciseDetailModal(card.dataset.exerciseDetail);
  });

  document.getElementById("workoutPicker")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".workout-pick");
    if (!btn) return;
    const type = btn.dataset.workoutType;
    state.selectedWorkoutType = type;
    const workout = getPlannedWorkout();
    const session = getTodaySession();
    session.workoutId = workout.id;
    session.workoutName = workout.name;
    session.exercises = workout.exercises.map(ex => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({ reps: 10, weight: "", done: false })),
    }));
    saveAndRender();
  });

  document.getElementById("logWorkoutButton")?.addEventListener("click", () => {
    document.getElementById("todayPreview").classList.add("is-hidden");
    document.getElementById("workoutLogger").classList.remove("is-hidden");
  });

  document.getElementById("backToTodayButton")?.addEventListener("click", () => {
    document.getElementById("workoutLogger").classList.add("is-hidden");
    document.getElementById("todayPreview").classList.remove("is-hidden");
  });

  /* Meal logging init */
  const foodSelect = document.getElementById("foodSelect");
  const qtyInput = document.getElementById("mealQty");
  const qtyLabel = document.getElementById("mealQtyLabel");

  function updateFoodMacros(food) {
    const qty = Number(qtyInput.value) || 1;
    document.getElementById("mealProtein").value = food.protein * qty;
    document.getElementById("mealCarbs").value = food.carbs * qty;
  }

  if (foodSelect) {
    curatedFoods.forEach((food, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = food.name;
      foodSelect.appendChild(opt);
    });
    foodSelect.addEventListener("change", () => {
      const idx = Number(foodSelect.value);
      const food = curatedFoods[idx];
      if (food) {
        qtyInput.step = food.step;
        qtyInput.min = food.min;
        qtyInput.max = food.max;
        qtyInput.value = food.qty;
        qtyLabel.textContent = food.name === "Custom Entry" ? "" : `(${food.unit})`;
        updateFoodMacros(food);
      }
    });
  }

  qtyInput?.addEventListener("input", () => {
    const idx = Number(foodSelect?.value);
    const food = curatedFoods[idx];
    if (food && food.name !== "Custom Entry") {
      updateFoodMacros(food);
    }
  });

  const foodSearch = document.getElementById("foodSearch");
  if (foodSearch) {
    foodSearch.addEventListener("input", () => {
      const q = foodSearch.value.toLowerCase();
      const opts = foodSelect.options;
      for (let i = 0; i < opts.length; i++) {
        opts[i].style.display = curatedFoods[i].name.toLowerCase().includes(q) ? "" : "none";
      }
      if (opts.length > 0) foodSelect.selectedIndex = -1;
    });
  }

  document.querySelectorAll(".meal-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".meal-pill").forEach(p => p.classList.remove("is-active"));
      pill.classList.add("is-active");
    });
  });

  document.getElementById("addMealButton")?.addEventListener("click", () => {
    const today = getDateKey();
    const type = document.querySelector(".meal-pill.is-active")?.dataset.mealType || "Snack";
    const foodName = foodSelect.options[foodSelect.selectedIndex]?.textContent || "Custom";
    const qty = Number(qtyInput.value) || 1;
    const protein = Number(document.getElementById("mealProtein").value) || 0;
    const carbs = Number(document.getElementById("mealCarbs").value) || 0;
    if (!protein && !carbs) return;
    const meals = loadMeals(today);
    meals.push({ type, food: foodName, qty, protein, carbs });
    saveMeals(today, meals);
    document.getElementById("foodSearch").value = "";
    foodSelect.selectedIndex = -1;
    qtyInput.value = 1;
    qtyLabel.textContent = "";
    document.getElementById("mealProtein").value = "";
    document.getElementById("mealCarbs").value = "";
    renderMealLog();
  });
}

initNewFeatures();
