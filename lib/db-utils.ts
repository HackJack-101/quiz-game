import db, { Answer, Game, GameStats, GlobalStats, Player, Question, Quiz, User } from './db';

// ============ USER FUNCTIONS ============

export function findOrCreateUser(email: string): User {
  const normalizedEmail = email.toLowerCase().trim();

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as User | undefined;

  if (!user) {
    const result = db.prepare('INSERT INTO users (email) VALUES (?)').run(normalizedEmail);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
  }

  return user;
}

export function getUserByEmail(email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as User | undefined;
}

export function deleteUser(userId: number): boolean {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return result.changes > 0;
}

// ============ QUIZ FUNCTIONS ============

export function createQuiz(userId: number, title: string, description?: string, timeLimit: number = 10): Quiz {
  const result = db
    .prepare('INSERT INTO quizzes (user_id, title, description, time_limit) VALUES (?, ?, ?, ?)')
    .run(userId, title, description || null, timeLimit);

  return db.prepare('SELECT * FROM quizzes WHERE id = ?').get(result.lastInsertRowid) as Quiz;
}

export function updateQuiz(quizId: number, title: string, description?: string, timeLimit?: number): Quiz | undefined {
  const updates: string[] = ['title = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const values: (string | number | null)[] = [title];

  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description || null);
  }

  if (timeLimit !== undefined) {
    updates.push('time_limit = ?');
    values.push(timeLimit);
  }

  values.push(quizId);

  db.prepare(`UPDATE quizzes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId) as Quiz | undefined;
}

export function getQuizById(quizId: number): Quiz | undefined {
  return db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId) as Quiz | undefined;
}

export function getQuizzesByUserId(userId: number): Quiz[] {
  return db.prepare('SELECT * FROM quizzes WHERE user_id = ? ORDER BY updated_at DESC').all(userId) as Quiz[];
}

export function deleteQuiz(quizId: number): boolean {
  const result = db.prepare('DELETE FROM quizzes WHERE id = ?').run(quizId);
  return result.changes > 0;
}

// ============ QUESTION FUNCTIONS ============

export function createQuestion(
  quizId: number,
  questionText: string,
  questionType: Question['question_type'],
  correctAnswer: string,
  options?: string[],
  orderIndex?: number,
): Question {
  // Get the next order index if not provided
  if (orderIndex === undefined) {
    const maxOrder = db
      .prepare('SELECT MAX(order_index) as max_order FROM questions WHERE quiz_id = ?')
      .get(quizId) as { max_order: number | null };
    orderIndex = (maxOrder.max_order ?? -1) + 1;
  }

  const optionsJson = options ? JSON.stringify(options) : null;

  const result = db
    .prepare(
      'INSERT INTO questions (quiz_id, question_text, question_type, correct_answer, options, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(quizId, questionText, questionType, correctAnswer, optionsJson, orderIndex);

  return db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid) as Question;
}

export function updateQuestion(
  questionId: number,
  questionText: string,
  questionType: Question['question_type'],
  correctAnswer: string,
  options?: string[],
): Question | undefined {
  const optionsJson = options ? JSON.stringify(options) : null;

  db.prepare(
    'UPDATE questions SET question_text = ?, question_type = ?, correct_answer = ?, options = ? WHERE id = ?',
  ).run(questionText, questionType, correctAnswer, optionsJson, questionId);

  return db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as Question | undefined;
}

export function getQuestionsByQuizId(quizId: number): Question[] {
  return db.prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index').all(quizId) as Question[];
}

export function deleteQuestion(questionId: number): boolean {
  const result = db.prepare('DELETE FROM questions WHERE id = ?').run(questionId);
  return result.changes > 0;
}

export function reorderQuestions(quizId: number, questionIds: number[]): void {
  const updateStmt = db.prepare('UPDATE questions SET order_index = ? WHERE id = ? AND quiz_id = ?');

  const transaction = db.transaction(() => {
    questionIds.forEach((id, index) => {
      updateStmt.run(index, id, quizId);
    });
  });

  transaction();
}

// ============ GAME FUNCTIONS ============

function generatePinCode(): string {
  // Generate a 6-digit pin code
  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  // Check if pin already exists
  const existing = db.prepare('SELECT id FROM games WHERE pin_code = ?').get(pin);

  if (existing) {
    return generatePinCode(); // Recursively generate a new one
  }

  return pin;
}

export function createGame(quizId: number): Game {
  const pinCode = generatePinCode();

  const result = db.prepare('INSERT INTO games (quiz_id, pin_code) VALUES (?, ?)').run(quizId, pinCode);

  return db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid) as Game;
}

export function getGameByPinCode(pinCode: string): Game | undefined {
  return db.prepare('SELECT * FROM games WHERE pin_code = ?').get(pinCode) as Game | undefined;
}

export function getGameById(gameId: number): Game | undefined {
  return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as Game | undefined;
}

export function updateGameStatus(gameId: number, status: Game['status']): Game | undefined {
  if (status === 'finished') {
    db.prepare('UPDATE games SET status = ?, pin_code = NULL WHERE id = ?').run(status, gameId);
  } else {
    // Check if we are resuming a finished game that had its PIN cleared
    const game = getGameById(gameId);
    if (game && game.status === 'finished' && !game.pin_code) {
      const pinCode = generatePinCode();
      db.prepare('UPDATE games SET status = ?, pin_code = ? WHERE id = ?').run(status, pinCode, gameId);
    } else {
      db.prepare('UPDATE games SET status = ? WHERE id = ?').run(status, gameId);
    }
  }
  return getGameById(gameId);
}

export function startNextQuestion(gameId: number): Game | undefined {
  const game = getGameById(gameId);
  if (!game) return undefined;

  const newIndex = game.current_question_index + 1;

  db.prepare(
    "UPDATE games SET current_question_index = ?, question_started_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), status = 'question' WHERE id = ?",
  ).run(newIndex, gameId);

  return getGameById(gameId);
}

export function finishGame(gameId: number): Game | undefined {
  return updateGameStatus(gameId, 'finished');
}

export function resetGame(gameId: number): Game | undefined {
  const game = getGameById(gameId);
  if (!game) return undefined;

  const transaction = db.transaction(() => {
    // Reset player scores for this game
    db.prepare('UPDATE players SET score = 0 WHERE game_id = ?').run(gameId);

    // Delete all answers for players in this game
    db.prepare(
      `
      DELETE FROM answers 
      WHERE player_id IN (
        SELECT id FROM players WHERE game_id = ?
      )
    `,
    ).run(gameId);

    // Reset game status and progress
    db.prepare(
      "UPDATE games SET status = 'waiting', current_question_index = -1, question_started_at = NULL WHERE id = ?",
    ).run(gameId);
  });

  transaction();

  return getGameById(gameId);
}

export function replayRound(gameId: number): Game | undefined {
  const game = getGameById(gameId);
  if (!game || game.current_question_index < 0) return undefined;

  const questions = getQuestionsByQuizId(game.quiz_id);
  let indexToReplay = game.current_question_index;

  if (indexToReplay >= questions.length) {
    indexToReplay = questions.length - 1;
  }

  const currentQuestion = questions[indexToReplay];

  // Find all answers for this question for players in this game
  const answers = db
    .prepare(
      `
    SELECT a.* FROM answers a
    JOIN players p ON a.player_id = p.id
    WHERE p.game_id = ? AND a.question_id = ?
  `,
    )
    .all(gameId, currentQuestion.id) as Answer[];

  const transaction = db.transaction(() => {
    // Revert player scores
    for (const answer of answers) {
      if (answer.points_earned > 0) {
        db.prepare('UPDATE players SET score = score - ? WHERE id = ?').run(answer.points_earned, answer.player_id);
      }
    }

    // Delete answers
    db.prepare(
      `
      DELETE FROM answers 
      WHERE id IN (
        SELECT a.id FROM answers a
        JOIN players p ON a.player_id = p.id
        WHERE p.game_id = ? AND a.question_id = ?
      )
    `,
    ).run(gameId, currentQuestion.id);

    // Reset game state for this question
    db.prepare(
      "UPDATE games SET current_question_index = ?, question_started_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), status = 'question' WHERE id = ?",
    ).run(indexToReplay, gameId);
  });

  transaction();

  return getGameById(gameId);
}

export function getActiveGamesByQuizId(quizId: number): Game[] {
  return db
    .prepare("SELECT * FROM games WHERE quiz_id = ? AND status != 'finished' ORDER BY created_at DESC")
    .all(quizId) as Game[];
}

export function getGamesByUserId(userId: number): (Game & { quiz_title: string; player_count: number })[] {
  return db
    .prepare(
      `
      SELECT g.*, q.title as quiz_title, (SELECT COUNT(*) FROM players WHERE game_id = g.id) as player_count
      FROM games g
      JOIN quizzes q ON g.quiz_id = q.id
      WHERE q.user_id = ?
      ORDER BY g.created_at DESC
    `,
    )
    .all(userId) as (Game & { quiz_title: string; player_count: number })[];
}

// ============ PLAYER FUNCTIONS ============

export function joinGame(gameId: number, playerName: string): Player {
  const result = db.prepare('INSERT INTO players (game_id, name) VALUES (?, ?)').run(gameId, playerName.trim());

  return db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid) as Player;
}

export function getPlayerById(playerId: number): Player | undefined {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(playerId) as Player | undefined;
}

export function getPlayersByGameId(gameId: number): Player[] {
  return db.prepare('SELECT * FROM players WHERE game_id = ? ORDER BY score DESC, joined_at').all(gameId) as Player[];
}

export function updatePlayerScore(playerId: number, additionalPoints: number): Player | undefined {
  db.prepare('UPDATE players SET score = score + ? WHERE id = ?').run(additionalPoints, playerId);
  return getPlayerById(playerId);
}

export function awardNumberBonus(questionId: number): void {
  const question = getQuestionById(questionId);
  if (!question || question.question_type !== 'number') return;

  const closest = findClosestNumberAnswer(questionId);
  if (closest && closest.difference > 0) {
    // Check if bonus already awarded (points_earned > 0 for this answer)
    const currentAnswer = db
      .prepare('SELECT points_earned FROM answers WHERE player_id = ? AND question_id = ?')
      .get(closest.playerId, questionId) as { points_earned: number } | undefined;

    if (currentAnswer && currentAnswer.points_earned === 0) {
      const bonusPoints = Math.round(500 * (1 - closest.difference / 1000));
      const pointsToAward = Math.max(100, bonusPoints);
      updatePlayerScore(closest.playerId, pointsToAward);

      // Update answer with points and mark as correct since they won the round
      db.prepare('UPDATE answers SET points_earned = ?, is_correct = 1 WHERE player_id = ? AND question_id = ?').run(
        pointsToAward,
        closest.playerId,
        questionId,
      );
    }
  }
}

export function getQuestionById(id: number): Question | undefined {
  return db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as Question | undefined;
}

// ============ ANSWER FUNCTIONS ============

export function submitAnswer(playerId: number, questionId: number, answer: string, responseTimeMs: number): Answer {
  // Get the question to check the answer
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as Question;

  // Get the quiz time limit
  const quiz = db
    .prepare('SELECT q.* FROM quizzes q JOIN questions qu ON q.id = qu.quiz_id WHERE qu.id = ?')
    .get(questionId) as Quiz;

  const { isCorrect, points } = calculateScore(question, answer, responseTimeMs, quiz.time_limit * 1000);

  const result = db
    .prepare(
      'INSERT INTO answers (player_id, question_id, answer, is_correct, response_time_ms, points_earned) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(playerId, questionId, answer, isCorrect ? 1 : 0, responseTimeMs, points);

  // Update player score
  if (points > 0) {
    updatePlayerScore(playerId, points);
  }

  return db.prepare('SELECT * FROM answers WHERE id = ?').get(result.lastInsertRowid) as Answer;
}

export function getAnswersByQuestionId(questionId: number): Answer[] {
  return db.prepare('SELECT * FROM answers WHERE question_id = ?').all(questionId) as Answer[];
}

export function getAnswersByPlayerId(playerId: number): Answer[] {
  return db.prepare('SELECT * FROM answers WHERE player_id = ?').all(playerId) as Answer[];
}

export function hasPlayerAnswered(playerId: number, questionId: number): boolean {
  const answer = db.prepare('SELECT id FROM answers WHERE player_id = ? AND question_id = ?').get(playerId, questionId);
  return !!answer;
}

// ============ SCORING FUNCTIONS ============

function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function calculateScore(
  question: Question,
  answer: string,
  responseTimeMs: number,
  timeLimitMs: number,
): { isCorrect: boolean; points: number } {
  let isCorrect = false;

  switch (question.question_type) {
    case 'true_false':
    case 'mcq':
      isCorrect = normalizeString(answer) === normalizeString(question.correct_answer);
      break;

    case 'number':
      // For number questions, exact match wins
      const playerNum = parseFloat(answer);
      const correctNum = parseFloat(question.correct_answer);
      isCorrect = !isNaN(playerNum) && playerNum === correctNum;
      break;

    case 'free_text':
      // Case-insensitive exact match for free text, ignoring accents
      isCorrect = normalizeString(answer) === normalizeString(question.correct_answer);
      break;

    case 'multiple_mcq':
      try {
        const playerAnswers = JSON.parse(answer) as string[];
        const correctAnswers = JSON.parse(question.correct_answer) as string[];

        if (!Array.isArray(playerAnswers) || !Array.isArray(correctAnswers)) {
          isCorrect = false;
        } else {
          const normalizedPlayerAnswers = playerAnswers.map(normalizeString).sort();
          const normalizedCorrectAnswers = correctAnswers.map(normalizeString).sort();

          isCorrect =
            normalizedPlayerAnswers.length === normalizedCorrectAnswers.length &&
            normalizedPlayerAnswers.every((val, index) => val === normalizedCorrectAnswers[index]);
        }
      } catch (e) {
        console.error('Error parsing multiple_mcq answer:', e);
        isCorrect = false;
      }
      break;
  }

  if (!isCorrect) {
    return { isCorrect: false, points: 0 };
  }

  // Calculate points based on speed (max 1000 points)
  // Faster responses get more points
  const timeRatio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  const points = Math.round(500 + 500 * timeRatio); // 500-1000 points based on speed

  return { isCorrect: true, points };
}

// For number questions, find the closest answer
export function findClosestNumberAnswer(
  questionId: number,
): { playerId: number; answer: string; difference: number } | null {
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as Question;

  if (question.question_type !== 'number') {
    return null;
  }

  const correctNum = parseFloat(question.correct_answer);
  const answers = getAnswersByQuestionId(questionId);

  if (answers.length === 0) {
    return null;
  }

  let closest: { playerId: number; answer: string; difference: number } | null = null;

  for (const ans of answers) {
    const playerNum = parseFloat(ans.answer);
    if (isNaN(playerNum)) continue;

    const diff = Math.abs(playerNum - correctNum);

    if (!closest || diff < closest.difference) {
      closest = {
        playerId: ans.player_id,
        answer: ans.answer,
        difference: diff,
      };
    }
  }

  return closest;
}

// Get game results with player rankings
export function getGameResults(gameId: number): { players: Player[]; totalQuestions: number } {
  const players = getPlayersByGameId(gameId);
  const game = getGameById(gameId);

  if (!game) {
    return { players: [], totalQuestions: 0 };
  }

  const questions = getQuestionsByQuizId(game.quiz_id);

  return {
    players,
    totalQuestions: questions.length,
  };
}

// ============ STATS FUNCTIONS ============

export function getGlobalStats(): GlobalStats {
  const totalQuizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes').get() as { count: number };
  const totalGames = db.prepare('SELECT COUNT(*) as count FROM games').get() as { count: number };
  const totalPlayers = db.prepare('SELECT COUNT(*) as count FROM players').get() as { count: number };
  const totalAnswers = db.prepare('SELECT COUNT(*) as count FROM answers').get() as { count: number };
  const totalCorrectAnswers = db.prepare('SELECT COUNT(*) as count FROM answers WHERE is_correct = 1').get() as {
    count: number;
  };
  const totalQuestions = db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  const topQuizzes = db
    .prepare(
      `
    SELECT q.id, q.title, COUNT(g.id) as play_count
    FROM quizzes q
    JOIN games g ON q.id = g.quiz_id
    GROUP BY q.id
    ORDER BY play_count DESC
    LIMIT 5
  `,
    )
    .all() as { id: number; title: string; play_count: number }[];

  return {
    totalQuizzes: totalQuizzes.count,
    totalGames: totalGames.count,
    totalPlayers: totalPlayers.count,
    totalAnswers: totalAnswers.count,
    totalCorrectAnswers: totalCorrectAnswers.count,
    totalQuestions: totalQuestions.count,
    totalUsers: totalUsers.count,
    topQuizzes,
  };
}

export function getGameStats(gameId: number): GameStats | undefined {
  const game = getGameById(gameId);
  if (!game) return undefined;

  const players = getPlayersByGameId(gameId);
  const totalPlayers = players.length;
  const averageScore = totalPlayers > 0 ? players.reduce((acc, p) => acc + p.score, 0) / totalPlayers : 0;

  const questions = getQuestionsByQuizId(game.quiz_id);
  const questionStats = questions.map((q) => {
    const answers = db
      .prepare(
        `
      SELECT a.* FROM answers a
      JOIN players p ON a.player_id = p.id
      WHERE p.game_id = ? AND a.question_id = ?
    `,
      )
      .all(gameId, q.id) as Answer[];

    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const totalAnswers = answers.length;
    const averageResponseTime =
      totalAnswers > 0 ? answers.reduce((acc, a) => acc + (a.response_time_ms || 0), 0) / totalAnswers : 0;

    return {
      questionId: q.id,
      questionText: q.question_text,
      correctAnswers,
      totalAnswers,
      averageResponseTime,
    };
  });

  let mostDifficultQuestion: string | null = null;
  let easiestQuestion: string | null = null;

  if (questionStats.length > 0) {
    const sortedByDifficulty = [...questionStats]
      .filter((s) => s.totalAnswers > 0)
      .sort((a, b) => {
        const rateA = a.correctAnswers / a.totalAnswers;
        const rateB = b.correctAnswers / b.totalAnswers;
        return rateA - rateB;
      });

    if (sortedByDifficulty.length > 0) {
      mostDifficultQuestion = sortedByDifficulty[0].questionText;
      easiestQuestion = sortedByDifficulty[sortedByDifficulty.length - 1].questionText;
    }
  }

  return {
    totalPlayers,
    averageScore,
    questionStats,
    mostDifficultQuestion,
    easiestQuestion,
  };
}
