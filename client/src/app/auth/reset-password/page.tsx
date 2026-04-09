'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword({ token, password });
      toast.success(data.message || 'Password reset successfully');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Invalid Request</h2>
        <p className="text-gray-600 dark:text-secondary text-sm mb-6">No reset token provided. Please request a new password reset link.</p>
        <Link href="/auth/login" className="text-gray-900 dark:text-white hover:text-accent-red dark:hover:text-accent-red underline decoration-gray-900/20 dark:decoration-white/20 underline-offset-4">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 pb-10 flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2 ml-1">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/5 dark:bg-black/20 border border-gray-300/50 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent-red/50 focus:bg-black/10 dark:focus:bg-black/40 transition-all duration-300 pr-10"
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white transition-colors"
            >
              {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2 ml-1">Confirm New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-black/5 dark:bg-black/20 border border-gray-300/50 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent-red/50 focus:bg-black/10 dark:focus:bg-black/40 transition-all duration-300"
            placeholder="Re-enter new password"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-accent-red to-red-600 hover:from-red-500 hover:to-red-700 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,0,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Resetting...
          </span>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 overflow-hidden relative">
      {/* Premium Background Flairs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-red/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8 relative z-20">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-red/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src="/favicon.svg" alt="StreamSphere Logo" className="w-14 h-14 drop-shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-105" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold mt-6 tracking-tight drop-shadow-sm text-gray-900 dark:text-white">
            Set New Password
          </h1>
          <p className="mt-2 text-[15px] font-medium text-gray-600 dark:text-gray-300">
            Choose a strong password for your account
          </p>
        </div>

        <div className="relative w-full glass rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-200/40 dark:border-white/5 overflow-hidden backdrop-blur-2xl bg-white/60 dark:bg-surface-500/40">
          <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent-red/30 border-t-accent-red rounded-full animate-spin" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/auth/login" className="text-[14px] text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
