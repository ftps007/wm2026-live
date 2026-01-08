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
  const [activeModalTab, setActiveModalTab] = useState('media');
  const [mediaSubTab, setMediaSubTab] = useState('news'); // 'news' or 'videos'
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
            onClick={() => { setSelectedTeam(badge); setActiveModalTab('media'); setMediaSubTab('news'); }}
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
              padding: '16px 20px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '120px'
            }}>
              {/* Layout: Flag + Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                position: 'relative',
                zIndex: 1
              }}>
                {/* Flag */}
                <div style={{
                  fontSize: '80px',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }}>
                  {selectedTeam.flag_emoji}
                </div>
                {/* Name & Info */}
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                    {language === 'en' ? selectedTeam.name_en : selectedTeam.name_de}
                  </div>
                  {selectedTeam.titles > 0 && (
                    <div style={{ fontSize: '16px', marginTop: '4px' }}>
                      {'⭐'.repeat(selectedTeam.titles)} {getMedalIcon(selectedTeam.titles)}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                    {selectedTeam.confederation} • {selectedTeam.wm2026_group ? `${t('group')} ${selectedTeam.wm2026_group}` : t('badgesQualified')}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #334155',
              overflowX: 'auto'
            }}>
              {[
                { id: 'media', label: t('badgesTabMedia') || '🎬 Medien' },
                { id: 'road2026', label: t('badgesTabRoad2026') || '🛣️ Road to WC' },
                { id: 'group', label: t('badgesTabGroup') || '📊 Gruppe' },
                { id: 'stats', label: t('badgesTabStats') },
                { id: 'scorers', label: t('badgesTabScorers') },
                { id: 'legends', label: t('badgesTabLegends') },
                { id: 'coaches', label: t('badgesTabCoaches') }
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
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '16px', maxHeight: '50vh', overflowY: 'auto' }}>

              {/* Media Tab - News & Videos combined */}
              {activeModalTab === 'media' && (
                <div>
                  {/* Sub-tabs for News/Videos */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                      onClick={() => setMediaSubTab('news')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: mediaSubTab === 'news' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#1e293b',
                        border: mediaSubTab === 'news' ? 'none' : '1px solid #334155',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: mediaSubTab === 'news' ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      📰 {t('badgesTabNews') || 'News'}
                    </button>
                    <button
                      onClick={() => setMediaSubTab('videos')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: mediaSubTab === 'videos' ? 'linear-gradient(135deg, #ff0000, #cc0000)' : '#1e293b',
                        border: mediaSubTab === 'videos' ? 'none' : '1px solid #334155',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: mediaSubTab === 'videos' ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      🎬 {t('badgesTabVideos') || 'Videos'}
                    </button>
                  </div>

                  {/* News Sub-Content */}
                  {mediaSubTab === 'news' && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                        📰 {t('badgesTeamNews') || 'Aktuelle News zu'} {language === 'en' ? selectedTeam.name_en : selectedTeam.name_de}
                      </div>
                      <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📰</div>
                        <div style={{ fontSize: '11px' }}>
                          {t('badgesNewsComingSoon') || 'Team-News werden bald hier angezeigt'}
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '8px', color: '#475569' }}>
                          {t('badgesNewsHint') || 'News werden aus der Hauptsektion "News" gefiltert'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Videos Sub-Content */}
                  {mediaSubTab === 'videos' && (
                    <div>
                      {(() => {
                        const TEAM_VIDEOS = {
                          'DE': [
                            { title: '2014 WM Finale - Deutschland vs Argentinien', videoId: 'pD6i37Z8f9Y', year: 2014 },
                            { title: 'Deutschland 7:1 Brasilien WM 2014', videoId: 'bQVoAWSP7k4', year: 2014 },
                            { title: 'WM 1990 Finale - Deutschland vs Argentinien', videoId: 'Y_0mD9Xqx8A', year: 1990 },
                            { title: 'WM 1974 - Das Wunder von Bern', searchQuery: 'Deutschland WM 1974 Highlights', year: 1974 },
                            { title: 'DFB Team - Road to 2026', searchQuery: 'DFB Nationalmannschaft 2025', year: 2025 },
                          ],
                          'BR': [
                            { title: 'Brasilien 5x Weltmeister - Alle Titel', searchQuery: 'Brazil World Cup wins all goals', year: 2002 },
                            { title: 'Pelé - Bester Spieler aller Zeiten', searchQuery: 'Pele best goals World Cup', year: 1970 },
                            { title: 'Brasilien 2002 - Ronaldo Show', videoId: 'k_X5nKs5VQQ', year: 2002 },
                          ],
                          'AR': [
                            { title: 'Argentinien WM 2022 - Der Triumph', videoId: 'GGmJt9bNk7w', year: 2022 },
                            { title: 'Messi - Alle WM Tore', searchQuery: 'Messi all World Cup goals', year: 2022 },
                            { title: 'Maradona - Hand Gottes 1986', videoId: 'Uh5Lz2yMYWk', year: 1986 },
                          ],
                          'FR': [
                            { title: 'Frankreich WM 2018 - Weltmeister', searchQuery: 'France World Cup 2018 highlights', year: 2018 },
                            { title: 'Mbappé - Alle WM Tore', searchQuery: 'Mbappe World Cup goals', year: 2022 },
                            { title: 'Zidane 1998 - Der Doppelpack im Finale', videoId: 'IOtTJJm4XCI', year: 1998 },
                          ],
                          'ES': [
                            { title: 'Spanien 2010 - Der einzige Titel', searchQuery: 'Spain World Cup 2010 final', year: 2010 },
                            { title: 'Iniesta - Das Tor das Spanien unsterblich machte', videoId: '7gNuEPmNKhI', year: 2010 },
                          ],
                          'IT': [
                            { title: 'Italien 2006 - Weltmeister in Berlin', searchQuery: 'Italy World Cup 2006 final', year: 2006 },
                            { title: 'Fabio Grosso - Das legendäre Tor', videoId: 'G1FtCgVKNBQ', year: 2006 },
                          ],
                          'EN': [
                            { title: 'England 1966 - Einziger WM Titel', searchQuery: 'England World Cup 1966 final', year: 1966 },
                            { title: 'Geoff Hurst Hattrick im Finale', searchQuery: 'Geoff Hurst hat trick 1966', year: 1966 },
                          ],
                          'NL': [
                            { title: 'Niederlande - Totaler Fußball 1974', searchQuery: 'Netherlands Total Football 1974', year: 1974 },
                            { title: 'Cruyff Turn - Die Legende', searchQuery: 'Johan Cruyff turn World Cup', year: 1974 },
                          ],
                          'PL': [
                            { title: 'Polen WM 1974 & 1982 - Die goldene Ära', searchQuery: 'Poland World Cup 1974 1982', year: 1982 },
                            { title: 'Lewandowski - Polens Rekordtorjäger', searchQuery: 'Lewandowski Poland goals', year: 2022 },
                          ],
                        };

                        const teamVideos = TEAM_VIDEOS[selectedTeam.country_code] || [];
                        const teamName = language === 'en' ? selectedTeam.name_en : selectedTeam.name_de;

                        return (
                          <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                              🎬 {t('badgesTeamVideos') || 'WM-Videos zu'} {teamName}
                            </div>

                            {teamVideos.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {teamVideos.map((video, idx) => (
                                  <a
                                    key={idx}
                                    href={video.videoId
                                      ? `https://www.youtube.com/watch?v=${video.videoId}`
                                      : `https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px',
                                      padding: '10px',
                                      background: '#1e293b',
                                      borderRadius: '8px',
                                      textDecoration: 'none',
                                      border: '1px solid #334155',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <div style={{
                                      width: '80px',
                                      height: '45px',
                                      background: video.videoId
                                        ? `url(https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg) center/cover`
                                        : 'linear-gradient(135deg, #ff0000, #cc0000)',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      <span style={{ fontSize: '20px' }}>▶️</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '12px', color: 'white', fontWeight: '500' }}>
                                        {video.title}
                                      </div>
                                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                        {video.year} • YouTube
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎬</div>
                                <div style={{ fontSize: '11px' }}>
                                  {t('badgesNoVideos') || 'Videos werden bald hinzugefügt'}
                                </div>
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(teamName + ' World Cup highlights')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-block',
                                    marginTop: '12px',
                                    padding: '8px 16px',
                                    background: '#ff0000',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    textDecoration: 'none'
                                  }}
                                >
                                  🔎 {t('badgesSearchYouTube') || 'Auf YouTube suchen'}
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Group Tab - Group info + H2H */}
              {activeModalTab === 'group' && (
                <div>
                  {(() => {
                    const groupCode = selectedTeam.wm2026_group;
                    const groupOpponents = badges.filter(b =>
                      b.wm2026_group === groupCode && b.country_code !== selectedTeam.country_code
                    );

                    // H2H Data
                    const H2H_MATCHES = {
                      'DE': {
                        'MX': [
                          { date: '2018-06-17', comp: 'WM', venue: 'Moskau', attendance: 78011, result: '0:1', scorers: ['Lozano'] },
                          { date: '2017-06-29', comp: 'Confed', venue: 'Sotschi', attendance: 40855, result: '4:1', scorers: ['Goretzka 2', 'Werner 2', 'Fabian'] },
                          { date: '2005-06-29', comp: 'Confed', venue: 'Leipzig', attendance: 43000, result: '4:3 n.V.', scorers: ['Ballack 2', 'Klose', 'Podolski', 'Fonseca 2', 'Borgetti'] },
                        ],
                        'ZA': [
                          { date: '2014-03-05', comp: 'FS', venue: 'Stuttgart', attendance: 51200, result: '0:0', scorers: [] },
                          { date: '2010-06-13', comp: 'WM (Test)', venue: 'Pretoria', attendance: 64100, result: '0:1', scorers: ['Tshabalala (Eröffnung)'] },
                        ],
                        'KR': [
                          { date: '2018-06-27', comp: 'WM', venue: 'Kasan', attendance: 41835, result: '0:2', scorers: ['Kim', 'Son'] },
                          { date: '2004-12-19', comp: 'FS', venue: 'Busan', attendance: 42000, result: '3:1', scorers: ['Kuranyi 2', 'Schneider', 'Lee'] },
                          { date: '2002-06-25', comp: 'WM SF', venue: 'Seoul', attendance: 65625, result: '1:0', scorers: ['Ballack'] },
                        ],
                        'DK': [
                          { date: '2021-06-28', comp: 'EM', venue: 'Wembley', attendance: 45000, result: '2:0 (England)', scorers: [] },
                          { date: '2012-06-17', comp: 'EM', venue: 'Lwiw', attendance: 30440, result: '2:1', scorers: ['Podolski', 'Bender', 'Krohn-Dehli'] },
                          { date: '2002-06-14', comp: 'WM', venue: 'Ulsan', attendance: 30175, result: '0:0', scorers: [] },
                          { date: '1998-06-21', comp: 'WM', venue: 'Lyon', attendance: 41000, result: '2:1', scorers: ['Bierhoff', 'Klinsmann', 'M.Laudrup'] },
                          { date: '1992-06-18', comp: 'EM Finale', venue: 'Göteborg', attendance: 37800, result: '0:2', scorers: ['J.Jensen', 'Vilfort'] },
                          { date: '1988-06-14', comp: 'EM', venue: 'Gelsenkirchen', attendance: 68000, result: '2:0', scorers: ['Klinsmann', 'Thon'] },
                          { date: '1986-06-13', comp: 'WM', venue: 'Querétaro', attendance: 26500, result: '2:0', scorers: ['Allofs', 'Jakobs'] },
                        ],
                      },
                      'BR': {
                        'AR': [
                          { date: '2021-07-10', comp: 'Copa Finale', venue: 'Rio', attendance: 7800, result: '0:1', scorers: ['Di María'] },
                          { date: '2019-07-02', comp: 'Copa HF', venue: 'Belo Horizonte', attendance: 56000, result: '2:0', scorers: ['Gabriel Jesus', 'Firmino'] },
                          { date: '2018-10-16', comp: 'FS', venue: 'Riad', attendance: 55000, result: '1:0', scorers: ['Miranda'] },
                        ],
                      },
                      'AR': {
                        'BR': [
                          { date: '2021-07-10', comp: 'Copa Finale', venue: 'Rio', attendance: 7800, result: '1:0', scorers: ['Di María'] },
                          { date: '2019-07-02', comp: 'Copa HF', venue: 'Belo Horizonte', attendance: 56000, result: '0:2', scorers: [] },
                        ],
                      },
                      'FR': {
                        'NL': [
                          { date: '2024-03-25', comp: 'FS', venue: 'Paris', attendance: 75000, result: '0:0', scorers: [] },
                          { date: '2018-09-09', comp: 'NL', venue: 'Paris', attendance: 78000, result: '2:1', scorers: ['Giroud', 'Mbappé', 'Babel'] },
                        ],
                        'PL': [
                          { date: '2022-12-04', comp: 'WM AF', venue: 'Al-Thumama', attendance: 40472, result: '3:1', scorers: ['Giroud', 'Mbappé 2', 'Lewandowski (P)'] },
                        ],
                      },
                      'PL': {
                        'FR': [
                          { date: '2022-12-04', comp: 'WM AF', venue: 'Al-Thumama', attendance: 40472, result: '1:3', scorers: ['Lewandowski (P)'] },
                        ],
                        'NL': [
                          { date: '2022-09-22', comp: 'NL', venue: 'Warschau', attendance: 55000, result: '0:2', scorers: [] },
                        ],
                      },
                    };

                    const h2hData = H2H_MATCHES[selectedTeam.country_code] || {};

                    return (
                      <div>
                        {/* Group Header */}
                        {groupCode ? (
                          <div style={{
                            padding: '12px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                              📊 {t('group')} {groupCode}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                              {t('badgesGroupOpponents') || 'Gruppengegner'}:
                              {groupOpponents.map(opp => ` ${opp.flag_emoji}`).join('')}
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#64748b', padding: '20px', marginBottom: '16px' }}>
                            {t('badgesNoGroup') || 'Gruppe noch nicht festgelegt'}
                          </div>
                        )}

                        {/* H2H Section */}
                        {groupOpponents.length > 0 && (
                          <>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                              ⚔️ Head-to-Head
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '12px' }}>
                              {t('badgesH2HDesc') || 'Pflicht- & Freundschaftsspiele'}
                            </div>

                            {groupOpponents.map(opponent => {
                              const matches = h2hData[opponent.country_code] || [];
                              return (
                                <div key={opponent.country_code} style={{ marginBottom: '16px' }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px',
                                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                    borderRadius: '8px',
                                    marginBottom: '8px'
                                  }}>
                                    <span style={{ fontSize: '24px' }}>{opponent.flag_emoji}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                                      vs {language === 'en' ? opponent.name_en : opponent.name_de}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#64748b', marginLeft: 'auto' }}>
                                      {matches.length} {t('badgesMatches') || 'Spiele'}
                                    </span>
                                  </div>

                                  {matches.length > 0 ? (
                                    matches.map((match, idx) => (
                                      <div key={idx} style={{
                                        padding: '10px 12px',
                                        background: '#1e293b',
                                        borderRadius: '6px',
                                        marginBottom: '6px',
                                        fontSize: '11px'
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div>
                                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{match.result}</span>
                                            <span style={{ color: '#64748b', marginLeft: '8px' }}>{match.comp}</span>
                                          </div>
                                          <span style={{ color: '#94a3b8' }}>{match.date}</span>
                                        </div>
                                        <div style={{ marginTop: '4px', color: '#64748b', fontSize: '10px' }}>
                                          📍 {match.venue}
                                          {match.attendance > 0 && <span> • 👥 {match.attendance.toLocaleString()}</span>}
                                        </div>
                                        {match.scorers && match.scorers.length > 0 && (
                                          <div style={{ marginTop: '4px', color: '#fbbf24', fontSize: '10px' }}>
                                            ⚽ {match.scorers.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ padding: '12px', color: '#64748b', fontSize: '11px', textAlign: 'center' }}>
                                      {t('badgesNoH2HData') || 'Keine H2H-Daten verfügbar'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Stats Tab */}
              {activeModalTab === 'stats' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <StatBox label={t('badgesAppearances')} value={selectedTeam.wm_appearances} />
                    <StatBox label={t('badgesRecord')} value={`${selectedTeam.total_wins}-${selectedTeam.total_draws}-${selectedTeam.total_losses}`} />
                    <StatBox label={t('badgesGoals')} value={`${selectedTeam.total_goals_scored}:${selectedTeam.total_goals_conceded}`} />
                    <StatBox
                      label={t('badgesBestResult')}
                      value={selectedTeam.best_result}
                      subtext={(() => {
                        // Show all championship years for World Cup winners
                        const wmChampionYears = {
                          'AR': [1978, 1986, 2022],
                          'BR': [1958, 1962, 1970, 1994, 2002],
                          'DE': [1954, 1974, 1990, 2014],
                          'EN': [1966],
                          'ES': [2010],
                          'FR': [1998, 2018],
                          'IT': [1934, 1938, 1982, 2006],
                          'UY': [1930, 1950],
                        };
                        const years = wmChampionYears[selectedTeam.country_code];
                        if (years && years.length > 0) {
                          return '🏆 ' + years.join(', ');
                        }
                        return selectedTeam.best_result_year;
                      })()}
                    />
                  </div>
                  
                  {/* WM Years mit Gold/Silber/Bronze Markierung */}
                  {selectedTeam.wm_years && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>{t('badgesWmYears')}:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(() => {
                          // WM-Platzierungen: Gold (1.), Silber (2.), Bronze (3.)
                          const wmResults = {
                            // Weltmeister (Gold)
                            gold: {
                              'AR': [1978, 1986, 2022],
                              'BR': [1958, 1962, 1970, 1994, 2002],
                              'DE': [1954, 1974, 1990, 2014],
                              'EN': [1966],
                              'ES': [2010],
                              'FR': [1998, 2018],
                              'IT': [1934, 1938, 1982, 2006],
                              'UY': [1930, 1950],
                            },
                            // Vizeweltmeister (Silber)
                            silver: {
                              'AR': [1930, 1990, 2014],
                              'BR': [1950, 1998],
                              'DE': [1966, 1982, 1986, 2002],
                              'HR': [2018],
                              'FR': [2006, 2022],
                              'HU': [1938, 1954],
                              'IT': [1970, 1994],
                              'NL': [1974, 1978, 2010],
                              'CZ': [1934, 1962],
                            },
                            // Dritter Platz (Bronze)
                            bronze: {
                              'AR': [2024], // Placeholder
                              'AT': [1954],
                              'BR': [1938, 1978],
                              'BE': [2018],
                              'DE': [1934, 1970, 2006, 2010],
                              'HR': [1998, 2022],
                              'FR': [1958, 1986],
                              'IT': [1990],
                              'NL': [2014],
                              'PL': [1974, 1982],
                              'PT': [1966],
                              'SE': [1950, 1994],
                              'TR': [2002],
                              'US': [1930],
                              'MA': [2022],
                            }
                          };
                          
                          // Jahre inkl. 2026 für qualifizierte Teams
                          const years = [...(selectedTeam.wm_years || [])];
                          if (selectedTeam.is_qualified_2026 && !years.includes(2026) && !years.includes('2026')) {
                            years.push(2026);
                          }
                          
                          const getYearStyle = (year) => {
                            const yearNum = parseInt(year);
                            const code = selectedTeam.country_code;
                            
                            // Gold - Weltmeister
                            if (wmResults.gold[code]?.includes(yearNum)) {
                              return {
                                background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)',
                                color: '#000',
                                fontWeight: 'bold',
                                boxShadow: '0 0 8px rgba(255, 215, 0, 0.5)'
                              };
                            }
                            // Silber - Vizeweltmeister
                            if (wmResults.silver[code]?.includes(yearNum)) {
                              return {
                                background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)',
                                color: '#000',
                                fontWeight: 'bold',
                                boxShadow: '0 0 6px rgba(192, 192, 192, 0.5)'
                              };
                            }
                            // Bronze - Dritter Platz
                            if (wmResults.bronze[code]?.includes(yearNum)) {
                              return {
                                background: 'linear-gradient(135deg, #cd7f32 0%, #8b4513 100%)',
                                color: '#fff',
                                fontWeight: 'bold',
                                boxShadow: '0 0 6px rgba(205, 127, 50, 0.5)'
                              };
                            }
                            // 2026 - Spezielle Markierung
                            if (yearNum === 2026) {
                              return {
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                fontWeight: 'bold'
                              };
                            }
                            // Standard
                            return {
                              background: '#1e293b',
                              color: '#94a3b8'
                            };
                          };
                          
                          return years.sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                            <span key={year} style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              ...getYearStyle(year)
                            }}>
                              {year}
                            </span>
                          ));
                        })()}
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
                  {(() => {
                    // Filter: nur Spieler mit mind. 1 Tor, Top 10
                    const filteredScorers = (scorers[selectedTeam.country_code] || [])
                      .filter(s => s.goals > 0)
                      .sort((a, b) => b.goals - a.goals)
                      .slice(0, 10);

                    return filteredScorers.length > 0 ? (
                      filteredScorers.map((scorer, idx) => (
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
                              {scorer.is_all_time_record && <span style={{ marginLeft: '6px' }} title="WM-Rekordtorschütze aller Zeiten">👑</span>}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              {scorer.wm_tournaments?.join(', ')}
                            </div>
                            {/* Current Club for active players */}
                            {scorer.is_active && scorer.current_club && (
                              <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '2px' }}>
                                🏟️ {scorer.current_club}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                              {scorer.goals}
                            </div>
                            <div style={{ fontSize: '9px', color: scorer.is_active ? '#10b981' : '#ef4444' }}>
                              {scorer.is_active ? '🟢 ' + t('badgesActive') : '🔴 ' + t('badgesRetired')}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                        {t('badgesNoData')}
                      </div>
                    );
                  })()}
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
                            {/* Current Club for active players */}
                            {legend.is_current_star && legend.current_club && (
                              <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '2px' }}>
                                🏟️ {legend.current_club}
                              </div>
                            )}
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

              {/* Road to 2026 Tab */}
              {activeModalTab === 'road2026' && (
                <div>
                  {(() => {
                    // Qualification data by confederation
                    const QUALIFICATION_DATA = {
                      // UEFA - European Qualification
                      'UEFA': {
                        format: 'Gruppenphase + Playoffs',
                        totalSlots: 16,
                        groups: 12,
                        description: '12 Gruppensieger qualifiziert, 4 weitere über Playoffs',
                      },
                      // CONMEBOL - South American Qualification
                      'CONMEBOL': {
                        format: 'Einzelne Liga (alle vs alle)',
                        totalSlots: 6,
                        rounds: 18,
                        description: 'Top 6 direkt qualifiziert, Platz 7 in Interkont. Playoffs',
                      },
                      // CONCACAF - North/Central American Qualification
                      'CONCACAF': {
                        format: 'Gruppenphase (Final Round)',
                        totalSlots: 6,
                        description: 'Top 3 direkt qualifiziert + 3 Gastgeber (USA, Mexiko, Kanada)',
                      },
                      // AFC - Asian Qualification
                      'AFC': {
                        format: 'Gruppenphase (3 Runden)',
                        totalSlots: 8,
                        description: '8 direkt qualifiziert, 9. Platz in Interkont. Playoffs',
                      },
                      // CAF - African Qualification
                      'CAF': {
                        format: 'Gruppenphase',
                        totalSlots: 9,
                        description: '9 Gruppensieger qualifiziert, 4 Gruppenzweite in Playoffs',
                      },
                      // OFC - Oceania Qualification
                      'OFC': {
                        format: 'Gruppenphase + Finale',
                        totalSlots: 1,
                        description: '1 Platz, Zweiter in Interkont. Playoffs',
                      },
                    };

                    // Team-specific qualification results
                    const TEAM_QUALI_RESULTS = {
                      'DE': { group: 'A', position: 1, played: 8, won: 7, drawn: 1, lost: 0, gf: 36, ga: 5, points: 22 },
                      'ES': { group: 'B', position: 1, played: 8, won: 8, drawn: 0, lost: 0, gf: 28, ga: 2, points: 24 },
                      'FR': { group: 'C', position: 1, played: 8, won: 6, drawn: 2, lost: 0, gf: 20, ga: 3, points: 20 },
                      'EN': { group: 'D', position: 1, played: 8, won: 7, drawn: 1, lost: 0, gf: 23, ga: 4, points: 22 },
                      'IT': { group: 'E', position: 1, played: 8, won: 6, drawn: 2, lost: 0, gf: 17, ga: 4, points: 20 },
                      'NL': { group: 'F', position: 1, played: 8, won: 6, drawn: 1, lost: 1, gf: 22, ga: 6, points: 19 },
                      'PT': { group: 'G', position: 1, played: 8, won: 7, drawn: 1, lost: 0, gf: 24, ga: 5, points: 22 },
                      'BE': { group: 'H', position: 1, played: 8, won: 6, drawn: 1, lost: 1, gf: 18, ga: 7, points: 19 },
                      'PL': { group: 'I', position: 1, played: 8, won: 5, drawn: 2, lost: 1, gf: 16, ga: 8, points: 17 },
                      'AR': { group: 'CONMEBOL', position: 1, played: 18, won: 12, drawn: 4, lost: 2, gf: 35, ga: 12, points: 40 },
                      'BR': { group: 'CONMEBOL', position: 2, played: 18, won: 11, drawn: 3, lost: 4, gf: 30, ga: 15, points: 36 },
                      'US': { qualified: 'host', note: 'Gastgeber - automatisch qualifiziert' },
                      'MX': { qualified: 'host', note: 'Gastgeber - automatisch qualifiziert' },
                      'CA': { qualified: 'host', note: 'Gastgeber - automatisch qualifiziert' },
                    };

                    const confData = QUALIFICATION_DATA[selectedTeam.confederation] || {};
                    const teamQuali = TEAM_QUALI_RESULTS[selectedTeam.country_code];

                    return (
                      <div>
                        {/* Confederation Info */}
                        <div style={{
                          padding: '12px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          borderRadius: '8px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                            {selectedTeam.confederation} {t('badgesQualiPath') || 'Qualifikation'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                            {confData.format} • {confData.totalSlots} {t('badgesSlots') || 'Plätze'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                            {confData.description}
                          </div>
                        </div>

                        {/* Team's Qualification Result */}
                        {teamQuali && (
                          <div style={{
                            padding: '12px',
                            background: '#1e293b',
                            borderRadius: '8px',
                            border: '1px solid #10b981'
                          }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                              ✅ {t('badgesQualified') || 'Qualifiziert'}
                            </div>

                            {teamQuali.qualified === 'host' ? (
                              <div style={{ fontSize: '11px', color: '#fbbf24' }}>
                                🏠 {teamQuali.note}
                              </div>
                            ) : (
                              <>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                                  {teamQuali.group?.startsWith('CONMEBOL') ? 'CONMEBOL Liga' : `Gruppe ${teamQuali.group}`}
                                  {teamQuali.position && ` • ${teamQuali.position}. Platz`}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{teamQuali.played}</div>
                                    <div style={{ fontSize: '9px', color: '#64748b' }}>Sp</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{teamQuali.won}</div>
                                    <div style={{ fontSize: '9px', color: '#64748b' }}>S</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fbbf24' }}>{teamQuali.drawn}</div>
                                    <div style={{ fontSize: '9px', color: '#64748b' }}>U</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>{teamQuali.lost}</div>
                                    <div style={{ fontSize: '9px', color: '#64748b' }}>N</div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px' }}>
                                  <span style={{ color: '#94a3b8' }}>Tore: {teamQuali.gf}:{teamQuali.ga}</span>
                                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{teamQuali.points} Punkte</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {!teamQuali && (
                          <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                            {t('badgesNoQualiData') || 'Qualifikationsdaten werden geladen...'}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* News Tab - Team specific news */}
              {activeModalTab === 'news' && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                    📰 {t('badgesTeamNews') || 'Aktuelle News zu'} {language === 'en' ? selectedTeam.name_en : selectedTeam.name_de}
                  </div>
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📰</div>
                    <div style={{ fontSize: '11px' }}>
                      {t('badgesNewsComingSoon') || 'Team-News werden bald hier angezeigt'}
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '8px', color: '#475569' }}>
                      {t('badgesNewsHint') || 'News werden aus der Hauptsektion "News" gefiltert'}
                    </div>
                  </div>
                </div>
              )}

              {/* Videos Tab - Team specific videos */}
              {activeModalTab === 'videos' && (
                <div>
                  {(() => {
                    // Team-specific video searches
                    const TEAM_VIDEOS = {
                      'DE': [
                        { title: '2014 WM Finale - Deutschland vs Argentinien', videoId: 'pD6i37Z8f9Y', year: 2014 },
                        { title: 'Deutschland 7:1 Brasilien WM 2014', videoId: 'bQVoAWSP7k4', year: 2014 },
                        { title: 'WM 1990 Finale - Deutschland vs Argentinien', videoId: 'Y_0mD9Xqx8A', year: 1990 },
                        { title: 'WM 1974 - Das Wunder von Bern', searchQuery: 'Deutschland WM 1974 Highlights', year: 1974 },
                        { title: 'DFB Team - Road to 2026', searchQuery: 'DFB Nationalmannschaft 2025', year: 2025 },
                      ],
                      'BR': [
                        { title: 'Brasilien 5x Weltmeister - Alle Titel', searchQuery: 'Brazil World Cup wins all goals', year: 2002 },
                        { title: 'Pelé - Bester Spieler aller Zeiten', searchQuery: 'Pele best goals World Cup', year: 1970 },
                        { title: 'Brasilien 2002 - Ronaldo Show', videoId: 'k_X5nKs5VQQ', year: 2002 },
                      ],
                      'AR': [
                        { title: 'Argentinien WM 2022 - Der Triumph', videoId: 'GGmJt9bNk7w', year: 2022 },
                        { title: 'Messi - Alle WM Tore', searchQuery: 'Messi all World Cup goals', year: 2022 },
                        { title: 'Maradona - Hand Gottes 1986', videoId: 'Uh5Lz2yMYWk', year: 1986 },
                      ],
                      'FR': [
                        { title: 'Frankreich WM 2018 - Weltmeister', searchQuery: 'France World Cup 2018 highlights', year: 2018 },
                        { title: 'Mbappé - Alle WM Tore', searchQuery: 'Mbappe World Cup goals', year: 2022 },
                        { title: 'Zidane 1998 - Der Doppelpack im Finale', videoId: 'IOtTJJm4XCI', year: 1998 },
                      ],
                      'ES': [
                        { title: 'Spanien 2010 - Der einzige Titel', searchQuery: 'Spain World Cup 2010 final', year: 2010 },
                        { title: 'Iniesta - Das Tor das Spanien unsterblich machte', videoId: '7gNuEPmNKhI', year: 2010 },
                      ],
                      'IT': [
                        { title: 'Italien 2006 - Weltmeister in Berlin', searchQuery: 'Italy World Cup 2006 final', year: 2006 },
                        { title: 'Fabio Grosso - Das legendäre Tor', videoId: 'G1FtCgVKNBQ', year: 2006 },
                      ],
                      'EN': [
                        { title: 'England 1966 - Einziger WM Titel', searchQuery: 'England World Cup 1966 final', year: 1966 },
                        { title: 'Geoff Hurst Hattrick im Finale', searchQuery: 'Geoff Hurst hat trick 1966', year: 1966 },
                      ],
                      'NL': [
                        { title: 'Niederlande - Totaler Fußball 1974', searchQuery: 'Netherlands Total Football 1974', year: 1974 },
                        { title: 'Cruyff Turn - Die Legende', searchQuery: 'Johan Cruyff turn World Cup', year: 1974 },
                      ],
                      'PL': [
                        { title: 'Polen WM 1974 & 1982 - Die goldene Ära', searchQuery: 'Poland World Cup 1974 1982', year: 1982 },
                        { title: 'Lewandowski - Polens Rekordtorjäger', searchQuery: 'Lewandowski Poland goals', year: 2022 },
                      ],
                    };

                    const teamVideos = TEAM_VIDEOS[selectedTeam.country_code] || [];
                    const teamName = language === 'en' ? selectedTeam.name_en : selectedTeam.name_de;

                    return (
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                          🎬 {t('badgesTeamVideos') || 'WM-Videos zu'} {teamName}
                        </div>

                        {teamVideos.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {teamVideos.map((video, idx) => (
                              <a
                                key={idx}
                                href={video.videoId
                                  ? `https://www.youtube.com/watch?v=${video.videoId}`
                                  : `https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px',
                                  background: '#1e293b',
                                  borderRadius: '8px',
                                  textDecoration: 'none',
                                  border: '1px solid #334155',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.borderColor = '#ff0000';
                                  e.currentTarget.style.background = '#1e293b';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.borderColor = '#334155';
                                }}
                              >
                                {/* Thumbnail */}
                                <div style={{
                                  width: '80px',
                                  height: '45px',
                                  background: video.videoId
                                    ? `url(https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg) center/cover`
                                    : 'linear-gradient(135deg, #ff0000, #cc0000)',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <span style={{ fontSize: '20px' }}>▶️</span>
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', color: 'white', fontWeight: '500' }}>
                                    {video.title}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                    {video.year} • YouTube
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎬</div>
                            <div style={{ fontSize: '11px' }}>
                              {t('badgesNoVideos') || 'Videos werden bald hinzugefügt'}
                            </div>
                            {/* Fallback search link */}
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(teamName + ' World Cup highlights')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                marginTop: '12px',
                                padding: '8px 16px',
                                background: '#ff0000',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                textDecoration: 'none'
                              }}
                            >
                              🔎 {t('badgesSearchYouTube') || 'Auf YouTube suchen'}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
