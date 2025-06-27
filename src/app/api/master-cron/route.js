import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ;

    // Call both routes
    const [remindersRes, contestsRes] = await Promise.all([
      fetch(`${baseUrl}/api/send-all-reminders`),
    ]);

    const remindersData = await remindersRes.json();
    // const contestsData = await contestsRes.json();

    return NextResponse.json({
      success: true,
      remindersData,
    //   contestsData
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
