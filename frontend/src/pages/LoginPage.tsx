// frontend/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const LoginPage: React.FC = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginUser({ email, password });

      if (result.success) {
        // Successful login is handled by AuthContext, including navigation
      } else if (result.needsVerification && result.emailForVerification) {
        // If login fails because account is not verified, navigate to the verification page
        navigate('/verify-email', { state: { email: result.emailForVerification } });
      }
      // Other error toasts are handled by the api service and AuthContext
    } catch (err) {
      // This catch block is a fallback, but errors are primarily handled in the service/context layers
      console.error('Login page error:', err);
      toast.error('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
     <Card className="p-8 shadow-lg border border-border w-full max-w-md text-card-foreground">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-foreground mb-2">Login</CardTitle>
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
            <Button type="submit" className="transition-colors duration-200 transform hover:scale-[1.02]" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner className="mr-2" size={16} />
                  Logging In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <Link to="/forgot-password" className="inline-block align-baseline text-sm font-medium text-foreground hover:text-primary transition-colors duration-200">
              Forgot password?
            </Link>
          </div>
          <Link to="/register" className="block text-center align-baseline text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 mt-2">
            Don't have an account? Register!
          </Link>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginPage;