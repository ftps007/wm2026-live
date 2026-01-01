import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ============================================
// CONSTANTS & TRANSLATIONS
// ============================================

const EMOTION_CONFIG = {
  joy: { emoji: '😊', color: '#22c55e', colorLight: 'rgba(34, 197, 94, 0.2)', de: 'Freude', en: 'Joy' },
  trust: { emoji: '🤝', color: '#3b82f6', colorLight: 'rgba(59, 130, 246, 0.2)', de: 'Vertrauen', en: 'Trust' },
  fear: { emoji: '😰', color: '#8b5cf6', colorLight: 'rgba(139, 92, 246, 0.2)', de: 'Angst', en: 'Fear' },
  surprise: { emoji: '😲', color: '#f59e0b', colorLight: 'rgba(245, 158, 11, 0.2)', de: 'Überraschung', en: 'Surprise' },
  sadness: { emoji: '😢', color: '#6b7280', colorLight: 'rgba(107, 114, 128, 0.2)', de: 'Trauer', en: 'Sadness' },
  disgust: { emoji: '🤢', color: '#84cc16', colorLight: 'rgba(132, 204, 22, 0.2)', de: 'Ekel', en: 'Disgust' },
  anger: { emoji: '😡', color: '#ef4444', colorLight: 'rgba(239, 68, 68, 0.2)', de: 'Wut', en: 'Anger' },
  anticipation: { emoji: '🤞', color: '#ec4899', colorLight: 'rgba(236, 72, 153, 0.2)', de: 'Erwartung', en: 'Anticipation' },
};

const WEATHER_ICONS = {
  joy: '☀️',
  trust: '🌤️',
  fear: '🌧️',
  surprise: '⚡',
  sadness: '🌧️',
  disgust: '🌫️',
  anger: '🔥',
  anticipation: '🌊',
};

const TRANSLATIONS = {
  de: {
    emotionalWeather: 'Emotionale Wetterkarte',
    dominantMood: 'Gesamt-Stimmung',
    emotions: 'Emotionen',
    trending: 'Trend',
    aspectAnalysis: 'Aspekt-Analyse',
    topPositive: 'Top Positiv',
    topNegative: 'Top Negativ',
    mentions: 'Erwähnungen',
    sentiment: 'Sentiment',
    emotion: 'Emotion',
    drivers: 'Sentiment-Treiber',
    positiveDrivers: 'Positive Treiber',
    negativeDrivers: 'Negative Treiber',
    impact: 'Impact',
    topicMatrix: 'Topic-Sentiment-Matrix',
    category: 'Kategorie',
    drillDown: 'Details anzeigen',
    narratives: 'Erkannte Narrative',
    confidence: 'Konfidenz',
    alerts: 'Alerts',
    noAlerts: 'Keine aktiven Alerts',
    whyNegative: 'Warum negativ?',
    whyPositive: 'Warum positiv?',
    emotionRadar: 'Emotions-Radar',
    countryEmotions: 'Emotionen nach Land',
    aspectTimeline: 'Aspekt-Zeitverlauf',
    selectAspect: 'Aspekt wählen',
    last7Days: 'Letzte 7 Tage',
    veryPositive: 'Überwiegend Positiv',
    positive: 'Positiv',
    neutral: 'Neutral',
    negative: 'Negativ',
    veryNegative: 'Sehr Negativ',
    loading: 'Lädt...',
    premiumFeature: 'Premium-Feature',
    unlockPremium: 'Premium freischalten',
  },
  en: {
    emotionalWeather: 'Emotional Weather Map',
    dominantMood: 'Overall Mood',
    emotions: 'Emotions',
    trending: 'Trend',
    aspectAnalysis: 'Aspect Analysis',
    topPositive: 'Top Positive',
    topNegative: 'Top Negative',
    mentions: 'Mentions',
    sentiment: 'Sentiment',
    emotion: 'Emotion',
    drivers: 'Sentiment Drivers',
    positiveDrivers: 'Positive Drivers',
    negativeDrivers: 'Negative Drivers',
    impact: 'Impact',
    topicMatrix: 'Topic-Sentiment Matrix',
    category: 'Category',
    drillDown: 'Show Details',
    narratives: 'Detected Narratives',
    confidence: 'Confidence',
    alerts: 'Alerts',
    noAlerts: 'No active alerts',
    whyNegative: 'Why negative?',
    whyPositive: 'Why positive?',
    emotionRadar: 'Emotion Radar',
    countryEmotions: 'Emotions by Country',
    aspectTimeline: 'Aspect Timeline',
    selectAspect: 'Select Aspect',
    last7Days: 'Last 7 Days',
    veryPositive: 'Very Positive',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    veryNegative: 'Very Negative',
    loading: 'Loading...',
    premiumFeature: 'Premium Feature',
    unlockPremium: 'Unlock Premium',
  },
};

// ============================================
// 1. EMOTIONAL WEATHER MAP
// ============================================

export function EmotionalWeatherMap({ lang = 'de', isPremium = false }) {
  const [emotions, setEmotions] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetchEmotions();
  }, []);

  async function fetchEmotions() {
    try {
      const { data } = await supabase
        .from('wm2026_sentiment_emotions')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();
      
      setEmotions(data);
    } catch (error) {
      console.error('Error fetching emotions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-64" />;
  }

  if (!emotions) {
    return null;
  }

  const getOverallMood = () => {
    const { dominant_emotion, joy, anger, fear, anticipation } = emotions;
    if (joy > 0.5 && anticipation > 0.5) return { icon: '☀️', label: t.veryPositive };
    if (joy > 0.4) return { icon: '🌤️', label: t.positive };
    if (anger > 0.5 || fear > 0.4) return { icon: '🌧️', label: t.negative };
    return { icon: '⛅', label: t.neutral };
  };

  const mood = getOverallMood();
  const emotionEntries = Object.entries(EMOTION_CONFIG).map(([key, config]) => ({
    key,
    ...config,
    value: emotions[key] || 0,
    trend: emotions[`trend_${key}`] || 'stable',
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🌡️ {t.emotionalWeather}
        </h3>
        <span className="text-xs text-slate-400">
          {new Date(emotions.date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US')}
        </span>
      </div>

      {/* Overall Mood */}
      <div className="text-center mb-6 p-4 bg-slate-700/50 rounded-lg">
        <div className="text-5xl mb-2">{mood.icon}</div>
        <div className="text-white font-medium">{t.dominantMood}</div>
        <div className="text-2xl font-bold text-white">{mood.label}</div>
      </div>

      {/* Emotion Bars */}
      <div className="space-y-3">
        {emotionEntries.map(emotion => (
          <div key={emotion.key} className="flex items-center gap-3">
            <span className="text-lg w-6">{emotion.emoji}</span>
            <span className="text-slate-300 text-sm w-24">{emotion[lang]}</span>
            <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${emotion.value * 100}%`,
                  backgroundColor: emotion.color,
                }}
              />
            </div>
            <span className="text-white font-mono text-sm w-12 text-right">
              {Math.round(emotion.value * 100)}%
            </span>
            <span className="text-sm w-6">
              {emotion.trend === 'up' ? '↑' : emotion.trend === 'down' ? '↓' : '→'}
            </span>
          </div>
        ))}
      </div>

      {/* Alert Banner */}
      {emotions.anger > 0.6 && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <span>⚠️</span>
            <span className="text-sm font-medium">
              {lang === 'de' 
                ? 'Erhöhte Wut-Levels erkannt' 
                : 'Elevated anger levels detected'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 2. ASPECT SENTIMENT DRILLDOWN
// ============================================

export function AspectSentimentDrilldown({ lang = 'de', isPremium = false, categoryFilter = null }) {
  const [aspects, setAspects] = useState([]);
  const [selectedAspect, setSelectedAspect] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetchAspects();
  }, [categoryFilter]);

  async function fetchAspects() {
    try {
      let query = supabase
        .from('wm2026_sentiment_aspects')
        .select('*')
        .order('mention_count', { ascending: false })
        .limit(20);
      
      if (categoryFilter) {
        query = query.eq('category_key', categoryFilter);
      }
      
      const { data } = await query;
      setAspects(data || []);
    } catch (error) {
      console.error('Error fetching aspects:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isPremium) {
    return <PremiumLock lang={lang} feature={t.aspectAnalysis} />;
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-64" />;
  }

  const getSentimentColor = (score) => {
    if (score > 0.3) return 'text-green-400';
    if (score < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentBg = (score) => {
    if (score > 0.3) return 'bg-green-500/20 border-green-500/50';
    if (score < -0.3) return 'bg-red-500/20 border-red-500/50';
    return 'bg-yellow-500/20 border-yellow-500/50';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        🔍 {t.aspectAnalysis}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aspects List */}
        <div className="space-y-2">
          {aspects.map(aspect => (
            <div
              key={aspect.id}
              onClick={() => setSelectedAspect(aspect)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedAspect?.id === aspect.id
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{aspect.aspect_text}</span>
                <span className={`font-mono font-bold ${getSentimentColor(aspect.sentiment_score)}`}>
                  {aspect.sentiment_score > 0 ? '+' : ''}{aspect.sentiment_score?.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>{aspect.mention_count} {t.mentions}</span>
                {aspect.dominant_emotion && (
                  <span className="flex items-center gap-1">
                    {EMOTION_CONFIG[aspect.dominant_emotion]?.emoji}
                    {EMOTION_CONFIG[aspect.dominant_emotion]?.[lang]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Aspect Detail */}
        <div className={`p-4 rounded-lg border ${selectedAspect ? getSentimentBg(selectedAspect.sentiment_score) : 'bg-slate-700/50 border-slate-600'}`}>
          {selectedAspect ? (
            <div>
              <div className="text-2xl font-bold text-white mb-2">
                {selectedAspect.aspect_text}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">{t.sentiment}</div>
                  <div className={`text-2xl font-bold ${getSentimentColor(selectedAspect.sentiment_score)}`}>
                    {selectedAspect.sentiment_score > 0 ? '+' : ''}{(selectedAspect.sentiment_score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">{t.emotion}</div>
                  <div className="text-2xl">
                    {EMOTION_CONFIG[selectedAspect.dominant_emotion]?.emoji || '😐'}
                    <span className="text-white ml-2 text-lg">
                      {EMOTION_CONFIG[selectedAspect.dominant_emotion]?.[lang] || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg mb-4">
                <div className="text-xs text-slate-400 mb-1">
                  {selectedAspect.sentiment_score < 0 ? t.whyNegative : t.whyPositive}
                </div>
                <div className="text-sm text-slate-200">
                  {selectedAspect.sample_context || 'Kein Kontext verfügbar'}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>📊 {selectedAspect.mention_count} {t.mentions}</span>
                <span>🎯 {Math.round(selectedAspect.confidence * 100)}% {t.confidence}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              {lang === 'de' ? 'Wähle einen Aspekt für Details' : 'Select an aspect for details'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 3. TOPIC-SENTIMENT MATRIX
// ============================================

export function TopicSentimentMatrix({ lang = 'de', isPremium = false }) {
  const [matrix, setMatrix] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  const CATEGORY_CONFIG = {
    general: { emoji: '📰', de: 'Allgemein', en: 'General' },
    sporting: { emoji: '⚽', de: 'Sport', en: 'Sporting' },
    ticketing: { emoji: '🎫', de: 'Tickets', en: 'Ticketing' },
    business: { emoji: '💰', de: 'Business', en: 'Business' },
    fans: { emoji: '🎉', de: 'Fan-Erlebnis', en: 'Fan Experience' },
    infrastructure: { emoji: '🏗️', de: 'Infrastruktur', en: 'Infrastructure' },
    political: { emoji: '🌡️', de: 'Politik/Soziales', en: 'Political/Social' },
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  async function fetchMatrix() {
    try {
      const { data } = await supabase
        .from('wm2026_topic_matrix')
        .select('*')
        .order('articles_count', { ascending: false });
      
      setMatrix(data || []);
    } catch (error) {
      console.error('Error fetching matrix:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isPremium) {
    return <PremiumLock lang={lang} feature={t.topicMatrix} />;
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-64" />;
  }

  const getScoreColor = (score) => {
    if (score >= 60) return 'bg-green-500';
    if (score >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        📊 {t.topicMatrix}
      </h3>

      <div className="space-y-3">
        {matrix.map(item => {
          const config = CATEGORY_CONFIG[item.category_key] || { emoji: '📁', de: item.category_key, en: item.category_key };
          const isExpanded = expandedCategory === item.category_key;
          
          return (
            <div key={item.id} className="bg-slate-700/50 rounded-lg overflow-hidden">
              {/* Header Row */}
              <div
                onClick={() => setExpandedCategory(isExpanded ? null : item.category_key)}
                className="p-4 cursor-pointer hover:bg-slate-700/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{config.emoji}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{config[lang]}</div>
                    <div className="text-xs text-slate-400">
                      {item.articles_count} {t.mentions} • {item.overall_emotion && EMOTION_CONFIG[item.overall_emotion]?.[lang]}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${getScoreColor(item.overall_score)} flex items-center justify-center text-white font-bold text-lg`}>
                      {item.overall_score}
                    </div>
                    <span className="text-slate-400">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-600 bg-slate-800/50">
                  {/* Insight */}
                  {item[`insight_${lang}`] && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="text-blue-400 text-sm">
                        💡 {item[`insight_${lang}`]}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Top Positive */}
                    <div>
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                        <span className="text-green-400">▲</span> {t.topPositive}
                      </div>
                      <div className="space-y-1">
                        {(item.top_positive_aspects || []).map((asp, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{asp.aspect}</span>
                            <span className="text-green-400 font-mono">+{(asp.score * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                        {(!item.top_positive_aspects || item.top_positive_aspects.length === 0) && (
                          <div className="text-slate-500 text-sm">-</div>
                        )}
                      </div>
                    </div>

                    {/* Top Negative */}
                    <div>
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                        <span className="text-red-400">▼</span> {t.topNegative}
                      </div>
                      <div className="space-y-1">
                        {(item.top_negative_aspects || []).map((asp, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{asp.aspect}</span>
                            <span className="text-red-400 font-mono">{(asp.score * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                        {(!item.top_negative_aspects || item.top_negative_aspects.length === 0) && (
                          <div className="text-slate-500 text-sm">-</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Emotion Distribution */}
                  {item.emotion_distribution && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <div className="text-xs text-slate-400 mb-2">{t.emotions}</div>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(item.emotion_distribution)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 4)
                          .map(([emotion, value]) => (
                            <span
                              key={emotion}
                              className="px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: EMOTION_CONFIG[emotion]?.colorLight }}
                            >
                              {EMOTION_CONFIG[emotion]?.emoji} {Math.round(value * 100)}%
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 4. SENTIMENT DRIVERS
// ============================================

export function SentimentDrivers({ lang = 'de', isPremium = false }) {
  const [drivers, setDrivers] = useState({ positive: [], negative: [] });
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    try {
      const { data } = await supabase
        .from('wm2026_sentiment_drivers')
        .select('*')
        .order('impact_score', { ascending: false })
        .limit(20);
      
      const positive = (data || []).filter(d => d.direction === 'positive').slice(0, 5);
      const negative = (data || []).filter(d => d.direction === 'negative').slice(0, 5);
      
      setDrivers({ positive, negative });
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isPremium) {
    return <PremiumLock lang={lang} feature={t.drivers} />;
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-48" />;
  }

  const maxImpact = Math.max(
    ...drivers.positive.map(d => Math.abs(d.impact_score)),
    ...drivers.negative.map(d => Math.abs(d.impact_score)),
    1
  );

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        🎯 {t.drivers}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Drivers */}
        <div>
          <div className="text-sm text-green-400 mb-3 flex items-center gap-2">
            <span>▲</span> {t.positiveDrivers}
          </div>
          <div className="space-y-2">
            {drivers.positive.map((driver, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-white text-sm">{driver.aspect_text}</div>
                  <div className="h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(driver.impact_score / maxImpact) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-green-400 font-mono text-sm w-16 text-right">
                  +{driver.impact_score.toFixed(1)}
                </span>
                {driver.dominant_emotion && (
                  <span className="text-lg">
                    {EMOTION_CONFIG[driver.dominant_emotion]?.emoji}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Negative Drivers */}
        <div>
          <div className="text-sm text-red-400 mb-3 flex items-center gap-2">
            <span>▼</span> {t.negativeDrivers}
          </div>
          <div className="space-y-2">
            {drivers.negative.map((driver, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-white text-sm">{driver.aspect_text}</div>
                  <div className="h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(Math.abs(driver.impact_score) / maxImpact) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-red-400 font-mono text-sm w-16 text-right">
                  {driver.impact_score.toFixed(1)}
                </span>
                {driver.dominant_emotion && (
                  <span className="text-lg">
                    {EMOTION_CONFIG[driver.dominant_emotion]?.emoji}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 5. NARRATIVE DETECTION
// ============================================

export function NarrativeDetection({ lang = 'de', isPremium = false }) {
  const [narratives, setNarratives] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  const NARRATIVE_ICONS = {
    underdog_hope: '🌟',
    outrage_cycle: '🔥',
    hype_building: '🚀',
    anxiety_narrative: '😰',
  };

  useEffect(() => {
    fetchNarratives();
  }, []);

  async function fetchNarratives() {
    try {
      const { data } = await supabase
        .from('wm2026_narratives')
        .select('*')
        .order('confidence', { ascending: false })
        .limit(5);
      
      setNarratives(data || []);
    } catch (error) {
      console.error('Error fetching narratives:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isPremium) {
    return <PremiumLock lang={lang} feature={t.narratives} />;
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-48" />;
  }

  if (narratives.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        📖 {t.narratives}
      </h3>

      <div className="space-y-4">
        {narratives.map(narrative => (
          <div
            key={narrative.id}
            className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                {NARRATIVE_ICONS[narrative.narrative_key] || '📊'}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">
                    {narrative[`narrative_name_${lang}`]}
                  </div>
                  <div className="text-sm text-slate-400">
                    {Math.round(narrative.confidence * 100)}% {t.confidence}
                  </div>
                </div>
                <div className="text-slate-300 text-sm mt-1">
                  {narrative[`description_${lang}`]}
                </div>
                
                {/* Emotion Signature */}
                {narrative.emotion_signature && (
                  <div className="flex gap-2 mt-3">
                    {Object.entries(narrative.emotion_signature)
                      .sort(([,a], [,b]) => b - a)
                      .map(([emotion, value]) => (
                        <span
                          key={emotion}
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: EMOTION_CONFIG[emotion]?.colorLight }}
                        >
                          {EMOTION_CONFIG[emotion]?.emoji} {EMOTION_CONFIG[emotion]?.[lang]}
                        </span>
                      ))
                    }
                  </div>
                )}

                {/* Detected In */}
                {narrative.detected_in && narrative.detected_in.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {narrative.detected_in.map((keyword, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-600 rounded text-xs text-slate-300">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 6. ALERTS COMPONENT
// ============================================

export function SentimentAlerts({ lang = 'de', isPremium = false }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const { data } = await supabase
        .from('wm2026_sentiment_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isPremium) {
    return null;
  }

  if (loading || alerts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500/20';
      case 'high': return 'border-orange-500 bg-orange-500/20';
      case 'medium': return 'border-yellow-500 bg-yellow-500/20';
      default: return 'border-blue-500 bg-blue-500/20';
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        ⚠️ {t.alerts}
      </h3>
      <div className="space-y-2">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-white">
                {alert[`title_${lang}`]}
              </div>
              <span className="text-xs text-slate-400 uppercase">
                {alert.severity}
              </span>
            </div>
            <div className="text-sm text-slate-300 mt-1">
              {alert[`message_${lang}`]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 7. EMOTION RADAR CHART (SVG)
// ============================================

export function EmotionRadar({ emotions, size = 200, lang = 'de' }) {
  if (!emotions) return null;

  const emotionKeys = ['joy', 'anticipation', 'trust', 'surprise', 'fear', 'sadness', 'disgust', 'anger'];
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2 - 30;

  // Calculate points for the radar
  const points = emotionKeys.map((key, index) => {
    const angle = (index / emotionKeys.length) * 2 * Math.PI - Math.PI / 2;
    const value = emotions[key] || 0;
    const radius = value * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      label: EMOTION_CONFIG[key]?.[lang],
      emoji: EMOTION_CONFIG[key]?.emoji,
      value,
      labelX: centerX + (maxRadius + 20) * Math.cos(angle),
      labelY: centerY + (maxRadius + 20) * Math.sin(angle),
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map(ratio => maxRadius * ratio);

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid circles */}
      {gridCircles.map((r, i) => (
        <circle
          key={i}
          cx={centerX}
          cy={centerY}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}

      {/* Grid lines */}
      {emotionKeys.map((_, i) => {
        const angle = (i / emotionKeys.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={centerX + maxRadius * Math.cos(angle)}
            y2={centerY + maxRadius * Math.sin(angle)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <path
        d={pathD}
        fill="rgba(59, 130, 246, 0.3)"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#3b82f6"
          stroke="white"
          strokeWidth="1"
        />
      ))}

      {/* Labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-slate-300"
        >
          {p.emoji}
        </text>
      ))}
    </svg>
  );
}

// ============================================
// PREMIUM LOCK COMPONENT
// ============================================

function PremiumLock({ lang = 'de', feature }) {
  const t = TRANSLATIONS[lang];
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90" />
      <div className="relative z-10 text-center py-8">
        <div className="text-4xl mb-3">🔒</div>
        <div className="text-white font-semibold mb-1">{t.premiumFeature}</div>
        <div className="text-slate-400 text-sm mb-4">{feature}</div>
        <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity">
          {t.unlockPremium}
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export default function SentimentAdvancedDashboard({ lang = 'de', isPremium = false }) {
  return (
    <div className="space-y-6">
      {/* Alerts at top */}
      <SentimentAlerts lang={lang} isPremium={isPremium} />
      
      {/* Emotional Weather Map - Always visible */}
      <EmotionalWeatherMap lang={lang} isPremium={isPremium} />
      
      {/* Two-column layout for premium features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopicSentimentMatrix lang={lang} isPremium={isPremium} />
        <SentimentDrivers lang={lang} isPremium={isPremium} />
      </div>
      
      {/* Aspect Analysis - Full width */}
      <AspectSentimentDrilldown lang={lang} isPremium={isPremium} />
      
      {/* Narratives */}
      <NarrativeDetection lang={lang} isPremium={isPremium} />
    </div>
  );
}
