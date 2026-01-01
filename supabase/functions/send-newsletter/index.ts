// supabase/functions/send-newsletter/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      subject, 
      content,       // HTML content
      previewText,   // E-Mail Preview Text
      testEmail      // Optional: Nur an diese Adresse senden (zum Testen)
    } = await req.json();

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: "subject and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Empfänger ermitteln
    let recipients: string[] = [];
    
    if (testEmail) {
      // Test-Modus: Nur an eine Adresse
      recipients = [testEmail];
    } else {
      // Produktiv: Alle aktiven Newsletter-Subscriber
      const { data: subscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('is_active', true);

      if (error) throw error;
      recipients = subscribers?.map(s => s.email) || [];
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${previewText ? `<!--${previewText}-->` : ''}
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🏆 WM 2026 Tippspiel</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Newsletter</p>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      
      <h2 style="color: #1a472a; margin: 0 0 24px 0; font-size: 24px;">
        ${subject}
      </h2>
      
      <div style="color: #333; font-size: 16px; line-height: 1.8;">
        ${content}
      </div>
      
      <div style="text-align: center; margin: 40px 0 24px 0;">
        <a href="https://wm26.live" style="display: inline-block; background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Zur App →
        </a>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #888; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">
        Du erhältst diese E-Mail, weil du den WM 2026 Newsletter abonniert hast.
      </p>
      <p style="margin: 0 0 16px 0;">
        <a href="https://wm26.live/unsubscribe?email={{email}}" style="color: #888; text-decoration: underline;">Newsletter abbestellen</a>
      </p>
      <p style="margin: 0;">© 2025 WM 2026 Tippspiel • <a href="https://wm26.live" style="color: #1a472a;">wm26.live</a></p>
    </div>
    
  </div>
</body>
</html>
    `;

    // Resend Batch API für viele Empfänger
    // Bei mehr als 100 Empfängern in Batches aufteilen
    const batchSize = 50;
    let sentCount = 0;
    const errors: string[] = [];
    const resendIds: string[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Einzelne E-Mails für personalisierten Unsubscribe-Link
      for (const email of batch) {
        const personalizedHtml = html.replace('{{email}}', encodeURIComponent(email));
        
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "WM 2026 Tippspiel <newsletter@wm26.live>",
            to: [email],
            subject: `🏆 ${subject}`,
            html: personalizedHtml,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          sentCount++;
          resendIds.push(data.id);
          
          // Log in Datenbank
          await supabase.from('email_log').insert({
            recipient_email: email,
            email_type: 'newsletter',
            subject: subject,
            resend_id: data.id,
            status: 'sent'
          });
        } else {
          errors.push(`${email}: ${data.message || 'Unknown error'}`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        total: recipients.length,
        ids: resendIds.slice(0, 10), // Nur erste 10 IDs zurückgeben
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
