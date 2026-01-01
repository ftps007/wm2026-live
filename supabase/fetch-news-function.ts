// supabase/functions/fetch-news/index.ts
// Deploy: supabase functions deploy fetch-news
// Schedule: Set up in Supabase Dashboard > Database > Extensions > pg_cron

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WM 2026 Teams for search queries
const WM_TEAMS = [
  'Deutschland Nationalmannschaft', 'France football', 'Brazil World Cup',
  'Argentina Messi', 'Spain national team', 'England football',
  'Portugal Ronaldo', 'Netherlands Oranje', 'Belgium Red Devils',
  'Italy Azzurri', 'Croatia Modric', 'USA soccer',
  'Mexico futbol', 'Japan football', 'Morocco Atlas Lions'
];

const SEARCH_QUERIES = [
  'FIFA World Cup 2026',
  'WM 2026',
  'World Cup qualifying',
  'Fußball Nationalmannschaft',
  ...WM_TEAMS
];

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // News API key (get free key from newsdata.io or gnews.io)
    const newsApiKey = Deno.env.get('NEWS_API_KEY')
    
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured')
    }

    const allNews: any[] = []
    
    // Fetch from NewsData.io (free tier: 200 req/day)
    // Alternative: GNews.io, TheNewsAPI
    for (const query of SEARCH_QUERIES.slice(0, 5)) { // Limit queries to save API calls
      try {
        const response = await fetch(
          `https://newsdata.io/api/1/news?apikey=${newsApiKey}&q=${encodeURIComponent(query)}&language=de,en&category=sports`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.results) {
            allNews.push(...data.results)
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        console.error(`Error fetching news for "${query}":`, e)
      }
    }

    // Deduplicate by URL
    const uniqueNews = allNews.filter((item, index, self) =>
      index === self.findIndex(t => t.link === item.link)
    )

    // Insert into database
    let insertedCount = 0
    for (const item of uniqueNews) {
      // Detect related team
      let relatedTeam = null
      const titleLower = (item.title || '').toLowerCase()
      const teams = ['deutschland', 'france', 'brazil', 'argentina', 'spain', 'england', 
                     'portugal', 'netherlands', 'belgium', 'italy', 'croatia', 'usa', 
                     'mexico', 'japan', 'morocco']
      for (const team of teams) {
        if (titleLower.includes(team)) {
          relatedTeam = team.charAt(0).toUpperCase() + team.slice(1)
          break
        }
      }

      const { error } = await supabase.from('news_items').upsert({
        title: item.title,
        description: item.description,
        url: item.link,
        source: item.source_id || item.source_name,
        image_url: item.image_url,
        published_at: item.pubDate,
        category: relatedTeam ? 'team' : 'tournament',
        related_team: relatedTeam
      }, {
        onConflict: 'url'
      })

      if (!error) insertedCount++
    }

    // Clean old news
    await supabase.rpc('clean_old_news')

    return new Response(
      JSON.stringify({ 
        success: true, 
        fetched: uniqueNews.length,
        inserted: insertedCount 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

/* 
=== SETUP INSTRUCTIONS ===

1. Create Edge Function:
   supabase functions new fetch-news
   
2. Copy this code to supabase/functions/fetch-news/index.ts

3. Set secrets:
   supabase secrets set NEWS_API_KEY=your_newsdata_io_key

4. Deploy:
   supabase functions deploy fetch-news

5. Set up Cron Job in Supabase Dashboard:
   - Go to Database > Extensions > Enable pg_cron
   - Run SQL:
   
   SELECT cron.schedule(
     'fetch-news-every-15-min',
     '*/15 * * * *',
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/fetch-news',
       headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
     );
     $$
   );

=== FREE NEWS API OPTIONS ===

1. NewsData.io (RECOMMENDED)
   - 200 requests/day free
   - Sign up: https://newsdata.io/register
   
2. GNews.io
   - 100 requests/day free
   - Sign up: https://gnews.io/register
   
3. TheNewsAPI.com
   - 100 requests/day free
   - Sign up: https://www.thenewsapi.com/

*/
