#!/usr/bin/env node
/**
 * YouTube Video Link Checker
 *
 * Checks all YouTube video IDs in videosData and:
 * - Verifies each video is still accessible
 * - Attempts to find alternative videos if broken
 * - Updates App.jsx with working links
 * - Removes videos that can't be fixed
 *
 * Run: node scripts/check-youtube-links.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_JSX_PATH = path.join(__dirname, '..', 'src', 'App.jsx');

// Check if a YouTube video exists using oEmbed API
async function checkVideoExists(videoId) {
  if (!videoId) return false;

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { method: 'HEAD' }
    );
    return response.ok;
  } catch (error) {
    console.error(`Error checking video ${videoId}:`, error.message);
    return false;
  }
}

// Search YouTube for a video and get the first result's ID
async function searchForVideo(searchQuery) {
  if (!searchQuery) return null;

  try {
    // Use YouTube's search page and extract video ID from results
    // This is a simplified approach - for production, use YouTube Data API
    const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract video IDs from the search results
    const videoIdMatches = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/g);
    if (!videoIdMatches || videoIdMatches.length === 0) return null;

    // Get unique video IDs
    const videoIds = [...new Set(videoIdMatches.map(m => m.replace('/watch?v=', '')))];

    // Return the first valid video ID
    for (const id of videoIds.slice(0, 5)) {
      const exists = await checkVideoExists(id);
      if (exists) {
        return id;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error searching for "${searchQuery}":`, error.message);
    return null;
  }
}

// Extract videosData from App.jsx
function extractVideosData(content) {
  const match = content.match(/const videosData = \[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Could not find videosData in App.jsx');
  }

  // Parse the array content
  const arrayContent = match[1];
  const videos = [];

  // Match each video object
  const videoMatches = arrayContent.matchAll(/\{\s*id:\s*(\d+),\s*title:\s*"([^"]*)",\s*category:\s*"([^"]*)",\s*year:\s*(\d+),\s*(?:videoId:\s*"([^"]*)",\s*)?searchQuery:\s*"([^"]*)",\s*emoji:\s*"([^"]*)"\s*\}/g);

  for (const m of videoMatches) {
    videos.push({
      id: parseInt(m[1]),
      title: m[2],
      category: m[3],
      year: parseInt(m[4]),
      videoId: m[5] || null,
      searchQuery: m[6],
      emoji: m[7]
    });
  }

  return videos;
}

// Generate videosData string for App.jsx
function generateVideosDataString(videos) {
  const categories = ['Highlights', 'Deutschland', 'Songs', 'Klassiker', 'WM 2026'];
  let result = '// Using YouTube video IDs for real thumbnails where available\nconst videosData = [\n';

  for (const category of categories) {
    const categoryVideos = videos.filter(v => v.category === category);
    if (categoryVideos.length === 0) continue;

    result += `  // ${category}\n`;
    for (const v of categoryVideos) {
      if (v.videoId) {
        result += `  { id: ${v.id}, title: "${v.title}", category: "${v.category}", year: ${v.year}, videoId: "${v.videoId}", searchQuery: "${v.searchQuery}", emoji: "${v.emoji}" },\n`;
      } else {
        result += `  { id: ${v.id}, title: "${v.title}", category: "${v.category}", year: ${v.year}, searchQuery: "${v.searchQuery}", emoji: "${v.emoji}" },\n`;
      }
    }
    result += '\n';
  }

  result = result.trimEnd() + '\n];';
  return result;
}

// Main function
async function main() {
  console.log('=== YouTube Video Link Checker ===\n');
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Read App.jsx
  let content = fs.readFileSync(APP_JSX_PATH, 'utf-8');

  // Extract videos
  const videos = extractVideosData(content);
  console.log(`Found ${videos.length} videos to check\n`);

  let changes = 0;
  const videosToRemove = [];

  // Check each video
  for (const video of videos) {
    process.stdout.write(`Checking: ${video.title.substring(0, 40)}... `);

    if (video.videoId) {
      const exists = await checkVideoExists(video.videoId);

      if (exists) {
        console.log('OK');
      } else {
        console.log('BROKEN - searching for alternative...');

        // Try to find an alternative
        const newVideoId = await searchForVideo(video.searchQuery);

        if (newVideoId && newVideoId !== video.videoId) {
          console.log(`  Found alternative: ${newVideoId}`);
          video.videoId = newVideoId;
          changes++;
        } else {
          console.log(`  No alternative found - removing video`);
          videosToRemove.push(video.id);
          changes++;
        }
      }
    } else {
      // Video has no videoId, try to find one
      console.log('NO ID - searching...');
      const newVideoId = await searchForVideo(video.searchQuery);

      if (newVideoId) {
        console.log(`  Found: ${newVideoId}`);
        video.videoId = newVideoId;
        changes++;
      } else {
        console.log('  Could not find video ID');
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Remove broken videos
  const updatedVideos = videos.filter(v => !videosToRemove.includes(v.id));

  if (changes > 0) {
    console.log(`\n${changes} changes detected. Updating App.jsx...`);

    // Generate new videosData
    const newVideosData = generateVideosDataString(updatedVideos);

    // Replace in content
    const oldMatch = content.match(/\/\/ Using YouTube.*?\nconst videosData = \[[\s\S]*?\];/);
    if (oldMatch) {
      content = content.replace(oldMatch[0], newVideosData);
      fs.writeFileSync(APP_JSX_PATH, content, 'utf-8');
      console.log('App.jsx updated successfully!');
    } else {
      console.error('Could not find videosData pattern to replace');
      process.exit(1);
    }

    // Output summary
    console.log(`\n=== Summary ===`);
    console.log(`Total videos: ${videos.length}`);
    console.log(`Videos removed: ${videosToRemove.length}`);
    console.log(`Videos updated: ${changes - videosToRemove.length}`);
    console.log(`Final count: ${updatedVideos.length}`);

    // Exit with code 1 to indicate changes were made (for GitHub Actions)
    process.exit(0);
  } else {
    console.log('\nAll videos are OK! No changes needed.');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
