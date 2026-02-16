// State management
let state = {
    currentDay: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, // 0: Mon, 6: Sun
    tasks: {
        0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    },
    theme: 'dark'
};

const DAYS_SHORT = ['月', '火', '水', '木', '金', '土', '日'];
const DAYS_FULL = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];

// DOM Elements
const daySelector = document.getElementById('day-selector');
const taskList = document.getElementById('task-list');
const currentDayLabel = document.getElementById('current-day-label');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('daily-progress');
const addTaskBtn = document.getElementById('add-task-btn');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal');
const taskForm = document.getElementById('task-form');
const themeToggle = document.getElementById('theme-toggle');

// Initialize
function init() {
    loadData();
    renderDaySelector();
    renderTasks();
    applyTheme();
    
    // Event Listeners
    addTaskBtn.addEventListener('click', () => modalOverlay.classList.add('active'));
    closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });

    taskForm.addEventListener('submit', handleAddTask);
    themeToggle.addEventListener('click', toggleTheme);
}

// Render Day Selector
function renderDaySelector() {
    daySelector.innerHTML = '';
    DAYS_SHORT.forEach((day, index) => {
        const dayItem = document.createElement('div');
        dayItem.className = `day-item ${state.currentDay === index ? 'active' : ''}`;
        dayItem.innerHTML = `
            <span class="day-name">${day}</span>
            <span class="day-short">${day}</span>
        `;
        dayItem.addEventListener('click', () => {
            state.currentDay = index;
            renderDaySelector();
            renderTasks();
        });
        daySelector.appendChild(dayItem);
    });
}

// Render Tasks
function renderTasks() {
    const tasks = state.tasks[state.currentDay] || [];
    currentDayLabel.textContent = DAYS_FULL[state.currentDay];
    
    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="book-open"></i>
                <p>今日の予定はありません</p>
            </div>
        `;
        lucide.createIcons();
        updateProgress(0, 0);
        return;
    }

    taskList.innerHTML = '';
    let completedCount = 0;

    tasks.forEach((task, index) => {
        if (task.completed) completedCount++;
        
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        card.innerHTML = `
            <div class="task-checkbox-container">
                <div class="task-checkbox" onclick="toggleTask(${index})">
                    <i data-lucide="check"></i>
                </div>
            </div>
            <div class="task-info">
                <span class="task-title">${task.title}</span>
                <div class="task-meta">
                    <i data-lucide="clock" style="width:12px"></i>
                    <span>${task.time || '--:--'} (${task.duration}分)</span>
                </div>
            </div>
            <button class="icon-btn task-delete" onclick="deleteTask(${index})">
                <i data-lucide="trash-2"></i>
            </button>
        `;
        taskList.appendChild(card);
    });

    lucide.createIcons();
    updateProgress(completedCount, tasks.length);
}

// Update Progress
function updateProgress(completed, total) {
    const percentage = total === 0 ? 0 : (completed / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${completed} / ${total} 完了`;
}

// Task Actions
function handleAddTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const time = document.getElementById('task-time').value;
    const duration = document.getElementById('task-duration').value;

    const newTask = {
        id: Date.now(),
        title,
        time,
        duration,
        completed: false
    };

    state.tasks[state.currentDay].push(newTask);
    saveData();
    renderTasks();
    
    // Reset and close
    taskForm.reset();
    modalOverlay.classList.remove('active');
}

window.toggleTask = function(index) {
    state.tasks[state.currentDay][index].completed = !state.tasks[state.currentDay][index].completed;
    saveData();
    renderTasks();
};

window.deleteTask = function(index) {
    if (confirm('この予定を削除しますか？')) {
        state.tasks[state.currentDay].splice(index, 1);
        saveData();
        renderTasks();
    }
};

// Data Persistence
function saveData() {
    localStorage.setItem('study_planner_state', JSON.stringify(state));
}

function loadData() {
    const saved = localStorage.getItem('study_planner_state');
    if (saved) {
        state = JSON.parse(saved);
        // Ensure today is selected on fresh load if needed, 
        // but often users want to stay on the day they were editing.
    }
}

// Theme
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveData();
}

function applyTheme() {
    document.body.setAttribute('data-theme', state.theme);
    const themeIcon = themeToggle.querySelector('i');
    if (state.theme === 'dark') {
        themeIcon.setAttribute('data-lucide', 'sun');
    } else {
        themeIcon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
}

init();
