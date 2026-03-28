# Product Hunt Launch Guide - QuantPulse v4

## Launch Assets Checklist

1. **Test Data Symbols**
   - SPY
   - PAU0 (Palladium)
   - CL1! (Crude Oil)
   - ETH-USD / BTC proxy workflows
2. **Screenshots Needed**
   - Full desktop terminal (3-pane split)
   - Mobile dashboard view
   - Elliott Wave + proprietary signals panel
   - Widget embed/share flow
3. **Demo Script**
   - Start on PAU0 chart with Fib levels visible
   - Switch to CL1! to show watchlist + resizable panes
   - Ask AI: "Analyze palladium Fibs"
   - Open Stripe Pro upgrade flow

## Suggested PH Copy

- **Tagline**: Bloomberg power for everyone - macro + commodities terminal at retail price.
- **One-liner**: Free live macro calendar, pro-grade charts, AI analysis, and embeddable widgets.

## Technical QA Before Launch

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Stripe test checkout creates session
- [ ] API routes respond without 500s
- [ ] PWA install prompt appears on supported devices
- [ ] Lighthouse performance > 90 desktop and mobile

## Social Proof Loop

- Share widget URLs in X/Reddit threads focused on commodities and macro
- Reward referral champions with 1 month Pro per 5 signups
- Highlight PAU0 + CL1! niche depth vs generic finance apps
