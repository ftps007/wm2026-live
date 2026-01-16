// =============================================
// WM 2026 Tippspiel - Language Context
// Supports: German (de), English (en), Polish (pl), Spanish (es), Portuguese (pt)
// =============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, teamTranslations, dayNames, monthNames, triviaCategories } from './translations';

const LanguageContext = createContext();
const SUPPORTED_LANGUAGES = ['de', 'en', 'pl', 'es', 'pt', 'fr'];

export const LanguageProvider = ({ children }) => {
  const getInitialLanguage = () => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (SUPPORTED_LANGUAGES.includes(urlLang)) {
      localStorage.setItem('wm2026_language', urlLang);
      return urlLang;
    }
    
    const saved = localStorage.getItem('wm2026_language');
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
    
    // Check browser language
    const browserLang = navigator.language?.substring(0, 2);
    if (browserLang === 'en') return 'en';
    if (browserLang === 'pl') return 'pl';
    if (browserLang === 'es') return 'es';
    if (browserLang === 'pt') return 'pt';
    if (browserLang === 'fr') return 'fr';
    return 'de';
  };

  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('wm2026_language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => {
      const idx = SUPPORTED_LANGUAGES.indexOf(prev);
      return SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
    });
    // Mark as manually set so geo-detection doesn't override
    localStorage.setItem('wm2026_language_manual', 'true');
  };

  const setLang = (lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguage(lang);
      // Mark as manually set so geo-detection doesn't override
      localStorage.setItem('wm2026_language_manual', 'true');
    }
  };

  const t = (key) => translations[language]?.[key] || translations['de']?.[key] || key;

  const translateTeam = (teamName) => {
    if (language === 'de') return teamName;
    if (teamName?.includes('Gruppe')) {
      const replacementsByLang = {
        en: { 'Sieger': 'Winner', 'Verlierer': 'Loser', 'Gruppe': 'Group' },
        pl: { 'Sieger': 'Zwycięzca', 'Verlierer': 'Przegrany', 'Gruppe': 'Grupy' },
        es: { 'Sieger': 'Ganador', 'Verlierer': 'Perdedor', 'Gruppe': 'Grupo' },
        pt: { 'Sieger': 'Vencedor', 'Verlierer': 'Perdedor', 'Gruppe': 'Grupo' },
        fr: { 'Sieger': 'Vainqueur', 'Verlierer': 'Perdant', 'Gruppe': 'Groupe' },
      };
      const replacements = replacementsByLang[language] || replacementsByLang.en;
      return Object.entries(replacements).reduce((str, [de, tr]) => str.replace(de, tr), teamName);
    }
    return teamTranslations[language]?.[teamName] || teamTranslations.en?.[teamName] || teamName;
  };

  const formatDate = (date, options = {}) => {
    const d = new Date(date);
    const day = dayNames[language][d.getDay()];
    const dayNum = d.getDate();
    const month = monthNames[language][d.getMonth()];
    const year = d.getFullYear();
    
    if (options.short) {
      if (language === 'en') return `${month.substring(0, 3)} ${dayNum}`;
      return `${dayNum}. ${month.substring(0, 3)}`;
    }
    
    if (language === 'en') return `${day}, ${month} ${dayNum}, ${year}`;
    if (language === 'pl') return `${day}, ${dayNum} ${month} ${year}`;
    if (language === 'es') return `${day}, ${dayNum} de ${month} ${year}`;
    if (language === 'pt') return `${day}, ${dayNum} de ${month} ${year}`;
    if (language === 'fr') return `${day} ${dayNum} ${month} ${year}`;
    return `${day}, ${dayNum}. ${month} ${year}`;
  };

  const formatTime = (time24) => {
    if (language === 'en') {
      const [hours, minutes] = time24.split(':');
      const h = parseInt(hours);
      return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
    }
    if (language === 'pl' || language === 'es' || language === 'pt' || language === 'fr') return time24;
    return `${time24} Uhr`;
  };

  const translateCategory = (category) => triviaCategories?.[language]?.[category] || category;

  const value = {
    language,
    setLanguage: setLang,
    toggleLanguage,
    t,
    translateTeam,
    translateCategory,
    formatDate,
    formatTime,
    isEnglish: language === 'en',
    isGerman: language === 'de',
    isPolish: language === 'pl',
    isSpanish: language === 'es',
    isPortuguese: language === 'pt',
    isFrench: language === 'fr',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

export const LanguageSelector = ({ style = {} }) => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'de', flag: '🇩🇪', label: 'DE' },
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'fr', flag: '🇫🇷', label: 'FR' },
    { code: 'es', flag: '🇪🇸', label: 'ES' },
    { code: 'pt', flag: '🇧🇷🇵🇹', label: 'PT' },
    { code: 'pl', flag: '🇵🇱', label: 'PL' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0px', ...style }}>
      {languages.map((lang, index) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          style={{
            padding: '4px 8px',
            background: language === lang.code ? '#fbbf24' : 'transparent',
            border: '1px solid #334155',
            borderLeft: index === 0 ? '1px solid #334155' : 'none',
            borderRadius: index === 0 ? '4px 0 0 4px' : index === languages.length - 1 ? '0 4px 4px 0' : '0',
            color: language === lang.code ? '#0f172a' : '#94a3b8',
            fontSize: '11px',
            fontWeight: language === lang.code ? 'bold' : 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease'
          }}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageContext;
