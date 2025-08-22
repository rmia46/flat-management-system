// frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { setAuthToken, login, register, api } from '../services/api'; // <-- NEW: Import the api instance
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
        toast.error("Your session has been corrupted. Please log in again.");
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  // <-- NEW: This is the hotfix! Set up the Axios response interceptor here.
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Automatically log out if a 401 Unauthorized response is received
        if (error.response?.status === 401) {
          console.log("Interceptor: 401 Unauthorized received. Logging out.");
          logout();
          toast.error("Your session has expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );
    // Clean up the interceptor when the component unmounts
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [navigate]); // <-- navigate is a dependency to ensure proper routing after logout


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
      toast.success('Login successful!');
      console.log('AuthContext: Login successful!');
      return true;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      const message = (error as any).response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      return false;
    } finally {
        setIsLoading(false);
    }
  };

  const registerUser = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await register(userData);
      const { token: _receivedToken, user: _newUser } = res.data;


      // Do NOT set token and user in local storage immediately after registration
      // The user needs to verify their email first.
      // localStorage.setItem('token', receivedToken);
      // localStorage.setItem('user', JSON.stringify(newUser));

      // Instead, we just acknowledge registration and prepare for verification
      // setToken(receivedToken); // We might not need to store this token yet
      // setUser(newUser); // We might not need to store this user yet
      // setIsAuthenticated(true); // User is not authenticated until verified
      // setAuthToken(receivedToken); // Token is not active until verified

      console.log('AuthContext: Registration successful, awaiting verification!');
      // No toast.success here, as RegisterPage will handle it and redirect
      return true; // Indicate success for the RegisterPage to redirect
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      const message = (error as any).response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
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
    toast.info('Logged out successfully.');
  };

  const triggerRefresh = () => {
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
