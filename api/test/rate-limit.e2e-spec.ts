import { INestApplication } from '@nestjs/common';
import { getOptionsToken } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './support/create-test-app';

/**
 * Rate limit de login e cadastro. As outras suítes rodam com limite alto
 * (AUTH_RATE_LIMIT no .env.test); aqui as opções do throttler são substituídas
 * por um limite baixo só neste módulo de teste.
 */
describe('Rate limit de autenticação (e2e)', () => {
  const LIMIT = 3;
  let app: INestApplication<App>;

  beforeAll(async () => {
    ({ app } = await createTestApp((builder) =>
      builder.overrideProvider(getOptionsToken()).useValue({
        errorMessage:
          'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.',
        throttlers: [{ name: 'auth', ttl: 60_000, limit: LIMIT }],
      }),
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  const login = () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ninguem@exemplo.com', password: 'qualquer123' });

  it(`bloqueia com 429 a partir da tentativa ${LIMIT + 1} no mesmo minuto`, async () => {
    for (let i = 0; i < LIMIT; i++) {
      expect((await login()).status).toBe(401);
    }

    const blocked = await login();
    expect(blocked.status).toBe(429);
    expect((blocked.body as { message: string }).message).toMatch(
      /Muitas tentativas/,
    );
  });

  /**
   * Como a requisição chega em produção: IP real à esquerda dos proxies internos
   * do Render (medido na auditoria de 26/11).
   */
  const loginVia = (forwardedFor: string) =>
    login().set('X-Forwarded-For', forwardedFor);
  const viaRender = (clientIp: string, internalHop = '10.0.0.7') =>
    `${clientIp}, 172.16.5.4, ${internalHop}`;

  it('conta por cliente real, não pelo balanceador interno do Render', async () => {
    const a = '203.0.113.10';
    const b = '203.0.113.20';
    for (let i = 0; i < LIMIT; i++) {
      expect((await loginVia(viaRender(a))).status).toBe(401);
    }
    expect((await loginVia(viaRender(a))).status).toBe(429);

    // Mesmo caminho interno, outro usuário: tem o próprio limite.
    expect((await loginVia(viaRender(b))).status).toBe(401);
    // Outro balanceador interno não "zera" o limite de quem já foi bloqueado.
    expect((await loginVia(viaRender(a, '10.9.9.9'))).status).toBe(429);
  });

  it('ignora IP inventado pelo cliente no X-Forwarded-For', async () => {
    const real = '198.51.100.30';
    for (let i = 0; i < LIMIT; i++) {
      expect((await loginVia(viaRender(real))).status).toBe(401);
    }
    // O cliente acrescenta um IP falso: ele fica à esquerda do real e não conta.
    expect((await loginVia(`192.0.2.99, ${viaRender(real)}`)).status).toBe(429);
  });

  it('não limita as demais rotas (ex.: /health, /auth/me)', async () => {
    for (let i = 0; i < LIMIT + 2; i++) {
      expect((await request(app.getHttpServer()).get('/health')).status).toBe(
        200,
      );
    }
    // /auth/me sem token responde 401 (guard JWT), não 429.
    expect((await request(app.getHttpServer()).get('/auth/me')).status).toBe(
      401,
    );
  });
});
