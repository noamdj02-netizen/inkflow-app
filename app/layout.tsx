import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ArtistProfileProvider } from '@/contexts/ArtistProfileContext';
import { ThemeProvider } from '@/components/theme-provider';
import { PortalOrderHandler } from './components/PortalOrderHandler';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'InkFlow - Tattoo Manager',
  description: 'Gestion simplifiée pour tatoueurs pro. Réservations, flashs, paiements.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} ${playfair.variable} min-h-screen font-sans selection:bg-primary selection:text-white overflow-x-hidden w-full transition-colors duration-300 bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PortalOrderHandler />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
