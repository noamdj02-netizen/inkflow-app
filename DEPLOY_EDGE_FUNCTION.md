# 🚀 Déploiement de l'Edge Function Supabase

## Option 1 : Via le Dashboard Supabase (Recommandé - Plus Simple)

### Étape 1 : Accéder aux Edge Functions
1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **"Edge Functions"**

### Étape 2 : Créer la fonction
1. Cliquez sur **"Create a new function"**
2. Nom de la fonction : `create-checkout-session`
3. Cliquez sur **"Create function"**

### Étape 3 : Copier le code
1. Ouvrez le fichier `supabase/functions/create-checkout-session/index.ts` dans votre éditeur
2. Copiez **TOUT** le contenu
3. Collez-le dans l'éditeur de code du dashboard Supabase
4. Cliquez sur **"Deploy"**

### Étape 4 : Configurer les secrets
1. Dans le dashboard Supabase, allez dans **Settings** → **Edge Functions** → **Secrets**
2. Ajoutez les secrets suivants :
   - **Name** : `STRIPE_SECRET_KEY`
     **Value** : Votre clé secrète Stripe (sk_test_...)
   
   - **Name** : `SITE_URL`
     **Value** : `http://localhost:5173` (ou votre URL de production)

3. Cliquez sur **"Save"** pour chaque secret

### Étape 5 : Tester
1. Dans Edge Functions, cliquez sur `create-checkout-session`
2. Allez dans l'onglet **"Invoke"**
3. Utilisez ce payload de test :
   ```json
   {
     "amount": 3000,
     "flash_title": "Test Flash",
     "client_email": "test@example.com",
     "client_name": "Test Client",
     "booking_id": "test-booking-id",
     "artist_id": "test-artist-id",
     "success_url": "http://localhost:5173/payment/success",
     "cancel_url": "http://localhost:5173/payment/cancel"
   }
   ```
4. Cliquez sur **"Invoke"**
5. Vous devriez recevoir une réponse avec `sessionId` et `url`

---

## Option 2 : Via npx (Sans installation globale)

Si vous préférez utiliser la ligne de commande :

```bash
# Se connecter à Supabase
npx supabase login

# Lier votre projet (remplacez YOUR_PROJECT_REF par votre project ref)
npx supabase link --project-ref YOUR_PROJECT_REF

# Déployer l'Edge Function
npx supabase functions deploy create-checkout-session
```

**Trouver votre Project Ref :**
- Allez dans Supabase Dashboard → **Settings** → **General**
- Le **Reference ID** est votre project ref

---

## Option 3 : Installer Supabase CLI (Windows)

### Via Scoop (Recommandé)
```powershell
# Installer Scoop si pas déjà fait
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Installer Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Via Téléchargement direct
1. Allez sur [https://github.com/supabase/cli/releases](https://github.com/supabase/cli/releases)
2. Téléchargez `supabase_windows_amd64.zip`
3. Extrayez le fichier `supabase.exe`
4. Ajoutez-le à votre PATH ou utilisez-le directement

---

## ✅ Vérification

Une fois déployée, l'Edge Function devrait être accessible et l'erreur "Failed to send a request to the Edge Function" devrait disparaître.

**Note :** Après le déploiement, testez une réservation pour vérifier que tout fonctionne correctement.

