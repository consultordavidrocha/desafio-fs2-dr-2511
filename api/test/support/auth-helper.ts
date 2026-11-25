import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

/** Cria um usuário (se ainda não existir) e devolve um access token válido. */
export async function getAccessToken(
  app: INestApplication<App>,
): Promise<string> {
  const credentials = {
    email: 'teste@exemplo.com',
    password: 'senhaSegura123',
  };
  await request(app.getHttpServer())
    .post('/auth/cadastro')
    .send({ name: 'Usuário Teste', ...credentials });

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send(credentials);
  return (res.body as { accessToken: string }).accessToken;
}
