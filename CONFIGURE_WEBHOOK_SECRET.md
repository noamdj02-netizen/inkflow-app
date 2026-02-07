# 🔐 Configuration du Webhook Secret Stripe

## ✅ Webhook Secret Reçu

Votre webhook secret Stripe :
```
whsec_mHveF4apfFznKFAl60DvnMtxRwyXBrwa
```

## 🚀 Configuration dans Vercel

### Étape 1 : Ajouter la Variable d'Environnement

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `inkflow-app` (ou créez-le si pas encore fait)
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **Add New**
5. Configurez :
   - **Name** : `STRIPE_WEBHOOK_SECRET`
   - **Value** : `whsec_mHveF4apfFznKFAl60DvnMtxRwyXBrwa`
   - ✅ Cochez **Production**
   - ✅ Cochez **Preview** (optionnel, pour tester)
   - ✅ Cochez **Development** (optionnel, pour tests locaux)
6. Cliquez sur **Save**

### Étape 2 : Redéployer (si déjà déployé)

Si votre projet est déjà déployé, vous devez redéployer pour que la nouvelle variable soit prise en compte :

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**

Ou via CLI :
```powershell
vercel --prod
```

## 🔍 Vérification

### Vérifier que le Webhook est Configuré dans Stripe

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** → **Webhooks**
3. Vérifiez que votre endpoint est configuré :
   - **URL** : `https://votre-projet.vercel.app/api/webhooks/stripe`
   - **Status** : ✅ Enabled
   - **Events** :
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`

### Tester le Webhook

1. **Stripe Dashboard** → Votre webhook → **"Send test webhook"**
2. Sélectionnez `checkout.session.completed`
3. Cliquez sur **"Send test webhook"**
4. Vérifiez les logs Vercel :
   - **Vercel Dashboard** → **Functions** → `api/webhooks/stripe` → **Logs**
   - Vous devriez voir : `✅ User ... upgraded to Premium via session ...`

## 📋 Checklist Complète

- [ ] Webhook secret ajouté dans Vercel (`STRIPE_WEBHOOK_SECRET`)
- [ ] Projet redéployé (si déjà déployé)
- [ ] Webhook configuré dans Stripe Dashboard
- [ ] URL du webhook correcte (production)
- [ ] Événements sélectionnés dans Stripe
- [ ] Test du webhook réussi

## 🆘 Dépannage

### Erreur : "Webhook signature verification failed"

**Causes** :
- Webhook secret incorrect dans Vercel
- Body parsé au lieu de raw (géré automatiquement dans le code)

**Solution** :
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est exactement : `whsec_mHveF4apfFznKFAl60DvnMtxRwyXBrwa`
2. Vérifiez qu'il n'y a pas d'espaces avant/après
3. Redéployez après avoir ajouté la variable

### Le webhook ne se déclenche pas

**Solution** :
1. Vérifiez que l'URL du webhook dans Stripe est correcte
2. Vérifiez que le webhook est "Enabled" dans Stripe Dashboard
3. Vérifiez les logs Vercel pour voir si la requête arrive

---

**Important** : Ne partagez JAMAIS ce webhook secret publiquement. Il est maintenant configuré dans Vercel et ne doit pas être dans le code.
