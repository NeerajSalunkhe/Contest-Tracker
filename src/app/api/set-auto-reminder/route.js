import { NextResponse } from 'next/server';
import DbConnect from '@/lib/DbConnect';
import AutoUser from '@/models/autouser';

export async function POST(req) {
  await DbConnect();
  const { userid, email, type } = await req.json();

  if (!userid || !email || !type) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  }

  const existing = await AutoUser.findOne({ userid });

  if (existing) {
    if (!existing.reminders.find((r) => r.type === type)) {
      existing.reminders.push({ type });
      await existing.save();
    }
  } else {
    await AutoUser.create({
      userid,
      email,
      reminders: [{ type }],
    });
  }

  return NextResponse.json({ success: true });
}
