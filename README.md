# QuantPulse v5.20 Ultimate

QuantPulse v5.20 Ultimate is a production-grade retail terminal with Pro paywall features, realtime globe/transport feeds, and support workflows.

## Core Features

- Live market dashboard with AI signal overlays
- 8 embedded TradingView charts
- Voice search support
- Pro-gated `/stocks`, `/globe`, `/transport`, `/contact`, `/admin/streams`
- Bottom-right non-blocking upgrade popup with dismiss/X + localStorage

## Realtime Intelligence

- `/globe`: interactive 3D globe with toggles
  - ships, planes, weather, whales, sentiment, econ, forex, options, quakes, news
- `/transport`: event board + stream telemetry
- Websocket stream manager with reconnect/backoff for:
  - AIS ships (`wss://stream.aisstream.io/v0/stream`)
  - Whale alerts (`wss://leviathan.whale-alert.io/ws`)

## Contact (EmailJS)

- `/contact` Pro support form via EmailJS
- Recipient configured to `quantpulse@proton.me`

## Admin Stream Console

- `/admin/streams` includes:
  - live message counters
  - reconnect trigger
  - test event injection for ships/whales

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Deploy

### Vercel
```bash
npm run deploy:vercel
```

### GitHub Pages prep
```bash
npm run deploy:gh-pages
```

GitHub Pages publishes a branded redirect shell and `CNAME` for custom domain prep, while realtime features continue on Vercel.

## Anonymous team metadata

```bash
npm run anonymize
```

## Notes

Dynamic API routes and websockets run best on Vercel/Node runtime. GitHub Pages deployment is prepared for static export workflows.
