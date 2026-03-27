# QuantPulse v4

QuantPulse v4 is a Bloomberg-inspired terminal clone built with **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, **shadcn-style UI**, **Stripe**, **Supabase**, and **Vercel** workflows.

## Highlights

- Sleek terminal UI with charcoal theme (`#020617`) and emerald/red accents
- Resizable three-pane desktop layout (`react-split`) + mobile-first fallbacks
- Free tier: multi-asset charts, TA overlays (RSI, MACD, Bollinger, Fib), macro calendar, RSS news
- Pro tier: Elliott Wave detector, 13 proprietary signals, AI chat endpoint, Monaco alert editor
- Viral growth: embeddable widgets + share links
- Monetization scaffolding: Stripe checkout (`$25/year Pro`) + referral tracking (Supabase)
- SEO + PWA support (`manifest`, `robots`, `sitemap`)

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

See `.env.example` for required values:

- `COMMODITY_KEY`
- `PERPLEXITY_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## API Routes

- `GET /api/market?symbol=PAU0|CL1!|ETH-USD|SPY`
- `GET /api/news`
- `GET /api/calendar`
- `GET /api/signals?symbol=PAU0`
- `POST /api/stripe/checkout`
- `POST /api/ai`
- `POST /api/referrals`
- `POST /api/alerts`

## Embed Widgets

```html
<iframe src="https://quantpulse.vercel.app/widget/PAU0" width="420" height="280"></iframe>
```

## Deploy to Vercel

```bash
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

## Product Hunt Launch

See `docs/PRODUCT_HUNT_LAUNCH_GUIDE.md`.
