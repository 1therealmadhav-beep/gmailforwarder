import { NextRequest, NextResponse } from 'next/server';
import { processUserEmails } from '@/lib/email-processor';
import { getUser } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Verify user exists
    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await processUserEmails(userId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Manual email processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    );
  }
}