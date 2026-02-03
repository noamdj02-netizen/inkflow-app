/**
 * API Route: Récupérer les créneaux disponibles pour un artiste
 * 
 * POST /api/availability
 * 
 * Retourne les créneaux disponibles sur une période donnée
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/booking-utils';

type AvailabilityRequest = {
  artistId: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  serviceDurationMin: number;
  slotIntervalMin?: number; // Optionnel, défaut 30
};

export async function POST(request: NextRequest) {
  try {
    const body: AvailabilityRequest = await request.json();

    // Validation
    if (!body.artistId || !body.startDate || !body.endDate || !body.serviceDurationMin) {
      return NextResponse.json(
        { error: 'Champs manquants: artistId, startDate, endDate, serviceDurationMin sont requis' },
        { status: 400 }
      );
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Format de date invalide (attendu ISO 8601)' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'startDate doit être antérieure à endDate' },
        { status: 400 }
      );
    }

    // Récupérer les créneaux disponibles
    const slots = await getAvailableSlots(
      body.artistId,
      startDate,
      endDate,
      body.serviceDurationMin,
      body.slotIntervalMin || 30
    );

    return NextResponse.json({
      success: true,
      slots: slots.map((slot) => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        available: slot.available,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      {
        error: 'Une erreur est survenue lors de la récupération des créneaux',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
