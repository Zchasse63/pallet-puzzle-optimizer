#!/usr/bin/env bash

# Test script for the send-quote-email Edge Function

echo "Sending test request to the Edge Function..."

curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Quote from Pallet Puzzle Optimizer",
    "html": "<h1>Test Quote</h1><p>This is a test quote email from the Pallet Puzzle Optimizer.</p>",
    "quoteId": "test-123"
  }'

echo -e "\n\nNote: You'll need to update the Mailgun credentials in the .env file for the email to actually send."
