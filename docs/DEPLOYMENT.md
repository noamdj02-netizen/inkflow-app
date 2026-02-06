# Guide de Déploiement - InkFlow Next.js

Ce guide explique comment déployer InkFlow sur Vercel.

## Prérequis

1. Compte Vercel
2. Compte Supabase
3. Compte Stripe
4. Compte Cal.com (optionnel)
5. Compte Resend (pour les emails)

## 1. Préparation du projet

### Variables d'environnement

Créez un fichier `.env.local` basé sur `.env.local.example` et remplissez toutes les variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cal.com
CAL_COM_API_KEY=cal_...
CAL_COM_BASE_URL=https://api.cal.com/v1

# Resend
RESEND_API_KEY=re_...

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Migrations Supabase

Exécutez les migrations dans l'ordre:

1. `supabase/migrations/001_add_cal_com_fields.sql`
2. `supabase/migrations/002_refactor_bookings.sql`
3. `supabase/migrations/003_add_flash_acompte.sql`

Via Supabase CLI:
```bash
supabase db push
```

Ou via l'interface Supabase Dashboard > SQL Editor.

## 2. Configuration Stripe Webhook

1. Allez dans Stripe Dashboard > Developers > Webhooks
2. Ajoutez un endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Sélectionnez les événements:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copiez le **Signing Secret** (commence par `whsec_`)
5. Ajoutez-le dans les variables d'environnement Vercel

## 3. Déploiement sur Vercel

### Option A: Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B: Via GitHub

1. Poussez votre code sur GitHub
2. Allez sur [vercel.com](https://vercel.com)
3. Importez votre repository
4. Vercel détectera automatiquement Next.js
5. Configurez les variables d'environnement dans Settings > Environment Variables
6. Déployez

### Configuration Vercel

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (par défaut)
- **Output Directory**: `.next` (par défaut)
- **Install Command**: `npm install` (par défaut)

## 4. Vérification post-déploiement

1. ✅ Page d'accueil charge correctement
2. ✅ `/login` fonctionne
3. ✅ `/dashboard` redirige si non connecté
4. ✅ `/artist/[slug]` affiche la vitrine
5. ✅ Réservation fonctionne (test avec Stripe test mode)
6. ✅ Webhook Stripe reçoit les événements
7. ✅ Emails sont envoyés (vérifier Resend dashboard)

## 5. Domain personnalisé (optionnel)

1. Vercel Dashboard > Settings > Domains
2. Ajoutez votre domaine
3. Suivez les instructions DNS
4. Mettez à jour `NEXT_PUBLIC_SITE_URL` avec votre domaine

## 6. Monitoring

- **Vercel Analytics**: Activé automatiquement
- **Logs**: Vercel Dashboard > Deployments > [deployment] > Functions
- **Stripe Logs**: Stripe Dashboard > Developers > Logs
- **Resend Logs**: Resend Dashboard > Logs

## Troubleshooting

### Build échoue

- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez les logs de build dans Vercel Dashboard
- Testez en local: `npm run build`

### Webhook ne fonctionne pas

- Vérifiez l'URL du webhook dans Stripe Dashboard
- Vérifiez `STRIPE_WEBHOOK_SECRET` dans Vercel
- Consultez les logs Vercel Functions

### Erreurs Supabase

- Vérifiez les RLS policies
- Vérifiez que les migrations sont appliquées
- Consultez Supabase Dashboard > Logs

## Support

Pour plus d'aide, consultez:
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
