import { NextRequest, NextResponse } from 'next/server';
import { removeGmailTokens, updateUser } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await removeGmailTokens(userId);
    await updateUser(userId, { gmailConnected: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect Gmail error:', error);
    return NextResponse.json({ error: 'Failed to disconnect Gmail' }, { status: 500 });
  }
}