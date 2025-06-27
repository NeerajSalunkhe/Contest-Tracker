import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DbConnect';
import Contest from '@/models/Contest';

export async function POST(req) {
  try {
    await dbConnect();
    const { userid } = await req.json();

    if (!userid) {
      return NextResponse.json({ error: 'Missing userid' }, { status: 400 });
    }

    const userDoc = await Contest.findOne({ userid });

    if (!userDoc) {
      return NextResponse.json({ contests: [] }); // No user found
    }

    const bookmarkedContests = userDoc.contests.filter(c => c.bookmark === true);

    return NextResponse.json({ contests: bookmarkedContests });

  } catch (error) {
    console.error('Error fetching bookmarked contests:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
