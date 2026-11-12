import { ref, get, set, push, update, remove, onValue, off, query, orderByChild, equalTo, limitToLast, serverTimestamp } from 'firebase/database';
import { database } from './firebase';
import { adminDatabase } from './firebase-admin';
import type { User, ForwardingRule, EmailMessage, AuditLog, UserSettings, GmailTokens } from '@/types';

// User operations
export async function createUser(userData: Omit<User, 'uid' | 'createdAt' | 'updatedAt'> & { uid: string }): Promise<User> {
  const now = Date.now();
  const user: User = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };
  await set(ref(database, `users/${userData.uid}`), user);
  return user;
}

export async function getUser(uid: string): Promise<User | null> {
  const snapshot = await get(ref(database, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  await update(ref(database, `users/${uid}`), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  await remove(ref(database, `users/${uid}`));
}

export async function getAllUsers(): Promise<User[]> {
  const snapshot = await get(ref(database, 'users'));
  if (!snapshot.exists()) return [];
  const users: User[] = [];
  snapshot.forEach(child => {
    users.push(child.val());
  });
  return users;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const usersRef = ref(database, 'users');
  const q = query(usersRef, orderByChild('email'), equalTo(email));
  const snapshot = await get(q);
  if (!snapshot.exists()) return null;
  let user: User | null = null;
  snapshot.forEach(child => {
    user = child.val();
  });
  return user;
}

// Gmail tokens operations
export async function saveGmailTokens(uid: string, tokens: GmailTokens): Promise<void> {
  await update(ref(database, `users/${uid}`), {
    gmailTokens: tokens,
    gmailConnected: true,
    updatedAt: Date.now(),
  });
}

export async function getGmailTokens(uid: string): Promise<GmailTokens | null> {
  const user = await getUser(uid);
  return user?.gmailTokens || null;
}

export async function removeGmailTokens(uid: string): Promise<void> {
  await update(ref(database, `users/${uid}`), {
    gmailTokens: null,
    gmailConnected: false,
    updatedAt: Date.now(),
  });
}

// Forwarding rules operations
export async function createForwardingRule(uid: string, rule: Omit<ForwardingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForwardingRule> {
  const rulesRef = ref(database, `users/${uid}/forwardingRules`);
  const newRuleRef = push(rulesRef);
  const now = Date.now();
  const ruleWithId: ForwardingRule = {
    ...rule,
    id: newRuleRef.key!,
    createdAt: now,
    updatedAt: now,
  };
  await set(newRuleRef, ruleWithId);
  return ruleWithId;
}

export async function getForwardingRules(uid: string): Promise<ForwardingRule[]> {
  const snapshot = await get(ref(database, `users/${uid}/forwardingRules`));
  if (!snapshot.exists()) return [];
  const rules: ForwardingRule[] = [];
  snapshot.forEach(child => {
    rules.push(child.val());
  });
  return rules.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateForwardingRule(uid: string, ruleId: string, data: Partial<ForwardingRule>): Promise<void> {
  await update(ref(database, `users/${uid}/forwardingRules/${ruleId}`), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteForwardingRule(uid: string, ruleId: string): Promise<void> {
  await remove(ref(database, `users/${uid}/forwardingRules/${ruleId}`));
}

export async function toggleForwardingRule(uid: string, ruleId: string, enabled: boolean): Promise<void> {
  await updateForwardingRule(uid, ruleId, { enabled });
}

// Email messages operations
export async function saveEmailMessage(uid: string, message: EmailMessage): Promise<string> {
  const messagesRef = ref(database, `users/${uid}/emails`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, message);
  return newMessageRef.key!;
}

export async function updateEmailMessage(uid: string, messageId: string, data: Partial<EmailMessage>): Promise<void> {
  await update(ref(database, `users/${uid}/emails/${messageId}`), data);
}

export async function getEmailMessages(uid: string, limit = 50): Promise<EmailMessage[]> {
  const messagesRef = ref(database, `users/${uid}/emails`);
  const q = query(messagesRef, orderByChild('receivedAt'), limitToLast(limit));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const messages: EmailMessage[] = [];
  snapshot.forEach(child => {
    messages.push(child.val());
  });
  return messages.reverse(); // Most recent first
}

export async function getUnforwardedEmails(uid: string): Promise<EmailMessage[]> {
  const messagesRef = ref(database, `users/${uid}/emails`);
  const q = query(messagesRef, orderByChild('forwarded'), equalTo(false));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const messages: EmailMessage[] = [];
  snapshot.forEach(child => {
    messages.push(child.val());
  });
  return messages.sort((a, b) => a.receivedAt - b.receivedAt);
}

// User settings
export async function getUserSettings(uid: string): Promise<UserSettings> {
  const user = await getUser(uid);
  return user?.settings || {
    autoForward: true,
    forwardDelay: 0,
    maxEmailsPerHour: 100,
    notifyOnForward: true,
    theme: 'system',
  };
}

export async function updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  const currentSettings = await getUserSettings(uid);
  await updateUser(uid, {
    settings: { ...currentSettings, ...settings },
  });
}

// Audit logs
export async function createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  const logsRef = ref(database, 'auditLogs');
  const newLogRef = push(logsRef);
  await set(newLogRef, {
    ...log,
    id: newLogRef.key!,
    timestamp: Date.now(),
  });
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const logsRef = ref(database, 'auditLogs');
  const q = query(logsRef, orderByChild('timestamp'), limitToLast(limit));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const logs: AuditLog[] = [];
  snapshot.forEach(child => {
    logs.push(child.val());
  });
  return logs.reverse();
}

export async function getUserAuditLogs(uid: string, limit = 50): Promise<AuditLog[]> {
  const logsRef = ref(database, 'auditLogs');
  const q = query(logsRef, orderByChild('userId'), equalTo(uid), limitToLast(limit));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const logs: AuditLog[] = [];
  snapshot.forEach(child => {
    logs.push(child.val());
  });
  return logs.reverse();
}

// Admin operations (using admin SDK)
export async function adminGetAllUsers(): Promise<User[]> {
  const snapshot = await adminDatabase.ref('users').once('value');
  if (!snapshot.exists()) return [];
  const users: User[] = [];
  snapshot.forEach(child => {
    users.push(child.val());
  });
  return users;
}

export async function adminUpdateUserRole(uid: string, role: 'admin' | 'user'): Promise<void> {
  await adminDatabase.ref(`users/${uid}`).update({ role, updatedAt: Date.now() });
}

export async function adminDeleteUser(uid: string): Promise<void> {
  await adminDatabase.ref(`users/${uid}`).remove();
}

export async function adminGetStats(): Promise<{ totalUsers: number; activeUsers: number; totalEmailsForwarded: number; emailsForwardedToday: number; errorsToday: number }> {
  const usersSnapshot = await adminDatabase.ref('users').once('value');
  let totalUsers = 0;
  let activeUsers = 0;
  let totalEmailsForwarded = 0;
  let emailsForwardedToday = 0;
  let errorsToday = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = todayStart.getTime();

  if (usersSnapshot.exists()) {
    usersSnapshot.forEach(userSnap => {
      totalUsers++;
      const user = userSnap.val();
      if (user.gmailConnected) activeUsers++;

      // Count forwarded emails
      if (user.emails) {
        Object.values(user.emails).forEach((email: unknown) => {
          const e = email as EmailMessage;
          if (e.forwarded) {
            totalEmailsForwarded++;
            if (e.forwardedAt && e.forwardedAt >= todayTimestamp) {
              emailsForwardedToday++;
            }
          }
          if (e.error && e.forwardedAt && e.forwardedAt >= todayTimestamp) {
            errorsToday++;
          }
        });
      }
    });
  }

  return { totalUsers, activeUsers, totalEmailsForwarded, emailsForwardedToday, errorsToday };
}

// Real-time listeners
export function subscribeToUser(uid: string, callback: (user: User | null) => void): () => void {
  const userRef = ref(database, `users/${uid}`);
  onValue(userRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => off(userRef);
}

export function subscribeToForwardingRules(uid: string, callback: (rules: ForwardingRule[]) => void): () => void {
  const rulesRef = ref(database, `users/${uid}/forwardingRules`);
  onValue(rulesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const rules: ForwardingRule[] = [];
    snapshot.forEach(child => {
      rules.push(child.val());
    });
    callback(rules.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(rulesRef);
}

export function subscribeToEmails(uid: string, callback: (emails: EmailMessage[]) => void, limit = 50): () => void {
  const emailsRef = ref(database, `users/${uid}/emails`);
  const q = query(emailsRef, orderByChild('receivedAt'), limitToLast(limit));
  onValue(q, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const emails: EmailMessage[] = [];
    snapshot.forEach(child => {
      emails.push(child.val());
    });
    callback(emails.reverse());
  });
  return () => off(q);
}