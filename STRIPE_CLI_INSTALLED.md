# ✅ Stripe CLI Installé avec Succès

## 🎉 Installation Terminée

Stripe CLI version **1.34.0** est maintenant installé sur votre système.

**Emplacement** : `C:\Users\lanie\stripe-cli`

## 🔐 Prochaines Étapes

### 1. Se Connecter à Stripe

```powershell
stripe login
```

Cela ouvrira votre navigateur pour vous authentifier avec votre compte Stripe.

### 2. Tester les Webhooks en Local

Une fois connecté, vous pouvez forwarder les webhooks vers votre serveur local :

```powershell
# Démarrer votre serveur local d'abord (dans un autre terminal)
npm run dev

# Puis dans ce terminal, forwarder les webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### 3. Récupérer le Webhook Secret Local

Dans un nouveau terminal (pendant que `stripe listen` tourne) :

```powershell
stripe listen --print-secret
```

Copiez le secret (commence par `whsec_...`) et ajoutez-le dans `.env.local` :

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Tester un Événement

```powershell
stripe trigger checkout.session.completed
```

## 📚 Commandes Utiles

```powershell
# Vérifier la version
stripe --version

# Se connecter
stripe login

# Forwarder les webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Récupérer le secret local
stripe listen --print-secret

# Tester un événement
stripe trigger checkout.session.completed

# Voir l'aide
stripe --help
```

## 🔧 Configuration

Votre Restricted Key Stripe doit être configurée dans Vercel :
- Format : `rk_live_...` (votre Restricted Key)

**N'oubliez pas** :
1. Ajouter cette clé dans **Vercel** → Environment Variables → `STRIPE_SECRET_KEY`
2. Récupérer votre **Publishable Key** (`pk_live_...`) pour le frontend
3. Configurer le **Webhook Secret** après avoir créé l'endpoint dans Stripe Dashboard

## 🆘 Dépannage

### Erreur : "stripe n'est pas reconnu"

**Solution** : Fermez et rouvrez PowerShell pour que le PATH soit mis à jour.

### Erreur lors de `stripe login`

**Solution** : Vérifiez votre connexion internet et que votre navigateur peut s'ouvrir.

---

**Status** : ✅ Stripe CLI installé et prêt à l'emploi !
