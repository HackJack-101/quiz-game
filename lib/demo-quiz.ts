import { createQuestion, createQuiz } from './db-utils';

export async function createDemoQuiz(userId: number, locale: string) {
  const messages = (await import(`../messages/${locale}.json`)).default;
  const demoData = messages.DemoQuiz;

  const quiz = createQuiz(
    userId,
    demoData.title,
    demoData.description,
    15, // A bit more time for demo
  );

  const questions = [
    {
      type: 'true_false' as const,
      data: demoData.questions.true_false,
    },
    {
      type: 'mcq' as const,
      data: demoData.questions.mcq,
    },
    {
      type: 'multiple_mcq' as const,
      data: demoData.questions.multiple_mcq,
    },
    {
      type: 'number' as const,
      data: demoData.questions.number,
    },
    {
      type: 'free_text' as const,
      data: demoData.questions.free_text,
    },
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    createQuestion(quiz.id, q.data.text, q.type, q.data.answer, q.data.options, i);
  }

  return quiz;
}
