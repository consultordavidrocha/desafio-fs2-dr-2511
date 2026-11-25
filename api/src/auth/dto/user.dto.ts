import { ApiProperty } from '@nestjs/swagger';

/** Usuário exposto pela API (nunca inclui o hash da senha). */
export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Amélia Mascarenhas Macedo' })
  name!: string;

  @ApiProperty({ example: 'amelia@exemplo.com' })
  email!: string;
}
