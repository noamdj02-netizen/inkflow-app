# 🧪 Tester Stripe Webhook en Local

## 🎯 Objectif

Tester les webhooks Stripe en développement local avant de déployer en production.

## 🔧 Méthode 1 : Stripe CLI (Recommandé)

### Installation

**Windows** :
```bash
# Via Scoop
scoop install stripe

# Ou téléchargez depuis https://github.com/stripe/stripe-cli/releases
```

**macOS** :
```bash
brew install stripe/stripe-cli/stripe
```

**Linux** :
```bash
# Voir https://stripe.com/docs/stripe-cli
```

### Configuration

1. **Se connecter à Stripe** :
   ```bash
   stripe login
   ```
   Cela ouvrira votre navigateur pour vous authentifier.

2. **Forwarder les webhooks vers votre serveur local** :
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

3. **Récupérer le webhook secret local** :
   ```bash
   stripe listen --print-secret
   ```
   
   Copiez le secret (commence par `whsec_...`).

4. **Ajouter dans `.env.local`** :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_... (le secret local)
   ```

5. **Redémarrer votre serveur** :
   ```bash
   npm run dev
   ```

### Tester un Événement

Dans un nouveau terminal, déclenchez un événement de test :

```bash
# Tester checkout.session.completed
stripe trigger checkout.session.completed

# Tester subscription.created
stripe trigger customer.subscription.created

# Tester subscription.deleted
stripe trigger customer.subscription.deleted
```

Vous devriez voir les événements dans le terminal où `stripe listen` tourne, et votre serveur local devrait recevoir le webhook.

## 🔧 Méthode 2 : ngrok (Alternative)

### Installation

1. Téléchargez ngrok : https://ngrok.com/download
2. Créez un compte gratuit
3. Récupérez votre auth token

### Configuration

1. **Authentifier ngrok** :
   ```bash
   ngrok config add-authtoken VOTRE_TOKEN
   ```

2. **Démarrer votre serveur local** :
   ```bash
   npm run dev
   ```

3. **Créer un tunnel** :
   ```bash
   ngrok http 3000
   ```

4. **Copier l'URL HTTPS** (ex: `https://abc123.ngrok.io`)

5. **Configurer le webhook dans Stripe** :
   - Allez sur Stripe Dashboard → Developers → Webhooks
   - Cliquez sur "Add endpoint"
   - URL : `https://abc123.ngrok.io/api/webhooks/stripe`
   - Sélectionnez les événements
   - Copiez le signing secret

6. **Ajouter dans Vercel** (pour les tests) :
   - Ou utilisez le secret dans `.env.local` pour les tests locaux

### Tester

1. Créez une session checkout via votre app
2. Complétez le paiement avec une carte de test
3. Le webhook devrait être reçu par votre serveur local via ngrok

## 🔧 Méthode 3 : Tester en Production (Vercel)

1. **Déployez sur Vercel** :
   ```bash
   vercel --prod
   ```

2. **Configurez le webhook dans Stripe** :
   - URL : `https://votre-projet.vercel.app/api/webhooks/stripe`
   - Copiez le signing secret

3. **Ajoutez dans Vercel** :
   - Dashboard → Settings → Environment Variables
   - `STRIPE_WEBHOOK_SECRET` = le secret du webhook

4. **Testez avec Stripe Dashboard** :
   - Allez sur votre webhook endpoint
   - Cliquez sur "Send test webhook"
   - Vérifiez les logs Vercel

## 🐛 Dépannage

### Erreur : "Webhook signature verification failed"

**Causes** :
- Le webhook secret ne correspond pas
- Le body a été parsé (doit être raw string)
- Le timestamp est trop ancien

**Solution** :
1. Vérifiez que vous utilisez le bon secret (local vs production)
2. Vérifiez que le body est bien en raw string
3. Testez avec Stripe CLI qui gère cela automatiquement

### Le webhook n'arrive pas

**Solution** :
1. Vérifiez que `stripe listen` tourne (Méthode 1)
2. Vérifiez que ngrok est actif (Méthode 2)
3. Vérifiez les logs de votre serveur
4. Vérifiez que l'URL est correcte dans Stripe Dashboard

### Erreur : "Missing stripe-signature header"

**Solution** :
- Vérifiez que vous testez depuis Stripe (pas un appel manuel)
- Utilisez Stripe CLI ou configurez correctement le webhook dans Stripe Dashboard

## 📝 Checklist de Test

- [ ] Stripe CLI installé et connecté
- [ ] `stripe listen` en cours d'exécution
- [ ] Webhook secret local dans `.env.local`
- [ ] Serveur local redémarré
- [ ] Événement de test déclenché
- [ ] Webhook reçu dans les logs
- [ ] Base de données mise à jour correctement

## 🔗 Ressources

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks Locally](https://stripe.com/docs/webhooks/test)
- [ngrok Documentation](https://ngrok.com/docs)

---

**Recommandation** : Utilisez **Stripe CLI** (Méthode 1) pour les tests locaux. C'est la méthode la plus simple et fiable.
