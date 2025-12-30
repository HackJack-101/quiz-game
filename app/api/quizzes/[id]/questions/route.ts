import { NextRequest, NextResponse } from 'next/server';

import { Question } from '@/lib/db';
import {
  createQuestion,
  deleteQuestion,
  getQuestionsByQuizId,
  getQuizById,
  reorderQuestions,
  updateQuestion,
} from '@/lib/db-utils';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/quizzes/[id]/questions - Get all questions for a quiz
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

    const questions = getQuestionsByQuizId(quizId);

    // Parse options JSON for each question
    const parsedQuestions = questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null,
    }));

    return NextResponse.json(parsedQuestions);
  } catch (error) {
    console.error('Error in GET /api/quizzes/[id]/questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/quizzes/[id]/questions - Create a new question
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { questionText, questionType, correctAnswer, options } = body;

    if (!questionText || !questionType || !correctAnswer) {
      return NextResponse.json(
        { error: 'questionText, questionType, and correctAnswer are required' },
        { status: 400 },
      );
    }

    // Validate question type
    const validTypes: Question['question_type'][] = ['true_false', 'mcq', 'number', 'free_text', 'multiple_mcq'];
    if (!validTypes.includes(questionType)) {
      return NextResponse.json(
        { error: 'Invalid question type. Must be one of: true_false, mcq, number, free_text, multiple_mcq' },
        { status: 400 },
      );
    }

    // Validate options for MCQ
    if (questionType === 'mcq' || questionType === 'multiple_mcq') {
      if (!options || !Array.isArray(options) || options.length !== 4) {
        return NextResponse.json({ error: 'MCQ questions require exactly 4 options' }, { status: 400 });
      }
    }

    // Validate true/false answer
    if (questionType === 'true_false') {
      if (!['true', 'false'].includes(correctAnswer.toLowerCase())) {
        return NextResponse.json(
          { error: 'True/False questions must have "true" or "false" as the correct answer' },
          { status: 400 },
        );
      }
    }

    const question = createQuestion(quizId, questionText, questionType, correctAnswer, options);

    return NextResponse.json(
      {
        ...question,
        options: question.options ? JSON.parse(question.options) : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in POST /api/quizzes/[id]/questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/quizzes/[id]/questions - Update a question or reorder questions
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const quizId = parseInt(id, 10);

    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const body = await request.json();

    // Check if this is a reorder request
    if (body.reorder && Array.isArray(body.questionIds)) {
      reorderQuestions(quizId, body.questionIds);
      const questions = getQuestionsByQuizId(quizId);
      const parsedQuestions = questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
      }));
      return NextResponse.json(parsedQuestions);
    }

    // Otherwise, update a specific question
    const { questionId, questionText, questionType, correctAnswer, options } = body;

    if (!questionId || !questionText || !questionType || !correctAnswer) {
      return NextResponse.json(
        { error: 'questionId, questionText, questionType, and correctAnswer are required' },
        { status: 400 },
      );
    }

    // Validate question type
    const validTypes: Question['question_type'][] = ['true_false', 'mcq', 'number', 'free_text', 'multiple_mcq'];
    if (!validTypes.includes(questionType)) {
      return NextResponse.json({ error: 'Invalid question type' }, { status: 400 });
    }

    const question = updateQuestion(parseInt(questionId, 10), questionText, questionType, correctAnswer, options);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...question,
      options: question.options ? JSON.parse(question.options) : null,
    });
  } catch (error) {
    console.error('Error in PUT /api/quizzes/[id]/questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/quizzes/[id]/questions - Delete a question
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const quizId = parseInt(id, 10);

    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ error: 'questionId parameter is required' }, { status: 400 });
    }

    const deleted = deleteQuestion(parseInt(questionId, 10));

    if (!deleted) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/quizzes/[id]/questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
