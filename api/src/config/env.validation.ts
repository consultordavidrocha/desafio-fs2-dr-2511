import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

/** Variáveis de ambiente da API. A aplicação não sobe se faltar algo obrigatório. */
class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET deve ter pelo menos 32 caracteres.' })
  JWT_SECRET!: string;

  /** Validade do token, no formato do jsonwebtoken (ex.: "1d", "8h"). Padrão: 1d. */
  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  /** Origens liberadas no CORS, separadas por vírgula. Vazio = qualquer origem. */
  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsInt()
  PORT?: number;

  /** Tentativas de login/cadastro por IP a cada minuto. Padrão: 5. */
  @IsOptional()
  @IsInt()
  AUTH_RATE_LIMIT?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env);
  if (errors.length) {
    throw new Error(`Variáveis de ambiente inválidas:\n${errors.toString()}`);
  }
  return env;
}
