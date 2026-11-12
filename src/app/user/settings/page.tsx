'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { User, Mail, Bell, Palette, Shield, Loader2, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UserSettings {
  autoForward: boolean;
  forwardDelay: number;
  maxEmailsPerHour: number;
  notifyOnForward: boolean;
  theme: 'light' | 'dark' | 'system';
}

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: number;
  gmailConnected: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    autoForward: true,
    forwardDelay: 0,
    maxEmailsPerHour: 100,
    notifyOnForward: true,
    theme: 'system',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user_uid='));
    if (cookie) {
      const uid = cookie.split('=')[1];
      setUserId(uid);
      fetchUserData(uid);
    }
  }, []);

  const fetchUserData = async (uid: string) => {
    try {
      const [profileRes, settingsRes] = await Promise.all([
        fetch(`/api/user/profile?userId=${uid}`),
        fetch(`/api/user/settings?userId=${uid}`),
      ]);

      const [profileData, settingsData] = await Promise.all([
        profileRes.json(),
        settingsRes.json(),
      ]);

      if (profileData.user) setProfile(profileData.user);
      if (settingsData.settings) setSettings(settingsData.settings);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/user/settings?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences and forwarding settings.</p>
      </div>

      {/* Saved Toast */}
      {saved && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg shadow-lg animate-slide-in">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">Settings saved successfully!</span>
        </div>
      )}

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {profile?.displayName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{profile?.displayName || 'User'}</h3>
              <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                  {profile?.role === 'admin' ? 'Administrator' : 'User'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Member since {formatDate(profile?.createdAt || Date.now()).split(',')[0]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Account ID</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">{profile?.uid}</code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(profile?.uid || '')}>
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forwarding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Forwarding Settings
          </CardTitle>
          <CardDescription>Configure how emails are automatically forwarded</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Auto Forward</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically forward emails matching your rules</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoForward}
                onChange={(e) => setSettings({ ...settings, autoForward: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forward Delay (minutes)</label>
              <Input
                type="number"
                value={settings.forwardDelay}
                onChange={(e) => setSettings({ ...settings, forwardDelay: parseInt(e.target.value) || 0 })}
                min="0"
                max="1440"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Delay before forwarding (0 = immediate)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Emails Per Hour</label>
              <Input
                type="number"
                value={settings.maxEmailsPerHour}
                onChange={(e) => setSettings({ ...settings, maxEmailsPerHour: parseInt(e.target.value) || 100 })}
                min="1"
                max="1000"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rate limit to prevent abuse</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notify me when emails are forwarded</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnForward}
                onChange={(e) => setSettings({ ...settings, notifyOnForward: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
            <Select
              value={settings.theme}
              onChange={(e) => {
                const newTheme = e.target.value as 'light' | 'dark' | 'system';
                setSettings({ ...settings, theme: newTheme });
                // Apply theme immediately
                document.documentElement.classList.remove('light', 'dark');
                if (newTheme === 'system') {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                } else {
                  document.documentElement.classList.add(newTheme);
                }
              }}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
              className="w-full sm:w-48"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">System follows your OS preference</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Shield className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Delete Account</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={() => {
              if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                alert('Account deletion would be implemented here');
              }
            }}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
          {saved && <CheckCircle className="h-4 w-4 text-green-500" />}
        </Button>
      </div>
    </div>
  );
}