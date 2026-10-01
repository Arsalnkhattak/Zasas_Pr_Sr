import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ui/Toast';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { DocumentCenter } from './pages/dashboard/DocumentCenter';
import { ReviewConfirmPage } from './pages/dashboard/ReviewConfirmPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { ProgramsPage } from './pages/dashboard/ProgramsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Dashboard Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="documents" element={<DocumentCenter />} />
              <Route path="review" element={<ReviewConfirmPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="programs" element={<ProgramsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
