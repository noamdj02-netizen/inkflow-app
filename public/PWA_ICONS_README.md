# Icônes PWA - InkFlow

## Fichiers requis

Pour que la PWA fonctionne correctement, vous devez avoir ces fichiers dans le dossier `public/` :

- `pwa-192x192.png` - Icône 192x192 pixels (requis)
- `pwa-512x512.png` - Icône 512x512 pixels (requis)
- `pwa-icon.svg` - Icône SVG source (optionnel, pour référence)

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

