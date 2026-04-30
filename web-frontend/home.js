// ============================================================
// home.js — Homebite Home Page interactions
//
// Depends on: data.js (must be loaded first in home.html)
// ============================================================

// ── STATE ────────────────────────────────────────────────────
let savedIds         = new Set(INITIAL_SAVED_IDS);
let activeCategory   = 'all';
let activeDifficulty = 'all';
let activeTime       = 'all';
let currentSearch    = '';
let currentIndex     = 0;
let isLoading        = false;
let scrollObserver   = null;

// ── COMBINED FILTER (BACKEND VERSION) ─────────────────────────
async function fetchFilteredRecipes() {

  const BASE_URL = "http://YOUR_IP:8080/AuthApp/RecipeServlet";

  let url = `${BASE_URL}?action=searchRecipes`;

  // search
  if (currentSearch) {
    url += `&query=${encodeURIComponent(currentSearch)}`;
  }

  // category
  if (activeCategory !== 'all') {
    url += `&category=${activeCategory}`;
  }

  // difficulty
  if (activeDifficulty !== 'all') {
    url += `&difficulty=${activeDifficulty}`;
  }

  // time
  if (activeTime === 'quick')  url += `&prep_time=20`;
  if (activeTime === 'medium') url += `&prep_time=40`;
  if (activeTime === 'long')   url += `&prep_time=40+`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.recipes || [];
  } catch (err) {
    console.error("Fetch failed:", err);
    return [];
  }
}

// ── RATING HELPERS ────────────────────────────────────────────
// Source: Evelyn's Social Database
// TODO: rating & commentCount come from → fetch(`/api/recipes/${id}/social`)
function renderStars(rating) {
  const full    = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const empty   = 5 - full - (hasHalf ? 1 : 0);
  let html = '';
  for (let i = 0; i < full; i++)  html += '<span class="star star-full">★</span>';
  if (hasHalf)                     html += '<span class="star star-half">★</span>';
  for (let i = 0; i < empty; i++) html += '<span class="star star-empty">★</span>';
  return html;
}

function formatCount(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

// ── RENDER: Single masonry card ───────────────────────────────
function createMasonryCard(r, batchIndex) {
  const saved = savedIds.has(r.id);
  const card  = document.createElement('div');
  card.className = 'masonry-card animate-in';
  card.style.animationDelay = `${(batchIndex % BATCH_SIZE) * 0.05}s`;

  card.onclick = (e) => {
    if (!e.target.classList.contains('btn-save')) {
      window.location.href = `recipe-detail.html?id=${r.id}`;
    }
  };

  const popularBadge = POPULAR_IDS.includes(r.id)
    ? `<span class="badge-popular">🔥 Popular</span>` : '';

  card.innerHTML = `
    <div class="masonry-img ${r.bgClass}" style="height:${r.imgHeight}px">${r.emoji}</div>
    <div class="masonry-body">
      ${popularBadge}
      <div class="masonry-title">${r.title}</div>
      <div class="masonry-tags">
        ${r.displayTags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="masonry-social">
        <span class="social-stars" title="${r.rating} / 5">${renderStars(r.rating)} ${r.rating}</span>
        <span class="social-comments">💬 ${formatCount(r.commentCount)}</span>
      </div>
      <div class="masonry-footer">
        <span class="masonry-meta">${r.author} · ${r.time}</span>
        <button class="btn-save ${saved ? 'saved' : ''}"
                onclick="toggleSave(event, ${r.id}, this)">
          ${saved ? '♥' : '♡'}
        </button>
      </div>
    </div>`;

  return card;
}

// ── RENDER: Next batch into masonry grid ──────────────────────
async function renderBatch(reset = false) {
  const grid  = document.getElementById('masonryGrid');
  const empty = document.getElementById('emptyState');

  const resultsRaw = await fetchFilteredRecipes();

  // map backend → frontend format
  const results = resultsRaw.map(r => ({
    id: r.recipe_id,
    title: r.recipe_name,
    author: "@" + r.user_id,
    time: (r.prep_time || 0) + " min",
    timeMin: r.prep_time || 0,
    difficulty: r.difficulty || "Easy",
    tags: [r.category?.toLowerCase() || ""],
    displayTags: [r.category || ""],
    rating: 4.5,
    ratingCount: 0,
    commentCount: 0,
    emoji: "🍽️",
    bgClass: "bg-orange",
    imgHeight: 180
  }));

  if (reset) {
    grid.innerHTML = '';
    currentIndex = 0;
    disconnectObserver();
  }

  if (results.length === 0) {
    empty.classList.add('visible');
    return;
  }
  empty.classList.remove('visible');

  const batch = results.slice(currentIndex, currentIndex + BATCH_SIZE);
  batch.forEach((r, i) => grid.appendChild(createMasonryCard(r, i)));
  currentIndex += batch.length;

  if (currentIndex < results.length) connectObserver();

  updateSectionTitle(results.length);
}

// ── INFINITE SCROLL ───────────────────────────────────────────
function connectObserver() {
  if (scrollObserver) return;
  const sentinel = document.getElementById('sentinel');
  scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading) {
      isLoading = true;
      renderBatch();
      isLoading = false;
    }
  }, { rootMargin: '300px' });
  scrollObserver.observe(sentinel);
}

function disconnectObserver() {
  if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
}

// ── SEARCH (BACKEND) ──────────────────────────────────────────
function handleSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  currentSearch = query;

  document.getElementById('resultBanner').classList.add('visible');
  document.getElementById('resultQuery').textContent = `"${query}"`;

  renderBatch(true); // 🔥 now fetches from backend
  updateFilterIndicator();
}

// ── CATEGORY FILTER ───────────────────────────────────────────
function setCategory(el, category) {
  activeCategory = category;
  syncCategoryPills(category);
  el.classList.add('active');

  currentSearch = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('resultBanner').classList.remove('visible');

  renderBatch(true); // backend call
  updateFilterIndicator();
}

// ── DIFFICULTY FILTER ─────────────────────────────────────────
function setDifficulty(el, val) {
  document.querySelectorAll('.chip-difficulty').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeDifficulty = val;

  renderBatch(true); // backend call
  updateFilterIndicator();
}

// ── TIME FILTER ───────────────────────────────────────────────
function setTime(el, val) {
  document.querySelectorAll('.chip-time').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeTime = val;

  renderBatch(true); // backend call
  updateFilterIndicator();
}

// ── FILTER PANEL TOGGLE ───────────────────────────────────────
function toggleFilterPanel() {
  const panel = document.getElementById('filterPanel');
  const btn   = document.getElementById('moreFiltersBtn');
  const open  = panel.classList.toggle('open');
  btn.textContent = open ? '▲ Less' : '▼ More Filters';
}

// ── CLEAR ALL FILTERS ─────────────────────────────────────────
function clearAllFilters() {
  activeCategory   = 'all';
  activeDifficulty = 'all';
  activeTime       = 'all';
  currentSearch    = '';

  document.getElementById('searchInput').value = '';
  document.getElementById('resultBanner').classList.remove('visible');

  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.pill').forEach(p => {
    if (p.textContent.trim() === 'All' || p.textContent.trim() === 'Any') {
      p.classList.add('active');
    }
  });
  document.querySelector('.filter-row .pill').classList.add('active');

  renderBatch(true);
  updateFilterIndicator();
}

// ── UI HELPERS ────────────────────────────────────────────────
function updateFilterIndicator() {
  const hasFilters = activeCategory !== 'all' || activeDifficulty !== 'all'
                     || activeTime !== 'all' || currentSearch;
  document.getElementById('filterIndicator').style.display = hasFilters ? 'inline-block' : 'none';
}

function updateSectionTitle(count) {
  const title = document.getElementById('feedTitle');
  if (currentSearch) {
    title.textContent = `${count} result${count !== 1 ? 's' : ''} found`;
  } else if (activeCategory !== 'all') {
    const el = document.querySelector(
      '.pill.active:not(.chip-difficulty):not(.chip-time):not(.filter-more-btn)'
    );
    const label = el ? el.textContent.trim() : activeCategory;
    title.textContent = `${label} Recipes`;
  } else {
    title.textContent = 'Recipes';
  }
}

// ── SAVE / UNSAVE ─────────────────────────────────────────────
// TODO: fetch('/api/users/me/saved', { method: 'POST'/'DELETE',
//         body: JSON.stringify({ recipeId: id }) }) — Shriya
function toggleSave(event, id, btn) {
  event.stopPropagation();
  if (savedIds.has(id)) {
    savedIds.delete(id);
    btn.textContent = '♡';
    btn.classList.remove('saved');
  } else {
    savedIds.add(id);
    btn.textContent = '♥';
    btn.classList.add('saved');
  }
}

// ── RESET ─────────────────────────────────────────────────────
function resetToHome() {
  clearAllFilters();
  document.getElementById('filterPanel').classList.remove('open');
  document.getElementById('moreFiltersBtn').textContent = '▼ More Filters';
}

// ── SIDEBAR: Saved preview ────────────────────────────────────
function renderSavedPreview() {
  const container = document.getElementById('savedPreview');
  container.innerHTML = '';

  SAVED_PREVIEW.forEach(s => {
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.onclick = () => { window.location.href = `recipe-detail.html?id=${s.id}`; };
    div.innerHTML = `
      <div class="saved-dot" style="background:${s.dotColor}"></div>
      <div>
        <div class="saved-name">${s.name}</div>
        <div class="saved-author">by ${s.author}</div>
      </div>`;
    container.appendChild(div);
  });
}

// ── SIDEBAR: Modified Recipes preview ────────────────────────
// Source: Christopher's Modified Recipe Database
// TODO: replace with → fetch('/api/recipes/modified?userId=me')
function renderModifiedPreview() {
  const container = document.getElementById('modifiedPreview');
  if (!container) return;
  container.innerHTML = '';

  if (MODIFIED_PREVIEW.length === 0) {
    container.innerHTML = '<p class="modified-empty">No AI-modified recipes yet.</p>';
    return;
  }

  MODIFIED_PREVIEW.forEach(m => {
    const div = document.createElement('div');
    div.className = 'modified-item';
    div.onclick = () => { window.location.href = `recipe-detail.html?id=${m.id}`; };
    div.innerHTML = `
      <div class="modified-emoji">${m.emoji}</div>
      <div>
        <div class="modified-name">${m.modTitle}</div>
        <div class="modified-origin">from ${m.originalTitle}</div>
      </div>`;
    container.appendChild(div);
  });
}

// ── AUTH STATE ────────────────────────────────────────────────
// Source: Shriya's User Authentication
// TODO: replace with real API call when auth is ready
async function initAuthState() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const user = await res.json();
      // Logged in — show upload button, set avatar initial
      document.querySelector('.btn-upload').style.display = 'inline-block';
      document.querySelector('.avatar').textContent = user.username[0].toUpperCase();
    } else {
      setGuestMode();
    }
  } catch {
    // Backend not ready yet — fall back to mock logged-in state for dev
    // Remove this catch block when backend is live
  }
}

function setGuestMode() {
  document.getElementById('uploadBtn').style.display = 'none';
  document.getElementById('navAvatar').style.display = 'none';
  document.getElementById('guestActions').style.display = 'flex';
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuthState();
  renderBatch(true);
  renderSavedPreview();
  renderModifiedPreview();

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });
});
