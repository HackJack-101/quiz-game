'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { use, useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/routing';
import { GameStats } from '@/lib/db';

export default function GameStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('GameStats');
  const hostT = useTranslations('HostGame');
  const { id: quizId } = use(params);
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  const router = useRouter();

  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError(t('noGameId'));
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        const response = await fetch(`/api/games/${gameId}/stats`);
        if (!response.ok) {
          throw new Error(t('error'));
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error'));
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [gameId, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">{t('loading')}</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-8">
        <div className="text-red-400 text-xl mb-4">{error || t('error')}</div>
        <Link href={`/master/quiz/${quizId}/host`} className="text-white hover:underline">
          {t('backToGame')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all text-sm sm:text-base"
          >
            {t('backToGame')}
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center">{t('title')}</h1>
          <div className="hidden sm:block w-24"></div> {/* Spacer */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <StatCard title={t('totalPlayers')} value={stats.totalPlayers} icon="👥" />
          <StatCard title={t('averageScore')} value={Math.round(stats.averageScore)} icon="🏆" />
          <StatCard title={t('mostDifficultQuestion')} value={stats.mostDifficultQuestion || '-'} icon="🔥" isSmall />
          <StatCard title={t('easiestQuestion')} value={stats.easiestQuestion || '-'} icon="✨" isSmall />
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">{t('questionStats')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-purple-200">
                  <th className="py-4 px-4 font-semibold">#</th>
                  <th className="py-4 px-4 font-semibold">{hostT('currentQuestion')}</th>
                  <th className="py-4 px-4 font-semibold text-center">{t('correctRate')}</th>
                  <th className="py-4 px-4 font-semibold text-center">{t('averageTime')}</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {stats.questionStats.map((q, idx) => {
                  const rate = q.totalAnswers > 0 ? Math.round((q.correctAnswers / q.totalAnswers) * 100) : 0;
                  return (
                    <tr key={q.questionId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-purple-300 font-bold">{idx + 1}</td>
                      <td className="py-4 px-4 max-w-md">{q.questionText}</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-full max-w-[100px] bg-white/10 rounded-full h-2 mb-2">
                            <div
                              className={`h-2 rounded-full ${
                                rate > 70 ? 'bg-green-400' : rate > 40 ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {rate}% ({q.correctAnswers}/{q.totalAnswers})
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">{(q.averageResponseTime / 1000).toFixed(2)}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  isSmall = false,
}: {
  title: string;
  value: string | number;
  icon: string;
  isSmall?: boolean;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all">
      <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
      <div
        className={`font-bold text-white mb-1 ${isSmall ? 'text-sm sm:text-lg line-clamp-2' : 'text-xl sm:text-3xl'}`}
      >
        {value}
      </div>
      <div className="text-[10px] sm:text-xs text-purple-200 uppercase tracking-wider font-semibold">{title}</div>
    </div>
  );
}
