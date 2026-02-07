/**
 * Cron Job: Relance automatique des acomptes non réglés
 * Exécuté quotidiennement à 10h00
 * Route: GET /api/cron/relance-acomptes
 */

import { NextResponse } from 'next/server';
import { verifierEtRelancerAcomptesNonRegles } from '@/lib/payment-flow';

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
    const sent = await verifierEtRelancerAcomptesNonRegles();

    return NextResponse.json({
      success: true,
      sent,
      timestamp: new Date().toISOString(),
      message: `${sent} relance(s) d'acompte envoyée(s)`,
    });
  } catch (error: unknown) {
    console.error('Error in relance-acomptes cron:', error);
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
