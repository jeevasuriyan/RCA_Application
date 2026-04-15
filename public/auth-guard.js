/**
 * auth-guard.js
 * Included in index.html BEFORE app.js.
 * 1. Redirects unauthenticated visitors to /auth/login.html
 * 2. Intercepts every fetch() to automatically attach the Bearer token
 * 3. Handles 401 responses by clearing the session and redirecting to login
 */
(function () {
  'use strict';

  const AUTH_PREFIX = '/auth/';
  const LOGIN_PAGE  = '/auth/login.html';
  const TOKEN_KEY   = 'rca_token';
  const USER_KEY    = 'rca_user';

  // ── Guard: if no token and not already on an auth page, bounce to login ──
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith(AUTH_PREFIX)) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      window.location.replace(LOGIN_PAGE);
      // Stop executing the rest of this script; the page is being replaced
      throw new Error('[auth-guard] No session — redirecting to login.');
    }
  }

  // ── Patch fetch to inject Authorization header and handle 401 ────────────
  const _fetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    init = init || {};

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Build a proper Headers object so we don't clobber multipart boundaries etc.
      const headers = new Headers(init.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', 'Bearer ' + token);
      }
      init = Object.assign({}, init, { headers });
    }

    return _fetch(input, init).then(function (response) {
      // If the server rejects our token, log out and redirect
      if (response.status === 401) {
        const url = typeof input === 'string' ? input : (input.url || '');
        // Don't loop on auth endpoints themselves
        if (!url.includes('/auth/')) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          window.location.replace(LOGIN_PAGE);
        }
      }
      return response;
    });
  };

  // ── Expose helpers used by app.js / navbar ────────────────────────────────
  window.getSessionUser = function () {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  };

  window.logoutUser = function () {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace(LOGIN_PAGE);
  };
}());
