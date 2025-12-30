'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, LogOut, Rocket, Send, User, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Question {
  id: number;
  questionText: string;
  questionType: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  options: string[] | null;
  correctAnswer?: string;
}

interface Player {
  name: string;
  score: number;
}

interface QuestionScreenProps {
  currentQuestion: Question;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  timeLimit: number;
  selectedAnswer: string;
  setSelectedAnswer: (value: string) => void;
  hasAnswered: boolean;
  answerResult: { isCorrect: boolean; message: string } | null;
  player: Player;
  onToggleMultipleMcqAnswer: (option: string) => void;
  onSubmitAnswer: (answer: string) => void;
  onExit: () => void;
}

export default function QuestionScreen({
  currentQuestion,
  questionNumber,
  totalQuestions,
  timeRemaining,
  timeLimit,
  selectedAnswer,
  setSelectedAnswer,
  hasAnswered,
  answerResult,
  player,
  onToggleMultipleMcqAnswer,
  onSubmitAnswer,
  onExit,
}: QuestionScreenProps) {
  const t = useTranslations('PlayPage');

  const isMultipleMcq = currentQuestion.questionType === 'multiple_mcq';
  let multipleMcqAnswers: string[] = [];
  if (isMultipleMcq) {
    try {
      multipleMcqAnswers = JSON.parse(selectedAnswer || '[]');
      if (!Array.isArray(multipleMcqAnswers)) multipleMcqAnswers = [];
    } catch {
      multipleMcqAnswers = [];
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 z-10"
      >
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white p-2.5 rounded-xl transition-all border border-white/10 backdrop-blur-md group cursor-pointer"
              title={t('exitGame')}
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
              <span className="text-purple-300 text-xs font-black uppercase tracking-wider">
                Q{questionNumber} <span className="text-white/20">/</span> {totalQuestions}
              </span>
            </div>
          </div>

          <div className="sm:hidden bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
            <Clock size={16} className={timeRemaining <= 3 ? 'text-red-500 animate-pulse' : 'text-purple-300'} />
            <span className={`font-mono font-black text-sm ${timeRemaining <= 3 ? 'text-red-500' : 'text-white'}`}>
              {timeRemaining}s
            </span>
          </div>
        </div>

        <div className="flex-1 w-full sm:mx-4">
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(timeRemaining / (timeLimit || 10)) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
              className={`h-full rounded-full ${
                timeRemaining <= 3
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-green-400 to-blue-500'
              }`}
            />
          </div>
        </div>

        <div className="hidden sm:flex bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 items-center gap-2">
          <Clock size={18} className={timeRemaining <= 3 ? 'text-red-500 animate-pulse' : 'text-purple-300'} />
          <span className={`font-mono font-black text-lg ${timeRemaining <= 3 ? 'text-red-500' : 'text-white'}`}>
            {timeRemaining}
            <span className="text-[10px] uppercase ml-1 opacity-50">{t('seconds')}</span>
          </span>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            {/* Question */}
            <motion.div
              layoutId={`question-${currentQuestion.id}`}
              className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl mb-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Rocket size={120} />
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-white text-center leading-tight relative z-10">
                {currentQuestion.questionText}
              </h2>
            </motion.div>

            {/* Answers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {(currentQuestion.questionType === 'mcq' || currentQuestion.questionType === 'multiple_mcq') &&
                currentQuestion.options &&
                currentQuestion.options.map((option, idx) => {
                  const colors = [
                    'from-blue-500 to-blue-600',
                    'from-red-500 to-red-600',
                    'from-yellow-500 to-yellow-600',
                    'from-green-500 to-green-600',
                  ];

                  const isCorrect =
                    currentQuestion.correctAnswer &&
                    (currentQuestion.questionType === 'mcq'
                      ? currentQuestion.correctAnswer === option
                      : (() => {
                          try {
                            return JSON.parse(currentQuestion.correctAnswer).includes(option);
                          } catch {
                            return false;
                          }
                        })());

                  const isSelected = isMultipleMcq ? multipleMcqAnswers.includes(option) : selectedAnswer === option;

                  let bgGradient = colors[idx % colors.length];
                  if (currentQuestion.correctAnswer) {
                    if (isCorrect) bgGradient = 'from-green-500 to-emerald-600';
                    else if (isSelected) bgGradient = 'from-red-500 to-rose-600';
                    else bgGradient = 'from-gray-600 to-gray-700 opacity-30';
                  } else if (isSelected && isMultipleMcq) {
                    bgGradient = 'from-purple-500 to-indigo-600 ring-4 ring-white/50';
                  }

                  return (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={!hasAnswered && timeRemaining > 0 ? { scale: 1.02, y: -4 } : {}}
                      whileTap={!hasAnswered && timeRemaining > 0 ? { scale: 0.98 } : {}}
                      onClick={() => (isMultipleMcq ? onToggleMultipleMcqAnswer(option) : onSubmitAnswer(option))}
                      disabled={hasAnswered || timeRemaining === 0}
                      className={`
                        relative overflow-hidden group p-6 rounded-2xl text-left transition-all duration-300 min-h-[100px] flex items-center cursor-pointer
                        ${
                          isSelected
                            ? 'ring-4 ring-white shadow-2xl scale-[1.02]'
                            : 'hover:bg-white/5 border border-white/10'
                        }
                        ${isSelected && hasAnswered ? 'ring-4 ring-white z-10' : ''}
                        ${isCorrect ? 'ring-4 ring-white animate-pulse z-10' : ''}
                        bg-gradient-to-br ${bgGradient}
                      `}
                    >
                      <div className="relative z-10 flex items-center justify-between w-full gap-4 text-white font-bold">
                        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg font-black">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-xl md:text-2xl font-black flex-1">{option}</span>
                        {isSelected && !answerResult && <div className="w-3 h-3 bg-white rounded-full animate-pulse" />}
                        {currentQuestion.correctAnswer && isCorrect && (
                          <CheckCircle2 size={24} className="flex-shrink-0" />
                        )}
                        {currentQuestion.correctAnswer && isSelected && !isCorrect && (
                          <XCircle size={24} className="flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}

              {currentQuestion.questionType === 'true_false' && (
                <>
                  {[t('true'), t('false')].map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = currentQuestion.correctAnswer === option;

                    let bgGradient = option === t('true') ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600';
                    if (currentQuestion.correctAnswer) {
                      if (isCorrect) bgGradient = 'from-green-500 to-emerald-600';
                      else if (isSelected) bgGradient = 'from-red-500 to-rose-600';
                      else bgGradient = 'from-gray-600 to-gray-700 opacity-30';
                    }

                    return (
                      <motion.button
                        key={option}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={!hasAnswered && timeRemaining > 0 ? { scale: 1.02, y: -4 } : {}}
                        whileTap={!hasAnswered && timeRemaining > 0 ? { scale: 0.98 } : {}}
                        onClick={() => onSubmitAnswer(option)}
                        disabled={hasAnswered || timeRemaining === 0}
                        className={`
                          relative overflow-hidden group p-8 rounded-3xl text-center transition-all duration-300 min-h-[160px] flex flex-col items-center justify-center cursor-pointer
                          ${
                            isSelected
                              ? 'ring-4 ring-white shadow-2xl scale-[1.02]'
                              : 'hover:bg-white/5 border border-white/10'
                          }
                          ${isSelected && hasAnswered ? 'ring-4 ring-white z-10' : ''}
                          ${isCorrect ? 'ring-4 ring-white animate-pulse z-10' : ''}
                          bg-gradient-to-br ${bgGradient}
                        `}
                      >
                        <span className="text-3xl md:text-4xl font-black text-white mb-2">{option}</span>
                        <div className="flex items-center gap-2">
                          {currentQuestion.correctAnswer && isCorrect && (
                            <CheckCircle2 size={32} className="text-white" />
                          )}
                          {currentQuestion.correctAnswer && isSelected && !isCorrect && (
                            <XCircle size={32} className="text-white" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </>
              )}

              {(currentQuestion.questionType === 'free_text' || currentQuestion.questionType === 'number') && (
                <div className="col-span-full space-y-4">
                  <div className="flex gap-3">
                    <input
                      type={currentQuestion.questionType === 'number' ? 'number' : 'text'}
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      disabled={hasAnswered || timeRemaining === 0}
                      placeholder={
                        currentQuestion.questionType === 'number' ? t('numberPlaceholder') : t('textPlaceholder')
                      }
                      className={`flex-1 bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-5 text-xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all ${
                        currentQuestion.correctAnswer &&
                        selectedAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim()
                          ? 'border-green-500 bg-green-500/10'
                          : currentQuestion.correctAnswer
                            ? 'border-red-500 bg-red-500/10'
                            : ''
                      }`}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSubmitAnswer(selectedAnswer)}
                      disabled={hasAnswered || timeRemaining === 0 || !selectedAnswer.trim()}
                      className="bg-purple-500 text-white font-black px-8 rounded-2xl hover:bg-purple-400 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
                    >
                      <Send size={20} />
                      {t('submitAnswer').toUpperCase()}
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {currentQuestion.correctAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500 p-6 rounded-2xl text-white font-black text-center shadow-xl border-b-4 border-black/20"
                      >
                        <div className="text-xs uppercase opacity-70 mb-1">{t('correctAnswerLabel')}</div>
                        <div className="text-2xl">{currentQuestion.correctAnswer}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {isMultipleMcq && !hasAnswered && timeRemaining > 0 && multipleMcqAnswers.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSubmitAnswer(selectedAnswer)}
                className="w-full bg-white text-indigo-900 font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 mb-8 cursor-pointer"
              >
                <Send size={20} />
                {t('submitMultiple', { count: multipleMcqAnswers.length }).toUpperCase()}
              </motion.button>
            )}

            {/* Feedback */}
            <div className="mt-auto relative h-24 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {hasAnswered && (
                  <motion.div
                    key="answered"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-center"
                  >
                    {answerResult ? (
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-black text-3xl shadow-2xl border-b-4 border-black/20 ${
                          answerResult.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {answerResult.isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                        {answerResult.message.toUpperCase()}!
                      </motion.div>
                    ) : (
                      <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 text-white font-bold text-xl backdrop-blur-md border border-white/20">
                        <Send size={20} className="animate-pulse" />
                        {t('answerSubmitted')}
                      </div>
                    )}
                  </motion.div>
                )}

                {timeRemaining === 0 && !hasAnswered && (
                  <motion.div
                    key="timesup"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                    className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-red-600 text-white font-black text-3xl shadow-2xl border-b-4 border-black/20"
                  >
                    <Clock size={32} className="animate-bounce" />
                    {t('timesUp').toUpperCase()}!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Score Footer */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-auto pt-6 flex justify-between items-center border-t border-white/10 relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
            <User size={20} />
          </div>
          <div className="text-purple-200">
            <span className="font-black text-white text-lg tracking-tight uppercase">{player.name}</span>
          </div>
        </div>
        <div className="bg-white/10 px-6 py-2 rounded-2xl text-white font-mono font-black text-xl border border-white/10 shadow-inner">
          {player.score}{' '}
          <span className="text-[10px] text-purple-300 uppercase font-sans tracking-widest ml-1">pts</span>
        </div>
      </motion.div>
    </div>
  );
}
