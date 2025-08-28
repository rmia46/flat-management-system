// frontend/src/pages/PasswordResetVerificationPage.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyPasswordResetCode as verifyApi, setNewPassword as setPasswordApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const PasswordResetVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const resetToken = location.state?.resetToken;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [passwordChangeToken, setPasswordChangeToken] = useState<string | null>(null);

  if (!email || !resetToken) {
    return (
      <Card className="p-8 shadow-lg border border-border w-full max-w-md text-card-foreground text-center">
        <CardHeader>
          <CardTitle>Invalid Request</CardTitle>
          <CardDescription>
            You must request a password reset from the previous page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/forgot-password"><Button>Request Reset</Button></Link>
        </CardContent>
      </Card>
    );
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const response = await verifyApi(resetToken, code);
      toast.success(response.data.message);
      setIsCodeVerified(true);
      setPasswordChangeToken(response.data.data.passwordChangeToken);
    } catch (err: any) {
      console.error('Code verification error:', err);
      toast.error(err.message || 'Failed to verify code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      setIsChangingPassword(false);
      return;
    }
    
    if (!passwordChangeToken) {
        toast.error('Password change token is missing. Please restart the process.');
        setIsChangingPassword(false);
        return;
    }

    try {
      const response = await setPasswordApi(passwordChangeToken, newPassword);
      toast.success(response.data.message);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error('Set new password error:', err);
      toast.error(err.message || 'Failed to set new password.');
    } finally {
      setIsChangingPassword(false);
    }
  };


  return (
    <Card className="p-8 shadow-lg border border-border w-full max-w-md text-card-foreground">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-foreground mb-2">Password Reset</CardTitle>
        <CardDescription className="text-muted-foreground">
          {isCodeVerified
            ? 'Enter and confirm your new password.'
            : `A verification code has been sent to ${email}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isCodeVerified && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <LoadingSpinner className="mr-2" size={16} />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
          </form>
        )}

        {isCodeVerified && (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-muted-foreground text-sm font-medium mb-2">
                New Password:
              </label>
              <Input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-muted-foreground text-sm font-medium mb-2">
                Confirm Password:
              </label>
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <LoadingSpinner className="mr-2" size={16} />
                  Updating...
                </>
              ) : (
                'Set New Password'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordResetVerificationPage;