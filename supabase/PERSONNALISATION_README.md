# Personnalisation de la Page Publique

## Fonctionnalités

Les artistes peuvent maintenant personnaliser leur page publique avec :
1. **Upload d'avatar** : Photo de profil personnalisée
2. **5 thèmes de couleur** : Gold, Blood, Ocean, Nature, Lavender

## Migrations SQL à appliquer

### 1. Créer le bucket 'avatars' et les politiques RLS

Exécutez le script `storage-setup.sql` dans l'éditeur SQL de Supabase. Ce script :
- Crée le bucket `avatars` (publique)
- Configure les politiques RLS pour l'upload/suppression d'avatars

### 2. Ajouter les colonnes theme_color et avatar_url

Exécutez le script `migration-add-theme-avatar.sql` dans l'éditeur SQL de Supabase. Ce script :
- Ajoute la colonne `theme_color` avec contrainte CHECK
- Ajoute la colonne `avatar_url`
- Migre les valeurs existantes de `accent_color` vers `theme_color`

## Utilisation

### Dans DashboardSettings.tsx

1. **Upload d'avatar** :
   - Cliquez sur la zone d'upload ou sur l'avatar existant
   - Sélectionnez une image (PNG, JPG jusqu'à 2MB)
   - L'image est uploadée dans le bucket `avatars` et l'URL est sauvegardée

2. **Sélection du thème** :
   - Cliquez sur une des 5 bulles de couleur
   - La bordure blanche indique le thème sélectionné
   - Le nom du thème s'affiche en dessous

### Dans PublicArtistPage.tsx

Le thème est appliqué automatiquement sur :
- ✅ Logo InkFlow (couleur du thème)
- ✅ Avatar (affiché si uploadé, sinon initiale)
- ✅ Icônes actives (Zap, etc.)
- ✅ Onglets actifs (barre de soulignement)
- ✅ Badges "Disponible"
- ✅ Prix des flashs
- ✅ Bouton "Réserver"
- ✅ Bordures des inputs en focus

## Thèmes disponibles

| Nom | Valeur | Couleur Tailwind | Hex |
|-----|--------|------------------|-----|
| Gold | `amber` | amber-400 | #fbbf24 |
| Blood | `red` | red-500 | #ef4444 |
| Ocean | `blue` | blue-500 | #3b82f6 |
| Nature | `emerald` | emerald-500 | #10b981 |
| Lavender | `violet` | violet-500 | #8b5cf6 |

## Structure des fichiers

- `supabase/schema.sql` : Schéma mis à jour avec `theme_color` et `avatar_url`
- `supabase/storage-setup.sql` : Configuration du bucket `avatars`
- `supabase/migration-add-theme-avatar.sql` : Script de migration
- `components/dashboard/DashboardSettings.tsx` : Interface de personnalisation
- `components/PublicArtistPage.tsx` : Application dynamique du thème
- `types/supabase.ts` : Types TypeScript mis à jour

