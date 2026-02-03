# Lier ink-flow.me au projet Vercel (tatoo)

## Situation

- **Projet actuel** : [tatoo](https://vercel.com/noam-brochets-projects-2ea9c979/tatoo) → https://tatoo-omega.vercel.app  
- **Domaine souhaité** : https://ink-flow.me  
- **Problème** : `ink-flow.me` est déjà assigné à un **autre** projet Vercel.

## Étapes pour basculer ink-flow.me sur ce projet

### 1. Retirer ink-flow.me de l’autre projet

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard).
2. Repérez le projet qui utilise actuellement **ink-flow.me** (ex. ancien projet inkflow-app-swart ou autre).
3. Ouvrez ce projet → **Settings** → **Domains**.
4. Trouvez **ink-flow.me** (et **www.ink-flow.me** si présent).
5. Cliquez sur les **⋯** à droite du domaine → **Remove** et confirmez.

### 2. Ajouter ink-flow.me au projet tatoo

1. Allez sur le projet **tatoo** :  
   https://vercel.com/noam-brochets-projects-2ea9c979/tatoo  
2. **Settings** → **Domains**.
3. Cliquez sur **Add**.
4. Saisissez **ink-flow.me** → **Add**.
5. (Optionnel) Ajoutez **www.ink-flow.me** de la même façon.

### 3. Vérifier la configuration DNS

Chez votre registrar (où vous avez acheté ink-flow.me) :

- **Pour la racine (ink-flow.me)** :  
  - Un enregistrement **A** pointant vers **76.76.21.21**  
  - **ou** un **CNAME** vers **cname.vercel-dns.com** (si votre registrar le permet pour l’apex).
- **Pour www.ink-flow.me** :  
  - Un **CNAME** **www** → **cname.vercel-dns.com**.

Vercel affiche les valeurs exactes dans **Settings** → **Domains** après ajout du domaine.

### 4. Variable d’environnement (recommandé)

Dans le projet **tatoo** : **Settings** → **Environment Variables** :

- **Name** : `VITE_SITE_URL`  
- **Value** : `https://ink-flow.me`  
- **Environments** : Production (et Preview si vous voulez les mêmes URLs en preview).

Cela sert pour les canonical, SEO et redirects d’auth (ex. Supabase).

---

## Résumé

| Action | Où |
|--------|-----|
| Retirer ink-flow.me | Ancien projet Vercel → Settings → Domains → Remove |
| Ajouter ink-flow.me | Projet **tatoo** → Settings → Domains → Add |
| DNS | Registrar : A 76.76.21.21 ou CNAME cname.vercel-dns.com |
| URL en prod | Après propagation DNS : https://ink-flow.me |

Propagation DNS : en général 5–30 minutes, parfois jusqu’à 48 h.
