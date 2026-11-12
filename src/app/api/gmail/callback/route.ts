import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, getUserInfo, setCredentials } from '@/lib/google-auth';
import { getUser, saveGmailTokens, updateUser } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/user/gmail?error=no_code', request.url));
  }

  try {
    const tokens = await getTokensFromCode(code);
    setCredentials(tokens);
    const userInfo = await getUserInfo(tokens.access_token!);

    // Get userId from state
    let userId: string | null = null;
    if (state) {
      try {
        const parsed = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = parsed.userId;
      } catch {
        // Ignore parse error
      }
    }

    // If no userId in state, try to find user by email
    if (!userId) {
      const user = await getUserByEmail(userInfo.email!);
      if (user) userId = user.uid;
    }

    if (!userId) {
      return NextResponse.redirect(new URL('/user/gmail?error=user_not_found', request.url));
    }

    // Save tokens
    await saveGmailTokens(userId, tokens);
    await updateUser(userId, {
      gmailConnected: true,
      displayName: userInfo.name,
      photoURL: userInfo.picture,
    });

    return NextResponse.redirect(new URL('/user/dashboard?gmail=connected', request.url));
  } catch (error) {
    console.error('Gmail connect callback error:', error);
    return NextResponse.redirect(new URL('/user/gmail?error=connection_failed', request.url));
  }
}

async function getUserByEmail(email: string) {
  const { getUserByEmail: getUserByEmailFn } = await import('@/lib/database');
  return getUserByEmailFn(email);
}