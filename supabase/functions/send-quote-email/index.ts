// deno-lint-ignore-file
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

/// <reference path="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  quoteId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the request payload
    const payload: EmailPayload = await req.json();
    const { to, subject, html, quoteId } = payload;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: to, subject, or html" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // For this example, we'll use a third-party email service
    // In a real implementation, you would integrate with your preferred email provider
    // such as SendGrid, Mailgun, Postmark, etc.
    
    const emailResponse = await fetch(`https://api.mailgun.net/v3/${Deno.env.get("MAILGUN_DOMAIN")}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`api:${Deno.env.get("MAILGUN_API_KEY")}`)}`,
      },
      body: new URLSearchParams({
        from: Deno.env.get("MAILGUN_FROM_EMAIL"),
        to,
        subject,
        html,
      }).toString(),
    });
    
    const emailSent = await emailResponse.json();

    // Log the email in the database
    const { error: logError } = await supabaseClient
      .from("email_logs")
      .insert({
        quote_id: quoteId,
        recipient_email: to,
        subject,
        status: emailSent.message === "Queued. Thank you." ? "sent" : "failed",
        error_message: emailSent.message === "Queued. Thank you." ? null : emailSent.message
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    // Update the quote status
    if (quoteId) {
      const { error: updateError } = await supabaseClient
        .from("quotes")
        .update({ status: "sent" })
        .eq("id", quoteId);

      if (updateError) {
        console.error("Error updating quote status:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
