import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';

describe('Saúde da API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health confere API e banco, sem token', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /live responde sem token e SEM consultar o banco', async () => {
    const spy = jest.spyOn(prisma, '$queryRaw');

    const res = await request(app.getHttpServer()).get('/live');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(spy).not.toHaveBeenCalled(); // o keep-alive não pode acordar o Neon
    spy.mockRestore();
  });

  it('envia cabeçalhos de segurança e esconde o x-powered-by (auditoria)', async () => {
    const res = await request(app.getHttpServer()).get('/live');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['strict-transport-security']).toContain('max-age=');
    expect(res.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
  });
});
