import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ============================================
// LIVE DATA - Fallback when DB unavailable
// ============================================
const FALLBACK_DATA = {
  timestamp: '2025-12-31T12:00:00.000Z',
  score: 51,
  positive: 183,
  neutral: 1287,
  negative: 225,
  total: 1695,
  countries: 51,
  languages: 9,
  
  news: { score: 52, count: 1200 },
  social: { score: 45, count: 495 },
  
  categories: [
    { key: 'general', emoji: '📰', name: { de: 'Allgemein', en: 'General', pl: 'Ogólne' }, score: 52, count: 351 },
    { key: 'sporting', emoji: '⚽', name: { de: 'Sport', en: 'Sporting', pl: 'Sport' }, score: 51, count: 347 },
    { key: 'ticketing', emoji: '🎫', name: { de: 'Tickets', en: 'Ticketing', pl: 'Bilety' }, score: 55, count: 176 },
    { key: 'business', emoji: '💰', name: { de: 'Business', en: 'Business', pl: 'Biznes' }, score: 52, count: 159 },
    { key: 'fans', emoji: '🎉', name: { de: 'Fan-Erlebnis', en: 'Fan Experience', pl: 'Doświadczenie kibiców' }, score: 50, count: 122 },
    { key: 'infrastructure', emoji: '🏗️', name: { de: 'Infrastruktur', en: 'Infrastructure', pl: 'Infrastruktura' }, score: 53, count: 60 },
    { key: 'political', emoji: '🌡️', name: { de: 'Politik/Soziales', en: 'Political/Social', pl: 'Polityka/Społeczeństwo' }, score: 42, count: 40 },
  ],
  
  subCategories: {
    sporting: [
      { name: { de: 'Auslosungs-Reaktionen', en: 'Draw Reactions', pl: 'Reakcje na losowanie' }, score: 53, count: 126 },
      { name: { de: 'Team-Form', en: 'Team Form Analysis', pl: 'Forma drużyn' }, score: 44, count: 53 },
      { name: { de: 'Quali-Updates', en: 'Qualification Updates', pl: 'Aktual. kwalifikacji' }, score: 53, count: 33 },
      { name: { de: 'Prognosen', en: 'Predictions', pl: 'Prognozy' }, score: 52, count: 22 },
    ],
    ticketing: [
      { name: { de: 'Verfügbarkeit', en: 'Availability', pl: 'Dostępność' }, score: 59, count: 73 },
      { name: { de: 'Preiszufriedenheit', en: 'Price Satisfaction', pl: 'Zadowolenie z cen' }, score: 40, count: 26 },
      { name: { de: 'Buchungsprozess', en: 'Booking Process', pl: 'Proces rezerwacji' }, score: 50, count: 5 },
      { name: { de: 'Wiederverkauf', en: 'Resale Market', pl: 'Rynek wtórny' }, score: 60, count: 1 },
    ],
    business: [
      { name: { de: 'TV-Rechte', en: 'TV Rights & Broadcasting', pl: 'Prawa TV' }, score: 52, count: 109 },
      { name: { de: 'Sponsoren', en: 'Sponsor Sentiment', pl: 'Sponsorzy' }, score: 61, count: 20 },
      { name: { de: 'Investitionen', en: 'Investment News', pl: 'Inwestycje' }, score: 51, count: 20 },
      { name: { de: 'Umsatzprognosen', en: 'Revenue Projections', pl: 'Prognozy przychodów' }, score: 31, count: 2 },
    ],
    fans: [
      { name: { de: 'Reiseplanung', en: 'Travel Planning', pl: 'Planowanie podróży' }, score: 55, count: 18 },
      { name: { de: 'Visa & Logistik', en: 'Visa & Logistics', pl: 'Wizy i logistyka' }, score: 53, count: 18 },
      { name: { de: 'Kostenbedenken', en: 'Cost Concerns', pl: 'Obawy o koszty' }, score: 43, count: 14 },
      { name: { de: 'Atmosphäre', en: 'Atmosphere & Experience', pl: 'Atmosfera' }, score: 56, count: 7 },
    ],
    infrastructure: [
      { name: { de: 'Stadion-Bereitschaft', en: 'Stadium Readiness', pl: 'Gotowość stadionów' }, score: 52, count: 33 },
      { name: { de: 'Transport', en: 'Transport & Access', pl: 'Transport' }, score: 59, count: 9 },
      { name: { de: 'Flughäfen', en: 'Airports & Flights', pl: 'Lotniska' }, score: 59, count: 6 },
      { name: { de: 'Unterkünfte', en: 'Accommodation', pl: 'Zakwaterowanie' }, score: 51, count: 3 },
    ],
    political: [
      { name: { de: 'Soziale Themen', en: 'Social Issues', pl: 'Kwestie społeczne' }, score: 46, count: 18 },
      { name: { de: 'Klima-Bedenken', en: 'Climate Concerns', pl: 'Obawy klimatyczne' }, score: 40, count: 16 },
      { name: { de: 'Proteste & Politik', en: 'Protests & Politics', pl: 'Protesty i polityka' }, score: 48, count: 3 },
      { name: { de: 'Visa & Einwanderung', en: 'Visa & Immigration', pl: 'Wizy i imigracja' }, score: 37, count: 2 },
    ],
  },
};

// Translations
const TRANSLATIONS = {
  de: {
    liveTitle: 'Live Sentiment',
    updated: 'Aktualisiert',
    globalIndex: 'Global Sentiment Index',
    veryPositive: 'Sehr Positiv',
    positive: 'Positiv',
    neutral: 'Neutral', 
    negative: 'Negativ',
    veryNegative: 'Sehr Negativ',
    newsVsSocial: 'News vs. Social Media',
    news: 'News',
    social: 'Social',
    socialMoreSkeptical: 'Social Media ist skeptischer als traditionelle Medien',
    countries: 'Länder',
    languages: 'Sprachen',
    sources: 'Quellen',
    overview: 'Übersicht',
    categoriesTab: 'Kategorien',
    premium: 'Premium',
    archive: 'Archiv',
    sentimentByCategory: 'Sentiment nach Kategorie',
    articles: 'Artikel',
    footer: 'XLM-RoBERTa Sentiment • 1.600+ Quellen • 9 Sprachen',
    // Premium Lock
    premiumLocked: 'Premium-Analyse freischalten',
    premiumLockedDesc: 'Erhalte Zugang zu detaillierten Analysen, historischen Daten und exklusiven Insights.',
    premiumFeature1: 'Tägliche Detail-Analysen',
    premiumFeature2: 'Historisches Archiv',
    premiumFeature3: 'Länder- & Sprach-Breakdown',
    premiumFeature4: 'Trend-Prognosen',
    unlockPremium: 'Premium freischalten',
    // Archive
    archiveTitle: 'Sentiment-Archiv',
    archiveDesc: 'Historische Analysen und Trends',
    currentAnalysis: 'Aktuelle Analyse',
    previousAnalyses: 'Frühere Analysen',
    noArchive: 'Noch keine archivierten Analysen verfügbar.',
    // Premium Report
    reportTitle: 'Premium-Analyse',
    keyMetrics: 'Kennzahlen',
    insights: 'Erkenntnisse',
    controversies: 'Kontroversen',
    keyQuotes: 'Wichtige Zitate',
    recommendations: 'Empfehlungen',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    selectFromArchive: 'Wähle eine Analyse aus dem Archiv',
  },
  en: {
    liveTitle: 'Live Sentiment',
    updated: 'Updated',
    globalIndex: 'Global Sentiment Index',
    veryPositive: 'Very Positive',
    positive: 'Positive',
    neutral: 'Neutral', 
    negative: 'Negative',
    veryNegative: 'Very Negative',
    newsVsSocial: 'News vs. Social Media',
    news: 'News',
    social: 'Social',
    socialMoreSkeptical: 'Social media is more skeptical than traditional media',
    countries: 'Countries',
    languages: 'Languages',
    sources: 'Sources',
    overview: 'Overview',
    categoriesTab: 'Categories',
    premium: 'Premium',
    archive: 'Archive',
    sentimentByCategory: 'Sentiment by Category',
    articles: 'articles',
    footer: 'XLM-RoBERTa Sentiment • 1,600+ Sources • 9 Languages',
    // Premium Lock
    premiumLocked: 'Unlock Premium Analysis',
    premiumLockedDesc: 'Get access to detailed analyses, historical data and exclusive insights.',
    premiumFeature1: 'Daily detailed analyses',
    premiumFeature2: 'Historical archive',
    premiumFeature3: 'Country & language breakdown',
    premiumFeature4: 'Trend forecasts',
    unlockPremium: 'Unlock Premium',
    // Archive
    archiveTitle: 'Sentiment Archive',
    archiveDesc: 'Historical analyses and trends',
    currentAnalysis: 'Current Analysis',
    previousAnalyses: 'Previous Analyses',
    noArchive: 'No archived analyses available yet.',
    // Premium Report
    reportTitle: 'Premium Analysis',
    keyMetrics: 'Key Metrics',
    insights: 'Insights',
    controversies: 'Controversies',
    keyQuotes: 'Key Quotes',
    recommendations: 'Recommendations',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    selectFromArchive: 'Select an analysis from the archive',
  },
  pl: {
    liveTitle: 'Live Sentiment',
    updated: 'Zaktualizowano',
    globalIndex: 'Globalny Indeks Nastrojów',
    veryPositive: 'Bardzo Pozytywny',
    positive: 'Pozytywny',
    neutral: 'Neutralny', 
    negative: 'Negatywny',
    veryNegative: 'Bardzo Negatywny',
    newsVsSocial: 'News vs. Media społecznościowe',
    news: 'News',
    social: 'Social',
    socialMoreSkeptical: 'Media społecznościowe są bardziej sceptyczne',
    countries: 'Kraje',
    languages: 'Języki',
    sources: 'Źródła',
    overview: 'Przegląd',
    categoriesTab: 'Kategorie',
    premium: 'Premium',
    archive: 'Archiwum',
    sentimentByCategory: 'Sentyment wg kategorii',
    articles: 'artykułów',
    footer: 'XLM-RoBERTa Sentiment • 1600+ źródeł • 9 języków',
    // Premium Lock
    premiumLocked: 'Odblokuj analizę Premium',
    premiumLockedDesc: 'Uzyskaj dostęp do szczegółowych analiz, danych historycznych i ekskluzywnych wniosków.',
    premiumFeature1: 'Codzienne szczegółowe analizy',
    premiumFeature2: 'Archiwum historyczne',
    premiumFeature3: 'Podział wg krajów i języków',
    premiumFeature4: 'Prognozy trendów',
    unlockPremium: 'Odblokuj Premium',
    // Archive
    archiveTitle: 'Archiwum nastrojów',
    archiveDesc: 'Historyczne analizy i trendy',
    currentAnalysis: 'Aktualna analiza',
    previousAnalyses: 'Poprzednie analizy',
    noArchive: 'Brak zarchiwizowanych analiz.',
    // Premium Report
    reportTitle: 'Analiza Premium',
    keyMetrics: 'Kluczowe wskaźniki',
    insights: 'Wnioski',
    controversies: 'Kontrowersje',
    keyQuotes: 'Kluczowe cytaty',
    recommendations: 'Rekomendacje',
    high: 'Wysoki',
    medium: 'Średni',
    low: 'Niski',
    selectFromArchive: 'Wybierz analizę z archiwum',
  },
};

// Helper functions
const getScoreColor = (score) => {
  if (score >= 60) return { bg: '#22c55e', text: '#4ade80', light: 'rgba(34, 197, 94, 0.1)' };
  if (score >= 45) return { bg: '#f59e0b', text: '#fbbf24', light: 'rgba(245, 158, 11, 0.1)' };
  return { bg: '#ef4444', text: '#f87171', light: 'rgba(239, 68, 68, 0.1)' };
};

const getScoreLabel = (score, t) => {
  if (score >= 70) return t('veryPositive');
  if (score >= 55) return t('positive');
  if (score >= 45) return t('neutral');
  if (score >= 30) return t('negative');
  return t('veryNegative');
};

const getName = (name, lang) => {
  if (typeof name === 'string') return name;
  return name[lang] || name.en || name.de || '';
};

// Premium Lock Component
const PremiumLock = ({ t, onUnlock }) => (
  <div style={styles.premiumLock}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
      {t('premiumLocked')}
    </h3>
    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', maxWidth: '280px' }}>
      {t('premiumLockedDesc')}
    </p>
    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
      {['premiumFeature1', 'premiumFeature2', 'premiumFeature3', 'premiumFeature4'].map(key => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ color: '#a855f7' }}>✓</span>
          <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{t(key)}</span>
        </div>
      ))}
    </div>
    <button 
      onClick={onUnlock}
      style={styles.premiumButton}
    >
      ⭐ {t('unlockPremium')}
    </button>
  </div>
);

// Archive List Component
const ArchiveList = ({ reports, currentDate, t, language, onSelectReport, isPremium }) => {
  if (!isPremium) {
    return <PremiumLock t={t} onUnlock={() => {}} />;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'pl' ? 'pl-PL' : 'en-US', options);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>
          {t('currentAnalysis')}
        </div>
        <div 
          onClick={() => onSelectReport(currentDate)}
          style={{ ...styles.archiveItem, border: '1px solid #a855f7', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{formatDate(currentDate)}</div>
              <div style={{ fontSize: '10px', color: '#a855f7' }}>NEU</div>
            </div>
          </div>
          <span style={{ color: '#64748b' }}>→</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>
          {t('previousAnalyses')}
        </div>
        {reports && reports.length > 0 ? (
          reports.map((report, i) => (
            <div 
              key={i}
              onClick={() => onSelectReport(report.date)}
              style={{ ...styles.archiveItem, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📄</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'white' }}>{formatDate(report.date)}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Score: {report.score}/100</div>
                </div>
              </div>
              <span style={{ color: '#64748b' }}>→</span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '13px' }}>{t('noArchive')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function SentimentDashboard({ language = 'de', user }) {
  const [data, setData] = useState(FALLBACK_DATA);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = (key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;

  useEffect(() => {
    loadData();
    if (user) {
      checkPremiumStatus();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      // Try to load latest sentiment data - gracefully handle missing table
      try {
        const { data: sentimentData, error } = await supabase
          .from('wm2026_sentiment')
          .select('*')
          .order('date', { ascending: false })
          .limit(1);

        if (!error && sentimentData && sentimentData.length > 0) {
          const latest = sentimentData[0];
          setData(prev => ({
            ...prev,
            score: latest.score || prev.score,
            positive: latest.articles_positive || prev.positive,
            neutral: latest.articles_neutral || prev.neutral,
            negative: latest.articles_negative || prev.negative,
            total: latest.articles_total || prev.total,
            countries: latest.countries_count || prev.countries,
            languages: latest.languages_count || prev.languages,
            news: { score: latest.news_score || prev.news.score, count: latest.news_count || prev.news.count },
            social: { score: latest.social_score || prev.social.score, count: latest.social_count || prev.social.count },
            timestamp: latest.date || prev.timestamp,
          }));
        }
      } catch (sentimentErr) {
        console.log('Sentiment table not available, using fallback data');
      }

      // Try to load archived reports - gracefully handle missing table
      try {
        const { data: reportsData, error: reportsError } = await supabase
          .from('wm2026_sentiment_reports')
          .select('date, score')
          .order('date', { ascending: false })
          .limit(30);

        if (!reportsError && reportsData) {
          setReports(reportsData);
        }
      } catch (reportsErr) {
        console.log('Reports table not available');
      }

    } catch (err) {
      console.error('Error loading sentiment data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function checkPremiumStatus() {
    if (!user) {
      setIsPremium(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, premium_until')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        const isActive = profile.is_premium || 
          (profile.premium_until && new Date(profile.premium_until) > new Date());
        setIsPremium(isActive);
      }
    } catch (err) {
      console.log('Premium status check failed, defaulting to non-premium');
      setIsPremium(false);
    }
  }

  const handleSelectReport = async (date) => {
    // Load full report - gracefully handle missing table
    try {
      const { data: report, error } = await supabase
        .from('wm2026_sentiment_reports')
        .select('*')
        .eq('date', date)
        .single();
      
      if (!error && report) {
        setSelectedReport(report);
        setActiveTab('premium');
      } else {
        // If no report exists, create a mock report from current data
        setSelectedReport({
          date: date,
          score: data.score,
          articles_total: data.total,
          title_de: 'Aktuelle Analyse',
          title_en: 'Current Analysis',
          summary_de: 'Automatisch generierte Analyse basierend auf aktuellen Daten.',
          summary_en: 'Auto-generated analysis based on current data.',
          insights: []
        });
        setActiveTab('premium');
      }
    } catch (err) {
      console.log('Report loading failed, using current data');
      setSelectedReport({
        date: date,
        score: data.score,
        articles_total: data.total,
        title_de: 'Aktuelle Analyse',
        title_en: 'Current Analysis',
        summary_de: 'Daten werden noch gesammelt.',
        summary_en: 'Data is still being collected.',
        insights: []
      });
      setActiveTab('premium');
    }
  };

  const handleUnlockPremium = () => {
    // TODO: Implement Stripe checkout
    alert('Premium-Funktion kommt bald! / Premium feature coming soon!');
  };

  const colors = getScoreColor(data.score);
  const newsColors = getScoreColor(data.news.score);
  const socialColors = getScoreColor(data.social.score);

  const tabs = [
    { id: 'overview', label: t('overview'), locked: false },
    { id: 'categories', label: t('categoriesTab'), locked: false },
    { id: 'premium', label: t('premium'), locked: !isPremium, icon: '⭐' },
    { id: 'archive', label: t('archive'), locked: !isPremium, icon: '📚' },
  ];

  // Show loading spinner
  if (loading) {
    return (
      <div style={{ ...styles.container, padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <div style={{ color: '#64748b', fontSize: '14px' }}>
          {language === 'de' ? 'Lade Sentiment-Daten...' : language === 'pl' ? 'Ładowanie danych...' : 'Loading sentiment data...'}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={styles.liveIndicator} />
          <span style={{ fontWeight: '600', color: 'white' }}>{t('liveTitle')}</span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          {t('updated')}: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '--:--'}
        </span>
      </div>

      {/* Main Score */}
      <div style={styles.scoreSection}>
        <div style={{ fontSize: '64px', fontWeight: '800', color: colors.text }}>{data.score}</div>
        <div style={{ fontSize: '24px', color: '#64748b' }}>/100</div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>
          {getScoreLabel(data.score, t)}
        </span>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>{data.total.toLocaleString()}</div>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>{t('sources')}</div>
        </div>
        <div style={styles.statItem}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>{data.countries}</div>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>{t('countries')}</div>
        </div>
        <div style={styles.statItem}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>{data.languages}</div>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>{t('languages')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
              opacity: tab.locked ? 0.7 : 1,
            }}
          >
            {tab.icon && <span style={{ marginRight: '4px' }}>{tab.icon}</span>}
            {tab.label}
            {tab.locked && <span style={{ marginLeft: '4px', fontSize: '10px' }}>🔒</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Sentiment Distribution */}
            <div style={{ ...styles.card, marginBottom: '12px' }}>
              <div style={styles.distributionBar}>
                <div style={{ ...styles.distributionSegment, width: `${(data.positive / data.total) * 100}%`, background: '#22c55e' }} />
                <div style={{ ...styles.distributionSegment, width: `${(data.neutral / data.total) * 100}%`, background: '#f59e0b' }} />
                <div style={{ ...styles.distributionSegment, width: `${(data.negative / data.total) * 100}%`, background: '#ef4444' }} />
              </div>
              <div style={styles.distributionLabels}>
                <span style={{ color: '#4ade80' }}>👍 {data.positive}</span>
                <span style={{ color: '#fbbf24' }}>😐 {data.neutral}</span>
                <span style={{ color: '#f87171' }}>👎 {data.negative}</span>
              </div>
            </div>

            {/* News vs Social */}
            <div style={{ ...styles.card, marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '12px' }}>
                {t('newsVsSocial')}
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>📰 {t('news')}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: newsColors.text }}>{data.news.score}</span>
                </div>
                <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${data.news.score}%`, background: `linear-gradient(90deg, ${newsColors.bg}, ${newsColors.text})`, borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>💬 {t('social')}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: socialColors.text }}>{data.social.score}</span>
                </div>
                <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${data.social.score}%`, background: `linear-gradient(90deg, ${socialColors.bg}, ${socialColors.text})`, borderRadius: '4px' }} />
                </div>
              </div>

              {data.news.score - data.social.score >= 5 && (
                <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  <span style={{ fontSize: '11px', color: '#fbbf24' }}>⚠️ {t('socialMoreSkeptical')}</span>
                </div>
              )}
            </div>

            {/* Categories Preview */}
            <div style={styles.card}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '12px' }}>
                {t('sentimentByCategory')}
              </div>
              {data.categories.slice(0, 4).map(cat => {
                const catColors = getScoreColor(cat.score);
                return (
                  <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{cat.emoji}</span>
                      <span style={{ fontSize: '12px', color: 'white' }}>{getName(cat.name, language)}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: catColors.text }}>{cat.score}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '12px' }}>
              {t('sentimentByCategory')}
            </div>
            {data.categories.map(cat => {
              const catColors = getScoreColor(cat.score);
              const isExpanded = expandedCategory === cat.key;
              const subCats = data.subCategories[cat.key] || [];
              
              return (
                <div key={cat.key} style={{ ...styles.card, marginBottom: '8px', padding: 0, overflow: 'hidden' }}>
                  <div 
                    onClick={() => subCats.length > 0 && setExpandedCategory(isExpanded ? null : cat.key)}
                    style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: subCats.length > 0 ? 'pointer' : 'default' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{getName(cat.name, language)}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{cat.count} {t('articles')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: catColors.text }}>{cat.score}</span>
                      {subCats.length > 0 && <span style={{ color: '#64748b', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>}
                    </div>
                  </div>
                  
                  {isExpanded && subCats.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderTop: '1px solid #334155' }}>
                      {subCats.map((sub, i) => {
                        const subColors = getScoreColor(sub.score);
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: subColors.bg }} />
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{getName(sub.name, language)}</span>
                            </div>
                            {isPremium ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '60px', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${sub.score}%`, background: subColors.bg, borderRadius: '2px' }} />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: subColors.text, width: '24px' }}>{sub.score}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#64748b' }}>🔒</span>
                            )}
                          </div>
                        );
                      })}
                      {!isPremium && (
                        <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#a855f7' }}>
                            ⭐ {language === 'de' ? 'Details mit Premium freischalten' : language === 'pl' ? 'Odblokuj szczegóły z Premium' : 'Unlock details with Premium'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PREMIUM TAB */}
        {activeTab === 'premium' && (
          isPremium ? (
            selectedReport ? (
              <div>
                <div style={{ ...styles.card, marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                    {language === 'de' ? (selectedReport.title_de || selectedReport.title?.de) : 
                     language === 'pl' ? (selectedReport.title_pl || selectedReport.title_en || selectedReport.title?.en) :
                     (selectedReport.title_en || selectedReport.title?.en) || t('reportTitle')}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                    {language === 'de' ? (selectedReport.summary_de || selectedReport.summary?.de) :
                     language === 'pl' ? (selectedReport.summary_pl || selectedReport.summary_en || selectedReport.summary?.en) :
                     (selectedReport.summary_en || selectedReport.summary?.en) || ''}
                  </p>
                </div>

                {/* Key Metrics */}
                <div style={{ ...styles.card, marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>{t('keyMetrics')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={styles.metricBox}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{selectedReport.score || data.score}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Score</div>
                    </div>
                    <div style={styles.metricBox}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>{selectedReport.articles_total || data.total}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{t('sources')}</div>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                {selectedReport.insights && Array.isArray(selectedReport.insights) && selectedReport.insights.length > 0 && (
                  <div style={{ ...styles.card, marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>{t('insights')}</div>
                    {selectedReport.insights.map((insight, i) => (
                      <div key={i} style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #a855f7' }}>
                        <div style={{ fontSize: '12px', color: 'white', fontWeight: '500' }}>{insight.title?.[language] || insight.title}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{insight.description?.[language] || insight.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {t('selectFromArchive')}
                </p>
                <button 
                  onClick={() => setActiveTab('archive')}
                  style={{ ...styles.premiumButton, marginTop: '16px' }}
                >
                  📚 {t('archive')}
                </button>
              </div>
            )
          ) : (
            <PremiumLock t={t} onUnlock={handleUnlockPremium} />
          )
        )}

        {/* ARCHIVE TAB */}
        {activeTab === 'archive' && (
          <ArchiveList 
            reports={reports}
            currentDate={data.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0]}
            t={t}
            language={language}
            onSelectReport={handleSelectReport}
            isPremium={isPremium}
          />
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={{ fontSize: '9px', color: '#475569' }}>{t('footer')} • © 2025 wm26.live</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#0f172a',
    borderRadius: '16px',
    overflow: 'hidden',
    maxWidth: '100%',
  },
  header: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
  },
  liveIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 2s infinite',
  },
  scoreSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: '4px',
    padding: '24px 16px 8px',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px',
    borderBottom: '1px solid #334155',
  },
  statItem: {
    textAlign: 'center',
  },
  tabContainer: {
    display: 'flex',
    padding: '8px 16px',
    gap: '8px',
    borderBottom: '1px solid #334155',
    overflowX: 'auto',
  },
  tab: {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#64748b',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  },
  tabActive: {
    background: '#1e293b',
    color: 'white',
  },
  content: {
    padding: '16px',
    minHeight: '300px',
  },
  card: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '16px',
  },
  distributionBar: {
    display: 'flex',
    height: '12px',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  distributionSegment: {
    height: '100%',
  },
  distributionLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: '600',
  },
  premiumLock: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  premiumButton: {
    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 28px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
  },
  archiveItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    background: '#1e293b',
    borderRadius: '10px',
    marginBottom: '8px',
  },
  metricBox: {
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '10px',
    textAlign: 'center',
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid #334155',
    textAlign: 'center',
  },
};
