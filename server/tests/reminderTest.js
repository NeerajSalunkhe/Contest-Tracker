import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import mongoose from 'mongoose';

dotenv.config();

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

async function testEmail() {
  console.log('Testing email notification...');
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.TEST_EMAIL, // The email address to test with
      subject: 'Test Contest Reminder',
      text: 'This is a test reminder for an upcoming contest. If you receive this, the email notification system is working correctly!'
    });
    console.log('✅ Email test successful!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

async function testSMS() {
  console.log('Testing SMS notification...');
  try {
    const message = await twilioClient.messages.create({
      body: 'This is a test reminder for an upcoming contest. If you receive this, the SMS notification system is working correctly!',
      to: process.env.TEST_PHONE_NUMBER, // The phone number to test with
      from: process.env.TWILIO_PHONE_NUMBER
    });
    console.log('✅ SMS test successful!');
    console.log('Message SID:', message.sid);
  } catch (error) {
    console.error('❌ SMS test failed:', error.message);
  }
}

async function runTests() {
  console.log('Starting reminder system tests...\n');
  
  // Test email first
  await testEmail();
  console.log('\n-------------------\n');
  
  // Then test SMS
  await testSMS();
  
  console.log('\nAll tests completed!');
  process.exit(0);
}

runTests();