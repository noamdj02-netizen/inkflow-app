# 🗄️ Configuration Supabase pour InkFlow

Ce dossier contient le schéma de base de données et la documentation pour l'intégration Supabase.

## 📋 Prérequis

1. Créer un compte sur [Supabase](https://supabase.com)
2. Créer un nouveau projet
3. Noter votre **Project URL** et **anon/public key**

## 🚀 Installation

### 1. Créer le schéma de base de données

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `schema.sql`
4. Exécutez le script SQL

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici

# Gemini AI (optionnel)
VITE_GEMINI_API_KEY=votre_cle_gemini_ici
```

### 3. Récupérer vos clés Supabase

Dans votre dashboard Supabase :
- **Project URL** → `VITE_SUPABASE_URL`
- **Settings** → **API** → **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 🔐 Row Level Security (RLS)

Le schéma SQL active RLS sur toutes les tables avec les politiques suivantes :

- **Artists** : Seul l'artiste peut voir/modifier ses propres données
- **Flashs** : Lecture publique, modification uniquement par l'artiste propriétaire
- **Projects** : Visibles uniquement par l'artiste propriétaire
- **Bookings** : Visibles uniquement par l'artiste propriétaire
- **Stripe Transactions** : Visibles uniquement par l'artiste propriétaire

## 📊 Structure des Tables

### `artists`
Informations des tatoueurs inscrits sur la plateforme.

### `flashs`
Designs prêts à tatouer avec prix, durée, stock.

### `projects`
Demandes de projets personnalisés avec analyse IA.

### `bookings`
Réservations de rendez-vous (flashs ou projets).

### `stripe_transactions`
Historique des transactions Stripe pour tracking.

## 🔧 Fonctions SQL Utiles

### `get_available_slots(artist_id, date_debut, date_fin)`
Retourne les créneaux disponibles d'un artiste sur une période donnée.

## 🧪 Données de Test

Le schéma inclut des INSERT de test commentés. Décommentez-les pour créer des données de développement.

## 📝 Prochaines Étapes

1. ✅ Schéma créé
2. ⏳ Configurer l'authentification Supabase Auth
3. ⏳ Créer les fonctions API (Edge Functions) pour Stripe
4. ⏳ Implémenter les hooks React pour les données Supabase

## 🔗 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

