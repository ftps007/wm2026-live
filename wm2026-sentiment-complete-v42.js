#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WM2026 SENTIMENT ANALYSIS - COMPLETE LOCAL PIPELINE v4.2
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FIXES in v4.2:
 *   • Reddit funktioniert jetzt auch OHNE API Key (public JSON)
 *   • Bluesky API Fix (neuer Endpoint)
 *   • Aggregation trennt News vs Social Media
 *   • Korrektes DB-Insert mit Fehlerbehandlung
 *   • Detaillierte Statistiken pro Modell
 * 
 * SOURCES (5):
 *   • Google News RSS (35 languages) - KOSTENLOS, kein API Key
 *   • Reddit (140+ subreddits) - KOSTENLOS (public JSON, kein OAuth nötig)
 *   • YouTube - KOSTENLOS (Kontingent), API Key nötig
 *   • Mastodon - KOSTENLOS, kein API Key
 *   • Bluesky - KOSTENLOS, kein API Key
 * 
 * AI MODELS (11) - Alle über Hugging Face Inference API (KOSTENLOS):
 *   1. Language Detection      - papluca/xlm-roberta-base-language-detection
 *   2. Sentiment Analysis      - cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual
 *   3. Topic Classification    - facebook/bart-large-mnli (Zero-Shot)
 *   4. Emotion Detection       - SamLowe/roberta-base-go_emotions
 *   5. Named Entity Recognition- Davlan/xlm-roberta-base-ner-hrl
 *   6. Toxicity Detection      - unitary/toxic-bert
 *   7. Keyword Extraction      - ml6team/keyphrase-extraction-kbir-inspec
 *   8. Summarization           - facebook/bart-large-cnn
 *   9. Aspect-Based Sentiment  - Custom Zero-Shot
 *  10. Controversy Detection   - Rule-Based + ML
 *  11. Hype/Virality Score     - Multi-Signal Custom
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * BENÖTIGTE API KEYS (in .env Datei):
 *   HUGGINGFACE_API_KEY=hf_xxxxx    # Hugging Face (kostenlos: huggingface.co)
 *   YOUTUBE_API_KEY=AIza...          # Google Cloud (optional)
 * 
 * Usage:
 *   node wm2026-sentiment-complete.js                 # Incremental
 *   node wm2026-sentiment-complete.js --full          # Full fetch from WM draw
 *   node wm2026-sentiment-complete.js --export        # Export after analysis
 *   node wm2026-sentiment-complete.js --dry-run       # Test without DB writes
 *   node wm2026-sentiment-complete.js --skip-fetch    # Only analyze existing
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Supabase
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  
  // Hugging Face (KOSTENLOS - https://huggingface.co/settings/tokens)
  HF_API_URL: 'https://api-inference.huggingface.co/models',
  HF_API_KEY: process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || '',
  
  // YouTube (OPTIONAL - https://console.cloud.google.com)
  YOUTUBE_KEY: process.env.YOUTUBE_API_KEY || '',
  
  // WM 2026 Auslosung - 5. Dezember 2025
  WM_DRAW_DATE: '2025-12-05T00:00:00Z',
  
  // Rolling Window
  ROLLING_WINDOW_DAYS: 7,
  
  // Request delays (ms)
  REQUEST_DELAY_MS: 200,
  API_DELAY_MS: 350,
  BATCH_DELAY_MS: 2500,
  
  // Batch sizes
  ANALYSIS_BATCH_SIZE: 8,
  
  // Output
  OUTPUT_DIR: './wm2026-data',
  
  // AI MODELS
  MODELS: {
    LANGUAGE_DETECTION: 'papluca/xlm-roberta-base-language-detection',
    SENTIMENT: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
    TOPIC_ZERO_SHOT: 'facebook/bart-large-mnli',
    EMOTION: 'SamLowe/roberta-base-go_emotions',
    NER: 'Davlan/xlm-roberta-base-ner-hrl',
    TOXICITY: 'unitary/toxic-bert',
    KEYWORDS: 'ml6team/keyphrase-extraction-kbir-inspec',
    SUMMARIZATION: 'facebook/bart-large-cnn',
  },
  
  TOPIC_CATEGORIES: [
    'tickets and pricing', 'match schedule and fixtures', 'team news and squad',
    'player transfer and rumors', 'stadium and venue', 'travel and accommodation',
    'fan experience', 'qualification and standings', 'sponsorship and business',
    'broadcast and media', 'infrastructure and construction', 'security and safety',
    'cultural events', 'controversy and criticism', 'celebration and hype',
  ],
  
  ASPECT_CATEGORIES: [
    'tickets', 'stadiums', 'teams', 'players', 'organization',
    'travel', 'atmosphere', 'prices', 'safety', 'experience',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// WM 2026 KEYWORDS - 32 LANGUAGES
// ═══════════════════════════════════════════════════════════════════════════

const WM_KEYWORDS = {
  en: ['World Cup 2026', 'FIFA 2026', 'WC 2026', 'USA Canada Mexico 2026', 'FIFA World Cup 2026',
       '2026 World Cup draw', '2026 World Cup tickets', '2026 World Cup qualifiers',
       'USMNT 2026', 'World Cup Atlanta', 'World Cup Miami', 'World Cup Los Angeles',
       'MetLife Stadium 2026', 'SoFi Stadium World Cup', 'Estadio Azteca 2026',
       'Messi World Cup 2026', 'Mbappe 2026', 'Pulisic World Cup'],
  de: ['WM 2026', 'Weltmeisterschaft 2026', 'Fußball WM 2026', 'FIFA WM 2026',
       'WM Tickets 2026', 'WM Qualifikation 2026', 'DFB WM 2026',
       'WM Auslosung 2026', 'Musiala WM', 'Wirtz WM 2026'],
  es: ['Mundial 2026', 'Copa del Mundo 2026', 'FIFA 2026', 'Copa Mundial 2026',
       'Eliminatorias 2026', 'México 2026', 'Estadio Azteca Mundial'],
  fr: ['Coupe du Monde 2026', 'Mondial 2026', 'FIFA 2026', 'CDM 2026',
       'Qualifications 2026', 'Mbappé Coupe du Monde'],
  pt: ['Copa do Mundo 2026', 'Mundial 2026', 'FIFA 2026', 'Copa 2026',
       'Eliminatórias 2026', 'Seleção Brasileira 2026'],
  it: ['Mondiali 2026', 'Coppa del Mondo 2026', 'FIFA 2026', 'Qualificazioni 2026'],
  nl: ['WK 2026', 'Wereldkampioenschap 2026', 'FIFA 2026', 'Oranje WK 2026'],
  pl: ['Mistrzostwa Świata 2026', 'MŚ 2026', 'Mundial 2026', 'Reprezentacja 2026'],
  ru: ['Чемпионат мира 2026', 'ЧМ 2026', 'ФИФА 2026', 'Кубок мира 2026'],
  ar: ['كأس العالم 2026', 'مونديال 2026', 'فيفا 2026'],
  zh: ['2026年世界杯', '世界杯2026', 'FIFA世界杯2026'],
  ja: ['2026年ワールドカップ', 'W杯2026', 'FIFAワールドカップ2026'],
  ko: ['2026 월드컵', 'FIFA 월드컵 2026', '월드컵 예선 2026'],
  tr: ['Dünya Kupası 2026', 'FIFA 2026', '2026 Dünya Kupası'],
  id: ['Piala Dunia 2026', 'FIFA 2026', 'Kualifikasi Piala Dunia 2026'],
  vi: ['World Cup 2026', 'FIFA 2026', 'Vòng loại World Cup 2026'],
  th: ['ฟุตบอลโลก 2026', 'บอลโลก 2026', 'ฟีฟ่า 2026'],
  hi: ['फीफा विश्व कप 2026', 'विश्व कप 2026', 'फुटबॉल विश्व कप 2026'],
  uk: ['Чемпіонат світу 2026', 'ЧС 2026', 'ФІФА 2026'],
  el: ['Παγκόσμιο Κύπελλο 2026', 'Μουντιάλ 2026'],
  cs: ['Mistrovství světa 2026', 'MS 2026', 'FIFA 2026'],
  sv: ['VM 2026', 'Fotbolls-VM 2026', 'FIFA VM 2026'],
  da: ['VM 2026', 'Fodbold VM 2026'],
  no: ['VM 2026', 'Fotball VM 2026'],
  fi: ['MM 2026', 'Jalkapallon MM 2026'],
  ro: ['Cupa Mondială 2026', 'CM 2026'],
  hu: ['Világbajnokság 2026', 'VB 2026'],
  fa: ['جام جهانی 2026', 'فیفا 2026'],
  bn: ['বিশ্বকাপ 2026', 'ফিফা বিশ্বকাপ 2026'],
  sw: ['Kombe la Dunia 2026', 'FIFA 2026'],
  af: ['Wêreldbeker 2026', 'FIFA 2026'],
  is: ['HM 2026', 'Heimsmeistaramótið 2026'],
};

const LANG_COUNTRY_MAP = {
  en: 'US', de: 'DE', es: 'ES', fr: 'FR', pt: 'BR', it: 'IT',
  nl: 'NL', pl: 'PL', ru: 'RU', tr: 'TR', ar: 'SA', ja: 'JP',
  ko: 'KR', zh: 'CN', id: 'ID', vi: 'VN', th: 'TH', el: 'GR',
  cs: 'CZ', sv: 'SE', ro: 'RO', hu: 'HU', uk: 'UA', fa: 'IR',
  hi: 'IN', bn: 'BD', fi: 'FI', da: 'DK', no: 'NO', is: 'IS',
  sw: 'KE', af: 'ZA'
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY LISTS
// ═══════════════════════════════════════════════════════════════════════════

const HOST_CITIES = ['Atlanta', 'Boston', 'Dallas', 'Houston', 'Kansas City',
  'Los Angeles', 'Miami', 'New York', 'Philadelphia', 'San Francisco', 'Seattle',
  'Mexico City', 'Guadalajara', 'Monterrey', 'Toronto', 'Vancouver'];

const STADIUMS = ['Mercedes-Benz Stadium', 'Gillette Stadium', 'AT&T Stadium',
  'NRG Stadium', 'Arrowhead Stadium', 'SoFi Stadium', 'Hard Rock Stadium',
  'MetLife Stadium', 'Lincoln Financial Field', 'Levi\'s Stadium', 'Lumen Field',
  'Estadio Azteca', 'Estadio Akron', 'Estadio BBVA', 'BMO Field', 'BC Place'];

const PLAYERS = ['Lionel Messi', 'Kylian Mbappé', 'Erling Haaland', 'Jude Bellingham',
  'Vinicius Jr', 'Harry Kane', 'Mohamed Salah', 'Kevin De Bruyne', 'Christian Pulisic',
  'Alphonso Davies', 'Joshua Kimmich', 'Pedri', 'Son Heung-min', 'Jamal Musiala',
  'Florian Wirtz', 'Bukayo Saka', 'Phil Foden', 'Rodri', 'Lamine Yamal'];

const TEAMS = ['Germany', 'France', 'England', 'Spain', 'Brazil', 'Argentina',
  'Portugal', 'Netherlands', 'Belgium', 'Italy', 'USA', 'Mexico', 'Canada'];

const EXCLUSION_TERMS = ['dart', 'darts', 'pdc', 'cricket', 't20', 'basketball', 'nba',
  'handball', 'hockey', 'nhl', 'tennis', 'atp', 'wta', 'volleyball', 'rugby',
  'baseball', 'mlb', 'nfl', 'super bowl', 'formula 1', 'f1', 'boxing', 'ufc', 'golf'];

// ═══════════════════════════════════════════════════════════════════════════
// REDDIT SUBREDDITS
// ═══════════════════════════════════════════════════════════════════════════

const ALL_SUBREDDITS = [
  'soccer', 'football', 'worldcup', 'MLS', 'ussoccer', 'USMNT', 'LigaMX',
  'PremierLeague', 'Bundesliga', 'LaLiga', 'seriea', 'Ligue1',
  'reddevils', 'MCFC', 'LiverpoolFC', 'chelseafc', 'Gunners',
  'Barca', 'realmadrid', 'fcbayern', 'borussiadortmund', 'psg',
  'futebol', 'BocaJuniors', 'RiverPlate'
];

const REDDIT_SEARCH_TERMS = ['World Cup 2026', 'WM 2026', 'FIFA 2026', 'Mundial 2026'];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const icons = { info: 'ℹ️ ', success: '✅', error: '❌', warning: '⚠️ ',
    fetch: '📥', analyze: '🔬', db: '💾', stats: '📊', ai: '🧠' };
  console.log(`[${timestamp}] ${icons[type] || ''} ${message}`);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 32);
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  return mins < 60 ? `${mins}m ${seconds % 60}s` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function parseArgs() {
  const args = { full: false, export: false, dryRun: false, skipFetch: false };
  process.argv.slice(2).forEach(arg => {
    if (arg === '--full') args.full = true;
    if (arg === '--export') args.export = true;
    if (arg === '--dry-run') args.dryRun = true;
    if (arg === '--skip-fetch') args.skipFetch = true;
  });
  return args;
}

function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
}

function saveLocalBackup(filename, data) {
  ensureOutputDir();
  fs.writeFileSync(path.join(CONFIG.OUTPUT_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  log(`Backup: ${filename}`, 'success');
}

function isRelevantContent(text, title) {
  const combined = `${title} ${text}`.toLowerCase();
  const hasExclusionTerm = EXCLUSION_TERMS.some(term => combined.includes(term.toLowerCase()));
  const hasWMKeyword = Object.values(WM_KEYWORDS).flat().some(kw => combined.includes(kw.toLowerCase()));
  if (hasExclusionTerm && !hasWMKeyword) return false;
  const has2026OrWC = combined.includes('2026') || combined.includes('world cup') ||
    combined.includes('mundial') || combined.includes('wm ') || combined.includes('fifa');
  const hasFootballContext = ['soccer', 'football', 'fußball', 'fútbol', 'futebol', 'calcio', 'fifa', 'uefa']
    .some(term => combined.includes(term));
  return hasWMKeyword || (has2026OrWC && hasFootballContext);
}

function getSourceCategory(sourceType) {
  const socialTypes = ['reddit', 'youtube', 'mastodon', 'bluesky', 'twitter', 'x'];
  return socialTypes.includes(sourceType) ? 'social' : 'news';
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE
// ═══════════════════════════════════════════════════════════════════════════

let supabase = null;

function initSupabase() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      });
    }
  } catch (e) {}
  
  CONFIG.SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || CONFIG.SUPABASE_URL;
  CONFIG.SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || CONFIG.SUPABASE_KEY;
  CONFIG.HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || CONFIG.HF_API_KEY;
  CONFIG.YOUTUBE_KEY = process.env.YOUTUBE_API_KEY || CONFIG.YOUTUBE_KEY;
  
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
    throw new Error('Supabase credentials not found!');
  }
  
  if (!CONFIG.HF_API_KEY) {
    log('WARNING: No Hugging Face API key! Get one free at https://huggingface.co/settings/tokens', 'warning');
  }
  
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  log('Supabase initialized', 'success');
}

// ═══════════════════════════════════════════════════════════════════════════
// HUGGING FACE API
// ═══════════════════════════════════════════════════════════════════════════

async function callHuggingFaceAPI(model, inputs, options = {}) {
  if (!CONFIG.HF_API_KEY) return null;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${CONFIG.HF_API_URL}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs, ...options }),
      });
      
      if (response.status === 503) {
        const data = await response.json();
        const waitTime = data.estimated_time || 20;
        log(`Model ${model.split('/')[1]} loading, waiting ${waitTime}s...`, 'warning');
        await sleep(waitTime * 1000);
        continue;
      }
      
      if (response.status === 429) {
        log('Rate limited, waiting 60s...', 'warning');
        await sleep(60000);
        continue;
      }
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt < 3) await sleep(2000 * attempt);
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 1: GOOGLE NEWS RSS
// ═══════════════════════════════════════════════════════════════════════════

async function fetchGoogleNews(fromDate) {
  log('Fetching Google News RSS...', 'fetch');
  const articles = new Map();
  const languages = Object.keys(WM_KEYWORDS);
  
  for (const lang of languages) {
    const keywords = WM_KEYWORDS[lang];
    const country = LANG_COUNTRY_MAP[lang] || lang.toUpperCase();
    
    for (let i = 0; i < keywords.length; i++) {
      try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keywords[i])}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const text = await response.text();
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        
        for (const item of items) {
          const title = (item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
          const description = (item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '')
            .replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
          const pubDateStr = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
          const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '';
          
          if (!title || !link) continue;
          const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
          if (pubDate < fromDate) continue;
          
          const hash = generateHash(link);
          if (articles.has(hash)) continue;
          
          if (isRelevantContent(description, title)) {
            articles.set(hash, {
              external_id: hash, source_type: 'google_news', source_name: source || 'Google News',
              title: title.substring(0, 500), description: description.substring(0, 2000),
              url: link, published_at: pubDate.toISOString(), fetched_at: new Date().toISOString(),
              language: lang, country: country, keyword_matched: keywords[i],
            });
          }
        }
        await sleep(CONFIG.REQUEST_DELAY_MS);
      } catch (error) {}
    }
    process.stdout.write(`\r  ${lang.toUpperCase()}: ${articles.size} total...`);
  }
  console.log();
  log(`Google News: ${articles.size} articles from ${languages.length} languages`, 'success');
  return Array.from(articles.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 2: REDDIT (Public JSON - KEIN API KEY NÖTIG!)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchReddit(fromDate) {
  log(`Fetching Reddit (public JSON, kein API Key nötig)...`, 'fetch');
  const articles = new Map();
  
  for (const subreddit of ALL_SUBREDDITS) {
    for (const term of REDDIT_SEARCH_TERMS) {
      try {
        // Public JSON API - kein OAuth nötig!
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&restrict_sr=1&t=month`;
        
        const response = await fetch(url, {
          headers: { 'User-Agent': 'WM2026Bot/4.2 (Educational Project)' }
        });
        
        if (!response.ok) continue;
        const data = await response.json();
        
        for (const post of (data.data?.children || [])) {
          const item = post.data;
          const hash = generateHash(item.id);
          if (articles.has(hash)) continue;
          
          const pubDate = item.created_utc ? new Date(item.created_utc * 1000) : new Date();
          if (pubDate < fromDate) continue;
          
          if (isRelevantContent(item.selftext || '', item.title || '')) {
            articles.set(hash, {
              external_id: hash, source_type: 'reddit', source_name: `r/${item.subreddit}`,
              title: (item.title || '').substring(0, 500), 
              description: (item.selftext || '').substring(0, 2000),
              url: `https://www.reddit.com${item.permalink}`, 
              published_at: pubDate.toISOString(),
              fetched_at: new Date().toISOString(), 
              author: item.author,
              metadata: { score: item.score, comments: item.num_comments },
            });
          }
        }
        
        // Rate limit: 1 request per second for public API
        await sleep(1000);
      } catch (error) {}
    }
    process.stdout.write(`\r  Reddit: ${articles.size} posts...`);
  }
  console.log();
  log(`Reddit: ${articles.size} posts`, 'success');
  return Array.from(articles.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 3: YOUTUBE
// ═══════════════════════════════════════════════════════════════════════════

async function fetchYouTube(fromDate) {
  if (!CONFIG.YOUTUBE_KEY) { 
    log('YouTube: Kein API Key (optional)', 'warning'); 
    return []; 
  }
  
  log('Fetching YouTube...', 'fetch');
  const articles = new Map();
  const queries = ['World Cup 2026', 'WM 2026', 'FIFA 2026', 'Mundial 2026'];
  
  for (const query of queries) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=25&order=date&key=${CONFIG.YOUTUBE_KEY}`;
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      
      for (const item of (data.items || [])) {
        const snippet = item.snippet || {};
        const videoId = item.id?.videoId;
        if (!videoId) continue;
        
        const hash = generateHash(videoId);
        if (articles.has(hash)) continue;
        
        const pubDate = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date();
        if (pubDate < fromDate) continue;
        
        if (isRelevantContent(snippet.description || '', snippet.title || '')) {
          articles.set(hash, {
            external_id: hash, source_type: 'youtube', source_name: snippet.channelTitle || 'YouTube',
            title: (snippet.title || '').substring(0, 500), 
            description: (snippet.description || '').substring(0, 2000),
            url: `https://www.youtube.com/watch?v=${videoId}`, 
            image_url: snippet.thumbnails?.high?.url,
            published_at: pubDate.toISOString(), 
            fetched_at: new Date().toISOString(), 
            author: snippet.channelTitle,
          });
        }
      }
      await sleep(CONFIG.REQUEST_DELAY_MS);
    } catch (error) {}
  }
  log(`YouTube: ${articles.size} videos`, 'success');
  return Array.from(articles.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 4: MASTODON
// ═══════════════════════════════════════════════════════════════════════════

async function fetchMastodon(fromDate) {
  log('Fetching Mastodon...', 'fetch');
  const articles = new Map();
  const instances = ['mastodon.social', 'mastodon.online', 'mstdn.social'];
  const searchTerms = ['WorldCup2026', 'WM2026', 'FIFA2026', 'Mundial2026'];
  
  for (const instance of instances) {
    for (const term of searchTerms) {
      try {
        const url = `https://${instance}/api/v1/timelines/tag/${term}?limit=20`;
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) continue;
        const posts = await response.json();
        
        for (const post of posts) {
          const content = (post.content || '').replace(/<[^>]+>/g, '');
          const hash = generateHash(post.id);
          if (articles.has(hash)) continue;
          
          const pubDate = post.created_at ? new Date(post.created_at) : new Date();
          if (pubDate < fromDate) continue;
          
          if (isRelevantContent(content, '')) {
            articles.set(hash, {
              external_id: hash, source_type: 'mastodon', source_name: instance,
              title: content.substring(0, 100) + '...', description: content.substring(0, 2000),
              url: post.url || post.uri, published_at: pubDate.toISOString(),
              fetched_at: new Date().toISOString(), author: post.account?.username,
            });
          }
        }
        await sleep(CONFIG.REQUEST_DELAY_MS);
      } catch (error) {}
    }
  }
  log(`Mastodon: ${articles.size} posts`, 'success');
  return Array.from(articles.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 5: BLUESKY (Neuer API Endpoint)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchBluesky(fromDate) {
  log('Fetching Bluesky...', 'fetch');
  const articles = new Map();
  const searchTerms = ['world cup 2026', 'wm 2026', 'fifa 2026', 'mundial 2026'];
  
  for (const term of searchTerms) {
    try {
      // Neuer Search Endpoint
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=25&sort=latest`;
      const response = await fetch(url, { 
        headers: { 'Accept': 'application/json' } 
      });
      
      if (!response.ok) continue;
      const data = await response.json();
      
      for (const item of (data.posts || [])) {
        const text = item.record?.text || '';
        const hash = generateHash(item.uri || item.cid);
        if (articles.has(hash)) continue;
        
        const pubDate = item.record?.createdAt ? new Date(item.record.createdAt) : new Date();
        if (pubDate < fromDate) continue;
        
        if (isRelevantContent(text, '')) {
          const handle = item.author?.handle || 'unknown';
          const rkey = item.uri?.split('/').pop() || '';
          
          articles.set(hash, {
            external_id: hash, source_type: 'bluesky', source_name: 'Bluesky',
            title: text.substring(0, 100) + '...', description: text.substring(0, 2000),
            url: `https://bsky.app/profile/${handle}/post/${rkey}`,
            published_at: pubDate.toISOString(), 
            fetched_at: new Date().toISOString(), 
            author: handle,
          });
        }
      }
      await sleep(CONFIG.REQUEST_DELAY_MS);
    } catch (error) {
      // Bluesky API can be unstable
    }
  }
  log(`Bluesky: ${articles.size} posts`, 'success');
  return Array.from(articles.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// AI MODELS (1-11)
// ═══════════════════════════════════════════════════════════════════════════

async function detectLanguage(texts) {
  const results = await callHuggingFaceAPI(CONFIG.MODELS.LANGUAGE_DETECTION, texts);
  if (!results) return texts.map(() => ({ language: 'unknown', confidence: 0 }));
  return results.map(r => ({ language: r?.[0]?.label || 'unknown', confidence: r?.[0]?.score || 0 }));
}

async function analyzeSentiment(texts) {
  const results = await callHuggingFaceAPI(CONFIG.MODELS.SENTIMENT, texts);
  if (!results) return texts.map(() => ({ label: 'neutral', score: 0.5, positive: 0.33, negative: 0.33, neutral: 0.34 }));
  
  return results.map(result => {
    const scores = { positive: 0, negative: 0, neutral: 0 };
    if (Array.isArray(result)) {
      result.forEach(r => {
        const label = r.label.toLowerCase();
        if (label.includes('positive')) scores.positive = r.score;
        else if (label.includes('negative')) scores.negative = r.score;
        else scores.neutral = r.score;
      });
    }
    const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return { label: dominant[0], score: dominant[1], ...scores };
  });
}

async function classifyTopics(texts) {
  const results = [];
  for (const text of texts) {
    const result = await callHuggingFaceAPI(CONFIG.MODELS.TOPIC_ZERO_SHOT, text.substring(0, 512), {
      parameters: { candidate_labels: CONFIG.TOPIC_CATEGORIES, multi_label: true }
    });
    if (!result?.labels) {
      results.push({ primary_topic: 'general', topics: [], confidence: 0 });
    } else {
      const topics = result.labels.slice(0, 3).map((label, i) => ({ topic: label, score: result.scores[i] }));
      results.push({ primary_topic: topics[0]?.topic || 'general', topics, confidence: topics[0]?.score || 0 });
    }
    await sleep(CONFIG.API_DELAY_MS);
  }
  return results;
}

async function detectEmotions(texts) {
  const results = await callHuggingFaceAPI(CONFIG.MODELS.EMOTION, texts);
  if (!results) return texts.map(() => ({ joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, dominant: 'neutral' }));
  
  return results.map(result => {
    const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 };
    if (Array.isArray(result)) {
      result.forEach(r => {
        const label = r.label.toLowerCase();
        if (label in emotions) emotions[label] = r.score;
        else if (label === 'happiness' || label === 'happy') emotions.joy = r.score;
      });
    }
    const dominant = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
    return { ...emotions, dominant: dominant[0] };
  });
}

async function extractEntities(texts) {
  const hfResults = await callHuggingFaceAPI(CONFIG.MODELS.NER, texts);
  
  return texts.map((text, idx) => {
    const entities = { players: [], teams: [], stadiums: [], cities: [], organizations: [] };
    const textLower = text.toLowerCase();
    
    PLAYERS.forEach(p => { if (textLower.includes(p.toLowerCase())) entities.players.push(p); });
    TEAMS.forEach(t => { if (textLower.includes(t.toLowerCase())) entities.teams.push(t); });
    HOST_CITIES.forEach(c => { if (textLower.includes(c.toLowerCase())) entities.cities.push(c); });
    STADIUMS.forEach(s => { if (textLower.includes(s.toLowerCase())) entities.stadiums.push(s); });
    
    if (hfResults?.[idx] && Array.isArray(hfResults[idx])) {
      hfResults[idx].forEach(e => {
        if (e.entity_group === 'PER' && !entities.players.includes(e.word)) entities.players.push(e.word);
        else if (e.entity_group === 'ORG') entities.organizations.push(e.word);
        else if (e.entity_group === 'LOC') entities.cities.push(e.word);
      });
    }
    
    Object.keys(entities).forEach(k => { entities[k] = [...new Set(entities[k])].slice(0, 10); });
    return entities;
  });
}

async function detectToxicity(texts) {
  const results = await callHuggingFaceAPI(CONFIG.MODELS.TOXICITY, texts);
  if (!results) return texts.map(() => ({ is_toxic: false, toxicity_score: 0 }));
  
  return results.map(result => {
    let maxScore = 0;
    if (Array.isArray(result)) {
      result.forEach(r => {
        if (r.label?.toLowerCase() === 'toxic' || r.label?.toLowerCase() === 'hate') {
          maxScore = Math.max(maxScore, r.score);
        }
      });
    }
    return { is_toxic: maxScore > 0.5, toxicity_score: maxScore };
  });
}

async function extractKeywords(texts) {
  const results = [];
  for (const text of texts) {
    const result = await callHuggingFaceAPI(CONFIG.MODELS.KEYWORDS, text.substring(0, 800));
    if (!result || !Array.isArray(result)) {
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const counts = {};
      words.forEach(w => counts[w] = (counts[w] || 0) + 1);
      const topWords = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word]) => word);
      results.push({ keywords: topWords, count: topWords.length });
    } else {
      const keywords = result.slice(0, 10).map(item => item.word || item).filter(Boolean);
      results.push({ keywords, count: keywords.length });
    }
    await sleep(CONFIG.API_DELAY_MS);
  }
  return results;
}

async function summarizeTexts(texts) {
  const results = [];
  for (const text of texts) {
    if (text.length < 200) {
      results.push({ summary: text.substring(0, 150), length: text.length });
      continue;
    }
    const result = await callHuggingFaceAPI(CONFIG.MODELS.SUMMARIZATION, text.substring(0, 1024), {
      parameters: { max_length: 130, min_length: 30, do_sample: false }
    });
    if (!result || !result[0]?.summary_text) {
      results.push({ summary: text.substring(0, 150) + '...', length: text.length });
    } else {
      results.push({ summary: result[0].summary_text, length: text.length });
    }
    await sleep(CONFIG.API_DELAY_MS);
  }
  return results;
}

async function analyzeAspectSentiment(texts, sentiments) {
  // Simplified: use overall sentiment for mentioned aspects
  return texts.map((text, idx) => {
    const aspectScores = {};
    const textLower = text.toLowerCase();
    
    for (const aspect of CONFIG.ASPECT_CATEGORIES) {
      if (textLower.includes(aspect)) {
        // Use overall sentiment for this aspect
        aspectScores[aspect] = sentiments[idx]?.positive - sentiments[idx]?.negative || 0;
      } else {
        aspectScores[aspect] = null;
      }
    }
    
    const mentionedAspects = Object.entries(aspectScores).filter(([, v]) => v !== null).map(([k]) => k);
    const validScores = Object.values(aspectScores).filter(v => v !== null);
    const avgScore = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
    
    return { aspects: aspectScores, mentioned_aspects: mentionedAspects, average_aspect_sentiment: avgScore };
  });
}

function detectControversy(text, sentiment, emotions, toxicity) {
  let score = 0;
  const signals = [];
  
  if (sentiment.negative > 0.6) { score += 0.3; signals.push('strong_negative'); }
  if (emotions.anger > 0.3) { score += 0.2; signals.push('high_anger'); }
  if (emotions.fear > 0.3) { score += 0.15; signals.push('high_fear'); }
  if (toxicity.is_toxic) { score += 0.3; signals.push('toxic_content'); }
  
  const controversialTerms = ['scandal', 'controversy', 'corrupt', 'protest', 'boycott',
    'racism', 'racist', 'fraud', 'bribe', 'outrage', 'disgrace', 'disaster'];
  const found = controversialTerms.filter(t => text.toLowerCase().includes(t));
  if (found.length > 0) {
    score += 0.15 * Math.min(found.length, 4);
    signals.push(`controversial_terms:${found.join(',')}`);
  }
  
  return { is_controversial: score > 0.5, controversy_score: Math.min(score, 1), signals };
}

function predictHypeScore(text, sentiment, emotions, entities) {
  let score = 0;
  const factors = [];
  
  if (sentiment.positive > 0.7) { score += 0.2; factors.push('very_positive'); }
  else if (sentiment.positive > 0.5) { score += 0.1; factors.push('positive'); }
  if (emotions.joy > 0.4) { score += 0.15; factors.push('high_joy'); }
  if (emotions.surprise > 0.3) { score += 0.1; factors.push('surprise'); }
  if (entities.players.length >= 3) { score += 0.2; factors.push('multiple_stars'); }
  else if (entities.players.length >= 1) { score += 0.1; factors.push('star_player'); }
  if (entities.stadiums.length > 0) { score += 0.1; factors.push('stadium_mentioned'); }
  
  const hypeTerms = ['amazing', 'incredible', 'historic', 'legendary', 'epic', 'breaking',
    'exclusive', 'confirmed', 'official', 'massive', 'sensational', 'spectacular'];
  const found = hypeTerms.filter(t => text.toLowerCase().includes(t));
  if (found.length > 0) { score += 0.1 * Math.min(found.length, 4); factors.push(`hype_language:${found.length}`); }
  
  return { hype_score: Math.min(score, 1), is_viral_potential: score > 0.5, factors };
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

async function getLastRunDate() {
  try {
    const { data } = await supabase
      .from('wm2026_processing_log')
      .select('completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();
    if (data?.completed_at) return new Date(data.completed_at);
  } catch (e) {}
  return new Date(CONFIG.WM_DRAW_DATE);
}

async function getExistingHashes() {
  try {
    const { data, error } = await supabase.from('wm2026_articles').select('external_id');
    if (error) {
      log(`DB Error beim Lesen: ${error.message}`, 'error');
      return new Set();
    }
    return new Set((data || []).map(d => d.external_id));
  } catch (e) {
    log(`Exception: ${e.message}`, 'error');
    return new Set();
  }
}

async function saveArticles(articles, dryRun = false) {
  if (articles.length === 0) return { inserted: 0, duplicates: 0, errors: 0 };
  if (dryRun) { 
    log(`[DRY RUN] Would insert ${articles.length}`, 'db'); 
    return { inserted: articles.length, duplicates: 0, errors: 0 }; 
  }
  
  const existingHashes = await getExistingHashes();
  const newArticles = articles.filter(a => !existingHashes.has(a.external_id));
  const duplicates = articles.length - newArticles.length;
  
  if (newArticles.length === 0) { 
    log(`Keine neuen Artikel (${duplicates} Duplikate übersprungen)`, 'db'); 
    return { inserted: 0, duplicates, errors: 0 }; 
  }
  
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < newArticles.length; i += 100) {
    const batch = newArticles.slice(i, i + 100);
    
    try {
      const { data, error } = await supabase
        .from('wm2026_articles')
        .insert(batch)
        .select('id');
      
      if (error) {
        log(`Insert Error (Batch ${Math.floor(i/100)+1}): ${error.message}`, 'error');
        errors += batch.length;
      } else {
        inserted += data?.length || batch.length;
      }
    } catch (e) {
      log(`Exception: ${e.message}`, 'error');
      errors += batch.length;
    }
    
    await sleep(100);
  }
  
  log(`Inserted: ${inserted}, Duplicates: ${duplicates}, Errors: ${errors}`, 'db');
  return { inserted, duplicates, errors };
}

async function updateArticleAnalysis(articleId, analysis, dryRun = false) {
  if (dryRun) return;
  
  const updateData = {
    detected_language: analysis.language?.language,
    language_confidence: analysis.language?.confidence,
    sentiment_score: (analysis.sentiment.positive - analysis.sentiment.negative + 1) / 2,
    sentiment_label: analysis.sentiment.label,
    sentiment_positive: analysis.sentiment.positive,
    sentiment_negative: analysis.sentiment.negative,
    sentiment_neutral: analysis.sentiment.neutral,
    primary_topic: analysis.topic?.primary_topic,
    topic_confidence: analysis.topic?.confidence,
    emotion_joy: analysis.emotions.joy,
    emotion_anger: analysis.emotions.anger,
    emotion_fear: analysis.emotions.fear,
    emotion_sadness: analysis.emotions.sadness,
    emotion_surprise: analysis.emotions.surprise,
    emotion_disgust: analysis.emotions.disgust,
    dominant_emotion: analysis.emotions.dominant,
    entities_players: analysis.entities.players,
    entities_teams: analysis.entities.teams,
    entities_stadiums: analysis.entities.stadiums,
    entities_cities: analysis.entities.cities,
    entities_organizations: analysis.entities.organizations,
    is_toxic: analysis.toxicity.is_toxic,
    toxicity_score: analysis.toxicity.toxicity_score,
    extracted_keywords: analysis.keywords?.keywords,
    summary: analysis.summary?.summary,
    aspect_sentiments: analysis.aspectSentiment?.aspects,
    mentioned_aspects: analysis.aspectSentiment?.mentioned_aspects,
    is_controversial: analysis.controversy.is_controversial,
    controversy_score: analysis.controversy.controversy_score,
    controversy_signals: analysis.controversy.signals,
    hype_score: analysis.hype.hype_score,
    is_viral_potential: analysis.hype.is_viral_potential,
    hype_factors: analysis.hype.factors,
    is_processed: true,
    processed_at: new Date().toISOString(),
  };
  
  await supabase.from('wm2026_articles').update(updateData).eq('id', articleId);
}

async function calculateRollingAggregation(dryRun = false) {
  log('Calculating rolling 7-day aggregation with ALL 11 models...', 'stats');
  
  const today = new Date();
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - CONFIG.ROLLING_WINDOW_DAYS);
  
  const { data: articles, error } = await supabase
    .from('wm2026_articles')
    .select('*')
    .eq('is_processed', true)
    .gte('published_at', windowStart.toISOString());
  
  if (error || !articles || articles.length === 0) {
    log('Keine verarbeiteten Artikel für Aggregation', 'warning');
    return null;
  }
  
  const count = articles.length;
  
  // Nach Quelle trennen
  const newsArticles = articles.filter(a => getSourceCategory(a.source_type) === 'news');
  const socialArticles = articles.filter(a => getSourceCategory(a.source_type) === 'social');
  
  // Sentiment berechnen
  const sentimentSum = articles.reduce((sum, a) => sum + (a.sentiment_score || 0.5), 0);
  const newsSentimentSum = newsArticles.reduce((sum, a) => sum + (a.sentiment_score || 0.5), 0);
  const socialSentimentSum = socialArticles.reduce((sum, a) => sum + (a.sentiment_score || 0.5), 0);
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL 1: LANGUAGE DETECTION - Top Languages
  // ═══════════════════════════════════════════════════════════════════════
  const langCounts = {};
  articles.forEach(a => {
    const lang = a.detected_language || a.language || 'unknown';
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });
  const topLanguages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lang, cnt]) => ({ lang, count: cnt, percent: ((cnt / count) * 100).toFixed(1) }));
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL 3: TOPIC CLASSIFICATION - Top Topics
  // ═══════════════════════════════════════════════════════════════════════
  const topicCounts = {};
  articles.forEach(a => {
    const topic = a.primary_topic || 'general';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, cnt]) => ({ topic, count: cnt, percent: ((cnt / count) * 100).toFixed(1) }));
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL 4: EMOTIONS - Dominant Emotion Distribution
  // ═══════════════════════════════════════════════════════════════════════
  const emotionCounts = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, neutral: 0 };
  articles.forEach(a => {
    const dom = a.dominant_emotion || 'neutral';
    if (dom in emotionCounts) emotionCounts[dom]++;
    else emotionCounts.neutral++;
  });
  const dominantEmotionDist = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, cnt]) => ({ emotion, count: cnt, percent: ((cnt / count) * 100).toFixed(1) }));
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL 5: NAMED ENTITIES - Top Players, Teams, Cities, Stadiums
  // ═══════════════════════════════════════════════════════════════════════
  const playerCounts = {};
  const teamCounts = {};
  const cityCounts = {};
  const stadiumCounts = {};
  
  articles.forEach(a => {
    (a.entities_players || []).forEach(p => { playerCounts[p] = (playerCounts[p] || 0) + 1; });
    (a.entities_teams || []).forEach(t => { teamCounts[t] = (teamCounts[t] || 0) + 1; });
    (a.entities_cities || []).forEach(c => { cityCounts[c] = (cityCounts[c] || 0) + 1; });
    (a.entities_stadiums || []).forEach(s => { stadiumCounts[s] = (stadiumCounts[s] || 0) + 1; });
  });
  
  const topPlayers = Object.entries(playerCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topTeams = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topStadiums = Object.entries(stadiumCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL 7: KEYWORDS - Top Keywords across all articles
  // ═══════════════════════════════════════════════════════════════════════
  const keywordCounts = {};
  articles.forEach(a => {
    (a.extracted_keywords || []).forEach(k => { 
      const kw = k.toLowerCase();
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1; 
    });
  });
  const topKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL 8: SUMMARIZATION - Count
  // ═══════════════════════════════════════════════════════════════════════
  const summaryCount = articles.filter(a => a.summary && a.summary.length > 20).length;
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL 9: ASPECT-BASED SENTIMENT - Average per Aspect
  // ═══════════════════════════════════════════════════════════════════════
  const aspectSums = {};
  const aspectCounts = {};
  CONFIG.ASPECT_CATEGORIES.forEach(asp => { aspectSums[asp] = 0; aspectCounts[asp] = 0; });
  
  articles.forEach(a => {
    const aspects = a.aspect_sentiments || {};
    Object.entries(aspects).forEach(([asp, val]) => {
      if (val !== null && asp in aspectSums) {
        aspectSums[asp] += val;
        aspectCounts[asp]++;
      }
    });
  });
  
  const aspectAvg = {};
  Object.keys(aspectSums).forEach(asp => {
    aspectAvg[asp] = aspectCounts[asp] > 0 ? (aspectSums[asp] / aspectCounts[asp]) : null;
  });
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL 10 & 11: CONTROVERSY & HYPE - Top Signals/Factors
  // ═══════════════════════════════════════════════════════════════════════
  const controversySignals = {};
  const hypeFactors = {};
  
  articles.forEach(a => {
    (a.controversy_signals || []).forEach(s => { 
      const sig = s.split(':')[0];
      controversySignals[sig] = (controversySignals[sig] || 0) + 1; 
    });
    (a.hype_factors || []).forEach(f => { 
      const fac = f.split(':')[0];
      hypeFactors[fac] = (hypeFactors[fac] || 0) + 1; 
    });
  });
  
  const topControversySignals = Object.entries(controversySignals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topHypeFactors = Object.entries(hypeFactors).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  // ═══════════════════════════════════════════════════════════════════════
  // BUILD COMPLETE STATS OBJECT
  // ═══════════════════════════════════════════════════════════════════════
  const stats = {
    date: today.toISOString().split('T')[0],
    window_days: CONFIG.ROLLING_WINDOW_DAYS,
    article_count: count,
    
    // Nach Quelle
    news_count: newsArticles.length,
    social_count: socialArticles.length,
    google_count: articles.filter(a => a.source_type === 'google_news').length,
    reddit_count: articles.filter(a => a.source_type === 'reddit').length,
    youtube_count: articles.filter(a => a.source_type === 'youtube').length,
    mastodon_count: articles.filter(a => a.source_type === 'mastodon').length,
    bluesky_count: articles.filter(a => a.source_type === 'bluesky').length,
    
    // Model 1: Languages
    top_languages: topLanguages,
    
    // Model 2: Sentiment Overall
    sentiment_avg: sentimentSum / count,
    sentiment_positive_count: articles.filter(a => a.sentiment_label === 'positive').length,
    sentiment_negative_count: articles.filter(a => a.sentiment_label === 'negative').length,
    sentiment_neutral_count: articles.filter(a => a.sentiment_label === 'neutral').length,
    news_sentiment_avg: newsArticles.length > 0 ? newsSentimentSum / newsArticles.length : 0.5,
    social_sentiment_avg: socialArticles.length > 0 ? socialSentimentSum / socialArticles.length : 0.5,
    
    // Model 3: Topics
    top_topics: topTopics,
    
    // Model 4: Emotions
    emotion_joy_avg: articles.reduce((sum, a) => sum + (a.emotion_joy || 0), 0) / count,
    emotion_anger_avg: articles.reduce((sum, a) => sum + (a.emotion_anger || 0), 0) / count,
    emotion_fear_avg: articles.reduce((sum, a) => sum + (a.emotion_fear || 0), 0) / count,
    emotion_sadness_avg: articles.reduce((sum, a) => sum + (a.emotion_sadness || 0), 0) / count,
    emotion_surprise_avg: articles.reduce((sum, a) => sum + (a.emotion_surprise || 0), 0) / count,
    emotion_disgust_avg: articles.reduce((sum, a) => sum + (a.emotion_disgust || 0), 0) / count,
    dominant_emotion_distribution: dominantEmotionDist,
    
    // Model 5: Entities
    top_players: topPlayers,
    top_teams: topTeams,
    top_cities: topCities,
    top_stadiums: topStadiums,
    
    // Model 6: Toxicity
    toxicity_rate: articles.filter(a => a.is_toxic).length / count,
    toxic_count: articles.filter(a => a.is_toxic).length,
    
    // Model 7: Keywords
    top_keywords: topKeywords,
    
    // Model 8: Summaries
    summary_count: summaryCount,
    
    // Model 9: Aspect Sentiment
    aspect_sentiment_avg: aspectAvg,
    
    // Model 10: Controversy
    controversy_rate: articles.filter(a => a.is_controversial).length / count,
    controversy_count: articles.filter(a => a.is_controversial).length,
    top_controversy_signals: topControversySignals,
    
    // Model 11: Hype
    hype_avg: articles.reduce((sum, a) => sum + (a.hype_score || 0), 0) / count,
    viral_potential_count: articles.filter(a => a.is_viral_potential).length,
    top_hype_factors: topHypeFactors,
  };
  
  if (!dryRun) {
    await supabase.from('wm2026_daily_sentiment').upsert(
      { date: stats.date, ...stats }, 
      { onConflict: 'date' }
    );
  }
  
  return stats;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

async function runPipeline() {
  const startTime = Date.now();
  const args = parseArgs();
  const dryRun = args.dryRun;
  
  const totalKeywords = Object.values(WM_KEYWORDS).reduce((sum, kw) => sum + kw.length, 0);
  const totalLanguages = Object.keys(WM_KEYWORDS).length;
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║        🏆 WM2026 COMPLETE SENTIMENT ANALYSIS PIPELINE v4.2 🏆            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  📥 SOURCES (5 - alle kostenlos):                                        ║
║     • Google News RSS     - kein API Key nötig                           ║
║     • Reddit              - kein API Key nötig (public JSON)             ║
║     • YouTube             - Google API Key (optional)                    ║
║     • Mastodon            - kein API Key nötig                           ║
║     • Bluesky             - kein API Key nötig                           ║
║                                                                           ║
║  🗣️  LANGUAGES: ${String(totalLanguages).padEnd(2)} (${totalKeywords}+ keywords)                                  ║
║                                                                           ║
║  🧠 AI MODELS (11 - Hugging Face kostenlos):                             ║
║     1. Language Detection      7. Keyword Extraction                     ║
║     2. Sentiment Analysis      8. Summarization                          ║
║     3. Topic Classification    9. Aspect-Based Sentiment                 ║
║     4. Emotion Detection      10. Controversy Detection                  ║
║     5. Named Entity Rec.      11. Hype/Virality Score                    ║
║     6. Toxicity Detection                                                ║
║                                                                           ║
║  ✨ NEU: Analysiert ALLE gefetchten Artikel (auch ohne DB)               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
  
  if (dryRun) log('🔸 DRY RUN MODE - keine DB-Schreibvorgänge', 'warning');
  
  initSupabase();
  
  const results = {
    mode: args.full ? 'full' : 'incremental',
    fetch: { google: 0, reddit: 0, youtube: 0, mastodon: 0, bluesky: 0, total: 0, new: 0, duplicates: 0, errors: 0 },
    analysis: { processed: 0, failed: 0 },
    models_used: 11,
  };
  
  // PHASE 1: FETCH
  let allFetchedArticles = [];
  
  if (!args.skipFetch) {
    console.log('\n' + '═'.repeat(75));
    log('PHASE 1: Fetching from all 5 sources', 'fetch');
    console.log('═'.repeat(75));
    
    const fromDate = args.full ? new Date(CONFIG.WM_DRAW_DATE) : await getLastRunDate();
    log(`From: ${fromDate.toISOString().split('T')[0]}`, 'info');
    
    const googleArticles = await fetchGoogleNews(fromDate);
    const redditArticles = await fetchReddit(fromDate);
    const youtubeArticles = await fetchYouTube(fromDate);
    const mastodonArticles = await fetchMastodon(fromDate);
    const blueskyArticles = await fetchBluesky(fromDate);
    
    results.fetch.google = googleArticles.length;
    results.fetch.reddit = redditArticles.length;
    results.fetch.youtube = youtubeArticles.length;
    results.fetch.mastodon = mastodonArticles.length;
    results.fetch.bluesky = blueskyArticles.length;
    
    allFetchedArticles = [...googleArticles, ...redditArticles, ...youtubeArticles, ...mastodonArticles, ...blueskyArticles];
    results.fetch.total = allFetchedArticles.length;
    
    const saveResult = await saveArticles(allFetchedArticles, dryRun);
    results.fetch.new = saveResult.inserted;
    results.fetch.duplicates = saveResult.duplicates;
    results.fetch.errors = saveResult.errors;
    
    // Wenn Insert fehlgeschlagen, Warnung ausgeben
    if (saveResult.inserted === 0 && allFetchedArticles.length > 0 && saveResult.duplicates === 0) {
      log('⚠️  WARNUNG: Keine Artikel in DB eingefügt! Analyse erfolgt aus Memory.', 'warning');
    }
  }
  
  // PHASE 2: AI ANALYSIS
  console.log('\n' + '═'.repeat(75));
  log('PHASE 2: AI Analysis with ALL 11 Models', 'ai');
  console.log('═'.repeat(75));
  
  // Artikel für Analyse sammeln - ENTWEDER aus DB ODER aus Memory
  let articlesToAnalyze = [];
  
  // Zuerst: Versuche unverarbeitete aus DB zu laden
  const { data: unprocessedFromDB } = await supabase
    .from('wm2026_articles')
    .select('id, title, description, source_type')
    .eq('is_processed', false)
    .order('published_at', { ascending: false })
    .limit(1000);
  
  if (unprocessedFromDB && unprocessedFromDB.length > 0) {
    articlesToAnalyze = unprocessedFromDB;
    log(`${articlesToAnalyze.length} unverarbeitete Artikel aus DB geladen`, 'info');
  }
  
  // Falls DB leer oder Insert fehlgeschlagen: Analysiere die gefetchten Artikel direkt!
  if (articlesToAnalyze.length === 0 && allFetchedArticles && allFetchedArticles.length > 0) {
    log(`DB leer - analysiere ${allFetchedArticles.length} gefetchte Artikel direkt aus Memory!`, 'warning');
    articlesToAnalyze = allFetchedArticles.map(a => ({
      id: a.external_id,
      title: a.title,
      description: a.description,
      source_type: a.source_type,
      _fromMemory: true  // Marker dass nicht aus DB
    }));
  }
  
  if (articlesToAnalyze.length === 0) {
    log('Keine Artikel zum Analysieren gefunden!', 'error');
  } else {
    log(`Analyzing ${articlesToAnalyze.length} articles...`, 'ai');
    
    // Sammle alle Analysen für Memory-Export
    const analyzedInMemory = [];
    
    for (let i = 0; i < articlesToAnalyze.length; i += CONFIG.ANALYSIS_BATCH_SIZE) {
      const batch = articlesToAnalyze.slice(i, i + CONFIG.ANALYSIS_BATCH_SIZE);
      const batchNum = Math.floor(i / CONFIG.ANALYSIS_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(articlesToAnalyze.length / CONFIG.ANALYSIS_BATCH_SIZE);
      
      log(`Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`, 'ai');
      
      const texts = batch.map(a => `${a.title} ${a.description || ''}`.substring(0, 512));
      
      log('  → Models 1-6: Language, Sentiment, Topics, Emotions, Entities, Toxicity...', 'ai');
      const languages = await detectLanguage(texts);
      const sentiments = await analyzeSentiment(texts);
      const topics = await classifyTopics(texts);
      const emotions = await detectEmotions(texts);
      const entities = await extractEntities(texts);
      const toxicities = await detectToxicity(texts);
      
      log('  → Models 7-9: Keywords, Summaries, Aspects...', 'ai');
      const keywords = await extractKeywords(texts);
      const summaries = await summarizeTexts(texts);
      const aspectSentiments = await analyzeAspectSentiment(texts, sentiments);
      
      log('  → Models 10-11: Controversy & Hype...', 'ai');
      
      for (let j = 0; j < batch.length; j++) {
        const controversy = detectControversy(texts[j], sentiments[j], emotions[j], toxicities[j]);
        const hype = predictHypeScore(texts[j], sentiments[j], emotions[j], entities[j]);
        
        const analysisResult = {
          language: languages[j],
          sentiment: sentiments[j],
          topic: topics[j],
          emotions: emotions[j],
          entities: entities[j],
          toxicity: toxicities[j],
          keywords: keywords[j],
          summary: summaries[j],
          aspectSentiment: aspectSentiments[j],
          controversy,
          hype,
        };
        
        // In DB speichern wenn nicht aus Memory
        if (!batch[j]._fromMemory) {
          await updateArticleAnalysis(batch[j].id, analysisResult, dryRun);
        } else {
          // Für Memory-Export sammeln
          analyzedInMemory.push({
            ...batch[j],
            analysis: analysisResult
          });
        }
        
        results.analysis.processed++;
      }
      
      await sleep(CONFIG.BATCH_DELAY_MS);
    }
    
    // Wenn aus Memory analysiert: Lokaler Export
    if (analyzedInMemory.length > 0) {
      saveLocalBackup(`analyzed_full_${new Date().toISOString().split('T')[0]}.json`, {
        count: analyzedInMemory.length,
        articles: analyzedInMemory
      });
      log(`${analyzedInMemory.length} analysierte Artikel lokal gespeichert!`, 'success');
    }
  }
  
  // PHASE 3: AGGREGATION
  console.log('\n' + '═'.repeat(75));
  log('PHASE 3: Rolling 7-Day Aggregation', 'stats');
  console.log('═'.repeat(75));
  
  const aggregation = await calculateRollingAggregation(dryRun);
  
  // Log run
  if (!dryRun) {
    await supabase.from('wm2026_processing_log').insert({
      job_type: `pipeline_v4.2_${args.full ? 'full' : 'incremental'}`,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: Math.round((Date.now() - startTime) / 1000),
      items_processed: results.fetch.total,
      items_success: results.analysis.processed,
      status: 'completed',
      details: results,
    });
  }
  
  // FINAL SUMMARY
  const duration = Date.now() - startTime;
  
  console.log('\n' + '═'.repeat(75));
  console.log('                    📊 FINAL SUMMARY - ALL 11 MODELS');
  console.log('═'.repeat(75));
  
  // Helper für Top-Listen
  const formatTop = (arr, limit = 5) => {
    if (!arr || arr.length === 0) return 'keine Daten';
    return arr.slice(0, limit).map(([name, cnt]) => `${name} (${cnt})`).join(', ');
  };
  
  const formatTopObj = (arr, limit = 5) => {
    if (!arr || arr.length === 0) return 'keine Daten';
    return arr.slice(0, limit).map(item => `${item.lang || item.topic || item.emotion} (${item.percent}%)`).join(', ');
  };
  
  console.log(`
📥 FETCHING BY SOURCE:
   • Google News:  ${results.fetch.google} articles
   • Reddit:       ${results.fetch.reddit} posts
   • YouTube:      ${results.fetch.youtube} videos
   • Mastodon:     ${results.fetch.mastodon} posts
   • Bluesky:      ${results.fetch.bluesky} posts
   ──────────────────────────────────────────
   • TOTAL:        ${results.fetch.total} items
   • New inserted: ${results.fetch.new}
   • Duplicates:   ${results.fetch.duplicates}
   • Errors:       ${results.fetch.errors}

🧠 AI ANALYSIS: ${results.analysis.processed} articles processed

═══════════════════════════════════════════════════════════════════════════
                         📊 ROLLING ${CONFIG.ROLLING_WINDOW_DAYS}-DAY STATISTICS
═══════════════════════════════════════════════════════════════════════════

📰 ARTICLES BY SOURCE:
   • Total:        ${aggregation?.article_count || 0}
   • News:         ${aggregation?.news_count || 0} (Google: ${aggregation?.google_count || 0})
   • Social:       ${aggregation?.social_count || 0} (Reddit: ${aggregation?.reddit_count || 0}, YT: ${aggregation?.youtube_count || 0}, Mastodon: ${aggregation?.mastodon_count || 0}, Bluesky: ${aggregation?.bluesky_count || 0})

───────────────────────────────────────────────────────────────────────────
🗣️  MODEL 1: LANGUAGE DETECTION
───────────────────────────────────────────────────────────────────────────
   Top Languages: ${formatTopObj(aggregation?.top_languages, 6)}

───────────────────────────────────────────────────────────────────────────
📈 MODEL 2: SENTIMENT ANALYSIS
───────────────────────────────────────────────────────────────────────────
   Overall:       ${((aggregation?.sentiment_avg || 0.5) * 100).toFixed(1)}%
   News:          ${((aggregation?.news_sentiment_avg || 0.5) * 100).toFixed(1)}%
   Social Media:  ${((aggregation?.social_sentiment_avg || 0.5) * 100).toFixed(1)}%
   ──────────────────────────────────────────
   ✅ Positive:   ${aggregation?.sentiment_positive_count || 0}
   ❌ Negative:   ${aggregation?.sentiment_negative_count || 0}
   ⚪ Neutral:    ${aggregation?.sentiment_neutral_count || 0}

───────────────────────────────────────────────────────────────────────────
📋 MODEL 3: TOPIC CLASSIFICATION
───────────────────────────────────────────────────────────────────────────
   Top Topics: ${formatTopObj(aggregation?.top_topics, 5)}

───────────────────────────────────────────────────────────────────────────
😀 MODEL 4: EMOTION DETECTION
───────────────────────────────────────────────────────────────────────────
   Joy:      ${((aggregation?.emotion_joy_avg || 0) * 100).toFixed(1)}%
   Anger:    ${((aggregation?.emotion_anger_avg || 0) * 100).toFixed(1)}%
   Fear:     ${((aggregation?.emotion_fear_avg || 0) * 100).toFixed(1)}%
   Sadness:  ${((aggregation?.emotion_sadness_avg || 0) * 100).toFixed(1)}%
   Surprise: ${((aggregation?.emotion_surprise_avg || 0) * 100).toFixed(1)}%
   Disgust:  ${((aggregation?.emotion_disgust_avg || 0) * 100).toFixed(1)}%
   ──────────────────────────────────────────
   Distribution: ${formatTopObj(aggregation?.dominant_emotion_distribution, 4)}

───────────────────────────────────────────────────────────────────────────
👥 MODEL 5: NAMED ENTITY RECOGNITION
───────────────────────────────────────────────────────────────────────────
   ⚽ Players:  ${formatTop(aggregation?.top_players, 5)}
   🏳️ Teams:    ${formatTop(aggregation?.top_teams, 5)}
   🏟️ Stadiums: ${formatTop(aggregation?.top_stadiums, 4)}
   🏙️ Cities:   ${formatTop(aggregation?.top_cities, 5)}

───────────────────────────────────────────────────────────────────────────
☠️  MODEL 6: TOXICITY DETECTION
───────────────────────────────────────────────────────────────────────────
   Toxic Articles: ${aggregation?.toxic_count || 0} (${((aggregation?.toxicity_rate || 0) * 100).toFixed(1)}%)

───────────────────────────────────────────────────────────────────────────
🔑 MODEL 7: KEYWORD EXTRACTION
───────────────────────────────────────────────────────────────────────────
   Top Keywords: ${formatTop(aggregation?.top_keywords, 8)}

───────────────────────────────────────────────────────────────────────────
📝 MODEL 8: SUMMARIZATION
───────────────────────────────────────────────────────────────────────────
   Summaries Generated: ${aggregation?.summary_count || 0}

───────────────────────────────────────────────────────────────────────────
🎯 MODEL 9: ASPECT-BASED SENTIMENT
───────────────────────────────────────────────────────────────────────────`);

  // Aspect Sentiment formatieren
  const aspects = aggregation?.aspect_sentiment_avg || {};
  const aspectLines = Object.entries(aspects)
    .filter(([, v]) => v !== null)
    .map(([asp, val]) => {
      const sign = val >= 0 ? '+' : '';
      const emoji = val > 0.2 ? '😊' : val < -0.2 ? '😟' : '😐';
      return `   ${emoji} ${asp.padEnd(12)}: ${sign}${(val * 100).toFixed(0)}%`;
    });
  if (aspectLines.length > 0) {
    console.log(aspectLines.join('\n'));
  } else {
    console.log('   Keine Aspekt-Daten');
  }

  console.log(`
───────────────────────────────────────────────────────────────────────────
🔥 MODEL 10: CONTROVERSY DETECTION
───────────────────────────────────────────────────────────────────────────
   Controversy Rate: ${((aggregation?.controversy_rate || 0) * 100).toFixed(1)}%
   Controversial:    ${aggregation?.controversy_count || 0} articles
   Top Signals:      ${formatTop(aggregation?.top_controversy_signals, 4)}

───────────────────────────────────────────────────────────────────────────
🚀 MODEL 11: HYPE/VIRALITY SCORE
───────────────────────────────────────────────────────────────────────────
   Hype Average:     ${((aggregation?.hype_avg || 0) * 100).toFixed(1)}%
   Viral Potential:  ${aggregation?.viral_potential_count || 0} articles
   Top Factors:      ${formatTop(aggregation?.top_hype_factors, 4)}

═══════════════════════════════════════════════════════════════════════════
⏱️  DURATION: ${formatDuration(duration)}
═══════════════════════════════════════════════════════════════════════════
`);
  
  console.log('═'.repeat(75));
  
  saveLocalBackup(`run_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, { results, aggregation });
  
  if (args.export) {
    log('Exporting data...', 'db');
    const { data: allArticles } = await supabase.from('wm2026_articles').select('*').eq('is_processed', true);
    saveLocalBackup('export_full.json', { articles: allArticles, aggregation });
    log('Export completed!', 'success');
  }
  
  log('Pipeline completed successfully! 🎉', 'success');
}

runPipeline().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
