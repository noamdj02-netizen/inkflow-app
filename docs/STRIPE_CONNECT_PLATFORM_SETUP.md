# 🔧 Configuration Stripe Connect - Gestion des Pertes

## 🐛 Erreur

Si vous voyez cette erreur :
```
Please review the responsibilities of managing losses for connected accounts at 
https://dashboard.stripe.com/settings/connect/platform-profile
```

Cela signifie que votre compte Stripe (la plateforme) doit configurer les responsabilités de gestion des pertes avant de pouvoir créer des comptes connectés.

## ✅ Solution : Configurer Stripe Connect

### Étape 1 : Accéder aux Paramètres Stripe Connect

1. Connectez-vous à votre [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **Settings** → **Connect** → **Platform profile**
3. Ou accédez directement : https://dashboard.stripe.com/settings/connect/platform-profile

### Étape 2 : Configurer les Responsabilités

Vous devez choisir qui est responsable des pertes (chargebacks, remboursements, etc.) :

#### Option A : Plateforme Responsable (Recommandé pour commencer)

- **Vous (la plateforme)** êtes responsable des pertes
- Les comptes connectés n'ont pas à gérer les chargebacks
- Vous pouvez facturer des frais de plateforme pour couvrir ces risques

**Avantages** :
- Plus simple pour les artistes (pas de gestion des chargebacks)
- Vous contrôlez la gestion des litiges
- Meilleure expérience utilisateur

**Inconvénients** :
- Vous assumez le risque financier
- Vous devez gérer les chargebacks

#### Option B : Comptes Connectés Responsables

- **Chaque compte connecté** est responsable de ses propres pertes
- Les artistes gèrent leurs propres chargebacks
- Moins de risque pour la plateforme

**Avantages** :
- Moins de risque financier pour vous
- Les artistes ont plus de contrôle

**Inconvénients** :
- Plus complexe pour les artistes
- Ils doivent gérer les litiges eux-mêmes

### Étape 3 : Compléter la Configuration

1. **Sélectionnez votre option** (Plateforme ou Comptes connectés)
2. **Remplissez les informations requises** :
   - Nom de votre plateforme
   - Description
   - Informations de contact
   - Politique de remboursement (optionnel)
3. **Sauvegardez** la configuration

### Étape 4 : Activer Stripe Connect

1. Allez dans **Settings** → **Connect** → **Settings**
2. Vérifiez que **Stripe Connect** est activé
3. Configurez les **Redirect URIs** si nécessaire :
   ```
   https://votre-domaine.vercel.app/api/stripe-connect-callback
   ```

## 📋 Checklist de Configuration

Avant de créer des comptes connectés, vérifiez :

- [ ] Stripe Connect est activé dans votre compte
- [ ] Les responsabilités de gestion des pertes sont configurées
- [ ] Le profil de plateforme est complété
- [ ] Les Redirect URIs sont configurés (si nécessaire)
- [ ] Les variables d'environnement sont configurées dans Vercel :
  - `STRIPE_SECRET_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `VITE_SUPABASE_URL` ou `SUPABASE_URL`

## 🔍 Vérification

Après configuration, testez la création d'un compte connecté :

1. Allez sur `/dashboard/settings`
2. Cliquez sur "Configurer les virements"
3. Vous devriez être redirigé vers Stripe pour l'onboarding
4. Si l'erreur persiste, vérifiez les logs Vercel

## 🆘 Dépannage

### L'erreur persiste après configuration

1. **Vérifiez que vous avez sauvegardé** les paramètres dans Stripe Dashboard
2. **Attendez quelques minutes** - les changements peuvent prendre du temps à se propager
3. **Vérifiez les logs Vercel** pour voir l'erreur exacte
4. **Testez avec un nouveau compte connecté** (supprimez l'ancien si nécessaire)

### Erreur "Connect is not enabled"

1. Allez dans **Settings** → **Connect** → **Settings**
2. Activez **Stripe Connect**
3. Complétez la configuration requise

### Erreur "Invalid redirect URI"

1. Allez dans **Settings** → **Connect** → **Settings**
2. Ajoutez votre URL de callback dans **Redirect URIs** :
   ```
   https://votre-domaine.vercel.app/api/stripe-connect-callback
   ```

## 📚 Ressources

- [Documentation Stripe Connect - Platform Profile](https://stripe.com/docs/connect/platform-profile)
- [Gestion des pertes dans Stripe Connect](https://stripe.com/docs/connect/charges-transfers#losses)
- [Configuration Stripe Connect](https://stripe.com/docs/connect/quickstart)

## 💡 Recommandations

### Pour une Plateforme SaaS (comme InkFlow)

**Recommandation** : Commencez avec **Plateforme Responsable** pour :
- Simplifier l'expérience des artistes
- Contrôler la qualité des transactions
- Facturer des frais de plateforme pour couvrir les risques

Vous pouvez toujours changer plus tard si nécessaire.

### Frais de Plateforme

Si vous choisissez "Plateforme Responsable", vous pouvez :
- Facturer des frais de plateforme (ex: 2-5% par transaction)
- Utiliser `application_fee_amount` dans vos Payment Intents
- Ces frais couvrent les risques et les coûts opérationnels

## 🔄 Après Configuration

Une fois configuré :

1. **Redéployez votre application** sur Vercel (si nécessaire)
2. **Testez la création d'un compte connecté**
3. **Vérifiez que l'onboarding fonctionne**
4. **Testez un paiement** pour confirmer que tout fonctionne

---

**Note** : Cette configuration est **obligatoire** avant de pouvoir créer des comptes connectés. Sans cette configuration, Stripe refusera la création de comptes.
