import { useState, useEffect } from 'react';
import { useQuotes } from '@/hooks/useQuotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Loader2, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Quote } from '@/types';

interface QuoteListProps {
  status?: string;
  onSelectQuote: (quote: Quote) => void;
}

export function QuoteList({ status, onSelectQuote }: QuoteListProps) {
  const { quotes, isLoading, fetchQuotes } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch quotes when status changes
  useEffect(() => {
    fetchQuotes(status);
  }, [fetchQuotes, status]);
  
  // Filter quotes based on search term
  const filteredQuotes = quotes.filter(quote => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      quote.quote_number.toLowerCase().includes(searchLower)
    );
  });
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Loading quotes...</span>
      </div>
    );
  }
  
  // Empty state
  if (quotes.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <h3 className="font-medium text-lg mb-2">No quotes found</h3>
        <p className="text-muted-foreground mb-4">
          {status 
            ? `No quotes with status "${status}" found.` 
            : 'No quotes have been created yet.'}
        </p>
        <Button variant="outline">Create a Quote</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 max-w-sm"
          />
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead>Pallets</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">{quote.quote_number}</TableCell>
                <TableCell>{formatDate(quote.created_at)}</TableCell>
                <TableCell>{getStatusBadge(quote.status)}</TableCell>
                <TableCell>{quote.container_utilization.toFixed(1)}%</TableCell>
                <TableCell>{quote.total_pallets}</TableCell>
                <TableCell>{formatDate(quote.expires_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectQuote(quote)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}