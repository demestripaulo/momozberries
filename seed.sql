-- Momo'z Berriez — Product Seed Data
-- Run AFTER schema.sql:
-- wrangler d1 execute momozberriez-db --file=./seed.sql
--
-- NOTE: Replace stripe_price_id values with real IDs from scripts/stripe-setup.js output

-- ─── PRODUCTS ───────────────────────────────────────────────────────────────

INSERT OR REPLACE INTO products
  (id, name, description, price_cents, stripe_price_id, photo_url,
   calories, protein_g, carbs_g, fat_g,
   is_high_protein, is_vegan_available, is_gf_available, is_keto_available,
   is_seasonal, dietary_tags, is_active)
VALUES

-- 1. Classic Fresas con Crema
('prod_classic_fresas', 'Classic Fresas con Crema',
 'The OG that started it all. Fresh California strawberries layered over velvety Mexican crema and sweetened cream cheese, finished with a drizzle of condensed milk. Simple, iconic, and dangerously addictive.',
 1400, 'price_classic_fresas', '/images/products/1.png',
 320, 8, 38, 14,
 0, 1, 1, 1, 0, '["vegan-option","gf-option","keto-option"]', 1),

-- 2. Cookie Butter Fresas
('prod_cookie_butter', 'Cookie Butter Fresas ⭐',
 'A fan-favorite upgrade. Our classic fresas con crema base gets a luxurious Biscoff cookie butter swirl, topped with crushed Lotus cookies and a whole cookie crown. Sweet, crunchy, and completely irresistible.',
 1600, 'price_cookie_butter', '/images/products/1.png',
 480, 9, 58, 22,
 0, 1, 1, 0, 0, '["vegan-option","gf-option"]', 1),

-- 3. Ube Dream Fresas
('prod_ube_dream', 'Ube Dream Fresas 🟣',
 'Filipino-Latina fusion in a cup. Ube-infused cream turns a dreamy lavender purple, layered with fresh strawberries, crushed Oreos, and a Hello Kitty chocolate truffle on top. A TikTok moment waiting to happen.',
 1500, 'price_ube_dream', '/images/products/3.png',
 420, 10, 52, 18,
 0, 0, 1, 0, 0, '["vegetarian","gf-option"]', 1),

-- 4. The Therapy Cup
('prod_therapy_cup', 'The Therapy Cup 💚',
 '"I need to go to therapy — the therapy." Matcha-infused Greek yogurt base layered with roasted pistachio crumble, dark chocolate shavings, a Hello Kitty chocolate truffle, and crowned with a fresh strawberry. This one heals.',
 1700, 'price_therapy_cup', '/images/products/2.png',
 390, 24, 28, 19,
 1, 0, 1, 0, 0, '["high-protein","gf-option"]', 1),

-- 5. Hot Girl Cup
('prod_hot_girl', 'Hot Girl Cup 🐆',
 'Hot girls satisfy their munchies. Creamy matcha yogurt base loaded with chocolate drizzle, pistachio dust, fresh strawberries, and that iconic Hello Kitty chocolate piece. Bold. Aesthetic. Nutritious.',
 1700, 'price_hot_girl', '/images/products/2.png',
 400, 22, 30, 17,
 1, 0, 1, 0, 0, '["high-protein","gluten-free"]', 1),

-- 6. Granola Power Bowl
('prod_granola_power', 'Granola Power Bowl 🌾',
 'The girl-that-works-out special. High-protein Greek yogurt base topped generously with honey granola, fresh strawberries, a chocolate Hello Kitty piece, and a drizzle of raw honey. Satisfying, nourishing, and still very aesthetic.',
 1500, 'price_granola_power', '/images/products/5.png',
 450, 26, 42, 14,
 1, 1, 1, 0, 0, '["high-protein","vegetarian","gf-option"]', 1),

-- 7. Pink Velvet Berry
('prod_pink_velvet', 'Pink Velvet Berry ✨',
 'Pretty in pink and dangerously delicious. Strawberry cream base dusted with vibrant freeze-dried strawberry powder, topped with a fresh whole strawberry. Visually stunning, perfectly sweet, and made for the gram.',
 1400, 'price_pink_velvet', '/images/products/6.png',
 350, 8, 40, 16,
 0, 0, 1, 0, 0, '["vegetarian","gluten-free"]', 1),

-- 8. Churro Cheesecake Box
('prod_churro_cheesecake', 'Churro Cheesecake Box 🎂',
 'The showstopper. Warm, cinnamon-sugar churro cheesecake bites piled in a pink box, loaded with fresh strawberries, cream cheese drizzle, and a generous Nutella ribbon on top. Perfect for sharing — if you''re feeling generous.',
 2000, 'price_churro_cheesecake', '/images/products/4.png',
 560, 12, 64, 28,
 0, 0, 0, 0, 0, '[]', 1),

-- 9. The Bundle: Momo's Mood Board
('prod_bundle_4', 'The Bundle: Momo''s Mood Board 🎁',
 'Can''t choose just one? Don''t. Our curated 4-cup bundle comes in our signature carrier tray with a mystery "Something Sweet Inside" gift box. Choose your 4 flavors at checkout — perfect for gifting or a full vibe session with your crew.',
 5800, 'price_bundle_4', '/images/products/7.png',
 1600, 38, 180, 72,
 0, 0, 0, 0, 0, '["bundle"]', 1),

-- 10. Cinco de Mayo Special (Seasonal)
('prod_seasonal_cinco', 'Cinco de Mayo Special 🇲🇽',
 'A limited celebration trio. Three mini-cups — Classic Fresas, Pink Velvet, and The Granola Bowl — served on a branded wooden board with mini Mexican flag toppers. Festive, flavorful, and made to share.',
 1900, 'price_seasonal_cinco', '/images/products/6.png',
 820, 28, 88, 36,
 1, 0, 0, 0, 1, '["seasonal","high-protein","vegetarian"]', 1);


-- ─── INGREDIENTS (sample costs for profit calculator) ────────────────────────

-- Classic Fresas con Crema
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_cf_1', 'prod_classic_fresas', 'Fresh strawberries', 'lb', 299, 0.30),
('ing_cf_2', 'prod_classic_fresas', 'Mexican crema (table cream)', 'cup', 119, 0.25),
('ing_cf_3', 'prod_classic_fresas', 'Cream cheese', 'oz', 49, 1.50),
('ing_cf_4', 'prod_classic_fresas', 'Sweetened condensed milk', 'oz', 39, 1.00),
('ing_cf_5', 'prod_classic_fresas', 'Granulated sugar', 'cup', 89, 0.05);

-- Cookie Butter Fresas
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_cb_1', 'prod_cookie_butter', 'Fresh strawberries', 'lb', 299, 0.30),
('ing_cb_2', 'prod_cookie_butter', 'Mexican crema', 'cup', 119, 0.25),
('ing_cb_3', 'prod_cookie_butter', 'Cream cheese', 'oz', 49, 1.50),
('ing_cb_4', 'prod_cookie_butter', 'Condensed milk', 'oz', 39, 1.00),
('ing_cb_5', 'prod_cookie_butter', 'Biscoff cookie butter spread', 'oz', 89, 1.00),
('ing_cb_6', 'prod_cookie_butter', 'Lotus Biscoff cookies', 'unit', 25, 3.00);

-- The Therapy Cup
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_tc_1', 'prod_therapy_cup', 'Greek yogurt (full fat)', 'cup', 149, 0.75),
('ing_tc_2', 'prod_therapy_cup', 'Matcha powder', 'tbsp', 99, 0.50),
('ing_tc_3', 'prod_therapy_cup', 'Pistachio nuts (roasted)', 'oz', 79, 0.75),
('ing_tc_4', 'prod_therapy_cup', 'Dark chocolate chips', 'oz', 49, 0.50),
('ing_tc_5', 'prod_therapy_cup', 'Whipped cream', 'cup', 89, 0.125),
('ing_tc_6', 'prod_therapy_cup', 'Fresh strawberry', 'unit', 30, 1.00),
('ing_tc_7', 'prod_therapy_cup', 'Hello Kitty milk chocolate truffle', 'unit', 150, 1.00);

-- Hot Girl Cup
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_hg_1', 'prod_hot_girl', 'Greek yogurt', 'cup', 149, 0.75),
('ing_hg_2', 'prod_hot_girl', 'Matcha powder', 'tbsp', 99, 0.50),
('ing_hg_3', 'prod_hot_girl', 'Roasted pistachios', 'oz', 79, 0.50),
('ing_hg_4', 'prod_hot_girl', 'Dark chocolate sauce', 'tbsp', 59, 0.50),
('ing_hg_5', 'prod_hot_girl', 'Fresh strawberries', 'lb', 299, 0.20),
('ing_hg_6', 'prod_hot_girl', 'Whipped cream', 'cup', 89, 0.125),
('ing_hg_7', 'prod_hot_girl', 'Hello Kitty milk chocolate', 'unit', 150, 1.00);

-- Granola Power Bowl
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_gp_1', 'prod_granola_power', 'Greek yogurt (full fat)', 'cup', 149, 1.00),
('ing_gp_2', 'prod_granola_power', 'Honey granola', 'cup', 199, 0.375),
('ing_gp_3', 'prod_granola_power', 'Fresh strawberries', 'lb', 299, 0.25),
('ing_gp_4', 'prod_granola_power', 'Raw honey', 'tbsp', 69, 0.50),
('ing_gp_5', 'prod_granola_power', 'Hello Kitty milk chocolate truffle', 'unit', 150, 1.00);

-- Pink Velvet Berry
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_pv_1', 'prod_pink_velvet', 'Cream cheese', 'oz', 49, 2.00),
('ing_pv_2', 'prod_pink_velvet', 'Mexican crema', 'cup', 119, 0.25),
('ing_pv_3', 'prod_pink_velvet', 'Condensed milk', 'oz', 39, 0.75),
('ing_pv_4', 'prod_pink_velvet', 'Freeze-dried strawberry powder', 'oz', 249, 0.25),
('ing_pv_5', 'prod_pink_velvet', 'Fresh strawberries', 'lb', 299, 0.20),
('ing_pv_6', 'prod_pink_velvet', 'Whipped cream', 'cup', 89, 0.125);

-- Churro Cheesecake Box
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_cc_1', 'prod_churro_cheesecake', 'Puff pastry sheet', 'unit', 199, 0.25),
('ing_cc_2', 'prod_churro_cheesecake', 'Cream cheese', 'oz', 49, 3.00),
('ing_cc_3', 'prod_churro_cheesecake', 'Cinnamon sugar mix', 'tbsp', 19, 2.00),
('ing_cc_4', 'prod_churro_cheesecake', 'Fresh strawberries', 'lb', 299, 0.30),
('ing_cc_5', 'prod_churro_cheesecake', 'Nutella hazelnut spread', 'oz', 59, 1.50),
('ing_cc_6', 'prod_churro_cheesecake', 'Vanilla extract', 'tbsp', 89, 0.25);

-- Ube Dream Fresas
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_ud_1', 'prod_ube_dream', 'Fresh strawberries', 'lb', 299, 0.30),
('ing_ud_2', 'prod_ube_dream', 'Ube extract', 'tbsp', 199, 0.50),
('ing_ud_3', 'prod_ube_dream', 'Heavy cream', 'cup', 159, 0.25),
('ing_ud_4', 'prod_ube_dream', 'Cream cheese', 'oz', 49, 1.50),
('ing_ud_5', 'prod_ube_dream', 'Condensed milk', 'oz', 39, 0.75),
('ing_ud_6', 'prod_ube_dream', 'Crushed Oreo cookies', 'oz', 49, 1.00),
('ing_ud_7', 'prod_ube_dream', 'Hello Kitty chocolate truffle', 'unit', 150, 1.00);

-- The Bundle (simplified — composite product)
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_bun_1', 'prod_bundle_4', 'Cup cost (avg per cup x4)', 'unit', 400, 4.00),
('ing_bun_2', 'prod_bundle_4', 'Carrier tray', 'unit', 150, 1.00),
('ing_bun_3', 'prod_bundle_4', 'Mystery gift box', 'unit', 300, 1.00),
('ing_bun_4', 'prod_bundle_4', 'Branded sticker', 'unit', 25, 1.00);

-- Cinco de Mayo Special
INSERT OR REPLACE INTO ingredients (id, product_id, name, unit, unit_cost_cents, amount_per_serving) VALUES
('ing_cm_1', 'prod_seasonal_cinco', 'Mini cup ingredients (x3 avg)', 'unit', 350, 3.00),
('ing_cm_2', 'prod_seasonal_cinco', 'Branded wooden board', 'unit', 299, 1.00),
('ing_cm_3', 'prod_seasonal_cinco', 'Mini Mexican flag toppers', 'unit', 49, 3.00);

-- ─── SEED TODAY'S DAILY LIMIT RECORD ────────────────────────────────────────

INSERT OR IGNORE INTO daily_limits (date, orders_count, accepting_orders)
VALUES (date('now'), 0, 1);
