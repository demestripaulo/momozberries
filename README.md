# Momo'z Berriez — Full-Stack E-Commerce Site

Gen-Z artisan dessert brand based in South Gate, CA. Gourmet fresas con crema and elevated berry desserts. Pickup only, 50 orders/day max.

**Stack:** Cloudflare Pages (static) · Cloudflare Workers (API) · Cloudflare D1 (SQLite) · Stripe Checkout (test mode) · Vanilla HTML/CSS/JS

---

## Project Structure

```
.
├── public/                  # Static frontend (Cloudflare Pages)
│   ├── index.html           # Home page
│   ├── menu.html            # Menu / order page
│   ├── cart.html            # Cart & checkout
│   ├── order-success.html   # Post-checkout confirmation
│   ├── admin.html           # Back office (auth-protected)
│   ├── css/main.css         # All styles
│   ├── js/
│   │   ├── app.js           # Shared: Cart, api(), toast, availability
│   │   ├── home.js          # Home page: featured products
│   │   ├── menu.js          # Menu: grid, filters, modal, add-to-cart
│   │   ├── cart.js          # Cart: render, qty, Stripe checkout
│   │   └── admin.js         # Admin: login, dashboard, orders, products
│   ├── images/products/     # Product photos (1.png – 7.png)
│   ├── favicon.svg
│   └── _headers             # Cloudflare Pages security headers
│
├── workers/                 # Cloudflare Worker (API)
│   ├── index.js             # Main router + cron handler
│   ├── routes/
│   │   ├── availability.js  # GET /api/availability
│   │   ├── products.js      # GET /api/products
│   │   ├── checkout.js      # POST /api/create-checkout-session
│   │   ├── webhook.js       # POST /api/webhook (Stripe events)
│   │   └── admin.js         # All /api/admin/* routes
│   └── utils/
│       ├── auth.js          # JWT create/verify (Web Crypto)
│       ├── cors.js          # CORS headers
│       └── stripe.js        # Stripe API + webhook signature
│
├── scripts/
│   └── stripe-setup.js      # One-time: create Stripe products & prices
│
├── schema.sql               # D1 database schema
├── seed.sql                 # 10 products + sample ingredients
├── wrangler.toml            # Cloudflare Worker config
└── package.json
```

---

## Environment Variables

Set these as Cloudflare Worker secrets via `wrangler secret put`:

| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe test secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `ADMIN_PASSWORD` | Admin back office password |
| `JWT_SECRET` | Random string for JWT signing (min 32 chars) |

---

## First-Time Setup

### 1. Install Wrangler & login

```bash
npm install
npx wrangler login
```

### 2. Create D1 database

```bash
npx wrangler d1 create momozberriez-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "momozberriez-db"
database_id = "PASTE_YOUR_ID_HERE"
```

### 3. Run migrations & seed

```bash
npm run db:migrate     # creates all tables
npm run db:seed        # inserts 10 products + ingredients
```

### 4. Set secrets

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put JWT_SECRET
```

### 5. Create Stripe products & prices

```bash
STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
```

This prints `UPDATE products SET stripe_price_id = '...'` statements. Run them:

```bash
# Paste the UPDATE statements into a file, then:
npx wrangler d1 execute momozberriez-db --file=./stripe-prices.sql
```

### 6. Deploy Worker

```bash
npx wrangler deploy
```

Note the Worker URL (e.g. `https://momozberriez.workers.dev`).

### 7. Deploy frontend to Cloudflare Pages

1. Push this repo to GitHub: **[demestripaulo/momozberries](https://github.com/demestripaulo/momozberries)**
2. In the Cloudflare dashboard: **Pages → Create a project → Connect to GitHub**.
3. Select the `momozberries` repository.
4. Settings:
   - **Build command:** *(leave empty — it's a static site)*
   - **Build output directory:** `public`
5. Deploy.

### 8. Connect Worker to Pages domain

In the Cloudflare dashboard:
1. **Workers & Pages → your Worker → Settings → Triggers**
2. Add a **Route**: `momozberriez.pages.dev/api/*` → your Worker
3. This routes all `/api/*` requests to the Worker while Pages serves static files.

### 9. Set up Stripe webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://momozberriez.pages.dev/api/webhook`
3. Events: `checkout.session.completed`
4. Copy the signing secret → `wrangler secret put STRIPE_WEBHOOK_SECRET`

---

## Local Development

Run the Worker locally (with D1 local SQLite):

```bash
# First seed local DB
npm run db:migrate:local
npm run db:seed:local

# Start worker dev server on :8787
npm run dev
```

The frontend can be served separately:

```bash
python3 -m http.server 3333 --directory public
# Then open http://localhost:3333
# API calls will fail until Worker is running on :8787
# Update API_BASE in public/js/app.js to 'http://localhost:8787' for local dev
```

---

## Daily Operations

The Worker's cron trigger resets the daily order limit every day at **8 AM UTC (midnight PT)**. No manual action needed.

### Admin back office

Navigate to `/admin.html` and enter your `ADMIN_PASSWORD`. Features:
- **Dashboard** — today's orders, revenue, 7-day chart
- **Orders** — status management (Pending → Ready → Picked Up)
- **Products** — full CRUD with ingredient cost calculator and profit margin analysis

---

## Stripe Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | 3D Secure required |

Use any future expiry date and any 3-digit CVC.

---

## SEO & Ads (Pending)

- [ ] Google Analytics 4 + Meta Pixel on all pages
- [ ] JSON-LD structured data (LocalBusiness, Product, BreadcrumbList)
- [ ] `sitemap.xml` and `robots.txt`
- [ ] Google Search Console verification
- [ ] Facebook Shopping catalog feed (`GET /api/catalog.json`)
- [ ] UTM passthrough on ad CTAs

See Task #1 in Claude Code for implementation details.
