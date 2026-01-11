import React from 'react';
import { useLanguage } from './LanguageContext';

// Translations for Sentiment Report Section
const REPORT_TRANSLATIONS = {
  de: {
    title: 'Sentiment-Analyse KW2',
    subtitle: 'Beneath the Political Noise, World Cup 2026 Tells a Positive Story',
    analysisDate: 'Analysezeitraum: 8. Dez 2025 – 9. Jan 2026',
    articlesAnalyzed: 'Artikel analysiert',
    overallSentiment: 'Gesamt-Sentiment',
    pureSportsSentiment: 'Reines Sport-Sentiment',
    withAllData: 'Mit allen Daten',
    exclPoliticalNoise: 'Exkl. politisches Rauschen',
    improvement: 'Verbesserung',
    coverageBreakdown: 'Berichterstattung',
    positive: 'Positiv',
    neutral: 'Neutral',
    negative: 'Negativ',
    keyInsight: 'Kernerkenntnis',
    insightText: 'Das Headline-Sentiment (+0.130) unterschätzt die wahre Turnierbegeisterung. Wenn politische Kontroversen und Ticketpreis-Beschwerden ausgeschlossen werden, steigt das reine Sport-Sentiment auf +0.153 — eine Verbesserung von 18%.',
    negativeDrivers: 'Was das Sentiment drückt',
    driversSubtitle: 'Fünf Kategorien machen 8,3% der Berichterstattung aus, drücken aber das Sentiment um 0,023 Punkte',
    trumpVisa: 'Trump/Visa-Politik',
    venezuelaCrisis: 'Venezuela-Krise',
    ticketPrices: 'Ticketpreise',
    iranControversy: 'Iran-Kontroverse',
    teamSentiment: 'Team-Sentiment nach Gruppe',
    teamsPositive: '41 von 42 qualifizierten Teams positiv. Nur Iran negativ — aus geopolitischen, nicht sportlichen Gründen.',
    sponsorSentiment: 'Sponsor-Sentiment',
    sponsorsPositive: '21 von 22 Sponsoren positiv/neutral. Nur Aramco mit Risiko.',
    keyTakeaways: 'Kernaussagen',
    sportingPositive: 'Die sportliche Story ist positiv',
    sportingPositiveText: '41 von 42 qualifizierten Nationen positiv. Fünf WM-Debütanten werden gefeiert.',
    politicalSeparate: 'Politisches Overlay ist separat',
    politicalSeparateText: 'Trump/Visa stieg um 455%. Diese beeinflussen Werte, aber spiegeln keine Ablehnung der WM wider.',
    consumerDemand: 'Verbraucherbedenken = Nachfrage',
    consumerDemandText: 'Ticket-Beschwerden zeigen, dass Fans teilnehmen wollen, sich aber ausgepreist fühlen.',
    sponsorsSucceeding: 'Sponsoren erfolgreich',
    sponsorsSucceedingText: '21 von 22 Sponsoren positiv/neutral. Kostenloser Zugang, Prominente und Produkt-Tie-ins funktionieren.',
  },
  en: {
    title: 'Sentiment Analysis CW2',
    subtitle: 'Beneath the Political Noise, World Cup 2026 Tells a Positive Story',
    analysisDate: 'Analysis Period: Dec 8, 2025 – Jan 9, 2026',
    articlesAnalyzed: 'articles analyzed',
    overallSentiment: 'Overall Sentiment',
    pureSportsSentiment: 'Pure Sports Sentiment',
    withAllData: 'With all data',
    exclPoliticalNoise: 'Excl. political noise',
    improvement: 'improvement',
    coverageBreakdown: 'Coverage Breakdown',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    keyInsight: 'Key Insight',
    insightText: 'The headline sentiment (+0.130) understates true tournament enthusiasm. When political controversies and ticket pricing complaints are excluded, pure sports sentiment rises to +0.153 — an 18% improvement.',
    negativeDrivers: 'What Drags Sentiment Down',
    driversSubtitle: 'Five categories account for 8.3% of coverage but drag sentiment down by 0.023 points',
    trumpVisa: 'Trump/Visa Policy',
    venezuelaCrisis: 'Venezuela Crisis',
    ticketPrices: 'Ticket Prices',
    iranControversy: 'Iran Controversy',
    teamSentiment: 'Team Sentiment by Group',
    teamsPositive: '41 of 42 qualified teams positive. Only Iran negative — for geopolitical, not sporting reasons.',
    sponsorSentiment: 'Sponsor Sentiment',
    sponsorsPositive: '21 of 22 sponsors positive/neutral. Only Aramco at risk.',
    keyTakeaways: 'Key Takeaways',
    sportingPositive: 'The sporting story is positive',
    sportingPositiveText: '41 of 42 qualified nations positive. Five World Cup debutants celebrated.',
    politicalSeparate: 'Political overlay is separate',
    politicalSeparateText: 'Trump/visa surged 455%. These affect scores but don\'t reflect rejection of the World Cup.',
    consumerDemand: 'Consumer concerns = demand',
    consumerDemandText: 'Ticket complaints show fans want to attend but feel priced out.',
    sponsorsSucceeding: 'Sponsors succeeding',
    sponsorsSucceedingText: '21 of 22 sponsors positive/neutral. Free access, celebrities, and product tie-ins work.',
  },
  pl: {
    title: 'Analiza Sentymentu TYG2',
    subtitle: 'Pod politycznym szumem, Mundial 2026 opowiada pozytywną historię',
    analysisDate: 'Okres analizy: 8 gru 2025 – 9 sty 2026',
    articlesAnalyzed: 'przeanalizowanych artykułów',
    overallSentiment: 'Ogólny Sentyment',
    pureSportsSentiment: 'Czysty Sentyment Sportowy',
    withAllData: 'Ze wszystkimi danymi',
    exclPoliticalNoise: 'Bez szumu politycznego',
    improvement: 'poprawa',
    coverageBreakdown: 'Podział Relacji',
    positive: 'Pozytywne',
    neutral: 'Neutralne',
    negative: 'Negatywne',
    keyInsight: 'Kluczowy Wniosek',
    insightText: 'Główny sentyment (+0.130) niedoszacowuje prawdziwego entuzjazmu. Po wykluczeniu kontrowersji politycznych, czysty sentyment sportowy rośnie do +0.153 — poprawa o 18%.',
    negativeDrivers: 'Co Obniża Sentyment',
    driversSubtitle: 'Pięć kategorii stanowi 8,3% relacji, ale obniża sentyment o 0,023 punkta',
    trumpVisa: 'Polityka Trump/Wizy',
    venezuelaCrisis: 'Kryzys Wenezueli',
    ticketPrices: 'Ceny Biletów',
    iranControversy: 'Kontrowersja Iranu',
    teamSentiment: 'Sentyment Drużyn wg Grupy',
    teamsPositive: '41 z 42 zakwalifikowanych drużyn pozytywnie. Tylko Iran negatywnie — z powodów geopolitycznych.',
    sponsorSentiment: 'Sentyment Sponsorów',
    sponsorsPositive: '21 z 22 sponsorów pozytywnie/neutralnie. Tylko Aramco z ryzykiem.',
    keyTakeaways: 'Kluczowe Wnioski',
    sportingPositive: 'Historia sportowa jest pozytywna',
    sportingPositiveText: '41 z 42 zakwalifikowanych narodów pozytywnie. Pięciu debiutantów świętowanych.',
    politicalSeparate: 'Nakładka polityczna jest oddzielna',
    politicalSeparateText: 'Trump/wizy wzrosły o 455%. Wpływają na wyniki, ale nie odzwierciedlają odrzucenia Mundialu.',
    consumerDemand: 'Obawy konsumentów = popyt',
    consumerDemandText: 'Skargi na bilety pokazują, że fani chcą uczestniczyć, ale czują się wykluczeni cenowo.',
    sponsorsSucceeding: 'Sponsorzy odnoszą sukces',
    sponsorsSucceedingText: '21 z 22 sponsorów pozytywnie/neutralnie. Darmowy dostęp i celebryci działają.',
  },
};

// Team data by group
const TEAMS_BY_GROUP = {
  A: [
    { flag: '🇿🇦', name: 'South Africa', score: '+0.108' },
    { flag: '🇲🇽', name: 'Mexico', score: '+0.103', host: true },
    { flag: '🇰🇷', name: 'South Korea', score: '+0.079' },
  ],
  B: [
    { flag: '🇨🇦', name: 'Canada', score: '+0.105', host: true },
    { flag: '🇨🇭', name: 'Switzerland', score: '+0.091' },
    { flag: '🇶🇦', name: 'Qatar', score: '+0.031' },
  ],
  C: [
    { flag: '🇧🇷', name: 'Brazil', score: '+0.075' },
    { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Scotland', score: '+0.072' },
    { flag: '🇲🇦', name: 'Morocco', score: '+0.068' },
    { flag: '🇭🇹', name: 'Haiti', score: '+0.043', debut: true },
  ],
  D: [
    { flag: '🇺🇸', name: 'USA', score: '+0.093', host: true },
    { flag: '🇵🇾', name: 'Paraguay', score: '+0.084' },
    { flag: '🇦🇺', name: 'Australia', score: '+0.018' },
  ],
  E: [
    { flag: '🇪🇨', name: 'Ecuador', score: '+0.110' },
    { flag: '🇨🇮', name: 'Ivory Coast', score: '+0.083' },
    { flag: '🇨🇼', name: 'Curaçao', score: '+0.064', debut: true },
    { flag: '🇩🇪', name: 'Germany', score: '+0.053' },
  ],
  F: [
    { flag: '🇳🇱', name: 'Netherlands', score: '+0.113' },
    { flag: '🇹🇳', name: 'Tunisia', score: '+0.074' },
    { flag: '🇯🇵', name: 'Japan', score: '+0.069' },
  ],
  G: [
    { flag: '🇳🇿', name: 'New Zealand', score: '+0.147', highest: true },
    { flag: '🇧🇪', name: 'Belgium', score: '+0.076' },
    { flag: '🇪🇬', name: 'Egypt', score: '+0.033' },
    { flag: '🇮🇷', name: 'Iran', score: '-0.034', negative: true },
  ],
  H: [
    { flag: '🇺🇾', name: 'Uruguay', score: '+0.133' },
    { flag: '🇨🇻', name: 'Cape Verde', score: '+0.121', debut: true },
    { flag: '🇪🇸', name: 'Spain', score: '+0.075' },
    { flag: '🇸🇦', name: 'Saudi Arabia', score: '+0.003' },
  ],
  I: [
    { flag: '🇸🇳', name: 'Senegal', score: '+0.077' },
    { flag: '🇫🇷', name: 'France', score: '+0.075' },
    { flag: '🇳🇴', name: 'Norway', score: '+0.054' },
  ],
  J: [
    { flag: '🇦🇷', name: 'Argentina', score: '+0.133', champion: true },
    { flag: '🇦🇹', name: 'Austria', score: '+0.107' },
    { flag: '🇯🇴', name: 'Jordan', score: '+0.097', debut: true },
    { flag: '🇩🇿', name: 'Algeria', score: '+0.047' },
  ],
  K: [
    { flag: '🇺🇿', name: 'Uzbekistan', score: '+0.144', debut: true, highest: true },
    { flag: '🇵🇹', name: 'Portugal', score: '+0.115' },
    { flag: '🇨🇴', name: 'Colombia', score: '+0.070' },
  ],
  L: [
    { flag: '🇬🇭', name: 'Ghana', score: '+0.102' },
    { flag: '🇭🇷', name: 'Croatia', score: '+0.056' },
    { flag: '🇵🇦', name: 'Panama', score: '+0.047' },
    { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England', score: '+0.044' },
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
  { name: 'Diageo', score: '+0.379', negPercent: '0%', width: '85%', positive: true },
  { name: 'Lenovo', score: '+0.332', negPercent: '6%', width: '78%', positive: true },
  { name: 'Qatar Airways', score: '+0.319', negPercent: '0%', width: '76%', positive: true },
  { name: 'Verizon', score: '+0.265', negPercent: '0%', width: '70%', positive: true },
  { name: 'Aramco', score: '-0.073', negPercent: '33%', width: '30%', positive: false },
];

export default function SentimentReportSection({ language = 'de' }) {
  const t = (key) => REPORT_TRANSLATIONS[language]?.[key] || REPORT_TRANSLATIONS.en[key] || key;
  
  // Color constants
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
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: colors.black, margin: '0 0 8px', lineHeight: '1.2' }}>
          {t('subtitle')}
        </h2>
        <div style={{ fontSize: '13px', color: colors.grey }}>
          {t('analysisDate')} • 22,889 {t('articlesAnalyzed')}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Overall Sentiment */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: colors.grey, textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('overallSentiment')}
          </div>
          <svg width="160" height="90" viewBox="0 0 160 90" style={{ margin: '0 auto 12px' }}>
            <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="#f0f0f0" strokeWidth="16" strokeLinecap="round"/>
            <path d="M 15 80 A 65 65 0 0 1 50 28" fill="none" stroke={colors.red} strokeWidth="16" strokeLinecap="round"/>
            <path d="M 50 28 A 65 65 0 0 1 110 28" fill="none" stroke={colors.lightGrey} strokeWidth="16" strokeLinecap="round"/>
            <path d="M 110 28 A 65 65 0 0 1 145 80" fill="none" stroke={colors.green} strokeWidth="16" strokeLinecap="round"/>
            <circle cx="112" cy="32" r="8" fill={colors.black}/>
          </svg>
          <div style={{ fontSize: '36px', fontWeight: '700', color: colors.green }}>+0.130</div>
          <div style={{ fontSize: '12px', color: colors.grey }}>{t('withAllData')}</div>
        </div>

        {/* Pure Sports Sentiment */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', border: `2px solid ${colors.green}` }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: colors.green, textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('pureSportsSentiment')}
          </div>
          <svg width="160" height="90" viewBox="0 0 160 90" style={{ margin: '0 auto 12px' }}>
            <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="#f0f0f0" strokeWidth="16" strokeLinecap="round"/>
            <path d="M 15 80 A 65 65 0 0 1 50 28" fill="none" stroke={colors.red} strokeWidth="16" strokeLinecap="round"/>
            <path d="M 50 28 A 65 65 0 0 1 110 28" fill="none" stroke={colors.lightGrey} strokeWidth="16" strokeLinecap="round"/>
            <path d="M 110 28 A 65 65 0 0 1 145 80" fill="none" stroke={colors.green} strokeWidth="16" strokeLinecap="round"/>
            <circle cx="116" cy="30" r="10" fill={colors.green}/>
            <circle cx="116" cy="30" r="14" fill="none" stroke={colors.green} strokeWidth="2" opacity="0.4"/>
          </svg>
          <div style={{ fontSize: '36px', fontWeight: '700', color: colors.green }}>+0.153</div>
          <div style={{ fontSize: '12px', color: colors.grey }}>{t('exclPoliticalNoise')} <strong style={{ color: colors.green }}>(+18%)</strong></div>
        </div>

        {/* Coverage Breakdown */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: colors.grey, textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('coverageBreakdown')}
          </div>
          {[
            { label: t('positive'), value: '45.5%', color: colors.green },
            { label: t('neutral'), value: '32.2%', color: colors.lightGrey },
            { label: t('negative'), value: '22.3%', color: colors.red },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: '600', color: item.color }}>{item.value}</span>
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
        <div style={{ fontSize: '12px', fontWeight: '700', color: colors.blue, marginBottom: '8px' }}>{t('keyInsight')}</div>
        <div style={{ fontSize: '15px', color: colors.black, lineHeight: '1.6' }}>{t('insightText')}</div>
      </div>

      {/* Negative Drivers */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>{t('negativeDrivers')}</h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 16px' }}>{t('driversSubtitle')}</p>
        
        {NEGATIVE_DRIVERS.map((driver, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i < NEGATIVE_DRIVERS.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            <div style={{ width: '140px', fontSize: '14px', fontWeight: '600' }}>{t(driver.key)}</div>
            <div style={{ flex: 1, height: '24px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden', margin: '0 16px' }}>
              <div style={{ height: '100%', width: driver.width, background: `linear-gradient(90deg, ${colors.red}, #ff6666)`, borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                <span style={{ color: 'white', fontSize: '11px', fontWeight: '600' }}>{driver.negPercent} neg</span>
              </div>
            </div>
            <div style={{ width: '80px', textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: colors.red }}>{driver.sentiment}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Sentiment by Group */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>{t('teamSentiment')}</h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 16px' }}>{t('teamsPositive')}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {Object.entries(TEAMS_BY_GROUP).map(([group, teams]) => (
            <div key={group} style={{ background: '#fafafa', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: colors.blue, marginBottom: '10px', paddingBottom: '6px', borderBottom: `2px solid ${colors.blue}` }}>
                GROUP {group} {group === 'J' && '⭐'}
              </div>
              {teams.map((team, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '5px 0', 
                    fontSize: '12px',
                    background: team.highest ? '#e8f5f0' : team.negative ? '#fce8e8' : 'transparent',
                    margin: '0 -8px',
                    padding: '5px 8px',
                    borderRadius: '4px',
                  }}
                >
                  <span>
                    {team.flag} {team.name}
                    {team.host && ' 🏠'}
                    {team.debut && ' 🆕'}
                    {team.champion && ' 🏆'}
                  </span>
                  <span style={{ fontWeight: '700', color: team.negative ? colors.red : colors.green }}>
                    {team.score}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Sponsor Sentiment */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>{t('sponsorSentiment')}</h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 16px' }}>{t('sponsorsPositive')}</p>
        
        {SPONSORS.map((sponsor, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < SPONSORS.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            <div style={{ width: '120px', fontSize: '14px', fontWeight: '600', color: sponsor.positive ? colors.black : colors.red }}>
              {sponsor.name} {!sponsor.positive && '⚠️'}
            </div>
            <div style={{ flex: 1, height: '20px', background: '#f5f5f5', borderRadius: '10px', overflow: 'hidden', margin: '0 16px' }}>
              <div style={{ 
                height: '100%', 
                width: sponsor.width, 
                background: sponsor.positive ? `linear-gradient(90deg, ${colors.green}, #00a878)` : `linear-gradient(90deg, ${colors.red}, #ff6666)`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '8px'
              }}>
                <span style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>{sponsor.score}</span>
              </div>
            </div>
            <div style={{ width: '60px', textAlign: 'right', fontSize: '12px', color: sponsor.positive ? colors.green : colors.red }}>
              {sponsor.negPercent} neg
            </div>
          </div>
        ))}
      </div>

      {/* Key Takeaways */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 16px' }}>{t('keyTakeaways')}</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { key: 'sportingPositive', textKey: 'sportingPositiveText', color: colors.green, icon: '✓' },
            { key: 'politicalSeparate', textKey: 'politicalSeparateText', color: '#b8860b', icon: '⚡' },
            { key: 'consumerDemand', textKey: 'consumerDemandText', color: colors.green, icon: '📊' },
            { key: 'sponsorsSucceeding', textKey: 'sponsorsSucceedingText', color: colors.green, icon: '💼' },
          ].map((item, i) => (
            <div key={i} style={{ 
              background: item.color === colors.green ? '#e8f5f0' : '#fff8e0', 
              borderRadius: '8px', 
              padding: '16px' 
            }}>
              <div style={{ fontWeight: '700', color: item.color, marginBottom: '6px', fontSize: '14px' }}>
                {item.icon} {t(item.key)}
              </div>
              <div style={{ fontSize: '13px', color: colors.black, lineHeight: '1.5' }}>
                {t(item.textKey)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: colors.grey }}>
        wm26.live • Next Report: January 17, 2026 (KW3)
      </div>
    </div>
  );
}
