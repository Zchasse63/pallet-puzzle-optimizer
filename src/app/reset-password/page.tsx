'use client';

import React, { useState, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Package, 
  Mail, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  ArrowLeft
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
const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const { handlePasswordReset } = useAuth();
  const router = useRouter();
  
  // Generate unique ID for accessibility
  const formId = useRef(generateA11yId('reset-password-form')).current;
  
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
  } = useFormValidation<ResetPasswordFormData>(resetPasswordSchema, {
    email: '',
  });
  
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setGeneralError(null);
    
    // Validate form
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const { success, error } = await handlePasswordReset(formData.email);
      
      if (error) {
        throw error;
      }
      
      setIsSuccess(true);
      
      // Announce to screen readers
      announceToScreenReader('Password reset email sent. Please check your email for further instructions.');
      
      toast.success('Password reset email sent', {
        description: 'Please check your email for further instructions'
      });
      
    } catch (error) {
      handleError(error, {
        showToast: false, // We'll handle this manually for reset password errors
        logToConsole: true,
      });
      
      // Set appropriate error message
      if (error instanceof Error) {
        if (error.message?.includes('rate limit')) {
          setGeneralError('Too many password reset attempts. Please try again later.');
        } else if (error.message?.includes('network')) {
          setGeneralError('Network error. Please check your internet connection and try again.');
        } else {
          // Don't reveal if the email exists or not for security reasons
          setIsSuccess(true); // Show success even if email doesn't exist
          toast.success('If your email exists in our system, you will receive reset instructions');
          announceToScreenReader('If your email exists in our system, you will receive reset instructions');
        }
      } else {
        // Don't reveal if the email exists or not for security reasons
        setIsSuccess(true); // Show success even if email doesn't exist
        toast.success('If your email exists in our system, you will receive reset instructions');
        announceToScreenReader('If your email exists in our system, you will receive reset instructions');
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
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              {isSuccess 
                ? 'Check your email for reset instructions' 
                : 'Enter your email to receive password reset instructions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generalError && (
              <Alert variant="destructive" className="mb-4" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}
            
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <Mail className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  We've sent password reset instructions to <strong>{formData.email}</strong>. 
                  Please check your email and follow the instructions to reset your password.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  If you don't see the email, check your spam folder or try again.
                </p>
              </div>
            ) : (
              <form 
                id={formId}
                onSubmit={handleSubmit} 
                className="space-y-4"
                aria-label="Password reset request form"
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
                      disabled={isSubmitting}
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
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
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
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center"
              >
                <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Back to Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default memo(ResetPasswordPage);
