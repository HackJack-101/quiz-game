'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useRouter } from '@/i18n/routing';

import CreateQuizForm from './_components/CreateQuizForm';
import MasterHeader from './_components/MasterHeader';
import MasterLogin from './_components/MasterLogin';
import QuizzesList from './_components/QuizzesList';

interface User {
  id: number;
  email: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
  created_at: string;
  updated_at: string;
}

export default function MasterDashboard() {
  const t = useTranslations('MasterDashboard');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New quiz form
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizTimeLimit, setNewQuizTimeLimit] = useState(10);

  const fetchQuizzes = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`/api/quizzes?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    }
  }, []);

  const handleLogin = useCallback(
    async (emailToUse?: string) => {
      const emailValue = emailToUse || email;
      if (!emailValue) {
        setError(t('errors.enterEmail'));
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailValue, locale }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t('errors.loginFailed'));
        }

        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('quizMasterEmail', emailValue);

        // Fetch quizzes
        await fetchQuizzes(userData.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.anErrorOccurred'));
      } finally {
        setLoading(false);
      }
    },
    [email, fetchQuizzes, t, locale],
  );

  // Load user from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('quizMasterEmail');
    if (savedEmail) {
      handleLogin(savedEmail);
    }
  }, [handleLogin]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuizTitle) return;

    setLoading(true);
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: newQuizTitle,
          description: newQuizDescription,
          timeLimit: newQuizTimeLimit,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errors.createFailed'));
      }

      const newQuiz = await res.json();
      setQuizzes([newQuiz, ...quizzes]);
      setShowNewQuiz(false);
      setNewQuizTitle('');
      setNewQuizDescription('');
      setNewQuizTimeLimit(10);
      router.push(`/master/quiz/${newQuiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.anErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setQuizzes(quizzes.filter((q) => q.id !== quizId));
      }
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quizMasterEmail');
    setUser(null);
    setQuizzes([]);
    setEmail('');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!confirm(t('deleteAccountConfirm'))) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errors.anErrorOccurred'));
      }

      handleLogout();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.anErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  // Login form
  if (!user) {
    return <MasterLogin email={email} setEmail={setEmail} onLogin={handleLogin} loading={loading} error={error} />;
  }

  // Dashboard
  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <MasterHeader user={user} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <CreateQuizForm
            show={showNewQuiz}
            setShow={setShowNewQuiz}
            title={newQuizTitle}
            setTitle={setNewQuizTitle}
            description={newQuizDescription}
            setDescription={setNewQuizDescription}
            timeLimit={newQuizTimeLimit}
            setTimeLimit={setNewQuizTimeLimit}
            onCreate={handleCreateQuiz}
            loading={loading}
          />
        </div>

        <QuizzesList quizzes={quizzes} onDeleteQuiz={handleDeleteQuiz} />
      </div>
      {error && <p className="text-red-400 text-sm text-center mt-8 font-bold">{error}</p>}
    </div>
  );
}
