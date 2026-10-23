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

### Docker Compose (Recommended)

The easiest way to run the application is using Docker Compose:

```bash
docker compose up -d
```

This will pull the image from GHCR and start the application on port 3000. The SQLite database is persisted using a Docker volume named `quiz_data`.

> [!IMPORTANT]
> If you encounter permission issues with the database volume (e.g., `SQLITE_CANTOPEN`), ensure the volume is writable by the non-root user (UID 1001). The provided `docker-compose.yml` includes `user: "1001:1001"` to help with this. If problems persist, you might need to run `chown -R 1001:1001 /path/to/your/volume` on the host.

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

| Event                                  | Workflow        | Runs                                                                                                                                       |
| -------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Pull request                           | `ci.yml`        | ESLint, Prettier check, Jest tests and the production build of the Next.js application.                                                    |
| Pull request changing the `Dockerfile` | `docker-pr.yml` | A Docker build of the image, to catch errors before merging. The image is not pushed.                                                      |
| Push to `main`                         | `ci.yml`        | The same checks, then the image pushed to GHCR as `latest` and `sha-<commit>`. Docs-only changes skip it.                                  |
| Published release (tag `v1.2.0`)       | `release.yml`   | Image tagged `1.2.0`, `1.2`, `stable` and `sha-<commit>`, then the Portainer deploy. No tests: the commit passed them on its pull request. |
| Published pre-release (`v1.3.0-rc.1`)  | `release.yml`   | Image tagged `1.3.0-rc.1` and `sha-<commit>` only: no `stable`, no deploy.                                                                 |

Release tags must be semver (`v1.2.0` or `1.2.0`). Pushing a tag alone builds nothing; publish a release from it.

### Deploying releases to Portainer

The `deploy` job calls the stack's Portainer webhook (Portainer Business Edition; the free 3-node licence is enough) with `?QUIZ_VERSION=<version>`. Portainer pulls the image and redeploys the stack; the job then polls `APP_URL/api/health` until it reports the new version, and fails after 10 minutes otherwise.

1. In Portainer, open the stack's **Editor** and set the app image to:
   ```yaml
   image: ghcr.io/hackjack-101/quiz-game:${QUIZ_VERSION:-stable}
   ```
   Remove `QUIZ_VERSION` from the stack's environment variables, so the value sent by the webhook is the one used. A manual redeploy without it runs `stable`, the latest release.
2. Still in the **Editor**, turn on **Create a Stack webhook** and copy its URL.
3. In GitHub, open **Settings** → **Environments** → **New environment** and name it `production`. Optionally add yourself as a required reviewer to approve each deploy.
4. In that environment, add:

   | Name                    | Kind     | Value                                                                                          |
   | ----------------------- | -------- | ---------------------------------------------------------------------------------------------- |
   | `PORTAINER_WEBHOOK_URL` | secret   | The webhook URL. Anyone who has it can redeploy the stack.                                     |
   | `APP_URL`               | variable | The app's public URL, such as `https://quiz.example.com` (optional: enables the version check) |

If a proxy puts basic auth in front of Portainer, exempt `/api/stacks/webhooks/` from it: the webhook's id is its secret.

To roll back, re-run the `deploy` job of an earlier release.

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
