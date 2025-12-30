import { NextRequest, NextResponse } from 'next/server';

import {
  createGame,
  getGameByPinCode,
  getGamesByUserId,
  getPlayersByGameId,
  getQuestionsByQuizId,
  getQuizById,
} from '@/lib/db-utils';

// POST /api/games - Create a new game (start a quiz)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId } = body;

    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }

    const quiz = getQuizById(parseInt(quizId, 10));
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Check if quiz has questions
    const questions = getQuestionsByQuizId(quiz.id);
    if (questions.length === 0) {
      return NextResponse.json({ error: 'Quiz must have at least one question to start a game' }, { status: 400 });
    }

    const game = createGame(quiz.id);

    return NextResponse.json(
      {
        ...game,
        quiz,
        questionCount: questions.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in POST /api/games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/games - Get game by pin code or user ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pinCode = searchParams.get('pinCode');
    const userId = searchParams.get('userId');

    if (userId) {
      const games = getGamesByUserId(parseInt(userId, 10));
      return NextResponse.json(games);
    }

    if (!pinCode) {
      return NextResponse.json({ error: 'pinCode or userId parameter is required' }, { status: 400 });
    }

    const game = getGameByPinCode(pinCode);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.status === 'finished') {
      return NextResponse.json({ error: 'This game has already ended' }, { status: 400 });
    }

    const quiz = getQuizById(game.quiz_id);
    const players = getPlayersByGameId(game.id);

    return NextResponse.json({
      ...game,
      quiz: quiz ? { id: quiz.id, title: quiz.title } : null,
      playerCount: players.length,
    });
  } catch (error) {
    console.error('Error in GET /api/games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
