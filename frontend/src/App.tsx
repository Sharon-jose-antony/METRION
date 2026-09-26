import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Public Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyCertificate } from './pages/VerifyCertificate';

// Owner Pages
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { InstrumentsList } from './pages/owner/InstrumentsList';
import { RegisterInstrument } from './pages/owner/RegisterInstrument';
import { InstrumentDetail } from './pages/owner/InstrumentDetail';
import { ApplicationsList } from './pages/owner/ApplicationsList';
import { NewApplication } from './pages/owner/NewApplication';
import { ApplicationDetail } from './pages/owner/ApplicationDetail';
import { CertificatesList } from './pages/owner/CertificatesList';

// LMO / GATC Pages
import { LmoDashboard } from './pages/lmo/LmoDashboard';
import { AssignmentsList } from './pages/lmo/AssignmentsList';
import { FieldVerification } from './pages/lmo/FieldVerification';
import { GatcDashboard } from './pages/gatc/GatcDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminApplications } from './pages/admin/AdminApplications';
import { AdminApplicationDetail } from './pages/admin/AdminApplicationDetail';
import { AdminInstruments } from './pages/admin/AdminInstruments';
import { AdminCertificates } from './pages/admin/AdminCertificates';
import { AdminRules } from './pages/admin/AdminRules';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  allowedRoles?: string[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="p-6 text-center space-y-2 bg-white rounded-md border border-slate-200 shadow-xs max-w-md mx-auto my-12">
        <h2 className="text-base font-bold text-rose-700">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Your current account role ({role}) does not have permission to access this section of the portal.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify/:token" element={<VerifyCertificate />} />

            {/* Owner */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['INSTRUMENT_OWNER', 'ADMIN']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/instruments"
              element={
                <ProtectedRoute allowedRoles={['INSTRUMENT_OWNER', 'ADMIN']}>
                  <InstrumentsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/instruments/new"
              element={
                <ProtectedRoute allowedRoles={['INSTRUMENT_OWNER', 'ADMIN']}>
                  <RegisterInstrument />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/instruments/:id"
              element={
                <ProtectedRoute allowedRoles={['INSTRUMENT_OWNER', 'ADMIN']}>
                  <InstrumentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/applications"
              element={
                <ProtectedRoute allowedRoles={['INSTRUMENT_OWNER', 'ADMIN']}>
                  <ApplicationsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/applications/new"
              element={
                <ProtectedRoute allowedRoles={['INSTRUMENT_OWNER', 'ADMIN']}>
                  <NewApplication />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/applications/:id"
              element={
                <ProtectedRoute allowedRoles={['INSTRUMENT_OWNER', 'ADMIN']}>
                  <ApplicationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/certificates"
              element={
                <ProtectedRoute allowedRoles={['INSTRUMENT_OWNER', 'ADMIN']}>
                  <CertificatesList />
                </ProtectedRoute>
              }
            />

            {/* LMO */}
            <Route
              path="/lmo/dashboard"
              element={
                <ProtectedRoute allowedRoles={['LMO', 'ADMIN']}>
                  <LmoDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lmo/assignments"
              element={
                <ProtectedRoute allowedRoles={['LMO', 'ADMIN']}>
                  <AssignmentsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lmo/verification/:id"
              element={
                <ProtectedRoute allowedRoles={['LMO', 'GATC', 'ADMIN']}>
                  <FieldVerification />
                </ProtectedRoute>
              }
            />

            {/* GATC */}
            <Route
              path="/gatc/dashboard"
              element={
                <ProtectedRoute allowedRoles={['GATC', 'ADMIN']}>
                  <GatcDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gatc/assignments"
              element={
                <ProtectedRoute allowedRoles={['GATC', 'ADMIN']}>
                  <AssignmentsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gatc/verification/:id"
              element={
                <ProtectedRoute allowedRoles={['GATC', 'ADMIN']}>
                  <FieldVerification />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminApplicationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/instruments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminInstruments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificates"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminCertificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rules"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminRules />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
