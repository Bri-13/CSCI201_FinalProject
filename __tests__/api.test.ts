import { normalizeRecipe, normalizeDetail, BackendRecipe } from '../api';

const makeBackendRecipe = (overrides: Partial<BackendRecipe> = {}): BackendRecipe => ({
  recipe_id: 1,
  user_id: 10,
  recipe_name: 'Test Recipe',
  ingredients: 'salt\npepper\ngarlic',
  instructions: 'Step one\nStep two',
  prep_time: 10,
  cook_time: 20,
  difficulty: 'Easy',
  category: 'italian',
  photo_url: '',
  created_at: '2025-01-01',
  ...overrides,
});

describe('normalizeRecipe', () => {
  test('maps basic fields correctly', () => {
    const result = normalizeRecipe(makeBackendRecipe());
    expect(result.id).toBe(1);
    expect(result.title).toBe('Test Recipe');
    expect(result.author).toBe('@user10');
    expect(result.difficulty).toBe('Easy');
    expect(result.timeMin).toBe(30);
    expect(result.time).toBe('30 min');
    expect(result.tags).toEqual(['italian']);
    expect(result.displayTags).toEqual(['Italian']);
  });

  test('maps Medium difficulty', () => {
    const result = normalizeRecipe(makeBackendRecipe({ difficulty: 'medium' }));
    expect(result.difficulty).toBe('Medium');
  });

  test('maps Hard difficulty', () => {
    const result = normalizeRecipe(makeBackendRecipe({ difficulty: 'Hard' }));
    expect(result.difficulty).toBe('Hard');
  });

  test('defaults to Easy for unknown difficulty', () => {
    const result = normalizeRecipe(makeBackendRecipe({ difficulty: '' }));
    expect(result.difficulty).toBe('Easy');
  });

  test('handles zero times', () => {
    const result = normalizeRecipe(makeBackendRecipe({ prep_time: 0, cook_time: 0 }));
    expect(result.timeMin).toBe(0);
    expect(result.time).toBe('—');
  });

  test('handles empty category', () => {
    const result = normalizeRecipe(makeBackendRecipe({ category: '' }));
    expect(result.tags).toEqual([]);
    expect(result.displayTags).toEqual([]);
  });

  test('assigns consistent color and height per id', () => {
    const a = normalizeRecipe(makeBackendRecipe({ recipe_id: 5 }));
    const b = normalizeRecipe(makeBackendRecipe({ recipe_id: 5 }));
    expect(a.bgColor).toBe(b.bgColor);
    expect(a.imgHeight).toBe(b.imgHeight);
  });

  test('guesses icon for pizza recipe', () => {
    const result = normalizeRecipe(makeBackendRecipe({ recipe_name: 'Pepperoni Pizza' }));
    expect(result.iconName).toBe('pizza');
  });

  test('guesses icon for pasta recipe', () => {
    const result = normalizeRecipe(makeBackendRecipe({ recipe_name: 'Creamy Pasta' }));
    expect(result.iconName).toBe('noodles');
  });

  test('falls back to generic icon for unknown name', () => {
    const result = normalizeRecipe(makeBackendRecipe({ recipe_name: 'Mystery Dish' }));
    expect(result.iconName).toBe('silverware-fork-knife');
  });
});

describe('normalizeDetail', () => {
  test('splits ingredients by newline', () => {
    const result = normalizeDetail(makeBackendRecipe());
    expect(result.ingredients).toEqual(['salt', 'pepper', 'garlic']);
  });

  test('splits instructions by newline', () => {
    const result = normalizeDetail(makeBackendRecipe());
    expect(result.instructions).toEqual(['Step one', 'Step two']);
  });

  test('filters out blank lines', () => {
    const result = normalizeDetail(makeBackendRecipe({
      ingredients: 'a\n\n  \nb',
      instructions: 'first\n\nsecond',
    }));
    expect(result.ingredients).toEqual(['a', 'b']);
    expect(result.instructions).toEqual(['first', 'second']);
  });

  test('returns empty description and zero servings (not in backend yet)', () => {
    const result = normalizeDetail(makeBackendRecipe());
    expect(result.description).toBe('');
    expect(result.servings).toBe(0);
  });

  test('returns placeholder nutrition values', () => {
    const result = normalizeDetail(makeBackendRecipe());
    expect(result.nutrition.calories).toBe(0);
    expect(result.nutrition.protein).toBe('—');
  });
});
