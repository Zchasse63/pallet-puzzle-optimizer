# Supabase Setup for Pallet Puzzle Optimizer

This guide explains how to set up Supabase for the Pallet Puzzle Optimizer application to enable email quote functionality and other backend features.

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Node.js and npm installed

## Setup Steps

### 1. Create a Supabase Project

1. Log in to your Supabase account
2. Create a new project with a name of your choice
3. Note your project URL and anon key (public API key) from the project settings

### 2. Configure Environment Variables

1. Create a `.env.local` file in the root of your project
2. Add the following environment variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database Tables

Execute the following SQL in the Supabase SQL Editor to create the necessary tables:

```sql
-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2),
  dimensions JSONB,
  weight DECIMAL(10, 2),
  units_per_pallet INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  quote_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  products JSONB NOT NULL,
  container_utilization DECIMAL(5, 2),
  total_pallets INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Create RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Public products are viewable by everyone" 
  ON products FOR SELECT USING (true);

-- Quotes policies
CREATE POLICY "Users can view their own quotes" 
  ON quotes FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own quotes" 
  ON quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own quotes" 
  ON quotes FOR UPDATE USING (auth.uid() = user_id);
```

### 4. Set Up Email Functionality

For email functionality, you have two options:

#### Option A: Use Supabase Edge Functions (Recommended)

1. Install Supabase CLI
2. Create a new Edge Function:

```bash
supabase functions new send-quote-email
```

3. Implement the email sending logic in the Edge Function
4. Deploy the function:

```bash
supabase functions deploy send-quote-email
```

#### Option B: Use a Third-Party Email Service

1. Sign up for a service like SendGrid, Mailgun, or Resend
2. Add your API key to the `.env.local` file:

```
VITE_EMAIL_SERVICE=sendgrid
VITE_EMAIL_API_KEY=your-email-api-key
VITE_EMAIL_FROM=noreply@example.com
```

3. Update the `email-service.ts` file to use your chosen email service

## Usage

### Authentication

The application is set up with Supabase authentication. Users can:

1. Sign up with email and password
2. Sign in with existing credentials
3. Reset passwords
4. Manage their profile

### Email Quote Functionality

The "Email Quote" button in the Quote tab will:

1. Open a dialog to collect recipient information
2. Send the quote via email using the configured email service
3. Store the quote in the Supabase database for future reference

### Development Mode

During development, the email functionality is simulated and will log the email data to the console instead of actually sending an email.

## Troubleshooting

- **Authentication Issues**: Ensure your Supabase URL and anon key are correct
- **Email Sending Fails**: Check your email service configuration and API keys
- **Database Errors**: Verify that your database tables are set up correctly with the proper schemas

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
