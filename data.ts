// ============================================================
// data.ts — Homebite mock data (shared by home + recipe-detail)
//
// All data is MOCK. When backend adds /api/recipes etc,
// replace the constant exports with fetch() calls.
// Shape must stay the same so pages don't break.
// ============================================================

export type Recipe = {
  id: number;
  iconName: string;      // MaterialCommunityIcons name
  bgColor: string;       // hex color
  imgHeight: number;
  title: string;
  author: string;
  time: string;
  timeMin: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  displayTags: string[];
  rating: number;
  ratingCount: number;
  commentCount: number;
};

export type RecipeDetail = {
  description: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
};

export type Comment = {
  id: string;
  recipeId: number;
  user: string;
  avatar: string;
  rating: number;
  text: string;
  time: string;
};

// ── PALETTE (muted, to match Brianna's beige+green profile.tsx) ──
const C_ORANGE = '#E8C4AD';
const C_GREEN  = '#B7D0A8';
const C_TAN    = '#D9C9A8';
const C_PURPLE = '#C8BDE0';
const C_PINK   = '#E8C5C5';
const C_BLUE   = '#B5C8D4';

// ── RECIPES ─────────────────────────────────────────────────
// TODO(Christopher): replace with fetch('/api/recipes')
export const ALL_RECIPES: Recipe[] = [
  {
    id: 1, iconName: 'pot-mix', bgColor: C_ORANGE, imgHeight: 200,
    title: 'Garlic Risotto', author: '@chefitalia',
    time: '45 min', timeMin: 45, difficulty: 'Medium',
    tags: ['italian'], displayTags: ['Italian'],
    rating: 4.8, ratingCount: 120, commentCount: 34,
  },
  {
    id: 2, iconName: 'bowl-mix', bgColor: C_GREEN, imgHeight: 160,
    title: 'Green Caesar Salad', author: '@saladdays',
    time: '15 min', timeMin: 15, difficulty: 'Easy',
    tags: ['healthy'], displayTags: ['Healthy'],
    rating: 4.3, ratingCount: 86, commentCount: 21,
  },
  {
    id: 3, iconName: 'french-fries', bgColor: C_TAN, imgHeight: 180,
    title: 'Garlic Side Dish', author: '@sidedish',
    time: '20 min', timeMin: 20, difficulty: 'Easy',
    tags: ['quick'], displayTags: ['Quick meals'],
    rating: 4.1, ratingCount: 54, commentCount: 11,
  },
  {
    id: 4, iconName: 'noodles', bgColor: C_ORANGE, imgHeight: 220,
    title: 'Creamy Mushroom Pasta', author: '@chefmaria',
    time: '30 min', timeMin: 30, difficulty: 'Easy',
    tags: ['pasta', 'vegan'], displayTags: ['Pasta', 'Vegan'],
    rating: 4.9, ratingCount: 210, commentCount: 67,
  },
  {
    id: 5, iconName: 'leaf', bgColor: C_GREEN, imgHeight: 170,
    title: 'Sesame Broccoli Stir Fry', author: '@veggielove',
    time: '20 min', timeMin: 20, difficulty: 'Easy',
    tags: ['asian', 'vegan'], displayTags: ['Asian', 'Vegan'],
    rating: 4.2, ratingCount: 67, commentCount: 18,
  },
  {
    id: 6, iconName: 'egg-fried', bgColor: C_TAN, imgHeight: 190,
    title: 'Shakshuka with Feta', author: '@breakfastclub',
    time: '25 min', timeMin: 25, difficulty: 'Easy',
    tags: ['breakfast', 'healthy'], displayTags: ['Breakfast', 'Healthy'],
    rating: 4.7, ratingCount: 143, commentCount: 52,
  },
  {
    id: 7, iconName: 'cake-variant', bgColor: C_PURPLE, imgHeight: 210,
    title: 'Lemon Ricotta Cake', author: '@sweettooth',
    time: '60 min', timeMin: 60, difficulty: 'Medium',
    tags: ['desserts', 'italian'], displayTags: ['Desserts', 'Italian'],
    rating: 4.5, ratingCount: 98, commentCount: 29,
  },
  {
    id: 8, iconName: 'noodles', bgColor: C_PINK, imgHeight: 195,
    title: 'Miso Ramen', author: '@ramenking',
    time: '40 min', timeMin: 40, difficulty: 'Medium',
    tags: ['asian'], displayTags: ['Asian'],
    rating: 4.8, ratingCount: 175, commentCount: 61,
  },
  {
    id: 9, iconName: 'cookie', bgColor: C_BLUE, imgHeight: 165,
    title: 'Fluffy Pancakes', author: '@mornings',
    time: '20 min', timeMin: 20, difficulty: 'Easy',
    tags: ['breakfast', 'quick'], displayTags: ['Breakfast', 'Quick'],
    rating: 4.6, ratingCount: 230, commentCount: 74,
  },
  {
    id: 10, iconName: 'bottle-soda', bgColor: C_GREEN, imgHeight: 155,
    title: 'Overnight Oats', author: '@healthyeats',
    time: '5 min', timeMin: 5, difficulty: 'Easy',
    tags: ['healthy', 'quick'], displayTags: ['Healthy', 'Quick meals'],
    rating: 4.1, ratingCount: 59, commentCount: 14,
  },
  {
    id: 11, iconName: 'taco', bgColor: C_ORANGE, imgHeight: 200,
    title: 'Street Tacos al Pastor', author: '@tacosforever',
    time: '35 min', timeMin: 35, difficulty: 'Medium',
    tags: ['mexican'], displayTags: ['Mexican'],
    rating: 4.9, ratingCount: 312, commentCount: 98,
  },
  {
    id: 12, iconName: 'food-drumstick', bgColor: C_TAN, imgHeight: 215,
    title: 'Butter Chicken', author: '@spicelab',
    time: '50 min', timeMin: 50, difficulty: 'Medium',
    tags: ['indian'], displayTags: ['Indian'],
    rating: 4.8, ratingCount: 289, commentCount: 83,
  },
  {
    id: 13, iconName: 'hamburger', bgColor: C_GREEN, imgHeight: 175,
    title: 'Greek Falafel Wrap', author: '@medkitchen',
    time: '30 min', timeMin: 30, difficulty: 'Easy',
    tags: ['mediterranean', 'vegan'], displayTags: ['Mediterranean', 'Vegan'],
    rating: 4.4, ratingCount: 102, commentCount: 27,
  },
  {
    id: 14, iconName: 'hamburger', bgColor: C_PINK, imgHeight: 185,
    title: 'Smash Burger', author: '@burgerbros',
    time: '20 min', timeMin: 20, difficulty: 'Easy',
    tags: ['american', 'quick'], displayTags: ['American', 'Quick'],
    rating: 4.7, ratingCount: 198, commentCount: 55,
  },
  {
    id: 15, iconName: 'food-takeout-box', bgColor: C_BLUE, imgHeight: 205,
    title: 'Chicken Teriyaki Bento', author: '@bentolover',
    time: '35 min', timeMin: 35, difficulty: 'Medium',
    tags: ['asian'], displayTags: ['Asian'],
    rating: 4.5, ratingCount: 134, commentCount: 38,
  },
  {
    id: 16, iconName: 'pie', bgColor: C_PURPLE, imgHeight: 225,
    title: 'Classic Apple Pie', author: '@bakingwithkate',
    time: '90 min', timeMin: 90, difficulty: 'Hard',
    tags: ['desserts', 'american'], displayTags: ['Desserts', 'American'],
    rating: 4.9, ratingCount: 401, commentCount: 132,
  },
  {
    id: 17, iconName: 'bread-slice', bgColor: C_ORANGE, imgHeight: 170,
    title: 'Avocado Toast', author: '@brunchclub',
    time: '10 min', timeMin: 10, difficulty: 'Easy',
    tags: ['breakfast', 'healthy', 'quick', 'vegan'],
    displayTags: ['Breakfast', 'Healthy'],
    rating: 4.2, ratingCount: 77, commentCount: 19,
  },
  {
    id: 18, iconName: 'pot-steam', bgColor: C_TAN, imgHeight: 195,
    title: 'Red Lentil Dal', author: '@plantbased',
    time: '40 min', timeMin: 40, difficulty: 'Easy',
    tags: ['indian', 'vegan', 'healthy'],
    displayTags: ['Indian', 'Vegan'],
    rating: 4.8, ratingCount: 221, commentCount: 71,
  },
  {
    id: 19, iconName: 'pizza', bgColor: C_PINK, imgHeight: 185,
    title: 'Margherita Pizza', author: '@pizzanapoletana',
    time: '45 min', timeMin: 45, difficulty: 'Medium',
    tags: ['italian'], displayTags: ['Italian'],
    rating: 4.9, ratingCount: 534, commentCount: 176,
  },
  {
    id: 20, iconName: 'ice-cream', bgColor: C_BLUE, imgHeight: 160,
    title: 'Mango Sticky Rice', author: '@thaikitchen',
    time: '30 min', timeMin: 30, difficulty: 'Easy',
    tags: ['asian', 'desserts'], displayTags: ['Asian', 'Desserts'],
    rating: 4.6, ratingCount: 88, commentCount: 23,
  },
  {
    id: 21, iconName: 'bowl-mix', bgColor: C_GREEN, imgHeight: 150,
    title: 'Acai Bowl', author: '@superfoodie',
    time: '10 min', timeMin: 10, difficulty: 'Easy',
    tags: ['healthy', 'quick', 'vegan'],
    displayTags: ['Healthy', 'Vegan'],
    rating: 4.3, ratingCount: 65, commentCount: 16,
  },
  {
    id: 22, iconName: 'fish', bgColor: C_ORANGE, imgHeight: 210,
    title: 'Garlic Butter Shrimp', author: '@seafoodlover',
    time: '15 min', timeMin: 15, difficulty: 'Easy',
    tags: ['american', 'quick'], displayTags: ['American', 'Quick'],
    rating: 4.8, ratingCount: 167, commentCount: 49,
  },
];

// ── POPULAR RECIPE IDs ───────────────────────────────────────
// TODO(Ramsey): replace with fetch('/api/recipes/popular')
export const POPULAR_IDS: number[] = [4, 8, 16, 19, 12];

// ── SAVED RECIPES ────────────────────────────────────────────
// TODO(Shriya): replace with fetch('/api/users/me/saved')
export const INITIAL_SAVED_IDS: number[] = [1, 6, 7];

export const SAVED_PREVIEW = [
  { id: 1, name: 'Garlic Risotto',     author: '@chefitalia',    dotColor: '#8FAE8A' },
  { id: 6, name: 'Shakshuka w/ Feta',  author: '@breakfastclub', dotColor: '#B7D0A8' },
  { id: 7, name: 'Lemon Ricotta Cake', author: '@sweettooth',    dotColor: '#C8BDE0' },
];

export const MODIFIED_PREVIEW = [
  { id: 'mod1', iconName: 'sprout',   modTitle: 'Vegan Risotto',    originalTitle: 'Garlic Risotto' },
  { id: 'mod2', iconName: 'cup-water', modTitle: 'Dairy-Free Pasta', originalTitle: 'Mushroom Pasta' },
];

// ── RECIPE DETAILS ───────────────────────────────────────────
// TODO(Christopher): replace with fetch(`/api/recipes/${id}`)
export const RECIPE_DETAILS: { [key: number]: RecipeDetail } = {
  1: {
    description: 'A velvety, restaurant-quality risotto perfumed with roasted garlic. Made with arborio rice slowly coaxed to creaminess with white wine and parmesan.',
    servings: 4,
    ingredients: [
      '2 cups arborio rice', '6 cups warm chicken stock',
      '1 whole head of garlic', '1 cup dry white wine',
      '1 medium onion, finely diced', '3 tbsp olive oil',
      '2 tbsp unsalted butter', '3/4 cup grated parmesan',
      'Salt & black pepper to taste', 'Fresh parsley to garnish',
    ],
    instructions: [
      'Roast the garlic: slice off the top of a whole head, drizzle with olive oil, wrap in foil, roast at 400F for 40 min until golden soft. Squeeze out cloves and mash into a paste.',
      'Keep chicken stock warm in a saucepan over low heat throughout cooking.',
      'Heat olive oil in a wide pan over medium heat. Saute diced onion 5 minutes until translucent.',
      'Add arborio rice and toast 2 minutes, stirring, until edges turn translucent.',
      'Pour in white wine and stir until fully absorbed.',
      'Add warm stock one ladle at a time, stirring constantly and waiting for each ladle to absorb before adding the next — about 18-20 minutes total.',
      'Stir in the roasted garlic paste during the last 5 minutes of cooking.',
      'Remove from heat. Fold in butter and parmesan. Season with salt and pepper.',
      'Rest 2 minutes, then serve immediately garnished with fresh parsley.',
    ],
    nutrition: { calories: 420, protein: '14g', carbs: '68g', fat: '11g', fiber: '2g' },
  },
  4: {
    description: 'A rich, earthy pasta sauce made with a medley of mushrooms and cashew cream. Completely dairy-free and deeply satisfying.',
    servings: 3,
    ingredients: [
      '300g pappardelle pasta', '400g mixed mushrooms (cremini, shiitake, oyster)',
      '3 cloves garlic, minced', '1 cup cashew cream',
      '1/2 cup vegetable stock', '2 tbsp olive oil',
      '1 tbsp soy sauce', '1 tsp fresh thyme',
      'Salt & pepper to taste', 'Fresh parsley to garnish',
    ],
    instructions: [
      'Soak cashews in boiling water 15 min, then blend with 1/2 cup water until completely smooth.',
      'Cook pasta in heavily salted boiling water until al dente. Reserve 1 cup pasta water before draining.',
      'Heat olive oil in a large skillet over high heat. Add mushrooms in a single layer — do not stir for 3 min to get a golden sear.',
      'Reduce to medium heat. Add garlic and thyme, cook 1 min until fragrant.',
      'Add soy sauce and vegetable stock. Stir, scraping up any browned bits.',
      'Pour in cashew cream. Simmer 3-4 min until slightly thickened.',
      'Toss in drained pasta. Add reserved pasta water a splash at a time to reach a silky consistency.',
      'Season generously. Serve topped with fresh parsley.',
    ],
    nutrition: { calories: 510, protein: '18g', carbs: '72g', fat: '19g', fiber: '5g' },
  },
};

// ── MOCK COMMENTS ─────────────────────────────────────────────
// TODO(Evelyn): replace with fetch(`/api/recipes/${id}/comments`)
export const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', recipeId: 1, user: '@foodlover99',    avatar: 'F', rating: 5, text: 'Made this last weekend for my family — they loved it! The roasted garlic makes all the difference.', time: '2 days ago' },
  { id: 'c2', recipeId: 1, user: '@italianatheart', avatar: 'I', rating: 5, text: 'Authentic and delicious. I added a splash more wine and it was perfect.', time: '5 days ago' },
  { id: 'c3', recipeId: 1, user: '@homecook',       avatar: 'H', rating: 4, text: 'Great recipe but takes patience with the stirring. Totally worth it!', time: '1 week ago' },
  { id: 'c4', recipeId: 4, user: '@veganvibes',     avatar: 'V', rating: 5, text: 'Best vegan pasta I have ever made. The cashew cream is a game changer.', time: '3 days ago' },
  { id: 'c5', recipeId: 4, user: '@pastanight',     avatar: 'P', rating: 5, text: 'Incredible depth of flavor from the mushroom sear. Will make again and again.', time: '1 week ago' },
];

export const BATCH_SIZE = 8;
