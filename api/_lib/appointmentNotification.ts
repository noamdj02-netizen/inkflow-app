/**
 * Notifications email pour submit-project-request (copie locale pour Vercel).
 */

import {
  appointmentNotificationArtistBody,
  appointmentNotificationArtistText,
  appointmentConfirmationClientBody,
  appointmentConfirmationClientText,
  type AppointmentArtistEmailData,
  type AppointmentClientConfirmationData,
} from './emailTemplates';

const RESEND_API = 'https://api.resend.com/emails';
const RETRY_DELAY_MS = 30_000;
const MAX_RETRIES = 1;

export type NotificationResult = { ok: true; messageId?: string } | { ok: false; error: string; willRetry?: boolean };

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SendAppointmentNotificationOptions = {
  projectId: string;
  artistEmail: string;
  artistStudioName?: string;
  clientName: string;
  clientEmail: string;
  bodyPart: string;
  style: string;
  sizeCm: number;
  budgetFormatted: string;
  description: string;
  siteBaseUrl: string;
  onEmailFailed?: (projectId: string) => Promise<void>;
};

export async function sendAppointmentNotification(options: SendAppointmentNotificationOptions): Promise<NotificationResult> {
  const {
    projectId,
    artistEmail,
    artistStudioName,
    clientName,
    clientEmail,
    bodyPart,
    style,
    sizeCm,
    budgetFormatted,
    description,
    siteBaseUrl,
    onEmailFailed,
  } = options;

  const dashboardLink = `${siteBaseUrl.replace(/\/$/, '')}/dashboard/requests`;
  const subject = `Nouvelle demande de rendez-vous - ${clientName}`;

  const emailData: AppointmentArtistEmailData = {
    clientName,
    clientEmail,
    bodyPart,
    style,
    sizeCm,
    budgetFormatted,
    description,
    dashboardLink,
    artistStudioName,
  };

  const html = appointmentNotificationArtistBody(emailData);
  const text = appointmentNotificationArtistText(emailData);

  const doSend = () =>
    sendResend({
      to: artistEmail,
      subject,
      html,
      text,
      replyTo: clientEmail,
    });

  try {
    let result = await doSend();

    if (result.ok) return result;

    if (!result.ok) {
      const { error } = result;
      console.error('[appointmentNotification] Artist email failed (attempt 1):', {
        projectId,
        artistEmail: artistEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error,
      });
    }

    if (MAX_RETRIES >= 1) {
      await sleep(RETRY_DELAY_MS);
      result = await doSend();

      if (result.ok) return result;

      if (!result.ok) {
        const { error } = result;
        console.error('[appointmentNotification] Artist email failed after retry (attempt 2):', {
          projectId,
          artistEmail: artistEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
          error,
        });
      }
    }

    if (onEmailFailed) {
      try {
        await onEmailFailed(projectId);
      } catch (dbErr) {
        console.error('[appointmentNotification] Failed to save email_failed state in DB:', dbErr);
      }
    }

    const fallbackError = result.ok === false ? result.error : 'Unknown';
    return { ok: false, error: fallbackError };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[appointmentNotification] Unexpected error sending artist email:', { projectId, message });
    if (onEmailFailed) {
      try {
        await onEmailFailed(projectId);
      } catch (dbErr) {
        console.error('[appointmentNotification] Failed to save email_failed state in DB:', dbErr);
      }
    }
    return { ok: false, error: message };
  }
}

export async function sendAppointmentConfirmationToClient(options: {
  clientEmail: string;
  clientName: string;
  artistStudioName: string;
  siteBaseUrl?: string;
}): Promise<NotificationResult> {
  const { clientEmail, clientName, artistStudioName, siteBaseUrl } = options;

  const data: AppointmentClientConfirmationData = {
    clientName,
    artistStudioName,
    dashboardRequestsLink: siteBaseUrl ? `${siteBaseUrl.replace(/\/$/, '')}/dashboard/requests` : undefined,
  };

  const html = appointmentConfirmationClientBody(data);
  const text = appointmentConfirmationClientText(data);

  try {
    const result = await sendResend({
      to: clientEmail,
      subject: 'Votre demande de rendez-vous a bien été reçue — InkFlow',
      html,
      text,
    });
    if (!result.ok && 'error' in result) {
      console.error('[appointmentNotification] Client confirmation email failed:', {
        clientEmail: clientEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: result.error,
      });
    }
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[appointmentNotification] Unexpected error sending client confirmation:', message);
    return { ok: false, error: message };
  }
}
