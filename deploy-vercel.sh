#!/bin/bash

# Script de déploiement rapide sur Vercel
# Usage: ./deploy-vercel.sh [production|preview]

echo "🚀 Déploiement InkFlow sur Vercel"
echo "=================================="

# Vérifier que le build fonctionne
echo ""
echo "📦 Vérification du build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build. Corrigez les erreurs avant de continuer."
    exit 1
fi

echo "✅ Build réussi !"
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI n'est pas installé."
    echo "📥 Installation de Vercel CLI..."
    npm install -g vercel
fi

# Déterminer l'environnement
ENV=${1:-preview}

if [ "$ENV" = "production" ] || [ "$ENV" = "prod" ]; then
    echo "🌐 Déploiement en PRODUCTION..."
    vercel --prod
else
    echo "🔍 Déploiement en PREVIEW..."
    vercel
fi

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📝 N'oubliez pas de :"
echo "   1. Vérifier les variables d'environnement sur Vercel Dashboard"
echo "   2. Mettre à jour SITE_URL avec votre URL Vercel"
echo "   3. Tester les fonctionnalités principales"
