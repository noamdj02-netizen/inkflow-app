/**
 * Templates email réutilisables pour InkFlow
 * Design HTML responsive et sobre
 */

import { escapeHtml } from './validation';

const FONT_FAMILY = '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const PRIMARY_COLOR = '#1A1A1A';
const MUTED_COLOR = '#6B7280';
const BORDER_COLOR = '#E5E7EB';
const BG_LIGHT = '#F9FAFB';

/**
 * Layout de base responsive (wrapper + contenu)
 */
export function baseEmailLayout(content: string, options?: { title?: string; preheader?: string }): string {
  const preheader = options?.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(options.preheader)}</div>`
    : '';
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${options?.title ? escapeHtml(options.title) : 'InkFlow'}</title>
  ${preheader}
  <!--[if mso]>
  <noscript><meta http-equiv="X-UA-Compatible" content="IE=edge" /></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:${FONT_FAMILY};font-size:16px;line-height:1.5;color:${PRIMARY_COLOR};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F3F4F6;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#FFFFFF;border-radius:8px;border:1px solid ${BORDER_COLOR};box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 24px;">
              ${content}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:12px;color:${MUTED_COLOR};">
          InkFlow — Gestion de rendez-vous pour tatoueurs
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export interface AppointmentArtistEmailData {
  clientName: string;
  clientEmail: string;
  bodyPart: string;
  style: string;
  sizeCm: number;
  budgetFormatted: string;
  description: string;
  dashboardLink: string;
  artistStudioName?: string;
}

/**
 * Corps du mail "Nouvelle demande de rendez-vous" pour le tatoueur
 */
export function appointmentNotificationArtistBody(data: AppointmentArtistEmailData): string {
  const safeClient = escapeHtml(data.clientName || 'Client');
  const safeEmail = escapeHtml(data.clientEmail);
  const safeBodyPart = escapeHtml(data.bodyPart);
  const safeStyle = escapeHtml(data.style);
  const safeBudget = escapeHtml(data.budgetFormatted);
  const safeDesc = escapeHtml(data.description);
  const safeLink = escapeHtml(data.dashboardLink);

  const content = `
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:600;color:${PRIMARY_COLOR};">
      Nouvelle demande de rendez-vous
    </h1>
    <p style="margin:0 0 20px 0;color:${MUTED_COLOR};">
      Une nouvelle demande a été validée par un client.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;border:1px solid ${BORDER_COLOR};border-radius:8px;background:${BG_LIGHT};">
      <tr><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};"><strong>Nom du client</strong></td><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};">${safeClient}</td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};"><strong>Email</strong></td><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};">${safeEmail}</td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};"><strong>Zone du corps</strong></td><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};">${safeBodyPart}</td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};"><strong>Style de tatouage</strong></td><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};">${safeStyle}</td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};"><strong>Taille approximative</strong></td><td style="padding:16px 20px;border-bottom:1px solid ${BORDER_COLOR};">${data.sizeCm} cm</td></tr>
      <tr><td style="padding:16px 20px;"><strong>Budget estimé</strong></td><td style="padding:16px 20px;">${safeBudget}</td></tr>
    </table>
    <p style="margin:0 0 8px 0;font-weight:600;color:${PRIMARY_COLOR};">Description du projet</p>
    <div style="padding:12px 16px;border:1px solid ${BORDER_COLOR};border-radius:6px;background:#FFFFFF;margin-bottom:24px;">
      <pre style="margin:0;white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.5;">${safeDesc}</pre>
    </div>
    <p style="margin:0 0 12px 0;">
      <a href="${safeLink}" style="display:inline-block;padding:12px 24px;background:${PRIMARY_COLOR};color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
        Voir la demande dans le tableau de bord
      </a>
    </p>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED_COLOR};">
      Lien direct : <a href="${safeLink}" style="color:#4F46E5;">${safeLink}</a>
    </p>
  `;
  return baseEmailLayout(content, {
    title: `Nouvelle demande - ${data.clientName}`,
    preheader: `Demande de ${data.clientName} — ${data.bodyPart}, ${data.style}`,
  });
}

/**
 * Version texte brut pour le mail tatoueur
 */
export function appointmentNotificationArtistText(data: AppointmentArtistEmailData): string {
  return [
    'Nouvelle demande de rendez-vous',
    '',
    `Nom du client : ${data.clientName}`,
    `Email : ${data.clientEmail}`,
    `Zone du corps : ${data.bodyPart}`,
    `Style de tatouage : ${data.style}`,
    `Taille approximative : ${data.sizeCm} cm`,
    `Budget estimé : ${data.budgetFormatted}`,
    '',
    'Description du projet :',
    data.description,
    '',
    `Voir la demande : ${data.dashboardLink}`,
  ].join('\n');
}

export interface AppointmentClientConfirmationData {
  clientName: string;
  artistStudioName: string;
  dashboardRequestsLink?: string;
}

/**
 * Corps du mail de confirmation au client
 */
export function appointmentConfirmationClientBody(data: AppointmentClientConfirmationData): string {
  const safeClient = escapeHtml(data.clientName || 'Client');
  const safeStudio = escapeHtml(data.artistStudioName);

  const content = `
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:600;color:${PRIMARY_COLOR};">
      Demande bien reçue
    </h1>
    <p style="margin:0 0 16px 0;">
      Bonjour ${safeClient},
    </p>
    <p style="margin:0 0 20px 0;color:${MUTED_COLOR};">
      Votre demande de rendez-vous pour <strong>${safeStudio}</strong> a bien été enregistrée.
      L'artiste vous recontactera prochainement pour confirmer le créneau et les détails.
    </p>
    <p style="margin:0 0 0 0;font-size:14px;color:${MUTED_COLOR};">
      Merci de votre confiance.
    </p>
  `;
  return baseEmailLayout(content, {
    title: 'Demande enregistrée — InkFlow',
    preheader: `Votre demande pour ${data.artistStudioName} a bien été reçue.`,
  });
}

export function appointmentConfirmationClientText(data: AppointmentClientConfirmationData): string {
  return [
    'Demande bien reçue',
    '',
    `Bonjour ${data.clientName},`,
    '',
    `Votre demande de rendez-vous pour ${data.artistStudioName} a bien été enregistrée.`,
    "L'artiste vous recontactera prochainement pour confirmer le créneau et les détails.",
    '',
    'Merci de votre confiance.',
  ].join('\n');
}
