# 🎯 Quiz Game

Official Repository: [https://github.com/hackjack-101/quiz-game](https://github.com/hackjack-101/quiz-game)

A real-time, interactive quiz game application built with Next.js, TypeScript, and SQLite.

## 🚀 Features

### 👑 Quiz Master

- **Identify**: Access dashboard using email.
- **Onboarding**: Automatic creation of a demo quiz in your language to explore all features.
- **Account Management**: Fully delete your account and all associated data.
- **Manage Quizzes**: Create, edit, delete, and reorder questions within quizzes.
- **Host Games**: Launch live game sessions with a unique 6-digit PIN.
- **Game History**: Access history of previous games and view their statistics.
- **Control**: Manage question progression, replay rounds, reset games, and view live results.
- **Analyze**: Detailed game statistics available at the end of each session.

### 🎮 Player

- **Join**: Enter a 6-digit PIN and a nickname to join a live game.
- **Participate**: Answer questions in real-time.
- **Compete**: View your score and ranking on the leaderboard.

### 🌐 Public

- **Feature Presentation**: A dedicated page presenting all the application's capabilities to new users.
- **Global Statistics**: View community activity, total quizzes, games played, and top quizzes.
- **Multilingual**: Fully translated into multiple languages.

## 🛠 Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion & Canvas Confetti
- **Icons**: Lucide React
- **Real-time**: WebSockets (Socket.IO) for instant game state updates
- **Responsiveness**: Optimized for mobile (iPhone 13 mini) and tablets (iPad 11")

## 📋 Question Types Supported

1. **True or False**
2. **Multiple Choice (MCQ)** - Single correct answer
3. **Multiple Choice (Multiple Correct)** - One or more correct answers
4. **Number Input** (Closest answer wins bonus points)
5. **Free Text** (Case and accent insensitive match)

## 🏁 Getting Started

### Prerequisites

- Node.js 24+
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker

### Docker Compose for Production (Recommended)

The easiest way to run the application in production is using Docker Compose:

```bash
docker compose up -d
```

This will pull the pre-built image from GHCR and start the application on port 3000. The SQLite database is persisted using a Docker volume named `quiz_data`.

> [!IMPORTANT]
> If you encounter permission issues with the database volume (e.g., `SQLITE_CANTOPEN`), ensure the volume is writable by the non-root user (UID 1001). The provided `docker-compose.yml` includes `user: "1001:1001"` to help with this. If problems persist, you might need to run `chown -R 1001:1001 /path/to/your/volume` on the host.

### Docker Compose for Local Development

For local development and testing, use the `docker-compose.local.yml` file which builds the image locally:

```bash
docker compose -f docker-compose.local.yml up -d
```

This will:
- Build the Docker image from the local Dockerfile
- Use a separate volume (`quiz_data_local`) to avoid conflicts with production data
- Start the application on port 3000

To rebuild the image after code changes:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

To stop and remove the local container:

```bash
docker compose -f docker-compose.local.yml down
```

To also remove the local data volume:

```bash
docker compose -f docker-compose.local.yml down -v
```

### Manual Docker Build

You can also build and run the image manually:

#### Build the image

```bash
docker build -t quiz-game .
```

### Run the container

```bash
docker run -p 3000:3000 -v quiz_data:/app/data quiz-game
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Configuration

The following environment variables can be used to configure the application:

- `DB_PATH`: Path to the SQLite database file (default: `/app/data/quiz.db` in Docker, `data/quiz.db` locally).
- `NODE_ENV`: Set to `production` for production environments.

## 🚀 CI/CD

This project uses GitHub Actions for Continuous Integration and Continuous Deployment.
The workflow is defined in `.github/workflows/ci.yml` and includes:

- Linting with ESLint
- Formatting check with Prettier
- Unit and Integration tests with Jest
- Production build of the Next.js application
- Docker image build and push to GitHub Container Registry (GHCR)

## 🧪 Testing

The project uses Jest and React Testing Library for testing.

Run all tests:

```bash
npm test
```

Test coverage includes:

- **Database Utilities**: Unit tests for scoring logic and CRUD operations.
- **API Routes**: Integration tests for quiz management and answer submission.
- **UI Components**: Component tests for the player interface.
