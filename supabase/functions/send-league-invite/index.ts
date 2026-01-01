// supabase/functions/send-league-invite/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
      inviteeEmail, 
      inviterName, 
      leagueName, 
      leagueCode,
      inviteToken 
    } = await req.json();

    if (!inviteeEmail || !leagueName) {
      return new Response(
        JSON.stringify({ error: "inviteeEmail and leagueName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inviteUrl = `https://wm26.live/join-league?token=${inviteToken || leagueCode}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🏆 Liga-Einladung</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">WM 2026 Tippspiel</p>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 64px;">📩</span>
      </div>
      
      <h2 style="color: #1a472a; margin: 0 0 20px 0; font-size: 22px; text-align: center;">
        ${inviterName || "Ein Freund"} lädt dich ein!
      </h2>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        Du wurdest eingeladen, der Tippliga beizutreten:
      </p>
      
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; text-align: center; border: 2px dashed #1a472a;">
        <h3 style="color: #1a472a; margin: 0; font-size: 24px; font-weight: bold;">
          "${leagueName}"
        </h3>
        ${leagueCode ? `<p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">Liga-Code: <strong>${leagueCode}</strong></p>` : ''}
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 18px;">
          Liga beitreten 🚀
        </a>
      </div>
      
      <div style="background: #fff3cd; border-radius: 12px; padding: 16px; text-align: center;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          ⏰ Diese Einladung ist 7 Tage gültig
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      
      <div style="text-align: center;">
        <p style="color: #666; font-size: 14px; margin: 0 0 16px 0;">
          Falls der Button nicht funktioniert, kopiere diesen Link:
        </p>
        <p style="color: #1a472a; font-size: 12px; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 8px;">
          ${inviteUrl}
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #888; font-size: 14px;">
      <p style="margin: 0;">© 2025 WM 2026 Tippspiel • <a href="https://wm26.live" style="color: #1a472a;">wm26.live</a></p>
    </div>
    
  </div>
</body>
</html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "WM 2026 Tippspiel <noreply@wm26.live>",
        to: [inviteeEmail],
        subject: `🏆 ${inviterName || "Ein Freund"} lädt dich zur Liga "${leagueName}" ein!`,
        html: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
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
