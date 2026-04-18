import { dashboardState, toggleState } from './state.js';

const CREATE_BUTTON_HTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create RCA Report`;
const UPDATE_BUTTON_HTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Update RCA Report`;

export function setToggle(key, value, button) {
  toggleState[key] = value;
  const group = document.getElementById(`toggle-${key}`);
  group.querySelectorAll('.ca-toggle-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

export function resetSubmitButton() {
  const button = document.getElementById('submitBtn');
  if (!button) return;
  button.innerHTML = CREATE_BUTTON_HTML;
  button.classList.remove('editing');
}

export function setSubmitButtonToEdit() {
  const button = document.getElementById('submitBtn');
  if (!button) return;
  button.innerHTML = UPDATE_BUTTON_HTML;
  button.classList.add('editing');
}

export function showCancelEditButton() {
  const button = document.getElementById('cancelEditBtn');
  if (button) button.style.display = 'inline-flex';
}

export function hideCancelEditButton() {
  const button = document.getElementById('cancelEditBtn');
  if (button) button.style.display = 'none';
}

export function switchView(view, fromEdit = false) {
  document.querySelectorAll('.view').forEach(element => element.classList.remove('active'));
  document.getElementById(`view-${view}`)?.classList.add('active');

  document.getElementById('pill-create').classList.toggle('active', view === 'create');
  document.getElementById('pill-reports').classList.toggle('active', view === 'reports');
  document.getElementById('pill-admin')?.classList.toggle('active', view === 'admin');

  if (view === 'create' && !fromEdit && dashboardState.editingId) {
    dashboardState.editingId = null;
    resetSubmitButton();
    hideCancelEditButton();
  }

  if (view === 'admin' && typeof window.loadAdminUsers === 'function') {
    window.loadAdminUsers();
  }
}

export function cancelEdit() {
  dashboardState.editingId = null;
  resetSubmitButton();
  hideCancelEditButton();
  switchView('reports');
}

export function initParticles() {
  const container = document.getElementById('bg-particles');
  if (!container) return;

  for (let i = 0; i < 28; i += 1) {
    const particle = document.createElement('div');
    particle.className = 'bg-particle';
    particle.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${40 + Math.random() * 55}%;
      --pd: ${12 + Math.random() * 14}s;
      --pdelay: ${-(Math.random() * 18)}s;
      --px: ${(Math.random() - 0.5) * 60}px;
      width: ${Math.random() > 0.7 ? 3 : 2}px;
      height: ${Math.random() > 0.7 ? 3 : 2}px;
      opacity: 0;
    `;
    container.appendChild(particle);
  }
}

export function populateNavbarUser() {
  const user = window.getSessionUser ? window.getSessionUser() : null;
  if (!user) return;

  const initials = user.name
    ? user.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const avatarEl = document.getElementById('nav-avatar');
  const nameEl = document.getElementById('nav-user-name');

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = user.name || user.email;
}
