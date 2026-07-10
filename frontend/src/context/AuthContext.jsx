import { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { setToken, getToken, setUser, getUser, clearAuth as clearAuthStorage } from '../utils/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        const savedUser = getUser();
        if (savedUser) {
          setUserState(savedUser);
          setIsAuthenticated(true);
        }
        // Try to refresh user data from server
        try {
          const res = await authApi.getCurrentUser();
          if (res.data?.user) {
            setUserState(res.data.user);
            setUser(res.data.user);
            setIsAuthenticated(true);
          }
        } catch (err) {
          // If server check fails but we have local data, keep using it
          console.log('Could not refresh user data');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const adminLogin = useCallback(async (credentials) => {
    const response = await authApi.adminLogin(credentials);
    return response.data;
  }, []);

  const adminVerify2FA = useCallback(async (data) => {
    const response = await authApi.adminVerify2FA(data);
    if (response.data.token) {
      setToken(response.data.token);
      setUser(response.data.user);
      setUserState(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  }, []);

  const lecturerLogin = useCallback(async (credentials) => {
    const response = await authApi.lecturerLogin(credentials);
    return response.data;
  }, []);

  const lecturerVerify2FA = useCallback(async (data) => {
    const response = await authApi.lecturerVerify2FA(data);
    if (response.data.token) {
      setToken(response.data.token);
      setUser(response.data.user);
      setUserState(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUserState(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    adminLogin,
    adminVerify2FA,
    lecturerLogin,
    lecturerVerify2FA,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};