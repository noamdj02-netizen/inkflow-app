import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ArtistProfileProvider } from '@/contexts/ArtistProfileContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InkFlow - Tattoo Manager',
  description: 'Gestion simplifiée pour tatoueurs pro. Réservations, flashs, paiements.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} min-h-screen bg-[#0a0a0a] text-slate-50 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden w-full`}>
        <ErrorBoundary>
          <ArtistProfileProvider>
            {children}
            <Toaster
              theme="dark"
              position="top-center"
              richColors
              toastOptions={{
                className: 'glass border border-white/10 text-white',
              }}
            />
            <HotToaster
              position="top-center"
              toastOptions={{
                className: '!bg-zinc-900 !text-white !border !border-white/10',
                duration: 4000,
              }}
            />
          </ArtistProfileProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
