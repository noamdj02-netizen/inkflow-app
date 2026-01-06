# 🏗️ Architecture InkFlow - Documentation Technique

## Vue d'ensemble

InkFlow est une application SaaS construite avec **React + TypeScript** en frontend et **Supabase** comme Backend-as-a-Service (BaaS) pour la base de données PostgreSQL et l'authentification.

## 📁 Structure du Projet

```
tatoo/
├── components/           # Composants React UI
│   ├── LandingPage.tsx
│   ├── ArtistDashboard.tsx
│   ├── ClientHome.tsx
│   ├── FlashGallery.tsx
│   └── CustomProjectForm.tsx
│
├── services/            # Services externes
│   ├── supabase.ts      # Client Supabase configuré
│   └── geminiService.ts # Service d'analyse IA Gemini
│
├── hooks/              # Hooks React personnalisés
│   └── useFlashs.ts    # Hook pour récupérer les flashs
│
├── types/              # Types TypeScript
│   ├── supabase.ts     # Types générés pour Supabase
│   └── types.ts        # Types UI et helpers
│
├── supabase/           # Configuration Supabase
│   ├── schema.sql      # Schéma de base de données
│   └── README.md       # Documentation Supabase
│
├── examples/           # Exemples de code
│   └── supabase-usage.ts
│
├── App.tsx             # Composant racine
├── index.tsx           # Point d'entrée
└── vite.config.ts      # Configuration Vite
```

## 🗄️ Architecture Base de Données

### Tables Principales

1. **`artists`** - Informations des tatoueurs
   - `id`, `email`, `nom_studio`, `slug_profil`
   - `stripe_account_id`, `deposit_percentage`
   - Configuration UI (`accent_color`, `bio_instagram`)

2. **`flashs`** - Designs prêts à tatouer
   - `id`, `artist_id`, `title`, `image_url`
   - `prix` (en centimes), `duree_minutes`
   - `statut`, `stock_limit`, `stock_current`

3. **`projects`** - Demandes de projets personnalisés
   - Informations client et projet
   - Analyse IA (`ai_estimated_hours`, `ai_complexity_score`)
   - Validation artiste (`statut`, `artist_quoted_price`)

4. **`bookings`** - Réservations de rendez-vous
   - Lien vers `flash_id` OU `project_id`
   - Informations paiement Stripe
   - Statuts (`statut_paiement`, `statut_booking`)

5. **`stripe_transactions`** - Historique des transactions

### Relations

```
artists (1) ──< (N) flashs
artists (1) ──< (N) projects
artists (1) ──< (N) bookings
flashs (1) ──< (N) bookings
projects (1) ──< (N) bookings
```

## 🔐 Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des politiques :

- **Artists** : Seul l'artiste peut voir/modifier ses données
- **Flashs** : Lecture publique, modification par propriétaire uniquement
- **Projects** : Visibles uniquement par l'artiste propriétaire
- **Bookings** : Visibles uniquement par l'artiste propriétaire

### Authentification

- **Actuellement** : Non configuré (à faire)
- **Recommandé** : Supabase Auth avec email/password ou OAuth (Google, Instagram)

## 🔄 Flux de Données

### 1. Lecture des Flashs (Public)

```
Client → Frontend → Supabase Client → PostgreSQL
                    ↓
                 RLS Policy (lecture publique)
                    ↓
                 Retour des flashs disponibles
```

### 2. Création d'un Projet

```
Client → CustomProjectForm → Gemini API (analyse IA)
                            ↓
                         Supabase (insert project)
                            ↓
                         Artist Dashboard (notification)
```

### 3. Réservation avec Paiement

```
Client → FlashGallery → Stripe Payment Intent
                       ↓
                    Supabase (create booking)
                       ↓
                    Webhook Stripe → Update booking status
```

## 🛠️ Services

### Supabase Client (`services/supabase.ts`)

```typescript
import { supabase } from './services/supabase';

// Lecture
const { data } = await supabase.from('flashs').select('*');

// Écriture (nécessite auth)
const { data } = await supabase.from('projects').insert({...});
```

### Gemini Service (`services/geminiService.ts`)

Analyse les projets personnalisés pour estimer :
- Temps nécessaire
- Score de complexité (1-10)
- Fourchette de prix
- Notes techniques

## 📦 Hooks React

### `useFlashs(artistSlug?)`

Récupère les flashs disponibles avec :
- Abonnement temps réel aux changements
- Filtrage par artiste (optionnel)
- Conversion automatique vers format UI

```typescript
const { flashs, loading, error } = useFlashs('zonett_ink');
```

## 🚀 Déploiement

### Frontend
- **Vite Build** : `npm run build`
- **Hébergement** : Vercel, Netlify, ou Cloudflare Pages

### Backend (Supabase)
- **Hébergé** : Supabase Cloud (gratuit jusqu'à 500MB)
- **Migrations** : Via SQL Editor ou CLI Supabase

## 🔮 Prochaines Étapes

1. ✅ Schéma SQL créé
2. ✅ Client Supabase configuré
3. ⏳ Authentification Supabase Auth
4. ⏳ Intégration Stripe (Edge Functions)
5. ⏳ Upload d'images (Supabase Storage)
6. ⏳ Notifications email/SMS

## 📚 Ressources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Connect](https://stripe.com/docs/connect)

