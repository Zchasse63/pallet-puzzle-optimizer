import React, { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';

type SupabaseContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
};

const defaultContextValue: SupabaseContextType = {
  user: null,
  session: null,
  isLoading: false,
  signIn: jest.fn().mockResolvedValue({ user: null, error: null }),
  signUp: jest.fn().mockResolvedValue({ user: null, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
};

export const SupabaseContext = createContext<SupabaseContextType>(defaultContextValue);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider = ({ children, mockValue = defaultContextValue }: { children: ReactNode; mockValue?: Partial<SupabaseContextType> }) => {
  const value = { ...defaultContextValue, ...mockValue };
  
  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider;
