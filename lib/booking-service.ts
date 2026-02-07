/**
 * Service de réservation avec validation Zod et gestion d'erreurs explicite
 */

import { BookingStatus, BookingType } from '@prisma/client';
import { prisma } from './prisma';
import { validerReservationStrict, type ReservationInput } from './booking-validation';
import {
  CreneauIndisponibleError,
  ClientNotFoundError,
  ArtisteNotFoundError,
  ReservationNotFoundError,
  ReservationDejaConfirmeeError,
  ReservationDejaAnnuleeError,
} from './booking-errors';
import { checkSlotAvailability } from './booking-utils';
import type { CreerReservationData, StatutReservation } from '../types/booking';

/**
 * Mappe les types TypeScript vers les enums Prisma
 */
function mapTypeToPrisma(type: 'consultation' | 'session' | 'retouche'): BookingType {
  switch (type) {
    case 'consultation':
      return BookingType.CONSULTATION;
    case 'session':
      return BookingType.SESSION;
    case 'retouche':
      return BookingType.RETOUCHE;
  }
}

function mapStatusToPrisma(status: StatutReservation): BookingStatus {
  switch (status) {
    case 'en_attente':
      return BookingStatus.PENDING_PAYMENT;
    case 'confirmee':
      return BookingStatus.CONFIRMED;
    case 'annulee':
      return BookingStatus.CANCELLED;
    case 'terminee':
      return BookingStatus.COMPLETED;
  }
}

/**
 * Crée une réservation avec validation et vérification de disponibilité
 */
export async function creerReservation(
  data: CreerReservationData
): Promise<{ id: string; statut: StatutReservation }> {
  // 1. Validation Zod
  const validatedData = validerReservationStrict(data);

  // 2. Vérifier que le client existe
  const client = await prisma.user.findUnique({
    where: { id: validatedData.clientId },
  });
  if (!client) {
    throw new ClientNotFoundError(validatedData.clientId);
  }

  // 3. Vérifier que l'artiste existe
  const artist = await prisma.artistProfile.findUnique({
    where: { id: validatedData.tatoueurId },
  });
  if (!artist) {
    throw new ArtisteNotFoundError(validatedData.tatoueurId);
  }

  // 4. Calculer la date de fin
  const dateFin = new Date(validatedData.dateDebut.getTime() + validatedData.duree * 60 * 1000);

  // 5. Vérifier la disponibilité du créneau
  const availability = await checkSlotAvailability(
    validatedData.tatoueurId,
    validatedData.dateDebut,
    dateFin
  );

  if (!availability.available) {
    throw new CreneauIndisponibleError(
      'Ce créneau n\'est plus disponible',
      availability.reason,
      validatedData.dateDebut,
      dateFin
    );
  }

  // 6. Créer la réservation
  const booking = await prisma.booking.create({
    data: {
      clientId: validatedData.clientId,
      artistId: validatedData.tatoueurId,
      startTime: validatedData.dateDebut,
      endTime: dateFin,
      type: mapTypeToPrisma(validatedData.type),
      durationMin: validatedData.duree,
      status: BookingStatus.PENDING_PAYMENT,
      price: validatedData.prix,
      depositAmount: validatedData.acompte,
      depositPaid: false,
      projectDescription: validatedData.projetDescription,
      zone: validatedData.zone,
      size: validatedData.taille,
      style: validatedData.style,
      referencePhotos: validatedData.photosReference || [],
      notes: validatedData.notes,
    },
  });

  return {
    id: booking.id,
    statut: 'en_attente',
  };
}

/**
 * Confirme une réservation (après paiement de l'acompte)
 */
export async function confirmerReservation(reservationId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: reservationId },
  });

  if (!booking) {
    throw new ReservationNotFoundError(reservationId);
  }

  if (booking.status === BookingStatus.CONFIRMED) {
    throw new ReservationDejaConfirmeeError(reservationId);
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new ReservationDejaAnnuleeError(reservationId);
  }

  await prisma.booking.update({
    where: { id: reservationId },
    data: {
      status: BookingStatus.CONFIRMED,
      depositPaid: true,
    },
  });
}

/**
 * Annule une réservation
 */
export async function annulerReservation(reservationId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: reservationId },
  });

  if (!booking) {
    throw new ReservationNotFoundError(reservationId);
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new ReservationDejaAnnuleeError(reservationId);
  }

  await prisma.booking.update({
    where: { id: reservationId },
    data: {
      status: BookingStatus.CANCELLED,
    },
  });
}

/**
 * Marque une réservation comme terminée
 */
export async function terminerReservation(reservationId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: reservationId },
  });

  if (!booking) {
    throw new ReservationNotFoundError(reservationId);
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new Error(`Impossible de terminer une réservation avec le statut: ${booking.status}`);
  }

  await prisma.booking.update({
    where: { id: reservationId },
    data: {
      status: BookingStatus.COMPLETED,
    },
  });
}
