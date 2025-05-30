import axios from 'axios';
import { request, gql } from 'graphql-request';
import Contest from '../models/Contest.js';
import puppeteer from "puppeteer";
import { addDays, addHours, parse,subDays } from 'date-fns';
import e from 'express';

export async function fetchCodeforcesContests() {
  try {
    const response = await axios.get('https://codeforces.com/api/contest.list');
    if (response.data.status === 'OK') {
      const contests = response.data.result.map(contest => ({
        name: contest.name,
        platform: 'codeforces',
        startTime: new Date(contest.startTimeSeconds * 1000),
        endTime: new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000),
        url: `https://codeforces.com/contest/${contest.id}`,
        isBookmarked: false
      }));
      return contests;
    }
    return [];
  } catch (error) {
    console.error('Error fetching Codeforces contests:', error);
    return [];
  }
}

export async function fetchLeetCodeContests() {
  try {
    const query = gql`
      query upcomingContests {
        upcomingContests {
          title
          titleSlug
          startTime
          duration
        }
      }
    `;

    const response = await request('https://leetcode.com/graphql', query);

    console.log("LeetCode API Response:", response); // Debugging output

    if (!response || !response.upcomingContests) {
      throw new Error("Unexpected API response structure");
    }

    const contests = response.upcomingContests.map(contest => ({
      name: contest.title,
      platform: 'leetcode',
      startTime: new Date(contest.startTime * 1000),
      endTime: new Date((contest.startTime + contest.duration) * 1000),
      url: `https://leetcode.com/contest/${contest.titleSlug}`,
      isBookmarked: false
    }));

    return contests;
  } catch (error) {
    console.error('Error fetching LeetCode contests:', error);
    return [];
  }
}


export async function fetchCodeChefContests() {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://www.codechef.com/contests', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Extract upcoming contests
    const upcomingContests = await page.evaluate(() => {
      const contests = [];
      const upcomingSection = document.querySelector('div[class*="contest-tables"] div[class*="table__container"]:first-child');
      
      if (upcomingSection) {
        const contestElements = upcomingSection.querySelectorAll('div[class*="flex__container"]');
        
        contestElements.forEach(element => {
          const nameElement = element.querySelector('a');
          const timerContainer = element.querySelector('div[class*="_timer__container"]');
          
          if (nameElement && timerContainer) {
            const name = nameElement.textContent.trim();
            const url = nameElement.href;
            const timeTexts = Array.from(timerContainer.querySelectorAll('p')).map(p => p.textContent.trim());
            
            contests.push({
              name,
              url,
              timeInfo: timeTexts,
              isPast: false
            });
          }
        });
      }
      return contests;
    });

    // Extract past contests
    const pastContests = await page.evaluate(() => {
      const contests = [];
      const pastSection = document.querySelector('div[class*="contest-tables"] div[class*="table__container"]:last-child');
      
      if (pastSection) {
        const contestElements = pastSection.querySelectorAll('div[class*="flex__container"]');
        
        contestElements.forEach(element => {
          const nameElement = element.querySelector('a');
          const participantsElement = element.querySelector('div[class*="_subtitle"]');
          
          if (nameElement) {
            const name = nameElement.textContent.trim();
            const url = nameElement.href;
            
            contests.push({
              name,
              url,
              isPast: true
            });
          }
        });
      }
      return contests;
    });

    await browser.close();

    // Process upcoming contests
    const now = new Date();
    const processedUpcomingContests = upcomingContests.map(contest => {
      let startTime = new Date(now);
      
      // Parse time information
      contest.timeInfo.forEach(timeText => {
        if (timeText.includes('Days')) {
          const days = parseInt(timeText);
          startTime = addDays(startTime, days);
        } else if (timeText.includes('Hrs')) {
          const hours = parseInt(timeText);
          startTime = addHours(startTime, hours);
        }
      });

      // Add 2 hours for contest duration (typical CodeChef contest duration)
      const endTime = addHours(startTime, 2);

      return {
        name: contest.name,
        platform: 'codechef',
        startTime,
        endTime,
        url: contest.url,
        isBookmarked: false
      };
    });

    // Process past contests
    // For past contests, we'll set approximate dates since exact dates aren't available
    const processedPastContests = pastContests.map((contest, index) => {
      // Set start time to progressively earlier dates for past contests
      const startTime = subDays(now, (index + 1) * 7); // Each contest 1 week apart
      const endTime = addHours(startTime, 2); // 2-hour duration

      return {
        name: contest.name,
        platform: 'codechef',
        startTime,
        endTime,
        url: contest.url,
        isBookmarked: false
      };
    });

    return [...processedUpcomingContests, ...processedPastContests];
  } catch (error) {
    console.error('Error fetching CodeChef contests:', error);
    return [];
  }
}


export async function updateContests() {
  try {
    const [codeforcesContests, leetcodeContests, codechefContests] = await Promise.all([
      fetchCodeforcesContests(),
      fetchLeetCodeContests(),
      fetchCodeChefContests()
    ]);

    const allContests = [...codeforcesContests, ...leetcodeContests, ...codechefContests];

    for (const contest of allContests) {
      await Contest.findOneAndUpdate(
        { 
          name: contest.name,
          platform: contest.platform 
        },
        contest,
        { upsert: true, new: true }
      );
    }

    console.log('Contests updated successfully');
  } catch (error) {
    console.error('Error updating contests:', error);
  }
}