'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Package, 
  Lock, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  CheckCircle
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
import { useFormValidation } from '@/hooks/useFormValidation';
import { useAuth } from '@/hooks/useAuth';

// Utilities
import { generateA11yId, announceToScreenReader } from '@/utils/accessibility';
import { handleError } from '@/utils/errorHandling';

// Form validation schema
const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

const UpdatePasswordPage = () => {
  const { supabase } = useAuth();
  const router = useRouter();
  
  // Generate unique ID for accessibility
  const formId = useRef(generateA11yId('update-password-form')).current;
  
  // Form validation using our custom hook
  const {
    formData,
    formErrors,
    generalError,
    isSubmitting,
    handleChange,
    validateForm,
    setIsSubmitting,
    setGeneralError
  } = useFormValidation<UpdatePasswordFormData>(updatePasswordSchema, {
    password: '',
    confirmPassword: '',
  });
  
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Check if we have a valid hash from the reset email
  const [hasValidHash, setHasValidHash] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkHash = async () => {
      try {
        // Get the hash from the URL
        const hash = window.location.hash.substring(1);
        
        if (!hash) {
          setHasValidHash(false);
          setGeneralError('Invalid or missing password reset link. Please request a new password reset.');
          announceToScreenReader('Invalid or missing password reset link. Please request a new password reset.');
          return;
        }
        
        // Verify the hash is valid by checking if we can get the user
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data?.user) {
          setHasValidHash(false);
          setGeneralError('Your password reset link has expired or is invalid. Please request a new password reset.');
          announceToScreenReader('Your password reset link has expired or is invalid. Please request a new password reset.');
        } else {
          setHasValidHash(true);
          announceToScreenReader('Password reset link verified. You can now create a new password.');
        }
      } catch (error) {
        handleError(error, {
          showToast: false,
          logToConsole: true,
        });
        
        setHasValidHash(false);
        setGeneralError('An error occurred while verifying your password reset link. Please try again or request a new link.');
        announceToScreenReader('An error occurred while verifying your password reset link. Please try again or request a new link.');
      }
    };
    
    checkHash();
  }, [supabase.auth, setGeneralError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setGeneralError(null);
    
    // Validate form
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });
      
      if (error) {
        throw error;
      }
      
      setIsSuccess(true);
      
      // Announce to screen readers
      announceToScreenReader('Password updated successfully. You will be redirected to the login page shortly.');
      
      toast.success('Password updated successfully', {
        description: 'You can now sign in with your new password'
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login?passwordUpdated=true');
      }, 3000);
      
    } catch (error) {
      handleError(error, {
        showToast: false, // We'll handle this manually for password update errors
        logToConsole: true,
      });
      
      // Set appropriate error message
      if (error instanceof Error) {
        if (error.message?.includes('rate limit')) {
          setGeneralError('Too many password update attempts. Please try again later.');
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
            <CardTitle className="text-2xl text-center">
              {isSuccess ? 'Password Updated' : 'Create New Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSuccess 
                ? 'Your password has been updated successfully' 
                : 'Enter your new password below'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generalError && (
              <Alert variant="destructive" className="mb-4" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}
            
            {hasValidHash === false && (
              <div className="text-center py-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/reset-password')}
                  className="mt-2"
                  aria-label="Request a new password reset link"
                >
                  Request New Password Reset
                </Button>
              </div>
            )}
            
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Your password has been updated successfully. You will be redirected to the login page shortly.
                </p>
              </div>
            ) : hasValidHash && (
              <form 
                id={formId}
                onSubmit={handleSubmit} 
                className="space-y-4"
                aria-label="New password form"
              >
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
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
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      autoFocus
                      aria-invalid={!!formErrors.password}
                      aria-describedby={formErrors.password ? "password-error" : undefined}
                    />
                  </div>
                  {formErrors.password && (
                    <p id="password-error" className="text-sm text-red-500" role="alert">{formErrors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                      size={18} 
                      aria-hidden="true" 
                    />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className={`pl-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      aria-invalid={!!formErrors.confirmPassword}
                      aria-describedby={formErrors.confirmPassword ? "confirmPassword-error" : undefined}
                    />
                  </div>
                  {formErrors.confirmPassword && (
                    <p id="confirmPassword-error" className="text-sm text-red-500" role="alert">{formErrors.confirmPassword}</p>
                  )}
                </div>
                
                <Alert className="bg-blue-50 border-blue-200 mb-4">
                  <AlertCircle className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  <AlertDescription className="text-blue-700">
                    Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default memo(UpdatePasswordPage);
