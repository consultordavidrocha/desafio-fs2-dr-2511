import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CommunicationsModule } from './communications/communications.module';
import { CourtsModule } from './courts/courts.module';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { LawsuitsModule } from './lawsuits/lawsuits.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    AuthModule,
    CourtsModule,
    CommunicationsModule,
    LawsuitsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
