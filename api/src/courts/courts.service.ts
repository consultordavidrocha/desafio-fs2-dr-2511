import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CourtDto } from './dto/court.dto';

@Injectable()
export class CourtsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Todos os tribunais, em ordem alfabética de sigla (alimenta o filtro do front). */
  findAll(): Promise<CourtDto[]> {
    return this.prisma.court.findMany({
      select: { acronym: true, name: true },
      orderBy: { acronym: 'asc' },
    });
  }
}
