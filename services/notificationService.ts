import { supabase } from './supabase';

interface NotificationOptions {
  to: string; // Email ou numéro de téléphone
  type: 'email' | 'sms';
  subject?: string;
  message: string;
  bookingId?: string;
}

/**
 * Service de notifications pour les réservations
 * Utilise Supabase Edge Functions ou des services externes (Resend, Twilio)
 */
export const sendNotification = async (options: NotificationOptions) => {
  try {
    if (options.type === 'email') {
      return await sendEmail(options);
    } else {
      return await sendSMS(options);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Envoyer un email via Supabase Edge Function ou Resend
 */
const sendEmail = async (options: NotificationOptions) => {
  // Option 1: Utiliser une Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: options.to,
      subject: options.subject || 'Notification InkFlow',
      html: options.message,
      booking_id: options.bookingId,
    },
  });

  if (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }

  return { success: true, data };
};

/**
 * Envoyer un SMS via Supabase Edge Function ou Twilio
 */
const sendSMS = async (options: NotificationOptions) => {
  // Option 1: Utiliser une Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: {
      to: options.to,
      message: options.message,
      booking_id: options.bookingId,
    },
  });

  if (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }

  return { success: true, data };
};

/**
 * Envoyer un rappel de rendez-vous (48h avant)
 */
export const sendBookingReminder = async (bookingId: string) => {
  try {
    // Récupérer les infos de la réservation
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, flashs(title), projects(body_part, style)')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    const dateDebut = new Date(booking.date_debut);
    const formattedDate = dateDebut.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `
Bonjour ${booking.client_name || 'Client'},

Rappel : Vous avez un rendez-vous de tatouage prévu le ${formattedDate}.

${booking.flash_id ? `Flash : ${(booking as any).flashs?.title || 'N/A'}` : `Projet : ${(booking as any).projects?.body_part || 'N/A'}`}

Lieu : [Adresse du studio]
Montant restant à payer : ${((booking.prix_total - booking.deposit_amount) / 100).toFixed(2)}€

À bientôt !
L'équipe InkFlow
    `.trim();

    // Envoyer par email
    if (booking.client_email) {
      await sendNotification({
        to: booking.client_email,
        type: 'email',
        subject: `Rappel : Rendez-vous le ${formattedDate}`,
        message,
        bookingId,
      });
    }

    // Envoyer par SMS si disponible
    if (booking.client_phone) {
      await sendNotification({
        to: booking.client_phone,
        type: 'sms',
        message: `Rappel InkFlow : Rendez-vous le ${formattedDate}. ${booking.flash_id ? `Flash : ${(booking as any).flashs?.title}` : `Projet personnalisé`}`,
        bookingId,
      });
    }

    // Mettre à jour le statut du rappel
    await supabase
      .from('bookings')
      .update({
        reminder_sent_at: new Date().toISOString(),
        reminder_sms_sent: !!booking.client_phone,
      })
      .eq('id', bookingId);

    return { success: true };
  } catch (error) {
    console.error('Error sending booking reminder:', error);
    throw error;
  }
};

/**
 * Envoyer une notification de confirmation de réservation
 */
export const sendBookingConfirmation = async (bookingId: string) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, flashs(title), projects(body_part, style)')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    const dateDebut = new Date(booking.date_debut);
    const formattedDate = dateDebut.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `
Bonjour ${booking.client_name || 'Client'},

Votre réservation a été confirmée !

📅 Date : ${formattedDate}
💰 Acompte payé : ${(booking.deposit_amount / 100).toFixed(2)}€
💳 Montant restant : ${((booking.prix_total - booking.deposit_amount) / 100).toFixed(2)}€

${booking.flash_id ? `Flash réservé : ${(booking as any).flashs?.title || 'N/A'}` : `Projet : ${(booking as any).projects?.body_part || 'N/A'}`}

Vous recevrez un rappel 24h avant votre rendez-vous.

À bientôt !
L'équipe InkFlow
    `.trim();

    if (booking.client_email) {
      await sendNotification({
        to: booking.client_email,
        type: 'email',
        subject: 'Confirmation de réservation - InkFlow',
        message,
        bookingId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    throw error;
  }
};

