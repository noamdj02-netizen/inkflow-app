/**
 * API Route: Récupérer un artiste par son slug
 * GET /api/artists/[slug]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    const artist = await prisma.artistProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        nomStudio: true,
        depositPercentage: true,
        avatarUrl: true,
        bioInstagram: true,
      },
    });

    if (!artist) {
      return NextResponse.json(
        { error: 'Artiste non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'artiste:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
