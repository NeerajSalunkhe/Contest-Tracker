import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyAdmin: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  verifyAdmin: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const adminStatus = localStorage.getItem('isAdmin');
      
      if (token) {
        // Set up axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsAuthenticated(true);
      } else {
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        if (window.location.pathname !== '/auth') {
          navigate('/auth');
        }
      }

      if (adminStatus === 'true') {
        setIsAdmin(true);
      }
    };

    checkAuth();
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      const { token } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        email,
        password,
      });
      const { token } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate('/auth');
  };

  const verifyAdmin = async (password: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/verify-admin`, { password });
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
    } catch (error) {
      throw new Error('Admin verification failed');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, register, logout, verifyAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);