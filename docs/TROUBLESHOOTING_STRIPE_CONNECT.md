# 🔧 Dépannage - Erreur "Stripe Connect Not Found"

## 🐛 Problème

Vous voyez l'erreur **"Stripe Connect Not Found"** ou **"Route API non trouvée"** lorsque vous essayez de connecter votre compte Stripe.

## 🔍 Causes possibles

### 1. **Test en développement local** (Cause la plus fréquente)

Les routes API (`/api/stripe-connect-onboard`) ne fonctionnent **qu'en production sur Vercel**. En développement local avec Vite, ces routes ne sont pas disponibles.

**Solution** : Déployez votre projet sur Vercel pour tester Stripe Connect.

### 2. **Fonction serverless non déployée**

Les fichiers dans le dossier `api/` doivent être déployés sur Vercel pour fonctionner.

**Vérification** :
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans l'onglet **"Functions"**
4. Vérifiez que `api/stripe-connect-onboard` apparaît dans la liste

**Solution** :
```bash
# Redéployez votre projet
git push origin main
# Ou via Vercel CLI
vercel --prod
```

### 3. **Variables d'environnement manquantes**

Les fonctions serverless nécessitent des variables d'environnement configurées dans Vercel.

**Variables requises** :
- `STRIPE_SECRET_KEY` - Votre clé secrète Stripe
- `VITE_SUPABASE_URL` ou `SUPABASE_URL` - URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role Supabase
- `SITE_URL` (optionnel) - URL de production

**Solution** :
1. Allez sur Vercel Dashboard → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez toutes les variables requises
3. Redéployez le projet

### 4. **Configuration Vercel incorrecte**

Le fichier `vercel.json` doit être correctement configuré.

**Vérification** : Vérifiez que `vercel.json` contient :
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

## ✅ Solutions étape par étape

### Solution 1 : Déployer sur Vercel (Recommandé)

1. **Pousser votre code sur GitHub** :
   ```bash
   git add .
   git commit -m "Add Stripe Connect API routes"
   git push origin main
   ```

2. **Vérifier le déploiement sur Vercel** :
   - Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Vérifiez que le déploiement est réussi
   - Vérifiez les logs de déploiement pour les erreurs

3. **Configurer les variables d'environnement** :
   - Vercel Dashboard → Settings → Environment Variables
   - Ajoutez toutes les variables requises (voir ci-dessus)

4. **Tester l'API** :
   - Ouvrez votre application déployée (pas localhost)
   - Essayez de connecter Stripe Connect

### Solution 2 : Tester en local avec un proxy (Avancé)

Si vous voulez vraiment tester en local, vous pouvez configurer un proxy dans `vite.config.ts` :

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://votre-projet.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
```

**Note** : Cette solution n'est pas recommandée car elle nécessite que votre projet soit déjà déployé.

### Solution 3 : Utiliser Supabase Edge Functions (Alternative)

Au lieu d'utiliser Vercel Serverless Functions, vous pouvez utiliser Supabase Edge Functions :

1. Créez une Edge Function dans `supabase/functions/stripe-connect-onboard/`
2. Déployez-la avec `supabase functions deploy stripe-connect-onboard`
3. Modifiez l'appel dans `DashboardSettings.tsx` pour utiliser Supabase Functions

## 🧪 Test de l'API

### Test manuel avec curl

Une fois déployé sur Vercel, testez l'API avec :

```bash
curl -X POST https://votre-projet.vercel.app/api/stripe-connect-onboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_SUPABASE"
```

**Note** : Remplacez `VOTRE_TOKEN_SUPABASE` par un token valide obtenu depuis votre application.

### Vérifier les logs Vercel

1. Allez sur Vercel Dashboard → Votre projet → **Functions**
2. Cliquez sur `api/stripe-connect-onboard`
3. Consultez les logs pour voir les erreurs éventuelles

## 📋 Checklist de vérification

Avant de signaler un problème, vérifiez :

- [ ] Le projet est déployé sur Vercel (pas en local)
- [ ] Les variables d'environnement sont configurées dans Vercel
- [ ] La fonction `api/stripe-connect-onboard` apparaît dans Vercel Functions
- [ ] Vous êtes connecté avec un compte artiste valide
- [ ] Le profil artiste existe dans la base de données Supabase
- [ ] Les logs Vercel ne montrent pas d'erreurs

## 🆘 Si le problème persiste

1. **Vérifiez les logs Vercel** pour voir l'erreur exacte
2. **Vérifiez la console du navigateur** (F12) pour les erreurs réseau
3. **Testez l'API directement** avec curl (voir ci-dessus)
4. **Vérifiez que Stripe Connect est activé** dans votre compte Stripe Dashboard

## 📚 Ressources

- [Documentation Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Documentation Stripe Connect](https://stripe.com/docs/connect)
- [Guide de déploiement Vercel](./VERCEL_DEPLOYMENT_CHECKLIST.md)
