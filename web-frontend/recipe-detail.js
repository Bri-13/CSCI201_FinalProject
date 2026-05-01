// ============================================================
// recipe-detail.js — Homebite Recipe Detail Page
//
// Depends on: data.js (must be loaded first)
// URL param:  ?id=<recipeId>
// ============================================================

// ── LOAD RECIPE FROM URL PARAM ────────────────────────────────
const params   = new URLSearchParams(window.location.search);
const recipeId = parseInt(params.get('id'));
const openAiModifyOnLoad = params.get('openAiModify') === '1';
const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080/AuthApp`;

const recipe = ALL_RECIPES.find(r => r.id === recipeId) || null;
const detail = (RECIPE_DETAILS && RECIPE_DETAILS[recipeId]) || null;
let activeRecipe = recipe ? { ...recipe } : null;
let activeDetail = detail ? JSON.parse(JSON.stringify(detail)) : null;
let originalRecipe = activeRecipe ? { ...activeRecipe } : null;
let originalDetail = activeDetail ? JSON.parse(JSON.stringify(activeDetail)) : null;
let modifiedRecipe = null;
let modifiedDetail = null;

// ── STATE ─────────────────────────────────────────────────────
let isSaved      = INITIAL_SAVED_IDS.includes(recipeId);
let userRating   = 0; // star rating the user selected before posting

// ── STAR HELPERS (shared with home.js approach) ───────────────
function renderStarsHtml(rating) {
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

function pickBgClass(id) {
  const classes = ['bg-orange', 'bg-green', 'bg-tan', 'bg-purple', 'bg-pink', 'bg-blue'];
  return classes[id % classes.length];
}

function pickEmoji(title = '') {
  const t = title.toLowerCase();
  if (t.includes('pasta') || t.includes('ramen') || t.includes('noodle')) return '🍜';
  if (t.includes('pizza')) return '🍕';
  if (t.includes('salad') || t.includes('vegan')) return '🥗';
  if (t.includes('cake') || t.includes('dessert')) return '🍰';
  return '🍽️';
}

async function loadRecipeFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/RecipeServlet?action=getRecipe&recipe_id=${recipeId}`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.recipe) return;
    const r = data.recipe;
    const totalMin = (r.prep_time || 0) + (r.cook_time || 0);
    const fallbackNutrition = detail?.nutrition || { calories: 0, protein: '—', carbs: '—', fat: '—', fiber: '—' };
    activeRecipe = {
      id: r.recipe_id,
      emoji: recipe?.emoji || pickEmoji(r.recipe_name),
      bgClass: recipe?.bgClass || pickBgClass(r.recipe_id),
      imgHeight: recipe?.imgHeight || 180,
      title: r.recipe_name,
      author: recipe?.author || `@user${r.user_id}`,
      time: totalMin > 0 ? `${totalMin} min` : '—',
      timeMin: totalMin,
      difficulty: r.difficulty || 'Easy',
      tags: r.category ? [String(r.category).toLowerCase()] : [],
      displayTags: r.category ? [String(r.category)] : [],
      rating: recipe?.rating || 0,
      ratingCount: recipe?.ratingCount || 0,
      commentCount: recipe?.commentCount || 0,
    };
    activeDetail = {
      description: detail?.description || '',
      servings: detail?.servings || 0,
      ingredients: splitTextBlob(r.ingredients),
      instructions: splitTextBlob(r.instructions),
      nutrition: fallbackNutrition,
    };
    originalRecipe = { ...activeRecipe };
    originalDetail = JSON.parse(JSON.stringify(activeDetail));
  } catch (err) {
    console.error('Failed to load recipe detail from backend:', err);
  }
}

// ── RENDER PAGE ───────────────────────────────────────────────
function renderPage() {
  if (!activeRecipe) {
    document.getElementById('detailTitle').textContent = 'Recipe not found.';
    return;
  }

  document.title = `${activeRecipe.title} – Homebite`;

  // Hero
  const hero = document.getElementById('detailHero');
  hero.className = 'detail-hero';
  hero.classList.add(activeRecipe.bgClass);
  document.getElementById('detailEmoji').textContent = activeRecipe.emoji;

  // Tags
  document.getElementById('detailTags').innerHTML =
    activeRecipe.displayTags.map(t => `<span class="tag">${t}</span>`).join('');

  // Title + author
  document.getElementById('detailTitle').textContent = activeRecipe.title;
  document.getElementById('detailAuthor').textContent = `by ${activeRecipe.author}`;

  // Meta pills
  const servings = activeDetail ? activeDetail.servings : '—';
  document.getElementById('detailMeta').innerHTML = `
    <span class="meta-pill">⏱ ${activeRecipe.time}</span>
    <span class="meta-pill">📊 ${activeRecipe.difficulty}</span>
    <span class="meta-pill">👥 ${servings} servings</span>
  `;

  // Rating row
  document.getElementById('detailRatingRow').innerHTML = `
    <span class="detail-stars">${renderStarsHtml(activeRecipe.rating)}</span>
    <span class="detail-rating-num">${activeRecipe.rating} · ${formatCount(activeRecipe.ratingCount)} ratings</span>
    <span class="detail-comment-count">💬 ${formatCount(activeRecipe.commentCount)}</span>
  `;

  // Save button state
  updateSaveBtn();

  // Description
  document.getElementById('detailDesc').textContent =
    activeDetail ? activeDetail.description : 'Full recipe details coming soon.';

  // Servings
  document.getElementById('detailServings').textContent =
    activeDetail ? `Makes ${activeDetail.servings} servings` : '';

  // Ingredients
  renderIngredients(activeDetail ? activeDetail.ingredients : []);

  // Instructions
  renderSteps(activeDetail ? activeDetail.instructions : []);

  // Nutrition
  renderNutrition(activeDetail ? activeDetail.nutrition : null);
  renderVersionToggles();

  // Comments
  renderComments();
}

// ── INGREDIENTS ───────────────────────────────────────────────
function renderIngredients(list) {
  const grid = document.getElementById('ingredientGrid');
  if (!list.length) {
    grid.innerHTML = '<li class="ingredient-placeholder">Ingredients coming soon.</li>';
    return;
  }
  grid.innerHTML = list
    .map(item => `<li class="ingredient-item"><span class="ingredient-dot"></span>${item}</li>`)
    .join('');
}

// ── INSTRUCTIONS ──────────────────────────────────────────────
function renderSteps(list) {
  const ol = document.getElementById('stepList');
  if (!list.length) {
    ol.innerHTML = '<li>Instructions coming soon.</li>';
    return;
  }
  ol.innerHTML = list
    .map(step => `<li class="step-item">${step}</li>`)
    .join('');
}

// ── NUTRITION ─────────────────────────────────────────────────
function renderNutrition(data) {
  const card = document.getElementById('nutritionCard');
  const grid = document.getElementById('nutritionGrid');
  if (!data) { card.style.display = 'none'; return; }

  const entries = [
    { label: 'Calories', value: data.calories, unit: 'kcal' },
    { label: 'Protein',  value: data.protein,  unit: '' },
    { label: 'Carbs',    value: data.carbs,     unit: '' },
    { label: 'Fat',      value: data.fat,       unit: '' },
    { label: 'Fiber',    value: data.fiber,     unit: '' },
  ];

  grid.innerHTML = entries.map(e => `
    <div class="nutrition-item">
      <div class="nutrition-value">${e.value}<span class="nutrition-unit">${e.unit}</span></div>
      <div class="nutrition-label">${e.label}</div>
    </div>
  `).join('');
}

// ── SAVE / UNSAVE ─────────────────────────────────────────────
// TODO: fetch('/api/users/me/saved', { method: 'POST'/'DELETE' }) — Shriya
function toggleDetailSave() {
  isSaved = !isSaved;
  updateSaveBtn();
}

function updateSaveBtn() {
  const btn = document.getElementById('detailSaveBtn');
  if (isSaved) {
    btn.textContent = '♥ Saved';
    btn.classList.add('saved');
  } else {
    btn.textContent = '♡ Save';
    btn.classList.remove('saved');
  }
}

function openAiModifyModal() {
  document.getElementById('aiModifyModal').style.display = 'flex';
}

function closeAiModifyModal() {
  document.getElementById('aiModifyModal').style.display = 'none';
}

async function submitAiModify() {
  const prompt = document.getElementById('aiPromptInput').value.trim();
  if (!prompt) {
    alert('Please enter a modification prompt.');
    return;
  }
  const userIdRaw = localStorage.getItem('user_id');
  const userId = parseInt(userIdRaw || '', 10);
  if (!userId || Number.isNaN(userId)) {
    alert('Please log in first so the modified recipe can be saved to your account.');
    return;
  }
  const btn = document.getElementById('submitAiModifyBtn');
  btn.disabled = true;
  btn.textContent = 'Modifying...';

  try {
    const res = await fetch(`${API_BASE}/ModifiedRecipeServlet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'modifyRecipeWithAI',
        original_recipe_id: recipeId,
        user_id: userId,
        prompt,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.modified_recipe) {
      throw new Error(data.message || 'Failed to modify recipe');
    }
    const mod = data.modified_recipe;
    if (!activeRecipe || !activeDetail) {
      throw new Error('Recipe has not loaded yet. Please refresh and try again.');
    }
    modifiedRecipe = {
      ...activeRecipe,
      title: mod.recipe_name || activeRecipe.title,
      difficulty: mod.difficulty || activeRecipe.difficulty,
      time: `${(mod.prep_time || 0) + (mod.cook_time || 0)} min`,
      tags: mod.category ? [mod.category.toLowerCase()] : activeRecipe.tags,
      displayTags: mod.category ? [mod.category] : activeRecipe.displayTags,
    };
    modifiedDetail = {
      ...activeDetail,
      ingredients: splitTextBlob(mod.ingredients),
      instructions: splitTextBlob(mod.instructions),
      nutrition: mod.nutrition || activeDetail.nutrition,
    };
    activeRecipe = modifiedRecipe;
    activeDetail = modifiedDetail;
    closeAiModifyModal();
    document.getElementById('aiPromptInput').value = '';
    renderPage();
  } catch (err) {
    alert(err.message || 'Unable to modify recipe right now.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Modify recipe';
  }
}

function splitTextBlob(value) {
  return (value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderVersionToggles() {
  const existing = document.getElementById('recipeVersionRow');
  if (existing) existing.remove();
  if (!modifiedRecipe || !modifiedDetail || !originalRecipe || !originalDetail) return;
  const row = document.createElement('div');
  row.id = 'recipeVersionRow';
  row.className = 'recipe-version-row';
  const isModified = activeRecipe === modifiedRecipe;
  row.innerHTML = `
    <button class="btn-version ${!isModified ? 'active' : ''}" onclick="showOriginalRecipe()">See original recipe</button>
    <button class="btn-version ${isModified ? 'active' : ''}" onclick="showModifiedRecipe()">See modified recipe</button>
  `;
  const header = document.querySelector('.detail-header');
  header.insertAdjacentElement('afterend', row);
}

function showOriginalRecipe() {
  if (!originalRecipe || !originalDetail) return;
  activeRecipe = { ...originalRecipe };
  activeDetail = JSON.parse(JSON.stringify(originalDetail));
  renderPage();
}

function showModifiedRecipe() {
  if (!modifiedRecipe || !modifiedDetail) return;
  activeRecipe = { ...modifiedRecipe };
  activeDetail = JSON.parse(JSON.stringify(modifiedDetail));
  renderPage();
}

// ── COMMENTS ──────────────────────────────────────────────────
// Source: Evelyn's Social Database
function renderComments() {
  const comments = (MOCK_COMMENTS || []).filter(c => c.recipeId === recipeId);

  document.getElementById('commentCountBadge').textContent = comments.length;

  const list = document.getElementById('commentList');
  if (!comments.length) {
    list.innerHTML = '<p class="no-comments">No comments yet — be the first!</p>';
    return;
  }

  list.innerHTML = comments.map(c => `
    <div class="comment-card">
      <div class="comment-avatar">${c.avatar}</div>
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-user">${c.user}</span>
          <span class="comment-stars">${renderStarsHtml(c.rating)}</span>
          <span class="comment-time">${c.time}</span>
        </div>
        <p class="comment-text">${c.text}</p>
      </div>
    </div>
  `).join('');
}

// ── INTERACTIVE STAR RATING (comment form) ───────────────────
function initInteractiveStars() {
  const stars = document.querySelectorAll('.istar');

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => highlightStars(+star.dataset.val));
    star.addEventListener('mouseleave', () => highlightStars(userRating));
    star.addEventListener('click', () => {
      userRating = +star.dataset.val;
      highlightStars(userRating);
    });
  });
}

function highlightStars(upTo) {
  document.querySelectorAll('.istar').forEach(s => {
    s.textContent = +s.dataset.val <= upTo ? '★' : '☆';
    s.classList.toggle('istar-active', +s.dataset.val <= upTo);
  });
}

// ── POST COMMENT (mock) ───────────────────────────────────────
// TODO: POST to /api/recipes/${id}/comments — Evelyn
function postComment() {
  const text = document.getElementById('commentInput').value.trim();
  if (!text) return;
  if (!userRating) { alert('Please select a star rating.'); return; }

  // Optimistically add to UI
  const newComment = {
    id: 'new_' + Date.now(),
    recipeId,
    user: '@you',
    avatar: 'Y',
    rating: userRating,
    text,
    time: 'Just now',
  };

  const list = document.getElementById('commentList');
  const noMsg = list.querySelector('.no-comments');
  if (noMsg) noMsg.remove();

  const div = document.createElement('div');
  div.className = 'comment-card comment-new';
  div.innerHTML = `
    <div class="comment-avatar">${newComment.avatar}</div>
    <div class="comment-body">
      <div class="comment-header">
        <span class="comment-user">${newComment.user}</span>
        <span class="comment-stars">${renderStarsHtml(newComment.rating)}</span>
        <span class="comment-time">${newComment.time}</span>
      </div>
      <p class="comment-text">${newComment.text}</p>
    </div>`;

  list.insertBefore(div, list.firstChild);

  // Reset form
  document.getElementById('commentInput').value = '';
  userRating = 0;
  highlightStars(0);

  // Update count badge
  const badge = document.getElementById('commentCountBadge');
  badge.textContent = parseInt(badge.textContent || '0') + 1;
}

// ── AUTH STATE ────────────────────────────────────────────────
// TODO: replace with real API call — Shriya
async function initAuthState() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const user = await res.json();
      document.getElementById('navAvatar').textContent = user.username[0].toUpperCase();
      document.querySelector('.comment-avatar-placeholder').textContent =
        user.username[0].toUpperCase();
    } else {
      setGuestMode();
    }
  } catch {
    // Backend not ready — keep mock state for dev
  }
}

function setGuestMode() {
  document.getElementById('uploadBtn').style.display = 'none';
  document.getElementById('navAvatar').style.display = 'none';
  document.getElementById('guestActions').style.display = 'flex';
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    await loadRecipeFromBackend();
    renderPage();
    initInteractiveStars();
    initAuthState();
    if (openAiModifyOnLoad) {
      openAiModifyModal();
    }
  })();
});
