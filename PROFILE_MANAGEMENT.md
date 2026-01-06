# 👤 Gestion du Profil Utilisateur - InkFlow

## ✅ Fonctionnalités Implémentées

### 1. Contexte Global du Profil (`ArtistProfileContext`)

**Fichier** : `contexts/ArtistProfileContext.tsx`

**Fonctionnalités** :
- ✅ Récupération automatique du profil artiste depuis la table `artists`
- ✅ Stockage global accessible dans toute l'application
- ✅ Fonction `refreshProfile()` pour mettre à jour les données
- ✅ Fonction `updateProfile()` pour modifier le profil
- ✅ Gestion de l'état de chargement
- ✅ Gestion des erreurs

**Utilisation** :
```typescript
import { useArtistProfile } from '../contexts/ArtistProfileContext';

const { profile, loading, updateProfile } = useArtistProfile();
// profile contient : nom_studio, slug_profil, bio_instagram, etc.
```

### 2. Persistance de Session Supabase

**Configuration** : Déjà activée dans `services/supabase.ts`

**Fonctionnalités** :
- ✅ Session persistante automatique (localStorage)
- ✅ Refresh automatique du token
- ✅ Vérification de session au chargement de l'app
- ✅ Gestion de l'état `loading` pour éviter les redirections prématurées

**Comportement** :
- L'utilisateur reste connecté même après un refresh de page
- La session est vérifiée avant toute redirection
- Le hook `useAuth` gère automatiquement le refresh du token

### 3. Page de Réglages (`/settings`)

**Fichier** : `components/SettingsPage.tsx`

**Fonctionnalités** :
- ✅ Modification du nom du studio
- ✅ Modification de la bio Instagram
- ✅ Upload d'avatar (photo de profil)
- ✅ Modification de la couleur d'accentuation
- ✅ Modification du pourcentage d'acompte
- ✅ Affichage des informations en lecture seule (email, slug)
- ✅ Sauvegarde avec feedback visuel (succès/erreur)
- ✅ Validation des champs

**Accès** : Dashboard → Paramètres (sidebar) ou `/settings`

## 🔧 Configuration

### Étape 1 : Vérifier la Persistance de Session

La persistance est déjà configurée dans `services/supabase.ts` :
```typescript
auth: {
  persistSession: true,  // ✅ Activé
  autoRefreshToken: true, // ✅ Activé
}
```

### Étape 2 : Utiliser le Contexte dans l'App

Le contexte est déjà intégré dans `App.tsx` :
```typescript
<ArtistProfileProvider>
  {/* Routes */}
</ArtistProfileProvider>
```

### Étape 3 : Accéder au Profil dans les Composants

```typescript
import { useArtistProfile } from '../contexts/ArtistProfileContext';

const MyComponent = () => {
  const { profile, loading, updateProfile } = useArtistProfile();
  
  if (loading) return <div>Chargement...</div>;
  if (!profile) return <div>Pas de profil</div>;
  
  return <div>{profile.nom_studio}</div>;
};
```

## 📝 Utilisation

### Modifier le Profil

1. **Accéder aux réglages** :
   - Dashboard → Cliquer sur "Paramètres" dans la sidebar
   - Ou aller directement sur `/settings`

2. **Modifier les informations** :
   - Nom du studio
   - Bio Instagram (max 150 caractères)
   - Couleur d'accentuation
   - Pourcentage d'acompte
   - Avatar (upload d'image)

3. **Sauvegarder** :
   - Cliquer sur "Sauvegarder les modifications"
   - Un message de succès s'affiche
   - Les modifications sont immédiatement visibles

4. **Vérifier la persistance** :
   - Rafraîchir la page (F5)
   - Les modifications sont toujours là ✅

### Accéder au Profil dans le Code

```typescript
// Dans n'importe quel composant
const { profile } = useArtistProfile();

console.log(profile?.nom_studio); // "Zonett Ink"
console.log(profile?.slug_profil); // "zonett_ink"
console.log(profile?.bio_instagram); // "Tatoueur Lyon..."
```

## 🔄 Flux de Données

```
User se connecte
    ↓
useAuth détecte la session
    ↓
ArtistProfileProvider charge le profil depuis artists table
    ↓
Profil stocké dans le contexte global
    ↓
Tous les composants peuvent accéder au profil via useArtistProfile()
    ↓
Modification dans SettingsPage
    ↓
updateProfile() met à jour Supabase
    ↓
Contexte mis à jour automatiquement
    ↓
Tous les composants voient les nouvelles données
```

## 🎯 Avantages

1. **Performance** : Le profil n'est chargé qu'une fois au démarrage
2. **Cohérence** : Toutes les pages voient les mêmes données
3. **Simplicité** : Un seul hook pour accéder au profil
4. **Réactivité** : Mise à jour automatique dans tous les composants

## 🐛 Dépannage

### Le profil ne se charge pas

**Vérifications** :
1. L'utilisateur est-il connecté ? (`useAuth().user`)
2. Le profil existe-t-il dans la table `artists` ?
3. Y a-t-il des erreurs dans la console ?

**Solution** : Vérifiez que l'onboarding a été complété.

### Les modifications ne persistent pas

**Vérifications** :
1. Y a-t-il des erreurs lors de la sauvegarde ?
2. Les politiques RLS permettent-elles la mise à jour ?
3. L'utilisateur est-il bien le propriétaire du profil ?

**Solution** : Vérifiez les politiques RLS dans Supabase.

### Le contexte retourne `null`

**Cause** : Le profil n'existe pas encore (onboarding non complété)

**Solution** : Rediriger vers `/onboarding` pour créer le profil.

## 📚 Prochaines Améliorations

- [ ] Ajouter `avatar_url` dans le schéma SQL
- [ ] Afficher l'avatar dans le dashboard
- [ ] Ajouter la modification du mot de passe
- [ ] Ajouter la modification de l'email (avec confirmation)
- [ ] Historique des modifications du profil

---

**✅ La gestion du profil utilisateur est maintenant complète et sécurisée !**

