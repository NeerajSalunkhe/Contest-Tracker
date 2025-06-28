import { NextResponse } from 'next/server';
import DbConnect from '@/lib/DbConnect';
import Contest from '@/models/Contest';

export async function POST(req) {
  await DbConnect();

  try {
    const { userid, email, contestid, reminderTime, contest } = await req.json();

    if (!userid || !email || !contest?.id || !reminderTime) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const parsedReminderTime = new Date(reminderTime); // ✅ Convert to Date object

    if (isNaN(parsedReminderTime.getTime())) {
      return NextResponse.json({ error: 'Invalid reminder time' }, { status: 400 });
    }
    // console.log(`start time :${contest.startTime}`);
    // console.log(`reminder time : ${reminderTime}`);
    // const nowIST = new Date().toLocaleString("en-IN", {
    //   timeZone: "Asia/Kolkata",
    //   hour12: true,
    //   dateStyle: "medium",
    //   timeStyle: "short",
    // });
    // console.log("Current IST:", nowIST);
    // Find the user's contest doc
    const userDoc = await Contest.findOne({ userid });

    if (!userDoc) {
      // If the document doesn't exist, create it with one contest
      await Contest.create({
        userid,
        email,
        contests: [
          {
            ...contest,
            reminders: [{ time: parsedReminderTime, sent: false }],
          },
        ],
      });

      return NextResponse.json({ success: true, created: true });
    }

    const contestIndex = userDoc.contests.findIndex((c) => c.id === contest.id);

    if (contestIndex === -1) {
      // If contest not found, add it
      userDoc.contests.push({
        ...contest,
        reminders: [{ time: parsedReminderTime, sent: false }],
      });
    } else {
      // If contest found, update/add the reminder
      const contestEntry = userDoc.contests[contestIndex];

      const alreadySet = contestEntry.reminders.some(
        (r) => new Date(r.time).getTime() === parsedReminderTime.getTime()
      );

      if (!alreadySet) {
        contestEntry.reminders.push({ time: parsedReminderTime, sent: false });
      }
    }

    await userDoc.save();
    return NextResponse.json({ success: true, reminderTime });

  } catch (err) {
    console.error('Error setting reminder:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
