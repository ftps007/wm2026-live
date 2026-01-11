import React, { useState } from 'react';
import { translations } from './translations';

// Team data by group
const TEAMS_BY_GROUP = {
  A: [
    { flag: '🇿🇦', nameKey: 'South Africa', translationKey: 'sentimentSouthAfrica', score: '+0.108' },
    { flag: '🇲🇽', nameKey: 'Mexico', translationKey: 'sentimentMexico', score: '+0.103', host: true },
    { flag: '🇰🇷', nameKey: 'South Korea', translationKey: 'sentimentSouthKorea', score: '+0.079' },
  ],
  B: [
    { flag: '🇨🇦', nameKey: 'Canada', translationKey: 'sentimentCanada', score: '+0.105', host: true },
    { flag: '🇨🇭', nameKey: 'Switzerland', translationKey: 'sentimentSwitzerland', score: '+0.091' },
    { flag: '🇶🇦', nameKey: 'Qatar', translationKey: 'sentimentQatar', score: '+0.031' },
  ],
  C: [
    { flag: '🇧🇷', nameKey: 'Brazil', translationKey: 'sentimentBrazil', score: '+0.075' },
    { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', nameKey: 'Scotland', translationKey: 'sentimentScotland', score: '+0.072' },
    { flag: '🇲🇦', nameKey: 'Morocco', translationKey: 'sentimentMorocco', score: '+0.068' },
    { flag: '🇭🇹', nameKey: 'Haiti', translationKey: 'sentimentHaiti', score: '+0.043', debut: true },
  ],
  D: [
    { flag: '🇺🇸', nameKey: 'USA', translationKey: 'sentimentUSA', score: '+0.093', host: true },
    { flag: '🇵🇾', nameKey: 'Paraguay', translationKey: 'sentimentParaguay', score: '+0.084' },
    { flag: '🇦🇺', nameKey: 'Australia', translationKey: 'sentimentAustralia', score: '+0.018' },
  ],
  E: [
    { flag: '🇪🇨', nameKey: 'Ecuador', translationKey: 'sentimentEcuador', score: '+0.110' },
    { flag: '🇨🇮', nameKey: 'Ivory Coast', translationKey: 'sentimentIvoryCoast', score: '+0.083' },
    { flag: '🇨🇼', nameKey: 'Curaçao', translationKey: 'sentimentCuracao', score: '+0.064', debut: true },
    { flag: '🇩🇪', nameKey: 'Germany', translationKey: 'sentimentGermany', score: '+0.053' },
  ],
  F: [
    { flag: '🇳🇱', nameKey: 'Netherlands', translationKey: 'sentimentNetherlands', score: '+0.113' },
    { flag: '🇹🇳', nameKey: 'Tunisia', translationKey: 'sentimentTunisia', score: '+0.074' },
    { flag: '🇯🇵', nameKey: 'Japan', translationKey: 'sentimentJapan', score: '+0.069' },
  ],
  G: [
    { flag: '🇳🇿', nameKey: 'New Zealand', translationKey: 'sentimentNewZealand', score: '+0.147', highest: true },
    { flag: '🇧🇪', nameKey: 'Belgium', translationKey: 'sentimentBelgium', score: '+0.076' },
    { flag: '🇪🇬', nameKey: 'Egypt', translationKey: 'sentimentEgypt', score: '+0.033' },
    { flag: '🇮🇷', nameKey: 'Iran', translationKey: 'sentimentIran', score: '-0.034', negative: true },
  ],
  H: [
    { flag: '🇺🇾', nameKey: 'Uruguay', translationKey: 'sentimentUruguay', score: '+0.133' },
    { flag: '🇨🇻', nameKey: 'Cape Verde', translationKey: 'sentimentCapeVerde', score: '+0.121', debut: true },
    { flag: '🇪🇸', nameKey: 'Spain', translationKey: 'sentimentSpain', score: '+0.075' },
    { flag: '🇸🇦', nameKey: 'Saudi Arabia', translationKey: 'sentimentSaudiArabia', score: '+0.003' },
  ],
  I: [
    { flag: '🇸🇳', nameKey: 'Senegal', translationKey: 'sentimentSenegal', score: '+0.077' },
    { flag: '🇫🇷', nameKey: 'France', translationKey: 'sentimentFrance', score: '+0.075' },
    { flag: '🇳🇴', nameKey: 'Norway', translationKey: 'sentimentNorway', score: '+0.054' },
  ],
  J: [
    { flag: '🇦🇷', nameKey: 'Argentina', translationKey: 'sentimentArgentina', score: '+0.133', champion: true },
    { flag: '🇦🇹', nameKey: 'Austria', translationKey: 'sentimentAustria', score: '+0.107' },
    { flag: '🇯🇴', nameKey: 'Jordan', translationKey: 'sentimentJordan', score: '+0.097', debut: true },
    { flag: '🇩🇿', nameKey: 'Algeria', translationKey: 'sentimentAlgeria', score: '+0.047' },
  ],
  K: [
    { flag: '🇺🇿', nameKey: 'Uzbekistan', translationKey: 'sentimentUzbekistan', score: '+0.144', debut: true, highest: true },
    { flag: '🇵🇹', nameKey: 'Portugal', translationKey: 'sentimentPortugal', score: '+0.115' },
    { flag: '🇨🇴', nameKey: 'Colombia', translationKey: 'sentimentColombia', score: '+0.070' },
  ],
  L: [
    { flag: '🇬🇭', nameKey: 'Ghana', translationKey: 'sentimentGhana', score: '+0.102' },
    { flag: '🇭🇷', nameKey: 'Croatia', translationKey: 'sentimentCroatia', score: '+0.056' },
    { flag: '🇵🇦', nameKey: 'Panama', translationKey: 'sentimentPanama', score: '+0.047' },
    { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', nameKey: 'England', translationKey: 'sentimentEngland', score: '+0.044' },
  ],
};

// Negative drivers data
const NEGATIVE_DRIVERS = [
  { key: 'trumpVisa', sentiment: '-0.171', negPercent: '66.5%', width: '66.5%' },
  { key: 'venezuelaCrisis', sentiment: '-0.106', negPercent: '65.3%', width: '65.3%' },
  { key: 'ticketPrices', sentiment: '-0.159', negPercent: '61.7%', width: '61.7%' },
  { key: 'iranControversy', sentiment: '-0.034', negPercent: '35.9%', width: '35.9%' },
];

// Sponsor data
const SPONSORS = [
  { name: 'Diageo', translationKey: 'sentimentDiageo', score: '+0.379', negPercent: '0%', width: '85%', positive: true },
  { name: 'Lenovo', translationKey: 'sentimentLenovo', score: '+0.332', negPercent: '6%', width: '78%', positive: true },
  { name: 'Qatar Airways', translationKey: 'sentimentQatarAirways', score: '+0.319', negPercent: '0%', width: '76%', positive: true },
  { name: 'Verizon', translationKey: 'sentimentVerizon', score: '+0.265', negPercent: '0%', width: '70%', positive: true },
  { name: 'Aramco', translationKey: 'sentimentAramco', score: '-0.073', negPercent: '33%', width: '30%', positive: false },
];

// Improved Sentiment Gauge Component
const SentimentGauge = ({ value, label, subtitle, isHighlighted, colors }) => {
  const normalizedValue = (parseFloat(value) + 1) / 2;
  const angle = 180 - (normalizedValue * 180);
  const radians = (angle * Math.PI) / 180;
  const needleX = 80 + 55 * Math.cos(radians);
  const needleY = 80 - 55 * Math.sin(radians);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      border: isHighlighted ? `2px solid ${colors.green}` : 'none',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: isHighlighted ? colors.green : colors.grey,
        textTransform: 'uppercase',
        marginBottom: '12px'
      }}>
        {label}
      </div>

      <svg width="160" height="100" viewBox="0 0 160 100" style={{ margin: '0 auto' }}>
        <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="#f0f0f0" strokeWidth="14" strokeLinecap="round"/>
        <path d="M 15 80 A 65 65 0 0 1 48 25" fill="none" stroke={colors.red} strokeWidth="14" strokeLinecap="round"/>
        <path d="M 52 23 A 65 65 0 0 1 108 23" fill="none" stroke={colors.lightGrey} strokeWidth="14" strokeLinecap="round"/>
        <path d="M 112 25 A 65 65 0 0 1 145 80" fill="none" stroke={colors.green} strokeWidth="14" strokeLinecap="round"/>
        <text x="10" y="95" fontSize="9" fill={colors.grey}>-1</text>
        <text x="76" y="12" fontSize="9" fill={colors.grey}>0</text>
        <text x="145" y="95" fontSize="9" fill={colors.grey}>+1</text>
        <line x1="80" y1="80" x2={needleX} y2={needleY} stroke={colors.black} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="80" cy="80" r="6" fill={colors.black}/>
        <circle cx={needleX} cy={needleY} r={isHighlighted ? "8" : "6"} fill={isHighlighted ? colors.green : colors.black}/>
        {isHighlighted && <circle cx={needleX} cy={needleY} r="12" fill="none" stroke={colors.green} strokeWidth="2" opacity="0.4"/>}
      </svg>

      <div style={{ fontSize: '32px', fontWeight: '700', color: parseFloat(value) >= 0 ? colors.green : colors.red, marginTop: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: colors.grey, marginTop: '4px' }}>{subtitle}</div>
    </div>
  );
};

// Tooltip component
const Tooltip = ({ content, children, colors }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {isVisible && content && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: colors.black,
          color: 'white',
          padding: '12px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.5',
          width: '280px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          marginBottom: '8px',
        }}>
          {content}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${colors.black}`,
          }}/>
        </div>
      )}
    </div>
  );
};

export default function SentimentReportSection({ language = 'de' }) {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [expandedSponsor, setExpandedSponsor] = useState(null);

  const t = (key) => translations[language]?.[key] || translations.en?.[key] || key;

  const colors = {
    salmon: '#FFF1E5',
    green: '#006D4E',
    red: '#C00000',
    blue: '#0D7680',
    grey: '#66605C',
    lightGrey: '#E5E2DD',
    black: '#33302E',
  };

  return (
    <div style={{ background: colors.salmon, borderRadius: '16px', padding: '24px', marginTop: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.blue, letterSpacing: '1px', marginBottom: '8px' }}>
          SENTIMENT INTELLIGENCE
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.black, margin: '0 0 8px', lineHeight: '1.2' }}>
          {t('sentimentSubtitle') || 'Beneath the Political Noise, World Cup 2026 Tells a Positive Story'}
        </h2>
        <div style={{ fontSize: '13px', color: colors.grey }}>
          {t('sentimentAnalysisDate')} • 22,889 {t('sentimentArticlesAnalyzed')}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <SentimentGauge
          value="+0.130"
          label={t('sentimentOverall')}
          subtitle={t('sentimentWithAllData')}
          isHighlighted={false}
          colors={colors}
        />
        <SentimentGauge
          value="+0.153"
          label={t('sentimentPureSports')}
          subtitle={<>{t('sentimentExclPolitical')} <strong style={{ color: colors.green }}>(+18%)</strong></>}
          isHighlighted={true}
          colors={colors}
        />

        {/* Coverage Breakdown */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: colors.grey, textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('sentimentCoverage')}
          </div>
          {[
            { label: language === 'de' ? 'Positiv' : language === 'pl' ? 'Pozytywne' : 'Positive', value: '45.5%', color: colors.green },
            { label: language === 'de' ? 'Neutral' : language === 'pl' ? 'Neutralne' : 'Neutral', value: '32.2%', color: colors.lightGrey },
            { label: language === 'de' ? 'Negativ' : language === 'pl' ? 'Negatywne' : 'Negative', value: '22.3%', color: colors.red },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: colors.black }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: '600', color: item.color === colors.lightGrey ? colors.grey : item.color }}>{item.value}</span>
              </div>
              <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: item.value, background: item.color, borderRadius: '5px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insight */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', borderLeft: `4px solid ${colors.blue}` }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: colors.blue, marginBottom: '8px' }}>
          {language === 'de' ? 'Kernerkenntnis' : language === 'pl' ? 'Kluczowy Wniosek' : 'Key Insight'}
        </div>
        <div style={{ fontSize: '14px', color: colors.black, lineHeight: '1.6' }}>
          {language === 'de'
            ? 'Das Headline-Sentiment (+0.130) unterschätzt die wahre Turnierbegeisterung. Wenn politische Kontroversen und Ticketpreis-Beschwerden ausgeschlossen werden, steigt das reine Sport-Sentiment auf +0.153 — eine Verbesserung von 18%.'
            : language === 'pl'
            ? 'Główny sentyment (+0.130) niedoszacowuje prawdziwego entuzjazmu. Po wykluczeniu kontrowersji politycznych, czysty sentyment sportowy rośnie do +0.153 — poprawa o 18%.'
            : 'The headline sentiment (+0.130) understates true tournament enthusiasm. When political controversies and ticket pricing complaints are excluded, pure sports sentiment rises to +0.153 — an 18% improvement.'}
        </div>
      </div>

      {/* Negative Drivers */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>
          {language === 'de' ? 'Was das Sentiment drückt' : language === 'pl' ? 'Co Obniża Sentyment' : 'What Drags Sentiment Down'}
        </h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 16px' }}>
          {language === 'de'
            ? 'Fünf Kategorien machen 8,3% der Berichterstattung aus, drücken aber das Sentiment um 0,023 Punkte'
            : language === 'pl'
            ? 'Pięć kategorii stanowi 8,3% relacji, ale obniża sentyment o 0,023 punkta'
            : 'Five categories account for 8.3% of coverage but drag sentiment down by 0.023 points'}
        </p>

        {NEGATIVE_DRIVERS.map((driver, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i < NEGATIVE_DRIVERS.length - 1 ? '1px solid #f0f0f0' : 'none', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ width: '120px', fontSize: '13px', fontWeight: '600', color: colors.black }}>
              {driver.key === 'trumpVisa' ? (language === 'de' ? 'Trump/Visa-Politik' : language === 'pl' ? 'Polityka Trump/Wizy' : 'Trump/Visa Policy') :
               driver.key === 'venezuelaCrisis' ? (language === 'de' ? 'Venezuela-Krise' : language === 'pl' ? 'Kryzys Wenezueli' : 'Venezuela Crisis') :
               driver.key === 'ticketPrices' ? (language === 'de' ? 'Ticketpreise' : language === 'pl' ? 'Ceny Biletów' : 'Ticket Prices') :
               (language === 'de' ? 'Iran-Kontroverse' : language === 'pl' ? 'Kontrowersja Iranu' : 'Iran Controversy')}
            </div>
            <div style={{ flex: 1, minWidth: '100px', height: '24px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: driver.width, background: `linear-gradient(90deg, ${colors.red}, #ff6666)`, borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: '600' }}>{driver.negPercent} neg</span>
              </div>
            </div>
            <div style={{ width: '70px', textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: colors.red }}>{driver.sentiment}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Sentiment by Group */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>
          {language === 'de' ? 'Team-Sentiment nach Gruppe' : language === 'pl' ? 'Sentyment Drużyn wg Grupy' : 'Team Sentiment by Group'}
        </h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 8px' }}>
          {language === 'de'
            ? '41 von 42 qualifizierten Teams positiv. Nur Iran negativ — aus geopolitischen, nicht sportlichen Gründen.'
            : language === 'pl'
            ? '41 z 42 zakwalifikowanych drużyn pozytywnie. Tylko Iran negatywnie — z powodów geopolitycznych.'
            : '41 of 42 qualified teams positive. Only Iran negative — for geopolitical, not sporting reasons.'}
        </p>
        <p style={{ fontSize: '11px', color: colors.blue, margin: '0 0 16px', fontStyle: 'italic' }}>
          {language === 'de' ? '💡 Klicken für Details' : language === 'pl' ? '💡 Kliknij po szczegóły' : '💡 Click for details'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {Object.entries(TEAMS_BY_GROUP).map(([group, teams]) => (
            <div key={group} style={{ background: '#fafafa', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: colors.blue, marginBottom: '10px', paddingBottom: '6px', borderBottom: `2px solid ${colors.blue}` }}>
                {language === 'de' ? 'GRUPPE' : language === 'pl' ? 'GRUPA' : 'GROUP'} {group} {group === 'J' && '⭐'}
              </div>
              {teams.map((team, i) => (
                <Tooltip key={i} content={t(team.translationKey)} colors={colors}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      background: expandedTeam === team.nameKey
                        ? (team.negative ? '#fce8e8' : '#e8f5f0')
                        : team.highest ? '#e8f5f0' : team.negative ? '#fce8e8' : 'transparent',
                      margin: '2px -8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={() => setExpandedTeam(team.nameKey)}
                    onMouseLeave={() => setExpandedTeam(null)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: colors.black }}>
                      <span style={{ fontSize: '14px' }}>{team.flag}</span>
                      <span style={{ fontWeight: '500', color: colors.black }}>{team.nameKey}</span>
                      {team.host && <span title="Host">🏠</span>}
                      {team.debut && <span title="Debut">🆕</span>}
                      {team.champion && <span title="Champion">🏆</span>}
                    </span>
                    <span style={{ fontWeight: '700', color: team.negative ? colors.red : colors.green, fontSize: '11px' }}>
                      {team.score}
                    </span>
                  </div>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Sponsor Sentiment */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>
          {language === 'de' ? 'Sponsor-Sentiment' : language === 'pl' ? 'Sentyment Sponsorów' : 'Sponsor Sentiment'}
        </h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 8px' }}>
          {language === 'de'
            ? '21 von 22 Sponsoren positiv/neutral. Nur Aramco mit Risiko.'
            : language === 'pl'
            ? '21 z 22 sponsorów pozytywnie/neutralnie. Tylko Aramco z ryzykiem.'
            : '21 of 22 sponsors positive/neutral. Only Aramco at risk.'}
        </p>
        <p style={{ fontSize: '11px', color: colors.blue, margin: '0 0 16px', fontStyle: 'italic' }}>
          {language === 'de' ? '💡 Klicken für Details' : language === 'pl' ? '💡 Kliknij po szczegóły' : '💡 Click for details'}
        </p>

        {SPONSORS.map((sponsor, i) => (
          <Tooltip key={i} content={t(sponsor.translationKey)} colors={colors}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 8px',
                margin: '0 -8px',
                borderBottom: i < SPONSORS.length - 1 ? '1px solid #f0f0f0' : 'none',
                borderRadius: '6px',
                background: expandedSponsor === sponsor.name ? '#f5f5f5' : 'transparent',
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setExpandedSponsor(sponsor.name)}
              onMouseLeave={() => setExpandedSponsor(null)}
            >
              <div style={{ width: '110px', fontSize: '14px', fontWeight: '600', color: sponsor.positive ? colors.black : colors.red }}>
                {sponsor.name} {!sponsor.positive && '⚠️'}
              </div>
              <div style={{ flex: 1, height: '22px', background: '#f0f0f0', borderRadius: '11px', overflow: 'hidden', margin: '0 12px' }}>
                <div style={{
                  height: '100%',
                  width: sponsor.width,
                  background: sponsor.positive ? `linear-gradient(90deg, ${colors.green}, #00a878)` : `linear-gradient(90deg, ${colors.red}, #ff6666)`,
                  borderRadius: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '10px'
                }}>
                  <span style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>{sponsor.score}</span>
                </div>
              </div>
              <div style={{ width: '55px', textAlign: 'right', fontSize: '11px', color: sponsor.positive ? colors.green : colors.red }}>
                {sponsor.negPercent} neg
              </div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Key Takeaways */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 16px' }}>
          {language === 'de' ? 'Kernaussagen' : language === 'pl' ? 'Kluczowe Wnioski' : 'Key Takeaways'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            {
              title: language === 'de' ? 'Die sportliche Story ist positiv' : language === 'pl' ? 'Historia sportowa jest pozytywna' : 'The sporting story is positive',
              text: language === 'de' ? '41 von 42 qualifizierten Nationen positiv. Fünf WM-Debütanten werden gefeiert.' : language === 'pl' ? '41 z 42 zakwalifikowanych narodów pozytywnie. Pięciu debiutantów świętowanych.' : '41 of 42 qualified nations positive. Five World Cup debutants celebrated.',
              color: colors.green, icon: '✓'
            },
            {
              title: language === 'de' ? 'Politisches Overlay ist separat' : language === 'pl' ? 'Nakładka polityczna jest oddzielna' : 'Political overlay is separate',
              text: language === 'de' ? 'Trump/Visa stieg um 455%. Diese beeinflussen Werte, aber spiegeln keine Ablehnung der WM wider.' : language === 'pl' ? 'Trump/wizy wzrosły o 455%. Wpływają na wyniki, ale nie odzwierciedlają odrzucenia Mundialu.' : 'Trump/visa surged 455%. These affect scores but don\'t reflect rejection of the World Cup.',
              color: '#b8860b', icon: '⚡'
            },
            {
              title: language === 'de' ? 'Verbraucherbedenken = Nachfrage' : language === 'pl' ? 'Obawy konsumentów = popyt' : 'Consumer concerns = demand',
              text: language === 'de' ? 'Ticket-Beschwerden zeigen, dass Fans teilnehmen wollen, sich aber ausgepreist fühlen.' : language === 'pl' ? 'Skargi na bilety pokazują, że fani chcą uczestniczyć, ale czują się wykluczeni cenowo.' : 'Ticket complaints show fans want to attend but feel priced out.',
              color: colors.green, icon: '📊'
            },
            {
              title: language === 'de' ? 'Sponsoren erfolgreich' : language === 'pl' ? 'Sponsorzy odnoszą sukces' : 'Sponsors succeeding',
              text: language === 'de' ? '21 von 22 Sponsoren positiv/neutral. Kostenloser Zugang, Prominente und Produkt-Tie-ins funktionieren.' : language === 'pl' ? '21 z 22 sponsorów pozytywnie/neutralnie. Darmowy dostęp i celebryci działają.' : '21 of 22 sponsors positive/neutral. Free access, celebrities, and product tie-ins work.',
              color: colors.green, icon: '💼'
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: item.color === colors.green ? '#e8f5f0' : '#fff8e0',
              borderRadius: '8px',
              padding: '14px'
            }}>
              <div style={{ fontWeight: '700', color: item.color, marginBottom: '6px', fontSize: '13px' }}>
                {item.icon} {item.title}
              </div>
              <div style={{ fontSize: '12px', color: colors.black, lineHeight: '1.5' }}>
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: colors.grey }}>
        wm26.live • {language === 'de' ? 'Nächster Report' : language === 'pl' ? 'Następny raport' : 'Next Report'}: January 17, 2026 (KW3)
      </div>
    </div>
  );
}
