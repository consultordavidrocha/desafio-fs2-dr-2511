import { mentionsFinalJudgment } from './final-judgment';

describe('mentionsFinalJudgment', () => {
  it.each([
    'Certifica-se que a presente decisão transitou em julgado em 16/08/2025.',
    'Após o trânsito em julgado, arquivem-se.',
    'Sentença TRANSITADA EM JULGADO.',
    'transitado  em\njulgado',
  ])('detecta: %s', (text) => {
    expect(mentionsFinalJudgment(text)).toBe(true);
  });

  it.each([
    'Intimem-se as partes.',
    'O julgado foi publicado.',
    'Em trânsito para o tribunal.',
  ])('não detecta: %s', (text) => {
    expect(mentionsFinalJudgment(text)).toBe(false);
  });
});
