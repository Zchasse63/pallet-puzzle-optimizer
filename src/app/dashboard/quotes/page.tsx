'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { 
  FileText, 
  PlusCircle,
  Share2,
  Eye,
  Calendar,
  Trash2,
  MoreHorizontal,
  Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Define the Quote type
interface Quote {
  id: string;
  created_at: string;
  name: string;
  expires_at: string | null;
  view_count: number;
  share_count: number;
}

export default function QuotesPage() {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchQuotes = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setQuotes(data || []);
      } catch (error) {
        console.error('Error fetching quotes:', error);
        toast.error('Failed to load quotes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuotes();
  }, [user, supabase]);
  
  const handleCreateNewQuote = () => {
    router.push('/');
  };
  
  const handleDeleteQuote = async () => {
    if (!quoteToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteToDelete);
        
      if (error) throw error;
      
      setQuotes(quotes.filter(quote => quote.id !== quoteToDelete));
      toast.success('Quote deleted successfully');
      setQuoteToDelete(null);
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleShareQuote = async (quoteId: string) => {
    try {
      // Generate shareable link
      const shareUrl = `${window.location.origin}/quotes/${quoteId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Update share count
      await supabase
        .from('quotes')
        .update({ share_count: quotes.find(q => q.id === quoteId)?.share_count! + 1 })
        .eq('id', quoteId);
        
      // Update local state
      setQuotes(quotes.map(quote => 
        quote.id === quoteId 
          ? { ...quote, share_count: quote.share_count + 1 } 
          : quote
      ));
      
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Error sharing quote:', error);
      toast.error('Failed to share quote');
    }
  };
  
  const filteredQuotes = quotes.filter(quote => 
    quote.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-1">Manage your saved quotes</p>
        </div>
        
        <Button onClick={handleCreateNewQuote} className="shrink-0">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Quote
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search quotes..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredQuotes.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No quotes found</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              {quotes.length === 0 
                ? "You haven't created any quotes yet. Create your first quote to get started."
                : "No quotes match your search criteria. Try a different search term."}
            </p>
            {quotes.length === 0 && (
              <Button onClick={handleCreateNewQuote}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Quote
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold truncate pr-6">
                    {quote.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mt-1 -mr-2">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareQuote(quote.id)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setQuoteToDelete(quote.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="text-gray-500">
                  Created {format(parseISO(quote.created_at), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span>{quote.view_count}</span>
                  </div>
                  <div className="flex items-center">
                    <Share2 className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span>{quote.share_count}</span>
                  </div>
                  {quote.expires_at && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                      <span>Expires {format(parseISO(quote.expires_at), 'MMM d')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                >
                  View Quote
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!quoteToDelete} onOpenChange={(open) => !open && setQuoteToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setQuoteToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteQuote}
              disabled={isDeleting}
            >
              {isDeleting ? <LoadingSpinner size="sm" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
