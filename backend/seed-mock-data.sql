-- ==========================================================
-- Homebite Mock Data Seed Script (v2 — includes SavedRecipes)
-- Run this AFTER you've created the database schema
-- ==========================================================

USE auth_db;

-- ────────── USERS ──────────
INSERT INTO Users (username, email, password) VALUES
('chefitalia',     'chefitalia@test.com',     'pass123'),
('saladdays',      'saladdays@test.com',      'pass123'),
('breakfastclub',  'breakfastclub@test.com',  'pass123'),
('ramenking',      'ramenking@test.com',      'pass123'),
('sweettooth',     'sweettooth@test.com',     'pass123'),
('veggielove',     'veggielove@test.com',     'pass123'),
('mornings',       'mornings@test.com',       'pass123'),
('testuser',       'test@test.com',           'pass123');

-- ────────── RECIPES ──────────
INSERT INTO Recipes (user_id, recipe_name, ingredients, instructions, prep_time, cook_time, difficulty, category) VALUES
(1, 'Garlic Risotto',
 '2 cups arborio rice\n6 cups chicken stock\n1 head garlic\n1 cup white wine\n1 onion\n3 tbsp olive oil\n1/2 cup parmesan',
 'Roast garlic in oven 30 min.\nWarm stock in saucepan.\nSauté onion in olive oil.\nAdd rice, toast 2 min.\nDeglaze with wine.\nLadle stock gradually, stirring, 18 min.\nFold in roasted garlic and parmesan.',
 15, 30, 'Medium', 'italian'),

(2, 'Green Caesar Salad',
 '1 head romaine\n1/2 cup parmesan\n2 anchovy fillets\n1 lemon\n2 cloves garlic\n1/4 cup olive oil\nCroutons',
 'Whisk anchovies, garlic, lemon, oil into dressing.\nChop romaine.\nToss with dressing.\nTop with parmesan and croutons.',
 10, 5, 'Easy', 'healthy'),

(3, 'Shakshuka with Feta',
 '4 eggs\n1 can crushed tomatoes\n1 onion\n1 red pepper\n1/2 cup feta\n1 tsp paprika\n1 tsp cumin',
 'Sauté onion and pepper.\nAdd spices, then tomatoes, simmer 10 min.\nMake wells, crack eggs in.\nCover and cook until eggs set.\nTop with feta.',
 10, 20, 'Easy', 'breakfast'),

(4, 'Miso Ramen',
 '2 packs ramen noodles\n4 cups dashi\n3 tbsp miso paste\n2 eggs\n1 cup mushrooms\nGreen onions\nNori',
 'Soft-boil eggs 6 min, peel.\nWhisk miso into hot dashi.\nCook noodles separately.\nAssemble bowls with noodles, broth, mushrooms, halved eggs, scallions, nori.',
 10, 15, 'Medium', 'asian'),

(5, 'Lemon Ricotta Cake',
 '2 cups flour\n1 cup ricotta\n3 eggs\n1 cup sugar\n2 lemons\n1 tsp baking powder\n1/2 cup butter',
 'Cream butter and sugar.\nBeat in eggs and ricotta.\nFold in flour, baking powder, lemon zest.\nBake 350°F for 50 min.\nGlaze with lemon juice.',
 20, 50, 'Medium', 'desserts'),

(6, 'Sesame Broccoli Stir Fry',
 '2 heads broccoli\n3 tbsp soy sauce\n2 tbsp sesame oil\n2 cloves garlic\n1 tsp ginger\n1 tbsp sesame seeds',
 'Cut broccoli into florets.\nHeat oil, add garlic and ginger.\nStir fry broccoli 5 min.\nAdd soy sauce, toss.\nFinish with sesame seeds.',
 5, 10, 'Easy', 'asian'),

(7, 'Fluffy Pancakes',
 '2 cups flour\n2 tbsp sugar\n2 tsp baking powder\n2 cups milk\n2 eggs\n3 tbsp butter',
 'Whisk dry ingredients.\nCombine wet ingredients separately.\nFold wet into dry, do not overmix.\nCook on griddle 2 min per side.\nServe with maple syrup.',
 5, 15, 'Easy', 'breakfast'),

(8, 'Vegan Lentil Curry',
 '1 cup red lentils\n1 can coconut milk\n1 onion\n2 cloves garlic\n1 tbsp curry powder\n1 can diced tomatoes\nSpinach',
 'Sauté onion and garlic.\nAdd curry powder, toast 30 sec.\nAdd lentils, tomatoes, coconut milk.\nSimmer 25 min.\nStir in spinach to wilt.',
 10, 30, 'Easy', 'vegan');

-- ────────── COMMENTS ──────────
INSERT INTO comments (recipe_id, user_id, comment_text) VALUES
(1, 2, 'Best risotto recipe ever! The roasted garlic makes it.'),
(1, 3, 'Took longer than 30 min but worth it. So creamy.'),
(2, 4, 'Fresh and easy. Skipped anchovies and still great.'),
(4, 1, 'Restaurant quality at home. The miso broth is perfect.'),
(5, 6, 'My family loved this. Light and not too sweet.'),
(7, 1, 'Fluffiest pancakes I have ever made!');

-- ────────── RATINGS ──────────
INSERT INTO ratings (recipe_id, user_id, rating_value) VALUES
(1, 2, 5), (1, 3, 5), (1, 4, 4), (1, 5, 5),
(2, 1, 4), (2, 4, 4), (2, 5, 5),
(3, 4, 4), (3, 6, 5),
(4, 1, 5), (4, 5, 5), (4, 6, 4),
(5, 1, 4), (5, 6, 5),
(7, 1, 5), (7, 2, 4), (7, 3, 5);

-- ────────── SAVED RECIPES ──────────
-- testuser (id=8) has saved a few recipes so the Saved tab is not empty on demo
INSERT INTO SavedRecipes (user_id, recipe_id) VALUES
(8, 1),  -- testuser saved Garlic Risotto
(8, 4),  -- testuser saved Miso Ramen
(8, 7);  -- testuser saved Fluffy Pancakes

-- ────────── VERIFY ──────────
SELECT COUNT(*) AS users     FROM Users;
SELECT COUNT(*) AS recipes   FROM Recipes;
SELECT COUNT(*) AS comments  FROM comments;
SELECT COUNT(*) AS ratings   FROM ratings;
SELECT COUNT(*) AS saved     FROM SavedRecipes;
