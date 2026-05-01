import {
  ALL_RECIPES, RECIPE_DETAILS, MOCK_COMMENTS,
  POPULAR_IDS, INITIAL_SAVED_IDS, SAVED_PREVIEW,
} from '../data';

describe('mock data integrity', () => {
  test('ALL_RECIPES has unique IDs', () => {
    const ids = ALL_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every recipe has required fields', () => {
    for (const r of ALL_RECIPES) {
      expect(r.title).toBeTruthy();
      expect(r.author).toBeTruthy();
      expect(['Easy', 'Medium', 'Hard']).toContain(r.difficulty);
      expect(r.timeMin).toBeGreaterThanOrEqual(0);
      expect(r.rating).toBeGreaterThanOrEqual(0);
      expect(r.rating).toBeLessThanOrEqual(5);
      expect(r.tags.length).toBeGreaterThan(0);
      expect(r.displayTags.length).toBeGreaterThan(0);
    }
  });

  test('POPULAR_IDS reference valid recipe IDs', () => {
    const ids = new Set(ALL_RECIPES.map((r) => r.id));
    for (const id of POPULAR_IDS) {
      expect(ids.has(id)).toBe(true);
    }
  });

  test('INITIAL_SAVED_IDS reference valid recipe IDs', () => {
    const ids = new Set(ALL_RECIPES.map((r) => r.id));
    for (const id of INITIAL_SAVED_IDS) {
      expect(ids.has(id)).toBe(true);
    }
  });

  test('SAVED_PREVIEW entries reference valid recipe IDs', () => {
    const ids = new Set(ALL_RECIPES.map((r) => r.id));
    for (const s of SAVED_PREVIEW) {
      expect(ids.has(s.id)).toBe(true);
    }
  });

  test('RECIPE_DETAILS keys match existing recipe IDs', () => {
    const ids = new Set(ALL_RECIPES.map((r) => r.id));
    for (const key of Object.keys(RECIPE_DETAILS)) {
      expect(ids.has(Number(key))).toBe(true);
    }
  });

  test('RECIPE_DETAILS entries have non-empty ingredients and instructions', () => {
    for (const [, detail] of Object.entries(RECIPE_DETAILS)) {
      expect(detail.ingredients.length).toBeGreaterThan(0);
      expect(detail.instructions.length).toBeGreaterThan(0);
    }
  });

  test('MOCK_COMMENTS reference valid recipe IDs', () => {
    const ids = new Set(ALL_RECIPES.map((r) => r.id));
    for (const c of MOCK_COMMENTS) {
      expect(ids.has(c.recipeId)).toBe(true);
    }
  });

  test('MOCK_COMMENTS ratings are between 1 and 5', () => {
    for (const c of MOCK_COMMENTS) {
      expect(c.rating).toBeGreaterThanOrEqual(1);
      expect(c.rating).toBeLessThanOrEqual(5);
    }
  });
});
