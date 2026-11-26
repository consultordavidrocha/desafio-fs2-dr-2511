import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { setupApp } from '../../src/setup-app';

/**
 * Sobe a aplicação completa (mesmo pipeline do main.ts) para os testes e2e.
 * `configure` permite sobrescrever providers num teste específico
 * (ex.: um limite de rate limit baixo), sem afetar as outras suítes.
 */
export async function createTestApp(
  configure: (builder: TestingModuleBuilder) => TestingModuleBuilder = (b) => b,
): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await configure(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();

  const app = moduleRef.createNestApplication();
  setupApp(app);
  await app.init();

  return { app, prisma: app.get(PrismaService) };
}
