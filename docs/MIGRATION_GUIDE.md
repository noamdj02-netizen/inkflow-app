# Guide de Migration - React+Vite vers Next.js 14

Ce document décrit les changements effectués lors de la migration vers Next.js 14 App Router.

## Changements principaux

### Structure des fichiers

- **Avant**: `App.tsx` avec React Router
- **Après**: Structure `app/` avec App Router Next.js

### Routes

- `/` → `app/page.tsx`
- `/login` → `app/login/page.tsx`
- `/register` → `app/register/page.tsx`
- `/dashboard` → `app/(dashboard)/dashboard/page.tsx`
- `/artist/[slug]` → `app/(public)/artist/[slug]/page.tsx`
- `/booking/success` → `app/(public)/booking/success/page.tsx`

### API Routes

- `/api/bookings/create` → `app/api/bookings/create/route.ts`
- `/api/calendar/slots` → `app/api/calendar/slots/route.ts`
- `/api/webhooks/stripe` → `app/api/webhooks/stripe/route.ts`

### Supabase Clients

- **Client Components**: `lib/supabase/client.ts`
- **Server Components**: `lib/supabase/server.ts`

### Composants supprimés

Tous les composants de gestion manuelle du calendrier ont été supprimés:
- `components/calendar/*` (sauf ceux réutilisés)
- Hooks calendrier (`useCalendar`, `useDisponibilites`, etc.)

### Nouveaux composants

- `components/booking/BookingModal.tsx`
- `components/booking/CalComSlotPicker.tsx`
- `components/booking/FlashGallery.tsx`
- `components/dashboard/BookingCard.tsx`
- `components/dashboard/StatsOverview.tsx`

## Migration des données

Les migrations Supabase sont disponibles dans `supabase/migrations/`:
- `001_add_cal_com_fields.sql`
- `002_refactor_bookings.sql`
- `003_add_flash_acompte.sql`

## Variables d'environnement

Voir `.env.local.example` pour la liste complète des variables requises.

## Déploiement

1. Installer les dépendances: `npm install`
2. Configurer les variables d'environnement
3. Exécuter les migrations Supabase
4. Déployer sur Vercel: `vercel --prod`
