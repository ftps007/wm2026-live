#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// WM 2026 SENTIMENT ANALYSIS - COMPLETE 211 COUNTRIES EDITION
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
console.log('   HF_API_KEY:   ' + (HF_API_KEY ? '✅' : '❌'));

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const parser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }});

// ═══════════════════════════════════════════════════════════════════════════
// HUGGINGFACE API - NEW ROUTER URL (ACTIVE JANUARY 2025)
// ═══════════════════════════════════════════════════════════════════════════
const HF_MODELS = {
  sentiment: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
  emotion: 'j-hartmann/emotion-english-distilroberta-base'
};

async function callHuggingFace(model, inputs, retries = 3) {
  if (!HF_API_KEY) return null;
  
  // ══════════════════════════════════════════════════════════════════════
  // NEW URL - router.huggingface.co (NOT api-inference.huggingface.co!)
  // ══════════════════════════════════════════════════════════════════════
  const url = 'https://router.huggingface.co/hf-inference/models/' + model;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + HF_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs, options: { wait_for_model: true } })
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
      console.log('  ⚠️ HF attempt ' + (attempt + 1) + ' failed: ' + error.message.slice(0, 60));
      if (attempt < retries - 1) await sleep(2000);
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALL 211 FIFA MEMBER COUNTRIES - GOOGLE NEWS RSS
// ═══════════════════════════════════════════════════════════════════════════
const COUNTRIES = [
  // ══════════════════════════════════════════════════════════════════════
  // UEFA - EUROPE (55 members)
  // ══════════════════════════════════════════════════════════════════════
  { code: 'DE', lang: 'de', name: 'Germany', query: 'Fußball+WM+2026' },
  { code: 'AT', lang: 'de', name: 'Austria', query: 'Fußball+WM+2026' },
  { code: 'CH', lang: 'de', name: 'Switzerland', query: 'Fussball+WM+2026' },
  { code: 'GB', lang: 'en', name: 'England', query: 'FIFA+World+Cup+2026' },
  { code: 'FR', lang: 'fr', name: 'France', query: 'Coupe+du+Monde+2026' },
  { code: 'ES', lang: 'es', name: 'Spain', query: 'Mundial+2026+fútbol' },
  { code: 'IT', lang: 'it', name: 'Italy', query: 'Mondiali+2026+calcio' },
  { code: 'PT', lang: 'pt', name: 'Portugal', query: 'Copa+do+Mundo+2026' },
  { code: 'NL', lang: 'nl', name: 'Netherlands', query: 'WK+2026+voetbal' },
  { code: 'BE', lang: 'nl', name: 'Belgium', query: 'WK+2026+voetbal' },
  { code: 'PL', lang: 'pl', name: 'Poland', query: 'Mistrzostwa+Świata+2026' },
  { code: 'SE', lang: 'sv', name: 'Sweden', query: 'VM+2026+fotboll' },
  { code: 'NO', lang: 'no', name: 'Norway', query: 'VM+2026+fotball' },
  { code: 'DK', lang: 'da', name: 'Denmark', query: 'VM+2026+fodbold' },
  { code: 'FI', lang: 'fi', name: 'Finland', query: 'MM+2026+jalkapallo' },
  { code: 'CZ', lang: 'cs', name: 'Czech Republic', query: 'MS+2026+fotbal' },
  { code: 'SK', lang: 'sk', name: 'Slovakia', query: 'MS+2026+futbal' },
  { code: 'HU', lang: 'hu', name: 'Hungary', query: 'VB+2026+labdarúgás' },
  { code: 'RO', lang: 'ro', name: 'Romania', query: 'CM+2026+fotbal' },
  { code: 'BG', lang: 'bg', name: 'Bulgaria', query: 'СП+2026+футбол' },
  { code: 'HR', lang: 'hr', name: 'Croatia', query: 'SP+2026+nogomet' },
  { code: 'RS', lang: 'sr', name: 'Serbia', query: 'СП+2026+фудбал' },
  { code: 'SI', lang: 'sl', name: 'Slovenia', query: 'SP+2026+nogomet' },
  { code: 'BA', lang: 'bs', name: 'Bosnia', query: 'SP+2026+fudbal' },
  { code: 'ME', lang: 'sr', name: 'Montenegro', query: 'SP+2026' },
  { code: 'MK', lang: 'mk', name: 'North Macedonia', query: 'СП+2026' },
  { code: 'AL', lang: 'sq', name: 'Albania', query: 'Botërori+2026' },
  { code: 'XK', lang: 'sq', name: 'Kosovo', query: 'Botërori+2026' },
  { code: 'UA', lang: 'uk', name: 'Ukraine', query: 'ЧС+2026+футбол' },
  { code: 'GR', lang: 'el', name: 'Greece', query: 'Μουντιάλ+2026' },
  { code: 'TR', lang: 'tr', name: 'Turkey', query: 'Dünya+Kupası+2026' },
  { code: 'RU', lang: 'ru', name: 'Russia', query: 'ЧМ+2026+футбол' },
  { code: 'IE', lang: 'en', name: 'Ireland', query: 'World+Cup+2026+football' },
  { code: 'IS', lang: 'is', name: 'Iceland', query: 'HM+2026+fótbolti' },
  { code: 'LT', lang: 'lt', name: 'Lithuania', query: 'PČ+2026+futbolas' },
  { code: 'LV', lang: 'lv', name: 'Latvia', query: 'PK+2026+futbols' },
  { code: 'EE', lang: 'et', name: 'Estonia', query: 'MM+2026+jalgpall' },
  { code: 'BY', lang: 'be', name: 'Belarus', query: 'ЧС+2026+футбол' },
  { code: 'MD', lang: 'ro', name: 'Moldova', query: 'CM+2026+fotbal' },
  { code: 'GE', lang: 'ka', name: 'Georgia', query: 'მსოფლიო+2026' },
  { code: 'AM', lang: 'hy', name: 'Armenia', query: ' delays' },
  { code: 'AZ', lang: 'az', name: 'Azerbaijan', query: 'Dünya+Kuboku+2026' },
  { code: 'CY', lang: 'el', name: 'Cyprus', query: 'Μουντιάλ+2026' },
  { code: 'MT', lang: 'en', name: 'Malta', query: 'World+Cup+2026' },
  { code: 'LU', lang: 'fr', name: 'Luxembourg', query: 'Coupe+du+Monde+2026' },
  { code: 'LI', lang: 'de', name: 'Liechtenstein', query: 'WM+2026' },
  { code: 'AD', lang: 'es', name: 'Andorra', query: 'Mundial+2026' },
  { code: 'SM', lang: 'it', name: 'San Marino', query: 'Mondiali+2026' },
  { code: 'MC', lang: 'fr', name: 'Monaco', query: 'Coupe+du+Monde+2026' },
  { code: 'FO', lang: 'da', name: 'Faroe Islands', query: 'VM+2026' },
  { code: 'GI', lang: 'en', name: 'Gibraltar', query: 'World+Cup+2026' },
  { code: 'SC', lang: 'en', name: 'Scotland', query: 'World+Cup+2026+Scotland' },
  { code: 'WA', lang: 'en', name: 'Wales', query: 'World+Cup+2026+Wales' },
  { code: 'NI', lang: 'en', name: 'Northern Ireland', query: 'World+Cup+2026' },
  
  // ══════════════════════════════════════════════════════════════════════
  // CONMEBOL - SOUTH AMERICA (10 members)
  // ══════════════════════════════════════════════════════════════════════
  { code: 'BR', lang: 'pt', name: 'Brazil', query: 'Copa+do+Mundo+2026+Brasil' },
  { code: 'AR', lang: 'es', name: 'Argentina', query: 'Mundial+2026+Argentina' },
  { code: 'UY', lang: 'es', name: 'Uruguay', query: 'Mundial+2026+Uruguay' },
  { code: 'CO', lang: 'es', name: 'Colombia', query: 'Mundial+2026+Colombia' },
  { code: 'CL', lang: 'es', name: 'Chile', query: 'Mundial+2026+Chile' },
  { code: 'PE', lang: 'es', name: 'Peru', query: 'Mundial+2026+Perú' },
  { code: 'EC', lang: 'es', name: 'Ecuador', query: 'Mundial+2026+Ecuador' },
  { code: 'VE', lang: 'es', name: 'Venezuela', query: 'Mundial+2026+Venezuela' },
  { code: 'PY', lang: 'es', name: 'Paraguay', query: 'Mundial+2026+Paraguay' },
  { code: 'BO', lang: 'es', name: 'Bolivia', query: 'Mundial+2026+Bolivia' },
  
  // ══════════════════════════════════════════════════════════════════════
  // CONCACAF - NORTH/CENTRAL AMERICA & CARIBBEAN (41 members)
  // ══════════════════════════════════════════════════════════════════════
  { code: 'US', lang: 'en', name: 'USA', query: 'FIFA+World+Cup+2026+USA' },
  { code: 'MX', lang: 'es', name: 'Mexico', query: 'Mundial+2026+México' },
  { code: 'CA', lang: 'en', name: 'Canada', query: 'FIFA+World+Cup+2026+Canada' },
  { code: 'CR', lang: 'es', name: 'Costa Rica', query: 'Mundial+2026+Costa+Rica' },
  { code: 'PA', lang: 'es', name: 'Panama', query: 'Mundial+2026+Panamá' },
  { code: 'HN', lang: 'es', name: 'Honduras', query: 'Mundial+2026+Honduras' },
  { code: 'SV', lang: 'es', name: 'El Salvador', query: 'Mundial+2026+El+Salvador' },
  { code: 'GT', lang: 'es', name: 'Guatemala', query: 'Mundial+2026+Guatemala' },
  { code: 'NI', lang: 'es', name: 'Nicaragua', query: 'Mundial+2026+Nicaragua' },
  { code: 'BZ', lang: 'en', name: 'Belize', query: 'World+Cup+2026+Belize' },
  { code: 'JM', lang: 'en', name: 'Jamaica', query: 'World+Cup+2026+Jamaica' },
  { code: 'TT', lang: 'en', name: 'Trinidad and Tobago', query: 'World+Cup+2026+Trinidad' },
  { code: 'HT', lang: 'fr', name: 'Haiti', query: 'Coupe+du+Monde+2026+Haïti' },
  { code: 'DO', lang: 'es', name: 'Dominican Republic', query: 'Mundial+2026+Dominicana' },
  { code: 'CU', lang: 'es', name: 'Cuba', query: 'Mundial+2026+Cuba' },
  { code: 'PR', lang: 'es', name: 'Puerto Rico', query: 'Mundial+2026+Puerto+Rico' },
  { code: 'CW', lang: 'nl', name: 'Curaçao', query: 'WK+2026+Curaçao' },
  { code: 'AW', lang: 'nl', name: 'Aruba', query: 'WK+2026+Aruba' },
  { code: 'SR', lang: 'nl', name: 'Suriname', query: 'WK+2026+Suriname' },
  { code: 'GY', lang: 'en', name: 'Guyana', query: 'World+Cup+2026+Guyana' },
  { code: 'BB', lang: 'en', name: 'Barbados', query: 'World+Cup+2026+Barbados' },
  { code: 'GD', lang: 'en', name: 'Grenada', query: 'World+Cup+2026+Grenada' },
  { code: 'LC', lang: 'en', name: 'Saint Lucia', query: 'World+Cup+2026' },
  { code: 'VC', lang: 'en', name: 'St Vincent', query: 'World+Cup+2026' },
  { code: 'AG', lang: 'en', name: 'Antigua and Barbuda', query: 'World+Cup+2026' },
  { code: 'KN', lang: 'en', name: 'St Kitts and Nevis', query: 'World+Cup+2026' },
  { code: 'DM', lang: 'en', name: 'Dominica', query: 'World+Cup+2026' },
  { code: 'BS', lang: 'en', name: 'Bahamas', query: 'World+Cup+2026+Bahamas' },
  { code: 'BM', lang: 'en', name: 'Bermuda', query: 'World+Cup+2026+Bermuda' },
  { code: 'KY', lang: 'en', name: 'Cayman Islands', query: 'World+Cup+2026' },
  { code: 'VG', lang: 'en', name: 'British Virgin Islands', query: 'World+Cup+2026' },
  { code: 'VI', lang: 'en', name: 'US Virgin Islands', query: 'World+Cup+2026' },
  { code: 'TC', lang: 'en', name: 'Turks and Caicos', query: 'World+Cup+2026' },
  { code: 'MS', lang: 'en', name: 'Montserrat', query: 'World+Cup+2026' },
  { code: 'AI', lang: 'en', name: 'Anguilla', query: 'World+Cup+2026' },
  { code: 'SX', lang: 'en', name: 'Sint Maarten', query: 'World+Cup+2026' },
  { code: 'MF', lang: 'fr', name: 'Saint Martin', query: 'Coupe+du+Monde+2026' },
  { code: 'GP', lang: 'fr', name: 'Guadeloupe', query: 'Coupe+du+Monde+2026' },
  { code: 'MQ', lang: 'fr', name: 'Martinique', query: 'Coupe+du+Monde+2026' },
  { code: 'GF', lang: 'fr', name: 'French Guiana', query: 'Coupe+du+Monde+2026' },
  
  // ══════════════════════════════════════════════════════════════════════
  // AFC - ASIA (47 members)
  // ══════════════════════════════════════════════════════════════════════
  { code: 'JP', lang: 'ja', name: 'Japan', query: 'ワールドカップ+2026+日本' },
  { code: 'KR', lang: 'ko', name: 'South Korea', query: '월드컵+2026+한국' },
  { code: 'CN', lang: 'zh', name: 'China', query: '世界杯+2026+中国' },
  { code: 'AU', lang: 'en', name: 'Australia', query: 'FIFA+World+Cup+2026+Australia' },
  { code: 'SA', lang: 'ar', name: 'Saudi Arabia', query: 'كأس+العالم+2026+السعودية' },
  { code: 'IR', lang: 'fa', name: 'Iran', query: 'جام+جهانی+2026+ایران' },
  { code: 'QA', lang: 'ar', name: 'Qatar', query: 'كأس+العالم+2026+قطر' },
  { code: 'AE', lang: 'ar', name: 'UAE', query: 'كأس+العالم+2026+الإمارات' },
  { code: 'IQ', lang: 'ar', name: 'Iraq', query: 'كأس+العالم+2026+العراق' },
  { code: 'JO', lang: 'ar', name: 'Jordan', query: 'كأس+العالم+2026+الأردن' },
  { code: 'SY', lang: 'ar', name: 'Syria', query: 'كأس+العالم+2026+سوريا' },
  { code: 'LB', lang: 'ar', name: 'Lebanon', query: 'كأس+العالم+2026+لبنان' },
  { code: 'PS', lang: 'ar', name: 'Palestine', query: 'كأس+العالم+2026+فلسطين' },
  { code: 'KW', lang: 'ar', name: 'Kuwait', query: 'كأس+العالم+2026+الكويت' },
  { code: 'BH', lang: 'ar', name: 'Bahrain', query: 'كأس+العالم+2026+البحرين' },
  { code: 'OM', lang: 'ar', name: 'Oman', query: 'كأس+العالم+2026+عمان' },
  { code: 'YE', lang: 'ar', name: 'Yemen', query: 'كأس+العالم+2026+اليمن' },
  { code: 'IN', lang: 'hi', name: 'India', query: 'FIFA+World+Cup+2026+India' },
  { code: 'PK', lang: 'ur', name: 'Pakistan', query: 'World+Cup+2026+Pakistan' },
  { code: 'BD', lang: 'bn', name: 'Bangladesh', query: 'World+Cup+2026+Bangladesh' },
  { code: 'LK', lang: 'si', name: 'Sri Lanka', query: 'World+Cup+2026+Sri+Lanka' },
  { code: 'NP', lang: 'ne', name: 'Nepal', query: 'World+Cup+2026+Nepal' },
  { code: 'BT', lang: 'dz', name: 'Bhutan', query: 'World+Cup+2026' },
  { code: 'MV', lang: 'dv', name: 'Maldives', query: 'World+Cup+2026+Maldives' },
  { code: 'ID', lang: 'id', name: 'Indonesia', query: 'Piala+Dunia+2026+Indonesia' },
  { code: 'TH', lang: 'th', name: 'Thailand', query: 'ฟุตบอลโลก+2026+ไทย' },
  { code: 'VN', lang: 'vi', name: 'Vietnam', query: 'World+Cup+2026+Việt+Nam' },
  { code: 'MY', lang: 'ms', name: 'Malaysia', query: 'Piala+Dunia+2026+Malaysia' },
  { code: 'SG', lang: 'en', name: 'Singapore', query: 'World+Cup+2026+Singapore' },
  { code: 'PH', lang: 'tl', name: 'Philippines', query: 'World+Cup+2026+Philippines' },
  { code: 'MM', lang: 'my', name: 'Myanmar', query: 'World+Cup+2026+Myanmar' },
  { code: 'KH', lang: 'km', name: 'Cambodia', query: 'World+Cup+2026+Cambodia' },
  { code: 'LA', lang: 'lo', name: 'Laos', query: 'World+Cup+2026+Laos' },
  { code: 'BN', lang: 'ms', name: 'Brunei', query: 'Piala+Dunia+2026+Brunei' },
  { code: 'TL', lang: 'pt', name: 'Timor-Leste', query: 'Copa+do+Mundo+2026' },
  { code: 'UZ', lang: 'uz', name: 'Uzbekistan', query: 'Jahon+chempionati+2026' },
  { code: 'KZ', lang: 'kk', name: 'Kazakhstan', query: 'ӘЧ+2026+футбол' },
  { code: 'KG', lang: 'ky', name: 'Kyrgyzstan', query: 'ДЧ+2026' },
  { code: 'TJ', lang: 'tg', name: 'Tajikistan', query: 'ҶҶ+2026' },
  { code: 'TM', lang: 'tk', name: 'Turkmenistan', query: 'Dünýä+2026' },
  { code: 'AF', lang: 'ps', name: 'Afghanistan', query: 'World+Cup+2026+Afghanistan' },
  { code: 'MN', lang: 'mn', name: 'Mongolia', query: 'ДАШТ+2026' },
  { code: 'KP', lang: 'ko', name: 'North Korea', query: '월드컵+2026' },
  { code: 'TW', lang: 'zh', name: 'Chinese Taipei', query: '世界盃+2026+台灣' },
  { code: 'HK', lang: 'zh', name: 'Hong Kong', query: '世界盃+2026+香港' },
  { code: 'MO', lang: 'zh', name: 'Macau', query: '世界盃+2026+澳門' },
  { code: 'GU', lang: 'en', name: 'Guam', query: 'World+Cup+2026+Guam' },
  
  // ══════════════════════════════════════════════════════════════════════
  // CAF - AFRICA (54 members)
  // ══════════════════════════════════════════════════════════════════════
  { code: 'EG', lang: 'ar', name: 'Egypt', query: 'كأس+العالم+2026+مصر' },
  { code: 'MA', lang: 'ar', name: 'Morocco', query: 'كأس+العالم+2026+المغرب' },
  { code: 'DZ', lang: 'ar', name: 'Algeria', query: 'كأس+العالم+2026+الجزائر' },
  { code: 'TN', lang: 'ar', name: 'Tunisia', query: 'كأس+العالم+2026+تونس' },
  { code: 'LY', lang: 'ar', name: 'Libya', query: 'كأس+العالم+2026+ليبيا' },
  { code: 'SD', lang: 'ar', name: 'Sudan', query: 'كأس+العالم+2026+السودان' },
  { code: 'MR', lang: 'ar', name: 'Mauritania', query: 'كأس+العالم+2026+موريتانيا' },
  { code: 'NG', lang: 'en', name: 'Nigeria', query: 'World+Cup+2026+Nigeria' },
  { code: 'GH', lang: 'en', name: 'Ghana', query: 'World+Cup+2026+Ghana' },
  { code: 'SN', lang: 'fr', name: 'Senegal', query: 'Coupe+du+Monde+2026+Sénégal' },
  { code: 'CI', lang: 'fr', name: 'Ivory Coast', query: 'Coupe+du+Monde+2026+Côte+Ivoire' },
  { code: 'CM', lang: 'fr', name: 'Cameroon', query: 'Coupe+du+Monde+2026+Cameroun' },
  { code: 'ZA', lang: 'en', name: 'South Africa', query: 'World+Cup+2026+South+Africa' },
  { code: 'KE', lang: 'sw', name: 'Kenya', query: 'World+Cup+2026+Kenya' },
  { code: 'ET', lang: 'am', name: 'Ethiopia', query: 'World+Cup+2026+Ethiopia' },
  { code: 'TZ', lang: 'sw', name: 'Tanzania', query: 'World+Cup+2026+Tanzania' },
  { code: 'UG', lang: 'en', name: 'Uganda', query: 'World+Cup+2026+Uganda' },
  { code: 'RW', lang: 'rw', name: 'Rwanda', query: 'World+Cup+2026+Rwanda' },
  { code: 'BI', lang: 'rn', name: 'Burundi', query: 'World+Cup+2026+Burundi' },
  { code: 'CD', lang: 'fr', name: 'DR Congo', query: 'Coupe+du+Monde+2026+Congo' },
  { code: 'CG', lang: 'fr', name: 'Congo', query: 'Coupe+du+Monde+2026+Congo' },
  { code: 'GA', lang: 'fr', name: 'Gabon', query: 'Coupe+du+Monde+2026+Gabon' },
  { code: 'GQ', lang: 'es', name: 'Equatorial Guinea', query: 'Mundial+2026+Guinea' },
  { code: 'CF', lang: 'fr', name: 'Central African Republic', query: 'Coupe+du+Monde+2026' },
  { code: 'TD', lang: 'fr', name: 'Chad', query: 'Coupe+du+Monde+2026+Tchad' },
  { code: 'AO', lang: 'pt', name: 'Angola', query: 'Copa+do+Mundo+2026+Angola' },
  { code: 'ZM', lang: 'en', name: 'Zambia', query: 'World+Cup+2026+Zambia' },
  { code: 'ZW', lang: 'en', name: 'Zimbabwe', query: 'World+Cup+2026+Zimbabwe' },
  { code: 'BW', lang: 'en', name: 'Botswana', query: 'World+Cup+2026+Botswana' },
  { code: 'NA', lang: 'en', name: 'Namibia', query: 'World+Cup+2026+Namibia' },
  { code: 'MZ', lang: 'pt', name: 'Mozambique', query: 'Copa+do+Mundo+2026+Moçambique' },
  { code: 'MW', lang: 'en', name: 'Malawi', query: 'World+Cup+2026+Malawi' },
  { code: 'MG', lang: 'mg', name: 'Madagascar', query: 'Coupe+du+Monde+2026+Madagascar' },
  { code: 'MU', lang: 'en', name: 'Mauritius', query: 'World+Cup+2026+Mauritius' },
  { code: 'SC', lang: 'en', name: 'Seychelles', query: 'World+Cup+2026+Seychelles' },
  { code: 'KM', lang: 'ar', name: 'Comoros', query: 'كأس+العالم+2026+جزر+القمر' },
  { code: 'RE', lang: 'fr', name: 'Réunion', query: 'Coupe+du+Monde+2026' },
  { code: 'ML', lang: 'fr', name: 'Mali', query: 'Coupe+du+Monde+2026+Mali' },
  { code: 'BF', lang: 'fr', name: 'Burkina Faso', query: 'Coupe+du+Monde+2026+Burkina' },
  { code: 'NE', lang: 'fr', name: 'Niger', query: 'Coupe+du+Monde+2026+Niger' },
  { code: 'GN', lang: 'fr', name: 'Guinea', query: 'Coupe+du+Monde+2026+Guinée' },
  { code: 'GW', lang: 'pt', name: 'Guinea-Bissau', query: 'Copa+do+Mundo+2026+Guiné' },
  { code: 'SL', lang: 'en', name: 'Sierra Leone', query: 'World+Cup+2026+Sierra+Leone' },
  { code: 'LR', lang: 'en', name: 'Liberia', query: 'World+Cup+2026+Liberia' },
  { code: 'TG', lang: 'fr', name: 'Togo', query: 'Coupe+du+Monde+2026+Togo' },
  { code: 'BJ', lang: 'fr', name: 'Benin', query: 'Coupe+du+Monde+2026+Bénin' },
  { code: 'GM', lang: 'en', name: 'Gambia', query: 'World+Cup+2026+Gambia' },
  { code: 'CV', lang: 'pt', name: 'Cape Verde', query: 'Copa+do+Mundo+2026+Cabo+Verde' },
  { code: 'ST', lang: 'pt', name: 'São Tomé and Príncipe', query: 'Copa+do+Mundo+2026' },
  { code: 'SS', lang: 'en', name: 'South Sudan', query: 'World+Cup+2026+South+Sudan' },
  { code: 'ER', lang: 'ti', name: 'Eritrea', query: 'World+Cup+2026+Eritrea' },
  { code: 'DJ', lang: 'fr', name: 'Djibouti', query: 'Coupe+du+Monde+2026+Djibouti' },
  { code: 'SO', lang: 'so', name: 'Somalia', query: 'World+Cup+2026+Somalia' },
  { code: 'SZ', lang: 'en', name: 'Eswatini', query: 'World+Cup+2026+Eswatini' },
  { code: 'LS', lang: 'en', name: 'Lesotho', query: 'World+Cup+2026+Lesotho' },
  
  // ══════════════════════════════════════════════════════════════════════
  // OFC - OCEANIA (11 members)
  // ══════════════════════════════════════════════════════════════════════
  { code: 'NZ', lang: 'en', name: 'New Zealand', query: 'FIFA+World+Cup+2026+New+Zealand' },
  { code: 'FJ', lang: 'en', name: 'Fiji', query: 'World+Cup+2026+Fiji' },
  { code: 'PG', lang: 'en', name: 'Papua New Guinea', query: 'World+Cup+2026+PNG' },
  { code: 'SB', lang: 'en', name: 'Solomon Islands', query: 'World+Cup+2026+Solomon' },
  { code: 'VU', lang: 'en', name: 'Vanuatu', query: 'World+Cup+2026+Vanuatu' },
  { code: 'NC', lang: 'fr', name: 'New Caledonia', query: 'Coupe+du+Monde+2026' },
  { code: 'WS', lang: 'en', name: 'Samoa', query: 'World+Cup+2026+Samoa' },
  { code: 'AS', lang: 'en', name: 'American Samoa', query: 'World+Cup+2026' },
  { code: 'TO', lang: 'en', name: 'Tonga', query: 'World+Cup+2026+Tonga' },
  { code: 'CK', lang: 'en', name: 'Cook Islands', query: 'World+Cup+2026' },
  { code: 'TH', lang: 'en', name: 'Tahiti', query: 'Coupe+du+Monde+2026+Tahiti' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SPORT RSS FEEDS (20 feeds)
// ═══════════════════════════════════════════════════════════════════════════
const SPORT_FEEDS = [
  // German
  { url: 'https://rss.kicker.de/news/aktuell', name: 'Kicker', lang: 'de', country: 'DE' },
  { url: 'https://www.sportschau.de/index~rss.xml', name: 'Sportschau', lang: 'de', country: 'DE' },
  { url: 'https://www.spox.com/pub/rss/fussball.xml', name: 'Spox', lang: 'de', country: 'DE' },
  { url: 'https://www.sport1.de/rss/fussball', name: 'Sport1', lang: 'de', country: 'DE' },
  // English - UK
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', name: 'BBC Football', lang: 'en', country: 'GB' },
  { url: 'https://www.theguardian.com/football/rss', name: 'The Guardian', lang: 'en', country: 'GB' },
  { url: 'https://www.skysports.com/rss/12040', name: 'Sky Sports', lang: 'en', country: 'GB' },
  // English - USA
  { url: 'https://www.espn.com/espn/rss/soccer/news', name: 'ESPN FC', lang: 'en', country: 'US' },
  { url: 'https://www.mlssoccer.com/rss/', name: 'MLS', lang: 'en', country: 'US' },
  // Spanish
  { url: 'https://e00-marca.uecdn.es/rss/futbol/futbol-internacional.xml', name: 'Marca', lang: 'es', country: 'ES' },
  { url: 'https://as.com/rss/tags/mundial_futbol.xml', name: 'AS', lang: 'es', country: 'ES' },
  // Italian
  { url: 'https://www.gazzetta.it/rss/calcio.xml', name: 'Gazzetta', lang: 'it', country: 'IT' },
  // French
  { url: 'https://www.lequipe.fr/rss/actu_rss.xml', name: "L'Équipe", lang: 'fr', country: 'FR' },
  // Portuguese/Brazilian
  { url: 'https://ge.globo.com/rss/futebol/', name: 'Globo Esporte', lang: 'pt', country: 'BR' },
  // Dutch
  { url: 'https://www.vi.nl/rss', name: 'Voetbal Int.', lang: 'nl', country: 'NL' },
  // Argentine
  { url: 'https://www.ole.com.ar/rss/futbol/', name: 'Olé', lang: 'es', country: 'AR' },
  // Mexican
  { url: 'https://www.record.com.mx/rss.xml', name: 'Record MX', lang: 'es', country: 'MX' },
];

// ═══════════════════════════════════════════════════════════════════════════
// REDDIT - 62 SUBREDDITS
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
    'footballmanagergames', 'FIFA', 'EASportsFC'
  ];
  
  console.log('   📱 Reddit: Fetching from ' + subreddits.length + ' subreddits...');
  const posts = [];
  
  for (const sub of subreddits) {
    try {
      const response = await fetch(
        'https://www.reddit.com/r/' + sub + '/search.json?q=world+cup+2026+OR+WM+2026+OR+mundial+2026+OR+FIFA+2026&sort=new&limit=25&restrict_sr=on&t=week',
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
      await sleep(100); // Rate limiting
    } catch (e) { /* skip */ }
  }
  
  console.log('   ✅ Reddit: ' + posts.length + ' posts');
  return posts;
}

// ═══════════════════════════════════════════════════════════════════════════
// BLUESKY
// ═══════════════════════════════════════════════════════════════════════════
async function fetchBluesky() {
  const queries = ['World Cup 2026', 'WM 2026', 'FIFA 2026', 'Mundial 2026', 'Coupe du Monde 2026', 'Mondiali 2026'];
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
  
  console.log('   ✅ Bluesky: ' + posts.length + ' posts');
  return posts;
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTODON
// ═══════════════════════════════════════════════════════════════════════════
async function fetchMastodon() {
  const instances = ['mastodon.social', 'mastodon.online', 'mstdn.social', 'fosstodon.org', 'mastodon.world'];
  const hashtags = ['worldcup2026', 'wm2026', 'fifa2026', 'fifaworldcup', 'mundial2026', 'football', 'soccer'];
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
  
  console.log('   ✅ Mastodon: ' + posts.length + ' posts');
  return posts;
}

// ═══════════════════════════════════════════════════════════════════════════
// YOUTUBE RSS
// ═══════════════════════════════════════════════════════════════════════════
async function fetchYouTube() {
  const channels = [
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCpcTrCXblq78GZrTUTLWeBw', // FIFA
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCjIUiCHvBYXLK2_eQfGvp8g', // BUNDESLIGA
    'https://www.youtube.com/feeds/videos.xml?channel_id=UC0HVLrFSc5MRMB5pAYWIjkA', // MLS
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCGq7ov9-Xk9fkeQjeeXElkQ', // CONCACAF
  ];
  const posts = [];
  
  for (const url of channels) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of (feed.items || []).slice(0, 15)) {
        const text = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase();
        if (text.includes('2026') || text.includes('world cup') || text.includes('wm') || text.includes('mundial')) {
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
  
  console.log('   ✅ YouTube: ' + posts.length + ' videos');
  return posts;
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE NEWS FETCHER
// ═══════════════════════════════════════════════════════════════════════════
async function fetchGoogleNews(country) {
  const url = 'https://news.google.com/rss/search?q=' + country.query + '&hl=' + country.lang + '&gl=' + country.code + '&ceid=' + country.code + ':' + country.lang;
  
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 10).map(function(item) {
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
// ARTICLE FILTER & PROCESSING
// ═══════════════════════════════════════════════════════════════════════════
const FOOTBALL_KEYWORDS = [
  'world cup', 'wm 2026', 'mundial', 'coupe du monde', 'mondiali', 'copa do mundo',
  'fifa', 'soccer', 'football', 'fußball', 'fussball', 'futbol', 'calcio', 'voetbal',
  'messi', 'mbappe', 'haaland', 'musiala', 'bellingham', 'vinicius', 'ronaldo',
  'stadium', 'stadion', 'ticket', 'qualification', 'qualifikation', 'draw', 'auslosung',
  'metlife', 'sofi', 'azteca', 'hard rock', 'arrowhead', 'bc place', 'rose bowl'
];

const EXCLUDE_KEYWORDS = [
  'cricket', 'rugby', 'nfl', 'nba', 'mlb', 'tennis', 'golf', 'f1', 'boxing', 'ufc',
  'hockey', 'baseball', 'basketball', 'american football', 'volleyball'
];

function isRelevant(article) {
  const text = (article.title + ' ' + (article.description || '')).toLowerCase();
  if (!text.includes('2026') && !text.includes('world cup') && !text.includes('wm') && !text.includes('mundial')) return false;
  let found = false;
  for (let i = 0; i < FOOTBALL_KEYWORDS.length; i++) {
    if (text.includes(FOOTBALL_KEYWORDS[i])) { found = true; break; }
  }
  if (!found) return false;
  for (let j = 0; j < EXCLUDE_KEYWORDS.length; j++) {
    if (text.includes(EXCLUDE_KEYWORDS[j])) return false;
  }
  return true;
}

function deduplicate(articles) {
  const seen = {};
  const result = [];
  for (let i = 0; i < articles.length; i++) {
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
      for (let i = 0; i < cat.keywords.length; i++) {
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
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('   WM 2026 SENTIMENT ANALYSIS - COMPLETE EDITION');
  console.log('   ' + COUNTRIES.length + ' Countries | 62 Subreddits | 2 AI Models');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: FETCH ALL SOURCES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('📡 PHASE 1: Fetching from ALL sources...\n');
  
  // 1a. Google News from ALL countries (batched)
  console.log('   🌍 Google News: Fetching from ' + COUNTRIES.length + ' countries...');
  const googleNewsResults = [];
  for (let i = 0; i < COUNTRIES.length; i += 20) {
    const batch = COUNTRIES.slice(i, i + 20);
    const results = await Promise.all(batch.map(function(c) { return fetchGoogleNews(c); }));
    for (let j = 0; j < results.length; j++) {
      for (let k = 0; k < results[j].length; k++) {
        googleNewsResults.push(results[j][k]);
      }
    }
    process.stdout.write('      Progress: ' + Math.min(i + 20, COUNTRIES.length) + '/' + COUNTRIES.length + ' countries (' + googleNewsResults.length + ' articles)\r');
    if (i + 20 < COUNTRIES.length) await sleep(200);
  }
  console.log('\n   ✅ Google News: ' + googleNewsResults.length + ' articles from ' + COUNTRIES.length + ' countries');
  
  // 1b. Sport RSS feeds
  console.log('   📰 Sport RSS: Fetching from ' + SPORT_FEEDS.length + ' feeds...');
  const sportFeedResults = [];
  for (let si = 0; si < SPORT_FEEDS.length; si++) {
    try {
      const result = await parser.parseURL(SPORT_FEEDS[si].url);
      for (let sj = 0; sj < (result.items || []).length; sj++) {
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
  console.log('   ✅ Sport RSS: ' + sportFeedResults.length + ' articles');
  
  // 1c. Social Media (parallel)
  console.log('   📱 Social Media: Fetching...');
  const [redditPosts, blueskyPosts, mastodonPosts, youtubePosts] = await Promise.all([
    fetchReddit(),
    fetchBluesky(),
    fetchMastodon(),
    fetchYouTube()
  ]);
  
  // Combine all
  const allArticles = [
    ...googleNewsResults,
    ...sportFeedResults,
    ...redditPosts,
    ...blueskyPosts,
    ...mastodonPosts,
    ...youtubePosts
  ];
  
  console.log('\n   ═══════════════════════════════════════════════════════');
  console.log('   📊 FETCH SUMMARY:');
  console.log('      - Google News:  ' + googleNewsResults.length + ' (' + COUNTRIES.length + ' countries)');
  console.log('      - Sport RSS:    ' + sportFeedResults.length + ' (' + SPORT_FEEDS.length + ' feeds)');
  console.log('      - Reddit:       ' + redditPosts.length + ' (62 subreddits)');
  console.log('      - Bluesky:      ' + blueskyPosts.length);
  console.log('      - Mastodon:     ' + mastodonPosts.length);
  console.log('      - YouTube:      ' + youtubePosts.length);
  console.log('      ─────────────────────────────────────────────────────');
  console.log('      TOTAL RAW:      ' + allArticles.length + ' articles');
  console.log('   ═══════════════════════════════════════════════════════\n');
  
  // Filter and deduplicate
  const relevantArticles = allArticles.filter(isRelevant);
  console.log('   ✅ WM 2026 relevant: ' + relevantArticles.length);
  
  const uniqueArticles = deduplicate(relevantArticles);
  console.log('   ✅ After deduplication: ' + uniqueArticles.length);
  
  // Count unique countries and languages
  const countrySet = {};
  const langSet = {};
  for (let c = 0; c < uniqueArticles.length; c++) {
    if (uniqueArticles[c].country) countrySet[uniqueArticles[c].country] = true;
    if (uniqueArticles[c].lang) langSet[uniqueArticles[c].lang] = true;
  }
  const uniqueCountries = Object.keys(countrySet).length;
  const uniqueLanguages = Object.keys(langSet).length;
  console.log('   🌍 Countries with content: ' + uniqueCountries + ' | Languages: ' + uniqueLanguages);
  
  // Prepare texts for analysis
  const texts = [];
  for (let t = 0; t < Math.min(uniqueArticles.length, 500); t++) {
    texts.push(uniqueArticles[t].title + '. ' + (uniqueArticles[t].description || ''));
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: AI ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n🤖 PHASE 2: AI Analysis (XLM-RoBERTa + Emotion)...\n');
  console.log('   Using NEW HuggingFace URL: router.huggingface.co');
  
  const batchSize = 8;
  const sentimentResults = [];
  const emotionResults = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    process.stdout.write('   Processing batch ' + Math.floor(i / batchSize + 1) + '/' + Math.ceil(texts.length / batchSize) + ' (' + Math.min(i + batchSize, texts.length) + '/' + texts.length + ' texts)...\r');
    
    const [sentimentBatch, emotionBatch] = await Promise.all([
      callHuggingFace(HF_MODELS.sentiment, batch),
      callHuggingFace(HF_MODELS.emotion, batch)
    ]);
    
    // Process sentiment
    if (sentimentBatch && Array.isArray(sentimentBatch)) {
      for (let si2 = 0; si2 < sentimentBatch.length; si2++) {
        const pred = sentimentBatch[si2];
        let score = 0;
        if (Array.isArray(pred)) {
          for (let pi = 0; pi < pred.length; pi++) {
            if (pred[pi].label === 'positive') score = pred[pi].score;
            else if (pred[pi].label === 'negative') score = -pred[pi].score;
          }
        }
        sentimentResults.push(score);
      }
    } else {
      for (let fb = 0; fb < batch.length; fb++) sentimentResults.push(0);
    }
    
    // Process emotions
    if (emotionBatch && Array.isArray(emotionBatch)) {
      for (let ei = 0; ei < emotionBatch.length; ei++) {
        const pred = emotionBatch[ei];
        const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0, trust: 0.1, anticipation: 0.15 };
        if (Array.isArray(pred)) {
          for (let epi = 0; epi < pred.length; epi++) {
            const label = pred[epi].label.toLowerCase();
            if (emotions.hasOwnProperty(label)) emotions[label] = pred[epi].score;
          }
        }
        emotionResults.push(emotions);
      }
    } else {
      for (let efb = 0; efb < batch.length; efb++) {
        emotionResults.push({ joy: 0.15, anger: 0.1, fear: 0.1, sadness: 0.1, surprise: 0.1, disgust: 0.05, trust: 0.15, anticipation: 0.25 });
      }
    }
    
    await sleep(150);
  }
  console.log('');
  
  // Calculate results
  const validSentiments = sentimentResults.filter(s => s !== 0);
  let avgSentiment = validSentiments.length > 0 ? validSentiments.reduce((a, b) => a + b, 0) / validSentiments.length : 0;
  const score = toScore(avgSentiment);
  const label = getLabel(score);
  
  let positive = 0, neutral = 0, negative = 0;
  for (let ds = 0; ds < sentimentResults.length; ds++) {
    if (sentimentResults[ds] > 0.15) positive++;
    else if (sentimentResults[ds] < -0.15) negative++;
    else neutral++;
  }
  
  console.log('\n   ═══════════════════════════════════════════════════════');
  console.log('   📊 ANALYSIS RESULTS:');
  console.log('      Sentiment Score: ' + score + '/100 (' + label.en + ')');
  console.log('      Distribution: +' + positive + ' / =' + neutral + ' / -' + negative);
  console.log('   ═══════════════════════════════════════════════════════\n');
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: SAVE TO DATABASE
  // ═══════════════════════════════════════════════════════════════════════
  console.log('💾 PHASE 3: Saving to Database...');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const { data: prevData } = await supabase
    .from('wm2026_sentiment')
    .select('score')
    .eq('date', yesterday.toISOString().split('T')[0])
    .single();
  
  const trend = prevData ? (score > prevData.score + 3 ? 'up' : score < prevData.score - 3 ? 'down' : 'stable') : 'stable';
  
  let newsCount = 0, socialCount = 0;
  for (let nc = 0; nc < uniqueArticles.length; nc++) {
    if (uniqueArticles[nc].sourceType === 'news') newsCount++;
    else socialCount++;
  }
  
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
  for (let ci = 0; ci < texts.length; ci++) {
    const cat = classifyCategory(texts[ci]);
    categoryData[cat].scores.push(sentimentResults[ci]);
    categoryData[cat].count++;
  }
  
  for (const catKey of Object.keys(categoryData)) {
    const data = categoryData[catKey];
    if (data.count === 0) continue;
    const catAvg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
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
  
  // ═══════════════════════════════════════════════════════════════════════
  // COMPLETE
  // ═══════════════════════════════════════════════════════════════════════
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('   ✅ ANALYSIS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('   📅 Date:           ' + today);
  console.log('   📰 Articles:       ' + uniqueArticles.length + ' analyzed');
  console.log('   🌍 Countries:      ' + uniqueCountries + ' with content');
  console.log('   🗣️  Languages:      ' + uniqueLanguages);
  console.log('   📊 Score:          ' + score + '/100 (' + label.en + ') ' + (trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'));
  console.log('   ⏱️  Duration:       ' + duration + 's');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

run().catch(function(err) {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
