import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Google News RSS URLs for WM 2026 topics
const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=FIFA+World+Cup+2026&hl=en&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=Fußball+WM+2026&hl=de&gl=DE&ceid=DE:de',
  'https://news.google.com/rss/search?q=Fußball+Weltmeisterschaft+2026&hl=de&gl=DE&ceid=DE:de',
  'https://news.google.com/rss/search?q=World+Cup+2026+soccer&hl=en&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=FIFA+2026+football&hl=en&gl=US&ceid=US:en'
];

// Exclude other sports
const EXCLUDE_KEYWORDS = [
  'darts', 'dart', 'pdc', 'handball', 'ihf', 'basketball', 'nba', 'fiba',
  'eishockey', 'ice hockey', 'nhl', 'iihf', 'volleyball', 'rugby', 'cricket', 'icc',
  'tennis', 'atp', 'wta', 'golf', 'pga', 'ski', 'skiing', 'biathlon',
  'formel 1', 'formula 1', 'f1', 'boxing', 'boxen', 'ufc', 'mma', 'wrestling',
  'snooker', 'billard', 'badminton', 'tischtennis', 'table tennis',
  'schwimmen', 'swimming', 'leichtathletik', 'athletics', 'olympia', 'olympics',
  'baseball', 'mlb', 'american football', 'nfl', 'lacrosse'
];

// Relevant keywords for WM 2026
const RELEVANT_KEYWORDS = [
  'fußball-wm 2026', 'wm 2026', 'wm26', 'fifa world cup 2026', 'fifa world cup 26',
  'world cup 2026', 'wc26', 'fwc26', 'we are 26', 'wir sind 26', 'dreiländer-wm',
  'tri-nation world cup', '48 teams', '104 matches', 'fifa', 'fußball', 'soccer', 'football',
  'usmnt', 'el tri', 'canmnt', 'gruppenphase', 'group stage', 'knockout stage',
  'achtelfinale', 'viertelfinale', 'halbfinale', 'elfmeterschießen', 'penalty shootout',
  'var', 'saot', 'semi-automated offside', 'goal-line technology',
  'auslosung', 'spielplan', 'schedule', 'fixtures', 'kaderbekanntgabe', 'qualifikation', 'qualifiers',
  'tickets', 'ticketverkauf', 'hospitality', 'fan id', 'fanzone', 'public viewing',
  'concacaf', 'uefa', 'conmebol', 'stadionkapazität', 'stadium capacity',
  'bmo field', 'bc place', 'estadio azteca', 'estadio akron', 'estadio bbva',
  'mercedes-benz stadium', 'gillette stadium', 'at&t stadium', 'nrg stadium',
  'geha field', 'arrowhead', 'sofi stadium', 'hard rock stadium',
  'metlife stadium', 'lincoln financial field', 'levi\'s stadium', 'lumen field'
];

// ALL countries/teams to detect (WM 2026 participants + others)
const TEAMS: Record<string, string[]> = {
  'Deutschland': ['deutschland', 'germany', 'german', 'dfb', 'deutsche nationalmannschaft'],
  'Österreich': ['österreich', 'austria', 'austrian', 'öfb', 'rangnick'],
  'Schweiz': ['schweiz', 'switzerland', 'swiss', 'nati'],
  'Frankreich': ['frankreich', 'france', 'french', 'fff', 'les bleus'],
  'Brasilien': ['brasilien', 'brazil', 'brazilian', 'cbf', 'selecao'],
  'Argentinien': ['argentinien', 'argentina', 'argentine', 'afa', 'messi'],
  'Spanien': ['spanien', 'spain', 'spanish', 'rfef', 'la roja'],
  'England': ['england', 'english', 'three lions', 'fa'],
  'Portugal': ['portugal', 'portuguese', 'fpf', 'ronaldo'],
  'Niederlande': ['niederlande', 'netherlands', 'dutch', 'oranje', 'knvb', 'holland'],
  'Italien': ['italien', 'italy', 'italian', 'azzurri', 'figc'],
  'Belgien': ['belgien', 'belgium', 'belgian', 'red devils'],
  'Kroatien': ['kroatien', 'croatia', 'croatian'],
  'USA': ['usa', 'united states', 'usmnt', 'us soccer', 'american soccer'],
  'Mexiko': ['mexiko', 'mexico', 'mexican', 'el tri'],
  'Kanada': ['kanada', 'canada', 'canadian', 'canmnt'],
  'Japan': ['japan', 'japanese', 'jfa'],
  'Südkorea': ['südkorea', 'south korea', 'korean', 'korea republic'],
  'Australien': ['australien', 'australia', 'australian', 'socceroos'],
  'Iran': ['iran', 'iranian', 'team melli'],
  'Saudi-Arabien': ['saudi-arabien', 'saudi arabia', 'saudi', 'saudis'],
  'Katar': ['katar', 'qatar', 'qatari'],
  'Marokko': ['marokko', 'morocco', 'moroccan', 'atlas lions'],
  'Senegal': ['senegal', 'senegalese'],
  'Ghana': ['ghana', 'ghanaian', 'black stars'],
  'Kamerun': ['kamerun', 'cameroon', 'cameroonian'],
  'Nigeria': ['nigeria', 'nigerian', 'super eagles'],
  'Ägypten': ['ägypten', 'egypt', 'egyptian', 'pharaohs'],
  'Tunesien': ['tunesien', 'tunisia', 'tunisian'],
  'Algerien': ['algerien', 'algeria', 'algerian'],
  'Südafrika': ['südafrika', 'south africa', 'bafana bafana'],
  'Uruguay': ['uruguay', 'uruguayan'],
  'Kolumbien': ['kolumbien', 'colombia', 'colombian'],
  'Chile': ['chile', 'chilean'],
  'Ecuador': ['ecuador', 'ecuadorian'],
  'Paraguay': ['paraguay', 'paraguayan'],
  'Peru': ['peru', 'peruvian'],
  'Venezuela': ['venezuela', 'venezuelan'],
  'Polen': ['polen', 'poland', 'polish'],
  'Ukraine': ['ukraine', 'ukrainian'],
  'Türkei': ['türkei', 'turkey', 'turkish'],
  'Dänemark': ['dänemark', 'denmark', 'danish'],
  'Schweden': ['schweden', 'sweden', 'swedish'],
  'Norwegen': ['norwegen', 'norway', 'norwegian'],
  'Serbien': ['serbien', 'serbia', 'serbian'],
  'Schottland': ['schottland', 'scotland', 'scottish'],
  'Wales': ['wales', 'welsh'],
  'Irland': ['irland', 'ireland', 'irish'],
  'Tschechien': ['tschechien', 'czech republic', 'czech'],
  'Slowakei': ['slowakei', 'slovakia', 'slovak'],
  'Ungarn': ['ungarn', 'hungary', 'hungarian'],
  'Rumänien': ['rumänien', 'romania', 'romanian'],
  'Griechenland': ['griechenland', 'greece', 'greek'],
  'Russland': ['russland', 'russia', 'russian'],
  'China': ['china', 'chinese'],
  'Indien': ['indien', 'india', 'indian'],
  'Indonesien': ['indonesien', 'indonesia', 'indonesian']
};

// Parse RSS XML
const parseRSS = (xml: string): any[] => {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const getTag = (tag: string): string => {
      const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
      const m = itemXml.match(regex);
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    
    const title = getTag('title');
    const link = getTag('link');
    const pubDate = getTag('pubDate');
    const source = getTag('source');
    
    if (title && link) {
      items.push({ title, link, pubDate, source, description: '' });
    }
  }
  
  return items;
};

// Normalize title for duplicate detection
const normalizeTitle = (title: string): string => {
  return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ');
};

// Check if news should be EXCLUDED (other sports)
const shouldExclude = (title: string): boolean => {
  const text = title.toLowerCase();
  return EXCLUDE_KEYWORDS.some(k => text.includes(k));
};

// Check if news is relevant to WM 2026 FOOTBALL
const isRelevant = (title: string): boolean => {
  const text = title.toLowerCase();
  return RELEVANT_KEYWORDS.some(k => text.includes(k.toLowerCase()));
};

// Find ALL mentioned teams/countries in title
const findAllTeams = (title: string): string[] => {
  const text = title.toLowerCase();
  const foundTeams: string[] = [];
  
  for (const [teamName, keywords] of Object.entries(TEAMS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        if (!foundTeams.includes(teamName)) {
          foundTeams.push(teamName);
        }
        break;
      }
    }
  }
  
  return foundTeams;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get existing titles to check for duplicates
    const { data: existingNews } = await supabase
      .from('news_items')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(200);
    
    const existingTitles = new Set(
      (existingNews || []).map(n => normalizeTitle(n.title))
    );

    const allNews: any[] = [];
    
    // Fetch all RSS feeds
    for (const feedUrl of RSS_FEEDS) {
      try {
        const response = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
        });
        
        if (response.ok) {
          const xml = await response.text();
          const items = parseRSS(xml);
          allNews.push(...items);
        }
      } catch (e) {
        console.error(`Error fetching RSS:`, e);
      }
    }

    // Filter: exclude other sports, check relevance, deduplicate
    const seenTitles = new Set<string>();
    const relevantNews = allNews.filter(item => {
      if (shouldExclude(item.title)) return false;
      if (!isRelevant(item.title)) return false;
      
      const normalized = normalizeTitle(item.title);
      if (seenTitles.has(normalized) || existingTitles.has(normalized)) {
        return false;
      }
      seenTitles.add(normalized);
      return true;
    });

    let insertedCount = 0;

    for (const item of relevantNews) {
      // Find ALL teams mentioned in the article
      const teams = findAllTeams(item.title);
      const relatedTeam = teams.length > 0 ? teams.join(', ') : null;

      const { error } = await supabase.from('news_items').upsert({
        title: item.title,
        description: item.description || null,
        url: item.link,
        source: item.source || 'Google News',
        image_url: null,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        category: relatedTeam ? 'team' : 'tournament',
        related_team: relatedTeam
      }, { onConflict: 'url' });

      if (!error) insertedCount++;
    }

    // Clean old news (older than 14 days)
    await supabase
      .from('news_items')
      .delete()
      .lt('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({ 
        success: true, 
        fetched: allNews.length, 
        relevant: relevantNews.length,
        inserted: insertedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
