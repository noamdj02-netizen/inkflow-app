import { z } from 'zod';

// Fonction pour nettoyer les entrées et protéger contre XSS
const sanitizeString = (str: string): string => {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer les scripts
    .replace(/<[^>]+>/g, '') // Supprimer les balises HTML
    .trim();
};

// Schéma de validation pour le formulaire de réservation
export const bookingFormSchema = z.object({
  client_name: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long')
    .transform(sanitizeString)
    .refine((val) => val.length >= 2, 'Le nom doit contenir au moins 2 caractères'),
  
  client_email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide')
    .toLowerCase()
    .trim(),
  
  client_phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.replace(/\D/g, '').length >= 10,
      'Le téléphone doit contenir au moins 10 chiffres'
    )
    .transform((val) => val ? val.replace(/\D/g, '') : ''),
  
  date_souhaitee: z
    .string()
    .min(1, 'La date est requise')
    .refine(
      (val) => {
        const date = new Date(val);
        const now = new Date();
        return date > now;
      },
      'La date ne peut pas être dans le passé'
    ),
  
  commentaire: z
    .string()
    .max(500, 'Le commentaire ne peut pas dépasser 500 caractères')
    .optional()
    .transform((val) => val ? sanitizeString(val) : ''),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

