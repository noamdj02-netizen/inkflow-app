export const SLUG_REGEX = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const RESERVED_SLUGS = new Set([
  'login',
  'register',
  'dashboard',
  'payment',
  'onboarding',
  'client',
  'flashs',
  'project',
  'p',
  'api',
]);

export function normalizeSlug(input: string, separator: '-' | '_' = '-') {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, separator) // Remplacer les caractères spéciaux par le séparateur
    .replace(new RegExp(`${separator}+`, 'g'), separator) // Réduire les répétitions
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), ''); // Supprimer au début/fin
}

export function validatePublicSlug(slug: string): string | null {
  const s = slug.trim().toLowerCase();

  if (!s) return 'Le slug est requis.';
  if (s.length < 3) return 'Le slug doit contenir au moins 3 caractères.';
  if (s.length > 40) return 'Le slug ne peut pas dépasser 40 caractères.';
  if (RESERVED_SLUGS.has(s)) return 'Ce slug est réservé. Choisissez-en un autre.';

  // Lettres minuscules, chiffres, tirets et underscores. Pas d'espaces.
  if (!SLUG_REGEX.test(s)) {
    return 'Format invalide. Utilisez uniquement: a-z, 0-9, "-" ou "_" (sans espaces).';
  }

  return null;
}

