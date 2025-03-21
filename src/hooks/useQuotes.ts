import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { handleError } from '@/utils/errorHandling';
import { announceToScreenReader } from '@/utils/accessibility';
import { SupabaseClient } from '@supabase/supabase-js';

// Define the Quote type
export interface Quote {
  id: string;
  created_at: string;
  name: string;
  expires_at: string | null;
  view_count: number;
  share_count: number;
  user_id: string;
}

type QuoteFilter = 'all' | 'active' | 'expired';

interface UseQuotesOptions {
  limit?: number;
  filter?: QuoteFilter;
  announceChanges?: boolean;
}

/**
 * Custom hook for managing quotes
 * Centralizes quote data fetching and manipulation
 */
export function useQuotes(options: UseQuotesOptions = {}) {
  const { 
    limit = undefined, 
    filter = 'all',
    announceChanges = true
  } = options;
  
  const { user, supabase } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Format date for display
   */
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  /**
   * Check if quote is expired
   */
  const isExpired = useCallback((expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }, []);
  
  /**
   * Fetch quotes from the database
   */
  const fetchQuotes = useCallback(async () => {
    if (!user) {
      setQuotes([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id);
      
      // Apply filter
      if (filter === 'active') {
        const now = new Date().toISOString();
        query = query.or(`expires_at.gt.${now},expires_at.is.null`);
      } else if (filter === 'expired') {
        const now = new Date().toISOString();
        query = query.lt('expires_at', now);
      }
      
      // Apply ordering
      query = query.order('created_at', { ascending: false });
      
      // Apply limit if specified
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error: supabaseError } = await query;
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      setQuotes(data || []);
      
      // Announce to screen readers if enabled
      if (announceChanges) {
        if (data && data.length > 0) {
          announceToScreenReader(`Loaded ${data.length} quotes`, 'polite');
        } else {
          announceToScreenReader('No quotes found', 'polite');
        }
      }
    } catch (err) {
      const processedError = handleError(err, {
        showToast: false,
        logToConsole: true,
        defaultMessage: 'Failed to load quotes'
      });
      
      setError(processedError.message);
      
      if (announceChanges) {
        announceToScreenReader(`Error: ${processedError.message}`, 'assertive');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, limit, filter, announceChanges]);
  
  /**
   * Create a new quote
   */
  const createQuote = useCallback(async (quoteData: Partial<Quote>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('quotes')
        .insert([
          { 
            ...quoteData,
            user_id: user.id,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Refresh quotes
      fetchQuotes();
      
      return { success: true, data: data?.[0] };
    } catch (err) {
      const processedError = handleError(err, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to create quote'
      });
      
      return { success: false, error: processedError.message };
    }
  }, [user, supabase, fetchQuotes]);
  
  /**
   * Update an existing quote
   */
  const updateQuote = useCallback(async (id: string, quoteData: Partial<Quote>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', id)
        .eq('user_id', user.id) // Security: ensure user owns the quote
        .select();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Refresh quotes
      fetchQuotes();
      
      return { success: true, data: data?.[0] };
    } catch (err) {
      const processedError = handleError(err, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to update quote'
      });
      
      return { success: false, error: processedError.message };
    }
  }, [user, supabase, fetchQuotes]);
  
  /**
   * Delete a quote
   */
  const deleteQuote = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { error: supabaseError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security: ensure user owns the quote
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Refresh quotes
      fetchQuotes();
      
      return { success: true };
    } catch (err) {
      const processedError = handleError(err, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to delete quote'
      });
      
      return { success: false, error: processedError.message };
    }
  }, [user, supabase, fetchQuotes]);
  
  /**
   * Get a single quote by ID
   */
  const getQuoteById = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Security: ensure user owns the quote
        .single();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      return { success: true, data };
    } catch (err) {
      const processedError = handleError(err, {
        showToast: false,
        logToConsole: true,
        defaultMessage: 'Failed to fetch quote'
      });
      
      return { success: false, error: processedError.message };
    }
  }, [user, supabase]);
  
  /**
   * Increment view count for a quote
   */
  const incrementViewCount = useCallback(async (id: string) => {
    try {
      const { data, error: supabaseError } = await supabase.rpc('increment_quote_view', {
        quote_id: id
      });
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      return { success: true };
    } catch (err) {
      handleError(err, {
        showToast: false,
        logToConsole: true,
        defaultMessage: 'Failed to update view count'
      });
      
      return { success: false };
    }
  }, [supabase]);
  
  /**
   * Increment share count for a quote
   */
  const incrementShareCount = useCallback(async (id: string) => {
    try {
      const { data, error: supabaseError } = await supabase.rpc('increment_quote_share', {
        quote_id: id
      });
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      return { success: true };
    } catch (err) {
      handleError(err, {
        showToast: false,
        logToConsole: true,
        defaultMessage: 'Failed to update share count'
      });
      
      return { success: false };
    }
  }, [supabase]);
  
  // Fetch quotes on mount and when dependencies change
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);
  
  return {
    quotes,
    isLoading,
    error,
    formatDate,
    isExpired,
    fetchQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
    getQuoteById,
    incrementViewCount,
    incrementShareCount
  };
}

export default useQuotes;
