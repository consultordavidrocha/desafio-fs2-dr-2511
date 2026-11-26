import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  CommunicationDto,
  PaginationMetaDto,
} from '../../communications/dto/communication.dto';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../communications/dto/list-communications.query';

/** Query de GET /processos/:numero: mesma paginação de /comunicacoes. */
export class LawsuitQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro.' })
  @Min(1, { message: 'page deve ser maior ou igual a 1.' })
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

export class LawsuitCommunicationDto extends CommunicationDto {
  @ApiProperty({
    description: 'O texto menciona trânsito em julgado',
    example: false,
  })
  mentionsFinalJudgment!: boolean;
}

export class LawsuitDto {
  @ApiProperty({ example: '1234567-89.2024.8.26.0100' })
  number!: string;

  @ApiPropertyOptional({ example: 'Procedimento comum', nullable: true })
  className!: string | null;

  @ApiProperty({ example: 'TJSP' })
  court!: string;

  @ApiProperty({
    example: ['Amélia Mascarenhas Macedo', 'Paula Silva Santos'],
    description: 'Destinatários de todas as comunicações, sem repetição',
  })
  recipients!: string[];

  @ApiProperty({
    example: 3,
    description: 'Quantidade de comunicações (atualizações)',
  })
  totalCommunications!: number;

  @ApiProperty({
    description: 'Alguma comunicação do processo menciona trânsito em julgado',
  })
  finalJudgment!: boolean;
}

export class LawsuitDetailDto {
  @ApiProperty({ type: LawsuitDto })
  lawsuit!: LawsuitDto;

  @ApiProperty({ type: LawsuitCommunicationDto, isArray: true })
  communications!: LawsuitCommunicationDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
