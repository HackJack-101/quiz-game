'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Crown, History, LogOut, Mail, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

interface User {
  id: number;
  email: string;
}

interface MasterHeaderProps {
  user: User;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function MasterHeader({ user, onLogout, onDeleteAccount }: MasterHeaderProps) {
  const t = useTranslations('MasterDashboard');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl"
    >
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          className="text-white/30 hover:text-white transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] cursor-pointer"
        >
          <ArrowLeft size={12} />
          {t('backToHome')}
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-black">
            <Crown size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">{t('myQuizzes')}</h1>
            <div className="flex items-center gap-2 text-purple-200/40 text-sm font-medium">
              <Mail size={14} />
              {user.email}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/master/history"
          className="flex items-center gap-2 text-white/40 hover:text-white transition-all font-bold uppercase tracking-widest text-xs bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 cursor-pointer"
        >
          <History size={14} />
          {t('gameHistory')}
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-all font-bold uppercase tracking-widest text-xs bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 cursor-pointer"
        >
          <LogOut size={14} />
          {t('logout')}
        </button>
        <button
          onClick={onDeleteAccount}
          className="flex items-center gap-2 text-red-400/50 hover:text-red-400 transition-all font-bold uppercase tracking-widest text-[10px] cursor-pointer"
        >
          <Trash2 size={12} />
          {t('deleteAccount')}
        </button>
      </div>
    </motion.div>
  );
}
