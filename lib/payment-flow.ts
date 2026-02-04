/**
 * Flow automatisé de paiement pour les réservations
 * 
 * Flow :
 * 1. Réservation → Génération lien paiement acompte
 * 2. Acompte réglé → Email confirmation + ajout calendrier
 * 3. J-1 → Rappel solde restant
 * 4. Après session → Génération facture automatique
 */

import { PrismaClient, PaymentType, PaymentMethod, PaymentStatus, BookingStatus } from '@prisma/client';
import { stripe } from './stripe';
import {
  envoyerConfirmationReservation,
  envoyerRappel24h,
  relancerAcompteNonRegle,
  type BookingNotificationData,
} from './booking-notifications';

const prisma = new PrismaClient();

export type CreateDepositPaymentParams = {
  bookingId: string;
  artistId: string;
  amount: number; // En euros
  clientEmail: string;
  clientName: string;
  siteBaseUrl: string;
};

/**
 * 1. Génère le lien de paiement pour l'acompte lors de la réservation
 */
export async function genererLienPaiementAcompte(
  params: CreateDepositPaymentParams
): Promise<{ paymentId: string; paymentLink: string; paymentIntentId: string }> {
  const { bookingId, artistId, amount, clientEmail, clientName, siteBaseUrl } = params;

  // Récupérer l'artiste pour Stripe Connect
  const artist = await prisma.artistProfile.findUnique({
    where: { id: artistId },
    select: { stripeAccountId: true, stripeOnboardingComplete: true },
  });

  if (!artist?.stripeAccountId || !artist.stripeOnboardingComplete) {
    throw new Error('Artiste non configuré pour les paiements Stripe');
  }

  // Créer le PaymentIntent Stripe
  const amountCents = Math.round(amount * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    application_fee_amount: Math.round(amountCents * 0.05), // 5% commission
    transfer_data: {
      destination: artist.stripeAccountId,
    },
    description: `Acompte réservation - ${clientName}`,
    metadata: {
      booking_id: bookingId,
      artist_id: artistId,
      client_email: clientEmail,
      payment_type: 'deposit',
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Créer l'enregistrement Payment dans la DB
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      artistId,
      montant: amount,
      type: PaymentType.ACOMPTE,
      methode: PaymentMethod.STRIPE,
      statut: PaymentStatus.EN_ATTENTE,
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  // Créer le lien de paiement
  const paymentLink = `${siteBaseUrl}/paiement/${payment.id}?client_secret=${paymentIntent.client_secret}`;

  return {
    paymentId: payment.id,
    paymentLink,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * 2. Traite le paiement de l'acompte réglé (webhook Stripe)
 */
export async function traiterAcompteRegle(
  paymentIntentId: string
): Promise<{ bookingId: string; paymentId: string }> {
  // Récupérer le paiement
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: {
      booking: {
        include: {
          client: true,
          artist: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!payment || payment.type !== PaymentType.ACOMPTE) {
    throw new Error('Paiement introuvable ou type invalide');
  }

  // Mettre à jour le statut du paiement
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      statut: PaymentStatus.REGLE,
      dateReglement: new Date(),
    },
  });

  // Mettre à jour la réservation
  const booking = await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      depositPaid: true,
      status: BookingStatus.CONFIRMED,
      paymentIntent: paymentIntentId,
    },
    include: {
      client: true,
      artist: {
        include: {
          user: true,
        },
      },
    },
  });

  // Envoyer l'email de confirmation avec lien calendrier
  const heure = booking.startTime.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const notificationData: BookingNotificationData = {
    bookingId: booking.id,
    clientName: booking.client.name,
    clientEmail: booking.client.email,
    clientPhone: booking.client.phone || undefined,
    artistName: booking.artist.user.name,
    artistStudioName: booking.artist.nomStudio || undefined,
    date: booking.startTime,
    heure,
    duree: booking.durationMin,
    type: booking.type,
    prix: Number(booking.price),
    acompte: payment.montant ? Number(payment.montant) : undefined,
    acompteRegle: true,
    zone: booking.zone || undefined,
    taille: booking.size || undefined,
    style: booking.style || undefined,
    siteBaseUrl: process.env.VITE_SITE_URL || 'https://inkflow.app',
    cancelLink: `${process.env.VITE_SITE_URL || 'https://inkflow.app'}/bookings/${booking.id}/cancel`,
    modifyLink: `${process.env.VITE_SITE_URL || 'https://inkflow.app'}/bookings/${booking.id}/modify`,
    calendarLink: generateCalendarLink(booking),
  };

  await envoyerConfirmationReservation(notificationData);

  return {
    bookingId: booking.id,
    paymentId: payment.id,
  };
}

/**
 * Génère un lien iCal pour ajouter au calendrier
 */
function generateCalendarLink(booking: {
  id: string;
  startTime: Date;
  endTime: Date;
  client: { name: string };
  artist: { nomStudio: string | null; user: { name: string } };
}): string {
  const start = booking.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = booking.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const title = encodeURIComponent(`Tatouage - ${booking.artist.nomStudio || booking.artist.user.name}`);
  const description = encodeURIComponent(`Réservation InkFlow`);

  return `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
}

/**
 * 3. Génère le lien de paiement pour le solde restant
 */
export async function genererLienPaiementSolde(
  bookingId: string,
  siteBaseUrl: string
): Promise<{ paymentId: string; paymentLink: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payments: {
        where: {
          type: PaymentType.ACOMPTE,
          statut: PaymentStatus.REGLE,
        },
      },
      artist: {
        select: {
          id: true,
          stripeAccountId: true,
          stripeOnboardingComplete: true,
          user: {
            select: { name: true },
          },
        },
      },
      client: {
        select: { name: true, email: true },
      },
    },
  });

  if (!booking) {
    throw new Error('Réservation introuvable');
  }

  // Calculer le solde restant
  const totalPaye = booking.payments.reduce((sum, p) => sum + Number(p.montant), 0);
  const soldeRestant = Number(booking.price) - totalPaye;

  if (soldeRestant <= 0) {
    throw new Error('Aucun solde restant à régler');
  }

  const artist = booking.artist;
  if (!artist.stripeAccountId || !artist.stripeOnboardingComplete) {
    throw new Error('Artiste non configuré pour les paiements Stripe');
  }

  // Créer le PaymentIntent pour le solde
  const amountCents = Math.round(soldeRestant * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    application_fee_amount: Math.round(amountCents * 0.05),
    transfer_data: {
      destination: artist.stripeAccountId,
    },
    description: `Solde réservation - ${booking.client.name}`,
    metadata: {
      booking_id: bookingId,
      artist_id: artist.id,
      client_email: booking.client.email,
      payment_type: 'balance',
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Créer l'enregistrement Payment
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      artistId: artist.id,
      montant: soldeRestant,
      type: PaymentType.SOLDE,
      methode: PaymentMethod.STRIPE,
      statut: PaymentStatus.EN_ATTENTE,
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  const paymentLink = `${siteBaseUrl}/paiement/${payment.id}?client_secret=${paymentIntent.client_secret}`;

  return {
    paymentId: payment.id,
    paymentLink,
  };
}

/**
 * 4. Génère la facture automatique après la session
 */
export async function genererFactureAutomatique(bookingId: string): Promise<{ invoiceUrl: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payments: {
        orderBy: { createdAt: 'asc' },
      },
      client: true,
      artist: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error('Réservation introuvable');
  }

  // Vérifier que la session est terminée
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new Error('La session doit être terminée pour générer la facture');
  }

  // Créer un paiement TOTAL si pas déjà créé (pour la facture)
  let totalPayment = booking.payments.find((p) => p.type === PaymentType.TOTAL);
  if (!totalPayment) {
    totalPayment = await prisma.payment.create({
      data: {
        bookingId,
        artistId: booking.artistId,
        montant: booking.price,
        type: PaymentType.TOTAL,
        methode: PaymentMethod.STRIPE, // Par défaut, même si payé en espèces
        statut: PaymentStatus.REGLE,
        dateReglement: new Date(),
      },
    });
  }

  // Générer l'URL de la facture (PDF ou page web)
  const invoiceUrl = `${process.env.VITE_SITE_URL || 'https://inkflow.app'}/factures/${totalPayment.id}`;

  return { invoiceUrl };
}

/**
 * Enregistre un paiement en espèces ou virement
 */
export async function enregistrerPaiementManuel(
  bookingId: string,
  montant: number,
  type: PaymentType,
  methode: PaymentMethod.ESPECES | PaymentMethod.VIREMENT
): Promise<{ paymentId: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { artistId: true },
  });

  if (!booking) {
    throw new Error('Réservation introuvable');
  }

  const payment = await prisma.payment.create({
    data: {
      bookingId,
      artistId: booking.artistId,
      montant,
      type,
      methode,
      statut: PaymentStatus.REGLE,
      dateReglement: new Date(),
    },
  });

  // Si c'est l'acompte, mettre à jour la réservation
  if (type === PaymentType.ACOMPTE) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        depositPaid: true,
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  return { paymentId: payment.id };
}

/**
 * Vérifie et envoie les rappels pour les acomptes non réglés
 */
export async function verifierEtRelancerAcomptesNonRegles(): Promise<number> {
  const pendingDeposits = await prisma.payment.findMany({
    where: {
      type: PaymentType.ACOMPTE,
      statut: PaymentStatus.EN_ATTENTE,
      createdAt: {
        // Créés il y a plus de 24h
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    include: {
      booking: {
        include: {
          client: true,
          artist: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  let sent = 0;
  for (const payment of pendingDeposits) {
    const booking = payment.booking;
    const heure = booking.startTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const notificationData: BookingNotificationData = {
      bookingId: booking.id,
      clientName: booking.client.name,
      clientEmail: booking.client.email,
      artistName: booking.artist.user.name,
      artistStudioName: booking.artist.nomStudio || undefined,
      date: booking.startTime,
      heure,
      duree: booking.durationMin,
      type: booking.type,
      prix: Number(booking.price),
      acompte: Number(payment.montant),
      acompteRegle: false,
      siteBaseUrl: process.env.VITE_SITE_URL || 'https://inkflow.app',
      modifyLink: `${process.env.VITE_SITE_URL || 'https://inkflow.app'}/paiement/${payment.id}`,
    };

    const result = await relancerAcompteNonRegle(notificationData);
    if (result.ok) {
      sent++;
    }
  }

  return sent;
}

/**
 * Envoie le rappel solde restant J-1
 */
export async function envoyerRappelSoldeJ1(): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const bookingsTomorrow = await prisma.booking.findMany({
    where: {
      status: BookingStatus.CONFIRMED,
      startTime: {
        gte: tomorrow,
        lte: tomorrowEnd,
      },
    },
    include: {
      payments: true,
      client: true,
      artist: {
        include: {
          user: true,
        },
      },
    },
  });

  let sent = 0;
  for (const booking of bookingsTomorrow) {
    // Calculer le solde restant
    const totalPaye = booking.payments
      .filter((p) => p.statut === PaymentStatus.REGLE)
      .reduce((sum, p) => sum + Number(p.montant), 0);
    const soldeRestant = Number(booking.price) - totalPaye;

    // Si solde restant > 0, envoyer rappel
    if (soldeRestant > 0) {
      const heure = booking.startTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const { paymentLink } = await genererLienPaiementSolde(
        booking.id,
        process.env.VITE_SITE_URL || 'https://inkflow.app'
      );

      const notificationData: BookingNotificationData = {
        bookingId: booking.id,
        clientName: booking.client.name,
        clientEmail: booking.client.email,
        artistName: booking.artist.user.name,
        artistStudioName: booking.artist.nomStudio || undefined,
        date: booking.startTime,
        heure,
        duree: booking.durationMin,
        type: booking.type,
        prix: Number(booking.price),
        acompte: totalPaye > 0 ? totalPaye : undefined,
        acompteRegle: totalPaye > 0,
        siteBaseUrl: process.env.VITE_SITE_URL || 'https://inkflow.app',
        modifyLink: paymentLink,
      };

      const result = await envoyerRappel24h(notificationData);
      if (result.ok) {
        sent++;
      }
    }
  }

  return sent;
}
