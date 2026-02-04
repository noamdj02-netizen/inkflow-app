/**
 * API Route: Récupérer les créneaux disponibles pour un tatoueur
 * GET /api/creneaux?tatoueur={id}&duree={minutes}&debut={ISO}&fin={ISO}
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detecterCreneauxDisponibles, verifierDisponibilite } from '@/lib/booking-utils';
import { BookingType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tatoueurId = searchParams.get('tatoueur');
    const dureeParam = searchParams.get('duree');
    const debutParam = searchParams.get('debut');
    const finParam = searchParams.get('fin');
    const typeParam = searchParams.get('type') || 'SESSION';

    if (!tatoueurId || !dureeParam) {
      return NextResponse.json(
        { error: 'Paramètres manquants: tatoueur et duree sont requis' },
        { status: 400 }
      );
    }

    const duree = parseInt(dureeParam, 10);
    if (isNaN(duree) || duree <= 0) {
      return NextResponse.json(
        { error: 'Durée invalide' },
        { status: 400 }
      );
    }

    const debut = debutParam ? new Date(debutParam) : new Date();
    const fin = finParam ? new Date(finParam) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 jours

    if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
      return NextResponse.json(
        { error: 'Dates invalides' },
        { status: 400 }
      );
    }

    const type = typeParam.toUpperCase() as BookingType;
    if (!Object.values(BookingType).includes(type)) {
      return NextResponse.json(
        { error: 'Type de réservation invalide' },
        { status: 400 }
      );
    }

    // Récupérer les créneaux disponibles
    const slots = await detecterCreneauxDisponibles(
      tatoueurId,
      debut,
      fin,
      duree,
      type
    );

    // Formater les créneaux pour la réponse
    const creneaux = await Promise.all(
      slots.map(async (slot) => {
        // Vérifier la disponibilité réelle avec temps de préparation/nettoyage
        const disponibilite = await verifierDisponibilite(
          tatoueurId,
          slot.startTime,
          duree,
          type
        );

        return {
          id: `${tatoueurId}-${slot.startTime.toISOString()}`,
          debut: slot.startTime.toISOString(),
          fin: slot.endTime.toISOString(),
          disponible: disponibilite.available && slot.available,
          raisonIndisponible: disponibilite.available ? undefined : disponibilite.reason,
        };
      })
    );

    return NextResponse.json({
      creneaux: creneaux.filter((c) => c.disponible), // Retourner uniquement les disponibles
    });
  } catch (error: unknown) {
    console.error('Error fetching creneaux:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des créneaux',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
