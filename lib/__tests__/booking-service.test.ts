/**
 * Tests unitaires pour le système de réservation
 * Utilise Vitest (compatible avec Vite)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { creerReservation, confirmerReservation, annulerReservation } from '../booking-service';
import {
  CreneauIndisponibleError,
  ClientNotFoundError,
  ArtisteNotFoundError,
  ReservationNotFoundError,
  ReservationDejaConfirmeeError,
  ReservationDejaAnnuleeError,
} from '../booking-errors';

// Mock Prisma
vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    artistProfile: {
      findUnique: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock booking-utils
vi.mock('../booking-utils', () => ({
  checkSlotAvailability: vi.fn(),
}));

import { prisma } from '../prisma';
import { checkSlotAvailability } from '../booking-utils';

describe('Système de réservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock par défaut : créneau disponible
    vi.mocked(checkSlotAvailability).mockResolvedValue({ available: true });
  });

  describe('creerReservation', () => {
    it('devrait bloquer les créneaux qui se chevauchent', async () => {
      const mockClient = { id: 'client-1', email: 'client@test.com', name: 'Client Test' };
      const mockArtist = {
        id: 'artist-1',
        userId: 'user-1',
        slug: 'test-artist',
        defaultPrepTimeMin: 15,
        defaultCleanupTimeMin: 15,
        bufferTimeMin: 0,
      };

      // Mock client et artiste existants
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);
      vi.mocked(prisma.artistProfile.findUnique).mockResolvedValue(mockArtist as any);

      // Premier RDV créé avec succès
      const rdv1 = {
        id: 'booking-1',
        startTime: new Date('2024-03-01T10:00:00Z'),
        endTime: new Date('2024-03-01T12:00:00Z'),
        status: 'CONFIRMED',
      };

      // Mock disponibilité pour le premier RDV
      vi.mocked(checkSlotAvailability).mockResolvedValueOnce({ available: true });
      vi.mocked(prisma.booking.create).mockResolvedValueOnce({
        ...rdv1,
        clientId: 'client-1',
        artistId: 'artist-1',
        type: 'SESSION',
        durationMin: 120,
        price: 200,
        depositAmount: 60,
        depositPaid: false,
      } as any);

      const result1 = await creerReservation({
        clientId: 'client-1',
        tatoueurId: 'artist-1',
        dateDebut: new Date('2024-03-01T10:00:00Z'),
        duree: 120,
        type: 'session',
        prix: 200,
        acompte: 60,
      });

      expect(result1.id).toBe('booking-1');

      // Tentative de créer un RDV qui chevauche (11h00, 60min -> finit à 12h00, chevauche avec le premier)
      vi.mocked(checkSlotAvailability).mockResolvedValueOnce({
        available: false,
        reason: 'Créneau chevauchant une réservation existante',
      });

      await expect(
        creerReservation({
          clientId: 'client-1',
          tatoueurId: 'artist-1',
          dateDebut: new Date('2024-03-01T11:00:00Z'),
          duree: 60,
          type: 'session',
          prix: 100,
        })
      ).rejects.toThrow(CreneauIndisponibleError);
    });

    it('devrait rejeter une réservation avec une date dans le passé', async () => {
      const datePassee = new Date();
      datePassee.setFullYear(datePassee.getFullYear() - 1); // Il y a 1 an
      
      await expect(
        creerReservation({
          clientId: 'client-1',
          tatoueurId: 'artist-1',
          dateDebut: datePassee,
          duree: 120,
          type: 'session',
          prix: 200,
        })
      ).rejects.toThrow();
    });

    it('devrait rejeter une réservation avec une durée invalide', async () => {
      await expect(
        creerReservation({
          clientId: 'client-1',
          tatoueurId: 'artist-1',
          dateDebut: new Date('2024-03-01T10:00:00Z'),
          duree: 10, // Trop court (< 30min)
          type: 'session',
          prix: 200,
        })
      ).rejects.toThrow();

      await expect(
        creerReservation({
          clientId: 'client-1',
          tatoueurId: 'artist-1',
          dateDebut: new Date('2024-03-01T10:00:00Z'),
          duree: 500, // Trop long (> 480min)
          type: 'session',
          prix: 200,
        })
      ).rejects.toThrow();
    });

    it('devrait rejeter une réservation avec un client inexistant', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        creerReservation({
          clientId: 'client-inexistant',
          tatoueurId: 'artist-1',
          dateDebut: new Date('2024-03-01T10:00:00Z'),
          duree: 120,
          type: 'session',
          prix: 200,
        })
      ).rejects.toThrow(ClientNotFoundError);
    });

    it('devrait rejeter une réservation avec un artiste inexistant', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'client-1',
        email: 'client@test.com',
        name: 'Client Test',
      } as any);
      vi.mocked(prisma.artistProfile.findUnique).mockResolvedValue(null);

      await expect(
        creerReservation({
          clientId: 'client-1',
          tatoueurId: 'artist-inexistant',
          dateDebut: new Date('2024-03-01T10:00:00Z'),
          duree: 120,
          type: 'session',
          prix: 200,
        })
      ).rejects.toThrow(ArtisteNotFoundError);
    });

    it('devrait créer une réservation valide', async () => {
      const mockClient = { id: 'client-1', email: 'client@test.com', name: 'Client Test' };
      const mockArtist = {
        id: 'artist-1',
        userId: 'user-1',
        slug: 'test-artist',
        defaultPrepTimeMin: 15,
        defaultCleanupTimeMin: 15,
        bufferTimeMin: 0,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);
      vi.mocked(prisma.artistProfile.findUnique).mockResolvedValue(mockArtist as any);
      vi.mocked(checkSlotAvailability).mockResolvedValue({ available: true });
      vi.mocked(prisma.booking.create).mockResolvedValue({
        id: 'booking-1',
        clientId: 'client-1',
        artistId: 'artist-1',
        startTime: new Date('2024-03-01T10:00:00Z'),
        endTime: new Date('2024-03-01T12:00:00Z'),
        type: 'SESSION',
        durationMin: 120,
        status: 'PENDING_PAYMENT',
        price: 200,
        depositAmount: 60,
        depositPaid: false,
      } as any);

      const result = await creerReservation({
        clientId: 'client-1',
        tatoueurId: 'artist-1',
        dateDebut: new Date('2024-03-01T10:00:00Z'),
        duree: 120,
        type: 'session',
        prix: 200,
        acompte: 60,
        projetDescription: 'Tatouage bras',
        zone: 'Bras',
        taille: '10x15cm',
        style: 'Réalisme',
      });

      expect(result.id).toBe('booking-1');
      expect(result.statut).toBe('en_attente');
      expect(prisma.booking.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmerReservation', () => {
    it('devrait confirmer une réservation en attente', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        id: 'booking-1',
        status: 'PENDING_PAYMENT',
        depositPaid: false,
      } as any);
      vi.mocked(prisma.booking.update).mockResolvedValue({
        id: 'booking-1',
        status: 'CONFIRMED',
        depositPaid: true,
      } as any);

      await confirmerReservation('booking-1');

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          status: 'CONFIRMED',
          depositPaid: true,
        },
      });
    });

    it('devrait rejeter la confirmation d\'une réservation déjà confirmée', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        id: 'booking-1',
        status: 'CONFIRMED',
      } as any);

      await expect(confirmerReservation('booking-1')).rejects.toThrow(
        ReservationDejaConfirmeeError
      );
    });

    it('devrait rejeter la confirmation d\'une réservation inexistante', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

      await expect(confirmerReservation('booking-inexistant')).rejects.toThrow(
        ReservationNotFoundError
      );
    });
  });

  describe('annulerReservation', () => {
    it('devrait annuler une réservation', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        id: 'booking-1',
        status: 'CONFIRMED',
      } as any);
      vi.mocked(prisma.booking.update).mockResolvedValue({
        id: 'booking-1',
        status: 'CANCELLED',
      } as any);

      await annulerReservation('booking-1');

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          status: 'CANCELLED',
        },
      });
    });

    it('devrait rejeter l\'annulation d\'une réservation déjà annulée', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        id: 'booking-1',
        status: 'CANCELLED',
      } as any);

      await expect(annulerReservation('booking-1')).rejects.toThrow(
        ReservationDejaAnnuleeError
      );
    });
  });
});
