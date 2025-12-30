'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Clock, LayoutDashboard, Trophy, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Quiz {
  title: string;
  description: string | null;
  time_limit: number;
}

interface Game {
  status: 'waiting' | 'active' | 'question' | 'finished';
  pin_code: string | null;
}

interface HostHeaderProps {
  quiz: Quiz;
  game: Game;
  questionProgress: string;
  timeRemaining: number;
}

export default function HostHeader({ quiz, game, questionProgress, timeRemaining }: HostHeaderProps) {
  const t = useTranslations('HostGame');

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 mb-6 shadow-2xl"
    >
      <div className="flex flex-col items-start justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-inner">
            <Trophy size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight break-words">{quiz.title}</h1>
            {quiz.description && <p className="text-purple-100/70 text-sm mt-1 break-words">{quiz.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-right">
            <div className="text-[10px] text-purple-200 uppercase tracking-widest font-bold mb-1">
              {t('gameStatus')}
            </div>
            <div className="text-sm font-black text-white uppercase flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${game.status === 'finished' ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}
              />
              {game.status === 'waiting' && t('statusWaiting')}
              {(game.status === 'active' || game.status === 'question') && t('statusActive')}
              {game.status === 'finished' && t('statusFinished')}
            </div>
          </div>
        </div>
      </div>

      {/* PIN Code Display or Progress */}
      <AnimatePresence mode="wait">
        {game.status === 'waiting' ? (
          <motion.div
            key="pin"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-[2rem] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="text-black/60 text-sm sm:text-lg font-black uppercase tracking-[0.3em] mb-4">
              {t('joinCode')}
            </div>
            <div className="text-6xl sm:text-9xl font-black text-black tracking-[0.2em] font-mono drop-shadow-lg">
              {game.pin_code}
            </div>
            <div className="text-black/60 text-sm sm:text-lg mt-6 font-bold flex items-center justify-center gap-2">
              <Users size={20} />
              {t('joinInstructions')}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-200">
                  <LayoutDashboard size={20} />
                </div>
                <div className="text-purple-200 text-sm font-bold uppercase tracking-wider">
                  {t('questionProgress')}
                </div>
              </div>
              <div className="text-white font-black text-2xl">{questionProgress}</div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-200">
                    <Clock size={20} />
                  </div>
                  <div className="text-purple-200 text-sm font-bold uppercase tracking-wider">{t('timeRemaining')}</div>
                </div>
                <div
                  className={`font-black text-2xl ${timeRemaining <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}
                >
                  {timeRemaining}
                  {t('seconds')}
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 p-0.5">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeRemaining / quiz.time_limit) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className={`h-full rounded-full ${timeRemaining <= 3 ? 'bg-red-500' : 'bg-green-400'}`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
