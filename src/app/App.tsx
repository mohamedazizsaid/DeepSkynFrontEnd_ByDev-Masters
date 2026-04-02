import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './components/landing-page';
import { LoginPage } from './pages/login-page';
import { SignUpPage } from './pages/signup-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { GoogleCallbackPage } from './pages/google-callback-page';
import { PaymentSuccessPage } from './pages/payment-success-page';
import { PaymentCancelPage } from './pages/payment-cancel-page';
import { OnboardingFlow } from './components/onboarding-flow';
import { DashboardLayout } from './components/dashboard-layout';
import { AnimatedBackground } from './components/animated-background';
import { AccessibilityOverlays } from './components/accessibility-overlays';
import { AccessibilityPanel } from './components/accessibility-panel';
import { EyeTrackingWrapper } from '../components/EyeTrackingWrapper';
import { useAuthStore } from '../stores/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={{ zIndex: 1 }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirect to dashboard if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

// App content with routing
function AppContent() {
  const { loadUser, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Try to load user on mount if token exists
    const token = localStorage.getItem('access_token');
    if (token) {
      loadUser().catch(() => { });
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Global animated background for premium look */}
      <AnimatedBackground />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicRoute>
            <LandingPage onGetStarted={() => navigate('/signup')} onLogin={() => navigate('/login')} />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignUpPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        {/* Protected Routes */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingFlow onComplete={() => navigate('/dashboard')} />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <DashboardLayout onLogout={handleLogout} />
          </ProtectedRoute>
        } />

        {/* Stripe return URLs */}
        <Route path="/payment/success" element={
          <ProtectedRoute>
            <PaymentSuccessPage />
          </ProtectedRoute>
        } />
        <Route path="/payment/cancel" element={
          <ProtectedRoute>
            <PaymentCancelPage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', padding: '16px', fontSize: '14px' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <AccessibilityOverlays />
      <AccessibilityPanel />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <EyeTrackingWrapper>
          <AppContent />
        </EyeTrackingWrapper>
      </BrowserRouter>
    </QueryClientProvider>

  );
}