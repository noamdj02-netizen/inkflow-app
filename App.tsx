import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SWRConfig } from 'swr';
import { Toaster, toast } from 'sonner';
import { ArtistProfileProvider } from './contexts/ArtistProfileContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RedirectToHome } from './components/common/RedirectToHome';
import { DelayedFallback } from './components/common/DelayedFallback';
import { PlaceholderPage } from './components/PlaceholderPage';

// Lazy load pour affichage immédiat sur mobile (bundle initial réduit)
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const OnboardingPage = lazy(() => import('./components/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const PublicArtistPage = lazy(() => import('./components/PublicArtistPage').then(m => ({ default: m.PublicArtistPage })));
const ClientHome = lazy(() => import('./components/ClientHome').then(m => ({ default: m.ClientHome })));
const FlashGallery = lazy(() => import('./components/FlashGallery').then(m => ({ default: m.FlashGallery })));
const CustomProjectForm = lazy(() => import('./components/CustomProjectForm').then(m => ({ default: m.CustomProjectForm })));
const PaymentSuccess = lazy(() => import('./components/PaymentSuccess').then(m => ({ default: m.PaymentSuccess })));
const PaymentCancel = lazy(() => import('./components/PaymentCancel').then(m => ({ default: m.PaymentCancel })));
const AuthCallbackPage = lazy(() => import('./components/auth/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const UpdatePasswordPage = lazy(() => import('./components/auth/UpdatePasswordPage').then(m => ({ default: m.UpdatePasswordPage })));
const TestDatabase = lazy(() => import('./components/TestDatabase').then(m => ({ default: m.TestDatabase })));

// Dashboard components (les plus lourds)
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const DashboardOverview = lazy(() => import('./components/dashboard/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const DashboardCalendar = lazy(() => import('./components/dashboard/DashboardCalendar').then(m => ({ default: m.DashboardCalendar })));
const DashboardRequests = lazy(() => import('./components/dashboard/DashboardRequests').then(m => ({ default: m.DashboardRequests })));
const DashboardFlashs = lazy(() => import('./components/dashboard/DashboardFlashs').then(m => ({ default: m.DashboardFlashs })));
const DashboardClients = lazy(() => import('./components/dashboard/DashboardClients').then(m => ({ default: m.DashboardClients })));
const DashboardFinance = lazy(() => import('./components/dashboard/DashboardFinance').then(m => ({ default: m.DashboardFinance })));
const DashboardSettings = lazy(() => import('./components/dashboard/DashboardSettings').then(m => ({ default: m.DashboardSettings })));
const DashboardCareSheets = lazy(() => import('./components/dashboard/DashboardCareSheets').then(m => ({ default: m.DashboardCareSheets })));
const PublicBookingPage = lazy(() => import('./components/PublicBookingPage').then(m => ({ default: m.PublicBookingPage })));
const AproposPage = lazy(() => import('./components/AproposPage').then(m => ({ default: m.AproposPage })));
const OffresPage = lazy(() => import('./components/OffresPage').then(m => ({ default: m.OffresPage })));
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./components/RegisterPage').then(m => ({ default: m.RegisterPage })));

// Fallback retardé : spinner seulement si chargement > 300ms (évite flash sur navigations rapides)

const App: React.FC = () => {
  const { wasOffline, clearWasOffline } = useOnlineStatus();

  useEffect(() => {
    if (wasOffline) {
      toast.success('Connexion rétablie', {
        description: 'Vous êtes de nouveau en ligne.',
      });
      clearWasOffline();
    }
  }, [wasOffline, clearWasOffline]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ArtistProfileProvider>
            <div className="min-h-screen bg-[#0a0a0a] text-slate-50 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden w-full">
              <SWRConfig
                value={{
                  dedupingInterval: 2000,
                  revalidateOnFocus: true,
                  revalidateOnReconnect: true,
                  errorRetryCount: 2,
                  keepPreviousData: true,
                }}
              >
              <Toaster
                theme="dark"
                position="top-center"
                richColors
                toastOptions={{
                  className: 'glass border border-white/10 text-white',
                }}
              />
              <Suspense fallback={<DelayedFallback />}>
                <Routes>
                  {/* Homepage — route explicite en premier pour accès instantané, pas de redirection */}
                  <Route path="/" element={<LandingPage onNavigate={() => {}} />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
                  
                  {/* Test Database - Lazy loaded (doit être avant /:slug) */}
                  <Route path="/test-db" element={<TestDatabase />} />
                  
                  {/* Public Artist Page (Vitrine) - Lazy loaded */}
                  <Route path="/p/:slug" element={<PublicArtistPage />} />
                  {/* Réservation : calendrier créneaux (avant /:slug) */}
                  <Route path="/:slug/booking" element={<PublicBookingPage />} />
                  {/* Public Artist Page (Vitrine) - URL courte (doit être en dernier) */}
                  <Route path="/:slug" element={<PublicArtistPage />} />
                  
                  {/* Payment Routes - Lazy loaded */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/cancel" element={<PaymentCancel />} />
                  
                  {/* Demo Routes - Lazy loaded */}
                  <Route path="/client" element={<ClientHome onNavigate={() => {}} />} />
                  <Route path="/flashs" element={<FlashGallery />} />
                  <Route path="/project" element={<CustomProjectForm />} />
                  <Route path="/apropos" element={<AproposPage />} />
                  <Route path="/offres" element={<OffresPage />} />
                  <Route path="/mentions-legales" element={<PlaceholderPage title="Mentions légales" description="Cette page sera bientôt disponible." icon="file" />} />
                  <Route path="/contact" element={<PlaceholderPage title="Contact" description="Cette page sera bientôt disponible." icon="mail" />} />
                  
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
                        <DashboardLayout />
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
                    <Route path="settings/care-sheets" element={<DashboardCareSheets />} />
                  </Route>
                  
                  {/* Redirection unique vers home — évite boucle de redirection */}
                  <Route path="*" element={<RedirectToHome />} />
                </Routes>
              </Suspense>
              </SWRConfig>
            </div>
          </ArtistProfileProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;