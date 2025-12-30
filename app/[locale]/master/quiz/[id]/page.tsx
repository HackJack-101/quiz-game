'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { use, useCallback, useEffect, useState } from 'react';

import { Link } from '@/i18n/routing';

import QuestionForm from './_components/QuestionForm';
import QuestionsList from './_components/QuestionsList';
import QuizInfo from './_components/QuizInfo';

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

        <QuizInfo
          quiz={quiz}
          questionsCount={questions.length}
          editingQuiz={editingQuiz}
          setEditingQuiz={setEditingQuiz}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editTimeLimit={editTimeLimit}
          setEditTimeLimit={setEditTimeLimit}
          onUpdateQuiz={handleUpdateQuiz}
        />
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

        <QuestionForm
          show={showQuestionForm}
          editingQuestion={editingQuestion}
          questionText={questionText}
          setQuestionText={setQuestionText}
          questionType={questionType}
          setQuestionType={setQuestionType}
          correctAnswer={correctAnswer}
          setCorrectAnswer={setCorrectAnswer}
          options={options}
          setOptions={setOptions}
          onSave={handleSaveQuestion}
          onCancel={resetQuestionForm}
        />

        <QuestionsList
          questions={questions}
          onMoveQuestion={handleMoveQuestion}
          onEditQuestion={openEditQuestion}
          onDeleteQuestion={handleDeleteQuestion}
        />

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
