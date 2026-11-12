export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: number;
  updatedAt: number;
  gmailConnected: boolean;
  gmailTokens?: GmailTokens;
  forwardingRules?: ForwardingRule[];
  settings?: UserSettings;
}

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  fromName?: string;
  fromEmail?: string;
}

export interface ForwardingRule {
  id: string;
  name: string;
  enabled: boolean;
  fromEmail?: string;
  toEmail: string;
  subjectFilter?: string;
  labelFilter?: string[];
  forwardAsAttachment: boolean;
  // Nodemailer SMTP config for custom email forwarding
  smtpConfig?: SMTPConfig;
  // Forward method: 'gmail' (use Gmail API) or 'smtp' (use Nodemailer)
  forwardMethod?: 'gmail' | 'smtp';
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  autoForward: boolean;
  forwardDelay: number; // in minutes
  maxEmailsPerHour: number;
  notifyOnForward: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  snippet: string;
  labels: string[];
  receivedAt: number;
  forwarded: boolean;
  forwardedAt?: number;
  forwardedTo?: string;
  error?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalEmailsForwarded: number;
  emailsForwardedToday: number;
  errorsToday: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: number;
  ip?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GmailWatchRequest {
  userId: string;
  topicName: string;
  labelIds?: string[];
  labelFilterAction?: 'include' | 'exclude';
}

export interface GmailWatchResponse {
  historyId: string;
  expiration: string;
}