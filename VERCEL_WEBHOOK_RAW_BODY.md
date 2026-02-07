# 🔧 Configuration Body Raw pour Webhooks Vercel

## ⚠️ Problème

Vercel Serverless Functions peuvent parser automatiquement le body JSON, ce qui casse la vérification de signature Stripe (qui nécessite le body raw).

## ✅ Solution

### Option 1 : Utiliser `req.body` tel quel (Recommandé)

Le code dans `api/webhooks/stripe/route.ts` gère déjà plusieurs cas :
- Body en string
- Body en Buffer
- Body parsé (reconstruction)

### Option 2 : Configurer Vercel pour ne pas parser le body

Si vous avez des problèmes de signature, vous pouvez forcer Vercel à ne pas parser le body en ajoutant dans `vercel.json` :

```json
{
  "functions": {
    "api/webhooks/stripe/route.ts": {
      "includeFiles": "**"
    }
  }
}
```

Cependant, Vercel parse généralement le body automatiquement. Le code actuel devrait gérer cela.

### Option 3 : Utiliser une fonction séparée

Si les problèmes persistent, créez une fonction dédiée dans `api/webhooks/stripe.ts` (sans le sous-dossier) :

```typescript
// api/webhooks-stripe.ts
export default async function handler(req: any, res: any) {
  // Vercel passe le body comme string ou Buffer pour les webhooks
  const rawBody = typeof req.body === 'string' 
    ? req.body 
    : Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : JSON.stringify(req.body);
  
  // ... reste du code
}
```

## 🧪 Vérification

Pour vérifier que le webhook fonctionne :

1. **Testez avec Stripe CLI** (recommandé) :
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   stripe trigger checkout.session.completed
   ```

2. **Vérifiez les logs Vercel** :
   - Dashboard → Functions → `api/webhooks/stripe` → Logs
   - Cherchez les erreurs de signature

3. **Testez en production** :
   - Configurez le webhook dans Stripe Dashboard
   - Utilisez "Send test webhook" dans Stripe Dashboard
   - Vérifiez les logs Vercel

## 🔍 Dépannage

### Erreur : "Webhook signature verification failed"

**Causes** :
- Body parsé au lieu de raw
- Webhook secret incorrect
- Timestamp trop ancien

**Solution** :
1. Utilisez Stripe CLI pour les tests locaux (gère automatiquement)
2. Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
3. Vérifiez que vous utilisez le bon secret (local vs production)

### Le webhook ne se déclenche pas

**Solution** :
1. Vérifiez que l'endpoint est configuré dans Stripe Dashboard
2. Vérifiez que l'URL est correcte
3. Vérifiez les logs Vercel pour voir si la requête arrive

---

**Note** : Le code actuel devrait fonctionner avec Vercel. Si vous avez des problèmes, utilisez Stripe CLI pour les tests locaux qui gère automatiquement le body raw.
