import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DbConnect';
import Contest from '@/models/Contest';

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const { userid, contestId } = data;

    if (!userid || !contestId) {
      return NextResponse.json({ error: 'Missing userid or contestId' }, { status: 400 });
    }

    const userDoc = await Contest.findOne({ userid });

    if (!userDoc) {
      return NextResponse.json({ found: false, bookmark: false, completed: false });
    }

    const existingContest = userDoc.contests.find(c => c.id === contestId);

    if (!existingContest) {
      return NextResponse.json({ found: false, bookmark: false, completed: false });
    }

    return NextResponse.json({
      found: true,
      bookmark: existingContest.bookmark || false,
      completed: existingContest.completed || false
    });

  } catch (error) {
    console.error('Error fetching bookmark/completed status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
