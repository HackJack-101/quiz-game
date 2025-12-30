export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  correct_answer: string;
  options: string[] | null;
  order_index: number;
}

export interface Player {
  id: number;
  game_id: number;
  name: string;
  score: number;
  joined_at: string;
}

export interface Game {
  id: number;
  quiz_id: number;
  pin_code: string | null;
  status: 'waiting' | 'active' | 'question' | 'finished';
  current_question_index: number;
  created_at: string;
  question_started_at?: string | null;
}

export interface Answer {
  id: number;
  player_id: number;
  question_id: number;
  answer: string;
  is_correct: boolean | number;
  response_time_ms: number | null;
  points_earned: number;
  answered_at: string;
  playerName?: string;
  time_taken?: number; // Calculated field for UI
}

// Player-facing types (camelCase)
export interface PlayerQuestion {
  id: number;
  questionText: string;
  questionType: 'true_false' | 'mcq' | 'number' | 'free_text' | 'multiple_mcq';
  options: string[] | null;
  correctAnswer?: string;
}

export interface PlayerGame {
  id: number;
  status: 'waiting' | 'active' | 'question' | 'finished';
  currentQuestionIndex: number;
  questionStartedAt: string | null;
  pinCode?: string | null;
}

export interface PlayerQuiz {
  id: number;
  title: string;
  timeLimit: number;
}
