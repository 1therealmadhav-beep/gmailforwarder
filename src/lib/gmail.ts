import { google, type gmail_v1 } from 'googleapis';
import { oauth2Client, setCredentials } from './google-auth';
import type { EmailMessage, ForwardingRule, GmailTokens } from '@/types';

export class GmailService {
  private gmail: gmail_v1.Gmail;
  private userId: string;

  constructor(tokens: GmailTokens, userId: string) {
    setCredentials(tokens);
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    this.userId = userId;
  }

  async listMessages(query?: string, maxResults = 50): Promise<gmail_v1.Schema$Message[]> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });
    return response.data.messages || [];
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      return this.parseMessage(message);
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }

  private parseMessage(message: gmail_v1.Schema$Message): EmailMessage {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const from = getHeader('From');
    const to = getHeader('To').split(',').map(e => e.trim());
    const cc = getHeader('Cc') ? getHeader('Cc').split(',').map(e => e.trim()) : [];
    const bcc = getHeader('Bcc') ? getHeader('Bcc').split(',').map(e => e.trim()) : [];
    const subject = getHeader('Subject');
    const date = getHeader('Date');

    const body = this.extractBody(message.payload);
    const htmlBody = this.extractHtmlBody(message.payload);

    return {
      id: message.id || '',
      threadId: message.threadId || '',
      from,
      to,
      cc,
      bcc,
      subject,
      body: body || '',
      htmlBody: htmlBody || undefined,
      snippet: message.snippet || '',
      labels: message.labelIds || [],
      receivedAt: message.internalDate ? parseInt(message.internalDate) : Date.now(),
      forwarded: false,
    };
  }

  private extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const body = this.extractBody(part);
        if (body) return body;
      }
    }

    return '';
  }

  private extractHtmlBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    if (payload.mimeType === 'text/html' && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const body = this.extractHtmlBody(part);
        if (body) return body;
      }
    }

    return '';
  }

  async sendEmail(to: string, subject: string, body: string, htmlBody?: string, attachments?: Array<{ filename: string; content: string; contentType: string }>): Promise<boolean> {
    try {
      const email = this.createEmail(to, subject, body, htmlBody, attachments);
      const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private createEmail(to: string, subject: string, body: string, htmlBody?: string, attachments?: Array<{ filename: string; content: string; contentType: string }>): string {
    const boundary = 'gmail_forwarder_boundary_' + Date.now();
    let email = `To: ${to}\r\n`;
    email += `Subject: ${subject}\r\n`;
    email += `MIME-Version: 1.0\r\n`;

    if (attachments && attachments.length > 0) {
      email += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      email += `--${boundary}\r\n`;
      email += `Content-Type: multipart/alternative; boundary="${boundary}_alt"\r\n\r\n`;
      email += `--${boundary}_alt\r\n`;
      email += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
      email += `${body}\r\n\r\n`;
      if (htmlBody) {
        email += `--${boundary}_alt\r\n`;
        email += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
        email += `${htmlBody}\r\n\r\n`;
      }
      email += `--${boundary}_alt--\r\n`;

      for (const attachment of attachments) {
        email += `--${boundary}\r\n`;
        email += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`;
        email += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        email += `Content-Transfer-Encoding: base64\r\n\r\n`;
        email += `${attachment.content}\r\n`;
      }
      email += `--${boundary}--`;
    } else {
      email += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
      email += `--${boundary}\r\n`;
      email += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
      email += `${body}\r\n\r\n`;
      if (htmlBody) {
        email += `--${boundary}\r\n`;
        email += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
        email += `${htmlBody}\r\n\r\n`;
      }
      email += `--${boundary}--`;
    }

    return email;
  }

  async forwardMessage(originalMessage: EmailMessage, rule: ForwardingRule): Promise<{ success: boolean; error?: string }> {
    try {
      let forwardBody = `-------- Forwarded Message --------\n`;
      forwardBody += `From: ${originalMessage.from}\n`;
      forwardBody += `To: ${originalMessage.to.join(', ')}\n`;
      if (originalMessage.cc.length > 0) {
        forwardBody += `Cc: ${originalMessage.cc.join(', ')}\n`;
      }
      forwardBody += `Date: ${new Date(originalMessage.receivedAt).toLocaleString()}\n`;
      forwardBody += `Subject: ${originalMessage.subject}\n\n`;
      forwardBody += originalMessage.body;

      let forwardHtmlBody = originalMessage.htmlBody;
      if (forwardHtmlBody) {
        forwardHtmlBody = `
          <div style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #666;">
            <p style="margin: 0 0 8px 0;"><strong>-------- Forwarded Message --------</strong></p>
            <p style="margin: 4px 0;"><strong>From:</strong> ${originalMessage.from}</p>
            <p style="margin: 4px 0;"><strong>To:</strong> ${originalMessage.to.join(', ')}</p>
            ${originalMessage.cc.length > 0 ? `<p style="margin: 4px 0;"><strong>Cc:</strong> ${originalMessage.cc.join(', ')}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(originalMessage.receivedAt).toLocaleString()}</p>
            <p style="margin: 4px 0;"><strong>Subject:</strong> ${originalMessage.subject}</p>
            <hr style="margin: 8px 0;">
            ${forwardHtmlBody}
          </div>
        `;
      }

      const subject = rule.forwardAsAttachment
        ? `[Forwarded] ${originalMessage.subject}`
        : `Fwd: ${originalMessage.subject}`;

      const success = await this.sendEmail(rule.toEmail, subject, forwardBody, forwardHtmlBody);

      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async watchMailbox(topicName: string, labelIds?: string[]): Promise<{ historyId: string; expiration: string } | null> {
    try {
      const response = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName,
          labelIds,
          labelFilterAction: 'include',
        },
      });
      return {
        historyId: response.data.historyId || '',
        expiration: response.data.expiration || '',
      };
    } catch (error) {
      console.error('Error setting up watch:', error);
      return null;
    }
  }

  async stopWatch(): Promise<boolean> {
    try {
      await this.gmail.users.stop({ userId: 'me' });
      return true;
    } catch (error) {
      console.error('Error stopping watch:', error);
      return false;
    }
  }

  async getHistory(historyId: string): Promise<gmail_v1.Schema$History[]> {
    const response = await this.gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId,
      historyTypes: ['messageAdded'],
    });
    return response.data.history || [];
  }

  async modifyMessage(messageId: string, addLabelIds: string[] = [], removeLabelIds: string[] = []): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds,
          removeLabelIds,
        },
      });
      return true;
    } catch (error) {
      console.error('Error modifying message:', error);
      return false;
    }
  }
}

export function createGmailService(tokens: GmailTokens, userId: string): GmailService {
  return new GmailService(tokens, userId);
}