# ⚡ Configuration Rapide Supabase

## ⚠️ Important : Vite, pas Next.js !

**Ce projet utilise Vite + React, pas Next.js !**

- ❌ **N'utilisez PAS** `NEXT_PUBLIC_SUPABASE_URL`
- ✅ **Utilisez** `VITE_SUPABASE_URL`

## 🔑 Variables d'Environnement

### Fichier `.env.local` (à la racine)

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
```

### Où Trouver vos Clés

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **Settings** → **API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## ✅ Vérification

### 1. Redémarrer le Serveur

Après avoir créé/modifié `.env.local` :

```bash
npm run dev
```

### 2. Tester la Connexion

Allez sur : **http://localhost:3000/test-db**

La page de test vous indiquera :
- ✅ Si la configuration est correcte
- ✅ Si la connexion fonctionne
- ✅ Quelles tables sont accessibles
- ❌ Les erreurs détaillées si quelque chose ne va pas

## 📦 Package

Le package `@supabase/supabase-js` est **déjà installé** (v2.89.0).

## 🔌 Client Supabase

Le client est **déjà configuré** dans `services/supabase.ts`.

**Import** :
```typescript
import { supabase } from '../services/supabase';
```

## 🧪 Test Rapide

```typescript
import { supabase } from './services/supabase';

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
```

## 🆘 Dépannage

### "Configuration Supabase manquante"

- Vérifiez que `.env.local` existe à la racine
- Vérifiez que les variables commencent par `VITE_`
- Redémarrez le serveur

### "Table does not exist"

- Exécutez le schéma SQL dans Supabase Dashboard → SQL Editor
- Vérifiez le nom de la table (sensible à la casse)

---

**Guide complet** : Voir [SUPABASE_CLIENT_SETUP.md](./SUPABASE_CLIENT_SETUP.md)
