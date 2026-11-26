import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import type { LawsuitDetailDto } from '../src/lawsuits/dto/lawsuit.dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { getAccessToken } from './support/auth-helper';
import { createTestApp } from './support/create-test-app';
import {
  clearCommunications,
  LAWSUIT_MS,
  LAWSUIT_SP,
  seedCommunications,
} from './support/fixtures';

describe('GET /processos/:numero (e2e, bônus)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await prisma.user.deleteMany();
    await seedCommunications(prisma);
    token = await getAccessToken(app);
  });

  afterAll(async () => {
    await clearCommunications(prisma);
    await app.close();
  });

  const get = async (numero: string, query: Record<string, number> = {}) => {
    const res = await request(app.getHttpServer())
      .get(`/processos/${encodeURIComponent(numero)}`)
      .query(query)
      .set('Authorization', `Bearer ${token}`);
    return { status: res.status, body: res.body as LawsuitDetailDto };
  };

  it('devolve o processo com as comunicações, mais recente primeiro', async () => {
    const { status, body } = await get(LAWSUIT_SP);

    expect(status).toBe(200);
    expect(body.lawsuit).toEqual({
      number: '1234567-89.2024.8.26.0100',
      className: 'Procedimento comum',
      court: 'TJSP',
      recipients: ['Destinatário 1', 'Destinatário 2', 'Destinatário 5'],
      totalCommunications: 3,
      finalJudgment: false,
    });
    expect(body.communications.map((c) => c.id)).toEqual([5, 2, 1]);
  });

  it('aceita o número com máscara', async () => {
    expect((await get('1234567-89.2024.8.26.0100')).status).toBe(200);
  });

  it('identifica trânsito em julgado no processo e na movimentação', async () => {
    const { body } = await get(LAWSUIT_MS);

    expect(body.lawsuit.finalJudgment).toBe(true);
    expect(
      body.communications.map((c) => [c.id, c.mentionsFinalJudgment]),
    ).toEqual([
      [4, false],
      [3, true],
    ]);
  });

  it('detecta o trânsito mesmo fora da página atual', async () => {
    const { body } = await get(LAWSUIT_MS, { page: 1, pageSize: 1 });

    expect(body.communications.map((c) => c.id)).toEqual([4]);
    expect(body.lawsuit.finalJudgment).toBe(true);
    expect(body.meta).toEqual({
      page: 1,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    });
  });

  it('responde 404 para processo inexistente', async () => {
    expect((await get('99999999999999999999')).status).toBe(404);
  });

  it('responde 400 para número inválido ou pageSize acima de 50', async () => {
    expect((await get('123')).status).toBe(400);
    expect((await get(LAWSUIT_SP, { pageSize: 51 })).status).toBe(400);
  });

  it('responde 401 sem token', async () => {
    const res = await request(app.getHttpServer()).get(
      `/processos/${LAWSUIT_SP}`,
    );
    expect(res.status).toBe(401);
  });
});
