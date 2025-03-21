'use client';

import React from 'react';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SupabaseProvider>
      {children}
      <Toaster />
      <SonnerToaster position="top-right" />
    </SupabaseProvider>
  );
}

export default Providers;
