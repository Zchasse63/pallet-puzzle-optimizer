'use client';

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import { Inter } from 'next/font/google';
import { memo, useCallback, useEffect } from "react";
import { useUIActions } from "@/lib/store";
import '@/styles/globals.css';

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * App initialization component to handle any startup logic
 * Memoized to prevent unnecessary re-renders and getSnapshot infinite loop
 */
const AppInitializer = memo(() => {
  // Use useCallback to stabilize the function reference between renders
  const { setIsLoading } = useUIActions();
  
  // Stabilize the setIsLoading function with useCallback
  const handleSetLoading = useCallback((isLoading: boolean) => {
    setIsLoading(isLoading);
  }, [setIsLoading]);
  
  useEffect(() => {
    // Simulate initial loading
    handleSetLoading(true);
    
    // Use a try-catch to ensure we always set loading to false even if there's an error
    try {
      const timer = setTimeout(() => {
        handleSetLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error during app initialization:', error);
      handleSetLoading(false);
    }
  }, [handleSetLoading]); // Only depend on the stable callback
  
  return null;
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 antialiased">
        <QueryClientProvider client={queryClient}>
          <SupabaseProvider>
            <TooltipProvider>
              <Sonner />
              <ErrorBoundary>
                <AppInitializer />
                {children}
              </ErrorBoundary>
            </TooltipProvider>
          </SupabaseProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
