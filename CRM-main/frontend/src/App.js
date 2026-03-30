import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthCallback } from './components/AuthCallback';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { ManagementDashboard } from './pages/management/ManagementDashboard';
import { Toaster } from './components/ui/toaster';
import './App.css';

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment synchronously during render to prevent race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/officer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'admission_officer']}>
            <OfficerDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/management/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'admission_officer', 'management']}>
            <ManagementDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
