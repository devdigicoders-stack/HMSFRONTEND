import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hms_token') || null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hms_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.data.user);
        } catch (error) {
          console.error('[Auth Init Error] Token invalid or expired:', error);
          localStorage.removeItem('hms_token');
          localStorage.removeItem('hms_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('hms_token', receivedToken);
    localStorage.setItem('hms_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (patientData) => {
    const res = await authService.register(patientData);
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('hms_token', receivedToken);
    localStorage.setItem('hms_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data.user);
      localStorage.setItem('hms_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const getDefaultRouteForRole = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'lab':
        return '/lab/dashboard';
      case 'patient':
        return '/patient/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        role: user ? user.role : null,
        login,
        register,
        logout,
        confirmLogout,
        refreshUser,
        getDefaultRouteForRole
      }}
    >
      {children}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        title="Confirm Sign Out"
        message="Are you sure you want to log out of your session? You will need to log back in to access the hospital portal."
        confirmText="Log Out"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
