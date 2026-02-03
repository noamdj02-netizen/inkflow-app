# 🔧 Correction de l'erreur Prisma côté client

## ❌ Problème

Erreur de build Vite :
```
".prisma/client/index-browser" is imported by ".prisma/client/index-browser?commonjs-external", but could not be resolved – treating it as an external dependency.
```

## 🔍 Cause

Le projet utilise **Vite** (pas Next.js), et Vite essaie de bundler `@prisma/client` côté client. Cependant :
- `@prisma/client` contient du code serveur (Node.js) qui ne peut pas être exécuté dans le navigateur
- Les fichiers `lib/prisma.ts` et `lib/booking-utils.ts` créent des instances `PrismaClient` qui ne doivent être utilisées que côté serveur

## ✅ Solution appliquée

### 1. **Création d'un fichier de types séparé** (`types/prisma-enums.ts`)

Les enums Prisma (`SubscriptionPlan`, `SubscriptionStatus`, `BookingStatus`) sont maintenant définis dans un fichier séparé qui peut être importé côté client sans importer le client Prisma complet.

```typescript
// types/prisma-enums.ts
export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PRO = 'PRO',
  STUDIO = 'STUDIO',
}
```

### 2. **Mise à jour des imports côté client**

Tous les fichiers qui importaient les types depuis `@prisma/client` utilisent maintenant `types/prisma-enums` :

- ✅ `hooks/useSubscription.ts`
- ✅ `lib/permissions.ts`
- ✅ `lib/subscription-utils.ts`

### 3. **Configuration Vite pour exclure Prisma**

Ajout dans `vite.config.ts` :

```typescript
rollupOptions: {
  external: (id) => {
    // Exclure Prisma du bundle client (server-side only)
    if (id.includes('@prisma/client') || id.includes('.prisma/client')) {
      return true;
    }
    // Exclure les fichiers serveur Prisma
    if (id.includes('/lib/prisma') || id.includes('/lib/booking-utils')) {
      return true;
    }
    return false;
  },
  // ...
}
```

### 4. **Documentation des fichiers serveur**

Ajout de commentaires dans `lib/prisma.ts` et `lib/booking-utils.ts` pour indiquer qu'ils sont **SERVER-SIDE ONLY**.

## 📋 Règles à respecter

### ✅ **Autorisé côté client** :
- Importer les types depuis `types/prisma-enums.ts`
- Utiliser les enums pour le typage TypeScript

### ❌ **Interdit côté client** :
- Importer `@prisma/client` directement
- Importer `lib/prisma.ts` ou `lib/booking-utils.ts`
- Créer des instances `PrismaClient` dans des composants React ou hooks

### ✅ **Utilisation serveur uniquement** :
- `lib/prisma.ts` → Utiliser uniquement dans les API routes Vercel (`api/*.ts`)
- `lib/booking-utils.ts` → Utiliser uniquement dans les API routes Vercel

## 🔄 Architecture recommandée

```
Frontend (React/Vite)
├── hooks/useSubscription.ts → Utilise types/prisma-enums.ts ✅
├── lib/permissions.ts → Utilise types/prisma-enums.ts ✅
└── components/ → Pas d'import Prisma ✅

Backend (Vercel Serverless Functions)
├── api/stripe.ts → Utilise lib/prisma.ts ✅
├── api/booking-refactored.ts → Utilise lib/prisma.ts ✅
└── lib/prisma.ts → Instance PrismaClient ✅
```

## 🧪 Vérification

Pour vérifier qu'il n'y a plus d'imports Prisma côté client :

```bash
# Chercher les imports Prisma dans les composants et hooks
grep -r "@prisma/client" components/ hooks/
# Ne doit rien retourner (ou seulement des commentaires)
```

## 📝 Notes

- Les fichiers dans `app/` sont pour Next.js et ne sont pas utilisés dans ce projet Vite
- Si vous avez besoin d'utiliser Prisma dans le futur, créez toujours des API routes Vercel qui appellent Prisma côté serveur
- Les types peuvent toujours être partagés via `types/prisma-enums.ts`
