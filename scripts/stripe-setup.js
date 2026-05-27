#!/usr/bin/env node
/**
 * Creates all 10 Momo'z Berriez products + prices in Stripe (test mode).
 * Outputs the price IDs so you can paste them into seed.sql.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.js
 */

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key || !key.startsWith('sk_test_')) {
  console.error('Set STRIPE_SECRET_KEY=sk_test_... (test mode key required)');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

const PRODUCTS = [
  {
    id: 'prod_classic_fresas',
    name: 'Classic Fresas con Crema',
    description: 'Fresh California strawberries layered over velvety Mexican crema and sweetened cream cheese.',
    price_cents: 1400,
    images: ['https://momozberriez.pages.dev/images/products/1.png'],
  },
  {
    id: 'prod_cookie_butter',
    name: 'Cookie Butter Fresas ⭐',
    description: 'Classic fresas con crema base with Biscoff cookie butter swirl and crushed Lotus cookie crown.',
    price_cents: 1600,
    images: ['https://momozberriez.pages.dev/images/products/1.png'],
  },
  {
    id: 'prod_ube_dream',
    name: 'Ube Dream Fresas',
    description: 'Filipino-Latina fusion. Ube-infused cream, fresh strawberries, crushed Oreos, Hello Kitty truffle.',
    price_cents: 1500,
    images: ['https://momozberriez.pages.dev/images/products/3.png'],
  },
  {
    id: 'prod_therapy_cup',
    name: 'The Therapy Cup 💚',
    description: 'Matcha Greek yogurt base, pistachio crumble, dark chocolate, Hello Kitty truffle. High-protein.',
    price_cents: 1700,
    images: ['https://momozberriez.pages.dev/images/products/2.png'],
  },
  {
    id: 'prod_hot_girl',
    name: 'Hot Girl Cup 🐆',
    description: 'Matcha yogurt, chocolate drizzle, pistachio dust, strawberries. Bold, aesthetic, nutritious.',
    price_cents: 1700,
    images: ['https://momozberriez.pages.dev/images/products/2.png'],
  },
  {
    id: 'prod_granola_power',
    name: 'Granola Power Bowl 🌾',
    description: 'High-protein Greek yogurt, honey granola, strawberries, raw honey, Hello Kitty piece.',
    price_cents: 1500,
    images: ['https://momozberriez.pages.dev/images/products/5.png'],
  },
  {
    id: 'prod_pink_velvet',
    name: 'Pink Velvet Berry ✨',
    description: 'Strawberry cream base dusted with freeze-dried strawberry powder. Made for the gram.',
    price_cents: 1400,
    images: ['https://momozberriez.pages.dev/images/products/6.png'],
  },
  {
    id: 'prod_churro_cheesecake',
    name: 'Churro Cheesecake Box 🎂',
    description: 'Cinnamon-sugar churro cheesecake bites, strawberries, cream cheese drizzle, Nutella ribbon.',
    price_cents: 2000,
    images: ['https://momozberriez.pages.dev/images/products/4.png'],
  },
  {
    id: 'prod_bundle_4',
    name: "The Bundle: Momo's Mood Board 🎁",
    description: '4 cups of your choice + mystery gift box + branded sticker. In signature carrier tray.',
    price_cents: 5800,
    images: ['https://momozberriez.pages.dev/images/products/7.png'],
  },
  {
    id: 'prod_seasonal_cinco',
    name: 'Cinco de Mayo Special 🇲🇽 (Seasonal)',
    description: '3 mini-cups on a branded wooden board with Mexican flag toppers. Limited edition.',
    price_cents: 1900,
    images: ['https://momozberriez.pages.dev/images/products/6.png'],
  },
];

async function main() {
  console.log('Creating Stripe products and prices (TEST MODE)...\n');

  const results = [];

  for (const p of PRODUCTS) {
    process.stdout.write(`  Creating: ${p.name} ... `);

    // Check if product with this metadata already exists
    const existing = await stripe.products.search({
      query: `metadata['db_id']:'${p.id}'`,
      limit: 1,
    }).catch(() => ({ data: [] }));

    let stripeProduct;
    if (existing.data.length > 0) {
      stripeProduct = existing.data[0];
      process.stdout.write('(already exists) ');
    } else {
      stripeProduct = await stripe.products.create({
        name: p.name,
        description: p.description,
        images: p.images,
        metadata: { db_id: p.id },
      });
    }

    // Create price (always create new to avoid conflicts)
    const existingPrices = await stripe.prices.list({
      product: stripeProduct.id,
      active: true,
      limit: 1,
    });

    let price;
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
      process.stdout.write('price exists');
    } else {
      price = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: p.price_cents,
        currency: 'usd',
        metadata: { db_id: p.id },
      });
      process.stdout.write('price created');
    }

    console.log(` → ${price.id}`);
    results.push({ db_id: p.id, stripe_product_id: stripeProduct.id, stripe_price_id: price.id });
  }

  console.log('\n\n── SQL UPDATE statements for seed.sql ──\n');
  for (const r of results) {
    console.log(`UPDATE products SET stripe_price_id = '${r.stripe_price_id}' WHERE id = '${r.db_id}';`);
  }

  console.log('\n── JSON mapping ──\n');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
