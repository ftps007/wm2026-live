// ==============================================================
// WM2026Poll.jsx - World Cup Winner Poll with Language Support
// ==============================================================

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useLanguage } from './LanguageContext';
import { t, translateTeam } from './translations';

// All 42 qualified teams with flags - sorted by FIFA World Ranking (December 2024)
const ALL_TEAMS = [
  { name: 'Spanien', flag: '🇪🇸', stars: 1 },        // 1
  { name: 'Argentinien', flag: '🇦🇷', stars: 3 },   // 2
  { name: 'Frankreich', flag: '🇫🇷', stars: 2 },    // 3
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', stars: 1 },    // 4
  { name: 'Brasilien', flag: '🇧🇷', stars: 5 },     // 5
  { name: 'Portugal', flag: '🇵🇹', stars: 0 },      // 6
  { name: 'Niederlande', flag: '🇳🇱', stars: 0 },   // 7
  { name: 'Belgien', flag: '🇧🇪', stars: 0 },       // 8
  { name: 'Deutschland', flag: '🇩🇪', stars: 4 },   // 9
  { name: 'Kroatien', flag: '🇭🇷', stars: 0 },      // 10
  { name: 'Marokko', flag: '🇲🇦', stars: 0 },       // 11
  { name: 'Kolumbien', flag: '🇨🇴', stars: 0 },     // 13
  { name: 'USA', flag: '🇺🇸', stars: 0 },           // 14
  { name: 'Mexiko', flag: '🇲🇽', stars: 0 },        // 15
  { name: 'Uruguay', flag: '🇺🇾', stars: 2 },       // 16
  { name: 'Schweiz', flag: '🇨🇭', stars: 0 },       // 17
  { name: 'Japan', flag: '🇯🇵', stars: 0 },         // 18
  { name: 'Senegal', flag: '🇸🇳', stars: 0 },       // 19
  { name: 'Iran', flag: '🇮🇷', stars: 0 },          // 20
  { name: 'Republik Korea', flag: '🇰🇷', stars: 0 },// 22
  { name: 'Ecuador', flag: '🇪🇨', stars: 0 },       // 23
  { name: 'Österreich', flag: '🇦🇹', stars: 0 },    // 24
  { name: 'Australien', flag: '🇦🇺', stars: 0 },    // 26
  { name: 'Kanada', flag: '🇨🇦', stars: 0 },        // 27
  { name: 'Norwegen', flag: '🇳🇴', stars: 0 },      // 29
  { name: 'Panama', flag: '🇵🇦', stars: 0 },        // 30
  { name: 'Algerien', flag: '🇩🇿', stars: 0 },      // 34
  { name: 'Ägypten', flag: '🇪🇬', stars: 0 },       // 35
  { name: 'Schottland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', stars: 0 }, // 36
  { name: 'Paraguay', flag: '🇵🇾', stars: 0 },      // 39
  { name: 'Tunesien', flag: '🇹🇳', stars: 0 },      // 41
  { name: 'Elfenbeinküste', flag: '🇨🇮', stars: 0 },// 42
  { name: 'Usbekistan', flag: '🇺🇿', stars: 0 },    // 50
  { name: 'Katar', flag: '🇶🇦', stars: 0 },         // 54
  { name: 'Saudi-Arabien', flag: '🇸🇦', stars: 0 }, // 60
  { name: 'Südafrika', flag: '🇿🇦', stars: 0 },     // 61
  { name: 'Jordanien', flag: '🇯🇴', stars: 0 },     // 64
  { name: 'Kap Verde', flag: '🇨🇻', stars: 0 },     // 67
  { name: 'Ghana', flag: '🇬🇭', stars: 0 },         // 73
  { name: 'Curaçao', flag: '🇨🇼', stars: 0 },       // 82
  { name: 'Neuseeland', flag: '🇳🇿', stars: 0 },    // 85
  { name: 'Haiti', flag: '🇭🇹', stars: 0 },         // 88
];

export default function WM2026Poll({ onComplete }) {
  const langContext = useLanguage();
  const language = langContext?.language || 'de';
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('wm2026_language');
    return saved || language;
  });
  
  // Detect language based on user's country (geo-location)
  useEffect(() => {
    const detectLanguageByCountry = async () => {
      // Skip if language was manually set
      const manuallySet = localStorage.getItem('wm2026_language_manual');
      if (manuallySet) return;
      
      try {
        // Use free IP geolocation API
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_code;
        
        let detectedLang = 'en'; // Default to English
        
        // German-speaking countries
        if (['DE', 'AT', 'CH'].includes(country)) {
          detectedLang = 'de';
        }
        // Poland
        else if (country === 'PL') {
          detectedLang = 'pl';
        }
        
        // Set detected language
        setCurrentLang(detectedLang);
        localStorage.setItem('wm2026_language', detectedLang);
        
        // Also update the language context if available
        if (langContext?.setLanguage) {
          langContext.setLanguage(detectedLang);
        }
      } catch (err) {
        console.log('Geo detection failed, using default language');
      }
    };
    
    detectLanguageByCountry();
  }, []);
  
  useEffect(() => {
    if (langContext?.language) {
      setCurrentLang(langContext.language);
    }
  }, [langContext?.language]);
  
  const tTeam = (name) => translateTeam(name, currentLang);

  // Fetch poll results from Supabase
  const fetchResults = async () => {
    setLoading(true);
    try {
      console.log('Fetching poll results...');
      
      // Try to fetch all votes
      const { data, error, status } = await supabase
        .from('wm_poll_votes')
        .select('team');
      
      console.log('Supabase response:', { status, error, dataLength: data?.length });
      
      if (error) {
        console.error('Supabase error:', error.message, error.code);
        // If RLS blocks us, show error state
        setResults([]);
        setTotalVotes(0);
        setLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No votes found in database');
        setResults([]);
        setTotalVotes(0);
        setLoading(false);
        return;
      }
      
      console.log('Poll data fetched:', data.length, 'votes');
      
      // Count votes per team
      const voteCounts = {};
      data.forEach(vote => {
        if (vote.team) {
          voteCounts[vote.team] = (voteCounts[vote.team] || 0) + 1;
        }
      });
      
      console.log('Vote counts:', voteCounts);
      
      // Convert to array and sort by votes
      const resultsArray = Object.entries(voteCounts)
        .map(([team, votes]) => ({ team, votes }))
        .sort((a, b) => b.votes - a.votes);
      
      setResults(resultsArray);
      setTotalVotes(data.length);
    } catch (err) {
      console.error('Error fetching poll results:', err);
      setResults([]);
      setTotalVotes(0);
    }
    setLoading(false);
  };
  
  // Always fetch results on component mount
  useEffect(() => {
    fetchResults();
  }, []);
  
  // Check if user already voted and show results
  useEffect(() => {
    const existingVote = localStorage.getItem('wm2026_poll_vote');
    if (existingVote) {
      // Find the team info for the existing vote
      const teamInfo = ALL_TEAMS.find(t => t.name === existingVote);
      if (teamInfo) {
        setSelectedTeam(teamInfo);
      }
      setHasVoted(true);
      setShowResults(true);
    }
  }, []);

  const handleVote = async (team) => {
    setSelectedTeam(team);
    localStorage.setItem('wm2026_poll_vote', team.name);
    localStorage.setItem('wm2026_poll_completed', 'true');
    
    // Generate or get anonymous user ID for this device
    let visitorId = localStorage.getItem('wm2026_visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('wm2026_visitor_id', visitorId);
    }
    
    // Save to Supabase with anonymous user_id
    try {
      const { data, error } = await supabase
        .from('wm_poll_votes')
        .insert({ team: team.name, user_id: visitorId });
      
      if (error) {
        console.error('Vote insert error:', error.message);
      } else {
        console.log('Vote saved successfully');
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
    
    // Fetch and show results
    await fetchResults();
    setShowResults(true);
  };

  const handleSkip = () => {
    localStorage.setItem('wm2026_poll_completed', 'true');
    if (onComplete) onComplete(null);
  };

  const handleContinue = () => {
    if (onComplete) onComplete(selectedTeam?.name || null);
  };

  // Get team info by name
  const getTeamInfo = (teamName) => {
    return ALL_TEAMS.find(t => t.name === teamName) || { flag: '🏳️', stars: 0 };
  };

  // Results Screen
  if (showResults) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #3b82f6)',
          borderRadius: '20px',
          padding: '24px 40px',
          marginBottom: '20px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📊</div>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: 'bold', 
            color: 'white', 
            margin: 0,
            marginBottom: '8px'
          }}>
            {t('pollResultsTitle', currentLang)}
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: 'rgba(255,255,255,0.95)',
            margin: 0,
            fontWeight: 'bold'
          }}>
            🗳️ {totalVotes} {t('pollTotalVotes', currentLang)}
          </p>
        </div>

        {/* All Results with votes */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          marginBottom: '24px',
          maxHeight: '55vh',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>
              {t('loading', currentLang)}...
            </div>
          ) : results.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
              {t('pollNoVotesYet', currentLang)}
            </div>
          ) : (
            results.map((result, index) => {
              const teamInfo = getTeamInfo(result.team);
              const percentage = totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(1) : 0;
              
              return (
                <div 
                  key={result.team}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: '#1e293b',
                    borderRadius: '10px',
                    marginBottom: '8px',
                    border: '1px solid #334155'
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7f32' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    color: index < 3 ? '#0f172a' : 'white'
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* Flag & Name */}
                  <span style={{ fontSize: '24px' }}>{teamInfo.flag}</span>
                  <span style={{ 
                    color: 'white', 
                    fontWeight: '500',
                    flex: 1,
                    fontSize: '14px'
                  }}>
                    {tTeam(result.team)}
                  </span>
                  
                  {/* Percentage & Votes */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                      {percentage}%
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>
                      {result.votes} {result.votes === 1 ? 'Vote' : 'Votes'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          style={{
            padding: '16px 48px',
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          {t('pollContinueToTrivia', currentLang)} →
        </button>
      </div>
    );
  }

  // Voting Screen
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
        borderRadius: '20px',
        padding: '30px 40px',
        marginBottom: '24px',
        textAlign: 'center',
        width: '100%',
        maxWidth: '600px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: 'white', 
          marginBottom: '8px',
          margin: 0 
        }}>
          {t('pollTitle', currentLang)}
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: 'rgba(255,255,255,0.9)',
          margin: 0 
        }}>
          {t('pollSubtitle', currentLang)}
        </p>
      </div>

      {/* Team Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        width: '100%',
        maxWidth: '600px',
        marginBottom: '20px'
      }}>
        {ALL_TEAMS.map((team) => (
          <button
            key={team.name}
            onClick={() => handleVote(team)}
            style={{
              padding: '16px 8px',
              background: selectedTeam?.name === team.name 
                ? 'rgba(16,185,129,0.3)' 
                : '#1e293b',
              border: selectedTeam?.name === team.name 
                ? '2px solid #10b981' 
                : '1px solid #334155',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '28px' }}>{team.flag}</span>
            <span style={{ 
              fontSize: '11px', 
              color: 'white', 
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {tTeam(team.name)}
            </span>
            {team.stars > 0 && (
              <span style={{ fontSize: '10px' }}>
                {'⭐'.repeat(team.stars)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        style={{
          padding: '12px 32px',
          background: 'transparent',
          border: '1px solid #475569',
          borderRadius: '8px',
          color: '#94a3b8',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        {t('voteLater', currentLang)}
      </button>
    </div>
  );
}
