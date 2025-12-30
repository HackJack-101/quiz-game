import { NextRequest, NextResponse } from 'next/server';

import {
  awardNumberBonus,
  finishGame,
  getAnswersByQuestionId,
  getGameById,
  getPlayersByGameId,
  getQuestionsByQuizId,
  getQuizById,
  invalidateRound,
  replayRound,
  resetGame,
  startNextQuestion,
  updateGameStatus,
} from '@/lib/db-utils';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/games/[id] - Get full game state (for quiz master)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gameId = parseInt(id, 10);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const game = getGameById(gameId);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const quiz = getQuizById(game.quiz_id);
    const questions = getQuestionsByQuizId(game.quiz_id);
    const players = getPlayersByGameId(game.id);

    // Get current question if game is in progress
    let currentQuestion = null;
    let questionAnswers = null;

    if (game.current_question_index >= 0 && game.current_question_index < questions.length) {
      const q = questions[game.current_question_index];

      // Check if result should be revealed
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
        const revealTime = startTime + (timeLimit + 1) * 1000;
        isRevealed = Date.now() >= revealTime;
      }

      currentQuestion = {
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
        // Hide correct answer from host screen too if it's used for presentation
        ...(!isRevealed ? { correct_answer: '???' } : {}),
      };

      if (isRevealed && q.question_type === 'number') {
        awardNumberBonus(gameId, q.id);
      }

      // Get answers for current question
      const answers = getAnswersByQuestionId(q.id, gameId);
      questionAnswers = answers.map((a) => {
        const player = players.find((p) => p.id === a.player_id);
        return {
          ...a,
          time_taken: (a.response_time_ms || 0) / 1000,
          is_correct: isRevealed ? a.is_correct === 1 : false,
          answer: isRevealed ? a.answer : '***',
          points_earned: isRevealed ? a.points_earned : 0,
          playerName: player?.name || 'Unknown',
        };
      });
    }

    return NextResponse.json({
      game,
      quiz,
      questions: questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
      })),
      players,
      currentQuestion,
      questionAnswers,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error('Error in GET /api/games/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/games/[id] - Control game (next question, finish, etc.)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gameId = parseInt(id, 10);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const game = getGameById(gameId);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start': {
        // Start the game (move from waiting to active)
        if (game.status !== 'waiting') {
          return NextResponse.json({ error: 'Game has already started' }, { status: 400 });
        }
        const updatedGame = updateGameStatus(gameId, 'active');
        return NextResponse.json(updatedGame);
      }

      case 'next_question': {
        // Move to next question
        const questions = getQuestionsByQuizId(game.quiz_id);

        // Before moving to next question, handle number questions (award points to closest)
        if (game.current_question_index >= 0 && game.current_question_index < questions.length) {
          const currentQ = questions[game.current_question_index];
          if (currentQ.question_type === 'number') {
            awardNumberBonus(gameId, currentQ.id);
          }
        }

        if (game.current_question_index >= questions.length - 1) {
          // No more questions, finish the game
          const finishedGame = finishGame(gameId);
          return NextResponse.json({
            ...finishedGame,
            message: 'Game finished - no more questions',
          });
        }

        const updatedGame = startNextQuestion(gameId);
        const newQuestion = questions[updatedGame!.current_question_index];

        return NextResponse.json({
          game: updatedGame,
          currentQuestion: {
            ...newQuestion,
            options: newQuestion.options ? JSON.parse(newQuestion.options) : null,
            // Don't send correct answer to clients
          },
          questionNumber: updatedGame!.current_question_index + 1,
          totalQuestions: questions.length,
        });
      }

      case 'show_results': {
        // Show results for current question (reveal correct answer)
        const questions = getQuestionsByQuizId(game.quiz_id);

        if (game.current_question_index < 0 || game.current_question_index >= questions.length) {
          return NextResponse.json({ error: 'No active question' }, { status: 400 });
        }

        const currentQ = questions[game.current_question_index];
        const answers = getAnswersByQuestionId(currentQ.id, gameId);
        const players = getPlayersByGameId(gameId);

        return NextResponse.json({
          question: {
            ...currentQ,
            options: currentQ.options ? JSON.parse(currentQ.options) : null,
          },
          correctAnswer: currentQ.correct_answer,
          answers: answers.map((a) => {
            const player = players.find((p) => p.id === a.player_id);
            return {
              ...a,
              time_taken: (a.response_time_ms || 0) / 1000,
              is_correct: a.is_correct === 1,
              points_earned: a.points_earned,
              playerName: player?.name || 'Unknown',
            };
          }),
          players: players.sort((a, b) => b.score - a.score),
        });
      }

      case 'finish': {
        // End the game
        const finishedGame = finishGame(gameId);
        const players = getPlayersByGameId(gameId);

        return NextResponse.json({
          game: finishedGame,
          players: players.sort((a, b) => b.score - a.score),
        });
      }

      case 'replay_round': {
        // Replay the current/last round
        const updatedGame = replayRound(gameId);
        if (!updatedGame) {
          return NextResponse.json({ error: 'Failed to replay round' }, { status: 400 });
        }

        const questions = getQuestionsByQuizId(updatedGame.quiz_id);
        const newQuestion = questions[updatedGame.current_question_index];

        return NextResponse.json({
          game: updatedGame,
          currentQuestion: {
            ...newQuestion,
            options: newQuestion.options ? JSON.parse(newQuestion.options) : null,
          },
          questionNumber: updatedGame.current_question_index + 1,
          totalQuestions: questions.length,
        });
      }

      case 'invalidate_round': {
        // Invalidate the current round: cancel scores and move to next question
        const result = invalidateRound(gameId);
        if (!result) {
          return NextResponse.json({ error: 'Failed to invalidate round' }, { status: 400 });
        }

        const { game: updatedGame, finished } = result;

        if (finished) {
          const players = getPlayersByGameId(gameId);
          return NextResponse.json({
            game: updatedGame,
            players: players.sort((a, b) => b.score - a.score),
            message: 'Game finished - no more questions',
          });
        }

        const questions = getQuestionsByQuizId(updatedGame.quiz_id);
        const newQuestion = questions[updatedGame.current_question_index];

        return NextResponse.json({
          game: updatedGame,
          currentQuestion: {
            ...newQuestion,
            options: newQuestion.options ? JSON.parse(newQuestion.options) : null,
          },
          questionNumber: updatedGame.current_question_index + 1,
          totalQuestions: questions.length,
        });
      }

      case 'reset': {
        // Reset the game
        const updatedGame = resetGame(gameId);
        if (!updatedGame) {
          return NextResponse.json({ error: 'Failed to reset game' }, { status: 400 });
        }

        return NextResponse.json(updatedGame);
      }

      case 'resume': {
        // Resume a finished game
        const updatedGame = updateGameStatus(gameId, 'waiting');
        if (!updatedGame) {
          return NextResponse.json({ error: 'Failed to resume game' }, { status: 400 });
        }
        return NextResponse.json(updatedGame);
      }

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Must be one of: start, next_question, show_results, finish, replay_round, invalidate_round, reset, resume',
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in PUT /api/games/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
