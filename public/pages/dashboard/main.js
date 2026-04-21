import { addRuntimeStyles } from './modules/helpers.js';
import {
  applyFilters,
  createRCA,
  deleteRCA,
  editRCA,
  handleClosureDrop,
  handleClosureImages,
  handleEmailDrop,
  handleEmailImages,
  handleScreenshotDrop,
  handleScreenshots,
  loadRCA,
  removeClosureImage,
  removeEmailImage,
  removeScreenshot,
  bindReportsShelf,
  setFilter,
  scrollReportsShelf,
} from './modules/rca.js';
import {
  bindReportEvents,
  closeLightbox,
  closeReportModal,
  downloadPDF,
  downloadWordDoc,
  openLightbox,
  viewReport,
} from './modules/reporting.js';
import { deleteAdminUser, initAdminNav, initAssigneeField, loadAdminUsers, toggleAdminStatus } from './modules/admin.js';
import { cancelEdit, populateNavbarUser, setToggle, switchView } from './modules/ui.js';

window.setToggle = setToggle;
window.handleEmailImages = handleEmailImages;
window.handleEmailDrop = handleEmailDrop;
window.removeEmailImage = removeEmailImage;
window.handleScreenshots = handleScreenshots;
window.handleScreenshotDrop = handleScreenshotDrop;
window.removeScreenshot = removeScreenshot;
window.handleClosureImages = handleClosureImages;
window.handleClosureDrop = handleClosureDrop;
window.removeClosureImage = removeClosureImage;
window.switchView = switchView;
window.cancelEdit = cancelEdit;
window.setFilter = setFilter;
window.scrollReportsShelf = scrollReportsShelf;
window.filterRCA = applyFilters;
window.createRCA = createRCA;
window.editRCA = editRCA;
window.deleteRCA = deleteRCA;
window.viewReport = viewReport;
window.closeReportModal = closeReportModal;
window.downloadWordDoc = downloadWordDoc;
window.downloadPDF = downloadPDF;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.loadAdminUsers = loadAdminUsers;
window.toggleAdminStatus = toggleAdminStatus;
window.deleteAdminUser = deleteAdminUser;

addRuntimeStyles();

// Fetch fresh user data from server to ensure isAdmin is current
fetch('/auth/me')
  .then(r => r.ok ? r.json() : null)
  .then(user => {
    if (user) {
      localStorage.setItem('rca_user', JSON.stringify(user));
    }
    populateNavbarUser();
    initAdminNav();
    initAssigneeField();
  })
  .catch(() => {
    populateNavbarUser();
    initAdminNav();
    initAssigneeField();
  });

bindReportEvents();
bindReportsShelf();
loadRCA();
