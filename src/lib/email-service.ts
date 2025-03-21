import { supabase, supabaseHelpers } from './supabase';
import { Product } from './types';

interface EmailQuoteParams {
  recipientEmail: string;
  quoteId: string;
  products: Product[];
  containerUtilization: number;
  totalPallets: number;
  customerName?: string;
  customerCompany?: string;
  additionalNotes?: string;
}

/**
 * Sends a quote via email using Supabase Edge Functions
 * This requires setting up a Supabase Edge Function for email sending
 */
export const sendQuoteEmail = async ({
  recipientEmail,
  quoteId,
  products,
  containerUtilization,
  totalPallets,
  customerName = '',
  customerCompany = '',
  additionalNotes = ''
}: EmailQuoteParams): Promise<{ success: boolean; message: string }> => {
  try {
    // Calculate totals
    const productsTotal = products.reduce(
      (sum, product) => sum + (product.quantity * (product.price || 0)), 
      0
    );
    
    // Format date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Valid until date (30 days from now)
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);
    const validUntil = validUntilDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Save quote to Supabase
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteId,
        products: products.map(p => ({
          product_id: p.id || crypto.randomUUID(),
          name: p.name,
          sku: p.sku || '',
          quantity: p.quantity,
          price: p.price || 0
        })),
        container_utilization: containerUtilization,
        total_pallets: totalPallets,
        customer_name: customerName,
        customer_email: recipientEmail,
        customer_company: customerCompany,
        additional_notes: additionalNotes,
        status: 'sent',
        expires_at: validUntilDate.toISOString()
      })
      .select('id')
      .single();
      
    if (quoteError) {
      console.error('Error saving quote:', quoteError);
      // Continue with email sending even if quote saving fails
    }
    
    // Generate email HTML content
    const emailHtml = generateQuoteEmailHtml({
      quoteId,
      products,
      productsTotal,
      containerUtilization,
      totalPallets,
      currentDate,
      validUntil,
      customerName,
      customerCompany,
      additionalNotes
    });
    
    // In production, this would call a Supabase Edge Function to send the email
    // For now, we'll log the email content and simulate a successful send
    
    // Uncomment for production with Supabase Edge Functions
    const { data, error } = await supabase.functions.invoke('send-quote-email', {
      body: {
        to: recipientEmail,
        subject: `Quote #${quoteId} from Pallet Puzzle Optimizer`,
        html: emailHtml,
        quoteId: quoteData?.id || quoteId
      }
    });
    
    if (error) {
      console.error('Error sending email:', error);
      
      // Log the failed email attempt
      await supabase.from('email_logs').insert({
        quote_id: quoteData?.id,
        recipient_email: recipientEmail,
        subject: `Quote #${quoteId} from Pallet Puzzle Optimizer`,
        status: 'failed',
        error_message: error.message
      });
      
      return { success: false, message: 'Failed to send email. Please try again.' };
    }
    
    // Log the successful email
    await supabase.from('email_logs').insert({
      quote_id: quoteData?.id,
      recipient_email: recipientEmail,
      subject: `Quote #${quoteId} from Pallet Puzzle Optimizer`,
      status: 'sent'
    });
    
    return { success: true, message: 'Quote email sent successfully!' };
  } catch (error) {
    console.error('Error in sendQuoteEmail:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while sending the email. Please try again.' 
    };
  }
};

/**
 * Generates an HTML template for the quote email
 * This would typically be used by the Edge Function
 */
export const generateQuoteEmailHtml = ({
  quoteId,
  products,
  productsTotal,
  containerUtilization,
  totalPallets,
  currentDate,
  validUntil,
  customerName,
  customerCompany,
  additionalNotes
}: Omit<EmailQuoteParams, 'recipientEmail'> & {
  productsTotal: number;
  validUntil: string;
  currentDate: string;
}): string => {
  // Product rows HTML
  const productRowsHtml = products.map(product => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px;">${product.name}</td>
      <td style="padding: 12px 8px; text-align: right;">$${product.price?.toFixed(2) || '0.00'}</td>
      <td style="padding: 12px 8px; text-align: right;">${product.quantity}</td>
      <td style="padding: 12px 8px; text-align: right;">$${(product.quantity * (product.price || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  // Main email HTML template
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote #${quoteId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { margin-bottom: 30px; }
        .logo { max-width: 150px; height: auto; }
        h1 { color: #2563eb; margin-bottom: 5px; }
        .quote-meta { margin-bottom: 20px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background-color: #f3f4f6; padding: 12px 8px; text-align: left; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .total-row { font-weight: bold; background-color: #f3f4f6; }
        .container-info { background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 6px; margin-bottom: 30px; }
        .savings-info { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin-bottom: 30px; }
        .footer { margin-top: 40px; font-size: 14px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        @media only screen and (max-width: 600px) {
          body { padding: 10px; }
          table { font-size: 14px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="https://via.placeholder.com/150x50" alt="Company Logo" class="logo">
        <h1>Quote #${quoteId}</h1>
        <div class="quote-meta">
          <p>Generated on: ${currentDate}</p>
          <p>Valid until: ${validUntil}</p>
          ${customerName ? `<p>Prepared for: ${customerName}${customerCompany ? ` (${customerCompany})` : ''}</p>` : ''}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Quantity</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productRowsHtml}
          <tr class="total-row">
            <td colspan="3" style="padding: 12px 8px; text-align: right;">Total:</td>
            <td style="padding: 12px 8px; text-align: right;">$${productsTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="container-info">
        <h3 style="margin-top: 0;">Container Information</h3>
        <p><strong>Container Utilization:</strong> ${containerUtilization.toFixed(1)}%</p>
        <p><strong>Total Pallets:</strong> ${totalPallets}</p>
      </div>
      
      <div class="savings-info">
        <h3 style="margin-top: 0;">Special Offer</h3>
        <p><strong>Container Discount:</strong> 22.0% savings vs. individual pallet ordering</p>
        <p><strong>Limited Time:</strong> This quote is valid for 30 days from the date of issue</p>
      </div>
      
      ${additionalNotes ? `
      <div style="margin-bottom: 30px;">
        <h3>Additional Notes</h3>
        <p>${additionalNotes}</p>
      </div>
      ` : ''}
      
      <a href="#" class="cta-button">Accept Quote</a>
      
      <div class="footer">
        <p>Thank you for your business! If you have any questions about this quote, please contact our sales team.</p>
        <p> 2023 Your Company Name. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export default { sendQuoteEmail, generateQuoteEmailHtml };
