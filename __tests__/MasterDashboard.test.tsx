import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { useRouter } from '@/i18n/routing';

import MasterDashboard from '../app/[locale]/master/page';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    return key;
  },
  useLocale: () => 'en',
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
    section: ({ children, ...props }: React.ComponentPropsWithoutRef<'section'>) => (
      <section {...props}>{children}</section>
    ),
    h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock fetch
global.fetch = jest.fn();

describe('MasterDashboard', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();

    // Mock fetch default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    // Mock local storage
    const storageMock: { [key: string]: string } = {
      quizMasterEmail: 'test@example.com',
    };
    Storage.prototype.getItem = jest.fn((key) => storageMock[key] || null);
    Storage.prototype.setItem = jest.fn((key, value) => {
      storageMock[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key) => {
      delete storageMock[key];
    });
  });

  it('navigates to the quiz edition page after creation', async () => {
    // Mock fetch implementation
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === '/api/users') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, email: 'test@example.com' }),
        });
      }
      if (url.startsWith('/api/quizzes')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 123, title: 'My New Quiz' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<MasterDashboard />);

    // Wait for the user to be loaded
    await waitFor(() => {
      expect(screen.getByText('createQuiz')).toBeInTheDocument();
    });

    // Open new quiz form
    fireEvent.click(screen.getByText('createQuiz'));

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText('quizTitlePlaceholder'), {
      target: { value: 'My New Quiz' },
    });

    // Wait for form to appear
    const createButton = await screen.findByText('createQuizAction');

    // Submit the form
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/master/quiz/123');
    });
  });
});
