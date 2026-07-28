import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const ALLOWED_ROLES = ['admin', 'wholesaler', 'retailer'];

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user  = localStorage.getItem('adminUser');
    if (token && user) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp < now) {
          _clear();
        } else {
          const parsed = JSON.parse(user);
          if (ALLOWED_ROLES.includes(parsed.role)) {
            setAdmin(parsed);
          } else {
            _clear();
          }
        }
      } catch {
        _clear();
      }
    }
    setLoading(false);
  }, []);

  const _clear = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  const login = (token, userData) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(userData));
    setAdmin(userData);
  };

  const logout = _clear;

  const isAdmin      = admin?.role === 'admin';
  const isWholesaler = admin?.role === 'wholesaler';
  const isRetailer   = admin?.role === 'retailer';

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading, isAdmin, isWholesaler, isRetailer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
