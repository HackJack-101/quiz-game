import {
  createGame,
  createQuestion,
  createQuiz,
  findOrCreateUser,
  getAnswersByQuestionId,
  getPlayerById,
  joinGame,
  replayRound,
  submitAnswer,
} from '@/lib/db-utils';

import db from '../lib/db';

describe('replayRound', () => {
  it('should reset current question and revert scores', () => {
    // Setup
    const user = findOrCreateUser('replay@test.com');
    const quiz = createQuiz(user.id, 'Replay Quiz');
    const q1 = createQuestion(quiz.id, 'Q1', 'true_false', 'true');
    const game = createGame(quiz.id);

    // Start game and move to first question
    db.prepare("UPDATE games SET current_question_index = 0, status = 'question' WHERE id = ?").run(game.id);

    const p1 = joinGame(game.id, 'Player 1');
    const p2 = joinGame(game.id, 'Player 2');

    // Submit answers
    submitAnswer(p1.id, q1.id, 'true', 1000); // 1000 points
    submitAnswer(p2.id, q1.id, 'false', 1000); // 0 points

    let p1After = getPlayerById(p1.id);
    expect(p1After?.score).toBeGreaterThan(0);

    let answers = getAnswersByQuestionId(q1.id, game.id);
    expect(answers.length).toBe(2);

    // Replay round
    const updatedGame = replayRound(game.id);
    expect(updatedGame?.status).toBe('question');
    expect(updatedGame?.current_question_index).toBe(0);

    // Check scores reverted
    p1After = getPlayerById(p1.id);
    expect(p1After?.score).toBe(0);

    // Check answers deleted
    answers = getAnswersByQuestionId(q1.id, game.id);
    expect(answers.length).toBe(0);
  });

  it('should work when game is finished', () => {
    const user = findOrCreateUser('replay_fin@test.com');
    const quiz = createQuiz(user.id, 'Replay Fin Quiz');
    const q1 = createQuestion(quiz.id, 'Q1', 'true_false', 'true');
    const game = createGame(quiz.id);

    // Finish game at last question
    db.prepare("UPDATE games SET current_question_index = 1, status = 'finished' WHERE id = ?").run(game.id);

    const p1 = joinGame(game.id, 'Player 1');
    submitAnswer(p1.id, q1.id, 'true', 1000);

    const updatedGame = replayRound(game.id);
    expect(updatedGame?.status).toBe('question');
    expect(updatedGame?.current_question_index).toBe(0);

    const p1After = getPlayerById(p1.id);
    expect(p1After?.score).toBe(0);
  });
});
