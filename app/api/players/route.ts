import { NextRequest, NextResponse } from 'next/server';

import {
  getAnswersByPlayerId,
  getGameById,
  getGameByPinCode,
  getPlayerById,
  getPlayersByGameId,
  getQuestionsByQuizId,
  getQuizById,
  joinGame,
} from '@/lib/db-utils';
import { emitPlayerJoined } from '@/lib/socket-utils';

// POST /api/players - Join a game
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pinCode, playerName } = body;

    if (!pinCode || !playerName) {
      return NextResponse.json({ error: 'pinCode and playerName are required' }, { status: 400 });
    }

    if (playerName.trim().length < 1 || playerName.trim().length > 20) {
      return NextResponse.json({ error: 'Player name must be between 1 and 20 characters' }, { status: 400 });
    }

    const game = getGameByPinCode(pinCode);

    if (!game) {
      return NextResponse.json({ error: 'Game not found. Please check the PIN code.' }, { status: 404 });
    }

    if (game.status === 'finished') {
      return NextResponse.json({ error: 'This game has already ended' }, { status: 400 });
    }

    if (game.status !== 'waiting') {
      return NextResponse.json({ error: 'This game has already started. You cannot join now.' }, { status: 400 });
    }

    const player = joinGame(game.id, playerName.trim());
    const quiz = getQuizById(game.quiz_id);

    emitPlayerJoined(game.id, player);

    return NextResponse.json(
      {
        player,
        game: {
          id: game.id,
          status: game.status,
          pinCode: game.pin_code,
        },
        quiz: quiz ? { id: quiz.id, title: quiz.title, timeLimit: quiz.time_limit } : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in POST /api/players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/players?playerId=... - Get player state and current game state
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId parameter is required' }, { status: 400 });
    }

    const player = getPlayerById(parseInt(playerId, 10));

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const game = getGameById(player.game_id);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const quiz = getQuizById(game.quiz_id);
    const questions = getQuestionsByQuizId(game.quiz_id);
    const players = getPlayersByGameId(game.id);

    // Get current question (without correct answer for players until revealed)
    let currentQuestion = null;
    let playerAnswer = null;

    if (game.current_question_index >= 0 && game.current_question_index < questions.length) {
      const q = questions[game.current_question_index];

      const timeLimit = quiz?.time_limit || 10;
      let isRevealed = false;
      if (game.question_started_at) {
        const startStr = game.question_started_at;
        const normalizedStartStr = startStr.includes('T')
          ? startStr.endsWith('Z')
            ? startStr
            : startStr + 'Z'
          : startStr.replace(' ', 'T') + 'Z';
        const startTime = new Date(normalizedStartStr).getTime();
        const revealTime = startTime + timeLimit * 1000;
        isRevealed = Date.now() >= revealTime;
      }

      currentQuestion = {
        id: q.id,
        questionText: q.question_text,
        questionType: q.question_type,
        options: q.options ? JSON.parse(q.options) : null,
        ...(isRevealed ? { correctAnswer: q.correct_answer } : {}),
      };

      const answers = getAnswersByPlayerId(player.id);
      const ans = answers.find((a) => a.question_id === q.id);
      if (ans) {
        playerAnswer = {
          answer: ans.answer,
          isCorrect: isRevealed ? ans.is_correct === 1 : null,
          pointsEarned: isRevealed ? ans.points_earned : null,
        };
      }
    }

    return NextResponse.json({
      player,
      game: {
        id: game.id,
        status: game.status,
        currentQuestionIndex: game.current_question_index,
        questionStartedAt: game.question_started_at,
      },
      quiz: quiz
        ? {
            id: quiz.id,
            title: quiz.title,
            timeLimit: quiz.time_limit,
          }
        : null,
      currentQuestion,
      playerAnswer,
      questionNumber: game.current_question_index + 1,
      totalQuestions: questions.length,
      leaderboard: players
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((p, i) => ({
          rank: i + 1,
          name: p.name,
          score: p.score,
          isCurrentPlayer: p.id === player.id,
        })),
    });
  } catch (error) {
    console.error('Error in GET /api/players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
