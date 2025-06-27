import { NextResponse } from 'next/server';
import DbConnect from '@/lib/DbConnect';
import AutoUser from '@/models/autouser';

export async function POST(req) {
  await DbConnect();
  const { userid } = await req.json();

  if (!userid) {
    return NextResponse.json({ success: false, error: 'Missing userid' }, { status: 400 });
  }

  const user = await AutoUser.findOne({ userid });

  return NextResponse.json({ success: true, reminders: user?.reminders || [] });
}
