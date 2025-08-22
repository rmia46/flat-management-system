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
import { LoadingSpinner } from '@/components/common/LoadingSpinner'; // Assuming you have this import

const LoginPage: React.FC = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading to true on submit
    try {
      const result = await loginUser({ email, password }); // Capture the result object

      if (result.success) {
        // Login successful, AuthContext already handles navigation to dashboard
        // No explicit action needed here for successful login
      } else if (result.needsVerification && result.emailForVerification) {
        // Account not verified, redirect to verification page
        navigate('/verify-email', { state: { email: result.emailForVerification } });
      }

      // If result.success is false and not needsVerification, an error toast
      // has already been shown by AuthContext.
    } catch (err) {
      // This catch block might not be hit if AuthContext handles all rejections internally
      // but it's good practice to have.
      console.error('Login page error:', err);
      toast.error('An unexpected error occurred during login.');
    } finally {
      setLoading(false); // Set loading to false after attempt
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