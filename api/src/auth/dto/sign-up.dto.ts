import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { normalizeEmail, trim } from '../../common/transformers';

/** Body de POST /auth/cadastro. Mensagens em pt-BR: o front as exibe ao usuário. */
export class SignUpDto {
  @ApiProperty({ example: 'Amélia Mascarenhas Macedo', maxLength: 120 })
  @Transform(trim)
  @IsString({ message: 'Informe o nome completo.' })
  @MinLength(2, { message: 'Informe o nome completo.' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres.' })
  name!: string;

  @ApiProperty({ example: 'amelia@exemplo.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(254, { message: 'Informe um e-mail válido.' })
  email!: string;

  @ApiProperty({ example: 'senhaSegura123', minLength: 8, maxLength: 72 })
  @IsString({ message: 'A senha deve ter no mínimo 8 caracteres.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  // O bcrypt só considera os primeiros 72 bytes; acima disso, rejeitamos
  // para não aceitar silenciosamente uma senha "truncada".
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  password!: string;
}
