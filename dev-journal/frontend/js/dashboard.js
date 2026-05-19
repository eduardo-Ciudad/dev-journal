// dashboard.js is always at <absolute-base>/frontend/js/dashboard.js
// Strip "js/dashboard.js" to get the frontend/ directory URL
const _dashSrc = document.currentScript ? document.currentScript.src : '';
const FRONTEND_BASE = _dashSrc
  ? _dashSrc.replace(/js\/dashboard\.js[\s\S]*$/, '')
  : '/dev-journal/frontend/';

// Toast system
const toastContainer = document.getElementById('toast-container');

function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span class="toast-msg">${msg}</span>`;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
  setTimeout(() => {
    toast.classList.replace('show', 'hide');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Format helpers
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatTechs(techStr) {
  if (!techStr) return [];
  return techStr.split(',').map(t => t.trim()).filter(Boolean);
}

function productivityDots(level) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="prod-dot${i < level ? ' filled' : ''}"></span>`
  ).join('');
}

// Skeleton
function renderSkeletons(count = 6) {
  const grid = document.getElementById('entries-grid');
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line title"></div>
      <div class="skeleton skeleton-line full"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>
  `).join('');
}

// Render entry card
function renderCard(e) {
  const techs = formatTechs(e.technologies);
  return `
    <div class="entry-card" onclick="window.location.href='${FRONTEND_BASE}entry.html?id=${e.id}'">
      <div class="entry-card-header">
        <span class="entry-date-badge">📅 ${formatDate(e.date)}</span>
        <span class="entry-mood">${e.mood || ''}</span>
      </div>
      <h3 class="entry-title">${escHtml(e.title)}</h3>
      <p class="entry-summary">${escHtml(e.summary)}</p>
      ${techs.length ? `
        <div class="entry-tech-list">
          ${techs.slice(0, 4).map(t => `<span class="tech-badge">${escHtml(t)}</span>`).join('')}
          ${techs.length > 4 ? `<span class="tech-badge">+${techs.length - 4}</span>` : ''}
        </div>
      ` : ''}
      <div class="entry-meta">
        <span class="meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${e.study_hours}h
        </span>
        <span class="meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ${e.commits} commits
        </span>
        <div class="productivity-dots">${productivityDots(e.productivity)}</div>
      </div>
    </div>
  `;
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Stats
async function loadStats() {
  try {
    const s = await api.getStats();
    document.getElementById('stat-entries').textContent = s.totalEntries;
    document.getElementById('stat-hours').textContent = s.totalHours;
    document.getElementById('stat-commits').textContent = s.totalCommits;
    document.getElementById('stat-streak').textContent = s.streak;

    const chart = document.getElementById('tech-chart');
    if (s.topTechnologies && s.topTechnologies.length) {
      const max = s.topTechnologies[0].count;
      chart.innerHTML = s.topTechnologies.map(t => `
        <div class="tech-bar-item">
          <span class="tech-bar-label">${escHtml(t.name)}</span>
          <div class="tech-bar-track">
            <div class="tech-bar-fill" style="width:${Math.round(t.count / max * 100)}%"></div>
          </div>
          <span class="tech-bar-count">${t.count}</span>
        </div>
      `).join('');
    } else {
      chart.innerHTML = '<p style="color:var(--text-secondary);font-size:.85rem">Sem dados ainda</p>';
    }
  } catch (e) {
    console.error('Stats error:', e);
  }
}

// Entries
let allEntries = [];
let activeFilters = {};

function loadFiltersFromStorage() {
  try {
    const saved = localStorage.getItem('dj_filters');
    if (saved) activeFilters = JSON.parse(saved);
  } catch { activeFilters = {}; }
}

function saveFiltersToStorage() {
  localStorage.setItem('dj_filters', JSON.stringify(activeFilters));
}

function applyFiltersToUI() {
  const searchInput = document.getElementById('search-input');
  const techSelect = document.getElementById('filter-tech');
  const prodSelect = document.getElementById('filter-prod');
  const moodSelect = document.getElementById('filter-mood');
  if (activeFilters.search) searchInput.value = activeFilters.search;
  if (activeFilters.technology) techSelect.value = activeFilters.technology;
  if (activeFilters.productivity) prodSelect.value = activeFilters.productivity;
  if (activeFilters.mood) moodSelect.value = activeFilters.mood;
}

async function loadEntries(filters = {}) {
  const grid = document.getElementById('entries-grid');
  renderSkeletons();
  try {
    const entries = await api.getEntries(filters);
    allEntries = entries;

    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = `${entries.length} registro${entries.length !== 1 ? 's' : ''}`;

    if (!entries.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">Nenhum registro encontrado</h3>
          <p class="empty-text">Tente ajustar os filtros ou crie um novo registro.</p>
          <a href="${FRONTEND_BASE}new-entry.html" class="btn btn-primary">+ Novo Registro</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = entries.map(renderCard).join('');
  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔌</div>
        <h3 class="empty-title">Servidor não disponível</h3>
        <p class="empty-text" style="max-width:400px;margin:0 auto 16px">
          Inicie o backend antes de abrir o frontend:<br><br>
          <code style="background:var(--bg);padding:6px 12px;border-radius:6px;font-size:.82rem;display:inline-block">
            cd backend &amp;&amp; npm run dev
          </code>
        </p>
      </div>
    `;
    showToast('Servidor não disponível em localhost:3000', 'error');
  }
}

// Collect unique technologies from entries for filter dropdown
async function populateTechFilter() {
  try {
    const entries = await api.getEntries();
    const techSet = new Set();
    entries.forEach(e => {
      if (e.technologies) e.technologies.split(',').map(t => t.trim()).filter(Boolean).forEach(t => techSet.add(t));
    });
    const select = document.getElementById('filter-tech');
    [...techSet].sort().forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });
  } catch { /* no-op */ }
}

// Event listeners
function initFilters() {
  const searchInput = document.getElementById('search-input');
  const techSelect = document.getElementById('filter-tech');
  const prodSelect = document.getElementById('filter-prod');
  const moodSelect = document.getElementById('filter-mood');
  const clearBtn = document.getElementById('btn-clear-filters');

  let searchDebounce;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      activeFilters.search = searchInput.value.trim();
      saveFiltersToStorage();
      loadEntries(activeFilters);
    }, 350);
  });

  [techSelect, prodSelect, moodSelect].forEach(sel => {
    sel.addEventListener('change', () => {
      if (sel === techSelect) activeFilters.technology = sel.value;
      if (sel === prodSelect) activeFilters.productivity = sel.value;
      if (sel === moodSelect) activeFilters.mood = sel.value;
      saveFiltersToStorage();
      loadEntries(activeFilters);
    });
  });

  clearBtn.addEventListener('click', () => {
    activeFilters = {};
    searchInput.value = '';
    techSelect.value = '';
    prodSelect.value = '';
    moodSelect.value = '';
    saveFiltersToStorage();
    loadEntries({});
  });
}

function initExport() {
  document.getElementById('btn-export')?.addEventListener('click', () => {
    const url = api.exportData();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dev-journal-export.json';
    a.click();
    showToast('Exportação iniciada!', 'success');
  });
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  // Save the dashboard URL so entry/form pages can navigate back correctly
  sessionStorage.setItem('dj_index_url', window.location.href.replace(/[?#].*$/, ''));

  // Wire up "Novo Registro" button using the computed FRONTEND_BASE
  const btnNew = document.getElementById('btn-new-entry');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      window.location.href = FRONTEND_BASE + 'new-entry.html';
    });
  }

  loadFiltersFromStorage();
  applyFiltersToUI();
  initFilters();
  initExport();
  await populateTechFilter();
  await Promise.all([loadStats(), loadEntries(activeFilters)]);
});
