// ===== PR SYSTEM =====
// Stores PRs inside state.prs with per-exercise records and a flat history array.

function getExercisePRs(exerciseName) {
  if (!state.prs) state.prs = {};
  if (!state.prs[exerciseName]) {
    state.prs[exerciseName] = { weightPR: null, repPR: null, volumePR: null, est1RM: null, history: [] };
  }
  return state.prs[exerciseName];
}

function setExercisePRs(exerciseName, data) {
  if (!state.prs) state.prs = {};
  state.prs[exerciseName] = data;
}

function detectPR(exerciseName, weight, reps, sessionId, dateKey) {
  const w = Number(weight);
  const r = Number(reps) || 0;
  if (!w || w <= 0) return null;
  const vol = w * r;
  const est = calc1RM(w, r);
  const current = getExercisePRs(exerciseName);
  const results = [];
  const now = new Date().toISOString();

  // Weight PR
  if (!current.weightPR || w > current.weightPR.value) {
    results.push({ type: "weight", value: w, weight: w, reps: r, volume: vol, sessionId, date: dateKey, exerciseName, createdAt: now });
  }

  // Rep PR (same weight only)
  if (!current.repPR || (w === current.repPR.weight && r > current.repPR.value)) {
    results.push({ type: "reps", value: r, weight: w, reps: r, volume: vol, sessionId, date: dateKey, exerciseName, createdAt: now });
  }

  // Volume PR
  if (!current.volumePR || vol > current.volumePR.value) {
    results.push({ type: "volume", value: vol, weight: w, reps: r, volume: vol, sessionId, date: dateKey, exerciseName, createdAt: now });
  }

  // e1RM PR (stored but not celebrated directly)
  const isEst1RM = !current.est1RM || est > current.est1RM.value;

  if (results.length === 0 && !isEst1RM) return null;

  // Update state
  const updated = getExercisePRs(exerciseName);
  results.forEach((pr) => {
    if (pr.type === "weight") updated.weightPR = { value: pr.value, reps: pr.reps, date: pr.date, sessionId: pr.sessionId };
    if (pr.type === "reps") updated.repPR = { value: pr.value, weight: pr.weight, date: pr.date, sessionId: pr.sessionId };
    if (pr.type === "volume") updated.volumePR = { value: pr.value, weight: pr.weight, reps: pr.reps, date: pr.date, sessionId: pr.sessionId };
    updated.history.push(pr);
  });
  if (isEst1RM) {
    updated.est1RM = { value: est, weight: w, reps: r, date: dateKey, sessionId: sessionId };
  }
  setExercisePRs(exerciseName, updated);

  return results.length > 0 ? results : null;
}

function storePR(exerciseName, type, value, weight, reps, sessionId, dateKey) {
  if (!state.prs) state.prs = {};
  if (!state.prs[exerciseName]) {
    state.prs[exerciseName] = { weightPR: null, repPR: null, volumePR: null, est1RM: null, history: [] };
  }
  const current = state.prs[exerciseName];
  const vol = weight * reps;
  const now = new Date().toISOString();
  const entry = { type, value, weight, reps, volume: vol, sessionId, date: dateKey, exerciseName, createdAt: now };
  if (type === "weight") current.weightPR = { value, reps, date: dateKey, sessionId };
  if (type === "reps") current.repPR = { value, weight, date: dateKey, sessionId };
  if (type === "volume") current.volumePR = { value, weight, reps, date: dateKey, sessionId };
  current.history.push(entry);
}

function getPRsForExercise(exerciseName) {
  const data = getExercisePRs(exerciseName);
  return {
    weightPR: data.weightPR,
    repPR: data.repPR,
    volumePR: data.volumePR,
    est1RM: data.est1RM,
    history: data.history || [],
  };
}

function getAllPRs() {
  if (!state.prs) return {};
  return state.prs;
}

function getRecentPRs(n) {
  if (!state.prs) return [];
  const all = [];
  for (const [exName, data] of Object.entries(state.prs)) {
    (data.history || []).forEach((h) => all.push({ ...h, exerciseName: exName }));
  }
  return all
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    })
    .slice(0, n);
}

function getTodayPRs(dateKey) {
  if (!state.prs) return [];
  const result = [];
  for (const [exName, data] of Object.entries(state.prs)) {
    (data.history || []).forEach((h) => {
      if (h.date === dateKey) result.push({ ...h, exerciseName: exName });
    });
  }
  return result;
}

function getPRCount() {
  if (!state.prs) return 0;
  let count = 0;
  for (const data of Object.values(state.prs)) {
    count += (data.history || []).length;
  }
  return count;
}

function showPRToast(prArray) {
  if (!prArray || prArray.length === 0) return;
  if (state.prNotifications === false) return;
  const pr = prArray[0];
  const typeLabel = pr.type === "weight" ? "Weight" : pr.type === "reps" ? "Rep" : "Volume";
  const name = (pr.exerciseName || "").replace(/([A-Z])/g, " $1").trim();
  const msg = `🏆 New ${typeLabel} PR: ${name} · ${pr.weight} kg × ${pr.reps}`;
  showSinglePRToast(msg);
}

function showSinglePRToast(msg) {
  const toast = document.getElementById("prToast");
  if (!toast) return;
  const msgEl = document.getElementById("prToastMsg");
  if (msgEl) msgEl.textContent = msg;
  toast.classList.remove("is-hidden");
  toast.style.animation = "none";
  void toast.offsetHeight;
  toast.style.animation = "prPopIn 0.2s ease";
  if (window.prToastTimer) clearTimeout(window.prToastTimer);
  window.prToastTimer = setTimeout(() => {
    toast.classList.add("is-hidden");
  }, 3000);
}

function migrateLegacyPRs() {
  try {
    const old = JSON.parse(localStorage.getItem("wl_prs"));
    if (!old || typeof old !== "object") return false;
    if (state.prs && Object.keys(state.prs).length > 0) return false;
    let migrated = false;
    for (const [exName, data] of Object.entries(old)) {
      if (!data.weight && !data.reps) continue;
      const current = getExercisePRs(exName);
      if (data.weight) {
        current.weightPR = { value: data.weight, reps: data.reps || 0, date: data.date || "", sessionId: "" };
        current.history.push({
          type: "weight", value: data.weight, weight: data.weight, reps: data.reps || 0,
          volume: data.weight * (data.reps || 0), sessionId: "", date: data.date || "",
          exerciseName: exName, createdAt: "",
        });
        migrated = true;
      }
      if (data.bestSetVol) {
        current.volumePR = { value: data.bestSetVol, weight: data.weight || 0, reps: data.reps || 0, date: data.bestSetDate || data.date || "", sessionId: "" };
      }
      if (data.est1RM) {
        current.est1RM = { value: data.est1RM, weight: data.weight || 0, reps: data.reps || 0, date: data.est1RMDate || data.date || "", sessionId: "" };
      }
      setExercisePRs(exName, current);
    }
    if (migrated) {
      localStorage.removeItem("wl_prs");
      saveState();
    }
    return migrated;
  } catch { return false; }
}
