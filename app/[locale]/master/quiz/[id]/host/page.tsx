'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  Clock,
  LayoutDashboard,
  LogOut,
  Play,
  RotateCcw,
  SkipForward,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { use, useCallback, useEffect, useState } from 'react';

import { useRouter } from '@/i18n/routing';

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
  const tStats = useTranslations('GameStats');
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

  const renderExitModal = () => {
    return (
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                  <LogOut size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t('exitGame')}</h2>
              <p className="text-gray-600 mb-8 text-center text-balance">{t('exitConfirm')}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  {t('stay').toUpperCase()}
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  {t('leave').toUpperCase()}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
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

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const questionProgress =
    game.current_question_index >= 0
      ? `${game.current_question_index + 1} / ${questions.length}`
      : `0 / ${questions.length}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-2 sm:p-6 overflow-x-hidden">
      {renderExitModal()}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 mb-6 shadow-2xl"
        >
          <div className="flex flex-col items-start justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-inner">
                <Trophy size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight break-words">{quiz.title}</h1>
                {quiz.description && <p className="text-purple-100/70 text-sm mt-1 break-words">{quiz.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-right">
                <div className="text-[10px] text-purple-200 uppercase tracking-widest font-bold mb-1">
                  {t('gameStatus')}
                </div>
                <div className="text-sm font-black text-white uppercase flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${game.status === 'finished' ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}
                  />
                  {game.status === 'waiting' && t('statusWaiting')}
                  {(game.status === 'active' || game.status === 'question') && t('statusActive')}
                  {game.status === 'finished' && t('statusFinished')}
                </div>
              </div>
            </div>
          </div>

          {/* PIN Code Display */}
          <AnimatePresence mode="wait">
            {game.status === 'waiting' ? (
              <motion.div
                key="pin"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-[2rem] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="text-black/60 text-sm sm:text-lg font-black uppercase tracking-[0.3em] mb-4">
                  {t('joinCode')}
                </div>
                <div className="text-6xl sm:text-9xl font-black text-black tracking-[0.2em] font-mono drop-shadow-lg">
                  {game.pin_code}
                </div>
                <div className="text-black/60 text-sm sm:text-lg mt-6 font-bold flex items-center justify-center gap-2">
                  <Users size={20} />
                  {t('joinInstructions')}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-200">
                      <LayoutDashboard size={20} />
                    </div>
                    <div className="text-purple-200 text-sm font-bold uppercase tracking-wider">
                      {t('questionProgress')}
                    </div>
                  </div>
                  <div className="text-white font-black text-2xl">{questionProgress}</div>
                </div>

                {currentQuestion && quiz && (
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-200">
                          <Clock size={20} />
                        </div>
                        <div className="text-purple-200 text-sm font-bold uppercase tracking-wider">
                          {t('timeRemaining')}
                        </div>
                      </div>
                      <div
                        className={`font-black text-2xl ${timeRemaining <= 3 ? 'text-red-400 animate-pulse' : 'text-white'}`}
                      >
                        {timeRemaining}
                        {t('seconds')}
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 p-0.5">
                      <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeRemaining / quiz.time_limit) * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                        className={`h-full rounded-full ${timeRemaining <= 3 ? 'bg-red-400' : 'bg-green-400'}`}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question */}
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="bg-white/10 backdrop-blur-lg rounded-[2.5rem] p-6 sm:p-10 border border-white/20 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
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
                        {t('answersCount', { current: questionAnswers.length, total: players.length })}
                      </span>
                      {players.length > 0 && (
                        <span className="text-white font-mono">
                          {Math.round((questionAnswers.length / players.length) * 100)}%
                        </span>
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
                              <span className="text-white font-black uppercase tracking-tight truncate">
                                {answer.playerName}
                              </span>
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
                                  {answer.time_taken.toFixed(1)}
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
                                      return answer.answer.toLowerCase() === 'true' ? t('true') : t('false');
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
              )}
            </AnimatePresence>

            {/* Game Controls */}
            <motion.div
              layout
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-xl"
            >
              <h2 className="text-xl font-black text-white/50 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <LayoutDashboard size={24} />
                {t('gameControls')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {game.status === 'waiting' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartGame}
                    disabled={players.length === 0}
                    className="col-span-full py-6 bg-gradient-to-r from-green-400 to-emerald-500 text-black font-black text-xl rounded-2xl shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all uppercase italic tracking-tighter"
                  >
                    <Play size={24} fill="currentColor" />
                    {t('startGameWithCount', { count: players.length })}
                  </motion.button>
                )}

                {(game.status === 'active' || game.status === 'question') && !currentQuestion && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextQuestion}
                    className="col-span-full py-6 bg-gradient-to-r from-blue-400 to-cyan-500 text-black font-black text-xl rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 uppercase italic tracking-tighter"
                  >
                    <Play size={24} fill="currentColor" />
                    {t('showFirstQuestion')}
                  </motion.button>
                )}

                {(game.status === 'active' || game.status === 'question') && currentQuestion && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNextQuestion}
                      disabled={game.current_question_index >= questions.length - 1}
                      className="py-4 bg-gradient-to-r from-blue-400 to-cyan-500 text-black font-black rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all uppercase italic"
                    >
                      <SkipForward size={20} fill="currentColor" />
                      {t('nextQuestion')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReplayRound}
                      className="py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black rounded-2xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 uppercase italic"
                    >
                      <RotateCcw size={20} />
                      {t('replayRound')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFinishGame}
                      className="py-4 bg-gradient-to-r from-red-400 to-pink-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 uppercase italic"
                    >
                      <Trophy size={20} />
                      {t('finishGame')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleResetGame}
                      className="py-4 bg-white/5 text-white font-black rounded-2xl border border-white/20 hover:bg-white/10 transition-all uppercase italic"
                    >
                      <RotateCcw size={20} />
                      {t('resetGame')}
                    </motion.button>
                  </>
                )}

                {game.status === 'finished' && (
                  <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/master/quiz/${quizId}/host/stats?gameId=${game.id}`)}
                      className="col-span-full py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 uppercase italic tracking-tighter"
                    >
                      <BarChart3 size={24} />
                      {tStats('viewStats')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReplayRound}
                      className="py-4 bg-yellow-400 text-black font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase italic"
                    >
                      <RotateCcw size={20} />
                      {t('replayRound')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleResetGame}
                      className="py-4 bg-white/10 text-white font-black rounded-2xl border border-white/20 flex items-center justify-center gap-2 uppercase italic"
                    >
                      <RotateCcw size={20} />
                      {t('resetGame')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/master/quiz/${quizId}`)}
                      className="col-span-full py-5 bg-white text-black font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase italic"
                    >
                      <ArrowLeft size={20} />
                      {t('backToEditor')}
                    </motion.button>
                  </div>
                )}

                {game.status !== 'finished' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowExitConfirm(true)}
                    className="col-span-full py-4 bg-white/5 text-white font-black rounded-2xl border border-white/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all uppercase italic flex items-center justify-center gap-2 mt-2"
                  >
                    <LogOut size={20} />
                    {t('exitGame')}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Players */}
          <div className="lg:col-span-1">
            <motion.div
              layout
              className="bg-white/10 backdrop-blur-lg rounded-[2.5rem] p-6 sm:p-8 border border-white/20 sticky top-6 shadow-2xl"
            >
              <h2 className="text-xl font-black text-white/50 uppercase tracking-[0.2em] mb-8 flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <Users size={24} />
                  {t('players')}
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-white text-sm font-mono">
                  {players.length}
                </span>
              </h2>
              <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                  {sortedPlayers.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-purple-200/50 text-center py-12 flex flex-col items-center gap-4"
                    >
                      <Users size={48} className="opacity-20 animate-pulse" />
                      <p className="font-bold uppercase tracking-widest text-sm">{t('waitingForPlayers')}</p>
                    </motion.div>
                  ) : (
                    sortedPlayers.map((player, idx) => (
                      <motion.div
                        key={player.id}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`bg-white/10 rounded-2xl p-4 flex items-center justify-between border-l-4 ${
                          idx === 0
                            ? 'border-yellow-400'
                            : idx === 1
                              ? 'border-gray-300'
                              : idx === 2
                                ? 'border-orange-500'
                                : 'border-transparent'
                        } hover:bg-white/20 transition-colors group shadow-lg`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-black w-8 text-center">
                            {idx === 0 && '🥇'}
                            {idx === 1 && '🥈'}
                            {idx === 2 && '🥉'}
                            {idx > 2 && <span className="text-white/30 text-sm">#{idx + 1}</span>}
                          </div>
                          <div>
                            <div className="text-white font-black uppercase tracking-tight group-hover:text-yellow-400 transition-colors">
                              {player.name}
                            </div>
                            <div className="text-purple-200/60 text-xs font-bold uppercase tracking-widest">
                              {t('score')}: <span className="text-white">{player.score}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
