import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  const authUrl = getAuthUrl(state);

  return NextResponse.json({ authUrl });
}