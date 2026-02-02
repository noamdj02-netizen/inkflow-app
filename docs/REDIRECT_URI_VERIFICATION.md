# Vérification des liens OAuth — Erreur « redirect_uri_mismatch » (Error 400)

Si vous voyez **« Access blocked: This app's request is invalid »** avec **Error 400: redirect_uri_mismatch** lors de « Connexion avec Google », c’est que l’URI de redirection utilisée par Supabase n’est pas autorisée dans Google Cloud Console.

---

## 1. URI que Google doit accepter (obligatoire)

Google reçoit **l’URI de callback Supabase**, pas celle de votre site. Il faut donc autoriser **exactement** :

```
https://<VOTRE_PROJECT_REF>.supabase.co/auth/v1/callback
```

### Pour le projet InkFlow (jnrprkdueseahfrguhvt)

**URI à ajouter dans Google Cloud Console → Authorized redirect URIs :**

```
https://jnrprkdueseahfrguhvt.supabase.co/auth/v1/callback
```

Copiez-collez cette URL telle quelle (sans slash final). C’est l’URI utilisée par Supabase Auth pour recevoir le code OAuth de Google.

---

## 2. Où configurer

### A. Google Cloud Console

1. Ouvrez [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Cliquez sur votre **OAuth 2.0 Client ID** (type « Web application »).
3. Dans **Authorized redirect URIs**, ajoutez **exactement** (sans slash final) :
   - **Obligatoire** : `https://jnrprkdueseahfrguhvt.supabase.co/auth/v1/callback`
   - Optionnel : `https://ink-flow.me/auth/callback`
   - Optionnel (dev) : `http://localhost:5173/auth/callback`
4. **Save**.

### B. Supabase Dashboard

1. [Supabase Dashboard](https://app.supabase.com/) → votre projet → **Authentication** → **URL Configuration**.
2. **Site URL** : `https://ink-flow.me`
3. **Redirect URLs** (une par ligne) :
   - `https://ink-flow.me/auth/callback`
   - `http://localhost:5173/auth/callback` (dev)
   - `https://inkflow-app-swart.vercel.app/auth/callback` (si vous utilisez ce domaine)
4. **Save**.

---

## 3. Récupérer l’URI Supabase exacte

L’URI de callback Supabase est dérivée de `VITE_SUPABASE_URL` :

- Si `VITE_SUPABASE_URL = https://xyz123.supabase.co`
- Alors **Authorized redirect URI** dans Google = `https://xyz123.supabase.co/auth/v1/callback`

Vous pouvez la retrouver aussi dans Supabase : **Authentication** → **Providers** → **Google** → l’URL de callback y est indiquée.

---

## 4. Checklist

- [ ] Dans **Google Cloud Console** → OAuth Client → **Authorized redirect URIs** : présence de `https://<ref>.supabase.co/auth/v1/callback`.
- [ ] Pas de slash final, pas d’espace, pas de typo.
- [ ] Dans **Supabase** → **URL Configuration** : **Site URL** = `https://ink-flow.me` et **Redirect URLs** contient `https://ink-flow.me/auth/callback`.
- [ ] Après modification, attendre quelques minutes et réessayer « Connexion avec Google ».

---

## 5. Référence des URIs utilisées par l’app

| Contexte        | URI |
|-----------------|-----|
| Callback Supabase (pour Google) — InkFlow | `https://jnrprkdueseahfrguhvt.supabase.co/auth/v1/callback` |
| Callback app (prod)            | `https://ink-flow.me/auth/callback` |
| Callback app (dev)              | `http://localhost:5173/auth/callback` |

Le code utilise `window.location.origin + '/auth/callback'` pour la redirection après connexion ; en prod sur ink-flow.me, cela donne bien `https://ink-flow.me/auth/callback`.
