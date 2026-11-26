import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../../auth/auth.service';

/**
 * Conta de demonstração para o avaliador entrar sem se cadastrar
 * (o template do README pede um "usuário de teste").
 *
 * Os dados do case são fictícios, então uma credencial conhecida não expõe nada
 * real. Ainda assim é configurável e pode ser desligada: SEED_DEMO_USER=false.
 */
export const DEMO_USER = {
  name: 'Usuário Demonstração',
  email: process.env.DEMO_USER_EMAIL ?? 'demo@exemplo.com',
  password: process.env.DEMO_USER_PASSWORD ?? 'demo12345',
};

export async function seedDemoUser(
  prisma: PrismaClient,
): Promise<string | null> {
  if (process.env.SEED_DEMO_USER === 'false') return null;

  const email = DEMO_USER.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(DEMO_USER.password, BCRYPT_ROUNDS);
  // upsert: idempotente e mantém a senha igual à configurada.
  await prisma.user.upsert({
    where: { email },
    create: { name: DEMO_USER.name, email, passwordHash },
    update: { name: DEMO_USER.name, passwordHash },
  });
  return email;
}
