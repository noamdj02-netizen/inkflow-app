# 🔧 Dépannage Authentification - InkFlow

## ❌ Erreur : "Invalid login credentials"

### Cause
Cette erreur signifie que vous essayez de vous connecter avec un compte qui **n'existe pas encore** dans Supabase Auth.

### Solution

**Étape 1 : Créer un compte**
1. Allez sur `/register` (ou cliquez sur "S'inscrire" sur la page de connexion)
2. Entrez votre email (ex: `noamdj02@gmail.com`)
3. Choisissez un mot de passe (minimum 6 caractères)
4. Confirmez le mot de passe
5. Cliquez sur "Créer mon compte"

**Étape 2 : Vérifier la confirmation d'email (si activée)**

Par défaut, Supabase peut exiger une confirmation d'email. Deux options :

#### Option A : Désactiver la confirmation d'email (pour le développement)

1. Allez sur votre dashboard Supabase : https://app.supabase.com/project/jnrprkdueseahfrguhvt
2. Allez dans **Authentication** → **Settings** (menu de gauche)
3. Dans la section **"Email Auth"**, désactivez **"Enable email confirmations"**
4. Cliquez sur **"Save"**

#### Option B : Vérifier votre boîte email

1. Après l'inscription, vérifiez votre boîte email (y compris les spams)
2. Cliquez sur le lien de confirmation dans l'email Supabase
3. Ensuite, vous pourrez vous connecter

**Étape 3 : Se connecter**

1. Allez sur `/login`
2. Entrez votre email et mot de passe
3. Cliquez sur "Se connecter"

## ✅ Vérifier que Supabase Auth fonctionne

### Test rapide dans la console du navigateur

1. Ouvrez la console (F12)
2. Tapez :
```javascript
// Vérifier que Supabase est configuré
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configuré' : 'Manquant');
```

### Test d'inscription

1. Allez sur `/register`
2. Créez un compte avec un email de test
3. Vérifiez la console pour voir s'il y a des erreurs
4. Si l'inscription réussit, vous serez redirigé vers `/onboarding`

## 🐛 Autres problèmes courants

### Problème : "Supabase n'est pas configuré"

**Solution** : Vérifiez que `.env.local` contient bien :
```env
VITE_SUPABASE_URL=https://jnrprkdueseahfrguhvt.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_ici
```

Puis **redémarrez le serveur** :
```bash
npm run dev
```

### Problème : "User already registered"

**Solution** : L'email existe déjà. Soit :
- Utilisez un autre email
- Ou connectez-vous avec cet email existant

### Problème : Redirection vers `/onboarding` mais erreur

**Solution** : Vérifiez que le schéma SQL a été exécuté et que la table `artists` existe.

## 📝 Checklist de Configuration

- [ ] Variables d'environnement configurées dans `.env.local`
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Schéma SQL exécuté dans Supabase
- [ ] Confirmation d'email désactivée (pour le développement) OU email confirmé
- [ ] Compte créé via `/register`
- [ ] Connexion testée via `/login`

## 🚀 Workflow Complet

1. **Créer un compte** : `/register` → Entrer email + mot de passe → "Créer mon compte"
2. **Confirmer l'email** (si nécessaire) : Vérifier la boîte email
3. **Créer le profil** : `/onboarding` → Entrer nom studio + slug → "Créer mon profil"
4. **Accéder au dashboard** : `/dashboard` → Vous êtes maintenant connecté !

---

**💡 Astuce** : Pour le développement, désactivez la confirmation d'email dans Supabase pour éviter d'avoir à vérifier votre email à chaque fois.

