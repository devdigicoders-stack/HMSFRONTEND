import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DoctorManagement from './pages/admin/DoctorManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import PatientManagement from './pages/admin/PatientManagement';
import AppointmentManagement from './pages/admin/AppointmentManagement';
import LabManagement from './pages/admin/LabManagement';
import ReportsSettings from './pages/admin/ReportsSettings';
import HospitalSettings from './pages/admin/HospitalSettings';
import AdminProfilePage from './pages/admin/AdminProfilePage';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDirectory from './pages/patient/DoctorDirectory';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientMedicalRecords from './pages/patient/PatientMedicalRecords';
import PatientLabReports from './pages/patient/PatientLabReports';
import PatientProfilePage from './pages/patient/PatientProfilePage';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorLabRequests from './pages/doctor/DoctorLabRequests';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';

// Lab Pages
import LabDashboard from './pages/lab/LabDashboard';
import LabQueue from './pages/lab/LabQueue';
import LabResultEntry from './pages/lab/LabResultEntry';
import LabTestCatalog from './pages/lab/LabTestCatalog';
import LabProfilePage from './pages/lab/LabProfilePage';

import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Root index redirect
const RootRedirect = () => {
  const { isAuthenticated, user, loading, getDefaultRouteForRole } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Connecting to LifeCare Hospital terminal..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
};

function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Admin Module */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="doctors" element={<DoctorManagement />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="patients" element={<PatientManagement />} />
        <Route path="appointments" element={<AppointmentManagement />} />
        <Route path="laboratory" element={<LabManagement />} />
        <Route path="reports" element={<ReportsSettings />} />
        <Route path="settings" element={<HospitalSettings />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      {/* Patient Module */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="doctors" element={<DoctorDirectory />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="medical-records" element={<PatientMedicalRecords />} />
        <Route path="lab-reports" element={<PatientLabReports />} />
        <Route path="profile" element={<PatientProfilePage />} />
      </Route>

      {/* Doctor Module */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="lab-requests" element={<DoctorLabRequests />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="profile" element={<DoctorProfilePage />} />
      </Route>

      {/* Lab Module */}
      <Route
        path="/lab"
        element={
          <ProtectedRoute allowedRoles={['lab']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<LabDashboard />} />
        <Route path="queue" element={<LabQueue />} />
        <Route path="results" element={<LabResultEntry />} />
        <Route path="catalog" element={<LabTestCatalog />} />
        <Route path="profile" element={<LabProfilePage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
