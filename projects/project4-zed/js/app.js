// ==============================
// MY STATE (all the data my app uses)
// ==============================

// I use separate keys so I can store entries, goals, and journal text
const ENTRIES_KEY = "daily_fuel_entries_v1";
const GOALS_KEY = "daily_fuel_goals_v1";
const JOURNAL_KEY = "daily_fuel_journal_v1";

const state = {
  entries: [],      // all my meal entries live here
  goals: {          // my daily goals live here
    calorieGoal: null,
    goal1: "",
    goal2: "",
    goal3: ""
  },
  journalByDate: {}, // this is a map: date string -> journal text
  chart: null        // Chart.js instance for the weekly graph
};

// I use this to avoid calling document.getElementById everywhere
const dom = {};

// When the page is ready, I set everything up
document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initializeTheme();
  attachEvents();
  initializeDateInput();  // make the date default to today
  loadFromStorage();      // load entries, goals, journal from localStorage
  renderGoals();
  renderAllForActiveDate(); // summary + journal + entries + chart
});

// ==============================
// DOM CACHING
// ==============================

// I grab all the DOM elements once and store references
function cacheDom() {
  dom.themeToggle = document.getElementById("theme-toggle");
  dom.themeIcon = document.querySelector(".theme-icon");

  // Entry form
  dom.entryForm = document.getElementById("entry-form");
  dom.entryDate = document.getElementById("entry-date");
  dom.mealType = document.getElementById("meal-type");
  dom.mealNotes = document.getElementById("meal-notes");
  dom.calories = document.getElementById("calories");
  dom.mealFeeling = document.getElementById("meal-feeling");
  dom.entryError = document.getElementById("entry-error");
  dom.clearTodayBtn = document.getElementById("clear-today-btn");

  // Goals form
  dom.goalsForm = document.getElementById("goals-form");
  dom.dailyCalorieGoal = document.getElementById("daily-calorie-goal");
  dom.goal1 = document.getElementById("goal-1");
  dom.goal2 = document.getElementById("goal-2");
  dom.goal3 = document.getElementById("goal-3");

  // Summary
  dom.summaryDateLabel = document.getElementById("summary-date-label");
  dom.statTotalCalories = document.getElementById("stat-total-calories");
  dom.statGoal = document.getElementById("stat-goal");
  dom.statRemaining = document.getElementById("stat-remaining");
  dom.progressFill = document.getElementById("progress-fill");
  dom.progressGoalLabel = document.getElementById("progress-goal-label");

  // Journal
  dom.journalText = document.getElementById("journal-text");
  dom.saveJournalBtn = document.getElementById("save-journal-btn");
  dom.journalStatus = document.getElementById("journal-status");

  // History
  dom.weeklyChartCanvas = document.getElementById("weekly-chart");
  dom.entriesList = document.getElementById("entries-list");
}

// ==============================
// THEME (LIGHT / DARK PINK)
// ==============================

function initializeTheme() {
  const savedTheme = localStorage.getItem("daily_fuel_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("theme-dark");
  }
  updateThemeIcon();
}

function toggleTheme() {
  document.body.classList.toggle("theme-dark");
  const isDark = document.body.classList.contains("theme-dark");
  localStorage.setItem("daily_fuel_theme", isDark ? "dark" : "light");
  updateThemeIcon();
}

// I update the little emoji in the header
function updateThemeIcon() {
  dom.themeIcon.textContent = document.body.classList.contains("theme-dark")
    ? "☀️"
    : "🌙";
}

// ==============================
// INITIAL DATE
// ==============================

// I want the entry date to default to today when the page loads
function initializeDateInput() {
  const today = getTodayString();
  dom.entryDate.value = today;
}

// This gives me "YYYY-MM-DD" for today
function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

// This gives me the date I'm currently “viewing” (the one in the date input)
function getActiveDate() {
  return dom.entryDate.value || getTodayString();
}

// ==============================
// EVENTS
// ==============================

function attachEvents() {
  dom.themeToggle.addEventListener("click", toggleTheme);

  // When I submit the entry form, I add a new meal
  dom.entryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleAddEntry();
  });

  // If I change the date, I want the summary + journal to match that date
  dom.entryDate.addEventListener("change", () => {
    renderAllForActiveDate();
  });

  // This clears all entries for the current active date
  dom.clearTodayBtn.addEventListener("click", () => {
    handleClearCurrentDateEntries();
  });

  // Saving my goals updates both the state and the display
  dom.goalsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveGoalsFromForm();
  });

  // Saving journal writes the text for the current date
  dom.saveJournalBtn.addEventListener("click", () => {
    handleSaveJournal();
  });
}

// ==============================
// STORAGE (LOADING / SAVING)
// ==============================

// I load entries, goals, and journal from localStorage
function loadFromStorage() {
  // Entries
  const entriesRaw = localStorage.getItem(ENTRIES_KEY);
  if (entriesRaw) {
    try {
      const parsed = JSON.parse(entriesRaw);
      if (Array.isArray(parsed)) {
        state.entries = parsed;
      }
    } catch (e) {
      console.error("Error parsing entries", e);
    }
  }

  // Goals
  const goalsRaw = localStorage.getItem(GOALS_KEY);
  if (goalsRaw) {
    try {
      const parsed = JSON.parse(goalsRaw);
      state.goals = {
        calorieGoal: parsed.calorieGoal ?? null,
        goal1: parsed.goal1 || "",
        goal2: parsed.goal2 || "",
        goal3: parsed.goal3 || ""
      };
    } catch (e) {
      console.error("Error parsing goals", e);
    }
  }

  // Journal
  const journalRaw = localStorage.getItem(JOURNAL_KEY);
  if (journalRaw) {
    try {
      const parsed = JSON.parse(journalRaw);
      state.journalByDate = parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      console.error("Error parsing journal", e);
    }
  }
}

// I save entries whenever I change them
function saveEntries() {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(state.entries));
}

// I save my goals
function saveGoals() {
  localStorage.setItem(GOALS_KEY, JSON.stringify(state.goals));
}

// I save all my journal text by date
function saveJournal() {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(state.journalByDate));
}

// ==============================
// ADDING & CLEARING ENTRIES
// ==============================

// This handles creating a new entry object and pushing it into state.entries
function handleAddEntry() {
  const date = getActiveDate();
  const mealType = dom.mealType.value;
  const notes = dom.mealNotes.value.trim();
  const caloriesValue = dom.calories.value.trim();
  const feeling = dom.mealFeeling.value.trim();

  dom.entryError.textContent = "";

  if (!mealType || !notes || !caloriesValue) {
    dom.entryError.textContent = "I need a meal, description, and calories to log this.";
    return;
  }

  const caloriesNumber = Number(caloriesValue);
  if (Number.isNaN(caloriesNumber) || caloriesNumber < 0) {
    dom.entryError.textContent = "Calories must be a positive number.";
    return;
  }

  const entry = {
    id: String(Date.now()),
    date,
    mealType,
    notes,
    calories: caloriesNumber,
    feeling,
    createdAt: new Date().toISOString()
  };

  // I put newest entries first
  state.entries.unshift(entry);
  saveEntries();

  // After adding a new entry, I update everything related to that date
  renderAllForActiveDate();
  dom.entryForm.reset();
  dom.entryDate.value = date; // keep the same date selected
}

// This removes all entries that belong to the active date
function handleClearCurrentDateEntries() {
  const date = getActiveDate();
  const hasEntriesForDate = state.entries.some((e) => e.date === date);
  if (!hasEntriesForDate) return;

  const confirmClear = confirm("This will delete ALL entries for this day. Continue?");
  if (!confirmClear) return;

  state.entries = state.entries.filter((e) => e.date !== date);
  saveEntries();
  renderAllForActiveDate();
}

// ==============================
// GOALS
// ==============================

// I pull values from the goals form and store them in state + localStorage
function saveGoalsFromForm() {
  const rawGoal = dom.dailyCalorieGoal.value.trim();
  const calorieGoal = rawGoal ? Number(rawGoal) : null;

  state.goals.calorieGoal = !Number.isNaN(calorieGoal) && calorieGoal > 0 ? calorieGoal : null;
  state.goals.goal1 = dom.goal1.value.trim();
  state.goals.goal2 = dom.goal2.value.trim();
  state.goals.goal3 = dom.goal3.value.trim();

  saveGoals();
  renderGoals();
  renderSummary(); // summary depends on goal
}

// This makes sure the form shows my saved goals when the page loads
function renderGoals() {
  if (state.goals.calorieGoal != null) {
    dom.dailyCalorieGoal.value = state.goals.calorieGoal;
  } else {
    dom.dailyCalorieGoal.value = "";
  }

  dom.goal1.value = state.goals.goal1;
  dom.goal2.value = state.goals.goal2;
  dom.goal3.value = state.goals.goal3;
}

// ==============================
// JOURNAL
// ==============================

// This saves the journal text for the active date
function handleSaveJournal() {
  const date = getActiveDate();
  const text = dom.journalText.value.trim();
  state.journalByDate[date] = text;
  saveJournal();

  dom.journalStatus.textContent = "Saved ✿";
  setTimeout(() => {
    dom.journalStatus.textContent = "";
  }, 1500);
}

// I load the journal text for the active date into the textarea
function renderJournal() {
  const date = getActiveDate();
  const existing = state.journalByDate[date] || "";
  dom.journalText.value = existing;
}

// ==============================
// SUMMARY / STATS FOR ACTIVE DATE
// ==============================

// This recalculates totals, remaining/over, and updates the progress bar
function renderSummary() {
  const date = getActiveDate();
  dom.summaryDateLabel.textContent = new Date(date).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  // Filter entries belonging to this date
  const entriesForDate = state.entries.filter((e) => e.date === date);
  const totalCalories = entriesForDate.reduce((sum, e) => sum + e.calories, 0);

  dom.statTotalCalories.textContent = totalCalories.toString();

  const goal = state.goals.calorieGoal;
  if (goal && goal > 0) {
    dom.statGoal.textContent = goal.toString();

    const diff = goal - totalCalories;
    if (diff >= 0) {
      dom.statRemaining.textContent = `${diff} remaining`;
    } else {
      dom.statRemaining.textContent = `Over by ${Math.abs(diff)}`;
    }

    // Progress bar width, capped at 130% to show overflow slightly
    const progressPercent = Math.min(130, (totalCalories / goal) * 100);
    dom.progressFill.style.width = `${progressPercent}%`;
    dom.progressGoalLabel.textContent = `Goal: ${goal}`;
  } else {
    dom.statGoal.textContent = "—";
    dom.statRemaining.textContent = "Set a goal to see progress";
    dom.progressFill.style.width = "0%";
    dom.progressGoalLabel.textContent = "No goal set";
  }
}

// ==============================
// RECENT ENTRIES LIST
// ==============================

// This shows the most recent entries (not just the active date)
function renderRecentEntries() {
  dom.entriesList.innerHTML = "";

  if (!state.entries.length) {
    const empty = document.createElement("p");
    empty.className = "entries-empty";
    empty.textContent = "No entries yet. Once I log meals, they’ll show up here.";
    dom.entriesList.appendChild(empty);
    return;
  }

  const recent = state.entries.slice(0, 6); // show the latest 6 entries

  recent.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "entry-row";

    const dateLabel = new Date(entry.date).toLocaleDateString([], {
      month: "short",
      day: "numeric"
    });

    row.innerHTML = `
      <div class="entry-meal">${capitalize(entry.mealType)} · ${dateLabel}</div>
      <div class="entry-notes">${entry.notes}</div>
      <div class="entry-calories">${entry.calories} kcal</div>
    `;

    dom.entriesList.appendChild(row);
  });
}

// ==============================
// WEEKLY CHART (LAST 7 DAYS TOTALS)
// ==============================

// I group entries by date and build a small bar chart
function renderWeeklyChart() {
  if (!dom.weeklyChartCanvas) return;

  // Build a map from date -> total calories
  const totalsByDate = {};
  state.entries.forEach((entry) => {
    if (!totalsByDate[entry.date]) {
      totalsByDate[entry.date] = 0;
    }
    totalsByDate[entry.date] += entry.calories;
  });

  // Convert map to sorted array of [date, total], then take last 7 dates
  const sortedDates = Object.keys(totalsByDate).sort(); // ascending
  const lastSeven = sortedDates.slice(-7);

  const labels = lastSeven.map((dateStr) =>
    new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" })
  );
  const data = lastSeven.map((dateStr) => totalsByDate[dateStr]);

  const ctx = dom.weeklyChartCanvas.getContext("2d");

  // If the chart already exists, I just update it
  if (state.chart) {
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].data = data;
    state.chart.update();
    return;
  }

  // Otherwise I create the chart for the first time
  state.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Calories per day",
          data,
          borderWidth: 1.5,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} kcal`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

// ==============================
// RENDER EVERYTHING FOR ACTIVE DATE
// ==============================

// Whenever I change something important, I call this so the UI stays in sync
function renderAllForActiveDate() {
  renderSummary();
  renderJournal();
  renderRecentEntries();
  renderWeeklyChart();
}

// ==============================
// SMALL HELPERS
// ==============================

// This just capitalizes the first letter (for meal types)
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
