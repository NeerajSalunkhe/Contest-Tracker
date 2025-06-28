import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import DbConnect from '@/lib/DbConnect';
import Contest from '@/models/Contest';

export async function GET() {
  await DbConnect();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  try {
    const allUsers = await Contest.find({});
    let sentCount = 0;

    // Get current IST time
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    for (const user of allUsers) {
      const { userid, email, contests } = user;

      if (!email) {
        console.warn(`⚠️ Skipping user ${userid} — missing email.`);
        continue;
      }

      let shouldSave = false;

      for (const contest of contests) {
        for (const reminder of contest.reminders) {
          if (
            reminder &&
            !reminder.sent &&
            new Date(reminder.time) <= nowIST
          ) {
            try {
              const startDate = new Date(contest.startTime); // Already in IST

              const diffMs = startDate.getTime() - nowIST.getTime();
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

              const humanReadableTime = `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''
                }${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`.trim();

              const formattedStart = startDate.toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
              });

              await transporter.sendMail({
                from: process.env.GMAIL_USER,
                to: email,
                subject: `⏰ Reminder: ${contest.name} is starting soon!`,
                text: `Hello!\n\nThis is a reminder that the contest "${contest.name}" on ${contest.url} is starting at:\n${formattedStart} IST.\nTime remaining: ${humanReadableTime || 'less than a minute'}.\n\nGood luck!`,
              });

              reminder.sent = true;
              shouldSave = true;
              sentCount++;
            } catch (err) {
              console.error(`❌ Failed to send reminder for user ${userid}:`, err);
              return NextResponse.json(
                { success: false, error: 'email_send_failed', details: err.message },
                { status: 500 }
              );
            }
          }
        }
      }

      if (shouldSave) {
        await user.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${sentCount} contest email reminders`,
    });

  } catch (error) {
    console.error('❌ Contest reminder error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
