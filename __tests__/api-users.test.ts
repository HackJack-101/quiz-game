/** @jest-environment node */
import Database from 'better-sqlite3';
import { NextRequest } from 'next/server';

import { DELETE, GET, POST } from '@/app/api/users/route';

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

describe('/api/users', () => {
  const email = 'test-api@example.com';

  describe('POST', () => {
    it('should create a new user', async () => {
      const req = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.email).toBe(email);
      expect(data.id).toBeDefined();
    });

    it('should create a new user and a demo quiz when locale is provided', async () => {
      const newUserEmail = 'new-user-with-demo@example.com';
      const req = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ email: newUserEmail, locale: 'en' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.email).toBe(newUserEmail);

      // Check if a quiz was created for this user
      const db = (await import('../lib/db')).default;
      const quiz = db.prepare('SELECT * FROM quizzes WHERE user_id = ?').get(data.id) as {
        id: number;
        title: string;
      };
      expect(quiz).toBeDefined();
      expect(quiz.title).toContain('Demo Quiz');

      // Check if questions were created
      const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(quiz.id);
      expect(questions.length).toBe(5);
    });
  });

  describe('GET', () => {
    it('should get a user by email', async () => {
      const req = new NextRequest(`http://localhost/api/users?email=${email}`);
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.email).toBe(email);
    });

    it('should return 404 for non-existent user', async () => {
      const req = new NextRequest('http://localhost/api/users?email=nonexistent@test.com');
      const res = await GET(req);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE', () => {
    it('should delete a user by id', async () => {
      // First get the user id
      const getReq = new NextRequest(`http://localhost/api/users?email=${email}`);
      const getRes = await GET(getReq);
      const user = await getRes.json();

      const delReq = new NextRequest(`http://localhost/api/users?id=${user.id}`, {
        method: 'DELETE',
      });
      const delRes = await DELETE(delReq);
      expect(delRes.status).toBe(200);
      const delData = await delRes.json();
      expect(delData.success).toBe(true);

      // Verify user is gone
      const checkRes = await GET(getReq);
      expect(checkRes.status).toBe(404);
    });

    it('should return 400 if id is missing', async () => {
      const req = new NextRequest('http://localhost/api/users', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent user id', async () => {
      const req = new NextRequest('http://localhost/api/users?id=9999', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      expect(res.status).toBe(404);
    });
  });
});
