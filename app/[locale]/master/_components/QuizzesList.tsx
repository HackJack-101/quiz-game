'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Clock, LayoutDashboard, Play, Settings, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
  created_at: string;
  updated_at: string;
}

interface QuizzesListProps {
  quizzes: Quiz[];
  onDeleteQuiz: (id: number) => void;
}

export default function QuizzesList({ quizzes, onDeleteQuiz }: QuizzesListProps) {
  const t = useTranslations('MasterDashboard');

  if (quizzes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/5 backdrop-blur-lg rounded-[2.5rem] p-16 border border-white/5 text-center flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/10">
          <LayoutDashboard size={40} />
        </div>
        <div>
          <p className="text-white text-xl font-black uppercase tracking-tight italic mb-2">{t('noQuizzes')}</p>
          <p className="text-purple-200/40 text-sm">{t('noQuizzesHelp')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="popLayout">
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:bg-white/10 hover:border-yellow-400/30 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-yellow-400/10 transition-colors pointer-events-none" />

            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-purple-200/40 text-[10px] font-black uppercase tracking-[0.2em]">
                  <Clock size={12} />
                  {quiz.time_limit}s
                </div>
                <button
                  onClick={() => onDeleteQuiz(quiz.id)}
                  className="p-2 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                  title={t('deleteQuiz')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight italic mb-2 group-hover:text-yellow-400 transition-colors break-words">
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="text-purple-100/50 text-sm line-clamp-2 mb-6 font-medium break-words">
                  {quiz.description}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-auto">
              <Link
                href={`/master/quiz/${quiz.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 border border-white/5 transition-all text-[10px] uppercase italic cursor-pointer"
              >
                <Settings size={14} />
                {t('edit')}
              </Link>
              <Link
                href={`/master/quiz/${quiz.id}/host`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 transition-all text-[10px] uppercase italic shadow-lg shadow-yellow-400/10 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                {t('host')}
              </Link>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
