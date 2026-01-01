#!/usr/bin/env node

/**
 * WM2026 Sentiment Analysis - Local Pipeline Runner
 * 
 * Führt die vollständige Analyse durch, ohne von Vercel-Timeouts abhängig zu sein.
 * Ruft jede Quelle einzeln auf und speichert alle Ergebnisse.
 * 
 * Usage:
 *   node wm2026-local-analysis.js
 *   node wm2026-local-analysis.js --sources=google,reddit
 *   node wm2026-local-analysis.js --export-only
 *   node wm2026-local-analysis.js --days=7
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
  // API Base URL
  BASE_URL: 'https://wm26.live/api/api-sentiment-engine',
  
  // Alle verfügbaren Quellen
  ALL_SOURCES: [
    'google',      // Google News RSS
    'reddit',      // Reddit API
    'youtube',     // YouTube API
    'mastodon',    // Mastodon/Fediverse
    'bluesky',     // Bluesky
  ],
  
  // Timeout pro Quelle (5 Minuten)
  REQUEST_TIMEOUT: 300000,
  
  // Pause zwischen Quellen (Sekunden)
  PAUSE_BETWEEN_SOURCES: 5,
  
  // Export-Einstellungen
  EXPORT_DAYS: 30,
  OUTPUT_DIR: './wm2026-exports',
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const icons = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    fetch: '📥',
    analyze: '🔬',
    export: '📊',
    wait: '⏳',
  };
  console.log(`[${timestamp}] ${icons[type] || ''} ${message}`);
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    log(`Requesting: ${url}`, 'fetch');
    
    const req = protocol.get(url, { timeout: CONFIG.REQUEST_TIMEOUT }, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          // Könnte CSV sein
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    log(`Output directory created: ${CONFIG.OUTPUT_DIR}`, 'info');
  }
}

function saveJSON(filename, data) {
  const filepath = path.join(CONFIG.OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  log(`Saved: ${filepath}`, 'success');
  return filepath;
}

function saveCSV(filename, data) {
  const filepath = path.join(CONFIG.OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, data, 'utf8');
  log(`Saved: ${filepath}`, 'success');
  return filepath;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function parseArgs() {
  const args = {
    sources: null,
    exportOnly: false,
    days: CONFIG.EXPORT_DAYS,
    help: false,
  };
  
  process.argv.slice(2).forEach(arg => {
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--export-only') {
      args.exportOnly = true;
    } else if (arg.startsWith('--sources=')) {
      args.sources = arg.split('=')[1].split(',');
    } else if (arg.startsWith('--days=')) {
      args.days = parseInt(arg.split('=')[1]) || CONFIG.EXPORT_DAYS;
    }
  });
  
  return args;
}

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        WM2026 Sentiment Analysis - Local Pipeline            ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  node wm2026-local-analysis.js [options]

Options:
  --help, -h              Show this help message
  --sources=src1,src2     Run only specific sources
                          Available: google, reddit, youtube, mastodon, bluesky
  --export-only           Skip fetching, only download export
  --days=N                Export last N days (default: 30)

Examples:
  node wm2026-local-analysis.js
    → Run full pipeline with all sources
  
  node wm2026-local-analysis.js --sources=google,reddit
    → Run only Google News and Reddit
  
  node wm2026-local-analysis.js --export-only --days=7
    → Only export last 7 days of data
  
  node wm2026-local-analysis.js --sources=youtube
    → Run only YouTube source

Output:
  All exports are saved to: ${CONFIG.OUTPUT_DIR}/
`);
}

// =====================================================
// MAIN PIPELINE FUNCTIONS
// =====================================================

async function runSourcePipeline(source) {
  const url = `${CONFIG.BASE_URL}?action=run&sources=${source}`;
  
  try {
    log(`Starting ${source.toUpperCase()} pipeline...`, 'fetch');
    const startTime = Date.now();
    
    const result = await makeRequest(url);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    if (result.success) {
      const fetched = result.results?.fetch?.total || 0;
      const analyzed = result.results?.analysis?.processed || 0;
      const failed = result.results?.analysis?.failed || 0;
      
      log(`${source.toUpperCase()} completed in ${formatDuration(duration)}`, 'success');
      log(`  📥 Fetched: ${fetched} articles`, 'info');
      log(`  🔬 Analyzed: ${analyzed} articles`, 'info');
      if (failed > 0) {
        log(`  ⚠️  Failed: ${failed} articles`, 'warning');
      }
      
      return {
        source,
        success: true,
        duration,
        fetched,
        analyzed,
        failed,
      };
    } else {
      log(`${source.toUpperCase()} failed: ${result.error || 'Unknown error'}`, 'error');
      return {
        source,
        success: false,
        error: result.error,
        duration,
      };
    }
  } catch (error) {
    log(`${source.toUpperCase()} error: ${error.message}`, 'error');
    return {
      source,
      success: false,
      error: error.message,
    };
  }
}

async function runAllSources(sources) {
  const results = [];
  
  console.log('\n' + '═'.repeat(60));
  log(`Starting pipeline with ${sources.length} sources: ${sources.join(', ')}`, 'info');
  console.log('═'.repeat(60) + '\n');
  
  const totalStartTime = Date.now();
  
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    
    console.log(`\n┌─ Source ${i + 1}/${sources.length}: ${source.toUpperCase()} ─────────────────`);
    
    const result = await runSourcePipeline(source);
    results.push(result);
    
    console.log(`└─────────────────────────────────────────────────\n`);
    
    // Pause zwischen Quellen (außer bei der letzten)
    if (i < sources.length - 1) {
      log(`Waiting ${CONFIG.PAUSE_BETWEEN_SOURCES}s before next source...`, 'wait');
      await sleep(CONFIG.PAUSE_BETWEEN_SOURCES);
    }
  }
  
  const totalDuration = Math.round((Date.now() - totalStartTime) / 1000);
  
  return {
    results,
    totalDuration,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalFetched: results.reduce((sum, r) => sum + (r.fetched || 0), 0),
      totalAnalyzed: results.reduce((sum, r) => sum + (r.analyzed || 0), 0),
    },
  };
}

async function getExport(days, format = 'json') {
  const url = `${CONFIG.BASE_URL}?action=export&days=${days}${format === 'csv' ? '&format=csv' : ''}`;
  
  log(`Fetching ${format.toUpperCase()} export (last ${days} days)...`, 'export');
  
  try {
    const startTime = Date.now();
    const data = await makeRequest(url);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    log(`Export fetched in ${formatDuration(duration)}`, 'success');
    
    return data;
  } catch (error) {
    log(`Export failed: ${error.message}`, 'error');
    return null;
  }
}

async function getSummary() {
  const url = `${CONFIG.BASE_URL}?action=summary`;
  
  try {
    const data = await makeRequest(url);
    return data.summary || null;
  } catch (error) {
    log(`Summary fetch failed: ${error.message}`, 'error');
    return null;
  }
}

async function getStatus() {
  const url = `${CONFIG.BASE_URL}?action=status`;
  
  try {
    const data = await makeRequest(url);
    return data.logs || [];
  } catch (error) {
    log(`Status fetch failed: ${error.message}`, 'error');
    return [];
  }
}

// =====================================================
// REPORT GENERATION
// =====================================================

function generateReport(pipelineResults, exportData, summary) {
  const report = {
    generated_at: new Date().toISOString(),
    pipeline: pipelineResults,
    summary: summary,
    export_stats: exportData?.export?.statistics || null,
    config_used: exportData?.export?.config_snapshot || null,
  };
  
  return report;
}

function printFinalSummary(pipelineResults, exportData) {
  console.log('\n' + '═'.repeat(60));
  console.log('                    FINAL SUMMARY');
  console.log('═'.repeat(60));
  
  if (pipelineResults) {
    console.log('\n📊 Pipeline Results:');
    console.log(`   ⏱️  Total Duration: ${formatDuration(pipelineResults.totalDuration)}`);
    console.log(`   ✅ Successful: ${pipelineResults.summary.successful}/${pipelineResults.summary.total} sources`);
    console.log(`   📥 Total Fetched: ${pipelineResults.summary.totalFetched} articles`);
    console.log(`   🔬 Total Analyzed: ${pipelineResults.summary.totalAnalyzed} articles`);
    
    if (pipelineResults.summary.failed > 0) {
      console.log(`   ❌ Failed Sources: ${pipelineResults.summary.failed}`);
      pipelineResults.results
        .filter(r => !r.success)
        .forEach(r => console.log(`      - ${r.source}: ${r.error}`));
    }
  }
  
  if (exportData?.export?.statistics) {
    const stats = exportData.export.statistics;
    console.log('\n📈 Database Statistics:');
    console.log(`   📰 Total Articles: ${stats.total}`);
    console.log(`   📊 Processed Rate: ${stats.processed_rate}%`);
    console.log(`   😊 Avg Sentiment: ${stats.sentiment_avg}`);
    
    console.log('\n   By Sentiment:');
    Object.entries(stats.by_sentiment || {}).forEach(([k, v]) => {
      const icon = k === 'positive' ? '🟢' : k === 'negative' ? '🔴' : '⚪';
      console.log(`      ${icon} ${k}: ${v}`);
    });
    
    console.log('\n   Top Sources:');
    Object.entries(stats.by_source || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([k, v]) => console.log(`      📌 ${k}: ${v}`));
    
    console.log('\n   Top Languages:');
    Object.entries(stats.by_language || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([k, v]) => console.log(`      🌐 ${k}: ${v}`));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`📁 Exports saved to: ${path.resolve(CONFIG.OUTPUT_DIR)}`);
  console.log('═'.repeat(60) + '\n');
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        🏆 WM2026 Sentiment Analysis Pipeline 🏆              ║
║                   Local Runner v1.0                          ║
╚══════════════════════════════════════════════════════════════╝
`);
  
  ensureOutputDir();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  let pipelineResults = null;
  
  // ==================== RUN PIPELINE ====================
  if (!args.exportOnly) {
    const sources = args.sources || CONFIG.ALL_SOURCES;
    pipelineResults = await runAllSources(sources);
    
    // Save pipeline results
    saveJSON(`pipeline-results_${timestamp}.json`, pipelineResults);
  }
  
  // ==================== FETCH EXPORTS ====================
  console.log('\n' + '═'.repeat(60));
  log('Fetching exports...', 'export');
  console.log('═'.repeat(60) + '\n');
  
  // JSON Export
  const jsonExport = await getExport(args.days, 'json');
  if (jsonExport) {
    saveJSON(`wm2026-export_${timestamp}.json`, jsonExport);
  }
  
  // CSV Export
  const csvExport = await getExport(args.days, 'csv');
  if (csvExport && typeof csvExport === 'string') {
    saveCSV(`wm2026-articles_${timestamp}.csv`, csvExport);
  }
  
  // Summary
  const summary = await getSummary();
  if (summary) {
    saveJSON(`wm2026-summary_${timestamp}.json`, summary);
  }
  
  // Processing Status
  const status = await getStatus();
  if (status && status.length > 0) {
    saveJSON(`wm2026-status_${timestamp}.json`, status);
  }
  
  // ==================== GENERATE REPORT ====================
  const report = generateReport(pipelineResults, jsonExport, summary);
  saveJSON(`wm2026-report_${timestamp}.json`, report);
  
  // ==================== PRINT SUMMARY ====================
  printFinalSummary(pipelineResults, jsonExport);
  
  log('Pipeline completed successfully! 🎉', 'success');
}

// Run
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
