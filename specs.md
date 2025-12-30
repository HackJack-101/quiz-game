# Quiz Game Application Specifications

This document outlines the technical and functional specifications for a quiz game website built with Next.js (TypeScript) and SQLite.

## 1. Overview

A real-time quiz game where a **Quiz Master** creates and hosts a game, and **Players** join using a unique 6-digit PIN.

## 2. Technical Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: SQLite (using `better-sqlite3`)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion & Canvas Confetti
- **Icons**: Lucide React
- **Authentication**: None. Quiz Masters are identified by their email address.

## 3. User Roles & Features

### 3.1 Quiz Master

- **Identification**: Must enter an email address to access their dashboard.
- **Onboarding**: Upon first connection, a demo quiz is automatically created in the user's language. This quiz includes all supported question types and is designed to be very easy or provide the answers.
- **Account Management**:
  - Delete account: Permanently removes the user and all their associated data (quizzes, games, etc.).
- **Quiz Management**:
  - Create a new quiz (Title, Description, Time Limit).
  - Edit existing quizzes.
  - View a list of quizzes they have created.
- **Game Hosting**:
  - Launch a quiz game, which generates a unique **6-digit PIN code**.
  - Control the progression of questions (Start Game, Next Question, Replay Round, Reset Game).
  - View live game status and player rankings.
- **Game History**:
  - View a list of past games hosted by the Quiz Master.
  - Access detailed statistics for any finished game.
  - Resume a finished game to allow more players to join and continue playing.
  - Close an active session manually.

### 3.2 Player

- **Joining**: Joins a game by entering a 6-digit PIN code and a display name.
- **Participation**:
  - Responds to questions within the time limit.
  - Views their score and ranking after each question/game.
- **Exiting**: Players can leave the game at any time after a confirmation dialog, but their score will be recorded.

## 4. Quiz Specifications

### 4.1 Question Types

The application supports five types of questions:

1.  **True or False**: Simple binary choice.
2.  **MCQ (Multiple Choice Question)**: 4 options, one correct answer.
3.  **Multiple MCQ**: 4 options, one or more correct answers.
4.  **Number Input**:
    - Players enter a numeric value.
    - **Scoring**: The player(s) with the closest number to the correct response wins the round.
5.  **Free Input**:
    - Players type a text response.
    - **Scoring**: Only the perfect match (case-insensitive, trimmed) wins.

### 4.2 Game Settings

- **Time Limit**: Default is 10 seconds per question, but it can be customized by the Quiz Master for the entire quiz.

## 5. Game Mechanics & Scoring

### 5.1 Joining a Game

- Players enter the 6-digit PIN generated when the Quiz Master starts a game.
- Players provide a name which is displayed on the leaderboard.

### 5.2 Scoring Logic

- **Correctness**: Points are awarded for correct answers.
- **Speed Bonus**: For True/False, MCQ, and Free Input, points are scaled based on how quickly the player responded (e.g., 500-1000 points for a correct answer).
- **Number Input Round**: Special logic where the closest answer(s) receive points for the round.

### 5.3 Game Flow

1.  **Waiting Room**: Players join via PIN. Quiz Master sees the list of joined players.
2.  **Question Phase**: The question and possible responses are displayed on both the Quiz Master's screen (for presentation) and the Players' screens.
3.  **Answering Phase**: Players have X seconds (default 10) to submit their answer.
4.  **Result Phase**: The correct answer is revealed after the end of the question time, and the leaderboard is updated.
5.  **Game End**: Final rankings are displayed. Quiz Master can view detailed game statistics (average score, question-by-question performance).

## 6. Database Schema (SQLite)

The application uses a local `quiz.db` file with the following tables:

- **`users`**: `id`, `email`, `created_at`
- **`quizzes`**: `id`, `user_id`, `title`, `description`, `time_limit`, `created_at`, `updated_at`
- **`questions`**: `id`, `quiz_id`, `question_text`, `question_type` (enum), `correct_answer`, `options` (JSON string for MCQ), `order_index`
- **`games`**: `id`, `quiz_id`, `pin_code` (nullable), `status` (waiting, active, question, finished), `current_question_index`, `question_started_at`
- **`players`**: `id`, `game_id`, `name`, `score`, `joined_at`
- **`answers`**: `id`, `player_id`, `question_id`, `answer`, `is_correct`, `response_time_ms`, `points_earned`

## 7. Implementation Details (Analysis of existing code)

- **Database Access**: Centralized in `lib/db.ts` and `lib/db-utils.ts`.
- **API Routes**:
  - `/api/users`: Find or create users by email.
  - `/api/quizzes`: CRUD operations for quizzes and questions.
  - `/api/games`: Manage game sessions and status.
  - `/api/players`: Join games and submit answers.
  - `/api/health`: Healthcheck endpoint for monitoring.
- **Pages**:
  - `/`: Home page with options to join or host.
  - `/features`: Public page presenting the application features.
  - `/master`: Quiz Master dashboard and authentication.
  - `/play`: Player interface to join and participate in games.
  - `/stats`: Global statistics for the application.
- **Scoring**: Implemented in `calculateScore` and `findClosestNumberAnswer` within `lib/db-utils.ts`.

## 8. Deployment

- **Docker**: The application is containerized using a multi-stage `Dockerfile` and can be managed with `docker-compose.yml`.
- **Base Image**: The application image is available on GitHub Container Registry (`ghcr.io/hackjack-101/quiz-game`).
- **Persistence**: The SQLite database is persisted using a host-bind mount to a `quiz.db` file.
- **Security**: Runs as a non-root user (`nextjs`).
- **Healthcheck**: Periodically checks `/api/health` to ensure the application is responsive, both in the Dockerfile and Docker Compose.
