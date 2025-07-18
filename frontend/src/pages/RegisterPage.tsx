// frontend/src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const { registerUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('tenant');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await registerUser({ firstName, lastName, email, password, userType });
    if (!success) {
      setError('Registration failed. Please try again with different details.');
    }
  };

  return (
    <div className="bg-surface-card p-8 rounded-4xl shadow-lg w-full max-w-md border border-border-subtle">
      <h2 className="text-3xl font-bold text-center mb-6 text-text-primary">Register</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-600 text-center mb-4 font-normal">{error}</p>}
        <div className="mb-4">
          <label htmlFor="firstName" className="block text-text-secondary text-sm font-medium mb-2">
            First Name:
          </label>
          <input
            type="text"
            id="firstName"
            className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="lastName" className="block text-text-secondary text-sm font-medium mb-2">
            Last Name:
          </label>
          <input
            type="text"
            id="lastName"
            className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
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
        <div className="mb-4">
          <label htmlFor="password" className="block text-text-secondary text-sm font-medium mb-2">
            Password:
          </label>
          <input
            type="password"
            id="password"
            className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="userType" className="block text-text-secondary text-sm font-medium mb-2">
            Register as:
          </label>
          <select
            id="userType"
            className="shadow-sm border-border-subtle rounded-xl w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
          >
            <option value="tenant">Tenant</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-primary-accent hover:bg-accent-hover text-white rounded-3xl font-bold py-2 px-4 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-opacity-50 transition duration-200 transform hover:scale-105"
          >
            Register
          </button>
          <Link to="/login" className="inline-block align-baseline font-medium text-sm text-primary-accent hover:text-accent-hover transition duration-200">
            Already have an account? Login!
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
