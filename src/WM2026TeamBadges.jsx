// =====================================================
// WM 2026 TEAM BADGES - React Component
// Supabase-Integration für wm26.live
// Nutzt zentrale translations.js via useLanguage()
// =====================================================

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useLanguage } from './LanguageContext';

const WM2026TeamBadges = ({ isPremium = false }) => {
  const { t, language } = useLanguage();
  
  const [badges, setBadges] = useState([]);
  const [scorers, setScorers] = useState({});
  const [legends, setLegends] = useState({});
  const [coaches, setCoaches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('stats');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConfederation, setFilterConfederation] = useState('all');

  // Fetch all data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('wm2026_country_badges')
          .select('*')
          .eq('is_qualified_2026', true)
          .order('titles', { ascending: false });

        if (badgesError) throw badgesError;
        setBadges(badgesData || []);

        // Fetch scorers
        const { data: scorersData, error: scorersError } = await supabase
          .from('wm2026_country_top_scorers')
          .select('*')
          .order('goals', { ascending: false });

        if (!scorersError && scorersData) {
          const grouped = {};
          scorersData.forEach(s => {
            if (!grouped[s.country_code]) grouped[s.country_code] = [];
            grouped[s.country_code].push(s);
          });
          setScorers(grouped);
        }

        // Fetch legends
        const { data: legendsData, error: legendsError } = await supabase
          .from('wm2026_country_legends')
          .select('*');

        if (!legendsError && legendsData) {
          const grouped = {};
          legendsData.forEach(l => {
            if (!grouped[l.country_code]) grouped[l.country_code] = [];
            grouped[l.country_code].push(l);
          });
          setLegends(grouped);
        }

        // Fetch coaches
        const { data: coachesData, error: coachesError } = await supabase
          .from('wm2026_country_coaches')
          .select('*')
          .order('wm_year', { ascending: false });

        if (!coachesError && coachesData) {
          const grouped = {};
          coachesData.forEach(c => {
            if (!grouped[c.country_code]) grouped[c.country_code] = [];
            grouped[c.country_code].push(c);
          });
          setCoaches(grouped);
        }

      } catch (err) {
        console.error('Error fetching badges:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter badges
  const filteredBadges = badges.filter(badge => {
    const name = language === 'en' ? badge.name_en : badge.name_de;
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConf = filterConfederation === 'all' || badge.confederation === filterConfederation;
    return matchesSearch && matchesConf;
  });

  // Confederations for filter
  const confederations = ['all', 'UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC'];

  // Medal icons
  const getMedalIcon = (titles) => {
    if (titles >= 4) return '🥇';
    if (titles >= 2) return '🥈';
    if (titles >= 1) return '🥉';
    return '';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚽</div>
        {t('badgesLoading')}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>❌</div>
        {t('badgesError')}: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
          🏅 {t('badgesTitle')}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          {t('badgesSubtitle')} • {badges.length} Teams
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder={t('badgesSearch')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
            flex: '1',
            minWidth: '150px'
          }}
        />
        
        {/* Confederation Filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {confederations.map(conf => (
            <button
              key={conf}
              onClick={() => setFilterConfederation(conf)}
              style={{
                padding: '6px 12px',
                background: filterConfederation === conf ? '#10b981' : '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                color: filterConfederation === conf ? 'white' : '#94a3b8',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: filterConfederation === conf ? 'bold' : 'normal'
              }}
            >
              {conf === 'all' ? t('badgesAllConf') : conf}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {filteredBadges.map(badge => (
          <div
            key={badge.country_code}
            onClick={() => { setSelectedTeam(badge); setActiveModalTab('stats'); }}
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderRadius: '12px',
              padding: '16px 12px',
              border: '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = '#334155';
            }}
          >
            {/* Flag */}
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {badge.flag_emoji}
            </div>
            
            {/* Name */}
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
              {language === 'en' ? badge.name_en : badge.name_de}
            </div>
            
            {/* Titles */}
            {badge.titles > 0 && (
              <div style={{ fontSize: '10px', marginBottom: '4px' }}>
                {'⭐'.repeat(badge.titles)}
              </div>
            )}
            
            {/* Quick Stats */}
            <div style={{ fontSize: '9px', color: '#64748b' }}>
              {badge.wm_appearances}x WM • {badge.total_wins}-{badge.total_draws}-{badge.total_losses}
            </div>
            
            {/* Tags */}
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
              {badge.is_host && (
                <span style={{ 
                  padding: '2px 6px', 
                  background: '#3b82f6', 
                  borderRadius: '4px', 
                  fontSize: '8px', 
                  color: 'white' 
                }}>
                  🏠 {t('badgesHost')}
                </span>
              )}
              {badge.is_debutant && (
                <span style={{ 
                  padding: '2px 6px', 
                  background: '#10b981', 
                  borderRadius: '4px', 
                  fontSize: '8px', 
                  color: 'white' 
                }}>
                  ✨ {t('badgesDebutant')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedTeam(null)}
        >
          <div 
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              border: '1px solid #334155'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {selectedTeam.flag_emoji}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                {language === 'en' ? selectedTeam.name_en : selectedTeam.name_de}
              </div>
              {selectedTeam.titles > 0 && (
                <div style={{ fontSize: '14px', marginTop: '4px' }}>
                  {'⭐'.repeat(selectedTeam.titles)} {getMedalIcon(selectedTeam.titles)}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                {selectedTeam.confederation} • {selectedTeam.wm2026_group ? `${t('group')} ${selectedTeam.wm2026_group}` : t('badgesQualified')}
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #334155',
              overflowX: 'auto'
            }}>
              {[
                { id: 'stats', label: t('badgesTabStats') },
                { id: 'scorers', label: t('badgesTabScorers') },
                { id: 'legends', label: t('badgesTabLegends') },
                { id: 'coaches', label: t('badgesTabCoaches') },
                { id: 'h2h', label: t('badgesTabH2H'), premium: true }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id)}
                  style={{
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: activeModalTab === tab.id ? '#10b981' : '#64748b',
                    fontSize: '11px',
                    fontWeight: activeModalTab === tab.id ? 'bold' : 'normal',
                    cursor: 'pointer',
                    borderBottom: activeModalTab === tab.id ? '2px solid #10b981' : '2px solid transparent',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label} {tab.premium && !isPremium && '🔒'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '16px', maxHeight: '50vh', overflowY: 'auto' }}>
              
              {/* Stats Tab */}
              {activeModalTab === 'stats' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <StatBox label={t('badgesAppearances')} value={selectedTeam.wm_appearances} />
                    <StatBox label={t('badgesRecord')} value={`${selectedTeam.total_wins}-${selectedTeam.total_draws}-${selectedTeam.total_losses}`} />
                    <StatBox label={t('badgesGoals')} value={`${selectedTeam.total_goals_scored}:${selectedTeam.total_goals_conceded}`} />
                    <StatBox label={t('badgesBestResult')} value={selectedTeam.best_result} subtext={selectedTeam.best_result_year} />
                  </div>
                  
                  {/* WM Years */}
                  {selectedTeam.wm_years && selectedTeam.wm_years.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>{t('badgesWmYears')}:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedTeam.wm_years.map(year => (
                          <span key={year} style={{
                            padding: '4px 8px',
                            background: '#1e293b',
                            borderRadius: '4px',
                            fontSize: '10px',
                            color: '#94a3b8'
                          }}>
                            {year}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Cards */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <div style={{ 
                      padding: '8px 12px', 
                      background: 'rgba(234, 179, 8, 0.2)', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '16px' }}>🟨</span>
                      <span style={{ fontSize: '12px', color: '#eab308' }}>{selectedTeam.total_yellow_cards}</span>
                    </div>
                    <div style={{ 
                      padding: '8px 12px', 
                      background: 'rgba(239, 68, 68, 0.2)', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '16px' }}>🟥</span>
                      <span style={{ fontSize: '12px', color: '#ef4444' }}>{selectedTeam.total_red_cards}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scorers Tab */}
              {activeModalTab === 'scorers' && (
                <div>
                  {scorers[selectedTeam.country_code]?.length > 0 ? (
                    scorers[selectedTeam.country_code].map((scorer, idx) => (
                      <div key={idx} style={{
                        padding: '12px',
                        background: '#1e293b',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                            {scorer.player_name}
                            {scorer.is_all_time_record && <span style={{ marginLeft: '6px' }}>👑</span>}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {scorer.wm_tournaments?.join(', ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                            {scorer.goals}
                          </div>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>
                            {scorer.is_active ? '🟢 ' + t('badgesActive') : t('badgesRetired')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                      {t('badgesNoData')}
                    </div>
                  )}
                </div>
              )}

              {/* Legends Tab */}
              {activeModalTab === 'legends' && (
                <div>
                  {legends[selectedTeam.country_code]?.length > 0 ? (
                    legends[selectedTeam.country_code].map((legend, idx) => (
                      <div key={idx} style={{
                        padding: '12px',
                        background: '#1e293b',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                              {legend.player_name}
                              {legend.is_legend && <span style={{ marginLeft: '6px' }}>⭐</span>}
                              {legend.is_current_star && <span style={{ marginLeft: '4px' }}>🔥</span>}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{legend.position}</div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
                            {legend.wm_appearances}x WM • {legend.wm_goals} {t('badgesGoalsScored')}
                          </div>
                        </div>
                        {legend.achievements && legend.achievements.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {legend.achievements.map((ach, i) => (
                              <span key={i} style={{
                                padding: '2px 6px',
                                background: '#0f172a',
                                borderRadius: '4px',
                                fontSize: '9px',
                                color: '#10b981'
                              }}>
                                {ach}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                      {t('badgesNoData')}
                    </div>
                  )}
                </div>
              )}

              {/* Coaches Tab */}
              {activeModalTab === 'coaches' && (
                <div>
                  {coaches[selectedTeam.country_code]?.length > 0 ? (
                    coaches[selectedTeam.country_code].map((coach, idx) => (
                      <div key={idx} style={{
                        padding: '12px',
                        background: coach.is_current ? 'rgba(16, 185, 129, 0.1)' : '#1e293b',
                        border: coach.is_current ? '1px solid #10b981' : '1px solid transparent',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                            {coach.coach_name}
                            {coach.is_current && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#10b981' }}>({t('badgesCurrentCoach')})</span>}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            WM {coach.wm_year} • {coach.result}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
                          {coach.wins}-{coach.draws}-{coach.losses}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                      {t('badgesNoData')}
                    </div>
                  )}
                </div>
              )}

              {/* H2H Tab (Premium) */}
              {activeModalTab === 'h2h' && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  {isPremium ? (
                    <div style={{ color: '#64748b' }}>{t('badgesH2HLoading')}</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
                      <div style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{t('badgesPremiumOnly')}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                        {t('badgesPremiumDesc')}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div style={{ padding: '16px', borderTop: '1px solid #334155', textAlign: 'center' }}>
              <button
                onClick={() => setSelectedTeam(null)}
                style={{
                  padding: '10px 24px',
                  background: '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component
const StatBox = ({ label, value, subtext }) => (
  <div style={{
    padding: '12px',
    background: '#1e293b',
    borderRadius: '8px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{value}</div>
    {subtext && <div style={{ fontSize: '9px', color: '#10b981' }}>{subtext}</div>}
  </div>
);

export default WM2026TeamBadges;
