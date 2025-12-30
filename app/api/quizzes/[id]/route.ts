import { NextRequest, NextResponse } from 'next/server';

import { deleteQuiz, getQuizById, updateQuiz } from '@/lib/db-utils';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/quizzes/[id] - Get a specific quiz
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const quizId = parseInt(id, 10);

    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const quiz = getQuizById(quizId);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error in GET /api/quizzes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/quizzes/[id] - Update a quiz
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const quizId = parseInt(id, 10);

    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, timeLimit } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const quiz = updateQuiz(quizId, title, description, timeLimit ? parseInt(timeLimit, 10) : undefined);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error in PUT /api/quizzes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/quizzes/[id] - Delete a quiz
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const quizId = parseInt(id, 10);

    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const deleted = deleteQuiz(quizId);

    if (!deleted) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/quizzes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
