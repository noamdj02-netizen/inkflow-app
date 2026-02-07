import { Resend } from "resend";

export type SendBookingNotificationParams = {
  artistEmail: string;
  clientName: string;
  projectName: string;
  date: string;
  time: string;
  bookingUrl: string;
};

const resendClient = new Resend(process.env.RESEND_API_KEY);

function buildBookingNotificationHtml(params: SendBookingNotificationParams): string {
  const { clientName, projectName, date, time, bookingUrl } = params;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nouvelle Réservation</title>
</head>
<body style="background-color: #000000; font-family: sans-serif; margin: 0; padding: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
          <tr>
            <td align="center" style="padding: 30px; border-bottom: 1px solid #333;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 2px;">INKFLOW</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center; color: #e5e5e5;">
              <div style="margin: 0 auto 20px auto; width: 50px; height: 50px; background-color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; color: #fff; line-height: 50px;">📅</span>
              </div>
              <h2 style="margin-top: 0; font-size: 24px; color: #ffffff;">Nouvelle demande !</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #a3a3a3; margin-bottom: 30px;">
                Bonne nouvelle, <strong>${clientName}</strong> vient de réserver un créneau.
              </p>
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #000; border-radius: 8px; margin-bottom: 30px; text-align: left;">
                <tr>
                  <td style="color: #888; border-bottom: 1px solid #222;">Projet</td>
                  <td style="color: #fff; font-weight: bold; border-bottom: 1px solid #222;">${projectName}</td>
                </tr>
                <tr>
                  <td style="color: #888; border-bottom: 1px solid #222;">Date</td>
                  <td style="color: #fff; font-weight: bold; border-bottom: 1px solid #222;">${date}</td>
                </tr>
                <tr>
                  <td style="color: #888;">Heure</td>
                  <td style="color: #fff; font-weight: bold;">${time}</td>
                </tr>
              </table>
              <a href="${bookingUrl}" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Voir mon planning
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; background-color: #000000; text-align: center; border-top: 1px solid #333;">
              <p style="margin: 0; font-size: 12px; color: #525252;">InkFlow Manager</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendBookingNotificationToArtist(
  params: SendBookingNotificationParams
): Promise<{ success: boolean; id?: string; error?: unknown }> {
  const { artistEmail } = params;
  const from = process.env.RESEND_FROM_EMAIL ?? "InkFlow <onboarding@resend.dev>";

  try {
    const { data, error } = await resendClient.emails.send({
      from,
      to: artistEmail,
      subject: "Nouvelle réservation – InkFlow",
      html: buildBookingNotificationHtml(params),
    });

    if (error) {
      return { success: false, error };
    }
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err };
  }
}
