# Pallet Puzzle Optimizer Deployment Guide

This guide provides step-by-step instructions for deploying the Pallet Puzzle Optimizer application to Netlify with a custom domain and Supabase backend integration.

## Prerequisites

- GitHub repository with your project code
- Netlify account (free tier is sufficient)
- Supabase project already set up
- Custom domain (that you already own)
- Node.js and npm installed locally

## 1. Prepare Your Application for Production

### Environment Variables

Create a `.env.production` file with your production environment variables:

```bash
# Run the setup script to generate this file
node scripts/setup-netlify-env.js
```

### Build Optimization

Ensure your Next.js application is optimized for production:

1. Check your `next.config.js` for proper production settings
2. Run a production build locally to test:

```bash
npm run build
```

3. Verify no build errors occur

## 2. Set Up Supabase Storage Buckets

Storage buckets are needed for PDF quotes and product images:

```bash
# Replace YOUR_SERVICE_ROLE_KEY with your actual key
node scripts/setup-supabase-storage.js YOUR_SERVICE_ROLE_KEY
```

This creates three storage buckets:
- `quotes`: Private bucket for PDF quote documents
- `product-images`: Public bucket for product images
- `assets`: Public bucket for general assets

## 3. Deploy to Netlify

### Option 1: Deploy via Netlify CLI (Recommended)

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Log in to Netlify:
```bash
netlify login
```

3. Initialize Netlify in your project:
```bash
netlify init
```

4. Set environment variables:
```bash
# Run the generated script
./netlify-env-commands.sh
```

5. Deploy your site:
```bash
netlify deploy --prod
```

### Option 2: Deploy via Netlify Dashboard

1. Log in to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider (GitHub, GitLab, etc.)
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click "Deploy site"
7. Add environment variables in Site settings → Build & deploy → Environment

## 4. Set Up Custom Domain

### Step 1: Add Your Domain in Netlify

1. Go to Netlify dashboard → Your site → Domain settings
2. Click "Add custom domain"
3. Enter your domain name and click "Verify"
4. Choose between:
   - Netlify DNS (recommended, easier setup)
   - External DNS (if you want to keep your current DNS provider)

### Step 2: Configure DNS

#### If using Netlify DNS:

1. In the Netlify dashboard, click "Set up Netlify DNS"
2. Follow the instructions to update your domain's nameservers at your registrar
3. Wait for DNS propagation (can take 24-48 hours)

#### If using External DNS:

1. Go to your DNS provider (GoDaddy, Namecheap, etc.)
2. Add a CNAME record:
   - Name: `www` (or subdomain of your choice)
   - Value: Your Netlify site URL (e.g., `your-site-name.netlify.app`)
3. For the root domain, add either:
   - An ALIAS record pointing to your Netlify site URL, or
   - An A record pointing to Netlify's load balancer IP addresses (provided in Netlify dashboard)

### Step 3: SSL Certificate

Netlify automatically provisions SSL certificates through Let's Encrypt. To ensure it's set up:

1. Go to Site settings → Domain management → HTTPS
2. Verify that "SSL/TLS certificate" shows "Active certificate"
3. If not active, click "Renew certificate"

## 5. Verify Deployment

After deployment, verify that:

1. Your site loads correctly at your custom domain
2. Supabase connection works (test authentication and data retrieval)
3. All features function as expected in the production environment

## 6. Post-Deployment Tasks

### Set Up Monitoring

1. Add [Sentry](https://sentry.io/) for error tracking:
```bash
npm install @sentry/nextjs
```

2. Configure Sentry in your Next.js application

### Configure Analytics

1. Set up Google Analytics or similar service
2. Add the tracking code to your application

### Regular Maintenance

1. Set up automated backups for your Supabase database
2. Establish a regular update schedule for dependencies
3. Implement a CI/CD pipeline for automated testing and deployment

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in Netlify dashboard
   - Verify all dependencies are properly installed
   - Ensure environment variables are correctly set

2. **API Connection Issues**:
   - Verify Supabase URL and API keys
   - Check CORS configuration in Supabase
   - Test API endpoints independently

3. **Domain Configuration Problems**:
   - Verify DNS records are correctly set
   - Use [dnschecker.org](https://dnschecker.org/) to check DNS propagation
   - Ensure SSL certificate is active

For additional help, refer to:
- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)

## Security Considerations

1. Never commit sensitive environment variables to your repository
2. Regularly rotate API keys and credentials
3. Implement proper authentication and authorization
4. Enable Row Level Security (RLS) in Supabase
5. Set up proper CORS policies for your API endpoints

---

For any questions or issues, please contact the development team.
