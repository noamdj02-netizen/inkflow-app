# CRM Clients — Configuration

## Migration Supabase

Pour activer le module CRM Clients, exécutez la migration SQL dans Supabase :

1. Ouvrez le **SQL Editor** de votre projet Supabase
2. Copiez le contenu de `supabase/migration-crm-clients.sql`
3. Exécutez le script

Cette migration crée :
- **Table `clients`** : fiches clients (nom, prénom, email, téléphone, allergies, notes, consentement, tags)
- **Table `client_photos`** : photos de référence et réalisations
- **Bucket Storage `client-photos`** : stockage des images
- Politiques RLS pour l’accès sécurisé

## Fonctionnalités

- **Fiches clients** avec historique et données détaillées
- **Recherche** par nom, prénom, email, téléphone
- **Filtres par tags** : VIP, Nouveau, Fidèle, Projet perso, Flash
- **Upload de photos** (référence et réalisations)
- **Consentement signé** : suivi du statut
- **Historique RDV** : RDV passés reliés via l’email client
- **Allergies** et **notes**

## Structure des données

```
clients
├── id, artist_id
├── nom, prenom, email, telephone
├── date_naissance, allergies[], notes
├── consentement_signe, tags[]
└── date_inscription, dernier_rdv

client_photos
├── id, client_id
├── url, type (reference | realisation)
└── caption, created_at
```
