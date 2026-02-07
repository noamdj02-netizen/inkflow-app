# 🔌 Configuration Client Supabase - Guide Complet

## ⚠️ Important : Vite vs Next.js

**Ce projet utilise Vite + React, pas Next.js !**

- ✅ Utilisez `VITE_SUPABASE_URL` (pas `NEXT_PUBLIC_SUPABASE_URL`)
- ✅ Utilisez `VITE_SUPABASE_ANON_KEY` (pas `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- ✅ Le client Supabase est déjà configuré dans `services/supabase.ts`

## 📦 Package Installé

Le package `@supabase/supabase-js` est déjà installé (version 2.89.0).

## 🔧 Configuration Existante

Le client Supabase est déjà configuré dans `services/supabase.ts` avec :
- ✅ Validation des variables d'environnement
- ✅ Gestion d'erreur améliorée
- ✅ Logs de debug en mode développement
- ✅ Types TypeScript générés

## 📝 Configuration des Variables d'Environnement

### Fichier `.env.local`

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```env
# Supabase (Obligatoire)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici

# Gemini AI (Optionnel)
VITE_GEMINI_API_KEY=votre_cle_gemini_ici
```

### ⚠️ Note Importante

- **Préfixe** : `VITE_` (pas `NEXT_PUBLIC_`)
- **Fichier** : `.env.local` (à la racine du projet)
- **Redémarrage** : Redémarrez le serveur de développement après modification

## 🧪 Page de Test

Une page de test a été créée pour vérifier la connexion : `/test-db`

### Accéder à la Page de Test

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Ouvrir dans le navigateur** :
   ```
   http://localhost:3000/test-db
   ```

### Fonctionnalités de la Page de Test

- ✅ Vérification de la configuration Supabase
- ✅ Test de connexion à une table spécifique
- ✅ Test de toutes les tables principales
- ✅ Affichage des erreurs détaillées
- ✅ Aperçu des données (si disponibles)

## 🔍 Vérification de la Configuration

### Méthode 1 : Page de Test (Recommandé)

1. Allez sur `/test-db`
2. Cliquez sur "Tester" pour une table spécifique
3. Ou cliquez sur "Tester toutes les tables"
4. Vérifiez les résultats

### Méthode 2 : Console du Navigateur

1. Ouvrez la console (F12)
2. En mode développement, vous verrez :
   ```
   🔧 Supabase Configuration Debug
   VITE_SUPABASE_URL: ✅ Défini (https://...)
   VITE_SUPABASE_ANON_KEY: ✅ Défini (eyJ...)
   ✅ Client Supabase initialisé avec succès
   ```

### Méthode 3 : Code Simple

```typescript
import { supabase, isSupabaseConfigured } from './services/supabase';

// Vérifier la configuration
if (isSupabaseConfigured()) {
  // Tester la connexion
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Erreur:', error);
  } else {
    console.log('✅ Connexion réussie !', data);
  }
}
```

## 🐛 Dépannage

### Erreur : "Configuration Supabase manquante"

**Solution** :
1. Vérifiez que `.env.local` existe à la racine
2. Vérifiez que les variables commencent par `VITE_`
3. Redémarrez le serveur : `npm run dev`

### Erreur : "Table does not exist"

**Solution** :
1. Vérifiez que vous avez exécuté le schéma SQL dans Supabase
2. Vérifiez le nom de la table (sensible à la casse)
3. Vérifiez les politiques RLS dans Supabase Dashboard

### Erreur : "Invalid API key"

**Solution** :
1. Vérifiez que `VITE_SUPABASE_ANON_KEY` est correcte
2. Récupérez la clé dans Supabase Dashboard → Settings → API
3. Utilisez la clé "anon public" (pas la service role key)

### Erreur : "Failed to fetch"

**Solution** :
1. Vérifiez votre connexion internet
2. Vérifiez que `VITE_SUPABASE_URL` est correcte
3. Vérifiez que le projet Supabase est actif

## 📚 Utilisation du Client

### Import du Client

```typescript
import { supabase } from '../services/supabase';
```

### Exemples d'Utilisation

#### Lire des données

```typescript
const { data, error } = await supabase
  .from('artists')
  .select('*')
  .limit(10);

if (error) {
  console.error('Erreur:', error);
} else {
  console.log('Données:', data);
}
```

#### Insérer des données

```typescript
const { data, error } = await supabase
  .from('artists')
  .insert({
    email: 'artiste@example.com',
    nom_studio: 'Mon Studio',
    slug_profil: 'mon-studio',
  })
  .select()
  .single();
```

#### Mettre à jour des données

```typescript
const { data, error } = await supabase
  .from('artists')
  .update({ nom_studio: 'Nouveau Nom' })
  .eq('id', artistId)
  .select()
  .single();
```

## 🔗 Fichiers Concernés

- `services/supabase.ts` - Client Supabase principal
- `components/TestDatabase.tsx` - Page de test
- `App.tsx` - Route `/test-db` ajoutée
- `.env.local` - Variables d'environnement (à créer)

## ✅ Checklist

- [ ] Fichier `.env.local` créé à la racine
- [ ] Variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` configurées
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Page `/test-db` accessible
- [ ] Test de connexion réussi
- [ ] Pas d'erreur 500

## 📖 Documentation

- [Documentation Supabase JS](https://supabase.com/docs/reference/javascript/introduction)
- [Guide Supabase Setup](./SUPABASE_SETUP.md)
- [Types TypeScript](./types/supabase.ts)

---

**Note** : Si vous voyez des erreurs dans la page de test, consultez la section "Dépannage" ci-dessus ou vérifiez les logs de la console du navigateur.
