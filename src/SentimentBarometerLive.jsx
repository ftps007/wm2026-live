import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// =====================================================
// WM-STIMMUNG BAROMETER - LIVE FROM DATABASE
// =====================================================
// Reads the latest XLM-RoBERTa sentiment analysis from Supabase

// Sector Gauge Component with boundaries
const SectorGauge = ({ score }) => {
  const rotation = (score / 100) * 180 - 90;
  
  return (
    <div style={{ width: '72px', height: '44px', position: 'relative' }}>
      <svg viewBox="0 0 120 70" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="sectorRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="sectorOrange" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="sectorGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        
        {/* Background track */}
        <path 
          d="M 10 60 A 50 50 0 0 1 110 60" 
          fill="none" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="8" 
          strokeLinecap="round" 
        />
        
        {/* Red sector: 0-40 (72° of 180°) */}
        <path 
          d="M 10 60 A 50 50 0 0 1 32 22" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="8" 
          strokeLinecap="round" 
        />
        
        {/* Orange/Yellow sector: 40-60 (36° of 180°) */}
        <path 
          d="M 34 21 A 50 50 0 0 1 86 21" 
          fill="none" 
          stroke="#fbbf24" 
          strokeWidth="8" 
        />
        
        {/* Green sector: 60-100 (72° of 180°) */}
        <path 
          d="M 88 22 A 50 50 0 0 1 110 60" 
          fill="none" 
          stroke="#22c55e" 
          strokeWidth="8" 
          strokeLinecap="round" 
        />
        
        {/* Threshold labels */}
        <text x="6" y="68" fill="#64748b" fontSize="7" fontWeight="500">0</text>
        <text x="28" y="16" fill="#64748b" fontSize="7" fontWeight="500">40</text>
        <text x="56" y="10" fill="#64748b" fontSize="7" fontWeight="500">50</text>
        <text x="84" y="16" fill="#64748b" fontSize="7" fontWeight="500">60</text>
        <text x="102" y="68" fill="#64748b" fontSize="7" fontWeight="500">100</text>
        
        {/* Needle */}
        <g transform={`rotate(${rotation}, 60, 60)`}>
          <line 
            x1="60" y1="60" x2="60" y2="22" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
        </g>
        
        {/* Current value - highlighted with background circle */}
        <circle cx="60" cy="60" r="12" fill="#0f172a" stroke="white" strokeWidth="1.5" />
        <text x="60" y="64" fill="white" fontSize="10" fontWeight="700" textAnchor="middle">{score}</text>
      </svg>
    </div>
  );
};

export default function SentimentBarometer({ language = 'de', onClick }) {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Static fallback data (used only if database is unreachable)
  const fallbackData = {
    score: 50,
    previous_score: 50,
    change: 0,
    trend: 'stable',
    label_de: 'Neutral',
    label_en: 'Neutral',
    articles_total: 0,
    model_used: 'fallback'
  };

  useEffect(() => {
    fetchSentiment();
    
    // Set up real-time subscription for live updates
    const subscription = supabase
      .channel('sentiment-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'wm2026_sentiment' },
        (payload) => {
          console.log('Sentiment update received:', payload);
          fetchSentiment();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchSentiment() {
    try {
      setError(null);
      
      // Fetch latest 2 entries to calculate change
      const { data, error: fetchError } = await supabase
        .from('wm2026_sentiment')
        .select('*')
        .order('date', { ascending: false })
        .limit(2);

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }
      
      if (data && data.length > 0) {
        const latest = data[0];
        const previous = data[1];
        
        // Calculate change from previous day
        const change = previous ? latest.score - previous.score : 0;
        
        setSentiment({
          ...latest,
          previous_score: previous?.score || latest.score,
          change: change,
          // Ensure we have a valid date for display
          lastUpdated: latest.updated_at || latest.created_at
        });
        
        console.log('✅ Sentiment loaded:', {
          date: latest.date,
          score: latest.score,
          model: latest.model_used,
          articles: latest.articles_total
        });
      } else {
        console.warn('No sentiment data found in database');
        setSentiment(fallbackData);
      }
    } catch (err) {
      console.error('Sentiment fetch error:', err);
      setError(err.message);
      setSentiment(fallbackData);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <span style={styles.loading}>📊 ...</span>
        </div>
      </div>
    );
  }

  const data = sentiment || fallbackData;
  const change = data.change || 0;
  
  // Change indicator color
  const getChangeColor = (val) => {
    if (val > 0) return '#22c55e'; // green
    if (val < 0) return '#ef4444'; // red
    return '#f59e0b'; // orange/yellow for stable
  };
  
  // Format change string with sign
  const formatChange = (val) => {
    if (val > 0) return `+${val}`;
    if (val < 0) return `${val}`;
    return '±0';
  };

  const label = language === 'de' ? (data.label_de || 'Neutral') : (data.label_en || 'Neutral');
  const title = language === 'de' ? 'WM-Stimmung' : 'WC Mood';
  
  // Score bar visualization (10 segments)
  const filledBars = Math.round(data.score / 10);

  return (
    <div 
      style={styles.wrapper} 
      onClick={onClick} 
      role={onClick ? 'button' : undefined}
      title={`${language === 'de' ? 'Basierend auf' : 'Based on'} ${data.articles_total || 0} ${language === 'de' ? 'Artikeln' : 'articles'} (${data.model_used || 'XLM-RoBERTa'})`}
    >
      {/* Title */}
      <div style={styles.title}>{title.toUpperCase()}</div>
      
      {/* Main Container */}
      <div style={styles.container}>
        {/* Score + Change */}
        <div style={styles.scoreContainer}>
          <span style={styles.score}>{data.score}</span>
          <span style={{ 
            ...styles.change, 
            color: getChangeColor(change),
            background: `${getChangeColor(change)}20`
          }}>
            {formatChange(change)}
          </span>
        </div>
        
        {/* Bar Indicator */}
        <div style={styles.barContainer}>
          {[...Array(10)].map((_, i) => {
            // Color based on position: red (0-3), yellow (4-5), green (6-9)
            let barColor = '#374151'; // unfilled
            if (i < filledBars) {
              if (i < 4) barColor = '#ef4444'; // red
              else if (i < 6) barColor = '#fbbf24'; // yellow
              else barColor = '#22c55e'; // green
            }
            
            return (
              <div
                key={i}
                style={{
                  ...styles.bar,
                  backgroundColor: barColor
                }}
              />
            );
          })}
        </div>
        
        {/* Label */}
        <span style={styles.label}>{label}</span>
        
        {/* Sector Gauge */}
        <SectorGauge score={data.score} />
      </div>
      
      {/* Error indicator (subtle) */}
      {error && (
        <div style={styles.errorDot} title={error}>⚠️</div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    position: 'relative',
  },
  title: {
    fontSize: '8px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600'
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
  },
  scoreContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  score: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: '14px',
    minWidth: '20px'
  },
  change: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 5px',
    borderRadius: '6px',
  },
  barContainer: {
    display: 'flex',
    gap: '2px'
  },
  bar: {
    width: '4px',
    height: '12px',
    borderRadius: '2px',
    transition: 'background-color 0.3s'
  },
  label: {
    color: '#d1d5db',
    fontSize: '12px',
    fontWeight: '500'
  },
  loading: {
    color: '#9ca3af',
    fontSize: '12px'
  },
  errorDot: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    fontSize: '8px',
  }
};
