import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { toast } from 'sonner';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Custom hook for authentication operations
 * Centralizes authentication logic and provides consistent error handling
 */
export function useAuth() {
  const { signIn, signUp, signOut, resetPassword, user, isLoading, supabase } = useSupabase();
  const router = useRouter();

  /**
   * Handle user login
   * @param email - User email
   * @param password - User password
   * @param redirectTo - Path to redirect after successful login
   * @returns Result object with success flag and error message if applicable
   */
  const handleLogin = useCallback(async (
    email: string, 
    password: string, 
    redirectTo: string = '/dashboard'
  ) => {
    try {
      const { user, error } = await signIn(email, password);
      
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password' };
        } else if (error.message?.includes('Email not confirmed')) {
          return { success: false, error: 'Please verify your email before signing in' };
        } else if (error.message?.includes('rate limit')) {
          return { success: false, error: 'Too many login attempts. Please try again later' };
        } else {
          return { success: false, error: error.message || 'An error occurred during sign in' };
        }
      }
      
      if (user) {
        toast.success('Signed in successfully');
        router.push(redirectTo);
        return { success: true };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  }, [signIn, router]);

  /**
   * Handle user registration
   * @param email - User email
   * @param password - User password
   * @param userData - Additional user data
   * @returns Result object with success flag and error message if applicable
   */
  const handleRegister = useCallback(async (
    email: string, 
    password: string, 
    userData: any
  ) => {
    try {
      const { user, error } = await signUp(email, password, userData);
      
      if (error) {
        if (error.message?.includes('already registered')) {
          return { success: false, error: 'This email is already registered' };
        } else if (error.message?.includes('rate limit')) {
          return { success: false, error: 'Too many registration attempts. Please try again later' };
        } else {
          return { success: false, error: error.message || 'An error occurred during registration' };
        }
      }
      
      if (user) {
        return { success: true };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (err: any) {
      console.error('Registration error:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  }, [signUp]);

  /**
   * Handle password reset request
   * @param email - User email
   * @returns Result object with success flag and error message if applicable
   */
  const handlePasswordReset = useCallback(async (email: string) => {
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        if (error.message?.includes('rate limit')) {
          return { success: false, error: 'Too many password reset attempts. Please try again later' };
        } else {
          return { success: false, error: error.message || 'An error occurred while sending the reset email' };
        }
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Password reset error:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  }, [resetPassword]);

  /**
   * Handle user logout
   * @param redirectTo - Path to redirect after successful logout
   * @returns Result object with success flag and error message if applicable
   */
  const handleLogout = useCallback(async (redirectTo: string = '/login') => {
    try {
      const success = await signOut();
      
      if (success) {
        toast.success('Signed out successfully');
        router.push(redirectTo);
        return { success: true };
      }
      
      return { success: false, error: 'Failed to sign out' };
    } catch (err: any) {
      console.error('Sign out error:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  }, [signOut, router]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    supabase,
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handleLogout
  };
}

export default useAuth;
