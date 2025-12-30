import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { useRouter } from '@/i18n/routing';

import HostGame from '../app/[locale]/master/quiz/[id]/host/page';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (ns?: string) => (key: string) => {
    if (ns === 'GameStats') return `Stats:${key}`;
    return key;
  },
  useMessages: () => ({}),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock i18n routing
jest.mock('../i18n/routing', () => ({
  useRouter: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) => (
      <button {...props}>{children}</button>
    ),
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => <h2 {...props}>{children}</h2>,
    span: ({ children, ...props }: React.ComponentPropsWithoutRef<'span'>) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock React.use
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    use: (promise: Promise<{ id: string }> | { id: string }) => {
      if (promise && typeof (promise as unknown as Promise<unknown>).then === 'function') {
        return { id: '1' }; // Mocked resolved value
      }
      return promise;
    },
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('HostGame', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockParams = Promise.resolve({ id: '1' });

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    jest.clearAllMocks();
  });

  it('renders and shows exit confirmation', async () => {
    // Mock initial game creation
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 10,
          pin_code: '123456',
          status: 'waiting',
          quiz: { id: 1, title: 'Test Quiz', description: 'Test Desc', time_limit: 10 },
        }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          game: { id: 10, pin_code: '123456', status: 'waiting' },
          quiz: { id: 1, title: 'Test Quiz', description: 'Test Desc', time_limit: 10 },
          players: [],
          questions: [],
          currentQuestion: null,
          questionAnswers: [],
        }),
      });

    render(<HostGame params={mockParams} />);

    // Wait for the game to be loaded
    await waitFor(() => {
      expect(screen.getByText('123456')).toBeInTheDocument();
    });

    // Find and click the exit button
    const exitButton = screen.getByText('exitGame');
    fireEvent.click(exitButton);

    // Check if modal is shown
    expect(screen.getByText('exitConfirm')).toBeInTheDocument();

    // Click leave
    const leaveButton = screen.getByText('LEAVE');
    fireEvent.click(leaveButton);

    expect(mockPush).toHaveBeenCalledWith('/master/quiz/1');
  });

  it('can cancel exit confirmation', async () => {
    // Mock initial game creation
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 10,
          pin_code: '123456',
          status: 'waiting',
          quiz: { id: 1, title: 'Test Quiz', description: 'Test Desc', time_limit: 10 },
        }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          game: { id: 10, pin_code: '123456', status: 'waiting' },
          quiz: { id: 1, title: 'Test Quiz', description: 'Test Desc', time_limit: 10 },
          players: [],
          questions: [],
          currentQuestion: null,
          questionAnswers: [],
        }),
      });

    render(<HostGame params={mockParams} />);

    // Wait for the game to be loaded
    await waitFor(() => {
      expect(screen.getByText('123456')).toBeInTheDocument();
    });

    // Find and click the exit button
    const exitButton = screen.getByText('exitGame');
    fireEvent.click(exitButton);

    // Click stay
    const stayButton = screen.getByText('STAY');
    fireEvent.click(stayButton);

    // Modal should be gone
    expect(screen.queryByText('exitConfirm')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
