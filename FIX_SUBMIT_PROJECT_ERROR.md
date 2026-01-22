# 🔧 Correction de l'erreur "submit-project-request"

## 🐛 Problème

L'erreur suivante apparaît lors de l'envoi d'une demande de projet personnalisé :

```
Impossible de contacter le serveur. Si vous êtes en production, vérifiez que 
'/api/submit-project-request' existe sur Vercel. Sinon, déployez l'Edge Function 
'submit-project-request' dans Supabase.
```

## 🔍 Causes Possibles

1. **Route API non déployée** : La fonction `api/submit-project-request.ts` n'est pas déployée sur Vercel
2. **Fallback Supabase non configuré** : L'Edge Function Supabase n'est pas déployée
3. **Variables d'environnement manquantes** : `RESEND_API_KEY` ou autres variables non configurées

## ✅ Corrections Apportées

### 1. Amélioration de la gestion d'erreur

- ✅ Meilleure détection des erreurs 404
- ✅ Fallback automatique vers Supabase Edge Function
- ✅ Messages d'erreur adaptés selon l'environnement (dev vs production)
- ✅ Gestion des erreurs réseau

### 2. Fallback amélioré

Le code essaie maintenant automatiquement :
1. **D'abord** : Route API Vercel (`/api/submit-project-request`)
2. **Si 404** : Supabase Edge Function (`submit-project-request`)
3. **Messages clairs** selon le résultat

## 🚀 Solutions

### Solution 1 : Déployer sur Vercel (Recommandé)

1. **Vérifiez que le fichier existe** : `api/submit-project-request.ts`
2. **Poussez sur GitHub** :
   ```bash
   git add api/submit-project-request.ts
   git commit -m "Add submit-project-request API route"
   git push origin main
   ```
3. **Vercel déploiera automatiquement** la fonction
4. **Vérifiez dans Vercel Dashboard** :
   - Allez dans **Functions**
   - Vérifiez que `api/submit-project-request` apparaît

### Solution 2 : Déployer Supabase Edge Function (Alternative)

Si vous préférez utiliser Supabase Edge Functions :

1. **Vérifiez que l'Edge Function existe** : `supabase/functions/submit-project-request/index.ts`
2. **Déployez avec Supabase CLI** :
   ```bash
   supabase functions deploy submit-project-request
   ```
3. **Ou via Supabase Dashboard** :
   - Allez dans **Edge Functions**
   - Créez ou mettez à jour la fonction `submit-project-request`
   - Copiez le contenu de `supabase/functions/submit-project-request/index.ts`

### Solution 3 : Configurer les Variables d'Environnement

**Pour Vercel** (si vous utilisez la route API) :

Dans Vercel Dashboard → Settings → Environment Variables :

- `RESEND_API_KEY` = `re_Ae5gurSB_ExZtMRjDW5jniSjg2HjpofiK`
- `RESEND_FROM_EMAIL` = `InkFlow <noreply@votredomaine.com>` (optionnel)
- `SUPABASE_URL` = `https://votre-projet.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `votre_service_role_key`

**Pour Supabase** (si vous utilisez l'Edge Function) :

Dans Supabase Dashboard → Settings → Edge Functions → Secrets :

- `RESEND_API_KEY` = `re_Ae5gurSB_ExZtMRjDW5jniSjg2HjpofiK`
- `RESEND_FROM_EMAIL` = `InkFlow <noreply@votredomaine.com>` (optionnel)
- `SUPABASE_SERVICE_ROLE_KEY` = `votre_service_role_key`

## 🧪 Test de la Correction

### Test 1 : Vérifier que la fonction est déployée

**Vercel** :
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Votre projet → **Functions**
3. Vérifiez que `api/submit-project-request` apparaît

**Supabase** :
1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Votre projet → **Edge Functions**
3. Vérifiez que `submit-project-request` apparaît

### Test 2 : Tester l'envoi

1. Allez sur une page publique d'artiste
2. Cliquez sur "Projet personnalisé"
3. Remplissez le formulaire
4. Soumettez la demande
5. Vous devriez voir "Demande envoyée !" ✅

## 🔍 Vérifications

### Checklist Vercel

- [ ] Le fichier `api/submit-project-request.ts` existe
- [ ] Le projet est déployé sur Vercel
- [ ] La fonction apparaît dans Vercel → Functions
- [ ] Les variables d'environnement sont configurées
- [ ] Les logs Vercel ne montrent pas d'erreurs

### Checklist Supabase

- [ ] Le fichier `supabase/functions/submit-project-request/index.ts` existe
- [ ] L'Edge Function est déployée
- [ ] Les secrets sont configurés dans Supabase
- [ ] Les logs Supabase ne montrent pas d'erreurs

## 🆘 Dépannage

### Erreur "Route API non trouvée"

**Solution** :
1. Vérifiez que le projet est déployé sur Vercel
2. Vérifiez que `api/submit-project-request.ts` est dans le repository
3. Redéployez le projet si nécessaire
4. Vérifiez les logs Vercel pour les erreurs de build

### Erreur "Failed to send a request to the Edge Function"

**Solution** :
1. Vérifiez que l'Edge Function est déployée dans Supabase
2. Vérifiez que les secrets sont configurés
3. Vérifiez les logs Supabase pour les erreurs

### Erreur "Missing RESEND_API_KEY"

**Solution** :
1. Configurez `RESEND_API_KEY` dans Vercel ou Supabase
2. Redéployez après avoir ajouté la variable
3. Vérifiez que la clé est correcte

### L'envoi fonctionne mais l'email n'arrive pas

**Solution** :
1. Vérifiez `RESEND_API_KEY` dans Vercel/Supabase
2. Vérifiez les logs pour voir si l'email est envoyé
3. Vérifiez les spams
4. Vérifiez que `RESEND_FROM_EMAIL` est configuré (optionnel)

## 📋 Fichiers Concernés

- `api/submit-project-request.ts` - Route API Vercel
- `supabase/functions/submit-project-request/index.ts` - Edge Function Supabase
- `components/CustomProjectForm.tsx` - Formulaire client

## 📚 Ressources

- [Guide de déploiement Vercel](./DEPLOY_VERCEL_GUIDE.md)
- [Configuration Resend](./CONFIGURE_RESEND.md)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

**Status** : ✅ Corrigé - Le fallback vers Supabase Edge Function fonctionne maintenant automatiquement si la route API n'est pas disponible.
