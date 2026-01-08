# Logo InkFlow - Instructions

## Fichier actuel

Le logo actuel est un SVG temporaire (`logo-icon.svg`) basé sur la description du design.

## Remplacement par le vrai logo

Si vous avez le fichier `image_16.png` (ou tout autre fichier du nouveau logo) :

1. **Remplacez le fichier SVG** :
   - Copiez `image_16.png` dans `public/images/`
   - Renommez-le en `logo-icon.png`
   - OU gardez le SVG et remplacez simplement le contenu de `logo-icon.svg`

2. **Mettez à jour les références** (si vous utilisez PNG au lieu de SVG) :
   - Dans tous les fichiers `.tsx`, remplacez `/images/logo-icon.svg` par `/images/logo-icon.png`
   - Les fichiers concernés sont :
     - `components/LandingPage.tsx`
     - `components/dashboard/DashboardLayout.tsx`
     - `components/LoginPage.tsx`
     - `components/RegisterPage.tsx`
     - `components/OnboardingPage.tsx`
     - `components/PublicArtistPage.tsx`
     - `components/ArtistDashboard.tsx`

3. **Mettez à jour les icônes PWA** :
   - Créez des versions 192x192 et 512x512 pixels du logo
   - Remplacez `public/pwa-192x192.png` et `public/pwa-512x512.png`
   - Mettez à jour `index.html` si nécessaire

## Format recommandé

- **Format** : PNG ou SVG
- **Taille** : Carré (ratio 1:1)
- **Couleur** : Ambre/Jaune (#FBBF24) sur fond transparent ou sombre
- **Résolution** : Minimum 512x512 pixels pour une qualité optimale

## Fichiers à mettre à jour

- ✅ `public/images/logo-icon.svg` (ou `.png`)
- ✅ `public/pwa-192x192.png` (pour PWA)
- ✅ `public/pwa-512x512.png` (pour PWA)
- ✅ `index.html` (favicon - déjà configuré)

