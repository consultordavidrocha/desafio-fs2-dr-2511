import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  emptyToUndefined,
  toCnjDigits,
  toUpperTrimmed,
} from '../../common/transformers';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
/**
 * Teto da página: sem ele, `page=99999999999999999999` passava no @IsInt (1e20 é
 * "inteiro" para o JavaScript) e o Prisma recusava o offset com 500. Achado na
 * auditoria de segurança; 10 mil páginas dão folga para qualquer volume realista.
 */
export const MAX_PAGE = 10_000;

/**
 * Query string de GET /comunicacoes.
 *
 * Exceção à convenção de nomes em inglês: as propriedades precisam ter
 * exatamente os nomes dos parâmetros fixados pelo contrato do case.
 */
export class ListCommunicationsQuery {
  @ApiPropertyOptional({
    description: 'Número CNJ, com ou sem máscara',
    example: '1234567-89.2024.8.26.0100',
  })
  @IsOptional()
  @IsString()
  @Transform(toCnjDigits)
  @Matches(/^\d{20}$/, {
    message: 'numeroProcesso deve ser um número CNJ válido (20 dígitos).',
  })
  numeroProcesso?: string;

  @ApiPropertyOptional({ description: 'Sigla do tribunal', example: 'TJSP' })
  @IsOptional()
  @Transform(toUpperTrimmed)
  @Matches(/^[A-Z0-9]{2,20}$/, {
    message: 'tribunal deve ser uma sigla válida (ex.: TJSP).',
  })
  tribunal?: string;

  @ApiPropertyOptional({
    description: 'Data inicial (inclusiva), YYYY-MM-DD',
    example: '2025-08-01',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateOnly()
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data final (inclusiva), YYYY-MM-DD',
    example: '2025-08-31',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateOnly()
  dataFim?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: MAX_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro.' })
  @Min(1, { message: 'page deve ser maior ou igual a 1.' })
  @Max(MAX_PAGE, { message: `page deve ser no máximo ${MAX_PAGE}.` })
  page: number = 1;

  @ApiPropertyOptional({
    default: DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize deve ser um número inteiro.' })
  @Min(1, { message: 'pageSize deve ser maior ou igual a 1.' })
  @Max(MAX_PAGE_SIZE, {
    message: `pageSize deve ser no máximo ${MAX_PAGE_SIZE}.`,
  })
  pageSize: number = DEFAULT_PAGE_SIZE;
}
