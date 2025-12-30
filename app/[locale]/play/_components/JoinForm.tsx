'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Hash, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface JoinFormProps {
  pinCode: string;
  setPinCode: (value: string) => void;
  playerName: string;
  setPlayerName: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
}

export default function JoinForm({
  pinCode,
  setPinCode,
  playerName,
  setPlayerName,
  onSubmit,
  loading,
  error,
}: JoinFormProps) {
  const t = useTranslations('PlayPage');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 text-white">
            <Hash size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">{t('enterPin')}</h1>
          <p className="text-purple-200">{t('welcome')}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Hash size={14} />
              {t('pinCode')}
            </label>
            <input
              type="text"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder={t('pinPlaceholder')}
              maxLength={6}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 sm:py-4 text-center text-2xl sm:text-3xl font-mono font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2 uppercase tracking-wider flex items-center gap-2">
              <User size={14} />
              {t('displayName')}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t('namePlaceholder')}
              maxLength={20}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 sm:py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            ) : (
              <>
                {t('joinGame')}
                <ChevronRight size={20} />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
