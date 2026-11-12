'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Mail, Shield, Clock, CheckCircle, AlertCircle, TrendingUp, ExternalLink } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Stats {
  totalEmails: number;
  forwardedToday: number;
  pending: number;
  errors: number;
}

interface RecentEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: number;
  forwarded: boolean;
  forwardedAt?: number;
  error?: string;
}

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  toEmail: string;
  fromEmail?: string;
}

export default function UserDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEmails: 0,
    forwardedToday: 0,
    pending: 0,
    errors: 0,
  });
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [activeRules, setActiveRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from cookie
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user_uid='));
    if (cookie) {
      const uid = cookie.split('=')[1];
      setUserId(uid);
      fetchDashboardData(uid);
    }
  }, []);

  const fetchDashboardData = async (uid: string) => {
    try {
      const [emailsRes, rulesRes] = await Promise.all([
        fetch(`/api/emails?userId=${uid}&limit=10`),
        fetch(`/api/forwarding-rules?userId=${uid}`),
      ]);

      const [emailsData, rulesData] = await Promise.all([
        emailsRes.json(),
        rulesRes.json(),
      ]);

      if (emailsData.emails) {
        const emails = emailsData.emails;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTimestamp = todayStart.getTime();

        setStats({
          totalEmails: emails.length,
          forwardedToday: emails.filter((e: RecentEmail) => e.forwarded && e.forwardedAt && e.forwardedAt >= todayTimestamp).length,
          pending: emails.filter((e: RecentEmail) => !e.forwarded && !e.error).length,
          errors: emails.filter((e: RecentEmail) => e.error).length,
        });
        setRecentEmails(emails.slice(0, 5));
      }

      if (rulesData.rules) {
        setActiveRules(rulesData.rules.filter((r: Rule) => r.enabled));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Emails',
      value: stats.totalEmails,
      icon: Mail,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Forwarded Today',
      value: stats.forwardedToday,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      title: 'Errors',
      value: stats.errors,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your email forwarding activity</p>
        </div>
        <div className="flex gap-2">
          <Link href="/user/rules">
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Manage Rules
            </Button>
          </Link>
          <Link href="/user/gmail">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Gmail Connection
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Active Rules */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Emails */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Emails</CardTitle>
            <Link href="/user/emails" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentEmails.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No emails yet. Connect Gmail and create rules to start forwarding.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentEmails.map((email) => (
                  <div key={email.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{email.from}</p>
                          <Badge variant={email.forwarded ? 'success' : email.error ? 'destructive' : 'warning'}>
                            {email.forwarded ? 'Forwarded' : email.error ? 'Error' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{email.subject}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatRelativeTime(email.receivedAt)}
                          {email.forwardedAt && ` • Forwarded ${formatRelativeTime(email.forwardedAt)}`}
                        </p>
                        {email.error && (
                          <p className="text-xs text-red-500 mt-1 truncate">Error: {email.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Rules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Active Forwarding Rules</CardTitle>
            <Link href="/user/rules" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              Manage
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {activeRules.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active rules. Create a rule to start forwarding emails.</p>
                <Link href="/user/rules" className="mt-3 inline-block">
                  <Button size="sm" className="mt-2">
                    <Shield className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activeRules.map((rule) => (
                  <div key={rule.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{rule.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          Forward to: {rule.toEmail}
                          {rule.fromEmail && ` • From: ${rule.fromEmail}`}
                        </p>
                      </div>
                      <Badge variant="success" className="text-xs">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/user/rules" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-3">
                <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Create Rule</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set up new forwarding rules</p>
            </Link>
            <Link href="/user/gmail" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mb-3">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Gmail Connection</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage Gmail authorization</p>
            </Link>
            <Link href="/user/emails" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Email History</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View all processed emails</p>
            </Link>
            <Link href="/user/settings" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-3">
                <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Settings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure preferences</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}