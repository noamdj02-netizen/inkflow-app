# Calendrier iCal (RFC 5545) – InkFlow

## Vue d’ensemble

Le flux iCal permet aux tatoueurs de **s’abonner** à leurs rendez-vous InkFlow depuis :

- **Apple Calendar** (macOS / iOS)
- **Google Calendar**
- **Android** (Calendrier Google ou autre app compatible .ics)

Les rendez-vous sont récupérés depuis la base de données, formatés en **RFC 5545** (.ics). Un **cache court** (5 minutes) limite la charge sur la DB tout en gardant les mises à jour visibles rapidement.

## Route API

- **Méthode** : `GET`
- **URL (par artist_id)** :  
  `https://votre-domaine.vercel.app/api/calendar/feed?artist_id=UUID_ARTISTE`
- **URL (par token, si migration exécutée)** :  
  `https://votre-domaine.vercel.app/api/calendar/feed?token=ICAL_FEED_TOKEN`

### Paramètres

| Paramètre   | Obligatoire* | Description |
|------------|--------------|-------------|
| `artist_id`| Oui*         | UUID de l’artiste (table `artists.id`) |
| `token`    | Oui*         | Token secret (colonne `artists.ical_feed_token`) |

\* Il faut soit `artist_id`, soit `token`.

### Réponse

- **Content-Type** : `text/calendar; charset=utf-8`
- **Cache** : `Cache-Control: public, max-age=300, s-maxage=300` (5 min)
- **Corps** : fichier .ics (VCALENDAR + VEVENTs, RFC 5545)

Les événements inclus sont les rendez-vous dont `statut_booking` est `confirmed` ou `pending`.

## Cache

- **max-age=300** : le client (navigateur / app calendrier) peut mettre en cache 5 minutes.
- **s-maxage=300** : le CDN (ex. Vercel) peut aussi mettre en cache 5 minutes.

Cela réduit les appels à la DB tout en intégrant les mises à jour dans un délai raisonnable.

## Sécurité

- **Par `artist_id`** : l’UUID n’est pas devinable facilement, mais toute personne qui a le lien peut voir le calendrier.
- **Par `token`** : après exécution de la migration `migration-ical-feed-token.sql`, vous pouvez générer un token par artiste et n’exposer que l’URL avec `?token=...`. Permet de révoquer en changeant le token.

## Migration (token optionnel)

Pour activer l’URL par token :

1. Supabase → SQL Editor.
2. Exécuter le contenu de `supabase/migration-ical-feed-token.sql`.
3. Générer un token pour chaque artiste (par exemple depuis le dashboard) et remplir `artists.ical_feed_token`.

Exemple de génération côté app (Node) :

```ts
import crypto from 'crypto';
const token = crypto.randomBytes(32).toString('hex');
// Puis UPDATE artists SET ical_feed_token = $token WHERE id = $artistId
```

## S’abonner depuis les apps

### Apple Calendar (macOS / iOS)

1. **Fichier** → **Nouvel abonnement au calendrier** (ou **Abonnement au calendrier**).
2. Coller l’URL du flux (avec `?artist_id=...` ou `?token=...`).
3. Valider. Le calendrier se met à jour selon le cache (5 min).

### Google Calendar

1. **Paramètres** (roue dentée) → **Ajouter un calendrier** → **Par URL**.
2. Coller l’URL du flux.
3. **Ajouter un calendrier**. Les événements apparaissent et se mettent à jour selon le cache.

### Android

1. Ouvrir **Google Calendar**.
2. **Menu** → **Paramètres** → **Ajouter un calendrier** → **Par URL** (ou équivalent selon l’app).
3. Coller l’URL du flux.

## Fichiers concernés

- **Route API** : `api/calendar/feed.ts` – récupère les bookings, appelle `toIcal`, renvoie .ics + en-têtes de cache.
- **Utilitaire iCal** : `utils/ical.ts` – format RFC 5545 (VCALENDAR, VEVENT, DTSTART, DTEND, etc.).
- **Migration** : `supabase/migration-ical-feed-token.sql` – ajout de `ical_feed_token` sur `artists`.

## Dépannage

- **404 / Invalid token** : vérifier que `artist_id` ou `token` est correct et que l’artiste existe (et que `ical_feed_token` est renseigné si vous utilisez `token`).
- **Calendrier vide** : vérifier qu’il existe des lignes dans `bookings` pour cet `artist_id` avec `statut_booking` = `confirmed` ou `pending`.
- **Mises à jour lentes** : le cache est de 5 min ; les changements peuvent mettre jusqu’à 5 min à apparaître dans l’app calendrier.
