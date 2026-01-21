# 🔐 Guide de Configuration OAuth (Google & Apple)

Ce guide vous explique comment configurer l'authentification OAuth avec Google (et Apple) pour votre application InkFlow utilisant **Vite/React Router** et **Supabase Auth**.

---

## 📋 Prérequis

- Un compte Google Cloud Console
- Un projet Supabase configuré
- Les variables d'environnement Supabase déjà configurées (`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`)

---

## 🔵 Configuration Google OAuth

### Étape 1 : Créer un Projet dans Google Cloud Console

1. **Accédez à [Google Cloud Console](https://console.cloud.google.com/)**
2. **Créez un nouveau projet** (ou sélectionnez un projet existant)
   - Cliquez sur le sélecteur de projet en haut
   - Cliquez sur "Nouveau projet"
   - Donnez un nom (ex: "InkFlow OAuth")
   - Cliquez sur "Créer"

### Étape 2 : Activer l'API Google+

1. **Dans le menu latéral**, allez dans **"APIs & Services"** → **"Library"**
2. **Recherchez "Google+ API"** (ou "Google Identity API")
3. **Cliquez sur "Enable"** pour activer l'API

### Étape 3 : Créer les Identifiants OAuth 2.0

1. **Allez dans "APIs & Services"** → **"Credentials"**
2. **Cliquez sur "Create Credentials"** → **"OAuth client ID"**
3. **Si c'est la première fois**, vous devrez configurer l'écran de consentement OAuth :
   - Choisissez "External" (ou "Internal" si vous êtes dans un Workspace Google)
   - Remplissez les informations requises :
     - **App name**: InkFlow
     - **User support email**: Votre email
     - **Developer contact information**: Votre email
   - Cliquez sur "Save and Continue"
   - Dans "Scopes", cliquez sur "Save and Continue"
   - Dans "Test users", ajoutez votre email de test (optionnel pour le développement)
   - Cliquez sur "Save and Continue" puis "Back to Dashboard"

4. **Créez l'OAuth Client ID** :
   - **Application type**: Choisissez **"Web application"**
   - **Name**: InkFlow Web Client
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:5173
     https://votre-domaine.vercel.app
     ```
     ⚠️ **Important**: Ajoutez toutes les URLs où votre app sera accessible (localhost pour dev, Vercel pour prod)
   
   - **Authorized redirect URIs**: 
     ```
     http://localhost:5173/auth/callback
     https://votre-domaine.vercel.app/auth/callback
     https://votre-projet.supabase.co/auth/v1/callback
     ```
     ⚠️ **Important**: 
     - Ajoutez l'URL de callback de votre app (`/auth/callback`)
     - **ET** l'URL de callback de Supabase (`https://votre-projet.supabase.co/auth/v1/callback`)
     - Supabase utilise cette dernière URL pour recevoir le code OAuth de Google

5. **Cliquez sur "Create"**
6. **Copiez les identifiants** :
   - **Client ID** (ex: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **Client Secret** (ex: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

---

## 🔴 Configuration dans Supabase Dashboard

### Étape 1 : Accéder aux Paramètres d'Authentification

1. **Connectez-vous à [Supabase Dashboard](https://app.supabase.com/)**
2. **Sélectionnez votre projet**
3. **Allez dans "Authentication"** (menu latéral gauche)
4. **Cliquez sur "Providers"** (sous-menu)

### Étape 2 : Activer Google Provider

1. **Trouvez "Google"** dans la liste des providers
2. **Activez le toggle** pour activer Google OAuth
3. **Remplissez les champs** :
   - **Client ID (for OAuth)**: Collez le **Client ID** copié depuis Google Cloud Console
   - **Client Secret (for OAuth)**: Collez le **Client Secret** copié depuis Google Cloud Console

4. **Cliquez sur "Save"**

### Étape 3 : Vérifier la Configuration

1. **Vérifiez que le provider Google est "Enabled"** (toggle vert)
2. **Notez l'URL de callback Supabase** affichée (ex: `https://xxxxx.supabase.co/auth/v1/callback`)
   - Cette URL doit être ajoutée dans Google Cloud Console (voir Étape 3.4 ci-dessus)

---

## 🍎 Configuration Apple OAuth (Optionnel)

### Étape 1 : Créer un App ID dans Apple Developer

1. **Accédez à [Apple Developer Portal](https://developer.apple.com/)**
2. **Allez dans "Certificates, Identifiers & Profiles"**
3. **Créez un nouvel "App ID"** avec "Sign in with Apple" activé

### Étape 2 : Créer un Service ID

1. **Créez un "Service ID"** pour votre app
2. **Configurez "Sign in with Apple"** avec les domaines et redirect URLs

### Étape 3 : Créer une Clé

1. **Créez une clé privée** pour "Sign in with Apple"
2. **Téléchargez la clé** (fichier `.p8`)

### Étape 4 : Configurer dans Supabase

1. **Dans Supabase Dashboard** → **Authentication** → **Providers**
2. **Activez "Apple"**
3. **Remplissez** :
   - **Service ID**
   - **Team ID**
   - **Key ID**
   - **Private Key** (contenu du fichier `.p8`)

---

## ✅ Vérification de la Configuration

### Test Local

1. **Démarrez votre app en local** :
   ```bash
   npm run dev
   ```

2. **Allez sur `/login`**
3. **Cliquez sur "Continuer avec Google"**
4. **Vous devriez être redirigé vers Google** pour vous connecter
5. **Après connexion**, vous serez redirigé vers `/auth/callback`
6. **Puis vers `/dashboard`** si tout fonctionne

### Erreurs Courantes

#### ❌ "redirect_uri_mismatch"

**Cause**: L'URL de callback dans Google Cloud Console ne correspond pas à celle utilisée par Supabase.

**Solution**:
1. Vérifiez que vous avez ajouté **les deux URLs** dans Google Cloud Console :
   - `https://votre-projet.supabase.co/auth/v1/callback` (URL Supabase)
   - `http://localhost:5173/auth/callback` (URL locale, optionnel)

#### ❌ "invalid_client"

**Cause**: Le Client ID ou Client Secret est incorrect dans Supabase.

**Solution**:
1. Vérifiez que vous avez copié-collé les identifiants correctement dans Supabase Dashboard
2. Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs

#### ❌ "OAuth provider not enabled"

**Cause**: Le provider Google n'est pas activé dans Supabase.

**Solution**:
1. Allez dans Supabase Dashboard → Authentication → Providers
2. Activez le toggle pour Google

---

## 🔒 Sécurité

### Variables d'Environnement

⚠️ **Ne commitez JAMAIS** les Client ID et Client Secret dans votre code source.

Ces identifiants sont stockés dans Supabase Dashboard et ne doivent pas être dans votre `.env.local`.

### URLs de Callback

- ✅ **Autorisez uniquement** les domaines que vous contrôlez
- ✅ **Utilisez HTTPS** en production
- ❌ **Ne partagez pas** vos identifiants OAuth

---

## 📝 Checklist de Configuration

### Google OAuth

- [ ] Projet créé dans Google Cloud Console
- [ ] Google+ API activée
- [ ] Écran de consentement OAuth configuré
- [ ] OAuth Client ID créé (type "Web application")
- [ ] URLs de callback ajoutées dans Google Console :
  - [ ] `https://votre-projet.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:5173/auth/callback` (dev)
  - [ ] `https://votre-domaine.vercel.app/auth/callback` (prod)
- [ ] Client ID et Secret copiés
- [ ] Provider Google activé dans Supabase Dashboard
- [ ] Client ID et Secret collés dans Supabase Dashboard
- [ ] Test de connexion réussi

### Apple OAuth (Optionnel)

- [ ] App ID créé dans Apple Developer
- [ ] Service ID créé avec "Sign in with Apple"
- [ ] Clé privée générée et téléchargée
- [ ] Provider Apple activé dans Supabase Dashboard
- [ ] Toutes les informations collées dans Supabase Dashboard
- [ ] Test de connexion réussi

---

## 🚀 Déploiement en Production

### Mise à Jour des URLs dans Google Cloud Console

1. **Allez dans Google Cloud Console** → **Credentials**
2. **Modifiez votre OAuth Client ID**
3. **Ajoutez les URLs de production** :
   - **Authorized JavaScript origins**: `https://votre-domaine.vercel.app`
   - **Authorized redirect URIs**: 
     - `https://votre-domaine.vercel.app/auth/callback`
     - `https://votre-projet.supabase.co/auth/v1/callback`

### Vérification Post-Déploiement

1. Testez la connexion OAuth sur votre domaine de production
2. Vérifiez que la redirection fonctionne correctement
3. Vérifiez que l'utilisateur est bien créé dans Supabase après la première connexion OAuth

---

## 📚 Ressources

- [Documentation Supabase OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Documentation Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Documentation Apple Sign In](https://developer.apple.com/sign-in-with-apple/)

---

**Note**: Ce guide est adapté pour une application **Vite/React Router** avec **Supabase Auth**. Si vous utilisez Next.js, les URLs de callback peuvent différer légèrement.
