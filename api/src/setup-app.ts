import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Application } from 'express';
import helmet from 'helmet';

/**
 * Quais saltos do X-Forwarded-For são proxies nossos: loopback e rede privada.
 * Medido em produção (auditoria 26/11): a requisição chega como
 * `IP real, 172.x, 10.x` e o socket é `::1`. Com `trust proxy: 1` o Express
 * pegava o 10.x, um balanceador interno do Render que muda entre requisições:
 * o rate limit contava por balanceador, não por usuário. Confiando só nos
 * endereços internos, o Express pula esses saltos e para no primeiro IP público
 * (o real, gravado pela Cloudflare). O que o cliente inventar no cabeçalho fica
 * à esquerda dele e é ignorado. Não depende de quantos proxies o Render usa.
 */
export const TRUSTED_PROXIES = 'loopback, uniquelocal';

/**
 * Configuração compartilhada entre main.ts e os testes e2e, para os testes
 * exercitarem exatamente o mesmo pipeline (validação e cabeçalhos) da produção.
 */
export function setupApp(app: INestApplication): void {
  const express = app.getHttpAdapter().getInstance() as Application;
  express.set('trust proxy', TRUSTED_PROXIES);

  // Cabeçalhos de segurança (auditoria): remove o x-powered-by e envia nosniff,
  // anti-frame, HSTS, Referrer-Policy e uma CSP restrita. A API só devolve JSON;
  // a CSP vale para a única página HTML, o Swagger em /docs, que só carrega
  // arquivos do próprio servidor.
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos não declarados nos DTOs...
      forbidNonWhitelisted: true, // ...e responde 400 se vierem
      transform: true, // converte query strings para os tipos dos DTOs
    }),
  );
}
