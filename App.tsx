import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ArtistProfileProvider } from './contexts/ArtistProfileContext';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { OnboardingPage } from './components/OnboardingPage';
import { PublicArtistPage } from './components/PublicArtistPage';
import { ClientHome } from './components/ClientHome';
import { FlashGallery } from './components/FlashGallery';
import { CustomProjectForm } from './components/CustomProjectForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { DashboardCalendar } from './components/dashboard/DashboardCalendar';
import { DashboardRequests } from './components/dashboard/DashboardRequests';
import { DashboardFlashs } from './components/dashboard/DashboardFlashs';
import { DashboardClients } from './components/dashboard/DashboardClients';
import { DashboardFinance } from './components/dashboard/DashboardFinance';
import { DashboardSettings } from './components/dashboard/DashboardSettings';
import { PaymentSuccess } from './components/PaymentSuccess';
import { PaymentCancel } from './components/PaymentCancel';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ArtistProfileProvider>
          <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-amber-400 selection:text-black">
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage onNavigate={() => {}} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Public Artist Page (Vitrine) */}
          <Route path="/p/:slug" element={<PublicArtistPage />} />
          
          {/* Payment Routes */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          
          {/* Demo Routes (pour les démos client) */}
          <Route path="/client" element={<ClientHome onNavigate={() => {}} />} />
          <Route path="/flashs" element={<FlashGallery />} />
          <Route path="/project" element={<CustomProjectForm />} />
          
          {/* Protected Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          
          {/* Dashboard Routes (Nested) */}
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
          </div>
        </ArtistProfileProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;