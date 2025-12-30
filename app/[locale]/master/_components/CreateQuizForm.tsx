'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CreateQuizFormProps {
  show: boolean;
  setShow: (value: boolean) => void;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  timeLimit: number;
  setTimeLimit: (value: number) => void;
  onCreate: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function CreateQuizForm({
  show,
  setShow,
  title,
  setTitle,
  description,
  setDescription,
  timeLimit,
  setTimeLimit,
  onCreate,
  loading,
}: CreateQuizFormProps) {
  const t = useTranslations('MasterDashboard');

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShow(true)}
        className="w-full py-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-black text-xl rounded-3xl shadow-xl shadow-yellow-400/10 flex flex-col items-center justify-center gap-4 uppercase italic tracking-tighter group cursor-pointer"
      >
        <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus size={32} />
        </div>
        {t('createQuiz')}
      </motion.button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-8"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-[2.5rem] p-8 sm:p-10 border border-white/20 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">{t('newQuiz')}</h2>
                <button
                  onClick={() => setShow(false)}
                  className="text-white/20 hover:text-white transition-colors cursor-pointer"
                >
                  <Trash2 size={24} />
                </button>
              </div>

              <form onSubmit={onCreate} className="space-y-8">
                <div>
                  <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                    {t('quizTitle')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('quizTitlePlaceholder')}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/10 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:bg-white/10 transition-all font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                    {t('quizDescription')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('quizDescriptionPlaceholder')}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/10 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:bg-white/10 resize-none transition-all font-medium"
                    rows={3}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
                      {t('timeLimit')}
                    </label>
                    <span className="bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-lg font-mono font-bold text-sm">
                      {timeLimit}s
                    </span>
                  </div>
                  <input
                    type="range"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value) || 10)}
                    min={5}
                    max={120}
                    step={5}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShow(false)}
                    className="flex-1 py-5 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 border border-white/10 transition-all uppercase italic tracking-tighter cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-5 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition-all uppercase italic tracking-tighter shadow-xl shadow-yellow-400/20 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin mx-auto" />
                    ) : (
                      t('createQuizAction')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
