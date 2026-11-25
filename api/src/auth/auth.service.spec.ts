import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth.service';
import type { JwtPayload } from './jwt-payload';

/** Testes unitários: o Prisma é simulado; o JwtService é o real. */
describe('AuthService', () => {
  const jwt = new JwtService({
    secret: 'segredo-de-teste-com-32-caracteres!!',
  });
  const prisma = {
    user: { create: jest.fn(), findUnique: jest.fn() },
  };
  const service = new AuthService(prisma as unknown as PrismaService, jwt);

  beforeEach(() => jest.resetAllMocks());

  describe('signUp', () => {
    it('grava o hash da senha, não a senha', async () => {
      prisma.user.create.mockResolvedValue({
        id: '1',
        name: 'A',
        email: 'a@a.com',
      });

      await service.signUp({
        name: 'A',
        email: 'a@a.com',
        password: 'senha1234',
      });

      const [[args]] = prisma.user.create.mock.calls as [
        [{ data: { passwordHash: string } }],
      ];
      const { data } = args;
      expect(data).not.toHaveProperty('password');
      await expect(
        bcrypt.compare('senha1234', data.passwordHash),
      ).resolves.toBe(true);
    });

    it('converte violação de unicidade (P2002) em 409', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.signUp({ name: 'A', email: 'a@a.com', password: 'senha1234' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('emite um JWT com id, nome e e-mail do usuário', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Amélia',
        email: 'a@a.com',
        passwordHash: await bcrypt.hash('senha1234', 4),
      });

      const { accessToken } = await service.login({
        email: 'a@a.com',
        password: 'senha1234',
      });

      const payload = await jwt.verifyAsync<JwtPayload>(accessToken);
      expect(payload).toMatchObject({
        sub: 'u1',
        name: 'Amélia',
        email: 'a@a.com',
      });
    });

    it('rejeita usuário inexistente com a mensagem genérica', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', password: 'qualquer123' }),
      ).rejects.toThrow(new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE));
    });
  });
});
