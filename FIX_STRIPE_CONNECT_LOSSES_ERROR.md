# 🔧 Correction de l'erreur Stripe Connect "Managing Losses"

## 🐛 Problème

L'erreur suivante apparaît lors de la création d'un compte Stripe Connect :
```
Please review the responsibilities of managing losses for connected accounts at 
https://dashboard.stripe.com/settings/connect/platform-profile
```

## ✅ Solution

Cette erreur indique que votre compte Stripe (la plateforme) doit configurer les responsabilités de gestion des pertes avant de pouvoir créer des comptes connectés.

### Configuration Requise

1. **Allez sur Stripe Dashboard** : https://dashboard.stripe.com/settings/connect/platform-profile
2. **Configurez les responsabilités** :
   - Choisissez qui est responsable des pertes (chargebacks, remboursements)
   - Option A : **Plateforme responsable** (recommandé pour commencer)
   - Option B : **Comptes connectés responsables**
3. **Complétez le profil de plateforme**
4. **Sauvegardez** la configuration

### Guide Complet

Consultez le guide détaillé : [`docs/STRIPE_CONNECT_PLATFORM_SETUP.md`](./docs/STRIPE_CONNECT_PLATFORM_SETUP.md)

## 🔧 Corrections Apportées

### 1. Gestion d'erreur améliorée dans l'API

Le fichier `api/stripe-connect-onboard.ts` détecte maintenant cette erreur spécifique et retourne un message clair :

```typescript
if (accountError?.message?.includes('losses') || accountError?.message?.includes('platform-profile')) {
  return json(res, 400, {
    error: 'Configuration Stripe Connect requise',
    code: 'STRIPE_CONNECT_CONFIG_REQUIRED',
    message: 'Veuillez configurer les responsabilités...',
    helpUrl: 'https://dashboard.stripe.com/settings/connect/platform-profile',
  });
}
```

### 2. Message d'erreur amélioré dans le frontend

Le composant `DashboardSettings.tsx` affiche maintenant :
- Un message d'erreur clair
- Un bouton pour ouvrir directement le Stripe Dashboard
- Un lien vers le guide de configuration

### 3. Documentation créée

- `docs/STRIPE_CONNECT_PLATFORM_SETUP.md` - Guide complet de configuration

## 📋 Checklist

Avant de créer des comptes connectés :

- [ ] Stripe Connect est activé dans votre compte Stripe
- [ ] Les responsabilités de gestion des pertes sont configurées
- [ ] Le profil de plateforme est complété
- [ ] Les Redirect URIs sont configurés (si nécessaire)
- [ ] Les variables d'environnement sont configurées dans Vercel

## 🧪 Test

Après configuration :

1. Allez sur `/dashboard/settings`
2. Cliquez sur "Configurer les virements"
3. Vous devriez être redirigé vers Stripe pour l'onboarding
4. Si l'erreur persiste, vérifiez que vous avez bien sauvegardé dans Stripe Dashboard

## 📚 Ressources

- [Guide de configuration](./docs/STRIPE_CONNECT_PLATFORM_SETUP.md)
- [Stripe Dashboard - Platform Profile](https://dashboard.stripe.com/settings/connect/platform-profile)
- [Documentation Stripe Connect](https://stripe.com/docs/connect)

---

**Status** : ✅ Corrigé - L'erreur est maintenant détectée et un message clair avec lien de configuration est affiché.
