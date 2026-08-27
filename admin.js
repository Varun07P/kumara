(function () {
  'use strict';

  const API_CANDIDATES = window.KES_API_BASE ? [window.KES_API_BASE] : ['/api', '/Backend/public/api'];
  const state = {
    apiBase: '',
    uploadBase: '',
    username: '',
    images: [],
    careers: [],
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
    careerAddForm: document.getElementById('careerAddForm'),
    careerStatus: document.getElementById('careerStatus'),
    careerList: document.getElementById('careerList'),
    careerEmptyState: document.getElementById('careerEmptyState'),
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
    if (els.careerAddForm) {
      els.careerAddForm.addEventListener('submit', handleAddCareer);
    }

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
    if (els.careerStatus) {
      setStatus(els.careerStatus, 'Loading...');
    }

    try {
      const [imagesData, settingData, careersData] = await Promise.all([
        request('/images'),
        request('/settings/featured-toggle'),
        request('/admin/careers'),
      ]);

      state.images = Array.isArray(imagesData.images) ? imagesData.images : [];
      state.careers = Array.isArray(careersData.careers) ? careersData.careers : [];
      els.featuredToggle.checked = Boolean(settingData.featured_section_visible);
      updateStats();
      renderImages();
      renderCareers();
      setStatus(els.imagesStatus, `${state.images.length} image${state.images.length === 1 ? '' : 's'}`, 'ok');
      if (els.careerStatus) {
        setStatus(els.careerStatus, `${state.careers.length} opening${state.careers.length === 1 ? '' : 's'}`, 'ok');
      }
      setStatus(els.settingsStatus, '');
    } catch (error) {
      setStatus(els.imagesStatus, error.message, 'bad');
      if (els.careerStatus) {
        setStatus(els.careerStatus, error.message, 'bad');
      }
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

  /* ==========================================================================
     CAREER MANAGEMENT FUNCTIONS
     ========================================================================== */

  async function handleAddCareer(event) {
    event.preventDefault();
    if (!els.careerStatus) return;
    setStatus(els.careerStatus, 'Adding career opening...');

    const title = els.careerAddForm.title.value.trim();
    const location = els.careerAddForm.location.value.trim();
    const job_type = els.careerAddForm.job_type.value;
    const experience = els.careerAddForm.experience.value.trim();
    const skills = els.careerAddForm.skills.value.trim();

    if (!title || !location || !experience) {
      setStatus(els.careerStatus, 'Title, location, and experience are required.', 'bad');
      return;
    }

    try {
      await request('/admin/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          location,
          job_type,
          experience,
          skills: skills || null,
        }),
      });

      els.careerAddForm.reset();
      setStatus(els.careerStatus, 'Career opening added successfully.', 'ok');
      await loadDashboard();
    } catch (error) {
      setStatus(els.careerStatus, error.message, 'bad');
    }
  }

  function renderCareers() {
    if (!els.careerList) return;
    els.careerList.replaceChildren();
    if (els.careerEmptyState) {
      els.careerEmptyState.classList.toggle('hidden', state.careers.length > 0);
    }

    state.careers.forEach((career) => {
      els.careerList.appendChild(createCareerRow(career));
    });
  }

  function createCareerRow(career) {
    const row = document.createElement('div');
    row.className = `career-row${career.is_active ? '' : ' inactive'}`;
    row.dataset.id = career.id;

    // Normal view mode
    const infoDiv = document.createElement('div');
    infoDiv.className = 'career-row-info';

    const h4 = document.createElement('h4');
    h4.textContent = career.title;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'career-row-meta';

    const locSpan = document.createElement('span');
    locSpan.textContent = career.location;
    metaDiv.appendChild(locSpan);

    const typeSpan = document.createElement('span');
    typeSpan.textContent = career.job_type || 'Full-Time';
    metaDiv.appendChild(typeSpan);

    const expSpan = document.createElement('span');
    expSpan.textContent = career.experience;
    metaDiv.appendChild(expSpan);

    if (career.skills) {
      const skillsSpan = document.createElement('span');
      skillsSpan.textContent = career.skills;
      metaDiv.appendChild(skillsSpan);
    }

    infoDiv.appendChild(h4);
    infoDiv.appendChild(metaDiv);

    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'career-row-actions';

    // Status label + Toggle switch
    const toggleLabel = document.createElement('span');
    toggleLabel.className = `career-toggle-label${career.is_active ? ' active-label' : ''}`;
    toggleLabel.textContent = career.is_active ? 'Active' : 'Hidden';

    const switchLabel = document.createElement('label');
    switchLabel.className = 'switch';

    const switchInput = document.createElement('input');
    switchInput.type = 'checkbox';
    switchInput.checked = Boolean(career.is_active);
    switchInput.addEventListener('change', () => handleToggleCareer(career, switchInput.checked, toggleLabel, row));

    const sliderSpan = document.createElement('span');
    sliderSpan.className = 'slider';

    switchLabel.appendChild(switchInput);
    switchLabel.appendChild(sliderSpan);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'career-act-btn edit-btn';
    editBtn.type = 'button';
    editBtn.title = 'Edit Opening';
    editBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    editBtn.addEventListener('click', () => handleEditCareer(career, row));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'career-act-btn delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.title = 'Delete Opening';
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    deleteBtn.addEventListener('click', () => handleDeleteCareer(career));

    actionsDiv.appendChild(toggleLabel);
    actionsDiv.appendChild(switchLabel);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    row.appendChild(infoDiv);
    row.appendChild(actionsDiv);

    return row;
  }

  async function handleToggleCareer(career, isChecked, labelEl, rowEl) {
    if (!els.careerStatus) return;
    setStatus(els.careerStatus, 'Updating status...');

    try {
      await request(`/admin/careers/${career.id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isChecked }),
      });

      career.is_active = isChecked ? 1 : 0;
      labelEl.textContent = isChecked ? 'Active' : 'Hidden';
      labelEl.classList.toggle('active-label', isChecked);
      rowEl.classList.toggle('inactive', !isChecked);
      setStatus(els.careerStatus, `Opening "${career.title}" is now ${isChecked ? 'active' : 'hidden'}.`, 'ok');
    } catch (error) {
      setStatus(els.careerStatus, error.message, 'bad');
      await loadDashboard();
    }
  }

  function handleEditCareer(career, rowEl) {
    rowEl.replaceChildren();

    const form = document.createElement('form');
    form.className = 'career-edit-form';

    form.innerHTML = `
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--ink);">Job Title *</label>
        <input class="input" name="title" value="${escapeHtml(career.title)}" required/>
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--ink);">Location *</label>
        <input class="input" name="location" value="${escapeHtml(career.location)}" required/>
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--ink);">Job Type</label>
        <select class="input" name="job_type">
          <option value="Full-Time" ${career.job_type === 'Full-Time' ? 'selected' : ''}>Full-Time</option>
          <option value="Part-Time" ${career.job_type === 'Part-Time' ? 'selected' : ''}>Part-Time</option>
          <option value="Contract" ${career.job_type === 'Contract' ? 'selected' : ''}>Contract</option>
          <option value="Internship" ${career.job_type === 'Internship' ? 'selected' : ''}>Internship</option>
        </select>
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--ink);">Experience *</label>
        <input class="input" name="experience" value="${escapeHtml(career.experience)}" required/>
      </div>
      <div style="grid-column:1/-1;">
        <label style="font-size:11px;font-weight:700;color:var(--ink);">Skills Tag</label>
        <input class="input" name="skills" value="${escapeHtml(career.skills || '')}" placeholder="e.g. AutoCAD / SLDs"/>
      </div>
      <div class="career-edit-actions">
        <button class="btn btn-ghost cancel-btn" type="button">Cancel</button>
        <button class="btn btn-primary" type="submit">Save Changes</button>
      </div>
    `;

    form.querySelector('.cancel-btn').addEventListener('click', () => {
      renderCareers();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!els.careerStatus) return;
      setStatus(els.careerStatus, 'Saving changes...');

      const title = form.title.value.trim();
      const location = form.location.value.trim();
      const job_type = form.job_type.value;
      const experience = form.experience.value.trim();
      const skills = form.skills.value.trim();

      if (!title || !location || !experience) {
        setStatus(els.careerStatus, 'Title, location, and experience are required.', 'bad');
        return;
      }

      try {
        await request(`/admin/careers/${career.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            location,
            job_type,
            experience,
            skills: skills || null,
          }),
        });

        setStatus(els.careerStatus, 'Career opening updated.', 'ok');
        await loadDashboard();
      } catch (error) {
        setStatus(els.careerStatus, error.message, 'bad');
      }
    });

    rowEl.appendChild(form);
  }

  async function handleDeleteCareer(career) {
    if (!window.confirm(`Delete career opening "${career.title}"? This cannot be undone.`)) {
      return;
    }

    if (!els.careerStatus) return;
    setStatus(els.careerStatus, 'Deleting career opening...');

    try {
      await request(`/admin/careers/${career.id}`, { method: 'DELETE' });
      setStatus(els.careerStatus, 'Career opening deleted.', 'ok');
      await loadDashboard();
    } catch (error) {
      setStatus(els.careerStatus, error.message, 'bad');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
