import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ============================================
// WM 2026 SENTIMENT DASHBOARD - PREMIUM EDITION
// ============================================

// Translations
const TRANSLATIONS = {
  de: {
    liveTitle: 'Live Sentiment',
    globalIndex: 'Global Sentiment Index',
    neutralMood: 'Neutrale Stimmung',
    positiveMood: 'Positive Stimmung',
    skepticalMood: 'Skeptische Stimmung',
    negativeMood: 'Negative Stimmung',
    positive: 'Positiv',
    neutral: 'Neutral', 
    negative: 'Negativ',
    newsVsSocial: 'News vs. Social Media',
    news: 'News',
    social: 'Social',
    socialMoreSkeptical: 'Social Media ist skeptischer als traditionelle Medien',
    countries: 'Länder',
    languages: 'Sprachen',
    sources: 'Quellen',
    categories: 'Kategorien',
    showAll: 'Alle anzeigen',
    overview: 'Übersicht',
    categoriesTab: 'Kategorien',
    analysis: 'Analyse',
    premium: 'Premium',
    archive: 'Archiv',
    sentimentByCategory: 'Sentiment nach Kategorie',
    articles: 'Artikel',
    topCountries: 'Top Länder nach Coverage',
    sentimentByLanguage: 'Sentiment nach Sprache',
    keyInsights: 'Kernerkenntnisse',
    footer: 'XLM-RoBERTa Sentiment • Multilingual Analysis',
    premiumLocked: 'Premium-Bereich',
    premiumDescription: 'Erhalte Zugang zu detaillierten Sentiment-Analysen, Tagesvergleichen und exklusiven Insights.',
    unlockPremium: 'Premium freischalten',
    premiumFeatures: [
      'Detaillierte Sentiment-Analysen',
      'Länder- und Sprach-Breakdown',
      'Tagesvergleiche & Trends',
      'Archiv aller Analysen',
      'Exklusive Premium-Insights'
    ],
    reportTitle: 'Premium Analyse',
    reportDate: 'Analysedatum',
    archiveTitle: 'Analyse-Archiv',
    archiveDesc: 'Alle bisherigen Detailanalysen',
    noReports: 'Noch keine Analysen verfügbar',
    loadingReport: 'Lade Analyse...',
    viewReport: 'Analyse ansehen',
    currentAnalysis: 'Aktuelle Analyse',
    previousAnalyses: 'Frühere Analysen',
    dayChange: 'Tagesveränderung',
    weekChange: '7-Tage-Trend',
    updated: 'Aktualisiert',
  },
  en: {
    liveTitle: 'Live Sentiment',
    globalIndex: 'Global Sentiment Index',
    neutralMood: 'Neutral Mood',
    positiveMood: 'Positive Mood',
    skepticalMood: 'Skeptical Mood',
    negativeMood: 'Negative Mood',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    newsVsSocial: 'News vs. Social Media',
    news: 'News',
    social: 'Social',
    socialMoreSkeptical: 'Social Media more skeptical than traditional news',
    countries: 'Countries',
    languages: 'Languages',
    sources: 'Sources',
    categories: 'Categories',
    showAll: 'Show all',
    overview: 'Overview',
    categoriesTab: 'Categories',
    analysis: 'Analysis',
    premium: 'Premium',
    archive: 'Archive',
    sentimentByCategory: 'Sentiment by Category',
    articles: 'articles',
    topCountries: 'Top Countries by Coverage',
    sentimentByLanguage: 'Sentiment by Language',
    keyInsights: 'Key Insights',
    footer: 'XLM-RoBERTa Sentiment • Multilingual Analysis',
    premiumLocked: 'Premium Section',
    premiumDescription: 'Get access to detailed sentiment analyses, daily comparisons and exclusive insights.',
    unlockPremium: 'Unlock Premium',
    premiumFeatures: [
      'Detailed sentiment analyses',
      'Country & language breakdown',
      'Daily comparisons & trends',
      'Archive of all analyses',
      'Exclusive premium insights'
    ],
    reportTitle: 'Premium Analysis',
    reportDate: 'Analysis Date',
    archiveTitle: 'Analysis Archive',
    archiveDesc: 'All previous detailed analyses',
    noReports: 'No analyses available yet',
    loadingReport: 'Loading analysis...',
    viewReport: 'View Analysis',
    currentAnalysis: 'Current Analysis',
    previousAnalyses: 'Previous Analyses',
    dayChange: 'Daily Change',
    weekChange: '7-Day Trend',
    updated: 'Updated',
  },
  pl: {
    liveTitle: 'Live Sentiment',
    globalIndex: 'Globalny Indeks Nastrojów',
    neutralMood: 'Neutralny nastrój',
    positiveMood: 'Pozytywny nastrój',
    skepticalMood: 'Sceptyczny nastrój',
    negativeMood: 'Negatywny nastrój',
    positive: 'Pozytywny',
    neutral: 'Neutralny',
    negative: 'Negatywny',
    newsVsSocial: 'News vs. Media społecznościowe',
    news: 'News',
    social: 'Social',
    socialMoreSkeptical: 'Media społecznościowe są bardziej sceptyczne',
    countries: 'Kraje',
    languages: 'Języki',
    sources: 'Źródła',
    categories: 'Kategorie',
    showAll: 'Pokaż wszystko',
    overview: 'Przegląd',
    categoriesTab: 'Kategorie',
    analysis: 'Analiza',
    premium: 'Premium',
    archive: 'Archiwum',
    sentimentByCategory: 'Sentyment według kategorii',
    articles: 'artykuły',
    topCountries: 'Top kraje według zasięgu',
    sentimentByLanguage: 'Sentyment według języka',
    keyInsights: 'Kluczowe wnioski',
    footer: 'XLM-RoBERTa Sentiment • Analiza wielojęzyczna',
    premiumLocked: 'Sekcja Premium',
    premiumDescription: 'Uzyskaj dostęp do szczegółowych analiz sentymentu, porównań dziennych i ekskluzywnych spostrzeżeń.',
    unlockPremium: 'Odblokuj Premium',
    premiumFeatures: [
      'Szczegółowe analizy sentymentu',
      'Podział według krajów i języków',
      'Porównania dzienne i trendy',
      'Archiwum wszystkich analiz',
      'Ekskluzywne spostrzeżenia premium'
    ],
    reportTitle: 'Analiza Premium',
    reportDate: 'Data analizy',
    archiveTitle: 'Archiwum analiz',
    archiveDesc: 'Wszystkie poprzednie szczegółowe analizy',
    noReports: 'Brak dostępnych analiz',
    loadingReport: 'Ładowanie analizy...',
    viewReport: 'Zobacz analizę',
    currentAnalysis: 'Aktualna analiza',
    previousAnalyses: 'Poprzednie analizy',
    dayChange: 'Zmiana dzienna',
    weekChange: 'Trend 7-dniowy',
    updated: 'Zaktualizowano',
  }
};

// Helper functions
const getScoreColor = (score) => {
  if (score >= 60) return { bg: '#22c55e', text: '#4ade80', light: 'rgba(34,197,94,0.1)' };
  if (score >= 45) return { bg: '#fbbf24', text: '#fcd34d', light: 'rgba(251,191,36,0.1)' };
  return { bg: '#ef4444', text: '#f87171', light: 'rgba(239,68,68,0.1)' };
};

const getName = (nameObj, lang) => {
  if (typeof nameObj === 'string') return nameObj;
  return nameObj?.[lang] || nameObj?.en || nameObj?.de || '';
};

// Premium Lock Component
const PremiumLock = ({ t, onUnlock }) => (
  <div style={styles.premiumLock}>
    <div style={styles.premiumLockIcon}>🔒</div>
    <h3 style={styles.premiumLockTitle}>{t('premiumLocked')}</h3>
    <p style={styles.premiumLockDesc}>{t('premiumDescription')}</p>
    <ul style={styles.premiumFeatureList}>
      {t('premiumFeatures').map((feature, i) => (
        <li key={i} style={styles.premiumFeatureItem}>
          <span style={styles.premiumFeatureCheck}>✓</span>
          {feature}
        </li>
      ))}
    </ul>
    <button onClick={onUnlock} style={styles.premiumButton}>
      {t('unlockPremium')}
    </button>
  </div>
);

// Archive List Component
const ArchiveList = ({ reports, language, t, onSelectReport, selectedDate }) => {
  const sortedReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));
  const currentReport = sortedReports[0];
  const previousReports = sortedReports.slice(1);
  
  return (
    <div style={styles.archiveContainer}>
      {/* Current Analysis */}
      {currentReport && (
        <div style={styles.archiveSection}>
          <div style={styles.archiveSectionTitle}>{t('currentAnalysis')}</div>
          <div 
            style={{
              ...styles.archiveItem,
              ...(selectedDate === currentReport.date ? styles.archiveItemSelected : {})
            }}
            onClick={() => onSelectReport(currentReport.date)}
          >
            <div style={styles.archiveItemDate}>
              {new Date(currentReport.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
            <div style={styles.archiveItemTitle}>
              {language === 'de' ? currentReport.title_de : currentReport.title_en}
            </div>
            <span style={styles.archiveItemBadge}>NEU</span>
          </div>
        </div>
      )}
      
      {/* Previous Analyses */}
      {previousReports.length > 0 && (
        <div style={styles.archiveSection}>
          <div style={styles.archiveSectionTitle}>{t('previousAnalyses')}</div>
          {previousReports.map(report => (
            <div 
              key={report.date}
              style={{
                ...styles.archiveItem,
                ...(selectedDate === report.date ? styles.archiveItemSelected : {})
              }}
              onClick={() => onSelectReport(report.date)}
            >
              <div style={styles.archiveItemDate}>
                {new Date(report.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              <div style={styles.archiveItemTitle}>
                {language === 'de' ? report.title_de : report.title_en}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {reports.length === 0 && (
        <div style={styles.noReports}>{t('noReports')}</div>
      )}
    </div>
  );
};

// Premium Report View Component
const PremiumReportView = ({ report, sentimentData, language, t }) => {
  if (!report) return <div style={styles.loading}>{t('loadingReport')}</div>;
  
  const title = language === 'de' ? report.title_de : report.title_en;
  const summary = language === 'de' ? report.summary_de : report.summary_en;
  const insights = report.insights || [];
  const quotes = report.key_quotes || [];
  const recommendations = report.recommendations || [];
  const controversies = report.controversies || [];
  
  return (
    <div style={styles.reportContainer}>
      {/* Report Header */}
      <div style={styles.reportHeader}>
        <div style={styles.reportDate}>
          {new Date(report.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
        <h2 style={styles.reportTitle}>{title}</h2>
      </div>
      
      {/* Summary */}
      <div style={styles.reportSummary}>
        {summary}
      </div>
      
      {/* Key Metrics (from sentiment data) */}
      {sentimentData && (
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{sentimentData.score}</div>
            <div style={styles.metricLabel}>Global Score</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{sentimentData.articles_total}</div>
            <div style={styles.metricLabel}>{t('articles')}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{sentimentData.countries_count}</div>
            <div style={styles.metricLabel}>{t('countries')}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{sentimentData.languages_count}</div>
            <div style={styles.metricLabel}>{t('languages')}</div>
          </div>
        </div>
      )}
      
      {/* News vs Social */}
      {sentimentData?.news_score && sentimentData?.social_score && (
        <div style={styles.newsVsSocial}>
          <div style={styles.sectionTitle}>{t('newsVsSocial')}</div>
          <div style={styles.newsVsSocialBars}>
            <div style={styles.barRow}>
              <span style={styles.barLabel}>{t('news')}</span>
              <div style={styles.barTrack}>
                <div style={{...styles.barFill, width: `${sentimentData.news_score}%`, background: '#3b82f6'}} />
              </div>
              <span style={styles.barValue}>{sentimentData.news_score}</span>
            </div>
            <div style={styles.barRow}>
              <span style={styles.barLabel}>{t('social')}</span>
              <div style={styles.barTrack}>
                <div style={{...styles.barFill, width: `${sentimentData.social_score}%`, background: '#f59e0b'}} />
              </div>
              <span style={styles.barValue}>{sentimentData.social_score}</span>
            </div>
          </div>
          {sentimentData.news_score > sentimentData.social_score && (
            <div style={styles.socialNote}>⚠️ {t('socialMoreSkeptical')}</div>
          )}
        </div>
      )}
      
      {/* Insights */}
      {insights.length > 0 && (
        <div style={styles.reportSection}>
          <div style={styles.sectionTitle}>{t('keyInsights')}</div>
          {insights.map((insight, i) => (
            <div key={i} style={styles.insightCard}>
              <span style={styles.insightIcon}>{insight.icon || '💡'}</span>
              <div>
                <div style={styles.insightTitle}>{language === 'de' ? insight.title_de : insight.title_en}</div>
                <div style={styles.insightDesc}>{language === 'de' ? insight.description_de : insight.description_en}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Controversies */}
      {controversies.length > 0 && (
        <div style={styles.reportSection}>
          <div style={styles.sectionTitle}>🔥 Kontroverse Themen</div>
          {controversies.map((item, i) => (
            <div key={i} style={styles.controversyCard}>
              <div style={styles.controversyTitle}>{language === 'de' ? item.title_de : item.title_en}</div>
              <div style={styles.controversyDesc}>{language === 'de' ? item.description_de : item.description_en}</div>
              {item.source && (
                <div style={styles.quoteSource}>Quelle: {item.source}</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Key Quotes */}
      {quotes.length > 0 && (
        <div style={styles.reportSection}>
          <div style={styles.sectionTitle}>📣 Prägnante Aussagen</div>
          {quotes.map((quote, i) => (
            <div key={i} style={styles.quoteCard}>
              <div style={styles.quoteText}>"{language === 'de' ? quote.text_de : quote.text_en}"</div>
              <div style={styles.quoteSource}>— {quote.source}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={styles.reportSection}>
          <div style={styles.sectionTitle}>📋 Deep-Dive Empfehlungen</div>
          {recommendations.map((rec, i) => (
            <div key={i} style={styles.recommendationCard}>
              <span style={{...styles.recommendationPriority, background: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#22c55e'}}>
                {rec.priority === 'high' ? 'HOCH' : rec.priority === 'medium' ? 'MITTEL' : 'NIEDRIG'}
              </span>
              <span style={styles.recommendationText}>{language === 'de' ? rec.text_de : rec.text_en}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
export default function SentimentDashboard({ language = 'de', user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  // Data states
  const [sentimentData, setSentimentData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReportDate, setSelectedReportDate] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [sentimentHistory, setSentimentHistory] = useState([]);
  
  const t = (key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key;
  
  // Check premium status
  useEffect(() => {
    checkPremiumStatus();
  }, [user]);
  
  // Load data
  useEffect(() => {
    loadSentimentData();
  }, []);
  
  // Load report when date changes
  useEffect(() => {
    if (selectedReportDate && isPremium) {
      loadReport(selectedReportDate);
    }
  }, [selectedReportDate, isPremium]);
  
  const checkPremiumStatus = async () => {
    if (!user) {
      setIsPremium(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, premium_until')
        .eq('id', user.id)
        .single();
      
      if (data) {
        const premiumActive = data.is_premium || (data.premium_until && new Date(data.premium_until) > new Date());
        setIsPremium(premiumActive);
      }
    } catch (err) {
      console.error('Premium check error:', err);
      setIsPremium(false);
    }
  };
  
  const loadSentimentData = async () => {
    setLoading(true);
    try {
      // Load main sentiment data (last 7 days for trend)
      const { data: sentimentHistory, error: sentimentError } = await supabase
        .from('wm2026_sentiment')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);
      
      if (sentimentError) throw sentimentError;
      
      if (sentimentHistory && sentimentHistory.length > 0) {
        setSentimentData(sentimentHistory[0]);
        setSentimentHistory(sentimentHistory);
        
        const latestDate = sentimentHistory[0].date;
        
        // Load categories
        const { data: catData } = await supabase
          .from('wm2026_sentiment_categories')
          .select('*')
          .eq('date', latestDate)
          .order('articles_count', { ascending: false });
        
        if (catData) setCategories(catData);
        
        // Load subcategories (premium only but we load them anyway)
        const { data: subData } = await supabase
          .from('wm2026_sentiment_subcategories')
          .select('*')
          .eq('date', latestDate);
        
        if (subData) {
          const grouped = {};
          subData.forEach(sub => {
            const catKey = sub.category_key || 'general';
            if (!grouped[catKey]) grouped[catKey] = [];
            grouped[catKey].push(sub);
          });
          setSubcategories(grouped);
        }
        
        // Load countries (premium only)
        const { data: countryData } = await supabase
          .from('wm2026_sentiment_countries')
          .select('*')
          .eq('date', latestDate)
          .order('articles_count', { ascending: false })
          .limit(20);
        
        if (countryData) setCountries(countryData);
        
        // Load languages (premium only)
        const { data: langData } = await supabase
          .from('wm2026_sentiment_languages')
          .select('*')
          .eq('date', latestDate)
          .order('articles_count', { ascending: false });
        
        if (langData) setLanguages(langData);
        
        // Load reports list (premium only)
        const { data: reportData } = await supabase
          .from('wm2026_sentiment_reports')
          .select('date, title_de, title_en')
          .eq('is_published', true)
          .order('date', { ascending: false })
          .limit(30);
        
        if (reportData) {
          setReports(reportData);
          if (reportData.length > 0) {
            setSelectedReportDate(reportData[0].date);
          }
        }
      }
    } catch (err) {
      console.error('Sentiment load error:', err);
    }
    setLoading(false);
  };
  
  const loadReport = async (date) => {
    try {
      const { data, error } = await supabase
        .from('wm2026_sentiment_reports')
        .select('*')
        .eq('date', date)
        .single();
      
      if (data) setCurrentReport(data);
    } catch (err) {
      console.error('Report load error:', err);
    }
  };
  
  const handleUnlockPremium = () => {
    // Navigate to premium/subscription page or open modal
    alert('Premium-Funktion kommt bald! / Premium feature coming soon!');
  };
  
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>🔄 Loading...</div>
      </div>
    );
  }
  
  const data = sentimentData || { score: 50, label_de: 'Neutral', label_en: 'Neutral' };
  const scoreColors = getScoreColor(data.score);
  
  // Calculate change from previous day
  const previousScore = sentimentHistory[1]?.score;
  const scoreChange = previousScore ? data.score - previousScore : 0;
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.liveIndicator}>
            <span style={styles.liveDot} />
            {t('liveTitle')}
          </span>
          <span style={styles.updated}>
            {t('updated')}: {new Date(data.updated_at || data.created_at).toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US')}
          </span>
        </div>
        
        {/* Main Score */}
        <div style={styles.scoreSection}>
          <div style={styles.mainScore}>
            <span style={{...styles.scoreValue, color: scoreColors.text}}>{data.score}</span>
            <span style={styles.scoreMax}>/100</span>
          </div>
          <div style={styles.scoreLabel}>{language === 'de' ? data.label_de : data.label_en}</div>
          {scoreChange !== 0 && (
            <div style={{
              ...styles.scoreChange,
              color: scoreChange > 0 ? '#22c55e' : '#ef4444'
            }}>
              {scoreChange > 0 ? '▲' : '▼'} {Math.abs(scoreChange)} {t('dayChange')}
            </div>
          )}
        </div>
        
        {/* Quick Stats */}
        <div style={styles.quickStats}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{data.articles_total || 0}</span>
            <span style={styles.statLabel}>{t('sources')}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{data.countries_count || 0}</span>
            <span style={styles.statLabel}>{t('countries')}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{data.languages_count || 0}</span>
            <span style={styles.statLabel}>{t('languages')}</span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div style={styles.tabs}>
        {['overview', 'categories', 'premium', 'archive'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
              ...(tab === 'premium' || tab === 'archive' ? styles.tabPremium : {})
            }}
          >
            {tab === 'premium' && '⭐ '}
            {tab === 'archive' && '📚 '}
            {t(tab === 'categories' ? 'categoriesTab' : tab)}
            {(tab === 'premium' || tab === 'archive') && !isPremium && ' 🔒'}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div style={styles.content}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Sentiment Distribution */}
            <div style={styles.card}>
              <div style={styles.distributionBar}>
                <div style={{...styles.distributionSegment, width: `${(data.articles_positive / data.articles_total) * 100}%`, background: '#22c55e'}} />
                <div style={{...styles.distributionSegment, width: `${(data.articles_neutral / data.articles_total) * 100}%`, background: '#fbbf24'}} />
                <div style={{...styles.distributionSegment, width: `${(data.articles_negative / data.articles_total) * 100}%`, background: '#ef4444'}} />
              </div>
              <div style={styles.distributionLabels}>
                <span style={{color: '#22c55e'}}>👍 {data.articles_positive || 0}</span>
                <span style={{color: '#fbbf24'}}>😐 {data.articles_neutral || 0}</span>
                <span style={{color: '#ef4444'}}>👎 {data.articles_negative || 0}</span>
              </div>
            </div>
            
            {/* News vs Social */}
            {data.news_score && data.social_score && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>{t('newsVsSocial')}</div>
                <div style={styles.newsVsSocialBars}>
                  <div style={styles.barRow}>
                    <span style={styles.barLabel}>📰 {t('news')}</span>
                    <div style={styles.barTrack}>
                      <div style={{...styles.barFill, width: `${data.news_score}%`, background: '#3b82f6'}} />
                    </div>
                    <span style={styles.barValue}>{data.news_score}</span>
                  </div>
                  <div style={styles.barRow}>
                    <span style={styles.barLabel}>💬 {t('social')}</span>
                    <div style={styles.barTrack}>
                      <div style={{...styles.barFill, width: `${data.social_score}%`, background: '#f59e0b'}} />
                    </div>
                    <span style={styles.barValue}>{data.social_score}</span>
                  </div>
                </div>
                {data.news_score > data.social_score && (
                  <div style={styles.socialNote}>⚠️ {t('socialMoreSkeptical')}</div>
                )}
              </div>
            )}
            
            {/* Categories Preview */}
            {categories.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>{t('categories')}</div>
                {categories.slice(0, 5).map(cat => {
                  const colors = getScoreColor(cat.score);
                  return (
                    <div key={cat.category_key} style={styles.categoryRow}>
                      <span style={styles.categoryEmoji}>{cat.emoji}</span>
                      <span style={styles.categoryName}>{language === 'de' ? cat.category_name_de : cat.category_name_en}</span>
                      <span style={{...styles.categoryScore, color: colors.text}}>{cat.score}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        
        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div>
            <div style={styles.sectionHeader}>{t('sentimentByCategory')}</div>
            {categories.map(cat => {
              const colors = getScoreColor(cat.score);
              const isExpanded = expandedCategory === cat.category_key;
              const subCats = subcategories[cat.category_key] || [];
              
              return (
                <div key={cat.category_key} style={{...styles.card, marginBottom: '8px', padding: 0, overflow: 'hidden'}}>
                  <div 
                    onClick={() => subCats.length > 0 && setExpandedCategory(isExpanded ? null : cat.category_key)}
                    style={{padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: subCats.length > 0 ? 'pointer' : 'default'}}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <span style={{fontSize: '20px'}}>{cat.emoji}</span>
                      <div>
                        <div style={{fontSize: '13px', fontWeight: '600', color: 'white'}}>
                          {language === 'de' ? cat.category_name_de : cat.category_name_en}
                        </div>
                        <div style={{fontSize: '10px', color: '#64748b'}}>{cat.articles_count} {t('articles')}</div>
                      </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <span style={{fontSize: '18px', fontWeight: '700', color: colors.text}}>{cat.score}</span>
                      {subCats.length > 0 && <span style={{color: '#64748b', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none'}}>▶</span>}
                    </div>
                  </div>
                  
                  {isExpanded && subCats.length > 0 && (
                    <div style={{background: 'rgba(0,0,0,0.2)', padding: '12px', borderTop: '1px solid #334155'}}>
                      {subCats.map((sub, i) => {
                        const subColors = getScoreColor(sub.score);
                        return (
                          <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                              <span style={{width: '5px', height: '5px', borderRadius: '50%', background: subColors.bg}} />
                              <span style={{fontSize: '11px', color: '#94a3b8'}}>
                                {language === 'de' ? sub.subcategory_name_de : sub.subcategory_name_en}
                              </span>
                              <span style={{fontSize: '9px', color: '#475569'}}>({sub.articles_count})</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <div style={{width: '60px', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden'}}>
                                <div style={{height: '100%', width: `${sub.score}%`, background: subColors.bg, borderRadius: '2px'}} />
                              </div>
                              <span style={{fontSize: '11px', fontWeight: '600', color: subColors.text, width: '24px'}}>{sub.score}</span>
                            </div>
                          </div>
                        );
                      })}
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
            <PremiumReportView 
              report={currentReport} 
              sentimentData={sentimentData}
              language={language}
              t={t}
            />
          ) : (
            <PremiumLock t={t} onUnlock={handleUnlockPremium} />
          )
        )}
        
        {/* ARCHIVE TAB */}
        {activeTab === 'archive' && (
          isPremium ? (
            <div>
              <div style={styles.archiveHeader}>
                <h3 style={styles.archiveTitle}>{t('archiveTitle')}</h3>
                <p style={styles.archiveDesc}>{t('archiveDesc')}</p>
              </div>
              <ArchiveList 
                reports={reports}
                language={language}
                t={t}
                onSelectReport={(date) => {
                  setSelectedReportDate(date);
                  setActiveTab('premium');
                }}
                selectedDate={selectedReportDate}
              />
            </div>
          ) : (
            <PremiumLock t={t} onUnlock={handleUnlockPremium} />
          )
        )}
      </div>
      
      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerText}>
          {t('footer')} • © 2025 wm26.live
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    background: '#0f172a',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #334155',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
  },
  header: {
    padding: '16px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderBottom: '1px solid #334155',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: '600',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 2s infinite',
  },
  updated: {
    fontSize: '10px',
    color: '#64748b',
  },
  scoreSection: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  mainScore: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '4px',
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: '18px',
    color: '#64748b',
  },
  scoreLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  scoreChange: {
    fontSize: '12px',
    marginTop: '8px',
    fontWeight: '600',
  },
  quickStats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '12px 0',
    borderTop: '1px solid #334155',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    display: 'block',
  },
  statLabel: {
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #334155',
    background: '#1e293b',
  },
  tab: {
    flex: 1,
    padding: '12px 8px',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '11px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#fbbf24',
    borderBottomColor: '#fbbf24',
  },
  tabPremium: {
    color: '#a855f7',
  },
  content: {
    padding: '16px',
    minHeight: '300px',
  },
  card: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #334155',
  },
  cardTitle: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  sectionHeader: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  distributionBar: {
    display: 'flex',
    height: '8px',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
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
  newsVsSocialBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  barLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    width: '60px',
  },
  barTrack: {
    flex: 1,
    height: '8px',
    background: '#334155',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  barValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    width: '30px',
    textAlign: 'right',
  },
  socialNote: {
    fontSize: '10px',
    color: '#f59e0b',
    marginTop: '8px',
    padding: '6px 8px',
    background: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '6px',
  },
  categoryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    borderBottom: '1px solid #334155',
  },
  categoryEmoji: {
    fontSize: '16px',
  },
  categoryName: {
    flex: 1,
    fontSize: '12px',
    color: 'white',
  },
  categoryScore: {
    fontSize: '14px',
    fontWeight: '700',
  },
  // Premium Lock styles
  premiumLock: {
    textAlign: 'center',
    padding: '32px 16px',
  },
  premiumLockIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  premiumLockTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '8px',
  },
  premiumLockDesc: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  premiumFeatureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 24px 0',
    textAlign: 'left',
  },
  premiumFeatureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: '13px',
    color: '#d1d5db',
  },
  premiumFeatureCheck: {
    color: '#22c55e',
    fontWeight: '700',
  },
  premiumButton: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  // Archive styles
  archiveContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  archiveHeader: {
    marginBottom: '16px',
  },
  archiveTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '4px',
  },
  archiveDesc: {
    fontSize: '12px',
    color: '#64748b',
  },
  archiveSection: {
    marginBottom: '16px',
  },
  archiveSectionTitle: {
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  archiveItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px',
    background: '#1e293b',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid #334155',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  },
  archiveItemSelected: {
    borderColor: '#a855f7',
    background: 'rgba(168, 85, 247, 0.1)',
  },
  archiveItemDate: {
    fontSize: '10px',
    color: '#64748b',
  },
  archiveItemTitle: {
    fontSize: '13px',
    color: 'white',
    fontWeight: '500',
  },
  archiveItemBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '2px 6px',
    background: '#22c55e',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '700',
    color: 'white',
  },
  noReports: {
    textAlign: 'center',
    padding: '32px',
    color: '#64748b',
    fontSize: '13px',
  },
  // Report styles
  reportContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  reportHeader: {
    textAlign: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #334155',
  },
  reportDate: {
    fontSize: '11px',
    color: '#a855f7',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  reportTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.4',
  },
  reportSummary: {
    fontSize: '13px',
    color: '#d1d5db',
    lineHeight: '1.6',
    padding: '12px',
    background: '#1e293b',
    borderRadius: '8px',
    borderLeft: '3px solid #a855f7',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  metricCard: {
    textAlign: 'center',
    padding: '12px 8px',
    background: '#1e293b',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
    display: 'block',
  },
  metricLabel: {
    fontSize: '9px',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  reportSection: {
    marginTop: '16px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#a855f7',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  insightCard: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    background: '#1e293b',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid #334155',
  },
  insightIcon: {
    fontSize: '20px',
  },
  insightTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '4px',
  },
  insightDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
  controversyCard: {
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    marginBottom: '8px',
    borderLeft: '3px solid #ef4444',
  },
  controversyTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#f87171',
    marginBottom: '4px',
  },
  controversyDesc: {
    fontSize: '12px',
    color: '#d1d5db',
    lineHeight: '1.5',
  },
  quoteCard: {
    padding: '12px',
    background: '#1e293b',
    borderRadius: '8px',
    marginBottom: '8px',
    borderLeft: '3px solid #3b82f6',
  },
  quoteText: {
    fontSize: '13px',
    color: '#d1d5db',
    fontStyle: 'italic',
    lineHeight: '1.5',
    marginBottom: '8px',
  },
  quoteSource: {
    fontSize: '11px',
    color: '#64748b',
  },
  recommendationCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: '#1e293b',
    borderRadius: '8px',
    marginBottom: '6px',
    border: '1px solid #334155',
  },
  recommendationPriority: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '700',
    color: 'white',
  },
  recommendationText: {
    fontSize: '12px',
    color: '#d1d5db',
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid #334155',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '9px',
    color: '#475569',
  },
};
