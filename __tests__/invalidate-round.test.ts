import {
  createGame,
  createQuestion,
  createQuiz,
  getAnswersByQuestionId,
  getPlayersByGameId,
  invalidateRound,
  joinGame,
  submitAnswer,
} from '@/lib/db-utils';

import db from '../lib/db';

describe('invalidateRound', () => {
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

  it('should cancel scores and move to next question', () => {
    const quiz = createQuiz(1, 'Test Quiz');
    const question1 = createQuestion(quiz.id, 'Q1', 'mcq', 'A', ['A', 'B']);
    // Create second question to test moving to next question
    createQuestion(quiz.id, 'Q2', 'mcq', 'B', ['A', 'B']);
    const game = createGame(quiz.id);
    const player = joinGame(game.id, 'Player 1');

    // Simulate game progress - on first question
    db.prepare("UPDATE games SET status = 'question', current_question_index = 0 WHERE id = ?").run(game.id);
    submitAnswer(player.id, question1.id, 'A', 1000);

    // Verify initial state
    let players = getPlayersByGameId(game.id);
    const initialScore = players[0].score;
    expect(initialScore).toBeGreaterThan(0);
    let answers = getAnswersByQuestionId(question1.id);
    expect(answers.length).toBe(1);

    // Invalidate round
    const result = invalidateRound(game.id);
    expect(result).toBeDefined();
    expect(result?.finished).toBe(false);
    expect(result?.game.status).toBe('question');
    expect(result?.game.current_question_index).toBe(1);

    // Verify scores were reverted
    players = getPlayersByGameId(game.id);
    expect(players[0].score).toBe(0);

    // Verify answers were deleted
    answers = getAnswersByQuestionId(question1.id);
    expect(answers.length).toBe(0);
  });

  it('should finish the game when invalidating the last question', () => {
    const quiz = createQuiz(1, 'Test Quiz');
    const question = createQuestion(quiz.id, 'Q1', 'mcq', 'A', ['A', 'B']);
    const game = createGame(quiz.id);
    const player = joinGame(game.id, 'Player 1');

    // Simulate game progress - on last (only) question
    db.prepare("UPDATE games SET status = 'question', current_question_index = 0 WHERE id = ?").run(game.id);
    submitAnswer(player.id, question.id, 'A', 1000);

    // Verify initial state
    let players = getPlayersByGameId(game.id);
    expect(players[0].score).toBeGreaterThan(0);

    // Invalidate round
    const result = invalidateRound(game.id);
    expect(result).toBeDefined();
    expect(result?.finished).toBe(true);
    expect(result?.game.status).toBe('finished');

    // Verify scores were reverted
    players = getPlayersByGameId(game.id);
    expect(players[0].score).toBe(0);

    // Verify answers were deleted
    const answers = getAnswersByQuestionId(question.id);
    expect(answers.length).toBe(0);
  });

  it('should return undefined if game does not exist', () => {
    const result = invalidateRound(999);
    expect(result).toBeUndefined();
  });

  it('should return undefined if no question has been started', () => {
    const quiz = createQuiz(1, 'Test Quiz');
    createQuestion(quiz.id, 'Q1', 'mcq', 'A', ['A', 'B']);
    const game = createGame(quiz.id);

    // Game is in waiting state with current_question_index = -1
    const result = invalidateRound(game.id);
    expect(result).toBeUndefined();
  });

  it('should handle multiple players correctly', () => {
    const quiz = createQuiz(1, 'Test Quiz');
    const question1 = createQuestion(quiz.id, 'Q1', 'mcq', 'A', ['A', 'B']);
    // Create second question to test moving to next question
    createQuestion(quiz.id, 'Q2', 'mcq', 'B', ['A', 'B']);
    const game = createGame(quiz.id);
    const player1 = joinGame(game.id, 'Player 1');
    const player2 = joinGame(game.id, 'Player 2');

    // Simulate game progress
    db.prepare("UPDATE games SET status = 'question', current_question_index = 0 WHERE id = ?").run(game.id);
    submitAnswer(player1.id, question1.id, 'A', 1000);
    submitAnswer(player2.id, question1.id, 'A', 2000);

    // Verify initial state
    let players = getPlayersByGameId(game.id);
    expect(players.every((p) => p.score > 0)).toBe(true);
    let answers = getAnswersByQuestionId(question1.id);
    expect(answers.length).toBe(2);

    // Invalidate round
    const result = invalidateRound(game.id);
    expect(result).toBeDefined();
    expect(result?.game.current_question_index).toBe(1);

    // Verify all scores were reverted
    players = getPlayersByGameId(game.id);
    expect(players.every((p) => p.score === 0)).toBe(true);

    // Verify all answers were deleted
    answers = getAnswersByQuestionId(question1.id);
    expect(answers.length).toBe(0);
  });
});
