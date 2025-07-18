// frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { setAuthToken, login, register } from '../services/api'; // Import your API service
import { useNavigate } from 'react-router-dom';

// Define the shape of the user data we expect
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  verified: boolean;
}

// Define the shape of the AuthContext value
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginUser: (credentials: any) => Promise<boolean>;
  registerUser: (userData: any) => Promise<boolean>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Load token and user from localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setAuthToken(storedToken); // Set Axios default header
      } catch (e) {
        console.error("Failed to parse stored user or token:", e);
        logout(); // Clear invalid data
      }
    }
  }, []);

  const loginUser = async (credentials: any): Promise<boolean> => {
    try {
      const res = await login(credentials);
      const { token: receivedToken, user: userData } = res.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(receivedToken);
      setUser(userData);
      setIsAuthenticated(true);
      setAuthToken(receivedToken); // Set Axios default header
      navigate('/dashboard'); // Redirect to dashboard on successful login
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      // Handle error (e.g., display error message to user)
      return false;
    }
  };

  const registerUser = async (userData: any): Promise<boolean> => {
    try {
      const res = await register(userData);
      const { token: receivedToken, user: newUser } = res.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(receivedToken);
      setUser(newUser);
      setIsAuthenticated(true);
      setAuthToken(receivedToken); // Set Axios default header
      navigate('/dashboard'); // Redirect to dashboard on successful registration
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      // Handle error
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null); // Clear Axios default header
    navigate('/login'); // Redirect to login page on logout
  };

  const authContextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    loginUser,
    registerUser,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
