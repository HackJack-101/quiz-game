'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Play, Trophy, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Answer, Question } from '@/lib/types';

interface HostQuestionProps {
  currentQuestion: Question;
  questionAnswers: Answer[];
  playersCount: number;
}

export default function HostQuestion({ currentQuestion, questionAnswers, playersCount }: HostQuestionProps) {
  const t = useTranslations('HostGame');

  return (
    <motion.div
      key={currentQuestion.id}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-[2.5rem] p-6 sm:p-10 border border-white/20 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Play size={160} />
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-white/50 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
        <Users size={24} />
        {t('currentQuestion')}
      </h2>
      <div className="bg-white/10 rounded-3xl p-6 sm:p-8 mb-8 border border-white/10 shadow-inner">
        <div className="text-purple-300 text-xs sm:text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-400 rounded-full" />
          {currentQuestion.question_type === 'true_false' && t('questionTypes.true_false')}
          {currentQuestion.question_type === 'mcq' && t('questionTypes.mcq')}
          {currentQuestion.question_type === 'multiple_mcq' && t('questionTypes.multiple_mcq')}
          {currentQuestion.question_type === 'number' && t('questionTypes.number')}
          {currentQuestion.question_type === 'free_text' && t('questionTypes.free_text')}
        </div>
        <div className="text-white text-2xl sm:text-4xl font-black leading-tight mb-8">
          {currentQuestion.question_text}
        </div>

        {currentQuestion.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const colors = ['bg-blue-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
              const isCorrect =
                currentQuestion.question_type === 'mcq'
                  ? option === currentQuestion.correct_answer
                  : (() => {
                      try {
                        return JSON.parse(currentQuestion.correct_answer).includes(option);
                      } catch {
                        return false;
                      }
                    })();

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl flex items-center gap-4 transition-all ${
                    isCorrect
                      ? 'bg-green-500 ring-4 ring-green-400/50 shadow-lg shadow-green-500/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm ${isCorrect ? 'bg-white/20' : colors[idx % 4]}`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-white font-bold flex-1">{option}</span>
                  {isCorrect && (
                    <div className="bg-white/20 p-1.5 rounded-full text-white">
                      <Trophy size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!currentQuestion.options && currentQuestion.correct_answer !== '???' && (
          <div className="bg-green-500/20 border-2 border-green-400/50 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-green-300 text-xs font-black uppercase tracking-widest mb-1">
                {t('correctAnswer')}
              </div>
              <div className="text-white text-2xl font-black">
                {currentQuestion.question_type === 'true_false'
                  ? currentQuestion.correct_answer.toLowerCase() === 'true'
                    ? t('true')
                    : t('false')
                  : currentQuestion.correct_answer}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400">
              <Trophy size={24} />
            </div>
          </div>
        )}
      </div>

      {/* Answers Staggered List */}
      <div className="space-y-3">
        <h3 className="text-white/50 font-black uppercase tracking-widest text-sm mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 size={18} />
            {t('answersCount', { current: questionAnswers.length, total: playersCount })}
          </span>
          {playersCount > 0 && (
            <span className="text-white font-mono">{Math.round((questionAnswers.length / playersCount) * 100)}%</span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence>
            {questionAnswers.map((answer) => (
              <motion.div
                key={answer.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className={`p-4 rounded-2xl border-b-4 border-black/20 ${
                  currentQuestion.correct_answer === '???'
                    ? 'bg-blue-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                    : answer.is_correct
                      ? 'bg-green-500 shadow-lg shadow-green-500/10'
                      : 'bg-red-500 shadow-lg shadow-red-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-black uppercase tracking-tight truncate">{answer.playerName}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {answer.points_earned > 0 && (
                      <motion.span
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-yellow-300 font-black text-sm"
                      >
                        +{answer.points_earned}
                      </motion.span>
                    )}
                    <span className="text-white/50 text-[10px] font-mono font-bold">
                      {answer.time_taken?.toFixed(1) || '0.0'}
                      {t('seconds')}
                    </span>
                  </div>
                </div>
                <div className="text-white/80 text-xs font-bold truncate">
                  {currentQuestion.correct_answer === '???' ? (
                    <span className="italic opacity-50">{t('answerSubmitted')}</span>
                  ) : (
                    <>
                      <span className="opacity-50 mr-1">{t('answerPrefix')}</span>
                      {(() => {
                        if (currentQuestion.question_type === 'true_false') {
                          const isTrue =
                            answer.answer.toLowerCase() === 'true' ||
                            answer.answer === t('true') ||
                            answer.answer.toLowerCase() === 'vrai'; // For legacy French answers
                          return isTrue ? t('true') : t('false');
                        }
                        if (currentQuestion.question_type === 'multiple_mcq') {
                          try {
                            return JSON.parse(answer.answer).join(', ');
                          } catch {
                            return answer.answer;
                          }
                        }
                        return answer.answer;
                      })()}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
