import { supabase, Tables, supabaseHelpers } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Define a generic response type for database operations
export type DbResponse<T> = {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
};

/**
 * Enhanced database helper functions for efficient Supabase interactions
 * Builds on the existing supabaseHelpers with improved error handling and 
 * more specialized query capabilities
 */
export const db = {
  ...supabaseHelpers, // Include all existing helpers

  /**
   * Execute a raw SQL query against the Supabase database
   * Useful for complex queries that are difficult to express with the Supabase client
   */
  async executeQuery<T>(query: string, params?: any[]): Promise<DbResponse<T[]>> {
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        query_text: query,
        query_params: params || []
      });

      if (error) {
        console.error('SQL query execution error:', error);
        return {
          data: null,
          error: error.message,
          status: 'error'
        };
      }

      return {
        data: data as T[],
        error: null,
        status: 'success'
      };
    } catch (err: any) {
      console.error('Unexpected error executing query:', err);
      return {
        data: null, 
        error: err.message || 'Unknown error occurred',
        status: 'error'
      };
    }
  },

  /**
   * Enhanced product operations with better error handling
   */
  products: {
    /**
     * Get products with optional filtering, sorting, and pagination
     */
    async getAll(options?: {
      filter?: Record<string, any>;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }): Promise<DbResponse<Tables['products'][]>> {
      try {
        let query = supabase.from('products').select('*');

        // Apply filters if provided
        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        // Apply sorting if provided
        if (options?.sortBy) {
          query = query.order(options.sortBy, { 
            ascending: options.sortOrder !== 'desc' 
          });
        }

        // Apply pagination if provided
        if (options?.limit) {
          query = query.limit(options.limit);
        }
        
        if (options?.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Get a single product by ID
     */
    async getById(id: string): Promise<DbResponse<Tables['products']>> {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Create a new product
     */
    async create(product: Omit<Tables['products'], 'id' | 'created_at' | 'updated_at'>): Promise<DbResponse<Tables['products']>> {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert(product)
          .select()
          .single();

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Update an existing product
     */
    async update(id: string, updates: Partial<Tables['products']>): Promise<DbResponse<Tables['products']>> {
      try {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Delete a product
     */
    async delete(id: string): Promise<DbResponse<void>> {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data: null,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    }
  },

  /**
   * Enhanced quote operations with better error handling
   */
  quotes: {
    /**
     * Get all quotes with optional filtering, sorting, and pagination
     */
    async getAll(options?: {
      filter?: Record<string, any>;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }): Promise<DbResponse<Tables['quotes'][]>> {
      try {
        let query = supabase.from('quotes').select('*');

        // Apply filters if provided
        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        // Apply sorting if provided
        if (options?.sortBy) {
          query = query.order(options.sortBy, { 
            ascending: options.sortOrder !== 'desc' 
          });
        }

        // Apply pagination if provided
        if (options?.limit) {
          query = query.limit(options.limit);
        }
        
        if (options?.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Get a single quote by ID
     */
    async getById(id: string): Promise<DbResponse<Tables['quotes']>> {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Create a new quote
     */
    async create(quote: Omit<Tables['quotes'], 'id' | 'created_at' | 'updated_at'>): Promise<DbResponse<Tables['quotes']>> {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .insert(quote)
          .select()
          .single();

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Update an existing quote
     */
    async update(id: string, updates: Partial<Tables['quotes']>): Promise<DbResponse<Tables['quotes']>> {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Delete a quote
     */
    async delete(id: string): Promise<DbResponse<void>> {
      try {
        const { error } = await supabase
          .from('quotes')
          .delete()
          .eq('id', id);

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data: null,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    }
  },

  /**
   * Email logs operations
   */
  emailLogs: {
    /**
     * Get email logs for a quote
     */
    async getForQuote(quoteId: string): Promise<DbResponse<any[]>> {
      try {
        const { data, error } = await supabase
          .from('email_logs')
          .select('*')
          .eq('quote_id', quoteId)
          .order('sent_at', { ascending: false });

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    },

    /**
     * Log a new email
     */
    async create(emailLog: {
      quote_id: string;
      recipient_email: string;
      status: 'sent' | 'failed' | 'delivered';
      subject: string;
      error_message?: string;
    }): Promise<DbResponse<any>> {
      try {
        const { data, error } = await supabase
          .from('email_logs')
          .insert({
            ...emailLog,
            sent_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          return {
            data: null,
            error: error.message,
            status: 'error'
          };
        }

        return {
          data,
          error: null,
          status: 'success'
        };
      } catch (err: any) {
        return {
          data: null,
          error: err.message || 'Unknown error occurred',
          status: 'error'
        };
      }
    }
  }
};
