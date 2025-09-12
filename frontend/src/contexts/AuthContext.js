import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Trigger sidebar refresh
      window.dispatchEvent(new Event('userDataChanged'));

      // Return both token and user data
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const hasPermission = (moduleName) => {
    if (!user || !user.role || !user.role.permissions) {
      return false;
    }

    // Handle special case for admin role (case-insensitive)
    if (user.role.name && user.role.name.toLowerCase() === 'admin') {
      return true;
    }

    // For non-admin roles, check specific permissions
    const permission = user.role.permissions.find(p => p.module === moduleName);
    if (!permission) {
      // If no specific permission is found, check if the role name contains 'admin'
      return user.role.name && user.role.name.toLowerCase().includes('admin');
    }
    return permission.visible;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 