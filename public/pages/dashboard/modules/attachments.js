import { closureImages, emailImages, screenshots } from './state.js';
import { getImgSrc } from './helpers.js';

function readImageFile(targetList, file, render) {
  const reader = new FileReader();
  reader.onload = event => {
    targetList.push({ file, dataUrl: event.target.result });
    render();
  };
  reader.readAsDataURL(file);
}

function renderAttachmentGrid({ items, gridId, dropzoneId, inputId, removeHandler, altPrefix }) {
  const grid = document.getElementById(gridId);
  const dropzone = document.getElementById(dropzoneId);
  grid.innerHTML = '';

  if (items.length > 0) {
    dropzone.classList.add('has-files');
  } else {
    dropzone.classList.remove('has-files');
  }

  items.forEach((item, index) => {
    const imgSrc = item.isExisting ? getImgSrc(item) : item.dataUrl;
    const thumb = document.createElement('div');
    thumb.className = 'ss-thumb';
    thumb.innerHTML = `
      <img src="${imgSrc}" alt="${altPrefix} ${index + 1}">
      <button class="ss-thumb-remove" onclick="${removeHandler}(${index})" title="Remove">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    grid.appendChild(thumb);
  });

  if (items.length > 0) {
    const addBtn = document.createElement('div');
    addBtn.className = 'ss-add-more';
    addBtn.title = 'Add more';
    addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    addBtn.onclick = event => {
      event.stopPropagation();
      document.getElementById(inputId).click();
    };
    grid.appendChild(addBtn);
  }
}

export function renderEmailImages() {
  renderAttachmentGrid({
    items: emailImages,
    gridId: 'email-grid',
    dropzoneId: 'dz-email',
    inputId: 'file-email',
    removeHandler: 'removeEmailImage',
    altPrefix: 'email',
  });
}

export function renderScreenshots() {
  renderAttachmentGrid({
    items: screenshots,
    gridId: 'screenshots-grid',
    dropzoneId: 'dz-screenshots',
    inputId: 'file-screenshots',
    removeHandler: 'removeScreenshot',
    altPrefix: 'screenshot',
  });
}

export function renderClosureImages() {
  renderAttachmentGrid({
    items: closureImages,
    gridId: 'closure-grid',
    dropzoneId: 'dz-closure',
    inputId: 'file-closure',
    removeHandler: 'removeClosureImage',
    altPrefix: 'closure',
  });
}

export function handleEmailImages(event) {
  const files = Array.from(event.target.files || []);
  files.forEach(file => readImageFile(emailImages, file, renderEmailImages));
  event.target.value = '';
}

export function handleEmailDrop(event) {
  event.preventDefault();
  document.getElementById('dz-email').classList.remove('drag-over');
  const files = Array.from(event.dataTransfer.files || []).filter(file => file.type.startsWith('image/'));
  files.forEach(file => readImageFile(emailImages, file, renderEmailImages));
}

export function removeEmailImage(index) {
  emailImages.splice(index, 1);
  renderEmailImages();
}

export function handleScreenshots(event) {
  const files = Array.from(event.target.files || []);
  files.forEach(file => readImageFile(screenshots, file, renderScreenshots));
  event.target.value = '';
}

export function handleScreenshotDrop(event) {
  event.preventDefault();
  document.getElementById('dz-screenshots').classList.remove('drag-over');
  const files = Array.from(event.dataTransfer.files || []).filter(file => file.type.startsWith('image/'));
  files.forEach(file => readImageFile(screenshots, file, renderScreenshots));
}

export function removeScreenshot(index) {
  screenshots.splice(index, 1);
  renderScreenshots();
}

export function handleClosureImages(event) {
  const files = Array.from(event.target.files || []);
  files.forEach(file => readImageFile(closureImages, file, renderClosureImages));
  event.target.value = '';
}

export function handleClosureDrop(event) {
  event.preventDefault();
  document.getElementById('dz-closure').classList.remove('drag-over');
  const files = Array.from(event.dataTransfer.files || []).filter(file => file.type.startsWith('image/'));
  files.forEach(file => readImageFile(closureImages, file, renderClosureImages));
}

export function removeClosureImage(index) {
  closureImages.splice(index, 1);
  renderClosureImages();
}

export function resetAttachmentState() {
  emailImages.length = 0;
  renderEmailImages();
  closureImages.length = 0;
  renderClosureImages();
  screenshots.length = 0;
  renderScreenshots();
}
