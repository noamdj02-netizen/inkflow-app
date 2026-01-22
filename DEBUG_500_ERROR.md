# 🔍 Diagnostic Erreur HTTP 500 - Envoi de Projet

## 🐛 Erreur

```
Erreur serveur (HTTP 500)
URL: https://inkflow-9min9yke5-noam-brochets-projects-2ea9c979.vercel.app/zoneth
```

## 🔍 Étapes de Diagnostic

### Étape 1 : Vérifier les Logs Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Functions** → `api/submit-project-request`
4. Cliquez sur **Logs**
5. Filtrez par "Error" ou cherchez les erreurs récentes
6. **Copiez le message d'erreur exact**

### Étape 2 : Vérifier les Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables, vérifiez :

**Obligatoires** :
- [ ] `SUPABASE_URL` = `https://votre-projet.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `votre_service_role_key`

**Optionnelles** (pour les emails) :
- [ ] `RESEND_API_KEY` = `re_...`
- [ ] `RESEND_FROM_EMAIL` = `InkFlow <noreply@...>`

### Étape 3 : Vérifier la Base de Données

#### Vérifier que les tables existent

Dans Supabase Dashboard → SQL Editor :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('artists', 'customers', 'projects');
```

**Résultat attendu** : 3 lignes (artists, customers, projects)

#### Vérifier la structure de la table customers

```sql
-- Vérifier la structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
```

**Colonnes requises** :
- `id` (UUID, PRIMARY KEY)
- `email` (TEXT, UNIQUE, NOT NULL)
- `name` (TEXT)

#### Vérifier la structure de la table projects

```sql
-- Vérifier la structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

**Colonnes requises** :
- `id` (UUID, PRIMARY KEY)
- `artist_id` (UUID, FOREIGN KEY → artists.id)
- `customer_id` (UUID, FOREIGN KEY → customers.id)
- `client_email` (TEXT)
- `client_name` (TEXT)
- `body_part` (TEXT)
- `size_cm` (INTEGER)
- `style` (TEXT)
- `description` (TEXT)
- `statut` (TEXT)

### Étape 4 : Vérifier les Foreign Keys

```sql
-- Vérifier les foreign keys
SELECT 
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
AND tc.table_name = 'projects';
```

### Étape 5 : Tester l'API Directement

Avec curl (remplacez les valeurs) :

```bash
curl -X POST https://inkflow-9min9yke5-noam-brochets-projects-2ea9c979.vercel.app/api/submit-project-request \
  -H "Content-Type: application/json" \
  -d '{
    "artist_id": "VOTRE-ARTIST-ID-UUID",
    "client_email": "test@example.com",
    "client_name": "Test User",
    "body_part": "Bras",
    "size_cm": 10,
    "style": "Fine Line",
    "description": "Description de test pour vérifier que l API fonctionne correctement"
  }'
```

**Note** : Remplacez `VOTRE-ARTIST-ID-UUID` par un ID d'artiste valide de votre base de données.

## 🔧 Solutions par Type d'Erreur

### Erreur : "Missing server env vars"

**Solution** :
1. Allez dans Vercel Dashboard → Settings → Environment Variables
2. Ajoutez `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
3. Redéployez le projet

### Erreur : "Failed to upsert customer"

**Causes possibles** :
- Table `customers` n'existe pas
- Colonne `email` n'est pas unique
- Problème de permissions RLS

**Solution** :
1. Vérifiez que la table existe (voir SQL ci-dessus)
2. Créez la table si elle n'existe pas :

```sql
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
```

3. Vérifiez les politiques RLS :

```sql
-- Activer RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion (si nécessaire)
CREATE POLICY "Allow service role to manage customers"
ON customers FOR ALL
USING (true)
WITH CHECK (true);
```

### Erreur : "Failed to create project"

**Causes possibles** :
- Table `projects` n'existe pas
- `artist_id` n'existe pas dans `artists`
- `customer_id` n'existe pas dans `customers`
- Contrainte de foreign key

**Solution** :
1. Vérifiez que la table existe
2. Vérifiez que l'artiste existe :

```sql
SELECT id, email, nom_studio 
FROM artists 
WHERE id = 'VOTRE-ARTIST-ID';
```

3. Vérifiez les foreign keys

### Erreur : "Artist not found"

**Solution** :
1. Vérifiez que l'`artist_id` dans la requête est correct
2. Vérifiez que l'artiste existe dans la base de données
3. Vérifiez que les politiques RLS permettent la lecture

## 📋 Checklist Complète

- [ ] Logs Vercel consultés et erreur identifiée
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Table `artists` existe
- [ ] Table `customers` existe
- [ ] Table `projects` existe
- [ ] Foreign keys correctes
- [ ] Politiques RLS configurées
- [ ] Test avec curl réussi
- [ ] Fonction déployée sur Vercel

## 🆘 Si le Problème Persiste

1. **Copiez l'erreur exacte** des logs Vercel
2. **Vérifiez la structure de la base de données** avec les requêtes SQL ci-dessus
3. **Testez avec curl** pour isoler le problème
4. **Vérifiez les permissions** dans Supabase Dashboard → Authentication → Policies

## 📚 Ressources

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Guide de correction](./FIX_PROJECT_500_ERROR.md)

---

**Note** : Les logs Vercel sont la source la plus fiable pour identifier la cause exacte de l'erreur 500.
