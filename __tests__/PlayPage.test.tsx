import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useRouter } from '@/i18n/routing';

import PlayPage from '../app/[locale]/play/page';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock i18n routing
jest.mock('../i18n/routing', () => ({
  useRouter: jest.fn(),
}));

// Mock useSocket
jest.mock('../hooks/useSocket', () => ({
  useSocket: jest.fn(() => ({
    socket: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    connected: true,
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('PlayPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the join form initially', () => {
    render(<PlayPage />);
    expect(screen.getByText('joinGame')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('pinPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('namePlaceholder')).toBeInTheDocument();
  });

  it('shows error message if join fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid PIN' }),
    });

    render(<PlayPage />);

    fireEvent.change(screen.getByPlaceholderText('pinPlaceholder'), { target: { value: '000000' } });
    fireEvent.change(screen.getByPlaceholderText('namePlaceholder'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('joinGame'));

    await waitFor(() => {
      expect(screen.getByText('Invalid PIN')).toBeInTheDocument();
    });
  });

  it('successfully joins a game', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ player: { id: 123 } }),
    });

    // Mock subsequent state poll
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        game: { status: 'waiting' },
        player: { name: 'Test', score: 0 },
        quiz: { title: 'Test Quiz' },
        leaderboard: [],
      }),
    });

    render(<PlayPage />);

    fireEvent.change(screen.getByPlaceholderText('pinPlaceholder'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('namePlaceholder'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('joinGame'));

    await waitFor(() => {
      expect(localStorage.getItem('quiz_player_id')).toBe('123');
      expect(screen.getByText('welcomeWithName')).toBeInTheDocument();
    });
  });

  it('renders question and allows answering', async () => {
    // Initial state: joined and question is active
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        game: { status: 'question', questionStartedAt: new Date().toISOString() },
        player: { name: 'Test', score: 100 },
        quiz: { title: 'Test Quiz', timeLimit: 10 },
        currentQuestion: {
          id: 1,
          questionText: 'What is 1+1?',
          questionType: 'mcq',
          options: ['1', '2', '3', '4'],
        },
        questionNumber: 1,
        totalQuestions: 5,
        leaderboard: [],
      }),
    });

    // Mock localStorage to skip join screen
    localStorage.setItem('quiz_player_id', '123');

    render(<PlayPage />);

    await waitFor(() => {
      expect(screen.getByText('What is 1+1?')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Submit answer
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: { is_correct: null },
        message: 'Answer submitted!',
      }),
    });

    fireEvent.click(screen.getByText('2'));

    await waitFor(() => {
      expect(screen.getByText('answerSubmitted')).toBeInTheDocument();
    });
  });
});
