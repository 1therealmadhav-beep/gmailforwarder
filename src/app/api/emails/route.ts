import { NextRequest, NextResponse } from 'next/server';
import { getEmailMessages, getUnforwardedEmails } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const unforwarded = searchParams.get('unforwarded') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    let emails;
    if (unforwarded) {
      emails = await getUnforwardedEmails(userId);
    } else {
      emails = await getEmailMessages(userId, limit);
    }
    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Get emails error:', error);
    return NextResponse.json({ error: 'Failed to get emails' }, { status: 500 });
  }
}