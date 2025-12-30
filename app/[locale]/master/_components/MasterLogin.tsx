'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

interface MasterLoginProps {
  email: string;
  setEmail: (value: string) => void;
  onLogin: () => void;
  loading: boolean;
  error: string;
}

export default function MasterLogin({ email, setEmail, onLogin, loading, error }: MasterLoginProps) {
  const t = useTranslations('MasterDashboard');

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
            onLogin();
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
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:bg-white/10 transition-all font-bold"
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
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black rounded-2xl shadow-xl shadow-yellow-400/20 flex items-center justify-center gap-2 disabled:opacity-50 uppercase italic tracking-tighter cursor-pointer"
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
        className="mt-8 text-white/40 hover:text-white transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-xs cursor-pointer"
      >
        <ArrowLeft size={16} />
        {t('backToHome')}
      </Link>
    </div>
  );
}
