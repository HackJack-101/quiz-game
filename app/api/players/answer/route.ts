import { NextRequest, NextResponse } from 'next/server';

import {
  getGameById,
  getPlayerById,
  getQuestionsByQuizId,
  getQuizById,
  hasPlayerAnswered,
  submitAnswer,
} from '@/lib/db-utils';
import { emitAnswerSubmitted } from '@/lib/socket-utils';

// POST /api/players/answer - Submit an answer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, questionId, answer, responseTimeMs } = body;

    if (!playerId || !questionId || answer === undefined || responseTimeMs === undefined) {
      return NextResponse.json(
        { error: 'playerId, questionId, answer, and responseTimeMs are required' },
        { status: 400 },
      );
    }

    const playerIdNum = parseInt(playerId, 10);
    const questionIdNum = parseInt(questionId, 10);
    const responseTime = parseInt(responseTimeMs, 10);

    // Validate player exists
    const player = getPlayerById(playerIdNum);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Validate game is in question state
    const game = getGameById(player.game_id);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.status !== 'question') {
      return NextResponse.json({ error: 'No active question to answer' }, { status: 400 });
    }

    // Validate question is the current question
    const questions = getQuestionsByQuizId(game.quiz_id);
    const currentQuestion = questions[game.current_question_index];

    if (!currentQuestion || currentQuestion.id !== questionIdNum) {
      return NextResponse.json({ error: 'Invalid question - not the current question' }, { status: 400 });
    }

    // Check if player already answered this question
    if (hasPlayerAnswered(playerIdNum, questionIdNum)) {
      return NextResponse.json({ error: 'You have already answered this question' }, { status: 400 });
    }

    // Submit the answer
    const answerRecord = submitAnswer(playerIdNum, questionIdNum, String(answer), responseTime);

    emitAnswerSubmitted(game.id, answerRecord);

    // Get updated player score
    const updatedPlayer = getPlayerById(playerIdNum);

    // Check if result should be revealed (usually false for immediate submission)
    const quiz = getQuizById(game.quiz_id);
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

    return NextResponse.json(
      {
        answer: isRevealed
          ? answerRecord
          : {
              ...answerRecord,
              is_correct: null,
              points_earned: null,
            },
        player: updatedPlayer,
        message: isRevealed ? (answerRecord.is_correct ? 'Correct!' : 'Incorrect') : 'Answer submitted!',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in POST /api/players/answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
