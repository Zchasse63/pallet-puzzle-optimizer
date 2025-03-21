import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import WebQuotePreview from '@/components/WebQuotePreview';
import QuoteViewTracker from './QuoteViewTracker';
import type { Metadata, ResolvingMetadata } from 'next';

// Types
type QuotePageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate metadata for SEO
export async function generateMetadata(
  { params }: QuotePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch quote data
  const supabase = createServerComponentClient({ cookies });
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', params.id)
    .single();

  // Default metadata
  const defaultTitle = 'Quote | Pallet Puzzle Optimizer';
  const defaultDescription = 'View your pallet optimization quote';

  // Return quote-specific metadata if available
  return {
    title: quote ? `Quote #${quote.quote_number} | Pallet Puzzle Optimizer` : defaultTitle,
    description: quote 
      ? `Pallet optimization quote with ${quote.total_pallets} pallets and ${quote.container_utilization}% container utilization` 
      : defaultDescription,
    openGraph: {
      title: quote ? `Quote #${quote.quote_number}` : defaultTitle,
      description: quote 
        ? `View your pallet optimization quote with ${quote.total_pallets} pallets` 
        : defaultDescription,
      type: 'website',
    },
  };
}

// Loading component
function QuoteLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin" />
        <p className="text-lg font-medium">Loading quote...</p>
      </div>
    </div>
  );
}



// Main quote page component
export default async function QuotePage({ params, searchParams }: QuotePageProps) {
  const { id } = params;
  const source = typeof searchParams.source === 'string' ? searchParams.source : 'direct';
  
  // Server-side data fetching
  const supabase = createServerComponentClient({ cookies });
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();
  
  // Handle errors
  if (error || !quote) {
    console.error('Error fetching quote:', error);
    notFound();
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<QuoteLoading />}>
        <WebQuotePreview quote={quote} />
        <QuoteViewTracker quoteId={id} />
      </Suspense>
    </main>
  );
}
