// supabase/functions/send-results/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchResult {
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  userTip1: number;
  userTip2: number;
  points: number;
}

function getPointsEmoji(points: number): string {
  switch (points) {
    case 4: return "🎯";
    case 3: return "✨";
    case 2: return "👍";
    default: return "❌";
  }
}

function getPointsText(points: number): string {
  switch (points) {
    case 4: return "Exaktes Ergebnis!";
    case 3: return "Richtige Differenz!";
    case 2: return "Richtige Tendenz";
    default: return "Leider daneben";
  }
}

function getPointsColor(points: number): string {
  switch (points) {
    case 4: return "#28a745";
    case 3: return "#17a2b8";
    case 2: return "#ffc107";
    default: return "#dc3545";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      results, // Array von MatchResult
      totalPoints,
      newRank,
      leagueName
    } = await req.json();

    if (!email || !results || results.length === 0) {
      return new Response(
        JSON.stringify({ error: "email and results are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = name || email.split("@")[0];
    const pointsEarned = results.reduce((sum: number, r: MatchResult) => sum + r.points, 0);

    const resultsHtml = results.map((result: MatchResult) => `
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 12px; border-left: 4px solid ${getPointsColor(result.points)};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <h4 style="color: #333; margin: 0 0 8px 0; font-size: 16px;">
              ${result.team1} vs ${result.team2}
            </h4>
            <p style="color: #1a472a; margin: 0 0 4px 0; font-size: 20px; font-weight: bold;">
              Ergebnis: ${result.score1} : ${result.score2}
            </p>
            <p style="color: #666; margin: 0; font-size: 14px;">
              Dein Tipp: ${result.userTip1} : ${result.userTip2}
            </p>
          </div>
          <div style="text-align: center; padding-left: 16px;">
            <span style="font-size: 32px;">${getPointsEmoji(result.points)}</span>
            <p style="color: ${getPointsColor(result.points)}; margin: 4px 0 0 0; font-weight: bold; font-size: 14px;">
              +${result.points} Punkte
            </p>
            <p style="color: #888; margin: 0; font-size: 11px;">
              ${getPointsText(result.points)}
            </p>
          </div>
        </div>
      </div>
    `).join('');

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
      <h1 style="color: white; margin: 0; font-size: 28px;">📊 Ergebnis-Update</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Deine Punkte sind da!</p>
    </div>
    
    <!-- Points Summary -->
    <div style="background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%); padding: 24px; text-align: center;">
      <p style="color: #1a472a; margin: 0 0 8px 0; font-size: 16px;">Punkte in dieser Runde:</p>
      <p style="color: #1a472a; margin: 0; font-size: 48px; font-weight: bold;">+${pointsEarned}</p>
      ${totalPoints !== undefined ? `<p style="color: #1a472a; margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Gesamtpunkte: ${totalPoints}</p>` : ''}
      ${newRank !== undefined ? `<p style="color: #1a472a; margin: 4px 0 0 0; font-size: 14px; opacity: 0.8;">Dein Rang: #${newRank} ${leagueName ? `in "${leagueName}"` : ''}</p>` : ''}
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      
      <h2 style="color: #333; margin: 0 0 24px 0; font-size: 20px;">
        Hallo ${userName}! So hast du getippt:
      </h2>
      
      ${resultsHtml}
      
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="https://wm26.live/standings" style="display: inline-block; background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Zum Leaderboard →
        </a>
      </div>
      
      <div style="background: #e8f5e9; border-radius: 12px; padding: 16px; text-align: center;">
        <p style="color: #2e7d32; margin: 0; font-size: 14px;">
          🎯 Exakt = 4 Punkte • ✨ Differenz = 3 • 👍 Tendenz = 2
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #888; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://wm26.live/settings" style="color: #1a472a; text-decoration: none;">E-Mail-Einstellungen</a>
      </p>
      <p style="margin: 0;">© 2025 WM 2026 Tippspiel</p>
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
        to: [email],
        subject: `📊 +${pointsEarned} Punkte! Dein Ergebnis-Update`,
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
