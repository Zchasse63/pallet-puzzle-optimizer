import React, { ReactNode } from 'react';
import { SupabaseProvider } from '@/contexts/SupabaseContext';

interface TestProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component for tests that provides all necessary context providers
 */
export function TestProviders({ children }: TestProvidersProps) {
  return (
    <SupabaseProvider>
      {children}
    </SupabaseProvider>
  );
}
