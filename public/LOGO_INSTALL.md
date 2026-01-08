# 🎨 Installation du Nouveau Logo InkFlow

## ✅ Logo PNG Installé

Le logo PNG a été détecté dans `public/inkflow-logo-v2.png` et toutes les références ont été mises à jour pour l'utiliser.

## 📋 Si vous avez le fichier image original

Si vous avez le fichier **"Logo Icon Inkflow.jpg"** ou un autre fichier image :

1. **Convertissez-le en PNG** (si nécessaire) avec un outil en ligne ou un éditeur d'image

2. **Placez-le dans** `public/` sous le nom :
   ```
   inkflow-logo-v2.png
   ```

3. **Mettez à jour les références** : Remplacez toutes les occurrences de `.svg` par `.png` dans les fichiers suivants :
   - `components/LandingPage.tsx`
   - `components/dashboard/DashboardLayout.tsx`
   - `components/LoginPage.tsx`
   - `components/RegisterPage.tsx`
   - `components/OnboardingPage.tsx`
   - `components/PublicArtistPage.tsx`
   - `components/ArtistDashboard.tsx`
   - `index.html`
   - `vite.config.ts`

## ✅ Fichiers Mis à Jour (SVG)

Tous les fichiers suivants utilisent maintenant `/inkflow-logo-v2.png` :

- ✅ `components/LandingPage.tsx` (Header + Footer)
- ✅ `components/dashboard/DashboardLayout.tsx` (Mobile + Desktop)
- ✅ `components/LoginPage.tsx`
- ✅ `components/RegisterPage.tsx`
- ✅ `components/OnboardingPage.tsx`
- ✅ `components/PublicArtistPage.tsx`
- ✅ `components/ArtistDashboard.tsx`
- ✅ `index.html` (Favicon)
- ✅ `vite.config.ts` (PWA)

## 🔄 Vider le Cache

Après avoir placé le fichier, si le logo ne s'affiche pas :

1. **Videz le cache du navigateur** :
   - Chrome/Edge : `Ctrl + Shift + Delete` → Cochez "Images en cache"
   - Firefox : `Ctrl + Shift + Delete` → Cochez "Cache"
   - Safari : `Cmd + Option + E`

2. **Ou faites un hard refresh** :
   - Windows : `Ctrl + F5`
   - Mac : `Cmd + Shift + R`

3. **Redémarrez le serveur de développement** :
   ```bash
   npm run dev
   ```

## 📐 Format Actuel

- **Format** : PNG (image raster)
- **Fichier** : `public/inkflow-logo-v2.png`
- **Design** : Goutte/Flamme avec éclair intégré et lignes ondulées en jaune/ambre

## 🎯 Résultat Attendu

Le logo devrait maintenant apparaître :
- Dans le header de la landing page
- Dans le footer
- Dans tous les headers de pages (Login, Register, Dashboard, etc.)
- Dans l'onglet du navigateur (favicon)
