'use client';

import { AlertCircle, CheckCircle, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/useAuth';

function Login() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setServerError('');
    setErrors({});
    setLoginSuccess(false);

    if (isSubmitting || isLoading) {
      return;
    }

    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(email.trim(), password);

      if (success) {
        setLoginSuccess(true);
      } else {
        setServerError('Invalid email or password. Please try again.');
        setLoginSuccess(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setServerError('An error occurred during login. Please try again.');
      setLoginSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isSubmitting || isLoading;

  return (
    <div className='page-transition opacity-100'>
      <Card className='w-full max-w-md mx-auto bg-card shadow-xl border border-border/5'>
        <CardHeader className='space-y-2'>
          <CardTitle>Welcome Back 👋</CardTitle>
          <CardDescription>Enter your credentials to access the support portal</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate className='space-y-4'>
          <CardContent className='space-y-4'>
            {serverError && (
              <div
                className='rounded-lg bg-destructive/10 p-4 text-sm text-destructive-foreground page-transition'
                role='alert'
              >
                <div className='flex items-center gap-2'>
                  <AlertCircle className='h-4 w-4' />
                  <span>{serverError}</span>
                </div>
              </div>
            )}

            {loginSuccess && (
              <div
                className='rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-300 page-transition'
                role='alert'
              >
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Login successful! Redirecting...</span>
                </div>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='email'
                  type='email'
                  className='pl-10'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                  required
                  aria-invalid={!!errors.email}
                  disabled={isFormLoading}
                />
              </div>
              {errors.email && (
                <p className='text-sm text-destructive-foreground mt-1'>{errors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='password'
                  type='password'
                  className='pl-10'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  required
                  aria-invalid={!!errors.password}
                  disabled={isFormLoading}
                />
              </div>
              {errors.password && (
                <p className='text-sm text-destructive-foreground mt-1'>{errors.password}</p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type='submit'
              className='w-full bg-accent hover:bg-accent/90 text-white font-medium transition-all duration-200'
              disabled={isFormLoading}
            >
              {loginSuccess ? (
                <>
                  <CheckCircle className='mr-2 h-4 w-4' />
                  Redirecting...
                </>
              ) : isFormLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className='mr-2 h-4 w-4' />
                  Sign in
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Login;
