# 🚀 Déploiement Immédiat - Instructions

## ✅ État Actuel

- ✅ Vercel CLI installé et connecté (compte: noamdj02-5915)
- ✅ Build local réussi
- ✅ Configuration `vercel.json` présente
- ✅ Fichiers API routes prêts

## 🎯 Déploiement en 3 Étapes

### Étape 1 : Préparer le code (si pas déjà fait)

```bash
# Ajouter les nouveaux fichiers
git add .

# Commiter les changements
git commit -m "Add Vercel deployment configuration and guides"

# Pousser sur GitHub
git push origin main
```

### Étape 2 : Déployer sur Vercel

**Option A : Déploiement Preview (Recommandé pour tester)**
```bash
vercel
```

**Option B : Déploiement Production**
```bash
vercel --prod
```

### Étape 3 : Configurer les Variables d'Environnement

Après le déploiement, Vercel vous donnera une URL. Ensuite :

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings → Environment Variables**
4. Ajoutez toutes les variables (voir liste ci-dessous)
5. Redéployez pour appliquer les variables

## 📋 Variables d'Environnement à Configurer

### Obligatoires

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_...)
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Importantes

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (ou pk_live_...)
SITE_URL=https://votre-projet.vercel.app (à mettre après le 1er déploiement)
```

### Optionnelles

```
VITE_GEMINI_API_KEY=votre_gemini_key
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

## 🔄 Après le Premier Déploiement

1. **Copiez l'URL Vercel** (ex: `https://inkflow-xxx.vercel.app`)
2. **Mettez à jour `SITE_URL`** dans les variables d'environnement
3. **Redéployez** pour appliquer le changement

## 🧪 Tester le Déploiement

Une fois déployé, testez :

- [ ] Page d'accueil accessible
- [ ] Connexion/Inscription fonctionne
- [ ] Dashboard accessible
- [ ] API routes fonctionnent (Stripe Connect, etc.)

## 📚 Documentation Complète

- [Guide complet](./DEPLOY_VERCEL_GUIDE.md)
- [Déploiement rapide](./QUICK_DEPLOY_VERCEL.md)
- [Dépannage Stripe Connect](./docs/TROUBLESHOOTING_STRIPE_CONNECT.md)

---

**💡 Prêt à déployer ?** Exécutez simplement `vercel` ou `vercel --prod` dans votre terminal !
