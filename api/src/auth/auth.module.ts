import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    // Rate limit das rotas públicas de autenticação (força bruta / cadastro em massa).
    // Contagem em memória: suficiente para uma instância; com várias réplicas,
    // trocar o storage por Redis para o limite valer entre elas.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        errorMessage:
          'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.',
        throttlers: [
          {
            name: 'auth',
            ttl: 60_000, // janela de 1 minuto
            limit: config.get<number>('AUTH_RATE_LIMIT', 5),
          },
        ],
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '1d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Guard global: as rotas nascem protegidas ("secure by default");
    // as públicas precisam declarar @Public() explicitamente.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
