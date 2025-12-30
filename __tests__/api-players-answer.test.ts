/** @jest-environment node */
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/players/answer/route';
import {
  createGame,
  createQuestion,
  createQuiz,
  findOrCreateUser,
  joinGame,
  startNextQuestion,
  updateGameStatus,
} from '@/lib/db-utils';

describe('/api/players/answer', () => {
  let playerId: number;
  let questionId: number;
  let gameId: number;

  beforeEach(() => {
    // We rely on the db-utils and db.ts using :memory: for NODE_ENV=test
    // But since they might share the same memory instance if not mocked,
    // and we want a fresh start, let's just create new entities.
    const user = findOrCreateUser(`test-${Date.now()}@example.com`);
    const quiz = createQuiz(user.id, 'Test Quiz');
    const question = createQuestion(quiz.id, '1+1?', 'number', '2');
    questionId = question.id;

    const game = createGame(quiz.id);
    gameId = game.id;

    const player = joinGame(gameId, 'Test Player');
    playerId = player.id;

    // Set game state to 'question'
    startNextQuestion(gameId);
  });

  it('should submit a correct answer', async () => {
    const body = {
      playerId: playerId.toString(),
      questionId: questionId.toString(),
      answer: '2',
      responseTimeMs: 1000,
    };
    const req = new NextRequest('http://localhost/api/players/answer', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.message).toBe('Answer submitted!');
    // Result is hidden because question is still active
    expect(data.answer.is_correct).toBeNull();
  });

  it('should return 400 if game is not in question state', async () => {
    updateGameStatus(gameId, 'waiting');

    const body = {
      playerId: playerId.toString(),
      questionId: questionId.toString(),
      answer: '2',
      responseTimeMs: 1000,
    };
    const req = new NextRequest('http://localhost/api/players/answer', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No active question to answer');
  });

  it('should return 400 if already answered', async () => {
    const body = {
      playerId: playerId.toString(),
      questionId: questionId.toString(),
      answer: '2',
      responseTimeMs: 1000,
    };

    // First submission
    await POST(
      new NextRequest('http://localhost/api/players/answer', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );

    // Second submission
    const res = await POST(
      new NextRequest('http://localhost/api/players/answer', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('You have already answered this question');
  });
});
