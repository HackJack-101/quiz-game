'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Rocket, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentPlayer: boolean;
}

interface GameFinishedProps {
  score: number;
  leaderboard: LeaderboardEntry[];
  onBackToHome: () => void;
}

export default function GameFinished({ score, leaderboard, onBackToHome }: GameFinishedProps) {
  const t = useTranslations('PlayPage');
  const myRank = leaderboard.find((l) => l.isCurrentPlayer)?.rank ?? '-';
  const isWinner = myRank === 1;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-y-auto">
      <div className="max-w-md mx-auto py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <motion.div
            animate={isWinner ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            className="inline-block mb-4"
          >
            {isWinner ? (
              <Trophy size={80} className="text-yellow-400" />
            ) : (
              <Rocket size={80} className="text-purple-400" />
            )}
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 italic tracking-tighter uppercase">
            {t('gameFinished')}
          </h1>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400" />
            <div className="text-purple-200 text-xs sm:text-sm uppercase tracking-[0.2em] mb-2">{t('finalScore')}</div>
            <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
              {score}
            </div>
            <div className="text-white font-bold text-xl sm:text-2xl flex items-center justify-center gap-2">
              <span className="opacity-50">#</span>
              {t('rank', { rank: myRank.toString() })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-white/10 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" />
            <h2 className="text-xl font-bold text-white">{t('finalLeaderboard')}</h2>
          </div>
          <div className="divide-y divide-white/10">
            <AnimatePresence>
              {leaderboard.map((entry, idx) => (
                <motion.div
                  key={entry.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className={`p-4 flex items-center justify-between ${entry.isCurrentPlayer ? 'bg-white/10' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${
                        entry.rank === 1
                          ? 'bg-yellow-400 text-black'
                          : entry.rank === 2
                            ? 'bg-gray-300 text-black'
                            : entry.rank === 3
                              ? 'bg-orange-500 text-black'
                              : 'bg-white/5 text-purple-300'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <span className={`font-bold ${entry.isCurrentPlayer ? 'text-white' : 'text-purple-100'}`}>
                      {entry.name}{' '}
                      {entry.isCurrentPlayer && (
                        <span className="ml-1 text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full uppercase">
                          {t('you')}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">{entry.score}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBackToHome}
          className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={20} />
          {t('backToHome')}
        </motion.button>
      </div>
    </div>
  );
}
