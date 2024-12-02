import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert"
import { Loader2 } from 'lucide-react';
import { CONFIG } from '../config';

interface EmailAuthProps {
  onSuccess: (authToken: string, refreshToken: string) => void;
}

export const EmailAuth: React.FC<EmailAuthProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Sending OTP to:', email);

    try {
      const response = await fetch('https://sandbox-api.okto.tech/api/v1/authenticate/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': CONFIG.OKTO_APP_SECRET,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      console.log('OTP Send Response:', response);
      const data = await response.json();
      console.log('OTP Send Data:', data);

      if (data.status === 'success') {
        setToken(data.data.token);
        setStep('otp');
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('OTP Send Error:', error);
      setError(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error('Email Auth Error:', error);
    if (error.response) {
      setError(error.response.data?.message || 'Server error occurred');
    } else if (error.request) {
      setError('Network error. Please try again.');
    } else {
      setError(error.message || 'An unexpected error occurred');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || !token) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Verifying OTP:', { email, otp, token });

    try {
      const response = await fetch('https://sandbox-api.okto.tech/api/v1/authenticate/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': CONFIG.OKTO_APP_SECRET,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          otp,
          token
        })
      });

      console.log('OTP Verify Response:', response);
      const data = await response.json();
      console.log('OTP Verify Data:', data);

      if (data.status === 'success') {
        try {
          await onSuccess(data.data.auth_token, data.data.refresh_auth_token);
          // Success! The user should now be redirected by the AuthContext
        } catch (error) {
          console.error('Error during user setup:', error);
          handleError(new Error('Failed to setup user account. Please try again.'));
        }
      } else {
        throw new Error(data.message || 'Failed to verify OTP');
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login with Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'email' ? (
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
            />
            <Button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep('email');
                setOtp('');
                setToken(null);
              }}
              disabled={loading}
              className="w-full"
            >
              Back to Email
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}; 