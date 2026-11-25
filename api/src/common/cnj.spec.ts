import { formatCnj, normalizeCnj } from './cnj';

describe('normalizeCnj', () => {
  it.each([
    ['com máscara', '1234567-89.2024.8.26.0100'],
    ['sem máscara', '12345678920248260100'],
    ['com espaços nas pontas', '  1234567-89.2024.8.26.0100 '],
    ['com máscara parcial', '1234567-89.2024.8260100'],
  ])('aceita número %s', (_caso, input) => {
    expect(normalizeCnj(input)).toBe('12345678920248260100');
  });

  it.each([
    ['curto demais', '1234567-89.2024.8.26.010'],
    ['longo demais', '123456789202482601000'],
    ['com letras', '1234567-89.2024.8.26.01AB'],
    ['separador estranho', '1234567/89.2024.8.26.0100'],
    ['vazio', ''],
  ])('rejeita número %s', (_caso, input) => {
    expect(normalizeCnj(input)).toBeNull();
  });
});

describe('formatCnj', () => {
  it('aplica a máscara CNJ', () => {
    expect(formatCnj('12345678920248260100')).toBe('1234567-89.2024.8.26.0100');
  });

  it('devolve o valor original se não tiver 20 dígitos', () => {
    expect(formatCnj('123')).toBe('123');
  });
});
