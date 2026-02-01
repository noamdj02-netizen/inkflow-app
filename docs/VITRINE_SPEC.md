# Vitrine publique – Spécifications et checklist

## Data fetching

- **Source** : DB via slug (`/p/:slug` ou `/:slug`).
- **Hook** : `usePublicArtist(slug)` dans `hooks/usePublicArtist.ts` (SWR, revalidation 3600s).
- **Données artiste** : nom, bio (`bio_instagram`), localisation (`ville`), note (`rating`), nb avis (`nb_avis`), années d’expérience (`years_experience`), Instagram (via bio ou à venir).
- **Portfolio flashs** : image (`image_url`), titre, prix (centimes → euros), disponibilité (`statut`, `stock_current` / `stock_limit`).
- **Optimisations** : SWR avec `refreshInterval: 3600_000` (ISR-like), images via `OptimizedImage` (lazy + priority pour les 4 premières), prefetch possible via `prefetchPublicArtist(slug)`.

## Grille flashs (CSS/Tailwind)

- **Layout** : `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6`.
- **Cartes** : `aspect-[3/4]`, `rounded-lg`, `bg-neutral-900`.
- **Image** : `OptimizedImage` en plein cadre, `object-cover`, `sizes="(max-width: 768px) 50vw, 25vw"`, `transition-transform duration-300 group-hover:scale-105`.
- **Overlay bas** : `bg-gradient-to-t from-black/80 p-4` → titre (`font-semibold text-white`) + prix (`font-mono text-lg text-amber-400`).
- **Hover** : overlay « Réserver » avec bouton.

## Header sticky

- **Classes** : `sticky top-0 z-50 border-b border-neutral-800 bg-black/95 backdrop-blur-sm`.
- **Contenu** : logo (lien InkFlow) + avatar 48×48 + nom studio (`font-serif text-2xl`) + ligne « localisation • ⭐ note » (`text-sm text-neutral-400`) + CTA « Réserver » (`rounded-full bg-white px-8 py-3 font-semibold text-black`).

## Barre URL décorative

- **Bloc** : `bg-neutral-900 py-2 text-center`.
- **Texte** : `font-mono text-sm text-neutral-500` → `inkflow.app/{slug}`.

## Responsive (mobile-first)

- **Breakpoints** : mobile &lt; 768px, tablet 768–1024px, desktop &gt; 1024px.
- **Grille** : 2 colonnes sur mobile, 3 tablette, 4 desktop.
- **Header** : logo/texte plus compact sur mobile.
- **CTA** : barre fixe en bas sur mobile (`PublicProfileCTA`).
- **Typo** : au moins `text-sm` (14px) sur mobile pour le contenu principal.

## Checklist qualité

- [x] Images : `OptimizedImage` + `priority` pour les 4 premières (LCP).
- [x] Grille : `aspect-[3/4]` + gaps fixes → pas de décalage (CLS maîtrisé).
- [x] Bouton Réserver : header + overlay carte + barre fixe mobile.
- [x] Contrastes : fond noir/neutral-900, texte blanc/neutral-400 (≥ 4.5:1).
- [x] Aucun texte &lt; 14px sur mobile (usage de `text-sm` minimum).
- [x] Hover sur cartes et CTA.
- [x] Meta Open Graph (title, description, image, url, type) + Twitter card.
- [x] Favicon + Apple touch icon (déjà dans `index.html`).

## Migration DB (optionnel)

- Fichier : `supabase/migration-vitrine-artist-fields.sql`.
- Colonnes ajoutées à `artists` : `ville`, `rating`, `nb_avis`, `years_experience`.
- À appliquer si vous voulez afficher localisation, note et années d’expérience depuis la DB.
