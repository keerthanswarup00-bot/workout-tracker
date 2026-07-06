const SmartNutrition = (() => {

  const C = window.CoachCalculators || {};
  const T = window.CoachEngineTypes || {};

  function getProfile(state) {
    const u = state.user || {};
    return {
      weight: Number(u.weight) || 70,
      height: Number(u.height) || 175,
      age: Number(u.age) || 25,
      gender: u.gender || "male",
      bodyFat: u.bodyFat || state.user?.bodyMeasurements?.bodyFat || null,
      goal: state.bodyGoal || u.goal || "general",
      activity: u.activityLevel || "moderate",
      experience: u.experience || "Beginner",
    };
  }

  function calculateNutrition(state) {
    const p = getProfile(state);

    const bodyFatPct = C.getBodyFatFromProfile
      ? C.getBodyFatFromProfile(p.weight, p.height, p.gender, p.age, p.bodyFat)
      : null;

    const bmi = C.calcBMI ? C.calcBMI(p.weight, p.height) : null;
    const lbm = bodyFatPct != null && C.calcLeanMass ? C.calcLeanMass(p.weight, bodyFatPct) : null;

    const tdee = C.estimateTDEE
      ? C.estimateTDEE(p.weight, p.height, p.age, p.gender, p.activity, bodyFatPct)
      : p.weight * 30;

    const calories = C.calcCalorieTarget ? C.calcCalorieTarget(tdee, p.goal) : Math.round(tdee);

    const protein = C.calcProteinRange
      ? C.calcProteinRange(p.weight, bodyFatPct, p.goal, p.experience, p.activity, tdee)
      : { low: Math.round(p.weight * 1.6), high: Math.round(p.weight * 2.2), recommended: Math.round(p.weight * 1.8), referenceWeight: p.weight, usingAdjustedWeight: false };

    const macros = C.calcMacros ? C.calcMacros(calories, p.goal, protein.recommended) : null;

    const water = C.calcWaterTarget ? C.calcWaterTarget(p.weight, p.activity, p.goal) : { ml: p.weight * 35, liters: p.weight * 35 / 1000 };

    const maintenance = C.calcMaintenanceRange ? C.calcMaintenanceRange(tdee) : { low: tdee - 100, high: tdee + 100, estimated: tdee };

    return {
      profile: p,
      bodyComposition: {
        bmi: bmi != null ? Math.round(bmi * 10) / 10 : null,
        bodyFat: bodyFatPct != null ? Math.round(bodyFatPct * 10) / 10 : null,
        leanMass: lbm != null ? Math.round(lbm * 10) / 10 : null,
        fatMass: lbm != null && p.weight ? Math.round((p.weight - lbm) * 10) / 10 : null,
      },
      energy: {
        bmr: tdee != null ? Math.round(tdee / (T.PAL_VALUES ? (T.PAL_VALUES[p.activity] || 1.55) : 1.55)) : null,
        tdee: tdee != null ? Math.round(tdee) : null,
        maintenance,
        target: calories != null ? Math.round(calories) : null,
        deficit: p.goal === "lose-fat" && tdee != null ? Math.round(tdee - calories) : 0,
        surplus: p.goal === "build-muscle" || p.goal === "strength" ? (calories != null && tdee != null ? Math.round(calories - tdee) : 0) : 0,
      },
      protein: {
        recommended: protein.recommended || 0,
        low: protein.low || 0,
        high: protein.high || 0,
        perKg: protein.recommended && protein.referenceWeight ? Math.round(protein.recommended / protein.referenceWeight * 10) / 10 : 0,
        referenceWeight: protein.referenceWeight || p.weight,
        usingAdjustedWeight: protein.usingAdjustedWeight || false,
      },
      macros: macros ? {
        protein: macros.protein,
        fat: macros.fat,
        carbs: macros.carbs,
        fiber: macros.fiber,
      } : null,
      water: {
        ml: water.ml || 0,
        liters: water.liters || 0,
      },
      _formula: {
        bmrFormula: bodyFatPct != null && lbm != null ? "Katch-McArdle" : "Mifflin-St Jeor",
        proteinMethod: protein.usingAdjustedWeight ? "adjusted-weight" : "total-weight",
        tdeeMethod: "PAL × BMR",
      },
    };
  }

  function applyToState(state) {
    const result = calculateNutrition(state);
    if (result.energy.target != null) state.calorieTarget = result.energy.target;
    if (result.protein.recommended > 0) state.proteinGoal = result.protein.recommended;
    if (result.water.ml > 0) state.waterGoal = result.water.ml;
    if (result.macros) {
      state.fatTarget = result.macros.fat.grams;
      state.carbsTarget = result.macros.carbs.grams;
    }
    state._lastNutritionCalc = {
      tdee: result.energy.tdee,
      bmi: result.bodyComposition.bmi,
      bodyFat: result.bodyComposition.bodyFat,
      leanMass: result.bodyComposition.leanMass,
      proteinRefWeight: result.protein.referenceWeight,
      usingAdjusted: result.protein.usingAdjustedWeight,
      formula: result._formula,
      calculatedAt: new Date().toISOString(),
    };
    return result;
  }

  function renderNutritionSummary(result) {
    const e = result.energy;
    const p = result.protein;
    const m = result.macros;
    const bc = result.bodyComposition;

    const goalLabel = T.GOAL_LABELS && T.GOAL_LABELS[result.profile.goal]
      ? T.GOAL_LABELS[result.profile.goal]
      : result.profile.goal || "General";

    let calLabel = "";
    if (e.deficit > 0) calLabel = `${e.deficit} cal deficit`;
    else if (e.surplus > 0) calLabel = `${e.surplus} cal surplus`;
    else calLabel = "Maintenance";

    let proteinNote = "";
    if (p.usingAdjustedWeight) {
      proteinNote = `(adjusted — using ${p.referenceWeight}kg reference weight based on body composition)`;
    }

    return {
      goalLabel,
      calLabel,
      proteinNote,
      summary: {
        calories: { target: e.target, current: 0, unit: "cal" },
        protein: { target: p.recommended, low: p.low, high: p.high, current: 0, unit: "g", note: proteinNote, perKg: p.perKg },
        carbs: m ? { target: m.carbs.grams, current: 0, unit: "g" } : null,
        fat: m ? { target: m.fat.grams, current: 0, unit: "g" } : null,
        water: { target: result.water.ml, current: 0, unit: "ml" },
        fiber: m ? { target: m.fiber.grams, current: 0, unit: "g" } : null,
      },
      body: {
        bmi: bc.bmi,
        bodyFat: bc.bodyFat,
        leanMass: bc.leanMass,
        tdee: e.tdee,
        bmr: e.bmr,
      },
    };
  }

  function renderNutritionCardHTML(result) {
    const s = renderNutritionSummary(result);
    const calStr = s.summary.calories.target ? `${s.summary.calories.target.toLocaleString()} ${s.summary.calories.unit}` : "—";
    const proStr = s.summary.protein.target ? `${s.summary.protein.target}g` : "—";
    const carbStr = s.summary.carbs ? `${s.summary.carbs.target}g` : "—";
    const fatStr = s.summary.fat ? `${s.summary.fat.target}g` : "—";
    const waterStr = s.summary.water.target ? `${Math.round(s.summary.water.target)}ml` : "—";

    let compStr = "";
    if (s.body.bodyFat != null && s.body.leanMass != null) {
      compStr = `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.5rem">
        ${s.body.bodyFat}% BF · ${s.body.leanMass}kg LBM · BMI ${s.body.bmi}
      </div>`;
    }

    return `<div class="today-card col">
      <div class="tc-header">
        <div class="tc-header-left">
          <span class="tc-title">Smart Nutrition</span>
          <span class="tc-sub">${s.goalLabel} · ${calStr} ${s.calLabel}</span>
        </div>
      </div>
      <div class="tc-macro-grid">
        <div>
          <div class="tc-macro-row"><span style="color:#ff6b6b">Protein</span><span>${proStr} <span style="font-size:0.7rem;color:var(--text-tertiary)">${s.summary.protein.perKg}g/kg</span></span></div>
          ${s.summary.protein.note ? `<div style="font-size:0.65rem;color:var(--text-tertiary);line-height:1.3">${s.summary.protein.note}</div>` : ""}
        </div>
        <div><div class="tc-macro-row"><span style="color:#ffd43b">Carbs</span><span>${carbStr}</span></div></div>
        <div><div class="tc-macro-row"><span style="color:#69db7c">Fat</span><span>${fatStr}</span></div></div>
        <div><div class="tc-macro-row"><span style="color:#74c0fc">Water</span><span>${waterStr}</span></div></div>
      </div>
      ${compStr}
    </div>`;
  }

  return {
    calculateNutrition,
    applyToState,
    renderNutritionSummary,
    renderNutritionCardHTML,
    getProfile,
  };
})();

if (typeof window !== "undefined") window.SmartNutrition = SmartNutrition;
