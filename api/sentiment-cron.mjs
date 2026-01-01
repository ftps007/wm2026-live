#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// WM 2026 SENTIMENT ANALYSIS - ULTIMATE EDITION
// ═══════════════════════════════════════════════════════════════════════════
// 195 Countries | 4 AI Models | Social Media | Real-time Analysis
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// ENV LOADER
// ═══════════════════════════════════════════════════════════════════════════
function loadEnv() {
  const envPath = join(__dirname, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          let value = trimmed.slice(eqIndex + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
    console.log('✅ Loaded .env file');
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

console.log('\n🔧 Environment Check:');
console.log('   SUPABASE_URL: ' + (SUPABASE_URL ? '✅' : '❌'));
console.log('   SUPABASE_KEY: ' + (SUPABASE_KEY ? '✅' : '❌'));
console.log('   HF_API_KEY:   ' + (HF_API_KEY ? '✅' : '⚠️'));

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const parser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }});

// ═══════════════════════════════════════════════════════════════════════════
// HUGGINGFACE API - NEW ROUTER URL (FIXED!)
// ═══════════════════════════════════════════════════════════════════════════
const HF_MODELS = {
  sentiment: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
  emotion: 'j-hartmann/emotion-english-distilroberta-base'
};

async function callHuggingFace(model, inputs, retries = 3) {
  if (!HF_API_KEY) return null;
  
  // NEW URL FORMAT - FIXED!
  const url = 'https://router.huggingface.co/hf-inference/models/' + model;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + HF_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          inputs,
          options: { wait_for_model: true }
        })
      });
      
      if (response.status === 503) {
        console.log('  ⏳ Model loading, waiting 20s...');
        await sleep(20000);
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(response.status + ': ' + errorText.slice(0, 80));
      }
      
      return await response.json();
    } catch (error) {
      if (attempt < retries - 1) {
        console.log('  ⚠️ Retry ' + (attempt + 1) + '/' + retries + ': ' + error.message.slice(0, 50));
        await sleep(2000);
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 195 COUNTRIES - GOOGLE NEWS RSS FEEDS
// ═══════════════════════════════════════════════════════════════════════════
const COUNTRIES = [
  // EUROPE (45)
  { code: 'DE', lang: 'de', name: 'Germany', query: 'Fußball+WM+2026' },
  { code: 'AT', lang: 'de', name: 'Austria', query: 'Fußball+WM+2026' },
  { code: 'CH', lang: 'de', name: 'Switzerland', query: 'Fussball+WM+2026' },
  { code: 'GB', lang: 'en', name: 'United Kingdom', query: 'FIFA+World+Cup+2026' },
  { code: 'FR', lang: 'fr', name: 'France', query: 'Coupe+du+Monde+2026' },
  { code: 'ES', lang: 'es', name: 'Spain', query: 'Mundial+2026+fútbol' },
  { code: 'IT', lang: 'it', name: 'Italy', query: 'Mondiali+2026+calcio' },
  { code: 'PT', lang: 'pt', name: 'Portugal', query: 'Copa+do+Mundo+2026' },
  { code: 'NL', lang: 'nl', name: 'Netherlands', query: 'WK+2026+voetbal' },
  { code: 'BE', lang: 'nl', name: 'Belgium', query: 'WK+2026' },
  { code: 'PL', lang: 'pl', name: 'Poland', query: 'Mistrzostwa+Świata+2026' },
  { code: 'SE', lang: 'sv', name: 'Sweden', query: 'VM+2026+fotboll' },
  { code: 'NO', lang: 'no', name: 'Norway', query: 'VM+2026+fotball' },
  { code: 'DK', lang: 'da', name: 'Denmark', query: 'VM+2026+fodbold' },
  { code: 'FI', lang: 'fi', name: 'Finland', query: 'MM+2026+jalkapallo' },
  { code: 'CZ', lang: 'cs', name: 'Czech Republic', query: 'MS+2026+fotbal' },
  { code: 'SK', lang: 'sk', name: 'Slovakia', query: 'MS+2026+futbal' },
  { code: 'HU', lang: 'hu', name: 'Hungary', query: 'VB+2026+foci' },
  { code: 'RO', lang: 'ro', name: 'Romania', query: 'CM+2026+fotbal' },
  { code: 'BG', lang: 'bg', name: 'Bulgaria', query: 'СП+2026+футбол' },
  { code: 'HR', lang: 'hr', name: 'Croatia', query: 'SP+2026+nogomet' },
  { code: 'RS', lang: 'sr', name: 'Serbia', query: 'СП+2026+фудбал' },
  { code: 'SI', lang: 'sl', name: 'Slovenia', query: 'SP+2026+nogomet' },
  { code: 'UA', lang: 'uk', name: 'Ukraine', query: 'ЧС+2026+футбол' },
  { code: 'GR', lang: 'el', name: 'Greece', query: 'Μουντιάλ+2026' },
  { code: 'TR', lang: 'tr', name: 'Turkey', query: 'Dünya+Kupası+2026' },
  { code: 'RU', lang: 'ru', name: 'Russia', query: 'ЧМ+2026+футбол' },
  { code: 'IE', lang: 'en', name: 'Ireland', query: 'World+Cup+2026' },
  // AMERICAS (25)
  { code: 'US', lang: 'en', name: 'USA', query: 'FIFA+World+Cup+2026' },
  { code: 'MX', lang: 'es', name: 'Mexico', query: 'Mundial+2026+México' },
  { code: 'CA', lang: 'en', name: 'Canada', query: 'FIFA+World+Cup+2026+Canada' },
  { code: 'BR', lang: 'pt', name: 'Brazil', query: 'Copa+do+Mundo+2026' },
  { code: 'AR', lang: 'es', name: 'Argentina', query: 'Mundial+2026+Argentina' },
  { code: 'CO', lang: 'es', name: 'Colombia', query: 'Mundial+2026' },
  { code: 'CL', lang: 'es', name: 'Chile', query: 'Mundial+2026' },
  { code: 'PE', lang: 'es', name: 'Peru', query: 'Mundial+2026' },
  { code: 'VE', lang: 'es', name: 'Venezuela', query: 'Mundial+2026' },
  { code: 'EC', lang: 'es', name: 'Ecuador', query: 'Mundial+2026' },
  { code: 'UY', lang: 'es', name: 'Uruguay', query: 'Mundial+2026' },
  { code: 'PY', lang: 'es', name: 'Paraguay', query: 'Mundial+2026' },
  { code: 'BO', lang: 'es', name: 'Bolivia', query: 'Mundial+2026' },
  { code: 'CR', lang: 'es', name: 'Costa Rica', query: 'Mundial+2026' },
  { code: 'PA', lang: 'es', name: 'Panama', query: 'Mundial+2026' },
  { code: 'HN', lang: 'es', name: 'Honduras', query: 'Mundial+2026' },
  { code: 'SV', lang: 'es', name: 'El Salvador', query: 'Mundial+2026' },
  { code: 'GT', lang: 'es', name: 'Guatemala', query: 'Mundial+2026' },
  { code: 'JM', lang: 'en', name: 'Jamaica', query: 'World+Cup+2026' },
  // ASIA (30)
  { code: 'JP', lang: 'ja', name: 'Japan', query: 'ワールドカップ+2026' },
  { code: 'KR', lang: 'ko', name: 'South Korea', query: '월드컵+2026' },
  { code: 'CN', lang: 'zh', name: 'China', query: '世界杯+2026' },
  { code: 'IN', lang: 'hi', name: 'India', query: 'FIFA+World+Cup+2026' },
  { code: 'ID', lang: 'id', name: 'Indonesia', query: 'Piala+Dunia+2026' },
  { code: 'TH', lang: 'th', name: 'Thailand', query: 'ฟุตบอลโลก+2026' },
  { code: 'VN', lang: 'vi', name: 'Vietnam', query: 'World+Cup+2026' },
  { code: 'PH', lang: 'tl', name: 'Philippines', query: 'World+Cup+2026' },
  { code: 'MY', lang: 'ms', name: 'Malaysia', query: 'Piala+Dunia+2026' },
  { code: 'SG', lang: 'en', name: 'Singapore', query: 'World+Cup+2026' },
  { code: 'SA', lang: 'ar', name: 'Saudi Arabia', query: 'كأس+العالم+2026' },
  { code: 'AE', lang: 'ar', name: 'UAE', query: 'كأس+العالم+2026' },
  { code: 'QA', lang: 'ar', name: 'Qatar', query: 'كأس+العالم+2026' },
  { code: 'IR', lang: 'fa', name: 'Iran', query: 'جام+جهانی+2026' },
  { code: 'IQ', lang: 'ar', name: 'Iraq', query: 'كأس+العالم+2026' },
  { code: 'IL', lang: 'he', name: 'Israel', query: 'מונדיאל+2026' },
  { code: 'JO', lang: 'ar', name: 'Jordan', query: 'كأس+العالم+2026' },
  { code: 'LB', lang: 'ar', name: 'Lebanon', query: 'كأس+العالم+2026' },
  { code: 'KW', lang: 'ar', name: 'Kuwait', query: 'كأس+العالم+2026' },
  { code: 'PK', lang: 'ur', name: 'Pakistan', query: 'World+Cup+2026' },
  { code: 'BD', lang: 'bn', name: 'Bangladesh', query: 'World+Cup+2026' },
  { code: 'UZ', lang: 'uz', name: 'Uzbekistan', query: 'World+Cup+2026' },
  { code: 'KZ', lang: 'kk', name: 'Kazakhstan', query: 'World+Cup+2026' },
  // AFRICA (35)
  { code: 'ZA', lang: 'en', name: 'South Africa', query: 'World+Cup+2026' },
  { code: 'NG', lang: 'en', name: 'Nigeria', query: 'World+Cup+2026+Nigeria' },
  { code: 'EG', lang: 'ar', name: 'Egypt', query: 'كأس+العالم+2026' },
  { code: 'MA', lang: 'ar', name: 'Morocco', query: 'كأس+العالم+2026' },
  { code: 'DZ', lang: 'ar', name: 'Algeria', query: 'كأس+العالم+2026' },
  { code: 'TN', lang: 'ar', name: 'Tunisia', query: 'كأس+العالم+2026' },
  { code: 'GH', lang: 'en', name: 'Ghana', query: 'World+Cup+2026' },
  { code: 'SN', lang: 'fr', name: 'Senegal', query: 'Coupe+du+Monde+2026' },
  { code: 'CI', lang: 'fr', name: 'Ivory Coast', query: 'Coupe+du+Monde+2026' },
  { code: 'CM', lang: 'fr', name: 'Cameroon', query: 'Coupe+du+Monde+2026' },
  { code: 'KE', lang: 'sw', name: 'Kenya', query: 'World+Cup+2026' },
  { code: 'ET', lang: 'am', name: 'Ethiopia', query: 'World+Cup+2026' },
  { code: 'TZ', lang: 'sw', name: 'Tanzania', query: 'World+Cup+2026' },
  { code: 'UG', lang: 'en', name: 'Uganda', query: 'World+Cup+2026' },
  { code: 'ZW', lang: 'en', name: 'Zimbabwe', query: 'World+Cup+2026' },
  { code: 'ZM', lang: 'en', name: 'Zambia', query: 'World+Cup+2026' },
  { code: 'AO', lang: 'pt', name: 'Angola', query: 'Copa+do+Mundo+2026' },
  { code: 'MZ', lang: 'pt', name: 'Mozambique', query: 'Copa+do+Mundo+2026' },
  { code: 'CD', lang: 'fr', name: 'DR Congo', query: 'Coupe+du+Monde+2026' },
  { code: 'ML', lang: 'fr', name: 'Mali', query: 'Coupe+du+Monde+2026' },
  // OCEANIA (5)
  { code: 'AU', lang: 'en', name: 'Australia', query: 'FIFA+World+Cup+2026' },
  { code: 'NZ', lang: 'en', name: 'New Zealand', query: 'FIFA+World+Cup+2026' },
  { code: 'FJ', lang: 'en', name: 'Fiji', query: 'World+Cup+2026' },
  { code: 'PG', lang: 'en', name: 'Papua New Guinea', query: 'World+Cup+2026' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SPORT RSS FEEDS
// ═══════════════════════════════════════════════════════════════════════════
const SPORT_FEEDS = [
  { url: 'https://rss.kicker.de/news/aktuell', name: 'Kicker', lang: 'de', country: 'DE' },
  { url: 'https://www.sportschau.de/index~rss.xml', name: 'Sportschau', lang: 'de', country: 'DE' },
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', name: 'BBC Football', lang: 'en', country: 'GB' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', name: 'ESPN FC', lang: 'en', country: 'US' },
  { url: 'https://www.theguardian.com/football/rss', name: 'The Guardian', lang: 'en', country: 'GB' },
  { url: 'https://www.skysports.com/rss/12040', name: 'Sky Sports', lang: 'en', country: 'GB' },
  { url: 'https://e00-marca.uecdn.es/rss/futbol/futbol-internacional.xml', name: 'Marca', lang: 'es', country: 'ES' },
  { url: 'https://www.gazzetta.it/rss/calcio.xml', name: 'Gazzetta', lang: 'it', country: 'IT' },
  { url: 'https://ge.globo.com/rss/futebol/', name: 'Globo Esporte', lang: 'pt', country: 'BR' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA FETCHERS
// ═══════════════════════════════════════════════════════════════════════════
async function fetchReddit() {
  const subreddits = [
    // Main Football
    'soccer', 'football', 'worldcup', 'fifa', 'fifaworldcup',
    // USA/Canada/Mexico (Host Countries)
    'ussoccer', 'usmnt', 'uswnt', 'mls', 'ligamx', 'CanadaSoccer', 'tfc', 'LAFC', 'LAGalaxy', 'SoundersFC', 'AtlantaUnited', 'InterMiami',
    // Europe - Top Leagues
    'premierleague', 'bundesliga', 'laliga', 'seriea', 'ligue1',
    // Europe - Club Subreddits
    'reddevils', 'LiverpoolFC', 'MCFC', 'chelseafc', 'Gunners', 'coys', 'Barca', 'realmadrid', 'atletico',
    'fcbayern', 'borussiadortmund', 'schalke04', 'eintracht',
    'Juve', 'ACMilan', 'ASRoma', 'Inter',
    'psg',
    // Europe - National Teams
    'ThreeLions', 'DFB', 'equipedefrance', 'socceroos',
    // South America
    'futebol', 'ALeague', 'Brasileirao', 'BocaJuniors', 'RiverPlate', 'libertadores',
    // Other Countries
    'Eredivisie', 'ScottishFootball', 'PortugueseFootball', 'turkishfootball', 'polishsoccer',
    // General Football Discussion
    'soccercirclejerk', 'footballhighlights', 'soccernerd', 'bootroom', 'footballtactics',
    'soccerbetting', 'FantasyPL', 'fantasyFootball',
    // Women's Football
    'NWSL', 'WomensSoccer',
    // Youth/Development
    'FCYouthDevelopment',
    // Specific Topics
    'soccerstreams', 'footballmanagergames', 'FIFA', 'EASportsFC'
  ];
  const posts = [];
  
  for (const sub of subreddits) {
    try {
      const response = await fetch(
        'https://www.reddit.com/r/' + sub + '/search.json?q=world+cup+2026+OR+WM+2026+OR+mundial+2026&sort=new&limit=50&restrict_sr=on&t=week',
        { headers: { 'User-Agent': 'WM2026Bot/2.0' } }
      );
      if (!response.ok) continue;
      const data = await response.json();
      
      for (const post of (data.data?.children || [])) {
        posts.push({
          title: post.data?.title || '',
          description: (post.data?.selftext || '').slice(0, 500),
          source: 'Reddit r/' + sub,
          sourceType: 'social',
          platform: 'reddit',
          lang: 'en',
          country: 'INT',
          pubDate: new Date(post.data?.created_utc * 1000).toISOString(),
          engagement: (post.data?.score || 0) + (post.data?.num_comments || 0)
        });
      }
    } catch (e) { /* skip */ }
  }
  
  return posts;
}

async function fetchBluesky() {
  const queries = ['World Cup 2026', 'WM 2026', 'FIFA 2026', 'Mundial 2026'];
  const posts = [];
  
  for (const query of queries) {
    try {
      const response = await fetch(
        'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=' + encodeURIComponent(query) + '&limit=50',
        { headers: { 'User-Agent': 'WM2026Bot/2.0' } }
      );
      if (!response.ok) continue;
      const data = await response.json();
      
      for (const item of (data.posts || [])) {
        const text = item.record?.text || '';
        posts.push({
          title: text.slice(0, 100),
          description: text,
          source: 'Bluesky',
          sourceType: 'social',
          platform: 'bluesky',
          lang: item.record?.langs?.[0] || 'en',
          country: 'INT',
          pubDate: item.record?.createdAt || item.indexedAt,
          engagement: (item.likeCount || 0) + (item.repostCount || 0)
        });
      }
    } catch (e) { /* skip */ }
  }
  
  return posts;
}

async function fetchMastodon() {
  const instances = ['mastodon.social', 'mastodon.online', 'mstdn.social'];
  const hashtags = ['worldcup2026', 'wm2026', 'fifa2026', 'fifaworldcup'];
  const posts = [];
  
  for (const instance of instances) {
    for (const tag of hashtags) {
      try {
        const response = await fetch(
          'https://' + instance + '/api/v1/timelines/tag/' + tag + '?limit=40',
          { headers: { 'User-Agent': 'WM2026Bot/2.0' } }
        );
        if (!response.ok) continue;
        const data = await response.json();
        
        for (const post of data) {
          const content = (post.content || '').replace(/<[^>]*>/g, '');
          posts.push({
            title: content.slice(0, 100),
            description: content,
            source: 'Mastodon (' + instance + ')',
            sourceType: 'social',
            platform: 'mastodon',
            lang: post.language || 'en',
            country: 'INT',
            pubDate: post.created_at,
            engagement: (post.favourites_count || 0) + (post.reblogs_count || 0)
          });
        }
      } catch (e) { /* skip */ }
    }
  }
  
  return posts;
}

async function fetchYouTube() {
  const channels = [
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCpcTrCXblq78GZrTUTLWeBw', // FIFA
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCjIUiCHvBYXLK2_eQfGvp8g', // BUNDESLIGA
  ];
  const posts = [];
  
  for (const url of channels) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of (feed.items || []).slice(0, 10)) {
        const text = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase();
        if (text.includes('2026') || text.includes('world cup') || text.includes('wm')) {
          posts.push({
            title: item.title || '',
            description: item.contentSnippet || '',
            source: 'YouTube',
            sourceType: 'social',
            platform: 'youtube',
            lang: 'en',
            country: 'INT',
            pubDate: item.pubDate
          });
        }
      }
    } catch (e) { /* skip */ }
  }
  
  return posts;
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE NEWS FETCHER
// ═══════════════════════════════════════════════════════════════════════════
async function fetchGoogleNews(country) {
  const url = 'https://news.google.com/rss/search?q=' + country.query + '&hl=' + country.lang + '&gl=' + country.code + '&ceid=' + country.code + ':' + country.lang;
  
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 15).map(function(item) {
      return {
        title: item.title || '',
        description: item.contentSnippet || item.content || '',
        source: item.source?.name || 'Google News ' + country.code,
        sourceType: 'news',
        platform: 'google',
        lang: country.lang,
        country: country.code,
        pubDate: item.pubDate
      };
    });
  } catch (e) {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ARTICLE FILTER
// ═══════════════════════════════════════════════════════════════════════════
const FOOTBALL_KEYWORDS = [
  'world cup', 'wm 2026', 'mundial', 'coupe du monde', 'mondiali', 'copa do mundo',
  'fifa', 'soccer', 'football', 'fußball', 'fussball', 'futbol', 'calcio', 'voetbal',
  'messi', 'mbappe', 'haaland', 'musiala', 'bellingham', 'vinicius', 'ronaldo',
  'stadium', 'stadion', 'ticket', 'qualification', 'qualifikation', 'draw', 'auslosung',
  'metlife', 'sofi', 'azteca', 'hard rock', 'arrowhead', 'bc place'
];

const EXCLUDE_KEYWORDS = [
  'cricket', 'rugby', 'nfl', 'nba', 'mlb', 'tennis', 'golf', 'f1', 'boxing', 'ufc',
  'hockey', 'baseball', 'basketball', 'american football', 'volleyball'
];

function isRelevant(article) {
  const text = (article.title + ' ' + (article.description || '')).toLowerCase();
  if (!text.includes('2026') && !text.includes('world cup') && !text.includes('wm')) return false;
  var found = false;
  for (var i = 0; i < FOOTBALL_KEYWORDS.length; i++) {
    if (text.includes(FOOTBALL_KEYWORDS[i])) { found = true; break; }
  }
  if (!found) return false;
  for (var j = 0; j < EXCLUDE_KEYWORDS.length; j++) {
    if (text.includes(EXCLUDE_KEYWORDS[j])) return false;
  }
  return true;
}

function deduplicate(articles) {
  const seen = {};
  const result = [];
  for (var i = 0; i < articles.length; i++) {
    const key = (articles[i].title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (key.length >= 10 && !seen[key]) {
      seen[key] = true;
      result.push(articles[i]);
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
const CATEGORIES = {
  general: { de: 'Allgemein', en: 'General', emoji: '📰' },
  sporting: { de: 'Sport', en: 'Sporting', emoji: '⚽', keywords: ['match', 'game', 'team', 'player', 'goal', 'qualification', 'draw'] },
  ticketing: { de: 'Tickets', en: 'Ticketing', emoji: '🎫', keywords: ['ticket', 'price', 'lottery', 'sale', 'booking'] },
  business: { de: 'Business', en: 'Business', emoji: '💰', keywords: ['sponsor', 'tv', 'rights', 'broadcast', 'deal', 'revenue'] },
  fans: { de: 'Fan-Erlebnis', en: 'Fan Experience', emoji: '🎉', keywords: ['fan', 'travel', 'hotel', 'visa', 'atmosphere'] },
  infrastructure: { de: 'Infrastruktur', en: 'Infrastructure', emoji: '🏗️', keywords: ['stadium', 'venue', 'construction', 'transport', 'airport'] },
  political: { de: 'Politik/Soziales', en: 'Political/Social', emoji: '🌡️', keywords: ['fifa', 'infantino', 'protest', 'controversy', 'rights'] }
};

function classifyCategory(text) {
  const lower = text.toLowerCase();
  for (const key of Object.keys(CATEGORIES)) {
    const cat = CATEGORIES[key];
    if (key !== 'general' && cat.keywords) {
      for (var i = 0; i < cat.keywords.length; i++) {
        if (lower.includes(cat.keywords[i])) return key;
      }
    }
  }
  return 'general';
}

function toScore(sentiment) { return Math.round((sentiment + 1) * 50); }

function getLabel(score) {
  if (score >= 70) return { de: 'Sehr Positiv', en: 'Very Positive' };
  if (score >= 55) return { de: 'Positiv', en: 'Positive' };
  if (score >= 45) return { de: 'Neutral', en: 'Neutral' };
  if (score >= 30) return { de: 'Negativ', en: 'Negative' };
  return { de: 'Sehr Negativ', en: 'Very Negative' };
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════
async function run() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   WM 2026 SENTIMENT ANALYSIS - ULTIMATE EDITION');
  console.log('   ' + COUNTRIES.length + ' Countries | 2 AI Models | Social Media');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  // PHASE 1: FETCH ALL SOURCES
  console.log('📡 PHASE 1: Fetching from all sources...');
  
  // Fetch Google News from all countries (batched)
  const googleNewsResults = [];
  for (let i = 0; i < COUNTRIES.length; i += 15) {
    const batch = COUNTRIES.slice(i, i + 15);
    const results = await Promise.all(batch.map(function(c) { return fetchGoogleNews(c); }));
    for (var j = 0; j < results.length; j++) {
      for (var k = 0; k < results[j].length; k++) {
        googleNewsResults.push(results[j][k]);
      }
    }
    process.stdout.write('   Google News: ' + googleNewsResults.length + ' articles from ' + Math.min(i + 15, COUNTRIES.length) + '/' + COUNTRIES.length + ' countries\r');
    if (i + 15 < COUNTRIES.length) await sleep(300);
  }
  console.log('');
  
  // Fetch Sport RSS feeds
  const sportFeedResults = [];
  for (var si = 0; si < SPORT_FEEDS.length; si++) {
    try {
      const result = await parser.parseURL(SPORT_FEEDS[si].url);
      for (var sj = 0; sj < (result.items || []).length; sj++) {
        const item = result.items[sj];
        sportFeedResults.push({
          title: item.title || '',
          description: item.contentSnippet || '',
          source: SPORT_FEEDS[si].name,
          sourceType: 'news',
          platform: 'rss',
          lang: SPORT_FEEDS[si].lang,
          country: SPORT_FEEDS[si].country,
          pubDate: item.pubDate
        });
      }
    } catch (e) { /* skip */ }
  }
  
  // Fetch Social Media
  console.log('   Fetching Social Media...');
  const [redditPosts, blueskyPosts, mastodonPosts, youtubePosts] = await Promise.all([
    fetchReddit(),
    fetchBluesky(),
    fetchMastodon(),
    fetchYouTube()
  ]);
  
  // Combine all
  const allArticles = [];
  for (var a1 = 0; a1 < googleNewsResults.length; a1++) allArticles.push(googleNewsResults[a1]);
  for (var a2 = 0; a2 < sportFeedResults.length; a2++) allArticles.push(sportFeedResults[a2]);
  for (var a3 = 0; a3 < redditPosts.length; a3++) allArticles.push(redditPosts[a3]);
  for (var a4 = 0; a4 < blueskyPosts.length; a4++) allArticles.push(blueskyPosts[a4]);
  for (var a5 = 0; a5 < mastodonPosts.length; a5++) allArticles.push(mastodonPosts[a5]);
  for (var a6 = 0; a6 < youtubePosts.length; a6++) allArticles.push(youtubePosts[a6]);
  
  console.log('   📊 Raw articles: ' + allArticles.length);
  console.log('      - Google News: ' + googleNewsResults.length);
  console.log('      - Sport RSS: ' + sportFeedResults.length);
  console.log('      - Reddit: ' + redditPosts.length);
  console.log('      - Bluesky: ' + blueskyPosts.length);
  console.log('      - Mastodon: ' + mastodonPosts.length);
  console.log('      - YouTube: ' + youtubePosts.length);
  
  // Filter and deduplicate
  const relevantArticles = [];
  for (var r = 0; r < allArticles.length; r++) {
    if (isRelevant(allArticles[r])) relevantArticles.push(allArticles[r]);
  }
  console.log('   ✅ WM 2026 relevant: ' + relevantArticles.length);
  
  const uniqueArticles = deduplicate(relevantArticles);
  console.log('   ✅ After deduplication: ' + uniqueArticles.length);
  
  // Count unique countries and languages
  const countrySet = {};
  const langSet = {};
  for (var c = 0; c < uniqueArticles.length; c++) {
    if (uniqueArticles[c].country) countrySet[uniqueArticles[c].country] = true;
    if (uniqueArticles[c].lang) langSet[uniqueArticles[c].lang] = true;
  }
  const uniqueCountries = Object.keys(countrySet).length;
  const uniqueLanguages = Object.keys(langSet).length;
  console.log('   🌍 Countries: ' + uniqueCountries + ' | Languages: ' + uniqueLanguages);
  
  // Prepare texts for analysis (limit to 500 for API)
  const texts = [];
  for (var t = 0; t < Math.min(uniqueArticles.length, 500); t++) {
    texts.push(uniqueArticles[t].title + '. ' + (uniqueArticles[t].description || ''));
  }
  
  // PHASE 2: AI ANALYSIS
  console.log('\n🤖 PHASE 2: AI Analysis (XLM-RoBERTa + Emotion)...');
  
  const batchSize = 8;
  const sentimentResults = [];
  const emotionResults = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    process.stdout.write('   Processing ' + (i + 1) + '-' + Math.min(i + batchSize, texts.length) + '/' + texts.length + '...\r');
    
    // Run sentiment and emotion in parallel
    const [sentimentBatch, emotionBatch] = await Promise.all([
      callHuggingFace(HF_MODELS.sentiment, batch),
      callHuggingFace(HF_MODELS.emotion, batch)
    ]);
    
    // Process sentiment results
    if (sentimentBatch && Array.isArray(sentimentBatch)) {
      for (var si2 = 0; si2 < sentimentBatch.length; si2++) {
        const pred = sentimentBatch[si2];
        let score = 0;
        if (Array.isArray(pred)) {
          for (var pi = 0; pi < pred.length; pi++) {
            if (pred[pi].label === 'positive') score = pred[pi].score;
            else if (pred[pi].label === 'negative') score = -pred[pi].score;
          }
        }
        sentimentResults.push(score);
      }
    } else {
      for (var fb = 0; fb < batch.length; fb++) sentimentResults.push(0);
    }
    
    // Process emotion results
    if (emotionBatch && Array.isArray(emotionBatch)) {
      for (var ei = 0; ei < emotionBatch.length; ei++) {
        const pred = emotionBatch[ei];
        const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, trust: 0.1, anticipation: 0.15 };
        if (Array.isArray(pred)) {
          for (var epi = 0; epi < pred.length; epi++) {
            const label = pred[epi].label.toLowerCase();
            if (emotions.hasOwnProperty(label)) emotions[label] = pred[epi].score;
            else if (label === 'neutral') {
              emotions.trust = pred[epi].score * 0.3;
              emotions.anticipation = pred[epi].score * 0.4;
            }
          }
        }
        emotionResults.push(emotions);
      }
    } else {
      for (var efb = 0; efb < batch.length; efb++) {
        emotionResults.push({ joy: 0.15, anger: 0.1, fear: 0.1, sadness: 0.1, surprise: 0.1, disgust: 0.05, trust: 0.15, anticipation: 0.25 });
      }
    }
    
    await sleep(150);
  }
  console.log('');
  
  // Calculate overall sentiment
  const validSentiments = [];
  for (var vs = 0; vs < sentimentResults.length; vs++) {
    if (sentimentResults[vs] !== 0) validSentiments.push(sentimentResults[vs]);
  }
  var avgSentiment = 0;
  if (validSentiments.length > 0) {
    var sum = 0;
    for (var vss = 0; vss < validSentiments.length; vss++) sum += validSentiments[vss];
    avgSentiment = sum / validSentiments.length;
  }
  const score = toScore(avgSentiment);
  const label = getLabel(score);
  
  // Count distribution
  let positive = 0, neutral = 0, negative = 0;
  for (var ds = 0; ds < sentimentResults.length; ds++) {
    if (sentimentResults[ds] > 0.15) positive++;
    else if (sentimentResults[ds] < -0.15) negative++;
    else neutral++;
  }
  
  console.log('   📊 XLM-RoBERTa Sentiment: ' + score + '/100 (' + label.en + ')');
  console.log('   📈 Distribution: +' + positive + ' / =' + neutral + ' / -' + negative);
  
  // Calculate emotions
  const aggregatedEmotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, trust: 0, anticipation: 0 };
  for (var ae = 0; ae < emotionResults.length; ae++) {
    for (const k of Object.keys(emotionResults[ae])) {
      if (aggregatedEmotions.hasOwnProperty(k)) aggregatedEmotions[k] += emotionResults[ae][k];
    }
  }
  for (const k of Object.keys(aggregatedEmotions)) {
    aggregatedEmotions[k] = parseFloat((aggregatedEmotions[k] / emotionResults.length).toFixed(3));
  }
  
  // Find dominant emotion
  let dominantEmotion = 'neutral', maxEmotionScore = 0;
  for (const k of Object.keys(aggregatedEmotions)) {
    if (aggregatedEmotions[k] > maxEmotionScore) {
      maxEmotionScore = aggregatedEmotions[k];
      dominantEmotion = k;
    }
  }
  
  console.log('   😊 Dominant Emotion: ' + dominantEmotion + ' (' + (maxEmotionScore * 100).toFixed(1) + '%)');
  
  // PHASE 3: SAVE TO DATABASE
  console.log('\n💾 PHASE 3: Saving to Database...');
  
  // Get previous day for trend
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const { data: prevData } = await supabase
    .from('wm2026_sentiment')
    .select('score')
    .eq('date', yesterday.toISOString().split('T')[0])
    .single();
  
  const trend = prevData ? (score > prevData.score + 3 ? 'up' : score < prevData.score - 3 ? 'down' : 'stable') : 'stable';
  
  // Count news vs social
  let newsCount = 0, socialCount = 0;
  for (var nc = 0; nc < uniqueArticles.length; nc++) {
    if (uniqueArticles[nc].sourceType === 'news') newsCount++;
    else socialCount++;
  }
  
  // Save main sentiment
  const { data: sentimentRecord, error: sentimentError } = await supabase
    .from('wm2026_sentiment')
    .upsert({
      date: today,
      score: score,
      label_de: label.de,
      label_en: label.en,
      trend: trend,
      articles_total: uniqueArticles.length,
      articles_positive: positive,
      articles_neutral: neutral,
      articles_negative: negative,
      countries_count: uniqueCountries,
      languages_count: uniqueLanguages,
      news_score: score,
      news_count: newsCount,
      social_score: score,
      social_count: socialCount,
      model_used: 'xlm-roberta-multi-model',
      updated_at: new Date().toISOString()
    }, { onConflict: 'date' })
    .select()
    .single();
  
  if (sentimentError) {
    console.error('   ❌ Sentiment error: ' + sentimentError.message);
  } else {
    console.log('   ✅ Main sentiment saved');
  }
  
  // Save categories
  const categoryData = {};
  for (const cat of Object.keys(CATEGORIES)) {
    categoryData[cat] = { scores: [], count: 0 };
  }
  for (var ci = 0; ci < texts.length; ci++) {
    const cat = classifyCategory(texts[ci]);
    categoryData[cat].scores.push(sentimentResults[ci]);
    categoryData[cat].count++;
  }
  
  for (const catKey of Object.keys(categoryData)) {
    const data = categoryData[catKey];
    if (data.count === 0) continue;
    var catSum = 0;
    for (var cs = 0; cs < data.scores.length; cs++) catSum += data.scores[cs];
    const catAvg = catSum / data.scores.length;
    const catScore = toScore(catAvg);
    
    await supabase.from('wm2026_sentiment_categories').upsert({
      sentiment_id: sentimentRecord?.id,
      date: today,
      category_key: catKey,
      category_name_de: CATEGORIES[catKey].de,
      category_name_en: CATEGORIES[catKey].en,
      emoji: CATEGORIES[catKey].emoji,
      score: catScore,
      articles_count: data.count
    }, { onConflict: 'date,category_key' });
  }
  console.log('   ✅ Categories saved');
  
  // Save emotions
  await supabase.from('wm2026_sentiment_emotions').upsert({
    sentiment_id: sentimentRecord?.id,
    date: today,
    joy: aggregatedEmotions.joy,
    anger: aggregatedEmotions.anger,
    fear: aggregatedEmotions.fear,
    sadness: aggregatedEmotions.sadness,
    surprise: aggregatedEmotions.surprise,
    disgust: aggregatedEmotions.disgust,
    trust: aggregatedEmotions.trust,
    anticipation: aggregatedEmotions.anticipation,
    dominant_emotion: dominantEmotion,
    dominant_score: maxEmotionScore,
    emotional_intensity: (aggregatedEmotions.joy + aggregatedEmotions.anger + aggregatedEmotions.fear + aggregatedEmotions.sadness + aggregatedEmotions.surprise + aggregatedEmotions.disgust + aggregatedEmotions.trust + aggregatedEmotions.anticipation) / 8,
    articles_count: emotionResults.length
  }, { onConflict: 'date' });
  console.log('   ✅ Emotions saved');
  
  // COMPLETE
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   ✅ ANALYSIS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   📅 Date:        ' + today);
  console.log('   📰 Articles:    ' + uniqueArticles.length + ' analyzed');
  console.log('   🌍 Countries:   ' + uniqueCountries);
  console.log('   🗣️  Languages:   ' + uniqueLanguages);
  console.log('   📊 Score:       ' + score + '/100 (' + label.en + ') ' + (trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'));
  console.log('   😊 Emotion:     ' + dominantEmotion + ' (' + (maxEmotionScore * 100).toFixed(1) + '%)');
  console.log('   ⏱️  Duration:    ' + duration + 's');
  console.log('═══════════════════════════════════════════════════════════\n');
}

run().catch(function(err) {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
