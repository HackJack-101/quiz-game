import {
  createGame,
  createQuestion,
  createQuiz,
  getAnswersByQuestionId,
  getPlayersByGameId,
  joinGame,
  resetGame,
  submitAnswer,
} from '@/lib/db-utils';

import db from '../lib/db';

describe('resetGame', () => {
  beforeEach(() => {
    // Clear the database before each test
    db.prepare('DELETE FROM answers').run();
    db.prepare('DELETE FROM players').run();
    db.prepare('DELETE FROM games').run();
    db.prepare('DELETE FROM questions').run();
    db.prepare('DELETE FROM quizzes').run();
    db.prepare('DELETE FROM users').run();

    // Create a user
    db.prepare("INSERT INTO users (id, email) VALUES (1, 'test@example.com')").run();
  });

  it('should reset the game status, scores and delete answers', () => {
    const quiz = createQuiz(1, 'Test Quiz');
    const question = createQuestion(quiz.id, 'Q1', 'mcq', 'A', ['A', 'B']);
    const game = createGame(quiz.id);
    const player = joinGame(game.id, 'Player 1');

    // Simulate game progress
    db.prepare("UPDATE games SET status = 'active', current_question_index = 0 WHERE id = ?").run(game.id);
    submitAnswer(player.id, question.id, 'A', 1000);

    // Verify initial state
    let players = getPlayersByGameId(game.id);
    expect(players[0].score).toBeGreaterThan(0);
    let answers = getAnswersByQuestionId(question.id, game.id);
    expect(answers.length).toBe(1);

    // Reset game
    const resetResult = resetGame(game.id);
    expect(resetResult).toBeDefined();
    expect(resetResult?.status).toBe('waiting');
    expect(resetResult?.current_question_index).toBe(-1);
    expect(resetResult?.question_started_at).toBeNull();

    // Verify side effects
    players = getPlayersByGameId(game.id);
    expect(players[0].score).toBe(0);

    answers = getAnswersByQuestionId(question.id, game.id);
    expect(answers.length).toBe(0);
  });

  it('should return undefined if game does not exist', () => {
    const result = resetGame(999);
    expect(result).toBeUndefined();
  });
});
