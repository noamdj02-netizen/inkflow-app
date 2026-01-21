# 📱 Guide de Configuration PWA (Progressive Web App)

Ce guide vous explique comment transformer InkFlow en application mobile installable grâce aux PWA.

---

## ✅ Ce qui est déjà configuré

- ✅ **Manifest** : `public/manifest.webmanifest` configuré
- ✅ **Composant d'installation** : `components/PWAInstallPrompt.tsx` créé
- ✅ **Intégration Dashboard** : Bouton d'installation dans la sidebar
- ✅ **Meta tags iOS** : Configurés dans `index.html`
- ✅ **Icônes** : `pwa-192x192.png` et `pwa-512x512.png` présentes

---

## 🎨 Étape 1 : Vérifier/Créer les Icônes

### Tailles requises

Vous devez avoir ces fichiers dans le dossier `public/` :

- ✅ `pwa-192x192.png` - Icône 192x192 pixels (requis)
- ✅ `pwa-512x512.png` - Icône 512x512 pixels (requis)
- ✅ `inkflow-logo-v2.png` - Logo principal (utilisé comme fallback)

### Comment créer les vraies icônes

#### Option 1 : Utiliser un outil en ligne (Recommandé)

1. **Visitez [RealFaviconGenerator](https://realfavicongenerator.net/)** ou **[PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)**
2. **Uploadez votre logo InkFlow** (format carré recommandé, minimum 512x512)
3. **Téléchargez les icônes générées**
4. **Remplacez les fichiers** dans `public/` :
   - `pwa-192x192.png`
   - `pwa-512x512.png`

#### Option 2 : Utiliser un outil de design (Figma, Photoshop, etc.)

1. **Créez une image carrée 512x512 pixels** avec votre logo InkFlow centré
2. **Exportez en PNG** avec fond transparent ou couleur unie
3. **Redimensionnez à 192x192** pour la petite icône
4. **Placez les fichiers** dans `public/`

#### Option 3 : Utiliser ImageMagick (ligne de commande)

```bash
# Si vous avez un logo source (logo.png)
convert logo.png -resize 512x512 public/pwa-512x512.png
convert logo.png -resize 192x192 public/pwa-192x192.png
```

### Notes importantes sur les icônes

- ✅ **Format** : PNG recommandé
- ✅ **Ratio** : Carré (1:1) obligatoire
- ✅ **Fond** : Transparent ou couleur unie (#000000 pour dark mode)
- ✅ **Visibilité** : Le logo doit être visible sur fond clair et foncé
- ✅ **Taille minimale** : 192x192 pour Android, 512x512 pour iOS

---

## 🧪 Étape 2 : Tester la PWA en Local

### Build et Preview

```bash
# 1. Build l'application
npm run build

# 2. Preview en local
npm run preview
```

### Test sur Android (Chrome/Edge)

1. **Ouvrez Chrome/Edge** sur votre téléphone Android
2. **Naviguez vers** `http://votre-ip-local:4173` (ou votre domaine)
3. **Vérifiez** :
   - Une bannière "Ajouter à l'écran d'accueil" apparaît automatiquement
   - Ou cliquez sur le menu (⋮) → "Installer l'application"
4. **Après installation** :
   - L'icône InkFlow apparaît sur l'écran d'accueil
   - L'app s'ouvre en plein écran (sans barre d'URL)
   - Le thème sombre est appliqué

### Test sur iPhone (Safari)

1. **Ouvrez Safari** sur votre iPhone
2. **Naviguez vers** votre site
3. **Cliquez sur le bouton "Installer l'application"** dans le dashboard
4. **Suivez les instructions** :
   - Appuyez sur **Partager** (icône carré avec flèche)
   - Sélectionnez **"Sur l'écran d'accueil"**
   - Confirmez
5. **Après installation** :
   - L'icône InkFlow apparaît sur l'écran d'accueil
   - L'app s'ouvre en plein écran
   - Le statut bar iOS est noire (theme-color)

---

## 🚀 Étape 3 : Déploiement en Production

### Vérifications pré-déploiement

- [ ] Les icônes `pwa-192x192.png` et `pwa-512x512.png` sont dans `public/`
- [ ] Le manifest `manifest.webmanifest` est accessible à `/manifest.webmanifest`
- [ ] Les meta tags iOS sont dans `index.html`
- [ ] Le site est en HTTPS (requis pour PWA)

### Déploiement sur Vercel

1. **Push sur GitHub** :
   ```bash
   git add .
   git commit -m "Add PWA support"
   git push
   ```

2. **Vercel déploie automatiquement**

3. **Vérifiez** :
   - Allez sur `https://votre-domaine.vercel.app/manifest.webmanifest`
   - Le JSON doit s'afficher correctement

### Test en Production

1. **Ouvrez votre site** sur mobile
2. **Testez l'installation** (voir section "Test" ci-dessus)
3. **Vérifiez** :
   - L'app s'ouvre en plein écran
   - Les icônes s'affichent correctement
   - Le thème sombre est appliqué
   - La navigation fonctionne

---

## 📋 Configuration du Manifest

Le fichier `public/manifest.webmanifest` contient :

```json
{
  "name": "InkFlow - Assistant Tatoueur",
  "short_name": "InkFlow",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait"
}
```

### Explication des paramètres

- **`name`** : Nom complet affiché lors de l'installation
- **`short_name`** : Nom court affiché sous l'icône
- **`start_url`** : URL de démarrage (redirige vers `/dashboard`)
- **`display: "standalone"`** : Ouvre l'app sans barre d'URL (comme une vraie app)
- **`background_color`** : Couleur de fond pendant le chargement
- **`theme_color`** : Couleur de la barre d'état (iOS/Android)
- **`orientation: "portrait"`** : Force le mode portrait

---

## 🎯 Fonctionnalités PWA

### Ce qui fonctionne automatiquement

- ✅ **Installation** : Bouton d'installation dans le dashboard
- ✅ **Détection iOS** : Instructions spécifiques pour iPhone
- ✅ **Détection Android** : Prompt automatique pour Chrome/Edge
- ✅ **Mode standalone** : App s'ouvre en plein écran
- ✅ **Thème sombre** : Couleurs adaptées au dark mode
- ✅ **Icônes** : Affichage correct sur l'écran d'accueil

### Améliorations futures (optionnelles)

- [ ] **Service Worker** : Cache offline pour fonctionner sans internet
- [ ] **Push Notifications** : Notifications push pour les nouveaux rendez-vous
- [ ] **Background Sync** : Synchronisation en arrière-plan
- [ ] **Offline Mode** : Fonctionnement hors ligne

---

## 🐛 Dépannage

### L'icône ne s'affiche pas correctement

**Solution** :
1. Vérifiez que les fichiers PNG existent dans `public/`
2. Vérifiez que les tailles sont exactement 192x192 et 512x512
3. Vérifiez que les fichiers ne sont pas corrompus
4. Redéployez sur Vercel

### Le prompt d'installation n'apparaît pas

**Causes possibles** :
- L'app est déjà installée (vérifiez l'écran d'accueil)
- Le site n'est pas en HTTPS
- Le navigateur ne supporte pas PWA (utilisez Chrome/Edge/Safari)

**Solution** :
- Désinstallez l'app si elle existe déjà
- Vérifiez que vous êtes en HTTPS
- Testez sur un autre navigateur

### Sur iOS, les instructions ne s'affichent pas

**Solution** :
1. Vérifiez que vous êtes sur Safari (pas Chrome/Firefox)
2. Cliquez sur le bouton "Installer l'application" dans le dashboard
3. Suivez les instructions affichées

### L'app ne s'ouvre pas en plein écran

**Solution** :
1. Vérifiez que `display: "standalone"` est dans le manifest
2. Désinstallez et réinstallez l'app
3. Videz le cache du navigateur

---

## 📚 Ressources

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [PWA Builder](https://www.pwabuilder.com/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)

---

## ✅ Checklist Finale

- [ ] Icônes `pwa-192x192.png` et `pwa-512x512.png` créées et dans `public/`
- [ ] Manifest `manifest.webmanifest` configuré
- [ ] Meta tags iOS ajoutés dans `index.html`
- [ ] Test local réussi (Android et iOS)
- [ ] Déploiement en production effectué
- [ ] Test en production réussi
- [ ] L'app s'installe correctement sur mobile
- [ ] L'app s'ouvre en plein écran
- [ ] Les icônes s'affichent correctement

---

**🎉 Félicitations ! Votre application InkFlow est maintenant installable sur mobile !**

Les tatoueurs peuvent maintenant installer InkFlow sur leur téléphone et l'utiliser comme une vraie application native, sans passer par l'App Store ou Google Play.
