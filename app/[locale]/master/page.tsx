'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Clock, Crown, History, LayoutDashboard, LogOut, Mail, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/routing';

interface User {
  id: number;
  email: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
  created_at: string;
  updated_at: string;
}

export default function MasterDashboard() {
  const t = useTranslations('MasterDashboard');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New quiz form
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizTimeLimit, setNewQuizTimeLimit] = useState(10);

  const fetchQuizzes = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`/api/quizzes?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    }
  }, []);

  const handleLogin = useCallback(
    async (emailToUse?: string) => {
      const emailValue = emailToUse || email;
      if (!emailValue) {
        setError(t('errors.enterEmail'));
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailValue, locale }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t('errors.loginFailed'));
        }

        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('quizMasterEmail', emailValue);

        // Fetch quizzes
        await fetchQuizzes(userData.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.anErrorOccurred'));
      } finally {
        setLoading(false);
      }
    },
    [email, fetchQuizzes, t, locale],
  );

  // Load user from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('quizMasterEmail');
    if (savedEmail) {
      handleLogin(savedEmail);
    }
  }, [handleLogin]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuizTitle) return;

    setLoading(true);
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newQuizTitle,
          description: newQuizDescription,
          timeLimit: newQuizTimeLimit,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errors.createFailed'));
      }

      const newQuiz = await res.json();
      setQuizzes([newQuiz, ...quizzes]);
      setShowNewQuiz(false);
      setNewQuizTitle('');
      setNewQuizDescription('');
      setNewQuizTimeLimit(10);
      router.push(`/master/quiz/${newQuiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.anErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setQuizzes(quizzes.filter((q) => q.id !== quizId));
      }
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quizMasterEmail');
    setUser(null);
    setQuizzes([]);
    setEmail('');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!confirm(t('deleteAccountConfirm'))) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errors.anErrorOccurred'));
      }

      handleLogout();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.anErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  // Login form
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-12 border border-white/20 w-full max-w-md shadow-2xl relative"
        >
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="text-center mb-10">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
            >
              <Crown size={48} className="text-black" />
            </motion.div>
            <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">{t('title')}</h1>
            <p className="text-purple-200/60 font-medium">{t('loginDescription')}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-6"
          >
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-yellow-400 transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:bg-white/10 transition-all"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm text-center font-bold"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black rounded-2xl shadow-xl shadow-yellow-400/20 flex items-center justify-center gap-2 disabled:opacity-50 uppercase italic tracking-tighter"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                t('continue')
              )}
            </motion.button>
          </form>
        </motion.div>

        <Link
          href="/"
          className="mt-8 text-white/40 hover:text-white transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-xs"
        >
          <ArrowLeft size={16} />
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col justify-between items-start gap-6 mb-12 bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl"
      >
        <div>
          <Link
            href="/"
            className="text-white/30 hover:text-white transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] mb-2"
          >
            <ArrowLeft size={12} />
            {t('backToHome')}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-black">
              <Crown size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">{t('myQuizzes')}</h1>
              <div className="flex items-center gap-2 text-purple-200/40 text-sm font-medium">
                <Mail size={14} />
                {user.email}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-all font-bold uppercase tracking-widest text-xs bg-white/5 px-4 py-2 rounded-xl border border-white/5"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-2 text-red-400/50 hover:text-red-400 transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            <Trash2 size={12} />
            {t('deleteAccount')}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewQuiz(true)}
            className="w-full py-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-black text-xl rounded-3xl shadow-xl shadow-yellow-400/10 flex flex-col items-center justify-center gap-4 uppercase italic tracking-tighter group"
          >
            <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={32} />
            </div>
            {t('createNewQuiz')}
          </motion.button>

          <Link
            href="/master/history"
            className="block w-full py-6 bg-white/5 text-white font-black rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/10 uppercase italic"
          >
            <History size={20} />
            {t('viewHistory')}
          </Link>

          {/* New Quiz Form */}
          <AnimatePresence>
            {showNewQuiz && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
                      {t('createTitle')}
                    </h2>
                    <button onClick={() => setShowNewQuiz(false)} className="text-white/20 hover:text-white">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateQuiz} className="space-y-6">
                    <div>
                      <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        {t('titleLabel')}
                      </label>
                      <input
                        type="text"
                        value={newQuizTitle}
                        onChange={(e) => setNewQuizTitle(e.target.value)}
                        placeholder={t('titlePlaceholder')}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        {t('descriptionLabel')}
                      </label>
                      <textarea
                        value={newQuizDescription}
                        onChange={(e) => setNewQuizDescription(e.target.value)}
                        placeholder={t('descriptionPlaceholder')}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none transition-all"
                        rows={3}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
                          {t('timeLimitLabel')}
                        </label>
                        <span className="text-white font-mono font-bold">{newQuizTimeLimit}s</span>
                      </div>
                      <input
                        type="range"
                        value={newQuizTimeLimit}
                        onChange={(e) => setNewQuizTimeLimit(parseInt(e.target.value) || 10)}
                        min={5}
                        max={120}
                        step={5}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                      />
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-4 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50 uppercase italic tracking-tighter shadow-lg shadow-yellow-400/10"
                      >
                        {loading ? t('loading') : t('createQuiz')}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          {/* Quiz List */}
          {quizzes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 backdrop-blur-lg rounded-[2.5rem] p-16 border border-white/5 text-center flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/10">
                <LayoutDashboard size={40} />
              </div>
              <div>
                <p className="text-white text-xl font-black uppercase tracking-tight italic mb-2">{t('noQuizzes')}</p>
                <p className="text-purple-200/40 text-sm">{t('createFirstQuiz')}</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {quizzes.map((quiz, idx) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight italic group-hover:text-yellow-400 transition-colors break-words">
                          {quiz.title}
                        </h3>
                        {quiz.description && (
                          <p className="text-purple-100/60 text-sm mb-4 line-clamp-2 font-medium break-words">
                            {quiz.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="flex items-center gap-1.5 text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                            <Clock size={12} />
                            {quiz.time_limit} {t('seconds')}
                          </div>
                          <div className="flex items-center gap-1.5 text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                            <History size={12} />
                            {new Date(quiz.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                        <Link
                          href={`/master/quiz/${quiz.id}`}
                          className="flex-1 sm:flex-none px-6 py-3 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 border border-white/10 transition-all text-sm uppercase italic"
                        >
                          {t('edit')}
                        </Link>
                        <Link
                          href={`/master/quiz/${quiz.id}/host`}
                          className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-black font-black rounded-2xl hover:scale-105 transition-all text-sm uppercase italic shadow-lg shadow-green-500/10"
                        >
                          {t('host')}
                        </Link>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-3 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm text-center mt-8 font-bold">{error}</p>}
    </div>
  );
}
