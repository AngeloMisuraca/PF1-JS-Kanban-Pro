// ---- Estado inicial ----

let state = [
  { id: '101', title: 'Dissenyar base de dades', description: 'Crear esquema ERD', status: 'todo' },
  { id: '102', title: 'Configurar servidor Node', description: 'Express i CORS', status: 'in-progress' }
];

// ---- Referencias al DOM ----

const board = document.getElementById('board');
const form = document.getElementById('new-task-form');
const template = document.getElementById('task-card-template');

// ---- Inicialización ----

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  renderAllTasks();
  setupEventListeners();
  updateTaskCount();
  initDragAndDrop();
  setupHelpTour(); 
}

// ---- Renderizado de tarjetas ----

function createTaskCard(task) {
  const clone = template.content.cloneNode(true);
  const tarjeta = clone.querySelector('.task-card');
  tarjeta.dataset.taskId = task.id;
  clone.querySelector('.task-title').textContent = task.title;
  clone.querySelector('.task-desc').textContent = task.description;

  clone.querySelector('.task-status-select').value = task.status;

  if (task.status === 'done') {
    tarjeta.classList.add('completed');
  }
  return clone;
}

function renderAllTasks() {
  document.getElementById('todo-list').innerHTML = '';
  document.getElementById('in-progress-list').innerHTML = '';
  document.getElementById('done-list').innerHTML = '';

  state.forEach(task => {
    const tarjeta = createTaskCard(task);

    if (task.status === 'todo') {
      document.getElementById('todo-list').appendChild(tarjeta);
    } else if (task.status === 'in-progress') {
      document.getElementById('in-progress-list').appendChild(tarjeta);
    } else if (task.status === 'done') {
      document.getElementById('done-list').appendChild(tarjeta);
    }
  });
}


// ---- Eventos ----

function setupEventListeners() {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value;
    const description = document.getElementById('task-desc-input').value;
    const status = document.getElementById('task-status-select').value;

    const newTask = {
      id: Date.now().toString(),
      title: title,
      description: description,
      status: status
    };

    state.push(newTask);

    renderAllTasks();
    updateTaskCount();

    form.reset();
  });


  board.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-status-select')) {
      const card = e.target.closest('.task-card');
      const taskId = card.dataset.taskId;
      const newStatus = e.target.value;

      let container;

      if (newStatus === 'todo') {
        container = document.getElementById('todo-list');
      } else if (newStatus === 'in-progress') {
        container = document.getElementById('in-progress-list');
      } else if (newStatus === 'done') {
        container = document.getElementById('done-list');
      }

      container.appendChild(card);

      const task = state.find(task => task.id === taskId);

      if (task) {
        task.status = newStatus;
      }

      if (newStatus === 'done') {
        card.classList.add('completed');
      } else {
        card.classList.remove('completed');
      }

      updateTaskCount();
    }
  });

  board.addEventListener('click', (e) => {
    const target = e.target;


    const accordionButton = target.closest('.column-header');

    if (accordionButton) {
      const content = accordionButton.nextElementSibling;
      content.classList.toggle('collapsed');
    }


    const deleteButton = target.closest('.btn-delete');

    if (deleteButton) {
      const card = deleteButton.closest('.task-card');
      const taskId = card.dataset.taskId;

      state = state.filter(task => task.id !== taskId);

      card.remove();

      updateTaskCount();
    }


    const upButton = target.closest('.btn-up');
    const downButton = target.closest('.btn-down');

    if (upButton) {
      const card = upButton.closest('.task-card');
      const previous = card.previousElementSibling;

      if (previous) {
        card.parentNode.insertBefore(card, previous);
      }
    }

    if (downButton) {
      const card = downButton.closest('.task-card');
      const next = card.nextElementSibling;

      if (next) {
        card.parentNode.insertBefore(next, card);
      }
    }
  });
}

// ---- Web Component: contador ----

class TaskBadge extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { this.render(); }

  static get observedAttributes() { return ['count']; }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.render();
  }

  render() {

    const count = this.getAttribute('count') || '0';

    this.shadowRoot.innerHTML = `
      <style>
        span {
          display: inline-block;
          padding: 5px 10px;
          background-color: #3f3f46;
          border: 1px solid #52525b;
          color: white;
          border-radius: 15px;
          font-size: 14px;
          font-weight: bold;
        }
      </style>

      <span>${count}</span>
    `;
  }
}

customElements.define('task-badge', TaskBadge);

function updateTaskCount() {

  const badge = document.getElementById('global-badge');

  const count = state.length;

  badge.setAttribute('count', count);
}

// ---- Drag & drop (SortableJS) ----

function initDragAndDrop() {
  document.querySelectorAll('.column-content').forEach(list => {
    Sortable.create(list, {
      group: 'kanban',
      animation: 150,
      handle: '.drag-handle',
      draggable: '.task-card',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      forceFallback: true,
      fallbackClass: 'sortable-fallback',
      emptyInsertThreshold: 40,
      onStart: () => board.classList.add('is-dragging'),
      onEnd: handleDragEnd
    });
  });
}

function handleDragEnd(evt) {
  const card = evt.item;
  const newStatus = evt.to.closest('.column').dataset.status;

  board.classList.remove('is-dragging');

  card.classList.remove('just-moved');
  void card.offsetWidth;
  card.classList.add('just-moved');
  card.addEventListener('animationend', () => card.classList.remove('just-moved'), { once: true });

  card.querySelector('.task-status-select').value = newStatus;
  card.classList.toggle('completed', newStatus === 'done');

  syncStateFromDOM();
  updateTaskCount();
}

function syncStateFromDOM() {
  const newState = [];
  document.querySelectorAll('.column').forEach(column => {
    column.querySelectorAll('.task-card').forEach(card => {
      const task = state.find(t => t.id === card.dataset.taskId);
      if (task) {
        task.status = column.dataset.status;
        newState.push(task);
      }
    });
  });
  state = newState;
}

// ---- Tutorial (Driver.js) ----

function setupHelpTour() {
  document.getElementById('btn-help').addEventListener('click', startTour);
}

function startTour() {
  const driverObj = window.driver.js.driver({
    showProgress: true,
    nextBtnText: 'Següent →',
    prevBtnText: '← Anterior',
    doneBtnText: 'Entesos!',
    steps: [
      { popover: { title: 'Novetat: arrossegar tasques', description: 'Ara pots moure les tasques entre columnes.' } },
      { element: '.drag-handle', popover: { title: '1. Agafa-la per aquí', description: 'Mantén premuda la icona ⠿.' } },
      { element: '#board', popover: { title: '2. Deixa-la anar', description: 'En una altra columna i l\'estat canvia sol.' } },
      { element: '.column[data-status="done"]', popover: { title: '3. Completar', description: 'A Completat queda ratllada.' } },
      { element: '#btn-help', popover: { title: 'Ajuda', description: 'Torna a veure el tutorial quan vulguis.' } }
    ]
  });
  driverObj.drive();
}