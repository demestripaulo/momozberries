# Momo'z Berriez — Claude Code Context

## Project Overview

**Momo'z Berriez** is a Gen-Z artisan dessert brand e-commerce site. It sells gourmet *fresas con crema* (Mexican strawberries & cream) cups. Based in **South Gate, CA**. Instagram: [@momozberriez](https://instagram.com/momozberriez).

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | Static files in `/public` |
| Backend | Cloudflare Workers | Code in `/workers` |
| Database | Cloudflare D1 (SQLite) | ID: `dc88e037-a29c-4e39-9974-7bff2b2d88ac`, name: `momozberries-db` |
| Payments | Stripe | Test mode |
| Deployment | GitHub Actions → Cloudflare Workers | `wrangler deploy` |
| Live URL | https://momozberries.demestritech-com.workers.dev | — |

---

## What Was Built (Fully Working)

- **5 public pages:** `/` (home), `/menu.html`, `/cart.html`, `/order-success.html`, `/admin.html`
- **Full product catalog** — 10 products seeded in D1 and created in Stripe test mode
- **Cart system** — localStorage-based
- **Stripe Checkout integration** — `create-checkout-session` endpoint
- **Stripe webhook handler** — saves orders to D1, decrements daily limit
- **Daily order limit system** — 50 orders/day, resets at midnight PT via cron
- **Admin back office** — dashboard stats, order management, product management with COGS/margin calculator
- **JWT auth for admin** — httpOnly cookie, 8hr expiry, stored in D1
- **CORS handling**
- **GitHub Actions CI/CD pipeline** — `deploy.yml`

---

## GitHub Actions Workflow (`/.github/workflows/deploy.yml`)

Triggers on push to `main`. Manual dispatch options:

| Option | Action |
|---|---|
| `init_db` | Applies `schema.sql` + `seed.sql` to D1 — run once |
| `stripe_setup` | Creates Stripe products, updates D1 with real price IDs |
| `push_secrets` | Pushes GitHub Secrets → Cloudflare Worker secrets |

---

## Required GitHub Secrets

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers Scripts Edit + D1 Edit |
| `CLOUDFLARE_ACCOUNT_ID` | `4c141c734e64e04f20698b63d6a7e1bb` |
| `STRIPE_SECRET_KEY` | `sk_test_...` (Stripe test mode) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Stripe Dashboard → Webhooks) |
| `ADMIN_PASSWORD` | Admin login password |
| `JWT_SECRET` | Random string for JWT signing |

---

## Cloudflare Worker Secrets (set via `push_secrets` job)

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_PASSWORD`, `JWT_SECRET`

---

## File Structure

```
/
├── public/                    # Static frontend (served via [assets] in wrangler.toml)
│   ├── index.html
│   ├── menu.html
│   ├── cart.html
│   ├── order-success.html
│   ├── admin.html
│   ├── css/main.css
│   ├── js/app.js              # Shared cart, api(), toast, formatPrice
│   ├── js/analytics.js        # GA4 + Meta Pixel (IDs are placeholders)
│   ├── js/home.js
│   ├── js/menu.js
│   ├── js/cart.js
│   ├── js/admin.js
│   └── images/products/       # 1.png–7.png product photos
├── workers/
│   ├── index.js               # Main router + cron handler
│   ├── routes/
│   │   ├── availability.js
│   │   ├── products.js
│   │   ├── catalog.js
│   │   ├── checkout.js
│   │   ├── webhook.js
│   │   └── admin.js
│   └── utils/
│       ├── cors.js            # Allowed origins whitelist
│       ├── auth.js            # JWT create/verify/requireAuth
│       └── stripe.js          # createCheckoutSession, verifyWebhookSignature
├── scripts/stripe-setup.js    # Creates Stripe products, outputs SQL UPDATEs
├── schema.sql
├── seed.sql
├── wrangler.toml
└── package.json               # type: module
```

---

## Known Issues / TODO Before Production

- `analytics.js` has placeholder GA4 ID (`G-XXXXXXXXXX`) and Meta Pixel ID — replace with real IDs once client sets up accounts
- `STRIPE_WEBHOOK_SECRET` was initially set to a placeholder — must be updated after configuring the webhook endpoint in Stripe Dashboard
- `cors.js` whitelist: add custom domain when client acquires one
- "DEMO SITE — Test Mode" banner not yet implemented (was in original spec)
- Admin URL is `/admin.html` (not `/admin`) — direct URL access only, not linked from nav

---

## Next Feature: Google Calendar Integration for Pickup Time Slots

The next feature to implement replaces the static pickup time dropdown (morning/afternoon/evening) with a dynamic system integrated with Google Calendar.

### How It Should Work

1. Admin configures available pickup time slots in the back office (e.g., "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "4:00 PM") — stored in D1
2. Admin can set slot capacity (max orders per slot)
3. When a customer checks out, they see only available slots (not fully booked ones)
4. On purchase completion (Stripe webhook), a Google Calendar event is created on the store's calendar and the customer receives a calendar invite
5. The slot's remaining capacity decrements in D1

### Implementation Plan

**New D1 tables:**
- `pickup_slots` — `(id, label, time_24h, capacity, active)`
- `slot_bookings` — `(slot_id, order_id, date, count)`

**New admin routes:**
- `GET /api/admin/slots`
- `POST /api/admin/slots`
- `PUT /api/admin/slots/:id`
- `DELETE /api/admin/slots/:id`

**New public route:**
- `GET /api/slots?date=YYYY-MM-DD` — returns available slots with remaining capacity

**Google Calendar API integration:**
- On webhook: create event on store calendar, send invite to customer email
- Needs OAuth2 credentials (service account recommended)

**Frontend:**
- Replace static pickup time dropdown in `cart.js` with dynamic slot picker fetched from `/api/slots`

**Credentials needed:**
- Google Cloud project with Calendar API enabled
- Service account JSON → stored as Cloudflare Worker secret `GOOGLE_CALENDAR_CREDENTIALS`
- Store calendar ID → stored as `GOOGLE_CALENDAR_ID` env var in `wrangler.toml`

### Google Calendar API Approach for Workers

- Use service account with domain-wide delegation OR OAuth2 with refresh token stored as secret
- Workers do **not** support the `googleapis` npm package natively — use direct REST API calls with `fetch()`
- Auth: `POST` to `https://oauth2.googleapis.com/token` with JWT assertion (service account)
