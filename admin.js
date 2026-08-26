(function () {
  'use strict';

  const API_CANDIDATES = window.KES_API_BASE ? [window.KES_API_BASE] : ['/api', '/Backend/public/api'];
  const state = {
    apiBase: '',
    uploadBase: '',
    username: '',
    images: [],
    apiReady: false,
  };

  const els = {
    loginView: document.getElementById('loginView'),
    dashboardView: document.getElementById('dashboardView'),
    loginForm: document.getElementById('loginForm'),
    loginStatus: document.getElementById('loginStatus'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    adminUser: document.getElementById('adminUser'),
    uploadForm: document.getElementById('uploadForm'),
    uploadStatus: document.getElementById('uploadStatus'),
    settingsStatus: document.getElementById('settingsStatus'),
    imagesStatus: document.getElementById('imagesStatus'),
    imageGrid: document.getElementById('imageGrid'),
    emptyState: document.getElementById('emptyState'),
    featuredToggle: document.getElementById('featuredToggle'),
    totalCount: document.getElementById('totalCount'),
    galleryCount: document.getElementById('galleryCount'),
    featuredCount: document.getElementById('featuredCount'),
    refreshBtn: document.getElementById('refreshBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindEvents();

    try {
      await resolveApiBase();
      await checkSession();
    } catch (error) {
      showLogin();
      setStatus(els.loginStatus, getApiUnavailableMessage(), 'bad');
    }
  }

  function bindEvents() {
    els.loginForm.addEventListener('submit', handleLogin);
    els.uploadForm.addEventListener('submit', handleUpload);
    els.refreshBtn.addEventListener('click', loadDashboard);
    els.logoutBtn.addEventListener('click', handleLogout);
    els.featuredToggle.addEventListener('change', handleFeaturedToggle);

    // Password Eye Toggle
    const pwdToggle = document.getElementById('pwdToggle');
    if (pwdToggle && els.password) {
      pwdToggle.addEventListener('click', () => {
        const isPassword = els.password.getAttribute('type') === 'password';
        els.password.setAttribute('type', isPassword ? 'text' : 'password');
        const eyeOpen = pwdToggle.querySelector('.eye-open');
        const eyeClosed = pwdToggle.querySelector('.eye-closed');
        if (eyeOpen && eyeClosed) {
          eyeOpen.classList.toggle('hidden', isPassword);
          eyeClosed.classList.toggle('hidden', !isPassword);
        }
      });
    }

    // Dropzone File Change Feedback
    const fileInput = document.getElementById('image');
    const dzFilename = document.getElementById('dzFilename');
    if (fileInput && dzFilename) {
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          dzFilename.textContent = `Selected: ${fileInput.files[0].name} (${(fileInput.files[0].size / (1024 * 1024)).toFixed(2)} MB)`;
          dzFilename.classList.remove('hidden');
        } else {
          dzFilename.classList.add('hidden');
        }
      });
    }

    // Sidebar Navigation Highlighting
    document.querySelectorAll('.side-nav .nav-item:not(.external)').forEach((link) => {
      link.addEventListener('click', () => {
        document.querySelectorAll('.side-nav .nav-item').forEach((n) => n.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  async function resolveApiBase() {
    for (const base of API_CANDIDATES) {
      try {
        const response = await fetch(`${base}/session`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (response.headers.get('content-type')?.includes('application/json')) {
          state.apiBase = base;
          state.uploadBase = resolveUploadBase(base);
          state.apiReady = true;
          return;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('API is not reachable from this page.');
  }

  function resolveUploadBase(apiBase) {
    if (window.KES_UPLOAD_BASE) {
      return window.KES_UPLOAD_BASE;
    }

    if (apiBase.includes('/Backend/public/api')) {
      return apiBase.replace(/\/api$/, '/storage/uploads/compressed');
    }

    return `${apiBase}/storage/uploads/compressed`;
  }

  async function request(path, options = {}) {
    if (!state.apiReady || state.apiBase === '') {
      throw new Error(getApiUnavailableMessage());
    }

    const response = await fetch(`${state.apiBase}${path}`, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.headers || {}),
      },
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.message || 'Request failed');
    }

    return payload;
  }

  async function parseJson(response) {
    const text = await response.text();

    if (text.trim() === '') {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error('The API returned invalid JSON.');
    }
  }

  async function checkSession() {
    try {
      const data = await request('/session');

      if (data.authenticated) {
        state.username = data.username || '';
        showDashboard();
        await loadDashboard();
      } else {
        showLogin();
      }
    } catch (error) {
      setStatus(els.loginStatus, error.message, 'bad');
      showLogin();
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!state.apiReady) {
      setStatus(els.loginStatus, getApiUnavailableMessage(), 'bad');
      return;
    }

    setStatus(els.loginStatus, 'Signing in...');

    try {
      const data = await request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: els.username.value.trim(),
          password: els.password.value,
        }),
      });

      state.username = data.username || els.username.value.trim();
      els.password.value = '';
      showDashboard();
      await loadDashboard();
    } catch (error) {
      setStatus(els.loginStatus, error.message, 'bad');
    }
  }

  async function handleLogout() {
    await request('/logout', { method: 'POST' });
    state.username = '';
    state.images = [];
    showLogin();
  }

  async function loadDashboard() {
    setStatus(els.imagesStatus, 'Loading...');

    try {
      const [imagesData, settingData] = await Promise.all([
        request('/images'),
        request('/settings/featured-toggle'),
      ]);

      state.images = Array.isArray(imagesData.images) ? imagesData.images : [];
      els.featuredToggle.checked = Boolean(settingData.featured_section_visible);
      updateStats();
      renderImages();
      setStatus(els.imagesStatus, `${state.images.length} image${state.images.length === 1 ? '' : 's'}`, 'ok');
      setStatus(els.settingsStatus, '');
    } catch (error) {
      setStatus(els.imagesStatus, error.message, 'bad');
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    setStatus(els.uploadStatus, 'Uploading...');

    const formData = new FormData();
    const file = els.uploadForm.image.files[0];
    const caption = els.uploadForm.caption.value.trim();
    const placements = [...els.uploadForm.querySelectorAll('input[name="placement"]:checked')]
      .map((input) => input.value);

    if (!file) {
      setStatus(els.uploadStatus, 'Choose an image file first.', 'bad');
      return;
    }

    formData.append('image', file);

    if (caption !== '') {
      formData.append('caption', caption);
    }

    if (placements.length > 0) {
      formData.append('placements', placements.join(','));
    }

    try {
      await request('/images', {
        method: 'POST',
        body: formData,
      });

      els.uploadForm.reset();
      setStatus(els.uploadStatus, 'Image uploaded.', 'ok');
      await loadDashboard();
    } catch (error) {
      setStatus(els.uploadStatus, error.message, 'bad');
    }
  }

  async function handleFeaturedToggle() {
    const enabled = els.featuredToggle.checked;
    setStatus(els.settingsStatus, 'Saving...');

    try {
      await request('/settings/featured-toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured_section_visible: enabled }),
      });
      setStatus(els.settingsStatus, enabled ? 'Featured section is visible.' : 'Featured section is hidden.', 'ok');
    } catch (error) {
      els.featuredToggle.checked = !enabled;
      setStatus(els.settingsStatus, error.message, 'bad');
    }
  }

  function renderImages() {
    els.imageGrid.replaceChildren();
    els.emptyState.classList.toggle('hidden', state.images.length > 0);

    state.images.forEach((image) => {
      els.imageGrid.appendChild(createImageCard(image));
    });
  }

  function updateStats() {
    const galleryCount = state.images.filter((image) => hasPlacement(image, 'gallery')).length;
    const featuredCount = state.images.filter((image) => hasPlacement(image, 'featured')).length;

    els.totalCount.textContent = String(state.images.length);
    els.galleryCount.textContent = String(galleryCount);
    els.featuredCount.textContent = String(featuredCount);
  }

  function createImageCard(image) {
    const card = document.createElement('article');
    card.className = 'image-card';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';

    const img = document.createElement('img');
    img.src = imageUrl(image.stored_filename);
    img.alt = image.caption || image.original_filename || 'Gallery image';
    img.loading = 'lazy';
    thumb.appendChild(img);

    const body = document.createElement('div');
    body.className = 'image-body';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.append(textNode(`#${image.id}`), textNode(image.original_filename || 'Image'));

    const caption = document.createElement('textarea');
    caption.className = 'textarea';
    caption.value = image.caption || '';
    caption.placeholder = 'Caption';

    const pills = document.createElement('div');
    pills.className = 'pills';
    ['gallery', 'featured'].forEach((placement) => {
      const pill = document.createElement('button');
      const active = hasPlacement(image, placement);
      pill.className = `pill${active ? ' on' : ''}`;
      pill.type = 'button';
      pill.textContent = placement;
      pill.addEventListener('click', () => togglePlacement(image, placement, active));
      pills.appendChild(pill);
    });

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.append(
      actionButton('Save Caption', 'btn btn-ghost', () => saveCaption(image.id, caption.value)),
      actionButton('Delete', 'btn btn-danger', () => deleteImage(image))
    );

    body.append(meta, caption, pills, actions);
    card.append(thumb, body);

    return card;
  }

  async function saveCaption(id, caption) {
    setStatus(els.imagesStatus, 'Saving caption...');

    try {
      await request(`/images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      });
      setStatus(els.imagesStatus, 'Caption saved.', 'ok');
      await loadDashboard();
    } catch (error) {
      setStatus(els.imagesStatus, error.message, 'bad');
    }
  }

  async function togglePlacement(image, placement, active) {
    setStatus(els.imagesStatus, 'Updating placement...');

    try {
      if (active) {
        await request(`/images/${image.id}/placements/${placement}`, { method: 'DELETE' });
      } else {
        await request(`/images/${image.id}/placements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placement }),
        });
      }

      await loadDashboard();
    } catch (error) {
      setStatus(els.imagesStatus, error.message, 'bad');
    }
  }

  async function deleteImage(image) {
    const label = image.caption || image.original_filename || `image #${image.id}`;

    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      return;
    }

    setStatus(els.imagesStatus, 'Deleting image...');

    try {
      await request(`/images/${image.id}`, { method: 'DELETE' });
      setStatus(els.imagesStatus, 'Image deleted.', 'ok');
      await loadDashboard();
    } catch (error) {
      setStatus(els.imagesStatus, error.message, 'bad');
    }
  }

  function imageUrl(filename) {
    const safeName = String(filename || '').split('/').pop();
    return `${state.uploadBase}/${encodeURIComponent(safeName)}`;
  }

  function hasPlacement(image, placement) {
    return Array.isArray(image.placements) && image.placements.includes(placement);
  }

  function actionButton(label, className, handler) {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  function textNode(text) {
    const span = document.createElement('span');
    span.textContent = String(text);
    return span;
  }

  function showLogin() {
    els.loginView.classList.remove('hidden');
    els.dashboardView.classList.add('hidden');
    setStatus(els.loginStatus, '');
  }

  function showDashboard() {
    els.loginView.classList.add('hidden');
    els.dashboardView.classList.remove('hidden');
    els.adminUser.textContent = state.username || 'Admin';
  }

  function setStatus(element, message, type = '') {
    element.textContent = message;
    element.classList.remove('ok', 'bad');

    if (type) {
      element.classList.add(type);
    }
  }

  function getApiUnavailableMessage() {
    if (window.location.port && window.location.port.startsWith('55')) {
      return 'Open this page through the PHP/XAMPP server, not Live Server. Use http://127.0.0.1:8040/admin.html or your XAMPP localhost URL.';
    }

    return 'API is not reachable from this page. Start the PHP server and open admin.html from the same address.';
  }
})();
