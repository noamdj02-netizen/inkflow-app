# 🔧 Correction de l'erreur HTTP 500 - Envoi de Projet

## 🐛 Problème

L'erreur suivante apparaît lors de l'envoi d'une demande de projet personnalisé :

```
Erreur serveur (HTTP 500)
```

## 🔍 Causes Possibles

1. **Variables d'environnement manquantes** :
   - `SUPABASE_URL` ou `VITE_SUPABASE_URL` non configurée
   - `SUPABASE_SERVICE_ROLE_KEY` non configurée

2. **Erreur lors de la création du customer** :
   - Problème avec la table `customers` dans Supabase
   - Contrainte de base de données

3. **Erreur lors de la création du project** :
   - Problème avec la table `projects` dans Supabase
   - Contrainte de base de données (foreign key, etc.)
   - Données invalides

4. **Erreur de parsing JSON** :
   - Le body de la requête n'est pas du JSON valide

## ✅ Corrections Apportées

### 1. Amélioration de la gestion d'erreur

- ✅ Try-catch global pour capturer toutes les erreurs inattendues
- ✅ Meilleurs logs d'erreur pour le débogage
- ✅ Messages d'erreur plus clairs
- ✅ Gestion du parsing JSON (string vs object)

### 2. Messages d'erreur améliorés

- Messages spécifiques pour chaque type d'erreur
- Détails en mode développement
- Messages utilisateur compréhensibles

## 🔍 Diagnostic

### Vérifier les Logs Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Votre projet → **Functions** → `api/submit-project-request`
3. Cliquez sur **Logs**
4. Cherchez les erreurs récentes

### Erreurs Courantes dans les Logs

#### "Missing server env vars"

**Solution** : Configurez dans Vercel Dashboard → Settings → Environment Variables :
- `SUPABASE_URL` ou `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

#### "Failed to upsert customer"

**Causes possibles** :
- Table `customers` n'existe pas
- Contrainte de base de données
- Problème de permissions RLS

**Solution** :
1. Vérifiez que la table `customers` existe dans Supabase
2. Vérifiez les politiques RLS
3. Vérifiez les contraintes (email unique, etc.)

#### "Failed to create project"

**Causes possibles** :
- Table `projects` n'existe pas
- Contrainte de foreign key (artist_id, customer_id)
- Données invalides

**Solution** :
1. Vérifiez que la table `projects` existe
2. Vérifiez que `artist_id` existe dans la table `artists`
3. Vérifiez que `customer_id` existe dans la table `customers`
4. Vérifiez les contraintes de la table

## 🚀 Solutions

### Solution 1 : Vérifier les Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables :

**Obligatoires** :
- `SUPABASE_URL` = `https://votre-projet.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `votre_service_role_key`

**Optionnelles** :
- `RESEND_API_KEY` = `re_...` (pour les emails)
- `RESEND_FROM_EMAIL` = `InkFlow <noreply@votredomaine.com>`

### Solution 2 : Vérifier la Base de Données

#### Vérifier que les tables existent

Dans Supabase Dashboard → SQL Editor, exécutez :

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('artists', 'customers', 'projects');
```

#### Vérifier les contraintes

```sql
-- Vérifier les foreign keys
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('projects', 'customers');
```

### Solution 3 : Vérifier les Politiques RLS

Les tables doivent avoir des politiques RLS appropriées. Vérifiez dans Supabase Dashboard → Authentication → Policies.

## 🧪 Test de la Correction

### Test 1 : Vérifier les Variables

1. Allez sur Vercel Dashboard
2. Vérifiez que toutes les variables sont configurées
3. Redéployez si vous venez de les ajouter

### Test 2 : Tester l'Envoi

1. Allez sur une page publique d'artiste
2. Cliquez sur "Projet personnalisé"
3. Remplissez le formulaire complètement
4. Soumettez la demande
5. Vérifiez les logs Vercel si l'erreur persiste

## 📋 Checklist de Vérification

- [ ] Variables d'environnement configurées dans Vercel
- [ ] Table `artists` existe dans Supabase
- [ ] Table `customers` existe dans Supabase
- [ ] Table `projects` existe dans Supabase
- [ ] Les foreign keys sont correctes
- [ ] Les politiques RLS sont configurées
- [ ] La fonction `api/submit-project-request` est déployée
- [ ] Les logs Vercel ne montrent pas d'erreurs

## 🆘 Dépannage Avancé

### Vérifier les Logs en Temps Réel

1. Allez sur Vercel Dashboard → Functions → `api/submit-project-request`
2. Cliquez sur **Logs**
3. Filtrez par "Error" ou "500"
4. Regardez les détails de l'erreur

### Tester l'API Directement

Avec curl :

```bash
curl -X POST https://votre-projet.vercel.app/api/submit-project-request \
  -H "Content-Type: application/json" \
  -d '{
    "artist_id": "votre-artist-id",
    "client_email": "test@example.com",
    "client_name": "Test User",
    "body_part": "Bras",
    "size_cm": 10,
    "style": "Fine Line",
    "description": "Description de test pour vérifier que l API fonctionne"
  }'
```

### Vérifier la Structure de la Base de Données

Exécutez dans Supabase SQL Editor :

```sql
-- Vérifier la structure de la table projects
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

## 📚 Fichiers Modifiés

- `api/submit-project-request.ts` :
  - Ajout d'un try-catch global
  - Meilleure gestion du parsing JSON
  - Messages d'erreur améliorés
  - Logs d'erreur plus détaillés

## 🔗 Liens Utiles

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Guide de déploiement Vercel](./DEPLOY_VERCEL_GUIDE.md)
- [Configuration Resend](./CONFIGURE_RESEND.md)

---

**Status** : ✅ Corrigé - La gestion d'erreur est améliorée avec des messages plus clairs et un meilleur logging pour faciliter le diagnostic.
