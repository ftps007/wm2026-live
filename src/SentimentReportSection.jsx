import React, { useState } from 'react';

/* ═══════════════════════════════════════════════════════════
   WM 2026 — National Team Sentiment Visualization
   Week 5: February 2 – 6, 2026 | 42 Qualified Teams
   ═══════════════════════════════════════════════════════════ */

// ─── Labels ─────────────────────────────────────────────────
const L = {
  en: {
    title: 'National Team Sentiment',
    subtitle: '42 qualified teams ranked by media & social sentiment',
    period: 'Week 5 — Feb 2–6, 2026',
    db: '21,478 articles in database',
    ranked: 'Ranked',
    byGroup: 'By Group',
    rank: '#',
    team: 'Team',
    sentiment: 'Sentiment',
    articles: 'Art.',
    emotions: 'F / J / A',
    group: 'Grp',
    mostPositive: 'Most Positive',
    mostNegative: 'Most Negative',
    biggestMover: 'Biggest Mover',
    hostAvg: 'Host Nations',
    lowVolume: 'Low volume',
    noData: 'No articles',
    fear: 'Fear',
    joy: 'Joy',
    anger: 'Anger',
    legend: 'Bar = sentiment score. Dots = Fear / Joy / Anger intensity. Opacity = strength.',
    pos: 'Positive',
    neg: 'Negative',
    portugal: 'Ronaldo\'s last WC narrative driving excitement. Highest pos% among major teams (26.6%).',
    uruguay: 'Only 5 articles, all skeptical. Questions whether Uruguay can compete in Group H.',
    germany: 'From -0.261 to +0.005 after DFB boycott resolution. Most polarized team: 16.7% pos AND 14.6% neg.',
    hosts: 'Mexico leads hosts at +0.131 (clean recovery from -0.028). USA improving but political drag persists.',
    footer: 'Sentiment doesn\'t predict results — it reveals pressure.',
    nextReport: 'Next report: February 13, 2026',
    groupLabel: 'GROUP',
    avgSent: 'avg',
    teamsQualified: 'teams qualified',
    spotsOpen: '6 spots via playoffs',
    wow: 'WoW',
    logScore: 'Impact',
    heatMap: 'Heat Map',
    heatMapSub: 'Sentiment vs. Coverage — bubble size = impact score',
  },
  de: {
    title: 'Nationalmannschaft-Sentiment',
    subtitle: '42 qualifizierte Teams nach Medien- & Social-Sentiment',
    period: 'Woche 5 — 2.–6. Feb 2026',
    db: '21.478 Artikel in der Datenbank',
    ranked: 'Rangliste',
    byGroup: 'Nach Gruppe',
    rank: '#',
    team: 'Team',
    sentiment: 'Sentiment',
    articles: 'Art.',
    emotions: 'F / J / A',
    group: 'Gr.',
    mostPositive: 'Positivstes Team',
    mostNegative: 'Negativstes Team',
    biggestMover: 'Größter Aufsteiger',
    hostAvg: 'Gastgeber',
    lowVolume: 'Wenig Daten',
    noData: 'Keine Artikel',
    fear: 'Angst',
    joy: 'Freude',
    anger: 'Wut',
    legend: 'Balken = Sentiment. Punkte = Angst / Freude / Wut. Deckkraft = Stärke.',
    pos: 'Positiv',
    neg: 'Negativ',
    portugal: 'Ronaldos letztes WM-Narrativ treibt Begeisterung. Höchste Pos-Rate unter Top-Teams (26,6%).',
    uruguay: 'Nur 5 Artikel, alle skeptisch. Zweifel ob Uruguay in Gruppe H bestehen kann.',
    germany: 'Von -0,261 auf +0,005 nach DFB-Boykott-Lösung. Polarisiertestes Team: 16,7% pos UND 14,6% neg.',
    hosts: 'Mexiko führt die Gastgeber mit +0,131 (Erholung von -0,028). USA verbessert, politischer Drag bleibt.',
    footer: 'Sentiment sagt keine Ergebnisse voraus — es zeigt Druck.',
    nextReport: 'Nächster Bericht: 13. Februar 2026',
    groupLabel: 'GRUPPE',
    avgSent: 'Ø',
    teamsQualified: 'Teams qualifiziert',
    spotsOpen: '6 Plätze via Playoffs',
    wow: 'WoW',
    logScore: 'Impact',
    heatMap: 'Heatmap',
    heatMapSub: 'Sentiment vs. Berichterstattung — Blasengröße = Impact-Score',
  },
  fr: {
    title: 'Sentiment des Équipes',
    subtitle: '42 équipes qualifiées classées par sentiment médias & social',
    period: 'Semaine 5 — 2–6 fév. 2026',
    db: '21 478 articles en base',
    ranked: 'Classement',
    byGroup: 'Par Groupe',
    rank: '#',
    team: 'Équipe',
    sentiment: 'Sentiment',
    articles: 'Art.',
    emotions: 'P / J / C',
    group: 'Gr.',
    mostPositive: 'Le plus positif',
    mostNegative: 'Le plus négatif',
    biggestMover: 'Plus grande progression',
    hostAvg: 'Pays hôtes',
    lowVolume: 'Faible volume',
    noData: 'Pas d\'articles',
    fear: 'Peur',
    joy: 'Joie',
    anger: 'Colère',
    legend: 'Barre = sentiment. Points = Peur / Joie / Colère. Opacité = intensité.',
    pos: 'Positif',
    neg: 'Négatif',
    portugal: 'Le dernier Mondial de Ronaldo génère de l\'enthousiasme. Taux positif le plus élevé (26,6%).',
    uruguay: 'Seulement 5 articles, tous sceptiques. L\'Uruguay peut-il rivaliser dans le Groupe H ?',
    germany: 'De -0,261 à +0,005 après la résolution du boycott. Équipe la plus polarisée.',
    hosts: 'Le Mexique mène les hôtes à +0,131. Les USA s\'améliorent mais le frein politique persiste.',
    footer: 'Le sentiment ne prédit pas les résultats — il révèle la pression.',
    nextReport: 'Prochain rapport : 13 février 2026',
    groupLabel: 'GROUPE',
    avgSent: 'moy',
    teamsQualified: 'équipes qualifiées',
    spotsOpen: '6 places via barrages',
    wow: 'SsS',
    logScore: 'Impact',
    heatMap: 'Carte thermique',
    heatMapSub: 'Sentiment vs. Couverture — taille bulle = score d\'impact',
  },
  pl: {
    title: 'Sentyment Reprezentacji',
    subtitle: '42 zakwalifikowane drużyny w rankingu sentymentu mediów i social media',
    period: 'Tydzień 5 — 2–6 lut. 2026',
    db: '21 478 artykułów w bazie',
    ranked: 'Ranking',
    byGroup: 'Wg Grupy',
    rank: '#',
    team: 'Drużyna',
    sentiment: 'Sentyment',
    articles: 'Art.',
    emotions: 'S / R / Z',
    group: 'Gr.',
    mostPositive: 'Najbardziej pozytywny',
    mostNegative: 'Najbardziej negatywny',
    biggestMover: 'Największy awans',
    hostAvg: 'Gospodarze',
    lowVolume: 'Mało danych',
    noData: 'Brak artykułów',
    fear: 'Strach',
    joy: 'Radość',
    anger: 'Złość',
    legend: 'Pasek = sentyment. Kropki = Strach / Radość / Złość. Przezroczystość = intensywność.',
    pos: 'Pozytywny',
    neg: 'Negatywny',
    portugal: 'Ostatni mundial Ronaldo napędza entuzjazm. Najwyższy % pozytywnych wśród czołowych drużyn (26,6%).',
    uruguay: 'Tylko 5 artykułów, wszystkie sceptyczne. Czy Urugwaj poradzi sobie w Grupie H?',
    germany: 'Z -0,261 do +0,005 po rozwiązaniu bojkotu DFB. Najbardziej spolaryzowana drużyna: 16,7% poz. I 14,6% neg.',
    hosts: 'Meksyk prowadzi wśród gospodarzy z +0,131 (odbicie od -0,028). USA się poprawia, ale hamulec polityczny trwa.',
    footer: 'Sentyment nie przewiduje wyników — ujawnia presję.',
    nextReport: 'Następny raport: 13 lutego 2026',
    groupLabel: 'GRUPA',
    avgSent: 'śr',
    teamsQualified: 'drużyn zakwalifikowanych',
    spotsOpen: '6 miejsc przez baraże',
    wow: 'TnT',
    logScore: 'Impact',
    heatMap: 'Mapa ciepła',
    heatMapSub: 'Sentyment vs. pokrycie medialne — rozmiar = wynik impact',
  },
  es: {
    title: 'Sentimiento por Selección',
    subtitle: '42 selecciones clasificadas por sentimiento en medios y redes sociales',
    period: 'Semana 5 — 2–6 feb. 2026',
    db: '21.478 artículos en la base de datos',
    ranked: 'Ranking',
    byGroup: 'Por Grupo',
    rank: '#',
    team: 'Selección',
    sentiment: 'Sentimiento',
    articles: 'Art.',
    emotions: 'M / A / I',
    group: 'Gr.',
    mostPositive: 'Más positivo',
    mostNegative: 'Más negativo',
    biggestMover: 'Mayor ascenso',
    hostAvg: 'Anfitriones',
    lowVolume: 'Bajo volumen',
    noData: 'Sin artículos',
    fear: 'Miedo',
    joy: 'Alegría',
    anger: 'Ira',
    legend: 'Barra = sentimiento. Puntos = Miedo / Alegría / Ira. Opacidad = intensidad.',
    pos: 'Positivo',
    neg: 'Negativo',
    portugal: 'El último Mundial de Ronaldo genera entusiasmo. Mayor % positivo entre grandes selecciones (26,6%).',
    uruguay: 'Solo 5 artículos, todos escépticos. ¿Puede Uruguay competir en el Grupo H?',
    germany: 'De -0,261 a +0,005 tras la resolución del boicot. Selección más polarizada: 16,7% pos Y 14,6% neg.',
    hosts: 'México lidera los anfitriones con +0,131 (recuperación desde -0,028). EE.UU. mejora pero el lastre político persiste.',
    footer: 'El sentimiento no predice resultados — revela presión.',
    nextReport: 'Próximo informe: 13 de febrero de 2026',
    groupLabel: 'GRUPO',
    avgSent: 'prom',
    teamsQualified: 'selecciones clasificadas',
    spotsOpen: '6 plazas vía repechaje',
    wow: 'SsS',
    logScore: 'Impacto',
    heatMap: 'Mapa de calor',
    heatMapSub: 'Sentimiento vs. cobertura — tamaño burbuja = puntaje de impacto',
  },
  pt: {
    title: 'Sentimento por Seleção',
    subtitle: '42 seleções classificadas por sentimento na mídia e redes sociais',
    period: 'Semana 5 — 2–6 fev. 2026',
    db: '21.478 artigos na base de dados',
    ranked: 'Ranking',
    byGroup: 'Por Grupo',
    rank: '#',
    team: 'Seleção',
    sentiment: 'Sentimento',
    articles: 'Art.',
    emotions: 'M / A / R',
    group: 'Gr.',
    mostPositive: 'Mais positivo',
    mostNegative: 'Mais negativo',
    biggestMover: 'Maior evolução',
    hostAvg: 'Anfitriões',
    lowVolume: 'Baixo volume',
    noData: 'Sem artigos',
    fear: 'Medo',
    joy: 'Alegria',
    anger: 'Raiva',
    legend: 'Barra = sentimento. Pontos = Medo / Alegria / Raiva. Opacidade = intensidade.',
    pos: 'Positivo',
    neg: 'Negativo',
    portugal: 'O último Mundial de Ronaldo gera entusiasmo. Maior % positivo entre grandes seleções (26,6%).',
    uruguay: 'Apenas 5 artigos, todos céticos. O Uruguai consegue competir no Grupo H?',
    germany: 'De -0,261 para +0,005 após resolução do boicote. Seleção mais polarizada: 16,7% pos E 14,6% neg.',
    hosts: 'México lidera anfitriões com +0,131 (recuperação de -0,028). EUA melhoram mas arrasto político persiste.',
    footer: 'Sentimento não prevê resultados — revela pressão.',
    nextReport: 'Próximo relatório: 13 de fevereiro de 2026',
    groupLabel: 'GRUPO',
    avgSent: 'méd',
    teamsQualified: 'seleções classificadas',
    spotsOpen: '6 vagas via repescagem',
    wow: 'SsS',
    logScore: 'Impacto',
    heatMap: 'Mapa de calor',
    heatMapSub: 'Sentimento vs. cobertura — tamanho bolha = pontuação de impacto',
  },
};

// ─── Team Name Translations ────────────────────────────────
const TEAM_NAMES = {
  'Cape Verde':    { de: 'Kap Verde',       fr: 'Cap-Vert',          pl: 'Republika Zielonego Przylądka', es: 'Cabo Verde',        pt: 'Cabo Verde' },
  'Tunisia':       { de: 'Tunesien',         fr: 'Tunisie',           pl: 'Tunezja',          es: 'Túnez',             pt: 'Tunísia' },
  'Portugal':      { de: 'Portugal',         fr: 'Portugal',          pl: 'Portugalia',       es: 'Portugal',          pt: 'Portugal' },
  'Spain':         { de: 'Spanien',          fr: 'Espagne',           pl: 'Hiszpania',        es: 'España',            pt: 'Espanha' },
  'Belgium':       { de: 'Belgien',          fr: 'Belgique',          pl: 'Belgia',           es: 'Bélgica',           pt: 'Bélgica' },
  'Ivory Coast':   { de: 'Elfenbeinküste',   fr: 'Côte d\'Ivoire',    pl: 'Wybrzeże Kości Słoniowej', es: 'Costa de Marfil', pt: 'Costa do Marfim' },
  'Netherlands':   { de: 'Niederlande',      fr: 'Pays-Bas',          pl: 'Holandia',         es: 'Países Bajos',      pt: 'Países Baixos' },
  'Mexico':        { de: 'Mexiko',           fr: 'Mexique',           pl: 'Meksyk',           es: 'México',            pt: 'México' },
  'Senegal':       { de: 'Senegal',          fr: 'Sénégal',           pl: 'Senegal',          es: 'Senegal',           pt: 'Senegal' },
  'Iran':          { de: 'Iran',             fr: 'Iran',              pl: 'Iran',             es: 'Irán',              pt: 'Irã' },
  'Japan':         { de: 'Japan',            fr: 'Japon',             pl: 'Japonia',          es: 'Japón',             pt: 'Japão' },
  'Algeria':       { de: 'Algerien',         fr: 'Algérie',           pl: 'Algieria',         es: 'Argelia',           pt: 'Argélia' },
  'France':        { de: 'Frankreich',       fr: 'France',            pl: 'Francja',          es: 'Francia',           pt: 'França' },
  'Brazil':        { de: 'Brasilien',        fr: 'Brésil',            pl: 'Brazylia',         es: 'Brasil',            pt: 'Brasil' },
  'Norway':        { de: 'Norwegen',         fr: 'Norvège',           pl: 'Norwegia',         es: 'Noruega',           pt: 'Noruega' },
  'Switzerland':   { de: 'Schweiz',          fr: 'Suisse',            pl: 'Szwajcaria',       es: 'Suiza',             pt: 'Suíça' },
  'England':       { de: 'England',          fr: 'Angleterre',        pl: 'Anglia',           es: 'Inglaterra',        pt: 'Inglaterra' },
  'Canada':        { de: 'Kanada',           fr: 'Canada',            pl: 'Kanada',           es: 'Canadá',            pt: 'Canadá' },
  'United States': { de: 'USA',              fr: 'États-Unis',        pl: 'USA',              es: 'Estados Unidos',    pt: 'Estados Unidos' },
  'Argentina':     { de: 'Argentinien',      fr: 'Argentine',         pl: 'Argentyna',        es: 'Argentina',         pt: 'Argentina' },
  'Qatar':         { de: 'Katar',            fr: 'Qatar',             pl: 'Katar',            es: 'Catar',             pt: 'Catar' },
  'Ghana':         { de: 'Ghana',            fr: 'Ghana',             pl: 'Ghana',            es: 'Ghana',             pt: 'Gana' },
  'Austria':       { de: 'Österreich',       fr: 'Autriche',          pl: 'Austria',          es: 'Austria',           pt: 'Áustria' },
  'Germany':       { de: 'Deutschland',      fr: 'Allemagne',         pl: 'Niemcy',           es: 'Alemania',          pt: 'Alemanha' },
  'South Africa':  { de: 'Südafrika',        fr: 'Afrique du Sud',    pl: 'Republika Południowej Afryki', es: 'Sudáfrica', pt: 'África do Sul' },
  'Croatia':       { de: 'Kroatien',         fr: 'Croatie',           pl: 'Chorwacja',        es: 'Croacia',           pt: 'Croácia' },
  'South Korea':   { de: 'Südkorea',         fr: 'Corée du Sud',      pl: 'Korea Południowa', es: 'Corea del Sur',     pt: 'Coreia do Sul' },
  'Australia':     { de: 'Australien',       fr: 'Australie',         pl: 'Australia',        es: 'Australia',         pt: 'Austrália' },
  'New Zealand':   { de: 'Neuseeland',       fr: 'Nouvelle-Zélande',  pl: 'Nowa Zelandia',    es: 'Nueva Zelanda',     pt: 'Nova Zelândia' },
  'Panama':        { de: 'Panama',           fr: 'Panama',            pl: 'Panama',           es: 'Panamá',            pt: 'Panamá' },
  'Paraguay':      { de: 'Paraguay',         fr: 'Paraguay',          pl: 'Paragwaj',         es: 'Paraguay',          pt: 'Paraguai' },
  'Morocco':       { de: 'Marokko',          fr: 'Maroc',             pl: 'Maroko',           es: 'Marruecos',         pt: 'Marrocos' },
  'Egypt':         { de: 'Ägypten',          fr: 'Égypte',            pl: 'Egipt',            es: 'Egipto',            pt: 'Egito' },
  'Colombia':      { de: 'Kolumbien',        fr: 'Colombie',          pl: 'Kolumbia',         es: 'Colombia',          pt: 'Colômbia' },
  'Saudi Arabia':  { de: 'Saudi-Arabien',    fr: 'Arabie saoudite',   pl: 'Arabia Saudyjska', es: 'Arabia Saudita',    pt: 'Arábia Saudita' },
  'Ecuador':       { de: 'Ecuador',          fr: 'Équateur',          pl: 'Ekwador',          es: 'Ecuador',           pt: 'Equador' },
  'Jordan':        { de: 'Jordanien',        fr: 'Jordanie',          pl: 'Jordania',         es: 'Jordania',          pt: 'Jordânia' },
  'Scotland':      { de: 'Schottland',       fr: 'Écosse',            pl: 'Szkocja',          es: 'Escocia',           pt: 'Escócia' },
  'Haiti':         { de: 'Haiti',            fr: 'Haïti',             pl: 'Haiti',            es: 'Haití',             pt: 'Haiti' },
  'Uruguay':       { de: 'Uruguay',          fr: 'Uruguay',           pl: 'Urugwaj',          es: 'Uruguay',           pt: 'Uruguai' },
  'Curaçao':       { de: 'Curaçao',          fr: 'Curaçao',           pl: 'Curaçao',          es: 'Curazao',           pt: 'Curaçau' },
  'Uzbekistan':    { de: 'Usbekistan',       fr: 'Ouzbékistan',       pl: 'Uzbekistan',       es: 'Uzbekistán',        pt: 'Uzbequistão' },
};
const teamName = (name, lang) => (lang === 'en' ? name : TEAM_NAMES[name]?.[lang]) || name;

// ─── Complete Team Data (42 teams) ──────────────────────────
const TEAMS = [
  { rank: 1,  flag: '🇨🇻', name: 'Cape Verde',    group: 'H', articles: 1,   sentiment: 0.874,  prev: null,   posPct: 100,  negPct: 0,    fear: 0.642, joy: 0.202, anger: 0.046, lowVol: true, debut: true },
  { rank: 2,  flag: '🇹🇳', name: 'Tunisia',       group: 'F', articles: 5,   sentiment: 0.339,  prev: 0.472,  posPct: 40,   negPct: 0,    fear: 0.576, joy: 0.242, anger: 0.098, lowVol: true },
  { rank: 3,  flag: '🇵🇹', name: 'Portugal',      group: 'K', articles: 64,  sentiment: 0.219,  prev: 0.276,  posPct: 26.6, negPct: 3.1,  fear: 0.589, joy: 0.115, anger: 0.097 },
  { rank: 4,  flag: '🇪🇸', name: 'Spain',         group: 'H', articles: 84,  sentiment: 0.154,  prev: 0.113,  posPct: 19,   negPct: 3.6,  fear: 0.536, joy: 0.104, anger: 0.100 },
  { rank: 5,  flag: '🇧🇪', name: 'Belgium',       group: 'G', articles: 16,  sentiment: 0.148,  prev: 0.231,  posPct: 18.8, negPct: 6.3,  fear: 0.446, joy: 0.141, anger: 0.122 },
  { rank: 6,  flag: '🇨🇮', name: 'Ivory Coast',   group: 'E', articles: 9,   sentiment: 0.146,  prev: 0.172,  posPct: 22.2, negPct: 0,    fear: 0.187, joy: 0.065, anger: 0.188 },
  { rank: 7,  flag: '🇳🇱', name: 'Netherlands',   group: 'F', articles: 18,  sentiment: 0.139,  prev: 0.037,  posPct: 22.2, negPct: 5.6,  fear: 0.238, joy: 0.164, anger: 0.106 },
  { rank: 8,  flag: '🇲🇽', name: 'Mexico',        group: 'A', articles: 89,  sentiment: 0.131,  prev: -0.028, posPct: 22.5, negPct: 4.5,  fear: 0.265, joy: 0.101, anger: 0.092, host: true },
  { rank: 9,  flag: '🇸🇳', name: 'Senegal',       group: 'I', articles: 6,   sentiment: 0.130,  prev: -0.140, posPct: 16.7, negPct: 0,    fear: 0.083, joy: 0.088, anger: 0.025 },
  { rank: 10, flag: '🇮🇷', name: 'Iran',          group: 'G', articles: 6,   sentiment: 0.129,  prev: -0.146, posPct: 16.7, negPct: 0,    fear: 0.059, joy: 0.074, anger: 0.139 },
  { rank: 11, flag: '🇯🇵', name: 'Japan',         group: 'F', articles: 9,   sentiment: 0.128,  prev: 0.244,  posPct: 11.1, negPct: 0,    fear: 0.383, joy: 0.102, anger: 0.063 },
  { rank: 12, flag: '🇩🇿', name: 'Algeria',       group: 'J', articles: 6,   sentiment: 0.110,  prev: -0.008, posPct: 16.7, negPct: 0,    fear: 0.010, joy: 0.051, anger: 0.024 },
  { rank: 13, flag: '🇫🇷', name: 'France',        group: 'I', articles: 83,  sentiment: 0.102,  prev: 0.059,  posPct: 20.5, negPct: 8.4,  fear: 0.563, joy: 0.121, anger: 0.110 },
  { rank: 14, flag: '🇧🇷', name: 'Brazil',        group: 'C', articles: 90,  sentiment: 0.099,  prev: 0.076,  posPct: 16.7, negPct: 6.7,  fear: 0.318, joy: 0.162, anger: 0.079 },
  { rank: 15, flag: '🇳🇴', name: 'Norway',        group: 'I', articles: 4,   sentiment: 0.085,  prev: 0.425,  posPct: 0,    negPct: 0,    fear: 0.235, joy: 0.060, anger: 0.020, lowVol: true },
  { rank: 16, flag: '🇨🇭', name: 'Switzerland',   group: 'B', articles: 16,  sentiment: 0.082,  prev: 0.158,  posPct: 6.3,  negPct: 0,    fear: 0.128, joy: 0.235, anger: 0.082 },
  { rank: 17, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England',      group: 'L', articles: 77,  sentiment: 0.077,  prev: -0.066, posPct: 14.3, negPct: 3.9,  fear: 0.195, joy: 0.113, anger: 0.058 },
  { rank: 18, flag: '🇨🇦', name: 'Canada',        group: 'B', articles: 92,  sentiment: 0.071,  prev: 0.120,  posPct: 19.6, negPct: 9.8,  fear: 0.208, joy: 0.101, anger: 0.054, host: true },
  { rank: 19, flag: '🇺🇸', name: 'United States', group: 'D', articles: 108, sentiment: 0.054,  prev: -0.131, posPct: 13.9, negPct: 7.4,  fear: 0.272, joy: 0.078, anger: 0.070, host: true },
  { rank: 20, flag: '🇦🇷', name: 'Argentina',     group: 'J', articles: 61,  sentiment: 0.033,  prev: 0.149,  posPct: 8.2,  negPct: 3.3,  fear: 0.239, joy: 0.077, anger: 0.079, champion: true },
  { rank: 21, flag: '🇶🇦', name: 'Qatar',         group: 'B', articles: 32,  sentiment: 0.032,  prev: 0.167,  posPct: 15.6, negPct: 9.4,  fear: 0.114, joy: 0.065, anger: 0.115 },
  { rank: 22, flag: '🇬🇭', name: 'Ghana',         group: 'L', articles: 60,  sentiment: 0.021,  prev: -0.018, posPct: 3.3,  negPct: 0,    fear: 0.063, joy: 0.067, anger: 0.032 },
  { rank: 23, flag: '🇦🇹', name: 'Austria',       group: 'J', articles: 6,   sentiment: 0.006,  prev: 0.116,  posPct: 0,    negPct: 0,    fear: 0.155, joy: 0.163, anger: 0.042 },
  { rank: 24, flag: '🇩🇪', name: 'Germany',       group: 'E', articles: 48,  sentiment: 0.005,  prev: -0.261, posPct: 16.7, negPct: 14.6, fear: 0.424, joy: 0.139, anger: 0.102 },
  { rank: 25, flag: '🇿🇦', name: 'South Africa',  group: 'A', articles: 18,  sentiment: 0.005,  prev: -0.068, posPct: 0,    negPct: 0,    fear: 0.175, joy: 0.059, anger: 0.044 },
  { rank: 26, flag: '🇭🇷', name: 'Croatia',       group: 'L', articles: 18,  sentiment: 0.004,  prev: 0.313,  posPct: 5.6,  negPct: 5.6,  fear: 0.373, joy: 0.112, anger: 0.136 },
  { rank: 27, flag: '🇰🇷', name: 'South Korea',   group: 'A', articles: 10,  sentiment: 0.000,  prev: 0.041,  posPct: 0,    negPct: 0,    fear: 0.370, joy: 0.067, anger: 0.055 },
  { rank: 28, flag: '🇦🇺', name: 'Australia',     group: 'D', articles: 25,  sentiment: 0.000,  prev: 0.020,  posPct: 4,    negPct: 4,    fear: 0.102, joy: 0.120, anger: 0.070 },
  { rank: 29, flag: '🇳🇿', name: 'New Zealand',   group: 'G', articles: 1,   sentiment: 0.000,  prev: -0.021, posPct: 0,    negPct: 0,    fear: 0.010, joy: 0.082, anger: 0.017, lowVol: true },
  { rank: 30, flag: '🇵🇦', name: 'Panama',        group: 'L', articles: 4,   sentiment: 0.000,  prev: -0.043, posPct: 0,    negPct: 0,    fear: 0.021, joy: 0.035, anger: 0.021, lowVol: true },
  { rank: 31, flag: '🇵🇾', name: 'Paraguay',      group: 'D', articles: 3,   sentiment: -0.003, prev: -0.313, posPct: 0,    negPct: 0,    fear: 0.048, joy: 0.082, anger: 0.026, lowVol: true },
  { rank: 32, flag: '🇲🇦', name: 'Morocco',       group: 'C', articles: 39,  sentiment: -0.004, prev: -0.122, posPct: 5.1,  negPct: 5.1,  fear: 0.208, joy: 0.083, anger: 0.110 },
  { rank: 33, flag: '🇪🇬', name: 'Egypt',         group: 'G', articles: 10,  sentiment: -0.006, prev: -0.045, posPct: 0,    negPct: 0,    fear: 0.120, joy: 0.046, anger: 0.072 },
  { rank: 34, flag: '🇨🇴', name: 'Colombia',      group: 'K', articles: 5,   sentiment: -0.013, prev: -0.052, posPct: 0,    negPct: 0,    fear: 0.095, joy: 0.063, anger: 0.030 },
  { rank: 35, flag: '🇸🇦', name: 'Saudi Arabia',  group: 'H', articles: 34,  sentiment: -0.014, prev: 0.211,  posPct: 2.9,  negPct: 5.9,  fear: 0.216, joy: 0.058, anger: 0.069 },
  { rank: 36, flag: '🇪🇨', name: 'Ecuador',       group: 'E', articles: 6,   sentiment: -0.017, prev: -0.055, posPct: 0,    negPct: 0,    fear: 0.052, joy: 0.056, anger: 0.114 },
  { rank: 37, flag: '🇯🇴', name: 'Jordan',        group: 'J', articles: 2,   sentiment: -0.020, prev: 0.011,  posPct: 0,    negPct: 0,    fear: 0.381, joy: 0.024, anger: 0.052, lowVol: true, debut: true },
  { rank: 38, flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Scotland',     group: 'C', articles: 45,  sentiment: -0.034, prev: 0.034,  posPct: 8.9,  negPct: 13.3, fear: 0.165, joy: 0.109, anger: 0.125 },
  { rank: 39, flag: '🇭🇹', name: 'Haiti',         group: 'C', articles: 6,   sentiment: -0.091, prev: -0.021, posPct: 0,    negPct: 16.7, fear: 0.038, joy: 0.034, anger: 0.058 },
  { rank: 40, flag: '🇺🇾', name: 'Uruguay',       group: 'H', articles: 5,   sentiment: -0.214, prev: 0.200,  posPct: 0,    negPct: 20,   fear: 0.024, joy: 0.024, anger: 0.188, lowVol: true },
  { rank: 41, flag: '🇨🇼', name: 'Curaçao',       group: 'E', articles: 0,   sentiment: null,   prev: null,   posPct: null, negPct: null,  fear: null,  joy: null,  anger: null, debut: true },
  { rank: 42, flag: '🇺🇿', name: 'Uzbekistan',    group: 'K', articles: 0,   sentiment: null,   prev: null,   posPct: null, negPct: null,  fear: null,  joy: null,  anger: null, debut: true },
];

// Group overview (avg sentiment)
const GROUP_DATA = {
  A: { teams: ['Mexico', 'South Korea', 'South Africa'], avg: 0.045 },
  B: { teams: ['Switzerland', 'Canada', 'Qatar'], avg: 0.062 },
  C: { teams: ['Brazil', 'Morocco', 'Scotland', 'Haiti'], avg: -0.008 },
  D: { teams: ['United States', 'Australia', 'Paraguay'], avg: 0.017 },
  E: { teams: ['Ivory Coast', 'Germany', 'Ecuador', 'Curaçao'], avg: 0.045 },
  F: { teams: ['Tunisia', 'Netherlands', 'Japan'], avg: 0.202 },
  G: { teams: ['Belgium', 'Iran', 'New Zealand', 'Egypt'], avg: 0.068 },
  H: { teams: ['Cape Verde', 'Spain', 'Saudi Arabia', 'Uruguay'], avg: 0.200 },
  I: { teams: ['Senegal', 'France', 'Norway'], avg: 0.106 },
  J: { teams: ['Algeria', 'Argentina', 'Austria', 'Jordan'], avg: 0.032 },
  K: { teams: ['Portugal', 'Colombia', 'Uzbekistan'], avg: 0.103 },
  L: { teams: ['England', 'Ghana', 'Croatia', 'Panama'], avg: 0.026 },
};

// ─── CSS Animations ─────────────────────────────────────────
const CSS = `
@keyframes tsFadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes tsBarGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes tsPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.08); }
  50% { box-shadow: 0 0 30px rgba(6, 182, 212, 0.2); }
}
@keyframes tsNumberIn {
  from { opacity: 0; filter: blur(3px); }
  to { opacity: 1; filter: blur(0); }
}
.ts-fade { animation: tsFadeUp 0.4s ease-out both; }
.ts-bar { animation: tsBarGrow 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
.ts-num { animation: tsNumberIn 0.5s ease-out both; }
.ts-row { transition: background 0.15s ease; }
.ts-row:hover { background: rgba(255,255,255,0.04) !important; }
`;

// ─── Helpers ────────────────────────────────────────────────
const sColor = (v) => v > 0.03 ? '#10b981' : v < -0.03 ? '#ef4444' : '#f59e0b';
const fmt = (v) => v === null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(3);
const BAR_MAX = 0.25; // clamp bar scale
const logScore = (tm) => tm.sentiment === null ? null : tm.sentiment * Math.log2(1 + tm.articles);

// ─── Highlight Card ─────────────────────────────────────────
function HighlightCard({ title, flag, name, value, note, accent, delay }) {
  return (
    <div className="ts-fade" style={{
      background: `linear-gradient(135deg, ${accent}12, ${accent}06)`,
      border: `1px solid ${accent}25`,
      borderRadius: '14px',
      padding: '16px',
      animationDelay: `${delay}s`,
      minWidth: 0,
    }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '22px' }}>{flag}</span>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#e2e8f0' }}>{name}</span>
        <span className="ts-num" style={{ fontSize: '18px', fontWeight: '800', color: accent, fontFamily: 'system-ui', marginLeft: 'auto', animationDelay: `${delay + 0.2}s` }}>
          {value}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>{note}</div>
    </div>
  );
}

// ─── Diverging Bar ──────────────────────────────────────────
function DivergingBar({ sentiment, delay }) {
  if (sentiment === null) return <div style={{ height: '10px' }} />;
  const pct = Math.min(Math.abs(sentiment) / BAR_MAX, 1) * 48;
  const isPos = sentiment >= 0;

  return (
    <div style={{ position: 'relative', height: '10px', width: '100%' }}>
      {/* Center line */}
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.12)' }} />
      {/* Bar */}
      <div className="ts-bar" style={{
        position: 'absolute',
        top: '1px',
        bottom: '1px',
        [isPos ? 'left' : 'right']: '50%',
        width: `${pct}%`,
        background: isPos
          ? 'linear-gradient(90deg, #10b981, #34d399)'
          : 'linear-gradient(270deg, #ef4444, #f87171)',
        borderRadius: isPos ? '0 4px 4px 0' : '4px 0 0 4px',
        transformOrigin: isPos ? 'left' : 'right',
        animationDelay: `${delay}s`,
        boxShadow: isPos ? '0 0 8px rgba(16,185,129,0.25)' : '0 0 8px rgba(239,68,68,0.25)',
      }} />
    </div>
  );
}

// ─── Emotion Dots ───────────────────────────────────────────
function EmotionDots({ fear, joy, anger }) {
  if (fear === null) return <span style={{ color: '#334155', fontSize: '11px' }}>—</span>;
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      <div title={`Fear: ${fear.toFixed(2)}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', opacity: Math.max(fear * 1.5, 0.1), transition: 'opacity 0.3s' }} />
      <div title={`Joy: ${joy.toFixed(2)}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', opacity: Math.max(joy * 2.5, 0.1), transition: 'opacity 0.3s' }} />
      <div title={`Anger: ${anger.toFixed(2)}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', opacity: Math.max(anger * 3, 0.1), transition: 'opacity 0.3s' }} />
    </div>
  );
}

// ─── WoW Arrow ──────────────────────────────────────────────
function WowArrow({ sentiment, prev }) {
  if (prev === null || sentiment === null) return null;
  const diff = sentiment - prev;
  if (Math.abs(diff) < 0.005) return <span style={{ color: '#475569', fontSize: '10px' }}>→</span>;
  const up = diff > 0;
  const big = Math.abs(diff) > 0.1;
  return (
    <span style={{ fontSize: big ? '11px' : '10px', fontWeight: big ? '700' : '500', color: up ? '#10b981' : '#ef4444' }}>
      {up ? '↑' : '↓'}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function SentimentReportSection({ language = 'de' }) {
  const [view, setView] = useState('ranked');
  const [sortBy, setSortBy] = useState('rank');
  const [sortDir, setSortDir] = useState('asc');
  const [hoveredTeam, setHoveredTeam] = useState(null);

  const lang = L[language] ? language : 'en';
  const t = (k) => L[lang]?.[k] || L.en[k] || k;

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir(col === 'rank' || col === 'team' || col === 'group' ? 'asc' : 'desc');
    }
  };

  const sortedTeams = [...TEAMS].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'rank': return (a.rank - b.rank) * dir;
      case 'team': return teamName(a.name, lang).localeCompare(teamName(b.name, lang)) * dir;
      case 'group': return (a.group.localeCompare(b.group) || a.rank - b.rank) * dir;
      case 'sentiment': return ((a.sentiment ?? -999) - (b.sentiment ?? -999)) * dir;
      case 'articles': return ((a.articles || 0) - (b.articles || 0)) * dir;
      case 'logScore': return ((logScore(a) ?? -999) - (logScore(b) ?? -999)) * dir;
      case 'wow': {
        const aDiff = (a.prev !== null && a.sentiment !== null) ? a.sentiment - a.prev : -999;
        const bDiff = (b.prev !== null && b.sentiment !== null) ? b.sentiment - b.prev : -999;
        return (aDiff - bDiff) * dir;
      }
      default: return 0;
    }
  });

  const teamsByGroup = {};
  TEAMS.forEach(tm => {
    if (!teamsByGroup[tm.group]) teamsByGroup[tm.group] = [];
    teamsByGroup[tm.group].push(tm);
  });

  const card = {
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
  };

  return (
    <div style={{ padding: '16px 0', marginTop: '16px' }}>
      <style>{CSS}</style>

      {/* ═══ HEADER ═══ */}
      <div className="ts-fade" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#06b6d4', marginBottom: '6px' }}>
          {t('period')}
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 6px', lineHeight: '1.2' }}>
          {t('title')}
        </h2>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          {t('subtitle')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
          <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>42 {t('teamsQualified')}</span>
          <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>{t('spotsOpen')}</span>
        </div>
      </div>

      {/* ═══ HIGHLIGHTS ═══ */}
      <div className="ts-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px', animationDelay: '0.05s' }}>
        <HighlightCard title={t('mostPositive')} flag="🇵🇹" name={teamName('Portugal', lang)} value="+0.219" note={t('portugal')} accent="#10b981" delay={0.1} />
        <HighlightCard title={t('biggestMover')} flag="🇩🇪" name={teamName('Germany', lang)} value="+0.266" note={t('germany')} accent="#06b6d4" delay={0.15} />
        <HighlightCard title={t('mostNegative')} flag="🇺🇾" name={teamName('Uruguay', lang)} value="-0.214" note={t('uruguay')} accent="#ef4444" delay={0.2} />
        <HighlightCard title={t('hostAvg')} flag="🇲🇽🇨🇦🇺🇸" name="+0.085 avg" value="" note={t('hosts')} accent="#f59e0b" delay={0.25} />
      </div>

      {/* ═══ VIEW TOGGLE ═══ */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px' }}>
        {['ranked', 'groups', 'heatmap'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            background: view === v ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: view === v ? '#06b6d4' : '#64748b',
            transition: 'all 0.2s',
          }}>
            {v === 'ranked' ? t('ranked') : v === 'groups' ? t('byGroup') : t('heatMap')}
          </button>
        ))}
      </div>

      {/* ═══ RANKED LEADERBOARD ═══ */}
      {view === 'ranked' && (
        <div className="ts-fade" style={{ ...card }}>
          {/* Table header */}
          {(() => {
            const hdr = (col, label, align) => {
              const active = sortBy === col;
              return (
                <span
                  onClick={() => toggleSort(col)}
                  style={{ textAlign: align || 'left', cursor: 'pointer', color: active ? '#06b6d4' : '#475569', transition: 'color 0.15s', userSelect: 'none' }}
                >
                  {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </span>
              );
            };
            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 44px minmax(80px, 160px) 58px 36px 52px 24px',
                gap: '6px',
                alignItems: 'center',
                padding: '0 4px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                fontSize: '10px',
                fontWeight: '700',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {hdr('rank', t('rank'))}
                {hdr('team', t('team'))}
                {hdr('group', t('group'), 'center')}
                <span style={{ textAlign: 'center', color: sortBy === 'sentiment' ? '#06b6d4' : '#475569', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('sentiment')}>
                  {t('sentiment')}{sortBy === 'sentiment' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </span>
                <span onClick={() => toggleSort('logScore')} style={{ textAlign: 'right', cursor: 'pointer', color: sortBy === 'logScore' ? '#06b6d4' : '#475569', userSelect: 'none' }} title={t('logScore')}>⚡{sortBy === 'logScore' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                {hdr('articles', t('articles'), 'right')}
                <span style={{ textAlign: 'center' }}>{t('emotions')}</span>
                {hdr('wow', t('wow'), 'center')}
              </div>
            );
          })()}

          {/* Team rows */}
          {sortedTeams.map((tm, i) => {
            const isHost = tm.host;
            const isChamp = tm.champion;
            const isDebut = tm.debut;
            const noData = tm.sentiment === null;

            return (
              <div key={i} className="ts-row" style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 44px minmax(80px, 160px) 58px 36px 52px 24px',
                gap: '6px',
                alignItems: 'center',
                padding: '7px 4px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                borderRadius: '6px',
                opacity: noData ? 0.4 : tm.lowVol ? 0.7 : 1,
              }}>
                {/* Rank */}
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textAlign: 'center' }}>{tm.rank}</span>

                {/* Flag + Name + Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{tm.flag}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {teamName(tm.name, lang)}
                  </span>
                  {isHost && <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 4px', borderRadius: '3px', fontWeight: '700', flexShrink: 0 }}>HOST</span>}
                  {isChamp && <span style={{ fontSize: '10px', flexShrink: 0 }}>🏆</span>}
                  {isDebut && <span style={{ fontSize: '9px', background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '1px 4px', borderRadius: '3px', fontWeight: '700', flexShrink: 0 }}>NEW</span>}
                </div>

                {/* Group */}
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#06b6d4', textAlign: 'center', background: 'rgba(6,182,212,0.08)', borderRadius: '4px', padding: '2px 0' }}>
                  {tm.group}
                </span>

                {/* Diverging bar */}
                <DivergingBar sentiment={tm.sentiment} delay={0.15 + i * 0.02} />

                {/* Score + LogScore */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: noData ? '#334155' : sColor(tm.sentiment), fontFamily: 'system-ui' }}>
                    {fmt(tm.sentiment)}
                  </div>
                  {logScore(tm) !== null && <div style={{ fontSize: '9px', color: '#06b6d4', fontWeight: '600', fontFamily: 'system-ui' }}>⚡{logScore(tm).toFixed(1)}</div>}
                </div>

                {/* Articles */}
                <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                  {tm.articles || '—'}
                </span>

                {/* Emotion dots */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <EmotionDots fear={tm.fear} joy={tm.joy} anger={tm.anger} />
                </div>

                {/* WoW */}
                <div style={{ textAlign: 'center' }}>
                  <WowArrow sentiment={tm.sentiment} prev={tm.prev} />
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '16px', height: '4px', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '2px' }} />
              <span>{t('pos')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '16px', height: '4px', background: 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: '2px' }} />
              <span>{t('neg')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', opacity: 0.7 }} />
              <span>{t('fear')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', opacity: 0.7 }} />
              <span>{t('joy')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
              <span>{t('anger')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ GROUP VIEW ═══ */}
      {view === 'groups' && (
        <div className="ts-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '10px' }}>
          {Object.entries(GROUP_DATA).map(([group, data]) => {
            const groupTeams = teamsByGroup[group] || [];
            return (
              <div key={group} style={{
                ...card, padding: '14px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
              }}>
                {/* Group header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid rgba(6, 182, 212, 0.25)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#06b6d4', letterSpacing: '1px' }}>
                    {t('groupLabel')} {group}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: data.avg >= 0 ? '#10b981' : '#ef4444' }}>
                    {t('avgSent')} {data.avg >= 0 ? '+' : ''}{data.avg.toFixed(3)}
                  </span>
                </div>

                {/* Teams */}
                {groupTeams.map((tm, i) => {
                  const hasScore = tm.sentiment !== null;
                  const barW = hasScore ? Math.min(Math.abs(tm.sentiment) / BAR_MAX * 100, 100) : 0;
                  const isPos = hasScore && tm.sentiment >= 0;

                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '5px 0',
                      borderBottom: i < groupTeams.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    }}>
                      <span style={{ fontSize: '15px', flexShrink: 0 }}>{tm.flag}</span>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: '500', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {teamName(tm.name, lang)}
                        {tm.host ? ' 🏠' : tm.debut ? ' 🆕' : tm.champion ? ' 🏆' : ''}
                      </span>
                      {/* Mini bar */}
                      {hasScore && (
                        <div style={{ width: '24px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: isPos ? '#10b981' : '#ef4444', borderRadius: '2px' }} />
                        </div>
                      )}
                      <span style={{
                        fontSize: '11px', fontWeight: '700', flexShrink: 0, width: '44px', textAlign: 'right',
                        color: !hasScore ? '#334155' : isPos ? '#10b981' : '#ef4444',
                        fontFamily: 'system-ui',
                      }}>
                        {fmt(tm.sentiment)}
                      </span>
                    </div>
                  );
                })}

                {/* TBD slot if group has only 3 */}
                {groupTeams.length < 4 && (
                  <div style={{ padding: '5px 0', fontSize: '11px', color: '#334155', fontStyle: 'italic' }}>
                    TBD (playoff)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ HEAT MAP ═══ */}
      {view === 'heatmap' && (() => {
        const valid = TEAMS.filter(tm => tm.sentiment !== null && tm.articles > 0);
        const ml = 52, mr = 25, mt = 28, mb = 50;
        const W = 680, H = 400;
        const pw = W - ml - mr, ph = H - mt - mb;
        const sMin = -0.28, sMax = 0.92;
        const aMax = 115;
        const xS = (s) => ml + ((s - sMin) / (sMax - sMin)) * pw;
        const yS = (a) => mt + ph - (a / aMax) * ph;
        const x0 = xS(0);

        return (
          <div className="ts-fade" style={{ ...card }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', textAlign: 'center' }}>
              {t('heatMapSub')}
            </div>
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '460px', height: 'auto', display: 'block' }}>
                <defs>
                  <filter id="tsGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>

                {/* Quadrant fills */}
                <rect x={x0} y={mt} width={ml + pw - x0 + mr} height={ph * 0.55} fill="rgba(16,185,129,0.04)" rx="4" />
                <rect x={ml} y={mt} width={x0 - ml} height={ph * 0.55} fill="rgba(239,68,68,0.04)" rx="4" />

                {/* Quadrant labels */}
                <text x={x0 + 8} y={mt + 15} fill="rgba(16,185,129,0.25)" fontSize="9" fontWeight="700" style={{ textTransform: 'uppercase' }}>Positive + High Coverage</text>
                <text x={ml + 4} y={mt + 15} fill="rgba(239,68,68,0.25)" fontSize="9" fontWeight="700" style={{ textTransform: 'uppercase' }}>Negative + High Coverage</text>
                <text x={x0 + 8} y={mt + ph - 8} fill="rgba(16,185,129,0.18)" fontSize="8" fontWeight="600">Hidden Gems</text>
                <text x={ml + 4} y={mt + ph - 8} fill="rgba(239,68,68,0.18)" fontSize="8" fontWeight="600">Off Radar</text>

                {/* Zero line */}
                <line x1={x0} y1={mt} x2={x0} y2={mt + ph} stroke="rgba(255,255,255,0.12)" strokeDasharray="5,4" />

                {/* Grid */}
                {[20, 40, 60, 80, 100].map(v => (
                  <line key={`h${v}`} x1={ml} y1={yS(v)} x2={ml + pw} y2={yS(v)} stroke="rgba(255,255,255,0.04)" />
                ))}
                {[-0.2, -0.1, 0.1, 0.2, 0.3, 0.5, 0.8].map(v => (
                  <line key={`v${v}`} x1={xS(v)} y1={mt} x2={xS(v)} y2={mt + ph} stroke="rgba(255,255,255,0.04)" />
                ))}

                {/* Axes */}
                <line x1={ml} y1={mt + ph} x2={ml + pw} y2={mt + ph} stroke="rgba(255,255,255,0.1)" />
                <line x1={ml} y1={mt} x2={ml} y2={mt + ph} stroke="rgba(255,255,255,0.1)" />

                {/* X ticks */}
                {[-0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.5, 0.8].map(v => (
                  <text key={`xt${v}`} x={xS(v)} y={mt + ph + 16} fill="#475569" fontSize="9" textAnchor="middle" fontFamily="system-ui">
                    {v >= 0 ? '+' : ''}{v.toFixed(1)}
                  </text>
                ))}
                <text x={ml + pw / 2} y={H - 4} fill="#64748b" fontSize="11" textAnchor="middle" fontWeight="600">{t('sentiment')}</text>

                {/* Y ticks */}
                {[0, 20, 40, 60, 80, 100].map(v => (
                  <text key={`yt${v}`} x={ml - 6} y={yS(v) + 3} fill="#475569" fontSize="9" textAnchor="end" fontFamily="system-ui">{v}</text>
                ))}
                <text x={14} y={mt + ph / 2} fill="#64748b" fontSize="11" textAnchor="middle" fontWeight="600" transform={`rotate(-90, 14, ${mt + ph / 2})`}>{t('articles')}</text>

                {/* Bubbles */}
                {valid.map((tm, i) => {
                  const ls = logScore(tm);
                  const cx = xS(tm.sentiment);
                  const cy = yS(tm.articles);
                  const r = 5 + Math.min(Math.abs(ls) * 8, 13);
                  const col = sColor(tm.sentiment);
                  const hov = hoveredTeam === tm.name;
                  const flipTip = cx > W - 180;

                  return (
                    <g key={i} onMouseEnter={() => setHoveredTeam(tm.name)} onMouseLeave={() => setHoveredTeam(null)} onTouchStart={(e) => { e.preventDefault(); setHoveredTeam(hov ? null : tm.name); }} style={{ cursor: 'pointer' }}>
                      <circle cx={cx} cy={cy} r={r} fill={col} opacity={hov ? 0.9 : 0.3} filter={hov ? 'url(#tsGlow)' : undefined} style={{ transition: 'all 0.2s' }} />
                      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={hov ? '15' : '12'} style={{ transition: 'font-size 0.2s', pointerEvents: 'none' }}>{tm.flag}</text>
                      {hov && (
                        <g>
                          <rect x={flipTip ? cx - r - 152 : cx + r + 6} y={cy - 32} width={146} height={58} rx="6" fill="rgba(15,23,42,0.95)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                          <text x={flipTip ? cx - r - 144 : cx + r + 14} y={cy - 15} fill="#e2e8f0" fontSize="11" fontWeight="700">{teamName(tm.name, lang)}</text>
                          <text x={flipTip ? cx - r - 144 : cx + r + 14} y={cy} fill="#94a3b8" fontSize="9">{t('sentiment')}: {fmt(tm.sentiment)} · {t('articles')}: {tm.articles}</text>
                          <text x={flipTip ? cx - r - 144 : cx + r + 14} y={cy + 15} fill="#06b6d4" fontSize="9" fontWeight="600">⚡ {t('logScore')}: {ls.toFixed(2)}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        );
      })()}

      {/* ═══ FOOTER ═══ */}
      <div className="ts-fade" style={{ textAlign: 'center', padding: '20px 0 4px', animationDelay: '0.4s' }}>
        <div style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', marginBottom: '4px' }}>
          {t('footer')}
        </div>
        <div style={{ fontSize: '11px', color: '#334155' }}>
          wm26.live &middot; {t('nextReport')}
        </div>
      </div>
    </div>
  );
}
