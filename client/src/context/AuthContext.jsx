import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('breachalert_token'));
  const [loading, setLoading] = useState(true);

  // Load current user profile if token exists
  const fetchCurrentUser = async () => {
    if (!localStorage.getItem('breachalert_token')) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('[AuthContext] Fetch user failed:', err?.response?.data?.error || err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('breachalert_token', newToken);
      setToken(newToken);
      setUser(userData);
      return response.data;
    }
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.success) {
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('breachalert_token', newToken);
      setToken(newToken);
      setUser(userData);
      return response.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('breachalert_token');
    setToken(null);
    setUser(null);
  };

  const updatePlan = async (newPlan) => {
    const response = await api.post('/subscription/upgrade', { plan: newPlan });
    if (response.data.success) {
      setUser((prev) => (prev ? { ...prev, plan: newPlan } : null));
      await fetchCurrentUser();
      return response.data;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updatePlan,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
