import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { supabase } from './supabaseClient';
import AuthModal from './AuthModal';
import WM2026FanGuide from './WM2026FanGuide';
import WM2026Poll from './WM2026Poll';
import SpieleSection from './SpieleSection';
import RanglistenSection from './RanglistenSection';
import { LanguageProvider, useLanguage, LanguageSelector } from './LanguageContext';
import SentimentBarometer from './SentimentBarometer';
import SentimentDashboard from './SentimentDashboardPremium';
import WM2026TeamBadges from './WM2026TeamBadges';

// ==================== NEWS RSS FEED CONFIG ====================
// Comprehensive WM 2026 coverage - all categories

const RSS_FEEDS_DE = [
  // Core Keywords
  { url: 'https://news.google.com/rss/search?q="FuÃŸball-WM+2026"&hl=de&gl=DE&ceid=DE:de', tag: 'WM 2026', tagColor: '#10b981' },
  { url: 'https://news.google.com/rss/search?q="Fussball+WM+2026"&hl=de&gl=DE&ceid=DE:de', tag: 'WM 2026', tagColor: '#10b981' },
  { url: 'https://news.google.com/rss/search?q="Weltmeisterschaft+2026"&hl=de&gl=DE&ceid=DE:de', tag: 'WM 2026', tagColor: '#10b981' },
  { url: 'https://news.google.com/rss/search?q="FIFA+WM+2026"&hl=de&gl=DE&ceid=DE:de', tag: 'FIFA', tagColor: '#3b82f6' },
  { url: 'https://news.google.com/rss/search?q=WM+2026+USA+Kanada+Mexiko&hl=de&gl=DE&ceid=DE:de', tag: 'Gastgeber', tagColor: '#3b82f6' },
  // Gastgeber & Austragungsorte
  { url: 'https://news.google.com/rss/search?q=WM+2026+Gastgeber&hl=de&gl=DE&ceid=DE:de', tag: 'Gastgeber', tagColor: '#3b82f6' },
  { url: 'https://news.google.com/rss/search?q=WM+2026+Spielorte&hl=de&gl=DE&ceid=DE:de', tag: 'Spielorte', tagColor: '#3b82f6' },
  { url: 'https://news.google.com/rss/search?q=WM+2026+Stadien&hl=de&gl=DE&ceid=DE:de', tag: 'Stadien', tagColor: '#3b82f6' },
  // Qualifikation & Teilnehmer
  { url: 'https://news.google.com/rss/search?q=WM+2026+Qualifikation&hl=de&gl=DE&ceid=DE:de', tag: 'Quali', tagColor: '#8b5cf6' },
  { url: 'https://news.google.com/rss/search?q=WM+2026+Nationalmannschaften&hl=de&gl=DE&ceid=DE:de', tag: 'Teams', tagColor: '#8b5cf6' },
  // Tickets & Fans
  { url: 'https://news.google.com/rss/search?q=WM+2026+Tickets&hl=de&gl=DE&ceid=DE:de', tag: 'Tickets', tagColor: '#f59e0b' },
  { url: 'https://news.google.com/rss/search?q=WM+2026+Reisen&hl=de&gl=DE&ceid=DE:de', tag: 'Reisen', tagColor: '#f59e0b' },
  // Stars & Teams
  { url: 'https://news.google.com/rss/search?q=WM+2026+Favoriten&hl=de&gl=DE&ceid=DE:de', tag: 'Favoriten', tagColor: '#ef4444' },
  { url: 'https://news.google.com/rss/search?q=WM+2026+Stars&hl=de&gl=DE&ceid=DE:de', tag: 'Stars', tagColor: '#ef4444' },
  // ðŸ‡¦ðŸ‡¹ Ã–sterreich
  { url: 'https://news.google.com/rss/search?q=Ã–FB+WM+2026&hl=de&gl=AT&ceid=AT:de', tag: 'ðŸ‡¦ðŸ‡¹ Ã–FB', tagColor: '#ef4444' },
  // ðŸ‡¨ðŸ‡­ Schweiz
  { url: 'https://news.google.com/rss/search?q=Nati+WM+2026&hl=de&gl=CH&ceid=CH:de', tag: 'ðŸ‡¨ðŸ‡­ Nati', tagColor: '#ef4444' },
];

const RSS_FEEDS_EN = [
  // Core Keywords
  { url: 'https://news.google.com/rss/search?q="World+Cup+2026"&hl=en&gl=US&ceid=US:en', tag: 'World Cup', tagColor: '#10b981' },
  { url: 'https://news.google.com/rss/search?q="FIFA+World+Cup+2026"&hl=en&gl=US&ceid=US:en', tag: 'FIFA', tagColor: '#10b981' },
  { url: 'https://news.google.com/rss/search?q="2026+World+Cup"&hl=en&gl=US&ceid=US:en', tag: 'World Cup', tagColor: '#10b981' },
  { url: 'https://news.google.com/rss/search?q=World+Cup+USA+Canada+Mexico+2026&hl=en&gl=US&ceid=US:en', tag: 'Hosts', tagColor: '#3b82f6' },
  // Venues & Schedule
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+venues&hl=en&gl=US&ceid=US:en', tag: 'Venues', tagColor: '#3b82f6' },
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+stadiums&hl=en&gl=US&ceid=US:en', tag: 'Stadiums', tagColor: '#3b82f6' },
  // Qualification
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+qualification&hl=en&gl=US&ceid=US:en', tag: 'Qualifiers', tagColor: '#8b5cf6' },
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+teams&hl=en&gl=US&ceid=US:en', tag: 'Teams', tagColor: '#8b5cf6' },
  // Tickets & Fans
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+tickets&hl=en&gl=US&ceid=US:en', tag: 'Tickets', tagColor: '#f59e0b' },
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+travel&hl=en&gl=US&ceid=US:en', tag: 'Travel', tagColor: '#f59e0b' },
  // Stars & Teams
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+favorites&hl=en&gl=US&ceid=US:en', tag: 'Favorites', tagColor: '#ef4444' },
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+stars&hl=en&gl=US&ceid=US:en', tag: 'Stars', tagColor: '#ef4444' },
  // Broadcasting
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026+streaming&hl=en&gl=US&ceid=US:en', tag: 'Streaming', tagColor: '#ec4899' },
  // ðŸ‡¬ðŸ‡§ UK
  { url: 'https://news.google.com/rss/search?q=World+Cup+2026&hl=en&gl=GB&ceid=GB:en', tag: 'ðŸ‡¬ðŸ‡§ UK', tagColor: '#3b82f6' },
];

// RSS Parser using rss2json.com (free, 10k requests/day)
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Keywords to filter OUT (other sports that might appear)
const EXCLUDE_KEYWORDS = [
  // Darts
  'dart', 'darts', 'pdc', 'bdo', 'dartn',
  // Cricket
  'cricket', 't20', 't-20', 'icc', 'ipl', 'bcci', 'ashes', 'test match', 'cricinfo', 'espncricinfo',
  // Basketball
  'basketball', 'nba', 'euroleague', 'fiba',
  // Handball
  'handball', 'ehf',
  // Hockey/Eishockey
  'eishockey', 'hockey', 'nhl', 'iihf',
  // Tennis
  'tennis', 'atp', 'wta', 'wimbledon', 'us open tennis', 'roland garros',
  // Other ball sports
  'volleyball', 'rugby', 'baseball', 'mlb', 'softball',
  // American Football
  'nfl', 'super bowl', 'american football',
  // Motorsport
  'formel 1', 'formula 1', 'f1', 'motogp', 'nascar', 'indycar',
  // Combat sports
  'boxing', 'boxen', 'ufc', 'mma', 'wrestling', 'wwe',
  // Golf
  'golf', 'pga', 'lpga', 'masters golf',
  // Winter sports
  'ski', 'skiing', 'biathlon', 'bob', 'rodeln', 'eiskunstlauf', 'figure skating', 'curling',
  // Athletics/Swimming
  'leichtathletik', 'athletics', 'swimming', 'schwimmen', 'marathon',
  // Olympics (when not football related)
  'olympia', 'olympics', 'paralympics', 'ioc',
  // Cycling
  'tour de france', 'giro', 'cycling', 'radsport',
  // E-Sports
  'esport', 'e-sport', 'gaming',
  // Other
  'snooker', 'billard', 'poker', 'chess', 'schach'
];

// Must contain at least one of these to be considered football-related
const INCLUDE_KEYWORDS = [
  'fuÃŸball', 'fussball', 'football', 'soccer', 'fifa', 
  'nationalmannschaft', 'national team',
  'wm 2026', 'world cup 2026', 'weltmeisterschaft',
  'stadion', 'stadium', 'qualifikation', 'qualification', 'qualifier',
  'world cup', 'copa', 'coupe du monde', 'usa 2026', 'mexico 2026', 'canada 2026',
  'usmnt', 'concacaf', 'uefa', 'team usa', 'lionel messi', 'mbappe', 'haaland'
];

async function fetchRSSNews(lang = 'de') {
  const allNews = [];
  
  // German: Load ALL feeds (DE + EN), English: Only EN feeds
  const feeds = lang === 'en' ? RSS_FEEDS_EN : [...RSS_FEEDS_DE, ...RSS_FEEDS_EN];
  
  // Fetch all feeds in parallel for speed
  const feedPromises = feeds.map(async (feed) => {
    try {
      const response = await fetch(RSS2JSON_API + encodeURIComponent(feed.url));
      const data = await response.json();
      
      // Detect language from feed URL
      const isGerman = feed.url.includes('hl=de');
      const langFlag = isGerman ? 'ðŸ‡©ðŸ‡ª' : 'ðŸ‡ºðŸ‡¸';
      
      if (data.status === 'ok' && data.items) {
        return data.items.slice(0, 3).map((item, index) => {
          // Extract source from title (Google News format: "Title - Source")
          const titleParts = item.title.split(' - ');
          const source = titleParts.length > 1 ? titleParts.pop() : 'News';
          const title = titleParts.join(' - ');
          
          // Filter out non-football content
          const titleLower = title.toLowerCase();
          const sourceLower = source.toLowerCase();
          const descLower = (item.description || '').toLowerCase();
          const fullText = titleLower + ' ' + sourceLower + ' ' + descLower;
          
          // Check if excluded sport
          const isExcluded = EXCLUDE_KEYWORDS.some(keyword => 
            fullText.includes(keyword)
          );
          
          // Check if it contains football-related keywords
          const isFootballRelated = INCLUDE_KEYWORDS.some(keyword =>
            fullText.includes(keyword)
          );
          
          // Skip if excluded OR if not clearly football-related
          if (isExcluded || !isFootballRelated) return null;
          
          // Format date based on language
          const pubDate = new Date(item.pubDate);
          const formattedDate = pubDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
          
          // Clean description
          let summary = item.description?.replace(/<[^>]*>/g, '') || '';
          summary = summary.substring(0, 120) + (summary.length > 120 ? '...' : '');
          
          return {
            id: `${feed.tag}-${index}-${pubDate.getTime()}`,
            title: title,
            summary: summary,
            date: formattedDate,
            timestamp: pubDate.getTime(),
            tag: `${langFlag} ${source.substring(0, 12)}`,
            tagColor: feed.tagColor,
            url: item.link,
            source: source,
            lang: isGerman ? 'de' : 'en',
            category: feed.tag
          };
        }).filter(Boolean); // Remove null items
      }
      return [];
    } catch (error) {
      console.error('Error fetching RSS:', error);
      return [];
    }
  });
  
  // Wait for all feeds
  const results = await Promise.all(feedPromises);
  results.forEach(items => allNews.push(...items));
  
  // Sort by timestamp (newest first) and remove duplicates by title similarity
  allNews.sort((a, b) => b.timestamp - a.timestamp);
  
  const uniqueNews = allNews.filter((item, index, self) => {
    // Check for duplicate titles (case-insensitive, first 50 chars)
    const titleStart = item.title.toLowerCase().substring(0, 50);
    return index === self.findIndex(t => t.title.toLowerCase().substring(0, 50) === titleStart);
  });
  
  return uniqueNews.slice(0, 30); // Return top 30 news
}

// ==================== MATCH DATA - ALL 104 MATCHES ====================
const matchData = [
  // GRUPPENPHASE - Tag 1-3
  { id: 1, date: "2026-06-11", group: "A", team1: "Mexiko", team2: "SÃ¼dafrika", city: "Mexico City", stadium: "Estadio Azteca", type: "Gruppenphase", localTime: "12:00", cetTime: "21:00" },
  { id: 2, date: "2026-06-11", group: "A", team1: "SÃ¼dkorea", team2: "DÃ¤nemark", city: "Guadalajara", stadium: "Estadio Akron", type: "Gruppenphase", localTime: "19:00", cetTime: "04:00" },
  { id: 3, date: "2026-06-12", group: "B", team1: "Kanada", team2: "Italien", city: "Toronto", stadium: "BMO Field", type: "Gruppenphase", localTime: "15:00", cetTime: "21:00" },
  { id: 4, date: "2026-06-12", group: "D", team1: "USA", team2: "Paraguay", city: "Los Angeles", stadium: "SoFi Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 5, date: "2026-06-13", group: "C", team1: "Haiti", team2: "Schottland", city: "Boston", stadium: "Gillette Stadium", type: "Gruppenphase", localTime: "21:00", cetTime: "03:00" },
  { id: 6, date: "2026-06-13", group: "D", team1: "Australien", team2: "TÃ¼rkei", city: "Vancouver", stadium: "BC Place", type: "Gruppenphase", localTime: "21:00", cetTime: "06:00" },
  { id: 7, date: "2026-06-13", group: "C", team1: "Brasilien", team2: "Marokko", city: "New York", stadium: "MetLife Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 8, date: "2026-06-13", group: "B", team1: "Katar", team2: "Schweiz", city: "San Francisco", stadium: "Levi's Stadium", type: "Gruppenphase", localTime: "12:00", cetTime: "21:00" },
  { id: 9, date: "2026-06-14", group: "E", team1: "ElfenbeinkÃ¼ste", team2: "Ecuador", city: "Philadelphia", stadium: "Lincoln Financial Field", type: "Gruppenphase", localTime: "19:00", cetTime: "01:00" },
  { id: 10, date: "2026-06-14", group: "E", team1: "Deutschland", team2: "CuraÃ§ao", city: "Houston", stadium: "NRG Stadium", type: "Gruppenphase", localTime: "13:00", cetTime: "20:00" },
  { id: 11, date: "2026-06-14", group: "F", team1: "Niederlande", team2: "Japan", city: "Dallas", stadium: "AT&T Stadium", type: "Gruppenphase", localTime: "16:00", cetTime: "23:00" },
  { id: 12, date: "2026-06-14", group: "F", team1: "Ukraine", team2: "Tunesien", city: "Monterrey", stadium: "Estadio BBVA", type: "Gruppenphase", localTime: "21:00", cetTime: "04:00" },
  { id: 13, date: "2026-06-15", group: "H", team1: "Saudi-Arabien", team2: "Uruguay", city: "Miami", stadium: "Hard Rock Stadium", type: "Gruppenphase", localTime: "12:00", cetTime: "18:00" },
  { id: 14, date: "2026-06-15", group: "G", team1: "England", team2: "Senegal", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Gruppenphase", localTime: "15:00", cetTime: "21:00" },
  { id: 15, date: "2026-06-15", group: "G", team1: "Polen", team2: "Panama", city: "Seattle", stadium: "Lumen Field", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 16, date: "2026-06-15", group: "H", team1: "Ã„gypten", team2: "Kolumbien", city: "Kansas City", stadium: "Arrowhead Stadium", type: "Gruppenphase", localTime: "19:00", cetTime: "02:00" },
  { id: 17, date: "2026-06-16", group: "I", team1: "Spanien", team2: "Nigeria", city: "Mexico City", stadium: "Estadio Azteca", type: "Gruppenphase", localTime: "12:00", cetTime: "19:00" },
  { id: 18, date: "2026-06-16", group: "J", team1: "Argentinien", team2: "Algerien", city: "New York", stadium: "MetLife Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 19, date: "2026-06-16", group: "J", team1: "Ã–sterreich", team2: "Jordanien", city: "San Francisco", stadium: "Levi's Stadium", type: "Gruppenphase", localTime: "12:00", cetTime: "21:00" },
  { id: 20, date: "2026-06-16", group: "I", team1: "Serbien", team2: "Neuseeland", city: "Houston", stadium: "NRG Stadium", type: "Gruppenphase", localTime: "19:00", cetTime: "02:00" },
  { id: 21, date: "2026-06-17", group: "K", team1: "Frankreich", team2: "Costa Rica", city: "Los Angeles", stadium: "SoFi Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 22, date: "2026-06-17", group: "L", team1: "Portugal", team2: "Ghana", city: "Dallas", stadium: "AT&T Stadium", type: "Gruppenphase", localTime: "16:00", cetTime: "23:00" },
  { id: 23, date: "2026-06-17", group: "L", team1: "Kroatien", team2: "Iran", city: "Miami", stadium: "Hard Rock Stadium", type: "Gruppenphase", localTime: "12:00", cetTime: "18:00" },
  { id: 24, date: "2026-06-17", group: "K", team1: "Kamerun", team2: "Indonesien", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Gruppenphase", localTime: "15:00", cetTime: "21:00" },
  { id: 25, date: "2026-06-18", group: "A", team1: "SÃ¼dafrika", team2: "SÃ¼dkorea", city: "Guadalajara", stadium: "Estadio Akron", type: "Gruppenphase", localTime: "17:00", cetTime: "00:00" },
  { id: 26, date: "2026-06-18", group: "A", team1: "Mexiko", team2: "DÃ¤nemark", city: "Mexico City", stadium: "Estadio Azteca", type: "Gruppenphase", localTime: "20:00", cetTime: "03:00" },
  { id: 27, date: "2026-06-18", group: "B", team1: "Schweiz", team2: "Kanada", city: "Vancouver", stadium: "BC Place", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 28, date: "2026-06-18", group: "B", team1: "Italien", team2: "Katar", city: "Toronto", stadium: "BMO Field", type: "Gruppenphase", localTime: "15:00", cetTime: "21:00" },
  { id: 29, date: "2026-06-19", group: "C", team1: "Schottland", team2: "Brasilien", city: "Boston", stadium: "Gillette Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 30, date: "2026-06-19", group: "C", team1: "Marokko", team2: "Haiti", city: "Philadelphia", stadium: "Lincoln Financial Field", type: "Gruppenphase", localTime: "15:00", cetTime: "21:00" },
  { id: 31, date: "2026-06-19", group: "D", team1: "Paraguay", team2: "Australien", city: "Seattle", stadium: "Lumen Field", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 32, date: "2026-06-19", group: "D", team1: "TÃ¼rkei", team2: "USA", city: "Los Angeles", stadium: "SoFi Stadium", type: "Gruppenphase", localTime: "21:00", cetTime: "06:00" },
  { id: 33, date: "2026-06-20", group: "E", team1: "Ecuador", team2: "Deutschland", city: "New York", stadium: "MetLife Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 34, date: "2026-06-20", group: "E", team1: "CuraÃ§ao", team2: "ElfenbeinkÃ¼ste", city: "Houston", stadium: "NRG Stadium", type: "Gruppenphase", localTime: "13:00", cetTime: "20:00" },
  { id: 35, date: "2026-06-20", group: "F", team1: "Japan", team2: "Ukraine", city: "Kansas City", stadium: "Arrowhead Stadium", type: "Gruppenphase", localTime: "19:00", cetTime: "02:00" },
  { id: 36, date: "2026-06-20", group: "F", team1: "Tunesien", team2: "Niederlande", city: "Dallas", stadium: "AT&T Stadium", type: "Gruppenphase", localTime: "16:00", cetTime: "23:00" },
  { id: 37, date: "2026-06-21", group: "G", team1: "Senegal", team2: "Polen", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Gruppenphase", localTime: "15:00", cetTime: "21:00" },
  { id: 38, date: "2026-06-21", group: "G", team1: "Panama", team2: "England", city: "Miami", stadium: "Hard Rock Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 39, date: "2026-06-21", group: "H", team1: "Uruguay", team2: "Ã„gypten", city: "San Francisco", stadium: "Levi's Stadium", type: "Gruppenphase", localTime: "12:00", cetTime: "21:00" },
  { id: 40, date: "2026-06-21", group: "H", team1: "Kolumbien", team2: "Saudi-Arabien", city: "Monterrey", stadium: "Estadio BBVA", type: "Gruppenphase", localTime: "19:00", cetTime: "02:00" },
  { id: 41, date: "2026-06-22", group: "I", team1: "Nigeria", team2: "Serbien", city: "Houston", stadium: "NRG Stadium", type: "Gruppenphase", localTime: "13:00", cetTime: "20:00" },
  { id: 42, date: "2026-06-22", group: "I", team1: "Neuseeland", team2: "Spanien", city: "Mexico City", stadium: "Estadio Azteca", type: "Gruppenphase", localTime: "17:00", cetTime: "00:00" },
  { id: 43, date: "2026-06-22", group: "J", team1: "Algerien", team2: "Ã–sterreich", city: "New York", stadium: "MetLife Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 44, date: "2026-06-22", group: "J", team1: "Jordanien", team2: "Argentinien", city: "Dallas", stadium: "AT&T Stadium", type: "Gruppenphase", localTime: "16:00", cetTime: "23:00" },
  { id: 45, date: "2026-06-23", group: "K", team1: "Costa Rica", team2: "Kamerun", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Gruppenphase", localTime: "15:00", cetTime: "21:00" },
  { id: 46, date: "2026-06-23", group: "K", team1: "Indonesien", team2: "Frankreich", city: "Los Angeles", stadium: "SoFi Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 47, date: "2026-06-23", group: "L", team1: "Ghana", team2: "Kroatien", city: "Philadelphia", stadium: "Lincoln Financial Field", type: "Gruppenphase", localTime: "19:00", cetTime: "01:00" },
  { id: 48, date: "2026-06-23", group: "L", team1: "Iran", team2: "Portugal", city: "Boston", stadium: "Gillette Stadium", type: "Gruppenphase", localTime: "21:00", cetTime: "03:00" },
  { id: 49, date: "2026-06-24", group: "A", team1: "DÃ¤nemark", team2: "SÃ¼dafrika", city: "Guadalajara", stadium: "Estadio Akron", type: "Gruppenphase", localTime: "17:00", cetTime: "00:00" },
  { id: 50, date: "2026-06-24", group: "A", team1: "SÃ¼dkorea", team2: "Mexiko", city: "Mexico City", stadium: "Estadio Azteca", type: "Gruppenphase", localTime: "17:00", cetTime: "00:00" },
  { id: 51, date: "2026-06-24", group: "B", team1: "Katar", team2: "Kanada", city: "Vancouver", stadium: "BC Place", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 52, date: "2026-06-24", group: "B", team1: "Schweiz", team2: "Italien", city: "Toronto", stadium: "BMO Field", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 53, date: "2026-06-25", group: "C", team1: "Haiti", team2: "Brasilien", city: "New York", stadium: "MetLife Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 54, date: "2026-06-25", group: "C", team1: "Schottland", team2: "Marokko", city: "Boston", stadium: "Gillette Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 55, date: "2026-06-25", group: "D", team1: "TÃ¼rkei", team2: "Paraguay", city: "Seattle", stadium: "Lumen Field", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 56, date: "2026-06-25", group: "D", team1: "Australien", team2: "USA", city: "Los Angeles", stadium: "SoFi Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 57, date: "2026-06-26", group: "E", team1: "CuraÃ§ao", team2: "Ecuador", city: "Philadelphia", stadium: "Lincoln Financial Field", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 58, date: "2026-06-26", group: "E", team1: "Deutschland", team2: "ElfenbeinkÃ¼ste", city: "Houston", stadium: "NRG Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "01:00" },
  { id: 59, date: "2026-06-26", group: "F", team1: "Tunesien", team2: "Japan", city: "Kansas City", stadium: "Arrowhead Stadium", type: "Gruppenphase", localTime: "19:00", cetTime: "02:00" },
  { id: 60, date: "2026-06-26", group: "F", team1: "Ukraine", team2: "Niederlande", city: "Dallas", stadium: "AT&T Stadium", type: "Gruppenphase", localTime: "19:00", cetTime: "02:00" },
  { id: 61, date: "2026-06-27", group: "G", team1: "Panama", team2: "Senegal", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 62, date: "2026-06-27", group: "G", team1: "Polen", team2: "England", city: "Miami", stadium: "Hard Rock Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 63, date: "2026-06-27", group: "H", team1: "Kolumbien", team2: "Uruguay", city: "San Francisco", stadium: "Levi's Stadium", type: "Gruppenphase", localTime: "15:00", cetTime: "00:00" },
  { id: 64, date: "2026-06-27", group: "H", team1: "Ã„gypten", team2: "Saudi-Arabien", city: "Monterrey", stadium: "Estadio BBVA", type: "Gruppenphase", localTime: "18:00", cetTime: "01:00" },
  { id: 65, date: "2026-06-28", group: "I", team1: "Neuseeland", team2: "Nigeria", city: "Houston", stadium: "NRG Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "01:00" },
  { id: 66, date: "2026-06-28", group: "I", team1: "Serbien", team2: "Spanien", city: "Mexico City", stadium: "Estadio Azteca", type: "Gruppenphase", localTime: "18:00", cetTime: "01:00" },
  { id: 67, date: "2026-06-28", group: "J", team1: "Jordanien", team2: "Algerien", city: "New York", stadium: "MetLife Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 68, date: "2026-06-28", group: "J", team1: "Ã–sterreich", team2: "Argentinien", city: "Kansas City", stadium: "Arrowhead Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "01:00" },
  { id: 69, date: "2026-06-29", group: "K", team1: "Indonesien", team2: "Costa Rica", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 70, date: "2026-06-29", group: "K", team1: "Kamerun", team2: "Frankreich", city: "Los Angeles", stadium: "SoFi Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "03:00" },
  { id: 71, date: "2026-06-29", group: "L", team1: "Iran", team2: "Ghana", city: "Philadelphia", stadium: "Lincoln Financial Field", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  { id: 72, date: "2026-06-29", group: "L", team1: "Kroatien", team2: "Portugal", city: "Boston", stadium: "Gillette Stadium", type: "Gruppenphase", localTime: "18:00", cetTime: "00:00" },
  // SECHZEHNTELFINALE (Round of 32)
  { id: 73, date: "2026-06-30", group: null, team1: "1. Gruppe A", team2: "3. C/D/E/F", city: "Mexico City", stadium: "Estadio Azteca", type: "Sechzehntelfinale", localTime: "12:00", cetTime: "19:00" },
  { id: 74, date: "2026-06-30", group: null, team1: "2. Gruppe C", team2: "2. Gruppe E", city: "New York", stadium: "MetLife Stadium", type: "Sechzehntelfinale", localTime: "15:00", cetTime: "21:00" },
  { id: 75, date: "2026-06-30", group: null, team1: "1. Gruppe D", team2: "3. A/B/C/F", city: "Los Angeles", stadium: "SoFi Stadium", type: "Sechzehntelfinale", localTime: "18:00", cetTime: "03:00" },
  { id: 76, date: "2026-06-30", group: null, team1: "2. Gruppe A", team2: "2. Gruppe F", city: "Guadalajara", stadium: "Estadio Akron", type: "Sechzehntelfinale", localTime: "17:00", cetTime: "00:00" },
  { id: 77, date: "2026-07-01", group: null, team1: "1. Gruppe C", team2: "3. A/B/D/E", city: "Boston", stadium: "Gillette Stadium", type: "Sechzehntelfinale", localTime: "12:00", cetTime: "18:00" },
  { id: 78, date: "2026-07-01", group: null, team1: "1. Gruppe E", team2: "2. Gruppe D", city: "Houston", stadium: "NRG Stadium", type: "Sechzehntelfinale", localTime: "15:00", cetTime: "22:00" },
  { id: 79, date: "2026-07-01", group: null, team1: "1. Gruppe F", team2: "3. G/H/I/J", city: "Dallas", stadium: "AT&T Stadium", type: "Sechzehntelfinale", localTime: "18:00", cetTime: "01:00" },
  { id: 80, date: "2026-07-01", group: null, team1: "1. Gruppe B", team2: "2. Gruppe B", city: "Toronto", stadium: "BMO Field", type: "Sechzehntelfinale", localTime: "18:00", cetTime: "00:00" },
  { id: 81, date: "2026-07-02", group: null, team1: "1. Gruppe G", team2: "3. H/I/J/K", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Sechzehntelfinale", localTime: "12:00", cetTime: "18:00" },
  { id: 82, date: "2026-07-02", group: null, team1: "1. Gruppe I", team2: "2. Gruppe L", city: "Philadelphia", stadium: "Lincoln Financial Field", type: "Sechzehntelfinale", localTime: "15:00", cetTime: "21:00" },
  { id: 83, date: "2026-07-02", group: null, team1: "1. Gruppe H", team2: "3. G/I/K/L", city: "Miami", stadium: "Hard Rock Stadium", type: "Sechzehntelfinale", localTime: "18:00", cetTime: "00:00" },
  { id: 84, date: "2026-07-02", group: null, team1: "1. Gruppe L", team2: "2. Gruppe I", city: "San Francisco", stadium: "Levi's Stadium", type: "Sechzehntelfinale", localTime: "15:00", cetTime: "00:00" },
  { id: 85, date: "2026-07-03", group: null, team1: "2. Gruppe G", team2: "2. Gruppe H", city: "Seattle", stadium: "Lumen Field", type: "Sechzehntelfinale", localTime: "15:00", cetTime: "00:00" },
  { id: 86, date: "2026-07-03", group: null, team1: "2. Gruppe J", team2: "2. Gruppe K", city: "Kansas City", stadium: "Arrowhead Stadium", type: "Sechzehntelfinale", localTime: "18:00", cetTime: "01:00" },
  { id: 87, date: "2026-07-03", group: null, team1: "1. Gruppe J", team2: "3. E/F/G/L", city: "Monterrey", stadium: "Estadio BBVA", type: "Sechzehntelfinale", localTime: "17:00", cetTime: "00:00" },
  { id: 88, date: "2026-07-03", group: null, team1: "1. Gruppe K", team2: "3. D/H/I/K", city: "Vancouver", stadium: "BC Place", type: "Sechzehntelfinale", localTime: "18:00", cetTime: "03:00" },
  // ACHTELFINALE
  { id: 89, date: "2026-07-04", group: null, team1: "Sieger 73", team2: "Sieger 74", city: "New York", stadium: "MetLife Stadium", type: "Achtelfinale", localTime: "15:00", cetTime: "21:00" },
  { id: 90, date: "2026-07-04", group: null, team1: "Sieger 75", team2: "Sieger 76", city: "Los Angeles", stadium: "SoFi Stadium", type: "Achtelfinale", localTime: "18:00", cetTime: "03:00" },
  { id: 91, date: "2026-07-05", group: null, team1: "Sieger 77", team2: "Sieger 78", city: "Boston", stadium: "Gillette Stadium", type: "Achtelfinale", localTime: "12:00", cetTime: "18:00" },
  { id: 92, date: "2026-07-05", group: null, team1: "Sieger 79", team2: "Sieger 80", city: "Dallas", stadium: "AT&T Stadium", type: "Achtelfinale", localTime: "18:00", cetTime: "01:00" },
  { id: 93, date: "2026-07-06", group: null, team1: "Sieger 81", team2: "Sieger 82", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Achtelfinale", localTime: "12:00", cetTime: "18:00" },
  { id: 94, date: "2026-07-06", group: null, team1: "Sieger 83", team2: "Sieger 84", city: "Miami", stadium: "Hard Rock Stadium", type: "Achtelfinale", localTime: "18:00", cetTime: "00:00" },
  { id: 95, date: "2026-07-07", group: null, team1: "Sieger 85", team2: "Sieger 86", city: "Kansas City", stadium: "Arrowhead Stadium", type: "Achtelfinale", localTime: "15:00", cetTime: "22:00" },
  { id: 96, date: "2026-07-07", group: null, team1: "Sieger 87", team2: "Sieger 88", city: "Philadelphia", stadium: "Lincoln Financial Field", type: "Achtelfinale", localTime: "18:00", cetTime: "00:00" },
  // VIERTELFINALE
  { id: 97, date: "2026-07-09", group: null, team1: "Sieger 89", team2: "Sieger 90", city: "New York", stadium: "MetLife Stadium", type: "Viertelfinale", localTime: "15:00", cetTime: "21:00" },
  { id: 98, date: "2026-07-09", group: null, team1: "Sieger 91", team2: "Sieger 92", city: "Dallas", stadium: "AT&T Stadium", type: "Viertelfinale", localTime: "18:00", cetTime: "01:00" },
  { id: 99, date: "2026-07-10", group: null, team1: "Sieger 93", team2: "Sieger 94", city: "Miami", stadium: "Hard Rock Stadium", type: "Viertelfinale", localTime: "15:00", cetTime: "21:00" },
  { id: 100, date: "2026-07-10", group: null, team1: "Sieger 95", team2: "Sieger 96", city: "Los Angeles", stadium: "SoFi Stadium", type: "Viertelfinale", localTime: "18:00", cetTime: "03:00" },
  // HALBFINALE
  { id: 101, date: "2026-07-14", group: null, team1: "Sieger 97", team2: "Sieger 98", city: "Dallas", stadium: "AT&T Stadium", type: "Halbfinale", localTime: "15:00", cetTime: "22:00" },
  { id: 102, date: "2026-07-15", group: null, team1: "Sieger 99", team2: "Sieger 100", city: "Atlanta", stadium: "Mercedes-Benz Stadium", type: "Halbfinale", localTime: "15:00", cetTime: "21:00" },
  // SPIEL UM PLATZ 3 & FINALE
  { id: 103, date: "2026-07-18", group: null, team1: "Verlierer 101", team2: "Verlierer 102", city: "Miami", stadium: "Hard Rock Stadium", type: "Spiel um Platz 3", localTime: "15:00", cetTime: "21:00" },
  { id: 104, date: "2026-07-19", group: null, team1: "Sieger 101", team2: "Sieger 102", city: "New York", stadium: "MetLife Stadium", type: "Finale", localTime: "15:00", cetTime: "21:00" },
];

// ==================== TEAM INFORMATION ====================
const teamInfo = {
  "Deutschland": { flag: "ðŸ‡©ðŸ‡ª", news: "Musiala & Wirtz in Topform. Nagelsmann baut auf junge Spieler.", strength: 88 },
  "Frankreich": { flag: "ðŸ‡«ðŸ‡·", news: "MbappÃ© bei Real Madrid. Deschamps plant letztes Turnier.", strength: 90 },
  "Brasilien": { flag: "ðŸ‡§ðŸ‡·", news: "Ancelotti neuer Trainer! Vinicius Jr. & Rodrygo fÃ¼hren an.", strength: 89 },
  "Argentinien": { flag: "ðŸ‡¦ðŸ‡·", news: "Messi (39) letzte WM? Titelverteidiger mit Ãlvarez & Mac Allister.", strength: 91 },
  "England": { flag: "ðŸ´ó §ó ¢ó ¥ó ®ó §ó ¿", news: "Tuchel neuer Trainer! Bellingham, Saka, Foden in Hochform.", strength: 87 },
  "Spanien": { flag: "ðŸ‡ªðŸ‡¸", news: "Lamine Yamal (17) Superstar! Euro 2024 Sieger.", strength: 89 },
  "Portugal": { flag: "ðŸ‡µðŸ‡¹", news: "Ronaldo (41) dabei! Bruno Fernandes & Rafael LeÃ£o fÃ¼hren.", strength: 86 },
  "Niederlande": { flag: "ðŸ‡³ðŸ‡±", news: "Koeman setzt auf Gakpo, Simons & de Jong.", strength: 85 },
  "Italien": { flag: "ðŸ‡®ðŸ‡¹", news: "Nach EM-Aus im Umbruch. Tonali zurÃ¼ck, junge Talente.", strength: 84 },
  "Kroatien": { flag: "ðŸ‡­ðŸ‡·", news: "ModriÄ‡ (40) Abschiedstour? Goldene Generation endet.", strength: 83 },
  "USA": { flag: "ðŸ‡ºðŸ‡¸", news: "Heimvorteil! Pulisic, McKennie & Reyna wollen Geschichte schreiben.", strength: 82 },
  "Mexiko": { flag: "ðŸ‡²ðŸ‡½", news: "Co-Gastgeber trÃ¤umt vom Viertelfinal-Fluch brechen.", strength: 80 },
  "Kanada": { flag: "ðŸ‡¨ðŸ‡¦", news: "Davies als Star. Erste WM als Gastgeber.", strength: 78 },
  "Ã–sterreich": { flag: "ðŸ‡¦ðŸ‡¹", news: "Rangnick-Revolution! Laimer, Sabitzer & ArnautoviÄ‡.", strength: 79 },
  "Schweiz": { flag: "ðŸ‡¨ðŸ‡­", news: "Xhaka fÃ¼hrt, Yakin baut neue Generation auf.", strength: 80 },
  "Japan": { flag: "ðŸ‡¯ðŸ‡µ", news: "Kubo, Mitoma, Doan - schnellste Offensive Asiens.", strength: 81 },
  "SÃ¼dkorea": { flag: "ðŸ‡°ðŸ‡·", news: "Son Heung-min letzte WM? Kim Min-jae Weltklasse.", strength: 79 },
  "Australien": { flag: "ðŸ‡¦ðŸ‡º", news: "Socceroos mit Erfahrung. Physische Spielweise.", strength: 75 },
  "Saudi-Arabien": { flag: "ðŸ‡¸ðŸ‡¦", news: "WM 2034 Gastgeber. Al-Dawsari noch dabei.", strength: 74 },
  "Katar": { flag: "ðŸ‡¶ðŸ‡¦", news: "Asien-Meister will WM-Debakel 2022 vergessen.", strength: 73 },
  "Marokko": { flag: "ðŸ‡²ðŸ‡¦", news: "Nach Halbfinale 2022 hohe Erwartungen. Hakimi, En-Nesyri.", strength: 82 },
  "Senegal": { flag: "ðŸ‡¸ðŸ‡³", news: "Afrika-Meister mit ManÃ© in Saudi-Form.", strength: 80 },
  "Nigeria": { flag: "ðŸ‡³ðŸ‡¬", news: "Super Eagles mit Osimhen als HoffnungstrÃ¤ger.", strength: 78 },
  "ElfenbeinkÃ¼ste": { flag: "ðŸ‡¨ðŸ‡®", news: "Afrika-Cup 2023 Sieger! Haller & KessiÃ© fÃ¼hren.", strength: 77 },
  "Ghana": { flag: "ðŸ‡¬ðŸ‡­", news: "Black Stars im Generationswechsel.", strength: 74 },
  "Kamerun": { flag: "ðŸ‡¨ðŸ‡²", news: "Unberechenbare LÃ¶wen. Eto'o als Verbandschef.", strength: 75 },
  "Ã„gypten": { flag: "ðŸ‡ªðŸ‡¬", news: "Salah jagt WM-Tor. Pharaonen hungrig.", strength: 77 },
  "SÃ¼dafrika": { flag: "ðŸ‡¿ðŸ‡¦", news: "Bafana Bafana zurÃ¼ck bei WM. AFCON 2023 Dritter.", strength: 72 },
  "Tunesien": { flag: "ðŸ‡¹ðŸ‡³", news: "Adlige des afrikanischen FuÃŸballs.", strength: 73 },
  "Algerien": { flag: "ðŸ‡©ðŸ‡¿", news: "Fennecs wollen 2019er-Magie zurÃ¼ckbringen.", strength: 76 },
  "Uruguay": { flag: "ðŸ‡ºðŸ‡¾", news: "Valverde & NÃºÃ±ez neue Generation. SuÃ¡rez RÃ¼cktritt?", strength: 83 },
  "Kolumbien": { flag: "ðŸ‡¨ðŸ‡´", news: "James RodrÃ­guez Renaissance! DÃ­az & Arias stark.", strength: 81 },
  "Ecuador": { flag: "ðŸ‡ªðŸ‡¨", news: "Junge Talente um Caicedo & PÃ¡ez.", strength: 78 },
  "Paraguay": { flag: "ðŸ‡µðŸ‡¾", news: "Almiron fÃ¼hrt die GuaranÃ­es.", strength: 74 },
  "DÃ¤nemark": { flag: "ðŸ‡©ðŸ‡°", news: "Hjulmand plant. HÃ¸jlund & LindstrÃ¸m neue Stars.", strength: 80 },
  "Serbien": { flag: "ðŸ‡·ðŸ‡¸", news: "VlahoviÄ‡, MitroviÄ‡, TadiÄ‡ - Offensivpower.", strength: 79 },
  "Polen": { flag: "ðŸ‡µðŸ‡±", news: "Lewandowski (37) noch dabei? Zalewski Hoffnung.", strength: 78 },
  "Ukraine": { flag: "ðŸ‡ºðŸ‡¦", news: "Trotz Krieg qualifiziert. Mudryk & Dovbyk als Stars.", strength: 77 },
  "TÃ¼rkei": { flag: "ðŸ‡¹ðŸ‡·", news: "YÄ±ldÄ±z (19) neuer Superstar. Montella bringt System.", strength: 78 },
  "Schottland": { flag: "ðŸ´ó §ó ¢ó ³ó £ó ´ó ¿", news: "Erste WM seit 1998! Robertson fÃ¼hrt.", strength: 74 },
  "Haiti": { flag: "ðŸ‡­ðŸ‡¹", news: "Historische Qualifikation! Gold Cup Ãœberraschung.", strength: 65 },
  "Panama": { flag: "ðŸ‡µðŸ‡¦", news: "Dritte WM-Teilnahme. Canaleros mit Erfahrung.", strength: 70 },
  "Costa Rica": { flag: "ðŸ‡¨ðŸ‡·", news: "Keylor Navas RÃ¼cktritt? Neue Generation gefragt.", strength: 72 },
  "Iran": { flag: "ðŸ‡®ðŸ‡·", news: "Taremi & Azmoun erfahren. Politische Spannungen.", strength: 76 },
  "Neuseeland": { flag: "ðŸ‡³ðŸ‡¿", news: "All Whites Ã¼ber Playoffs. Chris Wood als TorjÃ¤ger.", strength: 68 },
  "Indonesien": { flag: "ðŸ‡®ðŸ‡©", news: "Historisch erste WM! Shin Tae-yong als Architekt.", strength: 62 },
  "CuraÃ§ao": { flag: "ðŸ‡¨ðŸ‡¼", news: "Kleinste Nation der WM! Bachita & Martina fÃ¼hren.", strength: 60 },
  "Jordanien": { flag: "ðŸ‡¯ðŸ‡´", news: "Asien-Cup 2023 Finale! Historischer Erfolg.", strength: 70 },
};

// ==================== TRIVIA QUESTIONS ====================
// Trivia questions loaded from Supabase (1300+ Fragen)

// ==================== TV BROADCAST DATA ====================
// WM 2026 TV-Ãœbertragungen fÃ¼r DACH-Region
const tvBroadcasts = {
  // Ã–ffentlich-rechtliche zeigen ausgewÃ¤hlte Spiele
  free: {
    DE: ['ARD', 'ZDF'],
    AT: ['ORF', 'ServusTV'],
    CH: ['SRF', 'RTS']
  },
  // Alle 104 Spiele nur bei:
  paid: {
    DE: 'MagentaTV',
    AT: 'MagentaTV',
    CH: 'blue Sport'
  }
};

// Welche Spiele sind Free-TV? (ErÃ¶ffnung, Deutschland-Spiele, K.O.-Runde ab Viertelfinale, Finale)
const isFreeTVMatch = (match) => {
  // ErÃ¶ffnungsspiel
  if (match.id === 1) return true;
  // Deutschland-Spiele
  if (match.team1 === 'Deutschland' || match.team2 === 'Deutschland') return true;
  // Ã–sterreich-Spiele (fÃ¼r ORF)
  if (match.team1 === 'Ã–sterreich' || match.team2 === 'Ã–sterreich') return true;
  // Schweiz-Spiele (fÃ¼r SRF)
  if (match.team1 === 'Schweiz' || match.team2 === 'Schweiz') return true;
  // K.O.-Runde ab Viertelfinale
  if (['Viertelfinale', 'Halbfinale', 'Spiel um Platz 3', 'Finale'].includes(match.type)) return true;
  return false;
};

// NordVPN Affiliate Link (CJ)
const NORDVPN_AFFILIATE_URL = 'https://www.kqzyfj.com/click-101616485-13756265';

// ==================== STADIUM DATA ====================
const stadiumData = {
  "Estadio Azteca": { capacity: 87523, homeTeams: [{ team: "Club AmÃ©rica", league: "Liga MX" }, { team: "Cruz Azul", league: "Liga MX" }, { team: "Mexico NT", league: "National" }], city: "Mexico City", country: "ðŸ‡²ðŸ‡½", wiki: "https://en.wikipedia.org/wiki/Estadio_Azteca" },
  "Estadio Akron": { capacity: 49850, homeTeams: [{ team: "CD Guadalajara", league: "Liga MX" }], city: "Guadalajara", country: "ðŸ‡²ðŸ‡½", wiki: "https://en.wikipedia.org/wiki/Estadio_Akron" },
  "Estadio BBVA": { capacity: 53500, homeTeams: [{ team: "CF Monterrey", league: "Liga MX" }], city: "Monterrey", country: "ðŸ‡²ðŸ‡½", wiki: "https://en.wikipedia.org/wiki/Estadio_BBVA" },
  "MetLife Stadium": { capacity: 82500, homeTeams: [{ team: "NY Giants", league: "NFL" }, { team: "NY Jets", league: "NFL" }], city: "East Rutherford", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/MetLife_Stadium" },
  "SoFi Stadium": { capacity: 70240, homeTeams: [{ team: "LA Rams", league: "NFL" }, { team: "LA Chargers", league: "NFL" }], city: "Los Angeles", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/SoFi_Stadium" },
  "AT&T Stadium": { capacity: 80000, homeTeams: [{ team: "Dallas Cowboys", league: "NFL" }], city: "Dallas", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/AT%26T_Stadium" },
  "NRG Stadium": { capacity: 72220, homeTeams: [{ team: "Houston Texans", league: "NFL" }, { team: "Houston Dynamo", league: "MLS" }], city: "Houston", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/NRG_Stadium" },
  "Hard Rock Stadium": { capacity: 65326, homeTeams: [{ team: "Miami Dolphins", league: "NFL" }, { team: "Inter Miami", league: "MLS" }], city: "Miami", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/Hard_Rock_Stadium" },
  "Mercedes-Benz Stadium": { capacity: 71000, homeTeams: [{ team: "Atlanta Falcons", league: "NFL" }, { team: "Atlanta United", league: "MLS" }], city: "Atlanta", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/Mercedes-Benz_Stadium" },
  "Lincoln Financial Field": { capacity: 69796, homeTeams: [{ team: "Philadelphia Eagles", league: "NFL" }, { team: "Philadelphia Union", league: "MLS" }], city: "Philadelphia", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/Lincoln_Financial_Field" },
  "Levi's Stadium": { capacity: 68500, homeTeams: [{ team: "San Francisco 49ers", league: "NFL" }, { team: "SJ Earthquakes", league: "MLS" }], city: "San Francisco", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/Levi%27s_Stadium" },
  "Gillette Stadium": { capacity: 65878, homeTeams: [{ team: "New England Patriots", league: "NFL" }, { team: "New England Revolution", league: "MLS" }], city: "Boston", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/Gillette_Stadium" },
  "Arrowhead Stadium": { capacity: 76416, homeTeams: [{ team: "Kansas City Chiefs", league: "NFL" }], city: "Kansas City", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/Arrowhead_Stadium" },
  "Lumen Field": { capacity: 68740, homeTeams: [{ team: "Seattle Seahawks", league: "NFL" }, { team: "Seattle Sounders", league: "MLS" }], city: "Seattle", country: "ðŸ‡ºðŸ‡¸", wiki: "https://en.wikipedia.org/wiki/Lumen_Field" },
  "BC Place": { capacity: 54500, homeTeams: [{ team: "BC Lions", league: "CFL" }, { team: "Vancouver Whitecaps", league: "MLS" }], city: "Vancouver", country: "ðŸ‡¨ðŸ‡¦", wiki: "https://en.wikipedia.org/wiki/BC_Place" },
  "BMO Field": { capacity: 45736, homeTeams: [{ team: "Toronto FC", league: "MLS" }, { team: "Toronto Argonauts", league: "CFL" }], city: "Toronto", country: "ðŸ‡¨ðŸ‡¦", wiki: "https://en.wikipedia.org/wiki/BMO_Field" },
};

// ==================== GROUP DATA ====================
const groupTeams = {
  A: ["Mexiko", "SÃ¼dafrika", "SÃ¼dkorea", "DÃ¤nemark"],
  B: ["Kanada", "Italien", "Katar", "Schweiz"],
  C: ["Brasilien", "Marokko", "Haiti", "Schottland"],
  D: ["USA", "Paraguay", "Australien", "TÃ¼rkei"],
  E: ["Deutschland", "CuraÃ§ao", "ElfenbeinkÃ¼ste", "Ecuador"],
  F: ["Niederlande", "Japan", "Ukraine", "Tunesien"],
  G: ["England", "Senegal", "Polen", "Panama"],
  H: ["Saudi-Arabien", "Uruguay", "Ã„gypten", "Kolumbien"],
  I: ["Spanien", "Nigeria", "Serbien", "Neuseeland"],
  J: ["Argentinien", "Algerien", "Ã–sterreich", "Jordanien"],
  K: ["Frankreich", "Costa Rica", "Kamerun", "Indonesien"],
  L: ["Portugal", "Ghana", "Kroatien", "Iran"],
};

// AI Prediction based on team strength ratings
const getAIPrediction = (team1, team2) => {
  const strength1 = teamInfo[team1]?.strength || 70;
  const strength2 = teamInfo[team2]?.strength || 70;
  
  const diff = strength1 - strength2;
  
  // Base goals on team strength
  let goals1, goals2;
  
  if (diff > 15) {
    goals1 = Math.floor(Math.random() * 2) + 2; // 2-3
    goals2 = Math.floor(Math.random() * 2); // 0-1
  } else if (diff > 5) {
    goals1 = Math.floor(Math.random() * 2) + 1; // 1-2
    goals2 = Math.floor(Math.random() * 2); // 0-1
  } else if (diff > -5) {
    goals1 = Math.floor(Math.random() * 2) + 1; // 1-2
    goals2 = Math.floor(Math.random() * 2) + 1; // 1-2
  } else if (diff > -15) {
    goals1 = Math.floor(Math.random() * 2); // 0-1
    goals2 = Math.floor(Math.random() * 2) + 1; // 1-2
  } else {
    goals1 = Math.floor(Math.random() * 2); // 0-1
    goals2 = Math.floor(Math.random() * 2) + 2; // 2-3
  }
  
  return { goals1, goals2 };
};

// Store AI predictions (generated once per session)
const aiPredictionsCache = {};

// Using YouTube search URLs - always work and show latest available videos
const videosData = [
  // Highlights
  { id: 1, title: "WM 2022 Finale: Argentinien vs Frankreich", category: "Highlights", year: 2022, searchQuery: "Argentina+vs+France+World+Cup+2022+Final+highlights", emoji: "ðŸ‡¦ðŸ‡·ðŸ‡«ðŸ‡·" },
  { id: 2, title: "Deutschland 7:1 Brasilien - WM 2014", category: "Highlights", year: 2014, searchQuery: "Germany+7-1+Brazil+World+Cup+2014+highlights", emoji: "ðŸ‡©ðŸ‡ª" },
  { id: 3, title: "WM 2022: Alle Tore des Turniers", category: "Highlights", year: 2022, searchQuery: "World+Cup+2022+all+goals", emoji: "âš½" },
  { id: 4, title: "Kroatien vs Brasilien - ElfmeterschieÃŸen WM 2022", category: "Highlights", year: 2022, searchQuery: "Croatia+vs+Brazil+penalties+World+Cup+2022", emoji: "ðŸ‡­ðŸ‡·" },
  { id: 5, title: "Marokko - Historischer Weg ins Halbfinale 2022", category: "Highlights", year: 2022, searchQuery: "Morocco+World+Cup+2022+all+goals+highlights", emoji: "ðŸ‡²ðŸ‡¦" },
  { id: 6, title: "Japan schockt Deutschland & Spanien", category: "Highlights", year: 2022, searchQuery: "Japan+beats+Germany+Spain+World+Cup+2022", emoji: "ðŸ‡¯ðŸ‡µ" },
  { id: 7, title: "Saudi-Arabien besiegt Argentinien", category: "Highlights", year: 2022, searchQuery: "Saudi+Arabia+Argentina+World+Cup+2022+highlights", emoji: "ðŸ‡¸ðŸ‡¦" },
  
  // Deutschland
  { id: 10, title: "Deutschland wird Weltmeister 2014", category: "Deutschland", year: 2014, searchQuery: "Germany+wins+World+Cup+2014+Final+GÃ¶tze+goal", emoji: "ðŸ†" },
  { id: 11, title: "Deutschland vs Argentinien - Finale 2014", category: "Deutschland", year: 2014, searchQuery: "Germany+vs+Argentina+2014+World+Cup+Final+highlights", emoji: "ðŸ‡¦ðŸ‡·ðŸ‡«ðŸ‡·" },
  { id: 12, title: "Deutschlands 4 WM-Titel - Alle Finals", category: "Deutschland", year: 2014, searchQuery: "Germany+all+World+Cup+wins+1954+1974+1990+2014", emoji: "ðŸ‡¦ðŸ‡·ðŸ‡«ðŸ‡·" },
  { id: 13, title: "SommermÃ¤rchen 2006 - Best Moments", category: "Deutschland", year: 2006, searchQuery: "Germany+World+Cup+2006+SommermÃ¤rchen+highlights", emoji: "ðŸŽ†" },
  { id: 14, title: "Deutschland WM 2010 - Alle Tore", category: "Deutschland", year: 2010, searchQuery: "Germany+World+Cup+2010+all+goals+highlights", emoji: "ðŸ‡©ðŸ‡ª" },
  
  // Songs
  { id: 20, title: "Shakira - Waka Waka (WM 2010)", category: "Songs", year: 2010, searchQuery: "Shakira+Waka+Waka+World+Cup+2010+official", emoji: "ðŸŽµ" },
  { id: 21, title: "K'naan - Wavin' Flag (WM 2010)", category: "Songs", year: 2010, searchQuery: "Knaan+Wavin+Flag+World+Cup+2010+official", emoji: "ðŸŽ¶" },
  { id: 22, title: "Ricky Martin - Cup of Life (WM 1998)", category: "Songs", year: 1998, searchQuery: "Ricky+Martin+Cup+of+Life+World+Cup+1998", emoji: "ðŸŽ¤" },
  { id: 23, title: "Pitbull ft. J.Lo - We Are One (WM 2014)", category: "Songs", year: 2014, searchQuery: "Pitbull+Jennifer+Lopez+We+Are+One+World+Cup+2014", emoji: "ðŸŽµ" },
  { id: 24, title: "Hayya Hayya - Official WM 2022 Song", category: "Songs", year: 2022, searchQuery: "Hayya+Hayya+Better+Together+World+Cup+2022+official", emoji: "ðŸŽ¶" },
  { id: 25, title: "Sportfreunde Stiller - 54 74 90 2006", category: "Songs", year: 2006, searchQuery: "Sportfreunde+Stiller+54+74+90+2006", emoji: "ðŸŽ¸" },
  { id: 26, title: "Zeit dass sich was dreht - WM 2006", category: "Songs", year: 2006, searchQuery: "Zeit+dass+sich+was+dreht+GrÃ¶nemeyer+2006", emoji: "ðŸŽ¤" },
  
  // Klassiker
  { id: 30, title: "Maradonas Hand Gottes & Jahrhunderttor", category: "Klassiker", year: 1986, searchQuery: "Maradona+Hand+of+God+Goal+of+the+Century+1986", emoji: "âœ‹" },
  { id: 31, title: "Zidanes KopfstoÃŸ im WM-Finale 2006", category: "Klassiker", year: 2006, searchQuery: "Zidane+headbutt+Materazzi+World+Cup+2006+Final", emoji: "ðŸ‡¦ðŸ‡·ðŸ‡«ðŸ‡·" },
  { id: 32, title: "PelÃ© - Die grÃ¶ÃŸten WM-Momente", category: "Klassiker", year: 1970, searchQuery: "Pele+best+World+Cup+goals+moments", emoji: "ðŸ‘‘" },
  { id: 33, title: "Deutschland vs Italien 4:3 - WM 1970", category: "Klassiker", year: 1970, searchQuery: "Germany+Italy+4-3+1970+World+Cup+Game+of+Century", emoji: "ðŸ‡®ðŸ‡¹" },
  { id: 34, title: "Wembley-Tor 1966 - War der Ball drin?", category: "Klassiker", year: 1966, searchQuery: "Wembley+Goal+1966+World+Cup+Final+England+Germany", emoji: "ðŸ‡¦ðŸ‡·ðŸ‡«ðŸ‡·" },
  { id: 35, title: "Brasilien 1970 - Bestes Team aller Zeiten?", category: "Klassiker", year: 1970, searchQuery: "Brazil+1970+World+Cup+best+team+ever+Pele", emoji: "ðŸ‡§ðŸ‡·" },
  { id: 36, title: "WM Finale 1990: Deutschland vs Argentinien", category: "Klassiker", year: 1990, searchQuery: "Germany+Argentina+1990+World+Cup+Final", emoji: "ðŸ‡¦ðŸ‡·ðŸ‡«ðŸ‡·" },
  { id: 37, title: "Zinedine Zidane - Beste WM-Momente", category: "Klassiker", year: 2006, searchQuery: "Zidane+best+World+Cup+goals+moments", emoji: "ðŸ‡«ðŸ‡·" },
  
  // WM 2026 Preview
  { id: 40, title: "WM 2026: Alle 16 Stadien", category: "WM 2026", year: 2026, searchQuery: "World+Cup+2026+all+stadiums+USA+Mexico+Canada", emoji: "ðŸŸï¸" },
  { id: 41, title: "WM 2026: 48 Teams - Neues Format erklÃ¤rt", category: "WM 2026", year: 2026, searchQuery: "World+Cup+2026+48+teams+new+format+explained", emoji: "ðŸ“‹" },
  { id: 42, title: "Road to WM 2026 - Qualifikation", category: "WM 2026", year: 2026, searchQuery: "World+Cup+2026+qualification+Europe+UEFA", emoji: "ðŸ›¤ï¸" },
  { id: 43, title: "MetLife Stadium - Das Finale-Stadion", category: "WM 2026", year: 2026, searchQuery: "MetLife+Stadium+World+Cup+2026+Final+venue", emoji: "ðŸ—½" },
];

// Helper function to generate YouTube search URL
const getYouTubeUrl = (searchQuery) => `https://www.youtube.com/results?search_query=${searchQuery}`;

// ==================== COUNTDOWN COMPONENT ====================
function Countdown() {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const wmStart = new Date('2026-06-11T00:00:00');
    const timer = setInterval(() => {
      const now = new Date();
      const diff = wmStart - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {[{ val: timeLeft.days, label: t('days') }, { val: timeLeft.hours, label: t('hours') }, { val: timeLeft.minutes, label: t('minutes') }, { val: timeLeft.seconds, label: t('seconds') }].map((item, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ background: '#1e293b', borderRadius: '8px', padding: '8px 12px', minWidth: '48px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{item.val}</div>
          </div>
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN APP ====================
function AppContent() {
  const { t, language, translateTeam, translateCategory } = useLanguage();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('news');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [totalPoints, setTotalPoints] = useState(0);
  const [predictions, setPredictions] = useState({});
  const [matchFilter, setMatchFilter] = useState('alle');
  const [groupFilter, setGroupFilter] = useState('alle');
  const [teamFilter, setTeamFilter] = useState('alle');
  const [videoCategory, setVideoCategory] = useState('alle');
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaAnswered, setTriviaAnswered] = useState(false);
  const [triviaSelected, setTriviaSelected] = useState(null);
  const [triviaRound, setTriviaRound] = useState([]); // 10 questions per round
  const [triviaLoading, setTriviaLoading] = useState(false);
  const [triviaCategory, setTriviaCategory] = useState('alle');
  const [leagues, setLeagues] = useState([]);
  const [showWMPoll, setShowWMPoll] = useState(false);
  const [hasVotedWMPoll, setHasVotedWMPoll] = useState(false);
  const [wmPollResults, setWmPollResults] = useState([]);
  const [leagueCode, setLeagueCode] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');
  const [hoveredStadium, setHoveredStadium] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupStandings, setShowGroupStandings] = useState(false);
  
  // Landing Poll State - always show poll/results on page load
  const [showLandingPoll, setShowLandingPoll] = useState(true);
  
  // Handle landing poll completion (vote or skip)
  const handleLandingPollComplete = (votedTeam) => {
    if (votedTeam) {
      localStorage.setItem('wm2026_poll_vote', votedTeam);
    }
    setShowLandingPoll(false);
    setActiveTab('trivia');
  };
  
  // News State
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  // Fallback news if RSS fails
  const fallbackNews = [
    { id: 1, title: t('dummyNews1Title'), summary: t('dummyNews1Summary'), date: '16. Dez 2025', tag: 'Tickets', tagColor: '#f59e0b', url: 'https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026' },
    { id: 2, title: t('dummyNews2Title'), summary: t('dummyNews2Summary'), date: '15. Dez 2025', tag: 'DFB', tagColor: '#ef4444', url: 'https://www.dfb.de' },
    { id: 3, title: t('dummyNews3Title'), summary: t('dummyNews3Summary'), date: '14. Dez 2025', tag: 'Streaming', tagColor: '#10b981', url: 'https://www.magenta.de' },
    { id: 4, title: t('dummyNews4Title'), summary: t('dummyNews4Summary'), date: '12. Dez 2025', tag: 'Merch', tagColor: '#8b5cf6', url: 'https://www.dfb.de' },
    { id: 5, title: t('dummyNews5Title'), summary: t('dummyNews5Summary'), date: '10. Dez 2025', tag: t('tagStadiums'), tagColor: '#3b82f6', url: 'https://www.fifa.com' },
  ];

  // Fetch news on mount and when language changes
  useEffect(() => {
    async function loadNews() {
      setNewsLoading(true);
      try {
        const rssNews = await fetchRSSNews(language);
        if (rssNews && rssNews.length > 0) {
          setNews(rssNews);
        } else {
          setNews(fallbackNews);
        }
      } catch (error) {
        console.error('News loading error:', error);
        setNews(fallbackNews);
        setNewsError(t('newsError'));
      }
      setNewsLoading(false);
    }
    loadNews();
    
    // Refresh news every 5 minutes
    const newsInterval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(newsInterval);
  }, [language]); // Reload when language changes

  // Auth state management with PASSWORD_RECOVERY handling
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Handle password recovery - open modal with newPassword mode
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('newPassword');
        setShowAuthModal(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => { if (user) { loadPredictions(); loadLeagues(); checkWMPollVote(); } loadWMPollResults(); }, [user]);

  const loadPredictions = async () => {
    if (!user) return;
    const { data } = await supabase.from('predictions').select('*').eq('user_id', user.id);
    const preds = {};
    data?.forEach(p => { preds[p.match_id] = { home: p.home_score, away: p.away_score }; });
    setPredictions(preds);
  };

  const loadLeagues = async () => {
    if (!user) return;
    const { data } = await supabase.from('league_members').select('league_id, leagues(*)').eq('user_id', user.id);
    setLeagues(data?.map(d => d.leagues) || []);
  };

  // Check if user has voted in WM Poll
  const checkWMPollVote = async () => {
    if (!user) return;
    const { data } = await supabase.from('wm_poll_votes').select('id').eq('user_id', user.id).single();
    setHasVotedWMPoll(!!data);
  };

  // Submit WM Poll vote
  const submitWMPollVote = async (teamName) => {
    if (!user || hasVotedWMPoll) return;
    try {
      await supabase.from('wm_poll_votes').insert({ user_id: user.id, team: teamName });
      setHasVotedWMPoll(true);
      setShowWMPoll(false);
      loadWMPollResults();
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  // Load WM Poll results
  const loadWMPollResults = async () => {
    const { data } = await supabase.from('wm_poll_votes').select('team');
    if (data) {
      const counts = {};
      data.forEach(v => { counts[v.team] = (counts[v.team] || 0) + 1; });
      const results = Object.entries(counts).map(([team, votes]) => ({ team, votes }));
      results.sort((a, b) => b.votes - a.votes);
      setWmPollResults(results);
    }
  };

  // Poll handling is now done via showWMPoll modal
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setPredictions({}); setLeagues([]); };
  const openAuthModal = (mode = 'login') => { setAuthMode(mode); setShowAuthModal(true); };

  const savePrediction = async (matchId, home, away) => {
    if (!user) return;
    setPredictions({ ...predictions, [matchId]: { home, away } });
    await supabase.from('predictions').upsert({ user_id: user.id, match_id: matchId, home_score: home, away_score: away }, { onConflict: 'user_id,match_id' });
  };

  const handleTriviaAnswer = (i) => { if (triviaAnswered || triviaRound.length === 0) return; setTriviaSelected(i); setTriviaAnswered(true); if (i === triviaRound[triviaIndex].correctIndex) { setTriviaScore(s => s + 10); setTotalPoints(p => p + 10); } };
  const nextQuestion = () => { if (triviaIndex < triviaRound.length - 1) { setTriviaIndex(i => i + 1); setTriviaAnswered(false); setTriviaSelected(null); } };
  const resetTrivia = () => { setTriviaIndex(0); setTriviaScore(0); setTriviaAnswered(false); setTriviaSelected(null); loadTriviaQuestions(); };
  
  // Load trivia questions from Supabase
  const loadTriviaQuestions = async () => {
    setTriviaLoading(true);
    try {
      let query = supabase.from('trivia_questions').select('*');
      
      // Filter by language ('de' or 'en') - Polish uses English questions as fallback
      const triviaLang = language === 'pl' ? 'en' : language;
      query = query.eq('language', triviaLang);
      
      // Filter by category if selected
      if (triviaCategory !== 'alle') {
        query = query.eq('category', triviaCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Shuffle and pick 10 random questions
      const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 10);
      
      // Format questions with shuffled answers
      const formatted = shuffled.map(q => {
        const answers = [
          { text: q.correct_answer, isCorrect: true },
          { text: q.wrong_answer_1, isCorrect: false },
          { text: q.wrong_answer_2, isCorrect: false },
          { text: q.wrong_answer_3, isCorrect: false },
        ].sort(() => Math.random() - 0.5);
        
        return {
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          options: answers.map(a => a.text),
          correctIndex: answers.findIndex(a => a.isCorrect),
          explanation: q.explanation || t('noExplanation')
        };
      });
      
      setTriviaRound(formatted);
      setTriviaIndex(0);
      setTriviaAnswered(false);
      setTriviaSelected(null);
    } catch (err) {
      console.error('Trivia load error:', err);
    }
    setTriviaLoading(false);
  };
  
  // Load trivia when tab is opened or category changes
  useEffect(() => {
    if (activeTab === 'trivia' && triviaRound.length === 0) {
      loadTriviaQuestions();
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (activeTab === 'trivia') {
      loadTriviaQuestions();
    }
  }, [triviaCategory, language]); // Reload when language changes too

  const createLeague = async () => {
    if (!user || !newLeagueName.trim()) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data } = await supabase.from('leagues').insert({ name: newLeagueName, code, created_by: user.id }).select().single();
    if (data) { await supabase.from('league_members').insert({ league_id: data.id, user_id: user.id }); setLeagues([...leagues, data]); setNewLeagueName(''); }
  };

  const joinLeague = async () => {
    if (!user || !leagueCode.trim()) return;
    const { data: league } = await supabase.from('leagues').select('*').eq('code', leagueCode.toUpperCase()).single();
    if (league) { await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id }); setLeagues([...leagues, league]); setLeagueCode(''); }
    else alert('Liga nicht gefunden.');
  };

  const filteredMatches = matchData.filter(m => {
    if (matchFilter !== 'alle' && m.type !== matchFilter) return false;
    if (groupFilter !== 'alle' && m.group !== groupFilter) return false;
    if (teamFilter !== 'alle' && m.team1 !== teamFilter && m.team2 !== teamFilter) return false;
    return true;
  });
  const filteredVideos = videoCategory === 'alle' ? videosData : videosData.filter(v => v.category === videoCategory);
  const allTeams = [...new Set(matchData.flatMap(m => [m.team1, m.team2]))].filter(t => !t.includes('Sieger') && !t.includes('Verlierer') && !t.includes('Gruppe')).sort();
  const allGroups = [...new Set(matchData.map(m => m.group).filter(Boolean))].sort();
  const matchTypes = [...new Set(matchData.map(m => m.type))];
  const predictedCount = Object.keys(predictions).length;

  // Poll is now shown inside Spiele tab, not as fullscreen takeover

  const tabs = [
    { id: 'news', label: t('tabNews') }, 
    { id: 'videos', label: t('tabVideos') }, 
    { id: 'matches', label: t('tabMatches') }, 
    { id: 'leagues', label: t('tabRankings') }, 
    { id: 'trivia', label: t('tabTrivia') },
    { id: 'badges', label: t('tabBadges') },
    { id: 'sentiment', label: t('tabSentiment') },
    { id: 'guide', label: t('tabGuide'), locked: true }
  ];

  // Handle tab click with WM poll check
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'matches' && user && !hasVotedWMPoll) {
      setShowWMPoll(true);
    }
  };

  // Show landing poll on first visit
  if (showLandingPoll) {
    return <WM2026Poll onComplete={handleLandingPollComplete} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* HEADER - fixed height */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderBottom: '1px solid #334155', height: '90px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '5px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          {/* LEFT: Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px' }}>
            <img src="/Logo_WM2026.png" alt="WM 2026" style={{ width: '120px', height: 'auto', display: 'block' }} />
          </div>
          
          {/* CENTER: Sentiment Barometer */}
          <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
            <SentimentBarometer language={language} onClick={() => setActiveTab('sentiment')} />
          </div>
          
          {/* RIGHT: Language + Auth */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            {/* Language Selector */}
            <LanguageSelector />
            
            {user ? (
              <>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>{totalPoints}</div><div style={{ fontSize: '9px', color: '#64748b' }}>{t('points')}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '11px', color: 'white' }}>{user.user_metadata?.username || user.email?.split('@')[0]}</div><button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '9px', cursor: 'pointer', padding: 0 }}>{t('logout')}</button></div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{(user.user_metadata?.username || user.email)?.[0]?.toUpperCase()}</div>
              </>
            ) : (
              <button onClick={() => openAuthModal('login')} style={{ padding: '8px 16px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{t('login')}</button>
            )}
          </div>
        </div>
      </header>

      {/* TOP NAV */}
      <nav style={{ position: 'sticky', top: '90px', zIndex: 30, background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => !tab.locked && handleTabClick(tab.id)} 
              style={{ 
                flex: 1, 
                padding: '10px 6px', 
                fontSize: '10px', 
                background: 'transparent', 
                border: 'none', 
                cursor: tab.locked ? 'not-allowed' : 'pointer', 
                whiteSpace: 'nowrap', 
                minWidth: 'fit-content', 
                color: tab.locked ? '#475569' : (activeTab === tab.id ? '#fbbf24' : '#94a3b8'), 
                borderBottom: activeTab === tab.id ? '2px solid #fbbf24' : '2px solid transparent',
                opacity: tab.locked ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              {tab.label}
              {tab.locked && <span style={{ fontSize: '8px' }}>ðŸ”’</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* COUNTDOWN */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}><Countdown /></div>

      {/* MAIN */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        {/* NEWS */}
        {activeTab === 'news' && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('newsTitle')}</span>
              {newsLoading && <span style={{ fontSize: '10px', color: '#64748b' }}>{t('newsUpdating')}</span>}
            </div>
            
            {/* Live indicator */}
            {!newsLoading && news.length > 0 && news[0].url && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                <span style={{ fontSize: '11px', color: '#10b981' }}>{t('newsCountryFlags')} {t('newsLive')}</span>
              </div>
            )}
            
            {newsLoading && news.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>ðŸ”’</div>
                <div style={{ fontSize: '12px' }}>{t('newsLoading')}</div>
              </div>
            ) : (
              news.map(item => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{ 
                    background: '#1e293b', 
                    borderRadius: '10px', 
                    padding: '14px', 
                    marginBottom: '10px', 
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '9px', background: item.tagColor, color: 'white', padding: '2px 8px', borderRadius: '4px' }}>{item.tag}</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.summary}</div>
                    <div style={{ fontSize: '9px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ðŸ“– {t('newsReadArticle')}
                    </div>
                  </div>
                </a>
              ))
            )}
            
            {newsError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
                <span style={{ fontSize: '11px', color: '#ef4444' }}>âš ï¸ {newsError}</span>
              </div>
            )}
          </div>
        )}

        {/* VIDEOS */}
        {activeTab === 'videos' && (<div><div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>{t('videosTitle')}</div><div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>{[{key: 'alle', label: t('videosAll')}, {key: 'Highlights', label: t('videosHighlights')}, {key: 'Deutschland', label: t('videosGermany')}, {key: 'Songs', label: t('videosSongs')}, {key: 'Klassiker', label: t('videosClassics')}, {key: 'WM 2026', label: t('videosWC2026')}].map(cat => (<button key={cat.key} onClick={() => setVideoCategory(cat.key)} style={{ padding: '6px 12px', background: videoCategory === cat.key ? '#10b981' : '#1e293b', border: '1px solid #334155', borderRadius: '16px', color: videoCategory === cat.key ? 'white' : '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>{cat.label}</button>))}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{filteredVideos.map(v => (<a key={v.id} href={getYouTubeUrl(v.searchQuery)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><div style={{ background: '#1e293b', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#ff0000'; e.currentTarget.style.transform = 'scale(1.02)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'scale(1)'; }}><div style={{ position: 'relative', height: '90px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '40px' }}>{v.emoji}</span><div style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#ff0000', borderRadius: '4px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg><span style={{ fontSize: '9px', color: 'white', fontWeight: 'bold' }}>YouTube</span></div></div><div style={{ padding: '10px' }}><div style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', marginBottom: '4px', lineHeight: '1.3' }}>{v.title}</div><div style={{ fontSize: '9px', color: '#64748b' }}>{v.category} â€¢ {v.year}</div></div></div></a>))}</div><div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#ff0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg><span style={{ fontSize: '10px', color: '#ff6b6b' }}>{t('videosYoutubeHint')}</span></div></div>)}

        {/* MATCHES */}
        {activeTab === 'matches' && (
          <SpieleSection 
            user={user}
            predictions={predictions}
            savePrediction={savePrediction}
            matchResults={{}}
            nordvpnUrl={NORDVPN_AFFILIATE_URL}
            language={language}
          />
        )}

        {/* RANGLISTEN */}
        {activeTab === 'leagues' && (
          <RanglistenSection 
            user={user}
            supabase={supabase}
            leagues={leagues}
            setLeagues={setLeagues}
            createLeague={createLeague}
            joinLeague={joinLeague}
            newLeagueName={newLeagueName}
            setNewLeagueName={setNewLeagueName}
            leagueCode={leagueCode}
            setLeagueCode={setLeagueCode}
            openAuthModal={openAuthModal}
            wmPollResults={wmPollResults}
            language={language}
          />
        )}

        {/* TRIVIA */}
        {activeTab === 'trivia' && (<div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>{t('triviaTitle')}</div>
          
          {/* Language notice for Trivia - only shown for Polish (questions are in English) */}
          {language === 'pl' && (
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '11px', color: '#94a3b8' }}>
              {t('triviaLanguageNotice')}
            </div>
          )}
          
          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {['alle', 'WM Geschichte', 'Spieler', 'WM 2026', 'Rekorde', 'Nationen', 'Stadien', 'Kurioses', 'Regeln'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setTriviaCategory(cat)}
                style={{ 
                  padding: '6px 10px', 
                  background: triviaCategory === cat ? '#10b981' : '#1e293b', 
                  border: '1px solid #334155', 
                  borderRadius: '16px', 
                  color: triviaCategory === cat ? 'white' : '#94a3b8', 
                  fontSize: '10px', 
                  cursor: 'pointer' 
                }}
              >
                {translateCategory(cat, language)}
              </button>
            ))}
          </div>
          
          {/* Score Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '12px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{t('question')} {triviaIndex + 1}/{triviaRound.length || 10}</span>
            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>{t('score')}: {triviaScore}</span>
          </div>
          
          {/* Loading State */}
          {triviaLoading && (
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '40px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>ðŸ”’</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>{t('loadingQuestions')}</div>
            </div>
          )}
          
          {/* Question Card */}
          {!triviaLoading && triviaRound.length > 0 && (
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              {/* Category & Difficulty Badge */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '9px', color: '#64748b', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>
                  {triviaRound[triviaIndex].category}
                </span>
                <span style={{ 
                  fontSize: '9px', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  background: triviaRound[triviaIndex].difficulty === 'easy' ? 'rgba(16,185,129,0.2)' : triviaRound[triviaIndex].difficulty === 'medium' ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)',
                  color: triviaRound[triviaIndex].difficulty === 'easy' ? '#10b981' : triviaRound[triviaIndex].difficulty === 'medium' ? '#fbbf24' : '#ef4444'
                }}>
                  {triviaRound[triviaIndex].difficulty === 'easy' ? `â­ ${t('easy')}` : triviaRound[triviaIndex].difficulty === 'medium' ? `â­â­ ${t('medium')}` : `â­â­â­ ${t('hard')}`}
                </span>
              </div>
              
              {/* Question */}
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
                {triviaRound[triviaIndex].question}
              </div>
              
              {/* Answer Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {triviaRound[triviaIndex].options.map((opt, i) => { 
                  let bg = '#0f172a', border = '1px solid #334155'; 
                  if (triviaAnswered) { 
                    if (i === triviaRound[triviaIndex].correctIndex) { 
                      bg = 'rgba(16,185,129,0.2)'; 
                      border = '1px solid #10b981'; 
                    } else if (i === triviaSelected) { 
                      bg = 'rgba(239,68,68,0.2)'; 
                      border = '1px solid #ef4444'; 
                    } 
                  } 
                  return (
                    <button 
                      key={i} 
                      onClick={() => handleTriviaAnswer(i)} 
                      disabled={triviaAnswered} 
                      style={{ padding: '12px', background: bg, border, borderRadius: '8px', color: 'white', fontSize: '12px', cursor: triviaAnswered ? 'default' : 'pointer', textAlign: 'left' }}
                    >
                      {opt}
                    </button>
                  ); 
                })}
              </div>
              
              {/* Explanation after answer */}
              {triviaAnswered && (
                <div style={{ marginTop: '16px', padding: '14px', background: triviaSelected === triviaRound[triviaIndex].correctIndex ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: triviaSelected === triviaRound[triviaIndex].correctIndex ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{triviaSelected === triviaRound[triviaIndex].correctIndex ? 'âœ…' : 'âŒ'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: triviaSelected === triviaRound[triviaIndex].correctIndex ? '#10b981' : '#ef4444' }}>
                      {triviaSelected === triviaRound[triviaIndex].correctIndex ? t('correct') : `${t('wrong')} ${t('correctAnswer')}: ${triviaRound[triviaIndex].options[triviaRound[triviaIndex].correctIndex]}`}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>ðŸ’¡ {triviaRound[triviaIndex].explanation}</div>
                </div>
              )}
              
              {/* Next / Restart buttons */}
              {triviaAnswered && triviaIndex < triviaRound.length - 1 && (
                <button onClick={nextQuestion} style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{t('nextQuestion')} â†’</button>
              )}
              {triviaAnswered && triviaIndex === triviaRound.length - 1 && (
                <div>
                  <div style={{ marginTop: '16px', padding: '16px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>ðŸ”’</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{triviaScore} {t('points')}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{triviaScore >= 80 ? t('triviaWorldChampion') : triviaScore >= 60 ? t('triviaVeryGood') : triviaScore >= 40 ? t('triviaWellPlayed') : t('triviaKeepPracticing')}</div>
                  </div>
                  <button onClick={resetTrivia} style={{ width: '100%', marginTop: '12px', padding: '12px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{t('newRound')} ðŸ”„</button>
                </div>
              )}
            </div>
          )}
          
          {/* Empty state */}
          {!triviaLoading && triviaRound.length === 0 && (
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '40px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>â³</div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>{t('noQuestionsFound')}</div>
              <button onClick={loadTriviaQuestions} style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>{t('tryAgain')}</button>
            </div>
          )}
          
          {/* Stats */}
          <div style={{ marginTop: '16px', padding: '12px', background: '#0f172a', borderRadius: '8px', display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>1300+</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>{t('triviaStatsQuestions')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>8</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>{t('triviaStatsCategories')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fbbf24' }}>3</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>{t('triviaStatsDifficulties')}</div>
            </div>
          </div>
        </div>)}

        {/* TEAM BADGES */}
        {activeTab === 'badges' && (
          <WM2026TeamBadges language={language} user={user} />
        )}

        {/* SENTIMENT - FULL DASHBOARD */}
        {activeTab === 'sentiment' && (
          <SentimentDashboard language={language} user={user} />
        )}

        {/* GUIDE - LOCKED */}
        {activeTab === 'guide' && (
          <div style={{ 
            background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
            borderRadius: '16px', 
            padding: '40px 24px', 
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>ðŸ”’</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
              {t('guideLockedTitle')}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
              {t('guideLockedDescription')}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #334155', marginTop: '32px' }}><div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}><p style={{ margin: '0 0 4px' }}>{t('footerTitle')} â€¢ {t('footerDate')}</p><p style={{ margin: 0 }}>{t('footerCountries')} â€¢ {t('footerTeams')}</p></div></footer>

      {/* WM POLL MODAL */}
      {showWMPoll && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'hidden', border: '1px solid #334155' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>ðŸ”’</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{t('pollTitle')}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t('pollSubtitle')}</div>
            </div>
            
            {/* Teams Grid - Sorted by FIFA World Ranking */}
            <div style={{ padding: 16, maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  // Sorted by FIFA World Ranking (December 2024)
                  { name: 'Spanien', flag: 'ðŸ‡ªðŸ‡¸', stars: 1 },        // 1
                  { name: 'Argentinien', flag: 'ðŸ‡¦ðŸ‡·', stars: 3 },   // 2
                  { name: 'Frankreich', flag: 'ðŸ‡«ðŸ‡·', stars: 2 },    // 3
                  { name: 'England', flag: 'ðŸ´ó §ó ¢ó ¥ó ®ó §ó ¿', stars: 1 },    // 4
                  { name: 'Brasilien', flag: 'ðŸ‡§ðŸ‡·', stars: 5 },     // 5
                  { name: 'Portugal', flag: 'ðŸ‡µðŸ‡¹', stars: 0 },      // 6
                  { name: 'Niederlande', flag: 'ðŸ‡³ðŸ‡±', stars: 0 },   // 7
                  { name: 'Belgien', flag: 'ðŸ‡§ðŸ‡ª', stars: 0 },       // 8
                  { name: 'Deutschland', flag: 'ðŸ‡©ðŸ‡ª', stars: 4 },   // 9
                  { name: 'Kroatien', flag: 'ðŸ‡­ðŸ‡·', stars: 0 },      // 10
                  { name: 'Marokko', flag: 'ðŸ‡²ðŸ‡¦', stars: 0 },       // 11
                  { name: 'Kolumbien', flag: 'ðŸ‡¨ðŸ‡´', stars: 0 },     // 13
                  { name: 'USA', flag: 'ðŸ‡ºðŸ‡¸', stars: 0 },           // 14
                  { name: 'Mexiko', flag: 'ðŸ‡²ðŸ‡½', stars: 0 },        // 15
                  { name: 'Uruguay', flag: 'ðŸ‡ºðŸ‡¾', stars: 2 },       // 16
                  { name: 'Schweiz', flag: 'ðŸ‡¨ðŸ‡­', stars: 0 },       // 17
                  { name: 'Japan', flag: 'ðŸ‡¯ðŸ‡µ', stars: 0 },         // 18
                  { name: 'Senegal', flag: 'ðŸ‡¸ðŸ‡³', stars: 0 },       // 19
                  { name: 'Iran', flag: 'ðŸ‡®ðŸ‡·', stars: 0 },          // 20
                  { name: 'Republik Korea', flag: 'ðŸ‡°ðŸ‡·', stars: 0 },// 22
                  { name: 'Ecuador', flag: 'ðŸ‡ªðŸ‡¨', stars: 0 },       // 23
                  { name: 'Ã–sterreich', flag: 'ðŸ‡¦ðŸ‡¹', stars: 0 },    // 24
                  { name: 'Australien', flag: 'ðŸ‡¦ðŸ‡º', stars: 0 },    // 26
                  { name: 'Kanada', flag: 'ðŸ‡¨ðŸ‡¦', stars: 0 },        // 27
                  { name: 'Norwegen', flag: 'ðŸ‡³ðŸ‡´', stars: 0 },      // 29
                  { name: 'Panama', flag: 'ðŸ‡µðŸ‡¦', stars: 0 },        // 30
                  { name: 'Algerien', flag: 'ðŸ‡©ðŸ‡¿', stars: 0 },      // 34
                  { name: 'Ã„gypten', flag: 'ðŸ‡ªðŸ‡¬', stars: 0 },       // 35
                  { name: 'Schottland', flag: 'ðŸ´ó §ó ¢ó ³ó £ó ´ó ¿', stars: 0 }, // 36
                  { name: 'Paraguay', flag: 'ðŸ‡µðŸ‡¾', stars: 0 },      // 39
                  { name: 'Tunesien', flag: 'ðŸ‡¹ðŸ‡³', stars: 0 },      // 41
                  { name: 'ElfenbeinkÃ¼ste', flag: 'ðŸ‡¨ðŸ‡®', stars: 0 },// 42
                  { name: 'Usbekistan', flag: 'ðŸ‡ºðŸ‡¿', stars: 0 },    // 50
                  { name: 'Katar', flag: 'ðŸ‡¶ðŸ‡¦', stars: 0 },         // 54
                  { name: 'Saudi-Arabien', flag: 'ðŸ‡¸ðŸ‡¦', stars: 0 }, // 60
                  { name: 'SÃ¼dafrika', flag: 'ðŸ‡¿ðŸ‡¦', stars: 0 },     // 61
                  { name: 'Jordanien', flag: 'ðŸ‡¯ðŸ‡´', stars: 0 },     // 64
                  { name: 'Kap Verde', flag: 'ðŸ‡¨ðŸ‡»', stars: 0 },     // 67
                  { name: 'Ghana', flag: 'ðŸ‡¬ðŸ‡­', stars: 0 },         // 73
                  { name: 'CuraÃ§ao', flag: 'ðŸ‡¨ðŸ‡¼', stars: 0 },       // 82
                  { name: 'Neuseeland', flag: 'ðŸ‡³ðŸ‡¿', stars: 0 },    // 85
                  { name: 'Haiti', flag: 'ðŸ‡­ðŸ‡¹', stars: 0 }          // 88
                ].map(team => (
                  <button
                    key={team.name}
                    onClick={() => submitWMPollVote(team.name)}
                    style={{
                      padding: '10px 6px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.borderColor = '#10b981'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.borderColor = '#334155'; }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 2 }}>{team.flag}</div>
                    <div style={{ fontSize: 9, color: 'white', fontWeight: 'bold' }}>{translateTeam(team.name)}</div>
                    {team.stars > 0 && <div style={{ fontSize: 7, marginTop: 1 }}>{'â­'.repeat(team.stars)}</div>}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Skip Button */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', textAlign: 'center' }}>
              <button
                onClick={() => setShowWMPoll(false)}
                style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #64748b', borderRadius: 6, color: '#64748b', fontSize: 11, cursor: 'pointer' }}
              >
                {t('voteLater')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={(u) => setUser(u)} initialMode={authMode} language={language} />
    </div>
  );
}

// Export App wrapped with LanguageProvider
export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
      <Analytics />
    </LanguageProvider>
  );
}
