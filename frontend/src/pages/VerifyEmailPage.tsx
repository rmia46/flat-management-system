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
  const { isAuthenticated, user, setAuthData } = useAuth(); // Destructure setAuthData
  const navigate = useNavigate();
  const location = useLocation();
  
  const registeredEmail = location.state?.email;
  const verificationToken = location.state?.verificationToken;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.verified) {
      navigate('/dashboard', { replace: true });
    }
    if (!registeredEmail || !verificationToken) {
        navigate('/register', { replace: true });
        toast.info('Please register to receive a verification code.');
    }
  }, [isAuthenticated, user, navigate, registeredEmail, verificationToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!registeredEmail || !verificationToken) {
      toast.error('Missing registration details. Please register again.');
      setLoading(false);
      return;
    }

    try {
      const res = await verifyEmail(registeredEmail, code, verificationToken);
      toast.success(res.data.message);
      setMessage(res.data.message);

      // Auto-login logic: Call setAuthData from context
      if (res.data.token && res.data.user) {
        setAuthData(res.data.token, res.data.user); // Call setAuthData to update context and localStorage
        navigate('/dashboard', { replace: true }); // Navigate after state is set
      } else {
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

  if (!registeredEmail || !verificationToken) {
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