import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StudentProtectedRoute } from './components/StudentProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';

// Auth Pages
import { StudentLogin } from './pages/auth/StudentLogin';
import { StudentRegister } from './pages/auth/StudentRegister';
import { AdminLogin } from './pages/auth/AdminLogin';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { QrScannerPage } from './pages/student/QrScannerPage';
import { ActiveRentalPage } from './pages/student/ActiveRentalPage';
import { RentalSummaryPage } from './pages/student/RentalSummaryPage';
import { RentalHistoryPage } from './pages/student/RentalHistoryPage';
import { PaymentHistoryPage } from './pages/student/PaymentHistoryPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBicyclesPage } from './pages/admin/AdminBicyclesPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminRentalsPage } from './pages/admin/AdminRentalsPage';
import { AdminPricingPage } from './pages/admin/AdminPricingPage';
import { AdminMaintenancePage } from './pages/admin/AdminMaintenancePage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.type === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public & Auth Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<StudentLogin />} />
              <Route path="/register" element={<StudentRegister />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Student Routes */}
              <Route element={<StudentProtectedRoute />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/scan" element={<QrScannerPage />} />
                <Route path="/scan/:token" element={<QrScannerPage />} />
                <Route path="/student/active-rental" element={<ActiveRentalPage />} />
                <Route path="/student/rental-summary/:rentalId" element={<RentalSummaryPage />} />
                <Route path="/student/rentals" element={<RentalHistoryPage />} />
                <Route path="/student/payments" element={<PaymentHistoryPage />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/bicycles" element={<AdminBicyclesPage />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
                <Route path="/admin/rentals" element={<AdminRentalsPage />} />
                <Route path="/admin/pricing" element={<AdminPricingPage />} />
                <Route path="/admin/maintenance" element={<AdminMaintenancePage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
