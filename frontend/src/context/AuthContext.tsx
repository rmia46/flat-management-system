// frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { setAuthToken, login, register } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  verified: boolean;
  phone?: string;
  nid?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (credentials: any) => Promise<boolean>;
  registerUser: (userData: any) => Promise<boolean>;
  logout: () => void;
  refreshTrigger: number; 
  triggerRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const navigate = useNavigate();

  console.log('AuthContext: Initializing/Re-rendering AuthProvider');
  console.log('AuthContext: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
  console.log('AuthContext: User:', user);

  useEffect(() => {
    console.log('AuthContext: useEffect running (initial load)');
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setAuthToken(storedToken);
        console.log('AuthContext: User and token loaded from localStorage.');
      } catch (e) {
        console.error("AuthContext: Failed to parse stored user or token:", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setAuthToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  const loginUser = async (credentials: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await login(credentials);
      const { token: receivedToken, user: userData } = res.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(receivedToken);
      setUser(userData);
      setIsAuthenticated(true);
      setAuthToken(receivedToken);
      navigate('/dashboard');
      console.log('AuthContext: Login successful!');
      return true;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      return false;
    } finally {
        setIsLoading(false);
    }
  };

  const registerUser = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await register(userData);
      const { token: receivedToken, user: newUser } = res.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(receivedToken);
      setUser(newUser);
      setIsAuthenticated(true);
      setAuthToken(receivedToken);
      navigate('/dashboard');
      console.log('AuthContext: Registration successful!');
      return true;
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      return false;
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    setIsLoading(false);
    navigate('/login');
    console.log('AuthContext: User logged out.');
  };

  const triggerRefresh = () => { // <--- ADD THIS FUNCTION
    setRefreshTrigger(prev => prev + 1);
  };

  const authContextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    loginUser,
    registerUser,
    logout,
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};