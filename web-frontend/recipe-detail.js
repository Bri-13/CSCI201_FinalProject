// ============================================================
// recipe-detail.js — Homebite Recipe Detail Page
//
// Depends on: data.js (must be loaded first)
// URL param:  ?id=<recipeId>
// ============================================================

// ── LOAD RECIPE FROM URL PARAM ────────────────────────────────
const params   = new URLSearchParams(window.location.search);
const recipeId = parseInt(params.get('id'));

const recipe = ALL_RECIPES.find(r => r.id === recipeId) || null;
const detail = (RECIPE_DETAILS && RECIPE_DETAILS[recipeId]) || null;

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

// ── RENDER PAGE ───────────────────────────────────────────────
function renderPage() {
  if (!recipe) {
    document.getElementById('detailTitle').textContent = 'Recipe not found.';
    return;
  }

  document.title = `${recipe.title} – Homebite`;

  // Hero
  const hero = document.getElementById('detailHero');
  hero.classList.add(recipe.bgClass);
  document.getElementById('detailEmoji').textContent = recipe.emoji;

  // AI modify link — pass recipe id as query param for Alex's page
  document.getElementById('detailAiBtn').href =
    `recipe-create.html?sourceId=${recipe.id}`;

  // Tags
  document.getElementById('detailTags').innerHTML =
    recipe.displayTags.map(t => `<span class="tag">${t}</span>`).join('');

  // Title + author
  document.getElementById('detailTitle').textContent = recipe.title;
  document.getElementById('detailAuthor').textContent = `by ${recipe.author}`;

  // Meta pills
  const servings = detail ? detail.servings : '—';
  document.getElementById('detailMeta').innerHTML = `
    <span class="meta-pill">⏱ ${recipe.time}</span>
    <span class="meta-pill">📊 ${recipe.difficulty}</span>
    <span class="meta-pill">👥 ${servings} servings</span>
  `;

  // Rating row
  document.getElementById('detailRatingRow').innerHTML = `
    <span class="detail-stars">${renderStarsHtml(recipe.rating)}</span>
    <span class="detail-rating-num">${recipe.rating} · ${formatCount(recipe.ratingCount)} ratings</span>
    <span class="detail-comment-count">💬 ${formatCount(recipe.commentCount)}</span>
  `;

  // Save button state
  updateSaveBtn();

  // Description
  document.getElementById('detailDesc').textContent =
    detail ? detail.description : 'Full recipe details coming soon.';

  // Servings
  document.getElementById('detailServings').textContent =
    detail ? `Makes ${detail.servings} servings` : '';

  // Ingredients
  renderIngredients(detail ? detail.ingredients : []);

  // Instructions
  renderSteps(detail ? detail.instructions : []);

  // Nutrition
  renderNutrition(detail ? detail.nutrition : null);

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
  renderPage();
  initInteractiveStars();
  initAuthState();
});
