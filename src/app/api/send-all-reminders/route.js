import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import DbConnect from '@/lib/DbConnect';
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
    // Fetch latest 4 contests from external API
    const contestsRes = await fetch(`${process.env.NEXT_PUBLIC_GLOBAL_URI}/api/contests`);
    if (!contestsRes.ok) {
      throw new Error(`Contests fetch failed with status ${contestsRes.status}`);
    }
    const contestData = await contestsRes.json();
    const allContests = contestData.contests?.slice(0, 4) || [];

    // Fetch all auto-reminder users
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

          if (reminder.type === '6amDayOf') {
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
              const humanReadableTime = `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''
                }${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`.trim();

              const formattedStart = contestStart.toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
              });

              await transporter.sendMail({
                from: `"Contest Tracker" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: `⏰ Reminder: ${contest.name} — Starting in ${humanReadableTime || 'less than a minute'}`,
                html: `
  <div style="font-family: 'Segoe UI', sans-serif; background-color: #121212; padding: 40px 20px; color: #e5e5e5;">
    <div style="max-width: 620px; margin: auto; background-color: #1e1e1e; border-radius: 12px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.4);">
      <div style="text-align: center; padding: 30px 20px;">
        <img src="https://contest-tracker-pearl.vercel.app/contest.gif" alt="Contest Tracker" style="width: 180px; margin-bottom: 20px;" />
        
        <h2 style="margin: 10px 0; font-size: 22px;">
          <img src="${getPlatformLogo(contest.platform)}" alt="${contest.platform}" style="height: 24px; vertical-align: middle; margin-right: 8px;" />
          ${contest.name} – <span style="color: #90cdf4;">Starting in ${humanReadableTime || 'less than a minute'}</span>
        </h2>

        <div style="margin: 16px 0;">
          <a href="https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(contest.name)}&dates=${formatGoogleTime(contestStart)}/${formatGoogleTime(new Date(contestStart.getTime() + 60 * 60 * 1000))}&details=${encodeURIComponent(`Join this contest: ${contest.url}`)}&location=${encodeURIComponent(contest.url)}&recur=RRULE:FREQ=DAILY;COUNT=1&add=popup"
            target="_blank"
            style="display: inline-block; padding: 10px 20px; background-color: #34a853; color: white; border-radius: 6px; text-decoration: none; font-size: 15px;">
            📅 Add to Google Calendar
          </a>
        </div>

        <p style="font-size: 16px; color: #ccc; margin-bottom: 20px;">
          Your contest is about to start. Here's everything you need:
        </p>

        <div style="margin: 20px 0; background-color: #2a2a2a; padding: 20px; border-radius: 10px;">
          <p><strong>📅 Start Time:</strong> ${formattedStart} IST</p>
          <p><strong>⏳ Time Left:</strong> ${humanReadableTime || 'less than a minute'}</p>
          <p><strong>🌐 Platform:</strong> ${contest.platform.toUpperCase()}</p>
        </div>

        <div style="margin: 24px 0;">
          <a href="${contest.url}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            🚪 Go to Contest
          </a>
        </div>
      </div>

      <div style="text-align: center; background-color: #1a1a1a; padding: 16px; font-size: 12px; color: #666;">
        Sent by <a href="https://contest-tracker-pearl.vercel.app/" style="color: #4f46e5; text-decoration: none;">Contest Tracker</a> • Never miss a contest
      </div>
    </div>
  </div>`
              });

              reminder.sent = true;
              shouldSave = true;
              sentCount++;
              break; // only send once per reminder
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
        await fetch(`${process.env.BASE_URL}/api/update-reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid, reminders }),
        });
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
