import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import QuizEditor from '../app/[locale]/master/quiz/[id]/page';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (ns?: string) => (key: string) => {
    if (ns === 'QuizEditor') return key;
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
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
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

describe('QuizEditor', () => {
  const mockParams = Promise.resolve({ id: '1' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders quiz and questions', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'Test Quiz', description: 'Test Desc', time_limit: 10 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            question_text: 'Question 1',
            question_type: 'mcq',
            correct_answer: 'A',
            options: ['A', 'B'],
            order_index: 0,
          },
          {
            id: 2,
            question_text: 'Question 2',
            question_type: 'true_false',
            correct_answer: 'true',
            options: null,
            order_index: 1,
          },
        ],
      });

    render(<QuizEditor params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
    });

    // Check for move buttons for Question 1
    const moveUpButtons = screen.getAllByTitle('moveUp');
    const moveDownButtons = screen.getAllByTitle('moveDown');

    expect(moveUpButtons[0]).toBeDisabled(); // First question: Up disabled
    expect(moveDownButtons[0]).not.toBeDisabled(); // First question: Down enabled

    expect(moveUpButtons[1]).not.toBeDisabled(); // Second question: Up enabled
    expect(moveDownButtons[1]).toBeDisabled(); // Second question: Down disabled
  });
});
