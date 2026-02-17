document.addEventListener('DOMContentLoaded', () => {
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

    // Safe Lucide helper
    function refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Initialize
    function init() {
        loadData();
        renderDaySelector();
        renderTasks();
        applyTheme();

        // Register Service Worker (Localhost/HTTPS only, ignore error on file://)
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
        }

        // Event Listeners
        if (addTaskBtn) addTaskBtn.addEventListener('click', () => modalOverlay.classList.add('active'));
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) modalOverlay.classList.remove('active');
            });
        }

        if (taskForm) taskForm.addEventListener('submit', handleAddTask);
        if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

        refreshIcons();
    }

    // Render Day Selector
    function renderDaySelector() {
        if (!daySelector) return;
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
        if (!taskList || !currentDayLabel) return;

        const tasks = state.tasks[state.currentDay] || [];
        currentDayLabel.textContent = DAYS_FULL[state.currentDay];

        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="book-open"></i>
                    <p>今日の予定はありません</p>
                </div>
            `;
            refreshIcons();
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
                    <div class="task-checkbox" data-index="${index}">
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
                <button class="icon-btn task-delete" data-index="${index}">
                    <i data-lucide="trash-2"></i>
                </button>
            `;

            // Event delegation or direct listeners
            card.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(index));
            card.querySelector('.task-delete').addEventListener('click', () => deleteTask(index));

            taskList.appendChild(card);
        });

        refreshIcons();
        updateProgress(completedCount, tasks.length);
    }

    // Update Progress
    function updateProgress(completed, total) {
        if (!progressBar || !progressText) return;
        const percentage = total === 0 ? 0 : (completed / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${completed} / ${total} 完了`;
    }

    // Task Actions
    function handleAddTask(e) {
        e.preventDefault();
        const titleInput = document.getElementById('task-title');
        const timeInput = document.getElementById('task-time');
        const durationInput = document.getElementById('task-duration');

        if (!titleInput) return;

        const newTask = {
            id: Date.now(),
            title: titleInput.value,
            time: timeInput ? timeInput.value : '',
            duration: durationInput ? durationInput.value : '60',
            completed: false
        };

        if (!state.tasks[state.currentDay]) state.tasks[state.currentDay] = [];
        state.tasks[state.currentDay].push(newTask);
        saveData();
        renderTasks();

        // Reset and close
        taskForm.reset();
        modalOverlay.classList.remove('active');
    }

    function toggleTask(index) {
        if (state.tasks[state.currentDay][index]) {
            state.tasks[state.currentDay][index].completed = !state.tasks[state.currentDay][index].completed;
            saveData();
            renderTasks();
        }
    }

    function deleteTask(index) {
        if (confirm('この予定を削除しますか？')) {
            state.tasks[state.currentDay].splice(index, 1);
            saveData();
            renderTasks();
        }
    }

    // Data Persistence
    function saveData() {
        try {
            localStorage.setItem('study_planner_state_v2', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }

    function loadData() {
        try {
            const saved = localStorage.getItem('study_planner_state_v2');
            if (saved) {
                const loadedState = JSON.parse(saved);
                // Basic validation/merging
                if (loadedState && typeof loadedState.tasks === 'object') {
                    state = { ...state, ...loadedState };
                }
            }
        } catch (e) {
            console.error('Failed to load data:', e);
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
        if (themeToggle) {
            const themeIcon = themeToggle.querySelector('i');
            if (themeIcon) {
                if (state.theme === 'dark') {
                    themeIcon.setAttribute('data-lucide', 'sun');
                } else {
                    themeIcon.setAttribute('data-lucide', 'moon');
                }
                refreshIcons();
            }
        }
    }

    // Initial run
    init();
});
