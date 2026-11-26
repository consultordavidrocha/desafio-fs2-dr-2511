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
