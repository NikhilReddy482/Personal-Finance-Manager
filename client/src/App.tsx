import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './layouts/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { MFAPage } from './pages/auth/MFAPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

import { DashboardPage } from './pages/app/DashboardPage';
import { TransactionsPage } from './pages/app/TransactionsPage';
import { ImportPage } from './pages/app/ImportPage';
import { AnalyticsPage } from './pages/app/AnalyticsPage';
import { BudgetsPage } from './pages/app/BudgetsPage';
import { SubscriptionsPage } from './pages/app/SubscriptionsPage';
import { AnomaliesPage } from './pages/app/AnomaliesPage';
import { InsightsPage } from './pages/app/InsightsPage';
import { AssistantPage } from './pages/app/AssistantPage';
import { SecuritySettingsPage } from './pages/app/SecuritySettingsPage';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/mfa" element={<MFAPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Workspace Routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="import" element={<ImportPage />} />
                <Route path="review" element={<Navigate to="/app/transactions" replace />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="budgets" element={<BudgetsPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="anomalies" element={<AnomaliesPage />} />
                <Route path="goals" element={<Navigate to="/app/budgets" replace />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="assistant" element={<AssistantPage />} />
                <Route path="settings/security" element={<SecuritySettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
