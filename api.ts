// ============================================================
// api.ts — Homebite backend API client
//
// Centralizes ALL network calls and translates backend shapes
// (snake_case, limited fields) into the front-end Recipe shape
// that our UI components expect.
//
// If you need to change the server IP, change it here (one place).
// ============================================================

import { Recipe, RecipeDetail } from './data';

// ⚠️ Change this to your computer's LAN IP when testing on a phone.
// On web / simulator, localhost works.
export const BASE_URL = 'http://localhost:8080/AuthApp';

// Backend shapes (Christopher's servlets)
export type BackendRecipe = {
  recipe_id: number;
  user_id: number;
  recipe_name: string;
  ingredients: string;   // TEXT blob, newline-separated
  instructions: string;  // TEXT blob, newline-separated
  prep_time: number;
  cook_time: number;
  difficulty: string;
  category: string;
  photo_url: string;
  created_at: string;
};

export type BackendModifiedRecipe = BackendRecipe & {
  modified_recipe_id: number;
  original_recipe_id: number;
};

// ── ICON GUESSER ────────────────────────────────────────────
// We don't have photo URLs working yet, so map recipe_name keywords
// to MaterialCommunityIcons names. Falls back to a generic food icon.
const ICON_KEYWORDS: Array<[RegExp, string]> = [
  [/pizza/i,                   'pizza'],
  [/pasta|spaghetti|noodle|ramen|lasagna/i, 'noodles'],
  [/burger|sandwich/i,         'hamburger'],
  [/salad/i,                   'bowl-mix'],
  [/cake|dessert|pie|tart/i,   'cake-variant'],
  [/ice cream|gelato/i,        'ice-cream'],
  [/cookie|biscuit/i,          'cookie'],
  [/bread|toast|baguette/i,    'bread-slice'],
  [/rice|risotto|bento/i,      'rice'],
  [/taco|burrito|quesadilla/i, 'taco'],
  [/fries|chip/i,              'french-fries'],
  [/soup|stew|curry|dal/i,     'pot-steam'],
  [/egg|omelet|shakshuka/i,    'egg-fried'],
  [/fish|shrimp|seafood/i,     'fish'],
  [/chicken|turkey/i,          'food-drumstick'],
  [/vegan|salad|vegetable|broccoli/i, 'leaf'],
  [/smoothie|juice|drink/i,    'cup'],
];

function guessIcon(name: string): string {
  for (const [re, icon] of ICON_KEYWORDS) {
    if (re.test(name)) return icon;
  }
  return 'silverware-fork-knife';
}

// Cycle through palette colors based on id — consistent per recipe.
const PALETTE = ['#E8C4AD', '#B7D0A8', '#D9C9A8', '#C8BDE0', '#E8C5C5', '#B5C8D4'];
function colorFor(id: number): string {
  return PALETTE[id % PALETTE.length];
}

function heightFor(id: number): number {
  // Same deterministic per-id height so masonry doesn't jump on re-render.
  const options = [150, 165, 180, 195, 210, 220];
  return options[id % options.length];
}

// ── NORMALIZE ───────────────────────────────────────────────
// Turn a backend Recipe row into our front-end Recipe shape.
// Fields the backend doesn't have are filled with safe defaults.
export function normalizeRecipe(r: BackendRecipe): Recipe {
  const totalMin = (r.prep_time || 0) + (r.cook_time || 0);
  const category = (r.category || '').toLowerCase().trim();

  // Keep difficulty within our union type.
  const diffRaw = (r.difficulty || 'Easy').toLowerCase();
  const difficulty: Recipe['difficulty'] =
    diffRaw.includes('hard') ? 'Hard'
    : diffRaw.includes('med') ? 'Medium'
    : 'Easy';

  return {
    id:           r.recipe_id,
    iconName:     guessIcon(r.recipe_name),
    bgColor:      colorFor(r.recipe_id),
    imgHeight:    heightFor(r.recipe_id),
    title:        r.recipe_name,
    author:       `@user${r.user_id}`,    // TODO: join Users to get username — Shriya
    time:         totalMin > 0 ? `${totalMin} min` : '—',
    timeMin:      totalMin,
    difficulty,
    tags:         category ? [category] : [],
    displayTags:  category ? [category[0].toUpperCase() + category.slice(1)] : [],
    rating:       0,     // TODO: Evelyn's social servlet
    ratingCount:  0,     // TODO: Evelyn
    commentCount: 0,     // TODO: Evelyn
  };
}

// Derive RecipeDetail fields from a backend row (best effort).
// `ingredients` / `instructions` come back as one big TEXT blob;
// we split on newlines.
export function normalizeDetail(r: BackendRecipe): RecipeDetail {
  const splitList = (s: string) =>
    s.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  return {
    description: '',  // Backend has no description field yet
    servings: 0,      // Backend has no servings field yet
    ingredients: splitList(r.ingredients),
    instructions: splitList(r.instructions),
    nutrition: {
      calories: 0,
      protein: '—',
      carbs: '—',
      fat: '—',
      fiber: '—',
    },
  };
}

// ── API CALLS ───────────────────────────────────────────────
async function safeFetch(url: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
}

export async function fetchAllRecipes(): Promise<Recipe[]> {
  const data = await safeFetch(`${BASE_URL}/RecipeServlet?action=getAllRecipes`);
  const rows: BackendRecipe[] = data.recipes || [];
  return rows.map(normalizeRecipe);
}

export async function fetchRecipe(id: number): Promise<{
  recipe: Recipe;
  detail: RecipeDetail;
  raw: BackendRecipe;
} | null> {
  try {
    const data = await safeFetch(
      `${BASE_URL}/RecipeServlet?action=getRecipe&recipe_id=${id}`
    );
    const raw: BackendRecipe = data.recipe;
    return {
      recipe: normalizeRecipe(raw),
      detail: normalizeDetail(raw),
      raw,
    };
  } catch {
    return null;
  }
}

export async function fetchUserRecipes(userId: number): Promise<Recipe[]> {
  const data = await safeFetch(
    `${BASE_URL}/RecipeServlet?action=getUserRecipes&user_id=${userId}`
  );
  const rows: BackendRecipe[] = data.recipes || [];
  return rows.map(normalizeRecipe);
}

export async function createRecipe(recipe: {
  user_id: number;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  prep_time?: number;
  cook_time?: number;
  difficulty?: string;
  category?: string;
  photo_url?: string;
}): Promise<number> {
  const data = await safeFetch(`${BASE_URL}/RecipeServlet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addRecipe', ...recipe }),
  });
  return data.recipe_id;
}

// ── MODIFIED RECIPES (Christopher's second servlet) ─────────
export async function fetchUserModifiedRecipes(userId: number): Promise<BackendModifiedRecipe[]> {
  const data = await safeFetch(
    `${BASE_URL}/ModifiedRecipeServlet?action=getUserModifiedRecipes&user_id=${userId}`
  );
  return data.modified_recipes || [];
}

export async function createModifiedRecipe(payload: {
  original_recipe_id: number;
  user_id: number;
  recipe_name?: string;
  ingredients?: string;
  instructions?: string;
  prep_time?: number;
  cook_time?: number;
  difficulty?: string;
  category?: string;
  photo_url?: string;
}): Promise<number> {
  const data = await safeFetch(`${BASE_URL}/ModifiedRecipeServlet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createModifiedRecipe', ...payload }),
  });
  return data.modified_recipe_id;
}
