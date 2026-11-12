import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, getUserAuditLogs } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let logs;
    if (userId) {
      logs = await getUserAuditLogs(userId, limit);
    } else {
      logs = await getAuditLogs(limit);
    }
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'Failed to get audit logs' }, { status: 500 });
  }
}