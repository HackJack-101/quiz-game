'use client';

import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface IntermissionProps {
  onExit: () => void;
}

export default function Intermission({ onExit }: IntermissionProps) {
  const t = useTranslations('PlayPage');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-center text-white overflow-hidden">
      <button
        onClick={onExit}
        className="fixed top-6 right-6 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white p-3 rounded-2xl transition-all border border-white/10 backdrop-blur-md group z-10 cursor-pointer"
        title={t('exitGame')}
      >
        <LogOut className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-8xl mb-8"
        >
          🚀
        </motion.div>
        <h2 className="text-4xl font-black mb-4 uppercase italic tracking-wider">{t('getReady')}</h2>
        <p className="text-purple-200 text-xl">{t('nextQuestionSoon')}</p>
      </motion.div>
    </div>
  );
}
