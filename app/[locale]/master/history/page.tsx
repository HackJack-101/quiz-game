'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BarChart2, Calendar, Hash, History, Play, RefreshCw, Users, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/routing';

interface GameHistoryEntry {
  id: number;
  quiz_id: number;
  pin_code: string | null;
  status: string;
  created_at: string;
  quiz_title: string;
  player_count: number;
}

export default function GameHistoryPage() {
  const t = useTranslations('GameHistory');
  const router = useRouter();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserAndHistory = useCallback(async () => {
    const savedEmail = localStorage.getItem('quizMasterEmail');
    if (!savedEmail) {
      window.location.href = '/master';
      return;
    }

    try {
      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail }),
      });

      if (!userRes.ok) throw new Error('Failed to fetch user');
      const user = await userRes.json();

      const historyRes = await fetch(`/api/games?userId=${user.id}`);
      if (!historyRes.ok) throw new Error('Failed to fetch history');
      const historyData = await historyRes.json();
      setHistory(historyData);
    } catch (err) {
      setError(t('error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUserAndHistory();
  }, [fetchUserAndHistory]);

  const handleResume = async (game: GameHistoryEntry) => {
    if (!confirm(t('resumeConfirm'))) return;

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (res.ok) {
        router.push(`/master/quiz/${game.quiz_id}/host?gameId=${game.id}`);
      } else {
        const data = await res.json();
        alert(data.error || t('error'));
      }
    } catch (err) {
      console.error(err);
      alert(t('error'));
    }
  };

  const handleClose = async (game: GameHistoryEntry) => {
    if (!confirm(t('closeConfirm'))) return;

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finish' }),
      });

      if (res.ok) {
        fetchUserAndHistory();
      } else {
        const data = await res.json();
        alert(data.error || t('error'));
      }
    } catch (err) {
      console.error(err);
      alert(t('error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-white/50 font-black uppercase tracking-widest text-xs">{t('loading')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <Link
          href="/master"
          className="text-white/30 hover:text-white transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] mb-6 group"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
          {t('backToDashboard')}
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">{t('title')}</h1>
            <p className="text-purple-200/40 text-sm font-medium uppercase tracking-widest text-[10px]">
              {history.length} {t('sessions')}
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 text-sm font-bold"
        >
          {error}
        </motion.div>
      )}

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-lg rounded-[2.5rem] p-16 border border-white/5 text-center flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/10">
            <History size={40} />
          </div>
          <div>
            <p className="text-white text-xl font-black uppercase tracking-tight italic mb-2">{t('noHistory')}</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {history.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 left-0 w-1 h-full transition-opacity ${
                    game.status === 'finished' ? 'bg-green-500' : 'bg-blue-500'
                  } opacity-0 group-hover:opacity-100`}
                />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight italic group-hover:text-white/90 transition-colors">
                        {game.quiz_title}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                          game.status === 'finished' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {t('status' + game.status.charAt(0).toUpperCase() + game.status.slice(1))}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-1.5 text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                        <Calendar size={12} />
                        {new Date(game.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                        <Users size={12} />
                        {game.player_count} {t('players')}
                      </div>
                      {game.pin_code && (
                        <div className="flex items-center gap-1.5 text-yellow-400/60 text-[10px] font-black uppercase tracking-widest bg-yellow-400/5 px-2 py-0.5 rounded-md">
                          <Hash size={12} />
                          {game.pin_code}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
                    {game.status === 'finished' ? (
                      <>
                        <Link
                          href={`/master/quiz/${game.quiz_id}/host/stats?gameId=${game.id}`}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 border border-white/10 transition-all text-xs uppercase italic"
                        >
                          <BarChart2 size={14} />
                          {t('viewStats')}
                        </Link>
                        <button
                          onClick={() => handleResume(game)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition-all text-xs uppercase italic shadow-lg shadow-yellow-400/10"
                        >
                          <RefreshCw size={14} />
                          {t('resume')}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/master/quiz/${game.quiz_id}/host?gameId=${game.id}`}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-400 transition-all text-xs uppercase italic shadow-lg shadow-blue-500/10"
                        >
                          <Play size={14} />
                          {t('hostGame')}
                        </Link>
                        <button
                          onClick={() => handleClose(game)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all text-xs uppercase italic border border-red-500/20"
                        >
                          <XCircle size={14} />
                          {t('close')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
