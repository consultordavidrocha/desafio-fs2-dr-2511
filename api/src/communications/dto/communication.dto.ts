import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipientDto {
  @ApiProperty({ example: 'Amélia Mascarenhas Macedo' })
  name!: string;

  @ApiPropertyOptional({
    example: 'A',
    nullable: true,
    description: 'Polo processual',
  })
  side!: string | null;
}

export class CommunicationDto {
  @ApiProperty({ example: 123456 })
  id!: number;

  @ApiProperty({
    example: '1234567-89.2024.8.26.0100',
    description: 'Número CNJ com máscara',
  })
  lawsuitNumber!: string;

  @ApiPropertyOptional({ example: 'Procedimento comum', nullable: true })
  lawsuitClass!: string | null;

  @ApiProperty({ example: 'TJSP', description: 'Sigla do tribunal' })
  court!: string;

  @ApiProperty({
    example: '2025-08-15',
    description: 'Data de disponibilização (YYYY-MM-DD)',
  })
  availabilityDate!: string;

  @ApiProperty({ example: 'Intimação' })
  type!: string;

  @ApiPropertyOptional({ example: 'Despacho', nullable: true })
  documentType!: string | null;

  @ApiPropertyOptional({ example: '1ª Vara Cível de Campinas', nullable: true })
  courtUnit!: string | null;

  @ApiProperty({ description: 'Texto integral da comunicação' })
  content!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Link para o documento' })
  link!: string | null;

  @ApiProperty({ type: RecipientDto, isArray: true })
  recipients!: RecipientDto[];
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  pageSize!: number;

  @ApiProperty({ example: 42, description: 'Total de itens com os filtros' })
  total!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}

export class CommunicationPageDto {
  @ApiProperty({ type: CommunicationDto, isArray: true })
  data!: CommunicationDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
