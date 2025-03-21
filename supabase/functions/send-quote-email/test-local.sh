#!/usr/bin/env bash

# Script to test the send-quote-email Edge Function locally

# Change to the functions directory
cd "$(dirname "$0")/.."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Start the function locally
echo "Starting send-quote-email function..."
supabase functions serve send-quote-email --env-file .env

# Note: To test the function, send a POST request to http://localhost:54321/functions/v1/send-quote-email
# Example with curl:
# curl -X POST http://localhost:54321/functions/v1/send-quote-email \
#   -H "Content-Type: application/json" \
#   -d '{"to":"recipient@example.com","subject":"Test Quote","html":"<p>Test quote content</p>","quoteId":"test-123"}'
