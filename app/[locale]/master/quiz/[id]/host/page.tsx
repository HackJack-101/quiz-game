'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { use, useCallback, useEffect, useState } from 'react';

import { useRouter } from '@/i18n/routing';

import HostControls from './_components/HostControls';
import HostExitModal from './_components/HostExitModal';
import HostHeader from './_components/HostHeader';
import HostQuestion from './_components/HostQuestion';
import HostSidebar from './_components/HostSidebar';

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
}

interface Game {
  id: number;
  quiz_id: number;
  pin_code: string | null;
  status: 'waiting' | 'active' | 'question' | 'finished';
  current_question_index: number;
  created_at: string;
}

interface Player {
  id: number;
  game_id: number;
  name: string;
  score: number;
  joined_at: string;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  correct_answer: string;
  options: string[] | null;
  order_index: number;
}

interface Answer {
  id: number;
  player_id: number;
  question_id: number;
  answer: string;
  time_taken: number;
  is_correct: boolean;
  playerName: string;
  points_earned: number;
}

export default function HostGame({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('HostGame');
  const { id: quizId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameIdParam = searchParams.get('gameId');

  const [game, setGame] = useState<Game | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const fetchGameState = useCallback(async () => {
    if (!game) return;

    try {
      const res = await fetch(`/api/games/${game.id}`);
      if (!res.ok) return;

      const data = await res.json();
      setGame(data.game);
      setQuiz(data.quiz);
      setPlayers(data.players);
      setQuestions(data.questions);
      setCurrentQuestion(data.currentQuestion);
      setQuestionAnswers(data.questionAnswers || []);

      if (data.game.question_started_at) {
        const startStr = data.game.question_started_at;
        const normalizedStartStr = startStr.includes('T')
          ? startStr.endsWith('Z')
            ? startStr
            : startStr + 'Z'
          : startStr.replace(' ', 'T') + 'Z';
        setQuestionStartTime(new Date(normalizedStartStr).getTime());
      } else {
        setQuestionStartTime(null);
      }
    } catch (err) {
      console.error('Failed to fetch game state:', err);
    }
  }, [game]);

  const handleStartGame = async () => {
    if (!game) return;

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error'));
      }

      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    }
  };

  const handleNextQuestion = async () => {
    if (!game) return;

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next_question' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error'));
      }

      setQuestionStartTime(Date.now());
      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    }
  };

  const handleReplayRound = async () => {
    if (!game) return;

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'replay_round' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error'));
      }

      setQuestionStartTime(Date.now());
      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    }
  };

  const handleInvalidateRound = async () => {
    if (!game) return;

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalidate_round' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error'));
      }

      setQuestionStartTime(Date.now());
      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    }
  };

  const handleResetGame = async () => {
    if (!game) return;

    if (!confirm(t('resetConfirm'))) {
      return;
    }

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error'));
      }

      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    }
  };

  const handleFinishGame = async () => {
    if (!game) return;

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finish' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error'));
      }

      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    }
  };

  const confirmExit = () => {
    router.push(`/master/quiz/${quizId}`);
  };

  // Create game on mount or fetch existing one
  useEffect(() => {
    const initGame = async () => {
      try {
        if (gameIdParam) {
          const res = await fetch(`/api/games/${gameIdParam}`);
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || t('error'));
          }

          const data = await res.json();
          setGame(data.game);
          setQuiz(data.quiz);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: parseInt(quizId, 10) }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t('error'));
        }

        const data = await res.json();
        setGame(data);
        setQuiz(data.quiz);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error'));
        setLoading(false);
      }
    };

    initGame();
  }, [quizId, t, gameIdParam]);

  // Poll for game updates
  useEffect(() => {
    if (!game) return;

    const interval = setInterval(() => {
      fetchGameState();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [fetchGameState, game, game?.id]);

  // Timer for current question
  useEffect(() => {
    if (!questionStartTime || !quiz) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      const remaining = Math.max(0, quiz.time_limit - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [questionStartTime, quiz, quiz?.time_limit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white text-2xl font-bold">{t('creatingGame')}</div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-200">
            <XCircle size={48} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('error')}</h1>
          <p className="text-red-200 mb-8">{error}</p>
          <button
            onClick={() => router.push(`/master/quiz/${quizId}`)}
            className="w-full py-4 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-bold flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            {t('backToQuiz')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!game || !quiz) {
    return null;
  }

  const questionProgress =
    game.current_question_index >= 0
      ? `${game.current_question_index + 1} / ${questions.length}`
      : `0 / ${questions.length}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-2 sm:p-6 overflow-x-hidden">
      <HostExitModal show={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={confirmExit} />
      <div className="max-w-4xl mx-auto">
        <HostHeader quiz={quiz} game={game} questionProgress={questionProgress} timeRemaining={timeRemaining} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <HostQuestion
                  currentQuestion={currentQuestion}
                  questionAnswers={questionAnswers}
                  playersCount={players.length}
                />
              )}
            </AnimatePresence>

            <HostControls
              game={game}
              playersCount={players.length}
              questionsCount={questions.length}
              currentQuestion={currentQuestion}
              onStartGame={handleStartGame}
              onNextQuestion={handleNextQuestion}
              onReplayRound={handleReplayRound}
              onInvalidateRound={handleInvalidateRound}
              onFinishGame={handleFinishGame}
              onResetGame={handleResetGame}
              onExitGame={() => setShowExitConfirm(true)}
              onViewStats={() => router.push(`/master/quiz/${quizId}/host/stats?gameId=${game.id}`)}
              onBackToEditor={() => router.push(`/master/quiz/${quizId}`)}
            />
          </div>

          <div className="lg:col-span-1">
            <HostSidebar players={players} />
          </div>
        </div>
      </div>
    </div>
  );
}
