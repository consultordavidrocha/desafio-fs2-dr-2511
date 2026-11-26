import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import type { CommunicationPageDto } from '../src/communications/dto/communication.dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { getAccessToken } from './support/auth-helper';
import { createTestApp } from './support/create-test-app';
import { clearCommunications, seedCommunications } from './support/fixtures';

describe('Comunicações e tribunais (e2e)', () => {
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

  /** GET /comunicacoes autenticado; devolve status e corpo tipado. */
  const list = async (query: Record<string, string | number> = {}) => {
    const res = await request(app.getHttpServer())
      .get('/comunicacoes')
      .query(query)
      .set('Authorization', `Bearer ${token}`);
    return { status: res.status, body: res.body as CommunicationPageDto };
  };
  const ids = (body: CommunicationPageDto) => body.data.map((c) => c.id);

  describe('GET /tribunais', () => {
    it('lista os tribunais em ordem de sigla', async () => {
      const res = await request(app.getHttpServer())
        .get('/tribunais')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { acronym: 'TJMS', name: 'Tribunal de Justiça de Mato Grosso do Sul' },
        { acronym: 'TJSP', name: 'Tribunal de Justiça de São Paulo' },
      ]);
    });

    it('responde 401 sem token', async () => {
      const res = await request(app.getHttpServer()).get('/tribunais');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /comunicacoes', () => {
    it('responde 401 sem token', async () => {
      const res = await request(app.getHttpServer()).get('/comunicacoes');
      expect(res.status).toBe(401);
    });

    it('ordena da mais recente para a mais antiga (id desempata o mesmo dia)', async () => {
      const { status, body } = await list();

      expect(status).toBe(200);
      expect(ids(body)).toEqual([5, 4, 3, 2, 1]);
      expect(body.meta).toEqual({
        page: 1,
        pageSize: 10,
        total: 5,
        totalPages: 1,
      });
    });

    it('devolve o item no formato público (número com máscara, data YYYY-MM-DD)', async () => {
      const { body } = await list({ pageSize: 1 });

      expect(body.data[0]).toEqual({
        id: 5,
        lawsuitNumber: '1234567-89.2024.8.26.0100',
        lawsuitClass: 'Procedimento comum',
        court: 'TJSP',
        availabilityDate: '2025-09-10',
        type: 'Intimação',
        documentType: null,
        courtUnit: null,
        content: 'Conteúdo de teste.',
        link: null,
        recipients: [{ name: 'Destinatário 5', side: 'P' }],
      });
    });

    it.each([
      ['com máscara', '1234567-89.2024.8.26.0100'],
      ['sem máscara', '12345678920248260100'],
    ])('filtra por número do processo %s', async (_caso, numeroProcesso) => {
      const { body } = await list({ numeroProcesso });

      expect(ids(body)).toEqual([5, 2, 1]);
    });

    it('filtra por tribunal (sem diferenciar maiúsculas)', async () => {
      const { body } = await list({ tribunal: 'tjms' });

      expect(ids(body)).toEqual([4, 3]);
    });

    it('filtra por período com limites inclusivos', async () => {
      const { body } = await list({
        dataInicio: '2025-08-15',
        dataFim: '2025-08-31',
      });

      expect(ids(body)).toEqual([4, 3, 2]);
    });

    it('aceita só dataInicio ou só dataFim', async () => {
      expect(ids((await list({ dataInicio: '2025-08-31' })).body)).toEqual([
        5, 4,
      ]);
      expect(ids((await list({ dataFim: '2025-08-01' })).body)).toEqual([1]);
    });

    it('combina filtros', async () => {
      const { body } = await list({
        tribunal: 'TJSP',
        dataInicio: '2025-08-10',
      });

      expect(ids(body)).toEqual([5, 2]);
    });

    it('pagina sem repetir nem pular itens', async () => {
      const p1 = await list({ page: 1, pageSize: 2 });
      const p2 = await list({ page: 2, pageSize: 2 });
      const p3 = await list({ page: 3, pageSize: 2 });

      expect([...ids(p1.body), ...ids(p2.body), ...ids(p3.body)]).toEqual([
        5, 4, 3, 2, 1,
      ]);
      expect(p3.body.meta).toEqual({
        page: 3,
        pageSize: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('devolve lista vazia (200) quando nada corresponde', async () => {
      const { status, body } = await list({ tribunal: 'TRF1' });

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('trata parâmetro vazio como ausente', async () => {
      const { status, body } = await list({ tribunal: '', numeroProcesso: '' });

      expect(status).toBe(200);
      expect(body.meta.total).toBe(5);
    });

    it('aceita pageSize = 50 (o máximo)', async () => {
      expect((await list({ pageSize: 50 })).status).toBe(200);
    });

    it.each([
      ['pageSize acima de 50', { pageSize: 51 }],
      ['pageSize zero', { pageSize: 0 }],
      ['page zero', { page: 0 }],
      // Auditoria: 1e20 passava no @IsInt e o Prisma devolvia 500.
      ['page gigante', { page: '99999999999999999999' }],
      ['page acima do teto', { page: 10_001 }],
      ['page não numérica', { page: 'abc' }],
      ['número de processo inválido', { numeroProcesso: '123' }],
      ['data em formato errado', { dataInicio: '15/08/2025' }],
      ['data inexistente', { dataFim: '2025-02-30' }],
      [
        'dataInicio depois de dataFim',
        { dataInicio: '2025-09-01', dataFim: '2025-08-01' },
      ],
      ['parâmetro desconhecido', { foo: 'bar' }],
    ])('responde 400 para %s', async (_caso, query) => {
      expect((await list(query)).status).toBe(400);
    });
  });

  describe('POST /comunicacoes/:id/resumo (bônus)', () => {
    const summarize = (id: string | number, auth = true) => {
      const req = request(app.getHttpServer()).post(
        `/comunicacoes/${id}/resumo`,
      );
      return auth ? req.set('Authorization', `Bearer ${token}`) : req;
    };

    it('devolve o resumo e os destaques (200)', async () => {
      const res = await summarize(1);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        highlights: [],
        summary: 'Conteúdo de teste.',
      });
    });

    it('responde 404 para comunicação inexistente', async () => {
      expect((await summarize(999999)).status).toBe(404);
    });

    it('responde 400 para id não numérico', async () => {
      expect((await summarize('abc')).status).toBe(400);
    });

    it('responde 401 sem token', async () => {
      expect((await summarize(1, false)).status).toBe(401);
    });
  });
});
