// frontend/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await loginUser({ email, password });
    if (!success) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="bg-surface-card p-8 rounded-4xl shadow-lg w-full max-w-md border border-border-subtle"> 
      <h2 className="text-3xl font-bold text-center mb-6 text-text-primary">Login</h2> 
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-600 text-center mb-4 font-normal">{error}</p>} 
        <div className="mb-4">
          <label htmlFor="email" className="block text-text-secondary text-sm font-medium mb-2"> 
            Email:
          </label>
          <input
            type="email"
            id="email"
            className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-text-secondary text-sm font-medium mb-2">
            Password:
          </label>
          <input
            type="password"
            id="password"
            className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-primary-accent hover:bg-accent-hover text-white rounded-3xl font-bold py-2 px-4 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-opacity-50 transition duration-200 transform hover:scale-105"
          > 
            Sign In
          </button>
          <Link to="/register" className="inline-block align-baseline font-medium text-sm text-primary-accent hover:text-accent-hover transition duration-200"> 
            Don't have an account? Register!
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
