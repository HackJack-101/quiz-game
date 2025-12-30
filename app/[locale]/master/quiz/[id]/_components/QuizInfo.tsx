'use client';

import { Clock, HelpCircle, Pencil, Play, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
}

interface QuizInfoProps {
  quiz: Quiz;
  questionsCount: number;
  editingQuiz: boolean;
  setEditingQuiz: (value: boolean) => void;
  editTitle: string;
  setEditTitle: (value: string) => void;
  editDescription: string;
  setEditDescription: (value: string) => void;
  editTimeLimit: number;
  setEditTimeLimit: (value: number) => void;
  onUpdateQuiz: (e: React.FormEvent) => void;
}

export default function QuizInfo({
  quiz,
  questionsCount,
  editingQuiz,
  setEditingQuiz,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editTimeLimit,
  setEditTimeLimit,
  onUpdateQuiz,
}: QuizInfoProps) {
  const t = useTranslations('QuizEditor');

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
      {!editingQuiz ? (
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight italic mb-2 break-words">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-purple-100/60 text-sm font-medium mb-4 break-words line-clamp-2">{quiz.description}</p>
            )}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-1.5 text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                <Clock size={12} />
                {quiz.time_limit} {t('seconds')} {t('perQuestion')}
              </div>
              <div className="flex items-center gap-1.5 text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                <HelpCircle size={12} />
                {questionsCount} {t('questionsCount')}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setEditingQuiz(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 border border-white/10 transition-all text-xs uppercase italic cursor-pointer"
            >
              <Settings size={14} />
              {t('editQuiz')}
            </button>
            <Link
              href={`/master/quiz/${quiz.id}/host`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition-all text-xs uppercase italic shadow-lg shadow-yellow-400/10 cursor-pointer"
            >
              <Play size={14} />
              {t('startGame')}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onUpdateQuiz} className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black">
              <Pencil size={20} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight italic">{t('editSettings')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                {t('titleLabel')}
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                {t('descriptionLabel')}
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none transition-all"
                rows={2}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
                  {t('timeLimitLabel')}
                </label>
                <span className="text-white font-mono font-bold">{editTimeLimit}s</span>
              </div>
              <input
                type="range"
                value={editTimeLimit}
                onChange={(e) => setEditTimeLimit(parseInt(e.target.value) || 10)}
                min={5}
                max={120}
                step={5}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setEditingQuiz(false)}
                className="flex-1 py-4 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 border border-white/10 transition-all uppercase italic tracking-tighter cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 transition-all uppercase italic tracking-tighter shadow-lg shadow-yellow-400/10 cursor-pointer"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
