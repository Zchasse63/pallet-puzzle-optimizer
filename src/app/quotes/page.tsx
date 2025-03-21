'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Quote } from '@/types';
import { toast } from 'sonner';
import { 
  FileText, 
  PlusCircle, 
  Trash2, 
  Search, 
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Eye,
  Share2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function QuotesPage() {
  const router = useRouter();
  const { user } = useSupabase();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Quote>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user, sortField, sortDirection]);

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user?.id);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Sort data
      const sortedData = [...(data || [])].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }

        if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;

        return sortDirection === 'asc' 
          ? (aValue < bValue ? -1 : 1) 
          : (bValue < aValue ? -1 : 1);
      });

      setQuotes(sortedData);
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      setError(err.message || 'Failed to load quotes');
      toast.error('Failed to load quotes', {
        description: err.message || 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: keyof Quote) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      setIsDeleting(id);
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setQuotes(quotes.filter(quote => quote.id !== id));
      toast.success('Quote deleted successfully');
    } catch (err: any) {
      console.error('Error deleting quote:', err);
      toast.error('Failed to delete quote', {
        description: err.message || 'Please try again later',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleShare = async (quoteId: string) => {
    try {
      // Record share event
      await supabase.from('quote_events').insert({
        quote_id: quoteId,
        event_type: 'share',
        user_id: user?.id
      });
      
      // Update share count
      await supabase.rpc('increment_quote_share_count', { quote_id: quoteId });
      
      // Update local state
      setQuotes(quotes.map(quote => 
        quote.id === quoteId 
          ? { ...quote, share_count: (quote.share_count || 0) + 1 } 
          : quote
      ));
      
      // Copy share link to clipboard
      const shareUrl = `${window.location.origin}/quotes/view/${quoteId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast.success('Share link copied to clipboard', {
        description: 'You can now share this link with your customers.'
      });
    } catch (err: any) {
      console.error('Error sharing quote:', err);
      toast.error('Failed to share quote', {
        description: err.message || 'Please try again later',
      });
    }
  };

  const filteredQuotes = quotes.filter(quote => 
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if quote is expired
  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Get status badge color
  const getStatusColor = (status: string, expiresAt?: string) => {
    if (isExpired(expiresAt)) return 'bg-red-100 text-red-800';
    
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <Link
            href="/quotes/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Quote
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search quotes..."
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading quotes...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center p-8 text-red-500">
              <AlertCircle className="h-6 w-6 mr-2" />
              {error}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="mb-2">No quotes found</p>
              <Link 
                href="/quotes/create" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first quote
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('quote_number')}
                    >
                      <div className="flex items-center">
                        Quote #
                        {sortField === 'quote_number' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === 'status' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Created
                        {sortField === 'created_at' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('expires_at')}
                    >
                      <div className="flex items-center">
                        Expires
                        {sortField === 'expires_at' && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className={isExpired(quote.expires_at) ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{quote.quote_number}</div>
                            <div className="text-sm text-gray-500">
                              {quote.products?.length || 0} products
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status, quote.expires_at)}`}>
                          {isExpired(quote.expires_at) ? 'Expired' : quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(quote.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(quote.expires_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1 text-gray-400" />
                            {quote.view_count || 0}
                          </div>
                          <div className="flex items-center">
                            <Share2 className="h-4 w-4 mr-1 text-gray-400" />
                            {quote.share_count || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Eye className="h-4 w-4 inline" />
                          <span className="sr-only">View</span>
                        </Link>
                        <button
                          onClick={() => handleShare(quote.id || '')}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          <Share2 className="h-4 w-4 inline" />
                          <span className="sr-only">Share</span>
                        </button>
                        <button
                          onClick={() => quote.id && handleDelete(quote.id)}
                          disabled={isDeleting === quote.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {isDeleting === quote.id ? (
                            <Loader2 className="h-4 w-4 inline animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 inline" />
                          )}
                          <span className="sr-only">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
