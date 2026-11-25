/**
 * Resumo extrativo de comunicações processuais (bônus "Resumo com IA").
 *
 * Por que extrativo e não um LLM:
 * - não envia o conteúdo dos processos para terceiros (dados pessoais, LGPD);
 * - não depende de chave, custo ou disponibilidade de um provedor externo;
 * - é determinístico e testável (mesmo texto → mesmo resumo).
 * Trocar por um LLM é isolado: basta outra implementação desta função.
 *
 * Como funciona: divide o texto em frases, pontua cada uma por termos
 * jurídicos relevantes (prazo, audiência, sentença...) e devolve as mais
 * relevantes na ordem original, com destaques (prazo, audiência) no topo.
 */

const MAX_SENTENCES = 3;
const SHORT_TEXT_CHARS = 280;

/** Abreviações comuns em textos jurídicos: o ponto delas não encerra a frase. */
const ABBREVIATIONS = [
  'art',
  'arts',
  'inc',
  'fls',
  'fl',
  'nº',
  'n',
  'dr',
  'dra',
  'sr',
  'sra',
  'exmo',
  'exma',
  'p',
  'pág',
  'cf',
  'proc',
];

const KEYWORDS: [RegExp, number][] = [
  [/\bprazo\b/i, 3],
  [/\baudi[êe]ncia\b/i, 3],
  [/tr[âa]nsit\w* em julgado/i, 3],
  [/\bsenten[çc]a\b/i, 2],
  [/\bdecis[ãa]o\b/i, 2],
  [/\bintim\w*/i, 2],
  [/\bcit(a[çc][ãa]o|ad[oa]|e-se)\b/i, 2],
  [/\b(pagamento|pague|dep[óo]sito|recolh\w*)\b/i, 2],
  [/\b(multa|penhora|bloqueio)\b/i, 2],
  [/\b(defiro|indefiro|homologo|julgo)\b/i, 2],
  [/\b(recurso|apela[çc][ãa]o|agravo|embargos)\b/i, 2],
  [/\bdias\b/i, 1],
  [/\bpena de\b/i, 1],
];

export interface Summary {
  /** Destaques objetivos encontrados no texto (ex.: "Prazo: 15 dias"). */
  highlights: string[];
  /** Frases mais relevantes, na ordem em que aparecem no texto. */
  summary: string;
}

export function splitSentences(text: string): string[] {
  const abbreviations = ABBREVIATIONS.join('|');
  // Quebra após . ! ? quando vier espaço + início de frase, exceto depois de abreviação.
  const boundary = new RegExp(
    `(?<!\\b(?:${abbreviations})\\.)(?<=[.!?])\\s+(?=[A-ZÀ-Ý0-9"“(])`,
    'giu',
  );
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(boundary)
    .map((s) => s.trim())
    .filter(Boolean);
}

function score(sentence: string, index: number): number {
  const keywordScore = KEYWORDS.reduce(
    (sum, [pattern, weight]) => sum + (pattern.test(sentence) ? weight : 0),
    0,
  );
  const firstSentenceBonus = index === 0 ? 1 : 0;
  const words = sentence.split(' ').length;
  const tooShort = words < 4 ? -3 : 0;
  const tooLong = words > 60 ? -1 : 0;
  return keywordScore + firstSentenceBonus + tooShort + tooLong;
}

export function extractHighlights(text: string): string[] {
  const highlights: string[] = [];
  const deadline =
    /prazo\s+(?:legal\s+)?de\s+(\d{1,3})\s*(?:\([^)]*\)\s*)?(dias?\s*(?:úteis|corridos)?|horas)/i.exec(
      text,
    );
  if (deadline) highlights.push(`Prazo: ${deadline[1]} ${deadline[2].trim()}`);

  const hearing =
    /audi[êe]ncia[^.]{0,80}?(\d{2}\/\d{2}\/\d{4})(?:[^.]{0,20}?(\d{1,2}h\d{0,2}|\d{1,2}:\d{2}))?/i.exec(
      text,
    );
  if (hearing)
    highlights.push(
      `Audiência: ${hearing[1]}${hearing[2] ? ` às ${hearing[2]}` : ''}`,
    );

  const finalJudgment =
    /tr[âa]nsit\w* em julgado(?:\s+em\s+(\d{2}\/\d{2}\/\d{4}))?/i.exec(text);
  if (finalJudgment)
    highlights.push(
      `Trânsito em julgado${finalJudgment[1] ? `: ${finalJudgment[1]}` : ''}`,
    );

  return highlights;
}

export function summarize(text: string): Summary {
  const clean = text.replace(/\s+/g, ' ').trim();
  const highlights = extractHighlights(clean);
  if (clean.length <= SHORT_TEXT_CHARS) return { highlights, summary: clean };

  const sentences = splitSentences(clean);
  if (sentences.length <= MAX_SENTENCES)
    return { highlights, summary: sentences.join(' ') };

  const chosen = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: score(sentence, index),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_SENTENCES)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  return { highlights, summary: chosen.join(' ') };
}
