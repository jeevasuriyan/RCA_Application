export const API = 'rca';

export const toggleState = { hotfix: 'yes', rollback: 'no', workaround: 'no' };
export const rcaCache = {};
export const emailImages = [];
export const screenshots = [];
export const closureImages = [];

export const dashboardState = {
  currentFilter: 'all',
  allData: [],
  editingId: null,
};

export const quill = new Quill('#details-editor', {
  theme: 'snow',
  modules: { toolbar: '#quill-toolbar' },
  placeholder: 'Root cause, impact, timeline, and resolution steps...',
});
