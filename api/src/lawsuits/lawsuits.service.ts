import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { formatCnj, normalizeCnj } from '../common/cnj';
import {
  communicationSelect,
  toCommunicationDto,
} from '../communications/communication.mapper';
import { PrismaService } from '../prisma/prisma.service';
import type { LawsuitDetailDto, LawsuitQuery } from './dto/lawsuit.dto';
import {
  FINAL_JUDGMENT_SQL_PATTERN,
  mentionsFinalJudgment,
} from './final-judgment';

@Injectable()
export class LawsuitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detalhe do processo + suas comunicações (paginadas, mais recente primeiro).
   * Número inválido → 400; processo inexistente → 404.
   */
  async findByNumber(
    rawNumber: string,
    { page, pageSize }: LawsuitQuery,
  ): Promise<LawsuitDetailDto> {
    const number = normalizeCnj(rawNumber);
    if (!number) {
      throw new BadRequestException(
        'numero deve ser um número CNJ válido (20 dígitos).',
      );
    }

    const lawsuit = await this.prisma.lawsuit.findUnique({
      where: { number },
      select: { number: true, className: true, courtAcronym: true },
    });
    if (!lawsuit) throw new NotFoundException('Processo não encontrado.');

    const where = { lawsuitNumber: number };
    const [total, rows, recipients, finalJudgment] =
      await this.prisma.$transaction([
        this.prisma.communication.count({ where }),
        this.prisma.communication.findMany({
          where,
          select: communicationSelect,
          orderBy: [{ availabilityDate: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.recipient.findMany({
          where: { communication: where },
          select: { name: true },
          distinct: ['name'],
          orderBy: { name: 'asc' },
        }),
        // Considera todas as comunicações do processo, não só a página atual.
        this.prisma.$queryRaw<[{ found: boolean }]>`
          SELECT EXISTS (
            SELECT 1 FROM communications
            WHERE lawsuit_number = ${number}
              AND content ~* ${FINAL_JUDGMENT_SQL_PATTERN}
          ) AS found`,
      ]);

    return {
      lawsuit: {
        number: formatCnj(lawsuit.number),
        className: lawsuit.className,
        court: lawsuit.courtAcronym,
        recipients: recipients.map((r) => r.name),
        totalCommunications: total,
        finalJudgment: finalJudgment[0].found,
      },
      communications: rows.map((row) => ({
        ...toCommunicationDto(row),
        mentionsFinalJudgment: mentionsFinalJudgment(row.content),
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
