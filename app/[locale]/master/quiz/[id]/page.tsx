'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  HelpCircle,
  LayoutDashboard,
  Pencil,
  Play,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { use, useCallback, useEffect, useState } from 'react';

import { Link } from '@/i18n/routing';

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  correct_answer: string;
  options: string[] | null;
  order_index: number;
}

export default function QuizEditor({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('QuizEditor');
  const { id } = use(params);

  const questionTypeLabels = {
    true_false: t('questionTypes.true_false'),
    mcq: t('questionTypes.mcq'),
    multiple_mcq: t('questionTypes.multiple_mcq'),
    number: t('questionTypes.number'),
    free_text: t('questionTypes.free_text'),
  };
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit quiz form
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTimeLimit, setEditTimeLimit] = useState(10);

  // New/Edit question form
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<Question['question_type']>('mcq');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${id}`);
      if (!res.ok) throw new Error('Quiz not found');
      const data = await res.json();
      setQuiz(data);
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setEditTimeLimit(data.time_limit);
    } catch (err) {
      console.error('Failed to fetch quiz:', err);
      setError(t('errors.loadFailed'));
    }
  }, [id, t]);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${id}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
    fetchQuestions();
  }, [fetchQuestions, fetchQuiz, id]);

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          timeLimit: editTimeLimit,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setQuiz(updated);
        setEditingQuiz(false);
      }
    } catch (err) {
      console.error('Failed to update quiz:', err);
      setError(t('errors.updateFailed'));
    }
  };

  const resetQuestionForm = () => {
    setQuestionText('');
    setQuestionType('mcq');
    setCorrectAnswer('');
    setOptions(['', '', '', '']);
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.question_text);
    setQuestionType(question.question_type);
    setCorrectAnswer(question.correct_answer);
    setOptions(question.options || ['', '', '', '']);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    const questionData = {
      questionText,
      questionType,
      correctAnswer,
      options: questionType === 'mcq' || questionType === 'multiple_mcq' ? options : undefined,
    };

    try {
      if (editingQuestion) {
        // Update existing question
        const res = await fetch(`/api/quizzes/${id}/questions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: editingQuestion.id,
            ...questionData,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
          resetQuestionForm();
        }
      } else {
        // Create new question
        const res = await fetch(`/api/quizzes/${id}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionData),
        });

        if (res.ok) {
          const newQuestion = await res.json();
          setQuestions([...questions, newQuestion]);
          resetQuestionForm();
        }
      }
    } catch (err) {
      console.error('Failed to save question:', err);
      setError(t('errors.saveFailed'));
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/quizzes/${id}/questions?questionId=${questionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setQuestions(questions.filter((q) => q.id !== questionId));
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
      setError(t('errors.deleteFailed'));
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= questions.length) return;

    // Swap questions
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

    // Optimistically update UI
    setQuestions(newQuestions);

    try {
      const res = await fetch(`/api/quizzes/${id}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          questionIds: newQuestions.map((q) => q.id),
        }),
      });

      if (!res.ok) {
        // Rollback on error
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to reorder questions:', err);
      fetchQuestions();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-white/50 font-black uppercase tracking-widest text-xs">{t('loading')}</p>
        </motion.div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/10 mx-auto">
            <HelpCircle size={40} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-black uppercase tracking-tight italic mb-2">{t('notFound')}</h1>
            <Link
              href="/master"
              className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-bold uppercase tracking-widest text-xs transition-colors"
            >
              <ArrowLeft size={14} />
              {t('backToDashboard')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <Link
          href="/master"
          className="inline-flex items-center gap-2 text-purple-200/40 hover:text-yellow-400 transition-colors text-[10px] font-black uppercase tracking-[0.3em] group mb-8 cursor-pointer"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
          {t('backToDashboard')}
        </Link>

        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
          {!editingQuiz ? (
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight italic mb-2 break-words">
                  {quiz.title}
                </h1>
                {quiz.description && (
                  <p className="text-purple-100/60 text-sm font-medium mb-4 break-words line-clamp-2">
                    {quiz.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-1.5 text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                    <Clock size={12} />
                    {quiz.time_limit} {t('seconds')} {t('perQuestion')}
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-200/40 text-[10px] font-black uppercase tracking-widest">
                    <HelpCircle size={12} />
                    {questions.length} {t('questionsCount')}
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
                  href={`/master/quiz/${id}/host`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition-all text-xs uppercase italic shadow-lg shadow-yellow-400/10 cursor-pointer"
                >
                  <Play size={14} />
                  {t('startGame')}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateQuiz} className="space-y-6">
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
      </motion.div>

      <div>
        {/* Add Question Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetQuestionForm();
            setShowQuestionForm(true);
          }}
          className="w-full mb-8 py-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-black text-xl rounded-3xl shadow-xl shadow-yellow-400/10 flex flex-col items-center justify-center gap-4 uppercase italic tracking-tighter group cursor-pointer"
        >
          <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          {t('addQuestion')}
        </motion.button>

        {/* Question Form */}
        <AnimatePresence>
          {showQuestionForm && (
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
                  <button
                    onClick={resetQuestionForm}
                    className="text-white/20 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveQuestion} className="space-y-6">
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

                  {/* MCQ & Multiple MCQ Options */}
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
                                      const updatedAnswers = currentAnswers.map((a) =>
                                        a === oldOption ? newOption : a,
                                      );
                                      setCorrectAnswer(JSON.stringify(updatedAnswers));
                                    } catch {
                                      // Ignore if not valid JSON
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
                                className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
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

                  {/* True/False */}
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

                  {/* Number Input */}
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

                  {/* Free Text */}
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
                      onClick={resetQuestionForm}
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

        {/* Questions List */}
        {questions.length === 0 ? (
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
        ) : (
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
                        onClick={() => handleMoveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="p-3 bg-white/5 text-white/40 rounded-2xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 border border-white/5 cursor-pointer disabled:cursor-not-allowed"
                        title={t('moveUp')}
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(index, 'down')}
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
                        onClick={() => openEditQuestion(question)}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 border border-white/10 transition-all text-[10px] uppercase italic cursor-pointer"
                        title={t('edit')}
                      >
                        <Edit3 size={14} />
                        <span className="hidden sm:inline">{t('edit')}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
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
        )}

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
