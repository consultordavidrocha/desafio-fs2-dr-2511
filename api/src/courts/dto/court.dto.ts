import { ApiProperty } from '@nestjs/swagger';

export class CourtDto {
  @ApiProperty({ example: 'TJSP', description: 'Sigla do tribunal' })
  acronym!: string;

  @ApiProperty({ example: 'Tribunal de Justiça de São Paulo' })
  name!: string;
}
