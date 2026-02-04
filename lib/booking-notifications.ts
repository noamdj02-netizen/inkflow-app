/**
 * Système de notifications automatiques pour les réservations
 * Emails/SMS de confirmation, rappels, relances, etc.
 */

import { BookingStatus, BookingType } from '@prisma/client';

const RESEND_API = 'https://api.resend.com/emails';

function getEnv(name: string): string | null {
  const v = process.env[name];
  return v && typeof v === 'string' && v.trim() ? v.trim() : null;
}

async function sendResend(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const apiKey = getEnv('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'Missing RESEND_API_KEY' };
  const from = getEnv('RESEND_FROM_EMAIL') || 'InkFlow <onboarding@resend.dev>';

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      reply_to: args.replyTo,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string; error?: string };
  if (!res.ok) {
    const msg = data?.message || data?.error || `Resend HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  return { ok: true, messageId: data?.id };
}

export type BookingNotificationData = {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  artistName: string;
  artistStudioName?: string;
  date: Date;
  heure: string;
  duree: number; // minutes
  type: BookingType;
  prix: number;
  acompte?: number;
  acompteRegle: boolean;
  zone?: string;
  taille?: string;
  style?: string;
  adresseStudio?: string;
  siteBaseUrl: string;
  cancelLink?: string;
  modifyLink?: string;
  calendarLink?: string;
};

/**
 * Envoie la confirmation immédiate de réservation
 */
export async function envoyerConfirmationReservation(
  data: BookingNotificationData
): Promise<{ ok: boolean; error?: string }> {
  const sujet = `✅ Réservation confirmée - ${data.artistStudioName || data.artistName}`;
  
  const contenu = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: 600; color: #666; }
        .value { color: #333; margin-top: 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .button-secondary { background: #6c757d; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Réservation confirmée</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          
          <p>Votre réservation est confirmée :</p>
          
          <div class="info-row">
            <div class="label">📅 Date</div>
            <div class="value">${data.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          
          <div class="info-row">
            <div class="label">⏰ Heure</div>
            <div class="value">${data.heure}</div>
          </div>
          
          <div class="info-row">
            <div class="label">⏱️ Durée estimée</div>
            <div class="value">${Math.floor(data.duree / 60)}h${data.duree % 60 > 0 ? `${data.duree % 60}min` : ''}</div>
          </div>
          
          ${data.type === BookingType.CONSULTATION ? '<div class="info-row"><div class="label">Type</div><div class="value">Consultation</div></div>' : ''}
          ${data.type === BookingType.RETOUCHE ? '<div class="info-row"><div class="label">Type</div><div class="value">Retouche</div></div>' : ''}
          
          ${data.zone ? `<div class="info-row"><div class="label">Zone</div><div class="value">${data.zone}</div></div>` : ''}
          ${data.taille ? `<div class="info-row"><div class="label">Taille</div><div class="value">${data.taille}</div></div>` : ''}
          ${data.style ? `<div class="info-row"><div class="label">Style</div><div class="value">${data.style}</div></div>` : ''}
          
          <div class="info-row">
            <div class="label">💰 Prix total</div>
            <div class="value">${data.prix.toFixed(2)}€</div>
          </div>
          
          ${data.acompte ? `
            <div class="info-row">
              <div class="label">💳 Acompte</div>
              <div class="value">${data.acompte.toFixed(2)}€ ${data.acompteRegle ? '(✅ Réglé)' : '(⏳ En attente)'}</div>
            </div>
          ` : ''}
          
          ${data.adresseStudio ? `
            <div class="info-row">
              <div class="label">📍 Adresse</div>
              <div class="value">${data.adresseStudio}</div>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; text-align: center;">
            ${data.cancelLink ? `<a href="${data.cancelLink}" class="button button-secondary">Annuler</a>` : ''}
            ${data.modifyLink ? `<a href="${data.modifyLink}" class="button button-secondary">Modifier</a>` : ''}
            ${data.calendarLink ? `<a href="${data.calendarLink}" class="button">Ajouter au calendrier</a>` : ''}
          </div>
        </div>
        <div class="footer">
          <p>InkFlow - Gestion simplifiée pour tatoueurs pro</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${data.clientName},

Votre réservation est confirmée :

📅 Date : ${data.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
⏰ Heure : ${data.heure}
⏱️ Durée estimée : ${Math.floor(data.duree / 60)}h${data.duree % 60 > 0 ? `${data.duree % 60}min` : ''}
💰 Prix total : ${data.prix.toFixed(2)}€
${data.acompte ? `💳 Acompte : ${data.acompte.toFixed(2)}€ ${data.acompteRegle ? '(Réglé)' : '(En attente)'}` : ''}
${data.adresseStudio ? `📍 Adresse : ${data.adresseStudio}` : ''}

${data.cancelLink ? `Annuler : ${data.cancelLink}` : ''}
${data.modifyLink ? `Modifier : ${data.modifyLink}` : ''}
${data.calendarLink ? `Ajouter au calendrier : ${data.calendarLink}` : ''}

InkFlow
  `;

  try {
    const result = await sendResend({
      to: data.clientEmail,
      subject: sujet,
      html: contenu,
      text: text,
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}

/**
 * Envoie un rappel 48h avant le rendez-vous
 */
export async function envoyerRappel48h(data: BookingNotificationData): Promise<{ ok: boolean; error?: string }> {
  const sujet = `📅 Rappel : Rendez-vous dans 48h - ${data.artistStudioName || data.artistName}`;
  
  const contenu = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Rappel : Rendez-vous dans 48h</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          
          <p>Nous vous rappelons votre rendez-vous :</p>
          
          <p><strong>📅 ${data.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${data.heure}</strong></p>
          
          <p>Merci de confirmer votre présence en cliquant sur le bouton ci-dessous.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.modifyLink || '#'}" class="button">Confirmer ma présence</a>
          </div>
          
          ${data.cancelLink ? `<p style="text-align: center; margin-top: 15px;"><a href="${data.cancelLink}" style="color: #999; text-decoration: none;">Annuler le rendez-vous</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${data.clientName},

Rappel : Votre rendez-vous est prévu dans 48h.

📅 ${data.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${data.heure}

Merci de confirmer votre présence.
${data.modifyLink ? `Confirmer : ${data.modifyLink}` : ''}
${data.cancelLink ? `Annuler : ${data.cancelLink}` : ''}

InkFlow
  `;

  try {
    const result = await sendResend({
      to: data.clientEmail,
      subject: sujet,
      html: contenu,
      text: text,
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}

/**
 * Envoie un rappel 24h avant le rendez-vous
 */
export async function envoyerRappel24h(data: BookingNotificationData): Promise<{ ok: boolean; error?: string }> {
  const sujet = `⏰ Rappel : Rendez-vous demain - ${data.artistStudioName || data.artistName}`;
  
  const contenu = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Rappel : Rendez-vous demain</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          
          <div class="alert">
            <p><strong>Votre rendez-vous est prévu demain :</strong></p>
            <p>📅 ${data.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${data.heure}</p>
          </div>
          
          ${data.adresseStudio ? `<p><strong>📍 Adresse :</strong> ${data.adresseStudio}</p>` : ''}
          
          <p>À très bientôt !</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${data.clientName},

Rappel : Votre rendez-vous est prévu demain.

📅 ${data.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${data.heure}
${data.adresseStudio ? `📍 ${data.adresseStudio}` : ''}

À très bientôt !

InkFlow
  `;

  try {
    const result = await sendResend({
      to: data.clientEmail,
      subject: sujet,
      html: contenu,
      text: text,
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}

/**
 * Relance pour acompte non réglé
 */
export async function relancerAcompteNonRegle(data: BookingNotificationData): Promise<{ ok: boolean; error?: string }> {
  if (!data.acompte || data.acompteRegle) {
    return { ok: true }; // Pas besoin de relancer
  }

  const sujet = `💳 Acompte en attente - ${data.artistStudioName || data.artistName}`;
  
  const contenu = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 Acompte en attente</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          
          <div class="warning">
            <p><strong>Votre réservation nécessite le paiement d'un acompte de ${data.acompte.toFixed(2)}€</strong></p>
          </div>
          
          <p>Pour confirmer votre rendez-vous du <strong>${data.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${data.heure}</strong>, merci de régler l'acompte.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.modifyLink || '#'}" class="button">Régler l'acompte</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${data.clientName},

Votre réservation nécessite le paiement d'un acompte de ${data.acompte.toFixed(2)}€.

Rendez-vous : ${data.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${data.heure}

Merci de régler l'acompte pour confirmer votre rendez-vous.
${data.modifyLink ? `Régler : ${data.modifyLink}` : ''}

InkFlow
  `;

  try {
    const result = await sendResend({
      to: data.clientEmail,
      subject: sujet,
      html: contenu,
      text: text,
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}

/**
 * Notification d'annulation
 */
export async function notifierAnnulation(data: BookingNotificationData): Promise<{ ok: boolean; error?: string }> {
  const sujet = `❌ Réservation annulée - ${data.artistStudioName || data.artistName}`;
  
  const contenu = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #868f96 0%, #596164 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Réservation annulée</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          
          <p>Votre réservation du <strong>${data.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${data.heure}</strong> a été annulée.</p>
          
          <p>Si vous souhaitez prendre un nouveau rendez-vous, n'hésitez pas à nous contacter.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${data.clientName},

Votre réservation du ${data.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${data.heure} a été annulée.

Si vous souhaitez prendre un nouveau rendez-vous, n'hésitez pas à nous contacter.

InkFlow
  `;

  try {
    const result = await sendResend({
      to: data.clientEmail,
      subject: sujet,
      html: contenu,
      text: text,
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}

/**
 * Demande d'avis après session
 */
export async function demanderAvisApresSession(data: BookingNotificationData): Promise<{ ok: boolean; error?: string }> {
  const sujet = `⭐ Partagez votre expérience - ${data.artistStudioName || data.artistName}`;
  
  const contenu = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⭐ Partagez votre expérience</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          
          <p>Nous espérons que votre séance s'est bien passée !</p>
          
          <p>Votre avis nous aide énormément. Merci de prendre quelques instants pour partager votre expérience.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.modifyLink || '#'}" class="button">Laisser un avis</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${data.clientName},

Nous espérons que votre séance s'est bien passée !

Votre avis nous aide énormément. Merci de prendre quelques instants pour partager votre expérience.

${data.modifyLink ? `Laisser un avis : ${data.modifyLink}` : ''}

InkFlow
  `;

  try {
    const result = await sendResend({
      to: data.clientEmail,
      subject: sujet,
      html: contenu,
      text: text,
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}
