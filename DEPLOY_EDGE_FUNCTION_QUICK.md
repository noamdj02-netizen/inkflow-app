# ⚡ Déploiement Rapide de l'Edge Function - Guide Étape par Étape

## 🎯 Solution la Plus Simple : Dashboard Supabase

### 📋 Étape 1 : Accéder au Dashboard
1. Ouvrez [https://app.supabase.com](https://app.supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet

### 📋 Étape 2 : Créer l'Edge Function
1. Dans le menu de gauche, cliquez sur **"Edge Functions"**
2. Cliquez sur **"Create a new function"** (bouton en haut à droite)
3. **Nom de la fonction** : `create-checkout-session`
4. Cliquez sur **"Create function"**

### 📋 Étape 3 : Copier le Code
1. Dans votre projet local, ouvrez le fichier :
   ```
   supabase/functions/create-checkout-session/index.ts
   ```
2. **Sélectionnez TOUT le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. Dans le dashboard Supabase, **collez** le code dans l'éditeur
5. Cliquez sur **"Deploy"** (en haut à droite)

### 📋 Étape 4 : Configurer les Secrets Stripe
1. Dans le dashboard Supabase, allez dans **Settings** (icône engrenage en bas à gauche)
2. Cliquez sur **"Edge Functions"** dans le menu
3. Cliquez sur l'onglet **"Secrets"**
4. Ajoutez les secrets suivants :

   **Secret 1 :**
   - **Name** : `STRIPE_SECRET_KEY`
   - **Value** : Votre clé secrète Stripe (commence par `sk_test_...` ou `sk_live_...`)
   - Cliquez sur **"Add secret"**

   **Secret 2 :**
   - **Name** : `SITE_URL`
   - **Value** : `http://localhost:5173` (pour le développement)
   - Cliquez sur **"Add secret"**

### 📋 Étape 5 : Tester la Fonction
1. Retournez dans **Edge Functions**
2. Cliquez sur `create-checkout-session`
3. Allez dans l'onglet **"Invoke"**
4. Dans le champ **"Request body"**, collez ce JSON :
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
5. Cliquez sur **"Invoke"**
6. ✅ Si vous voyez une réponse avec `sessionId` et `url`, c'est bon !

---

## 🔑 Où Trouver votre Clé Stripe ?

1. Allez sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Connectez-vous
3. Allez dans **Developers** → **API keys**
4. Copiez la **Secret key** (commence par `sk_test_...` pour le mode test)

---

## ✅ Vérification Finale

Une fois déployée, testez une réservation dans votre application :
1. Allez sur une page de flash
2. Cliquez sur **"Réserver"**
3. Remplissez le formulaire
4. Cliquez sur **"Confirmer la réservation"**
5. ✅ Vous devriez être redirigé vers Stripe Checkout (plus d'erreur !)

---

## 🆘 Si ça ne fonctionne toujours pas

Vérifiez :
- ✅ L'Edge Function est bien déployée (visible dans la liste)
- ✅ Les secrets `STRIPE_SECRET_KEY` et `SITE_URL` sont bien configurés
- ✅ Votre clé Stripe est valide (mode test ou live)
- ✅ Les variables `.env.local` sont correctes et le serveur a été redémarré

