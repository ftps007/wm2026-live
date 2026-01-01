// =====================================================
// WM 2026 SENTIMENT ANALYSIS - ADVANCED API
// Emotion Detection + Aspect-Based + Topic-Matrix
// =====================================================
// Endpoint: /api/sentiment-advanced-update
// This extends the base sentiment with emotions, aspects, and matrices

import { createClient } from '@supabase/supabase-js';

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Hugging Face Models
  MODELS: {
    // Base sentiment (existing)
    SENTIMENT: 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual',
    // Emotion detection
    EMOTION: 'j-hartmann/emotion-english-distilroberta-base',
    // Aspect-based sentiment (alternative: use base + NER)
    NER: 'dslim/bert-base-NER',
  },
  
  HF_API_URL: 'https://api-inference.huggingface.co/models/',
  HF_API_KEY: process.env.HUGGINGFACE_API_KEY,
  
  // Batch sizes
  BATCH_SIZE: 10,
  MAX_ARTICLES: 500, // Limit for advanced analysis (cost control)
  
  // Aspect extraction keywords (for rule-based backup)
  ASPECT_PATTERNS: {
    price: ['preis', 'price', 'kosten', 'cost', 'teuer', 'expensive', 'günstig', 'cheap', 'euro', 'dollar', '€', '$'],
    venue: ['stadion', 'stadium', 'arena', 'venue', 'spielort', 'metlife', 'azteca', 'sofi', 'hard rock'],
    person: ['messi', 'mbappé', 'mbappe', 'haaland', 'musiala', 'wirtz', 'bellingham', 'ronaldo', 'kane', 'vinicius', 'müller', 'nagelsmann', 'infantino'],
    team: ['deutschland', 'germany', 'argentina', 'france', 'frankreich', 'brazil', 'brasilien', 'england', 'spain', 'spanien', 'usa', 'mexico', 'mexiko'],
    organization: ['fifa', 'dfb', 'uefa', 'conmebol', 'concacaf'],
    topic: ['ticket', 'visa', 'hotel', 'flug', 'flight', 'transport', 'sicherheit', 'security', 'auslosung', 'draw', 'qualifikation', 'qualification'],
  },
  
  // Category mapping for aspects
  ASPECT_TO_CATEGORY: {
    'ticketpreise': 'ticketing',
    'ticketpreis': 'ticketing',
    'ticket': 'ticketing',
    'tickets': 'ticketing',
    'kartenpreise': 'ticketing',
    'stadion': 'infrastructure',
    'stadien': 'infrastructure',
    'stadium': 'infrastructure',
    'transport': 'infrastructure',
    'flughafen': 'infrastructure',
    'hotel': 'fans',
    'hotels': 'fans',
    'unterkunft': 'fans',
    'visa': 'fans',
    'reise': 'fans',
    'kosten': 'fans',
    'atmosphäre': 'fans',
    'messi': 'sporting',
    'musiala': 'sporting',
    'wirtz': 'sporting',
    'deutschland': 'sporting',
    'gruppenauslosung': 'sporting',
    'qualifikation': 'sporting',
    'fifa': 'political',
    'infantino': 'political',
    'sponsor': 'business',
    'tv-rechte': 'business',
    'übertragung': 'business',
  },
  
  // Narrative patterns
  NARRATIVE_PATTERNS: {
    underdog_hope: {
      name_de: 'Außenseiter-Hoffnung',
      name_en: 'Underdog Hope',
      emotion_signature: { anticipation: 0.7, fear: 0.4, joy: 0.5 },
      keywords: ['überraschung', 'surprise', 'chance', 'hoffnung', 'hope', 'außenseiter', 'underdog'],
    },
    outrage_cycle: {
      name_de: 'Empörungs-Spirale',
      name_en: 'Outrage Cycle',
      emotion_signature: { anger: 0.75, disgust: 0.6, sadness: 0.3 },
      keywords: ['skandal', 'scandal', 'wut', 'anger', 'protest', 'boykott', 'boycott', 'kritik', 'criticism'],
    },
    hype_building: {
      name_de: 'Hype-Aufbau',
      name_en: 'Hype Building',
      emotion_signature: { joy: 0.75, anticipation: 0.85, trust: 0.5 },
      keywords: ['countdown', 'vorfreude', 'excitement', 'bereit', 'ready', 'bald', 'soon', 'warten', 'waiting'],
    },
    anxiety_narrative: {
      name_de: 'Sorgen-Narrativ',
      name_en: 'Anxiety Narrative',
      emotion_signature: { fear: 0.7, anticipation: 0.5, sadness: 0.4 },
      keywords: ['sorge', 'worry', 'angst', 'fear', 'unsicher', 'uncertain', 'risiko', 'risk'],
    },
  },
};

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ==================== HUGGING FACE API CALLS ====================

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
        // Model loading, wait and retry
        console.log(`Model ${model} loading, waiting...`);
        await new Promise(r => setTimeout(r, 20000));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HF API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`HF API attempt ${attempt + 1} failed:`, error.message);
      if (attempt === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// ==================== EMOTION DETECTION ====================

async function detectEmotions(texts) {
  // Batch processing
  const results = [];
  
  for (let i = 0; i < texts.length; i += CONFIG.BATCH_SIZE) {
    const batch = texts.slice(i, i + CONFIG.BATCH_SIZE);
    
    try {
      const response = await callHuggingFaceAPI(CONFIG.MODELS.EMOTION, batch);
      
      // Process response - emotion model returns [{label, score}] for each text
      for (const prediction of response) {
        const emotions = {
          joy: 0, trust: 0, fear: 0, surprise: 0,
          sadness: 0, disgust: 0, anger: 0, anticipation: 0,
        };
        
        // Map model output to Plutchik's emotions
        if (Array.isArray(prediction)) {
          for (const p of prediction) {
            const label = p.label.toLowerCase();
            const score = p.score;
            
            // Model outputs: anger, disgust, fear, joy, neutral, sadness, surprise
            if (label === 'joy' || label === 'happiness') emotions.joy = score;
            else if (label === 'anger') emotions.anger = score;
            else if (label === 'fear') emotions.fear = score;
            else if (label === 'sadness') emotions.sadness = score;
            else if (label === 'surprise') emotions.surprise = score;
            else if (label === 'disgust') emotions.disgust = score;
            // Map neutral to low anticipation (placeholder)
            else if (label === 'neutral') emotions.anticipation = score * 0.3;
          }
        }
        
        results.push(emotions);
      }
    } catch (error) {
      console.warn('Emotion detection batch failed:', error.message);
      // Fill with neutral emotions on error
      for (let j = 0; j < batch.length; j++) {
        results.push({
          joy: 0.2, trust: 0.2, fear: 0.1, surprise: 0.1,
          sadness: 0.1, disgust: 0.1, anger: 0.1, anticipation: 0.2,
        });
      }
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  
  return results;
}

// Aggregate emotions from multiple articles
function aggregateEmotions(emotionsList) {
  const totals = {
    joy: 0, trust: 0, fear: 0, surprise: 0,
    sadness: 0, disgust: 0, anger: 0, anticipation: 0,
  };
  
  if (emotionsList.length === 0) return totals;
  
  for (const emotions of emotionsList) {
    for (const [key, value] of Object.entries(emotions)) {
      totals[key] += value;
    }
  }
  
  // Average
  for (const key of Object.keys(totals)) {
    totals[key] = parseFloat((totals[key] / emotionsList.length).toFixed(3));
  }
  
  return totals;
}

// Get dominant emotion
function getDominantEmotion(emotions) {
  let dominant = 'neutral';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(emotions)) {
    if (score > maxScore) {
      maxScore = score;
      dominant = emotion;
    }
  }
  
  return { emotion: dominant, score: maxScore };
}

// Get secondary emotion
function getSecondaryEmotion(emotions, dominantEmotion) {
  let secondary = 'neutral';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(emotions)) {
    if (emotion !== dominantEmotion && score > maxScore) {
      maxScore = score;
      secondary = emotion;
    }
  }
  
  return { emotion: secondary, score: maxScore };
}

// ==================== ASPECT EXTRACTION ====================

function extractAspects(text) {
  const aspects = [];
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  // Rule-based extraction using patterns
  for (const [aspectType, keywords] of Object.entries(CONFIG.ASPECT_PATTERNS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Find the actual word in original text for proper casing
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
          for (const match of matches) {
            const normalized = match.toLowerCase();
            
            // Avoid duplicates
            if (!aspects.some(a => a.normalized === normalized)) {
              aspects.push({
                text: match,
                normalized: normalized,
                type: aspectType,
                category: CONFIG.ASPECT_TO_CATEGORY[normalized] || guessCategory(aspectType),
              });
            }
          }
        }
      }
    }
  }
  
  // Limit to top 5 aspects per article to avoid noise
  return aspects.slice(0, 5);
}

function guessCategory(aspectType) {
  const mapping = {
    price: 'ticketing',
    venue: 'infrastructure',
    person: 'sporting',
    team: 'sporting',
    organization: 'political',
    topic: 'general',
  };
  return mapping[aspectType] || 'general';
}

// Extract context around aspect (for display)
function extractContext(text, aspect, windowSize = 50) {
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(aspect.toLowerCase());
  
  if (index === -1) return '';
  
  const start = Math.max(0, index - windowSize);
  const end = Math.min(text.length, index + aspect.length + windowSize);
  
  let context = text.slice(start, end);
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  return context;
}

// ==================== ASPECT SENTIMENT ====================

async function getAspectSentiment(text, aspect) {
  // Create aspect-focused input
  const aspectContext = extractContext(text, aspect.text, 100);
  
  try {
    const response = await callHuggingFaceAPI(CONFIG.MODELS.SENTIMENT, aspectContext);
    
    // Parse sentiment
    if (Array.isArray(response) && response[0]) {
      const predictions = response[0];
      let score = 0;
      let label = 'neutral';
      
      for (const p of predictions) {
        if (p.label === 'positive') score += p.score;
        else if (p.label === 'negative') score -= p.score;
      }
      
      if (score > 0.1) label = 'positive';
      else if (score < -0.1) label = 'negative';
      
      return {
        score: parseFloat(score.toFixed(3)),
        label: label,
        confidence: Math.max(...predictions.map(p => p.score)),
      };
    }
  } catch (error) {
    console.warn('Aspect sentiment failed:', error.message);
  }
  
  return { score: 0, label: 'neutral', confidence: 0.5 };
}

// ==================== TOPIC-SENTIMENT MATRIX ====================

function buildTopicMatrix(aspects, emotions) {
  const matrix = {};
  
  // Group aspects by category
  for (const aspect of aspects) {
    const category = aspect.category || 'general';
    
    if (!matrix[category]) {
      matrix[category] = {
        aspects: [],
        sentiments: [],
        emotions: [],
      };
    }
    
    matrix[category].aspects.push(aspect);
    if (aspect.sentiment) {
      matrix[category].sentiments.push(aspect.sentiment.score);
    }
    if (aspect.emotions) {
      matrix[category].emotions.push(aspect.emotions);
    }
  }
  
  // Calculate aggregates per category
  const result = {};
  
  for (const [category, data] of Object.entries(matrix)) {
    const avgSentiment = data.sentiments.length > 0
      ? data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length
      : 0;
    
    const avgEmotions = data.emotions.length > 0
      ? aggregateEmotions(data.emotions)
      : null;
    
    // Find top positive and negative aspects
    const sortedAspects = data.aspects
      .filter(a => a.sentiment)
      .sort((a, b) => b.sentiment.score - a.sentiment.score);
    
    const topPositive = sortedAspects
      .filter(a => a.sentiment.score > 0)
      .slice(0, 3)
      .map(a => ({
        aspect: a.text,
        score: a.sentiment.score,
        mentions: a.mentions || 1,
      }));
    
    const topNegative = sortedAspects
      .filter(a => a.sentiment.score < 0)
      .slice(-3)
      .reverse()
      .map(a => ({
        aspect: a.text,
        score: a.sentiment.score,
        mentions: a.mentions || 1,
      }));
    
    result[category] = {
      overall_score: Math.round((avgSentiment + 1) * 50), // Convert to 0-100
      overall_emotion: avgEmotions ? getDominantEmotion(avgEmotions).emotion : null,
      top_positive_aspects: topPositive,
      top_negative_aspects: topNegative,
      emotion_distribution: avgEmotions,
      articles_count: data.aspects.length,
    };
  }
  
  return result;
}

// ==================== SENTIMENT DRIVERS ====================

function calculateSentimentDrivers(aspects) {
  // Calculate impact based on sentiment * mentions
  const drivers = aspects
    .filter(a => a.sentiment && a.mentions)
    .map(a => ({
      aspect_text: a.text,
      category_key: a.category,
      impact_score: parseFloat((a.sentiment.score * Math.log(a.mentions + 1)).toFixed(2)),
      direction: a.sentiment.score > 0 ? 'positive' : 'negative',
      mention_count: a.mentions,
      sentiment_score: a.sentiment.score,
      dominant_emotion: a.emotions ? getDominantEmotion(a.emotions).emotion : null,
    }))
    .sort((a, b) => Math.abs(b.impact_score) - Math.abs(a.impact_score));
  
  // Add rankings
  let positiveRank = 0;
  let negativeRank = 0;
  
  for (const driver of drivers) {
    if (driver.direction === 'positive') {
      driver.rank_positive = ++positiveRank;
      driver.rank_negative = null;
    } else {
      driver.rank_negative = ++negativeRank;
      driver.rank_positive = null;
    }
  }
  
  return drivers;
}

// ==================== NARRATIVE DETECTION ====================

function detectNarratives(aspects, aggregatedEmotions) {
  const narratives = [];
  
  for (const [key, pattern] of Object.entries(CONFIG.NARRATIVE_PATTERNS)) {
    // Check emotion signature match
    let emotionMatch = 0;
    let emotionTotal = 0;
    
    for (const [emotion, threshold] of Object.entries(pattern.emotion_signature)) {
      emotionTotal++;
      if (aggregatedEmotions[emotion] >= threshold * 0.7) {
        emotionMatch++;
      }
    }
    
    // Check keyword match
    const allAspectTexts = aspects.map(a => a.text.toLowerCase()).join(' ');
    const keywordMatches = pattern.keywords.filter(kw => allAspectTexts.includes(kw));
    
    // Calculate confidence
    const emotionConfidence = emotionMatch / emotionTotal;
    const keywordConfidence = keywordMatches.length > 0 ? Math.min(keywordMatches.length / 3, 1) : 0;
    const overallConfidence = (emotionConfidence * 0.6) + (keywordConfidence * 0.4);
    
    if (overallConfidence >= 0.4) {
      narratives.push({
        narrative_key: key,
        narrative_name_de: pattern.name_de,
        narrative_name_en: pattern.name_en,
        emotion_signature: pattern.emotion_signature,
        detected_in: keywordMatches,
        confidence: parseFloat(overallConfidence.toFixed(3)),
        description_de: generateNarrativeDescription(key, 'de'),
        description_en: generateNarrativeDescription(key, 'en'),
      });
    }
  }
  
  return narratives.sort((a, b) => b.confidence - a.confidence);
}

function generateNarrativeDescription(narrativeKey, lang) {
  const descriptions = {
    underdog_hope: {
      de: 'Hoffnung auf Überraschungen durch Außenseiter dominiert die Diskussion.',
      en: 'Hope for underdog surprises dominates the discussion.',
    },
    outrage_cycle: {
      de: 'Empörung und Kritik prägen die aktuelle Stimmung.',
      en: 'Outrage and criticism shape the current sentiment.',
    },
    hype_building: {
      de: 'Vorfreude und Begeisterung steigen mit dem Countdown.',
      en: 'Excitement and enthusiasm are building with the countdown.',
    },
    anxiety_narrative: {
      de: 'Sorgen und Unsicherheiten überwiegen in den Diskussionen.',
      en: 'Worries and uncertainties dominate the discussions.',
    },
  };
  
  return descriptions[narrativeKey]?.[lang] || '';
}

// ==================== ALERT GENERATION ====================

async function checkForAlerts(aspects, emotions, previousData) {
  const alerts = [];
  const today = new Date().toISOString().split('T')[0];
  
  // Check emotion spikes
  if (previousData?.emotions) {
    for (const [emotion, currentValue] of Object.entries(emotions)) {
      const previousValue = previousData.emotions[emotion] || 0;
      const change = currentValue - previousValue;
      
      if (Math.abs(change) > 0.15) {
        alerts.push({
          date: today,
          alert_type: change > 0 ? 'spike_positive' : 'spike_negative',
          severity: Math.abs(change) > 0.25 ? 'high' : 'medium',
          aspect_text: emotion,
          category_key: null,
          change_value: parseFloat(change.toFixed(3)),
          current_value: parseFloat(currentValue.toFixed(3)),
          previous_value: parseFloat(previousValue.toFixed(3)),
          trigger_reason: `${emotion} ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change * 100).toFixed(1)}%`,
          title_de: `${emotion.charAt(0).toUpperCase() + emotion.slice(1)}-${change > 0 ? 'Anstieg' : 'Rückgang'}`,
          title_en: `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} ${change > 0 ? 'Surge' : 'Drop'}`,
          message_de: `Die Emotion "${emotion}" hat sich um ${Math.abs(change * 100).toFixed(1)}% ${change > 0 ? 'erhöht' : 'verringert'}.`,
          message_en: `The emotion "${emotion}" has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change * 100).toFixed(1)}%.`,
        });
      }
    }
  }
  
  // Check aspect sentiment extremes
  for (const aspect of aspects) {
    if (aspect.sentiment && Math.abs(aspect.sentiment.score) > 0.7 && aspect.mentions > 50) {
      alerts.push({
        date: today,
        alert_type: aspect.sentiment.score > 0 ? 'trending_positive' : 'trending_negative',
        severity: aspect.mentions > 200 ? 'high' : 'medium',
        aspect_text: aspect.text,
        category_key: aspect.category,
        change_value: null,
        current_value: parseFloat(aspect.sentiment.score.toFixed(3)),
        previous_value: null,
        trigger_reason: `High ${aspect.sentiment.score > 0 ? 'positive' : 'negative'} sentiment with ${aspect.mentions} mentions`,
        title_de: `${aspect.text} trending`,
        title_en: `${aspect.text} trending`,
        message_de: `"${aspect.text}" zeigt starkes ${aspect.sentiment.score > 0 ? 'positives' : 'negatives'} Sentiment mit ${aspect.mentions} Erwähnungen.`,
        message_en: `"${aspect.text}" shows strong ${aspect.sentiment.score > 0 ? 'positive' : 'negative'} sentiment with ${aspect.mentions} mentions.`,
      });
    }
  }
  
  return alerts;
}

// ==================== GENERATE INSIGHTS ====================

function generateInsights(topicMatrix, emotions, drivers) {
  const insights = {};
  
  for (const [category, data] of Object.entries(topicMatrix)) {
    const topDriver = data.top_negative_aspects[0] || data.top_positive_aspects[0];
    
    if (topDriver && data.overall_emotion) {
      insights[category] = {
        insight_de: `${data.overall_emotion.charAt(0).toUpperCase() + data.overall_emotion.slice(1)} dominiert – "${topDriver.aspect}" ist Haupttreiber.`,
        insight_en: `${data.overall_emotion.charAt(0).toUpperCase() + data.overall_emotion.slice(1)} dominates – "${topDriver.aspect}" is the main driver.`,
      };
    }
  }
  
  return insights;
}

// ==================== MAIN HANDLER ====================

export default async function handler(req, res) {
  console.log('🚀 Starting ADVANCED sentiment analysis...');
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Step 1: Get today's base sentiment data and articles
    console.log('📊 Fetching base sentiment data...');
    
    const { data: baseData } = await supabase
      .from('wm2026_sentiment')
      .select('*')
      .eq('date', today)
      .single();
    
    if (!baseData) {
      return res.status(400).json({
        success: false,
        error: 'Base sentiment not found. Run base sentiment update first.',
      });
    }
    
    // Step 2: Get articles from cache or re-fetch
    // For demo, we'll use sample articles - in production, you'd fetch from cache
    const articles = await fetchSampleArticles();
    console.log(`📰 Processing ${articles.length} articles for advanced analysis...`);
    
    // Step 3: Emotion Detection
    console.log('😊 Detecting emotions...');
    const articleTexts = articles.map(a => `${a.title} ${a.description}`);
    const emotionResults = await detectEmotions(articleTexts.slice(0, CONFIG.MAX_ARTICLES));
    const aggregatedEmotions = aggregateEmotions(emotionResults);
    const dominant = getDominantEmotion(aggregatedEmotions);
    const secondary = getSecondaryEmotion(aggregatedEmotions, dominant.emotion);
    
    console.log(`  Dominant: ${dominant.emotion} (${dominant.score})`);
    console.log(`  Secondary: ${secondary.emotion} (${secondary.score})`);
    
    // Step 4: Aspect Extraction
    console.log('🔍 Extracting aspects...');
    const allAspects = [];
    const aspectCounts = {};
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const text = `${article.title} ${article.description}`;
      const aspects = extractAspects(text);
      
      for (const aspect of aspects) {
        const key = aspect.normalized;
        
        if (!aspectCounts[key]) {
          aspectCounts[key] = {
            ...aspect,
            mentions: 0,
            contexts: [],
          };
        }
        
        aspectCounts[key].mentions++;
        if (aspectCounts[key].contexts.length < 3) {
          aspectCounts[key].contexts.push(extractContext(text, aspect.text));
        }
        
        // Add emotion from article
        if (emotionResults[i]) {
          if (!aspectCounts[key].emotionsList) {
            aspectCounts[key].emotionsList = [];
          }
          aspectCounts[key].emotionsList.push(emotionResults[i]);
        }
      }
    }
    
    // Convert to array and sort by mentions
    const topAspects = Object.values(aspectCounts)
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 30);
    
    console.log(`  Found ${Object.keys(aspectCounts).length} unique aspects`);
    console.log(`  Top aspects: ${topAspects.slice(0, 5).map(a => a.text).join(', ')}`);
    
    // Step 5: Get sentiment for top aspects
    console.log('📈 Analyzing aspect sentiments...');
    for (const aspect of topAspects) {
      if (aspect.contexts.length > 0) {
        aspect.sentiment = await getAspectSentiment(aspect.contexts[0], aspect);
      }
      
      // Aggregate emotions for this aspect
      if (aspect.emotionsList && aspect.emotionsList.length > 0) {
        aspect.emotions = aggregateEmotions(aspect.emotionsList);
        delete aspect.emotionsList;
      }
      
      // Sample context
      aspect.sample_context = aspect.contexts[0] || '';
      delete aspect.contexts;
    }
    
    // Step 6: Build Topic-Sentiment Matrix
    console.log('📊 Building topic-sentiment matrix...');
    const topicMatrix = buildTopicMatrix(topAspects, emotionResults);
    const insights = generateInsights(topicMatrix, aggregatedEmotions, topAspects);
    
    // Add insights to matrix
    for (const [category, data] of Object.entries(topicMatrix)) {
      if (insights[category]) {
        data.insight_de = insights[category].insight_de;
        data.insight_en = insights[category].insight_en;
      }
    }
    
    // Step 7: Calculate Sentiment Drivers
    console.log('🎯 Calculating sentiment drivers...');
    const drivers = calculateSentimentDrivers(topAspects);
    
    // Step 8: Detect Narratives
    console.log('📖 Detecting narratives...');
    const narratives = detectNarratives(topAspects, aggregatedEmotions);
    
    // Step 9: Get previous day data for trends and alerts
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const { data: previousEmotions } = await supabase
      .from('wm2026_sentiment_emotions')
      .select('*')
      .eq('date', yesterdayStr)
      .single();
    
    // Calculate trends
    const trends = {
      joy: getEmotionTrend(aggregatedEmotions.joy, previousEmotions?.joy),
      anger: getEmotionTrend(aggregatedEmotions.anger, previousEmotions?.anger),
      fear: getEmotionTrend(aggregatedEmotions.fear, previousEmotions?.fear),
      anticipation: getEmotionTrend(aggregatedEmotions.anticipation, previousEmotions?.anticipation),
    };
    
    // Step 10: Generate Alerts
    console.log('⚠️ Checking for alerts...');
    const alerts = await checkForAlerts(topAspects, aggregatedEmotions, { emotions: previousEmotions });
    
    // ==================== SAVE TO DATABASE ====================
    
    console.log('💾 Saving to database...');
    
    // Save emotions
    const { data: emotionRecord } = await supabase
      .from('wm2026_sentiment_emotions')
      .upsert({
        sentiment_id: baseData.id,
        date: today,
        ...aggregatedEmotions,
        dominant_emotion: dominant.emotion,
        dominant_score: dominant.score,
        secondary_emotion: secondary.emotion,
        secondary_score: secondary.score,
        emotional_intensity: calculateIntensity(aggregatedEmotions),
        articles_count: emotionResults.length,
        trend_joy: trends.joy,
        trend_anger: trends.anger,
        trend_fear: trends.fear,
        trend_anticipation: trends.anticipation,
      }, { onConflict: 'date' })
      .select()
      .single();
    
    // Save aspects
    for (const aspect of topAspects) {
      await supabase
        .from('wm2026_sentiment_aspects')
        .upsert({
          date: today,
          aspect_text: aspect.text,
          aspect_normalized: aspect.normalized,
          aspect_type: aspect.type,
          category_key: aspect.category,
          sentiment_score: aspect.sentiment?.score || 0,
          sentiment_label: aspect.sentiment?.label || 'neutral',
          confidence: aspect.sentiment?.confidence || 0,
          dominant_emotion: aspect.emotions ? getDominantEmotion(aspect.emotions).emotion : null,
          emotion_score: aspect.emotions ? getDominantEmotion(aspect.emotions).score : null,
          mention_count: aspect.mentions,
          sample_context: aspect.sample_context,
        }, { onConflict: 'date,aspect_normalized' });
    }
    
    // Save topic matrix
    for (const [category, data] of Object.entries(topicMatrix)) {
      await supabase
        .from('wm2026_topic_matrix')
        .upsert({
          date: today,
          category_key: category,
          overall_score: data.overall_score,
          overall_emotion: data.overall_emotion,
          top_positive_aspects: data.top_positive_aspects,
          top_negative_aspects: data.top_negative_aspects,
          emotion_distribution: data.emotion_distribution,
          insight_de: data.insight_de,
          insight_en: data.insight_en,
          articles_count: data.articles_count,
        }, { onConflict: 'date,category_key' });
    }
    
    // Save drivers
    for (const driver of drivers.slice(0, 20)) {
      await supabase
        .from('wm2026_sentiment_drivers')
        .insert({
          date: today,
          ...driver,
        });
    }
    
    // Save narratives
    for (const narrative of narratives) {
      await supabase
        .from('wm2026_narratives')
        .insert({
          date: today,
          ...narrative,
          article_count: baseData.articles_total,
        });
    }
    
    // Save alerts
    for (const alert of alerts) {
      await supabase
        .from('wm2026_sentiment_alerts')
        .insert(alert);
    }
    
    // Update aspect timeline
    for (const aspect of topAspects.slice(0, 10)) {
      await supabase
        .from('wm2026_aspect_timeline')
        .upsert({
          aspect_normalized: aspect.normalized,
          date: today,
          sentiment_score: aspect.sentiment?.score || 0,
          mention_count: aspect.mentions,
          dominant_emotion: aspect.emotions ? getDominantEmotion(aspect.emotions).emotion : null,
        }, { onConflict: 'aspect_normalized,date' });
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Advanced analysis completed in ${duration}s`);
    
    return res.status(200).json({
      success: true,
      date: today,
      duration_seconds: parseFloat(duration),
      
      // Emotions
      emotions: {
        aggregated: aggregatedEmotions,
        dominant: dominant,
        secondary: secondary,
        intensity: calculateIntensity(aggregatedEmotions),
        trends: trends,
      },
      
      // Aspects
      aspects: {
        total_unique: Object.keys(aspectCounts).length,
        top_aspects: topAspects.slice(0, 10).map(a => ({
          text: a.text,
          category: a.category,
          sentiment: a.sentiment?.score,
          emotion: a.emotions ? getDominantEmotion(a.emotions).emotion : null,
          mentions: a.mentions,
        })),
      },
      
      // Topic Matrix
      topic_matrix: topicMatrix,
      
      // Drivers
      top_drivers: {
        positive: drivers.filter(d => d.direction === 'positive').slice(0, 5),
        negative: drivers.filter(d => d.direction === 'negative').slice(0, 5),
      },
      
      // Narratives
      narratives: narratives,
      
      // Alerts
      alerts: alerts,
    });
    
  } catch (error) {
    console.error('❌ Advanced sentiment analysis failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// ==================== HELPER FUNCTIONS ====================

function calculateIntensity(emotions) {
  const sum = Object.values(emotions).reduce((a, b) => a + b, 0);
  return parseFloat((sum / Object.keys(emotions).length).toFixed(3));
}

function getEmotionTrend(current, previous) {
  if (!previous) return 'stable';
  const diff = current - previous;
  if (diff > 0.05) return 'up';
  if (diff < -0.05) return 'down';
  return 'stable';
}

// Sample articles for testing (in production, fetch from cache)
async function fetchSampleArticles() {
  // This would normally fetch from your article cache
  // For demo purposes, returning sample data
  return [
    { title: 'Die Ticketpreise für die WM 2026 sorgen für Empörung', description: 'Fans kritisieren die hohen Kosten für Eintrittskarten. Besonders in Deutschland wächst die Wut über die FIFA.' },
    { title: 'Musiala glänzt im Training der Nationalmannschaft', description: 'Jamal Musiala zeigt sich in Topform. Die Vorfreude auf die WM 2026 steigt.' },
    { title: 'Stadien in den USA sind bereit für die Weltmeisterschaft', description: 'Das MetLife Stadium und SoFi Stadium erstrahlen in neuem Glanz. Die Infrastruktur ist auf Weltniveau.' },
    { title: 'Visa-Sorgen für europäische Fans', description: 'Die Einreise in die USA bereitet vielen Fans Kopfzerbrechen. Unsicherheit über ESTA und Visa-Prozesse.' },
    { title: 'Gruppenauslosung: Deutschland hofft auf machbare Gruppe', description: 'Die Spannung vor der Auslosung ist greifbar. Große Vorfreude und etwas Nervosität bei den deutschen Fans.' },
    { title: 'FIFA-Präsident Infantino verteidigt WM-Format', description: 'Kritik an der Ausweitung auf 48 Teams. Proteste gegen die FIFA werden lauter.' },
    { title: 'Hotelpreise in den Austragungsorten explodieren', description: 'Die Kosten für Unterkünfte steigen dramatisch. Fans befürchten, sich die Reise nicht leisten zu können.' },
    { title: 'Wirtz und Musiala: Die Hoffnungsträger der DFB-Elf', description: 'Das deutsche Duo sorgt für Begeisterung. Die Erwartungen an die WM 2026 sind hoch.' },
  ];
}
