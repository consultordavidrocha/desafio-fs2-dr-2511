/**
 * Formato de origem de dados/comunicacoes.json, inspirado na API pública de
 * comunicações processuais do CNJ (comunicaapi.pje.jus.br).
 *
 * Escrito a partir da API pública antes de o arquivo do case ser liberado e
 * confirmado com os dados reais (120 comunicações carregadas sem ajuste).
 * Todos os campos são opcionais porque os dados podem vir "sujos"; o mapper
 * decide o que é obrigatório. Campos do arquivo ignorados de propósito:
 * `meio`/`meiocompleto` (sempre DJEN) e `destinatarioadvogados` (sem uso nas telas).
 */
export interface CnjCommunicationSource {
  id?: number | string;
  data_disponibilizacao?: string;
  siglaTribunal?: string;
  tipoComunicacao?: string;
  tipoDocumento?: string;
  nomeOrgao?: string;
  texto?: string;
  numero_processo?: string;
  numeroprocessocommascara?: string;
  nomeClasse?: string;
  link?: string;
  destinatarios?: { nome?: string; polo?: string }[];
}

export interface CnjCourtSource {
  sigla?: string;
  nome?: string;
}

/** A API do CNJ embrulha a lista em `{ items: [...] }`; aceitamos os dois formatos. */
export type CnjListFile<T> = T[] | { items?: T[] };
