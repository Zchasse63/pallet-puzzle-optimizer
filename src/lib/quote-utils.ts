/**
 * Utility functions for working with quotes
 */

// Types
export interface QuoteShareOptions {
  baseUrl?: string;
  includeExpiry?: boolean;
  trackingParams?: Record<string, string>;
}

/**
 * Generate a shareable URL for a quote
 * @param quoteId - The ID or quote number of the quote
 * @param options - Configuration options for the URL
 * @returns The fully formed quote URL
 */
export function generateQuoteUrl(
  quoteId: string,
  options: QuoteShareOptions = {}
): string {
  // Get base URL from options, environment variable, or fallback to relative path
  const baseUrl = options.baseUrl || 
    process.env.NEXT_PUBLIC_SITE_URL || 
    window.location.origin;
  
  // Create the basic quote URL
  let url = `${baseUrl}/quotes/${quoteId}`;
  
  // Add tracking parameters if provided
  if (options.trackingParams && Object.keys(options.trackingParams).length > 0) {
    const params = new URLSearchParams();
    Object.entries(options.trackingParams).forEach(([key, value]) => {
      params.append(key, value);
    });
    url += `?${params.toString()}`;
  }
  
  return url;
}

/**
 * Copy a quote URL to the clipboard
 * @param quoteId - The ID or quote number of the quote
 * @param options - Configuration options for the URL
 * @returns Promise that resolves when copying is complete
 */
export async function copyQuoteUrlToClipboard(
  quoteId: string,
  options: QuoteShareOptions = {}
): Promise<boolean> {
  try {
    const url = generateQuoteUrl(quoteId, options);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy quote URL:', error);
    return false;
  }
}

/**
 * Generate an email link with quote information
 * @param quoteId - The ID or quote number of the quote
 * @param quoteData - Quote data for email body
 * @param recipientEmail - Optional recipient email
 * @returns Email mailto link
 */
export function generateQuoteEmailLink(
  quoteId: string,
  quoteData: {
    quoteNumber: string;
    totalPallets: number;
    containerUtilization: number;
  },
  recipientEmail?: string
): string {
  const quoteUrl = generateQuoteUrl(quoteId);
  
  const subject = encodeURIComponent(
    `Your Pallet Optimization Quote #${quoteData.quoteNumber}`
  );
  
  const body = encodeURIComponent(
    `Hello,\n\nHere is your pallet optimization quote:\n\n` +
    `Quote #: ${quoteData.quoteNumber}\n` +
    `Total Pallets: ${quoteData.totalPallets}\n` +
    `Container Utilization: ${quoteData.containerUtilization}%\n\n` +
    `View your complete quote here: ${quoteUrl}\n\n` +
    `This quote link will remain active for 30 days.\n\n` +
    `Thank you for using our service!`
  );
  
  const mailtoLink = `mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`;
  return mailtoLink;
}

/**
 * Check if a quote has expired
 * @param expiresAt - Expiration timestamp string
 * @returns Boolean indicating if quote has expired
 */
export function isQuoteExpired(expiresAt: string): boolean {
  if (!expiresAt) return false;
  
  const expiryDate = new Date(expiresAt);
  const currentDate = new Date();
  
  return currentDate > expiryDate;
}

/**
 * Format a quote expiration date
 * @param expiresAt - Expiration timestamp string
 * @returns Formatted date string
 */
export function formatQuoteExpiry(expiresAt: string): string {
  if (!expiresAt) return 'No expiration';
  
  const expiryDate = new Date(expiresAt);
  
  // Format: "March 19, 2025"
  return expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
