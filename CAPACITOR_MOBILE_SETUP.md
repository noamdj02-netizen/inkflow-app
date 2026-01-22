# Guide de Configuration Capacitor - Application Mobile InkFlow

Ce guide vous explique comment transformer votre application web InkFlow en application mobile hybride iOS et Android en utilisant Capacitor.

## 📋 Prérequis

### Pour iOS (macOS uniquement)
- **macOS** avec **Xcode** installé (via App Store)
- **Xcode Command Line Tools** : `xcode-select --install`
- **CocoaPods** : `sudo gem install cocoapods`
- Un compte développeur Apple (gratuit pour tester, payant pour publier)

### Pour Android
- **Java Development Kit (JDK)** 17 ou supérieur
- **Android Studio** avec Android SDK
- Variables d'environnement configurées :
  - `ANDROID_HOME` ou `ANDROID_SDK_ROOT`
  - `JAVA_HOME`

## 🚀 Installation et Configuration

### 1. Installation des dépendances

Les dépendances Capacitor sont déjà installées :
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### 2. Configuration Capacitor

Le fichier `capacitor.config.ts` a été créé avec la configuration suivante :
- **App ID** : `com.inkflow.app`
- **App Name** : `InkFlow`
- **Web Directory** : `dist` (dossier de build Vite)

### 3. Build de l'application web

Avant de synchroniser avec les plateformes natives, vous devez construire votre application :

```bash
npm run build
```

Cela génère le dossier `dist` qui sera utilisé par Capacitor.

## 📱 Configuration iOS

### 1. Ajouter la plateforme iOS

```bash
npx cap add ios
```

### 2. Synchroniser le code web avec iOS

```bash
npm run build
npx cap sync ios
```

Cette commande :
- Copie les fichiers du dossier `dist` vers le projet iOS
- Met à jour les dépendances natives
- Synchronise les plugins Capacitor

### 3. Ouvrir dans Xcode

```bash
npx cap open ios
```

Ou utilisez le script npm :
```bash
npm run cap:open:ios
```

### 4. Configuration dans Xcode

1. **Sélectionner le projet** dans le navigateur de gauche
2. **Onglet "Signing & Capabilities"** :
   - Sélectionner votre **Team** (compte développeur Apple)
   - Vérifier que le **Bundle Identifier** est `com.inkflow.app`
3. **Sélectionner un simulateur** ou un appareil physique dans la barre d'outils
4. **Cliquer sur "Run"** (▶️) ou appuyer sur `Cmd + R`

### 5. Prévisualiser sur simulateur iOS

1. Ouvrir Xcode : `npm run cap:open:ios`
2. Dans Xcode, sélectionner un simulateur (ex: iPhone 15 Pro)
3. Cliquer sur le bouton "Run" (▶️)

### 6. Générer un fichier .ipa

#### Pour tester sur un appareil physique :

1. Connecter votre iPhone/iPad via USB
2. Dans Xcode, sélectionner votre appareil dans la liste
3. Cliquer sur "Run" - Xcode installera l'app sur votre appareil

#### Pour créer un fichier .ipa pour distribution :

1. Dans Xcode : **Product → Archive**
2. Attendre la fin de l'archivage
3. Dans la fenêtre **Organizer** :
   - Sélectionner votre archive
   - Cliquer sur **"Distribute App"**
   - Choisir la méthode de distribution (App Store, Ad Hoc, Enterprise, Development)
   - Suivre les étapes pour générer le .ipa

## 🤖 Configuration Android

### 1. Ajouter la plateforme Android

```bash
npx cap add android
```

### 2. Synchroniser le code web avec Android

```bash
npm run build
npx cap sync android
```

### 3. Ouvrir dans Android Studio

```bash
npx cap open android
```

Ou utilisez le script npm :
```bash
npm run cap:open:android
```

### 4. Configuration dans Android Studio

1. **Attendre la synchronisation** de Gradle (première fois peut prendre plusieurs minutes)
2. **Sélectionner un appareil/émulateur** dans la barre d'outils
3. **Cliquer sur "Run"** (▶️) ou appuyer sur `Shift + F10`

### 5. Prévisualiser sur émulateur Android

1. Ouvrir Android Studio : `npm run cap:open:android`
2. Si aucun émulateur n'existe :
   - **Tools → Device Manager**
   - Cliquer sur **"Create Device"**
   - Choisir un appareil (ex: Pixel 7)
   - Télécharger une image système (ex: Android 13)
3. Dans Android Studio, sélectionner l'émulateur
4. Cliquer sur le bouton "Run" (▶️)

### 6. Générer un fichier .apk

#### Pour tester (APK de debug) :

1. Dans Android Studio : **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Le fichier `.apk` sera généré dans : `android/app/build/outputs/apk/debug/app-debug.apk`
3. Transférer ce fichier sur votre appareil Android et l'installer

#### Pour production (APK signé) :

1. **Build → Generate Signed Bundle / APK**
2. Choisir **APK**
3. Créer ou sélectionner un **keystore** (nécessaire pour la signature)
4. Suivre les étapes pour générer l'APK signé

#### Alternative en ligne de commande :

```bash
cd android
./gradlew assembleRelease
```

Le fichier sera dans : `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## 🔄 Workflow de développement

### Après chaque modification du code web :

1. **Rebuild l'application** :
   ```bash
   npm run build
   ```

2. **Synchroniser avec les plateformes** :
   ```bash
   # Pour iOS
   npx cap sync ios
   
   # Pour Android
   npx cap sync android
   
   # Pour les deux
   npx cap sync
   ```

### Scripts npm disponibles

- `npm run cap:sync` - Synchronise les deux plateformes
- `npm run cap:open:ios` - Ouvre le projet iOS dans Xcode
- `npm run cap:open:android` - Ouvre le projet Android dans Android Studio
- `npm run cap:build:ios` - Build + Sync + Ouvre iOS (tout-en-un)
- `npm run cap:build:android` - Build + Sync + Ouvre Android (tout-en-un)

## 📐 Safe Areas (Encoches iPhone)

Les styles CSS pour gérer les Safe Areas ont été ajoutés dans `src/index.css`. 

### Classes CSS disponibles :

- `.safe-area-top` - Padding pour le haut (encoche)
- `.safe-area-bottom` - Padding pour le bas (barre de navigation)
- `.safe-area-left` - Padding pour la gauche
- `.safe-area-right` - Padding pour la droite
- `.safe-area-x` - Padding horizontal
- `.safe-area-y` - Padding vertical
- `.header-safe` - Pour les headers fixes (padding-top avec safe area)
- `.footer-safe` - Pour les footers fixes (padding-bottom avec safe area)

### Utilisation dans vos composants :

```tsx
// Exemple pour un header
<header className="fixed top-0 left-0 right-0 header-safe bg-slate-900">
  {/* Votre contenu */}
</header>

// Exemple pour un footer
<footer className="fixed bottom-0 left-0 right-0 footer-safe bg-slate-900">
  {/* Votre contenu */}
</footer>
```

Le viewport meta tag dans `index.html` inclut déjà `viewport-fit=cover` pour activer le support des Safe Areas.

## 🔧 Configuration avancée

### Modifier l'App ID ou le nom

Éditez `capacitor.config.ts` :

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inkflow.app',  // Changez ici
  appName: 'InkFlow',        // Changez ici
  webDir: 'dist',
  // Options supplémentaires
  server: {
    // Pour le développement avec live reload
    // url: 'http://localhost:3000',
    // cleartext: true
  }
};

export default config;
```

### Plugins Capacitor supplémentaires

Pour ajouter des fonctionnalités natives :

```bash
# Exemples de plugins utiles
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/push-notifications
npm install @capacitor/status-bar
npm install @capacitor/splash-screen

# Puis synchroniser
npx cap sync
```

## 🐛 Dépannage

### iOS

**Erreur "No signing certificate"** :
- Vérifiez que vous avez sélectionné votre Team dans Xcode
- Créez un certificat de développement dans votre compte Apple Developer

**L'app ne se lance pas** :
- Vérifiez les logs dans la console Xcode
- Assurez-vous que le build web a réussi (`npm run build`)

### Android

**Gradle sync failed** :
- Vérifiez que Java JDK 17+ est installé
- Vérifiez les variables d'environnement `ANDROID_HOME` et `JAVA_HOME`

**L'app crash au démarrage** :
- Vérifiez les logs : `adb logcat` dans le terminal
- Vérifiez que toutes les dépendances sont synchronisées : `npx cap sync android`

### Général

**Les modifications ne s'affichent pas** :
- N'oubliez pas de faire `npm run build` puis `npx cap sync` après chaque modification
- Pour le développement, vous pouvez utiliser le serveur de développement avec `server.url` dans `capacitor.config.ts`

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide iOS Capacitor](https://capacitorjs.com/docs/ios)
- [Guide Android Capacitor](https://capacitorjs.com/docs/android)
- [Plugins Capacitor](https://capacitorjs.com/docs/plugins)

## ✅ Checklist de déploiement

### Avant de générer les fichiers de production :

- [ ] Tester l'application sur simulateur iOS
- [ ] Tester l'application sur émulateur Android
- [ ] Tester sur appareils physiques (iOS et Android)
- [ ] Vérifier que les Safe Areas fonctionnent correctement
- [ ] Vérifier les icônes et splash screens
- [ ] Configurer les permissions nécessaires (camera, notifications, etc.)
- [ ] Tester toutes les fonctionnalités principales
- [ ] Vérifier les variables d'environnement et les clés API
- [ ] Configurer le code signing (iOS) et le keystore (Android)
- [ ] Générer les fichiers .ipa et .apk

---

**Note** : Ce projet utilise **Vite** et non Next.js. Le dossier de build est `dist` et non `out` ou `.next`.
