'use client';

import { motion } from 'framer-motion';
import { BarChart3, Crown, Gamepad2, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 sm:mb-20"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-6xl sm:text-8xl mb-6 inline-block"
        >
          🚀
        </motion.div>
        <h1 className="text-5xl sm:text-8xl font-black text-white mb-4 drop-shadow-2xl tracking-tighter uppercase italic">
          {t('title')}
        </h1>
        <p className="text-xl sm:text-2xl text-purple-200/80 font-medium max-w-xl mx-auto leading-relaxed">
          {t('description')}
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-8 w-full max-w-4xl">
        {/* Quiz Master Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <Link
            href="/master"
            className="block h-full bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Crown size={120} />
            </div>
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:rotate-6 transition-transform">
                <Crown size={40} className="text-black" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">{t('quizMaster.title')}</h2>
              <p className="text-purple-100/60 mb-8 leading-relaxed font-medium">{t('quizMaster.description')}</p>
              <div className="w-full bg-white text-black font-black py-4 px-8 rounded-2xl group-hover:bg-yellow-400 transition-colors uppercase italic tracking-tighter">
                {t('quizMaster.button')}
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Player Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex-1"
        >
          <Link
            href="/play"
            className="block h-full bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Gamepad2 size={120} />
            </div>
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:-rotate-6 transition-transform">
                <Gamepad2 size={40} className="text-black" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">{t('player.title')}</h2>
              <p className="text-purple-100/60 mb-8 leading-relaxed font-medium">{t('player.description')}</p>
              <div className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-4 px-8 rounded-2xl group-hover:from-purple-400 group-hover:to-pink-400 transition-all uppercase italic tracking-tighter shadow-lg shadow-purple-500/20">
                {t('player.button')}
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-20 text-center flex flex-col items-center gap-6"
      >
        <div className="flex items-center gap-2 text-purple-300/40 font-bold uppercase tracking-[0.3em] text-xs">
          <div className="w-12 h-px bg-current opacity-20" />
          {t('footer')}
          <div className="w-12 h-px bg-current opacity-20" />
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/stats"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-purple-200 hover:text-white py-3 px-8 rounded-2xl border border-white/10 transition-all font-bold uppercase tracking-widest text-xs"
          >
            <BarChart3 size={16} />
            {t('stats')}
          </Link>
          <Link
            href="/features"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-purple-200 hover:text-white py-3 px-8 rounded-2xl border border-white/10 transition-all font-bold uppercase tracking-widest text-xs"
          >
            <Info size={16} />
            {t('features')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
