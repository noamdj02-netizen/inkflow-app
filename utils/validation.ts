/**
 * Zod Validation Schemas
 * 
 * Input validation and sanitization for API routes
 * Uses Zod to prevent injection attacks and bad data entry
 */

import { z } from 'zod';

/**
 * Email validation regex (RFC 5322 compliant, simplified)
 */
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * UUID validation
 */
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Message d'erreur unique pour mot de passe faible (évite alertes Chrome)
 */
export const PASSWORD_ERROR_MESSAGE =
  'Votre mot de passe doit être plus complexe pour garantir la sécurité de votre compte.';

/**
 * Schéma Zod pour mot de passe strict (min 8 car., majuscule, chiffre, caractère spécial)
 */
export const passwordSchema = z
  .string()
  .min(8, PASSWORD_ERROR_MESSAGE)
  .refine((p) => /[A-Z]/.test(p), PASSWORD_ERROR_MESSAGE)
  .refine((p) => /[0-9]/.test(p), PASSWORD_ERROR_MESSAGE)
  .refine((p) => /[@$!%*?&]/.test(p), PASSWORD_ERROR_MESSAGE);

/**
 * Valide un mot de passe côté client (inscription, réinitialisation).
 * Retourne { success: true } ou { success: false, error: string }.
 */
export function validatePasswordResult(
  password: string
): { success: true } | { success: false; error: string } {
  const result = passwordSchema.safeParse(password);
  if (result.success) return { success: true };
  const msg = result.error.errors[0]?.message ?? PASSWORD_ERROR_MESSAGE;
  return { success: false, error: msg };
}

/**
 * Project Submission Schema
 * 
 * Strict schema that rejects unknown keys
 */
export const submitProjectSchema = z.object({
  artist_id: z
    .string()
    .min(1, 'Artist ID is required')
    .regex(uuidRegex, 'Invalid artist ID format'),
  
  client_email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .max(255, 'Email too long'),
  
  client_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name too long')
    .trim(),
  
  body_part: z
    .string()
    .min(1, 'Body part is required')
    .max(100, 'Body part name too long')
    .trim(),
  
  size_cm: z
    .number()
    .int('Size must be an integer')
    .positive('Size must be positive')
    .min(1, 'Size must be at least 1cm')
    .max(1000, 'Size too large'),
  
  style: z
    .string()
    .min(1, 'Style is required')
    .max(100, 'Style name too long')
    .trim(),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description too long')
    .trim(),
  
  budget_max: z
    .number()
    .int('Budget must be an integer')
    .positive('Budget must be positive')
    .max(10000000, 'Budget too large') // 100,000€ in centimes
    .nullable()
    .optional(),
  
  is_cover_up: z.boolean().optional().default(false),
  is_first_tattoo: z.boolean().optional().default(false),
  
  availability: z
    .array(z.string().max(50))
    .max(7, 'Too many availability days')
    .nullable()
    .optional(),
  
  reference_images: z
    .array(z.string().url('Invalid image URL'))
    .max(10, 'Too many reference images')
    .nullable()
    .optional(),
  
  // AI analysis fields (optional)
  ai_estimated_hours: z
    .number()
    .positive()
    .max(1000)
    .nullable()
    .optional(),
  
  ai_complexity_score: z
    .number()
    .int()
    .min(1)
    .max(10)
    .nullable()
    .optional(),
  
  ai_price_range: z
    .string()
    .max(100)
    .nullable()
    .optional(),
  
  ai_technical_notes: z
    .string()
    .max(2000)
    .nullable()
    .optional(),
}).strict(); // Reject unknown keys

/**
 * Booking Form Schema (for Flash bookings from public profile)
 */
export const bookingFormSchema = z.object({
  client_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom est trop long')
    .trim(),
  
  client_email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide')
    .toLowerCase()
    .trim()
    .max(255, 'Email trop long'),
  
  client_phone: z
    .string()
    .max(20, 'Numéro de téléphone trop long')
    .trim()
    .optional()
    .nullable(),
  
  date_souhaitee: z
    .string()
    .min(1, 'La date est requise'),
  
  commentaire: z
    .string()
    .max(1000, 'Le commentaire est trop long')
    .trim()
    .optional()
    .nullable(),
}).strict();

/**
 * Booking Form Data Type
 */
export type BookingFormData = z.infer<typeof bookingFormSchema>;

/**
 * Care Instructions Schema
 */
export const careInstructionsSchema = z.object({
  project_id: z
    .string()
    .min(1, 'Project ID is required')
    .regex(uuidRegex, 'Invalid project ID format'),
  
  care_template_id: z
    .string()
    .regex(uuidRegex, 'Invalid template ID format')
    .nullable()
    .optional(),
  
  custom_care_instructions: z
    .string()
    .max(5000, 'Instructions too long')
    .trim()
    .nullable()
    .optional(),
}).strict();

/**
 * Sanitize HTML to prevent XSS
 * Escapes special characters for safe rendering in emails/HTML
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize text for plain text emails
 * Removes HTML tags and normalizes whitespace
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';
  
  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate and sanitize project submission data
 */
export function validateProjectSubmission(data: unknown) {
  try {
    const validated = submitProjectSchema.parse(data);
    return { success: true, data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        data: null,
        error: firstError.message || 'Validation failed',
        details: error.issues,
      };
    }
    return {
      success: false,
      data: null,
      error: 'Invalid input data',
      details: null,
    };
  }
}
