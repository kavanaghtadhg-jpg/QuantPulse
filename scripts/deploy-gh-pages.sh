#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="${NEXT_PUBLIC_SITE_URL:-https://quantpulse.vercel.app}"
CUSTOM_DOMAIN="${GITHUB_PAGES_CUSTOM_DOMAIN:-quantpulse.app}"

rm -rf out
mkdir -p out

cat > out/index.html <<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QuantPulse v5.20 Ultimate</title>
  <meta http-equiv="refresh" content="0; url=${TARGET_URL}" />
  <link rel="canonical" href="${TARGET_URL}" />
  <style>
    body { margin:0; background:#020617; color:#e2e8f0; font-family: Inter, system-ui, sans-serif; display:grid; min-height:100vh; place-items:center; }
    .card { border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.03); border-radius:12px; padding:24px; max-width:560px; text-align:center; }
    a { color:#10b981; }
  </style>
</head>
<body>
  <div class="card">
    <h1>QuantPulse v5.20 Ultimate</h1>
    <p>Redirecting to the live app...</p>
    <p><a href="${TARGET_URL}">Open QuantPulse</a></p>
  </div>
</body>
</html>
HTML

echo "${CUSTOM_DOMAIN}" > out/CNAME

gh-pages -d out -m "Deploy QuantPulse GH Pages shell"

echo "GitHub Pages deployed as redirect shell. Live realtime app remains on ${TARGET_URL}."
