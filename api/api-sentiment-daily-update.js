import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import Sentiment from 'vader-sentiment';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// RSS Parser
const parser = new Parser({
  timeout: 5000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WM2026Bot/1.0)' }
});

// ==================== FOOTBALL FILTER ====================

// MUST contain at least ONE of these (football-specific)
const FOOTBALL_KEYWORDS = [
  // Football terms
  'soccer', 'fuÃŸball', 'fussball', 'football', 'futbol', 'fÃºtbol', 'futebol', 'calcio', 'voetbal',
  // FIFA specific
  'fifa world cup', 'fifa wm', 'fifa 2026', 'fifa worldcup',
  // Tournament names
  'weltmeisterschaft', 'copa del mundo', 'coupe du monde', 'copa do mundo', 'mondiali',
  // Teams & Confederations
  'nationalmannschaft', 'national team', 'Ã©quipe nationale', 'seleÃ§Ã£o',
  
  // ==================== CONTINENTAL FEDERATIONS ====================
  'uefa', 'conmebol', 'concacaf', 'afc', 'caf', 'ofc',
  
  // ==================== EUROPEAN FEDERATIONS (UEFA) ====================
  'dfb', 'Ã¶fb', 'oefb', 'sfv', 'asf', 'knvb', 'fff', 'figc', 'rfef', 'fpf',
  'the fa', 'england fa', 'kbvb', 'urbsfa', 'hns', 'dbu', 'pzpn', 'fss', 'uaf', 'sfa', 'nff',
  
  // ==================== SOUTH AMERICAN FEDERATIONS (CONMEBOL) ====================
  'afa', 'cbf', 'auf', 'fcf', 'fef', 'apf',
  
  // ==================== NORTH/CENTRAL AMERICAN FEDERATIONS (CONCACAF) ====================
  'ussf', 'us soccer', 'usmnt', 'fmf', 'canada soccer', 'fedefutbol', 'fepafut', 'fhf',
  
  // ==================== ASIAN FEDERATIONS (AFC) ====================
  'jfa', 'kfa', 'ffa', 'football australia', 'saff', 'ffiri', 'qfa', 'uff', 'jfa jordan', 'pssi',
  
  // ==================== AFRICAN FEDERATIONS (CAF) ====================
  'frmf', 'fsf', 'efa', 'nff nigeria', 'faf', 'fecafoot', 'fif', 'safa', 'gfa', 'ftf',
  
  // ==================== OCEANIAN FEDERATIONS (OFC) ====================
  'nzf', 'new zealand football',
  
  // ==================== FAMOUS PLAYERS (WM 2026) ====================
  'messi', 'mbappÃ©', 'mbappe', 'haaland', 'bellingham', 'vinicius', 'neymar',
  'mÃ¼ller', 'muller', 'kane', 'ronaldo', 'salah', 'de bruyne', 'kroos',
  'gÃ¼ndogan', 'gundogan', 'sanÃ©', 'sane', 'havertz', 'musiala', 'wirtz',
  
  // ==================== FOOTBALL-SPECIFIC TERMS ====================
  'striker', 'goalkeeper', 'midfielder', 'defender', 'stÃ¼rmer', 'torwart',
  'goal', 'tor ', 'gol ', 'match', 'spiel', 'partido',
  'stadion', 'stadium', 'estadio', 'stade',
  'qualification', 'qualifikation', 'qualifier',
  
  // ==================== WM 2026 HOST VENUES ====================
  'metlife stadium', 'sofi stadium', 'hard rock stadium', 'azteca', 'at&t stadium',
  'nrg stadium', 'arrowhead stadium', 'gillette stadium', 'mercedes-benz stadium',
  'lincoln financial field', 'lumen field', 'bc place', 'bmo field',
];

// MUST NOT contain any of these (other sports)
const EXCLUDE_KEYWORDS = [
  'cricket', 'icc cricket', 'test match', 'ashes', 'ipl', 't20', 'bcci', 'wicket', 'bowler', 'batsman',
  'rugby', 'rugby world cup', 'six nations', 'all blacks', 'springboks', 'wallabies', 'try scorer',
  'hockey', 'ice hockey', 'nhl', 'iihf', 'eishockey', 'field hockey',
  'nfl', 'super bowl', 'american football', 'touchdown', 'quarterback',
  'basketball', 'nba', 'fiba', 'euroleague',
  'baseball', 'mlb', 'world series',
  'tennis', 'wimbledon', 'us open tennis', 'australian open tennis', 'french open tennis', 'atp', 'wta',
  'golf', 'pga', 'masters golf', 'ryder cup',
  'formula 1', 'f1 ', 'formel 1', 'motogp', 'nascar', 'indycar',
  'boxing', 'boxen', 'ufc', 'mma', 'wrestling', 'wwe',
  'darts', 'pdc darts',
  'tour de france', 'giro', 'cycling', 'radsport',
  'skiing', 'ski ', 'biathlon', 'bobsled', 'figure skating', 'curling',
  'olympic games', 'olympische spiele', 'olympics 2028', 'olympics 2032',
  'esports', 'e-sports', 'gaming league',
  'volleyball', 'handball', 'polo', 'lacrosse',
];

// Check if article is football WM 2026 related
function isFootballWM2026(article) {
  const text = `${article.title} ${article.description}`.toLowerCase();
  
  // Step 1: Must contain "2026" or "26" in WM context
  const has2026 = text.includes('2026') || 
                  text.includes('wm 26') || 
                  text.includes('wc 26') ||
                  text.includes('world cup 26');
  
  if (!has2026) return false;
  
  // Step 2: Must contain at least one football keyword
  const hasFootballKeyword = FOOTBALL_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  if (!hasFootballKeyword) return false;
  
  // Step 3: Must NOT contain any excluded sport
  const hasExcludedSport = EXCLUDE_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  if (hasExcludedSport) return false;
  
  return true;
}

// ==================== ALL FREE SOURCES ====================

// Google News RSS Feeds (12 Sprachen/Regionen)
const GOOGLE_NEWS_FEEDS = [
  { url: 'https://news.google.com/rss/search?q="FIFA+World+Cup+2026"+soccer&hl=en&gl=US', lang: 'en', region: 'US' },
  { url: 'https://news.google.com/rss/search?q="World+Cup+2026"+football+soccer&hl=en&gl=US', lang: 'en', region: 'US' },
  { url: 'https://news.google.com/rss/search?q="World+Cup+2026"+FIFA&hl=en&gl=GB', lang: 'en', region: 'UK' },
  { url: 'https://news.google.com/rss/search?q="FuÃŸball+WM+2026"&hl=de&gl=DE', lang: 'de', region: 'DE' },
  { url: 'https://news.google.com/rss/search?q="FIFA+WM+2026"&hl=de&gl=DE', lang: 'de', region: 'DE' },
  { url: 'https://news.google.com/rss/search?q="Weltmeisterschaft+2026"+FuÃŸball&hl=de&gl=DE', lang: 'de', region: 'DE' },
  { url: 'https://news.google.com/rss/search?q="Mundial+2026"+fÃºtbol&hl=es&gl=ES', lang: 'es', region: 'ES' },
  { url: 'https://news.google.com/rss/search?q="Copa+del+Mundo+2026"+FIFA&hl=es&gl=MX', lang: 'es', region: 'MX' },
  { url: 'https://news.google.com/rss/search?q="Coupe+du+Monde+2026"+football&hl=fr&gl=FR', lang: 'fr', region: 'FR' },
  { url: 'https://news.google.com/rss/search?q="Mondiali+2026"+calcio&hl=it&gl=IT', lang: 'it', region: 'IT' },
  { url: 'https://news.google.com/rss/search?q="Copa+do+Mundo+2026"+futebol&hl=pt-BR&gl=BR', lang: 'pt', region: 'BR' },
  { url: 'https://news.google.com/rss/search?q="WK+2026"+voetbal&hl=nl&gl=NL', lang: 'nl', region: 'NL' },
];

// Sport RSS Feeds (football-specific)
const SPORT_RSS_FEEDS = [
  // German
  { url: 'https://rss.kicker.de/news/aktuell', name: 'Kicker', lang: 'de' },
  { url: 'https://www.sport1.de/rss/fussball', name: 'Sport1', lang: 'de' },
  { url: 'https://www.sportschau.de/index~rss.xml', name: 'Sportschau', lang: 'de' },
  { url: 'https://www.spox.com/pub/rss/fussball.xml', name: 'Spox', lang: 'de' },
  { url: 'https://www.transfermarkt.de/rss/news', name: 'Transfermarkt', lang: 'de' },
  { url: 'https://11freunde.de/feed', name: '11Freunde', lang: 'de' },
  { url: 'https://www.ran.de/rss/fussball.xml', name: 'ran', lang: 'de' },
  // English
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', name: 'BBC Football', lang: 'en' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', name: 'ESPN FC', lang: 'en' },
  { url: 'https://www.theguardian.com/football/rss', name: 'The Guardian', lang: 'en' },
  { url: 'https://www.skysports.com/rss/12040', name: 'Sky Sports', lang: 'en' },
  { url: 'https://www.goal.com/feeds/en/news', name: 'Goal.com', lang: 'en' },
  { url: 'https://www.fourfourtwo.com/feeds.xml', name: 'FourFourTwo', lang: 'en' },
  { url: 'https://www.90min.com/posts.rss', name: '90min', lang: 'en' },
];

// ==================== FETCH FUNCTIONS ====================

// Fetch single RSS feed with error handling
async function fetchRSSFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return (feed.items || []).map(item => ({
      title: item.title || '',
      description: item.contentSnippet || item.description || '',
      source: feedConfig.name || feedConfig.region || 'RSS',
      sourceType: 'news',
      lang: feedConfig.lang,
      pubDate: item.pubDate
    }));
  } catch (error) {
    console.warn(`RSS feed failed: ${feedConfig.url}`, error.message);
    return [];
  }
}

// Fetch NewsAPI
async function fetchNewsAPI() {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];
  
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=("FIFA World Cup 2026" OR "FuÃŸball WM 2026" OR "soccer world cup 2026")&language=en&sortBy=publishedAt&pageSize=100`,
      { headers: { 'X-Api-Key': apiKey } }
    );
    const data = await response.json();
    
    if (data.status !== 'ok') return [];
    
    return (data.articles || []).map(article => ({
      title: article.title || '',
      description: article.description || '',
      source: article.source?.name || 'NewsAPI',
      sourceType: 'news',
      lang: 'en',
      pubDate: article.publishedAt
    }));
  } catch (error) {
    console.warn('NewsAPI failed:', error.message);
    return [];
  }
}

// Fetch GNews
async function fetchGNews() {
  const apiKey = process.env.GNEWS_KEY;
  if (!apiKey) return [];
  
  try {
    const response = await fetch(
      `https://gnews.io/api/v4/search?q="FIFA World Cup 2026" soccer&lang=en&max=100&token=${apiKey}`
    );
    const data = await response.json();
    
    return (data.articles || []).map(article => ({
      title: article.title || '',
      description: article.description || '',
      source: article.source?.name || 'GNews',
      sourceType: 'news',
      lang: 'en',
      pubDate: article.publishedAt
    }));
  } catch (error) {
    console.warn('GNews failed:', error.message);
    return [];
  }
}

// Fetch Currents API
async function fetchCurrents() {
  const apiKey = process.env.CURRENTS_KEY;
  if (!apiKey) return [];
  
  try {
    const response = await fetch(
      `https://api.currentsapi.services/v1/search?keywords=FIFA World Cup 2026 soccer football&language=en&apiKey=${apiKey}`
    );
    const data = await response.json();
    
    return (data.news || []).map(article => ({
      title: article.title || '',
      description: article.description || '',
      source: article.author || 'Currents',
      sourceType: 'news',
      lang: 'en',
      pubDate: article.published
    }));
  } catch (error) {
    console.warn('Currents API failed:', error.message);
    return [];
  }
}

// Fetch Reddit r/soccer
async function fetchReddit() {
  try {
    const response = await fetch(
      'https://www.reddit.com/r/soccer/search.json?q=world+cup+2026+OR+WM+2026&sort=new&limit=50&restrict_sr=on',
      { headers: { 'User-Agent': 'WM2026Bot/1.0' } }
    );
    const data = await response.json();
    
    return (data.data?.children || []).map(post => ({
      title: post.data?.title || '',
      description: post.data?.selftext || '',
      source: 'Reddit r/soccer',
      sourceType: 'social',
      lang: 'en',
      pubDate: new Date(post.data?.created_utc * 1000).toISOString()
    }));
  } catch (error) {
    console.warn('Reddit failed:', error.message);
    return [];
  }
}

// ==================== NEW: MASTODON ====================
// âœ… VollstÃ¤ndig offen - Dezentrale Instanzen
async function fetchMastodon() {
  const instances = [
    'mastodon.social',
    'mastodon.online', 
    'mstdn.social',
    'fosstodon.org',
    'techhub.social'
  ];
  
  const hashtags = ['worldcup2026', 'wm2026', 'fifa2026', 'fifaworldcup', 'soccer'];
  const allPosts = [];
  
  for (const instance of instances) {
    for (const tag of hashtags) {
      try {
        const response = await fetch(
          `https://${instance}/api/v1/timelines/tag/${tag}?limit=40`,
          { 
            headers: { 'User-Agent': 'WM2026Bot/1.0' },
            timeout: 5000 
          }
        );
        
        if (!response.ok) continue;
        
        const posts = await response.json();
        
        for (const post of posts) {
          // Strip HTML tags from content
          const content = (post.content || '').replace(/<[^>]*>/g, '');
          
          allPosts.push({
            title: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            description: content,
            source: `Mastodon (${instance})`,
            sourceType: 'social',
            lang: post.language || 'en',
            pubDate: post.created_at
          });
        }
      } catch (error) {
        // Silently skip failed instances
        continue;
      }
    }
  }
  
  console.log(`ðŸ¦£ Mastodon: ${allPosts.length} posts fetched`);
  return allPosts;
}

// ==================== NEW: BLUESKY ====================
// âœ… Offizielle API - AT Protocol
async function fetchBluesky() {
  const searchQueries = [
    'World Cup 2026',
    'WM 2026',
    'FIFA 2026',
    'soccer 2026',
    'football 2026'
  ];
  
  const allPosts = [];
  
  for (const query of searchQueries) {
    try {
      const response = await fetch(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=50`,
        { 
          headers: { 'User-Agent': 'WM2026Bot/1.0' },
          timeout: 5000 
        }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      for (const item of (data.posts || [])) {
        const text = item.record?.text || '';
        
        allPosts.push({
          title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          description: text,
          source: 'Bluesky',
          sourceType: 'social',
          lang: item.record?.langs?.[0] || 'en',
          pubDate: item.record?.createdAt || item.indexedAt
        });
      }
    } catch (error) {
      console.warn(`Bluesky search failed for "${query}":`, error.message);
      continue;
    }
  }
  
  console.log(`ðŸ¦‹ Bluesky: ${allPosts.length} posts fetched`);
  return allPosts;
}

// ==================== NEW: THREADS (Meta) ====================
// âš ï¸ EingeschrÃ¤nkt - Ãœber Ã¶ffentliche Profile/Web scraping
async function fetchThreads() {
  // Threads hat keine vollstÃ¤ndige Ã¶ffentliche API
  // Wir kÃ¶nnen die Ã¶ffentliche Graph API fÃ¼r Business-Accounts nutzen
  // oder populÃ¤re FuÃŸball-Hashtags Ã¼ber alternative Methoden abrufen
  
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  
  // Wenn kein Token verfÃ¼gbar, versuche Ã¶ffentliche Daten
  if (!accessToken) {
    console.log('ðŸ§µ Threads: No access token, skipping (limited API)');
    return [];
  }
  
  try {
    // Meta's Threads API (fÃ¼r authentifizierte Requests)
    // Dokumentation: https://developers.facebook.com/docs/threads
    const response = await fetch(
      `https://graph.threads.net/v1.0/me/threads?fields=id,text,timestamp&access_token=${accessToken}`,
      { timeout: 5000 }
    );
    
    if (!response.ok) {
      console.warn('Threads API request failed');
      return [];
    }
    
    const data = await response.json();
    
    const posts = (data.data || []).map(post => ({
      title: (post.text || '').substring(0, 100),
      description: post.text || '',
      source: 'Threads',
      sourceType: 'social',
      lang: 'en', // Threads API doesn't provide language
      pubDate: post.timestamp
    }));
    
    console.log(`ðŸ§µ Threads: ${posts.length} posts fetched`);
    return posts;
    
  } catch (error) {
    console.warn('Threads failed:', error.message);
    return [];
  }
}

// ==================== PROCESSING ====================

// Deduplicate articles by normalized title
function deduplicateArticles(articles) {
  const seen = new Set();
  
  return articles.filter(article => {
    if (!article.title) return false;
    
    // Normalize: lowercase, remove special chars, first 50 chars
    const normalized = article.title
      .toLowerCase()
      .replace(/[^a-z0-9Ã¤Ã¶Ã¼ÃŸ]/g, '')
      .substring(0, 50);
    
    if (normalized.length < 10) return false;
    if (seen.has(normalized)) return false;
    
    seen.add(normalized);
    return true;
  });
}

// Analyze sentiment with VADER
function analyzeSentiment(articles) {
  const scores = articles.map(article => {
    const text = `${article.title} ${article.description}`;
    const result = Sentiment.SentimentIntensityAnalyzer.polarity_scores(text);
    return result.compound;
  });
  
  if (scores.length === 0) return 50;
  
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round((avgScore + 1) * 50);
}

// Analyze sentiment separately for news vs social
function analyzeSentimentByType(articles) {
  const newsArticles = articles.filter(a => a.sourceType === 'news');
  const socialArticles = articles.filter(a => a.sourceType === 'social');
  
  return {
    news: {
      score: analyzeSentiment(newsArticles),
      count: newsArticles.length
    },
    social: {
      score: analyzeSentiment(socialArticles),
      count: socialArticles.length
    }
  };
}

// Get label for score
function getLabel(score) {
  if (score >= 70) return { de: 'Sehr Positiv', en: 'Very Positive', pl: 'Bardzo Pozytywny' };
  if (score >= 55) return { de: 'Positiv', en: 'Positive', pl: 'Pozytywny' };
  if (score >= 45) return { de: 'Neutral', en: 'Neutral', pl: 'Neutralny' };
  if (score >= 30) return { de: 'Negativ', en: 'Negative', pl: 'Negatywny' };
  return { de: 'Sehr Negativ', en: 'Very Negative', pl: 'Bardzo Negatywny' };
}

// Calculate trend vs yesterday
async function calculateTrend(currentScore) {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('wm2026_sentiment')
      .select('score')
      .eq('date', yesterdayStr)
      .single();
    
    if (!data) return 'stable';
    
    const diff = currentScore - data.score;
    if (diff > 2) return 'up';
    if (diff < -2) return 'down';
    return 'stable';
  } catch {
    return 'stable';
  }
}

// Count unique languages
function countLanguages(articles) {
  const languages = new Set(articles.map(a => a.lang).filter(Boolean));
  return languages.size;
}

// Count sentiment distribution
function countSentimentDistribution(articles) {
  let positive = 0, neutral = 0, negative = 0;
  
  for (const article of articles) {
    const text = `${article.title} ${article.description}`;
    const result = Sentiment.SentimentIntensityAnalyzer.polarity_scores(text);
    const compound = result.compound;
    
    if (compound >= 0.05) positive++;
    else if (compound <= -0.05) negative++;
    else neutral++;
  }
  
  return { positive, neutral, negative };
}

// ==================== MAIN HANDLER ====================

export default async function handler(req, res) {
  console.log('ðŸš€ Starting sentiment analysis...');
  const startTime = Date.now();
  
  try {
    // Fetch all sources in parallel
    console.log('ðŸ“¡ Fetching all sources...');
    
    const [
      googleNewsResults,
      sportRSSResults,
      newsAPIResults,
      gNewsResults,
      currentsResults,
      redditResults,
      mastodonResults,
      blueskyResults,
      threadsResults
    ] = await Promise.all([
      // Google News (12 feeds)
      Promise.all(GOOGLE_NEWS_FEEDS.map(fetchRSSFeed)),
      // Sport RSS feeds
      Promise.all(SPORT_RSS_FEEDS.map(fetchRSSFeed)),
      // News APIs
      fetchNewsAPI(),
      fetchGNews(),
      fetchCurrents(),
      // Social Media
      fetchReddit(),
      fetchMastodon(),    // NEW
      fetchBluesky(),     // NEW
      fetchThreads()      // NEW
    ]);
    
    // Flatten results
    const allArticles = [
      ...googleNewsResults.flat(),
      ...sportRSSResults.flat(),
      ...newsAPIResults,
      ...gNewsResults,
      ...currentsResults,
      ...redditResults,
      ...mastodonResults,
      ...blueskyResults,
      ...threadsResults
    ];
    
    console.log(`ðŸ“° Total articles fetched: ${allArticles.length}`);
    
    // STRICT FILTER: Only football WM 2026 content
    const footballArticles = allArticles.filter(isFootballWM2026);
    console.log(`âš½ After football filter: ${footballArticles.length}`);
    
    // Deduplicate
    const uniqueArticles = deduplicateArticles(footballArticles);
    console.log(`ðŸ” After deduplication: ${uniqueArticles.length}`);
    
    // Analyze sentiment
    const score = analyzeSentiment(uniqueArticles);
    const label = getLabel(score);
    const trend = await calculateTrend(score);
    const byType = analyzeSentimentByType(uniqueArticles);
    const distribution = countSentimentDistribution(uniqueArticles);
    const languageCount = countLanguages(uniqueArticles);
    
    console.log(`ðŸ“Š Score: ${score}, Label: ${label.en}, Trend: ${trend}`);
    console.log(`ðŸ“° News: ${byType.news.score} (${byType.news.count}) | ðŸ’¬ Social: ${byType.social.score} (${byType.social.count})`);
    
    // Save to database
    const today = new Date().toISOString().split('T')[0];
    
    const { error: upsertError } = await supabase
      .from('wm2026_sentiment')
      .upsert({
        date: today,
        score: score,
        label_de: label.de,
        label_en: label.en,
        trend: trend,
        articles_total: uniqueArticles.length,
        articles_positive: distribution.positive,
        articles_neutral: distribution.neutral,
        articles_negative: distribution.negative,
        countries_count: 25, // Estimated based on feeds
        languages_count: languageCount,
        news_score: byType.news.score,
        news_count: byType.news.count,
        social_score: byType.social.score,
        social_count: byType.social.count,
        model_used: 'vader-sentiment',
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' });
    
    if (upsertError) throw upsertError;
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`âœ… Completed in ${duration}s`);
    
    // Source breakdown for logging
    const breakdown = {
      google_news: googleNewsResults.flat().filter(isFootballWM2026).length,
      sport_rss: sportRSSResults.flat().filter(isFootballWM2026).length,
      newsapi: newsAPIResults.filter(isFootballWM2026).length,
      gnews: gNewsResults.filter(isFootballWM2026).length,
      currents: currentsResults.filter(isFootballWM2026).length,
      reddit: redditResults.filter(isFootballWM2026).length,
      mastodon: mastodonResults.filter(isFootballWM2026).length,
      bluesky: blueskyResults.filter(isFootballWM2026).length,
      threads: threadsResults.filter(isFootballWM2026).length
    };
    
    return res.status(200).json({
      success: true,
      date: today,
      score,
      label,
      trend,
      news_vs_social: byType,
      distribution,
      articles_analyzed: uniqueArticles.length,
      articles_fetched: allArticles.length,
      articles_filtered_out: allArticles.length - footballArticles.length,
      languages: languageCount,
      sources: breakdown,
      duration_seconds: parseFloat(duration)
    });
    
  } catch (error) {
    console.error('âŒ Sentiment analysis failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
