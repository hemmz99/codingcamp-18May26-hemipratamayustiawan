// Storage Manager Module
const StorageManager = (function() {
  // Feature detection for localStorage availability
  let isAvailable = false;
  
  try {
    isAvailable = typeof(Storage) !== "undefined" && typeof localStorage !== "undefined";
    if (isAvailable) {
      // Test if we can actually use localStorage (some browsers block it in private mode)
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    }
  } catch (error) {
    isAvailable = false;
    console.warn('Local Storage is not available. Data will not persist across sessions.');
  }

  /**
   * Retrieve data from Local Storage
   * @param {string} key - Storage key
   * @returns {Object|null} Parsed data or null if not found/error
   */
  function get(key) {
    if (!isAvailable) {
      return null;
    }
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  }

  /**
   * Save data to Local Storage
   * @param {string} key - Storage key
   * @param {*} value - Data to store (will be JSON stringified)
   * @returns {boolean} Success status
   */
  function set(key, value) {
    if (!isAvailable) {
      return false;
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Local Storage quota exceeded');
      } else {
        console.error(`Error writing to localStorage (${key}):`, error);
      }
      return false;
    }
  }

  /**
   * Remove data from Local Storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  function remove(key) {
    if (!isAvailable) {
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Check if key exists in Local Storage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  function has(key) {
    if (!isAvailable) {
      return false;
    }
    
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Check if Local Storage is available
   * @returns {boolean} True if localStorage is available
   */
  function isStorageAvailable() {
    return isAvailable;
  }

  return {
    get,
    set,
    remove,
    has,
    isStorageAvailable
  };
})();

// Theme Manager Module
const ThemeManager = (function() {
  const THEME_KEY = 'theme-preference';
  let toggleButton;
  
  /**
   * Initialize theme manager
   * @param {HTMLElement} toggleBtn - Theme toggle button
   */
  function init(toggleBtn) {
    toggleButton = toggleBtn;
    
    // Load saved theme or default to light
    const savedTheme = StorageManager.get(THEME_KEY) || 'light';
    applyTheme(savedTheme);
    
    // Attach event listener
    toggleButton.addEventListener('click', toggleTheme);
  }
  
  /**
   * Apply theme to document
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggleButton.setAttribute('aria-label', 'Switch to light mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      toggleButton.setAttribute('aria-label', 'Switch to dark mode');
    }
  }
  
  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    StorageManager.set(THEME_KEY, newTheme);
  }
  
  /**
   * Get current theme
   * @returns {string} Current theme ('light' or 'dark')
   */
  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
  
  return {
    init,
    toggleTheme,
    getCurrentTheme
  };
})();

// Greeting Display Module
const GreetingDisplay = (function() {
  let greetingElement;
  let timeDisplayElement;
  let dateDisplayElement;
  let nameInput;
  let saveNameBtn;
  let intervalId;
  let userName = '';

  /**
   * Initialize the greeting display
   * @param {HTMLElement} greetingEl - Element for greeting text
   * @param {HTMLElement} timeEl - Element for time display
   * @param {HTMLElement} dateEl - Element for date display
   */
  function init(greetingEl, timeEl, dateEl) {
    greetingElement = greetingEl;
    timeDisplayElement = timeEl;
    dateDisplayElement = dateEl;
    nameInput = document.getElementById('name-input');
    saveNameBtn = document.getElementById('save-name-btn');
    
    // Load saved name
    userName = StorageManager.get('userName') || '';
    if (userName) {
      nameInput.value = userName;
    }
    
    // Attach event listeners
    saveNameBtn.addEventListener('click', saveName);
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveName();
      }
    });
    
    // Initial update
    update();
    
    // Update every second
    intervalId = setInterval(update, 1000);
  }

  /**
   * Save user name to localStorage
   */
  function saveName() {
    const name = nameInput.value.trim();
    userName = name;
    StorageManager.set('userName', userName);
    update();
  }

  /**
   * Update time, date, and greeting display
   */
  function update() {
    const now = new Date();
    
    timeDisplayElement.textContent = formatTime(now);
    dateDisplayElement.textContent = formatDate(now);
    greetingElement.textContent = getGreeting(now.getHours());
  }

  /**
   * Get greeting based on current hour
   * @param {number} hour - Hour in 24-hour format (0-23)
   * @returns {string} Greeting message
   */
  function getGreeting(hour) {
    let timeGreeting = '';
    if (hour >= 5 && hour < 12) {
      timeGreeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = 'Good Evening';
    } else {
      timeGreeting = 'Good Night';
    }
    
    // Add name if set
    if (userName) {
      return `${timeGreeting}, ${userName}`;
    }
    return timeGreeting;
  }

  /**
   * Format time in 12-hour format with AM/PM and seconds
   * @param {Date} date - Date object
   * @returns {string} Formatted time string
   */
  function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const secondsStr = seconds < 10 ? '0' + seconds : seconds;
    
    return `${hours}:${minutesStr}:${secondsStr} ${ampm}`;
  }

  /**
   * Format date in human-readable format with year
   * @param {Date} date - Date object
   * @returns {string} Formatted date string
   */
  function formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNumber = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${dayNumber}, ${year}`;
  }

  return {
    init,
    update,
    getGreeting,
    formatTime,
    formatDate
  };
})();

// Focus Timer Module
const FocusTimer = (function() {
  const DEFAULT_MINUTES = 25;
  const DEFAULT_SECONDS = 0;

  // DOM references
  let minutesDisplay;   // #timer-minutes-display  (read-only span)
  let secondsDisplay;   // #timer-seconds           (read-only span)
  let inputMinutes;     // #timer-input-minutes     (editable input)
  let inputSeconds;     // #timer-input-seconds     (editable input)
  let setButton;        // #timer-set
  let startButton;
  let stopButton;
  let resetButton;

  // State
  let customTotalSeconds = DEFAULT_MINUTES * 60 + DEFAULT_SECONDS;
  let timeRemaining      = customTotalSeconds;
  let isRunning          = false;
  let intervalId         = null;

  /**
   * Initialize timer with DOM elements
   * @param {HTMLElement} display  - #timer-display wrapper (kept for API compat)
   * @param {HTMLElement} startBtn
   * @param {HTMLElement} stopBtn
   * @param {HTMLElement} resetBtn
   */
  function init(display, startBtn, stopBtn, resetBtn) {
    minutesDisplay = document.getElementById('timer-minutes-display');
    secondsDisplay = document.getElementById('timer-seconds');
    inputMinutes   = document.getElementById('timer-input-minutes');
    inputSeconds   = document.getElementById('timer-input-seconds');
    setButton      = document.getElementById('timer-set');
    startButton    = startBtn;
    stopButton     = stopBtn;
    resetButton    = resetBtn;

    startButton.addEventListener('click', start);
    stopButton.addEventListener('click', stop);
    resetButton.addEventListener('click', reset);
    setButton.addEventListener('click', applyCustomTime);

    updateDisplay();
  }

  /**
   * Read input fields, validate, update customTotalSeconds and timeRemaining,
   * then refresh the main display. Only fires on "Set Waktu" click.
   */
  function applyCustomTime() {
    let mins = parseInt(inputMinutes.value, 10);
    let secs = parseInt(inputSeconds.value, 10);

    // Clamp and sanitize
    if (isNaN(mins) || mins < 0) mins = 0;
    if (mins > 999)              mins = 999;
    if (isNaN(secs) || secs < 0) secs = 0;
    if (secs > 59)               secs = 59;

    // At least 1 second total
    const total = mins * 60 + secs;
    if (total < 1) {
      mins = 0;
      secs = 1;
    }

    // Sync inputs back to clamped values
    inputMinutes.value = mins;
    inputSeconds.value = secs;

    customTotalSeconds = mins * 60 + secs;
    timeRemaining      = customTotalSeconds;

    updateDisplay();
  }

  /**
   * Start the countdown
   */
  function start() {
    if (isRunning) return;

    isRunning = true;
    setInputsDisabled(true);

    intervalId = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        updateDisplay();
      } else {
        stop();
      }
    }, 1000);
  }

  /**
   * Stop / pause the countdown
   */
  function stop() {
    isRunning = false;
    setInputsDisabled(false);

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  /**
   * Reset to the last custom duration set by the user
   */
  function reset() {
    stop();
    timeRemaining      = customTotalSeconds;

    // Sync input fields back to the custom duration
    inputMinutes.value = Math.floor(customTotalSeconds / 60);
    inputSeconds.value = customTotalSeconds % 60;

    updateDisplay();
  }

  /**
   * Enable or disable the set-time inputs and button
   * @param {boolean} disabled
   */
  function setInputsDisabled(disabled) {
    inputMinutes.disabled = disabled;
    inputSeconds.disabled = disabled;
    setButton.disabled    = disabled;
  }

  /**
   * Refresh the read-only display spans
   */
  function updateDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    minutesDisplay.textContent = mins < 10 ? '0' + mins : String(mins);
    secondsDisplay.textContent = secs < 10 ? '0' + secs : String(secs);
  }

  /**
   * Format seconds as MM:SS (kept for API compatibility)
   * @param {number} seconds
   * @returns {string}
   */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }

  return { init, start, stop, reset, formatTime };
})();

// Task Manager Module
const TaskManager = (function() {
  let tasks = [];
  let containerElement;
  let inputElement;
  let addButton;
  let sortSelect;

  /**
   * Initialize task manager with DOM elements
   * @param {HTMLElement} container - Task list container
   * @param {HTMLElement} input - Task input field
   * @param {HTMLElement} addBtn - Add task button
   */
  function init(container, input, addBtn) {
    containerElement = container;
    inputElement = input;
    addButton = addBtn;
    sortSelect = document.getElementById('task-sort');
    
    // Attach event listeners
    addButton.addEventListener('click', handleAddTask);
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleAddTask();
      }
    });
    sortSelect.addEventListener('change', () => render());
    
    // Load tasks from storage
    loadTasks();
  }

  /**
   * Load tasks from Local Storage
   */
  function loadTasks() {
    const savedTasks = StorageManager.get('tasks');
    tasks = savedTasks || [];
    render();
  }

  /**
   * Handle add task button click
   */
  function handleAddTask() {
    const text = inputElement.value.trim();
    if (addTask(text)) {
      inputElement.value = '';
    }
  }

  /**
   * Add new task
   * @param {string} text - Task description
   * @returns {boolean} Success status
   */
  function addTask(text) {
    if (!text) {
      return false;
    }
    
    // Validate max length (500 chars)
    if (text.length > 500) {
      console.warn('Task text exceeds maximum length of 500 characters');
      return false;
    }
    
    // Check for duplicate tasks (case-insensitive)
    const isDuplicate = tasks.some(t => t.text.trim().toLowerCase() === text.trim().toLowerCase());
    if (isDuplicate) {
      Swal.fire({
        icon: 'warning',
        title: 'Duplicate Task',
        text: 'This task already exists.',
        confirmButtonText: 'OK'
      });
      return false;
    }
    
    const task = {
      id: Date.now().toString(),
      text: text,
      completed: false,
      createdAt: Date.now()
    };
    
    tasks.push(task);
    saveTasks();
    render();
    return true;
  }

  /**
   * Edit existing task
   * @param {string} id - Task ID
   * @param {string} newText - New task text
   * @returns {boolean} Success status
   */
  function editTask(id, newText) {
    const trimmedText = newText.trim();
    if (!trimmedText) {
      return false;
    }
    
    // Validate max length (500 chars)
    if (trimmedText.length > 500) {
      console.warn('Task text exceeds maximum length of 500 characters');
      return false;
    }
    
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.text = trimmedText;
      saveTasks();
      render();
      return true;
    }
    return false;
  }

  /**
   * Toggle task completion status
   * @param {string} id - Task ID
   * @returns {boolean} Success status
   */
  function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      render();
      return true;
    }
    return false;
  }

  /**
   * Delete task
   * @param {string} id - Task ID
   * @returns {boolean} Success status
   */
  function deleteTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks.splice(index, 1);
      saveTasks();
      render();
      return true;
    }
    return false;
  }

  /**
   * Return a sorted copy of tasks based on current sort selection.
   * The original tasks array is never mutated so insertion order is preserved.
   * @returns {Array} Sorted tasks array
   */
  function getSortedTasks() {
    const order = sortSelect ? sortSelect.value : 'default';
    if (order === 'default') {
      return tasks.slice();
    }
    return tasks.slice().sort((a, b) => {
      const textA = a.text.trim().toLowerCase();
      const textB = b.text.trim().toLowerCase();
      if (order === 'az') return textA.localeCompare(textB);
      if (order === 'za') return textB.localeCompare(textA);
      return 0;
    });
  }

  /**
   * Render all tasks to DOM
   */
  function render() {
    containerElement.innerHTML = '';
    
    const displayTasks = getSortedTasks();

    if (displayTasks.length === 0) {
      containerElement.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: var(--spacing-lg);">No tasks yet. Add one above!</p>';
      return;
    }
    
    displayTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      containerElement.appendChild(taskElement);
    });
  }

  /**
   * Create task DOM element
   * @param {Object} task - Task object
   * @returns {HTMLElement} Task element
   */
  function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task' + (task.completed ? ' completed' : '');
    taskDiv.setAttribute('role', 'listitem');
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark task "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleComplete(task.id));
    
    // Task text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;
    
    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'task-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit task "${task.text}"`);
    editBtn.addEventListener('click', () => enterEditMode(taskDiv, task));
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.backgroundColor = 'var(--danger)';
    deleteBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    taskDiv.appendChild(checkbox);
    taskDiv.appendChild(textSpan);
    taskDiv.appendChild(actionsDiv);
    
    return taskDiv;
  }

  /**
   * Enter edit mode for a task
   * @param {HTMLElement} taskElement - Task DOM element
   * @param {Object} task - Task object
   */
  function enterEditMode(taskElement, task) {
    const textSpan = taskElement.querySelector('.task-text');
    const actionsDiv = taskElement.querySelector('.task-actions');
    
    // Create edit input
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = task.text;
    editInput.maxLength = 500;
    editInput.setAttribute('aria-label', 'Edit task text');
    
    // Replace text with input
    taskElement.replaceChild(editInput, textSpan);
    editInput.focus();
    editInput.select();
    
    // Save on Enter or blur
    const saveEdit = () => {
      const newText = editInput.value.trim();
      if (newText && newText !== task.text) {
        editTask(task.id, newText);
      } else {
        render(); // Revert if empty or unchanged
      }
    };
    
    // Cancel on Escape
    const cancelEdit = () => {
      render(); // Revert changes
    };
    
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });
    
    editInput.addEventListener('blur', saveEdit);
    
    // Hide action buttons during edit
    actionsDiv.style.display = 'none';
  }

  /**
   * Save tasks to Local Storage
   * @returns {boolean} Success status
   */
  function saveTasks() {
    return StorageManager.set('tasks', tasks);
  }

  return {
    init,
    loadTasks,
    addTask,
    editTask,
    toggleComplete,
    deleteTask,
    render
  };
})();

// Quick Links Module
const QuickLinks = (function() {
  let links = [];
  let containerElement;
  let nameInput;
  let urlInput;
  let addButton;

  /**
   * Initialize quick links with DOM elements
   * @param {HTMLElement} container - Links container
   * @param {HTMLElement} nameIn - Name input field
   * @param {HTMLElement} urlIn - URL input field
   * @param {HTMLElement} addBtn - Add link button
   */
  function init(container, nameIn, urlIn, addBtn) {
    containerElement = container;
    nameInput = nameIn;
    urlInput = urlIn;
    addButton = addBtn;
    
    // Attach event listeners
    addButton.addEventListener('click', handleAddLink);
    
    // Add Enter key support for both inputs
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleAddLink();
      }
    });
    
    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleAddLink();
      }
    });
    
    // Load links from storage
    loadLinks();
  }

  /**
   * Load links from Local Storage
   */
  function loadLinks() {
    const savedLinks = StorageManager.get('quickLinks');
    links = savedLinks || [];
    render();
  }

  /**
   * Handle add link button click
   */
  function handleAddLink() {
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    
    if (addLink(name, url)) {
      nameInput.value = '';
      urlInput.value = '';
    }
  }

  /**
   * Add new quick link
   * @param {string} name - Link name
   * @param {string} url - Link URL
   * @returns {boolean} Success status
   */
  function addLink(name, url) {
    if (!name || !url) {
      return false;
    }
    
    // Ensure URL has protocol
    let validUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      validUrl = 'https://' + url;
    }
    
    // Security: Block javascript: and data: protocols
    if (validUrl.toLowerCase().startsWith('javascript:') || 
        validUrl.toLowerCase().startsWith('data:') ||
        validUrl.toLowerCase().startsWith('vbscript:')) {
      console.warn('Blocked potentially malicious URL:', validUrl);
      return false;
    }
    
    const link = {
      id: Date.now().toString(),
      name: name,
      url: validUrl
    };
    
    links.push(link);
    saveLinks();
    render();
    return true;
  }

  /**
   * Delete quick link
   * @param {string} id - Link ID
   * @returns {boolean} Success status
   */
  function deleteLink(id) {
    const index = links.findIndex(l => l.id === id);
    if (index !== -1) {
      links.splice(index, 1);
      saveLinks();
      render();
      return true;
    }
    return false;
  }

  /**
   * Open link in new tab
   * @param {string} url - URL to open
   */
  function openLink(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Render all links to DOM
   */
  function render() {
    containerElement.innerHTML = '';
    
    if (links.length === 0) {
      containerElement.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: var(--spacing-lg);">No quick links yet. Add one above!</p>';
      return;
    }
    
    links.forEach(link => {
      const linkElement = createLinkElement(link);
      containerElement.appendChild(linkElement);
    });
  }

  /**
   * Create link DOM element
   * @param {Object} link - Link object
   * @returns {HTMLElement} Link element
   */
  function createLinkElement(link) {
    const linkDiv = document.createElement('div');
    linkDiv.className = 'quick-link';
    linkDiv.setAttribute('role', 'listitem');
    
    // Link button
    const linkBtn = document.createElement('button');
    linkBtn.className = 'link-button';
    linkBtn.textContent = link.name;
    linkBtn.setAttribute('aria-label', `Open ${link.name} in new tab`);
    linkBtn.addEventListener('click', () => openLink(link.url));
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'link-delete';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', `Delete link ${link.name}`);
    deleteBtn.addEventListener('click', () => deleteLink(link.id));
    
    linkDiv.appendChild(linkBtn);
    linkDiv.appendChild(deleteBtn);
    
    return linkDiv;
  }

  /**
   * Save links to Local Storage
   * @returns {boolean} Success status
   */
  function saveLinks() {
    return StorageManager.set('quickLinks', links);
  }

  return {
    init,
    loadLinks,
    addLink,
    deleteLink,
    openLink,
    render
  };
})();

// App Controller
const App = (function() {
  /**
   * Initialize entire application
   */
  function init() {
    // Check for Local Storage support via StorageManager
    if (!StorageManager.isStorageAvailable()) {
      console.warn("Local Storage not available. Data will not persist.");
    }
    
    // Initialize Theme Manager (must be first for visual consistency)
    const themeToggle = document.getElementById('theme-toggle');
    ThemeManager.init(themeToggle);
    
    // Initialize Greeting Display
    const greetingEl = document.getElementById('greeting');
    const timeEl = document.getElementById('time-display');
    const dateEl = document.getElementById('date-display');
    GreetingDisplay.init(greetingEl, timeEl, dateEl);
    
    // Initialize Focus Timer
    const timerDisplay = document.getElementById('timer-display');
    const timerStart = document.getElementById('timer-start');
    const timerStop = document.getElementById('timer-stop');
    const timerReset = document.getElementById('timer-reset');
    FocusTimer.init(timerDisplay, timerStart, timerStop, timerReset);
    
    // Initialize Task Manager
    const taskList = document.getElementById('task-list');
    const taskInput = document.getElementById('task-input');
    const taskAdd = document.getElementById('task-add');
    TaskManager.init(taskList, taskInput, taskAdd);
    
    // Initialize Quick Links
    const linkList = document.getElementById('link-list');
    const linkName = document.getElementById('link-name');
    const linkUrl = document.getElementById('link-url');
    const linkAdd = document.getElementById('link-add');
    QuickLinks.init(linkList, linkName, linkUrl, linkAdd);
  }

  return {
    init
  };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
