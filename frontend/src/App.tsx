// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AllFlatsPage from './pages/AllFlatsPage';
import CreateFlatPage from './pages/CreateFlatPage';
import { useAuth } from './context/AuthContext';

import './index.css'; // Global styles with shadcn variables

// Component for the Navigation Bar
const NavBar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  console.log('NavBar: Rendering. isAuthenticated:', isAuthenticated);

  return (
    <nav className="bg-card text-card-foreground shadow-sm p-4 border-b border-border"> 
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary"> 
          Flat Manager
        </Link>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-muted-foreground text-sm"> 
                Welcome, {user?.firstName} ({user?.userType})
              </span>
              
              <Link to="/dashboard" className="px-4 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200"> 
                Dashboard
              </Link>

              {user?.userType === 'tenant' && (
                <Link to="/flats" className="px-4 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200">
                  Browse Flats
                </Link>
              )}

              <button
                onClick={logout}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-200 font-medium shadow-sm" // Use destructive button for logout
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/flats" className="px-4 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200">
                Browse All Flats
              </Link>
              <Link to="/login" className="px-4 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-250">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-250 font-medium shadow-sm"> 
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Component to protect routes (redirects if not authenticated)
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  console.log('PrivateRoute: Checking isAuthenticated:', isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('PrivateRoute: Not authenticated, redirecting to /login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? <>{children}</> : null;
};


function App() {
    console.log('App: Rendering App component');
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground"> 
      <NavBar />

      <main className="flex-grow container mx-auto p-4 flex items-center justify-center"> 
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/flats" element={<AllFlatsPage />} />
          <Route path="/flats/create" element={
            <PrivateRoute>
              <CreateFlatPage />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
        </Routes>
      </main>

      <footer className="bg-card text-card-foreground p-4 text-center border-t border-border"> 
        <p>&copy; {new Date().getFullYear()} Flat Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
