import { NextResponse } from 'next/server';
import dbConnect from '@/lib/DbConnect';
import Contest from '@/models/Contest';

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const { userid, email,contest, bookmark, completed } = data;

    if (!userid || !contest?.id||!email) {
      return NextResponse.json({ error: 'Missing userid or contest id' }, { status: 400 });
    }

    const contestId = contest.id;
    const userDoc = await Contest.findOne({ userid });

    if (userDoc) {
      const index = userDoc.contests.findIndex(c => c.id === contestId);

      // Contest exists
      if (index !== -1) {
        const existingContest = userDoc.contests[index];

        // Apply updates first
        if (bookmark !== undefined && bookmark !== null) {
          existingContest.bookmark = bookmark;
        }
        if (completed !== undefined && completed !== null) {
          existingContest.completed = completed;
        }

        // After update: check if bookmark and completed are false AND reminders is empty
        if (
          existingContest.bookmark === false &&
          existingContest.completed === false &&
          (!existingContest.reminders || existingContest.reminders.length === 0)
        ) {
          userDoc.contests.splice(index, 1); // remove contest
          await userDoc.save();
          return NextResponse.json({ message: 'Contest removed', deleted: true });
        }

        await userDoc.save();
        return NextResponse.json({ message: 'Contest updated', updated: true });
      }

      // Contest doesn't exist → push new contest
      userDoc.contests.push({
        id: contest.id,
        name: contest.name || '',
        platform: contest.platform || '',
        url: contest.url || '',
        startTime: contest.startTime || null,
        endTime: contest.endTime || null,
        durationSeconds: contest.durationSeconds || 0,
        bookmark: bookmark === true,
        completed: completed === true,
        reminders: contest.reminders || []
      });

      await userDoc.save();
      return NextResponse.json({ message: 'New contest added', created: true });
    }

    // User doc doesn't exist → create it with contest
    const newDoc = new Contest({
      userid,
      email,
      contests: [{
        id: contest.id,
        name: contest.name || '',
        platform: contest.platform || '',
        url: contest.url || '',
        startTime: contest.startTime || null,
        endTime: contest.endTime || null,
        durationSeconds: contest.durationSeconds || 0,
        bookmark: bookmark === true,
        completed: completed === true,
        reminders: contest.reminders || []
      }]
    });

    await newDoc.save();
    return NextResponse.json({ message: 'New user and contest created', created: true });

  } catch (error) {
    console.error('Error updating or creating contest:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
