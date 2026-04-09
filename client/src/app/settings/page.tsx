'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authAPI, channelAPI } from '@/lib/api';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import {
  HiUser, HiMail, HiPencil, HiShieldCheck,
  HiSun, HiMoon, HiLogout, HiCamera, HiBadgeCheck,
} from 'react-icons/hi';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, logout, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      // Load verification status
      channelAPI.getVerificationStatus().then(({ data }) => {
        if (data.isVerified) setVerifyStatus('verified');
        else if (data.verificationRequestedAt) setVerifyStatus('pending');
        else setVerifyStatus('none');
      }).catch(() => {});
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    try {
      setSaving(true);
      const { data } = await authAPI.updateProfile({ displayName, bio });
      setUser({ ...user!, displayName: data.displayName });
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await authAPI.uploadAvatar(file);
      setUser({ ...user!, avatar: data.avatar });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!mounted || !isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {/* Profile Section */}
      <section className="bg-surface rounded-2xl p-6 mb-6 border border-border-light/10">
        <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
          <HiUser className="w-5 h-5 text-accent-red" /> Profile
        </h2>

        <div className="flex items-center gap-5 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-accent-purple flex items-center justify-center text-2xl font-bold overflow-hidden ring-2 ring-border-light/10">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <HiCamera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <p className="font-medium">{user.displayName}</p>
            <p className="text-sm text-secondary">@{user.username}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Display Name</label>
            <div className="relative">
              <HiPencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-page border border-border-light/20 rounded-xl pl-10 pr-4 py-2.5 text-sm
                           focus:outline-none focus:border-accent-red/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <div className="relative">
              <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-page border border-border-light/20 rounded-xl pl-10 pr-4 py-2.5 text-sm
                           opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell the world about yourself..."
              className="w-full bg-page border border-border-light/20 rounded-xl px-4 py-2.5 text-sm resize-none
                         focus:outline-none focus:border-accent-red/50 transition-colors"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="btn-primary px-6 py-2 text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="bg-surface rounded-2xl p-6 mb-6 border border-border-light/10">
        <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
          <HiSun className="w-5 h-5 text-accent-red" /> Appearance
        </h2>
        <div>
          <p className="text-sm font-medium mb-1">Theme</p>
          <p className="text-xs text-secondary mb-4">Choose your preferred appearance</p>
          <div className="flex gap-3">
            {[
              { key: 'light', label: 'Light', icon: <HiSun className="w-5 h-5 text-yellow-500" /> },
              { key: 'dark', label: 'Dark', icon: <HiMoon className="w-5 h-5 text-blue-400" /> },
              { key: 'system', label: 'System', icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )},
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  document.documentElement.classList.add('theme-transition');
                  setTheme(opt.key);
                  setTimeout(() => {
                    document.documentElement.classList.remove('theme-transition');
                  }, 350);
                }}
                className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200
                  ${theme === opt.key
                    ? 'border-accent-red bg-accent-red/5 text-primary shadow-sm'
                    : 'border-border-light/20 hover:border-border-light/40 text-secondary hover:text-primary'
                  }`}
              >
                {opt.icon}
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Section */}
      <section className="bg-surface rounded-2xl p-6 mb-6 border border-border-light/10">
        <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
          <HiBadgeCheck className="w-5 h-5 text-blue-400" /> Channel Verification
        </h2>
        {verifyStatus === 'verified' ? (
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <HiBadgeCheck className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-400">Your channel is verified ✓</p>
              <p className="text-xs text-secondary mt-0.5">The verified badge is displayed on your channel and videos.</p>
            </div>
          </div>
        ) : verifyStatus === 'pending' ? (
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Verification request pending</p>
              <p className="text-xs text-secondary mt-0.5">An admin is reviewing your channel. You'll be notified when it's processed.</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-secondary mb-4">
              Get a verified badge next to your channel name to show viewers that you're the authentic creator.
            </p>
            <button
              onClick={async () => {
                try {
                  setVerifyLoading(true);
                  await channelAPI.requestVerification();
                  setVerifyStatus('pending');
                  toast.success('Verification request submitted!');
                } catch (err: any) {
                  toast.error(err.response?.data?.error || 'Failed to submit request');
                } finally {
                  setVerifyLoading(false);
                }
              }}
              disabled={verifyLoading}
              className="flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-5 py-2.5 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              {verifyLoading ? (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiBadgeCheck className="w-5 h-5" />
              )}
              Apply for Verification
            </button>
          </div>
        )}
      </section>

      {/* Account Section */}
      <section className="bg-surface rounded-2xl p-6 border border-border-light/10">
        <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
          <HiShieldCheck className="w-5 h-5 text-accent-red" /> Account
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-secondary mt-0.5">Log out of your streamsphere account</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-4 py-2 text-sm hover:bg-red-500/20 transition-colors"
          >
            <HiLogout className="w-4 h-4" /> Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
