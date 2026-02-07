# Prisma — Reset & Seed (dev)

Sur **Supabase**, le schéma `auth` appartient à Supabase. Un `prisma db push --force-reset` tente de tout réinitialiser (y compris `auth`) et échoue avec *"must be owner of table identities"*. Il faut donc ne réinitialiser que le schéma **public**.

## 1. Réinitialiser la base (schéma public uniquement)

**Attention : supprime toutes les données des tables dans `public`.**

### Option A : une seule commande (recommandé)

```bash
npm run db:reset
```

Cela exécute un script qui :
1. DROP / CREATE du schéma `public` uniquement (via SQL).
2. `npx prisma db push` pour recréer les tables à partir de `schema.prisma`.

### Option B : à la main (si la commande échoue)

1. Ouvre **Supabase** → **SQL Editor** → New query.
2. Copie le contenu de `prisma/reset-public-schema.sql` et exécute-le.
3. En local :

   ```bash
   npx prisma db push
   ```

## 2. Ensemencer (utilisateur + RDV de test)

Après le reset :

```bash
npx prisma db seed
```

ou :

```bash
npm run db:seed
```

Cela crée un artiste (`artist@test.com`), un client (`client@test.com`), des horaires, 2 services et 5 rendez-vous.

## 3. Voir le calendrier

1. Dans **Supabase Auth**, crée un utilisateur avec l’email **artist@test.com** (ou connecte-toi avec ce compte).
2. Ouvre le dashboard → Calendrier. Les RDV de test s’affichent pour cet artiste.

## Rappel

- On ne réinitialise **jamais** le schéma `auth` (géré par Supabase).
- Pour la prod, utilise des migrations (`prisma migrate`) et ne fais pas de reset sur la base de prod.
