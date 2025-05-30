import cron from 'node-cron';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import Contest from '../models/Contest.js';

// Initialize email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Check for reminders every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const contests = await Contest.find({
      startTime: { $gt: now }
    });

    for (const contest of contests) {
      const reminders = await Reminder.find({
        contestId: contest._id,
        active: true
      }).populate('userId');

      for (const reminder of reminders) {
        const reminderTime = new Date(contest.startTime);
        reminderTime.setMinutes(reminderTime.getMinutes() - reminder.timing);

        // Check if it's time to send the reminder
        const diffMinutes = Math.floor((reminderTime - now) / (1000 * 60));
        if (diffMinutes <= 0 && diffMinutes > -1) { // Within the last minute
          await sendReminder(reminder, contest);
          reminder.active = false;
          await reminder.save();
        }
      }
    }
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
});

async function sendReminder(reminder, contest) {
  const user = reminder.userId;
  const message = `Reminder: The contest "${contest.name}" on ${contest.platform} starts in ${reminder.timing} minutes!\nContest URL: ${contest.url}`;

  try {
    if (reminder.type === 'email') {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Contest Reminder: ${contest.name}`,
        text: message
      });
      console.log(`Email reminder sent to ${user.email}`);
    } else if (reminder.type === 'sms') {
      await twilioClient.messages.create({
        body: message,
        to: reminder.phone,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      console.log(`SMS reminder sent to ${reminder.phone}`);
    }
  } catch (error) {
    console.error(`Error sending ${reminder.type} reminder:`, error);
  }
}

export default {
  sendReminder
};