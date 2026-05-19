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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
}

function productivityLabel(val) {
  const labels = { 1: 'Muito Baixa', 2: 'Baixa', 3: 'Média', 4: 'Alta', 5: 'Muito Alta' };
  return labels[val] || val;
}

function productivityDots(level) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="prod-dot${i < level ? ' filled' : ''}"></span>`
  ).join('');
}

function showErrorState(msg, isServer = false) {
  const main = document.querySelector('.entry-detail-page');
  main.innerHTML = `
    <div class="empty-state" style="padding:80px 24px">
      <div class="empty-icon">${isServer ? '🔌' : '❌'}</div>
      <h3 class="empty-title">${isServer ? 'Servidor não disponível' : 'Registro não encontrado'}</h3>
      <p class="empty-text">${msg}</p>
      <a href="${INDEX_URL}" class="btn btn-primary" style="margin-top:8px">← Voltar ao Dashboard</a>
    </div>
  `;
}

function renderEntry(e) {
  const techs = (e.technologies || '').split(',').map(t => t.trim()).filter(Boolean);
  const links = (e.links || '').split(',').map(l => l.trim()).filter(Boolean);

  document.getElementById('entry-title').textContent = e.title;
  document.getElementById('entry-date').textContent = formatDate(e.date);
  document.getElementById('entry-mood').textContent = e.mood || '';

  document.getElementById('entry-hours').textContent = e.study_hours;
  document.getElementById('entry-commits').textContent = e.commits;
  document.getElementById('entry-prod-label').textContent = `${e.productivity}/5 — ${productivityLabel(e.productivity)}`;
  document.getElementById('entry-prod-dots').innerHTML = productivityDots(e.productivity);

  document.getElementById('entry-summary').textContent = e.summary || '—';

  const techContainer = document.getElementById('entry-techs');
  if (techs.length) {
    techContainer.innerHTML = techs.map(t =>
      `<span class="tech-badge" style="font-size:.85rem;padding:5px 12px">${escHtml(t)}</span>`
    ).join('');
  } else {
    techContainer.innerHTML = '<span style="color:var(--text-secondary);font-size:.875rem">Nenhuma tecnologia registrada</span>';
  }

  const challengeEl = document.getElementById('entry-challenges');
  challengeEl.closest('.detail-section').style.display = e.challenges ? '' : 'none';
  if (e.challenges) challengeEl.textContent = e.challenges;

  const learningEl = document.getElementById('entry-learnings');
  learningEl.closest('.detail-section').style.display = e.learnings ? '' : 'none';
  if (e.learnings) learningEl.textContent = e.learnings;

  const linksSection = document.getElementById('entry-links-section');
  const linksList = document.getElementById('entry-links');
  if (links.length) {
    linksSection.style.display = '';
    linksList.innerHTML = links.map(l => `
      <a href="${escHtml(l)}" target="_blank" rel="noopener noreferrer" class="link-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        ${escHtml(l)}
      </a>
    `).join('');
  } else {
    linksSection.style.display = 'none';
  }

  if (e.created_at) {
    const el = document.getElementById('entry-created-at');
    if (el) el.textContent = new Date(e.created_at).toLocaleString('pt-BR');
  }
}

function openDeleteModal() {
  document.getElementById('delete-modal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
}

async function deleteEntry(id) {
  try {
    await api.deleteEntry(id);
    showToast('Registro excluído com sucesso!', 'success');
    setTimeout(() => window.location.href = INDEX_URL, 1200);
  } catch (err) {
    showToast(err.message || 'Erro ao excluir', 'error');
    closeDeleteModal();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Fix static links pointing to ../index.html
  document.querySelectorAll('a[href="../index.html"]').forEach(el => { el.href = INDEX_URL; });

  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    showErrorState('Nenhum registro foi selecionado. Volte ao dashboard e clique em um card.');
    return;
  }

  try {
    const entry = await api.getEntry(id);
    renderEntry(entry);

    document.getElementById('btn-edit').addEventListener('click', () => {
      window.location.href = `new-entry.html?id=${id}`;
    });

    document.getElementById('btn-delete').addEventListener('click', openDeleteModal);
    document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('btn-confirm-delete').addEventListener('click', () => deleteEntry(id));

    document.getElementById('delete-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeDeleteModal();
    });

  } catch (err) {
    const isNetworkError = err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('NetworkError');
    if (isNetworkError) {
      showErrorState(
        'Não foi possível conectar ao servidor. Certifique-se de que o backend está rodando:<br><code style="background:var(--bg);padding:4px 8px;border-radius:4px;font-size:.85rem">cd backend && npm run dev</code>',
        true
      );
    } else {
      showErrorState(`Registro #${id} não encontrado. Pode ter sido excluído.`);
    }
  }
});
