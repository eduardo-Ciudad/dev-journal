const API_BASE = 'http://localhost:3000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const api = {
  getEntries: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    ).toString();
    return request(`/entries${qs ? '?' + qs : ''}`);
  },
  getEntry: (id) => request(`/entries/${id}`),
  createEntry: (body) => request('/entries', { method: 'POST', body: JSON.stringify(body) }),
  updateEntry: (id, body) => request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),
  getStats: () => request('/stats'),
  exportData: () => `${API_BASE}/export`
};

window.api = api;
