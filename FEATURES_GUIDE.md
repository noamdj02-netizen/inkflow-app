# 🚀 Guide des Nouvelles Fonctionnalités - InkFlow

## ✅ Fonctionnalités Implémentées

### 1. 📸 Gestion des Flashs (CRUD Complet)

**Composant** : `components/FlashManagement.tsx`

**Fonctionnalités** :
- ✅ Créer un nouveau flash avec upload d'image
- ✅ Modifier un flash existant
- ✅ Supprimer un flash
- ✅ Afficher tous les flashs de l'artiste
- ✅ Gestion du statut (disponible, réservé, vendu)
- ✅ Gestion du stock (nombre de réservations possibles)

**Accès** : Dashboard → Onglet "Mes Flashs"

**Configuration requise** :
1. Exécuter `supabase/storage-setup.sql` dans Supabase SQL Editor
2. Créer le bucket `flash-images` dans Supabase Storage (si pas automatique)

### 2. 💳 Intégration Stripe

**Composants** :
- `components/StripePayment.tsx` - Composant de paiement
- `services/stripeService.ts` - Service Stripe

**Fonctionnalités** :
- ✅ Création de Payment Intent pour acomptes
- ✅ Interface de paiement Stripe Elements
- ✅ Confirmation de paiement
- ✅ Gestion des erreurs de paiement

**Configuration requise** :

1. **Créer un compte Stripe** : https://stripe.com
2. **Récupérer les clés API** :
   - Clé publique (Publishable Key) : `pk_test_...`
   - Clé secrète (Secret Key) : `sk_test_...` (pour le backend)

3. **Ajouter dans `.env.local`** :
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
   ```

4. **Créer les Edge Functions Supabase** (optionnel pour MVP) :
   - `/api/create-payment-intent` - Créer un Payment Intent
   - `/api/confirm-payment` - Confirmer un paiement

**Note** : Pour l'instant, les fonctions API sont simulées. Pour la production, créez des Supabase Edge Functions ou un backend Node.js.

### 3. 📤 Upload d'Images (Supabase Storage)

**Configuration** :

1. **Exécuter le script SQL** :
   - Ouvrez `supabase/storage-setup.sql`
   - Copiez-collez dans Supabase SQL Editor
   - Exécutez le script

2. **Créer le bucket manuellement** (si nécessaire) :
   - Allez dans Supabase Dashboard → Storage
   - Cliquez sur "New bucket"
   - Nom : `flash-images`
   - Public : ✅ Activé
   - Cliquez sur "Create bucket"

3. **Vérifier les politiques RLS** :
   - Les politiques sont créées automatiquement par le script SQL
   - Vérifiez dans Storage → Policies que les politiques existent

**Utilisation** :
- L'upload se fait automatiquement lors de la création/modification d'un flash
- Les images sont stockées dans `flash-images/{artist_id}/{timestamp}.{ext}`
- Les URLs publiques sont générées automatiquement

### 4. 📊 Dashboard avec Données Réelles

**Hook** : `hooks/useDashboardData.ts`

**Fonctionnalités** :
- ✅ Affichage des revenus totaux depuis Stripe
- ✅ Nombre de projets en attente
- ✅ Nombre de réservations à venir
- ✅ Nombre total de flashs
- ✅ Liste des projets en attente de validation
- ✅ Liste des réservations récentes

**Données affichées** :
- **Performance** : Revenus totaux depuis `stripe_transactions`
- **À Faire** : Projets avec statut `pending` depuis `projects`
- **Activité Récente** : Réservations à venir depuis `bookings`

### 5. 📧 Notifications (Emails/SMS)

**Service** : `services/notificationService.ts`

**Fonctionnalités** :
- ✅ Envoi d'emails de confirmation de réservation
- ✅ Envoi de rappels 48h avant le rendez-vous (cron)
- ✅ Support SMS (si numéro disponible)
- ✅ Mise à jour automatique du statut de rappel

**Configuration requise** :

#### Option A : Supabase Edge Functions (Recommandé)

1. **Edge Functions disponibles** :
   - `supabase/functions/send-email` (Resend)
   - `supabase/functions/send-appointment-reminders` (cron J-2)

2. **Configurer Resend pour les emails** :
   - Créer un compte sur https://resend.com
   - Récupérer la clé API
   - Secrets à ajouter dans Supabase (Edge Functions → Secrets) :
     - `RESEND_API_KEY`
     - `RESEND_FROM_EMAIL` (ex: `InkFlow <notifications@inkflow.app>`)
     - `SUPABASE_SERVICE_ROLE_KEY` (pour accéder à la BDD en mode service dans les functions)

3. **Configurer Twilio pour les SMS** :
   - Créer un compte sur https://twilio.com
   - Récupérer les credentials
   - Configurer dans les Edge Functions

4. **Planifier le rappel J-2 (48h)** :
   - Dans Supabase Dashboard → **Edge Functions** → **Schedules**
   - Créer un schedule sur `send-appointment-reminders` (ex: toutes les heures)

#### Option B : Services Externes Directs

Pour le développement, les notifications sont loggées dans la console.
Pour la production, configurez les Edge Functions ou utilisez directement les APIs.

**Fonctions disponibles** :
- `sendBookingConfirmation(bookingId)` - Confirmation de réservation
- `sendBookingReminder(bookingId)` - Rappel (logique côté client, mais en prod on privilégie le cron `send-appointment-reminders`)

## 🔧 Configuration Complète

### Étape 1 : Supabase Storage

```sql
-- Exécuter supabase/storage-setup.sql dans Supabase SQL Editor
```

### Étape 2 : Variables d'Environnement

Ajoutez dans `.env.local` :

```env
# Supabase (déjà configuré)
VITE_SUPABASE_URL=https://jnrprkdueseahfrguhvt.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique

# Gemini AI (déjà configuré)
VITE_GEMINI_API_KEY=votre_cle
```

### Étape 3 : Redémarrer le Serveur

```bash
npm run dev
```

## 📝 Utilisation

### Créer un Flash

1. Dashboard → "Mes Flashs"
2. Cliquer sur "Nouveau Flash"
3. Uploader une image
4. Remplir les informations (titre, prix, durée, etc.)
5. Cliquer sur "Créer"

### Gérer les Paiements

1. Lorsqu'un client réserve un flash, le composant `StripePayment` s'affiche
2. Le client entre ses informations de carte
3. Le paiement de l'acompte est traité via Stripe
4. La réservation est confirmée automatiquement

### Voir les Statistiques

Le dashboard affiche automatiquement :
- Revenus totaux
- Projets en attente
- Réservations à venir
- Nombre de flashs

## 🐛 Dépannage

### Erreur : "Bucket not found"

**Solution** : Créez le bucket `flash-images` dans Supabase Storage manuellement.

### Erreur : "Stripe not configured"

**Solution** : Ajoutez `VITE_STRIPE_PUBLISHABLE_KEY` dans `.env.local` et redémarrez le serveur.

### Erreur : "Permission denied" lors de l'upload

**Solution** : Vérifiez que les politiques RLS du bucket sont correctement configurées (voir `storage-setup.sql`).

### Les notifications ne s'envoient pas

**Solution** : Pour le développement, vérifiez la console. Pour la production, configurez les Edge Functions Supabase.

## 🚀 Prochaines Étapes

1. **Créer les Edge Functions Supabase** pour Stripe et Notifications
2. **Configurer Resend/Twilio** pour les notifications réelles
3. **Ajouter Stripe Connect** pour gérer les comptes multi-artistes
4. **Implémenter les webhooks Stripe** pour mettre à jour automatiquement les statuts
5. **Ajouter un système de planning** avec sélection de créneaux

---

**✅ Toutes les fonctionnalités de base sont maintenant implémentées !**

