# Configuration Cal.com

Ce guide explique comment configurer Cal.com pour automatiser les réservations dans InkFlow.

## 1. Créer un compte Cal.com

1. Allez sur [cal.com](https://cal.com)
2. Créez un compte pour chaque artiste
3. Notez le **username** (ex: `john-doe`)

## 2. Créer un Event Type

1. Dans Cal.com, allez dans **Settings > Event Types**
2. Créez un nouveau type d'événement (ex: "Consultation Tattoo")
3. Configurez:
   - Durée: 60 minutes (ou selon vos besoins)
   - Disponibilités: vos heures de travail
   - Buffer time: 15 minutes entre les rendez-vous
4. Notez l'**Event Type ID** (visible dans l'URL ou les paramètres)

## 3. Obtenir l'API Key

1. Allez dans **Settings > Developer**
2. Créez une nouvelle API Key
3. Copiez la clé (commence par `cal_`)

## 4. Configurer dans Supabase

Pour chaque artiste, ajoutez dans la table `artists`:

```sql
UPDATE artists 
SET 
  cal_com_username = 'john-doe',
  cal_com_event_type_id = '123456'
WHERE slug_profil = 'john-doe';
```

## 5. Variables d'environnement

Ajoutez dans `.env.local`:

```bash
CAL_COM_API_KEY=cal_...
CAL_COM_BASE_URL=https://api.cal.com/v1
```

## 6. Tester

1. Visitez `/artist/[slug]`
2. Sélectionnez un flash
3. Choisissez un créneau disponible
4. Vérifiez que le créneau apparaît dans Cal.com

## Documentation Cal.com API

- [Cal.com API Docs](https://developer.cal.com/api)
- [Event Types](https://developer.cal.com/api/event-types)
- [Bookings](https://developer.cal.com/api/bookings)
