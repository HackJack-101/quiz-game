'use client';

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Clock, Hash, LogOut, Rocket, Send, Trophy, User, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useRouter } from '@/i18n/routing';

interface Player {
  id: number;
  game_id: number;
  name: string;
  score: number;
}

interface Game {
  id: number;
  status: 'waiting' | 'active' | 'question' | 'finished';
  currentQuestionIndex: number;
  questionStartedAt: string | null;
}

interface Quiz {
  id: number;
  title: string;
  timeLimit: number;
}

interface Question {
  id: number;
  questionText: string;
  questionType: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  options: string[] | null;
  correctAnswer?: string;
}

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

  const [game, setGame] = useState<Game | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
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

        // Reset answer state if question changed
        if (currentQuestion?.id !== data.currentQuestion?.id) {
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
        } else if (data.currentQuestion) {
          // Reset answer state if no playerAnswer exists (e.g., round was replayed)
          setSelectedAnswer('');
          setHasAnswered(false);
          setAnswerResult(null);
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
  }, [playerId, joined, currentQuestion?.id, t]);

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

  const renderExitModal = () => {
    return (
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl w-full max-w-md"
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 text-white">
              <Hash size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">{t('enterPin')}</h1>
            <p className="text-purple-200">{t('welcome')}</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Hash size={14} />
                {t('pinCode')}
              </label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder={t('pinPlaceholder')}
                maxLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 sm:py-4 text-center text-2xl sm:text-3xl font-mono font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2 uppercase tracking-wider flex items-center gap-2">
                <User size={14} />
                {t('displayName')}
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t('namePlaceholder')}
                maxLength={20}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 sm:py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {t('joinGame')}
                  <ChevronRight size={20} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!game || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="fixed top-6 right-6 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white p-3 rounded-2xl transition-all border border-white/10 backdrop-blur-md group z-10"
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
        {renderExitModal()}
      </div>
    );
  }

  // Waiting Room
  if (game.status === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-center overflow-hidden">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white p-2 sm:p-3 rounded-2xl transition-all border border-white/10 backdrop-blur-md group z-10"
          title={t('exitGame')}
        >
          <LogOut className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-white/20 shadow-2xl max-w-lg w-full relative"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-6xl sm:text-8xl mb-6 inline-block"
          >
            👋
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {t('welcomeWithName', { name: player.name })}
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 mb-8">{t('waitingForHost')}</p>

          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 rounded-full text-purple-200 text-sm sm:text-base border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {t('pinCode')}: <span className="text-white font-bold">{pinCode}</span>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 opacity-20">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-1 bg-white rounded-full" />
            ))}
          </div>
        </motion.div>
        {renderExitModal()}
      </div>
    );
  }

  // Finished
  if (game.status === 'finished') {
    const myRank = leaderboard.find((l) => l.isCurrentPlayer)?.rank ?? '-';
    const isWinner = myRank === 1;

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-y-auto">
        <div className="max-w-md mx-auto py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.div
              animate={isWinner ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              className="inline-block mb-4"
            >
              {isWinner ? (
                <Trophy size={80} className="text-yellow-400" />
              ) : (
                <Rocket size={80} className="text-purple-400" />
              )}
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 italic tracking-tighter uppercase">
              {t('gameFinished')}
            </h1>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400" />
              <div className="text-purple-200 text-xs sm:text-sm uppercase tracking-[0.2em] mb-2">
                {t('finalScore')}
              </div>
              <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
                {player.score}
              </div>
              <div className="text-white font-bold text-xl sm:text-2xl flex items-center justify-center gap-2">
                <span className="opacity-50">#</span>
                {t('rank', { rank: myRank.toString() })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400" />
              <h2 className="text-xl font-bold text-white">{t('finalLeaderboard')}</h2>
            </div>
            <div className="divide-y divide-white/10">
              <AnimatePresence>
                {leaderboard.map((entry, idx) => (
                  <motion.div
                    key={entry.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className={`p-4 flex items-center justify-between ${entry.isCurrentPlayer ? 'bg-white/10' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${
                          entry.rank === 1
                            ? 'bg-yellow-400 text-black'
                            : entry.rank === 2
                              ? 'bg-gray-300 text-black'
                              : entry.rank === 3
                                ? 'bg-orange-500 text-black'
                                : 'bg-white/5 text-purple-300'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <span className={`font-bold ${entry.isCurrentPlayer ? 'text-white' : 'text-purple-100'}`}>
                        {entry.name}{' '}
                        {entry.isCurrentPlayer && (
                          <span className="ml-1 text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full uppercase">
                            {t('you')}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">{entry.score}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              localStorage.removeItem('quiz_player_id');
              setJoined(false);
              setPlayerId(null);
              router.push('/');
            }}
            className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            {t('backToHome')}
          </motion.button>
        </div>
      </div>
    );
  }

  // Active but no question (Intermission or loading)
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-center text-white overflow-hidden">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="fixed top-6 right-6 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white p-3 rounded-2xl transition-all border border-white/10 backdrop-blur-md group z-10"
          title={t('exitGame')}
        >
          <LogOut className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-8xl mb-6"
          >
            🚀
          </motion.div>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">{t('getReady')}</h1>
          <p className="text-purple-200 text-lg">{t('nextQuestionSoon')}</p>
        </motion.div>
        {renderExitModal()}
      </div>
    );
  }

  // Question Phase
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
              onClick={() => setShowExitConfirm(true)}
              className="bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white p-2.5 rounded-xl transition-all border border-white/10 backdrop-blur-md group"
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
              animate={{ width: `${(timeRemaining / (quiz?.timeLimit || 10)) * 100}%` }}
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
              <div className="absolute top-0 right-0 p-4 opacity-5">
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

                  const isSelected =
                    currentQuestion.questionType === 'mcq'
                      ? selectedAnswer === option
                      : (() => {
                          try {
                            return JSON.parse(selectedAnswer || '[]').includes(option);
                          } catch {
                            return false;
                          }
                        })();

                  let bgGradient = colors[idx % colors.length];
                  if (currentQuestion.correctAnswer) {
                    if (isCorrect) bgGradient = 'from-green-500 to-emerald-600';
                    else if (isSelected) bgGradient = 'from-red-500 to-rose-600';
                    else bgGradient = 'from-gray-600 to-gray-700 opacity-30';
                  } else if (isSelected && currentQuestion.questionType === 'multiple_mcq') {
                    bgGradient = 'from-purple-500 to-indigo-600 ring-4 ring-white/50';
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!hasAnswered ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                      onClick={() =>
                        currentQuestion.questionType === 'mcq'
                          ? handleSubmitAnswer(option)
                          : toggleMultipleMcqAnswer(option)
                      }
                      disabled={hasAnswered || timeRemaining === 0}
                      className={`relative p-6 rounded-2xl text-left text-white font-bold text-xl transition-all shadow-xl flex items-center gap-4 border-b-4 border-black/20 ${
                        hasAnswered && isSelected ? 'ring-4 ring-white z-10' : ''
                      } ${isCorrect ? 'ring-4 ring-white animate-pulse z-10' : ''} bg-gradient-to-br ${bgGradient}`}
                    >
                      <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg font-black">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {currentQuestion.correctAnswer && isCorrect && (
                        <CheckCircle2 size={24} className="flex-shrink-0" />
                      )}
                      {currentQuestion.correctAnswer && isSelected && !isCorrect && (
                        <XCircle size={24} className="flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}

              {currentQuestion.questionType === 'multiple_mcq' && (
                <div className="col-span-full mt-4">
                  <motion.button
                    whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                    whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleSubmitAnswer(selectedAnswer)}
                    disabled={hasAnswered || timeRemaining === 0 || !selectedAnswer || selectedAnswer === '[]'}
                    className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-2xl rounded-2xl shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3 uppercase italic tracking-wider disabled:opacity-50 transition-all"
                  >
                    <Send size={24} />
                    {t('submitAnswer')}
                  </motion.button>
                </div>
              )}

              {currentQuestion.questionType === 'true_false' &&
                ['true', 'false'].map((option) => {
                  const isCorrect =
                    currentQuestion.correctAnswer && currentQuestion.correctAnswer.toLowerCase() === option;
                  const isSelected = selectedAnswer && selectedAnswer.toLowerCase() === option;
                  let bgGradient = option === 'true' ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600';

                  if (currentQuestion.correctAnswer) {
                    if (isCorrect) bgGradient = 'from-green-500 to-emerald-600';
                    else if (isSelected) bgGradient = 'from-red-500 to-rose-600';
                    else bgGradient = 'from-gray-600 to-gray-700 opacity-30';
                  }

                  return (
                    <motion.button
                      key={option}
                      whileHover={!hasAnswered ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                      onClick={() => handleSubmitAnswer(option)}
                      disabled={hasAnswered || timeRemaining === 0}
                      className={`relative p-10 rounded-3xl text-white font-black text-3xl transition-all shadow-xl flex flex-col items-center justify-center gap-4 border-b-8 border-black/20 ${
                        hasAnswered && isSelected ? 'ring-4 ring-white z-10' : ''
                      } ${isCorrect ? 'ring-4 ring-white animate-pulse z-10' : ''} bg-gradient-to-br ${bgGradient}`}
                    >
                      <span className="uppercase tracking-tighter">{option === 'true' ? t('true') : t('false')}</span>
                      <div className="flex items-center gap-2">
                        {currentQuestion.correctAnswer && isCorrect && <CheckCircle2 size={32} />}
                        {currentQuestion.correctAnswer && isSelected && !isCorrect && <XCircle size={32} />}
                      </div>
                    </motion.button>
                  );
                })}

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
                      onClick={() => handleSubmitAnswer(selectedAnswer)}
                      disabled={hasAnswered || timeRemaining === 0 || !selectedAnswer.trim()}
                      className="bg-purple-500 text-white font-black px-8 rounded-2xl hover:bg-purple-400 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20"
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
      {renderExitModal()}
    </div>
  );
}
