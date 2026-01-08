# 🔧 Résolution de l'erreur "Failed to send a request to the Edge Function"

## ❌ Erreur
```
Failed to send a request to the Edge Function
```

Cette erreur apparaît lors de la tentative de réservation d'un flash, quand l'application essaie d'appeler l'Edge Function Supabase pour créer une session Stripe Checkout.

## 🔍 Causes Possibles

### 1. Edge Function non déployée
L'Edge Function `create-checkout-session` n'est pas déployée sur votre projet Supabase.

**Solution :**
1. Installez Supabase CLI :
   ```bash
   npm install -g supabase
   ```

2. Connectez-vous :
   ```bash
   supabase login
   ```

3. Liez votre projet :
   ```bash
   supabase link --project-ref votre-project-ref
   ```

4. Déployez l'Edge Function :
   ```bash
   supabase functions deploy create-checkout-session
   ```

### 2. Variables d'environnement manquantes
Les secrets nécessaires ne sont pas configurés dans Supabase.

**Solution :**
1. Allez dans Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
2. Ajoutez les secrets suivants :
   - `STRIPE_SECRET_KEY` : Votre clé secrète Stripe (sk_test_...)
   - `SITE_URL` : URL de votre site (ex: `http://localhost:5173`)

### 3. Configuration Supabase incorrecte
Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` ne sont pas correctement configurées.

**Solution :**
1. Vérifiez votre fichier `.env.local` :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_anon_key
   ```

2. Redémarrez le serveur de développement après modification :
   ```bash
   npm run dev
   ```

### 4. Problème de CORS
L'Edge Function bloque les requêtes depuis votre domaine.

**Solution :**
L'Edge Function inclut déjà les headers CORS. Si le problème persiste, vérifiez que :
- L'URL de votre site correspond à celle configurée dans `SITE_URL`
- Les headers CORS sont correctement définis dans l'Edge Function

## 🧪 Test de l'Edge Function

Pour tester si l'Edge Function fonctionne :

1. Allez dans Supabase Dashboard → **Edge Functions**
2. Cliquez sur `create-checkout-session`
3. Utilisez l'onglet "Invoke" pour tester avec un payload :
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

## 📝 Vérification Rapide

✅ Checklist :
- [ ] Edge Function `create-checkout-session` est déployée
- [ ] Secret `STRIPE_SECRET_KEY` est configuré dans Supabase
- [ ] Secret `SITE_URL` est configuré dans Supabase
- [ ] Variables `.env.local` sont correctes
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Connexion internet fonctionne

## 🔄 Solution Temporaire (Mode Développement)

Si vous êtes en développement et que l'Edge Function n'est pas encore déployée, vous pouvez temporairement désactiver la redirection Stripe et afficher un message informatif.

**Note :** Cette solution est uniquement pour le développement. En production, l'Edge Function doit être déployée.

