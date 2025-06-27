import { NextResponse } from 'next/server';
import DbConnect from '@/lib/DbConnect';
import AutoUser from '@/models/autouser';

export async function POST(req) {
  await DbConnect();
  const { userid, type } = await req.json();

  if (!userid || !type) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  }

  const user = await AutoUser.findOne({ userid });

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  user.reminders = user.reminders.filter((r) => r.type !== type);

  if (user.reminders.length === 0) {
    await AutoUser.deleteOne({ userid });
  } else {
    await user.save();
  }

  return NextResponse.json({ success: true });
}
