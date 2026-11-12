'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Mail, CheckCircle, XCircle, Loader2, Settings, Trash2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface GmailStatus {
  connected: boolean;
  email?: string;
  tokens?: {
    expiry_date: number;
  };
}

export default function GmailConnectionPage() {
  const [status, setStatus] = useState<GmailStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user_uid='));
    if (cookie) {
      const uid = cookie.split('=')[1];
      setUserId(uid);
      fetchGmailStatus(uid);
    }
  }, []);

  const fetchGmailStatus = async (uid: string) => {
    try {
      const res = await fetch(`/api/user/profile?userId=${uid}`);
      const data = await res.json();
      if (data.user) {
        setStatus({
          connected: data.user.gmailConnected || false,
          email: data.user.email,
          tokens: data.user.gmailTokens ? { expiry_date: data.user.gmailTokens.expiry_date } : undefined,
        });
      }
    } catch (error) {
      console.error('Failed to fetch Gmail status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!userId) return;
    setConnecting(true);
    // Redirect to OAuth flow
    window.location.href = `/api/gmail/connect?userId=${userId}`;
  };

  const handleDisconnect = async () => {
    if (!userId) return;
    if (!confirm('Are you sure you want to disconnect Gmail? This will remove all forwarding rules that use Gmail API.')) return;

    setDisconnecting(true);
    try {
      const res = await fetch('/api/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchGmailStatus(userId);
      } else {
        alert('Failed to disconnect Gmail');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect Gmail');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gmail Connection</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Connect your Gmail account to read emails and forward them using Gmail API or custom SMTP.
        </p>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${status.connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {status.connected ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {status.connected ? 'Gmail Connected' : 'Gmail Not Connected'}
                </p>
                {status.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{status.email}</p>
                )}
                {status.connected && status.tokens && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Token expires: {formatDate(status.tokens.expiry_date)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {status.connected ? (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect Gmail'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">1. OAuth Authorization</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Click "Connect Gmail" to authorize via Google OAuth 2.0. We request minimal scopes: read, send, and modify emails.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">2. Create Forwarding Rules</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Go to "Forwarding Rules" to create rules based on sender, domain, subject keywords, or Gmail labels.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">3. Auto Forwarding</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Emails matching your rules are automatically forwarded. Choose between Gmail API or custom SMTP (Nodemailer) for delivery.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scopes & Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Permissions & Scopes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We request the following Google OAuth scopes:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span><code>gmail.readonly</code> - Read emails and metadata</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span><code>gmail.send</code> - Send forwarded emails via Gmail API</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span><code>gmail.modify</code> - Mark emails as processed (add labels)</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span><code>userinfo.email</code> / <code>userinfo.profile</code> - Get your email and name</span>
            </li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            Tokens are encrypted and stored securely in Firebase. You can revoke access anytime from your
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              Google Account permissions
            </a>.
          </p>
        </CardContent>
      </Card>

      {/* Alternative: Custom SMTP */}
      <Card className="border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Alternative: Custom SMTP (Nodemailer)
          </CardTitle>
          <CardDescription>
            Forward emails using your own SMTP server instead of Gmail API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            When creating forwarding rules, you can choose "Custom SMTP" as the forward method. This allows you to use:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Your own email server (Postfix, Exchange, etc.)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Third-party providers (SendGrid, Mailgun, Amazon SES, etc.)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Any SMTP server with authentication</span>
            </li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            Configure SMTP settings per rule in the Forwarding Rules page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}