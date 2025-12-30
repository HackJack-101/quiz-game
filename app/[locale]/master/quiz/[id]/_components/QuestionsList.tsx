'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, ChevronUp, Edit3, LayoutDashboard, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Question {
  id: number;
  question_text: string;
  question_type: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  correct_answer: string;
  options: string[] | null;
}

interface QuestionsListProps {
  questions: Question[];
  onMoveQuestion: (index: number, direction: 'up' | 'down') => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: number) => void;
}

export default function QuestionsList({
  questions,
  onMoveQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: QuestionsListProps) {
  const t = useTranslations('QuizEditor');

  const questionTypeLabels = {
    true_false: t('questionTypes.true_false'),
    mcq: t('questionTypes.mcq'),
    multiple_mcq: t('questionTypes.multiple_mcq'),
    number: t('questionTypes.number'),
    free_text: t('questionTypes.free_text'),
  };

  if (questions.length === 0) {
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
          <p className="text-white text-xl font-black uppercase tracking-tight italic mb-2">{t('noQuestions')}</p>
          <p className="text-purple-200/40 text-sm">{t('noQuestionsHelp')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <AnimatePresence mode="popLayout">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-row items-center gap-4 sm:gap-6">
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => onMoveQuestion(index, 'up')}
                  disabled={index === 0}
                  className="p-3 bg-white/5 text-white/40 rounded-2xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 border border-white/5 cursor-pointer disabled:cursor-not-allowed"
                  title={t('moveUp')}
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={() => onMoveQuestion(index, 'down')}
                  disabled={index === questions.length - 1}
                  className="p-3 bg-white/5 text-white/40 rounded-2xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 border border-white/5 cursor-pointer disabled:cursor-not-allowed"
                  title={t('moveDown')}
                >
                  <ChevronDown size={18} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest italic">
                    {t('questionNumber', { index: index + 1 })}
                  </span>
                  <span className="text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                    {questionTypeLabels[question.question_type]}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight italic group-hover:text-white/90 transition-colors break-words">
                  {question.question_text}
                </h3>

                {(question.question_type === 'mcq' || question.question_type === 'multiple_mcq') &&
                  question.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {question.options.map((opt, i) => {
                        const isCorrect =
                          question.question_type === 'mcq'
                            ? opt === question.correct_answer
                            : (() => {
                                try {
                                  return JSON.parse(question.correct_answer).includes(opt);
                                } catch {
                                  return false;
                                }
                              })();
                        return (
                          <div
                            key={i}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${
                              isCorrect
                                ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
                                : 'bg-white/5 text-purple-200/40 border-white/5'
                            }`}
                          >
                            {opt}
                            {isCorrect && <CheckCircle2 size={12} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {question.question_type !== 'mcq' && question.question_type !== 'multiple_mcq' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 rounded-lg border border-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest italic mb-4">
                    <CheckCircle2 size={12} />
                    {t('answerLabel', {
                      answer:
                        question.question_type === 'true_false'
                          ? question.correct_answer.toLowerCase() === 'true'
                            ? t('true')
                            : t('false')
                          : question.correct_answer,
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => onEditQuestion(question)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 border border-white/10 transition-all text-[10px] uppercase italic cursor-pointer"
                  title={t('edit')}
                >
                  <Edit3 size={14} />
                  <span className="hidden sm:inline">{t('edit')}</span>
                </button>
                <button
                  onClick={() => onDeleteQuestion(question.id)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-red-500/10 text-red-400 font-black rounded-2xl hover:bg-red-500 hover:text-white border border-red-500/20 transition-all text-[10px] uppercase italic cursor-pointer"
                  title={t('delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
