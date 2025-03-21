'use client';

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { z } from 'zod';
import { User, UserCircle, Building, Mail, Save, LogOut, Lock, KeyRound, AlertCircle } from 'lucide-react';
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
import { motion } from 'framer-motion';

// Custom hooks
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useSupabase } from '@/contexts/SupabaseContext';

// Utilities
import { generateA11yId, announceToScreenReader } from '@/utils/accessibility';
import { handleError } from '@/utils/errorHandling';

// Form validation schema
const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
});

// Password change validation schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ProfilePage = () => {
  const { user, supabase } = useSupabase();
  const { handleLogout } = useAuth();
  const router = useRouter();
  
  // Generate unique IDs for accessibility
  const profileFormId = useRef(generateA11yId('profile-form')).current;
  const passwordFormId = useRef(generateA11yId('password-form')).current;
  
  // Profile form state using our custom hook
  const {
    formData,
    formErrors,
    isSubmitting: isUpdating,
    setIsSubmitting: setIsUpdating,
    setFormData,
    handleChange: handleProfileChange,
    validateForm: validateProfileForm,
    resetForm: resetProfileForm,
    setGeneralError: setProfileGeneralError
  } = useFormValidation<ProfileFormData>(profileSchema, {
    fullName: '',
    company: '',
    jobTitle: '',
    phone: '',
  });
  
  // Password form state using our custom hook
  const {
    formData: passwordData,
    formErrors: passwordErrors,
    isSubmitting: isChangingPassword,
    setIsSubmitting: setIsChangingPassword,
    handleChange: handlePasswordChange,
    validateForm: validatePasswordForm,
    resetForm: resetPasswordForm,
    setFormErrors: setPasswordErrors
  } = useFormValidation<PasswordFormData>(passwordSchema, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsFetchingProfile(true);
      
      // Get user metadata
      const userData = user.user_metadata;
      
      // Get additional profile data from profiles table if needed
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }
      
      setFormData({
        fullName: userData?.full_name || profileData?.full_name || '',
        company: userData?.company || profileData?.company || '',
        jobTitle: userData?.job_title || profileData?.job_title || '',
        phone: userData?.phone || profileData?.phone || '',
      });
      
      // Announce to screen readers that profile data has loaded
      announceToScreenReader('Profile data loaded successfully');
    } catch (error) {
      handleError(error, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to load profile data'
      });
    } finally {
      setIsFetchingProfile(false);
    }
  }, [user, supabase, setFormData]);
  
  // Load profile data when component mounts
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isUpdating || !user) return;
    
    // Validate form
    if (!validateProfileForm()) return;
    
    setIsUpdating(true);
    
    try {
      // Update user metadata in auth
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          company: formData.company || null,
          job_title: formData.jobTitle || null,
          phone: formData.phone || null,
        },
      });
      
      if (error) throw error;
      
      // Also update the profiles table if it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          company: formData.company || null,
          job_title: formData.jobTitle || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      
      if (profileError) {
        console.warn('Profile table update error:', profileError);
        // Continue anyway since we updated the auth metadata
      }
      
      toast.success('Profile updated successfully');
      announceToScreenReader('Profile updated successfully');
      
      // Refresh profile data
      await fetchUserProfile();
    } catch (err: any) {
      handleError(err, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to update profile'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isChangingPassword || !user) return;
    
    // Validate form
    if (!validatePasswordForm()) return;
    
    setIsChangingPassword(true);
    
    try {
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword,
      });
      
      if (signInError) {
        setPasswordErrors({
          currentPassword: 'Current password is incorrect',
        });
        throw signInError;
      }
      
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      announceToScreenReader('Password updated successfully');
      
      // Reset form
      resetPasswordForm();
      
      // Hide password section
      setShowPasswordSection(false);
    } catch (err: any) {
      if (!passwordErrors.currentPassword) {
        handleError(err, {
          showToast: true,
          logToConsole: true,
          defaultMessage: 'Failed to update password'
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      const { success, error } = await handleLogout('/login');
      
      if (!success) {
        throw error || new Error('Sign out failed');
      }
    } catch (error) {
      handleError(error, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to sign out'
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardHeader className="bg-blue-600">
                <CardTitle className="text-xl font-bold text-white">Your Profile</CardTitle>
                <CardDescription className="text-blue-100">
                  Manage your account information
                </CardDescription>
              </CardHeader>
              
              {isFetchingProfile ? (
                <CardContent className="p-8 flex justify-center">
                  <LoadingSpinner size="lg" label="Loading profile..." />
                </CardContent>
              ) : (
                <>
                  <CardContent className="p-6">
                    <div className="mb-6 flex items-center">
                      <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center" 
                           aria-hidden="true">
                        <UserCircle className="h-12 w-12 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h2 className="text-xl font-semibold text-gray-900">{formData.fullName || 'User'}</h2>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        {formData.jobTitle && (
                          <p className="text-sm text-gray-600 mt-1">{formData.jobTitle}</p>
                        )}
                      </div>
                    </div>
                    
                    <form id={profileFormId} onSubmit={handleSubmit} className="space-y-6" aria-label="Profile information form">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                            <Input
                              id="fullName"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleProfileChange}
                              className={`pl-10 ${formErrors.fullName ? 'border-red-500' : ''}`}
                              placeholder="Your full name"
                              aria-invalid={!!formErrors.fullName}
                              aria-describedby={formErrors.fullName ? "fullName-error" : undefined}
                            />
                          </div>
                          {formErrors.fullName && (
                            <p id="fullName-error" className="text-sm text-red-600" role="alert">{formErrors.fullName}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="company">Company (Optional)</Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                            <Input
                              id="company"
                              name="company"
                              value={formData.company}
                              onChange={handleProfileChange}
                              className="pl-10"
                              placeholder="Your company name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                          <Input
                            id="jobTitle"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleProfileChange}
                            placeholder="Your job title"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleProfileChange}
                            placeholder="Your phone number"
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                            <Input
                              id="email"
                              name="email"
                              value={user?.email || ''}
                              disabled
                              className="pl-10 bg-gray-50 text-gray-500"
                              aria-readonly="true"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Email address cannot be changed. Please contact support if needed.
                          </p>
                        </div>
                      </div>
                      
                      <CardFooter className="px-0 pt-4 flex justify-between">
                        <Button 
                          type="submit" 
                          disabled={isUpdating}
                          className="flex items-center"
                          aria-busy={isUpdating}
                        >
                          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                        
                        <div className="space-x-2">
                          <Button
                            type="button"
                            onClick={() => {
                              setShowPasswordSection(!showPasswordSection);
                              if (!showPasswordSection) {
                                // Reset password form when opening
                                resetPasswordForm();
                              }
                            }}
                            variant="secondary"
                            className="flex items-center"
                            aria-expanded={showPasswordSection}
                            aria-controls={passwordFormId}
                          >
                            <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
                            {showPasswordSection ? 'Hide Password Form' : 'Change Password'}
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={handleSignOut}
                            variant="outline"
                            className="flex items-center"
                          >
                            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                            Sign Out
                          </Button>
                        </div>
                      </CardFooter>
                    </form>
                    
                    {showPasswordSection && (
                      <div className="mt-8 border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <Lock className="mr-2 h-5 w-5 text-blue-500" aria-hidden="true" />
                          Change Password
                        </h3>
                        
                        <form id={passwordFormId} onSubmit={handlePasswordSubmit} className="space-y-4" aria-label="Change password form">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                              <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className={`pl-10 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                                placeholder="••••••••"
                                aria-invalid={!!passwordErrors.currentPassword}
                                aria-describedby={passwordErrors.currentPassword ? "currentPassword-error" : undefined}
                              />
                            </div>
                            {passwordErrors.currentPassword && (
                              <p id="currentPassword-error" className="text-sm text-red-600" role="alert">{passwordErrors.currentPassword}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                              <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className={`pl-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                                placeholder="••••••••"
                                aria-invalid={!!passwordErrors.newPassword}
                                aria-describedby={passwordErrors.newPassword ? "newPassword-error" : undefined}
                              />
                            </div>
                            {passwordErrors.newPassword && (
                              <p id="newPassword-error" className="text-sm text-red-600" role="alert">{passwordErrors.newPassword}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                              <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className={`pl-10 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                                placeholder="••••••••"
                                aria-invalid={!!passwordErrors.confirmPassword}
                                aria-describedby={passwordErrors.confirmPassword ? "confirmPassword-error" : undefined}
                              />
                            </div>
                            {passwordErrors.confirmPassword && (
                              <p id="confirmPassword-error" className="text-sm text-red-600" role="alert">{passwordErrors.confirmPassword}</p>
                            )}
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start space-x-3" role="note">
                            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <div className="text-sm text-blue-700">
                              Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              type="submit" 
                              disabled={isChangingPassword}
                              className="flex items-center"
                              aria-busy={isChangingPassword}
                            >
                              <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
                              {isChangingPassword ? 'Updating...' : 'Update Password'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default memo(ProfilePage);
