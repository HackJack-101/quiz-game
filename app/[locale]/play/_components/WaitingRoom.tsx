'use client';

import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WaitingRoomProps {
  playerName: string;
  pinCode: string;
  onExit: () => void;
}

export default function WaitingRoom({ playerName, pinCode, onExit }: WaitingRoomProps) {
  const t = useTranslations('PlayPage');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-center overflow-hidden">
      <button
        onClick={onExit}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white p-2 sm:p-3 rounded-2xl transition-all border border-white/10 backdrop-blur-md group z-10 cursor-pointer"
        title={t('exitGame')}
      >
        <LogOut className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-white/20 shadow-2xl max-w-lg w-full relative"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-6xl sm:text-8xl mb-6 inline-block"
        >
          👋
        </motion.div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('welcomeWithName', { name: playerName })}</h1>
        <p className="text-lg sm:text-xl text-purple-200 mb-8">{t('waitingForHost')}</p>

        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 rounded-full text-purple-200 text-sm sm:text-base border border-white/10">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          {t('pinCode')}: <span className="text-white font-bold">{pinCode}</span>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 opacity-20">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 bg-white rounded-full" />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
