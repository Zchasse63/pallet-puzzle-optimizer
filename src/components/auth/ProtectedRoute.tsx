'use client';

import React, { ReactNode, useEffect, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  fallbackUrl?: string;
  redirectPath?: string;
}

/**
 * Component that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 * 
 * @param children - Content to render when authenticated
 * @param fallbackUrl - URL to redirect to when not authenticated (defaults to /login)
 * @param redirectPath - Custom path to redirect back to after login (defaults to current path)
 */
const ProtectedRoute = memo(({ 
  children, 
  fallbackUrl = '/login',
  redirectPath
}: ProtectedRouteProps) => {
  const { user, isLoading } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  // Use the provided redirectPath or fall back to the current pathname
  const actualRedirectPath = redirectPath || pathname || '/';

  useEffect(() => {
    // Early return during initial load to avoid unnecessary redirects
    if (isLoading) return;
    
    // If no user is found after loading, redirect to login
    if (!user) {
      // Store the redirect path in sessionStorage for post-login navigation
      try {
        sessionStorage.setItem('redirectAfterLogin', actualRedirectPath);
      } catch (error) {
        console.error('Failed to set sessionStorage item:', error);
      }
      
      // Navigate to the login page with the redirect parameter
      router.push(`${fallbackUrl}?returnUrl=${encodeURIComponent(actualRedirectPath)}`);
    }
  }, [user, isLoading, router, actualRedirectPath, fallbackUrl]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is authenticated, render the protected content
  // Otherwise return null (component will redirect in the useEffect)
  return user ? <>{children}</> : null;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
