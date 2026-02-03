# 🔐 Configuration du Callback d'Authentification Supabase (PKCE)

## ✅ Routes créées

Deux versions de la route callback ont été créées pour supporter différents environnements :

### 1. **Route Next.js** (`app/auth/callback/route.ts`)
- Compatible Next.js 14/15 App Router
- Utilise `@supabase/ssr` pour la gestion des cookies
- Gère automatiquement les cookies de session via `cookies()` de Next.js

### 2. **Route Vercel Serverless** (`api/auth/callback.ts`)
- Compatible Vercel Serverless Functions (Vite)
- Format standard pour les projets Vite déployés sur Vercel
- Redirige vers le frontend qui gère la session côté client

## 🔧 Configuration Supabase

### 1. **Configurer l'URL de callback dans Supabase Dashboard**

1. Allez sur [Supabase Dashboard](https://app.supabase.com) → Votre projet
2. Allez dans **Authentication** → **URL Configuration**
3. Ajoutez ces URLs dans **Redirect URLs** :
   - `https://ink-flow.me/auth/callback` (production)
   - `https://votre-projet.vercel.app/auth/callback` (preview)
   - `http://localhost:5173/auth/callback` (développement local)

### 2. **Configurer les templates d'email**

Dans **Authentication** → **Email Templates**, assurez-vous que les liens pointent vers :
- Confirmation d'email : `{{ .SiteURL }}/auth/callback?token={{ .TokenHash }}&type=email`
- Réinitialisation mot de passe : `{{ .SiteURL }}/auth/callback?token={{ .TokenHash }}&type=recovery`

**Note** : Avec PKCE, Supabase utilise un `code` au lieu d'un `token`. Les templates doivent être configurés pour utiliser le flow PKCE.

## 🔄 Flux d'authentification

### Confirmation d'email

1. Utilisateur s'inscrit → Email de confirmation envoyé
2. Utilisateur clique sur le lien → Redirigé vers `/auth/callback?code=...`
3. Route API échange le code contre une session
4. Redirection vers `/dashboard` (ou URL dans paramètre `next`)

### Réinitialisation de mot de passe

1. Utilisateur demande une réinitialisation → Email envoyé
2. Utilisateur clique sur le lien → Redirigé vers `/auth/callback?code=...&type=recovery`
3. Route API échange le code contre une session
4. Redirection vers `/auth/update-password` (ou URL personnalisée)

## 📋 Paramètres de la route

### Query Parameters

- `code` (requis) : Code PKCE à échanger contre une session
- `error` : Code d'erreur Supabase (si présent)
- `error_description` : Description de l'erreur
- `next` : URL de redirection personnalisée (optionnel, validé pour sécurité)

### Exemples d'URLs

```
✅ Succès :
/auth/callback?code=abc123...

✅ Avec redirection personnalisée :
/auth/callback?code=abc123...&next=/dashboard/settings

❌ Erreur :
/auth/callback?error=invalid_code&error_description=Le+code+a+expiré
```

## 🔒 Sécurité

- ✅ Validation du paramètre `next` pour éviter les redirections malveillantes
- ✅ Vérification que le code est présent avant l'échange
- ✅ Gestion des erreurs avec messages clairs
- ✅ Logs pour le débogage en production

## 🧪 Test

### Test local

1. Configurez les variables d'environnement :
   ```bash
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_cle_anon
   ```

2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

3. Testez avec un lien de confirmation d'email Supabase

### Test en production

1. Déployez sur Vercel
2. Vérifiez que la route `/auth/callback` répond correctement
3. Testez avec un vrai email de confirmation

## 📝 Notes importantes

- **Pour Vercel + Vite** : La route `/api/auth/callback` sera utilisée automatiquement grâce au rewrite dans `vercel.json`
- **Pour Next.js** : La route `app/auth/callback/route.ts` sera utilisée automatiquement
- Les cookies de session sont gérés automatiquement par `@supabase/ssr` (Next.js) ou côté client (Vercel/Vite)

## 🐛 Dépannage

### Erreur : "No code parameter found"
- Vérifiez que les templates d'email Supabase utilisent bien le flow PKCE
- Vérifiez que l'URL de callback est correctement configurée dans Supabase

### Erreur : "Session introuvable"
- Le code a peut-être expiré (généralement valide 1 heure)
- Vérifiez que les variables d'environnement Supabase sont correctes

### Redirection ne fonctionne pas
- Vérifiez les logs Vercel pour voir les erreurs
- Vérifiez que le paramètre `next` est une URL valide du même domaine
