import { NextRequest, NextResponse } from 'next/server';

import { createQuiz, getQuizzesByUserId } from '@/lib/db-utils';

// GET /api/quizzes?userId=... - Get all quizzes for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const quizzes = getQuizzesByUserId(parseInt(userId, 10));
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error in GET /api/quizzes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, timeLimit } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title are required' }, { status: 400 });
    }

    const quiz = createQuiz(parseInt(userId, 10), title, description, timeLimit ? parseInt(timeLimit, 10) : 10);

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quizzes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
