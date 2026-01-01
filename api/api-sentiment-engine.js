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
  
  // Search keywords for WM2026 - 35+ languages, covering 6+ billion speakers
  // Merged from App.jsx RSS feeds + expanded for global coverage
  WM_KEYWORDS: {
    // ==================== MAJOR WORLD LANGUAGES ====================
    
    // English (1.5B speakers) - Merged from App.jsx
    en: [
      'World Cup 2026', 'FIFA 2026', 'WC 2026', 'USA Canada Mexico 2026',
      'FIFA World Cup 2026', 'Soccer World Cup 2026', 'Football World Cup 2026',
      '2026 World Cup draw', '2026 World Cup tickets', '2026 World Cup qualifiers',
      '2026 World Cup host cities', 'United 2026', '2026 World Cup venues',
      '2026 World Cup stadiums', '2026 World Cup teams', '2026 World Cup travel',
      '2026 World Cup favorites', '2026 World Cup stars', '2026 World Cup streaming',
      'USMNT 2026', 'CONCACAF 2026', 'UEFA World Cup 2026',
      // === HOST CITIES - USA ===
      'World Cup Atlanta', 'World Cup Boston', 'World Cup Dallas',
      'World Cup Houston', 'World Cup Kansas City', 'World Cup Los Angeles',
      'World Cup Miami', 'World Cup New York', 'World Cup Philadelphia',
      'World Cup San Francisco', 'World Cup Seattle',
      // === HOST CITIES - Mexico ===
      'World Cup Mexico City', 'World Cup Guadalajara', 'World Cup Monterrey',
      // === HOST CITIES - Canada ===
      'World Cup Toronto', 'World Cup Vancouver',
      // === STADIUMS - USA ===
      'Mercedes-Benz Stadium 2026', 'Gillette Stadium World Cup', 'AT&T Stadium 2026',
      'NRG Stadium World Cup', 'Arrowhead Stadium 2026', 'SoFi Stadium World Cup',
      'Hard Rock Stadium 2026', 'MetLife Stadium World Cup', 'Lincoln Financial Field 2026',
      'Levi\'s Stadium World Cup', 'Lumen Field 2026',
      // === STADIUMS - Mexico ===
      'Estadio Azteca 2026', 'Estadio Azteca World Cup', 'Estadio Akron 2026',
      'Estadio BBVA World Cup', 'Azteca Stadium 2026',
      // === STADIUMS - Canada ===
      'BMO Field World Cup', 'BC Place 2026', 'BC Place World Cup',
      // === STAR PLAYERS + 2026 ===
      'Messi World Cup 2026', 'Mbappe 2026', 'Haaland World Cup',
      'Bellingham 2026', 'Vinicius Jr World Cup', 'Harry Kane 2026',
      'Salah World Cup 2026', 'Pulisic 2026', 'Alphonso Davies World Cup',
      'Kimmich 2026', 'Pedri World Cup', 'Son Heung-min 2026',
      // === FIFA SPONSORS + 2026 ===
      'Adidas World Cup 2026', 'Coca-Cola World Cup', 'Coca-Cola FIFA',
      'Visa World Cup 2026', 'Hyundai World Cup', 'Kia FIFA 2026',
      'Qatar Airways World Cup', 'Budweiser World Cup 2026', 'Budweiser FIFA',
      'McDonald\'s World Cup', 'McDonalds FIFA 2026', 'Hisense World Cup',
      'Verizon World Cup 2026', 'Airbnb World Cup', 'DoorDash FIFA 2026',
      // === FOOTBALL ASSOCIATIONS + 2026 ===
      'FIFA World Cup 2026', 'UEFA World Cup qualifiers',
      'CONCACAF 2026', 'CONMEBOL World Cup 2026', 'CAF World Cup qualifiers',
      'AFC World Cup 2026', 'OFC World Cup qualifiers',
      'USSF 2026', 'US Soccer World Cup', 'Canada Soccer 2026',
      'FA England 2026', 'DFB World Cup', 'FFF France 2026',
      'RFEF Spain 2026', 'FIGC Italy World Cup', 'AFA Argentina 2026',
      'CBF Brazil World Cup', 'KNVB Netherlands 2026'
    ],
    
    // German (130M speakers) - Merged from App.jsx
    de: [
      'WM 2026', 'Weltmeisterschaft 2026', 'Fußball WM 2026', 'FIFA WM 2026',
      'Fußball-Weltmeisterschaft 2026', 'Fussball WM 2026', 'WM Tickets 2026',
      'WM Qualifikation 2026', 'DFB WM 2026', 'Nationalmannschaft WM 2026',
      'WM Auslosung 2026', 'WM 2026 Gastgeber', 'WM 2026 Spielorte',
      'WM 2026 Stadien', 'WM 2026 Nationalmannschaften', 'WM 2026 Reisen',
      'WM 2026 Favoriten', 'WM 2026 Stars', 'ÖFB WM 2026', 'Nati WM 2026',
      // === HOST CITIES (German) ===
      'WM Atlanta', 'WM Los Angeles', 'WM Miami', 'WM New York',
      'WM Mexico City', 'WM Toronto', 'WM Vancouver',
      // === STADIUMS (German) ===
      'Estadio Azteca WM', 'MetLife Stadium WM', 'SoFi Stadium WM',
      // === STAR PLAYERS (German) ===
      'Messi WM 2026', 'Mbappé WM', 'Haaland WM 2026',
      'Kimmich WM', 'Musiala WM 2026', 'Wirtz Weltmeisterschaft',
      'Kane WM 2026', 'Bellingham WM', 'Salah WM 2026',
      // === FIFA SPONSORS (German) ===
      'Adidas WM 2026', 'Coca-Cola WM', 'Visa WM 2026',
      'Hyundai WM', 'Budweiser WM 2026', 'McDonald\'s WM',
      'WM Sponsor', 'WM Partner', 'FIFA Sponsor 2026',
      // === FUSSBALLVERBÄNDE (German) ===
      'DFB WM 2026', 'Deutscher Fußball-Bund 2026', 'DFB Weltmeisterschaft',
      'ÖFB WM 2026', 'Österreichischer Fußball-Bund',
      'SFV WM 2026', 'Schweizer Fussballverband',
      'UEFA WM Qualifikation', 'FIFA Verband 2026',
      'CONMEBOL WM', 'CONCACAF WM 2026', 'CAF WM Qualifikation'
    ],
    
    // Spanish (550M speakers)
    es: [
      'Mundial 2026', 'Copa del Mundo 2026', 'FIFA 2026', 'Copa Mundial 2026',
      'Eliminatorias 2026', 'Selección Mundial 2026', 'Entradas Mundial 2026',
      'Sorteo Mundial 2026', 'México 2026', 'Clasificación Mundial 2026',
      'Sedes Mundial 2026', 'Estadios Mundial 2026', 'Equipos Mundial 2026',
      'Favoritos Mundial 2026', 'Estrellas Mundial 2026',
      // === HOST CITIES (Spanish) ===
      'Mundial Atlanta', 'Mundial Los Angeles', 'Mundial Miami', 'Mundial Nueva York',
      'Mundial Ciudad de México', 'Mundial Guadalajara', 'Mundial Monterrey',
      'Mundial Toronto', 'Mundial Vancouver',
      // === STADIUMS (Spanish) ===
      'Estadio Azteca Mundial 2026', 'Estadio Akron Mundial', 'Estadio BBVA Mundial',
      'MetLife Stadium Mundial', 'SoFi Stadium Mundial', 'Hard Rock Stadium Mundial',
      // === STAR PLAYERS (Spanish) ===
      'Messi Mundial 2026', 'Mbappé Mundial', 'Haaland Mundial 2026',
      'Vinicius Mundial', 'Pedri Mundial 2026', 'Raúl Jiménez Mundial',
      // === FIFA SPONSORS (Spanish) ===
      'Adidas Mundial 2026', 'Coca-Cola Mundial', 'Visa Mundial 2026',
      'Hyundai Mundial', 'Budweiser Mundial', 'McDonald\'s Mundial',
      'Patrocinador Mundial 2026', 'Patrocinador FIFA',
      // === FEDERACIONES (Spanish) ===
      'RFEF Mundial 2026', 'Real Federación Española',
      'FMF Mundial 2026', 'Federación Mexicana de Fútbol',
      'AFA Mundial 2026', 'Asociación del Fútbol Argentino',
      'CONMEBOL eliminatorias 2026', 'CONCACAF clasificación 2026',
      'UEFA clasificación Mundial', 'CAF eliminatorias 2026'
    ],
    
    // French (280M speakers)
    fr: [
      'Coupe du Monde 2026', 'Mondial 2026', 'FIFA 2026', 'CDM 2026',
      'Qualifications Coupe du Monde 2026', 'Billets Coupe du Monde 2026',
      'Tirage Coupe du Monde 2026', 'Équipe de France 2026',
      'Stades Coupe du Monde 2026', 'Villes hôtes 2026',
      // === HOST CITIES (French) ===
      'Mondial Atlanta', 'Mondial Los Angeles', 'Mondial Miami',
      'Mondial Mexico', 'Mondial Toronto', 'Mondial Vancouver',
      // === STAR PLAYERS (French) ===
      'Mbappé Coupe du Monde 2026', 'Griezmann Mondial', 'Messi Mondial 2026',
      'Haaland Coupe du Monde', 'Salah Mondial 2026',
      // === FIFA SPONSORS (French) ===
      'Adidas Coupe du Monde 2026', 'Coca-Cola Mondial', 'Visa Mondial 2026',
      'Hyundai Mondial', 'Budweiser Coupe du Monde', 'McDonald\'s Mondial',
      'Partenaire FIFA 2026', 'Sponsor Coupe du Monde',
      // === FÉDÉRATIONS (French) ===
      'FFF Coupe du Monde 2026', 'Fédération Française de Football',
      'UEFA qualifications 2026', 'FIFA fédération 2026',
      'CONMEBOL Coupe du Monde', 'CONCACAF qualifications',
      'CAF qualifications Mondial 2026'
    ],
    
    // Portuguese (260M speakers)
    pt: [
      'Copa do Mundo 2026', 'Mundial 2026', 'FIFA 2026', 'Copa 2026',
      'Eliminatórias 2026', 'Seleção Brasileira 2026', 'Ingressos Copa 2026',
      'Sorteio Copa 2026', 'Qualificação Mundial 2026', 'Estádios Copa 2026',
      'Seleção Portuguesa 2026',
      // === HOST CITIES (Portuguese) ===
      'Copa Atlanta', 'Copa Los Angeles', 'Copa Miami', 'Copa Nova York',
      'Copa Cidade do México', 'Copa Toronto', 'Copa Vancouver',
      // === STAR PLAYERS (Portuguese) ===
      'Neymar Copa 2026', 'Vinicius Jr Copa', 'Messi Copa do Mundo 2026',
      'Mbappé Copa', 'Bruno Fernandes Mundial 2026', 'Cristiano Ronaldo 2026',
      // === FIFA SPONSORS (Portuguese) ===
      'Adidas Copa 2026', 'Coca-Cola Copa do Mundo', 'Visa Copa 2026',
      'Hyundai Copa', 'Budweiser Copa do Mundo', 'McDonald\'s Copa',
      'Patrocinador FIFA 2026', 'Patrocinador Copa do Mundo',
      // === FEDERAÇÕES (Portuguese) ===
      'CBF Copa 2026', 'Confederação Brasileira de Futebol',
      'FPF Mundial 2026', 'Federação Portuguesa de Futebol',
      'CONMEBOL eliminatórias 2026', 'UEFA qualificação',
      'CAF eliminatórias Copa 2026'
    ],
    
    // Russian (250M speakers)
    ru: [
      'Чемпионат мира 2026', 'ЧМ 2026', 'ФИФА 2026', 'Кубок мира 2026',
      'Мундиаль 2026', 'Отборочные ЧМ 2026', 'Сборная России 2026',
      'Билеты ЧМ 2026', 'Стадионы ЧМ 2026',
      // === HOST CITIES (Russian) ===
      'ЧМ Атланта', 'ЧМ Лос-Анджелес', 'ЧМ Майами', 'ЧМ Мехико',
      // === STAR PLAYERS (Russian) ===
      'Месси ЧМ 2026', 'Мбаппе ЧМ', 'Холанд ЧМ 2026',
      // === ФЕДЕРАЦИИ (Russian) ===
      'УЕФА отборочные 2026', 'ФИФА федерация', 'КОНМЕБОЛ ЧМ 2026'
    ],
    
    // Hindi (600M speakers)
    hi: [
      'फीफा विश्व कप 2026', 'विश्व कप 2026', 'फुटबॉल विश्व कप 2026',
      '2026 वर्ल्ड कप', 'फीफा 2026', 'विश्व कप क्वालीफायर 2026',
      // === FEDERATIONS (Hindi) ===
      'AIFF 2026', 'एएफसी विश्व कप'
    ],
    
    // Bengali (270M speakers)
    bn: [
      'বিশ্বকাপ 2026', 'ফিফা বিশ্বকাপ 2026', 'ফুটবল বিশ্বকাপ 2026',
      '২০২৬ বিশ্বকাপ', 'বিশ্বকাপ বাছাইপর্ব 2026'
    ],
    
    // Indonesian (200M speakers)
    id: [
      'Piala Dunia 2026', 'FIFA 2026', 'Piala Dunia FIFA 2026',
      'Kualifikasi Piala Dunia 2026', 'Timnas Indonesia 2026',
      'Stadion Piala Dunia 2026', 'Tiket Piala Dunia 2026'
    ],
    
    // Arabic (400M speakers)
    ar: [
      'كأس العالم 2026', 'مونديال 2026', 'فيفا 2026', 'كأس العالم لكرة القدم 2026',
      'تصفيات كأس العالم 2026', 'نهائيات كأس العالم 2026',
      'تذاكر كأس العالم 2026', 'ملاعب كأس العالم 2026'
    ],
    
    // Chinese (1.1B speakers)
    zh: [
      '2026年世界杯', '世界杯2026', '2026世界杯', 'FIFA世界杯2026',
      '世界杯预选赛2026', '2026年足球世界杯', '世界杯门票2026',
      '世界杯球场2026', '世界杯参赛队2026'
    ],
    
    // Japanese (125M speakers)
    ja: [
      '2026年ワールドカップ', 'W杯2026', 'FIFAワールドカップ2026',
      '2026年W杯', 'サッカーワールドカップ2026', '日本代表2026',
      'ワールドカップ予選2026', 'ワールドカップチケット2026'
    ],
    
    // Korean (80M speakers)
    ko: [
      '2026 월드컵', '2026년 월드컵', 'FIFA 월드컵 2026',
      '월드컵 예선 2026', '대한민국 대표팀 2026', '월드컵 티켓 2026'
    ],
    
    // Vietnamese (85M speakers)
    vi: [
      'World Cup 2026', 'FIFA 2026', 'Cúp thế giới 2026',
      'Vòng loại World Cup 2026', 'Giải vô địch bóng đá thế giới 2026',
      'Vé World Cup 2026', 'Sân vận động World Cup 2026'
    ],
    
    // Thai (60M speakers)
    th: [
      'ฟุตบอลโลก 2026', 'บอลโลก 2026', 'ฟีฟ่า เวิลด์ คัพ 2026',
      'รอบคัดเลือก ฟุตบอลโลก 2026', 'บัตรฟุตบอลโลก 2026'
    ],
    
    // Persian/Farsi (110M speakers)
    fa: [
      'جام جهانی 2026', 'فیفا 2026', 'جام جهانی فوتبال 2026',
      'مقدماتی جام جهانی 2026', 'بلیط جام جهانی 2026'
    ],
    
    // Turkish (80M speakers)
    tr: [
      'Dünya Kupası 2026', 'FIFA 2026', '2026 Dünya Kupası',
      'Dünya Kupası Elemeleri 2026', 'Milli Takım 2026',
      'Dünya Kupası Biletleri 2026', 'Dünya Kupası Stadyumları 2026'
    ],
    
    // Italian (65M speakers)
    it: [
      'Mondiali 2026', 'Coppa del Mondo 2026', 'FIFA 2026', 'Mondiale 2026',
      'Qualificazioni Mondiali 2026', 'Nazionale Italiana 2026', 
      'Biglietti Mondiali 2026', 'Stadi Mondiali 2026'
    ],
    
    // Polish (45M speakers)
    pl: [
      'Mistrzostwa Świata 2026', 'MŚ 2026', 'FIFA 2026', 'Mundial 2026',
      'Eliminacje MŚ 2026', 'Reprezentacja Polski 2026', 'Piłkarskie MŚ 2026',
      'Bilety MŚ 2026', 'Stadiony MŚ 2026'
    ],
    
    // Ukrainian (40M speakers)
    uk: [
      'Чемпіонат світу 2026', 'ЧС 2026', 'ФІФА 2026',
      'Кубок світу 2026', 'Відбір ЧС 2026', 'Збірна України 2026'
    ],
    
    // Dutch (25M speakers)
    nl: [
      'WK 2026', 'Wereldkampioenschap 2026', 'FIFA 2026', 'WK Voetbal 2026',
      'WK Kwalificatie 2026', 'Oranje WK 2026', 'WK Tickets 2026'
    ],
    
    // Romanian (24M speakers)
    ro: [
      'Cupa Mondială 2026', 'CM 2026', 'FIFA 2026',
      'Campionatul Mondial 2026', 'Preliminarii CM 2026', 'Bilete CM 2026'
    ],
    
    // Greek (13M speakers)
    el: [
      'Παγκόσμιο Κύπελλο 2026', 'Μουντιάλ 2026', 'FIFA 2026',
      'Προκριματικά Μουντιάλ 2026', 'Εισιτήρια Μουντιάλ 2026'
    ],
    
    // Hungarian (13M speakers)
    hu: [
      'Világbajnokság 2026', 'VB 2026', 'FIFA 2026',
      'Labdarúgó-világbajnokság 2026', 'VB-selejtező 2026', 'VB jegyek 2026'
    ],
    
    // Czech (10M speakers)
    cs: [
      'Mistrovství světa 2026', 'MS 2026', 'FIFA 2026',
      'Fotbalové MS 2026', 'Kvalifikace MS 2026'
    ],
    
    // Swedish (10M speakers)
    sv: [
      'VM 2026', 'Fotbolls-VM 2026', 'FIFA VM 2026',
      'Världsmästerskapet 2026', 'VM-kval 2026', 'VM-biljetter 2026'
    ],
    
    // ==================== NORDIC LANGUAGES ====================
    
    // Finnish (5.5M speakers)
    fi: [
      'MM 2026', 'Jalkapallon MM 2026', 'FIFA MM 2026',
      'MM-kisat 2026', 'MM-karsinnat 2026', 'MM-liput 2026'
    ],
    
    // Danish (6M speakers)
    da: [
      'VM 2026', 'Fodbold VM 2026', 'FIFA VM 2026',
      'VM slutrunde 2026', 'VM kvalifikation 2026', 'VM billetter 2026'
    ],
    
    // Norwegian (5M speakers)
    no: [
      'VM 2026', 'Fotball VM 2026', 'FIFA VM 2026',
      'VM sluttspill 2026', 'VM kvalifisering 2026', 'VM billetter 2026'
    ],
    
    // Icelandic (350K speakers)
    is: [
      'HM 2026', 'Heimsmeistaramótið 2026', 'FIFA HM 2026',
      'HM úrslit 2026', 'HM undankeppni 2026'
    ],
    
    // ==================== AFRICAN LANGUAGES ====================
    
    // Swahili (100M+ speakers - East Africa: Kenya, Tanzania, Uganda)
    sw: [
      'Kombe la Dunia 2026', 'FIFA 2026', 'Mashindano ya Dunia 2026',
      'Mchujo Kombe la Dunia 2026', 'Tiketi Kombe la Dunia 2026'
    ],
    
    // Amharic (57M speakers - Ethiopia)
    am: [
      'የዓለም ዋንጫ 2026', 'ፊፋ 2026', 'የእግር ኳስ የዓለም ዋንጫ 2026'
    ],
    
    // Yoruba (45M speakers - Nigeria, Benin)
    yo: [
      'Idije Agbaye 2026', 'FIFA 2026', 'Bọọlu Agbaye 2026'
    ],
    
    // Hausa (75M speakers - Nigeria, Niger, Ghana)
    ha: [
      'Gasar Duniya 2026', 'FIFA 2026', 'Kofin Duniya 2026'
    ],
    
    // Zulu (12M speakers - South Africa)
    zu: [
      'Indebe Yomhlaba 2026', 'FIFA 2026', 'Ibhola Lomhlaba 2026'
    ],
    
    // Afrikaans (7M speakers - South Africa, Namibia)
    af: [
      'Wêreldbeker 2026', 'FIFA 2026', 'Sokker Wêreldbeker 2026',
      'WB 2026', 'Wêreldbeker kwalifikasie 2026'
    ],
    
    // Igbo (45M speakers - Nigeria)
    ig: [
      'Asọmpi Ụwa 2026', 'FIFA 2026', 'Bọọlụ Ụwa 2026'
    ],
    
    // Somali (16M speakers - Somalia, Djibouti, Ethiopia)
    so: [
      'Koobka Adduunka 2026', 'FIFA 2026', 'Kubadda Cagta Adduunka 2026'
    ],
    
    // Wolof (5M speakers - Senegal, Gambia)
    wo: [
      'Coupe du Monde 2026', 'FIFA 2026', 'Kup bi Àdduna 2026'
    ],
    
    // Lingala (25M speakers - DRC, Congo)
    ln: [
      'Kombe ya Mokili 2026', 'FIFA 2026', 'Lisano ya Mokili 2026'
    ],
  },
  
  // ==================== WM 2026 HOST CITIES ====================
  HOST_CITIES: [
    // 🇺🇸 USA - 11 Host Cities
    'Atlanta', 'Boston', 'Dallas', 'Houston', 'Kansas City', 
    'Los Angeles', 'Miami', 'New York', 'Philadelphia', 
    'San Francisco', 'Seattle',
    // 🇲🇽 Mexico - 3 Host Cities
    'Mexico City', 'Ciudad de México', 'Guadalajara', 'Monterrey',
    // 🇨🇦 Canada - 2 Host Cities
    'Toronto', 'Vancouver'
  ],
  
  // ==================== WM 2026 STADIUMS ====================
  STADIUMS: [
    // 🇺🇸 USA Stadiums
    'Mercedes-Benz Stadium', 'Gillette Stadium', 'AT&T Stadium',
    'NRG Stadium', 'Arrowhead Stadium', 'GEHA Field',
    'SoFi Stadium', 'Hard Rock Stadium', 'MetLife Stadium',
    'Lincoln Financial Field', 'Levi\'s Stadium', 'Lumen Field',
    // 🇲🇽 Mexico Stadiums
    'Estadio Azteca', 'Azteca Stadium', 'Estadio Akron', 
    'Estadio BBVA', 'BBVA Stadium',
    // 🇨🇦 Canada Stadiums
    'BMO Field', 'BC Place'
  ],
  
  // ==================== STAR PLAYERS ====================
  PLAYERS: {
    // 🇨🇦🇺🇸🇲🇽 CONCACAF - Host Countries & Region
    concacaf: [
      'Alphonso Davies', 'Christian Pulisic', 'Raúl Jiménez', 'Raul Jimenez',
      'Weston McKennie', 'Tyler Adams', 'Gio Reyna', 'Giovanni Reyna',
      'Hirving Lozano', 'Chucky Lozano', 'Jesús Corona', 'Tecatito',
      'Jonathan David', 'Tajon Buchanan', 'Cyle Larin',
      'Derrick Etienne Jr', 'Luis Tejada', 'Fung a Wing'
    ],
    
    // 🌎 CONMEBOL - South America
    conmebol: [
      'Lionel Messi', 'Leo Messi', 'Neymar', 'Neymar Jr',
      'Vinícius Jr', 'Vinicius Junior', 'Rodrygo', 'Endrick',
      'James Rodríguez', 'James Rodriguez', 'Luis Díaz', 'Luis Diaz',
      'Enner Valencia', 'Moisés Caicedo', 'Moises Caicedo',
      'Miguel Almirón', 'Miguel Almiron', 'Ángel Di María', 'Angel Di Maria',
      'Federico Valverde', 'Darwin Núñez', 'Darwin Nunez',
      'Julián Álvarez', 'Julian Alvarez', 'Lautaro Martínez', 'Lautaro Martinez'
    ],
    
    // ⚽ UEFA - Europe
    uefa: [
      // Germany
      'Joshua Kimmich', 'Jamal Musiala', 'Florian Wirtz', 'Kai Havertz',
      'Antonio Rüdiger', 'Antonio Rudiger', 'Ilkay Gündogan', 'Ilkay Gundogan',
      // England
      'Harry Kane', 'Jude Bellingham', 'Bukayo Saka', 'Phil Foden',
      'Declan Rice', 'Trent Alexander-Arnold',
      // France
      'Kylian Mbappé', 'Kylian Mbappe', 'Antoine Griezmann', 
      'Ousmane Dembélé', 'Ousmane Dembele', 'Aurélien Tchouaméni',
      // Spain
      'Pedri', 'Gavi', 'Lamine Yamal', 'Nico Williams', 'Rodri',
      'Dani Olmo', 'Álvaro Morata', 'Alvaro Morata',
      // Portugal
      'Bruno Fernandes', 'Cristiano Ronaldo', 'Bernardo Silva',
      'Rafael Leão', 'Rafael Leao', 'João Félix', 'Joao Felix',
      // Netherlands
      'Virgil van Dijk', 'Frenkie de Jong', 'Cody Gakpo', 'Xavi Simons',
      // Belgium
      'Kevin De Bruyne', 'Romelu Lukaku', 'Jeremy Doku',
      // Other Europe
      'Marko Arnautović', 'Marko Arnautovic', 'Marcel Sabitzer', // Austria
      'Andy Robertson', 'Scott McTominay', // Scotland
      'Granit Xhaka', 'Xherdan Shaqiri', // Switzerland
      'Erling Haaland', 'Martin Ødegaard', 'Martin Odegaard', // Norway
      'Luka Modrić', 'Luka Modric', 'Mateo Kovačić', 'Mateo Kovacic', // Croatia
      'Robert Lewandowski', 'Piotr Zieliński', // Poland
      'Dušan Vlahović', 'Dusan Vlahovic', // Serbia
    ],
    
    // 🌍 CAF - Africa
    caf: [
      'Mohamed Salah', 'Mo Salah', 'Sadio Mané', 'Sadio Mane',
      'Achraf Hakimi', 'Hakim Ziyech', 'Sofiane Boufal',
      'Riyad Mahrez', 'Franck Kessié', 'Franck Kessie',
      'Andre Ayew', 'Thomas Partey', 'Mohammed Kudus',
      'Victor Osimhen', 'Percy Tau', 'Youssef Msakni',
      'Logan Costa', 'Kalidou Koulibaly'
    ],
    
    // 🌏 AFC - Asia
    afc: [
      'Son Heung-Min', 'Son Heung Min', 'Heung-Min Son',
      'Takumi Minamino', 'Takefusa Kubo', 'Ritsu Doan',
      'Mehdi Taremi', 'Sardar Azmoun', 'Alireza Jahanbakhsh',
      'Salem Al-Dawsari', 'Almoez Ali', 'Akram Afif',
      'Mathew Leckie', 'Yazan Al-Naimat', 'Igor Sergeev'
    ],
    
    // 🌊 OFC - Oceania
    ofc: [
      'Chris Wood'
    ]
  },
  
  // ==================== EQUIPMENT BRANDS ====================
  BRANDS: [
    'Nike', 'Adidas', 'Puma', 'Kappa', 'Umbro', 
    'New Balance', 'Joma', 'Macron', 'Errea',
    '7Saber', 'Uhlsport', 'Kelme', 'Lotto', 
    'Marathon', 'Fútbol Authentico', 'Hummel',
    'Le Coq Sportif', 'Mizuno', 'Jako', 'Givova'
  ],
  
  // ==================== FIFA OFFICIAL SPONSORS ====================
  SPONSORS: {
    // 🏅 FIFA Partners (Top Tier)
    partners: [
      'Adidas', 'adidas',
      'Coca-Cola', 'Coca Cola', 'Coke',
      'Visa',
      'Aramco', 'Saudi Aramco',
      'Hyundai', 'Kia', 'Hyundai-Kia',
      'Lenovo',
      'Qatar Airways'
    ],
    
    // 🔥 FIFA World Cup Sponsors
    worldCupSponsors: [
      'AB InBev', 'Budweiser', 'Bud Light', 'Anheuser-Busch',
      'McDonald\'s', 'McDonalds', 'Mcdonald',
      'Bank of America', 'BofA',
      'Lay\'s', 'Lays', 'PepsiCo', 'Frito-Lay',
      'Verizon',
      'Hisense',
      'Unilever',
      'Mengniu', 'Mengniu Dairy'
    ],
    
    // 🤝 Regional Supporters & Suppliers
    supporters: [
      'DoorDash',
      'Rock-it Cargo',
      'Valvoline',
      'Airbnb',
      'The Home Depot', 'Home Depot',
      'Fox Sports', 'Telemundo', 'TSN', 'CTV'
    ]
  },
  
  // ==================== FOOTBALL ASSOCIATIONS/FEDERATIONS ====================
  ASSOCIATIONS: {
    // 🌍 FIFA & Continental Confederations
    confederations: [
      'FIFA', 'Fédération Internationale de Football Association',
      'UEFA', 'Union of European Football Associations',
      'CONMEBOL', 'Confederación Sudamericana de Fútbol',
      'CONCACAF', 'Confederation of North, Central America and Caribbean Association Football',
      'CAF', 'Confédération Africaine de Football',
      'AFC', 'Asian Football Confederation',
      'OFC', 'Oceania Football Confederation'
    ],
    
    // 🇪🇺 UEFA - European National Associations
    europe: [
      // Major
      'DFB', 'Deutscher Fußball-Bund',           // 🇩🇪 Germany
      'FA', 'The Football Association', 'England FA',  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England
      'FFF', 'Fédération Française de Football',  // 🇫🇷 France
      'RFEF', 'Real Federación Española de Fútbol', // 🇪🇸 Spain
      'FIGC', 'Federazione Italiana Giuoco Calcio', // 🇮🇹 Italy
      'KNVB', 'Koninklijke Nederlandse Voetbalbond', // 🇳🇱 Netherlands
      'RBFA', 'Royal Belgian Football Association', // 🇧🇪 Belgium
      'FPF', 'Federação Portuguesa de Futebol',   // 🇵🇹 Portugal
      'PZPN', 'Polski Związek Piłki Nożnej',      // 🇵🇱 Poland
      'ÖFB', 'Österreichischer Fußball-Bund',     // 🇦🇹 Austria
      'SFV', 'Schweizerischer Fussballverband',   // 🇨🇭 Switzerland
      'HNS', 'Hrvatski Nogometni Savez',          // 🇭🇷 Croatia
      'FSS', 'Fudbalski Savez Srbije',           // 🇷🇸 Serbia
      'UAF', 'Ukrainian Association of Football', // 🇺🇦 Ukraine
      'DBU', 'Dansk Boldspil-Union',              // 🇩🇰 Denmark
      'SvFF', 'Svenska Fotbollförbundet',         // 🇸🇪 Sweden
      'NFF', 'Norges Fotballforbund',             // 🇳🇴 Norway
      'SPL', 'Suomen Palloliitto',                // 🇫🇮 Finland
      'KSÍ', 'Knattspyrnusamband Íslands',        // 🇮🇸 Iceland
      'EPO', 'Elliniki Podosfairiki Omospondia',  // 🇬🇷 Greece
      'TFF', 'Türkiye Futbol Federasyonu',        // 🇹🇷 Turkey
      'FRF', 'Federația Română de Fotbal',        // 🇷🇴 Romania
      'MLSZ', 'Magyar Labdarúgó Szövetség',       // 🇭🇺 Hungary
      'FACR', 'Fotbalová Asociace České Republiky', // 🇨🇿 Czech
      'SFA', 'Scottish Football Association',     // 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland
      'FAW', 'Football Association of Wales',     // 🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales
      'IFA', 'Irish Football Association',        // 🇮🇪 N. Ireland
      'FAI', 'Football Association of Ireland',   // 🇮🇪 Ireland
    ],
    
    // 🌎 CONMEBOL - South American Associations
    southAmerica: [
      'AFA', 'Asociación del Fútbol Argentino',   // 🇦🇷 Argentina
      'CBF', 'Confederação Brasileira de Futebol', // 🇧🇷 Brazil
      'FCF', 'Federación Colombiana de Fútbol',   // 🇨🇴 Colombia
      'FEF', 'Federación Ecuatoriana de Fútbol',  // 🇪🇨 Ecuador
      'APF', 'Asociación Paraguaya de Fútbol',    // 🇵🇾 Paraguay
      'AUF', 'Asociación Uruguaya de Fútbol',     // 🇺🇾 Uruguay
      'FPF', 'Federación Peruana de Fútbol',      // 🇵🇪 Peru
      'ANFP', 'Asociación Nacional de Fútbol Profesional', // 🇨🇱 Chile
      'FVF', 'Federación Venezolana de Fútbol',   // 🇻🇪 Venezuela
      'FBF', 'Federación Boliviana de Fútbol',    // 🇧🇴 Bolivia
    ],
    
    // 🌎 CONCACAF - North/Central America & Caribbean
    northAmerica: [
      'USSF', 'U.S. Soccer', 'US Soccer Federation', // 🇺🇸 USA
      'FMF', 'Federación Mexicana de Fútbol',     // 🇲🇽 Mexico
      'CSA', 'Canada Soccer', 'Canadian Soccer Association', // 🇨🇦 Canada
      'FEPAFUT', 'Federación Panameña de Fútbol', // 🇵🇦 Panama
      'FEDEFUT', 'Federación Costarricense de Fútbol', // 🇨🇷 Costa Rica
      'FENIFUT', 'Federación Nicaragüense de Fútbol', // 🇳🇮 Nicaragua
      'FESFUT', 'Federación Salvadoreña de Fútbol', // 🇸🇻 El Salvador
      'FENAFUTH', 'Federación Nacional de Fútbol de Honduras', // 🇭🇳 Honduras
      'FEDEFUT', 'Federación de Fútbol de Guatemala', // 🇬🇹 Guatemala
      'JFF', 'Jamaica Football Federation',        // 🇯🇲 Jamaica
    ],
    
    // 🌍 CAF - African Associations
    africa: [
      'EFA', 'Egyptian Football Association',      // 🇪🇬 Egypt
      'FRMF', 'Fédération Royale Marocaine de Football', // 🇲🇦 Morocco
      'NFF', 'Nigeria Football Federation',        // 🇳🇬 Nigeria
      'SAFA', 'South African Football Association', // 🇿🇦 South Africa
      'FSF', 'Fédération Sénégalaise de Football', // 🇸🇳 Senegal
      'GFA', 'Ghana Football Association',         // 🇬🇭 Ghana
      'FECAFOOT', 'Fédération Camerounaise de Football', // 🇨🇲 Cameroon
      'FTF', 'Fédération Tunisienne de Football',  // 🇹🇳 Tunisia
      'FAF', 'Fédération Algérienne de Football',  // 🇩🇿 Algeria
      'FIF', 'Fédération Ivoirienne de Football',  // 🇨🇮 Ivory Coast
    ],
    
    // 🌏 AFC - Asian Associations
    asia: [
      'JFA', 'Japan Football Association',         // 🇯🇵 Japan
      'KFA', 'Korea Football Association',         // 🇰🇷 South Korea
      'CFA', 'Chinese Football Association',       // 🇨🇳 China
      'FFIRI', 'Football Federation Islamic Republic of Iran', // 🇮🇷 Iran
      'SAFF', 'Saudi Arabian Football Federation', // 🇸🇦 Saudi Arabia
      'QFA', 'Qatar Football Association',         // 🇶🇦 Qatar
      'FFA', 'Football Federation Australia',      // 🇦🇺 Australia
      'AIFF', 'All India Football Federation',     // 🇮🇳 India
      'PSSI', 'Persatuan Sepakbola Seluruh Indonesia', // 🇮🇩 Indonesia
      'FAT', 'Football Association of Thailand',   // 🇹🇭 Thailand
      'VFF', 'Vietnam Football Federation',        // 🇻🇳 Vietnam
    ],
    
    // 🌊 OFC - Oceania Associations
    oceania: [
      'NZF', 'New Zealand Football',               // 🇳🇿 New Zealand
    ]
  },
  
  // Exclusion terms (other sports) - Merged from App.jsx + expanded
  EXCLUSION_TERMS: [
    // Darts
    'dart', 'darts', 'pdc', 'bdo', 'dartn',
    // Cricket
    'cricket', 't20', 't-20', 'icc', 'ipl', 'bcci', 'ashes', 'test match', 'cricinfo',
    // Basketball
    'basketball', 'nba', 'euroleague', 'fiba', 'wnba',
    // Handball
    'handball', 'ehf',
    // Hockey/Ice Hockey
    'eishockey', 'ice hockey', 'hockey', 'nhl', 'iihf', 'field hockey',
    // Tennis
    'tennis', 'atp', 'wta', 'wimbledon', 'us open tennis', 'roland garros', 'australian open',
    // Other ball sports
    'volleyball', 'rugby', 'baseball', 'mlb', 'softball', 'lacrosse',
    // American Football
    'nfl', 'super bowl', 'american football', 'college football',
    // Motorsport
    'formel 1', 'formula 1', 'f1', 'motogp', 'nascar', 'indycar', 'rallye', 'rally', 'wrc', 'dtm', 'le mans',
    // Combat sports
    'boxing', 'boxen', 'ufc', 'mma', 'wrestling', 'wwe', 'aew', 'ringen', 'judo', 'karate', 'taekwondo',
    // Golf
    'golf', 'pga', 'lpga', 'masters golf', 'ryder cup',
    // Winter sports
    'ski', 'skiing', 'biathlon', 'bob', 'bobsled', 'rodeln', 'luge', 'eiskunstlauf', 'figure skating', 
    'curling', 'snowboard', 'langlauf', 'cross-country skiing', 'ski jumping', 'skispringen',
    'skeleton', 'eisschnelllauf', 'speed skating', 'slalom', 'downhill', 'abfahrt',
    // Athletics/Swimming
    'leichtathletik', 'athletics', 'swimming', 'schwimmen', 'marathon', 'triathlon', 'diving', 'wasserspringen',
    // Olympics (when not football related)
    'olympia', 'olympics', 'paralympics', 'ioc', 'olympische spiele',
    // Cycling
    'tour de france', 'giro', 'cycling', 'radsport', 'vuelta', 'bike', 'radrennen',
    // E-Sports
    'esport', 'e-sport', 'gaming', 'league of legends', 'dota', 'counter-strike',
    // Other
    'snooker', 'billard', 'poker', 'chess', 'schach', 'badminton', 'tischtennis', 'table tennis',
    'surfing', 'skateboard', 'climbing', 'klettern', 'equestrian', 'reiten', 'horse racing', 'pferderennen'
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

// Get all players as flat array
function getAllPlayers() {
  return Object.values(CONFIG.PLAYERS).flat().map(p => p.toLowerCase());
}

// Get all sponsors as flat array
function getAllSponsors() {
  return Object.values(CONFIG.SPONSORS).flat().map(s => s.toLowerCase());
}

// Get all associations as flat array
function getAllAssociations() {
  return Object.values(CONFIG.ASSOCIATIONS).flat().map(a => a.toLowerCase());
}

function isRelevantContent(text, title) {
  const combined = `${title} ${text}`.toLowerCase();
  
  // Check for WM keywords
  const hasWMKeyword = Object.values(CONFIG.WM_KEYWORDS)
    .flat()
    .some(kw => combined.includes(kw.toLowerCase()));
  
  // Check for WM 2026 host cities
  const hasHostCity = CONFIG.HOST_CITIES.some(city => 
    combined.includes(city.toLowerCase())
  );
  
  // Check for WM 2026 stadium names
  const hasStadium = CONFIG.STADIUMS.some(stadium => 
    combined.includes(stadium.toLowerCase())
  );
  
  // Check for star players
  const allPlayers = getAllPlayers();
  const hasPlayer = allPlayers.some(player => combined.includes(player));
  
  // Check for equipment brands
  const hasBrand = CONFIG.BRANDS.some(brand => 
    combined.includes(brand.toLowerCase())
  );
  
  // Check for FIFA sponsors
  const allSponsors = getAllSponsors();
  const hasSponsor = allSponsors.some(sponsor => combined.includes(sponsor));
  
  // Check for football associations
  const allAssociations = getAllAssociations();
  const hasAssociation = allAssociations.some(assoc => combined.includes(assoc));
  
  // Check for football/soccer context in 35+ languages
  const hasFootballContext = [
    // English, German, Spanish, Portuguese, Italian
    'soccer', 'football', 'fußball', 'fussball', 'fútbol', 'futebol', 'calcio',
    // Dutch, Polish, Norwegian, Danish, Finnish
    'voetbal', 'piłka nożna', 'fotball', 'fodbold', 'jalkapallo',
    // Turkish, Russian, Greek, Hindi, Thai
    'futbol', 'футбол', 'ποδόσφαιρο', 'फुटबॉल', 'ฟุตบอล',
    // Vietnamese, Indonesian, Arabic, Chinese, Japanese, Korean
    'bóng đá', 'sepak bola', 'كرة القدم', '足球', 'サッカー', '축구',
    // Swedish, Icelandic, Romanian, Hungarian, Czech
    'fotboll', 'fótbolti', 'fotbal', 'labdarúgás', 'fotbal',
    // Ukrainian, Persian, Bengali
    'футбол', 'فوتبال', 'ফুটবল',
    // African languages
    'kandanda', 'mpira', 'soka', 'bola', 'ibhola', 'sokker',
    // FIFA, national teams, associations
    'fifa', 'uefa', 'conmebol', 'concacaf', 'caf', 'afc', 'ofc',
    'nationalmannschaft', 'national team', 'seleção', 'selección', 'nazionale',
    'équipe nationale', 'сборная', 'منتخب', '代表', 'landslag',
    'federation', 'association', 'verband', 'federación', 'fédération',
    // Tournament terms
    'weltmeisterschaft', 'world cup', 'mundial', 'coupe du monde', 'coppa del mondo',
    'чемпионат мира', 'كأس العالم', '世界杯', 'ワールドカップ', '월드컵',
    'vm', 'wm', 'wk', 'mm', 'hm', 'ms', 'cm',
    // Sponsor context
    'sponsor', 'partner', 'patrocinador', 'partenaire', 'sponsoring'
  ].some(term => combined.includes(term));
  
  // Check for exclusion terms
  const hasExclusionTerm = CONFIG.EXCLUSION_TERMS
    .some(term => combined.includes(term.toLowerCase()));
  
  // If excluded sport and no direct WM keyword, skip
  if (hasExclusionTerm && !hasWMKeyword) {
    return false;
  }
  
  // Include if:
  // 1. Has direct WM keyword, OR
  // 2. Has "2026" + football context, OR
  // 3. Has stadium + (2026 or world cup), OR
  // 4. Has host city + (world cup or 2026), OR
  // 5. Has star player + (2026 or world cup), OR
  // 6. Has brand + (world cup or 2026 or jersey/kit context), OR
  // 7. Has sponsor + (world cup or 2026 or FIFA), OR
  // 8. Has association + (2026 or world cup or qualifiers)
  const has2026OrWC = combined.includes('2026') || 
                       combined.includes('world cup') || 
                       combined.includes('mundial') ||
                       combined.includes('wm ') ||
                       combined.includes('weltmeisterschaft') ||
                       combined.includes('fifa');
  
  return hasWMKeyword || 
         (combined.includes('2026') && hasFootballContext) ||
         (hasStadium && has2026OrWC) ||
         (hasHostCity && has2026OrWC) ||
         (hasPlayer && has2026OrWC) ||
         (hasBrand && has2026OrWC && (combined.includes('jersey') || combined.includes('kit') || combined.includes('trikot'))) ||
         (hasSponsor && has2026OrWC) ||
         (hasAssociation && has2026OrWC);
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

// Language-to-country mapping for Google News (ISO codes)
const LANG_COUNTRY_MAP = {
  // Major languages
  en: 'US', de: 'DE', es: 'ES', fr: 'FR', pt: 'BR', it: 'IT',
  nl: 'NL', pl: 'PL', ru: 'RU', tr: 'TR', ar: 'SA', ja: 'JP',
  ko: 'KR', zh: 'CN', id: 'ID', vi: 'VN', th: 'TH', el: 'GR',
  cs: 'CZ', sv: 'SE', ro: 'RO', hu: 'HU', uk: 'UA', fa: 'IR',
  hi: 'IN', bn: 'BD',
  // Nordic
  fi: 'FI', da: 'DK', no: 'NO', is: 'IS',
  // African (use countries where language is spoken + has Google News)
  sw: 'KE', af: 'ZA', am: 'ET', ha: 'NG', yo: 'NG', zu: 'ZA',
  ig: 'NG', so: 'SO', wo: 'SN', ln: 'CD'
};

// All supported languages for comprehensive global coverage
const ALL_SEARCH_LANGUAGES = [
  // Tier 1: Major languages with most content (always search)
  'en', 'de', 'es', 'fr', 'pt', 'it', 'ar', 'zh', 'ja', 'ko', 'ru',
  // Tier 2: Important regional languages
  'pl', 'nl', 'tr', 'id', 'vi', 'th', 'fa', 'hi',
  // Tier 3: European languages
  'uk', 'el', 'cs', 'sv', 'ro', 'hu',
  // Tier 4: Nordic languages
  'fi', 'da', 'no',
  // Tier 5: African languages (where Google News supports)
  'sw', 'af'
];

async function fetchGoogleNewsRSS(languages = ALL_SEARCH_LANGUAGES) {
  console.log(`📰 Fetching Google News RSS for ${languages.length} languages...`);
  const articles = [];
  
  for (const lang of languages) {
    const keywords = CONFIG.WM_KEYWORDS[lang] || CONFIG.WM_KEYWORDS.en;
    const country = LANG_COUNTRY_MAP[lang] || lang.toUpperCase();
    
    // Limit to first 3 keywords per language to avoid rate limiting
    for (const keyword of keywords.slice(0, 3)) {
      try {
        const encodedQuery = encodeURIComponent(keyword);
        const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
        
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const text = await response.text();
        
        // Parse RSS XML
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        
        for (const item of items.slice(0, 15)) { // 15 per keyword
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
  
  console.log(`📰 Google News: Found ${articles.length} articles from ${languages.length} languages`);
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

// Comprehensive list of football-related subreddits (VERIFIED)
const REDDIT_SUBREDDITS = {
  // ==================== GLOBAL FOOTBALL ====================
  global: [
    'soccer',           // 4.5M+ members - Main football sub ✅
    'football',         // European football ✅
    'worldcup',         // World Cup specific ✅
  ],
  
  // ==================== HOST COUNTRIES ====================
  hosts: [
    // 🇺🇸 USA
    'MLS', 'ussoccer', 'USMNT',
    // 🇨🇦 Canada
    'CanadianPL',
    // 🇲🇽 Mexico
    'LigaMX',
  ],
  
  // ==================== MAJOR EUROPEAN LEAGUES ====================
  leagues: [
    // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England - Premier League
    'PremierLeague', 'Championship',
    // 🇩🇪 Germany - Bundesliga
    'Bundesliga',
    // 🇪🇸 Spain - La Liga
    'LaLiga',
    // 🇮🇹 Italy - Serie A
    'seriea',
    // 🇫🇷 France - Ligue 1
    'Ligue1',
    // 🇳🇱 Netherlands - Eredivisie
    'Eredivisie',
    // 🇵🇹 Portugal - Primeira Liga
    'PrimeiraLiga',
    // 🇹🇷 Turkey
    'superlig',
  ],
  
  // ==================== SOUTH AMERICA ====================
  southAmerica: [
    'futebol',          // Brazilian Portuguese ✅
    'Libertadores',     // Copa Libertadores ✅
    'BocaJuniors', 'RiverPlate',  // Argentina clubs ✅
    'argentina',        // Country sub ✅
    'brasil',           // Country sub ✅
  ],
  
  // ==================== MAJOR CLUBS ====================
  clubs: [
    // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 English Clubs
    'reddevils',        // Manchester United ✅
    'MCFC',             // Manchester City ✅
    'LiverpoolFC',      // Liverpool ✅
    'chelseafc',        // Chelsea ✅
    'Gunners',          // Arsenal ✅
    'coys',             // Tottenham ✅
    'Everton',          // Everton ✅
    'NUFC',             // Newcastle ✅
    // 🇪🇸 Spanish Clubs
    'Barca',            // FC Barcelona ✅
    'realmadrid',       // Real Madrid ✅
    'atletico',         // Atletico Madrid ✅
    // 🇩🇪 German Clubs
    'fcbayern',         // Bayern Munich ✅
    'borussiadortmund', // Borussia Dortmund ✅
    'schalke04',        // Schalke ✅
    // 🇮🇹 Italian Clubs
    'Juve',             // Juventus ✅
    'ACMilan',          // AC Milan ✅
    'ASRoma',           // AS Roma ✅
    // 🇫🇷 French Clubs
    'psg',              // Paris Saint-Germain ✅
    // 🇳🇱 Dutch Clubs
    'AjaxAmsterdam',    // Ajax ✅
    'feyenoord',        // Feyenoord ✅
    // 🇵🇹 Portuguese Clubs
    'benfica',          // Benfica ✅
    'fcporto',          // FC Porto ✅
  ],
  
  // ==================== COUNTRY SUBREDDITS (General) ====================
  // These often discuss national team during WC
  countries: [
    // Europe
    'de', 'germany',                    // 🇩🇪 Germany ✅
    'france',                            // 🇫🇷 France ✅
    'unitedkingdom', 'CasualUK',        // 🇬🇧 UK ✅
    'spain',                             // 🇪🇸 Spain ✅
    'italy',                             // 🇮🇹 Italy ✅
    'thenetherlands',                    // 🇳🇱 Netherlands ✅
    'belgium',                           // 🇧🇪 Belgium ✅
    'portugal',                          // 🇵🇹 Portugal ✅
    'poland', 'Polska',                  // 🇵🇱 Poland ✅
    'Austria',                           // 🇦🇹 Austria ✅
    'Switzerland',                       // 🇨🇭 Switzerland ✅
    'croatia',                           // 🇭🇷 Croatia ✅
    'serbia',                            // 🇷🇸 Serbia ✅
    'ukraine',                           // 🇺🇦 Ukraine ✅
    'Denmark',                           // 🇩🇰 Denmark ✅
    'sweden',                            // 🇸🇪 Sweden ✅
    'Norway', 'norge',                   // 🇳🇴 Norway ✅
    'Finland', 'Suomi',                  // 🇫🇮 Finland ✅
    'Iceland',                           // 🇮🇸 Iceland ✅
    'greece',                            // 🇬🇷 Greece ✅
    'Turkey', 'turkiye',                 // 🇹🇷 Turkey ✅
    'Romania',                           // 🇷🇴 Romania ✅
    'hungary',                           // 🇭🇺 Hungary ✅
    // Americas
    'brasil',                            // 🇧🇷 Brazil ✅
    'argentina',                         // 🇦🇷 Argentina ✅
    'chile',                             // 🇨🇱 Chile ✅
    'Colombia',                          // 🇨🇴 Colombia ✅
    'uruguay',                           // 🇺🇾 Uruguay ✅
    'mexico',                            // 🇲🇽 Mexico ✅
    'Panama',                            // 🇵🇦 Panama ✅
    'CostaRica',                         // 🇨🇷 Costa Rica ✅
    // Asia
    'japan',                             // 🇯🇵 Japan ✅
    'korea',                             // 🇰🇷 South Korea ✅
    'China',                             // 🇨🇳 China ✅
    'iran',                              // 🇮🇷 Iran ✅
    'saudiarabia',                       // 🇸🇦 Saudi Arabia ✅
    'australia',                         // 🇦🇺 Australia ✅
    'india',                             // 🇮🇳 India ✅
    'indonesia',                         // 🇮🇩 Indonesia ✅
    // Africa
    'Morocco',                           // 🇲🇦 Morocco ✅
    'Egypt',                             // 🇪🇬 Egypt ✅
    'nigeria',                           // 🇳🇬 Nigeria ✅
    'southafrica',                       // 🇿🇦 South Africa ✅
    'Senegal',                           // 🇸🇳 Senegal ✅
    'Ghana',                             // 🇬🇭 Ghana ✅
    'algeria',                           // 🇩🇿 Algeria ✅
  ],
  
  // ==================== ASIAN FOOTBALL ====================
  asia: [
    'JLeague',          // 🇯🇵 Japan ✅
    'Aleague',          // 🇦🇺 Australia ✅
  ],
  
  // ==================== WM 2026 HOST CITIES ====================
  hostCities: [
    // 🇺🇸 USA - 11 Host Cities
    'Atlanta',          // Mercedes-Benz Stadium ✅
    'boston',           // Gillette Stadium ✅
    'Dallas',           // AT&T Stadium ✅
    'houston',          // NRG Stadium ✅
    'kansascity',       // Arrowhead Stadium ✅
    'LosAngeles',       // SoFi Stadium ✅
    'Miami',            // Hard Rock Stadium ✅
    'nyc', 'newjersey', // MetLife Stadium ✅
    'philadelphia',     // Lincoln Financial Field ✅
    'sanfrancisco', 'bayarea', // Levi's Stadium ✅
    'Seattle',          // Lumen Field ✅
    // 🇲🇽 Mexico - 3 Host Cities
    'mexico',           // Estadio Azteca ✅
    // 🇨🇦 Canada - 2 Host Cities
    'toronto',          // BMO Field ✅
    'vancouver',        // BC Place ✅
  ],
  
  // ==================== US CITY-SPECIFIC SUBS ====================
  usCities: [
    // Atlanta
    'AtlantaUnited', 'falcons',
    // Boston
    'NewEnglandRevolution', 'patriots',
    // Dallas
    'FCDallas', 'cowboys',
    // Houston
    'dynamo', 'Texans',
    // Kansas City
    'SportingKC', 'KansasCityChiefs',
    // Los Angeles
    'LAFC', 'LAGalaxy', 'Dodgers', 'lakers',
    // Miami
    'InterMiami', 'MiamiDolphins', 'heat',
    // New York / New Jersey
    'NYCFC', 'NYGiants', 'nyjets',
    // Philadelphia
    'PhillyUnion', 'eagles', 'phillies',
    // San Francisco / Bay Area
    'SJEarthquakes', '49ers',
    // Seattle
    'SoundersFC', 'Seahawks',
  ],
  
  // ==================== MEXICO CITY-SPECIFIC SUBS ====================
  mexicoCities: [
    'ClubAmerica', 'cruzazul', 'pumas', // Mexico City clubs ✅
    'Chivas',                            // Guadalajara ✅
    'Tigres', 'Rayados',                 // Monterrey clubs ✅
  ],
  
  // ==================== CANADA CITY-SPECIFIC SUBS ====================
  canadaCities: [
    'tfc', 'TorontoFC',                  // Toronto FC ✅
    'whitecapsfc',                       // Vancouver Whitecaps ✅
  ],
  
  // ==================== EQUIPMENT & BRANDS ====================
  brands: [
    'SoccerJerseys',    // Soccer jerseys ✅
    'footballkits',     // Football kits ✅
    'Nike',             // Brand general ✅
    'adidas',           // Brand general ✅
  ],
  
  // ==================== FIFA SPONSORS ====================
  sponsors: [
    // 🏅 FIFA Partners
    'Hyundai', 'kia',           // Hyundai-Kia ✅
    // 🔥 World Cup Sponsors
    'Budweiser', 'beer',        // AB InBev ✅
    'McDonalds',                // McDonald's ✅
    // 🤝 Supporters
    'doordash',                 // DoorDash ✅
    'airbnb',                   // Airbnb ✅
    'HomeDepot',                // Home Depot ✅
    'Verizon',                  // Verizon ✅
  ],
  
  // ==================== FOOTBALL ASSOCIATIONS ====================
  associations: [
    // Verified existing subreddits for FAs
    'ussoccer',          // USSF ✅
    'dfb',               // DFB Germany (if exists)
  ],
};

// Flatten all subreddits into single array
const ALL_SUBREDDITS = [
  ...new Set([
    ...REDDIT_SUBREDDITS.global,
    ...REDDIT_SUBREDDITS.hosts,
    ...REDDIT_SUBREDDITS.leagues,
    ...REDDIT_SUBREDDITS.southAmerica,
    ...REDDIT_SUBREDDITS.clubs,
    ...REDDIT_SUBREDDITS.countries,
    ...REDDIT_SUBREDDITS.asia,
    ...REDDIT_SUBREDDITS.hostCities,
    ...REDDIT_SUBREDDITS.usCities,
    ...REDDIT_SUBREDDITS.mexicoCities,
    ...REDDIT_SUBREDDITS.canadaCities,
    ...REDDIT_SUBREDDITS.brands,
    ...REDDIT_SUBREDDITS.sponsors,
    ...REDDIT_SUBREDDITS.associations,
  ])
];

// Search terms in multiple languages + stadiums + associations
const REDDIT_SEARCH_TERMS = [
  // General WM terms
  'World Cup 2026', 'WM 2026', 'FIFA 2026', 'Mundial 2026',
  'Coupe du Monde 2026', 'Copa del Mundo 2026', 'Mondiali 2026',
  '2026 World Cup', 'WC 2026',
  // Host cities
  'World Cup Atlanta', 'World Cup Miami', 'World Cup Los Angeles',
  'World Cup New York', 'World Cup Dallas', 'World Cup Houston',
  'World Cup Mexico City', 'World Cup Toronto', 'World Cup Vancouver',
  // Stadium names
  'MetLife Stadium 2026', 'SoFi Stadium World Cup', 'Estadio Azteca 2026',
  'Hard Rock Stadium 2026', 'AT&T Stadium World Cup', 'Mercedes-Benz Stadium 2026',
  // Star players + 2026
  'Messi 2026', 'Mbappé 2026', 'Mbappe World Cup', 'Haaland 2026',
  'Bellingham World Cup', 'Vinicius 2026', 'Salah World Cup',
  'Pulisic 2026', 'Alphonso Davies World Cup', 'Kane 2026',
  // FIFA Sponsors + 2026
  'Adidas World Cup 2026', 'Coca-Cola World Cup', 'Budweiser FIFA 2026',
  'McDonald\'s World Cup', 'Hyundai FIFA', 'Visa World Cup 2026',
  'World Cup sponsor', 'FIFA sponsor 2026', 'World Cup partner',
  // Football Associations + 2026
  'DFB 2026', 'USSF World Cup', 'CBF 2026', 'AFA World Cup',
  'UEFA World Cup 2026', 'CONMEBOL 2026', 'CONCACAF World Cup',
  'FIFA qualification 2026', 'World Cup qualifiers'
];

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
  console.log(`🔴 Fetching Reddit from ${ALL_SUBREDDITS.length} subreddits...`);
  const articles = [];
  const processedIds = new Set();
  
  // Get access token
  const accessToken = await getRedditAccessToken();
  
  // Priority subreddits get all search terms, others get fewer
  const prioritySubs = [...REDDIT_SUBREDDITS.global, ...REDDIT_SUBREDDITS.hosts, ...REDDIT_SUBREDDITS.leagues];
  
  for (const subreddit of ALL_SUBREDDITS) {
    // Determine how many search terms to use based on priority
    const isPriority = prioritySubs.includes(subreddit);
    const searchTerms = isPriority ? REDDIT_SEARCH_TERMS : REDDIT_SEARCH_TERMS.slice(0, 3);
    
    for (const term of searchTerms) {
      try {
        let url, headers;
        
        if (accessToken) {
          url = `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(term)}&sort=new&limit=25&restrict_sr=1&t=week`;
          headers = {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': CONFIG.REDDIT_USER_AGENT,
          };
        } else {
          url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25&restrict_sr=1&t=week`;
          headers = {
            'User-Agent': CONFIG.REDDIT_USER_AGENT,
          };
        }
        
        const response = await fetch(url, { headers });
        if (!response.ok) continue;
        
        const data = await response.json();
        
        for (const post of (data.data?.children || [])) {
          const item = post.data;
          
          // Skip if already processed (deduplication)
          if (processedIds.has(item.id)) continue;
          processedIds.add(item.id);
          
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
              metadata: {
                subreddit: item.subreddit,
                score: item.score,
                num_comments: item.num_comments,
                upvote_ratio: item.upvote_ratio,
              },
            });
          }
        }
        
        // Rate limiting - Reddit is strict
        await sleep(CONFIG.REQUEST_DELAY_MS * 3);
      } catch (error) {
        // Silent fail for individual subreddits
        if (error.message.includes('403') || error.message.includes('404')) {
          // Subreddit doesn't exist or is private
          continue;
        }
        console.warn(`Reddit error for r/${subreddit}:`, error.message);
      }
    }
  }
  
  console.log(`🔴 Reddit: Found ${articles.length} posts from ${ALL_SUBREDDITS.length} subreddits`);
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
    const { action, sources, format, days } = req.query;
    
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
      
      case 'export':
        // Comprehensive data export
        const exportData = await generateComprehensiveExport(parseInt(days) || 30);
        
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=wm2026_export_${new Date().toISOString().split('T')[0]}.csv`);
          return res.status(200).send(convertToCSV(exportData.articles));
        }
        
        return res.status(200).json({
          success: true,
          message: 'Comprehensive Export',
          generated_at: new Date().toISOString(),
          export: exportData
        });
      
      default:
        return res.status(200).json({
          success: true,
          message: 'WM2026 Sentiment Engine v2.0',
          endpoints: {
            'GET /api/sentiment-engine?action=run': 'Run full pipeline',
            'GET /api/sentiment-engine?action=status': 'Get processing status',
            'GET /api/sentiment-engine?action=summary': 'Get current summary',
            'GET /api/sentiment-engine?action=export': 'Export comprehensive data (JSON)',
            'GET /api/sentiment-engine?action=export&format=csv': 'Export articles as CSV',
            'GET /api/sentiment-engine?action=export&days=7': 'Export last 7 days',
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
// COMPREHENSIVE EXPORT FUNCTION
// =====================================================

async function generateComprehensiveExport(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  console.log(`📊 Generating comprehensive export for last ${days} days...`);
  
  // 1. Fetch all articles with full details
  const { data: articles, error: articlesError } = await supabase
    .from('wm2026_articles')
    .select('*')
    .gte('published_at', startDate.toISOString())
    .order('published_at', { ascending: false });
  
  if (articlesError) throw articlesError;
  
  // 2. Fetch daily aggregations
  const { data: dailyStats, error: dailyError } = await supabase
    .from('wm2026_daily_sentiment')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });
  
  if (dailyError) throw dailyError;
  
  // 3. Fetch processing logs
  const { data: processingLogs, error: logsError } = await supabase
    .from('wm2026_processing_log')
    .select('*')
    .gte('started_at', startDate.toISOString())
    .order('started_at', { ascending: false });
  
  if (logsError) throw logsError;
  
  // 4. Calculate statistics
  const stats = calculateExportStatistics(articles);
  
  return {
    metadata: {
      export_date: new Date().toISOString(),
      period_start: startDate.toISOString(),
      period_end: new Date().toISOString(),
      total_days: days,
      total_articles: articles?.length || 0,
    },
    
    // Summary statistics
    statistics: stats,
    
    // Daily aggregations
    daily_sentiment: dailyStats || [],
    
    // Processing history
    processing_logs: processingLogs || [],
    
    // All articles with full details
    articles: (articles || []).map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source,
      source_type: a.source_type,
      language: a.language,
      country: a.country,
      published_at: a.published_at,
      fetched_at: a.fetched_at,
      // Sentiment analysis
      sentiment_score: a.sentiment_score,
      sentiment_label: a.sentiment_label,
      sentiment_confidence: a.sentiment_confidence,
      // Emotions
      emotion_joy: a.emotion_joy,
      emotion_anger: a.emotion_anger,
      emotion_fear: a.emotion_fear,
      emotion_sadness: a.emotion_sadness,
      emotion_surprise: a.emotion_surprise,
      emotion_disgust: a.emotion_disgust,
      dominant_emotion: a.dominant_emotion,
      // Subjectivity
      subjectivity_score: a.subjectivity_score,
      // Metadata
      category: a.category,
      keywords_matched: a.keywords_matched,
      is_processed: a.is_processed,
    })),
    
    // Configuration used
    config_snapshot: {
      languages: Object.keys(CONFIG.WM_KEYWORDS).length,
      keywords_count: Object.values(CONFIG.WM_KEYWORDS).flat().length,
      host_cities: CONFIG.HOST_CITIES.length,
      stadiums: CONFIG.STADIUMS.length,
      players_count: Object.values(CONFIG.PLAYERS).flat().length,
      sponsors_count: Object.values(CONFIG.SPONSORS).flat().length,
      associations_count: Object.values(CONFIG.ASSOCIATIONS).flat().length,
      brands_count: CONFIG.BRANDS.length,
      exclusion_terms_count: CONFIG.EXCLUSION_TERMS.length,
    },
  };
}

function calculateExportStatistics(articles) {
  if (!articles || articles.length === 0) {
    return {
      total: 0,
      by_source: {},
      by_language: {},
      by_country: {},
      by_sentiment: {},
      by_emotion: {},
      by_category: {},
      sentiment_avg: 0,
      processed_rate: 0,
    };
  }
  
  // Source distribution
  const bySource = {};
  articles.forEach(a => {
    bySource[a.source_type || 'unknown'] = (bySource[a.source_type || 'unknown'] || 0) + 1;
  });
  
  // Language distribution
  const byLanguage = {};
  articles.forEach(a => {
    byLanguage[a.language || 'unknown'] = (byLanguage[a.language || 'unknown'] || 0) + 1;
  });
  
  // Country distribution
  const byCountry = {};
  articles.forEach(a => {
    byCountry[a.country || 'unknown'] = (byCountry[a.country || 'unknown'] || 0) + 1;
  });
  
  // Sentiment distribution
  const bySentiment = { positive: 0, neutral: 0, negative: 0 };
  articles.forEach(a => {
    if (a.sentiment_label) {
      bySentiment[a.sentiment_label] = (bySentiment[a.sentiment_label] || 0) + 1;
    }
  });
  
  // Emotion distribution
  const byEmotion = {};
  articles.forEach(a => {
    if (a.dominant_emotion) {
      byEmotion[a.dominant_emotion] = (byEmotion[a.dominant_emotion] || 0) + 1;
    }
  });
  
  // Category distribution
  const byCategory = {};
  articles.forEach(a => {
    if (a.category) {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    }
  });
  
  // Average sentiment
  const processedArticles = articles.filter(a => a.sentiment_score !== null);
  const sentimentAvg = processedArticles.length > 0
    ? processedArticles.reduce((sum, a) => sum + a.sentiment_score, 0) / processedArticles.length
    : 0;
  
  // Processed rate
  const processedRate = articles.length > 0
    ? (articles.filter(a => a.is_processed).length / articles.length * 100).toFixed(2)
    : 0;
  
  return {
    total: articles.length,
    by_source: bySource,
    by_language: byLanguage,
    by_country: byCountry,
    by_sentiment: bySentiment,
    by_emotion: byEmotion,
    by_category: byCategory,
    sentiment_avg: sentimentAvg.toFixed(4),
    processed_rate: parseFloat(processedRate),
    date_range: {
      earliest: articles[articles.length - 1]?.published_at,
      latest: articles[0]?.published_at,
    },
  };
}

function convertToCSV(articles) {
  if (!articles || articles.length === 0) {
    return 'No data available';
  }
  
  const headers = [
    'id', 'title', 'description', 'url', 'source', 'source_type', 
    'language', 'country', 'published_at', 'fetched_at',
    'sentiment_score', 'sentiment_label', 'sentiment_confidence',
    'emotion_joy', 'emotion_anger', 'emotion_fear', 'emotion_sadness',
    'emotion_surprise', 'emotion_disgust', 'dominant_emotion',
    'subjectivity_score', 'category', 'keywords_matched', 'is_processed'
  ];
  
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const rows = articles.map(a => 
    headers.map(h => escapeCSV(a[h])).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
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
  generateComprehensiveExport,
};
