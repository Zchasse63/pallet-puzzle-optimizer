'use client';

import { useEffect } from 'react';

interface QuoteViewTrackerProps {
  quoteId: string;
}

/**
 * Client component that tracks quote views
 * Automatically sends a view tracking request when mounted
 */
export default function QuoteViewTracker({ quoteId }: QuoteViewTrackerProps) {
  // Track view on component mount
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch('/api/quotes/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId })
        });
        console.log('View tracked successfully');
      } catch (error) {
        console.error('Failed to track quote view:', error);
      }
    };
    
    trackView();
  }, [quoteId]);
  
  // This component doesn't render anything
  return null;
}
