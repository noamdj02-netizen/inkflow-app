import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { FlashGallery } from '@/components/booking/FlashGallery';
import { BookingModal } from '@/components/booking/BookingModal';
import { ScrollToButton } from '@/components/common/ScrollToButton';
import Image from 'next/image';

// Routes réservées qui ne doivent pas être traitées comme des slugs d'artistes
const RESERVED_ROUTES = [
  'login',
  'register',
  'dashboard',
  'onboarding',
  'api',
  'auth',
  'p',
  'artist',
  'booking',
  'payment',
  'client',
  'flashs',
  'project',
  'apropos',
  'offres',
  'mentions-legales',
  'contact',
  'test-db',
  'robots.txt',
  'sitemap.xml',
];

export default async function SlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;

  // Si c'est une route réservée, retourner 404
  if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
    notFound();
  }

  const supabase = createClient();
  
  // Vérifier si c'est un slug d'artiste
  const { data: artist, error } = await supabase
    .from('artists')
    .select('*, flashs(*)')
    .eq('slug_profil', slug)
    .single();
  
  if (error || !artist) {
    notFound();
  }

  // Type assertion pour gérer la relation flashs
  const artistWithFlashs = artist as any;

  const flashs = (artistWithFlashs?.flashs || []).map((flash: any) => ({
    id: flash.id,
    title: flash.title,
    description: flash.description || null,
    image_url: flash.image_url,
    prix: flash.prix / 100, // Convertir centimes en euros
    acompte: flash.acompte || (flash.prix / 100) * 0.30,
    disponible: flash.statut === 'available',
  }));

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black z-0" />
        <div className="relative z-10 text-center space-y-6 px-4">
          {artistWithFlashs.avatar_url && (
            <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/20">
              <Image
                src={artistWithFlashs.avatar_url}
                alt={artistWithFlashs.nom_studio || artistWithFlashs.slug_profil}
                fill
                priority
                sizes="(max-width: 640px) 128px, 192px"
                className="object-cover"
              />
            </div>
          )}
          <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tight">
            {artistWithFlashs.nom_studio || artistWithFlashs.slug_profil}
          </h1>
          {artistWithFlashs.bio_instagram && (
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              {artistWithFlashs.bio_instagram}
            </p>
          )}
          <ScrollToButton
            targetId="flashs"
            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform"
          >
            Voir mes flashs
          </ScrollToButton>
        </div>
      </section>

      {/* Gallery Flashs */}
      <section id="flashs" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Flashs Disponibles
          </h2>
          <FlashGallery flashs={flashs} artistSlug={slug} />
        </div>
      </section>

      {/* Custom Project CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-purple-900/20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-5xl font-bold">Un projet sur-mesure ?</h2>
          <p className="text-xl text-zinc-400">
            Décrivez votre idée et je vous proposerai des créneaux
          </p>
          <BookingModal 
            type="project" 
            artistSlug={slug}
            trigger={
              <button className="px-10 py-5 bg-white text-black rounded-full font-bold text-xl hover:scale-105 transition-transform">
                Proposer un projet
              </button>
            }
          />
        </div>
      </section>
    </main>
  );
}
