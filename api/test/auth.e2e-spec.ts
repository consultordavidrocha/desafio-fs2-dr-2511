import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';

describe('Autenticação (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const user = {
    name: 'Amélia Mascarenhas Macedo',
    email: 'amelia@exemplo.com',
    password: 'senhaSegura123',
  };

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const signUp = (body: object) =>
    request(app.getHttpServer()).post('/auth/cadastro').send(body);
  const login = (body: object) =>
    request(app.getHttpServer()).post('/auth/login').send(body);

  describe('POST /auth/cadastro', () => {
    it('cria a conta (201), normaliza o e-mail e não expõe a senha', async () => {
      const res = await signUp({ ...user, email: '  Amelia@Exemplo.COM ' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(String) as unknown,
        name: user.name,
        email: 'amelia@exemplo.com',
      });
    });

    it('guarda a senha com hash, nunca em texto puro', async () => {
      await signUp(user);
      const saved = await prisma.user.findUniqueOrThrow({
        where: { email: user.email },
      });

      expect(saved.passwordHash).not.toBe(user.password);
      expect(saved.passwordHash).toMatch(/^\$2[aby]\$/); // formato bcrypt
    });

    it('responde 409 para e-mail já cadastrado (sem diferenciar maiúsculas)', async () => {
      await signUp(user);
      const res = await signUp({ ...user, email: 'AMELIA@exemplo.com' });

      expect(res.status).toBe(409);
    });

    it.each([
      ['e-mail inválido', { ...user, email: 'email@' }],
      ['senha com menos de 8 caracteres', { ...user, password: '1234567' }],
      ['nome ausente', { email: user.email, password: user.password }],
      ['campo não previsto', { ...user, role: 'admin' }],
    ])('responde 400 para %s', async (_caso, body) => {
      const res = await signUp(body);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await signUp(user);
    });

    it('devolve 200 com { accessToken } para credenciais corretas', async () => {
      const res = await login({ email: user.email, password: user.password });

      expect(res.status).toBe(200);
      expect(Object.keys(res.body as object)).toEqual(['accessToken']);
      expect((res.body as { accessToken: string }).accessToken).toMatch(
        /^[\w-]+\.[\w-]+\.[\w-]+$/,
      );
    });

    it.each([
      ['senha errada', { email: user.email, password: 'senhaErrada99' }],
      [
        'e-mail inexistente',
        { email: 'nao@existe.com', password: user.password },
      ],
    ])('responde 401 com a mesma mensagem para %s', async (_caso, body) => {
      const res = await login(body);

      expect(res.status).toBe(401);
      expect((res.body as { message: string }).message).toMatch(
        /E-mail ou senha incorretos/,
      );
    });

    it('responde 400 para e-mail em formato inválido', async () => {
      const res = await login({ email: 'invalido', password: user.password });

      expect(res.status).toBe(400);
    });
  });

  describe('Rotas protegidas (GET /auth/me)', () => {
    it('responde 401 sem token', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');

      expect(res.status).toBe(401);
    });

    it('responde 401 com token inválido', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer token.invalido.123');

      expect(res.status).toBe(401);
    });

    it('devolve o usuário com token válido', async () => {
      await signUp(user);
      const { body } = (await login({
        email: user.email,
        password: user.password,
      })) as { body: { accessToken: string } };

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: user.name, email: user.email });
    });
  });
});
