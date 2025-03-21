# Send Quote Email Edge Function

This Supabase Edge Function handles sending quote emails using Mailgun.

## Setup

1. Make sure Deno is installed:
   ```bash
   brew install deno
   ```

2. Create a `.env` file based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your actual credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `MAILGUN_API_KEY`: Your Mailgun API key
   - `MAILGUN_DOMAIN`: Your Mailgun domain
   - `MAILGUN_FROM_EMAIL`: The email address to send from

## Development

To test the function locally:

```bash
cd supabase/functions
supabase functions serve send-quote-email --env-file .env
```

## Deployment

To deploy the function to your Supabase project:

```bash
supabase functions deploy send-quote-email
```

After deployment, set the required environment variables in your Supabase project:

```bash
supabase secrets set MAILGUN_API_KEY=your_mailgun_api_key MAILGUN_DOMAIN=your_mailgun_domain MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

## Usage

The function expects a POST request with the following JSON payload:

```json
{
  "to": "recipient@example.com",
  "subject": "Your Quote",
  "html": "<p>Your quote details...</p>",
  "quoteId": "quote-123"
}
```

It will send the email via Mailgun and log the status in the `email_logs` table.
