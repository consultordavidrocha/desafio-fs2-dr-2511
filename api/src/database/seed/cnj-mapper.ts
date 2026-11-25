import { normalizeCnj } from '../../common/cnj';
import { parseDateOnly } from '../../common/validators/is-date-only.validator';
import type {
  CnjCommunicationSource,
  CnjCourtSource,
  CnjListFile,
} from './cnj-source.types';

/** Linha pronta para gravar, já no modelo interno. */
export interface MappedCommunication {
  id: number;
  lawsuitNumber: string;
  lawsuitClass: string | null;
  courtAcronym: string;
  availabilityDate: Date;
  type: string;
  documentType: string | null;
  courtUnit: string | null;
  content: string;
  link: string | null;
  recipients: { name: string; side: string | null }[];
}

export type MapResult =
  { ok: true; value: MappedCommunication } | { ok: false; reason: string };

/** Desembrulha `{ items: [...] }` ou devolve o próprio array. */
export function unwrapList<T>(file: CnjListFile<T>): T[] {
  return Array.isArray(file) ? file : (file.items ?? []);
}

const clean = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/**
 * Mapeia uma comunicação do formato CNJ para o modelo interno.
 * Registros sem os campos essenciais são rejeitados com o motivo,
 * em vez de derrubar a importação inteira.
 */
export function mapCommunication(src: CnjCommunicationSource): MapResult {
  const id = Number(src.id);
  if (!Number.isInteger(id) || id <= 0) return fail('id ausente ou inválido');

  const rawNumber =
    clean(src.numero_processo) ?? clean(src.numeroprocessocommascara);
  const lawsuitNumber = rawNumber ? normalizeCnj(rawNumber) : null;
  if (!lawsuitNumber) return fail('número do processo ausente ou inválido');

  const courtAcronym = clean(src.siglaTribunal)?.toUpperCase();
  if (!courtAcronym) return fail('sigla do tribunal ausente');

  // A API do CNJ às vezes traz data com hora; usamos só a parte da data.
  const rawDate = clean(src.data_disponibilizacao)?.slice(0, 10);
  const availabilityDate = rawDate ? parseDateOnly(rawDate) : null;
  if (!availabilityDate) return fail('data de disponibilização inválida');

  const content = clean(src.texto);
  if (!content) return fail('texto da comunicação vazio');

  return {
    ok: true,
    value: {
      id,
      lawsuitNumber,
      lawsuitClass: clean(src.nomeClasse),
      courtAcronym,
      availabilityDate,
      type: clean(src.tipoComunicacao) ?? 'Não informado',
      documentType: clean(src.tipoDocumento),
      courtUnit: clean(src.nomeOrgao),
      content,
      link: clean(src.link),
      recipients: (src.destinatarios ?? [])
        .map((d) => ({ name: clean(d.nome), side: clean(d.polo) }))
        .filter((d): d is { name: string; side: string | null } => !!d.name),
    },
  };
}

export function mapCourt(
  src: CnjCourtSource,
): { acronym: string; name: string } | null {
  const acronym = clean(src.sigla)?.toUpperCase();
  if (!acronym) return null;
  return { acronym, name: clean(src.nome) ?? acronym };
}

function fail(reason: string): MapResult {
  return { ok: false, reason };
}
