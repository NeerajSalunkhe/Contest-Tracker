import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Solution from '@/models/Solution';
import { cleanContestName, getPlatformPlaylistId } from '@/lib/cleanContest';
import DbConnect from '@/lib/DbConnect';

const halfday = 12 * 60 * 60 * 1000; // 12 hours
const twoMonths = 2 * 30 * 24 * 60 * 60 * 1000; // ~60 days

export async function POST(req) {
  try {
    await DbConnect();
    const { contest } = await req.json();

    if (!contest || !contest.id || !contest.platform || !contest.name) {
      return NextResponse.json({ error: 'Invalid contest object' }, { status: 400 });
    }

    const contestId = contest.id;
    const platform = contest.platform.replace('.com', '').toLowerCase();
    const cleanedName = cleanContestName(contest.name);
    const playlistId = getPlatformPlaylistId(contest.platform);

    if (!playlistId) {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    let solution = await Solution.findOne({ contestId });

    // ✅ 1. Delete if older than 2 months
    if (solution?.startdate && new Date() - new Date(solution.startdate) > twoMonths) {
      await Solution.deleteMany({ contestId });
      solution = null;
    }

    // ✅ 2. If valid solutionLink exists, return it immediately
    if (solution?.solutionLink && solution.solutionLink.trim() !== '') {
      return NextResponse.json({ found: true, url: solution.solutionLink });
    }

    // ✅ 3. Skip YouTube API if checked <12h ago (no matter what)
    if (solution && Date.now() - new Date(solution.lastChecked).getTime() < halfday) {
      return NextResponse.json({ found: false, message: 'Checked recently, not found' }, { status: 404 });
    }
    console.log('new122222222222');
    // ✅ 4. Only now call YouTube API
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.error) {
      console.error('YouTube API error:', json.error);
      return NextResponse.json({ error: json.error.message }, { status: 500 });
    }

    const match = json.items.find(item =>
      item.snippet.title.toLowerCase().includes(cleanedName)
    );

    const matchedLink = match
      ? `https://www.youtube.com/watch?v=${match.snippet.resourceId.videoId}`
      : null;

    if (solution) {
      solution.solutionLink = matchedLink || null;
      solution.lastChecked = new Date();
      await solution.save();
    } else {
      await Solution.create({
        contestId,
        platform,
        solutionLink: matchedLink,
        startdate: contest.startTime,
        lastChecked: new Date(),
      });
    }

    return matchedLink
      ? NextResponse.json({ found: true, url: matchedLink })
      : NextResponse.json({ found: false, message: 'No matching video found' }, { status: 404 });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
