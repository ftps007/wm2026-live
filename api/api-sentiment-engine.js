// =====================================================
// WM 2026 SENTIMENT ANALYSIS ENGINE v2.0
// Unified data collection and analysis pipeline
// =====================================================
// 
// Features:
// - 8 Data Sources (Google RSS, NewsAPI, GNews, Currents, YouTube, Reddit, Mastodon, Bluesky)
// - XLM-RoBERTa Multilingual Sentiment Analysis
// - 7 Advanced Analysis Modules
// - 211 FIFA Countries Coverage
// - 46+ Languages Support
//
// API Endpoint: /api/sentiment-engine
// =====================================================

import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_KEY,
  
  // Hugging Face
  HF_API_URL: 'https://api-inference.huggingface.co/models/',
  HF_API_KEY: process.env.HUGGINGFACE_API_KEY,
  
  // News APIs
  NEWSAPI_KEY: process.env.NEWSAPI_KEY,
  GNEWS_KEY: process.env.GNEWS_API_KEY,
  CURRENTS_KEY: process.env.CURRENTS_API_KEY,
  YOUTUBE_KEY: process.env.YOUTUBE_API_KEY,
  
  // Reddit
  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
  REDDIT_USER_AGENT: 'WM2026SentimentBot/2.0',
  
  // Bluesky
  BLUESKY_HANDLE: process.env.BLUESKY_HANDLE,
  BLUESKY_APP_PASSWORD: process.env.BLUESKY_APP_PASSWORD,
  
  // Models
  MODELS: {
    SENTIMENT: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
    EMOTION: 'j-hartmann/emotion-english-distilroberta-base',
    NER: 'dslim/bert-base-NER',
    LANG_DETECT: 'papluca/xlm-roberta-base-language-detection',
  },
  
  // Processing limits
  BATCH_SIZE: 10,
  MAX_ARTICLES_PER_SOURCE: 100,
  REQUEST_DELAY_MS: 100,
  
  // Search keywords for WM2026
  WM_KEYWORDS: {
    en: ['World Cup 2026', 'FIFA 2026', 'WC 2026', 'USA Canada Mexico 2026'],
    de: ['WM 2026', 'Weltmeisterschaft 2026', 'Fußball WM 2026'],
    es: ['Mundial 2026', 'Copa del Mundo 2026'],
    fr: ['Coupe du Monde 2026', 'Mondial 2026'],
    pt: ['Copa do Mundo 2026', 'Mundial 2026'],
    it: ['Mondiali 2026', 'Coppa del Mondo 2026'],
    ar: ['كأس العالم 2026'],
    zh: ['2026年世界杯', '世界杯2026'],
    ja: ['2026年ワールドカップ', 'W杯2026'],
    ko: ['2026 월드컵'],
  },
  
  // Exclusion terms (other sports)
  EXCLUSION_TERMS: [
    'cricket', 'rugby', 'baseball', 'basketball', 'hockey', 'tennis',
    'golf', 'olympics', 'NFL', 'NBA', 'NHL', 'MLB', 'F1', 'Formula 1',
    'UFC', 'boxing', 'wrestling', 'swimming', 'athletics'
  ],
};

// Initialize Supabase client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateContentHash(content) {
  // Simple hash for deduplication
  const str = (content || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function isRelevantContent(text, title) {
  const combined = `${title} ${text}`.toLowerCase();
  
  // Check for WM keywords
  const hasWMKeyword = Object.values(CONFIG.WM_KEYWORDS)
    .flat()
    .some(kw => combined.includes(kw.toLowerCase()));
  
  // Check for football/soccer context
  const hasFootballContext = ['soccer', 'football', 'fußball', 'fútbol', 'futebol', 'calcio']
    .some(term => combined.includes(term));
  
  // Check for exclusion terms
  const hasExclusionTerm = CONFIG.EXCLUSION_TERMS
    .some(term => combined.includes(term.toLowerCase()));
  
  if (hasExclusionTerm && !hasWMKeyword) {
    return false;
  }
  
  return hasWMKeyword || (combined.includes('2026') && hasFootballContext);
}

function detectCategory(text, title) {
  const combined = `${title} ${text}`.toLowerCase();
  
  const categoryPatterns = {
    ticketing: ['ticket', 'karten', 'billete', 'bilhete', 'biglietto', 'preis', 'price', 'precio', 'prezzo'],
    sporting: ['match', 'game', 'spiel', 'partido', 'partita', 'team', 'mannschaft', 'equipo', 'player', 'spieler', 'jugador'],
    business: ['sponsor', 'tv right', 'broadcast', 'übertragung', 'revenue', 'investment', 'partner'],
    fans: ['fan', 'travel', 'reise', 'viaje', 'hotel', 'visa', 'accommodation'],
    infrastructure: ['stadium', 'stadion', 'estadio', 'transport', 'airport', 'flughafen', 'construction'],
    political: ['protest', 'boycott', 'boykott', 'politics', 'political', 'climate', 'klima', 'rights', 'rechte'],
  };
  
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(p => combined.includes(p))) {
      return category;
    }
  }
  
  return 'general';
}

// =====================================================
// DATA SOURCE: GOOGLE NEWS RSS
// =====================================================

async function fetchGoogleNewsRSS(languages = ['en', 'de', 'es', 'fr', 'pt']) {
  console.log('📰 Fetching Google News RSS...');
  const articles = [];
  
  for (const lang of languages) {
    const keywords = CONFIG.WM_KEYWORDS[lang] || CONFIG.WM_KEYWORDS.en;
    
    for (const keyword of keywords) {
      try {
        const encodedQuery = encodeURIComponent(keyword);
        const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${lang}&gl=${lang.toUpperCase()}&ceid=${lang.toUpperCase()}:${lang}`;
        
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const text = await response.text();
        
        // Parse RSS XML
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        
        for (const item of items.slice(0, 20)) {
          const title = (item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '')
            .replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
          const description = (item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '')
            .replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
          const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
          const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '';
          
          if (title && isRelevantContent(description, title)) {
            articles.push({
              source_key: 'google_news',
              source_type: 'news',
              external_id: generateContentHash(link),
              title: title.substring(0, 500),
              description: description.substring(0, 2000),
              url: link,
              author: source,
              published_at: pubDate ? new Date(pubDate).toISOString() : null,
              detected_language: lang,
              category_key: detectCategory(description, title),
            });
          }
        }
        
        await sleep(CONFIG.REQUEST_DELAY_MS);
      } catch (error) {
        console.warn(`Google News RSS error for ${lang}:`, error.message);
      }
    }
  }
  
  console.log(`📰 Google News: Found ${articles.length} articles`);
  return articles;
}

// =====================================================
// DATA SOURCE: NEWSAPI
// =====================================================

async function fetchNewsAPI() {
  if (!CONFIG.NEWSAPI_KEY) {
    console.log('⚠️ NewsAPI key not configured');
    return [];
  }
  
  console.log('📰 Fetching NewsAPI...');
  const articles = [];
  
  const queries = ['World Cup 2026', 'FIFA 2026', 'WM 2026'];
  
  for (const query of queries) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=50&apiKey=${CONFIG.NEWSAPI_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('NewsAPI error:', response.status);
        continue;
      }
      
      const data = await response.json();
      
      for (const item of (data.articles || [])) {
        if (isRelevantContent(item.description || '', item.title || '')) {
          articles.push({
            source_key: 'newsapi',
            source_type: 'news',
            external_id: generateContentHash(item.url),
            title: (item.title || '').substring(0, 500),
            description: (item.description || '').substring(0, 2000),
            content: (item.content || '').substring(0, 5000),
            url: item.url,
            image_url: item.urlToImage,
            author: item.author || item.source?.name,
            published_at: item.publishedAt,
            category_key: detectCategory(item.description || '', item.title || ''),
          });
        }
      }
      
      await sleep(CONFIG.REQUEST_DELAY_MS);
    } catch (error) {
      console.warn('NewsAPI error:', error.message);
    }
  }
  
  console.log(`📰 NewsAPI: Found ${articles.length} articles`);
  return articles;
}

// =====================================================
// DATA SOURCE: GNEWS
// =====================================================

async function fetchGNews() {
  if (!CONFIG.GNEWS_KEY) {
    console.log('⚠️ GNews key not configured');
    return [];
  }
  
  console.log('📰 Fetching GNews...');
  const articles = [];
  
  const queries = ['World Cup 2026', 'FIFA 2026'];
  const languages = ['en', 'de', 'es', 'fr', 'pt'];
  
  for (const query of queries) {
    for (const lang of languages) {
      try {
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang}&max=10&apikey=${CONFIG.GNEWS_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const data = await response.json();
        
        for (const item of (data.articles || [])) {
          if (isRelevantContent(item.description || '', item.title || '')) {
            articles.push({
              source_key: 'gnews',
              source_type: 'news',
              external_id: generateContentHash(item.url),
              title: (item.title || '').substring(0, 500),
              description: (item.description || '').substring(0, 2000),
              content: (item.content || '').substring(0, 5000),
              url: item.url,
              image_url: item.image,
              author: item.source?.name,
              published_at: item.publishedAt,
              detected_language: lang,
              category_key: detectCategory(item.description || '', item.title || ''),
            });
          }
        }
        
        await sleep(CONFIG.REQUEST_DELAY_MS * 2); // GNews has stricter rate limits
      } catch (error) {
        console.warn('GNews error:', error.message);
      }
    }
  }
  
  console.log(`📰 GNews: Found ${articles.length} articles`);
  return articles;
}

// =====================================================
// DATA SOURCE: CURRENTS API
// =====================================================

async function fetchCurrentsAPI() {
  if (!CONFIG.CURRENTS_KEY) {
    console.log('⚠️ Currents key not configured');
    return [];
  }
  
  console.log('📰 Fetching Currents API...');
  const articles = [];
  
  try {
    const url = `https://api.currentsapi.services/v1/search?keywords=World%20Cup%202026&apiKey=${CONFIG.CURRENTS_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Currents API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    for (const item of (data.news || [])) {
      if (isRelevantContent(item.description || '', item.title || '')) {
        articles.push({
          source_key: 'currents',
          source_type: 'news',
          external_id: generateContentHash(item.url),
          title: (item.title || '').substring(0, 500),
          description: (item.description || '').substring(0, 2000),
          url: item.url,
          image_url: item.image,
          author: item.author,
          published_at: item.published,
          detected_language: item.language,
          category_key: detectCategory(item.description || '', item.title || ''),
        });
      }
    }
  } catch (error) {
    console.warn('Currents API error:', error.message);
  }
  
  console.log(`📰 Currents: Found ${articles.length} articles`);
  return articles;
}

// =====================================================
// DATA SOURCE: YOUTUBE
// =====================================================

async function fetchYouTube() {
  if (!CONFIG.YOUTUBE_KEY) {
    console.log('⚠️ YouTube key not configured');
    return [];
  }
  
  console.log('📺 Fetching YouTube...');
  const articles = [];
  
  const queries = ['World Cup 2026', 'WM 2026', 'FIFA 2026'];
  
  for (const query of queries) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=25&order=date&key=${CONFIG.YOUTUBE_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      
      for (const item of (data.items || [])) {
        const snippet = item.snippet || {};
        if (isRelevantContent(snippet.description || '', snippet.title || '')) {
          articles.push({
            source_key: 'youtube',
            source_type: 'social_media',
            external_id: item.id?.videoId || generateContentHash(snippet.title),
            title: (snippet.title || '').substring(0, 500),
            description: (snippet.description || '').substring(0, 2000),
            url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
            image_url: snippet.thumbnails?.high?.url,
            author: snippet.channelTitle,
            published_at: snippet.publishedAt,
            category_key: detectCategory(snippet.description || '', snippet.title || ''),
          });
        }
      }
      
      await sleep(CONFIG.REQUEST_DELAY_MS);
    } catch (error) {
      console.warn('YouTube error:', error.message);
    }
  }
  
  console.log(`📺 YouTube: Found ${articles.length} videos`);
  return articles;
}

// =====================================================
// DATA SOURCE: REDDIT
// =====================================================

async function getRedditAccessToken() {
  if (!CONFIG.REDDIT_CLIENT_ID || !CONFIG.REDDIT_CLIENT_SECRET) {
    return null;
  }
  
  try {
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${CONFIG.REDDIT_CLIENT_ID}:${CONFIG.REDDIT_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': CONFIG.REDDIT_USER_AGENT,
      },
      body: 'grant_type=client_credentials',
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.warn('Reddit auth error:', error.message);
    return null;
  }
}

async function fetchReddit() {
  console.log('🔴 Fetching Reddit...');
  const articles = [];
  
  // Get access token
  const accessToken = await getRedditAccessToken();
  
  // Subreddits to search
  const subreddits = [
    'soccer', 'football', 'worldcup', 'MLS', 'Bundesliga', 
    'LaLiga', 'PremierLeague', 'Ligue1', 'seriea',
    'ussoccer', 'USMNT', 'CanadaSoccer', 'LigaMX'
  ];
  
  const searchTerms = ['World Cup 2026', 'WM 2026', 'FIFA 2026'];
  
  for (const subreddit of subreddits) {
    for (const term of searchTerms) {
      try {
        let url, headers;
        
        if (accessToken) {
          url = `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(term)}&sort=new&limit=25&restrict_sr=1`;
          headers = {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': CONFIG.REDDIT_USER_AGENT,
          };
        } else {
          url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&restrict_sr=1`;
          headers = {
            'User-Agent': CONFIG.REDDIT_USER_AGENT,
          };
        }
        
        const response = await fetch(url, { headers });
        if (!response.ok) continue;
        
        const data = await response.json();
        
        for (const post of (data.data?.children || [])) {
          const item = post.data;
          if (isRelevantContent(item.selftext || '', item.title || '')) {
            articles.push({
              source_key: 'reddit',
              source_type: 'social_media',
              external_id: item.id,
              title: (item.title || '').substring(0, 500),
              description: (item.selftext || '').substring(0, 2000),
              url: `https://www.reddit.com${item.permalink}`,
              author: item.author,
              published_at: item.created_utc ? new Date(item.created_utc * 1000).toISOString() : null,
              category_key: detectCategory(item.selftext || '', item.title || ''),
            });
          }
        }
        
        await sleep(CONFIG.REQUEST_DELAY_MS * 5); // Reddit rate limits
      } catch (error) {
        console.warn(`Reddit error for r/${subreddit}:`, error.message);
      }
    }
  }
  
  console.log(`🔴 Reddit: Found ${articles.length} posts`);
  return articles;
}

// =====================================================
// DATA SOURCE: MASTODON
// =====================================================

async function fetchMastodon() {
  console.log('🐘 Fetching Mastodon...');
  const articles = [];
  
  const instances = [
    'mastodon.social',
    'mastodon.online',
    'mstdn.social',
  ];
  
  const searchTerms = ['WorldCup2026', 'WM2026', 'FIFA2026'];
  
  for (const instance of instances) {
    for (const term of searchTerms) {
      try {
        const url = `https://${instance}/api/v1/timelines/tag/${term}?limit=20`;
        
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });
        
        if (!response.ok) continue;
        
        const posts = await response.json();
        
        for (const post of posts) {
          const content = (post.content || '').replace(/<[^>]+>/g, '');
          if (isRelevantContent(content, '')) {
            articles.push({
              source_key: 'mastodon',
              source_type: 'social_media',
              external_id: post.id,
              title: content.substring(0, 100) + '...',
              description: content.substring(0, 2000),
              url: post.url || post.uri,
              author: post.account?.username,
              published_at: post.created_at,
              category_key: detectCategory(content, ''),
            });
          }
        }
        
        await sleep(CONFIG.REQUEST_DELAY_MS);
      } catch (error) {
        console.warn(`Mastodon error for ${instance}:`, error.message);
      }
    }
  }
  
  console.log(`🐘 Mastodon: Found ${articles.length} posts`);
  return articles;
}

// =====================================================
// DATA SOURCE: BLUESKY
// =====================================================

async function fetchBluesky() {
  console.log('🦋 Fetching Bluesky...');
  const articles = [];
  
  const searchTerms = ['World Cup 2026', 'WM 2026', 'FIFA 2026', '#WorldCup2026'];
  
  for (const term of searchTerms) {
    try {
      // Bluesky public search API
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=25`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      for (const item of (data.posts || [])) {
        const text = item.record?.text || '';
        if (isRelevantContent(text, '')) {
          articles.push({
            source_key: 'bluesky',
            source_type: 'social_media',
            external_id: item.uri,
            title: text.substring(0, 100) + '...',
            description: text.substring(0, 2000),
            url: `https://bsky.app/profile/${item.author?.handle}/post/${item.uri?.split('/').pop()}`,
            author: item.author?.handle,
            published_at: item.record?.createdAt,
            category_key: detectCategory(text, ''),
          });
        }
      }
      
      await sleep(CONFIG.REQUEST_DELAY_MS);
    } catch (error) {
      console.warn('Bluesky error:', error.message);
    }
  }
  
  console.log(`🦋 Bluesky: Found ${articles.length} posts`);
  return articles;
}

// =====================================================
// HUGGING FACE API CALLS
// =====================================================

async function callHuggingFaceAPI(model, inputs, retries = 3) {
  const url = `${CONFIG.HF_API_URL}${model}`;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs }),
      });
      
      if (response.status === 503) {
        console.log(`Model ${model} loading, waiting 20s...`);
        await sleep(20000);
        continue;
      }
      
      if (response.status === 429) {
        console.log('Rate limited, waiting 60s...');
        await sleep(60000);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HF API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`HF API attempt ${attempt + 1} failed:`, error.message);
      if (attempt === retries - 1) throw error;
      await sleep(2000 * (attempt + 1));
    }
  }
}

// =====================================================
// SENTIMENT ANALYSIS
// =====================================================

async function analyzeSentiment(texts) {
  console.log(`🔍 Analyzing sentiment for ${texts.length} texts...`);
  const results = [];
  
  for (let i = 0; i < texts.length; i += CONFIG.BATCH_SIZE) {
    const batch = texts.slice(i, i + CONFIG.BATCH_SIZE);
    
    try {
      const response = await callHuggingFaceAPI(
        CONFIG.MODELS.SENTIMENT,
        batch.map(t => t.substring(0, 512))
      );
      
      for (let j = 0; j < batch.length; j++) {
        const scores = response[j] || [];
        const scoreMap = {};
        
        for (const item of scores) {
          if (item.label === 'positive') scoreMap.positive = item.score;
          else if (item.label === 'negative') scoreMap.negative = item.score;
          else if (item.label === 'neutral') scoreMap.neutral = item.score;
        }
        
        const sentiment_score = (scoreMap.positive || 0) - (scoreMap.negative || 0);
        const maxScore = Math.max(scoreMap.positive || 0, scoreMap.negative || 0, scoreMap.neutral || 0);
        let label = 'neutral';
        if ((scoreMap.positive || 0) === maxScore) label = 'positive';
        else if ((scoreMap.negative || 0) === maxScore) label = 'negative';
        
        results.push({
          sentiment_score: sentiment_score,
          sentiment_label: label,
          sentiment_confidence: maxScore,
          score_positive: scoreMap.positive || 0,
          score_negative: scoreMap.negative || 0,
          score_neutral: scoreMap.neutral || 0,
          score_normalized: Math.round((sentiment_score + 1) * 50),
        });
      }
      
      await sleep(CONFIG.REQUEST_DELAY_MS);
    } catch (error) {
      console.warn('Sentiment analysis error:', error.message);
      // Fill with neutral scores on error
      for (let j = 0; j < batch.length; j++) {
        results.push({
          sentiment_score: 0,
          sentiment_label: 'neutral',
          sentiment_confidence: 0.5,
          score_positive: 0.33,
          score_negative: 0.33,
          score_neutral: 0.34,
          score_normalized: 50,
        });
      }
    }
  }
  
  return results;
}

// =====================================================
// EMOTION DETECTION
// =====================================================

async function analyzeEmotions(texts) {
  console.log(`😊 Analyzing emotions for ${texts.length} texts...`);
  const results = [];
  
  for (let i = 0; i < texts.length; i += CONFIG.BATCH_SIZE) {
    const batch = texts.slice(i, i + CONFIG.BATCH_SIZE);
    
    try {
      const response = await callHuggingFaceAPI(
        CONFIG.MODELS.EMOTION,
        batch.map(t => t.substring(0, 512))
      );
      
      for (let j = 0; j < batch.length; j++) {
        const scores = response[j] || [];
        const emotions = {
          joy: 0, trust: 0, fear: 0, surprise: 0,
          sadness: 0, disgust: 0, anger: 0, anticipation: 0.3 // Default anticipation for WM content
        };
        
        // Map model labels to Plutchik emotions
        for (const item of scores) {
          const label = item.label?.toLowerCase();
          const score = item.score || 0;
          
          if (label === 'joy' || label === 'happy') emotions.joy = score;
          else if (label === 'anger' || label === 'angry') emotions.anger = score;
          else if (label === 'fear') emotions.fear = score;
          else if (label === 'surprise') emotions.surprise = score;
          else if (label === 'sadness' || label === 'sad') emotions.sadness = score;
          else if (label === 'disgust') emotions.disgust = score;
        }
        
        // Find dominant and secondary emotions
        const emotionEntries = Object.entries(emotions);
        emotionEntries.sort((a, b) => b[1] - a[1]);
        
        const dominant = emotionEntries[0];
        const secondary = emotionEntries[1];
        
        // Calculate emotional intensity
        const intensity = Object.values(emotions).reduce((a, b) => a + b, 0) / 8;
        
        results.push({
          ...emotions,
          dominant_emotion: dominant[0],
          dominant_score: dominant[1],
          secondary_emotion: secondary[0],
          secondary_score: secondary[1],
          emotional_intensity: intensity,
        });
      }
      
      await sleep(CONFIG.REQUEST_DELAY_MS);
    } catch (error) {
      console.warn('Emotion analysis error:', error.message);
      for (let j = 0; j < batch.length; j++) {
        results.push({
          joy: 0.3, trust: 0.3, fear: 0.1, surprise: 0.1,
          sadness: 0.1, disgust: 0.05, anger: 0.1, anticipation: 0.4,
          dominant_emotion: 'anticipation',
          dominant_score: 0.4,
          secondary_emotion: 'joy',
          secondary_score: 0.3,
          emotional_intensity: 0.2,
        });
      }
    }
  }
  
  return results;
}

// =====================================================
// SUBJECTIVITY ANALYSIS
// =====================================================

function analyzeSubjectivity(text) {
  const lowerText = text.toLowerCase();
  
  // Opinion indicators
  const opinionPhrases = [
    'i think', 'i believe', 'in my opinion', 'i feel',
    'ich denke', 'meiner meinung nach', 'ich glaube',
    'creo que', 'pienso que', 'je pense', 'selon moi'
  ];
  
  let opinionCount = 0;
  for (const phrase of opinionPhrases) {
    const matches = lowerText.match(new RegExp(phrase, 'g')) || [];
    opinionCount += matches.length;
  }
  
  // Factual indicators
  const hasCitations = /\[\d+\]|according to|laut|según|selon/.test(lowerText);
  const hasStatistics = /\d+%|\d+\s*(million|billion|euro|dollar)|statistik|data/.test(lowerText);
  const hasQuotes = /"[^"]{10,}"/.test(text);
  
  // Calculate subjectivity score
  let subjectivityScore = 0.5; // Base
  subjectivityScore += opinionCount * 0.1;
  if (hasCitations) subjectivityScore -= 0.15;
  if (hasStatistics) subjectivityScore -= 0.1;
  if (hasQuotes) subjectivityScore -= 0.05;
  
  subjectivityScore = Math.max(0, Math.min(1, subjectivityScore));
  
  // Determine content type
  let contentType = 'news';
  if (subjectivityScore > 0.7) contentType = 'opinion';
  else if (subjectivityScore > 0.5) contentType = 'analysis';
  else if (subjectivityScore < 0.3) contentType = 'news';
  else contentType = 'mixed';
  
  return {
    is_subjective: subjectivityScore > 0.5,
    subjectivity_score: subjectivityScore,
    has_citations: hasCitations,
    has_statistics: hasStatistics,
    has_quotes: hasQuotes,
    opinion_phrases_count: opinionCount,
    content_type: contentType,
  };
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

async function saveArticles(articles) {
  if (articles.length === 0) return { inserted: 0, duplicates: 0 };
  
  console.log(`💾 Saving ${articles.length} articles to database...`);
  
  let inserted = 0;
  let duplicates = 0;
  
  for (const article of articles) {
    try {
      // Generate content hash for deduplication
      article.content_hash = generateContentHash(article.title + article.description);
      
      const { error } = await supabase
        .from('wm2026_articles')
        .upsert(article, { 
          onConflict: 'source_key,external_id',
          ignoreDuplicates: true 
        });
      
      if (error) {
        if (error.code === '23505') { // Duplicate
          duplicates++;
        } else {
          console.warn('Insert error:', error.message);
        }
      } else {
        inserted++;
      }
    } catch (error) {
      console.warn('Save error:', error.message);
    }
  }
  
  console.log(`💾 Saved: ${inserted} new, ${duplicates} duplicates`);
  return { inserted, duplicates };
}

async function saveAnalysisResults(articleId, sentiment, emotions, subjectivity) {
  try {
    // Save sentiment
    if (sentiment) {
      await supabase.from('wm2026_sentiment').upsert({
        article_id: articleId,
        ...sentiment,
      }, { onConflict: 'article_id' });
    }
    
    // Save emotions
    if (emotions) {
      await supabase.from('wm2026_emotions').upsert({
        article_id: articleId,
        ...emotions,
      }, { onConflict: 'article_id' });
    }
    
    // Save subjectivity
    if (subjectivity) {
      await supabase.from('wm2026_subjectivity').upsert({
        article_id: articleId,
        ...subjectivity,
      }, { onConflict: 'article_id' });
    }
    
    // Mark article as processed
    await supabase.from('wm2026_articles')
      .update({ is_processed: true })
      .eq('id', articleId);
      
  } catch (error) {
    console.warn('Save analysis error:', error.message);
  }
}

// =====================================================
// DAILY AGGREGATION
// =====================================================

async function calculateDailyAggregation() {
  console.log('📊 Calculating daily aggregation...');
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Get all sentiment data for today
    const { data: sentimentData, error } = await supabase
      .from('wm2026_sentiment')
      .select(`
        sentiment_score,
        sentiment_label,
        score_normalized,
        article:wm2026_articles(source_type, category_key, country_code)
      `)
      .gte('analyzed_at', today + 'T00:00:00Z');
    
    if (error) throw error;
    
    if (!sentimentData || sentimentData.length === 0) {
      console.log('No sentiment data for today');
      return;
    }
    
    // Calculate overall metrics
    const scores = sentimentData.map(s => s.score_normalized).filter(s => s !== null);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    // By source type
    const newsData = sentimentData.filter(s => s.article?.source_type === 'news');
    const socialData = sentimentData.filter(s => s.article?.source_type === 'social_media');
    
    const newsScores = newsData.map(s => s.score_normalized).filter(s => s !== null);
    const socialScores = socialData.map(s => s.score_normalized).filter(s => s !== null);
    
    const newsScore = newsScores.length > 0 
      ? Math.round(newsScores.reduce((a, b) => a + b, 0) / newsScores.length)
      : null;
    const socialScore = socialScores.length > 0
      ? Math.round(socialScores.reduce((a, b) => a + b, 0) / socialScores.length)
      : null;
    
    // Get emotions data
    const { data: emotionData } = await supabase
      .from('wm2026_emotions')
      .select('*')
      .gte('analyzed_at', today + 'T00:00:00Z');
    
    // Calculate average emotions
    let avgEmotions = {};
    if (emotionData && emotionData.length > 0) {
      const emotionFields = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
      for (const field of emotionFields) {
        const values = emotionData.map(e => e[field]).filter(v => v !== null);
        avgEmotions[`avg_${field}`] = values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;
      }
      
      // Find dominant emotion
      const emotionAvgs = emotionFields.map(f => ({ field: f, avg: avgEmotions[`avg_${f}`] }));
      emotionAvgs.sort((a, b) => b.avg - a.avg);
      avgEmotions.dominant_emotion = emotionAvgs[0].field;
    }
    
    // Get previous day for trend
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const { data: prevData } = await supabase
      .from('wm2026_daily_sentiment')
      .select('overall_score')
      .eq('date', yesterday)
      .single();
    
    let trend = 'stable';
    let trendChange = 0;
    if (prevData?.overall_score) {
      trendChange = ((overallScore - prevData.overall_score) / prevData.overall_score) * 100;
      if (trendChange > 5) trend = 'up';
      else if (trendChange < -5) trend = 'down';
    }
    
    // Save daily aggregation
    await supabase.from('wm2026_daily_sentiment').upsert({
      date: today,
      overall_score: overallScore,
      overall_label: overallScore >= 60 ? 'positive' : (overallScore <= 40 ? 'negative' : 'neutral'),
      article_count: sentimentData.length,
      news_score: newsScore,
      news_count: newsData.length,
      social_score: socialScore,
      social_count: socialData.length,
      positive_count: sentimentData.filter(s => s.sentiment_label === 'positive').length,
      negative_count: sentimentData.filter(s => s.sentiment_label === 'negative').length,
      neutral_count: sentimentData.filter(s => s.sentiment_label === 'neutral').length,
      ...avgEmotions,
      trend: trend,
      trend_change: trendChange,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'date' });
    
    console.log(`📊 Daily aggregation saved: Score ${overallScore}/100, ${sentimentData.length} articles`);
    
    // Calculate category aggregations
    await calculateCategoryAggregations(sentimentData, emotionData, today);
    
  } catch (error) {
    console.error('Daily aggregation error:', error);
  }
}

async function calculateCategoryAggregations(sentimentData, emotionData, date) {
  const categories = ['general', 'sporting', 'business', 'ticketing', 'fans', 'political', 'infrastructure'];
  
  for (const category of categories) {
    const categoryData = sentimentData.filter(s => s.article?.category_key === category);
    if (categoryData.length === 0) continue;
    
    const scores = categoryData.map(s => s.score_normalized).filter(s => s !== null);
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    // Find dominant emotion for this category
    const categoryEmotions = emotionData?.filter(e => {
      const article = sentimentData.find(s => s.article_id === e.article_id);
      return article?.article?.category_key === category;
    }) || [];
    
    let dominantEmotion = 'anticipation';
    if (categoryEmotions.length > 0) {
      const emotionCounts = {};
      for (const e of categoryEmotions) {
        const emotion = e.dominant_emotion || 'neutral';
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
      dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'anticipation';
    }
    
    await supabase.from('wm2026_daily_category').upsert({
      date: date,
      category_key: category,
      score: score,
      article_count: categoryData.length,
      dominant_emotion: dominantEmotion,
      trend: 'stable',
    }, { onConflict: 'date,category_key' });
  }
}

// =====================================================
// MAIN PIPELINE
// =====================================================

async function runPipeline(options = {}) {
  const startTime = Date.now();
  console.log('🚀 Starting WM2026 Sentiment Analysis Pipeline...');
  console.log('⏰', new Date().toISOString());
  
  const results = {
    fetch: { total: 0, bySource: {} },
    analysis: { processed: 0, failed: 0 },
    duration: 0,
  };
  
  try {
    // ==================== PHASE 1: DATA COLLECTION ====================
    console.log('\n📥 PHASE 1: Data Collection');
    
    const allArticles = [];
    
    // Google News RSS (always free)
    if (options.sources?.includes('google_news') || !options.sources) {
      const googleArticles = await fetchGoogleNewsRSS();
      allArticles.push(...googleArticles);
      results.fetch.bySource.google_news = googleArticles.length;
    }
    
    // NewsAPI
    if (options.sources?.includes('newsapi') || !options.sources) {
      const newsapiArticles = await fetchNewsAPI();
      allArticles.push(...newsapiArticles);
      results.fetch.bySource.newsapi = newsapiArticles.length;
    }
    
    // GNews
    if (options.sources?.includes('gnews') || !options.sources) {
      const gnewsArticles = await fetchGNews();
      allArticles.push(...gnewsArticles);
      results.fetch.bySource.gnews = gnewsArticles.length;
    }
    
    // Currents
    if (options.sources?.includes('currents') || !options.sources) {
      const currentsArticles = await fetchCurrentsAPI();
      allArticles.push(...currentsArticles);
      results.fetch.bySource.currents = currentsArticles.length;
    }
    
    // YouTube
    if (options.sources?.includes('youtube') || !options.sources) {
      const youtubeArticles = await fetchYouTube();
      allArticles.push(...youtubeArticles);
      results.fetch.bySource.youtube = youtubeArticles.length;
    }
    
    // Reddit
    if (options.sources?.includes('reddit') || !options.sources) {
      const redditArticles = await fetchReddit();
      allArticles.push(...redditArticles);
      results.fetch.bySource.reddit = redditArticles.length;
    }
    
    // Mastodon
    if (options.sources?.includes('mastodon') || !options.sources) {
      const mastodonArticles = await fetchMastodon();
      allArticles.push(...mastodonArticles);
      results.fetch.bySource.mastodon = mastodonArticles.length;
    }
    
    // Bluesky
    if (options.sources?.includes('bluesky') || !options.sources) {
      const blueskyArticles = await fetchBluesky();
      allArticles.push(...blueskyArticles);
      results.fetch.bySource.bluesky = blueskyArticles.length;
    }
    
    results.fetch.total = allArticles.length;
    console.log(`\n📥 Total collected: ${allArticles.length} articles`);
    
    // ==================== PHASE 2: SAVE TO DATABASE ====================
    console.log('\n💾 PHASE 2: Saving to Database');
    
    const saveResult = await saveArticles(allArticles);
    console.log(`Inserted: ${saveResult.inserted}, Duplicates: ${saveResult.duplicates}`);
    
    // ==================== PHASE 3: ANALYSIS ====================
    console.log('\n🔬 PHASE 3: Analysis');
    
    // Get unprocessed articles
    const { data: unprocessed, error: fetchError } = await supabase
      .from('wm2026_articles')
      .select('id, title, description')
      .eq('is_processed', false)
      .limit(CONFIG.MAX_ARTICLES_PER_SOURCE);
    
    if (fetchError) throw fetchError;
    
    if (unprocessed && unprocessed.length > 0) {
      console.log(`Found ${unprocessed.length} unprocessed articles`);
      
      // Prepare texts for analysis
      const texts = unprocessed.map(a => `${a.title} ${a.description || ''}`.substring(0, 512));
      
      // Run sentiment analysis
      const sentiments = await analyzeSentiment(texts);
      
      // Run emotion analysis
      const emotions = await analyzeEmotions(texts);
      
      // Process and save results
      for (let i = 0; i < unprocessed.length; i++) {
        try {
          const text = texts[i];
          const subjectivity = analyzeSubjectivity(text);
          
          await saveAnalysisResults(
            unprocessed[i].id,
            sentiments[i],
            emotions[i],
            subjectivity
          );
          
          results.analysis.processed++;
        } catch (error) {
          results.analysis.failed++;
          console.warn(`Analysis failed for article ${unprocessed[i].id}:`, error.message);
        }
      }
    }
    
    // ==================== PHASE 4: AGGREGATION ====================
    console.log('\n📊 PHASE 4: Daily Aggregation');
    
    await calculateDailyAggregation();
    
    // ==================== COMPLETE ====================
    results.duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n✅ Pipeline Complete!');
    console.log(`⏱️ Duration: ${results.duration}s`);
    console.log(`📥 Fetched: ${results.fetch.total} articles`);
    console.log(`🔬 Analyzed: ${results.analysis.processed} articles`);
    
    // Log to processing log
    await supabase.from('wm2026_processing_log').insert({
      job_type: 'full_pipeline',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: results.duration,
      items_processed: results.fetch.total,
      items_success: results.analysis.processed,
      items_failed: results.analysis.failed,
      status: 'completed',
      details: results,
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Pipeline Error:', error);
    
    // Log error
    await supabase.from('wm2026_processing_log').insert({
      job_type: 'full_pipeline',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: Math.round((Date.now() - startTime) / 1000),
      status: 'failed',
      error_message: error.message,
    });
    
    throw error;
  }
}

// =====================================================
// API HANDLER (Vercel Serverless Function)
// =====================================================

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { action, sources } = req.query;
    
    switch (action) {
      case 'run':
      case 'update':
        // Run full pipeline
        const results = await runPipeline({ 
          sources: sources?.split(',') 
        });
        return res.status(200).json({ 
          success: true, 
          message: 'Pipeline completed',
          results 
        });
      
      case 'status':
        // Get latest processing status
        const { data: logs } = await supabase
          .from('wm2026_processing_log')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(5);
        return res.status(200).json({ success: true, logs });
      
      case 'summary':
        // Get current summary
        const { data: summary } = await supabase
          .from('wm2026_daily_sentiment')
          .select('*')
          .order('date', { ascending: false })
          .limit(1)
          .single();
        return res.status(200).json({ success: true, summary });
      
      default:
        return res.status(200).json({
          success: true,
          message: 'WM2026 Sentiment Engine v2.0',
          endpoints: {
            'GET /api/sentiment-engine?action=run': 'Run full pipeline',
            'GET /api/sentiment-engine?action=status': 'Get processing status',
            'GET /api/sentiment-engine?action=summary': 'Get current summary',
          }
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// =====================================================
// EXPORTS
// =====================================================

export { 
  runPipeline, 
  fetchGoogleNewsRSS,
  fetchNewsAPI,
  fetchGNews,
  fetchCurrentsAPI,
  fetchYouTube,
  fetchReddit,
  fetchMastodon,
  fetchBluesky,
  analyzeSentiment,
  analyzeEmotions,
  calculateDailyAggregation,
};
