// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AllFlatsPage from './pages/AllFlatsPage'; // <--- Make sure this is imported
import CreateFlatPage from './pages/CreateFlatPage'; // <--- Make sure this is imported

import { useAuth } from './context/AuthContext';

import './index.css';

// Component for the Navigation Bar
const NavBar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  console.log('NavBar: Rendering. isAuthenticated:', isAuthenticated);

  return (
    <nav className="bg-surface-card shadow-md p-4 border-b border-border-subtle">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary-accent">
          Flat Manager
        </Link>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-text-secondary text-sm">
                Welcome, {user?.firstName} ({user?.userType})
              </span>
              <Link to="/dashboard" className="px-4 py-2 rounded-xl text-primary-accent hover:bg-gray-100 transition duration-200">
                Dashboard
              </Link>
              {user?.userType === 'tenant' && (
                <Link to="/flats" className="px-4 py-2 rounded-xl text-primary-accent hover:bg-gray-100 transition duration-200">
                  Browse Flats
                </Link>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 rounded-3xl bg-primary-accent text-white hover:bg-accent-hover transition duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/flats" className="px-4 py-2 rounded-xl text-primary-accent hover:bg-gray-100 transition duration-200">
                Browse All Flats
              </Link>
              <Link to="/login" className="px-4 py-2 rounded-xl text-primary-accent hover:bg-gray-100 transition duration-200">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-3xl bg-primary-accent text-white hover:bg-accent-hover transition duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105">
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
    <div className="min-h-screen flex flex-col font-normal text-text-primary">
      <NavBar />

      <main className="flex-grow container mx-auto p-4 flex items-center justify-center bg-surface-scaffold">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/flats" element={<AllFlatsPage />} /> {/* <--- Route for AllFlatsPage */}
          {/* Protected route for creating a flat (Owner only) */}
          <Route path="/flats/create" element={
            <PrivateRoute>
              <CreateFlatPage />
            </PrivateRoute>
          } /> {/* <--- Route for CreateFlatPage */}
          {/* Protect the DashboardPage */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          {/* Add more routes here as your app grows */}
        </Routes>
      </main>

      <footer className="bg-surface-card p-4 text-center text-text-secondary border-t border-border-subtle mt-auto">
        <p>&copy; {new Date().getFullYear()} Flat Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
