// ==============================================================
// RanglistenSection.jsx - WM 2026 Tippspiel Ranglisten
// ==============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { t, translateTeam } from './translations';

export default function RanglistenSection({ 
  user, 
  supabase,
  leagues,
  setLeagues,
  createLeague,
  joinLeague,
  newLeagueName,
  setNewLeagueName,
  leagueCode,
  setLeagueCode,
  openAuthModal,
  wmPollResults,
  language = 'de'
}) {
  // Use language for translations
  const tt = (key) => t(key, language);
  const tTeam = (name) => translateTeam(name, language);
  const [activeRankingTab, setActiveRankingTab] = useState('poll');
  const [globalRanking, setGlobalRanking] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagueMembers, setLeagueMembers] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLeague, setShareLeague] = useState(null);
  const [loading, setLoading] = useState(false);

  // Team flags mapping for poll results
  const TEAM_FLAGS = {
    'Mexiko': '🇲🇽', 'Südafrika': '🇿🇦', 'Republik Korea': '🇰🇷', 'Play-off D': '🏳️',
    'Kanada': '🇨🇦', 'Play-off A': '🏳️', 'Katar': '🇶🇦', 'Schweiz': '🇨🇭',
    'Brasilien': '🇧🇷', 'Marokko': '🇲🇦', 'Haiti': '🇭🇹', 'Schottland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australien': '🇦🇺', 'Play-off C': '🏳️',
    'Deutschland': '🇩🇪', 'Curaçao': '🇨🇼', 'Elfenbeinküste': '🇨🇮', 'Ecuador': '🇪🇨',
    'Niederlande': '🇳🇱', 'Japan': '🇯🇵', 'Play-off B': '🏳️', 'Tunesien': '🇹🇳',
    'Belgien': '🇧🇪', 'Ägypten': '🇪🇬', 'Iran': '🇮🇷', 'Neuseeland': '🇳🇿',
    'Spanien': '🇪🇸', 'Kap Verde': '🇨🇻', 'Saudi-Arabien': '🇸🇦', 'Uruguay': '🇺🇾',
    'Frankreich': '🇫🇷', 'Senegal': '🇸🇳', 'FIFA Play-off 2': '🏳️', 'Norwegen': '🇳🇴',
    'Argentinien': '🇦🇷', 'Algerien': '🇩🇿', 'Österreich': '🇦🇹', 'Jordanien': '🇯🇴',
    'Portugal': '🇵🇹', 'FIFA Play-off 1': '🏳️', 'Usbekistan': '🇺🇿', 'Kolumbien': '🇨🇴',
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Kroatien': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦'
  };

  const WM_STARS = {
    'Brasilien': 5, 'Deutschland': 4, 'Argentinien': 3, 'Frankreich': 2, 'Uruguay': 2, 'England': 1, 'Spanien': 1
  };

  // Load global ranking
  useEffect(() => {
    loadGlobalRanking();
  }, []);

  const loadGlobalRanking = async () => {
    setLoading(true);
    try {
      // Get all users with their points (from profiles table)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, points, avatar_url')
        .order('points', { ascending: false })
        .limit(100);
      
      if (data) {
        setGlobalRanking(data);
      }
    } catch (error) {
      console.error('Error loading ranking:', error);
    }
    setLoading(false);
  };

  // Load league members when selecting a league
  const loadLeagueMembers = async (league) => {
    setSelectedLeague(league);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('league_members')
        .select('user_id, profiles(id, username, points, avatar_url)')
        .eq('league_id', league.id);
      
      if (data) {
        const members = data.map(d => d.profiles).filter(Boolean);
        members.sort((a, b) => (b.points || 0) - (a.points || 0));
        setLeagueMembers(members);
      }
    } catch (error) {
      console.error('Error loading league members:', error);
    }
    setLoading(false);
  };

  // Generate QR Code URL (using QR Code API)
  const getQRCodeUrl = (code) => {
    const joinUrl = `${window.location.origin}?join=${code}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}&bgcolor=1e293b&color=10b981`;
  };

  // Generate WhatsApp share link
  const getWhatsAppLink = (league) => {
    const joinUrl = `${window.location.origin}?join=${league.code}`;
    const message = `🏆 Tritt meiner WM 2026 Tippspiel-Rangliste "${league.name}" bei!\n\nCode: ${league.code}\n\nOder direkt hier beitreten: ${joinUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  // Copy code to clipboard
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code kopiert!');
  };

  // Get user rank
  const getUserRank = (userId, ranking) => {
    const index = ranking.findIndex(r => r.id === userId);
    return index >= 0 ? index + 1 : '-';
  };

  // Ranking row component
  const RankingRow = ({ rank, player, isCurrentUser }) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '50px 1fr 80px',
      padding: '12px 14px',
      background: isCurrentUser ? 'rgba(16,185,129,0.15)' : (rank <= 3 ? 'rgba(251,191,36,0.05)' : 'transparent'),
      borderBottom: '1px solid #334155',
      alignItems: 'center'
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: 14,
        color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : '#64748b'
      }}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          borderRadius: '50%', 
          background: isCurrentUser ? '#10b981' : '#334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: 'white',
          fontWeight: 'bold'
        }}>
          {player.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'white', fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
            {player.username || t('unknownPlayer', language)}
            {isCurrentUser && <span style={{ marginLeft: 6, fontSize: 9, background: '#10b981', padding: '2px 6px', borderRadius: 4 }}>{t('youLabel', language)}</span>}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 14, color: '#10b981' }}>
        {player.points || 0} {t('pts', language)}
      </div>
    </div>
  );

  // QR Code Modal
  const QRModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={() => setShowQRModal(false)}>
      <div style={{
        background: '#1e293b', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%',
        border: '1px solid #334155', textAlign: 'center'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
          📱 {t('qrCodeToJoin', language)}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
          {shareLeague?.name}
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <img 
            src={getQRCodeUrl(shareLeague?.code)} 
            alt="QR Code" 
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
        <div style={{ 
          background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981', letterSpacing: 2 }}>
            {shareLeague?.code}
          </span>
          <button 
            onClick={() => copyCode(shareLeague?.code)}
            style={{ 
              background: '#334155', border: 'none', borderRadius: 6, padding: '6px 12px',
              color: 'white', fontSize: 11, cursor: 'pointer'
            }}
          >
            📋 {t('copy', language)}
          </button>
        </div>
        <button 
          onClick={() => setShowQRModal(false)}
          style={{ 
            width: '100%', padding: 12, background: '#334155', border: 'none', borderRadius: 8,
            color: 'white', fontSize: 12, cursor: 'pointer'
          }}
        >
          {tt('close')}
        </button>
      </div>
    </div>
  );

  // Share Modal
  const ShareModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={() => setShowShareModal(false)}>
      <div style={{
        background: '#1e293b', borderRadius: 16, padding: 24, maxWidth: 360, width: '100%',
        border: '1px solid #334155'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>
          🔗 {t('shareRanking', language)}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
          {shareLeague?.name}
        </div>
        
        {/* WhatsApp */}
        <a 
          href={getWhatsAppLink(shareLeague)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 14,
            background: '#25D366', borderRadius: 10, textDecoration: 'none', marginBottom: 10
          }}
        >
          <span style={{ fontSize: 24 }}>📱</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: 'white' }}>WhatsApp</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('sendInvitation', language)}</div>
          </div>
        </a>

        {/* QR Code */}
        <button 
          onClick={() => { setShowShareModal(false); setShowQRModal(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 14, width: '100%',
            background: '#3b82f6', border: 'none', borderRadius: 10, cursor: 'pointer', marginBottom: 10
          }}
        >
          <span style={{ fontSize: 24 }}>📷</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: 'white' }}>{tt('qrCode')}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('scanToJoin', language)}</div>
          </div>
        </button>

        {/* Copy Link */}
        <button 
          onClick={() => {
            const joinUrl = `${window.location.origin}?join=${shareLeague?.code}`;
            navigator.clipboard.writeText(joinUrl);
            alert(t('linkCopied', language));
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 14, width: '100%',
            background: '#334155', border: 'none', borderRadius: 10, cursor: 'pointer', marginBottom: 16
          }}
        >
          <span style={{ fontSize: 24 }}>🔗</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: 'white' }}>{tt('copyLink')}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('directLinkToJoin', language)}</div>
          </div>
        </button>

        {/* Code */}
        <div style={{ 
          background: '#0f172a', borderRadius: 8, padding: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{t('joinCode', language)}</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981', letterSpacing: 2 }}>{shareLeague?.code}</div>
          </div>
          <button 
            onClick={() => copyCode(shareLeague?.code)}
            style={{ background: '#10b981', border: 'none', borderRadius: 6, padding: '8px 12px', color: 'white', fontSize: 11, cursor: 'pointer', fontWeight: 'bold' }}
          >
            {t('copy', language)}
          </button>
        </div>

        <button 
          onClick={() => setShowShareModal(false)}
          style={{ width: '100%', padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
        >
          {tt('close')}
        </button>
      </div>
    </div>
  );

  // Not logged in view - but still show poll results
  if (!user) {
    return (
      <div>
        {/* Header */}
        <div style={{ fontSize: 14, fontWeight: 'bold', color: 'white', marginBottom: 12 }}>{tt('rankingsTitle')}</div>

        {/* WM Poll Results Header with Stats */}
        <div style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(251,191,36,0.3)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>🏆</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>{tt('pollTitle')}</div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginTop: 16,
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 12,
            padding: '12px 20px'
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
                {wmPollResults?.reduce((sum, r) => sum + r.votes, 0) || 0}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.7)', fontWeight: '600' }}>{tt('votesSubmitted')}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(0,0,0,0.2)' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
                {wmPollResults?.length || 0}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.7)', fontWeight: '600' }}>{tt('teamsVoted')}</div>
            </div>
          </div>
        </div>

        {/* Poll Results with enhanced design */}
        <div style={{
          background: '#1e293b',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #334155',
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          {!wmPollResults || wmPollResults.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div>{tt('noVotesYet')}</div>
            </div>
          ) : (
            wmPollResults.slice(0, 10).map((result, idx) => {
              const totalVotes = wmPollResults.reduce((sum, r) => sum + r.votes, 0);
              const percentage = totalVotes > 0 ? (result.votes / totalVotes * 100).toFixed(1) : 0;
              const isTop3 = idx < 3;
              const barColors = [
                'linear-gradient(90deg, #fbbf24, #f59e0b)',
                'linear-gradient(90deg, #94a3b8, #64748b)',
                'linear-gradient(90deg, #cd7f32, #a65f1a)',
              ];

              return (
                <div
                  key={result.team}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #334155',
                    background: isTop3 ? `rgba(251,191,36,${0.08 - idx * 0.02})` : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    {/* Rank Badge */}
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: idx === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                 idx === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                                 idx === 2 ? 'linear-gradient(135deg, #cd7f32, #a65f1a)' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: isTop3 ? 14 : 11,
                      color: isTop3 ? '#0f172a' : '#94a3b8',
                      boxShadow: isTop3 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                    }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>

                    {/* Flag & Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <span style={{ fontSize: 24 }}>{TEAM_FLAGS[result.team] || '🏳️'}</span>
                      <span style={{ fontSize: 13, color: 'white', fontWeight: isTop3 ? 'bold' : 'normal' }}>
                        {tTeam(result.team)}
                      </span>
                    </div>

                    {/* Votes & Percentage */}
                    <div style={{
                      textAlign: 'right',
                      background: isTop3 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      minWidth: 80
                    }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: idx === 0 ? '#fbbf24' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#fcd34d' : '#10b981'
                      }}>
                        {percentage}%
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                        <span style={{ color: '#64748b' }}>👥</span>
                        <span style={{ fontWeight: '600' }}>{result.votes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    background: '#0f172a',
                    borderRadius: 6,
                    height: 8,
                    marginLeft: 44,
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{
                      background: isTop3 ? barColors[idx] : 'linear-gradient(90deg, #10b981, #059669)',
                      height: '100%',
                      borderRadius: 6,
                      width: `${percentage}%`,
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Login prompt */}
        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'white', marginBottom: 8, fontWeight: 'bold' }}>{tt('joinAndVote')}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{tt('signUpToVote')}</div>
          <button onClick={() => openAuthModal('login')} style={{ padding: '12px 24px', background: '#10b981', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
            {tt('signUpNow')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showQRModal && shareLeague && <QRModal />}
      {showShareModal && shareLeague && <ShareModal />}

      {/* Header */}
      <div style={{ fontSize: 14, fontWeight: 'bold', color: 'white', marginBottom: 12 }}>{tt('rankingsTitle')}</div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button 
          onClick={() => { setActiveRankingTab('poll'); setSelectedLeague(null); }}
          style={{ 
            padding: '8px 16px', 
            background: activeRankingTab === 'poll' ? '#fbbf24' : '#1e293b', 
            border: '1px solid #334155', 
            borderRadius: 8, 
            color: activeRankingTab === 'poll' ? '#0f172a' : 'white', 
            fontSize: 11, 
            fontWeight: activeRankingTab === 'poll' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          🏆 {tt('wmPollTitle')}
        </button>
        <button 
          onClick={() => { setActiveRankingTab('global'); setSelectedLeague(null); }}
          style={{ 
            padding: '8px 16px', 
            background: activeRankingTab === 'global' ? '#10b981' : '#1e293b', 
            border: '1px solid #334155', 
            borderRadius: 8, 
            color: 'white', 
            fontSize: 11, 
            fontWeight: activeRankingTab === 'global' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          🌍 {tt('globalRanking')}
        </button>
        <button 
          onClick={() => setActiveRankingTab('private')}
          style={{ 
            padding: '8px 16px', 
            background: activeRankingTab === 'private' ? '#10b981' : '#1e293b', 
            border: '1px solid #334155', 
            borderRadius: 8, 
            color: 'white', 
            fontSize: 11, 
            fontWeight: activeRankingTab === 'private' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          🔒 {tt('privateRankings')} ({leagues?.length || 0})
        </button>
      </div>

      {/* ========== WM POLL RESULTS ========== */}
      {activeRankingTab === 'poll' && (
        <div>
          {/* Header with Stats */}
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(251,191,36,0.3)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 8, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>🏆</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>{tt('pollTitle')}</div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              marginTop: 16,
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 12,
              padding: '12px 20px'
            }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
                  {wmPollResults?.reduce((sum, r) => sum + r.votes, 0) || 0}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.7)', fontWeight: '600' }}>{tt('votesSubmitted')}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(0,0,0,0.2)' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
                  {wmPollResults?.length || 0}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.7)', fontWeight: '600' }}>{tt('teamsVoted')}</div>
              </div>
            </div>
          </div>

          {/* Podium Top 3 */}
          {wmPollResults && wmPollResults.length >= 3 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 8,
              marginBottom: 20,
              padding: '0 10px'
            }}>
              {/* 2nd Place */}
              <div style={{
                flex: 1,
                maxWidth: 110,
                background: 'linear-gradient(180deg, #64748b 0%, #475569 100%)',
                borderRadius: '12px 12px 0 0',
                padding: '16px 8px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
              }}>
                <div style={{ fontSize: 28 }}>{TEAM_FLAGS[wmPollResults[1]?.team] || '🏳️'}</div>
                <div style={{ fontSize: 10, color: 'white', fontWeight: 'bold', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tTeam(wmPollResults[1]?.team)}
                </div>
                <div style={{ fontSize: 20, marginTop: 4 }}>🥈</div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8,
                  padding: '6px 4px',
                  marginTop: 8
                }}>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#e2e8f0' }}>
                    {((wmPollResults[1]?.votes / wmPollResults.reduce((s,r) => s + r.votes, 0)) * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{wmPollResults[1]?.votes} {tt('votes')}</div>
                </div>
              </div>

              {/* 1st Place */}
              <div style={{
                flex: 1,
                maxWidth: 130,
                background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                borderRadius: '12px 12px 0 0',
                padding: '20px 8px',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(251,191,36,0.4)',
                transform: 'translateY(-12px)'
              }}>
                <div style={{ fontSize: 36 }}>{TEAM_FLAGS[wmPollResults[0]?.team] || '🏳️'}</div>
                <div style={{ fontSize: 11, color: '#0f172a', fontWeight: 'bold', marginTop: 4 }}>
                  {tTeam(wmPollResults[0]?.team)}
                </div>
                {WM_STARS[wmPollResults[0]?.team] > 0 && (
                  <div style={{ fontSize: 8, marginTop: 2 }}>{'⭐'.repeat(WM_STARS[wmPollResults[0]?.team])}</div>
                )}
                <div style={{ fontSize: 24, marginTop: 6 }}>🥇</div>
                <div style={{
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: 8,
                  padding: '8px 4px',
                  marginTop: 8
                }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
                    {((wmPollResults[0]?.votes / wmPollResults.reduce((s,r) => s + r.votes, 0)) * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.7)', fontWeight: '600' }}>{wmPollResults[0]?.votes} {tt('votes')}</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div style={{
                flex: 1,
                maxWidth: 110,
                background: 'linear-gradient(180deg, #cd7f32 0%, #a65f1a 100%)',
                borderRadius: '12px 12px 0 0',
                padding: '14px 8px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
              }}>
                <div style={{ fontSize: 26 }}>{TEAM_FLAGS[wmPollResults[2]?.team] || '🏳️'}</div>
                <div style={{ fontSize: 10, color: 'white', fontWeight: 'bold', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tTeam(wmPollResults[2]?.team)}
                </div>
                <div style={{ fontSize: 18, marginTop: 4 }}>🥉</div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8,
                  padding: '6px 4px',
                  marginTop: 8
                }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#fef3c7' }}>
                    {((wmPollResults[2]?.votes / wmPollResults.reduce((s,r) => s + r.votes, 0)) * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 9, color: '#fde68a' }}>{wmPollResults[2]?.votes} {tt('votes')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Full Results List */}
          <div style={{
            background: '#1e293b',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid #334155',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #0f172a, #1e293b)',
              padding: '12px 16px',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>📊 {tt('allTeamsRanking')}</span>
              <span style={{ fontSize: 10, color: '#475569' }}>{wmPollResults?.length || 0} {tt('teams')}</span>
            </div>

            {!wmPollResults || wmPollResults.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                <div>{tt('noVotesYet')}</div>
                <div style={{ fontSize: 11, marginTop: 4, color: '#4b5563' }}>{tt('goToMatches')}</div>
              </div>
            ) : (
              wmPollResults.map((result, idx) => {
                const totalVotes = wmPollResults.reduce((sum, r) => sum + r.votes, 0);
                const percentage = totalVotes > 0 ? (result.votes / totalVotes * 100).toFixed(1) : 0;
                const isTop3 = idx < 3;
                const barColors = [
                  'linear-gradient(90deg, #fbbf24, #f59e0b)',
                  'linear-gradient(90deg, #94a3b8, #64748b)',
                  'linear-gradient(90deg, #cd7f32, #a65f1a)',
                ];

                return (
                  <div
                    key={result.team}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #334155',
                      background: isTop3 ? `rgba(251,191,36,${0.08 - idx * 0.02})` : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      {/* Rank Badge */}
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: idx === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                   idx === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                                   idx === 2 ? 'linear-gradient(135deg, #cd7f32, #a65f1a)' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: isTop3 ? 14 : 11,
                        color: isTop3 ? '#0f172a' : '#94a3b8',
                        boxShadow: isTop3 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                      }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>

                      {/* Flag & Team */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <span style={{ fontSize: 24, filter: isTop3 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none' }}>
                          {TEAM_FLAGS[result.team] || '🏳️'}
                        </span>
                        <div>
                          <div style={{
                            fontSize: 13,
                            color: 'white',
                            fontWeight: isTop3 ? 'bold' : 'normal'
                          }}>
                            {tTeam(result.team)}
                          </div>
                          {WM_STARS[result.team] > 0 && (
                            <div style={{ fontSize: 8, marginTop: 2 }}>{'⭐'.repeat(WM_STARS[result.team])}</div>
                          )}
                        </div>
                      </div>

                      {/* Votes & Percentage - Enhanced */}
                      <div style={{
                        textAlign: 'right',
                        background: isTop3 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        minWidth: 80
                      }}>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: idx === 0 ? '#fbbf24' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#fcd34d' : '#10b981'
                        }}>
                          {percentage}%
                        </div>
                        <div style={{
                          fontSize: 10,
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 3
                        }}>
                          <span style={{ color: '#64748b' }}>👥</span>
                          <span style={{ fontWeight: '600' }}>{result.votes}</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div style={{
                      background: '#0f172a',
                      borderRadius: 6,
                      height: 8,
                      marginLeft: 44,
                      overflow: 'hidden',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      <div style={{
                        background: isTop3 ? barColors[idx] : 'linear-gradient(90deg, #10b981, #059669)',
                        height: '100%',
                        borderRadius: 6,
                        width: `${percentage}%`,
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isTop3 ? '0 0 8px rgba(251,191,36,0.5)' : 'none'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========== GLOBAL RANKING ========== */}
      {activeRankingTab === 'global' && (
        <div>
          {/* Info */}
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              <strong style={{ color: '#3b82f6' }}>🌍 {tt('globalRanking')}:</strong> {t('globalRankingDesc', language)}
            </div>
          </div>

          {/* Your Position */}
          {user && (
            <div style={{ background: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 16, border: '2px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{t('yourPosition', language)}</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                    #{getUserRank(user.id, globalRanking)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{tt('points')}</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
                    {globalRanking.find(r => r.id === user.id)?.points || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ranking Table */}
          <div style={{ background: '#1e293b', borderRadius: 10, overflow: 'hidden', border: '1px solid #334155' }}>
            <div style={{ background: '#0f172a', padding: '10px 14px', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 80px', fontSize: 10, color: '#64748b' }}>
                <span>{tt('rank')}</span>
                <span>{tt('player')}</span>
                <span style={{ textAlign: 'right' }}>{tt('points')}</span>
              </div>
            </div>
            
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                {tt('loading')}
              </div>
            ) : globalRanking.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                {t('noPlayersYet', language)}
              </div>
            ) : (
              globalRanking.map((player, idx) => (
                <RankingRow 
                  key={player.id} 
                  rank={idx + 1} 
                  player={player} 
                  isCurrentUser={player.id === user?.id}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ========== PRIVATE RANKINGS ========== */}
      {activeRankingTab === 'private' && !selectedLeague && (
        <div>
          {/* Create new */}
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #334155' }}>
            <div style={{ fontSize: 12, color: 'white', marginBottom: 8, fontWeight: 'bold' }}>✨ {tt('createRanking')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                placeholder={t('rankingNamePlaceholder', language)} 
                value={newLeagueName} 
                onChange={e => setNewLeagueName(e.target.value)} 
                style={{ flex: 1, padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', fontSize: 12 }} 
              />
              <button 
                onClick={createLeague} 
                style={{ padding: '10px 16px', background: '#10b981', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
              >
                {tt('create')}
              </button>
            </div>
          </div>

          {/* Join */}
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid #334155' }}>
            <div style={{ fontSize: 12, color: 'white', marginBottom: 8, fontWeight: 'bold' }}>🔗 {tt('joinRanking')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                placeholder={t('enterCodePlaceholder', language)} 
                value={leagueCode} 
                onChange={e => setLeagueCode(e.target.value)} 
                style={{ flex: 1, padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: 'white', fontSize: 12, textTransform: 'uppercase' }} 
              />
              <button 
                onClick={joinLeague} 
                style={{ padding: '10px 16px', background: '#3b82f6', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
              >
                {tt('join')}
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: '#64748b' }}>
              💡 {t('scanQRorLink', language)}
            </div>
          </div>

          {/* My Rankings */}
          <div style={{ fontSize: 12, color: 'white', marginBottom: 10, fontWeight: 'bold' }}>
            📋 {t('myRankings', language)} ({leagues?.length || 0})
          </div>

          {!leagues || leagues.length === 0 ? (
            <div style={{ background: '#1e293b', borderRadius: 10, padding: 30, textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{tt('noLeagues')}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{tt('createOrJoin')}</div>
            </div>
          ) : (
            leagues.map(league => (
              <div key={league.id} style={{ background: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, color: 'white', fontWeight: 'bold' }}>{league.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{tt('code')}: {league.code}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => loadLeagueMembers(league)}
                    style={{ flex: 1, padding: '8px 12px', background: '#10b981', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    📊 {t('viewRanking', language)}
                  </button>
                  <button 
                    onClick={() => { setShareLeague(league); setShowShareModal(true); }}
                    style={{ padding: '8px 12px', background: '#3b82f6', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    📤 {tt('share')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== SELECTED LEAGUE RANKING ========== */}
      {activeRankingTab === 'private' && selectedLeague && (
        <div>
          {/* Back Button */}
          <button 
            onClick={() => setSelectedLeague(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#10b981', fontSize: 12, cursor: 'pointer', marginBottom: 12, padding: 0 }}
          >
            ← {t('backToMyRankings', language)}
          </button>

          {/* League Header */}
          <div style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>{selectedLeague.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                  {leagueMembers.length} {tt('members')} • {tt('code')}: {selectedLeague.code}
                </div>
              </div>
              <button 
                onClick={() => { setShareLeague(selectedLeague); setShowShareModal(true); }}
                style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}
              >
                📤 {t('invite', language)}
              </button>
            </div>
          </div>

          {/* Ranking Table */}
          <div style={{ background: '#1e293b', borderRadius: 10, overflow: 'hidden', border: '1px solid #334155' }}>
            <div style={{ background: '#0f172a', padding: '10px 14px', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 80px', fontSize: 10, color: '#64748b' }}>
                <span>{tt('rank')}</span>
                <span>{tt('player')}</span>
                <span style={{ textAlign: 'right' }}>{tt('points')}</span>
              </div>
            </div>
            
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                {t('loadingMembers', language)}
              </div>
            ) : leagueMembers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
                {t('noMembersYet', language)}
              </div>
            ) : (
              leagueMembers.map((player, idx) => (
                <RankingRow 
                  key={player.id} 
                  rank={idx + 1} 
                  player={player} 
                  isCurrentUser={player.id === user?.id}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
