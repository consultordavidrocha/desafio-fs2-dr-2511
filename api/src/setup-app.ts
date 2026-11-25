import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Configuração compartilhada entre main.ts e os testes e2e, para os testes
 * exercitarem exatamente o mesmo pipeline de validação da produção.
 */
export function setupApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos não declarados nos DTOs...
      forbidNonWhitelisted: true, // ...e responde 400 se vierem
      transform: true, // converte query strings para os tipos dos DTOs
    }),
  );
}
