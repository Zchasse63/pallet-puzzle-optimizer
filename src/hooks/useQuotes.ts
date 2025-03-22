import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Quote, OptimizationResult } from '@/types';
import { generateQuoteNumber } from '@/lib/utils';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quotes
  const fetchQuotes = useCallback(async (status?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      setQuotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
      console.error('Error fetching quotes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create quote from optimization result
  const createQuote = useCallback(async (
    optimizationResult: OptimizationResult,
    products: Array<{ product_id: string; quantity: number; price?: number }>
  ) => {
    try {
      setError(null);
      
      const quoteNumber = generateQuoteNumber();
      
      const { data, error } = await supabase
        .from('quotes')
        .insert([{
          quote_number: quoteNumber,
          status: 'draft',
          products,
          container_utilization: optimizationResult.utilization,
          total_pallets: optimizationResult.palletArrangements.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Refresh quotes list
      fetchQuotes();
      
      return { success: true, data: data?.[0] };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quote');
      console.error('Error creating quote:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create quote' };
    }
  }, [fetchQuotes]);

  // Update quote
  const updateQuote = useCallback(async (id: string, updates: Partial<Quote>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('quotes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Refresh quotes list
      fetchQuotes();
      
      return { success: true, data: data?.[0] };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quote');
      console.error('Error updating quote:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update quote' };
    }
  }, [fetchQuotes]);

  // Delete quote
  const deleteQuote = useCallback(async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh quotes list
      fetchQuotes();
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quote');
      console.error('Error deleting quote:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete quote' };
    }
  }, [fetchQuotes]);

  // Send quote email
  const sendQuoteEmail = useCallback(async (
    quoteId: string,
    recipientEmail: string,
    subject: string,
    message?: string
  ) => {
    try {
      setError(null);
      
      // Log email attempt
      const { data, error } = await supabase
        .from('email_logs')
        .insert([{
          quote_id: quoteId,
          recipient_email: recipientEmail,
          subject,
          status: 'pending',
          sent_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // In a real app, we would send the email here
      // For now, we'll simulate success
      
      // Update email log status
      await supabase
        .from('email_logs')
        .update({
          status: 'sent'
        })
        .eq('id', data[0].id);
      
      // Update quote status
      await updateQuote(quoteId, { status: 'sent' });
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send quote email');
      console.error('Error sending quote email:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send quote email' };
    }
  }, [updateQuote]);

  // Load quotes on mount
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return {
    quotes,
    isLoading,
    error,
    fetchQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
    sendQuoteEmail
  };
}