import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, LoginResponseDto } from './dto/login.dto';
import type { SignUpDto } from './dto/sign-up.dto';
import type { UserDto } from './dto/user.dto';
import type { JwtPayload } from './jwt-payload';

/** Custo do bcrypt: ~100 ms por hash em hardware comum. */
export const BCRYPT_ROUNDS = 10;

/** Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem. */
export const INVALID_CREDENTIALS_MESSAGE =
  'E-mail ou senha incorretos. Verifique os dados e tente novamente.';

/**
 * Hash usado quando o e-mail não existe, para o login levar o mesmo tempo
 * nos dois casos (mitiga enumeração de usuários pelo tempo de resposta).
 */
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Cria a conta. E-mail duplicado → 409. */
  async signUp(dto: SignUpDto): Promise<UserDto> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      return await this.prisma.user.create({
        data: { name: dto.name, email: dto.email, passwordHash },
        select: { id: true, name: true, email: true },
      });
    } catch (error) {
      // Confia na constraint única do banco em vez de "consultar e depois
      // inserir": assim não há corrida entre dois cadastros simultâneos.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }
  }

  /** Valida as credenciais e emite o access token. Falha → 401. */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const valid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !valid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
    };
    return { accessToken: await this.jwt.signAsync(payload) };
  }
}
