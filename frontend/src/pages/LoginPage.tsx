// frontend/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button'; // IMPORT SHADCN BUTTON
import { Input } from '@/components/ui/input';   // IMPORT SHADCN INPUT
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // IMPORT SHADCN CARD COMPONENTS

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
    <Card className="p-8 shadow-lg border border-border w-full max-w-md text-card-foreground"> 
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-foreground mb-2">Login</CardTitle> 
        {error && <CardDescription className="text-destructive font-normal">{error}</CardDescription>} 
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label htmlFor="email" className="block text-muted-foreground text-sm font-medium mb-2">
              Email:
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            /> 
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-muted-foreground text-sm font-medium mb-2">
              Password:
            </label>
            <Input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            /> 
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" className="transition-colors duration-200 transform hover:scale-[1.02]"> 
              Sign In
            </Button>
            <Link to="/register" className="inline-block align-baseline text-sm font-medium text-foreground hover:text-primary transition-colors duration-200">
              Don't have an account? Register!
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
