# ⚡ Déploiement Rapide sur Vercel

## 🚀 Méthode Rapide (Recommandée)

### Option 1 : Via Vercel Dashboard (Le plus simple)

1. **Poussez votre code sur GitHub** :
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Allez sur [vercel.com](https://vercel.com)** :
   - Connectez-vous avec GitHub
   - Cliquez sur **"Add New Project"**
   - Sélectionnez votre repository
   - Cliquez sur **"Import"**

3. **Configurez les variables d'environnement** (voir ci-dessous)

4. **Cliquez sur "Deploy"** 🎉

### Option 2 : Via Vercel CLI

```bash
# Installer Vercel CLI (si pas déjà installé)
npm install -g vercel

# Se connecter
vercel login

# Déployer en preview
vercel

# Déployer en production
vercel --prod
```

## 📋 Variables d'Environnement Requises

**IMPORTANT** : Configurez ces variables dans Vercel Dashboard → Settings → Environment Variables

### Variables Frontend (VITE_*)
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (ou pk_live_...)
VITE_GEMINI_API_KEY=votre_gemini_key (optionnel)
```

### Variables Backend (API Routes)
```
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_...)
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
SUPABASE_URL=https://votre-projet.supabase.co
SITE_URL=https://votre-projet.vercel.app (à mettre à jour après le 1er déploiement)
```

### Variables Optionnelles
```
STRIPE_WEBHOOK_SECRET=whsec_... (pour les webhooks)
RESEND_API_KEY=re_... (pour les emails)
```

## ✅ Checklist Rapide

- [ ] Code poussé sur GitHub
- [ ] Build local réussi (`npm run build`)
- [ ] Variables d'environnement préparées
- [ ] Projet importé sur Vercel
- [ ] Variables configurées dans Vercel
- [ ] Déploiement lancé
- [ ] `SITE_URL` mis à jour après le 1er déploiement

## 🔗 Liens Utiles

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Guide complet](./DEPLOY_VERCEL_GUIDE.md)
- [Dépannage Stripe Connect](./docs/TROUBLESHOOTING_STRIPE_CONNECT.md)

---

**💡 Astuce** : Après le premier déploiement, Vercel vous donnera une URL. Mettez à jour `SITE_URL` dans les variables d'environnement avec cette URL, puis redéployez.
