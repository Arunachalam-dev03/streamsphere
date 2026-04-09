'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { SiYoutube } from 'react-icons/si';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Smooth transitioning wrapper classes
  const formBaseStyles = "transition-all duration-500 ease-in-out absolute inset-0 pt-8 px-8 pb-10 flex flex-col justify-between h-full";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      login(data.user, data.accessToken, data.refreshToken);
      toast.success('Welcome back!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email to reset password');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword(email);
      toast.success(data.message || 'If an account exists, a reset link was sent.');
      setView('login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 overflow-hidden relative">
      {/* Premium Background Flairs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-red/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8 relative z-20">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-red/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src="/favicon.svg" alt="StreamSphere Logo" className="w-14 h-14 drop-shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-105" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold mt-6 tracking-tight drop-shadow-sm text-gray-900 dark:text-white">
            {view === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h1>
          <p className="mt-2 text-[15px] font-medium text-gray-600 dark:text-gray-300">
            {view === 'login' ? 'Sign in to your StreamSphere account' : 'Enter your email to receive a secure link'}
          </p>
        </div>

        {/* Interactive Form Container */}
        <div className="relative w-full h-[380px] glass rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-200/40 dark:border-white/5 overflow-hidden backdrop-blur-2xl bg-white/60 dark:bg-surface-500/40">
          
          {/* LOGIN FORM */}
          <form 
            onSubmit={handleLoginSubmit} 
            className={`${formBaseStyles} ${view === 'login' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-12 pointer-events-none'}`}
          >
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2 ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/20 border border-gray-300/50 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent-red/50 focus:bg-black/10 dark:focus:bg-black/40 transition-all duration-300"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/5 dark:bg-black/20 border border-gray-300/50 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent-red/50 focus:bg-black/10 dark:focus:bg-black/40 transition-all duration-300 pr-10"
                    placeholder="Enter your password"
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
                <div className="flex justify-end mt-2">
                  <button 
                    type="button" 
                    onClick={() => setView('forgot-password')}
                    className="text-[13px] font-medium text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent-red to-red-600 hover:from-red-500 hover:to-red-700 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,0,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 transform active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* FORGOT PASSWORD FORM */}
          <form 
            onSubmit={handleForgotSubmit} 
            className={`${formBaseStyles} ${view === 'forgot-password' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-12 pointer-events-none'}`}
          >
            <div className="space-y-5">
              <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed text-center mb-6">
                Enter the email address associated with your account and we'll send you a link to reset your password securely.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2 ml-1">Account Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/20 border border-gray-300/50 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/30 focus:bg-black/10 dark:focus:bg-black/40 transition-all duration-300"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white dark:bg-white dark:text-black font-bold py-3.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                    Sending Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
              <button 
                type="button" 
                onClick={() => setView('login')}
                className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-white/60 dark:hover:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all duration-300"
              >
                Back to Sign In
              </button>
            </div>
          </form>

        </div>

        {/* Bottom Footer Link */}
        <div className={`transition-all duration-500 transform ${view === 'login' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <p className="text-center text-[14px] text-gray-600 dark:text-white/50 mt-8 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-gray-900 dark:text-white hover:text-accent-red dark:hover:text-accent-red transition-colors ml-1 font-semibold underline decoration-gray-900/20 dark:decoration-white/20 hover:decoration-accent-red underline-offset-4">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
