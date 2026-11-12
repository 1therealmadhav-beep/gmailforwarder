import { NextRequest, NextResponse } from 'next/server';
import { adminGetStats, adminGetAllUsers } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const stats = await adminGetStats();
    const users = await adminGetAllUsers();

    return NextResponse.json({
      stats,
      users: users.map(u => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        gmailConnected: u.gmailConnected,
        createdAt: u.createdAt,
        forwardingRulesCount: u.forwardingRules?.length || 0,
      }))
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}