import nodemailer from 'nodemailer';
import type { SMTPConfig, EmailMessage, ForwardingRule } from '@/types';

export class NodemailerService {
  private transporter: nodemailer.Transporter | null = null;
  private config: SMTPConfig;

  constructor(config: SMTPConfig) {
    this.config = config;
    this.createTransporter();
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      },
      // Connection pool for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) this.createTransporter();
      await this.transporter!.verify();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection verification failed' };
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
    attachments?: Array<{ filename: string; content: string; contentType: string }>
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      if (!this.transporter) this.createTransporter();

      const fromEmail = this.config.fromEmail || this.config.auth.user;
      const fromName = this.config.fromName || 'Gmail Forwarder';

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text,
        html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          encoding: 'base64',
        })),
      };

      const info = await this.transporter!.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
    }
  }

  async forwardMessage(originalMessage: EmailMessage, rule: ForwardingRule): Promise<{ success: boolean; error?: string }> {
    try {
      let forwardText = `-------- Forwarded Message --------\n`;
      forwardText += `From: ${originalMessage.from}\n`;
      forwardText += `To: ${originalMessage.to.join(', ')}\n`;
      if (originalMessage.cc && originalMessage.cc.length > 0) {
        forwardText += `Cc: ${originalMessage.cc.join(', ')}\n`;
      }
      forwardText += `Date: ${new Date(originalMessage.receivedAt).toLocaleString()}\n`;
      forwardText += `Subject: ${originalMessage.subject}\n\n`;
      forwardText += originalMessage.body;

      let forwardHtml = originalMessage.htmlBody;
      if (forwardHtml) {
        forwardHtml = `
          <div style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #666; font-family: Arial, sans-serif;">
            <p style="margin: 0 0 8px 0;"><strong>-------- Forwarded Message --------</strong></p>
            <p style="margin: 4px 0;"><strong>From:</strong> ${originalMessage.from}</p>
            <p style="margin: 4px 0;"><strong>To:</strong> ${originalMessage.to.join(', ')}</p>
            ${originalMessage.cc && originalMessage.cc.length > 0 ? `<p style="margin: 4px 0;"><strong>Cc:</strong> ${originalMessage.cc.join(', ')}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(originalMessage.receivedAt).toLocaleString()}</p>
            <p style="margin: 4px 0;"><strong>Subject:</strong> ${originalMessage.subject}</p>
            <hr style="margin: 8px 0; border-color: #e5e7eb;">
            ${forwardHtml}
          </div>
        `;
      }

      const subject = rule.forwardAsAttachment
        ? `[Forwarded] ${originalMessage.subject}`
        : `Fwd: ${originalMessage.subject}`;

      // Prepare attachments if forwarding as attachment
      const attachments = rule.forwardAsAttachment && originalMessage.htmlBody ? [
        {
          filename: `forwarded-${originalMessage.id}.eml`,
          content: Buffer.from(this.createEmlContent(originalMessage)).toString('base64'),
          contentType: 'message/rfc822',
        }
      ] : undefined;

      const result = await this.sendEmail(rule.toEmail, subject, forwardText, forwardHtml, attachments);
      return { success: result.success, error: result.error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Forwarding failed' };
    }
  }

  private createEmlContent(message: EmailMessage): string {
    const lines = [
      `From: ${message.from}`,
      `To: ${message.to.join(', ')}`,
      message.cc?.length ? `Cc: ${message.cc.join(', ')}` : '',
      `Subject: ${message.subject}`,
      `Date: ${new Date(message.receivedAt).toUTCString()}`,
      `Message-ID: <${message.id}@gmail-forwarder>`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      message.body,
    ];
    return lines.filter(Boolean).join('\r\n');
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
}

export function createNodemailerService(config: SMTPConfig): NodemailerService {
  return new NodemailerService(config);
}

// Predefined SMTP configurations for common providers
export const COMMON_SMTP_CONFIGS = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    description: 'Gmail (requires App Password)',
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    description: 'Outlook / Hotmail / Live',
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    description: 'Yahoo Mail',
  },
  zoho: {
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    description: 'Zoho Mail',
  },
  protonmail: {
    host: 'smtp.protonmail.ch',
    port: 465,
    secure: true,
    description: 'ProtonMail (requires Bridge)',
  },
  custom: {
    host: '',
    port: 587,
    secure: false,
    description: 'Custom SMTP Server',
  },
} as const;