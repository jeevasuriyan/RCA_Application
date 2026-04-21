const ADMIN_API = 'admin/users';

export function initAdminNav() {
  const pill = document.getElementById('pill-admin');
  if (!pill) return;
  if (window.getSessionUser()?.isAdmin) {
    pill.style.display = '';
  }
}

export async function loadAdminUsers() {
  const tbody = document.getElementById('admin-users-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="admin-loading">Loading users…</td></tr>`;

  try {
    const res = await fetch(ADMIN_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const users = await res.json();
    renderAdminUsers(users);
  } catch (err) {
    console.error('Failed to load admin users:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="admin-error">Failed to load users.</td></tr>`;
  }
}

function renderAdminUsers(users) {
  const tbody = document.getElementById('admin-users-body');
  const currentUser = window.getSessionUser();

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(user => {
    const isSelf = user._id?.toString() === currentUser?.id;
    const joinedDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const initials = (user.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return `
      <tr class="admin-user-row ${isSelf ? 'admin-user-self' : ''}">
        <td>
          <div class="admin-user-info">
            <div class="admin-avatar">${initials}</div>
            <span class="admin-user-name">${escAdminHtml(user.name)}${isSelf ? ' <span class="admin-you-badge">You</span>' : ''}</span>
          </div>
        </td>
        <td class="admin-user-email">${escAdminHtml(user.email)}</td>
        <td>
          <span class="admin-role-badge ${user.isAdmin ? 'admin-role-admin' : 'admin-role-user'}">
            ${user.isAdmin ? 'Admin' : 'User'}
          </span>
        </td>
        <td class="admin-user-date">${joinedDate}</td>
        <td>
          <div class="admin-actions">
            ${!isSelf ? `
              <button class="admin-btn admin-btn-toggle" onclick="toggleAdminStatus('${user._id}', ${!user.isAdmin})" title="${user.isAdmin ? 'Revoke admin' : 'Make admin'}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                ${user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
              </button>
              <button class="admin-btn admin-btn-delete" onclick="deleteAdminUser('${user._id}', '${escAdminHtml(user.name)}')" title="Delete user">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                </svg>
                Delete
              </button>
            ` : '<span class="admin-self-note">Current session</span>'}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

export async function toggleAdminStatus(userId, makeAdmin) {
  const label = makeAdmin ? 'grant admin access to' : 'revoke admin access from';
  if (!confirm(`Are you sure you want to ${label} this user?`)) return;

  try {
    const res = await fetch(`${ADMIN_API}/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: makeAdmin }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to update user.');
      return;
    }
    await loadAdminUsers();
  } catch (err) {
    console.error('toggleAdminStatus failed:', err);
    alert('Failed to update user. Please try again.');
  }
}

export async function deleteAdminUser(userId, userName) {
  if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;

  try {
    const res = await fetch(`${ADMIN_API}/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to delete user.');
      return;
    }
    await loadAdminUsers();
  } catch (err) {
    console.error('deleteAdminUser failed:', err);
    alert('Failed to delete user. Please try again.');
  }
}

export async function initAssigneeField() {
  if (!window.getSessionUser()?.isAdmin) return;
  const section = document.getElementById('assignee-section');
  if (section) section.style.display = '';
  await refreshAssigneeDropdown();
}

export async function refreshAssigneeDropdown() {
  const select = document.getElementById('assignee');
  if (!select) return;
  try {
    const res = await fetch(ADMIN_API);
    if (!res.ok) return;
    const users = await res.json();
    const currentVal = select.value;
    select.innerHTML = '<option value="">— Unassigned —</option>';
    users.forEach(user => {
      const opt = document.createElement('option');
      opt.value = user._id;
      opt.dataset.name = user.name;
      opt.dataset.email = user.email;
      opt.textContent = `${user.name} (${user.email})`;
      select.appendChild(opt);
    });
    if (currentVal) select.value = currentVal;
  } catch (err) {
    console.error('Failed to load assignee options:', err);
  }
}

function escAdminHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
