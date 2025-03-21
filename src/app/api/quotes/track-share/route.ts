import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { quoteId, method = 'direct' } = await request.json();
    
    if (!quoteId) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Log the share event in the database
    const { error } = await supabase
      .from('quote_events')
      .insert({
        quote_id: quoteId,
        event_type: 'share',
        event_data: { method },
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error tracking quote share:', error);
      return NextResponse.json(
        { error: 'Failed to track quote share' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in track-share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable caching for this API route
export const dynamic = 'force-dynamic';
