'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Users, Mail, CheckCircle, AlertCircle, Clock, TrendingUp, ExternalLink, Shield, FileText, Settings } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalEmailsForwarded: number;
  emailsForwardedToday: number;
  errorsToday: number;
}

interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  gmailConnected: boolean;
  createdAt: number;
  forwardingRulesCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalEmailsForwarded: 0,
    emailsForwardedToday: 0,
    errorsToday: 0,
  });
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
      ]);

      const [statsData, usersData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
      ]);

      if (statsData.stats) setStats(statsData.stats);
      if (usersData.users) setRecentUsers(usersData.users.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Active Users (Gmail Connected)',
      value: stats.activeUsers,
      icon: Mail,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Total Emails Forwarded',
      value: stats.totalEmailsForwarded,
      icon: CheckCircle,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Forwarded Today',
      value: stats.emailsForwardedToday,
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      title: 'Errors Today',
      value: stats.errorsToday,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of all users and email forwarding activity</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Users */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/admin/users" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Manage Users</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View, edit roles, delete users</p>
              </Link>
              <Link href="/admin/audit-logs" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mb-3">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Audit Logs</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review all system activity</p>
              </Link>
              <Link href="/admin/settings" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-3">
                  <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">System Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure global settings</p>
              </Link>
              <Link href="/user/dashboard" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3">
                  <Shield className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">User Panel</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Switch to user dashboard</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <Link href="/admin/users" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No users yet. Users will appear here after they sign up.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentUsers.map((user) => (
                  <div key={user.uid} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.displayName || 'User'}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant={user.gmailConnected ? 'success' : 'outline'} className="text-xs">
                          {user.gmailConnected ? 'Gmail Connected' : 'Not Connected'}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {user.forwardingRulesCount} rules
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <HealthMetric
              label="User Activation Rate"
              value={stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}
              unit="%"
              icon={Users}
              color="blue"
            />
            <HealthMetric
              label="Error Rate (Today)"
              value={stats.emailsForwardedToday > 0 ? Math.round((stats.errorsToday / stats.emailsForwardedToday) * 100) : 0}
              unit="%"
              icon={AlertCircle}
              color="red"
            />
            <HealthMetric
              label="Avg Emails per User"
              value={stats.activeUsers > 0 ? Math.round(stats.totalEmailsForwarded / stats.activeUsers) : 0}
              unit=""
              icon={Mail}
              color="green"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HealthMetric({ label, value, unit, icon: Icon, color }: { label: string; value: number; unit: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}{unit}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color as keyof typeof colors]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}