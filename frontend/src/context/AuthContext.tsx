// frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { setAuthToken, login, register, api } from '../services/api'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

interface RegisterUserResponse {
  success: boolean;
  verificationToken?: string;
  userEmail?: string;
}

interface LoginResult {
  success: boolean;
  needsVerification?: boolean;
  emailForVerification?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (credentials: any) => Promise<LoginResult>;
  registerUser: (userData: any) => Promise<RegisterUserResponse>; 
  logout: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  setAuthData: (token: string, user: User) => void;
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

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // ADD THIS CHECK
        if (typeof parsedUser.verified === 'undefined') {
          throw new Error('User data in local storage is outdated. Please log in again.');
        }
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setAuthToken(storedToken);
      } catch (e: any) { // Catch the new error type
        toast.error(e.message || "Your session has been corrupted. Please log in again.");
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          toast.error("Your session has expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [navigate]);


  const loginUser = async (credentials: any): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const response = await login(credentials);
      // **FIXED**: Correctly destructure from the nested 'data' object in the response
      const { token: receivedToken, user: userData } = response.data.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(receivedToken);
      setUser(userData);
      setIsAuthenticated(true);
      setAuthToken(receivedToken);
      navigate('/dashboard');
      toast.success('Login successful!');
      return { success: true };
    } catch (error: any) {
      const message = error.message || 'Login failed. Please check your credentials.';
      
      if (message.includes('Account not verified')) {
        toast.error(message);
        return { success: false, needsVerification: true, emailForVerification: credentials.email };
      }

      toast.error(message);
      return { success: false };
    } finally {
        setIsLoading(false);
    }
  };

  const registerUser = async (userData: any): Promise<RegisterUserResponse> => {
    setIsLoading(true);
    try {
      const response = await register(userData);
      // **FIXED**: Correctly destructure from the nested 'data' object
      const { verificationToken, userEmail } = response.data.data; 

      return { success: true, verificationToken, userEmail }; 
    } catch (error: any) {
      const message = (error as any).message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false };
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
    toast.info('Logged out successfully.');
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const setAuthData = (receivedToken: string, userData: User) => {
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(receivedToken);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthToken(receivedToken);
    toast.success('You are now logged in!');
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
    setAuthData,
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