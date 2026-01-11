import React, { useState } from 'react';

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
    clickForDetails: 'Klicken für Details',
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
    clickForDetails: 'Click for details',
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
    clickForDetails: 'Kliknij po szczegóły',
  },
};

// Detailed team analysis data from the sentiment report
const TEAM_ANALYSIS = {
  'South Africa': 'Strong qualifier with 25-match unbeaten run. Coverage celebrates return to World Cup after 2010 hosting. Fan optimism high.',
  'Mexico': 'Host nation pride dominates. Stadium preparations, ticket allocation, and infrastructure readiness drive positive coverage.',
  'South Korea': 'Solid team perception with minimal controversy. Social media slightly critical of recent form compared to Japan.',
  'Canada': 'Host pride evident. Infrastructure investment praised. Alphonso Davies star power. Social media more positive than news.',
  'Switzerland': 'Reliable, low-drama team. Consistent qualifier. Minimal negative coverage in news. Model of stability.',
  'Qatar': 'World Cup 2022 hosting legacy creates mixed reception. Human rights debate continues. Lowest sentiment among qualified nations excluding Iran.',
  'Brazil': 'Tradition drives baseline positivity. Neymar return speculation. Young stars (Endrick, Vini Jr.) generate excitement.',
  'Scotland': 'First World Cup since 1998. Tartan Army enthusiasm infectious. Brazil opener generates massive coverage.',
  'Morocco': 'World Cup 2022 semi-final heroes still celebrated. "Lions of Atlas" narrative carries forward. African pride ambassador.',
  'Haiti': 'Historic debut celebrated in news. Social media more negative, reflecting visa fears and concerns about competing against Brazil.',
  'USA': 'News positive, social media more critical. Infrastructure praised; political noise treated separately in analysis.',
  'Paraguay': 'Solid CONMEBOL qualifier. News very positive, social media reflects ticket cost concerns for travelling fans.',
  'Australia': 'Distance concerns dominate (longest travel). Social media pessimistic about chances. "Socceroos vs USA" matchup generates interest.',
  'Ecuador': 'Rising South American power. Young talent (Moisés Caicedo) generates buzz. Positive trajectory narrative.',
  'Ivory Coast': 'Reigning AFCON champions. "Golden generation" praise. Strong form entering tournament. African momentum.',
  'Curaçao': 'Historic World Cup debut as smallest nation ever to qualify. News celebrates achievement; social media questions competitiveness.',
  'Germany': 'Cautious optimism after World Cup 2022 disappointment. Musiala/Wirtz excitement. Nagelsmann rebuild narrative dominates.',
  'Netherlands': 'Total Football legacy invoked. Tactical praise from analysts. Oranje fan culture celebrated. Minimal negative coverage.',
  'Tunisia': 'Lowest negativity rate in tournament. World Cup 2022 performance remembered fondly. North African pride.',
  'Japan': 'World Cup 2022 giant-killer reputation (beat Germany, Spain). European-based squad strength. Surprise contender narrative.',
  'New Zealand': 'HIGHEST SENTIMENT. Underdog romance. "All Whites" enthusiasm. Oceania representation celebrated.',
  'Belgium': 'Golden generation\'s "last chance" narrative. De Bruyne, Lukaku focus. Consistent positive coverage.',
  'Egypt': 'Salah star power. Pride Match controversy (with Iran) affects sentiment. Football coverage positive.',
  'Iran': 'ONLY NEGATIVE TEAM. Pride Match opposition, visa boycott threats, US tensions. Geopolitical factors, not sporting performance.',
  'Uruguay': 'La Celeste legacy pride. Godín/Forlán legends match. Social media very positive. Traditional powerhouse.',
  'Cape Verde': 'Historic debut. Zero percent negative in news. Small island nation narrative resonates. Universal celebration.',
  'Spain': 'Euro 2024 champions. Young squad praised (Pedri, Gavi, Lamine Yamal). Title favourite status. High expectations.',
  'Saudi Arabia': 'World Cup 2034 host announcement polarises. Social media very negative on human rights. WC 2022 Argentina upset remembered.',
  'Senegal': 'AFCON pedigree. Mané star power. Building on World Cup 2022 Round of 16. Lions of Teranga brand strong.',
  'France': '2018 champions, 2022 finalists. Mbappé dominant narrative. High volume reflects expectations. Some "tough draw" concern.',
  'Norway': 'First World Cup since 1998. Haaland factor drives coverage. Social media polarised on team depth versus France.',
  'Argentina': 'Defending champions. "Messi\'s last World Cup" narrative dominates. Fan engagement highest globally. Easy group draw celebrated.',
  'Austria': 'First World Cup since 1998. Rangnick effect. Social media explodes with fan content. Potential surprise contender.',
  'Jordan': 'Historic first qualification. Universal respect. Middle East breakthrough celebrated. No negative news coverage.',
  'Algeria': 'AFCON team returns to World Cup. 1982 Gijón controversy remembered. Post-Mahrez rebuild narrative.',
  'Uzbekistan': 'HIGHEST POSITIVE RATE (52%). Historic debut euphoria. Surprise qualifier celebrated. Asian breakthrough.',
  'Portugal': '"Ronaldo\'s last World Cup?" drives volume. Strong generation beyond CR7. Fan content dominates social media.',
  'Colombia': 'James Rodriguez narrative. Copa América form. Talented squad but inconsistency concerns in social media.',
  'Ghana': 'Very low negative news coverage. Young talents praised. African underdog appeal. Low-profile, high-potential.',
  'Croatia': '2018 finalists, 2022 third. Modrić legacy narrative. Golden generation respect. Consistent performer.',
  'Panama': 'News positive, social media negative. Trump canal comments create political noise unrelated to team performance.',
  'England': 'High expectations, high pressure. Tuchel optimism. "Coming Home" narrative. English media harshest critics of own team.',
};

// Detailed sponsor analysis data
const SPONSOR_ANALYSIS = {
  'Diageo': 'HIGHEST SENTIMENT — First-ever FIFA spirits sponsor. Premium positioning. Zero negative coverage.',
  'Lenovo': 'FIFA Edition Yoga Tab. CES Vegas Sphere dominance. Product tie-ins work effectively.',
  'Qatar Airways': 'Flight deals (20% off). Kevin Hart safety video viral success. Zero negative coverage.',
  'Verizon': 'Free World Cup tickets via sweepstakes. Beckham "Ultimate Access" campaign. Zero negative coverage.',
  'Hyundai-Kia': 'Highest coverage volume. "Next Legend" campaign most covered. 12% negative.',
  'Aramco': 'ONLY NEGATIVE — Amnesty criticism. "Sportswashing" accusations. UN warnings. Reputational risk.',
  'Adidas': 'Colombia kit design controversy. Otherwise positive World Cup association.',
  'Coca-Cola': 'Classic World Cup partner. Strong brand association. Minimal controversy.',
  'Visa': 'Payment partner. Some association with visa policy confusion (unrelated).',
  'McDonalds': 'Fan engagement campaigns. Stadium presence. Positive association.',
};

// Team data by group with analysis keys
const TEAMS_BY_GROUP = {
  A: [
    { flag: '🇿🇦', name: 'South Africa', nameShort: 'RSA', score: '+0.108' },
    { flag: '🇲🇽', name: 'Mexico', nameShort: 'MEX', score: '+0.103', host: true },
    { flag: '🇰🇷', name: 'South Korea', nameShort: 'KOR', score: '+0.079' },
  ],
  B: [
    { flag: '🇨🇦', name: 'Canada', nameShort: 'CAN', score: '+0.105', host: true },
    { flag: '🇨🇭', name: 'Switzerland', nameShort: 'SUI', score: '+0.091' },
    { flag: '🇶🇦', name: 'Qatar', nameShort: 'QAT', score: '+0.031' },
  ],
  C: [
    { flag: '🇧🇷', name: 'Brazil', nameShort: 'BRA', score: '+0.075' },
    { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Scotland', nameShort: 'SCO', score: '+0.072' },
    { flag: '🇲🇦', name: 'Morocco', nameShort: 'MAR', score: '+0.068' },
    { flag: '🇭🇹', name: 'Haiti', nameShort: 'HAI', score: '+0.043', debut: true },
  ],
  D: [
    { flag: '🇺🇸', name: 'USA', nameShort: 'USA', score: '+0.093', host: true },
    { flag: '🇵🇾', name: 'Paraguay', nameShort: 'PAR', score: '+0.084' },
    { flag: '🇦🇺', name: 'Australia', nameShort: 'AUS', score: '+0.018' },
  ],
  E: [
    { flag: '🇪🇨', name: 'Ecuador', nameShort: 'ECU', score: '+0.110' },
    { flag: '🇨🇮', name: 'Ivory Coast', nameShort: 'CIV', score: '+0.083' },
    { flag: '🇨🇼', name: 'Curaçao', nameShort: 'CUW', score: '+0.064', debut: true },
    { flag: '🇩🇪', name: 'Germany', nameShort: 'GER', score: '+0.053' },
  ],
  F: [
    { flag: '🇳🇱', name: 'Netherlands', nameShort: 'NED', score: '+0.113' },
    { flag: '🇹🇳', name: 'Tunisia', nameShort: 'TUN', score: '+0.074' },
    { flag: '🇯🇵', name: 'Japan', nameShort: 'JPN', score: '+0.069' },
  ],
  G: [
    { flag: '🇳🇿', name: 'New Zealand', nameShort: 'NZL', score: '+0.147', highest: true },
    { flag: '🇧🇪', name: 'Belgium', nameShort: 'BEL', score: '+0.076' },
    { flag: '🇪🇬', name: 'Egypt', nameShort: 'EGY', score: '+0.033' },
    { flag: '🇮🇷', name: 'Iran', nameShort: 'IRN', score: '-0.034', negative: true },
  ],
  H: [
    { flag: '🇺🇾', name: 'Uruguay', nameShort: 'URU', score: '+0.133' },
    { flag: '🇨🇻', name: 'Cape Verde', nameShort: 'CPV', score: '+0.121', debut: true },
    { flag: '🇪🇸', name: 'Spain', nameShort: 'ESP', score: '+0.075' },
    { flag: '🇸🇦', name: 'Saudi Arabia', nameShort: 'KSA', score: '+0.003' },
  ],
  I: [
    { flag: '🇸🇳', name: 'Senegal', nameShort: 'SEN', score: '+0.077' },
    { flag: '🇫🇷', name: 'France', nameShort: 'FRA', score: '+0.075' },
    { flag: '🇳🇴', name: 'Norway', nameShort: 'NOR', score: '+0.054' },
  ],
  J: [
    { flag: '🇦🇷', name: 'Argentina', nameShort: 'ARG', score: '+0.133', champion: true },
    { flag: '🇦🇹', name: 'Austria', nameShort: 'AUT', score: '+0.107' },
    { flag: '🇯🇴', name: 'Jordan', nameShort: 'JOR', score: '+0.097', debut: true },
    { flag: '🇩🇿', name: 'Algeria', nameShort: 'ALG', score: '+0.047' },
  ],
  K: [
    { flag: '🇺🇿', name: 'Uzbekistan', nameShort: 'UZB', score: '+0.144', debut: true, highest: true },
    { flag: '🇵🇹', name: 'Portugal', nameShort: 'POR', score: '+0.115' },
    { flag: '🇨🇴', name: 'Colombia', nameShort: 'COL', score: '+0.070' },
  ],
  L: [
    { flag: '🇬🇭', name: 'Ghana', nameShort: 'GHA', score: '+0.102' },
    { flag: '🇭🇷', name: 'Croatia', nameShort: 'CRO', score: '+0.056' },
    { flag: '🇵🇦', name: 'Panama', nameShort: 'PAN', score: '+0.047' },
    { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England', nameShort: 'ENG', score: '+0.044' },
  ],
};

// Negative drivers data
const NEGATIVE_DRIVERS = [
  { key: 'trumpVisa', sentiment: '-0.171', negPercent: '66.5%', width: '66.5%' },
  { key: 'venezuelaCrisis', sentiment: '-0.106', negPercent: '65.3%', width: '65.3%' },
  { key: 'ticketPrices', sentiment: '-0.159', negPercent: '61.7%', width: '61.7%' },
  { key: 'iranControversy', sentiment: '-0.034', negPercent: '35.9%', width: '35.9%' },
];

// Sponsor data with analysis
const SPONSORS = [
  { name: 'Diageo', score: '+0.379', negPercent: '0%', width: '85%', positive: true },
  { name: 'Lenovo', score: '+0.332', negPercent: '6%', width: '78%', positive: true },
  { name: 'Qatar Airways', score: '+0.319', negPercent: '0%', width: '76%', positive: true },
  { name: 'Verizon', score: '+0.265', negPercent: '0%', width: '70%', positive: true },
  { name: 'Aramco', score: '-0.073', negPercent: '33%', width: '30%', positive: false },
];

// Improved Sentiment Gauge Component
const SentimentGauge = ({ value, label, subtitle, isHighlighted, colors }) => {
  // Convert sentiment value (-1 to +1) to angle (180 to 0 degrees)
  // -1 = 180° (left), 0 = 90° (center), +1 = 0° (right)
  const normalizedValue = (parseFloat(value) + 1) / 2; // 0 to 1
  const angle = 180 - (normalizedValue * 180); // 180 to 0
  const radians = (angle * Math.PI) / 180;

  // Calculate needle endpoint (center at 80,80, radius 55)
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
        {/* Background arc */}
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="#f0f0f0"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Negative segment (left) */}
        <path
          d="M 15 80 A 65 65 0 0 1 48 25"
          fill="none"
          stroke={colors.red}
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Neutral segment (middle) */}
        <path
          d="M 52 23 A 65 65 0 0 1 108 23"
          fill="none"
          stroke={colors.lightGrey}
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Positive segment (right) */}
        <path
          d="M 112 25 A 65 65 0 0 1 145 80"
          fill="none"
          stroke={colors.green}
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Scale labels */}
        <text x="10" y="95" fontSize="9" fill={colors.grey}>-1</text>
        <text x="76" y="12" fontSize="9" fill={colors.grey}>0</text>
        <text x="145" y="95" fontSize="9" fill={colors.grey}>+1</text>

        {/* Needle */}
        <line
          x1="80"
          y1="80"
          x2={needleX}
          y2={needleY}
          stroke={colors.black}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Needle center */}
        <circle cx="80" cy="80" r="6" fill={colors.black}/>

        {/* Needle tip indicator */}
        <circle
          cx={needleX}
          cy={needleY}
          r={isHighlighted ? "8" : "6"}
          fill={isHighlighted ? colors.green : colors.black}
        />
        {isHighlighted && (
          <circle
            cx={needleX}
            cy={needleY}
            r="12"
            fill="none"
            stroke={colors.green}
            strokeWidth="2"
            opacity="0.4"
          />
        )}
      </svg>

      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color: parseFloat(value) >= 0 ? colors.green : colors.red,
        marginTop: '8px'
      }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: colors.grey, marginTop: '4px' }}>
        {subtitle}
      </div>
    </div>
  );
};

// Tooltip component for team/sponsor details
const Tooltip = ({ content, children, colors }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    setIsVisible(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.top });
  };

  return (
    <div
      style={{ position: 'relative', cursor: 'pointer' }}
      onMouseEnter={handleMouseEnter}
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
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.black, margin: '0 0 8px', lineHeight: '1.2' }}>
          {t('subtitle')}
        </h2>
        <div style={{ fontSize: '13px', color: colors.grey }}>
          {t('analysisDate')} • 22,889 {t('articlesAnalyzed')}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <SentimentGauge
          value="+0.130"
          label={t('overallSentiment')}
          subtitle={t('withAllData')}
          isHighlighted={false}
          colors={colors}
        />
        <SentimentGauge
          value="+0.153"
          label={t('pureSportsSentiment')}
          subtitle={<>{t('exclPoliticalNoise')} <strong style={{ color: colors.green }}>(+18%)</strong></>}
          isHighlighted={true}
          colors={colors}
        />

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
        <div style={{ fontSize: '12px', fontWeight: '700', color: colors.blue, marginBottom: '8px' }}>{t('keyInsight')}</div>
        <div style={{ fontSize: '14px', color: colors.black, lineHeight: '1.6' }}>{t('insightText')}</div>
      </div>

      {/* Negative Drivers */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>{t('negativeDrivers')}</h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 16px' }}>{t('driversSubtitle')}</p>

        {NEGATIVE_DRIVERS.map((driver, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i < NEGATIVE_DRIVERS.length - 1 ? '1px solid #f0f0f0' : 'none', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ width: '120px', fontSize: '13px', fontWeight: '600' }}>{t(driver.key)}</div>
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
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>{t('teamSentiment')}</h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 8px' }}>{t('teamsPositive')}</p>
        <p style={{ fontSize: '11px', color: colors.blue, margin: '0 0 16px', fontStyle: 'italic' }}>💡 {t('clickForDetails')}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {Object.entries(TEAMS_BY_GROUP).map(([group, teams]) => (
            <div key={group} style={{ background: '#fafafa', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: colors.blue, marginBottom: '10px', paddingBottom: '6px', borderBottom: `2px solid ${colors.blue}` }}>
                GROUP {group} {group === 'J' && '⭐'}
              </div>
              {teams.map((team, i) => (
                <Tooltip
                  key={i}
                  content={TEAM_ANALYSIS[team.name]}
                  colors={colors}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      background: expandedTeam === team.name
                        ? (team.negative ? '#fce8e8' : '#e8f5f0')
                        : team.highest ? '#e8f5f0' : team.negative ? '#fce8e8' : 'transparent',
                      margin: '2px -8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={() => setExpandedTeam(team.name)}
                    onMouseLeave={() => setExpandedTeam(null)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '14px' }}>{team.flag}</span>
                      <span style={{ fontWeight: '500' }}>{team.name}</span>
                      {team.host && <span title="Host">🏠</span>}
                      {team.debut && <span title="Debut">🆕</span>}
                      {team.champion && <span title="Champion">🏆</span>}
                    </span>
                    <span style={{
                      fontWeight: '700',
                      color: team.negative ? colors.red : colors.green,
                      fontSize: '11px',
                    }}>
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
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 8px' }}>{t('sponsorSentiment')}</h3>
        <p style={{ fontSize: '13px', color: colors.grey, margin: '0 0 8px' }}>{t('sponsorsPositive')}</p>
        <p style={{ fontSize: '11px', color: colors.blue, margin: '0 0 16px', fontStyle: 'italic' }}>💡 {t('clickForDetails')}</p>

        {SPONSORS.map((sponsor, i) => (
          <Tooltip
            key={i}
            content={SPONSOR_ANALYSIS[sponsor.name]}
            colors={colors}
          >
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
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.black, margin: '0 0 16px' }}>{t('keyTakeaways')}</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { key: 'sportingPositive', textKey: 'sportingPositiveText', color: colors.green, icon: '✓' },
            { key: 'politicalSeparate', textKey: 'politicalSeparateText', color: '#b8860b', icon: '⚡' },
            { key: 'consumerDemand', textKey: 'consumerDemandText', color: colors.green, icon: '📊' },
            { key: 'sponsorsSucceeding', textKey: 'sponsorsSucceedingText', color: colors.green, icon: '💼' },
          ].map((item, i) => (
            <div key={i} style={{
              background: item.color === colors.green ? '#e8f5f0' : '#fff8e0',
              borderRadius: '8px',
              padding: '14px'
            }}>
              <div style={{ fontWeight: '700', color: item.color, marginBottom: '6px', fontSize: '13px' }}>
                {item.icon} {t(item.key)}
              </div>
              <div style={{ fontSize: '12px', color: colors.black, lineHeight: '1.5' }}>
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
