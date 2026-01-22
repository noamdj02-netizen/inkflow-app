# 🪟 Installation Stripe CLI sur Windows

## 🎯 Méthode 1 : Via Scoop (Recommandé)

### Prérequis : Installer Scoop

Si vous n'avez pas Scoop, installez-le d'abord :

```powershell
# Exécuter PowerShell en tant qu'administrateur
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Installer Stripe CLI

```powershell
# Ajouter le bucket Stripe
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git

# Installer Stripe CLI
scoop install stripe
```

### Vérifier l'installation

```powershell
stripe --version
```

## 🎯 Méthode 2 : Installation Manuelle

Si Scoop ne fonctionne pas ou si votre antivirus bloque :

### Étape 1 : Télécharger

1. Allez sur : https://github.com/stripe/stripe-cli/releases/latest
2. Téléchargez `stripe_X.X.X_windows_x86_64.zip`
3. Extrayez le fichier ZIP

### Étape 2 : Ajouter au PATH

**Option A : Via PowerShell (Administrateur)**

```powershell
# Remplacer C:\path\to\stripe par le chemin réel
$stripePath = "C:\path\to\stripe"
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
[System.Environment]::SetEnvironmentVariable('Path', "$currentPath;$stripePath", 'Machine')
```

**Option B : Via Interface Graphique**

1. Ouvrez "Variables d'environnement" (recherchez dans le menu Démarrer)
2. Cliquez sur "Variables système" → "Path" → "Modifier"
3. Ajoutez le chemin du dossier `stripe`
4. Redémarrez PowerShell

### Étape 3 : Vérifier

```powershell
stripe --version
```

## 🔐 Authentification

Une fois installé, connectez-vous :

```powershell
stripe login
```

Cela ouvrira votre navigateur pour vous authentifier avec votre compte Stripe.

## 🧪 Tester

```powershell
# Forwarder les webhooks vers votre serveur local
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Dans un autre terminal, récupérer le secret local
stripe listen --print-secret
```

## 🆘 Dépannage

### Erreur : "stripe n'est pas reconnu"

**Solution** :
1. Vérifiez que Stripe CLI est dans votre PATH
2. Redémarrez PowerShell après l'ajout au PATH
3. Vérifiez avec `stripe --version`

### Antivirus bloque l'installation

**Solution** :
- Utilisez l'installation manuelle
- Ajoutez une exception dans votre antivirus

### Scoop ne fonctionne pas

**Solution** :
- Utilisez l'installation manuelle (Méthode 2)

---

**Note** : Après installation, vous pouvez utiliser Stripe CLI pour tester les webhooks localement.
