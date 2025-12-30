import { render, screen } from '@testing-library/react';

import FeaturesPage from '../app/[locale]/features/page';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock i18n routing
jest.mock('../i18n/routing', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  AnimatePresence: ({ children }: any) => children,
}));

describe('FeaturesPage', () => {
  it('renders correctly', () => {
    render(<FeaturesPage />);

    // Check main title
    expect(screen.getByText('hero.title')).toBeInTheDocument();

    // Check back button
    expect(screen.getByText('backToHome')).toBeInTheDocument();

    // Check sections
    expect(screen.getByText('sections.quizMaster.title')).toBeInTheDocument();
    expect(screen.getByText('sections.players.title')).toBeInTheDocument();
    expect(screen.getByText('sections.questions.title')).toBeInTheDocument();

    // Check specific features
    expect(screen.getByText('sections.quizMaster.create.title')).toBeInTheDocument();
    expect(screen.getByText('sections.players.join.title')).toBeInTheDocument();

    // Check technical features
    expect(screen.getByText('sections.technical.realtime')).toBeInTheDocument();
    expect(screen.getByText('sections.technical.responsive')).toBeInTheDocument();
    expect(screen.getByText('sections.technical.i18n')).toBeInTheDocument();
  });
});
