import { NextRequest, NextResponse } from 'next/server';
import { createNodemailerService } from '@/lib/nodemailer';
import type { SMTPConfig } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, secure, auth } = body;

    if (!host || !port || !auth?.user || !auth?.pass) {
      return NextResponse.json({ error: 'Missing required SMTP configuration' }, { status: 400 });
    }

    const config: SMTPConfig = {
      host,
      port: parseInt(port),
      secure: Boolean(secure),
      auth: {
        user: auth.user,
        pass: auth.pass,
      },
    };

    const service = createNodemailerService(config);
    const result = await service.verifyConnection();
    await service.close();

    return NextResponse.json(result);
  } catch (error) {
    console.error('SMTP test error:', error);
    return NextResponse.json({ success: false, error: 'Test failed' }, { status: 500 });
  }
}