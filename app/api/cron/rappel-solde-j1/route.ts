/**
 * Cron Job: Rappel solde restant J-1 (24h avant le rendez-vous)
 * Exécuté quotidiennement à 9h00
 * Route: GET /api/cron/rappel-solde-j1
 */

import { NextResponse } from 'next/server';
import { envoyerRappelSoldeJ1 } from '@/lib/payment-flow';

export async function GET(request: Request) {
  // Vérifier l'authentification (header secret pour sécuriser le cron)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const sent = await envoyerRappelSoldeJ1();

    return NextResponse.json({
      success: true,
      sent,
      timestamp: new Date().toISOString(),
      message: `${sent} rappel(s) de solde envoyé(s)`,
    });
  } catch (error: unknown) {
    console.error('Error in rappel-solde-j1 cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
