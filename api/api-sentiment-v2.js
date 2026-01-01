// =====================================================
// WM 2026 SENTIMENT ANALYSIS V2 - COMPLETE SYSTEM
// =====================================================
// Multi-source News Fetcher + XLM-RoBERTa Sentiment Analysis
// Sources: Google RSS, NewsAPI, GNews, Currents, YouTube, Reddit, Mastodon, Bluesky
// Analysis: Sentiment, Emotion, Aspect-Based, NER, Stance, Volume/Velocity, Subjectivity
// =====================================================

import { createClient } from '@supabase/supabase-js';

// ==================== CONFIGURATION ====================

const CONFIG = {
  // API Keys (from environment variables)
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  NEWSAPI_KEY: process.env.NEWSAPI_KEY,
  GNEWS_KEY: process.env.GNEWS_KEY,
  CURRENTS_KEY: process.env.CURRENTS_KEY,
  YOUTUBE_KEY: process.env.YOUTUBE_KEY,
  
  // Hugging Face Models
  MODELS: {
    SENTIMENT: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
    EMOTION: 'j-hartmann/emotion-english-distilroberta-base',
    NER: 'dslim/bert-base-NER',
    ZERO_SHOT: 'facebook/bart-large-mnli', // For stance detection
  },
  
  HF_API_URL: 'https://api-inference.huggingface.co/models/',
  
  // Processing limits
  BATCH_SIZE: 10,
  MAX_ARTICLES_PER_SOURCE: 100,
  RATE_LIMIT_DELAY: 200, // ms between API calls
  
  // Search queries for WM2026 (multilingual)
  SEARCH_QUERIES: {
    primary: [
      'FIFA World Cup 2026',
      'WM 2026',
      'Copa del Mundo 2026',
      'Coupe du Monde 2026',
      'Mundial 2026',
      'ワールドカップ 2026',
      '世界杯 2026',
      'كأس العالم 2026',
    ],
    secondary: [
      'World Cup USA Mexico Canada',
      'WM Nordamerika',
      'Copa Mundial Norteamérica',
    ],
    exclude: [
      'cricket',
      'rugby',
      'baseball',
      'basketball',
      'hockey',
      'tennis',
      'golf',
      'F1',
      'NASCAR',
    ],
  },
  
  // Category classification keywords
  CATEGORY_KEYWORDS: {
    sporting: {
      de: ['spiel', 'match', 'team', 'mannschaft', 'qualifikation', 'gruppe', 'turnier', 'tor', 'sieg', 'niederlage', 'spieler', 'trainer', 'auslosung'],
      en: ['match', 'game', 'team', 'squad', 'qualification', 'group', 'tournament', 'goal', 'win', 'loss', 'player', 'coach', 'draw'],
      es: ['partido', 'equipo', 'clasificación', 'grupo', 'torneo', 'gol', 'victoria', 'derrota', 'jugador', 'entrenador', 'sorteo'],
    },
    business: {
      de: ['sponsor', 'tv-rechte', 'übertragung', 'milliarden', 'vertrag', 'deal', 'einnahmen', 'wirtschaft', 'investor'],
      en: ['sponsor', 'tv rights', 'broadcast', 'billion', 'contract', 'deal', 'revenue', 'economy', 'investor'],
      es: ['patrocinador', 'derechos tv', 'transmisión', 'millones', 'contrato', 'ingresos', 'economía'],
    },
    ticketing: {
      de: ['ticket', 'karte', 'preis', 'verkauf', 'ausverkauft', 'buchung', 'lotterie'],
      en: ['ticket', 'price', 'sale', 'sold out', 'booking', 'lottery', 'purchase'],
      es: ['entrada', 'boleto', 'precio', 'venta', 'agotado', 'reserva'],
    },
    fans: {
      de: ['fan', 'reise', 'hotel', 'unterkunft', 'visa', 'atmosphäre', 'party', 'fanzone', 'fanfest'],
      en: ['fan', 'travel', 'hotel', 'accommodation', 'visa', 'atmosphere', 'party', 'fanzone'],
      es: ['aficionado', 'viaje', 'hotel', 'alojamiento', 'visa', 'atmósfera', 'fiesta'],
    },
    political: {
      de: ['politik', 'protest', 'kritik', 'menschenrecht', 'boykott', 'klima', 'umwelt', 'arbeitsbedingungen'],
      en: ['politics', 'protest', 'criticism', 'human rights', 'boycott', 'climate', 'environment', 'labor'],
      es: ['política', 'protesta', 'crítica', 'derechos humanos', 'boicot', 'clima', 'ambiente'],
    },
    infrastructure: {
      de: ['stadion', 'flughafen', 'transport', 'bau', 'metro', 'infrastruktur', 'verkehr'],
      en: ['stadium', 'airport', 'transport', 'construction', 'metro', 'infrastructure', 'traffic'],
      es: ['estadio', 'aeropuerto', 'transporte', 'construcción', 'metro', 'infraestructura'],
    },
  },
  
  // Emotion mapping (from model output to Plutchik)
  EMOTION_MAP: {
    'joy': 'joy',
    'happiness': 'joy',
    'love': 'joy',
    'anger': 'anger',
    'annoyance': 'anger',
    'fear': 'fear',
    'nervousness': 'fear',
    'sadness': 'sadness',
    'grief': 'sadness',
    'disappointment': 'sadness',
    'surprise': 'surprise',
    'disgust': 'disgust',
    'neutral': 'neutral',
    'optimism': 'anticipation',
    'excitement': 'anticipation',
    'admiration': 'trust',
    'approval': 'trust',
  },
  
  // Reddit subreddits for World Cup discussion
  REDDIT_SUBREDDITS: [
    'soccer', 'worldcup', 'football', 'MLS', 'LigaMX', 'CanadaSoccer',
    'fussball', 'bundesliga', 'LaLiga', 'PremierLeague', 'SerieA', 'Ligue1',
  ],
  
  // Mastodon instances for football content
  MASTODON_INSTANCES: [
    'mastodon.social',
    'mstdn.social',
    'fosstodon.org',
  ],
};

// ==================== SUPABASE CLIENT ====================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ==================== UTILITY FUNCTIONS ====================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().trim();
}

function detectLanguage(text) {
  // Simple language detection based on character patterns
  if (!text) return 'en';
  
  const patterns = {
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ko: /[\uac00-\ud7af]/,
    ar: /[\u0600-\u06ff]/,
    he: /[\u0590-\u05ff]/,
    ru: /[\u0400-\u04ff]/,
    th: /[\u0e00-\u0e7f]/,
    de: /\b(der|die|das|und|ist|für|auf|mit|werden|haben)\b/i,
    es: /\b(el|la|los|las|de|del|que|en|con|por|para)\b/i,
    fr: /\b(le|la|les|de|du|des|que|qui|dans|pour|avec)\b/i,
    pt: /\b(o|a|os|as|de|do|da|que|em|para|com)\b/i,
    it: /\b(il|la|lo|di|del|che|per|con|una|sono)\b/i,
  };
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return lang;
  }
  
  return 'en';
}

function classifyCategory(text) {
  const normalizedText = normalizeText(text);
  const scores = {};
  
  for (const [category, keywords] of Object.entries(CONFIG.CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const lang of Object.values(keywords)) {
      for (const keyword of lang) {
        if (normalizedText.includes(keyword.toLowerCase())) {
          score++;
        }
      }
    }
    scores[category] = score;
  }
  
  const maxCategory = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a, ['general', 0]);
  return maxCategory[0] === 'general' || maxCategory[1] === 0 ? 'general' : maxCategory[0];
}

function isWM2026Relevant(text) {
  const normalizedText = normalizeText(text);
  
  // Check for WM2026 keywords
  const relevantKeywords = [
    'world cup 2026', 'wm 2026', 'mundial 2026', 'coupe du monde 2026',
    'copa del mundo 2026', 'weltmeisterschaft 2026', 'fifa 2026',
    'usa mexico canada', 'usa mexiko kanada', 'amerika wm',
  ];
  
  for (const keyword of relevantKeywords) {
    if (normalizedText.includes(keyword)) return true;
  }
  
  // Check for exclusion keywords (other sports)
  for (const exclude of CONFIG.SEARCH_QUERIES.exclude) {
    if (normalizedText.includes(exclude.toLowerCase())) return false;
  }
  
  // Check for general football + 2026 context
  const footballKeywords = ['football', 'soccer', 'fußball', 'fútbol', 'calcio', 'futebol'];
  const hasFootball = footballKeywords.some(k => normalizedText.includes(k));
  const has2026 = normalizedText.includes('2026');
  
  return hasFootball && has2026;
}

// ==================== NEWS FETCHERS ====================

// 1. Google RSS News Feed
async function fetchGoogleRSS(query, language = 'en', country = 'US') {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${language}&gl=${country}&ceid=${country}:${language}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google RSS error: ${response.status}`);
    
    const text = await response.text();
    const articles = [];
    
    // Parse RSS XML
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const sourceRegex = /<source.*?>(.*?)<\/source>/;
    
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      const title = (item.match(titleRegex) || [])[1] || (item.match(titleRegex) || [])[2] || '';
      const link = (item.match(linkRegex) || [])[1] || '';
      const pubDate = (item.match(pubDateRegex) || [])[1] || '';
      const source = (item.match(sourceRegex) || [])[1] || '';
      
      if (title && isWM2026Relevant(title)) {
        articles.push({
          source_type: 'news',
          source_platform: 'google_rss',
          source_name: source,
          title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
          url: link,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          language_code: language,
          country_code: country,
          external_id: `google_${Buffer.from(link).toString('base64').substring(0, 32)}`,
        });
      }
    }
    
    return articles.slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE);
  } catch (error) {
    console.error('Google RSS fetch error:', error.message);
    return [];
  }
}

// 2. NewsAPI
async function fetchNewsAPI(query) {
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=100&apiKey=${CONFIG.NEWSAPI_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`NewsAPI error: ${response.status}`);
    
    const data = await response.json();
    
    return (data.articles || [])
      .filter(a => isWM2026Relevant(a.title + ' ' + (a.description || '')))
      .map(article => ({
        source_type: 'news',
        source_platform: 'newsapi',
        source_name: article.source?.name || 'Unknown',
        title: article.title,
        content: article.content,
        summary: article.description,
        url: article.url,
        image_url: article.urlToImage,
        author: article.author,
        published_at: article.publishedAt,
        language_code: detectLanguage(article.title),
        external_id: `newsapi_${Buffer.from(article.url).toString('base64').substring(0, 32)}`,
      }))
      .slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE);
  } catch (error) {
    console.error('NewsAPI fetch error:', error.message);
    return [];
  }
}

// 3. GNews API
async function fetchGNews(query, language = 'en') {
  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${language}&max=100&apikey=${CONFIG.GNEWS_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GNews error: ${response.status}`);
    
    const data = await response.json();
    
    return (data.articles || [])
      .filter(a => isWM2026Relevant(a.title + ' ' + (a.description || '')))
      .map(article => ({
        source_type: 'news',
        source_platform: 'gnews',
        source_name: article.source?.name || 'Unknown',
        title: article.title,
        content: article.content,
        summary: article.description,
        url: article.url,
        image_url: article.image,
        published_at: article.publishedAt,
        language_code: language,
        external_id: `gnews_${Buffer.from(article.url).toString('base64').substring(0, 32)}`,
      }))
      .slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE);
  } catch (error) {
    console.error('GNews fetch error:', error.message);
    return [];
  }
}

// 4. Currents API
async function fetchCurrents(query) {
  try {
    const url = `https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(query)}&apiKey=${CONFIG.CURRENTS_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Currents error: ${response.status}`);
    
    const data = await response.json();
    
    return (data.news || [])
      .filter(a => isWM2026Relevant(a.title + ' ' + (a.description || '')))
      .map(article => ({
        source_type: 'news',
        source_platform: 'currents',
        source_name: article.author || 'Unknown',
        title: article.title,
        content: article.description,
        summary: article.description,
        url: article.url,
        image_url: article.image,
        published_at: article.published,
        language_code: article.language || detectLanguage(article.title),
        country_code: article.country?.[0] || null,
        external_id: `currents_${article.id || Buffer.from(article.url).toString('base64').substring(0, 32)}`,
      }))
      .slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE);
  } catch (error) {
    console.error('Currents fetch error:', error.message);
    return [];
  }
}

// 5. YouTube Data API
async function fetchYouTube(query) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=date&maxResults=50&key=${CONFIG.YOUTUBE_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube error: ${response.status}`);
    
    const data = await response.json();
    
    return (data.items || [])
      .filter(item => isWM2026Relevant(item.snippet.title + ' ' + (item.snippet.description || '')))
      .map(item => ({
        source_type: 'social',
        source_platform: 'youtube',
        source_name: item.snippet.channelTitle,
        title: item.snippet.title,
        content: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        image_url: item.snippet.thumbnails?.high?.url,
        published_at: item.snippet.publishedAt,
        language_code: detectLanguage(item.snippet.title),
        external_id: `youtube_${item.id.videoId}`,
      }))
      .slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE);
  } catch (error) {
    console.error('YouTube fetch error:', error.message);
    return [];
  }
}

// 6. Reddit API (Public JSON endpoint)
async function fetchReddit() {
  const allPosts = [];
  
  for (const subreddit of CONFIG.REDDIT_SUBREDDITS) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=world%20cup%202026&sort=new&limit=25&restrict_sr=true`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'WM2026SentimentBot/1.0' }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      const posts = (data.data?.children || [])
        .filter(post => isWM2026Relevant(post.data.title + ' ' + (post.data.selftext || '')))
        .map(post => ({
          source_type: 'social',
          source_platform: 'reddit',
          source_name: `r/${subreddit}`,
          title: post.data.title,
          content: post.data.selftext,
          url: `https://reddit.com${post.data.permalink}`,
          author: post.data.author,
          published_at: new Date(post.data.created_utc * 1000).toISOString(),
          language_code: detectLanguage(post.data.title),
          engagement_score: post.data.score,
          external_id: `reddit_${post.data.id}`,
        }));
      
      allPosts.push(...posts);
      await sleep(100); // Rate limiting
    } catch (error) {
      console.warn(`Reddit r/${subreddit} error:`, error.message);
    }
  }
  
  return allPosts.slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE);
}

// 7. Mastodon Public API
async function fetchMastodon() {
  const allPosts = [];
  
  for (const instance of CONFIG.MASTODON_INSTANCES) {
    try {
      const url = `https://${instance}/api/v1/timelines/public?limit=40`;
      
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      
      const posts = data
        .filter(post => isWM2026Relevant(post.content))
        .map(post => ({
          source_type: 'social',
          source_platform: 'mastodon',
          source_name: `@${post.account?.username}@${instance}`,
          title: post.content.substring(0, 200).replace(/<[^>]*>/g, ''),
          content: post.content.replace(/<[^>]*>/g, ''),
          url: post.url,
          author: post.account?.username,
          published_at: post.created_at,
          language_code: post.language || detectLanguage(post.content),
          engagement_score: (post.reblogs_count || 0) + (post.favourites_count || 0),
          external_id: `mastodon_${post.id}`,
        }));
      
      allPosts.push(...posts);
      await sleep(100);
    } catch (error) {
      console.warn(`Mastodon ${instance} error:`, error.message);
    }
  }
  
  return allPosts.slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE);
}

// 8. Bluesky Public API
async function fetchBluesky() {
  try {
    const url = 'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=world%20cup%202026&limit=100';
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Bluesky error: ${response.status}`);
    
    const data = await response.json();
    
    return (data.posts || [])
      .filter(post => isWM2026Relevant(post.record?.text || ''))
      .map(post => ({
        source_type: 'social',
        source_platform: 'bluesky',
        source_name: `@${post.author?.handle}`,
        title: (post.record?.text || '').substring(0, 200),
        content: post.record?.text,
        url: `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split('/').pop()}`,
        author: post.author?.handle,
        published_at: post.record?.createdAt,
        language_code: detectLanguage(post.record?.text),
        engagement_score: (post.repostCount || 0) + (post.likeCount || 0),
        external_id: `bluesky_${post.cid}`,
      }))
      .slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE);
  } catch (error) {
    console.error('Bluesky fetch error:', error.message);
    return [];
  }
}

// ==================== SENTIMENT ANALYSIS ====================

async function callHuggingFaceAPI(model, inputs, options = {}) {
  const url = `${CONFIG.HF_API_URL}${model}`;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs, ...options }),
      });
      
      if (response.status === 503) {
        console.log(`Model ${model} loading, waiting 20s...`);
        await sleep(20000);
        continue;
      }
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HF API error ${response.status}: ${error}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`HF API attempt ${attempt + 1} failed:`, error.message);
      if (attempt === 2) throw error;
      await sleep(2000 * (attempt + 1));
    }
  }
}

// XLM-RoBERTa Sentiment Analysis
async function analyzeSentiment(texts) {
  const results = [];
  
  for (let i = 0; i < texts.length; i += CONFIG.BATCH_SIZE) {
    const batch = texts.slice(i, i + CONFIG.BATCH_SIZE).map(t => 
      t.substring(0, 512) // Max token limit
    );
    
    try {
      const response = await callHuggingFaceAPI(CONFIG.MODELS.SENTIMENT, batch);
      
      for (const prediction of response) {
        let sentiment_score = 0;
        let sentiment_label = 'neutral';
        let sentiment_confidence = 0;
        
        if (Array.isArray(prediction)) {
          // Find highest scoring label
          const sorted = prediction.sort((a, b) => b.score - a.score);
          const top = sorted[0];
          
          sentiment_confidence = top.score;
          
          // Map to -1 to +1 scale
          if (top.label === 'positive' || top.label === 'LABEL_2') {
            sentiment_score = top.score;
            sentiment_label = 'positive';
          } else if (top.label === 'negative' || top.label === 'LABEL_0') {
            sentiment_score = -top.score;
            sentiment_label = 'negative';
          } else {
            sentiment_score = 0;
            sentiment_label = 'neutral';
          }
        }
        
        results.push({
          sentiment_score,
          sentiment_label,
          sentiment_confidence,
          sentiment_normalized: Math.round(((sentiment_score + 1) / 2) * 100),
        });
      }
      
      await sleep(CONFIG.RATE_LIMIT_DELAY);
    } catch (error) {
      console.warn('Sentiment batch failed:', error.message);
      // Fill with neutral on error
      for (let j = 0; j < batch.length; j++) {
        results.push({
          sentiment_score: 0,
          sentiment_label: 'neutral',
          sentiment_confidence: 0.5,
          sentiment_normalized: 50,
        });
      }
    }
  }
  
  return results;
}

// Emotion Detection
async function detectEmotions(texts) {
  const results = [];
  
  for (let i = 0; i < texts.length; i += CONFIG.BATCH_SIZE) {
    const batch = texts.slice(i, i + CONFIG.BATCH_SIZE).map(t => 
      t.substring(0, 512)
    );
    
    try {
      const response = await callHuggingFaceAPI(CONFIG.MODELS.EMOTION, batch);
      
      for (const prediction of response) {
        const emotions = {
          emotion_joy: 0,
          emotion_trust: 0,
          emotion_fear: 0,
          emotion_surprise: 0,
          emotion_sadness: 0,
          emotion_disgust: 0,
          emotion_anger: 0,
          emotion_anticipation: 0,
        };
        
        if (Array.isArray(prediction)) {
          for (const p of prediction) {
            const mappedEmotion = CONFIG.EMOTION_MAP[p.label.toLowerCase()] || p.label.toLowerCase();
            const key = `emotion_${mappedEmotion}`;
            if (emotions.hasOwnProperty(key)) {
              emotions[key] = Math.max(emotions[key], p.score);
            }
          }
        }
        
        // Find dominant emotion
        const emotionScores = Object.entries(emotions)
          .filter(([k, v]) => k.startsWith('emotion_') && k !== 'emotion_neutral')
          .map(([k, v]) => [k.replace('emotion_', ''), v]);
        
        const dominant = emotionScores.reduce((a, b) => b[1] > a[1] ? b : a, ['neutral', 0]);
        
        // Calculate intensity
        const totalScore = emotionScores.reduce((sum, [_, v]) => sum + v, 0);
        const intensity = totalScore / emotionScores.length;
        
        results.push({
          ...emotions,
          emotion_dominant: dominant[0],
          emotion_intensity: intensity,
        });
      }
      
      await sleep(CONFIG.RATE_LIMIT_DELAY);
    } catch (error) {
      console.warn('Emotion batch failed:', error.message);
      // Fill with neutral emotions on error
      for (let j = 0; j < batch.length; j++) {
        results.push({
          emotion_joy: 0.1,
          emotion_trust: 0.1,
          emotion_fear: 0.1,
          emotion_surprise: 0.1,
          emotion_sadness: 0.1,
          emotion_disgust: 0.1,
          emotion_anger: 0.1,
          emotion_anticipation: 0.2,
          emotion_dominant: 'neutral',
          emotion_intensity: 0.1,
        });
      }
    }
  }
  
  return results;
}

// Named Entity Recognition
async function extractEntities(texts) {
  const results = [];
  
  for (let i = 0; i < texts.length; i += CONFIG.BATCH_SIZE) {
    const batch = texts.slice(i, i + CONFIG.BATCH_SIZE).map(t => 
      t.substring(0, 512)
    );
    
    try {
      const response = await callHuggingFaceAPI(CONFIG.MODELS.NER, batch);
      
      for (let j = 0; j < batch.length; j++) {
        const entities = [];
        const predictions = response[j] || [];
        
        if (Array.isArray(predictions)) {
          // Group consecutive tokens
          let currentEntity = null;
          
          for (const token of predictions) {
            const entityType = token.entity_group || token.entity?.replace('B-', '').replace('I-', '');
            
            if (entityType && token.score > 0.7) {
              if (currentEntity && currentEntity.type === entityType) {
                currentEntity.text += ' ' + token.word.replace('##', '');
              } else {
                if (currentEntity) entities.push(currentEntity);
                currentEntity = {
                  text: token.word.replace('##', ''),
                  type: entityType,
                  score: token.score,
                };
              }
            } else {
              if (currentEntity) {
                entities.push(currentEntity);
                currentEntity = null;
              }
            }
          }
          if (currentEntity) entities.push(currentEntity);
        }
        
        results.push(entities.map(e => ({
          entity_text: e.text,
          entity_type: e.type,
          entity_normalized: normalizeText(e.text),
        })));
      }
      
      await sleep(CONFIG.RATE_LIMIT_DELAY);
    } catch (error) {
      console.warn('NER batch failed:', error.message);
      for (let j = 0; j < batch.length; j++) {
        results.push([]);
      }
    }
  }
  
  return results;
}

// Stance Detection (using zero-shot classification)
async function detectStance(texts) {
  const results = [];
  const labels = ['supportive of World Cup 2026', 'critical of World Cup 2026', 'neutral about World Cup 2026'];
  
  for (let i = 0; i < texts.length; i += 5) { // Smaller batches for zero-shot
    const batch = texts.slice(i, i + 5).map(t => t.substring(0, 300));
    
    try {
      for (const text of batch) {
        const response = await callHuggingFaceAPI(CONFIG.MODELS.ZERO_SHOT, text, {
          parameters: { candidate_labels: labels }
        });
        
        if (response.labels && response.scores) {
          const topIndex = response.scores.indexOf(Math.max(...response.scores));
          const topLabel = response.labels[topIndex];
          
          let stance = 'neutral';
          if (topLabel.includes('supportive')) stance = 'supportive';
          else if (topLabel.includes('critical')) stance = 'critical';
          
          results.push({
            stance_label: stance,
            stance_confidence: response.scores[topIndex],
          });
        } else {
          results.push({ stance_label: 'neutral', stance_confidence: 0.5 });
        }
        
        await sleep(CONFIG.RATE_LIMIT_DELAY * 2);
      }
    } catch (error) {
      console.warn('Stance detection batch failed:', error.message);
      for (let j = 0; j < batch.length; j++) {
        results.push({ stance_label: 'neutral', stance_confidence: 0.5 });
      }
    }
  }
  
  return results;
}

// Subjectivity Analysis (simple heuristic-based)
function analyzeSubjectivity(text) {
  const subjectiveIndicators = [
    'i think', 'i believe', 'in my opinion', 'personally', 'i feel',
    'amazing', 'terrible', 'great', 'horrible', 'best', 'worst',
    'love', 'hate', 'beautiful', 'ugly', 'perfect', 'awful',
    'meiner meinung', 'ich glaube', 'ich denke', 'fantastisch', 'schrecklich',
  ];
  
  const factualIndicators = [
    'according to', 'studies show', 'research indicates', 'data shows',
    'officially', 'announced', 'confirmed', 'reported', 'stated',
    'laut', 'offiziell', 'bestätigt', 'berichtet', 'angekündigt',
  ];
  
  const normalizedText = normalizeText(text);
  
  let subjectiveCount = 0;
  let factualCount = 0;
  
  for (const indicator of subjectiveIndicators) {
    if (normalizedText.includes(indicator)) subjectiveCount++;
  }
  
  for (const indicator of factualIndicators) {
    if (normalizedText.includes(indicator)) factualCount++;
  }
  
  const total = subjectiveCount + factualCount + 1; // +1 to avoid division by zero
  const subjectivity = subjectiveCount / total;
  const factuality = factualCount / total;
  
  return {
    subjectivity_score: Math.min(subjectivity, 1),
    factuality_score: Math.min(factuality, 1),
  };
}

// ==================== MAIN PROCESSING FUNCTIONS ====================

async function fetchAllNews() {
  console.log('🌐 Fetching news from all sources...');
  
  const allArticles = [];
  
  // Fetch from all sources
  const queries = CONFIG.SEARCH_QUERIES.primary;
  
  for (const query of queries.slice(0, 3)) { // Limit queries to avoid rate limits
    console.log(`  📰 Google RSS: "${query}"...`);
    const googleArticles = await fetchGoogleRSS(query);
    allArticles.push(...googleArticles);
    
    await sleep(500);
  }
  
  console.log(`  📰 NewsAPI...`);
  const newsApiArticles = await fetchNewsAPI('World Cup 2026');
  allArticles.push(...newsApiArticles);
  
  console.log(`  📰 GNews...`);
  for (const lang of ['en', 'de', 'es', 'fr']) {
    const gnewsArticles = await fetchGNews('World Cup 2026', lang);
    allArticles.push(...gnewsArticles);
    await sleep(300);
  }
  
  console.log(`  📰 Currents...`);
  const currentsArticles = await fetchCurrents('World Cup 2026');
  allArticles.push(...currentsArticles);
  
  console.log(`  🎬 YouTube...`);
  const youtubeArticles = await fetchYouTube('World Cup 2026');
  allArticles.push(...youtubeArticles);
  
  console.log(`  💬 Reddit...`);
  const redditArticles = await fetchReddit();
  allArticles.push(...redditArticles);
  
  console.log(`  🐘 Mastodon...`);
  const mastodonArticles = await fetchMastodon();
  allArticles.push(...mastodonArticles);
  
  console.log(`  🦋 Bluesky...`);
  const blueskyArticles = await fetchBluesky();
  allArticles.push(...blueskyArticles);
  
  console.log(`✅ Total fetched: ${allArticles.length} articles/posts`);
  
  return allArticles;
}

async function processAndStoreArticles(articles) {
  console.log(`\n📊 Processing ${articles.length} articles...`);
  
  // Deduplicate by external_id
  const uniqueArticles = [];
  const seenIds = new Set();
  
  for (const article of articles) {
    if (!seenIds.has(article.external_id)) {
      seenIds.add(article.external_id);
      uniqueArticles.push(article);
    }
  }
  
  console.log(`  📝 Unique articles: ${uniqueArticles.length}`);
  
  // Add metadata
  const enrichedArticles = uniqueArticles.map(article => ({
    ...article,
    category_key: classifyCategory(article.title + ' ' + (article.content || '')),
    word_count: ((article.title || '') + ' ' + (article.content || '')).split(/\s+/).length,
    region: getRegionFromCountry(article.country_code),
    fetched_at: new Date().toISOString(),
  }));
  
  // Store articles in batches
  const STORE_BATCH_SIZE = 50;
  let storedCount = 0;
  
  for (let i = 0; i < enrichedArticles.length; i += STORE_BATCH_SIZE) {
    const batch = enrichedArticles.slice(i, i + STORE_BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('wm2026_articles_v2')
      .upsert(batch, { 
        onConflict: 'source_platform,external_id',
        ignoreDuplicates: true 
      })
      .select('id');
    
    if (error) {
      console.error('  ❌ Store error:', error.message);
    } else {
      storedCount += (data?.length || 0);
    }
  }
  
  console.log(`  ✅ Stored: ${storedCount} articles`);
  
  return enrichedArticles;
}

function getRegionFromCountry(countryCode) {
  const regionMap = {
    europe: ['DE', 'GB', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'PL', 'PT', 'SE', 'NO', 'DK', 'FI'],
    americas: ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC'],
    asia: ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'ID', 'MY', 'SG', 'PH'],
    africa: ['ZA', 'NG', 'EG', 'MA', 'KE', 'GH', 'SN', 'TN', 'DZ', 'CM'],
    oceania: ['AU', 'NZ'],
  };
  
  for (const [region, countries] of Object.entries(regionMap)) {
    if (countries.includes(countryCode)) return region;
  }
  
  return 'other';
}

async function analyzeUnprocessedArticles() {
  console.log('\n🔬 Analyzing unprocessed articles...');
  
  // Get unanalyzed articles
  const { data: articles, error } = await supabase
    .from('wm2026_articles_v2')
    .select('id, title, content, summary')
    .eq('is_analyzed', false)
    .limit(200);
  
  if (error || !articles?.length) {
    console.log('  No unprocessed articles found');
    return;
  }
  
  console.log(`  📝 Found ${articles.length} articles to analyze`);
  
  // Prepare texts for analysis
  const texts = articles.map(a => 
    (a.title || '') + '. ' + (a.summary || a.content || '').substring(0, 300)
  );
  
  // Run all analyses
  console.log('  🎯 Running sentiment analysis...');
  const sentiments = await analyzeSentiment(texts);
  
  console.log('  😊 Running emotion detection...');
  const emotions = await detectEmotions(texts);
  
  console.log('  🏷️ Running NER...');
  const entities = await extractEntities(texts);
  
  console.log('  📐 Running stance detection (sample)...');
  const stances = await detectStance(texts.slice(0, 50)); // Limited for performance
  
  console.log('  📊 Analyzing subjectivity...');
  const subjectivities = texts.map(analyzeSubjectivity);
  
  // Store sentiment results
  console.log('  💾 Storing analysis results...');
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const sentiment = sentiments[i] || {};
    const emotion = emotions[i] || {};
    const stance = stances[i] || { stance_label: 'neutral', stance_confidence: 0.5 };
    const subjectivity = subjectivities[i] || {};
    
    // Store sentiment
    await supabase.from('wm2026_article_sentiment').upsert({
      article_id: article.id,
      ...sentiment,
      ...emotion,
      ...subjectivity,
      ...stance,
      model_used: 'xlm-roberta',
    }, { onConflict: 'article_id' });
    
    // Store entities
    const articleEntities = entities[i] || [];
    for (const entity of articleEntities) {
      await supabase.from('wm2026_article_entities').insert({
        article_id: article.id,
        ...entity,
      });
    }
    
    // Mark as analyzed
    await supabase.from('wm2026_articles_v2')
      .update({ is_analyzed: true, analyzed_at: new Date().toISOString() })
      .eq('id', article.id);
  }
  
  console.log(`  ✅ Analysis complete for ${articles.length} articles`);
}

async function aggregateDailySentiment() {
  console.log('\n📈 Aggregating daily sentiment...');
  
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's analyzed articles with sentiment
  const { data: results, error } = await supabase
    .from('wm2026_articles_v2')
    .select(`
      id,
      source_type,
      source_platform,
      category_key,
      country_code,
      language_code,
      wm2026_article_sentiment (
        sentiment_score,
        sentiment_normalized,
        sentiment_label,
        emotion_dominant,
        emotion_joy,
        emotion_anger,
        emotion_fear,
        emotion_anticipation,
        emotion_intensity,
        subjectivity_score,
        factuality_score,
        stance_label
      )
    `)
    .eq('is_analyzed', true)
    .gte('published_at', `${today}T00:00:00Z`);
  
  if (error || !results?.length) {
    console.log('  No analyzed articles for today');
    return;
  }
  
  console.log(`  📊 Aggregating ${results.length} articles...`);
  
  // Calculate overall metrics
  const articlesWithSentiment = results.filter(r => r.wm2026_article_sentiment);
  
  if (articlesWithSentiment.length === 0) {
    console.log('  No sentiment data available');
    return;
  }
  
  // Overall sentiment
  const avgSentiment = articlesWithSentiment.reduce((sum, r) => 
    sum + (r.wm2026_article_sentiment?.sentiment_score || 0), 0
  ) / articlesWithSentiment.length;
  
  const avgNormalized = Math.round(((avgSentiment + 1) / 2) * 100);
  
  // News vs Social breakdown
  const newsArticles = articlesWithSentiment.filter(r => r.source_type === 'news');
  const socialArticles = articlesWithSentiment.filter(r => r.source_type === 'social');
  
  const newsScore = newsArticles.length > 0
    ? Math.round(newsArticles.reduce((sum, r) => sum + (r.wm2026_article_sentiment?.sentiment_normalized || 50), 0) / newsArticles.length)
    : 50;
  
  const socialScore = socialArticles.length > 0
    ? Math.round(socialArticles.reduce((sum, r) => sum + (r.wm2026_article_sentiment?.sentiment_normalized || 50), 0) / socialArticles.length)
    : 50;
  
  // Emotion aggregation
  const emotionSums = {
    joy: 0, anger: 0, fear: 0, anticipation: 0,
  };
  
  for (const r of articlesWithSentiment) {
    const s = r.wm2026_article_sentiment;
    if (s) {
      emotionSums.joy += s.emotion_joy || 0;
      emotionSums.anger += s.emotion_anger || 0;
      emotionSums.fear += s.emotion_fear || 0;
      emotionSums.anticipation += s.emotion_anticipation || 0;
    }
  }
  
  const emotionAvgs = {
    emotion_joy: emotionSums.joy / articlesWithSentiment.length,
    emotion_anger: emotionSums.anger / articlesWithSentiment.length,
    emotion_fear: emotionSums.fear / articlesWithSentiment.length,
    emotion_anticipation: emotionSums.anticipation / articlesWithSentiment.length,
  };
  
  // Find dominant emotion
  const dominantEmotion = Object.entries(emotionAvgs)
    .map(([k, v]) => [k.replace('emotion_', ''), v])
    .reduce((a, b) => b[1] > a[1] ? b : a, ['neutral', 0])[0];
  
  // Stance distribution
  const stanceCounts = { supportive: 0, critical: 0, neutral: 0 };
  for (const r of articlesWithSentiment) {
    const stance = r.wm2026_article_sentiment?.stance_label || 'neutral';
    stanceCounts[stance] = (stanceCounts[stance] || 0) + 1;
  }
  
  const total = articlesWithSentiment.length;
  
  // Language distribution
  const langCounts = {};
  for (const r of results) {
    const lang = r.language_code || 'en';
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  }
  
  const langDistribution = {};
  for (const [lang, count] of Object.entries(langCounts)) {
    langDistribution[lang] = count / results.length;
  }
  
  // Store daily sentiment
  const { error: upsertError } = await supabase
    .from('wm2026_daily_sentiment')
    .upsert({
      date: today,
      overall_score: avgNormalized,
      overall_sentiment: avgSentiment,
      overall_label: avgSentiment > 0.1 ? 'positive' : avgSentiment < -0.1 ? 'negative' : 'neutral',
      news_score: newsScore,
      news_articles: newsArticles.length,
      social_score: socialScore,
      social_posts: socialArticles.length,
      dominant_emotion: dominantEmotion,
      ...emotionAvgs,
      emotion_intensity: (emotionAvgs.emotion_joy + emotionAvgs.emotion_anger + emotionAvgs.emotion_fear + emotionAvgs.emotion_anticipation) / 4,
      total_articles: results.length,
      avg_subjectivity: articlesWithSentiment.reduce((sum, r) => sum + (r.wm2026_article_sentiment?.subjectivity_score || 0), 0) / articlesWithSentiment.length,
      factual_ratio: articlesWithSentiment.reduce((sum, r) => sum + (r.wm2026_article_sentiment?.factuality_score || 0), 0) / articlesWithSentiment.length,
      supportive_pct: stanceCounts.supportive / total,
      critical_pct: stanceCounts.critical / total,
      neutral_pct: stanceCounts.neutral / total,
      language_distribution: langDistribution,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'date' });
  
  if (upsertError) {
    console.error('  ❌ Daily sentiment store error:', upsertError.message);
  } else {
    console.log(`  ✅ Daily sentiment stored: Score ${avgNormalized}/100`);
  }
  
  // Aggregate by category
  await aggregateByCategoryDaily(today, articlesWithSentiment);
  
  // Aggregate by source
  await aggregateBySourceDaily(today, articlesWithSentiment);
}

async function aggregateByCategoryDaily(today, articles) {
  const categories = ['general', 'sporting', 'business', 'ticketing', 'fans', 'political', 'infrastructure'];
  
  for (const category of categories) {
    const categoryArticles = articles.filter(a => a.category_key === category);
    
    if (categoryArticles.length === 0) continue;
    
    const avgScore = Math.round(
      categoryArticles.reduce((sum, r) => sum + (r.wm2026_article_sentiment?.sentiment_normalized || 50), 0) / categoryArticles.length
    );
    
    // Find dominant emotion for category
    const emotionCounts = {};
    for (const a of categoryArticles) {
      const emotion = a.wm2026_article_sentiment?.emotion_dominant || 'neutral';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }
    
    const dominantEmotion = Object.entries(emotionCounts)
      .reduce((a, b) => b[1] > a[1] ? b : a, ['neutral', 0])[0];
    
    await supabase.from('wm2026_category_sentiment').upsert({
      date: today,
      category_key: category,
      score: avgScore,
      raw_sentiment: (avgScore - 50) / 50,
      news_count: categoryArticles.filter(a => a.source_type === 'news').length,
      social_count: categoryArticles.filter(a => a.source_type === 'social').length,
      total_count: categoryArticles.length,
      dominant_emotion: dominantEmotion,
      emotion_distribution: emotionCounts,
    }, { onConflict: 'date,category_key' });
  }
  
  console.log('  ✅ Category sentiment aggregated');
}

async function aggregateBySourceDaily(today, articles) {
  const sources = ['google_rss', 'newsapi', 'gnews', 'currents', 'youtube', 'reddit', 'mastodon', 'bluesky'];
  
  for (const source of sources) {
    const sourceArticles = articles.filter(a => a.source_platform === source);
    
    if (sourceArticles.length === 0) continue;
    
    const avgScore = Math.round(
      sourceArticles.reduce((sum, r) => sum + (r.wm2026_article_sentiment?.sentiment_normalized || 50), 0) / sourceArticles.length
    );
    
    const sourceType = ['youtube', 'reddit', 'mastodon', 'bluesky'].includes(source) ? 'social' : 'news';
    
    await supabase.from('wm2026_source_sentiment').upsert({
      date: today,
      source_type: sourceType,
      source_platform: source,
      score: avgScore,
      raw_sentiment: (avgScore - 50) / 50,
      article_count: sourceArticles.length,
    }, { onConflict: 'date,source_platform' });
  }
  
  console.log('  ✅ Source sentiment aggregated');
}

// ==================== MAIN EXPORT FUNCTION ====================

export default async function handler(req, res) {
  console.log('🚀 WM2026 Sentiment Analysis V2 Starting...');
  console.log(`⏰ ${new Date().toISOString()}`);
  
  try {
    // Step 1: Fetch news from all sources
    const articles = await fetchAllNews();
    
    // Step 2: Process and store articles
    await processAndStoreArticles(articles);
    
    // Step 3: Analyze unprocessed articles
    await analyzeUnprocessedArticles();
    
    // Step 4: Aggregate daily sentiment
    await aggregateDailySentiment();
    
    console.log('\n✅ WM2026 Sentiment Analysis V2 Complete!');
    
    return res.status(200).json({
      success: true,
      message: 'Sentiment analysis complete',
      articlesProcessed: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// ==================== STANDALONE EXECUTION ====================

// For running directly with Node.js
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    try {
      await handler({ method: 'POST' }, {
        status: (code) => ({
          json: (data) => console.log(`Response (${code}):`, JSON.stringify(data, null, 2))
        })
      });
    } catch (error) {
      console.error('Execution failed:', error);
      process.exit(1);
    }
  })();
}
