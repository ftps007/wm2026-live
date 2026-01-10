// ==============================================================
// SpieleSection.jsx - WM 2026 Tippspiel (V3 - Fixed)
// ==============================================================

import React, { useState, useMemo } from 'react';
import { t, translateTeam, translatePhase, translatePlayoffType } from './translations';
import { H2H_DATA } from './WM2026TeamBadges';

// ==================== TEAM NAME TO CODE MAPPING ====================
const TEAM_NAME_TO_CODE = {
  'Deutschland': 'DE', 'Frankreich': 'FR', 'England': 'EN', 'Spanien': 'ES',
  'Brasilien': 'BR', 'Argentinien': 'AR', 'Portugal': 'PT', 'Niederlande': 'NL',
  'Belgien': 'BE', 'Kroatien': 'HR', 'Uruguay': 'UY', 'Kolumbien': 'CO',
  'Mexiko': 'MX', 'USA': 'US', 'Kanada': 'CA', 'Japan': 'JP',
  'Republik Korea': 'KR', 'Australien': 'AU', 'Schweiz': 'CH', 'Österreich': 'AT',
  'Schottland': 'SCO', 'Marokko': 'MA', 'Senegal': 'SN', 'Ghana': 'GH',
  'Elfenbeinküste': 'CI', 'Algerien': 'DZ', 'Ägypten': 'EG', 'Tunesien': 'TN',
  'Kamerun': 'CM', 'Nigeria': 'NG', 'Südafrika': 'ZA', 'Katar': 'QA',
  'Saudi-Arabien': 'SA', 'Iran': 'IR', 'Ecuador': 'EC', 'Paraguay': 'PY',
  'Chile': 'CL', 'Peru': 'PE', 'Venezuela': 'VE', 'Bolivien': 'BO',
  'Polen': 'PL', 'Ukraine': 'UA', 'Norwegen': 'NO', 'Schweden': 'SE',
  'Dänemark': 'DK', 'Ungarn': 'HU', 'Serbien': 'RS', 'Tschechien': 'CZ',
  'Slowakei': 'SK', 'Rumänien': 'RO', 'Bulgarien': 'BG', 'Griechenland': 'GR',
  'Türkei': 'TR', 'Irland': 'IE', 'Wales': 'WAL', 'Nordirland': 'NIR',
  'Panama': 'PA', 'Costa Rica': 'CR', 'Honduras': 'HN', 'El Salvador': 'SV',
  'Jamaika': 'JM', 'Haiti': 'HT', 'Curaçao': 'CW', 'Kap Verde': 'CV',
  'Neuseeland': 'NZ', 'Usbekistan': 'UZ', 'Jordanien': 'JO',
  'Bosnien-Herzegowina': 'BIH', 'Nordmazedonien': 'MKD', 'Albanien': 'ALB',
  'Kosovo': 'XKX', 'DR Kongo': 'COD', 'Neukaledonien': 'NCL', 'Irak': 'IRQ',
  'Suriname': 'SUR'
};

// Get H2H matches for a pairing (last 5)
const getH2HMatches = (team1Name, team2Name) => {
  const code1 = TEAM_NAME_TO_CODE[team1Name];
  const code2 = TEAM_NAME_TO_CODE[team2Name];
  if (!code1 || !code2) return [];

  const matches = H2H_DATA[code1]?.[code2] || [];
  return matches.slice(0, 5); // Return last 5 matches
};

// Calculate H2H summary (wins-draws-losses from team1 perspective)
const getH2HSummary = (matches) => {
  let wins = 0, draws = 0, losses = 0;
  matches.forEach(m => {
    const [home, away] = m.result.split(':').map(s => parseInt(s));
    if (home > away) wins++;
    else if (home < away) losses++;
    else draws++;
  });
  return { wins, draws, losses, total: matches.length };
};

// ==================== PLAY-OFF INFO ====================
const PLAYOFF_INFO = {
  'Play-off D': { teams: ['Dänemark', 'Tschechien', 'Irland', 'Nordmazedonien'], type: 'UEFA' },
  'Play-off A': { teams: ['Italien', 'Wales', 'Bosnien-Herzegowina', 'Nordirland'], type: 'UEFA' },
  'Play-off C': { teams: ['Türkei', 'Rumänien', 'Slowakei', 'Kosovo'], type: 'UEFA' },
  'Play-off B': { teams: ['Ukraine', 'Schweden', 'Polen', 'Albanien'], type: 'UEFA' },
  'FIFA Play-off 1': { teams: ['DR Kongo', 'Jamaika', 'Neukaledonien'], type: 'Interkontinental' },
  'FIFA Play-off 2': { teams: ['Irak', 'Bolivien', 'Suriname'], type: 'Interkontinental' }
};

// ==================== TEAMS BY GROUP ====================
// WM Titel: Brasilien 5, Deutschland 4, Italien 4, Argentinien 3, Frankreich 2, Uruguay 2, England 1, Spanien 1
const WM_TITLES = {
  'Brasilien': 5,
  'Deutschland': 4,
  'Argentinien': 3,
  'Frankreich': 2,
  'Uruguay': 2,
  'England': 1,
  'Spanien': 1
};

export const TEAMS = {
  'A': [
    { name: 'Mexiko', flag: '🇲🇽', strength: 80 },
    { name: 'Südafrika', flag: '🇿🇦', strength: 72 },
    { name: 'Republik Korea', flag: '🇰🇷', strength: 77 },
    { name: 'Play-off D', flag: '🏳️', strength: 70 }
  ],
  'B': [
    { name: 'Kanada', flag: '🇨🇦', strength: 75 },
    { name: 'Play-off A', flag: '🏳️', strength: 78 },
    { name: 'Katar', flag: '🇶🇦', strength: 68 },
    { name: 'Schweiz', flag: '🇨🇭', strength: 81 }
  ],
  'C': [
    { name: 'Brasilien', flag: '🇧🇷', strength: 92 },
    { name: 'Marokko', flag: '🇲🇦', strength: 79 },
    { name: 'Haiti', flag: '🇭🇹', strength: 58 },
    { name: 'Schottland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', strength: 74 }
  ],
  'D': [
    { name: 'USA', flag: '🇺🇸', strength: 82 },
    { name: 'Paraguay', flag: '🇵🇾', strength: 71 },
    { name: 'Australien', flag: '🇦🇺', strength: 73 },
    { name: 'Play-off C', flag: '🏳️', strength: 72 }
  ],
  'E': [
    { name: 'Deutschland', flag: '🇩🇪', strength: 88 },
    { name: 'Curaçao', flag: '🇨🇼', strength: 52 },
    { name: 'Elfenbeinküste', flag: '🇨🇮', strength: 74 },
    { name: 'Ecuador', flag: '🇪🇨', strength: 75 }
  ],
  'F': [
    { name: 'Niederlande', flag: '🇳🇱', strength: 86 },
    { name: 'Japan', flag: '🇯🇵', strength: 80 },
    { name: 'Play-off B', flag: '🏳️', strength: 76 },
    { name: 'Tunesien', flag: '🇹🇳', strength: 70 }
  ],
  'G': [
    { name: 'Belgien', flag: '🇧🇪', strength: 84 },
    { name: 'Ägypten', flag: '🇪🇬', strength: 72 },
    { name: 'Iran', flag: '🇮🇷', strength: 71 },
    { name: 'Neuseeland', flag: '🇳🇿', strength: 62 }
  ],
  'H': [
    { name: 'Spanien', flag: '🇪🇸', strength: 90 },
    { name: 'Kap Verde', flag: '🇨🇻', strength: 58 },
    { name: 'Saudi-Arabien', flag: '🇸🇦', strength: 67 },
    { name: 'Uruguay', flag: '🇺🇾', strength: 83 }
  ],
  'I': [
    { name: 'Frankreich', flag: '🇫🇷', strength: 91 },
    { name: 'Senegal', flag: '🇸🇳', strength: 78 },
    { name: 'FIFA Play-off 2', flag: '🏳️', strength: 60 },
    { name: 'Norwegen', flag: '🇳🇴', strength: 74 }
  ],
  'J': [
    { name: 'Argentinien', flag: '🇦🇷', strength: 93 },
    { name: 'Algerien', flag: '🇩🇿', strength: 71 },
    { name: 'Österreich', flag: '🇦🇹', strength: 79 },
    { name: 'Jordanien', flag: '🇯🇴', strength: 63 }
  ],
  'K': [
    { name: 'Portugal', flag: '🇵🇹', strength: 89 },
    { name: 'FIFA Play-off 1', flag: '🏳️', strength: 58 },
    { name: 'Usbekistan', flag: '🇺🇿', strength: 66 },
    { name: 'Kolumbien', flag: '🇨🇴', strength: 81 }
  ],
  'L': [
    { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', strength: 89 },
    { name: 'Kroatien', flag: '🇭🇷', strength: 82 },
    { name: 'Ghana', flag: '🇬🇭', strength: 70 },
    { name: 'Panama', flag: '🇵🇦', strength: 64 }
  ]
};

export const GROUPS = Object.keys(TEAMS);

// ==================== STADIUMS ====================
const STADIUMS = {
  'Mexico City': { 
    name: 'Estadio Azteca', country: '🇲🇽', capacity: 87523, utcOffset: -5, 
    wiki_de: 'https://de.wikipedia.org/wiki/Estadio_Azteca',
    wiki_en: 'https://en.wikipedia.org/wiki/Estadio_Azteca',
    homeTeams: [{ team: 'Club América', league: 'Liga MX' }, { team: 'Cruz Azul', league: 'Liga MX' }]
  },
  'Guadalajara': { 
    name: 'Estadio Akron', country: '🇲🇽', capacity: 49850, utcOffset: -5, 
    wiki_de: 'https://de.wikipedia.org/wiki/Estadio_Akron',
    wiki_en: 'https://en.wikipedia.org/wiki/Estadio_Akron',
    homeTeams: [{ team: 'CD Guadalajara', league: 'Liga MX' }]
  },
  'Monterrey': { 
    name: 'Estadio BBVA', country: '🇲🇽', capacity: 53500, utcOffset: -5, 
    wiki_de: 'https://de.wikipedia.org/wiki/Estadio_BBVA',
    wiki_en: 'https://en.wikipedia.org/wiki/Estadio_BBVA',
    homeTeams: [{ team: 'CF Monterrey', league: 'Liga MX' }]
  },
  'Toronto': { 
    name: 'BMO Field', country: '🇨🇦', capacity: 45500, utcOffset: -4, 
    wiki_de: 'https://de.wikipedia.org/wiki/BMO_Field',
    wiki_en: 'https://en.wikipedia.org/wiki/BMO_Field',
    homeTeams: [{ team: 'Toronto FC', league: 'MLS' }, { team: 'Toronto Argonauts', league: 'CFL' }]
  },
  'Vancouver': { 
    name: 'BC Place', country: '🇨🇦', capacity: 54500, utcOffset: -7, 
    wiki_de: 'https://de.wikipedia.org/wiki/BC_Place_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/BC_Place',
    homeTeams: [{ team: 'Vancouver Whitecaps', league: 'MLS' }, { team: 'BC Lions', league: 'CFL' }]
  },
  'Los Angeles': { 
    name: 'SoFi Stadium', country: '🇺🇸', capacity: 70240, utcOffset: -7, 
    wiki_de: 'https://de.wikipedia.org/wiki/SoFi_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/SoFi_Stadium',
    homeTeams: [{ team: 'LA Rams', league: 'NFL' }, { team: 'LA Chargers', league: 'NFL' }]
  },
  'New York': { 
    name: 'MetLife Stadium', country: '🇺🇸', capacity: 82500, utcOffset: -4, 
    wiki_de: 'https://de.wikipedia.org/wiki/MetLife_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/MetLife_Stadium',
    homeTeams: [{ team: 'NY Giants', league: 'NFL' }, { team: 'NY Jets', league: 'NFL' }]
  },
  'Boston': { 
    name: 'Gillette Stadium', country: '🇺🇸', capacity: 65878, utcOffset: -4, 
    wiki_de: 'https://de.wikipedia.org/wiki/Gillette_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/Gillette_Stadium',
    homeTeams: [{ team: 'New England Patriots', league: 'NFL' }, { team: 'New England Revolution', league: 'MLS' }]
  },
  'Philadelphia': { 
    name: 'Lincoln Financial Field', country: '🇺🇸', capacity: 69176, utcOffset: -4, 
    wiki_de: 'https://de.wikipedia.org/wiki/Lincoln_Financial_Field',
    wiki_en: 'https://en.wikipedia.org/wiki/Lincoln_Financial_Field',
    homeTeams: [{ team: 'Philadelphia Eagles', league: 'NFL' }]
  },
  'Miami': { 
    name: 'Hard Rock Stadium', country: '🇺🇸', capacity: 65326, utcOffset: -4, 
    wiki_de: 'https://de.wikipedia.org/wiki/Hard_Rock_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/Hard_Rock_Stadium',
    homeTeams: [{ team: 'Miami Dolphins', league: 'NFL' }, { team: 'Inter Miami', league: 'MLS' }]
  },
  'Atlanta': { 
    name: 'Mercedes-Benz Stadium', country: '🇺🇸', capacity: 71000, utcOffset: -4, 
    wiki_de: 'https://de.wikipedia.org/wiki/Mercedes-Benz_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/Mercedes-Benz_Stadium',
    homeTeams: [{ team: 'Atlanta Falcons', league: 'NFL' }, { team: 'Atlanta United', league: 'MLS' }]
  },
  'Houston': { 
    name: 'NRG Stadium', country: '🇺🇸', capacity: 72220, utcOffset: -5, 
    wiki_de: 'https://de.wikipedia.org/wiki/NRG_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/NRG_Stadium',
    homeTeams: [{ team: 'Houston Texans', league: 'NFL' }]
  },
  'Dallas': { 
    name: 'AT&T Stadium', country: '🇺🇸', capacity: 80000, utcOffset: -5, 
    wiki_de: 'https://de.wikipedia.org/wiki/AT%26T_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/AT%26T_Stadium',
    homeTeams: [{ team: 'Dallas Cowboys', league: 'NFL' }]
  },
  'Kansas City': { 
    name: 'Arrowhead Stadium', country: '🇺🇸', capacity: 76416, utcOffset: -5, 
    wiki_de: 'https://de.wikipedia.org/wiki/Arrowhead_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/Arrowhead_Stadium',
    homeTeams: [{ team: 'Kansas City Chiefs', league: 'NFL' }]
  },
  'San Francisco': { 
    name: "Levi's Stadium", country: '🇺🇸', capacity: 68500, utcOffset: -7, 
    wiki_de: 'https://de.wikipedia.org/wiki/Levi%E2%80%99s_Stadium',
    wiki_en: 'https://en.wikipedia.org/wiki/Levi%27s_Stadium',
    homeTeams: [{ team: 'San Francisco 49ers', league: 'NFL' }]
  },
  'Seattle': { 
    name: 'Lumen Field', country: '🇺🇸', capacity: 69000, utcOffset: -7, 
    wiki_de: 'https://de.wikipedia.org/wiki/Lumen_Field',
    wiki_en: 'https://en.wikipedia.org/wiki/Lumen_Field',
    homeTeams: [{ team: 'Seattle Seahawks', league: 'NFL' }, { team: 'Seattle Sounders', league: 'MLS' }]
  }
};

const LEAGUE_COLORS = { 'NFL': '#013369', 'MLS': '#00245D', 'Liga MX': '#1a472a', 'CFL': '#f74902', 'National': '#c8102e' };

const calcLocalTime = (cetTime, city) => {
  const [h, m] = cetTime.split(':').map(Number);
  const offset = STADIUMS[city]?.utcOffset || -5;
  let localH = h + (offset - 2);
  if (localH < 0) localH += 24;
  if (localH >= 24) localH -= 24;
  return `${String(localH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// ==================== 104 MATCHES ====================
export const MATCHES = [
  { id: 1, date: '2026-06-11', group: 'A', team1: 'Mexiko', team2: 'Südafrika', city: 'Mexico City', cet: '21:00', type: 'Gruppenspiel' },
  { id: 2, date: '2026-06-12', group: 'A', team1: 'Republik Korea', team2: 'Play-off D', city: 'Guadalajara', cet: '04:00', type: 'Gruppenspiel' },
  { id: 3, date: '2026-06-12', group: 'B', team1: 'Kanada', team2: 'Play-off A', city: 'Toronto', cet: '21:00', type: 'Gruppenspiel' },
  { id: 4, date: '2026-06-13', group: 'D', team1: 'USA', team2: 'Paraguay', city: 'Los Angeles', cet: '03:00', type: 'Gruppenspiel' },
  { id: 5, date: '2026-06-13', group: 'C', team1: 'Haiti', team2: 'Schottland', city: 'Boston', cet: '03:00', type: 'Gruppenspiel' },
  { id: 6, date: '2026-06-13', group: 'D', team1: 'Australien', team2: 'Play-off C', city: 'Vancouver', cet: '06:00', type: 'Gruppenspiel' },
  { id: 7, date: '2026-06-13', group: 'C', team1: 'Brasilien', team2: 'Marokko', city: 'New York', cet: '00:00', type: 'Gruppenspiel' },
  { id: 8, date: '2026-06-13', group: 'B', team1: 'Katar', team2: 'Schweiz', city: 'San Francisco', cet: '21:00', type: 'Gruppenspiel' },
  { id: 9, date: '2026-06-14', group: 'E', team1: 'Elfenbeinküste', team2: 'Ecuador', city: 'Philadelphia', cet: '01:00', type: 'Gruppenspiel' },
  { id: 10, date: '2026-06-14', group: 'E', team1: 'Deutschland', team2: 'Curaçao', city: 'Houston', cet: '19:00', type: 'Gruppenspiel' },
  { id: 11, date: '2026-06-14', group: 'F', team1: 'Niederlande', team2: 'Japan', city: 'Dallas', cet: '22:00', type: 'Gruppenspiel' },
  { id: 12, date: '2026-06-15', group: 'F', team1: 'Play-off B', team2: 'Tunesien', city: 'Monterrey', cet: '04:00', type: 'Gruppenspiel' },
  { id: 13, date: '2026-06-15', group: 'H', team1: 'Saudi-Arabien', team2: 'Uruguay', city: 'Miami', cet: '00:00', type: 'Gruppenspiel' },
  { id: 14, date: '2026-06-15', group: 'H', team1: 'Spanien', team2: 'Kap Verde', city: 'Atlanta', cet: '18:00', type: 'Gruppenspiel' },
  { id: 15, date: '2026-06-15', group: 'G', team1: 'Iran', team2: 'Neuseeland', city: 'Los Angeles', cet: '03:00', type: 'Gruppenspiel' },
  { id: 16, date: '2026-06-15', group: 'G', team1: 'Belgien', team2: 'Ägypten', city: 'Seattle', cet: '21:00', type: 'Gruppenspiel' },
  { id: 17, date: '2026-06-16', group: 'I', team1: 'Frankreich', team2: 'Senegal', city: 'New York', cet: '21:00', type: 'Gruppenspiel' },
  { id: 18, date: '2026-06-16', group: 'I', team1: 'FIFA Play-off 2', team2: 'Norwegen', city: 'Boston', cet: '00:00', type: 'Gruppenspiel' },
  { id: 19, date: '2026-06-16', group: 'J', team1: 'Argentinien', team2: 'Algerien', city: 'Kansas City', cet: '03:00', type: 'Gruppenspiel' },
  { id: 20, date: '2026-06-16', group: 'J', team1: 'Österreich', team2: 'Jordanien', city: 'San Francisco', cet: '06:00', type: 'Gruppenspiel' },
  { id: 21, date: '2026-06-17', group: 'L', team1: 'Ghana', team2: 'Panama', city: 'Toronto', cet: '01:00', type: 'Gruppenspiel' },
  { id: 22, date: '2026-06-17', group: 'L', team1: 'England', team2: 'Kroatien', city: 'Dallas', cet: '22:00', type: 'Gruppenspiel' },
  { id: 23, date: '2026-06-17', group: 'K', team1: 'Portugal', team2: 'FIFA Play-off 1', city: 'Houston', cet: '19:00', type: 'Gruppenspiel' },
  { id: 24, date: '2026-06-18', group: 'K', team1: 'Usbekistan', team2: 'Kolumbien', city: 'Mexico City', cet: '04:00', type: 'Gruppenspiel' },
  { id: 25, date: '2026-06-18', group: 'A', team1: 'Play-off D', team2: 'Südafrika', city: 'Atlanta', cet: '18:00', type: 'Gruppenspiel' },
  { id: 26, date: '2026-06-18', group: 'B', team1: 'Schweiz', team2: 'Play-off A', city: 'Los Angeles', cet: '21:00', type: 'Gruppenspiel' },
  { id: 27, date: '2026-06-19', group: 'B', team1: 'Kanada', team2: 'Katar', city: 'Vancouver', cet: '00:00', type: 'Gruppenspiel' },
  { id: 28, date: '2026-06-19', group: 'A', team1: 'Mexiko', team2: 'Republik Korea', city: 'Guadalajara', cet: '03:00', type: 'Gruppenspiel' },
  { id: 29, date: '2026-06-19', group: 'C', team1: 'Brasilien', team2: 'Haiti', city: 'Philadelphia', cet: '03:00', type: 'Gruppenspiel' },
  { id: 30, date: '2026-06-19', group: 'C', team1: 'Schottland', team2: 'Marokko', city: 'Boston', cet: '00:00', type: 'Gruppenspiel' },
  { id: 31, date: '2026-06-19', group: 'D', team1: 'Play-off C', team2: 'Paraguay', city: 'San Francisco', cet: '06:00', type: 'Gruppenspiel' },
  { id: 32, date: '2026-06-19', group: 'D', team1: 'USA', team2: 'Australien', city: 'Seattle', cet: '21:00', type: 'Gruppenspiel' },
  { id: 33, date: '2026-06-20', group: 'E', team1: 'Deutschland', team2: 'Elfenbeinküste', city: 'Toronto', cet: '22:00', type: 'Gruppenspiel' },
  { id: 34, date: '2026-06-20', group: 'E', team1: 'Ecuador', team2: 'Curaçao', city: 'Kansas City', cet: '02:00', type: 'Gruppenspiel' },
  { id: 35, date: '2026-06-20', group: 'F', team1: 'Niederlande', team2: 'Play-off B', city: 'Houston', cet: '19:00', type: 'Gruppenspiel' },
  { id: 36, date: '2026-06-20', group: 'F', team1: 'Tunesien', team2: 'Japan', city: 'Monterrey', cet: '06:00', type: 'Gruppenspiel' },
  { id: 37, date: '2026-06-21', group: 'H', team1: 'Uruguay', team2: 'Kap Verde', city: 'Miami', cet: '00:00', type: 'Gruppenspiel' },
  { id: 38, date: '2026-06-21', group: 'H', team1: 'Spanien', team2: 'Saudi-Arabien', city: 'Atlanta', cet: '18:00', type: 'Gruppenspiel' },
  { id: 39, date: '2026-06-21', group: 'G', team1: 'Belgien', team2: 'Iran', city: 'Los Angeles', cet: '21:00', type: 'Gruppenspiel' },
  { id: 40, date: '2026-06-21', group: 'G', team1: 'Neuseeland', team2: 'Ägypten', city: 'Vancouver', cet: '03:00', type: 'Gruppenspiel' },
  { id: 41, date: '2026-06-22', group: 'I', team1: 'Norwegen', team2: 'Senegal', city: 'New York', cet: '02:00', type: 'Gruppenspiel' },
  { id: 42, date: '2026-06-22', group: 'I', team1: 'Frankreich', team2: 'FIFA Play-off 2', city: 'Philadelphia', cet: '23:00', type: 'Gruppenspiel' },
  { id: 43, date: '2026-06-22', group: 'J', team1: 'Argentinien', team2: 'Österreich', city: 'Dallas', cet: '19:00', type: 'Gruppenspiel' },
  { id: 44, date: '2026-06-22', group: 'J', team1: 'Jordanien', team2: 'Algerien', city: 'San Francisco', cet: '05:00', type: 'Gruppenspiel' },
  { id: 45, date: '2026-06-23', group: 'L', team1: 'England', team2: 'Ghana', city: 'Boston', cet: '22:00', type: 'Gruppenspiel' },
  { id: 46, date: '2026-06-23', group: 'L', team1: 'Panama', team2: 'Kroatien', city: 'Toronto', cet: '01:00', type: 'Gruppenspiel' },
  { id: 47, date: '2026-06-23', group: 'K', team1: 'Portugal', team2: 'Usbekistan', city: 'Houston', cet: '19:00', type: 'Gruppenspiel' },
  { id: 48, date: '2026-06-24', group: 'K', team1: 'Kolumbien', team2: 'FIFA Play-off 1', city: 'Guadalajara', cet: '04:00', type: 'Gruppenspiel' },
  { id: 49, date: '2026-06-24', group: 'C', team1: 'Schottland', team2: 'Brasilien', city: 'Miami', cet: '00:00', type: 'Gruppenspiel' },
  { id: 50, date: '2026-06-24', group: 'C', team1: 'Marokko', team2: 'Haiti', city: 'Atlanta', cet: '00:00', type: 'Gruppenspiel' },
  { id: 51, date: '2026-06-24', group: 'B', team1: 'Schweiz', team2: 'Kanada', city: 'Vancouver', cet: '21:00', type: 'Gruppenspiel' },
  { id: 52, date: '2026-06-24', group: 'B', team1: 'Play-off A', team2: 'Katar', city: 'Seattle', cet: '21:00', type: 'Gruppenspiel' },
  { id: 53, date: '2026-06-25', group: 'A', team1: 'Play-off D', team2: 'Mexiko', city: 'Mexico City', cet: '03:00', type: 'Gruppenspiel' },
  { id: 54, date: '2026-06-25', group: 'A', team1: 'Südafrika', team2: 'Republik Korea', city: 'Monterrey', cet: '03:00', type: 'Gruppenspiel' },
  { id: 55, date: '2026-06-25', group: 'E', team1: 'Curaçao', team2: 'Elfenbeinküste', city: 'Philadelphia', cet: '22:00', type: 'Gruppenspiel' },
  { id: 56, date: '2026-06-25', group: 'E', team1: 'Ecuador', team2: 'Deutschland', city: 'New York', cet: '22:00', type: 'Gruppenspiel' },
  { id: 57, date: '2026-06-26', group: 'F', team1: 'Japan', team2: 'Play-off B', city: 'Dallas', cet: '01:00', type: 'Gruppenspiel' },
  { id: 58, date: '2026-06-26', group: 'F', team1: 'Tunesien', team2: 'Niederlande', city: 'Kansas City', cet: '01:00', type: 'Gruppenspiel' },
  { id: 59, date: '2026-06-26', group: 'D', team1: 'Play-off C', team2: 'USA', city: 'Los Angeles', cet: '04:00', type: 'Gruppenspiel' },
  { id: 60, date: '2026-06-26', group: 'D', team1: 'Paraguay', team2: 'Australien', city: 'San Francisco', cet: '04:00', type: 'Gruppenspiel' },
  { id: 61, date: '2026-06-26', group: 'I', team1: 'Norwegen', team2: 'Frankreich', city: 'Boston', cet: '21:00', type: 'Gruppenspiel' },
  { id: 62, date: '2026-06-26', group: 'I', team1: 'Senegal', team2: 'FIFA Play-off 2', city: 'Toronto', cet: '21:00', type: 'Gruppenspiel' },
  { id: 63, date: '2026-06-27', group: 'G', team1: 'Ägypten', team2: 'Iran', city: 'Seattle', cet: '05:00', type: 'Gruppenspiel' },
  { id: 64, date: '2026-06-27', group: 'G', team1: 'Neuseeland', team2: 'Belgien', city: 'Vancouver', cet: '05:00', type: 'Gruppenspiel' },
  { id: 65, date: '2026-06-27', group: 'H', team1: 'Kap Verde', team2: 'Saudi-Arabien', city: 'Houston', cet: '02:00', type: 'Gruppenspiel' },
  { id: 66, date: '2026-06-27', group: 'H', team1: 'Uruguay', team2: 'Spanien', city: 'Guadalajara', cet: '02:00', type: 'Gruppenspiel' },
  { id: 67, date: '2026-06-27', group: 'L', team1: 'Panama', team2: 'England', city: 'New York', cet: '23:00', type: 'Gruppenspiel' },
  { id: 68, date: '2026-06-27', group: 'L', team1: 'Kroatien', team2: 'Ghana', city: 'Philadelphia', cet: '23:00', type: 'Gruppenspiel' },
  { id: 69, date: '2026-06-28', group: 'J', team1: 'Algerien', team2: 'Österreich', city: 'Kansas City', cet: '04:00', type: 'Gruppenspiel' },
  { id: 70, date: '2026-06-28', group: 'J', team1: 'Jordanien', team2: 'Argentinien', city: 'Dallas', cet: '04:00', type: 'Gruppenspiel' },
  { id: 71, date: '2026-06-28', group: 'K', team1: 'Kolumbien', team2: 'Portugal', city: 'Miami', cet: '01:30', type: 'Gruppenspiel' },
  { id: 72, date: '2026-06-28', group: 'K', team1: 'FIFA Play-off 1', team2: 'Usbekistan', city: 'Atlanta', cet: '01:30', type: 'Gruppenspiel' },
  // K.O.-RUNDE
  { id: 73, date: '2026-06-28', group: null, team1: '2. Gruppe A', team2: '2. Gruppe B', city: 'Los Angeles', cet: '21:00', type: '32tel-Finale' },
  { id: 74, date: '2026-06-29', group: null, team1: '1. Gruppe E', team2: '3. A/B/C/D/F', city: 'Boston', cet: '22:30', type: '32tel-Finale' },
  { id: 75, date: '2026-06-30', group: null, team1: '1. Gruppe F', team2: '2. Gruppe C', city: 'Monterrey', cet: '01:00', type: '32tel-Finale' },
  { id: 76, date: '2026-06-29', group: null, team1: '1. Gruppe C', team2: '2. Gruppe F', city: 'Houston', cet: '19:00', type: '32tel-Finale' },
  { id: 77, date: '2026-06-30', group: null, team1: '1. Gruppe I', team2: '3. C/D/F/G/H', city: 'New York', cet: '23:00', type: '32tel-Finale' },
  { id: 78, date: '2026-06-30', group: null, team1: '2. Gruppe E', team2: '2. Gruppe I', city: 'Dallas', cet: '19:00', type: '32tel-Finale' },
  { id: 79, date: '2026-07-01', group: null, team1: '1. Gruppe A', team2: '3. C/E/F/H/I', city: 'Mexico City', cet: '01:00', type: '32tel-Finale' },
  { id: 80, date: '2026-07-01', group: null, team1: '1. Gruppe L', team2: '3. E/H/I/J/K', city: 'Atlanta', cet: '18:00', type: '32tel-Finale' },
  { id: 81, date: '2026-07-01', group: null, team1: '1. Gruppe D', team2: '3. B/E/F/I/J', city: 'San Francisco', cet: '23:00', type: '32tel-Finale' },
  { id: 82, date: '2026-07-01', group: null, team1: '1. Gruppe G', team2: '3. A/E/H/I/J', city: 'Seattle', cet: '20:00', type: '32tel-Finale' },
  { id: 83, date: '2026-07-02', group: null, team1: '2. Gruppe K', team2: '2. Gruppe L', city: 'Toronto', cet: '01:00', type: '32tel-Finale' },
  { id: 84, date: '2026-07-02', group: null, team1: '1. Gruppe H', team2: '2. Gruppe J', city: 'Los Angeles', cet: '19:00', type: '32tel-Finale' },
  { id: 85, date: '2026-07-03', group: null, team1: '1. Gruppe B', team2: '3. E/F/G/I/J', city: 'Vancouver', cet: '03:00', type: '32tel-Finale' },
  { id: 86, date: '2026-07-03', group: null, team1: '1. Gruppe J', team2: '2. Gruppe H', city: 'Miami', cet: '00:00', type: '32tel-Finale' },
  { id: 87, date: '2026-07-04', group: null, team1: '1. Gruppe K', team2: '3. D/E/I/J/L', city: 'Kansas City', cet: '02:30', type: '32tel-Finale' },
  { id: 88, date: '2026-07-03', group: null, team1: '2. Gruppe D', team2: '2. Gruppe G', city: 'Dallas', cet: '20:00', type: '32tel-Finale' },
  { id: 89, date: '2026-07-04', group: null, team1: 'Sieger 74', team2: 'Sieger 77', city: 'Philadelphia', cet: '23:00', type: 'Achtelfinale' },
  { id: 90, date: '2026-07-04', group: null, team1: 'Sieger 73', team2: 'Sieger 75', city: 'Houston', cet: '19:00', type: 'Achtelfinale' },
  { id: 91, date: '2026-07-05', group: null, team1: 'Sieger 76', team2: 'Sieger 78', city: 'New York', cet: '22:00', type: 'Achtelfinale' },
  { id: 92, date: '2026-07-06', group: null, team1: 'Sieger 79', team2: 'Sieger 80', city: 'Mexico City', cet: '00:00', type: 'Achtelfinale' },
  { id: 93, date: '2026-07-06', group: null, team1: 'Sieger 83', team2: 'Sieger 84', city: 'Dallas', cet: '21:00', type: 'Achtelfinale' },
  { id: 94, date: '2026-07-06', group: null, team1: 'Sieger 81', team2: 'Sieger 82', city: 'Seattle', cet: '00:00', type: 'Achtelfinale' },
  { id: 95, date: '2026-07-07', group: null, team1: 'Sieger 86', team2: 'Sieger 88', city: 'Atlanta', cet: '18:00', type: 'Achtelfinale' },
  { id: 96, date: '2026-07-07', group: null, team1: 'Sieger 85', team2: 'Sieger 87', city: 'Vancouver', cet: '20:00', type: 'Achtelfinale' },
  { id: 97, date: '2026-07-09', group: null, team1: 'Sieger 89', team2: 'Sieger 90', city: 'Boston', cet: '22:00', type: 'Viertelfinale' },
  { id: 98, date: '2026-07-10', group: null, team1: 'Sieger 93', team2: 'Sieger 94', city: 'Los Angeles', cet: '19:00', type: 'Viertelfinale' },
  { id: 99, date: '2026-07-11', group: null, team1: 'Sieger 91', team2: 'Sieger 92', city: 'Miami', cet: '23:00', type: 'Viertelfinale' },
  { id: 100, date: '2026-07-12', group: null, team1: 'Sieger 95', team2: 'Sieger 96', city: 'Kansas City', cet: '02:00', type: 'Viertelfinale' },
  { id: 101, date: '2026-07-14', group: null, team1: 'Sieger 97', team2: 'Sieger 98', city: 'Dallas', cet: '21:00', type: 'Halbfinale' },
  { id: 102, date: '2026-07-15', group: null, team1: 'Sieger 99', team2: 'Sieger 100', city: 'Atlanta', cet: '21:00', type: 'Halbfinale' },
  { id: 103, date: '2026-07-18', group: null, team1: 'Verlierer 101', team2: 'Verlierer 102', city: 'Miami', cet: '23:00', type: 'Spiel um Platz 3' },
  { id: 104, date: '2026-07-19', group: null, team1: 'Sieger 101', team2: 'Sieger 102', city: 'New York', cet: '21:00', type: 'Finale' }
].map(m => ({ ...m, localTime: calcLocalTime(m.cet, m.city) }));

// ==================== HELPER FUNCTIONS ====================
const getTeamInfo = (teamName) => {
  for (const group of GROUPS) {
    const team = TEAMS[group].find(t => t.name === teamName);
    if (team) return { ...team, titles: WM_TITLES[teamName] || 0 };
  }
  return { name: teamName, flag: '🏳️', strength: 65, titles: WM_TITLES[teamName] || 0 };
};

// Generate stars for WM titles
const getStars = (count) => {
  if (count === 0) return null;
  return '⭐'.repeat(count);
};

const getAIPrediction = (team1, team2) => {
  const t1 = getTeamInfo(team1);
  const t2 = getTeamInfo(team2);
  const diff = t1.strength - t2.strength;
  if (diff >= 15) return { home: 3, away: 0 };
  if (diff >= 10) return { home: 2, away: 0 };
  if (diff >= 5) return { home: 2, away: 1 };
  if (diff >= -5) return { home: 1, away: 1 };
  if (diff >= -10) return { home: 1, away: 2 };
  if (diff >= -15) return { home: 0, away: 2 };
  return { home: 0, away: 3 };
};

const getRandomPrediction = () => ({ 
  home: Math.floor(Math.random() * 5), 
  away: Math.floor(Math.random() * 5) 
});

const isFreeTVMatch = (match) => {
  if (match.id === 1 || match.id === 104) return true;
  const dachTeams = ['Deutschland', 'Österreich', 'Schweiz'];
  return dachTeams.includes(match.team1) || dachTeams.includes(match.team2);
};

// Check if match is locked (kickoff time reached)
const isMatchLocked = (match) => {
  // K.O. phase always locked for now
  if (match.type !== 'Gruppenspiel') return true;
  
  // Parse match datetime in CET
  const [year, month, day] = match.date.split('-').map(Number);
  const [hour, minute] = match.cet.split(':').map(Number);
  
  // Create match time in CET (UTC+1 in winter, UTC+2 in summer - June is summer)
  const matchTime = new Date(Date.UTC(year, month - 1, day, hour - 2, minute)); // CET = UTC+2 in June
  const now = new Date();
  
  return now >= matchTime;
};

const calculateGroupTable = (group, results) => {
  const teams = TEAMS[group];
  const table = {};
  teams.forEach(t => { 
    table[t.name] = { name: t.name, flag: t.flag, strength: t.strength, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }; 
  });
  
  MATCHES.filter(m => m.group === group && m.type === 'Gruppenspiel').forEach(m => {
    const r = results[m.id];
    if (!r || r.score1 === null || r.score1 === undefined) return;
    if (!table[m.team1] || !table[m.team2]) return;
    table[m.team1].played++; table[m.team1].gf += r.score1; table[m.team1].ga += r.score2;
    table[m.team2].played++; table[m.team2].gf += r.score2; table[m.team2].ga += r.score1;
    if (r.score1 > r.score2) { table[m.team1].won++; table[m.team1].points += 3; table[m.team2].lost++; }
    else if (r.score1 < r.score2) { table[m.team2].won++; table[m.team2].points += 3; table[m.team1].lost++; }
    else { table[m.team1].drawn++; table[m.team2].drawn++; table[m.team1].points++; table[m.team2].points++; }
  });
  
  Object.values(table).forEach(t => { t.gd = t.gf - t.ga; });
  return Object.values(table).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
};

const getAllThirdPlaced = (groupTables) => {
  const thirds = [];
  Object.entries(groupTables).forEach(([g, t]) => {
    if (t.length >= 3) thirds.push({ ...t[2], group: g });
  });
  return thirds.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
};

const formatDateGerman = (dateStr, lang = 'de') => {
  const date = new Date(dateStr);
  const daysDE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const daysEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsDE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const monthsEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  if (lang === 'en') {
    return `${daysEN[date.getDay()]}, ${monthsEN[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return `${daysDE[date.getDay()]}, ${date.getDate()}. ${monthsDE[date.getMonth()]} ${date.getFullYear()}`;
};

const getGroupColor = (group) => {
  const colors = { 'A': '#10b981', 'B': '#3b82f6', 'C': '#8b5cf6', 'D': '#f59e0b', 'E': '#ef4444', 'F': '#06b6d4', 'G': '#ec4899', 'H': '#84cc16', 'I': '#f97316', 'J': '#14b8a6', 'K': '#a855f7', 'L': '#6366f1' };
  return colors[group] || '#64748b';
};

// ==================== MAIN COMPONENT ====================
export default function SpieleSection({ user, predictions, savePrediction, matchResults, nordvpnUrl, language = 'de' }) {
  // Use language for translations
  const tt = (key) => t(key, language);
  const tTeam = (name) => translateTeam(name, language);
  const [activeSubTab, setActiveSubTab] = useState('alle');
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [hoveredStadium, setHoveredStadium] = useState(null);
  const [localPredictions, setLocalPredictions] = useState({});
  const [expandedH2H, setExpandedH2H] = useState({});

  const NORDVPN_AFFILIATE_URL = nordvpnUrl || 'https://www.kqzyfj.com/click-101616485-13756265';

  // Merge props predictions with local state
  const allPredictions = useMemo(() => ({ ...predictions, ...localPredictions }), [predictions, localPredictions]);

  const groupTables = useMemo(() => {
    const tables = {};
    GROUPS.forEach(g => { tables[g] = calculateGroupTable(g, matchResults || {}); });
    return tables;
  }, [matchResults]);

  const allThirdPlaced = useMemo(() => getAllThirdPlaced(groupTables), [groupTables]);
  const tippCount = Object.values(allPredictions || {}).filter(p => p && p.score1 !== null && p.score1 !== undefined).length;

  const matchesByDate = useMemo(() => {
    const grouped = {};
    MATCHES.filter(m => m.type === 'Gruppenspiel').forEach(m => {
      if (!grouped[m.date]) grouped[m.date] = [];
      grouped[m.date].push(m);
    });
    // Sort matches within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.cet.localeCompare(b.cet));
    });
    return grouped;
  }, []);

  // Handle prediction - FIXED to work properly
  const handlePrediction = async (matchId, score1, score2) => {
    const match = MATCHES.find(m => m.id === matchId);
    if (isMatchLocked(match)) return;
    
    // Update local state immediately for responsiveness
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: { score1, score2 }
    }));
    
    // Save to database if savePrediction function exists
    if (savePrediction) {
      try {
        await savePrediction(matchId, score1, score2);
      } catch (error) {
        console.error('Error saving prediction:', error);
      }
    }
  };

  // Apply random prediction - FIXED
  const applyRandomPrediction = (matchId) => {
    const match = MATCHES.find(m => m.id === matchId);
    if (isMatchLocked(match)) return;
    const pred = getRandomPrediction();
    handlePrediction(matchId, pred.home, pred.away);
  };

  // Apply AI prediction - FIXED
  const applyAIPrediction = (matchId) => {
    const match = MATCHES.find(m => m.id === matchId);
    if (isMatchLocked(match)) return;
    const pred = getAIPrediction(match.team1, match.team2);
    handlePrediction(matchId, pred.home, pred.away);
  };

  // Apply bulk predictions (all open matches)
  const applyBulkPrediction = (type) => {
    // Get all matches that are not locked and don't have predictions yet
    const openMatches = MATCHES.filter(match => {
      if (isMatchLocked(match)) return false;
      const existing = allPredictions?.[match.id];
      // Only fill if no prediction exists
      return !existing || existing.score1 === null || existing.score1 === undefined;
    });

    if (openMatches.length === 0) {
      alert(t('allMatchesHavePredictions', language));
      return;
    }

    // Confirm action
    const confirmMsg = `${openMatches.length} ${t('fillConfirm', language)} ${type === 'ai' ? t('aiPredictions', language) : t('randomPredictions', language)}`;
    
    if (!window.confirm(confirmMsg)) return;

    // Apply predictions
    openMatches.forEach(match => {
      const pred = type === 'ai' 
        ? getAIPrediction(match.team1, match.team2) 
        : getRandomPrediction();
      handlePrediction(match.id, pred.home, pred.away);
    });
  };

  // Reset all predictions (only unlocked matches)
  const resetAllPredictions = () => {
    // Get all matches that are not locked and have predictions
    const matchesWithPredictions = MATCHES.filter(match => {
      if (isMatchLocked(match)) return false;
      const existing = allPredictions?.[match.id];
      return existing && (existing.score1 !== null && existing.score1 !== undefined);
    });

    if (matchesWithPredictions.length === 0) {
      alert(t('noPredictionsToReset', language));
      return;
    }

    // Confirm action
    const confirmMsg = `${matchesWithPredictions.length} ${t('deleteConfirm', language)}`;
    
    if (!window.confirm(confirmMsg)) return;

    // Reset predictions
    matchesWithPredictions.forEach(match => {
      handlePrediction(match.id, null, null);
    });
  };

  // ==================== MATCH CARD ====================
  const MatchCard = ({ match, showDate = true, compact = false }) => {
    const pred = allPredictions?.[match.id] || {};
    const locked = isMatchLocked(match);
    const stadium = STADIUMS[match.city];
    const t1 = getTeamInfo(match.team1);
    const t2 = getTeamInfo(match.team2);
    const hasPrediction = pred.score1 !== null && pred.score1 !== undefined;

    return (
      <div style={{ 
        background: '#1e293b', 
        borderRadius: 10, 
        padding: compact ? 12 : 14, 
        border: hasPrediction ? '2px solid #10b981' : '1px solid #334155',
        position: 'relative',
        opacity: locked ? 0.7 : 1
      }}>
        {/* Locked Badge */}
        {locked && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: 'white' }}>
            🔒 {tt('lockedShort')}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {showDate && <span style={{ fontSize: 10, color: '#94a3b8' }}>{match.date.split('-').reverse().join('.')}</span>}
            {match.group && (
              <span style={{ background: getGroupColor(match.group), color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 'bold' }}>
                {language === 'en' ? 'Gr.' : 'Gr.'} {match.group}
              </span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>{match.cet} {t('cetTime', language)}</div>
            <div style={{ fontSize: 9, color: '#64748b' }}>● {match.localTime} {tt('localTime')}</div>
          </div>
        </div>

        {/* Teams & Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 10, color: 'white' }}>{tTeam(match.team1)}</span>
              {t1.titles > 0 && <div style={{ fontSize: 7, lineHeight: 1, marginTop: 2 }}>{getStars(t1.titles)}</div>}
            </div>
            <span style={{ fontSize: 18 }}>{t1.flag}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <input
              type="number" min="0" max="15"
              value={pred.score1 ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? null : parseInt(e.target.value);
                handlePrediction(match.id, val, pred.score2 ?? null);
              }}
              disabled={locked || !user}
              style={{ width: 28, height: 28, textAlign: 'center', fontSize: 13, fontWeight: 'bold', background: '#334155', border: '1px solid #475569', borderRadius: 4, color: 'white', outline: 'none' }}
            />
            <span style={{ fontSize: 12, color: '#64748b' }}>:</span>
            <input
              type="number" min="0" max="15"
              value={pred.score2 ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? null : parseInt(e.target.value);
                handlePrediction(match.id, pred.score1 ?? null, val);
              }}
              disabled={locked || !user}
              style={{ width: 28, height: 28, textAlign: 'center', fontSize: 13, fontWeight: 'bold', background: '#334155', border: '1px solid #475569', borderRadius: 4, color: 'white', outline: 'none' }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 18 }}>{t2.flag}</span>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: 10, color: 'white' }}>{tTeam(match.team2)}</span>
              {t2.titles > 0 && <div style={{ fontSize: 7, lineHeight: 1, marginTop: 2 }}>{getStars(t2.titles)}</div>}
            </div>
          </div>
        </div>

        {/* Zufall & AI Buttons - FIXED */}
        {!locked && user && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
            <button
              onClick={() => applyRandomPrediction(match.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#10b981', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: 'white', fontSize: 9, fontWeight: 'bold' }}
            >🎲 {tt('random')}</button>
            <button
              onClick={() => applyAIPrediction(match.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#10b981', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: 'white', fontSize: 9, fontWeight: 'bold' }}
            >🤖 {tt('ai')}</button>
          </div>
        )}

        {/* H2H History - Compact & Expandable */}
        {(() => {
          const h2hMatches = getH2HMatches(match.team1, match.team2);
          if (h2hMatches.length === 0) return null;

          const summary = getH2HSummary(h2hMatches);
          const isExpanded = expandedH2H[match.id];

          return (
            <div style={{
              background: '#0f172a',
              borderRadius: 6,
              marginBottom: 8,
              border: '1px solid #1e3a5f',
              overflow: 'hidden'
            }}>
              {/* H2H Header - Always visible */}
              <div
                onClick={() => setExpandedH2H(prev => ({ ...prev, [match.id]: !prev[match.id] }))}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  background: isExpanded ? '#1e3a5f' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>📊 H2H</span>
                  <div style={{ display: 'flex', gap: 3, fontSize: 9 }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{summary.wins}</span>
                    <span style={{ color: '#64748b' }}>-</span>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{summary.draws}</span>
                    <span style={{ color: '#64748b' }}>-</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{summary.losses}</span>
                  </div>
                  <span style={{ fontSize: 8, color: '#475569' }}>({summary.total} {language === 'en' ? 'games' : 'Spiele'})</span>
                </div>
                <span style={{ fontSize: 10, color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>

              {/* H2H Details - Expandable */}
              {isExpanded && (
                <div style={{ padding: '0 10px 8px 10px' }}>
                  {h2hMatches.map((m, idx) => {
                    const [home, away] = m.result.split(':').map(s => parseInt(s));
                    const isWin = home > away;
                    const isDraw = home === away;
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderTop: idx > 0 ? '1px solid #1e293b' : 'none',
                        fontSize: 9
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: isWin ? '#10b981' : isDraw ? '#fbbf24' : '#ef4444'
                          }}/>
                          <span style={{ color: '#64748b', minWidth: 70 }}>{m.date.split('-').reverse().join('.')}</span>
                          <span style={{
                            color: isWin ? '#10b981' : isDraw ? '#fbbf24' : '#ef4444',
                            fontWeight: 'bold',
                            minWidth: 28
                          }}>{m.result}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#475569', fontSize: 8 }}>{m.comp}</span>
                          <span style={{ color: '#334155', fontSize: 8 }}>•</span>
                          <span style={{ color: '#475569', fontSize: 8, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.venue}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Stadium with Tooltip */}
        <div 
          style={{ position: 'relative', textAlign: 'center', marginBottom: 8 }}
          onMouseEnter={() => setHoveredStadium(match.id)}
          onMouseLeave={() => setHoveredStadium(null)}
        >
          <a href={language === 'en' ? stadium?.wiki_en : stadium?.wiki_de} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#64748b', textDecoration: 'none' }}>
            📍 {stadium?.name} • {match.city} ↗
          </a>

          {hoveredStadium === match.id && stadium && (
            <div style={{ 
              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', 
              background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 12, marginBottom: 6,
              minWidth: 200, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'left'
            }}>
              <div style={{ fontSize: 11, fontWeight: 'bold', color: 'white', marginBottom: 6 }}>🏟️ {stadium.name}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>📍 {match.city}</div>
              <div style={{ fontSize: 10, color: '#fbbf24', marginBottom: 8 }}>👥 {tt('capacity')}: {stadium.capacity.toLocaleString(language === 'en' ? 'en-US' : 'de-DE')}</div>
              <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4 }}>{t('homeTeams', language)}</div>
              {stadium.homeTeams?.map((ht, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>{ht.team}</span>
                  <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: LEAGUE_COLORS[ht.league] || '#334155', color: 'white', fontWeight: 'bold' }}>{ht.league}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NordVPN */}
        <a href={NORDVPN_AFFILIATE_URL} target="_blank" rel="noopener noreferrer" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'linear-gradient(135deg, #4158D0, #0070C9)', borderRadius: 6, padding: '6px 10px', textDecoration: 'none', color: 'white', fontSize: 9 }}>
          🌍 {tt('abroad')} <strong>NordVPN -68%</strong>
        </a>
      </div>
    );
  };

  // ==================== GROUP TABLE COMPONENT ====================
  const GroupTable = ({ group }) => (
    <div style={{ background: '#1e293b', borderRadius: 10, overflow: 'hidden', border: '1px solid #334155' }}>
      <div style={{ background: getGroupColor(group), padding: '10px 12px', fontWeight: 'bold', fontSize: 13, color: 'white' }}>
        {tt('group')} {group}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#64748b' }}>
            <th style={{ padding: 6, textAlign: 'left' }}>#</th>
            <th style={{ padding: 6, textAlign: 'left' }}>{tt('team')}</th>
            <th style={{ padding: 6, textAlign: 'center' }}>{tt('played')}</th>
            <th style={{ padding: 6, textAlign: 'center' }}>{tt('won')}</th>
            <th style={{ padding: 6, textAlign: 'center' }}>{tt('drawn')}</th>
            <th style={{ padding: 6, textAlign: 'center' }}>{tt('lost')}</th>
            <th style={{ padding: 6, textAlign: 'center' }}>{tt('goalDifference')}</th>
            <th style={{ padding: 6, textAlign: 'center' }}>{tt('pointsShort')}</th>
          </tr>
        </thead>
        <tbody>
          {groupTables[group].map((team, idx) => {
            const q = idx < 2;
            const third = idx === 2;
            return (
              <tr key={team.name} style={{ borderLeft: `3px solid ${q ? '#10b981' : third ? '#fbbf24' : '#ef4444'}`, background: q ? 'rgba(16,185,129,0.1)' : third ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                <td style={{ padding: 6, fontWeight: 'bold', color: q ? '#10b981' : third ? '#fbbf24' : '#ef4444' }}>{idx + 1}</td>
                <td style={{ padding: 6, color: 'white', whiteSpace: 'nowrap' }}>
                  {team.flag} {tTeam(team.name)}
                  {WM_TITLES[team.name] > 0 && <span style={{ marginLeft: 4, fontSize: 8 }}>{getStars(WM_TITLES[team.name])}</span>}
                </td>
                <td style={{ padding: 6, textAlign: 'center', color: '#94a3b8' }}>{team.played}</td>
                <td style={{ padding: 6, textAlign: 'center', color: '#10b981' }}>{team.won}</td>
                <td style={{ padding: 6, textAlign: 'center', color: '#fbbf24' }}>{team.drawn}</td>
                <td style={{ padding: 6, textAlign: 'center', color: '#ef4444' }}>{team.lost}</td>
                <td style={{ padding: 6, textAlign: 'center', color: team.gd > 0 ? '#10b981' : team.gd < 0 ? '#ef4444' : '#94a3b8' }}>{team.gd}</td>
                <td style={{ padding: 6, textAlign: 'center', fontWeight: 'bold', color: 'white' }}>{team.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ padding: 6, fontSize: 8, color: '#64748b', borderTop: '1px solid #334155' }}>
        {t('groupLegend', language)}
      </div>
    </div>
  );

  // ==================== RENDER ====================
  return (
    <div>
      {/* Progress */}
      {user && (
        <div style={{ background: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{tt('yourPredictions')}</span>
            <span style={{ color: '#10b981', fontSize: 11, fontWeight: 'bold' }}>{tippCount}/104</span>
          </div>
          <div style={{ background: '#0f172a', borderRadius: 4, height: 8 }}>
            <div style={{ background: 'linear-gradient(90deg, #10b981, #22c55e)', height: '100%', borderRadius: 4, width: `${(tippCount/104)*100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
        {[
          { id: 'alle', label: t('allMatchesTab', language) },
          { id: 'gruppen', label: t('groupsTab', language) },
          { id: 'dritte', label: t('thirdPlacedTab', language) },
          { id: 'ko', label: t('koTab', language) }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
            style={{ padding: '8px 14px', background: activeSubTab === tab.id ? '#10b981' : '#1e293b', border: '1px solid #334155', borderRadius: 8, color: 'white', fontSize: 11, fontWeight: activeSubTab === tab.id ? 'bold' : 'normal', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* BULK PREDICTION BUTTONS */}
      {user && (activeSubTab === 'alle' || activeSubTab === 'gruppen') && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            <strong style={{ color: 'white' }}>⚡ {t('quickFill', language)}</strong> {t('fillAllOpen', language)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => applyBulkPrediction('random')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 'bold', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
            >
              🎲 {t('allRandom', language)}
            </button>
            <button
              onClick={() => applyBulkPrediction('ai')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 'bold', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}
            >
              🤖 {t('allAI', language)}
            </button>
            <button
              onClick={() => resetAllPredictions()}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 'bold', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}
            >
              🗑️ {t('resetAll', language)}
            </button>
          </div>
        </div>
      )}

      {/* Tippspiel Description - not on Drittplatzierte */}
      {activeSubTab !== 'dritte' && (
        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.8 }}>
            <strong style={{ color: '#10b981' }}>⚽ {tt('howItWorks')}</strong> {tt('howItWorksDesc')} 
            <strong style={{ color: 'white' }}> {tt('exactResult')} = {tt('exactResultPoints')}</strong>, 
            <strong style={{ color: 'white' }}> {tt('correctTendency')} = {tt('correctTendencyPoints')}</strong>.
            {tt('useButtons')} <span style={{ background: '#10b981', padding: '2px 6px', borderRadius: 3, fontSize: 9, color: 'white', fontWeight: 'bold', display: 'inline-block', whiteSpace: 'nowrap' }}>🎲 {tt('random')}</span> {tt('or')} 
            <span style={{ background: '#10b981', padding: '2px 6px', borderRadius: 3, fontSize: 9, color: 'white', fontWeight: 'bold', display: 'inline-block', whiteSpace: 'nowrap' }}>🤖 {tt('ai')}</span> {tt('forQuickPredictions')} {tt('predictionsUntilKickoff')}
            {!user && <><br/><strong style={{ color: '#fbbf24' }}>{t('predictionsRequireLogin', language)}</strong></>}
          </div>
        </div>
      )}

      {/* ========== ALLE SPIELE (1 per row for mobile-friendly) ========== */}
      {activeSubTab === 'alle' && (
        <div>
          {Object.entries(matchesByDate).sort((a, b) => a[0].localeCompare(b[0])).map(([date, matches]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ background: 'linear-gradient(90deg, #1e293b, #334155)', padding: '10px 14px', borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>📅</span>
                <span style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>{formatDateGerman(date, language)}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>({matches.length} {tt('matches')})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {matches.map(match => <MatchCard key={match.id} match={match} showDate={false} compact={false} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== GRUPPEN (Table first, then playoff, then matches) ========== */}
      {activeSubTab === 'gruppen' && (
        <div>
          {/* Group Selector */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
            {GROUPS.map(g => (
              <button key={g} onClick={() => setSelectedGroup(g)}
                style={{ padding: '6px 12px', background: selectedGroup === g ? getGroupColor(g) : '#1e293b', border: '1px solid #334155', borderRadius: 4, color: 'white', fontSize: 11, cursor: 'pointer', fontWeight: selectedGroup === g ? 'bold' : 'normal' }}>
                {g}
              </button>
            ))}
          </div>

          {/* Group Table First */}
          <GroupTable group={selectedGroup} />

          {/* Play-off Info directly under table */}
          {TEAMS[selectedGroup].some(t => PLAYOFF_INFO[t.name]) && (
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: 12, marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 'bold', color: '#fbbf24', marginBottom: 6 }}>⚠️ {t('playoffOpen', language)}</div>
              {TEAMS[selectedGroup].filter(t => PLAYOFF_INFO[t.name]).map(t => (
                <div key={t.name} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 'bold' }}>{t.name} ({translatePlayoffType(PLAYOFF_INFO[t.name].type, language)}):</div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                    {PLAYOFF_INFO[t.name].teams.map(team => (
                      <span key={team} style={{ fontSize: 9, background: '#334155', padding: '2px 6px', borderRadius: 3, color: '#94a3b8' }}>{tTeam(team)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Group Matches Title */}
          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#94a3b8', marginTop: 20, marginBottom: 12 }}>
            {t('groupMatches', language)} {selectedGroup}
          </div>

          {/* Matches one by one */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MATCHES.filter(m => m.group === selectedGroup).sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return a.cet.localeCompare(b.cet);
            }).map(match => (
              <MatchCard key={match.id} match={match} compact={false} />
            ))}
          </div>
        </div>
      )}

      {/* ========== DRITTPLATZIERTE ========== */}
      {activeSubTab === 'dritte' && (
        <div style={{ background: '#1e293b', borderRadius: 10, overflow: 'hidden', border: '1px solid #334155' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(16,185,129,0.3))', padding: '14px 16px', fontWeight: 'bold', fontSize: 14, color: 'white' }}>
            {t('thirdPlacedTitle', language)}
          </div>
          <div style={{ padding: '10px 16px', background: 'rgba(59,130,246,0.1)', borderBottom: '1px solid #334155', fontSize: 11, color: '#94a3b8' }} dangerouslySetInnerHTML={{ __html: t('thirdPlacedInfo', language) }} />
          {allThirdPlaced.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
              <div>{t('noResultsYet', language)}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#64748b' }}>
                  <th style={{ padding: 10, textAlign: 'center' }}>{tt('rank')}</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>{language === 'en' ? 'Gr.' : 'Gr.'}</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>{tt('team')}</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>{tt('played')}</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>{tt('goalDifference')}</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>{tt('pointsShort')}</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allThirdPlaced.map((team, idx) => {
                  const q = idx < 8;
                  return (
                    <tr key={team.name} style={{ borderLeft: `3px solid ${q ? '#10b981' : '#ef4444'}`, background: q ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)' }}>
                      <td style={{ padding: 10, textAlign: 'center', fontWeight: 'bold', color: q ? '#10b981' : '#ef4444' }}>{idx + 1}.</td>
                      <td style={{ padding: 10, textAlign: 'center' }}><span style={{ background: getGroupColor(team.group), padding: '3px 8px', borderRadius: 4, color: 'white', fontWeight: 'bold', fontSize: 10 }}>{team.group}</span></td>
                      <td style={{ padding: 10, fontWeight: 'bold', color: 'white' }}>
                        {team.flag} {tTeam(team.name)}
                        {WM_TITLES[team.name] > 0 && <span style={{ marginLeft: 4, fontSize: 8 }}>{getStars(WM_TITLES[team.name])}</span>}
                      </td>
                      <td style={{ padding: 10, textAlign: 'center', color: '#94a3b8' }}>{team.played}</td>
                      <td style={{ padding: 10, textAlign: 'center', color: team.gd > 0 ? '#10b981' : team.gd < 0 ? '#ef4444' : '#94a3b8' }}>{team.gd > 0 ? '+' : ''}{team.gd}</td>
                      <td style={{ padding: 10, textAlign: 'center', fontWeight: 'bold', color: 'white' }}>{team.points}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, background: q ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)', color: q ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          {q ? t('advances', language) : t('advancesOut', language)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========== K.O.-RUNDE ========== */}
      {activeSubTab === 'ko' && (
        <div>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 16, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#ef4444', marginBottom: 4 }}>
              {t('koLockedTitle', language)}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              {t('koLockedDesc', language)}
            </div>
          </div>

          {['32tel-Finale', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Spiel um Platz 3', 'Finale'].map(phase => {
            const phaseMatches = MATCHES.filter(m => m.type === phase);
            if (phaseMatches.length === 0) return null;

            const phaseName = translatePhase(phase, language);

            return (
              <div key={phase} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 10, color: phase === 'Finale' ? '#fbbf24' : '#94a3b8' }}>
                  {phase === 'Finale' ? '🏆' : '🎯'} {phaseName} ({phaseMatches.length} {tt('matches')})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {phaseMatches.map(match => <MatchCard key={match.id} match={match} compact={false} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
