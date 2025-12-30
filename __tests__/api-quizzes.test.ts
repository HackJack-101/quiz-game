/** @jest-environment node */
import Database from 'better-sqlite3';
import { NextRequest } from 'next/server';

import { GET, POST } from '@/app/api/quizzes/route';
import { findOrCreateUser } from '@/lib/db-utils';

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
  `);
  return {
    __esModule: true,
    default: db,
  };
});

describe('/api/quizzes', () => {
  let userId: number;

  beforeAll(() => {
    const user = findOrCreateUser('api-test@example.com');
    userId = user.id;
  });

  describe('GET', () => {
    it('should return 400 if userId is missing', async () => {
      const req = new NextRequest('http://localhost/api/quizzes');
      const res = await GET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('userId parameter is required');
    });

    it('should return quizzes for a user', async () => {
      const req = new NextRequest(`http://localhost/api/quizzes?userId=${userId}`);
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST', () => {
    it('should create a new quiz', async () => {
      const body = {
        userId: userId.toString(),
        title: 'New Quiz',
        description: 'Test description',
        timeLimit: '20',
      };
      const req = new NextRequest('http://localhost/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.title).toBe('New Quiz');
      expect(data.time_limit).toBe(20);
    });

    it('should return 400 if title is missing', async () => {
      const body = { userId: userId.toString() };
      const req = new NextRequest('http://localhost/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
