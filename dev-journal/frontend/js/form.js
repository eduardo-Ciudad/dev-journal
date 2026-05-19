// Read the dashboard URL saved when the user was on the index page
const INDEX_URL = sessionStorage.getItem('dj_index_url')
  || document.referrer
  || '/index.html';

const toastContainer = document.getElementById('toast-container');

function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
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

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// Productivity rating
let selectedProductivity = 3;
function initProductivityRating() {
  document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedProductivity = parseInt(btn.dataset.value);
      document.querySelectorAll('.rating-btn').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.value) === selectedProductivity));
    });
  });
  // Set default
  document.querySelector(`.rating-btn[data-value="3"]`)?.classList.add('selected');
}

function setProductivity(val) {
  selectedProductivity = parseInt(val) || 3;
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.value) === selectedProductivity));
}

// Mood selection
let selectedMood = '';
function initMoodSelection() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      selectedMood = selectedMood === val ? '' : val;
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b.dataset.value === selectedMood));
    });
  });
}

function setMood(val) {
  selectedMood = val || '';
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b.dataset.value === selectedMood));
}

// Validation
function validateForm(data) {
  const errors = {};
  if (!data.date) errors.date = 'Data é obrigatória';
  if (!data.title?.trim()) errors.title = 'Título é obrigatório';
  if (!data.summary?.trim()) errors.summary = 'Resumo é obrigatório';
  if (data.productivity < 1 || data.productivity > 5) errors.productivity = 'Selecione entre 1 e 5';
  if (data.study_hours < 0) errors.study_hours = 'Deve ser >= 0';
  if (data.commits < 0) errors.commits = 'Deve ser >= 0';
  return errors;
}

function showErrors(errors) {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
  Object.entries(errors).forEach(([field, msg]) => {
    const input = document.getElementById(`field-${field}`);
    const errEl = document.getElementById(`err-${field}`);
    if (input) input.classList.add('error');
    if (errEl) errEl.textContent = msg;
  });
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
}

function getFormData() {
  const g = (id) => document.getElementById(id)?.value ?? '';
  return {
    date: g('field-date'),
    title: g('field-title').trim(),
    summary: g('field-summary').trim(),
    technologies: g('field-technologies').trim(),
    challenges: g('field-challenges').trim(),
    learnings: g('field-learnings').trim(),
    study_hours: parseFloat(g('field-study_hours')) || 0,
    links: g('field-links').trim(),
    commits: parseInt(g('field-commits')) || 0,
    productivity: selectedProductivity,
    mood: selectedMood
  };
}

function fillForm(entry) {
  const s = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
  s('field-date', entry.date);
  s('field-title', entry.title);
  s('field-summary', entry.summary);
  s('field-technologies', entry.technologies);
  s('field-challenges', entry.challenges);
  s('field-learnings', entry.learnings);
  s('field-study_hours', entry.study_hours);
  s('field-links', entry.links);
  s('field-commits', entry.commits);
  setProductivity(entry.productivity);
  setMood(entry.mood);
}

async function submitForm(entryId) {
  clearErrors();
  const data = getFormData();
  const errors = validateForm(data);

  if (Object.keys(errors).length) {
    showErrors(errors);
    showToast('Corrija os campos destacados', 'warning');
    return;
  }

  const submitBtn = document.getElementById('btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Salvando...';

  try {
    if (entryId) {
      await api.updateEntry(entryId, data);
      showToast('Registro atualizado com sucesso!', 'success');
    } else {
      await api.createEntry(data);
      showToast('Registro criado com sucesso!', 'success');
    }
    setTimeout(() => window.location.href = INDEX_URL, 1200);
  } catch (err) {
    showToast(err.message || 'Erro ao salvar', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = entryId ? 'Salvar Alterações' : 'Criar Registro';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Fix static links pointing to ../index.html
  document.querySelectorAll('a[href="../index.html"]').forEach(el => { el.href = INDEX_URL; });

  initProductivityRating();
  initMoodSelection();

  // Default date = today
  const dateField = document.getElementById('field-date');
  if (dateField && !dateField.value) {
    dateField.value = new Date().toISOString().split('T')[0];
  }

  const entryId = getParam('id');
  const pageTitle = document.getElementById('page-title');
  const submitBtn = document.getElementById('btn-submit');

  if (entryId) {
    if (pageTitle) pageTitle.textContent = 'Editar Registro';
    if (submitBtn) submitBtn.textContent = 'Salvar Alterações';

    try {
      const entry = await api.getEntry(entryId);
      fillForm(entry);
    } catch (err) {
      showToast('Registro não encontrado', 'error');
      setTimeout(() => window.location.href = INDEX_URL, 1500);
      return;
    }
  }

  document.getElementById('entry-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(entryId || null);
  });

  document.getElementById('btn-cancel')?.addEventListener('click', () => {
    if (entryId) {
      window.location.href = `entry.html?id=${entryId}`;
    } else {
      window.location.href = INDEX_URL;
    }
  });
});
