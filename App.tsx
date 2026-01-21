import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
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

// Dashboard components (les plus lourds)
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const DashboardOverview = lazy(() => import('./components/dashboard/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const DashboardCalendar = lazy(() => import('./components/dashboard/DashboardCalendar').then(m => ({ default: m.DashboardCalendar })));
const DashboardRequests = lazy(() => import('./components/dashboard/DashboardRequests').then(m => ({ default: m.DashboardRequests })));
const DashboardFlashs = lazy(() => import('./components/dashboard/DashboardFlashs').then(m => ({ default: m.DashboardFlashs })));
const DashboardClients = lazy(() => import('./components/dashboard/DashboardClients').then(m => ({ default: m.DashboardClients })));
const DashboardFinance = lazy(() => import('./components/dashboard/DashboardFinance').then(m => ({ default: m.DashboardFinance })));
const DashboardSettings = lazy(() => import('./components/dashboard/DashboardSettings').then(m => ({ default: m.DashboardSettings })));

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
            <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-amber-400 selection:text-black">
              <Suspense fallback={<LoadingSkeleton />}>
                <Routes>
                  {/* Public Routes - Importées normalement pour FCP rapide */}
                  <Route path="/" element={<LandingPage onNavigate={() => {}} />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  
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