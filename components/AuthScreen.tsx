import React, { useState, useEffect } from 'react';
import { BookOpen, Mail, Lock, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onToggleMode: () => void;
  onSubmit: (payload: { email: string; password: string; name: string }) => void;
  error: string | null;
  isSubmitting: boolean;
  savedProfiles: UserProfile[];
}

const AuthScreen: React.FC<AuthScreenProps> = ({
  mode,
  onToggleMode,
  onSubmit,
  error,
  isSubmitting,
  savedProfiles,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    setPassword('');
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    onSubmit({ email, password, name });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium">
            <BookOpen size={16} />
            <span>Learning System</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? '登入' : '建立新帳號'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {mode === 'login' ? '請使用您的帳號繼續學習進度' : '快速建立帳號並開始建立課程'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                顯示名稱
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：小明"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-10 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              密碼
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-10 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="至少 6 碼"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {savedProfiles.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 dark:text-gray-400">
              <span>快速填入：</span>
              {savedProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setEmail(profile.email)}
                  className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                >
                  {profile.email}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === 'login' ? '登入' : '建立帳號'}
          </button>
        </form>

        <div className="text-sm text-center text-gray-600 dark:text-gray-400">
          {mode === 'login' ? '還沒有帳號嗎？' : '已經有帳號了？'}{' '}
          <button
            className="text-blue-600 dark:text-blue-300 hover:underline font-medium"
            onClick={onToggleMode}
          >
            {mode === 'login' ? '建立新帳號' : '切換到登入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
