'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link } from '@/i18n/routing';
import { GlobalStats } from '@/lib/db';

export default function StatsPage() {
  const t = useTranslations('StatsPage');
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">{t('loading')}</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-red-400 text-xl mb-4">{t('error')}</div>
        <Link href="/" className="text-white hover:underline">
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  const successRate = stats.totalAnswers > 0 ? Math.round((stats.totalCorrectAnswers / stats.totalAnswers) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <Link href="/" className="text-purple-200 hover:text-white transition-colors mb-4 sm:mb-8 inline-block">
          {t('backToHome')}
        </Link>

        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 drop-shadow-lg">{t('title')}</h1>
          <p className="text-lg sm:text-xl text-purple-200">{t('description')}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <StatCard title={t('totalQuizzes')} value={stats.totalQuizzes} icon="📚" />
          <StatCard title={t('totalGames')} value={stats.totalGames} icon="🎮" />
          <StatCard title={t('totalPlayers')} value={stats.totalPlayers} icon="👥" />
          <StatCard title={t('totalUsers')} value={stats.totalUsers} icon="👑" />
          <StatCard title={t('totalQuestions')} value={stats.totalQuestions} icon="❓" />
          <StatCard title={t('totalAnswers')} value={stats.totalAnswers} icon="✍️" />
          <StatCard title={t('totalCorrectAnswers')} value={stats.totalCorrectAnswers} icon="✅" />
          <StatCard title={t('totalCorrectAnswers')} value={`${successRate}%`} icon="📈" />
        </div>

        {stats.topQuizzes.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
              <span>🏆</span> {t('topQuizzes')}
            </h2>
            <div className="space-y-4">
              {stats.topQuizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-purple-300">#{index + 1}</span>
                    <span className="text-white font-medium">{quiz.title}</span>
                  </div>
                  <span className="text-purple-200">{t('playCount', { count: quiz.play_count })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all">
      <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-[10px] sm:text-xs text-purple-200 uppercase tracking-wider font-semibold">{title}</div>
    </div>
  );
}
