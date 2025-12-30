/** @jest-environment node */
import Database from 'better-sqlite3';
import { NextRequest } from 'next/server';

import { GET, POST, PUT } from '@/app/api/quizzes/[id]/questions/route';
import { createQuiz, findOrCreateUser } from '@/lib/db-utils';

// Mock the db to use in-memory
jest.mock('../lib/db', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      time_limit INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      options TEXT,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );
  `);
  return {
    __esModule: true,
    default: db,
  };
});

describe('/api/quizzes/[id]/questions', () => {
  let userId: number;
  let quizId: number;

  beforeAll(() => {
    const user = findOrCreateUser('questions-test@example.com');
    userId = user.id;
    const quiz = createQuiz(userId, 'Test Quiz', 'Description', 10);
    quizId = quiz.id;
  });

  describe('Reordering', () => {
    it('should reorder questions', async () => {
      // Create two questions
      const q1Res = await POST(
        new NextRequest(`http://localhost/api/quizzes/${quizId}/questions`, {
          method: 'POST',
          body: JSON.stringify({
            questionText: 'Question 1',
            questionType: 'true_false',
            correctAnswer: 'true',
          }),
        }),
        { params: Promise.resolve({ id: quizId.toString() }) },
      );
      const q1 = await q1Res.json();

      const q2Res = await POST(
        new NextRequest(`http://localhost/api/quizzes/${quizId}/questions`, {
          method: 'POST',
          body: JSON.stringify({
            questionText: 'Question 2',
            questionType: 'true_false',
            correctAnswer: 'false',
          }),
        }),
        { params: Promise.resolve({ id: quizId.toString() }) },
      );
      const q2 = await q2Res.json();

      expect(q1.order_index).toBe(0);
      expect(q2.order_index).toBe(1);

      // Reorder: put q2 first
      const reorderRes = await PUT(
        new NextRequest(`http://localhost/api/quizzes/${quizId}/questions`, {
          method: 'PUT',
          body: JSON.stringify({
            reorder: true,
            questionIds: [q2.id, q1.id],
          }),
        }),
        { params: Promise.resolve({ id: quizId.toString() }) },
      );

      expect(reorderRes.status).toBe(200);
      const updatedQuestions = await reorderRes.json();

      expect(updatedQuestions[0].id).toBe(q2.id);
      expect(updatedQuestions[0].order_index).toBe(0);
      expect(updatedQuestions[1].id).toBe(q1.id);
      expect(updatedQuestions[1].order_index).toBe(1);

      // Verify via GET
      const getRes = await GET(new NextRequest(`http://localhost/api/quizzes/${quizId}/questions`), {
        params: Promise.resolve({ id: quizId.toString() }),
      });
      const questions = await getRes.json();
      expect(questions[0].id).toBe(q2.id);
      expect(questions[1].id).toBe(q1.id);
    });
  });
});
