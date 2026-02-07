# Script de déploiement rapide sur Vercel (PowerShell)
# Usage: .\deploy-vercel.ps1 [production|preview]

Write-Host "🚀 Déploiement InkFlow sur Vercel" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le build fonctionne
Write-Host "📦 Vérification du build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build. Corrigez les erreurs avant de continuer." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build réussi !" -ForegroundColor Green
Write-Host ""

# Vérifier si Vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI n'est pas installé." -ForegroundColor Yellow
    Write-Host "📥 Installation de Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Déterminer l'environnement
$env = if ($args[0]) { $args[0] } else { "preview" }

if ($env -eq "production" -or $env -eq "prod") {
    Write-Host "🌐 Déploiement en PRODUCTION..." -ForegroundColor Green
    vercel --prod
} else {
    Write-Host "🔍 Déploiement en PREVIEW..." -ForegroundColor Cyan
    vercel
}

Write-Host ""
Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 N'oubliez pas de :" -ForegroundColor Yellow
Write-Host "   1. Vérifier les variables d'environnement sur Vercel Dashboard"
Write-Host "   2. Mettre à jour SITE_URL avec votre URL Vercel"
Write-Host "   3. Tester les fonctionnalités principales"
