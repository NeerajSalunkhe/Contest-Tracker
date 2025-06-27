import { NextResponse } from 'next/server';
import DbConnect from '@/lib/DbConnect';
import Contest from '@/models/Contest';

export async function POST(req) {
  await DbConnect();

  try {
    const { userid, contestid } = await req.json();

    if (!userid || !contestid) {
      return NextResponse.json({ error: 'Missing userid or contestid' }, { status: 400 });
    }

    const userDoc = await Contest.findOne({ userid });

    if (!userDoc) {
      return NextResponse.json({ reminders: [] }); // user not found
    }

    const contest = userDoc.contests.find(c => c.id === Number(contestid));

    if (!contest) {
      return NextResponse.json({ reminders: [] }); // contest not found
    }

    return NextResponse.json({ reminders: contest.reminders || [] });

  } catch (err) {
    console.error('Error fetching reminders:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
