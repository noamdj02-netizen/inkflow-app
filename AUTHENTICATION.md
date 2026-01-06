# 🔐 Système d'Authentification InkFlow

## ✅ Fonctionnalités Implémentées

### 1. Authentification Supabase Auth
- ✅ Inscription (Sign Up) avec email/password
- ✅ Connexion (Login) avec email/password
- ✅ Déconnexion (Sign Out)
- ✅ Hook `useAuth` pour gérer l'état d'authentification
- ✅ Persistance de session automatique

### 2. Pages d'Authentification
- ✅ `/login` - Page de connexion
- ✅ `/register` - Page d'inscription
- ✅ Design cohérent avec le thème sombre/gold
- ✅ Validation des formulaires
- ✅ Gestion des erreurs

### 3. Onboarding (Création du Profil Artiste)
- ✅ `/onboarding` - Page de création du profil
- ✅ Saisie du nom de studio
- ✅ Génération automatique du slug depuis le nom
- ✅ Vérification en temps réel de la disponibilité du slug
- ✅ Création de l'entrée dans la table `artists` liée à `auth.uid`
- ✅ Redirection automatique si profil déjà existant

### 4. Page Publique Dynamique (Vitrine)
- ✅ `/p/:slug` - Route dynamique pour chaque artiste
- ✅ Récupération des infos artiste depuis Supabase
- ✅ Affichage des flashs disponibles de l'artiste
- ✅ Page 404 si l'artiste n'existe pas
- ✅ Design responsive et moderne

### 5. Protection des Routes
- ✅ Composant `ProtectedRoute` pour protéger les routes
- ✅ `/dashboard` protégé (redirection vers `/login` si non connecté)
- ✅ `/onboarding` protégé
- ✅ Écran de chargement pendant la vérification d'auth

### 6. Navigation
- ✅ React Router DOM configuré
- ✅ Routes publiques et protégées
- ✅ Redirections automatiques
- ✅ Navigation depuis les composants

## 🗂️ Structure des Fichiers

```
components/
├── LoginPage.tsx          # Page de connexion
├── RegisterPage.tsx        # Page d'inscription
├── OnboardingPage.tsx      # Création du profil artiste
├── PublicArtistPage.tsx    # Vitrine publique /p/:slug
├── ProtectedRoute.tsx     # Composant de protection des routes
└── ArtistDashboard.tsx    # Dashboard (mis à jour avec déconnexion)

hooks/
└── useAuth.ts             # Hook d'authentification

App.tsx                    # Configuration des routes
```

## 🔄 Flux d'Utilisateur

### Inscription d'un Nouveau Tatoueur

1. **Inscription** (`/register`)
   - Saisie email + mot de passe
   - Validation du mot de passe (min 6 caractères)
   - Création du compte Supabase Auth

2. **Onboarding** (`/onboarding`)
   - Saisie du nom de studio
   - Génération automatique du slug
   - Vérification de disponibilité en temps réel
   - Création de l'entrée dans `artists` table

3. **Dashboard** (`/dashboard`)
   - Accès au dashboard protégé
   - Gestion des flashs, projets, réservations

### Connexion d'un Tatoueur Existant

1. **Login** (`/login`)
   - Saisie email + mot de passe
   - Connexion Supabase Auth
   - Redirection vers `/dashboard`

### Accès Public (Client)

1. **Vitrine** (`/p/:slug`)
   - Accès public sans authentification
   - Affichage des flashs disponibles
   - Informations de l'artiste

## 🔐 Sécurité

### Row Level Security (RLS)

Les politiques RLS dans Supabase garantissent que :
- Un artiste ne peut voir/modifier que ses propres données
- Les flashs sont publics en lecture
- Les projets sont privés (artiste uniquement)

### Protection des Routes

Le composant `ProtectedRoute` vérifie :
- Si l'utilisateur est authentifié
- Redirige vers `/login` si non authentifié
- Affiche un loader pendant la vérification

## 📝 Routes Disponibles

| Route | Accès | Description |
|-------|-------|-------------|
| `/` | Public | Landing page marketing |
| `/login` | Public | Page de connexion |
| `/register` | Public | Page d'inscription |
| `/onboarding` | Protégé | Création du profil artiste |
| `/dashboard` | Protégé | Dashboard tatoueur |
| `/p/:slug` | Public | Vitrine publique de l'artiste |
| `/client` | Public | Démo client (choix flash/projet) |
| `/flashs` | Public | Galerie flashs (démo) |
| `/project` | Public | Formulaire projet perso (démo) |

## 🧪 Test de l'Authentification

### 1. Créer un Compte

1. Aller sur `/register`
2. Entrer un email et mot de passe (min 6 caractères)
3. Cliquer sur "Créer mon compte"
4. Vous serez redirigé vers `/onboarding`

### 2. Créer le Profil

1. Entrer un nom de studio (ex: "Zonett Ink")
2. Le slug sera généré automatiquement (ex: "zonett_ink")
3. Vérifier que le slug est disponible (icône verte)
4. Cliquer sur "Créer mon profil"
5. Vous serez redirigé vers `/dashboard`

### 3. Voir la Vitrine Publique

1. Aller sur `/p/zonett_ink` (remplacer par votre slug)
2. Vous devriez voir la page publique avec les flashs

### 4. Se Déconnecter

1. Dans le dashboard, cliquer sur "Déconnexion" dans la sidebar
2. Vous serez redirigé vers `/login`

## 🔧 Configuration Requise

### Variables d'Environnement

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

### Base de Données

Le schéma SQL doit être exécuté dans Supabase (voir `supabase/schema.sql`).

## 🐛 Dépannage

### Erreur : "Missing Supabase environment variables"

**Solution** : Vérifiez que `.env.local` contient bien `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

### Erreur : "relation does not exist"

**Solution** : Exécutez le schéma SQL dans Supabase (voir `supabase/schema.sql`)

### Erreur : "new row violates row-level security policy"

**Solution** : Vérifiez que les politiques RLS sont correctement configurées dans Supabase

### Le slug n'est pas disponible alors qu'il devrait l'être

**Solution** : Vérifiez dans Supabase Table Editor qu'il n'y a pas déjà un artiste avec ce slug

## 🚀 Prochaines Étapes

- [ ] Ajouter la réinitialisation de mot de passe
- [ ] Ajouter l'authentification OAuth (Google, Instagram)
- [ ] Ajouter la vérification d'email
- [ ] Améliorer la gestion des erreurs
- [ ] Ajouter des tests d'authentification

---

**✅ Le système d'authentification est maintenant fonctionnel !**

