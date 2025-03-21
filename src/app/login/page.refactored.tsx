'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Package, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Custom hooks
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';

// Utilities
import { generateA11yId, announceToScreenReader } from '@/utils/accessibility';
import { handleError } from '@/utils/errorHandling';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { user, isLoading: isAuthLoading, handleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Generate unique ID for accessibility
  const formId = useRef(generateA11yId('login-form')).current;
  
  // Form validation using our custom hook
  const {
    formData,
    formErrors,
    generalError,
    isSubmitting,
    handleChange,
    validateForm,
    setIsSubmitting,
    setGeneralError,
  } = useFormValidation<LoginFormData>(loginSchema, {
    email: '',
    password: '',
  });
  
  // Get the return URL from query parameters
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(returnUrl);
    }
  }, [user, router, returnUrl]);
  
  // Check for registration success or password update parameters
  useEffect(() => {
    const isRegistered = searchParams.get('registered') === 'true';
    const passwordUpdated = searchParams.get('passwordUpdated') === 'true';
    
    if (isRegistered) {
      toast.success('Registration successful', {
        description: 'Please sign in with your new account',
      });
      announceToScreenReader('Registration successful. Please sign in with your new account.');
    } else if (passwordUpdated) {
      toast.success('Password updated successfully', {
        description: 'Please sign in with your new password',
      });
      announceToScreenReader('Password updated successfully. Please sign in with your new password.');
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset general error
    setGeneralError(null);
    
    // Validate form
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const { success, error } = await handleLogin(
        formData.email,
        formData.password,
        returnUrl
      );
      
      if (!success) {
        throw error || new Error('Failed to sign in');
      }
      
      // Note: No need to handle success case as the useAuth hook already handles
      // toast notifications and redirects
    } catch (error) {
      handleError(error, {
        showToast: false, // We'll handle this manually for login errors
        logToConsole: true,
      });
      
      // Set appropriate error message
      if (error instanceof Error) {
        if (error.message?.includes('Invalid email or password')) {
          setGeneralError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message?.includes('rate limit')) {
          setGeneralError('Too many login attempts. Please try again later.');
        } else if (error.message?.includes('network')) {
          setGeneralError('Network error. Please check your internet connection and try again.');
        } else {
          setGeneralError(error.message || 'An unexpected error occurred. Please try again later.');
        }
      } else {
        setGeneralError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-blue-600" aria-hidden="true" />
            <span className="text-2xl font-bold text-gray-900">Pallet Puzzle</span>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generalError && (
              <Alert variant="destructive" className="mb-4" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}
            
            <form 
              id={formId}
              onSubmit={handleSubmit} 
              className="space-y-4"
              aria-label="Sign in form"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    size={18} 
                    aria-hidden="true" 
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting || isAuthLoading}
                    autoComplete="email"
                    autoFocus
                    aria-invalid={!!formErrors.email}
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                  />
                </div>
                {formErrors.email && (
                  <p id="email-error" className="text-sm text-red-500" role="alert">{formErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/reset-password" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    size={18} 
                    aria-hidden="true" 
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className={`pl-10 ${formErrors.password ? 'border-red-500' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting || isAuthLoading}
                    autoComplete="current-password"
                    aria-invalid={!!formErrors.password}
                    aria-describedby={formErrors.password ? "password-error" : undefined}
                  />
                </div>
                {formErrors.password && (
                  <p id="password-error" className="text-sm text-red-500" role="alert">{formErrors.password}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || isAuthLoading}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link 
                href="/register" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Create an account
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default memo(LoginPage);
