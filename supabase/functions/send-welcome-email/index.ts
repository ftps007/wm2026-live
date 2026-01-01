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
    const { email, name, language } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userName = name || email.split("@")[0];
    const lang = language === "en" ? "en" : "de";
    const siteUrl = lang === "en" ? "https://wm26.live?lang=en" : "https://wm26.live?lang=de";
    const fromName = lang === "en" ? "World Cup Score Predictions" : "WM 2026 Tippspiel";

    const content = {
      de: {
        subject: "🏆 Willkommen beim WM 2026 Tippspiel!",
        title: "Tippspiel",
        countries: "USA • Kanada • Mexiko",
        welcome: `Willkommen, ${userName}! 🎉`,
        intro: "Du bist jetzt Teil des größten WM-Tippspiels 2026! Bereit, dein Fußball-Wissen unter Beweis zu stellen?",
        listTitle: "📋 Das erwartet dich:",
        items: [
          "🧠 Teste dein Wissen im WM-Trivia",
          "📰 Lies die aktuellsten News zur WM 2026",
          "📧 Abonniere den wöchentlichen Newsletter",
          "🎬 Schau dir die Videos an",
          "🎵 Lade dir die Spotify Playlist herunter",
          "👥 Erstelle eine Liga mit Freunden"
        ],
        button: "Jetzt loslegen →",
        footer: "© 2025 WM 2026 Tippspiel • wm26.live"
      },
      en: {
        subject: "🏆 Welcome to the World Cup 2026 Predictor!",
        title: "Tournament Prediction Game",
        countries: "USA • Canada • Mexico",
        welcome: `Welcome, ${userName}! 🎉`,
        intro: "You're now part of the biggest World Cup 2026 prediction game! Ready to prove your football knowledge?",
        listTitle: "📋 What awaits you:",
        items: [
          "🧠 Test your knowledge in the WC Trivia",
          "📰 Read the latest World Cup 2026 news",
          "📧 Subscribe to the weekly newsletter",
          "🎬 Watch the videos",
          "🎵 Download the Spotify Playlist",
          "👥 Create a league with friends"
        ],
        button: "Get started →",
        footer: "© 2025 World Cup Score Predictions • wm26.live"
      }
    };

    const c = content[lang];

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
<div style="background:#1a365d;border-radius:16px 16px 0 0;padding:40px 30px;text-align:center;">
<img src="https://wm26.live/logo.png" alt="WM 2026" style="max-width:280px;height:auto;margin-bottom:16px;" />
<h1 style="color:#ffffff;margin:0;font-size:28px;">${c.title}</h1>
<p style="color:#ffd700;margin:10px 0 0 0;font-size:16px;font-weight:600;">${c.countries}</p>
</div>
<div style="background:#ffffff;padding:40px 30px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
<h2 style="color:#1a365d;margin:0 0 20px 0;font-size:24px;">${c.welcome}</h2>
<p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 20px 0;">${c.intro}</p>
<div style="background:#f8f9fa;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #1a365d;">
<h3 style="color:#1a365d;margin:0 0 16px 0;font-size:18px;">${c.listTitle}</h3>
<ul style="color:#555555;margin:0;padding-left:20px;line-height:2;">
${c.items.map(item => `<li style="white-space:nowrap;">${item}</li>`).join("")}
</ul>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${siteUrl}" style="display:inline-block;background:#1a365d;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:600;font-size:16px;">${c.button}</a>
</div>
</div>
<div style="text-align:center;padding:24px;color:#888888;font-size:14px;">
<p style="margin:0;">${c.footer}</p>
</div>
</div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: `${fromName} <noreply@wm26.live>`, to: [email], subject: c.subject, html }),
    });

    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: "Failed", details: data }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
