# ⚡ Configuration Rapide - Webhook Secret Stripe

## 🔐 Votre Webhook Secret

Récupérez-le dans **Stripe Dashboard** → **Webhooks** → votre endpoint → **Signing secret** :

```
whsec_xxx
```

## 🚀 Configuration en 2 Étapes

### Étape 1 : Ajouter dans Vercel

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. Configurez :
   - **Name** : `STRIPE_WEBHOOK_SECRET`
   - **Value** : (collez le signing secret depuis Stripe)
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
4. Cliquez sur **Save**

### Étape 2 : Redéployer

Si votre projet est déjà déployé :

1. **Deployments** → Dernier déploiement → **⋯** → **Redeploy**

Ou via CLI :
```powershell
vercel --prod
```

## ✅ Vérification

Testez le webhook depuis Stripe Dashboard :
1. **Stripe Dashboard** → **Webhooks** → Votre endpoint
2. Cliquez sur **"Send test webhook"**
3. Sélectionnez `checkout.session.completed`
4. Vérifiez les logs Vercel : **Functions** → `api/webhooks/stripe` → **Logs**

## 📋 Toutes les Variables d'Environnement

Assurez-vous d'avoir configuré **TOUTES** ces variables dans Vercel :

```env
# Stripe (clés depuis Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

---

**✅ Status** : Webhook secret prêt à être configuré dans Vercel !
