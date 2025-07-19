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
    <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md border border-border text-card-foreground"> 
      <h2 className="text-3xl font-bold text-center mb-6 text-foreground">Register</h2> 
      <form onSubmit={handleSubmit}>
        {error && <p className="text-destructive text-center mb-4 font-normal">{error}</p>} 
        <div className="mb-4">
          <label htmlFor="firstName" className="block text-muted-foreground text-sm font-medium mb-2">
            First Name:
          </label>
          <input
            type="text"
            id="firstName"
            className="shadow-sm appearance-none rounded-md w-full py-2 px-3 bg-input text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200 font-normal"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="lastName" className="block text-muted-foreground text-sm font-medium mb-2">
            Last Name:
          </label>
          <input
            type="text"
            id="lastName"
            className="shadow-sm appearance-none rounded-md w-full py-2 px-3 bg-input text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200 font-normal"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-muted-foreground text-sm font-medium mb-2">
            Email:
          </label>
          <input
            type="email"
            id="email"
            className="shadow-sm appearance-none rounded-md w-full py-2 px-3 bg-input text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200 font-normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-muted-foreground text-sm font-medium mb-2">
            Password:
          </label>
          <input
            type="password"
            id="password"
            className="shadow-sm appearance-none rounded-md w-full py-2 px-3 bg-input text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200 font-normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="userType" className="block text-muted-foreground text-sm font-medium mb-2">
            Register as:
          </label>
          <select
            id="userType"
            className="shadow-sm border border-input rounded-md w-full py-2 px-3 bg-input text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200 font-normal"
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
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-2 px-4 rounded-md shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 transition-colors duration-200 transform hover:scale-[1.02]"
          >
            Register
          </button>
          <Link to="/login" className="inline-block align-baseline font-medium text-sm text-foreground hover:text-primary transition-colors duration-200">
            Already have an account? Login!
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
