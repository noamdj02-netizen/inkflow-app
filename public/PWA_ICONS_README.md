# Icônes PWA - InkFlow

## Où se trouve l’icône actuelle (iOS / écran d’accueil)

L’icône affichée quand l’app est installée sur iPhone (ou Android) est servie depuis **`public/`** :

| Fichier | Rôle |
|--------|------|
| **`public/pwa-512x512.png`** | Icône principale (512×512) : manifest PWA, `apple-touch-icon`, partage social |
| **`public/pwa-192x192.png`** | Icône 192×192 : manifest PWA, petits écrans |

Références dans le projet :
- **`index.html`** : `<link rel="apple-touch-icon" href="/pwa-512x512.png" />` (et `sizes="192x192"`, `512x512`)
- **`vite.config.ts`** : section PWA `manifest.icons` pointe vers `/pwa-192x192.png` et `/pwa-512x512.png`

Tout fichier dans `public/` est copié à la racine du site au build, donc l’URL réelle est **`/pwa-512x512.png`** et **`/pwa-192x192.png`**.

---

## Remplacer l’icône (nouveau logo)

1. **Déposer la nouvelle image**  
   - Soit remplacer directement **`public/pwa-512x512.png`** (et **`public/pwa-192x192.png`**) par vos nouveaux PNG.  
   - Soit mettre votre fichier à la racine du projet sous le nom **`icon.png`**, puis le copier dans `public/` :
     ```powershell
     Copy-Item icon.png public\pwa-512x512.png -Force
     Copy-Item icon.png public\pwa-192x192.png -Force
     ```
2. **Tailles recommandées** : 512×512 px pour `pwa-512x512.png`, 192×192 px pour `pwa-192x192.png` (carré, PNG).
3. Relancer un **build** et redéployer ; sur iPhone, désinstaller l’app puis réinstaller (ou vider le cache Safari) pour voir la nouvelle icône.

---

## Fichiers requis (résumé)

- `public/pwa-192x192.png` - 192×192 pixels (requis)
- `public/pwa-512x512.png` - 512×512 pixels (requis)
- `pwa-icon.svg` - Icône SVG source (optionnel)

## Comment créer les vraies icônes

### Option 1 : Utiliser un outil en ligne
1. Visitez https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator
2. Uploadez votre logo InkFlow (format carré recommandé)
3. Téléchargez les icônes générées
4. Remplacez les fichiers `pwa-192x192.png` et `pwa-512x512.png` dans `public/`

### Option 2 : Utiliser un outil de design
1. Créez une image carrée 512x512 pixels avec votre logo InkFlow
2. Exportez en PNG
3. Redimensionnez à 192x192 pour la petite icône
4. Placez les fichiers dans `public/`

### Option 3 : Utiliser ImageMagick (ligne de commande)
```bash
# Si vous avez un logo source (logo.png)
convert logo.png -resize 512x512 public/pwa-512x512.png
convert logo.png -resize 192x192 public/pwa-192x192.png
```

## Notes importantes

- Les icônes doivent être carrées (ratio 1:1)
- Format PNG recommandé
- Fond transparent ou couleur unie
- Le logo doit être visible sur fond clair et foncé
- Les icônes actuelles sont des placeholders temporaires

## Test de la PWA

1. Lancez `npm run build`
2. Testez avec `npm run preview`
3. Sur mobile, ouvrez Chrome/Edge et vérifiez le prompt d'installation
4. Sur iOS, testez avec Safari et vérifiez les instructions d'installation

