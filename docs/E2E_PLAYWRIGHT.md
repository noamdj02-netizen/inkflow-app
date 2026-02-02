# Tests E2E InkFlow (Playwright)

Scénario d’assurance qualité End-to-End pour **stabilité**, **sécurité** et **performance** du SaaS InkFlow.

## Prérequis

- **Node.js** et **npm** installés
- Application buildable (`npm run build`)

## Installation

```bash
npm install
npx playwright install
```

(`npx playwright install` installe les navigateurs Chromium et Firefox utilisés par les tests.)

## Lancer les tests

### 1. Avec serveur automatique (recommandé)

Playwright peut démarrer l’app pour vous :

```bash
npm run test:e2e
```

Cela lance `npm run dev`, attend que l’app soit prête, puis exécute les tests.

### 2. Avec l’app déjà lancée

Dans un premier terminal :

```bash
npm run dev
```

Dans un second :

```bash
npm run test:e2e
```

Playwright réutilise le serveur déjà en cours (`reuseExistingServer`).

### 3. Contre une URL personnalisée

```bash
PLAYWRIGHT_BASE_URL=https://ton-staging.vercel.app npm run test:e2e
```

### 4. Mode interface (débogage)

```bash
npm run test:e2e:ui
```

### 5. Mode visible (navigateur affiché)

```bash
npm run test:e2e:headed
```

### 6. Un seul navigateur

```bash
npx playwright test --project=chromium
```

## Variables d’environnement optionnelles

| Variable | Rôle |
|----------|------|
| `E2E_ARTIST_SLUG` | Slug de la vitrine publique (ex. `marie-studio`). Si défini, les tests « Vitrine » et « Réserver » sont exécutés. |
| `E2E_LOGIN_EMAIL` | Email du compte tatoueur pour les tests Dashboard. |
| `E2E_LOGIN_PASSWORD` | Mot de passe du compte. |
| `PLAYWRIGHT_BASE_URL` | URL de l’app (défaut : `http://localhost:5173`). |

Exemple (PowerShell) :

```powershell
$env:E2E_ARTIST_SLUG="ton-slug"
$env:E2E_LOGIN_EMAIL="tatoueur@example.com"
$env:E2E_LOGIN_PASSWORD="MotDePasseSecret"
npm run test:e2e
```

Exemple (bash) :

```bash
export E2E_ARTIST_SLUG=ton-slug
export E2E_LOGIN_EMAIL=tatoueur@example.com
export E2E_LOGIN_PASSWORD=MotDePasseSecret
npm run test:e2e
```

## Ce que couvrent les tests

1. **Parcours Client (Vitrine & Réservation)**  
   - Chargement de la page d’accueil et de la section « Vitrine ».  
   - Scroll rapide pour vérifier l’absence de réponses 500 (chargement images / ressources).  
   - Si `E2E_ARTIST_SLUG` est défini : clic sur « Réserver », remplissage du formulaire, soumission et vérification qu’aucune erreur 500 n’est renvoyée par l’API.

2. **Parcours Tatoueur (Dashboard)**  
   - Connexion (si `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD` sont définis).  
   - Vérification que tous les onglets de la sidebar fonctionnent (Dashboard, Calendrier, Demandes, Mes Flashs, Clients, Finance, Paramètres).  
   - Ouverture du modal « Personnaliser » de la Widget Station et vérification que les toggles réagissent.  
   - Vérification de l’affichage des graphiques / widgets de performance.

3. **Sécurité & Robustesse**  
   - Soumission d’un formulaire vide : la validation doit bloquer l’envoi (message d’erreur ou champs requis).  
   - Accès à `/dashboard`, `/dashboard/overview`, `/dashboard/settings` sans être connecté : redirection vers `/login`.

## Rapport HTML

Après une exécution :

```bash
npx playwright show-report
```

Ouvre le rapport HTML des derniers tests (traces, captures, vidéos en cas d’échec).
