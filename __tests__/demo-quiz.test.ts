/** @jest-environment node */
import Database from 'better-sqlite3';

import db from '@/lib/db';
import { createDemoQuiz } from '@/lib/demo-quiz';

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

describe('createDemoQuiz', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM quizzes').run();
    db.prepare('DELETE FROM questions').run();
  });

  it('should create a demo quiz with 5 questions for English locale', async () => {
    const userResult = db.prepare("INSERT INTO users (email) VALUES ('test@example.com')").run();
    const userId = userResult.lastInsertRowid as number;

    const quiz = await createDemoQuiz(userId, 'en');

    expect(quiz).toBeDefined();
    expect(quiz.user_id).toBe(userId);
    expect(quiz.title).toContain('Demo Quiz');

    const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(quiz.id) as {
      question_type: string;
    }[];
    expect(questions.length).toBe(5);

    const types = questions.map((q) => q.question_type);
    expect(types).toContain('true_false');
    expect(types).toContain('mcq');
    expect(types).toContain('multiple_mcq');
    expect(types).toContain('number');
    expect(types).toContain('free_text');
  });

  it('should create a demo quiz for French locale', async () => {
    const userResult = db.prepare("INSERT INTO users (email) VALUES ('test-fr@example.com')").run();
    const userId = userResult.lastInsertRowid as number;

    const quiz = await createDemoQuiz(userId, 'fr');

    expect(quiz).toBeDefined();
    expect(quiz.title).toContain('Quiz de Démo');

    const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(quiz.id);
    expect(questions.length).toBe(5);
  });
});
