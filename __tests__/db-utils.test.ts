import {
  calculateScore,
  createGame,
  createQuestion,
  createQuiz,
  deleteUser,
  findClosestNumberAnswer,
  findOrCreateUser,
  getGamesByUserId,
  getGameStats,
  getQuestionsByQuizId,
  getQuizzesByUserId,
  joinGame,
  reorderQuestions,
  submitAnswer,
} from '@/lib/db-utils';

import db from '../lib/db';

describe('db-utils', () => {
  describe('calculateScore', () => {
    const question = {
      id: 1,
      quiz_id: 1,
      question_text: 'Is the sky blue?',
      question_type: 'true_false' as const,
      correct_answer: 'true',
      options: null,
      order_index: 0,
      created_at: '',
    };

    it('should award 1000 points for immediate correct answer', () => {
      const result = calculateScore(question, 'true', 0, 10000);
      expect(result.isCorrect).toBe(true);
      expect(result.points).toBe(1000);
    });

    it('should award 750 points for answer at half time', () => {
      const result = calculateScore(question, 'true', 5000, 10000);
      expect(result.isCorrect).toBe(true);
      expect(result.points).toBe(750);
    });

    it('should award 500 points for answer at the very end', () => {
      const result = calculateScore(question, 'true', 10000, 10000);
      expect(result.isCorrect).toBe(true);
      expect(result.points).toBe(500);
    });

    it('should award 0 points for incorrect answer', () => {
      const result = calculateScore(question, 'false', 1000, 10000);
      expect(result.isCorrect).toBe(false);
      expect(result.points).toBe(0);
    });

    it('should handle mcq answers case and accent insensitively', () => {
      const mcqQuestion = { ...question, question_type: 'mcq' as const, correct_answer: 'Montréal' };
      expect(calculateScore(mcqQuestion, '  montreal  ', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(mcqQuestion, 'Montréal', 0, 10000).isCorrect).toBe(true);
    });

    it('should handle number questions exactly', () => {
      const numQuestion = { ...question, question_type: 'number' as const, correct_answer: '42' };
      expect(calculateScore(numQuestion, '42', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(numQuestion, '42.0', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(numQuestion, '43', 0, 10000).isCorrect).toBe(false);
    });

    it('should handle free text questions case and accent insensitively', () => {
      const textQuestion = { ...question, question_type: 'free_text' as const, correct_answer: 'ÖpenAÏ' };
      expect(calculateScore(textQuestion, 'openai', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(textQuestion, 'OPENAI', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(textQuestion, 'ÖpenAÏ', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(textQuestion, 'Open AI', 0, 10000).isCorrect).toBe(false);
    });

    it('should handle multiple_mcq questions', () => {
      const multipleMcqQuestion = {
        ...question,
        question_type: 'multiple_mcq' as const,
        correct_answer: JSON.stringify(['A', 'C']),
      };
      expect(calculateScore(multipleMcqQuestion, JSON.stringify(['A', 'C']), 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(multipleMcqQuestion, JSON.stringify(['C', 'A']), 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(multipleMcqQuestion, JSON.stringify(['a', 'c']), 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(multipleMcqQuestion, JSON.stringify(['A']), 0, 10000).isCorrect).toBe(false);
      expect(calculateScore(multipleMcqQuestion, JSON.stringify(['A', 'B', 'C']), 0, 10000).isCorrect).toBe(false);
      expect(calculateScore(multipleMcqQuestion, 'not-json', 0, 10000).isCorrect).toBe(false);
    });

    it('should handle translated true/false answers robustly', () => {
      const trueQuestion = { ...question, question_type: 'true_false' as const, correct_answer: 'true' };
      expect(calculateScore(trueQuestion, 'true', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(trueQuestion, 'True', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(trueQuestion, 'Vrai', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(trueQuestion, '1', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(trueQuestion, 'false', 0, 10000).isCorrect).toBe(false);

      const falseQuestion = { ...question, question_type: 'true_false' as const, correct_answer: 'false' };
      expect(calculateScore(falseQuestion, 'false', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(falseQuestion, 'False', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(falseQuestion, 'Faux', 0, 10000).isCorrect).toBe(true);
      expect(calculateScore(falseQuestion, 'true', 0, 10000).isCorrect).toBe(false);
    });
  });

  describe('Database operations', () => {
    it('should create and find a user', () => {
      const email = 'test@example.com';
      const user = findOrCreateUser(email);
      expect(user.email).toBe(email);

      const sameUser = findOrCreateUser(' TEST@example.com ');
      expect(sameUser.id).toBe(user.id);
    });

    it('should manage quiz lifecycle', () => {
      const user = findOrCreateUser('quizmaster@test.com');
      const quiz = createQuiz(user.id, 'Test Quiz', 'A test quiz', 15);

      expect(quiz.title).toBe('Test Quiz');
      expect(quiz.time_limit).toBe(15);

      const question = createQuestion(quiz.id, 'What is 2+2?', 'number', '4');
      expect(question.quiz_id).toBe(quiz.id);
      expect(question.question_text).toBe('What is 2+2?');
    });

    it('should find closest number answer', () => {
      const user = findOrCreateUser('gm@test.com');
      const quiz = createQuiz(user.id, 'Math Quiz');
      const question = createQuestion(quiz.id, 'How many stars?', 'number', '100');
      const game = createGame(quiz.id);

      const p1 = joinGame(game.id, 'Player 1');
      const p2 = joinGame(game.id, 'Player 2');
      const p3 = joinGame(game.id, 'Player 3');

      submitAnswer(p1.id, question.id, '90', 1000);
      submitAnswer(p2.id, question.id, '110', 1000);
      submitAnswer(p3.id, question.id, '101', 1000);

      const closest = findClosestNumberAnswer(question.id);
      expect(closest?.playerId).toBe(p3.id);
      expect(closest?.difference).toBe(1);
    });

    it('should reorder questions', () => {
      const user = findOrCreateUser('reorder@test.com');
      const quiz = createQuiz(user.id, 'Reorder Quiz', undefined, 10);
      const q1 = createQuestion(quiz.id, 'Q1', 'true_false', 'true');
      const q2 = createQuestion(quiz.id, 'Q2', 'true_false', 'true');

      expect(q1.order_index).toBe(0);
      expect(q2.order_index).toBe(1);

      reorderQuestions(quiz.id, [q2.id, q1.id]);

      const questions = getQuestionsByQuizId(quiz.id);
      expect(questions[0].id).toBe(q2.id);
      expect(questions[0].order_index).toBe(0);
      expect(questions[1].id).toBe(q1.id);
      expect(questions[1].order_index).toBe(1);
    });

    it('should calculate game statistics correctly', () => {
      const user = findOrCreateUser('stats@test.com');
      const quiz = createQuiz(user.id, 'Stats Quiz');
      const q1 = createQuestion(quiz.id, 'Q1', 'true_false', 'true');
      const q2 = createQuestion(quiz.id, 'Q2', 'true_false', 'true');
      const game = createGame(quiz.id);

      const p1 = joinGame(game.id, 'P1');
      const p2 = joinGame(game.id, 'P2');

      // P1: correct on Q1, incorrect on Q2
      submitAnswer(p1.id, q1.id, 'true', 2000);
      submitAnswer(p1.id, q2.id, 'false', 1000);

      // P2: correct on both
      submitAnswer(p2.id, q1.id, 'true', 4000);
      submitAnswer(p2.id, q2.id, 'true', 2000);

      const stats = getGameStats(game.id);

      expect(stats).toBeDefined();
      expect(stats?.totalPlayers).toBe(2);
      expect(stats?.questionStats.length).toBe(2);

      // Q1 stats
      const q1Stats = stats?.questionStats.find((s) => s.questionId === q1.id);
      expect(q1Stats?.correctAnswers).toBe(2);
      expect(q1Stats?.totalAnswers).toBe(2);
      expect(q1Stats?.averageResponseTime).toBe(3000); // (2000 + 4000) / 2

      // Q2 stats
      const q2Stats = stats?.questionStats.find((s) => s.questionId === q2.id);
      expect(q2Stats?.correctAnswers).toBe(1);
      expect(q2Stats?.totalAnswers).toBe(2);

      expect(stats?.mostDifficultQuestion).toBe('Q2');
      expect(stats?.easiestQuestion).toBe('Q1');
    });

    it('should fetch game history for a user', () => {
      const user = findOrCreateUser('history@test.com');
      const quiz1 = createQuiz(user.id, 'Quiz 1');
      const quiz2 = createQuiz(user.id, 'Quiz 2');

      const game1 = createGame(quiz1.id);
      const game2 = createGame(quiz2.id);

      joinGame(game1.id, 'P1');
      joinGame(game1.id, 'P2');

      const games = getGamesByUserId(user.id);

      expect(games.length).toBeGreaterThanOrEqual(2);
      const g1 = games.find((g) => g.id === game1.id);
      const g2 = games.find((g) => g.id === game2.id);

      expect(g1).toBeDefined();
      expect(g1?.quiz_title).toBe('Quiz 1');
      expect(g1?.player_count).toBe(2);

      expect(g2).toBeDefined();
      expect(g2?.quiz_title).toBe('Quiz 2');
      expect(g2?.player_count).toBe(0);
    });

    it('should delete a user and their quizzes (cascade)', () => {
      const user = findOrCreateUser('delete-me@test.com');
      createQuiz(user.id, 'Quiz to delete');
      createQuiz(user.id, 'Another quiz to delete');

      const quizzesBefore = getQuizzesByUserId(user.id);
      expect(quizzesBefore.length).toBe(2);

      const deleted = deleteUser(user.id);
      expect(deleted).toBe(true);

      const quizzesAfter = getQuizzesByUserId(user.id);
      expect(quizzesAfter.length).toBe(0);

      // Verify user is gone
      const userCheck = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      expect(userCheck).toBeUndefined();
    });
  });
});
