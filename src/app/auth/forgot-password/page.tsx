'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// Form validation schema
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    try {
      emailSchema.parse({ email });
      setFormError('');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate email
    if (!validateEmail()) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        setFormError(error.message || 'Failed to send reset email');
        toast.error('Password reset failed', {
          description: error.message || 'Please check your email and try again'
        });
        return;
      }
      
      // Success
      setIsSuccess(true);
      toast.success('Password reset email sent', {
        description: 'Please check your inbox for further instructions'
      });
      
    } catch (err) {
      console.error('Password reset error:', err);
      setFormError('An unexpected error occurred');
      toast.error('Password reset failed', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
            <KeyRound className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Check your email
          </h1>
          
          <div className="text-gray-600 space-y-4">
            <p>
              We've sent password reset instructions to <strong>{email}</strong>.
              Please check your inbox and follow the link to reset your password.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h2 className="font-medium text-blue-800 mb-2">What happens next?</h2>
              <ol className="text-left text-sm space-y-2 text-blue-700">
                <li className="flex">
                  <span className="mr-2">1.</span>
                  <span>Check your email inbox for the reset link</span>
                </li>
                <li className="flex">
                  <span className="mr-2">2.</span>
                  <span>Click the link and set a new password</span>
                </li>
                <li className="flex">
                  <span className="mr-2">3.</span>
                  <span>Use your new password to sign in</span>
                </li>
              </ol>
            </div>
            
            <p className="text-sm">
              Didn't receive an email? Check your spam folder or{' '}
              <button 
                onClick={() => setIsSuccess(false)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                try again
              </button>
            </p>
          </div>
          
          <div className="pt-4">
            <Link 
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full rounded-md border ${
                  formError ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
                placeholder="you@example.com"
              />
              {formError && (
                <p className="mt-1 text-sm text-red-600">{formError}</p>
              )}
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
