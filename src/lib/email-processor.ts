import { createGmailService } from './gmail';
import { createNodemailerService } from './nodemailer';
import {
  getForwardingRules,
  getUnforwardedEmails,
  updateEmailMessage,
  createAuditLog,
  getUserSettings,
  getGmailTokens
} from './database';
import type { EmailMessage, ForwardingRule, User } from '@/types';

export async function processUserEmails(uid: string): Promise<{ processed: number; forwarded: number; errors: number }> {
  const tokens = await getGmailTokens(uid);
  if (!tokens) {
    return { processed: 0, forwarded: 0, errors: 0 };
  }

  const settings = await getUserSettings(uid);
  const rules = await getForwardingRules(uid);
  const enabledRules = rules.filter(r => r.enabled);

  if (enabledRules.length === 0) {
    return { processed: 0, forwarded: 0, errors: 0 };
  }

  const unforwardedEmails = await getUnforwardedEmails(uid);
  const gmailService = createGmailService(tokens, uid);

  let processed = 0;
  let forwarded = 0;
  let errors = 0;

  for (const email of unforwardedEmails) {
    if (processed >= settings.maxEmailsPerHour) {
      break;
    }

    processed++;

    // Check if email matches any rule
    const matchingRules = enabledRules.filter(rule => matchesRule(email, rule));

    if (matchingRules.length === 0) {
      // Mark as processed but not forwarded
      await updateEmailMessage(uid, email.id, {
        forwarded: false,
        error: 'No matching forwarding rule'
      });
      continue;
    }

    // Forward to matching rules
    for (const rule of matchingRules) {
      let result: { success: boolean; error?: string };

      // Choose forwarding method based on rule configuration
      if (rule.forwardMethod === 'smtp' && rule.smtpConfig) {
        // Use Nodemailer with custom SMTP
        const nodemailerService = createNodemailerService(rule.smtpConfig);
        result = await nodemailerService.forwardMessage(email, rule);
        await nodemailerService.close();
      } else {
        // Default: Use Gmail API
        result = await gmailService.forwardMessage(email, rule);
      }

      if (result.success) {
        await updateEmailMessage(uid, email.id, {
          forwarded: true,
          forwardedAt: Date.now(),
          forwardedTo: rule.toEmail,
          error: undefined,
        });
        forwarded++;

        await createAuditLog({
          userId: uid,
          action: 'email_forwarded',
          details: {
            emailId: email.id,
            from: email.from,
            subject: email.subject,
            forwardedTo: rule.toEmail,
            ruleId: rule.id,
            ruleName: rule.name,
            forwardMethod: rule.forwardMethod || 'gmail',
          },
        });
      } else {
        await updateEmailMessage(uid, email.id, {
          error: result.error || 'Forwarding failed',
        });
        errors++;

        await createAuditLog({
          userId: uid,
          action: 'email_forward_failed',
          details: {
            emailId: email.id,
            from: email.from,
            subject: email.subject,
            ruleId: rule.id,
            ruleName: rule.name,
            forwardMethod: rule.forwardMethod || 'gmail',
            error: result.error,
          },
        });
      }
    }
  }

  return { processed, forwarded, errors };
}

function matchesRule(email: EmailMessage, rule: ForwardingRule): boolean {
  // Check from email filter
  if (rule.fromEmail) {
    const fromLower = email.from.toLowerCase();
    const filterLower = rule.fromEmail.toLowerCase();
    if (!fromLower.includes(filterLower)) return false;
  }

  // Check subject filter
  if (rule.subjectFilter) {
    const subjectLower = email.subject.toLowerCase();
    const filterLower = rule.subjectFilter.toLowerCase();
    if (!subjectLower.includes(filterLower)) return false;
  }

  // Check label filter
  if (rule.labelFilter && rule.labelFilter.length > 0) {
    const hasLabel = rule.labelFilter.some(label => email.labels.includes(label));
    if (!hasLabel) return false;
  }

  return true;
}

export async function processAllUsersEmails(): Promise<{ totalProcessed: number; totalForwarded: number; totalErrors: number }> {
  const { getAllUsers } = await import('./database');
  const users = await getAllUsers();

  let totalProcessed = 0;
  let totalForwarded = 0;
  let totalErrors = 0;

  for (const user of users) {
    if (!user.gmailConnected) continue;

    try {
      const result = await processUserEmails(user.uid);
      totalProcessed += result.processed;
      totalForwarded += result.forwarded;
      totalErrors += result.errors;
    } catch (error) {
      console.error(`Error processing emails for user ${user.uid}:`, error);
      totalErrors++;
    }
  }

  return { totalProcessed, totalForwarded, totalErrors };
}

export async function setupGmailWatch(uid: string, topicName: string): Promise<{ success: boolean; error?: string }> {
  const tokens = await getGmailTokens(uid);
  if (!tokens) {
    return { success: false, error: 'Gmail not connected' };
  }

  const gmailService = createGmailService(tokens, uid);
  const result = await gmailService.watchMailbox(topicName);

  if (result) {
    await createAuditLog({
      userId: uid,
      action: 'gmail_watch_setup',
      details: { historyId: result.historyId, expiration: result.expiration },
    });
    return { success: true };
  }

  return { success: false, error: 'Failed to setup Gmail watch' };
}

export async function stopGmailWatch(uid: string): Promise<{ success: boolean; error?: string }> {
  const tokens = await getGmailTokens(uid);
  if (!tokens) {
    return { success: false, error: 'Gmail not connected' };
  }

  const gmailService = createGmailService(tokens, uid);
  const success = await gmailService.stopWatch();

  if (success) {
    await createAuditLog({
      userId: uid,
      action: 'gmail_watch_stopped',
      details: {},
    });
  }

  return { success, error: success ? undefined : 'Failed to stop Gmail watch' };
}