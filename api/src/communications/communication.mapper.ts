import { Prisma } from '@prisma/client';
import { formatCnj } from '../common/cnj';
import type { CommunicationDto } from './dto/communication.dto';

/** Campos carregados do banco para montar um CommunicationDto. */
export const communicationSelect = {
  id: true,
  lawsuitNumber: true,
  courtAcronym: true,
  availabilityDate: true,
  type: true,
  documentType: true,
  courtUnit: true,
  content: true,
  link: true,
  lawsuit: { select: { className: true } },
  recipients: { select: { name: true, side: true }, orderBy: { id: 'asc' } },
} satisfies Prisma.CommunicationSelect;

type CommunicationRow = Prisma.CommunicationGetPayload<{
  select: typeof communicationSelect;
}>;

/** Converte a linha do banco no formato público da API. */
export function toCommunicationDto(row: CommunicationRow): CommunicationDto {
  return {
    id: row.id,
    lawsuitNumber: formatCnj(row.lawsuitNumber),
    lawsuitClass: row.lawsuit.className,
    court: row.courtAcronym,
    // Coluna DATE: o Prisma devolve meia-noite UTC; basta cortar a parte da data.
    availabilityDate: row.availabilityDate.toISOString().slice(0, 10),
    type: row.type,
    documentType: row.documentType,
    courtUnit: row.courtUnit,
    content: row.content,
    link: row.link,
    recipients: row.recipients,
  };
}
