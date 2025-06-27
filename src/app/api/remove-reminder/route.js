import { NextResponse } from 'next/server';
import DbConnect from '@/lib/DbConnect';
import Contest from '@/models/Contest';

export async function POST(req) {
  await DbConnect();

  try {
    const { userid, contestid, reminderTime } = await req.json();

    if (!userid || !contestid || !reminderTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the user's document
    const userDoc = await Contest.findOne({ userid });

    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const contestIndex = userDoc.contests.findIndex(c => c.id === contestid);
    if (contestIndex === -1) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    const contest = userDoc.contests[contestIndex];

    // Remove the specified reminder
    const originalLength = contest.reminders.length;
    contest.reminders = contest.reminders.filter(
      (r) => new Date(r.time).getTime() !== new Date(reminderTime).getTime()
    );

    if (contest.reminders.length === originalLength) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    // ✅ Check deletion condition
    const shouldDelete =
      contest.reminders.length === 0 &&
      contest.bookmark === false &&
      contest.completed === false;

    if (shouldDelete) {
      // Delete the contest from user's list
      userDoc.contests.splice(contestIndex, 1);
    }

    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: shouldDelete ? 'Reminder and contest deleted' : 'Reminder deleted',
      updatedContests: userDoc.contests,
    });
  } catch (err) {
    console.error('Error removing reminder:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
