'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AuditLog } from '@/types';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState<AuditLog | null>(null);
  const pageSize = 25;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs?limit=500');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique actions for filter
  const actions = ['all', ...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = search === '' ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.userId.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const actionColors: Record<string, string> = {
    'email_forwarded': 'success',
    'email_forward_failed': 'destructive',
    'gmail_watch_setup': 'default',
    'gmail_watch_stopped': 'secondary',
    'user_created': 'success',
    'user_updated': 'default',
    'user_deleted': 'destructive',
    'rule_created': 'default',
    'rule_updated': 'secondary',
    'rule_deleted': 'destructive',
    'smtp_test': 'default',
    'settings_updated': 'secondary',
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View all system activity and user actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} className="gap-2" disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              options={actions.map(a => ({ value: a, label: a === 'all' ? 'All Actions' : a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
              className="w-full sm:w-64"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
              {filteredLogs.length} of {logs.length} logs
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No audit logs found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {search || actionFilter !== 'all' ? 'Try adjusting your filters.' : 'No activity logged yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow
                        key={log.id}
                        className={cn(
                          expandedLog?.id === log.id && 'bg-gray-50 dark:bg-gray-800/50'
                        )}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedLog(expandedLog?.id === log.id ? null : log)}
                            className="p-1 h-8 w-8"
                            aria-label={expandedLog?.id === log.id ? 'Collapse' : 'Expand'}
                          >
                            {expandedLog?.id === log.id ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500 dark:text-gray-500 whitespace-nowrap">{formatDate(log.timestamp)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-sm text-gray-600 dark:text-gray-400">{log.userId}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionColors[log.action] || 'outline'}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs font-mono">
                            {JSON.stringify(log.details).slice(0, 100)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500 dark:text-gray-500 font-mono">{log.ip || '—'}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Expanded Row */}
              {expandedLog && (
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableCell colSpan={6} className="p-0">
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                        <div className="sm:col-span-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Action</p>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{expandedLog.action}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">User ID</p>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{expandedLog.userId}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Timestamp</p>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{formatDate(expandedLog.timestamp)}</p>
                        </div>
                        {expandedLog.ip && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">IP Address</p>
                            <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{expandedLog.ip}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Details</p>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                          {JSON.stringify(expandedLog.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {page} of {totalPages} ({filteredLogs.length} logs)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}