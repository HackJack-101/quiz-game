import {
  createGame,
  createQuestion,
  createQuiz,
  findOrCreateUser,
  getGlobalStats,
  joinGame,
  submitAnswer,
} from '@/lib/db-utils';

import db from '../lib/db';

describe('Global Statistics', () => {
  beforeEach(() => {
    // Clean up database before each test
    db.prepare('DELETE FROM answers').run();
    db.prepare('DELETE FROM players').run();
    db.prepare('DELETE FROM games').run();
    db.prepare('DELETE FROM questions').run();
    db.prepare('DELETE FROM quizzes').run();
    db.prepare('DELETE FROM users').run();
  });

  it('should return zeros when database is empty', () => {
    const stats = getGlobalStats();
    expect(stats.totalQuizzes).toBe(0);
    expect(stats.totalGames).toBe(0);
    expect(stats.totalPlayers).toBe(0);
    expect(stats.totalAnswers).toBe(0);
    expect(stats.totalCorrectAnswers).toBe(0);
    expect(stats.totalQuestions).toBe(0);
    expect(stats.totalUsers).toBe(0);
    expect(stats.topQuizzes).toHaveLength(0);
  });

  it('should correctly calculate global statistics', () => {
    const user1 = findOrCreateUser('user1@test.com');
    const user2 = findOrCreateUser('user2@test.com');

    const quiz1 = createQuiz(user1.id, 'Quiz 1');
    const quiz2 = createQuiz(user2.id, 'Quiz 2');

    const q1 = createQuestion(quiz1.id, 'Q1', 'true_false', 'true');
    const q2 = createQuestion(quiz1.id, 'Q2', 'true_false', 'true');
    createQuestion(quiz2.id, 'Q3', 'true_false', 'true');
    const game1 = createGame(quiz1.id);
    const game2 = createGame(quiz1.id);
    createGame(quiz2.id);
    const p1 = joinGame(game1.id, 'P1');
    const p2 = joinGame(game1.id, 'P2');
    joinGame(game2.id, 'P3');
    submitAnswer(p1.id, q1.id, 'true', 1000); // Correct
    submitAnswer(p1.id, q2.id, 'false', 1000); // Incorrect
    submitAnswer(p2.id, q1.id, 'true', 1000); // Correct

    const stats = getGlobalStats();

    expect(stats.totalUsers).toBe(2);
    expect(stats.totalQuizzes).toBe(2);
    expect(stats.totalQuestions).toBe(3);
    expect(stats.totalGames).toBe(3);
    expect(stats.totalPlayers).toBe(3);
    expect(stats.totalAnswers).toBe(3);
    expect(stats.totalCorrectAnswers).toBe(2);

    expect(stats.topQuizzes).toHaveLength(2);
    expect(stats.topQuizzes[0].title).toBe('Quiz 1');
    expect(stats.topQuizzes[0].play_count).toBe(2);
    expect(stats.topQuizzes[1].title).toBe('Quiz 2');
    expect(stats.topQuizzes[1].play_count).toBe(1);
  });
});
