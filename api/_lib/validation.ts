/**
 * Validation pour submit-project-request (copie locale pour déploiement Vercel).
 * Évite ERR_MODULE_NOT_FOUND sur ../utils/validation
 */

import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const submitProjectSchema = z
  .object({
    artist_id: z.string().min(1, 'Artist ID is required').regex(uuidRegex, 'Invalid artist ID format'),
    client_email: z.string().min(1, 'Email is required').email('Invalid email format').toLowerCase().trim().max(255, 'Email too long'),
    client_name: z.string().min(2, 'Name must be at least 2 characters').max(200, 'Name too long').trim(),
    body_part: z.string().min(1, 'Body part is required').max(100, 'Body part name too long').trim(),
    size_cm: z.number().int('Size must be an integer').positive().min(1, 'Size must be at least 1cm').max(1000, 'Size too large'),
    style: z.string().min(1, 'Style is required').max(100, 'Style name too long').trim(),
    description: z.string().min(10, 'Description must be at least 10 characters').max(4000, 'Description too long').trim(),
    budget_max: z.number().int().positive().max(10000000).nullable().optional(),
    is_cover_up: z.boolean().optional().default(false),
    is_first_tattoo: z.boolean().optional().default(false),
    availability: z.array(z.string().max(50)).max(7).nullable().optional(),
    reference_images: z.array(z.string().url()).max(10).nullable().optional(),
    ai_estimated_hours: z.number().positive().max(1000).nullable().optional(),
    ai_complexity_score: z.number().int().min(1).max(10).nullable().optional(),
    ai_price_range: z.string().max(100).nullable().optional(),
    ai_technical_notes: z.string().max(2000).nullable().optional(),
  })
  .strict();

export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function validateProjectSubmission(data: unknown): {
  success: true;
  data: z.infer<typeof submitProjectSchema>;
  error: null;
} | {
  success: false;
  data: null;
  error: string;
  details?: z.ZodIssue[];
} {
  try {
    const validated = submitProjectSchema.parse(data);
    return { success: true, data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return {
        success: false,
        data: null,
        error: first?.message ?? 'Validation failed',
        details: error.issues,
      };
    }
    return { success: false, data: null, error: 'Invalid input data' };
  }
}
