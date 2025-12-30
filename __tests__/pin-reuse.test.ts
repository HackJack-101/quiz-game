import { createGame, finishGame, updateGameStatus } from '@/lib/db-utils';

import db from '../lib/db';

describe('PIN Reuse', () => {
  beforeEach(() => {
    // Clear games table before each test
    db.prepare('DELETE FROM games').run();
    db.prepare('DELETE FROM quizzes').run();
    db.prepare('DELETE FROM users').run();

    // Create a user and a quiz for testing
    db.prepare("INSERT INTO users (email) VALUES ('test@example.com')").run();
    const user = db.prepare("SELECT id FROM users WHERE email = 'test@example.com'").get() as { id: number };
    db.prepare("INSERT INTO quizzes (user_id, title) VALUES (?, 'Test Quiz')").run(user.id);
  });

  it('should allow reusing a PIN if the previous game is finished', () => {
    const quiz = db.prepare('SELECT id FROM quizzes LIMIT 1').get() as { id: number };

    // Create a game
    const game1 = createGame(quiz.id);
    const pin = game1.pin_code;

    // Finish the game
    finishGame(game1.id);

    // Now it should NOT throw because pin_code of game1 should be NULL
    expect(() => {
      db.prepare('INSERT INTO games (quiz_id, pin_code) VALUES (?, ?)').run(quiz.id, pin);
    }).not.toThrow();
  });

  it('should generate a new PIN when resuming a finished game', () => {
    const quiz = db.prepare('SELECT id FROM quizzes LIMIT 1').get() as { id: number };

    // Create a game
    const game = createGame(quiz.id);
    const oldPin = game.pin_code;

    // Finish the game
    finishGame(game.id);

    const finishedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(game.id) as { pin_code: string | null };
    expect(finishedGame.pin_code).toBeNull();

    // Resume the game
    const resumedGame = updateGameStatus(game.id, 'waiting');

    expect(resumedGame?.status).toBe('waiting');
    expect(resumedGame?.pin_code).not.toBeNull();
    expect(resumedGame?.pin_code).not.toBe(oldPin);
  });
});
