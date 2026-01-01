import React, { useState } from 'react';

// NordVPN Affiliate Link (CJ)
const NORDVPN_AFFILIATE_URL = 'https://www.kqzyfj.com/click-101616485-13756265';

// Translations for Guide
const guideTranslations = {
  de: {
    headerTitle: '🏆 FIFA WM 2026 FAN-GUIDE',
    headerSubtitle: 'Streaming • Tickets • Reisen • Merch',
    headerInfo: 'Alles was DACH-Fans wissen müssen',
    streaming: '📺 Streaming',
    tickets: '🎫 Tickets',
    travel: '✈️ Reisen',
    merchandise: '👕 Merch',
    germany: 'Deutschland',
    austria: 'Österreich',
    switzerland: 'Schweiz',
    freeGamesDE: '60/104 gratis',
    freeGamesAT: '104/104 gratis',
    freeGamesCH: '104/104 gratis',
    vpnTitle: 'Von überall WM schauen',
    vpnSubtitle: 'Im Urlaub? Mit VPN streamst du ARD & ZDF auch im Ausland.',
    recommended: 'EMPFOHLEN',
    allGames: 'ALLE 104',
    free: 'Kostenlos',
    games: 'Spiele',
    from: 'ab',
    perMonth: '/Mo',
    conference: 'Konferenz',
    ticketsSubtitle: 'WM 2026 Tickets',
    officialSale: 'Offizieller Verkauf',
    registrationRequired: 'Registrierung erforderlich',
    lottery: 'Losverfahren für deutsche Spiele',
    prices: 'Preise',
    category1: 'Kategorie 1',
    category3: 'Kategorie 3',
    startSale: 'Verkaufsstart',
    expected: 'Voraussichtlich',
    tips: 'Tipps',
    ticketTip1: 'Früh registrieren für Newsletter',
    ticketTip2: 'Offizielle FIFA-Seite nutzen',
    ticketTip3: 'Keine Tickets bei Drittanbietern kaufen',
    officialPortal: 'Offizielles FIFA Ticket-Portal',
    travelTitle: '✈️ Reise-Tipps',
    visa: 'Visum',
    visaUSA: 'ESTA für USA erforderlich',
    visaCanada: 'eTA für Kanada erforderlich',
    visaMexico: 'Visa-frei bis 180 Tage',
    flights: 'Flüge',
    accommodation: 'Unterkunft',
    bestTime: 'Beste Buchungszeit',
    bestTimeInfo: '6-9 Monate im Voraus',
    bookEarly: 'Früh buchen',
    pricesRising: 'Preise steigen',
    compareFlights: 'Flüge vergleichen',
    checkHotels: 'Hotels prüfen',
    merchTitle: '👕 Fan-Artikel',
    jerseys: 'Trikots',
    accessories: 'Accessoires',
    matchBalls: 'Spielbälle',
    collectibles: 'Sammlerstücke',
    dfbShop: 'DFB-Fanshop',
    fifaStore: 'FIFA Store',
    affiliateHint: '* Affiliate-Links - bei Kauf erhalten wir eine kleine Provision',
  },
  en: {
    headerTitle: '🏆 FIFA WORLD CUP 2026 FAN GUIDE',
    headerSubtitle: 'Streaming • Tickets • Travel • Merch',
    headerInfo: 'Everything fans need to know',
    streaming: '📺 Streaming',
    tickets: '🎫 Tickets',
    travel: '✈️ Travel',
    merchandise: '👕 Merch',
    germany: 'Germany',
    austria: 'Austria',
    switzerland: 'Switzerland',
    freeGamesDE: '60/104 free',
    freeGamesAT: '104/104 free',
    freeGamesCH: '104/104 free',
    vpnTitle: 'Watch World Cup from anywhere',
    vpnSubtitle: 'On vacation? With VPN you can stream local TV abroad.',
    recommended: 'RECOMMENDED',
    allGames: 'ALL 104',
    free: 'Free',
    games: 'games',
    from: 'from',
    perMonth: '/mo',
    conference: 'Multi-Game',
    ticketsSubtitle: 'World Cup 2026 Tickets',
    officialSale: 'Official Sale',
    registrationRequired: 'Registration required',
    lottery: 'Lottery for popular games',
    prices: 'Prices',
    category1: 'Category 1',
    category3: 'Category 3',
    startSale: 'Sales Start',
    expected: 'Expected',
    tips: 'Tips',
    ticketTip1: 'Register early for newsletter',
    ticketTip2: 'Use official FIFA website',
    ticketTip3: "Don't buy tickets from third parties",
    officialPortal: 'Official FIFA Ticket Portal',
    travelTitle: '✈️ Travel Tips',
    visa: 'Visa',
    visaUSA: 'ESTA required for USA',
    visaCanada: 'eTA required for Canada',
    visaMexico: 'Visa-free up to 180 days',
    flights: 'Flights',
    accommodation: 'Accommodation',
    bestTime: 'Best booking time',
    bestTimeInfo: '6-9 months in advance',
    bookEarly: 'Book early',
    pricesRising: 'Prices rising',
    compareFlights: 'Compare Flights',
    checkHotels: 'Check Hotels',
    merchTitle: '👕 Fan Merchandise',
    jerseys: 'Jerseys',
    accessories: 'Accessories',
    matchBalls: 'Match Balls',
    collectibles: 'Collectibles',
    dfbShop: 'DFB Fan Shop',
    fifaStore: 'FIFA Store',
    affiliateHint: '* Affiliate links - we receive a small commission on purchases',
  },
  pl: {
    headerTitle: '🏆 FIFA MŚ 2026 PRZEWODNIK',
    headerSubtitle: 'Streaming • Bilety • Podróże • Gadżety',
    headerInfo: 'Wszystko co kibice muszą wiedzieć',
    streaming: '📺 Streaming',
    tickets: '🎫 Bilety',
    travel: '✈️ Podróże',
    merchandise: '👕 Gadżety',
    germany: 'Niemcy',
    austria: 'Austria',
    switzerland: 'Szwajcaria',
    freeGamesDE: '60/104 za darmo',
    freeGamesAT: '104/104 za darmo',
    freeGamesCH: '104/104 za darmo',
    vpnTitle: 'Oglądaj MŚ z dowolnego miejsca',
    vpnSubtitle: 'Na wakacjach? Z VPN możesz streamować lokalne TV za granicą.',
    recommended: 'POLECANE',
    allGames: 'WSZYSTKIE 104',
    free: 'Za darmo',
    games: 'mecze',
    from: 'od',
    perMonth: '/mies.',
    conference: 'Multi-mecz',
    ticketsSubtitle: 'Bilety MŚ 2026',
    officialSale: 'Oficjalna sprzedaż',
    registrationRequired: 'Wymagana rejestracja',
    lottery: 'Loteria na popularne mecze',
    prices: 'Ceny',
    category1: 'Kategoria 1',
    category3: 'Kategoria 3',
    startSale: 'Start sprzedaży',
    expected: 'Przewidywany',
    tips: 'Wskazówki',
    ticketTip1: 'Zarejestruj się wcześnie na newsletter',
    ticketTip2: 'Korzystaj z oficjalnej strony FIFA',
    ticketTip3: 'Nie kupuj biletów od pośredników',
    officialPortal: 'Oficjalny portal biletowy FIFA',
    travelTitle: '✈️ Porady podróżne',
    visa: 'Wiza',
    visaUSA: 'ESTA wymagana dla USA',
    visaCanada: 'eTA wymagana dla Kanady',
    visaMexico: 'Bez wizy do 180 dni',
    flights: 'Loty',
    accommodation: 'Noclegi',
    bestTime: 'Najlepszy czas na rezerwację',
    bestTimeInfo: '6-9 miesięcy wcześniej',
    bookEarly: 'Rezerwuj wcześnie',
    pricesRising: 'Ceny rosną',
    compareFlights: 'Porównaj loty',
    checkHotels: 'Sprawdź hotele',
    merchTitle: '👕 Gadżety kibica',
    jerseys: 'Koszulki',
    accessories: 'Akcesoria',
    matchBalls: 'Piłki meczowe',
    collectibles: 'Przedmioty kolekcjonerskie',
    dfbShop: 'Sklep DFB',
    fifaStore: 'Sklep FIFA',
    affiliateHint: '* Linki afiliacyjne - otrzymujemy małą prowizję od zakupów',
  }
};

export default function WM2026FanGuide({ language = 'de' }) {
  const [activeSection, setActiveSection] = useState('streaming');
  const [activeCountry, setActiveCountry] = useState('DE');
  
  const t = (key) => guideTranslations[language]?.[key] || guideTranslations['de']?.[key] || key;

  const sections = [
    { id: 'streaming', label: t('streaming'), color: '#10b981' },
    { id: 'tickets', label: t('tickets'), color: '#3b82f6' },
    { id: 'travel', label: t('travel'), color: '#8b5cf6' },
    { id: 'merchandise', label: t('merchandise'), color: '#f59e0b' },
  ];

  const countries = [
    { id: 'DE', flag: '🇩🇪', name: t('germany'), freeGames: t('freeGamesDE') },
    { id: 'AT', flag: '🇦🇹', name: t('austria'), freeGames: t('freeGamesAT') },
    { id: 'CH', flag: '🇨🇭', name: t('switzerland'), freeGames: t('freeGamesCH') },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '12px', padding: '20px', marginBottom: '12px', textAlign: 'center', border: '1px solid #334155' }}>
        <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '8px' }}>{t('headerTitle')}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{t('headerSubtitle')}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('headerInfo')}</div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: '10px 6px', background: activeSection === s.id ? `${s.color}20` : '#1e293b', border: activeSection === s.id ? `1px solid ${s.color}` : '1px solid #334155', borderRadius: '8px', color: activeSection === s.id ? s.color : '#94a3b8', fontSize: '11px', fontWeight: activeSection === s.id ? 'bold' : 'normal', cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* STREAMING SECTION */}
      {activeSection === 'streaming' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {countries.map(c => (
              <button key={c.id} onClick={() => setActiveCountry(c.id)} style={{ padding: '12px 8px', background: activeCountry === c.id ? 'rgba(16,185,129,0.15)' : '#1e293b', border: activeCountry === c.id ? '1px solid #10b981' : '1px solid #334155', borderRadius: '10px', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{c.flag}</div>
                <div style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{c.name}</div>
                <div style={{ fontSize: '10px', color: '#10b981' }}>{c.freeGames}</div>
              </button>
            ))}
          </div>

          <a href={NORDVPN_AFFILIATE_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid #4158D0', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🌍</span>
              <div>
                <div style={{ fontSize: '13px', color: 'white', fontWeight: 'bold' }}>{t('vpnTitle')}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('vpnSubtitle')}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>NordVPN</div>
              <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'bold' }}>-68%</div>
            </div>
          </a>

          {activeCountry === 'DE' && (
            <div>
              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>MagentaTV</span>
                    <span style={{ fontSize: '9px', background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{t('recommended')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>{t('from')} 10€{t('perMonth')}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>{t('allGames')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['4K/UHD', t('conference'), 'Klopp & Müller'].map(tag => (
                    <span key={tag} style={{ fontSize: '9px', color: '#94a3b8', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>ARD</div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>ARD Mediathek</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>{t('free')}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>30 {t('games')}</div>
                  </div>
                </div>
              </div>
              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>ZDF</div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>ZDFmediathek</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>{t('free')}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>30 {t('games')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCountry === 'AT' && (
            <div>
              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>ORF</span>
                    <span style={{ fontSize: '9px', background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{t('recommended')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>{t('free')}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>{t('allGames')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['ORF 1', 'ORF Sport+', 'ORF ON'].map(tag => (
                    <span key={tag} style={{ fontSize: '9px', color: '#94a3b8', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>ServusTV</div></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>{t('free')}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>~50 {t('games')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCountry === 'CH' && (
            <div>
              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>SRF</span>
                    <span style={{ fontSize: '9px', background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{t('recommended')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>{t('free')}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>{t('allGames')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['SRF zwei', 'SRF info', 'Play SRF'].map(tag => (
                    <span key={tag} style={{ fontSize: '9px', color: '#94a3b8', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>blue Sport (Swisscom)</div></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold' }}>{t('from')} 29 CHF{t('perMonth')}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>{t('allGames')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TICKETS SECTION */}
      {activeSection === 'tickets' && (
        <div>
          <div style={{ background: '#1e293b', borderRadius: '10px', padding: '16px', marginBottom: '12px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>{t('ticketsSubtitle')}</div>
            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '4px' }}>FIFA.com</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>{t('officialSale')} • {t('registrationRequired')}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{t('lottery')}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>{t('prices')}</div>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>$50 - $1,600</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>{t('category3')} - {t('category1')}</div>
              </div>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>{t('startSale')}</div>
                <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 'bold' }}>Q4 2025</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>{t('expected')}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '8px', fontWeight: 'bold' }}>💡 {t('tips')}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.6' }}>
              • {t('ticketTip1')}<br/>• {t('ticketTip2')}<br/>• {t('ticketTip3')}
            </div>
          </div>
          <a href="https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/tickets" target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#10b981', borderRadius: '10px', padding: '14px', textAlign: 'center', textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '13px' }}>
            🎫 {t('officialPortal')} →
          </a>
        </div>
      )}

      {/* TRAVEL SECTION */}
      {activeSection === 'travel' && (
        <div>
          <div style={{ background: '#1e293b', borderRadius: '10px', padding: '16px', marginBottom: '12px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>{t('travelTitle')}</div>
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '8px' }}>🛂 {t('visa')}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.8' }}>
                🇺🇸 <strong>USA:</strong> {t('visaUSA')}<br/>
                🇨🇦 <strong>Canada:</strong> {t('visaCanada')}<br/>
                🇲🇽 <strong>Mexico:</strong> {t('visaMexico')}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>✈️ {t('flights')}</div>
                <div style={{ fontSize: '12px', color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>{t('bestTime')}</div>
                <div style={{ fontSize: '10px', color: '#10b981' }}>{t('bestTimeInfo')}</div>
              </div>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>🏨 {t('accommodation')}</div>
                <div style={{ fontSize: '12px', color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>{t('bookEarly')}</div>
                <div style={{ fontSize: '10px', color: '#fbbf24' }}>{t('pricesRising')}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <a href="https://www.skyscanner.com" target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#3b82f6', borderRadius: '10px', padding: '14px', textAlign: 'center', textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
              ✈️ {t('compareFlights')}
            </a>
            <a href="https://www.booking.com" target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#8b5cf6', borderRadius: '10px', padding: '14px', textAlign: 'center', textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
              🏨 {t('checkHotels')}
            </a>
          </div>
        </div>
      )}

      {/* MERCHANDISE SECTION */}
      {activeSection === 'merchandise' && (
        <div>
          <div style={{ background: '#1e293b', borderRadius: '10px', padding: '16px', marginBottom: '12px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>{t('merchTitle')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>👕</div>
                <div style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{t('jerseys')}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{t('from')} €90</div>
              </div>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>🧢</div>
                <div style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{t('accessories')}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{t('from')} €15</div>
              </div>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>⚽</div>
                <div style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{t('matchBalls')}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{t('from')} €40</div>
              </div>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>🏆</div>
                <div style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{t('collectibles')}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{t('from')} €20</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <a href="https://www.dfb-fanshop.de" target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px', textAlign: 'center', textDecoration: 'none' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🇩🇪</div>
              <div style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{t('dfbShop')}</div>
            </a>
            <a href="https://store.fifa.com" target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px', textAlign: 'center', textDecoration: 'none' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏆</div>
              <div style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{t('fifaStore')}</div>
            </a>
          </div>
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '9px', color: '#64748b', textAlign: 'center' }}>{t('affiliateHint')}</div>
    </div>
  );
}
