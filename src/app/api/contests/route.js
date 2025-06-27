// app/api/contests/route.js
import { NextResponse } from 'next/server';

const CLIST_USERNAME = 'Jack';
const CLIST_API_KEY = '67c5d819757590bb47a2460e4708767d18a2bf21';

const INCLUDED_PLATFORMS = ['codeforces.com', 'codechef.com', 'leetcode.com'];

const filterContest = (contest) => {
    const domain = new URL(`https://${contest.resource}`).hostname.replace('www.', '');
    const name = contest.event.toLowerCase();

    if (!INCLUDED_PLATFORMS.includes(domain)) return false;

    if (domain === 'codeforces.com' && !name.includes('round')) return false;
    if (domain === 'leetcode.com' && !(name.includes('weekly') || name.includes('biweekly'))) return false;
    if (domain === 'codechef.com' && !name.includes('starters')) return false;

    return true;
};

const transform = (c) => {
    const platform = new URL(`https://${c.resource}`).hostname.replace('www.', '');
    
    const offsetMs = 5.5 * 60 * 60 * 1000; 

    return {
        id: c.id,
        platform,
        name: c.event,
        url: c.href,
        startTime: new Date(new Date(c.start).getTime() + offsetMs),
        endTime: new Date(new Date(c.end).getTime() + offsetMs),
        durationSeconds: c.duration
    };
};


export async function GET() {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);

    const baseURL = 'https://clist.by/api/v4/contest/';
    const headers = {
        Authorization: `ApiKey ${CLIST_USERNAME}:${CLIST_API_KEY}`
    };

    // Fetch UPCOMING
    const upcomingURL = `${baseURL}?limit=1000&start__gte=${now.toISOString()}&order_by=start`;
    const upcomingRes = await fetch(upcomingURL, { headers });
    const upcomingData = await upcomingRes.json();

    const upcoming = upcomingData.objects
        .filter(filterContest)
        .map(transform);

    // Fetch PAST (within 3 months)
    const pastURL = `${baseURL}?limit=1000&start__gte=${threeMonthsAgo.toISOString()}&start__lt=${now.toISOString()}&order_by=-start`;
    const pastRes = await fetch(pastURL, { headers });
    const pastData = await pastRes.json();

    const past = pastData.objects
        .filter(filterContest)
        .map(transform);

    return NextResponse.json({ upcoming, past });
}
