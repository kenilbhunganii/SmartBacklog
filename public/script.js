/* ── State ──────────────────────────────────── */
let allTickets = [];
let dragId     = null;

/* ── Boot ───────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadTickets();
  document.getElementById("title").addEventListener("keydown", e => {
    if (e.key === "Enter") addTicket();
  });
  initDropZones();
});

/* ── Load ───────────────────────────────────── */
async function loadTickets() {
  try {
    const res = await fetch("/tickets");
    allTickets = await res.json();
    renderBoard();
  } catch (err) {
    showToast("Failed to load tickets");
  }
}

/* ── Render Board ───────────────────────────── */
function renderBoard() {
  const cols = { todo: [], progress: [], done: [] };
  allTickets.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });

  renderColumn("todo",     cols.todo);
  renderColumn("progress", cols.progress);
  renderColumn("done",     cols.done);
  updateStats(cols);
}

function renderColumn(status, tickets) {
  const container = document.getElementById(status);
  const emptyEl   = document.getElementById("empty-" + status);
  const badge     = document.getElementById("badge-" + status);

  container.innerHTML = "";
  badge.textContent = tickets.length;

  if (tickets.length === 0) {
    emptyEl.classList.add("visible");
  } else {
    emptyEl.classList.remove("visible");
    tickets.forEach(ticket => container.appendChild(createCard(ticket)));
  }
}

/* ── Create Card ────────────────────────────── */
function createCard(ticket) {
  const div = document.createElement("div");
  div.className = "ticket";
  div.dataset.id = ticket.id;
  div.draggable = true;

  const shortId = String(ticket.id).slice(-6);

  // Smart forward-only button
  let actionBtn = "";
  if (ticket.status === "todo") {
    actionBtn = `<button class="action-btn action-btn--next" onclick="move(${ticket.id}, 'progress')">→ Progress</button>`;
  } else if (ticket.status === "progress") {
    actionBtn = `<button class="action-btn action-btn--next" onclick="move(${ticket.id}, 'done')">→ Done</button>`;
  }
  // done = no move button

  div.innerHTML = `
    <div class="ticket-top-row">
      <div class="ticket-id">TKT-${shortId}</div>
      <div class="drag-handle" title="Drag to move">⠿</div>
    </div>
    <div class="ticket-title">${escapeHTML(ticket.title)}</div>
    <div class="ticket-actions">
      ${actionBtn}
      <button class="action-btn action-btn--delete" onclick="deleteTicket(${ticket.id})" title="Delete task">✕</button>
    </div>
  `;

  /* ── Drag events ── */
  div.addEventListener("dragstart", e => {
    dragId = ticket.id;
    div.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(ticket.id));
    setTimeout(() => div.classList.add("drag-ghost"), 0);
  });

  div.addEventListener("dragend", () => {
    dragId = null;
    div.classList.remove("dragging", "drag-ghost");
    document.querySelectorAll(".col-body").forEach(c => c.classList.remove("drag-over"));
  });

  return div;
}

/* ── Drop Zones ─────────────────────────────── */
function initDropZones() {
  ["todo", "progress", "done"].forEach(status => {
    const body = document.getElementById(status);

    body.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      document.querySelectorAll(".col-body").forEach(c => c.classList.remove("drag-over"));
      body.classList.add("drag-over");
    });

    body.addEventListener("dragleave", e => {
      if (!body.contains(e.relatedTarget)) {
        body.classList.remove("drag-over");
      }
    });

    body.addEventListener("drop", e => {
      e.preventDefault();
      body.classList.remove("drag-over");
      if (dragId === null) return;
      const ticket = allTickets.find(t => t.id === dragId);
      if (!ticket || ticket.status === status) return;
      move(dragId, status);
    });
  });
}

/* ── Stats ──────────────────────────────────── */
function updateStats(cols) {
  const todo     = cols.todo.length;
  const progress = cols.progress.length;
  const done     = cols.done.length;
  const total    = todo + progress + done;
  const rate     = total > 0 ? Math.round((done / total) * 100) : 0;

  animateNum("todoCount",     todo);
  animateNum("progressCount", progress);
  animateNum("doneCount",     done);
  animateNum("totalCount",    total);
  document.getElementById("completionRate").textContent = rate + "%";
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step = target > current ? 1 : -1;
  let val = current;
  const interval = setInterval(() => {
    val += step;
    el.textContent = val;
    if (val === target) clearInterval(interval);
  }, 30);
}

/* ── Add Ticket ─────────────────────────────── */
async function addTicket() {
  const input = document.getElementById("title");
  const title = input.value.trim();
  if (!title) { input.focus(); return; }

  try {
    const res = await fetch("/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    const ticket = await res.json();
    allTickets.push(ticket);
    renderBoard();
    input.value = "";
    input.focus();
    showToast("Task added");
  } catch (err) {
    showToast("Failed to add task");
  }
}

/* ── Move Ticket ────────────────────────────── */
async function move(id, status) {
  try {
    await fetch("/tickets/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    allTickets = allTickets.map(t => t.id === id ? { ...t, status } : t);
    renderBoard();
    const labels = { todo: "To Do", progress: "In Progress", done: "Done" };
    showToast("Moved to " + labels[status]);
  } catch (err) {
    showToast("Failed to move task");
  }
}

/* ── Delete Ticket ──────────────────────────── */
async function deleteTicket(id) {
  try {
    await fetch("/tickets/" + id, { method: "DELETE" });
    allTickets = allTickets.filter(t => t.id !== id);
    renderBoard();
    showToast("Task deleted");
  } catch (err) {
    showToast("Failed to delete task");
  }
}

/* ── AI Suggest ─────────────────────────────── */
async function generateAI() {
  const title = document.getElementById("title").value.trim();
  openModal();
  try {
    const res = await fetch("/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "Generic task" })
    });
    const data = await res.json();
    renderModalContent(data, title);
  } catch (err) {
    renderModalError();
  }
}

function renderModalContent(data, title) {
  const body = document.getElementById("modalBody");

  if (data.acceptanceCriteria) {
    const criteriaHTML = data.acceptanceCriteria
      .map(c => `<li>${escapeHTML(c)}</li>`).join("");
    body.innerHTML = `
      <div class="ai-result">
        ${title ? `<div class="ai-result-task">Task: ${escapeHTML(title)}</div>` : ""}
        <div>
          <div class="ai-section-title">Acceptance Criteria</div>
          <ul class="ai-criteria-list">${criteriaHTML}</ul>
        </div>
        <div class="ai-meta-row">
          <div class="ai-meta-chip">
            <div class="chip-label">Story Points</div>
            <div class="chip-value">${data.storyPoints}</div>
          </div>
          <div class="ai-meta-chip">
            <div class="chip-label">Priority</div>
            <div class="chip-value">${data.priority}</div>
          </div>
        </div>
      </div>`;
    return;
  }

  if (data.result) {
    body.innerHTML = `
      <div class="ai-result">
        ${title ? `<div class="ai-result-task">Task: ${escapeHTML(title)}</div>` : ""}
        <div>
          <div class="ai-section-title">AI Analysis</div>
          <div class="ai-raw">${escapeHTML(data.result)}</div>
        </div>
      </div>`;
    return;
  }

  renderModalError();
}

function renderModalError() {
  document.getElementById("modalBody").innerHTML = `
    <div class="ai-result">
      <div class="ai-section-title">Error</div>
      <p style="font-size:13px;color:var(--gray-500);font-family:var(--font-mono);">
        AI service unavailable. Add OPENAI_API_KEY to .env to enable.
      </p>
    </div>`;
}

/* ── Modal ──────────────────────────────────── */
function openModal() {
  document.getElementById("modalBody").innerHTML = `
    <div class="modal-loading">
      <div class="loader-dots"><span></span><span></span><span></span></div>
      <p class="loading-text">Analyzing task...</p>
    </div>`;
  document.getElementById("aiModal").classList.add("open");
}

function closeModal() {
  document.getElementById("aiModal").classList.remove("open");
}

document.getElementById("aiModal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

/* ── Toast ──────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ── Helpers ────────────────────────────────── */
function escapeHTML(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}