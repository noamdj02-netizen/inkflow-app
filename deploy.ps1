# Script de déploiement automatique sur GitHub et Vercel
# Usage: .\deploy.ps1 [message de commit]

param(
    [string]$CommitMessage = "feat: Deploy to Vercel"
)

Write-Host "🚀 Déploiement sur GitHub et Vercel..." -ForegroundColor Cyan
Write-Host ""

# Étape 1: Vérifier Git
Write-Host "📋 Étape 1: Vérification Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "✅ Fichiers modifiés détectés" -ForegroundColor Green
    
    # Ajouter tous les fichiers
    Write-Host "📦 Ajout des fichiers..." -ForegroundColor Yellow
    git add .
    
    # Commit
    Write-Host "💾 Commit avec message: $CommitMessage" -ForegroundColor Yellow
    git commit -m $CommitMessage
    
    # Push
    Write-Host "📤 Push vers GitHub..." -ForegroundColor Yellow
    $currentBranch = git branch --show-current
    git push origin $currentBranch
    
    Write-Host "✅ Push réussi sur la branche: $currentBranch" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun changement à commiter" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🌐 Étape 2: Déploiement sur Vercel..." -ForegroundColor Yellow

# Vérifier si Vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if ($vercelInstalled) {
    Write-Host "✅ Vercel CLI détecté" -ForegroundColor Green
    Write-Host "🚀 Déploiement en cours..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Choisissez:" -ForegroundColor Cyan
    Write-Host "1. Preview (vercel)" -ForegroundColor White
    Write-Host "2. Production (vercel --prod)" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Votre choix (1 ou 2)"
    
    if ($choice -eq "2") {
        vercel --prod
    } else {
        vercel
    }
} else {
    Write-Host "⚠️  Vercel CLI non installé" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour installer Vercel CLI:" -ForegroundColor Cyan
    Write-Host "npm install -g vercel" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou déployez via Vercel Dashboard:" -ForegroundColor Cyan
    Write-Host "1. Allez sur https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Importez votre repository GitHub" -ForegroundColor White
    Write-Host "3. Configurez les variables d'environnement" -ForegroundColor White
    Write-Host "4. Cliquez sur 'Deploy'" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Configurez les variables d'environnement dans Vercel" -ForegroundColor White
Write-Host "2. Configurez le webhook Stripe avec l'URL de production" -ForegroundColor White
Write-Host "3. Testez votre application" -ForegroundColor White
