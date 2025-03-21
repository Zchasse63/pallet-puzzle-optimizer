'use client';

import React, { useEffect, useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Package, 
  Mail, 
  Lock, 
  User,
  ArrowRight, 
  Loader2,
  AlertCircle,
  Info
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Custom hooks
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';

// Utilities
import { generateA11yId, announceToScreenReader } from '@/utils/accessibility';
import { handleError } from '@/utils/errorHandling';

// Form validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const { user, isLoading: isAuthLoading, handleRegistration } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Generate unique ID for accessibility
  const formId = useRef(generateA11yId('register-form')).current;
  
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
    setFormErrors
  } = useFormValidation<RegisterFormData>(registerSchema, {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  // Get the return URL from query parameters
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(returnUrl);
    }
  }, [user, router, returnUrl]);
  
  const handleCheckboxChange = (checked: boolean) => {
    // Update the acceptTerms value
    handleChange({
      target: {
        name: 'acceptTerms',
        value: checked,
        type: 'checkbox',
        checked,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset general error
    setGeneralError(null);
    
    // Validate form
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare user metadata
      const userData = {
        full_name: formData.name,
        email: formData.email,
        updated_at: new Date().toISOString(),
      };
      
      const { success, error } = await handleRegistration(
        formData.email,
        formData.password,
        userData
      );
      
      if (!success) {
        throw error || new Error('Registration failed');
      }
      
      // Announce to screen readers
      announceToScreenReader('Account created successfully. Please check your email to confirm your account.');
      
      // Show success message
      toast.success('Account created successfully', {
        description: 'Please check your email to confirm your account'
      });
      
      // Redirect to the login page with a success parameter
      router.push('/login?registered=true');
    } catch (error) {
      handleError(error, {
        showToast: false, // We'll handle this manually for registration errors
        logToConsole: true,
      });
      
      // Set appropriate error message
      if (error instanceof Error) {
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          setGeneralError('This email is already registered. Please use a different email or try to log in.');
          setFormErrors(prev => ({ ...prev, email: 'Email already registered' }));
        } else if (error.message?.includes('rate limit')) {
          setGeneralError('Too many registration attempts. Please try again later.');
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
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to create a new account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generalError && (
              <Alert variant="destructive" className="mb-4" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}
            
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />
              <AlertDescription className="text-blue-700">
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </AlertDescription>
            </Alert>
            
            <form 
              id={formId}
              onSubmit={handleSubmit} 
              className="space-y-4"
              aria-label="Registration form"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    size={18} 
                    aria-hidden="true" 
                  />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    className={`pl-10 ${formErrors.name ? 'border-red-500' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting || isAuthLoading}
                    autoComplete="name"
                    autoFocus
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? "name-error" : undefined}
                  />
                </div>
                {formErrors.name && (
                  <p id="name-error" className="text-sm text-red-500" role="alert">{formErrors.name}</p>
                )}
              </div>
              
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
                    aria-invalid={!!formErrors.email}
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                  />
                </div>
                {formErrors.email && (
                  <p id="email-error" className="text-sm text-red-500" role="alert">{formErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                    autoComplete="new-password"
                    aria-invalid={!!formErrors.password}
                    aria-describedby={formErrors.password ? "password-error" : undefined}
                  />
                </div>
                {formErrors.password && (
                  <p id="password-error" className="text-sm text-red-500" role="alert">{formErrors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                    disabled={isSubmitting || isAuthLoading}
                    autoComplete="new-password"
                    aria-invalid={!!formErrors.confirmPassword}
                    aria-describedby={formErrors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                </div>
                {formErrors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-sm text-red-500" role="alert">{formErrors.confirmPassword}</p>
                )}
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={handleCheckboxChange}
                  disabled={isSubmitting || isAuthLoading}
                  aria-invalid={!!formErrors.acceptTerms}
                  aria-describedby={formErrors.acceptTerms ? "terms-error" : undefined}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="acceptTerms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the terms and conditions
                  </label>
                  {formErrors.acceptTerms && (
                    <p id="terms-error" className="text-sm text-red-500" role="alert">{formErrors.acceptTerms}</p>
                  )}
                </div>
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
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default memo(RegisterPage);
