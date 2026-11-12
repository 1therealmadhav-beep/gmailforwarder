import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-auth';
import { getUserByEmail, createUser } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const email = searchParams.get('email');

  if (action === 'google') {
    const state = email ? Buffer.from(JSON.stringify({ email })).toString('base64') : undefined;
    const authUrl = getAuthUrl(state);
    return NextResponse.redirect(authUrl);
  }

  if (action === 'callback') {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
    }

    try {
      const { getTokensFromCode, getUserInfo, setCredentials } = await import('@/lib/google-auth');
      const tokens = await getTokensFromCode(code);
      setCredentials(tokens);

      const userInfo = await getUserInfo(tokens.access_token!);

      // Check if user exists
      let user = await getUserByEmail(userInfo.email!);

      if (!user) {
        // Create new user
        user = await createUser({
          uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: userInfo.email!,
          displayName: userInfo.name,
          photoURL: userInfo.picture,
          role: 'user',
          gmailConnected: true,
          gmailTokens: tokens,
          forwardingRules: [],
          settings: {
            autoForward: true,
            forwardDelay: 0,
            maxEmailsPerHour: 100,
            notifyOnForward: true,
            theme: 'system',
          },
        });
      } else {
        // Update existing user with Gmail tokens
        const { updateUser, saveGmailTokens } = await import('@/lib/database');
        await updateUser(user.uid, {
          displayName: userInfo.name,
          photoURL: userInfo.picture,
          gmailConnected: true,
        });
        await saveGmailTokens(user.uid, tokens);
      }

      // Set session cookie or redirect to dashboard
      const response = NextResponse.redirect(new URL('/user/dashboard', request.url));
      response.cookies.set('user_uid', user.uid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return response;
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}