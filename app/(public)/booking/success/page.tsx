import { createClient } from '@/lib/supabase/server';
import { CheckCircle, Calendar, Clock, Euro } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookingSuccessStripe } from './BookingSuccessStripe';

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { id?: string; session_id?: string };
}) {
  const bookingId = searchParams.id;
  const sessionId = searchParams.session_id;

  // Stripe redirect: session_id present → show simple success (webhook already confirmed booking)
  if (sessionId) {
    return <BookingSuccessStripe />;
  }

  // Direct link with booking id → fetch and show details
  if (!bookingId) {
    notFound();
  }

  const supabase = createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      artists (slug_profil, nom_studio),
      flashs (title)
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    notFound();
  }

  const bookingData = booking as any;
  const scheduledAt = new Date(bookingData.scheduled_at);
  const artist = bookingData.artists as any;
  const flash = bookingData.flashs as any;

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="text-green-400" size={48} />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">Réservation confirmée !</h1>
          <p className="text-zinc-400">
            Votre acompte a été payé avec succès.
          </p>
        </div>

        <div className="bg-zinc-800/50 rounded-xl p-6 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <Calendar className="text-purple-400" size={20} />
            <div>
              <p className="text-zinc-400 text-sm">Date</p>
              <p className="font-medium">
                {scheduledAt.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="text-purple-400" size={20} />
            <div>
              <p className="text-zinc-400 text-sm">Heure</p>
              <p className="font-medium">
                {scheduledAt.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Euro className="text-purple-400" size={20} />
            <div>
              <p className="text-zinc-400 text-sm">Acompte payé</p>
              <p className="font-bold text-xl">{bookingData.acompte_amount}€</p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Link
            href={`/artist/${artist.slug_profil}`}
            className="text-zinc-400 hover:text-white text-sm underline"
          >
            Retour à la vitrine
          </Link>
        </div>
      </div>
    </main>
  );
}
