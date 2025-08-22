// frontend/src/pages/VerifyEmailPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

const VerifyEmailPage: React.FC = () => {
  const { user, isAuthenticated, loginUser } = useAuth(); // We might need loginUser if we want to log them in directly
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail = location.state?.email || user?.email; // Get email from state or current user

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // If the user is already verified, redirect to dashboard
    if (isAuthenticated && user?.verified) {
      navigate('/dashboard', { replace: true });
    }
    // If no email is available, redirect to register
    if (!registeredEmail && !isAuthenticated) {
        navigate('/register', { replace: true });
        toast.info('Please register to receive a verification code.');
    }
  }, [isAuthenticated, user, navigate, registeredEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!registeredEmail) {
      toast.error('No email found for verification. Please register again.');
      setLoading(false);
      return;
    }

    try {
      const res = await verifyEmail(registeredEmail, code);
      toast.success(res.data.message);
      setMessage(res.data.message);

      // After successful verification, log the user in directly or redirect to login
      // For simplicity, we'll just update the user in AuthContext and redirect to dashboard
      // If the backend returns a token and updated user, we can use that.
      if (res.data.token && res.data.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        // Force re-authentication or update context directly
        // A simple way is to reload the window or trigger a manual login
        // For now, let's just navigate to dashboard and AuthContext will pick up new local storage
        navigate('/dashboard', { replace: true });
        // You might want to call a context function here to update the user state
        // e.g., authContext.updateUser(res.data.user);
      } else {
        // If no token/user returned, redirect to login page
        navigate('/login', { replace: true });
      }

    } catch (err: any) {
      console.error('Email verification failed:', err);
      const errorMessage = err.response?.data?.message || 'Failed to verify email. Please try again.';
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!registeredEmail) {
    return (
        <Card className="p-8 shadow-lg border border-border w-full max-w-md text-card-foreground text-center">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-foreground mb-2">Verification Required</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Redirecting to registration page...
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoadingSpinner size={32} className="text-primary mx-auto" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="p-8 shadow-lg border border-border w-full max-w-md text-card-foreground">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-foreground mb-2">Verify Your Email</CardTitle>
        <CardDescription className="text-muted-foreground">
          A 6-digit verification code has been sent to <strong>{registeredEmail}</strong>.
          Please enter it below to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-muted-foreground text-sm font-medium mb-2">
              Verification Code:
            </label>
            <Input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              className="text-center text-lg tracking-widest"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner className="mr-2" size={16} />
                Verifying...
              </>
            ) : (
              'Verify Account'
            )}
          </Button>
          {message && <p className={`mt-4 text-center text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-destructive'}`}>{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
};

export default VerifyEmailPage;
