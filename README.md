<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎨 InkFlow - Smart Tattoo Booking SaaS

**La première plateforme tout-en-un pour tatoueurs.** Réservations de flashs instantanées, filtrage intelligent de projets perso avec IA, et sécurisation des acomptes via Stripe. Zéro No-Show.

## ✨ Fonctionnalités

### Pour les Tatoueurs
- 📅 **Calendrier intelligent** : Gestion visuelle de votre agenda avec créneaux disponibles
- ⚡ **Galerie Flashs** : Upload et gestion de vos designs prêts à tatouer
- 🎯 **Filtrage IA** : Analyse automatique des demandes de projets personnalisés
- 💳 **Acomptes Stripe** : Sécurisation des revenus avant même de commencer
- 📊 **Dashboard Analytics** : Suivi de vos revenus et performances
- ⚙️ **Configuration flexible** : Personnalisez vos règles (acompte %, couleurs, etc.)

### Pour les Clients
- 🖼️ **Galerie Flashs** : Parcourez et réservez instantanément
- ✍️ **Formulaire Projet Perso** : Décrivez votre idée et obtenez une estimation IA
- 📱 **Mobile First** : Interface optimisée pour mobile (Instagram → Réservation)

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- Un compte [Supabase](https://supabase.com) (gratuit)
- Une clé API Gemini ([obtenir ici](https://aistudio.google.com/app/apikey)) - Optionnel pour l'analyse IA

### Installation

1. **Cloner le repository**
   ```bash
   git clone <your-repo-url>
   cd tatoo
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Supabase**
   
   a. Créez un projet sur [Supabase](https://supabase.com)
   
   b. Dans le SQL Editor de Supabase, exécutez le script `supabase/schema.sql`
   
   c. Récupérez vos clés dans **Settings** → **API** :
      - Project URL
      - anon/public key

4. **Configurer les variables d'environnement**
   
   Créer un fichier `.env.local` à la racine :
   ```env
   # Supabase (Obligatoire)
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
   
   # Gemini AI (Optionnel - pour l'analyse IA)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

5. **Ouvrir dans le navigateur**
   
   L'application sera disponible sur `http://localhost:3000`

## 🏗️ Architecture

```
tatoo/
├── components/          # Composants React
│   ├── LandingPage.tsx      # Page marketing
│   ├── ArtistDashboard.tsx # Dashboard tatoueur
│   ├── ClientHome.tsx       # Accueil client
│   ├── FlashGallery.tsx    # Galerie flashs
│   └── CustomProjectForm.tsx # Formulaire projet perso
├── services/           # Services externes
│   └── geminiService.ts     # Intégration Gemini AI
├── types.ts            # Types TypeScript
├── App.tsx             # Composant racine
└── index.tsx           # Point d'entrée
```

## 🛠️ Stack Technique

### Frontend
- **Framework** : React 19 + TypeScript
- **Build** : Vite 6
- **Styling** : Tailwind CSS (via CDN)
- **Charts** : Recharts
- **Icons** : Lucide React

### Backend (BaaS)
- **Database** : PostgreSQL via Supabase
- **Auth** : Supabase Auth (à configurer)
- **Storage** : Supabase Storage (pour les images)

### Services Externes
- **AI** : Google Gemini 1.5 Pro (analyse de projets)
- **Paiements** : Stripe Connect (à intégrer)

## 📋 Roadmap

Consultez [ROADMAP.md](./ROADMAP.md) pour voir les fonctionnalités à venir et les prochaines étapes de développement.

### Prochaines étapes prioritaires :
1. 🔐 Backend API (sécurisation des clés API)
2. 💳 Intégration Stripe complète
3. 💾 Base de données (PostgreSQL/MongoDB)
4. 🔑 Authentification (JWT/NextAuth)
5. 📧 Notifications email/SMS

## ⚠️ Notes Importantes

### Configuration Supabase
1. **Schéma SQL** : Exécutez `supabase/schema.sql` dans le SQL Editor de Supabase
2. **RLS** : Row Level Security est activé pour sécuriser les données
3. **Auth** : L'authentification Supabase doit être configurée (voir [supabase/README.md](./supabase/README.md))

### Sécurité API Gemini
**Actuellement**, la clé API Gemini est utilisée côté client. Pour la production, il est **fortement recommandé** de :
1. Créer une Supabase Edge Function
2. Stocker la clé API côté serveur uniquement
3. Appeler la fonction depuis le frontend

### État du Projet
Ce projet est en **phase MVP (Minimum Viable Product)**. Les fonctionnalités principales sont implémentées côté frontend, mais nécessitent un backend pour être pleinement fonctionnelles en production.

## 📖 Documentation

- [Roadmap détaillée](./ROADMAP.md) - Plan de développement complet
- [Types TypeScript](./types.ts) - Définitions des types

## 🎯 Cas d'Usage

### Scénario 1 : Réservation Flash
1. Client visite la galerie flashs
2. Sélectionne un design disponible
3. Clique sur "Réserver"
4. Paie l'acompte (30%) via Stripe
5. Le créneau est automatiquement bloqué dans le calendrier

### Scénario 2 : Projet Personnalisé
1. Client remplit le formulaire multi-étapes
2. Upload d'images de référence
3. L'IA analyse et estime le projet (prix, temps, complexité)
4. Le dossier est envoyé au tatoueur pour validation
5. Le tatoueur accepte/refuse avec devis personnalisé
6. Si accepté, le client paie l'acompte et réserve un créneau

## 🤝 Contribution

Ce projet est actuellement en développement actif. Les contributions sont les bienvenues !

## 📄 Licence

Propriétaire - Tous droits réservés © 2024 InkFlow SaaS

---

**Développé avec ❤️ pour les artistes tatoueurs**
