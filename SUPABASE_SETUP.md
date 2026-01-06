# 🚀 Guide de Configuration Supabase - InkFlow

## ✅ Checklist d'Installation

- [x] Schéma SQL créé (`supabase/schema.sql`)
- [x] Client Supabase installé (`@supabase/supabase-js`)
- [x] Service Supabase configuré (`services/supabase.ts`)
- [x] Types TypeScript générés (`types/supabase.ts`)
- [x] Hooks React créés (`hooks/useFlashs.ts`)
- [x] Documentation complète

## 📝 Étapes de Configuration

### 1. Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte (gratuit)
3. Cliquez sur **"New Project"**
4. Remplissez :
   - **Name** : `inkflow` (ou votre choix)
   - **Database Password** : Choisissez un mot de passe fort
   - **Region** : Choisissez la plus proche (ex: `West EU` pour la France)
5. Cliquez sur **"Create new project"**
6. Attendez 2-3 minutes que le projet soit créé

### 2. Exécuter le Schéma SQL

1. Dans votre dashboard Supabase, allez dans **SQL Editor** (menu de gauche)
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase/schema.sql` de ce projet
4. Copiez **TOUT** le contenu
5. Collez dans l'éditeur SQL
6. Cliquez sur **"Run"** (ou `Ctrl+Enter`)
7. Vérifiez qu'il n'y a pas d'erreurs (vous devriez voir "Success. No rows returned")

### 3. Récupérer vos Clés API

1. Dans le dashboard Supabase, allez dans **Settings** (icône engrenage)
2. Cliquez sur **API**
3. Vous verrez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : Une longue chaîne de caractères

### 4. Configurer les Variables d'Environnement

1. À la racine du projet, créez un fichier `.env.local`
2. Ajoutez :

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici

# Gemini AI (optionnel)
VITE_GEMINI_API_KEY=votre_cle_gemini_ici
```

3. Remplacez les valeurs par celles de votre projet Supabase

### 5. Vérifier la Configuration

1. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

2. Ouvrez la console du navigateur (F12)
3. Vous ne devriez **PAS** voir d'erreur Supabase

## 🧪 Tester la Connexion

Créez un fichier de test temporaire `test-supabase.ts` :

```typescript
import { supabase } from './services/supabase';

// Test de connexion
const testConnection = async () => {
  const { data, error } = await supabase.from('artists').select('count');
  
  if (error) {
    console.error('❌ Erreur Supabase:', error);
  } else {
    console.log('✅ Connexion Supabase OK!');
  }
};

testConnection();
```

## 📊 Vérifier les Tables

Dans Supabase Dashboard :

1. Allez dans **Table Editor**
2. Vous devriez voir 5 tables :
   - `artists`
   - `flashs`
   - `projects`
   - `bookings`
   - `stripe_transactions`

## 🔐 Row Level Security (RLS)

Les politiques RLS sont déjà configurées dans le schéma SQL. Pour les tester :

1. Allez dans **Authentication** → **Policies**
2. Vous devriez voir les politiques pour chaque table

**Note** : Pour l'instant, les politiques nécessitent une authentification. Pour tester sans auth, vous pouvez temporairement désactiver RLS (non recommandé en production).

## 🐛 Dépannage

### Erreur : "Missing Supabase environment variables"

**Solution** : Vérifiez que `.env.local` existe et contient bien `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

### Erreur : "relation does not exist"

**Solution** : Le schéma SQL n'a pas été exécuté. Retournez à l'étape 2.

### Erreur : "new row violates row-level security policy"

**Solution** : RLS est activé mais vous n'êtes pas authentifié. Pour le développement, vous pouvez temporairement désactiver RLS sur une table spécifique :

```sql
ALTER TABLE flashs DISABLE ROW LEVEL SECURITY;
```

⚠️ **Ne faites PAS ça en production !**

## 📚 Prochaines Étapes

Une fois Supabase configuré :

1. **Authentification** : Configurer Supabase Auth pour les artistes
2. **Storage** : Configurer Supabase Storage pour les images de flashs
3. **Edge Functions** : Créer des fonctions pour Stripe (webhooks)
4. **Migrations** : Utiliser Supabase CLI pour gérer les migrations

## 🔗 Liens Utiles

- [Dashboard Supabase](https://app.supabase.com)
- [Documentation Supabase](https://supabase.com/docs)
- [SQL Editor](https://app.supabase.com/project/_/sql)

---

**✅ Une fois ces étapes terminées, votre backend Supabase est prêt !**

