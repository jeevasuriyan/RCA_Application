/* ════════════════════════════════════════════════════════════
   AUTH.JS  —  Shared helpers for all auth pages
════════════════════════════════════════════════════════════ */

const AUTH_PAGES = ['/auth/login.html', '/auth/signup.html',
                   '/auth/forgot-password.html', '/auth/reset-password.html'];

/* ── Storage helpers ── */
function getToken()    { return localStorage.getItem('rca_token'); }
function setToken(t)   { localStorage.setItem('rca_token', t); }
function getUser()     { try { return JSON.parse(localStorage.getItem('rca_user')); } catch { return null; } }
function setUser(u)    { localStorage.setItem('rca_user', JSON.stringify(u)); }
function clearSession(){ localStorage.removeItem('rca_token'); localStorage.removeItem('rca_user'); }

/* ── Redirect helpers ── */
function redirectTo(path) { window.location.replace(path); }

function requireGuest() {
  if (getToken()) redirectTo('/');
}

function requireAuth() {
  if (!getToken()) redirectTo('/auth/login.html');
}

function logout() {
  clearSession();
  redirectTo('/auth/login.html');
}

/* ── API ── */
async function api(method, path, body, useToken = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (useToken) {
    const t = getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }
  const res  = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/* ── Alert box ── */
function showAlert(elOrId, message, type = 'error') {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  const icons = { error: '⚠', success: '✓', info: 'ℹ' };
  el.className = `auth-alert ${type}`;
  el.innerHTML = `<span class="auth-alert-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
}
function hideAlert(elOrId) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (el) el.className = 'auth-alert hidden';
}

/* ── Toast ── */
function toast(message, type = 'info', ms = 4000) {
  let stack = document.querySelector('.toasts');
  if (!stack) { stack = document.createElement('div'); stack.className = 'toasts'; document.body.appendChild(stack); }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 320);
  }, ms);
}

/* ── Button loading state ── */
function setLoading(btn, on) {
  btn.disabled = on;
  on ? btn.classList.add('is-loading') : btn.classList.remove('is-loading');
}

/* ── Password visibility toggle ── */
function initEyeToggles() {
  document.querySelectorAll('.eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = btn.closest('.input-wrap').querySelector('.form-input');
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.innerHTML = show ? eyeOffIcon() : eyeIcon();
    });
  });
}

/* ── Password strength ── */
function initStrength(inputId, meterId) {
  const inp   = document.getElementById(inputId);
  const meter = document.getElementById(meterId);
  if (!inp || !meter) return;
  inp.addEventListener('input', () => {
    const v = inp.value;
    let s = 0;
    if (v.length >= 8)        s++;
    if (/[A-Z]/.test(v))      s++;
    if (/[0-9]/.test(v))      s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    const bars   = meter.querySelectorAll('.pwd-bar');
    const labels = ['','Weak','Fair','Good','Strong'];
    const cls    = ['','s1','s2','s3','s4'];
    const colors = ['','var(--error)','var(--warn)','#d4a93a','var(--success)'];
    bars.forEach((b,i) => { b.className = 'pwd-bar'; if (i < s) b.classList.add(cls[s]); });
    const lbl = meter.querySelector('.pwd-label');
    if (lbl) { lbl.textContent = v ? labels[s] : ''; lbl.style.color = colors[s]; }
  });
}

/* ── SVG icons ── */
function eyeIcon()    { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`; }
function eyeOffIcon() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`; }

/* ── Expose globally ── */
window.AUTH = {
  getToken, setToken, getUser, setUser, clearSession,
  requireGuest, requireAuth, logout,
  api, showAlert, hideAlert, toast,
  setLoading, initEyeToggles, initStrength,
  eyeIcon, eyeOffIcon,
};
