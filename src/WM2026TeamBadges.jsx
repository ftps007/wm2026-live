// =====================================================
// WM 2026 TEAM BADGES - React Component
// Supabase-Integration für wm26.live
// Nutzt zentrale translations.js via useLanguage()
// =====================================================

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useLanguage } from './LanguageContext';

// Current clubs for active players (2025)
const CURRENT_CLUBS = {
  // Germany
  'Jamal Musiala': 'FC Bayern München',
  'Florian Wirtz': 'Bayer 04 Leverkusen',
  'Kai Havertz': 'FC Arsenal',
  'Leroy Sané': 'FC Bayern München',
  'Serge Gnabry': 'FC Bayern München',
  'Niclas Füllkrug': 'West Ham United',
  'Thomas Müller': 'FC Bayern München',
  'Joshua Kimmich': 'FC Bayern München',
  'Antonio Rüdiger': 'Real Madrid',
  'Manuel Neuer': 'FC Bayern München',
  // Argentina
  'Lionel Messi': 'Inter Miami CF',
  'Julián Álvarez': 'Atlético Madrid',
  'Lautaro Martínez': 'Inter Mailand',
  'Enzo Fernández': 'FC Chelsea',
  'Rodrigo De Paul': 'Atlético Madrid',
  // Brazil
  'Vinícius Júnior': 'Real Madrid',
  'Rodrygo': 'Real Madrid',
  'Raphinha': 'FC Barcelona',
  'Richarlison': 'Tottenham Hotspur',
  'Endrick': 'Real Madrid',
  // France
  'Kylian Mbappé': 'Real Madrid',
  'Antoine Griezmann': 'Atlético Madrid',
  'Ousmane Dembélé': 'Paris Saint-Germain',
  'Marcus Thuram': 'Inter Mailand',
  'Randal Kolo Muani': 'Paris Saint-Germain',
  // England
  'Harry Kane': 'FC Bayern München',
  'Jude Bellingham': 'Real Madrid',
  'Bukayo Saka': 'FC Arsenal',
  'Phil Foden': 'Manchester City',
  'Cole Palmer': 'FC Chelsea',
  // Spain
  'Lamine Yamal': 'FC Barcelona',
  'Pedri': 'FC Barcelona',
  'Gavi': 'FC Barcelona',
  'Rodri': 'Manchester City',
  'Nico Williams': 'Athletic Bilbao',
  // Portugal
  'Cristiano Ronaldo': 'Al-Nassr FC',
  'Rafael Leão': 'AC Mailand',
  'Bruno Fernandes': 'Manchester United',
  'Bernardo Silva': 'Manchester City',
  'João Félix': 'FC Chelsea',
  // Netherlands
  'Cody Gakpo': 'FC Liverpool',
  'Xavi Simons': 'RB Leipzig',
  'Memphis Depay': 'Corinthians',
  // Belgium
  'Kevin De Bruyne': 'Manchester City',
  'Romelu Lukaku': 'SSC Napoli',
  'Jérémy Doku': 'Manchester City',
  // Poland
  'Robert Lewandowski': 'FC Barcelona',
  'Piotr Zieliński': 'Inter Mailand',
  // Croatia
  'Luka Modrić': 'Real Madrid',
  // Italy
  'Federico Chiesa': 'FC Liverpool',
  // Uruguay
  'Darwin Núñez': 'FC Liverpool',
  'Federico Valverde': 'Real Madrid',
  // USA
  'Christian Pulisic': 'AC Mailand',
  'Weston McKennie': 'Juventus Turin',
  // Mexico
  'Hirving Lozano': 'PSV Eindhoven',
  // Japan
  'Takefusa Kubo': 'Real Sociedad',
  // South Korea
  'Son Heung-min': 'Tottenham Hotspur',
  // Morocco
  'Achraf Hakimi': 'Paris Saint-Germain',
  // Senegal
  'Sadio Mané': 'Al-Nassr FC',
};

// Complete WM coaches history
const WM_COACHES_HISTORY = {
  'DE': [
    { coach_name: 'Julian Nagelsmann', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Hansi Flick', wm_year: 2022, result: 'Vorrunde', wins: 1, draws: 1, losses: 1 },
    { coach_name: 'Joachim Löw', wm_year: 2018, result: 'Vorrunde', wins: 1, draws: 0, losses: 2 },
    { coach_name: 'Joachim Löw', wm_year: 2014, result: 'Weltmeister 🏆', wins: 6, draws: 1, losses: 0 },
    { coach_name: 'Joachim Löw', wm_year: 2010, result: '3. Platz 🥉', wins: 5, draws: 0, losses: 2 },
    { coach_name: 'Jürgen Klinsmann', wm_year: 2006, result: '3. Platz 🥉', wins: 5, draws: 1, losses: 1 },
    { coach_name: 'Rudi Völler', wm_year: 2002, result: 'Finale 🥈', wins: 4, draws: 1, losses: 2 },
    { coach_name: 'Erich Ribbeck', wm_year: 1998, result: 'Viertelfinale', wins: 2, draws: 1, losses: 1 },
    { coach_name: 'Berti Vogts', wm_year: 1994, result: 'Viertelfinale', wins: 3, draws: 1, losses: 1 },
    { coach_name: 'Franz Beckenbauer', wm_year: 1990, result: 'Weltmeister 🏆', wins: 5, draws: 2, losses: 0 },
    { coach_name: 'Franz Beckenbauer', wm_year: 1986, result: 'Finale 🥈', wins: 3, draws: 2, losses: 2 },
    { coach_name: 'Jupp Derwall', wm_year: 1982, result: 'Finale 🥈', wins: 3, draws: 2, losses: 2 },
    { coach_name: 'Helmut Schön', wm_year: 1978, result: 'Zwischenrunde', wins: 1, draws: 4, losses: 1 },
    { coach_name: 'Helmut Schön', wm_year: 1974, result: 'Weltmeister 🏆', wins: 6, draws: 0, losses: 1 },
    { coach_name: 'Helmut Schön', wm_year: 1970, result: '3. Platz 🥉', wins: 4, draws: 1, losses: 1 },
    { coach_name: 'Helmut Schön', wm_year: 1966, result: 'Finale 🥈', wins: 4, draws: 1, losses: 1 },
    { coach_name: 'Sepp Herberger', wm_year: 1962, result: 'Viertelfinale', wins: 2, draws: 1, losses: 1 },
    { coach_name: 'Sepp Herberger', wm_year: 1958, result: 'Halbfinale', wins: 2, draws: 2, losses: 2 },
    { coach_name: 'Sepp Herberger', wm_year: 1954, result: 'Weltmeister 🏆', wins: 5, draws: 0, losses: 1 },
  ],
  'BR': [
    { coach_name: 'Dorival Júnior', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Tite', wm_year: 2022, result: 'Viertelfinale', wins: 3, draws: 0, losses: 1 },
    { coach_name: 'Tite', wm_year: 2018, result: 'Viertelfinale', wins: 3, draws: 1, losses: 1 },
    { coach_name: 'Dunga', wm_year: 2010, result: 'Viertelfinale', wins: 3, draws: 0, losses: 1 },
    { coach_name: 'Carlos Alberto Parreira', wm_year: 2006, result: 'Viertelfinale', wins: 4, draws: 0, losses: 1 },
    { coach_name: 'Luiz Felipe Scolari', wm_year: 2002, result: 'Weltmeister 🏆', wins: 7, draws: 0, losses: 0 },
    { coach_name: 'Zagallo', wm_year: 1998, result: 'Finale 🥈', wins: 4, draws: 1, losses: 2 },
    { coach_name: 'Carlos Alberto Parreira', wm_year: 1994, result: 'Weltmeister 🏆', wins: 5, draws: 2, losses: 0 },
    { coach_name: 'Sebastião Lazaroni', wm_year: 1990, result: 'Achtelfinale', wins: 3, draws: 0, losses: 1 },
    { coach_name: 'Carlos Alberto Silva', wm_year: 1986, result: 'Viertelfinale', wins: 4, draws: 0, losses: 1 },
    { coach_name: 'Telê Santana', wm_year: 1982, result: 'Zwischenrunde', wins: 4, draws: 0, losses: 1 },
    { coach_name: 'Cláudio Coutinho', wm_year: 1978, result: '3. Platz 🥉', wins: 4, draws: 2, losses: 0 },
    { coach_name: 'Zagallo', wm_year: 1974, result: 'Vierter Platz', wins: 3, draws: 2, losses: 2 },
    { coach_name: 'Zagallo', wm_year: 1970, result: 'Weltmeister 🏆', wins: 6, draws: 0, losses: 0 },
    { coach_name: 'Aymoré Moreira', wm_year: 1962, result: 'Weltmeister 🏆', wins: 5, draws: 1, losses: 0 },
    { coach_name: 'Vicente Feola', wm_year: 1958, result: 'Weltmeister 🏆', wins: 5, draws: 1, losses: 0 },
  ],
  'AR': [
    { coach_name: 'Lionel Scaloni', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Lionel Scaloni', wm_year: 2022, result: 'Weltmeister 🏆', wins: 5, draws: 2, losses: 0 },
    { coach_name: 'Jorge Sampaoli', wm_year: 2018, result: 'Achtelfinale', wins: 1, draws: 1, losses: 2 },
    { coach_name: 'Alejandro Sabella', wm_year: 2014, result: 'Finale 🥈', wins: 5, draws: 1, losses: 1 },
    { coach_name: 'Diego Maradona', wm_year: 2010, result: 'Viertelfinale', wins: 4, draws: 0, losses: 1 },
    { coach_name: 'José Pekerman', wm_year: 2006, result: 'Viertelfinale', wins: 3, draws: 1, losses: 1 },
    { coach_name: 'Marcelo Bielsa', wm_year: 2002, result: 'Vorrunde', wins: 1, draws: 1, losses: 1 },
    { coach_name: 'Daniel Passarella', wm_year: 1998, result: 'Viertelfinale', wins: 3, draws: 0, losses: 1 },
    { coach_name: 'Alfio Basile', wm_year: 1994, result: 'Achtelfinale', wins: 2, draws: 0, losses: 2 },
    { coach_name: 'Carlos Bilardo', wm_year: 1990, result: 'Finale 🥈', wins: 2, draws: 3, losses: 2 },
    { coach_name: 'Carlos Bilardo', wm_year: 1986, result: 'Weltmeister 🏆', wins: 6, draws: 1, losses: 0 },
    { coach_name: 'César Luis Menotti', wm_year: 1982, result: 'Zwischenrunde', wins: 2, draws: 0, losses: 3 },
    { coach_name: 'César Luis Menotti', wm_year: 1978, result: 'Weltmeister 🏆', wins: 5, draws: 1, losses: 1 },
  ],
  'FR': [
    { coach_name: 'Didier Deschamps', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Didier Deschamps', wm_year: 2022, result: 'Finale 🥈', wins: 5, draws: 0, losses: 2 },
    { coach_name: 'Didier Deschamps', wm_year: 2018, result: 'Weltmeister 🏆', wins: 6, draws: 1, losses: 0 },
    { coach_name: 'Didier Deschamps', wm_year: 2014, result: 'Viertelfinale', wins: 3, draws: 1, losses: 1 },
    { coach_name: 'Laurent Blanc', wm_year: 2010, result: 'Vorrunde', wins: 0, draws: 1, losses: 2 },
    { coach_name: 'Raymond Domenech', wm_year: 2006, result: 'Finale 🥈', wins: 4, draws: 1, losses: 2 },
    { coach_name: 'Jacques Santini', wm_year: 2002, result: 'Vorrunde', wins: 0, draws: 1, losses: 2 },
    { coach_name: 'Aimé Jacquet', wm_year: 1998, result: 'Weltmeister 🏆', wins: 6, draws: 1, losses: 0 },
    { coach_name: 'Michel Platini', wm_year: 1986, result: '3. Platz 🥉', wins: 4, draws: 1, losses: 2 },
    { coach_name: 'Michel Hidalgo', wm_year: 1982, result: 'Halbfinale', wins: 3, draws: 2, losses: 2 },
    { coach_name: 'Michel Hidalgo', wm_year: 1978, result: 'Vorrunde', wins: 1, draws: 0, losses: 2 },
  ],
  'EN': [
    { coach_name: 'Thomas Tuchel', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Gareth Southgate', wm_year: 2022, result: 'Viertelfinale', wins: 2, draws: 1, losses: 1 },
    { coach_name: 'Gareth Southgate', wm_year: 2018, result: 'Halbfinale', wins: 3, draws: 1, losses: 2 },
    { coach_name: 'Roy Hodgson', wm_year: 2014, result: 'Vorrunde', wins: 0, draws: 1, losses: 2 },
    { coach_name: 'Fabio Capello', wm_year: 2010, result: 'Achtelfinale', wins: 1, draws: 2, losses: 1 },
    { coach_name: 'Sven-Göran Eriksson', wm_year: 2006, result: 'Viertelfinale', wins: 3, draws: 1, losses: 1 },
    { coach_name: 'Sven-Göran Eriksson', wm_year: 2002, result: 'Viertelfinale', wins: 2, draws: 2, losses: 1 },
    { coach_name: 'Glenn Hoddle', wm_year: 1998, result: 'Achtelfinale', wins: 2, draws: 1, losses: 1 },
    { coach_name: 'Bobby Robson', wm_year: 1990, result: 'Halbfinale', wins: 3, draws: 3, losses: 1 },
    { coach_name: 'Bobby Robson', wm_year: 1986, result: 'Viertelfinale', wins: 2, draws: 1, losses: 2 },
    { coach_name: 'Ron Greenwood', wm_year: 1982, result: 'Zwischenrunde', wins: 3, draws: 2, losses: 0 },
    { coach_name: 'Alf Ramsey', wm_year: 1970, result: 'Viertelfinale', wins: 2, draws: 0, losses: 2 },
    { coach_name: 'Alf Ramsey', wm_year: 1966, result: 'Weltmeister 🏆', wins: 5, draws: 1, losses: 0 },
  ],
  'ES': [
    { coach_name: 'Luis de la Fuente', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Luis Enrique', wm_year: 2022, result: 'Achtelfinale', wins: 1, draws: 1, losses: 1 },
    { coach_name: 'Fernando Hierro', wm_year: 2018, result: 'Achtelfinale', wins: 1, draws: 2, losses: 1 },
    { coach_name: 'Vicente del Bosque', wm_year: 2014, result: 'Vorrunde', wins: 1, draws: 0, losses: 2 },
    { coach_name: 'Vicente del Bosque', wm_year: 2010, result: 'Weltmeister 🏆', wins: 6, draws: 0, losses: 1 },
    { coach_name: 'Luis Aragonés', wm_year: 2006, result: 'Achtelfinale', wins: 3, draws: 0, losses: 1 },
    { coach_name: 'José Antonio Camacho', wm_year: 2002, result: 'Viertelfinale', wins: 3, draws: 1, losses: 1 },
    { coach_name: 'José Antonio Camacho', wm_year: 1998, result: 'Vorrunde', wins: 1, draws: 1, losses: 1 },
  ],
  'IT': [
    { coach_name: 'Luciano Spalletti', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Marcello Lippi', wm_year: 2010, result: 'Vorrunde', wins: 0, draws: 2, losses: 1 },
    { coach_name: 'Marcello Lippi', wm_year: 2006, result: 'Weltmeister 🏆', wins: 5, draws: 2, losses: 0 },
    { coach_name: 'Giovanni Trapattoni', wm_year: 2002, result: 'Achtelfinale', wins: 1, draws: 2, losses: 1 },
    { coach_name: 'Dino Zoff', wm_year: 1998, result: 'Viertelfinale', wins: 3, draws: 0, losses: 1 },
    { coach_name: 'Arrigo Sacchi', wm_year: 1994, result: 'Finale 🥈', wins: 4, draws: 2, losses: 1 },
    { coach_name: 'Azeglio Vicini', wm_year: 1990, result: '3. Platz 🥉', wins: 6, draws: 0, losses: 1 },
    { coach_name: 'Enzo Bearzot', wm_year: 1986, result: 'Achtelfinale', wins: 1, draws: 2, losses: 1 },
    { coach_name: 'Enzo Bearzot', wm_year: 1982, result: 'Weltmeister 🏆', wins: 4, draws: 3, losses: 0 },
    { coach_name: 'Enzo Bearzot', wm_year: 1978, result: 'Vierter Platz', wins: 3, draws: 1, losses: 2 },
    { coach_name: 'Ferruccio Valcareggi', wm_year: 1974, result: 'Vorrunde', wins: 1, draws: 1, losses: 1 },
    { coach_name: 'Ferruccio Valcareggi', wm_year: 1970, result: 'Finale 🥈', wins: 3, draws: 1, losses: 2 },
  ],
  'NL': [
    { coach_name: 'Ronald Koeman', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Louis van Gaal', wm_year: 2022, result: 'Viertelfinale', wins: 2, draws: 1, losses: 1 },
    { coach_name: 'Louis van Gaal', wm_year: 2014, result: '3. Platz 🥉', wins: 5, draws: 1, losses: 1 },
    { coach_name: 'Bert van Marwijk', wm_year: 2010, result: 'Finale 🥈', wins: 6, draws: 0, losses: 1 },
    { coach_name: 'Marco van Basten', wm_year: 2006, result: 'Achtelfinale', wins: 2, draws: 1, losses: 1 },
    { coach_name: 'Dick Advocaat', wm_year: 1994, result: 'Viertelfinale', wins: 3, draws: 0, losses: 2 },
    { coach_name: 'Leo Beenhakker', wm_year: 1990, result: 'Achtelfinale', wins: 3, draws: 0, losses: 1 },
    { coach_name: 'Rinus Michels', wm_year: 1978, result: 'Finale 🥈', wins: 3, draws: 2, losses: 2 },
    { coach_name: 'Rinus Michels', wm_year: 1974, result: 'Finale 🥈', wins: 5, draws: 1, losses: 1 },
  ],
  'PL': [
    { coach_name: 'Michał Probierz', wm_year: 2026, result: 'Qualifiziert', is_current: true },
    { coach_name: 'Czesław Michniewicz', wm_year: 2022, result: 'Achtelfinale', wins: 1, draws: 1, losses: 2 },
    { coach_name: 'Adam Nawałka', wm_year: 2018, result: 'Vorrunde', wins: 1, draws: 0, losses: 2 },
    { coach_name: 'Antoni Piechniczek', wm_year: 1986, result: 'Achtelfinale', wins: 1, draws: 0, losses: 2 },
    { coach_name: 'Antoni Piechniczek', wm_year: 1982, result: '3. Platz 🥉', wins: 3, draws: 3, losses: 1 },
    { coach_name: 'Jacek Gmoch', wm_year: 1978, result: 'Zwischenrunde', wins: 2, draws: 1, losses: 3 },
    { coach_name: 'Kazimierz Górski', wm_year: 1974, result: '3. Platz 🥉', wins: 6, draws: 0, losses: 1 },
  ],
};

// WM 2026 Official Group Assignments (FIFA Draw December 2025)
const WM2026_GROUPS = {
  'A': ['MX', 'KR', 'ZA'], // Mexico, South Korea, South Africa + UEFA Playoff D
  'B': ['CA', 'CH', 'QA'], // Canada, Switzerland, Qatar + UEFA Playoff A
  'C': ['BR', 'MA', 'HT', 'SCO'], // Brazil, Morocco, Haiti, Scotland
  'D': ['US', 'PY', 'AU'], // USA, Paraguay, Australia + UEFA Playoff C
  'E': ['DE', 'CW', 'CI', 'EC'], // Germany, Curaçao, Ivory Coast, Ecuador
  'F': ['NL', 'JP', 'TN'], // Netherlands, Japan, Tunisia + UEFA Playoff B
  'G': ['BE', 'EG', 'IR', 'NZ'], // Belgium, Egypt, Iran, New Zealand
  'H': ['ES', 'UY', 'SA', 'CV'], // Spain, Uruguay, Saudi Arabia, Cape Verde
  'I': ['FR', 'SN', 'NO'], // France, Senegal, Norway + Intercontinental Playoff 2
  'J': ['AR', 'DZ', 'AT', 'JO'], // Argentina, Algeria, Austria, Jordan
  'K': ['PT', 'CO', 'UZ'], // Portugal, Colombia, Uzbekistan + Intercontinental Playoff 1
  'L': ['EN', 'HR', 'GH', 'PA'], // England, Croatia, Ghana, Panama
};

// Helper to get group for a country code
const getGroupForCountry = (countryCode) => {
  for (const [group, teams] of Object.entries(WM2026_GROUPS)) {
    if (teams.includes(countryCode)) return group;
  }
  return null;
};

// Helper to get group opponents for a country code
const getGroupOpponents = (countryCode) => {
  const group = getGroupForCountry(countryCode);
  if (!group) return [];
  return WM2026_GROUPS[group].filter(code => code !== countryCode);
};

// Correct H2H Data (verified historical matches)
export const H2H_DATA = {
  'DE': {
    'SCO': [
      { date: '2024-06-14', comp: 'EM', venue: 'München', attendance: 66000, result: '5:1', scorers: ['Wirtz', 'Musiala', 'Havertz', 'Füllkrug', 'Can', 'Rüdiger (ET)'] },
      { date: '2014-09-07', comp: 'EM-Quali', venue: 'Dortmund', attendance: 51000, result: '2:1', scorers: ['Müller 2', 'Anya'] },
      { date: '2003-06-07', comp: 'EM-Quali', venue: 'Glasgow', attendance: 48500, result: '1:1', scorers: ['Fredi Bobic', 'Miller'] },
    ],
    'HU': [
      { date: '2024-06-19', comp: 'EM', venue: 'Stuttgart', attendance: 54000, result: '2:0', scorers: ['Musiala', 'Gündogan'] },
      { date: '1954-07-04', comp: 'WM Finale', venue: 'Bern', attendance: 62500, result: '3:2', scorers: ['Morlock', 'Rahn 2', 'Puskás', 'Czibor'] },
    ],
    'CH': [
      { date: '2024-06-23', comp: 'EM', venue: 'Frankfurt', attendance: 47000, result: '1:1', scorers: ['Füllkrug', 'Ndoye'] },
      { date: '2006-06-09', comp: 'WM', venue: 'München', attendance: 66000, result: '4:2', scorers: ['Lahm', 'Klose 2', 'Frings', 'Senderos', 'Streller'] },
    ],
    'DK': [
      { date: '2024-06-29', comp: 'EM', venue: 'Dortmund', attendance: 62000, result: '2:0', scorers: ['Havertz', 'Musiala'] },
      { date: '2021-06-28', comp: 'EM', venue: 'Wembley', attendance: 41000, result: '(England 2:0 DK)', scorers: [] },
      { date: '1992-06-18', comp: 'EM Finale', venue: 'Göteborg', attendance: 37800, result: '0:2', scorers: ['J.Jensen', 'Vilfort'] },
      { date: '1986-06-13', comp: 'WM', venue: 'Querétaro', attendance: 26500, result: '2:0', scorers: ['Allofs', 'Jakobs'] },
    ],
    'ES': [
      { date: '2024-07-05', comp: 'EM VF', venue: 'Stuttgart', attendance: 54000, result: '1:2 n.V.', scorers: ['Wirtz', 'Olmo', 'Merino'] },
      { date: '2010-07-07', comp: 'WM HF', venue: 'Durban', attendance: 60960, result: '0:1', scorers: ['Puyol'] },
    ],
    'KR': [
      { date: '2018-06-27', comp: 'WM', venue: 'Kasan', attendance: 41835, result: '0:2', scorers: ['Kim Young-gwon', 'Son Heung-min'] },
      { date: '2002-06-25', comp: 'WM HF', venue: 'Seoul', attendance: 65625, result: '1:0', scorers: ['Ballack'] },
    ],
    'AR': [
      { date: '2014-07-13', comp: 'WM Finale', venue: 'Rio', attendance: 74738, result: '1:0 n.V.', scorers: ['Götze'] },
      { date: '2010-07-03', comp: 'WM VF', venue: 'Kapstadt', attendance: 64100, result: '4:0', scorers: ['Müller', 'Klose 2', 'Friedrich'] },
      { date: '2006-07-08', comp: 'WM VF', venue: 'Berlin', attendance: 72000, result: '1:1 (4:2 i.E.)', scorers: ['Klose', 'Ayala'] },
      { date: '1990-07-08', comp: 'WM Finale', venue: 'Rom', attendance: 73603, result: '1:0', scorers: ['Brehme (P)'] },
      { date: '1986-06-29', comp: 'WM Finale', venue: 'Mexiko-Stadt', attendance: 114600, result: '2:3', scorers: ['Rummenigge', 'Völler', 'Brown', 'Valdano', 'Burruchaga'] },
    ],
    'MX': [
      { date: '2018-06-17', comp: 'WM', venue: 'Moskau', attendance: 78011, result: '0:1', scorers: ['Lozano'] },
      { date: '2017-06-29', comp: 'Confed Cup HF', venue: 'Sotschi', attendance: 40855, result: '4:1', scorers: ['Goretzka 2', 'Werner 2', 'Fabian'] },
    ],
    // Group E opponents
    'EC': [
      { date: '2013-05-29', comp: 'Friendly', venue: 'Boca Raton', attendance: 9000, result: '4:2', scorers: ['Podolski 2', 'Lars Bender 2', 'Valencia', 'Ayoví'], source: 'espn.com' },
      { date: '2006-06-20', comp: 'WM', venue: 'Berlin', attendance: 72000, result: '3:0', scorers: ['Klose 2', 'Podolski'] },
    ],
    'CI': [
      { date: '2009-11-18', comp: 'Friendly', venue: 'München', attendance: 33015, result: '2:2', scorers: ['Podolski 2', 'Eboué (ET)', 'Doumbia'] },
    ],
  },
  'AR': {
    'DE': [
      { date: '2014-07-13', comp: 'WM Finale', venue: 'Rio', attendance: 74738, result: '0:1 n.V.', scorers: ['Götze'] },
      { date: '2010-07-03', comp: 'WM VF', venue: 'Kapstadt', attendance: 64100, result: '0:4', scorers: [] },
      { date: '2006-07-08', comp: 'WM VF', venue: 'Berlin', attendance: 72000, result: '1:1 (2:4 i.E.)', scorers: ['Ayala'] },
      { date: '1990-07-08', comp: 'WM Finale', venue: 'Rom', attendance: 73603, result: '0:1', scorers: [] },
      { date: '1986-06-29', comp: 'WM Finale', venue: 'Mexiko-Stadt', attendance: 114600, result: '3:2', scorers: ['Brown', 'Valdano', 'Burruchaga'] },
    ],
    'FR': [
      { date: '2022-12-18', comp: 'WM Finale', venue: 'Lusail', attendance: 88966, result: '3:3 (4:2 i.E.)', scorers: ['Messi 2', 'Di María', 'Mbappé 3'] },
      { date: '2018-06-30', comp: 'WM AF', venue: 'Kasan', attendance: 42873, result: '3:4', scorers: ['Di María', 'Mercado', 'Agüero', 'Griezmann', 'Pavard', 'Mbappé 2'] },
    ],
    'NL': [
      { date: '2022-12-09', comp: 'WM VF', venue: 'Lusail', attendance: 88235, result: '2:2 (4:3 i.E.)', scorers: ['Molina', 'Messi', 'Weghorst 2'] },
      { date: '2014-07-09', comp: 'WM HF', venue: 'São Paulo', attendance: 63267, result: '0:0 (4:2 i.E.)', scorers: [] },
      { date: '1998-07-04', comp: 'WM VF', venue: 'Marseille', attendance: 55000, result: '2:1', scorers: ['López', 'Bergkamp'] },
      { date: '1978-06-25', comp: 'WM Finale', venue: 'Buenos Aires', attendance: 71483, result: '3:1 n.V.', scorers: ['Kempes 2', 'Bertoni', 'Nanninga'] },
    ],
    'HR': [
      { date: '2022-12-13', comp: 'WM HF', venue: 'Lusail', attendance: 88966, result: '3:0', scorers: ['Messi', 'Álvarez 2'] },
    ],
    // Group J opponents
    'AT': [
      { date: '1990-05-03', comp: 'Friendly', venue: 'Wien (Prater)', attendance: 15000, result: '1:1', scorers: [], source: '11v11.com' },
      { date: '1980-05-21', comp: 'Friendly', venue: 'Wien (Prater)', attendance: 20000, result: '5:1', scorers: ['Maradona', 'Díaz 2', 'Ramón Díaz', 'Passarella'], source: '11v11.com' },
    ],
    'DZ': [
      { date: '2007-06-05', comp: 'Friendly', venue: 'Barcelona (Mini Estadi)', attendance: 5000, result: '4:3', scorers: ['Messi', 'Messi (P)', 'Cambiasso', 'Tévez (P)', 'Belhadj 2', 'Yahia'], source: 'espn.com' },
    ],
    'JO': [], // Never played - first meeting at WM 2026
  },
  'FR': {
    'AR': [
      { date: '2022-12-18', comp: 'WM Finale', venue: 'Lusail', attendance: 88966, result: '3:3 (2:4 i.E.)', scorers: ['Mbappé 3'] },
      { date: '2018-06-30', comp: 'WM AF', venue: 'Kasan', attendance: 42873, result: '4:3', scorers: ['Griezmann', 'Pavard', 'Mbappé 2'] },
    ],
    'MA': [
      { date: '2022-12-14', comp: 'WM HF', venue: 'Al-Bayt', attendance: 68294, result: '2:0', scorers: ['T. Hernández', 'Kolo Muani'] },
    ],
    'EN': [
      { date: '2022-12-10', comp: 'WM VF', venue: 'Al-Bayt', attendance: 68895, result: '2:1', scorers: ['Giroud', 'Tchouaméni', 'Kane'] },
    ],
    'PL': [
      { date: '2022-12-04', comp: 'WM AF', venue: 'Al-Thumama', attendance: 40472, result: '3:1', scorers: ['Giroud', 'Mbappé 2', 'Lewandowski (P)'] },
    ],
    'HR': [
      { date: '2018-07-15', comp: 'WM Finale', venue: 'Moskau', attendance: 78011, result: '4:2', scorers: ['Mandžukić (ET)', 'Griezmann (P)', 'Pogba', 'Mbappé', 'Mandžukić', 'Perišić'] },
    ],
    'BE': [
      { date: '2018-07-10', comp: 'WM HF', venue: 'St. Petersburg', attendance: 64286, result: '1:0', scorers: ['Umtiti'] },
    ],
    // Group I opponents
    'SN': [
      { date: '2002-05-31', comp: 'WM', venue: 'Seoul', attendance: 62561, result: '0:1', scorers: ['Bouba Diop'] },
    ],
    'NO': [
      { date: '2014-05-27', comp: 'Friendly', venue: 'Saint-Denis', attendance: 79000, result: '4:0', scorers: ['Pogba', 'Giroud 2', 'Rémy'], source: 'espn.com' },
    ],
  },
  'EN': {
    'FR': [
      { date: '2022-12-10', comp: 'WM VF', venue: 'Al-Bayt', attendance: 68895, result: '1:2', scorers: ['Kane'] },
    ],
    'SN': [
      { date: '2022-12-04', comp: 'WM AF', venue: 'Al-Bayt', attendance: 67843, result: '3:0', scorers: ['Henderson', 'Kane', 'Saka'] },
    ],
    'HR': [
      { date: '2021-06-13', comp: 'EM', venue: 'Wembley', attendance: 22500, result: '1:0', scorers: ['Sterling'], source: 'uefa.com' },
      { date: '2018-11-18', comp: 'Nations League', venue: 'Wembley', attendance: 78000, result: '2:1', scorers: ['Lingard', 'Kane', 'Kramarić'], source: 'uefa.com' },
      { date: '2018-10-12', comp: 'Nations League', venue: 'Rijeka', attendance: 8200, result: '0:0', scorers: [], source: 'uefa.com' },
      { date: '2018-07-11', comp: 'WM HF', venue: 'Moskau', attendance: 78011, result: '1:2 n.V.', scorers: ['Trippier', 'Perišić', 'Mandžukić'], source: 'fifa.com' },
      { date: '2009-09-09', comp: 'WM-Quali', venue: 'Wembley', attendance: 85512, result: '5:1', scorers: ['Lampard 2', 'Gerrard', 'Rooney', 'Crouch', 'Eduardo'], source: '11v11.com' },
      { date: '2008-09-10', comp: 'WM-Quali', venue: 'Zagreb', attendance: 35000, result: '4:1', scorers: ['Walcott 3', 'Rooney', 'Klasnić'], source: '11v11.com' },
      { date: '2007-11-21', comp: 'EM-Quali', venue: 'Wembley', attendance: 88091, result: '2:3', scorers: ['Lampard (P)', 'Crouch', 'Kranjčar', 'Olić', 'Petrić'], source: 'englandstats.com' },
      { date: '2006-10-11', comp: 'EM-Quali', venue: 'Zagreb', attendance: 38000, result: '0:2', scorers: ['Eduardo', 'Neville (ET)'], source: 'englandstats.com' },
      { date: '2004-06-21', comp: 'EM', venue: 'Lissabon', attendance: 63000, result: '4:2', scorers: ['Scholes', 'Rooney 2', 'Lampard', 'Kovač', 'Tudor'], source: 'uefa.com' },
      { date: '2003-08-20', comp: 'Friendly', venue: 'Ipswich', attendance: 29000, result: '3:1', scorers: ['Owen', 'Rooney', 'Lampard', 'Šimić'], source: '11v11.com' },
      { date: '1996-04-24', comp: 'Friendly', venue: 'Wembley', attendance: 34400, result: '0:0', scorers: [], source: '11v11.com' },
    ],
    'CO': [
      { date: '2018-07-03', comp: 'WM AF', venue: 'Moskau', attendance: 44190, result: '1:1 (4:3 i.E.)', scorers: ['Kane', 'Mina'] },
    ],
    'DE': [
      { date: '1966-07-30', comp: 'WM Finale', venue: 'Wembley', attendance: 96924, result: '4:2 n.V.', scorers: ['Hurst 3', 'Peters', 'Haller', 'Weber'] },
      { date: '1990-07-04', comp: 'WM HF', venue: 'Turin', attendance: 62628, result: '1:1 (3:4 i.E.)', scorers: ['Lineker', 'Brehme'] },
      { date: '2010-06-27', comp: 'WM AF', venue: 'Bloemfontein', attendance: 40510, result: '1:4', scorers: ['Upson', 'Klose', 'Podolski', 'Müller 2'] },
      { date: '2021-06-29', comp: 'EM AF', venue: 'Wembley', attendance: 40000, result: '2:0', scorers: ['Sterling', 'Kane'] },
    ],
    // Group L opponents
    'GH': [
      { date: '2011-03-29', comp: 'Friendly', venue: 'Wembley', attendance: 80102, result: '1:1', scorers: ['Carroll', 'Gyan'], source: '11v11.com' },
    ],
    'PA': [
      { date: '2018-06-24', comp: 'WM', venue: 'Nizhny Novgorod', attendance: 43319, result: '6:1', scorers: ['Stones 2', 'Kane 3 (2P)', 'Lingard', 'Baloy'] },
    ],
  },
  'BR': {
    'DE': [
      { date: '2014-07-08', comp: 'WM HF', venue: 'Belo Horizonte', attendance: 58141, result: '1:7', scorers: ['Oscar', 'Müller', 'Klose', 'Kroos 2', 'Khedira', 'Schürrle 2'] },
      { date: '2002-06-30', comp: 'WM Finale', venue: 'Yokohama', attendance: 69029, result: '2:0', scorers: ['Ronaldo 2'] },
    ],
    'AR': [
      { date: '2021-07-10', comp: 'Copa Finale', venue: 'Rio', attendance: 7800, result: '0:1', scorers: ['Di María'] },
      { date: '2019-07-02', comp: 'Copa HF', venue: 'Belo Horizonte', attendance: 56000, result: '2:0', scorers: ['Gabriel Jesus', 'Firmino'] },
    ],
    'HR': [
      { date: '2022-12-09', comp: 'WM VF', venue: 'Education City', attendance: 43877, result: '1:1 (2:4 i.E.)', scorers: ['Neymar', 'Petković'] },
    ],
    // Group C opponents
    'MA': [
      { date: '2023-03-25', comp: 'Friendly', venue: 'Tanger', attendance: 63500, result: '1:2', scorers: ['Casemiro', 'Sabiri', 'Boufal'], source: 'fifa.com' },
      { date: '1998-06-16', comp: 'WM', venue: 'Nantes', attendance: 35500, result: '3:0', scorers: ['Ronaldo 2', 'Rivaldo'], source: 'fifa.com' },
    ],
    'HT': [
      { date: '2016-06-08', comp: 'Copa America', venue: 'Orlando', attendance: 28241, result: '7:1', scorers: ['Coutinho 3', 'Renato Augusto 2', 'Gabriel Barbosa', 'Lucas Lima', 'Marcelin'] },
      { date: '2004-08-18', comp: 'Friendly', venue: 'Port-au-Prince', attendance: 15000, result: '6:0', scorers: ['Adriano 2', 'Kaká 2', 'Robinho', 'Ronaldinho'] },
    ],
    'SCO': [
      { date: '2011-03-27', comp: 'Friendly', venue: 'London (Emirates)', attendance: 53087, result: '2:0', scorers: ['Neymar 2'], source: '11v11.com, arsenal.com' },
      { date: '1998-06-10', comp: 'WM', venue: 'Paris (Stade de France)', attendance: 80000, result: '2:1', scorers: ['César Sampaio', 'Boyd (ET)', 'Collins (P)'], source: 'fifa.com' },
      { date: '1990-06-20', comp: 'WM', venue: 'Turin', attendance: 62628, result: '1:0', scorers: ['Müller'], source: 'fifa.com' },
      { date: '1987-05-26', comp: 'Rous Cup', venue: 'Glasgow (Hampden)', attendance: 41384, result: '2:0', scorers: ['Valdo', 'Raí'], source: 'rsssf.org' },
      { date: '1982-06-18', comp: 'WM', venue: 'Sevilla', attendance: 47379, result: '4:1', scorers: ['Zico', 'Oscar', 'Eder', 'Falcão', 'Narey'], source: 'fifa.com' },
      { date: '1977-06-23', comp: 'Friendly', venue: 'Rio (Maracanã)', attendance: 69763, result: '2:0', scorers: ['Zico', 'Cerezo'], source: 'eu-football.info' },
      { date: '1974-06-18', comp: 'WM', venue: 'Frankfurt', attendance: 62000, result: '0:0', scorers: [], source: 'fifa.com' },
      { date: '1973-06-30', comp: 'Friendly', venue: 'Glasgow (Hampden)', attendance: 78181, result: '1:0', scorers: ['Johnstone (OG)'], source: 'scottishfa.co.uk' },
      { date: '1972-07-05', comp: 'Independence Cup', venue: 'Rio (Maracanã)', attendance: 130000, result: '1:0', scorers: ['Jairzinho'], source: 'rsssf.org' },
      { date: '1966-06-25', comp: 'Friendly', venue: 'Glasgow (Hampden)', attendance: 74933, result: '1:1', scorers: ['Servílio', 'Chalmers'], source: 'scottishfa.co.uk' },
    ],
  },
  'PL': {
    'FR': [
      { date: '2022-12-04', comp: 'WM AF', venue: 'Al-Thumama', attendance: 40472, result: '1:3', scorers: ['Lewandowski (P)'] },
    ],
    'AR': [
      { date: '2022-11-30', comp: 'WM', venue: 'Doha', attendance: 44089, result: '0:2', scorers: ['Mac Allister', 'Álvarez'] },
    ],
  },
  // GROUP J: Argentina, Algeria, Austria, Jordan
  'AT': {
    'AR': [
      { date: '1990-05-03', comp: 'Friendly', venue: 'Wien (Prater)', attendance: 15000, result: '1:1', scorers: [], source: '11v11.com' },
      { date: '1980-05-21', comp: 'Friendly', venue: 'Wien (Prater)', attendance: 20000, result: '1:5', scorers: [], source: '11v11.com' },
    ],
    'DZ': [
      { date: '1982-06-21', comp: 'WM', venue: 'Oviedo (Carlos Tartiere)', attendance: 22000, result: '2:0', scorers: ['Schachner', 'Krankl'], source: 'espn.com, fifa.com' },
    ],
    'JO': [], // Never played - first meeting at WM 2026
  },
  'DZ': {
    'AR': [
      { date: '2007-06-05', comp: 'Friendly', venue: 'Barcelona (Mini Estadi)', attendance: 5000, result: '3:4', scorers: ['Belhadj 2', 'Yahia', 'Messi', 'Messi (P)', 'Cambiasso', 'Tévez (P)'], source: 'espn.com' },
    ],
    'AT': [
      { date: '1982-06-21', comp: 'WM', venue: 'Oviedo (Carlos Tartiere)', attendance: 22000, result: '0:2', scorers: ['Schachner', 'Krankl'], source: 'espn.com, fifa.com' },
    ],
    'JO': [
      { date: '2004-05-30', comp: 'Friendly', venue: 'Algier', attendance: 5000, result: '1:1', scorers: ['Cherrad'], source: 'footballdatabase.eu' },
    ],
  },
  'JO': {
    'AR': [], // Never played - first meeting at WM 2026
    'AT': [], // Never played - first meeting at WM 2026
    'DZ': [
      { date: '2004-05-30', comp: 'Friendly', venue: 'Algier', attendance: 5000, result: '1:1', scorers: [], source: 'footballdatabase.eu' },
    ],
  },
  // GROUP A: Mexico, South Korea, South Africa
  'MX': {
    'KR': [
      { date: '2018-06-23', comp: 'WM', venue: 'Rostov', attendance: 41835, result: '2:1', scorers: ['Vela (P)', 'Hernández', 'Son Heung-min'] },
      { date: '1998-06-13', comp: 'WM', venue: 'Lyon', attendance: 39100, result: '3:1', scorers: ['Peláez', 'L. Hernández 2', 'Ha Seok-ju'] },
    ],
    'ZA': [
      { date: '2010-06-11', comp: 'WM', venue: 'Johannesburg (Soccer City)', attendance: 84490, result: '1:1', scorers: ['Márquez', 'Tshabalala'], source: 'fifa.com' },
      { date: '2005-07-08', comp: 'CONCACAF Gold Cup', venue: 'Carson (CA)', attendance: 19205, result: '1:2', scorers: ['Maza', 'P. Evans', 'Van Heerden'], source: 'espn.com' },
      { date: '2000-06-07', comp: 'Friendly', venue: 'Dallas (Cotton Bowl)', attendance: 30000, result: '4:2', scorers: [], source: 'national-football-teams.com' },
      { date: '1993-10-06', comp: 'Friendly', venue: 'Los Angeles (Memorial Coliseum)', attendance: 37000, result: '4:0', scorers: [], source: 'national-football-teams.com' },
    ],
  },
  'KR': {
    'MX': [
      { date: '2018-06-23', comp: 'WM', venue: 'Rostov', attendance: 41835, result: '1:2', scorers: ['Son Heung-min'] },
      { date: '1998-06-13', comp: 'WM', venue: 'Lyon', attendance: 39100, result: '1:3', scorers: ['Ha Seok-ju'] },
    ],
    'ZA': [], // Never played (senior) - first meeting at WM 2026
  },
  'ZA': {
    'MX': [
      { date: '2010-06-11', comp: 'WM', venue: 'Johannesburg (Soccer City)', attendance: 84490, result: '1:1', scorers: ['Tshabalala', 'Márquez'], source: 'fifa.com' },
      { date: '2005-07-08', comp: 'CONCACAF Gold Cup', venue: 'Carson (CA)', attendance: 19205, result: '2:1', scorers: ['P. Evans', 'Van Heerden', 'Maza'], source: 'espn.com' },
      { date: '2000-06-07', comp: 'Friendly', venue: 'Dallas (Cotton Bowl)', attendance: 30000, result: '2:4', scorers: [], source: 'national-football-teams.com' },
      { date: '1993-10-06', comp: 'Friendly', venue: 'Los Angeles (Memorial Coliseum)', attendance: 37000, result: '0:4', scorers: [], source: 'national-football-teams.com' },
    ],
    'KR': [], // Never played (senior) - first meeting at WM 2026
  },
  // GROUP C: Brazil, Morocco, Haiti, Scotland
  'SCO': {
    'BR': [
      { date: '2011-03-27', comp: 'Friendly', venue: 'London (Emirates)', attendance: 53087, result: '0:2', scorers: ['Neymar 2'], source: '11v11.com, arsenal.com' },
      { date: '1998-06-10', comp: 'WM', venue: 'Paris (Stade de France)', attendance: 80000, result: '1:2', scorers: ['Collins (P)', 'César Sampaio', 'Boyd (ET)'], source: 'fifa.com' },
      { date: '1990-06-20', comp: 'WM', venue: 'Turin', attendance: 62628, result: '0:1', scorers: ['Müller'], source: 'fifa.com' },
      { date: '1987-05-26', comp: 'Rous Cup', venue: 'Glasgow (Hampden)', attendance: 41384, result: '0:2', scorers: ['Valdo', 'Raí'], source: 'rsssf.org' },
      { date: '1982-06-18', comp: 'WM', venue: 'Sevilla', attendance: 47379, result: '1:4', scorers: ['Narey', 'Zico', 'Oscar', 'Eder', 'Falcão'], source: 'fifa.com' },
      { date: '1977-06-23', comp: 'Friendly', venue: 'Rio (Maracanã)', attendance: 69763, result: '0:2', scorers: ['Zico', 'Cerezo'], source: 'eu-football.info' },
      { date: '1974-06-18', comp: 'WM', venue: 'Frankfurt', attendance: 62000, result: '0:0', scorers: [], source: 'fifa.com' },
      { date: '1973-06-30', comp: 'Friendly', venue: 'Glasgow (Hampden)', attendance: 78181, result: '0:1', scorers: ['Johnstone (OG)'], source: 'scottishfa.co.uk' },
      { date: '1972-07-05', comp: 'Independence Cup', venue: 'Rio (Maracanã)', attendance: 130000, result: '0:1', scorers: ['Jairzinho'], source: 'rsssf.org' },
      { date: '1966-06-25', comp: 'Friendly', venue: 'Glasgow (Hampden)', attendance: 74933, result: '1:1', scorers: ['Chalmers', 'Servílio'], source: 'scottishfa.co.uk' },
    ],
    'MA': [
      { date: '1998-06-23', comp: 'WM', venue: 'Saint-Etienne', attendance: 30600, result: '0:3', scorers: ['Bassir 2', 'Hadda'], source: 'fifa.com' },
    ],
    'HT': [], // Erstes Aufeinandertreffen bei WM 2026
  },
  'MA': {
    'BR': [
      { date: '2023-03-25', comp: 'Friendly', venue: 'Tanger', attendance: 63500, result: '2:1', scorers: ['Sabiri', 'Boufal', 'Casemiro'], source: 'fifa.com' },
      { date: '1998-06-16', comp: 'WM', venue: 'Nantes', attendance: 35500, result: '0:3', scorers: [], source: 'fifa.com' },
    ],
    'SCO': [
      { date: '1998-06-23', comp: 'WM', venue: 'Saint-Etienne', attendance: 30600, result: '3:0', scorers: ['Bassir 2', 'Hadda'] },
    ],
    'HT': [], // Erstes Aufeinandertreffen bei WM 2026
  },
  // GROUP E: Germany, Curaçao, Ivory Coast, Ecuador (DE already has some entries)
  'EC': {
    'DE': [
      { date: '2013-05-29', comp: 'Friendly', venue: 'Boca Raton', attendance: 9000, result: '2:4', scorers: ['Valencia', 'Ayoví', 'Podolski 2', 'Lars Bender 2'], source: 'espn.com' },
      { date: '2006-06-20', comp: 'WM', venue: 'Berlin', attendance: 72000, result: '0:3', scorers: ['Klose 2', 'Podolski'] },
    ],
    'CI': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'CW': [], // Erstes Aufeinandertreffen bei WM 2026 - Ecuador spielt nicht im Gold Cup
  },
  'CI': {
    'DE': [
      { date: '2009-11-18', comp: 'Friendly', venue: 'München', attendance: 33015, result: '2:2', scorers: ['Eboué (ET)', 'Doumbia', 'Podolski 2'] },
    ],
    'EC': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'CW': [], // Erstes Aufeinandertreffen bei WM 2026
  },
  // GROUP F: Netherlands, Japan, Tunisia
  'NL': {
    'JP': [
      { date: '2013-11-16', comp: 'Friendly', venue: 'Genk', attendance: 18000, result: '2:2', scorers: ['Van der Vaart', 'Robben', 'Osako', 'Honda'], source: 'espn.com' },
      { date: '2010-06-19', comp: 'WM', venue: 'Durban', attendance: 62010, result: '1:0', scorers: ['Sneijder'] },
      { date: '2009-09-05', comp: 'Friendly', venue: 'Enschede', attendance: 24000, result: '3:0', scorers: ['Van Persie', 'Sneijder', 'Huntelaar'], source: 'espn.com' },
    ],
    'TN': [
      { date: '2009-02-11', comp: 'Friendly', venue: 'Rades', attendance: 17000, result: '1:1', scorers: ['Huntelaar', 'Saihi'], source: 'dutchnews.nl' },
    ],
  },
  'JP': {
    'NL': [
      { date: '2013-11-16', comp: 'Friendly', venue: 'Genk', attendance: 18000, result: '2:2', scorers: ['Osako', 'Honda', 'Van der Vaart', 'Robben'], source: 'espn.com' },
      { date: '2010-06-19', comp: 'WM', venue: 'Durban', attendance: 62010, result: '0:1', scorers: [] },
      { date: '2009-09-05', comp: 'Friendly', venue: 'Enschede', attendance: 24000, result: '0:3', scorers: [] },
    ],
    'TN': [
      { date: '2002-06-14', comp: 'WM', venue: 'Osaka', attendance: 45213, result: '2:0', scorers: ['Morishima', 'Nakata'] },
    ],
  },
  'TN': {
    'NL': [
      { date: '2009-02-11', comp: 'Friendly', venue: 'Rades', attendance: 17000, result: '1:1', scorers: ['Saihi', 'Huntelaar'], source: 'dutchnews.nl' },
    ],
    'JP': [
      { date: '2002-06-14', comp: 'WM', venue: 'Osaka', attendance: 45213, result: '0:2', scorers: [] },
    ],
  },
  // GROUP G: Belgium, Egypt, Iran, New Zealand
  'BE': {
    'EG': [
      { date: '2018-06-06', comp: 'Friendly', venue: 'Brüssel', attendance: 27724, result: '3:0', scorers: ['Lukaku', 'Hazard', 'Fellaini'], source: 'espn.com' },
    ],
    'IR': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'NZ': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele (nur Olympia 2008)
  },
  'EG': {
    'BE': [
      { date: '2018-06-06', comp: 'Friendly', venue: 'Brüssel', attendance: 27724, result: '0:3', scorers: [], source: 'espn.com' },
    ],
    'IR': [
      { date: '2000-06-07', comp: 'LG Cup', venue: 'Teheran (Azadi)', attendance: 80000, result: '1:1 (8:7 i.E.)', scorers: ['Hossam Hassan', 'Ali Daei'], source: 'national-football-teams.com' },
    ],
    'NZ': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  'IR': {
    'BE': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'EG': [
      { date: '2000-06-07', comp: 'LG Cup', venue: 'Teheran (Azadi)', attendance: 80000, result: '1:1 (7:8 i.E.)', scorers: ['Ali Daei', 'Hossam Hassan'], source: 'national-football-teams.com' },
    ],
    'NZ': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  'NZ': {
    'BE': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele (nur Olympia 2008)
    'EG': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'IR': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  // GROUP H: Spain, Uruguay, Saudi Arabia, Cape Verde
  'ES': {
    'UY': [
      { date: '2013-02-06', comp: 'Friendly', venue: 'Doha', attendance: 48000, result: '3:1', scorers: ['Pedro 2', 'Fàbregas', 'Cristian Rodríguez'], source: 'espn.com' },
      { date: '1950-07-09', comp: 'WM', venue: 'São Paulo (Pacaembu)', attendance: 74000, result: '2:2', scorers: ['Basora 2', 'Ghiggia', 'Varela'], source: 'fifa.com' },
    ],
    'SA': [
      { date: '2006-06-23', comp: 'WM', venue: 'Kaiserslautern', attendance: 46000, result: '1:0', scorers: ['Juanito'] },
    ],
    'CV': [], // Erstes Aufeinandertreffen bei WM 2026
  },
  'UY': {
    'ES': [
      { date: '2013-02-06', comp: 'Friendly', venue: 'Doha', attendance: 48000, result: '1:3', scorers: ['Cristian Rodríguez'], source: 'espn.com' },
      { date: '1950-07-09', comp: 'WM', venue: 'São Paulo (Pacaembu)', attendance: 74000, result: '2:2', scorers: ['Ghiggia', 'Varela'], source: 'fifa.com' },
    ],
    'SA': [
      { date: '2018-06-20', comp: 'WM', venue: 'Rostov', attendance: 42678, result: '1:0', scorers: ['Suárez'], source: 'espn.com' },
    ],
    'CV': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  'SA': {
    'ES': [
      { date: '2006-06-23', comp: 'WM', venue: 'Kaiserslautern', attendance: 46000, result: '0:1', scorers: [] },
    ],
    'UY': [
      { date: '2018-06-20', comp: 'WM', venue: 'Rostov', attendance: 42678, result: '0:1', scorers: [], source: 'espn.com' },
    ],
    'CV': [], // Erstes Aufeinandertreffen bei WM 2026
  },
  // GROUP I: France, Senegal, Norway
  'SN': {
    'FR': [
      { date: '2002-05-31', comp: 'WM', venue: 'Seoul', attendance: 62561, result: '1:0', scorers: ['Bouba Diop'] },
    ],
    'NO': [
      { date: '2006-03-01', comp: 'Friendly', venue: 'Dakar (Léopold Sédar Senghor)', attendance: 35000, result: '2:1', scorers: ['Moussa Ndiaye', 'Babacar Gueye', 'Erik Hagen'], source: 'eu-football.info' },
    ],
  },
  'NO': {
    'FR': [
      { date: '2014-05-27', comp: 'Friendly', venue: 'Saint-Denis', attendance: 79000, result: '0:4', scorers: ['Pogba', 'Giroud 2', 'Rémy'], source: 'espn.com' },
    ],
    'SN': [
      { date: '2006-03-01', comp: 'Friendly', venue: 'Dakar (Léopold Sédar Senghor)', attendance: 35000, result: '1:2', scorers: ['Erik Hagen'], source: 'eu-football.info' },
    ],
  },
  // GROUP K: Portugal, Colombia, Uzbekistan
  'PT': {
    'CO': [
      { date: '2014-06-06', comp: 'Friendly', venue: 'Genf', attendance: 20000, result: '1:0', scorers: ['Bruno Alves'], source: '11v11.com' },
    ],
    'UZ': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  'CO': {
    'PT': [
      { date: '2014-06-06', comp: 'Friendly', venue: 'Genf', attendance: 20000, result: '0:1', scorers: [], source: '11v11.com' },
    ],
    'UZ': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  'UZ': {
    'PT': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'CO': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  // GROUP L: England, Croatia, Ghana, Panama
  'GH': {
    'EN': [
      { date: '2011-03-29', comp: 'Friendly', venue: 'Wembley', attendance: 80102, result: '1:1', scorers: ['Gyan', 'Carroll'], source: '11v11.com' },
    ],
    'HR': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'PA': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  'PA': {
    'EN': [
      { date: '2018-06-24', comp: 'WM', venue: 'Nizhny Novgorod', attendance: 43319, result: '1:6', scorers: ['Baloy', 'Stones 2', 'Kane 3 (2P)', 'Lingard'] },
    ],
    'HR': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'GH': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  'HR': {
    'EN': [
      { date: '2021-06-13', comp: 'EM', venue: 'Wembley', attendance: 22500, result: '0:1', scorers: ['Sterling'], source: 'uefa.com' },
      { date: '2018-11-18', comp: 'Nations League', venue: 'Wembley', attendance: 78000, result: '1:2', scorers: ['Kramarić', 'Lingard', 'Kane'], source: 'uefa.com' },
      { date: '2018-10-12', comp: 'Nations League', venue: 'Rijeka', attendance: 8200, result: '0:0', scorers: [], source: 'uefa.com' },
      { date: '2018-07-11', comp: 'WM HF', venue: 'Moskau', attendance: 78011, result: '2:1 n.V.', scorers: ['Perišić', 'Mandžukić', 'Trippier'], source: 'fifa.com' },
      { date: '2009-09-09', comp: 'WM-Quali', venue: 'Wembley', attendance: 85512, result: '1:5', scorers: ['Eduardo', 'Lampard 2', 'Gerrard', 'Rooney', 'Crouch'], source: '11v11.com' },
      { date: '2008-09-10', comp: 'WM-Quali', venue: 'Zagreb', attendance: 35000, result: '1:4', scorers: ['Klasnić', 'Walcott 3', 'Rooney'], source: '11v11.com' },
      { date: '2007-11-21', comp: 'EM-Quali', venue: 'Wembley', attendance: 88091, result: '3:2', scorers: ['Kranjčar', 'Olić', 'Petrić', 'Lampard (P)', 'Crouch'], source: 'englandstats.com' },
      { date: '2006-10-11', comp: 'EM-Quali', venue: 'Zagreb', attendance: 38000, result: '2:0', scorers: ['Eduardo', 'Neville (ET)'], source: 'englandstats.com' },
      { date: '2004-06-21', comp: 'EM', venue: 'Lissabon', attendance: 63000, result: '2:4', scorers: ['Kovač', 'Tudor', 'Scholes', 'Rooney 2', 'Lampard'], source: 'uefa.com' },
      { date: '2003-08-20', comp: 'Friendly', venue: 'Ipswich', attendance: 29000, result: '1:3', scorers: ['Šimić', 'Owen', 'Rooney', 'Lampard'], source: '11v11.com' },
      { date: '1996-04-24', comp: 'Friendly', venue: 'Wembley', attendance: 34400, result: '0:0', scorers: [], source: '11v11.com' },
    ],
    'GH': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'PA': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
  },
  // GROUP B: Canada, Switzerland, Qatar
  'CA': {
    'CH': [
      { date: '2002-05-15', comp: 'Friendly', venue: 'St. Gallen', attendance: 8000, result: '3:1', scorers: ['Radzinski 2', 'Stalteri', "N'Kufo"], source: '11v11.com' },
    ],
    'QA': [
      { date: '2022-09-23', comp: 'Friendly', venue: 'Wien', attendance: 150, result: '2:0', scorers: ['Larin', 'David'] },
    ],
  },
  'CH': {
    'CA': [
      { date: '2002-05-15', comp: 'Friendly', venue: 'St. Gallen', attendance: 8000, result: '1:3', scorers: ["N'Kufo"], source: '11v11.com' },
    ],
    'QA': [
      { date: '2018-11-14', comp: 'Friendly', venue: 'Lugano', attendance: 4170, result: '0:1', scorers: ['Akram Afif'], source: 'skysports.com' },
    ],
  },
  'QA': {
    'CA': [
      { date: '2022-09-23', comp: 'Friendly', venue: 'Wien', attendance: 150, result: '0:2', scorers: [] },
    ],
    'CH': [
      { date: '2018-11-14', comp: 'Friendly', venue: 'Lugano', attendance: 4170, result: '1:0', scorers: ['Akram Afif'], source: 'skysports.com' },
    ],
  },
  // GROUP D: USA, Paraguay, Australia
  'US': {
    'PY': [
      { date: '2025-11-15', comp: 'Friendly', venue: 'Chester', attendance: 18000, result: '2:1', scorers: ['Reyna', 'Balogun', 'Villasanti'] },
      { date: '2016-06-11', comp: 'Copa', venue: 'Philadelphia', attendance: 51000, result: '1:0', scorers: ['Dempsey'] },
      { date: '1930-07-17', comp: 'WM', venue: 'Montevideo', attendance: 18306, result: '3:0', scorers: ['Patenaude 3'] },
    ],
    'AU': [
      { date: '2010-06-05', comp: 'Friendly', venue: 'Roodepoort', attendance: 6000, result: '3:1', scorers: ['Buddle 2', 'Gomez', 'Cahill'], source: 'espn.com' },
    ],
  },
  'PY': {
    'US': [
      { date: '2025-11-15', comp: 'Friendly', venue: 'Chester', attendance: 18000, result: '1:2', scorers: ['Villasanti'] },
      { date: '2016-06-11', comp: 'Copa', venue: 'Philadelphia', attendance: 51000, result: '0:1', scorers: [] },
      { date: '1930-07-17', comp: 'WM', venue: 'Montevideo', attendance: 18306, result: '0:3', scorers: [] },
    ],
    'AU': [
      { date: '2006-10-07', comp: 'Friendly', venue: 'Brisbane', attendance: 47609, result: '1:1', scorers: ['Beauchamp (OG)', 'Popovic'], source: '11v11.com' },
    ],
  },
  'AU': {
    'US': [
      { date: '2010-06-05', comp: 'Friendly', venue: 'Roodepoort', attendance: 6000, result: '1:3', scorers: ['Cahill'], source: 'espn.com' },
    ],
    'PY': [
      { date: '2006-10-07', comp: 'Friendly', venue: 'Brisbane', attendance: 47609, result: '1:1', scorers: ['Popovic', 'Beauchamp (OG)'], source: '11v11.com' },
    ],
  },
  // GROUP C: Haiti entries
  'HT': {
    'BR': [
      { date: '2016-06-08', comp: 'Copa America', venue: 'Orlando', attendance: 28241, result: '1:7', scorers: ['Marcelin'] },
      { date: '2004-08-18', comp: 'Friendly', venue: 'Port-au-Prince', attendance: 15000, result: '0:6', scorers: [] },
    ],
    'MA': [], // Erstes Aufeinandertreffen bei WM 2026
    'SCO': [], // Erstes Aufeinandertreffen bei WM 2026
  },
  // GROUP H: Cape Verde entries
  'CV': {
    'ES': [], // Erstes Aufeinandertreffen bei WM 2026
    'UY': [], // Erstes Aufeinandertreffen bei WM 2026 - keine historischen Spiele
    'SA': [], // Erstes Aufeinandertreffen bei WM 2026
  },
  // GROUP E: Curaçao entries
  'CW': {
    'DE': [], // Erstes Aufeinandertreffen bei WM 2026
    'CI': [], // Erstes Aufeinandertreffen bei WM 2026
    'EC': [], // Erstes Aufeinandertreffen bei WM 2026 - Ecuador spielt nicht im Gold Cup
  },
};

// Qualification matches data
const QUALI_MATCHES = {
  'DE': {
    group: 'A',
    confederation: 'UEFA',
    matches: [
      { date: '2024-09-07', opponent: 'HU', venue: 'Düsseldorf (H)', result: '5:0', scorers: ['Füllkrug', 'Musiala', 'Wirtz', 'Havertz', 'Sané'] },
      { date: '2024-09-10', opponent: 'NL', venue: 'Amsterdam (A)', result: '2:2', scorers: ['Undav', 'Füllkrug', 'Gakpo', 'Xavi Simons'] },
      { date: '2024-10-11', opponent: 'BIH', venue: 'Zenica (A)', result: '2:1', scorers: ['Undav', 'Füllkrug', 'Demirović'] },
      { date: '2024-10-14', opponent: 'NL', venue: 'München (H)', result: '1:0', scorers: ['Kimmich'] },
      { date: '2024-11-16', opponent: 'BIH', venue: 'Freiburg (H)', result: '7:0', scorers: ['Musiala 2', 'Wirtz 2', 'Gnabry', 'Sané', 'Havertz'] },
      { date: '2024-11-19', opponent: 'HU', venue: 'Budapest (A)', result: '1:0', scorers: ['Havertz'] },
      { date: '2025-03-20', opponent: 'IT', venue: 'Berlin (H)', result: '2:1', scorers: ['Havertz', 'Musiala', 'Retegui'] },
      { date: '2025-03-23', opponent: 'IT', venue: 'Mailand (A)', result: '3:2', scorers: ['Wirtz', 'Kimmich', 'Füllkrug', 'Chiesa', 'Barella'] },
    ],
    standing: { pos: 1, played: 8, won: 7, drawn: 1, lost: 0, gf: 23, ga: 6, pts: 22 }
  },
  'FR': {
    group: 'B',
    confederation: 'UEFA',
    matches: [
      { date: '2024-09-06', opponent: 'IT', venue: 'Paris (H)', result: '3:1', scorers: ['Mbappé', 'Griezmann', 'Kolo Muani', 'Retegui'] },
      { date: '2024-09-09', opponent: 'BE', venue: 'Lyon (H)', result: '2:0', scorers: ['Kolo Muani', 'Dembélé'] },
      { date: '2024-10-10', opponent: 'ISR', venue: 'Budapest (N)', result: '4:1', scorers: ['Mbappé 2', 'Griezmann', 'Nkunku', 'Gandelman'] },
      { date: '2024-10-14', opponent: 'BE', venue: 'Brüssel (A)', result: '2:1', scorers: ['Kolo Muani', 'Mbappé', 'De Bruyne'] },
      { date: '2024-11-14', opponent: 'ISR', venue: 'Paris (H)', result: '0:0', scorers: [] },
      { date: '2024-11-17', opponent: 'IT', venue: 'Mailand (A)', result: '3:1', scorers: ['Dembélé', 'Rabiot', 'Griezmann', 'Chiesa'] },
    ],
    standing: { pos: 1, played: 6, won: 5, drawn: 1, lost: 0, gf: 14, ga: 4, pts: 16 }
  },
  'EN': {
    group: 'B',
    confederation: 'UEFA',
    matches: [
      { date: '2024-09-07', opponent: 'IE', venue: 'Dublin (A)', result: '2:0', scorers: ['Kane', 'Gordon'] },
      { date: '2024-09-10', opponent: 'FI', venue: 'Wembley (H)', result: '2:0', scorers: ['Kane', 'Saka'] },
      { date: '2024-10-10', opponent: 'GR', venue: 'Wembley (H)', result: '1:2', scorers: ['Bellingham', 'Pavlidis 2'] },
      { date: '2024-10-13', opponent: 'FI', venue: 'Helsinki (A)', result: '3:1', scorers: ['Bellingham', 'Kane', 'Foden', 'Pukki'] },
      { date: '2024-11-14', opponent: 'GR', venue: 'Athen (A)', result: '3:0', scorers: ['Kane 2', 'Palmer'] },
      { date: '2024-11-17', opponent: 'IE', venue: 'Wembley (H)', result: '5:0', scorers: ['Kane 2', 'Bellingham', 'Gordon', 'Saka'] },
    ],
    standing: { pos: 1, played: 6, won: 5, drawn: 0, lost: 1, gf: 16, ga: 3, pts: 15 }
  },
  'ES': {
    group: 'C',
    confederation: 'UEFA',
    matches: [
      { date: '2024-09-05', opponent: 'SRB', venue: 'Belgrad (A)', result: '0:0', scorers: [] },
      { date: '2024-09-08', opponent: 'CH', venue: 'Genf (A)', result: '4:1', scorers: ['Williams', 'Yamal', 'Ferran Torres 2', 'Amdouni'] },
      { date: '2024-10-12', opponent: 'DK', venue: 'Murcia (H)', result: '1:0', scorers: ['Oyarzabal'] },
      { date: '2024-10-15', opponent: 'SRB', venue: 'Córdoba (H)', result: '3:0', scorers: ['Yamal', 'Morata', 'Williams'] },
      { date: '2024-11-15', opponent: 'DK', venue: 'Kopenhagen (A)', result: '2:1', scorers: ['Oyarzabal', 'Hermoso', 'Dolberg'] },
      { date: '2024-11-18', opponent: 'CH', venue: 'Teneriffa (H)', result: '3:2', scorers: ['Fabián', 'Ferran Torres 2', 'Monteiro', 'Zeqiri'] },
    ],
    standing: { pos: 1, played: 6, won: 5, drawn: 1, lost: 0, gf: 13, ga: 4, pts: 16 }
  },
  'AR': {
    group: 'CONMEBOL',
    confederation: 'CONMEBOL',
    matches: [
      { date: '2023-09-07', opponent: 'EC', venue: 'Buenos Aires (H)', result: '1:0', scorers: ['Messi'] },
      { date: '2023-09-12', opponent: 'BO', venue: 'La Paz (A)', result: '3:0', scorers: ['Messi', 'Tagliafico', 'Di María'] },
      { date: '2023-10-12', opponent: 'PY', venue: 'Asunción (A)', result: '1:0', scorers: ['Otamendi'] },
      { date: '2023-10-17', opponent: 'PE', venue: 'Buenos Aires (H)', result: '2:0', scorers: ['Álvarez', 'Paredes'] },
      { date: '2023-11-16', opponent: 'UY', venue: 'Buenos Aires (H)', result: '1:0', scorers: ['Messi'] },
      { date: '2023-11-21', opponent: 'BR', venue: 'Rio (A)', result: '1:0', scorers: ['Otamendi'] },
      { date: '2024-03-21', opponent: 'SV', venue: 'Buenos Aires (H)', result: '3:0', scorers: ['Messi', 'Mac Allister', 'Dybala'] },
      { date: '2024-03-26', opponent: 'CR', venue: 'San José (A)', result: '3:1', scorers: ['Garnacho', 'Álvarez', 'Lo Celso', 'Vargas'] },
      { date: '2024-09-05', opponent: 'CL', venue: 'Buenos Aires (H)', result: '3:0', scorers: ['Mac Allister', 'Álvarez 2'] },
      { date: '2024-09-10', opponent: 'CO', venue: 'Barranquilla (A)', result: '1:2', scorers: ['González', 'James', 'Muñoz'] },
      { date: '2024-10-10', opponent: 'VE', venue: 'Maturín (A)', result: '1:1', scorers: ['Otamendi', 'Rondón'] },
      { date: '2024-10-15', opponent: 'BO', venue: 'Buenos Aires (H)', result: '6:0', scorers: ['Messi 3', 'Álvarez', 'Lautaro', 'Thiago Almada'] },
      { date: '2024-11-14', opponent: 'PY', venue: 'Buenos Aires (H)', result: '2:1', scorers: ['Lautaro', 'Mac Allister', 'Sanabria'] },
      { date: '2024-11-19', opponent: 'PE', venue: 'Lima (A)', result: '1:0', scorers: ['Lautaro'] },
    ],
    standing: { pos: 1, played: 14, won: 11, drawn: 2, lost: 1, gf: 27, ga: 6, pts: 35 }
  },
  'BR': {
    group: 'CONMEBOL',
    confederation: 'CONMEBOL',
    matches: [
      { date: '2023-09-08', opponent: 'BO', venue: 'Belém (H)', result: '5:1', scorers: ['Rodrygo 2', 'Raphinha 2', 'Neymar', 'Moreno'] },
      { date: '2023-09-12', opponent: 'PE', venue: 'Lima (A)', result: '1:0', scorers: ['Neymar'] },
      { date: '2023-10-12', opponent: 'VE', venue: 'Cuiabá (H)', result: '1:0', scorers: ['Raphinha'] },
      { date: '2023-10-17', opponent: 'UY', venue: 'Montevideo (A)', result: '2:0', scorers: ['Raphinha', 'Darwin'] },
      { date: '2023-11-16', opponent: 'CO', venue: 'Barranquilla (A)', result: '2:1', scorers: ['Raphinha', 'Endrick', 'Díaz'] },
      { date: '2023-11-21', opponent: 'AR', venue: 'Rio (H)', result: '0:1', scorers: [] },
      { date: '2024-09-06', opponent: 'EC', venue: 'Curitiba (H)', result: '1:0', scorers: ['Rodrygo'] },
      { date: '2024-09-10', opponent: 'PY', venue: 'Asunción (A)', result: '0:1', scorers: ['Diego Gómez'] },
      { date: '2024-10-10', opponent: 'CL', venue: 'Santiago (A)', result: '2:1', scorers: ['Igor Jesus', 'Luiz Henrique', 'Vargas'] },
      { date: '2024-10-15', opponent: 'PE', venue: 'Brasília (H)', result: '4:0', scorers: ['Raphinha 2', 'Luiz Henrique', 'Savinho'] },
      { date: '2024-11-14', opponent: 'VE', venue: 'Maturín (A)', result: '1:1', scorers: ['Raphinha', 'Segovia'] },
      { date: '2024-11-19', opponent: 'UY', venue: 'Salvador (H)', result: '1:1', scorers: ['Gerson', 'Valverde'] },
    ],
    standing: { pos: 5, played: 12, won: 7, drawn: 3, lost: 2, gf: 19, ga: 8, pts: 24 }
  },
  'US': {
    group: 'Gastgeber',
    confederation: 'CONCACAF',
    matches: [],
    standing: { note: 'Automatisch qualifiziert als Gastgeber' }
  },
  'MX': {
    group: 'Gastgeber',
    confederation: 'CONCACAF',
    matches: [],
    standing: { note: 'Automatisch qualifiziert als Gastgeber' }
  },
  'CA': {
    group: 'Gastgeber',
    confederation: 'CONCACAF',
    matches: [],
    standing: { note: 'Automatisch qualifiziert als Gastgeber' }
  },
};

// RSS API for team news
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

const WM2026TeamBadges = ({ isPremium = false, preselectedTeamCode = null, onTeamSelected = null }) => {
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
  const [teamNews, setTeamNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Handle preselected team from deep link (e.g., from Spiele H2H)
  useEffect(() => {
    if (preselectedTeamCode && badges.length > 0) {
      const team = badges.find(b => b.country_code === preselectedTeamCode);
      if (team) {
        setSelectedTeam(team);
        setActiveModalTab('h2h'); // Switch directly to H2H tab
        if (onTeamSelected) onTeamSelected();
      }
    }
  }, [preselectedTeamCode, badges]);

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

  // Fetch team-specific news when team is selected
  useEffect(() => {
    if (!selectedTeam || mediaSubTab !== 'news') return;

    const fetchTeamNews = async () => {
      setNewsLoading(true);
      setTeamNews([]);

      try {
        const teamName = language === 'en' ? selectedTeam.name_en : selectedTeam.name_de;
        const searchTerms = language === 'en'
          ? `${teamName} national team World Cup 2026`
          : `${teamName} Nationalmannschaft WM 2026`;

        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerms)}&hl=${language === 'en' ? 'en' : 'de'}&gl=${language === 'en' ? 'US' : 'DE'}&ceid=${language === 'en' ? 'US:en' : 'DE:de'}`;

        const response = await fetch(RSS2JSON_API + encodeURIComponent(rssUrl));
        const data = await response.json();

        if (data.status === 'ok' && data.items?.length > 0) {
          const newsItems = data.items.slice(0, 8).map((item, idx) => {
            // Extract source from title
            const titleParts = item.title.split(' - ');
            const source = titleParts.length > 1 ? titleParts.pop() : 'Google News';
            const cleanTitle = titleParts.join(' - ');

            return {
              id: idx,
              title: cleanTitle,
              source,
              date: new Date(item.pubDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE'),
              url: item.link,
            };
          });
          setTeamNews(newsItems);
        }
      } catch (err) {
        console.error('Error fetching team news:', err);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchTeamNews();
  }, [selectedTeam, mediaSubTab, language]);

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
                    {selectedTeam.confederation} • {getGroupForCountry(selectedTeam.country_code) ? `${t('group')} ${getGroupForCountry(selectedTeam.country_code)}` : t('badgesQualified')}
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
                { id: 'media', label: t('badgesTabMedia') },
                { id: 'road2026', label: t('badgesTabRoad2026') },
                { id: 'group', label: t('badgesTabGroup') },
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
                      {t('badgesTabNews')}
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
                      {t('badgesTabVideos')}
                    </button>
                  </div>

                  {/* News Sub-Content */}
                  {mediaSubTab === 'news' && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                        {t('badgesTeamNews') || 'Aktuelle News zu'} {language === 'en' ? selectedTeam.name_en : selectedTeam.name_de}
                      </div>

                      {newsLoading ? (
                        <div style={{ textAlign: 'center', padding: '30px' }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{t('loading') || 'Lädt...'}</div>
                        </div>
                      ) : teamNews.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {teamNews.map((news) => (
                            <a
                              key={news.id}
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block',
                                padding: '12px',
                                background: '#1e293b',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                border: '1px solid #334155',
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ fontSize: '12px', color: 'white', fontWeight: '500', marginBottom: '4px' }}>
                                {news.title}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                                <span>{news.source}</span>
                                <span>{news.date}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📰</div>
                          <div style={{ fontSize: '11px' }}>
                            {t('badgesNoNews') || 'Keine aktuellen News gefunden'}
                          </div>
                        </div>
                      )}
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
                    // Use hardcoded WM2026_GROUPS for correct group assignment
                    const groupCode = getGroupForCountry(selectedTeam.country_code);
                    const opponentCodes = getGroupOpponents(selectedTeam.country_code);
                    const groupOpponents = badges.filter(b =>
                      opponentCodes.includes(b.country_code)
                    );

                    // Use global H2H_DATA
                    const h2hData = H2H_DATA[selectedTeam.country_code] || {};

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
                              {opponentCodes.length > groupOpponents.length && ' + Playoff-Sieger'}
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
                            {scorer.is_active && (scorer.current_club || CURRENT_CLUBS[scorer.player_name]) && (
                              <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '2px' }}>
                                🏟️ {scorer.current_club || CURRENT_CLUBS[scorer.player_name]}
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
                            {legend.is_current_star && (legend.current_club || CURRENT_CLUBS[legend.player_name]) && (
                              <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '2px' }}>
                                🏟️ {legend.current_club || CURRENT_CLUBS[legend.player_name]}
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
                  {(() => {
                    // Use static WM_COACHES_HISTORY data, with database override if available
                    const dbCoaches = coaches[selectedTeam.country_code] || [];
                    const staticCoaches = WM_COACHES_HISTORY[selectedTeam.country_code] || [];

                    // Prefer static data (more complete), but merge with DB if needed
                    const allCoaches = staticCoaches.length > 0 ? staticCoaches : dbCoaches;

                    return allCoaches.length > 0 ? (
                      allCoaches.map((coach, idx) => (
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
                            {coach.wins !== undefined ? `${coach.wins}-${coach.draws}-${coach.losses}` : '–'}
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

              {/* Road to 2026 Tab */}
              {activeModalTab === 'road2026' && (
                <div>
                  {(() => {
                    // Use global QUALI_MATCHES data
                    const qualiData = QUALI_MATCHES[selectedTeam.country_code];

                    // Confederation info
                    const QUALIFICATION_DATA = {
                      'UEFA': { format: 'Gruppenphase', totalSlots: 16, description: '12 Gruppensieger + 4 Playoff-Sieger' },
                      'CONMEBOL': { format: 'Einzelne Liga', totalSlots: 6, description: 'Top 6 von 10 Teams qualifiziert' },
                      'CONCACAF': { format: 'Gruppenphase', totalSlots: 6, description: '3 Gastgeber + 3 weitere Plätze' },
                      'AFC': { format: '3 Runden', totalSlots: 8, description: '8 Teams direkt qualifiziert' },
                      'CAF': { format: 'Gruppenphase', totalSlots: 9, description: '9 Gruppensieger qualifiziert' },
                      'OFC': { format: 'Finale', totalSlots: 1, description: '1 Platz für Ozeanien' },
                    };

                    const confData = QUALIFICATION_DATA[selectedTeam.confederation] || {};

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
                        </div>

                        {qualiData ? (
                          <>
                            {/* Standing Box */}
                            {qualiData.standing && (
                              <div style={{
                                padding: '12px',
                                background: '#1e293b',
                                borderRadius: '8px',
                                border: '1px solid #10b981',
                                marginBottom: '16px'
                              }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                                  ✅ {t('badgesQualified') || 'Qualifiziert'}
                                  {qualiData.group !== 'Gastgeber' && qualiData.group !== 'CONMEBOL' && (
                                    <span style={{ color: '#94a3b8', fontWeight: 'normal', marginLeft: '8px' }}>
                                      Gruppe {qualiData.group}
                                    </span>
                                  )}
                                  {qualiData.group === 'CONMEBOL' && (
                                    <span style={{ color: '#94a3b8', fontWeight: 'normal', marginLeft: '8px' }}>
                                      CONMEBOL Liga
                                    </span>
                                  )}
                                </div>

                                {qualiData.standing.note ? (
                                  <div style={{ fontSize: '11px', color: '#fbbf24' }}>
                                    🏠 {qualiData.standing.note}
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{qualiData.standing.played}</div>
                                        <div style={{ fontSize: '8px', color: '#64748b' }}>Sp</div>
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>{qualiData.standing.won}</div>
                                        <div style={{ fontSize: '8px', color: '#64748b' }}>S</div>
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24' }}>{qualiData.standing.drawn}</div>
                                        <div style={{ fontSize: '8px', color: '#64748b' }}>U</div>
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>{qualiData.standing.lost}</div>
                                        <div style={{ fontSize: '8px', color: '#64748b' }}>N</div>
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>{qualiData.standing.pts}</div>
                                        <div style={{ fontSize: '8px', color: '#64748b' }}>Pkt</div>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                      Tore: {qualiData.standing.gf}:{qualiData.standing.ga} (Diff: {qualiData.standing.gf - qualiData.standing.ga > 0 ? '+' : ''}{qualiData.standing.gf - qualiData.standing.ga})
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Qualification Matches */}
                            {qualiData.matches && qualiData.matches.length > 0 && (
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                                  {t('badgesQualiMatches') || 'Qualifikationsspiele'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {qualiData.matches.map((match, idx) => (
                                    <div key={idx} style={{
                                      padding: '10px 12px',
                                      background: '#1e293b',
                                      borderRadius: '6px',
                                      fontSize: '11px'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div>
                                          <span style={{ color: 'white', fontWeight: '500' }}>vs {match.opponent}</span>
                                          <span style={{ color: '#64748b', marginLeft: '8px' }}>{match.venue}</span>
                                        </div>
                                        <span style={{
                                          color: match.result.startsWith(match.result.split(':')[0] > match.result.split(':')[1] ? '#10b981' : match.result.split(':')[0] === match.result.split(':')[1] ? '#fbbf24' : '#ef4444'),
                                          fontWeight: 'bold'
                                        }}>
                                          {match.result}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '10px' }}>
                                        <span>{match.date}</span>
                                        {match.scorers && match.scorers.length > 0 && (
                                          <span style={{ color: '#fbbf24' }}>⚽ {match.scorers.slice(0, 3).join(', ')}{match.scorers.length > 3 ? '...' : ''}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                            {t('badgesNoQualiData') || 'Qualifikationsdaten werden geladen...'}
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
