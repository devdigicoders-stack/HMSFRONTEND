import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading, getDefaultRouteForRole } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Authenticating user session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
