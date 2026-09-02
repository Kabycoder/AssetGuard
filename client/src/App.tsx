import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { SanitizationPage } from './pages/SanitizationPage';
import { VerificationPage } from './pages/VerificationPage';
import { DisposalPage } from './pages/DisposalPage';
import { ReportsPage } from './pages/ReportsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* General Authenticated Routes */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="assets" element={<AssetsPage />} />

            {/* IT Officer & Admin Protected Routes */}
            <Route
              path="sanitization"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'IT_OFFICER']}>
                  <SanitizationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="verification"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'IT_OFFICER']}>
                  <VerificationPage />
                </ProtectedRoute>
              }
            />

            {/* Disposal Officer & Admin Protected Routes */}
            <Route
              path="disposal"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DISPOSAL_OFFICER']}>
                  <DisposalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DISPOSAL_OFFICER']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
