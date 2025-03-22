import { useQuotes } from '@/hooks/useQuotes';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function RecentQuotes() {
  const { quotes, isLoading } = useQuotes();
  
  // Get status badge
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
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span>Loading quotes...</span>
      </div>
    );
  }
  
  // Empty state
  if (quotes.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">No quotes found</p>
        <Button variant="outline" size="sm">Create a Quote</Button>
      </div>
    );
  }
  
  // Show only the 5 most recent quotes
  const recentQuotes = quotes.slice(0, 5);
  
  return (
    <div className="space-y-4">
      {recentQuotes.map((quote) => (
        <div key={quote.id} className="flex items-center justify-between border-b pb-2 last:border-0">
          <div>
            <div className="font-medium">{quote.quote_number}</div>
            <div className="text-sm text-muted-foreground">
              {formatDate(quote.created_at)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(quote.status)}
            <div className="text-sm font-medium">
              {quote.container_utilization.toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}