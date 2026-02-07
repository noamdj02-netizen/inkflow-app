# Script d'installation automatique de Stripe CLI pour Windows
# Executez ce script en tant qu'administrateur si necessaire

Write-Host "Installation de Stripe CLI..." -ForegroundColor Cyan

# Creer un dossier temporaire
$tempDir = "$env:TEMP\stripe-cli-install"
$stripeDir = "$env:USERPROFILE\stripe-cli"

# Creer les dossiers
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
New-Item -ItemType Directory -Force -Path $stripeDir | Out-Null

Write-Host "Telechargement de Stripe CLI..." -ForegroundColor Yellow

try {
    # URL de la derniere version (v1.34.0)
    $downloadUrl = "https://github.com/stripe/stripe-cli/releases/download/v1.34.0/stripe_1.34.0_windows_x86_64.zip"
    $zipPath = "$tempDir\stripe-cli.zip"
    
    # Telecharger
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    
    Write-Host "Telechargement termine" -ForegroundColor Green
    Write-Host "Extraction..." -ForegroundColor Yellow
    
    # Extraire
    Expand-Archive -Path $zipPath -DestinationPath $stripeDir -Force
    
    # Trouver stripe.exe
    $stripeExe = Get-ChildItem -Path $stripeDir -Filter "stripe.exe" -Recurse | Select-Object -First 1
    
    if ($stripeExe) {
        $stripePath = $stripeExe.DirectoryName
        
        Write-Host "Extraction terminee dans: $stripePath" -ForegroundColor Green
        
        # Ajouter au PATH utilisateur
        Write-Host "Ajout au PATH..." -ForegroundColor Yellow
        
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        
        if ($userPath -notlike "*$stripePath*") {
            [Environment]::SetEnvironmentVariable('Path', "$userPath;$stripePath", 'User')
            Write-Host "Ajoute au PATH utilisateur" -ForegroundColor Green
        } else {
            Write-Host "Deja dans le PATH" -ForegroundColor Cyan
        }
        
        # Nettoyer
        Remove-Item -Path $tempDir -Recurse -Force
        
        Write-Host ""
        Write-Host "Installation terminee !" -ForegroundColor Green
        Write-Host ""
        Write-Host "Prochaines etapes:" -ForegroundColor Cyan
        Write-Host "1. Fermez et rouvrez PowerShell" -ForegroundColor White
        Write-Host "2. Verifiez avec: stripe --version" -ForegroundColor White
        Write-Host "3. Connectez-vous avec: stripe login" -ForegroundColor White
        Write-Host ""
        
        # Tester immédiatement (peut ne pas fonctionner si PATH pas encore mis à jour)
        $env:Path += ";$stripePath"
        & (Join-Path $stripePath 'stripe.exe') --version
        
    } else {
        Write-Host "Erreur: stripe.exe non trouve" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "Erreur lors de l'installation: $_" -ForegroundColor Red
    exit 1
}
