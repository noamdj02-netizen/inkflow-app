/**
 * Validation Zod pour les réservations
 */

import { z } from 'zod';
import type { CreerReservationData, TypeReservation } from '../types/booking';

// Schéma de validation pour créer une réservation
export const schemaReservation = z.object({
  clientId: z.string().uuid('ID client invalide'),
  tatoueurId: z.string().uuid('ID tatoueur invalide'),
  dateDebut: z.date({
    required_error: 'La date de début est requise',
    invalid_type_error: 'La date de début doit être une date valide',
  }).refine(
    (date) => date >= new Date(),
    {
      message: 'La date de début ne peut pas être dans le passé',
    }
  ),
  duree: z.number({
    required_error: 'La durée est requise',
    invalid_type_error: 'La durée doit être un nombre',
  })
    .int('La durée doit être un nombre entier')
    .min(30, 'La durée minimum est de 30 minutes')
    .max(480, 'La durée maximum est de 8 heures (480 minutes)'),
  type: z.enum(['consultation', 'session', 'retouche'], {
    errorMap: () => ({ message: 'Type de réservation invalide' }),
  }),
  prix: z.number({
    required_error: 'Le prix est requis',
    invalid_type_error: 'Le prix doit être un nombre',
  })
    .positive('Le prix doit être positif')
    .max(10000, 'Le prix maximum est de 10000€'),
  acompte: z.number()
    .positive('L\'acompte doit être positif')
    .max(z.number(), 'L\'acompte ne peut pas dépasser le prix total')
    .optional(),
  projetDescription: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),
  zone: z.string()
    .max(100, 'La zone ne peut pas dépasser 100 caractères')
    .optional(),
  taille: z.string()
    .max(50, 'La taille ne peut pas dépasser 50 caractères')
    .optional(),
  style: z.string()
    .max(100, 'Le style ne peut pas dépasser 100 caractères')
    .optional(),
  photosReference: z.array(z.string().url('URL de photo invalide'))
    .max(10, 'Maximum 10 photos de référence')
    .optional()
    .default([]),
  notes: z.string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional(),
}).refine(
  (data) => {
    if (data.acompte !== undefined) {
      return data.acompte <= data.prix;
    }
    return true;
  },
  {
    message: 'L\'acompte ne peut pas dépasser le prix total',
    path: ['acompte'],
  }
);

export type ReservationInput = z.infer<typeof schemaReservation>;

/**
 * Valide les données d'une réservation
 */
export function validerReservation(data: unknown): {
  success: true;
  data: ReservationInput;
} | {
  success: false;
  errors: z.ZodError;
} {
  const result = schemaReservation.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Valide et transforme les données d'une réservation
 * Lance une erreur Zod si la validation échoue
 */
export function validerReservationStrict(data: unknown): ReservationInput {
  return schemaReservation.parse(data);
}

/**
 * Schéma pour mettre à jour une réservation
 */
export const schemaUpdateReservation = z.object({
  dateDebut: z.date()
    .refine((date) => date >= new Date(), {
      message: 'La date de début ne peut pas être dans le passé',
    })
    .optional(),
  duree: z.number()
    .int()
    .min(30)
    .max(480)
    .optional(),
  type: z.enum(['consultation', 'session', 'retouche']).optional(),
  prix: z.number()
    .positive()
    .max(10000)
    .optional(),
  statut: z.enum(['en_attente', 'confirmee', 'annulee', 'terminee']).optional(),
  projetDescription: z.string().max(2000).optional(),
  zone: z.string().max(100).optional(),
  taille: z.string().max(50).optional(),
  style: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
}).partial();

export type UpdateReservationInput = z.infer<typeof schemaUpdateReservation>;
