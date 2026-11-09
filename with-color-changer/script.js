// DOM element references
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const colorPicker = document.getElementById('color-picker');

// --- State: the array is the single source of truth ---
let tasks = loadTasks();
let currentFilter = 'all';

// --- Local Storage ---
function loadTasks() {
    try {
        const stored = JSON.parse(localStorage.getItem('tasks')) || [];
        // Old saved tasks have no id, so we give them one here
        return stored.map((task, index) => ({
            id: task.id ?? Date.now() + index,
            text: task.text,
            completed: Boolean(task.completed)
        }));
    } catch (error) {
        return [];
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// --- Theme ---
function updateTheme(newColor) {
    document.body.style.backgroundColor = newColor;
    const container = document.querySelector('.container');
    container.style.backgroundColor = newColor;
}

// --- Rendering ---
function render() {
    todoList.innerHTML = '';

    const visibleTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true; //'all'
    });

    visibleTasks.forEach(task => {
        const listItem = document.createElement('li');
        if (task.completed) {
            listItem.classList.add('completed');
        }

        // Task text
        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = task.text;

        // Buttons wrapper
        const actions = document.createElement('div');
        actions.className = 'actions';

        const editButton = document.createElement('button');
        editButton.textContent = '🖋️';
        editButton.className = 'edit-btn';
        editButton.title = 'Edit task';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '✖';
        deleteButton.className = 'delete-btn';
        deleteButton.title = 'Delete task';

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        listItem.appendChild(textSpan);
        listItem.appendChild(actions);
        todoList.appendChild(listItem);

        // Click on the task = toggle completed
        // (We don't call render() here, so a double-click can still reach the text)
        listItem.addEventListener('click', () => {
            task.completed = !task.completed;
            listItem.classList.toggle('completed');
            saveTasks();
            if (currentFilter !== 'all') render(); // New Line
        });

        // Double-click on the text = edit
        textSpan.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            startEditing(task, listItem, textSpan);
        });

        // Edit button
        editButton.addEventListener('click', (event) => {
            event.stopPropagation();
            startEditing(task, listItem, textSpan);
        });

        // Delete button
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            render();
        });
    });
}

// --- Edit mode ---
function startEditing(task, listItem, textSpan) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.text;
    input.className = 'edit-input';

    let finished = false; // stops save/cancel from running twice

    function finishEditing(shouldSave) {
        if (finished) return;
        finished = true;

        const newText = input.value.trim();
        if (shouldSave && newText !== '') {
            task.text = newText;
            saveTasks();
        }
        render();
    }

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            finishEditing(true);
        } else if (event.key === 'Escape') {
            finishEditing(false);
        }
    });

    // Clicking away saves the change
    input.addEventListener('blur', () => finishEditing(true));

    // Clicking inside the input shouldn't toggle the task
    input.addEventListener('click', (event) => event.stopPropagation());

    listItem.replaceChild(input, textSpan);
    input.focus();
    input.select();
}

// --- Add a task ---
function addTask() {
    const taskText = todoInput.value.trim();

    if (taskText === '') {
        alert('Please enter a task description!');
        return;
    }

    tasks.push({
        id: Date.now(),
        text: taskText,
        completed: false
    });

    saveTasks();
    render();

    todoInput.value = '';
    todoInput.focus();
}

// --- Event listeners ---
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        button.classList.add('active');

        render();
    });
});

colorPicker.addEventListener('input', (event) => {
    const selectedColor = event.target.value;
    updateTheme(selectedColor);
    localStorage.setItem('themeColor', selectedColor); // fixed: two separate arguments
});

addButton.addEventListener('click', addTask);

todoInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        addTask();
    }
});

// --- Initialization ---
const savedTheme = localStorage.getItem('themeColor') || '#2c2c4a';
colorPicker.value = savedTheme;
updateTheme(savedTheme);
render();