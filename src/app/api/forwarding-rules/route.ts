import { NextRequest, NextResponse } from 'next/server';
import { getForwardingRules, createForwardingRule, updateForwardingRule, deleteForwardingRule } from '@/lib/database';
import type { ForwardingRule } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const rules = await getForwardingRules(userId);
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Get forwarding rules error:', error);
    return NextResponse.json({ error: 'Failed to get rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...ruleData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!ruleData.name || !ruleData.toEmail) {
      return NextResponse.json({ error: 'Name and toEmail are required' }, { status: 400 });
    }

    const rule = await createForwardingRule(userId, {
      name: ruleData.name,
      enabled: ruleData.enabled ?? true,
      fromEmail: ruleData.fromEmail,
      toEmail: ruleData.toEmail,
      subjectFilter: ruleData.subjectFilter,
      labelFilter: ruleData.labelFilter,
      forwardAsAttachment: ruleData.forwardAsAttachment ?? false,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Create forwarding rule error:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ruleId, ...ruleData } = body;

    if (!userId || !ruleId) {
      return NextResponse.json({ error: 'User ID and Rule ID required' }, { status: 400 });
    }

    await updateForwardingRule(userId, ruleId, ruleData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update forwarding rule error:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const ruleId = searchParams.get('ruleId');

    if (!userId || !ruleId) {
      return NextResponse.json({ error: 'User ID and Rule ID required' }, { status: 400 });
    }

    await deleteForwardingRule(userId, ruleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete forwarding rule error:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}