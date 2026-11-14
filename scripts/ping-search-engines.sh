#!/usr/bin/env bash
# ==============================================================================
# Fast Indexation Script — France Justice (https://francejustice.com)
# Pings IndexNow (Bing, Yandex, Seznam, Naver) for instant push-indexation.
# Note: Google & Bing deprecated their legacy GET /ping endpoints in late 2023
# in favor of IndexNow protocol and Search Console / Webmaster Tools API.
# ==============================================================================

SITEMAP_URL="https://francejustice.com/sitemap.xml"
INDEXNOW_KEY="francejustice-indexnow-key-20261114"
HOST="francejustice.com"

echo "📡 Notification des moteurs de recherche pour France Justice..."

# 1. Notification IndexNow instantanée (Bing, Copilot, Yandex, Seznam, Naver)
echo -n "• Soumission IndexNow instantanée (Bing & partenaires)... "
HTTP_CODE=$(curl -s -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "host": "'"${HOST}"'",
    "key": "'"${INDEXNOW_KEY}"'",
    "keyLocation": "https://'"${HOST}"'/indexnow.txt",
    "urlList": [
      "https://francejustice.com/",
      "https://francejustice.com/database",
      "https://francejustice.com/lawyers",
      "https://francejustice.com/services",
      "https://francejustice.com/genia-l",
      "https://francejustice.com/assistant",
      "https://francejustice.com/generator",
      "https://francejustice.com/classrooms",
      "https://francejustice.com/guide",
      "https://francejustice.com/news",
      "https://francejustice.com/faq",
      "https://francejustice.com/about",
      "https://francejustice.com/contact"
    ]
  }' -o /dev/null -w "%{http_code}")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
  echo "✅ ${HTTP_CODE} (URLs acceptées pour indexation immédiate)"
else
  echo "ℹ️ Code HTTP reçu : ${HTTP_CODE}"
fi

echo "• Google Search Console : Sitemap déclaré automatiquement dans robots.txt (${SITEMAP_URL})"
echo "✅ Protocole d'indexation terminé avec succès."

