'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Play,
  RotateCcw,
  SkipForward,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Game {
  id: number;
  status: 'waiting' | 'active' | 'question' | 'finished';
  current_question_index: number;
}

interface HostControlsProps {
  game: Game;
  playersCount: number;
  questionsCount: number;
  currentQuestion: { id: number } | null;
  onStartGame: () => void;
  onNextQuestion: () => void;
  onReplayRound: () => void;
  onInvalidateRound: () => void;
  onFinishGame: () => void;
  onResetGame: () => void;
  onExitGame: () => void;
  onViewStats: () => void;
  onBackToEditor: () => void;
}

export default function HostControls({
  game,
  playersCount,
  questionsCount,
  currentQuestion,
  onStartGame,
  onNextQuestion,
  onReplayRound,
  onInvalidateRound,
  onFinishGame,
  onResetGame,
  onExitGame,
  onViewStats,
  onBackToEditor,
}: HostControlsProps) {
  const t = useTranslations('HostGame');
  const tStats = useTranslations('GameStats');

  return (
    <motion.div layout className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-xl">
      <h2 className="text-xl font-black text-white/50 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
        <LayoutDashboard size={24} />
        {t('gameControls')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {game.status === 'waiting' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartGame}
            disabled={playersCount === 0}
            className="col-span-full py-6 bg-gradient-to-r from-green-400 to-emerald-500 text-black font-black text-xl rounded-2xl shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all uppercase italic tracking-tighter cursor-pointer"
          >
            <Play size={24} fill="currentColor" />
            {t('startGameWithCount', { count: playersCount })}
          </motion.button>
        )}

        {(game.status === 'active' || game.status === 'question') && !currentQuestion && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextQuestion}
            className="col-span-full py-6 bg-gradient-to-r from-blue-400 to-cyan-500 text-black font-black text-xl rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 uppercase italic tracking-tighter cursor-pointer"
          >
            <Play size={24} fill="currentColor" />
            {t('showFirstQuestion')}
          </motion.button>
        )}

        {(game.status === 'active' || game.status === 'question') && currentQuestion && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNextQuestion}
              disabled={game.current_question_index >= questionsCount - 1}
              className="py-4 bg-gradient-to-r from-blue-400 to-cyan-500 text-black font-black rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all uppercase italic cursor-pointer"
            >
              <SkipForward size={20} fill="currentColor" />
              {t('nextQuestion')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReplayRound}
              className="py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black rounded-2xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 uppercase italic cursor-pointer"
            >
              <RotateCcw size={20} />
              {t('replayRound')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onInvalidateRound}
              className="py-4 bg-gradient-to-r from-slate-400 to-gray-500 text-white font-black rounded-2xl shadow-lg shadow-gray-500/20 flex items-center justify-center gap-2 uppercase italic cursor-pointer"
            >
              <XCircle size={20} />
              {t('invalidateRound')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onFinishGame}
              className="py-4 bg-gradient-to-r from-red-400 to-pink-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 uppercase italic cursor-pointer"
            >
              <Trophy size={20} />
              {t('finishGame')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onResetGame}
              className="py-4 bg-gradient-to-r from-purple-400 to-violet-500 text-white font-black rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 uppercase italic cursor-pointer"
            >
              <RotateCcw size={20} />
              {t('resetGame')}
            </motion.button>
          </>
        )}

        {game.status === 'finished' && (
          <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onViewStats}
              className="col-span-full py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 uppercase italic tracking-tighter cursor-pointer"
            >
              <BarChart3 size={24} />
              {tStats('viewStats')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReplayRound}
              className="py-4 bg-yellow-400 text-black font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase italic cursor-pointer"
            >
              <RotateCcw size={20} />
              {t('replayRound')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onResetGame}
              className="py-4 bg-white/10 text-white font-black rounded-2xl border border-white/20 flex items-center justify-center gap-2 uppercase italic cursor-pointer"
            >
              <RotateCcw size={20} />
              {t('resetGame')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBackToEditor}
              className="col-span-full py-5 bg-white text-black font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase italic cursor-pointer"
            >
              <ArrowLeft size={20} />
              {t('backToEditor')}
            </motion.button>
          </div>
        )}

        {game.status !== 'finished' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExitGame}
            className="col-span-full py-4 bg-white/5 text-white font-black rounded-2xl border border-white/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all uppercase italic flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <LogOut size={20} />
            {t('exitGame')}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
