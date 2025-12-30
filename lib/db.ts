import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(process.cwd(), 'data', 'quiz.db');

// Ensure the data directory exists in production
if (process.env.NODE_ENV !== 'test') {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Migration from old location
  const oldDbPath = path.join(process.cwd(), 'quiz.db');
  if (fs.existsSync(oldDbPath) && !fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(oldDbPath, dbPath);
    } catch (err) {
      console.error('Failed to migrate existing quiz.db:', err);
    }
  }
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  -- Users table (quiz masters identified by email)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Quizzes table
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

  -- Questions table
  -- question_type: 'true_false', 'mcq', 'number', 'free_text', 'multiple_mcq'
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('true_false', 'mcq', 'number', 'free_text', 'multiple_mcq')),
    correct_answer TEXT NOT NULL,
    options TEXT,
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
  );

  -- Games table (active game sessions)
  -- status: 'waiting', 'active', 'question', 'finished'
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    pin_code TEXT UNIQUE,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'question', 'finished')),
    current_question_index INTEGER DEFAULT -1,
    question_started_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
  );

  -- Players table (players in a game session)
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  -- Answers table (player answers to questions)
  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    is_correct INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    points_earned INTEGER DEFAULT 0,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(player_id, question_id)
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
  CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
  CREATE INDEX IF NOT EXISTS idx_games_pin_code ON games(pin_code);
  CREATE INDEX IF NOT EXISTS idx_games_quiz_id ON games(quiz_id);
  CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
  CREATE INDEX IF NOT EXISTS idx_answers_player_id ON answers(player_id);
  CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
`);

// Migration to make pin_code nullable in games table
interface ColumnInfo {
  name: string;
  notnull: number;
}

const tableInfo = db.prepare('PRAGMA table_info(games)').all() as ColumnInfo[];
const pinCodeCol = tableInfo.find((c) => c.name === 'pin_code');
if (pinCodeCol && pinCodeCol.notnull === 1) {
  db.pragma('foreign_keys = OFF');
  try {
    db.transaction(() => {
      // 1. Create new table
      db.exec(`
        CREATE TABLE games_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          pin_code TEXT UNIQUE,
          status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'question', 'finished')),
          current_question_index INTEGER DEFAULT -1,
          question_started_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );
      `);

      // 2. Copy data
      db.exec(`
        INSERT INTO games_new (id, quiz_id, pin_code, status, current_question_index, question_started_at, created_at)
        SELECT id, quiz_id, pin_code, status, current_question_index, question_started_at, created_at FROM games;
      `);

      // 3. Drop old table and rename new one
      db.exec('DROP TABLE games;');
      db.exec('ALTER TABLE games_new RENAME TO games;');

      // 4. Re-create indexes
      db.exec('CREATE INDEX IF NOT EXISTS idx_games_pin_code ON games(pin_code);');
      db.exec('CREATE INDEX IF NOT EXISTS idx_games_quiz_id ON games(quiz_id);');
    })();
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

// Migration to add multiple_mcq to question_type in questions table
const questionsTableInfo = db
  .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='questions'")
  .get() as {
  sql: string;
};
if (questionsTableInfo && !questionsTableInfo.sql.includes('multiple_mcq')) {
  db.pragma('foreign_keys = OFF');
  try {
    db.transaction(() => {
      // 1. Create new table
      db.exec(`
        CREATE TABLE questions_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          question_text TEXT NOT NULL,
          question_type TEXT NOT NULL CHECK (question_type IN ('true_false', 'mcq', 'number', 'free_text', 'multiple_mcq')),
          correct_answer TEXT NOT NULL,
          options TEXT,
          order_index INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );
      `);

      // 2. Copy data
      db.exec(`
        INSERT INTO questions_new (id, quiz_id, question_text, question_type, correct_answer, options, order_index, created_at)
        SELECT id, quiz_id, question_text, question_type, correct_answer, options, order_index, created_at FROM questions;
      `);

      // 3. Drop old table and rename new one
      db.exec('DROP TABLE questions;');
      db.exec('ALTER TABLE questions_new RENAME TO questions;');

      // 4. Re-create indexes
      db.exec('CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);');
    })();
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

export default db;

// Type definitions
export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Quiz {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  time_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  correct_answer: string;
  options: string | null;
  order_index: number;
  created_at: string;
}

export interface Game {
  id: number;
  quiz_id: number;
  pin_code: string | null;
  status: 'waiting' | 'active' | 'question' | 'finished';
  current_question_index: number;
  question_started_at: string | null;
  created_at: string;
}

export interface Player {
  id: number;
  game_id: number;
  name: string;
  score: number;
  joined_at: string;
}

export interface Answer {
  id: number;
  player_id: number;
  question_id: number;
  answer: string;
  is_correct: number;
  response_time_ms: number | null;
  points_earned: number;
  answered_at: string;
}

export interface GlobalStats {
  totalQuizzes: number;
  totalGames: number;
  totalPlayers: number;
  totalAnswers: number;
  totalCorrectAnswers: number;
  totalQuestions: number;
  totalUsers: number;
  topQuizzes: {
    id: number;
    title: string;
    play_count: number;
  }[];
}

export interface GameStats {
  totalPlayers: number;
  averageScore: number;
  questionStats: {
    questionId: number;
    questionText: string;
    correctAnswers: number;
    totalAnswers: number;
    averageResponseTime: number;
  }[];
  mostDifficultQuestion: string | null;
  easiestQuestion: string | null;
}
