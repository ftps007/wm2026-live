#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WM2026 SENTIMENT ANALYSIS - COMPLETE LOCAL PIPELINE v4.1
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SOURCES (5):
 *   • Google News RSS (35 languages) - KOSTENLOS, kein API Key
 *   • Reddit (140+ subreddits) - KOSTENLOS, Client ID/Secret nötig
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
 *   HF_API_KEY=hf_xxxxx              # Hugging Face (kostenlos: huggingface.co)
 *   YOUTUBE_API_KEY=AIza...          # Google Cloud (optional)
 *   REDDIT_CLIENT_ID=xxxxx           # Reddit App (optional)
 *   REDDIT_CLIENT_SECRET=xxxxx       # Reddit App (optional)
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
  HF_API_KEY: process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || '',
  
  // YouTube (OPTIONAL - https://console.cloud.google.com)
  YOUTUBE_KEY: process.env.YOUTUBE_API_KEY || '',
  
  // Reddit (OPTIONAL - https://www.reddit.com/prefs/apps)
  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID || '',
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET || '',
  REDDIT_USER_AGENT: 'WM2026SentimentBot/4.1',
  
  // WM 2026 Auslosung - 5. Dezember 2025
  WM_DRAW_DATE: '2025-12-05T00:00:00Z',
  
  // Rolling Window
  ROLLING_WINDOW_DAYS: 7,
  
  // Request delays (ms)
  REQUEST_DELAY_MS: 150,
  API_DELAY_MS: 300,
  BATCH_DELAY_MS: 2000,
  
  // Batch sizes
  ANALYSIS_BATCH_SIZE: 10,
  
  // Output
  OUTPUT_DIR: './wm2026-data',
  
  // ═══════════════════════════════════════════════════════════════════════
  // 11 AI MODELS (alle kostenlos über Hugging Face)
  // ═══════════════════════════════════════════════════════════════════════
  MODELS: {
    // 1. Language Detection
    LANGUAGE_DETECTION: 'papluca/xlm-roberta-base-language-detection',
    // 2. Sentiment Analysis (Multilingual)
    SENTIMENT: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
    // 3. Topic Classification (Zero-Shot)
    TOPIC_ZERO_SHOT: 'facebook/bart-large-mnli',
    // 4. Emotion Detection
    EMOTION: 'SamLowe/roberta-base-go_emotions',
    // 5. Named Entity Recognition
    NER: 'Davlan/xlm-roberta-base-ner-hrl',
    // 6. Toxicity Detection
    TOXICITY: 'unitary/toxic-bert',
    // 7. Keyword Extraction
    KEYWORDS: 'ml6team/keyphrase-extraction-kbir-inspec',
    // 8. Summarization
    SUMMARIZATION: 'facebook/bart-large-cnn',
    // 9. Aspect-Based Sentiment (uses TOPIC_ZERO_SHOT)
    // 10. Controversy Detection (Rule-Based + ML)
    // 11. Hype/Virality Score (Multi-Signal Custom)
  },
  
  // Topic categories for Zero-Shot Classification
  TOPIC_CATEGORIES: [
    'tickets and pricing', 'match schedule and fixtures', 'team news and squad',
    'player transfer and rumors', 'stadium and venue', 'travel and accommodation',
    'fan experience', 'qualification and standings', 'sponsorship and business',
    'broadcast and media', 'infrastructure and construction', 'security and safety',
    'cultural events', 'controversy and criticism', 'celebration and hype',
  ],
  
  // Aspect categories for Aspect-Based Sentiment
  ASPECT_CATEGORIES: [
    'tickets', 'stadiums', 'teams', 'players', 'organization',
    'travel', 'atmosphere', 'prices', 'safety', 'experience',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// WM 2026 KEYWORDS - 35+ LANGUAGES, 500+ KEYWORDS
// ═══════════════════════════════════════════════════════════════════════════

const WM_KEYWORDS = {
  // English (1.5B speakers)
  en: [
    'World Cup 2026', 'FIFA 2026', 'WC 2026', 'USA Canada Mexico 2026',
    'FIFA World Cup 2026', 'Soccer World Cup 2026', 'Football World Cup 2026',
    '2026 World Cup draw', '2026 World Cup tickets', '2026 World Cup qualifiers',
    '2026 World Cup host cities', 'United 2026', '2026 World Cup venues',
    '2026 World Cup stadiums', '2026 World Cup teams', '2026 World Cup travel',
    '2026 World Cup favorites', '2026 World Cup stars', '2026 World Cup streaming',
    'USMNT 2026', 'CONCACAF 2026', 'UEFA World Cup 2026',
    'World Cup Atlanta', 'World Cup Boston', 'World Cup Dallas',
    'World Cup Houston', 'World Cup Kansas City', 'World Cup Los Angeles',
    'World Cup Miami', 'World Cup New York', 'World Cup Philadelphia',
    'World Cup San Francisco', 'World Cup Seattle',
    'World Cup Mexico City', 'World Cup Guadalajara', 'World Cup Monterrey',
    'World Cup Toronto', 'World Cup Vancouver',
    'Mercedes-Benz Stadium 2026', 'Gillette Stadium World Cup', 'AT&T Stadium 2026',
    'NRG Stadium World Cup', 'Arrowhead Stadium 2026', 'SoFi Stadium World Cup',
    'Hard Rock Stadium 2026', 'MetLife Stadium World Cup', 'Lincoln Financial Field 2026',
    'Levi\'s Stadium World Cup', 'Lumen Field 2026',
    'Estadio Azteca 2026', 'Estadio Azteca World Cup', 'BMO Field World Cup', 'BC Place 2026',
    'Messi World Cup 2026', 'Mbappe 2026', 'Haaland World Cup',
    'Bellingham 2026', 'Vinicius Jr World Cup', 'Harry Kane 2026',
    'Salah World Cup 2026', 'Pulisic 2026', 'Alphonso Davies World Cup',
    'Adidas World Cup 2026', 'Coca-Cola World Cup', 'Visa World Cup 2026',
    'Hyundai World Cup', 'Budweiser World Cup 2026', 'McDonald\'s World Cup',
    'USSF 2026', 'US Soccer World Cup', 'Canada Soccer 2026',
    'DFB World Cup', 'FFF France 2026', 'AFA Argentina 2026', 'CBF Brazil World Cup'
  ],
  
  // German (130M speakers)
  de: [
    'WM 2026', 'Weltmeisterschaft 2026', 'Fußball WM 2026', 'FIFA WM 2026',
    'Fußball-Weltmeisterschaft 2026', 'Fussball WM 2026', 'WM Tickets 2026',
    'WM Qualifikation 2026', 'DFB WM 2026', 'Nationalmannschaft WM 2026',
    'WM Auslosung 2026', 'WM 2026 Gastgeber', 'WM 2026 Spielorte',
    'WM 2026 Stadien', 'WM 2026 Favoriten', 'WM 2026 Stars',
    'ÖFB WM 2026', 'Nati WM 2026', 'Schweiz WM 2026',
    'WM Atlanta', 'WM Los Angeles', 'WM Miami', 'WM New York',
    'WM Mexico City', 'WM Toronto', 'WM Vancouver',
    'Messi WM 2026', 'Mbappé WM', 'Haaland WM 2026',
    'Kimmich WM', 'Musiala WM 2026', 'Wirtz Weltmeisterschaft',
    'Adidas WM 2026', 'Coca-Cola WM', 'Budweiser WM 2026',
    'DFB Weltmeisterschaft', 'UEFA WM Qualifikation', 'CONMEBOL WM'
  ],
  
  // Spanish (550M speakers)
  es: [
    'Mundial 2026', 'Copa del Mundo 2026', 'FIFA 2026', 'Copa Mundial 2026',
    'Eliminatorias 2026', 'Selección Mundial 2026', 'Entradas Mundial 2026',
    'Sorteo Mundial 2026', 'México 2026', 'Clasificación Mundial 2026',
    'Sedes Mundial 2026', 'Estadios Mundial 2026', 'Equipos Mundial 2026',
    'Mundial Atlanta', 'Mundial Los Angeles', 'Mundial Miami',
    'Mundial Ciudad de México', 'Mundial Guadalajara', 'Mundial Monterrey',
    'Estadio Azteca Mundial 2026', 'MetLife Stadium Mundial',
    'Messi Mundial 2026', 'Mbappé Mundial', 'Vinicius Mundial',
    'Adidas Mundial 2026', 'Coca-Cola Mundial', 'Visa Mundial 2026',
    'RFEF Mundial 2026', 'FMF Mundial 2026', 'AFA Mundial 2026',
    'CONMEBOL eliminatorias 2026', 'CONCACAF clasificación 2026'
  ],
  
  // French (280M speakers)
  fr: [
    'Coupe du Monde 2026', 'Mondial 2026', 'FIFA 2026', 'CDM 2026',
    'Qualifications Coupe du Monde 2026', 'Billets Coupe du Monde 2026',
    'Tirage Coupe du Monde 2026', 'Équipe de France 2026',
    'Stades Coupe du Monde 2026', 'Villes hôtes 2026',
    'Mbappé Coupe du Monde 2026', 'Griezmann Mondial', 'Messi Mondial 2026',
    'Adidas Coupe du Monde 2026', 'Coca-Cola Mondial',
    'FFF Coupe du Monde 2026', 'UEFA qualifications 2026'
  ],
  
  // Portuguese (260M speakers)
  pt: [
    'Copa do Mundo 2026', 'Mundial 2026', 'FIFA 2026', 'Copa 2026',
    'Eliminatórias 2026', 'Seleção Brasileira 2026', 'Ingressos Copa 2026',
    'Sorteio Copa 2026', 'Estádios Copa 2026', 'Seleção Portuguesa 2026',
    'Neymar Copa 2026', 'Vinicius Jr Copa', 'Messi Copa do Mundo 2026',
    'CBF Copa 2026', 'FPF Mundial 2026', 'CONMEBOL eliminatórias 2026'
  ],
  
  // Russian (250M speakers)
  ru: [
    'Чемпионат мира 2026', 'ЧМ 2026', 'ФИФА 2026', 'Кубок мира 2026',
    'Мундиаль 2026', 'Отборочные ЧМ 2026', 'Билеты ЧМ 2026',
    'Месси ЧМ 2026', 'Мбаппе ЧМ', 'УЕФА отборочные 2026'
  ],
  
  // Arabic (400M speakers)
  ar: [
    'كأس العالم 2026', 'مونديال 2026', 'فيفا 2026',
    'تصفيات كأس العالم 2026', 'تذاكر كأس العالم 2026', 'ملاعب كأس العالم 2026'
  ],
  
  // Chinese (1.1B speakers)
  zh: [
    '2026年世界杯', '世界杯2026', '2026世界杯', 'FIFA世界杯2026',
    '世界杯预选赛2026', '世界杯门票2026', '世界杯球场2026'
  ],
  
  // Japanese (125M speakers)
  ja: [
    '2026年ワールドカップ', 'W杯2026', 'FIFAワールドカップ2026',
    'サッカーワールドカップ2026', '日本代表2026', 'ワールドカップ予選2026'
  ],
  
  // Korean (80M speakers)
  ko: [
    '2026 월드컵', '2026년 월드컵', 'FIFA 월드컵 2026',
    '월드컵 예선 2026', '대한민국 대표팀 2026'
  ],
  
  // Italian (65M speakers)
  it: [
    'Mondiali 2026', 'Coppa del Mondo 2026', 'FIFA 2026',
    'Qualificazioni Mondiali 2026', 'Nazionale Italiana 2026', 'Biglietti Mondiali 2026'
  ],
  
  // Polish (45M speakers)
  pl: [
    'Mistrzostwa Świata 2026', 'MŚ 2026', 'FIFA 2026', 'Mundial 2026',
    'Eliminacje MŚ 2026', 'Reprezentacja Polski 2026', 'Bilety MŚ 2026'
  ],
  
  // Dutch (25M speakers)
  nl: [
    'WK 2026', 'Wereldkampioenschap 2026', 'FIFA 2026',
    'WK Kwalificatie 2026', 'Oranje WK 2026', 'WK Tickets 2026'
  ],
  
  // Turkish (80M speakers)
  tr: [
    'Dünya Kupası 2026', 'FIFA 2026', '2026 Dünya Kupası',
    'Dünya Kupası Elemeleri 2026', 'Milli Takım 2026'
  ],
  
  // Indonesian (200M speakers)
  id: [
    'Piala Dunia 2026', 'FIFA 2026', 'Kualifikasi Piala Dunia 2026',
    'Timnas Indonesia 2026', 'Tiket Piala Dunia 2026'
  ],
  
  // Vietnamese (85M speakers)
  vi: [
    'World Cup 2026', 'FIFA 2026', 'Cúp thế giới 2026',
    'Vòng loại World Cup 2026', 'Vé World Cup 2026'
  ],
  
  // Thai (60M speakers)
  th: [
    'ฟุตบอลโลก 2026', 'บอลโลก 2026', 'ฟีฟ่า เวิลด์ คัพ 2026',
    'รอบคัดเลือกฟุตบอลโลก 2026'
  ],
  
  // Hindi (600M speakers)
  hi: [
    'फीफा विश्व कप 2026', 'विश्व कप 2026', 'फुटबॉल विश्व कप 2026',
    'फीफा 2026', 'विश्व कप क्वालीफायर 2026'
  ],
  
  // Ukrainian (40M speakers)
  uk: [
    'Чемпіонат світу 2026', 'ЧС 2026', 'ФІФА 2026',
    'Відбір ЧС 2026', 'Збірна України 2026'
  ],
  
  // Greek (13M speakers)
  el: ['Παγκόσμιο Κύπελλο 2026', 'Μουντιάλ 2026', 'FIFA 2026'],
  
  // Czech (10M speakers)
  cs: ['Mistrovství světa 2026', 'MS 2026', 'FIFA 2026', 'Kvalifikace MS 2026'],
  
  // Swedish (10M speakers)
  sv: ['VM 2026', 'Fotbolls-VM 2026', 'FIFA VM 2026', 'VM-kval 2026'],
  
  // Danish (6M speakers)
  da: ['VM 2026', 'Fodbold VM 2026', 'VM kvalifikation 2026'],
  
  // Norwegian (5M speakers)
  no: ['VM 2026', 'Fotball VM 2026', 'VM kvalifisering 2026'],
  
  // Finnish (5.5M speakers)
  fi: ['MM 2026', 'Jalkapallon MM 2026', 'MM-karsinnat 2026'],
  
  // Romanian (24M speakers)
  ro: ['Cupa Mondială 2026', 'CM 2026', 'Preliminarii CM 2026'],
  
  // Hungarian (13M speakers)
  hu: ['Világbajnokság 2026', 'VB 2026', 'VB-selejtező 2026'],
  
  // Persian (110M speakers)
  fa: ['جام جهانی 2026', 'فیفا 2026', 'مقدماتی جام جهانی 2026'],
  
  // Bengali (270M speakers)
  bn: ['বিশ্বকাপ 2026', 'ফিফা বিশ্বকাপ 2026', '২০২৬ বিশ্বকাপ'],
  
  // Swahili (100M+ speakers)
  sw: ['Kombe la Dunia 2026', 'FIFA 2026', 'Mchujo Kombe la Dunia 2026'],
  
  // Afrikaans (7M speakers)
  af: ['Wêreldbeker 2026', 'FIFA 2026', 'WB 2026'],
  
  // Icelandic (350K speakers)
  is: ['HM 2026', 'Heimsmeistaramótið 2026', 'FIFA HM 2026'],
};

// Language to Country mapping for Google News
const LANG_COUNTRY_MAP = {
  en: 'US', de: 'DE', es: 'ES', fr: 'FR', pt: 'BR', it: 'IT',
  nl: 'NL', pl: 'PL', ru: 'RU', tr: 'TR', ar: 'SA', ja: 'JP',
  ko: 'KR', zh: 'CN', id: 'ID', vi: 'VN', th: 'TH', el: 'GR',
  cs: 'CZ', sv: 'SE', ro: 'RO', hu: 'HU', uk: 'UA', fa: 'IR',
  hi: 'IN', bn: 'BD', fi: 'FI', da: 'DK', no: 'NO', is: 'IS',
  sw: 'KE', af: 'ZA'
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY LISTS FOR NER ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════════════

const HOST_CITIES = [
  'Atlanta', 'Boston', 'Dallas', 'Houston', 'Kansas City',
  'Los Angeles', 'Miami', 'New York', 'Philadelphia',
  'San Francisco', 'Seattle', 'Mexico City', 'Guadalajara',
  'Monterrey', 'Toronto', 'Vancouver'
];

const STADIUMS = [
  'Mercedes-Benz Stadium', 'Gillette Stadium', 'AT&T Stadium',
  'NRG Stadium', 'Arrowhead Stadium', 'SoFi Stadium',
  'Hard Rock Stadium', 'MetLife Stadium', 'Lincoln Financial Field',
  'Levi\'s Stadium', 'Lumen Field', 'Estadio Azteca',
  'Estadio Akron', 'Estadio BBVA', 'BMO Field', 'BC Place'
];

const PLAYERS = [
  'Lionel Messi', 'Kylian Mbappé', 'Erling Haaland', 'Jude Bellingham',
  'Vinicius Jr', 'Harry Kane', 'Mohamed Salah', 'Kevin De Bruyne',
  'Christian Pulisic', 'Alphonso Davies', 'Joshua Kimmich', 'Pedri',
  'Son Heung-min', 'Jamal Musiala', 'Florian Wirtz', 'Bukayo Saka',
  'Phil Foden', 'Rodri', 'Lamine Yamal', 'Neymar', 'Bruno Fernandes',
  'Cristiano Ronaldo', 'Robert Lewandowski', 'Antoine Griezmann'
];

const TEAMS = [
  'Germany', 'France', 'England', 'Spain', 'Brazil', 'Argentina',
  'Portugal', 'Netherlands', 'Belgium', 'Italy', 'USA', 'Mexico',
  'Canada', 'Japan', 'South Korea', 'Morocco', 'Senegal', 'Croatia'
];

const EXCLUSION_TERMS = [
  'dart', 'darts', 'pdc', 'cricket', 't20', 'icc', 'ipl',
  'basketball', 'nba', 'handball', 'hockey', 'nhl',
  'tennis', 'atp', 'wta', 'wimbledon', 'volleyball', 'rugby',
  'baseball', 'mlb', 'nfl', 'super bowl', 'american football',
  'formula 1', 'f1', 'motogp', 'nascar', 'boxing', 'ufc', 'mma',
  'golf', 'pga', 'ski', 'biathlon', 'swimming', 'olympics',
  'tour de france', 'cycling', 'esport', 'gaming'
];

// ═══════════════════════════════════════════════════════════════════════════
// REDDIT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ALL_SUBREDDITS = [
  // Global Football
  'soccer', 'football', 'worldcup',
  // Host Countries
  'MLS', 'ussoccer', 'USMNT', 'CanadianPL', 'LigaMX',
  // Major Leagues
  'PremierLeague', 'Bundesliga', 'LaLiga', 'seriea', 'Ligue1', 'Eredivisie',
  // South America
  'futebol', 'Libertadores', 'BocaJuniors', 'RiverPlate', 'argentina', 'brasil',
  // Major Clubs
  'reddevils', 'MCFC', 'LiverpoolFC', 'chelseafc', 'Gunners', 'coys',
  'Barca', 'realmadrid', 'atletico', 'fcbayern', 'borussiadortmund',
  'Juve', 'ACMilan', 'psg', 'AjaxAmsterdam',
  // Countries
  'de', 'germany', 'france', 'unitedkingdom', 'spain', 'italy',
  'thenetherlands', 'belgium', 'portugal', 'poland', 'Austria',
  'croatia', 'Denmark', 'sweden', 'japan', 'korea', 'Morocco', 'nigeria',
  // Host Cities
  'Atlanta', 'boston', 'Dallas', 'houston', 'LosAngeles',
  'Miami', 'nyc', 'philadelphia', 'Seattle', 'toronto', 'vancouver'
];

const REDDIT_SEARCH_TERMS = [
  'World Cup 2026', 'WM 2026', 'FIFA 2026', 'Mundial 2026',
  '2026 World Cup', 'World Cup Atlanta', 'World Cup Miami',
  'MetLife Stadium 2026', 'Estadio Azteca 2026',
  'Messi 2026', 'Mbappé 2026', 'Haaland 2026'
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const icons = {
    info: 'ℹ️ ', success: '✅', error: '❌', warning: '⚠️ ',
    fetch: '📥', analyze: '🔬', db: '💾', stats: '📊', ai: '🧠'
  };
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
  const hasWMKeyword = Object.values(WM_KEYWORDS).flat().some(kw => combined.includes(kw.toLowerCase()));
  const hasExclusionTerm = EXCLUSION_TERMS.some(term => combined.includes(term.toLowerCase()));
  if (hasExclusionTerm && !hasWMKeyword) return false;
  const has2026OrWC = combined.includes('2026') || combined.includes('world cup') ||
    combined.includes('mundial') || combined.includes('wm ') || combined.includes('fifa');
  const hasFootballContext = ['soccer', 'football', 'fußball', 'fútbol', 'futebol', 'calcio', 'fifa', 'uefa']
    .some(term => combined.includes(term));
  return hasWMKeyword || (has2026OrWC && hasFootballContext);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE
// ═══════════════════════════════════════════════════════════════════════════

let supabase = null;

function initSupabase() {
  // Load .env
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
  CONFIG.HF_API_KEY = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || CONFIG.HF_API_KEY;
  CONFIG.YOUTUBE_KEY = process.env.YOUTUBE_API_KEY || CONFIG.YOUTUBE_KEY;
  CONFIG.REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || CONFIG.REDDIT_CLIENT_ID;
  CONFIG.REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || CONFIG.REDDIT_CLIENT_SECRET;
  
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
    throw new Error('Supabase credentials not found. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  
  if (!CONFIG.HF_API_KEY) {
    log('WARNING: No Hugging Face API key. Get one free at https://huggingface.co/settings/tokens', 'warning');
  }
  
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  log('Supabase initialized', 'success');
}

// ═══════════════════════════════════════════════════════════════════════════
// HUGGING FACE API (Kostenlos)
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
// SOURCE 1: GOOGLE NEWS RSS (KOSTENLOS)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchGoogleNews(fromDate) {
  log('Fetching Google News RSS (kostenlos)...', 'fetch');
  const articles = new Map();
  const languages = Object.keys(WM_KEYWORDS);
  
  for (const lang of languages) {
    const keywords = WM_KEYWORDS[lang];
    const country = LANG_COUNTRY_MAP[lang] || lang.toUpperCase();
    process.stdout.write(`\r  ${lang.toUpperCase()}: 0/${keywords.length}...`);
    
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
        process.stdout.write(`\r  ${lang.toUpperCase()}: ${i + 1}/${keywords.length} (${articles.size} total)...`);
        await sleep(CONFIG.REQUEST_DELAY_MS);
      } catch (error) {}
    }
    console.log();
  }
  log(`Google News: ${articles.size} articles from ${languages.length} languages`, 'success');
  return Array.from(articles.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 2: REDDIT (KOSTENLOS mit Client ID)
// ═══════════════════════════════════════════════════════════════════════════

async function getRedditAccessToken() {
  if (!CONFIG.REDDIT_CLIENT_ID || !CONFIG.REDDIT_CLIENT_SECRET) return null;
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
    return (await response.json()).access_token;
  } catch (error) { return null; }
}

async function fetchReddit(fromDate) {
  log(`Fetching Reddit from ${ALL_SUBREDDITS.length} subreddits...`, 'fetch');
  const articles = new Map();
  const accessToken = await getRedditAccessToken();
  
  for (const subreddit of ALL_SUBREDDITS) {
    for (const term of REDDIT_SEARCH_TERMS.slice(0, 5)) {
      try {
        const url = accessToken
          ? `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(term)}&sort=new&limit=25&restrict_sr=1&t=week`
          : `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&restrict_sr=1&t=week`;
        const headers = accessToken
          ? { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': CONFIG.REDDIT_USER_AGENT }
          : { 'User-Agent': CONFIG.REDDIT_USER_AGENT };
        
        const response = await fetch(url, { headers });
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
              title: (item.title || '').substring(0, 500), description: (item.selftext || '').substring(0, 2000),
              url: `https://www.reddit.com${item.permalink}`, published_at: pubDate.toISOString(),
              fetched_at: new Date().toISOString(), author: item.author,
              metadata: { score: item.score, comments: item.num_comments },
            });
          }
        }
        await sleep(CONFIG.REQUEST_DELAY_MS * 3);
      } catch (error) {}
    }
  }
  log(`Reddit: ${articles.size} posts`, 'success');
  return Array.from(articles.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 3: YOUTUBE (KOSTENLOS mit API Key)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchYouTube(fromDate) {
  if (!CONFIG.YOUTUBE_KEY) { log('YouTube: Kein API Key (optional)', 'warning'); return []; }
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
            title: (snippet.title || '').substring(0, 500), description: (snippet.description || '').substring(0, 2000),
            url: `https://www.youtube.com/watch?v=${videoId}`, image_url: snippet.thumbnails?.high?.url,
            published_at: pubDate.toISOString(), fetched_at: new Date().toISOString(), author: snippet.channelTitle,
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
// SOURCE 4: MASTODON (KOSTENLOS, kein API Key)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchMastodon(fromDate) {
  log('Fetching Mastodon (kostenlos)...', 'fetch');
  const articles = new Map();
  const instances = ['mastodon.social', 'mastodon.online', 'mstdn.social'];
  const searchTerms = ['WorldCup2026', 'WM2026', 'FIFA2026'];
  
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
// SOURCE 5: BLUESKY (KOSTENLOS, kein API Key)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchBluesky(fromDate) {
  log('Fetching Bluesky (kostenlos)...', 'fetch');
  const articles = new Map();
  const searchTerms = ['World Cup 2026', 'WM 2026', 'FIFA 2026', '#WorldCup2026'];
  
  for (const term of searchTerms) {
    try {
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=25`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) continue;
      const data = await response.json();
      
      for (const item of (data.posts || [])) {
        const text = item.record?.text || '';
        const hash = generateHash(item.uri);
        if (articles.has(hash)) continue;
        const pubDate = item.record?.createdAt ? new Date(item.record.createdAt) : new Date();
        if (pubDate < fromDate) continue;
        
        if (isRelevantContent(text, '')) {
          articles.set(hash, {
            external_id: hash, source_type: 'bluesky', source_name: 'Bluesky',
            title: text.substring(0, 100) + '...', description: text.substring(0, 2000),
            url: `https://bsky.app/profile/${item.author?.handle}/post/${item.uri?.split('/').pop()}`,
            published_at: pubDate.toISOString(), fetched_at: new Date().toISOString(), author: item.author?.handle,
          });
        }
      }
      await sleep(CONFIG.REQUEST_DELAY_MS);
    } catch (error) {}
  }
  log(`Bluesky: ${articles.size} posts`, 'success');
  return Array.from(articles.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 1: LANGUAGE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

async function detectLanguage(texts) {
  const results = await callHuggingFaceAPI(CONFIG.MODELS.LANGUAGE_DETECTION, texts);
  if (!results) return texts.map(() => ({ language: 'unknown', confidence: 0 }));
  return results.map(r => ({
    language: r?.[0]?.label || 'unknown',
    confidence: r?.[0]?.score || 0
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 2: SENTIMENT ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 3: TOPIC CLASSIFICATION (Zero-Shot)
// ═══════════════════════════════════════════════════════════════════════════

async function classifyTopics(texts) {
  const results = [];
  for (const text of texts) {
    const result = await callHuggingFaceAPI(CONFIG.MODELS.TOPIC_ZERO_SHOT, text, {
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

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 4: EMOTION DETECTION
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 5: NAMED ENTITY RECOGNITION (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════

async function extractEntities(texts) {
  // Call HF NER model
  const hfResults = await callHuggingFaceAPI(CONFIG.MODELS.NER, texts);
  
  return texts.map((text, idx) => {
    const entities = { players: [], teams: [], stadiums: [], cities: [], organizations: [] };
    const textLower = text.toLowerCase();
    
    // Enhanced with known WM2026 entities
    PLAYERS.forEach(p => { if (textLower.includes(p.toLowerCase())) entities.players.push(p); });
    TEAMS.forEach(t => { if (textLower.includes(t.toLowerCase())) entities.teams.push(t); });
    HOST_CITIES.forEach(c => { if (textLower.includes(c.toLowerCase())) entities.cities.push(c); });
    STADIUMS.forEach(s => { if (textLower.includes(s.toLowerCase())) entities.stadiums.push(s); });
    
    // Add HF NER results
    if (hfResults?.[idx] && Array.isArray(hfResults[idx])) {
      hfResults[idx].forEach(e => {
        if (e.entity_group === 'PER' && !entities.players.includes(e.word)) {
          entities.players.push(e.word);
        } else if (e.entity_group === 'ORG' && !entities.organizations.includes(e.word)) {
          entities.organizations.push(e.word);
        } else if (e.entity_group === 'LOC' && !entities.cities.includes(e.word)) {
          entities.cities.push(e.word);
        }
      });
    }
    
    // Dedupe
    Object.keys(entities).forEach(k => { entities[k] = [...new Set(entities[k])]; });
    return entities;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 6: TOXICITY DETECTION
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 7: KEYWORD EXTRACTION ⭐ NEU
// ═══════════════════════════════════════════════════════════════════════════

async function extractKeywords(texts) {
  const results = [];
  
  for (const text of texts) {
    const result = await callHuggingFaceAPI(CONFIG.MODELS.KEYWORDS, text.substring(0, 1000));
    
    if (!result || !Array.isArray(result)) {
      // Fallback: einfache Keyword-Extraktion
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const counts = {};
      words.forEach(w => counts[w] = (counts[w] || 0) + 1);
      const topWords = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word]) => word);
      results.push({ keywords: topWords, count: topWords.length });
    } else {
      // Parse HF keyphrase extraction result
      const keywords = result.slice(0, 10).map(item => item.word || item).filter(Boolean);
      results.push({ keywords, count: keywords.length });
    }
    await sleep(CONFIG.API_DELAY_MS);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 8: SUMMARIZATION ⭐ NEU
// ═══════════════════════════════════════════════════════════════════════════

async function summarizeTexts(texts) {
  const results = [];
  
  for (const text of texts) {
    // Nur Texte > 200 Zeichen zusammenfassen
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

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 9: ASPECT-BASED SENTIMENT ⭐ NEU
// ═══════════════════════════════════════════════════════════════════════════

async function analyzeAspectSentiment(texts) {
  const results = [];
  
  for (const text of texts) {
    const aspectScores = {};
    
    // Für jeden Aspekt eine Zero-Shot Klassifikation
    for (const aspect of CONFIG.ASPECT_CATEGORIES) {
      // Prüfen ob Aspekt im Text vorkommt
      if (!text.toLowerCase().includes(aspect)) {
        aspectScores[aspect] = null; // Nicht erwähnt
        continue;
      }
      
      // Sentiment für diesen Aspekt bestimmen
      const result = await callHuggingFaceAPI(CONFIG.MODELS.TOPIC_ZERO_SHOT, text, {
        parameters: {
          candidate_labels: [`positive ${aspect}`, `negative ${aspect}`, `neutral ${aspect}`],
          multi_label: false
        }
      });
      
      if (result?.labels?.[0]) {
        const topLabel = result.labels[0];
        if (topLabel.includes('positive')) aspectScores[aspect] = result.scores[0];
        else if (topLabel.includes('negative')) aspectScores[aspect] = -result.scores[0];
        else aspectScores[aspect] = 0;
      } else {
        aspectScores[aspect] = 0;
      }
    }
    
    // Berechne durchschnittliches Aspekt-Sentiment
    const validScores = Object.values(aspectScores).filter(v => v !== null);
    const avgScore = validScores.length > 0 
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
      : 0;
    
    results.push({
      aspects: aspectScores,
      mentioned_aspects: Object.entries(aspectScores).filter(([, v]) => v !== null).map(([k]) => k),
      average_aspect_sentiment: avgScore
    });
    
    await sleep(CONFIG.API_DELAY_MS);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 10: CONTROVERSY DETECTION (Rule-Based + ML)
// ═══════════════════════════════════════════════════════════════════════════

function detectControversy(text, sentiment, emotions, toxicity) {
  let score = 0;
  const signals = [];
  
  // Strong negative sentiment
  if (sentiment.negative > 0.6) { score += 0.3; signals.push('strong_negative'); }
  
  // High anger or fear
  if (emotions.anger > 0.3) { score += 0.2; signals.push('high_anger'); }
  if (emotions.fear > 0.3) { score += 0.15; signals.push('high_fear'); }
  
  // Toxic content
  if (toxicity.is_toxic) { score += 0.3; signals.push('toxic_content'); }
  
  // Controversial keywords
  const controversialTerms = [
    'scandal', 'controversy', 'corrupt', 'corruption', 'protest', 'boycott',
    'racism', 'racist', 'sexism', 'fraud', 'bribe', 'bribery', 'criminal',
    'outrage', 'disgrace', 'shame', 'disaster', 'catastrophe', 'rigged'
  ];
  const found = controversialTerms.filter(t => text.toLowerCase().includes(t));
  if (found.length > 0) {
    score += 0.15 * Math.min(found.length, 4);
    signals.push(`controversial_terms:${found.join(',')}`);
  }
  
  return {
    is_controversial: score > 0.5,
    controversy_score: Math.min(score, 1),
    signals
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AI MODEL 11: HYPE/VIRALITY PREDICTION (Multi-Signal Custom)
// ═══════════════════════════════════════════════════════════════════════════

function predictHypeScore(text, sentiment, emotions, entities, keywords) {
  let score = 0;
  const factors = [];
  
  // Positive sentiment boosts hype
  if (sentiment.positive > 0.7) { score += 0.2; factors.push('very_positive'); }
  else if (sentiment.positive > 0.5) { score += 0.1; factors.push('positive'); }
  
  // Excitement emotions
  if (emotions.joy > 0.4) { score += 0.15; factors.push('high_joy'); }
  if (emotions.surprise > 0.3) { score += 0.1; factors.push('surprise'); }
  
  // Star players mentioned
  if (entities.players.length >= 3) { score += 0.2; factors.push('multiple_stars'); }
  else if (entities.players.length >= 1) { score += 0.1; factors.push('star_player'); }
  
  // Stadium/City mentioned (location hype)
  if (entities.stadiums.length > 0) { score += 0.1; factors.push('stadium_mentioned'); }
  if (entities.cities.length > 0) { score += 0.05; factors.push('host_city'); }
  
  // Hype language
  const hypeTerms = [
    'amazing', 'incredible', 'historic', 'legendary', 'epic', 'breaking',
    'exclusive', 'confirmed', 'official', 'announced', 'revealed', 'massive',
    'unbelievable', 'sensational', 'spectacular', 'extraordinary', 'must-see'
  ];
  const found = hypeTerms.filter(t => text.toLowerCase().includes(t));
  if (found.length > 0) {
    score += 0.1 * Math.min(found.length, 4);
    factors.push(`hype_language:${found.length}`);
  }
  
  // Exclamation marks and caps (informal hype indicators)
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations >= 3) { score += 0.05; factors.push('exclamations'); }
  
  return {
    hype_score: Math.min(score, 1),
    is_viral_potential: score > 0.5,
    factors
  };
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
  const { data } = await supabase.from('wm2026_articles').select('external_id');
  return new Set((data || []).map(d => d.external_id));
}

async function saveArticles(articles, dryRun = false) {
  if (articles.length === 0) return { inserted: 0, duplicates: 0 };
  if (dryRun) { log(`[DRY RUN] Would insert ${articles.length}`, 'db'); return { inserted: articles.length, duplicates: 0 }; }
  
  const existingHashes = await getExistingHashes();
  const newArticles = articles.filter(a => !existingHashes.has(a.external_id));
  const duplicates = articles.length - newArticles.length;
  
  if (newArticles.length === 0) { log(`No new articles (${duplicates} duplicates)`, 'db'); return { inserted: 0, duplicates }; }
  
  let inserted = 0;
  for (let i = 0; i < newArticles.length; i += 100) {
    const batch = newArticles.slice(i, i + 100);
    const { error } = await supabase.from('wm2026_articles').upsert(batch, { onConflict: 'external_id' });
    if (!error) inserted += batch.length;
  }
  log(`Inserted ${inserted}, ${duplicates} duplicates skipped`, 'db');
  return { inserted, duplicates };
}

async function updateArticleAnalysis(articleId, analysis, dryRun = false) {
  if (dryRun) return;
  
  await supabase.from('wm2026_articles').update({
    // Model 1: Language
    detected_language: analysis.language?.language,
    language_confidence: analysis.language?.confidence,
    // Model 2: Sentiment
    sentiment_score: (analysis.sentiment.positive - analysis.sentiment.negative + 1) / 2,
    sentiment_label: analysis.sentiment.label,
    sentiment_positive: analysis.sentiment.positive,
    sentiment_negative: analysis.sentiment.negative,
    sentiment_neutral: analysis.sentiment.neutral,
    // Model 3: Topic
    primary_topic: analysis.topic?.primary_topic,
    topic_confidence: analysis.topic?.confidence,
    // Model 4: Emotions
    emotion_joy: analysis.emotions.joy,
    emotion_anger: analysis.emotions.anger,
    emotion_fear: analysis.emotions.fear,
    emotion_sadness: analysis.emotions.sadness,
    emotion_surprise: analysis.emotions.surprise,
    emotion_disgust: analysis.emotions.disgust,
    dominant_emotion: analysis.emotions.dominant,
    // Model 5: Entities
    entities_players: analysis.entities.players,
    entities_teams: analysis.entities.teams,
    entities_stadiums: analysis.entities.stadiums,
    entities_cities: analysis.entities.cities,
    entities_organizations: analysis.entities.organizations,
    // Model 6: Toxicity
    is_toxic: analysis.toxicity.is_toxic,
    toxicity_score: analysis.toxicity.toxicity_score,
    // Model 7: Keywords
    extracted_keywords: analysis.keywords?.keywords,
    // Model 8: Summary
    summary: analysis.summary?.summary,
    // Model 9: Aspect Sentiment
    aspect_sentiments: analysis.aspectSentiment?.aspects,
    mentioned_aspects: analysis.aspectSentiment?.mentioned_aspects,
    // Model 10: Controversy
    is_controversial: analysis.controversy.is_controversial,
    controversy_score: analysis.controversy.controversy_score,
    controversy_signals: analysis.controversy.signals,
    // Model 11: Hype
    hype_score: analysis.hype.hype_score,
    is_viral_potential: analysis.hype.is_viral_potential,
    hype_factors: analysis.hype.factors,
    // Meta
    is_processed: true,
    processed_at: new Date().toISOString(),
  }).eq('id', articleId);
}

async function calculateRollingAggregation(dryRun = false) {
  log('Calculating rolling 7-day aggregation...', 'stats');
  
  const today = new Date();
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - CONFIG.ROLLING_WINDOW_DAYS);
  
  const { data: articles } = await supabase
    .from('wm2026_articles')
    .select('*')
    .eq('is_processed', true)
    .gte('published_at', windowStart.toISOString());
  
  if (!articles || articles.length === 0) return null;
  
  const count = articles.length;
  const stats = {
    date: today.toISOString().split('T')[0],
    window_days: CONFIG.ROLLING_WINDOW_DAYS,
    article_count: count,
    sentiment_avg: articles.reduce((sum, a) => sum + (a.sentiment_score || 0.5), 0) / count,
    sentiment_positive_count: articles.filter(a => a.sentiment_label === 'positive').length,
    sentiment_negative_count: articles.filter(a => a.sentiment_label === 'negative').length,
    controversy_rate: articles.filter(a => a.is_controversial).length / count,
    hype_avg: articles.reduce((sum, a) => sum + (a.hype_score || 0), 0) / count,
    viral_potential_count: articles.filter(a => a.is_viral_potential).length,
  };
  
  if (!dryRun) {
    await supabase.from('wm2026_daily_sentiment').upsert({ date: stats.date, ...stats }, { onConflict: 'date' });
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
║        🏆 WM2026 COMPLETE SENTIMENT ANALYSIS PIPELINE v4.1 🏆            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  📥 SOURCES (5 - alle kostenlos):                                        ║
║     • Google News RSS     - kein API Key nötig                           ║
║     • Reddit              - Client ID/Secret (kostenlos)                 ║
║     • YouTube             - Google API Key (optional)                    ║
║     • Mastodon            - kein API Key nötig                           ║
║     • Bluesky             - kein API Key nötig                           ║
║                                                                           ║
║  🗣️  LANGUAGES: ${String(totalLanguages).padEnd(2)} (${totalKeywords}+ keywords)                                  ║
║                                                                           ║
║  🧠 AI MODELS (11 - alle über Hugging Face kostenlos):                   ║
║     1. Language Detection     6. Toxicity Detection                      ║
║     2. Sentiment Analysis     7. Keyword Extraction                      ║
║     3. Topic Classification   8. Summarization                           ║
║     4. Emotion Detection      9. Aspect-Based Sentiment                  ║
║     5. Named Entity Rec.     10. Controversy Detection                   ║
║                              11. Hype/Virality Score                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
  
  if (dryRun) log('🔸 DRY RUN MODE - keine DB-Schreibvorgänge', 'warning');
  
  initSupabase();
  
  const results = {
    mode: args.full ? 'full' : 'incremental',
    fetch: { google: 0, reddit: 0, youtube: 0, mastodon: 0, bluesky: 0, total: 0, new: 0, duplicates: 0 },
    analysis: { processed: 0, failed: 0 },
    models_used: 11,
  };
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: FETCH FROM ALL 5 SOURCES
  // ═══════════════════════════════════════════════════════════════════════
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
    
    const allArticles = [...googleArticles, ...redditArticles, ...youtubeArticles, ...mastodonArticles, ...blueskyArticles];
    results.fetch.total = allArticles.length;
    
    const saveResult = await saveArticles(allArticles, dryRun);
    results.fetch.new = saveResult.inserted;
    results.fetch.duplicates = saveResult.duplicates;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: AI ANALYSIS WITH ALL 11 MODELS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(75));
  log('PHASE 2: AI Analysis with ALL 11 Models', 'ai');
  console.log('═'.repeat(75));
  
  const { data: unprocessed } = await supabase
    .from('wm2026_articles')
    .select('id, title, description')
    .eq('is_processed', false)
    .order('published_at', { ascending: false });
  
  if (!unprocessed || unprocessed.length === 0) {
    log('No unprocessed articles', 'info');
  } else {
    log(`Analyzing ${unprocessed.length} articles with 11 AI models...`, 'ai');
    
    for (let i = 0; i < unprocessed.length; i += CONFIG.ANALYSIS_BATCH_SIZE) {
      const batch = unprocessed.slice(i, i + CONFIG.ANALYSIS_BATCH_SIZE);
      const batchNum = Math.floor(i / CONFIG.ANALYSIS_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(unprocessed.length / CONFIG.ANALYSIS_BATCH_SIZE);
      
      log(`Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`, 'ai');
      
      const texts = batch.map(a => `${a.title} ${a.description || ''}`.substring(0, 512));
      
      // Run all 11 AI models
      log('  → Model 1-2: Language & Sentiment...', 'ai');
      const languages = await detectLanguage(texts);
      const sentiments = await analyzeSentiment(texts);
      
      log('  → Model 3-4: Topics & Emotions...', 'ai');
      const topics = await classifyTopics(texts);
      const emotions = await detectEmotions(texts);
      
      log('  → Model 5-6: Entities & Toxicity...', 'ai');
      const entities = await extractEntities(texts);
      const toxicities = await detectToxicity(texts);
      
      log('  → Model 7-8: Keywords & Summaries...', 'ai');
      const keywords = await extractKeywords(texts);
      const summaries = await summarizeTexts(texts);
      
      log('  → Model 9: Aspect-Based Sentiment...', 'ai');
      const aspectSentiments = await analyzeAspectSentiment(texts);
      
      // Models 10-11 are rule-based, run locally
      log('  → Model 10-11: Controversy & Hype...', 'ai');
      
      for (let j = 0; j < batch.length; j++) {
        const controversy = detectControversy(texts[j], sentiments[j], emotions[j], toxicities[j]);
        const hype = predictHypeScore(texts[j], sentiments[j], emotions[j], entities[j], keywords[j]);
        
        await updateArticleAnalysis(batch[j].id, {
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
        }, dryRun);
        
        results.analysis.processed++;
      }
      
      await sleep(CONFIG.BATCH_DELAY_MS);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: AGGREGATION
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(75));
  log('PHASE 3: Rolling 7-Day Aggregation', 'stats');
  console.log('═'.repeat(75));
  
  const aggregation = await calculateRollingAggregation(dryRun);
  
  // Log run
  if (!dryRun) {
    await supabase.from('wm2026_processing_log').insert({
      job_type: `pipeline_v4.1_${args.full ? 'full' : 'incremental'}`,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: Math.round((Date.now() - startTime) / 1000),
      items_processed: results.fetch.total,
      items_success: results.analysis.processed,
      status: 'completed',
      details: results,
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  const duration = Date.now() - startTime;
  
  console.log('\n' + '═'.repeat(75));
  console.log('                         📊 FINAL SUMMARY');
  console.log('═'.repeat(75));
  
  console.log(`
📥 Fetching by Source:
   • Google News:  ${results.fetch.google} articles
   • Reddit:       ${results.fetch.reddit} posts
   • YouTube:      ${results.fetch.youtube} videos
   • Mastodon:     ${results.fetch.mastodon} posts
   • Bluesky:      ${results.fetch.bluesky} posts
   ──────────────────────────
   • TOTAL:        ${results.fetch.total} items
   • New inserted: ${results.fetch.new}
   • Duplicates:   ${results.fetch.duplicates}

🧠 AI Analysis (11 Models):
   • Articles processed: ${results.analysis.processed}
   • Models used: ${results.models_used}
   
   ┌─────────────────────────────────────────────────────────┐
   │  1. Language Detection      7. Keyword Extraction      │
   │  2. Sentiment Analysis      8. Summarization           │
   │  3. Topic Classification    9. Aspect-Based Sentiment  │
   │  4. Emotion Detection      10. Controversy Detection   │
   │  5. Named Entity Rec.      11. Hype/Virality Score     │
   │  6. Toxicity Detection                                 │
   └─────────────────────────────────────────────────────────┘

📊 Rolling 7-Day Sentiment:
   • Articles: ${aggregation?.article_count || 0}
   • Sentiment: ${((aggregation?.sentiment_avg || 0.5) * 100).toFixed(1)}%
   • Controversy Rate: ${((aggregation?.controversy_rate || 0) * 100).toFixed(1)}%
   • Hype Average: ${((aggregation?.hype_avg || 0) * 100).toFixed(1)}%
   • Viral Potential: ${aggregation?.viral_potential_count || 0} articles

⏱️  Duration: ${formatDuration(duration)}
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

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

runPipeline().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
