import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseDateOnly } from '../common/validators/is-date-only.validator';
import { PrismaService } from '../prisma/prisma.service';
import {
  communicationSelect,
  toCommunicationDto,
} from './communication.mapper';
import type { CommunicationPageDto } from './dto/communication.dto';
import type { ListCommunicationsQuery } from './dto/list-communications.query';

@Injectable()
export class CommunicationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista paginada, da comunicação mais recente para a mais antiga.
   * O `id` desempata comunicações do mesmo dia, deixando a paginação estável
   * (sem itens repetidos ou pulados entre uma página e outra).
   */
  async list(query: ListCommunicationsQuery): Promise<CommunicationPageDto> {
    const where = this.buildWhere(query);
    const { page, pageSize } = query;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.communication.count({ where }),
      this.prisma.communication.findMany({
        where,
        select: communicationSelect,
        orderBy: [{ availabilityDate: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: rows.map(toCommunicationDto),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private buildWhere(
    query: ListCommunicationsQuery,
  ): Prisma.CommunicationWhereInput {
    const { numeroProcesso, tribunal, dataInicio, dataFim } = query;
    if (dataInicio && dataFim && dataInicio > dataFim) {
      throw new BadRequestException(
        'dataInicio deve ser anterior ou igual a dataFim.',
      );
    }

    // Datas já validadas pelo DTO; a coluna é DATE, então gte/lte com
    // meia-noite UTC tornam os dois limites inclusivos.
    const availabilityDate =
      dataInicio || dataFim
        ? {
            ...(dataInicio && { gte: parseDateOnly(dataInicio)! }),
            ...(dataFim && { lte: parseDateOnly(dataFim)! }),
          }
        : undefined;

    return {
      lawsuitNumber: numeroProcesso,
      courtAcronym: tribunal,
      availabilityDate,
    };
  }
}
