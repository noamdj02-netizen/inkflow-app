import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SWRConfig } from 'swr';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { ArtistProfileProvider } from './contexts/ArtistProfileContext';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

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
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ArtistProfileProvider>
            <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden w-full">
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
              <Suspense fallback={<LoadingSkeleton />}>
                <Routes>
                  {/* Public Routes - Importées normalement pour FCP rapide */}
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
                  
                  {/* Redirect unknown routes to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
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