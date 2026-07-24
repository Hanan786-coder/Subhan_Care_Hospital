import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, getCurrentUser } from '../services/authService';
import useSessionTimeout from '../hooks/useSessionTimeout';

const AuthContext = createContext();

const FAILED_ATTEMPTS_KEY = 'sc_hms_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'sc_hms_lockout_until';

/**
 * Utility to decode JWT token without external libraries.
 * @param {string} token 
 * @returns {Object|null}
 */
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

/**
 * AuthProvider component to manage authentication state and session timeouts.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sc_hms_user') || sessionStorage.getItem('sc_hms_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sc_hms_token') || sessionStorage.getItem('sc_hms_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(true);

  // Logout handler
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('sc_hms_token');
    localStorage.removeItem('sc_hms_user');
    sessionStorage.removeItem('sc_hms_token');
    sessionStorage.removeItem('sc_hms_user');
    window.location.href = '/login';
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (token) {
      if (token === 'mock-jwt-token-12345') {
        setIsAuthenticated(true);
      } else {
        const decoded = parseJwt(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
        } else {
          logout(); // Token expired
        }
      }
    }
    setIsLoading(false);
  }, [token, logout]);

  // Session timeout setup (timeout minutes from env, fallback 15 mins per SRS FR-10.3)
  const sessionTimeoutMinutes = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '15', 10);
  
  const handleTimeoutWarning = useCallback(() => {
    if (isAuthenticated) {
      alert('Your session will expire in 1 minute due to inactivity.');
    }
  }, [isAuthenticated]);

  const handleTimeout = useCallback(() => {
    if (isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);

  useSessionTimeout(sessionTimeoutMinutes, handleTimeout, handleTimeoutWarning);

  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   * @param {boolean} rememberMe 
   * @returns {Promise<void>}
   */
  const login = async (email, password, rememberMe = false) => {
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || '0', 10);
    if (Date.now() < lockoutUntil) {
      const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      throw new Error(`Too many failed attempts. Try again in ${minutesLeft} minutes.`);
    }

    try {
      const data = await loginUser({ email, password });
      
      const { token: newToken, user: userData } = data;
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      const storage = rememberMe ? localStorage : sessionStorage;
      // Clear alternative storage
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem('sc_hms_token');
      otherStorage.removeItem('sc_hms_user');

      storage.setItem('sc_hms_token', newToken);
      storage.setItem('sc_hms_user', JSON.stringify(userData));
      
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_UNTIL_KEY);
    } catch (error) {
      let attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10);
      attempts += 1;
      localStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString());
      
      if (attempts >= 5) {
        const lockoutTime = Date.now() + 15 * 60 * 1000;
        localStorage.setItem(LOCKOUT_UNTIL_KEY, lockoutTime.toString());
        throw new Error('Too many failed attempts. Login blocked for 15 minutes.');
      }
      
      throw error;
    }
  };

  /**
   * Switch active user role (useful for testing RBAC dynamically)
   */
  const switchRole = (newRole) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('sc_hms_user', JSON.stringify(updatedUser));
  };

  /**
   * Refresh user details from API
   */
  const refreshUser = async () => {
    if (!token) return;
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      localStorage.setItem('sc_hms_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    switchRole,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * @returns {Object}
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
