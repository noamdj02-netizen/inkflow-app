# ⚡ Configuration Rapide Supabase - InkFlow

## ✅ Étape 1 : Variables d'Environnement (FAIT ✅)

Votre fichier `.env.local` est maintenant configuré avec :
- ✅ `VITE_SUPABASE_URL` : https://jnrprkdueseahfrguhvt.supabase.co
- ✅ `VITE_SUPABASE_ANON_KEY` : Configuré
- ✅ `VITE_GEMINI_API_KEY` : Configuré

## 🔧 Étape 2 : Exécuter le Schéma SQL

**IMPORTANT** : Vous devez exécuter le schéma SQL dans Supabase pour créer les tables.

### Instructions :

1. **Connectez-vous à Supabase**
   - Allez sur [https://app.supabase.com](https://app.supabase.com)
   - Connectez-vous à votre projet : `jnrprkdueseahfrguhvt`

2. **Ouvrez le SQL Editor**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"**

3. **Copiez le Schéma SQL**
   - Ouvrez le fichier `supabase/schema.sql` dans votre projet
   - Sélectionnez **TOUT** le contenu (Ctrl+A)
   - Copiez (Ctrl+C)

4. **Collez et Exécutez**
   - Collez dans l'éditeur SQL de Supabase
   - Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)
   - Attendez quelques secondes

5. **Vérifiez le Résultat**
   - Vous devriez voir : **"Success. No rows returned"**
   - Si vous voyez des erreurs, vérifiez les messages

## ✅ Étape 3 : Vérifier les Tables

1. Dans Supabase Dashboard, allez dans **"Table Editor"** (menu de gauche)
2. Vous devriez voir **5 tables** :
   - ✅ `artists`
   - ✅ `flashs`
   - ✅ `projects`
   - ✅ `bookings`
   - ✅ `stripe_transactions`

## 🔄 Étape 4 : Redémarrer le Serveur

**IMPORTANT** : Après avoir modifié `.env.local`, vous devez redémarrer le serveur de développement.

1. **Arrêtez le serveur** : Appuyez sur `Ctrl+C` dans le terminal
2. **Relancez** :
   ```bash
   npm run dev
   ```

## 🧪 Étape 5 : Tester

1. Ouvrez votre navigateur sur `http://localhost:3000`
2. Allez sur `/register` pour créer un compte
3. Si tout fonctionne, vous devriez pouvoir :
   - Créer un compte
   - Accéder à l'onboarding
   - Créer votre profil artiste

## 🐛 Si ça ne fonctionne toujours pas

### Vérifier les Variables d'Environnement

Ouvrez la console du navigateur (F12) et tapez :
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

Vous devriez voir vos valeurs. Si vous voyez `undefined`, le serveur n'a pas été redémarré.

### Vérifier le Schéma SQL

Dans Supabase Dashboard → Table Editor, vérifiez que les 5 tables existent.

### Vérifier les Erreurs dans la Console

Ouvrez la console du navigateur (F12) et regardez s'il y a des erreurs rouges.

## 📞 Besoin d'Aide ?

Consultez le guide complet : `SUPABASE_SETUP.md`

---

**✅ Une fois le schéma SQL exécuté et le serveur redémarré, tout devrait fonctionner !**

