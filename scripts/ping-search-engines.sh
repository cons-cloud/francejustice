#!/usr/bin/env bash
# ==============================================================================
# Fast Indexation Ping Script — France Justice (https://francejustice.com)
# Pings Google, Bing, and IndexNow to trigger instant re-indexing of sitemap.
# ==============================================================================

SITEMAP_URL="https://francejustice.com/sitemap.xml"
INDEXNOW_KEY="francejustice-indexnow-key-20261114"
HOST="francejustice.com"

echo "📡 Notification des moteurs de recherche pour France Justice..."

# 1. Ping Google Search Console
echo -n "• Envoi du Sitemap à Google... "
curl -s -o /dev/null -w "%{http_code}\n" "https://www.google.com/ping?sitemap=${SITEMAP_URL}" || true

# 2. Ping Bing Webmaster Tools
echo -n "• Envoi du Sitemap à Bing... "
curl -s -o /dev/null -w "%{http_code}\n" "https://www.bing.com/ping?sitemap=${SITEMAP_URL}" || true

# 3. Notification IndexNow (Bing, Yandex, Seznam, Naver)
echo -n "• Soumission IndexNow instantanée (Bing & partenaires)... "
curl -s -X POST "https://api.indexnow.org/indexnow" \
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
  }' -o /dev/null -w "%{http_code}\n" || true

echo "✅ Protocole d'indexation terminé avec succès."
