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
  emailForVerification?: string; // Ensure this is present
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
        toast.error("Your session has been corrupted. Please log in again.");
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log("Interceptor: 401 Unauthorized received. Logging out.");
          logout();
          toast.error("Your session has expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [navigate]);


  const loginUser = async (credentials: any): Promise<LoginResult> => {
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
      toast.success('Login successful!');
      console.log('AuthContext: Login successful!');
      return { success: true };
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      
      if (error.response?.status === 403 && error.response?.data?.email) {
        toast.error(message);
        // Ensure emailForVerification is returned here
        return { success: false, needsVerification: true, emailForVerification: error.response.data.email };
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
      const res = await register(userData);
      const { verificationToken, userEmail } = res.data; 

      console.log('AuthContext: Registration successful, awaiting verification!');
      return { success: true, verificationToken, userEmail }; 
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      const message = (error as any).response?.data?.message || 'Registration failed. Please try again.';
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