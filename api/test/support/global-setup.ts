import { execSync } from 'node:child_process';
import './load-test-env';

/** Roda uma vez antes da suíte e2e: aplica as migrations no banco de teste. */
export default function globalSetup(): void {
  if (!process.env.DATABASE_URL?.includes('_test')) {
    throw new Error(
      'DATABASE_URL dos testes e2e precisa apontar para um banco *_test.',
    );
  }
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
