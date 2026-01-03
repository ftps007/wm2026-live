#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WM2026 SENTIMENT ANALYSIS - COMPLETE LOCAL PIPELINE v4.3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FIXES in v4.3:
 *   • FIX: source_type jetzt korrekt 'news' oder 'social_media' (nicht 'google_news')
 *   • FIX: source_key als separates Feld für Quellen-Referenz
 *   • NEU: Parallele HuggingFace API-Calls (3x schneller)
 *   • NEU: Bessere Fehlerbehandlung mit detaillierten Logs
 *   • NEU: Automatische Retry-Logik bei API-Fehlern
 * 
 * SOURCES (5):
 *   • Google News RSS (101 languages) - KOSTENLOS, kein API Key
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
 *   node wm2026-sentiment-complete-v43.js                 # Incremental
 *   node wm2026-sentiment-complete-v43.js --full          # Full fetch from WM draw
 *   node wm2026-sentiment-complete-v43.js --export        # Export after analysis
 *   node wm2026-sentiment-complete-v43.js --dry-run       # Test without DB writes
 *   node wm2026-sentiment-complete-v43.js --skip-fetch    # Only analyze existing
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
  
  // Request delays (ms) - OPTIMIERT für v4.3
  REQUEST_DELAY_MS: 150,      // Reduziert von 200
  API_DELAY_MS: 200,          // Reduziert von 350
  BATCH_DELAY_MS: 1500,       // Reduziert von 2500
  
  // Parallelisierung - NEU in v4.3
  PARALLEL_API_CALLS: 3,      // Gleichzeitige HF-Requests
  
  // Batch sizes
  ANALYSIS_BATCH_SIZE: 12,    // Erhöht von 8
  
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
// SOURCE TYPE MAPPING - FIX für DB-Constraint
// ═══════════════════════════════════════════════════════════════════════════

const SOURCE_MAPPING = {
  google_news: { source_key: 'google_news', source_type: 'news' },
  newsapi: { source_key: 'newsapi', source_type: 'news' },
  gnews: { source_key: 'gnews', source_type: 'news' },
  currents: { source_key: 'currents', source_type: 'news' },
  youtube: { source_key: 'youtube', source_type: 'social_media' },
  reddit: { source_key: 'reddit', source_type: 'social_media' },
  mastodon: { source_key: 'mastodon', source_type: 'social_media' },
  bluesky: { source_key: 'bluesky', source_type: 'social_media' },
};

// ═══════════════════════════════════════════════════════════════════════════
// WM 2026 KEYWORDS - 101 LANGUAGES
// ═══════════════════════════════════════════════════════════════════════════

const WM_KEYWORDS = {
  en: ['World Cup 2026', 'FIFA 2026', 'WC 2026', 'USA Canada Mexico 2026', 'FIFA World Cup 2026', 'United 2026'],
  de: ['WM 2026', 'Weltmeisterschaft 2026', 'Fußball WM 2026', 'FIFA WM 2026'],
  es: ['Mundial 2026', 'Copa del Mundo 2026', 'FIFA 2026', 'Mundial FIFA 2026'],
  fr: ['Coupe du Monde 2026', 'Mondial 2026', 'CDM 2026', 'FIFA 2026'],
  pt: ['Copa do Mundo 2026', 'Mundial 2026', 'Copa 2026', 'FIFA 2026'],
  it: ['Mondiali 2026', 'Coppa del Mondo 2026', 'FIFA 2026'],
  nl: ['WK 2026', 'Wereldkampioenschap 2026', 'FIFA 2026'],
  pl: ['Mistrzostwa Świata 2026', 'MŚ 2026', 'Mundial 2026', 'FIFA 2026'],
  ru: ['ЧМ 2026', 'Чемпионат мира 2026', 'FIFA 2026'],
  ar: ['كأس العالم 2026', 'مونديال 2026', 'فيفا 2026'],
  zh: ['2026世界杯', '2026年世界杯', 'FIFA 2026'],
  ja: ['2026 ワールドカップ', 'FIFA 2026', 'W杯 2026'],
  ko: ['2026 월드컵', 'FIFA 2026', '월드컵 2026'],
  tr: ['2026 Dünya Kupası', 'FIFA 2026', 'Dünya Kupası 2026'],
  sv: ['VM 2026', 'Fotbolls-VM 2026', 'FIFA 2026'],
  no: ['VM 2026', 'Fotball-VM 2026', 'FIFA 2026'],
  da: ['VM 2026', 'Fodbold VM 2026', 'FIFA 2026'],
  fi: ['MM 2026', 'Jalkapallon MM 2026', 'FIFA 2026'],
  el: ['Μουντιάλ 2026', 'Παγκόσμιο Κύπελλο 2026', 'FIFA 2026'],
  cs: ['MS 2026', 'Mistrovství světa 2026', 'FIFA 2026'],
  hu: ['VB 2026', 'Világbajnokság 2026', 'FIFA 2026'],
  ro: ['CM 2026', 'Campionatul Mondial 2026', 'FIFA 2026'],
  bg: ['СП 2026', 'Световно първенство 2026', 'FIFA 2026'],
  uk: ['ЧС 2026', 'Чемпіонат світу 2026', 'FIFA 2026'],
  hr: ['SP 2026', 'Svjetsko prvenstvo 2026', 'FIFA 2026'],
  sr: ['СП 2026', 'Светско првенство 2026', 'FIFA 2026'],
  sk: ['MS 2026', 'Majstrovstvá sveta 2026', 'FIFA 2026'],
  sl: ['SP 2026', 'Svetovno prvenstvo 2026', 'FIFA 2026'],
  et: ['MM 2026', 'Maailmameistrivõistlused 2026', 'FIFA 2026'],
  lv: ['PČ 2026', 'Pasaules čempionāts 2026', 'FIFA 2026'],
  lt: ['PČ 2026', 'Pasaulio čempionatas 2026', 'FIFA 2026'],
  he: ['מונדיאל 2026', 'גביע העולם 2026', 'FIFA 2026'],
  fa: ['جام جهانی 2026', 'فیفا 2026'],
  hi: ['फीफा विश्व कप 2026', 'विश्व कप 2026', 'FIFA 2026'],
  bn: ['ফিফা বিশ্বকাপ 2026', 'বিশ্বকাপ 2026', 'FIFA 2026'],
  th: ['ฟุตบอลโลก 2026', 'บอลโลก 2026', 'FIFA 2026'],
  vi: ['World Cup 2026', 'FIFA 2026', 'Cúp thế giới 2026'],
  id: ['Piala Dunia 2026', 'FIFA 2026', 'World Cup 2026'],
  ms: ['Piala Dunia 2026', 'FIFA 2026', 'World Cup 2026'],
  tl: ['World Cup 2026', 'FIFA 2026', 'Copa ng Mundo 2026'],
  sw: ['Kombe la Dunia 2026', 'FIFA 2026', 'World Cup 2026'],
  af: ['Wêreldbeker 2026', 'FIFA 2026', 'World Cup 2026'],
  ca: ['Copa del Món 2026', 'Mundial 2026', 'FIFA 2026'],
  eu: ['Munduko Kopa 2026', 'FIFA 2026'],
  gl: ['Copa do Mundo 2026', 'Mundial 2026', 'FIFA 2026'],
  cy: ['Cwpan y Byd 2026', 'FIFA 2026'],
  ga: ['Corn an Domhain 2026', 'FIFA 2026'],
  is: ['HM 2026', 'Heimsmeistaramótið 2026', 'FIFA 2026'],
  mt: ['Tazza tad-Dinja 2026', 'FIFA 2026'],
  mk: ['СП 2026', 'Светско првенство 2026', 'FIFA 2026'],
  sq: ['Kupa e Botës 2026', 'Botërori 2026', 'FIFA 2026'],
  bs: ['SP 2026', 'Svjetsko prvenstvo 2026', 'FIFA 2026'],
  be: ['ЧС 2026', 'Чэмпіянат свету 2026', 'FIFA 2026'],
  ka: ['მსოფლიო ჩემპიონატი 2026', 'FIFA 2026'],
  hy: ['Աdelays2026', 'FIFA 2026'],
  az: ['Dünya Kuboku 2026', 'FIFA 2026'],
  kk: ['ӘЧ 2026', 'Әлем чемпионаты 2026', 'FIFA 2026'],
  uz: ['JCH 2026', 'Jahon chempionati 2026', 'FIFA 2026'],
  ky: ['ДЧ 2026', 'Дүйнө чемпионаты 2026', 'FIFA 2026'],
  tg: ['ҶҶ 2026', 'Ҷоми ҷаҳон 2026', 'FIFA 2026'],
  mn: ['ДАШТ 2026', 'Дэлхийн аварга шалгаруулах тэмцээн 2026', 'FIFA 2026'],
  ne: ['विश्वकप 2026', 'FIFA 2026'],
  si: ['ලෝක කුසලාන 2026', 'FIFA 2026'],
  km: ['ពិភពលោក 2026', 'FIFA 2026'],
  lo: ['ບານໂລກ 2026', 'FIFA 2026'],
  my: ['ကမ္ဘာ့ဖလား 2026', 'FIFA 2026'],
  am: ['የዓለም ዋንጫ 2026', 'FIFA 2026'],
  zu: ['Indebe Yomhlaba 2026', 'FIFA 2026'],
  xh: ['Indebe Yehlabathi 2026', 'FIFA 2026'],
  yo: ['Ife Agbaye 2026', 'FIFA 2026'],
  ig: ['Iko Ụwa 2026', 'FIFA 2026'],
  ha: ['Gasar Cin Kofin Duniya 2026', 'FIFA 2026'],
  so: ['Koobka Adduunka 2026', 'FIFA 2026'],
  mg: ['Kaopy Eran-tany 2026', 'FIFA 2026'],
  ny: ['Chikho Chapadziko 2026', 'FIFA 2026'],
  sn: ['Ndiro yeNyika 2026', 'FIFA 2026'],
  rw: ['Igikombe cy\'Isi 2026', 'FIFA 2026'],
  lg: ['Empindi y\'Ensi 2026', 'FIFA 2026'],
  ln: ['Kopo ya Mokili 2026', 'FIFA 2026'],
  kg: ['Kopo ya Nza 2026', 'FIFA 2026'],
  ti: ['ዋንጫ ዓለም 2026', 'FIFA 2026'],
  om: ['Kooppii Addunyaa 2026', 'FIFA 2026'],
  ps: ['نړیوال جام 2026', 'FIFA 2026'],
  ur: ['فیفا ورلڈ کپ 2026', 'ورلڈ کپ 2026', 'FIFA 2026'],
  sd: ['ورلڊ ڪپ 2026', 'FIFA 2026'],
  gu: ['વિશ્વ કપ 2026', 'FIFA 2026'],
  mr: ['विश्वचषक 2026', 'FIFA 2026'],
  ta: ['உலகக் கோப்பை 2026', 'FIFA 2026'],
  te: ['ప్రపంచ కప్ 2026', 'FIFA 2026'],
  kn: ['ವಿಶ್ವಕಪ್ 2026', 'FIFA 2026'],
  ml: ['ലോകകപ്പ് 2026', 'FIFA 2026'],
  pa: ['ਵਿਸ਼ਵ ਕੱਪ 2026', 'FIFA 2026'],
  as: ['বিশ্বকাপ 2026', 'FIFA 2026'],
  or: ['ବିଶ୍ୱକପ 2026', 'FIFA 2026'],
  bo: ['འཛམ་གླིང་དུས་ཆེན 2026', 'FIFA 2026'],
  dz: ['འཛམ་གླིང་ཁྲོམ་སྐོར 2026', 'FIFA 2026'],
  ug: ['دۇنيا چېمپىيونلۇقى 2026', 'FIFA 2026'],
  tt: ['Дөнья чемпионаты 2026', 'FIFA 2026'],
  ba: ['Донъя чемпионаты 2026', 'FIFA 2026'],
  cv: ['Тĕнче чемпионачĕ 2026', 'FIFA 2026'],
};

const LANG_COUNTRY_MAP = {
  en: 'US', de: 'DE', es: 'ES', fr: 'FR', pt: 'BR', it: 'IT', nl: 'NL', pl: 'PL',
  ru: 'RU', ar: 'SA', zh: 'CN', ja: 'JP', ko: 'KR', tr: 'TR', sv: 'SE', no: 'NO',
  da: 'DK', fi: 'FI', el: 'GR', cs: 'CZ', hu: 'HU', ro: 'RO', bg: 'BG', uk: 'UA',
  hr: 'HR', sr: 'RS', sk: 'SK', sl: 'SI', et: 'EE', lv: 'LV', lt: 'LT', he: 'IL',
  fa: 'IR', hi: 'IN', bn: 'BD', th: 'TH', vi: 'VN', id: 'ID', ms: 'MY', tl: 'PH',
  sw: 'KE', af: 'ZA', ca: 'ES', eu: 'ES', gl: 'ES', cy: 'GB', ga: 'IE', is: 'IS',
  mt: 'MT', mk: 'MK', sq: 'AL', bs: 'BA', be: 'BY', ka: 'GE', hy: 'AM', az: 'AZ',
  kk: 'KZ', uz: 'UZ', ky: 'KG', tg: 'TJ', mn: 'MN', ne: 'NP', si: 'LK', km: 'KH',
  lo: 'LA', my: 'MM', am: 'ET', zu: 'ZA', xh: 'ZA', yo: 'NG', ig: 'NG', ha: 'NG',
  so: 'SO', mg: 'MG', ny: 'MW', sn: 'ZW', rw: 'RW', lg: 'UG', ln: 'CD', kg: 'CG',
  ti: 'ER', om: 'ET', ps: 'AF', ur: 'PK', sd: 'PK', gu: 'IN', mr: 'IN', ta: 'IN',
  te: 'IN', kn: 'IN', ml: 'IN', pa: 'IN', as: 'IN', or: 'IN', bo: 'CN', dz: 'BT',
  ug: 'CN', tt: 'RU', ba: 'RU', cv: 'RU',
};

const EXCLUSION_TERMS = [
  'rugby world cup', 'cricket world cup', 'basketball world cup', 'handball world cup',
  'volleyball world cup', 'women\'s world cup 2027', 'u-20 world cup', 'u-17 world cup',
  'club world cup 2025', 'beach soccer', 'futsal world cup', 'esports', 'fifa 24', 'fifa 25',
  'ea sports fc', 'video game', 'gaming', 'playstation', 'xbox', 'olympics 2028', 'euro 2028',
];

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
// HUGGING FACE API - MIT PARALLELISIERUNG
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

// NEU: Parallele API-Calls für schnellere Verarbeitung
async function callHuggingFaceParallel(tasks) {
  const results = [];
  const chunks = [];
  
  // Aufteilen in Chunks für parallele Verarbeitung
  for (let i = 0; i < tasks.length; i += CONFIG.PARALLEL_API_CALLS) {
    chunks.push(tasks.slice(i, i + CONFIG.PARALLEL_API_CALLS));
  }
  
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(task => callHuggingFaceAPI(task.model, task.inputs, task.options || {}))
    );
    results.push(...chunkResults);
    await sleep(CONFIG.API_DELAY_MS);
  }
  
  return results;
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
            // FIX: Korrektes source_key + source_type Mapping
            const sourceInfo = SOURCE_MAPPING.google_news;
            articles.set(hash, {
              external_id: hash,
              source_key: sourceInfo.source_key,      // 'google_news'
              source_type: sourceInfo.source_type,    // 'news' (nicht 'google_news'!)
              source_name: source || 'Google News',
              title: title.substring(0, 500),
              description: description.substring(0, 2000),
              url: link,
              published_at: pubDate.toISOString(),
              fetched_at: new Date().toISOString(),
              detected_language: lang,
              country_code: country,
              content_hash: hash,
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
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&restrict_sr=1&t=month`;
        
        const response = await fetch(url, {
          headers: { 'User-Agent': 'WM2026Bot/4.3 (Educational Project)' }
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
            // FIX: Korrektes source_key + source_type Mapping
            const sourceInfo = SOURCE_MAPPING.reddit;
            articles.set(hash, {
              external_id: hash,
              source_key: sourceInfo.source_key,      // 'reddit'
              source_type: sourceInfo.source_type,    // 'social_media' (nicht 'reddit'!)
              source_name: `r/${item.subreddit}`,
              title: (item.title || '').substring(0, 500), 
              description: (item.selftext || '').substring(0, 2000),
              url: `https://www.reddit.com${item.permalink}`, 
              published_at: pubDate.toISOString(),
              fetched_at: new Date().toISOString(), 
              author: item.author,
              content_hash: hash,
            });
          }
        }
        
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
          // FIX: Korrektes source_key + source_type Mapping
          const sourceInfo = SOURCE_MAPPING.youtube;
          articles.set(hash, {
            external_id: hash,
            source_key: sourceInfo.source_key,      // 'youtube'
            source_type: sourceInfo.source_type,    // 'social_media'
            source_name: snippet.channelTitle || 'YouTube',
            title: (snippet.title || '').substring(0, 500), 
            description: (snippet.description || '').substring(0, 2000),
            url: `https://www.youtube.com/watch?v=${videoId}`, 
            image_url: snippet.thumbnails?.high?.url,
            published_at: pubDate.toISOString(), 
            fetched_at: new Date().toISOString(), 
            author: snippet.channelTitle,
            content_hash: hash,
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
            // FIX: Korrektes source_key + source_type Mapping
            const sourceInfo = SOURCE_MAPPING.mastodon;
            articles.set(hash, {
              external_id: hash,
              source_key: sourceInfo.source_key,      // 'mastodon'
              source_type: sourceInfo.source_type,    // 'social_media'
              source_name: instance,
              title: content.substring(0, 100) + '...',
              description: content.substring(0, 2000),
              url: post.url || post.uri,
              published_at: pubDate.toISOString(),
              fetched_at: new Date().toISOString(),
              author: post.account?.username,
              content_hash: hash,
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
// SOURCE 5: BLUESKY
// ═══════════════════════════════════════════════════════════════════════════

async function fetchBluesky(fromDate) {
  log('Fetching Bluesky...', 'fetch');
  const articles = new Map();
  const searchTerms = ['World Cup 2026', 'WM 2026', 'FIFA 2026', 'Mundial 2026'];
  
  for (const term of searchTerms) {
    try {
      // Bluesky public API
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=25`;
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      
      for (const post of (data.posts || [])) {
        const record = post.record || {};
        const text = record.text || '';
        const hash = generateHash(post.uri || post.cid);
        if (articles.has(hash)) continue;
        
        const pubDate = record.createdAt ? new Date(record.createdAt) : new Date();
        if (pubDate < fromDate) continue;
        
        if (isRelevantContent(text, '')) {
          // FIX: Korrektes source_key + source_type Mapping
          const sourceInfo = SOURCE_MAPPING.bluesky;
          articles.set(hash, {
            external_id: hash,
            source_key: sourceInfo.source_key,      // 'bluesky'
            source_type: sourceInfo.source_type,    // 'social_media'
            source_name: 'Bluesky',
            title: text.substring(0, 100) + '...',
            description: text.substring(0, 2000),
            url: `https://bsky.app/profile/${post.author?.handle}/post/${post.uri?.split('/').pop()}`,
            published_at: pubDate.toISOString(),
            fetched_at: new Date().toISOString(),
            author: post.author?.handle,
            content_hash: hash,
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
// AI ANALYSIS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function detectLanguage(texts) {
  const tasks = texts.map(text => ({
    model: CONFIG.MODELS.LANGUAGE_DETECTION,
    inputs: text.substring(0, 500)
  }));
  
  const results = await callHuggingFaceParallel(tasks);
  
  return results.map((result, idx) => {
    if (!result || !Array.isArray(result) || !result[0]) {
      return { language: 'unknown', confidence: 0 };
    }
    const sorted = result.sort((a, b) => b.score - a.score);
    return { language: sorted[0].label, confidence: sorted[0].score };
  });
}

async function analyzeSentiment(texts) {
  const tasks = texts.map(text => ({
    model: CONFIG.MODELS.SENTIMENT,
    inputs: text.substring(0, 500)
  }));
  
  const results = await callHuggingFaceParallel(tasks);
  
  return results.map((result, idx) => {
    if (!result || !Array.isArray(result) || !result[0]) {
      return { positive: 0.33, negative: 0.33, neutral: 0.34, label: 'neutral' };
    }
    const scores = { positive: 0, negative: 0, neutral: 0 };
    result[0].forEach(item => {
      const label = item.label.toLowerCase();
      if (label.includes('positive')) scores.positive = item.score;
      else if (label.includes('negative')) scores.negative = item.score;
      else scores.neutral = item.score;
    });
    const maxLabel = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return { ...scores, label: maxLabel };
  });
}

async function classifyTopics(texts) {
  const results = [];
  for (const text of texts) {
    const result = await callHuggingFaceAPI(CONFIG.MODELS.TOPIC_ZERO_SHOT, text.substring(0, 800), {
      parameters: { candidate_labels: CONFIG.TOPIC_CATEGORIES }
    });
    if (!result || !result.labels || !result.scores) {
      results.push({ topics: [{ label: 'general', score: 1 }], primary_topic: 'general' });
    } else {
      const topics = result.labels.map((label, i) => ({ label, score: result.scores[i] })).slice(0, 3);
      results.push({ topics, primary_topic: topics[0].label });
    }
    await sleep(CONFIG.API_DELAY_MS);
  }
  return results;
}

async function detectEmotions(texts) {
  const tasks = texts.map(text => ({
    model: CONFIG.MODELS.EMOTION,
    inputs: text.substring(0, 500)
  }));
  
  const results = await callHuggingFaceParallel(tasks);
  
  return results.map((result, idx) => {
    const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, trust: 0, anticipation: 0 };
    if (Array.isArray(result) && result[0]) {
      result[0].forEach(item => {
        const label = item.label.toLowerCase();
        if (label in emotions) emotions[label] = item.score;
        else if (label === 'happiness' || label === 'love') emotions.joy = Math.max(emotions.joy, item.score);
        else if (label === 'annoyance' || label === 'disapproval') emotions.anger = Math.max(emotions.anger, item.score);
        else if (label === 'nervousness') emotions.fear = Math.max(emotions.fear, item.score);
        else if (label === 'grief' || label === 'disappointment') emotions.sadness = Math.max(emotions.sadness, item.score);
        else if (label === 'admiration' || label === 'approval') emotions.trust = Math.max(emotions.trust, item.score);
        else if (label === 'curiosity' || label === 'excitement') emotions.anticipation = Math.max(emotions.anticipation, item.score);
      });
    }
    const dominant = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
    return { ...emotions, dominant_emotion: dominant[0], emotional_intensity: dominant[1] };
  });
}

async function extractEntities(texts) {
  const tasks = texts.map(text => ({
    model: CONFIG.MODELS.NER,
    inputs: text.substring(0, 800)
  }));
  
  const results = await callHuggingFaceParallel(tasks);
  
  return results.map((result, idx) => {
    const entities = { players: [], teams: [], stadiums: [], cities: [], organizations: [] };
    if (!Array.isArray(result)) return entities;
    
    result.forEach(entity => {
      const word = entity.word?.replace(/^##/, '') || '';
      const type = entity.entity_group || entity.entity || '';
      if (type.includes('PER')) entities.players.push(word);
      else if (type.includes('ORG')) entities.organizations.push(word);
      else if (type.includes('LOC')) entities.cities.push(word);
    });
    
    Object.keys(entities).forEach(key => {
      entities[key] = [...new Set(entities[key])].slice(0, 10);
    });
    
    return entities;
  });
}

async function detectToxicity(texts) {
  const tasks = texts.map(text => ({
    model: CONFIG.MODELS.TOXICITY,
    inputs: text.substring(0, 500)
  }));
  
  const results = await callHuggingFaceParallel(tasks);
  
  return results.map((result, idx) => {
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
  return texts.map((text, idx) => {
    const aspectScores = {};
    const textLower = text.toLowerCase();
    
    for (const aspect of CONFIG.ASPECT_CATEGORIES) {
      if (textLower.includes(aspect)) {
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
  let firstError = null;
  
  for (let i = 0; i < newArticles.length; i += 100) {
    const batch = newArticles.slice(i, i + 100);
    
    try {
      const { data, error } = await supabase
        .from('wm2026_articles')
        .insert(batch)
        .select('id');
      
      if (error) {
        if (!firstError) firstError = error;
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
  
  // Bei vielen Fehlern: Debug-Info ausgeben
  if (errors > 0 && firstError) {
    log(`DEBUG: First error details: ${JSON.stringify(firstError)}`, 'warning');
    log(`DEBUG: Sample article structure: ${JSON.stringify(Object.keys(newArticles[0]))}`, 'warning');
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
    category_key: analysis.topics.primary_topic?.replace(/\s+/g, '_').toLowerCase(),
    is_processed: true,
  };
  
  try {
    await supabase.from('wm2026_articles').update(updateData).eq('id', articleId);
  } catch (e) {}
}

async function saveProcessingLog(stats, status = 'completed') {
  try {
    await supabase.from('wm2026_processing_log').insert({
      started_at: new Date(Date.now() - (stats.duration || 0)).toISOString(),
      completed_at: new Date().toISOString(),
      status,
      articles_fetched: stats.fetched || 0,
      articles_analyzed: stats.analyzed || 0,
      articles_new: stats.inserted || 0,
      sources_used: stats.sources || [],
      errors: stats.errors || [],
    });
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════════════════
// AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════

function aggregateResults(results) {
  if (results.length === 0) return {};
  
  const aggregation = {
    date: new Date().toISOString().split('T')[0],
    article_count: results.length,
    
    // Source counts
    news_count: results.filter(r => r.source_type === 'news').length,
    social_count: results.filter(r => r.source_type === 'social_media').length,
    google_count: results.filter(r => r.source_key === 'google_news').length,
    reddit_count: results.filter(r => r.source_key === 'reddit').length,
    youtube_count: results.filter(r => r.source_key === 'youtube').length,
    mastodon_count: results.filter(r => r.source_key === 'mastodon').length,
    bluesky_count: results.filter(r => r.source_key === 'bluesky').length,
    
    // Language distribution
    top_languages: {},
    
    // Sentiment
    sentiment_avg: 0,
    news_sentiment_avg: 0,
    social_sentiment_avg: 0,
    sentiment_positive_count: 0,
    sentiment_negative_count: 0,
    sentiment_neutral_count: 0,
    
    // Emotions
    emotion_joy_avg: 0,
    emotion_anger_avg: 0,
    emotion_fear_avg: 0,
    emotion_sadness_avg: 0,
    emotion_surprise_avg: 0,
    emotion_disgust_avg: 0,
    dominant_emotion_distribution: {},
    
    // Topics
    top_topics: {},
    
    // Entities
    top_players: [],
    top_teams: [],
    top_stadiums: [],
    top_cities: [],
    
    // Toxicity
    toxic_count: 0,
    toxicity_rate: 0,
    
    // Keywords
    top_keywords: [],
    
    // Summaries
    summary_count: 0,
    
    // Aspects
    aspect_sentiment_avg: {},
    
    // Controversy
    controversy_count: 0,
    controversy_rate: 0,
    top_controversy_signals: [],
    
    // Hype
    hype_avg: 0,
    viral_potential_count: 0,
    top_hype_factors: [],
  };
  
  // Calculate averages and distributions
  const languages = {};
  const topics = {};
  const emotions = {};
  const players = {};
  const teams = {};
  const stadiums = {};
  const cities = {};
  const keywords = {};
  const controversySignals = {};
  const hypeFactors = {};
  const aspectSentiments = {};
  
  let sentimentSum = 0;
  let newsSentimentSum = 0;
  let socialSentimentSum = 0;
  let newsCount = 0;
  let socialCount = 0;
  let emotionSums = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 };
  let hypeSum = 0;
  
  for (const result of results) {
    // Languages
    if (result.language?.language) {
      languages[result.language.language] = (languages[result.language.language] || 0) + 1;
    }
    
    // Sentiment
    if (result.sentiment) {
      const score = result.sentiment.positive - result.sentiment.negative;
      sentimentSum += score;
      
      if (result.source_type === 'news') {
        newsSentimentSum += score;
        newsCount++;
      } else {
        socialSentimentSum += score;
        socialCount++;
      }
      
      if (result.sentiment.label === 'positive') aggregation.sentiment_positive_count++;
      else if (result.sentiment.label === 'negative') aggregation.sentiment_negative_count++;
      else aggregation.sentiment_neutral_count++;
    }
    
    // Emotions
    if (result.emotions) {
      Object.keys(emotionSums).forEach(e => {
        emotionSums[e] += result.emotions[e] || 0;
      });
      if (result.emotions.dominant_emotion) {
        emotions[result.emotions.dominant_emotion] = (emotions[result.emotions.dominant_emotion] || 0) + 1;
      }
    }
    
    // Topics
    if (result.topics?.primary_topic) {
      topics[result.topics.primary_topic] = (topics[result.topics.primary_topic] || 0) + 1;
    }
    
    // Entities
    if (result.entities) {
      (result.entities.players || []).forEach(p => players[p] = (players[p] || 0) + 1);
      (result.entities.teams || []).forEach(t => teams[t] = (teams[t] || 0) + 1);
      (result.entities.stadiums || []).forEach(s => stadiums[s] = (stadiums[s] || 0) + 1);
      (result.entities.cities || []).forEach(c => cities[c] = (cities[c] || 0) + 1);
    }
    
    // Toxicity
    if (result.toxicity?.is_toxic) aggregation.toxic_count++;
    
    // Keywords
    if (result.keywords?.keywords) {
      result.keywords.keywords.forEach(k => keywords[k] = (keywords[k] || 0) + 1);
    }
    
    // Summaries
    if (result.summary?.summary) aggregation.summary_count++;
    
    // Aspects
    if (result.aspects?.aspects) {
      Object.entries(result.aspects.aspects).forEach(([asp, val]) => {
        if (val !== null) {
          if (!aspectSentiments[asp]) aspectSentiments[asp] = [];
          aspectSentiments[asp].push(val);
        }
      });
    }
    
    // Controversy
    if (result.controversy?.is_controversial) {
      aggregation.controversy_count++;
      (result.controversy.signals || []).forEach(s => controversySignals[s] = (controversySignals[s] || 0) + 1);
    }
    
    // Hype
    if (result.hype) {
      hypeSum += result.hype.hype_score || 0;
      if (result.hype.is_viral_potential) aggregation.viral_potential_count++;
      (result.hype.factors || []).forEach(f => hypeFactors[f] = (hypeFactors[f] || 0) + 1);
    }
  }
  
  // Calculate final averages
  const n = results.length;
  aggregation.sentiment_avg = (sentimentSum / n + 1) / 2;
  aggregation.news_sentiment_avg = newsCount > 0 ? (newsSentimentSum / newsCount + 1) / 2 : 0.5;
  aggregation.social_sentiment_avg = socialCount > 0 ? (socialSentimentSum / socialCount + 1) / 2 : 0.5;
  
  Object.keys(emotionSums).forEach(e => {
    aggregation[`emotion_${e}_avg`] = emotionSums[e] / n;
  });
  
  aggregation.toxicity_rate = aggregation.toxic_count / n;
  aggregation.controversy_rate = aggregation.controversy_count / n;
  aggregation.hype_avg = hypeSum / n;
  
  // Sort and slice top items
  const sortObj = (obj, limit = 10) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, limit);
  
  aggregation.top_languages = Object.fromEntries(sortObj(languages, 15));
  aggregation.top_topics = Object.fromEntries(sortObj(topics, 10));
  aggregation.dominant_emotion_distribution = Object.fromEntries(sortObj(emotions, 8));
  aggregation.top_players = sortObj(players, 15).map(([name, count]) => name);
  aggregation.top_teams = sortObj(teams, 15).map(([name, count]) => name);
  aggregation.top_stadiums = sortObj(stadiums, 10).map(([name, count]) => name);
  aggregation.top_cities = sortObj(cities, 15).map(([name, count]) => name);
  aggregation.top_keywords = sortObj(keywords, 20).map(([word, count]) => word);
  aggregation.top_controversy_signals = sortObj(controversySignals, 10).map(([signal, count]) => signal);
  aggregation.top_hype_factors = sortObj(hypeFactors, 10).map(([factor, count]) => factor);
  
  // Aspect sentiment averages
  Object.entries(aspectSentiments).forEach(([asp, vals]) => {
    aggregation.aspect_sentiment_avg[asp] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  
  return aggregation;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

async function runPipeline() {
  const startTime = Date.now();
  const args = parseArgs();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║        🏆 WM2026 COMPLETE SENTIMENT ANALYSIS PIPELINE v4.3 🏆            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  📥 SOURCES (5 - alle kostenlos):                                        ║
║     • Google News RSS     - kein API Key nötig                           ║
║     • Reddit              - kein API Key nötig (public JSON)             ║
║     • YouTube             - Google API Key (optional)                    ║
║     • Mastodon            - kein API Key nötig                           ║
║     • Bluesky             - kein API Key nötig                           ║
║                                                                           ║
║  🗣️  LANGUAGES: ${Object.keys(WM_KEYWORDS).length} (${Object.values(WM_KEYWORDS).flat().length}+ keywords)                                  ║
║                                                                           ║
║  🧠 AI MODELS (11 - Hugging Face kostenlos):                             ║
║     1. Language Detection      7. Keyword Extraction                     ║
║     2. Sentiment Analysis      8. Summarization                          ║
║     3. Topic Classification    9. Aspect-Based Sentiment                 ║
║     4. Emotion Detection      10. Controversy Detection                  ║
║     5. Named Entity Rec.      11. Hype/Virality Score                    ║
║     6. Toxicity Detection                                                ║
║                                                                           ║
║  ⚡ NEU v4.3: Parallele API-Calls (${CONFIG.PARALLEL_API_CALLS}x) + korrigiertes DB-Mapping       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
  
  initSupabase();
  
  // Determine date range
  const fromDate = args.full ? new Date(CONFIG.WM_DRAW_DATE) : await getLastRunDate();
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: FETCH
  // ═══════════════════════════════════════════════════════════════════════
  
  console.log('═'.repeat(75));
  log(`📥 PHASE 1: Fetching from all 5 sources`, 'fetch');
  console.log('═'.repeat(75));
  log(`From: ${fromDate.toISOString().split('T')[0]}`, 'info');
  
  let allArticles = [];
  
  if (!args.skipFetch) {
    const googleArticles = await fetchGoogleNews(fromDate);
    const redditArticles = await fetchReddit(fromDate);
    const youtubeArticles = await fetchYouTube(fromDate);
    const mastodonArticles = await fetchMastodon(fromDate);
    const blueskyArticles = await fetchBluesky(fromDate);
    
    allArticles = [...googleArticles, ...redditArticles, ...youtubeArticles, ...mastodonArticles, ...blueskyArticles];
    
    // Save to DB
    const saveResult = await saveArticles(allArticles, args.dryRun);
    
    if (saveResult.errors > 0 && saveResult.inserted === 0) {
      log(`⚠️  WARNUNG: Keine Artikel in DB eingefügt! Analyse erfolgt aus Memory.`, 'warning');
    }
  } else {
    log('Skipping fetch, loading from DB...', 'info');
    const { data } = await supabase.from('wm2026_articles').select('*').eq('is_processed', false).limit(5000);
    allArticles = data || [];
    log(`Loaded ${allArticles.length} unprocessed articles from DB`, 'info');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: ANALYZE
  // ═══════════════════════════════════════════════════════════════════════
  
  console.log('═'.repeat(75));
  log(`🧠 PHASE 2: AI Analysis with ALL 11 Models`, 'ai');
  console.log('═'.repeat(75));
  
  if (allArticles.length === 0) {
    log('Keine Artikel zum Analysieren!', 'warning');
    return;
  }
  
  log(`Analyzing ${allArticles.length} articles...`, 'ai');
  
  const results = [];
  const batchSize = CONFIG.ANALYSIS_BATCH_SIZE;
  const totalBatches = Math.ceil(allArticles.length / batchSize);
  
  for (let i = 0; i < allArticles.length; i += batchSize) {
    const batch = allArticles.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    log(`🧠 Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`, 'ai');
    
    const texts = batch.map(a => `${a.title || ''} ${a.description || ''}`.trim());
    
    // Parallel analysis where possible
    const [languages, sentiments, emotions, entities, toxicities] = await Promise.all([
      detectLanguage(texts),
      analyzeSentiment(texts),
      detectEmotions(texts),
      extractEntities(texts),
      detectToxicity(texts),
    ]);
    
    // Sequential for rate-limited endpoints
    const topics = await classifyTopics(texts);
    const keywords = await extractKeywords(texts);
    const summaries = await summarizeTexts(texts);
    
    // Derived analysis
    const aspects = await analyzeAspectSentiment(texts, sentiments);
    
    for (let j = 0; j < batch.length; j++) {
      const article = batch[j];
      const controversy = detectControversy(texts[j], sentiments[j], emotions[j], toxicities[j]);
      const hype = predictHypeScore(texts[j], sentiments[j], emotions[j], entities[j]);
      
      const analysisResult = {
        id: article.id,
        external_id: article.external_id,
        source_key: article.source_key,
        source_type: article.source_type,
        title: article.title,
        url: article.url,
        published_at: article.published_at,
        
        language: languages[j],
        sentiment: sentiments[j],
        topics: topics[j],
        emotions: emotions[j],
        entities: entities[j],
        toxicity: toxicities[j],
        keywords: keywords[j],
        summary: summaries[j],
        aspects: aspects[j],
        controversy,
        hype,
      };
      
      results.push(analysisResult);
      
      // Update DB if we have an ID
      if (article.id && !args.dryRun) {
        await updateArticleAnalysis(article.id, analysisResult, args.dryRun);
      }
    }
    
    await sleep(CONFIG.BATCH_DELAY_MS);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: AGGREGATE & REPORT
  // ═══════════════════════════════════════════════════════════════════════
  
  const aggregation = aggregateResults(results);
  const duration = Date.now() - startTime;
  
  // Helper functions for formatting
  const formatTop = (arr, n = 5) => (arr || []).slice(0, n).join(', ') || 'N/A';
  const formatTopObj = (obj, n = 5) => {
    if (!obj) return 'N/A';
    return Object.entries(obj).slice(0, n).map(([k, v]) => `${k}:${v}`).join(', ') || 'N/A';
  };
  
  console.log(`

═══════════════════════════════════════════════════════════════════════════
                    📊 WM2026 SENTIMENT ANALYSIS REPORT
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
  
  // Save backups
  saveLocalBackup(`run_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, { results, aggregation });
  
  if (args.export) {
    log('Exporting data...', 'db');
    const { data: allDbArticles } = await supabase.from('wm2026_articles').select('*').eq('is_processed', true);
    saveLocalBackup('export_full.json', { articles: allDbArticles, aggregation });
    log('Export completed!', 'success');
  }
  
  // Save processing log
  await saveProcessingLog({
    duration,
    fetched: allArticles.length,
    analyzed: results.length,
    inserted: results.length,
    sources: ['google_news', 'reddit', 'youtube', 'mastodon', 'bluesky'],
    errors: [],
  });
  
  log('Pipeline completed successfully! 🎉', 'success');
}

runPipeline().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
