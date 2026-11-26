import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Configuração compartilhada entre main.ts e os testes e2e, para os testes
 * exercitarem exatamente o mesmo pipeline (validação e cabeçalhos) da produção.
 */
export function setupApp(app: INestApplication): void {
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
