# Notifications email — Demandes de rendez-vous (InkFlow)

## Fonction principale : `sendAppointmentNotification()`

**Déclencheur** : lorsqu’un client valide une demande de rendez-vous (soumission du formulaire « Projet perso »).

**Provider** : Resend (clé `RESEND_API_KEY`).

## Contenu du mail tatoueur

- **Objet** : `Nouvelle demande de rendez-vous - [Nom Client]`
- **Corps** :
  - Nom du client
  - Email du client
  - Zone du corps demandée
  - Style de tatouage
  - Taille approximative (cm)
  - Budget estimé
  - Description du projet
  - Lien direct : `{SITE_URL}/dashboard/requests`
- **Design** : template HTML responsive et sobre (voir `utils/emailTemplates.ts`).

## Gestion des erreurs

1. **Try/catch** autour de l’envoi dans `sendAppointmentNotification()`.
2. **En cas d’échec** : log détaillé en console (`[appointmentNotification] Artist email failed...`).
3. **Retry automatique** : 1 tentative après 30 secondes (max 1 retry).
4. **État en base** : en cas d’échec définitif, mise à jour du projet avec `artist_notification_status = 'failed'` (via callback `onEmailFailed`).
5. **Non bloquant** : la création du rendez-vous (projet) n’est jamais bloquée par l’échec de l’email.

## Bonus

- **Email de confirmation au client** : `sendAppointmentConfirmationToClient()` — sujet « Votre demande de rendez-vous a bien été reçue », envoyé après création du projet (non bloquant).
- **Templates réutilisables** : `utils/emailTemplates.ts` — `baseEmailLayout()`, `appointmentNotificationArtistBody()`, `appointmentConfirmationClientBody()`.

## Fichiers

| Fichier | Rôle |
|--------|------|
| `utils/emailTemplates.ts` | Templates HTML/text réutilisables (layout, mail tatoueur, mail client). |
| `services/appointmentNotification.ts` | `sendAppointmentNotification()` (retry + `onEmailFailed`), `sendAppointmentConfirmationToClient()`. |
| `api/submit-project-request.ts` | Création du projet puis appel aux notifications (artist + client). |
| `supabase/migration-notification-status.sql` | Colonnes `artist_notification_status`, `client_confirmation_sent_at` sur `projects`. |

## Variables d’environnement

- **RESEND_API_KEY** (obligatoire pour l’envoi).
- **RESEND_FROM_EMAIL** (optionnel, défaut : `InkFlow <onboarding@resend.dev>`).
- **SITE_URL** (optionnel, pour les liens dans les mails ; défaut : origine de la requête ou `https://inkflow.app`).

## Migration

Exécuter dans Supabase → SQL Editor :

```sql
-- Voir supabase/migration-notification-status.sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS artist_notification_status TEXT DEFAULT 'pending'
  CHECK (artist_notification_status IN ('pending', 'sent', 'failed'));
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_confirmation_sent_at TIMESTAMP WITH TIME ZONE;
```

## Statuts `artist_notification_status`

- **pending** : pas encore traité (défaut).
- **sent** : email tatoueur envoyé avec succès.
- **failed** : échec après retry ; l’artiste peut être prévenu par un autre canal ou relancer depuis le dashboard.
