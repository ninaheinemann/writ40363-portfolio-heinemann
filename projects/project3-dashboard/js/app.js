// ==========================================
// PROJECT 3: PERSONAL DATA DASHBOARD
// ==========================================

// ------------ THEME MANAGEMENT -------------

function initializeTheme() {
  const savedTheme = localStorage.getItem('dashboardTheme');

  if (savedTheme === 'dark') {
    document.body.classList.add('theme-dark');
    updateThemeIcon('dark');
  } else {
    updateThemeIcon('light');
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('theme-dark');
  localStorage.setItem('dashboardTheme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark ? 'dark' : 'light');
}

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector('.theme-icon');
  if (!themeIcon) return;
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function setupThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
}

// ------------ WEATHER WIDGET -------------

function loadWeather() {
  fetch('./data/weather.json')
    .then(res => res.json())
    .then(data => displayWeather(data))
    .catch(() => displayWeatherError());
}

function displayWeather(weather) {
  const weatherDisplay = document.getElementById('weather-display');

  weatherDisplay.innerHTML = `
    <div class="weather-current">
      <div class="weather-icon">${weather.icon}</div>
      <div class="weather-temp">${weather.temperature}°F</div>
      <div class="weather-location">${weather.location}</div>
      <div class="weather-condition">${weather.condition}</div>
    </div>
    <div class="weather-details">
      <div class="weather-detail">
        <span>Humidity</span>
        <strong>${weather.humidity}%</strong>
      </div>
      <div class="weather-detail">
        <span>Wind</span>
        <strong>${weather.windSpeed} mph</strong>
      </div>
    </div>
  `;
}

function displayWeatherError() {
  document.getElementById('weather-display').innerHTML = `
    <div class="error-message">
      <div class="error-icon">⚠️</div>
      <p>Could not load weather data</p>
      <p class="error-hint">Check console</p>
    </div>
  `;
}

// ------------ QUOTES WIDGET -------------

let allQuotes = [];
let currentQuoteIndex = -1;

function loadQuotes() {
  fetch('./data/quotes.json')
    .then(res => res.json())
    .then(data => {
      allQuotes = data;
      displayRandomQuote();
    })
    .catch(() => displayQuotesError());
}

function displayRandomQuote() {
  if (allQuotes.length === 0) return;

  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * allQuotes.length);
  } while (randomIndex === currentQuoteIndex && allQuotes.length > 1);

  currentQuoteIndex = randomIndex;
  const quote = allQuotes[randomIndex];

  document.getElementById('quotes-display').innerHTML = `
    <div class="quote-card">
      <div class="quote-text">"${quote.text}"</div>
      <div class="quote-author">— ${quote.author}</div>
    </div>
  `;
}

function displayQuotesError() {
  document.getElementById('quotes-display').innerHTML = `
    <div class="error-message">⚠️ Could not load quotes</div>
  `;
}

function setupQuotesButton() {
  const btn = document.getElementById('new-quote-btn');
  if (btn) btn.addEventListener('click', displayRandomQuote);
}

// ------------ TASKS WIDGET -------------

function loadTasks() {
  const saved = localStorage.getItem('dashboardTasks');
  return saved ? JSON.parse(saved) : [];
}

function saveTasks(tasks) {
  localStorage.setItem('dashboardTasks', JSON.stringify(tasks));
}

function displayTasks() {
  const tasks = loadTasks();
  const list = document.getElementById('tasks-list');

  if (tasks.length === 0) {
    list.innerHTML = `<div class="no-tasks">No tasks yet. Add one above! ✨</div>`;
    updateTaskStats(tasks);
    return;
  }

  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const el = document.createElement('div');
    el.className = `task-item ${task.completed ? "completed" : ""}`;

    el.innerHTML = `
      <input type="checkbox" ${task.completed ? "checked" : ""}>
      <span class="task-text">${task.text}</span>
      <button class="btn-delete">Delete</button>
    `;

    el.querySelector('input').addEventListener('change', () => toggleTask(index));
    el.querySelector('button').addEventListener('click', () => deleteTask(index));

    list.appendChild(el);
  });

  updateTaskStats(tasks);
}

function addTask(text) {
  const tasks = loadTasks();
  tasks.push({ text, completed: false, id: Date.now() });
  saveTasks(tasks);
  displayTasks();
}

function setupTaskForm() {
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (input.value.trim()) {
      addTask(input.value.trim());
      input.value = "";
    }
  });
}

function toggleTask(index) {
  const tasks = loadTasks();
  tasks[index].completed = !tasks[index].completed;
  saveTasks(tasks);
  displayTasks();
}

function deleteTask(index) {
  const tasks = loadTasks();
  tasks.splice(index, 1);
  saveTasks(tasks);
  displayTasks();
}

function updateTaskStats(tasks) {
  const stats = document.getElementById('task-stats');
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;

  stats.innerHTML = total
    ? `
      <div>Total: <strong>${total}</strong></div>
      <div>Completed: <strong>${completed}</strong></div>
      <div>Pending: <strong>${total - completed}</strong></div>
      <div>Progress: <strong>${Math.round((completed / total) * 100)}%</strong></div>
    `
    : "";
}

// ------------ INITIALIZE EVERYTHING -------------

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupThemeToggle();

  loadWeather();
  loadQuotes();
  setupQuotesButton();
  displayTasks();
  setupTaskForm();
});
