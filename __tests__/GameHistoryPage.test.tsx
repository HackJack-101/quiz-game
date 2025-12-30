import { render, screen, waitFor } from '@testing-library/react';

import GameHistoryPage from '../app/[locale]/master/history/page';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    if (namespace === 'GameHistory') {
      const messages: Record<string, string> = {
        title: 'Game History',
        loading: 'Loading history...',
        statusWaiting: 'Waiting',
        statusActive: 'Active',
        statusQuestion: 'Question',
        statusFinished: 'Finished',
        hostGame: 'Host Game',
        resume: 'Resume',
        close: 'Close',
        resumeConfirm: 'Resume session?',
        closeConfirm: 'Close session?',
        noHistory: 'No games played yet.',
        error: 'Failed to load history',
      };
      return messages[key] || key;
    }
    return key;
  },
}));

// Mock i18n routing
jest.mock('../i18n/routing', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('GameHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('quizMasterEmail', 'test@example.com');
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<GameHistoryPage />);
    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('renders history with different statuses', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            quiz_id: 1,
            pin_code: '111111',
            status: 'waiting',
            created_at: new Date().toISOString(),
            quiz_title: 'Quiz 1',
            player_count: 5,
          },
          {
            id: 2,
            quiz_id: 1,
            pin_code: '222222',
            status: 'active',
            created_at: new Date().toISOString(),
            quiz_title: 'Quiz 2',
            player_count: 3,
          },
          {
            id: 3,
            quiz_id: 1,
            pin_code: '333333',
            status: 'question',
            created_at: new Date().toISOString(),
            quiz_title: 'Quiz 3',
            player_count: 8,
          },
          {
            id: 4,
            quiz_id: 1,
            pin_code: '444444',
            status: 'finished',
            created_at: new Date().toISOString(),
            quiz_title: 'Quiz 4',
            player_count: 10,
          },
        ],
      });

    render(<GameHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Quiz 1')).toBeInTheDocument();
      expect(screen.getByText('Waiting')).toBeInTheDocument();
      expect(screen.getByText('Quiz 2')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Quiz 3')).toBeInTheDocument();
      expect(screen.getByText('Question')).toBeInTheDocument();
      expect(screen.getByText('Quiz 4')).toBeInTheDocument();
      expect(screen.getByText('Finished')).toBeInTheDocument();

      // Check for buttons
      expect(screen.getByText('Resume')).toBeInTheDocument();
      expect(screen.getAllByText('Close')).toHaveLength(3);
      expect(screen.getAllByText('Host Game')).toHaveLength(3);
    });
  });

  it('renders no history message', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<GameHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('No games played yet.')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<GameHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load history')).toBeInTheDocument();
    });
  });
});
