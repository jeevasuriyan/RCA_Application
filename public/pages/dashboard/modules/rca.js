import {
  handleClosureDrop,
  handleClosureImages,
  handleEmailDrop,
  handleEmailImages,
  handleScreenshotDrop,
  handleScreenshots,
  removeClosureImage,
  removeEmailImage,
  removeScreenshot,
  renderClosureImages,
  renderEmailImages,
  renderScreenshots,
  resetAttachmentState,
} from './attachments.js';
import { API, dashboardState, closureImages, emailImages, quill, rcaCache, screenshots, toggleState } from './state.js';
import { escHtml, getImgName, getImgSrc, getPriority, getRecordSnapshot, shake } from './helpers.js';
import {
  hideCancelEditButton,
  resetSubmitButton,
  setSubmitButtonToEdit,
  showCancelEditButton,
  switchView,
} from './ui.js';

export function setFilter(filter, button) {
  dashboardState.currentFilter = filter;
  document.querySelectorAll('.pf').forEach(element => element.classList.remove('active'));
  button.classList.add('active');
  applyFilters();
}

export function applyFilters() {
  const query = (document.getElementById('searchBox')?.value || '').toLowerCase();
  let filtered = dashboardState.allData;

  if (dashboardState.currentFilter !== 'all') {
    filtered = filtered.filter(record => record.priority?.toLowerCase() === dashboardState.currentFilter);
  }

  if (query) {
    filtered = filtered.filter(record =>
      (record.clientName || '').toLowerCase().includes(query)
      || (record.description || '').toLowerCase().includes(query)
      || (record.priority || '').toLowerCase().includes(query)
      || (record.event?.product || '').toLowerCase().includes(query)
      || (record.event?.raisedBy || '').toLowerCase().includes(query)
    );
  }

  renderRCA(filtered);
}

export async function createRCA() {
  const button = document.getElementById('submitBtn');
  const clientName = document.getElementById('clientName').value.trim();
  const priority = document.getElementById('priority').value;

  if (!clientName || !priority) {
    shake(button);
    return;
  }

  const isEditing = !!dashboardState.editingId;
  const editId = dashboardState.editingId;

  button.disabled = true;
  button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0"/></svg> ${isEditing ? 'Updating...' : 'Creating...'}`;

  try {
    const formData = new FormData();
    const fields = {
      clientName,
      priority,
      description: document.getElementById('description').value.trim(),
      raisedBy: document.getElementById('raisedBy').value.trim(),
      product: document.getElementById('product').value.trim(),
      affectedModule: document.getElementById('affectedModule').value.trim(),
      affectedFeature: document.getElementById('affectedFeature').value.trim(),
      clientVersion: document.getElementById('clientVersion').value.trim(),
      serverVersion: document.getElementById('serverVersion').value.trim(),
      agentVersion: document.getElementById('agentVersion').value.trim(),
      detailedDescription: quill.getText().trim() ? quill.root.innerHTML : '',
      correctiveAction: document.getElementById('correctiveAction').value.trim(),
      hotfix: toggleState.hotfix,
      rollback: toggleState.rollback,
      workaround: toggleState.workaround,
      pmCode: document.getElementById('pm-code').value.trim(),
      pmTest: document.getElementById('pm-test').value.trim(),
      pmProcess: document.getElementById('pm-process').value.trim(),
      pmMonitoring: document.getElementById('pm-monitoring').value.trim(),
    };

    fields.existingEmailImages = emailImages.filter(item => item.isExisting).map(item => item.name || item.filename);
    fields.existingClosureImages = closureImages.filter(item => item.isExisting).map(item => item.name || item.filename);
    fields.existingScreenshots = screenshots.filter(item => item.isExisting).map(item => item.name || item.filename);

    formData.append('data', JSON.stringify(fields));

    emailImages
      .filter(item => !item.isExisting)
      .forEach((item, index) => formData.append(`emailImage_${index}`, item.file));
    closureImages
      .filter(item => !item.isExisting)
      .forEach((item, index) => formData.append(`closureImage_${index}`, item.file));
    screenshots
      .filter(item => !item.isExisting)
      .forEach((item, index) => formData.append(`screenshot_${index}`, item.file));

    const response = await fetch(isEditing ? `${API}/${editId}` : API, {
      method: isEditing ? 'PUT' : 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    ['clientName', 'priority', 'raisedBy', 'product', 'affectedModule', 'affectedFeature', 'description',
      'clientVersion', 'serverVersion', 'agentVersion'].forEach(id => {
      document.getElementById(id).value = '';
    });
    quill.setContents([]);
    resetAttachmentState();

    dashboardState.editingId = null;
    button.classList.remove('editing');
    hideCancelEditButton();

    await loadRCA();
    switchView('reports');
  } catch (err) {
    console.error('Failed to create/update RCA:', err);

    try {
      const data = {
        clientName,
        priority,
        description: document.getElementById('description').value.trim(),
        event: {
          raisedBy: document.getElementById('raisedBy').value.trim(),
          product: document.getElementById('product').value.trim(),
          affectedModule: document.getElementById('affectedModule').value.trim(),
          affectedFeature: document.getElementById('affectedFeature').value.trim(),
        },
        versions: {
          client: document.getElementById('clientVersion').value.trim(),
          server: document.getElementById('serverVersion').value.trim(),
          agent: document.getElementById('agentVersion').value.trim(),
        },
        detailedDescription: quill.getText().trim() ? quill.root.innerHTML : '',
        attachments: {
          emailImages: emailImages.map(item => item.file.name),
          closureImages: closureImages.map(item => item.file.name),
          screenshots: screenshots.map(item => item.file.name),
        },
      };

      await fetch(isEditing ? `${API}/${editId}` : API, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      ['clientName', 'priority', 'raisedBy', 'product', 'affectedModule', 'affectedFeature', 'description',
        'clientVersion', 'serverVersion', 'agentVersion'].forEach(id => {
        document.getElementById(id).value = '';
      });
      quill.setContents([]);
      resetAttachmentState();

      dashboardState.editingId = null;
      button.classList.remove('editing');
      hideCancelEditButton();

      await loadRCA();
      switchView('reports');
    } catch (fallbackError) {
      console.error('JSON fallback also failed:', fallbackError);
    }
  } finally {
    button.disabled = false;
    if (dashboardState.editingId) {
      setSubmitButtonToEdit();
    } else {
      resetSubmitButton();
    }
  }
}

export async function loadRCA() {
  try {
    const response = await fetch(API);
    dashboardState.allData = await response.json();
    renderRCA(dashboardState.allData);
    updateStats(dashboardState.allData);
  } catch (error) {
    console.error('Failed to load RCA:', error);
  }
}

export function renderRCA(data) {
  const list = document.getElementById('list');
  const empty = document.getElementById('empty-state');
  list.innerHTML = '';

  if (!data.length) {
    empty.classList.add('visible');
    updateReportsShelfControls();
    return;
  }
  empty.classList.remove('visible');

  const isAdmin = !!window.getSessionUser()?.isAdmin;

  data.forEach((rca, index) => {
    const priority = getPriority(rca.priority);
    const {
      product,
      raisedBy,
      affectedModule,
      affectedFeature,
      vc,
      vs,
      va,
      emailNames,
      closureNames,
      ssNames,
    } = getRecordSnapshot(rca);
    const hasVer = vc || vs || va;
    const dateStr = rca.createdAt
      ? new Date(rca.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';

    if (rca._id) rcaCache[rca._id] = rca;

    const card = document.createElement('div');
    card.className = 'rca-card';
    card.style.animationDelay = `${index * 0.04}s`;
    card.style.setProperty('--priority-color', priority.color);

    card.innerHTML = `
      <div class="card-stripe"></div>
      <div class="card-body">
        <div class="card-head">
          <span class="card-title">${escHtml(rca.title || rca.description || 'Untitled Incident')}</span>
          <span class="pbadge ${priority.cls}">${priority.label}</span>
        </div>
        <div class="card-meta">
          <span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${escHtml(rca.clientName)}
          </span>
          <span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            ${escHtml(product)}
          </span>
          ${affectedModule !== '-' ? `<span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            ${escHtml(affectedModule)}
          </span>` : ''}
          ${affectedFeature !== '-' ? `<span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${escHtml(affectedFeature)}
          </span>` : ''}
          <span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            ${escHtml(raisedBy)}
          </span>
        </div>
        ${hasVer ? `
        <div class="vrow">
          ${vc ? `<span class="vchip"><span class="vchip-lbl">Client</span>v${escHtml(vc)}</span>` : ''}
          ${vs ? `<span class="vchip"><span class="vchip-lbl">Server</span>v${escHtml(vs)}</span>` : ''}
          ${va ? `<span class="vchip"><span class="vchip-lbl">Agent</span>v${escHtml(va)}</span>` : ''}
        </div>` : ''}
        ${rca.description ? `<p class="card-desc">${escHtml(rca.description)}</p>` : ''}
        ${rca.detailedDescription ? `
        <div class="card-rich">
          <div class="ql-snow"><div class="ql-editor card-rich-content">${rca.detailedDescription}</div></div>
        </div>` : ''}
        ${(emailNames.length || closureNames.length || ssNames.length) ? `
        <div class="card-screenshots">
          ${[...emailNames, ...closureNames, ...ssNames].slice(0, 4).map(item => `<div class="cs-thumb"><img src="${getImgSrc(item)}" alt="${escHtml(getImgName(item))}" onerror="this.parentElement.style.display='none'"></div>`).join('')}
          ${(emailNames.length + closureNames.length + ssNames.length) > 4 ? `<div class="cs-more">+${emailNames.length + closureNames.length + ssNames.length - 4}</div>` : ''}
        </div>` : ''}
      </div>
      <div class="card-footer">
        <span class="card-date">${dateStr}</span>
        <div class="card-footer-actions">
          <button class="btn-view" onclick="viewReport('${rca._id}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View
          </button>
          <button class="btn-edit" onclick="editRCA('${rca._id}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          ${isAdmin ? `<button class="btn-del" onclick="deleteRCA('${rca._id}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            Delete
          </button>` : ''}
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  list.scrollLeft = 0;
  updateReportsShelfControls();
}

export function updateStats(data) {
  const critical = data.filter(record => record.priority?.toLowerCase() === 'critical').length;
  const high = data.filter(record => record.priority?.toLowerCase() === 'high').length;
  const medium = data.filter(record => record.priority?.toLowerCase() === 'medium').length;
  document.querySelectorAll('[data-tk="critical"]').forEach(el => el.textContent = critical);
  document.querySelectorAll('[data-tk="high"]').forEach(el => el.textContent = high);
  document.querySelectorAll('[data-tk="medium"]').forEach(el => el.textContent = medium);
  document.querySelectorAll('[data-tk="total"]').forEach(el => el.textContent = data.length);
  document.getElementById('tab-count').textContent = data.length;
}

function getReportsShelfElements() {
  return {
    list: document.getElementById('list'),
    prev: document.getElementById('reports-prev'),
    next: document.getElementById('reports-next'),
  };
}

export function updateReportsShelfControls() {
  const { list, prev, next } = getReportsShelfElements();
  if (!list || !prev || !next) return;

  const canScroll = list.scrollWidth - list.clientWidth > 6;
  const atStart = list.scrollLeft <= 6;
  const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 6;

  prev.disabled = !canScroll || atStart;
  next.disabled = !canScroll || atEnd;
  prev.classList.toggle('hidden', !canScroll);
  next.classList.toggle('hidden', !canScroll);
}

export function scrollReportsShelf(direction) {
  const { list } = getReportsShelfElements();
  if (!list) return;

  const firstCard = list.querySelector('.rca-card');
  if (!firstCard) return;

  const listStyles = window.getComputedStyle(list);
  const gap = parseFloat(listStyles.gap || listStyles.columnGap || '18') || 18;
  const cardWidth = firstCard.getBoundingClientRect().width;
  const visibleCards = Math.max(1, Math.min(5, Math.floor((list.clientWidth + gap) / (cardWidth + gap)) || 1));
  const amount = (cardWidth + gap) * visibleCards;

  list.scrollBy({ left: direction * amount, behavior: 'smooth' });
}

let reportsShelfBound = false;

export function bindReportsShelf() {
  if (reportsShelfBound) return;

  const { list } = getReportsShelfElements();
  if (list) {
    list.addEventListener('scroll', updateReportsShelfControls, { passive: true });
  }

  window.addEventListener('resize', updateReportsShelfControls);
  reportsShelfBound = true;
}

export function editRCA(id) {
  const rca = rcaCache[id];
  if (!rca) {
    console.error('editRCA: record not found for id', id);
    return;
  }

  switchView('create', true);

  document.getElementById('clientName').value = rca.clientName || '';
  document.getElementById('priority').value = rca.priority || '';
  document.getElementById('raisedBy').value = rca.event?.raisedBy || rca.raisedBy || '';
  document.getElementById('product').value = rca.event?.product || rca.product || '';
  document.getElementById('affectedModule').value = rca.event?.affectedModule || rca.affectedModule || '';
  document.getElementById('affectedFeature').value = rca.event?.affectedFeature || rca.affectedFeature || '';
  document.getElementById('description').value = rca.description || '';
  document.getElementById('clientVersion').value = rca.versions?.client || rca.clientVersion || '';
  document.getElementById('serverVersion').value = rca.versions?.server || rca.serverVersion || '';
  document.getElementById('agentVersion').value = rca.versions?.agent || rca.agentVersion || '';

  if (document.getElementById('correctiveAction')) {
    document.getElementById('correctiveAction').value = rca.correctiveAction || '';
  }

  ['pm-code', 'pm-test', 'pm-process', 'pm-monitoring'].forEach(fieldId => {
    const fieldKey = fieldId.replace('pm-', 'pm');
    if (document.getElementById(fieldId)) {
      document.getElementById(fieldId).value = rca[fieldKey] || rca[fieldId] || '';
    }
  });

  if (rca.detailedDescription) {
    quill.root.innerHTML = rca.detailedDescription;
  } else {
    quill.setContents([]);
  }

  ['hotfix', 'rollback', 'workaround'].forEach(key => {
    const value = rca[key] || toggleState[key];
    const group = document.getElementById(`toggle-${key}`);
    if (group) {
      group.querySelectorAll('.ca-toggle-btn').forEach(button => {
        button.classList.toggle('active', button.dataset.val === value);
      });
      toggleState[key] = value;
    }
  });

  dashboardState.editingId = rca._id || null;
  setSubmitButtonToEdit();
  showCancelEditButton();

  resetAttachmentState();

  const { emailNames, closureNames, ssNames } = getRecordSnapshot(rca);
  const toExistingEntry = item => (
    typeof item === 'object'
      ? { name: item.name, data: item.data, isExisting: true }
      : { name: item, filename: item, isExisting: true }
  );

  if (emailNames.length) {
    emailNames.forEach(item => emailImages.push(toExistingEntry(item)));
    renderEmailImages();
  }
  if (closureNames.length) {
    closureNames.forEach(item => closureImages.push(toExistingEntry(item)));
    renderClosureImages();
  }
  if (ssNames.length) {
    ssNames.forEach(item => screenshots.push(toExistingEntry(item)));
    renderScreenshots();
  }

  document.getElementById('view-create').scrollIntoView({ behavior: 'smooth' });
}

export async function deleteRCA(id) {
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    await loadRCA();
  } catch (error) {
    console.error('Delete failed:', error);
  }
}

export {
  handleClosureDrop,
  handleClosureImages,
  handleEmailDrop,
  handleEmailImages,
  removeClosureImage,
  removeEmailImage,
  removeScreenshot,
  handleScreenshotDrop,
  handleScreenshots,
};
