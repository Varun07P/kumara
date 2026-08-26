/**
 * gallery.js — KES Project Gallery Manager
 * Strictly loads and displays images dynamically from the backend database/API.
 */
(function () {
  'use strict';

  const API_CANDIDATES = window.KES_API_BASE ? [window.KES_API_BASE] : ['/api', '/Backend/public/api'];
  
  const state = {
    apiBase: '',
    uploadBase: '',
    items: [],
    currentIndex: 0
  };

  const els = {
    grid: document.getElementById('galGrid'),
    filters: document.getElementById('galFilters'),
    lightbox: document.getElementById('lightbox'),
    lightboxImage: document.getElementById('lbImg'),
    lightboxCategory: document.getElementById('lbCat'),
    lightboxTitle: document.getElementById('lbTitle'),
    lightboxCounter: document.getElementById('lbCounter'),
    closeButton: document.getElementById('lbClose'),
    previousButton: document.getElementById('lbPrev'),
    nextButton: document.getElementById('lbNext')
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindEvents();
    renderLoadingState();

    try {
      await resolveApiBase();
      await fetchBackendGallery();
    } catch (err) {
      renderErrorState('Unable to Load Gallery', 'Could not connect to the backend server. Please verify your connection or try again.');
    }
  }

  function bindEvents() {
    // Lightbox Controls
    if (els.closeButton) els.closeButton.addEventListener('click', closeLightbox);
    if (els.previousButton) els.previousButton.addEventListener('click', showPrevious);
    if (els.nextButton) els.nextButton.addEventListener('click', showNext);

    if (els.lightbox) {
      els.lightbox.addEventListener('click', (e) => {
        if (e.target === els.lightbox) closeLightbox();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!els.lightbox || !els.lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrevious();
      if (e.key === 'ArrowRight') showNext();
    });
  }

  /* --- API Resolution & Data Fetching --- */
  async function resolveApiBase() {
    for (const base of API_CANDIDATES) {
      try {
        const res = await fetch(`${base}/gallery`, { credentials: 'same-origin', cache: 'no-store' });
        if (res.headers.get('content-type')?.includes('application/json')) {
          state.apiBase = base;
          state.uploadBase = resolveUploadBase(base);
          return;
        }
      } catch (e) {
        continue;
      }
    }
    throw new Error('Gallery API endpoint is unreachable.');
  }

  function resolveUploadBase(apiBase) {
    if (window.KES_UPLOAD_BASE) return window.KES_UPLOAD_BASE;
    if (apiBase.includes('/Backend/public/api')) return apiBase.replace(/\/api$/, '/storage/uploads/compressed');
    return `${apiBase}/storage/uploads/compressed`;
  }

  async function fetchBackendGallery() {
    const res = await fetch(`${state.apiBase}/gallery`, {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const payload = await res.json();
    const rawImages = Array.isArray(payload.images) ? payload.images : [];

    // Strictly process and filter valid backend images only
    state.items = rawImages
      .filter(img => img && typeof img.stored_filename === 'string' && isSafeStoredFilename(img.stored_filename))
      .map((img, idx) => ({
        id: img.id || idx,
        src: `${state.uploadBase}/${encodeURIComponent(img.stored_filename)}`,
        caption: getCaption(img),
        category: 'Project Showcase',
        tag: 'Verified FAT'
      }));

    renderGallery();
  }

  function isSafeStoredFilename(filename) {
    return /^[a-f0-9]{32}\.(?:jpg|jpeg|png|webp)$/i.test(String(filename || '').trim());
  }

  function getCaption(img) {
    const cap = typeof img.caption === 'string' ? img.caption.trim() : '';
    const orig = typeof img.original_filename === 'string' ? img.original_filename.trim() : '';
    return cap || orig || 'Project Portfolio Image';
  }

  /* --- Rendering --- */
  function renderGallery() {
    if (!els.grid) return;
    els.grid.replaceChildren();

    const countBadge = document.getElementById('galCountBadge');
    if (countBadge) {
      countBadge.textContent = `${state.items.length} ${state.items.length === 1 ? 'Project' : 'Projects'}`;
    }

    if (state.items.length === 0) {
      renderEmptyState('No Gallery Images Published Yet', 'Images uploaded through the administration portal will appear here.');
      return;
    }

    state.items.forEach((item, index) => {
      const card = createCardElement(item, index);
      els.grid.appendChild(card);
    });
  }

  function createCardElement(item, index) {
    const card = document.createElement('div');
    card.className = 'gal-item rv in';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${item.caption}`);

    // Image
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.caption;
    img.loading = index < 4 ? 'eager' : 'lazy';
    img.onerror = () => {
      // In case the asset file is missing on storage, show clear placeholder styling
      card.style.background = '#0a1628';
    };

    // Text on Top: Category Tag + Caption
    const topOverlay = document.createElement('div');
    topOverlay.className = 'gal-top-overlay';
    
    const tag = document.createElement('span');
    tag.className = 'gal-tag';
    tag.textContent = item.tag || 'Project Work';

    const title = document.createElement('div');
    title.className = 'gal-title';
    title.textContent = item.caption;

    topOverlay.append(tag, title);

    // Expand Icon Button (Bottom Right)
    const expandBtn = document.createElement('div');
    expandBtn.className = 'gal-expand-btn';
    expandBtn.setAttribute('aria-hidden', 'true');
    expandBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';

    card.append(img, topOverlay, expandBtn);

    // Click & Keydown to open Lightbox
    card.addEventListener('click', () => openLightbox(index));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });

    return card;
  }

  function renderLoadingState() {
    if (!els.grid) return;
    els.grid.replaceChildren();

    const countBadge = document.getElementById('galCountBadge');
    if (countBadge) countBadge.textContent = 'Loading...';

    const box = document.createElement('div');
    box.style.cssText = 'grid-column:1/-1; padding:64px 20px; text-align:center; color:#64748b; font-size:14px;';
    box.innerHTML = `
      <div style="width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#ff5722; border-radius:50%; margin:0 auto 16px; animation:galSpin .8s linear infinite;"></div>
      <strong style="display:block; font-size:16px; color:#07101e; margin-bottom:4px;">Connecting to Backend Database...</strong>
      <span>Retrieving published gallery images.</span>
      <style>@keyframes galSpin { to{transform:rotate(360deg);} }</style>
    `;
    els.grid.appendChild(box);
  }

  function renderEmptyState(title, message) {
    if (!els.grid) return;
    els.grid.replaceChildren();

    const countBadge = document.getElementById('galCountBadge');
    if (countBadge) countBadge.textContent = '0 Projects';

    const box = document.createElement('div');
    box.style.cssText = 'grid-column:1/-1; padding:56px 20px; text-align:center; background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:12px;';
    box.innerHTML = `
      <div style="width:44px; height:44px; border-radius:10px; background:rgba(255,87,34,0.1); color:#ff5722; display:grid; place-items:center; margin:0 auto 14px;">
        <svg style="width:22px; height:22px; stroke:currentColor; fill:none; stroke-width:2;" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </div>
      <strong style="display:block; font-size:18px; color:#07101e; margin-bottom:6px; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase; letter-spacing:.02em;">${title}</strong>
      <span style="font-size:13.5px; color:#64748b;">${message}</span>
    `;
    els.grid.appendChild(box);
  }

  function renderErrorState(title, message) {
    if (!els.grid) return;
    els.grid.replaceChildren();

    const countBadge = document.getElementById('galCountBadge');
    if (countBadge) countBadge.textContent = 'Offline';

    const box = document.createElement('div');
    box.style.cssText = 'grid-column:1/-1; padding:48px 20px; text-align:center; background:#fff7f5; border:1px solid #fed7aa; border-radius:12px;';
    box.innerHTML = `
      <strong style="display:block; font-size:17px; color:#cc2700; margin-bottom:6px; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase;">${title}</strong>
      <p style="font-size:13px; color:#64748b; margin-bottom:16px;">${message}</p>
      <button id="galRetryBtn" style="display:inline-flex; align-items:center; gap:6px; background:#ff5722; color:#fff; padding:8px 18px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:12.5px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; cursor:pointer;">
        Retry Connection
      </button>
    `;
    els.grid.appendChild(box);

    const retryBtn = document.getElementById('galRetryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        init();
      });
    }
  }

  /* --- Lightbox --- */
  function openLightbox(index) {
    state.currentIndex = index;
    updateLightbox();
    if (els.lightbox) {
      els.lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    if (els.lightbox) {
      els.lightbox.classList.remove('open');
      if (els.lightboxImage) els.lightboxImage.removeAttribute('src');
      document.body.style.overflow = '';
    }
  }

  function showPrevious() {
    if (state.items.length === 0) return;
    state.currentIndex = (state.currentIndex - 1 + state.items.length) % state.items.length;
    updateLightbox();
  }

  function showNext() {
    if (state.items.length === 0) return;
    state.currentIndex = (state.currentIndex + 1) % state.items.length;
    updateLightbox();
  }

  function updateLightbox() {
    const item = state.items[state.currentIndex];
    if (!item) return;

    if (els.lightboxImage) {
      els.lightboxImage.src = item.src;
      els.lightboxImage.alt = item.caption;
    }
    if (els.lightboxCategory) els.lightboxCategory.textContent = item.category || 'Project Showcase';
    if (els.lightboxTitle) els.lightboxTitle.textContent = item.caption;
    if (els.lightboxCounter) {
      const pad = (n) => (n < 10 ? '0' + n : '' + n);
      els.lightboxCounter.textContent = `${pad(state.currentIndex + 1)} / ${pad(state.items.length)}`;
    }
  }

})();
