import type { PrismaService } from '../../src/prisma/prisma.service';

/** Números CNJ (só dígitos) usados nas fixtures. */
export const LAWSUIT_SP = '12345678920248260100';
export const LAWSUIT_MS = '76543210120258120001';

/**
 * Massa de dados pequena e controlada para os testes de filtro:
 * 5 comunicações em 2 tribunais, com duas no mesmo dia (testa o desempate por id).
 */
export async function seedCommunications(prisma: PrismaService) {
  await clearCommunications(prisma);

  await prisma.court.createMany({
    data: [
      { acronym: 'TJSP', name: 'Tribunal de Justiça de São Paulo' },
      { acronym: 'TJMS', name: 'Tribunal de Justiça de Mato Grosso do Sul' },
    ],
  });
  await prisma.lawsuit.createMany({
    data: [
      {
        number: LAWSUIT_SP,
        className: 'Procedimento comum',
        courtAcronym: 'TJSP',
      },
      {
        number: LAWSUIT_MS,
        className: 'Execução fiscal',
        courtAcronym: 'TJMS',
      },
    ],
  });

  const base = { type: 'Intimação', content: 'Conteúdo de teste.' };
  const rows = [
    {
      id: 1,
      lawsuitNumber: LAWSUIT_SP,
      courtAcronym: 'TJSP',
      date: '2025-08-01',
    },
    {
      id: 2,
      lawsuitNumber: LAWSUIT_SP,
      courtAcronym: 'TJSP',
      date: '2025-08-15',
    },
    {
      id: 3,
      lawsuitNumber: LAWSUIT_MS,
      courtAcronym: 'TJMS',
      date: '2025-08-15',
    },
    {
      id: 4,
      lawsuitNumber: LAWSUIT_MS,
      courtAcronym: 'TJMS',
      date: '2025-08-31',
    },
    {
      id: 5,
      lawsuitNumber: LAWSUIT_SP,
      courtAcronym: 'TJSP',
      date: '2025-09-10',
    },
  ];
  for (const { date, ...row } of rows) {
    await prisma.communication.create({
      data: {
        ...base,
        ...row,
        availabilityDate: new Date(`${date}T00:00:00.000Z`),
        recipients: { create: [{ name: `Destinatário ${row.id}`, side: 'P' }] },
      },
    });
  }
}

export async function clearCommunications(prisma: PrismaService) {
  await prisma.recipient.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.lawsuit.deleteMany();
  await prisma.court.deleteMany();
}
