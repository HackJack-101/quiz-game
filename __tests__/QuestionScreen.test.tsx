import { fireEvent, render, screen } from '@testing-library/react';

import QuestionScreen from '../app/[locale]/play/_components/QuestionScreen';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockProps = {
  currentQuestion: {
    id: 1,
    questionText: 'What is the capital of France?',
    questionType: 'free_text' as const,
    options: null,
  },
  questionNumber: 1,
  totalQuestions: 10,
  timeRemaining: 10,
  timeLimit: 10,
  selectedAnswer: '',
  setSelectedAnswer: jest.fn(),
  hasAnswered: false,
  answerResult: null,
  player: { name: 'Player 1', score: 0 },
  onToggleMultipleMcqAnswer: jest.fn(),
  onSubmitAnswer: jest.fn(),
  onExit: jest.fn(),
};

describe('QuestionScreen', () => {
  it('submits the answer when Enter is pressed in free_text input', () => {
    const onSubmitAnswer = jest.fn();
    render(<QuestionScreen {...mockProps} selectedAnswer="Paris" onSubmitAnswer={onSubmitAnswer} />);

    const input = screen.getByPlaceholderText('textPlaceholder');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmitAnswer).toHaveBeenCalledWith('Paris');
  });

  it('submits the answer when Enter is pressed in number input', () => {
    const onSubmitAnswer = jest.fn();
    const numberProps = {
      ...mockProps,
      currentQuestion: {
        id: 2,
        questionText: 'How many planets in the solar system?',
        questionType: 'number' as const,
        options: null,
      },
    };
    render(<QuestionScreen {...numberProps} selectedAnswer="8" onSubmitAnswer={onSubmitAnswer} />);

    const input = screen.getByPlaceholderText('numberPlaceholder');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmitAnswer).toHaveBeenCalledWith('8');
  });
});
