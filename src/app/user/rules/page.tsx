'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Loader2, Shield, Mail, Settings, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { COMMON_SMTP_CONFIGS } from '@/lib/nodemailer';
import type { ForwardingRule, SMTPConfig } from '@/types';
import { cn } from '@/lib/utils';

export default function ForwardingRulesPage() {
  const [rules, setRules] = useState<ForwardingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ForwardingRule | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testSmtpOpen, setTestSmtpOpen] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ForwardingRule> & { smtpConfig?: Partial<SMTPConfig> }>({
    name: '',
    enabled: true,
    fromEmail: '',
    toEmail: '',
    subjectFilter: '',
    labelFilter: '',
    forwardAsAttachment: false,
    forwardMethod: 'gmail',
    smtpConfig: {
      host: '',
      port: 587,
      secure: false,
      auth: { user: '', pass: '' },
      fromName: '',
      fromEmail: '',
    },
  });

  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user_uid='));
    if (cookie) {
      const uid = cookie.split('=')[1];
      setUserId(uid);
      fetchRules(uid);
    }
  }, []);

  const fetchRules = async (uid: string) => {
    try {
      const res = await fetch(`/api/forwarding-rules?userId=${uid}`);
      const data = await res.json();
      if (data.rules) setRules(data.rules);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      enabled: true,
      fromEmail: '',
      toEmail: '',
      subjectFilter: '',
      labelFilter: '',
      forwardAsAttachment: false,
      forwardMethod: 'gmail',
      smtpConfig: {
        host: '',
        port: 587,
        secure: false,
        auth: { user: '', pass: '' },
        fromName: '',
        fromEmail: '',
      },
    });
    setModalOpen(true);
  };

  const openEditModal = (rule: ForwardingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      enabled: rule.enabled,
      fromEmail: rule.fromEmail || '',
      toEmail: rule.toEmail,
      subjectFilter: rule.subjectFilter || '',
      labelFilter: rule.labelFilter?.join(', ') || '',
      forwardAsAttachment: rule.forwardAsAttachment,
      forwardMethod: rule.forwardMethod || 'gmail',
      smtpConfig: rule.smtpConfig ? {
        host: rule.smtpConfig.host,
        port: rule.smtpConfig.port,
        secure: rule.smtpConfig.secure,
        auth: { user: rule.smtpConfig.auth.user, pass: '' }, // Don't pre-fill password
        fromName: rule.smtpConfig.fromName || '',
        fromEmail: rule.smtpConfig.fromEmail || '',
      } : {
        host: '',
        port: 587,
        secure: false,
        auth: { user: '', pass: '' },
        fromName: '',
        fromEmail: '',
      },
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    try {
      const ruleData = {
        name: formData.name!,
        enabled: formData.enabled!,
        fromEmail: formData.fromEmail || undefined,
        toEmail: formData.toEmail!,
        subjectFilter: formData.subjectFilter || undefined,
        labelFilter: formData.labelFilter ? formData.labelFilter.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        forwardAsAttachment: formData.forwardAsAttachment!,
        forwardMethod: formData.forwardMethod!,
        smtpConfig: formData.forwardMethod === 'smtp' && formData.smtpConfig ? {
          host: formData.smtpConfig.host!,
          port: formData.smtpConfig.port!,
          secure: formData.smtpConfig.secure!,
          auth: {
            user: formData.smtpConfig.auth!.user!,
            pass: formData.smtpConfig.auth!.pass!,
          },
          fromName: formData.smtpConfig.fromName || undefined,
          fromEmail: formData.smtpConfig.fromEmail || undefined,
        } : undefined,
      };

      const url = editingRule
        ? `/api/forwarding-rules?userId=${userId}&ruleId=${editingRule.id}`
        : `/api/forwarding-rules?userId=${userId}`;

      const res = await fetch(url, {
        method: editingRule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchRules(userId);
      } else {
        alert('Failed to save rule');
      }
    } catch (error) {
      console.error('Save rule error:', error);
      alert('Failed to save rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !deletingRuleId) return;

    try {
      const res = await fetch(`/api/forwarding-rules?userId=${userId}&ruleId=${deletingRuleId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchRules(userId);
      } else {
        alert('Failed to delete rule');
      }
    } catch (error) {
      console.error('Delete rule error:', error);
      alert('Failed to delete rule');
    } finally {
      setDeletingRuleId(null);
    }
  };

  const handleToggle = async (rule: ForwardingRule) => {
    if (!userId) return;
    try {
      await fetch(`/api/forwarding-rules?userId=${userId}&ruleId=${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      fetchRules(userId);
    } catch (error) {
      console.error('Toggle rule error:', error);
    }
  };

  const handleSmtpTest = async () => {
    if (!formData.smtpConfig) return;
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: formData.smtpConfig.host,
          port: formData.smtpConfig.port,
          secure: formData.smtpConfig.secure,
          auth: {
            user: formData.smtpConfig.auth?.user,
            pass: formData.smtpConfig.auth?.pass,
          },
        }),
      });
      const data = await res.json();
      setSmtpTestResult({ success: data.success, error: data.error });
    } catch (error) {
      setSmtpTestResult({ success: false, error: 'Test failed' });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSmtpPresetSelect = (preset: keyof typeof COMMON_SMTP_CONFIGS) => {
    const config = COMMON_SMTP_CONFIGS[preset];
    setFormData(prev => ({
      ...prev,
      smtpConfig: {
        ...prev.smtpConfig!,
        host: config.host,
        port: config.port,
        secure: config.secure,
      },
    }));
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Forwarding Rules</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create rules to automatically forward emails based on sender, subject, labels, or domain.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Rules Table */}
      <Card>
        <CardContent className="p-0">
          {rules.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No forwarding rules yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create your first rule to start automatically forwarding emails.
              </p>
              <Button onClick={openCreateModal} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Rule
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Forward To</TableHead>
                    <TableHead>Filters</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-48">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(rule)}
                          className="p-1 h-8 w-8"
                          aria-label="Edit rule"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rule.toEmail}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rule.fromEmail && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="h-3 w-3 mr-1" />
                              From: {rule.fromEmail}
                            </Badge>
                          )}
                          {rule.subjectFilter && (
                            <Badge variant="outline" className="text-xs">
                              Subject: {rule.subjectFilter}
                            </Badge>
                          )}
                          {rule.labelFilter && rule.labelFilter.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Labels: {rule.labelFilter.join(', ')}
                            </Badge>
                          )}
                          {rule.forwardAsAttachment && (
                            <Badge variant="outline" className="text-xs">
                              As Attachment
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.forwardMethod === 'smtp' ? 'secondary' : 'default'}>
                          {rule.forwardMethod === 'smtp' ? 'Custom SMTP' : 'Gmail API'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(rule)}
                          className={cn(
                            'gap-1 px-2 py-1',
                            rule.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                          )}
                        >
                          {rule.enabled ? (
                            <>
                              <ToggleRight className="h-4 w-4" />
                              Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(rule)}
                            className="h-8 w-8 p-0"
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingRuleId(rule.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRule ? 'Edit Forwarding Rule' : 'Create Forwarding Rule'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2">Basic Information</h3>
            <Input
              label="Rule Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Forward company emails"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Forward To Email"
                type="email"
                value={formData.toEmail || ''}
                onChange={(e) => setFormData({ ...formData, toEmail: e.target.value })}
                placeholder="destination@example.com"
                required
              />
              <Input
                label="From Email Filter (optional)"
                type="email"
                value={formData.fromEmail || ''}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                placeholder="sender@company.com or @company.com"
              />
            </div>
            <Input
              label="Subject Filter (optional)"
              value={formData.subjectFilter || ''}
              onChange={(e) => setFormData({ ...formData, subjectFilter: e.target.value })}
              placeholder="e.g., invoice, receipt, urgent"
            />
            <Input
              label="Label Filter (optional, comma-separated)"
              value={formData.labelFilter || ''}
              onChange={(e) => setFormData({ ...formData, labelFilter: e.target.value })}
              placeholder="e.g., INBOX, IMPORTANT, CATEGORY_PERSONAL"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.forwardAsAttachment}
                  onChange={(e) => setFormData({ ...formData, forwardAsAttachment: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Forward as attachment (.eml file)</span>
              </label>
            </div>
          </div>

          {/* Forward Method */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2">Forward Method</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input
                  type="radio"
                  name="forwardMethod"
                  value="gmail"
                  checked={formData.forwardMethod === 'gmail'}
                  onChange={(e) => setFormData({ ...formData, forwardMethod: e.target.value as 'gmail' })}
                  className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Gmail API (Default)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use your connected Gmail account to send forwarded emails. No additional setup required.
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input
                  type="radio"
                  name="forwardMethod"
                  value="smtp"
                  checked={formData.forwardMethod === 'smtp'}
                  onChange={(e) => setFormData({ ...formData, forwardMethod: e.target.value as 'smtp' })}
                  className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Custom SMTP (Nodemailer)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use your own SMTP server (SendGrid, Mailgun, own server, etc.) to send forwarded emails.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* SMTP Configuration */}
          {formData.forwardMethod === 'smtp' && formData.smtpConfig && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2 flex items-center justify-between">
                SMTP Configuration
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTestSmtpOpen(true)}
                  className="gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Test Connection
                </Button>
              </h3>

              {/* Preset Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Setup (Presets)
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(COMMON_SMTP_CONFIGS).map(([key, config]) => (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      key={key}
                      onClick={() => handleSmtpPresetSelect(key as keyof typeof COMMON_SMTP_CONFIGS)}
                      className={cn(
                        formData.smtpConfig?.host === config.host ? 'border-primary-500 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20' : ''
                      )}
                    >
                      {config.description}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="SMTP Host"
                  value={formData.smtpConfig.host}
                  onChange={(e) => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig!, host: e.target.value } })}
                  placeholder="smtp.gmail.com"
                  required
                />
                <Input
                  label="Port"
                  type="number"
                  value={formData.smtpConfig.port}
                  onChange={(e) => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig!, port: parseInt(e.target.value) } })}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.smtpConfig.secure}
                    onChange={(e) => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig!, secure: e.target.checked } })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Use SSL/TLS (port 465)</span>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="SMTP Username"
                  value={formData.smtpConfig.auth?.user || ''}
                  onChange={(e) => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig!, auth: { ...formData.smtpConfig!.auth!, user: e.target.value } } })}
                  placeholder="your-email@domain.com"
                  required
                />
                <Input
                  label="SMTP Password / App Password"
                  type="password"
                  value={formData.smtpConfig.auth?.pass || ''}
                  onChange={(e) => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig!, auth: { ...formData.smtpConfig!.auth!, pass: e.target.value } } })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="From Name (optional)"
                  value={formData.smtpConfig.fromName || ''}
                  onChange={(e) => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig!, fromName: e.target.value } })}
                  placeholder="Gmail Forwarder"
                />
                <Input
                  label="From Email (optional)"
                  type="email"
                  value={formData.smtpConfig.fromEmail || ''}
                  onChange={(e) => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig!, fromEmail: e.target.value } })}
                  placeholder="noreply@yourdomain.com"
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingRuleId}
        onClose={() => setDeletingRuleId(null)}
        title="Delete Rule"
        description="Are you sure you want to delete this forwarding rule? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 p-4">
          <Button variant="outline" onClick={() => setDeletingRuleId(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* SMTP Test Modal */}
      <Modal
        isOpen={testSmtpOpen}
        onClose={() => setTestSmtpOpen(false)}
        title="Test SMTP Connection"
        size="md"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will test the SMTP connection using the current form values. Make sure all fields are filled correctly.
          </p>
          <Button
            onClick={handleSmtpTest}
            disabled={testingSmtp}
            className="w-full gap-2"
          >
            {testingSmtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Connection'}
          </Button>
          {smtpTestResult && (
            <div className={`p-3 rounded-lg text-sm ${smtpTestResult.success ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
              {smtpTestResult.success ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Connection successful!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {smtpTestResult.error || 'Connection failed'}
                </span>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}