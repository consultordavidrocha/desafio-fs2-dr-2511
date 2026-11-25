import { mapCommunication, mapCourt, unwrapList } from './cnj-mapper';
import type { CnjCommunicationSource } from './cnj-source.types';

const valid: CnjCommunicationSource = {
  id: 101,
  data_disponibilizacao: '2025-08-15',
  siglaTribunal: 'tjsp',
  tipoComunicacao: 'Intimação',
  nomeOrgao: ' 1ª Vara Cível ',
  texto: 'Fica intimada a parte...',
  numeroprocessocommascara: '1234567-89.2024.8.26.0100',
  nomeClasse: 'Procedimento comum',
  destinatarios: [{ nome: 'Amélia', polo: 'A' }, { nome: '  ' }],
};

describe('mapCommunication', () => {
  it('mapeia o formato CNJ para o modelo interno', () => {
    const result = mapCommunication(valid);

    expect(result).toEqual({
      ok: true,
      value: {
        id: 101,
        lawsuitNumber: '12345678920248260100',
        lawsuitClass: 'Procedimento comum',
        courtAcronym: 'TJSP',
        availabilityDate: new Date('2025-08-15T00:00:00.000Z'),
        type: 'Intimação',
        documentType: null,
        courtUnit: '1ª Vara Cível',
        content: 'Fica intimada a parte...',
        link: null,
        // destinatário sem nome é descartado
        recipients: [{ name: 'Amélia', side: 'A' }],
      },
    });
  });

  it('aceita data com hora (usa só a parte da data)', () => {
    const result = mapCommunication({
      ...valid,
      data_disponibilizacao: '2025-08-15T10:30:00',
    });

    expect(result.ok && result.value.availabilityDate.toISOString()).toBe(
      '2025-08-15T00:00:00.000Z',
    );
  });

  it.each([
    ['id ausente ou inválido', { id: undefined }],
    [
      'número do processo ausente ou inválido',
      { numeroprocessocommascara: '123' },
    ],
    ['sigla do tribunal ausente', { siglaTribunal: '' }],
    [
      'data de disponibilização inválida',
      { data_disponibilizacao: '2025-02-30' },
    ],
    ['texto da comunicação vazio', { texto: '   ' }],
  ])('rejeita com o motivo "%s"', (reason, patch) => {
    expect(mapCommunication({ ...valid, ...patch })).toEqual({
      ok: false,
      reason,
    });
  });
});

describe('mapCourt / unwrapList', () => {
  it('normaliza a sigla e usa a sigla como nome se faltar', () => {
    expect(mapCourt({ sigla: ' trf1 ' })).toEqual({
      acronym: 'TRF1',
      name: 'TRF1',
    });
    expect(mapCourt({ nome: 'Sem sigla' })).toBeNull();
  });

  it('aceita array puro ou { items: [...] }', () => {
    expect(unwrapList([1, 2])).toEqual([1, 2]);
    expect(unwrapList({ items: [3] })).toEqual([3]);
    expect(unwrapList({})).toEqual([]);
  });
});
