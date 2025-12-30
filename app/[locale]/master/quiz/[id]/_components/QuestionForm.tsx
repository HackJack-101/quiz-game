'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Question {
  id: number;
  question_text: string;
  question_type: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  correct_answer: string;
  options: string[] | null;
}

interface QuestionFormProps {
  show: boolean;
  editingQuestion: Question | null;
  questionText: string;
  setQuestionText: (value: string) => void;
  questionType: Question['question_type'];
  setQuestionType: (value: Question['question_type']) => void;
  correctAnswer: string;
  setCorrectAnswer: (value: string) => void;
  options: string[];
  setOptions: (value: string[]) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function QuestionForm({
  show,
  editingQuestion,
  questionText,
  setQuestionText,
  questionType,
  setQuestionType,
  correctAnswer,
  setCorrectAnswer,
  options,
  setOptions,
  onSave,
  onCancel,
}: QuestionFormProps) {
  const t = useTranslations('QuizEditor');

  const questionTypeLabels = {
    true_false: t('questionTypes.true_false'),
    mcq: t('questionTypes.mcq'),
    multiple_mcq: t('questionTypes.multiple_mcq'),
    number: t('questionTypes.number'),
    free_text: t('questionTypes.free_text'),
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black">
                  {editingQuestion ? <Pencil size={20} /> : <Plus size={20} />}
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
                  {editingQuestion ? t('editQuestion') : t('addNewQuestion')}
                </h2>
              </div>
              <button onClick={onCancel} className="text-white/20 hover:text-white transition-colors cursor-pointer">
                <Trash2 size={20} />
              </button>
            </div>

            <form onSubmit={onSave} className="space-y-6">
              <div>
                <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                  {t('questionTypeLabel')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(questionTypeLabels).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setQuestionType(value as Question['question_type']);
                        setCorrectAnswer('');
                      }}
                      className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-left flex items-center justify-between border cursor-pointer ${
                        questionType === value
                          ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20'
                          : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      {label}
                      {questionType === value && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                  {t('questionLabel')}
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={t('questionPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none transition-all"
                  rows={3}
                  required
                />
              </div>

              {(questionType === 'mcq' || questionType === 'multiple_mcq') && (
                <div className="space-y-4">
                  <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
                    {t('optionsHelp')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {options.map((option, index) => {
                      const isChecked =
                        questionType === 'mcq'
                          ? correctAnswer === option && option !== ''
                          : (() => {
                              try {
                                return JSON.parse(correctAnswer || '[]').includes(option) && option !== '';
                              } catch {
                                return false;
                              }
                            })();

                      return (
                        <div key={index} className="relative group">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...options];
                              const oldOption = options[index];
                              const newOption = e.target.value;
                              newOptions[index] = newOption;
                              setOptions(newOptions);

                              if (questionType === 'mcq') {
                                if (correctAnswer === oldOption) {
                                  setCorrectAnswer(newOption);
                                }
                              } else {
                                try {
                                  const currentAnswers = JSON.parse(correctAnswer || '[]') as string[];
                                  const updatedAnswers = currentAnswers.map((a) => (a === oldOption ? newOption : a));
                                  setCorrectAnswer(JSON.stringify(updatedAnswers));
                                } catch {
                                  // Ignore
                                }
                              }
                            }}
                            placeholder={t('optionPlaceholder', { index: index + 1 })}
                            className={`w-full pl-4 pr-12 py-3 rounded-xl bg-white/5 border transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                              isChecked
                                ? 'border-yellow-400/50 text-white shadow-lg shadow-yellow-400/5'
                                : 'border-white/10 text-white/60 placeholder-white/10'
                            }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (questionType === 'mcq') {
                                setCorrectAnswer(option);
                              } else {
                                let currentAnswers: string[];
                                try {
                                  currentAnswers = JSON.parse(correctAnswer || '[]');
                                } catch {
                                  currentAnswers = [];
                                }

                                if (currentAnswers.includes(option)) {
                                  setCorrectAnswer(JSON.stringify(currentAnswers.filter((a) => a !== option)));
                                } else {
                                  setCorrectAnswer(JSON.stringify([...currentAnswers, option]));
                                }
                              }
                            }}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-yellow-400 border-yellow-400 text-black'
                                : 'border-white/10 text-white/10 hover:border-white/30 hover:text-white/30'
                            }`}
                          >
                            {isChecked && <CheckCircle2 size={14} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {questionType === 'true_false' && (
                <div className="space-y-4">
                  <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em]">
                    {t('correctAnswerLabel')}
                  </label>
                  <div className="flex gap-4">
                    {['true', 'false'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCorrectAnswer(val)}
                        className={`flex-1 py-4 rounded-xl font-black uppercase italic transition-all border cursor-pointer ${
                          correctAnswer === val
                            ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20'
                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {t(val)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {questionType === 'number' && (
                <div>
                  <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                    {t('correctAnswerNumber')}
                  </label>
                  <input
                    type="number"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder={t('correctAnswerPlaceholderNumber')}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                    required
                  />
                </div>
              )}

              {questionType === 'free_text' && (
                <div>
                  <label className="block text-purple-200/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                    {t('correctAnswerText')}
                  </label>
                  <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder={t('correctAnswerPlaceholderText')}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                    required
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-4 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 border border-white/10 transition-all uppercase italic tracking-tighter cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 transition-all uppercase italic tracking-tighter shadow-lg shadow-yellow-400/10 cursor-pointer"
                >
                  {editingQuestion ? t('updateQuestion') : t('saveQuestion')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
