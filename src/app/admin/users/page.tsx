'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Users, Search, UserPlus, Shield, Mail, Edit, Trash2, MoreVertical, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = search === '' ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to update role');
      }
    } catch (error) {
      console.error('Update role error:', error);
      alert('Failed to update role');
    }
  };

  const handleDelete = async () => {
    if (!deletingUserId) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${deletingUserId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Failed to delete user');
    } finally {
      setDeletingUserId(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all registered users and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
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
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'admin', label: 'Admins' },
                { value: 'user', label: 'Users' },
              ]}
              className="w-full sm:w-48"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
              {filteredUsers.length} of {users.length} users
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {search || roleFilter !== 'all' ? 'Try adjusting your filters.' : 'No users have registered yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Gmail</TableHead>
                      <TableHead>Rules</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-48">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
                            ) : (
                              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.displayName || 'User'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.uid, e.target.value as 'admin' | 'user')}
                            options={[
                              { value: 'user', label: 'User' },
                              { value: 'admin', label: 'Admin' },
                            ]}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.gmailConnected ? 'success' : 'outline'}>
                            {user.gmailConnected ? <Mail className="h-3 w-3 mr-1" /> : ''}
                            {user.gmailConnected ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {user.forwardingRules?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500 dark:text-gray-500">{formatDate(user.createdAt)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user);
                                setModalOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                              aria-label="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingUserId(user.uid)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              aria-label="Delete user"
                              disabled={user.role === 'admin'}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {page} of {totalPages} ({filteredUsers.length} users)
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

      {/* Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null); }}
        title={editingUser ? 'Edit User' : 'Add User'}
        size="md"
      >
        <div className="p-4 space-y-4">
          {editingUser ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <Input
                  value={editingUser.displayName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <Input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <Select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })}
                  options={[
                    { value: 'user', label: 'User' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => { setModalOpen(false); setEditingUser(null); }}>
                  Cancel
                </Button>
                <Button onClick={() => handleRoleChange(editingUser!.uid, editingUser!.role)} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              User creation is handled via Google OAuth. Users sign up by connecting their Gmail account.
              <br />
              <br />
              To add a user manually, they need to visit the signup page and authenticate with Google.
            </p>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUserId}
        onClose={() => setDeletingUserId(null)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone. All their forwarding rules, email history, and settings will be permanently deleted."
      >
        <div className="flex justify-end gap-3 p-4">
          <Button variant="outline" onClick={() => setDeletingUserId(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}