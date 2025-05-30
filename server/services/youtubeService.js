import { google } from 'googleapis';
import Contest from '../models/Contest.js';
import cron from 'node-cron';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

const PLAYLIST_IDS = {
  leetcode: 'PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr',
  codeforces: 'PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB',
  codechef: 'PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr'
};

// Keep track of processed video IDs to avoid duplicates
const processedVideos = new Set();

async function fetchAllPlaylistItems(playlistId) {
  let items = [];
  let nextPageToken = undefined;

  do {
    try {
      const response = await youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: playlistId,
        maxResults: 50,
        pageToken: nextPageToken,
        key: process.env.YOUTUBE_API_KEY
      });

      if (response.data.items) {
        items = items.concat(response.data.items);
      }

      nextPageToken = response.data.nextPageToken;
    } catch (error) {
      console.error(`Error fetching playlist page: ${error.message}`);
      break;
    }
  } while (nextPageToken);

  return items;
}

export async function fetchSolutionVideos() {
  try {
    console.log('Starting to fetch solution videos...');
    
    for (const [platform, playlistId] of Object.entries(PLAYLIST_IDS)) {
      console.log(`Fetching solutions for ${platform}...`);
      
      const items = await fetchAllPlaylistItems(playlistId);
      
      if (!items.length) {
        console.log(`No videos found for ${platform}`);
        continue;
      }

      console.log(`Found ${items.length} videos for ${platform}`);

      for (const item of items) {
        const videoId = item.snippet.resourceId.videoId;
        const videoTitle = item.snippet.title;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Extract contest name from video title
        const contestName = extractContestName(videoTitle, platform);
        if (contestName) {
          console.log(`Found solution for contest: ${contestName}`);
          
          try {
            // Update contest with solution URL using more flexible matching
            const contest = await findMatchingContest(contestName, platform);

            if (contest && !contest.solutionUrl) {
              console.log(`Updating solution URL for ${contestName}`);
              contest.solutionUrl = videoUrl;
              await contest.save();
            }
          } catch (error) {
            console.error(`Error updating contest ${contestName}:`, error);
          }
        }
      }
    }
    console.log('Finished fetching solution videos');
  } catch (error) {
    console.error('Error fetching solution videos:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

async function findMatchingContest(contestName, platform) {
  // Create different variations of the contest name for matching
  const variations = generateContestNameVariations(contestName, platform);
  
  // Try to find a match using each variation
  for (const variation of variations) {
    const contest = await Contest.findOne({
      name: { $regex: new RegExp(variation, 'i') },
      platform: platform
    });
    
    if (contest) {
      return contest;
    }
  }
  
  return null;
}

function generateContestNameVariations(contestName, platform) {
  const variations = [contestName];
  
  if (platform === 'codechef') {
    // Add variations without "CodeChef" prefix
    const withoutPrefix = contestName.replace(/^CodeChef\s+/i, '');
    variations.push(withoutPrefix);
    
    // Handle Starters contest variations
    const startersMatch = contestName.match(/Starters\s*(\d+)/i);
    if (startersMatch) {
      variations.push(
        `Starters ${startersMatch[1]}`,
        `CodeChef Starters ${startersMatch[1]}`,
        `Starters${startersMatch[1]}`
      );
    }
    
    // Add variations with different month formats if present
    const monthMatch = contestName.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i);
    if (monthMatch) {
      const monthAbbrev = monthMatch[1].substring(0, 3);
      variations.push(contestName.replace(monthMatch[1], monthAbbrev));
    }
  } else if (platform === 'codeforces') {
    // Add variations with and without "Div." notation
    variations.push(
      contestName.replace(/Div\.\s*\d+/i, '').trim(),
      contestName.replace(/Division\s*\d+/i, '').trim()
    );
    
    // Handle different number formats (#123 vs 123)
    const numberMatch = contestName.match(/\d+/);
    if (numberMatch) {
      variations.push(
        `Codeforces Round #${numberMatch[0]}`,
        `Codeforces Round ${numberMatch[0]}`
      );
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

function extractContestName(videoTitle, platform) {
  const patterns = {
    leetcode: {
      pattern: /LeetCode\s+(Weekly|Biweekly)\s+Contest\s+\d+/i,
      clean: (match) => match[0]
    },
    codeforces: {
      pattern: /Codeforces\s+(Round|Contest|Educational|Global Round|Div\.\s*\d+)\s*(?:(?:#|No\.|№)\s*)?(\d+)/i,
      clean: (match) => {
        const base = `Codeforces ${match[1]}`;
        const number = match[2];
        return `${base} ${number}`.trim();
      }
    },
    codechef: {
      // Updated pattern to better match CodeChef contest titles including numbers
      pattern: /CodeChef\s+(?:([A-Za-z]+(?:\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))?\s*(?:Long|Cook-off|Lunchtime)(?:\s+\d{4})?)|(?:Starters\s*(\d+)))/i,
      clean: (match) => {
        if (match[2]) { // Starters with number
          return `CodeChef Starters ${match[2]}`;
        }
        return `CodeChef ${match[1].trim()}`;
      }
    }
  };

  const platformPattern = patterns[platform];
  if (!platformPattern) return null;

  const match = videoTitle.match(platformPattern.pattern);
  if (!match) {
    // Log unmatched titles for debugging
    console.log(`No match found for ${platform} video: ${videoTitle}`);
    return null;
  }

  return platformPattern.clean(match);
}

// Schedule automatic fetching every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Running scheduled solution video fetch');
  await fetchSolutionVideos();
});

export default {
  fetchSolutionVideos
};