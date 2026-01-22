# 🔐 Lien de Vérification Stripe Connect

## 🔗 Lien de Vérification

```
https://verify.stripe.com/v/7sY28k1Q25uHaO24NSfUQ00
```

## 📋 Qu'est-ce que c'est ?

Ce lien est une **page de vérification d'identité Stripe** qui fait partie du processus d'onboarding Stripe Connect. Il est généralement envoyé par email ou accessible depuis le flux d'onboarding.

## ✅ Que Faire avec ce Lien

### Option 1 : Compléter la Vérification (Recommandé)

1. **Ouvrez le lien** dans votre navigateur
2. **Suivez les instructions** pour compléter la vérification :
   - Vérification d'identité (pièce d'identité)
   - Informations bancaires (RIB/IBAN)
   - Informations fiscales (si nécessaire)
3. **Soumettez** les informations
4. **Attendez la validation** (généralement quelques minutes à quelques heures)

### Option 2 : Accéder via le Dashboard

Si vous avez déjà commencé l'onboarding :

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Connectez-vous avec votre compte Stripe
3. Allez dans **Connect** → **Accounts**
4. Trouvez votre compte connecté
5. Complétez les étapes manquantes

## 🔄 Après la Vérification

Une fois la vérification complétée :

1. **Stripe valide** votre compte (généralement sous 24h)
2. **Votre compte est activé** pour recevoir des paiements
3. **Dans InkFlow** :
   - Allez sur `/dashboard/settings`
   - Le statut Stripe devrait être mis à jour automatiquement
   - Vous verrez "Compte Stripe actif" ✅

## 🧪 Vérifier le Statut

### Dans Stripe Dashboard

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Connect** → **Accounts**
3. Vérifiez le statut de votre compte :
   - ✅ **Active** : Prêt à recevoir des paiements
   - ⏳ **Pending** : En attente de vérification
   - ❌ **Restricted** : Problème à résoudre

### Dans InkFlow

1. Allez sur `/dashboard/settings`
2. Section **"Paiements Stripe"**
3. Vérifiez le statut :
   - ✅ "Compte Stripe actif" = Tout est bon
   - ⚠️ "Configurer les virements" = Onboarding incomplet

## ⚠️ Si le Lien a Expiré

Les liens de vérification Stripe expirent généralement après 7 jours. Si le lien ne fonctionne plus :

1. **Allez sur `/dashboard/settings`** dans InkFlow
2. **Cliquez sur "Configurer les virements"**
3. Vous serez redirigé vers un nouveau flux d'onboarding
4. Complétez les étapes manquantes

## 📝 Informations Requises pour la Vérification

Stripe peut demander :

- **Pièce d'identité** : Carte d'identité, passeport, ou permis de conduire
- **RIB/IBAN** : Pour recevoir les paiements
- **Informations fiscales** : Selon votre pays
- **Informations sur l'entreprise** : Si vous êtes une entreprise

## 🆘 Dépannage

### Le lien ne fonctionne pas

- Vérifiez que vous êtes connecté à votre compte Stripe
- Essayez d'accéder via le Dashboard Stripe directement
- Relancez l'onboarding depuis InkFlow (`/dashboard/settings`)

### La vérification est bloquée

- Vérifiez que tous les documents sont valides et lisibles
- Contactez le support Stripe si nécessaire
- Vérifiez les emails de Stripe pour plus d'informations

### Le statut ne se met pas à jour dans InkFlow

1. Attendez quelques minutes (synchronisation)
2. Rafraîchissez la page
3. Vérifiez que le webhook Stripe est configuré
4. Vérifiez les logs Vercel pour les erreurs

## 📚 Ressources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Documentation Stripe Connect](https://stripe.com/docs/connect)
- [Support Stripe](https://support.stripe.com)

---

**Note** : Ce lien est personnel et sécurisé. Ne le partagez pas publiquement. Si vous avez des questions, contactez le support Stripe.
