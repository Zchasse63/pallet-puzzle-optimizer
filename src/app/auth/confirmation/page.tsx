'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Check your email
        </h1>
        
        <div className="text-gray-600 space-y-4">
          <p>
            We've sent a confirmation link to your email address.
            Please check your inbox and click the link to activate your account.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h2 className="font-medium text-blue-800 mb-2">What happens next?</h2>
            <ol className="text-left text-sm space-y-2 text-blue-700">
              <li className="flex">
                <span className="mr-2">1.</span>
                <span>Check your email inbox for the confirmation message</span>
              </li>
              <li className="flex">
                <span className="mr-2">2.</span>
                <span>Click the confirmation link in the email</span>
              </li>
              <li className="flex">
                <span className="mr-2">3.</span>
                <span>Once confirmed, you'll be able to sign in to your account</span>
              </li>
            </ol>
          </div>
          
          <p className="text-sm">
            Didn't receive an email? Check your spam folder or{' '}
            <Link href="/auth/resend-confirmation" className="font-medium text-blue-600 hover:text-blue-500">
              click here to resend
            </Link>
          </p>
        </div>
        
        <div className="pt-4">
          <Link 
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
