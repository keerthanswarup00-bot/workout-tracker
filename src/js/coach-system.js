// ============================================================
// STRIV COACH SYSTEM — The Coach Operating System
// ============================================================
// This is the foundation layer for all Coach features.
// Coach NEVER owns data — it reads from existing systems.
// ============================================================

const CoachSystem = (() => {
  'use strict';

  // ===== ROUTER =====
  const ROUTES = {
    home: { label: "Home", icon: "🏠" },
    learn: { label: "Learning", icon: "📚", parent: "home" },
    exercises: { label: "Exercises", icon: "💪", parent: "home" },
    muscles: { label: "Muscles", icon: "🦵", parent: "home" },
    recovery: { label: "Recovery", icon: "🔄", parent: "home" },
    nutrition: { label: "Nutrition", icon: "🥗", parent: "home" },
    goals: { label: "Goals", icon: "🎯", parent: "home" },
    challenges: { label: "Challenges", icon: "🏆", parent: "home" },
    insights: { label: "Insights", icon: "📊", parent: "home" },
    search: { label: "Search", icon: "🔍", parent: "home" },
    settings: { label: "Coach Settings", icon: "⚙️", parent: "home" },
  };

  let _currentRoute = "home";
  let _routeHistory = [];
  let _routeParams = {};
  let _listeners = [];

  function getRoutes() { return ROUTES; }

  function getCurrentRoute() { return _currentRoute; }

  function getRouteParams() { return { ..._routeParams }; }

  function getRouteHistory() { return [..._routeHistory]; }

  function navigate(route, params, pushHistory) {
    const parts = route.split("/");
    const base = parts[0];
    if (!ROUTES[base] && base !== "home") return;

    if (pushHistory !== false && _currentRoute !== "home" && _currentRoute !== route) {
      _routeHistory.push(_currentRoute);
    }
    _currentRoute = route;
    _routeParams = params || {};

    try {
      history.pushState({ coachRoute: route, coachParams: _routeParams }, "", "#coach/" + route);
    } catch (e) { /* ignore */ }

    _notify();
  }

  function back() {
    const prev = _routeHistory.pop();
    if (prev) {
      navigate(prev, {}, false);
    } else {
      navigate("home", {}, false);
    }
  }

  function canGoBack() { return _routeHistory.length > 0; }

  function onChange(fn) { _listeners.push(fn); }

  function _notify() {
    _listeners.forEach(function(fn) { fn(_currentRoute, _routeParams); });
  }

  function handlePopState(e) {
    const state = e.state;
    if (state && state.coachRoute) {
      _currentRoute = state.coachRoute;
      _routeParams = state.coachParams || {};
      _notify();
    }
  }

  // Listen for browser back/forward
  window.addEventListener("popstate", handlePopState);

  // ===== DATA LAYER (Read-only) =====
  const Data = {
    getProfile() {
      return typeof getProfile === "function" ? getProfile() : (state.user || {});
    },

    getSessions() {
      return (state.sessions || []).filter(function(s) { return s.finishedAt; });
    },

    getWeightLog() {
      return state.weightLog || [];
    },

    getTodaySession() {
      return typeof getTodaySession === "function" ? getTodaySession() : null;
    },

    getStreak() {
      return typeof getStreak === "function" ? getStreak() : 0;
    },

    getLongestStreak() {
      return typeof getLongestStreak === "function" ? getLongestStreak() : 0;
    },

    getGreeting() {
      return typeof getGreeting === "function" ? getGreeting() : { text: "Hello", emoji: "👋" };
    },

    getDailyMessage() {
      return typeof getDailyMessage === "function" ? getDailyMessage() : "Keep going!";
    },

    getLatestWeight() {
      return typeof latestWeight === "function" ? latestWeight() : null;
    },

    getWeightText() {
      return typeof getLastWeightText === "function" ? getLastWeightText() : "";
    },

    getDaysSinceWeight() {
      return typeof getDaysSinceLastWeight === "function" ? getDaysSinceLastWeight() : null;
    },

    getGoalCenterAll() {
      return typeof GoalCenter !== "undefined" ? GoalCenter.getAll() : null;
    },

    getCoachEngine() {
      try {
        return typeof CoachEngine !== "undefined" ? CoachEngine.runAll() : null;
      } catch (e) {
        return null;
      }
    },

    getSettings() {
      return {
        theme: state.theme || "dark",
        accent: state.accent || "green",
        weightUnit: state.weightUnit || "kg",
        heightUnit: state.heightUnit || "cm",
        calorieTarget: state.calorieTarget || 2000,
        proteinGoal: state.proteinGoal || 146,
        waterGoal: state.waterGoal || 2500,
        autoRest: state.autoRest !== false,
        autoNext: state.autoNext !== false,
        focusMode: state.focusMode || false,
        compactMode: state.compactMode || false,
        screenAwake: state.screenAwake || false,
        autoWarmup: state.autoWarmup !== false,
        warmupReminder: state.warmupReminder !== false,
        stretchReminder: state.stretchReminder !== false,
        autoSummary: state.autoSummary !== false,
        autoCooldown: state.autoCooldown || false,
        showTomorrowPreview: state.showTomorrowPreview || false,
        showWorkoutProgress: state.showWorkoutProgress !== false,
        restTimer: state.restTimer || 90,
        weightInc: state.weightInc || 1.25,
        weightReminder: state.weightReminder !== false,
        nutritionReminder: state.nutritionReminder !== false,
        weeklyReview: state.weeklyReview !== false,
        coachActivated: state.coachActivated || false,
      };
    },

    getPRCount() {
      return typeof getPRCount === "function" ? getPRCount() : 0;
    },

    getMonthlyStats(month, year) {
      return typeof getMonthlyStats === "function" ? getMonthlyStats(month, year) : { count: 0, rate: 0 };
    },

    getBodyMeasurements() {
      const u = state.user || {};
      return u.bodyMeasurements || {};
    },

    getWaterIntake(dateKey) {
      const dl = state.dailyLogs || {};
      const entry = dl[dateKey || getDateKey()];
      return entry ? (entry.water || 0) : 0;
    },

    getCalories(dateKey) {
      const dl = state.dailyLogs || {};
      const entry = dl[dateKey || getDateKey()];
      return entry ? (entry.calories || 0) : 0;
    },

    getProtein(dateKey) {
      const dl = state.dailyLogs || {};
      const entry = dl[dateKey || getDateKey()];
      return entry ? (entry.protein || 0) : 0;
    },

    getProgramStatus() {
      const plan = (() => {
        const p = state.plan || null;
        if (p && p.length > 0) return p;
        try {
          const custom = JSON.parse(localStorage.getItem("wl_custom_program"));
          if (custom && custom.length > 0) return custom;
        } catch (e) { /* ignore */ }
        return null;
      })();
      if (!plan) return null;

      const sessions = Data.getSessions();
      const totalDays = plan.length;
      const completedDays = sessions.filter(function(s) {
        return plan.some(function(w) { return w.id === s.workoutId; });
      }).length;
      const lastSession = sessions.length > 0 ? sessions.slice().sort(function(a, b) {
        return b.dateKey.localeCompare(a.dateKey);
      })[0] : null;

      const daysSinceLast = lastSession ? (() => {
        const diff = new Date() - new Date(lastSession.dateKey);
        return Math.floor(diff / 86400000);
      })() : null;

      return {
        plan: plan,
        totalDays: totalDays,
        completedDays: completedDays,
        lastSessionDaysAgo: daysSinceLast,
        lastWorkoutName: lastSession ? lastSession.workoutName || (plan.find(function(w) { return w.id === lastSession.workoutId; }) || {}).name : null,
      };
    },
  };

  // ===== COMPONENT LIBRARY =====
  const Components = {
    sectionHeader(label, opts) {
      opts = opts || {};
      return '<div class="co-section-header' + (opts.className ? ' ' + opts.className : '') + '">' +
        (opts.icon ? '<span class="co-header-icon">' + opts.icon + '</span>' : '') +
        '<span class="co-header-label">' + label + '</span>' +
        (opts.action ? '<button class="co-header-action" data-co-action="' + opts.action + '">' + (opts.actionLabel || "See All →") + '</button>' : '') +
        '</div>';
    },

    card(content, opts) {
      opts = opts || {};
      return '<div class="co-card' + (opts.className ? ' ' + opts.className : '') + '"' +
        (opts.click ? ' data-co-click="' + opts.click + '"' : '') +
        (opts.route ? ' data-co-route="' + opts.route + '"' : '') +
        '>' +
        (opts.title ? '<div class="co-card-title">' + opts.title + '</div>' : '') +
        '<div class="co-card-body">' + content + '</div>' +
        '</div>';
    },

    insightCard(text, type) {
      const icons = { positive: "🟢", warning: "🟡", red: "🔴", blue: "🔵", info: "🔵" };
      const icon = icons[type] || "🔵";
      const cls = type === "positive" ? "co-insight-positive" : type === "warning" ? "co-insight-warning" : type === "red" ? "co-insight-red" : "co-insight-blue";
      return '<div class="co-insight-card ' + cls + '"><span class="co-insight-icon">' + icon + '</span><span class="co-insight-text">' + text + '</span></div>';
    },

    statBox(value, label, opts) {
      opts = opts || {};
      return '<div class="co-stat-box' + (opts.className ? ' ' + opts.className : '') + '">' +
        '<div class="co-stat-value" style="' + (opts.color ? 'color:' + opts.color : '') + '">' + value + '</div>' +
        '<div class="co-stat-label">' + label + '</div>' +
        '</div>';
    },

    progressRing(score, max, size, stroke) {
      size = size || 72;
      stroke = stroke || 5;
      const r = (size / 2) - stroke;
      const circ = 2 * Math.PI * r;
      const pct = Math.min(100, Math.max(0, (score / max) * 100));
      const offset = circ - (pct / 100) * circ;
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
        '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" stroke="var(--border)" stroke-width="' + stroke + '" opacity="0.3"/>' +
        '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="' + stroke + '" stroke-linecap="round" ' +
        'stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 ' + (size / 2) + ' ' + (size / 2) + ')"/>' +
        '</svg>';
    },

    progressBar(pct, opts) {
      opts = opts || {};
      pct = Math.min(100, Math.max(0, pct));
      return '<div class="co-progress-bar' + (opts.className ? ' ' + opts.className : '') + '">' +
        '<div class="co-progress-fill" style="width:' + pct + '%' + (opts.color ? ';background:' + opts.color : '') + '"></div>' +
        '</div>';
    },

    icon(icon, size) {
      return '<span class="co-icon" style="' + (size ? 'font-size:' + size : '') + '">' + icon + '</span>';
    },

    clickableRow(label, value, route) {
      return '<div class="co-clickable-row" data-co-route="' + route + '">' +
        '<span class="co-row-label">' + label + '</span>' +
        '<span class="co-row-value">' + (value || "") + ' →</span>' +
        '</div>';
    },

    badge(text, type) {
      type = type || "default";
      return '<span class="co-badge co-badge-' + type + '">' + text + '</span>';
    },

    emptyState(title, desc, action) {
      return '<div class="co-empty-state">' +
        '<div class="co-empty-icon">📭</div>' +
        '<div class="co-empty-title">' + title + '</div>' +
        (desc ? '<div class="co-empty-desc">' + desc + '</div>' : '') +
        (action ? '<button class="co-empty-action" data-co-action="' + action + '">' + action + '</button>' : '') +
        '</div>';
    },

    loadingState() {
      return '<div class="co-loading"><div class="co-spinner"></div><div class="co-loading-text">Loading...</div></div>';
    },

    errorState(msg) {
      return '<div class="co-error"><span class="co-error-icon">⚠️</span><span class="co-error-text">' + (msg || "Something went wrong") + '</span></div>';
    },

    grid(items, cols) {
      cols = cols || 2;
      return '<div class="co-grid co-grid-' + cols + '">' + items.join("") + '</div>';
    },

    chip(text, active) {
      return '<span class="co-chip' + (active ? ' co-chip-active' : '') + '">' + text + '</span>';
    },

    divider() {
      return '<div class="co-divider"></div>';
    },
  };

  // ===== NAVIGATION BAR =====
  function renderNav() {
    const navItems = [
      { id: "home", label: "Home", icon: "🏠" },
      { id: "learn", label: "Learn", icon: "📚" },
      { id: "exercises", label: "Exercises", icon: "💪" },
      { id: "recovery", label: "Recovery", icon: "🔄" },
      { id: "nutrition", label: "Nutrition", icon: "🥗" },
      { id: "goals", label: "Goals", icon: "🎯" },
      { id: "insights", label: "Insights", icon: "📊" },
      { id: "search", label: "Search", icon: "🔍" },
    ];
    const base = _currentRoute.split("/")[0];
    return '<nav class="co-nav">' +
      navItems.map(function(item) {
        return '<button class="co-nav-item' + (base === item.id ? ' is-active' : '') + '" data-co-nav="' + item.id + '">' +
          '<span class="co-nav-icon">' + item.icon + '</span>' +
          '<span class="co-nav-label">' + item.label + '</span>' +
          '</button>';
      }).join("") +
      '</nav>';
  }

  // ===== ROUTE HANDLER =====
  function render(container) {
    if (!container) return;
    const base = _currentRoute.split("/")[0];

    let html = '<div class="co-page">';
    html += renderNav();

    // Back button breadcrumb
    if (_currentRoute !== "home") {
      html += '<div class="co-breadcrumb"><button class="co-back-btn" data-co-action="back">← Back</button>';
      const parts = _currentRoute.split("/");
      html += parts.map(function(p, i) { return '<span class="co-breadcrumb-item">' + (ROUTES[p] ? ROUTES[p].label : p) + '</span>'; }).join(" / ");
      html += '</div>';
    }

    html += '<div class="co-content">';

    try {
      switch (base) {
        case "home": html += renderHome(); break;
        case "learn": html += renderLearn(); break;
        case "exercises": html += renderExercises(); break;
        case "muscles": html += renderMuscles(); break;
        case "recovery": html += renderRecovery(); break;
        case "nutrition": html += renderNutrition(); break;
        case "goals": html += renderGoals(); break;
        case "challenges": html += renderChallenges(); break;
        case "insights": html += renderInsights(); break;
        case "search": html += renderSearch(); break;
        case "settings": html += renderCoachSettings(); break;
        default: html += renderHome(); break;
      }
    } catch (e) {
      html += Components.errorState("Something went wrong loading this section. Please try again.");
    }

    html += '</div></div>';
    container.innerHTML = html;
    bindEvents(container);
  }

  // ===== EVENT BINDING =====
  function bindEvents(container) {
    // Nav clicks
    container.querySelectorAll("[data-co-nav]").forEach(function(el) {
      el.addEventListener("click", function() { navigate(el.dataset.coNav); });
    });

    // Route clicks
    container.querySelectorAll("[data-co-route]").forEach(function(el) {
      el.addEventListener("click", function() { navigate(el.dataset.coRoute); });
    });

    // Action clicks
    container.querySelectorAll("[data-co-action]").forEach(function(el) {
      el.addEventListener("click", function() {
        const action = el.dataset.coAction;
        if (action === "back") { back(); }
        else if (action === "openGoalCenter") { openGoalCenter(); }
        else if (action === "generateWorkout") { openGenerateWorkout(); }
        else if (action === "viewProgress") { activateTab("progress"); }
        else if (action === "viewWorkout") { activateTab("sets"); }
        else if (action === "logWeight") { openWeightLogModal && openWeightLogModal(); }
        else if (action === "startWorkout") { openNewWorkoutGenerator ? openNewWorkoutGenerator() : activateTab("sets"); }
      });
    });
  }

  // ===== MODULE: HOME =====
  function renderHome() {
    const coach = Data.getCoachEngine();
    const gc = Data.getGoalCenterAll();
    const profile = Data.getProfile();
    const sessions = Data.getSessions();
    const weight = Data.getLatestWeight();
    const streak = Data.getStreak();
    const greeting = Data.getGreeting();
    const gMsg = Data.getDailyMessage();
    const settings = Data.getSettings();

    if (!coach) {
      var fallbackCoach = {
        daily: { name: profile.name || "Athlete", coachMessage: gMsg || "Keep showing up — progress takes time." },
        recovery: { score: 50, label: "Moderate", assessments: [] },
        goalStrategy: { label: "Stay active", progress: 0, milestones: [] },
        insights: [],
        progress: { weeklyWorkouts: weekSessions, weeklyVolume: weekVolume, totalWorkouts: sessions.length },
        reports: [],
        education: [{ title: "Trust the Process", summary: "Consistency matters more than perfection. Show up every day." }],
      };
      coach = fallbackCoach;
    }

    const dc = coach.daily;
    const rec = coach.recovery;
    const gs = coach.goalStrategy;
    const ins = coach.insights;
    const prog = coach.progress;
    const rep = coach.reports;

    // Recovery readiness
    const rcScore = rec.score || 0;
    const rcLabel = rec.label || "Unknown";
    const rcColor = rcScore >= 75 ? "green" : rcScore >= 60 ? "orange" : "red";

    // Weekly stats
    const weekSessions = sessions.filter(function(s) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(s.dateKey) >= weekAgo;
    }).length;
    const weekVolume = sessions.filter(function(s) {
      const twoWeeks = new Date();
      twoWeeks.setDate(twoWeeks.getDate() - 14);
      return new Date(s.dateKey) >= twoWeeks;
    }).reduce(function(sum, s) {
      return sum + (s.exercises || []).reduce(function(es, ex) {
        return es + (ex.sets || []).reduce(function(ss, set) {
          return ss + (set.done && Number(set.weight) > 0 ? Number(set.weight) * (Number(set.reps) || 0) : 0);
        }, 0);
      }, 0);
    }, 0);

    // Daily macros
    const dateKey = typeof getDateKey === "function" ? getDateKey() : new Date().toISOString().slice(0, 10);
    const waterCurrent = Data.getWaterIntake(dateKey);
    const calCurrent = Data.getCalories(dateKey);
    const proteinCurrent = Data.getProtein(dateKey);
    const waterPct = Math.min(100, Math.round((waterCurrent / settings.waterGoal) * 100));
    const calPct = Math.min(100, Math.round((calCurrent / settings.calorieTarget) * 100));
    const proteinPct = Math.min(100, Math.round((proteinCurrent / settings.proteinGoal) * 100));

    // Today's lesson
    const lessons = coach.education || [];
    const todaysLesson = lessons.length > 0 ? lessons[Math.floor(Math.random() * lessons.length)] : null;

    let html = '';

    // Coach Hero
    html += '<div class="co-home-hero">';
    html += '<div class="co-hero-greeting">' + greeting.text + ', <strong>' + (profile.name || "Athlete") + '</strong></div>';
    html += '<div class="co-hero-message">' + (dc.coachMessage || gMsg) + '</div>';
    html += '<div class="co-hero-badges">';
    if (dc.goalLabel) html += Components.badge(dc.goalLabel, "goal");
    if (dc.status === "on_track") html += Components.badge("On Track", "success");
    else if (dc.status) html += Components.badge("Needs Attention", "warning");
    html += '</div></div>';

    // Quick Stats Row
    html += '<div class="co-stats-row">';
    html += Components.statBox(weekSessions, "Workouts");
    html += Components.statBox(streak + (typeof getLongestStreak === "function" ? "/" + getLongestStreak() : ""), "Streak");
    html += Components.statBox(weekVolume >= 1000 ? (weekVolume / 1000).toFixed(1) + "k" : weekVolume, "Volume", { className: "co-stat-wide" });
    html += Components.statBox(weight ? (weight.weight || weight) + "kg" : "—", "Weight");
    html += '</div>';

    // Program Status Card
    const programStatus = Data.getProgramStatus();
    if (programStatus) {
      const daysLeft = programStatus.totalDays - programStatus.completedDays;
      const pctComplete = Math.min(100, Math.round((programStatus.completedDays / programStatus.totalDays) * 100));
      const weekLabel = ins && ins.insights ? ins.insights.find(function(i) { return i.text && i.text.indexOf("week") > -1; }) : null;
      html += '<div class="co-duo">';
      html += Components.card(
        '<div class="co-program-mini">' +
        '<div class="co-program-header">' +
        '<span class="co-program-label">Program Progress</span>' +
        Components.progressBar(pctComplete) +
        '</div>' +
        '<div class="co-program-stats">' +
        '<div class="co-program-stat"><span class="co-program-stat-value">' + programStatus.completedDays + '</span><span class="co-program-stat-label">done</span></div>' +
        '<div class="co-program-stat"><span class="co-program-stat-value">' + daysLeft + '</span><span class="co-program-stat-label">left</span></div>' +
        '<div class="co-program-stat"><span class="co-program-stat-value">' + pctComplete + '%</span><span class="co-program-stat-label">complete</span></div>' +
        '</div>' +
        (programStatus.lastWorkoutName ? '<div class="co-program-last">Last: ' + programStatus.lastWorkoutName + '</div>' : '') +
        '<button class="co-card-action" data-co-route="workout">View Program →</button>' +
        '</div>',
        { className: "co-card-program" }
      );
      html += Components.card(
        '<div class="co-program-mini">' +
        '<div class="co-program-label">' + (weekLabel ? weekLabel.text : 'Active Program') + '</div>' +
        '<div class="co-program-next">' +
        '<div class="co-program-next-label">Tap to start today\u2019s workout</div>' +
        '<button class="co-card-action" data-co-action="startWorkout">Start →</button>' +
        '</div>' +
        '</div>',
        { className: "co-card-program-next" }
      );
      html += '</div>';
    }

    // Recovery + Goal Progress
    html += '<div class="co-duo">';

    html += Components.card(
      '<div class="co-recovery-mini">' +
      Components.progressRing(rcScore, 100, 56, 4) +
      '<div class="co-recovery-info">' +
      '<div class="co-recovery-label">' + rcLabel + '</div>' +
      '<div class="co-recovery-score" style="color:var(--' + rcColor + ')">' + rcScore + '/100</div>' +
      (rec.coachMessage ? '<div class="co-recovery-msg">' + rec.coachMessage + '</div>' : '') +
      '<button class="co-card-action" data-co-route="recovery">Details →</button>' +
      '</div></div>',
      { className: "co-card-recovery", route: "recovery" }
    );

    // Goal progress
    const gp = (gc && gc.profile && gc.pace) ? gc.pace.achieved : (dc.goalProgress || 0);
    const gl = (gc && gc.profile) ? (gc.health ? gc.health.label : "Inactive") : (dc.status || "No Goal");
    html += Components.card(
      '<div class="co-goal-mini">' +
      '<div class="co-goal-header"><span class="co-goal-type">' + (dc.goalLabel || "No Goal") + '</span><span class="co-goal-status">' + gl + '</span></div>' +
      Components.progressBar(gp) +
      '<div class="co-goal-details">' +
      (dc.startWeight && dc.targetWeight ? '<span>' + Math.round(dc.curWeight) + 'kg → ' + Math.round(dc.targetWeight) + 'kg</span>' : '') +
      '<span>' + Math.round(gp) + '%</span></div>' +
      '<button class="co-card-action" data-co-route="goals">View Goals →</button>' +
      '</div>',
      { className: "co-card-goal", route: "goals" }
    );

    html += '</div>';

    // Today's Focus
    if (dc.dailyFocus && dc.dailyFocus.length > 0) {
      html += Components.sectionHeader("Today's Focus", { icon: "🎯" });
      html += '<div class="co-focus-list">' +
        dc.dailyFocus.map(function(p) {
          return '<div class="co-focus-item' + (p.done ? ' co-focus-done' : '') + '">' +
            '<span class="co-focus-check">' + (p.done ? "✓" : "○") + '</span>' +
            '<span class="co-focus-label">' + p.label + '</span>' +
            (p.target ? '<span class="co-focus-target">' + (p.current || 0) + '/' + p.target + '</span>' : '') +
            '</div>';
        }).join("") +
        '</div>';
    }

    // Nutrition summary
    html += Components.sectionHeader("Today's Nutrition", { icon: "🥗" });
    html += '<div class="co-nutrition-row">';
    html += Components.card(
      '<div class="co-nutri-mini">' +
      Components.progressRing(calPct, 100, 48, 4) +
      '<div class="co-nutri-info"><span class="co-nutri-value">' + calCurrent + '</span><span class="co-nutri-label">of ' + settings.calorieTarget + ' cal</span></div></div>',
      { className: "co-card-nutri" }
    );
    html += Components.card(
      '<div class="co-nutri-mini">' +
      Components.progressRing(proteinPct, 100, 48, 4) +
      '<div class="co-nutri-info"><span class="co-nutri-value">' + proteinCurrent + 'g</span><span class="co-nutri-label">of ' + settings.proteinGoal + 'g protein</span></div></div>',
      { className: "co-card-nutri" }
    );
    html += Components.card(
      '<div class="co-nutri-mini">' +
      Components.progressRing(waterPct, 100, 48, 4) +
      '<div class="co-nutri-info"><span class="co-nutri-value">' + waterCurrent + 'ml</span><span class="co-nutri-label">of ' + settings.waterGoal + 'ml water</span></div></div>',
      { className: "co-card-nutri" }
    );
    html += '</div>';

    // Coach Insights
    if (ins && ins.insights && ins.insights.length > 0) {
      html += Components.sectionHeader("Coach Insights", { icon: "💡" });
      html += '<div class="co-insights-list">' +
        ins.insights.slice(0, 3).map(function(i) { return Components.insightCard(i.text, i.type || "info"); }).join("") +
        '</div>';
    }

    // Today's Lesson
    if (todaysLesson) {
      html += Components.sectionHeader("Today's Lesson", { icon: "📚", action: "learn", actionLabel: "All Lessons →" });
      html += Components.card(
        '<div class="co-lesson-mini"><div class="co-lesson-title">' + todaysLesson.title + '</div>' +
        (todaysLesson.summary ? '<div class="co-lesson-summary">' + todaysLesson.summary + '</div>' : '') +
        (todaysLesson.tip ? '<div class="co-lesson-tip">💡 ' + todaysLesson.tip + '</div>' : '') +
        '</div>',
        { route: "learn" }
      );
    }

    // Quick Actions
    html += Components.sectionHeader("Quick Actions", { icon: "⚡" });
    html += '<div class="co-actions-row">';
    html += '<button class="co-action-btn" data-co-action="startWorkout">🏋️ Start Workout</button>';
    html += '<button class="co-action-btn" data-co-action="generateWorkout">🤖 Generate</button>';
    html += '<button class="co-action-btn" data-co-action="logWeight">⚖️ Log Weight</button>';
    html += '<button class="co-action-btn" data-co-action="viewProgress">📊 Progress</button>';
    html += '</div>';

    // Weekly Report Summary
    if (rep && rep.weekly) {
      html += Components.sectionHeader("Weekly Report", { icon: "📋", action: "insights" });
      html += Components.card(
        '<div class="co-report-mini">' +
        '<div class="co-report-score">Coach Score: <strong>' + (rep.weekly.coachScore || "—") + '/100</strong></div>' +
        (rep.weekly.assessment ? '<div class="co-report-assessment">' + rep.weekly.assessment + '</div>' : '') +
        (rep.weekly.biggestWin ? '<div class="co-report-win">🏆 ' + rep.weekly.biggestWin + '</div>' : '') +
        '</div>',
        { route: "insights" }
      );
    }

    return html;
  }

  // ===== MODULE STUBS =====
  function renderLearn() {
    const coach = Data.getCoachEngine();
    const lessons = (coach && coach.education) || [];

    if (!lessons.length) {
      return Components.emptyState("No Lessons Available", "Learning content will appear here based on your goals and progress.");
    }

    let html = Components.sectionHeader("Learning Center", { icon: "📚" });
    html += '<div class="co-lesson-grid">';
    lessons.forEach(function(lesson) {
      html += Components.card(
        '<div class="co-lesson-item"><div class="co-lesson-icon">' + (lesson.icon || "📖") + '</div>' +
        '<div class="co-lesson-content"><div class="co-lesson-name">' + (lesson.title || lesson.category || "Lesson") + '</div>' +
        (lesson.summary ? '<div class="co-lesson-desc">' + lesson.summary + '</div>' : '') +
        (lesson.tip ? '<div class="co-lesson-tip">💡 ' + lesson.tip + '</div>' : '') +
        '</div></div>',
        { className: "co-card-lesson" }
      );
    });
    html += '</div>';
    return html;
  }

  function renderExercises() {
    let html = Components.sectionHeader("Exercise Library", { icon: "💪" });

    const exercises = typeof EXERCISE_LIBRARY !== "undefined" ? EXERCISE_LIBRARY : null;

    if (!exercises || !exercises.length) {
      html += Components.loadingState();
      return html;
    }

    try {
      // Group by category
      const cats = {};
      exercises.forEach(function(ex) {
        var cat = ex.category || "General";
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(ex);
      });
      var catKeys = Object.keys(cats);

      // Search bar
      html += '<div class="co-search-bar"><input type="text" id="coExSearch" class="co-search-input" placeholder="Search exercises..." autocomplete="off" /></div>';

      catKeys.forEach(function(cat) {
        html += Components.sectionHeader(cat, { icon: "💪" });
        html += '<div class="co-ex-grid" data-cat="' + cat + '">';
        cats[cat].slice(0, 8).forEach(function(ex) {
          html += Components.card(
            '<div class="co-ex-item"><div class="co-ex-name">' + ex.name + '</div>' +
            (ex.description ? '<div class="co-ex-desc">' + ex.description.slice(0, 80) + '</div>' : '') +
            '<div class="co-ex-meta">' +
            '<span>' + (ex.difficulty || "—") + '</span>' +
            '<span>' + (ex.equipment || "—") + '</span>' +
            '</div></div>',
            { className: "co-card-ex" }
          );
        });
        html += '</div>';
      });

      html += '<div class="co-actions-row" style="margin-top:1rem">';
      html += '<button class="co-action-btn" data-co-route="home">← Back to Home</button>';
      html += '</div>';
    } catch (e) {
      html = Components.errorState("Could not load exercise data");
    }

    // Bind search on next tick
    setTimeout(function() {
      var inp = document.getElementById("coExSearch");
      if (inp) {
        inp.addEventListener("input", function() {
          var q = this.value.trim().toLowerCase();
          document.querySelectorAll(".co-ex-grid").forEach(function(grid) {
            var cat = grid.dataset.cat;
            var items = grid.querySelectorAll(".co-card-ex");
            var visible = 0;
            items.forEach(function(item) {
              var text = item.textContent.toLowerCase();
              var match = !q || text.includes(q);
              item.style.display = match ? "" : "none";
              if (match) visible++;
            });
            grid.style.display = visible > 0 ? "" : "none";
          });
        });
      }
    }, 0);

    return html;
  }

  function renderMuscles() {
    let html = Components.sectionHeader("Muscle Encyclopedia", { icon: "🦵" });

    var muscleGroups = [
      { name: "Chest", icon: "🏋️", exercises: ["Bench Press", "Incline Press", "Push Ups", "Dumbbell Fly"] },
      { name: "Back", icon: "🔙", exercises: ["Pull Ups", "Barbell Row", "Lat Pulldown", "Deadlift"] },
      { name: "Shoulders", icon: "💪", exercises: ["Overhead Press", "Lateral Raise", "Front Raise", "Face Pull"] },
      { name: "Biceps", icon: "💪", exercises: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl"] },
      { name: "Triceps", icon: "💪", exercises: ["Tricep Pushdown", "Skull Crushers", "Close Grip Bench", "Overhead Extension"] },
      { name: "Legs", icon: "🦵", exercises: ["Squat", "Leg Press", "Lunges", "Leg Curl"] },
      { name: "Glutes", icon: "🍑", exercises: ["Hip Thrust", "Glute Bridge", "Romanian Deadlift", "Cable Kickback"] },
      { name: "Abs", icon: "💪", exercises: ["Plank", "Crunches", "Leg Raise", "Russian Twist"] },
      { name: "Calves", icon: "🦵", exercises: ["Standing Calf Raise", "Seated Calf Raise", "Donkey Calf Raise"] },
      { name: "Forearms", icon: "💪", exercises: ["Wrist Curl", "Reverse Curl", "Farmer Walk"] },
    ];

    html += '<div class="co-muscle-grid">';
    muscleGroups.forEach(function(mg) {
      html += Components.card(
        '<div class="co-muscle-item"><div class="co-muscle-icon">' + mg.icon + '</div>' +
        '<div class="co-muscle-name">' + mg.name + '</div>' +
        '<div class="co-muscle-exercises">' + mg.exercises.slice(0, 3).join(", ") + '</div></div>',
        { className: "co-card-muscle" }
      );
    });
    html += '</div>';

    html += '<div class="co-actions-row" style="margin-top:1rem">';
    html += '<button class="co-action-btn" data-co-route="home">← Back to Home</button>';
    html += '</div>';

    return html;
  }

  function renderRecovery() {
    const coach = Data.getCoachEngine();
    const rec = coach ? coach.recovery : null;

    let html = Components.sectionHeader("Recovery Center", { icon: "🔄" });

    if (rec) {
      html += Components.card(
        '<div class="co-recovery-full"><div class="co-recovery-ring-wrap">' +
        Components.progressRing(rec.score || 0, 100, 80, 6) +
        '<div class="co-ring-center">' + (rec.score || 0) + '</div></div>' +
        '<div class="co-recovery-data"><div class="co-reco-label">' + (rec.label || "Unknown") + '</div>' +
        '<div class="co-reco-status">Status: ' + (rec.status || "—") + '</div>' +
        (rec.coachMessage ? '<div class="co-reco-msg">' + rec.coachMessage + '</div>' : '') +
        '</div></div>',
        { className: "co-card-recovery-full" }
      );

      // Readiness data
      if (coach.readiness) {
        const readiness = coach.readiness(rec);
        if (readiness && readiness.fatigueFlags) {
          html += Components.sectionHeader("Fatigue Factors", { icon: "⚠️" });
          html += '<div class="co-fatigue-list">';
          readiness.fatigueFlags.forEach(function(flag) {
            html += '<div class="co-fatigue-item"><span class="co-fatigue-icon">⚠️</span><span>' + flag + '</span></div>';
          });
          html += '</div>';
        }
        if (readiness && readiness.recommendations) {
          html += Components.sectionHeader("Recommendations", { icon: "💡" });
          html += '<div class="co-recommendations-list">';
          readiness.recommendations.forEach(function(rec) {
            html += '<div class="co-recommendation-item">→ ' + rec + '</div>';
          });
          html += '</div>';
        }
      }
    } else {
      html += Components.emptyState("No Recovery Data", "Start logging workouts to receive recovery insights.");
    }

    return html;
  }

  function renderNutrition() {
    const coach = Data.getCoachEngine();
    const nutr = coach ? coach.nutrition : null;
    const settings = Data.getSettings();

    let html = Components.sectionHeader("Nutrition Guide", { icon: "🥗" });

    if (nutr) {
      html += Components.card(
        '<div class="co-nutrition-targets">' +
        '<div class="co-nutri-target"><span class="co-target-label">Protein</span><span class="co-target-value">' + (nutr.proteinTarget || settings.proteinGoal + 'g') + '</span></div>' +
        '<div class="co-nutri-target"><span class="co-target-label">Water</span><span class="co-target-value">' + (nutr.waterTarget || settings.waterGoal + 'ml') + '</span></div>' +
        '<div class="co-nutri-target"><span class="co-target-label">Calories</span><span class="co-target-value">' + (nutr.calories || settings.calorieTarget + ' cal') + '</span></div>' +
        (nutr.mealAdvice ? '<div class="co-nutri-advice">' + nutr.mealAdvice + '</div>' : '') +
        '</div>',
        { className: "co-card-nutrition" }
      );
    }

    // Strategy targets
    const gc = Data.getGoalCenterAll();
    if (gc && gc.strategy && gc.strategy.targets) {
      html += Components.sectionHeader("Goal-Based Targets", { icon: "🎯" });
      html += '<div class="co-strategy-grid">';
      Object.keys(gc.strategy.targets).forEach(function(key) {
        html += Components.card(
          '<div class="co-strategy-item"><span class="co-strat-label">' + key.charAt(0).toUpperCase() + key.slice(1) + '</span>' +
          '<span class="co-strat-value">' + gc.strategy.targets[key] + '</span></div>',
          { className: "co-card-strat" }
        );
      });
      html += '</div>';
    }

    return html;
  }

  function renderGoals() {
    const gc = Data.getGoalCenterAll();
    const profile = Data.getProfile();

    let html = Components.sectionHeader("Goal Center", { icon: "🎯" });

    if (gc && gc.isActive) {
      html += Components.card(
        '<div class="co-goal-full"><div class="co-goal-type-label">' + (gc.profile ? gc.profile.goalType : "Active Goal") + '</div>' +
        (gc.pace ? '<div class="co-goal-pace">Pace: ' + gc.pace.label + '</div>' : '') +
        (gc.health ? '<div class="co-goal-health">Health: ' + gc.health.label + ' (' + (gc.health.score || "—") + ')</div>' : '') +
        (gc.pace && gc.pace.projectedDateStr ? '<div class="co-goal-projection">Projected: ' + gc.pace.projectedDateStr + '</div>' : '') +
        '</div>',
        { className: "co-card-goal-full" }
      );

      // Next actions
      if (gc.actions && gc.actions.length > 0) {
        html += Components.sectionHeader("Recommended Actions", { icon: "📋" });
        html += '<div class="co-actions-list">';
        gc.actions.forEach(function(a) {
          html += '<div class="co-action-item"><span class="co-action-icon">' + (a.type === "primary" ? "⭐" : "○") + '</span><span>' + a.label + '</span></div>';
        });
        html += '</div>';
      }

      // Analysis
      if (gc.analysis && gc.analysis.length > 0) {
        html += Components.sectionHeader("Goal Analysis", { icon: "💡" });
        html += '<div class="co-insights-list">';
        gc.analysis.forEach(function(a) {
          html += Components.insightCard(a, "info");
        });
        html += '</div>';
      }

      // Strategy
      if (gc.strategy) {
        html += Components.sectionHeader("Strategy", { icon: "📋" });
        html += Components.card(
          '<div class="co-strategy-detail"><div class="co-strat-rate">Expected Rate: ' + gc.strategy.expectedRate + '</div>' +
          (gc.strategy.warnings ? '<div class="co-strat-warnings">' + gc.strategy.warnings.map(function(w) { return '<div class="co-strat-warn">⚠️ ' + w + '</div>'; }).join("") + '</div>' : '') +
          '</div>',
          { className: "co-card-strategy" }
        );
      }
    } else {
      html += Components.emptyState("No Active Goal", "Set a goal to receive personalized coaching and recommendations.", "Set Goal");
    }

    html += '<div class="co-actions-row" style="margin-top:1rem">';
    html += '<button class="co-action-btn" data-co-action="openGoalCenter">🎯 Open Goal Center</button>';
    html += '</div>';

    return html;
  }

  function renderChallenges() {
    let html = Components.sectionHeader("Challenges & Achievements", { icon: "🏆" });

    // Check if CAS engine is available
    if (typeof CASEngine !== "undefined") {
      try {
        const cas = CASEngine.runAll();
        if (cas && cas.challenges) {
          html += '<div class="co-challenges-grid">';
          cas.challenges.forEach(function(ch) {
            html += Components.card(
              '<div class="co-challenge-item"><div class="co-challenge-name">' + ch.name + '</div>' +
              (ch.progress !== undefined ? Components.progressBar(ch.progress) : '') +
              '<div class="co-challenge-reward">' + (ch.reward || "") + '</div></div>',
              { className: "co-card-challenge" }
            );
          });
          html += '</div>';
        }
        if (cas && cas.achievements) {
          html += Components.sectionHeader("Achievements", { icon: "🏅" });
          html += '<div class="co-achievement-grid">';
          cas.achievements.forEach(function(a) {
            html += '<div class="co-achievement-item' + (a.unlocked ? ' co-achievement-unlocked' : '') + '">' +
              '<span class="co-achieve-icon">' + (a.icon || "🏅") + '</span>' +
              '<span class="co-achieve-name">' + a.name + '</span></div>';
          });
          html += '</div>';
        }
        if (cas && cas.streaks) {
          html += Components.sectionHeader("Streaks", { icon: "🔥" });
          html += Components.card(
            '<div class="co-streak-data">Current: ' + (cas.streaks.current || 0) + ' | Longest: ' + (cas.streaks.longest || 0) + '</div>',
            { className: "co-card-streak" }
          );
        }
      } catch (e) {
        html += Components.errorState("Could not load challenges data");
      }
    } else {
      html += Components.emptyState("Challenges Loading", "Challenges, achievements, and streaks will appear here.");
    }

    return html;
  }

  function renderInsights() {
    const coach = Data.getCoachEngine();
    const gc = Data.getGoalCenterAll();

    let html = Components.sectionHeader("Insights Dashboard", { icon: "📊" });

    if (coach) {
      // Coach insights
      if (coach.insights && coach.insights.insights) {
        html += Components.sectionHeader("Coach Insights", { icon: "💡" });
        html += '<div class="co-insights-list">';
        coach.insights.insights.forEach(function(i) {
          html += Components.insightCard(i.text, i.type || "info");
        });
        html += '</div>';
      }

      // Progress
      if (coach.progress) {
        html += Components.sectionHeader("Progress Summary", { icon: "📈" });
        html += Components.card(
          '<div class="co-progress-grid">' +
          (coach.progress.status ? '<div class="co-prog-item">Status: <strong>' + coach.progress.status + '</strong></div>' : '') +
          (coach.progress.weeklyVolume !== undefined ? '<div class="co-prog-item">Weekly Volume: <strong>' + (coach.progress.weeklyVolume >= 1000 ? (coach.progress.weeklyVolume / 1000).toFixed(1) + "k" : coach.progress.weeklyVolume) + ' kg</strong></div>' : '') +
          (coach.progress.consistency !== undefined ? '<div class="co-prog-item">Consistency: <strong>' + Math.round(coach.progress.consistency) + '%</strong></div>' : '') +
          (coach.progress.monthlyPRs !== undefined ? '<div class="co-prog-item">Monthly PRs: <strong>' + coach.progress.monthlyPRs + '</strong></div>' : '') +
          (coach.progress.projectedDate ? '<div class="co-prog-item">Projected: <strong>' + coach.progress.projectedDate + '</strong></div>' : '') +
          '</div>',
          { className: "co-card-progress" }
        );
      }

      // Goal progress
      if (gc && gc.pace) {
        html += Components.sectionHeader("Goal Pace", { icon: "🎯" });
        html += Components.card(
          '<div class="co-pace-data">' +
          (gc.pace.status ? '<div class="co-pace-status">Status: <strong>' + gc.pace.label + '</strong></div>' : '') +
          (gc.pace.achieved !== undefined ? '<div class="co-pace-achieved">' + Math.round(gc.pace.achieved) + '% complete</div>' : '') +
          Components.progressBar(gc.pace.achieved || 0) +
          (gc.pace.projectedWeeks ? '<div class="co-pace-projection">~' + gc.pace.projectedWeeks + ' weeks remaining</div>' : '') +
          '</div>',
          { className: "co-card-pace" }
        );
      }

      // Reports
      if (coach.reports) {
        if (coach.reports.weekly) {
          html += Components.sectionHeader("Weekly Report", { icon: "📋" });
          html += Components.card(
            '<div class="co-report-detail">' +
            '<div class="co-report-score-big">Coach Score: <strong>' + (coach.reports.weekly.coachScore || "—") + '</strong>/100</div>' +
            (coach.reports.weekly.assessment ? '<div class="co-report-assessment-label">' + coach.reports.weekly.assessment + '</div>' : '') +
            (coach.reports.weekly.biggestWin ? '<div class="co-report-win">🏆 Win: ' + coach.reports.weekly.biggestWin + '</div>' : '') +
            (coach.reports.weekly.biggestLimiter ? '<div class="co-report-limiter">⚠️ Limiter: ' + coach.reports.weekly.biggestLimiter + '</div>' : '') +
            '</div>',
            { className: "co-card-report" }
          );
        }
      }
    } else {
      html += Components.emptyState("No Insights Yet", "Start tracking workouts and weight to see personalized insights.");
    }

    return html;
  }

  function renderSearch() {
    let html = Components.sectionHeader("Search Coach", { icon: "🔍" });
    html += '<div class="co-search-bar"><input type="text" id="coSearchInput" class="co-search-input" placeholder="Search exercises, lessons, goals..." autocomplete="off" /></div>';
    html += '<div id="coSearchResults" class="co-search-results">';
    html += '<div class="co-search-hints"><div class="co-hint-title">Try searching for:</div><div class="co-hint-list">' +
      '<button class="co-hint-chip" data-co-hint="bench press">🏋️ Bench Press</button>' +
      '<button class="co-hint-chip" data-co-hint="squat">🦵 Squat</button>' +
      '<button class="co-hint-chip" data-co-hint="protein">🥩 Protein</button>' +
      '<button class="co-hint-chip" data-co-hint="recovery">🔄 Recovery</button>' +
      '<button class="co-hint-chip" data-co-hint="deadlift">💪 Deadlift</button>' +
      '</div></div>';
    html += '</div>';

    // Bind search
    setTimeout(function() {
      var input = document.getElementById("coSearchInput");
      var results = document.getElementById("coSearchResults");
      if (!input || !results) return;

      function performSearch(q) {
        q = q.trim().toLowerCase();
        if (!q) {
          results.innerHTML = '<div class="co-search-hints"><div class="co-hint-title">Try searching for:</div><div class="co-hint-list">' +
            '<button class="co-hint-chip" data-co-hint="bench press">🏋️ Bench Press</button>' +
            '<button class="co-hint-chip" data-co-hint="squat">🦵 Squat</button>' +
            '<button class="co-hint-chip" data-co-hint="protein">🥩 Protein</button>' +
            '<button class="co-hint-chip" data-co-hint="recovery">🔄 Recovery</button>' +
            '<button class="co-hint-chip" data-co-hint="deadlift">💪 Deadlift</button>' +
            '</div></div>';
          bindHintChips();
          return;
        }

        var items = [];

        // Search exercises
        if (typeof EXERCISE_LIBRARY !== "undefined") {
          EXERCISE_LIBRARY.forEach(function(ex) {
            var text = (ex.name + " " + (ex.category || "") + " " + (ex.description || "") + " " + (ex.equipment || "") + " " + (ex.movementType || "")).toLowerCase();
            if (text.includes(q)) {
              items.push({ type: "exercise", label: ex.name, desc: (ex.category || "Exercise") + " · " + (ex.difficulty || "—"), route: "exercises", icon: "💪" });
            }
          });
        }

        // Search lessons
        var coach = Data.getCoachEngine();
        if (coach && coach.education) {
          coach.education.forEach(function(lesson) {
            var text = ((lesson.title || "") + " " + (lesson.summary || "") + " " + (lesson.tip || "")).toLowerCase();
            if (text.includes(q)) {
              items.push({ type: "lesson", label: lesson.title || "Lesson", desc: lesson.summary ? lesson.summary.slice(0, 60) : "", route: "learn", icon: "📚" });
            }
          });
        }

        // Search muscles
        var allMuscles = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Glutes", "Abs", "Calves", "Forearms", "Hamstrings", "Quads", "Lats", "Traps"];
        allMuscles.forEach(function(m) {
          if (m.toLowerCase().includes(q)) {
            items.push({ type: "muscle", label: m, desc: "Muscle group", route: "muscles", icon: "🦵" });
          }
        });

        // Group results
        if (items.length === 0) {
          results.innerHTML = Components.emptyState("No results found", "Try a different search term like 'bench', 'protein', or 'recovery'.");
          return;
        }

        var html = '<div class="co-search-count">' + items.length + ' result' + (items.length !== 1 ? "s" : "") + '</div>';
        // Group by type
        var groups = {};
        items.forEach(function(item) {
          if (!groups[item.type]) groups[item.type] = [];
          groups[item.type].push(item);
        });

        var typeLabels = { exercise: "Exercises", lesson: "Lessons", muscle: "Muscles" };
        Object.keys(groups).forEach(function(type) {
          html += Components.sectionHeader(typeLabels[type] || type, { icon: groups[type][0].icon });
          html += '<div class="co-search-group">';
          groups[type].forEach(function(item) {
            html += Components.clickableRow(item.label, item.desc, item.route);
          });
          html += '</div>';
        });

        results.innerHTML = html;
      }

      input.addEventListener("input", function() { performSearch(this.value); });

      function bindHintChips() {
        results.querySelectorAll("[data-co-hint]").forEach(function(chip) {
          chip.addEventListener("click", function() {
            input.value = this.dataset.coHint;
            performSearch(this.dataset.coHint);
          });
        });
      }
      bindHintChips();

    }, 0);

    return html;
  }

  function renderCoachSettings() {
    const settings = Data.getSettings();
    let html = Components.sectionHeader("Coach Settings", { icon: "⚙️" });
    html += Components.card(
      '<div class="co-settings-list">' +
      '<div class="co-setting-item"><span>Coach Activated</span><span class="co-setting-val">' + (settings.coachActivated ? "✅ Yes" : "❌ No") + '</span></div>' +
      '<div class="co-setting-item"><span>Auto Rest Timer</span><span class="co-setting-val">' + (settings.autoRest ? "On" : "Off") + '</span></div>' +
      '<div class="co-setting-item"><span>Auto Next Exercise</span><span class="co-setting-val">' + (settings.autoNext ? "On" : "Off") + '</span></div>' +
      '<div class="co-setting-item"><span>Focus Mode</span><span class="co-setting-val">' + (settings.focusMode ? "On" : "Off") + '</span></div>' +
      '<div class="co-setting-item"><span>Screen Awake</span><span class="co-setting-val">' + (settings.screenAwake ? "On" : "Off") + '</span></div>' +
      '<div class="co-setting-item"><span>Compact Mode</span><span class="co-setting-val">' + (settings.compactMode ? "On" : "Off") + '</span></div>' +
      '</div>',
      { className: "co-card-settings" }
    );
    html += '<div class="co-actions-row" style="margin-top:1rem">';
    html += '<button class="co-action-btn" data-co-action="back">← Back to Coach Home</button>';
    html += '</div>';
    return html;
  }

  // ===== INIT =====
  function init() {
    const container = document.getElementById("trainerPageContent");
    if (!container) return;
    render(container);
  }

  // ===== PUBLIC API =====
  return {
    init: init,
    render: render,
    navigate: navigate,
    back: back,
    canGoBack: canGoBack,
    getCurrentRoute: getCurrentRoute,
    getRoutes: getRoutes,
    getRouteParams: getRouteParams,
    onChange: onChange,
    Data: Data,
    Components: Components,
  };
})();
