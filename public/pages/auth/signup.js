const THEMES = [
  {
    name: 'Midnight Gold',
    orbs: ['rgba(201,168,76,.13)', 'rgba(61,191,160,.08)', 'rgba(201,168,76,.07)', 'rgba(61,191,160,.05)'],
    color: '#c9a84c',
    bar: 'linear-gradient(90deg,#c9a84c,#b8903a,#dfc060)',
  },
  {
    name: 'Deep Ocean',
    orbs: ['rgba(32,178,230,.14)', 'rgba(61,191,160,.10)', 'rgba(0,149,255,.08)', 'rgba(32,178,230,.06)'],
    color: '#20b2e6',
    bar: 'linear-gradient(90deg,#20b2e6,#0095ff,#3dbfa0)',
  },
  {
    name: 'Cosmic Violet',
    orbs: ['rgba(139,92,246,.14)', 'rgba(192,132,252,.09)', 'rgba(236,72,153,.08)', 'rgba(99,102,241,.06)'],
    color: '#8b5cf6',
    bar: 'linear-gradient(90deg,#8b5cf6,#6366f1,#ec4899)',
  },
  {
    name: 'Aurora',
    orbs: ['rgba(16,185,129,.13)', 'rgba(6,182,212,.09)', 'rgba(34,211,238,.07)', 'rgba(16,185,129,.05)'],
    color: '#10b981',
    bar: 'linear-gradient(90deg,#10b981,#06b6d4,#22d3ee)',
  },
  {
    name: 'Solar Flare',
    orbs: ['rgba(249,115,22,.13)', 'rgba(239,68,68,.10)', 'rgba(245,158,11,.08)', 'rgba(249,115,22,.05)'],
    color: '#f97316',
    bar: 'linear-gradient(90deg,#f97316,#ef4444,#f59e0b)',
  },
  {
    name: 'Stellar Blue',
    orbs: ['rgba(59,130,246,.14)', 'rgba(147,197,253,.08)', 'rgba(99,179,237,.07)', 'rgba(59,130,246,.05)'],
    color: '#3b82f6',
    bar: 'linear-gradient(90deg,#3b82f6,#60a5fa,#93c5fd)',
  },
  {
    name: 'Rose Nebula',
    orbs: ['rgba(236,72,153,.13)', 'rgba(167,139,250,.09)', 'rgba(251,113,133,.08)', 'rgba(236,72,153,.05)'],
    color: '#ec4899',
    bar: 'linear-gradient(90deg,#ec4899,#a78bfa,#fb7185)',
  },
  {
    name: 'Carbon Green',
    orbs: ['rgba(52,211,153,.12)', 'rgba(74,222,128,.08)', 'rgba(16,185,129,.07)', 'rgba(52,211,153,.05)'],
    color: '#34d399',
    bar: 'linear-gradient(90deg,#34d399,#4ade80,#10b981)',
  },
];

(function applyTheme() {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const root = document.documentElement;
  root.style.setProperty('--orb-1', theme.orbs[0]);
  root.style.setProperty('--orb-2', theme.orbs[1]);
  root.style.setProperty('--orb-3', theme.orbs[2]);
  root.style.setProperty('--orb-4', theme.orbs[3]);
  root.style.setProperty('--theme-bar', theme.bar);
  root.style.setProperty('--theme-color', theme.color);
  document.getElementById('theme-badge').textContent = theme.name;
}());

function fitSignupCard() {
  const root = document.documentElement;
  const page = document.querySelector('.auth-page');
  const stage = document.querySelector('.signup-stage');
  const card = document.querySelector('.signup-stage .auth-card');

  if (!page || !stage || !card) return;

  root.style.setProperty('--signup-scale', '1');
  stage.style.width = '100%';
  stage.style.height = 'auto';

  const pageStyles = window.getComputedStyle(page);
  const padY = parseFloat(pageStyles.paddingTop) + parseFloat(pageStyles.paddingBottom);
  const padX = parseFloat(pageStyles.paddingLeft) + parseFloat(pageStyles.paddingRight);
  const availableHeight = Math.max(window.innerHeight - padY, 320);
  const availableWidth = Math.max(window.innerWidth - padX, 280);
  const cardHeight = card.offsetHeight;
  const cardWidth = card.offsetWidth;

  const scale = Math.min(1, availableHeight / cardHeight, availableWidth / cardWidth);

  root.style.setProperty('--signup-scale', scale.toFixed(4));
  stage.style.width = `${Math.round(cardWidth * scale)}px`;
  stage.style.height = `${Math.round(cardHeight * scale)}px`;
}

AUTH.requireGuest();
AUTH.initEyeToggles();
AUTH.initStrength('password', 'pwd-meter');

const confirmEl = document.getElementById('confirm');
const matchHint = document.getElementById('match-hint');

confirmEl.addEventListener('input', () => {
  const password = document.getElementById('password').value;
  if (!confirmEl.value) {
    matchHint.style.display = 'none';
    requestAnimationFrame(fitSignupCard);
    return;
  }

  const match = password === confirmEl.value;
  matchHint.style.display = 'block';
  matchHint.style.color = match ? 'var(--success)' : 'var(--error)';
  matchHint.textContent = match ? 'Passwords match' : 'Passwords do not match';
  requestAnimationFrame(fitSignupCard);
});

window.addEventListener('resize', fitSignupCard);
window.addEventListener('load', fitSignupCard);
requestAnimationFrame(fitSignupCard);

document.getElementById('signup-form').addEventListener('submit', async event => {
  event.preventDefault();
  AUTH.hideAlert('alert');

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;
  const button = document.getElementById('submit-btn');

  if (!name || !email || !password || !confirm) {
    AUTH.showAlert('alert', 'Please fill in all fields.');
    return;
  }
  if (name.length < 2) {
    AUTH.showAlert('alert', 'Name must be at least 2 characters.');
    return;
  }
  if (password.length < 8) {
    AUTH.showAlert('alert', 'Password must be at least 8 characters.');
    return;
  }
  if (password !== confirm) {
    AUTH.showAlert('alert', 'Passwords do not match.');
    return;
  }

  AUTH.setLoading(button, true);
  try {
    const data = await AUTH.api('POST', '/auth/signup', { name, email, password });
    AUTH.setToken(data.token);
    AUTH.setUser(data.user);
    AUTH.toast(`Welcome, ${data.user.name}! Account created.`, 'success', 1800);
    setTimeout(() => window.location.replace('/'), 1000);
  } catch (err) {
    AUTH.showAlert('alert', err.message);
    AUTH.setLoading(button, false);
  }
});
