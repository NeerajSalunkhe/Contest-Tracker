import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import DbConnect from '@/lib/DbConnect';
import Contest from '@/models/Contest';
import Autouser from '@/models/autouser';
function formatGoogleTime(date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function getPlatformLogo(platform) {
  const domain = (platform || '').toLowerCase();
  if (domain.includes('codeforces')) {
    return 'https://contest-tracker-pearl.vercel.app/cf-96.png';
  } else if (domain.includes('codechef')) {
    return 'https://contest-tracker-pearl.vercel.app/cc-100.png';
  } else if (domain.includes('leetcode')) {
    return 'https://contest-tracker-pearl.vercel.app/lc-96.png';
  } else {
    return '';
  }
}

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
    // Fetch latest 4 upcoming contests
    const contestsRes = await fetch(`${process.env.NEXT_PUBLIC_GLOBAL_URI}/api/contests`);
    if (!contestsRes.ok) {
      throw new Error(`Contests fetch failed with status ${contestsRes.status}`);
    }
    const contestData = await contestsRes.json();
    const allContests = contestData.contests?.slice(0, 4) || [];


    // Fetch all auto reminders
    const allUsers = await Autouser.find({});



    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    let sentCount = 0;

    for (const user of allUsers) {
      const { userid, email, reminders } = user;

      if (!email) {
        console.warn(`⚠️ Skipping user ${userid} — missing email.`);
        continue;
      }

      let shouldSave = false;

      for (const reminder of reminders) {
        if (reminder.sent) continue;

        for (const contest of allContests) {
          const contestStart = new Date(contest.startTime);

          let shouldSend = false;

          if (
            reminder.type === '1hrBefore' &&
            Math.abs(contestStart.getTime() - nowIST.getTime()) <= 60 * 60 * 1000
          ) {
            shouldSend = true;
          }

          if (
            reminder.type === '6amDayOf'
          ) {
            const dayBefore = new Date(contestStart);
            dayBefore.setDate(contestStart.getDate() - 1);
            const dayBeforeIST = new Date(dayBefore.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

            if (
              nowIST.getFullYear() === dayBeforeIST.getFullYear() &&
              nowIST.getMonth() === dayBeforeIST.getMonth() &&
              nowIST.getDate() === dayBeforeIST.getDate() &&
              nowIST.getHours() === 6
            ) {
              shouldSend = true;
            }
          }


          if (shouldSend) {
            try {
              const diffMs = contestStart.getTime() - nowIST.getTime();
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              const humanReadableTime = `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''}${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`.trim();

              const formattedStart = contestStart.toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
              });

              await transporter.sendMail({
                from: `"Contest Tracker" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: `⏰ Reminder: ${contest.name} — Starting in ${humanReadableTime || 'less than a minute'}`,
                html: `<!-- email template same as before -->${/* reusing same HTML from your original */''}`
              });

              reminder.sent = true;
              shouldSave = true;
              sentCount++;
              break; // only send one reminder per contest
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
        // You must implement update logic on your reminder model (if it's stored separately)
        await fetch(`${process.env.BASE_URL}/api/update-reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid, reminders }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${sentCount} auto contest reminders`,
    });

  } catch (error) {
    console.error('❌ Auto reminder error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
