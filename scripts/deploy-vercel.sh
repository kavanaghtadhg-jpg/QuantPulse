#!/usr/bin/env bash
set -euo pipefail

echo "Deploying QuantPulse to Vercel..."
npm install
npm run build
npx vercel --prod --yes --name quantpulse

echo "Deployment complete. Configure custom domain quantpulse.vercel.app in Vercel dashboard."
