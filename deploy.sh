#!/bin/bash

# Script de déploiement pour Law Just
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Déploiement de Law Just en mode: $ENVIRONMENT"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "📦 Installation des dépendances..."
npm ci

echo "🔍 Vérification du code..."
npm run lint

echo "🏗️ Build de l'application..."
npm run build

echo "✅ Build terminé avec succès!"

# Déploiement selon l'environnement
case $ENVIRONMENT in
    "production")
        echo "🚀 Déploiement en production..."
        # Ajouter ici la logique de déploiement production
        ;;
    "staging")
        echo "🧪 Déploiement en staging..."
        # Ajouter ici la logique de déploiement staging
        ;;
    "development")
        echo "🛠️ Déploiement en développement..."
        # Ajouter ici la logique de déploiement développement
        ;;
    *)
        echo "❌ Environnement non reconnu: $ENVIRONMENT"
        echo "Usage: ./deploy.sh [production|staging|development]"
        exit 1
        ;;
esac

echo "🎉 Déploiement terminé avec succès!"
