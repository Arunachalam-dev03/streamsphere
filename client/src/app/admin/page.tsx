'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatViews, timeAgo, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  HiUsers, HiVideoCamera, HiChat, HiEye,
  HiCheckCircle, HiXCircle, HiTrash, HiShieldCheck,
  HiBadgeCheck, HiChevronLeft, HiChevronRight,
} from 'react-icons/hi';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verification' | 'videos'>('overview');
  const [loading, setLoading] = useState(true);
  const [verifyRequests, setVerifyRequests] = useState<any[]>([]);

  useEffect(() => {
    if (isHydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/');
      return;
    }
    if (isAuthenticated && user?.role === 'ADMIN') {
      loadStats();
      loadUsers(1);
      loadVerifyRequests();
    }
  }, [isHydrated, isAuthenticated, user]);

  const loadStats = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page: number) => {
    try {
      const { data } = await adminAPI.getUsers(page);
      setUsers(data.users);
      setUserPage(data.pagination.page);
      setTotalUserPages(data.pagination.totalPages);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const handleToggleVerify = async (userId: string) => {
    try {
      const { data } = await adminAPI.toggleVerify(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: data.isVerified } : u));
      toast.success(data.isVerified ? 'Channel verified ✓' : 'Verification removed');
    } catch {
      toast.error('Failed to update verification');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      toast.success(`Role updated to ${role}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const loadVerifyRequests = async () => {
    try {
      const { data } = await adminAPI.getVerificationRequests();
      setVerifyRequests(data);
    } catch {}
  };

  const handleApproveVerify = async (userId: string) => {
    try {
      await adminAPI.approveVerification(userId);
      setVerifyRequests(prev => prev.filter(r => r.id !== userId));
      toast.success('Channel verified! ✓');
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleRejectVerify = async (userId: string) => {
    try {
      await adminAPI.rejectVerification(userId);
      setVerifyRequests(prev => prev.filter(r => r.id !== userId));
      toast.success('Request rejected');
    } catch {
      toast.error('Failed to reject');
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <HiShieldCheck className="w-7 h-7 text-accent-red" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-1 mb-8 bg-surface rounded-xl p-1 border border-border-light/10 w-full sm:w-fit max-w-full">
        {['overview', 'users', 'verification', 'videos'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-2 shrink-0 rounded-lg text-sm font-medium capitalize transition-colors relative
              ${activeTab === tab ? 'bg-accent-red text-white' : 'text-secondary hover:text-primary hover:bg-hover'}`}
          >
            {tab}
            {tab === 'verification' && verifyRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {verifyRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: HiUsers, label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400' },
            { icon: HiVideoCamera, label: 'Total Videos', value: stats.totalVideos, color: 'text-green-400' },
            { icon: HiChat, label: 'Total Comments', value: stats.totalComments, color: 'text-purple-400' },
            { icon: HiEye, label: 'Total Views', value: formatViews(stats.totalViews), color: 'text-orange-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface rounded-2xl p-6 border border-border-light/10">
              <stat.icon className={`w-8 h-8 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-secondary mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-surface rounded-2xl border border-border-light/10 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border-light/10">
                  <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-5 py-3">Verified</th>
                  <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-5 py-3">Stats</th>
                  <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-5 py-3">Joined</th>
                  <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border-light/5 hover:bg-hover/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent-purple flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : getInitials(u.displayName)}
                        </div>
                        <div>
                          <Link href={`/@${u.username}`} className="text-sm font-medium hover:text-accent-red transition-colors flex items-center gap-1">
                            {u.displayName}
                            {u.isVerified && <HiBadgeCheck className="w-4 h-4 text-blue-400" />}
                          </Link>
                          <p className="text-xs text-secondary">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="bg-page border border-border-light/20 rounded-lg px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="USER">User</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleVerify(u.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                          ${u.isVerified
                            ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                            : 'bg-surface-200 text-secondary hover:text-primary hover:bg-surface-300'}`}
                      >
                        {u.isVerified ? (
                          <><HiCheckCircle className="w-4 h-4" /> Verified</>
                        ) : (
                          <><HiXCircle className="w-4 h-4" /> Unverified</>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-secondary space-y-0.5">
                        <p>{u._count?.videos || 0} videos</p>
                        <p>{formatViews(u.subscriberCount || 0)} subs</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-secondary">{timeAgo(u.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <HiTrash className="w-4 h-4 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border-light/10">
            <p className="text-xs text-secondary">Page {userPage} of {totalUserPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => loadUsers(userPage - 1)}
                disabled={userPage <= 1}
                className="p-1.5 rounded-lg hover:bg-hover disabled:opacity-30 transition-colors"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadUsers(userPage + 1)}
                disabled={userPage >= totalUserPages}
                className="p-1.5 rounded-lg hover:bg-hover disabled:opacity-30 transition-colors"
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="space-y-4">
          {verifyRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl border border-border-light/10">
              <HiBadgeCheck className="w-12 h-12 text-secondary/30 mb-3" />
              <p className="text-secondary">No pending verification requests</p>
            </div>
          ) : (
            verifyRequests.map((req) => (
              <div key={req.id} className="bg-surface rounded-2xl p-5 border border-border-light/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-accent-purple flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                    {req.avatar ? <img src={req.avatar} className="w-full h-full object-cover" /> : getInitials(req.displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/@${req.username}`} className="text-sm font-medium hover:text-accent-red transition-colors truncate block">
                      {req.displayName}
                    </Link>
                    <p className="text-xs text-secondary truncate">@{req.username} · {formatViews(req.subscriberCount)} subs · {req._count?.videos || 0} videos</p>
                    <p className="text-[10px] text-secondary/60 mt-0.5">Requested {timeAgo(req.verificationRequestedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-0 border-border-light/10 pt-4 sm:pt-0 mt-2 sm:mt-0 justify-end shrink-0">
                  <button
                    onClick={() => handleApproveVerify(req.id)}
                    className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium hover:bg-blue-500/20 transition-colors"
                  >
                    <HiCheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleRejectVerify(req.id)}
                    className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <HiXCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl border border-border-light/10">
          <HiVideoCamera className="w-12 h-12 text-secondary/30 mb-3" />
          <p className="text-secondary">Video management panel coming soon.</p>
        </div>
      )}
    </div>
  );
}
