#!/usr/bin/env node

/**
 * WM2026 Sentiment Analysis - Complete Local Pipeline
 * 
 * Features:
 * - NO LIMITS: All keywords in all languages
 * - DEDUPLICATION: Each article only once (content hash)
 * - DATE-BASED FETCHING: First run from 5.12.2024, then incremental
 * - ROLLING 7-DAY SENTIMENT: Smoothed analysis for better trend detection
 * - LOCAL EXECUTION: Only results written to Supabase
 * 
 * Usage:
 *   node wm2026-sentiment-local.js                    # Normal run (incremental)
 *   node wm2026-sentiment-local.js --full             # Full fetch from 5.12.2024
 *   node wm2026-sentiment-local.js --export           # Export results after analysis
 *   node wm2026-sentiment-local.js --dry-run          # Test without writing to DB
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
  // Supabase - aus .env oder direkt setzen
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  
  // Hugging Face für Sentiment Analysis
  HF_API_KEY: process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || '',
  
  // WM 2026 Auslosung - Startdatum für erste Analyse
  WM_DRAW_DATE: '2025-12-05T00:00:00Z',
  
  // Rolling Window für Sentiment (Tage)
  ROLLING_WINDOW_DAYS: 7,
  
  // Request delays (ms) - um Rate Limiting zu vermeiden
  REQUEST_DELAY_MS: 150,
  BATCH_DELAY_MS: 1000,
  
  // Batch size für Sentiment Analysis
  SENTIMENT_BATCH_SIZE: 20,
  
  // Output directory für lokale Backups
  OUTPUT_DIR: './wm2026-data',
  
  // Hugging Face Models
  MODELS: {
    SENTIMENT: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
    EMOTION: 'SamLowe/roberta-base-go_emotions',
  },
};

// =====================================================
// KEYWORDS - ALLE SPRACHEN, KEINE LIMITS
// =====================================================

const WM_KEYWORDS = {
  // English (1.5B speakers)
  en: [
    'World Cup 2026', 'FIFA 2026', 'WC 2026', 'USA Canada Mexico 2026',
    'FIFA World Cup 2026', 'Soccer World Cup 2026', 'Football World Cup 2026',
    '2026 World Cup draw', '2026 World Cup tickets', '2026 World Cup qualifiers',
    '2026 World Cup host cities', 'United 2026', '2026 World Cup venues',
    '2026 World Cup stadiums', '2026 World Cup teams', '2026 World Cup travel',
    '2026 World Cup favorites', '2026 World Cup stars',
    // Host cities
    'World Cup Atlanta', 'World Cup Los Angeles', 'World Cup Miami',
    'World Cup New York', 'World Cup Dallas', 'World Cup Houston',
    'World Cup Mexico City', 'World Cup Toronto', 'World Cup Vancouver',
    // Stadiums
    'MetLife Stadium World Cup', 'SoFi Stadium 2026', 'Estadio Azteca 2026',
    'Hard Rock Stadium World Cup', 'AT&T Stadium 2026', 'Mercedes-Benz Stadium 2026',
    // Players
    'Messi World Cup 2026', 'Mbappe 2026', 'Haaland World Cup',
    'Bellingham 2026', 'Vinicius Jr World Cup', 'Harry Kane 2026',
    'Salah World Cup 2026', 'Pulisic 2026', 'Alphonso Davies World Cup',
    // Sponsors
    'Adidas World Cup 2026', 'Coca-Cola World Cup', 'Budweiser FIFA 2026',
    'McDonald\'s World Cup', 'Visa World Cup 2026',
    // Associations
    'FIFA World Cup 2026', 'UEFA World Cup qualifiers', 'CONCACAF 2026',
    'CONMEBOL World Cup 2026', 'CAF World Cup qualifiers', 'AFC World Cup 2026',
  ],
  
  // German (130M speakers)
  de: [
    'WM 2026', 'Weltmeisterschaft 2026', 'Fußball WM 2026', 'FIFA WM 2026',
    'Fußball-Weltmeisterschaft 2026', 'Fussball WM 2026', 'WM Tickets 2026',
    'WM Qualifikation 2026', 'DFB WM 2026', 'Nationalmannschaft WM 2026',
    'WM Auslosung 2026', 'WM 2026 Gastgeber', 'WM 2026 Spielorte',
    'WM 2026 Stadien', 'WM 2026 Nationalmannschaften', 'WM 2026 Reisen',
    'WM 2026 Favoriten', 'WM 2026 Stars', 'ÖFB WM 2026', 'Nati WM 2026',
    // Host cities
    'WM Atlanta', 'WM Los Angeles', 'WM Miami', 'WM New York',
    'WM Mexico City', 'WM Toronto', 'WM Vancouver',
    // Players
    'Messi WM 2026', 'Mbappé WM', 'Haaland WM 2026',
    'Kimmich WM', 'Musiala WM 2026', 'Wirtz Weltmeisterschaft',
    // Associations
    'DFB Weltmeisterschaft 2026', 'UEFA WM Qualifikation',
  ],
  
  // Spanish (550M speakers)
  es: [
    'Mundial 2026', 'Copa del Mundo 2026', 'FIFA 2026', 'Copa Mundial 2026',
    'Eliminatorias 2026', 'Selección Mundial 2026', 'Entradas Mundial 2026',
    'Sorteo Mundial 2026', 'México 2026', 'Clasificación Mundial 2026',
    'Sedes Mundial 2026', 'Estadios Mundial 2026', 'Equipos Mundial 2026',
    'Favoritos Mundial 2026', 'Estrellas Mundial 2026',
    // Host cities
    'Mundial Atlanta', 'Mundial Los Angeles', 'Mundial Miami',
    'Mundial Ciudad de México', 'Mundial Guadalajara', 'Mundial Monterrey',
    // Players
    'Messi Mundial 2026', 'Mbappé Mundial', 'Haaland Mundial 2026',
    // Associations
    'RFEF Mundial 2026', 'FMF Mundial 2026', 'AFA Mundial 2026',
    'CONMEBOL eliminatorias 2026', 'CONCACAF clasificación 2026',
  ],
  
  // French (280M speakers)
  fr: [
    'Coupe du Monde 2026', 'Mondial 2026', 'FIFA 2026', 'CDM 2026',
    'Qualifications Coupe du Monde 2026', 'Billets Coupe du Monde 2026',
    'Tirage Coupe du Monde 2026', 'Équipe de France 2026',
    'Stades Coupe du Monde 2026', 'Villes hôtes 2026',
    // Players
    'Mbappé Coupe du Monde 2026', 'Griezmann Mondial', 'Messi Mondial 2026',
    // Associations
    'FFF Coupe du Monde 2026', 'UEFA qualifications 2026',
  ],
  
  // Portuguese (260M speakers)
  pt: [
    'Copa do Mundo 2026', 'Mundial 2026', 'FIFA 2026', 'Copa 2026',
    'Eliminatórias 2026', 'Seleção Brasileira 2026', 'Ingressos Copa 2026',
    'Sorteio Copa 2026', 'Qualificação Mundial 2026', 'Estádios Copa 2026',
    'Seleção Portuguesa 2026',
    // Players
    'Neymar Copa 2026', 'Vinicius Jr Copa', 'Messi Copa do Mundo 2026',
    // Associations
    'CBF Copa 2026', 'FPF Mundial 2026', 'CONMEBOL eliminatórias 2026',
  ],
  
  // Russian (250M speakers)
  ru: [
    'Чемпионат мира 2026', 'ЧМ 2026', 'ФИФА 2026', 'Кубок мира 2026',
    'Мундиаль 2026', 'Отборочные ЧМ 2026', 'Билеты ЧМ 2026',
    // Players
    'Месси ЧМ 2026', 'Мбаппе ЧМ', 'Холанд ЧМ 2026',
  ],
  
  // Arabic (400M speakers)
  ar: [
    'كأس العالم 2026', 'مونديال 2026', 'فيفا 2026',
    'تصفيات كأس العالم 2026', 'نهائيات 2026',
  ],
  
  // Chinese (1.1B speakers)
  zh: [
    '2026世界杯', '世界杯2026', 'FIFA 2026',
    '2026年世界杯', '世界杯预选赛2026',
  ],
  
  // Japanese (125M speakers)
  ja: [
    'ワールドカップ2026', 'W杯2026', 'FIFA 2026',
    '2026年ワールドカップ', 'サッカーワールドカップ2026',
  ],
  
  // Korean (80M speakers)
  ko: [
    '2026 월드컵', '월드컵 2026', 'FIFA 2026',
    '2026년 월드컵', '월드컵 예선 2026',
  ],
  
  // Italian (65M speakers)
  it: [
    'Mondiali 2026', 'Coppa del Mondo 2026', 'FIFA 2026',
    'Qualificazioni Mondiali 2026', 'Italia Mondiali 2026',
  ],
  
  // Dutch (25M speakers)
  nl: [
    'WK 2026', 'Wereldkampioenschap 2026', 'FIFA 2026',
    'WK kwalificatie 2026', 'Oranje WK 2026',
  ],
  
  // Polish (45M speakers)
  pl: [
    'Mistrzostwa Świata 2026', 'MŚ 2026', 'FIFA 2026',
    'Eliminacje MŚ 2026', 'Mundial 2026',
  ],
  
  // Turkish (80M speakers)
  tr: [
    'Dünya Kupası 2026', 'FIFA 2026', 'Dünya Kupası elemeleri 2026',
    '2026 Dünya Kupası', 'Milli Takım 2026',
  ],
  
  // Indonesian (200M speakers)
  id: [
    'Piala Dunia 2026', 'FIFA 2026', 'Kualifikasi Piala Dunia 2026',
    'World Cup 2026',
  ],
  
  // Vietnamese (85M speakers)
  vi: [
    'World Cup 2026', 'Cúp thế giới 2026', 'FIFA 2026',
    'Vòng loại World Cup 2026',
  ],
  
  // Thai (60M speakers)
  th: [
    'ฟุตบอลโลก 2026', 'บอลโลก 2026', 'FIFA 2026',
    'รอบคัดเลือกฟุตบอลโลก 2026',
  ],
  
  // Hindi (600M speakers)
  hi: [
    'फीफा विश्व कप 2026', 'विश्व कप 2026', 'फुटबॉल विश्व कप 2026',
    '2026 वर्ल्ड कप',
  ],
  
  // Bengali (270M speakers)
  bn: [
    'বিশ্বকাপ 2026', 'ফিফা বিশ্বকাপ 2026', 'ফুটবল বিশ্বকাপ 2026',
  ],
  
  // Persian (110M speakers)
  fa: [
    'جام جهانی 2026', 'فیفا 2026', 'جام جهانی فوتبال 2026',
  ],
  
  // Ukrainian (40M speakers)
  uk: [
    'Чемпіонат світу 2026', 'ЧС 2026', 'ФІФА 2026',
  ],
  
  // Greek (13M speakers)
  el: [
    'Παγκόσμιο Κύπελλο 2026', 'Μουντιάλ 2026', 'FIFA 2026',
  ],
  
  // Czech (10M speakers)
  cs: [
    'Mistrovství světa 2026', 'MS 2026', 'FIFA 2026',
  ],
  
  // Swedish (10M speakers)
  sv: [
    'VM 2026', 'Fotbolls-VM 2026', 'FIFA 2026',
  ],
  
  // Romanian (25M speakers)
  ro: [
    'Cupa Mondială 2026', 'CM 2026', 'FIFA 2026',
  ],
  
  // Hungarian (13M speakers)
  hu: [
    'Labdarúgó-világbajnokság 2026', 'VB 2026', 'FIFA 2026',
  ],
  
  // Danish (6M speakers)
  da: [
    'VM 2026', 'Fodbold VM 2026', 'FIFA 2026',
  ],
  
  // Norwegian (5M speakers)
  no: [
    'VM 2026', 'Fotball-VM 2026', 'FIFA 2026',
  ],
  
  // Finnish (5M speakers)
  fi: [
    'MM 2026', 'Jalkapallon MM 2026', 'FIFA 2026',
  ],
  
  // Swahili (100M speakers)
  sw: [
    'Kombe la Dunia 2026', 'FIFA 2026', 'Mchezo wa Kandanda 2026',
  ],
  
  // Afrikaans (7M speakers)
  af: [
    'Wêreldbeker 2026', 'FIFA 2026', 'Sokker Wêreldbeker 2026',
  ],
};

// Language to Country mapping for Google News
const LANG_COUNTRY_MAP = {
  en: 'US', de: 'DE', es: 'MX', fr: 'FR', pt: 'BR', it: 'IT',
  ru: 'RU', ar: 'SA', zh: 'CN', ja: 'JP', ko: 'KR', nl: 'NL',
  pl: 'PL', tr: 'TR', id: 'ID', vi: 'VN', th: 'TH', hi: 'IN',
  bn: 'BD', fa: 'IR', uk: 'UA', el: 'GR', cs: 'CZ', sv: 'SE',
  ro: 'RO', hu: 'HU', da: 'DK', no: 'NO', fi: 'FI', sw: 'KE', af: 'ZA',
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const icons = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    fetch: '📥',
    analyze: '🔬',
    db: '💾',
    stats: '📊',
  };
  console.log(`[${timestamp}] ${icons[type] || ''} ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 32);
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

function parseArgs() {
  const args = {
    full: false,
    export: false,
    dryRun: false,
  };
  
  process.argv.slice(2).forEach(arg => {
    if (arg === '--full') args.full = true;
    if (arg === '--export') args.export = true;
    if (arg === '--dry-run') args.dryRun = true;
  });
  
  return args;
}

function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }
}

function saveLocalBackup(filename, data) {
  ensureOutputDir();
  const filepath = path.join(CONFIG.OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  log(`Backup saved: ${filepath}`, 'success');
}

// =====================================================
// SUPABASE CLIENT
// =====================================================

let supabase = null;

function initSupabase() {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
    // Try to load from .env file
    try {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        });
        CONFIG.SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        CONFIG.SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        CONFIG.HF_API_KEY = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
    throw new Error('Supabase credentials not found. Set SUPABASE_URL and SUPABASE_KEY in .env file.');
  }
  
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  log('Supabase client initialized', 'success');
}

// =====================================================
// FETCH ARTICLES FROM GOOGLE NEWS RSS
// =====================================================

async function fetchGoogleNews(fromDate) {
  log(`Fetching Google News from ${fromDate.toISOString().split('T')[0]}...`, 'fetch');
  
  const articles = new Map(); // Use Map for deduplication by hash
  const languages = Object.keys(WM_KEYWORDS);
  let totalKeywords = 0;
  let fetchedCount = 0;
  
  for (const lang of languages) {
    const keywords = WM_KEYWORDS[lang];
    const country = LANG_COUNTRY_MAP[lang] || lang.toUpperCase();
    
    log(`  Processing ${lang.toUpperCase()}: ${keywords.length} keywords...`, 'info');
    
    for (const keyword of keywords) {
      totalKeywords++;
      
      try {
        const encodedQuery = encodeURIComponent(keyword);
        const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
        
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const text = await response.text();
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        
        for (const item of items) {
          const title = (item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '')
            .replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
          const description = (item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '')
            .replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
          const pubDateStr = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
          const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '';
          
          if (!title || !link) continue;
          
          const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
          
          // Skip articles before fromDate
          if (pubDate < fromDate) continue;
          
          // Generate unique hash from URL (most reliable)
          const hash = generateHash(link);
          
          // Skip if already have this article
          if (articles.has(hash)) continue;
          
          articles.set(hash, {
            external_id: hash,
            source_type: 'news',
            source_name: source || 'Google News',
            title: title.substring(0, 500),
            description: description.substring(0, 2000),
            url: link,
            published_at: pubDate.toISOString(),
            fetched_at: new Date().toISOString(),
            language: lang,
            country: country,
            keyword_matched: keyword,
          });
          
          fetchedCount++;
        }
        
        await sleep(CONFIG.REQUEST_DELAY_MS);
        
      } catch (error) {
        // Silently continue on errors
      }
    }
  }
  
  log(`Google News: ${articles.size} unique articles from ${totalKeywords} keywords in ${languages.length} languages`, 'success');
  
  return Array.from(articles.values());
}

// =====================================================
// SENTIMENT ANALYSIS (Hugging Face)
// =====================================================

async function analyzeSentimentBatch(texts) {
  if (!CONFIG.HF_API_KEY) {
    log('No HuggingFace API key, using mock sentiment', 'warning');
    return texts.map(() => ({
      label: 'neutral',
      score: 0.5,
      positive: 0.33,
      negative: 0.33,
      neutral: 0.34,
    }));
  }
  
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${CONFIG.MODELS.SENTIMENT}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: texts }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }
    
    const results = await response.json();
    
    return results.map(result => {
      if (!Array.isArray(result)) {
        return { label: 'neutral', score: 0.5, positive: 0.33, negative: 0.33, neutral: 0.34 };
      }
      
      const scores = {};
      result.forEach(r => {
        const label = r.label.toLowerCase();
        if (label.includes('positive')) scores.positive = r.score;
        else if (label.includes('negative')) scores.negative = r.score;
        else scores.neutral = r.score;
      });
      
      const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      
      return {
        label: dominant[0],
        score: dominant[1],
        positive: scores.positive || 0,
        negative: scores.negative || 0,
        neutral: scores.neutral || 0,
      };
    });
    
  } catch (error) {
    log(`Sentiment API error: ${error.message}`, 'error');
    return texts.map(() => ({
      label: 'neutral',
      score: 0.5,
      positive: 0.33,
      negative: 0.33,
      neutral: 0.34,
    }));
  }
}

async function analyzeEmotionsBatch(texts) {
  if (!CONFIG.HF_API_KEY) {
    return texts.map(() => ({
      joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, dominant: 'neutral'
    }));
  }
  
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${CONFIG.MODELS.EMOTION}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: texts }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }
    
    const results = await response.json();
    
    return results.map(result => {
      if (!Array.isArray(result)) {
        return { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, dominant: 'neutral' };
      }
      
      const emotions = {
        joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0
      };
      
      result.forEach(r => {
        const label = r.label.toLowerCase();
        if (label in emotions) {
          emotions[label] = r.score;
        } else if (label === 'happiness' || label === 'happy') {
          emotions.joy = r.score;
        }
      });
      
      const dominant = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
      
      return {
        ...emotions,
        dominant: dominant[0],
      };
    });
    
  } catch (error) {
    log(`Emotion API error: ${error.message}`, 'error');
    return texts.map(() => ({
      joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, dominant: 'neutral'
    }));
  }
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

async function getLastRunDate() {
  try {
    const { data, error } = await supabase
      .from('wm2026_processing_log')
      .select('completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data?.completed_at) {
      return new Date(data.completed_at);
    }
  } catch (e) {
    // No previous run
  }
  
  return new Date(CONFIG.WM_DRAW_DATE);
}

async function getExistingHashes() {
  const { data, error } = await supabase
    .from('wm2026_articles')
    .select('external_id');
  
  if (error) {
    log(`Error fetching existing hashes: ${error.message}`, 'error');
    return new Set();
  }
  
  return new Set(data.map(d => d.external_id));
}

async function saveArticles(articles, dryRun = false) {
  if (articles.length === 0) return { inserted: 0, duplicates: 0 };
  
  if (dryRun) {
    log(`[DRY RUN] Would insert ${articles.length} articles`, 'db');
    return { inserted: articles.length, duplicates: 0 };
  }
  
  // Get existing hashes to avoid duplicates
  const existingHashes = await getExistingHashes();
  
  const newArticles = articles.filter(a => !existingHashes.has(a.external_id));
  const duplicates = articles.length - newArticles.length;
  
  if (newArticles.length === 0) {
    log(`No new articles to insert (${duplicates} duplicates)`, 'db');
    return { inserted: 0, duplicates };
  }
  
  // Insert in batches
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < newArticles.length; i += batchSize) {
    const batch = newArticles.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('wm2026_articles')
      .upsert(batch, { onConflict: 'external_id' });
    
    if (error) {
      log(`Insert error: ${error.message}`, 'error');
    } else {
      inserted += batch.length;
    }
  }
  
  log(`Inserted ${inserted} articles, ${duplicates} duplicates skipped`, 'db');
  return { inserted, duplicates };
}

async function updateArticleSentiment(articleId, sentiment, emotions, dryRun = false) {
  if (dryRun) return;
  
  const { error } = await supabase
    .from('wm2026_articles')
    .update({
      sentiment_score: (sentiment.positive - sentiment.negative + 1) / 2, // 0-1 scale
      sentiment_label: sentiment.label,
      sentiment_positive: sentiment.positive,
      sentiment_negative: sentiment.negative,
      sentiment_neutral: sentiment.neutral,
      emotion_joy: emotions.joy,
      emotion_anger: emotions.anger,
      emotion_fear: emotions.fear,
      emotion_sadness: emotions.sadness,
      emotion_surprise: emotions.surprise,
      emotion_disgust: emotions.disgust,
      dominant_emotion: emotions.dominant,
      is_processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq('id', articleId);
  
  if (error) {
    log(`Update error for ${articleId}: ${error.message}`, 'error');
  }
}

// =====================================================
// ROLLING 7-DAY AGGREGATION
// =====================================================

async function calculateRolling7DaySentiment(dryRun = false) {
  log('Calculating rolling 7-day sentiment...', 'stats');
  
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - CONFIG.ROLLING_WINDOW_DAYS);
  
  // Fetch articles from last 7 days
  const { data: articles, error } = await supabase
    .from('wm2026_articles')
    .select('*')
    .eq('is_processed', true)
    .gte('published_at', sevenDaysAgo.toISOString())
    .lte('published_at', today.toISOString());
  
  if (error || !articles || articles.length === 0) {
    log('No articles found for rolling sentiment', 'warning');
    return null;
  }
  
  // Calculate averages
  const stats = {
    date: today.toISOString().split('T')[0],
    window_start: sevenDaysAgo.toISOString().split('T')[0],
    window_end: today.toISOString().split('T')[0],
    window_days: CONFIG.ROLLING_WINDOW_DAYS,
    
    article_count: articles.length,
    
    // Sentiment averages
    sentiment_avg: 0,
    sentiment_positive_pct: 0,
    sentiment_negative_pct: 0,
    sentiment_neutral_pct: 0,
    
    // Emotion averages
    emotion_joy_avg: 0,
    emotion_anger_avg: 0,
    emotion_fear_avg: 0,
    emotion_sadness_avg: 0,
    emotion_surprise_avg: 0,
    emotion_disgust_avg: 0,
    
    // Distributions
    by_language: {},
    by_country: {},
    by_source: {},
    by_sentiment: { positive: 0, negative: 0, neutral: 0 },
    
    // Calculated at
    calculated_at: new Date().toISOString(),
  };
  
  // Calculate aggregates
  let totalSentiment = 0;
  let emotionTotals = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 };
  
  articles.forEach(a => {
    totalSentiment += a.sentiment_score || 0.5;
    
    // Emotions
    emotionTotals.joy += a.emotion_joy || 0;
    emotionTotals.anger += a.emotion_anger || 0;
    emotionTotals.fear += a.emotion_fear || 0;
    emotionTotals.sadness += a.emotion_sadness || 0;
    emotionTotals.surprise += a.emotion_surprise || 0;
    emotionTotals.disgust += a.emotion_disgust || 0;
    
    // Sentiment distribution
    if (a.sentiment_label === 'positive') stats.by_sentiment.positive++;
    else if (a.sentiment_label === 'negative') stats.by_sentiment.negative++;
    else stats.by_sentiment.neutral++;
    
    // Language distribution
    stats.by_language[a.language || 'unknown'] = (stats.by_language[a.language || 'unknown'] || 0) + 1;
    
    // Country distribution
    stats.by_country[a.country || 'unknown'] = (stats.by_country[a.country || 'unknown'] || 0) + 1;
    
    // Source distribution
    stats.by_source[a.source_type || 'unknown'] = (stats.by_source[a.source_type || 'unknown'] || 0) + 1;
  });
  
  const count = articles.length;
  
  stats.sentiment_avg = totalSentiment / count;
  stats.sentiment_positive_pct = (stats.by_sentiment.positive / count * 100).toFixed(2);
  stats.sentiment_negative_pct = (stats.by_sentiment.negative / count * 100).toFixed(2);
  stats.sentiment_neutral_pct = (stats.by_sentiment.neutral / count * 100).toFixed(2);
  
  stats.emotion_joy_avg = emotionTotals.joy / count;
  stats.emotion_anger_avg = emotionTotals.anger / count;
  stats.emotion_fear_avg = emotionTotals.fear / count;
  stats.emotion_sadness_avg = emotionTotals.sadness / count;
  stats.emotion_surprise_avg = emotionTotals.surprise / count;
  stats.emotion_disgust_avg = emotionTotals.disgust / count;
  
  // Save to database
  if (!dryRun) {
    const { error: saveError } = await supabase
      .from('wm2026_daily_sentiment')
      .upsert({
        date: stats.date,
        ...stats,
      }, { onConflict: 'date' });
    
    if (saveError) {
      log(`Error saving daily sentiment: ${saveError.message}`, 'error');
    } else {
      log(`Saved rolling 7-day sentiment for ${stats.date}`, 'db');
    }
  }
  
  return stats;
}

// =====================================================
// MAIN PIPELINE
// =====================================================

async function runPipeline(options = {}) {
  const startTime = Date.now();
  const args = parseArgs();
  const dryRun = args.dryRun || options.dryRun;
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        🏆 WM2026 Sentiment Analysis Pipeline 🏆              ║
║              Complete Local Analysis v2.0                    ║
╚══════════════════════════════════════════════════════════════╝
`);
  
  if (dryRun) {
    log('🔸 DRY RUN MODE - No changes will be written to database', 'warning');
  }
  
  // Initialize Supabase
  initSupabase();
  
  // Determine date range
  let fromDate;
  if (args.full) {
    fromDate = new Date(CONFIG.WM_DRAW_DATE);
    log(`FULL MODE: Fetching all articles since WM draw (${fromDate.toISOString().split('T')[0]})`, 'info');
  } else {
    fromDate = await getLastRunDate();
    log(`INCREMENTAL MODE: Fetching articles since last run (${fromDate.toISOString().split('T')[0]})`, 'info');
  }
  
  const results = {
    mode: args.full ? 'full' : 'incremental',
    from_date: fromDate.toISOString(),
    fetch: { total: 0, new: 0, duplicates: 0 },
    analysis: { processed: 0, failed: 0 },
    rolling_sentiment: null,
  };
  
  // ==================== PHASE 1: FETCH ====================
  console.log('\n' + '═'.repeat(60));
  log('PHASE 1: Fetching Articles', 'fetch');
  console.log('═'.repeat(60));
  
  const articles = await fetchGoogleNews(fromDate);
  results.fetch.total = articles.length;
  
  // ==================== PHASE 2: SAVE TO DB ====================
  console.log('\n' + '═'.repeat(60));
  log('PHASE 2: Saving to Database', 'db');
  console.log('═'.repeat(60));
  
  const saveResult = await saveArticles(articles, dryRun);
  results.fetch.new = saveResult.inserted;
  results.fetch.duplicates = saveResult.duplicates;
  
  // ==================== PHASE 3: SENTIMENT ANALYSIS ====================
  console.log('\n' + '═'.repeat(60));
  log('PHASE 3: Sentiment Analysis', 'analyze');
  console.log('═'.repeat(60));
  
  // Get unprocessed articles
  const { data: unprocessed, error: fetchError } = await supabase
    .from('wm2026_articles')
    .select('id, title, description')
    .eq('is_processed', false)
    .order('published_at', { ascending: false });
  
  if (fetchError) {
    log(`Error fetching unprocessed: ${fetchError.message}`, 'error');
  } else if (unprocessed && unprocessed.length > 0) {
    log(`Found ${unprocessed.length} unprocessed articles`, 'analyze');
    
    // Process in batches
    for (let i = 0; i < unprocessed.length; i += CONFIG.SENTIMENT_BATCH_SIZE) {
      const batch = unprocessed.slice(i, i + CONFIG.SENTIMENT_BATCH_SIZE);
      const texts = batch.map(a => `${a.title} ${a.description || ''}`.substring(0, 512));
      
      log(`Processing batch ${Math.floor(i / CONFIG.SENTIMENT_BATCH_SIZE) + 1}/${Math.ceil(unprocessed.length / CONFIG.SENTIMENT_BATCH_SIZE)}...`, 'analyze');
      
      // Analyze sentiment
      const sentiments = await analyzeSentimentBatch(texts);
      await sleep(500);
      
      // Analyze emotions
      const emotions = await analyzeEmotionsBatch(texts);
      
      // Update database
      for (let j = 0; j < batch.length; j++) {
        await updateArticleSentiment(batch[j].id, sentiments[j], emotions[j], dryRun);
        results.analysis.processed++;
      }
      
      await sleep(CONFIG.BATCH_DELAY_MS);
    }
    
    log(`Analyzed ${results.analysis.processed} articles`, 'success');
  } else {
    log('No unprocessed articles found', 'info');
  }
  
  // ==================== PHASE 4: ROLLING AGGREGATION ====================
  console.log('\n' + '═'.repeat(60));
  log('PHASE 4: Rolling 7-Day Aggregation', 'stats');
  console.log('═'.repeat(60));
  
  results.rolling_sentiment = await calculateRolling7DaySentiment(dryRun);
  
  // ==================== PHASE 5: LOG RUN ====================
  if (!dryRun) {
    await supabase.from('wm2026_processing_log').insert({
      job_type: args.full ? 'full_pipeline' : 'incremental_pipeline',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: Math.round((Date.now() - startTime) / 1000),
      items_processed: results.fetch.total,
      items_success: results.analysis.processed,
      items_failed: results.analysis.failed,
      status: 'completed',
      details: results,
    });
  }
  
  // ==================== FINAL SUMMARY ====================
  const duration = Date.now() - startTime;
  
  console.log('\n' + '═'.repeat(60));
  console.log('                    FINAL SUMMARY');
  console.log('═'.repeat(60));
  
  console.log(`
📥 Fetching:
   • Total fetched: ${results.fetch.total} articles
   • New inserted: ${results.fetch.new} articles
   • Duplicates skipped: ${results.fetch.duplicates} articles

🔬 Analysis:
   • Processed: ${results.analysis.processed} articles
   • Failed: ${results.analysis.failed} articles

📊 Rolling 7-Day Sentiment:
   • Articles in window: ${results.rolling_sentiment?.article_count || 0}
   • Sentiment Average: ${(results.rolling_sentiment?.sentiment_avg * 100 || 0).toFixed(1)}%
   • Positive: ${results.rolling_sentiment?.sentiment_positive_pct || 0}%
   • Negative: ${results.rolling_sentiment?.sentiment_negative_pct || 0}%
   • Neutral: ${results.rolling_sentiment?.sentiment_neutral_pct || 0}%

⏱️  Duration: ${formatDuration(duration)}
`);
  
  console.log('═'.repeat(60) + '\n');
  
  // Save local backup
  saveLocalBackup(`run_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, results);
  
  // Export if requested
  if (args.export) {
    log('Exporting data...', 'db');
    
    const { data: allArticles } = await supabase
      .from('wm2026_articles')
      .select('*')
      .order('published_at', { ascending: false });
    
    const { data: dailySentiment } = await supabase
      .from('wm2026_daily_sentiment')
      .select('*')
      .order('date', { ascending: false });
    
    saveLocalBackup('export_articles.json', allArticles);
    saveLocalBackup('export_daily_sentiment.json', dailySentiment);
    
    log('Export completed!', 'success');
  }
  
  log('Pipeline completed successfully! 🎉', 'success');
  
  return results;
}

// =====================================================
// RUN
// =====================================================

runPipeline().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
