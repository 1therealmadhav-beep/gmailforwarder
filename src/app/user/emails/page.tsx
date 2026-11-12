'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Mail, Search, Filter, Download, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';
import type { EmailMessage } from '@/types';
import { cn } from '@/lib/utils';

interface EmailFilters {
  search: string;
  status: 'all' | 'forwarded' | 'pending' | 'error';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmailFilters>({
    search: '',
    status: 'all',
    dateRange: 'all',
  });
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user_uid='));
    if (cookie) {
      const uid = cookie.split('=')[1];
      setUserId(uid);
      fetchEmails(uid);
    }
  }, []);

  const fetchEmails = async (uid: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: uid,
        limit: '200', // Fetch more for client-side filtering
      });
      const res = await fetch(`/api/emails?${params}`);
      const data = await res.json();
      if (data.emails) setEmails(data.emails);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter emails client-side
  const filteredEmails = emails.filter(email => {
    const matchesSearch = filters.search === '' ||
      email.from.toLowerCase().includes(filters.search.toLowerCase()) ||
      email.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
      email.snippet.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = filters.status === 'all' ||
      (filters.status === 'forwarded' && email.forwarded) ||
      (filters.status === 'pending' && !email.forwarded && !email.error) ||
      (filters.status === 'error' && email.error);

    const matchesDate = filters.dateRange === 'all' || (() => {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const ranges = {
        today: day,
        week: 7 * day,
        month: 30 * day,
      };
      return email.receivedAt >= now - ranges[filters.dateRange];
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  const paginatedEmails = filteredEmails.slice((page - 1) * pageSize, page * pageSize);
  const totalPagesCalculated = Math.ceil(filteredEmails.length / pageSize);

  useEffect(() => {
    setTotalPages(totalPagesCalculated);
    if (page > totalPagesCalculated) setPage(1);
  }, [totalPagesCalculated, page]);

  const stats = {
    total: emails.length,
    forwarded: emails.filter(e => e.forwarded).length,
    pending: emails.filter(e => !e.forwarded && !e.error).length,
    errors: emails.filter(e => e.error).length,
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Email History</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View all processed emails and their forwarding status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchEmails(userId!)} className="gap-2" disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={stats.total} icon={Mail} color="blue" />
        <StatCard title="Forwarded" value={stats.forwarded} icon={Mail} color="green" />
        <StatCard title="Pending" value={stats.pending} icon={Mail} color="yellow" />
        <StatCard title="Errors" value={stats.errors} icon={Mail} color="red" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search emails..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as EmailFilters['status'], page: 1 })}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'forwarded', label: 'Forwarded' },
                { value: 'pending', label: 'Pending' },
                { value: 'error', label: 'Errors' },
              ]}
              className="w-full sm:w-48"
            />
            <Select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as EmailFilters['dateRange'], page: 1 })}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emails Table */}
      <Card>
        <CardContent className="p-0">
          {filteredEmails.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No emails found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {emails.length === 0 ? 'Connect Gmail and create rules to start processing emails.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="w-36">Status</TableHead>
                      <TableHead className="w-48">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmail(email)}
                            className="p-1 h-8 w-8"
                            aria-label="View email"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{email.from}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-600 dark:text-gray-400 truncate max-w-md">{email.subject}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500 dark:text-gray-500">{formatDate(email.receivedAt)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            email.forwarded ? 'success' :
                            email.error ? 'destructive' :
                            'warning'
                          }>
                            {email.forwarded ? 'Forwarded' : email.error ? 'Error' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {email.forwarded && email.forwardedTo && (
                              <Badge variant="outline" className="text-xs">
                                → {truncate(email.forwardedTo, 20)}
                              </Badge>
                            )}
                            {email.error && (
                              <Badge variant="destructive" className="text-xs">
                                Error
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {page} of {totalPages} ({filteredEmails.length} emails)
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

      {/* Email Detail Modal */}
      <Modal
        isOpen={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        title="Email Details"
        size="xl"
      >
        {selectedEmail && (
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2 border-b pb-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">From</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedEmail.from}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">To</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedEmail.to.join(', ')}</p>
              </div>
              {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cc</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedEmail.cc.join(', ')}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedEmail.receivedAt)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedEmail.subject}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <Badge variant={
                  selectedEmail.forwarded ? 'success' :
                  selectedEmail.error ? 'destructive' :
                  'warning'
                } className="text-base">
                  {selectedEmail.forwarded ? 'Forwarded' : selectedEmail.error ? 'Error' : 'Pending'}
                </Badge>
              </div>
              {selectedEmail.forwarded && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Forwarded To</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedEmail.forwardedTo}</p>
                </div>
              )}
              {selectedEmail.forwardedAt && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Forwarded At</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedEmail.forwardedAt)}</p>
                </div>
              )}
              {selectedEmail.error && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Error</p>
                  <p className="text-red-600 dark:text-red-400">{selectedEmail.error}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Labels</p>
                <div className="flex flex-wrap gap-1">
                  {selectedEmail.labels.map(label => (
                    <Badge key={label} variant="outline" className="text-xs">{label}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Preview</p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                {selectedEmail.htmlBody ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
                ) : (
                  selectedEmail.body
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${colors[color as keyof typeof colors]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}