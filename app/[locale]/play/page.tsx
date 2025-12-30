'use client';

import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useRouter } from '@/i18n/routing';
import { Player, PlayerGame, PlayerQuestion, PlayerQuiz } from '@/lib/types';

import ExitModal from './_components/ExitModal';
import GameFinished from './_components/GameFinished';
import Intermission from './_components/Intermission';
import JoinForm from './_components/JoinForm';
import QuestionScreen from './_components/QuestionScreen';
import WaitingRoom from './_components/WaitingRoom';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentPlayer: boolean;
}

export default function PlayPage() {
  const t = useTranslations('PlayPage');
  const router = useRouter();

  const [pinCode, setPinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<number | null>(null);

  const [game, setGame] = useState<PlayerGame | null>(null);
  const [quiz, setQuiz] = useState<PlayerQuiz | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PlayerQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Check for existing player session
  useEffect(() => {
    const savedPlayerId = localStorage.getItem('quiz_player_id');
    if (savedPlayerId) {
      setPlayerId(parseInt(savedPlayerId, 10));
      setJoined(true);
    }
  }, []);

  // Poll for game state
  useEffect(() => {
    if (!playerId || !joined) return;

    const fetchState = async () => {
      try {
        const res = await fetch(`/api/players?playerId=${playerId}`);
        if (!res.ok) {
          if (res.status === 404) {
            localStorage.removeItem('quiz_player_id');
            setJoined(false);
            setPlayerId(null);
            return;
          }
          return;
        }

        const data = await res.json();

        // Reset answer state if question changed or round replayed
        if (
          currentQuestion?.id !== data.currentQuestion?.id ||
          game?.questionStartedAt !== data.game.questionStartedAt
        ) {
          setSelectedAnswer('');
          setHasAnswered(false);
          setAnswerResult(null);
        }

        setGame(data.game);
        setQuiz(data.quiz);
        setPlayer(data.player);
        setCurrentQuestion(data.currentQuestion);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setLeaderboard(data.leaderboard);

        if (data.playerAnswer) {
          setHasAnswered(true);
          setSelectedAnswer(data.playerAnswer.answer);
          if (data.playerAnswer.isCorrect !== null) {
            setAnswerResult({
              isCorrect: data.playerAnswer.isCorrect,
              message: data.playerAnswer.isCorrect ? t('correct') : t('incorrect'),
            });
          }
        }

        if (data.game.status === 'question' && data.game.questionStartedAt && data.quiz) {
          const startStr = data.game.questionStartedAt;
          const normalizedStartStr = startStr.includes('T')
            ? startStr.endsWith('Z')
              ? startStr
              : startStr + 'Z'
            : startStr.replace(' ', 'T') + 'Z';
          const startTime = new Date(normalizedStartStr).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, data.quiz.timeLimit - elapsed);
          setTimeRemaining(remaining);
        }
      } catch (err) {
        console.error('Failed to fetch game state:', err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [playerId, joined, currentQuestion?.id, game?.questionStartedAt, t]);

  // Timer countdown
  useEffect(() => {
    if (game?.status !== 'question' || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [game?.status, timeRemaining]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode, playerName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('gameNotFound'));
      }

      setPlayerId(data.player.id);
      localStorage.setItem('quiz_player_id', data.player.id.toString());
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('gameNotFound'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMultipleMcqAnswer = (option: string) => {
    if (hasAnswered || timeRemaining === 0) return;

    let currentAnswers: string[] = [];
    try {
      currentAnswers = JSON.parse(selectedAnswer || '[]');
      if (!Array.isArray(currentAnswers)) currentAnswers = [];
    } catch {
      currentAnswers = [];
    }

    if (currentAnswers.includes(option)) {
      setSelectedAnswer(JSON.stringify(currentAnswers.filter((a) => a !== option)));
    } else {
      setSelectedAnswer(JSON.stringify([...currentAnswers, option]));
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (hasAnswered || !game || !currentQuestion || !playerId) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    const startStr = game.questionStartedAt;
    const normalizedStartStr = startStr
      ? startStr.includes('T')
        ? startStr.endsWith('Z')
          ? startStr
          : startStr + 'Z'
        : startStr.replace(' ', 'T') + 'Z'
      : null;

    const responseTimeMs = normalizedStartStr ? Date.now() - new Date(normalizedStartStr).getTime() : 0;

    try {
      const res = await fetch('/api/players/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          questionId: currentQuestion.id,
          answer,
          responseTimeMs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.answer.is_correct !== null) {
          const isCorrect = data.answer.is_correct === 1;
          setAnswerResult({
            isCorrect,
            message: isCorrect ? t('correct') : t('incorrect'),
          });

          if (isCorrect) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#A855F7', '#EC4899', '#3B82F6'],
            });
          }
        }
      } else {
        setError(data.error || t('errors.submitFailed'));
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError(t('errors.submitFailed'));
    }
  };

  const confirmExit = () => {
    localStorage.removeItem('quiz_player_id');
    setJoined(false);
    setPlayerId(null);
    router.push('/');
  };

  if (!joined) {
    return (
      <JoinForm
        pinCode={pinCode}
        setPinCode={setPinCode}
        playerName={playerName}
        setPlayerName={setPlayerName}
        onSubmit={handleJoin}
        loading={loading}
        error={error}
      />
    );
  }

  if (!game || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="fixed top-6 right-6 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white p-3 rounded-2xl transition-all border border-white/10 backdrop-blur-md group z-10 cursor-pointer"
          title={t('exitGame')}
        >
          <LogOut className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-xl flex flex-col items-center gap-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white" />
          <div className="font-medium">{t('connecting')}</div>
        </motion.div>
        <ExitModal show={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={confirmExit} />
      </div>
    );
  }

  // Waiting Room
  if (game.status === 'waiting') {
    return (
      <>
        <WaitingRoom playerName={player.name} pinCode={pinCode} onExit={() => setShowExitConfirm(true)} />
        <ExitModal show={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={confirmExit} />
      </>
    );
  }

  // Finished
  if (game.status === 'finished') {
    return (
      <GameFinished
        score={player.score}
        leaderboard={leaderboard}
        onBackToHome={() => {
          localStorage.removeItem('quiz_player_id');
          setJoined(false);
          setPlayerId(null);
          router.push('/');
        }}
      />
    );
  }

  // Active but no question (Intermission or loading)
  if (!currentQuestion) {
    return (
      <>
        <Intermission onExit={() => setShowExitConfirm(true)} />
        <ExitModal show={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={confirmExit} />
      </>
    );
  }

  // Question Phase
  return (
    <>
      <QuestionScreen
        currentQuestion={currentQuestion}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining}
        timeLimit={quiz?.timeLimit || 10}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
        hasAnswered={hasAnswered}
        answerResult={answerResult}
        player={player}
        onToggleMultipleMcqAnswer={toggleMultipleMcqAnswer}
        onSubmitAnswer={handleSubmitAnswer}
        onExit={() => setShowExitConfirm(true)}
      />
      <ExitModal show={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={confirmExit} />
    </>
  );
}
