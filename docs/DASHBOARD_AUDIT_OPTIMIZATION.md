# Audit et optimisation du dashboard Inkflow

## Fichiers audités

- **Routes dashboard** : `App.tsx` (routes sous `/dashboard` : overview, calendar, requests, flashs, clients, finance, settings, care-sheets)
- **Protection** : `components/ProtectedRoute.tsx` + `hooks/useAuth.ts`
- **Données** : `hooks/useDashboardData.ts`, `hooks/useDashboardSWR.ts`
- **Layout** : `components/dashboard/DashboardLayout.tsx`
- **Vues** : `DashboardOverview.tsx`, widgets dans `dashboard/widgets/`

---

## Vérifications sécurité

| Critère | Statut |
|--------|--------|
| Toutes les routes dashboard protégées par middleware auth | ✅ Route parent `/dashboard` enveloppée dans `<ProtectedRoute>` ; redirection vers `/login` si non authentifié |
| Données utilisateur filtrées côté serveur | ✅ Toutes les requêtes Supabase utilisent `.eq('artist_id', user.id)` ; RLS côté base applique les mêmes règles |
| IDs sensibles non exposés dans l’URL | ✅ Aucune route dashboard n’utilise `:id` dans le path ; les listes (demandes, RDV) utilisent l’état local / données en mémoire |

---

## UX / Performance

### États de chargement (skeletons)

- **Layout** : `Skeleton` (common) pour la sidebar « À Faire » pendant le chargement.
- **Overview** : `WidgetSkeleton`, `KPISkeleton`, `ChartSkeleton`, `ActivitySkeleton` pour chaque bloc.
- Cohérence : tous les widgets utilisent les mêmes composants de skeleton (fichier `WidgetSkeleton.tsx`).

### Gestion d’erreur

- **WidgetErrorFallback** : composant commun (message + bouton « Réessayer ») utilisé par NextAppointment, KPI, RevenueChart, RecentActivity.
- Messages explicites : « Le prochain RDV n'a pas pu être chargé », « Les indicateurs… », etc.
- Retry manuel via `refresh()` (SWR mutate).

### Actualisation sans rechargement

- **SWR** : cache automatique, revalidation en arrière-plan.
- **RevalidateOnFocus** : retour sur l’onglet → revalidation.
- **RevalidateOnReconnect** : reconnexion réseau → revalidation.
- **Prefetch** : au montage de `DashboardLayout`, `prefetchDashboard(userId)` précharge les clés SWR pour un affichage rapide des vues suivantes.

---

## Optimisations implémentées

### SWR (cache, revalidation, déduplication)

- **Package** : `swr` installé.
- **Config globale** : `App.tsx` enveloppe l’app dans `<SWRConfig>` (dedupingInterval 2s, revalidateOnFocus, revalidateOnReconnect, errorRetryCount 2, keepPreviousData).
- **Hooks** dans `hooks/useDashboardSWR.ts` :
  - `useDashboardDataSWR()` : stats, recentBookings, pendingProjects (layout + sidebar).
  - `useNextBookingSWR()` : prochain RDV.
  - `useKPIsSWR()` : CA du mois, RDV à venir, en attente.
  - `useRevenueChartSWR()` : revenus 6 mois.
  - `useRecentActivitySWR()` : activité récente.
- **useDashboardData** : conserve la même API, implémenté au-dessus de `useDashboardDataSWR` pour le layout.

### Prefetch

- Dans `DashboardLayout`, `useEffect` appelle `prefetchDashboard(user.id)` au montage pour précharger toutes les clés dashboard (data, nextBooking, kpis, revenue, activity).

### Lazy loading

- Déjà en place : `DashboardLayout`, `DashboardOverview`, etc. sont chargés via `lazy()` dans `App.tsx` ; Recharts chargé à la demande dans le layout.

### Correction affichage projets

- Sidebar « À Faire » : affichage `project.client_name ?? project.client_email ?? '—'`, et `client_email` ajouté dans la requête dashboard (useDashboardSWR) pour les projets en attente.

---

## Résultat attendu

- **Dashboard fluide et sécurisé** : routes protégées, données filtrées par artiste, pas d’IDs sensibles dans l’URL.
- **Temps de chargement &lt; 1 s pour données en cache** : SWR renvoie le cache immédiatement puis revalide en arrière-plan.
- **Transitions sans saccades** : skeletons homogènes, `keepPreviousData` pour éviter les flashs lors des revalidations.

---

## Fichiers modifiés / ajoutés

- `package.json` : dépendance `swr`
- `App.tsx` : `SWRConfig` global
- `hooks/useDashboardSWR.ts` : **nouveau** (fetchers + hooks SWR + prefetch)
- `hooks/useDashboardData.ts` : délégation à `useDashboardDataSWR`
- `components/dashboard/DashboardLayout.tsx` : prefetch au montage, affichage client_name/client_email
- `components/dashboard/widgets/WidgetSkeleton.tsx` : `WidgetErrorFallback`
- `components/dashboard/widgets/NextAppointmentWidget.tsx` : SWR + skeleton + erreur
- `components/dashboard/widgets/KPIWidgets.tsx` : SWR + skeleton + erreur
- `components/dashboard/widgets/RevenueChartWidget.tsx` : SWR + skeleton + erreur
- `components/dashboard/widgets/RecentActivityWidget.tsx` : SWR + skeleton + erreur
- `docs/DASHBOARD_AUDIT_OPTIMIZATION.md` : ce document
