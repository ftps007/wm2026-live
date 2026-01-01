// supabase/functions/send-reminder/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Match {
  id: number;
  team1: string;
  team2: string;
  date: string;
  group?: string;
  stage?: string;
}

interface UserWithMatches {
  email: string;
  name: string;
  matches: Match[];
}

function generateReminderHtml(user: UserWithMatches): string {
  const matchesHtml = user.matches.map(match => {
    const matchDate = new Date(match.date);
    const formattedDate = matchDate.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 12px; border-left: 4px solid #1a472a;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="color: #1a472a; margin: 0 0 8px 0; font-size: 18px;">
              ${match.team1} vs ${match.team2}
            </h4>
            <p style="color: #666; margin: 0; font-size: 14px;">
              📅 ${formattedDate} ${match.group ? `• Gruppe ${match.group}` : match.stage || ''}
            </p>
          </div>
          <span style="font-size: 32px;">⚽</span>
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #e63946 0%, #d62839 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Tipp-Erinnerung!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Nicht vergessen zu tippen</p>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      
      <h2 style="color: #333; margin: 0 0 8px 0; font-size: 20px;">
        Hallo ${user.name}! 👋
      </h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Für folgende Spiele hast du noch keinen Tipp abgegeben:
      </p>
      
      ${matchesHtml}
      
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="https://wm26.live" style="display: inline-block; background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Jetzt Tipps abgeben →
        </a>
      </div>
      
      <div style="background: #fff3cd; border-radius: 12px; padding: 16px; text-align: center;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          💡 Tipps können bis zum Anstoß abgegeben werden!
        </p>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #888; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://wm26.live/settings" style="color: #1a472a; text-decoration: none;">Erinnerungen deaktivieren</a>
      </p>
      <p style="margin: 0;">© 2025 WM 2026 Tippspiel</p>
    </div>
    
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Kann manuell für einzelne User aufgerufen werden
    const body = await req.json().catch(() => ({}));
    const { email, name, matches } = body;

    // Einzelne E-Mail senden (manueller Aufruf)
    if (email && matches && matches.length > 0) {
      const html = generateReminderHtml({ email, name: name || email.split('@')[0], matches });
      
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "WM 2026 Tippspiel <noreply@wm26.live>",
          to: [email],
          subject: `⏰ ${matches.length} Spiel${matches.length > 1 ? 'e' : ''} ohne Tipp - Nicht vergessen!`,
          html: html,
        }),
      });

      const data = await res.json();

      return new Response(
        JSON.stringify({ success: res.ok, id: data.id }),
        { status: res.ok ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch-Verarbeitung (Cron-Job)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // User mit aktivierten Erinnerungen holen
    const { data: usersWithPrefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select(`
        user_id,
        reminder_hours_before,
        profiles!inner(email, display_name)
      `)
      .eq('match_reminders', true);

    if (prefsError) throw prefsError;

    // Für jeden User prüfen ob es Spiele ohne Tipp gibt
    let sentCount = 0;
    const errors: string[] = [];

    for (const userPref of usersWithPrefs || []) {
      const { data: matchesWithoutTip } = await supabase
        .rpc('get_upcoming_matches_without_prediction', {
          p_user_id: userPref.user_id,
          p_hours_before: userPref.reminder_hours_before || 24
        });

      if (matchesWithoutTip && matchesWithoutTip.length > 0) {
        const profile = userPref.profiles as any;
        const html = generateReminderHtml({
          email: profile.email,
          name: profile.display_name || profile.email.split('@')[0],
          matches: matchesWithoutTip
        });

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "WM 2026 Tippspiel <noreply@wm26.live>",
            to: [profile.email],
            subject: `⏰ ${matchesWithoutTip.length} Spiel${matchesWithoutTip.length > 1 ? 'e' : ''} ohne Tipp!`,
            html: html,
          }),
        });

        if (res.ok) {
          sentCount++;
        } else {
          errors.push(`Failed for ${profile.email}`);
        }

        // Rate limiting - 100ms Pause zwischen E-Mails
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined 
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
