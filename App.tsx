import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { ArtistProfileProvider } from './contexts/ArtistProfileContext';
import { DashboardThemeProvider } from './contexts/DashboardThemeContext';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── Intercepteur global : humanise les messages PostgREST / Supabase ──
// On monkey-patch toast.error pour que les messages techniques ne s'affichent
// jamais tels quels à l'utilisateur.
const PGRST_PATTERNS: [RegExp, string][] = [
  [/cannot coerce the result to a single json object/i, 'Erreur de chargement des données. Rafraîchissez la page.'],
  [/could not find the table.*in the schema cache/i, 'Service temporairement indisponible. Réessayez dans un instant.'],
  [/permission denied for table/i, 'Accès refusé. Veuillez vous reconnecter.'],
  [/PGRST116/i, ''],   // No rows — silencieux, pas de toast
  [/PGRST301/i, 'Session expirée. Veuillez vous reconnecter.'],
  [/JWT expired/i, 'Votre session a expiré. Veuillez vous reconnecter.'],
  [/Failed to fetch/i, 'Impossible de joindre le serveur. Vérifiez votre connexion.'],
  [/NetworkError/i, 'Erreur réseau. Vérifiez votre connexion internet.'],
];

const _originalToastError = toast.error.bind(toast);
toast.error = ((message: any, options?: any) => {
  const rawMsg = typeof message === 'string' ? message : String(message ?? '');

  for (const [pattern, replacement] of PGRST_PATTERNS) {
    if (pattern.test(rawMsg)) {
      if (!replacement) return; // '' = silencieux, on n'affiche rien
      return _originalToastError(replacement, options);
    }
  }

  // Aussi vérifier dans la description (Sonner met parfois le message là)
  if (options?.description && typeof options.description === 'string') {
    for (const [pattern, replacement] of PGRST_PATTERNS) {
      if (pattern.test(options.description)) {
        if (!replacement) return;
        return _originalToastError(rawMsg, { ...options, description: replacement });
      }
    }
  }

  return _originalToastError(message, options);
}) as typeof toast.error;

// Lazy load components pour code splitting (réduction du bundle initial ~60%)
const OnboardingPage = lazy(() => import('./components/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const PublicArtistPage = lazy(() => import('./components/PublicArtistPage').then(m => ({ default: m.PublicArtistPage })));
const ClientHome = lazy(() => import('./components/ClientHome').then(m => ({ default: m.ClientHome })));
const FlashGallery = lazy(() => import('./components/FlashGallery').then(m => ({ default: m.FlashGallery })));
const CustomProjectForm = lazy(() => import('./components/CustomProjectForm').then(m => ({ default: m.CustomProjectForm })));
const PaymentSuccess = lazy(() => import('./components/PaymentSuccess').then(m => ({ default: m.PaymentSuccess })));
const PaymentCancel = lazy(() => import('./components/PaymentCancel').then(m => ({ default: m.PaymentCancel })));
const AuthCallbackPage = lazy(() => import('./components/auth/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const UpdatePasswordPage = lazy(() => import('./components/auth/UpdatePasswordPage').then(m => ({ default: m.UpdatePasswordPage })));

// Dashboard components (les plus lourds)
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const DashboardOverview = lazy(() => import('./components/dashboard/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const DashboardCalendar = lazy(() => import('./components/dashboard/DashboardCalendar').then(m => ({ default: m.DashboardCalendar })));
const DashboardRequests = lazy(() => import('./components/dashboard/DashboardRequests').then(m => ({ default: m.DashboardRequests })));
const DashboardFlashs = lazy(() => import('./components/dashboard/DashboardFlashs').then(m => ({ default: m.DashboardFlashs })));
const DashboardClients = lazy(() => import('./components/dashboard/DashboardClients').then(m => ({ default: m.DashboardClients })));
const DashboardFinance = lazy(() => import('./components/dashboard/DashboardFinance').then(m => ({ default: m.DashboardFinance })));
const DashboardSettings = lazy(() => import('./components/dashboard/DashboardSettings').then(m => ({ default: m.DashboardSettings })));
const DashboardPayments = lazy(() => import('./components/dashboard/DashboardPayments').then(m => ({ default: m.DashboardPayments })));
const DashboardCareSheets = lazy(() => import('./components/dashboard/DashboardCareSheets').then(m => ({ default: m.DashboardCareSheets })));

// Skeleton de chargement réutilisable
const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
      <p className="text-slate-400">Chargement...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  // Intercepter les promesses rejetées non capturées pour éviter
  // des toasts d'erreurs techniques sauvages
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message || String(event?.reason ?? '');

      // Bloquer les erreurs PostgREST / Supabase sauvages
      for (const [pattern] of PGRST_PATTERNS) {
        if (pattern.test(msg)) {
          event.preventDefault(); // Empêche la console error
          return;
        }
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ArtistProfileProvider>
            <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden w-full">
              <Toaster
                theme="dark"
                position="top-center"
                richColors
                toastOptions={{
                  className: 'glass border border-white/10 text-white',
                }}
              />
              <Suspense fallback={<LoadingSkeleton />}>
                <Routes>
                  {/* Public Routes - Importées normalement pour FCP rapide */}
                  <Route path="/" element={<LandingPage onNavigate={() => {}} />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
                  
                  {/* Public Artist Page (Vitrine) - Lazy loaded */}
                  <Route path="/p/:slug" element={<PublicArtistPage />} />
                  {/* Public Artist Page (Vitrine) - URL courte */}
                  <Route path="/:slug" element={<PublicArtistPage />} />
                  
                  {/* Payment Routes - Lazy loaded */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/cancel" element={<PaymentCancel />} />
                  
                  {/* Demo Routes - Lazy loaded */}
                  <Route path="/client" element={<ClientHome onNavigate={() => {}} />} />
                  <Route path="/flashs" element={<FlashGallery />} />
                  <Route path="/project" element={<CustomProjectForm artistId="" />} />
                  
                  {/* Protected Routes - Lazy loaded */}
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Dashboard Routes (Nested) - Tous lazy loaded */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardThemeProvider>
                          <DashboardLayout />
                        </DashboardThemeProvider>
                      </ProtectedRoute>
                    }
                  >
                    {/* Default route - redirect to overview */}
                    <Route index element={<Navigate to="/dashboard/overview" replace />} />
                    {/* Overview route */}
                    <Route path="overview" element={<DashboardOverview />} />
                    {/* Other dashboard routes */}
                    <Route path="calendar" element={<DashboardCalendar />} />
                    <Route path="requests" element={<DashboardRequests />} />
                    <Route path="flashs" element={<DashboardFlashs />} />
                    <Route path="clients" element={<DashboardClients />} />
                    <Route path="finance" element={<DashboardFinance />} />
                    <Route path="settings" element={<DashboardSettings />} />
                    <Route path="settings/payments" element={<DashboardPayments />} />
                    <Route path="settings/care-sheets" element={<DashboardCareSheets />} />
                  </Route>
                  
                  {/* Redirect unknown routes to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </ArtistProfileProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;