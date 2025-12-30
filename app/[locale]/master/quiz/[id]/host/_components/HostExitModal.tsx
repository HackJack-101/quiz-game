'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface HostExitModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function HostExitModal({ show, onClose, onConfirm }: HostExitModalProps) {
  const t = useTranslations('HostGame');

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                <LogOut size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t('exitGame')}</h2>
            <p className="text-gray-600 mb-8 text-center text-balance">{t('exitConfirm')}</p>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('stay').toUpperCase()}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 cursor-pointer"
              >
                {t('leave').toUpperCase()}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
