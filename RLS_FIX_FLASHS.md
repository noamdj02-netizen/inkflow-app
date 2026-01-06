# 🔒 Politiques RLS pour la table `flashs`

## ✅ Résolu

Les politiques RLS sont maintenant correctement configurées et fonctionnelles.

## Solution

Exécutez le fichier SQL suivant dans Supabase SQL Editor :

**Fichier** : `supabase/rls-policies-flashs-debug.sql` (renommé en `rls-policies-flashs.sql`)

## Instructions

1. **Ouvrez Supabase Dashboard** → SQL Editor
2. **Copiez-collez le contenu** de `supabase/rls-policies-flashs.sql`
3. **Exécutez le script**

## Ce que fait le script

1. ✅ Supprime les anciennes politiques RLS pour `flashs`
2. ✅ Active RLS sur la table `flashs`
3. ✅ Crée une politique SELECT publique (tout le monde peut voir les flashs)
4. ✅ Crée une politique INSERT (les artistes peuvent créer leurs propres flashs)
5. ✅ Crée une politique UPDATE (les artistes peuvent modifier leurs propres flashs)
6. ✅ Crée une politique DELETE (les artistes peuvent supprimer leurs propres flashs)

## Vérification

Après avoir exécuté le script, testez :

1. Créez un nouveau flash depuis le dashboard
2. Modifiez un flash existant
3. Supprimez un flash

Tout devrait fonctionner correctement ! ✅

## Note importante

Les politiques utilisent `artist_id = auth.uid()` car :
- Dans votre schéma, `artists.id` = `auth.uid()` (l'ID de l'artiste est l'ID de l'utilisateur authentifié)
- `flashs.artist_id` référence `artists.id`
- Donc `flashs.artist_id = auth.uid()` est correct

