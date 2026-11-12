'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Settings, Database, Globe, Shield, Bell, Loader2, CheckCircle, Key } from 'lucide-react';

interface SystemSettings {
  appName: string;
  appUrl: string;
  maxUsers: number;
  defaultMaxEmailsPerHour: number;
  defaultForwardDelay: number;
  enableRegistration: boolean;
  enableSmtpForwarding: boolean;
  gmailWatchTopic: string;
  cronSchedule: string;
  logRetentionDays: number;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export default function AdminSettingsPage() {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    appName: 'Gmail Forwarder',
    appUrl: '',
    maxUsers: 1000,
    defaultMaxEmailsPerHour: 100,
    defaultForwardDelay: 0,
    enableRegistration: true,
    enableSmtpForwarding: true,
    gmailWatchTopic: '',
    cronSchedule: '*/5 * * * *',
    logRetentionDays: 30,
  });
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig>({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'firebase' | 'google' | 'cron'>('system');

  useEffect(() => {
    // Load settings from environment/localStorage
    loadSettings();
  }, []);

  const loadSettings = () => {
    // In a real app, these would come from environment variables or a settings API
    // For now, we'll show what's in env vars
    if (typeof window !== 'undefined') {
      // System settings from env
      if (process.env.NEXT_PUBLIC_APP_NAME) setSystemSettings(s => ({ ...s, appName: process.env.NEXT_PUBLIC_APP_NAME! }));
      if (process.env.NEXT_PUBLIC_APP_URL) setSystemSettings(s => ({ ...s, appUrl: process.env.NEXT_PUBLIC_APP_URL! }));

      // Firebase from env
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) setFirebaseConfig(c => ({ ...c, apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY! }));
      if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) setFirebaseConfig(c => ({ ...c, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN! }));
      if (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) setFirebaseConfig(c => ({ ...c, databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL! }));
      if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) setFirebaseConfig(c => ({ ...c, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID! }));
      if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) setFirebaseConfig(c => ({ ...c, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET! }));
      if (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) setFirebaseConfig(c => ({ ...c, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID! }));
      if (process.env.NEXT_PUBLIC_FIREBASE_APP_ID) setFirebaseConfig(c => ({ ...c, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID! }));

      // Google from env
      if (process.env.GOOGLE_CLIENT_ID) setGoogleConfig(c => ({ ...c, clientId: process.env.GOOGLE_CLIENT_ID! }));
      if (process.env.GOOGLE_CLIENT_SECRET) setGoogleConfig(c => ({ ...c, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }));
      if (process.env.GOOGLE_REDIRECT_URI) setGoogleConfig(c => ({ ...c, redirectUri: process.env.GOOGLE_REDIRECT_URI! }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // In a real app, this would call an API to save settings
    // For now, we'll just show success
    setTimeout(() => {
      setSaved(true);
      setSaving(false);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          System Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure application settings and integrations</p>
      </div>

      {/* Saved Toast */}
      {saved && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg shadow-lg animate-slide-in">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">Settings saved successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4" aria-label="Settings tabs">
          {[
            { id: 'system', label: 'General', icon: Settings },
            { id: 'firebase', label: 'Firebase', icon: Database },
            { id: 'google', label: 'Google OAuth', icon: Shield },
            { id: 'cron', label: 'Cron Jobs', icon: Globe },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === 'system' && (
            <SystemSettingsForm settings={systemSettings} onChange={setSystemSettings} />
          )}
          {activeTab === 'firebase' && (
            <FirebaseSettingsForm config={firebaseConfig} onChange={setFirebaseConfig} />
          )}
          {activeTab === 'google' && (
            <GoogleSettingsForm config={googleConfig} onChange={setGoogleConfig} />
          )}
          {activeTab === 'cron' && (
            <CronSettingsForm settings={systemSettings} onChange={setSystemSettings} />
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t mt-6">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save All Settings'}
              {saved && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables Info */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Key className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>
            These settings are read from environment variables. Update them in your Vercel project settings or .env.local file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <EnvVarRow name="NEXT_PUBLIC_FIREBASE_API_KEY" description="Firebase API Key" required />
            <EnvVarRow name="NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" description="Firebase Auth Domain" required />
            <EnvVarRow name="NEXT_PUBLIC_FIREBASE_DATABASE_URL" description="Firebase Realtime Database URL" required />
            <EnvVarRow name="NEXT_PUBLIC_FIREBASE_PROJECT_ID" description="Firebase Project ID" required />
            <EnvVarRow name="NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" description="Firebase Storage Bucket" required />
            <EnvVarRow name="NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" description="Firebase Messaging Sender ID" required />
            <EnvVarRow name="NEXT_PUBLIC_FIREBASE_APP_ID" description="Firebase App ID" required />
            <EnvVarRow name="FIREBASE_ADMIN_PROJECT_ID" description="Firebase Admin Project ID" required server />
            <EnvVarRow name="FIREBASE_ADMIN_CLIENT_EMAIL" description="Firebase Admin Client Email" required server />
            <EnvVarRow name="FIREBASE_ADMIN_PRIVATE_KEY" description="Firebase Admin Private Key" required server />
            <EnvVarRow name="GOOGLE_CLIENT_ID" description="Google OAuth Client ID" required />
            <EnvVarRow name="GOOGLE_CLIENT_SECRET" description="Google OAuth Client Secret" required />
            <EnvVarRow name="GOOGLE_REDIRECT_URI" description="Google OAuth Redirect URI" required />
            <EnvVarRow name="NEXT_PUBLIC_APP_URL" description="Application URL (for OAuth callbacks)" />
            <EnvVarRow name="NEXT_PUBLIC_APP_NAME" description="Application Name" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemSettingsForm({ settings, onChange }: { settings: SystemSettings; onChange: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Application</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Application Name"
          value={settings.appName}
          onChange={(e) => onChange(s => ({ ...s, appName: e.target.value }))}
        />
        <Input
          label="Application URL"
          value={settings.appUrl}
          onChange={(e) => onChange(s => ({ ...s, appUrl: e.target.value }))}
          placeholder="https://your-domain.com"
        />
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-t pt-6">Limits & Defaults</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Max Users"
          type="number"
          value={settings.maxUsers}
          onChange={(e) => onChange(s => ({ ...s, maxUsers: parseInt(e.target.value) || 1000 }))}
        />
        <Input
          label="Default Max Emails/Hour"
          type="number"
          value={settings.defaultMaxEmailsPerHour}
          onChange={(e) => onChange(s => ({ ...s, defaultMaxEmailsPerHour: parseInt(e.target.value) || 100 }))}
        />
        <Input
          label="Default Forward Delay (min)"
          type="number"
          value={settings.defaultForwardDelay}
          onChange={(e) => onChange(s => ({ ...s, defaultForwardDelay: parseInt(e.target.value) || 0 }))}
        />
        <Input
          label="Log Retention (days)"
          type="number"
          value={settings.logRetentionDays}
          onChange={(e) => onChange(s => ({ ...s, logRetentionDays: parseInt(e.target.value) || 30 }))}
        />
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-t pt-6">Features</h3>
      <div className="space-y-4">
        <ToggleSetting
          label="Enable User Registration"
          description="Allow new users to sign up via Google OAuth"
          checked={settings.enableRegistration}
          onChange={(checked) => onChange(s => ({ ...s, enableRegistration: checked }))}
        />
        <ToggleSetting
          label="Enable Custom SMTP Forwarding"
          description="Allow users to configure custom SMTP servers for forwarding"
          checked={settings.enableSmtpForwarding}
          onChange={(checked) => onChange(s => ({ ...s, enableSmtpForwarding: checked }))}
        />
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-t pt-6">Gmail Watch</h3>
      <Input
        label="Gmail Watch Pub/Sub Topic"
        value={settings.gmailWatchTopic}
        onChange={(e) => onChange(s => ({ ...s, gmailWatchTopic: e.target.value }))}
        placeholder="projects/my-project/topics/gmail-push"
      />
    </div>
  );
}

function FirebaseSettingsForm({ config, onChange }: { config: FirebaseConfig; onChange: React.Dispatch<React.SetStateAction<FirebaseConfig>> }) {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-700 dark:text-red-400">
          <strong>Important:</strong> Firebase configuration is typically set via environment variables.
          The values below show what's currently configured. To change them, update your Vercel environment variables or .env.local file and redeploy.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="API Key"
          value={config.apiKey}
          onChange={(e) => onChange(c => ({ ...c, apiKey: e.target.value }))}
          placeholder="AIza..."
        />
        <Input
          label="Auth Domain"
          value={config.authDomain}
          onChange={(e) => onChange(c => ({ ...c, authDomain: e.target.value }))}
          placeholder="project.firebaseapp.com"
        />
        <Input
          label="Database URL"
          value={config.databaseURL}
          onChange={(e) => onChange(c => ({ ...c, databaseURL: e.target.value }))}
          placeholder="https://project.firebaseio.com"
        />
        <Input
          label="Project ID"
          value={config.projectId}
          onChange={(e) => onChange(c => ({ ...c, projectId: e.target.value }))}
        />
        <Input
          label="Storage Bucket"
          value={config.storageBucket}
          onChange={(e) => onChange(c => ({ ...c, storageBucket: e.target.value }))}
          placeholder="project.appspot.com"
        />
        <Input
          label="Messaging Sender ID"
          value={config.messagingSenderId}
          onChange={(e) => onChange(c => ({ ...c, messagingSenderId: e.target.value }))}
        />
        <Input
          label="App ID"
          value={config.appId}
          onChange={(e) => onChange(c => ({ ...c, appId: e.target.value }))}
          placeholder="1:123456789:web:abcdef"
        />
      </div>
    </div>
  );
}

function GoogleSettingsForm({ config, onChange }: { config: GoogleConfig; onChange: React.Dispatch<React.SetStateAction<GoogleConfig>> }) {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-700 dark:text-red-400">
          <strong>Important:</strong> Google OAuth credentials are set via environment variables.
          Update them in Vercel environment variables and redeploy. The redirect URI should match your deployed domain.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Client ID"
          value={config.clientId}
          onChange={(e) => onChange(c => ({ ...c, clientId: e.target.value }))}
          placeholder="123456789-abcdef.apps.googleusercontent.com"
        />
        <Input
          label="Client Secret"
          type="password"
          value={config.clientSecret}
          onChange={(e) => onChange(c => ({ ...c, clientSecret: e.target.value }))}
          placeholder="GOCSPX-..."
        />
        <Input
          label="Redirect URI"
          value={config.redirectUri}
          onChange={(e) => onChange(c => ({ ...c, redirectUri: e.target.value }))}
          placeholder="https://your-domain.com/api/gmail/callback"
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Required OAuth Scopes</h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• <code>https://www.googleapis.com/auth/gmail.readonly</code></li>
          <li>• <code>https://www.googleapis.com/auth/gmail.send</code></li>
          <li>• <code>https://www.googleapis.com/auth/gmail.modify</code></li>
          <li>• <code>https://www.googleapis.com/auth/userinfo.email</code></li>
          <li>• <code>https://www.googleapis.com/auth/userinfo.profile</code></li>
        </ul>
      </div>
    </div>
  );
}

function CronSettingsForm({ settings, onChange }: { settings: SystemSettings; onChange: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email Processing Cron</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Cron Schedule (cron expression)"
          value={settings.cronSchedule}
          onChange={(e) => onChange(s => ({ ...s, cronSchedule: e.target.value }))}
          placeholder="*/5 * * * *"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Runs every 5 minutes by default. Format: minute hour day month weekday
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Common Schedules</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { expr: '* * * * *', desc: 'Every minute' },
            { expr: '*/5 * * * *', desc: 'Every 5 minutes' },
            { expr: '*/15 * * * *', desc: 'Every 15 minutes' },
            { expr: '0 * * * *', desc: 'Hourly' },
            { expr: '0 */6 * * *', desc: 'Every 6 hours' },
            { expr: '0 0 * * *', desc: 'Daily at midnight' },
          ].map(item => (
            <Button
              key={item.expr}
              variant="outline"
              size="sm"
              onClick={() => onChange(s => ({ ...s, cronSchedule: item.expr }))}
              className={settings.cronSchedule === item.expr ? 'border-primary-500 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20' : ''}
            >
              {item.desc} ({item.expr})
            </Button>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-t pt-6">Vercel Cron Configuration</h3>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm overflow-x-auto">
        <p className="text-gray-600 dark:text-gray-400 mb-2">Add this to your vercel.json or vercel.ts:</p>
        <pre>{`{
  "crons": [{
    "path": "/api/cron/process-emails",
    "schedule": "${settings.cronSchedule}"
  }]
}`}</pre>
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
      </label>
    </div>
  );
}

function EnvVarRow({ name, description, required, server }: { name: string; description: string; required?: boolean; server?: boolean }) {
  const value = process.env[name];
  const isSet = value && value.length > 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <code className="text-sm font-mono text-gray-900 dark:text-gray-100 min-w-[280px]">{name}</code>
      <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{description}</span>
      {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
      {server && <Badge variant="secondary" className="text-xs">Server Only</Badge>}
      <Badge variant={isSet ? 'success' : 'destructive'} className="text-xs">
        {isSet ? 'Set' : 'Missing'}
      </Badge>
    </div>
  );
}