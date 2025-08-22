// frontend/src/pages/VerifyEmailPage.tsx
import React, { useState, useEffect, useRef } from 'react'; // NEW: Import useRef
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerificationCode } from '../services/api';
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
  const { isAuthenticated, user, setAuthData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const registeredEmailFromState = location.state?.email;
  const initialVerificationToken = location.state?.verificationToken;

  const [registeredEmail, setRegisteredEmail] = useState<string | null>(registeredEmailFromState || null);
  const [currentVerificationToken, setCurrentVerificationToken] = useState<string | null>(initialVerificationToken || null);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  const hasResentRef = useRef(false); // NEW: Ref to prevent multiple automatic resends

  useEffect(() => {
    if (isAuthenticated && user?.verified) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Scenario 1: No email available at all -> redirect to registration
    if (!registeredEmail) {
        navigate('/register', { replace: true });
        toast.info('Please register to receive a verification code.');
        return;
    }

    // Scenario 2: Email is available, but no token (coming from unverified login)
    // Automatically resend code if no token and haven't tried to resend yet
    if (registeredEmail && !currentVerificationToken && !hasResentRef.current) {
        hasResentRef.current = true; // Mark that we've attempted an automatic resend
        const autoResend = async () => {
            setResending(true);
            setMessage('');
            try {
                const res = await resendVerificationCode(registeredEmail);
                toast.success(res.data.message);
                setMessage(res.data.message);
                setCurrentVerificationToken(res.data.verificationToken);
            } catch (err: any) {
                console.error('Error auto-resending code:', err);
                const errorMessage = err.response?.data?.message || 'Failed to auto-resend code.';
                toast.error(errorMessage);
                setMessage(errorMessage);
            } finally {
                setResending(false);
            }
        };
        autoResend();
    }
  }, [isAuthenticated, user, navigate, registeredEmail, currentVerificationToken]); // MODIFIED dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!registeredEmail || !currentVerificationToken) {
      toast.error('Missing registration details or verification token. Please resend code.');
      setLoading(false);
      return;
    }

    try {
      const res = await verifyEmail(registeredEmail, code, currentVerificationToken);
      toast.success(res.data.message);
      setMessage(res.data.message);

      if (res.data.token && res.data.user) {
        setAuthData(res.data.token, res.data.user);
        navigate('/dashboard', { replace: true });
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

  const handleResendCode = async () => {
    setResending(true);
    setMessage('');
    if (!registeredEmail) {
      toast.error('No email available to resend code.');
      setResending(false);
      return;
    }

    try {
      const res = await resendVerificationCode(registeredEmail);
      toast.success(res.data.message);
      setMessage(res.data.message);
      setCurrentVerificationToken(res.data.verificationToken);
    } catch (err: any) {
      console.error('Error resending code:', err);
      const errorMessage = err.response?.data?.message || 'Failed to resend code.';
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setResending(false);
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

        {/* Resend Code Section - Always visible */}
        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            Didn't receive a code or it expired?
          </p>
          <Button 
            onClick={handleResendCode} 
            disabled={resending || loading} // Disable if already resending or verifying
            variant="outline"
            className="w-full"
          >
            {resending ? (
              <>
                <LoadingSpinner className="mr-2" size={16} />
                Resending...
              </>
            ) : (
              'Resend Code'
            )}
          </Button>
        </div>
        {/* End Resend Code Section */}
      </CardContent>
    </Card>
  );
};

export default VerifyEmailPage;
