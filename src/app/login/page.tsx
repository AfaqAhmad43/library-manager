'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Loader2, Music } from 'lucide-react';
import { signInWithPassword } from '@/lib/auth';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim())    { setError('Email address is required.'); return; }
    if (!password)        { setError('Password is required.'); return; }

    setIsLoading(true);
    try {
      const result = await signInWithPassword(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials.');
      } else {
        const next = searchParams.get('next') || '/';
        router.push(next);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    'w-full bg-zinc-900 border border-white/5 focus:border-zinc-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-500/20 text-zinc-100 transition-all placeholder:text-zinc-650 disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-lg p-3 animate-fade-in">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650 pointer-events-none" />
        <input
          ref={emailRef}
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className={inputCls}
          disabled={isLoading}
          required
        />
      </div>

      {/* Password */}
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650 pointer-events-none" />
        <input
          id="password"
          type={showPw ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={`${inputCls} pr-12`}
          disabled={isLoading}
          required
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-650 hover:text-zinc-300 transition-colors"
          tabIndex={-1}
          aria-label={showPw ? 'Hide password' : 'Show password'}
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-3 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md mt-2 cursor-pointer"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-950/25 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-indigo-950/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 mb-4 shadow-xl">
            <Music className="w-5 h-5 text-zinc-300" />
          </div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-widest">
            Audio Archive
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
            Private Music Library
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">
            Sign in to continue
          </p>

          <Suspense fallback={
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-550" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-zinc-700 mt-6 uppercase tracking-widest">
          Private access only
        </p>
      </div>
    </div>
  );
}
