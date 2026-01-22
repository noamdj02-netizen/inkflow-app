# 📧 Configuration Resend - Clé API

## 🔑 Votre Clé API Resend

```
re_Ae5gurSB_ExZtMRjDW5jniSjg2HjpofiK
```

## 📋 Où Configurer cette Clé

### 1. **Vercel Dashboard** (Pour les API Routes)

Les routes API suivantes utilisent Resend :
- `api/send-care-instructions.ts` - Envoi des instructions de soins
- `api/submit-project-request.ts` - Notification des nouvelles demandes

**Configuration** :

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez la variable :
   - **Name** : `RESEND_API_KEY`
   - **Value** : `re_Ae5gurSB_ExZtMRjDW5jniSjg2HjpofiK`
   - **Environment** : Production, Preview, Development (cochez tous)
5. Cliquez sur **Save**
6. **Redéployez** votre projet pour appliquer la variable

### 2. **Supabase Dashboard** (Pour les Edge Functions)

Les Edge Functions suivantes utilisent Resend :
- `supabase/functions/send-email`
- `supabase/functions/submit-project-request`
- `supabase/functions/send-appointment-reminders`

**Configuration** :

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Edge Functions** → **Secrets**
4. Ajoutez le secret :
   - **Name** : `RESEND_API_KEY`
   - **Value** : `re_Ae5gurSB_ExZtMRjDW5jniSjg2HjpofiK`
5. Cliquez sur **Add Secret**

## ✅ Variable Optionnelle : RESEND_FROM_EMAIL

Vous pouvez aussi configurer l'adresse email expéditrice :

**Vercel** :
- **Name** : `RESEND_FROM_EMAIL`
- **Value** : `InkFlow <noreply@votredomaine.com>` (remplacez par votre domaine)
- Si non configuré, utilise par défaut : `InkFlow <onboarding@resend.dev>`

**Supabase** :
- Même chose dans Edge Functions → Secrets

## 🧪 Test de la Configuration

### Test 1 : Envoi d'instructions de soins

1. Allez sur `/dashboard/requests`
2. Sélectionnez un projet
3. Cliquez sur "Envoyer les soins"
4. Vérifiez que l'email est bien envoyé

### Test 2 : Nouvelle demande de projet

1. Allez sur la page publique d'un artiste
2. Soumettez une demande de projet personnalisé
3. L'artiste devrait recevoir un email de notification

## 📝 Checklist

- [ ] `RESEND_API_KEY` configurée dans Vercel (Production, Preview, Development)
- [ ] `RESEND_API_KEY` configurée dans Supabase Edge Functions Secrets
- [ ] `RESEND_FROM_EMAIL` configurée (optionnel mais recommandé)
- [ ] Projet redéployé sur Vercel après ajout des variables
- [ ] Test d'envoi d'email réussi

## 🔍 Vérification

### Vérifier dans Vercel

1. Allez dans **Settings** → **Environment Variables**
2. Vérifiez que `RESEND_API_KEY` apparaît dans la liste
3. Vérifiez les environnements (Production, Preview, Development)

### Vérifier dans Supabase

1. Allez dans **Settings** → **Edge Functions** → **Secrets**
2. Vérifiez que `RESEND_API_KEY` apparaît dans la liste

### Vérifier les Logs

Si les emails ne fonctionnent pas :

1. **Vercel** : Dashboard → Functions → [nom de la fonction] → Logs
2. **Supabase** : Dashboard → Edge Functions → [nom de la fonction] → Logs

Cherchez les erreurs comme :
- `Missing RESEND_API_KEY`
- `Resend error (401)` - Clé invalide
- `Resend error (403)` - Clé sans permissions

## 🆘 Dépannage

### Erreur "Missing RESEND_API_KEY"

- Vérifiez que la variable est bien configurée dans Vercel/Supabase
- Vérifiez que vous avez redéployé après avoir ajouté la variable
- Vérifiez que la variable est configurée pour le bon environnement

### Erreur "Resend error (401)"

- La clé API est invalide ou expirée
- Vérifiez la clé dans votre [Resend Dashboard](https://resend.com/api-keys)
- Régénérez une nouvelle clé si nécessaire

### Les emails ne partent pas

1. Vérifiez les logs Vercel/Supabase
2. Vérifiez que le domaine est vérifié dans Resend (pour production)
3. En développement, vous pouvez utiliser `onboarding@resend.dev` sans vérification

## 📚 Ressources

- [Resend Dashboard](https://resend.com/dashboard)
- [Documentation Resend](https://resend.com/docs)
- [Guide de déploiement Vercel](./DEPLOY_VERCEL_GUIDE.md)

---

**Note** : Cette clé API est sensible. Ne la commitez jamais dans votre code source. Utilisez uniquement les variables d'environnement.
