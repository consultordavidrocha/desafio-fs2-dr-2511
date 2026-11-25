import { extractHighlights, splitSentences, summarize } from './summarizer';

const LONG_TEXT =
  'Vistos. Trata-se de ação de cobrança ajuizada pela parte autora. ' +
  'Considerando o teor da petição apresentada, defiro o pedido de dilação de prazo. ' +
  'Fica a parte intimada para, no prazo de 15 (quinze) dias, manifestar-se sobre o laudo pericial, sob pena de preclusão. ' +
  'Os autos permanecerão em cartório. ' +
  'Designo audiência de conciliação para o dia 10/03/2026 às 14h30. ' +
  'Nada mais havendo, encerro o presente termo.';

describe('splitSentences', () => {
  it('não quebra a frase no ponto de abreviações como "art."', () => {
    const sentences = splitSentences(
      'Nos termos do art. 4º da Lei 11.419/2006, considera-se publicada. Intimem-se.',
    );
    expect(sentences).toEqual([
      'Nos termos do art. 4º da Lei 11.419/2006, considera-se publicada.',
      'Intimem-se.',
    ]);
  });
});

describe('extractHighlights', () => {
  it('encontra prazo, audiência e trânsito em julgado', () => {
    expect(extractHighlights(LONG_TEXT)).toEqual([
      'Prazo: 15 dias',
      'Audiência: 10/03/2026 às 14h30',
    ]);
    expect(
      extractHighlights('A decisão transitou em julgado em 16/08/2025.'),
    ).toEqual(['Trânsito em julgado: 16/08/2025']);
  });

  it('devolve lista vazia quando não há destaques', () => {
    expect(extractHighlights('Junte-se aos autos.')).toEqual([]);
  });
});

describe('summarize', () => {
  it('mantém texto curto inteiro', () => {
    expect(summarize('  Intimem-se   as partes. ').summary).toBe(
      'Intimem-se as partes.',
    );
  });

  it('escolhe as 3 frases mais relevantes, na ordem original', () => {
    const { summary } = summarize(LONG_TEXT);

    expect(summary).toBe(
      'Considerando o teor da petição apresentada, defiro o pedido de dilação de prazo. ' +
        'Fica a parte intimada para, no prazo de 15 (quinze) dias, manifestar-se sobre o laudo pericial, sob pena de preclusão. ' +
        'Designo audiência de conciliação para o dia 10/03/2026 às 14h30.',
    );
  });

  it('é determinístico', () => {
    expect(summarize(LONG_TEXT)).toEqual(summarize(LONG_TEXT));
  });
});
