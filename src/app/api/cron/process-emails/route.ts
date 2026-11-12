import { NextRequest, NextResponse } from 'next/server';
import { processAllUsersEmails } from '@/lib/email-processor';
import { createAuditLog } from '@/lib/database';

// This endpoint should be called by Vercel Cron
// Add to vercel.json or vercel.ts:
// {
//   "crons": [{
//     "path": "/api/cron/process-emails",
//     "schedule": "*/5 * * * *"
//   }]
// }

// Optional: Protect with a secret token
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret if set
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const startTime = Date.now();

    const result = await processAllUsersEmails();

    const duration = Date.now() - startTime;

    await createAuditLog({
      userId: 'system',
      action: 'cron_email_processing',
      details: {
        ...result,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      ...result,
      durationMs: duration,
    });
  } catch (error) {
    console.error('Cron email processing error:', error);

    await createAuditLog({
      userId: 'system',
      action: 'cron_email_processing_failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    );
  }
}