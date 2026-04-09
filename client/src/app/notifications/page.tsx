'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { notificationAPI } from '@/lib/api';
import Link from 'next/link';
import { HiBell, HiCheck, HiCheckCircle } from 'react-icons/hi';
import { timeAgo } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/auth/login?redirect=/notifications');
      return;
    }
    if (isAuthenticated) loadNotifications();
  }, [isAuthenticated, isHydrated]);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_VIDEO': return '🎬';
      case 'NEW_SUBSCRIBER': return '👤';
      case 'COMMENT': return '💬';
      case 'LIKE': return '❤️';
      default: return '🔔';
    }
  };

  // Group by date
  const groupByDate = (items: Notification[]) => {
    const groups: Record<string, Notification[]> = {};
    items.forEach((n) => {
      const d = new Date(n.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label: string;
      if (d.toDateString() === today.toDateString()) label = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
      else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });
    return groups;
  };

  if (!isHydrated || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-red border-t-transparent" />
      </div>
    );
  }

  const grouped = groupByDate(notifications);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-red to-orange-500">
            <HiBell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-secondary">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <HiCheckCircle className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-16 text-center border border-border-light/5">
          <HiBell className="mb-4 h-16 w-16 text-secondary/30" />
          <h2 className="mb-2 text-xl font-semibold">No notifications yet</h2>
          <p className="text-secondary text-sm max-w-sm">
            When you get notifications, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 px-2">{date}</h3>
              <div className="space-y-1">
                {items.map((n) => {
                  const Wrapper = n.link ? Link : 'div';
                  const wrapperProps = n.link ? { href: n.link } : {};
                  return (
                    <Wrapper
                      key={n.id}
                      {...(wrapperProps as any)}
                      onClick={() => !n.read && handleMarkRead(n.id)}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer
                        ${n.read ? 'hover:bg-hover' : 'bg-accent-red/5 hover:bg-accent-red/10 border-l-2 border-accent-red'}`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{getIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.read ? 'text-secondary' : 'text-primary font-medium'}`}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-xs text-secondary/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleMarkRead(n.id); }}
                          className="p-1.5 hover:bg-hover rounded-full transition-colors shrink-0"
                          title="Mark as read"
                        >
                          <HiCheck className="w-4 h-4 text-secondary" />
                        </button>
                      )}
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
